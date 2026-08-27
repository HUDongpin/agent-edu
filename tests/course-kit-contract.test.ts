import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCourseKitCoverageMatrix,
  validateCourseKitCoverage,
} from "../lib/course-kit/coverage";
import {
  COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
  isCourseKitEvidenceReceipt,
} from "../lib/course-kit/evidence-receipt";
import {
  materialiseCourseKit,
  resolveCourseKitLocale,
} from "../lib/course-kit/locale";
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
  ["ai-research", 17, 10, 650, 12],
  ["ai-python-data", 18, 10, 600, 12],
  ["machine-learning", 19, 12, 840, 14],
  ["deep-learning", 20, 12, 900, 14],
  ["production-ai", 21, 12, 900, 14],
] as const;

test("Course Kit registry is exactly the locked Course 16–21 contract", () => {
  assert.deepEqual([...COURSE_KIT_COURSE_IDS], EXPECTED.map(([id]) => id));
  assert.deepEqual([...COURSE_KIT_COURSE_NUMBERS], EXPECTED.map(([, number]) => number));
  assert.equal(COURSE_KIT_DEFINITIONS.length, 6);

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

test("release evaluator fails closed on a minute-contract mutation", () => {
  const definition = COURSE_KIT_DEFINITIONS[2];
  const result = evaluateCourseKitFixture({
    definition,
    contract: {
      displayNumber: 18,
      milestoneCount: 12,
      drawCount: 12,
      passCount: 10,
      minutes: [46, 50, 55, 55, 65, 65, 55, 50, 60, 100],
      artifactCount: 8,
    },
  });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((item: { gate: string }) => item.gate === "manifest"));
});

test("evidence receipts are bound to the exact course, version, artifact and kind", () => {
  const binding = {
    kind: "module-artifact" as const,
    courseId: "ai-python-data",
    courseVersion: "2026.08.26-v1",
    artifactId: "environment-notebooks-seeds-reproducibility",
    validatorId: "aicourse.ai-python-data.validator.v1",
    validatorCommandPrefix: "python public/courses/ai-python-data/lab/validate.py --package ",
  };
  const receipt = JSON.stringify({
    schemaVersion: COURSE_KIT_EVIDENCE_RECEIPT_SCHEMA,
    ...binding,
    artifactPath: "artifacts/environment-receipt.json",
    sha256: "0".repeat(64),
    validator: {
      id: "aicourse.ai-python-data.validator.v1",
      command: "python public/courses/ai-python-data/lab/validate.py --package artifacts/package.json",
      status: "pass",
      checkedOn: "2026-08-26",
    },
    reviewer: { role: "peer reviewer", decision: "accept" },
    limitations: ["Fixture-only evidence; no external certification."],
  });
  assert.equal(isCourseKitEvidenceReceipt(receipt, binding), true);
  assert.equal(
    isCourseKitEvidenceReceipt(receipt, { ...binding, courseId: "machine-learning" }),
    false,
  );
  assert.equal(
    isCourseKitEvidenceReceipt(receipt, { ...binding, courseVersion: "old-v0" }),
    false,
  );
  assert.equal(
    isCourseKitEvidenceReceipt(receipt, { ...binding, artifactId: "wrong-artifact" }),
    false,
  );
  assert.equal(
    isCourseKitEvidenceReceipt(receipt, { ...binding, kind: "capstone-artifact" }),
    false,
  );
});

test("Responsible AI and critical-category contracts fail closed when mappings drift", () => {
  const source = COURSE_KIT_DEFINITIONS.find(
    (definition) => definition.manifest.id === "machine-learning",
  );
  assert.ok(source);
  const firstGateCriterion = source.capstone.responsibleAiGate?.criteria[0];
  assert.ok(firstGateCriterion);
  const brokenGate = structuredClone(source) as unknown as {
    capstone: {
      responsibleAiGate: {
        criteria: Array<{ id: string; questionIds: string[]; artifactIds: string[] }>;
      };
    };
  };
  brokenGate.capstone.responsibleAiGate.criteria[0].artifactIds = ["missing-artifact"];
  assert.ok(
    validateCourseKitDefinition(brokenGate as never).some((issue) =>
      issue.path.includes("responsibleAiGate")
    ),
  );

  const brokenCategory = structuredClone(source) as unknown as {
    quiz: { questions: Array<{ criticalCategory?: string }> };
  };
  for (const question of brokenCategory.quiz.questions) {
    if (question.criticalCategory === "rollback") delete question.criticalCategory;
  }
  assert.ok(
    validateCourseKitDefinition(brokenCategory as never).some((issue) =>
      issue.message.includes("critical rollback")
    ),
  );
});
