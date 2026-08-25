export const COURSE_PROGRESS_STORAGE_KEY = "ae.progress";
export const CLAUDE_PROGRESS_EVENT = "claude:progress-change";

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
    const storedSnapshot = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY) || "{}";
    const parsed = JSON.parse(storedSnapshot);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      memorySnapshot = "{}";
      persistenceAvailable = false;
      return memorySnapshot;
    }
    memorySnapshot = storedSnapshot;
    persistenceAvailable = true;
    return memorySnapshot;
  } catch {
    // A denied read or malformed shared record means this session does not
    // know which other-course keys exist. Keep a safe session-only snapshot
    // and refuse persistent writes that could replace those unknown bytes.
    memorySnapshot = "{}";
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
    persisted = true;
  } catch {
    persistenceAvailable = false;
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
  return { progress, persisted };
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
  let persisted = false;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(COURSE_PROGRESS_STORAGE_KEY);
      persistenceAvailable = true;
      persisted = true;
    } catch {
      persistenceAvailable = false;
    }
    window.dispatchEvent(new Event(CLAUDE_PROGRESS_EVENT));
  }

  return { progress, persisted };
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
