import { RESPONSIBLE_AI_COURSE } from "../responsible-ai";
import { AGENTIC_QUANT_TRADING_COURSE } from "../agentic-quant-trading";
import type { CourseKitDefinition } from "./types";

/** This independent branch's complete Course 16–17 registry in display order. */
export const COURSE_KIT_DEFINITIONS = [
  RESPONSIBLE_AI_COURSE,
  AGENTIC_QUANT_TRADING_COURSE,
] as const satisfies readonly CourseKitDefinition[];

export const COURSE_KIT_DEFINITION_BY_ID = new Map(
  COURSE_KIT_DEFINITIONS.map((definition) => [definition.manifest.id, definition] as const),
);

export const COURSE_KIT_PAGES = COURSE_KIT_DEFINITIONS.flatMap((definition) => [
  `${definition.manifest.id}/`,
  ...definition.manifest.modules.map(
    (moduleManifest) => `${definition.manifest.id}/${moduleManifest.slug}/`,
  ),
  ...(definition.manifest.id === "agentic-quant-trading"
    ? [
        `${definition.manifest.id}/assessment/`,
        `${definition.manifest.id}/capstone/`,
        `${definition.manifest.id}/sources/`,
      ]
    : []),
]);

export function isCourseKitPage(page: string): boolean {
  return COURSE_KIT_DEFINITIONS.some((definition) => (
    page === `${definition.manifest.id}/`
    || page.startsWith(`${definition.manifest.id}/`)
  ));
}
