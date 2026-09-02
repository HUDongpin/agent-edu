import type { PersistenceResult } from "@/lib/public-progress-contract";
import {
  persistenceFailureReason,
  verifySharedProgressReset,
} from "@/lib/progress-persistence";
import {
  MCP_PROGRESS_QUIZ,
  readVersionedQuizProgress,
} from "@/lib/progress-topology";

export const MCP_PROGRESS_STORAGE_KEY = "ae.progress";
export const MCP_PROGRESS_EVENT = "mcp:progress-change";

export type McpProgressRecord = Record<string, unknown>;
export type McpQuizDraft = {
  readonly version: string;
  readonly answers: Readonly<Record<string, number>>;
  readonly submitted: boolean;
  readonly reviewQuestionId?: string;
};

let memorySnapshot = "{}";
let persistenceAvailable: boolean | null = null;
let persistenceReason: PersistenceResult["reason"];

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
  let rawSnapshot: string | null;
  try {
    rawSnapshot = window.localStorage.getItem(MCP_PROGRESS_STORAGE_KEY);
  } catch (error) {
    memorySnapshot = "{}";
    persistenceAvailable = false;
    persistenceReason = persistenceFailureReason(error);
    return memorySnapshot;
  }
  const storedSnapshot = rawSnapshot || "{}";
  if (!snapshotIsValid(storedSnapshot)) {
    memorySnapshot = "{}";
    persistenceAvailable = false;
    persistenceReason = "corrupt";
    return memorySnapshot;
  }
  memorySnapshot = storedSnapshot;
  try {
    // Rewriting the same valid bytes is a non-destructive capability check for
    // read-only/quota-denied stores. Fresh learners avoid a synthetic empty key.
    if (rawSnapshot !== null) {
      window.localStorage.setItem(MCP_PROGRESS_STORAGE_KEY, storedSnapshot);
    }
    persistenceAvailable = true;
    persistenceReason = undefined;
  } catch (error) {
    persistenceAvailable = false;
    persistenceReason = persistenceFailureReason(error);
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
      persistenceReason = "corrupt";
      window.dispatchEvent(new Event(MCP_PROGRESS_EVENT));
      return false;
    }
    window.localStorage.setItem(MCP_PROGRESS_STORAGE_KEY, memorySnapshot);
    persistenceAvailable = true;
    persistenceReason = undefined;
    persisted = true;
  } catch (error) {
    persistenceAvailable = false;
    persistenceReason = persistenceFailureReason(error);
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
  if (typeof window === "undefined") {
    persistenceAvailable = false;
    persistenceReason = "unavailable";
    return { persisted: false, reason: "unavailable" };
  }
  const result = verifySharedProgressReset(window.localStorage, MCP_PROGRESS_STORAGE_KEY);
  persistenceAvailable = result.persisted;
  persistenceReason = result.persisted ? undefined : result.reason ?? "unavailable";
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

export function mcpPersistenceFailureReason(): PersistenceResult["reason"] {
  isMcpPersistenceAvailable();
  return persistenceReason;
}

export function readMcpQuizProgress(
  progress: Readonly<McpProgressRecord>,
): { readonly best: number; readonly passed: boolean } {
  return readVersionedQuizProgress(progress, MCP_PROGRESS_QUIZ);
}

export function isMcpQuizPassed(progress: Readonly<McpProgressRecord>): boolean {
  return readMcpQuizProgress(progress).passed;
}

export function readMcpQuizDraft(
  progress: Readonly<McpProgressRecord>,
): McpQuizDraft | null {
  const value = progress[MCP_PROGRESS_QUIZ.draftKey];
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  if (draft.version !== MCP_PROGRESS_QUIZ.bankVersion) return null;
  if (!draft.answers || typeof draft.answers !== "object" || Array.isArray(draft.answers)) return null;
  const answers = Object.fromEntries(Object.entries(draft.answers).filter((entry): entry is [string, number] => {
    const answer = entry[1];
    return typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer <= 3;
  }));
  return {
    version: MCP_PROGRESS_QUIZ.bankVersion,
    answers,
    submitted: draft.submitted === true,
    ...(typeof draft.reviewQuestionId === "string" && draft.reviewQuestionId
      ? { reviewQuestionId: draft.reviewQuestionId }
    : {}),
  };
}

export function readMcpQuizDraftForQuestions(
  progress: Readonly<McpProgressRecord>,
  questionIds: readonly string[],
): McpQuizDraft | null {
  const draft = readMcpQuizDraft(progress);
  if (!draft) return null;
  const allowedQuestionIds = new Set(questionIds);
  const answers = Object.fromEntries(
    Object.entries(draft.answers).filter(([questionId]) => allowedQuestionIds.has(questionId)),
  );
  const complete = questionIds.length > 0
    && questionIds.every((questionId) => Object.prototype.hasOwnProperty.call(answers, questionId));
  return {
    version: draft.version,
    answers,
    submitted: draft.submitted && complete,
    ...(draft.reviewQuestionId && allowedQuestionIds.has(draft.reviewQuestionId)
      ? { reviewQuestionId: draft.reviewQuestionId }
      : {}),
  };
}
