export const CURSOR_CAPSTONE_SCHEMA_VERSION = "1.0.0" as const;

export const CURSOR_CAPSTONE_STAGE_IDS = [
  "contract",
  "orient",
  "plan",
  "implement",
  "verify",
  "review",
  "handoff",
] as const;

export const CURSOR_CAPSTONE_ARTIFACT_IDS = [
  "task-contract",
  "orientation-note",
  "approved-plan",
  "reviewed-diff",
  "verification-record",
  "handoff",
] as const;

export const CURSOR_CAPSTONE_RUBRIC = [
  { id: "scope", weight: 20 },
  { id: "safety", weight: 20 },
  { id: "implementation", weight: 20 },
  { id: "verification", weight: 25 },
  { id: "handoff", weight: 15 },
] as const;

export const CURSOR_CAPSTONE_PASSING_SCORE = 80 as const;

export const CURSOR_CAPSTONE_RECEIPT_SCHEMA = "aicourse.cursor.capstone.v1" as const;
export const CURSOR_CAPSTONE_RECEIPT_VERSION = "1" as const;
export const CURSOR_CAPSTONE_FIXTURE_VERSION = "1" as const;
export const CURSOR_CAPSTONE_FIXTURE_SHA256 = "3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b" as const;
export const CURSOR_CAPSTONE_ARCHIVE_SHA256 = "4d7623fee2771309cac1d87c33da30883bec58938bcdc67a8f3995156f31a34e" as const;

export const CURSOR_CAPSTONE_REQUIRED_CHECKS = [
  "tests",
  "lint",
  "build",
  "routesPreserved",
  "keyboardBehavior",
  "noNewDependencies",
] as const;

export type CursorCapstoneRequiredCheck = (typeof CURSOR_CAPSTONE_REQUIRED_CHECKS)[number];

export interface CursorCapstoneReceipt {
  readonly schema: typeof CURSOR_CAPSTONE_RECEIPT_SCHEMA;
  readonly fixtureVersion: typeof CURSOR_CAPSTONE_FIXTURE_VERSION;
  readonly fixtureSha256: typeof CURSOR_CAPSTONE_FIXTURE_SHA256;
  readonly checks: Readonly<Record<CursorCapstoneRequiredCheck, true>>;
}

export type CursorCapstoneReceiptValidationCode =
  | "valid"
  | "invalid-json"
  | "wrong-schema"
  | "wrong-version"
  | "incomplete"
  | "wrong-hash";

export interface CursorCapstoneReceiptValidation {
  readonly valid: boolean;
  readonly code: CursorCapstoneReceiptValidationCode;
  readonly receipt?: CursorCapstoneReceipt;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCursorCapstoneReceipt(input: string): CursorCapstoneReceiptValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { valid: false, code: "invalid-json" };
  }
  if (!isRecord(parsed)) return { valid: false, code: "incomplete" };
  const topLevelKeys = Object.keys(parsed).sort();
  const expectedTopLevelKeys = ["schema", "fixtureVersion", "fixtureSha256", "checks"].sort();
  if (topLevelKeys.join("|") !== expectedTopLevelKeys.join("|")) {
    return { valid: false, code: "incomplete" };
  }
  if (parsed.schema !== CURSOR_CAPSTONE_RECEIPT_SCHEMA) return { valid: false, code: "wrong-schema" };
  if (parsed.fixtureVersion !== CURSOR_CAPSTONE_FIXTURE_VERSION) return { valid: false, code: "wrong-version" };
  if (parsed.fixtureSha256 !== CURSOR_CAPSTONE_FIXTURE_SHA256) return { valid: false, code: "wrong-hash" };
  const checks = parsed.checks;
  if (!isRecord(checks)) return { valid: false, code: "incomplete" };
  const checkKeys = Object.keys(checks).sort();
  const expectedKeys = [...CURSOR_CAPSTONE_REQUIRED_CHECKS].sort();
  if (checkKeys.join("|") !== expectedKeys.join("|")) return { valid: false, code: "incomplete" };
  if (!CURSOR_CAPSTONE_REQUIRED_CHECKS.every((check) => checks[check] === true)) {
    return { valid: false, code: "incomplete" };
  }
  return { valid: true, code: "valid", receipt: parsed as unknown as CursorCapstoneReceipt };
}

export const CURSOR_CAPSTONE_RECEIPT_STARTER = {
  schema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
  fixtureVersion: CURSOR_CAPSTONE_FIXTURE_VERSION,
  fixtureSha256: CURSOR_CAPSTONE_FIXTURE_SHA256,
  checks: Object.fromEntries(CURSOR_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, false])),
} as const;

export const CURSOR_CAPSTONE = {
  schemaVersion: CURSOR_CAPSTONE_SCHEMA_VERSION,
  stageIds: CURSOR_CAPSTONE_STAGE_IDS,
  artifactIds: CURSOR_CAPSTONE_ARTIFACT_IDS,
  rubric: CURSOR_CAPSTONE_RUBRIC,
  passingScore: CURSOR_CAPSTONE_PASSING_SCORE,
  receiptSchema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
  receiptVersion: CURSOR_CAPSTONE_RECEIPT_VERSION,
  fixtureVersion: CURSOR_CAPSTONE_FIXTURE_VERSION,
  fixtureSha256: CURSOR_CAPSTONE_FIXTURE_SHA256,
  archiveSha256: CURSOR_CAPSTONE_ARCHIVE_SHA256,
  requiredChecks: CURSOR_CAPSTONE_REQUIRED_CHECKS,
  receiptStarter: CURSOR_CAPSTONE_RECEIPT_STARTER,
} as const;

export type CursorCapstoneStageId = (typeof CURSOR_CAPSTONE_STAGE_IDS)[number];
export type CursorCapstoneArtifactId = (typeof CURSOR_CAPSTONE_ARTIFACT_IDS)[number];
export type CursorCapstoneRubricId = (typeof CURSOR_CAPSTONE_RUBRIC)[number]["id"];
