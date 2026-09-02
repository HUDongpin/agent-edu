"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { GrokCourseCopy, GrokLessonSlug } from "@/lib/grok/types";
import { selectGrokJourney } from "./course-journey";
import {
  createGrokQuizAttemptConfig,
  parseGrokQuizAttempt,
  readGrokQuizAttemptSnapshot,
  subscribeToGrokQuizAttempt,
  type GrokQuizAttemptQuestion,
} from "./quiz-attempt-store";
import { repairGrokProgress, resetGrokProgress } from "./progress-store";
import useGrokProgress, {
  useGrokHydrated,
  useGrokStorageAvailable,
  useGrokStorageFailureReason,
} from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

type LessonLink = {
  readonly slug: GrokLessonSlug;
  readonly title: string;
  readonly href: string;
};

export default function CourseProgress({
  locale,
  lessons,
  quizQuestions,
  passingScore,
  labels,
  startLabel,
  resumeLabel,
  reviewLabel,
}: {
  locale: string;
  lessons: readonly LessonLink[];
  quizQuestions: readonly GrokQuizAttemptQuestion[];
  passingScore: number;
  labels: GrokCourseCopy["ui"];
  startLabel: string;
  resumeLabel: string;
  reviewLabel: string;
}) {
  const progress = useGrokProgress();
  const hydrated = useGrokHydrated();
  const storageAvailable = useGrokStorageAvailable();
  const storageFailureReason = useGrokStorageFailureReason();
  const [resetMessage, setResetMessage] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const twoDigitFormat = useMemo(() => new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }), [locale]);
  const attemptConfig = useMemo(
    () => createGrokQuizAttemptConfig(quizQuestions, passingScore),
    [passingScore, quizQuestions],
  );
  const attemptRaw = useSyncExternalStore(
    subscribeToGrokQuizAttempt,
    readGrokQuizAttemptSnapshot,
    () => null,
  );
  const attempt = useMemo(() => (
    attemptRaw ? parseGrokQuizAttempt(attemptRaw, attemptConfig) : null
  ), [attemptConfig, attemptRaw]);

  const state = useMemo(
    () => selectGrokJourney(progress, lessons, Boolean(attempt)),
    [attempt, lessons, progress],
  );
  const storageMessage = storageFailureReason === "corrupt"
    ? labels.storageCorrupt
    : storageFailureReason === "quota" ? labels.storageQuota : labels.storageUnavailable;

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="grok-progress-title"
      data-testid="grok-course-progress"
    >
      <div className={styles.progressHeading}>
        <div>
          <h2 id="grok-progress-title">{labels.courseProgress}</h2>
          <p>{labels.storageNote}</p>
        </div>
        <output aria-live="polite" className={styles.progressCount}>
          <strong>{numberFormat.format(state.completed)}</strong>
          <span>/ {numberFormat.format(state.total)} {labels.completed}</span>
        </output>
      </div>

      <ol
        className={styles.progressSegments}
        aria-label={labels.courseProgress}
        aria-describedby="grok-progress-milestone-legend"
      >
        {lessons.map((lesson, index) => {
          const complete = Boolean(progress.lessons[lesson.slug]);
          return (
            <li data-complete={complete || undefined} key={lesson.slug}>
              <Link
                href={lesson.href}
                aria-label={`${numberFormat.format(index + 1)}. ${lesson.title}, ${complete ? labels.milestoneComplete : labels.milestoneIncomplete}`}
              >
                {twoDigitFormat.format(index + 1)}
                {complete ? <span className={styles.progressCheck} aria-hidden="true">✓</span> : null}
              </Link>
            </li>
          );
        })}
        <li data-complete={progress.quizPassed || undefined} data-milestone="quiz">
          <a
            href="#grok-final-quiz"
            aria-label={`${labels.quizTitle}, ${progress.quizPassed ? labels.milestoneComplete : labels.milestoneIncomplete}`}
          >
            Q
            {progress.quizPassed ? <span className={styles.progressCheck} aria-hidden="true">✓</span> : null}
          </a>
        </li>
        <li data-complete={progress.capstoneReady || undefined} data-milestone="capstone">
          <Link
            href={lessons.find((lesson) => lesson.slug === "capstone")?.href ?? "#"}
            aria-label={`${labels.capstone}, ${progress.capstoneReady ? labels.milestoneComplete : labels.milestoneIncomplete}`}
          >
            C
            {progress.capstoneReady ? <span className={styles.progressCheck} aria-hidden="true">✓</span> : null}
          </Link>
        </li>
      </ol>
      <p
        id="grok-progress-milestone-legend"
        data-testid="grok-milestone-legend"
      >
        {labels.milestoneLegend}
      </p>

      {!storageAvailable ? (
        <div
          className={styles.storageWarning}
          data-storage-reason={storageFailureReason ?? "unavailable"}
          data-testid="grok-progress-storage-warning"
        >
          <p role="alert">{storageMessage}</p>
          {storageFailureReason === "corrupt" ? (
            <button
              className={styles.secondaryAction}
              type="button"
              data-testid="grok-repair-progress"
              onClick={() => {
                if (!window.confirm(labels.repairConfirm)) return;
                const result = repairGrokProgress();
                setResetMessage(result.persisted ? labels.repairSuccess : labels.repairFailed);
                window.requestAnimationFrame(() => statusRef.current?.focus());
              }}
            >
              {labels.repairProgress}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={styles.progressActions}>
        {state.nextHref ? (
          <Link
            className={styles.primaryAction}
            href={state.nextHref}
            data-testid="grok-progress-journey-action"
          >
            {attempt
              ? resumeLabel
              : state.complete ? reviewLabel : state.hasProgress ? resumeLabel : startLabel}
            <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
          </Link>
        ) : null}
        <button
          className={styles.secondaryAction}
          type="button"
          disabled={!hydrated || !state.hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            const ok = resetGrokProgress();
            setResetMessage(ok ? labels.resetSuccess : storageMessage);
            window.requestAnimationFrame(() => statusRef.current?.focus());
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p
        className={styles.srOnly}
        data-testid="grok-progress-repair-status"
        ref={statusRef}
        role="status"
        tabIndex={-1}
      >
        {resetMessage}
      </p>
    </section>
  );
}
