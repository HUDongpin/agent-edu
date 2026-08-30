"use client";

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

  return (
    <section
      className={styles.completionPanel}
      aria-label={labels.progress}
      data-testid={`cursor-lesson-completion-${slug}`}
    >
      <div>
        <strong aria-live="polite">{complete ? labels.completed : labels.markComplete}</strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable && showStorageWarning ? (
          <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
        ) : null}
      </div>
      <button
        className={complete ? styles.completedAction : styles.primaryAction}
        type="button"
        aria-disabled={complete || undefined}
        onClick={() => {
          if (complete) return;
          void applyCursorProgressPatch({ set: { [key]: true } });
        }}
      >
        {complete ? labels.markedComplete : labels.markComplete}
      </button>
    </section>
  );
}
