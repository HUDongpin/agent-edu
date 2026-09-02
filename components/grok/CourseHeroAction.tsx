"use client";

import Link from "next/link";
import { useId, useMemo, useSyncExternalStore } from "react";
import type { GrokCourseCopy } from "@/lib/grok/types";
import { selectGrokJourney, type GrokJourneyLesson } from "./course-journey";
import {
  createGrokQuizAttemptConfig,
  parseGrokQuizAttempt,
  readGrokQuizAttemptSnapshot,
  subscribeToGrokQuizAttempt,
  type GrokQuizAttemptQuestion,
} from "./quiz-attempt-store";
import useGrokProgress from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

export default function CourseHeroAction({
  locale,
  lessons,
  quizQuestions,
  passingScore,
  labels,
  startLabel,
  resumeLabel,
  reviewLabel,
}: {
  locale: string;
  lessons: readonly GrokJourneyLesson[];
  quizQuestions: readonly GrokQuizAttemptQuestion[];
  passingScore: number;
  labels: GrokCourseCopy["ui"];
  startLabel: string;
  resumeLabel: string;
  reviewLabel: string;
}) {
  const progress = useGrokProgress();
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const attemptConfig = useMemo(
    () => createGrokQuizAttemptConfig(quizQuestions, passingScore),
    [passingScore, quizQuestions],
  );
  const attemptRaw = useSyncExternalStore(
    subscribeToGrokQuizAttempt,
    readGrokQuizAttemptSnapshot,
    () => null,
  );
  const attempt = useMemo(() => (
    attemptRaw ? parseGrokQuizAttempt(attemptRaw, attemptConfig) : null
  ), [attemptConfig, attemptRaw]);
  const journey = useMemo(
    () => selectGrokJourney(progress, lessons, Boolean(attempt)),
    [attempt, lessons, progress],
  );
  const contextId = useId();

  if (!journey.nextHref) return null;
  const actionLabel = attempt
    ? resumeLabel
    : journey.complete
    ? reviewLabel
    : journey.hasProgress ? resumeLabel : startLabel;

  return (
    <Link
      className={styles.primaryAction}
      href={journey.nextHref}
      aria-label={actionLabel}
      aria-describedby={contextId}
      data-course-journey-action
      data-testid="grok-hero-journey-action"
    >
      {actionLabel}
      <span className={styles.srOnly} id={contextId}>
        {attempt
          ? ` — ${labels.quizAttemptAvailable
            .replace("{current}", numberFormat.format(attempt.questionIndex + 1))
            .replace("{total}", numberFormat.format(attemptConfig.optionCounts.length))}`
          : ` — ${labels.courseProgress}: ${numberFormat.format(journey.completed)} / ${numberFormat.format(journey.total)}`}
      </span>
      <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
    </Link>
  );
}
