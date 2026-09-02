import type { CodexIncomeMarginInputs } from "./economics";

type QuizDraftQuestion = {
  readonly id: string;
  readonly options: readonly unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  requireEveryKey = true,
): boolean {
  const expected = new Set(expectedKeys);
  const actual = Object.keys(value);
  return (!requireEveryKey || actual.length === expected.size)
    && actual.every((key) => expected.has(key));
}

export const MARGIN_SESSION_DRAFT_NUMERIC_KEYS = [
  "takeHome",
  "annualHours",
  "utilisation",
  "overhead",
  "reserve",
  "projectHours",
  "directCosts",
  "riskBuffer",
  "quote",
] as const satisfies readonly (keyof CodexIncomeMarginInputs)[];

const MARGIN_SESSION_DRAFT_KEYS = [
  "currency",
  "observedOn",
  ...MARGIN_SESSION_DRAFT_NUMERIC_KEYS,
] as const satisfies readonly (keyof CodexIncomeMarginInputs)[];

/**
 * Decode only the public workbench fields. Exact-key checks prevent a stale or
 * externally modified record from smuggling private diagnostics into a later
 * autosave under this progress-owned key.
 */
export function parseMarginSessionDraft(value: unknown): CodexIncomeMarginInputs | null {
  if (!isRecord(value) || !hasOnlyKeys(value, MARGIN_SESSION_DRAFT_KEYS)) return null;
  if (typeof value.currency !== "string"
    || value.currency.length > 3
    || !/^[A-Z]*$/.test(value.currency)
    || typeof value.observedOn !== "string"
    || value.observedOn.length > 10) return null;
  for (const key of MARGIN_SESSION_DRAFT_NUMERIC_KEYS) {
    if (typeof value[key] !== "number" || !Number.isFinite(value[key])) return null;
  }
  return {
    currency: value.currency,
    observedOn: value.observedOn,
    takeHome: value.takeHome as number,
    annualHours: value.annualHours as number,
    utilisation: value.utilisation as number,
    overhead: value.overhead as number,
    reserve: value.reserve as number,
    projectHours: value.projectHours as number,
    directCosts: value.directCosts as number,
    riskBuffer: value.riskBuffer as number,
    quote: value.quote as number,
  };
}

export function parseQuizAnswersSessionDraft(
  value: unknown,
  questions: readonly QuizDraftQuestion[],
): Record<string, number> | null {
  if (!isRecord(value)) return null;
  const optionCounts = new Map(questions.map((question) => [
    question.id,
    question.options.length,
  ]));
  if (!hasOnlyKeys(value, [...optionCounts.keys()], false)) return null;
  const restored: Record<string, number> = {};
  for (const [questionId, answer] of Object.entries(value)) {
    const optionCount = optionCounts.get(questionId);
    if (optionCount === undefined
      || typeof answer !== "number"
      || !Number.isInteger(answer)
      || answer < 0
      || answer >= optionCount) return null;
    restored[questionId] = answer;
  }
  return restored;
}

export const SCORECARD_SESSION_DRAFT_SCORE_KEYS = [
  "pain",
  "frequency",
  "buyerAccess",
  "budget",
  "evidence",
  "speed",
  "repeatability",
  "dataRisk",
  "support",
  "dependency",
] as const;
export const SCORECARD_SESSION_DRAFT_CANDIDATE_MAX_LENGTH = 240;
export const SCORECARD_SESSION_DRAFT_EVIDENCE_MAX_LENGTH = 4_000;

export type ScorecardSessionDraftScoreKey =
  (typeof SCORECARD_SESSION_DRAFT_SCORE_KEYS)[number];
export type ScorecardSessionDraftScores =
  Record<ScorecardSessionDraftScoreKey, number>;
export type ScorecardSessionDraftEvidence =
  Record<ScorecardSessionDraftScoreKey, string>;
export type ScorecardSessionDraft = {
  readonly scores: ScorecardSessionDraftScores;
  readonly candidate: string;
  readonly evidence: ScorecardSessionDraftEvidence;
};

export const EMPTY_SCORECARD_SESSION_DRAFT: ScorecardSessionDraft = {
  scores: Object.fromEntries(
    SCORECARD_SESSION_DRAFT_SCORE_KEYS.map((key) => [key, 0]),
  ) as ScorecardSessionDraftScores,
  candidate: "",
  evidence: Object.fromEntries(
    SCORECARD_SESSION_DRAFT_SCORE_KEYS.map((key) => [key, ""]),
  ) as ScorecardSessionDraftEvidence,
};

export function parseScorecardSessionDraft(value: unknown): ScorecardSessionDraft | null {
  if (!isRecord(value)
    || !hasOnlyKeys(value, ["scores", "candidate", "evidence"])
    || !isRecord(value.scores)
    || !hasOnlyKeys(value.scores, SCORECARD_SESSION_DRAFT_SCORE_KEYS)
    || !isRecord(value.evidence)
    || !hasOnlyKeys(value.evidence, SCORECARD_SESSION_DRAFT_SCORE_KEYS)
    || typeof value.candidate !== "string"
    || value.candidate.length > SCORECARD_SESSION_DRAFT_CANDIDATE_MAX_LENGTH) return null;

  const scores = {} as ScorecardSessionDraftScores;
  const evidence = {} as ScorecardSessionDraftEvidence;
  for (const key of SCORECARD_SESSION_DRAFT_SCORE_KEYS) {
    const score = value.scores[key];
    const note = value.evidence[key];
    if (typeof score !== "number"
      || !Number.isInteger(score)
      || score < 0
      || score > 5
      || typeof note !== "string"
      || note.length > SCORECARD_SESSION_DRAFT_EVIDENCE_MAX_LENGTH) return null;
    scores[key] = score;
    evidence[key] = note;
  }
  return { scores, candidate: value.candidate, evidence };
}

export const OFFER_SESSION_DRAFT_KEYS = [
  "buyer",
  "problem",
  "outcome",
  "inputs",
  "scope",
  "nonGoals",
  "acceptance",
  "handoff",
  "stop",
] as const;
export const OFFER_SESSION_DRAFT_FIELD_MAX_LENGTH = 4_000;

export type OfferSessionDraftKey = (typeof OFFER_SESSION_DRAFT_KEYS)[number];
export type OfferSessionDraft = Record<OfferSessionDraftKey, string>;
export const EMPTY_OFFER_SESSION_DRAFT = Object.fromEntries(
  OFFER_SESSION_DRAFT_KEYS.map((key) => [key, ""]),
) as OfferSessionDraft;

export function parseOfferSessionDraft(value: unknown): OfferSessionDraft | null {
  if (!isRecord(value) || !hasOnlyKeys(value, OFFER_SESSION_DRAFT_KEYS)) return null;
  const restored = {} as OfferSessionDraft;
  for (const key of OFFER_SESSION_DRAFT_KEYS) {
    if (typeof value[key] !== "string"
      || value[key].length > OFFER_SESSION_DRAFT_FIELD_MAX_LENGTH) return null;
    restored[key] = value[key];
  }
  return restored;
}
