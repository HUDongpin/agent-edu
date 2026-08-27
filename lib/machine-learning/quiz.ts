import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { MACHINE_LEARNING_MODULES } from "./modules";
import type { MachineLearningSourceId } from "./sources";

export const MACHINE_LEARNING_QUIZ_VERSION = "2026.08.26-quiz-v1";

const generatedQuestionBank = buildModuleQuestionBank(
  MACHINE_LEARNING_MODULES,
  {
    criticalQuestionCategories: {
      "q-framing-baselines-splits-core": "leakage",
      "q-framing-baselines-splits-boundary": "leakage",
      "q-imbalanced-data-metrics-boundary": "human-authority",
      "q-calibration-thresholds-error-analysis-core": "human-authority",
      "q-anomaly-detection-boundary": "human-authority",
      "q-leakage-reproducibility-model-card-capstone-core": "reproducibility",
      "q-leakage-reproducibility-model-card-capstone-boundary": "rollback",
    },
  },
);

if (generatedQuestionBank.length !== 36) {
  throw new Error(
    `Machine Learning requires exactly 36 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const MACHINE_LEARNING_QUESTION_BANK = generatedQuestionBank as unknown as
  CourseKitNonEmpty<(typeof generatedQuestionBank)[number]>;

export type MachineLearningQuestionId =
  (typeof MACHINE_LEARNING_QUESTION_BANK)[number]["id"];

export const MACHINE_LEARNING_CRITICAL_QUESTION_IDS = Object.freeze(
  MACHINE_LEARNING_QUESTION_BANK
    .filter((question) => question.critical === true)
    .map((question) => question.id),
);

export const MACHINE_LEARNING_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: MACHINE_LEARNING_QUIZ_VERSION,
  drawCount: 16,
  passCount: 13,
  questions: MACHINE_LEARNING_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
    criticalCategory: question.criticalCategory,
  })) as unknown as CourseKitQuiz<
    MachineLearningQuestionId,
    MachineLearningSourceId
  >["questions"],
} satisfies CourseKitQuiz<MachineLearningQuestionId, MachineLearningSourceId>;
