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

export const COURSE_KIT_EVIDENCE_RECEIPT_ISSUE_CODES = [
  "empty",
  "invalid-json",
  "invalid-schema",
  "invalid-artifact-path",
  "invalid-sha256",
  "invalid-validator",
  "invalid-reviewer",
  "invalid-limitations",
] as const;

export type CourseKitEvidenceReceiptIssueCode =
  (typeof COURSE_KIT_EVIDENCE_RECEIPT_ISSUE_CODES)[number];

export interface CourseKitEvidenceReceiptValidationIssue {
  readonly code: CourseKitEvidenceReceiptIssueCode;
}

export type CourseKitEvidenceReceiptValidationResult =
  | {
      readonly valid: true;
      readonly receipt: CourseKitEvidenceReceipt;
      readonly issues: readonly [];
    }
  | {
      readonly valid: false;
      readonly receipt: null;
      readonly issues: readonly CourseKitEvidenceReceiptValidationIssue[];
    };

export interface CourseKitEvidenceReceiptValidationOptions {
  /** Bind a structurally valid receipt to the exact artifact this gate expects. */
  readonly expectedArtifactPath?: string;
}

export function createCourseKitEvidenceReceiptTemplate(
  artifactPath = "outputs/REPLACE_WITH_ARTIFACT.json",
): string {
  return JSON.stringify({
    schemaVersion: COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
    artifactPath,
    sha256: "REPLACE_WITH_64_HEX_CHARACTERS",
    validator: {
      command: "REPLACE_WITH_OFFLINE_VALIDATOR_COMMAND",
      status: "pass",
      checkedOn: "YYYY-MM-DD",
    },
    reviewer: {
      name: "REPLACE_WITH_NAMED_HUMAN_REVIEWER",
      role: "REPLACE_WITH_REVIEW_ROLE",
      human: true,
      decision: "accept-with-limitations",
    },
    limitations: ["REPLACE_WITH_AT_LEAST_ONE_EXPLICIT_BOUNDARY"],
  }, null, 2);
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

function isResolvedTemplateText(value: unknown): value is string {
  return typeof value === "string"
    && Boolean(value.trim())
    && !value.includes("REPLACE_WITH_");
}

/**
 * Validate a learner-supplied receipt without reading their local files.
 *
 * The browser can check the receipt's structure, not whether the claimed hash,
 * command, reviewer, or artifact is truthful. The course therefore treats a
 * valid receipt as reviewable evidence, never as automatic proof.
 */
export function validateCourseKitEvidenceReceipt(
  value: string,
  options: CourseKitEvidenceReceiptValidationOptions = {},
): CourseKitEvidenceReceiptValidationResult {
  if (!value.trim()) {
    return {
      valid: false,
      receipt: null,
      issues: [{ code: "empty" }],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return {
      valid: false,
      receipt: null,
      issues: [{ code: "invalid-json" }],
    };
  }

  if (!isRecord(parsed)) {
    return {
      valid: false,
      receipt: null,
      issues: [{ code: "invalid-schema" }],
    };
  }

  const issues: CourseKitEvidenceReceiptValidationIssue[] = [];
  if (parsed.schemaVersion !== COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA) {
    issues.push({ code: "invalid-schema" });
  }
  if (!isSafeRelativePath(parsed.artifactPath)
    || !isResolvedTemplateText(parsed.artifactPath)
    || (options.expectedArtifactPath !== undefined
      && parsed.artifactPath !== options.expectedArtifactPath)) {
    issues.push({ code: "invalid-artifact-path" });
  }
  if (typeof parsed.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(parsed.sha256)) {
    issues.push({ code: "invalid-sha256" });
  }
  if (!isRecord(parsed.validator)
    || !isResolvedTemplateText(parsed.validator.command)
    || parsed.validator.status !== "pass"
    || !isIsoDate(parsed.validator.checkedOn)) {
    issues.push({ code: "invalid-validator" });
  }
  if (!isRecord(parsed.reviewer)
    || !isResolvedTemplateText(parsed.reviewer.name)
    || !isResolvedTemplateText(parsed.reviewer.role)
    || parsed.reviewer.human !== true
    || !["accept", "accept-with-limitations"].includes(String(parsed.reviewer.decision))) {
    issues.push({ code: "invalid-reviewer" });
  }
  if (!Array.isArray(parsed.limitations)
    || parsed.limitations.length === 0
    || parsed.limitations.some((item) => !isResolvedTemplateText(item))) {
    issues.push({ code: "invalid-limitations" });
  }

  if (issues.length > 0) {
    return {
      valid: false,
      receipt: null,
      issues,
    };
  }

  return {
    valid: true,
    receipt: parsed as unknown as CourseKitEvidenceReceipt,
    issues: [],
  };
}

export function parseCourseKitEvidenceReceipt(
  value: string,
  options: CourseKitEvidenceReceiptValidationOptions = {},
): CourseKitEvidenceReceipt | null {
  const result = validateCourseKitEvidenceReceipt(value, options);
  return result.valid ? result.receipt : null;
}

export function isCourseKitEvidenceReceipt(
  value: string,
  options: CourseKitEvidenceReceiptValidationOptions = {},
): boolean {
  return parseCourseKitEvidenceReceipt(value, options) !== null;
}
