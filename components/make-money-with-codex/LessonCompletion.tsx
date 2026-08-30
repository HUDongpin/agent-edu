"use client";

import type { CodexIncomeLessonSlug } from "@/lib/make-money-with-codex";
import { setIncomeLesson } from "./progress-store";
import useIncomeProgress, { useIncomeHydrated, useIncomeStorageAvailable } from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

export default function LessonCompletion({ slug }: { slug: CodexIncomeLessonSlug }) {
  const progress = useIncomeProgress();
  const hydrated = useIncomeHydrated();
  const storageAvailable = useIncomeStorageAvailable();
  const complete = progress.lessons[slug] === true;

  return (
    <section className={styles.completionPanel} aria-label="Lesson progress" data-testid={`income-completion-${slug}`}>
      <div>
        <strong aria-live="polite">{complete ? "Lesson complete" : "Complete the practice and evidence check"}</strong>
        <p>Progress stays in this browser and is never uploaded by the course.</p>
        {!storageAvailable ? <p className={styles.storageWarning} role="status">Browser storage is unavailable. The lesson remains fully usable.</p> : null}
      </div>
      <button
        type="button"
        className={complete ? styles.completedButton : styles.primaryButton}
        disabled={!hydrated}
        aria-pressed={complete}
        onClick={() => setIncomeLesson(slug, !complete)}
      >
        {complete ? "Marked complete" : "Mark lesson complete"}
      </button>
    </section>
  );
}
