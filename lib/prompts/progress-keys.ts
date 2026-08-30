export const PROMPT_PROGRESS_STORAGE_KEY = "ae.progress";
export const PROMPT_PROGRESS_EVENT = "aicourse:prompts-progress";
export const PROMPT_PROGRESS_RESET_EVENT = "aicourse:prompts-progress-reset";
export const PROMPT_PROGRESS_PREFIX = "prompts.";
export const PROMPT_QUIZ_BANK_VERSION = "2026-08-23.v1";
export const PROMPT_LEGACY_UNVERSIONED_QUIZ_BANK_VERSION = "2026-08-23.v1";
export const PROMPT_QUIZ_MAX_SCORE = 9;
export const PROMPT_QUIZ_PASS_SCORE = 7;
export const PROMPT_QUIZ_VERSION_KEY = "prompts.quiz.version";
export const PROMPT_QUIZ_BEST_KEY = "prompts.quiz.best";
export const PROMPT_QUIZ_PASSED_KEY = "prompts.quiz.passed";
export const PROMPT_QUIZ_DRAFT_KEY = "prompts.quiz.draft.v1";
export const PROMPT_CAPSTONE_KEY = "prompts.capstone.v2.passed";
export const PROMPT_CAPSTONE_REQUIRED_KEY = "prompts.capstone.v2.required";
export const PROMPT_CAPSTONE_SCORES_KEY = "prompts.capstone.v2.scores";
export const PROMPT_CAPSTONE_REQUIRED_COUNT = 6;
export const PROMPT_CAPSTONE_RUBRIC_COUNT = 5;
export const PROMPT_CAPSTONE_PASS_SCORE = 8;

/**
 * Course 7 originally persisted the unchanged quiz bank without a version.
 * Recognize only the complete legacy result shape so existing learners keep
 * their earned score while malformed or explicitly stale records fail closed.
 */
export function isLegacyPromptQuizResultForBank(
  record: Readonly<Record<string, unknown>>,
  bankVersion: string,
): boolean {
  const best = record[PROMPT_QUIZ_BEST_KEY];
  const passed = record[PROMPT_QUIZ_PASSED_KEY];
  return bankVersion === PROMPT_LEGACY_UNVERSIONED_QUIZ_BANK_VERSION
    && record[PROMPT_QUIZ_VERSION_KEY] === undefined
    && typeof passed === "boolean"
    && typeof best === "number"
    && Number.isInteger(best)
    && best >= 0
    && best <= PROMPT_QUIZ_MAX_SCORE
    && passed === (best >= PROMPT_QUIZ_PASS_SCORE);
}

export function isLegacyPromptQuizResult(record: Readonly<Record<string, unknown>>): boolean {
  return isLegacyPromptQuizResultForBank(record, PROMPT_QUIZ_BANK_VERSION);
}

export function isCurrentPromptQuizResult(record: Readonly<Record<string, unknown>>): boolean {
  if (isLegacyPromptQuizResult(record)) return true;
  const best = record[PROMPT_QUIZ_BEST_KEY];
  const passed = record[PROMPT_QUIZ_PASSED_KEY];
  return record[PROMPT_QUIZ_VERSION_KEY] === PROMPT_QUIZ_BANK_VERSION
    && typeof passed === "boolean"
    && typeof best === "number"
    && Number.isInteger(best)
    && best >= 0
    && best <= PROMPT_QUIZ_MAX_SCORE
    && passed === (best >= PROMPT_QUIZ_PASS_SCORE);
}

export function storedPromptQuizBest(record: Readonly<Record<string, unknown>>): number | null {
  return isCurrentPromptQuizResult(record) ? record[PROMPT_QUIZ_BEST_KEY] as number : null;
}

export function isPromptQuizPassed(record: Readonly<Record<string, unknown>>): boolean {
  return isCurrentPromptQuizResult(record) && record[PROMPT_QUIZ_PASSED_KEY] === true;
}

export function migrateLegacyPromptQuizResult(record: Record<string, unknown>): boolean {
  if (!isLegacyPromptQuizResult(record)) return false;
  record[PROMPT_QUIZ_VERSION_KEY] = PROMPT_QUIZ_BANK_VERSION;
  return true;
}

function isPromptCapstoneScore(value: unknown): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 1
    && value <= 2;
}

/** A passing packet cannot compensate for an absent rubric dimension. */
export function promptCapstoneScoresPass(
  scores: readonly unknown[],
  passScore: number,
): boolean {
  if (scores.length === 0 || !scores.every(isPromptCapstoneScore)) return false;
  return scores.reduce((sum, score) => sum + score, 0) >= passScore;
}

function exactIndexedValues(
  value: unknown,
  count: number,
  predicate: (entry: unknown) => boolean,
): unknown[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const expectedKeys = Array.from({ length: count }, (_, index) => String(index));
  if (Object.keys(record).length !== expectedKeys.length) return null;
  if (!expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(record, key))) return null;
  const values = expectedKeys.map((key) => record[key]);
  return values.every(predicate) ? values : null;
}

/** Count a capstone pass only when its self-attestation evidence is intact. */
export function isPromptCapstonePassed(record: Readonly<Record<string, unknown>>): boolean {
  if (record[PROMPT_CAPSTONE_KEY] !== true) return false;
  const required = exactIndexedValues(
    record[PROMPT_CAPSTONE_REQUIRED_KEY],
    PROMPT_CAPSTONE_REQUIRED_COUNT,
    (value) => value === true,
  );
  const scores = exactIndexedValues(
    record[PROMPT_CAPSTONE_SCORES_KEY],
    PROMPT_CAPSTONE_RUBRIC_COUNT,
    (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 2,
  );
  return required !== null
    && scores !== null
    && promptCapstoneScoresPass(scores, PROMPT_CAPSTONE_PASS_SCORE);
}

function normalizeIndexedRecord(
  record: Record<string, unknown>,
  key: string,
  count: number,
): boolean {
  const value = record[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const source = value as Record<string, unknown>;
  const normalized = Object.fromEntries(
    Array.from({ length: count }, (_, index) => String(index))
      .filter((index) => Object.prototype.hasOwnProperty.call(source, index))
      .map((index) => [index, source[index]]),
  );
  if (Object.keys(source).length === Object.keys(normalized).length) return false;
  record[key] = normalized;
  return true;
}

/** Remove retired indexed fields while preserving every current learner value. */
export function normalizePromptCapstoneProgress(record: Record<string, unknown>): boolean {
  const requiredChanged = normalizeIndexedRecord(
    record,
    PROMPT_CAPSTONE_REQUIRED_KEY,
    PROMPT_CAPSTONE_REQUIRED_COUNT,
  );
  const scoresChanged = normalizeIndexedRecord(
    record,
    PROMPT_CAPSTONE_SCORES_KEY,
    PROMPT_CAPSTONE_RUBRIC_COUNT,
  );
  return requiredChanged || scoresChanged;
}

/** Prevent an invalid saved flag from becoming valid later without a fresh attestation. */
export function invalidateIncompletePromptCapstone(record: Record<string, unknown>): boolean {
  if (record[PROMPT_CAPSTONE_KEY] !== true || isPromptCapstonePassed(record)) return false;
  record[PROMPT_CAPSTONE_KEY] = false;
  return true;
}
