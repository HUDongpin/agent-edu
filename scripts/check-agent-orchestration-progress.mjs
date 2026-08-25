import assert from "node:assert/strict";
import {
  AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_CAPSTONE_KEY,
  AGENT_ORCHESTRATION_COURSE_MANIFEST,
  AGENT_ORCHESTRATION_EN_COPY,
  AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
  AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA,
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
  AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
  AGENT_ORCHESTRATION_QUIZ_BEST_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASSED_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT,
  AGENT_ORCHESTRATION_ZH_HANS_COPY,
  agentOrchestrationArtifactEvidenceKey,
  agentOrchestrationArtifactKey,
  agentOrchestrationArtifactPendingDraftKey,
  agentOrchestrationCheckpointPassedKey,
  agentOrchestrationLabKey,
  agentOrchestrationLabPendingKey,
  agentOrchestrationModuleProgressKey,
  agentOrchestrationModuleRequirements,
  agentOrchestrationProgressPercent,
  createAgentOrchestrationArtifactEvidence,
  isAgentOrchestrationCapstoneComplete,
  isMeaningfulAgentOrchestrationEvidenceReference,
  isMeaningfulAgentOrchestrationArtifact,
  isMeaningfulAgentOrchestrationLearnerEvidence,
  invalidateAgentOrchestrationArtifactEvidence,
  isAgentOrchestrationModuleComplete,
  normalizeAgentOrchestrationProgress,
  normalizeAgentOrchestrationLabState,
  recordAgentOrchestrationQuizAttempt,
  saveAgentOrchestrationArtifactDraft,
  saveAgentOrchestrationLabReceipt,
  saveAgentOrchestrationPendingArtifactDraft,
  saveAgentOrchestrationPendingLabWork,
} from "../lib/agent-orchestration/index.ts";

const SUBSTANTIVE_ARTIFACT_DELTA =
  "\nDecision record: compared baseline behavior, reviewed trace evidence, documented accountable owner, rollback trigger, risk boundary, and independent verification result.";
const SUBSTANTIVE_LAB_EVIDENCE =
  "The simulated decision changed because the active control now enforces a declared boundary; the trace and review record identify the remaining limitation.";

const EN_ARTIFACT_LINES = [
  "- Decision evidence: the control owner verified the boundary against the trace baseline.",
  "- Failure policy: the recovery owner records the risk, rollback trigger, and review result.",
  "- Release evaluation: budget, deadline, security approval, and independent verification remain auditable.",
];
const ZH_ARTIFACT_LINES = [
  "- 决策证据：控制负责人依据追踪基线验证权限边界。",
  "- 失败政策：恢复负责人记录风险、回滚触发条件与评审结果。",
  "- 发布评估：预算、截止、安全审批与独立验证均须保留审计记录。",
];

function substantiveArtifactDraft(template, lines = EN_ARTIFACT_LINES, tail = "") {
  const output = [];
  const sectionCount = template.split(/\r?\n/u).filter((line) => /^##\s+\S/u.test(line)).length;
  const requiredSections = Math.min(3, sectionCount);
  let sectionIndex = -1;
  for (const line of template.split(/\r?\n/u)) {
    output.push(line);
    if (/^##\s+\S/u.test(line)) {
      sectionIndex += 1;
      if (sectionIndex < requiredSections) {
        output.push(lines[sectionIndex]);
        if (requiredSections === 2 && sectionIndex === 1) output.push(lines[2]);
      }
    }
  }
  return `${output.join("\n")}${tail}`;
}

function completableLabState(slug) {
  const patchBySlug = {
    "workflow-agent-boundary": { autonomy: 3 },
    "task-graphs-contracts": { invalidReturn: false },
    "chaining-routing": { unknownRoute: true },
    "parallel-fanout-fanin": { slowBranch: false },
    "manager-roles-ownership": { finalAnswerOwner: true },
    "delegation-handoffs": { operationKey: true, ledgerChecked: true },
    "orchestrator-workers-verification": { independentVerifier: true },
    "tools-aci-mcp": { toolSchemaValid: true },
    "context-state-memory": { durableCheckpoint: true },
    "budgets-concurrency-stopping": { budgetVector: true },
    "reliability-recovery": { operationKey: true, ledgerChecked: true },
    "security-authority-human-control": { approval: true },
    "tracing-observability-economics": {
      selectedEvidenceSystem: "trace",
      outcomeCostLinked: true,
    },
    "evaluation-regression-evolution": {
      repeatedTrials: true,
      calibratedReview: true,
    },
    "production-orchestration-capstone": { canary: true },
  };
  return normalizeAgentOrchestrationLabState({
    ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
    ...patchBySlug[slug],
  });
}

function currentRecord(extra = {}) {
  return {
    [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]:
      AGENT_ORCHESTRATION_PROGRESS_VERSION,
    ...extra,
  };
}

assert.equal(
  AGENT_ORCHESTRATION_EN_COPY.finalAssessment.passPercent,
  AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT,
);
assert.equal(
  AGENT_ORCHESTRATION_ZH_HANS_COPY.finalAssessment.passPercent,
  AGENT_ORCHESTRATION_QUIZ_PASS_PERCENT,
);

function saveModuleEvidence(record, courseModule) {
  const template = AGENT_ORCHESTRATION_EN_COPY.modules[courseModule.slug]
    .practice.template;
  assert.equal(saveAgentOrchestrationArtifactDraft(
    record,
    courseModule.slug,
    substantiveArtifactDraft(template, EN_ARTIFACT_LINES, SUBSTANTIVE_ARTIFACT_DELTA),
    template,
  ), true);
  record[agentOrchestrationCheckpointPassedKey(courseModule.slug)] = true;
  assert.equal(saveAgentOrchestrationLabReceipt(
    record,
    courseModule.slug,
    courseModule.labId,
    completableLabState(courseModule.slug),
    SUBSTANTIVE_LAB_EVIDENCE,
  ), true);
  record[agentOrchestrationModuleProgressKey(courseModule.slug)] = true;
}

const stale = {
  "another-course.lesson.1": true,
  "agent-orchestration.module.workflow-agent-boundary.complete": true,
  [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]: "stale-schema",
};
const normalized = normalizeAgentOrchestrationProgress(stale);
assert.equal(normalized["another-course.lesson.1"], true);
assert.equal(
  normalized["agent-orchestration.module.workflow-agent-boundary.complete"],
  undefined,
);
assert.equal(
  normalized[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY],
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
);

const moduleTwo = AGENT_ORCHESTRATION_COURSE_MANIFEST.modules[1];
const moduleFour = AGENT_ORCHESTRATION_COURSE_MANIFEST.modules[3];
const moduleRecord = currentRecord();
moduleRecord[agentOrchestrationModuleProgressKey(moduleTwo.slug)] = true;
assert.equal(isAgentOrchestrationModuleComplete(moduleRecord, moduleTwo.slug), false);
moduleRecord[agentOrchestrationArtifactKey(moduleTwo.slug)] = "   ";
assert.equal(agentOrchestrationModuleRequirements(moduleRecord, moduleTwo.slug).artifact, false);
const moduleTwoTemplate = AGENT_ORCHESTRATION_EN_COPY.modules[moduleTwo.slug]
  .practice.template;
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(moduleTwoTemplate, moduleTwoTemplate),
  false,
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    `  ${moduleTwoTemplate.replaceAll("\n", "\r\n")}  `,
    moduleTwoTemplate,
  ),
  false,
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(`${moduleTwoTemplate}!`, moduleTwoTemplate),
  false,
  "punctuation-only edits are not artifact evidence",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(`${moduleTwoTemplate}x`, moduleTwoTemplate),
  false,
  "one-character edits are not artifact evidence",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact("x", moduleTwoTemplate),
  false,
  "deleting the template down to one character is not positive evidence",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    `${moduleTwoTemplate}${"x".repeat(AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA - 1)}`,
    moduleTwoTemplate,
  ),
  false,
  "a semantic delta below the threshold is not artifact evidence",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    `${moduleTwoTemplate}${"x".repeat(AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA)}`,
    moduleTwoTemplate,
  ),
  false,
  "a repeated-character edit cannot forge a substantive artifact",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    substantiveArtifactDraft(
      moduleTwoTemplate,
      EN_ARTIFACT_LINES,
      ` ${"baseline trace owner rollback verifier budget deadline policy evidence decision ".repeat(1_000)}`,
    ),
    moduleTwoTemplate,
  ),
  true,
  "a large pasted artifact must take the bounded semantic-delta path",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    substantiveArtifactDraft(moduleTwoTemplate, EN_ARTIFACT_LINES, SUBSTANTIVE_ARTIFACT_DELTA),
    moduleTwoTemplate,
  ),
  true,
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    `${moduleTwoTemplate}\nalpha alpha alpha alpha alpha alpha alpha alpha`,
    moduleTwoTemplate,
  ),
  false,
  "a repeated token cannot satisfy the diversity gate",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    `${moduleTwoTemplate}\nalpha bravo charlie delta echo foxtrot`,
    moduleTwoTemplate,
  ),
  false,
  "six disconnected junk words cannot satisfy the richer token gate",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    `${moduleTwoTemplate}\nalpha bravo charlie delta echo foxtrot golf hotel india juliet`,
    moduleTwoTemplate,
  ),
  false,
  "a threshold-length random word list cannot forge orchestration relevance",
);
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango",
    moduleTwoTemplate,
  ),
  false,
  "a diverse replacement cannot delete the canonical artifact structure",
);
const moduleTwoZhTemplate = AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[moduleTwo.slug]
  .practice.template;
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(
    substantiveArtifactDraft(moduleTwoZhTemplate, ZH_ARTIFACT_LINES),
    moduleTwoZhTemplate,
  ),
  true,
  "a substantive Chinese artifact edit must satisfy the bilingual relevance gate",
);
const headingsOnlyKeywordSalad = `${moduleTwoTemplate
  .split(/\r?\n/u)
  .filter((line) => /^#{1,6}\s+\S/u.test(line))
  .join("\n")}\naudit authority baseline boundary budget checkpoint control decision evidence evaluation failure owner recovery rollback security trace verification workflow`;
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(headingsOnlyKeywordSalad, moduleTwoTemplate),
  false,
  "canonical headings plus one domain-keyword salad cannot replace distributed structured work",
);
const distributedKeywordFields = moduleTwoTemplate
  .split(/\r?\n/u)
  .filter((line) => /^#{1,6}\s+\S/u.test(line))
  .flatMap((heading, index) => [
    heading,
    index === 1
      ? "Field: audit evidence owner"
      : index === 2
        ? "Field: rollback risk control"
        : index === 3
          ? "Field: trace budget decision"
          : "",
  ])
  .filter(Boolean)
  .join("\n");
assert.equal(
  isMeaningfulAgentOrchestrationArtifact(distributedKeywordFields, moduleTwoTemplate),
  false,
  "distributed keyword fields cannot replace the canonical non-heading skeleton",
);
for (const courseModule of AGENT_ORCHESTRATION_COURSE_MANIFEST.modules) {
  const template = AGENT_ORCHESTRATION_EN_COPY.modules[courseModule.slug]
    .practice.template;
  assert.equal(
    isMeaningfulAgentOrchestrationArtifact("x", template),
    false,
    `${courseModule.slug}: deleting the template cannot create evidence`,
  );
}
const artifactBehavior = currentRecord();
assert.equal(
  saveAgentOrchestrationArtifactDraft(
    artifactBehavior,
    moduleTwo.slug,
    moduleTwoTemplate,
    moduleTwoTemplate,
  ),
  false,
);
assert.equal(
  artifactBehavior[agentOrchestrationArtifactEvidenceKey(moduleTwo.slug)],
  undefined,
);
assert.equal(
  saveAgentOrchestrationArtifactDraft(
    artifactBehavior,
    moduleTwo.slug,
    substantiveArtifactDraft(moduleTwoTemplate, EN_ARTIFACT_LINES, SUBSTANTIVE_ARTIFACT_DELTA),
    moduleTwoTemplate,
  ),
  true,
);
assert.equal(
  typeof artifactBehavior[agentOrchestrationArtifactEvidenceKey(moduleTwo.slug)],
  "object",
  "a meaningful save must write an artifact evidence receipt",
);
saveAgentOrchestrationPendingArtifactDraft(
  artifactBehavior,
  moduleTwo.slug,
  `${moduleTwoTemplate}\nRecoverable work in progress`,
);
assert.equal(
  artifactBehavior[agentOrchestrationArtifactPendingDraftKey(moduleTwo.slug)],
  `${moduleTwoTemplate}\nRecoverable work in progress`,
  "a working artifact draft must survive navigation",
);
assert.equal(
  artifactBehavior[agentOrchestrationArtifactEvidenceKey(moduleTwo.slug)],
  undefined,
  "an auto-saved working draft must not retain the completion receipt",
);
assert.equal(
  saveAgentOrchestrationArtifactDraft(
    artifactBehavior,
    moduleTwo.slug,
    substantiveArtifactDraft(moduleTwoTemplate, EN_ARTIFACT_LINES, SUBSTANTIVE_ARTIFACT_DELTA),
    moduleTwoTemplate,
  ),
  true,
);
assert.equal(
  artifactBehavior[agentOrchestrationArtifactPendingDraftKey(moduleTwo.slug)],
  undefined,
  "explicit evidence save must promote and clear the pending draft",
);
invalidateAgentOrchestrationArtifactEvidence(artifactBehavior, moduleTwo.slug);
assert.equal(
  artifactBehavior[agentOrchestrationArtifactEvidenceKey(moduleTwo.slug)],
  undefined,
  "an unsaved edit must remove the artifact evidence receipt",
);
moduleRecord[agentOrchestrationArtifactKey(moduleTwo.slug)] = moduleTwoTemplate;
moduleRecord[agentOrchestrationArtifactEvidenceKey(moduleTwo.slug)] =
  createAgentOrchestrationArtifactEvidence(moduleTwo.slug, moduleTwoTemplate);
assert.equal(
  agentOrchestrationModuleRequirements(moduleRecord, moduleTwo.slug).artifact,
  false,
  "saving the untouched starter template must not count as artifact evidence",
);
const forgedBaselineRecord = currentRecord({
  [agentOrchestrationArtifactKey(moduleTwo.slug)]:
    "alpha bravo charlie delta echo foxtrot golf hotel india juliet",
  [agentOrchestrationArtifactEvidenceKey(moduleTwo.slug)]: {
    saved: true,
    moduleSlug: moduleTwo.slug,
    starterTemplate: "",
  },
});
assert.equal(
  agentOrchestrationModuleRequirements(forgedBaselineRecord, moduleTwo.slug).artifact,
  false,
  "a receipt cannot supply its own forged starter baseline",
);
saveModuleEvidence(moduleRecord, moduleTwo);
assert.equal(isAgentOrchestrationModuleComplete(moduleRecord, moduleTwo.slug), true);
assert.equal(agentOrchestrationProgressPercent(moduleRecord), 6);
assert.notEqual(
  agentOrchestrationLabKey(moduleTwo.labId, moduleTwo.slug),
  agentOrchestrationLabKey(moduleFour.labId, moduleFour.slug),
);
assert.equal(agentOrchestrationModuleRequirements(moduleRecord, moduleFour.slug).lab, false);

const moduleTwoLabKey = agentOrchestrationLabKey(moduleTwo.labId, moduleTwo.slug);
const validLabReceipt = moduleRecord[moduleTwoLabKey];
assert.equal(typeof validLabReceipt, "object");
assert.equal(isMeaningfulAgentOrchestrationLearnerEvidence("x"), false);
assert.equal(
  isMeaningfulAgentOrchestrationLearnerEvidence(
    "alpha bravo charlie delta echo foxtrot golf hotel india juliet",
  ),
  false,
  "a disconnected learner-evidence word list must not count as reasoning",
);
assert.equal(
  isMeaningfulAgentOrchestrationLearnerEvidence(
    "control evidence decision boundary owner trace budget rollback verification workflow",
  ),
  false,
  "a domain-keyword salad without reasoning structure must not count",
);
assert.equal(
  isMeaningfulAgentOrchestrationLearnerEvidence(
    "Field: control evidence decision boundary owner trace budget rollback verification workflow",
  ),
  false,
  "a labelled keyword list is not an evidence-based explanation",
);
assert.equal(
  isMeaningfulAgentOrchestrationLearnerEvidence(SUBSTANTIVE_LAB_EVIDENCE),
  true,
);
assert.equal(
  isMeaningfulAgentOrchestrationLearnerEvidence(
    "我选择排队，因为容量已经达到上限；预算停止规则保留了控制边界与人工复核责任，同时追踪记录说明了当前决策、起作用的字段和仍未消除的风险。",
  ),
  true,
  "a substantive Chinese reasoning record must remain valid",
);
const labAccepted = (receipt) => agentOrchestrationModuleRequirements(
  currentRecord({ [moduleTwoLabKey]: receipt }),
  moduleTwo.slug,
).lab;
const cloneReceipt = () => JSON.parse(JSON.stringify(validLabReceipt));

for (const [name, mutate] of [
  ["empty state", (receipt) => { receipt.state = {}; }],
  ["one-character evidence", (receipt) => { receipt.learnerEvidence = "x"; }],
  ["stale decision", (receipt) => { receipt.decision.status = "STOP"; }],
  ["wrong outcome", (receipt) => { receipt.decision.outcome = "release-gated"; }],
  ["non-array warnings", (receipt) => { receipt.decision.warnings = ""; }],
  ["null warnings", (receipt) => { receipt.decision.warnings = null; }],
  ["array-like warnings", (receipt) => { receipt.decision.warnings = { length: 0 }; }],
  ["forged warning", (receipt) => { receipt.decision.warnings = ["duplicate-branch"]; }],
  ["wrong schema", (receipt) => { receipt.schemaVersion = AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION + 1; }],
  ["wrong slug", (receipt) => { receipt.moduleSlug = moduleFour.slug; }],
  ["wrong lab id", (receipt) => { receipt.labId = "production-readiness"; }],
  ["extra state field", (receipt) => { receipt.state.injected = true; }],
  ["extra receipt field", (receipt) => { receipt.unreviewed = true; }],
  ["default untouched state", (receipt) => {
    receipt.state = { ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE };
  }],
]) {
  const receipt = cloneReceipt();
  mutate(receipt);
  assert.equal(labAccepted(receipt), false, `${name} must not satisfy lab evidence`);
}

const quizRecord = currentRecord();
recordAgentOrchestrationQuizAttempt(quizRecord, 93, 80);
recordAgentOrchestrationQuizAttempt(quizRecord, 40, 80);
assert.equal(quizRecord[AGENT_ORCHESTRATION_QUIZ_BEST_KEY], 93);
assert.equal(quizRecord[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY], true);

const legacyCapstone = currentRecord({
  [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: Array.from(
    { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
    () => true,
  ),
  [AGENT_ORCHESTRATION_CAPSTONE_KEY]: true,
});
assert.equal(isAgentOrchestrationCapstoneComplete(legacyCapstone), false);
assert.equal(isMeaningfulAgentOrchestrationEvidenceReference("x"), false);
assert.equal(isMeaningfulAgentOrchestrationEvidenceReference("xxxxxxxxxxxxxxxx"), false);
assert.equal(isMeaningfulAgentOrchestrationEvidenceReference("evidence-01"), false);
assert.equal(isMeaningfulAgentOrchestrationEvidenceReference("artifact-01"), false);
assert.equal(isMeaningfulAgentOrchestrationEvidenceReference("todo-placeholder-01"), false);
assert.equal(isMeaningfulAgentOrchestrationEvidenceReference("trace://fixture"), false);
assert.equal(
  isMeaningfulAgentOrchestrationEvidenceReference("http://aicourse.top/evidence/release-20260823"),
  false,
  "plain HTTP must not satisfy a learner-facing HTTPS evidence contract",
);
assert.equal(
  isMeaningfulAgentOrchestrationEvidenceReference("trace://run-2026-08-23-0001"),
  true,
);
const placeholderCapstone = currentRecord({
  [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: Array.from(
    { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
    () => "x",
  ),
  [AGENT_ORCHESTRATION_CAPSTONE_KEY]: true,
});
assert.equal(isAgentOrchestrationCapstoneComplete(placeholderCapstone), false);
const duplicateCapstone = currentRecord({
  [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: Array.from(
    { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
    () => "trace://duplicate-evidence-0001",
  ),
  [AGENT_ORCHESTRATION_CAPSTONE_KEY]: true,
});
assert.equal(isAgentOrchestrationCapstoneComplete(duplicateCapstone), false);
const fragmentDuplicateCapstone = currentRecord({
  [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: Array.from(
    { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
    (_, index) => `https://evidence.example/run/verified-0001#copy-${index + 1}`,
  ),
  [AGENT_ORCHESTRATION_CAPSTONE_KEY]: true,
});
assert.equal(isAgentOrchestrationCapstoneComplete(fragmentDuplicateCapstone), false);
const formatCharacterDuplicateCapstone = currentRecord({
  [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: Array.from(
    { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
    (_, index) => `trace://run-verified-0001${"\u200b".repeat(index)}`,
  ),
  [AGENT_ORCHESTRATION_CAPSTONE_KEY]: true,
});
assert.equal(isAgentOrchestrationCapstoneComplete(formatCharacterDuplicateCapstone), false);
const plainHttpCapstone = currentRecord({
  [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: Array.from(
    { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
    (_, index) => `http://aicourse.top/evidence/release-${2026082301 + index}`,
  ),
});
assert.equal(
  isAgentOrchestrationCapstoneComplete(plainHttpCapstone),
  false,
  "fifteen distinct plain-HTTP references must not complete an HTTPS evidence contract",
);

const complete = currentRecord();
for (const courseModule of AGENT_ORCHESTRATION_COURSE_MANIFEST.modules) {
  saveModuleEvidence(complete, courseModule);
}
recordAgentOrchestrationQuizAttempt(complete, 100, 80);
complete[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY] = Array.from(
  { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
  (_, index) => `trace://course15-run-20260823-${String(index + 1).padStart(4, "0")}`,
);
complete[AGENT_ORCHESTRATION_CAPSTONE_KEY] = true;
assert.equal(isAgentOrchestrationCapstoneComplete(complete), true);
delete complete[AGENT_ORCHESTRATION_CAPSTONE_KEY];
assert.equal(
  isAgentOrchestrationCapstoneComplete(complete),
  true,
  "UI and progress must derive capstone completion from the same evidence validator",
);
assert.equal(agentOrchestrationProgressPercent(complete), 100);

class MemoryStorage {
  #items = new Map();

  get length() {
    return this.#items.size;
  }

  clear() {
    this.#items.clear();
  }

  getItem(key) {
    return this.#items.has(String(key)) ? this.#items.get(String(key)) : null;
  }

  key(index) {
    return Array.from(this.#items.keys())[index] ?? null;
  }

  removeItem(key) {
    this.#items.delete(String(key));
  }

  setItem(key, value) {
    this.#items.set(String(key), String(value));
  }
}

const browserWindow = new EventTarget();
const local = new MemoryStorage();
const session = new MemoryStorage();
Object.assign(browserWindow, { localStorage: local, sessionStorage: session });
globalThis.window = browserWindow;
globalThis.localStorage = local;
globalThis.sessionStorage = session;

const progressStore = await import(
  "../components/agent-orchestration/progress-store.ts"
);
local.setItem(progressStore.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY, "{broken-json");
const repaired = progressStore.readAgentOrchestrationProgress();
assert.equal(
  repaired[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY],
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
);
assert.equal(
  session.getItem("ae.progress.agent-orchestration-corrupt-backup"),
  "{broken-json",
);
assert.equal(progressStore.isAgentOrchestrationStorageAvailable(), false);
assert.equal(
  local.getItem(progressStore.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY),
  "{broken-json",
  "a corrupt shared record remains untouched for forensic recovery",
);
assert.equal(progressStore.resetAgentOrchestrationProgress(), false);
assert.equal(
  local.getItem(progressStore.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY),
  "{broken-json",
  "an ordinary course reset cannot replace a corrupt shared record",
);

local.removeItem(progressStore.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY);
assert.deepEqual(
  progressStore.resetAgentOrchestrationProgressAfterGlobalReset(),
  { persisted: true },
);

local.setItem(progressStore.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY, JSON.stringify({
  "another-course.lesson.1": true,
  [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]: AGENT_ORCHESTRATION_PROGRESS_VERSION,
  [agentOrchestrationModuleProgressKey(moduleTwo.slug)]: true,
}));
assert.equal(progressStore.resetAgentOrchestrationProgress(), true);
const afterReset = JSON.parse(
  local.getItem(progressStore.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY),
);
assert.equal(afterReset["another-course.lesson.1"], true);
assert.equal(afterReset[agentOrchestrationModuleProgressKey(moduleTwo.slug)], undefined);
assert.equal(
  afterReset[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY],
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
);
assert.equal(progressStore.isAgentOrchestrationProgressStorageEvent({
  key: progressStore.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
  storageArea: local,
}), true);
assert.equal(progressStore.isAgentOrchestrationProgressStorageEvent({
  key: "unrelated",
  storageArea: local,
}), false);

const navigationRoundTrip = currentRecord();
saveAgentOrchestrationPendingArtifactDraft(
  navigationRoundTrip,
  moduleTwo.slug,
  `${moduleTwoTemplate}\nRecover this exact unsaved navigation draft.`,
);
saveAgentOrchestrationPendingLabWork(
  navigationRoundTrip,
  moduleTwo.slug,
  moduleTwo.labId,
  completableLabState(moduleTwo.slug),
  "Working explanation preserved during navigation but not explicitly submitted.",
);
assert.equal(progressStore.writeAgentOrchestrationProgress(navigationRoundTrip), true);
const recoveredNavigation = progressStore.readAgentOrchestrationProgress();
assert.equal(
  recoveredNavigation[agentOrchestrationArtifactPendingDraftKey(moduleTwo.slug)],
  `${moduleTwoTemplate}\nRecover this exact unsaved navigation draft.`,
);
assert.equal(
  typeof recoveredNavigation[
    agentOrchestrationLabPendingKey(moduleTwo.labId, moduleTwo.slug)
  ],
  "object",
);
assert.equal(
  recoveredNavigation[agentOrchestrationArtifactEvidenceKey(moduleTwo.slug)],
  undefined,
);
assert.equal(recoveredNavigation[moduleTwoLabKey], undefined);
assert.equal(
  agentOrchestrationModuleRequirements(recoveredNavigation, moduleTwo.slug).ready,
  false,
  "recoverable working drafts never become completion evidence after storage round-trip",
);

console.log("PASS Course 15 evidence-derived progress behavior");
