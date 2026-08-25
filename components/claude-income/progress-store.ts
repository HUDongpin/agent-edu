export const PROGRESS_STORAGE_KEY = "ae.progress";
export const CLAUDE_INCOME_PROGRESS_PREFIX = "claude-income.";
export const CLAUDE_INCOME_PROGRESS_EVENT = "claude-income:progress-change";

export type ProgressRecord = Record<string, unknown>;

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

function parseRecord(snapshot: string): ProgressRecord {
  try {
    const value = JSON.parse(snapshot);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as ProgressRecord
      : {};
  } catch {
    return {};
  }
}

export function lessonCompletionKey(slug: string): string {
  return `${CLAUDE_INCOME_PROGRESS_PREFIX}lesson.${slug}.complete`;
}

export function lessonVisitedKey(): string {
  return `${CLAUDE_INCOME_PROGRESS_PREFIX}last-lesson`;
}

export function capstoneDeliverableKey(index: number): string {
  return `${CLAUDE_INCOME_PROGRESS_PREFIX}capstone.deliverable.${index}`;
}

export function capstoneRubricKey(id: string): string {
  return `${CLAUDE_INCOME_PROGRESS_PREFIX}capstone.rubric.${id}`;
}

export function capstoneCriticalClearKey(index: number): string {
  return `${CLAUDE_INCOME_PROGRESS_PREFIX}capstone.critical-clear.${index}`;
}

export function readProgressSnapshot(): string {
  if (typeof window === "undefined") return memorySnapshot;
  if (persistenceAvailable === false) return memorySnapshot;

  try {
    memorySnapshot = window.localStorage.getItem(PROGRESS_STORAGE_KEY) || "{}";
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
  return memorySnapshot;
}

export function readProgress(): ProgressRecord {
  return parseRecord(readProgressSnapshot());
}

export function isProgressPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  readProgressSnapshot();
  return persistenceAvailable !== false;
}

export function writeProgress(progress: ProgressRecord): boolean {
  if (typeof window === "undefined") return false;

  memorySnapshot = JSON.stringify(progress);
  let persisted = false;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, memorySnapshot);
    persistenceAvailable = true;
    persisted = true;
  } catch {
    persistenceAvailable = false;
  }
  window.dispatchEvent(new Event(CLAUDE_INCOME_PROGRESS_EVENT));
  return persisted;
}

export function updateProgress(update: (record: ProgressRecord) => void): boolean {
  const progress = readProgress();
  update(progress);
  return writeProgress(progress);
}

export function resetClaudeIncomeProgress(): boolean {
  return updateProgress((record) => {
    for (const key of Object.keys(record)) {
      if (key.startsWith(CLAUDE_INCOME_PROGRESS_PREFIX)) delete record[key];
    }
  });
}

export function subscribeToProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === PROGRESS_STORAGE_KEY) listener();
  };
  window.addEventListener(CLAUDE_INCOME_PROGRESS_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", listener);

  return () => {
    window.removeEventListener(CLAUDE_INCOME_PROGRESS_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", listener);
  };
}
