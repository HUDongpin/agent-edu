import {
  AGENT_ORCHESTRATION_PROGRESS_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_PREFIX,
  AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
  AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
  normalizeAgentOrchestrationProgress,
} from "@/lib/agent-orchestration";

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

const STORAGE_PROBE_KEY = "__aicourse_agent_orchestration_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.agent-orchestration-corrupt-backup";
let memoryProgress: AgentOrchestrationProgressRecord = {};
let storageAvailable: boolean | null = null;

function repairCorruptProgress(raw: string | null): AgentOrchestrationProgressRecord {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // A memory-only fallback remains available when both stores are blocked.
    }
  }
  try {
    localStorage.setItem(AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY, "{}");
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return memoryProgress;
}

export function isAgentOrchestrationStorageAvailable(): boolean {
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

export function readAgentOrchestrationProgress(): AgentOrchestrationProgressRecord {
  if (typeof window === "undefined" || !isAgentOrchestrationStorageAvailable()) {
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
      candidate[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]
      !== AGENT_ORCHESTRATION_PROGRESS_VERSION
      && isAgentOrchestrationStorageAvailable()
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
    if (isAgentOrchestrationStorageAvailable()) {
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
