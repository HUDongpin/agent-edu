import { LOCALE_CODES } from "@/lib/i18n";
import { CLAUDE_INCOME_COURSE } from "./curriculum";
import type { ClaudeIncomeLessonSlug } from "./types";

export * from "./capstone";
export * from "./curriculum";
export * from "./figures";
export * from "./quiz";
export * from "./sources";
export * from "./types";
export * from "./validate";

export const CLAUDE_INCOME_LOCALES = [...LOCALE_CODES] as const;
export const CLAUDE_INCOME_LESSON_SLUGS = CLAUDE_INCOME_COURSE.lessons.map(
  (lesson) => lesson.slug,
);

export function isClaudeIncomeLocale(value: string): boolean {
  return (CLAUDE_INCOME_LOCALES as readonly string[]).includes(value);
}

export function isClaudeIncomeLessonSlug(value: string): value is ClaudeIncomeLessonSlug {
  return (CLAUDE_INCOME_LESSON_SLUGS as readonly string[]).includes(value);
}

export function getClaudeIncomeLesson(slug: ClaudeIncomeLessonSlug) {
  const lesson = CLAUDE_INCOME_COURSE.lessons.find((item) => item.slug === slug);
  if (!lesson) throw new Error(`Unknown Claude income lesson: ${slug}`);
  return lesson;
}
