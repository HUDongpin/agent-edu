import { agentOrchestrationProgressModuleKey } from "../progress-topology";
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
import type {
  AgentOrchestrationLabDecision,
  AgentOrchestrationLabState,
} from "./lab-model";
import type {
  AgentOrchestrationLabId,
  AgentOrchestrationModuleSlug,
} from "./types";

export const AGENT_ORCHESTRATION_MAX_LAB_EVIDENCE_LENGTH = 5_000;
export const AGENT_ORCHESTRATION_MIN_LAB_EVIDENCE_CHARACTERS = 40;

function semanticEvidenceCharacters(value: string): string[] {
  return Array.from(
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .replace(/[^\p{L}\p{N}]+/gu, ""),
  );
}

function semanticEvidenceTokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}]{2,}/gu)
    ?? [];
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
  const characters = semanticEvidenceCharacters(normalized);
  const tokens = semanticEvidenceTokens(normalized);
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

export function isSavedAgentOrchestrationLabReceipt(
  value: unknown,
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
): value is AgentOrchestrationLabReceipt {
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
  const receiptKeys = Object.keys(record).sort();
  if (
    receiptKeys.length !== expectedReceiptKeys.length
    || receiptKeys.some((key, index) => key !== expectedReceiptKeys[index])
    || record.saved !== true
    || record.schemaVersion !== AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION
    || record.scenarioVersion !== AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION
    || record.moduleSlug !== slug
    || record.labId !== labId
    || !isAgentOrchestrationLabPair(slug, labId)
    || !isAgentOrchestrationLabStateCompletable(slug, labId, record.state)
    || !isMeaningfulAgentOrchestrationLearnerEvidence(record.learnerEvidence)
    || !record.decision
    || typeof record.decision !== "object"
    || Array.isArray(record.decision)
  ) return false;
  const recalculated = evaluateAgentOrchestrationLab(
    slug,
    labId,
    record.state as AgentOrchestrationLabState,
  );
  const storedDecision = record.decision as Record<string, unknown>;
  const recalculatedKeys = Object.keys(recalculated).sort();
  const storedDecisionKeys = Object.keys(storedDecision).sort();
  return recalculatedKeys.length === storedDecisionKeys.length
    && recalculatedKeys.every(
      (key, index) => key === storedDecisionKeys[index],
    )
    && agentOrchestrationLabDecisionsEqual(recalculated, record.decision);
}

function invalidateAgentOrchestrationLabCompletion(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
): void {
  delete progress[agentOrchestrationLabKey(labId, slug)];
  delete progress[
    agentOrchestrationLabKey(AGENT_ORCHESTRATION_LAB_ID_BY_MODULE[slug], slug)
  ];
  progress[agentOrchestrationProgressModuleKey(slug)] = false;
}

export function saveAgentOrchestrationLabReceipt(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
  state: unknown,
  learnerEvidence: unknown,
): boolean {
  const receipt = createAgentOrchestrationLabReceipt(
    slug,
    labId,
    state,
    learnerEvidence,
  );
  if (!receipt) {
    invalidateAgentOrchestrationLabCompletion(progress, slug, labId);
    return false;
  }
  progress[agentOrchestrationLabKey(labId, slug)] = receipt;
  delete progress[agentOrchestrationLabPendingKey(labId, slug)];
  return true;
}

export function saveAgentOrchestrationPendingLabWork(
  progress: Record<string, unknown>,
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
  state: unknown,
  learnerEvidence: unknown,
): void {
  if (!isAgentOrchestrationLabPair(slug, labId)) {
    invalidateAgentOrchestrationLabCompletion(progress, slug, labId);
    return;
  }
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
  invalidateAgentOrchestrationLabCompletion(progress, slug, labId);
}
