/**
 * Closed ownership contract for every browser-storage key used by progress.
 *
 * Durable keys hold learner state. Ephemeral local keys are capability probes;
 * ephemeral session keys are recovery copies, tab-scoped resumable drafts,
 * or tab-scoped resume receipts.
 * Ordinary course updates must never overwrite a corrupt durable record.
 */
export const PROGRESS_LOCAL_DURABLE_KEYS = [
  "ae.learning.v2",
  "tch.section",
  "tch.seen",
  "ae.progress",
  "aicourse.grok.progress.v1",
  "aicourse.cursor.progress.v1",
  "ae.progress.recent.v1",
] as const;

export const PROMPT_PROGRESS_PROBE_KEY = "__aicourse_prompts_storage_probe__";
export const RAG_PROGRESS_PROBE_KEY = "__aicourse_rag_storage_probe__";
export const AI_TUTOR_PROGRESS_PROBE_KEY = "__aicourse_ai_tutor_storage_probe__";
export const PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY =
  "__aicourse_product_management_storage_probe__";
export const AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY =
  "__aicourse_agent_orchestration_storage_probe__";
export const COURSE_KIT_PROGRESS_PROBE_KEY =
  "__aicourse_course_kit_storage_probe__";
export const AI_TEACHING_PROGRESS_PROBE_KEY =
  "__aicourse_ai_teaching_storage_probe__";
export const MATH_ANIMATION_PROGRESS_PROBE_KEY =
  "__aicourse_math_animation_storage_probe__";
export const INCOME_PROGRESS_PROBE_KEY = "ae.progress.income-probe";
export const GROK_PROGRESS_PROBE_KEY = "aicourse.grok.progress.v1.probe";
export const GROK_QUIZ_ATTEMPT_KEY = "aicourse.grok.quiz-attempt.v1";
export const GROK_TASK_CONTRACT_DRAFT_KEY =
  "aicourse.grok.task-contract-draft.v1";
export const CLAUDE_INCOME_QUIZ_ATTEMPT_KEY =
  "aicourse.claude-income.quiz-attempt.v1";

export const PROGRESS_LOCAL_EPHEMERAL_KEYS = [
  PROMPT_PROGRESS_PROBE_KEY,
  RAG_PROGRESS_PROBE_KEY,
  AI_TUTOR_PROGRESS_PROBE_KEY,
  PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
  COURSE_KIT_PROGRESS_PROBE_KEY,
  AI_TEACHING_PROGRESS_PROBE_KEY,
  MATH_ANIMATION_PROGRESS_PROBE_KEY,
  INCOME_PROGRESS_PROBE_KEY,
  GROK_PROGRESS_PROBE_KEY,
] as const;

/**
 * Durable, inactive recovery slots used only by an explicitly confirmed global
 * reset. Progress readers must never treat these exact-byte copies as learning
 * state. A different existing copy is a conflict and must never be overwritten.
 */
export const LEARNING_RESET_QUARANTINE_KEY =
  "ae.learning.v2.reset-quarantine.v1";
export const SHARED_PROGRESS_RESET_QUARANTINE_KEY =
  "ae.progress.reset-quarantine.v1";
export const CURSOR_PROGRESS_RESET_QUARANTINE_KEY =
  "aicourse.cursor.progress.v1.reset-quarantine.v1";
export const GROK_PROGRESS_RESET_QUARANTINE_KEY =
  "aicourse.grok.progress.v1.reset-quarantine.v1";
export const RECENCY_RESET_QUARANTINE_KEY =
  "ae.progress.recent.v1.reset-quarantine.v1";

export const PROGRESS_LOCAL_QUARANTINE_KEYS = [
  LEARNING_RESET_QUARANTINE_KEY,
  SHARED_PROGRESS_RESET_QUARANTINE_KEY,
  CURSOR_PROGRESS_RESET_QUARANTINE_KEY,
  GROK_PROGRESS_RESET_QUARANTINE_KEY,
  RECENCY_RESET_QUARANTINE_KEY,
] as const;

export const CORRUPT_LEARNING_BACKUP_KEY = "ae.learning.v2.corrupt-backup";
export const RAG_CORRUPT_PROGRESS_BACKUP_KEY = "ae.progress.corrupt-backup";
export const AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY =
  "ae.progress.ai-tutor-corrupt-backup";
export const PRODUCT_MANAGEMENT_CORRUPT_PROGRESS_BACKUP_KEY =
  "ae.progress.product-management-corrupt-backup";
export const PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY =
  "product-management.assessment.attempt.v1";
export const PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY =
  "__aicourse_product_management_assessment_attempt_probe__";
export const AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY =
  "ae.progress.agent-orchestration-corrupt-backup";
export const COURSE_KIT_CORRUPT_PROGRESS_BACKUP_KEY =
  "ae.progress.course-kit-corrupt-backup";
export const AI_TEACHING_CORRUPT_PROGRESS_BACKUP_KEY =
  "ae.progress.ai-teaching-corrupt-backup";
export const MATH_ANIMATION_CORRUPT_PROGRESS_BACKUP_KEY =
  "ae.progress.math-animation-corrupt-backup";
export const CODEX_CAPSTONE_DRAFT_STORAGE_KEY =
  "aicourse.codex.capstone-draft.v1";
export const CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY =
  "ae.cursor.final-quiz-attempt.v1";
export const CURSOR_CAPSTONE_DRAFT_STORAGE_KEY =
  "ae.cursor.capstone-assessment.v1";
export const CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY =
  "ae.cursor.capstone-receipt-memory.v1";
export const CURSOR_SESSION_DRAFT_PROBE_KEY =
  "ae.cursor.session-draft-probe.v1";

/** Keys that may contain JSON in sessionStorage. Receipt text is never written. */
export const CURSOR_PERSISTED_SESSION_DRAFT_KEYS = [
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
] as const;

/** Exact tab-scoped keys removed by Course 4 course/global reset. */
export const CURSOR_SESSION_OWNED_KEYS = [
  ...CURSOR_PERSISTED_SESSION_DRAFT_KEYS,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
] as const;

export type CursorPersistedSessionDraftKey =
  (typeof CURSOR_PERSISTED_SESSION_DRAFT_KEYS)[number];
export type CursorSessionOwnedKey = (typeof CURSOR_SESSION_OWNED_KEYS)[number];

export const PROGRESS_SESSION_EPHEMERAL_KEYS = [
  CODEX_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
  CURSOR_SESSION_DRAFT_PROBE_KEY,
  CORRUPT_LEARNING_BACKUP_KEY,
  RAG_CORRUPT_PROGRESS_BACKUP_KEY,
  AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY,
  PRODUCT_MANAGEMENT_CORRUPT_PROGRESS_BACKUP_KEY,
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY,
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY,
  AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
  COURSE_KIT_CORRUPT_PROGRESS_BACKUP_KEY,
  AI_TEACHING_CORRUPT_PROGRESS_BACKUP_KEY,
  MATH_ANIMATION_CORRUPT_PROGRESS_BACKUP_KEY,
  GROK_QUIZ_ATTEMPT_KEY,
  GROK_TASK_CONTRACT_DRAFT_KEY,
  CLAUDE_INCOME_QUIZ_ATTEMPT_KEY,
  // Course 11 course/global resets remove these exact tab-scoped work keys.
  "aicourse.course11.session-draft-probe.v1",
  "aicourse.course11.margin.v1",
  "aicourse.course11.quiz-answers.v1",
  "aicourse.course11.scorecard.v1",
  "aicourse.course11.offer.v1",
] as const;

export const PROGRESS_OWNED_STORAGE_KEYS = Object.freeze({
  localStorage: Object.freeze({
    durable: PROGRESS_LOCAL_DURABLE_KEYS,
    ephemeral: PROGRESS_LOCAL_EPHEMERAL_KEYS,
    quarantine: PROGRESS_LOCAL_QUARANTINE_KEYS,
  }),
  sessionStorage: Object.freeze({
    ephemeral: PROGRESS_SESSION_EPHEMERAL_KEYS,
  }),
});
