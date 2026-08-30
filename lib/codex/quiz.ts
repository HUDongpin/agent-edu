import type { CodexQuizId, CodexQuizManifest } from "./types";

export const CODEX_QUIZ_BANK_VERSION = "1" as const;

export const CODEX_QUIZ = [
  { id: "q01", lessonSlug: "meet-codex", unitId: "unit-1", correctIndex: 1, sourceIds: ["openai-prompting", "openai-permissions"] },
  { id: "q02", lessonSlug: "meet-codex", unitId: "unit-1", correctIndex: 2, sourceIds: ["openai-code-review", "openai-permissions"] },
  { id: "q03", lessonSlug: "task-contracts", unitId: "unit-1", correctIndex: 3, sourceIds: ["openai-prompting"] },
  { id: "q04", lessonSlug: "task-contracts", unitId: "unit-1", correctIndex: 0, sourceIds: ["openai-prompting"] },
  { id: "q05", lessonSlug: "environments-permissions", unitId: "unit-1", correctIndex: 2, sourceIds: ["openai-permissions"] },
  { id: "q06", lessonSlug: "environments-permissions", unitId: "unit-1", correctIndex: 1, sourceIds: ["openai-environment-modes", "openai-cloud-environment"] },
  { id: "q07", lessonSlug: "ground-plan", unitId: "unit-1", correctIndex: 0, sourceIds: ["openai-projects", "openai-prompting"] },
  { id: "q08", lessonSlug: "ground-plan", unitId: "unit-1", correctIndex: 3, sourceIds: ["github-openai-cookbook"] },
  { id: "q09", lessonSlug: "implement-steer", unitId: "unit-2", correctIndex: 1, sourceIds: ["openai-long-running-work"] },
  { id: "q10", lessonSlug: "implement-steer", unitId: "unit-2", correctIndex: 2, sourceIds: ["openai-long-running-work", "openai-permissions"] },
  { id: "q11", lessonSlug: "debug-test", unitId: "unit-2", correctIndex: 0, sourceIds: ["github-superpowers"] },
  { id: "q12", lessonSlug: "debug-test", unitId: "unit-2", correctIndex: 3, sourceIds: ["openai-code-review", "github-superpowers"] },
  { id: "q13", lessonSlug: "review-diff", unitId: "unit-2", correctIndex: 2, sourceIds: ["openai-code-review"] },
  { id: "q14", lessonSlug: "review-diff", unitId: "unit-2", correctIndex: 1, sourceIds: ["github-superpowers"] },
  { id: "q15", lessonSlug: "agents-skills", unitId: "unit-2", correctIndex: 3, sourceIds: ["openai-agents-md"] },
  { id: "q16", lessonSlug: "agents-skills", unitId: "unit-2", correctIndex: 0, sourceIds: ["openai-subagents", "openai-build-skills"] },
  { id: "q17", lessonSlug: "cli", unitId: "unit-3", correctIndex: 1, sourceIds: ["openai-cli"] },
  { id: "q18", lessonSlug: "cli", unitId: "unit-3", correctIndex: 2, sourceIds: ["openai-noninteractive"] },
  { id: "q19", lessonSlug: "ide", unitId: "unit-3", correctIndex: 0, sourceIds: ["openai-ide"] },
  { id: "q20", lessonSlug: "ide", unitId: "unit-3", correctIndex: 3, sourceIds: ["openai-ide"] },
  { id: "q21", lessonSlug: "cloud-parallel", unitId: "unit-3", correctIndex: 2, sourceIds: ["openai-cloud", "openai-worktrees"] },
  { id: "q22", lessonSlug: "automation-capstone", unitId: "unit-4", correctIndex: 1, sourceIds: ["openai-noninteractive", "github-openai-codex-action"] },
  { id: "q23", lessonSlug: "automation-capstone", unitId: "unit-4", correctIndex: 3, sourceIds: ["openai-github-action", "github-openai-codex-action"] },
  { id: "q24", lessonSlug: "automation-capstone", unitId: "unit-4", correctIndex: 0, sourceIds: ["openai-noninteractive", "github-openspec"] },
] as const satisfies readonly CodexQuizManifest[];

/** Stable, versioned 24-question bank from which each 12-question attempt is drawn. */
export const CODEX_FINAL_QUIZ_IDS = CODEX_QUIZ.map((question) => question.id) as readonly CodexQuizId[];

export const CODEX_FINAL_QUIZ = {
  bankVersion: CODEX_QUIZ_BANK_VERSION,
  bankQuestionIds: CODEX_FINAL_QUIZ_IDS,
  bankSize: 24,
  questionCount: 12,
  questionsPerUnit: 3,
  passingCorrectAnswers: 10,
  selectionPolicy: "stratified-random" as const,
  scorePolicy: "best-score" as const,
  bestScoreStorageKey: "codex.quizBest",
  passedStorageKey: "codex.quizPassed",
  versionStorageKey: "codex.quizBankVersion",
} as const;

export function getCodexQuizBest(progress: Readonly<Record<string, unknown>>): number | null {
  const value = progress[CODEX_FINAL_QUIZ.bestScoreStorageKey];
  return progress[CODEX_FINAL_QUIZ.versionStorageKey] === CODEX_QUIZ_BANK_VERSION
    && typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= CODEX_FINAL_QUIZ.questionCount
    ? value
    : null;
}

export function isCodexQuizPassed(progress: Readonly<Record<string, unknown>>): boolean {
  const best = getCodexQuizBest(progress);
  return progress[CODEX_FINAL_QUIZ.passedStorageKey] === true
    && best !== null
    && best >= CODEX_FINAL_QUIZ.passingCorrectAnswers;
}

export const CODEX_QUIZ_BY_ID = Object.fromEntries(
  CODEX_QUIZ.map((question) => [question.id, question]),
) as unknown as Readonly<Record<CodexQuizId, CodexQuizManifest>>;
