"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatCodexVisibleInteger } from "@/lib/codex/format";
import type {
  CodexCourseCopy,
  CodexLessonSlug,
  CodexLocale,
} from "@/lib/codex/types";
import TechnicalText from "./TechnicalText";
import useCodexLessonStates from "./useCodexLessonStates";
import styles from "./CodexCourse.module.css";

type CurriculumLesson = {
  readonly slug: CodexLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly minutes: number;
  readonly href: string;
};

type CurriculumUnit = {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly lessons: readonly CurriculumLesson[];
};

type CurriculumLabels = Pick<
  CodexCourseCopy["ui"],
  "allLessons" | "completedLesson" | "minutes" | "recommendedNextLesson"
>;

export default function CourseCurriculum({
  units,
  locale,
  labels,
}: {
  readonly units: readonly CurriculumUnit[];
  readonly locale: CodexLocale;
  readonly labels: CurriculumLabels;
}) {
  const lessons = useMemo(() => units.flatMap((unit) => unit.lessons), [units]);
  const lessonSlugs = useMemo(() => lessons.map((lesson) => lesson.slug), [lessons]);
  const { completed, recommendedSlug } = useCodexLessonStates(lessonSlugs);

  return (
    <section className={styles.curriculum} aria-labelledby="codex-curriculum-title">
      <header>
        <h2 id="codex-curriculum-title">{labels.allLessons}</h2>
      </header>
      <div className={styles.unitList}>
        {units.map((unit) => (
          <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
            <div className={styles.unitHeading}>
              <span aria-hidden="true">{formatCodexVisibleInteger(unit.order, locale)}</span>
              <div>
                <h3 id={`${unit.id}-title`}><TechnicalText text={unit.title} /></h3>
                <p><TechnicalText text={unit.summary} /></p>
              </div>
            </div>
            <ol className={styles.lessonList} role="list">
              {unit.lessons.map((lesson) => {
                const complete = completed.has(lesson.slug);
                const recommended = !complete && lesson.slug === recommendedSlug;
                const state = complete ? "completed" : recommended ? "next" : "remaining";
                return (
                  <li key={lesson.slug} data-state={state}>
                    <Link href={lesson.href}>
                      <span className={styles.lessonOrder} aria-hidden="true">
                        {complete ? "✓" : formatCodexVisibleInteger(lesson.order, locale)}
                      </span>
                      <span className={styles.lessonCopy}>
                        <strong><TechnicalText text={lesson.title} /></strong>
                        <span><TechnicalText text={lesson.summary} /></span>
                      </span>
                      <span className={styles.lessonListMeta}>
                        <span className={styles.lessonTime}>
                          {formatCodexVisibleInteger(lesson.minutes, locale)} {labels.minutes}
                        </span>
                        {complete || recommended ? (
                          <span className={styles.lessonState} data-state={state}>
                            {complete ? labels.completedLesson : labels.recommendedNextLesson}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
