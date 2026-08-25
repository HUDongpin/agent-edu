"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CodexIncomeLessonSlug } from "@/lib/make-money-with-codex";
import { resetIncomeProgress } from "./progress-store";
import useIncomeProgress, { useIncomeHydrated, useIncomeStorageAvailable } from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

type LessonLink = { readonly slug: CodexIncomeLessonSlug; readonly title: string; readonly href: string };

export default function CourseProgress({
  lessons,
  locale,
}: {
  lessons: readonly LessonLink[];
  locale: string;
}) {
  const progress = useIncomeProgress();
  const hydrated = useIncomeHydrated();
  const storageAvailable = useIncomeStorageAvailable();
  const localizedDirection: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
  const [message, setMessage] = useState("");
  const state = useMemo(() => {
    const lessonCount = lessons.filter((lesson) => progress.lessons[lesson.slug]).length;
    const completed = lessonCount + Number(progress.quizPassed) + Number(progress.capstoneReady);
    const total = lessons.length + 2;
    const next = lessons.find((lesson) => !progress.lessons[lesson.slug]);
    return {
      completed,
      total,
      hasAnyProgress: lessonCount > 0
        || progress.quizBest > 0
        || progress.quizPassed
        || progress.capstoneChecks.some(Boolean)
        || progress.capstoneReady,
      nextHref: next?.href ?? (!progress.quizPassed
        ? "#income-knowledge-check"
        : lessons.at(-1)?.href ?? "#income-knowledge-check"),
    };
  }, [lessons, progress]);

  return (
    <section className={styles.progressPanel} aria-labelledby="income-progress-title" data-testid="income-course-progress">
      <div className={styles.progressHeader}>
        <div>
          <p className={styles.toolKicker} lang="en">Private browser progress</p>
          <h2 id="income-progress-title" lang="en">Your evidence path</h2>
        </div>
        <output aria-live="polite" lang="en"><strong>{state.completed}</strong><span> / {state.total} milestones</span></output>
      </div>
      <ol className={styles.progressSegments} aria-label="Course progress" lang="en">
        {lessons.map((lesson, index) => (
          <li key={lesson.slug} data-complete={progress.lessons[lesson.slug] || undefined}>
            <Link href={lesson.href} aria-label={`${index + 1}. ${lesson.title}`} lang={locale} dir={localizedDirection}>{String(index + 1).padStart(2, "0")}</Link>
          </li>
        ))}
        <li data-complete={progress.quizPassed || undefined}><a href="#income-knowledge-check" aria-label="Knowledge check" lang="en">Q</a></li>
        <li data-complete={progress.capstoneReady || undefined}><Link href={lessons.at(-1)?.href ?? "#"} aria-label="Capstone" lang="en">C</Link></li>
      </ol>
      {!storageAvailable ? <p className={styles.storageWarning} role="status" lang="en">Browser storage is unavailable. All course content and tools still work.</p> : null}
      <div className={styles.progressActions}>
        <Link className={styles.primaryButton} href={state.nextHref} lang="en">{state.completed ? "Resume course" : "Start the evidence path"}<span aria-hidden="true">→</span></Link>
        <button
          type="button"
          className={styles.secondaryButton}
          lang="en"
          disabled={!hydrated || !state.hasAnyProgress}
          onClick={() => {
            if (!window.confirm("Reset only Course 11 progress in this browser?")) return;
            const reset = resetIncomeProgress();
            setMessage(reset
              ? storageAvailable
                ? "Course 11 progress reset."
                : "In-memory Course 11 progress reset. Browser storage remains unavailable."
              : "Progress could not be reset.");
          }}
        >
          Reset progress
        </button>
      </div>
      <p className={styles.srOnly} role="status" lang="en">{message}</p>
    </section>
  );
}
