export const MCP_COURSE_SEQUENCE = 10 as const;
export const MCP_PROTOCOL_VERSION = "2026-07-28" as const;
export const MCP_COURSE_VERSION = "1.0.0" as const;
export const MCP_ASSESSMENT_VERSION = "2026-07-28-v2" as const;

export const MCP_LOCALES = [
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

export type McpLocale = (typeof MCP_LOCALES)[number];
export type McpDirection = "ltr" | "rtl";
export type McpEvidenceDate = "2026-08-23" | "2026-08-24";
export type McpSourceTier = "normative" | "official-guide" | "academy" | "practitioner";
export type McpSourcePublisher =
  | "Model Context Protocol"
  | "Anthropic"
  | "OpenAI"
  | "Google"
  | "GitHub"
  | "Community project";

export interface McpSource {
  readonly id: string;
  readonly title: string;
  readonly publisher: McpSourcePublisher;
  readonly tier: McpSourceTier;
  readonly url: string;
  readonly accessedOn: McpEvidenceDate;
  readonly protocolVersion?: typeof MCP_PROTOCOL_VERSION;
  readonly note: string;
}

export interface McpFigure {
  readonly id: string;
  readonly src: string;
  readonly webpSrc: string;
  readonly mobileWebpSrc: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly caption: string;
  readonly teachingPoint: string;
  readonly evidenceClass: "direct-mcp-ui" | "host-inventory" | "host-context" | "design-example";
  readonly legacyNote?: string;
  readonly sourceUrl: string;
  readonly publisher: "Model Context Protocol" | "Google" | "OpenAI";
  readonly observedOn: McpEvidenceDate;
  readonly rights: string;
  readonly sha256: string;
}

export interface McpCodeExample {
  readonly label: string;
  readonly language: "json" | "jsonc" | "python" | "typescript" | "shell" | "toml" | "text";
  readonly value: string;
}

export interface McpLessonSection {
  readonly heading: string;
  readonly body: readonly string[];
  readonly bullets?: readonly string[];
  readonly code?: McpCodeExample;
  readonly callout?: {
    readonly tone: "current" | "caution" | "practice";
    readonly title: string;
    readonly body: string;
  };
}

export interface McpPractice {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly string[];
  readonly evidence: readonly string[];
  readonly safety: string;
}

export interface McpKnowledgeCheck {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface McpAssessmentQuestion extends McpKnowledgeCheck {
  readonly id: string;
  readonly reviewSlug: string;
  readonly outcome: string;
}

export interface McpLesson {
  readonly slug: string;
  readonly order: number;
  readonly unitId: string;
  readonly minutes: number;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly conceptIds: readonly string[];
  readonly sections: readonly McpLessonSection[];
  readonly figureIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly practice: McpPractice;
  readonly check: McpKnowledgeCheck;
  readonly takeaway: string;
  readonly interactive?: "architecture" | "envelope" | "tool-contract" | "risk-review";
}

export interface McpUnit {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly lessonSlugs: readonly string[];
}

export interface McpConcept {
  readonly id: string;
  readonly label: string;
  readonly status: "core" | "optional" | "practice" | "extension" | "deprecated" | "removed";
}

export interface McpExtensionRecord {
  readonly id: string;
  readonly name: string;
  readonly maturity: "stable" | "draft";
  readonly specificationVersion: string;
  readonly specificationUrl: string;
  readonly revision: string;
  readonly observedOn: McpEvidenceDate;
  readonly negotiation: string;
  readonly fallback: string;
}

export interface McpClaimRecord {
  readonly id: string;
  readonly lessonOrder: number;
  readonly lessonSlug: string;
  readonly claim: string;
  readonly sourceIds: readonly string[];
}

export interface McpCopyMetadata {
  readonly locale: McpLocale;
  readonly sourceLocale: "en";
  readonly generatedOn: McpEvidenceDate;
  readonly translationMethod:
    | "authored-source"
    | "machine-translated";
  readonly reviewStatus:
    | "source-authored"
    | "automated-structure-and-terminology-reviewed";
}

export interface McpLocalizedSection {
  readonly heading: string;
  readonly body: readonly string[];
  readonly bullets?: readonly string[];
  readonly codeLabel?: string;
  readonly callout?: {
    readonly title: string;
    readonly body: string;
  };
}

export interface McpLocalizedLessonCopy {
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly McpLocalizedSection[];
  readonly practice: {
    readonly title: string;
    readonly brief: string;
    readonly steps: readonly string[];
    readonly evidence: readonly string[];
    readonly safety: string;
  };
  readonly check: {
    readonly question: string;
    readonly options: readonly [string, string, string, string];
    readonly explanation: string;
  };
  readonly takeaway: string;
}

export interface McpLocalizedAssessmentCopy {
  readonly outcome: string;
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly explanation: string;
}

export interface McpLocalizedFigureCopy {
  readonly alt: string;
  readonly caption: string;
  readonly teachingPoint: string;
  readonly legacyNote?: string;
}

export interface McpLocalizedExtensionCopy {
  readonly negotiation: string;
  readonly fallback: string;
}

export interface McpArchitectureCardCopy {
  readonly label: string;
  readonly owns: string;
  readonly mustNot: string;
}

export interface McpRiskCaseCopy {
  readonly title: string;
  readonly answer: string;
}

export interface McpCapstoneCopy {
  readonly deliverables: readonly string[];
}

export interface McpInteractiveCopy {
  readonly architectureCards: Readonly<Record<string, McpArchitectureCardCopy>>;
  readonly envelopePurposes: Readonly<Record<string, string>>;
  readonly riskCases: Readonly<Record<string, McpRiskCaseCopy>>;
}

export interface McpCourse {
  readonly locale: McpLocale;
  readonly contentLocale: McpLocale;
  readonly contentDirection: McpDirection;
  readonly copyMetadata: McpCopyMetadata;
  readonly sequence: typeof MCP_COURSE_SEQUENCE;
  readonly version: typeof MCP_COURSE_VERSION;
  readonly protocolVersion: typeof MCP_PROTOCOL_VERSION;
  readonly publishedOn: McpEvidenceDate;
  readonly title: string;
  readonly shortTitle: string;
  readonly kicker: string;
  readonly summary: string;
  readonly audience: string;
  readonly sourceNote: string;
  readonly localeNote: string;
  readonly units: readonly McpUnit[];
  readonly lessons: readonly McpLesson[];
  readonly concepts: readonly McpConcept[];
  readonly sources: readonly McpSource[];
  readonly figures: readonly McpFigure[];
  readonly assessment: readonly McpAssessmentQuestion[];
  readonly claims: readonly McpClaimRecord[];
  readonly extensions: readonly McpExtensionRecord[];
  readonly ui: Readonly<Record<string, string>>;
  readonly capstone: McpCapstoneCopy;
  readonly interactive: McpInteractiveCopy;
}
