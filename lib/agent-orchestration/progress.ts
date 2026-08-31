import {
  AGENT_ORCHESTRATION_PROGRESS_EVENT as TOPOLOGY_PROGRESS_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
  AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT as TOPOLOGY_PROGRESS_RESET_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
  migrateAgentOrchestrationProgressRecord,
} from "../progress-topology";
import {
  AGENT_ORCHESTRATION_LAB_ID_BY_MODULE,
} from "./lab-model";
import { isAgentOrchestrationQuizPassed } from "./assessment-validation";
import { isAgentOrchestrationCapstoneComplete } from "./capstone-validation";
import {
  agentOrchestrationLabKey,
  isSavedAgentOrchestrationLabReceipt,
} from "./lab-progress";
import { AGENT_ORCHESTRATION_PRACTICE_TEMPLATES } from "./practice-templates";
import type {
  AgentOrchestrationCheckpointCopy,
  AgentOrchestrationModuleSlug,
} from "./types";
import { AGENT_ORCHESTRATION_CHECKPOINT_CONTENT_VERSION } from "./types";

export {
  AGENT_ORCHESTRATION_MAX_LAB_EVIDENCE_LENGTH,
  AGENT_ORCHESTRATION_MIN_LAB_EVIDENCE_CHARACTERS,
  agentOrchestrationLabKey,
  agentOrchestrationLabPendingKey,
  createAgentOrchestrationLabReceipt,
  isMeaningfulAgentOrchestrationLearnerEvidence,
  isSavedAgentOrchestrationLabReceipt,
  normalizeAgentOrchestrationLearnerEvidence,
  saveAgentOrchestrationLabReceipt,
  saveAgentOrchestrationPendingLabWork,
} from "./lab-progress";
export type { AgentOrchestrationLabReceipt } from "./lab-progress";
export {
  AGENT_ORCHESTRATION_QUIZ_BEST_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASSED_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT,
  isAgentOrchestrationQuizPassed,
  readAgentOrchestrationQuizBest,
  recordAgentOrchestrationQuizAttempt,
} from "./assessment-validation";
export type {
  AgentOrchestrationAssessmentAnswers,
  AgentOrchestrationAssessmentQuestionResult,
  AgentOrchestrationAssessmentResult,
} from "./assessment-progress";
export {
  AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_CAPSTONE_KEY,
  AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH,
  agentOrchestrationCapstoneEvidence,
  canonicalAgentOrchestrationEvidenceIdentity,
  isAgentOrchestrationCapstoneComplete,
  isMeaningfulAgentOrchestrationEvidenceReference,
  normalizeAgentOrchestrationEvidenceReference,
  validateAgentOrchestrationCapstoneEvidence,
} from "./capstone-validation";
export type {
  AgentOrchestrationCapstoneEvidenceValidation,
} from "./capstone-validation";

export const AGENT_ORCHESTRATION_PROGRESS_PREFIX =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.prefix;
export const AGENT_ORCHESTRATION_PROGRESS_VERSION =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version;
export const AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey;
export const AGENT_ORCHESTRATION_PROGRESS_EVENT =
  TOPOLOGY_PROGRESS_EVENT;
export const AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT =
  TOPOLOGY_PROGRESS_RESET_EVENT;
export const AGENT_ORCHESTRATION_PROGRESS_MILESTONES =
  AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS.length + 2;

export function agentOrchestrationModuleProgressKey(
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.complete`;
}

export function agentOrchestrationCheckpointKey(
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.checkpoint`;
}

/** @deprecated Legacy split-state key for cleanup only; never completion proof. */
export function agentOrchestrationCheckpointPassedKey(
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.checkpoint.passed`;
}

export interface AgentOrchestrationCheckpointAnswerContract {
  readonly checkpointId: string;
  readonly contentVersion:
    typeof AGENT_ORCHESTRATION_CHECKPOINT_CONTENT_VERSION;
  readonly correctOptionId: string;
}

/**
 * Compact browser-safe registry for locale-neutral course summaries.
 *
 * Active module UI must validate against its full displayed checkpoint. This
 * registry exists only because catalogue and aggregate-progress consumers do
 * not load either long-form locale bundle. Keep it in lockstep with the two
 * native copy files through the Course 15 invariant checker.
 */
function checkpointAnswerContract(
  checkpointId: string,
  correctOptionId: string,
): AgentOrchestrationCheckpointAnswerContract {
  return {
    checkpointId,
    contentVersion: AGENT_ORCHESTRATION_CHECKPOINT_CONTENT_VERSION,
    correctOptionId,
  };
}

export const AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS = {
  "workflow-agent-boundary": [
    checkpointAnswerContract("ao15.workflow-agent-boundary.en.deterministic-default", "code-directed-deterministic-workflow"),
    checkpointAnswerContract("ao15.workflow-agent-boundary.zh-hans.multi-agent-justification", "measured-isolation-parallel-benefit"),
  ],
  "task-graphs-contracts": [
    checkpointAnswerContract("ao15.task-graphs-contracts.en.fanout-contract", "typed-workers-state-limits-join-terminals"),
    checkpointAnswerContract("ao15.task-graphs-contracts.zh-hans.ambiguous-external-write", "outcome-unknown-reconcile"),
  ],
  "chaining-routing": [
    checkpointAnswerContract("ao15.chaining-routing.en.schema-valid-route", "schema-conformance-only"),
    checkpointAnswerContract("ao15.chaining-routing.zh-hans.structured-output-boundary", "shape-only-application-checks"),
  ],
  "parallel-fanout-fanin": [
    checkpointAnswerContract("ao15.parallel-fanout-fanin.en.tool-call-intents", "tool-call-intents-only"),
    checkpointAnswerContract("ao15.parallel-fanout-fanin.zh-hans.tool-call-intents", "tool-intents-runtime-decides"),
  ],
  "manager-roles-ownership": [
    checkpointAnswerContract("ao15.manager-roles-ownership.en.final-synthesis-owner", "manager-after-validation"),
    checkpointAnswerContract("ao15.manager-roles-ownership.zh-hans.final-answer-owner", "central-manager"),
  ],
  "delegation-handoffs": [
    checkpointAnswerContract("ao15.delegation-handoffs.en.active-agent-continuity", "active-agent-and-runtime-state"),
    checkpointAnswerContract("ao15.delegation-handoffs.zh-hans.control-transfer", "manager-retains-versus-recipient-control"),
  ],
  "orchestrator-workers-verification": [
    checkpointAnswerContract("ao15.orchestrator-workers-verification.en.independent-verifier", "primary-artifacts-separate-checks-fail-unknown"),
    checkpointAnswerContract("ao15.orchestrator-workers-verification.zh-hans.systematic-omission", "primary-requirements-rubric-evidence"),
  ],
  "tools-aci-mcp": [
    checkpointAnswerContract("ao15.tools-aci-mcp.en.protocol-scope", "declared-capability-exchange"),
    checkpointAnswerContract("ao15.tools-aci-mcp.zh-hans.versioned-protocol-scope", "versioned-capability-exchange"),
  ],
  "context-state-memory": [
    checkpointAnswerContract("ao15.context-state-memory.en.compaction-boundary", "continuation-with-separate-state-evidence"),
    checkpointAnswerContract("ao15.context-state-memory.zh-hans.business-source-of-truth", "application-order-state-ledger-version"),
  ],
  "budgets-concurrency-stopping": [
    checkpointAnswerContract("ao15.budgets-concurrency-stopping.en.runtime-capacity", "capacity-not-policy"),
    checkpointAnswerContract("ao15.budgets-concurrency-stopping.zh-hans.concurrency-counting-scope", "verify-runtime-version-counting-queue"),
  ],
  "reliability-recovery": [
    checkpointAnswerContract("ao15.reliability-recovery.en.ambiguous-payment-timeout", "reconcile-original-operation-id"),
    checkpointAnswerContract("ao15.reliability-recovery.zh-hans.ambiguous-write-timeout", "outcome-unknown-original-key-reconcile"),
  ],
  "security-authority-human-control": [
    checkpointAnswerContract("ao15.security-authority-human-control.en.approval-scope", "scoped-action-only"),
    checkpointAnswerContract("ao15.security-authority-human-control.zh-hans.human-approval-boundary", "contextual-action-authorization"),
  ],
  "tracing-observability-economics": [
    checkpointAnswerContract("ao15.tracing-observability-economics.en.trace-boundary", "recorded-path-no-traced-error"),
    checkpointAnswerContract("ao15.tracing-observability-economics.zh-hans.trace-evidence-scope", "execution-path-only"),
  ],
  "evaluation-regression-evolution": [
    checkpointAnswerContract("ao15.evaluation-regression-evolution.en.unsafe-trajectory", "block-unsafe-trajectory"),
    checkpointAnswerContract("ao15.evaluation-regression-evolution.zh-hans.multiple-trials", "estimate-behavior-distribution"),
  ],
  "production-orchestration-capstone": [
    checkpointAnswerContract("ao15.production-orchestration-capstone.en.staging-response-proof", "one-staged-response-only"),
    checkpointAnswerContract("ao15.production-orchestration-capstone.zh-hans.background-mode-scope", "single-async-response"),
  ],
} as const satisfies Readonly<Record<
  AgentOrchestrationModuleSlug,
  readonly [
    AgentOrchestrationCheckpointAnswerContract,
    AgentOrchestrationCheckpointAnswerContract,
  ]
>>;

export interface AgentOrchestrationCheckpointReceipt {
  readonly checkpointId: string;
  readonly selectedOptionId: string;
  readonly passed: boolean;
  readonly contentVersion:
    typeof AGENT_ORCHESTRATION_CHECKPOINT_CONTENT_VERSION;
}

const AGENT_ORCHESTRATION_CHECKPOINT_RECEIPT_KEYS = [
  "checkpointId",
  "contentVersion",
  "passed",
  "selectedOptionId",
] as const;
const AGENT_ORCHESTRATION_SEMANTIC_ID_PATTERN =
  /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/u;

function isAgentOrchestrationCheckpointContract(
  checkpoint: AgentOrchestrationCheckpointCopy,
): boolean {
  if (
    !AGENT_ORCHESTRATION_SEMANTIC_ID_PATTERN.test(checkpoint.checkpointId)
    || checkpoint.contentVersion
      !== AGENT_ORCHESTRATION_CHECKPOINT_CONTENT_VERSION
    || checkpoint.options.length !== 4
  ) return false;
  const optionIds = checkpoint.options.map((option) => option.id);
  return checkpoint.options.every(
    (option) => AGENT_ORCHESTRATION_SEMANTIC_ID_PATTERN.test(option.id)
      && option.label.trim().length > 0,
  )
    && new Set(optionIds).size === optionIds.length
    && optionIds.includes(checkpoint.correctOptionId);
}

function isKnownAgentOrchestrationCheckpointContract(
  checkpoint: AgentOrchestrationCheckpointCopy,
): boolean {
  return isAgentOrchestrationCheckpointContract(checkpoint)
    && Object.values(AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS).some(
      (contracts) => contracts.some(
        (contract) => contract.checkpointId === checkpoint.checkpointId
          && contract.contentVersion === checkpoint.contentVersion
          && contract.correctOptionId === checkpoint.correctOptionId,
      ),
    );
}

function isCheckpointContractForModule(
  checkpoint: AgentOrchestrationCheckpointCopy,
  slug: AgentOrchestrationModuleSlug,
): boolean {
  return isAgentOrchestrationCheckpointContract(checkpoint)
    && AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS[slug].some(
      (contract) => contract.checkpointId === checkpoint.checkpointId
        && contract.contentVersion === checkpoint.contentVersion
        && contract.correctOptionId === checkpoint.correctOptionId,
    );
}

function isExactCheckpointReceiptRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return keys.length === AGENT_ORCHESTRATION_CHECKPOINT_RECEIPT_KEYS.length
    && keys.every(
      (key, index) => key === AGENT_ORCHESTRATION_CHECKPOINT_RECEIPT_KEYS[index],
    );
}

export function createAgentOrchestrationCheckpointReceipt(
  checkpoint: AgentOrchestrationCheckpointCopy,
  selectedOptionId: string,
): AgentOrchestrationCheckpointReceipt | null {
  if (
    !isKnownAgentOrchestrationCheckpointContract(checkpoint)
    || !checkpoint.options.some((option) => option.id === selectedOptionId)
  ) return null;
  return {
    checkpointId: checkpoint.checkpointId,
    selectedOptionId,
    passed: selectedOptionId === checkpoint.correctOptionId,
    contentVersion: checkpoint.contentVersion,
  };
}

export function isAgentOrchestrationCheckpointReceipt(
  value: unknown,
  checkpoint: AgentOrchestrationCheckpointCopy,
): value is AgentOrchestrationCheckpointReceipt {
  if (
    !isKnownAgentOrchestrationCheckpointContract(checkpoint)
    || !isExactCheckpointReceiptRecord(value)
  ) return false;
  const selectedOptionId = value.selectedOptionId;
  return value.checkpointId === checkpoint.checkpointId
    && value.contentVersion === checkpoint.contentVersion
    && typeof selectedOptionId === "string"
    && checkpoint.options.some((option) => option.id === selectedOptionId)
    && value.passed === (selectedOptionId === checkpoint.correctOptionId);
}

export function readAgentOrchestrationCheckpointReceipt(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  checkpoint: AgentOrchestrationCheckpointCopy,
): AgentOrchestrationCheckpointReceipt | null {
  if (!isCheckpointContractForModule(checkpoint, slug)) return null;
  const value = progress[agentOrchestrationCheckpointKey(slug)];
  return isAgentOrchestrationCheckpointReceipt(value, checkpoint)
    ? value
    : null;
}

function isKnownPassedAgentOrchestrationCheckpointReceipt(
  value: unknown,
  slug: AgentOrchestrationModuleSlug,
): value is AgentOrchestrationCheckpointReceipt {
  if (!isExactCheckpointReceiptRecord(value) || value.passed !== true) {
    return false;
  }
  return AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS[slug].some(
    (contract) => value.checkpointId === contract.checkpointId
      && value.contentVersion === contract.contentVersion
      && value.selectedOptionId === contract.correctOptionId,
  );
}

export function saveAgentOrchestrationCheckpointReceipt(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  checkpoint: AgentOrchestrationCheckpointCopy,
  selectedOptionId: string,
): AgentOrchestrationCheckpointReceipt | null {
  const key = agentOrchestrationCheckpointKey(slug);
  const receipt = isCheckpointContractForModule(checkpoint, slug)
    ? createAgentOrchestrationCheckpointReceipt(checkpoint, selectedOptionId)
    : null;
  delete progress[agentOrchestrationCheckpointPassedKey(slug)];
  if (!receipt) {
    delete progress[key];
    progress[agentOrchestrationModuleProgressKey(slug)] = false;
    return null;
  }
  progress[key] = receipt;
  reconcileAgentOrchestrationModuleCompletion(progress, slug, checkpoint);
  return receipt;
}

export function agentOrchestrationArtifactKey(
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.artifact`;
}

export function agentOrchestrationArtifactEvidenceKey(
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.artifact.evidence`;
}

export function agentOrchestrationArtifactPendingDraftKey(
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.artifact.pending-draft`;
}

export const AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA = 32;
export const AGENT_ORCHESTRATION_MIN_ARTIFACT_DELTA_TOKENS = 10;
export const AGENT_ORCHESTRATION_MIN_ARTIFACT_UNIQUE_DELTA_TOKENS = 8;
export const AGENT_ORCHESTRATION_MAX_ARTIFACT_DRAFT_LENGTH = 100_000;

function semanticArtifactCharacters(value: string): string[] {
  return Array.from(
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .replace(/[^\p{L}\p{N}]+/gu, ""),
  );
}

function semanticEditDistanceAtLeast(
  left: readonly string[],
  right: readonly string[],
  threshold: number,
): boolean {
  if (threshold <= 0) return true;
  if (Math.abs(left.length - right.length) >= threshold) return true;

  // Only distances below `threshold` can return false. Restrict each row to
  // that diagonal band and cap every other cell at the threshold, making the
  // comparison O((left + right) * threshold) rather than O(left * right).
  const band = threshold - 1;
  let previous = new Uint16Array(right.length + 1);
  let current = new Uint16Array(right.length + 1);
  previous.fill(threshold);
  current.fill(threshold);
  for (let index = 0; index <= Math.min(right.length, band); index += 1) {
    previous[index] = index;
  }

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const start = Math.max(1, leftIndex - band);
    const end = Math.min(right.length, leftIndex + band);
    if (start === 1) current[0] = Math.min(leftIndex, threshold);
    else current[start - 1] = threshold;

    for (let rightIndex = start; rightIndex <= end; rightIndex += 1) {
      current[rightIndex] = Math.min(
        threshold,
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1]
          + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    if (end < right.length) current[end + 1] = threshold;
    [previous, current] = [current, previous];
  }

  return previous[right.length] >= threshold;
}

function semanticArtifactTokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}]{2,}/gu)
    ?? [];
}

/**
 * Return only the token multiset added by the learner. Deleting the starter
 * down to a tiny value must not turn the template's removed vocabulary into
 * positive evidence.
 */
function semanticArtifactAddedTokens(starterTemplate: string, draft: string): string[] {
  const counts = new Map<string, number>();
  for (const token of semanticArtifactTokens(starterTemplate)) {
    counts.set(token, (counts.get(token) ?? 0) - 1);
  }
  for (const token of semanticArtifactTokens(draft)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const delta: string[] = [];
  for (const [token, count] of counts) {
    for (let index = 0; index < Math.max(0, count); index += 1) delta.push(token);
  }
  return delta;
}

const AGENT_ORCHESTRATION_ARTIFACT_DOMAIN_TOKENS = new Set([
  "accountable", "agent", "approval", "artifact", "audit", "authority",
  "baseline", "boundary", "budget", "cancel", "canary", "checkpoint",
  "completion", "compensation", "concurrency", "context", "contract",
  "control", "cost", "deadline", "decision", "delegation", "evidence",
  "evaluation", "failure", "guardrail", "handoff", "idempotency", "input",
  "join", "latency", "memory", "metric", "monitor", "non-goal", "operation",
  "output", "owner", "permission", "policy", "queue", "recovery", "release",
  "retry", "review", "risk", "rollback", "route", "routing", "sandbox",
  "schema", "security", "session", "state", "stop", "tool", "trace",
  "trigger", "verification", "verifier", "version", "worker", "workflow",
]);

const AGENT_ORCHESTRATION_ARTIFACT_DOMAIN_PHRASES = [
  "智能体", "工作流", "任务图", "契约", "控制", "状态", "所有者", "负责人",
  "权限", "审批", "证据", "验证", "评估", "追踪", "审计", "监控", "风险",
  "失败", "恢复", "重试", "幂等", "补偿", "回滚", "预算", "截止", "停止",
  "并发", "队列", "路由", "委派", "交接", "工具", "上下文", "记忆", "会话",
  "模式", "安全", "隔离", "版本", "发布", "成本", "延迟", "基线", "结果",
] as const;

function normalizedArtifactHeadings(value: string): string[] {
  return value
    .normalize("NFKC")
    .split(/\r?\n/u)
    .map((line) => line.trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US"))
    .filter((line) => /^#{1,6}\s+\S/u.test(line));
}

function retainsArtifactStructure(draft: string, starterTemplate: string): boolean {
  const requiredHeadings = normalizedArtifactHeadings(starterTemplate);
  const draftHeadings = new Set(normalizedArtifactHeadings(draft));
  if (
    requiredHeadings.length === 0
    || !requiredHeadings.every((heading) => draftHeadings.has(heading))
  ) return false;

  const draftByHeading = new Map(
    artifactSections(draft).map((section) => [section.heading, section.lines]),
  );
  for (const starterSection of artifactSections(starterTemplate)) {
    const draftLines = draftByHeading.get(starterSection.heading);
    if (!draftLines) return false;
    const normalizedStarterLines = starterSection.lines.map(
      (line) => line.normalize("NFKC").trim(),
    );
    const normalizedDraftLines = draftLines.map(
      (line) => line.normalize("NFKC").trim(),
    );
    const draftLineSet = new Set(normalizedDraftLines);
    const starterTableRows = normalizedStarterLines.filter(isMarkdownTableRow);
    const draftTableRows = normalizedDraftLines.filter(isMarkdownTableRow);
    if (draftTableRows.length < starterTableRows.length) return false;

    for (let index = 0; index < normalizedStarterLines.length; index += 1) {
      const line = normalizedStarterLines[index];
      if (isMarkdownTableSeparator(line)) {
        const header = normalizedStarterLines[index - 1] ?? "";
        if (!draftLineSet.has(line) || !draftLineSet.has(header)) return false;
      }
      const fieldPrefix = line.match(/^(?:[-*]|\d+\.)\s+.*?[:：]/u)?.[0];
      if (
        fieldPrefix
        && !normalizedDraftLines.some((candidate) => candidate.startsWith(fieldPrefix))
      ) return false;
      const numberedPlaceholder = line.match(/^(\d+\.)\s*$/u)?.[1];
      if (
        numberedPlaceholder
        && !normalizedDraftLines.some((candidate) => candidate.startsWith(numberedPlaceholder))
      ) return false;
    }

    const starterFenceCount = normalizedStarterLines.filter(
      (line) => line.startsWith("```"),
    ).length;
    const draftFenceCount = normalizedDraftLines.filter(
      (line) => line.startsWith("```"),
    ).length;
    if (draftFenceCount < starterFenceCount) return false;

    const starterText = starterSection.lines.join("\n");
    const draftText = draftLines.join("\n");
    for (const match of starterText.matchAll(/"([^"]+)"\s*:/gu)) {
      if (!new RegExp(`"${escapeRegExp(match[1])}"\\s*:`, "u").test(draftText)) {
        return false;
      }
    }

    const requiredFirstCells = starterTableRows
      .filter((line) => !isMarkdownTableSeparator(line))
      .map(markdownTableCells)
      .map((cells) => cells[0]?.trim() ?? "")
      .filter(Boolean);
    const draftFirstCells = new Set(
      draftTableRows.map(markdownTableCells).map((cells) => cells[0]?.trim() ?? ""),
    );
    if (requiredFirstCells.some((cell) => !draftFirstCells.has(cell))) return false;
  }
  return true;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function isMarkdownTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function markdownTableCells(line: string): string[] {
  return line.trim().slice(1, -1).split("|").map((cell) => cell.trim());
}

function isMarkdownTableSeparator(line: string): boolean {
  if (!isMarkdownTableRow(line)) return false;
  const cells = markdownTableCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

function phraseCount(value: string, phrase: string): number {
  return value.split(phrase).length - 1;
}

function artifactDomainSignalCount(
  starterTemplate: string,
  draft: string,
  deltaTokens: readonly string[],
): number {
  const signals = new Set(
    deltaTokens.filter((token) => AGENT_ORCHESTRATION_ARTIFACT_DOMAIN_TOKENS.has(token)),
  );
  const normalizedStarter = starterTemplate.normalize("NFKC").toLocaleLowerCase("en-US");
  const normalizedDraft = draft.normalize("NFKC").toLocaleLowerCase("en-US");
  for (const phrase of AGENT_ORCHESTRATION_ARTIFACT_DOMAIN_PHRASES) {
    if (phraseCount(normalizedDraft, phrase) > phraseCount(normalizedStarter, phrase)) {
      signals.add(phrase);
    }
  }
  return signals.size;
}

interface ArtifactSection {
  readonly heading: string;
  readonly lines: readonly string[];
}

function artifactSections(value: string): ArtifactSection[] {
  const sections: Array<{ heading: string; lines: string[] }> = [];
  let current: { heading: string; lines: string[] } | null = null;
  for (const rawLine of value.normalize("NFKC").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (/^#{2,6}\s+\S/u.test(line)) {
      current = {
        heading: line.replace(/\s+/gu, " ").toLocaleLowerCase("en-US"),
        lines: [],
      };
      sections.push(current);
    } else if (current) {
      current.lines.push(rawLine);
    }
  }
  return sections;
}

function isStructuredArtifactLine(line: string): boolean {
  if (semanticArtifactCharacters(line).length < 12) return false;
  const fieldOrTable = /[:：|]/u.test(line);
  const proseSignal = /[.!?。！？；;]/u.test(line)
    || /\b(?:after|against|because|before|defines|if|records|requires|therefore|when|while)\b/iu.test(line)
    || /(?:之后|之前|依据|因为|因此|如果|定义|必须|记录|需要|用于)/u.test(line);
  return fieldOrTable || proseSignal;
}

/** Require substantive changes inside the starter's sections, not one pasted tail. */
function hasDistributedArtifactEvidence(
  draft: string,
  starterTemplate: string,
): boolean {
  const starterSections = artifactSections(starterTemplate);
  const draftByHeading = new Map(
    artifactSections(draft).map((section) => [section.heading, section]),
  );
  let substantiveSections = 0;
  let structuredLines = 0;
  for (const starterSection of starterSections) {
    const draftSection = draftByHeading.get(starterSection.heading);
    if (!draftSection) continue;
    const starterLines = new Set(starterSection.lines.map((line) => line.trim()));
    const changedStructuredLines = draftSection.lines.filter(
      (line) => !starterLines.has(line.trim()) && isStructuredArtifactLine(line),
    );
    const sectionDelta = semanticArtifactAddedTokens(
      starterSection.lines.join("\n"),
      draftSection.lines.join("\n"),
    );
    if (
      changedStructuredLines.length > 0
      && sectionDelta.length >= 3
      && new Set(sectionDelta).size >= 3
      && semanticArtifactCharacters(sectionDelta.join(" ")).length >= 12
    ) {
      substantiveSections += 1;
      structuredLines += changedStructuredLines.length;
    }
  }
  const requiredSections = Math.min(3, starterSections.length);
  return requiredSections >= 2
    && substantiveSections >= requiredSections
    && structuredLines >= 3;
}

/**
 * Fail closed on obvious placeholders. A valid local receipt needs both a
 * bounded character-distance threshold and a diverse token delta. This is a
 * minimum evidence gate, not a claim that the browser can judge artifact
 * quality or verify an external file.
 */
export function isMeaningfulAgentOrchestrationArtifact(
  draft: unknown,
  starterTemplate: unknown,
): boolean {
  if (typeof draft !== "string" || typeof starterTemplate !== "string") {
    return false;
  }
  if (draft.length > AGENT_ORCHESTRATION_MAX_ARTIFACT_DRAFT_LENGTH) return false;
  if (!retainsArtifactStructure(draft, starterTemplate)) return false;
  if (!hasDistributedArtifactEvidence(draft, starterTemplate)) return false;
  const normalizedDraft = semanticArtifactCharacters(draft);
  if (normalizedDraft.length < 64) return false;
  if (!semanticEditDistanceAtLeast(
    semanticArtifactCharacters(starterTemplate),
    normalizedDraft,
    AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA,
  )) return false;

  const deltaTokens = semanticArtifactAddedTokens(starterTemplate, draft);
  if (deltaTokens.length < AGENT_ORCHESTRATION_MIN_ARTIFACT_DELTA_TOKENS) {
    return false;
  }
  if (
    new Set(deltaTokens).size
    < AGENT_ORCHESTRATION_MIN_ARTIFACT_UNIQUE_DELTA_TOKENS
  ) return false;
  if (artifactDomainSignalCount(starterTemplate, draft, deltaTokens) < 3) {
    return false;
  }
  const deltaCharacters = Array.from(deltaTokens.join(""));
  return new Set(deltaCharacters).size >= 8;
}

export interface AgentOrchestrationArtifactEvidence {
  readonly saved: true;
  readonly moduleSlug: AgentOrchestrationModuleSlug;
  readonly starterTemplate: string;
}

export function createAgentOrchestrationArtifactEvidence(
  slug: AgentOrchestrationModuleSlug,
  starterTemplate: string,
): AgentOrchestrationArtifactEvidence {
  return {
    saved: true,
    moduleSlug: slug,
    starterTemplate,
  };
}

/** Persist one valid draft and its exact starter baseline as a single update. */
export function saveAgentOrchestrationArtifactDraft(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  draft: string,
  starterTemplate: string,
): boolean {
  if (!isMeaningfulAgentOrchestrationArtifact(draft, starterTemplate)) {
    delete progress[agentOrchestrationArtifactEvidenceKey(slug)];
    reconcileAgentOrchestrationCourseModuleCompletion(progress, slug);
    return false;
  }
  progress[agentOrchestrationArtifactKey(slug)] = draft;
  progress[agentOrchestrationArtifactEvidenceKey(slug)] =
    createAgentOrchestrationArtifactEvidence(slug, starterTemplate);
  delete progress[agentOrchestrationArtifactPendingDraftKey(slug)];
  reconcileAgentOrchestrationCourseModuleCompletion(progress, slug);
  return true;
}

/**
 * Persist recoverable working text separately from the evidence receipt.
 * Pending drafts survive navigation but never satisfy module completion.
 */
export function saveAgentOrchestrationPendingArtifactDraft(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  draft: string,
): void {
  progress[agentOrchestrationArtifactPendingDraftKey(slug)] = draft.slice(
    0,
    AGENT_ORCHESTRATION_MAX_ARTIFACT_DRAFT_LENGTH,
  );
  invalidateAgentOrchestrationArtifactEvidence(progress, slug);
}

/** Any unsaved edit invalidates the evidence receipt until the draft is saved. */
export function invalidateAgentOrchestrationArtifactEvidence(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
): void {
  delete progress[agentOrchestrationArtifactEvidenceKey(slug)];
  reconcileAgentOrchestrationCourseModuleCompletion(progress, slug);
}

export function isCurrentAgentOrchestrationProgress(
  progress: Record<string, unknown>,
): boolean {
  return progress[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]
    === AGENT_ORCHESTRATION_PROGRESS_VERSION;
}

/**
 * Drop only stale Course 15 fields while preserving every other course that
 * shares `ae.progress`. Widgets always consume this normalized record, so an
 * old schema can never look complete in one surface and empty in another.
 */
export function normalizeAgentOrchestrationProgress(
  progress: Record<string, unknown>,
): Record<string, unknown> {
  return migrateAgentOrchestrationProgressRecord(progress).record;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSavedArtifactEvidence(
  value: unknown,
  slug: AgentOrchestrationModuleSlug,
  draft: unknown,
): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const canonicalTemplates: readonly string[] = Object.values(
    AGENT_ORCHESTRATION_PRACTICE_TEMPLATES[slug],
  );
  return record.saved === true
    && record.moduleSlug === slug
    && typeof record.starterTemplate === "string"
    && canonicalTemplates.includes(record.starterTemplate)
    && isMeaningfulAgentOrchestrationArtifact(draft, record.starterTemplate);
}

export interface AgentOrchestrationModuleRequirements {
  readonly artifact: boolean;
  readonly lab: boolean;
  readonly checkpoint: boolean;
  readonly ready: boolean;
}

function agentOrchestrationModuleRequirementsForCheckpoint(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  checkpointCopy: AgentOrchestrationCheckpointCopy | null,
): AgentOrchestrationModuleRequirements {
  if (!isCurrentAgentOrchestrationProgress(progress)) {
    return { artifact: false, lab: false, checkpoint: false, ready: false };
  }
  const labId = AGENT_ORCHESTRATION_LAB_ID_BY_MODULE[slug];
  const storedArtifact = progress[agentOrchestrationArtifactKey(slug)];
  const artifact = isNonEmptyString(storedArtifact)
    && isSavedArtifactEvidence(
      progress[agentOrchestrationArtifactEvidenceKey(slug)],
      slug,
      storedArtifact,
    );
  const lab = isSavedAgentOrchestrationLabReceipt(
    progress[agentOrchestrationLabKey(labId, slug)],
    slug,
    labId,
  );
  const checkpoint = checkpointCopy
    ? readAgentOrchestrationCheckpointReceipt(
      progress,
      slug,
      checkpointCopy,
    )?.passed === true
    : isKnownPassedAgentOrchestrationCheckpointReceipt(
      progress[agentOrchestrationCheckpointKey(slug)],
      slug,
    );
  return {
    artifact,
    lab,
    checkpoint,
    ready: artifact && lab && checkpoint,
  };
}

/**
 * Strict active-module requirements. The displayed checkpoint is required so
 * a receipt from another native locale or content version cannot inherit.
 */
export function agentOrchestrationModuleRequirements(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  checkpoint: AgentOrchestrationCheckpointCopy,
): AgentOrchestrationModuleRequirements {
  return agentOrchestrationModuleRequirementsForCheckpoint(
    progress,
    slug,
    checkpoint,
  );
}

export function isAgentOrchestrationModuleComplete(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  checkpoint: AgentOrchestrationCheckpointCopy,
): boolean {
  return progress[agentOrchestrationModuleProgressKey(slug)] === true
    && agentOrchestrationModuleRequirements(progress, slug, checkpoint).ready;
}

/**
 * Locale-neutral catalogue adapter. It accepts only one of the compact,
 * checker-pinned current EN/zh-Hans answer contracts. Active module UI must
 * call `isAgentOrchestrationModuleComplete` with its displayed checkpoint.
 */
export function isAgentOrchestrationCourseModuleComplete(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
): boolean {
  return progress[agentOrchestrationModuleProgressKey(slug)] === true
    && agentOrchestrationModuleRequirementsForCheckpoint(
      progress,
      slug,
      null,
    ).ready;
}

export function reconcileAgentOrchestrationModuleCompletion(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  checkpoint: AgentOrchestrationCheckpointCopy,
): void {
  if (!agentOrchestrationModuleRequirements(progress, slug, checkpoint).ready) {
    progress[agentOrchestrationModuleProgressKey(slug)] = false;
  }
}

function reconcileAgentOrchestrationCourseModuleCompletion(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
): void {
  if (!agentOrchestrationModuleRequirementsForCheckpoint(
    progress,
    slug,
    null,
  ).ready) {
    progress[agentOrchestrationModuleProgressKey(slug)] = false;
  }
}

export function agentOrchestrationProgressPercent(
  progress: Record<string, unknown>,
): number {
  if (!isCurrentAgentOrchestrationProgress(progress)) return 0;
  const modules = AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS.filter(
    (slug) => isAgentOrchestrationCourseModuleComplete(progress, slug),
  ).length;
  const quiz = isAgentOrchestrationQuizPassed(progress) ? 1 : 0;
  const capstone = isAgentOrchestrationCapstoneComplete(progress) ? 1 : 0;
  return Math.round(
    ((modules + quiz + capstone) / AGENT_ORCHESTRATION_PROGRESS_MILESTONES) * 100,
  );
}
