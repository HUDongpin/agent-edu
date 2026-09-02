/** Lightweight Course 20 progress contract for the shared client registry. */

import { PROG } from "./progress";
export {
  AGENTIC_VIDEO_EDITING_CORRUPT_BACKUP_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_PROBE_KEY,
  AGENTIC_VIDEO_EDITING_SESSION_PROBE_KEY,
} from "./progress-storage-contract";

export const AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY = PROG;
export const AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX = "agentic-video-editing.";
export const AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX =
  "agentic-video-editing:";
export const AGENTIC_VIDEO_EDITING_COURSE_VERSION = "1.2.0";
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION =
  `${AGENTIC_VIDEO_EDITING_COURSE_VERSION}:progress-v2`;
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY =
  "agentic-video-editing.progress.version";
export const AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY =
  "agentic-video-editing.legacy.drafts-v1";
export const AGENTIC_VIDEO_EDITING_PROGRESS_EVENT =
  "agentic-video-editing:progress-change";
export const AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT =
  "agentic-video-editing:progress-reset";
export const AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY =
  "agentic-video-editing.v2.assessment.best";
export const AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY =
  "agentic-video-editing.v2.assessment.passed";
export const AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY =
  "agentic-video-editing.v2.assessment.last-diagnostic";
export const AGENTIC_VIDEO_EDITING_CAPSTONE_KEY =
  "agentic-video-editing.v2.capstone.verified-cut";

export const AGENTIC_VIDEO_EDITING_PROGRESS_MODULES = [
  { slug: "agentic-editing-contract", requires: [], artifacts: ["creative-brief-responsibility-map"] },
  { slug: "media-ingest-provenance", requires: ["agentic-editing-contract"], artifacts: ["media-manifest-provenance-quarantine"] },
  { slug: "transcripts-shots-index", requires: ["media-ingest-provenance"], artifacts: ["evidence-index-transcript-shots"] },
  { slug: "semantic-analysis-director", requires: ["transcripts-shots-index"], artifacts: ["candidate-segments-system-card"] },
  { slug: "declarative-edit-plan", requires: ["semantic-analysis-director"], artifacts: ["edit-plan-v3-validation-approval", "plan-diff-independent-approval"] },
  { slug: "agent-tools-mcp", requires: ["declarative-edit-plan"], artifacts: ["tool-policy-adversarial-recovery"] },
  { slug: "captions-audio-formats", requires: ["agent-tools-mcp"], artifacts: ["delivery-matrix-accessibility"] },
  { slug: "deterministic-rendering", requires: ["captions-audio-formats"], artifacts: ["render-receipt-output-probe", "candidate-media-reference"] },
  { slug: "verification-human-review", requires: ["deterministic-rendering"], artifacts: ["verification-repair-approval"] },
  { slug: "production-capstone", requires: ["verification-human-review"], artifacts: ["release-package-runbook-recovery"] },
] as const;

export const AGENTIC_VIDEO_EDITING_PROGRESS_ARTIFACT_IDS = [
  "creative-brief-responsibility-map",
  "media-manifest-provenance-quarantine",
  "evidence-index-transcript-shots",
  "candidate-segments-system-card",
  "edit-plan-v3-validation-approval",
  "plan-diff-independent-approval",
  "tool-policy-adversarial-recovery",
  "delivery-matrix-accessibility",
  "render-receipt-output-probe",
  "candidate-media-reference",
  "verification-repair-approval",
  "release-package-runbook-recovery",
  "release-decision-postmortem",
] as const;

export const AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS = [
  ...AGENTIC_VIDEO_EDITING_PROGRESS_ARTIFACT_IDS.filter(
    (id) => id !== "delivery-matrix-accessibility",
  ),
] as const;

export type AgenticVideoEditingProgressModuleSlug =
  (typeof AGENTIC_VIDEO_EDITING_PROGRESS_MODULES)[number]["slug"];

type ProgressRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ProgressRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHash(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function exactRecordKeys(value: unknown, keys: readonly string[]): value is ProgressRecord {
  return isRecord(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}

export function agenticVideoEditingModuleProgressKey(
  slug: AgenticVideoEditingProgressModuleSlug,
  path: "core" | "builder-extension" = "core",
): string {
  return `agentic-video-editing.v2.${path}.module.${slug}.complete`;
}

export function agenticVideoEditingCheckpointKey(
  slug: AgenticVideoEditingProgressModuleSlug,
): string {
  return `agentic-video-editing.v2.module.${slug}.checkpoint.passed`;
}

export function agenticVideoEditingArtifactKey(
  artifactId: (typeof AGENTIC_VIDEO_EDITING_PROGRESS_ARTIFACT_IDS)[number],
  path: "core" | "builder-extension" = "core",
): string {
  return `agentic-video-editing.v2.${path}.artifact.${artifactId}`;
}

export function isAgenticVideoEditingOwnedProgressKey(key: string): boolean {
  if ([
    AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
    AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY,
    AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY,
    AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY,
    AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY,
    AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  ].includes(key)) return true;
  if (AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.some(
    ({ slug }) => key === agenticVideoEditingCheckpointKey(slug),
  )) return true;
  return (["core", "builder-extension"] as const).some((path) => (
    AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.some(
      ({ slug }) => key === agenticVideoEditingModuleProgressKey(slug, path),
    )
    || AGENTIC_VIDEO_EDITING_PROGRESS_ARTIFACT_IDS.some(
      (artifactId) => key === agenticVideoEditingArtifactKey(artifactId, path),
    )
  ));
}

export function normalizeAgenticVideoEditingProgress(
  progress: ProgressRecord,
): ProgressRecord {
  const unrelated = Object.fromEntries(Object.entries(progress).filter(
    ([key]) => !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX),
  ));
  const owned = Object.fromEntries(Object.entries(progress).filter(
    ([key]) => isAgenticVideoEditingOwnedProgressKey(key),
  ));
  if (progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]
      === AGENTIC_VIDEO_EDITING_PROGRESS_VERSION) {
    return { ...unrelated, ...owned };
  }
  const drafts = Object.fromEntries(Object.entries(progress).flatMap(([key, value]) => {
    if (!key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)) return [];
    if (typeof value === "string" && (key.includes(".artifact") || key.includes(".draft"))) {
      return [[key, value]];
    }
    if (isRecord(value) && typeof value.contentText === "string" && value.contentText.trim()) {
      return [[key, value.contentText]];
    }
    return [];
  }));
  return {
    ...unrelated,
    ...(Object.keys(drafts).length > 0
      ? { [AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY]: { sourceVersion: progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY] ?? "unversioned", drafts } }
      : {}),
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]: AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
}

export function isCurrentCourse20Module(
  progress: ProgressRecord,
  slug: AgenticVideoEditingProgressModuleSlug,
): boolean {
  const contract = AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.find(
    (candidate) => candidate.slug === slug,
  );
  if (!contract || !contract.requires.every(
    (required) => isCurrentCourse20Module(progress, required),
  )) return false;
  const checkpoint = progress[agenticVideoEditingCheckpointKey(slug)];
  const receipt = progress[agenticVideoEditingModuleProgressKey(slug)];
  if (!isRecord(checkpoint)
    || checkpoint.schemaVersion !== "aicourse.course20.checkpoint-receipt.v1"
    || checkpoint.courseVersion !== AGENTIC_VIDEO_EDITING_COURSE_VERSION
    || checkpoint.moduleSlug !== slug
    || checkpoint.status !== "pass"
    || !isRecord(receipt)
    || receipt.schemaVersion !== "aicourse.course20.module-receipt.v1"
    || receipt.courseVersion !== AGENTIC_VIDEO_EDITING_COURSE_VERSION
    || receipt.moduleSlug !== slug
    || receipt.path !== "core"
    || receipt.status !== "valid"
    || !isHash(receipt.checkpointReceiptFingerprint)
    || !exactRecordKeys(receipt.prerequisiteReceiptFingerprints, contract.requires)
    || !contract.requires.every((required) => isHash(
      (receipt.prerequisiteReceiptFingerprints as ProgressRecord)[required],
    ))
    || !exactRecordKeys(receipt.artifactSemanticHashes, contract.artifacts)
    || !contract.artifacts.every((artifactId) => isHash(
      (receipt.artifactSemanticHashes as ProgressRecord)[artifactId],
    ))) return false;
  return true;
}

export function isCurrentCourse20Assessment(progress: ProgressRecord): boolean {
  if (!AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.every(
    ({ slug }) => isCurrentCourse20Module(progress, slug),
  )) return false;
  const receipt = progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY];
  const slugs = AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.map(({ slug }) => slug);
  return isRecord(receipt)
    && receipt.schemaVersion === "aicourse.course20.quiz-receipt.v1"
    && receipt.courseVersion === AGENTIC_VIDEO_EDITING_COURSE_VERSION
    && receipt.status === "pass"
    && receipt.criticalMiss === false
    && Number.isInteger(receipt.score)
    && Number(receipt.score) >= 80
    && Number(receipt.score) <= 100
    && Number.isInteger(receipt.correctCount)
    && Number(receipt.correctCount) >= 8
    && Number(receipt.correctCount) <= 10
    && exactRecordKeys(receipt.answers, Array.from({ length: 10 }, (_, index) => `q${index + 1}`))
    && exactRecordKeys(receipt.moduleReceiptFingerprints, slugs)
    && slugs.every((slug) => isHash((receipt.moduleReceiptFingerprints as ProgressRecord)[slug]));
}

export function isCurrentCourse20Capstone(progress: ProgressRecord): boolean {
  if (!isCurrentCourse20Assessment(progress)) return false;
  const record = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY];
  const slugs = AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.map(({ slug }) => slug);
  return isRecord(record)
    && record.schemaVersion === "aicourse.course20.capstone.v2"
    && record.courseVersion === AGENTIC_VIDEO_EDITING_COURSE_VERSION
    && record.status === "valid"
    && record.decision === "do-not-publish"
    && record.releaseAttestation === true
    && typeof record.reviewerRole === "string"
    && record.reviewerRole.trim().length > 0
    && isHash(record.packageSha256)
    && record.boundPackageSha256 === record.packageSha256
    && Array.isArray(record.issues)
    && record.issues.length === 0
    && isHash(record.quizReceiptFingerprint)
    && exactRecordKeys(record.moduleReceiptFingerprints, slugs)
    && slugs.every((slug) => isHash((record.moduleReceiptFingerprints as ProgressRecord)[slug]))
    && exactRecordKeys(record.artifactHashes, AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS)
    && AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS.every(
      (artifactId) => isHash((record.artifactHashes as ProgressRecord)[artifactId]),
    );
}

export function summarizeAgenticVideoEditingProgress(progress: ProgressRecord): {
  readonly completed: number;
  readonly percent: number;
  readonly nextSlug: AgenticVideoEditingProgressModuleSlug | null;
  readonly assessmentComplete: boolean;
  readonly capstoneComplete: boolean;
  readonly hasProgress: boolean;
} {
  if (progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]
      !== AGENTIC_VIDEO_EDITING_PROGRESS_VERSION) {
    return { completed: 0, percent: 0, nextSlug: AGENTIC_VIDEO_EDITING_PROGRESS_MODULES[0].slug, assessmentComplete: false, capstoneComplete: false, hasProgress: false };
  }
  const completedSlugs = AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.filter(
    ({ slug }) => isCurrentCourse20Module(progress, slug),
  );
  const assessmentComplete = isCurrentCourse20Assessment(progress);
  const capstoneComplete = isCurrentCourse20Capstone(progress);
  const completed = completedSlugs.length + Number(assessmentComplete) + Number(capstoneComplete);
  return {
    completed,
    percent: Math.round((completed / 12) * 100),
    nextSlug: AGENTIC_VIDEO_EDITING_PROGRESS_MODULES.find(
      ({ slug }) => !isCurrentCourse20Module(progress, slug),
    )?.slug ?? null,
    assessmentComplete,
    capstoneComplete,
    hasProgress: Object.keys(progress).some(
      (key) => key !== AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY
        && isAgenticVideoEditingOwnedProgressKey(key),
    ),
  };
}
