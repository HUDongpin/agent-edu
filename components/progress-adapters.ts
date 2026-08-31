"use client";

import {
  PUBLIC_COURSE_SURFACES,
  type PublicCourseSurface,
} from "@/lib/public-release-surface";
import {
  SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY,
  SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY,
  hasSoftwareEngineeringAssessmentDraftActivity,
  hasSoftwareEngineeringCapstoneDraftActivity,
  softwareEngineeringNextHref,
} from "@/lib/progress-software-engineering";
import {
  type PersistenceResult,
  type ProgressAdapterCourseId,
  type ProgressStoreSummary,
  type PublishedProgressCourseId,
  publishedProgressCourseIdsForProjection,
} from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";
export {
  PUBLISHED_PROGRESS_COURSE_IDS,
  PROGRESS_ADAPTER_COURSE_IDS,
} from "@/lib/public-progress-contract";
export type {
  PersistenceResult,
  ProgressAdapterCourseId,
  ProgressStoreSummary,
  ProgressSummaryState,
  PublishedProgressCourseId,
} from "@/lib/public-progress-contract";
import {
  HANDBOOK_SECTION_IDS,
  CORRUPT_LEARNING_BACKUP_KEY,
  LEARNING_KEY,
  LEARNING_PROGRESS_EVENT,
  LEGACY_PROGRESS_KEY,
  LEGACY_SECTION_KEY,
  LEGACY_SEEN_KEY,
  readLearningSnapshot,
  resetLearningStateWithResult,
  selectAgenticJourneyPercent,
} from "@/lib/progress";
import {
  AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
  AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
  AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY,
  AI_TUTOR_PROGRESS_PROBE_KEY,
  CLAUDE_INCOME_QUIZ_ATTEMPT_KEY,
  CODEX_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  CURSOR_SESSION_DRAFT_PROBE_KEY,
  GROK_PROGRESS_PROBE_KEY,
  GROK_QUIZ_ATTEMPT_KEY,
  GROK_TASK_CONTRACT_DRAFT_KEY,
  INCOME_PROGRESS_PROBE_KEY,
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY,
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY,
  PRODUCT_MANAGEMENT_CORRUPT_PROGRESS_BACKUP_KEY,
  PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY,
  PROMPT_PROGRESS_PROBE_KEY,
  RAG_CORRUPT_PROGRESS_BACKUP_KEY,
  RAG_PROGRESS_PROBE_KEY,
} from "@/lib/progress-storage-contract";
import {
  MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY,
} from "@/lib/make-money-session-draft-contract";
import { isClaudeIncomeQuizAttemptPersistenceAvailable } from "./claude-income/quiz-attempt-store";
import {
  AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
  AI_TUTOR_PROGRESS_MODULE_SLUGS,
  AI_TUTOR_PROGRESS_SCHEMA,
  CLAUDE_PROGRESS_LESSON_SLUGS,
  CLAUDE_PROGRESS_SCHEMA,
  CLAUDE_INCOME_PROGRESS_CAPSTONE_KEY,
  CLAUDE_INCOME_PROGRESS_LESSON_SLUGS,
  CLAUDE_INCOME_PROGRESS_QUIZ,
  CODEX_PROGRESS_LESSON_SLUGS,
  CODEX_PROGRESS_SCHEMA,
  CURSOR_PROGRESS_LESSON_SLUGS,
  CURSOR_PROGRESS_SCHEMA,
  GITHUB_PROGRESS_LESSON_SLUGS,
  GITHUB_PROGRESS_QUIZ,
  GROK_PROGRESS_LESSON_SLUGS,
  MAKE_MONEY_PROGRESS_LESSON_SLUGS,
  MCP_PROGRESS_LESSON_SLUGS,
  PRODUCT_MANAGEMENT_PROGRESS_MODULE_SLUGS,
  PRODUCT_MANAGEMENT_PROGRESS_SCHEMA,
  PROMPT_PROGRESS_LESSON_SLUGS,
  RAG_PROGRESS_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE,
  SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_PROGRESS_QUIZ,
  agentOrchestrationProgressModuleKey,
  aiTutorProgressModuleKey,
  productManagementProgressModuleKey,
} from "@/lib/progress-topology";
import {
  CODEX_PROGRESS_EVENT,
  COURSE_PROGRESS_STORAGE_KEY as CODEX_PROGRESS_STORAGE_KEY,
  isCourseProgressPersistenceAvailable as isCodexPersistenceAvailable,
  lessonProgressKey as codexLessonProgressKey,
  readCourseProgress as readCodexProgress,
  resetAllCourseProgress,
} from "./codex/progress-store";
import {
  CLAUDE_PROGRESS_EVENT,
  COURSE_PROGRESS_STORAGE_KEY as CLAUDE_PROGRESS_STORAGE_KEY,
  isCourseProgressPersistenceAvailable as isClaudePersistenceAvailable,
  lessonProgressKey as claudeLessonProgressKey,
  readCourseProgress as readClaudeProgress,
  resetClaudeProgressAfterGlobalReset,
} from "./claude/progress-store";
import {
  COURSE_PROGRESS_STORAGE_KEY as CURSOR_PROGRESS_STORAGE_KEY,
  CURSOR_PROGRESS_EVENT,
  isCourseProgressPersistenceAvailable as isCursorPersistenceAvailable,
  lessonProgressKey as cursorLessonProgressKey,
  readCourseProgress as readCursorProgress,
  resetCursorProgressAfterGlobalReset,
} from "./cursor/progress-store";
import {
  GROK_PROGRESS_EVENT,
  GROK_PROGRESS_KEY,
  grokStorageAvailable,
  readGrokProgress,
  resetGrokProgressAfterGlobalReset,
} from "./grok/progress-store";
import {
  COURSE_PROGRESS_STORAGE_KEY as GITHUB_PROGRESS_STORAGE_KEY,
  GITHUB_CAPSTONE_STORAGE_KEY,
  GITHUB_PROGRESS_EVENT,
  githubLessonProgressKey,
  hasGithubCourseProgress,
  isCourseProgressPersistenceAvailable as isGithubPersistenceAvailable,
  readCourseProgress as readGithubProgress,
  resetGithubProgressAfterGlobalReset,
} from "./github/progress-store";
import {
  PROMPT_PROGRESS_EVENT,
  PROMPT_PROGRESS_PREFIX,
  PROMPT_PROGRESS_STORAGE_KEY,
  isPromptCapstonePassed,
  isPromptQuizPassed,
  isPromptProgressStorageAvailable,
  promptPracticeKey,
  readPromptProgress,
  resetPromptProgressAfterGlobalReset,
} from "./prompts/progress-store";
import {
  SOFTWARE_ENGINEERING_CAPSTONE_KEY,
  SOFTWARE_ENGINEERING_PROGRESS_EVENT,
  SOFTWARE_ENGINEERING_PROGRESS_PREFIX,
  SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY,
  isSoftwareEngineeringStorageAvailable,
  readSoftwareEngineeringProgress,
  resetSoftwareEngineeringProgressAfterGlobalReset,
  softwareEngineeringLessonKey,
} from "./software-engineering/progress-store";
import {
  RAG_CAPSTONE_KEY,
  RAG_PROGRESS_EVENT,
  RAG_PROGRESS_PREFIX,
  RAG_PROGRESS_STORAGE_KEY,
  RAG_QUIZ_BEST_KEY,
  RAG_QUIZ_PASSED_KEY,
  isRagProgressStorageAvailable,
  ragPracticeKey,
  readRagProgress,
  resetRagProgressAfterGlobalReset,
} from "./rag/progress-store";
import {
  MCP_PROGRESS_EVENT,
  MCP_PROGRESS_STORAGE_KEY,
  isMcpPersistenceAvailable,
  isMcpQuizPassed,
  readMcpProgress,
  resetMcpProgressAfterGlobalReset,
} from "./mcp/progress-store";
import {
  INCOME_PROGRESS_EVENT,
  SHARED_PROGRESS_KEY,
  incomeStorageAvailable,
  readIncomeProgress,
  resetIncomeProgressAfterGlobalReset,
} from "./make-money-with-codex/progress-store";
import {
  CLAUDE_INCOME_PROGRESS_EVENT,
  PROGRESS_STORAGE_KEY as CLAUDE_INCOME_PROGRESS_STORAGE_KEY,
  isProgressPersistenceAvailable as isClaudeIncomePersistenceAvailable,
  lessonCompletionKey,
  lessonVisitedKey,
  readProgress as readClaudeIncomeProgress,
  resetClaudeIncomeProgressAfterGlobalReset,
} from "./claude-income/progress-store";
import {
  AI_TUTOR_PROGRESS_STORAGE_KEY,
  isAiTutorProgressStorageAvailable,
  readAiTutorProgress,
  resetAiTutorProgressAfterGlobalReset,
} from "./ai-tutor/progress-store";
import {
  PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY,
  isProductManagementStorageAvailable,
  readProductManagementProgress,
  resetProductManagementProgressAfterGlobalReset,
} from "./product-management/progress-store";
import {
  isProductManagementAssessmentAttemptPersistenceAvailable,
} from "./product-management/assessment-attempt-store";
import {
  AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
  isAgentOrchestrationStorageAvailable,
  readAgentOrchestrationProgress,
  resetAgentOrchestrationProgressAfterGlobalReset,
} from "./agent-orchestration/progress-store";

export interface ProgressStoreAdapter {
  readonly courseId: PublishedProgressCourseId;
  /** Browser storage records read by this adapter, not individual milestone fields. */
  readonly storageKeys: readonly string[];
  readonly progressEvent: string;
  readSummary(): ProgressStoreSummary;
  resetAfterGlobalReset(): PersistenceResult | Promise<PersistenceResult>;
  /** Additional diagnostics only; public UI consumes `readSummary().state`. */
  isPersistent(): boolean;
}

export interface PublishedProgressSummary extends ProgressStoreSummary {
  readonly courseId: PublishedProgressCourseId;
}

type ProgressRecord = Record<string, unknown>;

function cleanLocale(locale: string): string {
  return locale.replace(/^\/+|\/+$/g, "") || "en";
}

function courseRoot(locale: string, courseId: PublishedProgressCourseId): string {
  if (courseId === "agentic") return `/${locale}/handbook/`;
  return `/${locale}/${courseId}/`;
}

function lessonHref(locale: string, courseId: PublishedProgressCourseId, slug: string): string {
  return `/${locale}/${courseId}/${slug}/`;
}

function summary(
  percent: number,
  hasProgress: boolean,
  nextHref: string,
): ProgressStoreSummary {
  return {
    state: percent >= 100 ? "completed" : hasProgress ? "in-progress" : "not-started",
    percent,
    nextHref,
  };
}

function unavailableSummary(): ProgressStoreSummary {
  return {
    state: "unavailable",
    percent: 0,
    nextHref: null,
  };
}

function readFailClosed(
  isPersistent: () => boolean,
  read: () => ProgressStoreSummary,
): ProgressStoreSummary {
  if (typeof window === "undefined") return unavailableSummary();
  try {
    if (!isPersistent()) return unavailableSummary();
    const current = read();
    return isPersistent() ? current : unavailableSummary();
  } catch {
    return unavailableSummary();
  }
}

function isGithubProgressQuizPassed(record: ProgressRecord): boolean {
  return record[GITHUB_PROGRESS_QUIZ.versionStorageKey]
      === GITHUB_PROGRESS_QUIZ.bankVersion
    && record[GITHUB_PROGRESS_QUIZ.passedStorageKey] === true;
}

function isSoftwareEngineeringProgressQuizPassed(record: ProgressRecord): boolean {
  const best = record[SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bestScoreStorageKey];
  return record[SOFTWARE_ENGINEERING_PROGRESS_QUIZ.versionStorageKey]
      === SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bankVersion
    && record[SOFTWARE_ENGINEERING_PROGRESS_QUIZ.passedStorageKey] === true
    && typeof best === "number"
    && Number.isInteger(best)
    && best >= SOFTWARE_ENGINEERING_PROGRESS_QUIZ.passingCorrectAnswers
    && best <= SOFTWARE_ENGINEERING_PROGRESS_QUIZ.questionCount;
}

function isCurrentProductManagementProgressRecord(record: ProgressRecord): boolean {
  return record[PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.versionKey]
    === PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.version;
}

function hasEveryExpectedValue(
  value: unknown,
  expected: readonly string[],
): value is readonly string[] {
  return Array.isArray(value)
    && value.length === expected.length
    && expected.every((item) => value.includes(item));
}

function isSoftwareEngineeringProgressCapstoneComplete(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const submission = value as ProgressRecord;
  const score = submission.score;
  return submission.schemaVersion === SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.schemaVersion
    && submission.completed === true
    && hasEveryExpectedValue(
      submission.artifactIds,
      SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.artifactIds,
    )
    && hasEveryExpectedValue(
      submission.reviewedGateIds,
      SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.releaseGateIds,
    )
    && typeof score === "number"
    && Number.isInteger(score)
    && score >= SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.passingScore
    && score <= SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.totalPoints
    && (SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.releaseDecisions as readonly unknown[])
      .includes(submission.decision)
    && submission.safetyBoundaryAttested === true;
}

function validPercentScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}

function isAgentOrchestrationProgressQuizPassed(record: ProgressRecord): boolean {
  return record[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey] === true
    && validPercentScore(record[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey])
      >= AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassPercent;
}

function agentOrchestrationEvidenceTokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}]{2,}/gu)
    ?? [];
}

const AGENT_ORCHESTRATION_PLACEHOLDER_REFERENCE = /^(?:(?:todo|tbd|dummy|sample|example|placeholder)[-_ ]*)*(?:evidence|artifact|file|trace|review|record|item|output|todo|tbd|dummy|sample|example|placeholder)(?:[-_ ]*(?:todo|tbd|dummy|sample|example|placeholder))*[-_ ]*\d*$/iu;
const AGENT_ORCHESTRATION_PLACEHOLDER_TOKEN = /(?:^|[^\p{L}\p{N}])(?:todo|tbd|dummy|fixture|sample|example|placeholder)(?:$|[^\p{L}\p{N}])/iu;

function normalizeAgentOrchestrationEvidence(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/\p{Cf}/gu, "").trim().replace(/\s+/gu, " ")
    : "";
}

function agentOrchestrationEvidenceIdentity(value: unknown): string {
  const normalized = normalizeAgentOrchestrationEvidence(value);
  if (normalized.length > 2_048) return "";
  return normalized
    .replace(/#.*$/u, "")
    .replace(/[/?&](?:copy|duplicate|dup)=\d+$/iu, "")
    .replace(/\/+$/u, "")
    .toLocaleLowerCase("en-US");
}

function isMeaningfulAgentOrchestrationEvidence(value: unknown): boolean {
  const normalized = normalizeAgentOrchestrationEvidence(value);
  if (normalized.length > 2_048) return false;
  if (
    /^[a-z][a-z\d+.-]*:\/\//iu.test(normalized)
    && !/^(?:https|trace|review|ticket|file|artifact):\/\//iu.test(normalized)
  ) return false;
  const semantic = Array.from(normalized.replace(/[^\p{L}\p{N}]+/gu, ""));
  if (semantic.length < 8) return false;
  if (new Set(semantic.map((character) => character.toLocaleLowerCase("en-US"))).size < 4) {
    return false;
  }
  const tokens = agentOrchestrationEvidenceTokens(normalized);
  if (tokens.length === 0 || (tokens.length > 1 && new Set(tokens).size === 1)) return false;
  if (
    AGENT_ORCHESTRATION_PLACEHOLDER_REFERENCE.test(normalized)
    || AGENT_ORCHESTRATION_PLACEHOLDER_TOKEN.test(normalized)
  ) return false;
  const hasReferenceShape = /^(?:https:\/\/|(?:trace|review|ticket|file|artifact):\/\/)/iu.test(normalized)
    || /(?:^|[/\\])[^/\\]+\.[\p{L}\p{N}]{1,8}(?:$|[?#])/iu.test(normalized)
    || /^(?:trace|run|review|ticket|commit|report)[_:-][\p{L}\p{N}][\p{L}\p{N}._:/-]{7,}$/iu.test(normalized)
    || (/\b(?:trace|review|ticket|run|commit|report|record)\b/iu.test(normalized)
      && semantic.length >= 16);
  return hasReferenceShape || (tokens.length >= 5 && semantic.length >= 24);
}

function isAgentOrchestrationProgressCapstoneComplete(record: ProgressRecord): boolean {
  const evidence = record[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneEvidenceKey];
  if (
    !Array.isArray(evidence)
    || evidence.length !== AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneArtifactCount
  ) return false;
  const identities = evidence.map(agentOrchestrationEvidenceIdentity);
  const counts = identities.reduce((result, identity) => {
    if (identity) result.set(identity, (result.get(identity) ?? 0) + 1);
    return result;
  }, new Map<string, number>());
  return evidence.every((value, index) =>
    isMeaningfulAgentOrchestrationEvidence(value)
      && counts.get(identities[index]) === 1,
  );
}

interface VersionedQuizContract {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly passingCorrectAnswers: number;
  readonly bestScoreKey: string;
  readonly passedKey: string;
  readonly versionKey: string;
}

function isVersionedQuizPassed(
  record: ProgressRecord,
  quiz: VersionedQuizContract,
): boolean {
  const best = record[quiz.bestScoreKey];
  return record[quiz.versionKey] === quiz.bankVersion
    && record[quiz.passedKey] === true
    && typeof best === "number"
    && Number.isInteger(best)
    && best >= quiz.passingCorrectAnswers
    && best <= quiz.questionCount;
}

function isRecord(value: unknown): value is ProgressRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isClaudeProgressCapstoneComplete(record: ProgressRecord): boolean {
  const capstone = CLAUDE_PROGRESS_SCHEMA.capstone;
  const score = capstone.rubric.reduce((total, criterion) => {
    const value = record[`claude.capstone.rubric.${criterion.id}`];
    return total + (
      typeof value === "number"
      && Number.isInteger(value)
      && value >= 0
      && value <= criterion.weight
        ? value
        : 0
    );
  }, 0);
  return record[capstone.progressKey] === true
    && record[capstone.criticalClearKey] === true
    && capstone.artifactIds.every(
      (id) => record[`claude.capstone.artifact.${id}`] === true,
    )
    && score >= capstone.passingScore;
}

function sameOrderedValues(left: unknown, right: readonly string[]): left is readonly string[] {
  return Array.isArray(left)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function isCursorProgressCapstoneComplete(record: ProgressRecord): boolean {
  const capstone = CURSOR_PROGRESS_SCHEMA.capstone;
  if (record[capstone.progressKey] !== true) return false;

  const metadata = record[capstone.metadataKey];
  if (!isRecord(metadata)) return false;
  const expectedMetadata = Object.entries(capstone.metadata);
  if (
    Object.keys(metadata).length !== expectedMetadata.length
    || !expectedMetadata.every(([key, expected]) => metadata[key] === expected)
  ) return false;

  const assessment = record[capstone.assessmentKey];
  if (!isRecord(assessment) || Object.keys(assessment).length !== 3) return false;
  if (!sameOrderedValues(assessment.artifactIds, capstone.artifactIds)) return false;
  const storedRubricIds = assessment.rubricIds;
  if (!Array.isArray(storedRubricIds)) return false;
  const rubricIds = capstone.rubric
    .filter((item) => storedRubricIds.includes(item.id))
    .map((item) => item.id);
  if (!sameOrderedValues(storedRubricIds, rubricIds)) return false;
  if (!capstone.requiredRubricIds.every((id) => rubricIds.includes(id))) return false;
  const score = capstone.rubric.reduce(
    (total, item) => total + (rubricIds.includes(item.id) ? item.weight : 0),
    0,
  );
  return score >= capstone.passingScore && assessment.score === score;
}

function persistenceResult(
  persisted: boolean,
  reason: PersistenceResult["reason"] = "unavailable",
  quarantined = false,
): PersistenceResult {
  return persisted
    ? { persisted: true, ...(quarantined ? { quarantined: true } : {}) }
    : { persisted: false, reason, ...(quarantined ? { quarantined: true } : {}) };
}

async function resetAndVerify(
  reset: () => PersistenceResult | Promise<PersistenceResult>,
): Promise<PersistenceResult> {
  try {
    return await reset();
  } catch (error) {
    return persistenceResult(false, persistenceFailureReason(error));
  }
}

interface MilestoneAdapterOptions<Slug extends string> {
  readonly courseId: PublishedProgressCourseId;
  readonly storageKey: string;
  readonly auxiliaryStorageKeys?: readonly string[];
  readonly progressEvent: string;
  readonly slugs: readonly Slug[];
  readonly read: () => ProgressRecord;
  readonly lessonComplete: (record: ProgressRecord, slug: Slug) => boolean;
  readonly quizComplete: (record: ProgressRecord) => boolean;
  readonly capstoneComplete: (record: ProgressRecord) => boolean;
  readonly quizHref: (locale: string) => string;
  readonly capstoneHref: (locale: string) => string;
  readonly assessmentOrder?: "quiz-first" | "capstone-first";
  readonly hasProgress: (record: ProgressRecord) => boolean;
  readonly resolveNextHref?: (record: ProgressRecord, locale: string) => string;
  readonly reset: () => PersistenceResult | Promise<PersistenceResult>;
  readonly isPersistent: () => boolean;
}

function milestoneAdapter<Slug extends string>(
  locale: string,
  options: MilestoneAdapterOptions<Slug>,
): ProgressStoreAdapter {
  const root = courseRoot(locale, options.courseId);
  return {
    courseId: options.courseId,
    storageKeys: [options.storageKey, ...(options.auxiliaryStorageKeys ?? [])],
    progressEvent: options.progressEvent,
    readSummary() {
      return readFailClosed(options.isPersistent, () => {
        const record = options.read();
        const quizComplete = options.quizComplete(record);
        const capstoneComplete = options.capstoneComplete(record);
        const completed = options.slugs.filter(
          (slug) => options.lessonComplete(record, slug),
        ).length
          + Number(quizComplete)
          + Number(capstoneComplete);
        const percent = Math.round((completed / (options.slugs.length + 2)) * 100);
        const next = options.slugs.find((slug) => !options.lessonComplete(record, slug));
        const assessmentHref = options.assessmentOrder === "capstone-first"
          ? !capstoneComplete
            ? options.capstoneHref(locale)
            : !quizComplete
              ? options.quizHref(locale)
              : root
          : !quizComplete
            ? options.quizHref(locale)
            : !capstoneComplete
              ? options.capstoneHref(locale)
              : root;
        const fallbackNextHref = percent >= 100
          ? root
          : next
            ? lessonHref(locale, options.courseId, next)
            : assessmentHref;
        const nextHref = options.resolveNextHref?.(record, locale) ?? fallbackNextHref;
        return summary(percent, options.hasProgress(record), nextHref);
      });
    },
    resetAfterGlobalReset: () => resetAndVerify(options.reset),
    isPersistent: options.isPersistent,
  };
}

function agenticAdapter(locale: string): ProgressStoreAdapter {
  return {
    courseId: "agentic",
    storageKeys: [
      LEARNING_KEY,
      LEGACY_SECTION_KEY,
      LEGACY_SEEN_KEY,
      LEGACY_PROGRESS_KEY,
      CORRUPT_LEARNING_BACKUP_KEY,
    ],
    progressEvent: LEARNING_PROGRESS_EVENT,
    readSummary() {
      try {
        const learning = readLearningSnapshot();
        if (learning.persistence !== "persistent") return unavailableSummary();
        const state = learning.state;
        const percent = selectAgenticJourneyPercent(state);
        const nextSection = HANDBOOK_SECTION_IDS.find(
          (section) => !state.handbook.visitedSections.includes(section),
        );
        const hasProgress = state.handbook.visitedSections.length > 0
          || state.handbook.controlRoom.completedRuns > 0
          || state.lab.completedSteps.length > 0;
        const nextHref = percent >= 100
          ? `/${locale}/handbook/`
          : nextSection
            ? `/${locale}/handbook/#${nextSection}`
            : `/${locale}/lab/`;
        return summary(percent, hasProgress, nextHref);
      } catch {
        return unavailableSummary();
      }
    },
    resetAfterGlobalReset: () => {
      const result = resetLearningStateWithResult("all");
      return persistenceResult(result.persisted, result.reason, result.quarantined === true);
    },
    isPersistent: () => readLearningSnapshot().persistence === "persistent",
  };
}

function grokAdapter(locale: string): ProgressStoreAdapter {
  return {
    courseId: "grok",
    storageKeys: [
      GROK_PROGRESS_KEY,
      GROK_PROGRESS_PROBE_KEY,
      GROK_QUIZ_ATTEMPT_KEY,
      GROK_TASK_CONTRACT_DRAFT_KEY,
    ],
    progressEvent: GROK_PROGRESS_EVENT,
    readSummary() {
      return readFailClosed(grokStorageAvailable, () => {
        const progress = readGrokProgress();
        const completed = GROK_PROGRESS_LESSON_SLUGS.filter(
          (slug) => progress.lessons[slug],
        ).length + Number(progress.quizPassed) + Number(progress.capstoneReady);
        const percent = Math.round((completed / (GROK_PROGRESS_LESSON_SLUGS.length + 2)) * 100);
        const lastVisited = progress.lastVisitedLesson
          && GROK_PROGRESS_LESSON_SLUGS.includes(progress.lastVisitedLesson)
          && !progress.lessons[progress.lastVisitedLesson]
          ? progress.lastVisitedLesson
          : undefined;
        const next = lastVisited
          ?? GROK_PROGRESS_LESSON_SLUGS.find((slug) => !progress.lessons[slug]);
        const hasProgress = Boolean(progress.lastVisitedLesson)
          || Object.values(progress.lessons).some(Boolean)
          || progress.quizBest > 0
          || progress.quizPassed
          || progress.capstoneChecks.some(Boolean)
          || progress.capstoneReady;
        const nextHref = percent >= 100
          ? `/${locale}/grok/`
          : next
            ? `/${locale}/grok/${next}/`
            : !progress.quizPassed
              ? `/${locale}/grok/#grok-final-quiz`
              : `/${locale}/grok/capstone/#capstone-evidence`;
        return summary(percent, hasProgress, nextHref);
      });
    },
    resetAfterGlobalReset: () => resetAndVerify(resetGrokProgressAfterGlobalReset),
    isPersistent: grokStorageAvailable,
  };
}

function makeMoneyAdapter(locale: string): ProgressStoreAdapter {
  return {
    courseId: "make-money-with-codex",
    storageKeys: [
      SHARED_PROGRESS_KEY,
      INCOME_PROGRESS_PROBE_KEY,
      MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY,
      MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
      MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
      MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY,
      MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY,
    ],
    progressEvent: INCOME_PROGRESS_EVENT,
    readSummary() {
      return readFailClosed(incomeStorageAvailable, () => {
        const progress = readIncomeProgress();
        const complete = MAKE_MONEY_PROGRESS_LESSON_SLUGS.filter(
          (slug) => progress.lessons[slug],
        ).length + Number(progress.quizPassed) + Number(progress.capstoneReady);
        const total = MAKE_MONEY_PROGRESS_LESSON_SLUGS.length + 2;
        const percent = Math.round((complete / total) * 100);
        const next = MAKE_MONEY_PROGRESS_LESSON_SLUGS.find(
          (slug) => !progress.lessons[slug],
        );
        const hasProgress = Object.values(progress.lessons).some(Boolean)
          || progress.quizBest > 0
          || progress.quizPassed
          || progress.capstoneChecks.some(Boolean)
          || progress.capstoneReady;
        const nextHref = percent >= 100
          ? `/${locale}/make-money-with-codex/`
          : next
            ? `/${locale}/make-money-with-codex/${next}/`
            : !progress.capstoneReady
              ? `/${locale}/make-money-with-codex/launch-capstone/#income-capstone-checklist-title`
              : `/${locale}/make-money-with-codex/#income-knowledge-check`;
        return summary(percent, hasProgress, nextHref);
      });
    },
    resetAfterGlobalReset: () => resetAndVerify(resetIncomeProgressAfterGlobalReset),
    isPersistent: incomeStorageAvailable,
  };
}

function claudeIncomeAdapter(locale: string): ProgressStoreAdapter {
  return {
    courseId: "claude-income",
    storageKeys: [
      CLAUDE_INCOME_PROGRESS_STORAGE_KEY,
      CLAUDE_INCOME_QUIZ_ATTEMPT_KEY,
    ],
    progressEvent: CLAUDE_INCOME_PROGRESS_EVENT,
    readSummary() {
      return readFailClosed(isClaudeIncomePersistenceAvailable, () => {
        const record = readClaudeIncomeProgress();
        const lessons = CLAUDE_INCOME_PROGRESS_LESSON_SLUGS;
        const storedLast = record[lessonVisitedKey()];
        const lastVisited = typeof storedLast === "string"
          ? lessons.find((slug) => slug === storedLast)
          : undefined;
        const firstIncomplete = lessons.find(
          (slug) => record[lessonCompletionKey(slug)] !== true,
        );
        const resume = lastVisited
          && record[lessonCompletionKey(lastVisited)] !== true
          ? lastVisited
          : firstIncomplete;
        const quizPassed = record[CLAUDE_INCOME_PROGRESS_QUIZ.versionStorageKey]
            === CLAUDE_INCOME_PROGRESS_QUIZ.bankVersion
          && record[CLAUDE_INCOME_PROGRESS_QUIZ.passedStorageKey] === true;
        const capstoneComplete = record[CLAUDE_INCOME_PROGRESS_CAPSTONE_KEY] === true;
        const completed = lessons.filter(
          (slug) => record[lessonCompletionKey(slug)] === true,
        ).length + Number(quizPassed) + Number(capstoneComplete);
        const percent = Math.round((completed / (lessons.length + 2)) * 100);
        const hasProgress = Object.keys(record).some((key) => key.startsWith("claude-income."));
        const nextHref = percent >= 100
          ? `/${locale}/claude-income/`
          : resume
            ? `/${locale}/claude-income/${resume}/`
            : !quizPassed
              ? `/${locale}/claude-income/#final-quiz`
              : capstoneComplete
                ? `/${locale}/claude-income/`
                : `/${locale}/claude-income/capstone-seven-day-demand-test/#claude-income-capstone-audit-title`;
        return summary(percent, hasProgress, nextHref);
      });
    },
    resetAfterGlobalReset: () => resetAndVerify(resetClaudeIncomeProgressAfterGlobalReset),
    isPersistent: () => isClaudeIncomePersistenceAvailable()
      && isClaudeIncomeQuizAttemptPersistenceAvailable(),
  };
}

function contentLocaleForProjection(
  courseId: ProgressAdapterCourseId,
  requestedLocale: string,
  surfaces: readonly PublicCourseSurface[],
): string {
  const surface = surfaces.find((candidate) => candidate.id === courseId);
  if (!surface || !surface.primaryLocale) {
    throw new Error(`Progress adapter ${courseId} has no course surface locale`);
  }
  return surface.contentLocales.includes(requestedLocale as never)
    ? requestedLocale
    : surface.primaryLocale;
}

/**
 * Construct every implemented adapter, including dormant blocked courses.
 * This is used by the global reset and by release-transition contract tests;
 * public UI must call `createPublishedProgressAdapters` instead.
 */
export function createAllProgressAdapters(
  localeValue: string,
  surfaces: readonly PublicCourseSurface[] = PUBLIC_COURSE_SURFACES,
): readonly ProgressStoreAdapter[] {
  const requestedLocale = cleanLocale(localeValue);
  const localeFor = (courseId: ProgressAdapterCourseId) =>
    contentLocaleForProjection(courseId, requestedLocale, surfaces);
  const adapters: ProgressStoreAdapter[] = [
    agenticAdapter(localeFor("agentic")),
    milestoneAdapter(localeFor("codex"), {
      courseId: "codex",
      storageKey: CODEX_PROGRESS_STORAGE_KEY,
      auxiliaryStorageKeys: [CODEX_CAPSTONE_DRAFT_STORAGE_KEY],
      progressEvent: CODEX_PROGRESS_EVENT,
      slugs: CODEX_PROGRESS_LESSON_SLUGS,
      read: readCodexProgress,
      lessonComplete: (record, slug) => record[codexLessonProgressKey(slug)] === true,
      quizComplete: (record) => isVersionedQuizPassed(record, CODEX_PROGRESS_SCHEMA.quiz),
      capstoneComplete: (record) => record[CODEX_PROGRESS_SCHEMA.capstoneKey] === true,
      quizHref: (currentLocale) => `/${currentLocale}/codex/#codex-final-quiz-title`,
      capstoneHref: (currentLocale) => `/${currentLocale}/codex/automation-capstone/`,
      hasProgress: (record) => Object.keys(record).some(
        (key) => key.startsWith(CODEX_PROGRESS_SCHEMA.prefix),
      ),
      reset: resetAllCourseProgress,
      isPersistent: isCodexPersistenceAvailable,
    }),
    milestoneAdapter(localeFor("claude"), {
      courseId: "claude",
      storageKey: CLAUDE_PROGRESS_STORAGE_KEY,
      progressEvent: CLAUDE_PROGRESS_EVENT,
      slugs: CLAUDE_PROGRESS_LESSON_SLUGS,
      read: readClaudeProgress,
      lessonComplete: (record, slug) => record[claudeLessonProgressKey(slug)] === true,
      quizComplete: (record) => isVersionedQuizPassed(record, CLAUDE_PROGRESS_SCHEMA.quiz),
      capstoneComplete: isClaudeProgressCapstoneComplete,
      quizHref: (currentLocale) => `/${currentLocale}/claude/#claude-final-quiz-title`,
      capstoneHref: (currentLocale) => `/${currentLocale}/claude/portfolio-capstone/`,
      hasProgress: (record) => Object.keys(record).some(
        (key) => key.startsWith(CLAUDE_PROGRESS_SCHEMA.prefix),
      ),
      reset: resetClaudeProgressAfterGlobalReset,
      isPersistent: isClaudePersistenceAvailable,
    }),
    milestoneAdapter(localeFor("cursor"), {
      courseId: "cursor",
      storageKey: CURSOR_PROGRESS_STORAGE_KEY,
      auxiliaryStorageKeys: [
        CURSOR_SESSION_DRAFT_PROBE_KEY,
        CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
        CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
        CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
      ],
      progressEvent: CURSOR_PROGRESS_EVENT,
      slugs: CURSOR_PROGRESS_LESSON_SLUGS,
      read: readCursorProgress,
      lessonComplete: (record, slug) => record[cursorLessonProgressKey(slug)] === true,
      quizComplete: (record) => isVersionedQuizPassed(record, CURSOR_PROGRESS_SCHEMA.quiz),
      capstoneComplete: isCursorProgressCapstoneComplete,
      quizHref: (currentLocale) => `/${currentLocale}/cursor/#cursor-final-quiz-title`,
      capstoneHref: (currentLocale) => `/${currentLocale}/cursor/workflow-capstone/`,
      hasProgress: (record) => Object.keys(record).some(
        (key) => key.startsWith(CURSOR_PROGRESS_SCHEMA.prefix),
      ),
      reset: resetCursorProgressAfterGlobalReset,
      isPersistent: isCursorPersistenceAvailable,
    }),
    grokAdapter(localeFor("grok")),
    milestoneAdapter(localeFor("github"), {
      courseId: "github",
      storageKey: GITHUB_PROGRESS_STORAGE_KEY,
      progressEvent: GITHUB_PROGRESS_EVENT,
      slugs: GITHUB_PROGRESS_LESSON_SLUGS,
      read: readGithubProgress,
      lessonComplete: (record, slug) => record[githubLessonProgressKey(slug)] === true,
      quizComplete: isGithubProgressQuizPassed,
      capstoneComplete: (record) => record[GITHUB_CAPSTONE_STORAGE_KEY] === true,
      quizHref: (currentLocale) => `/${currentLocale}/github/#github-final-quiz-title`,
      capstoneHref: (currentLocale) => `/${currentLocale}/github/teaching-capstone/`,
      hasProgress: hasGithubCourseProgress,
      reset: resetGithubProgressAfterGlobalReset,
      isPersistent: isGithubPersistenceAvailable,
    }),
    milestoneAdapter(localeFor("prompts"), {
      courseId: "prompts",
      storageKey: PROMPT_PROGRESS_STORAGE_KEY,
      auxiliaryStorageKeys: [PROMPT_PROGRESS_PROBE_KEY],
      progressEvent: PROMPT_PROGRESS_EVENT,
      slugs: PROMPT_PROGRESS_LESSON_SLUGS,
      read: readPromptProgress,
      lessonComplete: (record, slug) => record[promptPracticeKey(slug)] === true,
      quizComplete: isPromptQuizPassed,
      capstoneComplete: isPromptCapstonePassed,
      quizHref: (currentLocale) => `/${currentLocale}/prompts/#prompts-final-quiz`,
      capstoneHref: (currentLocale) => `/${currentLocale}/prompts/capstone-prompt-packet/`,
      assessmentOrder: "capstone-first",
      hasProgress: (record) => Object.keys(record).some((key) => key.startsWith(PROMPT_PROGRESS_PREFIX)),
      reset: resetPromptProgressAfterGlobalReset,
      isPersistent: isPromptProgressStorageAvailable,
    }),
    milestoneAdapter(localeFor("software-engineering"), {
      courseId: "software-engineering",
      storageKey: SOFTWARE_ENGINEERING_PROGRESS_STORAGE_KEY,
      progressEvent: SOFTWARE_ENGINEERING_PROGRESS_EVENT,
      slugs: SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS,
      read: readSoftwareEngineeringProgress,
      lessonComplete: (record, slug) => record[softwareEngineeringLessonKey(slug)] === true,
      quizComplete: isSoftwareEngineeringProgressQuizPassed,
      capstoneComplete: (record) => isSoftwareEngineeringProgressCapstoneComplete(
        record[SOFTWARE_ENGINEERING_CAPSTONE_KEY],
      ),
      quizHref: (currentLocale) => `/${currentLocale}/software-engineering/#final-assessment`,
      capstoneHref: (currentLocale) => `/${currentLocale}/software-engineering/capstone-safe-change/`,
      hasProgress: (record) => Object.keys(record).some(
        (key) => key.startsWith(SOFTWARE_ENGINEERING_PROGRESS_PREFIX),
      ),
      resolveNextHref: (record, currentLocale) => softwareEngineeringNextHref(
        currentLocale,
        {
          completedLessonSlugs: SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS.filter(
            (slug) => record[softwareEngineeringLessonKey(slug)] === true,
          ),
          assessmentComplete: isSoftwareEngineeringProgressQuizPassed(record),
          capstoneComplete: isSoftwareEngineeringProgressCapstoneComplete(
            record[SOFTWARE_ENGINEERING_CAPSTONE_KEY],
          ),
          assessmentDraftActive: hasSoftwareEngineeringAssessmentDraftActivity(
            record[SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY],
          ),
          capstoneDraftActive: hasSoftwareEngineeringCapstoneDraftActivity(
            record[SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY],
          ),
        },
      ),
      reset: resetSoftwareEngineeringProgressAfterGlobalReset,
      isPersistent: isSoftwareEngineeringStorageAvailable,
    }),
    milestoneAdapter(localeFor("rag"), {
      courseId: "rag",
      storageKey: RAG_PROGRESS_STORAGE_KEY,
      auxiliaryStorageKeys: [RAG_PROGRESS_PROBE_KEY, RAG_CORRUPT_PROGRESS_BACKUP_KEY],
      progressEvent: RAG_PROGRESS_EVENT,
      slugs: RAG_PROGRESS_LESSON_SLUGS,
      read: readRagProgress,
      lessonComplete: (record, slug) => record[ragPracticeKey(slug)] === true,
      quizComplete: (record) => record[RAG_QUIZ_PASSED_KEY] === true
        && typeof record[RAG_QUIZ_BEST_KEY] === "number"
        && Number.isSafeInteger(record[RAG_QUIZ_BEST_KEY])
        && (record[RAG_QUIZ_BEST_KEY] as number) >= 9
        && (record[RAG_QUIZ_BEST_KEY] as number) <= RAG_PROGRESS_LESSON_SLUGS.length,
      capstoneComplete: (record) => record[RAG_CAPSTONE_KEY] === true,
      quizHref: (currentLocale) => `/${currentLocale}/rag/#rag-final-quiz`,
      capstoneHref: (currentLocale) => `/${currentLocale}/rag/#rag-capstone`,
      hasProgress: (record) => Object.keys(record).some((key) => key.startsWith(RAG_PROGRESS_PREFIX)),
      reset: resetRagProgressAfterGlobalReset,
      isPersistent: isRagProgressStorageAvailable,
    }),
    milestoneAdapter(localeFor("mcp"), {
      courseId: "mcp",
      storageKey: MCP_PROGRESS_STORAGE_KEY,
      progressEvent: MCP_PROGRESS_EVENT,
      slugs: MCP_PROGRESS_LESSON_SLUGS,
      read: readMcpProgress,
      lessonComplete: (record, slug) => record[`mcp.lesson.${slug}`] === true,
      quizComplete: isMcpQuizPassed,
      capstoneComplete: (record) => record["mcp.capstone.v1"] === true,
      quizHref: (currentLocale) => `/${currentLocale}/mcp/#assessment`,
      capstoneHref: (currentLocale) => `/${currentLocale}/mcp/#capstone`,
      hasProgress: (record) => Object.keys(record).some((key) => key.startsWith("mcp.")),
      reset: resetMcpProgressAfterGlobalReset,
      isPersistent: isMcpPersistenceAvailable,
    }),
    makeMoneyAdapter(localeFor("make-money-with-codex")),
    claudeIncomeAdapter(localeFor("claude-income")),
    milestoneAdapter(localeFor("ai-tutor"), {
      courseId: "ai-tutor",
      storageKey: AI_TUTOR_PROGRESS_STORAGE_KEY,
      auxiliaryStorageKeys: [
        AI_TUTOR_PROGRESS_PROBE_KEY,
        AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY,
      ],
      progressEvent: AI_TUTOR_PROGRESS_SCHEMA.progressEvent,
      slugs: AI_TUTOR_PROGRESS_MODULE_SLUGS,
      read: readAiTutorProgress,
      lessonComplete: (record, slug) => record[aiTutorProgressModuleKey(slug)] === true,
      quizComplete: (record) => record[AI_TUTOR_PROGRESS_SCHEMA.quizPassedKey] === true,
      capstoneComplete: (record) => record[AI_TUTOR_PROGRESS_SCHEMA.capstoneKey] === true,
      quizHref: (currentLocale) => `/${currentLocale}/ai-tutor/#ai-tutor-final-assessment`,
      capstoneHref: (currentLocale) => `/${currentLocale}/ai-tutor/#ai-tutor-capstone`,
      hasProgress: (record) => Object.keys(record).some(
        (key) => key.startsWith(AI_TUTOR_PROGRESS_SCHEMA.prefix),
      ),
      reset: resetAiTutorProgressAfterGlobalReset,
      isPersistent: isAiTutorProgressStorageAvailable,
    }),
    milestoneAdapter(localeFor("product-management"), {
      courseId: "product-management",
      storageKey: PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY,
      auxiliaryStorageKeys: [
        PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY,
        PRODUCT_MANAGEMENT_CORRUPT_PROGRESS_BACKUP_KEY,
        PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY,
        PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY,
      ],
      progressEvent: PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.progressEvent,
      slugs: PRODUCT_MANAGEMENT_PROGRESS_MODULE_SLUGS,
      read: readProductManagementProgress,
      lessonComplete: (record, slug) => isCurrentProductManagementProgressRecord(record)
        && record[productManagementProgressModuleKey(slug)] === true,
      quizComplete: (record) => isCurrentProductManagementProgressRecord(record)
        && record[PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.quizPassedKey] === true,
      capstoneComplete: (record) => isCurrentProductManagementProgressRecord(record)
        && record[PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.capstoneKey] === true,
      quizHref: (currentLocale) => `/${currentLocale}/product-management/#product-management-final-assessment`,
      capstoneHref: (currentLocale) => `/${currentLocale}/product-management/#product-management-capstone`,
      hasProgress: (record) => isCurrentProductManagementProgressRecord(record)
        && Object.keys(record).some(
          (key) => key.startsWith(PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.prefix)
            && key !== PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.versionKey,
        ),
      reset: resetProductManagementProgressAfterGlobalReset,
      isPersistent: () => isProductManagementStorageAvailable()
        && isProductManagementAssessmentAttemptPersistenceAvailable(),
    }),
    milestoneAdapter(localeFor("agent-orchestration"), {
      courseId: "agent-orchestration",
      storageKey: AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
      auxiliaryStorageKeys: [
        AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
        AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
      ],
      progressEvent: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.progressEvent,
      slugs: AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
      read: readAgentOrchestrationProgress,
      lessonComplete: (record, slug) =>
        record[agentOrchestrationProgressModuleKey(slug)] === true,
      quizComplete: isAgentOrchestrationProgressQuizPassed,
      capstoneComplete: isAgentOrchestrationProgressCapstoneComplete,
      quizHref: (currentLocale) => `/${currentLocale}/agent-orchestration/#agent-orchestration-assessment`,
      capstoneHref: (currentLocale) => `/${currentLocale}/agent-orchestration/#agent-orchestration-capstone-title`,
      hasProgress: (record) => Object.keys(record).some(
        (key) => key.startsWith(AGENT_ORCHESTRATION_PROGRESS_SCHEMA.prefix)
          && key !== AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey,
      ),
      reset: resetAgentOrchestrationProgressAfterGlobalReset,
      isPersistent: isAgentOrchestrationStorageAvailable,
    }),
  ];

  return adapters;
}

/**
 * Resolve the public adapter set from a generated registry projection.
 * A published course with a missing adapter or mismatched event throws rather
 * than disappearing from My Learning as a false-success release.
 */
export function createProgressAdaptersForProjection(
  localeValue: string,
  surfaces: readonly PublicCourseSurface[],
): readonly ProgressStoreAdapter[] {
  const expectedIds = publishedProgressCourseIdsForProjection(surfaces);
  const allAdapters = new Map(
    createAllProgressAdapters(localeValue, surfaces).map(
      (adapter) => [adapter.courseId, adapter] as const,
    ),
  );
  return expectedIds.map((courseId) => {
    const surface = surfaces.find((candidate) => candidate.id === courseId);
    const adapter = allAdapters.get(courseId);
    if (!surface || !adapter) {
      throw new Error(`Published course has no progress adapter: ${courseId}`);
    }
    if (!surface.progressEvent || surface.progressEvent !== adapter.progressEvent) {
      throw new Error(
        `${courseId}: projected progress event ${surface.progressEvent ?? "missing"} `
        + `does not match adapter event ${adapter.progressEvent}`,
      );
    }
    return adapter;
  });
}

export function createPublishedProgressAdapters(localeValue: string): readonly ProgressStoreAdapter[] {
  return createProgressAdaptersForProjection(localeValue, PUBLIC_COURSE_SURFACES);
}

/** One read for My Learning and any other public progress surface. */
export function readPublishedProgressSummaries(
  locale: string,
): readonly PublishedProgressSummary[] {
  return createPublishedProgressAdapters(locale).map((adapter) => ({
    courseId: adapter.courseId,
    ...adapter.readSummary(),
  }));
}

/** Fail closed if editorial publication and adapter availability drift apart. */
export function validatePublishedProgressAdapterRegistry(
  adapters: readonly ProgressStoreAdapter[],
  surfaces: readonly PublicCourseSurface[] = PUBLIC_COURSE_SURFACES,
): readonly string[] {
  const expected = [...publishedProgressCourseIdsForProjection(surfaces)].sort();
  const actual = adapters.map((adapter) => adapter.courseId).sort();
  const errors: string[] = [];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`published adapter ids differ: expected ${expected.join(", ")}; got ${actual.join(", ")}`);
  }
  const events = new Set(adapters.map((adapter) => adapter.progressEvent));
  if (events.size !== adapters.length) errors.push("published progress events must be unique");
  for (const adapter of adapters) {
    if (!adapter.storageKeys.length) errors.push(`${adapter.courseId}: storageKeys is empty`);
    if (!adapter.progressEvent.trim()) errors.push(`${adapter.courseId}: progressEvent is empty`);
  }
  return errors;
}
