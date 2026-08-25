import type { RAG_PROGRESS_LESSON_SLUGS } from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";
import {
  RAG_CORRUPT_PROGRESS_BACKUP_KEY,
  RAG_PROGRESS_PROBE_KEY,
} from "@/lib/progress-storage-contract";

type RagLessonSlug = (typeof RAG_PROGRESS_LESSON_SLUGS)[number];

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

let memoryProgress: RagProgressRecord = {};
let storageAvailable: boolean | null = null;

function recoverCorruptProgress(raw: string | null): void {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(RAG_CORRUPT_PROGRESS_BACKUP_KEY, raw);
    } catch {
      // Recovery must not depend on session storage being available.
    }
  }
  // Preserve the unreadable shared record. This course remains memory-only
  // until the learner explicitly performs a site-wide reset.
  storageAvailable = false;
}

function ensureStorageAccess(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;
  try {
    localStorage.setItem(RAG_PROGRESS_PROBE_KEY, "1");
    localStorage.removeItem(RAG_PROGRESS_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function isRagProgressStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== false) readRagProgress();
  return storageAvailable === true;
}

export function ragPracticeKey(slug: RagLessonSlug): string {
  return `rag.lesson.${slug}.practice`;
}

export function readRagProgress(): RagProgressRecord {
  if (typeof window === "undefined" || !ensureStorageAccess()) return { ...memoryProgress };
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
    if (storageAvailable !== false) {
      const raw = localStorage.getItem(RAG_PROGRESS_STORAGE_KEY) || "{}";
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        recoverCorruptProgress(raw);
      } else {
        storageAvailable = true;
      }
    }
    if (storageAvailable === true) {
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

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetRagProgressAfterGlobalReset(): PersistenceResult {
  memoryProgress = {};
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(localStorage, RAG_PROGRESS_STORAGE_KEY);
  storageAvailable = result.persisted;
  window.dispatchEvent(new CustomEvent(RAG_PROGRESS_EVENT));
  window.dispatchEvent(new CustomEvent(RAG_RESET_EVENT));
  return result;
}
