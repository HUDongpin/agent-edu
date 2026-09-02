import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  normalizeAgentOrchestrationLabState,
} from "../lib/agent-orchestration/lab-model";
import {
  agentOrchestrationLabKey,
  agentOrchestrationLabPendingKey,
  isSavedAgentOrchestrationLabReceipt,
  saveAgentOrchestrationLabReceipt,
  saveAgentOrchestrationPendingLabWork,
} from "../lib/agent-orchestration/lab-progress";
import { agentOrchestrationProgressModuleKey } from "../lib/progress-topology";

const SLUG = "workflow-agent-boundary" as const;
const LAB_ID = "pattern-selector" as const;
const EVIDENCE =
  "The simulated decision changed because autonomy crossed the declared boundary; the trace identifies the controlling field, while external outcome quality still requires review.";

function completableState() {
  return normalizeAgentOrchestrationLabState({
    ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
    autonomy: 3,
  });
}

test("a valid lab receipt is exact and may retain explicit completion", () => {
  const completionKey = agentOrchestrationProgressModuleKey(SLUG);
  const receiptKey = agentOrchestrationLabKey(LAB_ID, SLUG);
  const pendingKey = agentOrchestrationLabPendingKey(LAB_ID, SLUG);
  const progress: Record<string, unknown> = {
    [completionKey]: true,
    [pendingKey]: { stale: true },
  };

  assert.equal(
    saveAgentOrchestrationLabReceipt(
      progress,
      SLUG,
      LAB_ID,
      completableState(),
      EVIDENCE,
    ),
    true,
  );
  assert.equal(progress[completionKey], true);
  assert.equal(pendingKey in progress, false);
  assert.equal(
    isSavedAgentOrchestrationLabReceipt(
      progress[receiptKey],
      SLUG,
      LAB_ID,
    ),
    true,
  );

  const receipt = progress[receiptKey] as Record<string, unknown>;
  assert.equal(
    isSavedAgentOrchestrationLabReceipt(
      { ...receipt, unchecked: true },
      SLUG,
      LAB_ID,
    ),
    false,
  );
});

test("invalid and pending lab work clear receipt and explicit completion", () => {
  const completionKey = agentOrchestrationProgressModuleKey(SLUG);
  const receiptKey = agentOrchestrationLabKey(LAB_ID, SLUG);
  const pendingKey = agentOrchestrationLabPendingKey(LAB_ID, SLUG);
  const progress: Record<string, unknown> = {};
  assert.equal(
    saveAgentOrchestrationLabReceipt(
      progress,
      SLUG,
      LAB_ID,
      completableState(),
      EVIDENCE,
    ),
    true,
  );
  progress[completionKey] = true;

  assert.equal(
    saveAgentOrchestrationLabReceipt(
      progress,
      SLUG,
      LAB_ID,
      completableState(),
      "x",
    ),
    false,
  );
  assert.equal(receiptKey in progress, false);
  assert.equal(progress[completionKey], false);

  assert.equal(
    saveAgentOrchestrationLabReceipt(
      progress,
      SLUG,
      LAB_ID,
      completableState(),
      EVIDENCE,
    ),
    true,
  );
  progress[completionKey] = true;
  saveAgentOrchestrationPendingLabWork(
    progress,
    SLUG,
    LAB_ID,
    completableState(),
    "Recoverable draft evidence that has not been explicitly submitted.",
  );
  assert.equal(receiptKey in progress, false);
  assert.equal(progress[completionKey], false);
  assert.equal(typeof progress[pendingKey], "object");
});

test("a mismatched lab pair fails closed on the module's canonical receipt", () => {
  const completionKey = agentOrchestrationProgressModuleKey(SLUG);
  const receiptKey = agentOrchestrationLabKey(LAB_ID, SLUG);
  const progress: Record<string, unknown> = {};
  assert.equal(
    saveAgentOrchestrationLabReceipt(
      progress,
      SLUG,
      LAB_ID,
      completableState(),
      EVIDENCE,
    ),
    true,
  );
  progress[completionKey] = true;

  saveAgentOrchestrationPendingLabWork(
    progress,
    SLUG,
    "graph-contract",
    completableState(),
    EVIDENCE,
  );
  assert.equal(receiptKey in progress, false);
  assert.equal(progress[completionKey], false);
});
