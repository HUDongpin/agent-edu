/**
 * What the reader has finished, and nothing else.
 *
 * One key in localStorage, no account, nothing sent anywhere — the property
 * the course promises on its own home page. It is exposed as a subscribable
 * store so a component can render the right thing on its first pass instead
 * of rendering "nothing done yet" and then correcting itself.
 *
 * The handbook and the Lab share `ae.progress` with every course store under
 * `components/*\/progress-store.ts`, so this module keeps their contract
 * rather than a second one of its own:
 *
 *   - an unreadable record is quarantined, never overwritten;
 *   - once a read or a write fails, memory is authoritative for the session;
 *   - a write says whether it persisted, so the caller can be honest;
 *   - a change fires a DOM event, so the catalogue repaints in the same tab.
 *
 * `lib/handbook/behaviour.ts` reads this key with its own inline reader. That
 * reader is read-only and correct, and stays untouched.
 */

export const PROG = "ae.progress";

/** Handbook sections read, counted by the handbook, the home page and the catalogue. */
export const SECTIONS = "tch.seen";

/** Same-tab invalidation, matching every course store's event. */
export const AGENTIC_PROGRESS_EVENT = "agentic:progress-change";

/** Milestones this store owns. `part2` is the legacy Python course's. */
export const AGENTIC_PROGRESS_KEYS = [
  "play0", "play1", "play2", "play3", "evalBest", "part2",
] as const;

const CORRUPT_BACKUP_KEY = "ae.progress.agentic-corrupt-backup";

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

/**
 * Hold an unreadable record instead of writing over it.
 *
 * Someone else's milestones may still be in that string. Session storage keeps
 * a copy for anyone who comes to recover it, and memory becomes authoritative
 * so the next tick is not paid for with the rest of the record.
 */
function holdCorruptProgress(raw: string | null): void {
  memorySnapshot = "{}";
  if (raw) {
    try { sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw); } catch { /* nothing to fall back to */ }
  }
  persistenceAvailable = false;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * The raw JSON, not the parsed object: React compares snapshots by identity,
 * and a fresh object every render would loop forever.
 *
 * Once either a read or a write has failed, the in-memory snapshot is the
 * session store. Retrying a successful getItem after a failed setItem would
 * erase progress made since, and wrongly announce that saving works again.
 */
export function progressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;

  let raw: string | null;
  try {
    raw = localStorage.getItem(PROG);
  } catch {
    persistenceAvailable = false;
    return memorySnapshot;
  }

  if (raw !== null && raw !== "") {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { holdCorruptProgress(raw); return memorySnapshot; }
    if (!isPlainRecord(parsed)) { holdCorruptProgress(raw); return memorySnapshot; }
  }

  memorySnapshot = raw || "{}";
  persistenceAvailable = true;
  return memorySnapshot;
}

/** Private browsing, and the server, both have nothing to report. */
export function progressOnServer(): string { return "{}"; }

/** Whether a tick made here will still be here tomorrow. */
export function isProgressPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  progressSnapshot();
  return persistenceAvailable !== false;
}

export function readProgress(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPlainRecord(parsed) ? parsed : {};
  } catch { return {}; }
}

function writeProgress(record: Record<string, unknown>): boolean {
  memorySnapshot = JSON.stringify(record);
  let persisted = false;

  if (typeof window !== "undefined") {
    /* False means either a failed write or a quarantined record, and in both
       cases touching localStorage is the wrong move: the first would fail
       again, the second would destroy the string being held for recovery. */
    if (persistenceAvailable !== false) {
      try {
        localStorage.setItem(PROG, memorySnapshot);
        persistenceAvailable = true;
        persisted = true;
      } catch {
        persistenceAvailable = false;
      }
    }
    window.dispatchEvent(new Event(AGENTIC_PROGRESS_EVENT));
  }

  return persisted;
}

/**
 * Record one milestone. Returns whether it reached the browser's own store —
 * false means the reader should be told, not that the tick was lost.
 */
export function mark(key: string, value: unknown = true): boolean {
  const record = readProgress(progressSnapshot());
  record[key] = value;
  return writeProgress(record);
}

/**
 * Drop this store's milestones and repaint. The site-wide reset calls it
 * after the shared record has been removed, so that the session-only fallback
 * cannot revive a milestone on the next write.
 */
export function resetAgenticProgress(): boolean {
  const record = readProgress(progressSnapshot());
  for (const key of AGENTIC_PROGRESS_KEYS) delete record[key];
  /* The reader asked for the record to go, so a record held back as
     unreadable is no longer worth protecting. Re-probe rather than stay
     latched, or the rest of the session silently saves nothing. */
  persistenceAvailable = null;
  return writeProgress(record);
}

export function subscribeProgress(fn: () => void): () => void {
  // Another tab, or the handbook in another window, may have moved it on.
  // `storage` never fires in the tab that wrote, which is what the event is for.
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === PROG) fn();
  };

  window.addEventListener(AGENTIC_PROGRESS_EVENT, fn);
  window.addEventListener("focus", fn);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(AGENTIC_PROGRESS_EVENT, fn);
    window.removeEventListener("focus", fn);
    window.removeEventListener("storage", onStorage);
  };
}
