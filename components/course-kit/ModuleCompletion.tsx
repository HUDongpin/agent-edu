"use client";

import {
  createCourseKitEvidenceReceiptTemplate,
  validateCourseKitEvidenceReceipt,
} from "@/lib/course-kit/evidence-receipt";
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
  const storedComplete = isCourseKitModuleComplete(record, config, moduleSlug);
  const receiptValue = record[config.progressVersionKey] === config.courseVersion
    ? record[courseKitModuleReceiptKey(config.courseId, moduleSlug)]
    : undefined;
  const receipt = typeof receiptValue === "string"
    ? receiptValue.slice(0, 4000)
    : "";
  const expectedReceiptPath = `outputs/${config.courseId}/${moduleSlug}.json`;
  const receiptValidation = validateCourseKitEvidenceReceipt(receipt, {
    expectedArtifactPath: expectedReceiptPath,
  });
  const receiptComplete = !requireStructuredReceipt || receiptValidation.valid;
  const complete = storedComplete && checkpointComplete && receiptComplete;
  const receiptId = `${config.courseId}-${moduleSlug}-receipt`;
  const receiptHelpId = `${receiptId}-help`;
  const receiptStatusId = `${receiptId}-status`;

  return (
    <section
      className={styles.completionPanel}
      aria-label={complete ? labels.moduleComplete : labels.markModuleComplete}
    >
      <div>
        <strong>{complete ? labels.markedModuleComplete : labels.markModuleComplete}</strong>
        <p role="status" aria-live="polite">
          {complete
            ? storageAvailable === false
              ? labels.savedInMemory
              : labels.savedInBrowser
              : checkpointComplete
              ? receiptComplete
                ? storageAvailable === false
                  ? labels.savedInMemory
                  : labels.browserStorageNote
                : labels.completeReceiptFirst
              : labels.completeCheckpointFirst}
        </p>
        {requireStructuredReceipt ? (
          <label className={styles.moduleReceipt}>
            <span>{labels.evidenceReceiptLabel}</span>
            <textarea
              id={receiptId}
              name={`${config.courseId}-${moduleSlug}-evidence-receipt`}
              value={receipt}
              disabled={complete}
              maxLength={4000}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              dir="ltr"
              aria-invalid={receipt && !receiptValidation.valid ? true : undefined}
              aria-describedby={`${receiptHelpId} ${receiptStatusId}`}
              placeholder={labels.evidenceReceiptPlaceholder}
              onChange={(event) => {
                setCourseKitModuleReceipt(
                  config,
                  moduleSlug,
                  event.currentTarget.value,
                );
              }}
            />
            <small id={receiptHelpId}>
              {labels.evidenceReceiptHelp}{" "}
              <code>{expectedReceiptPath}</code>
            </small>
            <small
              id={receiptStatusId}
              className={styles.receiptValidation}
              data-valid={receiptValidation.valid || undefined}
              aria-live="polite"
            >
              {receipt
                ? receiptValidation.valid
                  ? labels.evidenceReceiptValid
                  : labels.evidenceReceiptInvalid
                : ""}
            </small>
          </label>
        ) : null}
        {requireStructuredReceipt && !complete && !receipt ? (
          <button
            type="button"
            className={styles.receiptTemplateButton}
            onClick={() => {
              setCourseKitModuleReceipt(
                config,
                moduleSlug,
                createCourseKitEvidenceReceiptTemplate(
                  expectedReceiptPath,
                ),
              );
            }}
          >
            {labels.insertEvidenceReceiptTemplate}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={!complete && (!checkpointComplete || !receiptComplete)}
        onClick={() => setCourseKitModuleComplete(config, moduleSlug, !complete)}
      >
        {complete ? labels.reopenModule : labels.markModuleComplete}
      </button>
    </section>
  );
}
