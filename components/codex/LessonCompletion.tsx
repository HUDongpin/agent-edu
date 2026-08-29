"use client";

import Link from "next/link";
import {
  CODEX_QUIZ_DRAFT_STORAGE_KEY,
} from "@/lib/codex/quiz-draft";
import { isCodexQuizPassed } from "@/lib/codex/quiz";
import type {
  CodexCourseCopy,
  CodexLessonSlug,
} from "@/lib/codex/types";
import {
  lessonProgressKey,
  updateCourseProgress,
} from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CodexCourse.module.css";

export default function LessonCompletion({
  slug,
  labels,
  completionLinks,
  showStorageWarning = true,
}: {
  slug: CodexLessonSlug;
  labels: CodexCourseCopy["ui"];
  completionLinks?: {
    readonly course: string;
    readonly quiz: string;
    readonly capstone: string;
  };
  showStorageWarning?: boolean;
}) {
  const key = lessonProgressKey(slug);
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const complete = progress[key] === true;
  const nextAction = complete && completionLinks
    ? progress["codex.capstone.v1"] !== true
      ? { href: completionLinks.capstone, label: labels.capstonePath }
      : !isCodexQuizPassed(progress)
        ? {
            href: completionLinks.quiz,
            label: progress[CODEX_QUIZ_DRAFT_STORAGE_KEY] ? labels.continueQuiz : labels.beginQuiz,
          }
        : { href: completionLinks.course, label: labels.backToCourse }
    : null;

  return (
    <section
      className={styles.completionPanel}
      aria-label={labels.progress}
      data-testid={`codex-lesson-completion-${slug}`}
    >
      <div>
        <strong aria-live="polite">{complete ? labels.completed : labels.markComplete}</strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable && showStorageWarning ? (
          <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
        ) : null}
      </div>
      <div className={styles.completionActions}>
        <button
          className={complete ? styles.completedAction : styles.primaryAction}
          type="button"
          onClick={() => {
            updateCourseProgress((progress) => {
              if (complete) delete progress[key];
              else progress[key] = true;
            });
          }}
        >
          {complete ? labels.markIncomplete : labels.markComplete}
        </button>
        {nextAction ? (
          <Link className={styles.secondaryAction} href={nextAction.href}>
            {nextAction.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
