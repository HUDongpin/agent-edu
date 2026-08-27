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
import { AI_PYTHON_DATA_COURSE } from "./definition";
import { AI_PYTHON_DATA_MODULES, type AiPythonDataModuleSlug } from "./modules";

export function isAiPythonDataModuleSlug(value: string): value is AiPythonDataModuleSlug {
  return AI_PYTHON_DATA_MODULES.some((module) => module.slug === value);
}

export { isCourseKitLocale as isAiPythonDataLocale };

export async function loadAiPythonDataCourse(
  locale: CourseKitLocale,
): Promise<CourseKitMaterialisedCourse> {
  return materialiseCourseKit(AI_PYTHON_DATA_COURSE, locale);
}

export async function getAiPythonDataModule(
  locale: CourseKitLocale,
  slug: AiPythonDataModuleSlug,
): Promise<CourseKitMaterialisedModule> {
  const materialisedModule = materialiseCourseKitModule(
    materialiseCourseKit(AI_PYTHON_DATA_COURSE, locale),
    slug,
  );
  if (!materialisedModule) {
    throw new Error(`Unknown AI Python & Data module: ${slug}`);
  }
  return materialisedModule;
}
