#!/usr/bin/env node

/**
 * Deterministic offline quality and release gate for Course 12.
 *
 *   node --import tsx scripts/check-claude-income-course.mjs
 *   node --import tsx scripts/check-claude-income-course.mjs --release
 *   node --import tsx scripts/check-claude-income-course.mjs --json
 */

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectReleaseGateWiring } from "./release-gate-wiring.mjs";

import {
  CLAUDE_INCOME_CAPSTONE,
  CLAUDE_INCOME_COURSE,
  CLAUDE_INCOME_FIGURES,
  CLAUDE_INCOME_FINAL_QUIZ,
  CLAUDE_INCOME_LOCALES,
  CLAUDE_INCOME_QUIZ_BANK,
  CLAUDE_INCOME_SOURCES,
  validateClaudeIncomeCourse,
} from "../lib/claude-income/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = resolve(ROOT, "public");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");
const errors = [];
const warnings = [];
const notes = [];
const fail = (message) => errors.push(message);
const note = (message) => notes.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

const REQUIRED_FILES = [
  "app/[locale]/claude-income/page.tsx",
  "app/[locale]/claude-income/[lesson]/page.tsx",
  "components/claude-income/CourseDashboard.tsx",
  "components/claude-income/CourseFigure.tsx",
  "components/claude-income/LessonView.tsx",
  "components/claude-income/ClaudeIncomeCourse.module.css",
  "lib/claude-income/capstone.ts",
  "lib/claude-income/curriculum.ts",
  "lib/claude-income/figures.ts",
  "lib/claude-income/index.ts",
  "lib/claude-income/quiz.ts",
  "lib/claude-income/seo.ts",
  "lib/claude-income/sources.ts",
  "lib/claude-income/types.ts",
  "lib/claude-income/validate.ts",
  "outputs/claude-income-curriculum-draft.md",
  "outputs/claude-income-media-audit.md",
  "outputs/claude-income-research-brief.md",
  "outputs/claude-income-research-brief.provenance.md",
  "outputs/claude-income-release-audit.md",
  "outputs/claude-income-source-verification.md",
  "outputs/claude-income-source-verification.provenance.md",
  "public/courses/claude-income/NOTICE.md",
  "public/courses/claude-income/media-manifest.json",
  "public/courses/claude-income/repository-rights-manifest.json",
  "tests/claude-income-course.spec.ts",
];

function regularFile(path, label = rel(path)) {
  if (!existsSync(path)) {
    fail(`${label}: required file is missing`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${label}: expected a regular non-symbolic file`);
    return false;
  }
  return true;
}

function readJson(path, label = rel(path)) {
  if (!regularFile(path, label)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label}: invalid JSON (${error.message})`);
    return null;
  }
}

function assetPath(rootRelativePath, label) {
  if (typeof rootRelativePath !== "string" || !rootRelativePath.startsWith("/")) {
    fail(`${label}: asset path must be root-relative`);
    return null;
  }
  const path = resolve(PUBLIC_ROOT, `.${rootRelativePath}`);
  if (path !== PUBLIC_ROOT && !path.startsWith(`${PUBLIC_ROOT}${sep}`)) {
    fail(`${label}: asset path escapes public/`);
    return null;
  }
  return path;
}

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pngInfo(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) return null;
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const size = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const next = offset + 12 + size;
    if (next > bytes.length) return null;
    chunks.push(type);
    offset = next;
    if (type === "IEND") break;
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), chunks };
}

function webpInfo(bytes) {
  if (bytes.length < 20 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunks = [];
  let offset = 12;
  let dimensions = null;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > bytes.length) return null;
    chunks.push(type);
    if (type === "VP8X" && size >= 10) {
      dimensions = { width: 1 + bytes.readUIntLE(data + 4, 3), height: 1 + bytes.readUIntLE(data + 7, 3) };
    } else if (type === "VP8 " && size >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
      dimensions = { width: bytes.readUInt16LE(data + 6) & 0x3fff, height: bytes.readUInt16LE(data + 8) & 0x3fff };
    } else if (type === "VP8L" && size >= 5 && bytes[data] === 0x2f) {
      const bits = bytes.readUInt32LE(data + 1);
      dimensions = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    offset = data + size + (size % 2);
  }
  return dimensions ? { ...dimensions, chunks } : null;
}

function checkImage(path, expected, kind) {
  if (!regularFile(path)) return;
  const bytes = readFileSync(path);
  const info = kind === "png" ? pngInfo(bytes) : webpInfo(bytes);
  if (!info) {
    fail(`${rel(path)}: unreadable ${kind.toUpperCase()} image`);
    return;
  }
  if (info.width !== expected.width || (expected.height && info.height !== expected.height)) {
    fail(`${rel(path)}: decoded ${info.width}x${info.height}, expected ${expected.width}x${expected.height ?? "*"}`);
  }
  if (hash(bytes) !== expected.sha256) fail(`${rel(path)}: SHA-256 does not match the manifest`);
  const forbidden = kind === "png" ? ["tEXt", "zTXt", "iTXt", "eXIf"] : ["EXIF", "XMP "];
  const metadata = info.chunks.filter((chunk) => forbidden.includes(chunk));
  if (metadata.length) fail(`${rel(path)}: embedded metadata chunks remain (${metadata.join(", ")})`);
}

function checkFigures() {
  const mediaPath = resolve(ROOT, "public/courses/claude-income/media-manifest.json");
  const media = readJson(mediaPath);
  if (!media) return;
  if (media.thirdPartyRepositoryAssets?.length || media.xMediaAssets?.length) {
    fail("Course 12 must not redistribute repository or X media without a separate rights record");
  }
  if (media.privacyReview !== "passed" || media.metadataStripped !== true) {
    fail("Media manifest must record passed privacy review and stripped metadata");
  }
  for (const figure of CLAUDE_INCOME_FIGURES) {
    if (figure.privacyReview !== "passed" || figure.rightsStatus !== "course-authored-capture") {
      fail(`${figure.id}: privacy or capture-rights gate is incomplete`);
    }
    const record = media.figures?.find((item) => item.id === figure.id);
    if (!record) fail(`${figure.id}: absent from media-manifest.json`);
    else if (record.master.sha256 !== figure.sha256 || record.master.width !== figure.width || record.master.height !== figure.height) {
      fail(`${figure.id}: TypeScript and JSON media manifests disagree`);
    }

    const master = assetPath(figure.src, `${figure.id}.src`);
    if (master) checkImage(master, figure, "png");
    for (const variant of figure.variants) {
      const path = assetPath(variant.src, `${figure.id}.variant`);
      const manifestVariant = record?.variants?.find(
        (item) => `/courses/claude-income/${item.path}` === variant.src,
      );
      if (!manifestVariant) {
        fail(`${figure.id}: ${variant.src} is absent from media-manifest.json`);
        if (path) checkImage(path, variant, "webp");
      } else {
        if (manifestVariant.width !== variant.width || manifestVariant.sha256 !== variant.sha256) {
          fail(`${figure.id}: ${variant.src} disagrees between TypeScript and JSON manifests`);
        }
        if (path) checkImage(path, manifestVariant, "webp");
      }
    }
  }
}

function checkSourceAndClaimBoundary() {
  const xSources = CLAUDE_INCOME_SOURCES.filter((source) => source.kind === "x-post");
  if (!xSources.length) fail("Course 12 requires attributed practitioner evidence");
  for (const source of xSources) {
    if (source.rightsStatus !== "link-only" || source.claimClass !== "practitioner-report") {
      fail(`${source.id}: practitioner evidence must remain link-only and self-report class`);
    }
  }
  const sourceText = readFileSync(resolve(ROOT, "lib/claude-income/sources.ts"), "utf8");
  if (/remotion-dev\/skills/.test(sourceText)) fail("Unlicensed Remotion Skill material must not be included");
  const mediaFiles = readFileSync(resolve(ROOT, "public/courses/claude-income/NOTICE.md"), "utf8");
  const normalizedMediaNotice = mediaFiles.replace(/\s+/g, " ");
  if (!mediaFiles.includes("No GitHub repository media") || !mediaFiles.includes("no X post media")) {
    fail("NOTICE.md must state that GitHub and X media are not redistributed");
  }
  for (const phrase of [
    "Claude and Anthropic are trademarks of Anthropic PBC",
    "not affiliated with, sponsored by, or endorsed by Anthropic",
    "course-authored screen captures",
  ]) {
    if (!normalizedMediaNotice.includes(phrase)) fail(`NOTICE.md is missing required rights wording: ${phrase}`);
  }

  const courseText = JSON.stringify(CLAUDE_INCOME_COURSE);
  for (const phrase of [
    "Free users can create up to five Projects",
    "Research is available on paid Claude plans",
    "Code execution and file creation to be enabled",
    "Code execution and file creation must be enabled for Artifacts",
    "Cowork sessions run in Anthropic's cloud",
    "Skip all approvals does not check actions",
    "does not identify the payment provider or establish a refund outcome",
    "does not itself establish any Claude contribution",
    "starting 2026-08-14",
    "50% off eligible token usage",
    "not a 50% reduction in total business cost",
    "prior written and explicit X approval",
    "only as between Anthropic and the customer and to the extent permitted by applicable law",
  ]) {
    if (!courseText.includes(phrase)) fail(`Volatile correction is missing from course copy: ${phrase}`);
  }

  const rights = readJson(resolve(ROOT, "public/courses/claude-income/repository-rights-manifest.json"));
  if (!rights) return;
  if (!Array.isArray(rights.redistributedRepositoryAssets) || rights.redistributedRepositoryAssets.length !== 0) {
    fail("Repository rights manifest must record zero redistributed repository assets");
  }
  const repositorySources = CLAUDE_INCOME_SOURCES.filter(
    (source) => source.kind === "github" || source.kind === "case-study",
  );
  for (const source of repositorySources) {
    const record = rights.repositories?.find((item) => item.sourceId === source.id);
    if (!record) {
      fail(`${source.id}: absent from repository-rights-manifest.json`);
      continue;
    }
    if (record.immutableCommit !== source.pinnedRevision || !/^[a-f0-9]{40}$/.test(record.immutableCommit ?? "")) {
      fail(`${source.id}: immutable revision is missing or disagrees with the source ledger`);
    }
    if (!source.immutableUrl?.startsWith("https://github.com/") || !source.immutableUrl.includes(source.pinnedRevision)) {
      fail(`${source.id}: UI permalink must contain the immutable revision`);
    }
    if (!record.inspectedPath || !record.licenseFinding || !record.courseUse || !record.noticeAndModification) {
      fail(`${source.id}: repository rights record is incomplete`);
    }
  }
  for (const id of ["x-degensing", "x-samrags", "x-adiix-caution"]) {
    const source = CLAUDE_INCOME_SOURCES.find((item) => item.id === id);
    if (!source || source.evidenceGrade !== "D") fail(`${id}: currently unreproducible X evidence must remain Grade D`);
  }
  if (!rights.excluded?.some((item) => item.repository === "https://github.com/remotion-dev/skills")) {
    fail("Repository rights manifest must record the unlicensed Remotion source exclusion");
  }
}

function checkImplementationBoundary() {
  const routeFiles = [
    "app/[locale]/claude-income/page.tsx",
    "app/[locale]/claude-income/[lesson]/page.tsx",
  ];
  const componentRoot = resolve(ROOT, "components/claude-income");
  const componentFiles = existsSync(componentRoot)
    ? readdirSync(componentRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name))
      .map((entry) => `components/claude-income/${entry.name}`)
    : [];
  const files = [...routeFiles, ...componentFiles];
  for (const name of files) {
    const path = resolve(ROOT, name);
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf8");
    if (/\bsrc\s*=\s*["']https?:\/\//i.test(source)) fail(`${name}: remote media is prohibited`);
    if (/claude\.lesson\.|startsWith\(["']claude\./.test(source)) fail(`${name}: Course 3 progress namespace leaked into Course 12`);
  }
  const allComponentText = componentFiles.length
    ? componentFiles.map((name) => readFileSync(resolve(ROOT, name), "utf8")).join("\n")
    : "";
  if (allComponentText && !allComponentText.includes("claude-income.")) {
    fail("Course 12 UI does not expose its isolated progress namespace");
  }
  for (const name of [
    "components/claude-income/CourseDashboard.tsx",
    "components/claude-income/LessonView.tsx",
  ]) {
    const source = readFileSync(resolve(ROOT, name), "utf8");
    if (!source.includes("course.independentProjectNotice")) {
      fail(`${name}: full independent-project notice is not rendered`);
    }
  }
  for (const name of [
    "components/claude-income/CourseDashboard.tsx",
    "components/claude-income/LessonView.tsx",
    "components/claude-income/FinalQuiz.tsx",
  ]) {
    const source = readFileSync(resolve(ROOT, name), "utf8");
    if (!source.includes("getClaudeIncomeSourceHref")) {
      fail(`${name}: source links do not use immutable repository permalinks`);
    }
  }
}

function checkRepositoryIntegrationBoundary() {
  // Keep this scoped gate independent from every other course's runtime
  // imports. The end-to-end static-export gate separately inspects the
  // generated sitemap; here we verify the source contracts that feed it.
  const sitemapSource = readFileSync(resolve(ROOT, "app/sitemap.ts"), "utf8");
  const courseBranchAt = sitemapSource.indexOf('page === "claude-income/"');
  const defaultOnlyAt = sitemapSource.indexOf("? [DEFAULT_LOCALE]", courseBranchAt);
  const allLocalesAt = sitemapSource.indexOf(": LOCALE_CODES", courseBranchAt);
  if (courseBranchAt < 0
    || !sitemapSource.slice(courseBranchAt, defaultOnlyAt).includes('page.startsWith("claude-income/")')
    || defaultOnlyAt < 0
    || allLocalesAt < 0
    || defaultOnlyAt > allLocalesAt) {
    fail("Sitemap must limit the Course 12 dashboard and lesson routes to DEFAULT_LOCALE");
  }

  const seoSource = readFileSync(resolve(ROOT, "lib/seo.ts"), "utf8");
  const lessonBlock = seoSource.match(
    /export const CLAUDE_INCOME_LESSON_PAGES = \[([\s\S]*?)\] as const;/,
  )?.[1] ?? "";
  const publishedLessonPages = [...lessonBlock.matchAll(/["'](claude-income\/[^"']+\/)['"]/g)]
    .map((match) => match[1]);
  const expectedLessonPages = CLAUDE_INCOME_COURSE.lessons.map(
    (lesson) => `claude-income/${lesson.slug}/`,
  );
  if (publishedLessonPages.length !== expectedLessonPages.length
    || publishedLessonPages.some((page, index) => page !== expectedLessonPages[index])) {
    fail(`Sitemap source must register the ${expectedLessonPages.length} Course 12 lessons in curriculum order`);
  }
  const pagesBlock = seoSource.match(/export const PAGES = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  if (!pagesBlock.includes('"claude-income/"')
    || !pagesBlock.includes("...CLAUDE_INCOME_LESSON_PAGES")) {
    fail("Sitemap source must register the Course 12 dashboard and lesson-page collection");
  }

  const packageJson = readJson(resolve(ROOT, "package.json"));
  for (const scriptName of ["build", "build:release"]) {
    const wiring = inspectReleaseGateWiring(
      packageJson?.scripts,
      scriptName,
      "claude-income:check:release",
    );
    if (!wiring.releaseBeforeBuild) {
      fail(`package.json ${scriptName} must run the Course 12 release gate before next build`);
    }
  }

  const catalogSource = readFileSync(resolve(ROOT, "components/courses/Catalog.tsx"), "utf8");
  if (!catalogSource.includes("c.claude-income.contentLanguage")) {
    fail("Course catalog does not disclose the English-only Course 12 body");
  }
  for (const locale of CLAUDE_INCOME_LOCALES) {
    const messages = readJson(resolve(ROOT, `messages/${locale}.json`));
    if (typeof messages?.["c.claude-income.contentLanguage"] !== "string"
      || !messages["c.claude-income.contentLanguage"].trim()) {
      fail(`${locale}: missing localized Course 12 content-language disclosure`);
    }
  }
}

function checkCurriculumReleaseDocument() {
  const path = resolve(ROOT, "outputs/claude-income-curriculum-draft.md");
  if (!regularFile(path)) return;
  const normalized = readFileSync(path, "utf8").replace(/\s+/g, " ");
  if (!normalized.includes("895 minutes")) {
    fail("Curriculum release document does not state the exact 895-minute contract");
  }
  for (const unit of CLAUDE_INCOME_COURSE.units) {
    if (!normalized.includes(unit.title)) fail(`Curriculum release document is missing unit title: ${unit.title}`);
  }
  for (const lesson of CLAUDE_INCOME_COURSE.lessons) {
    const titleAt = normalized.indexOf(lesson.title);
    if (titleAt < 0) {
      fail(`Curriculum release document is missing lesson title: ${lesson.title}`);
      continue;
    }
    const nearby = normalized.slice(titleAt, titleAt + lesson.title.length + 180);
    if (!nearby.includes(`${lesson.minutes} minutes`)) {
      fail(`Curriculum release document does not pair ${lesson.title} with ${lesson.minutes} minutes`);
    }
  }
}

function checkReleaseRecord() {
  const releasePath = resolve(ROOT, "outputs/claude-income-release-audit.md");
  if (!regularFile(releasePath)) return;
  const text = readFileSync(releasePath, "utf8");
  const unchecked = text.match(/^- \[ \]/gm) ?? [];
  if (unchecked.length) fail(`Release audit has ${unchecked.length} unchecked gates`);
  if (RELEASE && !text.includes("Release decision: PASS")) fail("Release audit does not record PASS");
}

function main() {
  REQUIRED_FILES.forEach((name) => regularFile(resolve(ROOT, name), name));
  validateClaudeIncomeCourse().forEach(fail);
  checkFigures();
  checkSourceAndClaimBoundary();
  checkImplementationBoundary();
  checkRepositoryIntegrationBoundary();
  checkCurriculumReleaseDocument();
  checkReleaseRecord();

  if (CLAUDE_INCOME_COURSE.displayNumber !== 12) fail("Course ordinal must be 12");
  if (CLAUDE_INCOME_FINAL_QUIZ.questionCount !== 16 || CLAUDE_INCOME_FINAL_QUIZ.passingCorrectAnswers !== 13) {
    fail("Final assessment must use the 16-question, 13-correct contract");
  }
  if (CLAUDE_INCOME_CAPSTONE.criteria.reduce((sum, item) => sum + item.points, 0) !== 100) {
    fail("Capstone rubric does not total 100 points");
  }
  if (CLAUDE_INCOME_QUIZ_BANK.filter((question) => question.critical).length < 4) {
    fail("Final assessment bank lacks critical-boundary items");
  }

  note(`${CLAUDE_INCOME_COURSE.lessons.length} lessons in ${CLAUDE_INCOME_COURSE.units.length} units`);
  note(`${CLAUDE_INCOME_FIGURES.length} real Claude UI figures with local derivatives`);
  note(`${CLAUDE_INCOME_SOURCES.length} sources and ${CLAUDE_INCOME_QUIZ_BANK.length} scenario questions`);

  const status = errors.length ? "FAIL" : warnings.length ? "WARN" : "PASS";
  const summary = {
    courseId: CLAUDE_INCOME_COURSE.id,
    displayNumber: CLAUDE_INCOME_COURSE.displayNumber,
    mode: RELEASE ? "release" : "development",
    status,
    counts: {
      units: CLAUDE_INCOME_COURSE.units.length,
      lessons: CLAUDE_INCOME_COURSE.lessons.length,
      figures: CLAUDE_INCOME_FIGURES.length,
      sources: CLAUDE_INCOME_SOURCES.length,
      quizBank: CLAUDE_INCOME_QUIZ_BANK.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
    notes,
  };
  if (JSON_OUTPUT) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`Course 12 check: ${status} (${summary.mode})`);
    notes.forEach((message) => console.log(`NOTE: ${message}`));
    warnings.forEach((message) => console.warn(`WARN: ${message}`));
    errors.forEach((message) => console.error(`ERROR: ${message}`));
  }
  if (errors.length) process.exitCode = 1;
}

main();
