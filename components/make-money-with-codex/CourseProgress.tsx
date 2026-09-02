"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CodexIncomeLessonSlug } from "@/lib/make-money-with-codex";
import { selectIncomeJourney } from "./journey";
import { resetIncomeProgress } from "./progress-store";
import useIncomeProgress, { useIncomeHydrated, useIncomeStorageAvailable } from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

type LessonLink = { readonly slug: CodexIncomeLessonSlug; readonly title: string; readonly href: string };

export default function CourseProgress({
  lessons,
  locale,
  resetConfirm,
  startLabel,
}: {
  lessons: readonly LessonLink[];
  locale: string;
  resetConfirm: string;
  startLabel: string;
}) {
  const progress = useIncomeProgress();
  const hydrated = useIncomeHydrated();
  const storageAvailable = useIncomeStorageAvailable();
  const localizedDirection: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
  const [message, setMessage] = useState("");
  const courseHref = `/${locale}/make-money-with-codex/`;
  const state = useMemo(
    () => selectIncomeJourney(lessons, progress, courseHref),
    [courseHref, lessons, progress],
  );

  return (
    <section className={styles.progressPanel} aria-labelledby="income-progress-title" data-testid="income-course-progress">
      <div className={styles.progressHeader}>
        <div>
          <p className={styles.toolKicker} lang="en">Private browser progress</p>
          <h2 id="income-progress-title" lang="en">Your evidence path</h2>
        </div>
        <output role="status" aria-live="polite" aria-atomic="true" lang="en">
          <strong>{state.completed}</strong><span> / {state.total} milestones</span>
        </output>
      </div>
      <ol className={styles.progressSegments} aria-label="Course progress" lang="en">
        {lessons.map((lesson, index) => {
          const complete = progress.lessons[lesson.slug] === true;
          return (
            <li key={lesson.slug} data-complete={complete || undefined}>
              <Link
                href={lesson.href}
                aria-label={`${index + 1}. ${lesson.title}. ${complete ? "Complete" : "Not complete"}`}
                lang={locale}
                dir={localizedDirection}
              >
                {String(index + 1).padStart(2, "0")}
                <span className={styles.progressState} aria-hidden="true">{complete ? "✓" : ""}</span>
              </Link>
            </li>
          );
        })}
        <li data-complete={progress.capstoneReady || undefined}>
          <Link
            href={state.capstoneHref}
            aria-label={`Capstone. ${progress.capstoneReady ? "Complete" : "Not complete"}`}
            lang="en"
          >
            C<span className={styles.progressState} aria-hidden="true">{progress.capstoneReady ? "✓" : ""}</span>
          </Link>
        </li>
        <li data-complete={progress.quizPassed || undefined}>
          <a
            href="#income-knowledge-check"
            aria-label={`Final evidence check. ${progress.quizPassed ? "Complete" : "Not complete"}`}
            lang="en"
          >
            Q<span className={styles.progressState} aria-hidden="true">{progress.quizPassed ? "✓" : ""}</span>
          </a>
        </li>
      </ol>
      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status" lang="en">
          Browser storage is unavailable. All course content and tools still work. {" "}
          <Link href={`/${locale}/learning/`}>Open My Learning to inspect or reset local data.</Link>
        </p>
      ) : null}
      <div className={styles.progressActions}>
        <Link
          className={styles.primaryButton}
          href={state.nextHref}
          lang="en"
          onClick={() => {
            const target = new URL(state.nextHref, window.location.href);
            if (!target.hash || target.pathname !== window.location.pathname) return;
            window.requestAnimationFrame(() => {
              document.querySelector<HTMLElement>(target.hash)?.focus();
            });
          }}
        >
          {state.courseCompleted
            ? "Review course"
            : state.hasAnyProgress
              ? "Resume course"
              : startLabel}
          <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className={styles.secondaryButton}
          lang="en"
          disabled={!hydrated || !state.hasAnyProgress}
          onClick={() => {
            if (!window.confirm(resetConfirm)) return;
            const reset = resetIncomeProgress();
            setMessage(reset
              ? "Course 11 progress reset."
              : "Course 11 session progress reset, but browser storage could not be updated.");
          }}
        >
          Reset progress
        </button>
      </div>
      <p className={styles.srOnly} role="status" lang="en">{message}</p>
    </section>
  );
}
