"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  isGithubQuizPassed,
  type GithubLessonSlug,
  type GithubUiCopy,
} from "@/lib/github";
import {
  GITHUB_CAPSTONE_STORAGE_KEY,
  githubLessonProgressKey,
  hasGithubCourseProgress,
  resetGithubProgress,
} from "./progress-store";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import { useI18n } from "../I18nProvider";
import base from "@/components/codex/CodexCourse.module.css";

type LessonLink = {
  readonly slug: GithubLessonSlug;
  readonly href: string;
};

export default function CourseProgress({
  lessons,
  labels,
  startLabel,
  resumeLabel,
}: {
  lessons: readonly LessonLink[];
  labels: GithubUiCopy;
  startLabel: string;
  resumeLabel: string;
}) {
  const { t } = useI18n();
  const progress = useGithubProgress();
  const storageAvailable = useGithubStorageAvailable();
  const [resetMessage, setResetMessage] = useState("");
  const resetStatus = useRef<HTMLParagraphElement>(null);

  const state = useMemo(() => {
    const completedLessons = lessons.filter(
      (lesson) => progress[githubLessonProgressKey(lesson.slug)] === true,
    ).length;
    const quizPassed = isGithubQuizPassed(progress);
    const capstonePassed = progress[GITHUB_CAPSTONE_STORAGE_KEY] === true;
    const completed =
      completedLessons + Number(quizPassed) + Number(capstonePassed);
    const total = lessons.length + 2;
    const incompleteLesson = lessons.find(
      (lesson) => progress[githubLessonProgressKey(lesson.slug)] !== true,
    );
    const capstoneLesson = lessons.find(
      (lesson) => lesson.slug === "teaching-capstone",
    );
    const courseCompleted = completed === total;
    const nextAction = courseCompleted
      ? lessons[0] ?? null
      : incompleteLesson ??
        (!quizPassed
          ? { href: "#github-final-quiz-title" }
          : capstoneLesson ?? null);

    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
      courseCompleted,
      nextAction,
    };
  }, [lessons, progress]);

  const hasProgress = hasGithubCourseProgress(progress);

  return (
    <section
      className={base.progressPanel}
      aria-labelledby="github-course-progress-title"
      data-testid="github-course-progress"
    >
      <div className={base.progressHeading}>
        <div>
          <h2 id="github-course-progress-title">{labels.courseProgress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={base.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>
            {state.completed}/{state.total}
          </span>
        </output>
      </div>

      {!storageAvailable ? (
        <p className={base.storageWarning}>{labels.storageUnavailable}</p>
      ) : null}

      <progress
        className={base.progressBar}
        max={state.total}
        value={state.completed}
        aria-label={labels.courseProgress}
      />

      <div className={base.progressActions}>
        {state.nextAction ? (
          <Link
            className={base.primaryAction}
            href={state.nextAction.href}
            data-course-journey-action
            onClick={(event) => {
              if (!state.nextAction?.href.startsWith("#")) return;
              const target = document.querySelector<HTMLElement>(
                state.nextAction.href,
              );
              if (!target) return;
              event.preventDefault();
              window.history.pushState(null, "", state.nextAction.href);
              target.focus({ preventScroll: true });
              target.scrollIntoView({ block: "start" });
            }}
          >
            {state.courseCompleted ? t("cat.review") : hasProgress ? resumeLabel : startLabel}
            <span className={base.arrow} aria-hidden="true">
              →
            </span>
          </Link>
        ) : null}
        <button
          className={base.secondaryAction}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            resetGithubProgress();
            setResetMessage(labels.resetDone);
            window.requestAnimationFrame(() => resetStatus.current?.focus());
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p
        className={resetMessage ? base.resetStatus : base.srOnly}
        ref={resetStatus}
        role="status"
        tabIndex={-1}
      >
        {resetMessage}
      </p>
    </section>
  );
}
