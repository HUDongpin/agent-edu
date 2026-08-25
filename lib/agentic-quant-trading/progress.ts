import {
  courseKitProgressPercent,
  courseKitProgressSummary,
  createCourseKitProgressConfig,
  type CourseKitProgressRecord,
} from "../course-kit/progress";
import { AGENTIC_QUANT_TRADING_COURSE } from "./definition";

export const AGENTIC_QUANT_TRADING_PROGRESS = createCourseKitProgressConfig(
  AGENTIC_QUANT_TRADING_COURSE,
);
export const AGENTIC_QUANT_TRADING_PROGRESS_PREFIX =
  AGENTIC_QUANT_TRADING_PROGRESS.progressPrefix;
export const AGENTIC_QUANT_TRADING_PROGRESS_VERSION_KEY =
  AGENTIC_QUANT_TRADING_PROGRESS.progressVersionKey;
export const AGENTIC_QUANT_TRADING_PROGRESS_EVENT =
  AGENTIC_QUANT_TRADING_PROGRESS.progressEvent;
export const AGENTIC_QUANT_TRADING_PROGRESS_RESET_EVENT =
  AGENTIC_QUANT_TRADING_PROGRESS.resetEvent;

export function agenticQuantTradingProgressPercent(
  record: CourseKitProgressRecord,
): number {
  return courseKitProgressPercent(record, AGENTIC_QUANT_TRADING_PROGRESS);
}

export function agenticQuantTradingProgressSummary(
  record: CourseKitProgressRecord,
) {
  return courseKitProgressSummary(record, AGENTIC_QUANT_TRADING_PROGRESS);
}
