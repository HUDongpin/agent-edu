export const PROMPT_SOURCE_SNAPSHOT_ON = "2026-08-24" as const;

export const PROMPT_SOURCE_IDS = [
  "dlai-prompt-engineering-course",
  "dlai-ai-prompting-for-everyone",
  "dlai-batch-course-announcement",
  "dlai-course-materials-policy",
  "openai-chatgpt-prompt-guide",
  "openai-prompt-evaluation-flywheel",
  "openai-latest-model-guidance",
  "openai-structured-outputs-guide",
  "anthropic-prompt-engineering-overview",
  "anthropic-prompting-best-practices",
  "google-prompt-design-strategies",
  "openai-model-spec-untrusted-data",
  "openai-agent-builder-safety",
  "anthropic-jailbreak-prompt-injection-mitigation",
  "microsoft-prompt-engineering-fundamentals",
  "microsoft-advanced-prompts",
  "dair-prompt-engineering-guide",
  "anthropic-interactive-prompt-tutorial",
] as const;

export const PROMPT_CLAIM_IDS = [
  "curriculum.guidelines-iteration-applications-chatbot",
  "curriculum.hands-on-experimentation",
  "modern.context-and-tools",
  "grounding.search-and-deep-research",
  "modern.model-comparison",
  "curriculum.consumer-versus-developer-prompting",
  "practice.summarize-infer-transform-expand",
  "copyright.direct-course-reuse-restricted",
  "publisher-guidance.cite-inspired-project-code",
  "prompt.scope-before-drafting",
  "prompt.context-instructions-constraints-output",
  "prompt.acceptance-criteria",
  "prompt.meta-prompting",
  "grounding.evidence-and-uncertainty-rules",
  "eval.analyze-measure-improve",
  "eval.representative-test-set",
  "eval.manual-failure-analysis",
  "eval.llm-judge-alignment",
  "modern.lean-outcome-first-prompts",
  "modern.structured-outputs",
  "modern.model-specific-validation",
  "eval.criteria-before-optimization",
  "architecture.prompting-is-not-a-universal-fix",
  "prompt.clear-specific-instructions",
  "prompt.zero-shot-and-few-shot",
  "prompt.positive-consistent-examples",
  "workflow.decompose-and-chain",
  "safety.untrusted-data-has-no-authority",
  "safety.format-untrusted-data-explicitly",
  "safety.scope-permissions-and-approval",
  "safety.application-tool-approvals-and-guardrails",
  "safety.least-privilege-and-injection-monitoring",
  "prompt.components-and-sandbox-practice",
  "model.outputs-vary-by-model-and-run",
  "prompt.templates-and-least-to-most",
  "taxonomy.prompt-elements-and-techniques",
  "taxonomy.retrieval-evaluation-and-risks",
  "tutorial.roles-boundaries-formatting-examples",
  "tutorial.unsupported-claims-complex-prompts-chaining",
] as const;

export type PromptSourceId = (typeof PROMPT_SOURCE_IDS)[number];
export type PromptClaimId = (typeof PROMPT_CLAIM_IDS)[number];
export type PromptSourceUrl = `https://${string}`;

export const PROMPT_COURSE_ID = "how-to-write-prompts" as const;

export const PROMPT_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
] as const;

export const PROMPT_UNIT_IDS = ["specify", "test", "system"] as const;

export const PROMPT_LESSON_SLUGS = [
  "prompts-are-specifications",
  "six-part-prompt",
  "instructions-and-data",
  "examples-and-contracts",
  "four-prompt-jobs",
  "evaluation-flywheel",
  "decompose-and-chain",
  "grounding-and-safety",
  "capstone-prompt-packet",
] as const;

export const PROMPT_FIGURE_KINDS = [
  "pipeline",
  "workbench",
  "authority",
  "few-shot",
  "four-jobs",
  "evaluation-loop",
  "chain",
  "evidence",
  "capstone",
] as const;

export type PromptLocale = (typeof PROMPT_LOCALES)[number];
export type PromptUnitId = (typeof PROMPT_UNIT_IDS)[number];
export type PromptLessonSlug = (typeof PROMPT_LESSON_SLUGS)[number];
export type PromptFigureKind = (typeof PROMPT_FIGURE_KINDS)[number];

export interface PromptUnitManifest {
  readonly id: PromptUnitId;
  readonly order: number;
  readonly lessonSlugs: readonly PromptLessonSlug[];
}

export interface PromptLessonManifest {
  readonly slug: PromptLessonSlug;
  readonly order: number;
  readonly unitId: PromptUnitId;
  readonly minutes: number;
  readonly figureKind: PromptFigureKind;
  readonly sourceIds: readonly [PromptSourceId, ...PromptSourceId[]];
}

export interface PromptCourseManifest {
  readonly id: typeof PROMPT_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 7;
  readonly publishedOn: string;
  readonly sourceSnapshotOn: typeof PROMPT_SOURCE_SNAPSHOT_ON;
  readonly finalQuizMinutes: 15;
  readonly units: readonly PromptUnitManifest[];
  readonly lessons: readonly PromptLessonManifest[];
}

export interface PromptSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
}

export interface PromptExampleCopy {
  readonly title: string;
  readonly weak: string;
  readonly text: string;
  readonly annotations: readonly [string, ...string[]];
}

export interface PromptFigureCopy {
  readonly kind: PromptFigureKind;
  readonly title: string;
  readonly caption: string;
  readonly alt: string;
  readonly labels: readonly [string, ...string[]];
}

export interface PromptPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly evidence: readonly [string, ...string[]];
  readonly safety: string;
}

export interface PromptCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface PromptFinalQuizQuestionCopy extends PromptCheckpointCopy {
  readonly id: string;
  readonly unitId: PromptUnitId;
  readonly difficulty: "application" | "analysis";
  readonly sourceId: PromptSourceId;
  readonly claimId: PromptClaimId;
  readonly misconceptions: readonly [string, string, string, string];
}

export interface PromptCapstoneRubricCopy {
  readonly id: string;
  readonly criterion: string;
  readonly critical: boolean;
  readonly score0: string;
  readonly score1: string;
  readonly score2: string;
}

export interface PromptLessonCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly [PromptSectionCopy, PromptSectionCopy, PromptSectionCopy];
  readonly prompt: PromptExampleCopy;
  readonly figure: PromptFigureCopy;
  readonly practice: PromptPracticeCopy;
  readonly checkpoint: PromptCheckpointCopy;
  readonly takeaway: string;
}

export interface PromptCourseCopy {
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly duration: string;
    readonly sourceNote: string;
    readonly modelNote: string;
    readonly startCta: string;
    readonly resumeCta: string;
  };
  readonly ui: Readonly<Record<string, string>>;
  readonly units: Readonly<Record<PromptUnitId, { readonly title: string; readonly summary: string }>>;
  readonly lessons: Readonly<Record<PromptLessonSlug, PromptLessonCopy>>;
  readonly finalQuiz: {
    readonly passScore: 7;
    readonly questions: readonly [
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
      PromptFinalQuizQuestionCopy,
    ];
  };
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly passScore: 8;
    readonly maxScore: 10;
    readonly rubric: readonly [
      PromptCapstoneRubricCopy,
      PromptCapstoneRubricCopy,
      PromptCapstoneRubricCopy,
      PromptCapstoneRubricCopy,
      PromptCapstoneRubricCopy,
    ];
    readonly required: readonly [string, ...string[]];
  };
}

export type PromptRasterAsset = {
  readonly webpPath: `/${string}.webp`;
  readonly pngPath: `/${string}.png`;
  readonly webpSha256: string;
  readonly pngSha256: string;
  readonly createdOn: "2026-08-23";
  readonly creator: "OpenAI image generation";
  readonly creationPrompt: string;
} & (
  | { readonly width: 1536; readonly height: 1024 }
  | { readonly width: 1280; readonly height: 853 }
);

export interface PromptFigureManifest {
  readonly kind: PromptFigureKind;
  readonly format: "semantic-html" | "original-raster-with-transcript";
  readonly status: "available";
  readonly raster: PromptRasterAsset | null;
}

export interface MaterializedPromptLesson extends PromptLessonManifest {
  readonly copy: PromptLessonCopy;
  readonly sources: readonly PromptSourceRecord[];
  readonly figure: PromptFigureManifest;
}

export interface MaterializedPromptUnit extends PromptUnitManifest {
  readonly copy: PromptCourseCopy["units"][PromptUnitId];
  readonly lessons: readonly MaterializedPromptLesson[];
}

export interface MaterializedPromptCourse {
  readonly locale: PromptLocale;
  readonly contentLocale: "en";
  readonly manifest: PromptCourseManifest;
  readonly copy: PromptCourseCopy;
  readonly units: readonly MaterializedPromptUnit[];
}

export interface PromptSourceRecord {
  readonly id: PromptSourceId;
  readonly tier: "primary" | "corroborating";
  readonly kind:
    | "official-course"
    | "official-announcement"
    | "official-policy"
    | "official-doc"
    | "official-github"
    | "community-github";
  readonly title: string;
  readonly publisher: string;
  readonly url: PromptSourceUrl;
  readonly exactAnchor: PromptSourceUrl;
  readonly supportingAnchors?: readonly PromptSourceUrl[];
  readonly accessedOn: typeof PROMPT_SOURCE_SNAPSHOT_ON;
  readonly verifiedOn: typeof PROMPT_SOURCE_SNAPSHOT_ON;
  readonly claimIds: readonly [PromptClaimId, ...PromptClaimId[]];
  readonly licence: "proprietary" | "site-terms" | "MIT" | "CC0-1.0" | "undeclared";
  readonly licenceUrl: PromptSourceUrl | null;
  /** Course content must be newly authored unless this boundary is link-only. */
  readonly reuse: "original-only" | "link-only";
  readonly currency: "current" | "time-sensitive" | "historical" | "mixed" | "legacy";
  readonly caveats: readonly [string, ...string[]];
  readonly note: string;
}
