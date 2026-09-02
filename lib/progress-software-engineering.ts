import {
  SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE,
  SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_PROGRESS_QUIZ,
} from "./progress-topology";

export const SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY =
  "softwareEngineering.assessmentDraft.v1" as const;
export const SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY =
  "softwareEngineering.capstoneDraft.v1" as const;

export const SOFTWARE_ENGINEERING_ASSESSMENT_ID = "final-assessment" as const;
export const SOFTWARE_ENGINEERING_CAPSTONE_ID = "capstone-checklist" as const;
export const SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG =
  "capstone-safe-change" as const;

export type SoftwareEngineeringProgressLessonSlug =
  (typeof SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS)[number];

export const SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS =
  SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS.filter(
    (slug) => slug !== SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG,
  );

export interface SoftwareEngineeringJourneyState {
  readonly completedLessonSlugs: readonly SoftwareEngineeringProgressLessonSlug[];
  readonly assessmentComplete: boolean;
  readonly capstoneComplete: boolean;
  /** A learner who already began a substantial draft resumes it before linear recommendations. */
  readonly assessmentDraftActive?: boolean;
  readonly capstoneDraftActive?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseUniqueKnownIds(
  value: unknown,
  allowedIds: ReadonlySet<string>,
): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const id of value) {
    if (typeof id !== "string" || seen.has(id) || !allowedIds.has(id)) return null;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Validate only the resumable shape needed by the shared progress island.
 * The full assessment decoder remains in the course module, keeping course
 * prompts, explanations, and source records out of the public progress graph.
 */
export function hasSoftwareEngineeringAssessmentDraftActivity(value: unknown): boolean {
  if (!isRecord(value)
    || value.version !== 1
    || value.bankVersion !== SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bankVersion
    || !Array.isArray(value.questionIds)
    || value.questionIds.length !== SOFTWARE_ENGINEERING_PROGRESS_QUIZ.questionCount
    || !Number.isInteger(value.questionIndex)
    || !isRecord(value.answerSelections)) {
    return false;
  }

  const questionIndex = value.questionIndex as number;
  if (questionIndex < 0 || questionIndex >= value.questionIds.length) return false;

  const bankQuestionIds = SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bankQuestionIds;
  const allowedIds = new Set<string>(bankQuestionIds);
  const unitCount = SOFTWARE_ENGINEERING_PROGRESS_QUIZ.questionCount
    / SOFTWARE_ENGINEERING_PROGRESS_QUIZ.questionsPerUnit;
  const bankQuestionsPerUnit = SOFTWARE_ENGINEERING_PROGRESS_QUIZ.bankSize / unitCount;
  if (!Number.isInteger(unitCount) || !Number.isInteger(bankQuestionsPerUnit)) return false;

  const seenIds = new Set<string>();
  const unitCounts = Array.from({ length: unitCount }, () => 0);
  for (const id of value.questionIds) {
    if (typeof id !== "string" || seenIds.has(id) || !allowedIds.has(id)) return false;
    seenIds.add(id);
    const bankIndex = bankQuestionIds.indexOf(id as never);
    unitCounts[Math.floor(bankIndex / bankQuestionsPerUnit)] += 1;
  }
  if (unitCounts.some(
    (count) => count !== SOFTWARE_ENGINEERING_PROGRESS_QUIZ.questionsPerUnit,
  )) return false;

  const answerSelections: Record<string, number> = {};
  for (const [id, selectedIndex] of Object.entries(value.answerSelections)) {
    const selectedQuestionIndex = value.questionIds.indexOf(id);
    if (selectedQuestionIndex < 0
      || selectedQuestionIndex > questionIndex
      || typeof selectedIndex !== "number"
      || !Number.isInteger(selectedIndex)
      || selectedIndex < 0
      || selectedIndex > 3) return false;
    answerSelections[id] = selectedIndex;
  }
  for (let index = 0; index < questionIndex; index += 1) {
    if (answerSelections[value.questionIds[index] as string] === undefined) return false;
  }

  const currentId = value.questionIds[questionIndex] as string;
  const currentAnswer = answerSelections[currentId];
  if (currentAnswer !== undefined) return value.selectedIndex === currentAnswer;
  return value.selectedIndex === null || (
    typeof value.selectedIndex === "number"
    && Number.isInteger(value.selectedIndex)
    && value.selectedIndex >= 0
    && value.selectedIndex <= 3
  );
}

export function hasSoftwareEngineeringCapstoneDraftActivity(value: unknown): boolean {
  if (!isRecord(value)
    || value.version !== 1
    || value.capstoneSchemaVersion !== SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.schemaVersion
    || typeof value.safetyBoundaryAttested !== "boolean") return false;

  const artifactIds = parseUniqueKnownIds(
    value.artifactIds,
    new Set<string>(SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.artifactIds),
  );
  const reviewedGateIds = parseUniqueKnownIds(
    value.reviewedGateIds,
    new Set<string>(SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.releaseGateIds),
  );
  if (!artifactIds || !reviewedGateIds) return false;
  if (value.score !== null && (
    typeof value.score !== "number"
    || !Number.isFinite(value.score)
  )) return false;
  if (value.decision !== "" && !SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.releaseDecisions.includes(
    value.decision as (typeof SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE.releaseDecisions)[number],
  )) return false;

  return artifactIds.length > 0
    || reviewedGateIds.length > 0
    || value.score !== null
    || value.decision !== ""
    || value.safetyBoundaryAttested;
}

function localeSegment(locale: string): string {
  return locale.replace(/^\/+|\/+$/g, "") || "en";
}

export function softwareEngineeringCourseHref(locale: string): string {
  return `/${localeSegment(locale)}/software-engineering/`;
}

export function softwareEngineeringLessonHref(
  locale: string,
  slug: SoftwareEngineeringProgressLessonSlug,
): string {
  return `${softwareEngineeringCourseHref(locale)}${slug}/`;
}

/** One recommendation contract for the dashboard, My Learning, and lesson pager. */
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

  return softwareEngineeringLessonHref(
    locale,
    SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS[0],
  );
}
