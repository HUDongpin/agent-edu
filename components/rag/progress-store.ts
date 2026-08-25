import type { RagLessonSlug } from "@/lib/rag";

export const RAG_PROGRESS_STORAGE_KEY = "ae.progress";
export const RAG_PROGRESS_EVENT = "aicourse:rag-progress";
export const RAG_RESET_EVENT = "aicourse:rag-progress-reset";
export const RAG_PROGRESS_PREFIX = "rag.";
export const RAG_QUIZ_BEST_KEY = "rag.quiz.best";
export const RAG_QUIZ_PASSED_KEY = "rag.quiz.passed";
export const RAG_QUIZ_DRAFT_KEY = "rag.quiz.draft.v1";
export const RAG_CAPSTONE_KEY = "rag.capstone.v1";
export const RAG_CAPSTONE_DRAFT_KEY = "rag.capstone.draft.v1";

export type RagProgressRecord = Record<string, unknown>;

const STORAGE_PROBE_KEY = "__aicourse_rag_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.corrupt-backup";
let memoryProgress: RagProgressRecord = {};
let storageAvailable: boolean | null = null;

function recoverCorruptProgress(raw: string | null): void {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // Recovery must not depend on session storage being available.
    }
  }
  try {
    localStorage.setItem(RAG_PROGRESS_STORAGE_KEY, "{}");
  } catch {
    storageAvailable = false;
  }
}

export function isRagProgressStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, "1");
    localStorage.removeItem(STORAGE_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function ragPracticeKey(slug: RagLessonSlug): string {
  return `rag.lesson.${slug}.practice`;
}

export function readRagProgress(): RagProgressRecord {
  if (typeof window === "undefined" || !isRagProgressStorageAvailable()) return { ...memoryProgress };
  try {
    const raw = localStorage.getItem(RAG_PROGRESS_STORAGE_KEY);
    let value: unknown;
    try {
      value = JSON.parse(raw || "{}");
    } catch {
      recoverCorruptProgress(raw);
      return { ...memoryProgress };
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      recoverCorruptProgress(raw);
      return { ...memoryProgress };
    }
    memoryProgress = { ...value as RagProgressRecord };
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeRagProgress(record: RagProgressRecord): boolean {
  memoryProgress = { ...record };
  let persisted = false;
  try {
    if (isRagProgressStorageAvailable()) {
      localStorage.setItem(RAG_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  window.dispatchEvent(new CustomEvent(RAG_PROGRESS_EVENT));
  return persisted;
}

export function updateRagProgress(mutator: (record: RagProgressRecord) => void): boolean {
  const record = readRagProgress();
  mutator(record);
  return writeRagProgress(record);
}

export function resetRagProgress(): boolean {
  const record = readRagProgress();
  for (const key of Object.keys(record)) if (key.startsWith(RAG_PROGRESS_PREFIX)) delete record[key];
  const persisted = writeRagProgress(record);
  window.dispatchEvent(new CustomEvent(RAG_RESET_EVENT));
  return persisted;
}
