"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { RagLessonSlug } from "@/lib/rag";
import base from "../prompts/PromptCourse.module.css";
import styles from "./RagCourse.module.css";
import { ragPracticeKey } from "./progress-store";
import useRagProgress from "./useRagProgress";

export interface RagCourseMapLesson {
  readonly slug: RagLessonSlug;
  readonly href: string;
  readonly orderLabel: string;
  readonly title: string;
  readonly summary: string;
  readonly minutesLabel: string;
}

export interface RagCourseMapUnit {
  readonly id: string;
  readonly orderLabel: string;
  readonly title: string;
  readonly summary: string;
  readonly lessons: readonly RagCourseMapLesson[];
}

interface JourneyLabels {
  readonly complete: string;
  readonly next: string;
}

function lessonState(
  slug: RagLessonSlug,
  slugs: readonly RagLessonSlug[],
  progress: Record<string, unknown>,
  storageAvailable: boolean,
): "complete" | "next" | "pending" | "unavailable" {
  if (!storageAvailable) return "unavailable";
  if (progress[ragPracticeKey(slug)] === true) return "complete";
  const next = slugs.find((candidate) => progress[ragPracticeKey(candidate)] !== true);
  return next === slug ? "next" : "pending";
}

function LessonState({ state, labels }: {
  readonly state: ReturnType<typeof lessonState>;
  readonly labels: JourneyLabels;
}) {
  if (state === "pending" || state === "unavailable") return null;
  return (
    <span className={styles.lessonState} data-lesson-progress-state={state}>
      <span aria-hidden="true">{state === "complete" ? "✓" : "→"}</span>
      <span>{state === "complete" ? labels.complete : labels.next}</span>
    </span>
  );
}

export function RagCurriculumMap({
  units,
  labels,
}: {
  readonly units: readonly RagCourseMapUnit[];
  readonly labels: JourneyLabels;
}) {
  const { progress, storageAvailable } = useRagProgress();
  const lessons = units.flatMap((unit) => unit.lessons);
  const slugs = lessons.map((lesson) => lesson.slug);

  return (
    <div className={base.unitList} data-course-map-progress={storageAvailable ? "available" : "unavailable"}>
      {units.map((unit) => (
        <section className={base.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
          <div className={base.unitHeading}>
            <span>{unit.orderLabel}</span>
            <div>
              <h3 id={`${unit.id}-title`}>{unit.title}</h3>
              <p>{unit.summary}</p>
            </div>
          </div>
          <ol className={base.lessonList}>
            {unit.lessons.map((lesson) => {
              const state = lessonState(lesson.slug, slugs, progress, storageAvailable);
              return (
                <li key={lesson.slug} data-lesson-progress-state={state}>
                  <Link className={styles.curriculumLessonLink} href={lesson.href}>
                    <span className={base.lessonOrder}>{lesson.orderLabel}</span>
                    <span className={base.lessonCopy}>
                      <strong>{lesson.title}</strong>
                      <span>{lesson.summary}</span>
                    </span>
                    <LessonState state={state} labels={labels} />
                    <span className={`${base.lessonTime} ${styles.mapLessonTime}`}>{lesson.minutesLabel}</span>
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

export function RagLessonCourseMap({
  lessons,
  currentSlug,
  labels,
}: {
  readonly lessons: readonly RagCourseMapLesson[];
  readonly currentSlug: RagLessonSlug;
  readonly labels: JourneyLabels;
}) {
  const { progress, storageAvailable } = useRagProgress();
  const slugs = lessons.map((lesson) => lesson.slug);
  const currentLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = currentLinkRef.current;
    const details = link?.closest("details");
    if (!link || !details) return;
    const revealCurrentLesson = () => {
      if (details.open) link.scrollIntoView({ block: "nearest" });
    };
    details.addEventListener("toggle", revealCurrentLesson);
    return () => details.removeEventListener("toggle", revealCurrentLesson);
  }, [currentSlug]);

  return (
    <ol data-course-map-progress={storageAvailable ? "available" : "unavailable"}>
      {lessons.map((lesson) => {
        const state = lessonState(lesson.slug, slugs, progress, storageAvailable);
        return (
          <li key={lesson.slug} data-lesson-progress-state={state}>
            <Link
              ref={lesson.slug === currentSlug ? currentLinkRef : undefined}
              className={styles.railLessonLink}
              href={lesson.href}
              aria-current={lesson.slug === currentSlug ? "page" : undefined}
            >
              <span>{lesson.orderLabel}</span>
              <span className={styles.railLessonTitle}>{lesson.title}</span>
              <LessonState state={state} labels={labels} />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
