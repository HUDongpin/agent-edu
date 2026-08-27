import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { AI_RESEARCH_MODULES } from "./modules";
import type { AiResearchSourceId } from "./sources";

export const AI_RESEARCH_QUIZ_VERSION = "2026.08.26-quiz-v1";

const generatedQuestionBank = buildModuleQuestionBank(
  AI_RESEARCH_MODULES,
  {
    criticalQuestionCategories: {
      "q-question-protocol-preregistration-boundary": "provenance",
      "q-screening-inclusion-exclusion-core": "safety",
      "q-citation-verification-rag-locator-core": "provenance",
      "q-reproducibility-uncertainty-ai-disclosure-core": "provenance",
      "q-auditable-mini-review-capstone-core": "safety",
    },
  },
);

if (generatedQuestionBank.length !== 30) {
  throw new Error(
    `AI Research requires exactly 30 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const AI_RESEARCH_QUESTION_BANK = generatedQuestionBank as unknown as
  CourseKitNonEmpty<(typeof generatedQuestionBank)[number]>;

export type AiResearchQuestionId =
  (typeof AI_RESEARCH_QUESTION_BANK)[number]["id"];

export const AI_RESEARCH_CRITICAL_QUESTION_IDS = Object.freeze(
  AI_RESEARCH_QUESTION_BANK
    .filter((question) => question.critical === true)
    .map((question) => question.id),
);

export const AI_RESEARCH_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: AI_RESEARCH_QUIZ_VERSION,
  drawCount: 12,
  passCount: 10,
  questions: AI_RESEARCH_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
    criticalCategory: question.criticalCategory,
  })) as unknown as CourseKitQuiz<AiResearchQuestionId, AiResearchSourceId>["questions"],
} satisfies CourseKitQuiz<AiResearchQuestionId, AiResearchSourceId>;
