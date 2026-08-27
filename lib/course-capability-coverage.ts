/**
 * Auditable retirement contract for the three former catalogue placeholders.
 *
 * A placeholder may stay removed only while every required capability remains
 * attached to a real module, an applied exercise, a summative check, and a
 * capstone/release artifact. The release checker validates these references
 * against the live manifests and assessment banks.
 */
export const RETIRED_MODULE_COVERAGE = [
  {
    legacyId: "tools",
    legacyTitle: "Tool Design",
    requiredCapabilities: [
      "schema",
      "tool-description",
      "input-validation",
      "permission",
      "error-model",
      "idempotency",
      "adversarial-tool-result",
    ],
    modules: [
      { courseId: "mcp", slugs: ["tools", "security", "host-integrations"] },
      { courseId: "agent-orchestration", slugs: ["tools-aci-mcp"] },
    ],
    assessmentIds: [
      "tool-name-collision",
      "scope-step-up",
      "hostile-tool-result",
    ],
    capstoneRefs: [
      "mcp:apps-tasks-capstone",
      "agent-orchestration:production-orchestration-capstone",
    ],
    appliedEvidence: [
      "MCP tool contract practice: input/output schema, five boundary cases, approval and rollback rule",
      "Agent Orchestration tool envelope lab and production orchestration capstone",
    ],
  },
  {
    legacyId: "cost",
    legacyTitle: "Cost Engineering",
    requiredCapabilities: [
      "token-and-unit-economics",
      "latency",
      "concurrency",
      "cache",
      "budget",
      "quality-cost-tradeoff",
      "cost-regression-gate",
    ],
    modules: [
      {
        courseId: "agent-orchestration",
        slugs: [
          "budgets-concurrency-stopping",
          "tracing-observability-economics",
          "evaluation-regression-evolution",
        ],
      },
      { courseId: "production-ai", slugs: ["monitoring-performance-cost"] },
    ],
    assessmentIds: [
      "agent-orchestration:budgets-concurrency-stopping:checkpoint",
      "agent-orchestration:tracing-observability-economics:checkpoint",
      "q-monitoring-performance-cost-boundary",
    ],
    capstoneRefs: [
      "agent-orchestration:production-orchestration-capstone",
      "production-ai:monitoring-dashboard",
    ],
    appliedEvidence: [
      "Agent Orchestration budget envelope, outcome-cost trace, and regression gate",
      "Production AI monitoring dashboard with unit-success cost and alert threshold",
    ],
  },
  {
    legacyId: "hitl",
    legacyTitle: "Human in the Loop",
    requiredCapabilities: [
      "approval-before-effect",
      "override",
      "stop-condition",
      "escalation",
      "appeal",
      "accountability",
    ],
    modules: [
      {
        courseId: "responsible-ai",
        slugs: [
          "human-authority-oversight-boundaries",
          "escalation-appeal-contestability",
        ],
      },
      {
        courseId: "agent-orchestration",
        slugs: ["security-authority-human-control"],
      },
    ],
    assessmentIds: [
      "q-human-authority-oversight-boundaries-core",
      "q-escalation-appeal-contestability-boundary",
    ],
    capstoneRefs: [
      "responsible-ai:override-appeal-flow",
      "agent-orchestration:production-orchestration-capstone",
    ],
    appliedEvidence: [
      "Responsible AI authority, override, appeal, and remedy flow",
      "Agent Orchestration governance trace with approval, escalation, kill switch, and accountable owner",
    ],
  },
] as const;

export type RetiredModuleCoverage = (typeof RETIRED_MODULE_COVERAGE)[number];
