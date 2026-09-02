import type { PersistenceResult } from "@/lib/public-progress-contract";
import {
  clearCorruptProgressAfterVerifiedQuarantine,
  isJsonObjectRecord,
  persistenceFailureReason as reasonForError,
} from "@/lib/progress-persistence";
import {
  CODEX_CAPSTONE_DRAFT_STORAGE_KEY,
  SHARED_PROGRESS_RESET_QUARANTINE_KEY,
} from "@/lib/progress-storage-contract";

export const COURSE_PROGRESS_STORAGE_KEY = "ae.progress";
export const CODEX_PROGRESS_EVENT = "codex:progress-change";
export const CODEX_PROGRESS_RESET_EVENT = "codex:progress-reset";

export type CourseProgressRecord = Record<string, unknown>;
export type CourseProgressUpdateResult = {
  readonly progress: CourseProgressRecord;
  readonly persisted: boolean;
  readonly reason?: PersistenceResult["reason"];
  readonly quarantined?: boolean;
};

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;
let failureReason: PersistenceResult["reason"];

function finishCodexReset(): boolean {
  if (typeof window === "undefined") return false;
  let sessionDraftCleared = false;
  try {
    window.sessionStorage.removeItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
    sessionDraftCleared = window.sessionStorage.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY) === null;
  } catch {
    // Resetting mounted Course 2 state must not depend on session storage.
  }
  window.dispatchEvent(new Event(CODEX_PROGRESS_RESET_EVENT));
  return sessionDraftCleared;
}

function includeSessionDraftReset(
  result: CourseProgressUpdateResult,
  sessionDraftCleared: boolean,
): CourseProgressUpdateResult {
  if (sessionDraftCleared) return result;
  return {
    ...result,
    persisted: false,
    reason: result.reason ?? "unavailable",
  };
}

export function readCourseProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;

  // Once either storage read or write fails, the in-memory snapshot is the
  // authoritative session store. Retrying a successful getItem after a failed
  // setItem would otherwise erase the learner's session-only progress and
  // incorrectly announce that persistence is available again.
  if (persistenceAvailable === false) return memorySnapshot;

  let storedSnapshot: string;
  try {
    storedSnapshot = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY) || "{}";
  } catch (error) {
    memorySnapshot = "{}";
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    return memorySnapshot;
  }
  try {
    const parsed: unknown = JSON.parse(storedSnapshot);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      memorySnapshot = "{}";
      persistenceAvailable = false;
      failureReason = "corrupt";
      return memorySnapshot;
    }
    memorySnapshot = storedSnapshot;
    persistenceAvailable = true;
    failureReason = undefined;
    return memorySnapshot;
  } catch {
    // Preserve malformed or unreadable bytes. This session can continue in
    // memory, but an ordinary Codex write must never replace unknown evidence.
    memorySnapshot = "{}";
    persistenceAvailable = false;
    failureReason = "corrupt";
    return memorySnapshot;
  }
}

export function isCourseProgressPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  readCourseProgressSnapshot();
  return persistenceAvailable !== false;
}

export function lessonProgressKey(slug: string): string {
  return `codex.lesson.${slug}`;
}

export function readCourseProgress(): CourseProgressRecord {
  return JSON.parse(readCourseProgressSnapshot()) as CourseProgressRecord;
}

export function writeCourseProgress(progress: CourseProgressRecord): boolean {
  if (typeof window === "undefined") return false;

  memorySnapshot = JSON.stringify(progress);
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(CODEX_PROGRESS_EVENT));
    return false;
  }

  let persisted = false;
  try {
    window.localStorage.setItem(COURSE_PROGRESS_STORAGE_KEY, memorySnapshot);
    persistenceAvailable = true;
    failureReason = undefined;
    persisted = true;
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
  }
  window.dispatchEvent(new Event(CODEX_PROGRESS_EVENT));
  return persisted;
}

export function updateCourseProgress(
  update: (progress: CourseProgressRecord) => void,
): CourseProgressUpdateResult {
  const progress = readCourseProgress();
  update(progress);
  const persisted = writeCourseProgress(progress);
  return {
    progress,
    persisted,
    ...(persisted ? {} : { reason: failureReason ?? "unavailable" }),
  };
}

export function resetCodexProgress(): CourseProgressUpdateResult {
  const result = updateCourseProgress((progress) => {
    for (const key of Object.keys(progress)) {
      if (key.startsWith("codex.")) delete progress[key];
    }
  });
  return includeSessionDraftReset(result, finishCodexReset());
}

/**
 * Clear the shared progress record, including the session-only fallback used
 * after a storage failure. The site-wide reset calls this so a same-tab client
 * navigation cannot revive stale Codex milestones after localStorage is gone.
 */
export function resetAllCourseProgress(): CourseProgressUpdateResult {
  const progress = {};
  memorySnapshot = "{}";
  if (typeof window === "undefined") {
    persistenceAvailable = false;
    failureReason = "unavailable";
    return { progress, persisted: false, reason: failureReason };
  }

  try {
    const raw = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY);
    if (raw !== null && !isJsonObjectRecord(raw)) {
      const reset = clearCorruptProgressAfterVerifiedQuarantine({
        storage: window.localStorage,
        sourceKey: COURSE_PROGRESS_STORAGE_KEY,
        quarantineKey: SHARED_PROGRESS_RESET_QUARANTINE_KEY,
        corruptRaw: raw,
      });
      persistenceAvailable = reset.persisted;
      failureReason = reset.persisted ? undefined : reset.reason ?? "unavailable";
      window.dispatchEvent(new Event(CODEX_PROGRESS_EVENT));
      return includeSessionDraftReset({
        progress,
        persisted: reset.persisted,
        ...(reset.persisted ? {} : { reason: failureReason }),
        ...(reset.quarantined ? { quarantined: true } : {}),
      }, finishCodexReset());
    }
    window.localStorage.removeItem(COURSE_PROGRESS_STORAGE_KEY);
    persistenceAvailable = true;
    failureReason = undefined;
    window.dispatchEvent(new Event(CODEX_PROGRESS_EVENT));
    return includeSessionDraftReset(
      { progress, persisted: true },
      finishCodexReset(),
    );
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    window.dispatchEvent(new Event(CODEX_PROGRESS_EVENT));
    return includeSessionDraftReset(
      { progress, persisted: false, reason: failureReason },
      finishCodexReset(),
    );
  }
}

export function subscribeToCourseProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === COURSE_PROGRESS_STORAGE_KEY) listener();
  };

  window.addEventListener(CODEX_PROGRESS_EVENT, listener);
  window.addEventListener("focus", listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CODEX_PROGRESS_EVENT, listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("storage", handleStorage);
  };
}
