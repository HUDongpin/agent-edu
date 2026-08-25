export const SOFTWARE_ENGINEERING_COURSE_ID = "software-engineering-with-agentic-ai" as const;

export const SOFTWARE_ENGINEERING_SOURCE_SNAPSHOT_ON = "2026-08-23" as const;

export const SOFTWARE_ENGINEERING_LOCALES = [
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

export const SOFTWARE_ENGINEERING_UNIT_IDS = [
  "frame",
  "shape",
  "verify",
  "deliver",
  "govern",
] as const;

export const SOFTWARE_ENGINEERING_LESSON_SLUGS = [
  "agentic-engineering-system",
  "requirements-task-contracts",
  "architecture-tradeoffs",
  "planning-estimation-risk",
  "repository-context",
  "git-environments-worktrees",
  "construction-quality",
  "testing-strategy",
  "debugging-root-cause",
  "review-refactoring-debt",
  "documentation-knowledge",
  "cicd-release",
  "reliability-observability",
  "performance-economics",
  "security-privacy-supply-chain",
  "teams-governance",
  "agent-evaluation",
  "capstone-safe-change",
] as const;

export const SOFTWARE_ENGINEERING_QUESTION_IDS = [
  "q01", "q02", "q03", "q04", "q05",
  "q06", "q07", "q08", "q09", "q10",
  "q11", "q12", "q13", "q14", "q15",
  "q16", "q17", "q18", "q19", "q20",
  "q21", "q22", "q23", "q24", "q25",
] as const;

export const SOFTWARE_ENGINEERING_MEDIA_IDS = [
  "codex-plan-ui",
  "claude-cowork-ui",
  "claude-artifact-workspace-ui",
  "github-project-ui",
  "github-branch-ui",
  "github-diff-ui",
  "github-review-ui",
  "github-actions-ui",
  "github-release-ui",
] as const;

export type SoftwareEngineeringLocale = (typeof SOFTWARE_ENGINEERING_LOCALES)[number];
export type SoftwareEngineeringUnitId = (typeof SOFTWARE_ENGINEERING_UNIT_IDS)[number];
export type SoftwareEngineeringLessonSlug = (typeof SOFTWARE_ENGINEERING_LESSON_SLUGS)[number];
export type SoftwareEngineeringQuestionId = (typeof SOFTWARE_ENGINEERING_QUESTION_IDS)[number];
export type SoftwareEngineeringMediaId = (typeof SOFTWARE_ENGINEERING_MEDIA_IDS)[number];

export type SoftwareEngineeringSourceKind =
  | "official-academy"
  | "official-doc"
  | "official-standard"
  | "official-github"
  | "peer-reviewed"
  | "research-preprint"
  | "replication-package"
  | "maintainer-policy"
  | "practitioner-guide";

export interface SoftwareEngineeringSourceRecord {
  readonly id: string;
  readonly tier: "primary" | "corroborating" | "case-study";
  readonly kind: SoftwareEngineeringSourceKind;
  readonly title: string;
  readonly publisher: string;
  readonly url: `https://${string}`;
  readonly accessedOn: typeof SOFTWARE_ENGINEERING_SOURCE_SNAPSHOT_ON;
  readonly licence: string;
  readonly reuse: "paraphrase-and-link" | "asset-reused-with-attribution";
  readonly evidenceUse: string;
  readonly caveat: string;
}

export interface SoftwareEngineeringMediaRecord {
  readonly id: SoftwareEngineeringMediaId;
  readonly title: string;
  readonly product: "OpenAI Codex" | "Claude" | "GitHub";
  readonly lessonSlugs: readonly SoftwareEngineeringLessonSlug[];
  readonly src: `/${string}`;
  readonly webpSrc: `/${string}`;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly webpWidth: number;
  readonly webpHeight: number;
  readonly webpSha256: string;
  readonly sourceUrl: `https://${string}`;
  readonly immutableSourceUrl?: `https://${string}`;
  readonly sourceCommit?: string;
  readonly provenance: "licensed-repository" | "course-authored-capture";
  readonly licence: "Apache-2.0" | "MIT" | "CC-BY-4.0" | "Editorial capture";
  readonly licenceUrl: `https://${string}`;
  readonly observedOn: typeof SOFTWARE_ENGINEERING_SOURCE_SNAPSHOT_ON;
  readonly privacyReviewed: true;
  readonly alt: string;
  readonly caption: string;
  readonly transcript: readonly string[];
  readonly rightsNote: string;
}

export interface SoftwareEngineeringSection {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
  readonly code?: {
    readonly label: string;
    readonly language: "text" | "markdown" | "shell" | "yaml" | "json";
    readonly value: string;
  };
}

export interface SoftwareEngineeringPractice {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly evidence: readonly [string, ...string[]];
  readonly safety: string;
}

export interface SoftwareEngineeringCheckpoint {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface SoftwareEngineeringLesson {
  readonly slug: SoftwareEngineeringLessonSlug;
  readonly order: number;
  readonly unitId: SoftwareEngineeringUnitId;
  readonly minutes: number;
  readonly title: string;
  readonly kicker: string;
  readonly summary: string;
  readonly objective: string;
  readonly concepts: readonly [string, ...string[]];
  readonly sections: readonly [
    SoftwareEngineeringSection,
    SoftwareEngineeringSection,
    SoftwareEngineeringSection,
  ];
  readonly practice: SoftwareEngineeringPractice;
  readonly checkpoint: SoftwareEngineeringCheckpoint;
  readonly takeaway: string;
  readonly sourceIds: readonly [string, ...string[]];
  readonly mediaIds: readonly SoftwareEngineeringMediaId[];
}

export interface SoftwareEngineeringUnit {
  readonly id: SoftwareEngineeringUnitId;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly lessonSlugs: readonly SoftwareEngineeringLessonSlug[];
}

export interface SoftwareEngineeringQuestion extends SoftwareEngineeringCheckpoint {
  readonly id: SoftwareEngineeringQuestionId;
  readonly unitId: SoftwareEngineeringUnitId;
  readonly sourceIds: readonly [string, ...string[]];
}

export interface SoftwareEngineeringLocaleCopy {
  readonly meta: {
    readonly title: string;
    readonly shortTitle: string;
    readonly languageNotice: string;
  };
  readonly ui: {
    readonly course: string;
    readonly lessons: string;
    readonly minutes: string;
    readonly source: string;
    readonly sources: string;
    readonly objective: string;
    readonly concepts: string;
    readonly practice: string;
    readonly evidence: string;
    readonly checkpoint: string;
    readonly takeaway: string;
    readonly previous: string;
    readonly next: string;
    readonly courseMap: string;
    readonly openCourseMap: string;
    readonly allLessons: string;
    readonly progress: string;
    readonly browserStorageNote: string;
    readonly storageUnavailable: string;
    readonly javascriptRequired: string;
    readonly markComplete: string;
    readonly completed: string;
    readonly resetProgress: string;
    readonly resetConfirm: string;
    readonly resetDone: string;
    readonly startCourse: string;
    readonly resumeCourse: string;
    readonly finalAssessment: string;
    readonly assessmentIntro: string;
    readonly beginAssessment: string;
    readonly questionProgress: string;
    readonly checkAnswer: string;
    readonly correct: string;
    readonly incorrect: string;
    readonly nextQuestion: string;
    readonly finishAssessment: string;
    readonly retryAssessment: string;
    readonly quizPassed: string;
    readonly quizNeedsReview: string;
    readonly bestScore: string;
    readonly passRequirement: string;
    readonly capstone: string;
    readonly capstoneArtifacts: string;
    readonly completeCapstone: string;
    readonly capstoneComplete: string;
    readonly capstoneIncomplete: string;
    readonly releaseDecisionRelease: string;
    readonly releaseDecisionConditional: string;
    readonly releaseDecisionDoNotRelease: string;
    readonly rubric: string;
    readonly downloadBrief: string;
    readonly transcript: string;
    readonly figureSource: string;
    readonly verifiedOn: string;
    readonly licence: string;
    readonly authenticUi: string;
    readonly curriculum: string;
    readonly coverage: string;
    readonly courseIntegrity: string;
    readonly backToCatalog: string;
  };
  readonly units: Readonly<Record<SoftwareEngineeringUnitId, { readonly title: string }>>;
  readonly lessons: Readonly<Record<SoftwareEngineeringLessonSlug, { readonly title: string }>>;
}

export interface MaterializedSoftwareEngineeringLesson extends SoftwareEngineeringLesson {
  readonly localizedTitle: string;
  readonly sources: readonly SoftwareEngineeringSourceRecord[];
  readonly media: readonly SoftwareEngineeringMediaRecord[];
}

export interface MaterializedSoftwareEngineeringCourse {
  readonly locale: SoftwareEngineeringLocale;
  readonly contentLocale: "en";
  readonly copy: SoftwareEngineeringLocaleCopy;
  readonly units: readonly (SoftwareEngineeringUnit & {
    readonly localizedTitle: string;
    readonly lessons: readonly MaterializedSoftwareEngineeringLesson[];
  })[];
}
