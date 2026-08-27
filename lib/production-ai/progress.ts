import {
  courseKitProgressPercent,
  courseKitProgressSummary,
  createCourseKitProgressConfig,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import { PRODUCTION_AI_COURSE } from "./definition";

export const PRODUCTION_AI_PROGRESS = createCourseKitProgressConfig(
  PRODUCTION_AI_COURSE,
);
export const PRODUCTION_AI_PROGRESS_PREFIX = PRODUCTION_AI_PROGRESS.progressPrefix;
export const PRODUCTION_AI_PROGRESS_VERSION_KEY = PRODUCTION_AI_PROGRESS.progressVersionKey;
export const PRODUCTION_AI_PROGRESS_EVENT = PRODUCTION_AI_PROGRESS.progressEvent;
export const PRODUCTION_AI_PROGRESS_RESET_EVENT = PRODUCTION_AI_PROGRESS.resetEvent;

export function productionAiProgressPercent(
  record: CourseKitProgressRecord,
): number {
  return courseKitProgressPercent(record, PRODUCTION_AI_PROGRESS);
}

export function productionAiProgressSummary(record: CourseKitProgressRecord) {
  return courseKitProgressSummary(record, PRODUCTION_AI_PROGRESS);
}
