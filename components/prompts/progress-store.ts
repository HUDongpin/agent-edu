import type { PROMPT_PROGRESS_LESSON_SLUGS } from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";
import { PROMPT_PROGRESS_PROBE_KEY } from "@/lib/progress-storage-contract";
import {
  PROMPT_PROGRESS_EVENT,
  PROMPT_PROGRESS_RESET_EVENT,
  PROMPT_PROGRESS_PREFIX,
  PROMPT_PROGRESS_STORAGE_KEY,
  invalidateIncompletePromptCapstone,
  migrateLegacyPromptQuizResult,
  normalizePromptCapstoneProgress,
} from "@/lib/prompts/progress-keys";

type PromptLessonSlug = (typeof PROMPT_PROGRESS_LESSON_SLUGS)[number];
export {
  PROMPT_CAPSTONE_KEY,
  PROMPT_CAPSTONE_REQUIRED_KEY,
  PROMPT_CAPSTONE_SCORES_KEY,
  PROMPT_PROGRESS_EVENT,
  PROMPT_PROGRESS_RESET_EVENT,
  PROMPT_PROGRESS_PREFIX,
  PROMPT_PROGRESS_STORAGE_KEY,
  PROMPT_QUIZ_BANK_VERSION,
  PROMPT_QUIZ_BEST_KEY,
  PROMPT_QUIZ_DRAFT_KEY,
  PROMPT_LEGACY_UNVERSIONED_QUIZ_BANK_VERSION,
  PROMPT_QUIZ_MAX_SCORE,
  PROMPT_QUIZ_PASS_SCORE,
  PROMPT_QUIZ_PASSED_KEY,
  PROMPT_QUIZ_VERSION_KEY,
  isCurrentPromptQuizResult,
  isLegacyPromptQuizResult,
  isLegacyPromptQuizResultForBank,
  isPromptCapstonePassed,
  isPromptQuizPassed,
  migrateLegacyPromptQuizResult,
  storedPromptQuizBest,
} from "@/lib/prompts/progress-keys";

export type PromptProgressRecord = Record<string, unknown>;

let memoryProgress: PromptProgressRecord = {};
let storageAvailable: boolean | null = null;

function isProgressRecord(value: unknown): value is PromptProgressRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function ensureStorageAccess(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;

  try {
    localStorage.setItem(PROMPT_PROGRESS_PROBE_KEY, "1");
    localStorage.removeItem(PROMPT_PROGRESS_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

function holdCorruptProgress(): void {
  memoryProgress = {};
  storageAvailable = false;
}

function mergePromptNamespace(
  latest: PromptProgressRecord,
  next: PromptProgressRecord,
): PromptProgressRecord {
  const merged = { ...latest };
  for (const key of Object.keys(merged)) {
    if (key.startsWith(PROMPT_PROGRESS_PREFIX)) delete merged[key];
  }
  for (const [key, value] of Object.entries(next)) {
    if (key.startsWith(PROMPT_PROGRESS_PREFIX)) merged[key] = value;
  }
  return merged;
}

export function isPromptProgressStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== false) readPromptProgress();
  return storageAvailable === true;
}

export function promptPracticeKey(slug: PromptLessonSlug): string {
  return `prompts.lesson.${slug}.practice`;
}

export function readPromptProgress(): PromptProgressRecord {
  if (typeof window === "undefined" || !ensureStorageAccess()) {
    const record = { ...memoryProgress };
    migrateLegacyPromptQuizResult(record);
    normalizePromptCapstoneProgress(record);
    invalidateIncompletePromptCapstone(record);
    memoryProgress = record;
    return { ...record };
  }

  let raw = "{}";
  try {
    raw = localStorage.getItem(PROMPT_PROGRESS_STORAGE_KEY) || "{}";
  } catch {
    storageAvailable = false;
    return { ...memoryProgress };
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!isProgressRecord(value)) {
      holdCorruptProgress();
      return { ...memoryProgress };
    }
    const record = { ...value };
    migrateLegacyPromptQuizResult(record);
    normalizePromptCapstoneProgress(record);
    invalidateIncompletePromptCapstone(record);
    memoryProgress = record;
  } catch {
    holdCorruptProgress();
  }
  return { ...memoryProgress };
}

export function writePromptProgress(record: PromptProgressRecord): boolean {
  const nextRecord = { ...record };
  migrateLegacyPromptQuizResult(nextRecord);
  normalizePromptCapstoneProgress(nextRecord);
  invalidateIncompletePromptCapstone(nextRecord);
  memoryProgress = nextRecord;
  let persisted = false;
  try {
    if (storageAvailable !== false) {
      const raw = localStorage.getItem(PROMPT_PROGRESS_STORAGE_KEY) || "{}";
      const latest: unknown = JSON.parse(raw);
      if (!isProgressRecord(latest)) {
        holdCorruptProgress();
      } else {
        memoryProgress = mergePromptNamespace(latest, nextRecord);
        storageAvailable = true;
      }
    }
    if (storageAvailable === true) {
      localStorage.setItem(PROMPT_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  window.dispatchEvent(new CustomEvent(PROMPT_PROGRESS_EVENT));
  return persisted;
}

export function updatePromptProgress(mutator: (record: PromptProgressRecord) => void): boolean {
  const record = readPromptProgress();
  mutator(record);
  return writePromptProgress(record);
}

export function resetPromptProgress(): boolean {
  const record = readPromptProgress();
  for (const key of Object.keys(record)) {
    if (key.startsWith(PROMPT_PROGRESS_PREFIX)) delete record[key];
  }
  const persisted = writePromptProgress(record);
  window.dispatchEvent(new CustomEvent(PROMPT_PROGRESS_RESET_EVENT));
  return persisted;
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetPromptProgressAfterGlobalReset(): PersistenceResult {
  memoryProgress = {};
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(localStorage, PROMPT_PROGRESS_STORAGE_KEY);
  storageAvailable = result.persisted;
  window.dispatchEvent(new CustomEvent(PROMPT_PROGRESS_EVENT));
  window.dispatchEvent(new CustomEvent(PROMPT_PROGRESS_RESET_EVENT));
  return result;
}
