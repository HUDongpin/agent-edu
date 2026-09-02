"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { GithubLessonSlug, GithubUiCopy } from "@/lib/github";
import {
  githubLessonProgressKey,
  updateCourseProgress,
} from "./progress-store";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import base from "./GithubCourseFoundation.module.css";
import styles from "./GithubCourse.module.css";

const subscribeToHydration = (listener: () => void) => {
  queueMicrotask(listener);
  return () => undefined;
};

export default function LessonCompletion({
  slug,
  labels,
}: {
  slug: GithubLessonSlug;
  labels: GithubUiCopy;
}) {
  const key = githubLessonProgressKey(slug);
  const progress = useGithubProgress();
  const storageAvailable = useGithubStorageAvailable();
  const completionStatus = useRef<HTMLElement>(null);
  const focusAfterCompletion = useRef(false);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const complete = progress[key] === true;

  useEffect(() => {
    if (!complete || !focusAfterCompletion.current) return;
    focusAfterCompletion.current = false;
    const frame = window.requestAnimationFrame(() => completionStatus.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [complete]);

  return (
    <section
      className={base.completionPanel}
      aria-label={labels.progress}
      data-testid={`github-lesson-completion-${slug}`}
    >
      <div>
        <strong
          aria-live="polite"
          className={styles.focusTarget}
          ref={completionStatus}
          tabIndex={-1}
        >
          {complete ? labels.completed : labels.markComplete}
        </strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable ? (
          <p className={base.storageWarning} role="status">
            {labels.storageUnavailable}
          </p>
        ) : null}
      </div>
      <button
        className={`${complete ? base.completedAction : base.primaryAction} ${styles.courseAction}`}
        type="button"
        disabled={!hydrated || complete}
        aria-disabled={!hydrated || complete || undefined}
        onClick={() => {
          if (complete) return;
          focusAfterCompletion.current = true;
          updateCourseProgress((record) => {
            record[key] = true;
          });
        }}
      >
        {complete ? labels.markedComplete : labels.markComplete}
      </button>
    </section>
  );
}
