import {
  courseKitProgressPercent,
  courseKitProgressSummary,
  createCourseKitProgressConfig,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import { AI_RESEARCH_COURSE } from "./definition";

export const AI_RESEARCH_PROGRESS = createCourseKitProgressConfig(
  AI_RESEARCH_COURSE,
);
export const AI_RESEARCH_PROGRESS_PREFIX = AI_RESEARCH_PROGRESS.progressPrefix;
export const AI_RESEARCH_PROGRESS_VERSION_KEY = AI_RESEARCH_PROGRESS.progressVersionKey;
export const AI_RESEARCH_PROGRESS_EVENT = AI_RESEARCH_PROGRESS.progressEvent;
export const AI_RESEARCH_PROGRESS_RESET_EVENT = AI_RESEARCH_PROGRESS.resetEvent;

export function aiResearchProgressPercent(record: CourseKitProgressRecord): number {
  return courseKitProgressPercent(record, AI_RESEARCH_PROGRESS);
}

export function aiResearchProgressSummary(record: CourseKitProgressRecord) {
  return courseKitProgressSummary(record, AI_RESEARCH_PROGRESS);
}
