export const CODEX_COURSE_ID = "how-to-use-codex" as const;

export const CODEX_LOCALES = [
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

export const CODEX_UNIT_IDS = ["unit-1", "unit-2", "unit-3", "unit-4"] as const;

export const CODEX_LESSON_SLUGS = [
  "meet-codex",
  "task-contracts",
  "environments-permissions",
  "ground-plan",
  "implement-steer",
  "debug-test",
  "review-diff",
  "agents-skills",
  "cli",
  "ide",
  "cloud-parallel",
  "automation-capstone",
] as const;

export const CODEX_QUIZ_IDS = [
  "q01",
  "q02",
  "q03",
  "q04",
  "q05",
  "q06",
  "q07",
  "q08",
  "q09",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16",
  "q17",
  "q18",
  "q19",
  "q20",
  "q21",
  "q22",
  "q23",
  "q24",
] as const;

export const CODEX_FIGURE_IDS = [
  "fig-01",
  "fig-02",
  "fig-03",
  "fig-04",
  "fig-05",
  "fig-06",
  "fig-07",
  "fig-08",
  "fig-09",
  "fig-10",
  "fig-11",
  "fig-12",
  "fig-13",
  "fig-14",
  "fig-15",
  "fig-16",
  "fig-17",
  "fig-18",
  "fig-19",
  "fig-20",
  "fig-21",
  "fig-22",
  "fig-23",
  "fig-24",
] as const;

export const CODEX_PRODUCT_UI_CAPTURE_FIGURE_IDS = [
  "fig-13",
  "fig-14",
  "fig-15",
  "fig-16",
  "fig-17",
  "fig-22",
] as const;

export const CODEX_ORIGINAL_DIAGRAM_FIGURE_IDS = [
  "fig-01",
  "fig-02",
  "fig-03",
  "fig-04",
  "fig-05",
  "fig-06",
  "fig-07",
  "fig-08",
  "fig-09",
  "fig-10",
  "fig-11",
  "fig-12",
  "fig-18",
  "fig-19",
  "fig-20",
  "fig-21",
  "fig-23",
  "fig-24",
] as const;

export const CODEX_PRACTICE_IDS = [
  "practice-meet-codex",
  "practice-task-contracts",
  "practice-environments-permissions",
  "practice-ground-plan",
  "practice-implement-steer",
  "practice-debug-test",
  "practice-review-diff",
  "practice-agents-skills",
  "practice-cli",
  "practice-ide",
  "practice-cloud-parallel",
  "practice-automation-capstone",
] as const;

export const CODEX_SOURCE_IDS = [
  "openai-app",
  "openai-auth",
  "openai-quickstart",
  "openai-prompting",
  "openai-projects",
  "openai-agents-md",
  "openai-subagents",
  "openai-code-review",
  "openai-build-skills",
  "openai-hooks",
  "openai-permissions",
  "openai-automations",
  "openai-environment-modes",
  "openai-local-environment",
  "openai-cloud-environment",
  "openai-worktrees",
  "openai-github-action",
  "openai-noninteractive",
  "openai-developer-commands",
  "openai-long-running-work",
  "openai-integrated-terminal",
  "openai-cli",
  "openai-ide",
  "openai-cloud",
  "github-openai-codex",
  "github-openai-cookbook",
  "github-openai-codex-action",
  "github-spec-kit",
  "github-superpowers",
  "github-agents-md",
  "github-openspec",
] as const;

export type CodexLocale = (typeof CODEX_LOCALES)[number];
export type CodexUnitId = (typeof CODEX_UNIT_IDS)[number];
export type CodexLessonSlug = (typeof CODEX_LESSON_SLUGS)[number];
export type CodexQuizId = (typeof CODEX_QUIZ_IDS)[number];
export type CodexFigureId = (typeof CODEX_FIGURE_IDS)[number];
export type CodexPracticeId = (typeof CODEX_PRACTICE_IDS)[number];
export type CodexSourceId = (typeof CODEX_SOURCE_IDS)[number];
export type CodexOfficialDocSourceId = Extract<CodexSourceId, `openai-${string}`>;

export interface CodexUnitManifest {
  readonly id: CodexUnitId;
  readonly order: number;
  readonly lessonSlugs: readonly CodexLessonSlug[];
}

/**
 * Language-neutral lesson composition. Copy is resolved from the locale table;
 * executable HTML is deliberately not part of the content contract.
 */
export type CodexBlock =
  | { readonly type: "prose"; readonly sectionIndex: 0 | 1 | 2 }
  | { readonly type: "steps"; readonly copyKey: string }
  | { readonly type: "code"; readonly language: string; readonly code: string }
  | { readonly type: "callout"; readonly copyKey: string; readonly tone: "note" | "warning" | "success" }
  | { readonly type: "comparison"; readonly copyKey: string; readonly columns: readonly string[] }
  | { readonly type: "figure"; readonly figureId: CodexFigureId }
  | { readonly type: "exercise"; readonly practiceId: CodexPracticeId }
  | { readonly type: "source-note"; readonly sourceIds: readonly CodexSourceId[] };

export interface CodexLessonManifest {
  readonly slug: CodexLessonSlug;
  readonly order: number;
  readonly unitId: CodexUnitId;
  readonly minutes: number;
  readonly durationMinutes: number;
  readonly prerequisites: readonly CodexLessonSlug[];
  readonly objectiveKeys: readonly string[];
  readonly blocks: readonly [CodexBlock, ...CodexBlock[]];
  readonly sourceIds: readonly CodexSourceId[];
  readonly practiceId: CodexPracticeId;
  readonly quizIds: readonly [CodexQuizId, ...CodexQuizId[]];
  readonly quizTags: readonly string[];
  readonly figureIds: readonly [CodexFigureId, ...CodexFigureId[]];
}

export interface CodexCourseManifest {
  readonly id: typeof CODEX_COURSE_ID;
  readonly version: string;
  readonly publishedOn: string;
  readonly sourceSnapshotOn: string;
  readonly units: readonly CodexUnitManifest[];
  readonly lessons: readonly CodexLessonManifest[];
}

interface CodexSourceRecordBase {
  readonly id: CodexSourceId;
  readonly tier: "primary" | "corroborating";
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly accessedOn: string;
  readonly verifiedAt: string;
  readonly exactAnchor: string;
  readonly supportingAnchors?: readonly string[];
  readonly latestObservedRelease: string | null;
  readonly claimIds: readonly string[];
  readonly reuseMode: "paraphrased" | "asset-reused" | "link-only";
  readonly note: string;
}

export interface CodexOfficialDocSource extends CodexSourceRecordBase {
  readonly kind: "official-doc";
  readonly verifiedRevision?: never;
  readonly stars?: never;
  readonly starsSnapshotOn?: never;
  readonly license?: never;
}

export interface CodexGitHubSource extends CodexSourceRecordBase {
  readonly kind: "official-github" | "community-github";
  /** Immutable commit whose linked evidence files were reviewed. */
  readonly verifiedRevision: string;
  readonly stars: number;
  readonly starsSnapshotOn: string;
  readonly license: string;
}

export type CodexSourceRecord = CodexOfficialDocSource | CodexGitHubSource;

export interface CodexPracticeManifest {
  readonly id: CodexPracticeId;
  readonly lessonSlug: CodexLessonSlug;
  readonly estimatedMinutes: number;
  readonly workspace: "disposable" | "personal-repository" | "either";
  readonly requiresWriteAccess: boolean;
  readonly evidenceItems: number;
  readonly promptKey: string;
  readonly observableActionCount: number;
  readonly selfCheckCriteriaCount: number;
  readonly completionKey: `codex.lesson.${CodexLessonSlug}`;
}

export interface CodexQuizManifest {
  readonly id: CodexQuizId;
  readonly lessonSlug: CodexLessonSlug;
  readonly unitId: CodexUnitId;
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly sourceIds: readonly CodexSourceId[];
}

interface CodexFigureManifestBase {
  readonly id: CodexFigureId;
  readonly lessonSlug: CodexLessonSlug;
  readonly surface: "app" | "cli" | "ide" | "cloud" | "github";
  readonly altKey: `figures.${CodexFigureId}.alt`;
  readonly captionKey: `figures.${CodexFigureId}.caption`;
  readonly privacyChecklist: readonly string[];
  readonly callouts?: readonly CodexFigureCallout[];
}

export interface CodexFigureCallout {
  readonly id: string;
  readonly labelKey: string;
  readonly xPercent: number;
  readonly yPercent: number;
}

export const CODEX_FIGURE_AUDIT_SCHEMA = "aicourse.codex.figure-audits.v1" as const;
export const CODEX_FIGURE_OCR_CHECKLIST_VERSION = "codex-figure-ocr.v1" as const;
export const CODEX_FIGURE_METADATA_CHECKLIST_VERSION = "codex-figure-metadata.v1" as const;
export const CODEX_FIGURE_PRIVACY_CHECKLIST_VERSION = "codex-figure-privacy.v2" as const;

export const CODEX_FIGURE_OCR_CHECK_IDS = [
  "noPersonalPaths",
  "noEmailAddresses",
  "noSecretsOrTokens",
  "noRemoteRepositoryUrls",
  "noRealNamesOrAccountIdentifiers",
  "noCustomerOrPrivateRepositoryData",
  "visibleTextMatchesSyntheticScenario",
] as const;

export const CODEX_FIGURE_METADATA_CHECK_IDS = [
  "metadataStripped",
  "noExifOrXmp",
  "noGpsCoordinates",
  "noAuthorOrDeviceIdentifiers",
  "noEmbeddedThumbnail",
  "finalDerivativeReinspected",
] as const;

export const CODEX_FIGURE_PRIVACY_CHECK_IDS = [
  "applicationWindowOnly",
  "syntheticRepositoryOnly",
  "noAccountIdentifiers",
  "noCredentialsOrSecrets",
  "noPersonalPaths",
  "noPrivateRemotes",
  "visibleHistoryAndNotificationsReviewedNoPrivateContent",
  "noCustomerOrPersonalData",
  "allPublishedDerivativesReviewed",
  "altAndCaptionMatchFinalPixels",
] as const;

export type CodexFigureAuditId = `codex-figure-audit.${CodexFigureId}.${string}`;
export type CodexFigureOcrCheckId = (typeof CODEX_FIGURE_OCR_CHECK_IDS)[number];
export type CodexFigureMetadataCheckId = (typeof CODEX_FIGURE_METADATA_CHECK_IDS)[number];
export type CodexFigurePrivacyCheckId = (typeof CODEX_FIGURE_PRIVACY_CHECK_IDS)[number];

export interface CodexFigureAssetHashes {
  readonly png2240: string;
  readonly webp2240: string;
  readonly webp1120: string;
  readonly mobile?: string;
}

export interface CodexFigureAvailable extends CodexFigureManifestBase {
  readonly status: "available";
  readonly kind: "product-ui-capture";
  readonly captureIntent: string;
  /** Binds this manifest to one approved record in figure-audits.json. */
  readonly auditId: CodexFigureAuditId;
  /** Official OpenAI documentation that supports the UI behavior being taught. */
  readonly officialSupportingSourceId: CodexOfficialDocSourceId;
  /** Clean 2240-pixel PNG master and full-resolution fallback. */
  readonly src: string;
  readonly srcSet: {
    readonly webp2240: string;
    readonly webp1120: string;
    readonly mobile?: string;
  };
  readonly assetSha256: CodexFigureAssetHashes;
  readonly width: 2240;
  readonly height: number;
  readonly capturedOn: string;
  readonly codexVersion: string;
  readonly os: string;
  /** @deprecated Renderer/checker compatibility alias for assetSha256.png2240. */
  readonly sha256: string;
  /** @deprecated Compatibility signal only; the external structured audit is authoritative. */
  readonly privacyReviewed: true;
  /** @deprecated Compatibility URL; must equal the official source record's exact anchor. */
  readonly sourceUrl: string;
  /** @deprecated Third-party rights are authoritative only in the bound audit provenance. */
  readonly thirdPartySourceUrl?: string;
  /** @deprecated Third-party rights are authoritative only in the bound audit provenance. */
  readonly thirdPartyLicense?: string;
}

export type CodexProductUiCaptureFigure = CodexFigureAvailable;

export const CODEX_DIAGRAM_RIGHTS_SCHEMA = "aicourse.codex.diagram-rights.v1" as const;
export const CODEX_ORIGINAL_DIAGRAM_RENDERER_VERSION = "codex-original-diagrams.v1" as const;
export const CODEX_ORIGINAL_DIAGRAM_LABEL = "COURSE-ORIGINAL ABSTRACT DIAGRAM · NOT PRODUCT UI" as const;
export const CODEX_ORIGINAL_DIAGRAM_RENDER_ENVIRONMENT = {
  sharpVersion: "0.35.3",
  libvipsVersion: "8.18.3",
  svgTextFontStack: "Arial, Helvetica, sans-serif",
  reproductionPolicy: "release-rerender-byte-identical",
} as const;

export type CodexDiagramRightsId = `codex-diagram-rights.${CodexFigureId}.${string}`;

export interface CodexOriginalDiagramFigure extends CodexFigureManifestBase {
  readonly status: "available";
  readonly kind: "course-original-diagram";
  readonly instructionalPurpose: string;
  readonly rightsRecordId: CodexDiagramRightsId;
  /** Official sources support the taught behavior, never the course-authored pixels. */
  readonly officialSupportingSourceIds: readonly [CodexOfficialDocSourceId, ...CodexOfficialDocSourceId[]];
  readonly src: string;
  readonly srcSet: {
    readonly webp2240: string;
    readonly webp1120: string;
  };
  readonly assetSha256: CodexFigureAssetHashes;
  readonly width: 2240;
  readonly height: 1260;
  readonly rendererVersion: typeof CODEX_ORIGINAL_DIAGRAM_RENDERER_VERSION;
  readonly provenanceLabel: typeof CODEX_ORIGINAL_DIAGRAM_LABEL;
  readonly privacyClassification: "synthetic-labels-only";
  readonly nonImpersonationClassification: "abstract-model-not-product-ui";
}

export type CodexFigureManifest = CodexProductUiCaptureFigure | CodexOriginalDiagramFigure;

export interface CodexFigureAuditRawSource {
  readonly kind: "course-authored-capture" | "third-party-original";
  /** Stable audit-vault reference, never a personal absolute filesystem path. */
  readonly archivalRef: string;
  readonly mediaType: "image/png" | "image/webp";
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly retainedOutsidePublic: true;
}

export interface CodexFigureAuditServedAsset<
  MediaType extends "image/png" | "image/webp",
  Width extends number,
> {
  readonly path: string;
  readonly mediaType: MediaType;
  readonly width: Width;
  readonly height: number;
  readonly sha256: string;
}

export interface CodexFigureAuditServedAssets {
  readonly png2240: CodexFigureAuditServedAsset<"image/png", 2240>;
  readonly webp2240: CodexFigureAuditServedAsset<"image/webp", 2240>;
  readonly webp1120: CodexFigureAuditServedAsset<"image/webp", 1120>;
  readonly mobile?: CodexFigureAuditServedAsset<"image/webp", number>;
}

interface CodexFigureReviewBase {
  /** Stable reviewer name or internal reviewer identifier. */
  readonly reviewer: string;
  readonly reviewedOn: string;
  readonly checklistVersion: string;
}

export interface CodexFigureOcrReview extends CodexFigureReviewBase {
  readonly checklistVersion: typeof CODEX_FIGURE_OCR_CHECKLIST_VERSION;
  readonly engine: string;
  readonly engineVersion: string;
  readonly transcriptSha256: string;
  readonly checks: Readonly<Record<CodexFigureOcrCheckId, true>>;
}

export interface CodexFigureMetadataReview extends CodexFigureReviewBase {
  readonly checklistVersion: typeof CODEX_FIGURE_METADATA_CHECKLIST_VERSION;
  readonly tool: string;
  readonly toolVersion: string;
  readonly checks: Readonly<Record<CodexFigureMetadataCheckId, true>>;
}

export interface CodexFigurePrivacyReview extends CodexFigureReviewBase {
  readonly checklistVersion: typeof CODEX_FIGURE_PRIVACY_CHECKLIST_VERSION;
  readonly checks: Readonly<Record<CodexFigurePrivacyCheckId, true>>;
}

export interface CodexFigureEditorialCaptureProvenance {
  readonly kind: "course-authored-editorial-capture";
  readonly capturedBy: string;
  readonly rightsHolder: string;
  readonly editorialPurpose: string;
  readonly rightsReviewer: string;
  readonly rightsReviewedOn: string;
  readonly originalCaptureConfirmed: true;
  readonly syntheticDataConfirmed: true;
  readonly publicationApproved: true;
}

export interface CodexFigureThirdPartyReuseProvenance {
  readonly kind: "third-party-reuse";
  readonly sourceAssetUrl: string;
  readonly rightsBasis: "license" | "written-permission" | "published-reuse-terms";
  readonly rightsReferenceUrl: string;
  readonly license: string;
  readonly attribution: string;
  readonly rightsReviewer: string;
  readonly rightsReviewedOn: string;
  readonly localHostingAllowed: true;
  readonly derivativesAllowed: true;
  readonly coursePublicationAllowed: true;
}

export type CodexFigureProvenance =
  | CodexFigureEditorialCaptureProvenance
  | CodexFigureThirdPartyReuseProvenance;

export interface CodexFigureAuditRecord {
  readonly id: CodexFigureAuditId;
  readonly figureId: CodexFigureId;
  readonly status: "approved";
  readonly binding: {
    readonly lessonSlug: CodexLessonSlug;
    readonly surface: CodexFigureManifestBase["surface"];
  };
  readonly rawSource: CodexFigureAuditRawSource;
  /** Frozen hashes and dimensions for every file served by the course. */
  readonly servedAssets: CodexFigureAuditServedAssets;
  readonly product: {
    readonly capturedOn: string;
    readonly codexVersion: string;
    readonly operatingSystem: string;
  };
  readonly officialSupportingSourceId: CodexOfficialDocSourceId;
  readonly reviews: {
    readonly ocr: CodexFigureOcrReview;
    readonly metadata: CodexFigureMetadataReview;
    readonly privacy: CodexFigurePrivacyReview;
  };
  readonly provenance: CodexFigureProvenance;
}

export interface CodexFigureAuditLedger {
  readonly schema: typeof CODEX_FIGURE_AUDIT_SCHEMA;
  readonly audits: readonly CodexFigureAuditRecord[];
}

export interface CodexDiagramRightsRecord {
  readonly id: CodexDiagramRightsId;
  readonly figureId: (typeof CODEX_ORIGINAL_DIAGRAM_FIGURE_IDS)[number];
  readonly status: "publishable";
  readonly binding: {
    readonly lessonSlug: CodexLessonSlug;
    readonly surface: CodexFigureManifestBase["surface"];
  };
  readonly instructionalPurpose: string;
  readonly officialSupportingSourceIds: readonly [CodexOfficialDocSourceId, ...CodexOfficialDocSourceId[]];
  readonly assetSha256: CodexFigureAssetHashes;
}

export interface CodexDiagramRightsLedger {
  readonly schema: typeof CODEX_DIAGRAM_RIGHTS_SCHEMA;
  readonly renderer: {
    readonly path: "scripts/render-codex-original-diagrams.mjs";
    readonly version: typeof CODEX_ORIGINAL_DIAGRAM_RENDERER_VERSION;
    readonly sha256: string;
    readonly environment: typeof CODEX_ORIGINAL_DIAGRAM_RENDER_ENVIRONMENT;
  };
  readonly notice: {
    readonly path: "public/courses/codex/NOTICE.md";
    readonly sha256: string;
  };
  readonly assetContract: {
    readonly root: "/courses/codex/figures";
    readonly pngPathTemplate: "fig-XX-master.png";
    readonly webp2240PathTemplate: "fig-XX-2240.webp";
    readonly webp1120PathTemplate: "fig-XX-1120.webp";
    readonly masterWidth: 2240;
    readonly masterHeight: 1260;
    readonly responsiveWidth: 1120;
    readonly responsiveHeight: 630;
  };
  readonly policy: {
    readonly classification: "course-original-abstract-diagram";
    readonly authorship: {
      readonly rightsBasis: "course-original-work";
      readonly rightsHolder: "HU Dongpin";
      readonly license: "MIT";
      readonly licensePath: "LICENSE";
      readonly licenseSha256: string;
      readonly thirdPartyPixels: false;
      readonly thirdPartyAssets: readonly [];
    };
    readonly privacy: {
      readonly dataClass: "synthetic-labels-only";
      readonly containsPersonalData: false;
      readonly containsSecrets: false;
      readonly containsAccountOrRepositoryIdentifiers: false;
      readonly metadataStripped: true;
    };
    readonly nonImpersonation: {
      readonly depiction: "abstract-process-diagram";
      readonly productUiCapture: false;
      readonly simulatedProductUi: false;
      readonly vendorLogoIncluded: false;
      readonly tradeDressReproduction: false;
      readonly visibleLabel: typeof CODEX_ORIGINAL_DIAGRAM_LABEL;
      readonly labelEmbeddedInPixels: true;
    };
  };
  readonly records: readonly CodexDiagramRightsRecord[];
}

export interface CodexSectionCopy {
  readonly heading: string;
  readonly body: string;
}

export interface CodexLessonCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly CodexSectionCopy[];
  readonly practice: {
    readonly title: string;
    readonly brief: string;
    readonly steps: readonly string[];
    readonly evidence: readonly string[];
    readonly safety: string;
  };
  readonly checkpoint: {
    readonly prompt: string;
    readonly answer: string;
  };
  readonly takeaway: string;
}

export interface CodexQuizCopy {
  readonly question: string;
  readonly options: readonly string[];
  readonly explanation: string;
}

export interface CodexFigureCopy {
  readonly alt: string;
  readonly caption: string;
  readonly callouts?: Readonly<Record<string, string>>;
}

export interface CodexCourseCopy {
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly duration: string;
    readonly sourceNote: string;
    readonly figureNote: string;
    readonly startCta: string;
    readonly resumeCta: string;
  };
  readonly ui: {
    readonly lessons: string;
    readonly minutes: string;
    readonly objectives: string;
    readonly evidence: string;
    readonly practice: string;
    readonly checkpoint: string;
    readonly sources: string;
    readonly quiz: string;
    readonly previous: string;
    readonly next: string;
    readonly capturePending: string;
    readonly optionalAdvanced: string;
    readonly progress: string;
    readonly courseProgress: string;
    readonly completed: string;
    readonly markComplete: string;
    readonly markedComplete: string;
    readonly resetProgress: string;
    readonly question: string;
    readonly of: string;
    readonly checkAnswer: string;
    readonly checkAnswers: string;
    readonly correct: string;
    readonly incorrect: string;
    readonly tryAgain: string;
    readonly score: string;
    readonly quizPassed: string;
    readonly quizNeedsReview: string;
    readonly capstoneArtifacts: string;
    readonly capstoneReceipt: string;
    readonly artifactReady: string;
    readonly rubric: string;
    readonly rubricComplete: string;
    readonly passingScore: string;
    readonly weight: string;
    readonly status: string;
    readonly notStarted: string;
    readonly printReceipt: string;
    readonly browserStorageNote: string;
    readonly backToCourse: string;
    readonly allLessons: string;
    readonly recordCompletion: string;
    readonly finalQuizTitle: string;
    readonly finalQuizIntro: string;
    readonly beginQuiz: string;
    readonly nextQuestion: string;
    readonly retryQuiz: string;
    readonly bestScore: string;
    readonly passRequirement: string;
    readonly source: string;
    readonly sourceVerifiedOn: string;
    readonly stars: string;
    readonly license: string;
    readonly storageUnavailable: string;
    readonly receiptInstructions: string;
    readonly receiptSchemaLabel: string;
    readonly fixtureVersionLabel: string;
    readonly fixtureHashLabel: string;
    readonly requiredChecksLabel: string;
    readonly pasteReceipt: string;
    readonly verifyReceipt: string;
    readonly receiptValid: string;
    readonly receiptInvalidJson: string;
    readonly receiptWrongSchema: string;
    readonly receiptWrongVersion: string;
    readonly receiptWrongHash: string;
    readonly receiptIncomplete: string;
    readonly downloadStarter: string;
    readonly completionSummary: string;
    readonly exportSummary: string;
    readonly finishQuiz: string;
    readonly questionProgressTemplate: string;
    readonly scoreSummaryTemplate: string;
    readonly bestScoreTemplate: string;
    readonly resetConfirm: string;
    readonly resetDone: string;
    readonly capstonePath: string;
  };
  readonly units: Readonly<Record<CodexUnitId, { readonly title: string; readonly summary: string }>>;
  readonly lessons: Readonly<Record<CodexLessonSlug, CodexLessonCopy>>;
  readonly quiz: Readonly<Record<CodexQuizId, CodexQuizCopy>>;
  readonly figures: Readonly<Record<CodexFigureId, CodexFigureCopy>>;
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly instructions: readonly string[];
    readonly artifacts: Readonly<Record<string, { readonly title: string; readonly description: string }>>;
    readonly rubric: Readonly<Record<string, { readonly title: string; readonly description: string }>>;
    readonly pass: string;
    readonly retry: string;
    readonly completion: string;
  };
}

export interface MaterializedCodexLesson extends CodexLessonManifest {
  readonly copy: CodexLessonCopy;
  readonly figures: readonly { readonly manifest: CodexFigureManifest; readonly copy: CodexFigureCopy }[];
  readonly quiz: readonly { readonly manifest: CodexQuizManifest; readonly copy: CodexQuizCopy }[];
  readonly sources: readonly CodexSourceRecord[];
  readonly practice: CodexPracticeManifest;
}

export interface MaterializedCodexCourse {
  readonly locale: CodexLocale;
  readonly manifest: CodexCourseManifest;
  readonly copy: CodexCourseCopy;
  readonly units: readonly (CodexUnitManifest & {
    readonly copy: CodexCourseCopy["units"][CodexUnitId];
    readonly lessons: readonly MaterializedCodexLesson[];
  })[];
}
