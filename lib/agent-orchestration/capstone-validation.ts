import { AGENT_ORCHESTRATION_PROGRESS_SCHEMA } from "../progress-topology";

export const AGENT_ORCHESTRATION_CAPSTONE_KEY =
  "agent-orchestration.capstone.v2";
export const AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneEvidenceKey;
export const AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneArtifactCount;
export const AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH = 2_048;

export interface AgentOrchestrationCapstoneEvidenceValidation {
  readonly normalized: readonly string[];
  readonly identities: readonly string[];
  readonly valid: readonly boolean[];
  readonly complete: boolean;
}

export function agentOrchestrationCapstoneEvidence(
  progress: Readonly<Record<string, unknown>>,
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

function semanticReferenceTokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}]{2,}/gu)
    ?? [];
}

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
  if (new Set(semantic.map(
    (character) => character.toLocaleLowerCase("en-US"),
  )).size < 4) return false;
  const tokens = semanticReferenceTokens(normalized);
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
  progress: Readonly<Record<string, unknown>>,
  artifactCount: number = AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
): boolean {
  return validateAgentOrchestrationCapstoneEvidence(
    agentOrchestrationCapstoneEvidence(progress, artifactCount),
    artifactCount,
  ).complete;
}
