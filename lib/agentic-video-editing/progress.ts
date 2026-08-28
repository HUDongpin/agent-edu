import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import type {
  AgenticVideoEditingModuleManifest,
  AgenticVideoEditingModuleSlug,
} from "./types";

export const AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX = "agentic-video-editing.";
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION =
  `${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}:progress-v2`;
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY =
  "agentic-video-editing.progress.version";
export const AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY =
  "agentic-video-editing.history.v1";
export const AGENTIC_VIDEO_EDITING_PROJECT_ID =
  "course22-guided-video-project-v2" as const;
export const AGENTIC_VIDEO_EDITING_PROGRESS_EVENT =
  "agentic-video-editing:progress-change";
export const AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT =
  "agentic-video-editing:progress-reset";
export const AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY =
  "agentic-video-editing.quiz.best";
export const AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY =
  "agentic-video-editing.quiz.best.passed";
export const AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY =
  "agentic-video-editing.quiz.current.score";
export const AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY =
  "agentic-video-editing.quiz.current.passed";
export const AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY =
  "agentic-video-editing.quiz.current.version";
export const AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY =
  "agentic-video-editing.quiz.current.form";
export const AGENTIC_VIDEO_EDITING_QUIZ_VERSION = "2.0.0:quiz-v2" as const;
export const AGENTIC_VIDEO_EDITING_QUIZ_FORM = "readiness-main-v2" as const;
export const AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY =
  "agentic-video-editing.preflight.complete";
export const AGENTIC_VIDEO_EDITING_CAPSTONE_KEY =
  "agentic-video-editing.capstone.v2";
export const AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY =
  "agentic-video-editing.capstone.evidence.v2";
export const AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY =
  "agentic-video-editing.capstone.attested";
export const AGENTIC_VIDEO_EDITING_CUT_PLAN_LAB_RECEIPT_KEY =
  "agentic-video-editing.lab.cut-plan.receipt.v2";
export const AGENTIC_VIDEO_EDITING_QUIZ_PASS_PERCENT = 80;
export const AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT = 12;
export const AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS = [
  "capstone-creative-brief",
  "capstone-media-manifest",
  "capstone-clock-receipt",
  "capstone-transcript-shot-index",
  "capstone-candidate-segments",
  "capstone-edit-plan",
  "capstone-tool-permission-envelope",
  "capstone-render-receipt",
  "capstone-delivery-matrix",
  "capstone-variant-receipts",
  "capstone-verification-report",
  "release-decision",
] as const;
export const AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA =
  "aicourse.agentic-video-editing.module-receipt.v2" as const;
export const AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA =
  "aicourse.agentic-video-editing.preflight-receipt.v2" as const;
export const AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256 =
  "9f5c1feba951051d9147ccb4ace1a6b86cf36ade58de593e4739bbb5834cd02e";
export const AGENTIC_VIDEO_EDITING_PROGRESS_MODULE_SLUGS =
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules
    .filter((module) => module.slug !== "production-capstone")
    .map((module) => module.slug);
export const AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONE_IDS = [
  "preflight",
  ...AGENTIC_VIDEO_EDITING_PROGRESS_MODULE_SLUGS,
  "readiness-quiz",
  "production-capstone",
] as const;
export const AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES =
  AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONE_IDS.length;

export function agenticVideoEditingCheckpointKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.module.${slug}.checkpoint.passed`;
}

export function agenticVideoEditingArtifactKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.module.${slug}.artifact`;
}

export function agenticVideoEditingArtifactFieldKey(
  slug: AgenticVideoEditingModuleSlug,
  fieldPath: string,
): string {
  return `agentic-video-editing.module.${slug}.artifact-field.${fieldPath}.closed`;
}

export function agenticVideoEditingArtifactValidatedKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.module.${slug}.artifact.validated`;
}

export function agenticVideoEditingArtifactReceiptKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.module.${slug}.artifact.receipt.v2`;
}

export interface AgenticVideoEditingModuleReceiptV2 {
  readonly schemaVersion: typeof AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA;
  readonly courseId: "agentic-video-editing";
  readonly courseVersion: "2.0.0";
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly projectId: string;
  readonly artifactId: string;
  readonly artifactPath: string;
  readonly artifactSha256: string;
  readonly inputArtifactIdsAndHashes: Readonly<Record<string, string>>;
  readonly artifactSchemaId: string;
  readonly validatorId: string;
  readonly validatorVersion: "2.0.0";
  readonly executedCommand: string;
  readonly validatedAt: string;
  readonly status: "validated";
  readonly limitations: readonly string[];
}

export interface AgenticVideoEditingCapstoneEvidenceV2 {
  readonly artifactId: (typeof AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS)[number];
  readonly locator: string;
  readonly sha256: string;
  readonly reviewState: "reviewed-pass" | "reviewed-blocked";
  readonly reviewerId: string;
  readonly reviewedAt: string;
  readonly learnerProjectId: string;
  readonly artifactSchemaId: string;
  readonly validatorId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === "string"
    && /^[a-f0-9]{64}$/iu.test(value)
    && new Set(value.toLowerCase()).size >= 4
    && !/^(.{1,16})\1+$/iu.test(value);
}

function isOffsetAwareTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && !Number.isNaN(new Date(value).valueOf());
}

function isExactValidatorCommand(
  value: unknown,
  moduleManifest: AgenticVideoEditingModuleManifest,
  artifactId: string,
  artifactPath: string,
): value is string {
  if (typeof value !== "string" || /[\r\n;&|`$<>]/u.test(value)) return false;
  if (!/^[A-Za-z0-9_.\/-]+$/u.test(artifactPath)
    || artifactPath.split("/").includes("..")) return false;
  const expectedTemplate = moduleManifest.validatorCommand
    .replace("<artifact-id>", artifactId)
    .replace("<artifact-path>", artifactPath);
  const [prefix, afterProjectRoot, ...extraProject] = expectedTemplate.split("<project-root>");
  const [between, suffix, ...extraTimestamp] = (afterProjectRoot ?? "").split("<validated-at>");
  if (extraProject.length > 0 || extraTimestamp.length > 0
    || prefix === undefined || between === undefined || suffix === undefined) return false;
  const escapeRegExp = (candidate: string) => candidate.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const timestampPattern = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?(?:Z|[+-]\\d{2}:\\d{2})";
  const match = value.match(new RegExp(
    `^${escapeRegExp(prefix)}(?<projectRoot>.+?)${escapeRegExp(between)}(?<validatedAt>${timestampPattern})${escapeRegExp(suffix)}$`,
    "u",
  ));
  if (!match?.groups || !isOffsetAwareTimestamp(match.groups.validatedAt)) return false;
  const projectRootArgument = match.groups.projectRoot.trim();
  let projectRoot: unknown = projectRootArgument;
  if (projectRootArgument.startsWith('"')) {
    try {
      projectRoot = JSON.parse(projectRootArgument);
    } catch {
      return false;
    }
  }
  return typeof projectRoot === "string"
    && projectRoot.length > 0
    && !projectRoot.includes("\0")
    && projectRoot !== "."
    && !projectRoot.split(/[\\/]/u).includes("..");
}

export function parseAgenticVideoEditingModuleReceipt(
  value: unknown,
  module: AgenticVideoEditingModuleManifest,
): readonly AgenticVideoEditingModuleReceiptV2[] | null {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (module.producesArtifactIds.length === 1 && isRecord(parsed)) parsed = [parsed];
  if (!Array.isArray(parsed) || parsed.length !== module.producesArtifactIds.length) {
    return null;
  }
  const expectedKeys = [
    "schemaVersion", "courseId", "courseVersion", "moduleSlug", "projectId", "artifactId",
    "artifactPath", "artifactSha256", "inputArtifactIdsAndHashes",
    "artifactSchemaId", "validatorId", "validatorVersion", "executedCommand",
    "validatedAt", "status", "limitations",
  ].sort();
  const receipts: AgenticVideoEditingModuleReceiptV2[] = [];
  for (const candidate of parsed) {
    if (!isRecord(candidate)
      || JSON.stringify(Object.keys(candidate).sort()) !== JSON.stringify(expectedKeys)
      || candidate.schemaVersion !== AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA
      || candidate.courseId !== "agentic-video-editing"
      || candidate.courseVersion !== "2.0.0"
      || candidate.moduleSlug !== module.slug
      || typeof candidate.projectId !== "string"
      || (module.slug === "production-capstone"
        ? (candidate.projectId === AGENTIC_VIDEO_EDITING_PROJECT_ID
          || !/^[a-z0-9][a-z0-9.-]{7,79}$/u.test(candidate.projectId))
        : candidate.projectId !== AGENTIC_VIDEO_EDITING_PROJECT_ID)
      || typeof candidate.artifactId !== "string"
      || !(module.producesArtifactIds as readonly string[]).includes(candidate.artifactId)
      || typeof candidate.artifactPath !== "string"
      || candidate.artifactSchemaId !== module.artifactSchemaId
      || candidate.validatorId !== module.validatorId
      || candidate.validatorVersion !== "2.0.0"
      || !isExactValidatorCommand(
        candidate.executedCommand,
        module,
        candidate.artifactId,
        candidate.artifactPath,
      )
      || !isOffsetAwareTimestamp(candidate.validatedAt)
      || !isSha256(candidate.artifactSha256)
      || !isRecord(candidate.inputArtifactIdsAndHashes)
      || candidate.status !== "validated"
      || !Array.isArray(candidate.limitations)
      || candidate.limitations.length < 2
      || candidate.limitations.some((limitation) => (
        typeof limitation !== "string"
        || limitation.trim().length < 12
        || /^(?:todo|tbd|none|placeholder)$/iu.test(limitation.trim())
      ))) return null;
    const inputEntries = Object.entries(candidate.inputArtifactIdsAndHashes);
    if (JSON.stringify(inputEntries.map(([id]) => id).sort())
        !== JSON.stringify([...module.consumesArtifactIds].sort())
      || inputEntries.some(([, hash]) => !isSha256(hash))) return null;
    receipts.push(candidate as unknown as AgenticVideoEditingModuleReceiptV2);
  }
  if (JSON.stringify(receipts.map((receipt) => receipt.artifactId).sort())
    !== JSON.stringify([...module.producesArtifactIds].sort())) return null;
  if (new Set(receipts.map((receipt) => receipt.projectId)).size !== 1
    || new Set(receipts.map((receipt) => (
      JSON.stringify(receipt.inputArtifactIdsAndHashes)
    ))).size !== 1) return null;
  return receipts;
}

export function isAgenticVideoEditingPreflightReceipt(value: unknown): boolean {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return false;
    }
  }
  const expectedKeys = [
    "schemaVersion", "courseId", "courseVersion", "projectId",
    "fixtureLedgerSha256", "lane", "directories", "contractFormats",
    "clockProbeConfirmed", "secretInjection", "uploadDataPath",
    "offline", "noSecrets", "validatedAt",
  ].sort();
  return isRecord(parsed)
    && JSON.stringify(Object.keys(parsed).sort()) === JSON.stringify(expectedKeys)
    && parsed.schemaVersion === AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA
    && parsed.courseId === "agentic-video-editing"
    && parsed.courseVersion === "2.0.0"
    && parsed.projectId === AGENTIC_VIDEO_EDITING_PROJECT_ID
    && parsed.fixtureLedgerSha256 === AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256
    && parsed.lane === "audit-only"
    && isRecord(parsed.directories)
    && JSON.stringify(parsed.directories) === JSON.stringify({
      input: "fixtures/read-only/",
      work: "work/course22/",
      cache: "work/course22/cache/",
      receipts: "work/course22/receipts/",
      output: "work/course22/output/",
    })
    && Array.isArray(parsed.contractFormats)
    && JSON.stringify(parsed.contractFormats) === JSON.stringify(["json", "yaml"])
    && parsed.clockProbeConfirmed === true
    && parsed.secretInjection === "host-secret-store-or-environment"
    && parsed.uploadDataPath === "offline-fixture-no-upload"
    && parsed.offline === true
    && parsed.noSecrets === true
    && isOffsetAwareTimestamp(parsed.validatedAt);
}

export function isAgenticVideoEditingModuleReceiptComplete(
  progress: Record<string, unknown>,
  slug: AgenticVideoEditingModuleSlug,
): boolean {
  if (!isAgenticVideoEditingPreflightReceipt(
    progress[AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY],
  )) return false;
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleManifest) return false;
  const receipt = parseAgenticVideoEditingModuleReceipt(
    progress[agenticVideoEditingArtifactReceiptKey(slug)],
    moduleManifest,
  );
  return Boolean(receipt && hasValidReceiptLineage(
    progress,
    moduleManifest,
    receipt,
  ));
}

function hasValidReceiptLineage(
  progress: Record<string, unknown>,
  module: AgenticVideoEditingModuleManifest,
  receipts: readonly AgenticVideoEditingModuleReceiptV2[],
  visited: ReadonlySet<AgenticVideoEditingModuleSlug> = new Set(),
): boolean {
  if (visited.has(module.slug)) return false;
  if (progress[agenticVideoEditingCheckpointKey(module.slug)] !== true) return false;
  const nextVisited = new Set(visited);
  nextVisited.add(module.slug);

  const prerequisiteReceipts = new Map<
    AgenticVideoEditingModuleSlug,
    readonly AgenticVideoEditingModuleReceiptV2[]
  >();
  for (const prerequisiteSlug of module.prerequisiteModuleSlugs) {
    const prerequisite = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
      (candidate) => candidate.slug === prerequisiteSlug,
    );
    if (!prerequisite) return false;
    const prerequisiteReceipt = parseAgenticVideoEditingModuleReceipt(
      progress[agenticVideoEditingArtifactReceiptKey(prerequisiteSlug)],
      prerequisite,
    );
    if (!prerequisiteReceipt
      || !hasValidReceiptLineage(
        progress,
        prerequisite,
        prerequisiteReceipt,
        nextVisited,
      )) return false;
    prerequisiteReceipts.set(prerequisiteSlug, prerequisiteReceipt);
  }

  // M10 starts a new learner-owned authorized project. Its input hashes bind
  // that project packet; the completed M1-M9 guided lineage remains a separate
  // prerequisite and is never reused as the capstone media/project identity.
  if (module.slug === "production-capstone") return true;

  for (const consumedArtifactId of module.consumesArtifactIds) {
    const producer = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
      (candidate) => candidate.producesArtifactIds.includes(consumedArtifactId),
    );
    if (!producer || producer.order >= module.order) return false;
    const producerReceipts = prerequisiteReceipts.get(producer.slug)
      ?? parseAgenticVideoEditingModuleReceipt(
        progress[agenticVideoEditingArtifactReceiptKey(producer.slug)],
        producer,
      );
    const producerReceipt = producerReceipts?.find(
      (candidate) => candidate.artifactId === consumedArtifactId,
    );
    if (!producerReceipts || !producerReceipt
      || !hasValidReceiptLineage(progress, producer, producerReceipts, nextVisited)
      || receipts.some((receipt) => (
        receipt.inputArtifactIdsAndHashes[consumedArtifactId]
          !== producerReceipt.artifactSha256
      ))) return false;
  }
  return true;
}

export function isAgenticVideoEditingQuizPassed(
  progress: Record<string, unknown>,
): boolean {
  return progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY]
      === AGENTIC_VIDEO_EDITING_QUIZ_VERSION
    && progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY]
      === AGENTIC_VIDEO_EDITING_QUIZ_FORM
    && progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY] === true
    && typeof progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY] === "number"
    && progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY]
      >= AGENTIC_VIDEO_EDITING_QUIZ_PASS_PERCENT;
}

function isMeaningfulArtifactLocator(value: unknown): value is string {
  return typeof value === "string"
    && value.trim().length >= 4
    && value === value.trim()
    && !/[\r\n]/u.test(value)
    && !/^(?:todo|tbd|unknown|n\/a|none|placeholder|<[^>]+>)$/iu.test(value)
    && !/^[a-z][a-z0-9+.-]*:/iu.test(value)
    && !/(?:^|\/)\.\.(?:\/|$)/u.test(value)
    && !/\/Users\/[A-Za-z0-9._-]+\//u.test(value);
}

export function isAgenticVideoEditingCapstoneEvidenceComplete(
  progress: Record<string, unknown>,
  value: unknown = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY],
  capstoneReceiptValue: unknown = progress[
    agenticVideoEditingArtifactReceiptKey("production-capstone")
  ],
): value is readonly AgenticVideoEditingCapstoneEvidenceV2[] {
  if (!Array.isArray(value)
    || value.length !== AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT) return false;
  const records = value as unknown[];
  const recordById = new Map<string, AgenticVideoEditingCapstoneEvidenceV2>();
  for (const candidate of records) {
    const artifactId = String((candidate as { artifactId?: unknown })?.artifactId ?? "");
    const baseArtifactId = artifactId.replace(/^capstone-/u, "");
    const evidenceModule = artifactId === "release-decision"
      ? AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
        (moduleManifest) => moduleManifest.slug === "production-capstone",
      )
      : AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
        (moduleManifest) => (moduleManifest.producesArtifactIds as readonly string[])
          .includes(baseArtifactId),
      );
    if (!isRecord(candidate)
      || !(AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS as readonly string[])
        .includes(String(candidate.artifactId))
      || !isMeaningfulArtifactLocator(candidate.locator)
      || !isSha256(candidate.sha256)
      || !["reviewed-pass", "reviewed-blocked"].includes(String(candidate.reviewState))
      || !isMeaningfulArtifactLocator(candidate.reviewerId)
      || !isOffsetAwareTimestamp(candidate.reviewedAt)
      || typeof candidate.learnerProjectId !== "string"
      || !/^[a-z0-9][a-z0-9.-]{7,79}$/u.test(candidate.learnerProjectId)
      || candidate.learnerProjectId === AGENTIC_VIDEO_EDITING_PROJECT_ID
      || !evidenceModule
      || candidate.artifactSchemaId !== evidenceModule.artifactSchemaId
      || candidate.validatorId !== evidenceModule.validatorId
      || recordById.has(String(candidate.artifactId))) return false;
    recordById.set(
      String(candidate.artifactId),
      candidate as unknown as AgenticVideoEditingCapstoneEvidenceV2,
    );
  }
  if (AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS.some(
    (artifactId) => !recordById.has(artifactId),
  )) return false;

  const receiptHashes = new Map<string, string>();
  let learnerProjectId: string | null = null;
  for (const moduleManifest of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    const receiptValue = moduleManifest.slug === "production-capstone"
      ? capstoneReceiptValue
      : progress[agenticVideoEditingArtifactReceiptKey(moduleManifest.slug)];
    const receipt = parseAgenticVideoEditingModuleReceipt(receiptValue, moduleManifest);
    if (!receipt
      || !hasValidReceiptLineage(progress, moduleManifest, receipt)) return false;
    if (moduleManifest.slug === "production-capstone") {
      learnerProjectId = receipt[0]?.projectId ?? null;
      for (const [artifactId, hash] of Object.entries(
        receipt[0]?.inputArtifactIdsAndHashes ?? {},
      )) receiptHashes.set(artifactId, hash);
      const releaseReceipt = receipt.find(
        (artifactReceipt) => artifactReceipt.artifactId === "release-decision",
      );
      if (!releaseReceipt) return false;
      receiptHashes.set("release-decision", releaseReceipt.artifactSha256);
    }
  }
  return Boolean(learnerProjectId)
    && AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS.every((artifactId) => (
      recordById.get(artifactId)?.learnerProjectId === learnerProjectId
      && recordById.get(artifactId)?.sha256 === receiptHashes.get(artifactId)
    ));
}

export function isAgenticVideoEditingCapstoneComplete(
  progress: Record<string, unknown>,
): boolean {
  if (!isAgenticVideoEditingQuizPassed(progress)) return false;
  if (progress[AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY] !== true) return false;
  const capstoneModule = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (module) => module.slug === "production-capstone",
  );
  if (!capstoneModule) return false;
  const receipt = parseAgenticVideoEditingModuleReceipt(
    progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY],
    capstoneModule,
  );
  return Boolean(receipt
    && hasValidReceiptLineage(
    progress,
    capstoneModule,
    receipt,
    )
    && isAgenticVideoEditingCapstoneEvidenceComplete(
      progress,
      progress[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY],
      receipt,
    ));
}

export function isCurrentAgenticVideoEditingProgress(
  progress: Record<string, unknown>,
): boolean {
  return progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]
    === AGENTIC_VIDEO_EDITING_PROGRESS_VERSION;
}

/** Freeze stale Course data as non-scoring history without touching other owners. */
export function normalizeAgenticVideoEditingProgress(
  progress: Record<string, unknown>,
): Record<string, unknown> {
  if (isCurrentAgenticVideoEditingProgress(progress)) return { ...progress };
  const legacyCourseEntries = Object.fromEntries(
    Object.entries(progress).filter(([key]) => (
      key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)
      && key !== AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY
    )),
  );
  const priorHistory = isRecord(progress[AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY])
    ? progress[AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY]
    : {};
  return {
    ...Object.fromEntries(
      Object.entries(progress).filter(
        ([key]) => !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX),
      ),
    ),
    [AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY]: {
      ...priorHistory,
      migratedFromVersion: progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]
        ?? "unversioned",
      frozenProgress: legacyCourseEntries,
      scoring: false,
    },
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
}

/** Clear only active v2 state; frozen legacy history is intentionally read-only. */
export function clearAgenticVideoEditingV2Progress(
  progress: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(progress).filter(([key]) => (
    !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)
    || key === AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY
  )));
}

export function agenticVideoEditingProgressPercent(
  progress: Record<string, unknown>,
): number {
  if (!isCurrentAgenticVideoEditingProgress(progress)) return 0;
  const preflight = isAgenticVideoEditingPreflightReceipt(
    progress[AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY],
  ) ? 1 : 0;
  const modules = AGENTIC_VIDEO_EDITING_PROGRESS_MODULE_SLUGS.filter(
    (slug) => isAgenticVideoEditingModuleReceiptComplete(progress, slug),
  ).length;
  const quiz = isAgenticVideoEditingQuizPassed(progress) ? 1 : 0;
  const capstone = isAgenticVideoEditingCapstoneComplete(progress) ? 1 : 0;
  return Math.round(
    ((preflight + modules + quiz + capstone) / AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES) * 100,
  );
}
