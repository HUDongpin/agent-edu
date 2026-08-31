import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS,
  getAgenticVideoEditingArtifactContract,
  getAgenticVideoEditingModuleArtifactContracts,
} from "./artifact-contracts";
import {
  course20ArtifactDependenciesAreCurrent,
  getCourse20PrimaryArtifactIdForModule,
  isCourse20ArtifactSubmission,
} from "./contracts";
import {
  COURSE20_ASSESSMENT_BLUEPRINT_FINGERPRINT,
  COURSE20_ASSESSMENT_CONTRACT_VERSION,
  COURSE20_CHECKPOINT_BLUEPRINTS,
  COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
  fingerprintCourse20AssessmentValue,
} from "./assessment-contract";
import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
} from "./types";
import type {
  AgenticVideoEditingCapstoneRubricDimensionId,
  AgenticVideoEditingArtifactId,
  AgenticVideoEditingModuleSlug,
  Course20ArtifactSubmission,
  Course20LearningPath,
} from "./types";

export const AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX =
  "agentic-video-editing.";
export const AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX =
  "agentic-video-editing:";
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION =
  `${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}:progress-v2`;
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY =
  "agentic-video-editing.progress.version";
export const AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY =
  "agentic-video-editing.legacy.drafts-v1";
export const AGENTIC_VIDEO_EDITING_PROGRESS_EVENT = "agentic-video-editing:progress-change";
export const AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT =
  "agentic-video-editing:progress-reset";
export const AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY =
  "agentic-video-editing.v2.assessment.best";
export const AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY =
  "agentic-video-editing.v2.assessment.passed";
export const AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY =
  "agentic-video-editing.v2.assessment.last-diagnostic";
export const AGENTIC_VIDEO_EDITING_CAPSTONE_KEY =
  "agentic-video-editing.v2.capstone.verified-cut";
/** Compatibility aliases; Course 20 v2 has one capstone, not parallel capstones. */
export const AGENTIC_VIDEO_EDITING_AUDIT_CAPSTONE_KEY =
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY;
export const AGENTIC_VIDEO_EDITING_PRODUCTION_CAPSTONE_KEY =
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY;
export const AGENTIC_VIDEO_EDITING_QUIZ_PASS_PERCENT = 80;
export const AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT = 12;
export const AGENTIC_VIDEO_EDITING_CORE_PROGRESS_MILESTONES = 12;
export const AGENTIC_VIDEO_EDITING_BUILDER_PROGRESS_MILESTONES = 10;
/** Compatibility name used by the existing dashboard adapter. */
export const AGENTIC_VIDEO_EDITING_PRACTICUM_PROGRESS_MILESTONES =
  AGENTIC_VIDEO_EDITING_BUILDER_PROGRESS_MILESTONES;
export const AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES =
  AGENTIC_VIDEO_EDITING_CORE_PROGRESS_MILESTONES;

export const COURSE20_CAPSTONE_RUBRIC_FINGERPRINT =
  fingerprintCourse20AssessmentValue({
    version: AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
    dimensions: AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map(
      (id) => ({ id, minimum: 0, maximum: 3, integer: true }),
    ),
    pass: {
      minimumTotal: 12,
      maximumTotal: 15,
      minimumAuthorityRightsPrivacy: 2,
      minimumEvidenceSemanticIntegrity: 2,
      unresolvedCriticalBlockerCount: 0,
    },
  });

export interface Course20CapstoneRubricRecord {
  readonly version: typeof AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION;
  readonly fingerprint: typeof COURSE20_CAPSTONE_RUBRIC_FINGERPRINT;
  readonly scores: Readonly<
    Record<AgenticVideoEditingCapstoneRubricDimensionId, number>
  >;
  readonly total: number;
  readonly unresolvedCriticalBlockers: readonly string[];
}

export interface Course20CapstoneRecord {
  readonly schemaVersion: "aicourse.course20.capstone.v2";
  readonly projectSpecId: typeof AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID;
  readonly projectId: string;
  readonly courseVersion: typeof AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version;
  readonly status: "valid" | "blocked" | "stale";
  readonly artifactHashes: Partial<
    Record<AgenticVideoEditingArtifactId, string>
  >;
  readonly packageSha256: string;
  readonly decision: "do-not-publish" | "approve-release";
  readonly boundPackageSha256: string;
  readonly packageBindingFingerprint: string;
  readonly reviewerRole: string;
  readonly releaseAttestation: true;
  readonly rubric: Course20CapstoneRubricRecord;
  readonly quizReceiptFingerprint: string;
  readonly moduleReceiptFingerprints: Readonly<
    Record<AgenticVideoEditingModuleSlug, string>
  >;
  readonly issues: readonly {
    readonly code: string;
    readonly message: string;
  }[];
}

interface Course20CapstonePackageBindingInput {
  readonly projectId: string;
  readonly decision: Course20CapstoneRecord["decision"];
  readonly reviewerRole: string;
  readonly artifactHashes: Partial<
    Record<AgenticVideoEditingArtifactId, string>
  >;
  readonly quizReceiptFingerprint: string;
  readonly moduleReceiptFingerprints: Partial<
    Record<AgenticVideoEditingModuleSlug, string>
  >;
  readonly rubric: Course20CapstoneRubricRecord;
}

export function createCourse20CapstonePackageBinding(
  input: Course20CapstonePackageBindingInput,
): Record<string, unknown> {
  return {
    schemaVersion: "aicourse.course20.capstone.v2",
    projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    projectId: input.projectId,
    courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
    learningPath: "core",
    formalAssessmentPassed: true,
    decision: input.decision,
    reviewerRole: input.reviewerRole,
    moduleReceiptFingerprints: Object.fromEntries(
      AGENTIC_VIDEO_EDITING_MODULE_SLUGS.map((slug) => [
        slug,
        input.moduleReceiptFingerprints[slug],
      ]),
    ),
    quizReceiptFingerprint: input.quizReceiptFingerprint,
    artifactHashes: Object.fromEntries(
      AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS.map((artifactId) => [
        artifactId,
        input.artifactHashes[artifactId],
      ]),
    ),
    rubric: {
      version: input.rubric.version,
      fingerprint: input.rubric.fingerprint,
      scores: Object.fromEntries(
        AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map((id) => [
          id,
          input.rubric.scores[id],
        ]),
      ),
      total: input.rubric.total,
      unresolvedCriticalBlockers: [
        ...input.rubric.unresolvedCriticalBlockers,
      ],
    },
  };
}

export function isCourse20CapstoneRubricPassing(
  value: unknown,
): value is Course20CapstoneRubricRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const rubric = value as Partial<Course20CapstoneRubricRecord>;
  if (rubric.version !== AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION
    || rubric.fingerprint !== COURSE20_CAPSTONE_RUBRIC_FINGERPRINT
    || !rubric.scores
    || typeof rubric.scores !== "object"
    || Array.isArray(rubric.scores)
    || !Array.isArray(rubric.unresolvedCriticalBlockers)
    || rubric.unresolvedCriticalBlockers.length !== 0) return false;
  const scoreKeys = Object.keys(rubric.scores);
  if (scoreKeys.length
      !== AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.length
    || !AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.every(
      (id) => scoreKeys.includes(id),
    )) return false;
  const scores = AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map(
    (id) => rubric.scores?.[id],
  );
  if (!scores.every(
    (score) => Number.isInteger(score) && Number(score) >= 0
      && Number(score) <= 3,
  )) return false;
  const total = scores.reduce<number>(
    (sum, score) => sum + Number(score),
    0,
  );
  return rubric.total === total
    && total >= 12
    && Number(rubric.scores["authority-rights-privacy"]) >= 2
    && Number(rubric.scores["evidence-semantic-integrity"]) >= 2;
}

export interface Course20CheckpointReceipt {
  readonly schemaVersion: "aicourse.course20.checkpoint-receipt.v1";
  readonly projectSpecId: typeof AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID;
  readonly courseVersion: typeof AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version;
  readonly assessmentContractVersion:
    typeof COURSE20_ASSESSMENT_CONTRACT_VERSION;
  readonly assessmentBlueprintFingerprint: string;
  readonly questionId: `checkpoint:${AgenticVideoEditingModuleSlug}`;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly selectedOptionId: string;
  readonly correctOptionId: string;
  readonly status: "pass";
}

export interface Course20ModuleReceipt {
  readonly schemaVersion: "aicourse.course20.module-receipt.v1";
  readonly projectSpecId: typeof AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID;
  readonly courseVersion: typeof AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly path: Course20LearningPath;
  readonly status: "valid";
  readonly checkpointReceiptFingerprint: string;
  readonly artifactSemanticHashes: Partial<
    Record<AgenticVideoEditingArtifactId, string>
  >;
  readonly prerequisiteReceiptFingerprints: Partial<
    Record<AgenticVideoEditingModuleSlug, string>
  >;
}

export interface Course20QuizReceipt {
  readonly schemaVersion: "aicourse.course20.quiz-receipt.v1";
  readonly projectSpecId: typeof AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID;
  readonly courseVersion: typeof AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version;
  readonly assessmentContractVersion:
    typeof COURSE20_ASSESSMENT_CONTRACT_VERSION;
  readonly assessmentBlueprintFingerprint: string;
  readonly status: "pass";
  readonly score: number;
  readonly correctCount: number;
  readonly criticalMiss: false;
  readonly answers: Readonly<Record<string, string>>;
  readonly moduleReceiptFingerprints: Readonly<
    Record<AgenticVideoEditingModuleSlug, string>
  >;
}

export function agenticVideoEditingModuleProgressKey(
  slug: AgenticVideoEditingModuleSlug,
  path: Course20LearningPath = "core",
): string {
  return `agentic-video-editing.v2.${path}.module.${slug}.complete`;
}

export function agenticVideoEditingCheckpointKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.v2.module.${slug}.checkpoint.passed`;
}

export function agenticVideoEditingArtifactKey(
  artifactIdOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug,
  path: Course20LearningPath = "core",
): string {
  const artifactId = getArtifactId(artifactIdOrSlug);
  return `agentic-video-editing.v2.${path}.artifact.${artifactId}`;
}

/**
 * Exact inventory of keys owned by the current Course 20 browser contract.
 * Prefix matching alone is intentionally insufficient: backups and imports
 * must not preserve arbitrary data merely because its key looks course-like.
 */
export function isAgenticVideoEditingOwnedProgressKey(key: string): boolean {
  if (key === AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY
    || key === AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY
    || key === AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY
    || key === AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY
    || key === AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY
    || key === AGENTIC_VIDEO_EDITING_CAPSTONE_KEY) return true;
  if (AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.some(
    (moduleRecord) => key === agenticVideoEditingCheckpointKey(moduleRecord.slug),
  )) return true;
  return (["core", "builder-extension"] as const).some((path) => (
    AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.some(
      (moduleRecord) => key === agenticVideoEditingModuleProgressKey(
        moduleRecord.slug,
        path,
      ),
    )
    || AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.some(
      (contract) => key === agenticVideoEditingArtifactKey(contract.id, path),
    )
  ));
}

export function course20ReceiptFingerprint(value: unknown): string {
  return fingerprintCourse20AssessmentValue(value);
}

export function createCourse20CheckpointReceipt(
  slug: AgenticVideoEditingModuleSlug,
  selectedOptionId: string,
): Course20CheckpointReceipt | undefined {
  const blueprint = COURSE20_CHECKPOINT_BLUEPRINTS[slug];
  if (selectedOptionId !== blueprint.correctOptionId) return undefined;
  return {
    schemaVersion: "aicourse.course20.checkpoint-receipt.v1",
    projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
    assessmentContractVersion: COURSE20_ASSESSMENT_CONTRACT_VERSION,
    assessmentBlueprintFingerprint:
      COURSE20_ASSESSMENT_BLUEPRINT_FINGERPRINT,
    questionId: blueprint.questionId,
    moduleSlug: slug,
    selectedOptionId,
    correctOptionId: blueprint.correctOptionId,
    status: "pass",
  };
}

export function isCourse20CheckpointReceipt(
  value: unknown,
  slug: AgenticVideoEditingModuleSlug,
): value is Course20CheckpointReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const receipt = value as Partial<Course20CheckpointReceipt>;
  const blueprint = COURSE20_CHECKPOINT_BLUEPRINTS[slug];
  return receipt.schemaVersion === "aicourse.course20.checkpoint-receipt.v1"
    && receipt.projectSpecId === AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID
    && receipt.courseVersion === AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version
    && receipt.assessmentContractVersion
      === COURSE20_ASSESSMENT_CONTRACT_VERSION
    && receipt.assessmentBlueprintFingerprint
      === COURSE20_ASSESSMENT_BLUEPRINT_FINGERPRINT
    && receipt.questionId === blueprint.questionId
    && receipt.moduleSlug === slug
    && receipt.selectedOptionId === blueprint.correctOptionId
    && receipt.correctOptionId === blueprint.correctOptionId
    && receipt.status === "pass";
}

export function createCourse20ModuleReceipt(
  progress: Record<string, unknown>,
  slug: AgenticVideoEditingModuleSlug,
  path: Course20LearningPath = "core",
): Course20ModuleReceipt | undefined {
  const moduleRecord = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleRecord) return undefined;
  const checkpoint = progress[agenticVideoEditingCheckpointKey(slug)];
  if (!isCourse20CheckpointReceipt(checkpoint, slug)) return undefined;
  if (!moduleRecord.requires.every(
    (requiredSlug) => isCourse20ModuleCurrent(
      progress,
      requiredSlug,
      path,
    ),
  )) return undefined;
  if (!areCourse20ArtifactSubmissionsCurrent(
    progress,
    moduleRecord.artifactIds,
    path,
  )) return undefined;
  const submissions = getCourse20ArtifactSubmissions(progress, path);
  const prerequisiteReceiptFingerprints = Object.fromEntries(
    moduleRecord.requires.map((requiredSlug) => {
      const requiredReceipt = progress[
        agenticVideoEditingModuleProgressKey(requiredSlug, path)
      ];
      return [requiredSlug, course20ReceiptFingerprint(requiredReceipt)];
    }),
  );
  return {
    schemaVersion: "aicourse.course20.module-receipt.v1",
    projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
    moduleSlug: slug,
    path,
    status: "valid",
    checkpointReceiptFingerprint: course20ReceiptFingerprint(checkpoint),
    artifactSemanticHashes: Object.fromEntries(
      moduleRecord.artifactIds.map((artifactId) => [
        artifactId,
        submissions[artifactId]?.semanticSha256,
      ]),
    ),
    prerequisiteReceiptFingerprints,
  };
}

export function createCourse20QuizReceipt(
  progress: Record<string, unknown>,
  answers: Readonly<Record<string, string>>,
): Course20QuizReceipt | undefined {
  if (!areAllCourse20CoreModulesCurrent(progress)) return undefined;
  const blueprints = Object.values(COURSE20_FINAL_ASSESSMENT_BLUEPRINTS);
  if (Object.keys(answers).length !== blueprints.length) return undefined;
  if (blueprints.some((blueprint) => (
    !(blueprint.optionIds as readonly string[]).includes(
      answers[blueprint.questionId],
    )
  ))) return undefined;
  const correctCount = blueprints.filter(
    (blueprint) => answers[blueprint.questionId] === blueprint.correctOptionId,
  ).length;
  const score = Math.round((correctCount / blueprints.length) * 100);
  const criticalMiss = blueprints.some(
    (blueprint) => blueprint.critical
      && answers[blueprint.questionId] !== blueprint.correctOptionId,
  );
  if (score < 80 || criticalMiss) return undefined;
  const moduleReceiptFingerprints = Object.fromEntries(
    AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.map((moduleRecord) => [
      moduleRecord.slug,
      course20ReceiptFingerprint(progress[
        agenticVideoEditingModuleProgressKey(moduleRecord.slug, "core")
      ]),
    ]),
  ) as Record<AgenticVideoEditingModuleSlug, string>;
  return {
    schemaVersion: "aicourse.course20.quiz-receipt.v1",
    projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
    assessmentContractVersion: COURSE20_ASSESSMENT_CONTRACT_VERSION,
    assessmentBlueprintFingerprint:
      COURSE20_ASSESSMENT_BLUEPRINT_FINGERPRINT,
    status: "pass",
    score,
    correctCount,
    criticalMiss: false,
    answers: Object.fromEntries(
      blueprints.map((blueprint) => [
        blueprint.questionId,
        answers[blueprint.questionId],
      ]),
    ),
    moduleReceiptFingerprints,
  };
}

function getArtifactId(
  artifactIdOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug,
): AgenticVideoEditingArtifactId {
  return AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.some(
    (contract) => contract.id === artifactIdOrSlug,
  )
    ? artifactIdOrSlug as AgenticVideoEditingArtifactId
    : getCourse20PrimaryArtifactIdForModule(
      artifactIdOrSlug as AgenticVideoEditingModuleSlug,
    );
}

export function isCurrentAgenticVideoEditingProgress(
  progress: Record<string, unknown>,
): boolean {
  return progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]
    === AGENTIC_VIDEO_EDITING_PROGRESS_VERSION;
}

function collectLegacyDrafts(
  progress: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(progress).flatMap(([key, value]) => {
      if (!key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)) return [];
      if (typeof value === "string"
        && (key.includes(".artifact") || key.includes(".draft"))) {
        return [[key, value]];
      }
      if (isCourse20ArtifactSubmission(value) && value.contentText.trim()) {
        return [[key, value.contentText]];
      }
      return [];
    }),
  );
}

/**
 * Beta migration keeps only learner-authored draft text as inert evidence.
 * Old completion, checkpoints, assessment, capstone, and course completion
 * never cross the v1.2.0 boundary. Unrelated course keys are copied verbatim.
 */
export function normalizeAgenticVideoEditingProgress(
  progress: Record<string, unknown>,
): Record<string, unknown> {
  if (isCurrentAgenticVideoEditingProgress(progress)) {
    return Object.fromEntries(Object.entries(progress).filter(([key]) => (
      !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)
      || isAgenticVideoEditingOwnedProgressKey(key)
    )));
  }
  const unrelatedEntries = Object.fromEntries(
    Object.entries(progress).filter(
      ([key]) => !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX),
    ),
  );
  const drafts = collectLegacyDrafts(progress);
  return {
    ...unrelatedEntries,
    ...(Object.keys(drafts).length > 0
      ? {
        [AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY]: {
          migratedOn: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.revisedOn,
          sourceVersion:
            progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]
            ?? "unversioned",
          drafts,
        },
      }
      : {}),
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
}

export function getCourse20ArtifactSubmission(
  progress: Record<string, unknown>,
  artifactIdOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug,
  path: Course20LearningPath = "core",
): Course20ArtifactSubmission | undefined {
  const artifactId = getArtifactId(artifactIdOrSlug);
  const candidate = progress[agenticVideoEditingArtifactKey(artifactId, path)];
  return isCourse20ArtifactSubmission(candidate) ? candidate : undefined;
}

export function getCourse20ArtifactSubmissions(
  progress: Record<string, unknown>,
  path: Course20LearningPath = "core",
): Partial<Record<AgenticVideoEditingArtifactId, Course20ArtifactSubmission>> {
  return Object.fromEntries(
    AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.flatMap((contract) => {
      const submission = getCourse20ArtifactSubmission(
        progress,
        contract.id,
        path,
      );
      return submission ? [[contract.id, submission]] : [];
    }),
  );
}

export function getCourse20ModuleArtifactSubmissions(
  progress: Record<string, unknown>,
  slug: AgenticVideoEditingModuleSlug,
  path: Course20LearningPath = "core",
): Partial<Record<AgenticVideoEditingArtifactId, Course20ArtifactSubmission>> {
  return Object.fromEntries(
    getAgenticVideoEditingModuleArtifactContracts(slug).flatMap((contract) => {
      const submission = getCourse20ArtifactSubmission(
        progress,
        contract.id,
        path,
      );
      return submission ? [[contract.id, submission]] : [];
    }),
  );
}

export function course20DescendantArtifactIds(
  changedArtifactId: AgenticVideoEditingArtifactId,
): AgenticVideoEditingArtifactId[] {
  const descendants = new Set<AgenticVideoEditingArtifactId>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
      if (contract.id === changedArtifactId || descendants.has(contract.id)) continue;
      if (contract.dependsOn.some(
        (dependency) => dependency === changedArtifactId
          || descendants.has(dependency),
      )) {
        descendants.add(contract.id);
        changed = true;
      }
    }
  }
  return [...descendants].sort((left, right) => (
    AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.findIndex(
      (contract) => contract.id === left,
    )
    - AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.findIndex(
      (contract) => contract.id === right,
    )
  ));
}

/** Compatibility helper for reports that summarize descendants by module. */
export function course20DescendantSlugs(
  changedSlug: AgenticVideoEditingModuleSlug,
): AgenticVideoEditingModuleSlug[] {
  const changedIds = getAgenticVideoEditingModuleArtifactContracts(
    changedSlug,
  ).map((contract) => contract.id);
  const descendantIds = new Set(
    changedIds.flatMap(course20DescendantArtifactIds),
  );
  return AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules
    .filter((moduleRecord) => moduleRecord.artifactIds.some(
      (artifactId) => descendantIds.has(artifactId),
    ))
    .map((moduleRecord) => moduleRecord.slug);
}

function staleRerunMessage(artifactId: AgenticVideoEditingArtifactId): string {
  const slug = getAgenticVideoEditingArtifactContract(artifactId).moduleSlug;
  if (slug === "declarative-edit-plan") {
    return "Revalidate Edit Plan v3 and bind a new independent plan approval.";
  }
  if (slug === "deterministic-rendering") {
    return "Re-run dry-run/render and bind engine, argv, build, input, output, and probe receipts.";
  }
  if (slug === "verification-human-review") {
    return "Re-run affected QC, repair, and regression checks against the current candidate hash.";
  }
  if (slug === "production-capstone") {
    return "Rebuild package closure, recovery receipt, and the hash-bound release decision.";
  }
  return "Re-run this validator against the current upstream semantic hashes.";
}

function staleCapstoneRecord(
  value: unknown,
  changedArtifactId: AgenticVideoEditingArtifactId,
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Partial<Course20CapstoneRecord>;
  if (record.status !== "valid") return value;
  return {
    ...record,
    status: "stale",
    issues: [
      ...(record.issues ?? []),
      {
        code: "dependency.upstream-changed",
        message: `${changedArtifactId} changed semantically; rebuild the affected package closure and decision.`,
      },
    ],
  };
}

/**
 * Descendants invalidate only when the production-relevant semantic hash
 * changes. Editing an explicitly non-production note preserves render/QC
 * receipts while still recording a new content hash and revision.
 */
export function markCourse20ArtifactDescendantsStale(
  progress: Record<string, unknown>,
  path: Course20LearningPath,
  changedArtifactIdOrSlug:
    | AgenticVideoEditingArtifactId
    | AgenticVideoEditingModuleSlug,
  previousSemanticHash: string,
  nextSemanticHash: string,
): void {
  const changedArtifactId = getArtifactId(changedArtifactIdOrSlug);
  const changedContract = getAgenticVideoEditingArtifactContract(
    changedArtifactId,
  );
  const changedModule = changedContract.moduleSlug;
  if (changedContract.requiredForModuleCompletion) {
    delete progress[agenticVideoEditingModuleProgressKey(changedModule, path)];
  }
  if (!previousSemanticHash || previousSemanticHash === nextSemanticHash) return;
  for (const descendantId of course20DescendantArtifactIds(changedArtifactId)) {
    const key = agenticVideoEditingArtifactKey(descendantId, path);
    const submission = progress[key];
    if (isCourse20ArtifactSubmission(submission)) {
      progress[key] = {
        ...submission,
        validationReceipt: {
          status: "stale",
          issues: [
            ...submission.validationReceipt.issues.filter(
              (candidate) => candidate.code
                !== "dependency.upstream-changed",
            ),
            {
              code: "dependency.upstream-changed",
              path: `dependencyArtifactHashes.${changedArtifactId}`,
              message: `${changedArtifactId} changed from ${previousSemanticHash} to ${nextSemanticHash}. ${staleRerunMessage(descendantId)}`,
            },
          ],
        },
        receipt: {
          ...submission.receipt,
          status: "blocked",
          issues: [
            ...submission.receipt.issues.filter(
              (message) => !message.includes("dependency.upstream-changed"),
            ),
            `dependency.upstream-changed: ${changedArtifactId} changed semantically.`,
          ],
        },
      } satisfies Course20ArtifactSubmission;
    }
    const descendantSlug = getAgenticVideoEditingArtifactContract(
      descendantId,
    ).moduleSlug;
    delete progress[agenticVideoEditingModuleProgressKey(descendantSlug, path)];
  }
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] = staleCapstoneRecord(
    progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY],
    changedArtifactId,
  );
}

export function areCourse20ArtifactSubmissionsCurrent(
  progress: Record<string, unknown>,
  artifactIds: readonly AgenticVideoEditingArtifactId[],
  path: Course20LearningPath = "core",
): boolean {
  const submissions = getCourse20ArtifactSubmissions(progress, path);
  return artifactIds.every((artifactId) => {
    const submission = submissions[artifactId];
    return submission?.validationReceipt.status === "valid"
      && submission.receipt.status === "valid"
      && course20ArtifactDependenciesAreCurrent(submission, submissions);
  });
}

export function isCourse20ModuleCurrent(
  progress: Record<string, unknown>,
  slug: AgenticVideoEditingModuleSlug,
  path: Course20LearningPath = "core",
): boolean {
  const moduleRecord = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleRecord) return false;
  const receipt = progress[
    agenticVideoEditingModuleProgressKey(slug, path)
  ];
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return false;
  }
  const moduleReceipt = receipt as Partial<Course20ModuleReceipt>;
  const checkpointReceipt = progress[agenticVideoEditingCheckpointKey(slug)];
  if (moduleReceipt.schemaVersion !== "aicourse.course20.module-receipt.v1"
    || moduleReceipt.projectSpecId !== AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID
    || moduleReceipt.courseVersion
      !== AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version
    || moduleReceipt.moduleSlug !== slug
    || moduleReceipt.path !== path
    || moduleReceipt.status !== "valid"
    || !isCourse20CheckpointReceipt(checkpointReceipt, slug)
    || moduleReceipt.checkpointReceiptFingerprint
      !== course20ReceiptFingerprint(checkpointReceipt)) return false;
  if (!moduleRecord.requires.every(
    (requiredSlug) => isCourse20ModuleCurrent(progress, requiredSlug, path),
  )) return false;
  for (const requiredSlug of moduleRecord.requires) {
    const requiredReceipt = progress[
      agenticVideoEditingModuleProgressKey(requiredSlug, path)
    ];
    if (moduleReceipt.prerequisiteReceiptFingerprints?.[requiredSlug]
      !== course20ReceiptFingerprint(requiredReceipt)) return false;
  }
  const submissions = getCourse20ArtifactSubmissions(progress, path);
  if (moduleRecord.artifactIds.some(
    (artifactId) => moduleReceipt.artifactSemanticHashes?.[artifactId]
      !== submissions[artifactId]?.semanticSha256,
  )) return false;
  return areCourse20ArtifactSubmissionsCurrent(
    progress,
    moduleRecord.artifactIds,
    path,
  );
}

export function areAllCourse20CoreModulesCurrent(
  progress: Record<string, unknown>,
): boolean {
  return AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.every(
    (moduleRecord) => isCourse20ModuleCurrent(
      progress,
      moduleRecord.slug,
      "core",
    ),
  );
}

export function isCourse20AssessmentMilestoneCurrent(
  progress: Record<string, unknown>,
): boolean {
  if (!areAllCourse20CoreModulesCurrent(progress)) return false;
  const value = progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY];
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const receipt = value as Partial<Course20QuizReceipt>;
  if (receipt.schemaVersion !== "aicourse.course20.quiz-receipt.v1"
    || receipt.projectSpecId !== AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID
    || receipt.courseVersion !== AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version
    || receipt.assessmentContractVersion
      !== COURSE20_ASSESSMENT_CONTRACT_VERSION
    || receipt.assessmentBlueprintFingerprint
      !== COURSE20_ASSESSMENT_BLUEPRINT_FINGERPRINT
    || receipt.status !== "pass"
    || receipt.criticalMiss !== false) return false;
  const blueprints = Object.values(COURSE20_FINAL_ASSESSMENT_BLUEPRINTS);
  if (Object.keys(receipt.answers ?? {}).length !== blueprints.length) {
    return false;
  }
  const correctCount = blueprints.filter(
    (blueprint) => receipt.answers?.[blueprint.questionId]
      === blueprint.correctOptionId,
  ).length;
  const criticalMiss = blueprints.some(
    (blueprint) => blueprint.critical
      && receipt.answers?.[blueprint.questionId]
        !== blueprint.correctOptionId,
  );
  if (receipt.correctCount !== correctCount
    || receipt.score !== Math.round((correctCount / blueprints.length) * 100)
    || receipt.score < 80
    || criticalMiss) return false;
  return AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.every(
    (moduleRecord) => {
      const moduleReceipt = progress[
        agenticVideoEditingModuleProgressKey(moduleRecord.slug, "core")
      ];
      return receipt.moduleReceiptFingerprints?.[moduleRecord.slug]
        === course20ReceiptFingerprint(moduleReceipt);
    },
  );
}

export function isCourse20CapstoneCurrent(
  progress: Record<string, unknown>,
): boolean {
  const value = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY];
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<Course20CapstoneRecord>;
  if (record.schemaVersion !== "aicourse.course20.capstone.v2"
    || record.projectSpecId !== AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID
    || record.projectId !== AGENTIC_VIDEO_EDITING_PROJECT_ID
    || record.courseVersion !== AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version
    || record.status !== "valid"
    || record.decision !== "do-not-publish"
    || record.releaseAttestation !== true
    || !record.reviewerRole?.trim()
    || !/^[0-9a-f]{64}$/u.test(record.packageSha256 ?? "")
    || !/^[0-9a-f]{64}$/u.test(record.boundPackageSha256 ?? "")
    || record.packageSha256 !== record.boundPackageSha256
    || !Array.isArray(record.issues)
    || record.issues.length !== 0
    || !isCourse20CapstoneRubricPassing(record.rubric)) return false;
  if (!isCourse20AssessmentMilestoneCurrent(progress)) return false;
  const quizReceipt = progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY];
  const moduleFingerprintKeys = Object.keys(
    record.moduleReceiptFingerprints ?? {},
  );
  if (moduleFingerprintKeys.length !== AGENTIC_VIDEO_EDITING_MODULE_SLUGS.length
    || !AGENTIC_VIDEO_EDITING_MODULE_SLUGS.every(
      (slug) => moduleFingerprintKeys.includes(slug),
    )
    || record.quizReceiptFingerprint
      !== course20ReceiptFingerprint(quizReceipt)
    || !AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.every(
      (moduleRecord) => record.moduleReceiptFingerprints?.[moduleRecord.slug]
        === course20ReceiptFingerprint(progress[
          agenticVideoEditingModuleProgressKey(moduleRecord.slug, "core")
        ]),
    )) return false;
  const submissions = getCourse20ArtifactSubmissions(progress, "core");
  const artifactHashKeys = Object.keys(record.artifactHashes ?? {});
  if (artifactHashKeys.length !== AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS.length
    || !AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS.every(
      (artifactId) => artifactHashKeys.includes(artifactId),
    )
    || !areCourse20ArtifactSubmissionsCurrent(
      progress,
      AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
      "core",
    )) return false;
  for (const artifactId of AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS) {
    const submission = submissions[artifactId];
    if (!submission
      || submission.projectId !== AGENTIC_VIDEO_EDITING_PROJECT_ID
      || !/^[0-9a-f]{64}$/u.test(record.artifactHashes?.[artifactId] ?? "")
      || record.artifactHashes?.[artifactId] !== submission.contentSha256) {
      return false;
    }
  }
  const decisionSubmission = submissions["release-decision-postmortem"];
  try {
    const decisionArtifact = JSON.parse(
      decisionSubmission?.contentText ?? "",
    ) as Record<string, unknown>;
    if (decisionArtifact.projectId !== record.projectId
      || decisionArtifact.decision !== record.decision
      || !Array.isArray(decisionArtifact.unresolvedCriticalBlockers)
      || decisionArtifact.unresolvedCriticalBlockers.length !== 0) {
      return false;
    }
  } catch {
    return false;
  }
  const packageBinding = createCourse20CapstonePackageBinding({
    projectId: record.projectId,
    decision: record.decision,
    reviewerRole: record.reviewerRole,
    artifactHashes: record.artifactHashes ?? {},
    quizReceiptFingerprint: record.quizReceiptFingerprint ?? "",
    moduleReceiptFingerprints: record.moduleReceiptFingerprints ?? {},
    rubric: record.rubric,
  });
  return record.packageBindingFingerprint
    === course20ReceiptFingerprint({
      packageBinding,
      packageSha256: record.packageSha256,
    });
}

export function agenticVideoEditingCoreProgressPercent(
  progress: Record<string, unknown>,
): number {
  if (!isCurrentAgenticVideoEditingProgress(progress)) return 0;
  const modules = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.filter(
    (moduleRecord) => isCourse20ModuleCurrent(
      progress,
      moduleRecord.slug,
      "core",
    ),
  ).length;
  const assessment = isCourse20AssessmentMilestoneCurrent(progress) ? 1 : 0;
  const capstone = isCourse20CapstoneCurrent(progress) ? 1 : 0;
  return Math.round(
    ((modules + assessment + capstone)
      / AGENTIC_VIDEO_EDITING_CORE_PROGRESS_MILESTONES) * 100,
  );
}

export function agenticVideoEditingPracticumProgressPercent(
  progress: Record<string, unknown>,
): number {
  if (!isCurrentAgenticVideoEditingProgress(progress)) return 0;
  const complete = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.filter(
    (moduleRecord) => isCourse20ModuleCurrent(
      progress,
      moduleRecord.slug,
      "builder-extension",
    ),
  ).length;
  return Math.round(
    (complete / AGENTIC_VIDEO_EDITING_BUILDER_PROGRESS_MILESTONES) * 100,
  );
}

export function agenticVideoEditingProgressPercent(
  progress: Record<string, unknown>,
): number {
  return agenticVideoEditingCoreProgressPercent(progress);
}
