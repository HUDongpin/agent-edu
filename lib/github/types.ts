export const GITHUB_COURSE_ID = "how-to-use-github" as const;

export const GITHUB_QUIZ_STORAGE_KEYS = {
  best: "github.quiz.best",
  passed: "github.quiz.passed",
  version: "github.quiz.version",
} as const;

export const GITHUB_LOCALES = [
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

export const GITHUB_UNIT_IDS = ["unit-1", "unit-2", "unit-3"] as const;

export const GITHUB_LESSON_SLUGS = [
  "start-secure",
  "repository-readme",
  "branches-commits",
  "pull-requests-reviews",
  "issues-discussions",
  "projects-office-work",
  "forks-conflicts",
  "notifications-governance",
  "software-automation",
  "research-reproducibility",
  "writing-publishing",
  "teaching-capstone",
] as const;

export const GITHUB_QUIZ_IDS = [
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

export const GITHUB_FIGURE_IDS = [
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
] as const;

export const GITHUB_SOURCE_IDS = [
  "github-account-2fa",
  "github-commit-email",
  "github-commit-signature",
  "github-about-repositories",
  "github-hello-world",
  "github-create-repository",
  "github-markdown",
  "github-flow",
  "github-branches",
  "github-commits",
  "github-pull-requests",
  "github-review-pull-request",
  "github-merge-conflicts",
  "github-forks",
  "github-issues",
  "github-issue-linking",
  "github-discussions",
  "github-team-planning",
  "github-projects",
  "github-notifications",
  "github-repository-roles",
  "github-sensitive-data",
  "github-connecting",
  "github-actions-quickstart",
  "github-actions-checkout",
  "github-actions-security",
  "github-releases",
  "github-immutable-releases",
  "github-citation-files",
  "github-archive",
  "zenodo-github",
  "github-template-repository",
  "github-skills-introduction",
  "github-sothebys-actions",
  "plos-research-lab",
  "plos-manubot-writing",
  "deep-review-usage",
  "github-docs-projects-story",
  "classroom50-repository",
  "classroom50-quickstart",
  "classroom50-feedback-pr",
  "github-classroom-retirement",
  "github-classroom-transition",
  "github-docs-license",
] as const;

export type GithubLocale = (typeof GITHUB_LOCALES)[number];
export type GithubUnitId = (typeof GITHUB_UNIT_IDS)[number];
export type GithubLessonSlug = (typeof GITHUB_LESSON_SLUGS)[number];
export type GithubQuizId = (typeof GITHUB_QUIZ_IDS)[number];
export type GithubFigureId = (typeof GITHUB_FIGURE_IDS)[number];
export type GithubSourceId = (typeof GITHUB_SOURCE_IDS)[number];

export interface GithubUnitManifest {
  readonly id: GithubUnitId;
  readonly order: number;
  readonly lessonSlugs: readonly GithubLessonSlug[];
}

export interface GithubLessonSectionManifest {
  readonly copyIndex: 0 | 1 | 2;
  readonly figureIds: readonly GithubFigureId[];
}

export interface GithubLessonManifest {
  readonly slug: GithubLessonSlug;
  readonly order: number;
  readonly unitId: GithubUnitId;
  readonly minutes: number;
  readonly prerequisites: readonly GithubLessonSlug[];
  readonly sections: readonly [
    GithubLessonSectionManifest,
    GithubLessonSectionManifest,
    GithubLessonSectionManifest,
  ];
  readonly sourceIds: readonly [GithubSourceId, ...GithubSourceId[]];
  readonly quizIds: readonly [GithubQuizId, GithubQuizId];
}

export interface GithubCourseManifest {
  readonly id: typeof GITHUB_COURSE_ID;
  readonly sequence: 6;
  readonly version: string;
  readonly publishedOn: string;
  readonly sourceSnapshotOn: string;
  readonly units: readonly GithubUnitManifest[];
  readonly lessons: readonly GithubLessonManifest[];
}

export interface GithubSourceRecord {
  readonly id: GithubSourceId;
  readonly kind:
    | "official-doc"
    | "official-announcement"
    | "official-project"
    | "partner-doc"
    | "peer-reviewed"
    | "practitioner-story"
    | "project-guide";
  readonly tier: "primary" | "corroborating";
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly accessedOn: string;
  readonly verifiedAt: string;
  readonly claimIds: readonly string[];
  readonly reuseMode: "paraphrased" | "asset-reused" | "link-only";
  readonly licence?: string;
  readonly note: string;
}

export interface GithubFigureManifest {
  readonly id: GithubFigureId;
  readonly lessonSlug: GithubLessonSlug;
  readonly src: string;
  readonly webpSrc: string;
  readonly width: number;
  readonly height: number;
  readonly sourceUrl: string;
  readonly immutableSourceUrl: string;
  readonly sourceCommit: "4f8c3170cea7f72cf41fc976f5dbf4e8a0b8567f";
  readonly sourcePage: string;
  readonly sourcePublisher: "GitHub Docs";
  readonly sourceLicence: "CC-BY-4.0";
  readonly observedOn: string;
  readonly sha256: string;
  readonly privacyReviewed: true;
}

export interface GithubSectionCopy {
  readonly heading: string;
  readonly body: readonly string[];
  readonly bullets?: readonly string[];
  readonly code?: {
    readonly label: string;
    readonly language: "shell" | "markdown" | "yaml" | "text";
    readonly value: string;
  };
}

export interface GithubLessonCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly [
    GithubSectionCopy,
    GithubSectionCopy,
    GithubSectionCopy,
  ];
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

export interface GithubQuizCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly explanation: string;
}

export interface GithubFigureCopy {
  readonly alt: string;
  readonly caption: string;
}

export interface GithubUiCopy {
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
  readonly progress: string;
  readonly courseProgress: string;
  readonly completed: string;
  readonly markComplete: string;
  readonly markedComplete: string;
  readonly resetProgress: string;
  readonly correct: string;
  readonly incorrect: string;
  readonly score: string;
  readonly quizPassed: string;
  readonly quizNeedsReview: string;
  readonly passingScore: string;
  readonly source: string;
  readonly storageUnavailable: string;
  readonly browserStorageNote: string;
  readonly backToCourse: string;
  readonly allLessons: string;
  readonly lessonPositionTemplate: string;
  readonly quizDraftAvailable: string;
  readonly resumeQuizDraft: string;
  readonly discardQuizDraft: string;
  readonly quizDraftRestored: string;
  readonly quizDraftDiscarded: string;
  readonly capstoneDraftAvailable: string;
  readonly resumeCapstoneDraft: string;
  readonly discardCapstoneDraft: string;
  readonly capstoneDraftRestored: string;
  readonly capstoneDraftDiscarded: string;
  readonly draftInvalid: string;
  readonly draftStorageWarning: string;
  readonly finalQuizTitle: string;
  readonly finalQuizIntro: string;
  readonly beginQuiz: string;
  readonly checkAnswer: string;
  readonly nextQuestion: string;
  readonly retryQuiz: string;
  readonly finishQuiz: string;
  readonly questionProgressTemplate: string;
  readonly scoreSummaryTemplate: string;
  readonly bestScoreTemplate: string;
  readonly passRequirement: string;
  readonly resetConfirm: string;
  readonly resetDone: string;
  readonly resetNotSaved: string;
  readonly capstonePath: string;
  readonly capstoneArtifacts: string;
  readonly capstoneComplete: string;
  readonly capstoneIncomplete: string;
  readonly completeCapstone: string;
  readonly completionSummary: string;
  readonly exportSummary: string;
  readonly authenticFigure: string;
  readonly figureSource: string;
  readonly openFigureFullSize: string;
  readonly classroomNotice: string;
}

export interface GithubCourseCopy {
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
    readonly disclaimer: string;
  };
  readonly ui: GithubUiCopy;
  readonly units: Readonly<
    Record<GithubUnitId, { readonly title: string; readonly summary: string }>
  >;
  readonly lessons: Readonly<Record<GithubLessonSlug, GithubLessonCopy>>;
  readonly quiz: Readonly<Record<GithubQuizId, GithubQuizCopy>>;
  readonly figures: Readonly<Record<GithubFigureId, GithubFigureCopy>>;
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly steps: readonly string[];
    readonly artifacts: readonly {
      readonly id: string;
      readonly title: string;
      readonly description: string;
    }[];
    readonly completion: string;
  };
}

export interface GithubQuizManifest {
  readonly id: GithubQuizId;
  readonly lessonSlug: GithubLessonSlug;
  readonly unitId: GithubUnitId;
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly sourceIds: readonly [GithubSourceId, ...GithubSourceId[]];
}

export interface MaterializedGithubFigure {
  readonly manifest: GithubFigureManifest;
  readonly copy: GithubFigureCopy;
}

export interface MaterializedGithubLesson extends GithubLessonManifest {
  readonly copy: GithubLessonCopy;
  readonly figures: readonly MaterializedGithubFigure[];
  readonly sources: readonly GithubSourceRecord[];
  readonly quiz: readonly (GithubQuizManifest & {
    readonly copy: GithubQuizCopy;
  })[];
}

export interface MaterializedGithubCourse {
  readonly locale: GithubLocale;
  readonly manifest: GithubCourseManifest;
  readonly copy: GithubCourseCopy;
  readonly units: readonly (GithubUnitManifest & {
    readonly copy: GithubCourseCopy["units"][GithubUnitId];
    readonly lessons: readonly MaterializedGithubLesson[];
  })[];
}
