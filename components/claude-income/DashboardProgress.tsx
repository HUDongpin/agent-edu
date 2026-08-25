"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClaudeIncomeLessonSlug } from "@/lib/claude-income";
import {
  lessonCompletionKey,
  lessonVisitedKey,
  resetClaudeIncomeProgress,
} from "./progress-store";
import { useCourseProgress, useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./ClaudeIncomeCourse.module.css";

type LessonLink = {
  readonly slug: ClaudeIncomeLessonSlug;
  readonly title: string;
  readonly href: string;
};

export default function DashboardProgress({ lessons }: { lessons: readonly LessonLink[] }) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [resetArmed, setResetArmed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const completed = lessons.filter((lesson) => progress[lessonCompletionKey(lesson.slug)] === true);
  const storedLast = progress[lessonVisitedKey()];
  const lastVisited = typeof storedLast === "string"
    ? lessons.find((lesson) => lesson.slug === storedLast)
    : undefined;
  const firstIncomplete = lessons.find(
    (lesson) => progress[lessonCompletionKey(lesson.slug)] !== true,
  );
  const resume = lastVisited && progress[lessonCompletionKey(lastVisited.slug)] !== true
    ? lastVisited
    : firstIncomplete ?? lessons[0];
  const percent = lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0;

  function reset() {
    const persisted = resetClaudeIncomeProgress();
    setResetArmed(false);
    setAnnouncement(
      persisted
        ? "Course 12 progress was reset. Other course and site data was preserved."
        : "Course 12 session progress was reset. Browser storage is unavailable.",
    );
  }

  return (
    <section className={styles.progressPanel} aria-labelledby="claude-income-progress-title">
      <div className={styles.progressCopy}>
        <p className={styles.eyebrow}>Your course record</p>
        <h2 id="claude-income-progress-title">
          {completed.length === 0
            ? "Begin with evidence"
            : completed.length === lessons.length
              ? "All lessons complete"
              : `Resume lesson ${resume?.slug ? lessons.findIndex((item) => item.slug === resume.slug) + 1 : 1}`}
        </h2>
        <p>{completed.length} of {lessons.length} lessons marked complete</p>
      </div>

      <div className={styles.progressMeter}>
        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
        <span className={styles.progressValue}>{percent}%</span>
      </div>

      <div className={styles.progressActions}>
        {resume ? (
          <Link className={styles.primaryAction} href={resume.href} data-course-journey-action>
            {completed.length === lessons.length
              ? "Review course"
              : completed.length
                ? "Resume course"
                : "Start lesson 1"}
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
        {!resetArmed ? (
          <button className={styles.textButton} type="button" onClick={() => setResetArmed(true)}>
            Reset Course 12 progress
          </button>
        ) : (
          <span className={styles.resetConfirm}>
            <button className={styles.dangerButton} type="button" onClick={reset}>Confirm reset</button>
            <button className={styles.textButton} type="button" onClick={() => setResetArmed(false)}>Cancel</button>
          </span>
        )}
      </div>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">
          Browser storage is unavailable. Progress will last only for this open session.
        </p>
      ) : null}
      <p className={styles.srOnly} aria-live="polite">{announcement}</p>
    </section>
  );
}
