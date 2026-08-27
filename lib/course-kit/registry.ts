import { RESPONSIBLE_AI_COURSE } from "../responsible-ai";
import { AI_RESEARCH_COURSE } from "../ai-research";
import { AI_PYTHON_DATA_COURSE } from "../ai-python-data";
import { MACHINE_LEARNING_COURSE } from "../machine-learning";
import { DEEP_LEARNING_COURSE } from "../deep-learning";
import { PRODUCTION_AI_COURSE } from "../production-ai";
import type { CourseKitDefinition } from "./types";

/** The complete, locally available Course 16–21 registry in display order. */
export const COURSE_KIT_DEFINITIONS = [
  RESPONSIBLE_AI_COURSE,
  AI_RESEARCH_COURSE,
  AI_PYTHON_DATA_COURSE,
  MACHINE_LEARNING_COURSE,
  DEEP_LEARNING_COURSE,
  PRODUCTION_AI_COURSE,
] as const satisfies readonly CourseKitDefinition[];

export const COURSE_KIT_DEFINITION_BY_ID = new Map(
  COURSE_KIT_DEFINITIONS.map((definition) => [definition.manifest.id, definition] as const),
);

export const COURSE_KIT_PAGES = COURSE_KIT_DEFINITIONS.flatMap((definition) => [
  `${definition.manifest.id}/`,
  ...definition.manifest.modules.map(
    (moduleManifest) => `${definition.manifest.id}/${moduleManifest.slug}/`,
  ),
]);

export function isCourseKitPage(page: string): boolean {
  return COURSE_KIT_DEFINITIONS.some((definition) => (
    page === `${definition.manifest.id}/`
    || page.startsWith(`${definition.manifest.id}/`)
  ));
}
