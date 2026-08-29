import type { CodexQuizId, CodexUnitId } from "./types";

export const CODEX_QUIZ_DRAFT_STORAGE_KEY = "codex.quizDraft.v1" as const;
export const CODEX_QUIZ_DRAFT_VERSION = 1 as const;

export type CodexQuizDraft = {
  readonly version: typeof CODEX_QUIZ_DRAFT_VERSION;
  readonly bankVersion: string;
  readonly questionIds: readonly CodexQuizId[];
  readonly questionIndex: number;
  readonly selectedIndex: number | null;
  readonly answers: Readonly<Partial<Record<CodexQuizId, number>>>;
};

export type CodexQuizDraftQuestion = {
  readonly id: CodexQuizId;
  readonly unitId: CodexUnitId;
  readonly optionCount: number;
};

export type CodexQuizDraftConfig = {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
  readonly questions: readonly CodexQuizDraftQuestion[];
};

export type CodexQuizResultConfig = {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly passingCorrectAnswers: number;
  readonly bestScoreStorageKey: string;
  readonly passedStorageKey: string;
  readonly versionStorageKey: string;
};

export type CodexQuizViewState =
  | "not-started"
  | "resumable"
  | "active"
  | "finished"
  | "passed-idle";

export type CodexQuizResultState = "passed" | "prior-pass-preserved" | "needs-review";

type CodexQuizStorageSliceConfig = Pick<
  CodexQuizResultConfig,
  "bestScoreStorageKey" | "passedStorageKey" | "versionStorageKey"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(record).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function isValidOptionIndex(value: unknown, optionCount: number): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value < optionCount;
}

function codexQuizStorageSlice(
  raw: string | null,
  config: CodexQuizStorageSliceConfig,
): string {
  if (raw === null) return "absent";
  try {
    const record: unknown = JSON.parse(raw);
    if (!isRecord(record)) return "invalid";
    return JSON.stringify([
      record[CODEX_QUIZ_DRAFT_STORAGE_KEY] ?? null,
      record[config.bestScoreStorageKey] ?? null,
      record[config.passedStorageKey] ?? null,
      record[config.versionStorageKey] ?? null,
    ]);
  } catch {
    return "invalid";
  }
}

/** Ignore unrelated shared-record writes but reconcile quiz state changed in another tab. */
export function didCodexQuizStorageSliceChange(
  oldValue: string | null,
  newValue: string | null,
  config: CodexQuizStorageSliceConfig,
): boolean {
  if (oldValue === newValue) return false;
  return codexQuizStorageSlice(oldValue, config) !== codexQuizStorageSlice(newValue, config);
}

export function parseCodexQuizDraft(
  value: unknown,
  config: CodexQuizDraftConfig,
): CodexQuizDraft | null {
  if (!isRecord(value) || !hasExactKeys(value, [
    "version",
    "bankVersion",
    "questionIds",
    "questionIndex",
    "selectedIndex",
    "answers",
  ])) return null;
  if (value.version !== CODEX_QUIZ_DRAFT_VERSION) return null;
  if (value.bankVersion !== config.bankVersion) return null;
  if (!Array.isArray(value.questionIds) || value.questionIds.length !== config.questionCount) {
    return null;
  }
  if (!Number.isInteger(value.questionIndex)) return null;
  const questionIndex = value.questionIndex as number;
  if (questionIndex < 0 || questionIndex >= config.questionCount) return null;

  const questionById = new Map(config.questions.map((question) => [question.id, question]));
  const unitIds = [...new Set(config.questions.map((question) => question.unitId))];
  if (unitIds.length * config.questionsPerUnit !== config.questionCount) return null;

  const questionIds: CodexQuizId[] = [];
  const seenIds = new Set<CodexQuizId>();
  const unitCounts = new Map<CodexUnitId, number>();
  for (const rawId of value.questionIds) {
    if (typeof rawId !== "string") return null;
    const question = questionById.get(rawId as CodexQuizId);
    if (!question || seenIds.has(question.id)) return null;
    seenIds.add(question.id);
    questionIds.push(question.id);
    unitCounts.set(question.unitId, (unitCounts.get(question.unitId) ?? 0) + 1);
  }
  if (unitIds.some((unitId) => unitCounts.get(unitId) !== config.questionsPerUnit)) return null;

  const current = questionById.get(questionIds[questionIndex]);
  if (!current) return null;
  if (value.selectedIndex !== null && !isValidOptionIndex(value.selectedIndex, current.optionCount)) {
    return null;
  }
  if (!isRecord(value.answers)) return null;

  const answerEntries = Object.entries(value.answers);
  if (answerEntries.length !== questionIndex && answerEntries.length !== questionIndex + 1) {
    return null;
  }
  const expectedAnsweredIds = questionIds.slice(0, answerEntries.length);
  const expectedAnsweredIdSet = new Set(expectedAnsweredIds);
  const answers: Partial<Record<CodexQuizId, number>> = {};
  for (const [rawId, selectedIndex] of answerEntries) {
    const id = rawId as CodexQuizId;
    const question = questionById.get(id);
    if (!question || !expectedAnsweredIdSet.has(id)) return null;
    if (!isValidOptionIndex(selectedIndex, question.optionCount)) return null;
    answers[id] = selectedIndex;
  }
  if (Object.keys(answers).length !== expectedAnsweredIds.length) return null;

  const currentAnswer = answers[current.id];
  if (answerEntries.length === questionIndex + 1) {
    if (currentAnswer === undefined || value.selectedIndex !== currentAnswer) return null;
  }

  return {
    version: CODEX_QUIZ_DRAFT_VERSION,
    bankVersion: config.bankVersion,
    questionIds,
    questionIndex,
    selectedIndex: value.selectedIndex as number | null,
    answers,
  };
}

export function deriveCodexQuizViewState({
  active,
  completedScore,
  draft,
  bestScore,
  passed,
}: {
  readonly active: boolean;
  readonly completedScore: number | null;
  readonly draft: CodexQuizDraft | null;
  readonly bestScore: number | null;
  readonly passed: boolean;
}): CodexQuizViewState {
  if (completedScore !== null) return "finished";
  if (active) return "active";
  if (draft) return "resumable";
  if (passed) return "passed-idle";
  if (bestScore !== null) return "finished";
  return "not-started";
}

export function deriveCodexQuizResultState(
  score: number,
  passingCorrectAnswers: number,
  coursePassed: boolean,
): CodexQuizResultState {
  if (!coursePassed) return "needs-review";
  return score >= passingCorrectAnswers ? "passed" : "prior-pass-preserved";
}

export function recordCodexQuizAttemptResult(
  progress: Record<string, unknown>,
  config: CodexQuizResultConfig,
  score: number,
): void {
  if (!Number.isInteger(score) || score < 0 || score > config.questionCount) {
    throw new RangeError(`Codex quiz score must be an integer from 0 to ${config.questionCount}`);
  }
  const sameVersion = progress[config.versionStorageKey] === config.bankVersion;
  const storedBest = progress[config.bestScoreStorageKey];
  const priorBest = sameVersion
    && typeof storedBest === "number"
    && Number.isInteger(storedBest)
    && storedBest >= 0
    && storedBest <= config.questionCount
    ? storedBest
    : 0;

  progress[config.bestScoreStorageKey] = Math.max(priorBest, score);
  progress[config.passedStorageKey] = score >= config.passingCorrectAnswers
    || (sameVersion && progress[config.passedStorageKey] === true);
  progress[config.versionStorageKey] = config.bankVersion;
  delete progress[CODEX_QUIZ_DRAFT_STORAGE_KEY];
}
