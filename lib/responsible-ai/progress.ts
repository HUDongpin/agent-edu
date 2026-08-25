import {
  courseKitProgressPercent,
  courseKitProgressSummary,
  createCourseKitProgressConfig,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import { RESPONSIBLE_AI_COURSE } from "./definition";

export const RESPONSIBLE_AI_PROGRESS = createCourseKitProgressConfig(
  RESPONSIBLE_AI_COURSE,
);
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
