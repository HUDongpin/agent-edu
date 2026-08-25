"use client";

import type { PersistenceResult } from "@/lib/public-progress-contract";
import {
  persistenceFailureReason as reasonForError,
} from "@/lib/progress-persistence";
import { GROK_PROGRESS_PROBE_KEY } from "@/lib/progress-storage-contract";
import type { GROK_PROGRESS_LESSON_SLUGS } from "@/lib/progress-topology";
import {
  GROK_CAPSTONE_ITEM_COUNT,
  GROK_PROGRESS_STORAGE_KEY,
  GROK_QUIZ_PASSING_SCORE,
  GROK_QUIZ_QUESTION_COUNT,
} from "@/lib/grok/progress";

type GrokLessonSlug = (typeof GROK_PROGRESS_LESSON_SLUGS)[number];

export const GROK_PROGRESS_KEY = GROK_PROGRESS_STORAGE_KEY;
export const GROK_PROGRESS_EVENT = "aicourse:grok-progress";

export type GrokProgress = {
  readonly schemaVersion: 1;
  readonly lessons: Partial<Record<GrokLessonSlug, true>>;
  readonly quizBest: number;
  readonly quizPassed: boolean;
  readonly capstoneChecks: readonly boolean[];
  readonly capstoneReady: boolean;
};

export const EMPTY_GROK_PROGRESS: GrokProgress = Object.freeze({
  schemaVersion: 1,
  lessons: Object.freeze({}),
  quizBest: 0,
  quizPassed: false,
  capstoneChecks: Object.freeze(Array.from(
    { length: GROK_CAPSTONE_ITEM_COUNT },
    () => false,
  )),
  capstoneReady: false,
});

let cachedRaw: string | null | undefined;
let cachedProgress: GrokProgress = EMPTY_GROK_PROGRESS;
let persistenceAvailable: boolean | null = null;
let failureReason: PersistenceResult["reason"];

function isProgressObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalise(value: unknown): GrokProgress {
  if (!value || typeof value !== "object") return EMPTY_GROK_PROGRESS;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== 1) return EMPTY_GROK_PROGRESS;

  const rawLessons = record.lessons && typeof record.lessons === "object"
    ? record.lessons as Record<string, unknown>
    : {};
  const lessons = Object.fromEntries(
    Object.entries(rawLessons).filter(([, complete]) => complete === true),
  ) as Partial<Record<GrokLessonSlug, true>>;
  const quizBest = typeof record.quizBest === "number"
    && Number.isInteger(record.quizBest)
    && record.quizBest >= 0
    && record.quizBest <= GROK_QUIZ_QUESTION_COUNT
    ? record.quizBest
    : 0;
  const capstoneChecks = Array.isArray(record.capstoneChecks)
    && record.capstoneChecks.length === GROK_CAPSTONE_ITEM_COUNT
    ? record.capstoneChecks.map((item) => item === true)
    : EMPTY_GROK_PROGRESS.capstoneChecks;

  return {
    schemaVersion: 1,
    lessons,
    quizBest,
    quizPassed: record.quizPassed === true && quizBest >= GROK_QUIZ_PASSING_SCORE,
    capstoneChecks,
    capstoneReady: record.capstoneReady === true && capstoneChecks.every(Boolean),
  };
}

export function readGrokProgress(): GrokProgress {
  if (typeof window === "undefined") return EMPTY_GROK_PROGRESS;
  if (persistenceAvailable === false) return cachedProgress;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(GROK_PROGRESS_KEY);
  } catch (error) {
    cachedRaw = undefined;
    cachedProgress = EMPTY_GROK_PROGRESS;
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    return EMPTY_GROK_PROGRESS;
  }
  if (raw === cachedRaw) return cachedProgress;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!isProgressObject(parsed)) {
      cachedRaw = raw;
      cachedProgress = EMPTY_GROK_PROGRESS;
      persistenceAvailable = false;
      failureReason = "corrupt";
      return cachedProgress;
    }
    const nextProgress = raw ? normalise(parsed) : EMPTY_GROK_PROGRESS;
    cachedRaw = raw;
    cachedProgress = nextProgress;
    persistenceAvailable = true;
    failureReason = undefined;
    return cachedProgress;
  } catch {
    cachedRaw = raw;
    cachedProgress = EMPTY_GROK_PROGRESS;
    persistenceAvailable = false;
    failureReason = "corrupt";
    return EMPTY_GROK_PROGRESS;
  }
}

export function writeGrokProgress(progress: GrokProgress): boolean {
  cachedProgress = progress;
  if (typeof window === "undefined") return false;
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return false;
  }
  try {
    const currentRaw = window.localStorage.getItem(GROK_PROGRESS_KEY);
    if (currentRaw) {
      const current: unknown = JSON.parse(currentRaw);
      if (!isProgressObject(current)) {
        persistenceAvailable = false;
        window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
        return false;
      }
    }
    const raw = JSON.stringify(progress);
    window.localStorage.setItem(GROK_PROGRESS_KEY, raw);
    cachedRaw = raw;
    persistenceAvailable = true;
    failureReason = undefined;
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return true;
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return false;
  }
}

export function updateGrokProgress(
  update: (current: GrokProgress) => GrokProgress,
): boolean {
  return writeGrokProgress(update(readGrokProgress()));
}

export function resetGrokProgress(): boolean {
  cachedProgress = EMPTY_GROK_PROGRESS;
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return false;
  }
  try {
    const currentRaw = window.localStorage.getItem(GROK_PROGRESS_KEY);
    if (currentRaw) {
      const current: unknown = JSON.parse(currentRaw);
      if (!isProgressObject(current)) {
        persistenceAvailable = false;
        window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
        return false;
      }
    }
    window.localStorage.removeItem(GROK_PROGRESS_KEY);
    cachedRaw = null;
    persistenceAvailable = true;
    failureReason = undefined;
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return true;
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return false;
  }
}

/** Reset session memory, but quarantine an unreadable persistent record. */
export function resetGrokProgressAfterGlobalReset(): PersistenceResult {
  cachedRaw = undefined;
  cachedProgress = EMPTY_GROK_PROGRESS;
  if (typeof window === "undefined") {
    persistenceAvailable = false;
    failureReason = "unavailable";
    return { persisted: false, reason: failureReason };
  }
  try {
    const raw = window.localStorage.getItem(GROK_PROGRESS_KEY);
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isProgressObject(parsed)) {
          persistenceAvailable = false;
          failureReason = "corrupt";
          window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
          return { persisted: false, reason: failureReason };
        }
      } catch {
        persistenceAvailable = false;
        failureReason = "corrupt";
        window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
        return { persisted: false, reason: failureReason };
      }
    }
    window.localStorage.removeItem(GROK_PROGRESS_KEY);
    cachedRaw = null;
    persistenceAvailable = true;
    failureReason = undefined;
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return { persisted: true };
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
    return { persisted: false, reason: failureReason };
  }
}

export function subscribeToGrokProgress(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === GROK_PROGRESS_KEY || event.key === null) {
      cachedRaw = undefined;
      callback();
    }
  };
  window.addEventListener(GROK_PROGRESS_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(GROK_PROGRESS_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function grokStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (persistenceAvailable === false) return false;
  try {
    window.localStorage.setItem(GROK_PROGRESS_PROBE_KEY, "1");
    window.localStorage.removeItem(GROK_PROGRESS_PROBE_KEY);
    readGrokProgress();
    return persistenceAvailable === true;
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForError(error);
    return false;
  }
}
