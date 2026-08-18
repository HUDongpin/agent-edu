/**
 * The one place the browser talks to a model.
 *
 * Runs client-side with the reader's own key, held in sessionStorage and
 * erased when the tab closes. There is no server in this app, so there is
 * nowhere else the key could go — which is the honest version of "your key
 * is safe", rather than a promise you have to take on trust.
 */

const KEY = "ae.ds.key";
const ENDPOINT = "https://api.deepseek.com/chat/completions";

/* deepseek-v4-flash, USD per 1M tokens, off-peak. Peak (01:00-04:00 and
   06:00-10:00 UTC) is double. Checked 2026-08-18. */
const PRICE_IN = 0.22;
const PRICE_OUT = 0.66;

export type Model = "deepseek-v4-flash" | "deepseek-v4-pro";

export const spend = { in: 0, out: 0, calls: 0 };

export function getKey(): string {
  try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; }
}

/* Whether a key is saved is browser-only state, and React has to be told when
   it changes. Subscribing to it beats reading it in an effect: an effect can
   only run after a first render that already claimed there was no key. */
const watchers = new Set<() => void>();
export function subscribeKey(fn: () => void): () => void {
  watchers.add(fn);
  return () => { watchers.delete(fn); };
}
export function hasKey(): boolean { return getKey() !== ""; }
/** On the server there is no session storage, and so never a key. */
export function hasKeyOnServer(): boolean { return false; }

export function setKey(v: string): void {
  try {
    if (v) sessionStorage.setItem(KEY, v);
    else sessionStorage.removeItem(KEY);
  } catch { /* private mode */ }
  for (const fn of watchers) fn();
}
export function usd(): number {
  return (spend.in * PRICE_IN + spend.out * PRICE_OUT) / 1e6;
}
export function resetSpend(): void {
  spend.in = 0; spend.out = 0; spend.calls = 0;
}

export interface Msg { role: "system" | "user" | "assistant"; content: string }

/** Thrown before any request when the reader has not saved a key yet. */
export const NO_KEY = "ae:no-key";

/**
 * Turn whatever came back into one of a handful of message keys.
 *
 * Providers answer failures in their own words — "Authentication Fails",
 * "Insufficient Balance", a bare HTTP 429 — and none of that tells a reader
 * who has never written code what to actually do. Every branch here maps to
 * a sentence that names the next action.
 */
export function errorKey(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.toLowerCase();
  if (raw === NO_KEY || m.includes("no key")) return "lab.err.noKey";
  if (m.includes("401") || m.includes("auth") || m.includes("invalid api key")) return "lab.err.badKey";
  if (m.includes("402") || m.includes("balance") || m.includes("quota") || m.includes("credit")) return "lab.err.noCredit";
  if (m.includes("429") || m.includes("rate limit") || m.includes("busy") || m.includes("503")) return "lab.err.busy";
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("load failed")) return "lab.err.network";
  return "lab.err.generic";
}

export async function call(
  messages: Msg[],
  { json = false, max = 900, model = "deepseek-v4-flash" as Model } = {},
): Promise<string> {
  const key = getKey();
  if (!key) throw new Error(NO_KEY);

  const body: Record<string, unknown> = {
    model,
    max_tokens: max,
    messages,
    // Left on, a reasoning model spends the whole budget thinking and returns
    // an empty string with no error. Off is cheaper and predictable.
    thinking: { type: "disabled" },
  };
  if (json) body.response_format = { type: "json_object" };

  /* One retry, and only for transport failures. A dropped connection is not
     a bad prompt, and scoring it as one would quietly corrupt an eval — but
     a 400 or 401 is a real failure and must not be retried away. */
  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
      });
      break;
    } catch (netErr) {
      if (attempt) throw new Error(`network failed twice: ${(netErr as Error).message}`);
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  const j = await res!.json().catch(() => null);
  if (!res!.ok || !j) throw new Error(j?.error?.message || `HTTP ${res!.status}`);

  const u = j.usage ?? {};
  spend.in += u.prompt_tokens ?? 0;
  spend.out += u.completion_tokens ?? 0;
  spend.calls++;

  const text: string = j.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("empty answer came back — try again");
  return text;
}

/** Pull an object out of a reply that was asked for JSON. */
export function asJSON<T = unknown>(text: string): T {
  let t = text.trim().replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  if (!t.startsWith("{")) {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error(`expected JSON, got prose: ${t.slice(0, 90)}`);
    t = t.slice(a, b + 1);
  }
  return JSON.parse(t) as T;
}

/** Run tasks with a small concurrency cap — 28 sequential calls is a long wait. */
export async function pool<T, R>(items: T[], n: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}
