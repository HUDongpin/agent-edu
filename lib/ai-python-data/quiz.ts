import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { AI_PYTHON_DATA_MODULES } from "./modules";
import type { AiPythonDataSourceId } from "./sources";

export const AI_PYTHON_DATA_QUIZ_VERSION = "2026.08.26-quiz-v1";

const generatedQuestionBank = buildModuleQuestionBank(
  AI_PYTHON_DATA_MODULES,
  {
    criticalQuestionCategories: {
      "q-environment-notebooks-seeds-reproducibility-boundary": "provenance",
      "q-tests-errors-types-debugging-core": "safety",
      "q-cleaning-missingness-validation-provenance-boundary": "provenance",
      "q-visualisation-honest-charts-boundary": "safety",
      "q-files-apis-joins-reproducible-pipelines-core": "provenance",
    },
  },
);

if (generatedQuestionBank.length !== 30) {
  throw new Error(
    `AI Python & Data requires exactly 30 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const AI_PYTHON_DATA_QUESTION_BANK = generatedQuestionBank as unknown as
  CourseKitNonEmpty<(typeof generatedQuestionBank)[number]>;

export type AiPythonDataQuestionId =
  (typeof AI_PYTHON_DATA_QUESTION_BANK)[number]["id"];

export const AI_PYTHON_DATA_CRITICAL_QUESTION_IDS = Object.freeze(
  AI_PYTHON_DATA_QUESTION_BANK
    .filter((question) => question.critical === true)
    .map((question) => question.id),
);

export const AI_PYTHON_DATA_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: AI_PYTHON_DATA_QUIZ_VERSION,
  drawCount: 12,
  passCount: 10,
  questions: AI_PYTHON_DATA_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
    criticalCategory: question.criticalCategory,
  })) as unknown as CourseKitQuiz<
    AiPythonDataQuestionId,
    AiPythonDataSourceId
  >["questions"],
} satisfies CourseKitQuiz<AiPythonDataQuestionId, AiPythonDataSourceId>;
