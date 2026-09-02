import type { PersistenceResult } from "@/lib/public-progress-contract";
import {
  isJsonObjectRecord,
  persistenceFailureReason as reasonForError,
} from "@/lib/progress-persistence";

export const COURSE_PROGRESS_STORAGE_KEY = "ae.progress";
export const CLAUDE_PROGRESS_EVENT = "claude:progress-change";

export type CourseProgressRecord = Record<string, unknown>;
export type CourseProgressUpdateResult = {
  readonly progress: CourseProgressRecord;
  readonly persisted: boolean;
  readonly reason?: PersistenceResult["reason"];
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
    // A denied read or malformed shared record means this session does not
    // know which other-course keys exist. Keep a safe session-only snapshot
    // and refuse persistent writes that could replace those unknown bytes.
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
  return `claude.lesson.${slug}`;
}

export function readCourseProgress(): CourseProgressRecord {
  return JSON.parse(readCourseProgressSnapshot()) as CourseProgressRecord;
}

export function writeCourseProgress(progress: CourseProgressRecord): boolean {
  if (typeof window === "undefined") return false;

  memorySnapshot = JSON.stringify(progress);
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(CLAUDE_PROGRESS_EVENT));
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
  window.dispatchEvent(new Event(CLAUDE_PROGRESS_EVENT));
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

export function resetClaudeProgress(): CourseProgressUpdateResult {
  return updateCourseProgress((progress) => {
    for (const key of Object.keys(progress)) {
      if (key.startsWith("claude.")) delete progress[key];
    }
  });
}

/** Mirror a site-wide reset into Claude's independent session fallback. */
export function resetClaudeProgressAfterGlobalReset(): CourseProgressUpdateResult {
  const progress = {};
  memorySnapshot = "{}";
  if (typeof window === "undefined") {
    persistenceAvailable = false;
    failureReason = "unavailable";
    return { progress, persisted: false, reason: failureReason };
  }

  try {
    const raw = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY);
    if (raw === null) {
      persistenceAvailable = true;
      failureReason = undefined;
      window.dispatchEvent(new Event(CLAUDE_PROGRESS_EVENT));
      return { progress, persisted: true };
    }
    persistenceAvailable = false;
    failureReason = isJsonObjectRecord(raw) ? "unavailable" : "corrupt";
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
  }
  window.dispatchEvent(new Event(CLAUDE_PROGRESS_EVENT));
  return { progress, persisted: false, reason: failureReason };
}

export function subscribeToCourseProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === COURSE_PROGRESS_STORAGE_KEY) listener();
  };

  window.addEventListener(CLAUDE_PROGRESS_EVENT, listener);
  window.addEventListener("focus", listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CLAUDE_PROGRESS_EVENT, listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("storage", handleStorage);
  };
}
