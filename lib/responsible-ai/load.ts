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
import { RESPONSIBLE_AI_COURSE } from "./definition";
import { RESPONSIBLE_AI_MODULES, type ResponsibleAiModuleSlug } from "./modules";

export function isResponsibleAiModuleSlug(value: string): value is ResponsibleAiModuleSlug {
  return RESPONSIBLE_AI_MODULES.some((module) => module.slug === value);
}

export { isCourseKitLocale as isResponsibleAiLocale };

export async function loadResponsibleAiCourse(
  locale: CourseKitLocale,
): Promise<CourseKitMaterialisedCourse> {
  return materialiseCourseKit(RESPONSIBLE_AI_COURSE, locale);
}

export async function getResponsibleAiModule(
  locale: CourseKitLocale,
  slug: ResponsibleAiModuleSlug,
): Promise<CourseKitMaterialisedModule> {
  const materialisedModule = materialiseCourseKitModule(
    materialiseCourseKit(RESPONSIBLE_AI_COURSE, locale),
    slug,
  );
  if (!materialisedModule) {
    throw new Error(`Unknown Responsible AI module: ${slug}`);
  }
  return materialisedModule;
}
