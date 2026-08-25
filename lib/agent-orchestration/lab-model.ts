import type {
  AgentOrchestrationLabId,
  AgentOrchestrationModuleSlug,
} from "./types";

export const AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION = 2 as const;
export const AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION =
  "course15-labs-2026-08-23.2" as const;

export type AgentOrchestrationLabRuntime =
  | "application"
  | "responses"
  | "codex"
  | "claude";

export type AgentOrchestrationFailurePoint =
  | "before"
  | "ambiguous"
  | "after";

export type AgentOrchestrationJoinPolicy =
  | "all"
  | "quorum"
  | "first-valid"
  | "best-effort";

export type AgentOrchestrationRouteInput =
  | "known"
  | "ambiguous"
  | "refused";

export type AgentOrchestrationLostStateLayer =
  | "context"
  | "conversation"
  | "session"
  | "run-state";

export type AgentOrchestrationCapacityState =
  | "normal"
  | "reduced"
  | "slow-tail";

export type AgentOrchestrationEvidenceQuestion =
  | "execution-path"
  | "service-health"
  | "accountability"
  | "outcome-quality";

export type AgentOrchestrationEvidenceSystem =
  | "trace"
  | "monitor"
  | "audit"
  | "evaluation";

/**
 * A single normalized state envelope keeps browser persistence stable while
 * every module activates only its own named, finite controls. Do not infer a
 * module's controls from its reusable `labId`; use
 * `AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS`.
 */
export interface AgentOrchestrationLabState {
  // M1 — workflow/agent boundary.
  autonomy: number;
  dependencies: number;
  sharedWrites: boolean;

  // M2 — graph invariants.
  lateWorker: boolean;
  invalidReturn: boolean;
  partialJoin: boolean;

  // M3 — chain/router behavior.
  routeInput: AgentOrchestrationRouteInput;
  structuredRoute: boolean;
  unknownRoute: boolean;
  highRiskHumanGate: boolean;

  // M4 — fan-out/join behavior.
  joinPolicy: AgentOrchestrationJoinPolicy;
  slowBranch: boolean;
  invalidBranch: boolean;
  duplicateBranch: boolean;

  // M5 — manager ownership.
  finalAnswerOwner: boolean;
  stateOwner: boolean;
  externalActionOwner: boolean;

  // M6 — delegation/handoff continuity.
  transferControl: boolean;
  operationKey: boolean;
  ledgerChecked: boolean;

  // M7 — orchestrator/worker verification.
  workerTree: boolean;
  artifactMerge: boolean;
  independentVerifier: boolean;
  sharedBlindSpot: boolean;

  // M8 — tools, ACI, and MCP authority boundary.
  toolSchemaValid: boolean;
  sideEffectDeclared: boolean;
  actionAuthorized: boolean;
  mcpBoundaryExplicit: boolean;
  poisonedEvidence: boolean;
  untrustedResultIsolated: boolean;

  // M9 — context/state recovery layers.
  lostStateLayer: AgentOrchestrationLostStateLayer;
  durableCheckpoint: boolean;
  sessionEventLog: boolean;
  auditLink: boolean;

  // M10 — budgets, scheduling, and stopping.
  capacityState: AgentOrchestrationCapacityState;
  admissionLimit: boolean;
  queueBounded: boolean;
  queueAtCapacity: boolean;
  budgetVector: boolean;
  deadlineCancellation: boolean;
  stopRule: boolean;

  // M11 — ambiguous effects and recovery.
  failure: AgentOrchestrationFailurePoint;

  // M12 — security and human authority.
  allowlist: boolean;
  approval: boolean;
  egressBlocked: boolean;

  // M13 — evidence systems and economics.
  evidenceQuestion: AgentOrchestrationEvidenceQuestion;
  selectedEvidenceSystem: AgentOrchestrationEvidenceSystem;
  telemetryRedacted: boolean;
  outcomeCostLinked: boolean;

  // M14 — evaluation and regression governance.
  isolatedTrials: boolean;
  repeatedTrials: boolean;
  deterministicGrader: boolean;
  calibratedReview: boolean;
  versionLocked: boolean;
  regressionThreshold: boolean;
  candidateRegression: boolean;

  // M15 — staged production release.
  shadow: boolean;
  canary: boolean;
  killSwitch: boolean;

  /** Retained for persisted-v1 compatibility; it is not an active v2 control. */
  runtime: AgentOrchestrationLabRuntime;
}

/**
 * Defaults are fail-closed or bounded simulation cases. Several deliberately
 * expose one missing control so the learner has something real to diagnose.
 * Even where the default decision is valid, the engagement gate below makes
 * an untouched initial state ineligible for completion.
 */
export const AGENT_ORCHESTRATION_INITIAL_LAB_STATE:
Readonly<AgentOrchestrationLabState> = Object.freeze({
  autonomy: 2,
  dependencies: 2,
  sharedWrites: false,
  lateWorker: false,
  invalidReturn: true,
  partialJoin: false,
  routeInput: "ambiguous",
  structuredRoute: true,
  unknownRoute: false,
  highRiskHumanGate: true,
  joinPolicy: "all",
  slowBranch: true,
  invalidBranch: false,
  duplicateBranch: false,
  finalAnswerOwner: false,
  stateOwner: true,
  externalActionOwner: true,
  transferControl: false,
  operationKey: false,
  ledgerChecked: false,
  workerTree: true,
  artifactMerge: true,
  independentVerifier: false,
  sharedBlindSpot: false,
  toolSchemaValid: false,
  sideEffectDeclared: true,
  actionAuthorized: false,
  mcpBoundaryExplicit: true,
  poisonedEvidence: true,
  untrustedResultIsolated: true,
  lostStateLayer: "context",
  durableCheckpoint: false,
  sessionEventLog: true,
  auditLink: true,
  capacityState: "reduced",
  admissionLimit: true,
  queueBounded: true,
  queueAtCapacity: false,
  budgetVector: false,
  deadlineCancellation: true,
  stopRule: true,
  failure: "ambiguous",
  allowlist: true,
  approval: false,
  egressBlocked: true,
  evidenceQuestion: "execution-path",
  selectedEvidenceSystem: "monitor",
  telemetryRedacted: true,
  outcomeCostLinked: false,
  isolatedTrials: true,
  repeatedTrials: false,
  deterministicGrader: true,
  calibratedReview: false,
  versionLocked: true,
  regressionThreshold: true,
  candidateRegression: true,
  shadow: true,
  canary: false,
  killSwitch: true,
  runtime: "application",
});

export type AgentOrchestrationLabStateKey = keyof AgentOrchestrationLabState;

export const AGENT_ORCHESTRATION_LAB_ID_BY_MODULE = {
  "workflow-agent-boundary": "pattern-selector",
  "task-graphs-contracts": "graph-contract",
  "chaining-routing": "pattern-selector",
  "parallel-fanout-fanin": "graph-contract",
  "manager-roles-ownership": "handoff-contract",
  "delegation-handoffs": "handoff-contract",
  "orchestrator-workers-verification": "graph-contract",
  "tools-aci-mcp": "handoff-contract",
  "context-state-memory": "context-recovery",
  "budgets-concurrency-stopping": "context-recovery",
  "reliability-recovery": "context-recovery",
  "security-authority-human-control": "governance-trace",
  "tracing-observability-economics": "governance-trace",
  "evaluation-regression-evolution": "governance-trace",
  "production-orchestration-capstone": "production-readiness",
} as const satisfies Readonly<
  Record<AgentOrchestrationModuleSlug, AgentOrchestrationLabId>
>;

export const AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS = {
  "workflow-agent-boundary": ["autonomy", "dependencies", "sharedWrites"],
  "task-graphs-contracts": ["lateWorker", "invalidReturn", "partialJoin"],
  "chaining-routing": [
    "routeInput",
    "structuredRoute",
    "unknownRoute",
    "highRiskHumanGate",
  ],
  "parallel-fanout-fanin": [
    "joinPolicy",
    "slowBranch",
    "invalidBranch",
    "duplicateBranch",
  ],
  "manager-roles-ownership": [
    "finalAnswerOwner",
    "stateOwner",
    "externalActionOwner",
  ],
  "delegation-handoffs": [
    "transferControl",
    "operationKey",
    "ledgerChecked",
  ],
  "orchestrator-workers-verification": [
    "workerTree",
    "artifactMerge",
    "independentVerifier",
    "sharedBlindSpot",
  ],
  "tools-aci-mcp": [
    "toolSchemaValid",
    "sideEffectDeclared",
    "actionAuthorized",
    "mcpBoundaryExplicit",
    "poisonedEvidence",
    "untrustedResultIsolated",
  ],
  "context-state-memory": [
    "lostStateLayer",
    "durableCheckpoint",
    "sessionEventLog",
    "auditLink",
  ],
  "budgets-concurrency-stopping": [
    "capacityState",
    "admissionLimit",
    "queueBounded",
    "queueAtCapacity",
    "budgetVector",
    "deadlineCancellation",
    "stopRule",
  ],
  "reliability-recovery": ["failure", "operationKey", "ledgerChecked"],
  "security-authority-human-control": [
    "poisonedEvidence",
    "allowlist",
    "egressBlocked",
    "approval",
  ],
  "tracing-observability-economics": [
    "evidenceQuestion",
    "selectedEvidenceSystem",
    "telemetryRedacted",
    "outcomeCostLinked",
  ],
  "evaluation-regression-evolution": [
    "isolatedTrials",
    "repeatedTrials",
    "deterministicGrader",
    "calibratedReview",
    "versionLocked",
    "regressionThreshold",
    "candidateRegression",
  ],
  "production-orchestration-capstone": ["shadow", "canary", "killSwitch"],
} as const satisfies Readonly<
  Record<
    AgentOrchestrationModuleSlug,
    readonly AgentOrchestrationLabStateKey[]
  >
>;

export type AgentOrchestrationLabStatus =
  | "VALID"
  | "BLOCK"
  | "JOIN"
  | "PARTIAL"
  | "HOLD"
  | "VERIFY"
  | "STOP"
  | "CODE"
  | "ONE"
  | "FAN"
  | "LOCK"
  | "HANDOFF"
  | "TOOL"
  | "SAFE"
  | "DENY"
  | "EXPOSED"
  | "GATED"
  | "ROUTE"
  | "UNKNOWN"
  | "HUMAN"
  | "OWN"
  | "ADMIT"
  | "QUEUE"
  | "REJECT"
  | "DEGRADE"
  | "OBSERVE";

export type AgentOrchestrationLabOutcome =
  | "graph-valid"
  | "graph-blocked"
  | "join-ready"
  | "join-partial"
  | "join-hold"
  | "verification-ready"
  | "verification-blocked"
  | "deterministic-workflow"
  | "single-agent"
  | "bounded-fanout"
  // Retained as v1 outcome types for persisted-record compatibility.
  | "graph-lock"
  | "graph-join"
  | "handoff-contract-blocked"
  | "handoff"
  | "manager-tool"
  | "recovery-classified"
  | "recovery-reconciled"
  | "recovery-blocked"
  | "governance-defended"
  | "governance-exposed"
  | "release-gated"
  | "release-hold"
  // Module-specific v2 outcomes.
  | "route-contract-blocked"
  | "route-deterministic"
  | "route-unknown"
  | "route-human-gated"
  | "route-forced"
  | "ownership-explicit"
  | "ownership-ambiguous"
  | "tool-contract-blocked"
  | "tool-result-exposed"
  | "tool-capability-denied"
  | "tool-action-authorized"
  | "state-recovery-blocked"
  | "context-recovered"
  | "conversation-recovered"
  | "session-recovered"
  | "run-state-recovered"
  | "budget-policy-blocked"
  | "budget-admitted"
  | "budget-queued"
  | "budget-rejected"
  | "budget-degraded"
  | "governance-authorized"
  | "observability-supported"
  | "observability-unsupported"
  | "telemetry-exposed"
  | "economics-unlinked"
  | "evaluation-insufficient"
  | "regression-blocked"
  | "candidate-release-eligible";

export type AgentOrchestrationLabWarning = "duplicate-branch";

export interface AgentOrchestrationLabDecision {
  readonly status: AgentOrchestrationLabStatus;
  readonly outcome: AgentOrchestrationLabOutcome;
  readonly warnings: readonly AgentOrchestrationLabWarning[];
  readonly runtime?: AgentOrchestrationLabRuntime;
  readonly returnEnvelope?: boolean;
  readonly explicitEvidenceEffects?: boolean;
}

const NO_WARNINGS: readonly AgentOrchestrationLabWarning[] = Object.freeze([]);
const DUPLICATE_BRANCH_WARNING: readonly AgentOrchestrationLabWarning[] =
  Object.freeze(["duplicate-branch"]);

function decision(
  status: AgentOrchestrationLabStatus,
  outcome: AgentOrchestrationLabOutcome,
  extra: Omit<AgentOrchestrationLabDecision, "status" | "outcome" | "warnings"> & {
    readonly warnings?: readonly AgentOrchestrationLabWarning[];
  } = {},
): AgentOrchestrationLabDecision {
  return Object.freeze({
    status,
    outcome,
    warnings: extra.warnings ?? NO_WARNINGS,
    ...extra,
  });
}

export function isAgentOrchestrationLabPair(
  slug: unknown,
  labId: unknown,
): boolean {
  return typeof slug === "string"
    && Object.prototype.hasOwnProperty.call(
      AGENT_ORCHESTRATION_LAB_ID_BY_MODULE,
      slug,
    )
    && AGENT_ORCHESTRATION_LAB_ID_BY_MODULE[
      slug as AgentOrchestrationModuleSlug
    ] === labId;
}

/**
 * Pure, finite decision model consumed by the UI, persistence validation, and
 * release truth-table gate. The module slug—not the reusable UI lab shell—is
 * the semantic dispatch key.
 */
export function evaluateAgentOrchestrationLab(
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
  state: Readonly<AgentOrchestrationLabState>,
): AgentOrchestrationLabDecision {
  if (!isAgentOrchestrationLabPair(slug, labId)) {
    throw new RangeError(`Lab ${labId} is not assigned to module ${slug}`);
  }

  switch (slug) {
    case "workflow-agent-boundary":
      if (state.autonomy <= 1) {
        return decision("CODE", "deterministic-workflow");
      }
      if (state.sharedWrites || state.dependencies >= 4) {
        return decision("ONE", "single-agent");
      }
      return decision("FAN", "bounded-fanout");

    case "task-graphs-contracts": {
      const blocked = state.lateWorker || state.invalidReturn || state.partialJoin;
      return blocked
        ? decision("BLOCK", "graph-blocked")
        : decision("VALID", "graph-valid");
    }

    case "chaining-routing":
      if (!state.structuredRoute) {
        return decision("BLOCK", "route-contract-blocked");
      }
      if (state.routeInput === "known") {
        return decision("ROUTE", "route-deterministic");
      }
      if (state.routeInput === "ambiguous") {
        return state.unknownRoute
          ? decision("UNKNOWN", "route-unknown")
          : decision("BLOCK", "route-forced");
      }
      return state.highRiskHumanGate
        ? decision("HUMAN", "route-human-gated")
        : decision("BLOCK", "route-forced");

    case "parallel-fanout-fanin": {
      const warnings = state.duplicateBranch
        ? DUPLICATE_BRANCH_WARNING
        : NO_WARNINGS;
      if (state.joinPolicy === "all") {
        return state.slowBranch || state.invalidBranch
          ? decision("HOLD", "join-hold", { warnings })
          : decision("JOIN", "join-ready", { warnings });
      }
      if (state.joinPolicy === "quorum") {
        return state.slowBranch && state.invalidBranch
          ? decision("HOLD", "join-hold", { warnings })
          : decision("JOIN", "join-ready", { warnings });
      }
      if (state.joinPolicy === "best-effort") {
        return state.slowBranch || state.invalidBranch
          ? decision("PARTIAL", "join-partial", { warnings })
          : decision("JOIN", "join-ready", { warnings });
      }
      return decision("JOIN", "join-ready", { warnings });
    }

    case "manager-roles-ownership": {
      const explicit = state.finalAnswerOwner
        && state.stateOwner
        && state.externalActionOwner;
      return explicit
        ? decision("OWN", "ownership-explicit")
        : decision("BLOCK", "ownership-ambiguous");
    }

    case "delegation-handoffs": {
      const extra = {
        returnEnvelope: state.operationKey,
        explicitEvidenceEffects: state.ledgerChecked,
      } as const;
      if (!(state.operationKey && state.ledgerChecked)) {
        return decision("BLOCK", "handoff-contract-blocked", extra);
      }
      return state.transferControl
        ? decision("HANDOFF", "handoff", extra)
        : decision("TOOL", "manager-tool", extra);
    }

    case "orchestrator-workers-verification": {
      const ready = state.workerTree
        && state.artifactMerge
        && state.independentVerifier
        && !state.sharedBlindSpot;
      return ready
        ? decision("VERIFY", "verification-ready")
        : decision("STOP", "verification-blocked");
    }

    case "tools-aci-mcp":
      if (
        !state.toolSchemaValid
        || !state.sideEffectDeclared
        || !state.mcpBoundaryExplicit
      ) {
        return decision("BLOCK", "tool-contract-blocked");
      }
      if (state.poisonedEvidence && !state.untrustedResultIsolated) {
        return decision("EXPOSED", "tool-result-exposed");
      }
      return state.actionAuthorized
        ? decision("TOOL", "tool-action-authorized")
        : decision("DENY", "tool-capability-denied");

    case "context-state-memory": {
      const needsEventHistory = state.lostStateLayer === "conversation"
        || state.lostStateLayer === "session";
      if (
        !state.durableCheckpoint
        || !state.auditLink
        || (needsEventHistory && !state.sessionEventLog)
      ) {
        return decision("STOP", "state-recovery-blocked");
      }
      const outcomes = {
        context: "context-recovered",
        conversation: "conversation-recovered",
        session: "session-recovered",
        "run-state": "run-state-recovered",
      } as const;
      return decision("SAFE", outcomes[state.lostStateLayer]);
    }

    case "budgets-concurrency-stopping":
      if (
        !state.admissionLimit
        || !state.queueBounded
        || !state.budgetVector
        || !state.deadlineCancellation
        || !state.stopRule
      ) {
        return decision("STOP", "budget-policy-blocked");
      }
      if (state.capacityState === "normal") {
        return decision("ADMIT", "budget-admitted");
      }
      if (state.capacityState === "reduced") {
        return state.queueAtCapacity
          ? decision("REJECT", "budget-rejected")
          : decision("QUEUE", "budget-queued");
      }
      return decision("DEGRADE", "budget-degraded");

    case "reliability-recovery":
      if (state.failure === "before") {
        return decision("SAFE", "recovery-classified");
      }
      if (state.operationKey && state.ledgerChecked) {
        return decision("SAFE", "recovery-reconciled");
      }
      return decision("STOP", "recovery-blocked");

    case "security-authority-human-control": {
      const defended = state.allowlist && state.approval && state.egressBlocked;
      if (!defended) {
        return decision("EXPOSED", "governance-exposed");
      }
      return state.poisonedEvidence
        ? decision("DENY", "governance-defended")
        : decision("GATED", "governance-authorized");
    }

    case "tracing-observability-economics": {
      const expectedSystem: Readonly<
        Record<AgentOrchestrationEvidenceQuestion, AgentOrchestrationEvidenceSystem>
      > = {
        "execution-path": "trace",
        "service-health": "monitor",
        accountability: "audit",
        "outcome-quality": "evaluation",
      };
      if (state.selectedEvidenceSystem !== expectedSystem[state.evidenceQuestion]) {
        return decision("HOLD", "observability-unsupported");
      }
      if (!state.telemetryRedacted) {
        return decision("EXPOSED", "telemetry-exposed");
      }
      if (!state.outcomeCostLinked) {
        return decision("HOLD", "economics-unlinked");
      }
      return decision("OBSERVE", "observability-supported");
    }

    case "evaluation-regression-evolution": {
      const evidenceReady = state.isolatedTrials
        && state.repeatedTrials
        && state.deterministicGrader
        && state.calibratedReview
        && state.versionLocked
        && state.regressionThreshold;
      if (!evidenceReady) {
        return decision("HOLD", "evaluation-insufficient");
      }
      return state.candidateRegression
        ? decision("GATED", "regression-blocked")
        : decision("VALID", "candidate-release-eligible");
    }

    case "production-orchestration-capstone": {
      const ready = state.shadow && state.canary && state.killSwitch;
      return ready
        ? decision("GATED", "release-gated")
        : decision("HOLD", "release-hold");
    }
  }
}

const COMPLETABLE_DECISION_PAIRS = {
  "workflow-agent-boundary": [
    "CODE:deterministic-workflow",
    "ONE:single-agent",
    "FAN:bounded-fanout",
  ],
  "task-graphs-contracts": ["VALID:graph-valid"],
  "chaining-routing": [
    "ROUTE:route-deterministic",
    "UNKNOWN:route-unknown",
    "HUMAN:route-human-gated",
  ],
  "parallel-fanout-fanin": ["JOIN:join-ready", "PARTIAL:join-partial"],
  "manager-roles-ownership": ["OWN:ownership-explicit"],
  "delegation-handoffs": ["HANDOFF:handoff", "TOOL:manager-tool"],
  "orchestrator-workers-verification": ["VERIFY:verification-ready"],
  "tools-aci-mcp": [
    "DENY:tool-capability-denied",
    "TOOL:tool-action-authorized",
  ],
  "context-state-memory": [
    "SAFE:context-recovered",
    "SAFE:conversation-recovered",
    "SAFE:session-recovered",
    "SAFE:run-state-recovered",
  ],
  "budgets-concurrency-stopping": [
    "ADMIT:budget-admitted",
    "QUEUE:budget-queued",
    "REJECT:budget-rejected",
    "DEGRADE:budget-degraded",
  ],
  "reliability-recovery": [
    "SAFE:recovery-classified",
    "SAFE:recovery-reconciled",
  ],
  "security-authority-human-control": [
    "DENY:governance-defended",
    "GATED:governance-authorized",
  ],
  "tracing-observability-economics": [
    "OBSERVE:observability-supported",
  ],
  "evaluation-regression-evolution": [
    "GATED:regression-blocked",
    "VALID:candidate-release-eligible",
  ],
  "production-orchestration-capstone": ["GATED:release-gated"],
} as const satisfies Readonly<
  Record<AgentOrchestrationModuleSlug, readonly string[]>
>;

/** Accept only a module-appropriate status/outcome pair, not an outcome alone. */
export function isAgentOrchestrationLabDecisionCompletable(
  slug: AgentOrchestrationModuleSlug,
  value: unknown,
): value is AgentOrchestrationLabDecision {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<AgentOrchestrationLabDecision>;
  return typeof candidate.status === "string"
    && typeof candidate.outcome === "string"
    && (COMPLETABLE_DECISION_PAIRS[slug] as readonly string[]).includes(
      `${candidate.status}:${candidate.outcome}`,
    );
}

export function agentOrchestrationLabDecisionsEqual(
  left: unknown,
  right: unknown,
): boolean {
  if (
    !left
    || typeof left !== "object"
    || Array.isArray(left)
    || !right
    || typeof right !== "object"
    || Array.isArray(right)
  ) return false;
  const leftDecision = left as Record<string, unknown>;
  const rightDecision = right as Record<string, unknown>;
  const leftWarnings = leftDecision.warnings;
  const rightWarnings = rightDecision.warnings;
  if (
    typeof leftDecision.status !== "string"
    || typeof leftDecision.outcome !== "string"
    || typeof rightDecision.status !== "string"
    || typeof rightDecision.outcome !== "string"
    || !Array.isArray(leftWarnings)
    || !Array.isArray(rightWarnings)
    || !leftWarnings.every((warning) => warning === "duplicate-branch")
    || !rightWarnings.every((warning) => warning === "duplicate-branch")
  ) return false;
  return leftDecision.status === rightDecision.status
    && leftDecision.outcome === rightDecision.outcome
    && leftDecision.runtime === rightDecision.runtime
    && leftDecision.returnEnvelope === rightDecision.returnEnvelope
    && leftDecision.explicitEvidenceEffects === rightDecision.explicitEvidenceEffects
    && leftWarnings.length === rightWarnings.length
    && leftWarnings.every(
      (warning, index) => warning === rightWarnings[index],
    );
}

function finiteScale(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(5, Math.round(value)))
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? value as T
    : fallback;
}

/** Normalize persisted/untrusted browser state before any decision evaluation. */
export function normalizeAgentOrchestrationLabState(
  value: unknown,
): AgentOrchestrationLabState {
  const candidate = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<Record<AgentOrchestrationLabStateKey, unknown>>
    : {};
  const initial = AGENT_ORCHESTRATION_INITIAL_LAB_STATE;
  return {
    autonomy: finiteScale(candidate.autonomy, initial.autonomy),
    dependencies: finiteScale(candidate.dependencies, initial.dependencies),
    sharedWrites: booleanValue(candidate.sharedWrites, initial.sharedWrites),
    lateWorker: booleanValue(candidate.lateWorker, initial.lateWorker),
    invalidReturn: booleanValue(candidate.invalidReturn, initial.invalidReturn),
    partialJoin: booleanValue(candidate.partialJoin, initial.partialJoin),
    routeInput: enumValue(
      candidate.routeInput,
      ["known", "ambiguous", "refused"] as const,
      initial.routeInput,
    ),
    structuredRoute: booleanValue(candidate.structuredRoute, initial.structuredRoute),
    unknownRoute: booleanValue(candidate.unknownRoute, initial.unknownRoute),
    highRiskHumanGate: booleanValue(
      candidate.highRiskHumanGate,
      initial.highRiskHumanGate,
    ),
    joinPolicy: enumValue(
      candidate.joinPolicy,
      ["all", "quorum", "first-valid", "best-effort"] as const,
      initial.joinPolicy,
    ),
    slowBranch: booleanValue(candidate.slowBranch, initial.slowBranch),
    invalidBranch: booleanValue(candidate.invalidBranch, initial.invalidBranch),
    duplicateBranch: booleanValue(candidate.duplicateBranch, initial.duplicateBranch),
    finalAnswerOwner: booleanValue(
      candidate.finalAnswerOwner,
      initial.finalAnswerOwner,
    ),
    stateOwner: booleanValue(candidate.stateOwner, initial.stateOwner),
    externalActionOwner: booleanValue(
      candidate.externalActionOwner,
      initial.externalActionOwner,
    ),
    transferControl: booleanValue(candidate.transferControl, initial.transferControl),
    operationKey: booleanValue(candidate.operationKey, initial.operationKey),
    ledgerChecked: booleanValue(candidate.ledgerChecked, initial.ledgerChecked),
    workerTree: booleanValue(candidate.workerTree, initial.workerTree),
    artifactMerge: booleanValue(candidate.artifactMerge, initial.artifactMerge),
    independentVerifier: booleanValue(
      candidate.independentVerifier,
      initial.independentVerifier,
    ),
    sharedBlindSpot: booleanValue(candidate.sharedBlindSpot, initial.sharedBlindSpot),
    toolSchemaValid: booleanValue(candidate.toolSchemaValid, initial.toolSchemaValid),
    sideEffectDeclared: booleanValue(
      candidate.sideEffectDeclared,
      initial.sideEffectDeclared,
    ),
    actionAuthorized: booleanValue(
      candidate.actionAuthorized,
      initial.actionAuthorized,
    ),
    mcpBoundaryExplicit: booleanValue(
      candidate.mcpBoundaryExplicit,
      initial.mcpBoundaryExplicit,
    ),
    poisonedEvidence: booleanValue(candidate.poisonedEvidence, initial.poisonedEvidence),
    untrustedResultIsolated: booleanValue(
      candidate.untrustedResultIsolated,
      initial.untrustedResultIsolated,
    ),
    lostStateLayer: enumValue(
      candidate.lostStateLayer,
      ["context", "conversation", "session", "run-state"] as const,
      initial.lostStateLayer,
    ),
    durableCheckpoint: booleanValue(
      candidate.durableCheckpoint,
      initial.durableCheckpoint,
    ),
    sessionEventLog: booleanValue(candidate.sessionEventLog, initial.sessionEventLog),
    auditLink: booleanValue(candidate.auditLink, initial.auditLink),
    capacityState: enumValue(
      candidate.capacityState,
      ["normal", "reduced", "slow-tail"] as const,
      initial.capacityState,
    ),
    admissionLimit: booleanValue(candidate.admissionLimit, initial.admissionLimit),
    queueBounded: booleanValue(candidate.queueBounded, initial.queueBounded),
    queueAtCapacity: booleanValue(candidate.queueAtCapacity, initial.queueAtCapacity),
    budgetVector: booleanValue(candidate.budgetVector, initial.budgetVector),
    deadlineCancellation: booleanValue(
      candidate.deadlineCancellation,
      initial.deadlineCancellation,
    ),
    stopRule: booleanValue(candidate.stopRule, initial.stopRule),
    failure: enumValue(
      candidate.failure,
      ["before", "ambiguous", "after"] as const,
      initial.failure,
    ),
    allowlist: booleanValue(candidate.allowlist, initial.allowlist),
    approval: booleanValue(candidate.approval, initial.approval),
    egressBlocked: booleanValue(candidate.egressBlocked, initial.egressBlocked),
    evidenceQuestion: enumValue(
      candidate.evidenceQuestion,
      ["execution-path", "service-health", "accountability", "outcome-quality"] as const,
      initial.evidenceQuestion,
    ),
    selectedEvidenceSystem: enumValue(
      candidate.selectedEvidenceSystem,
      ["trace", "monitor", "audit", "evaluation"] as const,
      initial.selectedEvidenceSystem,
    ),
    telemetryRedacted: booleanValue(
      candidate.telemetryRedacted,
      initial.telemetryRedacted,
    ),
    outcomeCostLinked: booleanValue(
      candidate.outcomeCostLinked,
      initial.outcomeCostLinked,
    ),
    isolatedTrials: booleanValue(candidate.isolatedTrials, initial.isolatedTrials),
    repeatedTrials: booleanValue(candidate.repeatedTrials, initial.repeatedTrials),
    deterministicGrader: booleanValue(
      candidate.deterministicGrader,
      initial.deterministicGrader,
    ),
    calibratedReview: booleanValue(
      candidate.calibratedReview,
      initial.calibratedReview,
    ),
    versionLocked: booleanValue(candidate.versionLocked, initial.versionLocked),
    regressionThreshold: booleanValue(
      candidate.regressionThreshold,
      initial.regressionThreshold,
    ),
    candidateRegression: booleanValue(
      candidate.candidateRegression,
      initial.candidateRegression,
    ),
    shadow: booleanValue(candidate.shadow, initial.shadow),
    canary: booleanValue(candidate.canary, initial.canary),
    killSwitch: booleanValue(candidate.killSwitch, initial.killSwitch),
    runtime: enumValue(
      candidate.runtime,
      ["application", "responses", "codex", "claude"] as const,
      initial.runtime,
    ),
  };
}

/**
 * Strict shape/value check for persisted evidence. Missing fields, extras,
 * rounded/clamped scales, and invalid enum/boolean values are not canonical.
 */
export function isCanonicalAgentOrchestrationLabState(
  value: unknown,
): value is AgentOrchestrationLabState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const expectedKeys = Object.keys(AGENT_ORCHESTRATION_INITIAL_LAB_STATE).sort();
  const candidateKeys = Object.keys(candidate).sort();
  if (
    expectedKeys.length !== candidateKeys.length
    || expectedKeys.some((key, index) => key !== candidateKeys[index])
  ) {
    return false;
  }
  const normalized = normalizeAgentOrchestrationLabState(candidate);
  return expectedKeys.every((key) => {
    const stateKey = key as AgentOrchestrationLabStateKey;
    return candidate[stateKey] === normalized[stateKey];
  });
}

/** Canonical active-control projection used for signatures and engagement. */
export function getAgentOrchestrationActiveLabState(
  slug: AgentOrchestrationModuleSlug,
  value: unknown,
): Readonly<Partial<AgentOrchestrationLabState>> {
  const normalized = normalizeAgentOrchestrationLabState(value);
  return Object.freeze(Object.fromEntries(
    AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS[slug].map((key) => [
      key,
      normalized[key],
    ]),
  )) as Readonly<Partial<AgentOrchestrationLabState>>;
}

export function canonicalAgentOrchestrationLabStateSignature(
  slug: AgentOrchestrationModuleSlug,
  value: unknown,
): string {
  return JSON.stringify(getAgentOrchestrationActiveLabState(slug, value));
}

export function agentOrchestrationLabStatesEqual(
  slug: AgentOrchestrationModuleSlug,
  left: unknown,
  right: unknown,
): boolean {
  return canonicalAgentOrchestrationLabStateSignature(slug, left)
    === canonicalAgentOrchestrationLabStateSignature(slug, right);
}

/** Inactive fields and normalization noise do not manufacture engagement. */
export function isAgentOrchestrationLabStateEngaged(
  slug: AgentOrchestrationModuleSlug,
  value: unknown,
): boolean {
  return !agentOrchestrationLabStatesEqual(
    slug,
    value,
    AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  );
}

/**
 * Final state gate: correct module/lab pair, a meaningful active-state change,
 * and a module-appropriate decision are all required. Learner-authored written
 * evidence remains a separate persistence-layer requirement.
 */
export function isAgentOrchestrationLabStateCompletable(
  slug: AgentOrchestrationModuleSlug,
  labId: AgentOrchestrationLabId,
  value: unknown,
): boolean {
  if (
    !isAgentOrchestrationLabPair(slug, labId)
    || !isCanonicalAgentOrchestrationLabState(value)
    || !isAgentOrchestrationLabStateEngaged(slug, value)
  ) {
    return false;
  }
  const decisionResult = evaluateAgentOrchestrationLab(slug, labId, value);
  return isAgentOrchestrationLabDecisionCompletable(slug, decisionResult);
}
