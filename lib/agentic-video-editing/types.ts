export const AGENTIC_VIDEO_EDITING_COURSE_ID = "agentic-video-editing" as const;
export const AGENTIC_VIDEO_EDITING_DEFAULT_CONTENT_LOCALE = "en" as const;

export const AGENTIC_VIDEO_EDITING_LOCALES = [
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

export const AGENTIC_VIDEO_EDITING_PHASE_IDS = [
  "define",
  "understand",
  "edit",
  "verify",
] as const;

export const AGENTIC_VIDEO_EDITING_MODULE_SLUGS = [
  "agentic-editing-contract",
  "media-ingest-provenance",
  "transcripts-shots-index",
  "semantic-analysis-director",
  "declarative-edit-plan",
  "deterministic-rendering",
  "agent-tools-mcp",
  "captions-audio-formats",
  "verification-human-review",
  "production-capstone",
] as const;

export const AGENTIC_VIDEO_EDITING_SYSTEM_ROLES = [
  "agent-system",
  "agent-ready-tool",
  "deterministic-automation",
  "media-engine",
  "human-control",
] as const;

export type AgenticVideoEditingLocale =
  (typeof AGENTIC_VIDEO_EDITING_LOCALES)[number];
export type AgenticVideoEditingPhaseId =
  (typeof AGENTIC_VIDEO_EDITING_PHASE_IDS)[number];
export type AgenticVideoEditingModuleSlug =
  (typeof AGENTIC_VIDEO_EDITING_MODULE_SLUGS)[number];
export type AgenticVideoEditingSystemRole =
  (typeof AGENTIC_VIDEO_EDITING_SYSTEM_ROLES)[number];

export type AgenticVideoEditingSourceKind =
  | "github-repository"
  | "x-post";

export type AgenticVideoEditingSourceRole =
  | "execution-engine"
  | "analysis-component"
  | "deterministic-automation"
  | "timeline-contract"
  | "agent-architecture"
  | "agent-tool-surface"
  | "quality-control"
  | "field-signal";

export type AgenticVideoEditingSourceStability =
  | "release-pinned"
  | "commit-pinned-at-cutoff"
  | "dated-field-signal";

export type AgenticVideoEditingReuseStatus =
  | "link-and-paraphrase-only"
  | "license-noted-no-code-copy";

export type AgenticVideoEditingXTextCompleteness =
  | "oembed-complete"
  | "oembed-truncated-repository-corroborated";

export type AgenticVideoEditingXVerificationStatus =
  | "identity-date-url-and-visible-text-verified"
  | "identity-date-url-verified-visible-text-truncated";

interface AgenticVideoEditingSourceBase {
  readonly id: string;
  readonly kind: AgenticVideoEditingSourceKind;
  readonly role: AgenticVideoEditingSourceRole;
  readonly title: string;
  readonly publisher: string;
  /** A direct claim-evidence URL, never a search-results page. */
  readonly url: string;
  readonly claimEvidenceUrls: readonly [string, ...string[]];
  readonly accessedOn: string;
  readonly publishedOn?: string;
  readonly stability: AgenticVideoEditingSourceStability;
  readonly revision?: string;
  /** Commit resolved from a release tag at the research cutoff. Tags remain descriptive, not immutable. */
  readonly resolvedCommit?: string;
  readonly versionAnchorUrl?: string;
  readonly license?: string;
  readonly reuseStatus: AgenticVideoEditingReuseStatus;
  readonly rightsDecision: string;
  readonly rightsDecisionZhHans: string;
  readonly supports: string;
  readonly supportsZhHans: string;
  readonly boundary: string;
  readonly boundaryZhHans: string;
}

export interface AgenticVideoEditingGithubSource
  extends AgenticVideoEditingSourceBase {
  readonly kind: "github-repository";
  readonly repository: `${string}/${string}`;
}

export interface AgenticVideoEditingXSource
  extends AgenticVideoEditingSourceBase {
  readonly kind: "x-post";
  readonly statusId: string;
  readonly authorIdentity: string;
  readonly authorRole: string;
  readonly threadContext: string;
  readonly mediaContext: string;
  readonly textCompleteness: AgenticVideoEditingXTextCompleteness;
  readonly verificationMethod: "x-official-oembed";
  readonly verifiedOn: string;
  readonly verificationStatus: AgenticVideoEditingXVerificationStatus;
  /** Separates repository-backed mechanisms from post-only author judgment. */
  readonly corroborationScope: string;
  readonly corroborationScopeZhHans: string;
  readonly corroboratingSourceIds: readonly [string, ...string[]];
}

export type AgenticVideoEditingSourceRecord =
  | AgenticVideoEditingGithubSource
  | AgenticVideoEditingXSource;

export interface AgenticVideoEditingPhaseManifest {
  readonly id: AgenticVideoEditingPhaseId;
  readonly order: number;
  readonly moduleSlugs: readonly AgenticVideoEditingModuleSlug[];
}

export interface AgenticVideoEditingModuleManifest {
  readonly slug: AgenticVideoEditingModuleSlug;
  readonly order: number;
  readonly phaseId: AgenticVideoEditingPhaseId;
  readonly minutes: number;
  readonly sourceIds: readonly [string, ...string[]];
  readonly systemRoles: readonly [
    AgenticVideoEditingSystemRole,
    ...AgenticVideoEditingSystemRole[],
  ];
}

export interface AgenticVideoEditingCourseManifest {
  readonly id: typeof AGENTIC_VIDEO_EDITING_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 20;
  readonly publishedOn: string;
  readonly researchCutoff: string;
  readonly defaultContentLocale: typeof AGENTIC_VIDEO_EDITING_DEFAULT_CONTENT_LOCALE;
  readonly phases: readonly AgenticVideoEditingPhaseManifest[];
  readonly modules: readonly AgenticVideoEditingModuleManifest[];
}

export type AgenticVideoEditingEvidenceMode =
  | "source-grounded"
  | "engineering-synthesis"
  | "version-watch";

export interface AgenticVideoEditingSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
  readonly sourceIds: readonly [string, ...string[]];
  readonly evidenceMode: AgenticVideoEditingEvidenceMode;
}

export interface AgenticVideoEditingPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly artifact: string;
  readonly reviewGate: string;
  readonly aiBoundary: string;
  readonly template: string;
}

export interface AgenticVideoEditingCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface AgenticVideoEditingModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly concepts: readonly [string, ...string[]];
  readonly sections: readonly [
    AgenticVideoEditingSectionCopy,
    AgenticVideoEditingSectionCopy,
    AgenticVideoEditingSectionCopy,
  ];
  readonly practice: AgenticVideoEditingPracticeCopy;
  readonly checkpoint: AgenticVideoEditingCheckpointCopy;
  readonly takeaway: string;
}

export interface AgenticVideoEditingFinalQuestionCopy
  extends AgenticVideoEditingCheckpointCopy {
  readonly id: string;
  readonly moduleTitle: string;
  readonly critical: boolean;
}

export interface AgenticVideoEditingCourseCopy {
  readonly meta: {
    readonly title: string;
    readonly shortTitle: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly prerequisite: string;
    readonly level: string;
    readonly duration: string;
    readonly startCta: string;
    readonly resumeCta: string;
    readonly translationNote: string;
    readonly evidenceNote: string;
  };
  readonly ui: Readonly<Record<string, string>>;
  readonly principles: readonly [string, string, string, string, string, string, string];
  readonly outcomes: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  readonly distinctions: readonly [
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
  ];
  readonly phases: Readonly<Record<AgenticVideoEditingPhaseId, {
    readonly title: string;
    readonly verb: string;
    readonly summary: string;
  }>>;
  readonly modules: Readonly<Record<
    AgenticVideoEditingModuleSlug,
    AgenticVideoEditingModuleCopy
  >>;
  readonly finalAssessment: {
    readonly title: string;
    readonly summary: string;
    readonly passPercent: 80;
    readonly questions: readonly [
      AgenticVideoEditingFinalQuestionCopy,
      ...AgenticVideoEditingFinalQuestionCopy[],
    ];
  };
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly artifacts: readonly [string, ...string[]];
    readonly completionStatement: string;
    readonly reviewQuestions: readonly [string, ...string[]];
  };
}

export interface MaterializedAgenticVideoEditingModule
  extends AgenticVideoEditingModuleManifest {
  readonly copy: AgenticVideoEditingModuleCopy;
  readonly sources: readonly AgenticVideoEditingSourceRecord[];
}

export interface MaterializedAgenticVideoEditingPhase
  extends AgenticVideoEditingPhaseManifest {
  readonly copy: AgenticVideoEditingCourseCopy["phases"][AgenticVideoEditingPhaseId];
  readonly modules: readonly MaterializedAgenticVideoEditingModule[];
}

export interface MaterializedAgenticVideoEditingCourse {
  readonly locale: AgenticVideoEditingLocale;
  readonly contentLocale: "en" | "zh-Hans";
  readonly contentDirection: "ltr";
  readonly manifest: AgenticVideoEditingCourseManifest;
  readonly copy: AgenticVideoEditingCourseCopy;
  readonly modules: readonly MaterializedAgenticVideoEditingModule[];
  readonly phases: readonly MaterializedAgenticVideoEditingPhase[];
}
