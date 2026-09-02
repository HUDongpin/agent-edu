"use client";

import { useRef } from "react";
import type { CursorCourseCopy, CursorLessonSlug } from "@/lib/cursor";
import {
  lessonProgressKey,
  applyCursorProgressPatch,
} from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

export default function LessonCompletion({
  slug,
  labels,
  showStorageWarning = true,
}: {
  slug: CursorLessonSlug;
  labels: CursorCourseCopy["ui"];
  showStorageWarning?: boolean;
}) {
  const key = lessonProgressKey(slug);
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const complete = progress[key] === true;
  const markCompleteAction = useRef<HTMLButtonElement>(null);
  const markIncompleteAction = useRef<HTMLButtonElement>(null);

  return (
    <section
      className={`${styles.completionPanel} ${styles.lessonAnchor}`}
      id="cursor-lesson-completion"
      aria-label={labels.progress}
      data-testid={`cursor-lesson-completion-${slug}`}
      tabIndex={-1}
    >
      <div>
        <strong aria-live="polite">{complete ? labels.completed : labels.markComplete}</strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable && showStorageWarning ? (
          <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
        ) : null}
      </div>
      <div className={styles.completionActions}>
        {complete ? (
          <>
            <button className={styles.completedAction} type="button" disabled data-course-action>
              {labels.markedComplete}
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              data-course-action
              ref={markIncompleteAction}
              onClick={async () => {
                await applyCursorProgressPatch({ remove: [key] });
                window.requestAnimationFrame(() => markCompleteAction.current?.focus());
              }}
            >
              {labels.markIncomplete}
            </button>
          </>
        ) : (
          <button
            className={styles.primaryAction}
            type="button"
            data-course-action
            ref={markCompleteAction}
            onClick={async () => {
              await applyCursorProgressPatch({ set: { [key]: true } });
              window.requestAnimationFrame(() => markIncompleteAction.current?.focus());
            }}
          >
            {labels.markComplete}
          </button>
        )}
      </div>
    </section>
  );
}
