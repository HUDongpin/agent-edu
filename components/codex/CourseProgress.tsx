"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  isCodexQuizPassed,
  type CodexCourseCopy,
  type CodexLessonSlug,
} from "@/lib/codex";
import {
  lessonProgressKey,
  resetCodexProgress,
} from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CodexCourse.module.css";

type LessonLink = {
  readonly slug: CodexLessonSlug;
  readonly href: string;
};

export default function CourseProgress({
  lessons,
  labels,
  startLabel,
  resumeLabel,
}: {
  lessons: readonly LessonLink[];
  labels: CodexCourseCopy["ui"];
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
    const quizPassed = isCodexQuizPassed(record);
    const capstonePassed = record["codex.capstone.v1"] === true;
    const completed = completedLessons + Number(quizPassed) + Number(capstonePassed);
    const total = lessons.length + 2;
    const incompleteLesson = lessons.find((lesson) => record[lessonProgressKey(lesson.slug)] !== true);
    const capstoneLesson = lessons.find((lesson) => lesson.slug === "automation-capstone");
    const nextAction = incompleteLesson
      ?? (!quizPassed ? { href: "#codex-final-quiz-title" }
        : !capstonePassed ? capstoneLesson
          : null);

    return {
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
      nextAction,
    };
  }, [lessons, progress]);

  const hasProgress = Object.keys(progress).some((key) => key.startsWith("codex."));

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="codex-course-progress-title"
      data-testid="codex-course-progress"
    >
      <div className={styles.progressHeading}>
        <div>
          <h2 id="codex-course-progress-title">{labels.courseProgress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={styles.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>{labels.courseProgress}</span>
        </output>
      </div>

      {!storageAvailable ? (
        <p className={styles.storageWarning}>{labels.storageUnavailable}</p>
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
            resetCodexProgress();
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
