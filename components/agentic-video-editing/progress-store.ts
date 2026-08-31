"use client";

import {
  AGENTIC_VIDEO_EDITING_CORRUPT_BACKUP_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_EVENT,
  AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX,
  AGENTIC_VIDEO_EDITING_PROGRESS_PROBE_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
  AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_SESSION_PROBE_KEY,
  AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX,
  isAgenticVideoEditingOwnedProgressKey,
  normalizeAgenticVideoEditingProgress,
} from "@/lib/progress-agentic-video-editing";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";

export {
  AGENTIC_VIDEO_EDITING_CORRUPT_BACKUP_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_PROBE_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY,
  AGENTIC_VIDEO_EDITING_SESSION_PROBE_KEY,
};

export type AgenticVideoEditingProgressRecord = Record<string, unknown>;

let memoryProgress: AgenticVideoEditingProgressRecord = {};
let storageAvailable: boolean | null = null;
let sessionStorageAvailable: boolean | null = null;
let observedExternalProgress: AgenticVideoEditingProgressRecord | null = null;
let observedExternalRaw: string | null | undefined;

function isRecord(value: unknown): value is AgenticVideoEditingProgressRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function course20OwnedProgress(
  record: AgenticVideoEditingProgressRecord,
): AgenticVideoEditingProgressRecord {
  return Object.fromEntries(Object.entries(record).filter(
    ([key]) => isAgenticVideoEditingOwnedProgressKey(key),
  ));
}

function sameCourse20OwnedProgress(
  left: AgenticVideoEditingProgressRecord,
  right: AgenticVideoEditingProgressRecord,
): boolean {
  return JSON.stringify(course20OwnedProgress(left))
    === JSON.stringify(course20OwnedProgress(right));
}

function holdCorruptProgress(raw: string | null): AgenticVideoEditingProgressRecord {
  memoryProgress = {
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
  if (raw && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(AGENTIC_VIDEO_EDITING_CORRUPT_BACKUP_KEY, raw);
    } catch {
      // The shared unreadable record remains untouched and memory stays usable.
    }
  }
  storageAvailable = false;
  return memoryProgress;
}

function normalizedProgressFromRaw(raw: string | null): AgenticVideoEditingProgressRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return holdCorruptProgress(raw);
  }
  if (!isRecord(parsed)) return holdCorruptProgress(raw);
  return normalizeAgenticVideoEditingProgress(parsed);
}

function dispatchProgressEvents(persisted: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AGENTIC_VIDEO_EDITING_PROGRESS_EVENT, {
    detail: { persisted },
  }));
}

function removeSessionScratch(storage: Storage, key: string): void {
  storage.removeItem(key);
}

export function isAgenticVideoEditingProgressStorageEvent(
  event: Pick<StorageEvent, "key" | "storageArea">,
): boolean {
  return typeof window !== "undefined"
    && event.storageArea === window.localStorage
    && (event.key === AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY || event.key === null);
}

export function observeAgenticVideoEditingProgressStorageEvent(
  event: Pick<StorageEvent, "key" | "newValue" | "storageArea">,
): boolean {
  if (!isAgenticVideoEditingProgressStorageEvent(event)) return false;
  const observed = normalizedProgressFromRaw(event.newValue);
  observedExternalRaw = event.newValue;
  observedExternalProgress = observed;
  memoryProgress = observed;
  return true;
}

export function isAgenticVideoEditingStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;
  try {
    window.localStorage.setItem(AGENTIC_VIDEO_EDITING_PROGRESS_PROBE_KEY, "1");
    window.localStorage.removeItem(AGENTIC_VIDEO_EDITING_PROGRESS_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

function isAgenticVideoEditingSessionStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (sessionStorageAvailable !== null) return sessionStorageAvailable;
  try {
    window.sessionStorage.setItem(AGENTIC_VIDEO_EDITING_SESSION_PROBE_KEY, "1");
    window.sessionStorage.removeItem(AGENTIC_VIDEO_EDITING_SESSION_PROBE_KEY);
    sessionStorageAvailable = true;
  } catch {
    sessionStorageAvailable = false;
  }
  return sessionStorageAvailable;
}

export function isAgenticVideoEditingPersistenceAvailable(): boolean {
  return isAgenticVideoEditingStorageAvailable()
    && isAgenticVideoEditingSessionStorageAvailable();
}

export function readAgenticVideoEditingProgress(): AgenticVideoEditingProgressRecord {
  if (typeof window === "undefined" || !isAgenticVideoEditingStorageAvailable()) {
    return { ...memoryProgress };
  }
  try {
    const raw = window.localStorage.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY);
    const stored = normalizedProgressFromRaw(raw);
    memoryProgress = observedExternalProgress
      && raw !== observedExternalRaw
      && !sameCourse20OwnedProgress(stored, observedExternalProgress)
      ? { ...stored, ...course20OwnedProgress(observedExternalProgress) }
      : stored;
    const normalizedRaw = JSON.stringify(memoryProgress);
    if (storageAvailable !== false && raw !== normalizedRaw) {
      window.localStorage.setItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY, normalizedRaw);
      observedExternalRaw = normalizedRaw;
      observedExternalProgress = { ...memoryProgress };
    }
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeAgenticVideoEditingProgress(
  record: AgenticVideoEditingProgressRecord,
): boolean {
  const intendedOwned = course20OwnedProgress({
    ...record,
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]: AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  });
  memoryProgress = { ...record, ...intendedOwned };
  let persisted = false;
  try {
    if (typeof window !== "undefined" && isAgenticVideoEditingStorageAvailable()) {
      const raw = window.localStorage.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw || "{}");
      } catch {
        holdCorruptProgress(raw);
        dispatchProgressEvents(false);
        return false;
      }
      if (!isRecord(parsed)) {
        holdCorruptProgress(raw);
        dispatchProgressEvents(false);
        return false;
      }
      const unrelated = Object.fromEntries(Object.entries(parsed).filter(
        ([key]) => !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX),
      ));
      memoryProgress = { ...unrelated, ...intendedOwned };
      const nextRaw = JSON.stringify(memoryProgress);
      window.localStorage.setItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY, nextRaw);
      if (window.localStorage.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY) !== nextRaw) {
        throw new Error("Course 20 shared progress verification failed");
      }
      observedExternalRaw = nextRaw;
      observedExternalProgress = { ...memoryProgress };
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  dispatchProgressEvents(persisted);
  return persisted;
}

export function updateAgenticVideoEditingProgress(
  mutator: (record: AgenticVideoEditingProgressRecord) => void,
): boolean {
  const record = readAgenticVideoEditingProgress();
  mutator(record);
  return writeAgenticVideoEditingProgress(record);
}

export function clearAgenticVideoEditingSessionScratch(): boolean {
  if (typeof window === "undefined") return true;
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX)) {
        removeSessionScratch(window.sessionStorage, key);
      }
    }
    return true;
  } catch {
    sessionStorageAvailable = false;
    return false;
  }
}

export function resetAgenticVideoEditingProgressAfterGlobalReset(): PersistenceResult {
  memoryProgress = {};
  observedExternalProgress = null;
  observedExternalRaw = undefined;
  if (typeof window === "undefined") return { persisted: true };
  let localResult: PersistenceResult = { persisted: true };
  try {
    const raw = window.localStorage.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY);
    if (raw !== null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { persisted: false, reason: "corrupt" };
      }
      if (!isRecord(parsed)) return { persisted: false, reason: "corrupt" };
      const remaining = Object.fromEntries(Object.entries(parsed).filter(
        ([key]) => !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX),
      ));
      if (Object.keys(remaining).length === 0) {
        window.localStorage.removeItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY);
        if (window.localStorage.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY) !== null) {
          throw new Error("Course 20 shared progress removal verification failed");
        }
      } else {
        const nextRaw = JSON.stringify(remaining);
        window.localStorage.setItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY, nextRaw);
        if (window.localStorage.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY) !== nextRaw) {
          throw new Error("Course 20 shared progress reset verification failed");
        }
      }
    }
    storageAvailable = true;
  } catch (error) {
    storageAvailable = false;
    localResult = { persisted: false, reason: persistenceFailureReason(error) };
  }
  const scratchCleared = clearAgenticVideoEditingSessionScratch();
  const persisted = localResult.persisted && scratchCleared;
  dispatchProgressEvents(persisted);
  window.dispatchEvent(new CustomEvent(
    AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
    { detail: { persisted } },
  ));
  return persisted
    ? { persisted: true }
    : localResult.persisted
      ? { persisted: false, reason: "unavailable" }
      : localResult;
}

export function resetAgenticVideoEditingProgress(): boolean {
  return resetAgenticVideoEditingProgressAfterGlobalReset().persisted;
}
