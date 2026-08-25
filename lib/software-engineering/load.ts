import type { SoftwareEngineeringLocaleCopy } from "./types";
import { SOFTWARE_ENGINEERING_LESSONS, SOFTWARE_ENGINEERING_UNITS } from "./curriculum";
import { SOFTWARE_ENGINEERING_MEDIA_BY_ID } from "./figures";
import { SOFTWARE_ENGINEERING_SOURCE_BY_ID } from "./sources";
import {
  SOFTWARE_ENGINEERING_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_LOCALES,
  type MaterializedSoftwareEngineeringCourse,
  type MaterializedSoftwareEngineeringLesson,
  type SoftwareEngineeringLessonSlug,
  type SoftwareEngineeringLocale,
} from "./types";

type CopyModule = { default: SoftwareEngineeringLocaleCopy };

const COPY_LOADERS: Record<SoftwareEngineeringLocale, () => Promise<CopyModule>> = {
  en: () => import("@/messages/software-engineering/en.json") as Promise<CopyModule>,
  es: () => import("@/messages/software-engineering/es.json") as Promise<CopyModule>,
  fr: () => import("@/messages/software-engineering/fr.json") as Promise<CopyModule>,
  de: () => import("@/messages/software-engineering/de.json") as Promise<CopyModule>,
  "zh-Hans": () => import("@/messages/software-engineering/zh-Hans.json") as Promise<CopyModule>,
  "zh-Hant": () => import("@/messages/software-engineering/zh-Hant.json") as Promise<CopyModule>,
  ja: () => import("@/messages/software-engineering/ja.json") as Promise<CopyModule>,
  ko: () => import("@/messages/software-engineering/ko.json") as Promise<CopyModule>,
  ar: () => import("@/messages/software-engineering/ar.json") as Promise<CopyModule>,
};

export function isSoftwareEngineeringLocale(value: string): value is SoftwareEngineeringLocale {
  return (SOFTWARE_ENGINEERING_LOCALES as readonly string[]).includes(value);
}

export function isSoftwareEngineeringLessonSlug(value: string): value is SoftwareEngineeringLessonSlug {
  return (SOFTWARE_ENGINEERING_LESSON_SLUGS as readonly string[]).includes(value);
}

export async function loadSoftwareEngineeringCopy(
  locale: SoftwareEngineeringLocale,
): Promise<SoftwareEngineeringLocaleCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}

function materializeLesson(
  copy: SoftwareEngineeringLocaleCopy,
  slug: SoftwareEngineeringLessonSlug,
): MaterializedSoftwareEngineeringLesson {
  const lesson = SOFTWARE_ENGINEERING_LESSONS.find((entry) => entry.slug === slug);
  if (!lesson) throw new Error(`Unknown software-engineering lesson: ${slug}`);

  return {
    ...lesson,
    localizedTitle: copy.lessons[slug].title,
    sources: lesson.sourceIds.map((sourceId) => {
      const source = SOFTWARE_ENGINEERING_SOURCE_BY_ID[sourceId];
      if (!source) throw new Error(`Unknown software-engineering source: ${sourceId}`);
      return source;
    }),
    media: lesson.mediaIds.map((mediaId) => SOFTWARE_ENGINEERING_MEDIA_BY_ID[mediaId]),
  };
}

export async function loadSoftwareEngineeringCourse(
  locale: SoftwareEngineeringLocale,
): Promise<MaterializedSoftwareEngineeringCourse> {
  const copy = await loadSoftwareEngineeringCopy(locale);
  const lessons = SOFTWARE_ENGINEERING_LESSONS.map((lesson) => materializeLesson(copy, lesson.slug));

  return {
    locale,
    contentLocale: "en",
    copy,
    units: SOFTWARE_ENGINEERING_UNITS.map((unit) => ({
      ...unit,
      localizedTitle: copy.units[unit.id].title,
      lessons: unit.lessonSlugs.map((slug) => lessons.find((lesson) => lesson.slug === slug)!),
    })),
  };
}

export async function getSoftwareEngineeringLesson(
  locale: SoftwareEngineeringLocale,
  slug: SoftwareEngineeringLessonSlug,
): Promise<MaterializedSoftwareEngineeringLesson> {
  const copy = await loadSoftwareEngineeringCopy(locale);
  return materializeLesson(copy, slug);
}
