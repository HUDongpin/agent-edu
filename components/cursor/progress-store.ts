import {
  CURSOR_PROGRESS_EVENT,
  CURSOR_PROGRESS_LOCK_NAME,
  CURSOR_PROGRESS_PREFIX,
  CURSOR_PROGRESS_STORAGE_KEY,
  cursorProgressLessonKey,
} from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import {
  clearCorruptProgressAfterVerifiedQuarantine,
  isJsonObjectRecord,
  persistenceFailureReason as reasonForError,
} from "@/lib/progress-persistence";
import {
  CURSOR_PROGRESS_RESET_QUARANTINE_KEY,
} from "@/lib/progress-storage-contract";
import type { CursorLessonSlug } from "@/lib/cursor/types";
import { clearCursorAssessmentDrafts } from "./session-draft-store";

export { CURSOR_PROGRESS_EVENT };
export const COURSE_PROGRESS_STORAGE_KEY = CURSOR_PROGRESS_STORAGE_KEY;

export type CourseProgressRecord = Record<string, unknown>;
export type CourseProgressUpdateResult = {
  readonly progress: CourseProgressRecord;
  readonly persisted: boolean;
  readonly reason?: PersistenceResult["reason"];
  readonly quarantined?: boolean;
};

export type CursorQuizScorePatch = {
  readonly versionKey: string;
  readonly version: string;
  readonly bestScoreKey: string;
  readonly passedKey: string;
  readonly score: number;
  readonly passingScore: number;
  readonly maximumScore: number;
};

export type CursorProgressPatch = {
  readonly set?: Readonly<Record<string, unknown>>;
  readonly remove?: readonly string[];
  readonly clearCursor?: boolean;
  readonly quizScore?: CursorQuizScorePatch;
};

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;
let failureReason: PersistenceResult["reason"];

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
    const parsed = JSON.parse(storedSnapshot);
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
    // Malformed JSON is an unknown isolated snapshot. Treat it like a denied
    // read so a Cursor update cannot silently replace unrecoverable bytes.
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

export function lessonProgressKey(slug: CursorLessonSlug): `cursor.lesson.${CursorLessonSlug}` {
  return cursorProgressLessonKey(slug) as `cursor.lesson.${CursorLessonSlug}`;
}

export function readCourseProgress(): CourseProgressRecord {
  const value = JSON.parse(readCourseProgressSnapshot());
  return value as CourseProgressRecord;
}

function isRecord(value: unknown): value is CourseProgressRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function patchKeys(patch: CursorProgressPatch): readonly string[] {
  return [
    ...Object.keys(patch.set ?? {}),
    ...(patch.remove ?? []),
    ...(
      patch.quizScore
        ? [patch.quizScore.versionKey, patch.quizScore.bestScoreKey, patch.quizScore.passedKey]
        : []
    ),
  ];
}

function assertCursorPatch(patch: CursorProgressPatch): void {
  const invalid = patchKeys(patch).find((key) => !key.startsWith(CURSOR_PROGRESS_PREFIX));
  if (invalid) throw new TypeError(`Cursor progress patch cannot modify an out-of-namespace key: ${invalid}`);
  if (patch.quizScore && (
    !Number.isInteger(patch.quizScore.score)
    || patch.quizScore.score < 0
    || patch.quizScore.score > patch.quizScore.maximumScore
  )) {
    throw new TypeError("Cursor quiz score patch is outside the declared score range.");
  }
}

function applyPatch(record: CourseProgressRecord, patch: CursorProgressPatch): CourseProgressRecord {
  const next = { ...record };
  if (patch.clearCursor) {
    for (const key of Object.keys(next)) {
      if (key.startsWith(CURSOR_PROGRESS_PREFIX)) delete next[key];
    }
  }
  for (const key of patch.remove ?? []) delete next[key];
  Object.assign(next, patch.set ?? {});

  if (patch.quizScore) {
    const score = patch.quizScore;
    const sameVersion = next[score.versionKey] === score.version;
    const previousBest = sameVersion
      && typeof next[score.bestScoreKey] === "number"
      && Number.isInteger(next[score.bestScoreKey])
      && (next[score.bestScoreKey] as number) >= 0
      && (next[score.bestScoreKey] as number) <= score.maximumScore
      ? next[score.bestScoreKey] as number
      : 0;
    next[score.bestScoreKey] = Math.max(previousBest, score.score);
    next[score.passedKey] = score.score >= score.passingScore
      || (sameVersion && next[score.passedKey] === true);
    next[score.versionKey] = score.version;
  }
  return next;
}

function patchSatisfied(record: CourseProgressRecord, patch: CursorProgressPatch): boolean {
  if (patch.clearCursor && Object.keys(record).some((key) => key.startsWith(CURSOR_PROGRESS_PREFIX))) {
    return false;
  }
  if (Object.entries(patch.set ?? {}).some(([key, value]) => !sameValue(record[key], value))) return false;
  if ((patch.remove ?? []).some((key) => Object.prototype.hasOwnProperty.call(record, key))) return false;
  if (patch.quizScore) {
    const score = patch.quizScore;
    if (record[score.versionKey] !== score.version
      || typeof record[score.bestScoreKey] !== "number"
      || (record[score.bestScoreKey] as number) < score.score
      || (score.score >= score.passingScore && record[score.passedKey] !== true)) {
      return false;
    }
  }
  return true;
}

function outsideCursorSnapshot(record: CourseProgressRecord): CourseProgressRecord {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !key.startsWith(CURSOR_PROGRESS_PREFIX)));
}

function readCursorRecordForCommit(): CourseProgressRecord | null {
  let raw: string;
  try {
    raw = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY) || "{}";
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      persistenceAvailable = false;
      failureReason = "corrupt";
      return null;
    }
    return parsed;
  } catch {
    persistenceAvailable = false;
    failureReason = "corrupt";
    return null;
  }
}

function commitCursorPatch(patch: CursorProgressPatch): CourseProgressUpdateResult {
  if (persistenceAvailable === false) {
    const progress = applyPatch(readCourseProgress(), patch);
    memorySnapshot = JSON.stringify(progress);
    window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
    return { progress, persisted: false, reason: failureReason ?? "unavailable" };
  }

  let progress = readCourseProgress();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const latest = readCursorRecordForCommit();
    if (!latest) {
      progress = applyPatch(progress, patch);
      memorySnapshot = JSON.stringify(progress);
      window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
      return { progress, persisted: false, reason: failureReason ?? "unavailable" };
    }

    const preserved = outsideCursorSnapshot(latest);
    progress = applyPatch(latest, patch);
    memorySnapshot = JSON.stringify(progress);
    try {
      window.localStorage.setItem(COURSE_PROGRESS_STORAGE_KEY, memorySnapshot);
      const observed = readCursorRecordForCommit();
      if (observed
        && patchSatisfied(observed, patch)
        && sameValue(outsideCursorSnapshot(observed), preserved)) {
        progress = observed;
        memorySnapshot = JSON.stringify(observed);
        persistenceAvailable = true;
        failureReason = undefined;
        window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
        return { progress, persisted: true };
      }
      if (observed) progress = observed;
    } catch (error) {
      persistenceAvailable = false;
      failureReason = reasonForError(error);
      window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
      return { progress, persisted: false, reason: failureReason };
    }
  }

  memorySnapshot = JSON.stringify(progress);
  window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
  return { progress, persisted: false, reason: failureReason ?? "unavailable" };
}

/**
 * Merge an explicit Cursor-only patch into the freshest valid isolated Cursor
 * object. Cursor tabs serialize through a course-specific Web Lock where
 * available and verify each commit up to three times. Other courses use
 * different storage keys, so they cannot be overwritten by this transaction.
 */
export async function applyCursorProgressPatch(
  patch: CursorProgressPatch,
): Promise<CourseProgressUpdateResult> {
  assertCursorPatch(patch);
  if (typeof window === "undefined") {
    return { progress: applyPatch({}, patch), persisted: false, reason: "unavailable" };
  }
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(
      CURSOR_PROGRESS_LOCK_NAME,
      { mode: "exclusive" },
      () => commitCursorPatch(patch),
    );
  }
  return commitCursorPatch(patch);
}

export async function resetCursorProgress(): Promise<CourseProgressUpdateResult> {
  const result = await applyCursorProgressPatch({ clearCursor: true });
  clearCursorAssessmentDrafts();
  return result;
}

/**
 * Mirror the site-wide reset into Cursor's independent session fallback. The
 * shared reset control awaits this after the existing Codex-owned
 * resetAllCourseProgress(). Taking the same Cursor lock ensures every
 * already-queued cooperative write commits before this final removal. A storage
 * denial must still leave this module's memory snapshot empty and authoritative.
 */
export async function resetCursorProgressAfterGlobalReset(): Promise<CourseProgressUpdateResult> {
  const commitReset = (): CourseProgressUpdateResult => {
    const progress = {};
    memorySnapshot = "{}";
    clearCursorAssessmentDrafts();
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
          quarantineKey: CURSOR_PROGRESS_RESET_QUARANTINE_KEY,
          corruptRaw: raw,
        });
        persistenceAvailable = reset.persisted;
        failureReason = reset.persisted ? undefined : reset.reason ?? "unavailable";
        window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
        return {
          progress,
          persisted: reset.persisted,
          ...(reset.persisted ? {} : { reason: failureReason }),
          ...(reset.quarantined ? { quarantined: true } : {}),
        };
      }
      window.localStorage.removeItem(COURSE_PROGRESS_STORAGE_KEY);
      persistenceAvailable = true;
      failureReason = undefined;
      window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
      return { progress, persisted: true };
    } catch (error) {
      persistenceAvailable = false;
      failureReason = reasonForError(error);
      window.dispatchEvent(new Event(CURSOR_PROGRESS_EVENT));
      return { progress, persisted: false, reason: failureReason };
    }
  };

  if (typeof window === "undefined") return commitReset();
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(
      CURSOR_PROGRESS_LOCK_NAME,
      { mode: "exclusive" },
      commitReset,
    );
  }

  return commitReset();
}

export function subscribeToCourseProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === COURSE_PROGRESS_STORAGE_KEY) listener();
  };

  window.addEventListener(CURSOR_PROGRESS_EVENT, listener);
  window.addEventListener("focus", listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CURSOR_PROGRESS_EVENT, listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("storage", handleStorage);
  };
}
