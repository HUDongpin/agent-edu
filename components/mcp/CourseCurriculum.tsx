"use client";

import Link from "next/link";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy, formatMcpInteger } from "@/lib/mcp/format";
import type { McpDirection } from "@/lib/mcp/types";
import { useMcpProgress } from "./useMcpProgress";
import styles from "./McpCourse.module.css";

type CurriculumLesson = {
  readonly slug: string;
  readonly order: number;
  readonly minutes: number;
  readonly title: string;
  readonly summary: string;
};

type CurriculumUnit = {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly lessons: readonly CurriculumLesson[];
};

export default function CourseCurriculum({
  locale,
  direction,
  units,
  ui,
}: {
  locale: string;
  direction: McpDirection;
  units: readonly CurriculumUnit[];
  ui: McpUiCopy;
}) {
  const progress = useMcpProgress();
  const lessons = units.flatMap((unit) => unit.lessons);
  const completedCount = lessons.filter(
    (lesson) => progress[`mcp.lesson.${lesson.slug}`] === true,
  ).length;
  const nextLesson = lessons.find(
    (lesson) => progress[`mcp.lesson.${lesson.slug}`] !== true,
  );
  const number = (value: number) => formatMcpInteger(value, locale);
  const arrowForward = direction === "rtl" ? "←" : "→";

  return (
    <div className={styles.unitList} data-testid="mcp-curriculum-list">
      {units.map((unit) => (
        <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
          <div className={styles.unitHeading}>
            <span>{number(unit.order)}</span>
            <div>
              <h3 id={`${unit.id}-title`}>{unit.title}</h3>
              <p>{unit.summary}</p>
            </div>
          </div>
          <ol>
            {unit.lessons.map((lesson) => {
              const complete = progress[`mcp.lesson.${lesson.slug}`] === true;
              const isNext = nextLesson?.slug === lesson.slug;
              return (
                <li
                  key={lesson.slug}
                  data-lesson-slug={lesson.slug}
                  data-complete={complete ? "true" : undefined}
                  data-next={isNext ? "true" : undefined}
                >
                  <Link href={`/${locale}/mcp/${lesson.slug}/`}>
                    <span className={styles.lessonOrder}>{number(lesson.order)}</span>
                    <span className={styles.lessonCardCopy}>
                      <strong>{lesson.title}</strong>
                      <small>{lesson.summary}</small>
                    </span>
                    <span className={styles.lessonMinutes} data-state={complete ? "complete" : isNext ? "next" : "open"}>
                      {complete ? (
                        <strong>{ui.completionMarked}</strong>
                      ) : (
                        <>
                          <small>{formatMcpCopy(ui.dashboardMinutesTemplate, { minutes: number(lesson.minutes) })}</small>
                          {isNext ? (
                            <strong>
                              {completedCount ? ui.progressContinue : ui.progressStart}{" "}
                              <b aria-hidden="true">{arrowForward}</b>
                            </strong>
                          ) : (
                            <b aria-hidden="true">{arrowForward}</b>
                          )}
                        </>
                      )}
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
