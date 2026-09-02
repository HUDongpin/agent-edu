import {
  AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY,
  AGENT_ORCHESTRATION_PROGRESS_MIGRATION_NOTICE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
  AGENT_ORCHESTRATION_PROGRESS_RECOVERY_ENVELOPE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
} from "../progress-topology";
import {
  AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_CAPSTONE_KEY,
  AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS,
  AGENT_ORCHESTRATION_MAX_ARTIFACT_DRAFT_LENGTH,
  AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH,
  AGENT_ORCHESTRATION_QUIZ_BEST_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASSED_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT,
  isAgentOrchestrationCourseModuleComplete,
  isMeaningfulAgentOrchestrationArtifact,
  validateAgentOrchestrationCapstoneEvidence,
} from "./progress";
import {
  AGENT_ORCHESTRATION_MAX_LAB_EVIDENCE_LENGTH,
  isSavedAgentOrchestrationLabReceipt,
} from "./lab-progress";
import {
  AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
  AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION,
  isAgentOrchestrationLabPair,
  isCanonicalAgentOrchestrationLabState,
} from "./lab-model";
import { AGENT_ORCHESTRATION_PRACTICE_TEMPLATES } from "./practice-templates";
import type {
  AgentOrchestrationLabId,
  AgentOrchestrationModuleSlug,
} from "./types";

export const AGENT_ORCHESTRATION_WORKSPACE_SCHEMA =
  "aicourse.agent-orchestration.workspace.v1" as const;
export const AGENT_ORCHESTRATION_WORKSPACE_COURSE_ID =
  "agent-orchestration" as const;
export const AGENT_ORCHESTRATION_WORKSPACE_MAX_BYTES = 5_000_000;
export const AGENT_ORCHESTRATION_WORKSPACE_MAX_FIELDS = 2_048;

type JsonPrimitive = string | number | boolean | null;
export type AgentOrchestrationWorkspaceValue =
  | JsonPrimitive
  | readonly AgentOrchestrationWorkspaceValue[]
  | { readonly [key: string]: AgentOrchestrationWorkspaceValue };

export interface AgentOrchestrationWorkspaceField {
  readonly key: string;
  readonly value: AgentOrchestrationWorkspaceValue;
}

export interface AgentOrchestrationWorkspace {
  readonly schema: typeof AGENT_ORCHESTRATION_WORKSPACE_SCHEMA;
  readonly courseId: typeof AGENT_ORCHESTRATION_WORKSPACE_COURSE_ID;
  readonly progressVersion: typeof AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version;
  readonly exportedAt: string;
  readonly fields: readonly AgentOrchestrationWorkspaceField[];
}

export type AgentOrchestrationWorkspaceParseResult =
  | { readonly ok: true; readonly workspace: AgentOrchestrationWorkspace }
  | { readonly ok: false; readonly errors: readonly string[] };

export type AgentOrchestrationWorkspaceRestoreAction =
  | "add"
  | "unchanged"
  | "keep-local";

export interface AgentOrchestrationWorkspaceRestoreItem {
  readonly key: string;
  readonly action: AgentOrchestrationWorkspaceRestoreAction;
  readonly importedValue: AgentOrchestrationWorkspaceValue;
}

export interface AgentOrchestrationWorkspaceRestorePreview {
  readonly workspace: AgentOrchestrationWorkspace;
  readonly items: readonly AgentOrchestrationWorkspaceRestoreItem[];
  readonly addCount: number;
  readonly unchangedCount: number;
  readonly keepLocalCount: number;
}

export interface AgentOrchestrationWorkspaceApplyResult {
  readonly record: Record<string, unknown>;
  readonly appliedCount: number;
  readonly skippedCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function isJsonValue(
  value: unknown,
  depth = 0,
  seen: Set<object> = new Set(),
): value is AgentOrchestrationWorkspaceValue {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "boolean"
  ) return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > 64 || seen.has(value)) return false;
  if (
    !Array.isArray(value)
    && Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null
  ) return false;
  seen.add(value);
  const valid = Array.isArray(value)
    ? value.every((entry) => isJsonValue(entry, depth + 1, seen))
    : Object.values(value).every(
      (entry) => isJsonValue(entry, depth + 1, seen),
    );
  seen.delete(value);
  return valid;
}

function jsonValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => jsonValuesEqual(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index] && jsonValuesEqual(left[key], right[key]),
    );
}

type PortableKeyContract =
  | { readonly kind: "version" | "quiz-best" | "quiz-passed" | "capstone-checks" | "capstone-complete" | "capstone-recovery" }
  | { readonly kind: "module-complete" | "artifact" | "artifact-evidence" | "artifact-pending" | "checkpoint"; readonly slug: AgentOrchestrationModuleSlug }
  | { readonly kind: "lab" | "lab-pending"; readonly slug: AgentOrchestrationModuleSlug; readonly labId: AgentOrchestrationLabId };

const moduleSlugSet = new Set<string>(AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS);
const semanticIdPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/u;
const ignoredWorkspaceMetadataKeys = new Set<string>([
  AGENT_ORCHESTRATION_PROGRESS_MIGRATION_NOTICE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_RECOVERY_ENVELOPE_KEY,
]);

function ignoredWorkspaceKey(key: string): boolean {
  return ignoredWorkspaceMetadataKeys.has(key)
    || /^agent-orchestration\.module\.[a-z0-9-]+\.checkpoint\.passed$/u.test(key);
}

function portableKeyContract(key: string): PortableKeyContract | null {
  if (key === AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey) {
    return { kind: "version" };
  }
  if (key === AGENT_ORCHESTRATION_QUIZ_BEST_KEY) return { kind: "quiz-best" };
  if (key === AGENT_ORCHESTRATION_QUIZ_PASSED_KEY) return { kind: "quiz-passed" };
  if (key === AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY) return { kind: "capstone-checks" };
  if (key === AGENT_ORCHESTRATION_CAPSTONE_KEY) return { kind: "capstone-complete" };
  if (key === AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY) {
    return { kind: "capstone-recovery" };
  }
  const match = key.match(
    /^agent-orchestration\.module\.([a-z0-9-]+)\.(complete|artifact|artifact\.evidence|artifact\.pending-draft|checkpoint|lab\.([a-z0-9-]+)(\.pending)?)$/u,
  );
  if (!match || !moduleSlugSet.has(match[1])) return null;
  const slug = match[1] as AgentOrchestrationModuleSlug;
  switch (match[2]) {
    case "complete": return { kind: "module-complete", slug };
    case "artifact": return { kind: "artifact", slug };
    case "artifact.evidence": return { kind: "artifact-evidence", slug };
    case "artifact.pending-draft": return { kind: "artifact-pending", slug };
    case "checkpoint": return { kind: "checkpoint", slug };
    default: {
      const labId = match[3];
      if (!labId || !isAgentOrchestrationLabPair(slug, labId)) return null;
      return {
        kind: match[4] ? "lab-pending" : "lab",
        slug,
        labId: labId as AgentOrchestrationLabId,
      };
    }
  }
}

function exactObjectKeys(value: unknown, expected: readonly string[]): boolean {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === expected.length
    && keys.every((key, index) => key === expected[index]);
}

function validCheckpointReceipt(
  value: unknown,
  slug: AgentOrchestrationModuleSlug,
): boolean {
  if (!exactObjectKeys(value, [
    "checkpointId",
    "contentVersion",
    "passed",
    "selectedOptionId",
  ])) return false;
  const receipt = value as Record<string, unknown>;
  if (
    typeof receipt.checkpointId !== "string"
    || typeof receipt.selectedOptionId !== "string"
    || !semanticIdPattern.test(receipt.selectedOptionId)
    || typeof receipt.passed !== "boolean"
  ) return false;
  const contract = AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS[slug].find(
    (candidate) => candidate.checkpointId === receipt.checkpointId
      && candidate.contentVersion === receipt.contentVersion,
  );
  if (!contract) return false;
  return receipt.passed
    ? receipt.selectedOptionId === contract.correctOptionId
    : receipt.selectedOptionId !== contract.correctOptionId;
}

function validPendingLab(
  value: unknown,
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
): boolean {
  if (!exactObjectKeys(value, [
    "labId",
    "learnerEvidence",
    "moduleSlug",
    "scenarioVersion",
    "schemaVersion",
    "state",
  ])) return false;
  const pending = value as Record<string, unknown>;
  return pending.schemaVersion === AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION
    && pending.scenarioVersion === AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION
    && pending.moduleSlug === slug
    && pending.labId === labId
    && typeof pending.learnerEvidence === "string"
    && pending.learnerEvidence.length <= AGENT_ORCHESTRATION_MAX_LAB_EVIDENCE_LENGTH
    && isCanonicalAgentOrchestrationLabState(pending.state);
}

function validArtifactEvidence(
  value: unknown,
  slug: AgentOrchestrationModuleSlug,
  values: ReadonlyMap<string, unknown>,
): boolean {
  if (!exactObjectKeys(value, ["moduleSlug", "saved", "starterTemplate"])) {
    return false;
  }
  const evidence = value as Record<string, unknown>;
  const artifactKey = `agent-orchestration.module.${slug}.artifact`;
  const artifact = values.get(artifactKey);
  const canonicalTemplates: readonly string[] = Object.values(
    AGENT_ORCHESTRATION_PRACTICE_TEMPLATES[slug],
  );
  return evidence.saved === true
    && evidence.moduleSlug === slug
    && typeof evidence.starterTemplate === "string"
    && canonicalTemplates.includes(evidence.starterTemplate)
    && isMeaningfulAgentOrchestrationArtifact(
      artifact,
      evidence.starterTemplate,
    );
}

function validCapstoneReferences(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && value.length === AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT
    && value.every(
      (entry) => typeof entry === "string"
        && entry.length <= AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH,
    );
}

function validatePortableFieldValues(
  fields: readonly AgentOrchestrationWorkspaceField[],
): readonly string[] {
  const errors: string[] = [];
  const values = new Map(fields.map(({ key, value }) => [key, value]));
  const candidateRecord = Object.fromEntries(fields.map(({ key, value }) => [key, value]));
  for (const { key, value } of fields) {
    const contract = portableKeyContract(key);
    if (!contract) {
      errors.push(`Workspace key is not portable: ${key}`);
      continue;
    }
    let valid = false;
    switch (contract.kind) {
      case "version":
        valid = value === AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version;
        break;
      case "quiz-best":
        valid = typeof value === "number"
          && Number.isInteger(value)
          && value >= 0
          && value <= 100;
        break;
      case "quiz-passed":
        valid = typeof value === "boolean"
          && (value === false
            || (typeof values.get(AGENT_ORCHESTRATION_QUIZ_BEST_KEY) === "number"
              && (values.get(AGENT_ORCHESTRATION_QUIZ_BEST_KEY) as number)
                >= AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT));
        break;
      case "capstone-checks":
      case "capstone-recovery":
        valid = validCapstoneReferences(value);
        break;
      case "capstone-complete":
        valid = typeof value === "boolean"
          && (value === false
            || (validCapstoneReferences(values.get(AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY))
              && validateAgentOrchestrationCapstoneEvidence(
                values.get(AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY) as readonly string[],
              ).complete));
        break;
      case "module-complete":
        valid = typeof value === "boolean"
          && (value === false
            || isAgentOrchestrationCourseModuleComplete(
              candidateRecord,
              contract.slug,
            ));
        break;
      case "artifact":
      case "artifact-pending":
        valid = typeof value === "string"
          && value.length <= AGENT_ORCHESTRATION_MAX_ARTIFACT_DRAFT_LENGTH;
        break;
      case "artifact-evidence":
        valid = validArtifactEvidence(value, contract.slug, values);
        break;
      case "checkpoint":
        valid = validCheckpointReceipt(value, contract.slug);
        break;
      case "lab":
        valid = isSavedAgentOrchestrationLabReceipt(
          value,
          contract.slug,
          contract.labId,
        );
        break;
      case "lab-pending":
        valid = validPendingLab(value, contract.slug, contract.labId);
        break;
    }
    if (!valid) errors.push(`Workspace value is invalid for key: ${key}`);
  }
  return errors;
}

function pairedLocalWorkExists(
  localRecord: Readonly<Record<string, unknown>>,
  contract: PortableKeyContract,
): boolean {
  switch (contract.kind) {
    case "artifact-pending":
      return Object.hasOwn(
        localRecord,
        `agent-orchestration.module.${contract.slug}.artifact`,
      ) || Object.hasOwn(
        localRecord,
        `agent-orchestration.module.${contract.slug}.artifact.evidence`,
      );
    case "artifact":
    case "artifact-evidence":
      return Object.hasOwn(
        localRecord,
        `agent-orchestration.module.${contract.slug}.artifact.pending-draft`,
      );
    case "lab-pending":
      return Object.hasOwn(
        localRecord,
        `agent-orchestration.module.${contract.slug}.lab.${contract.labId}`,
      );
    case "lab":
      return Object.hasOwn(
        localRecord,
        `agent-orchestration.module.${contract.slug}.lab.${contract.labId}.pending`,
      );
    case "capstone-recovery":
      return Object.hasOwn(localRecord, AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY);
    case "capstone-checks":
      return Object.hasOwn(localRecord, AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY);
    default:
      return false;
  }
}

function validateWorkspace(value: unknown): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["Workspace root must be an object."];
  const expectedRootKeys = [
    "courseId",
    "exportedAt",
    "fields",
    "progressVersion",
    "schema",
  ];
  const rootKeys = Object.keys(value).sort();
  if (
    rootKeys.length !== expectedRootKeys.length
    || rootKeys.some((key, index) => key !== expectedRootKeys[index])
  ) errors.push("Workspace envelope has unexpected fields.");
  if (value.schema !== AGENT_ORCHESTRATION_WORKSPACE_SCHEMA) {
    errors.push("Workspace schema is unsupported.");
  }
  if (value.courseId !== AGENT_ORCHESTRATION_WORKSPACE_COURSE_ID) {
    errors.push("Workspace belongs to a different course.");
  }
  if (value.progressVersion !== AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version) {
    errors.push("Workspace progress version is unsupported.");
  }
  if (!canonicalIsoTimestamp(value.exportedAt)) {
    errors.push("Workspace export timestamp is invalid.");
  }
  if (!Array.isArray(value.fields)) {
    errors.push("Workspace fields must be an array.");
    return errors;
  }
  if (value.fields.length > AGENT_ORCHESTRATION_WORKSPACE_MAX_FIELDS) {
    errors.push("Workspace contains too many fields.");
  }
  const seenKeys = new Set<string>();
  const validFields: AgentOrchestrationWorkspaceField[] = [];
  for (const field of value.fields) {
    if (!isRecord(field)) {
      errors.push("Workspace field must be an object.");
      continue;
    }
    const fieldKeys = Object.keys(field).sort();
    if (
      fieldKeys.length !== 2
      || fieldKeys[0] !== "key"
      || fieldKeys[1] !== "value"
    ) {
      errors.push("Workspace field has an invalid shape.");
      continue;
    }
    if (
      typeof field.key !== "string"
      || portableKeyContract(field.key) === null
      || field.key.length > 512
    ) {
      errors.push("Workspace contains a foreign or invalid key.");
      continue;
    }
    if (seenKeys.has(field.key)) {
      errors.push("Workspace contains a duplicate key.");
    }
    seenKeys.add(field.key);
    if (!isJsonValue(field.value)) {
      errors.push("Workspace contains a non-JSON value.");
    } else {
      validFields.push(field as unknown as AgentOrchestrationWorkspaceField);
    }
    if (
      field.key === AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey
      && field.value !== AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version
    ) errors.push("Workspace version field does not match its envelope.");
  }
  errors.push(...validatePortableFieldValues(validFields));
  return errors;
}

export function createAgentOrchestrationWorkspace(
  record: Readonly<Record<string, unknown>>,
  exportedAt: string = new Date().toISOString(),
): AgentOrchestrationWorkspace {
  if (!canonicalIsoTimestamp(exportedAt)) {
    throw new TypeError("Workspace export requires a canonical ISO timestamp");
  }
  const fields = Object.entries(record)
    .filter(([key]) => key.startsWith(AGENT_ORCHESTRATION_PROGRESS_SCHEMA.prefix))
    .filter(([key]) => !ignoredWorkspaceKey(key))
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => {
      if (portableKeyContract(key) === null) {
        throw new TypeError(`Workspace key is not portable: ${key}`);
      }
      if (!isJsonValue(value)) {
        throw new TypeError(`Workspace field is not JSON-safe: ${key}`);
      }
      return { key, value };
    });
  const workspace: AgentOrchestrationWorkspace = {
    schema: AGENT_ORCHESTRATION_WORKSPACE_SCHEMA,
    courseId: AGENT_ORCHESTRATION_WORKSPACE_COURSE_ID,
    progressVersion: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
    exportedAt,
    fields,
  };
  const errors = validateWorkspace(workspace);
  if (errors.length > 0) throw new TypeError(errors.join(" "));
  return workspace;
}

export function serializeAgentOrchestrationWorkspace(
  workspace: AgentOrchestrationWorkspace,
): string {
  const errors = validateWorkspace(workspace);
  if (errors.length > 0) throw new TypeError(errors.join(" "));
  const text = `${JSON.stringify(workspace, null, 2)}\n`;
  if (new TextEncoder().encode(text).byteLength > AGENT_ORCHESTRATION_WORKSPACE_MAX_BYTES) {
    throw new RangeError("Workspace export exceeds the size limit");
  }
  return text;
}

export function parseAgentOrchestrationWorkspace(
  raw: string,
): AgentOrchestrationWorkspaceParseResult {
  if (new TextEncoder().encode(raw).byteLength > AGENT_ORCHESTRATION_WORKSPACE_MAX_BYTES) {
    return { ok: false, errors: ["Workspace file exceeds the size limit."] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ["Workspace file is not valid JSON."] };
  }
  const errors = validateWorkspace(parsed);
  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, workspace: parsed as unknown as AgentOrchestrationWorkspace };
}

export function previewAgentOrchestrationWorkspaceRestore(
  localRecord: Readonly<Record<string, unknown>>,
  workspace: AgentOrchestrationWorkspace,
): AgentOrchestrationWorkspaceRestorePreview {
  const errors = validateWorkspace(workspace);
  if (errors.length > 0) throw new TypeError(errors.join(" "));
  const items = workspace.fields.map(({ key, value }) => {
    const contract = portableKeyContract(key);
    if (!contract) throw new TypeError(`Workspace key is not portable: ${key}`);
    const action: AgentOrchestrationWorkspaceRestoreAction =
      !Object.hasOwn(localRecord, key) && !pairedLocalWorkExists(localRecord, contract)
        ? "add"
        : jsonValuesEqual(localRecord[key], value)
          ? "unchanged"
          : "keep-local";
    return { key, action, importedValue: value };
  });
  return {
    workspace,
    items,
    addCount: items.filter(({ action }) => action === "add").length,
    unchangedCount: items.filter(({ action }) => action === "unchanged").length,
    keepLocalCount: items.filter(({ action }) => action === "keep-local").length,
  };
}

export function applyAgentOrchestrationWorkspacePreview(
  currentRecord: Readonly<Record<string, unknown>>,
  preview: AgentOrchestrationWorkspaceRestorePreview,
): AgentOrchestrationWorkspaceApplyResult {
  const errors = validateWorkspace(preview.workspace);
  if (errors.length > 0) throw new TypeError(errors.join(" "));
  const record = { ...currentRecord };
  const workspaceValues = new Map(
    preview.workspace.fields.map(({ key, value }) => [key, value]),
  );
  let appliedCount = 0;
  let skippedCount = 0;

  const dependentKind = (contract: PortableKeyContract): boolean =>
    contract.kind === "artifact-evidence"
    || contract.kind === "module-complete"
    || contract.kind === "quiz-passed"
    || contract.kind === "capstone-complete";

  const dependentValueValid = (
    contract: PortableKeyContract,
    value: AgentOrchestrationWorkspaceValue,
  ): boolean => {
    switch (contract.kind) {
      case "artifact-evidence": {
        const artifactKey = `agent-orchestration.module.${contract.slug}.artifact`;
        const importedArtifact = workspaceValues.get(artifactKey);
        return importedArtifact !== undefined
          && jsonValuesEqual(record[artifactKey], importedArtifact)
          && validArtifactEvidence(
            value,
            contract.slug,
            new Map(Object.entries(record)),
          );
      }
      case "module-complete":
        return value === false || (
          value === true
          && isAgentOrchestrationCourseModuleComplete(
            { ...record, [itemKey(contract)]: true },
            contract.slug,
          )
        );
      case "quiz-passed":
        return value === false || (
          value === true
          && typeof record[AGENT_ORCHESTRATION_QUIZ_BEST_KEY] === "number"
          && (record[AGENT_ORCHESTRATION_QUIZ_BEST_KEY] as number)
            >= AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT
        );
      case "capstone-complete": {
        if (value === false) return true;
        const importedChecks = workspaceValues.get(
          AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
        );
        return value === true
          && importedChecks !== undefined
          && jsonValuesEqual(
            record[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY],
            importedChecks,
          )
          && validCapstoneReferences(importedChecks)
          && validateAgentOrchestrationCapstoneEvidence(importedChecks).complete;
      }
      default:
        return true;
    }
  };

  const itemKey = (contract: PortableKeyContract): string => {
    if (contract.kind !== "module-complete") return "";
    return `agent-orchestration.module.${contract.slug}.complete`;
  };

  const addItem = (item: AgentOrchestrationWorkspaceRestoreItem): void => {
    if (item.action === "unchanged") return;
    if (item.action !== "add") {
      skippedCount += 1;
      return;
    }
    const contract = portableKeyContract(item.key);
    const workspaceValue = workspaceValues.get(item.key);
    if (
      !contract
      || workspaceValue === undefined
      || !jsonValuesEqual(workspaceValue, item.importedValue)
      || Object.hasOwn(record, item.key)
      // Treat the validated source workspace as one transaction. A paired
      // field added earlier in this apply pass is imported work, not a local
      // conflict; only work present in the apply-time destination can win.
      || pairedLocalWorkExists(currentRecord, contract)
      || (dependentKind(contract) && !dependentValueValid(contract, item.importedValue))
    ) {
      skippedCount += 1;
      return;
    }
    record[item.key] = item.importedValue;
    appliedCount += 1;
  };

  for (const item of preview.items) {
    const contract = portableKeyContract(item.key);
    if (contract && !dependentKind(contract)) addItem(item);
  }
  for (const item of preview.items) {
    const contract = portableKeyContract(item.key);
    if (contract && dependentKind(contract)) addItem(item);
  }
  return { record, appliedCount, skippedCount };
}
