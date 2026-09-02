import type { ClaudeQuizId, ClaudeQuizManifest } from "./types";

export const CLAUDE_QUIZ_BANK_VERSION = "1" as const;

export const CLAUDE_QUIZ = [
  { id: "q01", lessonSlug: "choose-your-surface", unitId: "unit-1", correctIndex: 1, sourceIds: ["academy-desktop"] },
  { id: "q02", lessonSlug: "choose-your-surface", unitId: "unit-1", correctIndex: 2, sourceIds: ["academy-desktop", "github-claude-code"] },
  { id: "q03", lessonSlug: "describe-the-outcome", unitId: "unit-1", correctIndex: 3, sourceIds: ["academy-fluency"] },
  { id: "q04", lessonSlug: "describe-the-outcome", unitId: "unit-1", correctIndex: 0, sourceIds: ["academy-claude-101", "academy-fluency"] },
  { id: "q05", lessonSlug: "iterate-with-examples", unitId: "unit-1", correctIndex: 2, sourceIds: ["academy-fluency"] },
  { id: "q06", lessonSlug: "iterate-with-examples", unitId: "unit-1", correctIndex: 1, sourceIds: ["academy-fluency", "github-claudeblattman"] },
  { id: "q07", lessonSlug: "discern-verify-protect", unitId: "unit-1", correctIndex: 0, sourceIds: ["academy-fluency"] },
  { id: "q08", lessonSlug: "discern-verify-protect", unitId: "unit-1", correctIndex: 3, sourceIds: ["support-tool-access", "support-connectors"] },
  { id: "q09", lessonSlug: "work-with-files", unitId: "unit-2", correctIndex: 1, sourceIds: ["support-files"] },
  { id: "q10", lessonSlug: "work-with-files", unitId: "unit-2", correctIndex: 2, sourceIds: ["academy-files", "support-files"] },
  { id: "q11", lessonSlug: "build-projects", unitId: "unit-2", correctIndex: 3, sourceIds: ["support-projects"] },
  { id: "q12", lessonSlug: "build-projects", unitId: "unit-2", correctIndex: 0, sourceIds: ["academy-projects", "github-claudeblattman"] },
  { id: "q13", lessonSlug: "create-artifacts", unitId: "unit-2", correctIndex: 2, sourceIds: ["academy-artifacts", "support-artifacts"] },
  { id: "q14", lessonSlug: "create-artifacts", unitId: "unit-2", correctIndex: 1, sourceIds: ["academy-artifacts", "support-artifacts"] },
  { id: "q15", lessonSlug: "research-with-citations", unitId: "unit-2", correctIndex: 0, sourceIds: ["support-research"] },
  { id: "q16", lessonSlug: "research-with-citations", unitId: "unit-2", correctIndex: 3, sourceIds: ["academy-research", "github-cookbooks"] },
  { id: "q17", lessonSlug: "extend-with-tools", unitId: "unit-3", correctIndex: 1, sourceIds: ["support-skills", "support-connectors"] },
  { id: "q18", lessonSlug: "extend-with-tools", unitId: "unit-3", correctIndex: 2, sourceIds: ["support-skills", "github-anthropic-skills"] },
  { id: "q19", lessonSlug: "delegate-with-cowork", unitId: "unit-3", correctIndex: 3, sourceIds: ["support-cowork", "support-tool-access"] },
  { id: "q20", lessonSlug: "delegate-with-cowork", unitId: "unit-3", correctIndex: 0, sourceIds: ["academy-cowork", "support-cowork"] },
  { id: "q21", lessonSlug: "software-engineering", unitId: "unit-3", correctIndex: 2, sourceIds: ["github-claude-code", "github-cwc-workshops"] },
  { id: "q22", lessonSlug: "software-engineering", unitId: "unit-3", correctIndex: 1, sourceIds: ["github-claude-code-action", "github-superpowers"] },
  { id: "q23", lessonSlug: "research-and-data", unitId: "unit-4", correctIndex: 0, sourceIds: ["github-cookbooks", "github-academic-workflow"] },
  { id: "q24", lessonSlug: "research-and-data", unitId: "unit-4", correctIndex: 3, sourceIds: ["github-cookbooks"] },
  { id: "q25", lessonSlug: "writing-and-office", unitId: "unit-4", correctIndex: 1, sourceIds: ["github-paper-writing", "github-knowledge-work"] },
  { id: "q26", lessonSlug: "writing-and-office", unitId: "unit-4", correctIndex: 2, sourceIds: ["academy-files", "academy-powerpoint"] },
  { id: "q27", lessonSlug: "teaching-and-learning", unitId: "unit-4", correctIndex: 3, sourceIds: ["github-k12-teacher-skills"] },
  { id: "q28", lessonSlug: "teaching-and-learning", unitId: "unit-4", correctIndex: 0, sourceIds: ["github-learning-opportunities"] },
  { id: "q29", lessonSlug: "portfolio-capstone", unitId: "unit-4", correctIndex: 2, sourceIds: ["academy-fluency"] },
  { id: "q30", lessonSlug: "portfolio-capstone", unitId: "unit-4", correctIndex: 1, sourceIds: ["github-academic-workflow", "github-claudeblattman"] },
] as const satisfies readonly ClaudeQuizManifest[];

/** Stable, versioned bank from which each balanced sixteen-question attempt is drawn. */
export const CLAUDE_FINAL_QUIZ_IDS = CLAUDE_QUIZ.map((question) => question.id) as readonly ClaudeQuizId[];

export const CLAUDE_FINAL_QUIZ = {
  bankVersion: CLAUDE_QUIZ_BANK_VERSION,
  bankQuestionIds: CLAUDE_FINAL_QUIZ_IDS,
  bankSize: 30,
  questionCount: 16,
  questionsPerUnit: 4,
  passingCorrectAnswers: 13,
  selectionPolicy: "stratified-random" as const,
  scorePolicy: "best-score" as const,
  bestScoreStorageKey: "claude.quizBest",
  passedStorageKey: "claude.quizPassed",
  versionStorageKey: "claude.quizBankVersion",
} as const;

export function getClaudeQuizBest(progress: Readonly<Record<string, unknown>>): number | null {
  const value = progress[CLAUDE_FINAL_QUIZ.bestScoreStorageKey];
  return progress[CLAUDE_FINAL_QUIZ.versionStorageKey] === CLAUDE_QUIZ_BANK_VERSION
    && typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= CLAUDE_FINAL_QUIZ.questionCount
    ? value
    : null;
}

export function isClaudeQuizPassed(progress: Readonly<Record<string, unknown>>): boolean {
  const best = getClaudeQuizBest(progress);
  return progress[CLAUDE_FINAL_QUIZ.passedStorageKey] === true
    && best !== null
    && best >= CLAUDE_FINAL_QUIZ.passingCorrectAnswers;
}

export const CLAUDE_QUIZ_BY_ID = Object.fromEntries(
  CLAUDE_QUIZ.map((question) => [question.id, question]),
) as unknown as Readonly<Record<ClaudeQuizId, ClaudeQuizManifest>>;
