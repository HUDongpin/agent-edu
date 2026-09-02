import { CLAUDE_INCOME_COURSE } from "@/lib/claude-income/curriculum";
import {
  CLAUDE_INCOME_FINAL_QUIZ,
  CLAUDE_INCOME_QUIZ_BANK,
} from "@/lib/claude-income/quiz";
import { createClaudeIncomeQuizAttemptConfig } from "./quiz-attempt-store";

export const CLAUDE_INCOME_QUIZ_ATTEMPT_CONFIG = createClaudeIncomeQuizAttemptConfig({
  bankVersion: CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
  questionCount: CLAUDE_INCOME_FINAL_QUIZ.questionCount,
  questionsPerUnit: CLAUDE_INCOME_FINAL_QUIZ.questionsPerUnit,
  unitIds: CLAUDE_INCOME_COURSE.units.map((unit) => unit.id),
  questions: CLAUDE_INCOME_QUIZ_BANK,
});
