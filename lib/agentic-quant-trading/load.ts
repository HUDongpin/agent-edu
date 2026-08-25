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
import { AGENTIC_QUANT_TRADING_COURSE } from "./definition";
import {
  AGENTIC_QUANT_TRADING_MODULES,
  type AgenticQuantTradingModuleSlug,
} from "./modules";

export function isAgenticQuantTradingModuleSlug(
  value: string,
): value is AgenticQuantTradingModuleSlug {
  return AGENTIC_QUANT_TRADING_MODULES.some(
    (courseModule) => courseModule.slug === value,
  );
}

export { isCourseKitLocale as isAgenticQuantTradingLocale };

export async function loadAgenticQuantTradingCourse(
  locale: CourseKitLocale,
): Promise<CourseKitMaterialisedCourse> {
  return materialiseCourseKit(AGENTIC_QUANT_TRADING_COURSE, locale);
}

export async function getAgenticQuantTradingModule(
  locale: CourseKitLocale,
  slug: AgenticQuantTradingModuleSlug,
): Promise<CourseKitMaterialisedModule> {
  const courseModule = materialiseCourseKitModule(
    materialiseCourseKit(AGENTIC_QUANT_TRADING_COURSE, locale),
    slug,
  );
  if (!courseModule) {
    throw new Error(`Unknown Agentic Quant Trading module: ${slug}`);
  }
  return courseModule;
}
