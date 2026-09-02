"use client";

import Link from "next/link";
import type {
  GrokCourseCopy,
  GrokLessonSlug,
  GrokUnitId,
} from "@/lib/grok/types";
import useGrokProgress from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

type CourseMapLesson = {
  readonly slug: GrokLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly href: string;
};

type CourseMapUnit = {
  readonly id: GrokUnitId;
  readonly title: string;
  readonly lessons: readonly CourseMapLesson[];
};

export default function LessonCourseMap({
  locale,
  units,
  currentSlug,
  labels,
}: {
  locale: string;
  units: readonly CourseMapUnit[];
  currentSlug: GrokLessonSlug;
  labels: GrokCourseCopy["ui"];
}) {
  const progress = useGrokProgress();
  const lessons = units.flatMap((unit) => unit.lessons);
  const currentLesson = lessons.find((item) => item.slug === currentSlug);
  const currentUnit = units.find((unit) =>
    unit.lessons.some((item) => item.slug === currentSlug),
  );
  const numberFormat = new Intl.NumberFormat(locale);
  const twoDigitFormat = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  const lessonLink = (item: CourseMapLesson) => {
    const complete = Boolean(progress.lessons[item.slug]);
    return (
      <li data-complete={complete || undefined} key={item.slug}>
        <Link
          href={item.href}
          aria-current={item.slug === currentSlug ? "page" : undefined}
          aria-label={`${numberFormat.format(item.order)}. ${item.title}, ${complete ? labels.milestoneComplete : labels.milestoneIncomplete}`}
        >
          <span className={styles.railNumber} aria-hidden="true">
            {twoDigitFormat.format(item.order)}
          </span>
          <span className={styles.railLessonTitle}>{item.title}</span>
          {complete ? (
            <span className={styles.railCheck} aria-hidden="true">✓</span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <>
      <aside className={styles.lessonRail} data-testid="grok-desktop-course-map">
        <nav aria-label={labels.allLessons}>
          <strong>{labels.allLessons}</strong>
          {units.map((unit) => (
            <details key={unit.id} open={unit.id === currentUnit?.id}>
              <summary>{unit.title}</summary>
              <ol>{unit.lessons.map(lessonLink)}</ol>
            </details>
          ))}
        </nav>
      </aside>

      <details
        className={styles.lessonRailMobile}
        data-testid="grok-mobile-course-map"
      >
        <summary>
          <span>{labels.allLessons}</span>
          <span>
            {labels.currentLesson} {numberFormat.format(currentLesson?.order ?? 1)} / {numberFormat.format(lessons.length)}
          </span>
        </summary>
        <nav aria-label={labels.allLessons}>
          {units.map((unit) => (
            <div className={styles.mobileRailUnit} key={unit.id}>
              <strong className={styles.mobileRailGroup}>{unit.title}</strong>
              <ol>{unit.lessons.map(lessonLink)}</ol>
            </div>
          ))}
        </nav>
      </details>
    </>
  );
}
