import type { CursorQuizId, CursorQuizManifest } from "./types";

export const CURSOR_QUIZ_BANK_VERSION = "2" as const;

export const CURSOR_QUIZ = [
  { id: "q01", lessonSlug: "orient-privacy", unitId: "unit-1", correctOptionId: "b", sourceIds: ["cursor-quickstart"] },
  { id: "q02", lessonSlug: "orient-privacy", unitId: "unit-1", correctOptionId: "c", sourceIds: ["cursor-data-use", "cursor-security-hardening"] },
  { id: "q03", lessonSlug: "tab-inline-edit", unitId: "unit-1", correctOptionId: "a", sourceIds: ["cursor-tab"] },
  { id: "q04", lessonSlug: "tab-inline-edit", unitId: "unit-1", correctOptionId: "d", sourceIds: ["cursor-inline-edit"] },
  { id: "q05", lessonSlug: "agent-interface", unitId: "unit-1", correctOptionId: "c", sourceIds: ["cursor-agent-overview"] },
  { id: "q06", lessonSlug: "agent-interface", unitId: "unit-1", correctOptionId: "b", sourceIds: ["cursor-agent-overview"] },
  { id: "q07", lessonSlug: "task-contracts", unitId: "unit-1", correctOptionId: "d", sourceIds: ["cursor-prompting"] },
  { id: "q08", lessonSlug: "task-contracts", unitId: "unit-1", correctOptionId: "a", sourceIds: ["cursor-planning"] },

  { id: "q09", lessonSlug: "plan-execute-steer", unitId: "unit-2", correctOptionId: "b", sourceIds: ["cursor-planning"] },
  { id: "q10", lessonSlug: "plan-execute-steer", unitId: "unit-2", correctOptionId: "c", sourceIds: ["cursor-plan-mode-blog", "cursor-shell"] },
  { id: "q11", lessonSlug: "test-review-recover", unitId: "unit-2", correctOptionId: "a", sourceIds: ["cursor-learn-debug", "github-superpowers"] },
  { id: "q12", lessonSlug: "test-review-recover", unitId: "unit-2", correctOptionId: "d", sourceIds: ["cursor-agent-review", "cursor-learn-review"] },
  { id: "q13", lessonSlug: "rules-skills-mcp", unitId: "unit-2", correctOptionId: "b", sourceIds: ["cursor-rules"] },
  { id: "q14", lessonSlug: "rules-skills-mcp", unitId: "unit-2", correctOptionId: "c", sourceIds: ["cursor-skills", "github-tutor"] },
  { id: "q15", lessonSlug: "cloud-parallel", unitId: "unit-2", correctOptionId: "d", sourceIds: ["cursor-subagents", "cursor-cloud-agents"] },
  { id: "q16", lessonSlug: "cloud-parallel", unitId: "unit-2", correctOptionId: "a", sourceIds: ["cursor-cloud-agents", "cursor-cloud-best-practices"] },

  { id: "q17", lessonSlug: "software-studio", unitId: "unit-3", correctOptionId: "c", sourceIds: ["cursor-browser", "cursor-learn-features"] },
  { id: "q18", lessonSlug: "software-studio", unitId: "unit-3", correctOptionId: "b", sourceIds: ["cursor-browser", "cursor-learn-review"] },
  { id: "q19", lessonSlug: "research-studio", unitId: "unit-3", correctOptionId: "a", sourceIds: ["github-domain-agent"] },
  { id: "q20", lessonSlug: "research-studio", unitId: "unit-3", correctOptionId: "d", sourceIds: ["github-domain-agent", "cursor-browser"] },
  { id: "q21", lessonSlug: "writing-studio", unitId: "unit-3", correctOptionId: "b", sourceIds: ["github-strapi-docs", "cursor-rules"] },
  { id: "q22", lessonSlug: "writing-studio", unitId: "unit-3", correctOptionId: "c", sourceIds: ["github-strapi-docs", "cursor-prompting"] },
  { id: "q23", lessonSlug: "office-studio", unitId: "unit-3", correctOptionId: "d", sourceIds: ["cursor-google-workspace", "cursor-mcp"] },
  { id: "q24", lessonSlug: "office-studio", unitId: "unit-3", correctOptionId: "a", sourceIds: ["github-product-managers", "github-plaintext-crm"] },

  { id: "q25", lessonSlug: "teaching-studio", unitId: "unit-4", correctOptionId: "c", sourceIds: ["cursor-students", "cursor-learn-understand", "github-tutor"] },
  { id: "q26", lessonSlug: "teaching-studio", unitId: "unit-4", correctOptionId: "b", sourceIds: ["cursor-data-use", "github-tutor"] },
  { id: "q27", lessonSlug: "workflow-capstone", unitId: "unit-4", correctOptionId: "a", sourceIds: ["cursor-planning", "cursor-agent-review"] },
  { id: "q28", lessonSlug: "workflow-capstone", unitId: "unit-4", correctOptionId: "d", sourceIds: ["course-capstone-fixture", "github-superpowers"] },
] as const satisfies readonly CursorQuizManifest[];

export const CURSOR_FINAL_QUIZ_IDS = CURSOR_QUIZ.map((question) => question.id) as readonly CursorQuizId[];

export const CURSOR_FINAL_QUIZ = {
  bankVersion: CURSOR_QUIZ_BANK_VERSION,
  bankQuestionIds: CURSOR_FINAL_QUIZ_IDS,
  bankSize: 28,
  questionCount: 12,
  questionsPerUnit: 3,
  passingCorrectAnswers: 10,
  selectionPolicy: "stratified-random" as const,
  scorePolicy: "best-score" as const,
  bestScoreStorageKey: "cursor.quizBest",
  passedStorageKey: "cursor.quizPassed",
  versionStorageKey: "cursor.quizBankVersion",
} as const;

export function getCursorQuizBest(progress: Readonly<Record<string, unknown>>): number | null {
  const value = progress[CURSOR_FINAL_QUIZ.bestScoreStorageKey];
  return progress[CURSOR_FINAL_QUIZ.versionStorageKey] === CURSOR_QUIZ_BANK_VERSION
    && typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= CURSOR_FINAL_QUIZ.questionCount
    ? value
    : null;
}

export function isCursorQuizPassed(progress: Readonly<Record<string, unknown>>): boolean {
  const best = getCursorQuizBest(progress);
  return progress[CURSOR_FINAL_QUIZ.passedStorageKey] === true
    && best !== null
    && best >= CURSOR_FINAL_QUIZ.passingCorrectAnswers;
}

export const CURSOR_QUIZ_BY_ID = Object.fromEntries(
  CURSOR_QUIZ.map((question) => [question.id, question]),
) as unknown as Readonly<Record<CursorQuizId, CursorQuizManifest>>;
