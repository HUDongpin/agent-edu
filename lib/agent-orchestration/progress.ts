import {
  AGENT_ORCHESTRATION_PROGRESS_EVENT as TOPOLOGY_PROGRESS_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
  AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT as TOPOLOGY_PROGRESS_RESET_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
} from "../progress-topology";
import {
  AGENT_ORCHESTRATION_LAB_ID_BY_MODULE,
  AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
  AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION,
  agentOrchestrationLabDecisionsEqual,
  evaluateAgentOrchestrationLab,
  isAgentOrchestrationLabPair,
  isAgentOrchestrationLabStateCompletable,
  normalizeAgentOrchestrationLabState,
} from "./lab-model";
import { AGENT_ORCHESTRATION_PRACTICE_TEMPLATES } from "./practice-templates";
import type {
  AgentOrchestrationLabDecision,
  AgentOrchestrationLabState,
} from "./lab-model";
import type {
  AgentOrchestrationLabId,
  AgentOrchestrationModuleSlug,
} from "./types";

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
export const AGENT_ORCHESTRATION_QUIZ_BEST_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey;
export const AGENT_ORCHESTRATION_QUIZ_PASSED_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey;
export const AGENT_ORCHESTRATION_CAPSTONE_KEY =
  "agent-orchestration.capstone.v2";
export const AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneEvidenceKey;
export const AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassPercent;
export const AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneArtifactCount;
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

export function agentOrchestrationCheckpointPassedKey(
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.checkpoint.passed`;
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
export const AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH = 2_048;
export const AGENT_ORCHESTRATION_MAX_LAB_EVIDENCE_LENGTH = 5_000;
export const AGENT_ORCHESTRATION_MIN_LAB_EVIDENCE_CHARACTERS = 40;

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
    reconcileAgentOrchestrationModuleCompletion(progress, slug);
    return false;
  }
  progress[agentOrchestrationArtifactKey(slug)] = draft;
  progress[agentOrchestrationArtifactEvidenceKey(slug)] =
    createAgentOrchestrationArtifactEvidence(slug, starterTemplate);
  delete progress[agentOrchestrationArtifactPendingDraftKey(slug)];
  reconcileAgentOrchestrationModuleCompletion(progress, slug);
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
  reconcileAgentOrchestrationModuleCompletion(progress, slug);
}

export function agentOrchestrationLabKey(
  labId: string,
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.lab.${labId}`;
}

export function agentOrchestrationLabPendingKey(
  labId: string,
  slug: AgentOrchestrationModuleSlug,
): string {
  return `agent-orchestration.module.${slug}.lab.${labId}.pending`;
}

export function normalizeAgentOrchestrationLearnerEvidence(
  value: unknown,
): string {
  return typeof value === "string"
    ? value
      .normalize("NFKC")
      .replace(/\p{Cf}/gu, "")
      .trim()
      .replace(/\s+/gu, " ")
    : "";
}

export function isMeaningfulAgentOrchestrationLearnerEvidence(
  value: unknown,
): boolean {
  const normalized = normalizeAgentOrchestrationLearnerEvidence(value);
  if (
    normalized.length === 0
    || normalized.length > AGENT_ORCHESTRATION_MAX_LAB_EVIDENCE_LENGTH
  ) return false;
  const characters = semanticArtifactCharacters(normalized);
  const tokens = semanticArtifactTokens(normalized);
  const reasoningConnectors = /\b(?:because|but|if|therefore|when|while)\b/iu.test(normalized)
    || /(?:但是|当|而且|因为|因此|如果|仍然|所以)/u.test(normalized);
  const sentenceMarks = normalized.match(/[.!?;。！？；]/gu)?.length ?? 0;
  const hasReasoningStructure = reasoningConnectors || sentenceMarks >= 2;
  return characters.length >= AGENT_ORCHESTRATION_MIN_LAB_EVIDENCE_CHARACTERS
    && tokens.length >= 8
    && new Set(tokens).size >= 6
    && new Set(characters).size >= 10
    && hasReasoningStructure
    && !/(?:^|[^\p{L}\p{N}])(?:todo|tbd|dummy|fixture|sample|example|placeholder)(?:$|[^\p{L}\p{N}])/iu.test(normalized);
}

export interface AgentOrchestrationLabReceipt {
  readonly saved: true;
  readonly schemaVersion: typeof AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION;
  readonly scenarioVersion: typeof AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION;
  readonly moduleSlug: AgentOrchestrationModuleSlug;
  readonly labId: AgentOrchestrationLabId;
  readonly state: AgentOrchestrationLabState;
  readonly decision: AgentOrchestrationLabDecision;
  readonly learnerEvidence: string;
}

export function createAgentOrchestrationLabReceipt(
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
  state: unknown,
  learnerEvidence: unknown,
): AgentOrchestrationLabReceipt | null {
  const normalizedState = normalizeAgentOrchestrationLabState(state);
  const normalizedEvidence = normalizeAgentOrchestrationLearnerEvidence(
    learnerEvidence,
  );
  if (
    !isAgentOrchestrationLabStateCompletable(slug, labId, normalizedState)
    || !isMeaningfulAgentOrchestrationLearnerEvidence(normalizedEvidence)
  ) return null;
  return {
    saved: true,
    schemaVersion: AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
    scenarioVersion: AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION,
    moduleSlug: slug,
    labId,
    state: normalizedState,
    decision: evaluateAgentOrchestrationLab(slug, labId, normalizedState),
    learnerEvidence: normalizedEvidence,
  };
}

export function saveAgentOrchestrationLabReceipt(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
  state: unknown,
  learnerEvidence: unknown,
): boolean {
  const key = agentOrchestrationLabKey(labId, slug);
  const receipt = createAgentOrchestrationLabReceipt(
    slug,
    labId,
    state,
    learnerEvidence,
  );
  if (!receipt) {
    delete progress[key];
    reconcileAgentOrchestrationModuleCompletion(progress, slug);
    return false;
  }
  progress[key] = receipt;
  delete progress[agentOrchestrationLabPendingKey(labId, slug)];
  reconcileAgentOrchestrationModuleCompletion(progress, slug);
  return true;
}

export function saveAgentOrchestrationPendingLabWork(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
  state: unknown,
  learnerEvidence: unknown,
): void {
  if (!isAgentOrchestrationLabPair(slug, labId)) return;
  progress[agentOrchestrationLabPendingKey(labId, slug)] = {
    schemaVersion: AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
    scenarioVersion: AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION,
    moduleSlug: slug,
    labId,
    state: normalizeAgentOrchestrationLabState(state),
    learnerEvidence: typeof learnerEvidence === "string"
      ? learnerEvidence.slice(0, AGENT_ORCHESTRATION_MAX_LAB_EVIDENCE_LENGTH)
      : "",
  };
  delete progress[agentOrchestrationLabKey(labId, slug)];
  reconcileAgentOrchestrationModuleCompletion(progress, slug);
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
  if (isCurrentAgentOrchestrationProgress(progress)) return { ...progress };
  const normalized = { ...progress };
  for (const key of Object.keys(normalized)) {
    if (key.startsWith(AGENT_ORCHESTRATION_PROGRESS_PREFIX)) {
      delete normalized[key];
    }
  }
  normalized[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY] =
    AGENT_ORCHESTRATION_PROGRESS_VERSION;
  return normalized;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSavedLabRecord(
  value: unknown,
  slug: AgentOrchestrationModuleSlug,
  labId: string,
): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const expectedReceiptKeys = [
    "decision",
    "labId",
    "learnerEvidence",
    "moduleSlug",
    "saved",
    "scenarioVersion",
    "schemaVersion",
    "state",
  ];
  if (
    Object.keys(record).sort().some(
      (key, index) => key !== expectedReceiptKeys[index],
    )
    || Object.keys(record).length !== expectedReceiptKeys.length
  ) return false;
  if (
    record.saved !== true
    || record.schemaVersion !== AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION
    || record.scenarioVersion !== AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION
    || record.moduleSlug !== slug
    || record.labId !== labId
    || !isAgentOrchestrationLabPair(slug, labId)
    || !isAgentOrchestrationLabStateCompletable(
      slug,
      labId as AgentOrchestrationLabId,
      record.state,
    )
    || !isMeaningfulAgentOrchestrationLearnerEvidence(record.learnerEvidence)
    || !record.decision
    || typeof record.decision !== "object"
    || Array.isArray(record.decision)
  ) return false;
  const recalculated = evaluateAgentOrchestrationLab(
    slug,
    labId as AgentOrchestrationLabId,
    record.state as AgentOrchestrationLabState,
  );
  const storedDecision = record.decision as Record<string, unknown>;
  const recalculatedKeys = Object.keys(recalculated).sort();
  const storedDecisionKeys = Object.keys(storedDecision).sort();
  if (
    recalculatedKeys.length !== storedDecisionKeys.length
    || recalculatedKeys.some(
      (key, index) => key !== storedDecisionKeys[index],
    )
  ) return false;
  return agentOrchestrationLabDecisionsEqual(
    recalculated,
    record.decision,
  );
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

export function agentOrchestrationModuleRequirements(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
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
  const lab = isSavedLabRecord(
    progress[agentOrchestrationLabKey(labId, slug)],
    slug,
    labId,
  );
  const checkpoint = progress[agentOrchestrationCheckpointPassedKey(slug)] === true;
  return {
    artifact,
    lab,
    checkpoint,
    ready: artifact && lab && checkpoint,
  };
}

export function isAgentOrchestrationModuleComplete(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
): boolean {
  return progress[agentOrchestrationModuleProgressKey(slug)] === true
    && agentOrchestrationModuleRequirements(progress, slug).ready;
}

export function reconcileAgentOrchestrationModuleCompletion(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
): void {
  if (!agentOrchestrationModuleRequirements(progress, slug).ready) {
    progress[agentOrchestrationModuleProgressKey(slug)] = false;
  }
}

function validScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}

export function recordAgentOrchestrationQuizAttempt(
  progress: Record<string, unknown>,
  score: number,
  passPercent: number,
): void {
  const nextBest = Math.max(
    validScore(progress[AGENT_ORCHESTRATION_QUIZ_BEST_KEY]),
    validScore(score),
  );
  progress[AGENT_ORCHESTRATION_QUIZ_BEST_KEY] = nextBest;
  progress[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY] =
    progress[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY] === true
    || nextBest >= passPercent;
}

export function isAgentOrchestrationQuizPassed(
  progress: Record<string, unknown>,
): boolean {
  return progress[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY] === true
    && validScore(progress[AGENT_ORCHESTRATION_QUIZ_BEST_KEY])
      >= AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT;
}

export function agentOrchestrationCapstoneEvidence(
  progress: Record<string, unknown>,
  artifactCount: number = AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
): string[] {
  const stored = progress[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY];
  if (!Array.isArray(stored) || stored.length !== artifactCount) {
    return Array.from({ length: artifactCount }, () => "");
  }
  return stored.map((value) => typeof value === "string" ? value : "");
}

export function normalizeAgentOrchestrationEvidenceReference(
  value: unknown,
): string {
  return typeof value === "string"
    ? value
      .normalize("NFKC")
      .replace(/\p{Cf}/gu, "")
      .trim()
      .replace(/\s+/gu, " ")
    : "";
}

const AGENT_ORCHESTRATION_PLACEHOLDER_REFERENCE = /^(?:(?:todo|tbd|dummy|sample|example|placeholder)[-_ ]*)*(?:evidence|artifact|file|trace|review|record|item|output|todo|tbd|dummy|sample|example|placeholder)(?:[-_ ]*(?:todo|tbd|dummy|sample|example|placeholder))*[-_ ]*\d*$/iu;
const AGENT_ORCHESTRATION_PLACEHOLDER_TOKEN = /(?:^|[^\p{L}\p{N}])(?:todo|tbd|dummy|fixture|sample|example|placeholder)(?:$|[^\p{L}\p{N}])/iu;

/** Collapse cosmetic fragments before comparing references for uniqueness. */
export function canonicalAgentOrchestrationEvidenceIdentity(
  value: unknown,
): string {
  const normalized = normalizeAgentOrchestrationEvidenceReference(value);
  if (normalized.length > AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH) {
    return "";
  }
  return normalized
    .replace(/#.*$/u, "")
    .replace(/[/?&](?:copy|duplicate|dup)=\d+$/iu, "")
    .replace(/\/+$/u, "")
    .toLocaleLowerCase("en-US");
}

/**
 * Reject values that cannot plausibly identify an evidence object. The client
 * still cannot prove that a file, URL, trace, ticket, or review record exists;
 * external review remains part of the capstone contract.
 */
export function isMeaningfulAgentOrchestrationEvidenceReference(
  value: unknown,
): boolean {
  const normalized = normalizeAgentOrchestrationEvidenceReference(value);
  if (normalized.length > AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH) {
    return false;
  }
  if (
    /^[a-z][a-z\d+.-]*:\/\//iu.test(normalized)
    && !/^(?:https|trace|review|ticket|file|artifact):\/\//iu.test(normalized)
  ) return false;
  const semantic = Array.from(normalized.replace(/[^\p{L}\p{N}]+/gu, ""));
  if (semantic.length < 8) return false;
  if (new Set(semantic.map((character) => character.toLocaleLowerCase("en-US"))).size < 4) {
    return false;
  }
  const tokens = semanticArtifactTokens(normalized);
  if (tokens.length === 0) return false;
  if (tokens.length > 1 && new Set(tokens).size === 1) return false;
  if (AGENT_ORCHESTRATION_PLACEHOLDER_REFERENCE.test(normalized)) return false;
  if (AGENT_ORCHESTRATION_PLACEHOLDER_TOKEN.test(normalized)) return false;

  const hasReferenceShape = /^(?:https:\/\/|(?:trace|review|ticket|file|artifact):\/\/)/iu.test(normalized)
    || /(?:^|[/\\])[^/\\]+\.[\p{L}\p{N}]{1,8}(?:$|[?#])/iu.test(normalized)
    || /^(?:trace|run|review|ticket|commit|report)[_:-][\p{L}\p{N}][\p{L}\p{N}._:/-]{7,}$/iu.test(normalized)
    || (/\b(?:trace|review|ticket|run|commit|report|record)\b/iu.test(normalized)
      && semantic.length >= 16);
  const descriptiveReference = tokens.length >= 5 && semantic.length >= 24;
  return hasReferenceShape || descriptiveReference;
}

export interface AgentOrchestrationCapstoneEvidenceValidation {
  readonly normalized: readonly string[];
  readonly identities: readonly string[];
  readonly valid: readonly boolean[];
  readonly complete: boolean;
}

export function validateAgentOrchestrationCapstoneEvidence(
  evidence: readonly unknown[],
  artifactCount: number = AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
): AgentOrchestrationCapstoneEvidenceValidation {
  if (evidence.length !== artifactCount) {
    return {
      normalized: Array.from({ length: artifactCount }, () => ""),
      identities: Array.from({ length: artifactCount }, () => ""),
      valid: Array.from({ length: artifactCount }, () => false),
      complete: false,
    };
  }
  const normalized = evidence.map(normalizeAgentOrchestrationEvidenceReference);
  const identities = normalized.map(canonicalAgentOrchestrationEvidenceIdentity);
  const counts = identities.reduce((result, identity) => {
    if (identity) result.set(identity, (result.get(identity) ?? 0) + 1);
    return result;
  }, new Map<string, number>());
  const valid = normalized.map((value, index) =>
    isMeaningfulAgentOrchestrationEvidenceReference(value)
      && counts.get(identities[index]) === 1,
  );
  return {
    normalized,
    identities,
    valid,
    complete: valid.every(Boolean),
  };
}

export function isAgentOrchestrationCapstoneComplete(
  progress: Record<string, unknown>,
  artifactCount: number = AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
): boolean {
  return validateAgentOrchestrationCapstoneEvidence(
    agentOrchestrationCapstoneEvidence(progress, artifactCount),
    artifactCount,
  ).complete;
}

export function agentOrchestrationProgressPercent(
  progress: Record<string, unknown>,
): number {
  if (!isCurrentAgentOrchestrationProgress(progress)) return 0;
  const modules = AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS.filter(
    (slug) => isAgentOrchestrationModuleComplete(progress, slug),
  ).length;
  const quiz = isAgentOrchestrationQuizPassed(progress) ? 1 : 0;
  const capstone = isAgentOrchestrationCapstoneComplete(progress) ? 1 : 0;
  return Math.round(
    ((modules + quiz + capstone) / AGENT_ORCHESTRATION_PROGRESS_MILESTONES) * 100,
  );
}
