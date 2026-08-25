"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GrokCourseCopy, GrokLessonSlug } from "@/lib/grok/types";
import { resetGrokProgress } from "./progress-store";
import useGrokProgress, { useGrokHydrated, useGrokStorageAvailable } from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

type LessonLink = {
  readonly slug: GrokLessonSlug;
  readonly title: string;
  readonly href: string;
};

export default function CourseProgress({
  locale,
  lessons,
  labels,
  startLabel,
  resumeLabel,
  reviewLabel,
}: {
  locale: string;
  lessons: readonly LessonLink[];
  labels: GrokCourseCopy["ui"];
  startLabel: string;
  resumeLabel: string;
  reviewLabel: string;
}) {
  const progress = useGrokProgress();
  const hydrated = useGrokHydrated();
  const storageAvailable = useGrokStorageAvailable();
  const [resetMessage, setResetMessage] = useState("");
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const twoDigitFormat = useMemo(() => new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }), [locale]);

  const state = useMemo(() => {
    const completeLessons = lessons.filter((lesson) => progress.lessons[lesson.slug]).length;
    const completed = completeLessons + Number(progress.quizPassed) + Number(progress.capstoneReady);
    const total = lessons.length + 2;
    const nextLesson = lessons.find((lesson) => !progress.lessons[lesson.slug]);
    const nextHref = nextLesson?.href
      ?? (!progress.quizPassed ? "#grok-final-quiz"
        : !progress.capstoneReady ? lessons.find((lesson) => lesson.slug === "capstone")?.href
          : undefined);
    return {
      completeLessons,
      completed,
      total,
      complete: completed === total,
      nextHref: nextHref ?? lessons[0]?.href,
    };
  }, [lessons, progress]);

  const hasProgress = Object.values(progress.lessons).some(Boolean)
    || progress.quizBest > 0
    || progress.quizPassed
    || progress.capstoneChecks.some(Boolean)
    || progress.capstoneReady;

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

      <ol className={styles.progressSegments} aria-label={labels.courseProgress}>
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
        <li data-complete={progress.quizPassed || undefined}>
          <a
            href="#grok-final-quiz"
            aria-label={`${labels.quizTitle}, ${progress.quizPassed ? labels.milestoneComplete : labels.milestoneIncomplete}`}
          >
            Q
            {progress.quizPassed ? <span className={styles.progressCheck} aria-hidden="true">✓</span> : null}
          </a>
        </li>
        <li data-complete={progress.capstoneReady || undefined}>
          <Link
            href={lessons.find((lesson) => lesson.slug === "capstone")?.href ?? "#"}
            aria-label={`${labels.capstone}, ${progress.capstoneReady ? labels.milestoneComplete : labels.milestoneIncomplete}`}
          >
            C
            {progress.capstoneReady ? <span className={styles.progressCheck} aria-hidden="true">✓</span> : null}
          </Link>
        </li>
      </ol>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      <div className={styles.progressActions}>
        {state.nextHref ? (
          <Link className={styles.primaryAction} href={state.nextHref} data-course-journey-action>
            {state.complete ? reviewLabel : hasProgress ? resumeLabel : startLabel}
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
        <button
          className={styles.secondaryAction}
          type="button"
          disabled={!hydrated || !hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            const ok = resetGrokProgress();
            setResetMessage(ok ? labels.resetProgress : labels.storageUnavailable);
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p className={styles.srOnly} role="status">{resetMessage}</p>
    </section>
  );
}
