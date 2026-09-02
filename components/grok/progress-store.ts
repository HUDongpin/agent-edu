"use client";

import type { PersistenceResult } from "@/lib/public-progress-contract";
import {
  clearCorruptProgressAfterVerifiedQuarantine,
  persistenceFailureReason as reasonForError,
} from "@/lib/progress-persistence";
import {
  GROK_PROGRESS_PROBE_KEY,
  GROK_PROGRESS_RESET_QUARANTINE_KEY,
} from "@/lib/progress-storage-contract";
import { GROK_PROGRESS_LESSON_SLUGS } from "@/lib/progress-topology";
import {
  GROK_CAPSTONE_ITEM_COUNT,
  GROK_PROGRESS_STORAGE_KEY,
  GROK_QUIZ_PASSING_SCORE,
  GROK_QUIZ_QUESTION_COUNT,
} from "@/lib/grok/progress";
import { clearGrokQuizAttempt } from "./quiz-attempt-store";
import { clearGrokTaskContract } from "./task-contract-draft-store";

type GrokLessonSlug = (typeof GROK_PROGRESS_LESSON_SLUGS)[number];

export const GROK_PROGRESS_KEY = GROK_PROGRESS_STORAGE_KEY;
export const GROK_PROGRESS_EVENT = "aicourse:grok-progress";

export type GrokProgress = {
  /** Version 1 remains backward compatible; lastVisitedLesson is optional. */
  readonly schemaVersion: 1;
  readonly lessons: Partial<Record<GrokLessonSlug, true>>;
  readonly lastVisitedLesson?: GrokLessonSlug;
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

const lessonSlugSet = new Set<string>(GROK_PROGRESS_LESSON_SLUGS);

let cachedRaw: string | null | undefined;
let cachedProgress: GrokProgress = EMPTY_GROK_PROGRESS;
let persistenceAvailable: boolean | null = null;
let failureReason: PersistenceResult["reason"];

function isProgressObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLessonSlug(value: unknown): value is GrokLessonSlug {
  return typeof value === "string" && lessonSlugSet.has(value);
}

/**
 * Parse and normalise the durable v1 record. Optional v1 fields stay optional,
 * while an unreadable top-level record or unsupported schema fails closed.
 */
function normalise(value: unknown): GrokProgress | null {
  if (!isProgressObject(value) || value.schemaVersion !== 1) return null;

  const hasLastVisitedLesson = Object.prototype.hasOwnProperty.call(
    value,
    "lastVisitedLesson",
  );
  if (!isProgressObject(value.lessons)
    || Object.entries(value.lessons).some(([slug, complete]) => (
      !lessonSlugSet.has(slug) || complete !== true
    ))
    || typeof value.quizBest !== "number"
    || !Number.isInteger(value.quizBest)
    || value.quizBest < 0
    || value.quizBest > GROK_QUIZ_QUESTION_COUNT
    || typeof value.quizPassed !== "boolean"
    || !Array.isArray(value.capstoneChecks)
    || value.capstoneChecks.length !== GROK_CAPSTONE_ITEM_COUNT
    || value.capstoneChecks.some((item) => typeof item !== "boolean")
    || typeof value.capstoneReady !== "boolean"
    || (hasLastVisitedLesson && !isLessonSlug(value.lastVisitedLesson))) {
    return null;
  }

  const rawLessons = value.lessons;
  const lessons = Object.fromEntries(
    Object.entries(rawLessons).filter(([slug, complete]) => (
      lessonSlugSet.has(slug) && complete === true
    )),
  ) as Partial<Record<GrokLessonSlug, true>>;
  const quizBest = value.quizBest;
  const capstoneChecks = value.capstoneChecks;
  const lastVisitedLesson = isLessonSlug(value.lastVisitedLesson)
    ? value.lastVisitedLesson
    : undefined;

  return {
    schemaVersion: 1,
    lessons,
    ...(lastVisitedLesson ? { lastVisitedLesson } : {}),
    quizBest,
    quizPassed: value.quizPassed === true && quizBest >= GROK_QUIZ_PASSING_SCORE,
    capstoneChecks,
    capstoneReady: value.capstoneReady === true && capstoneChecks.every(Boolean),
  };
}

function parseRawProgress(raw: string): GrokProgress | null {
  try {
    return normalise(JSON.parse(raw));
  } catch {
    return null;
  }
}

function announceProgressChange(): void {
  window.dispatchEvent(new Event(GROK_PROGRESS_EVENT));
}

function markFailure(reason: PersistenceResult["reason"]): void {
  persistenceAvailable = false;
  failureReason = reason ?? "unavailable";
}

function clearGrokSessionDrafts(): PersistenceResult {
  const quiz = clearGrokQuizAttempt();
  const taskContract = clearGrokTaskContract();
  if (quiz.persisted && taskContract.persisted) return { persisted: true };
  return {
    persisted: false,
    reason: quiz.reason ?? taskContract.reason ?? "unavailable",
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
    markFailure(reasonForError(error));
    return cachedProgress;
  }

  if (raw === cachedRaw) return cachedProgress;
  if (raw === null) {
    cachedRaw = null;
    cachedProgress = EMPTY_GROK_PROGRESS;
    persistenceAvailable = true;
    failureReason = undefined;
    return cachedProgress;
  }

  const parsed = parseRawProgress(raw);
  cachedRaw = raw;
  if (!parsed) {
    cachedProgress = EMPTY_GROK_PROGRESS;
    markFailure("corrupt");
    return cachedProgress;
  }

  cachedProgress = parsed;
  persistenceAvailable = true;
  failureReason = undefined;
  return cachedProgress;
}

export function writeGrokProgress(progress: GrokProgress): boolean {
  cachedProgress = progress;
  if (typeof window === "undefined") return false;
  if (persistenceAvailable === false) {
    announceProgressChange();
    return false;
  }

  try {
    const currentRaw = window.localStorage.getItem(GROK_PROGRESS_KEY);
    if (currentRaw !== null && !parseRawProgress(currentRaw)) {
      cachedRaw = currentRaw;
      markFailure("corrupt");
      announceProgressChange();
      return false;
    }

    const raw = JSON.stringify(progress);
    window.localStorage.setItem(GROK_PROGRESS_KEY, raw);
    cachedRaw = raw;
    persistenceAvailable = true;
    failureReason = undefined;
    announceProgressChange();
    return true;
  } catch (error) {
    markFailure(reasonForError(error));
    announceProgressChange();
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
  if (typeof window === "undefined") return false;
  if (persistenceAvailable === false) {
    announceProgressChange();
    return false;
  }

  try {
    const currentRaw = window.localStorage.getItem(GROK_PROGRESS_KEY);
    if (currentRaw !== null && !parseRawProgress(currentRaw)) {
      cachedRaw = currentRaw;
      markFailure("corrupt");
      announceProgressChange();
      return false;
    }
    window.localStorage.removeItem(GROK_PROGRESS_KEY);
    const sessionReset = clearGrokSessionDrafts();
    if (!sessionReset.persisted) {
      markFailure(sessionReset.reason);
      announceProgressChange();
      return false;
    }
    cachedRaw = null;
    persistenceAvailable = true;
    failureReason = undefined;
    announceProgressChange();
    return true;
  } catch (error) {
    markFailure(reasonForError(error));
    announceProgressChange();
    return false;
  }
}

function resetAfterVerifiedQuarantine(raw: string): PersistenceResult {
  const reset = clearCorruptProgressAfterVerifiedQuarantine({
    storage: window.localStorage,
    sourceKey: GROK_PROGRESS_KEY,
    quarantineKey: GROK_PROGRESS_RESET_QUARANTINE_KEY,
    corruptRaw: raw,
  });
  cachedProgress = EMPTY_GROK_PROGRESS;
  persistenceAvailable = reset.persisted;
  // A failed repair leaves the known-corrupt active record byte-for-byte
  // intact; keep the learner-facing diagnosis precise even if the quarantine
  // conflict itself is reported as unavailable to the reset caller.
  failureReason = reset.persisted ? undefined : "corrupt";
  cachedRaw = reset.persisted ? null : raw;
  announceProgressChange();
  return reset;
}

/**
 * Learner-initiated repair. Unreadable bytes are copied and read back exactly
 * before the active record is removed; a quarantine conflict leaves it intact.
 */
export function repairGrokProgress(): PersistenceResult {
  cachedProgress = EMPTY_GROK_PROGRESS;
  if (typeof window === "undefined") {
    markFailure("unavailable");
    return { persisted: false, reason: failureReason };
  }

  try {
    const raw = window.localStorage.getItem(GROK_PROGRESS_KEY);
    if (raw === null) {
      cachedRaw = null;
      persistenceAvailable = true;
      failureReason = undefined;
      announceProgressChange();
      return { persisted: true };
    }

    const parsed = parseRawProgress(raw);
    if (parsed) {
      cachedRaw = raw;
      cachedProgress = parsed;
      persistenceAvailable = true;
      failureReason = undefined;
      announceProgressChange();
      return { persisted: true };
    }

    return resetAfterVerifiedQuarantine(raw);
  } catch (error) {
    markFailure(reasonForError(error));
    announceProgressChange();
    return { persisted: false, reason: failureReason };
  }
}

/** Reset session memory, but quarantine an unreadable persistent record. */
export function resetGrokProgressAfterGlobalReset(): PersistenceResult {
  cachedRaw = undefined;
  cachedProgress = EMPTY_GROK_PROGRESS;
  if (typeof window === "undefined") {
    markFailure("unavailable");
    return { persisted: false, reason: failureReason };
  }

  try {
    const raw = window.localStorage.getItem(GROK_PROGRESS_KEY);
    if (raw !== null && !parseRawProgress(raw)) {
      const reset = resetAfterVerifiedQuarantine(raw);
      if (!reset.persisted) return reset;
      const sessionReset = clearGrokSessionDrafts();
      if (!sessionReset.persisted) {
        markFailure(sessionReset.reason);
        announceProgressChange();
        return {
          ...sessionReset,
          ...(reset.quarantined ? { quarantined: true } : {}),
        };
      }
      return reset;
    }
    window.localStorage.removeItem(GROK_PROGRESS_KEY);
    const sessionReset = clearGrokSessionDrafts();
    if (!sessionReset.persisted) {
      markFailure(sessionReset.reason);
      announceProgressChange();
      return sessionReset;
    }
    cachedRaw = null;
    persistenceAvailable = true;
    failureReason = undefined;
    announceProgressChange();
    return { persisted: true };
  } catch (error) {
    markFailure(reasonForError(error));
    announceProgressChange();
    return { persisted: false, reason: failureReason };
  }
}

export function subscribeToGrokProgress(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === GROK_PROGRESS_KEY || event.key === null) {
      cachedRaw = undefined;
      persistenceAvailable = null;
      failureReason = undefined;
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
    markFailure(reasonForError(error));
    return false;
  }
}

export function grokStorageFailureReason(): PersistenceResult["reason"] {
  if (typeof window === "undefined") return undefined;
  if (persistenceAvailable === null) readGrokProgress();
  return failureReason;
}
