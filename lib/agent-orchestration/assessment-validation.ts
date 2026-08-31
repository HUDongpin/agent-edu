import { AGENT_ORCHESTRATION_PROGRESS_SCHEMA } from "../progress-topology";

export const AGENT_ORCHESTRATION_QUIZ_BEST_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey;
export const AGENT_ORCHESTRATION_QUIZ_PASSED_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey;
export const AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassPercent;

function validScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}

export function readAgentOrchestrationQuizBest(
  progress: Readonly<Record<string, unknown>>,
): number {
  return validScore(progress[AGENT_ORCHESTRATION_QUIZ_BEST_KEY]);
}

export function recordAgentOrchestrationQuizAttempt(
  progress: Record<string, unknown>,
  score: number,
  passPercent: number,
): void {
  const nextBest = Math.max(
    readAgentOrchestrationQuizBest(progress),
    validScore(score),
  );
  progress[AGENT_ORCHESTRATION_QUIZ_BEST_KEY] = nextBest;
  progress[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY] =
    progress[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY] === true
    || nextBest >= passPercent;
}

export function isAgentOrchestrationQuizPassed(
  progress: Readonly<Record<string, unknown>>,
): boolean {
  return progress[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY] === true
    && readAgentOrchestrationQuizBest(progress)
      >= AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT;
}
