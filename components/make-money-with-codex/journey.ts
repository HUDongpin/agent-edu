import type { CodexIncomeLessonSlug } from "@/lib/make-money-with-codex";
import type { IncomeProgress } from "./progress-store";

export type IncomeJourneyLesson = {
  readonly slug: CodexIncomeLessonSlug;
  readonly href: string;
};

export function selectIncomeJourney(
  lessons: readonly IncomeJourneyLesson[],
  progress: IncomeProgress,
  courseHref: string,
) {
  const lessonCount = lessons.filter((lesson) => progress.lessons[lesson.slug]).length;
  const completed = lessonCount + Number(progress.quizPassed) + Number(progress.capstoneReady);
  const total = lessons.length + 2;
  const courseCompleted = completed >= total;
  const nextLesson = lessons.find((lesson) => !progress.lessons[lesson.slug]);
  const capstoneHref = lessons.at(-1)
    ? `${lessons.at(-1)!.href}#income-capstone-checklist-title`
    : courseHref;

  return {
    completed,
    total,
    courseCompleted,
    hasAnyProgress: lessonCount > 0
      || progress.quizBest > 0
      || progress.quizPassed
      || progress.capstoneChecks.some(Boolean)
      || progress.capstoneReady,
    nextHref: courseCompleted
      ? lessons[0]?.href ?? courseHref
      : nextLesson?.href
        ?? (!progress.capstoneReady
          ? capstoneHref
          : !progress.quizPassed
            ? `${courseHref}#income-knowledge-check`
            : lessons[0]?.href ?? courseHref),
    capstoneHref,
  } as const;
}
