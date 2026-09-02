"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import {
  formatCodexTemplate,
  formatCodexVisibleInteger,
} from "@/lib/codex/format";
import type {
  CodexCourseCopy,
  CodexLessonSlug,
  CodexLocale,
} from "@/lib/codex/types";
import TechnicalText from "./TechnicalText";
import useCodexLessonStates from "./useCodexLessonStates";
import styles from "./CodexCourse.module.css";

type OutlineLesson = {
  readonly slug: CodexLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly href: string;
};

type OutlineUnit = {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly OutlineLesson[];
};

type OutlineLabels = Pick<
  CodexCourseCopy["ui"],
  | "allLessons"
  | "completedLesson"
  | "courseOutlineSummaryTemplate"
  | "currentLesson"
  | "recommendedNextLesson"
>;

function keepActiveLessonVisible(container: HTMLElement | null) {
  if (!container) return;
  const active = container.querySelector<HTMLElement>('a[aria-current="page"]');
  if (!active) return;
  const containerRect = container.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  if (activeRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - activeRect.top;
  } else if (activeRect.bottom > containerRect.bottom) {
    container.scrollTop += activeRect.bottom - containerRect.bottom;
  }
}

export default function CourseOutline({
  units,
  activeSlug,
  locale,
  labels,
}: {
  readonly units: readonly OutlineUnit[];
  readonly activeSlug: CodexLessonSlug;
  readonly locale: CodexLocale;
  readonly labels: OutlineLabels;
}) {
  const desktopRail = useRef<HTMLElement>(null);
  const mobileRail = useRef<HTMLDivElement>(null);
  const lessons = useMemo(() => units.flatMap((unit) => unit.lessons), [units]);
  const lessonSlugs = useMemo(() => lessons.map((lesson) => lesson.slug), [lessons]);
  const { completed, recommendedSlug } = useCodexLessonStates(lessonSlugs);
  const active = lessons.find((lesson) => lesson.slug === activeSlug)!;

  useEffect(() => {
    keepActiveLessonVisible(desktopRail.current);
  }, [activeSlug]);

  const renderLinks = () => units.map((unit) => (
    <div className={styles.railUnit} key={unit.id}>
      <p className={styles.railGroup}><TechnicalText text={unit.title} /></p>
      <ol role="list">
        {unit.lessons.map((lesson) => {
          const current = lesson.slug === activeSlug;
          const complete = completed.has(lesson.slug);
          const recommended = !current && !complete && lesson.slug === recommendedSlug;
          const state = current ? "current" : complete ? "completed" : recommended ? "next" : "remaining";
          return (
            <li key={lesson.slug}>
              <Link
                href={lesson.href}
                aria-current={current ? "page" : undefined}
                data-state={state}
                data-complete={complete || undefined}
              >
                <span className={styles.railOrder}>
                  {complete ? <span aria-hidden="true">✓</span> : formatCodexVisibleInteger(lesson.order, locale)}
                </span>
                <span className={styles.railLessonTitle}>
                  <TechnicalText text={lesson.title} />
                  <span className={styles.srOnly}>
                    {current ? ` ${labels.currentLesson}` : ""}
                    {complete ? ` ${labels.completedLesson}` : ""}
                    {recommended ? ` ${labels.recommendedNextLesson}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  ));

  const summary = formatCodexTemplate(labels.courseOutlineSummaryTemplate, {
    current: formatCodexVisibleInteger(active.order, locale),
    total: formatCodexVisibleInteger(lessons.length, locale),
    title: active.title,
  });

  return (
    <>
      <aside className={styles.lessonRail} ref={desktopRail}>
        <nav aria-label={labels.allLessons}>
          <strong>{labels.allLessons}</strong>
          {renderLinks()}
        </nav>
      </aside>
      <details
        className={styles.lessonRailMobile}
        onToggle={(event) => {
          if (!event.currentTarget.open) return;
          window.requestAnimationFrame(() => keepActiveLessonVisible(mobileRail.current));
        }}
      >
        <summary>
          <span>{labels.allLessons}</span>
          <strong><TechnicalText text={summary} /></strong>
          <span className={styles.outlineChevron} aria-hidden="true" />
        </summary>
        <div className={styles.lessonRailMobileScroll} ref={mobileRail}>
          <nav aria-label={labels.allLessons}>{renderLinks()}</nav>
        </div>
      </details>
    </>
  );
}
