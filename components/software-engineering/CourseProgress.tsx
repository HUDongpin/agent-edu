"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  isSoftwareEngineeringCapstoneSubmission,
  isSoftwareEngineeringQuizPassed,
  type SoftwareEngineeringLessonSlug,
  type SoftwareEngineeringLocaleCopy,
} from "@/lib/software-engineering";
import {
  SOFTWARE_ENGINEERING_CAPSTONE_KEY,
  resetSoftwareEngineeringProgress,
  softwareEngineeringLessonKey,
} from "./progress-store";
import useSoftwareEngineeringProgress, {
  useSoftwareEngineeringStorageAvailable,
} from "./useSoftwareEngineeringProgress";
import styles from "./SoftwareEngineeringCourse.module.css";

export default function CourseProgress({
  lessons,
  labels,
}: {
  lessons: readonly { readonly slug: SoftwareEngineeringLessonSlug; readonly href: string }[];
  labels: SoftwareEngineeringLocaleCopy["ui"];
}) {
  const progress = useSoftwareEngineeringProgress();
  const storageAvailable = useSoftwareEngineeringStorageAvailable();
  const [resetStatus, setResetStatus] = useState("");

  const state = useMemo(() => {
    const lessonCount = lessons.filter((lesson) => progress[softwareEngineeringLessonKey(lesson.slug)] === true).length;
    const quizCount = isSoftwareEngineeringQuizPassed(progress) ? 1 : 0;
    const capstoneCount = isSoftwareEngineeringCapstoneSubmission(
      progress[SOFTWARE_ENGINEERING_CAPSTONE_KEY],
    ) ? 1 : 0;
    const completed = lessonCount + quizCount + capstoneCount;
    const total = lessons.length + 2;
    const nextLesson = lessons.find((lesson) => progress[softwareEngineeringLessonKey(lesson.slug)] !== true);
    const nextHref = nextLesson?.href ?? (quizCount ? (capstoneCount ? null : lessons.at(-1)?.href ?? null) : "#final-assessment");
    return { completed, total, percent: Math.round((completed / total) * 100), nextHref };
  }, [lessons, progress]);

  const hasProgress = Object.keys(progress).some((key) => key.startsWith("softwareEngineering."));

  return (
    <section className={styles.progressPanel} aria-labelledby="software-engineering-progress-title">
      <div className={styles.progressHeading}>
        <div>
          <h2 id="software-engineering-progress-title">{labels.progress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={styles.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>{state.completed} / {state.total}</span>
        </output>
      </div>
      {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}
      <progress
        className={styles.progressBar}
        max={state.total}
        value={state.completed}
        aria-labelledby="software-engineering-progress-title"
      >
        {state.percent}%
      </progress>
      <div className={styles.actionRow}>
        {state.nextHref ? (
          <Link className={styles.primaryButton} href={state.nextHref}>
            {hasProgress ? labels.resumeCourse : labels.startCourse}<span aria-hidden="true">→</span>
          </Link>
        ) : null}
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            resetSoftwareEngineeringProgress();
            setResetStatus(labels.resetDone);
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p className={resetStatus ? styles.resetStatus : styles.srOnly} role="status">{resetStatus}</p>
    </section>
  );
}
