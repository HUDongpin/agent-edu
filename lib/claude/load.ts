import { CLAUDE_FIGURE_BY_ID } from "./figures";
import { CLAUDE_COURSE_MANIFEST } from "./manifest";
import { CLAUDE_PRACTICE_BY_LESSON } from "./practices";
import { CLAUDE_QUIZ_BY_ID } from "./quiz";
import { CLAUDE_SOURCE_BY_ID } from "./sources";
import {
  CLAUDE_LESSON_SLUGS,
  CLAUDE_LOCALES,
  type ClaudeCourseCopy,
  type ClaudeLessonSlug,
  type ClaudeLocale,
  type MaterializedClaudeCourse,
  type MaterializedClaudeLesson,
} from "./types";

type CopyModule = { default: ClaudeCourseCopy };

const COPY_LOADERS: Record<ClaudeLocale, () => Promise<CopyModule>> = {
  en: () => import("@/messages/claude/en.json") as Promise<CopyModule>,
  es: () => import("@/messages/claude/es.json") as Promise<CopyModule>,
  fr: () => import("@/messages/claude/fr.json") as Promise<CopyModule>,
  de: () => import("@/messages/claude/de.json") as Promise<CopyModule>,
  "zh-Hans": () => import("@/messages/claude/zh-Hans.json") as Promise<CopyModule>,
  "zh-Hant": () => import("@/messages/claude/zh-Hant.json") as Promise<CopyModule>,
  ja: () => import("@/messages/claude/ja.json") as Promise<CopyModule>,
  ko: () => import("@/messages/claude/ko.json") as Promise<CopyModule>,
  ar: () => import("@/messages/claude/ar.json") as Promise<CopyModule>,
};

export function isClaudeLocale(value: string): value is ClaudeLocale {
  return (CLAUDE_LOCALES as readonly string[]).includes(value);
}

export function isClaudeLessonSlug(value: string): value is ClaudeLessonSlug {
  return (CLAUDE_LESSON_SLUGS as readonly string[]).includes(value);
}

export async function loadClaudeCopy(locale: ClaudeLocale): Promise<ClaudeCourseCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}

function materializeLesson(copy: ClaudeCourseCopy, slug: ClaudeLessonSlug): MaterializedClaudeLesson {
  const lesson = CLAUDE_COURSE_MANIFEST.lessons.find((item) => item.slug === slug);
  if (!lesson) {
    throw new Error(`Unknown Claude lesson slug: ${slug}`);
  }

  return {
    ...lesson,
    copy: copy.lessons[slug],
    figures: lesson.figureIds.map((id) => ({ manifest: CLAUDE_FIGURE_BY_ID[id], copy: copy.figures[id] })),
    quiz: lesson.quizIds.map((id) => ({ manifest: CLAUDE_QUIZ_BY_ID[id], copy: copy.quiz[id] })),
    sources: lesson.sourceIds.map((id) => CLAUDE_SOURCE_BY_ID[id]),
    practice: CLAUDE_PRACTICE_BY_LESSON[slug],
  };
}

export async function loadClaudeCourse(locale: ClaudeLocale): Promise<MaterializedClaudeCourse> {
  const copy = await loadClaudeCopy(locale);
  const lessons = CLAUDE_COURSE_MANIFEST.lessons.map((lesson) => materializeLesson(copy, lesson.slug));

  return {
    locale,
    manifest: CLAUDE_COURSE_MANIFEST,
    copy,
    units: CLAUDE_COURSE_MANIFEST.units.map((unit) => ({
      ...unit,
      copy: copy.units[unit.id],
      lessons: unit.lessonSlugs.map((slug) => lessons.find((lesson) => lesson.slug === slug)!),
    })),
  };
}

export async function getClaudeLesson(
  locale: ClaudeLocale,
  slug: ClaudeLessonSlug,
): Promise<MaterializedClaudeLesson> {
  const copy = await loadClaudeCopy(locale);
  return materializeLesson(copy, slug);
}
