"use client";

import Link from "next/link";
import type { CodexIncomeLessonSlug } from "@/lib/make-money-with-codex";
import { selectIncomeJourney } from "./journey";
import useIncomeProgress from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

export default function CourseJourneyAction({
  lessons,
  courseHref,
  startLabel,
  locale,
}: {
  lessons: readonly { readonly slug: CodexIncomeLessonSlug; readonly href: string }[];
  courseHref: string;
  startLabel: string;
  locale: string;
}) {
  const progress = useIncomeProgress();
  const state = selectIncomeJourney(lessons, progress, courseHref);

  return (
    <>
      <Link
        className={styles.primaryButton}
        href={state.nextHref}
        lang={locale}
        dir={locale === "ar" ? "rtl" : "ltr"}
        data-course-journey-action
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
      <output className={styles.heroProgress} lang="en">
        {state.completed} / {state.total} milestones
      </output>
    </>
  );
}
