function isPromptCapstoneScore(value: unknown): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 1
    && value <= 2;
}

/**
 * A passing packet must clear the point threshold without leaving any rubric
 * dimension absent. A score of zero means the corresponding evidence is not
 * present, so a high score elsewhere cannot compensate for it.
 */
export function promptCapstoneScoresPass(
  scores: readonly unknown[],
  passScore: number,
): boolean {
  if (scores.length === 0 || !scores.every(isPromptCapstoneScore)) return false;
  return scores.reduce((sum, score) => sum + score, 0) >= passScore;
}
