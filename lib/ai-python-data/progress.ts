import {
  courseKitProgressPercent,
  courseKitProgressSummary,
  createCourseKitProgressConfig,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import { AI_PYTHON_DATA_COURSE } from "./definition";

export const AI_PYTHON_DATA_PROGRESS = createCourseKitProgressConfig(
  AI_PYTHON_DATA_COURSE,
);
export const AI_PYTHON_DATA_PROGRESS_PREFIX = AI_PYTHON_DATA_PROGRESS.progressPrefix;
export const AI_PYTHON_DATA_PROGRESS_VERSION_KEY =
  AI_PYTHON_DATA_PROGRESS.progressVersionKey;
export const AI_PYTHON_DATA_PROGRESS_EVENT = AI_PYTHON_DATA_PROGRESS.progressEvent;
export const AI_PYTHON_DATA_PROGRESS_RESET_EVENT = AI_PYTHON_DATA_PROGRESS.resetEvent;

export function aiPythonDataProgressPercent(
  record: CourseKitProgressRecord,
): number {
  return courseKitProgressPercent(record, AI_PYTHON_DATA_PROGRESS);
}

export function aiPythonDataProgressSummary(record: CourseKitProgressRecord) {
  return courseKitProgressSummary(record, AI_PYTHON_DATA_PROGRESS);
}
