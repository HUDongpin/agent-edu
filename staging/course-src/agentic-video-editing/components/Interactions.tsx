"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
  AGENTIC_VIDEO_EDITING_CORE_PROGRESS_MILESTONES,
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_EVENT,
  AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX,
  AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY,
  CUT_PLAN_LAB_FIXTURE,
  COURSE20_CAPSTONE_RUBRIC_FINGERPRINT,
  agenticVideoEditingCheckpointKey,
  agenticVideoEditingModuleProgressKey,
  areCourse20ArtifactSubmissionsCurrent,
  buildCutPlanLabPlan,
  canonicalizeArtifactContent,
  course20ArtifactDependenciesAreCurrent,
  course20ReceiptFingerprint,
  createCourse20CheckpointReceipt,
  createCourse20CapstonePackageBinding,
  createCourse20QuizReceipt,
  createCourse20ArtifactStarter,
  getAgenticVideoEditingArtifactContract,
  getAgenticVideoEditingModuleArtifactContracts,
  getCourse20CheckpointBlueprint,
  getCourse20FinalQuestionBlueprint,
  getCourse20ArtifactSubmission,
  getCourse20ArtifactSubmissions,
  isCourse20ModuleCurrent,
  isCourse20CapstoneCurrent,
  isCourse20CapstoneRubricPassing,
  isCourse20CheckpointReceipt,
  isCourse20AssessmentMilestoneCurrent,
  isAgenticVideoEditingOwnedProgressKey,
  isCurrentAgenticVideoEditingProgress,
  normalizeAgenticVideoEditingProgress,
  sha256CanonicalArtifactContent,
  scoreCourse20FinalAssessment,
  validateCourse20ArtifactContent,
  validateCutPlanLabPlan,
  type AgenticVideoEditingCapstoneCriterionCopy,
  type AgenticVideoEditingCapstoneRubricDimensionId,
  type AgenticVideoEditingArtifactId,
  type AgenticVideoEditingCheckpointCopy,
  type AgenticVideoEditingCourseCopy,
  type AgenticVideoEditingFinalQuestionCopy,
  type AgenticVideoEditingModuleSlug,
  type AgenticVideoEditingPracticeCopy,
  type AgenticVideoEditingUiKey,
  type Course20CapstoneRecord,
  type Course20CapstoneRubricRecord,
  type Course20QuizReceipt,
  type Course20LearningPath,
  type CutPlanLabIssue,
} from "@/staging/course-src/agentic-video-editing";
import {
  clearAgenticVideoEditingSessionScratch,
  completeAgenticVideoEditingModule,
  isAgenticVideoEditingStorageAvailable,
  observeAgenticVideoEditingProgressStorageEvent,
  readAgenticVideoEditingProgress,
  resetAgenticVideoEditingProgress,
  saveAgenticVideoEditingArtifact,
  updateAgenticVideoEditingProgress,
  type AgenticVideoEditingProgressRecord,
} from "./progress-store";
import styles from "./AgenticVideoEditingCourse.module.css";

type Labels = AgenticVideoEditingCourseCopy["ui"];
const CORE_LEARNING_PATH: Course20LearningPath = "core";
const BUILDER_LEARNING_PATH: Course20LearningPath = "builder-extension";
const MAX_BROWSER_HASH_BYTES = 256 * 1024 * 1024;
const MAX_COURSE20_BACKUP_BYTES = 5 * 1024 * 1024;
const COURSE20_BACKUP_SCHEMA_VERSION = "aicourse.course20.backup.v1";
const COURSE20_BACKUP_CHECKSUM_ALGORITHM = "sha256-canonical-json-codepoint-v1";
const unsavedArtifactWarnings = new Map<string, string>();
let unsavedArtifactListenersInstalled = false;

function handleUnsavedArtifactBeforeUnload(event: BeforeUnloadEvent): void {
  if (!unsavedArtifactWarnings.size) return;
  event.preventDefault();
  event.returnValue = "";
}

function handleUnsavedArtifactNavigation(event: MouseEvent): void {
  if (!unsavedArtifactWarnings.size
    || event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || !(event.target instanceof Element)) return;
  const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
  const destination = new URL(anchor.href, window.location.href);
  const current = new URL(window.location.href);
  if (destination.origin === current.origin
    && destination.pathname === current.pathname
    && destination.search === current.search) return;
  const warning = unsavedArtifactWarnings.values().next().value
    ?? "You have unsaved changes that are not part of saved course progress. Leave this page? This tab will try to recover them when you return.";
  if (window.confirm(warning)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function syncUnsavedArtifactListeners(): void {
  if (unsavedArtifactWarnings.size && !unsavedArtifactListenersInstalled) {
    window.addEventListener("beforeunload", handleUnsavedArtifactBeforeUnload);
    document.addEventListener("click", handleUnsavedArtifactNavigation, true);
    unsavedArtifactListenersInstalled = true;
  } else if (!unsavedArtifactWarnings.size && unsavedArtifactListenersInstalled) {
    window.removeEventListener("beforeunload", handleUnsavedArtifactBeforeUnload);
    document.removeEventListener("click", handleUnsavedArtifactNavigation, true);
    unsavedArtifactListenersInstalled = false;
  }
}

function setUnsavedArtifactWarning(key: string, warning: string | null): void {
  if (warning) unsavedArtifactWarnings.set(key, warning);
  else unsavedArtifactWarnings.delete(key);
  syncUnsavedArtifactListeners();
}

function label(labels: Labels, key: AgenticVideoEditingUiKey, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function isZhHansLabels(labels: Labels): boolean {
  return labels.contentLocale === "zh-Hans";
}

function artifactStatusLabel(labels: Labels, status: string): string {
  if (status === "valid") return label(labels, "artifactValid", "Valid");
  if (status === "stale") return label(labels, "artifactStale", "Stale");
  return label(labels, "artifactBlocked", "Blocked");
}

function formatValidationIssue(
  labels: Labels,
  validationIssue: { readonly code: string; readonly path: string; readonly message: string },
): string {
  if (!isZhHansLabels(labels)) return validationIssue.message;
  const code = validationIssue.code.toLowerCase();
  const key = /rights|privacy|authority|review|approval/u.test(code)
    ? "validationRecoveryAuthority"
    : /dependency|binding|receipt|stale|upstream/u.test(code)
      ? "validationRecoveryDependency"
      : /caption|audio|color|delivery|accessibility|contrast|crop/u.test(code)
        ? "validationRecoveryDelivery"
        : /render|compile|execution|plan|timeline|operation|clock/u.test(code)
          ? "validationRecoveryExecution"
          : /security|ingest|media|synthetic/u.test(code)
            ? "validationRecoverySecurity"
            : /parse|json|structure|content|title|markdown/u.test(code)
              ? "validationRecoveryStructure"
              : "validationRecoveryGeneral";
  const fallbacks: Record<string, string> = {
    validationRecoveryAuthority: "请补全权限、权利、隐私或绑定人审证据后重试。",
    validationRecoveryDependency: "请刷新上游产物与依赖 hash，再重新验证。",
    validationRecoveryDelivery: "请按交付、字幕、音频、色彩与无障碍合同修复该字段。",
    validationRecoveryExecution: "请核对 current 计划、时钟、工具边界与执行 receipt 后重试。",
    validationRecoverySecurity: "请将不可信内容保持为数据，收紧权限、路径与网络边界后重试。",
    validationRecoveryStructure: "请按产物 schema 修复结构、必需字段与值后重试。",
    validationRecoveryGeneral: "当前字段未通过合同检查；请根据代码与路径修复后重试。",
  };
  return `${validationIssue.code}: ${label(
    labels,
    key as AgenticVideoEditingUiKey,
    fallbacks[key],
  )}`;
}

function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function canonicalJsonForBackup(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("backup-number-invalid");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonForBackup).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort((left, right) => (
      left < right ? -1 : left > right ? 1 : 0
    ));
    return `{${keys.map((key) => (
      `${JSON.stringify(key)}:${canonicalJsonForBackup(record[key])}`
    )).join(",")}}`;
  }
  throw new Error("backup-value-invalid");
}

async function sha256Course20Backup(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJsonForBackup(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function subscribe(notify: () => void): () => void {
  const notifyStorage = (event: StorageEvent): void => {
    if (observeAgenticVideoEditingProgressStorageEvent(event)) notify();
  };
  window.addEventListener(AGENTIC_VIDEO_EDITING_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notifyStorage);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(AGENTIC_VIDEO_EDITING_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notifyStorage);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readAgenticVideoEditingProgress());
}

function useCourseProgress(): {
  progress: AgenticVideoEditingProgressRecord;
  storageAvailable: boolean;
} {
  const serialized = useSyncExternalStore(subscribe, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(
    subscribe,
    isAgenticVideoEditingStorageAvailable,
    () => true,
  );
  let progress: AgenticVideoEditingProgressRecord = {};
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      progress = isCurrentAgenticVideoEditingProgress(
        parsed as AgenticVideoEditingProgressRecord,
      ) ? parsed as AgenticVideoEditingProgressRecord : {};
    }
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}

function StorageWarning({ labels }: { labels: Labels }) {
  return (
    <p className={styles.storageWarning} role="status">
      {label(labels, "storageUnavailable", "Browser storage is unavailable.")}
    </p>
  );
}

function capstoneArtifactIds(): AgenticVideoEditingArtifactId[] {
  return AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
    .filter((contract) => contract.requiredForCapstone)
    .map(
    (contract) => contract.id,
  );
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function isCurrentAssessmentPass(
  progress: AgenticVideoEditingProgressRecord,
): boolean {
  return isCourse20AssessmentMilestoneCurrent(progress);
}

function isCurrentCapstoneRecord(
  value: unknown,
  progress: AgenticVideoEditingProgressRecord,
): value is Course20CapstoneRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return value === progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY]
    && isCourse20CapstoneCurrent(progress);
}

function recognizableCourse20QuizReceipt(
  value: unknown,
): value is Course20QuizReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const receipt = value as Partial<Course20QuizReceipt>;
  return receipt.schemaVersion === "aicourse.course20.quiz-receipt.v1"
    && receipt.courseVersion === AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version
    && receipt.status === "pass"
    && receipt.answers !== null
    && typeof receipt.answers === "object";
}

function capstoneReviewerRoleFromRecord(value: unknown): string {
  return value && typeof value === "object" && !Array.isArray(value)
    ? String((value as Partial<Course20CapstoneRecord>).reviewerRole ?? "")
    : "";
}

function capstoneRubricScoresFromRecord(
  value: unknown,
): Record<AgenticVideoEditingCapstoneRubricDimensionId, number> {
  const existing = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<Course20CapstoneRecord>).rubric?.scores
    : undefined;
  return Object.fromEntries(
    AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map((id) => [
      id,
      existing?.[id] ?? -1,
    ]),
  ) as Record<AgenticVideoEditingCapstoneRubricDimensionId, number>;
}

export type Course20ModuleMapPhase = {
  readonly id: string;
  readonly title: string;
  readonly modules: readonly {
    readonly slug: AgenticVideoEditingModuleSlug;
    readonly order: number;
    readonly title: string;
    readonly href: string;
  }[];
};

type Course20DashboardModule = {
  readonly slug: AgenticVideoEditingModuleSlug;
  readonly href: string;
  readonly title: string;
};

type Course20ModuleLearningState = "current" | "repair" | "in-progress" | "not-started";

function course20NextModuleSlug(
  progress: AgenticVideoEditingProgressRecord,
): AgenticVideoEditingModuleSlug | undefined {
  return AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (moduleManifest) => !isCourse20ModuleCurrent(
      progress,
      moduleManifest.slug,
      CORE_LEARNING_PATH,
    ),
  )?.slug;
}

function course20ModuleLearningState(
  progress: AgenticVideoEditingProgressRecord,
  slug: AgenticVideoEditingModuleSlug,
): Course20ModuleLearningState {
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  )!;
  const current = isCourse20ModuleCurrent(
    progress,
    slug,
    CORE_LEARNING_PATH,
  );
  if (current) return "current";
  const submissions = moduleManifest.artifactIds.map((artifactId) => (
    getCourse20ArtifactSubmission(progress, artifactId, CORE_LEARNING_PATH)
  ));
  const moduleReceipt = progress[
    agenticVideoEditingModuleProgressKey(slug, CORE_LEARNING_PATH)
  ];
  const needsRepair = Boolean(moduleReceipt)
    || submissions.some((submission) => submission
      && (submission.validationReceipt.status !== "valid"
        || submission.receipt.status !== "valid"));
  if (needsRepair) return "repair";
  return submissions.some(Boolean)
    || isCourse20CheckpointReceipt(
      progress[agenticVideoEditingCheckpointKey(slug)],
      slug,
    )
    ? "in-progress"
    : "not-started";
}

function course20ModuleStateLabel(
  state: Course20ModuleLearningState,
  isNext: boolean,
  labels: Labels,
): string {
  const base = state === "current"
    ? label(labels, "moduleStateCurrent", "Current")
    : state === "repair"
      ? label(labels, "moduleStateRepair", "Needs repair")
      : state === "in-progress"
        ? label(labels, "moduleStateInProgress", "In progress")
        : label(labels, "moduleStateNotStarted", "Not started");
  if (!isNext) return base;
  const next = label(labels, "moduleStateNext", "Next");
  return state === "not-started" ? next : `${next} · ${base}`;
}

function course20NextDestination(
  progress: AgenticVideoEditingProgressRecord,
  modules: readonly Course20DashboardModule[],
): { readonly nextModule?: Course20DashboardModule; readonly nextHref: string | null } {
  const nextModule = modules.find(
    (module) => !isCourse20ModuleCurrent(
      progress,
      module.slug,
      CORE_LEARNING_PATH,
    ),
  );
  if (nextModule) {
    const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
      (candidate) => candidate.slug === nextModule.slug,
    )!;
    const submissions = moduleManifest.artifactIds.map((artifactId) => (
      getCourse20ArtifactSubmission(progress, artifactId, CORE_LEARNING_PATH)
    ));
    const artifactsCurrent = areCourse20ArtifactSubmissionsCurrent(
      progress,
      moduleManifest.artifactIds,
      CORE_LEARNING_PATH,
    );
    const checkpointCurrent = isCourse20CheckpointReceipt(
      progress[agenticVideoEditingCheckpointKey(nextModule.slug)],
      nextModule.slug,
    );
    const anchor = artifactsCurrent
      ? checkpointCurrent ? "#module-completion" : "#module-checkpoint"
      : submissions.some(Boolean) || checkpointCurrent ? "#module-practice" : "";
    return { nextModule, nextHref: `${nextModule.href}${anchor}` };
  }
  if (!isCurrentAssessmentPass(progress)) {
    return { nextHref: "#agentic-video-editing-assessment" };
  }
  if (!isCurrentCapstoneRecord(
    progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY],
    progress,
  )) {
    return { nextHref: "#agentic-video-editing-capstone-verified-cut" };
  }
  return { nextHref: null };
}

export function CourseEntryAction({
  modules,
  startLabel,
  resumeLabel,
}: {
  modules: readonly Course20DashboardModule[];
  startLabel: string;
  resumeLabel: string;
}) {
  const { progress } = useCourseProgress();
  const { nextHref } = course20NextDestination(progress, modules);
  const hasProgress = Object.keys(progress).some(
    (key) => key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)
      && key !== AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY
      && key !== AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY,
  );
  return (
    <Link className={styles.primaryButton} href={nextHref ?? "#agentic-video-progress"}>
      {hasProgress ? resumeLabel : startLabel}<span aria-hidden="true">→</span>
    </Link>
  );
}

export function CourseModuleStateBadge({
  slug,
  labels,
}: {
  slug: AgenticVideoEditingModuleSlug;
  labels: Labels;
}) {
  const { progress } = useCourseProgress();
  const state = course20ModuleLearningState(progress, slug);
  const isNext = state !== "current" && course20NextModuleSlug(progress) === slug;
  return (
    <small className={styles.moduleState} data-state={state} data-next={isNext || undefined}>
      {course20ModuleStateLabel(state, isNext, labels)}
    </small>
  );
}

export function CourseModuleProgressMap({
  phases,
  activeSlug,
  labels,
}: {
  phases: readonly Course20ModuleMapPhase[];
  activeSlug: AgenticVideoEditingModuleSlug;
  labels: Labels;
}) {
  const { progress } = useCourseProgress();
  const nextSlug = course20NextModuleSlug(progress);

  return (
    <ol>
      {phases.map((phase) => (
        <li className={styles.mapPhase} key={phase.id}>
          <span>{phase.title}</span>
          <ol>
            {phase.modules.map((module) => {
              const state = course20ModuleLearningState(progress, module.slug);
              const isNext = state !== "current" && module.slug === nextSlug;
              const stateLabel = course20ModuleStateLabel(state, isNext, labels);
              return (
                <li key={module.slug}>
                  <Link
                    href={module.href}
                    aria-current={module.slug === activeSlug ? "page" : undefined}
                    data-state={state}
                    data-next={isNext || undefined}
                  >
                    <span>{String(module.order).padStart(2, "0")}</span>
                    <span><span>{module.title}</span><small>{stateLabel}</small></span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}

export function CourseProgress({
  modules,
  labels,
  startLabel,
  resumeLabel,
  coreMilestones = AGENTIC_VIDEO_EDITING_CORE_PROGRESS_MILESTONES,
  practicumLabSlugs = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.flatMap(
    (moduleManifest) => moduleManifest.productionLabAvailable
      ? [moduleManifest.slug]
      : [],
  ),
  disclaimer,
}: {
  modules: readonly { slug: AgenticVideoEditingModuleSlug; href: string; title: string }[];
  labels: Labels;
  startLabel: string;
  resumeLabel: string;
  coreMilestones?: number;
  practicumLabSlugs?: readonly AgenticVideoEditingModuleSlug[];
  disclaimer?: string;
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const [resetMessage, setResetMessage] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const backupInputId = useId();
  const state = useMemo(() => {
    const coreModules = modules.filter(
      (module) => isCourse20ModuleCurrent(progress, module.slug, CORE_LEARNING_PATH),
    ).length;
    const assessmentPassed = isCurrentAssessmentPass(progress);
    const capstone = isCurrentCapstoneRecord(
      progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY],
      progress,
    );
    const coreCompleted = coreModules
      + Number(assessmentPassed)
      + Number(capstone);
    const nextModule = modules.find(
      (module) => !isCourse20ModuleCurrent(progress, module.slug, CORE_LEARNING_PATH),
    );
    const { nextHref } = course20NextDestination(progress, modules);
    return {
      coreModules,
      assessmentPassed,
      capstone,
      coreCompleted,
      corePercent: Math.round(
        (coreCompleted / coreMilestones) * 100,
      ),
      productionModules: practicumLabSlugs.filter(
        (slug) => isCourse20ModuleCurrent(
          progress,
          slug,
          BUILDER_LEARNING_PATH,
        ),
      ).length,
      productionPercent: Math.round(
        ((practicumLabSlugs.filter(
          (slug) => isCourse20ModuleCurrent(
            progress,
            slug,
            BUILDER_LEARNING_PATH,
          ),
        ).length) / Math.max(practicumLabSlugs.length, 1)) * 100,
      ),
      nextModule,
      nextHref,
    };
  }, [coreMilestones, modules, practicumLabSlugs, progress]);
  const hasProgress = Object.keys(progress).some(
    (key) => key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)
      && key !== AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY
      && key !== AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY,
  );
  const hasLegacy = Boolean(progress[AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY]);

  const exportCourseBackup = (): void => {
    setBackupBusy(true);
    const entries = Object.entries(readAgenticVideoEditingProgress())
      .filter(([key]) => isAgenticVideoEditingOwnedProgressKey(key))
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
    const basis = {
      schemaVersion: COURSE20_BACKUP_SCHEMA_VERSION,
      checksumAlgorithm: COURSE20_BACKUP_CHECKSUM_ALGORITHM,
      courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
      projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
      entries,
    };
    void sha256Course20Backup(basis).then((checksumSha256) => {
      downloadArtifact(
        `course20-backup-${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}.json`,
        `${JSON.stringify({ ...basis, checksumSha256 }, null, 2)}\n`,
        "json",
      );
      setResetMessage(label(labels, "backupExported", "Course 20 backup downloaded. Review learner-authored text before sharing the file."));
    }).catch(() => {
      setResetMessage(label(labels, "backupExportFailed", "The backup could not be created. Your browser progress was not changed."));
    }).finally(() => setBackupBusy(false));
  };

  const restoreCourseBackup = (file: File): void => {
    if (file.size > MAX_COURSE20_BACKUP_BYTES) {
      setResetMessage(label(labels, "backupTooLarge", "This backup is larger than 5 MB and was not read."));
      return;
    }
    setBackupBusy(true);
    void file.text().then(async (source) => {
      const parsed: unknown = JSON.parse(source);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("backup-not-object");
      }
      const candidate = parsed as Record<string, unknown>;
      if (candidate.schemaVersion !== COURSE20_BACKUP_SCHEMA_VERSION
        || candidate.checksumAlgorithm !== COURSE20_BACKUP_CHECKSUM_ALGORITHM
        || candidate.courseVersion !== AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version
        || candidate.projectId !== AGENTIC_VIDEO_EDITING_PROJECT_ID
        || !isSha256(candidate.checksumSha256)
        || !Array.isArray(candidate.entries)
        || candidate.entries.length > 512) {
        throw new Error("backup-contract-invalid");
      }
      const entries: [string, unknown][] = [];
      const seen = new Set<string>();
      for (const entry of candidate.entries) {
        if (!Array.isArray(entry) || entry.length !== 2
          || typeof entry[0] !== "string"
        || !isAgenticVideoEditingOwnedProgressKey(entry[0])
          || seen.has(entry[0])) {
          throw new Error("backup-entry-invalid");
        }
        if (entries.length && entries[entries.length - 1][0] >= entry[0]) {
          throw new Error("backup-entry-order-invalid");
        }
        seen.add(entry[0]);
        entries.push([entry[0], entry[1]]);
      }
      const basis = {
        schemaVersion: candidate.schemaVersion,
        checksumAlgorithm: candidate.checksumAlgorithm,
        courseVersion: candidate.courseVersion,
        projectId: candidate.projectId,
        entries,
      };
      const checksum = await sha256Course20Backup(basis);
      if (checksum !== candidate.checksumSha256) {
        throw new Error("backup-checksum-invalid");
      }
      if (!window.confirm(label(labels, "backupRestoreConfirm", "Replace only Course 20 progress with this validated backup? Other courses will not be changed."))) {
        setResetMessage(label(labels, "backupRestoreCancelled", "Restore cancelled. Browser progress was not changed."));
        return;
      }
      const normalizedImport = normalizeAgenticVideoEditingProgress(
        Object.fromEntries(entries),
      );
      const importedCourseEntries = Object.entries(normalizedImport)
        .filter(([key]) => isAgenticVideoEditingOwnedProgressKey(key));
      const persisted = updateAgenticVideoEditingProgress((record) => {
        for (const key of Object.keys(record)) {
          if (key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)) delete record[key];
        }
        for (const [key, value] of importedCourseEntries) record[key] = value;
      });
      const scratchCleared = persisted
        ? clearAgenticVideoEditingSessionScratch()
        : false;
      window.dispatchEvent(new CustomEvent(
        AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
        { detail: { persisted } },
      ));
      setResetMessage(persisted
        ? scratchCleared
          ? label(labels, "backupRestored", "Course 20 backup restored. Current/stale status was recomputed; other courses were preserved.")
          : label(labels, "backupRestoredScratchWarning", "Saved Course 20 records were restored, but this tab's unsubmitted scratch could not be cleared. Download any draft you need, then reload cautiously.")
        : label(labels, "backupRestoredMemory", "Course 20 backup restored for this tab only because browser storage is unavailable. Existing unsubmitted scratch was preserved."));
    }).catch(() => {
      setResetMessage(label(labels, "backupRestoreFailed", "This file failed the Course 20 version, inventory, or checksum contract. Browser progress was not changed."));
    }).finally(() => setBackupBusy(false));
  };

  useEffect(() => {
    if (resetMessage) statusRef.current?.focus();
  }, [resetMessage]);

  return (
    <section className={styles.progressPanel} id="agentic-video-progress" aria-labelledby="agentic-video-progress-title">
      <header className={styles.progressHeader}>
        <div>
          <p className={styles.eyebrow}>{label(labels, "progressLedger", "Local progress")}</p>
          <h2 id="agentic-video-progress-title">{label(labels, "courseProgress", "Core progress and optional builder work")}</h2>
          <p>{label(labels, "browserStorageNote", "Saved locally in this browser.")}</p>
        </div>
        <output className={styles.progressReadout} aria-live="polite">
          <strong>{state.corePercent}%</strong>
          <span>{interpolate(label(labels, "progressPosition", "{complete} of {total}"), {
            complete: state.coreCompleted,
            total: coreMilestones,
          })}</span>
        </output>
      </header>
      {hasLegacy ? (
        <p className={styles.gateNote} role="status">
          {label(
            labels,
            "legacyProgress",
            "Your legacy free-text drafts were retained. Old completion, checkpoint, assessment, and capstone states were cleared for v1.2.0.",
          )}
        </p>
      ) : null}
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <div className={styles.progressFacts}>
        <div>
          <strong className={styles.progressFactLabel}>{label(labels, "auditCore", "Core creator/reviewer track")}</strong>
          <span className={styles.progressFactValue}>{state.coreModules}/{modules.length} + {Number(state.assessmentPassed)}/1 + {Number(state.capstone)}/1</span>
          <progress
            className={styles.progressBar}
            max={coreMilestones}
            value={state.coreCompleted}
            aria-label={label(labels, "auditCoreProgress", "Fixture-safe browser-contract progress")}
          >{state.corePercent}%</progress>
        </div>
        <div>
          <strong className={styles.progressFactLabel}>{label(labels, "productionPracticum", "Fixture-safe local media lab")}</strong>
          <span className={styles.progressFactValue}>
            {state.productionModules} / {practicumLabSlugs.length}
          </span>
          <progress
            className={styles.progressBar}
            max={Math.max(practicumLabSlugs.length, 1)}
            value={state.productionModules}
            aria-label={label(labels, "productionPracticumProgress", "Fixture-safe local-lab progress")}
          >{state.productionPercent}%</progress>
        </div>
      </div>
      <p className={styles.fieldHint}>
        {disclaimer ?? label(
          labels,
          "completionBoundary",
          "Course completion and local-lab progress are neither certificates, rights clearance, production-sandbox validation, nor publish authorization.",
        )}
      </p>
      {state.nextModule ? (
        <p className={styles.gateNote} role="status">
          {label(labels, "nextModuleReason", "The next formal milestone is blocked until its prerequisite artifact, validator, and checkpoint are current.")}
        </p>
      ) : !state.assessmentPassed ? (
        <p className={styles.gateNote} role="status">
          {label(labels, "assessmentRequiredReason", "All core modules are current. A passing formal assessment is still required before either capstone can be recorded.")}
        </p>
      ) : !state.capstone ? (
        <p className={styles.gateNote} role="status">
          {label(labels, "capstoneRequiredReason", "The formal assessment is current. Validate all twelve stable artifacts and record the version-bound human release or do-not-publish decision.")}
        </p>
      ) : null}
      <div className={styles.buttonRow}>
        {state.nextHref ? (
          <Link className={styles.primaryButton} href={state.nextHref}>
            {hasProgress ? resumeLabel : startLabel}<span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className={styles.completionCallout}>
            {label(labels, "courseComplete", "The Verified Cut is current")}
          </p>
        )}
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!hasProgress && !hasLegacy}
          onClick={() => {
            if (!window.confirm(label(labels, "resetConfirm", "Reset Course 20 progress and retained legacy drafts?"))) return;
            const persisted = resetAgenticVideoEditingProgress();
            setResetMessage(persisted
              ? label(labels, "resetDone", "Course 20 progress reset.")
              : label(labels, "resetDoneMemory", "Session progress reset."));
          }}
        >{label(labels, "resetProgress", "Reset course")}</button>
      </div>
      <details className={styles.backupTools}>
        <summary>{label(labels, "backupTools", "Back up or move this course")}</summary>
        <p>{label(labels, "backupBoundary", "The backup contains only Course 20 browser records and learner-authored artifact text. It excludes media bytes, file paths, handles, credentials, and every other course. Review the JSON before sharing it.")}</p>
        <div className={styles.buttonRow}>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={backupBusy || (!hasProgress && !hasLegacy)}
            onClick={exportCourseBackup}
          >{backupBusy
              ? label(labels, "backupWorking", "Checking backup…")
              : label(labels, "backupExport", "Export Course 20 backup")}</button>
          <label className={styles.secondaryButton} htmlFor={backupInputId} aria-disabled={backupBusy || undefined}>
            {label(labels, "backupRestore", "Restore Course 20 backup")}
            <input
              className={styles.srOnly}
              id={backupInputId}
              name="course20-backup-file"
              type="file"
              accept="application/json,.json"
              disabled={backupBusy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) restoreCourseBackup(file);
              }}
            />
          </label>
        </div>
      </details>
      {state.nextModule ? (
        <p className={styles.nextUp}>
          <strong>{label(labels, "nextUp", "Next")}</strong>
          <span>{state.nextModule.title}</span>
        </p>
      ) : null}
      <p className={resetMessage ? styles.statusMessage : styles.srOnly} role="status" tabIndex={-1} ref={statusRef}>{resetMessage}</p>
    </section>
  );
}

function legacyArtifactText(
  progress: AgenticVideoEditingProgressRecord,
  slug: AgenticVideoEditingModuleSlug,
): string | null {
  const legacy = progress[AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY];
  if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) return null;
  const legacyRecord = legacy as {
    drafts?: Record<string, unknown>;
    entries?: Record<string, unknown>;
  };
  const entries = legacyRecord.drafts ?? legacyRecord.entries;
  const direct = entries?.[`agentic-video-editing.module.${slug}.artifact`];
  const value = typeof direct === "string"
    ? direct
    : Object.entries(entries ?? {}).find(([key]) => key.includes(slug))?.[1];
  return typeof value === "string" ? value : null;
}

function downloadArtifact(
  filename: string,
  contentText: string,
  format: string,
): void {
  const blob = new Blob([contentText], {
    type: format === "yaml"
      ? "application/yaml;charset=utf-8"
      : "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

async function sha256LocalFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function SingleArtifactWorkbench({
  artifactId,
  slug,
  practice,
  labels,
  path = CORE_LEARNING_PATH,
}: {
  artifactId: AgenticVideoEditingArtifactId;
  slug: AgenticVideoEditingModuleSlug;
  practice: AgenticVideoEditingPracticeCopy;
  labels: Labels;
  path?: Course20LearningPath;
}) {
  const contract = getAgenticVideoEditingArtifactContract(artifactId);
  const isPrimary = contract.id === practice.artifactContractId;
  const starter = createCourse20ArtifactStarter(artifactId);
  const displayTitle = isPrimary
    ? practice.artifact
    : `${contract.filename} · ${contract.id}`;
  const requiresReview = artifactId === "plan-diff-independent-approval"
    || artifactId === "release-decision-postmortem"
    || (isPrimary && practice.reviewDecisionRequired === true);
  const { progress, storageAvailable } = useCourseProgress();
  const submission = getCourse20ArtifactSubmission(progress, artifactId, path);
  const persisted = submission?.contentText ?? "";
  const submissionFingerprint = submission
    ? course20ReceiptFingerprint(submission)
    : null;
  const [draftState, setDraftState] = useState(() => ({
    persistedBasis: persisted,
    persistedFingerprint: submissionFingerprint,
    value: persisted || starter,
  }));
  const draft = draftState.value;
  const [announcement, setAnnouncement] = useState("");
  const [externalConflicts, setExternalConflicts] = useState({
    content: false,
    review: false,
  });
  const externalDraftConflict = externalConflicts.content
    || externalConflicts.review;
  const [saving, setSaving] = useState(false);
  const [hashState, setHashState] = useState({ basis: "", value: "" });
  const [localFileIdentity, setLocalFileIdentity] = useState<{
    readonly name: string;
    readonly byteLength: number;
    readonly sha256: string;
  } | null>(null);
  const [localFileStatus, setLocalFileStatus] = useState("");
  const localFileRequestRef = useRef(0);
  const computedHash = hashState.basis === draft ? hashState.value : "";
  const [reviewDecision, setReviewDecision] = useState<"" | "approved" | "blocked">(
    submission?.reviewDecision?.decision === "approved"
      || submission?.reviewDecision?.decision === "blocked"
      ? submission.reviewDecision.decision
      : "",
  );
  const [reviewerRole, setReviewerRole] = useState(
    submission?.reviewDecision?.reviewerRole ?? "",
  );
  const reviewBasisRef = useRef({
    decision: submission?.reviewDecision?.decision ?? "",
    role: submission?.reviewDecision?.reviewerRole ?? "",
  });
  const id = useId();
  const scratchKey = `${AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX}${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}:scratch:${path}:${artifactId}`;
  const writeScratch = ({
    contentText = draft,
    decision = reviewDecision,
    role = reviewerRole,
    baseSubmissionFingerprint = draftState.persistedFingerprint,
  }: {
    readonly contentText?: string;
    readonly decision?: "" | "approved" | "blocked";
    readonly role?: string;
    readonly baseSubmissionFingerprint?: string | null;
  } = {}): void => {
    try {
      window.sessionStorage.setItem(scratchKey, JSON.stringify({
        schemaVersion: "aicourse.course20.artifact-scratch.v2",
        baseSubmissionFingerprint,
        contentText,
        reviewDecision: decision,
        reviewerRole: role,
      }));
    } catch {
      // The in-memory editor remains usable when session storage is unavailable.
    }
  };
  const dependencies = getCourse20ArtifactSubmissions(progress, path);
  const deferredDraft = useDeferredValue(draft);
  const validationPending = deferredDraft !== draft;
  const canonicalDraft = canonicalizeArtifactContent(deferredDraft, artifactId);
  const boundDecision = requiresReview
    && reviewDecision
    && computedHash ? {
    decision: reviewDecision,
    reviewerRole,
    boundArtifactSha256: computedHash,
  } as const : undefined;
  const preview = validateCourse20ArtifactContent(
    artifactId,
    deferredDraft,
    { dependencySubmissions: dependencies, reviewDecision: boundDecision },
  );
  const legacyText = isPrimary ? legacyArtifactText(progress, slug) : null;
  const savedReviewDecision = submission?.reviewDecision?.decision ?? "";
  const savedReviewerRole = submission?.reviewDecision?.reviewerRole ?? "";
  const hasUnsavedChanges = draft !== (persisted || starter)
    || (requiresReview && (
      reviewDecision !== savedReviewDecision
      || reviewerRole !== savedReviewerRole
    ));
  const unsavedWarningKey = `${path}:${artifactId}`;
  const unsavedNavigationWarning = label(
    labels,
    "unsavedNavigationConfirm",
    "You have unsaved artifact changes. Leave this module and discard them?",
  );

  useEffect(() => {
    let active = true;
    void sha256CanonicalArtifactContent(draft, artifactId).then((hash) => {
      if (active) setHashState({ basis: draft, value: hash });
    });
    return () => { active = false; };
  }, [artifactId, draft]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(scratchKey);
      if (!raw) return;
      let recoveredText = raw;
      let recoveredDecision: "" | "approved" | "blocked" = "";
      let recoveredRole = "";
      let recoveredBaseFingerprint: string | null | undefined;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed.schemaVersion === "aicourse.course20.artifact-scratch.v1"
          || parsed.schemaVersion === "aicourse.course20.artifact-scratch.v2") {
          recoveredText = typeof parsed.contentText === "string"
            ? parsed.contentText
            : persisted || starter;
          recoveredDecision = parsed.reviewDecision === "approved"
            || parsed.reviewDecision === "blocked"
            ? parsed.reviewDecision
            : "";
          recoveredRole = typeof parsed.reviewerRole === "string"
            ? parsed.reviewerRole
            : "";
          if (parsed.schemaVersion === "aicourse.course20.artifact-scratch.v2") {
            recoveredBaseFingerprint = typeof parsed.baseSubmissionFingerprint === "string"
              ? parsed.baseSubmissionFingerprint
              : parsed.baseSubmissionFingerprint === null ? null : undefined;
          }
        }
      } catch {
        // Older scratchpads stored only the raw text and remain recoverable.
      }
      if (recoveredText !== (persisted || starter)
        || recoveredDecision !== savedReviewDecision
        || recoveredRole !== savedReviewerRole) {
        queueMicrotask(() => {
          const baseMismatch = recoveredBaseFingerprint === undefined
            ? submissionFingerprint !== null
            : recoveredBaseFingerprint !== submissionFingerprint;
          setDraftState({
            persistedBasis: persisted,
            persistedFingerprint: recoveredBaseFingerprint
              ?? (submissionFingerprint === null ? null : "unknown-legacy-basis"),
            value: recoveredText,
          });
          setReviewDecision(recoveredDecision);
          setReviewerRole(recoveredRole);
          setExternalConflicts((current) => ({
            ...current,
            content: baseMismatch,
          }));
          setAnnouncement(baseMismatch
            ? label(labels, "recoveredDraftConflict", "Recovered draft is based on an older or unknown saved revision. Resolve the conflict before saving.")
            : label(labels, "recoveredDraft", "Recovered an unsaved draft from this tab."));
        });
      }
    } catch {
      // The existing storage warning covers unavailable browser storage.
    }
  }, [labels, persisted, savedReviewDecision, savedReviewerRole, scratchKey, starter, submissionFingerprint]);

  useEffect(() => {
    try {
      // A version-bound scratch envelope owns synchronization until the learner
      // explicitly loads the saved revision or rebases the recovered draft.
      // The recovery effect above compares its base fingerprint and must not be
      // overwritten by the neutral hydration sync below.
      if (window.sessionStorage.getItem(scratchKey)) return;
    } catch {
      // Fall back to the in-memory comparison when session storage is blocked.
    }
    if (draftState.persistedFingerprint === submissionFingerprint) return;
    const nextPersistedValue = persisted || starter;
    if (draftState.value === nextPersistedValue) {
      queueMicrotask(() => {
        setDraftState({
          persistedBasis: persisted,
          persistedFingerprint: submissionFingerprint,
          value: nextPersistedValue,
        });
        setExternalConflicts((current) => ({ ...current, content: false }));
      });
      return;
    }
    const hadUnsavedLocalEdit = draftState.value
      !== (draftState.persistedBasis || starter);
    if (hadUnsavedLocalEdit) {
      queueMicrotask(() => setExternalConflicts(
        (current) => ({ ...current, content: true }),
      ));
      return;
    }
    queueMicrotask(() => {
      setDraftState({
        persistedBasis: persisted,
        persistedFingerprint: submissionFingerprint,
        value: nextPersistedValue,
      });
      setExternalConflicts((current) => ({ ...current, content: false }));
    });
  }, [draftState.persistedBasis, draftState.persistedFingerprint, draftState.value, persisted, scratchKey, starter, submissionFingerprint]);

  useEffect(() => {
    const basis = reviewBasisRef.current;
    if (basis.decision === savedReviewDecision
      && basis.role === savedReviewerRole) return;
    if (reviewDecision === savedReviewDecision
      && reviewerRole === savedReviewerRole) {
      reviewBasisRef.current = {
        decision: savedReviewDecision,
        role: savedReviewerRole,
      };
      queueMicrotask(() => setExternalConflicts(
        (current) => ({ ...current, review: false }),
      ));
      return;
    }
    const hadUnsavedReviewEdit = reviewDecision !== basis.decision
      || reviewerRole !== basis.role;
    if (hadUnsavedReviewEdit) {
      queueMicrotask(() => setExternalConflicts(
        (current) => ({ ...current, review: true }),
      ));
      return;
    }
    queueMicrotask(() => {
      setReviewDecision(
        savedReviewDecision === "approved" || savedReviewDecision === "blocked"
          ? savedReviewDecision
          : "",
      );
      setReviewerRole(savedReviewerRole);
      setExternalConflicts((current) => ({ ...current, review: false }));
    });
    reviewBasisRef.current = {
      decision: savedReviewDecision,
      role: savedReviewerRole,
    };
  }, [reviewDecision, reviewerRole, savedReviewDecision, savedReviewerRole]);

  useEffect(() => {
    setUnsavedArtifactWarning(
      unsavedWarningKey,
      hasUnsavedChanges ? unsavedNavigationWarning : null,
    );
    return () => setUnsavedArtifactWarning(unsavedWarningKey, null);
  }, [hasUnsavedChanges, unsavedNavigationWarning, unsavedWarningKey]);

  return (
    <div
      className={styles.artifactWorkbench}
      data-artifact-status={preview.status}
      role="group"
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.workbenchTopline}>
        <div>
          <p className={styles.eyebrow}>
            {path === CORE_LEARNING_PATH
              ? label(labels, "auditCore", "Fixture-safe browser contracts")
              : label(labels, "productionPracticum", "Fixture-safe local media lab")}
          </p>
          <h3 id={`${id}-title`}>{displayTitle}</h3>
        </div>
        <span>
          {label(labels, "artifactStatus", "Draft status")}: {artifactStatusLabel(labels, preview.status)}
        </span>
      </div>
      <p className={styles.fieldHint}>
        {contract.filename} · {contract.format} · {contract.id}
      </p>
      <details>
        <summary>{label(labels, "workedExample", "Worked example")}</summary>
        <pre tabIndex={0}><code>{practice.workedExample}</code></pre>
        <button
          type="button"
          className={styles.secondaryButton}
          aria-label={`${label(labels, "copyExample", "Copy worked example")}: ${displayTitle}`}
          onClick={() => {
            void copyTextToClipboard(practice.workedExample).then((copied) => {
              setAnnouncement(copied
                ? label(labels, "copyExampleDone", "Worked example copied.")
                : label(labels, "copyFailed", "Copy failed. Select the text and copy it manually."));
            });
          }}
        >{label(labels, "copyExample", "Copy worked example")}</button>
      </details>
      {legacyText ? (
        <details>
          <summary>{label(labels, "legacyDraft", "Retained v1.1 draft — conversion required")}</summary>
          <pre tabIndex={0}><code>{legacyText}</code></pre>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              setDraftState({
                persistedBasis: persisted,
                persistedFingerprint: submissionFingerprint,
                value: legacyText,
              });
              writeScratch({ contentText: legacyText });
            }}
          >{label(labels, "copyLegacyDraft", "Copy legacy text into editor")}</button>
        </details>
      ) : null}
      <label htmlFor={id}>{label(labels, "artifactLabel", `Editable ${contract.format} artifact`)}</label>
      <p id={`${id}-hint`} className={styles.fieldHint}>
        {label(labels, "artifactHint", "Invalid structured content can be saved as a draft, but only a current schema and semantic receipt can complete a module. Character count is not evidence.")}
      </p>
      <textarea
        id={id}
        name={`${path}-${artifactId}`}
        aria-describedby={`${id}-hint ${id}-issues`}
        aria-label={`${label(labels, "artifactLabel", "Machine-readable artifact")}: ${displayTitle}`}
        aria-invalid={!validationPending && preview.status !== "valid" || undefined}
        autoComplete="off"
        rows={18}
        spellCheck={false}
        value={draft}
        onChange={(event) => {
          const value = event.target.value;
          setDraftState({
            persistedBasis: draftState.persistedBasis,
            persistedFingerprint: draftState.persistedFingerprint,
            value,
          });
          writeScratch({ contentText: value });
        }}
      />
      <details className={styles.localFileHash}>
        <summary>{label(labels, "localFileHash", "Hash a local file without uploading it")}</summary>
        <p id={`${id}-local-file-help`}>{label(labels, "localFileHashBoundary", "The browser reads the selected bytes only to compute SHA-256. The binary, path, and file handle are not uploaded or written to localStorage; copy the displayed identity into the appropriate artifact field yourself.")} {label(labels, "localFileHashLimit", "For browser stability, this helper accepts files up to 256 MB. Use a trusted local hashing tool for larger media.")}</p>
        <label htmlFor={`${id}-local-file`}>
          <span>{label(labels, "chooseLocalFile", "Choose local file")}</span>
          <input
            id={`${id}-local-file`}
            name={`${path}-${artifactId}-local-file`}
            type="file"
            aria-label={`${label(labels, "chooseLocalFile", "Choose local file")}: ${displayTitle}`}
            aria-describedby={`${id}-local-file-help ${id}-local-file-status`}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              const requestId = localFileRequestRef.current + 1;
              localFileRequestRef.current = requestId;
              setLocalFileIdentity(null);
              setLocalFileStatus("");
              if (!file) return;
              if (file.size > MAX_BROWSER_HASH_BYTES) {
                setLocalFileStatus(label(labels, "localFileTooLarge", "This file is larger than 256 MB. Nothing was uploaded or saved. Use a trusted local hashing tool instead."));
                return;
              }
              setLocalFileStatus(label(labels, "localFileHashing", "Hashing the selected file locally…"));
              void sha256LocalFile(file).then((sha256) => {
                if (localFileRequestRef.current !== requestId) return;
                setLocalFileIdentity({
                  name: file.name,
                  byteLength: file.size,
                  sha256,
                });
                setLocalFileStatus(label(labels, "localFileHashReady", "Local file hash ready. Nothing was uploaded or saved."));
              }).catch(() => {
                if (localFileRequestRef.current !== requestId) return;
                setLocalFileStatus(label(labels, "localFileHashFailed", "The browser could not hash this file. Nothing was uploaded or saved."));
              });
            }}
          />
        </label>
        <p id={`${id}-local-file-status`} className={localFileStatus ? styles.statusMessage : styles.srOnly} role="status">{localFileStatus}</p>
        {localFileIdentity ? (
          <dl>
            <div><dt>{label(labels, "localFileName", "File name (untrusted display data)")}</dt><dd>{localFileIdentity.name}</dd></div>
            <div><dt>{label(labels, "localFileBytes", "Bytes")}</dt><dd>{localFileIdentity.byteLength}</dd></div>
            <div><dt>SHA-256</dt><dd className={styles.copyValue}><code>{localFileIdentity.sha256}</code><button
              type="button"
              className={styles.secondaryButton}
              aria-label={`${label(labels, "copySha", "Copy SHA-256")}: ${displayTitle}`}
              onClick={() => {
                void copyTextToClipboard(localFileIdentity.sha256).then((copied) => {
                  setAnnouncement(copied
                    ? label(labels, "copyShaDone", "SHA-256 copied.")
                    : label(labels, "copyFailed", "Copy failed. Select the text and copy it manually."));
                });
              }}
            >{label(labels, "copySha", "Copy SHA-256")}</button></dd></div>
          </dl>
        ) : null}
      </details>
      {requiresReview ? (
        <div className={styles.progressFacts}>
          <label>
            <span>{label(labels, "reviewDecision", "Human review decision")}</span>
            <select
              name={`${path}-${artifactId}-review-decision`}
              aria-label={`${label(labels, "reviewDecision", "Human review decision")}: ${displayTitle}`}
              value={reviewDecision}
              required
              onChange={(event) => {
                const next = event.target.value;
                const decision = next === "approved" || next === "blocked" ? next : "";
                setReviewDecision(decision);
                writeScratch({ decision });
              }}
            >
              <option value="">{label(labels, "selectReviewDecision", "Select an explicit decision")}</option>
              <option value="approved">{label(labels, "approved", "Approved artifact/decision")}</option>
              <option value="blocked">{label(labels, "blocked", "Blocked")}</option>
            </select>
          </label>
          <label>
            <span>{label(labels, "reviewDecisionReviewerRole", "Artifact reviewer role")}</span>
            <input
              type="text"
              name={`${path}-${artifactId}-reviewer-role`}
              aria-label={`${label(labels, "reviewDecisionReviewerRole", "Artifact reviewer role")}: ${displayTitle}`}
              autoComplete="off"
              value={reviewerRole}
              onChange={(event) => {
                const role = event.target.value;
                setReviewerRole(role);
                writeScratch({ role });
              }}
            />
          </label>
        </div>
      ) : null}
      <div id={`${id}-issues`} className={styles.feedback} aria-busy={validationPending || undefined}>
        <strong role="status" aria-live="polite" aria-atomic="true">
          {validationPending
            ? label(labels, "checkingDraft", "Checking the latest draft…")
            : preview.status === "valid"
            ? label(labels, "artifactValid", "Artifact validator passes")
            : label(labels, "artifactNeedsWork", "Artifact is not current-valid")}
        </strong>
        {!validationPending && preview.issues.length ? (
          <ul>
            {preview.issues.map((validationIssue, index) => (
              <li key={`${validationIssue.code}-${validationIssue.path}-${index}`}>
                <code>{validationIssue.path}</code> - {formatValidationIssue(labels, validationIssue)}
              </li>
            ))}
          </ul>
        ) : !validationPending ? (
          <p>{label(labels, "artifactAcceptancePassed", "JSON, semantic policy, dependencies, and bound review checks pass.")}</p>
        ) : null}
      </div>
      <dl className={styles.progressFacts}>
        <div><dt>{label(labels, "contentHash", "Canonical content SHA-256")}</dt><dd><code>{computedHash || "—"}</code></dd></div>
        <div>
          <dt>{label(labels, "savedReceipt", "Saved receipt")}</dt>
          <dd>{submission ? `${artifactStatusLabel(labels, submission.validationReceipt.status)} · r${submission.revision}` : label(labels, "notSaved", "not saved")}</dd>
        </div>
      </dl>
      {hasUnsavedChanges ? (
        <p className={styles.storageWarning} role="status">
          {label(labels, "unsavedArtifactChange", "This draft differs from the saved evidence. It cannot change completion until saved; saving it will invalidate dependent milestones and capstones.")}
        </p>
      ) : null}
      {externalDraftConflict ? (
        <div className={styles.conflictPanel}>
          <p role="status">{label(labels, "externalDraftConflict", "Saved evidence changed in another tab. Your unsaved draft remains here; choose which basis to use before saving.")}</p>
          <div className={styles.buttonRow}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                const nextPersistedValue = persisted || starter;
                setDraftState({
                  persistedBasis: persisted,
                  persistedFingerprint: submissionFingerprint,
                  value: nextPersistedValue,
                });
                setReviewDecision(
                  savedReviewDecision === "approved" || savedReviewDecision === "blocked"
                    ? savedReviewDecision
                    : "",
                );
                setReviewerRole(savedReviewerRole);
                reviewBasisRef.current = {
                  decision: savedReviewDecision,
                  role: savedReviewerRole,
                };
                setExternalConflicts({ content: false, review: false });
                try { window.sessionStorage.removeItem(scratchKey); } catch { /* in-memory state was resolved */ }
                setAnnouncement(label(labels, "conflictUseSaved", "Loaded the latest saved evidence and discarded the recovered draft."));
              }}
            >{label(labels, "conflictLoadSaved", "Load latest saved")}</button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setDraftState({
                  persistedBasis: persisted,
                  persistedFingerprint: submissionFingerprint,
                  value: draft,
                });
                reviewBasisRef.current = {
                  decision: savedReviewDecision,
                  role: savedReviewerRole,
                };
                setExternalConflicts({ content: false, review: false });
                writeScratch({ baseSubmissionFingerprint: submissionFingerprint });
                setAnnouncement(label(labels, "conflictKeepDraft", "Recovered draft rebased on the latest saved revision. Validate it carefully before saving."));
              }}
            >{label(labels, "conflictRebaseDraft", "Keep and rebase my draft")}</button>
          </div>
        </div>
      ) : null}
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <div className={styles.buttonRow}>
        <button
          className={styles.primaryButton}
          type="button"
          aria-label={`${label(labels, "saveArtifact", "Validate and save artifact")}: ${displayTitle}`}
          disabled={saving || externalDraftConflict}
          onClick={() => {
            setSaving(true);
            void saveAgenticVideoEditingArtifact({
              artifactId,
              slug,
              path,
              contentText: draft,
              expectedPreviousFingerprint: draftState.persistedFingerprint,
              ...(requiresReview && reviewDecision
                ? { reviewDecision: { decision: reviewDecision, reviewerRole } }
                : {}),
            }).then(({ submission: saved, persisted: didPersist, conflicted }) => {
              if (conflicted) {
                setExternalConflicts((current) => ({ ...current, content: true }));
                setAnnouncement(label(labels, "artifactSaveConflict", "A newer saved revision appeared while this draft was validating. Nothing was overwritten; resolve the conflict and retry."));
                return;
              }
              try { window.sessionStorage.removeItem(scratchKey); } catch { /* no persistent scratch to clear */ }
              setDraftState({
                persistedBasis: saved.contentText,
                persistedFingerprint: course20ReceiptFingerprint(saved),
                value: saved.contentText,
              });
              reviewBasisRef.current = {
                decision: saved.reviewDecision?.decision ?? "",
                role: saved.reviewDecision?.reviewerRole ?? "",
              };
              setExternalConflicts({ content: false, review: false });
              setAnnouncement(`${didPersist
                ? label(labels, "artifactSaved", "Artifact saved locally.")
                : label(labels, "resetDoneMemory", "Saved for this tab.")} ${artifactStatusLabel(labels, saved.validationReceipt.status)}.`);
            }).catch(() => {
              setAnnouncement(label(labels, "artifactSaveFailed", "The artifact could not be saved. Your draft remains in this editor; review browser storage and try again."));
            }).finally(() => setSaving(false));
          }}
        >{saving ? label(labels, "validating", "Validating…") : label(labels, "saveArtifact", "Validate and save artifact")}</button>
        <button
          className={styles.secondaryButton}
          type="button"
          aria-label={`${!validationPending && preview.status === "valid"
            ? label(labels, "downloadJson", "Download validated artifact")
            : label(labels, "downloadDraft", "Download draft")}: ${displayTitle}`}
          disabled={validationPending || !canonicalDraft.canonicalText}
          onClick={() => downloadArtifact(
            contract.filename,
            `${contract.format === "yaml" ? draft : canonicalDraft.canonicalText ?? draft}\n`,
            contract.format,
          )}
        >{!validationPending && preview.status === "valid"
            ? label(labels, "downloadJson", "Download validated artifact")
            : label(labels, "downloadDraft", "Download draft")}</button>
      </div>
      <p className={styles.fieldHint}>{practice.reviewGate}</p>
      <p className={announcement ? styles.statusMessage : styles.srOnly} role="status">{announcement}</p>
    </div>
  );
}

export function ArtifactWorkbench({
  slug,
  practice,
  labels,
  path = CORE_LEARNING_PATH,
}: {
  slug: AgenticVideoEditingModuleSlug;
  practice: AgenticVideoEditingPracticeCopy;
  labels: Labels;
  path?: Course20LearningPath;
}) {
  const contracts = getAgenticVideoEditingModuleArtifactContracts(slug)
    .filter((contract) => contract.requiredForModuleCompletion);
  return (
    <div className={styles.artifactWorkbenchGroup}>
      {contracts.map((contract) => (
        <SingleArtifactWorkbench
          key={`${path}:${contract.id}`}
          artifactId={contract.id}
          slug={slug}
          practice={practice}
          labels={labels}
          path={path}
        />
      ))}
    </div>
  );
}

export function ModuleCheckpoint({
  slug,
  checkpoint,
  labels,
}: {
  slug: AgenticVideoEditingModuleSlug;
  checkpoint: AgenticVideoEditingCheckpointCopy;
  labels: Labels;
}) {
  const { progress } = useCourseProgress();
  const key = agenticVideoEditingCheckpointKey(slug);
  const alreadyPassed = isCourse20CheckpointReceipt(progress[key], slug);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<"idle" | "correct" | "incorrect">(
    alreadyPassed ? "correct" : "idle",
  );
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const selectedOption = checkpoint.options.find((option) => option.id === selected);
  const checkpointBlueprint = getCourse20CheckpointBlueprint(slug);

  return (
    <section className={styles.checkpoint} id="module-checkpoint" aria-labelledby={`checkpoint-${slug}`}>
      <p className={styles.eyebrow}>{label(labels, "checkpoint", "Checkpoint")}</p>
      <h2 id={`checkpoint-${slug}`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className={styles.srOnly}>{checkpoint.question}</legend>
        {checkpoint.options.map((option, index) => (
          <label key={option.id} className={styles.answerOption} data-selected={selected === option.id || undefined}>
            <input
              type="radio"
              name={`checkpoint-${slug}`}
              value={option.id}
              checked={selected === option.id}
              onChange={() => {
                setSelected(option.id);
                setResult("idle");
                setPersisted(null);
              }}
            />
            <span>{String.fromCharCode(65 + index)}</span>
            <strong>{option.label}</strong>
          </label>
        ))}
      </fieldset>
      <button
        className={styles.primaryButton}
        type="button"
        disabled={selected === null}
        onClick={() => {
          if (selected === checkpointBlueprint.correctOptionId) {
            const receipt = createCourse20CheckpointReceipt(slug, selected);
            const didPersist = receipt
              ? updateAgenticVideoEditingProgress((record) => {
                record[key] = receipt;
              })
              : false;
            setPersisted(didPersist);
            setResult("correct");
          } else {
            setPersisted(null);
            setResult("incorrect");
          }
        }}
      >{label(labels, "checkAnswer", "Check answer")}</button>
      {result !== "idle" ? (
        <div className={styles.feedback} data-correct={result === "correct" || undefined} role="status">
          <strong>{result === "correct" ? label(labels, "correct", "Correct") : label(labels, "incorrect", "Not yet")}</strong>
          <p>{result === "incorrect" ? selectedOption?.feedback : checkpoint.explanation}</p>
          {result === "incorrect" ? <p>{checkpoint.explanation}</p> : null}
          {result === "correct" && persisted === false ? (
            <p>{label(labels, "checkpointMemoryOnly", "Checkpoint passed for this tab, but browser storage is unavailable.")}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function ModuleCompletion({
  slug,
  labels,
  path = CORE_LEARNING_PATH,
}: {
  slug: AgenticVideoEditingModuleSlug;
  labels: Labels;
  path?: Course20LearningPath;
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const [announcement, setAnnouncement] = useState("");
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  )!;
  const submissions = getCourse20ArtifactSubmissions(progress, path);
  const checkpointPassed = isCourse20CheckpointReceipt(
    progress[agenticVideoEditingCheckpointKey(slug)],
    slug,
  );
  const artifactReady = areCourse20ArtifactSubmissionsCurrent(
    progress,
    moduleManifest.artifactIds,
    path,
  );
  const missingArtifacts = moduleManifest.artifactIds.filter((artifactId) => {
    const submission = submissions[artifactId];
    return !submission
      || submission.validationReceipt.status !== "valid"
      || submission.receipt.status !== "valid"
      || !course20ArtifactDependenciesAreCurrent(submission, submissions);
  });
  const missingPrerequisites = moduleManifest.requires.filter(
    (prerequisite) => !isCourse20ModuleCurrent(progress, prerequisite, path),
  );
  const prerequisitesReady = missingPrerequisites.length === 0;
  const complete = checkpointPassed
    && prerequisitesReady
    && isCourse20ModuleCurrent(progress, slug, path);
  const ready = checkpointPassed && artifactReady && prerequisitesReady;
  const blockingReasons = [
    ...missingPrerequisites.map((prerequisite) => `${prerequisite}: ${label(labels, "prerequisiteNotCurrent", "prerequisite milestone is not current.")}`),
    ...missingArtifacts.flatMap((artifactId) => {
      const submission = submissions[artifactId];
      if (!submission) return [`${artifactId}: ${label(labels, "submissionMissing", "no submission is saved.")}`];
      if (submission.validationReceipt.status !== "valid") {
        return submission.validationReceipt.issues.map(
          (validationIssue) => `${artifactId} ${validationIssue.path}: ${formatValidationIssue(labels, validationIssue)}`,
        );
      }
      return [`${artifactId}: ${label(labels, "dependencyHashesStale", "dependency semantic hashes are stale.")}`];
    }),
    ...(!checkpointPassed ? [label(labels, "checkpointNotPassed", "The module checkpoint has not been passed.")] : []),
  ];

  return (
    <section
      className={styles.moduleCompletion}
      id={path === CORE_LEARNING_PATH ? "module-completion" : `module-completion-${path}`}
      aria-labelledby={`completion-${path}-${slug}`}
    >
      <div>
        <p className={styles.eyebrow}>
          {path === CORE_LEARNING_PATH
            ? label(labels, "auditCore", "Fixture-safe browser contracts")
            : label(labels, "productionPracticum", "Fixture-safe local media lab")}
        </p>
        <h2 id={`completion-${path}-${slug}`}>
          {complete
            ? label(labels, "moduleComplete", "Milestone current")
            : label(labels, "moduleIncomplete", "Complete the evidence gate")}
        </h2>
        <p>{label(labels, "completionInstruction", "Reading and drafting stay open. Marking complete requires current dependencies, a valid artifact, and the checkpoint.")}</p>
        <ul>
          <li data-complete={prerequisitesReady || undefined}><span aria-hidden="true">{prerequisitesReady ? "✓" : "○"}</span>{label(labels, "prerequisiteRequirement", "Prerequisite milestones current")}</li>
          <li data-complete={artifactReady || undefined}><span aria-hidden="true">{artifactReady ? "✓" : "○"}</span>{label(labels, "artifactRequirement", "Artifact valid with current dependency hashes")}</li>
          <li data-complete={checkpointPassed || undefined}><span aria-hidden="true">{checkpointPassed ? "✓" : "○"}</span>{label(labels, "checkpointRequirement", "Checkpoint passed")}</li>
        </ul>
        {moduleManifest.artifactIds.some(
          (artifactId) => submissions[artifactId]?.validationReceipt.status === "stale",
        ) ? (
          <p className={styles.storageWarning}>{label(labels, "staleInstruction", "Your content was preserved. Re-run the listed validator/render/QC steps against current upstream hashes.")}</p>
        ) : null}
        {!ready && blockingReasons.length ? (
          <details className={styles.gateNote}>
            <summary>{label(labels, "whyBlocked", "Why completion is blocked")}</summary>
            <ul>{blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </details>
        ) : null}
        {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      </div>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!ready || complete}
        onClick={() => {
          const persisted = completeAgenticVideoEditingModule(slug, path);
          const latest = readAgenticVideoEditingProgress();
          const currentInSession = isCourse20CheckpointReceipt(
            latest[agenticVideoEditingCheckpointKey(slug)],
            slug,
          )
            && isCourse20ModuleCurrent(latest, slug, path);
          setAnnouncement(currentInSession
            ? persisted
              ? label(labels, "moduleCompletionSaved", "Milestone recorded with the current artifact and checkpoint.")
              : label(labels, "moduleCompletionMemoryOnly", "Milestone is current for this tab, but browser storage is unavailable.")
            : label(labels, "moduleCompletionBlocked", "Completion was not recorded because a required gate changed. Review the blockers and try again."));
        }}
      >{complete ? label(labels, "complete", "Current") : label(labels, "markComplete", "Mark current")}</button>
      <p className={announcement ? styles.statusMessage : styles.srOnly} role="status">{announcement}</p>
    </section>
  );
}

export function FinalAssessment({
  questions,
  passPercent,
  title,
  summary,
  labels,
  moduleLinks,
}: {
  questions: readonly AgenticVideoEditingFinalQuestionCopy[];
  passPercent: number;
  title: string;
  summary: string;
  labels: Labels;
  moduleLinks: Partial<Record<AgenticVideoEditingModuleSlug, {
    readonly href: string;
    readonly order: number;
    readonly title: string;
  }>>;
}) {
  const { progress } = useCourseProgress();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [incompleteMessage, setIncompleteMessage] = useState("");
  const [assessmentDraftMessage, setAssessmentDraftMessage] = useState("");
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    criticalMiss: boolean;
    diagnosticOnly: boolean;
    persisted: boolean;
  } | null>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const assessmentScratchKey = `${AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX}${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}:assessment-scratch`;
  const missingCoreModules = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.filter(
    (moduleManifest) => !isCourse20ModuleCurrent(
      progress,
      moduleManifest.slug,
      CORE_LEARNING_PATH,
    ),
  );
  const formalReady = missingCoreModules.length === 0;
  const storedPassValue = progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY];
  const hasStoredPassReceipt = recognizableCourse20QuizReceipt(storedPassValue);
  const storedPass = isCourse20AssessmentMilestoneCurrent(progress);
  const alreadyPassed = storedPass;
  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const resultIsCurrentPass = Boolean(
    result?.passed && !result.diagnosticOnly && storedPass,
  );

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(assessmentScratchKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const recovered = Object.fromEntries(questions.flatMap((question) => {
        const answer = parsed[question.id];
        return typeof answer === "string"
          && question.options.some((option) => option.id === answer)
          ? [[question.id, answer]]
          : [];
      }));
      if (Object.keys(recovered).length) {
        queueMicrotask(() => {
          setAnswers(recovered);
          setAssessmentDraftMessage(label(labels, "assessmentDraftRecovered", "Recovered your unsubmitted assessment answers from this tab."));
        });
      }
    } catch {
      // Ignore an unreadable scratchpad; formal receipts remain independently validated.
    }
  }, [assessmentScratchKey, labels, questions]);

  useEffect(() => {
    const synchronizeReplacedProgress = (): void => {
      const latest = readAgenticVideoEditingProgress();
      const receipt = latest[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY];
      if (isCourse20AssessmentMilestoneCurrent(latest)
        && recognizableCourse20QuizReceipt(receipt)) {
        setAnswers({ ...receipt.answers });
        setResult({
          score: receipt.score,
          passed: true,
          criticalMiss: false,
          diagnosticOnly: false,
          persisted: isAgenticVideoEditingStorageAvailable(),
        });
      } else {
        setAnswers({});
        setResult(null);
      }
      setIncompleteMessage("");
      setAssessmentDraftMessage("");
    };
    window.addEventListener(
      AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
      synchronizeReplacedProgress,
    );
    return () => window.removeEventListener(
      AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
      synchronizeReplacedProgress,
    );
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  return (
    <section className={styles.assessment} id="agentic-video-editing-assessment" aria-labelledby="agentic-video-assessment-title">
      <header className={styles.sectionHeader}>
        <p className={styles.eyebrow}>{label(labels, "finalAssessment", "Final assessment")}</p>
        <h2 id="agentic-video-assessment-title">{title}</h2>
        <p>{summary}</p>
        <p className={styles.gateNote}>
          {interpolate(label(labels, "assessmentPass", "Pass: {percent}% plus all critical controls."), { percent: passPercent })}
        </p>
        <p className={styles.gateNote} role="status">
          {formalReady
            ? label(labels, "assessmentFormalReady", "All core modules are current. This attempt may record the formal knowledge gate.")
            : `${label(labels, "assessmentDiagnosticOnly", "Diagnostic mode only. Formal credit is blocked until these core modules are current:")} ${missingCoreModules.map((moduleManifest) => {
              const moduleLink = moduleLinks[moduleManifest.slug];
              return moduleLink ? `M${moduleLink.order} ${moduleLink.title}` : moduleManifest.slug;
            }).join(", ")}.`}
        </p>
        <output className={styles.assessmentAnswered} aria-live="polite">
          {interpolate(label(labels, "assessmentAnswered", "{answered} of {total} answered"), {
            answered: answeredCount,
            total: questions.length,
          })}
        </output>
        <p className={assessmentDraftMessage ? styles.statusMessage : styles.srOnly} role="status">{assessmentDraftMessage}</p>
        {hasStoredPassReceipt && !storedPass ? (
          <p className={styles.storageWarning}>
            {label(labels, "assessmentPassStale", "A previously stored pass is not current while any core artifact or module is stale. Complete the blockers and retake the assessment.")}
          </p>
        ) : null}
      </header>
      <div className={styles.questionList}>
        {questions.map((question, questionIndex) => (
          <fieldset key={question.id} className={styles.assessmentQuestion}>
            <legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.question}</legend>
            {question.options.map((option, optionIndex) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name={`assessment-${question.id}`}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={() => {
                    const nextAnswers = { ...answers, [question.id]: option.id };
                    setAnswers(nextAnswers);
                    setResult(null);
                    setIncompleteMessage("");
                    try { window.sessionStorage.setItem(assessmentScratchKey, JSON.stringify(nextAnswers)); } catch { /* answers remain in memory */ }
                  }}
                />
                <span>{String.fromCharCode(65 + optionIndex)}</span>{option.label}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className={styles.buttonRow}>
        <button
          className={styles.primaryButton}
          type="button"
          aria-describedby="agentic-video-assessment-incomplete"
          onClick={() => {
          const firstMissing = questions.find((question) => !answers[question.id]);
          if (firstMissing) {
            setIncompleteMessage(label(labels, "assessmentIncomplete", "Answer every question before scoring. Focus moved to the first unanswered question."));
            const firstControl = document.getElementsByName(`assessment-${firstMissing.id}`)[0];
            if (firstControl instanceof HTMLElement) firstControl.focus();
            return;
          }
          const scored = scoreCourse20FinalAssessment(questions, answers);
          const { score, criticalMiss, passed } = scored;
          const diagnosticOnly = !formalReady;
          const persisted = updateAgenticVideoEditingProgress((record) => {
            record[AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY] = {
              score,
              passed,
              criticalMiss,
              answeredOnCourseVersion:
                AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
            };
            if (!diagnosticOnly) {
              record[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY] = Math.max(
                typeof record[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY] === "number"
                  ? Number(record[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY]) : 0,
                score,
              );
              if (passed) {
                const quizReceipt = createCourse20QuizReceipt(record, answers);
                if (quizReceipt) {
                  record[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY] = quizReceipt;
                }
              }
            }
          });
          setResult({ score, passed, criticalMiss, diagnosticOnly, persisted });
          setIncompleteMessage("");
          if (passed && !diagnosticOnly) {
            try { window.sessionStorage.removeItem(assessmentScratchKey); } catch { /* no scratchpad to clear */ }
          }
          }}
        >{label(labels, "submitAssessment", "Score assessment")}</button>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={answeredCount === 0 && !result}
          onClick={() => {
            if (!window.confirm(label(labels, "clearAssessmentConfirm", "Clear every unsubmitted assessment answer in this tab? Saved module and course records will not change."))) return;
            try { window.sessionStorage.removeItem(assessmentScratchKey); } catch { /* in-memory state is still cleared */ }
            setAnswers({});
            setResult(null);
            setIncompleteMessage("");
            setAssessmentDraftMessage(label(labels, "assessmentCleared", "Unsubmitted assessment answers cleared. Saved course records were not changed."));
          }}
        >{label(labels, "clearAssessmentAnswers", "Clear answers")}</button>
      </div>
      <p id="agentic-video-assessment-incomplete" className={incompleteMessage ? styles.storageWarning : styles.srOnly} role="status">{incompleteMessage}</p>
      {result ? (
        <div
          className={styles.assessmentResult}
          data-passed={resultIsCurrentPass || undefined}
          data-testid="course20-assessment-result"
        >
          <p className={styles.assessmentResultSummary} role="status" tabIndex={-1} ref={resultRef}>
            <strong>{label(labels, "score", "Score")}: {result.score}%</strong>
            <span>
            {result.diagnosticOnly
              ? label(labels, "assessmentDiagnostic", "Diagnostic only: finish all ten current core modules before a pass can be recorded.")
              : result.passed && !storedPass
                ? label(labels, "assessmentPassStale", "A previously stored pass is no longer current. Repair the earliest blocked milestone, then retake the formal assessment.")
                : result.passed
                ? label(labels, "assessmentPassed", "Assessment passed")
                : result.criticalMiss
                  ? label(labels, "criticalMiss", "A critical control question is incorrect.")
                  : label(labels, "assessmentRetry", "Review the feedback and try again.")}
            </span>
          </p>
          {!result.passed && alreadyPassed ? (
            <p>{label(labels, "earlierPassRetained", "Your earlier knowledge-pass record remains saved; this attempt did not pass.")}</p>
          ) : null}
          {!result.persisted ? (
            <p>{label(labels, "assessmentMemoryOnly", "This result is available for this tab only because browser storage is unavailable.")}</p>
          ) : null}
          <ol>
            {questions.map((question) => {
              const blueprint = getCourse20FinalQuestionBlueprint(question.id);
              const correct = answers[question.id]
                === blueprint?.correctOptionId;
              const chosen = question.options.find(
                (option) => option.id === answers[question.id],
              );
              return (
                <li key={question.id} data-correct={correct || undefined}>
                  <strong>
                    {moduleLinks[question.moduleSlug] ? (
                      <Link href={moduleLinks[question.moduleSlug]!.href}>
                        M{moduleLinks[question.moduleSlug]!.order} {moduleLinks[question.moduleSlug]!.title}
                      </Link>
                    ) : question.moduleSlug} · {correct
                      ? label(labels, "correct", "Correct")
                      : label(labels, "incorrect", "Incorrect")}
                  </strong>
                  {!correct && chosen ? <span>{chosen.feedback}</span> : null}
                  <span>{question.explanation}</span>
                </li>
              );
            })}
          </ol>
          {resultIsCurrentPass ? (
            <p className={styles.assessmentNextAction}>
              <a className={styles.primaryButton} href="#agentic-video-editing-capstone-verified-cut">
                {label(labels, "continueCapstone", "Continue to Capstone")}<span aria-hidden="true">→</span>
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function CapstoneChecklist({
  artifacts,
  criteria,
  statement,
  labels,
}: {
  artifacts?: readonly string[];
  criteria?: readonly AgenticVideoEditingCapstoneCriterionCopy[];
  statement: string;
  labels: Labels;
  /** Deprecated v1 display prop. Course 20 v2 has one verified capstone. */
  path?: "audit" | "production";
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const storedRecord = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY];
  const [reviewerRole, setReviewerRole] = useState(() => (
    capstoneReviewerRoleFromRecord(storedRecord)
  ));
  const [announcement, setAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);
  const [rubricScores, setRubricScores] = useState<Readonly<Record<
    AgenticVideoEditingCapstoneRubricDimensionId,
    number
  >>>(() => capstoneRubricScoresFromRecord(storedRecord));
  const capstoneScratchKey = `${AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX}${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}:capstone-scratch`;
  const storedReviewerRole = storedRecord
    && typeof storedRecord === "object"
    && !Array.isArray(storedRecord)
    ? String((storedRecord as Partial<Course20CapstoneRecord>).reviewerRole ?? "")
    : "";
  const storedRubricScores = storedRecord
    && typeof storedRecord === "object"
    && !Array.isArray(storedRecord)
    ? (storedRecord as Partial<Course20CapstoneRecord>).rubric?.scores
    : undefined;
  const capstoneDraftDirty = reviewerRole !== storedReviewerRole
    || AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.some(
      (id) => rubricScores[id] !== (storedRubricScores?.[id] ?? -1),
    );
  const writeCapstoneScratch = (
    nextReviewerRole: string,
    nextScores: Readonly<Record<AgenticVideoEditingCapstoneRubricDimensionId, number>>,
  ): void => {
    try {
      window.sessionStorage.setItem(capstoneScratchKey, JSON.stringify({
        schemaVersion: "aicourse.course20.capstone-scratch.v1",
        reviewerRole: nextReviewerRole,
        rubricScores: nextScores,
      }));
    } catch {
      // The in-memory rubric remains usable when session storage is unavailable.
    }
  };

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(capstoneScratchKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed.schemaVersion !== "aicourse.course20.capstone-scratch.v1") return;
      const recoveredRole = typeof parsed.reviewerRole === "string"
        ? parsed.reviewerRole
        : "";
      const rawScores = parsed.rubricScores && typeof parsed.rubricScores === "object"
        && !Array.isArray(parsed.rubricScores)
        ? parsed.rubricScores as Record<string, unknown>
        : {};
      const recoveredScores = Object.fromEntries(
        AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map((id) => {
          const value = rawScores[id];
          return [id, typeof value === "number" && Number.isInteger(value)
            && value >= -1 && value <= 3 ? value : -1];
        }),
      ) as Record<AgenticVideoEditingCapstoneRubricDimensionId, number>;
      queueMicrotask(() => {
        setReviewerRole(recoveredRole);
        setRubricScores(recoveredScores);
        setAnnouncement(label(labels, "capstoneDraftRecovered", "Recovered your unsubmitted Capstone rubric from this tab."));
      });
    } catch {
      // Ignore an unreadable scratchpad; stored receipts remain authoritative.
    }
  }, [capstoneScratchKey, labels]);

  useEffect(() => {
    const synchronizeReplacedProgress = (): void => {
      const latest = readAgenticVideoEditingProgress();
      const nextRecord = latest[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY];
      setReviewerRole(capstoneReviewerRoleFromRecord(nextRecord));
      setRubricScores(capstoneRubricScoresFromRecord(nextRecord));
      setAnnouncement("");
      setSaving(false);
    };
    window.addEventListener(
      AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
      synchronizeReplacedProgress,
    );
    return () => window.removeEventListener(
      AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT,
      synchronizeReplacedProgress,
    );
  }, []);

  useEffect(() => {
    setUnsavedArtifactWarning(
      "capstone-rubric",
      capstoneDraftDirty
        ? label(labels, "unsavedCapstoneConfirm", "You have an unsubmitted Capstone rubric that is not part of saved course progress. Leave this page? This tab will try to recover it when you return.")
        : null,
    );
    return () => setUnsavedArtifactWarning("capstone-rubric", null);
  }, [capstoneDraftDirty, labels]);
  const artifactIds = capstoneArtifactIds();
  const submissions = getCourse20ArtifactSubmissions(progress, CORE_LEARNING_PATH);
  const missingModules = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.filter(
    (moduleManifest) => !isCourse20ModuleCurrent(
      progress,
      moduleManifest.slug,
      CORE_LEARNING_PATH,
    ),
  ).map((moduleManifest) => moduleManifest.slug);
  const missingArtifactHashes = artifactIds.filter(
    (artifactId) => !isSha256(submissions[artifactId]?.contentSha256),
  );
  const assessmentCurrent = isCurrentAssessmentPass(progress);
  const modulesCurrent = missingModules.length === 0;
  const artifactsCurrent = missingArtifactHashes.length === 0
    && areCourse20ArtifactSubmissionsCurrent(
      progress,
      artifactIds,
      CORE_LEARNING_PATH,
    );
  const artifactHashes = Object.fromEntries(
    artifactIds.flatMap((artifactId) => submissions[artifactId]?.contentSha256
      ? [[artifactId, submissions[artifactId]!.contentSha256]]
      : []),
  ) as Partial<Record<AgenticVideoEditingArtifactId, string>>;
  const moduleReceiptFingerprints = Object.fromEntries(
    AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.map((moduleManifest) => [
      moduleManifest.slug,
      course20ReceiptFingerprint(progress[
        agenticVideoEditingModuleProgressKey(
          moduleManifest.slug,
          CORE_LEARNING_PATH,
        )
      ]),
    ]),
  ) as Record<AgenticVideoEditingModuleSlug, string>;
  const quizReceiptFingerprint = course20ReceiptFingerprint(
    progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY],
  );
  let unresolvedCriticalBlockers: readonly string[] = [
    "release-decision-artifact-not-current",
  ];
  const releaseDecisionSubmission = submissions["release-decision-postmortem"];
  if (releaseDecisionSubmission?.validationReceipt.status === "valid") {
    try {
      const parsed = JSON.parse(releaseDecisionSubmission.contentText) as {
        unresolvedCriticalBlockers?: unknown;
      };
      if (Array.isArray(parsed.unresolvedCriticalBlockers)
        && parsed.unresolvedCriticalBlockers.every(
          (value) => typeof value === "string" && value.trim().length > 0,
        )) {
        unresolvedCriticalBlockers = parsed.unresolvedCriticalBlockers;
      }
    } catch {
      // The artifact validator owns parse feedback; this gate remains closed.
    }
  }
  const rubricTotal = AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS
    .reduce((sum, id) => sum + Math.max(0, rubricScores[id]), 0);
  const rubric = {
    version: AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
    fingerprint: COURSE20_CAPSTONE_RUBRIC_FINGERPRINT,
    scores: rubricScores,
    total: rubricTotal,
    unresolvedCriticalBlockers,
  } satisfies Course20CapstoneRubricRecord;
  const rubricPasses = isCourse20CapstoneRubricPassing(rubric);
  const complete = isCurrentCapstoneRecord(storedRecord, progress);
  const ready = modulesCurrent
    && artifactsCurrent
    && assessmentCurrent
    && Boolean(reviewerRole.trim())
    && rubricPasses;
  const dimensionLabels: Record<
    AgenticVideoEditingCapstoneRubricDimensionId,
    string
  > = {
    "authority-rights-privacy": label(labels, "capstoneRubricAuthority", "Authority, rights, and privacy"),
    "evidence-semantic-integrity": label(labels, "capstoneRubricEvidence", "Evidence and semantic integrity"),
    "plan-tool-execution-traceability": label(labels, "capstoneRubricTraceability", "Plan, tool, and execution traceability"),
    "delivery-captions-audio-accessibility": label(labels, "capstoneRubricDelivery", "Delivery, captions, audio, and accessibility"),
    "verification-recovery-human-decision": label(labels, "capstoneRubricVerification", "Verification, recovery, and human decision"),
  };
  const rubricAnchors: Record<
    AgenticVideoEditingCapstoneRubricDimensionId,
    readonly [string, string, string, string]
  > = {
    "authority-rights-privacy": [
      label(labels, "capstoneRubricAuthority0", "Missing or contradicted authority, rights, or privacy evidence"),
      label(labels, "capstoneRubricAuthority1", "Some records exist, but ownership, purpose, or destination remains unresolved"),
      label(labels, "capstoneRubricAuthority2", "Current authority, rights, privacy, purpose, and destination are recorded"),
      label(labels, "capstoneRubricAuthority3", "Level 2 plus independent review, retention, deletion, and recovery evidence"),
    ],
    "evidence-semantic-integrity": [
      label(labels, "capstoneRubricEvidence0", "Claims lack current evidence or the sequence changes source meaning"),
      label(labels, "capstoneRubricEvidence1", "Evidence is partial, weakly linked, or meaning review remains unresolved"),
      label(labels, "capstoneRubricEvidence2", "Every claim and segment binds current evidence with reviewed meaning"),
      label(labels, "capstoneRubricEvidence3", "Level 2 plus independent challenge, repair trace, and regression evidence"),
    ],
    "plan-tool-execution-traceability": [
      label(labels, "capstoneRubricTraceability0", "No reproducible plan, tool boundary, or execution receipt"),
      label(labels, "capstoneRubricTraceability1", "A plan exists, but versions, authority, inputs, or outputs are incomplete"),
      label(labels, "capstoneRubricTraceability2", "Current plan, approved tools, fixed inputs, versions, and receipts are linked"),
      label(labels, "capstoneRubricTraceability3", "Level 2 plus independent dry-run, interruption, resume, and relink evidence"),
    ],
    "delivery-captions-audio-accessibility": [
      label(labels, "capstoneRubricDelivery0", "Delivery, captions, audio, color, or accessibility gates are missing or failed"),
      label(labels, "capstoneRubricDelivery1", "Some checks pass, but a required format or accessibility decision remains open"),
      label(labels, "capstoneRubricDelivery2", "Current delivery, caption, audio, color, framing, and accessibility checks pass"),
      label(labels, "capstoneRubricDelivery3", "Level 2 plus independent playback, variant, and destination-specific review"),
    ],
    "verification-recovery-human-decision": [
      label(labels, "capstoneRubricVerification0", "No current verification, recovery evidence, or accountable human decision"),
      label(labels, "capstoneRubricVerification1", "Verification is partial or the reviewer cannot reproduce and recover the package"),
      label(labels, "capstoneRubricVerification2", "Current verification, recovery drill, and hash-bound human decision exist"),
      label(labels, "capstoneRubricVerification3", "Level 2 plus independent reproduction, bounded repair, and approval refresh"),
    ],
  };
  const suppliedLabels = criteria?.map((criterion) => criterion.label)
    ?? artifacts
    ?? [];
  const rows = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
    .filter((contract) => contract.requiredForCapstone)
    .map(
    (contract, index) => ({
      id: contract.id,
      label: suppliedLabels[index]
        ?? `${contract.filename} (${contract.id})`,
    }),
  );
  const blockingReasons = [
    ...missingModules.map((slug) => `${slug}: ${label(labels, "capstoneModuleMissing", "module milestone is not current.")}`),
    ...missingArtifactHashes.map((artifactId) => `${artifactId}: ${label(labels, "capstoneArtifactMissing", "current valid receipt/hash is missing.")}`),
    ...(!assessmentCurrent
      ? [label(labels, "capstoneAssessmentMissing", "The formal assessment is missing or stale; an early diagnostic does not satisfy this gate.")]
      : []),
    ...(!reviewerRole.trim()
      ? [label(labels, "capstoneReviewerMissing", "An accountable reviewer role is required for the hash-bound do-not-publish decision.")]
      : []),
    ...(!rubricPasses
      ? [label(labels, "capstoneRubricBlocked", "The five-dimension rubric must total at least 12/15, authority/rights/privacy and evidence/semantic integrity must each score at least 2, and no unresolved critical blocker may remain.")]
      : []),
    ...(storedRecord && !complete
      ? [label(labels, "capstoneStoredStale", "The stored Capstone record is blocked, stale, malformed, or bound to older artifact hashes.")]
      : []),
  ];
  const decisionPractice: AgenticVideoEditingPracticeCopy = {
    title: label(
      labels,
      "capstoneDecisionArtifactTitle",
      "Post-quiz artifact 12 · Version-bound release decision",
    ),
    brief: label(
      labels,
      "capstoneDecisionArtifactBrief",
      "After all ten module receipts and the current quiz receipt exist, record the named human decision for the exact package. The synthetic lane must remain do-not-publish.",
    ),
    steps: [
      label(labels, "capstoneDecisionStep1", "Confirm all ten module receipts and the quiz receipt are current."),
      label(labels, "capstoneDecisionStep2", "Bind the exact candidate and package SHA-256 values."),
      label(labels, "capstoneDecisionStep3", "Record unresolved risks and the accountable reviewer role."),
      label(labels, "capstoneDecisionStep4", "Keep agent release authority false."),
      label(labels, "capstoneDecisionStep5", "Select do-not-publish for the synthetic fixture."),
    ],
    artifact: "release-decision.json · release-decision-postmortem",
    reviewGate: label(labels, "capstoneDecisionReviewGate", "This artifact belongs to the post-quiz Capstone, not M10 completion. Any changed module, artifact, quiz blueprint, package hash, or unresolved critical blocker invalidates it."),
    aiBoundary: label(labels, "capstoneDecisionAiBoundary", "An agent may prepare the record but cannot supply the accountable human attestation or authorize publication."),
    workedExample: createCourse20ArtifactStarter(
      "release-decision-postmortem",
    ),
    starter: createCourse20ArtifactStarter("release-decision-postmortem"),
    artifactFilename: "release-decision.json",
    artifactContractId: "release-decision-postmortem",
    requiredDependencySlugs: ["production-capstone"],
    acceptanceChecks: [
      label(labels, "capstoneDecisionAcceptance1", "The current package hash is bound."),
      label(labels, "capstoneDecisionAcceptance2", "The current candidate hash is bound."),
      label(labels, "capstoneDecisionAcceptance3", "The reviewer role and rationale are explicit."),
      label(labels, "capstoneDecisionAcceptance4", "Agent release authority remains false."),
      label(labels, "capstoneDecisionAcceptance5", "The synthetic decision is do-not-publish."),
    ],
    estimatedMinutes: 30,
    reviewDecisionRequired: true,
  };

  return (
    <section className={styles.capstone} id="agentic-video-editing-capstone-verified-cut" aria-labelledby="agentic-video-capstone-verified-cut-title">
      <header className={styles.sectionHeader}>
        <p className={styles.eyebrow}>{label(labels, "verifiedCut", "The Verified Cut")}</p>
        <h2 id="agentic-video-capstone-verified-cut-title">
          {label(labels, "capstoneEvidenceRegistry", "Twelve-artifact evidence registry")}
        </h2>
        <p>{statement}</p>
      </header>
      {modulesCurrent && assessmentCurrent ? (
        <section aria-labelledby="course20-capstone-decision-artifact-title">
          <h3 id="course20-capstone-decision-artifact-title">
            {decisionPractice.title}
          </h3>
          <p>{decisionPractice.brief}</p>
          <SingleArtifactWorkbench
            artifactId="release-decision-postmortem"
            slug="production-capstone"
            practice={decisionPractice}
            labels={labels}
            path={CORE_LEARNING_PATH}
          />
        </section>
      ) : null}
      <ol className={styles.capstoneList}>
        {rows.map((criterion, index) => {
          const submission = submissions[criterion.id];
          const criterionCurrent = submission?.validationReceipt.status === "valid"
            && submission.receipt.status === "valid";
          const hash = submission?.contentSha256;
          return (
            <li key={criterion.id} data-complete={criterionCurrent || undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{criterion.label}</strong>
                <p>{criterionCurrent ? label(labels, "current", "Current") : label(labels, "pending", "Pending")}</p>
                {hash ? <code>{hash}</code> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <fieldset className={styles.capstoneRubric}>
        <legend>{label(labels, "capstoneRubric", "Capstone rubric · five dimensions, 0–3 each")}</legend>
        <p>{label(labels, "capstoneRubricRule", "Pass requires at least 12/15; the first two dimensions must each be at least 2; unresolved critical blockers must be zero.")}</p>
        {AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map((id) => {
          return (
            <label key={id}>
              <span>{dimensionLabels[id]}</span>
              <select
                aria-label={dimensionLabels[id]}
                name={`capstone-rubric-${id}`}
                value={rubricScores[id] < 0 ? "" : String(rubricScores[id])}
                onChange={(event) => {
                  const nextScores = {
                    ...rubricScores,
                    [id]: event.target.value === ""
                      ? -1
                      : Number(event.target.value),
                  };
                  setRubricScores(nextScores);
                  writeCapstoneScratch(reviewerRole, nextScores);
                }}
              >
                <option value="">{label(labels, "capstoneRubricUnscored", "Not scored")}</option>
                {[0, 1, 2, 3].map((score) => (
                  <option key={score} value={score}>{score} · {rubricAnchors[id][score]}</option>
                ))}
              </select>
              <small>{rubricScores[id] < 0
                ? label(labels, "capstoneRubricEvidencePrompt", "Choose the highest level fully supported by the current artifact registry.")
                : rubricAnchors[id][rubricScores[id]]}</small>
            </label>
          );
        })}
        <strong>{label(labels, "capstoneRubricTotal", "Rubric total")}: {rubricTotal}/15</strong>
      </fieldset>
      <label>
        <span>{label(labels, "accountableReviewerRole", "Accountable reviewer role")}</span>
        <input
          type="text"
          name="capstone-accountable-reviewer-role"
          autoComplete="off"
          value={reviewerRole}
          onChange={(event) => {
            const nextRole = event.target.value;
            setReviewerRole(nextRole);
            writeCapstoneScratch(nextRole, rubricScores);
          }}
        />
      </label>
      <p className={styles.gateNote}>
        {label(labels, "doNotPublishDecision", "This synthetic package is bound to do-not-publish. That is a successful safety decision, not a release failure.")}
      </p>
      {!ready && blockingReasons.length ? (
        <details className={styles.gateNote} open>
          <summary>{label(labels, "whyCapstoneBlocked", "Why this capstone record is blocked")}</summary>
          <ul>{blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </details>
      ) : null}
      {complete ? (
        <p className={styles.feedback} role="status">
          {label(labels, "capstoneHashBound", "The stored decision matches every current artifact hash and the current formal assessment.")}
          {" "}<code>{(storedRecord as Course20CapstoneRecord).packageSha256}</code>
        </p>
      ) : null}
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!ready || complete || saving}
        onClick={() => {
          setSaving(true);
          const projectId = submissions[artifactIds[0]]?.projectId
            ?? AGENTIC_VIDEO_EDITING_PROJECT_ID;
          const packageBinding = createCourse20CapstonePackageBinding({
            projectId,
            decision: "do-not-publish",
            reviewerRole: reviewerRole.trim(),
            moduleReceiptFingerprints,
            quizReceiptFingerprint,
            artifactHashes,
            rubric,
          });
          const packageText = JSON.stringify(packageBinding);
          void sha256CanonicalArtifactContent(packageText).then((packageSha256) => {
            const packageBindingFingerprint = course20ReceiptFingerprint({
              packageBinding,
              packageSha256,
            });
            const latestProgress = readAgenticVideoEditingProgress();
            const latestSubmissions = getCourse20ArtifactSubmissions(
              latestProgress,
              CORE_LEARNING_PATH,
            );
            const gateStillCurrent = isCurrentAssessmentPass(latestProgress)
              && AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.every(
                (moduleManifest) => isCourse20ModuleCurrent(
                  latestProgress,
                  moduleManifest.slug,
                  CORE_LEARNING_PATH,
                ),
              )
              && artifactIds.every((artifactId) => (
                latestSubmissions[artifactId]?.contentSha256
                  === artifactHashes[artifactId]
              ))
              && areCourse20ArtifactSubmissionsCurrent(
                latestProgress,
                artifactIds,
                CORE_LEARNING_PATH,
              )
              && projectId === AGENTIC_VIDEO_EDITING_PROJECT_ID
              && isCourse20CapstoneRubricPassing(rubric)
              && course20ReceiptFingerprint(
                latestProgress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY],
              ) === quizReceiptFingerprint
              && AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.every(
                (moduleManifest) => course20ReceiptFingerprint(latestProgress[
                  agenticVideoEditingModuleProgressKey(
                    moduleManifest.slug,
                    CORE_LEARNING_PATH,
                  )
                ]) === moduleReceiptFingerprints[moduleManifest.slug],
              );
            if (!gateStillCurrent || !isSha256(packageSha256)) {
              setAnnouncement(label(labels, "capstoneChangedDuringSave", "A prerequisite changed while the registry was being hashed. Nothing was recorded; refresh the blockers and try again."));
              return;
            }
            const record = {
              schemaVersion: "aicourse.course20.capstone.v2",
              projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
              projectId,
              courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
              status: "valid",
              artifactHashes,
              packageSha256,
              decision: "do-not-publish",
              boundPackageSha256: packageSha256,
              packageBindingFingerprint,
              reviewerRole: reviewerRole.trim(),
              releaseAttestation: true,
              rubric,
              quizReceiptFingerprint,
              moduleReceiptFingerprints,
              issues: [],
            } satisfies Course20CapstoneRecord;
            const persisted = updateAgenticVideoEditingProgress((progressRecord) => {
              progressRecord[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] = record;
            });
            try { window.sessionStorage.removeItem(capstoneScratchKey); } catch { /* no scratchpad to clear */ }
            setAnnouncement(persisted
              ? label(labels, "capstoneRecorded", "Current evidence registry and do-not-publish decision recorded.")
              : label(labels, "capstoneMemoryOnly", "The evidence registry is current for this tab, but browser storage is unavailable."));
          }).catch(() => {
            setAnnouncement(label(labels, "capstoneSaveFailed", "The evidence registry could not be recorded. No release authority was created; review browser storage and try again."));
          }).finally(() => setSaving(false));
        }}
      >{complete
          ? label(labels, "capstoneComplete", "Evidence registry current")
          : saving
            ? label(labels, "validating", "Validating…")
            : label(labels, "recordCapstone", "Validate and record registry")}</button>
      <p className={announcement ? styles.statusMessage : styles.srOnly} role="status">{announcement}</p>
    </section>
  );
}

export function CutPlanLab({ locale }: { locale: "en" | "zh-Hans" }) {
  const zh = locale === "zh-Hans";
  const secondsFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const defaultSelected = useMemo<Record<string, boolean>>(() => ({
    hook: true,
    context: true,
    method: true,
    close: true,
  }), []);
  const defaultReasons = useMemo(() => Object.fromEntries(
    CUT_PLAN_LAB_FIXTURE.map((clip) => [
      clip.id,
      zh ? clip.defaultReasonZhHans : clip.defaultReason,
    ]),
  ), [zh]);
  const [selected, setSelected] = useState<Record<string, boolean>>(defaultSelected);
  const [reasons, setReasons] = useState<Record<string, string>>(
    defaultReasons,
  );
  const [target, setTarget] = useState(50);
  const [receipt, setReceipt] = useState<{
    json: string;
    issues: CutPlanLabIssue[];
  } | null>(null);
  const [scratchMessage, setScratchMessage] = useState("");
  const scratchKey = `${AGENTIC_VIDEO_EDITING_SESSION_SCRATCH_PREFIX}${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}:cut-plan:${locale}`;
  const writeCutPlanScratch = (
    nextSelected: Record<string, boolean>,
    nextReasons: Record<string, string>,
    nextTarget: number,
  ): void => {
    try {
      window.sessionStorage.setItem(scratchKey, JSON.stringify({
        schemaVersion: "aicourse.course20.cut-plan-scratch.v2",
        selected: nextSelected,
        reasons: nextReasons,
        target: nextTarget,
      }));
    } catch {
      // The selection-only lab remains usable in memory.
    }
  };
  const scratchDirty = target !== 50
    || CUT_PLAN_LAB_FIXTURE.some((clip) => (
      Boolean(selected[clip.id]) !== Boolean(defaultSelected[clip.id])
      || reasons[clip.id] !== defaultReasons[clip.id]
    ))
    || Boolean(receipt);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(scratchKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed.schemaVersion !== "aicourse.course20.cut-plan-scratch.v1"
        && parsed.schemaVersion !== "aicourse.course20.cut-plan-scratch.v2") {
        window.sessionStorage.removeItem(scratchKey);
        return;
      }
      let repaired = parsed.schemaVersion !== "aicourse.course20.cut-plan-scratch.v2";
      const rawSelected = parsed.selected && typeof parsed.selected === "object"
        && !Array.isArray(parsed.selected)
        ? parsed.selected as Record<string, unknown>
        : {};
      const rawReasons = parsed.reasons && typeof parsed.reasons === "object"
        && !Array.isArray(parsed.reasons)
        ? parsed.reasons as Record<string, unknown>
        : {};
      const knownIds = new Set<string>(CUT_PLAN_LAB_FIXTURE.map((clip) => clip.id));
      if (Object.keys(rawSelected).some((id) => !knownIds.has(id))
        || Object.keys(rawReasons).some((id) => !knownIds.has(id))) repaired = true;
      const recoveredSelected = Object.fromEntries(
        CUT_PLAN_LAB_FIXTURE.map((clip) => {
          const value = rawSelected[clip.id];
          if (typeof value !== "boolean") repaired = true;
          return [clip.id, typeof value === "boolean"
            ? value
            : Boolean(defaultSelected[clip.id])];
        }),
      ) as Record<string, boolean>;
      const recoveredReasons = Object.fromEntries(
        CUT_PLAN_LAB_FIXTURE.map((clip) => {
          const value = rawReasons[clip.id];
          if (typeof value !== "string") repaired = true;
          return [clip.id, typeof value === "string"
            ? value.slice(0, 4_000)
            : defaultReasons[clip.id]];
        }),
      ) as Record<string, string>;
      const recoveredTarget = typeof parsed.target === "number"
        && Number.isFinite(parsed.target)
        && parsed.target >= 0
        && parsed.target <= 3_600
        ? parsed.target
        : 50;
      if (recoveredTarget !== parsed.target) repaired = true;
      queueMicrotask(() => {
        setSelected(recoveredSelected);
        setReasons(recoveredReasons);
        setTarget(recoveredTarget);
        setReceipt(null);
        setScratchMessage(repaired
          ? zh
            ? "已安全恢复 Cut Plan 草稿；无效或旧版字段已重置，验证结果必须重新生成。"
            : "Recovered the Cut Plan draft safely; invalid or legacy fields were reset and validation must be regenerated."
          : zh
            ? "已恢复当前标签页中的 Cut Plan 草稿；请重新运行合同门。"
            : "Recovered the Cut Plan draft from this tab; rerun the contract gate.");
      });
    } catch {
      // Ignore an unreadable disposable scratchpad.
    }
  }, [defaultReasons, defaultSelected, scratchKey, zh]);

  useEffect(() => {
    setUnsavedArtifactWarning(
      `cut-plan:${locale}`,
      scratchDirty
        ? zh
          ? "你有尚未写入课程保存记录的 Cut Plan 草稿。是否离开本模块？返回时，当前标签页会尝试恢复它。"
          : "You have a Cut Plan draft that is not part of saved course progress. Leave this module? This tab will try to recover it when you return."
        : null,
    );
    return () => setUnsavedArtifactWarning(`cut-plan:${locale}`, null);
  }, [locale, scratchDirty, zh]);
  const selectedClips = CUT_PLAN_LAB_FIXTURE.filter((clip) => selected[clip.id]);
  const duration = selectedClips.reduce(
    (sum, clip) => sum + clip.sourceOutSeconds - clip.sourceInSeconds,
    0,
  );
  const describeIssue = (validationIssue: CutPlanLabIssue): string => {
    const subject = "subject" in validationIssue && validationIssue.subject
      ? ` (${validationIssue.subject})`
      : "";
    return zh
      ? `${validationIssue.code}${subject}：合同门拒绝此状态；请修复字段后重试。`
      : `${validationIssue.code}${subject}: the contract gate rejects this state; repair the field and retry.`;
  };
  const rightsStateLabel = (rightsState: string): string => {
    if (!zh) return rightsState;
    if (rightsState === "simulated-cleared") return "教学模拟已许可";
    if (rightsState === "approved-for-declared-use") return "已批准用于声明用途";
    return "未知（保持阻断）";
  };

  return (
    <section className={styles.cutPlanLab} id="cut-plan-lab" aria-labelledby="cut-plan-lab-title">
      <header>
        <p className={styles.eyebrow}>{zh ? "离线合同实验" : "Offline contract lab"}</p>
        <h2 id="cut-plan-lab-title">
          {zh ? "Cut Plan Lab：验证合同，不执行媒体" : "Cut Plan Lab: validate a contract, execute no media"}
        </h2>
        <p>
          {zh
            ? "此浏览器内文字 fixture 永远保持阻断：它只练习 selection-only teaching plan v2、权利和时间码门。真正的 production Edit Plan v3 在模块产物工作台和原创媒体 lab 中验证六类操作。"
            : "This browser-only text fixture always remains blocked. It teaches the selection-only v2 contract, rights, and clock gates. The production Edit Plan v3 is validated separately in the artifact workbench and original-media lab."}
        </p>
      </header>
      <div className={styles.labTarget}>
        <label htmlFor="cut-plan-target">{zh ? "目标时长（秒）" : "Target duration (seconds)"}</label>
        <input
          id="cut-plan-target"
          name="cut-plan-target-duration"
          type="number"
          min={45}
          max={60}
          value={target}
          onChange={(event) => {
            const nextTarget = Number(event.target.value);
            const value = Number.isFinite(nextTarget) ? nextTarget : 45;
            setTarget(value);
            setReceipt(null);
            writeCutPlanScratch(selected, reasons, value);
          }}
        />
        <output aria-live="polite">{zh ? "当前选择" : "Selected"}: {secondsFormatter.format(duration)}{zh ? " 秒" : "s"}</output>
      </div>
      <div className={styles.clipList}>
        {CUT_PLAN_LAB_FIXTURE.map((clip, index) => (
          <article key={clip.id} data-selected={selected[clip.id] || undefined}>
            <label className={styles.clipToggle}>
              <input
                type="checkbox"
                name="cut-plan-selected-clips"
                value={clip.id}
                checked={selected[clip.id] ?? false}
                onChange={(event) => {
                  const nextSelected = { ...selected, [clip.id]: event.target.checked };
                  setSelected(nextSelected);
                  setReceipt(null);
                  writeCutPlanScratch(nextSelected, reasons, target);
                }}
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{zh ? clip.labelZhHans : clip.label}</strong>
            </label>
            <dl>
              <div><dt>{zh ? "源区间" : "Source"}</dt><dd>{secondsFormatter.format(clip.sourceInSeconds)}–{secondsFormatter.format(clip.sourceOutSeconds)}{zh ? " 秒" : "s"}</dd></div>
              <div><dt>{zh ? "权利信号" : "Rights signal"}</dt><dd data-rights={clip.rightsState}>{rightsStateLabel(clip.rightsState)}</dd></div>
            </dl>
            <label>
              <span>{zh ? "保留理由" : "Keep rationale"}</span>
              <input
                type="text"
                name={`cut-plan-rationale-${clip.id}`}
                autoComplete="off"
                value={reasons[clip.id] ?? ""}
                onChange={(event) => {
                  const nextReasons = { ...reasons, [clip.id]: event.target.value };
                  setReasons(nextReasons);
                  setReceipt(null);
                  writeCutPlanScratch(selected, nextReasons, target);
                }}
              />
            </label>
          </article>
        ))}
      </div>
      <button
        className={styles.primaryButton}
        type="button"
        onClick={() => {
          const plan = buildCutPlanLabPlan(selectedClips, reasons, target);
          const issues = validateCutPlanLabPlan(plan);
          const nextReceipt = { json: JSON.stringify(plan, null, 2), issues };
          setReceipt(nextReceipt);
          writeCutPlanScratch(selected, reasons, target);
        }}
      >{zh ? "生成并运行合同门" : "Generate and run contract gate"}</button>
      <p className={scratchMessage ? styles.statusMessage : styles.srOnly} role="status">{scratchMessage}</p>
      {receipt ? (
        <div
          className={styles.labReceipt}
          data-passed={!receipt.issues.length || undefined}
          data-testid="course20-cut-plan-result"
        >
          <p className={styles.labReceiptSummary} role="status">
            <strong>
            {receipt.issues.length
              ? (zh ? `语义门发现 ${receipt.issues.length} 个阻断项` : `Semantic gate found ${receipt.issues.length} blockers`)
              : (zh ? "计划通过结构与语义检查，但执行仍保持阻断" : "Plan passes structural and semantic checks; execution remains blocked")}
            </strong>
          </p>
          {receipt.issues.length ? (
            <ul>{receipt.issues.map((validationIssue, index) => (
              <li key={`${validationIssue.code}-${index}`}>{describeIssue(validationIssue)}</li>
            ))}</ul>
          ) : (
            <p>{zh ? "没有媒体、真实 hash、外部批准或发布权限。" : "There is no media, real hash, external approval, or publish authority."}</p>
          )}
          <pre tabIndex={0}><code>{receipt.json}</code></pre>
        </div>
      ) : null}
    </section>
  );
}
