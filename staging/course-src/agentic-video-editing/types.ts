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
  "agent-tools-mcp",
  "captions-audio-formats",
  "deterministic-rendering",
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

export const AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID =
  "course20-verified-cut-v2" as const;
export const AGENTIC_VIDEO_EDITING_PROJECT_ID =
  "course20-synthetic-practicum-v2" as const;

export const AGENTIC_VIDEO_EDITING_LEARNING_PATHS = [
  "core",
  "builder-extension",
] as const;

export const AGENTIC_VIDEO_EDITING_ARTIFACT_STATUSES = [
  "draft",
  "valid",
  "blocked",
  "stale",
] as const;

export const AGENTIC_VIDEO_EDITING_ARTIFACT_IDS = [
  "creative-brief-responsibility-map",
  "media-manifest-provenance-quarantine",
  "evidence-index-transcript-shots",
  "candidate-segments-system-card",
  "edit-plan-v3-validation-approval",
  "plan-diff-independent-approval",
  "tool-policy-adversarial-recovery",
  "delivery-matrix-accessibility",
  "render-receipt-output-probe",
  "candidate-media-reference",
  "verification-repair-approval",
  "release-package-runbook-recovery",
  "release-decision-postmortem",
] as const;

export const AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS = [
  "creative-brief-responsibility-map",
  "media-manifest-provenance-quarantine",
  "evidence-index-transcript-shots",
  "candidate-segments-system-card",
  "edit-plan-v3-validation-approval",
  "plan-diff-independent-approval",
  "tool-policy-adversarial-recovery",
  "render-receipt-output-probe",
  "candidate-media-reference",
  "verification-repair-approval",
  "release-package-runbook-recovery",
  "release-decision-postmortem",
] as const satisfies readonly AgenticVideoEditingArtifactId[];

export const AGENTIC_VIDEO_EDITING_CRITICAL_CONTROL_IDS = [
  "rights-privacy-input-authority",
  "agent-tool-authority-indirect-injection",
  "delivery-semantic-caption-variant",
  "final-release-authority",
] as const;

export const AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION =
  "aicourse.course20.capstone-rubric.v1.2.0" as const;

export const AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS = [
  "authority-rights-privacy",
  "evidence-semantic-integrity",
  "plan-tool-execution-traceability",
  "delivery-captions-audio-accessibility",
  "verification-recovery-human-decision",
] as const;

export type AgenticVideoEditingLocale =
  (typeof AGENTIC_VIDEO_EDITING_LOCALES)[number];
export type AgenticVideoEditingPhaseId =
  (typeof AGENTIC_VIDEO_EDITING_PHASE_IDS)[number];
export type AgenticVideoEditingModuleSlug =
  (typeof AGENTIC_VIDEO_EDITING_MODULE_SLUGS)[number];
export type AgenticVideoEditingSystemRole =
  (typeof AGENTIC_VIDEO_EDITING_SYSTEM_ROLES)[number];
export type Course20LearningPath =
  (typeof AGENTIC_VIDEO_EDITING_LEARNING_PATHS)[number];
export type ArtifactStatus =
  (typeof AGENTIC_VIDEO_EDITING_ARTIFACT_STATUSES)[number];
export type AgenticVideoEditingArtifactId =
  (typeof AGENTIC_VIDEO_EDITING_ARTIFACT_IDS)[number];
export type AgenticVideoEditingArtifactContractId =
  AgenticVideoEditingArtifactId;
export type AgenticVideoEditingCriticalControlId =
  (typeof AGENTIC_VIDEO_EDITING_CRITICAL_CONTROL_IDS)[number];
export type AgenticVideoEditingCapstoneRubricDimensionId =
  (typeof AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS)[number];

export type AgenticVideoEditingSourceKind =
  | "github-repository"
  | "x-post"
  | "official-standard"
  | "official-documentation"
  | "regulatory-guidance"
  | "law-regulation"
  | "primary-research"
  | "dated-repository-issue"
  | "dated-official-web";

export type AgenticVideoEditingSourceRole =
  | "execution-engine"
  | "analysis-component"
  | "deterministic-automation"
  | "timeline-contract"
  | "agent-architecture"
  | "agent-tool-surface"
  | "quality-control"
  | "field-signal"
  | "protocol-specification"
  | "security-guidance"
  | "accessibility-standard"
  | "audio-standard"
  | "color-management"
  | "editorial-guidance"
  | "legal-guidance"
  | "media-provenance";

export type AgenticVideoEditingSourceUsage =
  | "claim-evidence"
  | "version-watch"
  | "field-signal-context"
  | "atlas-only";

export type AgenticVideoEditingSourceStability =
  | "release-pinned"
  | "commit-pinned-at-cutoff"
  | "dated-field-signal"
  | "fixed-standard"
  | "dated-observation";

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
  readonly verifiedAt?: string;
  readonly latestObservedVersion?: string;
  readonly latestObservedUrl?: string;
  readonly latestObservedOn?: string;
  readonly observedAt?: string;
  readonly observedState?: string;
  readonly observedBodySha256?: string;
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

export interface AgenticVideoEditingOfficialSource
  extends AgenticVideoEditingSourceBase {
  readonly kind:
    | "official-standard"
    | "official-documentation"
    | "regulatory-guidance"
    | "law-regulation"
    | "primary-research"
    | "dated-official-web";
  readonly jurisdiction?: string;
  readonly effectiveOn?: string;
}

export interface AgenticVideoEditingIssueSource
  extends AgenticVideoEditingSourceBase {
  readonly kind: "dated-repository-issue";
  readonly repository: `${string}/${string}`;
  readonly issueNumber: number;
}

export type AgenticVideoEditingSourceRecord =
  | AgenticVideoEditingGithubSource
  | AgenticVideoEditingXSource
  | AgenticVideoEditingOfficialSource
  | AgenticVideoEditingIssueSource;

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
  readonly instructionMinutes: number;
  readonly practiceMinutes: number;
  readonly checkpointMinutes: number;
  readonly extensionMinutes: number;
  /** @deprecated Equal to guided module minutes; retained for old UI adapters. */
  readonly coreMinutes: number;
  /** @deprecated Equal to optional builder-extension minutes. */
  readonly practicumMinutes: number;
  readonly productionLabAvailable: boolean;
  readonly objectiveId: string;
  readonly requires: readonly AgenticVideoEditingModuleSlug[];
  /** @deprecated Use `requires`. */
  readonly prerequisiteSlugs: readonly AgenticVideoEditingModuleSlug[];
  /** Artifact-level entry inputs derived from the canonical artifact DAG. */
  readonly inputArtifactIds: readonly AgenticVideoEditingArtifactId[];
  /** Artifacts whose current receipts this module is responsible for producing. */
  readonly outputArtifactIds: readonly [
    AgenticVideoEditingArtifactId,
    ...AgenticVideoEditingArtifactId[],
  ];
  /** Upstream semantic changes that invalidate this module's outputs/receipt. */
  readonly invalidatesOn: readonly AgenticVideoEditingArtifactId[];
  /** @deprecated Legacy producer-module view; use `inputArtifactIds`. */
  readonly requiredArtifactSlugs: readonly AgenticVideoEditingModuleSlug[];
  readonly artifactIds: readonly [
    AgenticVideoEditingArtifactId,
    ...AgenticVideoEditingArtifactId[],
  ];
  readonly artifactContractId: AgenticVideoEditingArtifactContractId;
  readonly finalQuestionId: string;
  readonly capstoneCriterionIds: readonly string[];
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
  readonly revisedOn: string;
  readonly researchCutoff: string;
  readonly coreGuidedMinutes: 750;
  readonly builderExtensionMinutes: number;
  readonly finalAssessmentMinutes: 30;
  readonly estimatedCapstoneMinutes: 240;
  readonly defaultContentLocale: typeof AGENTIC_VIDEO_EDITING_DEFAULT_CONTENT_LOCALE;
  readonly phases: readonly AgenticVideoEditingPhaseManifest[];
  readonly modules: readonly AgenticVideoEditingModuleManifest[];
}

export interface AgenticVideoEditingOutcomeCoverage {
  readonly outcomeIndex: number;
  readonly moduleSlugs: readonly [
    AgenticVideoEditingModuleSlug,
    ...AgenticVideoEditingModuleSlug[],
  ];
  readonly artifactContractIds: readonly [
    AgenticVideoEditingArtifactContractId,
    ...AgenticVideoEditingArtifactContractId[],
  ];
  readonly finalQuestionIds: readonly [string, ...string[]];
  readonly capstoneCriterionIds: readonly [string, ...string[]];
}

export type AgenticVideoEditingEvidenceMode =
  | "source-grounded"
  | "engineering-synthesis"
  | "course-policy"
  | "jurisdiction-dependent"
  | "dated-observation"
  | "official-standard"
  | "version-watch";

export type AgenticVideoEditingClaimSupport =
  | "direct"
  | "derived"
  | "course-policy";

export type AgenticVideoEditingClaimKind =
  | "implementation-fact"
  | "engineering-synthesis"
  | "course-fail-closed-policy"
  | "jurisdiction-dependent-guidance";

export interface AgenticVideoEditingClaimRecord {
  readonly id: string;
  readonly text: string;
  readonly textZhHans: string;
  readonly support: AgenticVideoEditingClaimSupport;
  readonly kind: AgenticVideoEditingClaimKind;
  readonly sourceIds: readonly string[];
  readonly boundary: string;
  readonly boundaryZhHans: string;
  readonly reviewedOn: string;
}

export interface AgenticVideoEditingClaimCopy {
  readonly id?: string;
  readonly text: string;
  readonly evidenceMode: AgenticVideoEditingEvidenceMode;
  readonly sourceIds: readonly string[];
}

export interface AgenticVideoEditingSectionCopy {
  readonly heading: string;
  readonly claimIds?: readonly [string, ...string[]];
  readonly paragraphs: readonly [
    AgenticVideoEditingClaimCopy,
    ...AgenticVideoEditingClaimCopy[],
  ];
  readonly bullets?: readonly [
    AgenticVideoEditingClaimCopy,
    ...AgenticVideoEditingClaimCopy[],
  ];
}

export interface AgenticVideoEditingPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly artifact: string;
  readonly reviewGate: string;
  readonly aiBoundary: string;
  readonly workedExample: string;
  readonly starter: string;
  readonly artifactFilename: string;
  readonly artifactContractId: AgenticVideoEditingArtifactContractId;
  readonly requiredDependencySlugs: readonly AgenticVideoEditingModuleSlug[];
  readonly acceptanceChecks: readonly [string, ...string[]];
  readonly estimatedMinutes: number;
  readonly reviewDecisionRequired?: boolean;
}

export interface AgenticVideoEditingOptionCopy {
  readonly id: string;
  readonly label: string;
  readonly feedback: string;
}

export interface AgenticVideoEditingCheckpointCopy {
  readonly question: string;
  readonly options: readonly [
    AgenticVideoEditingOptionCopy,
    AgenticVideoEditingOptionCopy,
    AgenticVideoEditingOptionCopy,
    AgenticVideoEditingOptionCopy,
  ];
  readonly correctOptionId: string;
  readonly explanation: string;
}

export interface AgenticVideoEditingModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly concepts: readonly [
    AgenticVideoEditingConceptCopy,
    ...AgenticVideoEditingConceptCopy[],
  ];
  readonly sections: readonly [
    AgenticVideoEditingSectionCopy,
    ...AgenticVideoEditingSectionCopy[],
  ];
  readonly corePractice: AgenticVideoEditingPracticeCopy;
  readonly productionPractice?: AgenticVideoEditingPracticeCopy;
  readonly checkpoint: AgenticVideoEditingCheckpointCopy;
  readonly takeaway: string;
}

export interface AgenticVideoEditingFinalQuestionCopy
  extends AgenticVideoEditingCheckpointCopy {
  readonly id: string;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly objectiveId: string;
  readonly sourceIds: readonly [string, ...string[]];
  readonly critical: boolean;
  readonly criticalControlId?: AgenticVideoEditingCriticalControlId;
}

export interface AgenticVideoEditingConceptCopy {
  readonly id: string;
  readonly term: string;
  readonly definition: string;
  readonly track: "core" | "builder-extension";
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
  readonly preflight: {
    readonly title: string;
    readonly summary: string;
    readonly terms: readonly [
      readonly [string, string],
      ...(readonly [string, string])[],
    ];
    readonly auditCore: {
      readonly title: string;
      readonly summary: string;
    };
    readonly productionPracticum: {
      readonly title: string;
      readonly summary: string;
      readonly localChecks: readonly [string, ...string[]];
    };
    readonly learnerOwnedExtension: string;
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
    readonly audit: AgenticVideoEditingCapstoneCopy;
    readonly production: AgenticVideoEditingCapstoneCopy;
  };
}

export interface AgenticVideoEditingCapstoneCriterionCopy {
  readonly id: string;
  readonly label: string;
  readonly moduleSlug?: AgenticVideoEditingModuleSlug;
}

export interface AgenticVideoEditingCapstoneCopy {
  readonly title: string;
  readonly summary: string;
  readonly scenario: string;
  readonly criteria: readonly [
    AgenticVideoEditingCapstoneCriterionCopy,
    ...AgenticVideoEditingCapstoneCriterionCopy[],
  ];
  readonly completionStatement: string;
  readonly reviewQuestions: readonly [string, ...string[]];
}

export interface Course20ArtifactIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface Course20ArtifactSubmission {
  readonly schemaVersion: "aicourse.course20.artifact-submission.v2";
  readonly artifactId: AgenticVideoEditingArtifactId;
  readonly projectSpecId: typeof AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID;
  readonly projectId: string;
  readonly path: Course20LearningPath;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly revision: number;
  readonly contentText: string;
  readonly contentSha256: string;
  /** Hash of only production-relevant fields; prose notes may change without invalidating media. */
  readonly semanticSha256: string;
  readonly dependencyArtifactHashes: Partial<
    Record<AgenticVideoEditingArtifactId, string>
  >;
  readonly validatorVersion: string;
  readonly validationReceipt: {
    readonly status: ArtifactStatus;
    readonly issues: readonly Course20ArtifactIssue[];
  };
  readonly receipt: ArtifactValidationReceipt;
  readonly reviewDecision?: {
    readonly decision: "approved" | "blocked" | "not-required";
    readonly boundArtifactSha256: string;
    readonly reviewerRole: string;
  };
}

export type AgenticVideoEditingArtifactFormat =
  | "json"
  | "yaml"
  | "markdown"
  | "media"
  | "directory-manifest"
  | "external-reference";

export interface AgenticVideoEditingArtifactContract {
  readonly id: AgenticVideoEditingArtifactId;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly filename: string;
  readonly format: AgenticVideoEditingArtifactFormat;
  readonly schemaId?: string;
  readonly validatorId?: string;
  readonly requiredForCapstone: boolean;
  readonly requiredForModuleCompletion: boolean;
  readonly dependsOn: readonly AgenticVideoEditingArtifactId[];
}

export interface ArtifactValidationReceipt {
  readonly artifactId: AgenticVideoEditingArtifactId;
  readonly contentSha256: string;
  readonly validatorId: string;
  readonly validatorVersion: string;
  readonly status: "valid" | "blocked";
  readonly issues: readonly string[];
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
