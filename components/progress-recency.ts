"use client";

import {
  PUBLISHED_PROGRESS_COURSE_IDS,
  type PersistenceResult,
  type PublishedProgressCourseId,
} from "@/lib/public-progress-contract";
import { clearCorruptProgressAfterVerifiedQuarantine } from "@/lib/progress-persistence";
import { RECENCY_RESET_QUARANTINE_KEY } from "@/lib/progress-storage-contract";

export const PROGRESS_RECENCY_STORAGE_KEY = "ae.progress.recent.v1";
export const PROGRESS_RECENCY_EVENT = "aicourse:progress-recency-change";

export type ProgressActivity = Partial<Record<PublishedProgressCourseId, number>>;

export interface ProgressRecencySnapshot {
  readonly activity: ProgressActivity;
  readonly persistence: "persistent" | "session-only";
  readonly reason?: PersistenceResult["reason"];
}

interface ProgressRecencyLedger {
  readonly version: 1;
  readonly activity: ProgressActivity;
}

const COURSE_IDS = new Set<string>(PUBLISHED_PROGRESS_COURSE_IDS);
const EMPTY_LEDGER: ProgressRecencyLedger = Object.freeze({
  version: 1,
  activity: Object.freeze({}),
});

let memoryLedger: ProgressRecencyLedger = EMPTY_LEDGER;
let persistenceAvailable: boolean | null = null;
let failureReason: PersistenceResult["reason"];
let lastIssuedActivity = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseLedger(raw: string): ProgressRecencyLedger | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.activity)) return null;
    const activity: ProgressActivity = {};
    for (const [courseId, value] of Object.entries(parsed.activity)) {
      if (
        !COURSE_IDS.has(courseId)
        || typeof value !== "number"
        || !Number.isSafeInteger(value)
        || value < 0
      ) return null;
      activity[courseId as PublishedProgressCourseId] = value;
    }
    return { version: 1, activity };
  } catch {
    return null;
  }
}

function reasonForStorageFailure(error: unknown): PersistenceResult["reason"] {
  if (
    isRecord(error)
    && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  ) return "quota";
  return "unavailable";
}

function sessionSnapshot(): ProgressRecencySnapshot {
  return {
    activity: { ...memoryLedger.activity },
    persistence: "session-only",
    reason: failureReason ?? "unavailable",
  };
}

export function readProgressRecency(): ProgressRecencySnapshot {
  if (typeof window === "undefined") return sessionSnapshot();
  if (persistenceAvailable === false) return sessionSnapshot();

  try {
    const raw = window.localStorage.getItem(PROGRESS_RECENCY_STORAGE_KEY);
    if (raw === null) {
      memoryLedger = EMPTY_LEDGER;
      persistenceAvailable = true;
      failureReason = undefined;
    } else {
      const parsed = parseLedger(raw);
      if (!parsed) {
        memoryLedger = EMPTY_LEDGER;
        persistenceAvailable = false;
        failureReason = "corrupt";
        return sessionSnapshot();
      }
      memoryLedger = parsed;
      persistenceAvailable = true;
      failureReason = undefined;
      lastIssuedActivity = Math.max(lastIssuedActivity, ...Object.values(parsed.activity));
    }
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForStorageFailure(error);
    return sessionSnapshot();
  }

  return {
    activity: { ...memoryLedger.activity },
    persistence: "persistent",
  };
}

export function recordProgressActivity(
  courseId: PublishedProgressCourseId,
  observedAt = Date.now(),
): PersistenceResult {
  const current = readProgressRecency();
  const safeObservedAt = Number.isSafeInteger(observedAt) && observedAt >= 0
    ? observedAt
    : 0;
  const activity = Math.max(safeObservedAt, lastIssuedActivity + 1);
  lastIssuedActivity = activity;
  memoryLedger = {
    version: 1,
    activity: { ...current.activity, [courseId]: activity },
  };

  if (persistenceAvailable === false || typeof window === "undefined") {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(PROGRESS_RECENCY_EVENT));
    return { persisted: false, reason: failureReason ?? "unavailable" };
  }

  try {
    window.localStorage.setItem(PROGRESS_RECENCY_STORAGE_KEY, JSON.stringify(memoryLedger));
    persistenceAvailable = true;
    failureReason = undefined;
    window.dispatchEvent(new Event(PROGRESS_RECENCY_EVENT));
    return { persisted: true };
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForStorageFailure(error);
    window.dispatchEvent(new Event(PROGRESS_RECENCY_EVENT));
    return { persisted: false, reason: failureReason };
  }
}

export function resetProgressRecencyAfterGlobalReset(): PersistenceResult {
  memoryLedger = EMPTY_LEDGER;
  lastIssuedActivity = 0;
  if (typeof window === "undefined") {
    persistenceAvailable = false;
    failureReason = "unavailable";
    return { persisted: false, reason: "unavailable" };
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_RECENCY_STORAGE_KEY);
    if (raw !== null && !parseLedger(raw)) {
      const reset = clearCorruptProgressAfterVerifiedQuarantine({
        storage: window.localStorage,
        sourceKey: PROGRESS_RECENCY_STORAGE_KEY,
        quarantineKey: RECENCY_RESET_QUARANTINE_KEY,
        corruptRaw: raw,
      });
      persistenceAvailable = reset.persisted;
      failureReason = reset.persisted ? undefined : reset.reason ?? "unavailable";
      window.dispatchEvent(new Event(PROGRESS_RECENCY_EVENT));
      return reset;
    }
    window.localStorage.removeItem(PROGRESS_RECENCY_STORAGE_KEY);
    persistenceAvailable = true;
    failureReason = undefined;
    window.dispatchEvent(new Event(PROGRESS_RECENCY_EVENT));
    return { persisted: true };
  } catch (error) {
    persistenceAvailable = false;
    failureReason = reasonForStorageFailure(error);
    window.dispatchEvent(new Event(PROGRESS_RECENCY_EVENT));
    return { persisted: false, reason: failureReason };
  }
}

export function isProgressRecencyPersistent(): boolean {
  return readProgressRecency().persistence === "persistent";
}

export function sortCourseIdsByRecentActivity(
  courseIds: readonly PublishedProgressCourseId[],
  activity: ProgressActivity,
): readonly PublishedProgressCourseId[] {
  const stableOrder = new Map(courseIds.map((courseId, index) => [courseId, index]));
  return [...courseIds].sort((left, right) =>
    (activity[right] ?? -1) - (activity[left] ?? -1)
    || (stableOrder.get(left) ?? 0) - (stableOrder.get(right) ?? 0));
}
