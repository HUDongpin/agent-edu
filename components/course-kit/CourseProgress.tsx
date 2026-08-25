"use client";

import { useState } from "react";
import { courseKitProgressSummary } from "@/lib/course-kit/progress";
import type {
  CourseKitProgressClientConfig,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import { formatCourseKitCopy } from "@/lib/course-kit/ui-copy";
import {
  resetCourseKitProgress,
  useCourseKitProgress,
} from "./progress-store";
import styles from "./CourseKit.module.css";

export function CourseProgress({
  config,
  labels,
  compact = false,
  idSuffix,
}: {
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly compact?: boolean;
  readonly idSuffix?: string;
}) {
  const { record, storageAvailable } = useCourseKitProgress(config);
  const progress = courseKitProgressSummary(record, config);
  const [resetArmed, setResetArmed] = useState(false);
  const [resetPersisted, setResetPersisted] = useState<boolean | null>(null);
  const progressText = formatCourseKitCopy(labels.progressPosition, {
    completed: progress.completed,
    total: progress.total,
  });
  const titleId = `${config.courseId}-progress-title${idSuffix ? `-${idSuffix}` : ""}`;

  return (
    <section
      className={compact ? styles.progressCompact : styles.progressPanel}
      aria-labelledby={titleId}
    >
      <div className={styles.progressHeading}>
        <h2 id={titleId}>{labels.courseProgress}</h2>
        <strong>{progress.percent}%</strong>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={progressText}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-valuetext={progressText}
      >
        <span style={{ inlineSize: `${progress.percent}%` }} />
      </div>
      <p>{progressText}</p>
      {!compact ? (
        <div className={styles.progressActions}>
          <p role="status" aria-live="polite">
            {resetPersisted !== null
              ? resetPersisted
                ? labels.resetDone
                : labels.resetDoneMemory
              : storageAvailable === false
                ? labels.storageUnavailable
                : labels.browserStorageNote}
          </p>
          <button
            type="button"
            data-danger={resetArmed || undefined}
            onBlur={() => setResetArmed(false)}
            onClick={() => {
              if (!resetArmed) {
                setResetArmed(true);
                setResetPersisted(null);
                return;
              }
              setResetPersisted(resetCourseKitProgress(config));
              setResetArmed(false);
            }}
          >
            {resetArmed ? labels.resetConfirm : labels.resetProgress}
          </button>
        </div>
      ) : null}
    </section>
  );
}
