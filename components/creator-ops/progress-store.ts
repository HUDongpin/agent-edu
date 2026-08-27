import {
  CREATOR_OPS_PROGRESS_EVENT,
  CREATOR_OPS_PROGRESS_PREFIX,
  CREATOR_OPS_PROGRESS_RESET_EVENT,
  CREATOR_OPS_PROGRESS_VERSION,
  CREATOR_OPS_PROGRESS_VERSION_KEY,
  normalizeCreatorOpsProgress,
} from "@/lib/creator-ops";
import { PROG } from "@/lib/progress";

export const CREATOR_OPS_PROGRESS_STORAGE_KEY = PROG;
export type CreatorOpsProgressRecord = Record<string, unknown>;

const STORAGE_PROBE_KEY = "__aicourse_creator_ops_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.creator-ops-corrupt-backup";
let memoryProgress: CreatorOpsProgressRecord = {};
let storageAvailable: boolean | null = null;

export function isCreatorOpsProgressStorageEvent(
  event: Pick<StorageEvent, "key" | "storageArea">,
): boolean {
  return typeof window !== "undefined"
    && event.storageArea === window.localStorage
    && (event.key === CREATOR_OPS_PROGRESS_STORAGE_KEY || event.key === null);
}

function repairCorruptProgress(raw: string | null): CreatorOpsProgressRecord {
  memoryProgress = {};
  if (raw) {
    try { sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw); } catch { /* memory fallback */ }
  }
  try {
    localStorage.setItem(CREATOR_OPS_PROGRESS_STORAGE_KEY, "{}");
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return memoryProgress;
}

export function isCreatorOpsStorageAvailable(): boolean {
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

export function readCreatorOpsProgress(): CreatorOpsProgressRecord {
  if (typeof window === "undefined" || !isCreatorOpsStorageAvailable()) {
    return { ...memoryProgress };
  }
  try {
    const raw = localStorage.getItem(CREATOR_OPS_PROGRESS_STORAGE_KEY);
    let parsed: unknown;
    try { parsed = JSON.parse(raw || "{}"); } catch { parsed = repairCorruptProgress(raw); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      parsed = repairCorruptProgress(raw);
    }
    const candidate = parsed as CreatorOpsProgressRecord;
    memoryProgress = normalizeCreatorOpsProgress(candidate);
    if (candidate[CREATOR_OPS_PROGRESS_VERSION_KEY] !== CREATOR_OPS_PROGRESS_VERSION) {
      localStorage.setItem(CREATOR_OPS_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
    }
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeCreatorOpsProgress(record: CreatorOpsProgressRecord): boolean {
  memoryProgress = {
    ...record,
    [CREATOR_OPS_PROGRESS_VERSION_KEY]: CREATOR_OPS_PROGRESS_VERSION,
  };
  let persisted = false;
  try {
    if (isCreatorOpsStorageAvailable()) {
      localStorage.setItem(CREATOR_OPS_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CREATOR_OPS_PROGRESS_EVENT, { detail: { persisted } }));
  }
  return persisted;
}

export function updateCreatorOpsProgress(
  mutator: (record: CreatorOpsProgressRecord) => void,
): boolean {
  const record = readCreatorOpsProgress();
  mutator(record);
  return writeCreatorOpsProgress(record);
}

export function resetCreatorOpsProgress(): boolean {
  const record = readCreatorOpsProgress();
  for (const key of Object.keys(record)) {
    if (key.startsWith(CREATOR_OPS_PROGRESS_PREFIX)) delete record[key];
  }
  const persisted = writeCreatorOpsProgress(record);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CREATOR_OPS_PROGRESS_RESET_EVENT, { detail: { persisted } }));
  }
  return persisted;
}
