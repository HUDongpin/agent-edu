import type {
  CourseKitDefinition,
  CourseKitMilestoneCount,
  CourseKitProgressClientConfig,
} from "./types";
import { PROG } from "../progress-storage-key";
import { validateCourseKitEvidenceReceipt } from "./evidence-receipt";

export const COURSE_KIT_PROGRESS_STORAGE_KEY = PROG;
export const COURSE_KIT_PROGRESS_EVENT = "ae:course-kit:progress" as const;
export const COURSE_KIT_PROGRESS_RESET_EVENT =
  "ae:course-kit:progress-reset" as const;
export const RESPONSIBLE_AI_COURSE_KIT_PROGRESS_EVENT =
  "ae:course-kit:progress:responsible-ai" as const;
export const AGENTIC_QUANT_TRADING_COURSE_KIT_PROGRESS_EVENT =
  "ae:course-kit:progress:agentic-quant-trading" as const;

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

export function courseKitQuizPassedKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.passed`;
}

export function courseKitQuizDraftKey(courseId: string): string {
  return `${courseKitProgressPrefix(courseId)}quiz.draft`;
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
  if (courseId === "responsible-ai") return RESPONSIBLE_AI_COURSE_KIT_PROGRESS_EVENT;
  if (courseId === "agentic-quant-trading") {
    return AGENTIC_QUANT_TRADING_COURSE_KIT_PROGRESS_EVENT;
  }
  return `${COURSE_KIT_PROGRESS_EVENT}:${safeId(courseId)}`;
}

export function courseKitProgressResetEvent(courseId: string): string {
  return `${COURSE_KIT_PROGRESS_RESET_EVENT}:${safeId(courseId)}`;
}

export function createCourseKitProgressConfig(
  definition: CourseKitDefinition,
): CourseKitProgressClientConfig {
  const { manifest, quiz, capstone } = definition;
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
    moduleReceiptEvidence: manifest.completionEvidence.moduleReceipt,
    quizVersion: quiz.version,
    capstoneVersion: capstone.version,
    capstoneArtifactIds: capstone.artifacts.map((artifact) => artifact.id),
    capstoneArtifactEvidence: manifest.completionEvidence.capstoneArtifact,
  };
}

export function isCurrentCourseKitProgress(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
): boolean {
  return record[config.progressVersionKey] === config.courseVersion;
}

export function isCourseKitModuleComplete(
  record: CourseKitProgressRecord,
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
): boolean {
  const checkpoint = record[courseKitCheckpointKey(config.courseId, moduleSlug)];
  const checkpointComplete = Boolean(
    checkpoint
    && typeof checkpoint === "object"
    && !Array.isArray(checkpoint)
    && (checkpoint as { correct?: unknown }).correct === true,
  );
  const receipt = record[courseKitModuleReceiptKey(config.courseId, moduleSlug)];
  const receiptComplete = config.moduleReceiptEvidence === "none"
    || (typeof receipt === "string"
      && validateCourseKitEvidenceReceipt(receipt, {
        expectedArtifactPath: `outputs/${config.courseId}/${moduleSlug}.json`,
      }).valid);
  return (
    isCurrentCourseKitProgress(record, config) &&
    record[courseKitModuleCompleteKey(config.courseId, moduleSlug)] === true &&
    checkpointComplete &&
    receiptComplete
  );
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
    record[courseKitCapstoneVersionKey(config.courseId)] ===
      config.capstoneVersion &&
    record[courseKitCapstoneCompleteKey(config.courseId)] === true &&
    config.capstoneArtifactIds.every(
      (artifactId) => {
        if (record[courseKitCapstoneArtifactKey(config.courseId, artifactId)] !== true) {
          return false;
        }
        const draft = record[courseKitCapstoneDraftKey(config.courseId, artifactId)];
        if (typeof draft !== "string" || !draft.trim()) return false;
        return config.capstoneArtifactEvidence === "draft"
          || validateCourseKitEvidenceReceipt(draft, {
            expectedArtifactPath: `outputs/${config.courseId}/${artifactId}.json`,
          }).valid;
      },
    )
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

  return {
    completed,
    total: config.milestoneCount,
    percent: Math.round((completed / config.milestoneCount) * 100),
    next: nextMilestone,
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
