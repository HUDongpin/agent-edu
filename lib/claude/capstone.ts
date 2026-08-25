export const CLAUDE_CAPSTONE_SCHEMA_VERSION = "1.0.0" as const;

export const CLAUDE_CAPSTONE_ARTIFACT_IDS = [
  "task-brief",
  "input-log",
  "run-log",
  "deliverable",
  "verification-record",
  "disclosure-reflection",
] as const;

export const CLAUDE_CAPSTONE_RUBRIC = [
  { id: "delegation", weight: 25 },
  { id: "description", weight: 25 },
  { id: "discernment", weight: 30 },
  { id: "diligence", weight: 20 },
] as const;

export const CLAUDE_CAPSTONE_PASSING_SCORE = 80 as const;
export const CLAUDE_CAPSTONE_PROGRESS_KEY = "claude.capstone.v1" as const;
export const CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY = "claude.capstone.criticalClear" as const;

export function claudeCapstoneArtifactProgressKey(id: ClaudeCapstoneArtifactId): string {
  return `claude.capstone.artifact.${id}`;
}

export function claudeCapstoneRubricProgressKey(id: ClaudeCapstoneRubricId): string {
  return `claude.capstone.rubric.${id}`;
}

function validRubricScore(value: unknown, maximum: number): number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= maximum
    ? value
    : 0;
}

export function getClaudeCapstoneRubricScore(progress: Readonly<Record<string, unknown>>): number {
  return CLAUDE_CAPSTONE_RUBRIC.reduce((total, criterion) => (
    total + validRubricScore(progress[claudeCapstoneRubricProgressKey(criterion.id)], criterion.weight)
  ), 0);
}

export function isClaudeCapstoneSelfAuditPassed(progress: Readonly<Record<string, unknown>>): boolean {
  return progress[CLAUDE_CAPSTONE_PROGRESS_KEY] === true
    && progress[CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY] === true
    && CLAUDE_CAPSTONE_ARTIFACT_IDS.every(
      (id) => progress[claudeCapstoneArtifactProgressKey(id)] === true,
    )
    && getClaudeCapstoneRubricScore(progress) >= CLAUDE_CAPSTONE_PASSING_SCORE;
}

export const CLAUDE_CAPSTONE = {
  schemaVersion: CLAUDE_CAPSTONE_SCHEMA_VERSION,
  artifactIds: CLAUDE_CAPSTONE_ARTIFACT_IDS,
  rubric: CLAUDE_CAPSTONE_RUBRIC,
  passingScore: CLAUDE_CAPSTONE_PASSING_SCORE,
  progressKey: CLAUDE_CAPSTONE_PROGRESS_KEY,
  criticalClearKey: CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY,
} as const;

export type ClaudeCapstoneArtifactId = (typeof CLAUDE_CAPSTONE_ARTIFACT_IDS)[number];
export type ClaudeCapstoneRubricId = (typeof CLAUDE_CAPSTONE_RUBRIC)[number]["id"];
