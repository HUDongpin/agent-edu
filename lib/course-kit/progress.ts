import type {
  CourseKitDefinition,
  CourseKitMilestoneCount,
  CourseKitProgressClientConfig,
} from "./types";
import {
  parseCourseKitEvidenceReceipt,
  parseCourseKitModuleEvidenceReceipt,
} from "./evidence-receipt";

export const COURSE_KIT_PROGRESS_STORAGE_KEY = "ae.progress" as const;
export const COURSE_KIT_PROGRESS_EVENT = "ae:course-kit:progress" as const;
export const COURSE_KIT_PROGRESS_RESET_EVENT =
  "ae:course-kit:progress-reset" as const;

export type CourseKitProgressRecord = Readonly<Record<string, unknown>>;

export type CourseKitMilestone =
  | { readonly kind: "module"; readonly id: string }
  | { readonly kind: "quiz"; readonly id: "quiz" }
  | { readonly kind: "capstone"; readonly id: "capstone" };

export interface CourseKitProgressSummary {
  readonly completed: number;
  readonly total: CourseKitMilestoneCount;
  readonly percent: number;
  readonly next: CourseKitMilestone | null;
  readonly evidenceBasis:
    | "validated-artifact"
    | "self-attested"
    | "mixed"
    | "legacy-local-record";
  readonly milestones: readonly (CourseKitMilestone & {
    readonly complete: boolean;
  })[];
}

function safeId(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

export function courseKitProgressPrefix(courseId: string): string {
  return `${safeId(courseId)}.`;
}

export function courseKitProgressVersionKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}progress.version`;
}

export function courseKitModuleCompleteKey(
  courseId: string,
  moduleSlug: string,
): string {
  return `${courseKitProgressPrefix(courseId)}module.${safeId(moduleSlug)}.complete`;
}

export function courseKitCheckpointKey(
  courseId: string,
  moduleSlug: string,
): string {
  return `${courseKitProgressPrefix(courseId)}module.${safeId(moduleSlug)}.checkpoint`;
}

export function courseKitModuleReceiptKey(
  courseId: string,
  moduleSlug: string,
): string {
  return `${courseKitProgressPrefix(courseId)}module.${safeId(moduleSlug)}.receipt`;
}

export function courseKitQuizVersionKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.version`;
}

export function courseKitQuizBestKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.best`;
}

export function courseKitQuizCurrentScoreKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.current.score`;
}

export function courseKitQuizBestPassedKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.best.passed`;
}

export function courseKitQuizPassedKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.passed`;
}

export function courseKitQuizDraftKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.draft`;
}

export function courseKitQuizFormKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.form`;
}

export function courseKitCapstoneVersionKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}capstone.version`;
}

export function courseKitCapstoneArtifactKey(
  courseId: string,
  artifactId: string,
): string {
  return `${courseKitProgressPrefix(courseId)}capstone.${safeId(artifactId)}.complete`;
}

export function courseKitCapstoneDraftKey(
  courseId: string,
  artifactId: string,
): string {
  return `${courseKitProgressPrefix(courseId)}capstone.${safeId(artifactId)}.draft`;
}

export function courseKitCapstoneCompleteKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}capstone.complete`;
}

export function courseKitProgressEvent(courseId: string): string {
  void courseId;
  return COURSE_KIT_PROGRESS_EVENT;
}

export function courseKitProgressResetEvent(courseId: string): string {
  void courseId;
  return COURSE_KIT_PROGRESS_RESET_EVENT;
}

export function createCourseKitProgressConfig(
  definition: CourseKitDefinition,
): CourseKitProgressClientConfig {
  const { manifest, quiz, capstone } = definition;
  const moduleContracts = manifest.modules.map((module, index, modules) => {
    const explicitlyDeclared = Boolean(
      module.prerequisiteModuleSlugs
      && module.producesArtifactIds?.length
      && module.consumesArtifactIds
      && module.artifactSchemaId
      && module.validatorId
      && module.validatorCommand
      && module.completionMode,
    );
    return {
      moduleSlug: module.slug,
      prerequisiteModuleSlugs: module.prerequisiteModuleSlugs
        ? [...module.prerequisiteModuleSlugs]
        : index > 0
          ? [modules[index - 1].slug]
          : [],
      producesArtifactIds: module.producesArtifactIds
        ? [...module.producesArtifactIds]
        : [module.slug],
      consumesArtifactIds: module.consumesArtifactIds
        ? [...module.consumesArtifactIds]
        : [],
      artifactSchemaId:
        module.artifactSchemaId ?? capstone.evidenceContract.schemaId,
      validatorId: module.validatorId ?? capstone.evidenceContract.validatorId,
      validatorCommand:
        module.validatorCommand ?? capstone.evidenceContract.validatorCommand,
      // Course Kit v1 had no module-specific validator contract. Preserve its
      // existing browser progress only as an explicitly labelled local
      // self-attestation; v2 courses must declare validated-artifact metadata.
      completionMode: module.completionMode ?? "self-attested",
      explicitlyDeclared,
    } as const;
  });
  return {
    storageKey: COURSE_KIT_PROGRESS_STORAGE_KEY,
    courseId: manifest.id,
    courseVersion: manifest.version,
    progressPrefix: courseKitProgressPrefix(manifest.id),
    progressVersionKey: courseKitProgressVersionKey(manifest.id),
    progressEvent: courseKitProgressEvent(manifest.id),
    resetEvent: courseKitProgressResetEvent(manifest.id),
    milestoneCount: manifest.milestoneCount,
    moduleSlugs: manifest.modules.map((module) => module.slug),
    moduleContracts,
    quizVersion: quiz.version,
    capstoneVersion: capstone.version,
    capstoneArtifactIds: capstone.artifacts.map((artifact) => artifact.id),
    evidenceValidatorId: capstone.evidenceContract.validatorId,
    evidenceValidatorCommandPrefix:
      capstone.evidenceContract.validatorCommand.split("<")[0],
  };
}

export function isCurrentCourseKitProgress(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
): boolean {
  return record[config.progressVersionKey] === config.courseVersion;
}

export function isCourseKitCheckpointComplete(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
): boolean {
  const checkpoint = record[courseKitCheckpointKey(config.courseId, moduleSlug)];
  return Boolean(
    isCurrentCourseKitProgress(record, config)
    && checkpoint
    && typeof checkpoint === "object"
    && !Array.isArray(checkpoint)
    && (checkpoint as { readonly correct?: unknown }).correct === true,
  );
}

function moduleContract(
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
) {
  return config.moduleContracts.find((contract) => contract.moduleSlug === moduleSlug);
}

function receiptText(record: CourseKitProgressRecord, key: string): string {
  const receipt = record[key];
  return typeof receipt === "string" ? receipt : "";
}

interface CourseKitModuleEvidenceState {
  readonly artifactId: string;
  readonly artifactSha256: string;
}

export function courseKitArtifactCompletionMarker(
  artifactId: string,
  sha256: string,
): string {
  return `${artifactId}:${sha256}`;
}

function evaluateCourseKitModuleEvidence(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
  visiting: Set<string>,
  requireCompletionMarker: boolean,
): CourseKitModuleEvidenceState | null {
  const contract = moduleContract(config, moduleSlug);
  if (!contract || visiting.has(moduleSlug)) return null;
  if (!isCourseKitCheckpointComplete(record, config, moduleSlug)) return null;

  visiting.add(moduleSlug);
  try {
    for (const prerequisite of contract.prerequisiteModuleSlugs) {
      if (!evaluateCourseKitModuleEvidence(
        record,
        config,
        prerequisite,
        visiting,
        true,
      )) return null;
    }

    if (contract.completionMode === "self-attested") {
      const marker = record[courseKitModuleCompleteKey(config.courseId, moduleSlug)];
      return !requireCompletionMarker
        || marker === "self-attested"
        || (!contract.explicitlyDeclared && marker === true)
        ? { artifactId: moduleSlug, artifactSha256: "self-attested" }
        : null;
    }

    const rawReceipt = receiptText(
      record,
      courseKitModuleReceiptKey(config.courseId, moduleSlug),
    );
    let evidence: CourseKitModuleEvidenceState | null = null;
    if (contract.explicitlyDeclared) {
      const inputArtifactHashes: Record<string, string> = {};
      for (const artifactId of contract.consumesArtifactIds) {
        const producer = config.moduleContracts.find((candidate) =>
          candidate.producesArtifactIds.includes(artifactId)
        );
        if (!producer) return null;
        const producerEvidence = evaluateCourseKitModuleEvidence(
          record,
          config,
          producer.moduleSlug,
          visiting,
          true,
        );
        if (!producerEvidence || producerEvidence.artifactId !== artifactId) {
          return null;
        }
        inputArtifactHashes[artifactId] = producerEvidence.artifactSha256;
      }
      const parsed = parseCourseKitModuleEvidenceReceipt(rawReceipt, {
        courseId: config.courseId,
        courseVersion: config.courseVersion,
        moduleSlug,
        artifactIds: contract.producesArtifactIds,
        inputArtifactIds: contract.consumesArtifactIds,
        inputArtifactHashes,
        artifactSchemaId: contract.artifactSchemaId,
        validatorId: contract.validatorId,
        validatorCommand: contract.validatorCommand,
      });
      if (parsed) {
        evidence = {
          artifactId: parsed.artifactId,
          artifactSha256: parsed.artifactSha256,
        };
      }
    } else {
      const parsed = parseCourseKitEvidenceReceipt(rawReceipt, {
        kind: "module-artifact",
        courseId: config.courseId,
        courseVersion: config.courseVersion,
        artifactId: moduleSlug,
        validatorId: contract.validatorId,
        validatorCommandPrefix: contract.validatorCommand.split("<")[0].trimEnd(),
      });
      if (parsed) evidence = { artifactId: parsed.artifactId, artifactSha256: parsed.sha256 };
    }
    if (!evidence) return null;
    if (requireCompletionMarker
      && record[courseKitModuleCompleteKey(config.courseId, moduleSlug)] !==
        courseKitArtifactCompletionMarker(
          evidence.artifactId,
          evidence.artifactSha256,
        )) {
      return null;
    }
    return evidence;
  } finally {
    visiting.delete(moduleSlug);
  }
}

export function courseKitModuleEvidenceState(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
): CourseKitModuleEvidenceState | null {
  if (!isCurrentCourseKitProgress(record, config)) return null;
  return evaluateCourseKitModuleEvidence(
    record,
    config,
    moduleSlug,
    new Set<string>(),
    false,
  );
}

export function areCourseKitModulePrerequisitesComplete(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
): boolean {
  const contract = moduleContract(config, moduleSlug);
  if (!contract) return false;
  return contract.prerequisiteModuleSlugs.every((prerequisite) =>
    evaluateCourseKitModuleEvidence(
      record,
      config,
      prerequisite,
      new Set<string>(),
      true,
    ) !== null
  );
}

export function isCourseKitModuleComplete(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
): boolean {
  return isCurrentCourseKitProgress(record, config)
    && evaluateCourseKitModuleEvidence(
      record,
      config,
      moduleSlug,
      new Set<string>(),
      true,
    ) !== null;
}

export function isCourseKitQuizComplete(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
): boolean {
  return (
    isCurrentCourseKitProgress(record, config) &&
    record[courseKitQuizVersionKey(config.courseId)] === config.quizVersion &&
    record[courseKitQuizPassedKey(config.courseId)] === true
  );
}

export function isCourseKitCapstoneComplete(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
): boolean {
  return (
    isCurrentCourseKitProgress(record, config) &&
    config.moduleSlugs.every((moduleSlug) =>
      isCourseKitModuleComplete(record, config, moduleSlug)
    ) &&
    isCourseKitQuizComplete(record, config) &&
    record[courseKitCapstoneVersionKey(config.courseId)] ===
      config.capstoneVersion &&
    record[courseKitCapstoneCompleteKey(config.courseId)] === true &&
    config.capstoneArtifactIds.every(
      (artifactId) => isCourseKitCapstoneArtifactComplete(
        record,
        config,
        artifactId,
      ),
    )
  );
}

export function isCourseKitCapstoneArtifactComplete(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  artifactId: string,
): boolean {
  if (!isCurrentCourseKitProgress(record, config)
    || record[courseKitCapstoneVersionKey(config.courseId)] !==
      config.capstoneVersion) return false;
  const parsed = courseKitCapstoneArtifactEvidenceState(record, config, artifactId);
  return Boolean(parsed)
    && record[courseKitCapstoneArtifactKey(config.courseId, artifactId)] ===
      courseKitArtifactCompletionMarker(artifactId, parsed?.sha256 ?? "");
}

export function courseKitCapstoneArtifactEvidenceState(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  artifactId: string,
) {
  if (!isCurrentCourseKitProgress(record, config)
    || record[courseKitCapstoneVersionKey(config.courseId)] !==
      config.capstoneVersion) return null;
  return parseCourseKitEvidenceReceipt(
    receiptText(record, courseKitCapstoneDraftKey(config.courseId, artifactId)),
    {
      kind: "capstone-artifact",
      courseId: config.courseId,
      courseVersion: config.courseVersion,
      artifactId,
      validatorId: config.evidenceValidatorId,
      validatorCommandPrefix: config.evidenceValidatorCommandPrefix,
    },
  );
}

export function courseKitProgressSummary(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
): CourseKitProgressSummary {
  const moduleMilestones = config.moduleSlugs.map((id) => ({
    kind: "module" as const,
    id,
    complete: isCourseKitModuleComplete(record, config, id),
  }));
  const milestones: CourseKitProgressSummary["milestones"] = [
    ...moduleMilestones,
    {
      kind: "quiz",
      id: "quiz",
      complete: isCourseKitQuizComplete(record, config),
    },
    {
      kind: "capstone",
      id: "capstone",
      complete: isCourseKitCapstoneComplete(record, config),
    },
  ];
  const completed = milestones.filter((milestone) => milestone.complete).length;
  const next = milestones.find((milestone) => !milestone.complete) ?? null;
  const nextMilestone: CourseKitMilestone | null =
    next?.kind === "module"
      ? { kind: "module", id: next.id }
      : next?.kind === "quiz"
        ? { kind: "quiz", id: "quiz" }
        : next?.kind === "capstone"
          ? { kind: "capstone", id: "capstone" }
          : null;
  const moduleEvidenceModes = new Set(
    config.moduleContracts.map((contract) =>
      contract.explicitlyDeclared
        ? contract.completionMode
        : "legacy-local-record"
    ),
  );
  const evidenceBasis = moduleEvidenceModes.size === 1
    ? [...moduleEvidenceModes][0]
    : "mixed";

  return {
    completed,
    total: config.milestoneCount,
    percent: Math.round((completed / config.milestoneCount) * 100),
    next: nextMilestone,
    evidenceBasis,
    milestones,
  };
}

export function courseKitProgressPercent(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
): number {
  return courseKitProgressSummary(record, config).percent;
}

export function invalidateCourseKitProgressRecord(
  record: Record<string, unknown>,
  config: CourseKitProgressClientConfig,
): void {
  if (record[config.progressVersionKey] === config.courseVersion) return;

  for (const key of Object.keys(record)) {
    if (key.startsWith(config.progressPrefix)) delete record[key];
  }
  record[config.progressVersionKey] = config.courseVersion;
}
