export const COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA =
  "aicourse.evidence-receipt.v1" as const;
export const COURSE_KIT_MODULE_EVIDENCE_RECEIPT_SCHEMA =
  "aicourse.module-evidence-receipt.v2" as const;

export interface CourseKitModuleEvidenceReceipt {
  readonly schemaVersion: typeof COURSE_KIT_MODULE_EVIDENCE_RECEIPT_SCHEMA;
  readonly courseId: string;
  readonly courseVersion: string;
  readonly moduleSlug: string;
  readonly artifactId: string;
  readonly artifactPath: string;
  readonly artifactSha256: string;
  readonly inputArtifactIdsAndHashes: Readonly<Record<string, string>>;
  readonly artifactSchemaId: string;
  readonly validatorId: string;
  readonly validatorVersion: string;
  readonly executedCommand: string;
  readonly validatedAt: string;
  readonly status: "pass";
  readonly limitations: readonly string[];
}

export interface CourseKitModuleEvidenceReceiptBinding {
  readonly courseId: string;
  readonly courseVersion: string;
  readonly moduleSlug: string;
  readonly artifactIds: readonly string[];
  readonly inputArtifactIds: readonly string[];
  readonly inputArtifactHashes?: Readonly<Record<string, string>>;
  readonly artifactSchemaId: string;
  readonly validatorId: string;
  readonly validatorCommand: string;
}

export interface CourseKitEvidenceReceipt {
  readonly schemaVersion: typeof COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA;
  readonly kind: "module-artifact" | "capstone-artifact";
  readonly courseId: string;
  readonly courseVersion: string;
  readonly artifactId: string;
  readonly artifactPath: string;
  readonly sha256: string;
  readonly validator: {
    readonly id: string;
    readonly command: string;
    readonly status: "pass";
    readonly checkedOn: string;
  };
  readonly reviewer: {
    readonly role: string;
    readonly decision: "accept" | "accept-with-limitations";
  };
  readonly limitations: readonly string[];
}

export interface CourseKitEvidenceReceiptBinding {
  readonly kind: CourseKitEvidenceReceipt["kind"];
  readonly courseId: string;
  readonly courseVersion: string;
  readonly artifactId: string;
  readonly validatorId: string;
  readonly validatorCommandPrefix: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isIsoDateOrTimestamp(value: unknown): value is string {
  if (isIsoDate(value)) return true;
  if (typeof value !== "string" || value.length > 40) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function isSafeRelativePath(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= 500
    && !value.startsWith("/")
    && !value.includes("\\")
    && !value.split("/").includes("..");
}

function isStableId(value: unknown): value is string {
  return typeof value === "string"
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isVersion(value: unknown): value is string {
  return typeof value === "string"
    && value.length <= 100
    && /^(?=.*\d)[0-9A-Za-z][0-9A-Za-z._-]*$/.test(value);
}

function isValidatorId(value: unknown): value is string {
  return typeof value === "string"
    && /^aicourse(?:\.[a-z0-9-]+)+\.v\d+$/.test(value);
}

function isPlausibleSha256(value: unknown): value is string {
  return typeof value === "string"
    && /^[a-f0-9]{64}$/.test(value)
    && !/^([a-f0-9])\1{63}$/.test(value)
    && value !== "deadbeef".repeat(8);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const observed = Object.keys(value).sort();
  const expected = [...keys].sort();
  return observed.length === expected.length
    && observed.every((key, index) => key === expected[index]);
}

function commandMatchesContract(executed: string, contract: string): boolean {
  if (!executed.trim() || executed.length > 1000 || /[\r\n]/.test(executed)) return false;
  const escaped = contract
    .split(/(<[^>]+>)/g)
    .map((part) => part.startsWith("<") && part.endsWith(">")
      ? "[^\\s]+"
      : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("");
  return new RegExp(`^${escaped}$`).test(executed);
}

function validatorVersionFromId(validatorId: string): string | null {
  return validatorId.match(/\.(v\d+)$/)?.[1] ?? null;
}

/**
 * Validate the Course Kit v2 module receipt and its declared artifact lineage.
 * This binds browser progress to exact receipt claims; it still cannot prove
 * that the local file exists or that the validator was genuinely executed.
 */
export function parseCourseKitModuleEvidenceReceipt(
  value: string,
  expected: CourseKitModuleEvidenceReceiptBinding,
): CourseKitModuleEvidenceReceipt | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !hasOnlyKeys(parsed, [
    "schemaVersion",
    "courseId",
    "courseVersion",
    "moduleSlug",
    "artifactId",
    "artifactPath",
    "artifactSha256",
    "inputArtifactIdsAndHashes",
    "artifactSchemaId",
    "validatorId",
    "validatorVersion",
    "executedCommand",
    "validatedAt",
    "status",
    "limitations",
  ])) return null;
  if (parsed.schemaVersion !== COURSE_KIT_MODULE_EVIDENCE_RECEIPT_SCHEMA
    || parsed.courseId !== expected.courseId
    || parsed.courseVersion !== expected.courseVersion
    || parsed.moduleSlug !== expected.moduleSlug
    || typeof parsed.artifactId !== "string"
    || !expected.artifactIds.includes(parsed.artifactId)
    || parsed.artifactSchemaId !== expected.artifactSchemaId
    || parsed.validatorId !== expected.validatorId
    || !isValidatorId(parsed.validatorId)
    || parsed.validatorVersion !== validatorVersionFromId(expected.validatorId)
    || typeof parsed.executedCommand !== "string"
    || !commandMatchesContract(parsed.executedCommand, expected.validatorCommand)
    || parsed.status !== "pass") {
    return null;
  }
  if (!isSafeRelativePath(parsed.artifactPath)
    || !isPlausibleSha256(parsed.artifactSha256)
    || !isIsoDateOrTimestamp(parsed.validatedAt)) {
    return null;
  }
  if (!isRecord(parsed.inputArtifactIdsAndHashes)) return null;
  const inputIds = Object.keys(parsed.inputArtifactIdsAndHashes).sort();
  const expectedInputIds = [...expected.inputArtifactIds].sort();
  if (inputIds.length !== expectedInputIds.length
    || inputIds.some((id, index) => id !== expectedInputIds[index])) {
    return null;
  }
  for (const [artifactId, hash] of Object.entries(parsed.inputArtifactIdsAndHashes)) {
    if (!isStableId(artifactId) || !isPlausibleSha256(hash)) return null;
    if (expected.inputArtifactHashes
      && expected.inputArtifactHashes[artifactId] !== hash) return null;
  }
  if (!Array.isArray(parsed.limitations)
    || parsed.limitations.some((item) => typeof item !== "string" || !item.trim())) {
    return null;
  }
  return parsed as unknown as CourseKitModuleEvidenceReceipt;
}

export function isCourseKitModuleEvidenceReceipt(
  value: string,
  expected: CourseKitModuleEvidenceReceiptBinding,
): boolean {
  return parseCourseKitModuleEvidenceReceipt(value, expected) !== null;
}

/**
 * Validate a learner-supplied receipt without reading their local files.
 *
 * The browser can check the receipt's structure, not whether the claimed hash,
 * command, reviewer, or artifact is truthful. The course therefore treats a
 * valid receipt as reviewable evidence, never as automatic proof.
 */
export function parseCourseKitEvidenceReceipt(
  value: string,
  expected?: CourseKitEvidenceReceiptBinding,
): CourseKitEvidenceReceipt | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.schemaVersion !== COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA) return null;
  if (parsed.kind !== "module-artifact" && parsed.kind !== "capstone-artifact") {
    return null;
  }
  if (!isStableId(parsed.courseId) || !isVersion(parsed.courseVersion)) return null;
  if (!isStableId(parsed.artifactId)) return null;
  if (expected && (
    parsed.kind !== expected.kind
    || parsed.courseId !== expected.courseId
    || parsed.courseVersion !== expected.courseVersion
    || parsed.artifactId !== expected.artifactId
    || !isRecord(parsed.validator)
    || parsed.validator.id !== expected.validatorId
    || typeof parsed.validator.command !== "string"
    || !parsed.validator.command.startsWith(expected.validatorCommandPrefix)
  )) {
    return null;
  }
  if (!isSafeRelativePath(parsed.artifactPath)) return null;
  if (!isPlausibleSha256(parsed.sha256)) {
    return null;
  }
  if (!isRecord(parsed.validator)
    || !isValidatorId(parsed.validator.id)
    || typeof parsed.validator.command !== "string"
    || !parsed.validator.command.trim()
    || parsed.validator.status !== "pass"
    || !isIsoDate(parsed.validator.checkedOn)) {
    return null;
  }
  if (!isRecord(parsed.reviewer)
    || typeof parsed.reviewer.role !== "string"
    || !parsed.reviewer.role.trim()
    || !["accept", "accept-with-limitations"].includes(String(parsed.reviewer.decision))) {
    return null;
  }
  if (!Array.isArray(parsed.limitations)
    || parsed.limitations.some((item) => typeof item !== "string" || !item.trim())) {
    return null;
  }
  return parsed as unknown as CourseKitEvidenceReceipt;
}

export function isCourseKitEvidenceReceipt(
  value: string,
  expected?: CourseKitEvidenceReceiptBinding,
): boolean {
  return parseCourseKitEvidenceReceipt(value, expected) !== null;
}
