import type { PromptLessonSlug } from "@/lib/prompts";
import {
  PROMPT_PROGRESS_EVENT,
  PROMPT_PROGRESS_PREFIX,
  PROMPT_PROGRESS_STORAGE_KEY,
} from "@/lib/prompts/progress-keys";
export {
  PROMPT_CAPSTONE_KEY,
  PROMPT_CAPSTONE_REQUIRED_KEY,
  PROMPT_CAPSTONE_SCORES_KEY,
  PROMPT_PROGRESS_EVENT,
  PROMPT_PROGRESS_PREFIX,
  PROMPT_PROGRESS_STORAGE_KEY,
  PROMPT_QUIZ_BEST_KEY,
  PROMPT_QUIZ_PASSED_KEY,
} from "@/lib/prompts/progress-keys";

export type PromptProgressRecord = Record<string, unknown>;

const PROMPT_STORAGE_PROBE_KEY = "__aicourse_prompts_storage_probe__";
let memoryProgress: PromptProgressRecord = {};
let storageAvailable: boolean | null = null;

export function isPromptProgressStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;

  try {
    localStorage.setItem(PROMPT_STORAGE_PROBE_KEY, "1");
    localStorage.removeItem(PROMPT_STORAGE_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function promptPracticeKey(slug: PromptLessonSlug): string {
  return `prompts.lesson.${slug}.practice`;
}

export function readPromptProgress(): PromptProgressRecord {
  if (typeof window === "undefined" || !isPromptProgressStorageAvailable()) {
    return { ...memoryProgress };
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
    memoryProgress = value && typeof value === "object" && !Array.isArray(value)
      ? { ...value as PromptProgressRecord }
      : {};
  } catch {
    memoryProgress = {};
  }
  return { ...memoryProgress };
}

export function writePromptProgress(record: PromptProgressRecord): boolean {
  memoryProgress = { ...record };
  let persisted = false;
  try {
    if (isPromptProgressStorageAvailable()) {
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
  return writePromptProgress(record);
}
