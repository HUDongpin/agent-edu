"use client";

import Link from "next/link";
import { useMemo } from "react";
import type {
  GithubLessonSlug,
  GithubLocale,
  GithubUiCopy,
} from "@/lib/github";
import base from "@/components/codex/CodexCourse.module.css";
import { githubLessonProgressKey } from "./progress-store";
import useGithubProgress from "./useGithubProgress";
import styles from "./CourseCurriculum.module.css";

export type CourseCurriculumLesson = {
  readonly slug: GithubLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly minutes: number;
  readonly href: string;
};

export type CourseCurriculumUnit = {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly lessons: readonly CourseCurriculumLesson[];
};

export type CourseCurriculumLabels = Pick<
  GithubUiCopy,
  "allLessons" | "completed" | "minutes"
>;

export type CourseCurriculumProps = {
  readonly locale: GithubLocale;
  readonly units: readonly CourseCurriculumUnit[];
  readonly labels: CourseCurriculumLabels;
};

export default function CourseCurriculum({
  locale,
  units,
  labels,
}: CourseCurriculumProps) {
  const progress = useGithubProgress();
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale],
  );

  return (
    <section
      className={base.curriculum}
      aria-labelledby="github-curriculum-title"
    >
      <header>
        <h2 id="github-curriculum-title">{labels.allLessons}</h2>
      </header>

      <div className={base.unitList}>
        {units.map((unit) => (
          <section
            className={base.unit}
            key={unit.id}
            aria-labelledby={`${unit.id}-github-title`}
          >
            <div className={base.unitHeading}>
              <span aria-hidden="true" dir="auto">
                {numberFormat.format(unit.order)}
              </span>
              <div>
                <h3 id={`${unit.id}-github-title`}>{unit.title}</h3>
                <p>{unit.summary}</p>
              </div>
            </div>
            <ol className={base.lessonList}>
              {unit.lessons.map((lesson) => {
                const complete =
                  progress[githubLessonProgressKey(lesson.slug)] === true;
                return (
                  <li key={lesson.slug}>
                    <Link
                      href={lesson.href}
                      data-completion-state={complete ? "complete" : "incomplete"}
                      aria-label={
                        complete
                          ? `${lesson.title}, ${labels.completed}`
                          : undefined
                      }
                    >
                      <span
                        className={`${base.lessonOrder} ${styles.functionalNumber}`}
                        dir="auto"
                      >
                        {numberFormat.format(lesson.order)}
                      </span>
                      <span className={base.lessonCopy}>
                        <strong className={styles.lessonTitle}>
                          <span className={styles.lessonTitleText}>
                            {lesson.title}
                          </span>
                          {complete ? (
                            <span
                              className={styles.completionIndicator}
                              data-completion-indicator
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          ) : null}
                        </strong>
                        <span>{lesson.summary}</span>
                      </span>
                      <span
                        className={`${base.lessonTime} ${styles.functionalNumber}`}
                        dir="auto"
                      >
                        {numberFormat.format(lesson.minutes)} {labels.minutes}
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
