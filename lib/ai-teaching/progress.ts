import {
  AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
  agenticTeachingArtifactRubricFingerprint,
  agenticTeachingCheckpointBlueprintId,
  agenticTeachingFinalQuizBlueprintId,
  getAgenticTeachingArtifactRubric,
  getAgenticTeachingCheckpointContract,
} from "./contracts";
import {
  AGENTIC_TEACHING_MODULE_SLUGS,
  AGENTIC_TEACHING_VERSION,
  type AgenticTeachingContentLocale,
  type AgenticTeachingModuleSlug,
} from "./types";

export const AGENTIC_TEACHING_PROGRESS_EVENT = "ai-teaching:progress-change" as const;
export const AGENTIC_TEACHING_PROGRESS_SCHEMA = 2 as const;
export const AGENTIC_TEACHING_QUIZ_KEY = "agenticTeaching.quiz.v2";
export const AGENTIC_TEACHING_CAPSTONE_KEY = "agenticTeaching.capstone.v2";
export const AGENTIC_TEACHING_QUIZ_BLUEPRINT =
  agenticTeachingFinalQuizBlueprintId();
export const AGENTIC_TEACHING_QUIZ_QUESTION_COUNT =
  AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questionCount;
export const AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT =
  AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.requiredCorrect;

export { agenticTeachingCheckpointBlueprintId } from "./contracts";

export const AGENTIC_TEACHING_MODULE_PROGRESS_KEYS =
  AGENTIC_TEACHING_MODULE_SLUGS.map(
    (slug) => `agenticTeaching.module.${slug}` as const,
  );

export const AGENTIC_TEACHING_MILESTONE_COUNT =
  AGENTIC_TEACHING_MODULE_PROGRESS_KEYS.length + 2;

export interface AgenticTeachingArtifactRecord {
  readonly schema: typeof AGENTIC_TEACHING_PROGRESS_SCHEMA;
  readonly courseVersion: typeof AGENTIC_TEACHING_VERSION;
  readonly revisionId: string;
  readonly contentLocale: AgenticTeachingContentLocale;
  readonly text: string;
}

export interface AgenticTeachingCheckpointReceipt {
  readonly schema: typeof AGENTIC_TEACHING_PROGRESS_SCHEMA;
  readonly courseVersion: typeof AGENTIC_TEACHING_VERSION;
  readonly blueprintId: string;
  readonly contentLocale: AgenticTeachingContentLocale;
  readonly selectedOptionId: string;
  readonly passed: true;
}

export interface AgenticTeachingModuleReceipt {
  readonly schema: typeof AGENTIC_TEACHING_PROGRESS_SCHEMA;
  readonly courseVersion: typeof AGENTIC_TEACHING_VERSION;
  readonly artifactRevisionId: string;
  readonly artifactContentLocale: AgenticTeachingContentLocale;
  readonly artifactRubricFingerprint: string;
  readonly checkpointBlueprintId: string;
  readonly completed: true;
}

export interface AgenticTeachingQuizReceipt {
  readonly schema: typeof AGENTIC_TEACHING_PROGRESS_SCHEMA;
  readonly courseVersion: typeof AGENTIC_TEACHING_VERSION;
  readonly blueprintId: typeof AGENTIC_TEACHING_QUIZ_BLUEPRINT;
  readonly score: number;
  readonly questionCount: typeof AGENTIC_TEACHING_QUIZ_QUESTION_COUNT;
  readonly requiredCorrect: typeof AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT;
  readonly criticalPassed: true;
  readonly passed: true;
}

export interface AgenticTeachingCapstoneReceipt {
  readonly schema: typeof AGENTIC_TEACHING_PROGRESS_SCHEMA;
  readonly courseVersion: typeof AGENTIC_TEACHING_VERSION;
  readonly artifactRevisionIds: Readonly<Record<AgenticTeachingModuleSlug, string>>;
  readonly prerequisiteFingerprint: string;
  readonly attested: true;
  readonly completed: true;
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isContentLocale = (
  value: unknown,
): value is AgenticTeachingContentLocale => value === "en" || value === "zh-Hans";

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

function newArtifactRevisionId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function agenticTeachingModuleKey(slug: string): string {
  return `agenticTeaching.module.${slug}`;
}

export function agenticTeachingCheckpointKey(slug: string): string {
  return `agenticTeaching.checkpoint.${slug}`;
}

export function agenticTeachingArtifactKey(slug: string): string {
  return `agenticTeaching.artifact.${slug}`;
}

export function agenticTeachingCapstoneArtifactKey(id: string): string {
  return `agenticTeaching.capstone.artifact.${id}`;
}

export function readAgenticTeachingArtifactRecord(
  value: unknown,
): AgenticTeachingArtifactRecord | null {
  if (
    !isPlainRecord(value) ||
    value.schema !== AGENTIC_TEACHING_PROGRESS_SCHEMA ||
    value.courseVersion !== AGENTIC_TEACHING_VERSION ||
    typeof value.revisionId !== "string" ||
    !value.revisionId.trim() ||
    !isContentLocale(value.contentLocale) ||
    typeof value.text !== "string"
  ) {
    return null;
  }
  return {
    schema: AGENTIC_TEACHING_PROGRESS_SCHEMA,
    courseVersion: AGENTIC_TEACHING_VERSION,
    revisionId: value.revisionId,
    contentLocale: value.contentLocale,
    text: value.text,
  };
}

export function createAgenticTeachingArtifactRecord(
  current: unknown,
  text: string,
  contentLocale: AgenticTeachingContentLocale,
  revisionId = newArtifactRevisionId(),
): AgenticTeachingArtifactRecord {
  const prior = readAgenticTeachingArtifactRecord(current);
  if (prior && prior.text === text && prior.contentLocale === contentLocale) {
    return prior;
  }
  return {
    schema: AGENTIC_TEACHING_PROGRESS_SCHEMA,
    courseVersion: AGENTIC_TEACHING_VERSION,
    revisionId,
    contentLocale,
    text,
  };
}

export function agenticTeachingArtifactText(value: unknown): string {
  // Legacy Course 18 drafts remain visible for recovery, but they do not count
  // toward a current receipt until the learner explicitly saves them again.
  if (typeof value === "string") return value;
  return readAgenticTeachingArtifactRecord(value)?.text ?? "";
}

export function createAgenticTeachingCheckpointReceipt(
  slug: AgenticTeachingModuleSlug,
  contentLocale: AgenticTeachingContentLocale,
  selectedOptionId: string,
): AgenticTeachingCheckpointReceipt | null {
  const contract = getAgenticTeachingCheckpointContract(slug, contentLocale);
  if (selectedOptionId !== contract.correctOptionId) {
    return null;
  }
  return {
    schema: AGENTIC_TEACHING_PROGRESS_SCHEMA,
    courseVersion: AGENTIC_TEACHING_VERSION,
    blueprintId: agenticTeachingCheckpointBlueprintId(slug, contentLocale),
    contentLocale,
    selectedOptionId,
    passed: true,
  };
}

export function readAgenticTeachingCheckpointReceipt(
  value: unknown,
  slug: AgenticTeachingModuleSlug,
): AgenticTeachingCheckpointReceipt | null {
  if (
    !isPlainRecord(value) ||
    value.schema !== AGENTIC_TEACHING_PROGRESS_SCHEMA ||
    value.courseVersion !== AGENTIC_TEACHING_VERSION ||
    !isContentLocale(value.contentLocale) ||
    value.blueprintId !== agenticTeachingCheckpointBlueprintId(slug, value.contentLocale) ||
    value.selectedOptionId !==
      getAgenticTeachingCheckpointContract(slug, value.contentLocale).correctOptionId ||
    value.passed !== true
  ) {
    return null;
  }
  return value as unknown as AgenticTeachingCheckpointReceipt;
}

export function createAgenticTeachingModuleReceipt(
  progress: Record<string, unknown>,
  slug: AgenticTeachingModuleSlug,
): AgenticTeachingModuleReceipt | null {
  const artifact = readAgenticTeachingArtifactRecord(
    progress[agenticTeachingArtifactKey(slug)],
  );
  const checkpoint = readAgenticTeachingCheckpointReceipt(
    progress[agenticTeachingCheckpointKey(slug)],
    slug,
  );
  if (!artifact || !checkpoint) return null;
  const rubric = getAgenticTeachingArtifactRubric(slug, artifact.contentLocale);
  if (!inspectAgenticTeachingArtifact(artifact.text, rubric).ready) return null;
  return {
    schema: AGENTIC_TEACHING_PROGRESS_SCHEMA,
    courseVersion: AGENTIC_TEACHING_VERSION,
    artifactRevisionId: artifact.revisionId,
    artifactContentLocale: artifact.contentLocale,
    artifactRubricFingerprint: agenticTeachingArtifactRubricFingerprint(
      slug,
      artifact.contentLocale,
    ),
    checkpointBlueprintId: checkpoint.blueprintId,
    completed: true,
  };
}

export function isAgenticTeachingModuleComplete(
  progress: Record<string, unknown>,
  slug: AgenticTeachingModuleSlug,
): boolean {
  const value = progress[agenticTeachingModuleKey(slug)];
  const artifact = readAgenticTeachingArtifactRecord(
    progress[agenticTeachingArtifactKey(slug)],
  );
  const checkpoint = readAgenticTeachingCheckpointReceipt(
    progress[agenticTeachingCheckpointKey(slug)],
    slug,
  );
  const rubricReady = Boolean(
    artifact &&
      inspectAgenticTeachingArtifact(
        artifact.text,
        getAgenticTeachingArtifactRubric(slug, artifact.contentLocale),
      ).ready,
  );
  return Boolean(
    isPlainRecord(value) &&
      value.schema === AGENTIC_TEACHING_PROGRESS_SCHEMA &&
      value.courseVersion === AGENTIC_TEACHING_VERSION &&
      value.completed === true &&
      artifact &&
      checkpoint &&
      rubricReady &&
      value.artifactRevisionId === artifact.revisionId &&
      value.artifactContentLocale === artifact.contentLocale &&
      value.artifactRubricFingerprint ===
        agenticTeachingArtifactRubricFingerprint(slug, artifact.contentLocale) &&
      value.checkpointBlueprintId === checkpoint.blueprintId,
  );
}

export function isAgenticTeachingQuizPassed(
  score: number,
  criticalPassed: boolean,
): boolean {
  return score >= AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT && criticalPassed;
}

export function createAgenticTeachingQuizReceipt(
  score: number,
  criticalPassed: boolean,
): AgenticTeachingQuizReceipt | null {
  if (
    !Number.isInteger(score) ||
    score < 0 ||
    score > AGENTIC_TEACHING_QUIZ_QUESTION_COUNT ||
    !isAgenticTeachingQuizPassed(score, criticalPassed)
  ) {
    return null;
  }
  return {
    schema: AGENTIC_TEACHING_PROGRESS_SCHEMA,
    courseVersion: AGENTIC_TEACHING_VERSION,
    blueprintId: AGENTIC_TEACHING_QUIZ_BLUEPRINT,
    score,
    questionCount: AGENTIC_TEACHING_QUIZ_QUESTION_COUNT,
    requiredCorrect: AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT,
    criticalPassed: true,
    passed: true,
  };
}

export function readAgenticTeachingQuizReceipt(
  value: unknown,
): AgenticTeachingQuizReceipt | null {
  if (
    !isPlainRecord(value) ||
    value.schema !== AGENTIC_TEACHING_PROGRESS_SCHEMA ||
    value.courseVersion !== AGENTIC_TEACHING_VERSION ||
    value.blueprintId !== AGENTIC_TEACHING_QUIZ_BLUEPRINT ||
    value.questionCount !== AGENTIC_TEACHING_QUIZ_QUESTION_COUNT ||
    value.requiredCorrect !== AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT ||
    value.criticalPassed !== true ||
    value.passed !== true ||
    typeof value.score !== "number" ||
    !Number.isInteger(value.score) ||
    value.score < 0 ||
    value.score > AGENTIC_TEACHING_QUIZ_QUESTION_COUNT ||
    !isAgenticTeachingQuizPassed(value.score, value.criticalPassed)
  ) {
    return null;
  }
  return value as unknown as AgenticTeachingQuizReceipt;
}

function currentArtifactRevisionIds(
  progress: Record<string, unknown>,
): Record<AgenticTeachingModuleSlug, string> | null {
  const entries: Array<readonly [AgenticTeachingModuleSlug, string]> = [];
  for (const slug of AGENTIC_TEACHING_MODULE_SLUGS) {
    const artifact = readAgenticTeachingArtifactRecord(
      progress[agenticTeachingArtifactKey(slug)],
    );
    if (!artifact || !isAgenticTeachingModuleComplete(progress, slug)) return null;
    entries.push([slug, artifact.revisionId]);
  }
  return Object.fromEntries(entries) as Record<AgenticTeachingModuleSlug, string>;
}

export function areAgenticTeachingCapstonePrerequisitesComplete(
  progress: Record<string, unknown>,
): boolean {
  return agenticTeachingCapstonePrerequisiteFingerprint(progress) !== null;
}

function stableProgressFingerprint(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function agenticTeachingCapstonePrerequisiteFingerprint(
  progress: Record<string, unknown>,
): string | null {
  const quiz = readAgenticTeachingQuizReceipt(
    progress[AGENTIC_TEACHING_QUIZ_KEY],
  );
  const artifactRevisionIds = currentArtifactRevisionIds(progress);
  if (!quiz || !artifactRevisionIds) return null;
  const contract = {
    courseVersion: AGENTIC_TEACHING_VERSION,
    quizBlueprintId: quiz.blueprintId,
    quizScore: quiz.score,
    artifactRevisionIds,
    moduleContracts: Object.fromEntries(
      AGENTIC_TEACHING_MODULE_SLUGS.map((slug) => {
        const artifact = readAgenticTeachingArtifactRecord(
          progress[agenticTeachingArtifactKey(slug)],
        );
        const checkpoint = readAgenticTeachingCheckpointReceipt(
          progress[agenticTeachingCheckpointKey(slug)],
          slug,
        );
        return [
          slug,
          {
            artifactRubricFingerprint: artifact
              ? agenticTeachingArtifactRubricFingerprint(
                  slug,
                  artifact.contentLocale,
                )
              : null,
            checkpointBlueprintId: checkpoint?.blueprintId ?? null,
          },
        ];
      }),
    ),
  };
  return `course18.capstone-prerequisites.${stableProgressFingerprint(contract)}`;
}

export function createAgenticTeachingCapstoneReceipt(
  progress: Record<string, unknown>,
  attestationFingerprint: string | null,
): AgenticTeachingCapstoneReceipt | null {
  const prerequisiteFingerprint =
    agenticTeachingCapstonePrerequisiteFingerprint(progress);
  if (
    !prerequisiteFingerprint ||
    attestationFingerprint !== prerequisiteFingerprint
  ) return null;
  const artifactRevisionIds = currentArtifactRevisionIds(progress);
  if (!artifactRevisionIds) return null;
  return {
    schema: AGENTIC_TEACHING_PROGRESS_SCHEMA,
    courseVersion: AGENTIC_TEACHING_VERSION,
    artifactRevisionIds,
    prerequisiteFingerprint,
    attested: true,
    completed: true,
  };
}

export function isAgenticTeachingCapstoneComplete(
  progress: Record<string, unknown>,
): boolean {
  const value = progress[AGENTIC_TEACHING_CAPSTONE_KEY];
  if (
    !isPlainRecord(value) ||
    value.schema !== AGENTIC_TEACHING_PROGRESS_SCHEMA ||
    value.courseVersion !== AGENTIC_TEACHING_VERSION ||
    value.attested !== true ||
    value.completed !== true ||
    !isPlainRecord(value.artifactRevisionIds) ||
    typeof value.prerequisiteFingerprint !== "string" ||
    !readAgenticTeachingQuizReceipt(progress[AGENTIC_TEACHING_QUIZ_KEY])
  ) {
    return false;
  }
  const revisionIds = currentArtifactRevisionIds(progress);
  if (!revisionIds) return false;
  const prerequisiteFingerprint =
    agenticTeachingCapstonePrerequisiteFingerprint(progress);
  if (
    !prerequisiteFingerprint ||
    value.prerequisiteFingerprint !== prerequisiteFingerprint
  ) return false;
  const storedRevisionIds = value.artifactRevisionIds;
  const storedKeys = Object.keys(storedRevisionIds).sort();
  const expectedKeys = [...AGENTIC_TEACHING_MODULE_SLUGS].sort();
  if (JSON.stringify(storedKeys) !== JSON.stringify(expectedKeys)) return false;
  return AGENTIC_TEACHING_MODULE_SLUGS.every(
    (slug) => storedRevisionIds[slug] === revisionIds[slug],
  );
}

export function agenticTeachingCompletedMilestoneCount(
  progress: Record<string, unknown>,
): number {
  const completedModules = AGENTIC_TEACHING_MODULE_SLUGS.filter((slug) =>
    isAgenticTeachingModuleComplete(progress, slug),
  ).length;
  const quiz = readAgenticTeachingQuizReceipt(
    progress[AGENTIC_TEACHING_QUIZ_KEY],
  )
    ? 1
    : 0;
  const capstone = isAgenticTeachingCapstoneComplete(progress) ? 1 : 0;
  return completedModules + quiz + capstone;
}

export function agenticTeachingProgressPercent(
  progress: Record<string, unknown>,
): number {
  return clamp(
    (agenticTeachingCompletedMilestoneCount(progress) /
      AGENTIC_TEACHING_MILESTONE_COUNT) *
      100,
  );
}

export type AgenticTeachingNextStep =
  | {
      readonly kind: "module";
      readonly slug: AgenticTeachingModuleSlug;
      readonly resume: boolean;
    }
  | { readonly kind: "final-assessment" }
  | { readonly kind: "capstone" }
  | { readonly kind: "course-map" };

function hasAgenticTeachingActivity(
  progress: Record<string, unknown>,
): boolean {
  if (
    readAgenticTeachingQuizReceipt(progress[AGENTIC_TEACHING_QUIZ_KEY]) ||
    isAgenticTeachingCapstoneComplete(progress)
  ) {
    return true;
  }
  return AGENTIC_TEACHING_MODULE_SLUGS.some((slug) => {
    const artifact = progress[agenticTeachingArtifactKey(slug)];
    const hasRecoverableArtifact =
      readAgenticTeachingArtifactRecord(artifact) !== null ||
      (typeof artifact === "string" && artifact.trim().length > 0);
    return hasRecoverableArtifact || Boolean(
      readAgenticTeachingCheckpointReceipt(
        progress[agenticTeachingCheckpointKey(slug)],
        slug,
      ),
    );
  });
}

/**
 * Resolve the learner's next honest destination from the validated progress
 * record. Drafts count as activity for the CTA label, but only current module,
 * quiz and capstone receipts advance the destination.
 */
export function agenticTeachingNextStep(
  progress: Record<string, unknown>,
): AgenticTeachingNextStep {
  const resume = hasAgenticTeachingActivity(progress);
  const nextModule = AGENTIC_TEACHING_MODULE_SLUGS.find(
    (slug) => !isAgenticTeachingModuleComplete(progress, slug),
  );
  if (nextModule) return { kind: "module", slug: nextModule, resume };
  if (!readAgenticTeachingQuizReceipt(progress[AGENTIC_TEACHING_QUIZ_KEY])) {
    return { kind: "final-assessment" };
  }
  if (!isAgenticTeachingCapstoneComplete(progress)) {
    return { kind: "capstone" };
  }
  return { kind: "course-map" };
}

export interface AgenticTeachingArtifactEvidence {
  readonly ready: boolean;
  readonly characterCount: number;
  readonly minimumCharacters: number;
  readonly presentLabels: readonly string[];
  readonly missingLabels: readonly string[];
}

/**
 * A deliberately modest, deterministic completeness gate. It verifies that a
 * learner supplied a structured evidence record; it does not grade quality or
 * award a credential.
 */
export function inspectAgenticTeachingArtifact(
  draft: unknown,
  rubric: {
    readonly minimumCharacters: number;
    readonly requiredLabels: readonly string[];
  },
): AgenticTeachingArtifactEvidence {
  const text = typeof draft === "string" ? draft.trim() : "";
  const folded = text.toLocaleLowerCase();
  const presentLabels = rubric.requiredLabels.filter((label) =>
    folded.includes(label.toLocaleLowerCase()),
  );
  const missingLabels = rubric.requiredLabels.filter(
    (label) => !presentLabels.includes(label),
  );
  return {
    ready:
      text.length >= rubric.minimumCharacters && missingLabels.length === 0,
    characterCount: text.length,
    minimumCharacters: rubric.minimumCharacters,
    presentLabels,
    missingLabels,
  };
}
