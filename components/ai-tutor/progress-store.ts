import {
  AI_TUTOR_PROGRESS_EVENT,
  AI_TUTOR_PROGRESS_PREFIX,
  AI_TUTOR_PROGRESS_RESET_EVENT,
  AI_TUTOR_PROGRESS_VERSION,
  AI_TUTOR_PROGRESS_VERSION_KEY,
  isCurrentAiTutorProgress,
} from "@/lib/ai-tutor";

export const AI_TUTOR_PROGRESS_STORAGE_KEY = "ae.progress";
export type AiTutorProgressRecord = Record<string, unknown>;

const STORAGE_PROBE_KEY = "__aicourse_ai_tutor_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.ai-tutor-corrupt-backup";
let memoryProgress: AiTutorProgressRecord = {};
let storageAvailable: boolean | null = null;

function holdCorruptProgress(raw: string | null): void {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // The unreadable record remains untouched even when backup storage is unavailable.
    }
  }
  // Do not overwrite a shared, unreadable record. Keep Course 13 in memory for this session.
  storageAvailable = false;
}

export function isAiTutorProgressStorageAvailable(): boolean {
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

export function readAiTutorProgress(): AiTutorProgressRecord {
  if (typeof window === "undefined" || !isAiTutorProgressStorageAvailable()) {
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
    if (isAiTutorProgressStorageAvailable()) {
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
