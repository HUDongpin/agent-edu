"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  isClaudeCapstoneSelfAuditPassed,
  isClaudeQuizPassed,
  type ClaudeCourseCopy,
  type ClaudeLessonSlug,
} from "@/lib/claude";
import {
  lessonProgressKey,
  resetClaudeProgress,
} from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./ClaudeCourse.module.css";

type LessonLink = {
  readonly slug: ClaudeLessonSlug;
  readonly href: string;
};

export default function CourseProgress({
  lessons,
  labels,
  startLabel,
  resumeLabel,
}: {
  lessons: readonly LessonLink[];
  labels: ClaudeCourseCopy["ui"];
  startLabel: string;
  resumeLabel: string;
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [resetMessage, setResetMessage] = useState("");
  const resetStatus = useRef<HTMLParagraphElement>(null);

  const state = useMemo(() => {
    const record = progress;
    const completedLessons = lessons.filter((lesson) => record[lessonProgressKey(lesson.slug)] === true).length;
    const quizPassed = isClaudeQuizPassed(record);
    const capstonePassed = isClaudeCapstoneSelfAuditPassed(record);
    const completed = completedLessons + Number(quizPassed) + Number(capstonePassed);
    const total = lessons.length + 2;
    const incompleteLesson = lessons.find((lesson) => record[lessonProgressKey(lesson.slug)] !== true);
    const capstoneLesson = lessons.find((lesson) => lesson.slug === "portfolio-capstone");
    const nextAction = incompleteLesson
      ?? (!quizPassed ? { href: "#claude-final-quiz-title" }
        : !capstonePassed ? capstoneLesson
          : null);

    return {
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
      nextAction,
    };
  }, [lessons, progress]);

  const hasProgress = Object.keys(progress).some((key) => key.startsWith("claude."));

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="claude-course-progress-title"
      data-testid="claude-course-progress"
    >
      <div className={styles.progressHeading}>
        <div>
          <h2 id="claude-course-progress-title">{labels.courseProgress}</h2>
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
            {hasProgress ? resumeLabel : startLabel}
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
        ) : null}
        <button
          className={styles.secondaryAction}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            resetClaudeProgress();
            setResetMessage(labels.resetDone);
            window.requestAnimationFrame(() => resetStatus.current?.focus());
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p
        className={resetMessage ? styles.resetStatus : styles.srOnly}
        ref={resetStatus}
        role="status"
        tabIndex={-1}
      >
        {resetMessage}
      </p>
    </section>
  );
}
