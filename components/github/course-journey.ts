import {
  isGithubQuizPassed,
  type GithubLessonSlug,
} from "@/lib/github";
import {
  GITHUB_CAPSTONE_STORAGE_KEY,
  githubLessonProgressKey,
  type CourseProgressRecord,
} from "./progress-store";

export type GithubJourneyLesson = {
  readonly slug: GithubLessonSlug;
  readonly href: string;
};

export type GithubJourneySelection = {
  readonly completed: number;
  readonly total: number;
  readonly percent: number;
  readonly courseCompleted: boolean;
  readonly nextHref: string | null;
};

export function selectGithubJourney(
  lessons: readonly GithubJourneyLesson[],
  progress: CourseProgressRecord,
): GithubJourneySelection {
  const completedLessons = lessons.filter(
    (lesson) => progress[githubLessonProgressKey(lesson.slug)] === true,
  ).length;
  const quizPassed = isGithubQuizPassed(progress);
  const capstonePassed = progress[GITHUB_CAPSTONE_STORAGE_KEY] === true;
  const completed =
    completedLessons + Number(quizPassed) + Number(capstonePassed);
  const total = lessons.length + 2;
  const incompleteLesson = lessons.find(
    (lesson) => progress[githubLessonProgressKey(lesson.slug)] !== true,
  );
  const capstoneLesson = lessons.find(
    (lesson) => lesson.slug === "teaching-capstone",
  );
  const courseCompleted = completed === total;
  const nextHref = courseCompleted
    ? lessons[0]?.href ?? null
    : incompleteLesson?.href
      ?? (!quizPassed
        ? "#github-final-quiz-title"
        : capstoneLesson
          ? `${capstoneLesson.href}#github-capstone`
          : null);

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    courseCompleted,
    nextHref,
  };
}
