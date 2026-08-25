"use client";

import type { GrokCourseCopy, GrokLessonSlug } from "@/lib/grok/types";
import { updateGrokProgress } from "./progress-store";
import useGrokProgress, { useGrokHydrated, useGrokStorageAvailable } from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

export default function LessonCompletion({
  slug,
  labels,
}: {
  slug: GrokLessonSlug;
  labels: GrokCourseCopy["ui"];
}) {
  const progress = useGrokProgress();
  const hydrated = useGrokHydrated();
  const storageAvailable = useGrokStorageAvailable();
  const complete = progress.lessons[slug] === true;

  return (
    <section
      className={styles.completionPanel}
      aria-label={labels.progress}
      data-testid={`grok-lesson-completion-${slug}`}
    >
      <div>
        <strong aria-live="polite">
          {complete ? labels.markedComplete : labels.markComplete}
        </strong>
        <p>{labels.storageNote}</p>
        {!storageAvailable ? (
          <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
        ) : null}
      </div>
      <button
        className={complete ? styles.completedAction : styles.primaryAction}
        type="button"
        disabled={!hydrated}
        aria-pressed={complete}
        onClick={() => updateGrokProgress((current) => ({
          ...current,
          lessons: complete
            ? Object.fromEntries(Object.entries(current.lessons).filter(([key]) => key !== slug))
            : { ...current.lessons, [slug]: true },
        }))}
      >
        {complete ? labels.markedComplete : labels.markComplete}
      </button>
    </section>
  );
}
