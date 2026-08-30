import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  MATH_ANIMATION_CAPSTONE_ARTIFACT_COUNT,
  MATH_ANIMATION_CAPSTONE_CHECKS_KEY,
  MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY,
  MATH_ANIMATION_CAPSTONE_KEY,
  MATH_ANIMATION_CODE_EXAMPLES,
  MATH_ANIMATION_COURSE_MANIFEST,
  MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH,
  MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH,
  MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH,
  MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH,
  MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH,
  MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH,
  MATH_ANIMATION_MODULE_SLUGS,
  MATH_ANIMATION_PROGRESS_VERSION,
  MATH_ANIMATION_PROGRESS_VERSION_KEY,
  MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY,
  MATH_ANIMATION_QUIZ_BEST_KEY,
  MATH_ANIMATION_QUIZ_PASSED_KEY,
  MATH_ANIMATION_QUIZ_PASS_PERCENT,
  MATH_ANIMATION_REPOSITORIES,
  MATH_ANIMATION_SOURCES,
  MATH_ANIMATION_TOTAL_MINUTES,
  loadMathAnimationCourse,
  mathAnimationModuleArtifactEvidenceKey,
  mathAnimationModuleCheckpointKey,
  mathAnimationModuleProgressKey,
  mathAnimationModuleVerificationEvidenceKey,
  normalizeMathAnimationProgress,
  reconcileMathAnimationCapstone,
  reconcileMathAnimationModuleCompletion,
  validateMathAnimationCourse,
} from "../lib/math-animation";
import type { MathAnimationSourceRecord } from "../lib/math-animation";
import {
  checkMathAnimationCourse,
  validateMathPosterSvg,
} from "../scripts/check-math-animation-course.mjs";

test("Course 19 has twelve bilingual modules and a bounded assessment/capstone contract", async () => {
  assert.deepEqual(validateMathAnimationCourse(), []);
  assert.equal(MATH_ANIMATION_COURSE_MANIFEST.id, "math-animation");
  assert.equal(MATH_ANIMATION_COURSE_MANIFEST.displayNumber, 19);
  assert.equal(MATH_ANIMATION_COURSE_MANIFEST.version, "1.0.0");
  assert.equal(MATH_ANIMATION_COURSE_MANIFEST.phases.length, 4);
  assert.equal(MATH_ANIMATION_COURSE_MANIFEST.modules.length, 12);
  assert.equal(MATH_ANIMATION_TOTAL_MINUTES, 805);
  assert.deepEqual(
    MATH_ANIMATION_COURSE_MANIFEST.modules.map((courseModuleRecord) => courseModuleRecord.slug),
    [...MATH_ANIMATION_MODULE_SLUGS],
  );

  const [english, chinese] = await Promise.all([
    loadMathAnimationCourse("en"),
    loadMathAnimationCourse("zh-Hans"),
  ]);
  for (const course of [english, chinese]) {
    assert.equal(course.modules.length, 12);
    assert.equal(course.copy.assessment.length, 8);
    assert.equal(course.copy.capstone.artifacts.length, 6);
    for (const courseModuleRecord of course.modules) {
      assert.deepEqual(
        courseModuleRecord.copy.sections.map((section) => section.evidenceMode),
        ["source-grounded", "engineering-synthesis", "version-watch"],
        `${course.contentLocale}/${courseModuleRecord.slug}`,
      );
    }
  }
  assert.deepEqual(
    english.copy.assessment.map((question) => [question.id, question.correctIndex]),
    chinese.copy.assessment.map((question) => [question.id, question.correctIndex]),
  );
  const checkpointPositions = [2, 0, 3, 1, 3, 2, 0, 1, 2, 3, 1, 0];
  const assessmentPositions = [1, 3, 2, 0, 3, 0, 1, 2];
  for (const course of [english, chinese]) {
    assert.deepEqual(
      course.modules.map((courseModuleRecord) => courseModuleRecord.copy.checkpoint.correctIndex),
      checkpointPositions,
      `${course.contentLocale} checkpoint answer positions`,
    );
    assert.deepEqual(
      course.copy.assessment.map((question) => question.correctIndex),
      assessmentPositions,
      `${course.contentLocale} assessment answer positions`,
    );
  }
  assert.deepEqual(
    checkpointPositions.map((position) => checkpointPositions.filter((value) => value === position).length),
    Array(checkpointPositions.length).fill(3),
  );
  assert.deepEqual(
    assessmentPositions.map((position) => assessmentPositions.filter((value) => value === position).length),
    Array(assessmentPositions.length).fill(2),
  );
});

test("source ledger and repository scores keep GitHub technical and X evidentially bounded", () => {
  assert.equal(MATH_ANIMATION_SOURCES.length, 23);
  assert.equal(MATH_ANIMATION_REPOSITORIES.length, 9);
  const sourceById = new Map<string, MathAnimationSourceRecord>(
    MATH_ANIMATION_SOURCES.map(
      (source): [string, MathAnimationSourceRecord] => [source.id, source],
    ),
  );
  const videosGuidance = sourceById.get("github-3b1b-videos-claude");
  const videosLicenseUrl = "https://github.com/3b1b/videos/blob/674b966fbb6cf0307590d27744d186165e8b6a76/LICENSE.txt";
  assert.equal(videosGuidance?.licenseUrl, videosLicenseUrl);
  assert.ok(videosGuidance?.claimEvidenceUrls.includes(videosLicenseUrl));
  assert.match(videosGuidance?.licenseOrRights ?? "", /CC BY-NC-SA 4\.0/);
  assert.doesNotMatch(videosGuidance?.licenseOrRights ?? "", /no repository-wide license/i);
  const xPosts = MATH_ANIMATION_SOURCES.filter((source) => source.kind === "x-post");
  assert.equal(xPosts.length, 5);
  assert.ok(xPosts.every((source) => /^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(source.url)));
  assert.ok(xPosts.every((source) => source.role === "discovery-signal"));
  assert.ok(xPosts.every((source) => /(?:does not|not |cannot|不能|不证明|不是)/i.test(
    `${source.boundary} ${source.boundaryZhHans}`,
  )));
  assert.ok(MATH_ANIMATION_SOURCES.every((source) => (
    source.licenseOrRightsZhHans.length >= 12
    && String(source.licenseOrRightsZhHans) !== String(source.licenseOrRights)
  )));

  for (const repository of MATH_ANIMATION_REPOSITORIES) {
    const source = sourceById.get(repository.sourceId);
    assert.equal(source?.kind, "github-repository", repository.sourceId);
    assert.match(repository.testedRevision, /^[0-9a-f]{40}$/);
    assert.ok(source?.versionOrRevision.includes(repository.testedRevision));
    assert.equal(
      repository.score,
      Object.values(repository.breakdown).reduce<number>((sum, score) => sum + score, 0),
      repository.sourceId,
    );
    assert.notEqual(repository.bestForZhHans, repository.bestFor);
    assert.notEqual(repository.primaryLimitZhHans, repository.primaryLimit);
    assert.notEqual(repository.smokeEvidenceZhHans, repository.smokeEvidence);
  }
});

test("each module has a strict two-evidence gate plus a passed checkpoint", () => {
  const slug = MATH_ANIMATION_MODULE_SLUGS[0];
  const record: Record<string, unknown> = {
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    "codex.lesson.keep": true,
  };
  const artifactKey = mathAnimationModuleArtifactEvidenceKey(slug);
  const verificationKey = mathAnimationModuleVerificationEvidenceKey(slug);
  const checkpointKey = mathAnimationModuleCheckpointKey(slug);
  const completionKey = mathAnimationModuleProgressKey(slug);

  record[checkpointKey] = true;
  assert.equal(reconcileMathAnimationModuleCompletion(record, slug), false);
  assert.equal(record[completionKey], undefined);

  record[artifactKey] = "artifact.log".padEnd(MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH, "x");
  assert.equal(reconcileMathAnimationModuleCompletion(record, slug), false);
  assert.equal(record[completionKey], undefined);

  record[verificationKey] = "render and invariant receipt".padEnd(
    MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH,
    "x",
  );
  assert.equal(reconcileMathAnimationModuleCompletion(record, slug), true);
  assert.equal(record[completionKey], true);
  assert.equal(record["codex.lesson.keep"], true);

  const interactions = readFileSync(
    fileURLToPath(new URL("../components/math-animation/Interactions.tsx", import.meta.url)),
    "utf8",
  );
  const evidenceGateSource = interactions.slice(
    interactions.indexOf("export function ModuleEvidenceGate"),
    interactions.indexOf("export function CourseProgress"),
  );
  assert.equal([...evidenceGateSource.matchAll(/<textarea\b/g)].length, 2);
  assert.match(evidenceGateSource, /mathAnimationModuleArtifactEvidenceKey/);
  assert.match(evidenceGateSource, /mathAnimationModuleVerificationEvidenceKey/);
});

test("partial evidence drafts survive normalization exactly within explicit limits", () => {
  const slug = MATH_ANIMATION_MODULE_SLUGS[0];
  const artifactKey = mathAnimationModuleArtifactEvidenceKey(slug);
  const verificationKey = mathAnimationModuleVerificationEvidenceKey(slug);
  const completionKey = mathAnimationModuleProgressKey(slug);
  const artifactDraft = "  draft/path\n";
  const verificationDraft = "command pending";
  const capstoneDraft = "independent review still in progress";

  const normalized = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    [artifactKey]: artifactDraft,
    [verificationKey]: verificationDraft,
    [MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY]: capstoneDraft,
    [completionKey]: true,
  });

  assert.equal(normalized[artifactKey], artifactDraft);
  assert.equal(normalized[verificationKey], verificationDraft);
  assert.equal(normalized[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY], capstoneDraft);
  assert.equal(normalized[completionKey], undefined);

  const bounded = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    [artifactKey]: "a".repeat(MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH + 25),
    [verificationKey]: "v".repeat(MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH + 25),
    [MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY]: "c".repeat(
      MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH + 25,
    ),
  });

  assert.equal(
    (bounded[artifactKey] as string).length,
    MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH,
  );
  assert.equal(
    (bounded[verificationKey] as string).length,
    MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH,
  );
  assert.equal(
    (bounded[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] as string).length,
    MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH,
  );
});

test("the assessment is an 80 percent gate and cannot trust a forged pass flag", async () => {
  const course = await loadMathAnimationCourse("en");
  assert.equal(MATH_ANIMATION_QUIZ_PASS_PERCENT, 80);
  assert.equal(course.copy.assessment.length, 8);
  const scoreForSix = Math.round((6 / course.copy.assessment.length) * 100);
  const scoreForSeven = Math.round((7 / course.copy.assessment.length) * 100);
  assert.equal(scoreForSix, 75);
  assert.equal(scoreForSeven, 88);
  assert.ok(scoreForSix < MATH_ANIMATION_QUIZ_PASS_PERCENT);
  assert.ok(scoreForSeven >= MATH_ANIMATION_QUIZ_PASS_PERCENT);

  const forged = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    [MATH_ANIMATION_QUIZ_BEST_KEY]: 79,
    [MATH_ANIMATION_QUIZ_PASSED_KEY]: true,
  });
  assert.equal(forged[MATH_ANIMATION_QUIZ_BEST_KEY], 79);
  assert.equal(forged[MATH_ANIMATION_QUIZ_PASSED_KEY], undefined);

  const passing = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    [MATH_ANIMATION_QUIZ_BEST_KEY]: 80,
  });
  assert.equal(passing[MATH_ANIMATION_QUIZ_PASSED_KEY], true);
});

test("capstone completion requires all six artifacts and substantive release evidence", () => {
  assert.equal(MATH_ANIMATION_CAPSTONE_ARTIFACT_COUNT, 6);
  const record: Record<string, unknown> = {
    [MATH_ANIMATION_CAPSTONE_CHECKS_KEY]: [true, true, true, true, true, false],
    [MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY]: "x".repeat(MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH),
    [MATH_ANIMATION_CAPSTONE_KEY]: true,
  };
  assert.equal(reconcileMathAnimationCapstone(record), false);
  assert.equal(record[MATH_ANIMATION_CAPSTONE_KEY], undefined);

  record[MATH_ANIMATION_CAPSTONE_CHECKS_KEY] = Array(6).fill(true);
  record[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] = "too short";
  assert.equal(reconcileMathAnimationCapstone(record), false);

  record[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] = [
    "scene contract: SCENE_CONTRACT.md",
    "math invariant: python manim/test_math_truth.py passed",
    "preview: media/videos/scene/480p15/SecantToTangent.mp4",
    "sampled frames: start, quarter, midpoint, three-quarter, final",
  ].join("; ");
  assert.equal(reconcileMathAnimationCapstone(record), false);
  assert.equal(record[MATH_ANIMATION_CAPSTONE_KEY], undefined);

  for (const slug of MATH_ANIMATION_MODULE_SLUGS) {
    record[mathAnimationModuleProgressKey(slug)] = true;
  }
  assert.equal(reconcileMathAnimationCapstone(record), false);
  assert.equal(record[MATH_ANIMATION_CAPSTONE_KEY], undefined);

  record[MATH_ANIMATION_QUIZ_PASSED_KEY] = true;
  assert.equal(reconcileMathAnimationCapstone(record), true);
  assert.equal(record[MATH_ANIMATION_CAPSTONE_KEY], true);
});

test("corrupt Course 19 progress is repaired without deleting other course keys", () => {
  const unrelated = { owner: "another-course", completed: [1, 2, 3] };
  const slug = MATH_ANIMATION_MODULE_SLUGS[0];
  const normalized = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    "codex.lesson.keep": true,
    "another.course.payload": unrelated,
    [mathAnimationModuleArtifactEvidenceKey(slug)]: { invalid: true },
    [mathAnimationModuleVerificationEvidenceKey(slug)]: ["invalid"],
    [mathAnimationModuleCheckpointKey(slug)]: "true",
    [mathAnimationModuleProgressKey(slug)]: true,
    [MATH_ANIMATION_QUIZ_BEST_KEY]: 900,
    [MATH_ANIMATION_QUIZ_PASSED_KEY]: true,
    [MATH_ANIMATION_CAPSTONE_CHECKS_KEY]: [true],
    [MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY]: 123,
    [MATH_ANIMATION_CAPSTONE_KEY]: true,
  });
  assert.equal(normalized["codex.lesson.keep"], true);
  assert.deepEqual(normalized["another.course.payload"], unrelated);
  assert.equal(normalized[mathAnimationModuleProgressKey(slug)], undefined);
  assert.equal(normalized[MATH_ANIMATION_QUIZ_PASSED_KEY], undefined);
  assert.equal(normalized[MATH_ANIMATION_CAPSTONE_KEY], undefined);

  const migrated = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: "stale:progress-v0",
    "rag.lesson.keep": true,
    [mathAnimationModuleProgressKey(slug)]: true,
  });
  assert.equal(migrated["rag.lesson.keep"], true);
  assert.equal(migrated[MATH_ANIMATION_PROGRESS_VERSION_KEY], MATH_ANIMATION_PROGRESS_VERSION);
  assert.equal(migrated[mathAnimationModuleProgressKey(slug)], undefined);
});

test("a valid reset generation survives normalization for cross-tab form synchronization", () => {
  const normalized = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    [MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY]: 7,
    "other.course.keep": true,
  });
  assert.equal(normalized[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY], 7);
  assert.equal(normalized["other.course.keep"], true);

  const malformed = normalizeMathAnimationProgress({
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
    [MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY]: -1,
  });
  assert.equal(malformed[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY], undefined);
});

test("the public Manim starter invariant executes without the renderer", () => {
  const starterReadme = readFileSync(fileURLToPath(new URL(
    "../public/courses/math-animation/starter-kit/README.md",
    import.meta.url,
  )), "utf8");
  const starterScene = readFileSync(fileURLToPath(new URL(
    "../public/courses/math-animation/starter-kit/manim/scene.py",
    import.meta.url,
  )), "utf8").trimEnd();
  const starterInvariant = readFileSync(fileURLToPath(new URL(
    "../public/courses/math-animation/starter-kit/manim/test_math_truth.py",
    import.meta.url,
  )), "utf8").trimEnd();
  assert.equal(MATH_ANIMATION_CODE_EXAMPLES["manim-graph"].filename, "manim/scene.py");
  assert.equal(MATH_ANIMATION_CODE_EXAMPLES["qa-script"].filename, "manim/test_math_truth.py");
  assert.match(
    starterReadme,
    /eight deterministic state checks \(five positive checkpoints and three negative samples\)/,
  );
  assert.equal(MATH_ANIMATION_CODE_EXAMPLES["manim-graph"].code, starterScene);
  assert.equal(MATH_ANIMATION_CODE_EXAMPLES["qa-script"].code, starterInvariant);

  const testPath = fileURLToPath(new URL(
    "../public/courses/math-animation/starter-kit/manim/test_math_truth.py",
    import.meta.url,
  ));
  const result = spawnSync("python3", [testPath], {
    encoding: "utf8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.trim(), "mathematical invariant: pass");
});

test("the hero poster is self-contained and derives every view from one theta", () => {
  const poster = readFileSync(fileURLToPath(new URL(
    "../public/courses/math-animation/posters/unit-circle-sine-keyframes.svg",
    import.meta.url,
  )), "utf8");
  assert.deepEqual(validateMathPosterSvg(poster), []);

  const nonlinearAxis = poster.replace("765.000,409.696", "766.000,409.696");
  assert.match(validateMathPosterSvg(nonlinearAxis).join("\n"), /sample 1 linear x/);

  const asymmetricAmplitude = poster.replace("1240.000,630.000", "1240.000,620.000");
  assert.match(validateMathPosterSvg(asymmetricAmplitude).join("\n"), /sample 96 sin\(theta\)|negative amplitude/);

  const detachedGraphPoint = poster.replace(
    'id="sine-graph-point" cx="840"',
    'id="sine-graph-point" cx="850"',
  );
  assert.match(validateMathPosterSvg(detachedGraphPoint).join("\n"), /sine point linear theta mapping/);

  const executableSvg = poster.replace("</svg>", '<script>alert("no")</script></svg>');
  assert.match(validateMathPosterSvg(executableSvg).join("\n"), /executable SVG content/);
});

test("content and strict shared release gates pass", async () => {
  const content = await checkMathAnimationCourse();
  assert.equal(content.status, "pass", JSON.stringify(content.issues, null, 2));

  const release = await checkMathAnimationCourse({ release: true });
  assert.equal(release.status, "pass", JSON.stringify(release.issues, null, 2));
});
