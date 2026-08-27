import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { RESPONSIBLE_AI_MODULES } from "./modules";
import type { ResponsibleAiSourceId } from "./sources";

export const RESPONSIBLE_AI_QUIZ_VERSION = "2026.08.26-quiz-v1";

const generatedQuestionBank = buildModuleQuestionBank(
  RESPONSIBLE_AI_MODULES,
  {
    criticalQuestionCategories: {
      "q-purpose-risk-classification-boundary": "safety",
      "q-data-rights-privacy-minimisation-core": "provenance",
      "q-human-authority-oversight-boundaries-core": "safety",
      "q-escalation-appeal-contestability-boundary": "safety",
      "q-governance-dossier-capstone-core": "provenance",
    },
  },
);

if (generatedQuestionBank.length !== 30) {
  throw new Error(
    `Responsible AI requires exactly 30 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const RESPONSIBLE_AI_QUESTION_BANK = generatedQuestionBank as unknown as
  CourseKitNonEmpty<(typeof generatedQuestionBank)[number]>;

export type ResponsibleAiQuestionId =
  (typeof RESPONSIBLE_AI_QUESTION_BANK)[number]["id"];

export const RESPONSIBLE_AI_CRITICAL_QUESTION_IDS = Object.freeze(
  RESPONSIBLE_AI_QUESTION_BANK
    .filter((question) => question.critical === true)
    .map((question) => question.id),
);

export const RESPONSIBLE_AI_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: RESPONSIBLE_AI_QUIZ_VERSION,
  drawCount: 12,
  passCount: 10,
  questions: RESPONSIBLE_AI_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
    criticalCategory: question.criticalCategory,
  })) as unknown as CourseKitQuiz<
    ResponsibleAiQuestionId,
    ResponsibleAiSourceId
  >["questions"],
} satisfies CourseKitQuiz<ResponsibleAiQuestionId, ResponsibleAiSourceId>;
