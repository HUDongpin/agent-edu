import { AGENTIC_TEACHING_COPY_EN } from "./copy/en";
import { AGENTIC_TEACHING_COPY_ZH_HANS } from "./copy/zh-Hans";
import { AGENTIC_TEACHING_COURSE_MANIFEST } from "./manifest";
import { AGENTIC_TEACHING_SOURCES, getAgenticTeachingSource } from "./sources";
import {
  AGENTIC_TEACHING_LOCALES,
  AGENTIC_TEACHING_MODULE_SLUGS,
  AGENTIC_TEACHING_REVIEWED_LOCALES,
  type AgenticTeachingContentLocale,
  type AgenticTeachingCourseCopy,
  type AgenticTeachingLocale,
  type AgenticTeachingModuleSlug,
  type MaterializedAgenticTeachingCourse,
  type MaterializedAgenticTeachingModule,
} from "./types";

export const AGENTIC_TEACHING_TRANSLATED_LOCALES =
  AGENTIC_TEACHING_REVIEWED_LOCALES;

/** Parsed by the repository-wide i18n release auditor; keep object keys literal. */
export const AGENTIC_TEACHING_COPY_BUNDLES = {
  en: AGENTIC_TEACHING_COPY_EN,
  "zh-Hans": AGENTIC_TEACHING_COPY_ZH_HANS,
} as const satisfies Readonly<
  Record<AgenticTeachingContentLocale, AgenticTeachingCourseCopy>
>;

export function isAgenticTeachingLocale(
  locale: string,
): locale is AgenticTeachingLocale {
  return (AGENTIC_TEACHING_LOCALES as readonly string[]).includes(locale);
}

export function isAgenticTeachingModuleSlug(
  slug: string,
): slug is AgenticTeachingModuleSlug {
  return (AGENTIC_TEACHING_MODULE_SLUGS as readonly string[]).includes(slug);
}

async function loadCopy(
  contentLocale: AgenticTeachingContentLocale,
): Promise<AgenticTeachingCourseCopy> {
  return AGENTIC_TEACHING_COPY_BUNDLES[contentLocale];
}

function resolveContentLocale(
  locale: AgenticTeachingLocale,
): AgenticTeachingContentLocale {
  return locale === "zh-Hans" ? "zh-Hans" : "en";
}

export async function loadAgenticTeachingCourse(
  locale: AgenticTeachingLocale,
): Promise<MaterializedAgenticTeachingCourse> {
  const contentLocale = resolveContentLocale(locale);
  const copy = await loadCopy(contentLocale);
  const modules: readonly MaterializedAgenticTeachingModule[] =
    AGENTIC_TEACHING_COURSE_MANIFEST.modules.map((courseModule) => ({
      ...courseModule,
      copy: copy.modules[courseModule.slug],
      sources: courseModule.sourceIds.map(getAgenticTeachingSource),
    }));

  const phases = AGENTIC_TEACHING_COURSE_MANIFEST.phases.map((phase) => ({
    ...phase,
    copy: copy.phases[phase.id],
    modules: phase.moduleSlugs.map((slug) => {
      const courseModule = modules.find((candidate) => candidate.slug === slug);
      if (!courseModule) throw new Error(`Unknown ai-teaching phase module: ${slug}`);
      return courseModule;
    }),
  }));

  return {
    id: AGENTIC_TEACHING_COURSE_MANIFEST.id,
    version: AGENTIC_TEACHING_COURSE_MANIFEST.version,
    displayNumber: AGENTIC_TEACHING_COURSE_MANIFEST.displayNumber,
    publishedOn: AGENTIC_TEACHING_COURSE_MANIFEST.publishedOn,
    locale,
    contentLocale,
    contentDirection: "ltr",
    isFallback: locale !== contentLocale,
    copy,
    phases,
    modules,
    sources: AGENTIC_TEACHING_SOURCES,
  };
}

export async function getAgenticTeachingModule(
  locale: AgenticTeachingLocale,
  slug: AgenticTeachingModuleSlug,
): Promise<MaterializedAgenticTeachingModule> {
  const course = await loadAgenticTeachingCourse(locale);
  const courseModule = course.modules.find((candidate) => candidate.slug === slug);
  if (!courseModule) throw new Error(`Unknown ai-teaching module: ${slug}`);
  return courseModule;
}
