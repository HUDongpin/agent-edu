import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS,
  getAgenticVideoEditingArtifactContract,
  getAgenticVideoEditingModuleArtifactContracts,
} from "../staging/course-src/agentic-video-editing/artifact-contracts.ts";
import {
  COURSE20_REQUIRED_ADVERSARIAL_TEST_IDS,
  canonicalizeArtifactContent,
  course20ArtifactDependenciesAreCurrent,
  createCourse20ArtifactStarter,
  createCourse20ArtifactSubmission,
  sha256SemanticArtifactContent,
  validateCourse20ArtifactContent,
  validateCourse20ContractRegistry,
} from "../staging/course-src/agentic-video-editing/contracts.ts";
import { AGENTIC_VIDEO_EDITING_EN_COPY } from "../staging/course-src/agentic-video-editing/copy/en.ts";
import { AGENTIC_VIDEO_EDITING_ZH_HANS_COPY } from "../staging/course-src/agentic-video-editing/copy/zh-Hans.ts";
import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "../staging/course-src/agentic-video-editing/manifest.ts";
import { validateAgenticVideoEditingCourse } from "../staging/course-src/agentic-video-editing/validate.ts";
import {
  COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
  scoreCourse20FinalAssessment,
} from "../staging/course-src/agentic-video-editing/assessment-contract.ts";
import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY,
  COURSE20_CAPSTONE_RUBRIC_FINGERPRINT,
  agenticVideoEditingArtifactKey,
  agenticVideoEditingCheckpointKey,
  agenticVideoEditingModuleProgressKey,
  areAllCourse20CoreModulesCurrent,
  areCourse20ArtifactSubmissionsCurrent,
  course20DescendantArtifactIds,
  course20ReceiptFingerprint,
  createCourse20CapstonePackageBinding,
  createCourse20CheckpointReceipt,
  createCourse20ModuleReceipt,
  createCourse20QuizReceipt,
  getCourse20ArtifactSubmissions,
  isCourse20AssessmentMilestoneCurrent,
  isCourse20CapstoneCurrent,
  isCourse20ModuleCurrent,
  markCourse20ArtifactDescendantsStale,
  normalizeAgenticVideoEditingProgress,
} from "../staging/course-src/agentic-video-editing/progress.ts";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
  AGENTIC_VIDEO_EDITING_CRITICAL_CONTROL_IDS,
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
} from "../staging/course-src/agentic-video-editing/types.ts";

const PUBLIC_ROOT = new URL(
  "../staging/course-assets/agentic-video-editing/",
  import.meta.url,
);
const HASH_D = "d".repeat(64);

function refreshCapstoneBinding(record) {
  record.packageBindingFingerprint = course20ReceiptFingerprint(
    {
      packageBinding: createCourse20CapstonePackageBinding({
      projectId: record.projectId,
      decision: record.decision,
      reviewerRole: record.reviewerRole,
      artifactHashes: record.artifactHashes,
      quizReceiptFingerprint: record.quizReceiptFingerprint,
      moduleReceiptFingerprints: record.moduleReceiptFingerprints,
      rubric: record.rubric,
      }),
      packageSha256: record.packageSha256,
    },
  );
}

function loadSchema(name) {
  return JSON.parse(readFileSync(new URL(name, PUBLIC_ROOT), "utf8"));
}

function compileSchema(name) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(loadSchema(name));
  return { ajv, validate };
}

async function buildValidSubmissions(path = "core") {
  const submissions = {};
  for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
    const submission = await createCourse20ArtifactSubmission({
      artifactId: contract.id,
      path,
      contentText: createCourse20ArtifactStarter(contract.id),
      dependencySubmissions: submissions,
      ...(contract.id === "plan-diff-independent-approval"
        ? {
          reviewDecision: {
            decision: "approved",
            reviewerRole: "independent test editor",
          },
        }
        : {}),
    });
    assert.equal(
      submission.validationReceipt.status,
      "valid",
      `${contract.id}: ${JSON.stringify(submission.validationReceipt.issues)}`,
    );
    submissions[contract.id] = submission;
  }
  return submissions;
}

function buildCapstoneRecord(submissions, progress) {
  const artifactHashes = Object.fromEntries(
    AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
      .filter((contract) => contract.requiredForCapstone)
      .map((contract) => [
      contract.id,
      submissions[contract.id].contentSha256,
    ]),
  );
  const moduleReceiptFingerprints = Object.fromEntries(
    AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.map((moduleRecord) => [
      moduleRecord.slug,
      course20ReceiptFingerprint(progress[
        agenticVideoEditingModuleProgressKey(moduleRecord.slug)
      ]),
    ]),
  );
  const quizReceiptFingerprint = course20ReceiptFingerprint(
    progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY],
  );
  const rubric = {
    version: AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_VERSION,
    fingerprint: COURSE20_CAPSTONE_RUBRIC_FINGERPRINT,
    scores: Object.fromEntries(
      AGENTIC_VIDEO_EDITING_CAPSTONE_RUBRIC_DIMENSION_IDS.map(
        (id) => [id, 3],
      ),
    ),
    total: 15,
    unresolvedCriticalBlockers: [],
  };
  const record = {
    schemaVersion: "aicourse.course20.capstone.v2",
    projectSpecId: AGENTIC_VIDEO_EDITING_PROJECT_SPEC_ID,
    projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
    courseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
    status: "valid",
    artifactHashes,
    packageSha256: HASH_D,
    decision: "do-not-publish",
    boundPackageSha256: HASH_D,
    reviewerRole: "accountable release reviewer",
    releaseAttestation: true,
    quizReceiptFingerprint,
    moduleReceiptFingerprints,
    rubric,
    issues: [],
  };
  refreshCapstoneBinding(record);
  return record;
}

async function buildCompleteProgress() {
  const submissions = await buildValidSubmissions();
  const progress = {
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
  for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
    progress[agenticVideoEditingArtifactKey(contract.id)] = submissions[contract.id];
  }
  for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    const checkpoint = createCourse20CheckpointReceipt(
      moduleRecord.slug,
      AGENTIC_VIDEO_EDITING_EN_COPY.modules[
        moduleRecord.slug
      ].checkpoint.correctOptionId,
    );
    assert.ok(checkpoint);
    progress[agenticVideoEditingCheckpointKey(moduleRecord.slug)] = checkpoint;
    const moduleReceipt = createCourse20ModuleReceipt(
      progress,
      moduleRecord.slug,
    );
    assert.ok(moduleReceipt, moduleRecord.slug);
    progress[agenticVideoEditingModuleProgressKey(moduleRecord.slug)] =
      moduleReceipt;
  }
  const answers = Object.fromEntries(
    Object.values(COURSE20_FINAL_ASSESSMENT_BLUEPRINTS).map((blueprint) => [
      blueprint.questionId,
      blueprint.correctOptionId,
    ]),
  );
  const quizReceipt = createCourse20QuizReceipt(progress, answers);
  assert.ok(quizReceipt);
  progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY] = quizReceipt;
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] =
    buildCapstoneRecord(submissions, progress);
  return { progress, submissions };
}

function validationCodes(result) {
  return result.issues.map((issue) => issue.code);
}

test("all public Course 20 schemas compile under strict Draft 2020-12", () => {
  for (const name of [
    "edit-plan.schema.json",
    "edit-plan-v3.schema.json",
    "lab/edit-plan-v3-fixture.schema.json",
    "delivery-contract.schema.json",
    "artifact-submission.schema.json",
  ]) {
    assert.doesNotThrow(() => compileSchema(name), name);
  }
});

test("v1.2.0 registry is a literal acyclic 13-process/12-capstone artifact DAG", () => {
  const expectedIds = [
    "creative-brief-responsibility-map",
    "media-manifest-provenance-quarantine",
    "evidence-index-transcript-shots",
    "candidate-segments-system-card",
    "edit-plan-v3-validation-approval",
    "plan-diff-independent-approval",
    "tool-policy-adversarial-recovery",
    "delivery-matrix-accessibility",
    "render-receipt-output-probe",
    "candidate-media-reference",
    "verification-repair-approval",
    "release-package-runbook-recovery",
    "release-decision-postmortem",
  ];
  const expectedDependencies = {
    "creative-brief-responsibility-map": [],
    "media-manifest-provenance-quarantine": ["creative-brief-responsibility-map"],
    "evidence-index-transcript-shots": ["media-manifest-provenance-quarantine"],
    "candidate-segments-system-card": [
      "creative-brief-responsibility-map",
      "evidence-index-transcript-shots",
    ],
    "edit-plan-v3-validation-approval": [
      "media-manifest-provenance-quarantine",
      "evidence-index-transcript-shots",
      "candidate-segments-system-card",
    ],
    "plan-diff-independent-approval": [
      "edit-plan-v3-validation-approval",
    ],
    "tool-policy-adversarial-recovery": [
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
    ],
    "delivery-matrix-accessibility": [
      "edit-plan-v3-validation-approval",
      "tool-policy-adversarial-recovery",
    ],
    "render-receipt-output-probe": [
      "media-manifest-provenance-quarantine",
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
      "delivery-matrix-accessibility",
      "tool-policy-adversarial-recovery",
    ],
    "candidate-media-reference": [
      "delivery-matrix-accessibility",
      "render-receipt-output-probe",
    ],
    "verification-repair-approval": [
      "media-manifest-provenance-quarantine",
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
      "delivery-matrix-accessibility",
      "render-receipt-output-probe",
      "candidate-media-reference",
    ],
    "release-package-runbook-recovery": [
      "creative-brief-responsibility-map",
      "media-manifest-provenance-quarantine",
      "evidence-index-transcript-shots",
      "candidate-segments-system-card",
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
      "delivery-matrix-accessibility",
      "tool-policy-adversarial-recovery",
      "render-receipt-output-probe",
      "candidate-media-reference",
      "verification-repair-approval",
    ],
    "release-decision-postmortem": [
      "candidate-media-reference",
      "verification-repair-approval",
      "release-package-runbook-recovery",
    ],
  };

  assert.equal(AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version, "1.2.0");
  assert.deepEqual(AGENTIC_VIDEO_EDITING_ARTIFACT_IDS, expectedIds);
  assert.deepEqual(
    AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.map((contract) => contract.id),
    expectedIds,
  );
  assert.deepEqual(validateCourse20ContractRegistry(), []);
  const indexById = new Map(expectedIds.map((id, index) => [id, index]));
  for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
    assert.deepEqual(contract.dependsOn, expectedDependencies[contract.id]);
    assert.ok(contract.dependsOn.every(
      (dependencyId) => indexById.get(dependencyId) < indexById.get(contract.id),
    ));
    assert.equal(
      contract.requiredForModuleCompletion,
      contract.id !== "release-decision-postmortem",
    );
    assert.equal(
      contract.requiredForCapstone,
      contract.id !== "delivery-matrix-accessibility",
    );
  }
  assert.deepEqual(
    AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.flatMap(
      (moduleRecord) => moduleRecord.artifactIds,
    ),
    expectedIds.filter((id) => id !== "release-decision-postmortem"),
  );
  assert.equal(
    getAgenticVideoEditingModuleArtifactContracts("deterministic-rendering").length,
    2,
  );
  assert.equal(
    getAgenticVideoEditingModuleArtifactContracts("production-capstone").length,
    2,
  );
});

test("every JSON, YAML, media reference, and directory manifest starter closes its production contract", async () => {
  const submissions = await buildValidSubmissions();
  const submissionSchema = compileSchema("artifact-submission.schema.json");
  const deliverySchema = compileSchema("delivery-contract.schema.json");
  const productionPlanSchema = compileSchema("edit-plan-v3.schema.json");
  const formats = new Set();

  for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
    formats.add(contract.format);
    const submission = submissions[contract.id];
    assert.equal(submission.receipt.status, "valid", contract.id);
    assert.match(submission.contentSha256, /^[a-f0-9]{64}$/u, contract.id);
    assert.match(submission.semanticSha256, /^[a-f0-9]{64}$/u, contract.id);
    assert.equal(
      course20ArtifactDependenciesAreCurrent(submission, submissions),
      true,
      contract.id,
    );
    assert.equal(
      submissionSchema.validate(submission),
      true,
      `${contract.id}: ${submissionSchema.ajv.errorsText(submissionSchema.validate.errors)}`,
    );
  }

  assert.deepEqual([...formats].sort(), ["directory-manifest", "json", "media", "yaml"]);
  const delivery = canonicalizeArtifactContent(
    createCourse20ArtifactStarter("delivery-matrix-accessibility"),
    "delivery-matrix-accessibility",
  );
  assert.equal(deliverySchema.validate(delivery.parsedContent), true,
    deliverySchema.ajv.errorsText(deliverySchema.validate.errors));

  const editPlanId = "edit-plan-v3-validation-approval";
  const editPlanSubmission = submissions[editPlanId];
  const editPlan = JSON.parse(editPlanSubmission.contentText);
  assert.equal(productionPlanSchema.validate(editPlan), true,
    productionPlanSchema.ajv.errorsText(productionPlanSchema.validate.errors));
  const semanticValidation = validateCourse20ArtifactContent(
    editPlanId,
    editPlanSubmission.contentText,
    {
      dependencySubmissions: submissions,
      reviewDecision: editPlanSubmission.reviewDecision,
    },
  );
  assert.equal(semanticValidation.status, "valid",
    JSON.stringify(semanticValidation.issues));
});

test("three-line garbage and malformed JSON/YAML never count as an artifact", () => {
  for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS) {
    const garbage = contract.format === "yaml"
      ? "one: placeholder\ntwo: placeholder\nthree: placeholder"
      : "{\n  \"one\": 1,\n  \"two\": 2, \"three\": 3\n}";
    const result = validateCourse20ArtifactContent(contract.id, garbage);
    assert.notEqual(result.status, "valid", contract.id);
    assert.ok(
      result.issues.some((issue) => !issue.code.startsWith("dependency.")),
      `${contract.id} was blocked only because dependencies were absent`,
    );
  }

  const badJson = validateCourse20ArtifactContent(
    "creative-brief-responsibility-map",
    "{\"schemaVersion\":",
  );
  assert.ok(validationCodes(badJson).includes("json.parse"));
  const badYaml = validateCourse20ArtifactContent(
    "media-manifest-provenance-quarantine",
    "schemaVersion: [\nprojectId: broken\nassets: {",
  );
  assert.ok(validationCodes(badYaml).includes("yaml.parse"));
  const fakeManifest = validateCourse20ArtifactContent(
    "release-package-runbook-recovery",
    "{\"path\":\"release/\",\"files\":[],\"status\":\"done\"}",
  );
  assert.notEqual(fakeManifest.status, "valid");
  assert.ok(validationCodes(fakeManifest).includes("contract.schema-version"));
});

test("tool policy denies injection, MCP authority lies, egress, confused deputy, cost, and publish escalation", async () => {
  const submissions = await buildValidSubmissions();
  const artifactId = "tool-policy-adversarial-recovery";
  const contract = getAgenticVideoEditingArtifactContract(artifactId);
  const dependencies = Object.fromEntries(
    contract.dependsOn.map((dependencyId) => [dependencyId, submissions[dependencyId]]),
  );
  const starter = JSON.parse(createCourse20ArtifactStarter(artifactId));
  const validate = (value) => validateCourse20ArtifactContent(
    artifactId,
    JSON.stringify(value),
    { dependencySubmissions: dependencies },
  );

  assert.equal(validate(starter).status, "valid");
  assert.deepEqual(
    starter.adversarialTests.map((attack) => attack.id),
    [...COURSE20_REQUIRED_ADVERSARIAL_TEST_IDS],
  );
  for (const attack of starter.adversarialTests) {
    assert.equal(attack.expectedDecision, "deny", attack.id);
    assert.equal(attack.observedDecision, "deny", attack.id);
  }
  for (const requiredId of COURSE20_REQUIRED_ADVERSARIAL_TEST_IDS) {
    const missing = structuredClone(starter);
    missing.adversarialTests = missing.adversarialTests.filter(
      (attack) => attack.id !== requiredId,
    );
    assert.ok(validationCodes(validate(missing)).includes("security.test-missing"), requiredId);
  }

  const mutations = [
    ["MCP annotation lie", "security.test-not-denied", (policy) => {
      policy.adversarialTests.find((attack) => attack.id === "mcp-annotation-lie").observedDecision = "allow";
    }],
    ["egress", "authority.egress", (policy) => {
      policy.network.allowed = true;
      policy.network.egressAllowlist = ["https://attacker.invalid"];
    }],
    ["confused deputy", "authority.confused-deputy", (policy) => {
      policy.identity.delegateMayBroadenAudience = true;
    }],
    ["paid generation", "authority.cost", (policy) => {
      policy.cost.paidGenerationAllowed = true;
      policy.cost.maximumExternalSpendUsd = 1;
    }],
    ["publish escalation", "authority.publish", (policy) => {
      policy.publication.allowed = true;
    }],
    ["indirect prompt injection", "security.indirect-injection", (policy) => {
      policy.untrustedData.mayExpandAuthority = true;
    }],
    ["path traversal", "security.path-escape", (policy) => {
      policy.filesystem.readRoots[0] = "../../secrets";
    }],
    ["symlink following", "security.filesystem", (policy) => {
      policy.filesystem.followSymlinks = true;
    }],
  ];
  for (const [name, expectedCode, mutate] of mutations) {
    const policy = structuredClone(starter);
    mutate(policy);
    assert.ok(validationCodes(validate(policy)).includes(expectedCode), name);
  }

  const mediaManifestId = "media-manifest-provenance-quarantine";
  const mediaManifest = structuredClone(canonicalizeArtifactContent(
    createCourse20ArtifactStarter(mediaManifestId),
    mediaManifestId,
  ).parsedContent);
  mediaManifest.assets[0].symlink = true;
  const symlinkResult = validateCourse20ArtifactContent(
    mediaManifestId,
    JSON.stringify(mediaManifest),
    {
      dependencySubmissions: {
        "creative-brief-responsibility-map":
          submissions["creative-brief-responsibility-map"],
      },
    },
  );
  assert.ok(validationCodes(symlinkResult).includes("security.original-boundary"));
});

test("module, assessment, and capstone milestones require the full current closure", async () => {
  const diagnosticOnly = {
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
    [AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY]: true,
  };
  assert.equal(isCourse20AssessmentMilestoneCurrent(diagnosticOnly), false,
    "an early score is diagnostic, not a final pass milestone");
  assert.equal(isCourse20CapstoneCurrent(diagnosticOnly), false);

  const { progress, submissions } = await buildCompleteProgress();
  assert.equal(areAllCourse20CoreModulesCurrent(progress), true);
  assert.equal(isCourse20AssessmentMilestoneCurrent(progress), true);
  assert.equal(isCourse20CapstoneCurrent(progress), true);
  assert.equal(
    areCourse20ArtifactSubmissionsCurrent(
      progress,
      AGENTIC_VIDEO_EDITING_ARTIFACT_IDS,
    ),
    true,
  );
  for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    assert.equal(isCourse20ModuleCurrent(progress, moduleRecord.slug), true, moduleRecord.slug);
  }

  const missingCheckpoint = structuredClone(progress);
  delete missingCheckpoint[agenticVideoEditingCheckpointKey("agent-tools-mcp")];
  assert.equal(isCourse20ModuleCurrent(missingCheckpoint, "agent-tools-mcp"), false);
  assert.equal(isCourse20AssessmentMilestoneCurrent(missingCheckpoint), false);
  assert.equal(isCourse20CapstoneCurrent(missingCheckpoint), false);

  const unboundPackage = structuredClone(progress);
  unboundPackage[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY].boundPackageSha256 = "e".repeat(64);
  assert.equal(isCourse20CapstoneCurrent(unboundPackage), false);

  const malformedMutations = [
    ["synthetic approve-release", (record) => { record.decision = "approve-release"; }],
    ["unknown decision", (record) => { record.decision = "anything"; }],
    ["wrong project", (record) => { record.projectId = "someone-elses-project"; }],
    ["non-SHA package", (record) => {
      record.packageSha256 = "x";
      record.boundPackageSha256 = "x";
    }],
    ["unbound alternate SHA", (record) => {
      record.packageSha256 = "e".repeat(64);
      record.boundPackageSha256 = "e".repeat(64);
    }],
    ["non-array issues", (record) => { record.issues = {}; }],
    ["extra artifact hash", (record) => { record.artifactHashes.extra = HASH_D; }],
    ["extra module fingerprint", (record) => {
      record.moduleReceiptFingerprints.extra = "deadbeef";
    }],
    ["stale package binding", (record) => {
      record.packageBindingFingerprint = "deadbeef";
    }],
  ];
  for (const [name, mutate] of malformedMutations) {
    const candidate = structuredClone(progress);
    const record = candidate[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY];
    mutate(record);
    if (name !== "stale package binding"
      && name !== "unbound alternate SHA") refreshCapstoneBinding(record);
    assert.equal(isCourse20CapstoneCurrent(candidate), false, name);
  }

  const rubricMutations = [
    ["11/15", (rubric) => {
      rubric.scores = {
        "authority-rights-privacy": 3,
        "evidence-semantic-integrity": 2,
        "plan-tool-execution-traceability": 2,
        "delivery-captions-audio-accessibility": 2,
        "verification-recovery-human-decision": 2,
      };
      rubric.total = 11;
    }],
    ["first dimension below 2", (rubric) => {
      rubric.scores["authority-rights-privacy"] = 1;
      rubric.total = 13;
    }],
    ["missing dimension", (rubric) => {
      delete rubric.scores["verification-recovery-human-decision"];
      rubric.total = 12;
    }],
    ["extra dimension", (rubric) => { rubric.scores.extra = 3; }],
    ["non-integer score", (rubric) => {
      rubric.scores["plan-tool-execution-traceability"] = 2.5;
      rubric.total = 14.5;
    }],
    ["stale rubric blueprint", (rubric) => { rubric.fingerprint = "deadbeef"; }],
    ["unresolved critical blocker", (rubric) => {
      rubric.unresolvedCriticalBlockers = ["rights-unknown"];
    }],
  ];
  for (const [name, mutate] of rubricMutations) {
    const candidate = structuredClone(progress);
    const record = candidate[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY];
    mutate(record.rubric);
    refreshCapstoneBinding(record);
    assert.equal(isCourse20CapstoneCurrent(candidate), false, name);
  }

  const criticalBlockerProgress = structuredClone(progress);
  const decisionArtifact = JSON.parse(
    submissions["release-decision-postmortem"].contentText,
  );
  decisionArtifact.unresolvedCriticalBlockers = ["rights-unknown"];
  const blockerSubmission = await createCourse20ArtifactSubmission({
    artifactId: "release-decision-postmortem",
    path: "core",
    contentText: JSON.stringify(decisionArtifact),
    previous: submissions["release-decision-postmortem"],
    dependencySubmissions: submissions,
    reviewDecision: {
      decision: "approved",
      reviewerRole: "independent blocker reviewer",
    },
  });
  assert.equal(blockerSubmission.validationReceipt.status, "valid");
  criticalBlockerProgress[
    agenticVideoEditingArtifactKey("release-decision-postmortem")
  ] = blockerSubmission;
  const blockerRecord = criticalBlockerProgress[
    AGENTIC_VIDEO_EDITING_CAPSTONE_KEY
  ];
  blockerRecord.artifactHashes["release-decision-postmortem"] =
    blockerSubmission.contentSha256;
  refreshCapstoneBinding(blockerRecord);
  assert.equal(
    isCourse20CapstoneCurrent(criticalBlockerProgress),
    false,
    "an unresolved critical blocker in artifact 12 must keep the Capstone closed",
  );
});

test("semantic hash invalidation is exact: notes preserve descendants, production changes stale only descendants", async () => {
  const { progress, submissions } = await buildCompleteProgress();
  const firstId = "creative-brief-responsibility-map";
  const oldFirst = submissions[firstId];
  const noteOnlyContent = JSON.parse(oldFirst.contentText);
  noteOnlyContent.nonProductionNotes = "A different learner-only display note.";
  const noteOnly = await createCourse20ArtifactSubmission({
    artifactId: firstId,
    path: "core",
    contentText: JSON.stringify(noteOnlyContent),
    previous: oldFirst,
  });
  assert.notEqual(noteOnly.contentSha256, oldFirst.contentSha256);
  assert.equal(noteOnly.semanticSha256, oldFirst.semanticSha256);
  assert.equal(
    await sha256SemanticArtifactContent(noteOnly.contentText, firstId),
    oldFirst.semanticSha256,
  );
  const noteProgress = structuredClone(progress);
  noteProgress[agenticVideoEditingArtifactKey(firstId)] = noteOnly;
  markCourse20ArtifactDescendantsStale(
    noteProgress,
    "core",
    firstId,
    oldFirst.semanticSha256,
    noteOnly.semanticSha256,
  );
  assert.equal(
    noteProgress[agenticVideoEditingModuleProgressKey("agentic-editing-contract")],
    undefined,
    "the edited module must be completed again",
  );
  assert.ok(course20DescendantArtifactIds(firstId).every(
    (artifactId) => noteProgress[agenticVideoEditingArtifactKey(artifactId)]
      .validationReceipt.status === "valid",
  ));
  assert.equal(noteProgress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY].status, "valid");
  assert.equal(isCourse20CapstoneCurrent(noteProgress), false,
    "the exact package binding still needs refresh after content bytes change");

  const editPlanId = "edit-plan-v3-validation-approval";
  const expectedDescendants = [
    "plan-diff-independent-approval",
    "tool-policy-adversarial-recovery",
    "delivery-matrix-accessibility",
    "render-receipt-output-probe",
    "candidate-media-reference",
    "verification-repair-approval",
    "release-package-runbook-recovery",
    "release-decision-postmortem",
  ];
  assert.deepEqual(course20DescendantArtifactIds(editPlanId), expectedDescendants);
  const oldPlan = submissions[editPlanId];
  const changedPlanContent = JSON.parse(oldPlan.contentText);
  changedPlanContent.timeline.durationFrames += 1;
  const changedPlan = await createCourse20ArtifactSubmission({
    artifactId: editPlanId,
    path: "core",
    contentText: JSON.stringify(changedPlanContent),
    previous: oldPlan,
    dependencySubmissions: submissions,
    reviewDecision: {
      decision: "approved",
      reviewerRole: "independent test editor",
    },
  });
  assert.equal(changedPlan.validationReceipt.status, "valid");
  assert.notEqual(changedPlan.semanticSha256, oldPlan.semanticSha256);
  const changedProgress = structuredClone(progress);
  changedProgress[agenticVideoEditingArtifactKey(editPlanId)] = changedPlan;
  markCourse20ArtifactDescendantsStale(
    changedProgress,
    "core",
    editPlanId,
    oldPlan.semanticSha256,
    changedPlan.semanticSha256,
  );
  for (const artifactId of expectedDescendants) {
    assert.equal(
      changedProgress[agenticVideoEditingArtifactKey(artifactId)].validationReceipt.status,
      "stale",
      artifactId,
    );
  }
  for (const artifactId of [
    "creative-brief-responsibility-map",
    "media-manifest-provenance-quarantine",
    "evidence-index-transcript-shots",
    "candidate-segments-system-card",
    editPlanId,
  ]) {
    assert.equal(
      changedProgress[agenticVideoEditingArtifactKey(artifactId)].validationReceipt.status,
      "valid",
      artifactId,
    );
  }
  assert.equal(changedProgress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY].status, "stale");
});

test("v2 migration preserves other courses and carries forward only inert Course 20 drafts", () => {
  const otherCourse = {
    completed: ["module-a"],
    nested: { score: 92 },
  };
  const legacy = {
    "another-course.progress": otherCourse,
    "ui.theme": "dark",
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]: "1.2.0:progress-v1",
    "agentic-video-editing.v1.module.intro.complete": true,
    "agentic-video-editing.v1.quiz.passed": true,
    "agentic-video-editing.v1.capstone": { status: "passed" },
    "agentic-video-editing.v1.artifact": "learner-authored legacy draft",
  };
  const migrated = normalizeAgenticVideoEditingProgress(legacy);

  assert.deepEqual(migrated["another-course.progress"], otherCourse);
  assert.equal(migrated["ui.theme"], "dark");
  assert.equal(
    migrated[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY],
    AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  );
  assert.deepEqual(
    migrated[AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY].drafts,
    {
      "agentic-video-editing.v1.artifact": "learner-authored legacy draft",
    },
  );
  assert.equal("agentic-video-editing.v1.module.intro.complete" in migrated, false);
  assert.equal("agentic-video-editing.v1.quiz.passed" in migrated, false);
  assert.equal("agentic-video-editing.v1.capstone" in migrated, false);
  assert.equal(isCourse20AssessmentMilestoneCurrent(migrated), false);
  assert.equal(isCourse20CapstoneCurrent(migrated), false);
});

test("current progress normalization rejects unknown Course 20 keys without touching other courses", () => {
  const normalized = normalizeAgenticVideoEditingProgress({
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
    [AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY]: 80,
    "agentic-video-editing.unrecognized.imported-key": {
      status: "valid",
      payload: "must not survive exact inventory normalization",
    },
    "another-course.progress": { complete: true },
  });
  assert.equal(
    "agentic-video-editing.unrecognized.imported-key" in normalized,
    false,
  );
  assert.equal(normalized[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY], 80);
  assert.deepEqual(normalized["another-course.progress"], { complete: true });
});

function assessmentParityTuple(question) {
  return {
    id: question.id,
    moduleSlug: question.moduleSlug,
    objectiveId: question.objectiveId,
    sourceIds: [...question.sourceIds],
    optionIds: question.options.map((option) => option.id),
    correctOptionId: question.correctOptionId,
    critical: question.critical,
    criticalControlId: question.criticalControlId ?? null,
  };
}

test("ten-question assessment has one bound answer, all critical controls, and EN/ZH parity", () => {
  const english = AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment;
  const chinese = AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.finalAssessment;
  const expectedQuestionIds = Array.from({ length: 10 }, (_, index) => `q${index + 1}`);

  assert.equal(english.passPercent, 80);
  assert.equal(chinese.passPercent, 80);
  assert.equal(english.questions.length, 10);
  assert.equal(chinese.questions.length, 10);
  assert.deepEqual(english.questions.map((question) => question.id), expectedQuestionIds);
  assert.deepEqual(
    english.questions.map((question) => question.moduleSlug),
    [...AGENTIC_VIDEO_EDITING_MODULE_SLUGS],
  );
  assert.deepEqual(
    english.questions.map(assessmentParityTuple),
    chinese.questions.map(assessmentParityTuple),
  );
  for (const question of english.questions) {
    const optionIds = question.options.map((option) => option.id);
    assert.equal(optionIds.length, 4, question.id);
    assert.equal(new Set(optionIds).size, 4, question.id);
    assert.equal(
      optionIds.filter((optionId) => optionId === question.correctOptionId).length,
      1,
      question.id,
    );
    const moduleRecord = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
      (candidate) => candidate.slug === question.moduleSlug,
    );
    assert.equal(question.objectiveId, moduleRecord.objectiveId, question.id);
    assert.equal(moduleRecord.finalQuestionId, question.id, question.id);
  }
  assert.deepEqual(
    english.questions
      .filter((question) => question.critical)
      .map((question) => question.criticalControlId),
    [...AGENTIC_VIDEO_EDITING_CRITICAL_CONTROL_IDS],
  );
  assert.deepEqual(
    english.questions.filter((question) => question.critical).map((question) => question.id),
    ["q2", "q6", "q7", "q10"],
  );
});

test("reviewed fingerprints reject bilingual label-only swaps for checkpoints and final questions", () => {
  const copies = [
    AGENTIC_VIDEO_EDITING_EN_COPY,
    AGENTIC_VIDEO_EDITING_ZH_HANS_COPY,
  ];
  const finalOriginals = copies.map((copy) => (
    copy.finalAssessment.questions[0].options.map((option) => option.label)
  ));
  const checkpointOriginals = copies.map((copy) => (
    copy.modules["agentic-editing-contract"].checkpoint.options.map(
      (option) => option.label,
    )
  ));
  try {
    for (const copy of copies) {
      const finalOptions = copy.finalAssessment.questions[0].options;
      [finalOptions[0].label, finalOptions[1].label] = [
        finalOptions[1].label,
        finalOptions[0].label,
      ];
      const checkpointOptions =
        copy.modules["agentic-editing-contract"].checkpoint.options;
      [checkpointOptions[0].label, checkpointOptions[1].label] = [
        checkpointOptions[1].label,
        checkpointOptions[0].label,
      ];
    }
    const errors = validateAgenticVideoEditingCourse();
    assert.ok(errors.some((error) => error.includes(
      "checkpoint question, explanation, ordered labels",
    )));
    assert.ok(errors.some((error) => error.includes(
      "question, explanation, ordered labels",
    )));
  } finally {
    copies.forEach((copy, copyIndex) => {
      copy.finalAssessment.questions[0].options.forEach((option, index) => {
        option.label = finalOriginals[copyIndex][index];
      });
      copy.modules["agentic-editing-contract"].checkpoint.options.forEach(
        (option, index) => {
          option.label = checkpointOriginals[copyIndex][index];
        },
      );
    });
  }
  assert.deepEqual(validateAgenticVideoEditingCourse(), []);
});

test("assessment threshold and critical controls use the independent semantic blueprint", () => {
  const questions = AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions;
  const correct = Object.fromEntries(
    Object.values(COURSE20_FINAL_ASSESSMENT_BLUEPRINTS).map((blueprint) => [
      blueprint.questionId,
      blueprint.correctOptionId,
    ]),
  );
  const wrongFor = (questionId) => {
    const blueprint = COURSE20_FINAL_ASSESSMENT_BLUEPRINTS[questionId];
    return blueprint.optionIds.find(
      (optionId) => optionId !== blueprint.correctOptionId,
    );
  };
  const eightOfTen = {
    ...correct,
    q1: wrongFor("q1"),
    q3: wrongFor("q3"),
  };
  assert.deepEqual(scoreCourse20FinalAssessment(questions, eightOfTen), {
    correct: 8,
    score: 80,
    criticalMiss: false,
    passed: true,
  });
  const sevenOfTen = {
    ...eightOfTen,
    q4: wrongFor("q4"),
  };
  assert.deepEqual(scoreCourse20FinalAssessment(questions, sevenOfTen), {
    correct: 7,
    score: 70,
    criticalMiss: false,
    passed: false,
  });
  const nineWithCriticalMiss = {
    ...correct,
    q2: wrongFor("q2"),
  };
  assert.deepEqual(
    scoreCourse20FinalAssessment(questions, nineWithCriticalMiss),
    {
      correct: 9,
      score: 90,
      criticalMiss: true,
      passed: false,
    },
  );
  assert.equal(
    createCourse20CheckpointReceipt("agentic-editing-contract", "0"),
    undefined,
    "numeric/unknown option IDs must not create a checkpoint receipt",
  );
});

test("artifact lookups and saved progress expose exactly the current registry", async () => {
  const { progress } = await buildCompleteProgress();
  const saved = getCourse20ArtifactSubmissions(progress);
  assert.deepEqual(Object.keys(saved), [...AGENTIC_VIDEO_EDITING_ARTIFACT_IDS]);
  for (const moduleSlug of AGENTIC_VIDEO_EDITING_MODULE_SLUGS) {
    const contracts = getAgenticVideoEditingModuleArtifactContracts(moduleSlug);
    assert.ok(contracts.length >= 1, moduleSlug);
    for (const contract of contracts) {
      assert.equal(getAgenticVideoEditingArtifactContract(contract.id), contract);
    }
  }
});
