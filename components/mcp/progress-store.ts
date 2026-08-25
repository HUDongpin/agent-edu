export const MCP_PROGRESS_STORAGE_KEY = "ae.progress";
export const MCP_PROGRESS_EVENT = "mcp:progress-change";

export type McpProgressRecord = Record<string, unknown>;

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

export function mcpLessonProgressKey(slug: string): string {
  return `mcp.lesson.${slug}`;
}

export function readMcpProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;
  try {
    memorySnapshot = window.localStorage.getItem(MCP_PROGRESS_STORAGE_KEY) || "{}";
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
  return memorySnapshot;
}

export function readMcpProgress(): McpProgressRecord {
  try {
    const value = JSON.parse(readMcpProgressSnapshot());
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as McpProgressRecord
      : {};
  } catch {
    return {};
  }
}

export function writeMcpProgress(progress: McpProgressRecord): boolean {
  if (typeof window === "undefined") return false;
  memorySnapshot = JSON.stringify(progress);
  let persisted = false;
  try {
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
  readMcpProgressSnapshot();
  return persistenceAvailable !== false;
}
