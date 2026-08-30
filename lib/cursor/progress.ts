import {
  CURSOR_CAPSTONE_ARTIFACT_IDS,
  CURSOR_CAPSTONE_FIXTURE_SHA256,
  CURSOR_CAPSTONE_FIXTURE_VERSION,
  CURSOR_CAPSTONE_PASSING_SCORE,
  CURSOR_CAPSTONE_RECEIPT_SCHEMA,
  CURSOR_CAPSTONE_RECEIPT_VERSION,
  CURSOR_CAPSTONE_REQUIRED_CHECKS,
  CURSOR_CAPSTONE_RUBRIC,
} from "./capstone";
import { isCursorQuizPassed } from "./quiz";
import { CURSOR_LESSON_SLUGS, type CursorLessonSlug } from "./types";

export const CURSOR_PROGRESS_STORAGE_KEY = "aicourse.cursor.progress.v1" as const;
export const CURSOR_PROGRESS_EVENT = "cursor:progress-change" as const;
export const CURSOR_PROGRESS_PREFIX = "cursor." as const;
/**
 * Cursor tabs use a course-specific lock around their isolated progress
 * record. Other courses never read or write this localStorage key.
 */
export const CURSOR_PROGRESS_LOCK_NAME = "aicourse:cursor-progress" as const;
export const CURSOR_CAPSTONE_PROGRESS_KEY = `cursor.capstone.v${CURSOR_CAPSTONE_RECEIPT_VERSION}` as const;
export const CURSOR_CAPSTONE_META_PROGRESS_KEY = `cursor.capstoneMeta.v${CURSOR_CAPSTONE_RECEIPT_VERSION}` as const;
export const CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY = `cursor.capstoneAssessment.v${CURSOR_CAPSTONE_RECEIPT_VERSION}` as const;
export const CURSOR_CAPSTONE_PROGRESS_META = {
  receiptSchema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
  receiptVersion: CURSOR_CAPSTONE_RECEIPT_VERSION,
  fixtureVersion: CURSOR_CAPSTONE_FIXTURE_VERSION,
  fixtureSha256: CURSOR_CAPSTONE_FIXTURE_SHA256,
  requiredChecks: CURSOR_CAPSTONE_REQUIRED_CHECKS.join("|"),
} as const;
export const CURSOR_GLOBAL_RESET_ADAPTER = "resetCursorProgressAfterGlobalReset" as const;

export interface CursorCapstoneProgressAssessment {
  readonly artifactIds: readonly string[];
  readonly rubricIds: readonly string[];
  readonly score: number;
}

/**
 * Build the non-sensitive self-assessment companion stored after receipt
 * validation. It records only public rubric/artifact IDs and the derived
 * score; receipt text, paths, logs, and command output remain in memory only.
 */
export function createCursorCapstoneProgressAssessment(
  artifactChecks: Readonly<Record<string, boolean>>,
  rubricChecks: Readonly<Record<string, boolean>>,
): CursorCapstoneProgressAssessment {
  const artifactIds = CURSOR_CAPSTONE_ARTIFACT_IDS.filter((id) => artifactChecks[id] === true);
  const rubricIds = CURSOR_CAPSTONE_RUBRIC
    .filter((item) => rubricChecks[item.id] === true)
    .map((item) => item.id);
  const score = CURSOR_CAPSTONE_RUBRIC.reduce(
    (total, item) => total + (rubricChecks[item.id] === true ? item.weight : 0),
    0,
  );
  return { artifactIds, rubricIds, score };
}

export function cursorLessonProgressKey(
  slug: CursorLessonSlug,
): `cursor.lesson.${CursorLessonSlug}` {
  return `cursor.lesson.${slug}`;
}

export const CURSOR_LESSON_PROGRESS_KEYS = CURSOR_LESSON_SLUGS.map(
  cursorLessonProgressKey,
);
export const CURSOR_PROGRESS_MILESTONES = CURSOR_LESSON_PROGRESS_KEYS.length + 2;

/**
 * Public integration contract for the catalogue cache and the global reset.
 *
 * Cursor writes into its isolated `aicourse.cursor.progress.v1` object.
 * Same-tab consumers invalidate on `cursor:progress-change`; cross-tab
 * consumers invalidate on the browser `storage` event for that key. Cursor writers take the
 * `aicourse:cursor-progress` lock. The site-wide reset must await
 * `resetCursorProgressAfterGlobalReset()` after the existing
 * `resetAllCourseProgress()` call so this module's memory-only fallback is also
 * cleared when browser storage has failed.
 */
export const CURSOR_PROGRESS_CACHE_CONTRACT = {
  storageKey: CURSOR_PROGRESS_STORAGE_KEY,
  keyPrefix: CURSOR_PROGRESS_PREFIX,
  sameTabEvent: CURSOR_PROGRESS_EVENT,
  crossTabEvent: "storage",
  focusEvent: "focus",
  lockName: CURSOR_PROGRESS_LOCK_NAME,
  boundedCommitAttempts: 3,
  storageIsolation: "course-specific record; no cross-course writers",
  cooperativeWriterScope: "Cursor tabs",
  nonCooperatingWriterStrategy: "isolated-record-no-cross-course-writers",
  globalReset: {
    callAfter: "resetAllCourseProgress",
    adapter: CURSOR_GLOBAL_RESET_ADAPTER,
    awaitAdapter: true,
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameOrderedValues(left: unknown, right: readonly string[]): left is readonly string[] {
  return Array.isArray(left)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

/** Return the persisted self-assessment only when its IDs and score agree. */
export function getCursorCapstoneProgressAssessment(
  value: unknown,
): CursorCapstoneProgressAssessment | null {
  if (!isRecord(value)) return null;
  const assessment = value[CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY];
  if (!isRecord(assessment) || Object.keys(assessment).length !== 3) return null;
  if (!sameOrderedValues(assessment.artifactIds, CURSOR_CAPSTONE_ARTIFACT_IDS)) return null;
  const storedRubricIds = assessment.rubricIds;
  if (!Array.isArray(storedRubricIds)) return null;

  const rubricIds = CURSOR_CAPSTONE_RUBRIC
    .filter((item) => storedRubricIds.includes(item.id))
    .map((item) => item.id);
  if (!sameOrderedValues(storedRubricIds, rubricIds)) return null;
  if (!rubricIds.includes("safety") || !rubricIds.includes("verification")) return null;
  const score = CURSOR_CAPSTONE_RUBRIC.reduce(
    (total, item) => total + (rubricIds.includes(item.id) ? item.weight : 0),
    0,
  );
  if (score < CURSOR_CAPSTONE_PASSING_SCORE || assessment.score !== score) return null;
  return { artifactIds: [...CURSOR_CAPSTONE_ARTIFACT_IDS], rubricIds, score };
}

/**
 * A capstone Boolean is valid only with the non-sensitive contract metadata
 * that was actually checked. Receipt text, file paths, logs, and command output
 * are never stored. Changing the receipt version automatically changes both
 * progress records, so an earlier completion cannot be relabelled as current.
 */
export function isCursorCapstoneProgressPassed(value: unknown): boolean {
  if (!isRecord(value) || value[CURSOR_CAPSTONE_PROGRESS_KEY] !== true) return false;
  const metadata = value[CURSOR_CAPSTONE_META_PROGRESS_KEY];
  if (!isRecord(metadata)) return false;
  const expectedEntries = Object.entries(CURSOR_CAPSTONE_PROGRESS_META);
  return Object.keys(metadata).length === expectedEntries.length
    && expectedEntries.every(([key, expected]) => metadata[key] === expected)
    && getCursorCapstoneProgressAssessment(value) !== null;
}

/**
 * Count the sixteen Cursor milestones: fourteen self-reported strict lesson
 * Booleans, the versioned 10/12 quiz pass, and the
 * receipt-format milestone for `cursor.capstone.v1`, its contract metadata,
 * and a passing, internally consistent learner self-assessment.
 */
export function cursorProgressCompletedMilestones(value: unknown): number {
  if (!isRecord(value)) return 0;

  const lessons = CURSOR_LESSON_PROGRESS_KEYS.filter(
    (key) => value[key] === true,
  ).length;
  return lessons
    + Number(isCursorQuizPassed(value))
    + Number(isCursorCapstoneProgressPassed(value));
}

/** Pure catalogue adapter for the isolated Cursor progress record. */
export function cursorProgressPercent(value: unknown): number {
  const completed = cursorProgressCompletedMilestones(value);
  return Math.round((completed / CURSOR_PROGRESS_MILESTONES) * 100);
}
