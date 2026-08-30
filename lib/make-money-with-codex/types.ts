export const MAKE_MONEY_WITH_CODEX_COURSE_ID = "make-money-with-codex" as const;
export const MAKE_MONEY_WITH_CODEX_COURSE_VERSION = "1.0.0" as const;
export const MAKE_MONEY_WITH_CODEX_LEVEL = "intermediate-to-advanced" as const;
export const MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY = "make-money-with-codex.course.version" as const;
export const MAKE_MONEY_WITH_CODEX_QUIZ_VERSION = "2026-08-24.1" as const;
export const MAKE_MONEY_WITH_CODEX_CAPSTONE_ITEM_COUNT = 13 as const;

export const MAKE_MONEY_WITH_CODEX_EVIDENCE_CLASSES = [
  "commercial-signal",
  "paid-offer",
  "business-process",
  "official-workflow",
  "scope-exclusion",
] as const;

export const MAKE_MONEY_WITH_CODEX_LOCALES = [
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

export const MAKE_MONEY_WITH_CODEX_LESSON_SLUGS = [
  "money-not-magic",
  "choose-market-wedge",
  "validate-before-building",
  "write-commercial-spec",
  "protect-client-work",
  "build-verified-pilot",
  "price-for-margin",
  "sell-with-proof",
  "deliver-with-control",
  "productize-reuse",
  "retain-and-automate",
  "launch-capstone",
] as const;

export const MAKE_MONEY_WITH_CODEX_QUIZ_IDS = [
  "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12",
] as const;

export const MAKE_MONEY_WITH_CODEX_FIGURE_IDS = [
  "fig-1", "fig-2", "fig-3", "fig-4", "fig-5", "fig-6", "fig-7", "fig-8", "fig-9",
] as const;

export const MAKE_MONEY_WITH_CODEX_PRACTICE_IDS = [
  "practice-money-not-magic",
  "practice-choose-market-wedge",
  "practice-validate-before-building",
  "practice-write-commercial-spec",
  "practice-protect-client-work",
  "practice-build-verified-pilot",
  "practice-price-for-margin",
  "practice-sell-with-proof",
  "practice-deliver-with-control",
  "practice-productize-reuse",
  "practice-retain-and-automate",
  "practice-launch-capstone",
] as const;

export const MAKE_MONEY_WITH_CODEX_SOURCE_IDS = [
  "academy-builders",
  "academy-bootcamp",
  "academy-small-business",
  "academy-goliath",
  "academy-proaction",
  "academy-marco",
  "academy-contractor-exclusion",
  "academy-business-ops",
  "academy-account-brief",
  "openai-app",
  "openai-auth",
  "openai-pricing",
  "openai-prompting",
  "openai-security",
  "openai-worktrees",
  "openai-agents-md",
  "openai-skills",
  "openai-automations",
  "openai-code-review",
  "github-openai-codex",
  "github-codex-action",
  "github-tokengauge-discussion",
  "github-tokengauge-repo",
  "openai-community",
  "x-ashe-productized",
  "x-pedro-build-time",
  "x-este-productivity",
  "x-fka-demo",
  "x-billy-dashboard",
  "x-devzero-reader",
  "x-nate-review",
  "x-flavio-app",
  "x-kr0der-plan",
  "x-rudrank-fix",
  "x-steipete-pr",
] as const;

export type CodexIncomeLocale = (typeof MAKE_MONEY_WITH_CODEX_LOCALES)[number];
export type CodexIncomeLessonSlug = (typeof MAKE_MONEY_WITH_CODEX_LESSON_SLUGS)[number];
export type CodexIncomeUnitId = "value" | "pilot" | "sell" | "scale";
export type CodexIncomeFigureId = (typeof MAKE_MONEY_WITH_CODEX_FIGURE_IDS)[number];
export type CodexIncomeSourceId = (typeof MAKE_MONEY_WITH_CODEX_SOURCE_IDS)[number];
export type CodexIncomeQuizId = (typeof MAKE_MONEY_WITH_CODEX_QUIZ_IDS)[number];
export type CodexIncomePracticeId = (typeof MAKE_MONEY_WITH_CODEX_PRACTICE_IDS)[number];
export type EvidenceClass = (typeof MAKE_MONEY_WITH_CODEX_EVIDENCE_CLASSES)[number];

export interface CodexIncomeSource {
  readonly id: CodexIncomeSourceId;
  readonly title: string;
  readonly publisher: string;
  readonly kind:
    | "openai-academy"
    | "openai-doc"
    | "openai-github"
    | "community-github"
    | "x-post";
  readonly evidenceClass: EvidenceClass;
  readonly url: string;
  readonly accessedOn: string;
  readonly publishedOn?: string;
  readonly updatedOn?: string;
  readonly eventOn?: string;
  readonly supports: string;
  readonly boundary: string;
}

export interface CodexIncomeFigure {
  readonly id: CodexIncomeFigureId;
  readonly src: string;
  readonly webp: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly webpSha256: string;
  readonly sourceUrl: string;
  readonly sourcePage: string;
  readonly sourceAuthor: string;
  readonly sourceDate?: string;
  readonly verifiedOn: string;
  readonly surface: "codex-app" | "codex-cli" | "product-output" | "repository-handoff";
  readonly captureMethod:
    | "official-repository-image"
    | "first-party-synthetic-capture";
  readonly alt: string;
  readonly caption: string;
  readonly boundary: string;
  readonly rightsBasis:
    | "apache-2.0-pinned-source"
    | "first-party-original";
  readonly rightsEvidencePath?: string;
  readonly visiblePublicIdentifiers: readonly string[];
  readonly privacyReview: string;
}

export interface CodexIncomeSection {
  readonly eyebrow: string;
  readonly heading: string;
  readonly body: readonly string[];
  readonly bullets?: readonly string[];
  readonly example?: {
    readonly label: string;
    readonly title: string;
    readonly text: string;
  };
  readonly warning?: string;
  readonly figureId?: CodexIncomeFigureId;
}

export interface CodexIncomePractice {
  readonly id: CodexIncomePracticeId;
  readonly lessonSlug: CodexIncomeLessonSlug;
  readonly title: string;
  readonly brief: string;
  readonly prompt: string;
  readonly steps: readonly string[];
  readonly deliverables: readonly string[];
  readonly guardrail: string;
}

export interface CodexIncomeLesson {
  readonly slug: CodexIncomeLessonSlug;
  readonly order: number;
  readonly unitId: CodexIncomeUnitId;
  readonly minutes: number;
  readonly title: string;
  readonly summary: string;
  readonly outcome: string;
  readonly objectives: readonly string[];
  readonly evidenceClasses: readonly EvidenceClass[];
  readonly sourceIds: readonly CodexIncomeSourceId[];
  readonly sections: readonly CodexIncomeSection[];
  readonly practice: CodexIncomePractice;
  readonly checkpoint: {
    readonly question: string;
    readonly answer: string;
  };
  readonly takeaway: string;
}

export interface CodexIncomeUnit {
  readonly id: CodexIncomeUnitId;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly lessonSlugs: readonly CodexIncomeLessonSlug[];
}

export interface CodexIncomeQuizQuestion {
  readonly id: CodexIncomeQuizId;
  readonly lessonSlug: CodexIncomeLessonSlug;
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
  readonly sourceIds: readonly CodexIncomeSourceId[];
}

export interface CodexIncomeCourse {
  readonly id: typeof MAKE_MONEY_WITH_CODEX_COURSE_ID;
  readonly version: typeof MAKE_MONEY_WITH_CODEX_COURSE_VERSION;
  readonly level: typeof MAKE_MONEY_WITH_CODEX_LEVEL;
  readonly publishedOn: string;
  readonly verifiedOn: string;
  readonly title: string;
  readonly kicker: string;
  readonly summary: string;
  readonly audience: string;
  readonly promise: string;
  readonly nonPromise: string;
  readonly passingScore: number;
  readonly units: readonly CodexIncomeUnit[];
  readonly lessons: readonly CodexIncomeLesson[];
  readonly quiz: readonly CodexIncomeQuizQuestion[];
}

export interface CodexIncomeLocaleCopy {
  readonly meta: {
    readonly title: string;
    readonly shortTitle: string;
    readonly languageNotice: string;
  };
  readonly availability: {
    readonly contentLanguage: "en";
    readonly localizedScope: "navigation-and-titles";
    readonly reviewStatus: "pending-independent-native-review";
  };
  readonly ui: {
    readonly course: string;
    readonly courses: string;
    readonly courseOutline: string;
    readonly lesson: string;
    readonly lessons: string;
    readonly minutes: string;
    readonly guidedWork: string;
    readonly authenticUi: string;
    readonly evidenceVerified: string;
    readonly startCourse: string;
    readonly inspectLessons: string;
    readonly curriculum: string;
    readonly time: string;
    readonly output: string;
    readonly evidence: string;
    readonly boundedSources: string;
    readonly previous: string;
    readonly next: string;
    readonly courseDashboard: string;
    readonly reviewEvidencePath: string;
    readonly backToCatalog: string;
    readonly resetConfirm: string;
  };
  readonly units: Readonly<Record<CodexIncomeUnitId, { readonly title: string }>>;
  readonly lessons: Readonly<Record<CodexIncomeLessonSlug, { readonly title: string }>>;
}
