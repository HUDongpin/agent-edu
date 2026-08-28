import {
  AGENTIC_VIDEO_EDITING_PROGRESS_EVENT,
  AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  clearAgenticVideoEditingV2Progress,
  normalizeAgenticVideoEditingProgress,
} from "@/lib/agentic-video-editing";
import { PROG } from "@/lib/progress";

export const AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY = PROG;
export type AgenticVideoEditingProgressRecord = Record<string, unknown>;

const STORAGE_PROBE_KEY = "__aicourse_agentic_video_editing_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.agentic-video-editing-corrupt-backup";
let memoryProgress: AgenticVideoEditingProgressRecord = {};
let storageAvailable: boolean | null = null;

export function isAgenticVideoEditingProgressStorageEvent(
  event: Pick<StorageEvent, "key" | "storageArea">,
): boolean {
  return typeof window !== "undefined"
    && event.storageArea === window.localStorage
    && (event.key === AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY || event.key === null);
}

function holdCorruptProgress(raw: string | null): AgenticVideoEditingProgressRecord {
  memoryProgress = {
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
  if (raw) {
    try {
      sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // The in-memory course remains usable when both browser stores are blocked.
    }
  }
  // `ae.progress` is shared by every course. Never overwrite an unreadable
  // record: doing so could destroy milestones owned by the rest of the site.
  // This tab remains usable in memory and preserves the raw value for recovery.
  storageAvailable = false;
  return memoryProgress;
}

export function isAgenticVideoEditingStorageAvailable(): boolean {
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

export function readAgenticVideoEditingProgress(): AgenticVideoEditingProgressRecord {
  if (typeof window === "undefined" || !isAgenticVideoEditingStorageAvailable()) {
    return { ...memoryProgress };
  }
  try {
    const raw = localStorage.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      parsed = holdCorruptProgress(raw);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      parsed = holdCorruptProgress(raw);
    }
    memoryProgress = normalizeAgenticVideoEditingProgress(
      parsed as AgenticVideoEditingProgressRecord,
    );
    if (storageAvailable !== false) {
      localStorage.setItem(
        AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY,
        JSON.stringify(memoryProgress),
      );
    }
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeAgenticVideoEditingProgress(
  record: AgenticVideoEditingProgressRecord,
): boolean {
  memoryProgress = {
    ...record,
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
  let persisted = false;
  try {
    if (isAgenticVideoEditingStorageAvailable()) {
      localStorage.setItem(
        AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY,
        JSON.stringify(memoryProgress),
      );
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AGENTIC_VIDEO_EDITING_PROGRESS_EVENT, {
      detail: { persisted },
    }));
  }
  return persisted;
}

export function updateAgenticVideoEditingProgress(
  mutator: (record: AgenticVideoEditingProgressRecord) => void,
): boolean {
  const record = readAgenticVideoEditingProgress();
  mutator(record);
  return writeAgenticVideoEditingProgress(record);
}

export function resetAgenticVideoEditingProgress(): boolean {
  const record = clearAgenticVideoEditingV2Progress(
    readAgenticVideoEditingProgress(),
  );
  const persisted = writeAgenticVideoEditingProgress(record);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(
      AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
      { detail: { persisted } },
    ));
  }
  return persisted;
}
