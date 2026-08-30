"use client";

import Link from "next/link";
import type { SyntheticEvent } from "react";
import type { CodexIncomeLessonSlug } from "@/lib/make-money-with-codex";
import useIncomeProgress, { useIncomeHydrated } from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

type OutlineLesson = {
  readonly slug: CodexIncomeLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly href: string;
};

export default function CourseOutline({
  courseHref,
  lessons,
  currentSlug,
  currentUnitTitle,
  locale,
  labels,
}: {
  courseHref: string;
  lessons: readonly OutlineLesson[];
  currentSlug: CodexIncomeLessonSlug;
  currentUnitTitle: string;
  locale: string;
  labels: {
    readonly course: string;
    readonly lesson: string;
    readonly courseOutline: string;
  };
}) {
  const progress = useIncomeProgress();
  const hydrated = useIncomeHydrated();
  const current = lessons.find((lesson) => lesson.slug === currentSlug)!;
  const localizedDirection: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
  const localizedText = { lang: locale, dir: localizedDirection };
  const outlineLabel = `${labels.courseOutline}: ${labels.course} 11`;

  function revealCurrentLesson(event: SyntheticEvent<HTMLDetailsElement>) {
    const details = event.currentTarget;
    if (!details.open) return;
    window.requestAnimationFrame(() => {
      const nav = details.querySelector<HTMLElement>("nav");
      const active = details.querySelector<HTMLElement>("li[data-current]");
      if (!nav || !active) return;
      nav.scrollTop += active.getBoundingClientRect().top - nav.getBoundingClientRect().top - 6;
    });
  }

  const lessonLinks = lessons.map((lesson) => {
    const complete = hydrated && progress.lessons[lesson.slug] === true;
    return (
      <li
        key={lesson.slug}
        data-current={lesson.slug === currentSlug || undefined}
        data-complete={complete || undefined}
      >
        <Link
          href={lesson.href}
          aria-current={lesson.slug === currentSlug ? "page" : undefined}
        >
          <span className={styles.outlineNumber}>{String(lesson.order).padStart(2, "0")}</span>
          <span>{lesson.title}</span>
          <span className={styles.outlineState} aria-hidden="true">{complete ? "✓" : ""}</span>
          <span className={styles.srOnly} lang="en">{complete ? "Complete" : "Not complete"}</span>
        </Link>
      </li>
    );
  });

  return (
    <>
      <nav
        className={styles.lessonRail}
        aria-label={outlineLabel}
        data-course-desktop-outline
        {...localizedText}
      >
        <Link className={styles.railCourseLink} href={courseHref}>{labels.course} 11</Link>
        <p>{currentUnitTitle}</p>
        <ol>{lessonLinks}</ol>
      </nav>

      <details
        className={styles.mobileLessonOutline}
        data-course-mobile-outline
        onToggle={revealCurrentLesson}
        {...localizedText}
      >
        <summary>
          <span className={styles.mobileOutlineMeta}>
            {labels.course} 11 · {labels.lesson} {current.order} / {lessons.length}
          </span>
          <strong>{current.title}</strong>
          <span className={styles.mobileOutlineAction}>{labels.courseOutline}</span>
        </summary>
        <nav className={styles.mobileLessonNav} aria-label={outlineLabel}>
          <Link className={styles.mobileCourseLink} href={courseHref}>
            {labels.course} 11 · {currentUnitTitle}
          </Link>
          <ol>{lessonLinks}</ol>
        </nav>
      </details>
    </>
  );
}
