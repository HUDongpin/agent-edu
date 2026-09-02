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

const AGENTIC_QUANT_TRADING_COURSE_ID = "agentic-quant-trading" as const;

/** Lightweight browser progress topology; the full course definition stays server-side. */
export const AGENTIC_QUANT_TRADING_PROGRESS = {
  storageKey: COURSE_KIT_PROGRESS_STORAGE_KEY,
  courseId: AGENTIC_QUANT_TRADING_COURSE_ID,
  courseVersion: "2026.08.26-v3",
  progressPrefix: courseKitProgressPrefix(AGENTIC_QUANT_TRADING_COURSE_ID),
  progressVersionKey: courseKitProgressVersionKey(AGENTIC_QUANT_TRADING_COURSE_ID),
  progressEvent: courseKitProgressEvent(AGENTIC_QUANT_TRADING_COURSE_ID),
  resetEvent: courseKitProgressResetEvent(AGENTIC_QUANT_TRADING_COURSE_ID),
  milestoneCount: 14,
  moduleSlugs: [
    "scope-safety-autonomy",
    "market-data-time-contracts",
    "agent-architecture-authority",
    "hypotheses-experiment-ledger",
    "features-labels-text-signals",
    "backtest-leakage-costs",
    "evaluation-uncertainty-overfitting",
    "multi-agent-debate-verification",
    "portfolio-risk-deterministic-gates",
    "paper-execution-reconciliation",
    "monitoring-kill-switch-incidents",
    "capstone-auditable-paper-desk",
  ],
  moduleReceiptEvidence: "structured-receipt",
  quizVersion: "2026.08.26-quiz-v4-module-twelve-contextual-seed-1118",
  capstoneVersion: "2026.08.26-capstone-v3-protected-approval",
  capstoneArtifactIds: [
    "mandate-authority",
    "data-signal-lineage",
    "agent-experiment-ledger",
    "backtest-evaluation",
    "claim-debate-audit",
    "risk-gates",
    "paper-execution-reconciliation",
    "operations-release",
  ],
  capstoneArtifactEvidence: "structured-receipt",
} as const satisfies CourseKitProgressClientConfig;
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
