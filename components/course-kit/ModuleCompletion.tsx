"use client";

import { isCourseKitEvidenceReceipt } from "@/lib/course-kit/evidence-receipt";
import {
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
  requireStructuredReceipt = false,
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
  const receiptValue = record[config.progressVersionKey] === config.courseVersion
    ? record[courseKitModuleReceiptKey(config.courseId, moduleSlug)]
    : undefined;
  const receipt = typeof receiptValue === "string"
    ? receiptValue.slice(0, 4000)
    : "";
  const receiptComplete = !requireStructuredReceipt
    || isCourseKitEvidenceReceipt(receipt);

  return (
    <section className={styles.completionPanel} aria-label={labels.moduleComplete}>
      <div>
        <strong>{complete ? labels.markedModuleComplete : labels.markModuleComplete}</strong>
        <p role="status" aria-live="polite">
          {complete
            ? storageAvailable === false
              ? labels.savedInMemory
              : labels.savedInBrowser
            : checkpointComplete
              ? receiptComplete
                ? labels.browserStorageNote
                : labels.completeReceiptFirst
              : labels.completeCheckpointFirst}
        </p>
        {requireStructuredReceipt ? (
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
        ) : null}
      </div>
      <button
        type="button"
        disabled={!checkpointComplete || !receiptComplete || complete}
        onClick={() => setCourseKitModuleComplete(config, moduleSlug, true)}
      >
        {complete ? labels.moduleComplete : labels.markModuleComplete}
      </button>
    </section>
  );
}
