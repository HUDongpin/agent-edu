export const CURSOR_COURSE_ID = "how-to-use-cursor" as const;

export const CURSOR_LOCALES = [
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

export const CURSOR_UNIT_IDS = ["unit-1", "unit-2", "unit-3", "unit-4"] as const;

export const CURSOR_LESSON_SLUGS = [
  "orient-privacy",
  "tab-inline-edit",
  "agent-interface",
  "task-contracts",
  "plan-execute-steer",
  "test-review-recover",
  "rules-skills-mcp",
  "cloud-parallel",
  "software-studio",
  "research-studio",
  "writing-studio",
  "office-studio",
  "teaching-studio",
  "workflow-capstone",
] as const;

export const CURSOR_QUIZ_IDS = [
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
] as const;

export const CURSOR_QUIZ_OPTION_IDS = ["a", "b", "c", "d"] as const;

export const CURSOR_FIGURE_IDS = [
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
] as const;

export const CURSOR_PRACTICE_IDS = [
  "practice-orient-privacy",
  "practice-tab-inline-edit",
  "practice-agent-interface",
  "practice-task-contracts",
  "practice-plan-execute-steer",
  "practice-test-review-recover",
  "practice-rules-skills-mcp",
  "practice-cloud-parallel",
  "practice-software-studio",
  "practice-research-studio",
  "practice-writing-studio",
  "practice-office-studio",
  "practice-teaching-studio",
  "practice-workflow-capstone",
] as const;

export const CURSOR_SOURCE_IDS = [
  "cursor-quickstart",
  "cursor-download",
  "cursor-cli",
  "cursor-data-use",
  "cursor-tab",
  "cursor-inline-edit",
  "cursor-agent-overview",
  "cursor-agent-security",
  "cursor-agents-window",
  "cursor-prompting",
  "cursor-planning",
  "cursor-shell",
  "cursor-run-modes",
  "cursor-security-hardening",
  "cursor-agent-review",
  "cursor-debugging",
  "cursor-rules",
  "cursor-skills",
  "cursor-subagents",
  "cursor-hooks",
  "cursor-mcp",
  "cursor-cloud-agents",
  "cursor-cloud-builds",
  "cursor-cloud-best-practices",
  "cursor-automations",
  "cursor-google-workspace",
  "cursor-browser",
  "cursor-plugins",
  "cursor-side-chat",
  "cursor-students",
  "cursor-plan-mode-blog",
  "cursor-changelog-2026-08",
  "cursor-product",
  "cursor-learn-understand",
  "cursor-learn-features",
  "cursor-learn-debug",
  "cursor-learn-review",
  "cursor-worktrees",
  "course-capstone-fixture",
  "github-domain-agent",
  "github-product-managers",
  "github-strapi-docs",
  "github-metamask-design",
  "github-alibaba-hooks",
  "github-tutor",
  "github-cursor-workshop",
  "github-plaintext-crm",
  "github-spec-kit",
  "github-superpowers",
  "github-agents-md",
] as const;

export type CursorLocale = (typeof CURSOR_LOCALES)[number];
export type CursorUnitId = (typeof CURSOR_UNIT_IDS)[number];
export type CursorLessonSlug = (typeof CURSOR_LESSON_SLUGS)[number];
export type CursorQuizId = (typeof CURSOR_QUIZ_IDS)[number];
export type CursorQuizOptionId = (typeof CURSOR_QUIZ_OPTION_IDS)[number];
export type CursorFigureId = (typeof CURSOR_FIGURE_IDS)[number];
export type CursorPracticeId = (typeof CURSOR_PRACTICE_IDS)[number];
export type CursorSourceId = (typeof CURSOR_SOURCE_IDS)[number];

export interface CursorUnitManifest {
  readonly id: CursorUnitId;
  readonly order: number;
  readonly lessonSlugs: readonly CursorLessonSlug[];
}

/**
 * Language-neutral lesson composition. Copy is resolved from the locale table;
 * executable HTML is deliberately not part of the content contract.
 */
export type CursorBlock =
  | { readonly type: "prose"; readonly sectionIndex: 0 | 1 | 2 }
  | { readonly type: "steps"; readonly copyKey: string }
  | { readonly type: "code"; readonly language: string; readonly code: string }
  | { readonly type: "callout"; readonly copyKey: string; readonly tone: "note" | "warning" | "success" }
  | { readonly type: "comparison"; readonly copyKey: string; readonly columns: readonly string[] }
  | { readonly type: "figure"; readonly figureId: CursorFigureId }
  | { readonly type: "exercise"; readonly practiceId: CursorPracticeId }
  | { readonly type: "source-note"; readonly sourceIds: readonly CursorSourceId[] };

export interface CursorLessonManifest {
  readonly slug: CursorLessonSlug;
  readonly order: number;
  readonly unitId: CursorUnitId;
  readonly minutes: number;
  readonly durationMinutes: number;
  readonly prerequisites: readonly CursorLessonSlug[];
  readonly objectiveKeys: readonly string[];
  readonly blocks: readonly [CursorBlock, ...CursorBlock[]];
  readonly sourceIds: readonly CursorSourceId[];
  readonly practiceId: CursorPracticeId;
  readonly quizIds: readonly [CursorQuizId, CursorQuizId];
  readonly quizTags: readonly string[];
  readonly figureIds: readonly [CursorFigureId, ...CursorFigureId[]];
}

export interface CursorCourseManifest {
  readonly id: typeof CURSOR_COURSE_ID;
  readonly version: string;
  readonly preparedOn: string;
  readonly publicationStatus: "rights-gated" | "published";
  readonly publishedOn: string | null;
  readonly sourceSnapshotOn: string;
  readonly units: readonly CursorUnitManifest[];
  readonly lessons: readonly CursorLessonManifest[];
}

export interface CursorSourceRecord {
  readonly id: CursorSourceId;
  readonly tier: "primary" | "corroborating";
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly accessedOn: string;
  readonly verifiedAt: string;
  readonly exactAnchor: string;
  readonly supportingAnchors?: readonly string[];
  readonly claimIds: readonly string[];
  readonly reuseMode: "paraphrased" | "asset-reused" | "link-only";
  readonly note: string;
  readonly kind: "official-doc" | "official-blog" | "official-github" | "community-github" | "course-artifact";
  readonly license?: string;
  readonly revision?: string;
}

export interface CursorPracticeManifest {
  readonly id: CursorPracticeId;
  readonly lessonSlug: CursorLessonSlug;
  readonly estimatedMinutes: number;
  readonly workspace: "disposable" | "personal-repository" | "either";
  readonly requiresWriteAccess: boolean;
  readonly evidenceItems: number;
  readonly promptKey: string;
  readonly observableActionCount: number;
  readonly selfCheckCriteriaCount: number;
  readonly completionKey: `cursor.lesson.${CursorLessonSlug}`;
}

export interface CursorQuizManifest {
  readonly id: CursorQuizId;
  readonly lessonSlug: CursorLessonSlug;
  readonly unitId: CursorUnitId;
  readonly correctOptionId: CursorQuizOptionId;
  readonly sourceIds: readonly CursorSourceId[];
}

interface CursorFigureManifestBase {
  readonly id: CursorFigureId;
  readonly lessonSlug: CursorLessonSlug;
  readonly surface: "app" | "docs" | "cloud" | "github" | "web";
  readonly captureIntent: string;
  readonly altKey: `figures.${CursorFigureId}.alt`;
  readonly captionKey: `figures.${CursorFigureId}.caption`;
  readonly privacyChecklist: readonly string[];
  readonly callouts?: readonly CursorFigureCallout[];
}

export interface CursorFigureCallout {
  readonly id: string;
  readonly labelKey: string;
  readonly xPercent: number;
  readonly yPercent: number;
}

export interface CursorFigureCaptureRequired extends CursorFigureManifestBase {
  readonly status: "capture-required";
}

export interface CursorFigureAvailable extends CursorFigureManifestBase {
  /** Local technical availability only; this is not publication clearance. */
  readonly status: "available";
  /**
   * No evidence-bearing publication-rights determination is recorded yet.
   * A future reviewed variant must bind immutable evidence, scope, dates, and
   * a human reviewer; a bare `cleared` flag is intentionally not supported.
   */
  readonly rightsStatus: "rights-review-required";
  /** Source-resolution PNG master retained as the full-resolution fallback. */
  readonly src: string;
  readonly srcSet: {
    readonly webpLarge: string;
    readonly webpSmall: string;
    readonly mobile?: string;
  };
  readonly width: number;
  readonly height: number;
  readonly capturedOn: string;
  readonly cursorVersion: string;
  readonly os: string;
  readonly sha256: string;
  readonly privacyReviewed: true;
  readonly sourceUrl: string;
  readonly sourcePageUrl: string;
  readonly sourcePublishedOn?: string;
  /** SHA-256 of a video source asset when this still is a decoded frame. */
  readonly sourceAssetSha256?: string;
  /** Zero-based playback time used to decode a still from a video source. */
  readonly frameTimeSeconds?: number;
  /** Incidental identifiers already published in Cursor's public demo media. */
  readonly visiblePublicDemoIdentifiers?: readonly string[];
  readonly uiFreshness: "current" | "dated-current" | "historical-interface";
  readonly copyrightNotice: string;
  readonly thirdPartySourceUrl?: string;
  readonly thirdPartyLicense?: string;
}

export type CursorFigureManifest = CursorFigureCaptureRequired | CursorFigureAvailable;

export interface CursorSectionCopy {
  readonly heading: string;
  readonly body: string;
}

export interface CursorLessonCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly CursorSectionCopy[];
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

export interface CursorQuizCopy {
  readonly question: string;
  readonly options: Readonly<Record<CursorQuizOptionId, string>>;
  readonly explanation: string;
}

export interface CursorFigureCopy {
  readonly alt: string;
  readonly caption: string;
  readonly callouts?: Readonly<Record<string, string>>;
}

export interface CursorCourseCopy {
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
    readonly finalQuizQuestions: string;
    readonly inThisLesson: string;
    readonly learn: string;
    readonly completion: string;
    readonly capstone: string;
    readonly missedConcepts: string;
    readonly reviewMissedLessons: string;
    readonly reviewLessonTemplate: string;
    readonly previous: string;
    readonly next: string;
    readonly capturePending: string;
    readonly openFullSize: string;
    readonly figureCurrent: string;
    readonly figureDated: string;
    readonly figureHistorical: string;
    readonly figureAttribution: string;
    readonly optionalAdvanced: string;
    readonly progress: string;
    readonly courseProgress: string;
    readonly completed: string;
    readonly markComplete: string;
    readonly markedComplete: string;
    readonly markIncomplete: string;
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
    readonly finalQuizNeedsReview: string;
    readonly capstoneArtifacts: string;
    readonly capstoneReceipt: string;
    readonly artifactReady: string;
    readonly rubric: string;
    readonly learnerSelfAssessment: string;
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
    readonly storageUnavailable: string;
    readonly draftNotSaved: string;
    readonly discardDraftConfirm: string;
    readonly receiptInstructions: string;
    readonly receiptSchemaLabel: string;
    readonly fixtureVersionLabel: string;
    readonly archiveHashLabel: string;
    readonly fixtureHashLabel: string;
    readonly downloadChecksum: string;
    readonly requiredChecksLabel: string;
    readonly pasteReceipt: string;
    readonly verifyReceipt: string;
    readonly receiptValid: string;
    readonly receiptInvalidJson: string;
    readonly receiptWrongSchema: string;
    readonly receiptWrongVersion: string;
    readonly receiptWrongHash: string;
    readonly receiptIncomplete: string;
    readonly savedCompletionMismatch: string;
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
  readonly units: Readonly<Record<CursorUnitId, { readonly title: string; readonly summary: string }>>;
  readonly lessons: Readonly<Record<CursorLessonSlug, CursorLessonCopy>>;
  readonly quiz: Readonly<Record<CursorQuizId, CursorQuizCopy>>;
  readonly figures: Readonly<Record<CursorFigureId, CursorFigureCopy>>;
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

export interface MaterializedCursorLesson extends CursorLessonManifest {
  readonly copy: CursorLessonCopy;
  readonly figures: readonly { readonly manifest: CursorFigureManifest; readonly copy: CursorFigureCopy }[];
  readonly quiz: readonly { readonly manifest: CursorQuizManifest; readonly copy: CursorQuizCopy }[];
  readonly sources: readonly CursorSourceRecord[];
  readonly practice: CursorPracticeManifest;
}

export interface MaterializedCursorCourse {
  readonly locale: CursorLocale;
  readonly manifest: CursorCourseManifest;
  readonly copy: CursorCourseCopy;
  readonly units: readonly (CursorUnitManifest & {
    readonly copy: CursorCourseCopy["units"][CursorUnitId];
    readonly lessons: readonly MaterializedCursorLesson[];
  })[];
}
