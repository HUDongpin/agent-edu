/**
 * Shared, versioned contracts for Courses 16–21.
 *
 * Course data stays plain and serialisable so a Server Component can assemble it
 * at build time and pass only the interactive fragments to Client Components.
 */

export const COURSE_KIT_SCHEMA_VERSION = "course-kit.v1" as const;
export const COURSE_KIT_MANIFEST_SCHEMA_VERSION =
  "course-kit.manifest.v1" as const;
export const COURSE_KIT_SOURCE_SCHEMA_VERSION = "course-kit.source.v1" as const;
export const COURSE_KIT_COPY_SCHEMA_VERSION = "course-kit.copy.v1" as const;
export const COURSE_KIT_QUIZ_SCHEMA_VERSION = "course-kit.quiz.v1" as const;
export const COURSE_KIT_CAPSTONE_SCHEMA_VERSION =
  "course-kit.capstone.v1" as const;

export const COURSE_KIT_LOCALES = [
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

export const COURSE_KIT_CONTENT_LOCALES = ["en", "zh-Hans"] as const;
export const COURSE_KIT_FALLBACK_LOCALE = "en" as const;
export const COURSE_KIT_COURSE_NUMBERS = [16, 17, 18, 19, 20, 21] as const;
export const COURSE_KIT_COURSE_IDS = [
  "responsible-ai",
  "ai-research",
  "ai-python-data",
  "machine-learning",
  "deep-learning",
  "production-ai",
] as const;

export type CourseKitLocale = (typeof COURSE_KIT_LOCALES)[number];
export type CourseKitContentLocale =
  (typeof COURSE_KIT_CONTENT_LOCALES)[number];
export type CourseKitCourseNumber =
  (typeof COURSE_KIT_COURSE_NUMBERS)[number];
export type CourseKitCourseId = (typeof COURSE_KIT_COURSE_IDS)[number];
export type CourseKitDirection = "ltr" | "rtl";
export type CourseKitMilestoneCount = 12 | 14;
export type CourseKitModuleCount = 10 | 12;
export type CourseKitOptionIndex = 0 | 1 | 2 | 3;
export type CourseKitModuleCompletionMode =
  | "validated-artifact"
  | "self-attested";

export type CourseKitCriticalCategory =
  | "safety"
  | "provenance"
  | "leakage"
  | "human-authority"
  | "rollback"
  | "reproducibility";

export type CourseKitNonEmpty<T> = readonly [T, ...T[]];
export type CourseKitFourOptions<T = string> = readonly [T, T, T, T];
export type CourseKitTenModules<T> = readonly [
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
];
export type CourseKitTwelveModules<T> = readonly [
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
];

export type CourseKitSourceKind =
  | "open-standard"
  | "legal-policy"
  | "repository"
  | "community-issue"
  // Legacy aliases retained for Course Kit v1 definitions.
  | "normative-standard"
  | "law-or-regulation"
  | "official-guidance"
  | "official-documentation"
  | "research"
  | "technical-report"
  | "case-study"
  | "github-repository"
  | "social-post";

export type CourseKitSourceStability =
  | "immutable"
  | "historical-snapshot"
  // Legacy aliases retained for Course Kit v1 definitions.
  | "stable-concept"
  | "current-documentation"
  | "version-pinned"
  | "jurisdiction-and-date-bound"
  | "historical";

export type CourseKitEvidenceMode =
  | "source-grounded"
  | "instructional-synthesis"
  | "course-policy"
  | "version-watch";

export interface CourseKitImmutableSourceRef {
  readonly kind:
    | "versioned-url"
    | "release-tag"
    | "commit-sha"
    | "content-sha256";
  readonly value: string;
  readonly url?: string;
}

export type CourseKitReuseStatus =
  | "link-and-paraphrase-only"
  | "licence-noted-no-copy";

export interface CourseKitPhaseManifest<
  PhaseId extends string = string,
  ModuleSlug extends string = string,
> {
  readonly id: PhaseId;
  readonly order: number;
  readonly moduleSlugs: CourseKitNonEmpty<ModuleSlug>;
}

export interface CourseKitModuleManifest<
  ModuleSlug extends string = string,
  PhaseId extends string = string,
  SourceId extends string = string,
> {
  readonly slug: ModuleSlug;
  readonly order: number;
  readonly phaseId: PhaseId;
  readonly minutes: number;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  /** Explicit prerequisite edges. When omitted, legacy courses retain authored order only. */
  readonly prerequisiteModuleSlugs?: readonly ModuleSlug[];
  /** Stable artifact lineage produced and consumed by this module. */
  readonly producesArtifactIds?: CourseKitNonEmpty<string>;
  readonly consumesArtifactIds?: readonly string[];
  /** Module-specific evidence contract. Deep Learning v2 requires every field. */
  readonly artifactSchemaId?: string;
  readonly validatorId?: string;
  readonly validatorCommand?: string;
  readonly completionMode?: CourseKitModuleCompletionMode;
}

interface CourseKitManifestBase<
  CourseId extends string,
  ModuleSlug extends string,
  PhaseId extends string,
  SourceId extends string,
> {
  readonly schemaVersion: typeof COURSE_KIT_MANIFEST_SCHEMA_VERSION;
  readonly id: CourseId;
  /** Changing this invalidates only this course's saved progress. */
  readonly version: string;
  readonly displayNumber: CourseKitCourseNumber;
  readonly publishedOn: string;
  readonly contentLocales: typeof COURSE_KIT_CONTENT_LOCALES;
  readonly fallbackLocale: typeof COURSE_KIT_FALLBACK_LOCALE;
  readonly phases: CourseKitNonEmpty<
    CourseKitPhaseManifest<PhaseId, ModuleSlug>
  >;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
}

export type CourseKitManifest<
  CourseId extends string = string,
  ModuleSlug extends string = string,
  PhaseId extends string = string,
  SourceId extends string = string,
> =
  | (CourseKitManifestBase<CourseId, ModuleSlug, PhaseId, SourceId> & {
      readonly milestoneCount: 12;
      readonly modules: CourseKitTenModules<
        CourseKitModuleManifest<ModuleSlug, PhaseId, SourceId>
      >;
    })
  | (CourseKitManifestBase<CourseId, ModuleSlug, PhaseId, SourceId> & {
      readonly milestoneCount: 14;
      readonly modules: CourseKitTwelveModules<
        CourseKitModuleManifest<ModuleSlug, PhaseId, SourceId>
      >;
    });

export interface CourseKitSourceRecord<SourceId extends string = string> {
  readonly schemaVersion: typeof COURSE_KIT_SOURCE_SCHEMA_VERSION;
  readonly id: SourceId;
  readonly title: string;
  readonly publisher: string;
  /** Direct evidence URL; never only a search result or an aggregator record. */
  readonly url: string;
  readonly evidenceUrls: CourseKitNonEmpty<string>;
  /** Preferred timestamp for Course Kit v2 evidence. */
  readonly accessedAt?: string;
  /** Legacy date-only access record retained for Course Kit v1 definitions. */
  readonly accessedOn?: string;
  readonly publishedOn?: string;
  readonly revision?: string;
  readonly immutableRef?: CourseKitImmutableSourceRef;
  readonly jurisdiction?: string;
  readonly kind: CourseKitSourceKind;
  readonly stability: CourseKitSourceStability;
  readonly reuseStatus: CourseKitReuseStatus;
  readonly licence?: string;
  /** Course-local concept domains that this record grounds. */
  readonly conceptDomain: string;
  /** How the source was transformed into original instruction or evidence. */
  readonly transformation: string;
  /** Explicit reuse boundary, including what is not redistributed. */
  readonly rightsBoundary: string;
  /** The precise course claim or design decision supported by this source. */
  readonly supports: string;
  /** What the source does not establish, including date and product limits. */
  readonly boundary: string;
}

export interface CourseKitSourcePresentationLocales {
  readonly title: "en";
  readonly publisher: "en";
  readonly supports: CourseKitContentLocale;
  readonly boundary: CourseKitContentLocale;
  readonly conceptDomain: "en";
  readonly transformation: CourseKitContentLocale;
  readonly rightsBoundary: CourseKitContentLocale;
  readonly licence?: CourseKitContentLocale;
  readonly revision?: CourseKitContentLocale;
  readonly jurisdiction?: CourseKitContentLocale;
}

/** Source data after content-locale copy and source-language semantics are applied. */
export interface CourseKitMaterialisedSourceRecord
  extends CourseKitSourceRecord<string> {
  readonly presentationLocales: CourseKitSourcePresentationLocales;
}

export interface CourseKitSectionCopy<SourceId extends string = string> {
  readonly heading: string;
  readonly paragraphs: CourseKitNonEmpty<string>;
  readonly bullets?: CourseKitNonEmpty<string>;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  readonly evidenceMode: CourseKitEvidenceMode;
}

export interface CourseKitPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: CourseKitNonEmpty<string>;
  readonly deliverable: string;
  readonly reviewGate: string;
}

export interface CourseKitCheckpointCopy {
  readonly question: string;
  readonly options: CourseKitFourOptions;
  readonly correctIndex: CourseKitOptionIndex;
  readonly explanation: string;
}

export interface CourseKitModuleCopy<SourceId extends string = string> {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly sections: CourseKitNonEmpty<CourseKitSectionCopy<SourceId>>;
  readonly practice: CourseKitPracticeCopy;
  readonly checkpoint: CourseKitCheckpointCopy;
  readonly takeaway: string;
}

export interface CourseKitUiCopy {
  readonly catalog: string;
  readonly course: string;
  readonly module: string;
  readonly modules: string;
  readonly phases: string;
  readonly duration: string;
  readonly level: string;
  readonly audience: string;
  readonly prerequisite: string;
  readonly minutes: string;
  readonly startCourse: string;
  readonly resumeCourse: string;
  readonly courseMap: string;
  readonly curriculum: string;
  readonly curriculumIntro: string;
  readonly learningOutcomes: string;
  readonly principles: string;
  readonly evidenceRegister: string;
  readonly evidenceNote: string;
  readonly source: string;
  readonly sources: string;
  readonly sourceSupports: string;
  readonly sourceBoundary: string;
  readonly sourceConceptDomain: string;
  readonly sourceTransformation: string;
  readonly sourceRightsBoundary: string;
  readonly sourceLicence: string;
  readonly evidenceModeLabels: Readonly<Record<CourseKitEvidenceMode, string>>;
  readonly sourceKindLabels: Readonly<Record<CourseKitSourceKind, string>>;
  readonly sourceStabilityLabels: Readonly<Record<CourseKitSourceStability, string>>;
  readonly accessedOn: string;
  readonly objective: string;
  readonly artifact: string;
  readonly practice: string;
  readonly steps: string;
  readonly deliverable: string;
  readonly reviewGate: string;
  readonly checkpoint: string;
  readonly checkAnswer: string;
  readonly correct: string;
  readonly incorrect: string;
  readonly tryAgain: string;
  readonly takeaway: string;
  readonly courseProgress: string;
  readonly progressPosition: string;
  readonly milestonePosition: string;
  readonly storageUnavailable: string;
  readonly browserStorageNote: string;
  readonly localProgressBoundary: string;
  readonly resetProgress: string;
  readonly resetConfirm: string;
  readonly resetDone: string;
  readonly resetDoneMemory: string;
  readonly markModuleComplete: string;
  readonly markedModuleComplete: string;
  readonly moduleComplete: string;
  readonly completeCheckpointFirst: string;
  readonly completePrerequisitesFirst: string;
  readonly evidenceReceiptLabel: string;
  readonly evidenceReceiptPlaceholder: string;
  readonly evidenceReceiptHelp: string;
  readonly completeReceiptFirst: string;
  readonly savedInBrowser: string;
  readonly savedInMemory: string;
  readonly finalAssessment: string;
  readonly submitQuiz: string;
  readonly retryQuiz: string;
  readonly quizPassed: string;
  readonly quizNotPassed: string;
  readonly answerAllQuestions: string;
  readonly criticalQuestion: string;
  readonly criticalGateFailed: string;
  readonly questionPosition: string;
  readonly scorePosition: string;
  readonly bestScorePosition: string;
  readonly currentAttempt: string;
  readonly quizDraftRestored: string;
  readonly clearQuizDraft: string;
  readonly capstone: string;
  readonly capstoneArtifacts: string;
  readonly responsibleAiGate: string;
  readonly responsibleAiAssessmentIds: string;
  readonly responsibleAiArtifactIds: string;
  readonly capstoneEvidenceContract: string;
  readonly downloadArtifactSchema: string;
  readonly downloadValidator: string;
  readonly validatorCommand: string;
  readonly artifactDraftLabel: string;
  readonly artifactDraftPlaceholder: string;
  readonly artifactDraftHelp: string;
  readonly artifactReceiptHelp: string;
  readonly capstoneAttestation: string;
  readonly markCapstoneComplete: string;
  readonly capstoneComplete: string;
  readonly completeArtifactsFirst: string;
  readonly completeCourseFirst: string;
  readonly previous: string;
  readonly next: string;
  readonly backToCourse: string;
  readonly modulePosition: string;
  readonly phasePosition: string;
  readonly openCourseMap: string;
  readonly fallbackLanguageLabel: string;
  readonly dismissLanguageNotice: string;
}

export interface CourseKitCourseCopy<
  ModuleSlug extends string = string,
  PhaseId extends string = string,
  SourceId extends string = string,
  QuestionId extends string = string,
  ArtifactId extends string = string,
> {
  readonly schemaVersion: typeof COURSE_KIT_COPY_SCHEMA_VERSION;
  readonly locale: CourseKitContentLocale;
  readonly version: string;
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly prerequisite: string;
    readonly level: string;
    readonly duration: string;
    readonly startCta: string;
    readonly resumeCta: string;
    /** Accessible notice used when one of the seven non-content locales falls back. */
    readonly fallbackNotice: string;
    readonly evidenceNote: string;
  };
  readonly ui: CourseKitUiCopy;
  readonly principles: CourseKitNonEmpty<string>;
  readonly outcomes: CourseKitNonEmpty<string>;
  readonly phases: Readonly<
    Record<PhaseId, { readonly title: string; readonly summary: string }>
  >;
  readonly modules: Readonly<Record<ModuleSlug, CourseKitModuleCopy<SourceId>>>;
  readonly sourceAnnotations: Readonly<
    Record<SourceId, { readonly supports: string; readonly boundary: string }>
  >;
  readonly quiz: {
    readonly title: string;
    readonly intro: string;
    readonly questions: Readonly<
      Record<
        QuestionId,
        {
          readonly prompt: string;
          readonly options: CourseKitFourOptions;
          readonly explanation: string;
        }
      >
    >;
  };
  readonly capstone: {
    readonly title: string;
    readonly intro: string;
    readonly instructions: CourseKitNonEmpty<string>;
    /** Course 16's required horizontal acceptance rubric for Courses 17–21. */
    readonly responsibleAiRubric: readonly string[];
    readonly artifacts: Readonly<
      Record<
        ArtifactId,
        { readonly title: string; readonly description: string }
      >
    >;
    readonly attestation: string;
  };
}

export interface CourseKitQuizQuestion<
  QuestionId extends string = string,
  SourceId extends string = string,
  ModuleSlug extends string = string,
> {
  readonly id: QuestionId;
  /** Module whose competency this item assesses. */
  readonly moduleSlug?: ModuleSlug;
  readonly correctIndex: CourseKitOptionIndex;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  /** Every selected critical question must be correct in addition to the score gate. */
  readonly critical?: boolean;
  /** Machine-checkable reason this question is a fail-closed release item. */
  readonly criticalCategory?: CourseKitCriticalCategory;
  /** Course-owned capability dimensions assessed by a computational or diagnostic item. */
  readonly capabilityTags?: readonly string[];
  /** Distinguishes capability evidence from recall or title-matching questions. */
  readonly capabilityAssessmentMode?: "computational" | "diagnostic";
}

export interface CourseKitQuizForm<QuestionId extends string = string> {
  readonly id: string;
  readonly questionIds: readonly QuestionId[];
}

export type CourseKitThreeQuizForms<QuestionId extends string = string> = readonly [
  CourseKitQuizForm<QuestionId>,
  CourseKitQuizForm<QuestionId>,
  CourseKitQuizForm<QuestionId>,
];

export interface CourseKitQuiz<
  QuestionId extends string = string,
  SourceId extends string = string,
  ModuleSlug extends string = string,
> {
  readonly schemaVersion: typeof COURSE_KIT_QUIZ_SCHEMA_VERSION;
  readonly version: string;
  /** Courses 16–18 draw 12; Courses 19–21 draw 16. */
  readonly drawCount: 12 | 16;
  /** Courses 16–18 require 10; Courses 19–21 require 13. */
  readonly passCount: 10 | 13;
  readonly questions: CourseKitNonEmpty<
    CourseKitQuizQuestion<QuestionId, SourceId, ModuleSlug>
  >;
  /** Optional explicit, release-auditable assessment forms. */
  readonly forms?: CourseKitThreeQuizForms<QuestionId>;
}

export interface CourseKitCapstoneArtifact<
  ArtifactId extends string = string,
  SourceId extends string = string,
> {
  readonly id: ArtifactId;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  readonly required: true;
}

export interface CourseKitResponsibleAiCriterionMapping<
  QuestionId extends string = string,
  ArtifactId extends string = string,
> {
  readonly id: import("./responsible-ai-rubric").ResponsibleAiCriterionId;
  readonly questionIds: CourseKitNonEmpty<QuestionId>;
  readonly artifactIds: CourseKitNonEmpty<ArtifactId>;
}

export interface CourseKitResponsibleAiGate<
  QuestionId extends string = string,
  ArtifactId extends string = string,
> {
  readonly version: typeof import("./responsible-ai-rubric").RESPONSIBLE_AI_RUBRIC_VERSION;
  readonly criteria: readonly [
    CourseKitResponsibleAiCriterionMapping<QuestionId, ArtifactId>,
    CourseKitResponsibleAiCriterionMapping<QuestionId, ArtifactId>,
    CourseKitResponsibleAiCriterionMapping<QuestionId, ArtifactId>,
    CourseKitResponsibleAiCriterionMapping<QuestionId, ArtifactId>,
    CourseKitResponsibleAiCriterionMapping<QuestionId, ArtifactId>,
    CourseKitResponsibleAiCriterionMapping<QuestionId, ArtifactId>,
  ];
}

export interface CourseKitEvidenceContract {
  readonly schemaId: string;
  readonly schemaPath: string;
  readonly validatorId: string;
  readonly validatorPath: string;
  readonly validatorCommand: string;
}

export interface CourseKitLocalizationReviewExtension {
  readonly claimReviewStatus: "pending-human" | "approved-human";
  readonly paragraphCopySha256: string;
  readonly claimContractSha256: string;
  readonly boundary: string;
}

export interface CourseKitCapstone<
  ArtifactId extends string = string,
  SourceId extends string = string,
  QuestionId extends string = string,
> {
  readonly schemaVersion: typeof COURSE_KIT_CAPSTONE_SCHEMA_VERSION;
  readonly version: string;
  readonly artifacts: CourseKitNonEmpty<
    CourseKitCapstoneArtifact<ArtifactId, SourceId>
  >;
  readonly evidenceContract: CourseKitEvidenceContract;
  /** Optional non-credential reference-package check, separate from learner completion. */
  readonly referenceEvidenceContract?: CourseKitEvidenceContract;
  /** Required, fail-closed horizontal Course 16 acceptance mapping for Courses 17–21. */
  readonly responsibleAiGate?: CourseKitResponsibleAiGate<
    QuestionId,
    ArtifactId
  >;
}

export interface CourseKitContentCopy<
  ModuleSlug extends string = string,
  PhaseId extends string = string,
  SourceId extends string = string,
  QuestionId extends string = string,
  ArtifactId extends string = string,
> {
  readonly en: CourseKitCourseCopy<
    ModuleSlug,
    PhaseId,
    SourceId,
    QuestionId,
    ArtifactId
  >;
  readonly "zh-Hans": CourseKitCourseCopy<
    ModuleSlug,
    PhaseId,
    SourceId,
    QuestionId,
    ArtifactId
  >;
}

export interface CourseKitDefinition<
  CourseId extends string = string,
  ModuleSlug extends string = string,
  PhaseId extends string = string,
  SourceId extends string = string,
  QuestionId extends string = string,
  ArtifactId extends string = string,
> {
  readonly schemaVersion: typeof COURSE_KIT_SCHEMA_VERSION;
  readonly manifest: CourseKitManifest<
    CourseId,
    ModuleSlug,
    PhaseId,
    SourceId
  >;
  readonly sources: CourseKitNonEmpty<CourseKitSourceRecord<SourceId>>;
  readonly copy: CourseKitContentCopy<
    ModuleSlug,
    PhaseId,
    SourceId,
    QuestionId,
    ArtifactId
  >;
  readonly quiz: CourseKitQuiz<QuestionId, SourceId, ModuleSlug>;
  readonly capstone: CourseKitCapstone<ArtifactId, SourceId, QuestionId>;
  /** Optional extra candidate bytes that named-human localization review must bind. */
  readonly localizationReviewExtension?: CourseKitLocalizationReviewExtension;
}

export interface CourseKitLocaleResolution {
  readonly requestedLocale: CourseKitLocale;
  readonly shellDirection: CourseKitDirection;
  readonly contentLocale: CourseKitContentLocale;
  readonly contentDirection: "ltr";
  /** Locale segment used for a canonical URL when the requested copy falls back. */
  readonly canonicalLocale: CourseKitContentLocale;
  readonly isFallback: boolean;
  readonly contentLocales: typeof COURSE_KIT_CONTENT_LOCALES;
}

export interface CourseKitProgressClientConfig {
  readonly storageKey: "ae.progress";
  readonly courseId: string;
  readonly courseVersion: string;
  readonly progressPrefix: string;
  readonly progressVersionKey: string;
  readonly progressEvent: string;
  readonly resetEvent: string;
  readonly milestoneCount: CourseKitMilestoneCount;
  readonly moduleSlugs: readonly string[];
  readonly moduleContracts: readonly CourseKitModuleProgressContract[];
  readonly quizVersion: string;
  readonly capstoneVersion: string;
  readonly capstoneArtifactIds: readonly string[];
  readonly evidenceValidatorId: string;
  readonly evidenceValidatorCommandPrefix: string;
}

export interface CourseKitModuleProgressContract {
  readonly moduleSlug: string;
  readonly prerequisiteModuleSlugs: readonly string[];
  readonly producesArtifactIds: readonly string[];
  readonly consumesArtifactIds: readonly string[];
  readonly artifactSchemaId: string;
  readonly validatorId: string;
  readonly validatorCommand: string;
  readonly completionMode: CourseKitModuleCompletionMode;
  /** False only for backwards-compatible Course Kit v1 definitions. */
  readonly explicitlyDeclared: boolean;
}

export interface CourseKitMaterialisedPhase {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly moduleSlugs: readonly string[];
}

export interface CourseKitMaterialisedModule {
  readonly slug: string;
  readonly order: number;
  readonly phaseId: string;
  readonly phaseTitle: string;
  readonly minutes: number;
  readonly sourceIds: readonly string[];
  readonly prerequisiteModuleSlugs: readonly string[];
  readonly producesArtifactIds: readonly string[];
  readonly consumesArtifactIds: readonly string[];
  readonly artifactSchemaId?: string;
  readonly validatorId?: string;
  readonly validatorCommand?: string;
  readonly completionMode?: CourseKitModuleCompletionMode;
  readonly copy: CourseKitModuleCopy<string>;
  readonly previousSlug?: string;
  readonly nextSlug?: string;
}

export interface CourseKitMaterialisedQuizQuestion {
  readonly id: string;
  readonly moduleSlug?: string;
  readonly prompt: string;
  readonly options: CourseKitFourOptions;
  readonly correctIndex: CourseKitOptionIndex;
  readonly explanation: string;
  readonly sourceIds: readonly string[];
  readonly critical: boolean;
  readonly criticalCategory?: CourseKitCriticalCategory;
  readonly capabilityTags?: readonly string[];
  readonly capabilityAssessmentMode?: "computational" | "diagnostic";
}

export interface CourseKitMaterialisedCapstoneArtifact {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sourceIds: readonly string[];
}

export interface CourseKitMaterialisedCourse {
  readonly id: string;
  readonly version: string;
  readonly displayNumber: CourseKitCourseNumber;
  readonly publishedOn: string;
  readonly locale: CourseKitLocaleResolution;
  readonly copy: CourseKitCourseCopy<string, string, string, string, string>;
  readonly phases: readonly CourseKitMaterialisedPhase[];
  readonly modules: readonly CourseKitMaterialisedModule[];
  readonly sources: readonly CourseKitMaterialisedSourceRecord[];
  readonly quiz: {
    readonly version: string;
    readonly drawCount: 12 | 16;
    readonly passCount: 10 | 13;
    readonly title: string;
    readonly intro: string;
    readonly questions: readonly CourseKitMaterialisedQuizQuestion[];
    readonly forms?: CourseKitThreeQuizForms<string>;
  };
  readonly capstone: {
    readonly version: string;
    readonly title: string;
    readonly intro: string;
    readonly instructions: readonly string[];
    readonly responsibleAiRubric: readonly string[];
    readonly responsibleAiGate?: CourseKitResponsibleAiGate<string, string>;
    readonly evidenceContract: CourseKitCapstone["evidenceContract"];
    readonly referenceEvidenceContract?: CourseKitCapstone["referenceEvidenceContract"];
    readonly attestation: string;
    readonly artifacts: readonly CourseKitMaterialisedCapstoneArtifact[];
  };
  readonly progress: CourseKitProgressClientConfig;
}
