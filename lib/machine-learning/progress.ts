import {
  courseKitProgressPercent,
  courseKitProgressSummary,
  createCourseKitProgressConfig,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import { MACHINE_LEARNING_COURSE } from "./definition";

export const MACHINE_LEARNING_PROGRESS = createCourseKitProgressConfig(
  MACHINE_LEARNING_COURSE,
);
export const MACHINE_LEARNING_PROGRESS_PREFIX =
  MACHINE_LEARNING_PROGRESS.progressPrefix;
export const MACHINE_LEARNING_PROGRESS_VERSION_KEY =
  MACHINE_LEARNING_PROGRESS.progressVersionKey;
export const MACHINE_LEARNING_PROGRESS_EVENT = MACHINE_LEARNING_PROGRESS.progressEvent;
export const MACHINE_LEARNING_PROGRESS_RESET_EVENT =
  MACHINE_LEARNING_PROGRESS.resetEvent;

export function machineLearningProgressPercent(
  record: CourseKitProgressRecord,
): number {
  return courseKitProgressPercent(record, MACHINE_LEARNING_PROGRESS);
}

export function machineLearningProgressSummary(record: CourseKitProgressRecord) {
  return courseKitProgressSummary(record, MACHINE_LEARNING_PROGRESS);
}
