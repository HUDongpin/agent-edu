"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CODEX_CAPSTONE_DRAFT_STORAGE_KEY,
} from "@/lib/codex/capstone-draft";
import { CODEX_QUIZ_DRAFT_STORAGE_KEY } from "@/lib/codex/quiz-draft";
import {
  formatCodexTemplate,
  formatCodexVisiblePercent,
} from "@/lib/codex/format";
import { isCodexQuizPassed } from "@/lib/codex/quiz";
import type {
  CodexCourseCopy,
  CodexLessonSlug,
  CodexLocale,
} from "@/lib/codex/types";
import {
  CODEX_PROGRESS_RESET_EVENT,
  lessonProgressKey,
  resetCodexProgress,
} from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CodexCourse.module.css";

type LessonLink = {
  readonly slug: CodexLessonSlug;
  readonly href: string;
};

function hasStoredCapstoneDraft(): boolean {
  try {
    return window.sessionStorage.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export default function CourseProgress({
  lessons,
  labels,
  locale,
  startLabel,
  resumeLabel,
}: {
  lessons: readonly LessonLink[];
  labels: CodexCourseCopy["ui"];
  locale: CodexLocale;
  startLabel: string;
  resumeLabel: string;
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [resetMessage, setResetMessage] = useState("");
  const [resetPersisted, setResetPersisted] = useState<boolean | null>(null);
  const [resetFingerprint, setResetFingerprint] = useState<string | null>(null);
  const [hasCapstoneDraft, setHasCapstoneDraft] = useState(false);
  const resetStatus = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const readCapstoneDraft = () => {
      setHasCapstoneDraft(hasStoredCapstoneDraft());
    };
    readCapstoneDraft();
    window.addEventListener(CODEX_PROGRESS_RESET_EVENT, readCapstoneDraft);
    return () => window.removeEventListener(CODEX_PROGRESS_RESET_EVENT, readCapstoneDraft);
  }, []);

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
      ? { ...incompleteLesson, kind: "lesson" as const }
      : !quizPassed ? { href: "#codex-final-quiz-title", kind: "quiz" as const }
        : !capstonePassed && capstoneLesson ? { ...capstoneLesson, kind: "capstone" as const }
          : null;

    return {
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
      nextAction,
    };
  }, [lessons, progress]);

  const hasProgress = hasCapstoneDraft
    || Object.keys(progress).some((key) => key.startsWith("codex."));
  const currentFingerprint = `${JSON.stringify(progress)}|${Number(hasCapstoneDraft)}`;
  const visibleResetMessage = resetFingerprint === currentFingerprint
    ? resetMessage
    : "";
  const formattedPercent = formatCodexVisiblePercent(state.percent, locale);
  const nextLabel = state.nextAction?.kind === "quiz"
    ? progress[CODEX_QUIZ_DRAFT_STORAGE_KEY] ? labels.continueQuiz : labels.beginQuiz
    : state.nextAction?.kind === "capstone"
      ? labels.capstonePath
      : hasProgress ? resumeLabel : startLabel;

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
        <output
          className={styles.progressValue}
          aria-label={formatCodexTemplate(labels.completionPercentTemplate, { percent: formattedPercent })}
          aria-live="polite"
        >
          <strong>{formattedPercent}</strong>
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
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              const target = document.querySelector<HTMLElement>(state.nextAction.href);
              if (!target) return;
              event.preventDefault();
              window.history.pushState(null, "", state.nextAction.href);
              target.focus({ preventScroll: true });
              target.scrollIntoView({ block: "start" });
            }}
          >
            {nextLabel}
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
        ) : null}
        <button
          className={styles.secondaryAction}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            const reset = resetCodexProgress();
            const capstoneDraftRemaining = hasStoredCapstoneDraft();
            setHasCapstoneDraft(capstoneDraftRemaining);
            setResetFingerprint(
              `${JSON.stringify(reset.progress)}|${Number(capstoneDraftRemaining)}`,
            );
            setResetPersisted(reset.persisted);
            setResetMessage(reset.persisted ? labels.resetDone : labels.resetSessionOnly);
            window.requestAnimationFrame(() => resetStatus.current?.focus());
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p
        className={visibleResetMessage
          ? resetPersisted ? styles.resetStatus : styles.storageWarning
          : styles.srOnly}
        ref={resetStatus}
        role="status"
        tabIndex={-1}
      >
        {visibleResetMessage}
      </p>
    </section>
  );
}
