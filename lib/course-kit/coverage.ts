import type {
  CourseKitDefinition,
  CourseKitReviewedLocale,
} from "./types";

/**
 * An auditable bridge from a published course-level learning outcome to the
 * evidence and assessment contracts that make that outcome reviewable.
 */
export interface CourseKitCoverageRow {
  readonly outcomeId: string;
  readonly outcome: string;
  readonly moduleSlugs: readonly string[];
  readonly sourceIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly applicationArtifacts: readonly string[];
  readonly assessmentQuestionIds: readonly string[];
  readonly capstoneArtifactIds: readonly string[];
}

/**
 * Both released courses deliberately express broader outcomes than module
 * count. Keeping this map explicit prevents a new module or rewritten outcome
 * from silently inheriting an arbitrary assessment mapping.
 */
const OUTCOME_MODULE_POSITIONS: Readonly<Record<string, readonly (readonly number[])[]>> = {
  "responsible-ai": [[1], [2, 3], [4, 5], [6], [7, 8], [9], [10]],
  "agentic-quant-trading": [
    [1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12],
  ],
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function sharesSource(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const candidates = new Set(left);
  return right.some((sourceId) => candidates.has(sourceId));
}

export function buildCourseKitCoverageMatrix(
  definition: CourseKitDefinition,
  locale: CourseKitReviewedLocale = "en",
): readonly CourseKitCoverageRow[] {
  const positions = OUTCOME_MODULE_POSITIONS[definition.manifest.id];
  if (!positions) {
    throw new Error(`No outcome coverage contract for ${definition.manifest.id}.`);
  }
  const outcomes = definition.copy[locale].outcomes;
  if (positions.length !== outcomes.length) {
    throw new Error(
      `${definition.manifest.id} declares ${outcomes.length} outcomes but its coverage contract has ${positions.length} rows.`,
    );
  }

  return outcomes.map((outcome, outcomeIndex) => {
    const modules = positions[outcomeIndex].map((position) => {
      const moduleManifest = definition.manifest.modules[position - 1];
      if (!moduleManifest) {
        throw new Error(
          `${definition.manifest.id} outcome ${outcomeIndex + 1} maps to missing module position ${position}.`,
        );
      }
      return moduleManifest;
    });
    const moduleSlugs = modules.map((moduleManifest) => moduleManifest.slug);
    const sourceIds = unique(modules.flatMap((moduleManifest) => [...moduleManifest.sourceIds]));
    const assessmentQuestionIds = definition.quiz.questions
      .filter((question) => (
        moduleSlugs.some((slug) => question.id.startsWith(`q-${slug}-`))
        || sharesSource(question.sourceIds, sourceIds)
      ))
      .map((question) => question.id);
    const capstoneArtifactIds = definition.capstone.artifacts
      .filter((artifact) => sharesSource(artifact.sourceIds, sourceIds))
      .map((artifact) => artifact.id);

    return {
      outcomeId: `outcome-${outcomeIndex + 1}`,
      outcome,
      moduleSlugs,
      sourceIds,
      checkpointIds: moduleSlugs.map((slug) => `checkpoint:${slug}`),
      applicationArtifacts: modules.map(
        (moduleManifest) => definition.copy[locale].modules[moduleManifest.slug].practice.deliverable,
      ),
      assessmentQuestionIds,
      capstoneArtifactIds,
    };
  });
}

export function validateCourseKitCoverage(
  definition: CourseKitDefinition,
): readonly string[] {
  const issues: string[] = [];
  let english: readonly CourseKitCoverageRow[] = [];
  let chinese: readonly CourseKitCoverageRow[] = [];
  try {
    english = buildCourseKitCoverageMatrix(definition, "en");
    chinese = buildCourseKitCoverageMatrix(definition, "zh-Hans");
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  english.forEach((row, index) => {
    if (!row.outcome.trim()) issues.push(`${row.outcomeId} has no English outcome text.`);
    if (!chinese[index]?.outcome.trim()) issues.push(`${row.outcomeId} has no Simplified Chinese outcome text.`);
    if (!row.moduleSlugs.length) issues.push(`${row.outcomeId} maps to no module.`);
    if (!row.sourceIds.length) issues.push(`${row.outcomeId} maps to no evidence source.`);
    if (!row.checkpointIds.length) issues.push(`${row.outcomeId} maps to no module checkpoint.`);
    if (!row.applicationArtifacts.length) {
      issues.push(`${row.outcomeId} maps to no applied module artifact.`);
    }
    if (!row.assessmentQuestionIds.length && !row.capstoneArtifactIds.length) {
      issues.push(`${row.outcomeId} maps to neither a final-assessment question nor a capstone artifact.`);
    }
  });

  return issues;
}
