"use client";

import { useEffect } from "react";
import type { ClaudeIncomeLessonSlug } from "@/lib/claude-income";
import {
  lessonCompletionKey,
  lessonVisitedKey,
  updateProgress,
} from "./progress-store";
import { useCourseProgress, useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./ClaudeIncomeCourse.module.css";

export default function LessonCompletion({ slug }: { slug: ClaudeIncomeLessonSlug }) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const key = lessonCompletionKey(slug);
  const completed = progress[key] === true;

  useEffect(() => {
    updateProgress((record) => {
      record[lessonVisitedKey()] = slug;
    });
  }, [slug]);

  return (
    <section className={styles.completionCard} aria-labelledby="lesson-completion-title">
      <div>
        <p className={styles.eyebrow}>Lesson record</p>
        <h2 id="lesson-completion-title">Mark this lesson complete</h2>
        <p>Complete the practice and quality gate before recording completion.</p>
      </div>
      <label className={styles.completionToggle}>
        <input
          type="checkbox"
          checked={completed}
          onChange={(event) => {
            const checked = event.target.checked;
            updateProgress((record) => {
              if (checked) record[key] = true;
              else delete record[key];
              record[lessonVisitedKey()] = slug;
            });
          }}
        />
        <span>{completed ? "Completed" : "Not yet complete"}</span>
      </label>
      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">
          This completion is available only in the current browser session.
        </p>
      ) : null}
    </section>
  );
}
