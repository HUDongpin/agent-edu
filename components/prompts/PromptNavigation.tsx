"use client";

import Link from "next/link";
import { useState } from "react";
import type { PromptCourseCopy, PromptLessonSlug, PromptUnitId } from "@/lib/prompts";
import { promptPracticeKey } from "./progress-store";
import { usePromptProgress } from "./usePromptProgress";
import styles from "./PromptCourse.module.css";

type Labels = PromptCourseCopy["ui"];

export interface PromptNavigationLesson {
  readonly slug: PromptLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly minutes: number;
}

export interface PromptNavigationUnit {
  readonly id: PromptUnitId;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly lessons: readonly PromptNavigationLesson[];
}

function CompletionMark({ complete, label }: { complete: boolean; label: string }) {
  return (
    <span
      className={styles.lessonCompletion}
      data-complete={complete ? "true" : "false"}
      aria-label={complete ? label : undefined}
      aria-hidden={complete ? undefined : "true"}
    >
      {complete ? <span aria-hidden="true">✓</span> : null}
    </span>
  );
}

export function PromptCurriculum({
  units,
  locale,
  labels,
}: {
  units: readonly PromptNavigationUnit[];
  locale: string;
  labels: Labels;
}) {
  const { progress } = usePromptProgress();
  const hrefFor = (slug: PromptLessonSlug) => `/${locale}/prompts/${slug}/`;

  return (
    <div className={styles.unitList}>
      {units.map((unit) => (
        <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
          <div className={styles.unitHeading}>
            <span>{String(unit.order).padStart(2, "0")}</span>
            <div>
              <h3 id={`${unit.id}-title`}>{unit.title}</h3>
              <p>{unit.summary}</p>
            </div>
          </div>
          <ol className={styles.lessonList}>
            {unit.lessons.map((lesson) => {
              const complete = progress[promptPracticeKey(lesson.slug)] === true;
              return (
                <li key={lesson.slug}>
                  <Link href={hrefFor(lesson.slug)}>
                    <span className={styles.lessonOrder}>{String(lesson.order).padStart(2, "0")}</span>
                    <span className={styles.lessonCopy}>
                      <strong>{lesson.title}</strong>
                      <span>{lesson.summary}</span>
                    </span>
                    <span className={styles.lessonMeta}>
                      <CompletionMark complete={complete} label={labels.practiceComplete} />
                      <span className={styles.lessonTime}>{lesson.minutes} {labels.minutes}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function CourseMapList({
  lessons,
  locale,
  currentSlug,
  labels,
}: {
  lessons: readonly PromptNavigationLesson[];
  locale: string;
  currentSlug: PromptLessonSlug;
  labels: Labels;
}) {
  const { progress } = usePromptProgress();
  return (
    <ol className={styles.promptCourseMap}>
      {lessons.map((lesson) => {
        const complete = progress[promptPracticeKey(lesson.slug)] === true;
        return (
          <li key={lesson.slug}>
            <Link
              href={`/${locale}/prompts/${lesson.slug}/`}
              aria-current={lesson.slug === currentSlug ? "page" : undefined}
            >
              <span>{String(lesson.order).padStart(2, "0")}</span>
              <span>{lesson.title}</span>
              <CompletionMark complete={complete} label={labels.practiceComplete} />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function PromptLessonMap(props: {
  lessons: readonly PromptNavigationLesson[];
  locale: string;
  currentSlug: PromptLessonSlug;
  labels: Labels;
}) {
  return <CourseMapList {...props} />;
}

export function MobilePromptLessonMap(props: {
  lessons: readonly PromptNavigationLesson[];
  locale: string;
  currentSlug: PromptLessonSlug;
  currentOrder: number;
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={styles.mobileCourseMap}
      data-course-mobile-map
      onToggle={(event) => setOpen(event.currentTarget.open)}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (open && next instanceof Node && !event.currentTarget.contains(next)) {
          const disclosure = event.currentTarget;
          disclosure.open = false;
          setOpen(false);
          if (next instanceof HTMLElement) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => next.scrollIntoView({ block: "center" }));
            });
          }
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !event.currentTarget.open) return;
        event.preventDefault();
        event.currentTarget.open = false;
        setOpen(false);
        event.currentTarget.querySelector("summary")?.focus();
      }}
    >
      <summary>
        {props.labels.lesson} {props.currentOrder} / {props.lessons.length}: {open
          ? props.labels.closeCourseMap
          : props.labels.openCourseMap}
      </summary>
      <nav aria-label={props.labels.allLessons}>
        <CourseMapList {...props} />
      </nav>
    </details>
  );
}
