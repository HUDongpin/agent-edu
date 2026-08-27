export const AGENTIC_TEACHING_COURSE_ID = "ai-teaching" as const;
export const AGENTIC_TEACHING_DISPLAY_NUMBER = 18 as const;
export const AGENTIC_TEACHING_VERSION = "2026.08.26" as const;
export const AGENTIC_TEACHING_PUBLISHED_ON = "2026-08-26" as const;

export const AGENTIC_TEACHING_LOCALES = [
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

export const AGENTIC_TEACHING_REVIEWED_LOCALES = ["en", "zh-Hans"] as const;

export const AGENTIC_TEACHING_PHASE_IDS = [
  "frame",
  "design",
  "govern",
  "prove",
] as const;

export const AGENTIC_TEACHING_MODULE_SLUGS = [
  "agentic-teaching-boundaries",
  "learning-design-task-contracts",
  "teacher-copilot-workflows",
  "tutoring-feedback-agents",
  "multi-agent-inquiry",
  "knowledge-tools-mcp",
  "k12-safeguards",
  "higher-ed-integrity",
  "evals-learning-evidence",
  "pilot-capstone",
] as const;

export type AgenticTeachingLocale =
  (typeof AGENTIC_TEACHING_LOCALES)[number];
export type AgenticTeachingContentLocale =
  (typeof AGENTIC_TEACHING_REVIEWED_LOCALES)[number];
export type AgenticTeachingPhaseId =
  (typeof AGENTIC_TEACHING_PHASE_IDS)[number];
export type AgenticTeachingModuleSlug =
  (typeof AGENTIC_TEACHING_MODULE_SLUGS)[number];

export type AgenticTeachingSourceKind =
  | "github-repository"
  | "x-post"
  | "official-guidance"
  | "research";

export type AgenticTeachingSourceRole =
  | "inspectable-implementation"
  | "field-signal"
  | "governance-boundary"
  | "learning-evidence";

export type AgenticTeachingSourceStability =
  | "stable-concept"
  | "version-pinned"
  | "current-documentation"
  | "dated-post"
  | "jurisdiction-and-date-bound";

export type AgenticTeachingAudience = "k12" | "higher-ed";

export type AgenticTeachingReuseStatus =
  | "link-and-summarise"
  | "reuse-with-license-notice"
  | "link-only";

export interface BilingualText {
  readonly en: string;
  readonly "zh-Hans": string;
}

export interface AgenticTeachingSource {
  readonly id: string;
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly kind: AgenticTeachingSourceKind;
  readonly role: AgenticTeachingSourceRole;
  readonly stability: AgenticTeachingSourceStability;
  readonly accessedOn: string;
  readonly publishedOn?: string;
  readonly revision?: string;
  readonly license?: string;
  /** Every public claim must resolve to an inspectable first-party page. */
  readonly claimEvidenceUrls: readonly [string, ...string[]];
  readonly reuseStatus: AgenticTeachingReuseStatus;
  readonly rightsDecision: BilingualText;
  /** Required for X entries; rejected by the release validator when absent. */
  readonly statusId?: string;
  readonly authorIdentity?: string;
  readonly authorRole?: string;
  readonly threadContext?: string;
  readonly mediaContext?: string;
  /** First-party pages that independently bound or confirm an X announcement. */
  readonly corroboratingUrls?: readonly [string, ...string[]];
  readonly corroboratingSourceIds?: readonly [string, ...string[]];
  readonly supports: BilingualText;
  readonly boundary: BilingualText;
}

export type AgenticTeachingEvidenceMode =
  | "source-grounded"
  | "instructional-synthesis"
  | "field-signal"
  | "version-watch";

export interface AgenticTeachingSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
  readonly sourceIds: readonly [string, ...string[]];
  readonly evidenceMode: AgenticTeachingEvidenceMode;
}

export interface AgenticTeachingPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly artifact: string;
  readonly reviewGate: string;
  readonly starter: string;
  readonly rubric: AgenticTeachingArtifactRubric;
}

export interface AgenticTeachingArtifactRubric {
  /** Deterministic local completeness check, never a claim of instructional quality. */
  readonly minimumCharacters: number;
  readonly requiredLabels: readonly [string, string, ...string[]];
  readonly evidenceRequirements: readonly [string, ...string[]];
}

export interface AgenticTeachingOptionCopy {
  /** Locale-neutral scoring identity; visible wording is carried by `label`. */
  readonly id: string;
  readonly label: string;
}

export interface AgenticTeachingCheckpointCopy {
  readonly question: string;
  readonly options: readonly [
    AgenticTeachingOptionCopy,
    AgenticTeachingOptionCopy,
    AgenticTeachingOptionCopy,
    AgenticTeachingOptionCopy,
  ];
  readonly explanation: string;
}

export interface AgenticTeachingModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  /** Localised presentation of the machine-checkable manifest paths. */
  readonly audienceScenarios: Readonly<Record<AgenticTeachingAudience, string>>;
  readonly humanApprovalPoints: readonly [string, ...string[]];
  readonly noGoActions: readonly [string, ...string[]];
  readonly sections: readonly [
    AgenticTeachingSectionCopy,
    AgenticTeachingSectionCopy,
    AgenticTeachingSectionCopy,
  ];
  readonly practice: AgenticTeachingPracticeCopy;
  readonly checkpoint: AgenticTeachingCheckpointCopy;
  readonly takeaway: string;
}

export interface AgenticTeachingModuleManifest {
  readonly slug: AgenticTeachingModuleSlug;
  readonly order: number;
  readonly phaseId: AgenticTeachingPhaseId;
  readonly minutes: number;
  readonly sourceIds: readonly [string, ...string[]];
  readonly audiences: readonly [
    AgenticTeachingAudience,
    ...AgenticTeachingAudience[],
  ];
  readonly scenarios: Readonly<Record<AgenticTeachingAudience, string>>;
  readonly humanApprovalPoints: readonly [string, ...string[]];
  readonly noGoActions: readonly [string, ...string[]];
}

export interface AgenticTeachingPhaseManifest {
  readonly id: AgenticTeachingPhaseId;
  readonly order: number;
  readonly moduleSlugs: readonly [
    AgenticTeachingModuleSlug,
    ...AgenticTeachingModuleSlug[],
  ];
}

export interface AgenticTeachingCourseManifest {
  readonly id: typeof AGENTIC_TEACHING_COURSE_ID;
  readonly version: typeof AGENTIC_TEACHING_VERSION;
  readonly displayNumber: typeof AGENTIC_TEACHING_DISPLAY_NUMBER;
  readonly publishedOn: typeof AGENTIC_TEACHING_PUBLISHED_ON;
  readonly locales: typeof AGENTIC_TEACHING_LOCALES;
  readonly reviewedLocales: typeof AGENTIC_TEACHING_REVIEWED_LOCALES;
  readonly phases: readonly AgenticTeachingPhaseManifest[];
  readonly modules: readonly AgenticTeachingModuleManifest[];
}

export interface AgenticTeachingTrackCopy {
  readonly id: "k12" | "higher-ed";
  readonly title: string;
  readonly summary: string;
  readonly focus: readonly [string, ...string[]];
  readonly startingModule: AgenticTeachingModuleSlug;
}

export interface AgenticTeachingUiCopy {
  readonly catalog: string;
  readonly course: string;
  readonly module: string;
  readonly modules: string;
  readonly minutes: string;
  readonly phase: string;
  readonly audience: string;
  readonly prerequisite: string;
  readonly duration: string;
  readonly start: string;
  readonly resume: string;
  readonly courseMap: string;
  readonly tracks: string;
  readonly outcomes: string;
  readonly principles: string;
  readonly objective: string;
  readonly artifact: string;
  readonly evidence: string;
  readonly source: string;
  readonly sources: string;
  readonly supports: string;
  readonly boundary: string;
  readonly accessed: string;
  readonly practice: string;
  readonly steps: string;
  readonly reviewGate: string;
  readonly notebook: string;
  readonly notebookHelp: string;
  readonly checkpoint: string;
  readonly checkAnswer: string;
  readonly correct: string;
  readonly incorrect: string;
  readonly completeModule: string;
  readonly moduleCompleted: string;
  readonly checkpointFirst: string;
  readonly artifactFirst: string;
  readonly artifactReady: string;
  readonly artifactNeedsEvidence: string;
  readonly artifactLocaleNotice: string;
  readonly artifactRubric: string;
  readonly progress: string;
  readonly saveArtifact: string;
  readonly savedLocally: string;
  readonly storageUnavailable: string;
  readonly finalAssessment: string;
  readonly submitAssessment: string;
  readonly assessmentPassed: string;
  readonly assessmentNotPassed: string;
  readonly answerEveryQuestion: string;
  readonly capstone: string;
  readonly capstoneArtifacts: string;
  readonly attestation: string;
  readonly completeCapstone: string;
  readonly capstoneCompleted: string;
  readonly capstoneEvidenceReady: string;
  readonly capstoneEvidenceMissing: string;
  readonly capstonePrerequisites: string;
  readonly selfTrackingOnly: string;
  readonly previous: string;
  readonly next: string;
  readonly backToCourse: string;
  readonly fallbackLabel: string;
  readonly sourceRegister: string;
  readonly fieldSignal: string;
}

export interface AgenticTeachingQuizQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly [
    AgenticTeachingOptionCopy,
    AgenticTeachingOptionCopy,
    AgenticTeachingOptionCopy,
    AgenticTeachingOptionCopy,
  ];
  readonly explanation: string;
  readonly sourceIds: readonly [string, ...string[]];
  readonly critical?: boolean;
}

export interface AgenticTeachingCapstoneArtifact {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sourceIds: readonly [string, ...string[]];
  readonly moduleSlug: AgenticTeachingModuleSlug;
  readonly rubric: AgenticTeachingArtifactRubric;
}

export interface AgenticTeachingCourseCopy {
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly prerequisite: string;
    readonly level: string;
    readonly duration: string;
    readonly evidenceNote: string;
    readonly fallbackNotice: string;
    readonly credentialBoundary: string;
  };
  readonly ui: AgenticTeachingUiCopy;
  readonly phases: Readonly<
    Record<AgenticTeachingPhaseId, { readonly title: string; readonly summary: string }>
  >;
  readonly tracks: readonly [AgenticTeachingTrackCopy, AgenticTeachingTrackCopy];
  readonly principles: readonly [string, ...string[]];
  readonly outcomes: readonly [string, ...string[]];
  readonly modules: Readonly<
    Record<AgenticTeachingModuleSlug, AgenticTeachingModuleCopy>
  >;
  readonly quiz: {
    readonly title: string;
    readonly intro: string;
    readonly passNote: string;
    readonly questions: readonly [
      AgenticTeachingQuizQuestion,
      ...AgenticTeachingQuizQuestion[],
    ];
  };
  readonly capstone: {
    readonly title: string;
    readonly intro: string;
    readonly requiresFinalAssessment: true;
    readonly requiresCompletedModules: true;
    readonly instructions: readonly [string, ...string[]];
    readonly artifacts: readonly [
      AgenticTeachingCapstoneArtifact,
      ...AgenticTeachingCapstoneArtifact[],
    ];
    readonly attestation: string;
  };
}

export interface MaterializedAgenticTeachingModule
  extends AgenticTeachingModuleManifest {
  readonly copy: AgenticTeachingModuleCopy;
  readonly sources: readonly AgenticTeachingSource[];
}

export interface MaterializedAgenticTeachingPhase
  extends AgenticTeachingPhaseManifest {
  readonly copy: { readonly title: string; readonly summary: string };
  readonly modules: readonly MaterializedAgenticTeachingModule[];
}

export interface MaterializedAgenticTeachingCourse {
  readonly id: typeof AGENTIC_TEACHING_COURSE_ID;
  readonly version: typeof AGENTIC_TEACHING_VERSION;
  readonly displayNumber: typeof AGENTIC_TEACHING_DISPLAY_NUMBER;
  readonly publishedOn: typeof AGENTIC_TEACHING_PUBLISHED_ON;
  readonly locale: AgenticTeachingLocale;
  readonly contentLocale: AgenticTeachingContentLocale;
  readonly contentDirection: "ltr";
  readonly isFallback: boolean;
  readonly copy: AgenticTeachingCourseCopy;
  readonly phases: readonly MaterializedAgenticTeachingPhase[];
  readonly modules: readonly MaterializedAgenticTeachingModule[];
  readonly sources: readonly AgenticTeachingSource[];
}
