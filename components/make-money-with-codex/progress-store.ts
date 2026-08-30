"use client";

import {
  MAKE_MONEY_PROGRESS_LESSON_SLUGS,
  MAKE_MONEY_PROGRESS_SCHEMA,
  type MakeMoneyProgressLessonSlug,
} from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";
import { INCOME_PROGRESS_PROBE_KEY } from "@/lib/progress-storage-contract";

const MAKE_MONEY_WITH_CODEX_LESSON_SLUGS = MAKE_MONEY_PROGRESS_LESSON_SLUGS;
const MAKE_MONEY_WITH_CODEX_COURSE_VERSION = MAKE_MONEY_PROGRESS_SCHEMA.courseVersion;
const MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY =
  MAKE_MONEY_PROGRESS_SCHEMA.courseVersionKey;
const MAKE_MONEY_WITH_CODEX_QUIZ_VERSION = MAKE_MONEY_PROGRESS_SCHEMA.quizVersion;
const MAKE_MONEY_WITH_CODEX_QUIZ_QUESTION_COUNT =
  MAKE_MONEY_PROGRESS_SCHEMA.quizQuestionCount;
type CodexIncomeLessonSlug = MakeMoneyProgressLessonSlug;

export const SHARED_PROGRESS_KEY = "ae.progress";
export const INCOME_PROGRESS_EVENT = "aicourse:make-money-with-codex-progress";
export const INCOME_LESSON_KEY_PREFIX = "make-money-with-codex.lesson.";
export const INCOME_QUIZ_BEST_KEY = "make-money-with-codex.quiz.best";
export const INCOME_QUIZ_PASSED_KEY = "make-money-with-codex.quiz.passed";
export const INCOME_QUIZ_VERSION_KEY = "make-money-with-codex.quiz.version";
export const INCOME_CAPSTONE_CHECKS_KEY = "make-money-with-codex.capstone.checks";
export const INCOME_CAPSTONE_READY_KEY = "make-money-with-codex.capstone.v1";
export const INCOME_CAPSTONE_ITEM_COUNT = MAKE_MONEY_PROGRESS_SCHEMA.capstoneItemCount;
export const INCOME_COURSE_VERSION_KEY = MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY;

const validLessonSlugs = new Set<string>(MAKE_MONEY_WITH_CODEX_LESSON_SLUGS);

export type IncomeProgress = {
  readonly lessons: Partial<Record<CodexIncomeLessonSlug, true>>;
  readonly quizBest: number;
  readonly quizPassed: boolean;
  readonly capstoneChecks: readonly boolean[];
  readonly capstoneReady: boolean;
};

export const EMPTY_INCOME_PROGRESS: IncomeProgress = Object.freeze({
  lessons: Object.freeze({}),
  quizBest: 0,
  quizPassed: false,
  capstoneChecks: Object.freeze(Array.from({ length: INCOME_CAPSTONE_ITEM_COUNT }, () => false)),
  capstoneReady: false,
});

let cachedRaw: string | null | undefined;
let cachedProgress: IncomeProgress = EMPTY_INCOME_PROGRESS;
let memoryRecord: Record<string, unknown> = {};
let storageDenied = false;

function parseRecord(raw: string | null): Record<string, unknown> | null {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function fromRecord(record: Record<string, unknown>): IncomeProgress {
  if (record[INCOME_COURSE_VERSION_KEY] !== MAKE_MONEY_WITH_CODEX_COURSE_VERSION) {
    return EMPTY_INCOME_PROGRESS;
  }
  const lessons: Partial<Record<CodexIncomeLessonSlug, true>> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!key.startsWith(INCOME_LESSON_KEY_PREFIX) || value !== true) continue;
    const rawSlug = key.slice(INCOME_LESSON_KEY_PREFIX.length);
    if (!validLessonSlugs.has(rawSlug)) continue;
    const slug = rawSlug as CodexIncomeLessonSlug;
    lessons[slug] = true;
  }
  const currentQuizVersion = record[INCOME_QUIZ_VERSION_KEY] === MAKE_MONEY_WITH_CODEX_QUIZ_VERSION;
  const quizBest = currentQuizVersion && typeof record[INCOME_QUIZ_BEST_KEY] === "number"
    ? Math.max(0, Math.min(MAKE_MONEY_WITH_CODEX_QUIZ_QUESTION_COUNT, Math.floor(record[INCOME_QUIZ_BEST_KEY])))
    : 0;
  const rawChecks = record[INCOME_CAPSTONE_CHECKS_KEY];
  const capstoneChecks = Array.isArray(rawChecks) && rawChecks.length === INCOME_CAPSTONE_ITEM_COUNT
    ? rawChecks.map((value) => value === true)
    : EMPTY_INCOME_PROGRESS.capstoneChecks;

  return {
    lessons,
    quizBest,
    quizPassed: currentQuizVersion && record[INCOME_QUIZ_PASSED_KEY] === true,
    capstoneChecks,
    capstoneReady: capstoneChecks.every(Boolean) && record[INCOME_CAPSTONE_READY_KEY] === true,
  };
}

function recordForCurrentCourseVersion(record: Record<string, unknown>): Record<string, unknown> {
  if (record[INCOME_COURSE_VERSION_KEY] === MAKE_MONEY_WITH_CODEX_COURSE_VERSION) {
    return record;
  }
  const next = { ...record };
  for (const key of Object.keys(next)) {
    if (key.startsWith("make-money-with-codex.")) delete next[key];
  }
  next[INCOME_COURSE_VERSION_KEY] = MAKE_MONEY_WITH_CODEX_COURSE_VERSION;
  return next;
}

export function readIncomeProgress(): IncomeProgress {
  if (typeof window === "undefined") return EMPTY_INCOME_PROGRESS;
  if (storageDenied) {
    cachedProgress = fromRecord(memoryRecord);
    return cachedProgress;
  }
  try {
    const raw = window.localStorage.getItem(SHARED_PROGRESS_KEY);
    if (raw === cachedRaw) return cachedProgress;
    cachedRaw = raw;
    const parsed = parseRecord(raw);
    if (!parsed) {
      memoryRecord = {};
      cachedProgress = EMPTY_INCOME_PROGRESS;
      storageDenied = true;
      return cachedProgress;
    }
    memoryRecord = parsed;
    cachedProgress = fromRecord(memoryRecord);
    return cachedProgress;
  } catch {
    storageDenied = true;
    cachedProgress = fromRecord(memoryRecord);
    return cachedProgress;
  }
}

function writeRecord(record: Record<string, unknown>): boolean {
  memoryRecord = record;
  cachedProgress = fromRecord(record);
  if (storageDenied) {
    window.dispatchEvent(new Event(INCOME_PROGRESS_EVENT));
    return false;
  }
  let persisted = false;
  try {
    const current = parseRecord(window.localStorage.getItem(SHARED_PROGRESS_KEY));
    if (!current) {
      storageDenied = true;
      window.dispatchEvent(new Event(INCOME_PROGRESS_EVENT));
      return false;
    }
    const raw = JSON.stringify(record);
    window.localStorage.setItem(SHARED_PROGRESS_KEY, raw);
    cachedRaw = raw;
    storageDenied = false;
    persisted = true;
  } catch {
    cachedRaw = undefined;
    storageDenied = true;
  }
  window.dispatchEvent(new Event(INCOME_PROGRESS_EVENT));
  return persisted;
}

export function updateIncomeRecord(
  update: (record: Record<string, unknown>) => Record<string, unknown>,
): boolean {
  if (typeof window === "undefined") return false;
  let record = memoryRecord;
  if (!storageDenied) {
    try {
      const parsed = parseRecord(window.localStorage.getItem(SHARED_PROGRESS_KEY));
      if (!parsed) {
        storageDenied = true;
        record = {};
      } else {
        record = parsed;
      }
    } catch {
      storageDenied = true;
    }
  }
  return writeRecord(update(recordForCurrentCourseVersion(record)));
}

export function setIncomeLesson(slug: CodexIncomeLessonSlug, complete: boolean): boolean {
  return updateIncomeRecord((record) => ({
    ...record,
    [`${INCOME_LESSON_KEY_PREFIX}${slug}`]: complete,
  }));
}

export function setIncomeQuiz(best: number, passed: boolean): boolean {
  return updateIncomeRecord((record) => {
    const sameVersion = record[INCOME_QUIZ_VERSION_KEY] === MAKE_MONEY_WITH_CODEX_QUIZ_VERSION;
    return {
      ...record,
      [INCOME_QUIZ_BEST_KEY]: Math.max(
        sameVersion && typeof record[INCOME_QUIZ_BEST_KEY] === "number" ? record[INCOME_QUIZ_BEST_KEY] : 0,
        best,
      ),
      [INCOME_QUIZ_PASSED_KEY]: (sameVersion && record[INCOME_QUIZ_PASSED_KEY] === true) || passed,
      [INCOME_QUIZ_VERSION_KEY]: MAKE_MONEY_WITH_CODEX_QUIZ_VERSION,
    };
  });
}

export function setIncomeCapstone(checks: readonly boolean[]): boolean {
  const normalized = Array.from({ length: INCOME_CAPSTONE_ITEM_COUNT }, (_, index) => checks[index] === true);
  return updateIncomeRecord((record) => ({
    ...record,
    [INCOME_CAPSTONE_CHECKS_KEY]: normalized,
    [INCOME_CAPSTONE_READY_KEY]: normalized.every(Boolean),
  }));
}

export function resetIncomeProgress(): boolean {
  return updateIncomeRecord((record) => {
    const next = { ...record };
    for (const key of Object.keys(next)) {
      if (key.startsWith("make-money-with-codex.")) delete next[key];
    }
    return next;
  });
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetIncomeProgressAfterGlobalReset(): PersistenceResult {
  memoryRecord = {};
  cachedProgress = EMPTY_INCOME_PROGRESS;
  cachedRaw = null;
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(window.localStorage, SHARED_PROGRESS_KEY);
  storageDenied = !result.persisted;
  window.dispatchEvent(new Event(INCOME_PROGRESS_EVENT));
  return result;
}

export function subscribeToIncomeProgress(callback: () => void): () => void {
  const refresh = () => {
    cachedRaw = undefined;
    callback();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === null || event.key === SHARED_PROGRESS_KEY) refresh();
  };
  window.addEventListener(INCOME_PROGRESS_EVENT, callback);
  window.addEventListener("storage", storage);
  window.addEventListener("focus", refresh);
  return () => {
    window.removeEventListener(INCOME_PROGRESS_EVENT, callback);
    window.removeEventListener("storage", storage);
    window.removeEventListener("focus", refresh);
  };
}

export function incomeStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageDenied) return false;
  try {
    window.localStorage.setItem(INCOME_PROGRESS_PROBE_KEY, "1");
    window.localStorage.removeItem(INCOME_PROGRESS_PROBE_KEY);
    readIncomeProgress();
    if (storageDenied) return false;
    return true;
  } catch {
    return false;
  }
}
