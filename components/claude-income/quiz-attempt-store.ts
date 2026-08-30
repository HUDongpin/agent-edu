import type { PersistenceResult } from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";
import { CLAUDE_INCOME_QUIZ_ATTEMPT_KEY } from "@/lib/progress-storage-contract";

const QUIZ_ATTEMPT_SCHEMA_VERSION = 1;
const QUIZ_ATTEMPT_EVENT = "claude-income:quiz-attempt-change";

export type ClaudeIncomeQuizAttemptQuestion = {
  readonly id: string;
  readonly unitId: string;
  readonly critical?: boolean;
  readonly options: readonly unknown[];
};

export type ClaudeIncomeQuizAttemptConfig = {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
  readonly unitIds: readonly string[];
  readonly questionsById: ReadonlyMap<string, {
    readonly unitId: string;
    readonly critical: boolean;
    readonly optionCount: number;
  }>;
};

export type ClaudeIncomeQuizAttemptDraft = {
  readonly schemaVersion: 1;
  readonly bankVersion: string;
  readonly questionIds: readonly string[];
  readonly index: number;
  readonly selectedIndex: number | null;
  /** Checked answers, stored only as option indexes in attempt order. */
  readonly answers: readonly number[];
};

type AttemptRuntimeState = {
  memoryRaw: string | null;
  persistenceAvailable: boolean | null;
  pendingSync: boolean;
  pendingClear: boolean;
  failureReason: PersistenceResult["reason"];
  beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null;
};

const ATTEMPT_RUNTIME_KEY = Symbol.for(
  "aicourse.claude-income.quiz-attempt.runtime.v1",
);
const moduleRuntimeState: AttemptRuntimeState = {
  memoryRaw: null,
  persistenceAvailable: null,
  pendingSync: false,
  pendingClear: false,
  failureReason: undefined,
  beforeUnloadHandler: null,
};

function runtimeState(): AttemptRuntimeState {
  if (typeof window === "undefined") return moduleRuntimeState;
  const registry = window as unknown as Record<PropertyKey, unknown>;
  const existing = registry[ATTEMPT_RUNTIME_KEY];
  if (existing) return existing as AttemptRuntimeState;
  const state: AttemptRuntimeState = {
    memoryRaw: null,
    persistenceAvailable: null,
    pendingSync: false,
    pendingClear: false,
    failureReason: undefined,
    beforeUnloadHandler: null,
  };
  registry[ATTEMPT_RUNTIME_KEY] = state;
  return state;
}

function warnBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault();
  event.returnValue = "";
}

function syncBeforeUnloadGuard(): void {
  if (typeof window === "undefined") return;
  const state = runtimeState();
  const needed = state.memoryRaw !== null
    && (state.persistenceAvailable === false || state.pendingSync || state.pendingClear);
  if (needed && !state.beforeUnloadHandler) {
    state.beforeUnloadHandler = warnBeforeUnload;
    window.addEventListener("beforeunload", state.beforeUnloadHandler);
  } else if (!needed && state.beforeUnloadHandler) {
    window.removeEventListener("beforeunload", state.beforeUnloadHandler);
    state.beforeUnloadHandler = null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyDraftKeys(value: Record<string, unknown>): boolean {
  const expected = new Set([
    "schemaVersion",
    "bankVersion",
    "questionIds",
    "index",
    "selectedIndex",
    "answers",
  ]);
  return Object.keys(value).length === expected.size
    && Object.keys(value).every((key) => expected.has(key));
}

function isOptionIndex(value: unknown, optionCount: number): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < optionCount;
}

function markFailure(error?: unknown): PersistenceResult {
  const state = runtimeState();
  state.persistenceAvailable = false;
  state.failureReason = error === undefined
    ? state.failureReason ?? "unavailable"
    : persistenceFailureReason(error);
  syncBeforeUnloadGuard();
  return { persisted: false, reason: state.failureReason };
}

function announce(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(QUIZ_ATTEMPT_EVENT));
  }
}

function persistMemoryToSession(): PersistenceResult {
  if (typeof window === "undefined") return markFailure();
  const state = runtimeState();
  try {
    if (state.pendingClear || state.memoryRaw === null) {
      window.sessionStorage.removeItem(CLAUDE_INCOME_QUIZ_ATTEMPT_KEY);
      if (window.sessionStorage.getItem(CLAUDE_INCOME_QUIZ_ATTEMPT_KEY) !== null) {
        return markFailure();
      }
      state.memoryRaw = null;
    } else {
      window.sessionStorage.setItem(CLAUDE_INCOME_QUIZ_ATTEMPT_KEY, state.memoryRaw);
      if (window.sessionStorage.getItem(CLAUDE_INCOME_QUIZ_ATTEMPT_KEY) !== state.memoryRaw) {
        return markFailure();
      }
    }
    state.pendingSync = false;
    state.pendingClear = false;
    state.persistenceAvailable = true;
    state.failureReason = undefined;
    syncBeforeUnloadGuard();
    return { persisted: true };
  } catch (error) {
    return markFailure(error);
  }
}

export function createClaudeIncomeQuizAttemptConfig({
  bankVersion,
  questionCount,
  questionsPerUnit,
  unitIds,
  questions,
}: {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
  readonly unitIds: readonly string[];
  readonly questions: readonly ClaudeIncomeQuizAttemptQuestion[];
}): ClaudeIncomeQuizAttemptConfig {
  return {
    bankVersion,
    questionCount,
    questionsPerUnit,
    unitIds: [...unitIds],
    questionsById: new Map(questions.map((question) => [
      question.id,
      {
        unitId: question.unitId,
        critical: question.critical === true,
        optionCount: question.options.length,
      },
    ])),
  };
}

export function parseClaudeIncomeQuizAttempt(
  raw: string,
  config: ClaudeIncomeQuizAttemptConfig,
): ClaudeIncomeQuizAttemptDraft | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)
      || !hasOnlyDraftKeys(value)
      || value.schemaVersion !== QUIZ_ATTEMPT_SCHEMA_VERSION
      || value.bankVersion !== config.bankVersion
      || !Array.isArray(value.questionIds)
      || value.questionIds.length !== config.questionCount
      || value.questionIds.some((id) => typeof id !== "string")
      || new Set(value.questionIds).size !== config.questionCount
      || !Number.isInteger(value.index)
      || (value.index as number) < 0
      || (value.index as number) >= config.questionCount
      || !Array.isArray(value.answers)) {
      return null;
    }

    const questionIds = value.questionIds as string[];
    const selectedQuestions = questionIds.map((id) => config.questionsById.get(id));
    if (selectedQuestions.some((question) => !question)) return null;

    for (const unitId of config.unitIds) {
      const unitQuestions = selectedQuestions.filter((question) => question?.unitId === unitId);
      if (unitQuestions.length !== config.questionsPerUnit
        || unitQuestions.filter((question) => question?.critical).length !== 1) {
        return null;
      }
    }
    if (selectedQuestions.some((question) => !config.unitIds.includes(question!.unitId))) {
      return null;
    }

    const index = value.index as number;
    const answers = value.answers as unknown[];
    if (answers.length !== index && answers.length !== index + 1) return null;
    for (let answerIndex = 0; answerIndex < answers.length; answerIndex += 1) {
      if (!isOptionIndex(
        answers[answerIndex],
        selectedQuestions[answerIndex]?.optionCount ?? 0,
      )) return null;
    }

    const currentOptionCount = selectedQuestions[index]?.optionCount ?? 0;
    const selectedIndex = value.selectedIndex === null
      ? null
      : isOptionIndex(value.selectedIndex, currentOptionCount)
        ? value.selectedIndex
        : Number.NaN;
    if (Number.isNaN(selectedIndex)) return null;
    const currentIsChecked = answers.length === index + 1;
    if (currentIsChecked && selectedIndex !== answers[index]) return null;

    return {
      schemaVersion: 1,
      bankVersion: config.bankVersion,
      questionIds,
      index,
      selectedIndex,
      answers: answers as number[],
    };
  } catch {
    return null;
  }
}

export function readClaudeIncomeQuizAttemptSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  const state = runtimeState();
  if (state.persistenceAvailable === false && !state.pendingSync && !state.pendingClear) {
    return state.memoryRaw;
  }
  if (state.pendingSync || state.pendingClear) {
    persistMemoryToSession();
    return state.memoryRaw;
  }
  try {
    state.memoryRaw = window.sessionStorage.getItem(CLAUDE_INCOME_QUIZ_ATTEMPT_KEY);
    state.persistenceAvailable = true;
    state.failureReason = undefined;
    syncBeforeUnloadGuard();
    return state.memoryRaw;
  } catch (error) {
    markFailure(error);
    return state.memoryRaw;
  }
}

export function subscribeToClaudeIncomeQuizAttempt(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== CLAUDE_INCOME_QUIZ_ATTEMPT_KEY) return;
    const state = runtimeState();
    state.memoryRaw = event.newValue;
    state.persistenceAvailable = null;
    state.pendingSync = false;
    state.pendingClear = false;
    listener();
  };
  const handleFocus = () => {
    runtimeState().persistenceAvailable = null;
    listener();
  };
  window.addEventListener(QUIZ_ATTEMPT_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", handleFocus);
  return () => {
    window.removeEventListener(QUIZ_ATTEMPT_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", handleFocus);
  };
}

export function isClaudeIncomeQuizAttemptPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  readClaudeIncomeQuizAttemptSnapshot();
  return runtimeState().persistenceAvailable !== false;
}

export function writeClaudeIncomeQuizAttempt(
  draft: ClaudeIncomeQuizAttemptDraft,
): PersistenceResult {
  const state = runtimeState();
  state.memoryRaw = JSON.stringify(draft);
  state.pendingSync = true;
  state.pendingClear = false;
  const result = persistMemoryToSession();
  announce();
  return result;
}

export function clearClaudeIncomeQuizAttempt(): PersistenceResult {
  const state = runtimeState();
  state.pendingSync = false;
  state.pendingClear = true;
  if (typeof window !== "undefined" && state.memoryRaw === null) {
    try {
      state.memoryRaw = window.sessionStorage.getItem(CLAUDE_INCOME_QUIZ_ATTEMPT_KEY);
    } catch (error) {
      const result = markFailure(error);
      syncBeforeUnloadGuard();
      announce();
      return result;
    }
  }
  syncBeforeUnloadGuard();
  const result = persistMemoryToSession();
  announce();
  return result;
}
