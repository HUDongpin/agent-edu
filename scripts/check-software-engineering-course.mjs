#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_ONLY = process.argv.includes("--json");
const SNAPSHOT_ON = "2026-08-23";

const EXPECTED_LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const EXPECTED_UNITS = ["frame", "shape", "verify", "deliver", "govern"];
const EXPECTED_LESSONS = [
  "agentic-engineering-system",
  "requirements-task-contracts",
  "architecture-tradeoffs",
  "planning-estimation-risk",
  "repository-context",
  "git-environments-worktrees",
  "construction-quality",
  "testing-strategy",
  "debugging-root-cause",
  "review-refactoring-debt",
  "documentation-knowledge",
  "cicd-release",
  "reliability-observability",
  "performance-economics",
  "security-privacy-supply-chain",
  "teams-governance",
  "agent-evaluation",
  "capstone-safe-change",
];
const EXPECTED_MEDIA = [
  "codex-plan-ui",
  "claude-cowork-ui",
  "claude-artifact-workspace-ui",
  "github-project-ui",
  "github-branch-ui",
  "github-diff-ui",
  "github-review-ui",
  "github-actions-ui",
  "github-release-ui",
];
const EXPECTED_SWEBOK_AREAS = [
  "Software Requirements",
  "Software Architecture",
  "Software Design",
  "Software Construction",
  "Software Testing",
  "Software Engineering Operations",
  "Software Maintenance",
  "Software Configuration Management",
  "Software Engineering Management",
  "Software Engineering Process",
  "Software Engineering Models and Methods",
  "Software Quality",
  "Software Security",
  "Software Engineering Professional Practice",
  "Software Engineering Economics",
  "Computing Foundations",
  "Mathematical Foundations",
  "Engineering Foundations",
];

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

function sameSet(actual, expected, label) {
  const left = [...new Set(actual)].sort();
  const right = [...new Set(expected)].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    fail(`${label} mismatch; missing=${right.filter((value) => !left.includes(value)).join(",") || "none"}; extra=${left.filter((value) => !right.includes(value)).join(",") || "none"}`);
  }
  if (actual.length !== left.length) fail(`${label} contains duplicates`);
}

function nonempty(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be a nonempty string`);
}

function walkStrings(value, label, visitor) {
  if (typeof value === "string") return visitor(value, label);
  if (Array.isArray(value)) return value.forEach((entry, index) => walkStrings(entry, `${label}[${index}]`, visitor));
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) walkStrings(entry, `${label}.${key}`, visitor);
  }
}

function flatten(value, prefix = "", output = new Map()) {
  if (value && typeof value === "object") {
    if (Array.isArray(value)) value.forEach((entry, index) => flatten(entry, `${prefix}[${index}]`, output));
    else for (const [key, entry] of Object.entries(value)) flatten(entry, prefix ? `${prefix}.${key}` : key, output);
  } else output.set(prefix, value);
  return output;
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath} is missing or invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function loadLedgers() {
  const tsxPackage = join(ROOT, "node_modules", "tsx", "package.json");
  if (!existsSync(tsxPackage)) {
    fail("The pinned tsx package is required to import the typed Course 8 ledgers");
    return null;
  }
  const expression = [
    'import { SOFTWARE_ENGINEERING_COURSE_MANIFEST } from "./lib/software-engineering/manifest.ts";',
    'import { SOFTWARE_ENGINEERING_SOURCES } from "./lib/software-engineering/sources.ts";',
    'import { SOFTWARE_ENGINEERING_MEDIA } from "./lib/software-engineering/figures.ts";',
    'import { SOFTWARE_ENGINEERING_QUIZ, SOFTWARE_ENGINEERING_FINAL_QUIZ } from "./lib/software-engineering/quiz.ts";',
    'import { SOFTWARE_ENGINEERING_CAPSTONE } from "./lib/software-engineering/capstone.ts";',
    'import { SOFTWARE_ENGINEERING_COVERAGE } from "./lib/software-engineering/coverage.ts";',
    'import { SOFTWARE_ENGINEERING_LOCALES, SOFTWARE_ENGINEERING_LESSON_SLUGS, SOFTWARE_ENGINEERING_QUESTION_IDS, SOFTWARE_ENGINEERING_MEDIA_IDS } from "./lib/software-engineering/types.ts";',
    "process.stdout.write(JSON.stringify({manifest:SOFTWARE_ENGINEERING_COURSE_MANIFEST,sources:SOFTWARE_ENGINEERING_SOURCES,media:SOFTWARE_ENGINEERING_MEDIA,quiz:SOFTWARE_ENGINEERING_QUIZ,finalQuiz:SOFTWARE_ENGINEERING_FINAL_QUIZ,capstone:SOFTWARE_ENGINEERING_CAPSTONE,coverage:SOFTWARE_ENGINEERING_COVERAGE,locales:SOFTWARE_ENGINEERING_LOCALES,lessonIds:SOFTWARE_ENGINEERING_LESSON_SLUGS,questionIds:SOFTWARE_ENGINEERING_QUESTION_IDS,mediaIds:SOFTWARE_ENGINEERING_MEDIA_IDS}));",
  ].join(" ");
  // Use Node's loader hook instead of the tsx CLI. The CLI allocates an IPC
  // socket that the normal deterministic-build sandbox intentionally denies.
  const result = spawnSync(process.execPath, [
    "--import",
    "tsx",
    "--input-type=module",
    "--eval",
    expression,
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    fail(`Course 8 TypeScript ledgers could not be imported: ${result.error?.message || result.stderr.trim() || `exit ${result.status}`}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`Course 8 ledger output was not JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function pngDimensions(buffer, label) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${label} is not a valid PNG`);
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function webpDimensions(buffer, label) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    fail(`${label} is not a valid WebP`);
    return null;
  }
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (chunk === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const b0 = buffer[21]; const b1 = buffer[22]; const b2 = buffer[23]; const b3 = buffer[24];
    return { width: 1 + b0 + ((b1 & 0x3f) << 8), height: 1 + (b1 >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10) };
  }
  fail(`${label} uses unsupported WebP chunk ${chunk}`);
  return null;
}

function validateAsset(path, expectedHash, width, height, kind) {
  const absolute = join(ROOT, "public", String(path).replace(/^\//, ""));
  if (!existsSync(absolute)) {
    fail(`Missing media asset ${path}`);
    return;
  }
  const buffer = readFileSync(absolute);
  const dimensions = kind === "png" ? pngDimensions(buffer, path) : webpDimensions(buffer, path);
  if (dimensions && (dimensions.width !== width || dimensions.height !== height)) {
    fail(`${path} dimensions ${dimensions.width}x${dimensions.height} differ from ${width}x${height}`);
  }
  const digest = sha256(buffer);
  if (digest !== expectedHash) fail(`${path} SHA-256 ${digest} differs from ${expectedHash}`);
}

function validateLocales() {
  const copies = new Map();
  for (const locale of EXPECTED_LOCALES) {
    const rootCopy = readJson(`messages/${locale}.json`);
    const catalogMeta = rootCopy?.["c.softwareEngineering.meta"];
    nonempty(catalogMeta, `${locale} catalog metadata`);
    const normalizedCatalogMeta = String(catalogMeta).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    if (!normalizedCatalogMeta.includes(String(EXPECTED_MEDIA.length))) {
      fail(`${locale} catalog metadata must report ${EXPECTED_MEDIA.length} authentic figures`);
    }

    const copy = readJson(`messages/software-engineering/${locale}.json`);
    if (!copy) continue;
    copies.set(locale, copy);
    sameSet(Object.keys(copy), ["meta", "ui", "units", "lessons"], `${locale} top-level copy keys`);
    sameSet(Object.keys(copy.units || {}), EXPECTED_UNITS, `${locale} unit keys`);
    sameSet(Object.keys(copy.lessons || {}), EXPECTED_LESSONS, `${locale} lesson keys`);
    walkStrings(copy, locale, (value, label) => {
      nonempty(value, label);
      if (/\b(?:TODO|TBD|PLACEHOLDER)\b|�/iu.test(value)) fail(`${label} contains placeholder text`);
    });
  }
  const english = copies.get("en");
  if (!english) return;
  const englishFlat = flatten(english);
  const reviewedIdenticalKeys = new Set([
    "fr:ui.minutes",
    "fr:ui.source",
    "fr:ui.sources",
    "fr:ui.correct",
    "fr:ui.licence",
  ]);
  for (const [locale, copy] of copies) {
    const own = flatten(copy);
    sameSet([...own.keys()], [...englishFlat.keys()], `${locale} locale leaf shape`);
    if (locale !== "en") {
      const identical = [...own].filter(([key, value]) => (
        value === englishFlat.get(key)
        && !/\b(?:CI\/CD|Git)\b/.test(String(value))
        && !reviewedIdenticalKeys.has(`${locale}:${key}`)
      ));
      if (identical.length) fail(`${locale} has unreviewed values identical to English: ${identical.slice(0, 8).map(([key]) => key).join(", ")}`);
    }
  }
}

function validateManifest(data) {
  const { manifest, sources, media, quiz, finalQuiz, capstone, coverage } = data;
  if (manifest.id !== "software-engineering-with-agentic-ai") fail(`Unexpected course id ${manifest.id}`);
  if (manifest.sequence !== 8) fail(`Course sequence must be 8; found ${manifest.sequence}`);
  if (manifest.version !== "1.0.1") fail(`Course manifest version must be 1.0.1; found ${manifest.version}`);
  if (manifest.publishedOn !== SNAPSHOT_ON || manifest.sourceSnapshotOn !== SNAPSHOT_ON) fail("Course publication/source snapshot date drift");
  if (manifest.contentLocale !== "en") fail("Course contentLocale must honestly remain en for this edition");
  if (manifest.progressMilestones !== 20) fail(`Progress milestones must be 20; found ${manifest.progressMilestones}`);
  sameSet(data.locales, EXPECTED_LOCALES, "locale contract");
  sameSet(data.lessonIds, EXPECTED_LESSONS, "lesson type contract");
  sameSet(data.mediaIds, EXPECTED_MEDIA, "media type contract");

  if (!Array.isArray(manifest.units) || manifest.units.length !== 5) fail("Manifest must contain exactly five units");
  else {
    manifest.units.forEach((unit, index) => {
      if (unit.id !== EXPECTED_UNITS[index] || unit.order !== index + 1) fail(`Unit ${index + 1} order/id mismatch`);
    });
    sameSet(manifest.units.flatMap((unit) => unit.lessonSlugs || []), EXPECTED_LESSONS, "unit lesson allocation");
  }

  if (!Array.isArray(manifest.lessons) || manifest.lessons.length !== 18) fail("Manifest must contain exactly eighteen lessons");
  else manifest.lessons.forEach((lesson, index) => {
    const label = `lesson ${lesson?.slug || index}`;
    if (lesson.slug !== EXPECTED_LESSONS[index] || lesson.order !== index + 1) fail(`${label} is not in canonical order`);
    if (!EXPECTED_UNITS.includes(lesson.unitId)) fail(`${label} has unknown unit ${lesson.unitId}`);
    if (!Number.isInteger(lesson.minutes) || lesson.minutes < 30 || lesson.minutes > 180) fail(`${label} has implausible duration`);
    for (const key of ["title", "kicker", "summary", "objective", "takeaway"]) nonempty(lesson[key], `${label}.${key}`);
    if (!Array.isArray(lesson.concepts) || lesson.concepts.length < 6) fail(`${label} must teach at least six explicit concepts`);
    if (!Array.isArray(lesson.sections) || lesson.sections.length !== 3) fail(`${label} must contain exactly three substantive sections`);
    else lesson.sections.forEach((section, sectionIndex) => {
      nonempty(section.heading, `${label}.sections[${sectionIndex}].heading`);
      if (!Array.isArray(section.paragraphs) || section.paragraphs.length < 2) fail(`${label}.sections[${sectionIndex}] needs at least two paragraphs`);
    });
    if (!lesson.practice || !Array.isArray(lesson.practice.steps) || lesson.practice.steps.length < 4) fail(`${label} practice needs at least four steps`);
    if (!lesson.practice || !Array.isArray(lesson.practice.evidence) || lesson.practice.evidence.length < 3) fail(`${label} practice needs at least three evidence items`);
    if (!lesson.checkpoint || !Array.isArray(lesson.checkpoint.options) || lesson.checkpoint.options.length !== 4) fail(`${label} checkpoint must have four options`);
    if (!lesson.sourceIds?.length) fail(`${label} has no sources`);
    if (!Array.isArray(lesson.mediaIds)) fail(`${label} mediaIds must be an array`);
  });
  sameSet(
    [...new Set((manifest.lessons || []).flatMap((lesson) => lesson.mediaIds || []))],
    EXPECTED_MEDIA,
    "lesson media coverage",
  );

  if (!Array.isArray(sources) || sources.length < 30) fail("Source ledger must contain at least thirty records");
  const sourceIds = new Set();
  for (const source of sources || []) {
    if (sourceIds.has(source.id)) fail(`Duplicate source ${source.id}`);
    sourceIds.add(source.id);
    for (const key of ["id", "title", "publisher", "licence", "evidenceUse", "caveat"]) nonempty(source[key], `source ${source.id}.${key}`);
    if (!/^https:\/\//.test(source.url || "")) fail(`Source ${source.id} must use HTTPS`);
    if (source.accessedOn !== SNAPSHOT_ON) fail(`Source ${source.id} verification date drift`);
  }
  for (const id of [
    "openai-academy-codex-builders",
    "openai-academy-codex-bootcamp",
    "anthropic-academy-code-tutorials",
    "anthropic-code-best-practices",
    "anthropic-code-hooks",
    "swebok-v4",
    "sei-quality-attribute-scenarios",
    "scrum-guide-2020",
    "human-eval-pass-at-k",
    "tau-bench-pass-power-k",
    "green-software-sci",
  ]) {
    if (!sourceIds.has(id)) fail(`Missing key source ${id}`);
  }
  const sourceById = new Map((sources || []).map((source) => [source.id, source]));
  if (sourceById.get("slsa-provenance")?.licence !== "Community Specification License 1.0") fail("SLSA provenance licence must be Community Specification License 1.0");
  if (sourceById.get("swe-chat")?.kind !== "research-preprint") fail("SWE-chat must remain classified as a research preprint until a venue record is verified");
  if (sourceById.get("owasp-llm-top10")?.kind !== "practitioner-guide") fail("OWASP LLM Top 10 must remain classified as practitioner guidance");
  for (const lesson of manifest.lessons || []) for (const id of lesson.sourceIds || []) if (!sourceIds.has(id)) fail(`${lesson.slug} references unknown source ${id}`);

  if (!Array.isArray(media) || media.length !== 9) fail("Media ledger must contain exactly nine available figures");
  sameSet((media || []).map((entry) => entry.id), EXPECTED_MEDIA, "media ledger ids");
  const products = new Set();
  for (const figure of media || []) {
    products.add(figure.product);
    if (!figure.privacyReviewed) fail(`${figure.id} lacks privacy review`);
    for (const key of ["alt", "caption", "rightsNote", "sourceUrl", "licenceUrl", "provenance"]) nonempty(figure[key], `${figure.id}.${key}`);
    if (!Array.isArray(figure.transcript) || figure.transcript.length < 3) fail(`${figure.id} needs a text-equivalent transcript`);
    if (new Set(figure.transcript || []).size !== (figure.transcript || []).length) fail(`${figure.id} transcript contains duplicate lines`);
    if (figure.provenance === "licensed-repository") {
      nonempty(figure.immutableSourceUrl, `${figure.id}.immutableSourceUrl`);
      if (!/^[a-f0-9]{40}$/.test(figure.sourceCommit || "")) fail(`${figure.id} source commit must be a full SHA-1`);
      if (!new Set(["Apache-2.0", "MIT", "CC-BY-4.0"]).has(figure.licence)) fail(`${figure.id} has an invalid repository-asset licence`);
    } else if (figure.provenance === "course-authored-capture") {
      if (figure.sourceCommit !== undefined || figure.immutableSourceUrl !== undefined) fail(`${figure.id} must not invent an upstream commit or immutable repository URL for a course-authored capture`);
      if (figure.licence !== "Editorial capture") fail(`${figure.id} must use the Editorial capture rights classification`);
      if (!/course-authored capture/i.test(`${figure.caption} ${figure.rightsNote}`)) fail(`${figure.id} must disclose course-authored capture provenance`);
    } else {
      fail(`${figure.id} has an unknown provenance class`);
    }
    if (!/^[a-f0-9]{64}$/.test(figure.sha256 || "") || !/^[a-f0-9]{64}$/.test(figure.webpSha256 || "")) fail(`${figure.id} has invalid SHA-256 format`);
    if (/permission-required|capture-required/i.test(JSON.stringify(figure))) fail(`${figure.id} has a non-release media status`);
    validateAsset(figure.src, figure.sha256, figure.width, figure.height, "png");
    validateAsset(figure.webpSrc, figure.webpSha256, figure.webpWidth, figure.webpHeight, "webp");
    for (const slug of figure.lessonSlugs || []) if (!EXPECTED_LESSONS.includes(slug)) fail(`${figure.id} references unknown lesson ${slug}`);
  }
  if (!products.has("OpenAI Codex") || !products.has("Claude")) fail("Course 8 must contain authentic Codex and Claude UI figures");
  if ((media || []).filter((figure) => figure.product === "Claude").length !== 2) fail("Course 8 must contain exactly two privacy-reviewed real Claude UI captures");
  if ((media || []).some((figure) => figure.id === "claude-session-ui")) fail("The privacy-incompatible Claude Platform session must not be published in Course 8");

  if (!Array.isArray(quiz) || quiz.length !== 25) fail("Question bank must contain exactly 25 questions");
  sameSet((quiz || []).map((question) => question.id), data.questionIds, "quiz question ids");
  for (const unitId of EXPECTED_UNITS) if ((quiz || []).filter((question) => question.unitId === unitId).length !== 5) fail(`Quiz must contain five ${unitId} questions`);
  for (const question of quiz || []) {
    if (!Array.isArray(question.options) || question.options.length !== 4) fail(`${question.id} must have four options`);
    if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) fail(`${question.id} correctIndex is invalid`);
    for (const id of question.sourceIds || []) if (!sourceIds.has(id)) fail(`${question.id} references unknown source ${id}`);
  }
  if (finalQuiz.bankVersion !== "2") fail(`Final assessment bank version must be 2; found ${finalQuiz.bankVersion}`);
  if (finalQuiz.bankSize !== 25 || finalQuiz.questionCount !== 15 || finalQuiz.questionsPerUnit !== 3 || finalQuiz.passingCorrectAnswers !== 12) fail("Final assessment must be 25-bank / 15-attempt / 3-per-unit / pass-12");

  if (!capstone || capstone.artifacts?.length !== 8) fail("Capstone must contain exactly eight artifacts");
  if (capstone.rubric?.reduce((sum, row) => sum + row.weight, 0) !== 100 || capstone.totalPoints !== 100 || capstone.passingScore !== 80) fail("Capstone rubric must total 100 and pass at 80");
  if (!/local self-attested progress checklist/i.test(capstone.validationBoundary || "") || !/does not .*validate/i.test(capstone.validationBoundary || "") || !/never authorizes/i.test(capstone.validationBoundary || "")) fail("Capstone UI must disclose its local self-attestation and non-authorization boundary");
  sameSet(capstone.releaseDecisions || [], ["release", "release-with-conditions", "do-not-release"], "capstone release decisions");
  for (const artifact of capstone.artifacts || []) for (const id of artifact.sourceIds || []) if (!sourceIds.has(id)) fail(`${artifact.id} references unknown source ${id}`);

  if (!Array.isArray(coverage) || coverage.length !== 18) fail("SWEBOK coverage contract must contain exactly eighteen knowledge areas");
  sameSet((coverage || []).map((row) => row.area), EXPECTED_SWEBOK_AREAS, "SWEBOK v4.0a knowledge areas");
  const quizIds = new Set((quiz || []).map((question) => question.id));
  const artifactIds = new Set((capstone.artifacts || []).map((artifact) => artifact.id));
  for (const row of coverage || []) {
    if (!row.lessonSlugs?.length || !row.requiredConcepts?.length || !row.assessmentQuestionIds?.length || !row.capstoneArtifactIds?.length) fail(`Coverage row ${row.area} is incomplete`);
    for (const slug of row.lessonSlugs || []) if (!EXPECTED_LESSONS.includes(slug)) fail(`Coverage row ${row.area} references unknown lesson ${slug}`);
    for (const id of row.assessmentQuestionIds || []) if (!quizIds.has(id)) fail(`Coverage row ${row.area} references unknown question ${id}`);
    for (const id of row.capstoneArtifactIds || []) if (!artifactIds.has(id)) fail(`Coverage row ${row.area} references unknown capstone artifact ${id}`);
  }
}

function validateFiles() {
  const required = [
    "app/[locale]/software-engineering/page.tsx",
    "app/[locale]/software-engineering/[lesson]/page.tsx",
    "components/software-engineering/CourseDashboard.tsx",
    "components/software-engineering/LessonView.tsx",
    "components/software-engineering/FinalAssessment.tsx",
    "components/software-engineering/CapstoneEvidence.tsx",
    "lib/software-engineering/types.ts",
    "lib/software-engineering/manifest.ts",
    "lib/software-engineering/sources.ts",
    "lib/software-engineering/figures.ts",
    "lib/software-engineering/quiz.ts",
    "lib/software-engineering/capstone.ts",
    "public/courses/software-engineering/NOTICE.md",
    "public/courses/software-engineering/agentic-se-capstone-brief.md",
    "outputs/software-engineering-agentic-ai-research-brief.md",
    "outputs/software-engineering-agentic-ai-research-brief.provenance.md",
    "outputs/software-engineering-figure-rights-clearance.md",
    "tests/software-engineering-course.spec.ts",
  ];
  for (const path of required) if (!existsSync(join(ROOT, path))) fail(`Missing required Course 8 file ${path}`);

  const textFiles = [
    ...required.filter((path) => existsSync(join(ROOT, path)) && !/\.(?:png|webp)$/.test(path)),
    ...EXPECTED_LOCALES.map((locale) => `messages/software-engineering/${locale}.json`),
  ];
  for (const path of textFiles) {
    const value = readFileSync(join(ROOT, path), "utf8");
    if (/\/Users\/[A-Za-z0-9._-]+|\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,})\b/.test(value)) fail(`${path} contains a private path or credential-like token`);
  }

  if (RELEASE) {
    const integrations = [
      ["lib/courses.ts", /software-engineering/],
      ["lib/seo.ts", /software-engineering/],
      ["app\/\[locale\]\/courses\/page.tsx", /software-engineering/],
      ["app/sitemap.ts", /PAGES|software-engineering/],
      ["package.json", /software-engineering:check:release/],
    ];
    for (const [path, pattern] of integrations) {
      const normalized = path.replaceAll("\\/", "/");
      if (!existsSync(join(ROOT, normalized)) || !pattern.test(readFileSync(join(ROOT, normalized), "utf8"))) fail(`Release integration missing from ${normalized}`);
    }
  }

  const directory = join(ROOT, "public", "courses", "software-engineering", "figures");
  if (existsSync(directory)) {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isFile() && ![".png", ".webp"].includes(extname(name))) warn(`Unexpected Course 8 figure file ${name}`);
    }
  }
}

validateLocales();
validateFiles();
const ledgers = loadLedgers();
if (ledgers) validateManifest(ledgers);

const result = {
  course: "software-engineering",
  mode: RELEASE ? "release" : "development",
  snapshotOn: SNAPSHOT_ON,
  status: errors.length ? "FAIL" : "PASS",
  errors,
  warnings,
};

if (JSON_ONLY) process.stdout.write(`${JSON.stringify(result)}\n`);
else {
  console.log(`Course 8 software-engineering check: ${result.status}`);
  console.log(`Mode: ${result.mode}`);
  console.log(`Contract: 5 units · 18 lessons · 25-question bank · 8 capstone artifacts · 9 authentic figures`);
  for (const message of warnings) console.log(`WARN: ${message}`);
  for (const message of errors) console.error(`ERROR: ${message}`);
}

process.exitCode = errors.length ? 1 : 0;
