import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { DEEP_LEARNING_MODULES } from "./modules";
import type { DeepLearningSourceId } from "./sources";

export const DEEP_LEARNING_QUIZ_VERSION = "2026.08.26-quiz-v1";

const generatedQuestionBank = buildModuleQuestionBank(DEEP_LEARNING_MODULES, {
  criticalQuestionCategories: {
    "q-training-loops-debugging-boundary": "rollback",
    "q-transformer-encoder-decoder-core": "reproducibility",
    "q-tokenisation-pretraining-boundary": "leakage",
    "q-fine-tuning-parameter-efficient-adaptation-boundary": "human-authority",
    "q-robustness-evaluation-training-card-capstone-boundary": "reproducibility",
  },
});

if (generatedQuestionBank.length !== 36) {
  throw new Error(
    `Deep Learning requires exactly 36 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const DEEP_LEARNING_QUESTION_BANK = generatedQuestionBank as unknown as
  CourseKitNonEmpty<(typeof generatedQuestionBank)[number]>;

export type DeepLearningQuestionId =
  (typeof DEEP_LEARNING_QUESTION_BANK)[number]["id"];

export const DEEP_LEARNING_CRITICAL_QUESTION_IDS = Object.freeze(
  DEEP_LEARNING_QUESTION_BANK.filter(
    (question) => question.critical === true,
  ).map((question) => question.id),
);

export const DEEP_LEARNING_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: DEEP_LEARNING_QUIZ_VERSION,
  drawCount: 16,
  passCount: 13,
  questions: DEEP_LEARNING_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
    criticalCategory: question.criticalCategory,
  })) as unknown as CourseKitQuiz<
    DeepLearningQuestionId,
    DeepLearningSourceId
  >["questions"],
} satisfies CourseKitQuiz<DeepLearningQuestionId, DeepLearningSourceId>;
