import {
  GROK_COURSE_MANIFEST,
  GROK_FIGURE_BY_ID,
  GROK_SOURCE_BY_ID,
} from "./data";
import {
  GROK_LESSON_SLUGS,
  GROK_LOCALES,
  type GrokCourseCopy,
  type GrokLessonSlug,
  type GrokLocale,
  type MaterializedGrokCourse,
  type MaterializedGrokLesson,
} from "./types";

type CopyModule = { default: GrokCourseCopy };

const COPY_LOADERS: Record<GrokLocale, () => Promise<CopyModule>> = {
  en: () => import("@/messages/grok/en.json") as Promise<CopyModule>,
  es: () => import("@/messages/grok/es.json") as Promise<CopyModule>,
  fr: () => import("@/messages/grok/fr.json") as Promise<CopyModule>,
  de: () => import("@/messages/grok/de.json") as Promise<CopyModule>,
  "zh-Hans": () => import("@/messages/grok/zh-Hans.json") as Promise<CopyModule>,
  "zh-Hant": () => import("@/messages/grok/zh-Hant.json") as Promise<CopyModule>,
  ja: () => import("@/messages/grok/ja.json") as Promise<CopyModule>,
  ko: () => import("@/messages/grok/ko.json") as Promise<CopyModule>,
  ar: () => import("@/messages/grok/ar.json") as Promise<CopyModule>,
};

export function isGrokLocale(value: string): value is GrokLocale {
  return (GROK_LOCALES as readonly string[]).includes(value);
}

export function isGrokLessonSlug(value: string): value is GrokLessonSlug {
  return (GROK_LESSON_SLUGS as readonly string[]).includes(value);
}

export async function loadGrokCopy(locale: GrokLocale): Promise<GrokCourseCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}

function materializeLesson(copy: GrokCourseCopy, slug: GrokLessonSlug): MaterializedGrokLesson {
  const lesson = GROK_COURSE_MANIFEST.lessons.find((candidate) => candidate.slug === slug);
  if (!lesson) throw new Error(`Unknown Grok lesson slug: ${slug}`);

  return {
    ...lesson,
    copy: copy.lessons[slug],
    figures: lesson.figureIds.map((id) => ({
      manifest: GROK_FIGURE_BY_ID[id],
      copy: copy.figures[id],
    })),
    sources: lesson.sourceIds.map((id) => GROK_SOURCE_BY_ID[id]),
  };
}

export async function loadGrokCourse(locale: GrokLocale): Promise<MaterializedGrokCourse> {
  const copy = await loadGrokCopy(locale);
  const lessons = GROK_COURSE_MANIFEST.lessons.map((lesson) =>
    materializeLesson(copy, lesson.slug),
  );

  return {
    locale,
    manifest: GROK_COURSE_MANIFEST,
    copy,
    units: GROK_COURSE_MANIFEST.units.map((unit) => ({
      ...unit,
      copy: copy.units[unit.id],
      lessons: unit.lessonSlugs.map((slug) =>
        lessons.find((lesson) => lesson.slug === slug)!,
      ),
    })),
  };
}

export async function getGrokLesson(
  locale: GrokLocale,
  slug: GrokLessonSlug,
): Promise<MaterializedGrokLesson> {
  const copy = await loadGrokCopy(locale);
  return materializeLesson(copy, slug);
}
