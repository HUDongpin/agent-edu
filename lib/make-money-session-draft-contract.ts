/**
 * Fixed ownership policy for Course 11 learner work.
 *
 * Drafts survive route changes and refreshes only within the current browser
 * tab. They are not durable completion evidence and are never uploaded. A
 * Course 11 reset or confirmed global progress reset removes all four drafts
 * plus the probe; unrelated sessionStorage entries are preserved.
 */
export const MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY =
  "aicourse.course11.session-draft-probe.v1";
export const MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY =
  "aicourse.course11.margin.v1";
export const MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY =
  "aicourse.course11.quiz-answers.v1";
export const MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY =
  "aicourse.course11.scorecard.v1";
export const MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY =
  "aicourse.course11.offer.v1";
export const MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS = [
  MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY,
] as const;
export type MakeMoneyWithCodexSessionDraftKey =
  (typeof MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS)[number];
