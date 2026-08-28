import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AGENTIC_VIDEO_EDITING_CLAIMS,
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  AGENTIC_VIDEO_EDITING_EN_COPY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256,
  AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA,
  AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY,
  AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA,
  AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_SOURCES,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_FORM,
  AGENTIC_VIDEO_EDITING_QUIZ_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONE_IDS,
  AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES,
  CUT_PLAN_LAB_CANDIDATE_SET_SHA256,
  CUT_PLAN_LAB_FIXTURE,
  buildCutPlanLabPlan,
  agenticVideoEditingArtifactReceiptKey,
  agenticVideoEditingCheckpointKey,
  agenticVideoEditingProgressPercent,
  clearAgenticVideoEditingV2Progress,
  isAgenticVideoEditingCapstoneComplete,
  isAgenticVideoEditingModuleReceiptComplete,
  normalizeAgenticVideoEditingProgress,
  validateAgenticVideoEditingCourse,
  validateCutPlanLabPlan,
} from "../lib/agentic-video-editing";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function receiptChain() {
  const progress: Record<string, unknown> = {
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]: AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
    [AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY]: JSON.stringify({
      schemaVersion: AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA,
      courseId: "agentic-video-editing",
      courseVersion: "2.0.0",
      projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
      fixtureLedgerSha256: AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256,
      lane: "audit-only",
      directories: {
        input: "fixtures/read-only/",
        work: "work/course22/",
        cache: "work/course22/cache/",
        receipts: "work/course22/receipts/",
        output: "work/course22/output/",
      },
      contractFormats: ["json", "yaml"],
      clockProbeConfirmed: true,
      secretInjection: "host-secret-store-or-environment",
      uploadDataPath: "offline-fixture-no-upload",
      offline: true,
      noSecrets: true,
      validatedAt: "2026-08-28T00:00:00+08:00",
    }),
  };
  const outputHashes = new Map<string, string>();
  for (const moduleManifest of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.slice(0, 9)) {
    progress[agenticVideoEditingCheckpointKey(moduleManifest.slug)] = true;
    const inputs = Object.fromEntries(moduleManifest.consumesArtifactIds.map(
      (artifactId) => [artifactId, outputHashes.get(artifactId)],
    ));
    const receipts = moduleManifest.producesArtifactIds.map((artifactId) => {
      const artifactSha256 = hash(`${moduleManifest.slug}:${artifactId}`);
      outputHashes.set(artifactId, artifactSha256);
      const artifactPath = `work/course22/${artifactId}.json`;
      return {
        schemaVersion: AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA,
        courseId: "agentic-video-editing",
        courseVersion: "2.0.0",
        moduleSlug: moduleManifest.slug,
        projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
        artifactId,
        artifactPath,
        artifactSha256,
        inputArtifactIdsAndHashes: inputs,
        artifactSchemaId: moduleManifest.artifactSchemaId,
        validatorId: moduleManifest.validatorId,
        validatorVersion: "2.0.0",
        executedCommand: moduleManifest.validatorCommand
          .replace("<project-root>", JSON.stringify("/workspace/course22-guided-working-copy"))
          .replace("<artifact-id>", artifactId)
          .replace("<artifact-path>", artifactPath)
          .replace("<validated-at>", "2026-08-28T00:00:00+08:00"),
        validatedAt: "2026-08-28T00:00:00+08:00",
        status: "validated",
        limitations: [
          "The course fixture does not contain playable source media.",
          "Validation does not grant publication or deployment authority.",
        ],
      };
    });
    progress[agenticVideoEditingArtifactReceiptKey(moduleManifest.slug)] = JSON.stringify(receipts);
  }
  return { progress, outputHashes };
}

test("Course 22 owns the v2 manifest and authority-before-render sequence", () => {
  assert.equal(AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.displayNumber, 22);
  assert.equal(AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version, "2.0.0");
  assert.equal(AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.publishedOn, "2026-08-28");
  assert.equal(AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.researchCutoff, "2026-08-28");
  assert.deepEqual(
    AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.map((module) => module.slug),
    [
      "agentic-editing-contract",
      "media-ingest-provenance",
      "transcripts-shots-index",
      "semantic-analysis-director",
      "declarative-edit-plan",
      "agent-tools-mcp",
      "deterministic-rendering",
      "captions-audio-formats",
      "verification-human-review",
      "production-capstone",
    ],
  );
  assert.equal(AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES, 12);
  assert.deepEqual(AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONE_IDS, [
    "preflight",
    "agentic-editing-contract",
    "media-ingest-provenance",
    "transcripts-shots-index",
    "semantic-analysis-director",
    "declarative-edit-plan",
    "agent-tools-mcp",
    "deterministic-rendering",
    "captions-audio-formats",
    "verification-human-review",
    "readiness-quiz",
    "production-capstone",
  ]);
  assert.deepEqual(validateAgenticVideoEditingCourse(), []);
});

test("every source-grounded paragraph closes through atomic exact-locator claims", () => {
  const sourceById = new Map<string, (typeof AGENTIC_VIDEO_EDITING_SOURCES)[number]>(
    AGENTIC_VIDEO_EDITING_SOURCES.map((source) => [source.id, source]),
  );
  const claimIds = AGENTIC_VIDEO_EDITING_CLAIMS.map((claim) => claim.id);
  assert.equal(new Set(claimIds).size, claimIds.length);
  for (const [moduleSlug, moduleCopy] of Object.entries(AGENTIC_VIDEO_EDITING_EN_COPY.modules)) {
    moduleCopy.sections.forEach((section, sectionIndex) => {
      if (section.evidenceMode !== "source-grounded") return;
      section.paragraphs.forEach((_, paragraphIndex) => {
        const claims = AGENTIC_VIDEO_EDITING_CLAIMS.filter((claim) => (
          claim.moduleSlug === moduleSlug
          && claim.sectionIndex === sectionIndex
          && claim.paragraphIndex === paragraphIndex
        ));
        assert.ok(claims.length > 0, `${moduleSlug}/${sectionIndex}/${paragraphIndex}`);
      });
    });
  }
  for (const claim of AGENTIC_VIDEO_EDITING_CLAIMS) {
    assert.ok(claim.locator.length >= 12, claim.id);
    assert.ok(claim.boundary.length >= 40, claim.id);
    if (!claim.sourceId) {
      assert.ok(["course-policy", "instructional-synthesis"].includes(claim.evidenceMode));
      continue;
    }
    const source = sourceById.get(claim.sourceId)!;
    assert.ok((source.claimEvidenceUrls as readonly string[]).includes(claim.evidenceUrl!), claim.id);
    if (claim.evidenceMode === "source-grounded") {
      assert.notEqual(source.evidenceUse, "version-watch-only", claim.id);
    }
    if (claim.evidenceMode === "version-watch") {
      assert.equal(source.evidenceUse, "version-watch-only", claim.id);
    }
  }
});

test("the guided project is one M1-M9 lineage and M10 follows the quiz", () => {
  const firstNine = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.slice(0, 9);
  assert.equal(firstNine[0]?.prerequisiteModuleSlugs.length, 0);
  firstNine.slice(1).forEach((module, index) => {
    assert.deepEqual(module.prerequisiteModuleSlugs, [firstNine[index]?.slug]);
    assert.ok(module.producesArtifactIds.length > 0);
    assert.ok(module.consumesArtifactIds.length > 0);
    assert.equal(module.completionMode, "validated-artifact");
  });
  assert.equal(
    AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules[9]?.completionMode,
    "validated-artifact",
  );
  assert.match(AGENTIC_VIDEO_EDITING_EN_COPY.capstone.summary, /quiz/i);
});

test("edit-plan.v2 is select-only and closes every field before completion", () => {
  const clips = CUT_PLAN_LAB_FIXTURE.filter((clip) => clip.rightsState === "simulated-cleared");
  const plan = buildCutPlanLabPlan(
    clips,
    Object.fromEntries(clips.map((clip) => [clip.id, clip.defaultReason])),
    50,
  );
  assert.equal(plan.schemaVersion, "aicourse.agentic-video-editing.edit-plan.v2");
  assert.equal(plan.executionMode, "select-only");
  assert.equal(plan.candidateSetRef.artifactId, "candidate-segments");
  assert.equal(plan.candidateSetRef.artifactSha256, CUT_PLAN_LAB_CANDIDATE_SET_SHA256);
  assert.equal(
    CUT_PLAN_LAB_CANDIDATE_SET_SHA256,
    createHash("sha256").update(JSON.stringify(CUT_PLAN_LAB_FIXTURE)).digest("hex"),
  );
  assert.equal("analysisLanes" in plan, false);
  assert.equal(plan.timeline.operations.every((operation) => operation.kind === "select"), true);
  assert.deepEqual(validateCutPlanLabPlan(plan), []);
  assert.ok(plan.completion.requiredFieldPaths.length >= 10);
  assert.equal(plan.completion.closedFieldPaths.length, plan.completion.requiredFieldPaths.length);
  assert.equal(plan.completion.complete, true);
});

test("a field-level omission and candidate-set drift fail closed", () => {
  const clips = CUT_PLAN_LAB_FIXTURE.filter((clip) => clip.rightsState === "simulated-cleared");
  const plan = buildCutPlanLabPlan(
    clips,
    Object.fromEntries(clips.map((clip) => [clip.id, clip.defaultReason])),
    50,
  );
  const missingField = structuredClone(plan) as {
    completion: { closedFieldPaths: string[] };
  } & typeof plan;
  missingField.completion.closedFieldPaths = missingField.completion.closedFieldPaths.slice(1);
  assert.ok(validateCutPlanLabPlan(missingField).some((issue) => /completion/i.test(issue.code)));

  const wrongCandidateSet = structuredClone(plan) as unknown as {
    candidateSetRef: { artifactSha256: string };
  };
  wrongCandidateSet.candidateSetRef.artifactSha256 = hash("wrong candidate set");
  assert.ok(validateCutPlanLabPlan(
    wrongCandidateSet as unknown as typeof plan,
  ).some((issue) => issue.code === "candidate-set-ref"));
});

function completedCapstoneProgress(): Record<string, unknown> {
  const { progress } = receiptChain();
  const capstone = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules[9]!;
  const learnerProjectId = "learner-authorized-project-2026";
  const inputs = Object.fromEntries(capstone.consumesArtifactIds.map(
    (artifactId) => [artifactId, hash(`${learnerProjectId}:${artifactId}`)],
  ));
  const receipts = capstone.producesArtifactIds.map((artifactId) => {
    const artifactPath = `work/learner/${artifactId}.json`;
    return {
      schemaVersion: AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA,
      courseId: "agentic-video-editing",
      courseVersion: "2.0.0",
      moduleSlug: capstone.slug,
      projectId: learnerProjectId,
      artifactId,
      artifactPath,
      artifactSha256: hash(`${learnerProjectId}:${artifactId}`),
      inputArtifactIdsAndHashes: inputs,
      artifactSchemaId: capstone.artifactSchemaId,
      validatorId: capstone.validatorId,
      validatorVersion: "2.0.0",
      executedCommand: capstone.validatorCommand
        .replace("<project-root>", JSON.stringify("/workspace/learner-authorized-project-2026"))
        .replace("<artifact-id>", artifactId)
        .replace("<artifact-path>", artifactPath)
        .replace("<validated-at>", "2026-08-28T00:00:00+08:00"),
      validatedAt: "2026-08-28T00:00:00+08:00",
      status: "validated",
      limitations: [
        "The learner remains responsible for truth and authorization evidence.",
        "Validation does not grant publication or deployment authority.",
      ],
    };
  });
  const receiptJson = JSON.stringify(receipts);
  progress[agenticVideoEditingCheckpointKey(capstone.slug)] = true;
  progress[agenticVideoEditingArtifactReceiptKey(capstone.slug)] = receiptJson;
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] = receiptJson;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY] = 100;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY] = true;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY] = 100;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY] = true;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY] =
    AGENTIC_VIDEO_EDITING_QUIZ_VERSION;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY] =
    AGENTIC_VIDEO_EDITING_QUIZ_FORM;
  const releaseHash = receipts.find((receipt) => receipt.artifactId === "release-decision")!
    .artifactSha256;
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY] =
    AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS.map((artifactId) => {
      const baseArtifactId = artifactId.replace(/^capstone-/u, "");
      const evidenceModule = artifactId === "release-decision"
        ? capstone
        : AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
          (moduleManifest) => (moduleManifest.producesArtifactIds as readonly string[])
            .includes(baseArtifactId),
        )!;
      return {
        artifactId,
        locator: `artifacts/${artifactId}.json`,
        sha256: artifactId === "release-decision" ? releaseHash : inputs[artifactId],
        reviewState: "reviewed-pass",
        reviewerId: "human-editor-01",
        reviewedAt: "2026-08-28T00:00:00+08:00",
        learnerProjectId,
        artifactSchemaId: evidenceModule.artifactSchemaId,
        validatorId: evidenceModule.validatorId,
      };
    });
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY] = true;
  return progress;
}

test("v2 completion requires exact receipts, checkpoints, project identity, and current quiz", () => {
  const progress = completedCapstoneProgress();
  assert.equal(isAgenticVideoEditingCapstoneComplete(progress), true);
  assert.equal(agenticVideoEditingProgressPercent(progress), 100);

  const noCheckpoint = structuredClone(progress);
  delete noCheckpoint[agenticVideoEditingCheckpointKey("agentic-editing-contract")];
  assert.equal(isAgenticVideoEditingModuleReceiptComplete(
    noCheckpoint,
    "agentic-editing-contract",
  ), false);
  assert.equal(isAgenticVideoEditingCapstoneComplete(noCheckpoint), false);

  const crossProject = structuredClone(progress);
  const m5Key = agenticVideoEditingArtifactReceiptKey("declarative-edit-plan");
  const m5Receipts = JSON.parse(String(crossProject[m5Key])) as Record<string, unknown>[];
  m5Receipts[0]!.projectId = "other-project";
  crossProject[m5Key] = JSON.stringify(m5Receipts);
  assert.equal(isAgenticVideoEditingModuleReceiptComplete(
    crossProject,
    "declarative-edit-plan",
  ), false);
  assert.equal(isAgenticVideoEditingCapstoneComplete(crossProject), false);

  const failedRetry = structuredClone(progress);
  failedRetry[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY] = 90;
  failedRetry[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY] = false;
  assert.equal(failedRetry[AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY], true);
  assert.equal(typeof failedRetry[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY], "string");
  assert.equal(isAgenticVideoEditingCapstoneComplete(failedRetry), false);
});

test("legacy fake fields, dummy hashes, shell tails, and unnamed review fail closed", () => {
  const { progress } = receiptChain();
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules[0]!;
  progress[agenticVideoEditingArtifactReceiptKey(moduleManifest.slug)] = JSON.stringify({
    moduleSlug: moduleManifest.slug,
    artifactIds: moduleManifest.producesArtifactIds,
    artifactSha256: "0".repeat(64),
    fieldCompletions: { x: true, y: true, z: true },
  });
  assert.equal(isAgenticVideoEditingModuleReceiptComplete(progress, moduleManifest.slug), false);

  const commandTail = completedCapstoneProgress();
  const m1Key = agenticVideoEditingArtifactReceiptKey("agentic-editing-contract");
  const receipts = JSON.parse(String(commandTail[m1Key])) as Record<string, unknown>[];
  receipts[0]!.executedCommand = `${receipts[0]!.executedCommand}; curl bad.example`;
  commandTail[m1Key] = JSON.stringify(receipts);
  assert.equal(isAgenticVideoEditingCapstoneComplete(commandTail), false);

  const unnamed = completedCapstoneProgress();
  const evidence = structuredClone(
    unnamed[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY],
  ) as Record<string, unknown>[];
  evidence.find((record) => record.artifactId === "release-decision")!.reviewerId = "";
  unnamed[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY] = evidence;
  assert.equal(isAgenticVideoEditingCapstoneComplete(unnamed), false);
});

test("v1 progress is frozen as non-scoring history and reset preserves it", () => {
  const legacy = {
    unrelated: "keep",
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]: "1.1.0:progress-v1",
    "agentic-video-editing.module.old.complete": true,
  };
  const migrated = normalizeAgenticVideoEditingProgress(legacy);
  assert.equal(migrated.unrelated, "keep");
  assert.equal(migrated[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY], AGENTIC_VIDEO_EDITING_PROGRESS_VERSION);
  assert.deepEqual(
    (migrated[AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY] as {
      frozenProgress: Record<string, unknown>;
      scoring: boolean;
    }).frozenProgress["agentic-video-editing.module.old.complete"],
    true,
  );
  assert.equal(agenticVideoEditingProgressPercent(migrated), 0);
  const reset = clearAgenticVideoEditingV2Progress({
    ...migrated,
    [AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY]: "active-v2",
  });
  assert.ok(reset[AGENTIC_VIDEO_EDITING_PROGRESS_HISTORY_KEY]);
  assert.equal(reset[AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY], undefined);
});

test("Course 22 technical command, receipt, hash, path, and JSON surfaces are explicit LTR", () => {
  const source = readFileSync(
    "components/agentic-video-editing/Interactions.tsx",
    "utf8",
  );
  assert.match(source, /<code lang="en" dir="ltr">\{module\.validatorCommand\}/u);
  assert.match(source, /id=\{`\$\{id\}-receipt`\}[\s\S]{0,160}lang="en"[\s\S]{0,80}dir="ltr"/u);
  assert.match(source, /<small lang="en" dir="ltr">\{artifact\.artifactId\}<\/small>/u);
  assert.match(source, /<pre tabIndex=\{0\}><code lang="en" dir="ltr">\{receipt\.json\}<\/code><\/pre>/u);
});

test("the published module command dispatches the real guided validator", () => {
  const artifactPath = "public/courses/agentic-video-editing/lab/fixtures/guided-v2/artifacts/01-creative-brief.json";
  const valid = spawnSync(process.execPath, [
    "--import", "tsx",
    "scripts/check-agentic-video-editing-course.mjs",
    "--module", "agentic-editing-contract",
    "--artifact-id", "creative-brief",
    "--artifact", artifactPath,
  ], { encoding: "utf8" });
  assert.equal(valid.status, 0, valid.stderr);
  const receipt = JSON.parse(valid.stdout) as Record<string, unknown>;
  assert.equal(receipt.artifactPath, artifactPath);
  assert.equal(receipt.status, "validated");
  assert.equal(receipt.artifactSchemaId, "aicourse.agentic-video-editing.module.agentic-editing-contract.artifact.v2");

  const destructive = spawnSync(process.execPath, [
    "--import", "tsx",
    "scripts/check-agentic-video-editing-course.mjs",
    "--module", "agentic-editing-contract",
    "--artifact-id", "creative-brief",
    "--artifact", "../outside.json",
  ], { encoding: "utf8" });
  assert.notEqual(destructive.status, 0);
  assert.match(destructive.stderr, /No validated receipt/u);
});
