import {
  isCourseKitLocale,
  materialiseCourseKit,
  materialiseCourseKitModule,
} from "../course-kit/locale";
import type {
  CourseKitLocale,
  CourseKitMaterialisedCourse,
  CourseKitMaterialisedModule,
} from "../course-kit/types";
import { AI_RESEARCH_COURSE } from "./definition";
import { AI_RESEARCH_MODULES, type AiResearchModuleSlug } from "./modules";

export function isAiResearchModuleSlug(value: string): value is AiResearchModuleSlug {
  return AI_RESEARCH_MODULES.some((module) => module.slug === value);
}

export { isCourseKitLocale as isAiResearchLocale };

export async function loadAiResearchCourse(
  locale: CourseKitLocale,
): Promise<CourseKitMaterialisedCourse> {
  return materialiseCourseKit(AI_RESEARCH_COURSE, locale);
}

export async function getAiResearchModule(
  locale: CourseKitLocale,
  slug: AiResearchModuleSlug,
): Promise<CourseKitMaterialisedModule> {
  const materialisedModule = materialiseCourseKitModule(
    materialiseCourseKit(AI_RESEARCH_COURSE, locale),
    slug,
  );
  if (!materialisedModule) throw new Error(`Unknown AI Research module: ${slug}`);
  return materialisedModule;
}
