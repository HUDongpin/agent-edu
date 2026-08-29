export const LAB_CONCURRENCY = 4;

export const STAGE_1_PLAN = {
  calls: 1,
  maxOutputTokensPerCall: 250,
  maxOutputTokens: 250,
} as const;

export const STAGE_3_PLAN = {
  calls: 3,
  maxOutputTokensPerCall: 300,
  maxOutputTokens: 900,
} as const;

export const EVAL_PLAN = {
  generatorCalls: 20,
  judgeCalls: 8,
  calls: 28,
  generatorMaxOutputTokens: 280,
  judgeMaxOutputTokens: 250,
  maxOutputTokens: 7_600,
  concurrency: LAB_CONCURRENCY,
} as const;

export const TWO_EVAL_PLAN = {
  calls: EVAL_PLAN.calls * 2,
  maxOutputTokens: EVAL_PLAN.maxOutputTokens * 2,
} as const;

export const RECOMMENDED_LAB_JOURNEY = {
  calls: STAGE_1_PLAN.calls + STAGE_3_PLAN.calls + TWO_EVAL_PLAN.calls,
  maxOutputTokens: STAGE_1_PLAN.maxOutputTokens
    + STAGE_3_PLAN.maxOutputTokens
    + TWO_EVAL_PLAN.maxOutputTokens,
} as const;

export function assertEvalShape(totalCases: number, judgeCases: number): void {
  if (totalCases !== EVAL_PLAN.generatorCalls || judgeCases > EVAL_PLAN.judgeCalls) {
    throw new RangeError(
      `Eval plan drifted: expected ${EVAL_PLAN.generatorCalls} generators and at most ${EVAL_PLAN.judgeCalls} judges.`,
    );
  }
}
