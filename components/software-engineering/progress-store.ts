import type { SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS } from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";

type SoftwareEngineeringLessonSlug =
  (typeof SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS)[number];

export const SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY = "ae.progress";
export const SOFTWARE_ENGINEERING_PROGRESS_EVENT = "software-engineering:progress-change";
export const SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT = "software-engineering:progress-reset";
export const SOFTWARE_ENGINEERING_PROGRESS_PREFIX = "softwareEngineering.";
export const SOFTWARE_ENGINEERING_QUIZ_BEST_KEY = "softwareEngineering.quizBest";
export const SOFTWARE_ENGINEERING_QUIZ_PASSED_KEY = "softwareEngineering.quizPassed";
export const SOFTWARE_ENGINEERING_QUIZ_VERSION_KEY = "softwareEngineering.quizVersion";
export const SOFTWARE_ENGINEERING_CAPSTONE_KEY = "softwareEngineering.capstone.v1";

export type SoftwareEngineeringProgressRecord = Record<string, unknown>;

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

function isProgressRecord(value: unknown): value is SoftwareEngineeringProgressRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function snapshotIsValid(snapshot: string): boolean {
  try {
    return isProgressRecord(JSON.parse(snapshot));
  } catch {
    return false;
  }
}

export function softwareEngineeringLessonKey(slug: SoftwareEngineeringLessonSlug): string {
  return `softwareEngineering.lesson.${slug}`;
}

export function readSoftwareEngineeringProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;

  try {
    const storedSnapshot = window.localStorage.getItem(
      SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY,
    ) || "{}";
    if (!snapshotIsValid(storedSnapshot)) {
      memorySnapshot = "{}";
      persistenceAvailable = false;
      return memorySnapshot;
    }
    memorySnapshot = storedSnapshot;
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
  return memorySnapshot;
}

export function isSoftwareEngineeringStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (persistenceAvailable !== false) readSoftwareEngineeringProgressSnapshot();
  return persistenceAvailable !== false;
}

export function readSoftwareEngineeringProgress(): SoftwareEngineeringProgressRecord {
  return JSON.parse(readSoftwareEngineeringProgressSnapshot()) as SoftwareEngineeringProgressRecord;
}

export function writeSoftwareEngineeringProgress(
  progress: SoftwareEngineeringProgressRecord,
): boolean {
  if (typeof window === "undefined") return false;
  memorySnapshot = JSON.stringify(progress);
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(SOFTWARE_ENGINEERING_PROGRESS_EVENT));
    return false;
  }
  let persisted = false;
  try {
    const current = window.localStorage.getItem(
      SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY,
    ) || "{}";
    if (!snapshotIsValid(current)) {
      persistenceAvailable = false;
      window.dispatchEvent(new Event(SOFTWARE_ENGINEERING_PROGRESS_EVENT));
      return false;
    }
    window.localStorage.setItem(SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY, memorySnapshot);
    persistenceAvailable = true;
    persisted = true;
  } catch {
    persistenceAvailable = false;
  }
  window.dispatchEvent(new Event(SOFTWARE_ENGINEERING_PROGRESS_EVENT));
  return persisted;
}

export function updateSoftwareEngineeringProgress(
  update: (progress: SoftwareEngineeringProgressRecord) => void,
): boolean {
  const progress = readSoftwareEngineeringProgress();
  update(progress);
  return writeSoftwareEngineeringProgress(progress);
}

export function resetSoftwareEngineeringProgress(): boolean {
  const persisted = updateSoftwareEngineeringProgress((progress) => {
    for (const key of Object.keys(progress)) {
      if (key.startsWith(SOFTWARE_ENGINEERING_PROGRESS_PREFIX)) delete progress[key];
    }
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT));
  }
  return persisted;
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetSoftwareEngineeringProgressAfterGlobalReset(): PersistenceResult {
  memorySnapshot = "{}";
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(
      window.localStorage,
      SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY,
    );
  persistenceAvailable = result.persisted;
  window.dispatchEvent(new Event(SOFTWARE_ENGINEERING_PROGRESS_EVENT));
  window.dispatchEvent(new Event(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT));
  return result;
}

export function subscribeSoftwareEngineeringProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY) listener();
  };
  window.addEventListener(SOFTWARE_ENGINEERING_PROGRESS_EVENT, listener);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener(SOFTWARE_ENGINEERING_PROGRESS_EVENT, listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", listener);
  };
}
