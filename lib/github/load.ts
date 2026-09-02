import { GITHUB_FIGURE_BY_ID } from "./figures";
import { GITHUB_COURSE_MANIFEST } from "./manifest";
import { GITHUB_QUIZ_BY_ID } from "./quiz";
import { GITHUB_SOURCE_BY_ID } from "./sources";
import {
  GITHUB_LESSON_SLUGS,
  GITHUB_LOCALES,
  type GithubCourseCopy,
  type GithubLessonSlug,
  type GithubLocale,
  type MaterializedGithubCourse,
  type MaterializedGithubLesson,
} from "./types";

type CopyModule = { default: GithubCourseCopy };

const COPY_LOADERS: Record<GithubLocale, () => Promise<CopyModule>> = {
  en: () =>
    import("@/messages/github/en.json") as unknown as Promise<CopyModule>,
  es: () =>
    import("@/messages/github/es.json") as unknown as Promise<CopyModule>,
  fr: () =>
    import("@/messages/github/fr.json") as unknown as Promise<CopyModule>,
  de: () =>
    import("@/messages/github/de.json") as unknown as Promise<CopyModule>,
  "zh-Hans": () =>
    import("@/messages/github/zh-Hans.json") as unknown as Promise<CopyModule>,
  "zh-Hant": () =>
    import("@/messages/github/zh-Hant.json") as unknown as Promise<CopyModule>,
  ja: () =>
    import("@/messages/github/ja.json") as unknown as Promise<CopyModule>,
  ko: () =>
    import("@/messages/github/ko.json") as unknown as Promise<CopyModule>,
  ar: () =>
    import("@/messages/github/ar.json") as unknown as Promise<CopyModule>,
};

export function isGithubLocale(value: string): value is GithubLocale {
  return (GITHUB_LOCALES as readonly string[]).includes(value);
}

export function isGithubLessonSlug(value: string): value is GithubLessonSlug {
  return (GITHUB_LESSON_SLUGS as readonly string[]).includes(value);
}

export async function loadGithubCopy(
  locale: GithubLocale,
): Promise<GithubCourseCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}

function materializeLesson(
  copy: GithubCourseCopy,
  slug: GithubLessonSlug,
): MaterializedGithubLesson {
  const lesson = GITHUB_COURSE_MANIFEST.lessons.find(
    (item) => item.slug === slug,
  );
  if (!lesson) throw new Error(`Unknown GitHub lesson slug: ${slug}`);

  const figureIds = lesson.sections.flatMap((section) => section.figureIds);

  return {
    ...lesson,
    copy: copy.lessons[slug],
    figures: figureIds.map((id) => ({
      manifest: GITHUB_FIGURE_BY_ID[id],
      copy: copy.figures[id],
    })),
    sources: lesson.sourceIds.map((id) => GITHUB_SOURCE_BY_ID[id]),
    quiz: lesson.quizIds.map((id) => ({
      ...GITHUB_QUIZ_BY_ID[id],
      copy: copy.quiz[id],
    })),
  };
}

export async function loadGithubCourse(
  locale: GithubLocale,
): Promise<MaterializedGithubCourse> {
  const copy = await loadGithubCopy(locale);
  const lessons = GITHUB_COURSE_MANIFEST.lessons.map((lesson) =>
    materializeLesson(copy, lesson.slug),
  );

  return {
    locale,
    manifest: GITHUB_COURSE_MANIFEST,
    copy,
    units: GITHUB_COURSE_MANIFEST.units.map((unit) => ({
      ...unit,
      copy: copy.units[unit.id],
      lessons: unit.lessonSlugs.map((slug) =>
        lessons.find((lesson) => lesson.slug === slug)!,
      ),
    })),
  };
}

export async function getGithubLesson(
  locale: GithubLocale,
  slug: GithubLessonSlug,
): Promise<MaterializedGithubLesson> {
  const copy = await loadGithubCopy(locale);
  return materializeLesson(copy, slug);
}
