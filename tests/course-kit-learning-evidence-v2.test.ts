import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
  COURSE_KIT_MODULE_EVIDENCE_RECEIPT_SCHEMA,
  isCourseKitModuleEvidenceReceipt,
} from "../lib/course-kit/evidence-receipt";
import {
  courseKitArtifactCompletionMarker,
  courseKitCapstoneArtifactKey,
  courseKitCapstoneCompleteKey,
  courseKitCapstoneDraftKey,
  courseKitCapstoneVersionKey,
  courseKitCheckpointKey,
  courseKitModuleCompleteKey,
  courseKitModuleReceiptKey,
  courseKitProgressVersionKey,
  courseKitQuizPassedKey,
  courseKitQuizBestKey,
  courseKitQuizBestPassedKey,
  courseKitQuizCurrentScoreKey,
  courseKitQuizFormKey,
  courseKitQuizVersionKey,
  isCourseKitCapstoneComplete,
  isCourseKitModuleComplete,
  isCourseKitQuizComplete,
} from "../lib/course-kit/progress";
import {
  selectCourseKitQuizForm,
  selectCourseKitQuizFormQuestions,
  validateCourseKitQuizForms,
} from "../lib/course-kit/quiz";
import type {
  CourseKitProgressClientConfig,
  CourseKitThreeQuizForms,
} from "../lib/course-kit/types";
import { formatCourseKitReleaseResult } from "../scripts/check-course-kit-release.mjs";
import {
  readCourseKitProgress,
  recordCourseKitQuizAttempt,
  resetCourseKitProgress,
  setCourseKitQuizForm,
} from "../components/course-kit/progress-store";

const COURSE_ID = "test-course";
const COURSE_VERSION = "2026.08.28-v2";
const HASH_A = "0123456789abcdef".repeat(4);
const HASH_B = "fedcba9876543210".repeat(4);
const HASH_C = "00112233445566778899aabbccddeeff".repeat(2);

const config: CourseKitProgressClientConfig = {
  storageKey: "ae.progress",
  courseId: COURSE_ID,
  courseVersion: COURSE_VERSION,
  progressPrefix: `${COURSE_ID}.`,
  progressVersionKey: courseKitProgressVersionKey(COURSE_ID),
  progressEvent: "ae:course-kit:progress",
  resetEvent: "ae:course-kit:progress-reset",
  milestoneCount: 12,
  moduleSlugs: ["module-one", "module-two"],
  moduleContracts: [
    {
      moduleSlug: "module-one",
      prerequisiteModuleSlugs: [],
      producesArtifactIds: ["artifact-one"],
      consumesArtifactIds: [],
      artifactSchemaId: "aicourse.test-course.module-artifact.v2",
      validatorId: "aicourse.test-course.module.module-one.v2",
      validatorCommand: "python3 validate_module.py --module module-one --artifact <artifact.json>",
      completionMode: "validated-artifact",
      explicitlyDeclared: true,
    },
    {
      moduleSlug: "module-two",
      prerequisiteModuleSlugs: ["module-one"],
      producesArtifactIds: ["artifact-two"],
      consumesArtifactIds: ["artifact-one"],
      artifactSchemaId: "aicourse.test-course.module-artifact.v2",
      validatorId: "aicourse.test-course.module.module-two.v2",
      validatorCommand: "python3 validate_module.py --module module-two --artifact <artifact.json>",
      completionMode: "validated-artifact",
      explicitlyDeclared: true,
    },
  ],
  quizVersion: "2026.08.28-quiz-v2",
  capstoneVersion: "2026.08.28-capstone-v2",
  capstoneArtifactIds: ["capstone-one"],
  evidenceValidatorId: "aicourse.test-course.validator.v1",
  evidenceValidatorCommandPrefix: "python validate.py --package ",
};

function moduleReceipt({
  moduleSlug,
  artifactId,
  hash,
  inputHashes = {},
  validatorId = `aicourse.test-course.module.${moduleSlug}.v2`,
}: {
  readonly moduleSlug: "module-one" | "module-two";
  readonly artifactId: "artifact-one" | "artifact-two";
  readonly hash: string;
  readonly inputHashes?: Readonly<Record<string, string>>;
  readonly validatorId?: string;
}): string {
  return JSON.stringify({
    schemaVersion: COURSE_KIT_MODULE_EVIDENCE_RECEIPT_SCHEMA,
    courseId: COURSE_ID,
    courseVersion: COURSE_VERSION,
    moduleSlug,
    artifactId,
    artifactPath: `artifacts/${artifactId}.json`,
    artifactSha256: hash,
    inputArtifactIdsAndHashes: inputHashes,
    artifactSchemaId: "aicourse.test-course.module-artifact.v2",
    validatorId,
    validatorVersion: "v2",
    executedCommand: `python3 validate_module.py --module ${moduleSlug} --artifact artifacts/${artifactId}.json`,
    validatedAt: "2026-08-28T12:00:00Z",
    status: "pass",
    limitations: ["Local structural validation does not prove authorship."],
  });
}

function completedModules(): Record<string, unknown> {
  return {
    [config.progressVersionKey]: config.courseVersion,
    [courseKitCheckpointKey(COURSE_ID, "module-one")]: { choice: 0, correct: true },
    [courseKitModuleReceiptKey(COURSE_ID, "module-one")]: moduleReceipt({
      moduleSlug: "module-one",
      artifactId: "artifact-one",
      hash: HASH_A,
    }),
    [courseKitModuleCompleteKey(COURSE_ID, "module-one")]:
      courseKitArtifactCompletionMarker("artifact-one", HASH_A),
    [courseKitCheckpointKey(COURSE_ID, "module-two")]: { choice: 0, correct: true },
    [courseKitModuleReceiptKey(COURSE_ID, "module-two")]: moduleReceipt({
      moduleSlug: "module-two",
      artifactId: "artifact-two",
      hash: HASH_B,
      inputHashes: { "artifact-one": HASH_A },
    }),
    [courseKitModuleCompleteKey(COURSE_ID, "module-two")]:
      courseKitArtifactCompletionMarker("artifact-two", HASH_B),
  };
}

test("module receipts reject the audited zero-hash legacy shape and wrong validator", () => {
  const expected = {
    courseId: COURSE_ID,
    courseVersion: COURSE_VERSION,
    moduleSlug: "module-one",
    artifactIds: ["artifact-one"],
    inputArtifactIds: [],
    artifactSchemaId: "aicourse.test-course.module-artifact.v2",
    validatorId: "aicourse.test-course.module.module-one.v2",
    validatorCommand: "python3 validate_module.py --module module-one --artifact <artifact.json>",
  } as const;
  const auditedForgery = JSON.stringify({
    schemaVersion: COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
    kind: "module-artifact",
    courseId: COURSE_ID,
    courseVersion: COURSE_VERSION,
    artifactId: "module-one",
    artifactPath: "artifacts/does-not-exist.json",
    sha256: "0".repeat(64),
    validator: {
      id: "aicourse.test-course.validator.v1",
      command: "python validate.py --package missing.json",
      status: "pass",
      checkedOn: "2026-08-28",
    },
    reviewer: { role: "self", decision: "accept" },
    limitations: ["Not actually checked."],
  });
  assert.equal(isCourseKitModuleEvidenceReceipt(auditedForgery, expected), false);
  assert.equal(
    isCourseKitModuleEvidenceReceipt(moduleReceipt({
      moduleSlug: "module-one",
      artifactId: "artifact-one",
      hash: HASH_A,
      validatorId: "aicourse.test-course.module.wrong.v2",
    }), expected),
    false,
  );
});

test("isolated module Booleans do not count and receipt completion is hash-bound", () => {
  const isolatedBoolean = {
    [config.progressVersionKey]: config.courseVersion,
    [courseKitCheckpointKey(COURSE_ID, "module-one")]: { choice: 0, correct: true },
    [courseKitModuleCompleteKey(COURSE_ID, "module-one")]: true,
  };
  assert.equal(isCourseKitModuleComplete(isolatedBoolean, config, "module-one"), false);

  const valid = completedModules();
  assert.equal(isCourseKitModuleComplete(valid, config, "module-one"), true);
  valid[courseKitModuleReceiptKey(COURSE_ID, "module-two")] = moduleReceipt({
    moduleSlug: "module-two",
    artifactId: "artifact-two",
    hash: HASH_B,
    inputHashes: { "artifact-one": HASH_C },
  });
  assert.equal(isCourseKitModuleComplete(valid, config, "module-two"), false);
  valid[courseKitModuleReceiptKey(COURSE_ID, "module-two")] = moduleReceipt({
    moduleSlug: "module-two",
    artifactId: "artifact-two",
    hash: HASH_B,
    inputHashes: { "artifact-one": HASH_A },
  });
  assert.equal(isCourseKitModuleComplete(valid, config, "module-two"), true);
  valid[courseKitModuleReceiptKey(COURSE_ID, "module-one")] = moduleReceipt({
    moduleSlug: "module-one",
    artifactId: "artifact-one",
    hash: HASH_C,
  });
  assert.equal(isCourseKitModuleComplete(valid, config, "module-one"), false);
  assert.equal(isCourseKitModuleComplete(valid, config, "module-two"), false);
});

test("legacy v1 Booleans remain only as self-attested local study records", () => {
  const legacyConfig: CourseKitProgressClientConfig = {
    ...config,
    courseVersion: "2026.08.26-v1",
    moduleSlugs: ["legacy-module"],
    moduleContracts: [{
      moduleSlug: "legacy-module",
      prerequisiteModuleSlugs: [],
      producesArtifactIds: ["legacy-module"],
      consumesArtifactIds: [],
      artifactSchemaId: "aicourse.legacy.capstone.v1",
      validatorId: "aicourse.legacy.validator.v1",
      validatorCommand: "python validate.py --package <artifact-package.json>",
      completionMode: "self-attested",
      explicitlyDeclared: false,
    }],
  };
  const record = {
    [legacyConfig.progressVersionKey]: legacyConfig.courseVersion,
    [courseKitCheckpointKey(COURSE_ID, "legacy-module")]: { choice: 0, correct: true },
    [courseKitModuleCompleteKey(COURSE_ID, "legacy-module")]: true,
  };
  assert.equal(isCourseKitModuleComplete(record, legacyConfig, "legacy-module"), true);
  const strictConfig: CourseKitProgressClientConfig = {
    ...legacyConfig,
    moduleContracts: [{
      ...legacyConfig.moduleContracts[0],
      completionMode: "validated-artifact",
      explicitlyDeclared: true,
    }],
  };
  assert.equal(isCourseKitModuleComplete(record, strictConfig, "legacy-module"), false);
});

test("capstone Booleans cannot complete before validated modules and current quiz pass", () => {
  const forged = {
    [config.progressVersionKey]: config.courseVersion,
    [courseKitCapstoneVersionKey(COURSE_ID)]: config.capstoneVersion,
    [courseKitCapstoneArtifactKey(COURSE_ID, "capstone-one")]: true,
    [courseKitCapstoneCompleteKey(COURSE_ID)]: true,
  };
  assert.equal(isCourseKitCapstoneComplete(forged, config), false);

  const capstoneReceipt = JSON.stringify({
    schemaVersion: COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
    kind: "capstone-artifact",
    courseId: COURSE_ID,
    courseVersion: COURSE_VERSION,
    artifactId: "capstone-one",
    artifactPath: "artifacts/capstone-one.json",
    sha256: HASH_C,
    validator: {
      id: config.evidenceValidatorId,
      command: `${config.evidenceValidatorCommandPrefix}artifacts/capstone-one.json`,
      status: "pass",
      checkedOn: "2026-08-28",
    },
    reviewer: { role: "independent reviewer", decision: "accept" },
    limitations: ["Browser parsing cannot prove reviewer identity."],
  });
  const ready = {
    ...completedModules(),
    [courseKitQuizVersionKey(COURSE_ID)]: config.quizVersion,
    [courseKitQuizPassedKey(COURSE_ID)]: true,
    [courseKitCapstoneVersionKey(COURSE_ID)]: config.capstoneVersion,
    [courseKitCapstoneDraftKey(COURSE_ID, "capstone-one")]: capstoneReceipt,
    [courseKitCapstoneArtifactKey(COURSE_ID, "capstone-one")]:
      courseKitArtifactCompletionMarker("capstone-one", HASH_C),
    [courseKitCapstoneCompleteKey(COURSE_ID)]: true,
  };
  assert.equal(isCourseKitCapstoneComplete(ready, config), true);
  ready[courseKitQuizPassedKey(COURSE_ID)] = false;
  assert.equal(isCourseKitCapstoneComplete(ready, config), false);
});

test("quiz keeps best evidence separate while the current failed retry re-closes completion", () => {
  resetCourseKitProgress(config);
  recordCourseKitQuizAttempt(config, 16, true);
  recordCourseKitQuizAttempt(config, 7, false);
  const record = readCourseKitProgress();
  assert.equal(record[courseKitQuizBestKey(COURSE_ID)], 16);
  assert.equal(record[courseKitQuizBestPassedKey(COURSE_ID)], true);
  assert.equal(record[courseKitQuizCurrentScoreKey(COURSE_ID)], 7);
  assert.equal(record[courseKitQuizPassedKey(COURSE_ID)], false);
  assert.equal(isCourseKitQuizComplete(record, config), false);
});

test("starting the next explicit quiz form preserves historical best but invalidates current pass", () => {
  resetCourseKitProgress(config);
  recordCourseKitQuizAttempt(config, 16, true, "form-a");
  setCourseKitQuizForm(config, "form-b");
  const record = readCourseKitProgress();
  assert.equal(record[courseKitQuizFormKey(COURSE_ID)], "form-b");
  assert.equal(record[courseKitQuizBestKey(COURSE_ID)], 16);
  assert.equal(record[courseKitQuizBestPassedKey(COURSE_ID)], true);
  assert.equal(record[courseKitQuizCurrentScoreKey(COURSE_ID)], undefined);
  assert.equal(record[courseKitQuizPassedKey(COURSE_ID)], false);
  assert.equal(isCourseKitQuizComplete(record, config), false);
});

test("three 16-question forms cover every module, every critical item, and the full bank", () => {
  const modules = Array.from({ length: 12 }, (_, index) => `module-${index + 1}`);
  const questions = modules.flatMap((moduleSlug, moduleIndex) =>
    ["a", "b", "c"].map((variant) => ({
      id: `q-${moduleIndex + 1}-${variant}`,
      moduleSlug,
      critical: variant === "a" && moduleIndex < 4,
    })),
  );
  const all = (variant: string) => modules.map((_, index) => `q-${index + 1}-${variant}`);
  const critical = ["q-1-a", "q-2-a", "q-3-a", "q-4-a"];
  const forms: CourseKitThreeQuizForms<string> = [
    { id: "form-a", questionIds: [...all("a"), "q-5-b", "q-6-b", "q-7-b", "q-8-b"] },
    { id: "form-b", questionIds: [...all("b"), ...critical] },
    { id: "form-c", questionIds: [...all("c"), ...critical] },
  ];
  assert.deepEqual(validateCourseKitQuizForms(questions, forms, 16, modules), []);
  for (const seed of ["seed-a", "seed-b", "seed-c"]) {
    const selected = selectCourseKitQuizFormQuestions(questions, forms, seed);
    assert.equal(selected.length, 16);
    assert.deepEqual(new Set(selected.map((question) => question.moduleSlug)), new Set(modules));
    assert.ok(critical.every((id) => selected.some((question) => question.id === id)));
  }
  const initial = selectCourseKitQuizForm(forms, "seed-a");
  const next = forms[(forms.findIndex((form) => form.id === initial.id) + 1) % forms.length];
  assert.notEqual(next.id, initial.id);
  assert.equal(selectCourseKitQuizForm(forms, "seed-a", next.id).id, next.id);

  const broken = forms.map((form) => ({
    id: form.id,
    questionIds: [...form.questionIds],
  }));
  broken[1].questionIds = broken[1].questionIds.map((id) =>
    id === "q-12-b" ? "q-11-c" : id
  );
  assert.ok(validateCourseKitQuizForms(questions, broken, 16, modules).some((issue) =>
    issue.includes("omits module module-12")
  ));
});

test("local PASS is never formatted as release PASS", () => {
  const output = formatCourseKitReleaseResult({
    ok: true,
    mode: "local",
    releaseEligible: false,
    skippedGates: ["localization-approval"],
    results: [{
      courseId: "deep-learning",
      ok: true,
      contract: {
        modules: 12,
        minutes: 900,
        questions: 36,
        capstoneArtifacts: 8,
        hashedAssets: 11,
      },
      issues: [],
    }],
  });
  assert.match(output, /course-kit local contract: PASS/);
  assert.match(output, /release: NOT EVALUATED/);
  assert.doesNotMatch(output, /course-kit release: PASS/);
});
