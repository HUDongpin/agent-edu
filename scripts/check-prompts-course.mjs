#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const RELEASE_CREATED_ON = "2026-08-23";
const SOURCE_SNAPSHOT_ON = "2026-08-24";

const EXPECTED_LESSON_SLUGS = [
  "prompts-are-specifications",
  "six-part-prompt",
  "instructions-and-data",
  "examples-and-contracts",
  "four-prompt-jobs",
  "evaluation-flywheel",
  "decompose-and-chain",
  "grounding-and-safety",
  "capstone-prompt-packet",
];

const EXPECTED_UNIT_LESSONS = {
  specify: EXPECTED_LESSON_SLUGS.slice(0, 3),
  test: EXPECTED_LESSON_SLUGS.slice(3, 6),
  system: EXPECTED_LESSON_SLUGS.slice(6, 9),
};

const EXPECTED_SOURCE_IDS = [
  "dlai-prompt-engineering-course",
  "dlai-ai-prompting-for-everyone",
  "dlai-batch-course-announcement",
  "dlai-course-materials-policy",
  "openai-chatgpt-prompt-guide",
  "openai-prompt-evaluation-flywheel",
  "openai-latest-model-guidance",
  "openai-structured-outputs-guide",
  "anthropic-prompt-engineering-overview",
  "anthropic-prompting-best-practices",
  "google-prompt-design-strategies",
  "openai-model-spec-untrusted-data",
  "openai-agent-builder-safety",
  "anthropic-jailbreak-prompt-injection-mitigation",
  "microsoft-prompt-engineering-fundamentals",
  "microsoft-advanced-prompts",
  "dair-prompt-engineering-guide",
  "anthropic-interactive-prompt-tutorial",
];

const EXPECTED_FIGURE_KINDS = [
  "pipeline",
  "workbench",
  "authority",
  "few-shot",
  "four-jobs",
  "evaluation-loop",
  "chain",
  "evidence",
  "capstone",
];

const EXPECTED_RASTERS = {
  workbench: {
    pngPath: "/courses/prompts/prompt-workbench-v2.png",
    webpPath: "/courses/prompts/prompt-workbench-v2.webp",
  },
  "evaluation-loop": {
    pngPath: "/courses/prompts/evaluation-loop.png",
    webpPath: "/courses/prompts/evaluation-loop.webp",
  },
};

const errors = [];

function fail(message) {
  errors.push(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value, label) {
  if (!isRecord(value)) {
    fail(`${label} must be an object.`);
    return false;
  }
  return true;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a nonempty string.`);
    return false;
  }
  return true;
}

function requireStringArray(value, label, expectedLength) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array.`);
    return false;
  }
  if (expectedLength !== undefined && value.length !== expectedLength) {
    fail(`${label} must contain exactly ${expectedLength} items; found ${value.length}.`);
  }
  if (value.length === 0) {
    fail(`${label} must not be empty.`);
  }
  value.forEach((item, index) => requireString(item, `${label}[${index}]`));
  return true;
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function requireExactSet(actualValues, expectedValues, label, allowRepeatedReferences = false) {
  const actual = sortedUnique(actualValues);
  const expected = sortedUnique(expectedValues);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    const missing = expected.filter((value) => !actual.includes(value));
    const extra = actual.filter((value) => !expected.includes(value));
    fail(`${label} differs from the required set. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
  }
  if (!allowRepeatedReferences && actualValues.length !== actual.length) {
    fail(`${label} contains duplicate values.`);
  }
}

function requireExactKeys(value, expectedKeys, label) {
  if (!requireRecord(value, label)) return false;
  requireExactSet(Object.keys(value), expectedKeys, `${label} keys`);
  return true;
}

function readJson(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function loadTypeScriptCourseData() {
  const tsxPackage = join(ROOT, "node_modules", "tsx", "package.json");
  if (!existsSync(tsxPackage)) {
    fail("The pinned tsx package is required to validate the TypeScript course ledgers.");
    return null;
  }

  const expression = [
    'import { PROMPT_COURSE_MANIFEST } from "./lib/prompts/manifest.ts";',
    'import { PROMPT_SOURCES } from "./lib/prompts/sources.ts";',
    'import { PROMPT_FIGURES } from "./lib/prompts/figures.ts";',
    'import { promptCapstoneScoresPass } from "./lib/prompts/capstone.ts";',
    'import { TOP_LEVEL_COURSES, promptProgress } from "./lib/courses.ts";',
    'const completeProgress = Object.fromEntries(PROMPT_COURSE_MANIFEST.lessons.map((lesson) => [`prompts.lesson.${lesson.slug}.practice`, true]));',
    'completeProgress["prompts.quiz.passed"] = true;',
    'completeProgress["prompts.capstone.v2.passed"] = true;',
    'const staleCapstoneProgress = { ...completeProgress, "prompts.capstone.v2.passed": false, "prompts.capstone.v1": true };',
    'const capstoneScoreChecks = [[2, 2, 2, 2, 2], [1, 1, 2, 2, 2], [0, 2, 2, 2, 2], [2, 0, 2, 2, 2], [2, 2, 0, 2, 2], [2, 2, 2, 0, 2], [2, 2, 2, 2, 0]].map((scores) => ({ scores, passes: promptCapstoneScoresPass(scores, 8) }));',
    'process.stdout.write(JSON.stringify({ manifest: PROMPT_COURSE_MANIFEST, sources: PROMPT_SOURCES, figures: PROMPT_FIGURES, catalogue: { course: TOP_LEVEL_COURSES.find((item) => item.id === "prompts"), completeProgress: promptProgress(completeProgress), staleCapstoneProgress: promptProgress(staleCapstoneProgress) }, capstoneScoreChecks }));',
  ].join(" ");

  // Importing tsx through Node's loader runs entirely in this process tree.
  // The tsx CLI creates an IPC socket, which is unavailable in the ordinary
  // sandbox used by the deterministic repository build.
  const result = spawnSync(process.execPath, [
    "--import",
    "tsx",
    "--input-type=module",
    "--eval",
    expression,
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr.trim() || `exit ${result.status}`;
    fail(`Could not import the TypeScript course ledgers: ${detail}`);
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`TypeScript course ledger output was not valid JSON: ${error.message}`);
    return null;
  }
}

function validateCourseCopy(copy) {
  if (!requireExactKeys(copy, ["meta", "ui", "units", "lessons", "finalQuiz", "capstone"], "messages/prompts/en.json")) return;

  if (requireExactKeys(copy.meta, ["title", "kicker", "summary", "audience", "duration", "sourceNote", "modelNote", "startCta", "resumeCta"], "copy.meta")) {
    Object.entries(copy.meta).forEach(([key, value]) => requireString(value, `copy.meta.${key}`));
  }

  if (requireRecord(copy.ui, "copy.ui")) {
    if (Object.keys(copy.ui).length === 0) fail("copy.ui must not be empty.");
    Object.entries(copy.ui).forEach(([key, value]) => requireString(value, `copy.ui.${key}`));
  }

  if (requireRecord(copy.units, "copy.units")) {
    requireExactSet(Object.keys(copy.units), Object.keys(EXPECTED_UNIT_LESSONS), "copy unit ids");
    for (const unitId of Object.keys(EXPECTED_UNIT_LESSONS)) {
      const unit = copy.units[unitId];
      if (requireExactKeys(unit, ["title", "summary"], `copy.units.${unitId}`)) {
        requireString(unit.title, `copy.units.${unitId}.title`);
        requireString(unit.summary, `copy.units.${unitId}.summary`);
      }
    }
  }

  if (requireRecord(copy.lessons, "copy.lessons")) {
    requireExactSet(Object.keys(copy.lessons), EXPECTED_LESSON_SLUGS, "copy lesson slugs");
    for (const slug of EXPECTED_LESSON_SLUGS) {
      validateLessonCopy(copy.lessons[slug], slug);
    }
  }

  validateFinalQuizCopy(copy.finalQuiz, copy.lessons);

  if (requireExactKeys(copy.capstone, ["title", "summary", "passScore", "maxScore", "rubric", "required"], "copy.capstone")) {
    requireString(copy.capstone.title, "copy.capstone.title");
    requireString(copy.capstone.summary, "copy.capstone.summary");
    if (copy.capstone.passScore !== 8) fail(`copy.capstone.passScore must be 8; found ${copy.capstone.passScore}.`);
    if (copy.capstone.maxScore !== 10) fail(`copy.capstone.maxScore must be 10; found ${copy.capstone.maxScore}.`);
    if (!Array.isArray(copy.capstone.rubric) || copy.capstone.rubric.length !== 5) {
      fail(`copy.capstone.rubric must contain exactly 5 criteria; found ${copy.capstone.rubric?.length ?? "no array"}.`);
    } else {
      copy.capstone.rubric.forEach((criterion, index) => {
        const label = `copy.capstone.rubric[${index}]`;
        if (!requireExactKeys(criterion, ["id", "criterion", "critical", "score0", "score1", "score2"], label)) return;
        for (const key of ["id", "criterion", "score0", "score1", "score2"]) {
          requireString(criterion[key], `${label}.${key}`);
        }
        if (typeof criterion.critical !== "boolean") fail(`${label}.critical must be a boolean.`);
      });
      requireExactSet(copy.capstone.rubric.map((criterion) => criterion.id), [
        "task-contract",
        "evidence-boundary",
        "output-and-safety",
        "evaluation-evidence",
        "limits-and-review",
      ], "copy.capstone rubric ids");
      if (copy.capstone.rubric.filter((criterion) => criterion.critical).length !== 2) {
        fail("copy.capstone.rubric must identify exactly 2 critical criteria.");
      }
    }
    requireStringArray(copy.capstone.required, "copy.capstone.required");
  }
}

function validateFinalQuizCopy(finalQuiz, lessons) {
  if (!requireExactKeys(finalQuiz, ["passScore", "questions"], "copy.finalQuiz")) return;
  if (finalQuiz.passScore !== 7) fail(`copy.finalQuiz.passScore must be 7; found ${finalQuiz.passScore}.`);
  if (!Array.isArray(finalQuiz.questions)) {
    fail("copy.finalQuiz.questions must be an array.");
    return;
  }
  if (finalQuiz.questions.length !== 9) {
    fail(`copy.finalQuiz.questions must contain exactly 9 items; found ${finalQuiz.questions.length}.`);
  }
  requireExactSet(finalQuiz.questions.map((question) => question?.id), [
    "current-evidence-over-prompt-polish",
    "resolve-conflicting-constraints",
    "untrusted-message-boundary",
    "few-shot-regression-decision",
    "fidelity-before-word-count",
    "judge-needs-source-evidence",
    "chain-at-verification-boundary",
    "citation-support-check",
    "permissions-live-outside-prompt",
  ], "copy.finalQuiz question ids");

  const checkpointQuestions = new Set(Object.values(lessons || {}).map((lesson) => lesson?.checkpoint?.question));
  finalQuiz.questions.forEach((question, index) => {
    const label = `copy.finalQuiz.questions[${index}]`;
    if (!requireExactKeys(question, [
      "id",
      "unitId",
      "difficulty",
      "question",
      "options",
      "correctIndex",
      "explanation",
      "sourceId",
      "claimId",
      "misconceptions",
    ], label)) return;
    for (const key of ["id", "unitId", "difficulty", "question", "explanation", "sourceId", "claimId"]) {
      requireString(question[key], `${label}.${key}`);
    }
    if (!Object.hasOwn(EXPECTED_UNIT_LESSONS, question.unitId)) {
      fail(`${label}.unitId must resolve to a course unit; found ${question.unitId}.`);
    }
    if (!["application", "analysis"].includes(question.difficulty)) {
      fail(`${label}.difficulty must be application or analysis.`);
    }
    requireStringArray(question.options, `${label}.options`, 4);
    requireStringArray(question.misconceptions, `${label}.misconceptions`, 4);
    if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) {
      fail(`${label}.correctIndex must be an integer from 0 through 3.`);
    }
    if (checkpointQuestions.has(question.question)) {
      fail(`${label}.question must not repeat a formative lesson checkpoint verbatim.`);
    }
  });
}

function validateLessonCopy(lesson, slug) {
  const label = `copy.lessons.${slug}`;
  if (!requireExactKeys(lesson, ["kicker", "title", "summary", "objective", "sections", "prompt", "figure", "practice", "checkpoint", "takeaway"], label)) return;

  for (const key of ["kicker", "title", "summary", "objective", "takeaway"]) {
    requireString(lesson[key], `${label}.${key}`);
  }

  if (!Array.isArray(lesson.sections)) {
    fail(`${label}.sections must be an array.`);
  } else {
    if (lesson.sections.length !== 3) {
      fail(`${label}.sections must contain exactly 3 sections; found ${lesson.sections.length}.`);
    }
    lesson.sections.forEach((section, index) => {
      const sectionLabel = `${label}.sections[${index}]`;
      if (requireExactKeys(section, ["heading", "paragraphs"], sectionLabel)) {
        requireString(section.heading, `${sectionLabel}.heading`);
        requireStringArray(section.paragraphs, `${sectionLabel}.paragraphs`);
      }
    });
  }

  if (requireExactKeys(lesson.prompt, ["title", "weak", "text", "annotations"], `${label}.prompt`)) {
    requireString(lesson.prompt.title, `${label}.prompt.title`);
    requireString(lesson.prompt.weak, `${label}.prompt.weak`);
    requireString(lesson.prompt.text, `${label}.prompt.text`);
    requireStringArray(lesson.prompt.annotations, `${label}.prompt.annotations`);
  }

  if (requireExactKeys(lesson.figure, ["kind", "title", "caption", "alt", "labels"], `${label}.figure`)) {
    for (const key of ["kind", "title", "caption", "alt"]) {
      requireString(lesson.figure[key], `${label}.figure.${key}`);
    }
    requireStringArray(lesson.figure.labels, `${label}.figure.labels`);
  }

  if (requireExactKeys(lesson.practice, ["title", "brief", "steps", "evidence", "safety"], `${label}.practice`)) {
    requireString(lesson.practice.title, `${label}.practice.title`);
    requireString(lesson.practice.brief, `${label}.practice.brief`);
    requireStringArray(lesson.practice.steps, `${label}.practice.steps`);
    requireStringArray(lesson.practice.evidence, `${label}.practice.evidence`);
    requireString(lesson.practice.safety, `${label}.practice.safety`);
  }

  if (requireExactKeys(lesson.checkpoint, ["question", "options", "correctIndex", "explanation"], `${label}.checkpoint`)) {
    requireString(lesson.checkpoint.question, `${label}.checkpoint.question`);
    requireStringArray(lesson.checkpoint.options, `${label}.checkpoint.options`, 4);
    if (!Number.isInteger(lesson.checkpoint.correctIndex) || lesson.checkpoint.correctIndex < 0 || lesson.checkpoint.correctIndex > 3) {
      fail(`${label}.checkpoint.correctIndex must be an integer from 0 through 3.`);
    }
    requireString(lesson.checkpoint.explanation, `${label}.checkpoint.explanation`);
  }
}

function validateManifest(manifest, sourceIds, figureKinds, copy) {
  if (!requireExactKeys(manifest, ["id", "version", "displayNumber", "publishedOn", "sourceSnapshotOn", "finalQuizMinutes", "units", "lessons"], "manifest")) return;
  if (manifest.id !== "how-to-write-prompts") fail(`manifest.id must be how-to-write-prompts; found ${manifest.id}.`);
  if (manifest.displayNumber !== 7) fail(`manifest.displayNumber must be 7; found ${manifest.displayNumber}.`);
  if (manifest.publishedOn !== RELEASE_CREATED_ON) fail(`manifest.publishedOn must be ${RELEASE_CREATED_ON}.`);
  if (manifest.sourceSnapshotOn !== SOURCE_SNAPSHOT_ON) fail(`manifest.sourceSnapshotOn must be ${SOURCE_SNAPSHOT_ON}.`);
  if (manifest.finalQuizMinutes !== 15) fail(`manifest.finalQuizMinutes must be 15; found ${manifest.finalQuizMinutes}.`);
  if (manifest.version !== "1.1.0") fail(`manifest.version must be 1.1.0; found ${manifest.version}.`);

  if (!Array.isArray(manifest.units)) {
    fail("manifest.units must be an array.");
  } else {
    if (manifest.units.length !== 3) fail(`manifest.units must contain exactly 3 units; found ${manifest.units.length}.`);
    requireExactSet(manifest.units.map((unit) => unit?.id), Object.keys(EXPECTED_UNIT_LESSONS), "manifest unit ids");
    manifest.units.forEach((unit, index) => {
      const label = `manifest.units[${index}]`;
      if (!requireRecord(unit, label)) return;
      if (unit.order !== index + 1) fail(`${label}.order must be ${index + 1}.`);
      const expectedSlugs = EXPECTED_UNIT_LESSONS[unit.id];
      if (!expectedSlugs) return;
      if (!Array.isArray(unit.lessonSlugs)) {
        fail(`${label}.lessonSlugs must be an array.`);
      } else {
        if (JSON.stringify(unit.lessonSlugs) !== JSON.stringify(expectedSlugs)) {
          fail(`${label}.lessonSlugs must be ${expectedSlugs.join(", ")} in that order.`);
        }
      }
    });
  }

  if (!Array.isArray(manifest.lessons)) {
    fail("manifest.lessons must be an array.");
    return;
  }

  if (manifest.lessons.length !== 9) fail(`manifest.lessons must contain exactly 9 lessons; found ${manifest.lessons.length}.`);
  requireExactSet(manifest.lessons.map((lesson) => lesson?.slug), EXPECTED_LESSON_SLUGS, "manifest lesson slugs");

  const usedSources = [];
  const usedFigures = [];
  manifest.lessons.forEach((lesson, index) => {
    const label = `manifest.lessons[${index}]`;
    if (!requireRecord(lesson, label)) return;
    if (lesson.slug !== EXPECTED_LESSON_SLUGS[index]) fail(`${label}.slug must be ${EXPECTED_LESSON_SLUGS[index]}.`);
    if (lesson.order !== index + 1) fail(`${label}.order must be ${index + 1}.`);
    const expectedUnit = Object.entries(EXPECTED_UNIT_LESSONS).find(([, slugs]) => slugs.includes(lesson.slug))?.[0];
    if (lesson.unitId !== expectedUnit) fail(`${label}.unitId must be ${expectedUnit}.`);
    if (!Number.isFinite(lesson.minutes) || lesson.minutes <= 0) fail(`${label}.minutes must be a positive number.`);
    if (!figureKinds.has(lesson.figureKind)) fail(`${label}.figureKind does not resolve: ${lesson.figureKind}.`);
    usedFigures.push(lesson.figureKind);

    if (!Array.isArray(lesson.sourceIds) || lesson.sourceIds.length === 0) {
      fail(`${label}.sourceIds must contain at least one source.`);
    } else {
      const uniqueLessonSources = new Set(lesson.sourceIds);
      if (uniqueLessonSources.size !== lesson.sourceIds.length) fail(`${label}.sourceIds contains duplicates.`);
      for (const sourceId of lesson.sourceIds) {
        if (!sourceIds.has(sourceId)) fail(`${label}.sourceIds does not resolve: ${sourceId}.`);
        usedSources.push(sourceId);
      }
    }

    const copyFigureKind = copy?.lessons?.[lesson.slug]?.figure?.kind;
    if (copyFigureKind !== lesson.figureKind) {
      fail(`copy.lessons.${lesson.slug}.figure.kind must match manifest figureKind ${lesson.figureKind}.`);
    }
  });

  requireExactSet(usedSources, [...sourceIds], "sources covered by lessons", true);
  requireExactSet(usedFigures, [...figureKinds], "figures covered by lessons");
}

function validateSources(sources) {
  if (!Array.isArray(sources)) {
    fail("PROMPT_SOURCES must be an array.");
    return new Set();
  }
  if (sources.length !== 18) fail(`PROMPT_SOURCES must contain exactly 18 sources; found ${sources.length}.`);
  requireExactSet(sources.map((source) => source?.id), EXPECTED_SOURCE_IDS, "source ids");

  for (const [index, source] of sources.entries()) {
    const label = `PROMPT_SOURCES[${index}]`;
    if (!requireRecord(source, label)) continue;
    for (const key of ["id", "title", "publisher", "licence", "reuse", "currency", "note"]) {
      requireString(source[key], `${label}.${key}`);
    }
    for (const key of ["url", "exactAnchor"]) {
      if (requireString(source[key], `${label}.${key}`) && !source[key].startsWith("https://")) {
        fail(`${label}.${key} must use HTTPS.`);
      }
    }
    if (source.licenceUrl !== null && (typeof source.licenceUrl !== "string" || !source.licenceUrl.startsWith("https://"))) {
      fail(`${label}.licenceUrl must be null or an HTTPS URL.`);
    }
    if (source.supportingAnchors !== undefined) {
      if (!Array.isArray(source.supportingAnchors)) {
        fail(`${label}.supportingAnchors must be an array when present.`);
      } else {
        source.supportingAnchors.forEach((anchor, anchorIndex) => {
          if (typeof anchor !== "string" || !anchor.startsWith("https://")) {
            fail(`${label}.supportingAnchors[${anchorIndex}] must be an HTTPS URL.`);
          }
        });
      }
    }
    if (source.accessedOn !== SOURCE_SNAPSHOT_ON) fail(`${label}.accessedOn must be ${SOURCE_SNAPSHOT_ON}.`);
    if (source.verifiedOn !== SOURCE_SNAPSHOT_ON) fail(`${label}.verifiedOn must be ${SOURCE_SNAPSHOT_ON}.`);
    requireStringArray(source.claimIds, `${label}.claimIds`);
    requireStringArray(source.caveats, `${label}.caveats`);
    if (!new Set(["original-only", "link-only"]).has(source.reuse)) {
      fail(`${label}.reuse must be original-only or link-only.`);
    }
  }

  return new Set(sources.map((source) => source.id));
}

function validateContentSemantics(copy, manifest, sources) {
  if (!copy || !manifest || !Array.isArray(manifest.lessons) || !Array.isArray(sources)) return;

  const lessonMinutes = manifest.lessons.reduce((sum, lesson) => sum + (Number.isFinite(lesson?.minutes) ? lesson.minutes : 0), 0);
  const totalMinutes = lessonMinutes + manifest.finalQuizMinutes;
  if (lessonMinutes !== 365 || totalMinutes !== 380) {
    fail(`manifest lessons must total 365 minutes and guided course time must total 380; found ${lessonMinutes} and ${totalMinutes}.`);
  }
  if (copy.meta?.duration !== "6 hours 20 minutes of guided work, including a 70-minute capstone and a 15-minute final knowledge check; live model runs and portfolio completion may take longer") {
    fail("copy.meta.duration must state the exact 380-minute guided workload and distinguish additional live portfolio time.");
  }
  if (copy.ui?.capstonePassRule !== "Pass: 8 of 10 points, with no criterion scored 0.") {
    fail("copy.ui.capstonePassRule must reject a zero on every rubric criterion.");
  }

  const offlineBoundaryText = [
    copy.meta?.audience,
    copy.ui?.fixturePackNote,
    copy.ui?.livePracticeNote,
  ].filter((value) => typeof value === "string").join(" ");
  if (!offlineBoundaryText.includes("offline inspection and revision planning")) {
    fail("Course copy must describe the fixture pack as offline inspection and revision planning, not empirical execution.");
  }
  if (!offlineBoundaryText.includes("empirical before-and-after") || !offlineBoundaryText.includes("self-authored capstone")) {
    fail("Course copy must state that empirical comparisons and the self-authored capstone require an AI assistant.");
  }
  if (/every core exercise|complete Course 7 without an AI account|complete offline learning path/i.test(offlineBoundaryText)) {
    fail("Course copy must not overclaim that the representative fixture pack completes every exercise offline.");
  }

  const lessonOneVariation = copy.lessons?.["prompts-are-specifications"]?.sections?.[2]?.paragraphs?.join(" ") || "";
  for (const requiredText of [
    "You do not need an API key to study the lessons or inspect the supplied fixtures.",
    "Run-based comparisons and the self-authored capstone require access to an AI assistant.",
  ]) {
    if (!lessonOneVariation.includes(requiredText)) {
      fail(`Lesson 1 must preserve the offline/live boundary: ${requiredText}`);
    }
  }

  const lessonOnePrompt = copy.lessons?.["prompts-are-specifications"]?.prompt?.text || "";
  if (!lessonOnePrompt.includes("blank learner self-rating: Confidence (0 = guessing, 1 = unsure, 2 = fairly sure, 3 = very sure)")) {
    fail("Lesson 1 confidence must be an anchored, blank learner self-rating.");
  }

  const lessonTwoPrompt = copy.lessons?.["six-part-prompt"]?.prompt?.text || "";
  if (!lessonTwoPrompt.includes("Sunday's final study block is a timed mixed quiz, followed only by the 5-minute self-check.")) {
    fail("Lesson 2 must resolve the Sunday quiz and end-of-day self-check ordering.");
  }

  const extractionPrompt = copy.lessons?.["instructions-and-data"]?.prompt?.text || "";
  for (const key of [
    "policy_name_paragraph_id",
    "effective_date_paragraph_id",
    "responsible_office_paragraph_id",
  ]) {
    if (!extractionPrompt.includes(key)) {
      fail(`The source-extraction prompt must include field-level evidence key ${key}.`);
    }
  }

  const transformationPrompt = copy.lessons?.["four-prompt-jobs"]?.prompt?.text || "";
  if (!transformationPrompt.includes("Factual fidelity outranks this range")) {
    fail("The transformation prompt must make factual fidelity outrank the word range.");
  }

  const classifierLesson = copy.lessons?.["examples-and-contracts"];
  const classifierPrompt = classifierLesson?.prompt?.text || "";
  for (const requiredText of [
    "Label definitions:",
    "billing: disputes a charge, price, invoice, renewal, or payment",
    "bug: reports that an existing feature or behaviour fails or malfunctions",
    "feature_request: asks for a new capability or behaviour",
    "other: none of the definitions applies, or the message lacks enough information",
  ]) {
    if (!classifierPrompt.includes(requiredText)) {
      fail(`The Lesson 4 classifier contract is missing: ${requiredText}`);
    }
  }
  const classifierSteps = classifierLesson?.practice?.steps || [];
  if (!classifierSteps[0]?.includes("remove only the Examples block")) {
    fail("Lesson 4 condition A must remove only the Examples block from the full classifier contract.");
  }
  if (!classifierSteps[1]?.includes("adding only the four examples") || !classifierSteps[1]?.includes("model, product surface, settings")) {
    fail("Lesson 4 condition B must add only examples while holding cases, model, surface, and settings constant.");
  }
  if ((classifierSteps.join(" ")).includes("examples plus the precedence rule")) {
    fail("Lesson 4 must not confound examples with a simultaneous precedence-rule change.");
  }
  for (const requiredText of ["classifier contract", "Add only the examples", "compare per-case results"]) {
    if (!classifierLesson?.figure?.caption?.includes(requiredText)) {
      fail(`The Lesson 4 controlled-comparison figure is missing: ${requiredText}`);
    }
  }
  const structuredOutputsParagraph = classifierLesson?.sections?.[2]?.paragraphs?.[0] || "";
  for (const requiredText of ["refusals", "incomplete or truncated responses", "missing-data cases"]) {
    if (!structuredOutputsParagraph.includes(requiredText)) {
      fail(`Lesson 4 Structured Outputs guidance must handle ${requiredText}.`);
    }
  }

  const evaluatorPrompt = copy.lessons?.["evaluation-flywheel"]?.prompt?.text || "";
  for (const requiredText of [
    "If the score concerns an omission, name the missing requirement instead.",
    "cite the candidate claim and the supporting or contradicting source paragraph ID",
    "mark this criterion unknown",
    "Exclude unknown from both earned and possible points",
    "earned points / possible points among scored criteria and the unknown count",
    "Do not compare aggregate runs with different possible-point totals",
    "No scored revision identified.",
    "separately name the smallest additional evidence needed to score it",
  ]) {
    if (!evaluatorPrompt.includes(requiredText)) {
      fail(`The evaluator prompt is missing required evidence rule: ${requiredText}`);
    }
  }
  if (evaluatorPrompt.includes("End with the single highest-priority revision.")) {
    fail("The evaluator must not invent a revision when every scored criterion already earns full credit.");
  }

  const groundingPrompt = copy.lessons?.["grounding-and-safety"]?.prompt?.text || "";
  if (!groundingPrompt.includes("Write exactly one status line: Status: Not supported by the supplied source.")) {
    fail("The grounding prompt must use a status line that permits a subsequent missing-information list.");
  }
  if (groundingPrompt.includes("return exactly: Not supported by the supplied source.")) {
    fail("The grounding prompt must not require an exact one-line response and a missing-information list simultaneously.");
  }

  const capstonePrompt = copy.lessons?.["capstone-prompt-packet"]?.prompt?.text || "";
  for (const requiredText of [
    "stop and wait for my answers",
    "candidates for human validation against real task data",
    "do not claim they are representative",
  ]) {
    if (!capstonePrompt.includes(requiredText)) {
      fail(`The capstone meta-prompt is missing required interaction or evaluation rule: ${requiredText}`);
    }
  }
  const capstoneFigure = copy.lessons?.["capstone-prompt-packet"]?.figure;
  const expectedCapstoneLabels = [
    "Task and success",
    "Variables and evidence",
    "Prompt v1 to v2",
    "Model, surface and date",
    "Six-case results and limits",
    "Human review",
  ];
  if (JSON.stringify(capstoneFigure?.labels) !== JSON.stringify(expectedCapstoneLabels)) {
    fail(`The capstone figure labels must be ${expectedCapstoneLabels.join(", ")}.`);
  }
  const capstoneFigureText = `${capstoneFigure?.caption || ""} ${capstoneFigure?.alt || ""}`;
  for (const requiredText of ["version 1 to version 2", "model", "date", "six-case", "limits", "human review"]) {
    if (!capstoneFigureText.toLowerCase().includes(requiredText)) {
      fail(`The capstone figure caption and alt must visibly account for ${requiredText}.`);
    }
  }

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  for (const [index, question] of (copy.finalQuiz?.questions || []).entries()) {
    const source = sourceById.get(question.sourceId);
    if (!source) {
      fail(`copy.finalQuiz.questions[${index}].sourceId does not resolve: ${question.sourceId}.`);
      continue;
    }
    if (!source.claimIds?.includes(question.claimId)) {
      fail(`copy.finalQuiz.questions[${index}] claim ${question.claimId} is not supported by source ${question.sourceId}.`);
    }
  }
  const judgeQuestion = copy.finalQuiz?.questions?.find((question) => question.id === "judge-needs-source-evidence");
  if (judgeQuestion?.sourceId !== "openai-prompt-evaluation-flywheel" || judgeQuestion?.claimId !== "eval.llm-judge-alignment") {
    fail("The LLM-judge transfer question must map to the evaluation flywheel's judge-alignment evidence.");
  }
  const expectedCanonicalSources = {
    "google-prompt-design-strategies": {
      url: "https://ai.google.dev/gemini-api/docs/prompting-strategies",
      exactAnchor: "https://ai.google.dev/gemini-api/docs/prompting-strategies#clear-and-specific-instructions",
    },
    "openai-model-spec-untrusted-data": {
      url: "https://model-spec.openai.com/2026-08-18.html",
      exactAnchor: "https://model-spec.openai.com/2026-08-18.html#ignore_untrusted_data",
      supportingAnchors: [
        "https://model-spec.openai.com/2026-08-18.html#scope_of_autonomy",
        "https://model-spec.openai.com/2026-08-18.html#control_side_effects",
      ],
    },
    "openai-agent-builder-safety": {
      url: "https://developers.openai.com/api/docs/guides/agent-builder-safety",
      exactAnchor: "https://developers.openai.com/api/docs/guides/agent-builder-safety#keep-tool-approvals-on",
    },
    "anthropic-jailbreak-prompt-injection-mitigation": {
      url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
      exactAnchor: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks#indirect-prompt-injection",
    },
  };
  for (const [sourceId, expected] of Object.entries(expectedCanonicalSources)) {
    const source = sourceById.get(sourceId);
    if (source?.url !== expected.url) {
      fail(`${sourceId}.url must use the verified canonical URL ${expected.url}.`);
    }
    if (source?.exactAnchor !== expected.exactAnchor) {
      fail(`${sourceId}.exactAnchor must use the verified canonical anchor ${expected.exactAnchor}.`);
    }
    for (const anchor of expected.supportingAnchors ?? []) {
      if (!source?.supportingAnchors?.includes(anchor)) {
        fail(`${sourceId}.supportingAnchors must include the verified canonical anchor ${anchor}.`);
      }
    }
  }

  const expectedSourceTitles = {
    "dlai-batch-course-announcement": "New course: ChatGPT Prompt Engineering for Developers",
    "anthropic-interactive-prompt-tutorial": "Welcome to Anthropic's Prompt Engineering Interactive Tutorial",
  };
  for (const [sourceId, expectedTitle] of Object.entries(expectedSourceTitles)) {
    if (sourceById.get(sourceId)?.title !== expectedTitle) {
      fail(`${sourceId}.title must match the verified source title ${expectedTitle}.`);
    }
  }

  const structuredOutputs = sourceById.get("openai-structured-outputs-guide");
  if (structuredOutputs?.url !== "https://developers.openai.com/api/docs/guides/structured-outputs") {
    fail("openai-structured-outputs-guide must use the verified official Structured Outputs URL.");
  }
  if (structuredOutputs?.exactAnchor !== "https://developers.openai.com/api/docs/guides/structured-outputs#handling-mistakes") {
    fail("openai-structured-outputs-guide must anchor its primary caveat to Handling mistakes.");
  }
  for (const requiredText of ["refusals", "incomplete or truncated responses", "model mistakes"]) {
    if (!structuredOutputs?.caveats?.some((caveat) => caveat.includes(requiredText))) {
      fail(`openai-structured-outputs-guide caveats must cover ${requiredText}.`);
    }
  }

  const evaluationFlywheel = sourceById.get("openai-prompt-evaluation-flywheel");
  const promptGuide = sourceById.get("openai-chatgpt-prompt-guide");
  if (promptGuide?.claimIds?.includes("eval.representative-test-set")) {
    fail("The practical prompt guide must not own the distributional eval.representative-test-set claim.");
  }
  if (!evaluationFlywheel?.claimIds?.includes("eval.representative-test-set")) {
    fail("The evaluation flywheel must own the eval.representative-test-set claim.");
  }
  if (!evaluationFlywheel?.claimIds?.includes("eval.llm-judge-alignment")) {
    fail("The evaluation flywheel must own the eval.llm-judge-alignment claim.");
  }
  if (!evaluationFlywheel?.supportingAnchors?.includes("https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md#aligning-your-llm-judge")) {
    fail("The evaluation flywheel must link directly to its LLM-judge alignment section.");
  }
  if (!sourceById.get("openai-agent-builder-safety")?.claimIds?.includes("safety.application-tool-approvals-and-guardrails")) {
    fail("The OpenAI agent-safety record must own the application approvals and guardrails claim.");
  }
  if (!sourceById.get("anthropic-jailbreak-prompt-injection-mitigation")?.claimIds?.includes("safety.least-privilege-and-injection-monitoring")) {
    fail("The Anthropic injection-mitigation record must own the least-privilege and monitoring claim.");
  }
}

function validateCatalogueIntegration(catalogue, manifest) {
  if (!requireRecord(catalogue, "Course 7 catalogue integration")) return;
  if (!requireRecord(catalogue.course, "Course 7 top-level catalogue record")) return;

  const expectedMinutes = manifest.lessons.reduce((sum, lesson) => sum + lesson.minutes, manifest.finalQuizMinutes);
  if (catalogue.course.minutes !== expectedMinutes || catalogue.course.durationMinutes !== expectedMinutes) {
    fail(`Course 7 catalogue minutes and durationMinutes must both include the final quiz and equal ${expectedMinutes}.`);
  }
  if (catalogue.completeProgress !== 100) {
    fail(`All 11 current Course 7 milestones must produce 100 percent catalogue progress; found ${catalogue.completeProgress}.`);
  }
  if (catalogue.staleCapstoneProgress !== 91) {
    fail(`The retired prompts.capstone.v1 key must not count as the current capstone; expected 91 percent, found ${catalogue.staleCapstoneProgress}.`);
  }

  const expectedLocaleMeta = {
    ar: "٩ دروس، ٦ ساعات و٢٠ دقيقة",
    de: "9 Lektionen, 6 Stunden 20 Minuten",
    en: "9 lessons, 6 hours 20 minutes",
    es: "9 lecciones, 6 horas y 20 minutos",
    fr: "9 leçons, 6 h 20",
    ja: "9講、6時間20分",
    ko: "9개 수업, 6시간 20분",
    "zh-Hans": "9 节课，6 小时 20 分钟",
    "zh-Hant": "9 節課，6 小時 20 分鐘",
  };
  for (const [locale, expected] of Object.entries(expectedLocaleMeta)) {
    const messages = readJson(`messages/${locale}.json`);
    if (messages?.["c.prompts.meta"] !== expected) {
      fail(`messages/${locale}.json c.prompts.meta must be ${JSON.stringify(expected)}.`);
    }
  }
}

function validateCapstoneScoreChecks(checks) {
  const expected = [true, true, false, false, false, false, false];
  if (!Array.isArray(checks) || checks.length !== expected.length) {
    fail("The capstone score predicate must expose the seven required release probes.");
    return;
  }
  const actual = checks.map((check) => check?.passes);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`The capstone score predicate must pass only no-zero scores at or above 8; found ${JSON.stringify(actual)}.`);
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function readPngDimensions(buffer, label) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    fail(`${label} does not have a valid PNG signature.`);
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readWebpDimensions(buffer, label) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    fail(`${label} does not have a valid RIFF WebP signature.`);
    return null;
  }

  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8 ") {
    if (buffer.subarray(23, 26).toString("hex") !== "9d012a") {
      fail(`${label} has an invalid VP8 frame header.`);
      return null;
    }
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    if (buffer[20] !== 0x2f) {
      fail(`${label} has an invalid VP8L frame header.`);
      return null;
    }
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + b0 + ((b1 & 0x3f) << 8),
      height: 1 + (b1 >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10),
    };
  }

  fail(`${label} uses unsupported WebP chunk ${JSON.stringify(chunk)}.`);
  return null;
}

function validateRasterFile(publicPath, expectedHash, expectedWidth, expectedHeight) {
  const relativePath = publicPath.replace(/^\//, "");
  const absolutePath = join(ROOT, "public", relativePath);
  if (!existsSync(absolutePath)) {
    fail(`Missing raster asset: ${publicPath}.`);
    return;
  }
  const buffer = readFileSync(absolutePath);
  const extension = extname(publicPath).toLowerCase();
  const dimensions = extension === ".png"
    ? readPngDimensions(buffer, publicPath)
    : extension === ".webp"
      ? readWebpDimensions(buffer, publicPath)
      : null;
  if (dimensions && (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight)) {
    fail(`${publicPath} must be ${expectedWidth}x${expectedHeight}; found ${dimensions.width}x${dimensions.height}.`);
  }
  const actualHash = sha256(buffer);
  if (actualHash !== expectedHash) {
    fail(`${publicPath} SHA-256 mismatch. Expected ${expectedHash}; found ${actualHash}.`);
  }
}

function validateFigures(figures) {
  if (!Array.isArray(figures)) {
    fail("PROMPT_FIGURES must be an array.");
    return new Set();
  }
  if (figures.length !== 9) fail(`PROMPT_FIGURES must contain exactly 9 figures; found ${figures.length}.`);
  requireExactSet(figures.map((figure) => figure?.kind), EXPECTED_FIGURE_KINDS, "figure kinds");

  const rasterFigures = figures.filter((figure) => figure?.raster !== null);
  if (rasterFigures.length !== 2) fail(`PROMPT_FIGURES must contain exactly 2 raster figures; found ${rasterFigures.length}.`);
  requireExactSet(rasterFigures.map((figure) => figure.kind), Object.keys(EXPECTED_RASTERS), "raster figure kinds");

  for (const [index, figure] of figures.entries()) {
    const label = `PROMPT_FIGURES[${index}]`;
    if (!requireRecord(figure, label)) continue;
    if (figure.status !== "available") fail(`${label}.status must be available.`);
    const expectedRaster = EXPECTED_RASTERS[figure.kind];
    if (!expectedRaster) {
      if (figure.format !== "semantic-html") fail(`${label}.format must be semantic-html.`);
      if (figure.raster !== null) fail(`${label}.raster must be null.`);
      continue;
    }

    if (figure.format !== "original-raster-with-transcript") {
      fail(`${label}.format must be original-raster-with-transcript.`);
    }
    if (!requireRecord(figure.raster, `${label}.raster`)) continue;
    if (figure.raster.pngPath !== expectedRaster.pngPath) fail(`${label}.raster.pngPath must be ${expectedRaster.pngPath}.`);
    if (figure.raster.webpPath !== expectedRaster.webpPath) fail(`${label}.raster.webpPath must be ${expectedRaster.webpPath}.`);
    if (figure.raster.width !== 1536 || figure.raster.height !== 1024) {
      fail(`${label}.raster dimensions must be 1536x1024.`);
    }
    if (figure.raster.createdOn !== RELEASE_CREATED_ON) fail(`${label}.raster.createdOn must be ${RELEASE_CREATED_ON}.`);
    if (figure.raster.creator !== "OpenAI image generation") fail(`${label}.raster.creator must be OpenAI image generation.`);
    requireString(figure.raster.creationPrompt, `${label}.raster.creationPrompt`);
    if (!/^[a-f0-9]{64}$/.test(figure.raster.pngSha256 || "")) fail(`${label}.raster.pngSha256 must be a lowercase SHA-256 digest.`);
    if (!/^[a-f0-9]{64}$/.test(figure.raster.webpSha256 || "")) fail(`${label}.raster.webpSha256 must be a lowercase SHA-256 digest.`);
    validateRasterFile(figure.raster.pngPath, figure.raster.pngSha256, 1536, 1024);
    validateRasterFile(figure.raster.webpPath, figure.raster.webpSha256, 1536, 1024);
  }

  const assetDirectory = join(ROOT, "public", "courses", "prompts");
  if (!existsSync(assetDirectory)) {
    fail("public/courses/prompts must exist.");
  } else {
    const actualNames = readdirSync(assetDirectory)
      .filter((name) => statSync(join(assetDirectory, name)).isFile())
      .sort();
    const expectedNames = Object.values(EXPECTED_RASTERS)
      .flatMap((raster) => [raster.pngPath, raster.webpPath])
      .map((path) => path.split("/").at(-1))
      .concat([
        "course-7-fixture-pack-v1.json",
        "prompt-workbench.png",
        "prompt-workbench.webp",
      ])
      .sort();
    if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
      fail(`public/courses/prompts must contain exactly ${expectedNames.join(", ")}; found ${actualNames.join(", ") || "no files"}.`);
    }
  }

  return new Set(figures.map((figure) => figure.kind));
}

function validateReleaseFixture(manifest, figures) {
  if (!RELEASE) return;

  const fixture = readJson("public/courses/prompts/course-7-fixture-pack-v1.json");
  if (!fixture || !manifest) return;

  if (!requireExactKeys(fixture, [
    "schemaVersion",
    "courseId",
    "courseVersion",
    "createdOn",
    "title",
    "purpose",
    "usage",
    "fixtures",
  ], "release fixture pack")) return;
  if (fixture.schemaVersion !== "1.0.0") fail(`release fixture pack schemaVersion must be 1.0.0; found ${fixture.schemaVersion}.`);
  if (fixture.courseId !== manifest.id) fail(`release fixture pack courseId must be ${manifest.id}; found ${fixture.courseId}.`);
  if (fixture.courseVersion !== manifest.version) {
    fail(`release fixture pack courseVersion must match manifest ${manifest.version}; found ${fixture.courseVersion}.`);
  }
  if (fixture.createdOn !== RELEASE_CREATED_ON) fail(`release fixture pack createdOn must be ${RELEASE_CREATED_ON}; found ${fixture.createdOn}.`);
  if (requireRecord(fixture.usage, "release fixture pack usage")) {
    requireStringArray(fixture.usage.offline, "release fixture pack usage.offline", 3);
    requireString(fixture.usage.liveOptional, "release fixture pack usage.liveOptional");
    requireString(fixture.usage.safety, "release fixture pack usage.safety");
  }
  const fixtureBoundaryText = [
    fixture.purpose,
    ...(fixture.usage?.offline || []),
    fixture.usage?.liveOptional,
  ].filter((value) => typeof value === "string").join(" ");
  if (!fixtureBoundaryText.includes("offline inspection and revision planning")) {
    fail("The release fixture pack must describe representative offline inspection and revision planning.");
  }
  if (!fixtureBoundaryText.includes("required for empirical before-and-after claims and a self-authored capstone")) {
    fail("The release fixture pack must state when live runs are required.");
  }
  if (/every core exercise|complete Course 7 without an AI account|complete offline learning path/i.test(fixtureBoundaryText)) {
    fail("The release fixture pack must not claim to complete the full run-based course offline.");
  }
  if (requireRecord(fixture.fixtures, "release fixture pack fixtures")) {
    requireExactSet(Object.keys(fixture.fixtures), [
      "lesson3PolicyExtraction",
      "lesson4SupportClassification",
      "lesson5FactPreservingRewrite",
      "lesson6EvaluationSet",
      "lesson7DecisionEvidence",
      "lesson8Grounding",
      "lesson9RoughNotes",
    ], "release fixture pack fixture ids");
  }
  if (fixture.fixtures?.lesson4SupportClassification?.heldOutCases?.length !== 5) {
    fail("release fixture pack must contain 5 held-out support-classification cases.");
  }
  const evaluationSet = fixture.fixtures?.lesson6EvaluationSet;
  if (evaluationSet?.sixCases?.length !== 6) {
    fail("release fixture pack must contain the required 6-case evaluation set.");
  }
  if (evaluationSet?.task !== "Classify the six evaluation messages and return exactly one allowed label plus an exact evidence phrase.") {
    fail("The release fixture evaluation task must accurately describe all six cases and the classifier contract.");
  }
  if (Array.isArray(evaluationSet?.sixCases)) {
    requireExactSet(evaluationSet.sixCases.map((testCase) => testCase?.id), ["E1", "E2", "E3", "E4", "E5", "E6"], "release fixture evaluation case ids");
  }
  if (Array.isArray(evaluationSet?.baselineOutputs)) {
    requireExactSet(evaluationSet.baselineOutputs.map((output) => output?.caseId), ["E1", "E2", "E3", "E4", "E5", "E6"], "release fixture baseline case ids");
  }
  const e2 = evaluationSet?.sixCases?.find((testCase) => testCase.id === "E2");
  const e2Baseline = evaluationSet?.baselineOutputs?.find((output) => output.caseId === "E2");
  if (e2?.input !== "Can someone help me?" || e2?.risk !== "missing information") {
    fail("Evaluation case E2 must be a genuinely non-diagnostic missing-information message.");
  }
  if (!e2?.expectedBehaviour?.includes("other") || !e2?.expectedBehaviour?.includes("lacks enough information")) {
    fail("Evaluation case E2 must map insufficient classification evidence to the allowed label other.");
  }
  if (e2Baseline?.label !== "bug" || e2Baseline?.result !== "fail" || !e2Baseline?.failure?.startsWith("unsupported specificity")) {
    fail("Evaluation case E2's simulated baseline must expose unsupported bug specificity as a failure.");
  }
  const e4 = evaluationSet?.sixCases?.find((testCase) => testCase.id === "E4");
  if (e4?.risk !== "multiline formatting noise" || !e4?.input?.includes("\n\n")) {
    fail("Evaluation case E4 must honestly test multiline formatting noise.");
  }
  if (/1,?200 characters|long input/i.test(`${e4?.risk || ""} ${e4?.input || ""}`)) {
    fail("Evaluation case E4 must not claim an input length that the fixture does not contain.");
  }

  const unsupportedAnswerKey = fixture.fixtures?.lesson8Grounding?.unsupportedAnswerKey;
  const unsupportedAnswerLines = typeof unsupportedAnswerKey === "string"
    ? unsupportedAnswerKey.split("\n")
    : [];
  if (
    unsupportedAnswerLines[0] !== "Status: Not supported by the supplied source."
    || unsupportedAnswerLines[1] !== "Missing information:"
    || unsupportedAnswerLines.length < 3
    || unsupportedAnswerLines.slice(2).some((line) => !line.startsWith("- "))
  ) {
    fail("The lesson 8 unsupported answer must return the exact status line first, followed by a bulleted missing-information list.");
  }

  const workbenchPrompt = figures?.find((figure) => figure.kind === "workbench")?.raster?.creationPrompt || "";
  for (const label of ["GOAL", "CONTEXT", "TASK", "CONSTRAINTS", "OUTPUT", "SUCCESS CRITERIA"]) {
    if (!workbenchPrompt.includes(label)) fail(`release workbench creation prompt must include ${label}.`);
  }
  if (!workbenchPrompt.includes("exactly six")) {
    fail("release workbench creation prompt must explicitly require exactly six cards.");
  }
}

function collectTextFiles(path) {
  if (!existsSync(path)) return [];
  const entry = statSync(path);
  if (entry.isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((child) => {
    const childPath = join(path, child.name);
    if (child.isDirectory()) return collectTextFiles(childPath);
    return [".ts", ".tsx", ".json", ".md", ".css"].includes(extname(child.name)) ? [childPath] : [];
  });
}

function validateNoLongDashes() {
  const roots = [
    join(ROOT, "lib", "prompts"),
    join(ROOT, "messages", "prompts"),
    join(ROOT, "components", "prompts"),
    join(ROOT, "app", "[locale]", "prompts"),
  ];
  for (const file of roots.flatMap(collectTextFiles)) {
    const text = readFileSync(file, "utf8");
    const match = /[\u2013\u2014]/u.exec(text);
    if (match) {
      const line = text.slice(0, match.index).split("\n").length;
      fail(`${file.slice(ROOT.length + 1)}:${line} contains an en dash or em dash.`);
    }
  }
}

const copy = readJson("messages/prompts/en.json");
const courseData = loadTypeScriptCourseData();

if (copy) validateCourseCopy(copy);
if (courseData) {
  const sourceIds = validateSources(courseData.sources);
  const figureKinds = validateFigures(courseData.figures);
  validateManifest(courseData.manifest, sourceIds, figureKinds, copy);
  validateContentSemantics(copy, courseData.manifest, courseData.sources);
  validateCatalogueIntegration(courseData.catalogue, courseData.manifest);
  validateCapstoneScoreChecks(courseData.capstoneScoreChecks);
  validateReleaseFixture(courseData.manifest, courseData.figures);
}
validateNoLongDashes();

if (errors.length > 0) {
  console.error(`Prompt course ${RELEASE ? "release " : ""}check failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error, index) => console.error(`${index + 1}. ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Prompt course ${RELEASE ? "release " : ""}check passed: 9 lessons, 18 sources, 9 available figures, and 2 verified raster pairs.`);
}
