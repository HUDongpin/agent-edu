"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  CURSOR_PROGRESS_MILESTONES,
  cursorProgressCompletedMilestones,
  cursorProgressPercent,
  isCursorCapstoneProgressPassed,
  isCursorQuizPassed,
  type CursorCourseCopy,
  type CursorLessonSlug,
} from "@/lib/cursor";
import {
  lessonProgressKey,
  resetCursorProgress,
} from "./progress-store";
import {
  hasCursorAssessmentDrafts,
  subscribeToCursorAssessmentDrafts,
} from "./session-draft-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

type LessonLink = {
  readonly slug: CursorLessonSlug;
  readonly href: string;
  readonly title: string;
};

// Firefox persists a button's dynamic disabled state across reloads unless
// this browser-specific HTML attribute opts the control out of restoration.
const RESET_BUTTON_RELOAD_ATTRIBUTES = { autoComplete: "off" } as const;

export default function CourseProgress({
  lessons,
  labels,
  startLabel,
  resumeLabel,
  capstoneTitle,
}: {
  lessons: readonly LessonLink[];
  labels: CursorCourseCopy["ui"];
  startLabel: string;
  resumeLabel: string;
  capstoneTitle: string;
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const hasAssessmentDraft = useSyncExternalStore(
    subscribeToCursorAssessmentDrafts,
    hasCursorAssessmentDrafts,
    () => false,
  );
  const [resetMessage, setResetMessage] = useState("");
  const [resetNeedsRetry, setResetNeedsRetry] = useState(false);
  const resetStatus = useRef<HTMLParagraphElement>(null);

  const state = useMemo(() => {
    const record = progress;
    const quizPassed = isCursorQuizPassed(record);
    const capstonePassed = isCursorCapstoneProgressPassed(record);
    const completed = cursorProgressCompletedMilestones(record);
    const total = CURSOR_PROGRESS_MILESTONES;
    const incompleteLesson = lessons.find((lesson) => record[lessonProgressKey(lesson.slug)] !== true);
    const capstoneLesson = lessons.find((lesson) => lesson.slug === "workflow-capstone");
    const nextAction = incompleteLesson
      ?? (!quizPassed
        ? { href: "#cursor-final-quiz-title", title: labels.finalQuizTitle }
        : !capstonePassed && capstoneLesson
          ? {
              href: `${capstoneLesson.href}#cursor-capstone-title`,
              title: capstoneTitle,
            }
          : null);

    return {
      completed,
      total,
      percent: cursorProgressPercent(record),
      nextAction,
    };
  }, [capstoneTitle, labels.finalQuizTitle, lessons, progress]);

  const hasProgress = resetNeedsRetry
    || hasAssessmentDraft
    || Object.keys(progress).some((key) => key.startsWith("cursor."));

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="cursor-course-progress-title"
      data-testid="cursor-course-progress"
    >
      <div className={styles.progressHeading}>
        <div>
          <h2 id="cursor-course-progress-title">{labels.courseProgress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={styles.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>{labels.courseProgress}</span>
        </output>
      </div>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      <progress
        className={styles.progressBar}
        max={state.total}
        value={state.completed}
        aria-label={labels.courseProgress}
      />

      <div className={styles.progressActions}>
        {state.nextAction ? (
          <Link
            className={styles.primaryAction}
            href={state.nextAction.href}
            data-course-action
            onClick={(event) => {
              if (!state.nextAction?.href.startsWith("#")) return;
              const target = document.querySelector<HTMLElement>(state.nextAction.href);
              if (!target) return;
              event.preventDefault();
              window.history.pushState(null, "", state.nextAction.href);
              target.focus({ preventScroll: true });
              target.scrollIntoView({ block: "start" });
            }}
          >
            <span>{hasProgress ? resumeLabel : startLabel}</span>
            <span className={styles.actionDestination}>{state.nextAction.title}</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
        ) : null}
        <button
          className={styles.secondaryAction}
          type="button"
          {...RESET_BUTTON_RELOAD_ATTRIBUTES}
          data-course-action
          disabled={!hasProgress}
          onClick={async () => {
            if (!window.confirm(labels.resetConfirm)) return;
            const result = await resetCursorProgress();
            setResetNeedsRetry(!result.persisted);
            setResetMessage(result.persisted ? labels.resetDone : labels.resetFailed);
            window.requestAnimationFrame(() => resetStatus.current?.focus());
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p
        className={resetMessage ? styles.resetStatus : styles.srOnly}
        ref={resetStatus}
        role={resetNeedsRetry ? "alert" : "status"}
        tabIndex={-1}
      >
        {resetMessage}
      </p>
    </section>
  );
}
