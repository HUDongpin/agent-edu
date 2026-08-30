import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";
import { clearClaudeIncomeQuizAttempt } from "./quiz-attempt-store";

export const PROGRESS_STORAGE_KEY = "ae.progress";
export const CLAUDE_INCOME_PROGRESS_PREFIX = "claude-income.";
export const CLAUDE_INCOME_PROGRESS_EVENT = "claude-income:progress-change";
export const CLAUDE_INCOME_PROGRESS_RESET_EVENT = "claude-income:progress-reset";

export type ProgressRecord = Record<string, unknown>;

export type ClaudeIncomeResetResult = {
  readonly persisted: boolean;
  readonly progressPersisted: boolean;
  readonly attemptPersisted: boolean;
};

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;

function parseRecord(snapshot: string): ProgressRecord | null {
  try {
    const value = JSON.parse(snapshot);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as ProgressRecord
      : null;
  } catch {
    return null;
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
    const storedSnapshot = window.localStorage.getItem(PROGRESS_STORAGE_KEY) || "{}";
    if (!parseRecord(storedSnapshot)) {
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

export function readProgress(): ProgressRecord {
  return parseRecord(readProgressSnapshot()) ?? {};
}

export function isProgressPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (persistenceAvailable !== false) readProgressSnapshot();
  return persistenceAvailable !== false;
}

export function writeProgress(progress: ProgressRecord): boolean {
  if (typeof window === "undefined") return false;

  memorySnapshot = JSON.stringify(progress);
  if (persistenceAvailable === false) {
    window.dispatchEvent(new Event(CLAUDE_INCOME_PROGRESS_EVENT));
    return false;
  }
  let persisted = false;
  try {
    const current = window.localStorage.getItem(PROGRESS_STORAGE_KEY) || "{}";
    if (!parseRecord(current)) {
      persistenceAvailable = false;
      window.dispatchEvent(new Event(CLAUDE_INCOME_PROGRESS_EVENT));
      return false;
    }
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

export function resetClaudeIncomeProgress(): ClaudeIncomeResetResult {
  const progressPersisted = updateProgress((record) => {
    for (const key of Object.keys(record)) {
      if (key.startsWith(CLAUDE_INCOME_PROGRESS_PREFIX)) delete record[key];
    }
  });
  const attemptReset = clearClaudeIncomeQuizAttempt();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CLAUDE_INCOME_PROGRESS_RESET_EVENT));
  }
  return {
    persisted: progressPersisted && attemptReset.persisted,
    progressPersisted,
    attemptPersisted: attemptReset.persisted,
  };
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetClaudeIncomeProgressAfterGlobalReset(): PersistenceResult {
  memorySnapshot = "{}";
  const progressResult = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(window.localStorage, PROGRESS_STORAGE_KEY);
  const attemptResult = clearClaudeIncomeQuizAttempt();
  persistenceAvailable = progressResult.persisted;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CLAUDE_INCOME_PROGRESS_EVENT));
    window.dispatchEvent(new Event(CLAUDE_INCOME_PROGRESS_RESET_EVENT));
  }
  if (!progressResult.persisted) return progressResult;
  if (!attemptResult.persisted) return attemptResult;
  return progressResult;
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
