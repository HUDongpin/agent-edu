export { CODEX_CAPSTONE_DRAFT_STORAGE_KEY } from "../progress-storage-contract";
export const CODEX_CAPSTONE_DRAFT_VERSION = 1 as const;
export const CODEX_CAPSTONE_DRAFT_MAX_LENGTH = 262_144 as const;

export type CodexCapstoneDraftContract = {
  readonly receiptSchema: string;
  readonly fixtureVersion: string;
  readonly fixtureSha256: string;
};

export type CodexCapstoneDraftV1 = CodexCapstoneDraftContract & {
  readonly version: typeof CODEX_CAPSTONE_DRAFT_VERSION;
  readonly input: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validInput(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= CODEX_CAPSTONE_DRAFT_MAX_LENGTH;
}

export function createCodexCapstoneDraft(
  input: string,
  contract: CodexCapstoneDraftContract,
): CodexCapstoneDraftV1 {
  if (!validInput(input)) {
    throw new RangeError(
      `Codex capstone draft must contain 1-${CODEX_CAPSTONE_DRAFT_MAX_LENGTH} characters`,
    );
  }
  return {
    version: CODEX_CAPSTONE_DRAFT_VERSION,
    receiptSchema: contract.receiptSchema,
    fixtureVersion: contract.fixtureVersion,
    fixtureSha256: contract.fixtureSha256,
    input,
  };
}

export function parseCodexCapstoneDraft(
  value: unknown,
  contract: CodexCapstoneDraftContract,
): string | null {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return null;
    }
  }
  if (!isRecord(candidate)) return null;
  const keys = Object.keys(candidate).sort();
  const expected = [
    "fixtureSha256",
    "fixtureVersion",
    "input",
    "receiptSchema",
    "version",
  ].sort();
  if (keys.join("|") !== expected.join("|")) return null;
  if (candidate.version !== CODEX_CAPSTONE_DRAFT_VERSION) return null;
  if (candidate.receiptSchema !== contract.receiptSchema) return null;
  if (candidate.fixtureVersion !== contract.fixtureVersion) return null;
  if (candidate.fixtureSha256 !== contract.fixtureSha256) return null;
  return validInput(candidate.input) ? candidate.input : null;
}
