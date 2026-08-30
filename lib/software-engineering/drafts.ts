import {
  SOFTWARE_ENGINEERING_QUESTION_IDS,
  type SoftwareEngineeringQuestion,
  type SoftwareEngineeringQuestionId,
} from "./types";
import {
  SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE,
  SOFTWARE_ENGINEERING_PROGRESS_QUIZ,
} from "../progress-topology";
import type { SoftwareEngineeringReleaseDecision } from "./capstone";

export const SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY =
  "softwareEngineering.assessmentDraft.v1" as const;
export const SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY =
  "softwareEngineering.capstoneDraft.v1" as const;

export interface SoftwareEngineeringAssessmentDraft {
  readonly version: 1;
  readonly bankVersion: string;
  readonly questionIds: readonly SoftwareEngineeringQuestionId[];
  readonly questionIndex: number;
  readonly selectedIndex: number | null;
  readonly answerSelections: Readonly<Record<string, number>>;
}

export interface SoftwareEngineeringCapstoneDraft {
  readonly version: 1;
  readonly capstoneSchemaVersion: string;
  readonly artifactIds: readonly string[];
  readonly reviewedGateIds: readonly string[];
  readonly score: number | null;
  readonly decision: SoftwareEngineeringReleaseDecision | "";
  readonly safetyBoundaryAttested: boolean;
}

type AssessmentDraftConfig = {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
};

type CapstoneDraftConfig = {
  readonly schemaVersion: string;
  readonly artifacts: readonly { readonly id: string }[];
  readonly releaseGates: readonly { readonly id: string }[];
  readonly totalPoints: number;
  readonly releaseDecisions: readonly SoftwareEngineeringReleaseDecision[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOptionIndex(value: unknown, question: SoftwareEngineeringQuestion): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value < question.options.length;
}

/**
 * Decode only a resumable attempt from the current assessment bank.
 * Correctness is intentionally not stored in the draft and is recomputed from
 * the immutable bank when the component renders feedback or calculates a score.
 */
export function parseSoftwareEngineeringAssessmentDraft(
  value: unknown,
  bank: readonly SoftwareEngineeringQuestion[],
  config: AssessmentDraftConfig,
): SoftwareEngineeringAssessmentDraft | null {
  if (!isRecord(value)
    || value.version !== 1
    || value.bankVersion !== config.bankVersion
    || !Array.isArray(value.questionIds)
    || value.questionIds.length !== config.questionCount
    || !Number.isInteger(value.questionIndex)
    || !isRecord(value.answerSelections)) {
    return null;
  }

  const questionIndex = value.questionIndex as number;
  if (questionIndex < 0 || questionIndex >= value.questionIds.length) return null;

  const bankById = new Map(bank.map((question) => [question.id, question]));
  const questionIds: SoftwareEngineeringQuestionId[] = [];
  const selectedQuestions: SoftwareEngineeringQuestion[] = [];
  const seenIds = new Set<string>();
  for (const id of value.questionIds) {
    if (typeof id !== "string" || seenIds.has(id)) return null;
    const question = bankById.get(id as SoftwareEngineeringQuestionId);
    if (!question) return null;
    seenIds.add(id);
    questionIds.push(question.id);
    selectedQuestions.push(question);
  }

  const unitCounts = new Map<string, number>();
  for (const question of selectedQuestions) {
    unitCounts.set(question.unitId, (unitCounts.get(question.unitId) ?? 0) + 1);
  }
  if (unitCounts.size * config.questionsPerUnit !== config.questionCount
    || [...unitCounts.values()].some((count) => count !== config.questionsPerUnit)) {
    return null;
  }

  const answerSelections: Record<string, number> = {};
  for (const [id, selectedIndex] of Object.entries(value.answerSelections)) {
    const selectedQuestionIndex = questionIds.indexOf(id as SoftwareEngineeringQuestionId);
    const question = selectedQuestions[selectedQuestionIndex];
    if (!question || selectedQuestionIndex > questionIndex || !isOptionIndex(selectedIndex, question)) {
      return null;
    }
    answerSelections[id] = selectedIndex;
  }

  for (let index = 0; index < questionIndex; index += 1) {
    if (answerSelections[questionIds[index]] === undefined) return null;
  }

  const current = selectedQuestions[questionIndex];
  const currentAnswer = answerSelections[current.id];
  const selectedIndex = value.selectedIndex;
  if (currentAnswer !== undefined) {
    if (selectedIndex !== currentAnswer) return null;
  } else if (selectedIndex !== null && !isOptionIndex(selectedIndex, current)) {
    return null;
  }

  return {
    version: 1,
    bankVersion: config.bankVersion,
    questionIds,
    questionIndex,
    selectedIndex: selectedIndex as number | null,
    answerSelections,
  };
}

/** Lightweight validity check for shared progress adapters and journey CTAs. */
export function hasSoftwareEngineeringAssessmentDraftActivity(value: unknown): boolean {
  if (!isRecord(value)
    || value.version !== 1
    || value.bankVersion !== SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bankVersion
    || !Array.isArray(value.questionIds)
    || value.questionIds.length !== SOFTWARE_ENGINEERING_PROGRESS_QUIZ.questionCount
    || !Number.isInteger(value.questionIndex)
    || !isRecord(value.answerSelections)) {
    return false;
  }

  const questionIndex = value.questionIndex as number;
  if (questionIndex < 0 || questionIndex >= value.questionIds.length) return false;
  const allowedIds = new Set<string>(SOFTWARE_ENGINEERING_QUESTION_IDS);
  const seenIds = new Set<string>();
  const unitCounts = [0, 0, 0, 0, 0];
  for (const id of value.questionIds) {
    if (typeof id !== "string" || seenIds.has(id) || !allowedIds.has(id)) return false;
    seenIds.add(id);
    const bankIndex = SOFTWARE_ENGINEERING_QUESTION_IDS.indexOf(
      id as SoftwareEngineeringQuestionId,
    );
    unitCounts[Math.floor(bankIndex / 5)] += 1;
  }
  if (unitCounts.some((count) => count !== 3)) return false;

  const answerSelections: Record<string, number> = {};
  for (const [id, selectedIndex] of Object.entries(value.answerSelections)) {
    const selectedQuestionIndex = value.questionIds.indexOf(id);
    if (selectedQuestionIndex < 0
      || selectedQuestionIndex > questionIndex
      || typeof selectedIndex !== "number"
      || !Number.isInteger(selectedIndex)
      || selectedIndex < 0
      || selectedIndex > 3) return false;
    answerSelections[id] = selectedIndex;
  }
  for (let index = 0; index < questionIndex; index += 1) {
    if (answerSelections[value.questionIds[index] as string] === undefined) return false;
  }

  const currentId = value.questionIds[questionIndex] as string;
  const currentAnswer = answerSelections[currentId];
  if (currentAnswer !== undefined) return value.selectedIndex === currentAnswer;
  return value.selectedIndex === null || (
    typeof value.selectedIndex === "number"
    && Number.isInteger(value.selectedIndex)
    && value.selectedIndex >= 0
    && value.selectedIndex <= 3
  );
}

function parseUniqueKnownIds(
  value: unknown,
  allowedIds: ReadonlySet<string>,
): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const id of value) {
    if (typeof id !== "string" || seen.has(id) || !allowedIds.has(id)) return null;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/** Decode a capstone working draft only when its evidence contract is current. */
export function parseSoftwareEngineeringCapstoneDraft(
  value: unknown,
  config: CapstoneDraftConfig,
): SoftwareEngineeringCapstoneDraft | null {
  if (!isRecord(value)
    || value.version !== 1
    || value.capstoneSchemaVersion !== config.schemaVersion
    || typeof value.safetyBoundaryAttested !== "boolean") {
    return null;
  }

  const artifactIds = parseUniqueKnownIds(
    value.artifactIds,
    new Set(config.artifacts.map((artifact) => artifact.id)),
  );
  const reviewedGateIds = parseUniqueKnownIds(
    value.reviewedGateIds,
    new Set(config.releaseGates.map((gate) => gate.id)),
  );
  if (!artifactIds || !reviewedGateIds) return null;

  const score = value.score;
  if (score !== null && (
    typeof score !== "number"
    || !Number.isFinite(score)
  )) return null;

  const decision = value.decision;
  if (decision !== "" && !config.releaseDecisions.includes(
    decision as SoftwareEngineeringReleaseDecision,
  )) return null;

  return {
    version: 1,
    capstoneSchemaVersion: config.schemaVersion,
    artifactIds,
    reviewedGateIds,
    score: score as number | null,
    decision: decision as SoftwareEngineeringReleaseDecision | "",
    safetyBoundaryAttested: value.safetyBoundaryAttested,
  };
}

export function hasSoftwareEngineeringCapstoneDraftActivity(value: unknown): boolean {
  if (!isRecord(value)
    || value.version !== 1
    || value.capstoneSchemaVersion !== SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.schemaVersion
    || typeof value.safetyBoundaryAttested !== "boolean") return false;

  const artifactIds = parseUniqueKnownIds(
    value.artifactIds,
    new Set<string>(SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.artifactIds),
  );
  const reviewedGateIds = parseUniqueKnownIds(
    value.reviewedGateIds,
    new Set<string>(SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.releaseGateIds),
  );
  if (!artifactIds || !reviewedGateIds) return false;
  if (value.score !== null && (
    typeof value.score !== "number"
    || !Number.isFinite(value.score)
  )) return false;
  if (value.decision !== "" && !SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.releaseDecisions.includes(
    value.decision as SoftwareEngineeringReleaseDecision,
  )) return false;

  return artifactIds.length > 0
    || reviewedGateIds.length > 0
    || value.score !== null
    || value.decision !== ""
    || value.safetyBoundaryAttested;
}
