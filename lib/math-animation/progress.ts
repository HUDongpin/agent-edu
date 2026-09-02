import {
  MATH_ANIMATION_MODULE_SLUGS,
  MATH_ANIMATION_VERSION,
  type MathAnimationModuleSlug,
} from "./types";

export const MATH_ANIMATION_PROGRESS_PREFIX = "math-animation.";
export const MATH_ANIMATION_PROGRESS_VERSION =
  `${MATH_ANIMATION_VERSION}:progress-v1`;
export const MATH_ANIMATION_PROGRESS_VERSION_KEY =
  "math-animation.progress.version";
export const MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY =
  "math-animation.progress.reset-generation";
export const MATH_ANIMATION_PROGRESS_EVENT =
  "math-animation:progress-change";
export const MATH_ANIMATION_PROGRESS_RESET_EVENT =
  "math-animation:progress-reset";
export const MATH_ANIMATION_QUIZ_BEST_KEY = "math-animation.quiz.best";
export const MATH_ANIMATION_QUIZ_PASSED_KEY = "math-animation.quiz.passed";
export const MATH_ANIMATION_CAPSTONE_KEY = "math-animation.capstone.v1";
export const MATH_ANIMATION_CAPSTONE_CHECKS_KEY =
  "math-animation.capstone.checks";
export const MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY =
  "math-animation.capstone.evidence";
export const MATH_ANIMATION_QUIZ_PASS_PERCENT = 80;
export const MATH_ANIMATION_CAPSTONE_ARTIFACT_COUNT = 6;
export const MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH = 12;
export const MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH = 20;
export const MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH = 80;
export const MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH = 2_048;
export const MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH = 2_048;
export const MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH = 5_000;
export const MATH_ANIMATION_PROGRESS_MILESTONES =
  MATH_ANIMATION_MODULE_SLUGS.length + 2;

export function mathAnimationModuleProgressKey(slug: MathAnimationModuleSlug): string {
  return `math-animation.module.${slug}.complete`;
}

export function mathAnimationModuleCheckpointKey(slug: MathAnimationModuleSlug): string {
  return `math-animation.module.${slug}.checkpoint.passed`;
}

export function mathAnimationModuleArtifactEvidenceKey(slug: MathAnimationModuleSlug): string {
  return `math-animation.module.${slug}.artifact-evidence`;
}

export function mathAnimationModuleVerificationEvidenceKey(slug: MathAnimationModuleSlug): string {
  return `math-animation.module.${slug}.verification-evidence`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedEvidenceDraft(value: unknown, maximum: number): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value.slice(0, maximum);
}

function validEvidence(
  value: unknown,
  minimum: number,
  maximum: number,
): value is string {
  return typeof value === "string"
    && value.length <= maximum
    && value.trim().length >= minimum;
}

function validCapstoneChecks(value: unknown): value is boolean[] {
  return Array.isArray(value)
    && value.length === MATH_ANIMATION_CAPSTONE_ARTIFACT_COUNT
    && value.every((item) => typeof item === "boolean");
}

export function reconcileMathAnimationModuleCompletion(
  record: Record<string, unknown>,
  slug: MathAnimationModuleSlug,
): boolean {
  const complete = record[mathAnimationModuleCheckpointKey(slug)] === true
    && validEvidence(
      record[mathAnimationModuleArtifactEvidenceKey(slug)],
      MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH,
      MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH,
    )
    && validEvidence(
      record[mathAnimationModuleVerificationEvidenceKey(slug)],
      MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH,
      MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH,
    );
  if (complete) record[mathAnimationModuleProgressKey(slug)] = true;
  else delete record[mathAnimationModuleProgressKey(slug)];
  return complete;
}

export function reconcileMathAnimationCapstone(
  record: Record<string, unknown>,
): boolean {
  const checks = record[MATH_ANIMATION_CAPSTONE_CHECKS_KEY];
  const prerequisitesComplete = MATH_ANIMATION_MODULE_SLUGS.every(
    (slug) => record[mathAnimationModuleProgressKey(slug)] === true,
  ) && record[MATH_ANIMATION_QUIZ_PASSED_KEY] === true;
  const complete = prerequisitesComplete
    && validCapstoneChecks(checks)
    && checks.every(Boolean)
    && validEvidence(
      record[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY],
      MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH,
      MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH,
    );
  if (complete) record[MATH_ANIMATION_CAPSTONE_KEY] = true;
  else delete record[MATH_ANIMATION_CAPSTONE_KEY];
  return complete;
}

export function normalizeMathAnimationProgress(
  value: unknown,
): Record<string, unknown> {
  const source = isRecord(value) ? value : {};
  const normalized: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(source)) {
    if (!key.startsWith(MATH_ANIMATION_PROGRESS_PREFIX)) normalized[key] = entry;
  }

  normalized[MATH_ANIMATION_PROGRESS_VERSION_KEY] = MATH_ANIMATION_PROGRESS_VERSION;
  if (source[MATH_ANIMATION_PROGRESS_VERSION_KEY] !== MATH_ANIMATION_PROGRESS_VERSION) {
    return normalized;
  }

  const resetGeneration = source[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY];
  if (
    typeof resetGeneration === "number"
    && Number.isSafeInteger(resetGeneration)
    && resetGeneration >= 0
  ) {
    normalized[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY] = resetGeneration;
  }

  for (const slug of MATH_ANIMATION_MODULE_SLUGS) {
    const artifactKey = mathAnimationModuleArtifactEvidenceKey(slug);
    const verificationKey = mathAnimationModuleVerificationEvidenceKey(slug);
    const artifactEvidence = boundedEvidenceDraft(
      source[artifactKey],
      MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH,
    );
    const verificationEvidence = boundedEvidenceDraft(
      source[verificationKey],
      MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH,
    );
    const checkpointPassed = source[mathAnimationModuleCheckpointKey(slug)] === true;
    if (artifactEvidence !== undefined) normalized[artifactKey] = artifactEvidence;
    if (verificationEvidence !== undefined) normalized[verificationKey] = verificationEvidence;
    if (checkpointPassed) normalized[mathAnimationModuleCheckpointKey(slug)] = true;
    if (
      source[mathAnimationModuleProgressKey(slug)] === true
      && checkpointPassed
      && validEvidence(
        artifactEvidence,
        MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH,
        MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH,
      )
      && validEvidence(
        verificationEvidence,
        MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH,
        MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH,
      )
    ) {
      normalized[mathAnimationModuleProgressKey(slug)] = true;
    }
  }

  const quizBest = source[MATH_ANIMATION_QUIZ_BEST_KEY];
  if (typeof quizBest === "number" && Number.isInteger(quizBest) && quizBest >= 0 && quizBest <= 100) {
    normalized[MATH_ANIMATION_QUIZ_BEST_KEY] = quizBest;
    if (quizBest >= MATH_ANIMATION_QUIZ_PASS_PERCENT) {
      normalized[MATH_ANIMATION_QUIZ_PASSED_KEY] = true;
    }
  }

  const checks = source[MATH_ANIMATION_CAPSTONE_CHECKS_KEY];
  const capstoneEvidence = boundedEvidenceDraft(
    source[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY],
    MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH,
  );
  if (validCapstoneChecks(checks)) {
    normalized[MATH_ANIMATION_CAPSTONE_CHECKS_KEY] = [...checks];
  }
  if (capstoneEvidence !== undefined) {
    normalized[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] = capstoneEvidence;
  }
  if (
    source[MATH_ANIMATION_CAPSTONE_KEY] === true
    && MATH_ANIMATION_MODULE_SLUGS.every(
      (slug) => normalized[mathAnimationModuleProgressKey(slug)] === true,
    )
    && normalized[MATH_ANIMATION_QUIZ_PASSED_KEY] === true
    && validCapstoneChecks(checks)
    && checks.every(Boolean)
    && validEvidence(
      capstoneEvidence,
      MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH,
      MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH,
    )
  ) {
    normalized[MATH_ANIMATION_CAPSTONE_KEY] = true;
  }

  return normalized;
}

export function mathAnimationProgressPercent(progress: Record<string, unknown>): number {
  if (progress[MATH_ANIMATION_PROGRESS_VERSION_KEY] !== MATH_ANIMATION_PROGRESS_VERSION) return 0;
  const modules = MATH_ANIMATION_MODULE_SLUGS.filter(
    (slug) => progress[mathAnimationModuleProgressKey(slug)] === true,
  ).length;
  const quiz = progress[MATH_ANIMATION_QUIZ_PASSED_KEY] === true ? 1 : 0;
  const capstone = progress[MATH_ANIMATION_CAPSTONE_KEY] === true ? 1 : 0;
  return Math.round(
    ((modules + quiz + capstone) / MATH_ANIMATION_PROGRESS_MILESTONES) * 100,
  );
}
