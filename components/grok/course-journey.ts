import type { GrokLessonSlug } from "@/lib/grok/types";
import type { GrokProgress } from "./progress-store";

export type GrokJourneyLesson = {
  readonly slug: GrokLessonSlug;
  readonly title: string;
  readonly href: string;
};

export type GrokJourneyState = {
  readonly completeLessons: number;
  readonly completed: number;
  readonly total: number;
  readonly complete: boolean;
  readonly hasProgress: boolean;
  readonly nextHref?: string;
};

/** One journey selector powers both the above-fold and detailed progress CTAs. */
export function selectGrokJourney(
  progress: GrokProgress,
  lessons: readonly GrokJourneyLesson[],
  hasActiveQuizAttempt = false,
): GrokJourneyState {
  const completeLessons = lessons.filter((lesson) => progress.lessons[lesson.slug]).length;
  const completed = completeLessons + Number(progress.quizPassed) + Number(progress.capstoneReady);
  const total = lessons.length + 2;
  const complete = total > 0 && completed === total;
  const lastVisited = progress.lastVisitedLesson
    ? lessons.find((lesson) => (
      lesson.slug === progress.lastVisitedLesson && !progress.lessons[lesson.slug]
    ))
    : undefined;
  const firstIncomplete = lessons.find((lesson) => !progress.lessons[lesson.slug]);
  const capstone = lessons.find((lesson) => lesson.slug === "capstone");
  const nextHref = hasActiveQuizAttempt
    ? "#grok-final-quiz"
    : complete ? lessons[0]?.href
      : lastVisited?.href
      ?? firstIncomplete?.href
      ?? (!progress.quizPassed ? "#grok-final-quiz"
        : !progress.capstoneReady ? capstone?.href
          : undefined);
  const hasProgress = hasActiveQuizAttempt
    || Boolean(progress.lastVisitedLesson)
    || Object.values(progress.lessons).some(Boolean)
    || progress.quizBest > 0
    || progress.quizPassed
    || progress.capstoneChecks.some(Boolean)
    || progress.capstoneReady;

  return {
    completeLessons,
    completed,
    total,
    complete,
    hasProgress,
    ...(nextHref ? { nextHref } : {}),
  };
}
