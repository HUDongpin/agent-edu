import {
  GITHUB_LESSON_SLUGS,
  GITHUB_QUIZ_STORAGE_KEYS,
} from "@/lib/github/types";

export const COURSE_PROGRESS_STORAGE_KEY = "ae.progress";
export const GITHUB_PROGRESS_EVENT = "github:progress-change";
export const GITHUB_RESET_EVENT = "github:progress-reset";
export const GITHUB_CAPSTONE_STORAGE_KEY = "github.capstone.v1";

export type CourseProgressRecord = Record<string, unknown>;
export type CourseProgressUpdateResult = {
  readonly progress: CourseProgressRecord;
  readonly persisted: boolean;
};

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

export function readCourseProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;

  try {
    memorySnapshot =
      window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY) || "{}";
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

export function githubLessonProgressKey(slug: string): string {
  return `github.lesson.${slug}`;
}

const GITHUB_PROGRESS_STORAGE_KEYS = [
  ...GITHUB_LESSON_SLUGS.map(githubLessonProgressKey),
  GITHUB_QUIZ_STORAGE_KEYS.best,
  GITHUB_QUIZ_STORAGE_KEYS.passed,
  GITHUB_QUIZ_STORAGE_KEYS.version,
  GITHUB_CAPSTONE_STORAGE_KEY,
] as const;

export function hasGithubCourseProgress(
  progress: CourseProgressRecord,
): boolean {
  return GITHUB_PROGRESS_STORAGE_KEYS.some((key) => key in progress);
}

export function readCourseProgress(): CourseProgressRecord {
  try {
    const value = JSON.parse(readCourseProgressSnapshot());
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as CourseProgressRecord)
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
  window.dispatchEvent(new Event(GITHUB_PROGRESS_EVENT));
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

export function resetGithubProgress(): CourseProgressUpdateResult {
  const result = updateCourseProgress((progress) => {
    for (const key of GITHUB_PROGRESS_STORAGE_KEYS) delete progress[key];
  });
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(GITHUB_RESET_EVENT));
  return result;
}

export function subscribeToCourseProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === COURSE_PROGRESS_STORAGE_KEY) listener();
  };

  window.addEventListener(GITHUB_PROGRESS_EVENT, listener);
  window.addEventListener("focus", listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(GITHUB_PROGRESS_EVENT, listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("storage", handleStorage);
  };
}
