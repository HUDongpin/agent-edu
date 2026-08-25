import {
  AGENT_ORCHESTRATION_PROGRESS_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
  normalizeVersionedProgressRecord,
} from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";
import {
  AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
  AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
} from "@/lib/progress-storage-contract";

const AGENT_ORCHESTRATION_PROGRESS_PREFIX =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.prefix;
const AGENT_ORCHESTRATION_PROGRESS_VERSION =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version;
const AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey;

function normalizeAgentOrchestrationProgress(
  progress: Record<string, unknown>,
): Record<string, unknown> {
  return normalizeVersionedProgressRecord(
    progress,
    AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
  );
}

export const AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY = "ae.progress";
export type AgentOrchestrationProgressRecord = Record<string, unknown>;

export function isAgentOrchestrationProgressStorageEvent(
  event: Pick<StorageEvent, "key" | "storageArea">,
): boolean {
  return typeof window !== "undefined"
    && event.storageArea === window.localStorage
    && (
      event.key === AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY
      || event.key === null
    );
}

let memoryProgress: AgentOrchestrationProgressRecord = {};
let storageAvailable: boolean | null = null;

function repairCorruptProgress(raw: string | null): AgentOrchestrationProgressRecord {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY, raw);
    } catch {
      // A memory-only fallback remains available when both stores are blocked.
    }
  }
  // Never replace an unreadable shared record. This module remains
  // session-only until the learner explicitly performs a site-wide reset.
  storageAvailable = false;
  return memoryProgress;
}

function ensureStorageAccess(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;
  try {
    localStorage.setItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY, "1");
    localStorage.removeItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function isAgentOrchestrationStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== false) readAgentOrchestrationProgress();
  return storageAvailable === true;
}

export function readAgentOrchestrationProgress(): AgentOrchestrationProgressRecord {
  if (typeof window === "undefined" || !ensureStorageAccess()) {
    return { ...memoryProgress };
  }
  try {
    const raw = localStorage.getItem(AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      parsed = repairCorruptProgress(raw);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      parsed = repairCorruptProgress(raw);
    }
    const candidate = parsed as AgentOrchestrationProgressRecord;
    const normalized = normalizeAgentOrchestrationProgress(candidate);
    memoryProgress = normalized;
    if (
      raw !== null
      &&
      candidate[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]
      !== AGENT_ORCHESTRATION_PROGRESS_VERSION
      && storageAvailable === true
    ) {
      localStorage.setItem(
        AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
        JSON.stringify(memoryProgress),
      );
    }
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeAgentOrchestrationProgress(
  record: AgentOrchestrationProgressRecord,
): boolean {
  memoryProgress = {
    ...record,
    [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]:
      AGENT_ORCHESTRATION_PROGRESS_VERSION,
  };
  let persisted = false;
  try {
    if (storageAvailable !== false) {
      const raw = localStorage.getItem(AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY) || "{}";
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        repairCorruptProgress(raw);
      } else {
        storageAvailable = true;
      }
    }
    if (storageAvailable === true) {
      localStorage.setItem(
        AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
        JSON.stringify(memoryProgress),
      );
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AGENT_ORCHESTRATION_PROGRESS_EVENT, {
      detail: { persisted },
    }));
  }
  return persisted;
}

export function updateAgentOrchestrationProgress(
  mutator: (record: AgentOrchestrationProgressRecord) => void,
): boolean {
  const record = readAgentOrchestrationProgress();
  mutator(record);
  return writeAgentOrchestrationProgress(record);
}

export function resetAgentOrchestrationProgress(): boolean {
  const record = readAgentOrchestrationProgress();
  for (const key of Object.keys(record)) {
    if (key.startsWith(AGENT_ORCHESTRATION_PROGRESS_PREFIX)) delete record[key];
  }
  const persisted = writeAgentOrchestrationProgress(record);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT, {
      detail: { persisted },
    }));
  }
  return persisted;
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetAgentOrchestrationProgressAfterGlobalReset(): PersistenceResult {
  memoryProgress = {};
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(localStorage, AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY);
  storageAvailable = result.persisted;
  window.dispatchEvent(new CustomEvent(AGENT_ORCHESTRATION_PROGRESS_EVENT, {
    detail: { persisted: result.persisted },
  }));
  window.dispatchEvent(new CustomEvent(AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT, {
    detail: { persisted: result.persisted },
  }));
  return result;
}
