import { AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY } from "../progress-topology";
import {
  AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_CAPSTONE_KEY,
  AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH,
  agentOrchestrationCapstoneEvidence,
  canonicalAgentOrchestrationEvidenceIdentity,
  isMeaningfulAgentOrchestrationEvidenceReference,
  normalizeAgentOrchestrationEvidenceReference,
} from "./capstone-validation";

export {
  AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_CAPSTONE_KEY,
  AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH,
} from "./capstone-validation";

export type AgentOrchestrationCapstoneEvidenceReason =
  | "required"
  | "too-long"
  | "unsupported-scheme"
  | "too-short"
  | "placeholder"
  | "missing-identifier"
  | "duplicate";

export interface AgentOrchestrationCapstoneGuidanceValidation {
  readonly normalized: readonly string[];
  readonly identities: readonly string[];
  readonly valid: readonly boolean[];
  readonly reasons: readonly (
    AgentOrchestrationCapstoneEvidenceReason | null
  )[];
  readonly complete: boolean;
  readonly firstInvalidIndex: number | null;
}

export interface AgentOrchestrationCapstoneWorkspace {
  readonly evidence: readonly string[];
  readonly recoveryPending: boolean;
  readonly validation: AgentOrchestrationCapstoneGuidanceValidation;
  readonly complete: boolean;
}

const PLACEHOLDER_REFERENCE = /^(?:(?:todo|tbd|dummy|sample|example|placeholder)[-_ ]*)*(?:evidence|artifact|file|trace|review|record|item|output|todo|tbd|dummy|sample|example|placeholder)(?:[-_ ]*(?:todo|tbd|dummy|sample|example|placeholder))*[-_ ]*\d*$/iu;
const PLACEHOLDER_TOKEN = /(?:^|[^\p{L}\p{N}])(?:todo|tbd|dummy|fixture|sample|example|placeholder)(?:$|[^\p{L}\p{N}])/iu;

function evidenceReason(
  value: unknown,
): AgentOrchestrationCapstoneEvidenceReason | null {
  const normalized = normalizeAgentOrchestrationEvidenceReference(value);
  if (!normalized) return "required";
  if (normalized.length > AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH) {
    return "too-long";
  }
  if (
    /^[a-z][a-z\d+.-]*:\/\//iu.test(normalized)
    && !/^(?:https|trace|review|ticket|file|artifact):\/\//iu.test(normalized)
  ) return "unsupported-scheme";
  const semantic = Array.from(normalized.replace(/[^\p{L}\p{N}]+/gu, ""));
  const tokens = normalized
    .toLocaleLowerCase("en-US")
    .match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}]{2,}/gu)
    ?? [];
  if (
    semantic.length < 8
    || new Set(semantic.map((character) => character.toLowerCase())).size < 4
    || tokens.length === 0
    || tokens.length > 1 && new Set(tokens).size === 1
  ) return "too-short";
  if (PLACEHOLDER_REFERENCE.test(normalized) || PLACEHOLDER_TOKEN.test(normalized)) {
    return "placeholder";
  }
  return isMeaningfulAgentOrchestrationEvidenceReference(normalized)
    ? null
    : "missing-identifier";
}

export function validateAgentOrchestrationCapstoneEvidenceWithReasons(
  evidence: readonly unknown[],
  artifactCount: number = AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
): AgentOrchestrationCapstoneGuidanceValidation {
  if (evidence.length !== artifactCount) {
    const normalized = Array.from({ length: artifactCount }, () => "");
    const reasons = normalized.map(() => "required" as const);
    return {
      normalized,
      identities: [...normalized],
      valid: reasons.map(() => false),
      reasons,
      complete: false,
      firstInvalidIndex: artifactCount > 0 ? 0 : null,
    };
  }
  const normalized = evidence.map(normalizeAgentOrchestrationEvidenceReference);
  const identities = normalized.map(canonicalAgentOrchestrationEvidenceIdentity);
  const counts = identities.reduce((result, identity, index) => {
    if (identity && evidenceReason(evidence[index]) === null) {
      result.set(identity, (result.get(identity) ?? 0) + 1);
    }
    return result;
  }, new Map<string, number>());
  const reasons = evidence.map((value, index) => {
    const reason = evidenceReason(value);
    if (reason) return reason;
    return counts.get(identities[index]) === 1 ? null : "duplicate";
  });
  const valid = reasons.map((reason) => reason === null);
  const firstInvalidIndex = valid.findIndex((item) => !item);
  return {
    normalized,
    identities,
    valid,
    reasons,
    complete: valid.every(Boolean),
    firstInvalidIndex: firstInvalidIndex >= 0 ? firstInvalidIndex : null,
  };
}

export function readAgentOrchestrationCapstoneWorkspace(
  progress: Readonly<Record<string, unknown>>,
  artifactCount: number = AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
): AgentOrchestrationCapstoneWorkspace {
  const hasLiveEvidence = Array.isArray(
    progress[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY],
  );
  const recoveryEvidence = progress[AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY];
  const recoveryPending = !hasLiveEvidence
    && Array.isArray(recoveryEvidence)
    && recoveryEvidence.length === artifactCount
    && recoveryEvidence.every((item) => typeof item === "string");
  const evidence = agentOrchestrationCapstoneEvidence(
    recoveryPending
      ? {
        ...progress,
        [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: recoveryEvidence,
      }
      : progress,
    artifactCount,
  );
  const validation = validateAgentOrchestrationCapstoneEvidenceWithReasons(
    evidence,
    artifactCount,
  );
  return {
    evidence,
    recoveryPending,
    validation,
    complete: !recoveryPending
      && validation.complete
      && progress[AGENT_ORCHESTRATION_CAPSTONE_KEY] === true,
  };
}

export function saveAgentOrchestrationCapstoneEvidence(
  progress: Record<string, unknown>,
  evidence: readonly unknown[],
  artifactCount: number = AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
): AgentOrchestrationCapstoneGuidanceValidation {
  const stored = evidence.length === artifactCount
    ? evidence.map((value) => typeof value === "string" ? value : "")
    : Array.from({ length: artifactCount }, () => "");
  const validation = validateAgentOrchestrationCapstoneEvidenceWithReasons(
    stored,
    artifactCount,
  );
  progress[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY] = stored;
  progress[AGENT_ORCHESTRATION_CAPSTONE_KEY] = validation.complete;
  delete progress[AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY];
  return validation;
}
