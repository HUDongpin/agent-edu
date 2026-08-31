import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
} from "../lib/progress-topology";
import {
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_CAPSTONE_KEY,
  AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS,
  saveAgentOrchestrationArtifactDraft,
  saveAgentOrchestrationPendingArtifactDraft,
} from "../lib/agent-orchestration/progress";
import { AGENT_ORCHESTRATION_PRACTICE_TEMPLATES } from "../lib/agent-orchestration/practice-templates";
import {
  AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
  AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION,
} from "../lib/agent-orchestration/lab-model";
import {
  AGENT_ORCHESTRATION_WORKSPACE_SCHEMA,
  applyAgentOrchestrationWorkspacePreview,
  createAgentOrchestrationWorkspace,
  parseAgentOrchestrationWorkspace,
  previewAgentOrchestrationWorkspaceRestore,
  serializeAgentOrchestrationWorkspace,
} from "../lib/agent-orchestration/workspace";

const EXPORTED_AT = "2026-08-30T06:07:08.901Z";
const MODULE_SLUG = "workflow-agent-boundary";
const LAB_ID = "pattern-selector";

function pendingLab(learnerEvidence: string) {
  return {
    schemaVersion: AGENT_ORCHESTRATION_LAB_SCHEMA_VERSION,
    scenarioVersion: AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION,
    moduleSlug: MODULE_SLUG,
    labId: LAB_ID,
    state: { ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE },
    learnerEvidence,
  };
}

function substantiveArtifactDraft(template: string): string {
  const additions = [
    "- Decision evidence: the control owner verified the boundary against the trace baseline.",
    "- Failure policy: the recovery owner records the risk, rollback trigger, and review result.",
    "- Release evaluation: budget, deadline, security approval, and independent verification remain auditable.",
  ];
  let sectionIndex = -1;
  const output: string[] = [];
  for (const line of template.split(/\r?\n/u)) {
    output.push(line);
    if (/^##\s+\S/u.test(line) && sectionIndex < 2) {
      sectionIndex += 1;
      output.push(additions[sectionIndex]);
    }
  }
  return output.join("\n");
}

test("Course 15 workspace exports only owned fields with exact authored values", () => {
  const artifact = "# 审计\r\nKeep  two spaces, café, 🧭, and \\u0000 text.";
  const labEvidence = "Because route β is bounded, preserve\r\nthis exact explanation.  ";
  const record = {
    "another-course.lesson.1": { keep: true },
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
    "agent-orchestration.module.workflow-agent-boundary.artifact.pending-draft": artifact,
    [`agent-orchestration.module.${MODULE_SLUG}.lab.${LAB_ID}.pending`]:
      pendingLab(labEvidence),
    [`agent-orchestration.module.${MODULE_SLUG}.checkpoint.passed`]: true,
  };

  const workspace = createAgentOrchestrationWorkspace(record, EXPORTED_AT);
  assert.equal(workspace.schema, AGENT_ORCHESTRATION_WORKSPACE_SCHEMA);
  assert.equal(workspace.exportedAt, EXPORTED_AT);
  assert.ok(workspace.fields.every(({ key }) => key.startsWith("agent-orchestration.")));
  assert.equal(
    workspace.fields.some(({ key }) => key.endsWith("checkpoint.passed")),
    false,
    "cleanup-only legacy state is omitted rather than blocking a legitimate export",
  );
  assert.equal(
    workspace.fields.find(({ key }) => key.endsWith("artifact.pending-draft"))?.value,
    artifact,
  );
  assert.equal(
    (workspace.fields.find(({ key }) =>
      key.includes(".lab.") && key.endsWith(".pending"),
    )?.value as {
      learnerEvidence: string;
    }).learnerEvidence,
    labEvidence,
  );

  const parsed = parseAgentOrchestrationWorkspace(
    serializeAgentOrchestrationWorkspace(workspace),
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.workspace, workspace);
});

test("workspace parser fails closed on foreign, duplicate, malformed, or stale envelopes", () => {
  const valid = createAgentOrchestrationWorkspace({
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
    [`agent-orchestration.module.${MODULE_SLUG}.artifact.pending-draft`]: "draft",
  }, EXPORTED_AT);
  const cases: unknown[] = [
    { ...valid, schema: "unknown" },
    { ...valid, exportedAt: "yesterday" },
    { ...valid, progressVersion: "future" },
    {
      ...valid,
      fields: [...valid.fields, { key: "another-course.secret", value: true }],
    },
    {
      ...valid,
      fields: [...valid.fields, valid.fields[0]],
    },
    {
      ...valid,
      fields: [
        ...valid.fields,
        {
          key: `agent-orchestration.module.${MODULE_SLUG}.complete`,
          value: true,
        },
      ],
    },
    {
      ...valid,
      fields: [
        ...valid.fields,
        { key: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey, value: 0 },
        { key: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey, value: true },
      ],
    },
    {
      ...valid,
      fields: [
        ...valid.fields,
        {
          key: `agent-orchestration.module.${MODULE_SLUG}.checkpoint`,
          value: {
            checkpointId: "crafted.receipt",
            selectedOptionId: "crafted.correct",
            passed: true,
            contentVersion: 1,
          },
        },
      ],
    },
    {
      ...valid,
      fields: [
        ...valid.fields,
        {
          key: `agent-orchestration.module.${MODULE_SLUG}.artifact.evidence`,
          value: { saved: true, moduleSlug: MODULE_SLUG, starterTemplate: "crafted" },
        },
      ],
    },
    {
      ...valid,
      fields: [
        ...valid.fields,
        {
          key: `agent-orchestration.module.${MODULE_SLUG}.lab.${LAB_ID}`,
          value: { saved: true },
        },
      ],
    },
    [],
    null,
  ];

  for (const candidate of cases) {
    const parsed = parseAgentOrchestrationWorkspace(JSON.stringify(candidate));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.ok(parsed.errors.length > 0);
  }
  assert.equal(parseAgentOrchestrationWorkspace("{broken").ok, false);
});

test("restore preview is add-only and never overwrites local or newly raced authored work", () => {
  const localArtifact = "newer local artifact — preserve exactly";
  const importedArtifact = "older imported artifact";
  const importedLab = {
    state: { autonomy: 5 },
    learnerEvidence: "imported lab evidence\r\nwith exact spacing  ",
  };
  const artifactKey = `agent-orchestration.module.${MODULE_SLUG}.artifact.pending-draft`;
  const labKey = `agent-orchestration.module.${MODULE_SLUG}.lab.${LAB_ID}.pending`;
  const checkpointKey = `agent-orchestration.module.${MODULE_SLUG}.checkpoint`;
  const checkpointContract =
    AGENT_ORCHESTRATION_CHECKPOINT_ANSWER_CONTRACTS[MODULE_SLUG][0];
  const importedCheckpoint = {
    checkpointId: checkpointContract.checkpointId,
    selectedOptionId: checkpointContract.correctOptionId,
    passed: true,
    contentVersion: checkpointContract.contentVersion,
  };
  const workspace = createAgentOrchestrationWorkspace({
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
    [artifactKey]: importedArtifact,
    [labKey]: pendingLab(importedLab.learnerEvidence),
    [checkpointKey]: importedCheckpoint,
  }, EXPORTED_AT);
  const local = {
    "another-course.lesson.keep": true,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
    [artifactKey]: localArtifact,
    [checkpointKey]: importedCheckpoint,
  };

  const preview = previewAgentOrchestrationWorkspaceRestore(local, workspace);
  assert.equal(preview.addCount, 1);
  assert.equal(preview.unchangedCount, 2);
  assert.equal(preview.keepLocalCount, 1);
  assert.equal(
    preview.items.find(({ key }) => key === artifactKey)?.action,
    "keep-local",
  );
  assert.equal(
    preview.items.find(({ key }) => key === checkpointKey)?.action,
    "unchanged",
  );

  const pairedLocalPreview = previewAgentOrchestrationWorkspaceRestore({
    ...local,
    [`agent-orchestration.module.${MODULE_SLUG}.lab.${LAB_ID}`]: {
      saved: true,
      learnerEvidence: "local accepted evidence placeholder",
    },
  }, workspace);
  assert.equal(
    pairedLocalPreview.items.find(({ key }) => key === labKey)?.action,
    "keep-local",
    "an imported pending lab must not coexist with or supersede local accepted work",
  );

  const raced = {
    ...local,
    [labKey]: {
      state: { autonomy: 1 },
      learnerEvidence: "local work arrived after preview",
    },
  };
  const applied = applyAgentOrchestrationWorkspacePreview(raced, preview);
  assert.equal(applied.appliedCount, 0);
  assert.equal(applied.skippedCount, 2);
  assert.equal(applied.record[artifactKey], localArtifact);
  assert.deepEqual(applied.record[labKey], raced[labKey]);
  assert.deepEqual(applied.record[checkpointKey], local[checkpointKey]);
  assert.equal(applied.record["another-course.lesson.keep"], true);

  const cleanTarget = {
    "another-course.lesson.keep": true,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  };
  const cleanPreview = previewAgentOrchestrationWorkspaceRestore(cleanTarget, workspace);
  const cleanApply = applyAgentOrchestrationWorkspacePreview(cleanTarget, cleanPreview);
  assert.equal(cleanApply.appliedCount, 3);
  assert.equal(cleanApply.record[artifactKey], importedArtifact);
  assert.equal(
    (cleanApply.record[labKey] as { learnerEvidence: string }).learnerEvidence,
    importedLab.learnerEvidence,
  );
  assert.equal(cleanApply.record["another-course.lesson.keep"], true);
});

test("restore race never binds imported artifact evidence to newer local bytes", () => {
  const source: Record<string, unknown> = {
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  };
  const template = AGENT_ORCHESTRATION_PRACTICE_TEMPLATES[MODULE_SLUG].en;
  const importedArtifact = substantiveArtifactDraft(template);
  assert.equal(saveAgentOrchestrationArtifactDraft(
    source,
    MODULE_SLUG,
    importedArtifact,
    template,
  ), true);
  const workspace = createAgentOrchestrationWorkspace(source, EXPORTED_AT);
  const emptyTarget = {
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  };
  const preview = previewAgentOrchestrationWorkspaceRestore(emptyTarget, workspace);
  const artifactKey = `agent-orchestration.module.${MODULE_SLUG}.artifact`;
  const evidenceKey = `${artifactKey}.evidence`;
  const newerLocalArtifact = `${importedArtifact}\n- Newer local decision: preserve these exact bytes.`;
  const applied = applyAgentOrchestrationWorkspacePreview({
    ...emptyTarget,
    [artifactKey]: newerLocalArtifact,
  }, preview);

  assert.equal(applied.record[artifactKey], newerLocalArtifact);
  assert.equal(
    applied.record[evidenceKey],
    undefined,
    "dependent evidence must be skipped when its imported artifact lost the race",
  );
});

test("restore keeps an accepted artifact and its newer pending draft as one source transaction", () => {
  const source: Record<string, unknown> = {
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  };
  const template = AGENT_ORCHESTRATION_PRACTICE_TEMPLATES[MODULE_SLUG].en;
  const acceptedArtifact = substantiveArtifactDraft(template);
  const newerPendingDraft = `${acceptedArtifact}\n- Pending learner revision: preserve these newer exact bytes.`;
  const artifactKey = `agent-orchestration.module.${MODULE_SLUG}.artifact`;
  const pendingKey = `${artifactKey}.pending-draft`;

  assert.equal(saveAgentOrchestrationArtifactDraft(
    source,
    MODULE_SLUG,
    acceptedArtifact,
    template,
  ), true);
  saveAgentOrchestrationPendingArtifactDraft(
    source,
    MODULE_SLUG,
    newerPendingDraft,
  );

  const workspace = createAgentOrchestrationWorkspace(source, EXPORTED_AT);
  assert.equal(
    workspace.fields.find(({ key }) => key === artifactKey)?.value,
    acceptedArtifact,
  );
  assert.equal(
    workspace.fields.find(({ key }) => key === pendingKey)?.value,
    newerPendingDraft,
  );

  const emptyTarget = {
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  };
  const preview = previewAgentOrchestrationWorkspaceRestore(emptyTarget, workspace);
  assert.equal(preview.items.find(({ key }) => key === artifactKey)?.action, "add");
  assert.equal(preview.items.find(({ key }) => key === pendingKey)?.action, "add");
  const applied = applyAgentOrchestrationWorkspacePreview(emptyTarget, preview);
  assert.equal(applied.record[artifactKey], acceptedArtifact);
  assert.equal(applied.record[pendingKey], newerPendingDraft);
  assert.equal(
    applied.record[pendingKey] ?? applied.record[artifactKey],
    newerPendingDraft,
    "the pending revision remains the active restorable working draft",
  );

  const racedLocalDraft = "newer local pending work arrived after preview";
  const raced = applyAgentOrchestrationWorkspacePreview({
    ...emptyTarget,
    [pendingKey]: racedLocalDraft,
  }, preview);
  assert.equal(raced.record[pendingKey], racedLocalDraft);
  assert.equal(raced.record[artifactKey], undefined);
});

test("restore race rechecks quiz and capstone dependencies against current local values", () => {
  const importedChecks = Array.from(
    { length: 15 },
    (_, index) => `https://audit.acme.org/imported-evidence-${index + 1}.json`,
  );
  const localChecks = Array.from(
    { length: 15 },
    (_, index) => `https://audit.acme.org/local-evidence-${index + 1}.json`,
  );
  const source = {
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey]: 90,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey]: true,
    [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: importedChecks,
    [AGENT_ORCHESTRATION_CAPSTONE_KEY]: true,
  };
  const workspace = createAgentOrchestrationWorkspace(source, EXPORTED_AT);
  const emptyTarget = {
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  };
  const preview = previewAgentOrchestrationWorkspaceRestore(emptyTarget, workspace);
  const applied = applyAgentOrchestrationWorkspacePreview({
    ...emptyTarget,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey]: 20,
    [AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY]: localChecks,
  }, preview);

  assert.equal(
    applied.record[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey],
    undefined,
  );
  assert.equal(applied.record[AGENT_ORCHESTRATION_CAPSTONE_KEY], undefined);
  assert.deepEqual(
    applied.record[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY],
    localChecks,
  );
});
