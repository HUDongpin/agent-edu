import { CURSOR_FIGURE_BY_ID } from "./figures";
import { CURSOR_COURSE_MANIFEST } from "./manifest";
import { CURSOR_PRACTICE_BY_LESSON } from "./practices";
import { CURSOR_QUIZ_BY_ID } from "./quiz";
import { CURSOR_SOURCE_BY_ID } from "./sources";
import {
  CURSOR_LESSON_SLUGS,
  CURSOR_LOCALES,
  type CursorCourseCopy,
  type CursorLessonSlug,
  type CursorLocale,
  type MaterializedCursorCourse,
  type MaterializedCursorLesson,
} from "./types";

type CopyModule = { default: CursorCourseCopy };

const COPY_LOADERS: Record<CursorLocale, () => Promise<CopyModule>> = {
  en: () => import("@/messages/cursor/en.json") as Promise<CopyModule>,
  es: () => import("@/messages/cursor/es.json") as Promise<CopyModule>,
  fr: () => import("@/messages/cursor/fr.json") as Promise<CopyModule>,
  de: () => import("@/messages/cursor/de.json") as Promise<CopyModule>,
  "zh-Hans": () => import("@/messages/cursor/zh-Hans.json") as Promise<CopyModule>,
  "zh-Hant": () => import("@/messages/cursor/zh-Hant.json") as Promise<CopyModule>,
  ja: () => import("@/messages/cursor/ja.json") as Promise<CopyModule>,
  ko: () => import("@/messages/cursor/ko.json") as Promise<CopyModule>,
  ar: () => import("@/messages/cursor/ar.json") as Promise<CopyModule>,
};

export function isCursorLocale(value: string): value is CursorLocale {
  return (CURSOR_LOCALES as readonly string[]).includes(value);
}

export function isCursorLessonSlug(value: string): value is CursorLessonSlug {
  return (CURSOR_LESSON_SLUGS as readonly string[]).includes(value);
}

export async function loadCursorCopy(locale: CursorLocale): Promise<CursorCourseCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}

function materializeLesson(copy: CursorCourseCopy, slug: CursorLessonSlug): MaterializedCursorLesson {
  const lesson = CURSOR_COURSE_MANIFEST.lessons.find((item) => item.slug === slug);
  if (!lesson) {
    throw new Error(`Unknown Cursor lesson slug: ${slug}`);
  }

  return {
    ...lesson,
    copy: copy.lessons[slug],
    figures: lesson.figureIds.map((id) => ({ manifest: CURSOR_FIGURE_BY_ID[id], copy: copy.figures[id] })),
    quiz: lesson.quizIds.map((id) => ({ manifest: CURSOR_QUIZ_BY_ID[id], copy: copy.quiz[id] })),
    sources: lesson.sourceIds.map((id) => CURSOR_SOURCE_BY_ID[id]),
    practice: CURSOR_PRACTICE_BY_LESSON[slug],
  };
}

export async function loadCursorCourse(locale: CursorLocale): Promise<MaterializedCursorCourse> {
  const copy = await loadCursorCopy(locale);
  const lessons = CURSOR_COURSE_MANIFEST.lessons.map((lesson) => materializeLesson(copy, lesson.slug));

  return {
    locale,
    manifest: CURSOR_COURSE_MANIFEST,
    copy,
    units: CURSOR_COURSE_MANIFEST.units.map((unit) => ({
      ...unit,
      copy: copy.units[unit.id],
      lessons: unit.lessonSlugs.map((slug) => lessons.find((lesson) => lesson.slug === slug)!),
    })),
  };
}

export async function getCursorLesson(
  locale: CursorLocale,
  slug: CursorLessonSlug,
): Promise<MaterializedCursorLesson> {
  const copy = await loadCursorCopy(locale);
  return materializeLesson(copy, slug);
}
