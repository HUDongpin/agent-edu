import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";

export const MCP_PROGRESS_STORAGE_KEY = "ae.progress";
export const MCP_PROGRESS_EVENT = "mcp:progress-change";

export type McpProgressRecord = Record<string, unknown>;

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

function isProgressRecord(value: unknown): value is McpProgressRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function snapshotIsValid(snapshot: string): boolean {
  try {
    return isProgressRecord(JSON.parse(snapshot));
  } catch {
    return false;
  }
}

export function mcpLessonProgressKey(slug: string): string {
  return `mcp.lesson.${slug}`;
}

export function readMcpProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;
  try {
    const storedSnapshot = window.localStorage.getItem(MCP_PROGRESS_STORAGE_KEY) || "{}";
    if (!snapshotIsValid(storedSnapshot)) {
      memorySnapshot = "{}";
      persistenceAvailable = false;
      return memorySnapshot;
    }
    memorySnapshot = storedSnapshot;
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
  return memorySnapshot;
}

export function readMcpProgress(): McpProgressRecord {
  return JSON.parse(readMcpProgressSnapshot()) as McpProgressRecord;
}

export function writeMcpProgress(progress: McpProgressRecord): boolean {
  if (typeof window === "undefined") return false;
  memorySnapshot = JSON.stringify(progress);
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(MCP_PROGRESS_EVENT));
    return false;
  }
  let persisted = false;
  try {
    const current = window.localStorage.getItem(MCP_PROGRESS_STORAGE_KEY) || "{}";
    if (!snapshotIsValid(current)) {
      persistenceAvailable = false;
      window.dispatchEvent(new Event(MCP_PROGRESS_EVENT));
      return false;
    }
    window.localStorage.setItem(MCP_PROGRESS_STORAGE_KEY, memorySnapshot);
    persistenceAvailable = true;
    persisted = true;
  } catch {
    persistenceAvailable = false;
  }
  window.dispatchEvent(new Event(MCP_PROGRESS_EVENT));
  return persisted;
}

export function updateMcpProgress(update: (progress: McpProgressRecord) => void): boolean {
  const progress = readMcpProgress();
  update(progress);
  return writeMcpProgress(progress);
}

export function resetMcpProgress(): boolean {
  return updateMcpProgress((progress) => {
    for (const key of Object.keys(progress)) {
      if (key.startsWith("mcp.")) delete progress[key];
    }
  });
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetMcpProgressAfterGlobalReset(): PersistenceResult {
  memorySnapshot = "{}";
  const result = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(window.localStorage, MCP_PROGRESS_STORAGE_KEY);
  persistenceAvailable = result.persisted;
  window.dispatchEvent(new Event(MCP_PROGRESS_EVENT));
  return result;
}

export function subscribeToMcpProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const storage = (event: StorageEvent) => {
    if (!event.key || event.key === MCP_PROGRESS_STORAGE_KEY) listener();
  };
  window.addEventListener(MCP_PROGRESS_EVENT, listener);
  window.addEventListener("focus", listener);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(MCP_PROGRESS_EVENT, listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("storage", storage);
  };
}

export function isMcpPersistenceAvailable(): boolean {
  if (persistenceAvailable !== false) readMcpProgressSnapshot();
  return persistenceAvailable !== false;
}
