/**
 * Closed ownership contract for every browser-storage key used by progress.
 *
 * Durable keys hold learner state. Ephemeral local keys are capability probes;
 * ephemeral session keys are recovery copies of quarantined corrupt records.
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
export const INCOME_PROGRESS_PROBE_KEY = "ae.progress.income-probe";
export const GROK_PROGRESS_PROBE_KEY = "aicourse.grok.progress.v1.probe";

export const PROGRESS_LOCAL_EPHEMERAL_KEYS = [
  PROMPT_PROGRESS_PROBE_KEY,
  RAG_PROGRESS_PROBE_KEY,
  AI_TUTOR_PROGRESS_PROBE_KEY,
  PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
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
export const AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY =
  "ae.progress.agent-orchestration-corrupt-backup";

export const PROGRESS_SESSION_EPHEMERAL_KEYS = [
  CORRUPT_LEARNING_BACKUP_KEY,
  RAG_CORRUPT_PROGRESS_BACKUP_KEY,
  AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY,
  PRODUCT_MANAGEMENT_CORRUPT_PROGRESS_BACKUP_KEY,
  AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
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
