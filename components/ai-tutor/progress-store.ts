import {
  AI_TUTOR_PROGRESS_SCHEMA,
} from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";
import {
  AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY,
  AI_TUTOR_PROGRESS_PROBE_KEY,
} from "@/lib/progress-storage-contract";

const AI_TUTOR_PROGRESS_EVENT = AI_TUTOR_PROGRESS_SCHEMA.progressEvent;
const AI_TUTOR_PROGRESS_PREFIX = AI_TUTOR_PROGRESS_SCHEMA.prefix;
const AI_TUTOR_PROGRESS_RESET_EVENT = AI_TUTOR_PROGRESS_SCHEMA.resetEvent;
const AI_TUTOR_PROGRESS_VERSION = AI_TUTOR_PROGRESS_SCHEMA.version;
const AI_TUTOR_PROGRESS_VERSION_KEY = AI_TUTOR_PROGRESS_SCHEMA.versionKey;

function isCurrentAiTutorProgress(progress: Record<string, unknown>): boolean {
  return progress[AI_TUTOR_PROGRESS_VERSION_KEY] === AI_TUTOR_PROGRESS_VERSION;
}

export const AI_TUTOR_PROGRESS_STORAGE_KEY = "ae.progress";
export type AiTutorProgressRecord = Record<string, unknown>;

let memoryProgress: AiTutorProgressRecord = {};
let storageAvailable: boolean | null = null;

function holdCorruptProgress(raw: string | null): void {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY, raw);
    } catch {
      // The unreadable record remains untouched even when backup storage is unavailable.
    }
  }
  // Do not overwrite a shared, unreadable record. Keep Course 13 in memory for this session.
  storageAvailable = false;
}

function ensureStorageAccess(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;
  try {
    localStorage.setItem(AI_TUTOR_PROGRESS_PROBE_KEY, "1");
    localStorage.removeItem(AI_TUTOR_PROGRESS_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function isAiTutorProgressStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== false) readAiTutorProgress();
  return storageAvailable === true;
}

export function readAiTutorProgress(): AiTutorProgressRecord {
  if (typeof window === "undefined" || !ensureStorageAccess()) {
    return { ...memoryProgress };
  }
  try {
    const raw = localStorage.getItem(AI_TUTOR_PROGRESS_STORAGE_KEY);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      holdCorruptProgress(raw);
      return { ...memoryProgress };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      holdCorruptProgress(raw);
      return { ...memoryProgress };
    }
    memoryProgress = { ...(parsed as AiTutorProgressRecord) };
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeAiTutorProgress(record: AiTutorProgressRecord): boolean {
  memoryProgress = {
    ...record,
    [AI_TUTOR_PROGRESS_VERSION_KEY]: AI_TUTOR_PROGRESS_VERSION,
  };
  let persisted = false;
  try {
    if (storageAvailable !== false) {
      const raw = localStorage.getItem(AI_TUTOR_PROGRESS_STORAGE_KEY) || "{}";
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        holdCorruptProgress(raw);
      } else {
        storageAvailable = true;
      }
    }
    if (storageAvailable === true) {
      localStorage.setItem(AI_TUTOR_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  window.dispatchEvent(new CustomEvent(AI_TUTOR_PROGRESS_EVENT));
  return persisted;
}

export function updateAiTutorProgress(
  mutator: (record: AiTutorProgressRecord) => void,
): boolean {
  const record = readAiTutorProgress();
  if (!isCurrentAiTutorProgress(record)) {
    for (const key of Object.keys(record)) {
      if (key.startsWith(AI_TUTOR_PROGRESS_PREFIX)) delete record[key];
    }
  }
  mutator(record);
  return writeAiTutorProgress(record);
}

export function resetAiTutorProgress(): boolean {
  const record = readAiTutorProgress();
  for (const key of Object.keys(record)) {
    if (key.startsWith(AI_TUTOR_PROGRESS_PREFIX)) delete record[key];
  }
  const persisted = writeAiTutorProgress(record);
  window.dispatchEvent(new CustomEvent(AI_TUTOR_PROGRESS_RESET_EVENT));
  return persisted;
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetAiTutorProgressAfterGlobalReset(): PersistenceResult {
  memoryProgress = {};
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(localStorage, AI_TUTOR_PROGRESS_STORAGE_KEY);
  storageAvailable = result.persisted;
  window.dispatchEvent(new CustomEvent(AI_TUTOR_PROGRESS_EVENT));
  window.dispatchEvent(new CustomEvent(AI_TUTOR_PROGRESS_RESET_EVENT));
  return result;
}
