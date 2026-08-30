import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCourseKitCoverageMatrix,
  validateCourseKitCoverage,
} from "../lib/course-kit/coverage";
import {
  materialiseCourseKit,
  resolveCourseKitLocale,
} from "../lib/course-kit/locale";
import {
  COURSE_KIT_EVIDENCE_RECEIPT_ISSUE_CODES,
  COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
  createCourseKitEvidenceReceiptTemplate,
  isCourseKitEvidenceReceipt,
  parseCourseKitEvidenceReceipt,
  validateCourseKitEvidenceReceipt,
} from "../lib/course-kit/evidence-receipt";
import {
  courseKitCapstoneArtifactKey,
  courseKitCapstoneCompleteKey,
  courseKitCapstoneDraftKey,
  courseKitCapstoneVersionKey,
  courseKitCheckpointKey,
  courseKitModuleCompleteKey,
  courseKitModuleReceiptKey,
  courseKitProgressPercent,
  courseKitQuizPassedKey,
  courseKitQuizVersionKey,
  createCourseKitProgressConfig,
} from "../lib/course-kit/progress";
import {
  drawCourseKitQuizQuestions,
  gradeCourseKitQuiz,
} from "../lib/course-kit/quiz";
import { COURSE_KIT_DEFINITIONS } from "../lib/course-kit/registry";
import {
  COURSE_KIT_COURSE_IDS,
  COURSE_KIT_COURSE_NUMBERS,
  type CourseKitOptionIndex,
} from "../lib/course-kit/types";
import { validateCourseKitDefinition } from "../lib/course-kit/validate";
import { evaluateCourseKitFixture } from "../scripts/check-course-kit-release.mjs";

const EXPECTED = [
  ["responsible-ai", 16, 10, 650, 12],
  ["agentic-quant-trading", 17, 12, 780, 14],
] as const;

function validEvidenceReceipt(artifactPath: string): string {
  return JSON.stringify({
    schemaVersion: COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
    artifactPath,
    sha256: "a".repeat(64),
    validator: {
      command: "python3 offline-validator.py --check",
      status: "pass",
      checkedOn: "2026-08-30",
    },
    reviewer: {
      name: "Named Human Reviewer",
      role: "Course evidence reviewer",
      human: true,
      decision: "accept-with-limitations",
    },
    limitations: ["This receipt is structural evidence, not automatic proof."],
  });
}

test("the independent Course Kit registry is exactly the Course 16–17 contract", () => {
  assert.deepEqual([...COURSE_KIT_COURSE_IDS], EXPECTED.map(([id]) => id));
  assert.deepEqual([...COURSE_KIT_COURSE_NUMBERS], EXPECTED.map(([, number]) => number));
  assert.equal(COURSE_KIT_DEFINITIONS.length, 2);

  COURSE_KIT_DEFINITIONS.forEach((definition, index) => {
    const [id, number, modules, minutes, milestones] = EXPECTED[index];
    assert.equal(definition.manifest.id, id);
    assert.equal(definition.manifest.displayNumber, number);
    assert.equal(definition.manifest.modules.length, modules);
    assert.equal(
      definition.manifest.modules.reduce((sum, moduleManifest) => sum + moduleManifest.minutes, 0),
      minutes,
    );
    assert.equal(definition.manifest.milestoneCount, milestones);
    assert.deepEqual(validateCourseKitDefinition(definition), []);
  });
});

test("every published learning outcome has evidence, practice and assessment coverage", () => {
  for (const definition of COURSE_KIT_DEFINITIONS) {
    assert.deepEqual(validateCourseKitCoverage(definition), []);
    const matrix = buildCourseKitCoverageMatrix(definition);
    assert.equal(matrix.length, definition.copy.en.outcomes.length);
    for (const row of matrix) {
      assert.ok(row.sourceIds.length > 0);
      assert.ok(row.checkpointIds.length > 0);
      assert.ok(row.applicationArtifacts.length > 0);
      assert.ok(row.assessmentQuestionIds.length > 0 || row.capstoneArtifactIds.length > 0);
    }
  }
});

test("generated quiz questions conservatively label course-authored synthesis", () => {
  for (const definition of COURSE_KIT_DEFINITIONS) {
    assert.ok(definition.quiz.questions.every(
      (question) => question.evidenceMode === "instructional-synthesis",
    ));
    assert.ok(definition.capstone.artifacts.every(
      (artifact) => artifact.evidenceMode === "instructional-synthesis",
    ));
  }
});

test("seven shell locales fall back to English LTR without pretending to be translations", () => {
  for (const locale of ["es", "fr", "de", "zh-Hant", "ja", "ko", "ar"] as const) {
    const resolution = resolveCourseKitLocale(locale);
    assert.equal(resolution.contentLocale, "en");
    assert.equal(resolution.canonicalLocale, "en");
    assert.equal(resolution.contentDirection, "ltr");
    assert.equal(resolution.isFallback, true);
    assert.equal(resolution.shellDirection, locale === "ar" ? "rtl" : "ltr");
  }
  assert.equal(resolveCourseKitLocale("zh-Hans").isFallback, false);
});

test("structured evidence receipts fail closed and require a named human review", () => {
  const valid = {
    schemaVersion: COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
    artifactPath: "outputs/backtest-evaluation.json",
    sha256: "a".repeat(64),
    validator: {
      command: "python3 fixture-contract-self-test.py --self-test",
      status: "pass",
      checkedOn: "2026-08-26",
    },
    reviewer: {
      name: "Casey Reviewer",
      role: "independent model-risk reviewer",
      human: true,
      decision: "accept-with-limitations",
    },
    limitations: ["Synthetic fixtures do not establish live-market performance."],
  };
  const validJson = JSON.stringify(valid);
  const validResult = validateCourseKitEvidenceReceipt(validJson);
  assert.equal(validResult.valid, true);
  assert.deepEqual(validResult.issues, []);
  assert.deepEqual(validResult.receipt, valid);
  assert.deepEqual(parseCourseKitEvidenceReceipt(validJson), valid);
  assert.equal(isCourseKitEvidenceReceipt(validJson), true);

  const matchingArtifactResult = validateCourseKitEvidenceReceipt(validJson, {
    expectedArtifactPath: "outputs/backtest-evaluation.json",
  });
  assert.equal(matchingArtifactResult.valid, true);
  const mismatchedArtifactResult = validateCourseKitEvidenceReceipt(validJson, {
    expectedArtifactPath: "outputs/risk-gates.json",
  });
  assert.equal(mismatchedArtifactResult.valid, false);
  assert.deepEqual(
    mismatchedArtifactResult.issues.map((issue) => issue.code),
    ["invalid-artifact-path"],
  );

  assert.deepEqual(COURSE_KIT_EVIDENCE_RECEIPT_ISSUE_CODES, [
    "empty",
    "invalid-json",
    "invalid-schema",
    "invalid-artifact-path",
    "invalid-sha256",
    "invalid-validator",
    "invalid-reviewer",
    "invalid-limitations",
  ]);

  const invalidCases = [
    ["empty", "   "],
    ["invalid-json", "not-json"],
    ["invalid-schema", JSON.stringify({ ...valid, schemaVersion: "unknown" })],
    ["invalid-artifact-path", JSON.stringify({
      ...valid,
      artifactPath: "https://example.com/claim.json",
    })],
    ["invalid-sha256", JSON.stringify({ ...valid, sha256: "not-a-sha256" })],
    ["invalid-validator", JSON.stringify({
      ...valid,
      validator: { ...valid.validator, status: "claimed-pass" },
    })],
    ["invalid-reviewer", JSON.stringify({
      ...valid,
      reviewer: { ...valid.reviewer, human: false },
    })],
    ["invalid-limitations", JSON.stringify({ ...valid, limitations: [] })],
  ] as const;

  for (const [expectedCode, input] of invalidCases) {
    const result = validateCourseKitEvidenceReceipt(input);
    assert.equal(result.valid, false);
    assert.equal(result.receipt, null);
    assert.deepEqual(result.issues.map((issue) => issue.code), [expectedCode]);
    assert.equal(parseCourseKitEvidenceReceipt(input), null);
    assert.equal(isCourseKitEvidenceReceipt(input), false);
  }

  const template = createCourseKitEvidenceReceiptTemplate(
    "outputs/course17/module-01.json",
  );
  assert.equal(JSON.parse(template).schemaVersion, COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA);
  assert.equal(JSON.parse(template).artifactPath, "outputs/course17/module-01.json");
  const templateResult = validateCourseKitEvidenceReceipt(template);
  assert.equal(templateResult.valid, false);
  assert.deepEqual(
    templateResult.issues.map((issue) => issue.code),
    [
      "invalid-sha256",
      "invalid-validator",
      "invalid-reviewer",
      "invalid-limitations",
    ],
  );

  const superficiallyCompletedTemplate = JSON.parse(template);
  superficiallyCompletedTemplate.sha256 = "b".repeat(64);
  superficiallyCompletedTemplate.validator.checkedOn = "2026-08-30";
  const unresolvedPlaceholderResult = validateCourseKitEvidenceReceipt(
    JSON.stringify(superficiallyCompletedTemplate),
    { expectedArtifactPath: "outputs/course17/module-01.json" },
  );
  assert.equal(unresolvedPlaceholderResult.valid, false);
  assert.deepEqual(
    unresolvedPlaceholderResult.issues.map((issue) => issue.code),
    ["invalid-validator", "invalid-reviewer", "invalid-limitations"],
  );
});

test("the fixed draw includes every critical question and one wrong critical answer blocks passing", () => {
  for (const definition of COURSE_KIT_DEFINITIONS) {
    const course = materialiseCourseKit(definition, "en");
    const draw = drawCourseKitQuizQuestions(
      course.quiz.questions,
      course.quiz.drawCount,
      `${course.id}:${course.quiz.version}`,
    );
    const criticalIds = course.quiz.questions
      .filter((question) => question.critical)
      .map((question) => question.id);
    assert.ok(criticalIds.every((id) => draw.some((question) => question.id === id)));

    const answers: Record<string, CourseKitOptionIndex> = Object.fromEntries(
      draw.map((question) => [question.id, question.correctIndex]),
    );
    const critical = draw.find((question) => question.critical);
    assert.ok(critical);
    answers[critical.id] = ((critical.correctIndex + 1) % 4) as CourseKitOptionIndex;
    const grade = gradeCourseKitQuiz(draw, answers, course.quiz.passCount);
    assert.equal(grade.score, draw.length - 1);
    assert.equal(grade.allCriticalCorrect, false);
    assert.equal(grade.passed, false);
  }
});

test("progress is versioned and reaches 0, partial and 100 percent deterministically", () => {
  for (const definition of COURSE_KIT_DEFINITIONS) {
    const config = createCourseKitProgressConfig(definition);
    assert.equal(courseKitProgressPercent({}, config), 0);
    const moduleSlug = config.moduleSlugs[0];
    const rawFlag = {
      [config.progressVersionKey]: config.courseVersion,
      [courseKitModuleCompleteKey(config.courseId, moduleSlug)]: true,
    };
    assert.equal(courseKitProgressPercent(rawFlag, config), 0);
    const partial = {
      ...rawFlag,
      [courseKitCheckpointKey(config.courseId, moduleSlug)]: {
        choice: 0,
        correct: true,
      },
      ...(config.moduleReceiptEvidence === "structured-receipt"
        ? {
            [courseKitModuleReceiptKey(config.courseId, moduleSlug)]:
              validEvidenceReceipt(`outputs/${config.courseId}/${moduleSlug}.json`),
          }
        : {}),
    };
    assert.equal(
      courseKitProgressPercent(partial, config),
      Math.round(100 / config.milestoneCount),
    );
    assert.equal(
      courseKitProgressPercent({ ...partial, [config.progressVersionKey]: "old-v0" }, config),
      0,
    );

    const complete: Record<string, unknown> = {
      [config.progressVersionKey]: config.courseVersion,
      [courseKitQuizVersionKey(config.courseId)]: config.quizVersion,
      [courseKitQuizPassedKey(config.courseId)]: true,
      [courseKitCapstoneVersionKey(config.courseId)]: config.capstoneVersion,
      [courseKitCapstoneCompleteKey(config.courseId)]: true,
    };
    for (const slug of config.moduleSlugs) {
      complete[courseKitModuleCompleteKey(config.courseId, slug)] = true;
      complete[courseKitCheckpointKey(config.courseId, slug)] = {
        choice: 0,
        correct: true,
      };
      if (config.moduleReceiptEvidence === "structured-receipt") {
        complete[courseKitModuleReceiptKey(config.courseId, slug)] =
          validEvidenceReceipt(`outputs/${config.courseId}/${slug}.json`);
      }
    }
    for (const artifactId of config.capstoneArtifactIds) {
      complete[courseKitCapstoneArtifactKey(config.courseId, artifactId)] = true;
      complete[courseKitCapstoneDraftKey(config.courseId, artifactId)] =
        config.capstoneArtifactEvidence === "structured-receipt"
          ? validEvidenceReceipt(`outputs/${config.courseId}/${artifactId}.json`)
          : "Reviewed capstone artifact draft.";
    }
    assert.equal(courseKitProgressPercent(complete, config), 100);
  }
});

test("release evaluator fails closed on a Course 17 minute-contract mutation", () => {
  const definition = COURSE_KIT_DEFINITIONS[1];
  const result = evaluateCourseKitFixture({
    definition,
    contract: {
      displayNumber: 17,
      milestoneCount: 14,
      drawCount: 12,
      passCount: 10,
      minutes: [56, 60, 65, 60, 65, 75, 70, 60, 75, 65, 60, 70],
      artifactIds: [
        "mandate-authority", "data-signal-lineage", "agent-experiment-ledger",
        "backtest-evaluation", "claim-debate-audit", "risk-gates",
        "paper-execution-reconciliation", "operations-release",
      ],
    },
  });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((item: { gate: string }) => item.gate === "manifest"));
});
