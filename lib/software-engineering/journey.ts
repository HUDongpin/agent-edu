import {
  SOFTWARE_ENGINEERING_LESSON_SLUGS,
  type SoftwareEngineeringLessonSlug,
} from "./types";

export const SOFTWARE_ENGINEERING_ASSESSMENT_ID = "final-assessment";
export const SOFTWARE_ENGINEERING_CAPSTONE_ID = "capstone-checklist";
export const SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG = "capstone-safe-change" satisfies SoftwareEngineeringLessonSlug;

export const SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS =
  SOFTWARE_ENGINEERING_LESSON_SLUGS.filter(
    (slug) => slug !== SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG,
  );

export interface SoftwareEngineeringJourneyState {
  readonly completedLessonSlugs: readonly SoftwareEngineeringLessonSlug[];
  readonly assessmentComplete: boolean;
  readonly capstoneComplete: boolean;
  /** A learner who already began a substantial draft resumes it before linear recommendations. */
  readonly assessmentDraftActive?: boolean;
  readonly capstoneDraftActive?: boolean;
}

function localeSegment(locale: string): string {
  return locale.replace(/^\/+|\/+$/g, "") || "en";
}

export function softwareEngineeringCourseHref(locale: string): string {
  return `/${localeSegment(locale)}/software-engineering/`;
}

export function softwareEngineeringLessonHref(
  locale: string,
  slug: SoftwareEngineeringLessonSlug,
): string {
  return `${softwareEngineeringCourseHref(locale)}${slug}/`;
}

/**
 * One recommendation contract for the dashboard, My Learning, and lesson pager.
 *
 * The capstone is both the eighteenth taught lesson and the final evidence
 * submission. Assessment therefore sits after the seventeen core lessons and
 * before the capstone lesson. Direct routes remain available; this function
 * only chooses the most useful next step.
 */
export function softwareEngineeringNextHref(
  locale: string,
  state: SoftwareEngineeringJourneyState,
): string {
  const completed = new Set(state.completedLessonSlugs);
  const courseHref = softwareEngineeringCourseHref(locale);
  const assessmentHref = `${courseHref}#${SOFTWARE_ENGINEERING_ASSESSMENT_ID}`;
  const capstoneHref = softwareEngineeringLessonHref(
    locale,
    SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG,
  );

  if (state.assessmentDraftActive && !state.assessmentComplete) return assessmentHref;
  if (state.capstoneDraftActive && !state.capstoneComplete) {
    return `${capstoneHref}#${SOFTWARE_ENGINEERING_CAPSTONE_ID}`;
  }

  const nextCoreLesson = SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS.find(
    (slug) => !completed.has(slug),
  );
  if (nextCoreLesson) return softwareEngineeringLessonHref(locale, nextCoreLesson);
  if (!state.assessmentComplete) return assessmentHref;
  if (!completed.has(SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG)) return capstoneHref;
  if (!state.capstoneComplete) return `${capstoneHref}#${SOFTWARE_ENGINEERING_CAPSTONE_ID}`;

  return softwareEngineeringLessonHref(locale, SOFTWARE_ENGINEERING_LESSON_SLUGS[0]);
}
