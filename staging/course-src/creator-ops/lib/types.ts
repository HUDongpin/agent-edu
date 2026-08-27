export const CREATOR_OPS_COURSE_ID = "creator-ops" as const;
export const CREATOR_OPS_DEFAULT_CONTENT_LOCALE = "en" as const;

export const CREATOR_OPS_LOCALES = [
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

export const CREATOR_OPS_PHASE_IDS = ["radar", "studio", "publish", "learn"] as const;

export const CREATOR_OPS_MODULE_SLUGS = [
  "outcomes-operating-system",
  "audience-signal-radar",
  "evidence-research-packet",
  "editorial-agent-architecture",
  "writing-brand-fact-gates",
  "multimodal-asset-pipeline",
  "repurpose-content-assets",
  "human-approved-distribution",
  "community-analytics-loop",
  "evaluation-governance-capstone",
] as const;

export type CreatorOpsLocale = (typeof CREATOR_OPS_LOCALES)[number];
export type CreatorOpsPhaseId = (typeof CREATOR_OPS_PHASE_IDS)[number];
export type CreatorOpsModuleSlug = (typeof CREATOR_OPS_MODULE_SLUGS)[number];
export type CreatorOpsSourceDecision = "pass" | "conditional" | "excluded";
export type CreatorOpsSourceRole =
  | "core-runtime"
  | "research-input"
  | "production"
  | "distribution"
  | "measurement"
  | "assurance"
  | "license-case";

export interface CreatorOpsSourceRecord {
  readonly id: string;
  readonly repository: string;
  readonly publisher: string;
  readonly url: string;
  readonly revision: string;
  readonly committedAt: string;
  readonly licenseUrl: string;
  readonly additionalLicenseUrls?: readonly [string, ...string[]];
  readonly license: string;
  readonly decision: CreatorOpsSourceDecision;
  readonly role: CreatorOpsSourceRole;
  readonly accessedOn: string;
  readonly snapshot: string;
  readonly supports: Readonly<Record<"en" | "zh-Hans", string>>;
  readonly boundary: Readonly<Record<"en" | "zh-Hans", string>>;
}

export interface CreatorOpsPhaseManifest {
  readonly id: CreatorOpsPhaseId;
  readonly order: number;
  readonly moduleSlugs: readonly CreatorOpsModuleSlug[];
}

export interface CreatorOpsModuleManifest {
  readonly slug: CreatorOpsModuleSlug;
  readonly order: number;
  readonly phaseId: CreatorOpsPhaseId;
  readonly minutes: number;
  readonly sourceIds: readonly [string, ...string[]];
}

export interface CreatorOpsCourseManifest {
  readonly id: typeof CREATOR_OPS_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 16;
  /** Authored and validated, but deliberately absent from every public surface. */
  readonly releaseState: "staged";
  readonly authoredOn: string;
  readonly defaultContentLocale: typeof CREATOR_OPS_DEFAULT_CONTENT_LOCALE;
  readonly phases: readonly CreatorOpsPhaseManifest[];
  readonly modules: readonly CreatorOpsModuleManifest[];
}

export interface CreatorOpsSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
  readonly sourceIds: readonly [string, ...string[]];
}

export interface CreatorOpsPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly artifact: string;
  /** Safe filename for the single Markdown package exported by the browser workbench. */
  readonly downloadFilename: string;
  readonly template: string;
  readonly reviewGate: string;
}

export interface CreatorOpsCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface CreatorOpsModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly riskGate: string;
  readonly sections: readonly [CreatorOpsSectionCopy, CreatorOpsSectionCopy, CreatorOpsSectionCopy];
  readonly practice: CreatorOpsPracticeCopy;
  readonly checkpoint: CreatorOpsCheckpointCopy;
  readonly takeaway: string;
}

export interface CreatorOpsFinalQuestionCopy extends CreatorOpsCheckpointCopy {
  readonly id: string;
  readonly moduleTitle: string;
}

export interface CreatorOpsCourseCopy {
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
    readonly languageNotice: string;
    readonly evidenceNote: string;
  };
  readonly ui: Readonly<Record<string, string>>;
  readonly principles: readonly [string, string, string, string, string];
  readonly outcomes: readonly [string, string, string, string, string, string, string, string];
  readonly phases: Readonly<Record<CreatorOpsPhaseId, {
    readonly title: string;
    readonly summary: string;
    readonly verb: string;
  }>>;
  readonly sourceDecisions: Readonly<Record<CreatorOpsSourceDecision, string>>;
  readonly modules: Readonly<Record<CreatorOpsModuleSlug, CreatorOpsModuleCopy>>;
  readonly finalAssessment: {
    readonly title: string;
    readonly summary: string;
    readonly passPercent: 80;
    readonly questions: readonly [CreatorOpsFinalQuestionCopy, ...CreatorOpsFinalQuestionCopy[]];
  };
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly artifacts: readonly [string, ...string[]];
    readonly reviewQuestions: readonly [string, ...string[]];
    readonly completionStatement: string;
  };
}

export interface MaterializedCreatorOpsModule extends CreatorOpsModuleManifest {
  readonly copy: CreatorOpsModuleCopy;
  readonly sources: readonly CreatorOpsSourceRecord[];
}

export interface MaterializedCreatorOpsPhase extends CreatorOpsPhaseManifest {
  readonly copy: CreatorOpsCourseCopy["phases"][CreatorOpsPhaseId];
  readonly modules: readonly MaterializedCreatorOpsModule[];
}

export interface MaterializedCreatorOpsCourse {
  readonly locale: CreatorOpsLocale;
  readonly contentLocale: "en" | "zh-Hans";
  readonly contentDirection: "ltr";
  readonly manifest: CreatorOpsCourseManifest;
  readonly copy: CreatorOpsCourseCopy;
  readonly modules: readonly MaterializedCreatorOpsModule[];
  readonly phases: readonly MaterializedCreatorOpsPhase[];
}
