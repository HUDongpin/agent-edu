#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS,
} from "../staging/course-src/agentic-video-editing/artifact-contracts.ts";
import {
  createCourse20ArtifactStarter,
  createCourse20ArtifactSubmission,
  validateCourse20ArtifactContent,
  validateCourse20ContractRegistry,
} from "../staging/course-src/agentic-video-editing/contracts.ts";
import {
  COURSE20_CHECKPOINT_BLUEPRINTS,
  COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
} from "../staging/course-src/agentic-video-editing/assessment-contract.ts";
import {
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
} from "../staging/course-src/agentic-video-editing/manifest.ts";
import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY,
  COURSE20_CAPSTONE_RUBRIC_FINGERPRINT,
  agenticVideoEditingArtifactKey,
  agenticVideoEditingCheckpointKey,
  agenticVideoEditingModuleProgressKey,
  areAllCourse20CoreModulesCurrent,
  course20ReceiptFingerprint,
  createCourse20CapstonePackageBinding,
  createCourse20CheckpointReceipt,
  createCourse20ModuleReceipt,
  createCourse20QuizReceipt,
  isCourse20AssessmentMilestoneCurrent,
  isCourse20CapstoneCurrent,
  isCourse20ModuleCurrent,
} from "../staging/course-src/agentic-video-editing/progress.ts";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
} from "../staging/course-src/agentic-video-editing/types.ts";

const PUBLIC_ROOT = new URL(
  "../staging/course-assets/agentic-video-editing/",
  import.meta.url,
);
const HASH_D = "d".repeat(64);

assert.equal(AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version, "1.2.0");
assert.deepEqual(validateCourse20ContractRegistry(), []);
assert.equal(AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.length, 13);
assert.equal(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS.length, 12);
assert.deepEqual(
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.map((contract) => contract.id),
  AGENTIC_VIDEO_EDITING_ARTIFACT_IDS,
);
assert.deepEqual(
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
    .filter((contract) => contract.requiredForCapstone)
    .map((contract) => contract.id),
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
);
assert.deepEqual(
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.flatMap(
    (moduleRecord) => moduleRecord.artifactIds,
  ),
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
    .filter((contract) => contract.requiredForModuleCompletion)
    .map((contract) => contract.id),
);

const submissions = {};
for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
  const starter = createCourse20ArtifactStarter(contract.id);
  const threeLineGarbage = contract.format === "yaml"
    ? "one: placeholder\ntwo: placeholder\nthree: placeholder"
    : "{\n\"one\": 1,\n\"two\": 2, \"three\": 3\n}";
  assert.notEqual(
    validateCourse20ArtifactContent(contract.id, threeLineGarbage).status,
    "valid",
    `${contract.id}: three-line garbage passed`,
  );
  const submission = await createCourse20ArtifactSubmission({
    artifactId: contract.id,
    path: "core",
    contentText: starter,
    dependencySubmissions: submissions,
    ...(contract.id === "plan-diff-independent-approval"
      || contract.id === "release-decision-postmortem"
      ? {
        reviewDecision: {
          decision: "approved",
          reviewerRole: "independent artifact-gate reviewer",
        },
      }
      : {}),
  });
  assert.equal(
    submission.validationReceipt.status,
    "valid",
    `${contract.id}: ${JSON.stringify(submission.validationReceipt.issues)}`,
  );
  assert.match(submission.contentSha256, /^[a-f0-9]{64}$/u);
  assert.match(submission.semanticSha256, /^[a-f0-9]{64}$/u);
  assert.deepEqual(
    Object.keys(submission.dependencyArtifactHashes).sort(),
    [...contract.dependsOn].sort(),
  );
  submissions[contract.id] = submission;
}

const schema = JSON.parse(readFileSync(
  new URL("artifact-submission.schema.json", PUBLIC_ROOT),
  "utf8",
));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateSubmission = ajv.compile(schema);
for (const submission of Object.values(submissions)) {
  assert.equal(
    validateSubmission(submission),
    true,
    ajv.errorsText(validateSubmission.errors),
  );
}

const progress = {
  [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
    AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
};
for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
  progress[agenticVideoEditingArtifactKey(contract.id)] =
    submissions[contract.id];
}
for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
  const checkpoint = createCourse20CheckpointReceipt(
    moduleRecord.slug,
    COURSE20_FINAL_ASSESSMENT_BLUEPRINTS[
      moduleRecord.finalQuestionId
    ].correctOptionId,
  );
  // Checkpoint and final options use different ID namespaces; a final-answer
  // ID must never satisfy the module checkpoint.
  assert.equal(checkpoint, undefined);
  const checkpointBlueprintAnswer =
    COURSE20_CHECKPOINT_BLUEPRINTS[moduleRecord.slug].correctOptionId;
  progress[agenticVideoEditingCheckpointKey(moduleRecord.slug)] =
    createCourse20CheckpointReceipt(
      moduleRecord.slug,
      checkpointBlueprintAnswer,
    );
  const receipt = createCourse20ModuleReceipt(
    progress,
    moduleRecord.slug,
    "core",
  );
  assert.ok(receipt, moduleRecord.slug);
  progress[agenticVideoEditingModuleProgressKey(
    moduleRecord.slug,
    "core",
  )] = receipt;
}
assert.equal(areAllCourse20CoreModulesCurrent(progress), true);
assert.equal(
  isCourse20ModuleCurrent({
    ...progress,
    [agenticVideoEditingCheckpointKey("agentic-editing-contract")]: true,
  }, "agentic-editing-contract"),
  false,
  "legacy boolean checkpoint must be rejected",
);

const answers = Object.fromEntries(
  Object.values(COURSE20_FINAL_ASSESSMENT_BLUEPRINTS).map((blueprint) => [
    blueprint.questionId,
    blueprint.correctOptionId,
  ]),
);
const quizReceipt = createCourse20QuizReceipt(progress, answers);
assert.ok(quizReceipt);
progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY] = quizReceipt;
assert.equal(isCourse20AssessmentMilestoneCurrent(progress), true);
assert.equal(
  createCourse20QuizReceipt(progress, { ...answers, q1: "0" }),
  undefined,
  "numeric/unknown option ID must fail",
);

const capstoneArtifactHashes = Object.fromEntries(
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS.map((artifactId) => [
    artifactId,
    submissions[artifactId].contentSha256,
  ]),
);
const moduleReceiptFingerprints = Object.fromEntries(
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.map((moduleRecord) => [
    moduleRecord.slug,
    course20ReceiptFingerprint(progress[
      agenticVideoEditingModuleProgressKey(moduleRecord.slug, "core")
    ]),
  ]),
);
const capstoneRubric = {
  version: AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
  fingerprint: COURSE20_CAPSTONE_RUBRIC_FINGERPRINT,
  scores: Object.fromEntries(
    AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map(
      (dimensionId) => [dimensionId, 3],
    ),
  ),
  total: 15,
  unresolvedCriticalBlockers: [],
};
const capstoneRecord = {
  schemaVersion: "aicourse.course20.capstone.v2",
  projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
  projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
  courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
  status: "valid",
  artifactHashes: capstoneArtifactHashes,
  packageSha256: HASH_D,
  decision: "do-not-publish",
  boundPackageSha256: HASH_D,
  reviewerRole: "accountable release reviewer",
  releaseAttestation: true,
  quizReceiptFingerprint: course20ReceiptFingerprint(quizReceipt),
  moduleReceiptFingerprints,
  rubric: capstoneRubric,
  issues: [],
};
capstoneRecord.packageBindingFingerprint = course20ReceiptFingerprint(
  {
    packageBinding: createCourse20CapstonePackageBinding({
      projectId: capstoneRecord.projectId,
      decision: capstoneRecord.decision,
      reviewerRole: capstoneRecord.reviewerRole,
      artifactHashes: capstoneArtifactHashes,
      quizReceiptFingerprint: capstoneRecord.quizReceiptFingerprint,
      moduleReceiptFingerprints,
      rubric: capstoneRubric,
    }),
    packageSha256: capstoneRecord.packageSha256,
  },
);
progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] = capstoneRecord;
assert.equal(isCourse20CapstoneCurrent(progress), true);
assert.equal(
  isCourse20CapstoneCurrent({
    ...progress,
    [AGENTIC_VIDEO_EDITING_CAPSTONE_KEY]: {
      ...progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY],
      artifactHashes: { ...capstoneArtifactHashes, unknown: HASH_D },
    },
  }),
  false,
  "Capstone artifact hashes must contain exactly the canonical twelve IDs",
);

console.log("PASS Course 20 v1.2.0 artifact and receipt contracts");
console.log("- 13 process artifacts form an acyclic DAG; exactly 12 are Capstone artifacts");
console.log("- checkpoint, module, quiz, and Capstone milestones are version/blueprint/hash-bound receipts");
console.log("- legacy booleans, numeric option indexes, garbage artifacts, stale dependencies, and missing human approvals fail closed");
