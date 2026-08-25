"use client";

import type { GrokLessonSlug } from "@/lib/grok/types";
import {
  GROK_CAPSTONE_ITEM_COUNT,
  GROK_PROGRESS_STORAGE_KEY,
  GROK_QUIZ_PASSING_SCORE,
  GROK_QUIZ_QUESTION_COUNT,
} from "@/lib/grok/progress";

export const GROK_PROGRESS_KEY = GROK_PROGRESS_STORAGE_KEY;
const EVENT_NAME = "aicourse:grok-progress";

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
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(GROK_PROGRESS_KEY);
  } catch {
    cachedRaw = undefined;
    cachedProgress = EMPTY_GROK_PROGRESS;
    return EMPTY_GROK_PROGRESS;
  }
  if (raw === cachedRaw) return cachedProgress;
  try {
    const nextProgress = raw ? normalise(JSON.parse(raw)) : EMPTY_GROK_PROGRESS;
    cachedRaw = raw;
    cachedProgress = nextProgress;
    return cachedProgress;
  } catch {
    cachedRaw = raw;
    cachedProgress = EMPTY_GROK_PROGRESS;
    return EMPTY_GROK_PROGRESS;
  }
}

export function writeGrokProgress(progress: GrokProgress): boolean {
  try {
    const raw = JSON.stringify(progress);
    window.localStorage.setItem(GROK_PROGRESS_KEY, raw);
    cachedRaw = raw;
    cachedProgress = progress;
    window.dispatchEvent(new Event(EVENT_NAME));
    return true;
  } catch {
    return false;
  }
}

export function updateGrokProgress(
  update: (current: GrokProgress) => GrokProgress,
): boolean {
  return writeGrokProgress(update(readGrokProgress()));
}

export function resetGrokProgress(): boolean {
  try {
    window.localStorage.removeItem(GROK_PROGRESS_KEY);
    cachedRaw = null;
    cachedProgress = EMPTY_GROK_PROGRESS;
    window.dispatchEvent(new Event(EVENT_NAME));
    return true;
  } catch {
    return false;
  }
}

export function subscribeToGrokProgress(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === GROK_PROGRESS_KEY || event.key === null) {
      cachedRaw = undefined;
      callback();
    }
  };
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function grokStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const key = `${GROK_PROGRESS_KEY}.probe`;
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
