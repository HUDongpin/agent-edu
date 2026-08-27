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
import { MACHINE_LEARNING_COURSE } from "./definition";
import {
  MACHINE_LEARNING_MODULES,
  type MachineLearningModuleSlug,
} from "./modules";

export function isMachineLearningModuleSlug(
  value: string,
): value is MachineLearningModuleSlug {
  return MACHINE_LEARNING_MODULES.some((module) => module.slug === value);
}

export { isCourseKitLocale as isMachineLearningLocale };

export async function loadMachineLearningCourse(
  locale: CourseKitLocale,
): Promise<CourseKitMaterialisedCourse> {
  return materialiseCourseKit(MACHINE_LEARNING_COURSE, locale);
}

export async function getMachineLearningModule(
  locale: CourseKitLocale,
  slug: MachineLearningModuleSlug,
): Promise<CourseKitMaterialisedModule> {
  const materialisedModule = materialiseCourseKitModule(
    materialiseCourseKit(MACHINE_LEARNING_COURSE, locale),
    slug,
  );
  if (!materialisedModule) {
    throw new Error(`Unknown Machine Learning module: ${slug}`);
  }
  return materialisedModule;
}
