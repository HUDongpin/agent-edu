import copy from "@/messages/prompts/en.json";
import { PROMPT_FIGURE_BY_KIND } from "./figures";
import { PROMPT_COURSE_MANIFEST } from "./manifest";
import { PROMPT_SOURCE_BY_ID } from "./sources";
import {
  PROMPT_LESSON_SLUGS,
  PROMPT_LOCALES,
  type MaterializedPromptCourse,
  type MaterializedPromptLesson,
  type PromptCourseCopy,
  type PromptLessonSlug,
  type PromptLocale,
} from "./types";

const ENGLISH_COPY = copy as unknown as PromptCourseCopy;

export function isPromptLocale(value: string): value is PromptLocale {
  return (PROMPT_LOCALES as readonly string[]).includes(value);
}

export function isPromptLessonSlug(value: string): value is PromptLessonSlug {
  return (PROMPT_LESSON_SLUGS as readonly string[]).includes(value);
}

function materializeLesson(slug: PromptLessonSlug): MaterializedPromptLesson {
  const lesson = PROMPT_COURSE_MANIFEST.lessons.find((item) => item.slug === slug);
  if (!lesson) throw new Error(`Unknown prompt lesson slug: ${slug}`);

  return {
    ...lesson,
    copy: ENGLISH_COPY.lessons[slug],
    sources: lesson.sourceIds.map((sourceId) => PROMPT_SOURCE_BY_ID[sourceId]),
    figure: PROMPT_FIGURE_BY_KIND[lesson.figureKind],
  };
}

export async function loadPromptCourse(locale: PromptLocale): Promise<MaterializedPromptCourse> {
  const lessons = PROMPT_COURSE_MANIFEST.lessons.map((lesson) => materializeLesson(lesson.slug));

  return {
    locale,
    contentLocale: "en",
    manifest: PROMPT_COURSE_MANIFEST,
    copy: ENGLISH_COPY,
    units: PROMPT_COURSE_MANIFEST.units.map((unit) => ({
      ...unit,
      copy: ENGLISH_COPY.units[unit.id],
      lessons: unit.lessonSlugs.map((slug) => lessons.find((lesson) => lesson.slug === slug)!),
    })),
  };
}

export async function getPromptLesson(
  locale: PromptLocale,
  slug: PromptLessonSlug,
): Promise<MaterializedPromptLesson> {
  void locale;
  return materializeLesson(slug);
}
