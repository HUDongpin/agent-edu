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
  COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
  parseCourseKitEvidenceReceipt,
} from "../lib/course-kit/evidence-receipt";
import {
  courseKitCapstoneArtifactKey,
  courseKitCapstoneCompleteKey,
  courseKitCapstoneVersionKey,
  courseKitModuleCompleteKey,
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
  assert.ok(parseCourseKitEvidenceReceipt(JSON.stringify(valid)));
  assert.equal(parseCourseKitEvidenceReceipt("not-json"), null);
  assert.equal(parseCourseKitEvidenceReceipt(JSON.stringify({
    ...valid,
    artifactPath: "https://example.com/claim.json",
  })), null);
  assert.equal(parseCourseKitEvidenceReceipt(JSON.stringify({
    ...valid,
    reviewer: { ...valid.reviewer, human: false },
  })), null);
  assert.equal(parseCourseKitEvidenceReceipt(JSON.stringify({
    ...valid,
    limitations: [],
  })), null);
  assert.equal(parseCourseKitEvidenceReceipt(JSON.stringify({
    ...valid,
    validator: { ...valid.validator, status: "claimed-pass" },
  })), null);
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
    const partial = {
      [config.progressVersionKey]: config.courseVersion,
      [courseKitModuleCompleteKey(config.courseId, config.moduleSlugs[0])]: true,
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
    }
    for (const artifactId of config.capstoneArtifactIds) {
      complete[courseKitCapstoneArtifactKey(config.courseId, artifactId)] = true;
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
