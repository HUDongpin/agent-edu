"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import type {
  SoftwareEngineeringLessonSlug,
  SoftwareEngineeringLocaleCopy,
  SoftwareEngineeringUnitId,
} from "@/lib/software-engineering/types";
import {
  SOFTWARE_ENGINEERING_ASSESSMENT_ID,
  SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG,
  softwareEngineeringCourseHref,
} from "@/lib/software-engineering/journey";
import { SOFTWARE_ENGINEERING_PROGRESS_QUIZ } from "@/lib/progress-topology";
import useSoftwareEngineeringProgress from "./useSoftwareEngineeringProgress";
import { softwareEngineeringLessonKey } from "./progress-store";
import styles from "./SoftwareEngineeringCourse.module.css";

interface JourneyLesson {
  readonly slug: SoftwareEngineeringLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly href: string;
}

interface JourneyUnit {
  readonly id: SoftwareEngineeringUnitId;
  readonly order: number;
  readonly title: string;
  readonly lessons: readonly JourneyLesson[];
}

function revealCurrent(
  container: HTMLElement | null,
  current: HTMLAnchorElement | null,
): void {
  if (!container || !current) return;

  const containerBox = container.getBoundingClientRect();
  const currentBox = current.getBoundingClientRect();
  const padding = 12;
  const visibleTop = Math.max(containerBox.top, 0) + padding;
  const visibleBottom = Math.min(containerBox.bottom, window.innerHeight) - padding;
  if (currentBox.top < visibleTop || currentBox.bottom > visibleBottom) {
    const currentCenter = currentBox.top + currentBox.height / 2;
    const visibleCenter = visibleTop + (visibleBottom - visibleTop) / 2;
    container.scrollTop += currentCenter - visibleCenter;
  }
}

function JourneyList({
  units,
  currentSlug,
  locale,
  completedLabel,
  assessmentLabel,
  assessmentHref,
  assessmentComplete,
  progress,
  currentRef,
}: {
  readonly units: readonly JourneyUnit[];
  readonly currentSlug: SoftwareEngineeringLessonSlug;
  readonly locale: string;
  readonly completedLabel: string;
  readonly assessmentLabel: string;
  readonly assessmentHref: string;
  readonly assessmentComplete: boolean;
  readonly progress: Readonly<Record<string, unknown>>;
  readonly currentRef: RefObject<HTMLAnchorElement | null>;
}) {
  return (
    <ol className={styles.journeyUnitList}>
      {units.map((unit) => (
        <li className={styles.journeyUnit} key={unit.id}>
          <div className={styles.journeyUnitHeading} lang={locale} dir="auto">
            <span aria-hidden="true">{String(unit.order).padStart(2, "0")}</span>
            <strong>{unit.title}</strong>
          </div>
          <ol className={styles.journeyLessonList}>
            {unit.lessons.map((lesson) => {
              const current = lesson.slug === currentSlug;
              const complete = progress[softwareEngineeringLessonKey(lesson.slug)] === true;
              const lessonLink = (
                <li key={lesson.slug}>
                  <Link
                    href={lesson.href}
                    aria-current={current ? "page" : undefined}
                    data-course-map-complete={complete ? "true" : "false"}
                    ref={current ? currentRef : undefined}
                  >
                    <span className={styles.journeyLessonOrder} aria-hidden="true">
                      {String(lesson.order).padStart(2, "0")}
                    </span>
                    <span lang={locale} dir="auto">{lesson.title}</span>
                    {complete ? (
                      <span className={styles.journeyLessonStatus}>
                        <span aria-hidden="true">✓</span>
                        <span className={styles.srOnly}>{completedLabel}</span>
                      </span>
                    ) : <span aria-hidden="true" />}
                  </Link>
                </li>
              );

              if (lesson.slug !== SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG) {
                return lessonLink;
              }

              return [
                <li className={styles.journeyAssessment} key={SOFTWARE_ENGINEERING_ASSESSMENT_ID}>
                  <Link
                    href={assessmentHref}
                    data-course-map-complete={assessmentComplete ? "true" : "false"}
                  >
                    <span className={styles.journeyLessonOrder} aria-hidden="true">A</span>
                    <span>{assessmentLabel}</span>
                    {assessmentComplete ? (
                      <span className={styles.journeyLessonStatus}>
                        <span aria-hidden="true">✓</span>
                        <span className={styles.srOnly}>{completedLabel}</span>
                      </span>
                    ) : <span aria-hidden="true" />}
                  </Link>
                </li>,
                lessonLink,
              ];
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}

export default function CourseJourneyMap({
  units,
  currentSlug,
  currentOrder,
  locale,
  labels,
}: {
  readonly units: readonly JourneyUnit[];
  readonly currentSlug: SoftwareEngineeringLessonSlug;
  readonly currentOrder: number;
  readonly locale: string;
  readonly labels: Pick<
    SoftwareEngineeringLocaleCopy["ui"],
    "allLessons" | "completed" | "finalAssessment" | "lessons" | "openCourseMap"
  >;
}) {
  const totalLessons = units.reduce((total, unit) => total + unit.lessons.length, 0);
  const progress = useSoftwareEngineeringProgress();
  const quizBest = progress[SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bestScoreStorageKey];
  const assessmentComplete = progress[SOFTWARE_ENGINEERING_PROGRESS_QUIZ.versionStorageKey]
      === SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bankVersion
    && progress[SOFTWARE_ENGINEERING_PROGRESS_QUIZ.passedStorageKey] === true
    && typeof quizBest === "number"
    && Number.isInteger(quizBest)
    && quizBest >= SOFTWARE_ENGINEERING_PROGRESS_QUIZ.passingCorrectAnswers
    && quizBest <= SOFTWARE_ENGINEERING_PROGRESS_QUIZ.questionCount;
  const assessmentHref = `${softwareEngineeringCourseHref(locale)}#${SOFTWARE_ENGINEERING_ASSESSMENT_ID}`;
  const desktopRail = useRef<HTMLElement>(null);
  const desktopCurrent = useRef<HTMLAnchorElement>(null);
  const mobileList = useRef<HTMLElement>(null);
  const mobileCurrent = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      revealCurrent(desktopRail.current, desktopCurrent.current);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentSlug]);

  return (
    <>
      <details
        className={styles.mobileCourseMap}
        onToggle={(event) => {
          if (!event.currentTarget.open) return;
          window.requestAnimationFrame(() => {
            revealCurrent(mobileList.current, mobileCurrent.current);
          });
        }}
      >
        <summary>
          <span>{labels.lessons} {currentOrder} / {totalLessons}</span>
          <span>{labels.openCourseMap}</span>
        </summary>
        <nav ref={mobileList} aria-label={labels.allLessons}>
          <JourneyList
            units={units}
            currentSlug={currentSlug}
            locale={locale}
            completedLabel={labels.completed}
            assessmentLabel={labels.finalAssessment}
            assessmentHref={assessmentHref}
            assessmentComplete={assessmentComplete}
            progress={progress}
            currentRef={mobileCurrent}
          />
        </nav>
      </details>

      <aside className={styles.lessonRail} ref={desktopRail}>
        <nav aria-label={labels.allLessons}>
          <strong>{labels.allLessons}</strong>
          <JourneyList
            units={units}
            currentSlug={currentSlug}
            locale={locale}
            completedLabel={labels.completed}
            assessmentLabel={labels.finalAssessment}
            assessmentHref={assessmentHref}
            assessmentComplete={assessmentComplete}
            progress={progress}
            currentRef={desktopCurrent}
          />
        </nav>
      </aside>
    </>
  );
}
