"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  courseKitCapstoneArtifactKey,
  courseKitCapstoneCompleteKey,
  courseKitCapstoneDraftKey,
  courseKitCapstoneVersionKey,
  courseKitArtifactCompletionMarker,
  courseKitCapstoneArtifactEvidenceState,
  courseKitCheckpointKey,
  courseKitModuleCompleteKey,
  courseKitModuleReceiptKey,
  courseKitQuizBestKey,
  courseKitQuizBestPassedKey,
  courseKitQuizCurrentScoreKey,
  courseKitQuizDraftKey,
  courseKitQuizFormKey,
  courseKitQuizPassedKey,
  courseKitQuizVersionKey,
  courseKitProgressPrefix,
  COURSE_KIT_PROGRESS_EVENT,
  COURSE_KIT_PROGRESS_RESET_EVENT,
  invalidateCourseKitProgressRecord,
  isCourseKitCapstoneArtifactComplete,
  isCourseKitModuleComplete,
  isCourseKitQuizComplete,
  courseKitModuleEvidenceState,
} from "@/lib/course-kit/progress";
import type {
  CourseKitOptionIndex,
  CourseKitProgressClientConfig,
} from "@/lib/course-kit/types";
import { COURSE_KIT_COURSE_IDS } from "@/lib/course-kit/types";

export type CourseKitProgressRecord = Record<string, unknown>;

const STORAGE_PROBE_KEY = "__aicourse_course_kit_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.course-kit-corrupt-backup";
const EMPTY_SNAPSHOT = "{}";
export const COURSE_KIT_GLOBAL_RESET_EVENT =
  COURSE_KIT_PROGRESS_RESET_EVENT;

let memorySnapshot = EMPTY_SNAPSHOT;
let persistenceAvailable: boolean | null = null;

function isPlainRecord(value: unknown): value is CourseKitProgressRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function parseSnapshot(raw: string): CourseKitProgressRecord | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPlainRecord(parsed) ? { ...parsed } : null;
  } catch {
    return null;
  }
}

function holdCorruptSharedRecord(raw: string): void {
  memorySnapshot = EMPTY_SNAPSHOT;
  if (typeof window !== "undefined") {
    try {
      if (!sessionStorage.getItem(CORRUPT_BACKUP_KEY)) {
        sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw);
      }
    } catch {
      // The unreadable shared record remains untouched if backup storage fails.
    }
  }
  // Never overwrite a malformed shared record. Memory is authoritative until reload.
  persistenceAvailable = false;
}

export function isCourseKitProgressStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  if (persistenceAvailable !== null) return persistenceAvailable;
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, "1");
    localStorage.removeItem(STORAGE_PROBE_KEY);
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
  return persistenceAvailable;
}

function readSnapshot(): string {
  if (typeof window === "undefined" || !isCourseKitProgressStorageAvailable()) {
    return memorySnapshot;
  }
  try {
    const raw = localStorage.getItem("ae.progress") ?? EMPTY_SNAPSHOT;
    if (!parseSnapshot(raw)) {
      holdCorruptSharedRecord(raw);
      return memorySnapshot;
    }
    memorySnapshot = raw;
  } catch {
    persistenceAvailable = false;
  }
  return memorySnapshot;
}

export function readCourseKitProgress(): CourseKitProgressRecord {
  return parseSnapshot(readSnapshot()) ?? {};
}

function dispatchProgressEvent(
  config: CourseKitProgressClientConfig,
  persisted: boolean,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(COURSE_KIT_PROGRESS_EVENT, {
      detail: { courseId: config.courseId, persisted },
    }),
  );
}

export function writeCourseKitProgress(
  config: CourseKitProgressClientConfig,
  record: CourseKitProgressRecord,
): boolean {
  memorySnapshot = JSON.stringify(record);
  const persisted = persistSnapshot(config.storageKey);
  dispatchProgressEvent(config, persisted);
  return persisted;
}

function persistSnapshot(storageKey: "ae.progress"): boolean {
  let persisted = false;
  if (typeof window !== "undefined") {
    try {
      if (isCourseKitProgressStorageAvailable()) {
        localStorage.setItem(storageKey, memorySnapshot);
        persisted = true;
      }
    } catch {
      persistenceAvailable = false;
    }
  }
  return persisted;
}

export function updateCourseKitProgress(
  config: CourseKitProgressClientConfig,
  mutator: (record: CourseKitProgressRecord) => void,
): boolean {
  const record = readCourseKitProgress();
  invalidateCourseKitProgressRecord(record, config);
  mutator(record);
  return writeCourseKitProgress(config, record);
}

export function resetCourseKitProgress(
  config: CourseKitProgressClientConfig,
): boolean {
  const record = readCourseKitProgress();
  for (const key of Object.keys(record)) {
    if (key.startsWith(config.progressPrefix)) delete record[key];
  }
  record[config.progressVersionKey] = config.courseVersion;
  const persisted = writeCourseKitProgress(config, record);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(COURSE_KIT_PROGRESS_RESET_EVENT, {
        detail: { courseId: config.courseId, persisted },
      }),
    );
  }
  return persisted;
}

/**
 * Reset all Course 16–21 progress without touching other keys in `ae.progress`.
 * Passing configs also seeds each current course version after the reset.
 */
export function resetAllCourseKitProgress(
  configs: readonly CourseKitProgressClientConfig[] = [],
): boolean {
  const record = readCourseKitProgress();
  const configuredById = new Map(
    configs.map((config) => [config.courseId, config] as const),
  );
  for (const courseId of COURSE_KIT_COURSE_IDS) {
    const prefix = configuredById.get(courseId)?.progressPrefix ??
      courseKitProgressPrefix(courseId);
    for (const key of Object.keys(record)) {
      if (key.startsWith(prefix)) delete record[key];
    }
    const config = configuredById.get(courseId);
    if (config) record[config.progressVersionKey] = config.courseVersion;
  }

  memorySnapshot = JSON.stringify(record);
  const persisted = persistSnapshot("ae.progress");
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(COURSE_KIT_PROGRESS_EVENT, {
        detail: { courseIds: COURSE_KIT_COURSE_IDS, persisted },
      }),
    );
    window.dispatchEvent(
      new CustomEvent(COURSE_KIT_PROGRESS_RESET_EVENT, {
        detail: { courseIds: COURSE_KIT_COURSE_IDS, persisted },
      }),
    );
  }
  return persisted;
}

export function setCourseKitCheckpoint(
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
  choice: CourseKitOptionIndex,
  correct: boolean,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    record[courseKitCheckpointKey(config.courseId, moduleSlug)] = {
      choice,
      correct,
    };
  });
}

export function setCourseKitModuleComplete(
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
  complete: boolean,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    const key = courseKitModuleCompleteKey(config.courseId, moduleSlug);
    if (!complete) {
      delete record[key];
      return;
    }
    const evidence = courseKitModuleEvidenceState(record, config, moduleSlug);
    if (!evidence) {
      delete record[key];
      return;
    }
    record[key] = evidence.artifactSha256 === "self-attested"
      ? "self-attested"
      : courseKitArtifactCompletionMarker(
          evidence.artifactId,
          evidence.artifactSha256,
        );
  });
}

export function setCourseKitModuleReceipt(
  config: CourseKitProgressClientConfig,
  moduleSlug: string,
  receipt: string,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    const key = courseKitModuleReceiptKey(config.courseId, moduleSlug);
    if (receipt) record[key] = receipt.slice(0, 4000);
    else delete record[key];
    delete record[courseKitModuleCompleteKey(config.courseId, moduleSlug)];
    record[courseKitCapstoneCompleteKey(config.courseId)] = false;
  });
}

export function recordCourseKitQuizAttempt(
  config: CourseKitProgressClientConfig,
  score: number,
  passed: boolean,
  formId?: string,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    const bestKey = courseKitQuizBestKey(config.courseId);
    const bestPassedKey = courseKitQuizBestPassedKey(config.courseId);
    const currentScoreKey = courseKitQuizCurrentScoreKey(config.courseId);
    const quizVersionKey = courseKitQuizVersionKey(config.courseId);
    const currentQuiz = record[quizVersionKey] === config.quizVersion;
    const previous =
      currentQuiz && typeof record[bestKey] === "number" ? record[bestKey] : 0;
    if (!currentQuiz) {
      delete record[bestKey];
      delete record[bestPassedKey];
      delete record[currentScoreKey];
      delete record[courseKitQuizPassedKey(config.courseId)];
    }
    record[quizVersionKey] = config.quizVersion;
    if (formId) record[courseKitQuizFormKey(config.courseId)] = formId;
    record[currentScoreKey] = score;
    record[bestKey] = Math.max(previous, score);
    record[courseKitQuizPassedKey(config.courseId)] = passed;
    record[bestPassedKey] = record[bestPassedKey] === true || passed;
    if (!passed) record[courseKitCapstoneCompleteKey(config.courseId)] = false;
  });
}

export function setCourseKitQuizDraft(
  config: CourseKitProgressClientConfig,
  answers: Readonly<Record<string, CourseKitOptionIndex>>,
  formId?: string,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    const versionKey = courseKitQuizVersionKey(config.courseId);
    if (record[versionKey] !== config.quizVersion) {
      for (const key of Object.keys(record)) {
        if (key.startsWith(`${config.progressPrefix}quiz.`)) delete record[key];
      }
    }
    record[versionKey] = config.quizVersion;
    if (formId) record[courseKitQuizFormKey(config.courseId)] = formId;
    record[courseKitQuizDraftKey(config.courseId)] = { ...answers };
  });
}

export function setCourseKitQuizForm(
  config: CourseKitProgressClientConfig,
  formId: string,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    record[courseKitQuizVersionKey(config.courseId)] = config.quizVersion;
    record[courseKitQuizFormKey(config.courseId)] = formId;
    delete record[courseKitQuizDraftKey(config.courseId)];
    delete record[courseKitQuizCurrentScoreKey(config.courseId)];
    record[courseKitQuizPassedKey(config.courseId)] = false;
    record[courseKitCapstoneCompleteKey(config.courseId)] = false;
  });
}

export function clearCourseKitQuizDraft(
  config: CourseKitProgressClientConfig,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    delete record[courseKitQuizDraftKey(config.courseId)];
  });
}

export function setCourseKitCapstoneArtifact(
  config: CourseKitProgressClientConfig,
  artifactId: string,
  complete: boolean,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    const versionKey = courseKitCapstoneVersionKey(config.courseId);
    if (record[versionKey] !== config.capstoneVersion) {
      for (const key of Object.keys(record)) {
        if (key.startsWith(`${config.progressPrefix}capstone.`)) delete record[key];
      }
    }
    record[versionKey] = config.capstoneVersion;
    const artifactKey = courseKitCapstoneArtifactKey(config.courseId, artifactId);
    if (!complete) {
      delete record[artifactKey];
      record[courseKitCapstoneCompleteKey(config.courseId)] = false;
      return;
    }
    const evidence = courseKitCapstoneArtifactEvidenceState(
      record,
      config,
      artifactId,
    );
    if (evidence) {
      record[artifactKey] = courseKitArtifactCompletionMarker(
        artifactId,
        evidence.sha256,
      );
    } else {
      delete record[artifactKey];
    }
    record[courseKitCapstoneCompleteKey(config.courseId)] = false;
  });
}

export function setCourseKitCapstoneDraft(
  config: CourseKitProgressClientConfig,
  artifactId: string,
  draft: string,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    const versionKey = courseKitCapstoneVersionKey(config.courseId);
    if (record[versionKey] !== config.capstoneVersion) {
      for (const key of Object.keys(record)) {
        if (key.startsWith(`${config.progressPrefix}capstone.`)) delete record[key];
      }
    }
    record[versionKey] = config.capstoneVersion;
    const key = courseKitCapstoneDraftKey(config.courseId, artifactId);
    const trimmed = draft.slice(0, 2000);
    if (trimmed) record[key] = trimmed;
    else delete record[key];
    delete record[courseKitCapstoneArtifactKey(config.courseId, artifactId)];
    record[courseKitCapstoneCompleteKey(config.courseId)] = false;
  });
}

export function setCourseKitCapstoneComplete(
  config: CourseKitProgressClientConfig,
): boolean {
  return updateCourseKitProgress(config, (record) => {
    const versionKey = courseKitCapstoneVersionKey(config.courseId);
    if (record[versionKey] !== config.capstoneVersion) {
      for (const key of Object.keys(record)) {
        if (key.startsWith(`${config.progressPrefix}capstone.`)) delete record[key];
      }
    }
    record[versionKey] = config.capstoneVersion;
    const allModulesComplete = config.moduleSlugs.every((moduleSlug) =>
      isCourseKitModuleComplete(record, config, moduleSlug)
    );
    const quizComplete = isCourseKitQuizComplete(record, config);
    const allArtifactsComplete = config.capstoneArtifactIds.every((artifactId) =>
      isCourseKitCapstoneArtifactComplete(record, config, artifactId)
    );
    record[courseKitCapstoneCompleteKey(config.courseId)] =
      allModulesComplete && quizComplete && allArtifactsComplete;
  });
}

function subscribeCourseKitProgress(
  config: CourseKitProgressClientConfig,
  listener: () => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === config.storageKey) listener();
  };
  window.addEventListener(config.progressEvent, listener);
  window.addEventListener(config.resetEvent, listener);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener(config.progressEvent, listener);
    window.removeEventListener(config.resetEvent, listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", listener);
  };
}

export function useCourseKitProgress(
  config: CourseKitProgressClientConfig,
): {
  readonly record: CourseKitProgressRecord;
  readonly storageAvailable: boolean | null;
} {
  const raw = useSyncExternalStore(
    (listener) => subscribeCourseKitProgress(config, listener),
    readSnapshot,
    () => EMPTY_SNAPSHOT,
  );
  const storageStatus = useSyncExternalStore(
    (listener) => subscribeCourseKitProgress(config, listener),
    () => (isCourseKitProgressStorageAvailable() ? "available" : "memory"),
    () => "unknown",
  );
  const record = useMemo(() => parseSnapshot(raw) ?? {}, [raw]);
  return {
    record,
    storageAvailable:
      storageStatus === "unknown" ? null : storageStatus === "available",
  };
}
