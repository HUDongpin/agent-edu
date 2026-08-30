import arCopy from "@/messages/rag/ar.json";
import deCopy from "@/messages/rag/de.json";
import enCopy from "@/messages/rag/en.json";
import esCopy from "@/messages/rag/es.json";
import frCopy from "@/messages/rag/fr.json";
import jaCopy from "@/messages/rag/ja.json";
import koCopy from "@/messages/rag/ko.json";
import zhHansCopy from "@/messages/rag/zh-Hans.json";
import zhHantCopy from "@/messages/rag/zh-Hant.json";
import { RAG_FIGURE_BY_ID } from "./figures";
import { RAG_COURSE_MANIFEST } from "./manifest";
import { RAG_SOURCE_BY_ID } from "./sources";
import {
  RAG_LESSON_SLUGS,
  RAG_LOCALES,
  type MaterializedRagCourse,
  type MaterializedRagLesson,
  type RagCourseCopy,
  type RagLessonSlug,
  type RagLocale,
} from "./types";

const COPY_BY_LOCALE = {
  en: enCopy,
  es: esCopy,
  fr: frCopy,
  de: deCopy,
  "zh-Hans": zhHansCopy,
  "zh-Hant": zhHantCopy,
  ja: jaCopy,
  ko: koCopy,
  ar: arCopy,
} as unknown as Readonly<Record<RagLocale, RagCourseCopy>>;

export function isRagLocale(value: string): value is RagLocale {
  return (RAG_LOCALES as readonly string[]).includes(value);
}

export function isRagLessonSlug(value: string): value is RagLessonSlug {
  return (RAG_LESSON_SLUGS as readonly string[]).includes(value);
}

function materializeLesson(slug: RagLessonSlug, courseCopy: RagCourseCopy): MaterializedRagLesson {
  const lesson = RAG_COURSE_MANIFEST.lessons.find((item) => item.slug === slug);
  if (!lesson) throw new Error(`Unknown RAG lesson slug: ${slug}`);

  return {
    ...lesson,
    copy: courseCopy.lessons[slug],
    sources: lesson.sourceIds.map((sourceId) => RAG_SOURCE_BY_ID[sourceId]),
    figure: RAG_FIGURE_BY_ID[lesson.figureId],
  };
}

export async function loadRagCourse(locale: RagLocale): Promise<MaterializedRagCourse> {
  const courseCopy = COPY_BY_LOCALE[locale];
  const lessons = RAG_COURSE_MANIFEST.lessons.map((lesson) => materializeLesson(lesson.slug, courseCopy));

  return {
    locale,
    contentLocale: locale,
    manifest: RAG_COURSE_MANIFEST,
    copy: courseCopy,
    units: RAG_COURSE_MANIFEST.units.map((unit) => ({
      ...unit,
      copy: courseCopy.units[unit.id],
      lessons: unit.lessonSlugs.map((slug) => lessons.find((lesson) => lesson.slug === slug)!),
    })),
  };
}

export async function getRagLesson(
  locale: RagLocale,
  slug: RagLessonSlug,
): Promise<MaterializedRagLesson> {
  return materializeLesson(slug, COPY_BY_LOCALE[locale]);
}
