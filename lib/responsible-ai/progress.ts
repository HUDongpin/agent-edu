import {
  COURSE_KIT_PROGRESS_STORAGE_KEY,
  courseKitProgressEvent,
  courseKitProgressPercent,
  courseKitProgressPrefix,
  courseKitProgressResetEvent,
  courseKitProgressSummary,
  courseKitProgressVersionKey,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import type { CourseKitProgressClientConfig } from "../course-kit/types";

const RESPONSIBLE_AI_COURSE_ID = "responsible-ai" as const;

/** Lightweight browser progress topology; the full course definition stays server-side. */
export const RESPONSIBLE_AI_PROGRESS = {
  storageKey: COURSE_KIT_PROGRESS_STORAGE_KEY,
  courseId: RESPONSIBLE_AI_COURSE_ID,
  courseVersion: "2026.08.26-v1",
  progressPrefix: courseKitProgressPrefix(RESPONSIBLE_AI_COURSE_ID),
  progressVersionKey: courseKitProgressVersionKey(RESPONSIBLE_AI_COURSE_ID),
  progressEvent: courseKitProgressEvent(RESPONSIBLE_AI_COURSE_ID),
  resetEvent: courseKitProgressResetEvent(RESPONSIBLE_AI_COURSE_ID),
  milestoneCount: 12,
  moduleSlugs: [
    "purpose-risk-classification",
    "stakeholders-impact-assessment",
    "data-rights-privacy-minimisation",
    "fairness-subgroup-audit",
    "explainability-uncertainty-limitations",
    "model-data-system-cards",
    "human-authority-oversight-boundaries",
    "escalation-appeal-contestability",
    "red-teaming-incidents-disclosure",
    "governance-dossier-capstone",
  ],
  moduleReceiptEvidence: "none",
  quizVersion: "2026.08.26-quiz-v1",
  capstoneVersion: "2026.08.26-capstone-v1",
  capstoneArtifactIds: [
    "impact-assessment",
    "stakeholder-map",
    "risk-register",
    "data-map",
    "subgroup-test",
    "assurance-card",
    "override-appeal-flow",
    "red-team-incident-log",
    "go-no-go-memo",
  ],
  capstoneArtifactEvidence: "draft",
} as const satisfies CourseKitProgressClientConfig;
export const RESPONSIBLE_AI_PROGRESS_PREFIX = RESPONSIBLE_AI_PROGRESS.progressPrefix;
export const RESPONSIBLE_AI_PROGRESS_VERSION_KEY = RESPONSIBLE_AI_PROGRESS.progressVersionKey;
export const RESPONSIBLE_AI_PROGRESS_EVENT = RESPONSIBLE_AI_PROGRESS.progressEvent;
export const RESPONSIBLE_AI_PROGRESS_RESET_EVENT = RESPONSIBLE_AI_PROGRESS.resetEvent;

export function responsibleAiProgressPercent(record: CourseKitProgressRecord): number {
  return courseKitProgressPercent(record, RESPONSIBLE_AI_PROGRESS);
}

export function responsibleAiProgressSummary(record: CourseKitProgressRecord) {
  return courseKitProgressSummary(record, RESPONSIBLE_AI_PROGRESS);
}
