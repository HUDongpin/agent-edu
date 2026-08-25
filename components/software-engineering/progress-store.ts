import type { SoftwareEngineeringLessonSlug } from "@/lib/software-engineering";

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

export function softwareEngineeringLessonKey(slug: SoftwareEngineeringLessonSlug): string {
  return `softwareEngineering.lesson.${slug}`;
}

export function readSoftwareEngineeringProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;

  try {
    memorySnapshot = window.localStorage.getItem(SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY) || "{}";
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
  return memorySnapshot;
}

export function isSoftwareEngineeringStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  readSoftwareEngineeringProgressSnapshot();
  return persistenceAvailable !== false;
}

export function readSoftwareEngineeringProgress(): SoftwareEngineeringProgressRecord {
  try {
    const value: unknown = JSON.parse(readSoftwareEngineeringProgressSnapshot());
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as SoftwareEngineeringProgressRecord
      : {};
  } catch {
    return {};
  }
}

export function writeSoftwareEngineeringProgress(
  progress: SoftwareEngineeringProgressRecord,
): boolean {
  if (typeof window === "undefined") return false;
  memorySnapshot = JSON.stringify(progress);
  let persisted = false;
  try {
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
