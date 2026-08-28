"use client";

import {
  areCourseKitModulePrerequisitesComplete,
  courseKitModuleEvidenceState,
  courseKitCheckpointKey,
  courseKitModuleReceiptKey,
  isCourseKitModuleComplete,
} from "@/lib/course-kit/progress";
import type {
  CourseKitProgressClientConfig,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import {
  setCourseKitModuleComplete,
  setCourseKitModuleReceipt,
  useCourseKitProgress,
} from "./progress-store";
import styles from "./CourseKit.module.css";

function checkpointPassed(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { correct?: unknown }).correct === true,
  );
}

export function ModuleCompletion({
  moduleSlug,
  config,
  labels,
  requireStructuredReceipt = true,
}: {
  readonly moduleSlug: string;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly requireStructuredReceipt?: boolean;
}) {
  const { record, storageAvailable } = useCourseKitProgress(config);
  const checkpointComplete = checkpointPassed(
    record[courseKitCheckpointKey(config.courseId, moduleSlug)],
  );
  const complete = isCourseKitModuleComplete(record, config, moduleSlug);
  const prerequisitesComplete = areCourseKitModulePrerequisitesComplete(
    record,
    config,
    moduleSlug,
  );
  const receiptValue = record[config.progressVersionKey] === config.courseVersion
    ? record[courseKitModuleReceiptKey(config.courseId, moduleSlug)]
    : undefined;
  const receipt = typeof receiptValue === "string"
    ? receiptValue.slice(0, 4000)
    : "";
  const contract = config.moduleContracts.find((item) => item.moduleSlug === moduleSlug);
  const structuredReceiptRequired = requireStructuredReceipt
    && contract?.completionMode === "validated-artifact";
  const receiptComplete = !structuredReceiptRequired
    || courseKitModuleEvidenceState(record, config, moduleSlug) !== null;

  return (
    <section className={styles.completionPanel} aria-label={labels.moduleComplete}>
      <div>
        <strong>{complete ? labels.markedModuleComplete : labels.markModuleComplete}</strong>
        <p role="status" aria-live="polite">
          {complete
            ? storageAvailable === false
              ? labels.savedInMemory
              : labels.savedInBrowser
            : !checkpointComplete
              ? labels.completeCheckpointFirst
              : !prerequisitesComplete
                ? labels.completePrerequisitesFirst
                : receiptComplete
                  ? labels.browserStorageNote
                  : labels.completeReceiptFirst}
        </p>
        {structuredReceiptRequired ? (
          <label className={styles.moduleReceipt}>
            <span>{labels.evidenceReceiptLabel}</span>
            <textarea
              value={receipt}
              disabled={complete}
              maxLength={4000}
              placeholder={labels.evidenceReceiptPlaceholder}
              onChange={(event) => {
                setCourseKitModuleReceipt(
                  config,
                  moduleSlug,
                  event.currentTarget.value,
                );
              }}
            />
            <small>{labels.evidenceReceiptHelp}</small>
          </label>
        ) : (
          <small>{labels.localProgressBoundary}</small>
        )}
      </div>
      <button
        type="button"
        disabled={
          !checkpointComplete
          || !prerequisitesComplete
          || !receiptComplete
          || complete
        }
        onClick={() => setCourseKitModuleComplete(config, moduleSlug, true)}
      >
        {complete ? labels.moduleComplete : labels.markModuleComplete}
      </button>
    </section>
  );
}
