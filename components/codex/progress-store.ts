export const COURSE_PROGRESS_STORAGE_KEY = "ae.progress";
export const CODEX_PROGRESS_EVENT = "codex:progress-change";

export type CourseProgressRecord = Record<string, unknown>;
export type CourseProgressUpdateResult = {
  readonly progress: CourseProgressRecord;
  readonly persisted: boolean;
};

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

export function readCourseProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;

  // Once either storage read or write fails, the in-memory snapshot is the
  // authoritative session store. Retrying a successful getItem after a failed
  // setItem would otherwise erase the learner's session-only progress and
  // incorrectly announce that persistence is available again.
  if (persistenceAvailable === false) return memorySnapshot;

  try {
    memorySnapshot = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY) || "{}";
    persistenceAvailable = true;
    return memorySnapshot;
  } catch {
    persistenceAvailable = false;
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
  try {
    const value = JSON.parse(readCourseProgressSnapshot());
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as CourseProgressRecord
      : {};
  } catch {
    return {};
  }
}

export function writeCourseProgress(progress: CourseProgressRecord): boolean {
  if (typeof window === "undefined") return false;

  memorySnapshot = JSON.stringify(progress);
  let persisted = false;
  try {
    window.localStorage.setItem(COURSE_PROGRESS_STORAGE_KEY, memorySnapshot);
    persistenceAvailable = true;
    persisted = true;
  } catch {
    persistenceAvailable = false;
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
  return { progress, persisted };
}

export function resetCodexProgress(): CourseProgressUpdateResult {
  return updateCourseProgress((progress) => {
    for (const key of Object.keys(progress)) {
      if (key.startsWith("codex.")) delete progress[key];
    }
  });
}

/**
 * Clear the shared progress record, including the session-only fallback used
 * after a storage failure. The site-wide reset calls this so a same-tab client
 * navigation cannot revive stale Codex milestones after localStorage is gone.
 */
export function resetAllCourseProgress(): CourseProgressUpdateResult {
  const progress = {};
  memorySnapshot = "{}";
  let persisted = false;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(COURSE_PROGRESS_STORAGE_KEY);
      persistenceAvailable = true;
      persisted = true;
    } catch {
      persistenceAvailable = false;
    }
    window.dispatchEvent(new Event(CODEX_PROGRESS_EVENT));
  }

  return { progress, persisted };
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
