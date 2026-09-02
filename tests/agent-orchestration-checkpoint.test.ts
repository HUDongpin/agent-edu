import assert from "node:assert/strict";
import test from "node:test";
import { AGENT_ORCHESTRATION_EN_COPY } from "../lib/agent-orchestration/copy/en";
import { AGENT_ORCHESTRATION_ZH_HANS_COPY } from "../lib/agent-orchestration/copy/zh-Hans";
import {
  AGENT_ORCHESTRATION_CHECKPOINT_CONTENT_VERSION,
  AGENT_ORCHESTRATION_MODULE_SLUGS,
  type AgentOrchestrationCheckpointCopy,
} from "../lib/agent-orchestration/types";
import { AGENT_ORCHESTRATION_COURSE_MANIFEST } from "../lib/agent-orchestration/manifest";
import {
  AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  normalizeAgentOrchestrationLabState,
} from "../lib/agent-orchestration/lab-model";
import {
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
  AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
  agentOrchestrationCheckpointKey,
  agentOrchestrationCheckpointPassedKey,
  agentOrchestrationModuleProgressKey,
  agentOrchestrationModuleRequirements,
  createAgentOrchestrationCheckpointReceipt,
  isAgentOrchestrationCourseModuleComplete,
  isAgentOrchestrationCheckpointReceipt,
  isAgentOrchestrationModuleComplete,
  normalizeAgentOrchestrationProgress,
  readAgentOrchestrationCheckpointReceipt,
  reconcileAgentOrchestrationModuleCompletion,
  saveAgentOrchestrationArtifactDraft,
  saveAgentOrchestrationCheckpointReceipt,
  saveAgentOrchestrationLabReceipt,
} from "../lib/agent-orchestration/progress";

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/u;

function currentProgress(): Record<string, unknown> {
  return {
    [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]:
      AGENT_ORCHESTRATION_PROGRESS_VERSION,
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

test("all native checkpoints use stable semantic identities", () => {
  const allCheckpointIds = new Set<string>();

  for (const slug of AGENT_ORCHESTRATION_MODULE_SLUGS) {
    const english = AGENT_ORCHESTRATION_EN_COPY.modules[slug]
      .checkpoint as AgentOrchestrationCheckpointCopy;
    const chinese = AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[slug]
      .checkpoint as AgentOrchestrationCheckpointCopy;

    for (const [locale, checkpoint] of [
      ["en", english],
      ["zh-Hans", chinese],
    ] as const) {
      assert.match(checkpoint.checkpointId, ID_PATTERN, `${locale}/${slug} checkpointId`);
      assert.equal(
        checkpoint.contentVersion,
        AGENT_ORCHESTRATION_CHECKPOINT_CONTENT_VERSION,
        `${locale}/${slug} contentVersion`,
      );
      assert.equal(checkpoint.options.length, 4, `${locale}/${slug} option count`);
      assert.ok(
        checkpoint.options.every(
          (option) => ID_PATTERN.test(option.id) && option.label.trim().length > 0,
        ),
        `${locale}/${slug} semantic option contract`,
      );
      assert.equal(
        new Set(checkpoint.options.map((option) => option.id)).size,
        checkpoint.options.length,
        `${locale}/${slug} option IDs must be unique`,
      );
      assert.ok(
        checkpoint.options.some((option) => option.id === checkpoint.correctOptionId),
        `${locale}/${slug} correctOptionId must name an option`,
      );
      assert.equal("correctIndex" in checkpoint, false, `${locale}/${slug} has no index answer`);
      assert.equal(allCheckpointIds.has(checkpoint.checkpointId), false, checkpoint.checkpointId);
      allCheckpointIds.add(checkpoint.checkpointId);
    }

    const displayedContentDiffers = String(english.question) !== String(chinese.question)
      || english.options.some(
        (option, index) => option.label !== chinese.options[index]?.label,
      );
    assert.equal(displayedContentDiffers, true, `${slug} native checkpoint content differs`);
    assert.notEqual(
      english.checkpointId,
      chinese.checkpointId,
      `${slug} different native questions must never share completion identity`,
    );
  }

  assert.equal(allCheckpointIds.size, AGENT_ORCHESTRATION_MODULE_SLUGS.length * 2);
});

test("receipt creation derives pass state only from semantic option IDs", () => {
  const checkpoint = AGENT_ORCHESTRATION_EN_COPY.modules["workflow-agent-boundary"].checkpoint;
  const correct = createAgentOrchestrationCheckpointReceipt(
    checkpoint,
    checkpoint.correctOptionId,
  );
  assert.deepEqual(correct, {
    checkpointId: checkpoint.checkpointId,
    selectedOptionId: checkpoint.correctOptionId,
    passed: true,
    contentVersion: checkpoint.contentVersion,
  });

  const wrongOption = checkpoint.options.find(
    (option) => option.id !== checkpoint.correctOptionId,
  )!;
  assert.deepEqual(
    createAgentOrchestrationCheckpointReceipt(checkpoint, wrongOption.id),
    {
      checkpointId: checkpoint.checkpointId,
      selectedOptionId: wrongOption.id,
      passed: false,
      contentVersion: checkpoint.contentVersion,
    },
  );
  assert.equal(
    createAgentOrchestrationCheckpointReceipt(checkpoint, "option-at-index-1"),
    null,
  );

  const correctOption = checkpoint.options.find(
    (option) => option.id === checkpoint.correctOptionId,
  )!;
  const wrongOptions = checkpoint.options.filter(
    (option) => option.id !== checkpoint.correctOptionId,
  );
  const reordered = {
    ...checkpoint,
    options: [
      correctOption,
      wrongOptions[0]!,
      wrongOptions[1]!,
      wrongOptions[2]!,
    ],
  } satisfies AgentOrchestrationCheckpointCopy;
  assert.equal(
    createAgentOrchestrationCheckpointReceipt(
      reordered,
      reordered.options[0].id,
    )?.passed,
    true,
  );
  assert.equal(
    createAgentOrchestrationCheckpointReceipt(
      reordered,
      reordered.options[1].id,
    )?.passed,
    false,
  );
});

test("receipt parsing fails closed on cross-locale, legacy, unknown, forged, and unversioned state", () => {
  const english = AGENT_ORCHESTRATION_EN_COPY.modules["workflow-agent-boundary"].checkpoint;
  const chinese = AGENT_ORCHESTRATION_ZH_HANS_COPY.modules["workflow-agent-boundary"].checkpoint;
  const receipt = createAgentOrchestrationCheckpointReceipt(
    english,
    english.correctOptionId,
  )!;
  const unknownCheckpoint = {
    ...english,
    checkpointId: "ao15.workflow-agent-boundary.en.unregistered-question",
  } satisfies AgentOrchestrationCheckpointCopy;

  assert.equal(isAgentOrchestrationCheckpointReceipt(receipt, english), true);
  assert.equal(isAgentOrchestrationCheckpointReceipt(receipt, chinese), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt(1, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt(true, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt({ selectedOptionId: 1 }, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt({ ...receipt, checkpointId: "unknown.checkpoint" }, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt({ ...receipt, selectedOptionId: "unknown.option" }, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt({ ...receipt, contentVersion: 0 }, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt({ ...receipt, contentVersion: 2 }, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt({ ...receipt, passed: false }, english), false);
  assert.equal(isAgentOrchestrationCheckpointReceipt({ ...receipt, extra: true }, english), false);
  assert.equal(createAgentOrchestrationCheckpointReceipt(
    unknownCheckpoint,
    unknownCheckpoint.correctOptionId,
  ), null);
  assert.equal(isAgentOrchestrationCheckpointReceipt(
    { ...receipt, checkpointId: unknownCheckpoint.checkpointId },
    unknownCheckpoint,
  ), false);
});

test("one semantic receipt replaces split numeric state and current identity gates completion", () => {
  const slug = "workflow-agent-boundary";
  const english = AGENT_ORCHESTRATION_EN_COPY.modules[slug].checkpoint;
  const chinese = AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[slug].checkpoint;
  const receiptKey = agentOrchestrationCheckpointKey(slug);
  const legacyPassedKey = agentOrchestrationCheckpointPassedKey(slug);
  const completionKey = agentOrchestrationModuleProgressKey(slug);
  const progress = {
    ...currentProgress(),
    [receiptKey]: 1,
    [legacyPassedKey]: true,
    [completionKey]: true,
  };

  assert.equal(readAgentOrchestrationCheckpointReceipt(progress, slug, english), null);
  assert.equal(agentOrchestrationModuleRequirements(progress, slug, english).checkpoint, false);

  const saved = saveAgentOrchestrationCheckpointReceipt(
    progress,
    slug,
    english,
    english.correctOptionId,
  );
  assert.equal(saved?.passed, true);
  assert.deepEqual(progress[receiptKey], saved);
  assert.equal(legacyPassedKey in progress, false);
  assert.equal(agentOrchestrationModuleRequirements(progress, slug, english).checkpoint, true);
  assert.equal(agentOrchestrationModuleRequirements(progress, slug, chinese).checkpoint, false);

  reconcileAgentOrchestrationModuleCompletion(progress, slug, chinese);
  assert.equal(progress[completionKey], false);
});

test("v4 numeric checkpoint state is invalidated rather than guessed during migration", () => {
  const slug = "workflow-agent-boundary";
  const receiptKey = agentOrchestrationCheckpointKey(slug);
  const legacyPassedKey = agentOrchestrationCheckpointPassedKey(slug);
  const completionKey = agentOrchestrationModuleProgressKey(slug);
  const migrated = normalizeAgentOrchestrationProgress({
    unrelatedCourseState: "preserve-me",
    [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]: "1.1.1:progress-v4",
    [receiptKey]: 1,
    [legacyPassedKey]: true,
    [completionKey]: true,
  });

  assert.equal(migrated.unrelatedCourseState, "preserve-me");
  assert.equal(migrated[AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY], AGENT_ORCHESTRATION_PROGRESS_VERSION);
  assert.equal(receiptKey in migrated, false);
  assert.equal(legacyPassedKey in migrated, false);
  assert.equal(completionKey in migrated, false);
});

test("an unknown selection deletes stale checkpoint evidence and completion", () => {
  const slug = "workflow-agent-boundary";
  const checkpoint = AGENT_ORCHESTRATION_EN_COPY.modules[slug].checkpoint;
  const receiptKey = agentOrchestrationCheckpointKey(slug);
  const completionKey = agentOrchestrationModuleProgressKey(slug);
  const progress = currentProgress();
  progress[receiptKey] = createAgentOrchestrationCheckpointReceipt(
    checkpoint,
    checkpoint.correctOptionId,
  );
  progress[completionKey] = true;

  assert.equal(
    saveAgentOrchestrationCheckpointReceipt(
      progress,
      slug,
      checkpoint,
      "unknown.option",
    ),
    null,
  );
  assert.equal(receiptKey in progress, false);
  assert.equal(progress[completionKey], false);
});

test("the locale-neutral course adapter accepts only pinned semantic answers", () => {
  const slug = "workflow-agent-boundary";
  const courseModule = AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  )!;
  const checkpoint = AGENT_ORCHESTRATION_EN_COPY.modules[slug].checkpoint;
  const template = AGENT_ORCHESTRATION_EN_COPY.modules[slug].practice.template;
  const progress = currentProgress();

  assert.equal(
    saveAgentOrchestrationArtifactDraft(
      progress,
      slug,
      substantiveArtifactDraft(template),
      template,
    ),
    true,
  );
  assert.equal(
    saveAgentOrchestrationLabReceipt(
      progress,
      slug,
      courseModule.labId,
      normalizeAgentOrchestrationLabState({
        ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
        autonomy: 3,
      }),
      "The simulated decision changed because the active control now enforces a declared boundary; the trace and review record identify the remaining limitation.",
    ),
    true,
  );
  saveAgentOrchestrationCheckpointReceipt(
    progress,
    slug,
    checkpoint,
    checkpoint.correctOptionId,
  );
  progress[agentOrchestrationModuleProgressKey(slug)] = true;

  assert.equal(isAgentOrchestrationCourseModuleComplete(progress, slug), true);
  assert.equal(isAgentOrchestrationModuleComplete(progress, slug, checkpoint), true);

  const receiptKey = agentOrchestrationCheckpointKey(slug);
  const receipt = progress[receiptKey] as Record<string, unknown>;
  progress[receiptKey] = { ...receipt, checkpointId: "unknown.checkpoint" };
  assert.equal(isAgentOrchestrationCourseModuleComplete(progress, slug), false);

  progress[receiptKey] = { ...receipt, selectedOptionId: "unknown.option" };
  assert.equal(isAgentOrchestrationCourseModuleComplete(progress, slug), false);

  progress[receiptKey] = { ...receipt, contentVersion: 2 };
  assert.equal(isAgentOrchestrationCourseModuleComplete(progress, slug), false);

  progress[receiptKey] = {
    ...receipt,
    selectedOptionId: checkpoint.options.find(
      (option) => option.id !== checkpoint.correctOptionId,
    )!.id,
    passed: true,
  };
  assert.equal(isAgentOrchestrationCourseModuleComplete(progress, slug), false);
});
