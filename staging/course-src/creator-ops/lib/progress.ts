import { CREATOR_OPS_COURSE_MANIFEST } from "./manifest";
import type {
  CreatorOpsFinalQuestionCopy,
  CreatorOpsModuleSlug,
} from "./types";

export const CREATOR_OPS_PROGRESS_PREFIX = "creator-ops.";
export const CREATOR_OPS_PROGRESS_VERSION =
  `${CREATOR_OPS_COURSE_MANIFEST.version}:progress-v1`;
export const CREATOR_OPS_PROGRESS_VERSION_KEY = "creator-ops.progress.version";
export const CREATOR_OPS_PROGRESS_EVENT = "creator-ops:progress-change";
export const CREATOR_OPS_PROGRESS_RESET_EVENT = "creator-ops:progress-reset";
export const CREATOR_OPS_QUIZ_BEST_KEY = "creator-ops.quiz.best";
export const CREATOR_OPS_QUIZ_PASSED_KEY = "creator-ops.quiz.passed";
export const CREATOR_OPS_CAPSTONE_KEY = "creator-ops.capstone.v1";
export const CREATOR_OPS_CAPSTONE_CHECKS_KEY = "creator-ops.capstone.checks";
export const CREATOR_OPS_QUIZ_PASS_PERCENT = 80;
export const CREATOR_OPS_CAPSTONE_ARTIFACT_COUNT = 10;
export const CREATOR_OPS_PROGRESS_MILESTONES =
  CREATOR_OPS_COURSE_MANIFEST.modules.length + 2;

export function creatorOpsArtifactEvidenceKey(slug: CreatorOpsModuleSlug): string {
  return `creator-ops.module.${slug}.artifact`;
}

export function creatorOpsCheckpointKey(slug: CreatorOpsModuleSlug): string {
  return `creator-ops.module.${slug}.checkpoint`;
}

export function creatorOpsCheckpointPassedKey(slug: CreatorOpsModuleSlug): string {
  return `creator-ops.module.${slug}.checkpoint.passed`;
}

export function creatorOpsModuleProgressKey(slug: CreatorOpsModuleSlug): string {
  return `creator-ops.module.${slug}.complete`;
}

export function normalizeCreatorOpsProgress(
  candidate: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = { ...candidate };
  if (normalized[CREATOR_OPS_PROGRESS_VERSION_KEY] !== CREATOR_OPS_PROGRESS_VERSION) {
    for (const key of Object.keys(normalized)) {
      if (key.startsWith(CREATOR_OPS_PROGRESS_PREFIX)) delete normalized[key];
    }
  }
  normalized[CREATOR_OPS_PROGRESS_VERSION_KEY] = CREATOR_OPS_PROGRESS_VERSION;
  return normalized;
}

export function isMeaningfulCreatorOpsArtifact(value: string): boolean {
  const normalized = value.normalize("NFKC").trim();
  const substantiveLines = normalized
    .split(/\r?\n/u)
    .map((line) => line.replace(/^\s*(?:[-*#]|\d+[.)])\s*/u, "").trim())
    .filter((line) => line.length >= 12);
  const meaningfulCharacters = Array.from(normalized.toLocaleLowerCase())
    .filter((character) => /[\p{L}\p{N}]/u.test(character));
  const frequencies = new Map<string, number>();
  for (const character of meaningfulCharacters) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  }
  const mostRepeated = Math.max(0, ...frequencies.values());
  const repetitionRatio = meaningfulCharacters.length > 0
    ? mostRepeated / meaningfulCharacters.length
    : 1;
  return normalized.length >= 120
    && substantiveLines.length >= 3
    && frequencies.size >= 18
    && repetitionRatio <= 0.35;
}

function normalizeCreatorOpsArtifactForComparison(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\p{Cf}/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function creatorOpsArtifactTrigrams(value: string): Set<string> {
  const normalized = normalizeCreatorOpsArtifactForComparison(value);
  const trigrams = new Set<string>();
  for (let index = 0; index <= normalized.length - 3; index += 1) {
    trigrams.add(normalized.slice(index, index + 3));
  }
  return trigrams;
}

export function isMeaningfulCreatorOpsArtifactDraft(
  value: string,
  referenceTemplate: string,
): boolean {
  if (!isMeaningfulCreatorOpsArtifact(value)) return false;
  const normalizedDraft = normalizeCreatorOpsArtifactForComparison(value);
  const normalizedTemplate = normalizeCreatorOpsArtifactForComparison(referenceTemplate);
  if (normalizedTemplate && normalizedDraft.includes(normalizedTemplate)) return false;
  const draftTrigrams = creatorOpsArtifactTrigrams(value);
  const templateTrigrams = creatorOpsArtifactTrigrams(referenceTemplate);
  if (draftTrigrams.size === 0 || templateTrigrams.size === 0) return true;
  let overlap = 0;
  for (const trigram of draftTrigrams) {
    if (templateTrigrams.has(trigram)) overlap += 1;
  }
  const union = new Set([...draftTrigrams, ...templateTrigrams]).size;
  const similarity = union === 0 ? 0 : overlap / union;
  const templateCoverage = overlap / templateTrigrams.size;
  return similarity < 0.9 && templateCoverage < 0.8;
}

export function isCreatorOpsModuleComplete(
  record: Record<string, unknown>,
  slug: CreatorOpsModuleSlug,
): boolean {
  return record[creatorOpsModuleProgressKey(slug)] === true
    && record[creatorOpsArtifactEvidenceKey(slug)] === true
    && record[creatorOpsCheckpointPassedKey(slug)] === true;
}

export function reconcileCreatorOpsModuleCompletion(
  record: Record<string, unknown>,
  slug: CreatorOpsModuleSlug,
): boolean {
  const complete = record[creatorOpsArtifactEvidenceKey(slug)] === true
    && record[creatorOpsCheckpointPassedKey(slug)] === true;
  record[creatorOpsModuleProgressKey(slug)] = complete;
  return complete;
}

export function creatorOpsProgressPercent(record: Record<string, unknown>): number {
  if (record[CREATOR_OPS_PROGRESS_VERSION_KEY] !== CREATOR_OPS_PROGRESS_VERSION) return 0;
  const modules = CREATOR_OPS_COURSE_MANIFEST.modules.filter((module) =>
    isCreatorOpsModuleComplete(record, module.slug),
  ).length;
  const quiz = record[CREATOR_OPS_QUIZ_PASSED_KEY] === true ? 1 : 0;
  const capstone = isCreatorOpsCapstoneComplete(record) ? 1 : 0;
  return Math.round(((modules + quiz + capstone) / CREATOR_OPS_PROGRESS_MILESTONES) * 100);
}

export function hasCreatorOpsCapstonePrerequisites(
  record: Record<string, unknown>,
): boolean {
  return CREATOR_OPS_COURSE_MANIFEST.modules.every((module) =>
    isCreatorOpsModuleComplete(record, module.slug),
  ) && record[CREATOR_OPS_QUIZ_PASSED_KEY] === true;
}

export function isCreatorOpsCapstoneComplete(
  record: Record<string, unknown>,
): boolean {
  return record[CREATOR_OPS_CAPSTONE_KEY] === true
    && hasCreatorOpsCapstonePrerequisites(record);
}

export function gradeCreatorOpsAssessment(
  questions: readonly CreatorOpsFinalQuestionCopy[],
  answers: Readonly<Record<string, number>>,
): { correct: number; total: number; percent: number; passed: boolean } {
  const correct = questions.filter(
    (question) => answers[question.id] === question.correctIndex,
  ).length;
  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent, passed: percent >= CREATOR_OPS_QUIZ_PASS_PERCENT };
}

export function recordCreatorOpsAssessment(
  record: Record<string, unknown>,
  percent: number,
): void {
  const previousBest = typeof record[CREATOR_OPS_QUIZ_BEST_KEY] === "number"
    ? record[CREATOR_OPS_QUIZ_BEST_KEY] as number
    : 0;
  record[CREATOR_OPS_QUIZ_BEST_KEY] = Math.max(previousBest, percent);
  if (percent >= CREATOR_OPS_QUIZ_PASS_PERCENT) {
    record[CREATOR_OPS_QUIZ_PASSED_KEY] = true;
  }
}

export function recordCreatorOpsCapstone(
  record: Record<string, unknown>,
  checks: readonly boolean[],
): boolean {
  const complete = hasCreatorOpsCapstonePrerequisites(record)
    && checks.length === CREATOR_OPS_CAPSTONE_ARTIFACT_COUNT
    && checks.every(Boolean);
  record[CREATOR_OPS_CAPSTONE_CHECKS_KEY] = [...checks];
  record[CREATOR_OPS_CAPSTONE_KEY] = complete;
  return complete;
}
