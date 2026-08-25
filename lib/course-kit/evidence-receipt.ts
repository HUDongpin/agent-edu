export const COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA =
  "aicourse.evidence-receipt.v1" as const;

export interface CourseKitEvidenceReceipt {
  readonly schemaVersion: typeof COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA;
  readonly artifactPath: string;
  readonly sha256: string;
  readonly validator: {
    readonly command: string;
    readonly status: "pass";
    readonly checkedOn: string;
  };
  readonly reviewer: {
    readonly name: string;
    readonly role: string;
    readonly human: true;
    readonly decision: "accept" | "accept-with-limitations";
  };
  readonly limitations: readonly string[];
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
    && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value)
    && !value.startsWith("/")
    && !value.startsWith("//")
    && !value.includes("://")
    && !value.includes("\\")
    && value.split("/").every((segment) => segment !== "." && segment !== "..");
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
): CourseKitEvidenceReceipt | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.schemaVersion !== COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA) return null;
  if (!isSafeRelativePath(parsed.artifactPath)) return null;
  if (typeof parsed.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(parsed.sha256)) {
    return null;
  }
  if (!isRecord(parsed.validator)
    || typeof parsed.validator.command !== "string"
    || !parsed.validator.command.trim()
    || parsed.validator.status !== "pass"
    || !isIsoDate(parsed.validator.checkedOn)) {
    return null;
  }
  if (!isRecord(parsed.reviewer)
    || typeof parsed.reviewer.name !== "string"
    || !parsed.reviewer.name.trim()
    || typeof parsed.reviewer.role !== "string"
    || !parsed.reviewer.role.trim()
    || parsed.reviewer.human !== true
    || !["accept", "accept-with-limitations"].includes(String(parsed.reviewer.decision))) {
    return null;
  }
  if (!Array.isArray(parsed.limitations)
    || parsed.limitations.length === 0
    || parsed.limitations.some((item) => typeof item !== "string" || !item.trim())) {
    return null;
  }
  return parsed as unknown as CourseKitEvidenceReceipt;
}

export function isCourseKitEvidenceReceipt(value: string): boolean {
  return parseCourseKitEvidenceReceipt(value) !== null;
}
