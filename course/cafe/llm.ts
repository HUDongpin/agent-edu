/**
 * The one place this course talks to a model.
 *
 * Everything else imports from here. Three reasons:
 *
 * 1.  When the SDK or a model id changes, exactly one file needs editing.
 * 2.  It gives us a seam for --offline, so someone without an API key can
 *     still run all nine stages.
 * 3.  It gives us a seam for *which vendor*. This course runs on DeepSeek or
 *     on Anthropic's Claude, and not one line of any stage changes between
 *     them. Swapping the model underneath your system without rewriting the
 *     system is a real thing you will want to do, and the only reason it is
 *     cheap here is that every call goes through this file.
 *
 * Read this file. It is the whole "how do I call a model" answer that the
 * rest of the course takes for granted.
 *
 *     export DEEPSEEK_API_KEY=sk-...        # then just run any stage
 *     export ANTHROPIC_API_KEY=sk-ant-...   # or this one
 *     export CAFE_PROVIDER=deepseek         # only needed if you have both
 */

import Anthropic from "@anthropic-ai/sdk";
import { DEEPSEEK_PRICING, priceBandAt } from "../../lib/byok/pricing";
import { createOfflineClient, offlineText } from "./offline";
import { priceDeepSeekCourseUsage } from "./pricing";

/* ---------------------------------------------------------------------------
 * Providers
 * ---------------------------------------------------------------------------
 * DeepSeek publishes an Anthropic-compatible endpoint, so the official SDK
 * drives it with nothing but a different baseURL. That is why stages 5 and 6
 * — which build raw tool_use / tool_result blocks by hand — work unchanged on
 * both. The differences that remain are listed in `quirks`, and every one of
 * them is handled in this file.
 */

interface Provider {
  label: string;
  env: string;
  baseURL?: string;
  model: string;
  prices?: { in: number; out: number; cachedIn: number };
  quirks: { jsonSchema: boolean };
  help: string;
}

export const PROVIDERS: Record<string, Provider> = {
  anthropic: {
    label: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    model: "claude-opus-5",
    prices: { in: 5.0, out: 25.0, cachedIn: 0.5 },
    quirks: { jsonSchema: true },
    help: "https://console.anthropic.com/settings/keys",
  },
  deepseek: {
    label: "DeepSeek",
    env: "DEEPSEEK_API_KEY",
    baseURL: "https://api.deepseek.com/anthropic",
    model: "deepseek-v4-flash",
    // Flash and Pro pricing come from lib/byok/pricing.ts, the same dated
    // source used by the browser Lab. Keeping one snapshot prevents the CLI
    // from silently pricing a CAFE_MODEL=deepseek-v4-pro run as Flash.
    // json_schema is ACCEPTED AND SILENTLY IGNORED by DeepSeek — you get
    // prose back and JSON.parse explodes. So we fall back to asking in the
    // prompt and validating ourselves. See schemaFallback().
    quirks: { jsonSchema: false },
    help: "https://platform.deepseek.com/api_keys",
  },
};

function pickProvider(): string {
  const chosen = (process.env.CAFE_PROVIDER ?? "").trim().toLowerCase();
  if (chosen) {
    if (!PROVIDERS[chosen]) {
      throw new Error(`\n  CAFE_PROVIDER="${chosen}" is not one of: ${Object.keys(PROVIDERS).join(", ")}\n`);
    }
    return chosen;
  }
  for (const [name, cfg] of Object.entries(PROVIDERS)) {
    if (process.env[cfg.env]) return name;
  }
  return "deepseek"; // nothing set: the cheaper default, so preflight points
                     // a new learner at the smaller bill
}

export const PROVIDER = pickProvider();
const CFG = PROVIDERS[PROVIDER];

/** One line to change for a different model; CAFE_MODEL overrides without editing. */
export const MODEL = process.env.CAFE_MODEL || CFG.model;

/**
 * Effort: low | medium | high | xhigh | max. The course defaults to "low"
 * because these are small, well-specified tasks and you pay per token. Raise
 * it and watch the eval score in stage 3 — that is the point of having one.
 *
 * On DeepSeek "low" maps to thinking mode OFF, the same intent in that
 * vendor's vocabulary.
 */
export const EFFORT = process.env.CAFE_EFFORT || "low";

/** --offline anywhere on the command line uses the deterministic local stand-in. */
export const OFFLINE = process.argv.includes("--offline");

const spent = { in: 0, out: 0, cached: 0, calls: 0 };
let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    client = OFFLINE
      ? createOfflineClient() as unknown as Anthropic
      : new Anthropic({
          ...(CFG.baseURL ? { baseURL: CFG.baseURL, apiKey: process.env[CFG.env] ?? "" } : {}),
        });
  }
  return client;
}

/**
 * The vendor-specific knobs for "how hard should it think?".
 * Stages 5 and 6 spread this into their own messages.create calls, which is
 * how they stay provider-neutral without knowing any of this.
 */
export function tuning(effort: string = EFFORT): Record<string, unknown> {
  if (PROVIDER === "deepseek") {
    // DeepSeek is a reasoning model by default. Left on, a small max_tokens
    // gets eaten entirely by hidden thinking and content comes back EMPTY
    // with stop_reason "max_tokens" — no error, just nothing.
    return effort === "low" ? { thinking: { type: "disabled" } } : {};
  }
  return { output_config: { effort } };
}

/* ---------------- making a schema stick on a vendor that ignores it ------ */

function schemaFallback(system: string | undefined, schema: object): string {
  /* Structured outputs are real on Anthropic: the decoder is constrained and
     the reply *cannot* be the wrong shape. DeepSeek accepts the field and
     ignores it, which is worse than rejecting it — you get confident prose
     where you expected JSON. So we do it the old way, and then check.
     Instructions last, because the end of a prompt has the most pull. */
  const demand =
    "Reply with a single JSON object and nothing else. No prose, no " +
    "explanation, no ``` fence. It must validate against this JSON Schema:\n" +
    JSON.stringify(schema, null, 1);
  return system ? `${system}\n\n${demand}` : demand;
}

const FENCE = /```(?:json)?\s*([\s\S]*?)\s*```/;

export function extractJSON<T>(text: string, schema: { required?: readonly string[] }): T {
  let candidate = text.trim();
  const fenced = FENCE.exec(candidate);
  if (fenced) candidate = fenced[1].trim();

  if (!candidate.startsWith("{")) {
    const a = candidate.indexOf("{");
    const b = candidate.lastIndexOf("}");
    if (a === -1 || b <= a) throw new Error(`expected JSON, got prose: ${text.trim().slice(0, 160)}`);
    candidate = candidate.slice(a, b + 1);
  }
  const data = JSON.parse(candidate) as Record<string, unknown>;

  // The bit people skip. An unconstrained model can return valid JSON of the
  // wrong shape, and a missing key surfaces three functions later as a
  // confusing undefined. Fail here instead.
  const missing = (schema.required ?? []).filter((k) => !(k in data));
  if (missing.length) throw new Error(`JSON is missing required key(s): ${missing.join(", ")}`);
  return data as T;
}

/* ------------------------------ the two calls --------------------------- */

export interface AskOptions {
  system?: string;
  schema?: { required?: readonly string[] } & object;
  effort?: string;
  maxTokens?: number;
  variant?: number;
}

export async function ask(prompt: string, opts?: AskOptions): Promise<string>;
export async function ask<T>(prompt: string, opts: AskOptions & { schema: object }): Promise<T>;
export async function ask<T>(prompt: string, opts: AskOptions = {}): Promise<string | T> {
  const { schema, effort = EFFORT, maxTokens = 2000, variant = 0 } = opts;
  let system = opts.system;

  const nativeSchema = !!schema && CFG.quirks.jsonSchema;
  if (schema && !nativeSchema) system = schemaFallback(system, schema);

  const request: Record<string, unknown> = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
    ...tuning(effort),
  };
  if (system) request.system = system;
  if (nativeSchema) {
    request.output_config = {
      ...(request.output_config as object ?? {}),
      format: { type: "json_schema", schema },
    };
  }

  let text: string;

  if (OFFLINE) {
    text = offlineText(prompt, { system, schema, variant });
  } else {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const response: any = await getClient().messages.create(request as any);

    // Claude runs safety classifiers. A declined request is a normal 200 with
    // empty or partial content, so check BEFORE indexing into content.
    if (response.stop_reason === "refusal") {
      throw new Error(`The model declined this request (category: ${response.stop_details?.category}).`);
    }
    meter(response);
    text = (response.content ?? [])
      .filter((b: any) => b.type === "text").map((b: any) => b.text).join("");

    // A reasoning model with too small a max_tokens spends the whole budget
    // thinking and returns an empty string. Say so, rather than letting an
    // empty reply fail somewhere less obvious.
    if (!text.trim() && response.stop_reason === "max_tokens") {
      throw new Error(
        `${CFG.label} used all ${maxTokens} tokens on hidden reasoning and left ` +
        `no answer. Raise maxTokens, or pass effort:"low" to turn thinking off.`);
    }
  }

  if (!schema) return text;
  return nativeSchema ? (JSON.parse(text) as T) : extractJSON<T>(text, schema);
}

/**
 * Count a call you made yourself.
 * Stages 5 and 6 drive the client directly, so ask() never sees them. Without
 * this their spend is invisible — and a cost you cannot see is one you will
 * not manage.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function meter(response: any): void {
  const u = response.usage ?? {};
  spent.in += u.input_tokens ?? 0;
  spent.out += u.output_tokens ?? 0;
  spent.cached += u.cache_read_input_tokens ?? 0;
  spent.calls++;
}

let baseline: number | null = null;

/**
 * Count the tokens in `text`, the way the API counts them.
 *
 * The endpoint counts a whole *request*, not a string, and every request
 * carries wrapping — role markers, chat template, tool preamble. On DeepSeek
 * that floor is ~83 tokens before your text is considered, which would wreck
 * stage 4's budgeting. So we measure the empty request once and subtract it.
 */
export async function tokens(text: string): Promise<number> {
  if (OFFLINE) return Math.floor(text.length / 4); // rough; offline has no API
  const count = async (t: string) =>
    (await getClient().messages.countTokens({
      model: MODEL, messages: [{ role: "user", content: t || "x" }],
    })).input_tokens;
  if (baseline === null) baseline = (await count("")) - 1;
  return Math.max(0, (await count(text)) - baseline);
}

export function spend(): string {
  if (OFFLINE) return "offline — no tokens spent";
  let note = "";
  if (spent.cached) note += ` (${spent.cached.toLocaleString()} cached)`;
  const usage = `${spent.calls} call(s) · ${spent.in.toLocaleString()} in / ` +
    `${spent.out.toLocaleString()} out${note}`;

  if (PROVIDER === "deepseek") {
    const band = priceBandAt();
    const priced = priceDeepSeekCourseUsage(MODEL, {
      inputTokens: spent.in,
      cachedInputTokens: spent.cached,
      outputTokens: spent.out,
    }, band);
    if (!priced.known) {
      return `${usage} · cost unknown on ${MODEL} ` +
        `(not safely priceable from the ${priced.checkedAt} DeepSeek snapshot)`;
    }
    return `${usage} · $${priced.usd.toFixed(4)} on ${MODEL} · ${band} rate · ` +
      `prices checked ${DEEPSEEK_PRICING.checkedAt}`;
  }

  const prices = CFG.prices;
  if (!prices) return `${usage} · cost unknown on ${MODEL}`;
  const fresh = Math.max(0, spent.in - spent.cached);
  const dollars = (
    fresh * prices.in + spent.cached * prices.cachedIn + spent.out * prices.out
  ) / 1e6;
  return `${usage} · $${dollars.toFixed(4)} on ${MODEL}`;
}

/** Fail early and clearly, instead of deep inside a stack trace. */
export function preflight(): void {
  if (OFFLINE) {
    console.log("  [offline] scripted local stand-in — no Provider request or real model variation.\n");
    return;
  }
  if (!process.env[CFG.env]) {
    const others = Object.entries(PROVIDERS)
      .filter(([n, c]) => n !== PROVIDER && process.env[c.env]).map(([n]) => n);
    const hint = others.length
      ? `\n  (${PROVIDERS[others[0]].label} is configured — run with CAFE_PROVIDER=${others[0]} to use it.)\n`
      : "";
    throw new Error(
      `\n  ${CFG.env} is not set, so the ${CFG.label} provider cannot run.\n\n` +
      `    export ${CFG.env}=...\n\n  Get a key: ${CFG.help}\n${hint}` +
      "  Or run any stage with --offline to use the scripted local stand-in.\n");
  }
  console.log(`  [${CFG.label}] ${MODEL} · effort=${EFFORT}\n`);
}
