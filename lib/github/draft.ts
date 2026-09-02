import {
  GITHUB_QUIZ_IDS,
  GITHUB_UNIT_IDS,
  type GithubQuizId,
  type GithubUnitId,
} from "./types";
import {
  GITHUB_CAPSTONE_DRAFT_KEY,
  GITHUB_QUIZ_DRAFT_KEY,
} from "../github-progress-keys";

export { GITHUB_CAPSTONE_DRAFT_KEY, GITHUB_QUIZ_DRAFT_KEY };
export const GITHUB_QUIZ_DRAFT_SCHEMA_VERSION = 1 as const;
export const GITHUB_CAPSTONE_DRAFT_SCHEMA_VERSION = 1 as const;

export interface GithubQuizDraftQuestion {
  readonly id: GithubQuizId;
  readonly unitId: GithubUnitId;
  readonly optionCount: number;
}

export interface GithubQuizDraftContext {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
  readonly questions: readonly GithubQuizDraftQuestion[];
}

export interface GithubQuizDraftState {
  readonly orderedQuestionIds: readonly GithubQuizId[];
  readonly questionIndex: number;
  readonly selectedIndex: number | null;
  readonly submittedAnswers: Readonly<Record<string, number>>;
}

export interface GithubQuizDraftV1 extends GithubQuizDraftState {
  readonly schemaVersion: typeof GITHUB_QUIZ_DRAFT_SCHEMA_VERSION;
  readonly bankVersion: string;
}

export interface GithubCapstoneDraftContext {
  readonly artifactSetVersion: string;
  readonly artifactIds: readonly string[];
}

export interface GithubCapstoneDraftState {
  readonly checkedArtifactIds: readonly string[];
}

export interface GithubCapstoneDraftV1 extends GithubCapstoneDraftState {
  readonly schemaVersion: typeof GITHUB_CAPSTONE_DRAFT_SCHEMA_VERSION;
  readonly artifactSetVersion: string;
  readonly artifactIds: readonly string[];
}

type QuizContextIndex = {
  readonly questions: ReadonlyMap<GithubQuizId, GithubQuizDraftQuestion>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isValidOption(value: unknown, optionCount: number): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value < optionCount;
}

function quizContextIndex(context: GithubQuizDraftContext): QuizContextIndex | null {
  if (
    !isNonEmptyString(context.bankVersion)
    || !Number.isInteger(context.questionCount)
    || context.questionCount <= 0
    || !Number.isInteger(context.questionsPerUnit)
    || context.questionsPerUnit <= 0
    || context.questionCount !== GITHUB_UNIT_IDS.length * context.questionsPerUnit
    || context.questions.length !== GITHUB_QUIZ_IDS.length
  ) {
    return null;
  }

  const currentIds = new Set<string>(GITHUB_QUIZ_IDS);
  const currentUnits = new Set<string>(GITHUB_UNIT_IDS);
  const questions = new Map<GithubQuizId, GithubQuizDraftQuestion>();
  for (const question of context.questions) {
    if (
      !currentIds.has(question.id)
      || !currentUnits.has(question.unitId)
      || questions.has(question.id)
      || !Number.isInteger(question.optionCount)
      || question.optionCount <= 0
    ) {
      return null;
    }
    questions.set(question.id, { ...question });
  }
  return questions.size === currentIds.size ? { questions } : null;
}

function orderedAttempt(
  value: unknown,
  context: GithubQuizDraftContext,
  contextIndex: QuizContextIndex,
): GithubQuizId[] | null {
  if (!Array.isArray(value) || value.length !== context.questionCount) return null;

  const ids: GithubQuizId[] = [];
  const seen = new Set<GithubQuizId>();
  const counts = new Map<GithubUnitId, number>(
    GITHUB_UNIT_IDS.map((unitId) => [unitId, 0]),
  );
  for (const candidate of value) {
    if (
      typeof candidate !== "string"
      || !contextIndex.questions.has(candidate as GithubQuizId)
      || seen.has(candidate as GithubQuizId)
    ) {
      return null;
    }
    const id = candidate as GithubQuizId;
    const question = contextIndex.questions.get(id)!;
    seen.add(id);
    ids.push(id);
    counts.set(question.unitId, (counts.get(question.unitId) ?? 0) + 1);
  }

  return GITHUB_UNIT_IDS.every(
    (unitId) => counts.get(unitId) === context.questionsPerUnit,
  )
    ? ids
    : null;
}

export function decodeGithubQuizDraft(
  value: unknown,
  context: GithubQuizDraftContext,
): GithubQuizDraftV1 | null {
  if (!isRecord(value)) return null;
  const contextIndex = quizContextIndex(context);
  if (
    !contextIndex
    || value.schemaVersion !== GITHUB_QUIZ_DRAFT_SCHEMA_VERSION
    || value.bankVersion !== context.bankVersion
  ) {
    return null;
  }

  const orderedQuestionIds = orderedAttempt(
    value.orderedQuestionIds,
    context,
    contextIndex,
  );
  if (
    !orderedQuestionIds
    || !Number.isInteger(value.questionIndex)
    || (value.questionIndex as number) < 0
    || (value.questionIndex as number) >= orderedQuestionIds.length
    || !isRecord(value.submittedAnswers)
  ) {
    return null;
  }

  const questionIndex = value.questionIndex as number;
  const currentId = orderedQuestionIds[questionIndex];
  const currentQuestion = contextIndex.questions.get(currentId)!;
  if (
    value.selectedIndex !== null
    && !isValidOption(value.selectedIndex, currentQuestion.optionCount)
  ) {
    return null;
  }

  const attemptPositions = new Map(
    orderedQuestionIds.map((id, index) => [id, index]),
  );
  const submittedAnswers: Record<string, number> = {};
  for (const [candidateId, selectedIndex] of Object.entries(value.submittedAnswers)) {
    const id = candidateId as GithubQuizId;
    const position = attemptPositions.get(id);
    const question = contextIndex.questions.get(id);
    if (
      position === undefined
      || position > questionIndex
      || !question
      || !isValidOption(selectedIndex, question.optionCount)
    ) {
      return null;
    }
    submittedAnswers[id] = selectedIndex;
  }

  for (let index = 0; index < questionIndex; index += 1) {
    if (!Object.hasOwn(submittedAnswers, orderedQuestionIds[index])) return null;
  }
  if (
    Object.hasOwn(submittedAnswers, currentId)
    && submittedAnswers[currentId] !== value.selectedIndex
  ) {
    return null;
  }

  const canonicalAnswers = Object.fromEntries(
    orderedQuestionIds
      .filter((id) => Object.hasOwn(submittedAnswers, id))
      .map((id) => [id, submittedAnswers[id]]),
  );
  return {
    schemaVersion: GITHUB_QUIZ_DRAFT_SCHEMA_VERSION,
    bankVersion: context.bankVersion,
    orderedQuestionIds,
    questionIndex,
    selectedIndex: value.selectedIndex as number | null,
    submittedAnswers: canonicalAnswers,
  };
}

export function encodeGithubQuizDraft(
  state: GithubQuizDraftState,
  context: GithubQuizDraftContext,
): GithubQuizDraftV1 | null {
  return decodeGithubQuizDraft({
    schemaVersion: GITHUB_QUIZ_DRAFT_SCHEMA_VERSION,
    bankVersion: context.bankVersion,
    orderedQuestionIds: [...state.orderedQuestionIds],
    questionIndex: state.questionIndex,
    selectedIndex: state.selectedIndex,
    submittedAnswers: { ...state.submittedAnswers },
  }, context);
}

export function getGithubQuizDraft(
  progress: Record<string, unknown>,
  context: GithubQuizDraftContext,
): GithubQuizDraftV1 | null {
  try {
    return decodeGithubQuizDraft(progress[GITHUB_QUIZ_DRAFT_KEY], context);
  } catch {
    return null;
  }
}

export function setGithubQuizDraft(
  progress: Record<string, unknown>,
  state: GithubQuizDraftState,
  context: GithubQuizDraftContext,
): boolean {
  const draft = encodeGithubQuizDraft(state, context);
  if (!draft) return false;
  try {
    progress[GITHUB_QUIZ_DRAFT_KEY] = draft;
    return true;
  } catch {
    return false;
  }
}

export function clearGithubQuizDraft(progress: Record<string, unknown>): boolean {
  try {
    if (!Object.hasOwn(progress, GITHUB_QUIZ_DRAFT_KEY)) return false;
    return delete progress[GITHUB_QUIZ_DRAFT_KEY];
  } catch {
    return false;
  }
}

export function clearInvalidGithubQuizDraft(
  progress: Record<string, unknown>,
  context: GithubQuizDraftContext,
): boolean {
  if (!Object.hasOwn(progress, GITHUB_QUIZ_DRAFT_KEY)) return false;
  if (getGithubQuizDraft(progress, context)) return false;
  return clearGithubQuizDraft(progress);
}

function capstoneArtifactIds(context: GithubCapstoneDraftContext): readonly string[] | null {
  if (!isNonEmptyString(context.artifactSetVersion) || context.artifactIds.length === 0) {
    return null;
  }
  const seen = new Set<string>();
  for (const id of context.artifactIds) {
    if (!isNonEmptyString(id) || seen.has(id)) return null;
    seen.add(id);
  }
  return [...context.artifactIds];
}

function sameArtifactSet(value: unknown, currentIds: readonly string[]): boolean {
  if (!Array.isArray(value) || value.length !== currentIds.length) return false;
  const current = new Set(currentIds);
  const seen = new Set<string>();
  for (const id of value) {
    if (typeof id !== "string" || !current.has(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return seen.size === current.size;
}

export function decodeGithubCapstoneDraft(
  value: unknown,
  context: GithubCapstoneDraftContext,
): GithubCapstoneDraftV1 | null {
  if (!isRecord(value)) return null;
  const currentIds = capstoneArtifactIds(context);
  if (
    !currentIds
    || value.schemaVersion !== GITHUB_CAPSTONE_DRAFT_SCHEMA_VERSION
    || value.artifactSetVersion !== context.artifactSetVersion
    || !sameArtifactSet(value.artifactIds, currentIds)
    || !Array.isArray(value.checkedArtifactIds)
  ) {
    return null;
  }

  const currentSet = new Set(currentIds);
  const checked = new Set<string>();
  for (const id of value.checkedArtifactIds) {
    if (typeof id !== "string" || !currentSet.has(id) || checked.has(id)) return null;
    checked.add(id);
  }
  return {
    schemaVersion: GITHUB_CAPSTONE_DRAFT_SCHEMA_VERSION,
    artifactSetVersion: context.artifactSetVersion,
    artifactIds: currentIds,
    checkedArtifactIds: currentIds.filter((id) => checked.has(id)),
  };
}

export function encodeGithubCapstoneDraft(
  state: GithubCapstoneDraftState,
  context: GithubCapstoneDraftContext,
): GithubCapstoneDraftV1 | null {
  const currentIds = capstoneArtifactIds(context);
  if (!currentIds || !Array.isArray(state.checkedArtifactIds)) return null;
  const currentSet = new Set(currentIds);
  if (state.checkedArtifactIds.some((id) => !currentSet.has(id))) return null;
  const checked = new Set(state.checkedArtifactIds);
  return decodeGithubCapstoneDraft({
    schemaVersion: GITHUB_CAPSTONE_DRAFT_SCHEMA_VERSION,
    artifactSetVersion: context.artifactSetVersion,
    artifactIds: currentIds,
    checkedArtifactIds: currentIds.filter((id) => checked.has(id)),
  }, context);
}

export function getGithubCapstoneDraft(
  progress: Record<string, unknown>,
  context: GithubCapstoneDraftContext,
): GithubCapstoneDraftV1 | null {
  try {
    return decodeGithubCapstoneDraft(progress[GITHUB_CAPSTONE_DRAFT_KEY], context);
  } catch {
    return null;
  }
}

export function setGithubCapstoneDraft(
  progress: Record<string, unknown>,
  state: GithubCapstoneDraftState,
  context: GithubCapstoneDraftContext,
): boolean {
  const draft = encodeGithubCapstoneDraft(state, context);
  if (!draft) return false;
  try {
    progress[GITHUB_CAPSTONE_DRAFT_KEY] = draft;
    return true;
  } catch {
    return false;
  }
}

export function clearGithubCapstoneDraft(progress: Record<string, unknown>): boolean {
  try {
    if (!Object.hasOwn(progress, GITHUB_CAPSTONE_DRAFT_KEY)) return false;
    return delete progress[GITHUB_CAPSTONE_DRAFT_KEY];
  } catch {
    return false;
  }
}

export function clearInvalidGithubCapstoneDraft(
  progress: Record<string, unknown>,
  context: GithubCapstoneDraftContext,
): boolean {
  if (!Object.hasOwn(progress, GITHUB_CAPSTONE_DRAFT_KEY)) return false;
  if (getGithubCapstoneDraft(progress, context)) return false;
  return clearGithubCapstoneDraft(progress);
}
