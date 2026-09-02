"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  formatGithubNumber,
  type GithubLocale,
  type GithubUiCopy,
} from "@/lib/github";
import { githubLessonProgressKey } from "./progress-store";
import useGithubProgress from "./useGithubProgress";
import styles from "./LessonCourseMap.module.css";

type CourseMapLesson = {
  readonly slug: string;
  readonly order: number;
  readonly title: string;
  readonly href: string;
};

type CourseMapUnit = {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly CourseMapLesson[];
};

type CourseMapLabels = Pick<
  GithubUiCopy,
  "allLessons" | "completed" | "lessonPositionTemplate"
>;

function formatLessonPosition(
  template: string,
  current: string,
  total: string,
): string {
  return template
    .replace("{current}", current)
    .replace("{total}", total);
}

function UnitLinks({
  units,
  activeSlug,
  activeRef,
  completedLabel,
  numberFormat,
  progress,
}: {
  units: readonly CourseMapUnit[];
  activeSlug: string;
  activeRef?: React.RefObject<HTMLAnchorElement | null>;
  completedLabel: string;
  numberFormat: (value: number) => string;
  progress: Readonly<Record<string, unknown>>;
}) {
  return units.map((unit) => (
    <div className={styles.unit} key={unit.id}>
      <p className={styles.unitTitle}>{unit.title}</p>
      <ol>
        {unit.lessons.map((lesson) => {
          const active = lesson.slug === activeSlug;
          const complete = progress[githubLessonProgressKey(lesson.slug)] === true;
          const lessonNumber = numberFormat(lesson.order);
          return (
            <li key={lesson.slug}>
              <Link
                className={styles.lessonLink}
                href={lesson.href}
                aria-current={active ? "page" : undefined}
                aria-label={
                  complete
                    ? `${lessonNumber}. ${lesson.title}, ${completedLabel}`
                    : undefined
                }
                data-completion-state={complete ? "complete" : "incomplete"}
                ref={active ? activeRef : undefined}
              >
                <span className={styles.lessonNumber}>{lessonNumber}</span>
                <span className={styles.lessonTitle}>{lesson.title}</span>
                <span className={styles.completionSlot} aria-hidden="true">
                  {complete ? (
                    <span data-completion-indicator aria-hidden="true">✓</span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  ));
}

export default function LessonCourseMap({
  units,
  activeSlug,
  current,
  total,
  currentTitle,
  labels,
  locale,
}: {
  units: readonly CourseMapUnit[];
  activeSlug: string;
  current: number;
  total: number;
  currentTitle: string;
  labels: CourseMapLabels;
  locale: GithubLocale;
}) {
  const desktopMapRef = useRef<HTMLElement>(null);
  const desktopActiveRef = useRef<HTMLAnchorElement>(null);
  const mobileActiveRef = useRef<HTMLAnchorElement>(null);
  const progress = useGithubProgress();
  const numberFormat = (value: number) => formatGithubNumber(locale, value);
  const twoDigitFormat = (value: number) => formatGithubNumber(locale, value, {
    minimumIntegerDigits: 2,
  });
  const position = formatLessonPosition(
    labels.lessonPositionTemplate,
    numberFormat(current),
    numberFormat(total),
  );

  useEffect(() => {
    let frame = 0;
    const revealDesktopActiveLesson = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollport = desktopMapRef.current;
        const active = desktopActiveRef.current;
        if (!scrollport || !active || scrollport.offsetParent === null) return;

        const scrollportBounds = scrollport.getBoundingClientRect();
        const activeBounds = active.getBoundingClientRect();
        if (activeBounds.top < scrollportBounds.top) {
          scrollport.scrollTop += activeBounds.top - scrollportBounds.top;
        } else if (activeBounds.bottom > scrollportBounds.bottom) {
          scrollport.scrollTop += activeBounds.bottom - scrollportBounds.bottom;
        }
      });
    };

    revealDesktopActiveLesson();
    window.addEventListener("resize", revealDesktopActiveLesson);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", revealDesktopActiveLesson);
    };
  }, [activeSlug]);

  return (
    <>
      <aside
        className={styles.desktopMap}
        data-testid="github-desktop-course-map"
        ref={desktopMapRef}
      >
        <nav aria-label={labels.allLessons}>
          <strong className={styles.mapTitle}>{labels.allLessons}</strong>
          <UnitLinks
            units={units}
            activeSlug={activeSlug}
            activeRef={desktopActiveRef}
            completedLabel={labels.completed}
            numberFormat={twoDigitFormat}
            progress={progress}
          />
        </nav>
      </aside>

      <details
        className={styles.mobileMap}
        data-testid="github-mobile-course-map"
        onToggle={(event) => {
          if (!event.currentTarget.open) return;
          window.requestAnimationFrame(() => {
            mobileActiveRef.current?.scrollIntoView({
              block: "nearest",
              inline: "nearest",
              behavior: "instant",
            });
          });
        }}
      >
        <summary>
          <span className={styles.summaryCopy}>
            <span className={styles.summaryPosition}>{position}</span>
            <span className={styles.summaryTitle}>{currentTitle}</span>
          </span>
          <span className={styles.summaryIndicator} aria-hidden="true" />
        </summary>
        <div
          className={styles.mobileScrollport}
          data-testid="github-mobile-course-map-scrollport"
        >
          <nav aria-label={labels.allLessons}>
            <UnitLinks
              units={units}
              activeSlug={activeSlug}
              activeRef={mobileActiveRef}
              completedLabel={labels.completed}
              numberFormat={twoDigitFormat}
              progress={progress}
            />
          </nav>
        </div>
      </details>
    </>
  );
}
