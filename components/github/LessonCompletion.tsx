"use client";

import { useSyncExternalStore } from "react";
import type { GithubLessonSlug, GithubUiCopy } from "@/lib/github";
import {
  githubLessonProgressKey,
  updateCourseProgress,
} from "./progress-store";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import base from "@/components/codex/CodexCourse.module.css";

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
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const complete = progress[key] === true;

  return (
    <section
      className={base.completionPanel}
      aria-label={labels.progress}
      data-testid={`github-lesson-completion-${slug}`}
    >
      <div>
        <strong aria-live="polite">
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
        className={complete ? base.completedAction : base.primaryAction}
        type="button"
        disabled={!hydrated || complete}
        aria-disabled={!hydrated || complete || undefined}
        onClick={() => {
          if (complete) return;
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
