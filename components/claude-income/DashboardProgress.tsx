"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { CLAUDE_INCOME_CAPSTONE } from "@/lib/claude-income/capstone";
import { CLAUDE_INCOME_FINAL_QUIZ } from "@/lib/claude-income/quiz";
import type { ClaudeIncomeLessonSlug } from "@/lib/claude-income/types";
import {
  CLAUDE_INCOME_PROGRESS_PREFIX,
  lessonCompletionKey,
  lessonVisitedKey,
  resetClaudeIncomeProgress,
} from "./progress-store";
import {
  useCourseHydrated,
  useCourseProgress,
  useCourseStorageAvailable,
} from "./useCourseProgress";
import { useClaudeIncomeQuizAttempt } from "./useQuizAttempt";
import styles from "./ClaudeIncomeCourse.module.css";

type LessonLink = {
  readonly slug: ClaudeIncomeLessonSlug;
  readonly title: string;
  readonly href: string;
};

export default function DashboardProgress({
  lessons,
  courseHref,
}: {
  lessons: readonly LessonLink[];
  courseHref: string;
}) {
  const progress = useCourseProgress();
  const hydrated = useCourseHydrated();
  const storageAvailable = useCourseStorageAvailable();
  const { draft: savedQuizAttempt } = useClaudeIncomeQuizAttempt();
  const [resetArmed, setResetArmed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const resetTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmResetRef = useRef<HTMLButtonElement>(null);
  const resetStatusRef = useRef<HTMLParagraphElement>(null);
  const completed = lessons.filter((lesson) => progress[lessonCompletionKey(lesson.slug)] === true);
  const quizPassed = progress[CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey]
      === CLAUDE_INCOME_FINAL_QUIZ.bankVersion
    && progress[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey] === true;
  const capstoneComplete = progress[CLAUDE_INCOME_CAPSTONE.passedStorageKey] === true;
  const completedMilestones = completed.length + Number(quizPassed) + Number(capstoneComplete);
  const totalMilestones = lessons.length + 2;
  const storedLast = progress[lessonVisitedKey()];
  const lastVisited = typeof storedLast === "string"
    ? lessons.find((lesson) => lesson.slug === storedLast)
    : undefined;
  const firstIncomplete = lessons.find(
    (lesson) => progress[lessonCompletionKey(lesson.slug)] !== true,
  );
  const resume = lastVisited && progress[lessonCompletionKey(lastVisited.slug)] !== true
    ? lastVisited
    : firstIncomplete ?? lessons[0];
  const percent = totalMilestones
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;
  const hasCourseProgress = Object.keys(progress).some(
    (key) => key.startsWith(CLAUDE_INCOME_PROGRESS_PREFIX),
  ) || Boolean(savedQuizAttempt);
  const nextAction = firstIncomplete
    ? {
        kind: "lesson" as const,
        href: resume.href,
        heading: completedMilestones
          ? `Resume lesson ${lessons.findIndex((item) => item.slug === resume.slug) + 1}`
          : "Begin with evidence",
        label: completedMilestones ? "Resume course" : "Start lesson 1",
      }
    : !quizPassed
      ? {
          kind: "quiz" as const,
          href: "#final-quiz",
          heading: "Final quiz is next",
          label: "Take final quiz",
        }
      : !capstoneComplete
        ? {
            kind: "capstone" as const,
            href: `${courseHref}capstone-seven-day-demand-test/`
              + "#claude-income-capstone-audit-title",
            heading: "Finish with the capstone",
            label: "Open capstone",
          }
        : {
            kind: "review" as const,
            href: lessons[0]?.href ?? courseHref,
            heading: "Course complete",
            label: "Review course",
          };

  function openResetConfirmation() {
    setResetArmed(true);
    window.requestAnimationFrame(() => confirmResetRef.current?.focus());
  }

  function cancelReset() {
    setResetArmed(false);
    window.requestAnimationFrame(() => resetTriggerRef.current?.focus());
  }

  function reset() {
    const result = resetClaudeIncomeProgress();
    setResetArmed(false);
    setAnnouncement(
      result.persisted
        ? "Course 12 progress was reset. Other course and site data was preserved."
        : result.progressPersisted && !result.attemptPersisted
          ? "Course 12 results were reset, but the saved quiz attempt could not be cleared. Retry reset before leaving this page."
          : !result.progressPersisted && result.attemptPersisted
            ? "Course 12 session progress was reset. Browser storage is unavailable."
            : "Course 12 reset could not be fully saved. Retry before leaving this page.",
    );
    window.requestAnimationFrame(() => resetStatusRef.current?.focus());
  }

  function focusQuiz(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.querySelector<HTMLElement>("#final-quiz");
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", "#final-quiz");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }

  if (!hydrated) {
    return (
      <section
        className={styles.progressPanel}
        aria-labelledby="claude-income-progress-title"
        aria-busy="true"
        data-client-ready="false"
      >
        <div className={styles.progressCopy}>
          <p className={styles.eyebrow}>Your course record</p>
          <h2 id="claude-income-progress-title">Loading course record…</h2>
          <p>Saved progress is checked privately in this browser.</p>
        </div>
        <div className={styles.progressMeter}>
          <progress
            className={styles.progressBar}
            aria-label="Loading Course 12 progress"
            max={totalMilestones}
          />
          <span className={styles.progressValue} aria-hidden="true">—</span>
        </div>
        <noscript>
          <p className={styles.noScriptNotice}>
            Saved progress needs JavaScript. Every lesson remains available from the curriculum below.
          </p>
        </noscript>
      </section>
    );
  }

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="claude-income-progress-title"
      aria-busy="false"
      data-client-ready="true"
    >
      <div className={styles.progressCopy}>
        <p className={styles.eyebrow}>Your course record</p>
        <h2 id="claude-income-progress-title">{nextAction.heading}</h2>
        <p>{completedMilestones} of {totalMilestones} milestones complete</p>
        <p>{completed.length} of {lessons.length} lessons marked complete</p>
      </div>

      <div className={styles.progressMeter}>
        <progress
          className={styles.progressBar}
          aria-label="Course 12 progress"
          max={totalMilestones}
          value={completedMilestones}
        />
        <span className={styles.progressValue}>{percent}%</span>
      </div>

      <div className={styles.progressActions}>
        <Link
          className={styles.primaryAction}
          href={nextAction.href}
          data-course-journey-action
          onClick={nextAction.kind === "quiz" ? focusQuiz : undefined}
        >
          {nextAction.label}
          <span aria-hidden="true">→</span>
        </Link>
        {hasCourseProgress && !resetArmed ? (
          <button
            ref={resetTriggerRef}
            className={styles.textButton}
            type="button"
            onClick={openResetConfirmation}
          >
            Reset Course 12 progress
          </button>
        ) : null}
        {hasCourseProgress && resetArmed ? (
          <div
            id="claude-income-reset-confirmation"
            className={styles.resetConfirm}
            role="group"
            aria-label="Confirm Course 12 progress reset"
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              cancelReset();
            }}
          >
            <span>Reset only Course 12 progress?</span>
            <button
              ref={confirmResetRef}
              className={styles.dangerButton}
              type="button"
              onClick={reset}
            >
              Confirm reset
            </button>
            <button className={styles.textButton} type="button" onClick={cancelReset}>Cancel</button>
          </div>
        ) : null}
      </div>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">
          Browser storage is unavailable. Progress will last only for this open session.
        </p>
      ) : null}
      <p
        ref={resetStatusRef}
        className={announcement ? styles.resetStatus : styles.srOnly}
        role="status"
        aria-live="polite"
        tabIndex={-1}
      >
        {announcement}
      </p>
    </section>
  );
}
