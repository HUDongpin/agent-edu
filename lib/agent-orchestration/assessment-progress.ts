import type {
  AgentOrchestrationAssessmentQuestionCopy,
} from "./types";

export {
  AGENT_ORCHESTRATION_QUIZ_BEST_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASSED_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT,
  isAgentOrchestrationQuizPassed,
  readAgentOrchestrationQuizBest,
  recordAgentOrchestrationQuizAttempt,
} from "./assessment-validation";

export type AgentOrchestrationAssessmentAnswers = Readonly<
  Record<string, string>
>;

export interface AgentOrchestrationAssessmentQuestionResult {
  readonly checkpointId: string;
  readonly selectedOptionId: string | null;
  readonly answered: boolean;
  readonly correct: boolean;
}

export interface AgentOrchestrationAssessmentResult {
  readonly answeredCount: number;
  readonly questionCount: number;
  readonly correctCount: number;
  readonly score: number;
  readonly passed: boolean;
  readonly missedCheckpointIds: readonly string[];
  readonly questionResults: readonly AgentOrchestrationAssessmentQuestionResult[];
}

export function gradeAgentOrchestrationAssessment(
  questions: readonly AgentOrchestrationAssessmentQuestionCopy[],
  answers: AgentOrchestrationAssessmentAnswers,
  passPercent: number,
): AgentOrchestrationAssessmentResult {
  const questionResults = questions.map(({ checkpoint }) => {
    const candidate = answers[checkpoint.checkpointId];
    const selectedOptionId = typeof candidate === "string"
      && checkpoint.options.some((option) => option.id === candidate)
      ? candidate
      : null;
    return {
      checkpointId: checkpoint.checkpointId,
      selectedOptionId,
      answered: selectedOptionId !== null,
      correct: selectedOptionId === checkpoint.correctOptionId,
    };
  });
  const answeredCount = questionResults.filter((result) => result.answered).length;
  const correctCount = questionResults.filter((result) => result.correct).length;
  const questionCount = questionResults.length;
  const score = questionCount > 0
    ? Math.round((correctCount / questionCount) * 100)
    : 0;
  return {
    answeredCount,
    questionCount,
    correctCount,
    score,
    passed: answeredCount === questionCount && score >= passPercent,
    missedCheckpointIds: questionResults
      .filter((result) => !result.correct)
      .map((result) => result.checkpointId),
    questionResults,
  };
}
