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
import { DEEP_LEARNING_COURSE } from "./definition";
import {
  DEEP_LEARNING_MODULES,
  type DeepLearningModuleSlug,
} from "./modules";

export function isDeepLearningModuleSlug(
  value: string,
): value is DeepLearningModuleSlug {
  return DEEP_LEARNING_MODULES.some(
    (courseModule) => courseModule.slug === value,
  );
}

export { isCourseKitLocale as isDeepLearningLocale };

export async function loadDeepLearningCourse(
  locale: CourseKitLocale,
): Promise<CourseKitMaterialisedCourse> {
  return materialiseCourseKit(DEEP_LEARNING_COURSE, locale);
}

export async function getDeepLearningModule(
  locale: CourseKitLocale,
  slug: DeepLearningModuleSlug,
): Promise<CourseKitMaterialisedModule> {
  const courseModule = materialiseCourseKitModule(
    materialiseCourseKit(DEEP_LEARNING_COURSE, locale),
    slug,
  );
  if (!courseModule) throw new Error(`Unknown Deep Learning module: ${slug}`);
  return courseModule;
}
