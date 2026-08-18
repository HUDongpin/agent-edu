/**
 * What the reader has finished, and nothing else.
 *
 * One key in localStorage, no account, nothing sent anywhere — the property
 * the course promises on its own home page. It is exposed as a subscribable
 * store so a component can render the right thing on its first pass instead
 * of rendering "nothing done yet" and then correcting itself.
 */

export const PROG = "ae.progress";

const watchers = new Set<() => void>();

function notify() {
  for (const fn of watchers) fn();
}

export function subscribeProgress(fn: () => void): () => void {
  watchers.add(fn);
  // Another tab, or the handbook in another window, may have moved it on.
  window.addEventListener("focus", fn);
  window.addEventListener("storage", fn);
  return () => {
    watchers.delete(fn);
    window.removeEventListener("focus", fn);
    window.removeEventListener("storage", fn);
  };
}

/**
 * The raw JSON, not the parsed object: React compares snapshots by identity,
 * and a fresh object every render would loop forever.
 */
export function progressSnapshot(): string {
  try { return localStorage.getItem(PROG) || "{}"; } catch { return "{}"; }
}

/** Private browsing, and the server, both have nothing to report. */
export function progressOnServer(): string { return "{}"; }

export function readProgress(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

export function mark(key: string, value: unknown = true): void {
  try {
    const p = readProgress(progressSnapshot());
    p[key] = value;
    localStorage.setItem(PROG, JSON.stringify(p));
  } catch { /* private browsing: the tick just will not stick */ }
  notify();
}
