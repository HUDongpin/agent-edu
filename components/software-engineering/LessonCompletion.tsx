"use client";

import type {
  SoftwareEngineeringLessonSlug,
  SoftwareEngineeringLocaleCopy,
} from "@/lib/software-engineering";
import {
  softwareEngineeringLessonKey,
  updateSoftwareEngineeringProgress,
} from "./progress-store";
import useSoftwareEngineeringProgress, {
  useSoftwareEngineeringStorageAvailable,
} from "./useSoftwareEngineeringProgress";
import styles from "./SoftwareEngineeringCourse.module.css";

export default function LessonCompletion({
  slug,
  labels,
}: {
  slug: SoftwareEngineeringLessonSlug;
  labels: SoftwareEngineeringLocaleCopy["ui"];
}) {
  const progress = useSoftwareEngineeringProgress();
  const storageAvailable = useSoftwareEngineeringStorageAvailable();
  const key = softwareEngineeringLessonKey(slug);
  const complete = progress[key] === true;

  return (
    <section className={styles.completion} aria-label={labels.progress}>
      <div>
        <strong aria-live="polite">{complete ? labels.completed : labels.markComplete}</strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}
      </div>
      <button
        type="button"
        className={complete ? styles.completeButton : styles.primaryButton}
        disabled={complete}
        onClick={() => {
          if (complete) return;
          updateSoftwareEngineeringProgress((record) => { record[key] = true; });
        }}
      >
        {complete ? labels.completed : labels.markComplete}
      </button>
    </section>
  );
}
