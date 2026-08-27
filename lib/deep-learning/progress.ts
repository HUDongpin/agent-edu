import {
  courseKitProgressPercent,
  courseKitProgressSummary,
  createCourseKitProgressConfig,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import { DEEP_LEARNING_COURSE } from "./definition";

export const DEEP_LEARNING_PROGRESS = createCourseKitProgressConfig(
  DEEP_LEARNING_COURSE,
);
export const DEEP_LEARNING_PROGRESS_PREFIX =
  DEEP_LEARNING_PROGRESS.progressPrefix;
export const DEEP_LEARNING_PROGRESS_VERSION_KEY =
  DEEP_LEARNING_PROGRESS.progressVersionKey;
export const DEEP_LEARNING_PROGRESS_EVENT =
  DEEP_LEARNING_PROGRESS.progressEvent;
export const DEEP_LEARNING_PROGRESS_RESET_EVENT =
  DEEP_LEARNING_PROGRESS.resetEvent;

export function deepLearningProgressPercent(
  record: CourseKitProgressRecord,
): number {
  return courseKitProgressPercent(record, DEEP_LEARNING_PROGRESS);
}

export function deepLearningProgressSummary(record: CourseKitProgressRecord) {
  return courseKitProgressSummary(record, DEEP_LEARNING_PROGRESS);
}
