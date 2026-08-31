import type { PersistenceResult } from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";
import {
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY,
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY,
} from "@/lib/progress-storage-contract";

const ASSESSMENT_ATTEMPT_SCHEMA_VERSION = 1;
const ASSESSMENT_ATTEMPT_EVENT = "product-management:assessment-attempt-change";

export type ProductManagementAssessmentAttemptQuestion = {
  readonly id: string;
  readonly options: readonly unknown[];
  readonly correctIndex: number;
};

export type ProductManagementAssessmentAttemptConfig = {
  readonly bankVersion: string;
  readonly questionIds: readonly string[];
};

export type ProductManagementAssessmentAttemptDraft = {
  readonly schemaVersion: 1;
  readonly bankVersion: string;
  readonly questionIds: readonly string[];
  readonly index: number;
  /** Correctness only for every completed question before `index`. */
  readonly answers: Readonly<Record<string, boolean>>;
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
  "aicourse.product-management.assessment-attempt.runtime.v1",
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const keys = Object.keys(value);
  const expected = new Set(expectedKeys);
  return keys.length === expected.size && keys.every((key) => expected.has(key));
}

function sameOrderedStrings(value: unknown, expected: readonly string[]): value is string[] {
  return Array.isArray(value)
    && value.length === expected.length
    && value.every((item, index) => item === expected[index]);
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

function markAvailable(): PersistenceResult {
  const state = runtimeState();
  state.persistenceAvailable = true;
  state.failureReason = undefined;
  syncBeforeUnloadGuard();
  return { persisted: true };
}

function announce(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ASSESSMENT_ATTEMPT_EVENT));
  }
}

function probeSessionPersistence(): PersistenceResult {
  if (typeof window === "undefined") return markFailure();
  try {
    const marker = "product-management-assessment-probe";
    window.sessionStorage.setItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY, marker);
    if (window.sessionStorage.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY) !== marker) {
      return markFailure();
    }
    window.sessionStorage.removeItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY);
    if (window.sessionStorage.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY) !== null) {
      return markFailure();
    }
    return markAvailable();
  } catch (error) {
    return markFailure(error);
  }
}

function persistMemoryToSession(): PersistenceResult {
  if (typeof window === "undefined") return markFailure();
  const state = runtimeState();
  const probe = probeSessionPersistence();
  if (!probe.persisted) return probe;

  try {
    if (state.pendingClear || state.memoryRaw === null) {
      window.sessionStorage.removeItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
      if (window.sessionStorage.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY) !== null) {
        return markFailure();
      }
      state.memoryRaw = null;
    } else {
      window.sessionStorage.setItem(
        PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY,
        state.memoryRaw,
      );
      if (window.sessionStorage.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY)
        !== state.memoryRaw) {
        return markFailure();
      }
    }
    state.pendingSync = false;
    state.pendingClear = false;
    return markAvailable();
  } catch (error) {
    return markFailure(error);
  }
}

export function createProductManagementAssessmentAttemptConfig({
  bankVersion,
  questions,
}: {
  readonly bankVersion: string;
  readonly questions: readonly ProductManagementAssessmentAttemptQuestion[];
}): ProductManagementAssessmentAttemptConfig {
  if (!bankVersion.trim()) throw new Error("Course 14 assessment bank version is required");
  if (questions.length === 0) throw new Error("Course 14 assessment questions are required");
  const questionIds = questions.map((question) => question.id);
  if (questionIds.some((id) => !id.trim()) || new Set(questionIds).size !== questionIds.length) {
    throw new Error("Course 14 assessment question IDs must be non-empty and unique");
  }
  for (const question of questions) {
    if (!Number.isInteger(question.correctIndex)
      || question.correctIndex < 0
      || question.correctIndex >= question.options.length) {
      throw new Error(`Course 14 assessment question ${question.id} has an invalid answer range`);
    }
  }
  return { bankVersion, questionIds };
}

export function parseProductManagementAssessmentAttempt(
  raw: string,
  config: ProductManagementAssessmentAttemptConfig,
): ProductManagementAssessmentAttemptDraft | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)
      || !hasOnlyKeys(value, [
        "schemaVersion",
        "bankVersion",
        "questionIds",
        "index",
        "answers",
      ])
      || value.schemaVersion !== ASSESSMENT_ATTEMPT_SCHEMA_VERSION
      || value.bankVersion !== config.bankVersion
      || !sameOrderedStrings(value.questionIds, config.questionIds)
      || !Number.isInteger(value.index)
      || (value.index as number) < 0
      || (value.index as number) >= config.questionIds.length
      || !isRecord(value.answers)) {
      return null;
    }

    const index = value.index as number;
    const answers = value.answers as Record<string, unknown>;
    const expectedAnswerIds = config.questionIds.slice(0, index);
    if (!hasOnlyKeys(answers, expectedAnswerIds)
      || expectedAnswerIds.some((id) => typeof answers[id] !== "boolean")) {
      return null;
    }

    return {
      schemaVersion: 1,
      bankVersion: config.bankVersion,
      questionIds: [...config.questionIds],
      index,
      answers: Object.fromEntries(
        expectedAnswerIds.map((id) => [id, answers[id] as boolean]),
      ),
    };
  } catch {
    return null;
  }
}

export function readProductManagementAssessmentAttemptSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  const state = runtimeState();
  if (state.pendingSync || state.pendingClear) {
    persistMemoryToSession();
    return state.memoryRaw;
  }
  try {
    state.memoryRaw = window.sessionStorage.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    state.persistenceAvailable = true;
    state.failureReason = undefined;
    syncBeforeUnloadGuard();
    return state.memoryRaw;
  } catch (error) {
    markFailure(error);
    return state.memoryRaw;
  }
}

export function subscribeToProductManagementAssessmentAttempt(
  listener: () => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY) return;
    const state = runtimeState();
    state.memoryRaw = event.newValue;
    state.persistenceAvailable = null;
    state.pendingSync = false;
    state.pendingClear = false;
    syncBeforeUnloadGuard();
    listener();
  };
  const handleFocus = () => {
    runtimeState().persistenceAvailable = null;
    listener();
  };
  window.addEventListener(ASSESSMENT_ATTEMPT_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", handleFocus);
  return () => {
    window.removeEventListener(ASSESSMENT_ATTEMPT_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", handleFocus);
  };
}

export function isProductManagementAssessmentAttemptPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  const state = runtimeState();
  if (state.pendingSync || state.pendingClear) return persistMemoryToSession().persisted;
  return probeSessionPersistence().persisted;
}

export function writeProductManagementAssessmentAttempt(
  draft: ProductManagementAssessmentAttemptDraft,
): PersistenceResult {
  const state = runtimeState();
  state.memoryRaw = JSON.stringify({
    schemaVersion: 1,
    bankVersion: draft.bankVersion,
    questionIds: [...draft.questionIds],
    index: draft.index,
    answers: { ...draft.answers },
  });
  state.pendingSync = true;
  state.pendingClear = false;
  const result = persistMemoryToSession();
  announce();
  return result;
}

export function clearProductManagementAssessmentAttempt(): PersistenceResult {
  const state = runtimeState();
  state.pendingSync = false;
  state.pendingClear = true;
  if (typeof window !== "undefined" && state.memoryRaw === null) {
    try {
      state.memoryRaw = window.sessionStorage.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    } catch (error) {
      const result = markFailure(error);
      announce();
      return result;
    }
  }
  syncBeforeUnloadGuard();
  const result = persistMemoryToSession();
  announce();
  return result;
}
