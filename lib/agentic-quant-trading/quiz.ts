import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { AGENTIC_QUANT_TRADING_MODULES } from "./modules";
import type { AgenticQuantTradingSourceId } from "./sources";

export const AGENTIC_QUANT_TRADING_QUIZ_VERSION = "2026.08.26-quiz-v1";

const generatedQuestionBank = buildModuleQuestionBank(
  AGENTIC_QUANT_TRADING_MODULES,
  {
    criticalQuestionIds: [
      "q-scope-safety-autonomy-core",
      "q-scope-safety-autonomy-boundary",
      "q-market-data-time-contracts-core",
      "q-backtest-leakage-costs-core",
      "q-backtest-leakage-costs-boundary",
      "q-portfolio-risk-deterministic-gates-core",
      "q-paper-execution-reconciliation-core",
      "q-monitoring-kill-switch-incidents-core",
    ],
  },
);

if (generatedQuestionBank.length !== 36) {
  throw new Error(
    `Agentic Quant Trading requires exactly 36 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const AGENTIC_QUANT_TRADING_QUESTION_BANK =
  generatedQuestionBank as unknown as CourseKitNonEmpty<
    (typeof generatedQuestionBank)[number]
  >;

export type AgenticQuantTradingQuestionId =
  (typeof AGENTIC_QUANT_TRADING_QUESTION_BANK)[number]["id"];

export const AGENTIC_QUANT_TRADING_CRITICAL_QUESTION_IDS = Object.freeze(
  AGENTIC_QUANT_TRADING_QUESTION_BANK.filter(
    (question) => question.critical === true,
  ).map((question) => question.id),
);

export const AGENTIC_QUANT_TRADING_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: AGENTIC_QUANT_TRADING_QUIZ_VERSION,
  drawCount: 12,
  passCount: 10,
  questions: AGENTIC_QUANT_TRADING_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
  })) as unknown as CourseKitQuiz<
    AgenticQuantTradingQuestionId,
    AgenticQuantTradingSourceId
  >["questions"],
} satisfies CourseKitQuiz<
  AgenticQuantTradingQuestionId,
  AgenticQuantTradingSourceId
>;
