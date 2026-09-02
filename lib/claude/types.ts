export const CLAUDE_COURSE_ID = "how-to-use-claude" as const;

export const CLAUDE_LOCALES = [
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

export const CLAUDE_UNIT_IDS = ["unit-1", "unit-2", "unit-3", "unit-4"] as const;

export const CLAUDE_LESSON_SLUGS = [
  "choose-your-surface",
  "describe-the-outcome",
  "iterate-with-examples",
  "discern-verify-protect",
  "work-with-files",
  "build-projects",
  "create-artifacts",
  "research-with-citations",
  "extend-with-tools",
  "delegate-with-cowork",
  "software-engineering",
  "research-and-data",
  "writing-and-office",
  "teaching-and-learning",
  "portfolio-capstone",
] as const;

export const CLAUDE_QUIZ_IDS = [
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
  "q25",
  "q26",
  "q27",
  "q28",
  "q29",
  "q30",
] as const;

export const CLAUDE_FIGURE_IDS = [
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
] as const;

export const CLAUDE_PRACTICE_IDS = [
  "practice-choose-your-surface",
  "practice-describe-the-outcome",
  "practice-iterate-with-examples",
  "practice-discern-verify-protect",
  "practice-work-with-files",
  "practice-build-projects",
  "practice-create-artifacts",
  "practice-research-with-citations",
  "practice-extend-with-tools",
  "practice-delegate-with-cowork",
  "practice-software-engineering",
  "practice-research-and-data",
  "practice-writing-and-office",
  "practice-teaching-and-learning",
  "practice-portfolio-capstone",
] as const;

export const CLAUDE_SOURCE_IDS = [
  "academy-catalog",
  "academy-claude-101",
  "academy-fluency",
  "academy-desktop",
  "academy-files",
  "academy-projects",
  "academy-artifacts",
  "academy-research",
  "academy-skills",
  "academy-connectors",
  "academy-cowork",
  "academy-powerpoint",
  "academy-teachers",
  "support-projects",
  "support-research",
  "support-skills",
  "support-connectors",
  "support-files",
  "support-artifacts",
  "support-cowork",
  "support-cowork-architecture",
  "support-tool-access",
  "claude-pricing",
  "github-anthropic-skills",
  "github-claude-code",
  "github-claude-code-action",
  "github-cookbooks",
  "github-knowledge-work",
  "github-k12-teacher-skills",
  "github-cwc-workshops",
  "github-superpowers",
  "github-paper-writing",
  "github-learning-opportunities",
  "github-academic-workflow",
  "github-claudeblattman",
] as const;

export type ClaudeLocale = (typeof CLAUDE_LOCALES)[number];
export type ClaudeUnitId = (typeof CLAUDE_UNIT_IDS)[number];
export type ClaudeLessonSlug = (typeof CLAUDE_LESSON_SLUGS)[number];
export type ClaudeQuizId = (typeof CLAUDE_QUIZ_IDS)[number];
export type ClaudeFigureId = (typeof CLAUDE_FIGURE_IDS)[number];
export type ClaudePracticeId = (typeof CLAUDE_PRACTICE_IDS)[number];
export type ClaudeSourceId = (typeof CLAUDE_SOURCE_IDS)[number];

export interface ClaudeUnitManifest {
  readonly id: ClaudeUnitId;
  readonly order: number;
  readonly lessonSlugs: readonly ClaudeLessonSlug[];
}

/**
 * Language-neutral lesson composition. Copy is resolved from the locale table;
 * executable HTML is deliberately not part of the content contract.
 */
export type ClaudeBlock =
  | { readonly type: "prose"; readonly sectionIndex: 0 | 1 | 2 }
  | { readonly type: "steps"; readonly copyKey: string }
  | { readonly type: "code"; readonly language: string; readonly code: string }
  | { readonly type: "callout"; readonly copyKey: string; readonly tone: "note" | "warning" | "success" }
  | { readonly type: "comparison"; readonly copyKey: string; readonly columns: readonly string[] }
  | { readonly type: "figure"; readonly figureId: ClaudeFigureId }
  | { readonly type: "exercise"; readonly practiceId: ClaudePracticeId }
  | { readonly type: "source-note"; readonly sourceIds: readonly ClaudeSourceId[] };

export interface ClaudeLessonManifest {
  readonly slug: ClaudeLessonSlug;
  readonly order: number;
  readonly unitId: ClaudeUnitId;
  readonly minutes: number;
  readonly durationMinutes: number;
  readonly prerequisites: readonly ClaudeLessonSlug[];
  readonly objectiveKeys: readonly string[];
  readonly blocks: readonly [ClaudeBlock, ...ClaudeBlock[]];
  readonly sourceIds: readonly ClaudeSourceId[];
  readonly practiceId: ClaudePracticeId;
  readonly quizIds: readonly [ClaudeQuizId, ...ClaudeQuizId[]];
  readonly quizTags: readonly string[];
  readonly figureIds: readonly [ClaudeFigureId, ...ClaudeFigureId[]];
}

export interface ClaudeCourseManifest {
  readonly id: typeof CLAUDE_COURSE_ID;
  readonly version: string;
  readonly preparedOn: string;
  readonly publicationStatus: "rights-gated" | "published";
  readonly publishedOn: string | null;
  readonly sourceSnapshotOn: string;
  readonly units: readonly ClaudeUnitManifest[];
  readonly lessons: readonly ClaudeLessonManifest[];
}

interface ClaudeSourceRecordBase {
  readonly id: ClaudeSourceId;
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

export interface ClaudeOfficialDocSource extends ClaudeSourceRecordBase {
  readonly kind: "official-doc";
  readonly stars?: never;
  readonly starsSnapshotOn?: never;
  readonly license?: never;
}

export interface ClaudeGitHubSource extends ClaudeSourceRecordBase {
  readonly kind: "official-github" | "community-github";
  readonly stars?: number;
  readonly starsSnapshotOn?: string;
  readonly license: string;
  readonly commit?: string;
}

export type ClaudeSourceRecord = ClaudeOfficialDocSource | ClaudeGitHubSource;

export interface ClaudePracticeManifest {
  readonly id: ClaudePracticeId;
  readonly lessonSlug: ClaudeLessonSlug;
  readonly estimatedMinutes: number;
  readonly workspace: "disposable" | "personal-files" | "personal-repository" | "either";
  readonly requiresWriteAccess: boolean;
  readonly evidenceItems: number;
  readonly promptKey: string;
  readonly observableActionCount: number;
  readonly selfCheckCriteriaCount: number;
  readonly completionKey: `claude.lesson.${ClaudeLessonSlug}`;
}

export interface ClaudeQuizManifest {
  readonly id: ClaudeQuizId;
  readonly lessonSlug: ClaudeLessonSlug;
  readonly unitId: ClaudeUnitId;
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly sourceIds: readonly ClaudeSourceId[];
}

interface ClaudeFigureManifestBase {
  readonly id: ClaudeFigureId;
  readonly lessonSlug: ClaudeLessonSlug;
  readonly surface: "desktop" | "chat" | "projects" | "artifacts" | "research" | "connectors" | "cowork" | "code" | "platform";
  readonly captureIntent: string;
  readonly altKey: `figures.${ClaudeFigureId}.alt`;
  readonly captionKey: `figures.${ClaudeFigureId}.caption`;
  readonly privacyChecklist: readonly string[];
  readonly callouts?: readonly ClaudeFigureCallout[];
}

export interface ClaudeFigureCallout {
  readonly id: string;
  readonly labelKey: string;
  readonly xPercent: number;
  readonly yPercent: number;
}

export interface ClaudeFigureCaptureRequired extends ClaudeFigureManifestBase {
  readonly status: "capture-required";
}

interface ClaudeFigureAvailableBase extends ClaudeFigureManifestBase {
  readonly status: "available";
  /** Local PNG master and responsive WebP derivatives. */
  readonly src: string;
  readonly srcSet: {
    readonly webpLarge: string;
    readonly largeWidth: number;
    readonly largeSha256: string;
    readonly webpSmall: string;
    readonly smallWidth: number;
    readonly smallSha256: string;
    readonly mobile?: string;
    readonly mobileWidth?: number;
    readonly mobileSha256?: string;
  };
  readonly width: number;
  readonly height: number;
  /** Date the source image or published interface state was observed. */
  readonly observedOn: string;
  readonly observedUi: string;
  readonly sha256: string;
  readonly privacyReviewed: true;
  readonly sourceUrl: string;
  readonly attribution: string;
}

export interface ClaudeFigurePermissionClearance {
  /** Non-secret internal register or ticket ID; never a public correspondence URL. */
  readonly evidenceReference: string;
  /** SHA-256 of the immutable original permission evidence retained outside the public repository. */
  readonly evidenceSha256: string;
  readonly grantor: string;
  readonly grantedOn: string;
  /** Human-reviewed description binding the grant to the exact figure, use, derivatives, and conditions. */
  readonly scope: string;
  /** Null means the permission states no expiry; revocation or ambiguity returns the figure to pending. */
  readonly expiresOn: string | null;
  readonly reviewedBy: string;
  readonly reviewedOn: string;
}

export interface ClaudeFigureAuthenticityReviewed {
  /** Independent authenticity/provenance review; this does not grant republication rights. */
  readonly status: "source-provenance-reviewed";
  readonly reviewedOn: string;
  readonly sourceAssetUrl: string;
  readonly sourceSha256: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly transformation: string;
}

export interface ClaudeFigureAuthenticityUnverified {
  /** Fail-closed source-chain state; permission alone cannot clear this blocker. */
  readonly status: "provenance-unverified";
  readonly reviewedOn: string;
  readonly blockerCode: "CLAUDE-FIG-01-PROVENANCE-UNVERIFIED";
  readonly reason: string;
}

export type ClaudeFigureAuthenticityReview =
  | ClaudeFigureAuthenticityReviewed
  | ClaudeFigureAuthenticityUnverified;

interface ClaudeFigureFirstPartyAvailableBase extends ClaudeFigureAvailableBase {
  readonly provenance: "first-party-tutorial" | "first-party-product-page";
  readonly authenticityReview: ClaudeFigureAuthenticityReview;
  readonly thirdPartySourceUrl?: never;
  readonly thirdPartyLicense?: never;
  readonly sourceCommit?: never;
  readonly sourceSha256?: never;
  readonly modifications?: never;
}

export interface ClaudeFigurePermissionRequired extends ClaudeFigureFirstPartyAvailableBase {
  readonly rightsStatus: "permission-required";
  readonly permissionClearance?: never;
}

export interface ClaudeFigureWrittenPermissionReviewed extends ClaudeFigureFirstPartyAvailableBase {
  readonly rightsStatus: "written-permission-reviewed";
  readonly permissionClearance: ClaudeFigurePermissionClearance;
}

export interface ClaudeFigureRepositoryLicenceReviewed extends ClaudeFigureAvailableBase {
  readonly provenance: "licensed-community";
  readonly rightsStatus: "repository-licence-reviewed";
  readonly authenticityReview?: never;
  readonly permissionClearance?: never;
  readonly thirdPartySourceUrl: string;
  readonly thirdPartyLicense: string;
  readonly sourceCommit: string;
  /** SHA-256 of the exact asset retrieved from the pinned source commit. */
  readonly sourceSha256: string;
  /** Difference between the pinned source and every locally served derivative. */
  readonly modifications: string;
}

export type ClaudeFigureAvailable =
  | ClaudeFigurePermissionRequired
  | ClaudeFigureWrittenPermissionReviewed
  | ClaudeFigureRepositoryLicenceReviewed;

export type ClaudeFigureManifest = ClaudeFigureCaptureRequired | ClaudeFigureAvailable;

export interface ClaudeSectionCopy {
  readonly heading: string;
  readonly body: string;
}

export interface ClaudeLessonCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly ClaudeSectionCopy[];
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

export interface ClaudeQuizCopy {
  readonly question: string;
  readonly options: readonly string[];
  readonly explanation: string;
}

export interface ClaudeFigureCopy {
  readonly alt: string;
  readonly caption: string;
  readonly callouts?: Readonly<Record<string, string>>;
}

export interface ClaudeCourseCopy {
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
    readonly figureObservedOn: string;
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
  readonly units: Readonly<Record<ClaudeUnitId, { readonly title: string; readonly summary: string }>>;
  readonly lessons: Readonly<Record<ClaudeLessonSlug, ClaudeLessonCopy>>;
  readonly quiz: Readonly<Record<ClaudeQuizId, ClaudeQuizCopy>>;
  readonly figures: Readonly<Record<ClaudeFigureId, ClaudeFigureCopy>>;
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

export interface MaterializedClaudeLesson extends ClaudeLessonManifest {
  readonly copy: ClaudeLessonCopy;
  readonly figures: readonly { readonly manifest: ClaudeFigureManifest; readonly copy: ClaudeFigureCopy }[];
  readonly quiz: readonly { readonly manifest: ClaudeQuizManifest; readonly copy: ClaudeQuizCopy }[];
  readonly sources: readonly ClaudeSourceRecord[];
  readonly practice: ClaudePracticeManifest;
}

export interface MaterializedClaudeCourse {
  readonly locale: ClaudeLocale;
  readonly manifest: ClaudeCourseManifest;
  readonly copy: ClaudeCourseCopy;
  readonly units: readonly (ClaudeUnitManifest & {
    readonly copy: ClaudeCourseCopy["units"][ClaudeUnitId];
    readonly lessons: readonly MaterializedClaudeLesson[];
  })[];
}
