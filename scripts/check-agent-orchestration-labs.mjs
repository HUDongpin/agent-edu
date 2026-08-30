import assert from "node:assert/strict";
import {
  AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS,
  AGENT_ORCHESTRATION_LAB_ID_BY_MODULE,
  AGENT_ORCHESTRATION_LAB_IDS,
  AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
  AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION,
  AGENT_ORCHESTRATION_MODULE_SLUGS,
  agentOrchestrationLabDecisionsEqual,
  agentOrchestrationLabStatesEqual,
  canonicalAgentOrchestrationLabStateSignature,
  evaluateAgentOrchestrationLab,
  getAgentOrchestrationActiveLabState,
  isAgentOrchestrationLabDecisionCompletable,
  isAgentOrchestrationLabPair,
  isAgentOrchestrationLabStateCompletable,
  isAgentOrchestrationLabStateEngaged,
  isCanonicalAgentOrchestrationLabState,
  normalizeAgentOrchestrationLabState,
} from "../lib/agent-orchestration/index.ts";

const BOOL = Object.freeze([false, true]);
const DOMAINS = Object.freeze({
  autonomy: Object.freeze([0, 1, 2, 3, 4, 5]),
  dependencies: Object.freeze([0, 1, 2, 3, 4, 5]),
  sharedWrites: BOOL,
  lateWorker: BOOL,
  invalidReturn: BOOL,
  partialJoin: BOOL,
  routeInput: Object.freeze(["known", "ambiguous", "refused"]),
  structuredRoute: BOOL,
  unknownRoute: BOOL,
  highRiskHumanGate: BOOL,
  joinPolicy: Object.freeze(["all", "quorum", "first-valid", "best-effort"]),
  slowBranch: BOOL,
  invalidBranch: BOOL,
  duplicateBranch: BOOL,
  finalAnswerOwner: BOOL,
  stateOwner: BOOL,
  externalActionOwner: BOOL,
  transferControl: BOOL,
  operationKey: BOOL,
  ledgerChecked: BOOL,
  workerTree: BOOL,
  artifactMerge: BOOL,
  independentVerifier: BOOL,
  sharedBlindSpot: BOOL,
  toolSchemaValid: BOOL,
  sideEffectDeclared: BOOL,
  actionAuthorized: BOOL,
  mcpBoundaryExplicit: BOOL,
  poisonedEvidence: BOOL,
  untrustedResultIsolated: BOOL,
  lostStateLayer: Object.freeze(["context", "conversation", "session", "run-state"]),
  durableCheckpoint: BOOL,
  sessionEventLog: BOOL,
  auditLink: BOOL,
  capacityState: Object.freeze(["normal", "reduced", "slow-tail"]),
  admissionLimit: BOOL,
  queueBounded: BOOL,
  queueAtCapacity: BOOL,
  budgetVector: BOOL,
  deadlineCancellation: BOOL,
  stopRule: BOOL,
  failure: Object.freeze(["before", "ambiguous", "after"]),
  allowlist: BOOL,
  approval: BOOL,
  egressBlocked: BOOL,
  evidenceQuestion: Object.freeze([
    "execution-path",
    "service-health",
    "accountability",
    "outcome-quality",
  ]),
  selectedEvidenceSystem: Object.freeze(["trace", "monitor", "audit", "evaluation"]),
  telemetryRedacted: BOOL,
  outcomeCostLinked: BOOL,
  isolatedTrials: BOOL,
  repeatedTrials: BOOL,
  deterministicGrader: BOOL,
  calibratedReview: BOOL,
  versionLocked: BOOL,
  regressionThreshold: BOOL,
  candidateRegression: BOOL,
  shadow: BOOL,
  canary: BOOL,
  killSwitch: BOOL,
});

const EXPECTED_CASES = Object.freeze({
  "workflow-agent-boundary": 72,
  "task-graphs-contracts": 8,
  "chaining-routing": 24,
  "parallel-fanout-fanin": 32,
  "manager-roles-ownership": 8,
  "delegation-handoffs": 8,
  "orchestrator-workers-verification": 16,
  "tools-aci-mcp": 64,
  "context-state-memory": 32,
  "budgets-concurrency-stopping": 192,
  "reliability-recovery": 12,
  "security-authority-human-control": 16,
  "tracing-observability-economics": 64,
  "evaluation-regression-evolution": 128,
  "production-orchestration-capstone": 8,
});

function enumerate(fields, index = 0, patch = {}, cases = []) {
  if (index === fields.length) {
    cases.push(Object.freeze({ ...patch }));
    return cases;
  }
  const field = fields[index];
  const domain = DOMAINS[field];
  assert.ok(domain, `${field} must have an explicit finite release-test domain`);
  for (const value of domain) {
    patch[field] = value;
    enumerate(fields, index + 1, patch, cases);
  }
  delete patch[field];
  return cases;
}

function stateFor(patch = {}) {
  return normalizeAgentOrchestrationLabState({
    ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
    ...patch,
  });
}

function evaluate(slug, patch = {}) {
  return evaluateAgentOrchestrationLab(
    slug,
    AGENT_ORCHESTRATION_LAB_ID_BY_MODULE[slug],
    stateFor(patch),
  );
}

function decisionSignature(value) {
  return JSON.stringify(value);
}

assert.equal(AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION, 2);
assert.match(AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION, /^course15-labs-/);
assert.deepEqual(
  Object.keys(AGENT_ORCHESTRATION_LAB_ID_BY_MODULE),
  [...AGENT_ORCHESTRATION_MODULE_SLUGS],
  "every and only Course 15 module slug must own a lab scenario",
);
assert.deepEqual(
  Object.keys(AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS),
  [...AGENT_ORCHESTRATION_MODULE_SLUGS],
  "every and only Course 15 module slug must declare active controls",
);

let totalCases = 0;
const coverage = new Set();

for (const slug of AGENT_ORCHESTRATION_MODULE_SLUGS) {
  const labId = AGENT_ORCHESTRATION_LAB_ID_BY_MODULE[slug];
  const fields = AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS[slug];
  const cases = enumerate(fields);
  const expectedCases = EXPECTED_CASES[slug];
  assert.equal(
    cases.length,
    expectedCases,
    `${slug} must enumerate its complete finite input space`,
  );
  assert.equal(new Set(fields).size, fields.length, `${slug} controls must be unique`);
  assert.equal(isAgentOrchestrationLabPair(slug, labId), true);
  assert.equal(
    isAgentOrchestrationLabStateEngaged(slug, AGENT_ORCHESTRATION_INITIAL_LAB_STATE),
    false,
    `${slug} untouched initial state must not count as engagement`,
  );
  assert.equal(
    isAgentOrchestrationLabStateCompletable(
      slug,
      labId,
      AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
    ),
    false,
    `${slug} untouched initial state must not complete the lab`,
  );

  let completableCases = 0;
  let nonCompletableCases = 0;
  for (const patch of cases) {
    const state = stateFor(patch);
    assert.equal(isCanonicalAgentOrchestrationLabState(state), true);
    assert.deepEqual(
      Object.keys(getAgentOrchestrationActiveLabState(slug, state)),
      [...fields],
      `${slug} active projection must preserve the declared control order`,
    );
    const first = evaluateAgentOrchestrationLab(slug, labId, state);
    const second = evaluateAgentOrchestrationLab(slug, labId, state);
    assert.deepEqual(first, second, `${slug} decisions must be deterministic`);
    assert.equal(Object.isFrozen(first), true, `${slug} decisions must be immutable`);
    assert.equal(
      Object.isFrozen(first.warnings),
      true,
      `${slug} decision warning evidence must be immutable`,
    );

    const decisionCompletable = isAgentOrchestrationLabDecisionCompletable(slug, first);
    const engaged = isAgentOrchestrationLabStateEngaged(slug, state);
    const stateCompletable = isAgentOrchestrationLabStateCompletable(slug, labId, state);
    assert.equal(
      stateCompletable,
      engaged && decisionCompletable,
      `${slug} completion must be engagement AND an acceptable recomputed decision`,
    );
    if (stateCompletable) completableCases += 1;
    else nonCompletableCases += 1;
  }
  assert.ok(completableCases > 0, `${slug} must have a reachable completable state`);
  assert.ok(nonCompletableCases > 0, `${slug} must retain a reachable hold/block state`);

  // Every declared control must be causally observable in at least one pair of
  // otherwise-identical cases. A warning counts because it changes evidence.
  for (const field of fields) {
    const otherFields = fields.filter((candidate) => candidate !== field);
    const groups = new Map();
    for (const patch of cases) {
      const groupKey = JSON.stringify(otherFields.map((key) => patch[key]));
      const values = groups.get(groupKey) ?? new Set();
      values.add(decisionSignature(evaluate(slug, patch)));
      groups.set(groupKey, values);
    }
    assert.ok(
      [...groups.values()].some((signatures) => signatures.size > 1),
      `${slug}.${field} must influence a decision or warning`,
    );
  }

  // An inactive legacy field may survive migration but may not manufacture
  // participation or alter the active-state receipt.
  const legacyRuntimeChange = {
    ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
    runtime: "codex",
  };
  assert.equal(
    agentOrchestrationLabStatesEqual(
      slug,
      legacyRuntimeChange,
      AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
    ),
    true,
    `${slug} inactive fields must not change its canonical receipt`,
  );
  assert.equal(
    isAgentOrchestrationLabStateEngaged(slug, legacyRuntimeChange),
    false,
    `${slug} inactive fields must not count as engagement`,
  );

  const wrongLabId = AGENT_ORCHESTRATION_LAB_IDS.find((candidate) => candidate !== labId);
  assert.equal(isAgentOrchestrationLabPair(slug, wrongLabId), false);
  assert.throws(
    () => evaluateAgentOrchestrationLab(slug, wrongLabId, stateFor()),
    RangeError,
    `${slug} must fail closed on a mismatched reusable lab shell`,
  );

  coverage.add(slug);
  totalCases += cases.length;
}

assert.equal(coverage.size, 15, "truth tables must cover all 15 module slugs");
assert.equal(totalCases, 684, "truth tables must enumerate 684 finite module cases");

// M2 mask: all graph invariants independently block the terminal state.
for (let mask = 0; mask < 8; mask += 1) {
  const result = evaluate("task-graphs-contracts", {
    lateWorker: Boolean(mask & 1),
    invalidReturn: Boolean(mask & 2),
    partialJoin: Boolean(mask & 4),
  });
  assert.equal(result.status, mask === 0 ? "VALID" : "BLOCK", `M2 mask ${mask}`);
}

// M3: code owns legal route choices, ambiguity owns an unknown path, and a
// refused/high-risk input owns an explicit human gate.
assert.equal(evaluate("chaining-routing", {
  routeInput: "known",
  structuredRoute: true,
}).outcome, "route-deterministic");
assert.equal(evaluate("chaining-routing", {
  routeInput: "ambiguous",
  structuredRoute: true,
  unknownRoute: true,
}).outcome, "route-unknown");
assert.equal(evaluate("chaining-routing", {
  routeInput: "refused",
  structuredRoute: true,
  highRiskHumanGate: true,
}).outcome, "route-human-gated");
assert.equal(evaluate("chaining-routing", {
  routeInput: "refused",
  structuredRoute: true,
  highRiskHumanGate: false,
}).outcome, "route-forced");

// M4: policy changes completion meaning; duplicate delivery changes evidence
// without being counted as another successful branch.
assert.equal(evaluate("parallel-fanout-fanin", {
  joinPolicy: "all",
  slowBranch: true,
}).status, "HOLD", "M4 all must wait for a slow branch");
assert.equal(evaluate("parallel-fanout-fanin", {
  joinPolicy: "best-effort",
  slowBranch: true,
}).status, "PARTIAL", "M4 best-effort must label partial completion");
assert.deepEqual(evaluate("parallel-fanout-fanin", {
  joinPolicy: "first-valid",
  duplicateBranch: true,
}).warnings, ["duplicate-branch"], "M4 must surface duplicate delivery");

// M7 mask: closure requires bounded work, one merge owner, independent
// evidence, and no shared blind spot.
for (let mask = 0; mask < 16; mask += 1) {
  const result = evaluate("orchestrator-workers-verification", {
    workerTree: Boolean(mask & 1),
    artifactMerge: Boolean(mask & 2),
    independentVerifier: Boolean(mask & 4),
    sharedBlindSpot: Boolean(mask & 8),
  });
  const ready = Boolean(mask & 1) && Boolean(mask & 2) && Boolean(mask & 4)
    && !Boolean(mask & 8);
  assert.equal(result.status, ready ? "VERIFY" : "STOP", `M7 mask ${mask}`);
}

// M8: schema/effect/protocol contracts, action authorization, and untrusted
// MCP/tool result isolation are distinct controls.
const validToolContract = {
  toolSchemaValid: true,
  sideEffectDeclared: true,
  mcpBoundaryExplicit: true,
  poisonedEvidence: true,
  untrustedResultIsolated: true,
};
assert.equal(evaluate("tools-aci-mcp", {
  ...validToolContract,
  actionAuthorized: false,
}).outcome, "tool-capability-denied");
assert.equal(evaluate("tools-aci-mcp", {
  ...validToolContract,
  actionAuthorized: true,
}).outcome, "tool-action-authorized");
assert.equal(evaluate("tools-aci-mcp", {
  ...validToolContract,
  untrustedResultIsolated: false,
}).outcome, "tool-result-exposed");
assert.equal(evaluate("tools-aci-mcp", {
  ...validToolContract,
  toolSchemaValid: false,
}).outcome, "tool-contract-blocked");

// context-recovery compatibility token: M9 distinguishes durable state from
// reconstructable context/session evidence, while M11 classifies ambiguity.
assert.equal(evaluate("context-state-memory", {
  lostStateLayer: "session",
  durableCheckpoint: true,
  sessionEventLog: false,
  auditLink: true,
}).outcome, "state-recovery-blocked");
assert.equal(evaluate("reliability-recovery", {
  failure: "ambiguous",
  operationKey: true,
  ledgerChecked: true,
}).outcome, "recovery-reconciled");

// M10: admission, bounded queue/backpressure, budget vector, deadline/cancel,
// and stop rule jointly govern explicit admit/queue/reject/degrade outcomes.
const validBudgetPolicy = {
  admissionLimit: true,
  queueBounded: true,
  budgetVector: true,
  deadlineCancellation: true,
  stopRule: true,
};
assert.equal(evaluate("budgets-concurrency-stopping", {
  ...validBudgetPolicy,
  capacityState: "normal",
}).outcome, "budget-admitted");
assert.equal(evaluate("budgets-concurrency-stopping", {
  ...validBudgetPolicy,
  capacityState: "reduced",
  queueAtCapacity: false,
}).outcome, "budget-queued");
assert.equal(evaluate("budgets-concurrency-stopping", {
  ...validBudgetPolicy,
  capacityState: "reduced",
  queueAtCapacity: true,
}).outcome, "budget-rejected");
assert.equal(evaluate("budgets-concurrency-stopping", {
  ...validBudgetPolicy,
  capacityState: "slow-tail",
}).outcome, "budget-degraded");

// governance-trace compatibility token: authority defense (M12), evidence
// system selection/economics (M13), and regression evidence (M14) are no
// longer one generic allowlist simulation.
assert.equal(evaluate("security-authority-human-control", {
  poisonedEvidence: true,
  allowlist: true,
  egressBlocked: true,
  approval: true,
}).outcome, "governance-defended");
assert.equal(evaluate("tracing-observability-economics", {
  evidenceQuestion: "accountability",
  selectedEvidenceSystem: "audit",
  telemetryRedacted: true,
  outcomeCostLinked: true,
}).outcome, "observability-supported");
assert.equal(evaluate("tracing-observability-economics", {
  evidenceQuestion: "accountability",
  selectedEvidenceSystem: "trace",
  telemetryRedacted: true,
  outcomeCostLinked: true,
}).outcome, "observability-unsupported");
assert.equal(evaluate("tracing-observability-economics", {
  evidenceQuestion: "accountability",
  selectedEvidenceSystem: "audit",
  telemetryRedacted: false,
  outcomeCostLinked: true,
}).outcome, "telemetry-exposed");

const validEvaluation = {
  isolatedTrials: true,
  repeatedTrials: true,
  deterministicGrader: true,
  calibratedReview: true,
  versionLocked: true,
  regressionThreshold: true,
};
assert.equal(evaluate("evaluation-regression-evolution", {
  ...validEvaluation,
  candidateRegression: true,
}).outcome, "regression-blocked");
assert.equal(evaluate("evaluation-regression-evolution", {
  ...validEvaluation,
  candidateRegression: false,
}).outcome, "candidate-release-eligible");
assert.equal(evaluate("evaluation-regression-evolution", {
  ...validEvaluation,
  repeatedTrials: false,
}).outcome, "evaluation-insufficient");

// production-readiness compatibility token: all three progressive-release
// controls are required.
assert.equal(evaluate("production-orchestration-capstone", {
  shadow: true,
  canary: true,
  killSwitch: true,
}).outcome, "release-gated");

// Normalization and adversarial persistence checks.
assert.equal(isCanonicalAgentOrchestrationLabState(AGENT_ORCHESTRATION_INITIAL_LAB_STATE), true);
assert.deepEqual(normalizeAgentOrchestrationLabState(null), AGENT_ORCHESTRATION_INITIAL_LAB_STATE);
assert.deepEqual(normalizeAgentOrchestrationLabState([]), AGENT_ORCHESTRATION_INITIAL_LAB_STATE);
assert.equal(isCanonicalAgentOrchestrationLabState(null), false);
assert.equal(isCanonicalAgentOrchestrationLabState({}), false);
assert.equal(isCanonicalAgentOrchestrationLabState({
  ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  extra: "forged",
}), false, "extra state fields must not be canonical");
assert.equal(isCanonicalAgentOrchestrationLabState({
  ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  autonomy: 2.4,
}), false, "rounded numeric state must not masquerade as canonical");
assert.equal(isCanonicalAgentOrchestrationLabState({
  ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  routeInput: "invented-route",
}), false, "unknown enums must not be canonical");
assert.equal(isCanonicalAgentOrchestrationLabState({
  ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  approval: 1,
}), false, "truthy non-booleans must not be canonical");

const normalizedAdversarial = normalizeAgentOrchestrationLabState({
  ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  autonomy: 99,
  dependencies: -4,
  routeInput: "invented-route",
  approval: "yes",
  runtime: "invented-runtime",
  extra: "discard me",
});
assert.equal(normalizedAdversarial.autonomy, 5);
assert.equal(normalizedAdversarial.dependencies, 0);
assert.equal(normalizedAdversarial.routeInput, AGENT_ORCHESTRATION_INITIAL_LAB_STATE.routeInput);
assert.equal(normalizedAdversarial.approval, AGENT_ORCHESTRATION_INITIAL_LAB_STATE.approval);
assert.equal(normalizedAdversarial.runtime, AGENT_ORCHESTRATION_INITIAL_LAB_STATE.runtime);
assert.equal(Object.hasOwn(normalizedAdversarial, "extra"), false);
assert.equal(isCanonicalAgentOrchestrationLabState(normalizedAdversarial), true);

const engagedRoute = stateFor({ routeInput: "known" });
assert.notEqual(
  canonicalAgentOrchestrationLabStateSignature(
    "chaining-routing",
    engagedRoute,
  ),
  canonicalAgentOrchestrationLabStateSignature(
    "chaining-routing",
    AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  ),
);
assert.equal(isAgentOrchestrationLabStateEngaged("chaining-routing", engagedRoute), true);
assert.equal(
  isAgentOrchestrationLabStateCompletable(
    "chaining-routing",
    "pattern-selector",
    { routeInput: "known" },
  ),
  false,
  "a partial/noncanonical state object must never be accepted as evidence",
);

const realDecision = evaluate("chaining-routing", {
  routeInput: "known",
  structuredRoute: true,
});
assert.equal(isAgentOrchestrationLabDecisionCompletable("chaining-routing", realDecision), true);
assert.equal(isAgentOrchestrationLabDecisionCompletable("chaining-routing", {
  ...realDecision,
  status: "BLOCK",
}), false, "a forged status/outcome pair must not be completable");
assert.equal(agentOrchestrationLabDecisionsEqual(realDecision, realDecision), true);
assert.equal(agentOrchestrationLabDecisionsEqual(realDecision, {
  ...realDecision,
  outcome: "route-forced",
}), false, "persisted and recomputed decisions must be compared exactly");
assert.equal(agentOrchestrationLabDecisionsEqual(realDecision, {
  ...realDecision,
  warnings: "",
}), false, "a non-array warning field must fail closed even when its length is zero");
assert.doesNotThrow(
  () => agentOrchestrationLabDecisionsEqual(realDecision, {
    ...realDecision,
    warnings: null,
  }),
  "a malformed warning field must never crash persisted-progress recovery",
);
assert.equal(agentOrchestrationLabDecisionsEqual(realDecision, {
  ...realDecision,
  warnings: null,
}), false, "a null warning field must fail closed");

console.log(
  "PASS Course 15 module-specific lab truth tables "
    + `(15 slugs, ${totalCases} exhaustive finite cases, normalization/adversarial gates)`,
);
