import { load as parseYaml } from "js-yaml";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACT_BY_ID,
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS,
  getAgenticVideoEditingArtifactContract,
  getAgenticVideoEditingModuleArtifactContracts,
} from "./artifact-contracts";
import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
  type AgenticVideoEditingArtifactContract,
  type AgenticVideoEditingArtifactId,
  type AgenticVideoEditingModuleSlug,
  type ArtifactStatus,
  type ArtifactValidationReceipt,
  type Course20ArtifactIssue,
  type Course20ArtifactSubmission,
  type Course20LearningPath,
} from "./types";

export const COURSE20_ARTIFACT_VALIDATOR_VERSION =
  "course20-artifacts.v1.2.0";

type JsonObject = Record<string, unknown>;
type SubmissionMap = Partial<
  Record<AgenticVideoEditingArtifactId, Course20ArtifactSubmission>
>;

export interface Course20ArtifactValidationResult {
  readonly artifactId: AgenticVideoEditingArtifactId;
  readonly status: ArtifactStatus;
  readonly issues: readonly Course20ArtifactIssue[];
  readonly parsedContent?: unknown;
  readonly canonicalText?: string;
}

export interface Course20ArtifactValidationContext {
  readonly dependencySubmissions?: SubmissionMap;
  readonly reviewDecision?: Course20ArtifactSubmission["reviewDecision"];
}

const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z)?$/u;
const OMIT_FROM_SEMANTIC_HASH = new Set([
  "comment",
  "comments",
  "displayLabel",
  "learnerReflection",
  "nonProductionNotes",
  "uiState",
  "updatedAt",
]);

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function issue(code: string, path: string, message: string): Course20ArtifactIssue {
  return { code, path, message };
}

function requireObject(
  value: unknown,
  path: string,
  issues: Course20ArtifactIssue[],
): JsonObject | null {
  if (!isObject(value)) {
    issues.push(issue("structure.object-required", path, "Expected an object."));
    return null;
  }
  return value;
}

function requireString(
  object: JsonObject,
  key: string,
  path: string,
  issues: Course20ArtifactIssue[],
): string | null {
  const value = object[key];
  if (!isNonEmptyString(value)) {
    issues.push(issue(
      "structure.string-required",
      `${path}.${key}`,
      "Expected a non-empty string.",
    ));
    return null;
  }
  return value;
}

function requireArray(
  object: JsonObject,
  key: string,
  path: string,
  issues: Course20ArtifactIssue[],
  allowEmpty = false,
): unknown[] | null {
  const value = object[key];
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    issues.push(issue(
      "structure.array-required",
      `${path}.${key}`,
      allowEmpty ? "Expected an array." : "Expected a non-empty array.",
    ));
    return null;
  }
  return value;
}

function requireSha(
  object: JsonObject,
  key: string,
  path: string,
  issues: Course20ArtifactIssue[],
): string | null {
  const value = object[key];
  if (!isSha256(value)) {
    issues.push(issue(
      "receipt.sha256",
      `${path}.${key}`,
      "Expected a lowercase 64-character SHA-256.",
    ));
    return null;
  }
  return value;
}

function validateRational(
  value: unknown,
  path: string,
  issues: Course20ArtifactIssue[],
): value is { numerator: number; denominator: number } {
  const rational = requireObject(value, path, issues);
  if (!rational) return false;
  if (!isPositiveInteger(rational.numerator)
    || !isPositiveInteger(rational.denominator)) {
    issues.push(issue(
      "clock.invalid-rational",
      path,
      "Rational time requires positive integer numerator and denominator.",
    ));
    return false;
  }
  return true;
}

function validateSafeRelativePath(
  value: unknown,
  path: string,
  issues: Course20ArtifactIssue[],
): void {
  if (!isNonEmptyString(value)) {
    issues.push(issue("security.path-required", path, "Expected a relative path."));
    return;
  }
  const normalized = value.replaceAll("\\", "/");
  if (normalized.startsWith("/")
    || /^[a-z]:\//iu.test(normalized)
    || normalized.split("/").includes("..")
    || /^(?:https?|file|ftp|data):/iu.test(normalized)
    || normalized.includes("\0")) {
    issues.push(issue(
      "security.path-escape",
      path,
      "Paths must remain relative to an allowed root and may not use traversal, absolute paths, URLs, or NUL bytes.",
    ));
  }
}

function duplicateStrings(values: readonly unknown[]): string[] {
  const strings = values.filter(isNonEmptyString);
  return [...new Set(strings.filter((value, index) => strings.indexOf(value) !== index))];
}

function validateUniqueIds(
  values: readonly unknown[],
  key: string,
  path: string,
  issues: Course20ArtifactIssue[],
): Set<string> {
  const ids = values.flatMap((value, index) => {
    if (!isObject(value) || !isNonEmptyString(value[key])) {
      issues.push(issue(
        "structure.id-required",
        `${path}[${index}].${key}`,
        "Expected a stable non-empty ID.",
      ));
      return [];
    }
    return [value[key]];
  });
  for (const duplicate of duplicateStrings(ids)) {
    issues.push(issue("identity.duplicate-id", path, `Duplicate ID: ${duplicate}.`));
  }
  return new Set(ids);
}

function resolveArtifactId(
  idOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug,
): AgenticVideoEditingArtifactId {
  if ((AGENTIC_VIDEO_EDITING_ARTIFACT_IDS as readonly string[]).includes(idOrSlug)) {
    return idOrSlug as AgenticVideoEditingArtifactId;
  }
  if ((AGENTIC_VIDEO_EDITING_MODULE_SLUGS as readonly string[]).includes(idOrSlug)) {
    const contracts = getAgenticVideoEditingModuleArtifactContracts(
      idOrSlug as AgenticVideoEditingModuleSlug,
    );
    if (!contracts[0]) throw new Error(`No artifact contract for ${idOrSlug}.`);
    return contracts[0].id;
  }
  throw new Error(`Unknown Course 20 artifact or module: ${idOrSlug}`);
}

function parseArtifactContent(
  contract: AgenticVideoEditingArtifactContract,
  contentText: string,
): { parsedContent?: unknown; canonicalText?: string; issues: Course20ArtifactIssue[] } {
  if (!contentText.trim()) {
    return {
      issues: [issue("content.empty", "$", "Artifact content is empty.")],
    };
  }
  if (contract.format === "markdown") {
    const headingCount = contentText.split(/\r?\n/u).filter((line) => /^#{1,6}\s+\S/u.test(line)).length;
    const substantiveLines = contentText.split(/\r?\n/u).filter((line) => line.trim().length >= 20).length;
    if (headingCount < 2 || substantiveLines < 4) {
      return {
        issues: [issue(
          "markdown.contract",
          "$",
          "Markdown requires at least two headings and four substantive lines; line count alone is never completion evidence.",
        )],
      };
    }
    return { parsedContent: contentText, canonicalText: contentText.trim(), issues: [] };
  }
  try {
    const parsedContent = contract.format === "yaml"
      ? parseYaml(contentText, { schema: undefined })
      : JSON.parse(contentText);
    if (!isObject(parsedContent)) {
      return {
        parsedContent,
        issues: [issue("structure.object-required", "$", "Artifact root must be an object.")],
      };
    }
    return {
      parsedContent,
      canonicalText: JSON.stringify(canonicalizeJsonValue(parsedContent)),
      issues: [],
    };
  } catch (error) {
    return {
      issues: [issue(
        contract.format === "yaml" ? "yaml.parse" : "json.parse",
        "$",
        `Unable to parse ${contract.format}: ${error instanceof Error ? error.message : String(error)}`,
      )],
    };
  }
}

function validateCommon(
  value: unknown,
  contract: AgenticVideoEditingArtifactContract,
  issues: Course20ArtifactIssue[],
): JsonObject | null {
  const object = requireObject(value, "$", issues);
  if (!object) return null;
  if (object.schemaVersion !== contract.schemaId) {
    issues.push(issue(
      "contract.schema-version",
      "$.schemaVersion",
      `Expected ${contract.schemaId}.`,
    ));
  }
  if (object.projectSpecId !== AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID) {
    issues.push(issue(
      "contract.project-spec-id",
      "$.projectSpecId",
      `Expected ${AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID}.`,
    ));
  }
  if (contract.id !== "edit-plan-v3-validation-approval"
    && object.projectId !== AGENTIC_VIDEO_EDITING_PROJECT_ID) {
    issues.push(issue(
      "contract.project-id",
      "$.projectId",
      `Expected ${AGENTIC_VIDEO_EDITING_PROJECT_ID}.`,
    ));
  }
  return object;
}

function validateCreativeBrief(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  for (const key of ["audience", "intendedClaim", "editingGoal"]) {
    requireString(object, key, "$", issues);
  }
  requireArray(object, "storyBeats", "$", issues);
  requireArray(object, "acceptanceCriteria", "$", issues);
  requireArray(object, "stopConditions", "$", issues);
  const responsibility = requireObject(
    object.responsibilityMap,
    "$.responsibilityMap",
    issues,
  );
  if (responsibility) {
    for (const key of ["planApprover", "rightsReviewer", "releaseApprover"]) {
      requireString(responsibility, key, "$.responsibilityMap", issues);
    }
    if (responsibility.agentMayPublish !== false) {
      issues.push(issue(
        "authority.publish-denied",
        "$.responsibilityMap.agentMayPublish",
        "The agent must not hold release authority.",
      ));
    }
  }
  const coreRestrictions = requireArray(object, "coreSyntheticMediaRestrictions", "$", issues);
  const required = [
    "synthetic-face",
    "voice-clone",
    "fabricated-quotation",
    "fabricated-testimonial",
    "event-replacement",
    "unauthorized-identity-manipulation",
  ];
  const recorded = new Set((coreRestrictions ?? []).filter(isNonEmptyString));
  for (const restriction of required) {
    if (!recorded.has(restriction)) {
      issues.push(issue(
        "synthetic-media.core-boundary",
        "$.coreSyntheticMediaRestrictions",
        `Missing prohibited core use: ${restriction}.`,
      ));
    }
  }
}

function validateRightsDecision(
  value: unknown,
  path: string,
  issues: Course20ArtifactIssue[],
): string | null {
  const decision = requireObject(value, path, issues);
  if (!decision) return null;
  const id = requireString(decision, "id", path, issues);
  requireSha(decision, "assetSha256", path, issues);
  for (const key of ["exactUse", "territory", "term", "attribution", "transformation", "reviewer", "reviewedAt"]) {
    requireString(decision, key, path, issues);
  }
  requireArray(decision, "destinations", path, issues);
  if (!['allowed', 'denied'].includes(String(decision.modelUploadPermission))) {
    issues.push(issue(
      "rights.model-upload-permission",
      `${path}.modelUploadPermission`,
      "Record model upload permission as allowed or denied.",
    ));
  }
  if (decision.status !== "approved") {
    issues.push(issue(
      "rights.unresolved",
      `${path}.status`,
      "Only an approved exact-use rights decision can enter the core plan.",
    ));
  }
  if (!ISO_DATE_PATTERN.test(String(decision.reviewedAt ?? ""))) {
    issues.push(issue(
      "rights.review-time",
      `${path}.reviewedAt`,
      "Use an ISO date or UTC timestamp.",
    ));
  }
  return id;
}

function validateProductionRightsDecision(
  value: unknown,
  path: string,
  issues: Course20ArtifactIssue[],
): { id: string; assetLedgerId: string } | null {
  const decision = requireObject(value, path, issues);
  if (!decision) return null;
  const id = requireString(decision, "rightsDecisionId", path, issues);
  const assetLedgerId = requireString(decision, "assetLedgerId", path, issues);
  for (const key of [
    "exactUse",
    "destination",
    "territory",
    "term",
    "attribution",
    "transformation",
    "reviewedAt",
  ]) {
    requireString(decision, key, path, issues);
  }
  if (typeof decision.modelUploadPermission !== "boolean") {
    issues.push(issue(
      "rights.model-upload-permission",
      `${path}.modelUploadPermission`,
      "Production rights decisions must explicitly record model-upload permission as a boolean.",
    ));
  }
  const reviewer = requireObject(decision.reviewer, `${path}.reviewer`, issues);
  if (reviewer) {
    for (const key of ["name", "role", "authorityBoundary"]) {
      requireString(reviewer, key, `${path}.reviewer`, issues);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(String(decision.reviewedAt ?? ""))) {
    issues.push(issue(
      "rights.review-time",
      `${path}.reviewedAt`,
      "Production rights decisions require a UTC timestamp.",
    ));
  }
  return id && assetLedgerId ? { id, assetLedgerId } : null;
}

function validateMediaManifest(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  const rights = requireArray(object, "rightsDecisions", "$", issues);
  const rightIds = new Set<string>();
  for (const [index, value] of (rights ?? []).entries()) {
    const id = validateRightsDecision(value, `$.rightsDecisions[${index}]`, issues);
    if (id) {
      if (rightIds.has(id)) {
        issues.push(issue("identity.duplicate-id", "$.rightsDecisions", `Duplicate rights decision: ${id}.`));
      }
      rightIds.add(id);
    }
  }
  const assets = requireArray(object, "assets", "$", issues);
  validateUniqueIds(assets ?? [], "mediaId", "$.assets", issues);
  for (const [index, value] of (assets ?? []).entries()) {
    const path = `$.assets[${index}]`;
    const asset = requireObject(value, path, issues);
    if (!asset) continue;
    requireString(asset, "mediaId", path, issues);
    requireSha(asset, "inputSha256", path, issues);
    requireSha(asset, "probeReceiptSha256", path, issues);
    validateSafeRelativePath(asset.originalPath, `${path}.originalPath`, issues);
    if (asset.originalReadOnly !== true || asset.symlink !== false) {
      issues.push(issue(
        "security.original-boundary",
        path,
        "Originals must be read-only and the accepted path must not be a symlink.",
      ));
    }
    const rightsDecisionId = requireString(asset, "rightsDecisionId", path, issues);
    if (rightsDecisionId && !rightIds.has(rightsDecisionId)) {
      issues.push(issue(
        "rights.reference-missing",
        `${path}.rightsDecisionId`,
        "Asset must reference an approved exact-use rights decision.",
      ));
    }
    const clock = requireObject(asset.clock, `${path}.clock`, issues);
    if (clock) {
      validateRational(clock.rationalRate, `${path}.clock.rationalRate`, issues);
      if (!isPositiveInteger(clock.durationFrames)) {
        issues.push(issue("clock.duration", `${path}.clock.durationFrames`, "Expected a positive duration in the asset clock."));
      }
      requireString(clock, "startTimecode", `${path}.clock`, issues);
      if (typeof clock.dropFrame !== "boolean") {
        issues.push(issue("clock.drop-frame", `${path}.clock.dropFrame`, "Explicitly record drop-frame status."));
      }
      if (!["CFR", "VFR"].includes(String(clock.cadence))) {
        issues.push(issue("clock.cadence", `${path}.clock.cadence`, "Record CFR or VFR."));
      }
      if (clock.cadence === "VFR") {
        requireSha(clock, "ptsReceiptSha256", `${path}.clock`, issues);
        requireSha(clock, "conformReceiptSha256", `${path}.clock`, issues);
      }
    }
    const audio = requireObject(asset.audio, `${path}.audio`, issues);
    if (audio) {
      if (audio.sampleRate !== 48_000) {
        issues.push(issue("audio.sample-rate", `${path}.audio.sampleRate`, "The core sandbox uses 48 kHz audio."));
      }
      validateRational(audio.timeBase, `${path}.audio.timeBase`, issues);
      if (!isPositiveInteger(audio.durationSamples)) {
        issues.push(issue("audio.duration-samples", `${path}.audio.durationSamples`, "Expected a positive sample duration."));
      }
    }
    if (asset.quarantineStatus !== "released") {
      issues.push(issue(
        "ingest.quarantine",
        `${path}.quarantineStatus`,
        "Only released, verified assets can enter downstream planning.",
      ));
    }
  }
  const trust = requireObject(object.untrustedContentPolicy, "$.untrustedContentPolicy", issues);
  if (trust && trust.treatedAs !== "data-not-authority") {
    issues.push(issue(
      "security.untrusted-authority",
      "$.untrustedContentPolicy.treatedAs",
      "Media, metadata, OCR, transcript, filenames, and tool output are data, never authority.",
    ));
  }
}

function validateEvidenceIndex(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  const references = requireObject(object.references, "$.references", issues);
  if (references) {
    for (const key of ["transcript", "shots", "contactSheet"]) {
      const reference = requireObject(references[key], `$.references.${key}`, issues);
      if (reference) {
        validateSafeRelativePath(reference.path, `$.references.${key}.path`, issues);
        requireSha(reference, "sha256", `$.references.${key}`, issues);
      }
    }
  }
  const entries = requireArray(object, "entries", "$", issues);
  validateUniqueIds(entries ?? [], "evidenceId", "$.entries", issues);
  for (const [index, value] of (entries ?? []).entries()) {
    const path = `$.entries[${index}]`;
    const entry = requireObject(value, path, issues);
    if (!entry) continue;
    requireString(entry, "mediaId", path, issues);
    requireString(entry, "kind", path, issues);
    const range = requireObject(entry.sourceRange, `${path}.sourceRange`, issues);
    if (range) {
      if (!isNonNegativeInteger(range.startFrames)
        || !isPositiveInteger(range.durationFrames)) {
        issues.push(issue("evidence.range", `${path}.sourceRange`, "Use a non-negative start and positive duration."));
      }
      validateRational(range.timeBase, `${path}.sourceRange.timeBase`, issues);
    }
    if (!["human-verified", "ambiguous"].includes(String(entry.reviewState))) {
      issues.push(issue("evidence.review-state", `${path}.reviewState`, "Core evidence must be human-verified or explicitly ambiguous."));
    }
    if (entry.reviewState === "ambiguous") {
      requireString(entry, "escalationOwner", path, issues);
    }
  }
}

function validateCandidateSegments(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  const systemCard = requireObject(object.systemCard, "$.systemCard", issues);
  if (systemCard) {
    requireArray(systemCard, "allowedActions", "$.systemCard", issues);
    requireArray(systemCard, "forbiddenActions", "$.systemCard", issues);
    if (systemCard.mayMutateMedia !== false || systemCard.mayPublish !== false) {
      issues.push(issue("authority.candidate-stage", "$.systemCard", "The candidate stage is read-only and cannot publish."));
    }
  }
  const candidates = requireArray(object, "candidates", "$", issues);
  validateUniqueIds(candidates ?? [], "candidateId", "$.candidates", issues);
  for (const [index, value] of (candidates ?? []).entries()) {
    const path = `$.candidates[${index}]`;
    const candidate = requireObject(value, path, issues);
    if (!candidate) continue;
    requireArray(candidate, "evidenceIds", path, issues);
    for (const key of ["cutMotivation", "continuity", "screenDirection", "reaction", "pacing", "contextPreservation"]) {
      requireString(candidate, key, path, issues);
    }
    if (!Array.isArray(candidate.ambiguities)) {
      issues.push(issue("ambiguity.array-required", `${path}.ambiguities`, "Ambiguities must be an array."));
    } else {
      for (const [ambiguityIndex, ambiguityValue] of candidate.ambiguities.entries()) {
        validateAmbiguity(
          ambiguityValue,
          `${path}.ambiguities[${ambiguityIndex}]`,
          issues,
        );
      }
    }
    if (candidate.reviewState !== "approved" || candidate.createsUnsupportedClaim !== false) {
      issues.push(issue("semantics.candidate-gate", path, "Core candidates require human approval and must not create unsupported claims."));
    }
  }
}

function validateAmbiguity(
  value: unknown,
  path: string,
  issues: Course20ArtifactIssue[],
): void {
  const ambiguity = requireObject(value, path, issues);
  if (!ambiguity) return;
  for (const key of ["kind", "evidence", "status", "owner", "resolutionRequirement"]) {
    requireString(ambiguity, key, path, issues);
  }
  if (ambiguity.status !== "resolved") {
    issues.push(issue(
      "ambiguity.unresolved",
      `${path}.status`,
      "Production operations cannot carry an unresolved ambiguity.",
    ));
  }
}

function validateConfidence(
  value: unknown,
  path: string,
  issues: Course20ArtifactIssue[],
): void {
  const confidence = requireObject(value, path, issues);
  if (!confidence) return;
  for (const dimension of ["localization", "transcript", "semanticFit"]) {
    const score = requireObject(confidence[dimension], `${path}.${dimension}`, issues);
    if (!score) continue;
    if (typeof score.value !== "number" || score.value < 0 || score.value > 1) {
      issues.push(issue("confidence.value", `${path}.${dimension}.value`, "Confidence must be between 0 and 1."));
    }
    requireString(score, "method", `${path}.${dimension}`, issues);
    if (!["calibrated", "uncalibrated", "not-applicable"].includes(String(score.calibrationStatus))) {
      issues.push(issue("confidence.calibration", `${path}.${dimension}.calibrationStatus`, "Record calibrated, uncalibrated, or not-applicable."));
    }
  }
}

function rationalValue(value: unknown): number | null {
  if (!isObject(value)
    || !isPositiveInteger(value.numerator)
    || !isPositiveInteger(value.denominator)) return null;
  return value.numerator / value.denominator;
}

function validateTimecodeContract(
  clock: JsonObject,
  path: string,
  rateValue: number | null,
  issues: Course20ArtifactIssue[],
): void {
  const startTimecode = requireString(clock, "startTimecode", path, issues);
  if (typeof clock.dropFrame !== "boolean") {
    issues.push(issue("clock.drop-frame", `${path}.dropFrame`, "Explicitly record drop-frame status."));
    return;
  }
  if (startTimecode && !/^\d{2}:\d{2}:\d{2}[:;]\d{2}$/u.test(startTimecode)) {
    issues.push(issue("clock.timecode", `${path}.startTimecode`, "Use HH:MM:SS:FF or HH:MM:SS;FF timecode."));
  }
  if (clock.dropFrame === true) {
    const supportsDropFrame = rateValue !== null
      && (Math.abs(rateValue - (30_000 / 1_001)) < 0.000_001
        || Math.abs(rateValue - (60_000 / 1_001)) < 0.000_001);
    if (!supportsDropFrame || !startTimecode?.includes(";")) {
      issues.push(issue(
        "clock.drop-frame-rate",
        path,
        "Drop-frame timecode requires a supported 30000/1001 or 60000/1001 clock and a semicolon label.",
      ));
    }
  } else if (startTimecode?.includes(";")) {
    issues.push(issue("clock.non-drop-label", `${path}.startTimecode`, "Non-drop timecode uses a colon frame separator."));
  }
}

function validateOperationTimelineRange(
  operation: JsonObject,
  path: string,
  timelineDurationFrames: number,
  issues: Course20ArtifactIssue[],
  allowZeroDuration = false,
): { startFrames: number; durationFrames: number } | null {
  const startFrames = operation.timelineStartFrame;
  const durationFrames = operation.durationFrames;
  const validDuration = allowZeroDuration
    ? isNonNegativeInteger(durationFrames)
    : isPositiveInteger(durationFrames);
  if (!isNonNegativeInteger(startFrames) || !validDuration) {
    issues.push(issue(
      "timeline.range",
      path,
      allowZeroDuration
        ? "Use a non-negative timeline start and duration."
        : "Use a non-negative timeline start and a positive duration.",
    ));
    return null;
  }
  const numericStart = startFrames as number;
  const numericDuration = durationFrames as number;
  if (numericStart + numericDuration > timelineDurationFrames) {
    issues.push(issue("timeline.out-of-bounds", path, "Operation extends past the declared timeline duration."));
  }
  return { startFrames: numericStart, durationFrames: numericDuration };
}

function validateEditPlan(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  requireString(object, "projectSpecId", "$", issues);
  requireString(object, "planId", "$", issues);
  if (!["draft", "ready-for-human-review", "frozen-for-execution", "frozen-for-synthetic-fixture-execution"].includes(String(object.status))) {
    issues.push(issue("plan.status", "$.status", "Use a declared edit-plan v3 lifecycle status."));
  }
  const compileContract = requireObject(object.compileContract, "$.compileContract", issues);
  const requiredCompileInputs = [
    "plan",
    "delivery-contract",
    "asset-ledger",
    "tool-policy",
  ];
  if (compileContract) {
    const requires = requireArray(compileContract, "requires", "$.compileContract", issues);
    if (JSON.stringify(requires) !== JSON.stringify(requiredCompileInputs)) {
      issues.push(issue(
        "compile.input-contract",
        "$.compileContract.requires",
        "Compilation requires the plan, delivery contract, approved asset ledger, and tool policy in canonical order.",
      ));
    }
    if (compileContract.hashBindingStage !== "external-compile-receipt-after-plan-freeze") {
      issues.push(issue(
        "compile.hash-binding-stage",
        "$.compileContract.hashBindingStage",
        "Bind all four inputs in an external compile receipt after the plan is frozen.",
      ));
    }
  }

  const blockers = requireArray(object, "unresolvedCriticalBlockers", "$", issues, true);
  if ((blockers?.length ?? 0) > 0) {
    issues.push(issue(
      "plan.unresolved-critical-blocker",
      "$.unresolvedCriticalBlockers",
      "A plan with unresolved rights, privacy, semantic, clock, or authority blockers cannot receive a valid production receipt.",
    ));
  }
  if (!["not-decided", "do-not-publish", "eligible-for-human-release-review"].includes(String(object.publicationDecision))) {
    issues.push(issue("authority.publication-decision", "$.publicationDecision", "Record a bounded publication-decision state."));
  }

  const rights = requireArray(object, "rightsDecisions", "$", issues);
  const rightsById = new Map<string, string>();
  for (const [index, value] of (rights ?? []).entries()) {
    const decision = validateProductionRightsDecision(value, `$.rightsDecisions[${index}]`, issues);
    if (decision) {
      if (rightsById.has(decision.id)) issues.push(issue("identity.duplicate-id", "$.rightsDecisions", `Duplicate rights decision: ${decision.id}.`));
      rightsById.set(decision.id, decision.assetLedgerId);
    }
  }

  const inputs = requireArray(object, "inputs", "$", issues);
  const inputIds = validateUniqueIds(inputs ?? [], "mediaId", "$.inputs", issues);
  const inputById = new Map<string, JsonObject>();
  const inputAssetLedgerIds = new Set<string>();
  for (const [index, value] of (inputs ?? []).entries()) {
    const path = `$.inputs[${index}]`;
    const input = requireObject(value, path, issues);
    if (!input) continue;
    const mediaId = requireString(input, "mediaId", path, issues);
    if (mediaId) inputById.set(mediaId, input);
    const assetLedgerId = requireString(input, "assetLedgerId", path, issues);
    if (assetLedgerId) inputAssetLedgerIds.add(assetLedgerId);
    requireSha(input, "sha256", path, issues);
    requireSha(input, "probeReceiptSha256", path, issues);
    validateSafeRelativePath(input.path, `${path}.path`, issues);
    const clock = requireObject(input.clock, `${path}.clock`, issues);
    if (clock) {
      const rateValid = validateRational(clock.rationalRate, `${path}.clock.rationalRate`, issues);
      validateTimecodeContract(
        clock,
        `${path}.clock`,
        rateValid ? rationalValue(clock.rationalRate) : null,
        issues,
      );
      if (!isPositiveInteger(clock.durationFrames)) issues.push(issue("clock.duration", `${path}.clock.durationFrames`, "Expected positive source duration frames."));
      if (!["CFR", "VFR"].includes(String(clock.cadence))) issues.push(issue("clock.cadence", `${path}.clock.cadence`, "Record CFR or VFR."));
      requireSha(clock, "ptsReceiptSha256", `${path}.clock`, issues);
      if (clock.cadence === "VFR") {
        requireSha(clock, "conformReceiptSha256", `${path}.clock`, issues);
      }
    }
    const audio = requireObject(input.audio, `${path}.audio`, issues);
    if (audio) {
      if (audio.sampleRate !== 48_000) issues.push(issue("audio.sample-rate", `${path}.audio.sampleRate`, "Core audio must use 48 kHz."));
      validateRational(audio.timeBase, `${path}.audio.timeBase`, issues);
      if (!isPositiveInteger(audio.durationSamples)) issues.push(issue("audio.duration-samples", `${path}.audio.durationSamples`, "Expected positive audio sample duration."));
    }
  }

  const timeline = requireObject(object.timeline, "$.timeline", issues);
  let timelineDurationFrames = 0;
  let timelineRate: number | null = null;
  if (timeline) {
    const rateValid = validateRational(timeline.editRate, "$.timeline.editRate", issues);
    timelineRate = rateValid ? rationalValue(timeline.editRate) : null;
    validateTimecodeContract(timeline, "$.timeline", timelineRate, issues);
    if (!isPositiveInteger(timeline.durationFrames)) {
      issues.push(issue("timeline.duration", "$.timeline.durationFrames", "Expected a positive timeline duration in edit frames."));
    } else {
      timelineDurationFrames = timeline.durationFrames;
    }
  }

  for (const [rightsDecisionId, assetLedgerId] of rightsById) {
    if (!inputAssetLedgerIds.has(assetLedgerId)) {
      issues.push(issue(
        "rights.asset-ledger-reference",
        "$.rightsDecisions",
        `${rightsDecisionId} references an asset ledger entry not present in inputs: ${assetLedgerId}.`,
      ));
    }
  }

  const operations = requireArray(object, "operations", "$", issues);
  validateUniqueIds(operations ?? [], "operationId", "$.operations", issues);
  const clipOperationIds = new Set(
    (operations ?? []).flatMap((value) => (
      isObject(value) && value.type === "clip" && isNonEmptyString(value.operationId)
        ? [value.operationId]
        : []
    )),
  );
  const clipRanges: Array<{ start: number; end: number; id: string; trackId: string }> = [];
  for (const [index, value] of (operations ?? []).entries()) {
    const path = `$.operations[${index}]`;
    const operation = requireObject(value, path, issues);
    if (!operation) continue;
    const operationId = requireString(operation, "operationId", path, issues) ?? `operation-${index}`;
    const type = requireString(operation, "type", path, issues);
    const trackId = requireString(operation, "trackId", path, issues) ?? "unknown-track";
    const range = validateOperationTimelineRange(
      operation,
      path,
      timelineDurationFrames,
      issues,
      type === "transition",
    );
    const evidenceIds = type === "clip"
      ? requireArray(operation, "evidenceIds", path, issues)
      : null;
    if (type === "clip") {
      const sourceMediaId = requireString(operation, "sourceMediaId", path, issues);
      const source = sourceMediaId ? inputById.get(sourceMediaId) : undefined;
      if (sourceMediaId && !inputIds.has(sourceMediaId)) {
        issues.push(issue("operation.source-missing", `${path}.sourceMediaId`, "Clip references an unknown input."));
      }
      requireString(operation, "candidateSegmentId", path, issues);
      const rightsDecisionId = requireString(operation, "rightsDecisionId", path, issues);
      if (rightsDecisionId && !rightsById.has(rightsDecisionId)) {
        issues.push(issue("rights.reference-missing", `${path}.rightsDecisionId`, "Clip references an unknown rights decision."));
      }
      if (!isNonNegativeInteger(operation.sourceStartFrame)) {
        issues.push(issue("operation.source-range", `${path}.sourceStartFrame`, "Use a non-negative source start frame."));
      }
      const sourceClock = source && isObject(source.clock) ? source.clock : null;
      const sourceRate = sourceClock ? rationalValue(sourceClock.rationalRate) : null;
      if (sourceClock
        && isPositiveInteger(sourceClock.durationFrames)
        && isNonNegativeInteger(operation.sourceStartFrame)
        && range
        && sourceRate
        && timelineRate) {
        const requiredSourceFrames = Math.ceil(range.durationFrames * sourceRate / timelineRate);
        if (operation.sourceStartFrame + requiredSourceFrames > sourceClock.durationFrames) {
          issues.push(issue("operation.source-out-of-bounds", path, "Clip extends past the input duration after rational-clock conversion."));
        }
      }
      requireString(operation, "reason", path, issues);
      validateConfidence(operation.confidence, `${path}.confidence`, issues);
      if (!Array.isArray(operation.ambiguities)) {
        issues.push(issue("ambiguity.array-required", `${path}.ambiguities`, "Ambiguities must be an array."));
      } else {
        for (const [ambiguityIndex, ambiguity] of operation.ambiguities.entries()) {
          validateAmbiguity(ambiguity, `${path}.ambiguities[${ambiguityIndex}]`, issues);
        }
      }
      if (!evidenceIds?.every(isNonEmptyString)) {
        issues.push(issue("operation.evidence", `${path}.evidenceIds`, "Every clip needs stable evidence IDs."));
      }
      if (operation.untrustedTextPromotedToInstruction !== false) {
        issues.push(issue("authority.untrusted-instruction", `${path}.untrustedTextPromotedToInstruction`, "Untrusted media text must remain data, never authority."));
      }
      if (!["approved-for-plan", "approved-for-fixture-only", "approved-for-synthetic-fixture-only"].includes(String(operation.reviewState))) {
        issues.push(issue("review.clip-approval", `${path}.reviewState`, "Clip operations require a bounded human plan review state."));
      }
      if (operation.requiresHumanReview !== true) {
        issues.push(issue("review.human-required", `${path}.requiresHumanReview`, "Clip selection requires human review."));
      }
      if (range) clipRanges.push({ start: range.startFrames, end: range.startFrames + range.durationFrames, id: operationId, trackId });
    } else if (type === "caption") {
      requireString(operation, "captionId", path, issues);
      requireString(operation, "text", path, issues);
      requireArray(operation, "evidenceIds", path, issues);
      if (operation.safeZoneState !== "reviewed-pass") issues.push(issue("caption.safe-zone", `${path}.safeZoneState`, "Caption placement requires a reviewed-pass safe-zone state."));
      requireString(operation, "reviewer", path, issues);
    } else if (type === "title") {
      requireString(operation, "text", path, issues);
      if (operation.safeZoneState !== "reviewed-pass") issues.push(issue("title.safe-zone", `${path}.safeZoneState`, "Title placement requires a reviewed-pass safe-zone state."));
      requireString(operation, "reviewer", path, issues);
    } else if (type === "audio") {
      if (!["replacement", "mix"].includes(String(operation.mode))) {
        issues.push(issue("audio.mode", `${path}.mode`, "Audio operations use replacement or mix."));
      }
      if (operation.sampleRate !== 48_000) {
        issues.push(issue("audio.sample-rate", `${path}.sampleRate`, "Core audio operations use 48 kHz."));
      }
      requireString(operation, "action", path, issues);
      requireString(operation, "reason", path, issues);
    } else if (type === "crop") {
      const sourceCrop = requireObject(operation.sourceCrop, `${path}.sourceCrop`, issues);
      const outputCanvas = requireObject(operation.outputCanvas, `${path}.outputCanvas`, issues);
      for (const [record, recordPath, keys] of [
        [sourceCrop, `${path}.sourceCrop`, ["x", "y", "width", "height"]],
        [outputCanvas, `${path}.outputCanvas`, ["width", "height"]],
      ] as const) {
        if (record) {
          for (const key of keys) {
            const valid = key === "x" || key === "y"
              ? isNonNegativeInteger(record[key])
              : isPositiveInteger(record[key]);
            if (!valid) issues.push(issue("crop.geometry", `${recordPath}.${key}`, "Crop and canvas geometry use non-negative integer origins and positive integer sizes."));
          }
        }
      }
      if (operation.safeZoneState !== "reviewed-pass") issues.push(issue("crop.safe-zone", `${path}.safeZoneState`, "Crop must pass the declared safe-zone check."));
      requireString(operation, "reviewer", path, issues);
    } else if (type === "transition") {
      const from = requireString(operation, "fromClipId", path, issues);
      const to = requireString(operation, "toClipId", path, issues);
      if ((from && !clipOperationIds.has(from)) || (to && !clipOperationIds.has(to))) {
        issues.push(issue("transition.reference", path, "Transition endpoints must reference existing clip operations."));
      }
      requireString(operation, "transitionKind", path, issues);
    } else {
      issues.push(issue("operation.unknown-type", `${path}.type`, "Supported operation types are clip, caption, title, audio, crop, and transition."));
    }
  }
  const rangesByTrack = new Map<string, typeof clipRanges>();
  for (const range of clipRanges) {
    rangesByTrack.set(range.trackId, [...(rangesByTrack.get(range.trackId) ?? []), range]);
  }
  for (const ranges of rangesByTrack.values()) {
    const sortedClips = [...ranges].sort((left, right) => left.start - right.start);
    for (let index = 1; index < sortedClips.length; index += 1) {
      if (sortedClips[index]!.start < sortedClips[index - 1]!.end) {
        issues.push(issue("timeline.clip-overlap", "$.operations", `Clip operations overlap on ${sortedClips[index]!.trackId}: ${sortedClips[index - 1]!.id} and ${sortedClips[index]!.id}.`));
      }
    }
  }
}

function validateDeliveryMatrix(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  const destination = requireObject(object.destination, "$.destination", issues);
  if (destination) {
    requireString(destination, "name", "$.destination", issues);
    requireString(destination, "contractObservedOn", "$.destination", issues);
    if (destination.name === "all-social-platforms") {
      issues.push(issue("delivery.universal-destination", "$.destination.name", "Define one concrete destination; there is no universal social-media delivery contract."));
    }
  }
  const candidate = requireObject(object.candidate, "$.candidate", issues);
  if (candidate) {
    if (candidate.aspectRatio !== "9:16" || candidate.width !== 1080 || candidate.height !== 1920) {
      issues.push(issue("delivery.canvas", "$.candidate", "Core requires one 1080×1920 9:16 candidate."));
    }
    if (typeof candidate.durationSeconds !== "number"
      || candidate.durationSeconds < 45
      || candidate.durationSeconds > 60) {
      issues.push(issue("delivery.duration", "$.candidate.durationSeconds", "Candidate duration must be 45–60 seconds."));
    }
    for (const key of ["container", "videoCodec", "audioCodec", "pixelFormat", "colorBranch"]) {
      requireString(candidate, key, "$.candidate", issues);
    }
  }
  const captions = requireObject(object.captions, "$.captions", issues);
  if (captions) {
    if (captions.required !== true) issues.push(issue("captions.required", "$.captions.required", "The audiovisual core fixture requires captions."));
    requireString(captions, "language", "$.captions", issues);
    if (captions.speakerLabels !== true || captions.nonSpeechCues !== true) {
      issues.push(issue("captions.content", "$.captions", "Record speaker labels and meaningful non-speech cues."));
    }
  }
  const audio = requireObject(object.audio, "$.audio", issues);
  if (audio) {
    if (audio.sampleRate !== 48_000) issues.push(issue("audio.sample-rate", "$.audio.sampleRate", "Core delivery uses 48 kHz."));
    for (const key of ["measurementStandard", "targetLufs", "toleranceLu", "truePeakLimitDbtp", "destinationEvidence"]) {
      if (!(key in audio)) issues.push(issue("audio.delivery-field", `$.audio.${key}`, "Destination audio contract field is required."));
    }
  }
  const crop = requireObject(object.crop, "$.crop", issues);
  if (crop) {
    requireString(crop, "strategy", "$.crop", issues);
    requireString(crop, "safeZoneId", "$.crop", issues);
    if (crop.perSegmentReview !== true) issues.push(issue("crop.review", "$.crop.perSegmentReview", "9:16 crop requires per-segment review."));
  }
  const accessibility = requireObject(object.accessibilityApplicability, "$.accessibilityApplicability", issues);
  const accessibilityFeatures = [
    "captions",
    "transcript",
    "descriptiveTranscript",
    "audioDescription",
    "contrast",
    "flash",
    "playerSupport",
  ];
  if (accessibility) {
    for (const feature of accessibilityFeatures) {
      const record = requireObject(accessibility[feature], `$.accessibilityApplicability.${feature}`, issues);
      if (!record) continue;
      if (!["required", "not-applicable"].includes(String(record.status))) {
        issues.push(issue("accessibility.status", `$.accessibilityApplicability.${feature}.status`, "Use required or not-applicable."));
      }
      requireString(record, "rationale", `$.accessibilityApplicability.${feature}`, issues);
    }
  }
  const color = requireObject(object.color, "$.color", issues);
  if (color) {
    for (const key of ["sourceTags", "workingTransform", "displayTransform", "scopeChecks", "shotMatching", "branch"]) {
      if (!(key in color)) issues.push(issue("color.contract-field", `$.color.${key}`, "Color contract field is required."));
    }
    if (!["SDR", "HDR"].includes(String(color.branch))) {
      issues.push(issue("color.branch", "$.color.branch", "Record SDR or HDR as a distinct branch."));
    }
  }
}

export const COURSE20_REQUIRED_ADVERSARIAL_TEST_IDS = [
  "transcript-injection",
  "ocr-frame-injection",
  "metadata-filename-injection",
  "mcp-annotation-lie",
  "tool-output-url-secret-request",
  "path-traversal-symlink",
  "network-protocol-resource-bomb",
  "token-audience-confused-deputy",
  "egress-denied",
  "paid-generation-denied",
  "publish-escalation-denied",
] as const;

function validateToolPolicy(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  const filesystem = requireObject(object.filesystem, "$.filesystem", issues);
  if (filesystem) {
    const readRoots = requireArray(filesystem, "readRoots", "$.filesystem", issues);
    const writeRoots = requireArray(filesystem, "writeRoots", "$.filesystem", issues);
    for (const [index, root] of [...(readRoots ?? []), ...(writeRoots ?? [])].entries()) {
      validateSafeRelativePath(root, `$.filesystem.roots[${index}]`, issues);
    }
    if (filesystem.followSymlinks !== false || filesystem.overwriteExisting !== false) {
      issues.push(issue("security.filesystem", "$.filesystem", "Symlink following and overwrite must be disabled."));
    }
  }
  const network = requireObject(object.network, "$.network", issues);
  if (network && (network.allowed !== false || !Array.isArray(network.egressAllowlist) || network.egressAllowlist.length !== 0)) {
    issues.push(issue("authority.egress", "$.network", "The core sandbox is offline with an empty egress allowlist."));
  }
  const identity = requireObject(object.identity, "$.identity", issues);
  if (identity) {
    if (identity.secretsReadable !== false || identity.credentialsAccepted !== false) {
      issues.push(issue("authority.credentials", "$.identity", "The sandbox reads no credentials or secrets."));
    }
    requireString(identity, "tokenAudience", "$.identity", issues);
    if (identity.delegateMayBroadenAudience !== false) {
      issues.push(issue("authority.confused-deputy", "$.identity.delegateMayBroadenAudience", "A delegate may not broaden token audience."));
    }
  }
  const cost = requireObject(object.cost, "$.cost", issues);
  if (cost && (cost.paidGenerationAllowed !== false || cost.maximumExternalSpendUsd !== 0)) {
    issues.push(issue("authority.cost", "$.cost", "Core paid generation and external spend are denied."));
  }
  const publication = requireObject(object.publication, "$.publication", issues);
  if (publication && publication.allowed !== false) {
    issues.push(issue("authority.publish", "$.publication.allowed", "The tool policy cannot grant publish authority."));
  }
  const execution = requireObject(object.execution, "$.execution", issues);
  if (execution) {
    if (execution.shellAllowed !== false
      || execution.dryRunRequired !== true
      || execution.idempotencyRequired !== true
      || execution.undoRequired !== true
      || execution.timeoutSeconds === undefined) {
      issues.push(issue("execution.control", "$.execution", "Require fixed argv, dry-run, idempotency, undo, and a timeout."));
    }
    const allowedExecutables = requireArray(execution, "allowedExecutables", "$.execution", issues);
    if ((allowedExecutables ?? []).some((entry) => !["ffmpeg", "ffprobe", "node"].includes(String(entry)))) {
      issues.push(issue("execution.executable", "$.execution.allowedExecutables", "Core allows only declared local FFmpeg, ffprobe, and Node adapters."));
    }
  }
  const untrusted = requireObject(object.untrustedData, "$.untrustedData", issues);
  if (untrusted && (untrusted.mayChangePolicy !== false || untrusted.mayExpandAuthority !== false)) {
    issues.push(issue("security.indirect-injection", "$.untrustedData", "Untrusted content can neither change policy nor expand authority."));
  }
  const tests = requireArray(object, "adversarialTests", "$", issues);
  const testIds = new Set((tests ?? []).flatMap((test) => (
    isObject(test) && isNonEmptyString(test.id) ? [test.id] : []
  )));
  for (const requiredId of COURSE20_REQUIRED_ADVERSARIAL_TEST_IDS) {
    if (!testIds.has(requiredId)) {
      issues.push(issue("security.test-missing", "$.adversarialTests", `Missing adversarial test: ${requiredId}.`));
    }
  }
  for (const [index, test] of (tests ?? []).entries()) {
    if (!isObject(test)) continue;
    if (test.expectedDecision !== "deny" || test.observedDecision !== "deny") {
      issues.push(issue("security.test-not-denied", `$.adversarialTests[${index}]`, "Every required attack must be denied in the core dry-run."));
    }
  }
}

function validateRenderReceipt(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  const bindings = requireObject(object.bindings, "$.bindings", issues);
  if (bindings) {
    for (const key of ["editPlanSha256", "deliveryMatrixSha256", "assetLedgerSha256", "toolPolicySha256", "buildConfigSha256"]) {
      requireSha(bindings, key, "$.bindings", issues);
    }
    const inputs = requireArray(bindings, "inputSha256s", "$.bindings", issues);
    if ((inputs ?? []).some((value) => !isSha256(value))) {
      issues.push(issue("render.input-hash", "$.bindings.inputSha256s", "Every input needs an exact SHA-256."));
    }
  }
  if (object.engine !== "ffmpeg-local") {
    issues.push(issue("render.core-engine", "$.engine", "The core track requires one local FFmpeg engine."));
  }
  const versions = requireObject(object.versions, "$.versions", issues);
  if (versions) {
    requireString(versions, "ffmpeg", "$.versions", issues);
    requireString(versions, "ffprobe", "$.versions", issues);
  }
  const argv = requireArray(object, "argv", "$", issues);
  if (argv?.[0] !== "ffmpeg" || argv.some((entry) => typeof entry !== "string")) {
    issues.push(issue("render.argv", "$.argv", "Record a fixed argv array beginning with ffmpeg."));
  }
  if (object.dryRunPassed !== true || object.overwritePrevented !== true) {
    issues.push(issue("render.preflight", "$", "Dry-run must pass and overwrite must remain prevented."));
  }
  const output = requireObject(object.output, "$.output", issues);
  if (output) {
    validateSafeRelativePath(output.path, "$.output.path", issues);
    requireSha(output, "sha256", "$.output", issues);
    const probe = requireObject(output.probe, "$.output.probe", issues);
    if (probe) {
      if (probe.container !== "mp4" || probe.aspectRatio !== "9:16") {
        issues.push(issue("render.output-probe", "$.output.probe", "Core output probe must report a 9:16 MP4."));
      }
      if (typeof probe.durationSeconds !== "number" || probe.durationSeconds < 45 || probe.durationSeconds > 60) {
        issues.push(issue("render.output-duration", "$.output.probe.durationSeconds", "Output must be 45–60 seconds."));
      }
      if (probe.audioSampleRate !== 48_000) {
        issues.push(issue("render.output-audio", "$.output.probe.audioSampleRate", "Output must carry 48 kHz audio."));
      }
    }
  }
  const recovery = requireObject(object.recovery, "$.recovery", issues);
  if (recovery && (recovery.undoTested !== true || recovery.rollbackVerified !== true)) {
    issues.push(issue("render.recovery", "$.recovery", "Undo and rollback must be tested and verified."));
  }
  if (object.status !== "succeeded") {
    issues.push(issue("render.status", "$.status", "A current render receipt must report succeeded."));
  }
}

function validateCandidateMediaReference(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  validateSafeRelativePath(object.localPath, "$.localPath", issues);
  requireSha(object, "mediaSha256", "$", issues);
  requireSha(object, "renderReceiptSha256", "$", issues);
  const media = requireObject(object.media, "$.media", issues);
  if (media) {
    if (media.container !== "mp4" || media.aspectRatio !== "9:16") {
      issues.push(issue("media.core-candidate", "$.media", "Reference one 9:16 MP4 candidate."));
    }
    if (typeof media.durationSeconds !== "number" || media.durationSeconds < 45 || media.durationSeconds > 60) {
      issues.push(issue("media.duration", "$.media.durationSeconds", "Candidate must be 45–60 seconds."));
    }
    if (media.playable !== true) issues.push(issue("media.playability", "$.media.playable", "Record a successful local playback check."));
  }
  const attestation = requireObject(object.selfAttestation, "$.selfAttestation", issues);
  if (attestation) {
    if (attestation.notUploaded !== true || attestation.learnerControlsLocalReference !== true) {
      issues.push(issue("privacy.local-reference", "$.selfAttestation", "Learner media remains local and under learner control."));
    }
    requireString(attestation, "rightsBasis", "$.selfAttestation", issues);
  }
}

const VERIFICATION_DIMENSIONS = [
  "technical",
  "semantic",
  "editorial",
  "audio",
  "captions",
  "color",
  "accessibility",
  "rightsPrivacy",
  "destination",
] as const;

function validateVerificationReport(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  requireSha(object, "candidateSha256", "$", issues);
  const checks = requireObject(object.checks, "$.checks", issues);
  let hasBlockingResult = false;
  for (const dimension of VERIFICATION_DIMENSIONS) {
    const record = checks
      ? requireObject(checks[dimension], `$.checks.${dimension}`, issues)
      : null;
    if (!record) continue;
    if (!["pass", "fail", "not-applicable"].includes(String(record.status))) {
      issues.push(issue("verification.status", `$.checks.${dimension}.status`, "Use pass, fail, or not-applicable."));
    }
    requireString(record, "evidence", `$.checks.${dimension}`, issues);
    if (record.status === "not-applicable") {
      requireString(record, "rationale", `$.checks.${dimension}`, issues);
    }
    if (record.status === "fail") hasBlockingResult = true;
  }
  const repair = requireObject(object.repair, "$.repair", issues);
  if (repair) {
    if (!Array.isArray(repair.diff)) issues.push(issue("repair.diff", "$.repair.diff", "Record a repair diff array."));
    if (repair.performed === true
      && (repair.rerendered !== true || repair.reverified !== true || repair.regressionPassed !== true)) {
      issues.push(issue("repair.regression", "$.repair", "A repair requires re-render, re-verification, and regression pass."));
    }
  }
  const matrix = requireObject(object.approvalMatrix, "$.approvalMatrix", issues);
  if (matrix) {
    for (const key of ["technicalReviewer", "semanticReviewer", "rightsReviewer", "releaseReviewer"]) {
      requireString(matrix, key, "$.approvalMatrix", issues);
    }
  }
  if (hasBlockingResult && object.releaseRecommendation !== "do-not-publish") {
    issues.push(issue("verification.fail-open", "$.releaseRecommendation", "Any failed check requires do-not-publish."));
  }
  if (!["candidate-verified", "do-not-publish"].includes(String(object.releaseRecommendation))) {
    issues.push(issue("verification.recommendation", "$.releaseRecommendation", "Record candidate-verified or do-not-publish."));
  }
}

function validateReleasePackage(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  requireSha(object, "candidateSha256", "$", issues);
  const entries = requireArray(object, "entries", "$", issues);
  const entryIds = validateUniqueIds(entries ?? [], "artifactId", "$.entries", issues);
  const requiredBeforeRelease = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
    .filter((contract) => contract.id !== "release-package-runbook-recovery"
      && contract.id !== "release-decision-postmortem")
    .map((contract) => contract.id);
  for (const artifactId of requiredBeforeRelease) {
    if (!entryIds.has(artifactId)) {
      issues.push(issue("release.artifact-missing", "$.entries", `Missing package artifact: ${artifactId}.`));
    }
  }
  for (const [index, value] of (entries ?? []).entries()) {
    if (!isObject(value)) continue;
    requireSha(value, "sha256", `$.entries[${index}]`, issues);
    validateSafeRelativePath(value.path, `$.entries[${index}].path`, issues);
  }
  const runbook = requireObject(object.runbook, "$.runbook", issues);
  if (runbook) {
    requireArray(runbook, "steps", "$.runbook", issues);
    requireArray(runbook, "stopConditions", "$.runbook", issues);
  }
  const recovery = requireObject(object.recoveryReceipt, "$.recoveryReceipt", issues);
  if (recovery) {
    if (recovery.independentOperatorSucceeded !== true
      || recovery.hiddenStateRequired !== false) {
      issues.push(issue("release.recovery", "$.recoveryReceipt", "An independent operator must recover without hidden state."));
    }
    requireSha(recovery, "restoredCandidateSha256", "$.recoveryReceipt", issues);
  }
}

function validatePlanApproval(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  requireSha(object, "approvedPlanSha256", "$", issues);
  requireSha(object, "planDiffSha256", "$", issues);
  for (const key of [
    "reviewerRole",
    "independenceBasis",
    "approvalScope",
    "approvedAt",
  ]) {
    requireString(object, key, "$", issues);
  }
  if (object.decision !== "approved") {
    issues.push(issue(
      "plan-approval.decision",
      "$.decision",
      "The current frozen plan requires an explicit approved decision.",
    ));
  }
  if (object.agentSelfApproval !== false
    || object.grantsPublicationAuthority !== false) {
    issues.push(issue(
      "plan-approval.authority",
      "$",
      "Plan approval must be independent and must not grant publication authority.",
    ));
  }
}

function validateReleaseDecision(
  object: JsonObject,
  issues: Course20ArtifactIssue[],
): void {
  requireSha(object, "candidateSha256", "$", issues);
  requireSha(object, "packageSha256", "$", issues);
  for (const key of ["reviewerRole", "rationale", "postmortem", "decidedAt"]) {
    requireString(object, key, "$", issues);
  }
  if (!["approve-release", "do-not-publish"].includes(String(object.decision))) {
    issues.push(issue("release.decision", "$.decision", "Record approve-release or do-not-publish."));
  }
  if (object.projectId === AGENTIC_VIDEO_EDITING_PROJECT_ID
    && object.decision !== "do-not-publish") {
    issues.push(issue("authority.fixture-publish", "$.decision", "The project-owned sandbox is never externally published."));
  }
  const unresolvedCriticalBlockers = requireArray(
    object,
    "unresolvedCriticalBlockers",
    "$",
    issues,
    true,
  );
  if ((unresolvedCriticalBlockers ?? []).some((value) => !isNonEmptyString(value))) {
    issues.push(issue(
      "release.critical-blocker",
      "$.unresolvedCriticalBlockers",
      "Every unresolved critical blocker must have a stable non-empty ID.",
    ));
  }
  const attestation = requireObject(object.releaseAttestation, "$.releaseAttestation", issues);
  if (attestation) {
    if (attestation.agentHasReleaseAuthority !== false
      || attestation.versionBound !== true
      || attestation.unresolvedRisksRecorded !== true) {
      issues.push(issue("authority.release-attestation", "$.releaseAttestation", "Release authority stays human, version-bound, and risk-aware."));
    }
  }
}

const ARTIFACT_VALIDATORS: Readonly<Record<
  AgenticVideoEditingArtifactId,
  (object: JsonObject, issues: Course20ArtifactIssue[]) => void
>> = {
  "creative-brief-responsibility-map": validateCreativeBrief,
  "media-manifest-provenance-quarantine": validateMediaManifest,
  "evidence-index-transcript-shots": validateEvidenceIndex,
  "candidate-segments-system-card": validateCandidateSegments,
  "edit-plan-v3-validation-approval": validateEditPlan,
  "plan-diff-independent-approval": validatePlanApproval,
  "delivery-matrix-accessibility": validateDeliveryMatrix,
  "tool-policy-adversarial-recovery": validateToolPolicy,
  "render-receipt-output-probe": validateRenderReceipt,
  "candidate-media-reference": validateCandidateMediaReference,
  "verification-repair-approval": validateVerificationReport,
  "release-package-runbook-recovery": validateReleasePackage,
  "release-decision-postmortem": validateReleaseDecision,
};

export function canonicalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJsonValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, canonicalizeJsonValue(value[key])]),
  );
}

function semanticProjection(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(semanticProjection);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => !OMIT_FROM_SEMANTIC_HASH.has(key))
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, semanticProjection(value[key])]),
  );
}

export function canonicalizeArtifactContent(
  contentText: string,
  idOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug =
    "creative-brief-responsibility-map",
): {
  readonly parsedContent?: unknown;
  readonly canonicalText?: string;
  readonly issues: readonly Course20ArtifactIssue[];
} {
  const artifactId = resolveArtifactId(idOrSlug);
  return parseArtifactContent(
    getAgenticVideoEditingArtifactContract(artifactId),
    contentText,
  );
}

async function sha256Text(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function sha256CanonicalArtifactContent(
  contentText: string,
  idOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug =
    "creative-brief-responsibility-map",
): Promise<string> {
  const canonical = canonicalizeArtifactContent(contentText, idOrSlug);
  return canonical.canonicalText ? sha256Text(canonical.canonicalText) : "";
}

export async function sha256SemanticArtifactContent(
  contentText: string,
  idOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug,
): Promise<string> {
  const canonical = canonicalizeArtifactContent(contentText, idOrSlug);
  if (!canonical.parsedContent) return "";
  return sha256Text(JSON.stringify(semanticProjection(canonical.parsedContent)));
}

function dependencyIssues(
  artifactId: AgenticVideoEditingArtifactId,
  context: Course20ArtifactValidationContext,
): Course20ArtifactIssue[] {
  const contract = getAgenticVideoEditingArtifactContract(artifactId);
  const submissions = context.dependencySubmissions ?? {};
  return contract.dependsOn.flatMap((dependencyId) => {
    const dependency = submissions[dependencyId];
    if (!dependency) {
      return [issue(
        "dependency.missing",
        `dependencies.${dependencyId}`,
        "Save and validate this upstream artifact first.",
      )];
    }
    if (dependency.validationReceipt.status !== "valid") {
      return [issue(
        "dependency.not-current",
        `dependencies.${dependencyId}`,
        `Upstream artifact is ${dependency.validationReceipt.status}, not current-valid.`,
      )];
    }
    return [];
  });
}

function parsedDependencyObject(
  context: Course20ArtifactValidationContext,
  artifactId: AgenticVideoEditingArtifactId,
): JsonObject | null {
  const submission = context.dependencySubmissions?.[artifactId];
  if (!submission) return null;
  const parsed = parseArtifactContent(
    getAgenticVideoEditingArtifactContract(artifactId),
    submission.contentText,
  ).parsedContent;
  return isObject(parsed) ? parsed : null;
}

function validateEditPlanDependencyBindings(
  plan: JsonObject,
  context: Course20ArtifactValidationContext,
  issues: Course20ArtifactIssue[],
): void {
  const mediaManifest = parsedDependencyObject(
    context,
    "media-manifest-provenance-quarantine",
  );
  if (mediaManifest) {
    const manifestAssets = new Map(
      (Array.isArray(mediaManifest.assets) ? mediaManifest.assets : []).flatMap((value) => (
        isObject(value) && isNonEmptyString(value.mediaId)
          ? [[value.mediaId, value] as const]
          : []
      )),
    );
    const approvedRightsIds = new Set(
      (Array.isArray(mediaManifest.rightsDecisions) ? mediaManifest.rightsDecisions : []).flatMap((value) => (
        isObject(value) && value.status === "approved" && isNonEmptyString(value.id)
          ? [value.id]
          : []
      )),
    );
    for (const [index, value] of (Array.isArray(plan.inputs) ? plan.inputs : []).entries()) {
      if (!isObject(value) || !isNonEmptyString(value.mediaId)) continue;
      const manifestAsset = manifestAssets.get(value.mediaId);
      if (!manifestAsset) {
        issues.push(issue(
          "binding.asset-ledger-missing",
          `$.inputs[${index}].mediaId`,
          "Every production input must resolve to the approved upstream asset ledger.",
        ));
        continue;
      }
      if (value.sha256 !== manifestAsset.inputSha256) {
        issues.push(issue(
          "binding.input-hash-mismatch",
          `$.inputs[${index}].sha256`,
          "The edit-plan input hash must match the approved asset-ledger hash.",
        ));
      }
      if (value.probeReceiptSha256 !== manifestAsset.probeReceiptSha256) {
        issues.push(issue(
          "binding.probe-hash-mismatch",
          `$.inputs[${index}].probeReceiptSha256`,
          "The edit-plan probe receipt must match the approved asset ledger.",
        ));
      }
      if (value.assetLedgerId !== value.mediaId) {
        issues.push(issue(
          "binding.asset-ledger-id",
          `$.inputs[${index}].assetLedgerId`,
          "The Course 20 core contract binds each input to its stable media ledger ID.",
        ));
      }
    }
    for (const [index, value] of (Array.isArray(plan.rightsDecisions) ? plan.rightsDecisions : []).entries()) {
      if (!isObject(value) || !isNonEmptyString(value.rightsDecisionId)) continue;
      if (!approvedRightsIds.has(value.rightsDecisionId)) {
        issues.push(issue(
          "binding.rights-decision-missing",
          `$.rightsDecisions[${index}].rightsDecisionId`,
          "The production plan may only bind an approved upstream exact-use rights decision.",
        ));
      }
    }
  }

  const evidenceIndex = parsedDependencyObject(
    context,
    "evidence-index-transcript-shots",
  );
  const evidenceIds = new Set(
    (Array.isArray(evidenceIndex?.entries) ? evidenceIndex.entries : []).flatMap((value) => (
      isObject(value) && isNonEmptyString(value.evidenceId) ? [value.evidenceId] : []
    )),
  );
  const candidates = parsedDependencyObject(
    context,
    "candidate-segments-system-card",
  );
  const candidatesById = new Map(
    (Array.isArray(candidates?.candidates) ? candidates.candidates : []).flatMap((value) => (
      isObject(value) && isNonEmptyString(value.candidateId)
        ? [[value.candidateId, value] as const]
        : []
    )),
  );
  for (const [index, value] of (Array.isArray(plan.operations) ? plan.operations : []).entries()) {
    if (!isObject(value) || value.type !== "clip") continue;
    const candidate = isNonEmptyString(value.candidateSegmentId)
      ? candidatesById.get(value.candidateSegmentId)
      : undefined;
    if (!candidate) {
      issues.push(issue(
        "binding.candidate-missing",
        `$.operations[${index}].candidateSegmentId`,
        "M5 clip operations must consume a human-approved M4 candidate segment.",
      ));
      continue;
    }
    const candidateEvidence = new Set(
      Array.isArray(candidate.evidenceIds)
        ? candidate.evidenceIds.filter(isNonEmptyString)
        : [],
    );
    for (const evidenceId of Array.isArray(value.evidenceIds)
      ? value.evidenceIds.filter(isNonEmptyString)
      : []) {
      if (!candidateEvidence.has(evidenceId) || !evidenceIds.has(evidenceId)) {
        issues.push(issue(
          "binding.evidence-missing",
          `$.operations[${index}].evidenceIds`,
          `${evidenceId} must exist in both the approved M4 candidate and the M3 evidence index.`,
        ));
      }
    }
  }
}

export function validateCourse20ArtifactContent(
  idOrSlug: AgenticVideoEditingArtifactId | AgenticVideoEditingModuleSlug,
  contentText: string,
  context: Course20ArtifactValidationContext = {},
): Course20ArtifactValidationResult {
  const artifactId = resolveArtifactId(idOrSlug);
  const contract = getAgenticVideoEditingArtifactContract(artifactId);
  const parsed = parseArtifactContent(contract, contentText);
  const issues: Course20ArtifactIssue[] = [...parsed.issues];
  const object = parsed.parsedContent
    ? validateCommon(parsed.parsedContent, contract, issues)
    : null;
  if (object) ARTIFACT_VALIDATORS[artifactId](object, issues);
  if (object && artifactId === "edit-plan-v3-validation-approval") {
    validateEditPlanDependencyBindings(object, context, issues);
  }
  issues.push(...dependencyIssues(artifactId, context));
  if (artifactId === "plan-diff-independent-approval"
    && (!context.reviewDecision
      || context.reviewDecision.decision !== "approved"
      || !context.reviewDecision.reviewerRole.trim())) {
    issues.push(issue(
      "review.plan-approval-required",
      "reviewDecision",
      "A named independent human approval must bind the current plan-approval artifact hash.",
    ));
  }
  const parseOrStructureFailure = issues.some((candidate) => (
    candidate.code.endsWith(".parse")
    || candidate.code.startsWith("structure.")
    || candidate.code.startsWith("contract.")
    || candidate.code === "content.empty"
  ));
  return {
    artifactId,
    status: issues.length === 0 ? "valid" : parseOrStructureFailure ? "draft" : "blocked",
    issues,
    parsedContent: parsed.parsedContent,
    canonicalText: parsed.canonicalText,
  };
}

function artifactProjectId(parsedContent: unknown): string {
  if (!isObject(parsedContent)) return AGENTIC_VIDEO_EDITING_PROJECT_ID;
  if (isNonEmptyString(parsedContent.projectId)) return parsedContent.projectId;
  return AGENTIC_VIDEO_EDITING_PROJECT_ID;
}

export async function createCourse20ArtifactSubmission({
  artifactId: requestedArtifactId,
  slug,
  path,
  contentText,
  previous,
  dependencySubmissions = {},
  reviewDecision,
}: {
  readonly artifactId?: AgenticVideoEditingArtifactId;
  readonly slug?: AgenticVideoEditingModuleSlug;
  readonly path: Course20LearningPath;
  readonly contentText: string;
  readonly previous?: Course20ArtifactSubmission;
  readonly dependencySubmissions?: SubmissionMap;
  readonly reviewDecision?: {
    readonly decision: "approved" | "blocked" | "not-required";
    readonly reviewerRole: string;
  };
}): Promise<Course20ArtifactSubmission> {
  const artifactId = requestedArtifactId ?? (slug ? resolveArtifactId(slug) : null);
  if (!artifactId) throw new Error("Course 20 artifactId or module slug is required.");
  const contract = getAgenticVideoEditingArtifactContract(artifactId);
  if (slug && contract.moduleSlug !== slug) {
    throw new Error(`${artifactId} belongs to ${contract.moduleSlug}, not ${slug}.`);
  }
  const canonical = canonicalizeArtifactContent(contentText, artifactId);
  const contentSha256 = canonical.canonicalText
    ? await sha256Text(canonical.canonicalText)
    : "";
  const semanticSha256 = canonical.parsedContent
    ? await sha256Text(JSON.stringify(semanticProjection(canonical.parsedContent)))
    : "";
  const boundDecision = reviewDecision
    ? { ...reviewDecision, boundArtifactSha256: contentSha256 }
    : undefined;
  const validation = validateCourse20ArtifactContent(artifactId, contentText, {
    dependencySubmissions,
    reviewDecision: boundDecision,
  });
  const dependencyArtifactHashes = Object.fromEntries(
    contract.dependsOn.flatMap((dependencyId) => {
      const dependency = dependencySubmissions[dependencyId];
      return dependency?.semanticSha256
        ? [[dependencyId, dependency.semanticSha256]]
        : [];
    }),
  );
  const receipt: ArtifactValidationReceipt = {
    artifactId,
    contentSha256,
    validatorId: contract.validatorId ?? "course20.generic.semantic.v2",
    validatorVersion: COURSE20_ARTIFACT_VALIDATOR_VERSION,
    status: validation.status === "valid" ? "valid" : "blocked",
    issues: validation.issues.map((candidate) => (
      `${candidate.code} ${candidate.path}: ${candidate.message}`
    )),
  };
  return {
    schemaVersion: "aicourse.course20.artifact-submission.v2",
    artifactId,
    projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    projectId: artifactProjectId(canonical.parsedContent),
    path,
    moduleSlug: contract.moduleSlug,
    revision: (previous?.revision ?? 0) + 1,
    contentText,
    contentSha256,
    semanticSha256,
    dependencyArtifactHashes,
    validatorVersion: COURSE20_ARTIFACT_VALIDATOR_VERSION,
    validationReceipt: {
      status: validation.status,
      issues: validation.issues,
    },
    receipt,
    ...(boundDecision ? { reviewDecision: boundDecision } : {}),
  };
}

export function isCourse20ArtifactSubmission(
  value: unknown,
): value is Course20ArtifactSubmission {
  if (!isObject(value)) return false;
  return value.schemaVersion === "aicourse.course20.artifact-submission.v2"
    && (AGENTIC_VIDEO_EDITING_ARTIFACT_IDS as readonly unknown[]).includes(value.artifactId)
    && (AGENTIC_VIDEO_EDITING_MODULE_SLUGS as readonly unknown[]).includes(value.moduleSlug)
    && value.projectSpecId === AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID
    && isNonEmptyString(value.projectId)
    && typeof value.contentText === "string"
    && typeof value.contentSha256 === "string"
    && typeof value.semanticSha256 === "string"
    && typeof value.revision === "number"
    && isObject(value.validationReceipt)
    && ["draft", "valid", "blocked", "stale"].includes(String(value.validationReceipt.status))
    && isObject(value.receipt);
}

export function course20ArtifactDependenciesAreCurrent(
  submission: Course20ArtifactSubmission,
  dependencies: SubmissionMap,
): boolean {
  const contract = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACT_BY_ID.get(
    submission.artifactId,
  );
  return Boolean(contract) && contract!.dependsOn.every((dependencyId) => {
    const dependency = dependencies[dependencyId];
    return dependency?.validationReceipt.status === "valid"
      && submission.dependencyArtifactHashes[dependencyId]
        === dependency.semanticSha256;
  });
}

export function createCourse20ArtifactStarter(
  artifactId: AgenticVideoEditingArtifactId,
): string {
  const starter = STARTERS[artifactId];
  return typeof starter === "string"
    ? `${starter.trimEnd()}\nprojectSpecId: ${AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID}\n`
    : JSON.stringify({
      ...(starter as Record<string, unknown>),
      projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    }, null, 2);
}

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);

const STARTERS: Readonly<Record<AgenticVideoEditingArtifactId, unknown>> = {
  "creative-brief-responsibility-map": {
    schemaVersion: "aicourse.course20.creative-brief.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    audience: "Learners reviewing a 9:16 synthetic media-control demonstration",
    intendedClaim: "A controlled edit is a chain of evidence and accountable decisions, not one prompt.",
    editingGoal: "Create one playable 45–60 second candidate without changing the fixture's meaning.",
    storyBeats: ["promise", "context", "method", "verified close"],
    acceptanceCriteria: ["45–60 seconds", "9:16", "captions and 48 kHz audio", "no unsupported claim"],
    stopConditions: ["unknown rights", "unresolved semantic ambiguity", "authority escalation", "verification failure"],
    responsibilityMap: {
      planApprover: "named human editor",
      rightsReviewer: "named rights reviewer",
      releaseApprover: "named accountable publisher",
      agentMayPublish: false,
    },
    coreSyntheticMediaRestrictions: [
      "synthetic-face", "voice-clone", "fabricated-quotation",
      "fabricated-testimonial", "event-replacement",
      "unauthorized-identity-manipulation",
    ],
    nonProductionNotes: "This field may be edited without invalidating media receipts.",
  },
  "media-manifest-provenance-quarantine": `schemaVersion: aicourse.course20.media-manifest.v2
projectId: ${AGENTIC_VIDEO_EDITING_PROJECT_ID}
rightsDecisions:
  - id: rights-project-original
    assetSha256: ${HASH_A}
    exactUse: local educational sandbox
    destinations: [local-browser]
    territory: local-only
    term: course-session
    attribution: project-authored fixture
    transformation: deterministic edit and QC
    modelUploadPermission: denied
    reviewer: named course maintainer
    reviewedAt: "2026-08-28"
    status: approved
assets:
  - mediaId: fixture-main
    inputSha256: ${HASH_A}
    probeReceiptSha256: ${HASH_B}
    originalPath: staging/course-assets/agentic-video-editing/lab/source-master.mp4
    originalReadOnly: true
    symlink: false
    rightsDecisionId: rights-project-original
    quarantineStatus: released
    clock:
      rationalRate: { numerator: 30000, denominator: 1001 }
      durationFrames: 3600
      startTimecode: 00:00:00:00
      dropFrame: false
      cadence: CFR
    audio:
      sampleRate: 48000
      timeBase: { numerator: 1, denominator: 48000 }
      durationSamples: 5765760
untrustedContentPolicy:
  treatedAs: data-not-authority
`,
  "evidence-index-transcript-shots": {
    schemaVersion: "aicourse.course20.evidence-index.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    references: {
      transcript: { path: "lab/evidence/transcript.json", sha256: HASH_A },
      shots: { path: "lab/evidence/shots.json", sha256: HASH_B },
      contactSheet: { path: "lab/evidence/contact-sheet.json", sha256: HASH_C },
    },
    entries: [{
      evidenceId: "evidence-hook",
      mediaId: "fixture-main",
      kind: "transcript-shot-alignment",
      sourceRange: {
        startFrames: 0,
        durationFrames: 720,
        timeBase: { numerator: 30000, denominator: 1001 },
      },
      reviewState: "human-verified",
    }],
  },
  "candidate-segments-system-card": {
    schemaVersion: "aicourse.course20.candidate-segments.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    systemCard: {
      allowedActions: ["read evidence", "propose candidates"],
      forbiddenActions: ["mutate media", "publish", "expand authority"],
      mayMutateMedia: false,
      mayPublish: false,
    },
    candidates: [{
      candidateId: "candidate-hook",
      evidenceIds: ["evidence-hook"],
      cutMotivation: "establish the promise",
      continuity: "graphic motion remains continuous",
      screenDirection: "not applicable to geometric fixture",
      reaction: "not applicable; no people",
      pacing: "hold long enough to read",
      contextPreservation: "keeps the limitation card",
      ambiguities: [],
      reviewState: "approved",
      createsUnsupportedClaim: false,
    }],
  },
  "edit-plan-v3-validation-approval": {
    schemaVersion: "aicourse.agentic-video-editing.edit-plan.v3",
    projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    planId: "verified-cut-plan-v3",
    status: "ready-for-human-review",
    compileContract: {
      requires: ["plan", "delivery-contract", "asset-ledger", "tool-policy"],
      hashBindingStage: "external-compile-receipt-after-plan-freeze",
    },
    rightsDecisions: [{
      rightsDecisionId: "rights-project-original",
      assetLedgerId: "fixture-main",
      exactUse: "local educational sandbox",
      destination: "local-browser",
      territory: "local-only", term: "course-session",
      attribution: "project-authored fixture", transformation: "deterministic edit",
      modelUploadPermission: false,
      reviewer: {
        name: "Course 20 fixture contract",
        role: "fixture rights reviewer",
        authorityBoundary: "local plan approval only; no learner-media or publication authority",
      },
      reviewedAt: "2026-08-28T00:00:00.000Z",
    }],
    inputs: [{
      mediaId: "fixture-main", assetLedgerId: "fixture-main",
      path: "staging/course-assets/agentic-video-editing/lab/frozen/course20-original-fixture.mp4",
      sha256: HASH_A, probeReceiptSha256: HASH_B,
      clock: {
        rationalRate: { numerator: 30000, denominator: 1001 },
        durationFrames: 3600,
        startTimecode: "00:00:00:00",
        dropFrame: false,
        cadence: "CFR",
        ptsReceiptSha256: HASH_C,
        conformReceiptSha256: null,
      },
      audio: { sampleRate: 48000, timeBase: { numerator: 1, denominator: 48000 }, durationSamples: 5765760 },
    }],
    timeline: {
      editRate: { numerator: 30, denominator: 1 },
      durationFrames: 1500,
      startTimecode: "00:00:00:00",
      dropFrame: false,
    },
    operations: [{
      operationId: "clip-hook", type: "clip", trackId: "video-main",
      timelineStartFrame: 0, durationFrames: 750,
      sourceMediaId: "fixture-main", sourceStartFrame: 0,
      candidateSegmentId: "candidate-hook", rightsDecisionId: "rights-project-original",
      evidenceIds: ["evidence-hook"],
      reason: "Use the human-approved evidence-backed opening candidate.",
      confidence: {
        localization: { value: 1, method: "fixture clock", calibrationStatus: "calibrated" },
        transcript: { value: 1, method: "project-authored card", calibrationStatus: "not-applicable" },
        semanticFit: { value: 1, method: "human review", calibrationStatus: "uncalibrated" },
      },
      ambiguities: [],
      requiresHumanReview: true,
      reviewState: "approved-for-fixture-only",
      untrustedTextPromotedToInstruction: false,
    }, {
      operationId: "clip-close", type: "clip", trackId: "video-main",
      timelineStartFrame: 750, durationFrames: 750,
      sourceMediaId: "fixture-main", sourceStartFrame: 750,
      candidateSegmentId: "candidate-hook", rightsDecisionId: "rights-project-original",
      evidenceIds: ["evidence-hook"],
      reason: "Reuse the approved synthetic close without introducing a new claim.",
      confidence: {
        localization: { value: 1, method: "fixture clock", calibrationStatus: "calibrated" },
        transcript: { value: 1, method: "project-authored card", calibrationStatus: "not-applicable" },
        semanticFit: { value: 1, method: "human review", calibrationStatus: "uncalibrated" },
      },
      ambiguities: [],
      requiresHumanReview: true,
      reviewState: "approved-for-fixture-only",
      untrustedTextPromotedToInstruction: false,
    }, {
      operationId: "caption-main", type: "caption", trackId: "caption-en",
      timelineStartFrame: 0, durationFrames: 1500,
      captionId: "caption-main", text: "[test tone] Verified Cut",
      evidenceIds: ["evidence-hook"], safeZoneState: "reviewed-pass",
      reviewer: "named caption reviewer",
    }, {
      operationId: "title-main", type: "title", trackId: "graphics",
      timelineStartFrame: 0, durationFrames: 180,
      text: "The Verified Cut", safeZoneState: "reviewed-pass",
      reviewer: "named graphics reviewer",
    }, {
      operationId: "audio-main", type: "audio", trackId: "audio-main",
      timelineStartFrame: 0, durationFrames: 1500,
      sampleRate: 48000, mode: "mix",
      action: "preserve-dialogue-and-normalize",
      reason: "Keep the approved source track on the declared 48 kHz clock.",
    }, {
      operationId: "crop-main", type: "crop", trackId: "video-main",
      timelineStartFrame: 0, durationFrames: 1500,
      sourceCrop: { x: 70, y: 0, width: 180, height: 180 },
      outputCanvas: { width: 1080, height: 1920 },
      safeZoneState: "reviewed-pass", reviewer: "named crop reviewer",
    }, {
      operationId: "transition-main", type: "transition", trackId: "video-main",
      timelineStartFrame: 745, durationFrames: 10,
      fromClipId: "clip-hook", toClipId: "clip-close",
      transitionKind: "cross-dissolve",
    }],
    unresolvedCriticalBlockers: [],
    publicationDecision: "do-not-publish",
  },
  "plan-diff-independent-approval": {
    schemaVersion: "aicourse.course20.plan-approval.v1",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    approvedPlanSha256: HASH_A,
    planDiffSha256: HASH_B,
    decision: "approved",
    reviewerRole: "independent plan reviewer",
    independenceBasis: "reviewer is distinct from the agent and executing tool",
    approvalScope: "local synthetic plan only; no release authority",
    approvedAt: "2026-08-28T00:00:00Z",
    agentSelfApproval: false,
    grantsPublicationAuthority: false,
  },
  "delivery-matrix-accessibility": `schemaVersion: aicourse.course20.delivery-matrix.v2
projectId: ${AGENTIC_VIDEO_EDITING_PROJECT_ID}
destination:
  name: local-browser
  contractObservedOn: "2026-08-28"
candidate:
  aspectRatio: "9:16"
  width: 1080
  height: 1920
  durationSeconds: 50
  container: mp4
  videoCodec: h264
  audioCodec: aac
  pixelFormat: yuv420p
  colorBranch: SDR
captions:
  required: true
  language: en
  speakerLabels: true
  nonSpeechCues: true
audio:
  sampleRate: 48000
  measurementStandard: ITU-R BS.1770
  targetLufs: -16
  toleranceLu: 1
  truePeakLimitDbtp: -1
  destinationEvidence: local course policy, not a universal platform target
crop:
  strategy: per-segment center-of-interest review
  safeZoneId: vertical-safe-v1
  perSegmentReview: true
accessibilityApplicability:
  captions: { status: required, rationale: test tone and cues convey audio information }
  transcript: { status: required, rationale: supports alternate reading }
  descriptiveTranscript: { status: required, rationale: visual cards carry meaning }
  audioDescription: { status: not-applicable, rationale: descriptive transcript is the selected core alternative }
  contrast: { status: required, rationale: titles carry meaning }
  flash: { status: required, rationale: fixture includes a deliberate flash fault to detect }
  playerSupport: { status: required, rationale: sidecar captions need an accessible player }
color:
  sourceTags: Rec.709
  workingTransform: Rec.709 scene to display-referred SDR
  displayTransform: Rec.709 gamma 2.4
  scopeChecks: waveform and vectorscope
  shotMatching: project-authored reference cards
  branch: SDR
`,
  "tool-policy-adversarial-recovery": {
    schemaVersion: "aicourse.course20.tool-policy.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    filesystem: { readRoots: ["staging/course-assets/agentic-video-editing/lab"], writeRoots: ["output/course20-lab"], followSymlinks: false, overwriteExisting: false },
    network: { allowed: false, egressAllowlist: [] },
    identity: { credentialsAccepted: false, secretsReadable: false, tokenAudience: "course20-local-sandbox", delegateMayBroadenAudience: false },
    cost: { paidGenerationAllowed: false, maximumExternalSpendUsd: 0 },
    publication: { allowed: false },
    execution: { shellAllowed: false, allowedExecutables: ["ffmpeg", "ffprobe", "node"], dryRunRequired: true, idempotencyRequired: true, undoRequired: true, timeoutSeconds: 120 },
    untrustedData: { mayChangePolicy: false, mayExpandAuthority: false },
    adversarialTests: COURSE20_REQUIRED_ADVERSARIAL_TEST_IDS.map((id) => ({ id, expectedDecision: "deny", observedDecision: "deny" })),
  },
  "render-receipt-output-probe": {
    schemaVersion: "aicourse.course20.render-receipt.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    bindings: { editPlanSha256: HASH_A, deliveryMatrixSha256: HASH_B, assetLedgerSha256: HASH_C, toolPolicySha256: HASH_A, buildConfigSha256: HASH_B, inputSha256s: [HASH_A] },
    engine: "ffmpeg-local", versions: { ffmpeg: "record at runtime", ffprobe: "record at runtime" },
    argv: ["ffmpeg", "-n", "-i", "source-master.mp4", "candidate.mp4"],
    dryRunPassed: true, overwritePrevented: true,
    output: { path: "output/course20-lab/candidate.mp4", sha256: HASH_C, probe: { container: "mp4", aspectRatio: "9:16", durationSeconds: 50, audioSampleRate: 48000 } },
    recovery: { undoTested: true, rollbackVerified: true }, status: "succeeded",
  },
  "candidate-media-reference": {
    schemaVersion: "aicourse.course20.media-reference.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    localPath: "output/course20-lab/candidate.mp4",
    mediaSha256: HASH_C,
    renderReceiptSha256: HASH_B,
    media: { container: "mp4", aspectRatio: "9:16", durationSeconds: 50, playable: true },
    selfAttestation: { notUploaded: true, learnerControlsLocalReference: true, rightsBasis: "project-authored fixture or learner-controlled media" },
  },
  "verification-repair-approval": {
    schemaVersion: "aicourse.course20.verification-report.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    candidateSha256: HASH_C,
    checks: Object.fromEntries(VERIFICATION_DIMENSIONS.map((dimension) => [dimension, { status: "pass", evidence: `record ${dimension} receipt` }])),
    repair: { performed: true, diff: ["fixed sync and caption cue"], rerendered: true, reverified: true, regressionPassed: true },
    approvalMatrix: { technicalReviewer: "named reviewer", semanticReviewer: "named reviewer", rightsReviewer: "named reviewer", releaseReviewer: "named reviewer" },
    releaseRecommendation: "candidate-verified",
  },
  "release-package-runbook-recovery": {
    schemaVersion: "aicourse.course20.release-package.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    candidateSha256: HASH_C,
    entries: AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
      .filter((contract) => contract.id !== "release-package-runbook-recovery" && contract.id !== "release-decision-postmortem")
      .map((contract) => ({ artifactId: contract.id, path: `package/${contract.filename}`, sha256: HASH_A })),
    runbook: { steps: ["verify hashes", "re-run probe", "review unresolved risks"], stopConditions: ["hash mismatch", "missing receipt", "authority mismatch"] },
    recoveryReceipt: { independentOperatorSucceeded: true, hiddenStateRequired: false, restoredCandidateSha256: HASH_C },
  },
  "release-decision-postmortem": {
    schemaVersion: "aicourse.course20.release-decision.v2",
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    candidateSha256: HASH_C,
    packageSha256: HASH_A,
    decision: "do-not-publish",
    unresolvedCriticalBlockers: [],
    reviewerRole: "named accountable reviewer",
    rationale: "The project-owned fixture is a local learning artifact and has no external release authority.",
    postmortem: "Record what passed, what remained bounded, and what would be required for a learner-owned release.",
    decidedAt: "2026-08-28T00:00:00Z",
    releaseAttestation: { agentHasReleaseAuthority: false, versionBound: true, unresolvedRisksRecorded: true },
  },
};

export function getCourse20PrimaryArtifactIdForModule(
  slug: AgenticVideoEditingModuleSlug,
): AgenticVideoEditingArtifactId {
  return resolveArtifactId(slug);
}

export function getCourse20ModuleArtifactIds(
  slug: AgenticVideoEditingModuleSlug,
): readonly AgenticVideoEditingArtifactId[] {
  return getAgenticVideoEditingModuleArtifactContracts(slug)
    .filter((contract) => contract.requiredForModuleCompletion)
    .map((contract) => contract.id);
}

export function validateCourse20ContractRegistry(): string[] {
  const errors: string[] = [];
  const ids = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.map((contract) => contract.id);
  if (ids.length !== 13 || new Set(ids).size !== 13) {
    errors.push("Course 20 requires thirteen unique process artifacts: twelve Capstone artifacts plus the non-Capstone M7 delivery-plan input.");
  }
  const registeredCapstoneIds = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
    .filter((contract) => contract.requiredForCapstone)
    .map((contract) => contract.id);
  if (JSON.stringify(registeredCapstoneIds)
    !== JSON.stringify(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS)) {
    errors.push("The artifact registry must expose the exact twelve Capstone IDs in canonical order.");
  }
  const position = new Map(ids.map((id, index) => [id, index]));
  for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
    for (const dependency of contract.dependsOn) {
      if (!position.has(dependency)) errors.push(`${contract.id}: unknown dependency ${dependency}.`);
      if ((position.get(dependency) ?? Number.POSITIVE_INFINITY) >= (position.get(contract.id) ?? -1)) {
        errors.push(`${contract.id}: dependency ${dependency} must precede the artifact.`);
      }
    }
    if (!ARTIFACT_VALIDATORS[contract.id]) errors.push(`${contract.id}: missing semantic validator.`);
  }
  for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    const registered = getCourse20ModuleArtifactIds(moduleRecord.slug);
    if (JSON.stringify(registered) !== JSON.stringify(moduleRecord.artifactIds)) {
      errors.push(`${moduleRecord.slug}: manifest artifact IDs drifted from the registry.`);
    }
  }
  return errors;
}
