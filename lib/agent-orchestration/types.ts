export const AGENT_ORCHESTRATION_COURSE_ID = "agent-orchestration" as const;
export const AGENT_ORCHESTRATION_DEFAULT_CONTENT_LOCALE = "en" as const;

export const AGENT_ORCHESTRATION_LOCALES = [
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

export const AGENT_ORCHESTRATION_PHASE_IDS = [
  "frame",
  "compose",
  "control",
  "operate",
] as const;

export const AGENT_ORCHESTRATION_MODULE_SLUGS = [
  "workflow-agent-boundary",
  "task-graphs-contracts",
  "chaining-routing",
  "parallel-fanout-fanin",
  "manager-roles-ownership",
  "delegation-handoffs",
  "orchestrator-workers-verification",
  "tools-aci-mcp",
  "context-state-memory",
  "budgets-concurrency-stopping",
  "reliability-recovery",
  "security-authority-human-control",
  "tracing-observability-economics",
  "evaluation-regression-evolution",
  "production-orchestration-capstone",
] as const;

export const AGENT_ORCHESTRATION_CONCEPT_DOMAIN_IDS = [
  "boundaries-autonomy",
  "task-graphs-contracts",
  "deterministic-workflows",
  "parallelism-aggregation",
  "roles-control-ownership",
  "delegation-communication",
  "dynamic-orchestration",
  "tools-protocols",
  "context-state-memory",
  "scheduling-budgets",
  "reliability-durability",
  "security-governance",
  "observability-economics",
  "evaluation-evolution",
  "production-operations",
] as const;

export const AGENT_ORCHESTRATION_PATTERN_IDS = [
  "single-agent-loop",
  "prompt-chain",
  "router",
  "parallel-fanout",
  "manager-tools",
  "handoff",
  "orchestrator-workers",
  "evaluator-optimizer",
  "group-or-hierarchical",
] as const;

export const AGENT_ORCHESTRATION_LAB_IDS = [
  "pattern-selector",
  "graph-contract",
  "handoff-contract",
  "context-recovery",
  "governance-trace",
  "production-readiness",
] as const;

export type AgentOrchestrationLocale =
  (typeof AGENT_ORCHESTRATION_LOCALES)[number];
export type AgentOrchestrationPhaseId =
  (typeof AGENT_ORCHESTRATION_PHASE_IDS)[number];
export type AgentOrchestrationModuleSlug =
  (typeof AGENT_ORCHESTRATION_MODULE_SLUGS)[number];
export type AgentOrchestrationConceptDomainId =
  (typeof AGENT_ORCHESTRATION_CONCEPT_DOMAIN_IDS)[number];
export type AgentOrchestrationPatternId =
  (typeof AGENT_ORCHESTRATION_PATTERN_IDS)[number];
export type AgentOrchestrationLabId =
  (typeof AGENT_ORCHESTRATION_LAB_IDS)[number];

export type AgentOrchestrationSourceKind =
  | "openai-official"
  | "anthropic-official"
  | "claude-academy"
  | "open-standard"
  | "official-sdk-docs"
  | "engineering-official"
  | "official-github"
  | "community-github-case";

export type AgentOrchestrationSourceStability =
  | "stable-concept"
  | "current-documentation"
  | "version-pinned"
  | "beta"
  | "historical";

export type AgentOrchestrationSourceLayer =
  | "normative-standard"
  | "product-documentation"
  | "sdk-or-framework"
  | "engineering-guidance"
  | "repository-evidence"
  | "bounded-case-study";

export type AgentOrchestrationSourceReuseStatus =
  | "link-and-paraphrase-only"
  | "license-noted-no-copy";

export interface AgentOrchestrationSourceRecord {
  readonly id: string;
  readonly title: string;
  readonly publisher: string;
  /** Primary URL that directly supports `supports`; never merely a tag/version locator. */
  readonly url: string;
  /** Complete set of primary URLs used to support `supports`, including `url`. */
  readonly claimEvidenceUrls: readonly [string, ...string[]];
  /** Optional release/tag URL used only to identify a version; it is not claim evidence unless also listed above. */
  readonly versionAnchorUrl?: string;
  readonly accessedOn: string;
  readonly kind: AgentOrchestrationSourceKind;
  readonly stability: AgentOrchestrationSourceStability;
  /** Evidence layer: a protocol, product surface, implementation, engineering guide, case, or private analysis. */
  readonly layer: AgentOrchestrationSourceLayer;
  /** Public-course reuse decision; never inferred as a license grant. */
  readonly reuseStatus: AgentOrchestrationSourceReuseStatus;
  /** How the course transformed the source without copying its expression. */
  readonly transformation: string;
  readonly publishedOn?: string;
  readonly revision?: string;
  readonly license?: string;
  /** The exact course claim or design decision this source can support. */
  readonly supports: string;
  /** Simplified-Chinese rendering of `supports`; official names remain untranslated. */
  readonly supportsZhHans: string;
  /** What the source does not establish, including product and version limits. */
  readonly boundary: string;
  /** Simplified-Chinese rendering of `boundary`; official names remain untranslated. */
  readonly boundaryZhHans: string;
}

export interface AgentOrchestrationPhaseManifest {
  readonly id: AgentOrchestrationPhaseId;
  readonly order: number;
  readonly moduleSlugs: readonly AgentOrchestrationModuleSlug[];
}

export interface AgentOrchestrationModuleManifest {
  readonly slug: AgentOrchestrationModuleSlug;
  readonly order: number;
  readonly phaseId: AgentOrchestrationPhaseId;
  readonly minutes: number;
  readonly sourceIds: readonly [string, ...string[]];
  readonly conceptDomainIds: readonly [
    AgentOrchestrationConceptDomainId,
    ...AgentOrchestrationConceptDomainId[],
  ];
  readonly patternIds: readonly AgentOrchestrationPatternId[];
  readonly labId: AgentOrchestrationLabId;
}

export interface AgentOrchestrationCourseManifest {
  readonly id: typeof AGENT_ORCHESTRATION_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 15;
  readonly publishedOn: string;
  readonly defaultContentLocale: typeof AGENT_ORCHESTRATION_DEFAULT_CONTENT_LOCALE;
  readonly phases: readonly AgentOrchestrationPhaseManifest[];
  readonly modules: readonly AgentOrchestrationModuleManifest[];
}

export type AgentOrchestrationEvidenceMode =
  | "source-grounded"
  | "engineering-synthesis"
  | "version-watch";

export interface AgentOrchestrationSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
  readonly sourceIds: readonly [string, ...string[]];
  readonly evidenceMode: AgentOrchestrationEvidenceMode;
}

export interface AgentOrchestrationContractCopy {
  readonly topology: string;
  readonly trigger: string;
  readonly completion: string;
  readonly controlOwner: string;
  readonly stateOwner: string;
  readonly contextBoundary: string;
  readonly toolAuthority: string;
  readonly delegationPayload: string;
  readonly concurrencyPolicy: string;
  readonly failurePolicy: string;
  readonly evidence: string;
  readonly escalation: string;
}

export interface AgentOrchestrationPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly artifact: string;
  readonly reviewGate: string;
  readonly template: string;
}

export interface AgentOrchestrationCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface AgentOrchestrationLabCopy {
  readonly title: string;
  readonly instruction: string;
  readonly evidencePrompt: string;
}

export interface AgentOrchestrationModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly concepts: readonly [string, ...string[]];
  readonly sections: readonly [
    AgentOrchestrationSectionCopy,
    AgentOrchestrationSectionCopy,
    AgentOrchestrationSectionCopy,
  ];
  readonly contract: AgentOrchestrationContractCopy;
  readonly practice: AgentOrchestrationPracticeCopy;
  readonly checkpoint: AgentOrchestrationCheckpointCopy;
  readonly lab: AgentOrchestrationLabCopy;
  readonly takeaway: string;
}

export interface AgentOrchestrationConceptDomainCopy {
  readonly title: string;
  readonly summary: string;
  readonly concepts: readonly [string, ...string[]];
}

export interface AgentOrchestrationPatternCopy {
  readonly title: string;
  readonly control: string;
  readonly bestWhen: string;
  readonly failureSignal: string;
}

export interface AgentOrchestrationCourseCopy {
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
    readonly translationNote: string;
    readonly evidenceNote: string;
  };
  readonly ui: Readonly<Record<string, string>>;
  readonly principles: readonly [string, string, string, string, string];
  readonly outcomes: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  readonly distinctions: readonly [
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
  ];
  readonly phases: Readonly<Record<AgentOrchestrationPhaseId, {
    readonly title: string;
    readonly summary: string;
    readonly verb: string;
  }>>;
  readonly conceptDomains: Readonly<Record<
    AgentOrchestrationConceptDomainId,
    AgentOrchestrationConceptDomainCopy
  >>;
  readonly patterns: Readonly<Record<
    AgentOrchestrationPatternId,
    AgentOrchestrationPatternCopy
  >>;
  readonly modules: Readonly<Record<
    AgentOrchestrationModuleSlug,
    AgentOrchestrationModuleCopy
  >>;
  readonly finalAssessment: {
    readonly title: string;
    readonly summary: string;
    readonly passPercent: number;
  };
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly artifacts: readonly [string, ...string[]];
    readonly completionStatement: string;
    readonly reviewQuestions: readonly [string, ...string[]];
  };
}

export interface MaterializedAgentOrchestrationModule
  extends AgentOrchestrationModuleManifest {
  readonly copy: AgentOrchestrationModuleCopy;
  readonly sources: readonly AgentOrchestrationSourceRecord[];
}

export interface MaterializedAgentOrchestrationPhase
  extends AgentOrchestrationPhaseManifest {
  readonly copy: AgentOrchestrationCourseCopy["phases"][AgentOrchestrationPhaseId];
  readonly modules: readonly MaterializedAgentOrchestrationModule[];
}

export interface MaterializedAgentOrchestrationCourse {
  readonly locale: AgentOrchestrationLocale;
  readonly contentLocale: AgentOrchestrationLocale;
  readonly contentDirection: "ltr" | "rtl";
  readonly manifest: AgentOrchestrationCourseManifest;
  readonly copy: AgentOrchestrationCourseCopy;
  readonly modules: readonly MaterializedAgentOrchestrationModule[];
  readonly phases: readonly MaterializedAgentOrchestrationPhase[];
}
