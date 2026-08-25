import { GROK_LESSON_SLUGS } from "./types";

export const GROK_PROGRESS_STORAGE_KEY = "aicourse.grok.progress.v1" as const;
export const GROK_PROGRESS_MILESTONES = GROK_LESSON_SLUGS.length + 2;
export const GROK_QUIZ_QUESTION_COUNT = GROK_LESSON_SLUGS.length;
export const GROK_QUIZ_PASSING_SCORE = 12;
export const GROK_CAPSTONE_ITEM_COUNT = 7;

export function grokProgressPercent(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  const progress = value as Record<string, unknown>;
  if (progress.schemaVersion !== 1) return 0;

  const lessonRecord = progress.lessons && typeof progress.lessons === "object"
    && !Array.isArray(progress.lessons)
    ? progress.lessons as Record<string, unknown>
    : {};
  const lessons = GROK_LESSON_SLUGS.filter((slug) => lessonRecord[slug] === true).length;
  const quizBest = typeof progress.quizBest === "number"
    && Number.isInteger(progress.quizBest)
    && progress.quizBest >= 0
    && progress.quizBest <= GROK_QUIZ_QUESTION_COUNT
    ? progress.quizBest
    : 0;
  const capstoneChecks = Array.isArray(progress.capstoneChecks)
    && progress.capstoneChecks.length === GROK_CAPSTONE_ITEM_COUNT
    ? progress.capstoneChecks.map((item) => item === true)
    : [];
  const completed = lessons
    + Number(progress.quizPassed === true && quizBest >= GROK_QUIZ_PASSING_SCORE)
    + Number(progress.capstoneReady === true && capstoneChecks.every(Boolean)
      && capstoneChecks.length === GROK_CAPSTONE_ITEM_COUNT);
  return Math.round((completed / GROK_PROGRESS_MILESTONES) * 100);
}
