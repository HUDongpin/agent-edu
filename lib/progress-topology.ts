/**
 * Browser-safe progress topology.
 *
 * This module intentionally contains only stable route order, storage schema
 * identifiers, and assessment metadata needed to summarize local progress.
 * Course copy, source ledgers, figures, exercises, and question banks must not
 * be imported here: Home, Catalog, and My Learning all consume this graph.
 */

export const CODEX_PROGRESS_LESSON_SLUGS = [
  "meet-codex",
  "task-contracts",
  "environments-permissions",
  "ground-plan",
  "implement-steer",
  "debug-test",
  "review-diff",
  "agents-skills",
  "cli",
  "ide",
  "cloud-parallel",
  "automation-capstone",
] as const;

export const CODEX_PROGRESS_SCHEMA = {
  prefix: "codex.",
  progressEvent: "codex:progress-change",
  quiz: {
    bankVersion: "1",
    questionCount: 12,
    passingCorrectAnswers: 10,
    bestScoreKey: "codex.quizBest",
    passedKey: "codex.quizPassed",
    versionKey: "codex.quizBankVersion",
  },
  capstoneKey: "codex.capstone.v1",
} as const;

export const CLAUDE_PROGRESS_LESSON_SLUGS = [
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

export const CLAUDE_PROGRESS_SCHEMA = {
  prefix: "claude.",
  progressEvent: "claude:progress-change",
  quiz: {
    bankVersion: "1",
    questionCount: 16,
    passingCorrectAnswers: 13,
    bestScoreKey: "claude.quizBest",
    passedKey: "claude.quizPassed",
    versionKey: "claude.quizBankVersion",
  },
  capstone: {
    progressKey: "claude.capstone.v1",
    criticalClearKey: "claude.capstone.criticalClear",
    artifactIds: [
      "task-brief",
      "input-log",
      "run-log",
      "deliverable",
      "verification-record",
      "disclosure-reflection",
    ],
    rubric: [
      { id: "delegation", weight: 25 },
      { id: "description", weight: 25 },
      { id: "discernment", weight: 30 },
      { id: "diligence", weight: 20 },
    ],
    passingScore: 80,
  },
} as const;

export const CURSOR_PROGRESS_LESSON_SLUGS = [
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

export const CURSOR_PROGRESS_STORAGE_KEY = "aicourse.cursor.progress.v1" as const;
export const CURSOR_PROGRESS_EVENT = "cursor:progress-change" as const;
export const CURSOR_PROGRESS_PREFIX = "cursor." as const;
export const CURSOR_PROGRESS_LOCK_NAME = "aicourse:cursor-progress" as const;

export const CURSOR_PROGRESS_SCHEMA = {
  storageKey: CURSOR_PROGRESS_STORAGE_KEY,
  prefix: CURSOR_PROGRESS_PREFIX,
  progressEvent: CURSOR_PROGRESS_EVENT,
  quiz: {
    bankVersion: "2",
    questionCount: 12,
    passingCorrectAnswers: 10,
    bestScoreKey: "cursor.quizBest",
    passedKey: "cursor.quizPassed",
    versionKey: "cursor.quizBankVersion",
  },
  capstone: {
    progressKey: "cursor.capstone.v1",
    metadataKey: "cursor.capstoneMeta.v1",
    assessmentKey: "cursor.capstoneAssessment.v1",
    metadata: {
      receiptSchema: "aicourse.cursor.capstone.v1",
      receiptVersion: "1",
      fixtureVersion: "1",
      fixtureSha256: "3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b",
      requiredChecks: "tests|lint|build|routesPreserved|keyboardBehavior|noNewDependencies",
    },
    artifactIds: [
      "task-contract",
      "orientation-note",
      "approved-plan",
      "reviewed-diff",
      "verification-record",
      "handoff",
    ],
    rubric: [
      { id: "scope", weight: 20 },
      { id: "safety", weight: 20 },
      { id: "implementation", weight: 20 },
      { id: "verification", weight: 25 },
      { id: "handoff", weight: 15 },
    ],
    requiredRubricIds: ["safety", "verification"],
    passingScore: 80,
  },
} as const;

export function cursorProgressLessonKey(slug: string): string {
  return `cursor.lesson.${slug}`;
}

export const GROK_PROGRESS_LESSON_SLUGS = [
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

export const GITHUB_PROGRESS_LESSON_SLUGS = [
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

export const GITHUB_PROGRESS_QUIZ = {
  bankVersion: "github-quiz-2026-08-23-v2",
  bestStorageKey: "github.quiz.best",
  passedStorageKey: "github.quiz.passed",
  versionStorageKey: "github.quiz.version",
} as const;

export const PROMPT_PROGRESS_LESSON_SLUGS = [
  "prompts-are-specifications",
  "six-part-prompt",
  "instructions-and-data",
  "examples-and-contracts",
  "four-prompt-jobs",
  "evaluation-flywheel",
  "decompose-and-chain",
  "grounding-and-safety",
  "capstone-prompt-packet",
] as const;

export const SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS = [
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

export const SOFTWARE_ENGINEERING_PROGRESS_QUIZ = {
  bankVersion: "2",
  questionCount: 15,
  passingCorrectAnswers: 12,
  bestScoreStorageKey: "softwareEngineering.quizBest",
  passedStorageKey: "softwareEngineering.quizPassed",
  versionStorageKey: "softwareEngineering.quizVersion",
} as const;

export const SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE = {
  schemaVersion: "1.0.0",
  artifactIds: [
    "requirements-risk-contract",
    "architecture-decision-package",
    "repository-run-manifest",
    "reviewable-implementation-history",
    "independent-verification-package",
    "security-privacy-supply-chain-review",
    "release-operations-package",
    "human-review-evaluation-decision",
  ],
  releaseGateIds: [
    "scope-and-acceptance",
    "independent-quality",
    "security-and-rights",
    "operational-readiness",
    "accountable-decision",
  ],
  passingScore: 80,
  totalPoints: 100,
  releaseDecisions: [
    "release",
    "release-with-conditions",
    "do-not-release",
  ],
} as const;

export const RAG_PROGRESS_LESSON_SLUGS = [
  "choose-rag",
  "trace-the-pipeline",
  "corpus-contract",
  "parse-and-chunk",
  "embeddings-and-indexes",
  "retrieval-engineering",
  "rerank-and-assemble",
  "ground-and-cite",
  "advanced-patterns",
  "evaluate-rag",
  "secure-and-refresh",
  "production-capstone",
] as const;

export const MCP_PROGRESS_LESSON_SLUGS = [
  "why-mcp",
  "architecture-trust",
  "discovery-versioning",
  "inspect-the-wire",
  "tools",
  "resources",
  "prompts-completion",
  "elicitation-mrtr",
  "transports-json-rpc",
  "flow-control",
  "authorization",
  "security",
  "build-server",
  "build-client",
  "host-integrations",
  "practitioner-patterns",
  "production-registry",
  "apps-tasks-capstone",
] as const;

export const MCP_PROGRESS_ASSESSMENT_VERSION = "2026-07-28-v2" as const;

export interface VersionedProgressQuizContract {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly passingCorrectAnswers: number;
  readonly bestScoreKey: string;
  readonly passedKey: string;
  readonly versionKey: string;
  readonly draftKey?: string;
}

export const MCP_PROGRESS_QUIZ = {
  bankVersion: MCP_PROGRESS_ASSESSMENT_VERSION,
  questionCount: 18,
  passingCorrectAnswers: 15,
  bestScoreKey: "mcp.quiz.best",
  passedKey: "mcp.quiz.passed",
  versionKey: "mcp.quiz.version",
  draftKey: "mcp.quiz.draft",
} as const satisfies VersionedProgressQuizContract;

export function readVersionedQuizProgress(
  record: Readonly<Record<string, unknown>>,
  quiz: VersionedProgressQuizContract,
): { readonly best: number; readonly passed: boolean } {
  const currentVersion = record[quiz.versionKey] === quiz.bankVersion;
  const rawBest = record[quiz.bestScoreKey];
  const best = currentVersion
    && typeof rawBest === "number"
    && Number.isInteger(rawBest)
    && rawBest >= 0
    && rawBest <= quiz.questionCount
    ? rawBest
    : 0;
  return {
    best,
    passed: currentVersion
      && record[quiz.passedKey] === true
      && best >= quiz.passingCorrectAnswers,
  };
}

export const MAKE_MONEY_PROGRESS_LESSON_SLUGS = [
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

export type MakeMoneyProgressLessonSlug =
  (typeof MAKE_MONEY_PROGRESS_LESSON_SLUGS)[number];

export const MAKE_MONEY_PROGRESS_SCHEMA = {
  courseVersion: "1.0.0",
  courseVersionKey: "make-money-with-codex.course.version",
  quizVersion: "2026-08-24.1",
  quizQuestionCount: 12,
  capstoneItemCount: 13,
} as const;

export const CLAUDE_INCOME_PROGRESS_LESSON_SLUGS = [
  "choose-a-money-path",
  "validate-paid-demand",
  "scope-and-price-the-offer",
  "write-a-delivery-spec",
  "run-client-projects",
  "sell-citation-grade-research",
  "deliver-files-that-survive-review",
  "standardize-with-skills-and-connectors",
  "prototype-with-artifacts",
  "build-software-with-claude",
  "earn-trust-and-retainers",
  "capstone-seven-day-demand-test",
] as const;

export const CLAUDE_INCOME_PROGRESS_QUIZ = {
  bankVersion: "2026-08-23.v1",
  passedStorageKey: "claude-income.quiz.passed",
  versionStorageKey: "claude-income.quiz.version",
} as const;

export const CLAUDE_INCOME_PROGRESS_CAPSTONE_KEY =
  "claude-income.capstone.v1" as const;

export const AI_TUTOR_PROGRESS_MODULE_SLUGS = [
  "objectives-concept-map",
  "diagnostic-engine",
  "adaptive-scaffolding",
  "formative-assessment-loop",
  "item-validation",
  "learner-modeling",
  "learning-impact-experiment",
  "safety-teacher-oversight",
] as const;

export type AiTutorProgressModuleSlug =
  (typeof AI_TUTOR_PROGRESS_MODULE_SLUGS)[number];

export const AI_TUTOR_PROGRESS_SCHEMA = {
  prefix: "ai-tutor.",
  version: "1.0.0",
  versionKey: "ai-tutor.progress.version",
  progressEvent: "ai-tutor:progress-change",
  resetEvent: "ai-tutor:progress-reset",
  quizPassedKey: "ai-tutor.quiz.passed",
  capstoneKey: "ai-tutor.capstone.v1",
} as const;

export const PRODUCT_MANAGEMENT_PROGRESS_MODULE_SLUGS = [
  "product-judgment-operating-model",
  "vision-strategy-business-model",
  "customer-market-discovery",
  "synthesis-opportunity-definition",
  "outcomes-metrics-analytics",
  "prioritization-roadmaps-portfolio",
  "solution-discovery-experiments",
  "product-design-experience-systems",
  "requirements-prd-decisions",
  "ai-capability-architecture",
  "delivery-engineering-ai-agents",
  "quality-safety-governance",
  "launch-go-to-market-growth",
  "experimentation-operations-leadership",
] as const;

export type ProductManagementProgressModuleSlug =
  (typeof PRODUCT_MANAGEMENT_PROGRESS_MODULE_SLUGS)[number];

export const PRODUCT_MANAGEMENT_PROGRESS_SCHEMA = {
  prefix: "product-management.",
  version: "1.0.0",
  versionKey: "product-management.progress.version",
  progressEvent: "product-management:progress-change",
  resetEvent: "product-management:progress-reset",
  quizPassedKey: "product-management.quiz.passed",
  capstoneKey: "product-management.capstone.v1",
} as const;

export const AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS = [
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

export type AgentOrchestrationProgressModuleSlug =
  (typeof AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS)[number];

export const AGENT_ORCHESTRATION_PROGRESS_EVENT =
  "agent-orchestration:progress-change" as const;
export const AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT =
  "agent-orchestration:progress-reset" as const;

export const AGENT_ORCHESTRATION_PROGRESS_SCHEMA = {
  prefix: "agent-orchestration.",
  version: "1.1.1:progress-v4",
  versionKey: "agent-orchestration.progress.version",
  progressEvent: AGENT_ORCHESTRATION_PROGRESS_EVENT,
  resetEvent: AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT,
  quizBestKey: "agent-orchestration.quiz.best",
  quizPassedKey: "agent-orchestration.quiz.passed",
  quizPassPercent: 80,
  capstoneEvidenceKey: "agent-orchestration.capstone.checks",
  capstoneArtifactCount: 15,
} as const;

export function aiTutorProgressModuleKey(slug: string): string {
  return `ai-tutor.module.${slug}.complete`;
}

export function productManagementProgressModuleKey(slug: string): string {
  return `product-management.module.${slug}.complete`;
}

export function agentOrchestrationProgressModuleKey(slug: string): string {
  return `agent-orchestration.module.${slug}.complete`;
}

export function normalizeVersionedProgressRecord(
  progress: Record<string, unknown>,
  schema: { readonly prefix: string; readonly version: string; readonly versionKey: string },
): Record<string, unknown> {
  if (progress[schema.versionKey] === schema.version) return { ...progress };
  const normalized = { ...progress };
  for (const key of Object.keys(normalized)) {
    if (key.startsWith(schema.prefix)) delete normalized[key];
  }
  normalized[schema.versionKey] = schema.version;
  return normalized;
}
