import {
  GITHUB_PROGRESS_LESSON_SLUGS,
  GITHUB_PROGRESS_QUIZ,
} from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";

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

function isProgressRecord(value: unknown): value is CourseProgressRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function snapshotIsValid(snapshot: string): boolean {
  try {
    return isProgressRecord(JSON.parse(snapshot));
  } catch {
    return false;
  }
}

export function readCourseProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;

  try {
    const storedSnapshot = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY) || "{}";
    if (!snapshotIsValid(storedSnapshot)) {
      memorySnapshot = "{}";
      persistenceAvailable = false;
      return memorySnapshot;
    }
    memorySnapshot = storedSnapshot;
    persistenceAvailable = true;
    return memorySnapshot;
  } catch {
    persistenceAvailable = false;
    return memorySnapshot;
  }
}

export function isCourseProgressPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (persistenceAvailable !== false) readCourseProgressSnapshot();
  return persistenceAvailable !== false;
}

export function githubLessonProgressKey(slug: string): string {
  return `github.lesson.${slug}`;
}

const GITHUB_PROGRESS_STORAGE_KEYS = [
  ...GITHUB_PROGRESS_LESSON_SLUGS.map(githubLessonProgressKey),
  GITHUB_PROGRESS_QUIZ.bestStorageKey,
  GITHUB_PROGRESS_QUIZ.passedStorageKey,
  GITHUB_PROGRESS_QUIZ.versionStorageKey,
  GITHUB_CAPSTONE_STORAGE_KEY,
] as const;

export function hasGithubCourseProgress(
  progress: CourseProgressRecord,
): boolean {
  return GITHUB_PROGRESS_STORAGE_KEYS.some((key) => key in progress);
}

export function readCourseProgress(): CourseProgressRecord {
  return JSON.parse(readCourseProgressSnapshot()) as CourseProgressRecord;
}

export function writeCourseProgress(progress: CourseProgressRecord): boolean {
  if (typeof window === "undefined") return false;

  memorySnapshot = JSON.stringify(progress);
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(GITHUB_PROGRESS_EVENT));
    return false;
  }
  let persisted = false;
  try {
    const current = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY) || "{}";
    if (!snapshotIsValid(current)) {
      persistenceAvailable = false;
      window.dispatchEvent(new Event(GITHUB_PROGRESS_EVENT));
      return false;
    }
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

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetGithubProgressAfterGlobalReset(): PersistenceResult {
  memorySnapshot = "{}";
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(window.localStorage, COURSE_PROGRESS_STORAGE_KEY);
  persistenceAvailable = result.persisted;
  window.dispatchEvent(new Event(GITHUB_PROGRESS_EVENT));
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
