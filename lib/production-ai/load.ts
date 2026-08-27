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
import { PRODUCTION_AI_COURSE } from "./definition";
import {
  PRODUCTION_AI_MODULES,
  type ProductionAiModuleSlug,
} from "./modules";

export function isProductionAiModuleSlug(
  value: string,
): value is ProductionAiModuleSlug {
  return PRODUCTION_AI_MODULES.some(
    (courseModule) => courseModule.slug === value,
  );
}

export { isCourseKitLocale as isProductionAiLocale };

export async function loadProductionAiCourse(
  locale: CourseKitLocale,
): Promise<CourseKitMaterialisedCourse> {
  return materialiseCourseKit(PRODUCTION_AI_COURSE, locale);
}

export async function getProductionAiModule(
  locale: CourseKitLocale,
  slug: ProductionAiModuleSlug,
): Promise<CourseKitMaterialisedModule> {
  const courseModule = materialiseCourseKitModule(
    materialiseCourseKit(PRODUCTION_AI_COURSE, locale),
    slug,
  );
  if (!courseModule) throw new Error(`Unknown Production AI module: ${slug}`);
  return courseModule;
}
