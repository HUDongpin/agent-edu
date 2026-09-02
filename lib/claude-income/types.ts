import type { LOCALE_CODES } from "@/lib/i18n";

export const CLAUDE_INCOME_SLUG = "claude-income" as const;
export const CLAUDE_INCOME_DISPLAY_NUMBER = 12 as const;
export const CLAUDE_INCOME_CONTENT_LANGUAGE = "en" as const;
export const CLAUDE_INCOME_ENGLISH_BODY_NOTICE =
  "Course 12 is currently taught in English. The site shell remains in your selected language." as const;

export type ClaudeIncomeLocale = (typeof LOCALE_CODES)[number];

export type ClaudeIncomeUnitId =
  | "prove-value"
  | "deliver-value"
  | "systemize-value"
  | "sell-responsibly";

export type ClaudeIncomeLessonSlug =
  | "choose-a-money-path"
  | "validate-paid-demand"
  | "scope-and-price-the-offer"
  | "write-a-delivery-spec"
  | "run-client-projects"
  | "sell-citation-grade-research"
  | "deliver-files-that-survive-review"
  | "standardize-with-skills-and-connectors"
  | "prototype-with-artifacts"
  | "build-software-with-claude"
  | "earn-trust-and-retainers"
  | "capstone-seven-day-demand-test";

export type ClaudeIncomeSourceKind =
  | "academy"
  | "official-help"
  | "official-docs"
  | "official-legal"
  | "github"
  | "x-post"
  | "case-study"
  | "platform-policy";

export type ClaudeIncomeClaimClass =
  | "verified-capability"
  | "current-plan-or-policy"
  | "practitioner-report"
  | "course-synthesis"
  | "hypothetical-example";

export interface ClaudeIncomeSource {
  readonly id: string;
  readonly kind: ClaudeIncomeSourceKind;
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly accessedOn: string;
  readonly evidenceGrade: "A" | "B" | "C" | "D";
  readonly claimClass: ClaudeIncomeClaimClass;
  readonly supports: string;
  readonly limitations: string;
  readonly volatility: "low" | "medium" | "high";
  readonly license?: string;
  readonly pinnedRevision?: string;
  readonly immutableUrl?: string;
  readonly rightsStatus: "link-only" | "official-link" | "licensed-code";
}

export interface ClaudeIncomeAssetVariant {
  readonly src: string;
  readonly width: number;
  readonly sha256: string;
}

export interface ClaudeIncomeFigure {
  readonly id: string;
  readonly title: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly variants: readonly ClaudeIncomeAssetVariant[];
  readonly alt: string;
  readonly caption: string;
  readonly observedOn: string;
  readonly surface: string;
  readonly sourceUrl: string;
  readonly captureBasis: "course-authored-real-ui-capture";
  readonly contentMode: "blank-ui" | "synthetic-example" | "anthropic-supplied-example";
  readonly privacyReview: "passed";
  readonly rightsStatus: "course-authored-capture";
  readonly volatility: "high";
  readonly teachingPoints: readonly string[];
}

export interface ClaudeIncomeSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly string[];
  readonly claimClass: ClaudeIncomeClaimClass;
  readonly sourceIds: readonly string[];
}

export interface ClaudeIncomePractice {
  readonly title: string;
  readonly brief: string;
  readonly estimatedMinutes: number;
  readonly steps: readonly string[];
  readonly deliverables: readonly string[];
  readonly doneWhen: readonly string[];
  readonly safety: string;
}

export interface ClaudeIncomeLesson {
  readonly slug: ClaudeIncomeLessonSlug;
  readonly order: number;
  readonly unitId: ClaudeIncomeUnitId;
  readonly minutes: number;
  readonly title: string;
  readonly kicker: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly ClaudeIncomeSection[];
  readonly workflow: readonly string[];
  readonly promptTemplate: string;
  readonly economics: string;
  readonly qualityGate: readonly string[];
  readonly redFlags: readonly string[];
  readonly practice: ClaudeIncomePractice;
  readonly checkpoint: {
    readonly prompt: string;
    readonly answer: string;
  };
  readonly takeaway: string;
  readonly figureIds: readonly string[];
  readonly sourceIds: readonly string[];
}

export interface ClaudeIncomeUnit {
  readonly id: ClaudeIncomeUnitId;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly outcome: string;
  readonly lessonSlugs: readonly ClaudeIncomeLessonSlug[];
}

export interface ClaudeIncomeQuizQuestion {
  readonly id: string;
  readonly unitId: ClaudeIncomeUnitId;
  readonly lessonSlug: ClaudeIncomeLessonSlug;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly sourceIds: readonly string[];
  readonly critical?: boolean;
}

export interface ClaudeIncomeCourse {
  readonly id: "claude-income";
  readonly displayNumber: 12;
  readonly version: string;
  readonly researchedOn: string;
  readonly reviewedOn: string;
  readonly contentLanguage: "en";
  readonly title: string;
  readonly shortTitle: string;
  readonly summary: string;
  readonly audience: string;
  readonly prerequisite: string;
  readonly disclaimer: string;
  readonly practitionerDisclaimer: string;
  readonly independentProjectNotice: string;
  readonly units: readonly ClaudeIncomeUnit[];
  readonly lessons: readonly ClaudeIncomeLesson[];
}
