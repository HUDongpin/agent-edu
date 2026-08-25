export const CODEX_CAPSTONE_SCHEMA_VERSION = "1.0.0" as const;

export const CODEX_CAPSTONE_STAGE_IDS = [
  "contract",
  "orient",
  "plan",
  "implement",
  "verify",
  "review",
  "handoff",
] as const;

export const CODEX_CAPSTONE_ARTIFACT_IDS = [
  "task-contract",
  "orientation-note",
  "approved-plan",
  "reviewed-diff",
  "verification-record",
  "handoff",
] as const;

export const CODEX_CAPSTONE_RUBRIC = [
  { id: "scope", weight: 20 },
  { id: "safety", weight: 20 },
  { id: "implementation", weight: 20 },
  { id: "verification", weight: 25 },
  { id: "handoff", weight: 15 },
] as const;

export const CODEX_CAPSTONE_PASSING_SCORE = 80 as const;

export const CODEX_CAPSTONE_RECEIPT_SCHEMA = "aicourse.codex.capstone.v1" as const;
export const CODEX_CAPSTONE_RECEIPT_VERSION = "1" as const;
export const CODEX_CAPSTONE_FIXTURE_VERSION = "1" as const;
// Hash of course-fixture.json inside the starter ZIP. The adjacent public
// .sha256 file separately protects the ZIP bytes during download.
export const CODEX_CAPSTONE_FIXTURE_SHA256 = "66b0eacf5bf947fc0ac530ee31803404ee896550266699cb818908a2deca1d95" as const;

export const CODEX_CAPSTONE_REQUIRED_CHECKS = [
  "tests",
  "lint",
  "build",
  "routesPreserved",
  "keyboardBehavior",
  "noNewDependencies",
] as const;

export type CodexCapstoneRequiredCheck = (typeof CODEX_CAPSTONE_REQUIRED_CHECKS)[number];

export interface CodexCapstoneReceipt {
  readonly schema: typeof CODEX_CAPSTONE_RECEIPT_SCHEMA;
  readonly fixtureVersion: typeof CODEX_CAPSTONE_FIXTURE_VERSION;
  readonly fixtureSha256: typeof CODEX_CAPSTONE_FIXTURE_SHA256;
  readonly checks: Readonly<Record<CodexCapstoneRequiredCheck, true>>;
}

export type CodexCapstoneReceiptValidationCode =
  | "valid"
  | "invalid-json"
  | "wrong-schema"
  | "wrong-version"
  | "incomplete"
  | "wrong-hash";

export interface CodexCapstoneReceiptValidation {
  readonly valid: boolean;
  readonly code: CodexCapstoneReceiptValidationCode;
  readonly receipt?: CodexCapstoneReceipt;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCodexCapstoneReceipt(input: string): CodexCapstoneReceiptValidation {
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
  if (parsed.schema !== CODEX_CAPSTONE_RECEIPT_SCHEMA) return { valid: false, code: "wrong-schema" };
  if (parsed.fixtureVersion !== CODEX_CAPSTONE_FIXTURE_VERSION) return { valid: false, code: "wrong-version" };
  if (parsed.fixtureSha256 !== CODEX_CAPSTONE_FIXTURE_SHA256) return { valid: false, code: "wrong-hash" };
  const checks = parsed.checks;
  if (!isRecord(checks)) return { valid: false, code: "incomplete" };
  const checkKeys = Object.keys(checks).sort();
  const expectedKeys = [...CODEX_CAPSTONE_REQUIRED_CHECKS].sort();
  if (checkKeys.join("|") !== expectedKeys.join("|")) return { valid: false, code: "incomplete" };
  if (!CODEX_CAPSTONE_REQUIRED_CHECKS.every((check) => checks[check] === true)) {
    return { valid: false, code: "incomplete" };
  }
  return { valid: true, code: "valid", receipt: parsed as unknown as CodexCapstoneReceipt };
}

export const CODEX_CAPSTONE_RECEIPT_STARTER = {
  schema: CODEX_CAPSTONE_RECEIPT_SCHEMA,
  fixtureVersion: CODEX_CAPSTONE_FIXTURE_VERSION,
  fixtureSha256: CODEX_CAPSTONE_FIXTURE_SHA256,
  checks: Object.fromEntries(CODEX_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, false])),
} as const;

export const CODEX_CAPSTONE = {
  schemaVersion: CODEX_CAPSTONE_SCHEMA_VERSION,
  stageIds: CODEX_CAPSTONE_STAGE_IDS,
  artifactIds: CODEX_CAPSTONE_ARTIFACT_IDS,
  rubric: CODEX_CAPSTONE_RUBRIC,
  passingScore: CODEX_CAPSTONE_PASSING_SCORE,
  receiptSchema: CODEX_CAPSTONE_RECEIPT_SCHEMA,
  receiptVersion: CODEX_CAPSTONE_RECEIPT_VERSION,
  fixtureVersion: CODEX_CAPSTONE_FIXTURE_VERSION,
  fixtureSha256: CODEX_CAPSTONE_FIXTURE_SHA256,
  requiredChecks: CODEX_CAPSTONE_REQUIRED_CHECKS,
  receiptStarter: CODEX_CAPSTONE_RECEIPT_STARTER,
} as const;

export type CodexCapstoneStageId = (typeof CODEX_CAPSTONE_STAGE_IDS)[number];
export type CodexCapstoneArtifactId = (typeof CODEX_CAPSTONE_ARTIFACT_IDS)[number];
export type CodexCapstoneRubricId = (typeof CODEX_CAPSTONE_RUBRIC)[number]["id"];
