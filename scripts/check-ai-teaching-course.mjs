#!/usr/bin/env node

/**
 * Deterministic offline release gate for Course 18.
 *
 *   node --import tsx scripts/check-ai-teaching-course.mjs
 *   node --import tsx scripts/check-ai-teaching-course.mjs --release
 *   node --import tsx scripts/check-ai-teaching-course.mjs --release --json
 */

import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AGENTIC_TEACHING_COURSE_MANIFEST,
  AGENTIC_TEACHING_MILESTONE_COUNT,
  AGENTIC_TEACHING_QUIZ_QUESTION_COUNT,
  AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT,
  AGENTIC_TEACHING_SOURCES,
  AGENTIC_TEACHING_TOTAL_MINUTES,
  validateAgenticTeachingCourse,
} from "../lib/ai-teaching/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");
const errors = [];
const notes = [];
const fail = (message) => errors.push(message);
const note = (message) => notes.push(message);
const abs = (path) => resolve(ROOT, path);

function regularFile(path) {
  const resolved = abs(path);
  if (!existsSync(resolved)) {
    fail(`${path}: required file is missing`);
    return false;
  }
  const stat = lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${path}: expected a regular, non-symbolic file`);
    return false;
  }
  return true;
}

function readText(path) {
  return regularFile(path) ? readFileSync(abs(path), "utf8") : "";
}

function readJson(path) {
  const text = readText(path);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${path}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return null;
  }
}

function requireTokens(path, tokens) {
  const text = readText(path);
  for (const token of tokens) {
    if (!text.includes(token)) fail(`${path}: missing ${JSON.stringify(token)}`);
  }
  return text;
}

async function checkContract() {
  try {
    for (const error of await validateAgenticTeachingCourse()) {
      fail(`Course validator: ${error}`);
    }
  } catch (error) {
    fail(`Course validator threw: ${error instanceof Error ? error.message : String(error)}`);
  }

  const manifest = AGENTIC_TEACHING_COURSE_MANIFEST;
  if (manifest.id !== "ai-teaching") fail(`Unexpected course ID ${manifest.id}`);
  if (manifest.displayNumber !== 18) fail(`Unexpected display number ${manifest.displayNumber}`);
  if (manifest.modules.length !== 10) fail(`Expected 10 modules; found ${manifest.modules.length}`);
  if (manifest.phases.length !== 4) fail(`Expected 4 phases; found ${manifest.phases.length}`);
  if (AGENTIC_TEACHING_TOTAL_MINUTES !== 720) {
    fail(`Expected 720 minutes; found ${AGENTIC_TEACHING_TOTAL_MINUTES}`);
  }
  if (AGENTIC_TEACHING_MILESTONE_COUNT !== 12) {
    fail(`Expected 12 local milestones; found ${AGENTIC_TEACHING_MILESTONE_COUNT}`);
  }
  if (
    AGENTIC_TEACHING_QUIZ_QUESTION_COUNT !== 12 ||
    AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT !== 10
  ) {
    fail("Quiz contract must remain 10 correct out of 12 plus every critical gate");
  }

  const github = AGENTIC_TEACHING_SOURCES.filter(
    (source) => source.kind === "github-repository",
  ).length;
  const xPosts = AGENTIC_TEACHING_SOURCES.filter(
    (source) => source.kind === "x-post",
  ).length;
  const research = AGENTIC_TEACHING_SOURCES.filter(
    (source) => source.kind === "research",
  ).length;
  if (github < 7 || xPosts < 3 || research < 4) {
    fail(`Source mix too narrow: ${github} GitHub, ${xPosts} X, ${research} research`);
  }
  note(`${manifest.modules.length} modules · ${AGENTIC_TEACHING_TOTAL_MINUTES} minutes · ${AGENTIC_TEACHING_MILESTONE_COUNT} milestones`);
  note(`${AGENTIC_TEACHING_SOURCES.length} source records: ${github} GitHub, ${xPosts} X, ${research} research`);
}

function checkFilesAndRoutes() {
  const routeRoot = RELEASE
    ? "app/[locale]/ai-teaching"
    : "app/[locale]/_blocked/ai-teaching";
  const required = [
    `${routeRoot}/page.tsx`,
    `${routeRoot}/[module]/page.tsx`,
    "components/ai-teaching/AgenticTeachingCourse.module.css",
    "components/ai-teaching/CourseDashboard.tsx",
    "components/ai-teaching/CourseNavigation.tsx",
    "components/ai-teaching/Interactions.tsx",
    "components/ai-teaching/ModuleView.tsx",
    "lib/ai-teaching/copy/en.ts",
    "lib/ai-teaching/copy/zh-Hans.ts",
    "lib/ai-teaching/contracts.ts",
    "lib/ai-teaching/index.ts",
    "lib/ai-teaching/load.ts",
    "lib/ai-teaching/manifest.ts",
    "lib/ai-teaching/progress.ts",
    "lib/ai-teaching/sources.ts",
    "lib/ai-teaching/types.ts",
    "lib/ai-teaching/validate.ts",
    "evidence/course-audits/course18-agentic-teaching-research.md",
    "evidence/course-audits/course18-agentic-teaching-research.provenance.md",
    "evidence/course-audits/course18-content-verification-2026-08-26.md",
    "evidence/course-audits/course18-content-verification-2026-08-26.provenance.md",
    "evidence/course-audits/course18-browser-qa.md",
    "evidence/course-audits/course18-source-verification.md",
    "evidence/course-audits/course18-repo-review.md",
    "scripts/check-ai-teaching-progress.mjs",
    "scripts/ai-teaching-export-state.mjs",
    "scripts/check-ai-teaching-static.mjs",
    "scripts/serve-static-export.mjs",
    "scripts/write-ai-teaching-export-manifest.mjs",
    "tests/ai-teaching-course.spec.ts",
    "tests/ai-teaching-playwright.config.ts",
  ];
  for (const path of required) regularFile(path);

  requireTokens(`${routeRoot}/page.tsx`, [
    "dynamicParams = false",
    "AGENTIC_TEACHING_LOCALES.map",
    "availableLocales: AGENTIC_TEACHING_TRANSLATED_LOCALES",
    "canonicalLocale: course.contentLocale",
    'courseCode: "18"',
    "await assertValidAgenticTeachingCourse()",
    "<CourseDashboard",
  ]);
  requireTokens(`${routeRoot}/[module]/page.tsx`, [
    "dynamicParams = false",
    "AGENTIC_TEACHING_MODULE_SLUGS.map",
    "isAgenticTeachingModuleSlug",
    'courseCode: "18"',
    "await assertValidAgenticTeachingCourse()",
    "<ModuleView",
  ]);
  requireTokens("components/ai-teaching/CourseDashboard.tsx", [
    "copy.meta.credentialBoundary",
    "copy.meta.evidenceNote",
    "source.claimEvidenceUrls",
    "source.rightsDecision",
    "<FinalAssessment",
    "<CapstoneChecklist",
    "<CoursePrimaryAction",
    "<CourseModuleGrid",
  ]);
  requireTokens("components/ai-teaching/CourseNavigation.tsx", [
    "agenticTeachingNextStep",
    "isAgenticTeachingModuleComplete",
    'data-state={completed ? "completed" : next ? "next" : "upcoming"}',
  ]);
  requireTokens("components/ai-teaching/ModuleView.tsx", [
    "module.copy.audienceScenarios.k12",
    'module.copy.audienceScenarios["higher-ed"]',
    "module.copy.humanApprovalPoints",
    "module.copy.noGoActions",
    "<ArtifactNotebook",
    "<ModuleCheckpoint",
    "<ModuleCompletion",
  ]);
  requireTokens("components/ai-teaching/Interactions.tsx", [
    "inspectAgenticTeachingArtifact",
    "isAgenticTeachingQuizPassed",
    "criticalPassed",
    "agenticTeachingCapstonePrerequisiteFingerprint",
    "labels.selfTrackingOnly",
  ]);
  requireTokens("lib/ai-teaching/contracts.ts", [
    "AGENTIC_TEACHING_ARTIFACT_RUBRICS",
    "AGENTIC_TEACHING_CHECKPOINT_CONTRACTS",
    "correctOptionId",
    "agenticTeachingArtifactRubricFingerprint",
  ]);
  requireTokens("scripts/check-ai-teaching-progress.mjs", [
    "a wrong semantic option must not mint a checkpoint receipt",
    "matching label swaps in both locales must fail the canonical quiz validator",
    "a checkpoint label swap under stable IDs must fail the canonical validator",
    "a checkpoint semantic ID swap must fail the canonical validator",
    "reviewed-label-contract-drift",
    "Changed evidence without the canonical structure",
    "an attestation for an earlier evidence snapshot must not be reusable",
    "agenticTeachingNextStep(partialProgress)",
  ]);
  requireTokens("scripts/ai-teaching-export-state.mjs", [
    "COURSE18_BROWSER_CONTRACT",
    "sourceHash",
    "exportHtmlHash",
    "sourcePrecedesExport",
    "validateCourse18ExportState",
  ]);
  requireTokens("evidence/course-audits/course18-content-verification-2026-08-26.md", [
    "Tutor CoPilot",
    "largely mitigated",
    "Public Beta",
    "X oEmbed",
    "10/12",
    "83%",
    "UNICEF",
    "残余不确定性",
  ]);
  requireTokens("evidence/course-audits/course18-content-verification-2026-08-26.provenance.md", [
    "5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec",
    "57ac4a2ec742e0cb7622d899b0f5d3bcf769fd69",
    "X oEmbed",
    "10.81 个百分点",
    "100% → **83%** → 92% → 100%",
  ]);
  requireTokens("tests/ai-teaching-playwright.config.ts", [
    "node --import tsx scripts/serve-static-export.mjs",
    "AI_TEACHING_BASE_URL",
    'cwd: ".."',
    "reuseExistingServer: false",
  ]);

  const css = readText("components/ai-teaching/AgenticTeachingCourse.module.css");
  for (const token of ["focus-visible", "prefers-reduced-motion", "@media print", "@media (max-width:"]) {
    if (!css.includes(token)) fail(`Course CSS lacks ${token}`);
  }
  const cssClasses = new Set(
    Array.from(css.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g), (match) => match[1]),
  );
  for (const componentPath of [
    "components/ai-teaching/CourseDashboard.tsx",
    "components/ai-teaching/CourseNavigation.tsx",
    "components/ai-teaching/Interactions.tsx",
    "components/ai-teaching/ModuleView.tsx",
  ]) {
    const component = readText(componentPath);
    const used = new Set(
      Array.from(component.matchAll(/styles\.([A-Za-z][A-Za-z0-9_]*)/g), (match) => match[1]),
    );
    for (const className of used) {
      if (!cssClasses.has(className)) fail(`${componentPath}: undefined CSS module class .${className}`);
    }
  }
}

function checkRegistryAndLocales() {
  requireTokens("lib/courses.ts", [
    'id: "ai-teaching"',
    "displayNumber: 18",
    'href: "/ai-teaching/"',
    'progressStrategy: "twelve-equal-milestones"',
    "agenticTeachingProgressPercent",
  ]);
  requireTokens("lib/seo.ts", [
    "`ai-teaching/${slug}/`",
    "agenticTeachingModulePage",
  ]);
  requireTokens("app/sitemap.ts", [
    'page === "ai-teaching/"',
    "AGENTIC_TEACHING_TRANSLATED_LOCALES",
  ]);

  const localeFiles = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
  const keys = [
    "cat.course18",
    "c.ai-teaching.title",
    "c.ai-teaching.blurb",
    "c.ai-teaching.level",
    "c.ai-teaching.meta",
    "c.ai-teaching.contentLanguage",
  ];
  for (const locale of localeFiles) {
    const messages = readJson(`messages/${locale}.json`);
    if (!messages) continue;
    for (const key of keys) {
      if (typeof messages[key] !== "string" || !messages[key].trim()) {
        fail(`messages/${locale}.json: missing ${key}`);
      }
    }
  }
}

function checkPackageWiring() {
  const pkg = readJson("package.json");
  if (!pkg) return;
  const scripts = pkg.scripts ?? {};
  if (
    !String(scripts["ai-teaching:check"] ?? "").includes("node --import tsx scripts/check-ai-teaching-course.mjs") ||
    !String(scripts["ai-teaching:check"] ?? "").includes("npm run ai-teaching:progress-check")
  ) {
    fail("package.json: ai-teaching:check is not wired to the content and progress validators");
  }
  if (
    !String(scripts["ai-teaching:check:release"] ?? "").includes("node --import tsx scripts/check-ai-teaching-course.mjs --release") ||
    !String(scripts["ai-teaching:check:release"] ?? "").includes("npm run ai-teaching:progress-check")
  ) {
    fail("package.json: ai-teaching:check:release is not wired to release mode and the progress contract");
  }
  if (!String(scripts.build ?? "").includes("courses:check:development")) {
    fail("package.json: build must use the registry-derived development gate runner");
  }
  if (
    !String(scripts["verify:source"] ?? "").includes("published:check:release")
    || !String(scripts["build:release"] ?? "").includes("verify:source")
  ) {
    fail("package.json: release build must use the registry-derived published gate runner");
  }
  if (
    !String(scripts["ai-teaching:export-manifest"] ?? "").includes(
      "write-ai-teaching-export-manifest.mjs",
    ) ||
    !String(scripts["ai-teaching:static-check"] ?? "").includes(
      "check-ai-teaching-static.mjs",
    ) ||
    !String(scripts["test:ai-teaching"] ?? "").includes(
      "tests/ai-teaching-playwright.config.ts",
    )
  ) {
    fail("package.json: Course 18 export, static and browser commands are incomplete");
  }
}

await checkContract();
checkFilesAndRoutes();
checkRegistryAndLocales();
if (RELEASE) checkPackageWiring();

const report = {
  course: "18 · ai-teaching",
  mode: RELEASE ? "release" : "development",
  ok: errors.length === 0,
  errors,
  notes,
};

if (JSON_OUTPUT) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (errors.length > 0) {
  process.stderr.write(`Course 18 check failed (${errors.length}):\n- ${errors.join("\n- ")}\n`);
} else {
  process.stdout.write(`Course 18 check passed (${RELEASE ? "release" : "development"}).\n${notes.map((item) => `- ${item}`).join("\n")}\n`);
}

process.exitCode = errors.length > 0 ? 1 : 0;
