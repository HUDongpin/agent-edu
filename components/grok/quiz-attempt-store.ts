import type { GrokQuizCopy } from "@/lib/grok/types";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";
import { GROK_QUIZ_ATTEMPT_KEY } from "@/lib/progress-storage-contract";

const QUIZ_ATTEMPT_SCHEMA_VERSION = 1;
const GROK_QUIZ_ATTEMPT_EVENT = "aicourse:grok-quiz-attempt";

export type GrokQuizAttemptQuestion = {
  readonly id: string;
  readonly copy: Pick<GrokQuizCopy, "correctIndex" | "options">;
};

export type GrokQuizAttemptConfig = {
  readonly signature: string;
  readonly optionCounts: readonly number[];
};

export type GrokQuizAttemptDraft = {
  readonly schemaVersion: 1;
  readonly signature: string;
  readonly questionIndex: number;
  readonly selected: number | null;
  readonly answers: readonly boolean[];
  readonly checked: boolean;
};

let memoryRaw: string | null = null;
let persistenceAvailable: boolean | null = null;
let failureReason: PersistenceResult["reason"];
let beforeUnloadGuardInstalled = false;

function warnBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault();
  event.returnValue = "";
}

function syncBeforeUnloadGuard(): void {
  if (typeof window === "undefined") return;
  const needed = memoryRaw !== null && persistenceAvailable === false;
  if (needed && !beforeUnloadGuardInstalled) {
    window.addEventListener("beforeunload", warnBeforeUnload);
    beforeUnloadGuardInstalled = true;
  } else if (!needed && beforeUnloadGuardInstalled) {
    window.removeEventListener("beforeunload", warnBeforeUnload);
    beforeUnloadGuardInstalled = false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function markFailure(error?: unknown): PersistenceResult {
  persistenceAvailable = false;
  failureReason = error === undefined
    ? failureReason ?? "unavailable"
    : persistenceFailureReason(error);
  syncBeforeUnloadGuard();
  return { persisted: false, reason: failureReason };
}

function announce(): void {
  window.dispatchEvent(new Event(GROK_QUIZ_ATTEMPT_EVENT));
}

export function createGrokQuizAttemptConfig(
  questions: readonly GrokQuizAttemptQuestion[],
  passingScore: number,
): GrokQuizAttemptConfig {
  return {
    signature: [
      `grok-quiz-attempt:${QUIZ_ATTEMPT_SCHEMA_VERSION}`,
      `pass:${passingScore}`,
      ...questions.map((question) => (
        `${question.id}:${question.copy.correctIndex}:${question.copy.options.length}`
      )),
    ].join("|"),
    optionCounts: questions.map((question) => question.copy.options.length),
  };
}

export function parseGrokQuizAttempt(
  raw: string,
  config: GrokQuizAttemptConfig,
): GrokQuizAttemptDraft | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)
      || value.schemaVersion !== QUIZ_ATTEMPT_SCHEMA_VERSION
      || value.signature !== config.signature
      || !Number.isInteger(value.questionIndex)
      || (value.questionIndex as number) < 0
      || (value.questionIndex as number) >= config.optionCounts.length
      || typeof value.checked !== "boolean"
      || !Array.isArray(value.answers)
      || !value.answers.every((answer) => typeof answer === "boolean")) {
      return null;
    }

    const questionIndex = value.questionIndex as number;
    const checked = value.checked;
    const selected = value.selected === null
      ? null
      : Number.isInteger(value.selected) ? value.selected as number : Number.NaN;
    const optionCount = config.optionCounts[questionIndex] ?? 0;
    if (!Number.isInteger(selected) && selected !== null) return null;
    if (selected !== null && (selected < 0 || selected >= optionCount)) return null;
    if (checked && selected === null) return null;
    if (value.answers.length !== questionIndex + Number(checked)) return null;

    return {
      schemaVersion: 1,
      signature: config.signature,
      questionIndex,
      selected,
      answers: value.answers as boolean[],
      checked,
    };
  } catch {
    return null;
  }
}

export function readGrokQuizAttemptSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  if (persistenceAvailable === false) return memoryRaw;
  try {
    const raw = window.sessionStorage.getItem(GROK_QUIZ_ATTEMPT_KEY);
    memoryRaw = raw;
    persistenceAvailable = true;
    failureReason = undefined;
    syncBeforeUnloadGuard();
    return raw;
  } catch (error) {
    markFailure(error);
    return memoryRaw;
  }
}

export function subscribeToGrokQuizAttempt(callback: () => void): () => void {
  window.addEventListener(GROK_QUIZ_ATTEMPT_EVENT, callback);
  return () => window.removeEventListener(GROK_QUIZ_ATTEMPT_EVENT, callback);
}

export function grokQuizAttemptPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  readGrokQuizAttemptSnapshot();
  return persistenceAvailable !== false;
}

/** Always writes memory first so a denied session store survives an SPA remount. */
export function writeGrokQuizAttempt(raw: string): PersistenceResult {
  memoryRaw = raw;
  if (typeof window === "undefined") return markFailure();
  try {
    window.sessionStorage.setItem(GROK_QUIZ_ATTEMPT_KEY, raw);
    if (window.sessionStorage.getItem(GROK_QUIZ_ATTEMPT_KEY) !== raw) {
      announce();
      return markFailure();
    }
    persistenceAvailable = true;
    failureReason = undefined;
    syncBeforeUnloadGuard();
    announce();
    return { persisted: true };
  } catch (error) {
    const failure = markFailure(error);
    announce();
    return failure;
  }
}

/** Clear memory only after the session copy is verifiably absent. */
export function clearGrokQuizAttempt(): PersistenceResult {
  if (typeof window === "undefined") return markFailure();
  try {
    window.sessionStorage.removeItem(GROK_QUIZ_ATTEMPT_KEY);
    if (window.sessionStorage.getItem(GROK_QUIZ_ATTEMPT_KEY) !== null) {
      announce();
      return markFailure();
    }
    memoryRaw = null;
    persistenceAvailable = true;
    failureReason = undefined;
    syncBeforeUnloadGuard();
    announce();
    return { persisted: true };
  } catch (error) {
    const failure = markFailure(error);
    announce();
    return failure;
  }
}
