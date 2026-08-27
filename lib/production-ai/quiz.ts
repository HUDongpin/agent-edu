import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { PRODUCTION_AI_MODULES } from "./modules";
import type { ProductionAiSourceId } from "./sources";

export const PRODUCTION_AI_QUIZ_VERSION = "2026.08.26-quiz-v1";

const generatedQuestionBank = buildModuleQuestionBank(PRODUCTION_AI_MODULES, {
  criticalQuestionCategories: {
    "q-experiment-tracking-reproducibility-boundary": "reproducibility",
    "q-model-registry-approval-cards-core": "human-authority",
    "q-packaging-security-secrets-boundary": "leakage",
    "q-shadow-canary-feature-flags-boundary": "rollback",
    "q-monitoring-performance-cost-boundary": "reproducibility",
    "q-incident-response-rollback-postmortem-core": "rollback",
    "q-dual-system-production-capstone-boundary": "human-authority",
  },
});

if (generatedQuestionBank.length !== 36) {
  throw new Error(
    `Production AI requires exactly 36 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const PRODUCTION_AI_QUESTION_BANK = generatedQuestionBank as unknown as
  CourseKitNonEmpty<(typeof generatedQuestionBank)[number]>;

export type ProductionAiQuestionId =
  (typeof PRODUCTION_AI_QUESTION_BANK)[number]["id"];

export const PRODUCTION_AI_CRITICAL_QUESTION_IDS = Object.freeze(
  PRODUCTION_AI_QUESTION_BANK.filter(
    (question) => question.critical === true,
  ).map((question) => question.id),
);

export const PRODUCTION_AI_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: PRODUCTION_AI_QUIZ_VERSION,
  drawCount: 16,
  passCount: 13,
  questions: PRODUCTION_AI_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
    criticalCategory: question.criticalCategory,
  })) as unknown as CourseKitQuiz<
    ProductionAiQuestionId,
    ProductionAiSourceId
  >["questions"],
} satisfies CourseKitQuiz<ProductionAiQuestionId, ProductionAiSourceId>;
