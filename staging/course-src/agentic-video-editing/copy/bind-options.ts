import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "../manifest";
import { getAgenticVideoEditingArtifactContract } from "../artifact-contracts";
import { createCourse20ArtifactStarter } from "../contracts";
import {
  COURSE20_CHECKPOINT_BLUEPRINTS,
  COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
  type Course20OptionIds,
} from "../assessment-contract";
import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  type AgenticVideoEditingCheckpointCopy,
  type AgenticVideoEditingCourseCopy,
  type AgenticVideoEditingFinalQuestionCopy,
  type AgenticVideoEditingModuleCopy,
  type AgenticVideoEditingModuleSlug,
  type AgenticVideoEditingOptionCopy,
} from "../types";

type ContentLocale = "en" | "zh-Hans";
type RawOption = {
  /** Optional while drafting; the canonical ID is bound below. */
  readonly id?: string;
  readonly label: string;
  readonly feedback: string;
};
type RawOptions = readonly [RawOption, RawOption, RawOption, RawOption];
type RawCheckpoint = Omit<
  AgenticVideoEditingCheckpointCopy,
  "options" | "correctOptionId"
> & {
  readonly options: RawOptions;
  readonly correctIndex: 0 | 1 | 2 | 3;
};
type RawModule = Omit<AgenticVideoEditingModuleCopy, "checkpoint"> & {
  readonly checkpoint: RawCheckpoint;
};
type RawFinalQuestion = Omit<
  AgenticVideoEditingFinalQuestionCopy,
  "options" | "correctOptionId" | "moduleSlug" | "objectiveId" | "sourceIds" | "critical"
> & {
  readonly options: RawOptions;
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly moduleSlug?: AgenticVideoEditingModuleSlug;
  /** Authoring-only orientation; runtime rendering resolves the title from moduleSlug. */
  readonly moduleTitle?: string;
  readonly critical?: boolean;
};
type RawCourse = Omit<AgenticVideoEditingCourseCopy, "modules" | "finalAssessment"> & {
  readonly modules: Readonly<Record<AgenticVideoEditingModuleSlug, RawModule>>;
  readonly finalAssessment: Omit<AgenticVideoEditingCourseCopy["finalAssessment"], "questions"> & {
    readonly questions: readonly [RawFinalQuestion, ...RawFinalQuestion[]];
  };
};

const SECTION_CLAIMS = {
  "agentic-editing-contract": [
    ["m1-intent-before-mutation"],
    ["m1-misleading-edit-boundary"],
  ],
  "media-ingest-provenance": [
    ["m2-ffprobe-observation-boundary", "m2-c2pa-provenance-not-truth", "m2-exact-use-rights-policy"],
    ["m6-indirect-injection-authority", "m2-exact-use-rights-policy"],
  ],
  "transcripts-shots-index": [
    ["m3-rational-clocks"],
    ["m3-machine-evidence-needs-review"],
  ],
  "semantic-analysis-director": [
    ["m4-j-l-cut-definition"],
    ["m4-context-preservation"],
  ],
  "declarative-edit-plan": [
    ["m5-otio-not-renderer"],
    ["m5-production-compile-inputs"],
  ],
  "captions-audio-formats": [
    ["m7-caption-requirement", "m7-accessibility-applicability"],
    ["m7-loudness-destination-specific", "m7-color-transform-boundary"],
  ],
  "agent-tools-mcp": [
    ["m6-mcp-annotations-untrusted"],
    ["m6-indirect-injection-authority"],
  ],
  "deterministic-rendering": [
    ["m8-render-receipt-boundary"],
    ["m8-render-receipt-boundary"],
  ],
  "verification-human-review": [
    ["m9-qc-is-multidimensional"],
    ["m9-qc-is-multidimensional"],
  ],
  "production-capstone": [
    ["m10-handoff-recovery-closure"],
    ["m10-eu-article-50-boundary", "m10-usco-human-authorship-boundary", "m10-synthetic-media-course-boundary", "m10-do-not-publish-valid"],
  ],
} as const satisfies Readonly<Record<
  AgenticVideoEditingModuleSlug,
  readonly [readonly [string, ...string[]], readonly [string, ...string[]]]
>>;

function bindOptions(raw: RawOptions, ids: Course20OptionIds, context: string): readonly [
  AgenticVideoEditingOptionCopy,
  AgenticVideoEditingOptionCopy,
  AgenticVideoEditingOptionCopy,
  AgenticVideoEditingOptionCopy,
] {
  if (new Set(ids).size !== ids.length) throw new Error(`${context}: option IDs must be unique`);
  const bound = raw.map((option, index) => {
    const id = ids[index];
    if (option.id && option.id !== id) {
      throw new Error(`${context}: option ID ${option.id} drifted from ${id}`);
    }
    if (!option.label.trim() || !option.feedback.trim()) {
      throw new Error(`${context}/${id}: label and feedback are required`);
    }
    return { id, label: option.label, feedback: option.feedback };
  });
  return bound as unknown as readonly [
    AgenticVideoEditingOptionCopy,
    AgenticVideoEditingOptionCopy,
    AgenticVideoEditingOptionCopy,
    AgenticVideoEditingOptionCopy,
  ];
}

function assertCorrect(
  context: string,
  rawIndex: number,
  ids: Course20OptionIds,
  correctId: string,
): void {
  if (ids[rawIndex] !== correctId) {
    throw new Error(`${context}: editorial answer does not match ${correctId}`);
  }
}

/** Bind locale-neutral assessment identity after editorial copy is authored. */
export function bindAgenticVideoEditingOptions(
  raw: RawCourse,
  locale: ContentLocale,
): AgenticVideoEditingCourseCopy {
  const modules = Object.fromEntries(
    AGENTIC_VIDEO_EDITING_MODULE_SLUGS.map((slug) => {
      const moduleCopy = raw.modules[slug];
      const contract = COURSE20_CHECKPOINT_BLUEPRINTS[slug];
      const manifestModule = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
        (candidate) => candidate.slug === slug,
      )!;
      const artifactContract = getAgenticVideoEditingArtifactContract(
        manifestModule.artifactContractId,
      );
      const bindPractice = (
        practice: AgenticVideoEditingModuleCopy["corePractice"],
        track: "core" | "builder-extension",
      ) => ({
        ...practice,
        estimatedMinutes: track === "core"
          ? manifestModule.practiceMinutes
          : manifestModule.extensionMinutes,
        artifactFilename: artifactContract.filename,
        artifactContractId: artifactContract.id,
        starter: createCourse20ArtifactStarter(artifactContract.id),
        // Contracts own the executable example shape. Keeping this bound here
        // prevents editorial prose from drifting into a false-success sample.
        workedExample: createCourse20ArtifactStarter(artifactContract.id),
      });
      assertCorrect(`${locale}/${slug}`, moduleCopy.checkpoint.correctIndex, contract.optionIds, contract.correctOptionId);
      return [slug, {
        ...moduleCopy,
        corePractice: bindPractice(moduleCopy.corePractice, "core"),
        ...(moduleCopy.productionPractice
          ? { productionPractice: bindPractice(moduleCopy.productionPractice, "builder-extension") }
          : {}),
        sections: moduleCopy.sections.map((section, sectionIndex) => ({
          ...section,
          claimIds: SECTION_CLAIMS[slug][sectionIndex],
        })) as unknown as AgenticVideoEditingModuleCopy["sections"],
        checkpoint: {
          question: moduleCopy.checkpoint.question,
          options: bindOptions(moduleCopy.checkpoint.options, contract.optionIds, `${locale}/${slug}`),
          correctOptionId: contract.correctOptionId,
          explanation: moduleCopy.checkpoint.explanation,
        },
      }];
    }),
  ) as AgenticVideoEditingCourseCopy["modules"];

  const rawQuestionsByModule = new Map(
    raw.finalAssessment.questions.map((question) => [question.moduleSlug, question]),
  );
  const questions = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.map((manifestModule) => {
    const question = rawQuestionsByModule.get(manifestModule.slug);
    if (!question || !(manifestModule.finalQuestionId in COURSE20_FINAL_ASSESSMENT_BLUEPRINTS)) {
      throw new Error(`${locale}/${manifestModule.slug}: final question identity or coverage drift`);
    }
    const questionId = manifestModule.finalQuestionId as keyof typeof COURSE20_FINAL_ASSESSMENT_BLUEPRINTS;
    const contract = COURSE20_FINAL_ASSESSMENT_BLUEPRINTS[questionId];
    if (contract.moduleSlug !== manifestModule.slug
      || contract.objectiveId !== manifestModule.objectiveId
      || JSON.stringify(contract.sourceIds) !== JSON.stringify(manifestModule.sourceIds)) {
      throw new Error(`${locale}/${questionId}: canonical assessment contract drifted from the course manifest`);
    }
    assertCorrect(`${locale}/${questionId}`, question.correctIndex, contract.optionIds, contract.correctOptionId);
    return {
      id: questionId,
      moduleSlug: contract.moduleSlug,
      objectiveId: contract.objectiveId,
      sourceIds: contract.sourceIds,
      question: question.question,
      options: bindOptions(question.options, contract.optionIds, `${locale}/${questionId}`),
      correctOptionId: contract.correctOptionId,
      explanation: question.explanation,
      critical: contract.critical,
      ...("criticalControlId" in contract
        ? { criticalControlId: contract.criticalControlId }
        : {}),
    } satisfies AgenticVideoEditingFinalQuestionCopy;
  }) as unknown as AgenticVideoEditingCourseCopy["finalAssessment"]["questions"];

  const authoredCriteria = [
    ...raw.capstone.audit.criteria,
    ...raw.capstone.production.criteria,
  ];
  const criteria = AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS.map((artifactId) => {
    const criterion = authoredCriteria.find((candidate) => candidate.id === artifactId);
    if (!criterion) throw new Error(`${locale}/capstone: missing ${artifactId}`);
    return criterion;
  }) as unknown as AgenticVideoEditingCourseCopy["capstone"]["production"]["criteria"];
  const reviewQuestions = [...new Set([
    ...raw.capstone.audit.reviewQuestions,
    ...raw.capstone.production.reviewQuestions,
  ])] as unknown as AgenticVideoEditingCourseCopy["capstone"]["production"]["reviewQuestions"];
  const unifiedCapstone = {
    title: raw.capstone.production.title,
    summary: `${raw.capstone.audit.summary} ${raw.capstone.production.summary}`,
    scenario: raw.capstone.production.scenario,
    criteria,
    completionStatement: `${raw.capstone.audit.completionStatement} ${raw.capstone.production.completionStatement}`,
    reviewQuestions,
  } satisfies AgenticVideoEditingCourseCopy["capstone"]["production"];

  return {
    ...raw,
    modules,
    finalAssessment: { ...raw.finalAssessment, questions },
    // The earlier authoring files kept two editorial buckets. v1.2 materializes one
    // capstone contract and exposes the same unified object through both keys
    // only for a short-lived component compatibility boundary.
    capstone: { audit: unifiedCapstone, production: unifiedCapstone },
  };
}
