import { CODEX_FIGURE_BY_ID } from "./figures";
import { CODEX_COURSE_MANIFEST } from "./manifest";
import { CODEX_PRACTICE_BY_LESSON } from "./practices";
import { CODEX_QUIZ_BY_ID } from "./quiz";
import { CODEX_SOURCE_BY_ID } from "./sources";
import {
  CODEX_LESSON_SLUGS,
  CODEX_LOCALES,
  type CodexCourseCopy,
  type CodexLessonSlug,
  type CodexLocale,
  type MaterializedCodexCourse,
  type MaterializedCodexLesson,
} from "./types";

type CopyModule = { default: CodexCourseCopy };

const COPY_LOADERS: Record<CodexLocale, () => Promise<CopyModule>> = {
  en: () => import("@/messages/codex/en.json") as Promise<CopyModule>,
  es: () => import("@/messages/codex/es.json") as Promise<CopyModule>,
  fr: () => import("@/messages/codex/fr.json") as Promise<CopyModule>,
  de: () => import("@/messages/codex/de.json") as Promise<CopyModule>,
  "zh-Hans": () => import("@/messages/codex/zh-Hans.json") as Promise<CopyModule>,
  "zh-Hant": () => import("@/messages/codex/zh-Hant.json") as Promise<CopyModule>,
  ja: () => import("@/messages/codex/ja.json") as Promise<CopyModule>,
  ko: () => import("@/messages/codex/ko.json") as Promise<CopyModule>,
  ar: () => import("@/messages/codex/ar.json") as Promise<CopyModule>,
};

export function isCodexLocale(value: string): value is CodexLocale {
  return (CODEX_LOCALES as readonly string[]).includes(value);
}

export function isCodexLessonSlug(value: string): value is CodexLessonSlug {
  return (CODEX_LESSON_SLUGS as readonly string[]).includes(value);
}

export async function loadCodexCopy(locale: CodexLocale): Promise<CodexCourseCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}

function materializeLesson(copy: CodexCourseCopy, slug: CodexLessonSlug): MaterializedCodexLesson {
  const lesson = CODEX_COURSE_MANIFEST.lessons.find((item) => item.slug === slug);
  if (!lesson) {
    throw new Error(`Unknown Codex lesson slug: ${slug}`);
  }

  return {
    ...lesson,
    copy: copy.lessons[slug],
    figures: lesson.figureIds.map((id) => ({ manifest: CODEX_FIGURE_BY_ID[id], copy: copy.figures[id] })),
    quiz: lesson.quizIds.map((id) => ({ manifest: CODEX_QUIZ_BY_ID[id], copy: copy.quiz[id] })),
    sources: lesson.sourceIds.map((id) => CODEX_SOURCE_BY_ID[id]),
    practice: CODEX_PRACTICE_BY_LESSON[slug],
  };
}

export async function loadCodexCourse(locale: CodexLocale): Promise<MaterializedCodexCourse> {
  const copy = await loadCodexCopy(locale);
  const lessons = CODEX_COURSE_MANIFEST.lessons.map((lesson) => materializeLesson(copy, lesson.slug));

  return {
    locale,
    manifest: CODEX_COURSE_MANIFEST,
    copy,
    units: CODEX_COURSE_MANIFEST.units.map((unit) => ({
      ...unit,
      copy: copy.units[unit.id],
      lessons: unit.lessonSlugs.map((slug) => lessons.find((lesson) => lesson.slug === slug)!),
    })),
  };
}

export async function getCodexLesson(
  locale: CodexLocale,
  slug: CodexLessonSlug,
): Promise<MaterializedCodexLesson> {
  const copy = await loadCodexCopy(locale);
  return materializeLesson(copy, slug);
}
