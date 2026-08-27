export const COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA =
  "aicourse.evidence-receipt.v1" as const;

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
    && /^aicourse\.[a-z0-9-]+\.validator\.v\d+$/.test(value);
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
  if (typeof parsed.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(parsed.sha256)) {
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
