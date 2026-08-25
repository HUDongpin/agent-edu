export const GROK_COURSE_ID = "how-to-use-grok" as const;

export const GROK_LOCALES = [
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

export const GROK_LESSON_SLUGS = [
  "map-grok",
  "read-interface",
  "privacy-boundaries",
  "task-contracts",
  "search-verify",
  "files-data",
  "software-engineering",
  "research-workflow",
  "writing-workflow",
  "office-workflow",
  "teaching-workflow",
  "imagine-multimodal",
  "connect-automate",
  "capstone",
] as const;

export const GROK_QUIZ_IDS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
] as const;

export const GROK_FIGURE_IDS = [
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
] as const;

export type GrokLocale = (typeof GROK_LOCALES)[number];
export type GrokLessonSlug = (typeof GROK_LESSON_SLUGS)[number];
export type GrokQuizId = (typeof GROK_QUIZ_IDS)[number];
export type GrokUnitId = "start" | "ground" | "studios" | "create";
export type GrokFigureId = (typeof GROK_FIGURE_IDS)[number];
export type GrokSourceId = string;

export interface GrokUnitManifest {
  readonly id: GrokUnitId;
  readonly order: number;
  readonly lessonSlugs: readonly GrokLessonSlug[];
}

export interface GrokLessonManifest {
  readonly slug: GrokLessonSlug;
  readonly order: number;
  readonly unitId: GrokUnitId;
  readonly minutes: number;
  readonly prerequisites: readonly GrokLessonSlug[];
  readonly figureIds: readonly GrokFigureId[];
  readonly sourceIds: readonly GrokSourceId[];
  readonly quizId: GrokQuizId;
}

export interface GrokCourseManifest {
  readonly id: typeof GROK_COURSE_ID;
  readonly version: string;
  readonly publishedOn: string;
  readonly verifiedOn: string;
  readonly level: "beginner-to-advanced";
  readonly minutes: number;
  readonly passingScore: number;
  readonly units: readonly GrokUnitManifest[];
  readonly lessons: readonly GrokLessonManifest[];
}

export interface GrokSourceRecord {
  readonly id: GrokSourceId;
  readonly kind: "official-product" | "official-doc" | "official-legal" | "official-github" | "community-github";
  readonly tier: "primary" | "corroborating";
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly accessedOn: string;
  readonly verifiedOn: string;
  readonly publishedOn?: string;
  readonly commit?: string;
  readonly license?: string;
  readonly supports: readonly string[];
  readonly boundary: string;
  readonly reuseMode: "paraphrase-and-link" | "asset-with-attribution";
}

export interface GrokFigureCallout {
  readonly id: string;
  readonly labelKey: string;
  readonly xPercent: number;
  readonly yPercent: number;
}

export interface GrokFigureManifest {
  readonly id: GrokFigureId;
  readonly status: "available";
  readonly usedBy: readonly GrokLessonSlug[];
  readonly surface: "web-chat" | "settings" | "usage" | "build" | "office" | "imagine";
  readonly src: string;
  readonly srcSet: {
    readonly webp1120: string;
    readonly webp2240: string;
    readonly mobile: string;
  };
  readonly derivatives: {
    readonly webp1120: GrokFigureDerivative;
    readonly webp2240: GrokFigureDerivative;
    readonly mobile: GrokFigureDerivative;
  };
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly sourceUrl: string;
  readonly capturedOn: string;
  readonly verifiedOn: string;
  readonly productVersion: string;
  readonly accountTier: string;
  readonly captureEnvironment: string;
  readonly viewport: string;
  readonly locale: "en";
  readonly theme: "light" | "dark";
  readonly privacyReview: {
    readonly status: "passed";
    readonly syntheticOrPublicDataOnly: true;
    readonly note: string;
  };
  readonly rightsBasis: string;
  readonly altKey: string;
  readonly captionKey: string;
  readonly callouts: readonly GrokFigureCallout[];
}

export interface GrokFigureDerivative {
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

export interface GrokSectionCopy {
  readonly eyebrow: string;
  readonly heading: string;
  readonly body: string;
}

export interface GrokPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly prompt: string;
  readonly steps: readonly string[];
  readonly proof: readonly string[];
  readonly safety: string;
}

export interface GrokLessonCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly GrokSectionCopy[];
  readonly practice: GrokPracticeCopy;
  readonly checkpoint: { readonly question: string; readonly answer: string };
  readonly takeaway: string;
  readonly limit: string;
}

export interface GrokQuizCopy {
  readonly question: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
}

export interface GrokCourseCopy {
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly duration: string;
    readonly verified: string;
    readonly independent: string;
    readonly sourceNote: string;
    readonly startCta: string;
    readonly resumeCta: string;
    readonly outcome: string;
  };
  readonly ui: Record<string, string>;
  readonly units: Record<GrokUnitId, { readonly title: string; readonly summary: string }>;
  readonly lessons: Record<GrokLessonSlug, GrokLessonCopy>;
  readonly figures: Record<string, { readonly alt: string; readonly caption: string; readonly callouts: Record<string, string> }>;
  readonly quiz: Record<string, GrokQuizCopy>;
}

export interface MaterializedGrokLesson extends GrokLessonManifest {
  readonly copy: GrokLessonCopy;
  readonly figures: readonly { readonly manifest: GrokFigureManifest; readonly copy: GrokCourseCopy["figures"][string] }[];
  readonly sources: readonly GrokSourceRecord[];
}

export interface MaterializedGrokCourse {
  readonly locale: GrokLocale;
  readonly manifest: GrokCourseManifest;
  readonly copy: GrokCourseCopy;
  readonly units: readonly (GrokUnitManifest & {
    readonly copy: GrokCourseCopy["units"][GrokUnitId];
    readonly lessons: readonly MaterializedGrokLesson[];
  })[];
}
