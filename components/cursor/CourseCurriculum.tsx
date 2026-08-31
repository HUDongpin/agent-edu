"use client";

import Link from "next/link";
import type {
  CursorCourseCopy,
  CursorLessonSlug,
} from "@/lib/cursor";
import { lessonProgressKey } from "./progress-store";
import useCourseProgress from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

type CurriculumLesson = {
  readonly slug: CursorLessonSlug;
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

export default function CourseCurriculum({
  units,
  labels,
}: {
  units: readonly CurriculumUnit[];
  labels: CursorCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const lessons = units.flatMap((unit) => unit.lessons);
  const nextLesson = lessons.find((lesson) => progress[lessonProgressKey(lesson.slug)] !== true);

  return (
    <section
      className={styles.curriculum}
      aria-labelledby="cursor-curriculum-title"
      data-testid="cursor-course-curriculum"
    >
      <header>
        <h2 id="cursor-curriculum-title">{labels.allLessons}</h2>
      </header>

      <div className={styles.unitList}>
        {units.map((unit) => (
          <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
            <div className={styles.unitHeading}>
              <span aria-hidden="true">{unit.order}</span>
              <div>
                <h3 id={`${unit.id}-title`}>{unit.title}</h3>
                <p>{unit.summary}</p>
              </div>
            </div>
            <ol className={styles.lessonList}>
              {unit.lessons.map((lesson) => {
                const completed = progress[lessonProgressKey(lesson.slug)] === true;
                const state = completed
                  ? "completed"
                  : lesson.slug === nextLesson?.slug
                    ? "next"
                    : undefined;

                return (
                  <li key={lesson.slug}>
                    <Link href={lesson.href} data-progress-state={state}>
                      <span className={styles.lessonOrder}>{lesson.order}</span>
                      <span className={styles.lessonCopy}>
                        <strong>{lesson.title}</strong>
                        <span>{lesson.summary}</span>
                      </span>
                      <span className={styles.lessonAside}>
                        <span className={styles.lessonTime}>
                          {lesson.minutes} {labels.minutes}
                        </span>
                        {state ? (
                          <span className={styles.lessonStatus}>
                            <span aria-hidden="true">{state === "completed" ? "✓" : "→"}</span>
                            {state === "completed" ? labels.completed : labels.next}
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
