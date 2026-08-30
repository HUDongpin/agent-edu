#!/usr/bin/env node

/**
 * Deterministic, offline quality and integration gate for Course 13.
 *
 *   node --import tsx scripts/check-ai-tutor-course.mjs
 *   node --import tsx scripts/check-ai-tutor-course.mjs --release
 *   node --import tsx scripts/check-ai-tutor-course.mjs --json
 *
 * The checker deliberately carries an independent copy of the public course
 * contract. This prevents a mistaken edit to both a manifest and its exported
 * constants from making the same drift look valid.
 */

import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { publishedReleaseIntegrationErrors } from "./lib/published-release-contract.mjs";

import {
  AI_TUTOR_COURSE_MANIFEST,
  AI_TUTOR_MODULE_SLUGS,
  AI_TUTOR_PROGRESS_MILESTONES,
  AI_TUTOR_SOURCES,
  AI_TUTOR_TRANSLATED_LOCALES,
  validateAiTutorCourse,
} from "../lib/ai-tutor/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");

const EXPECTED_SLUGS = [
  "objectives-concept-map",
  "diagnostic-engine",
  "adaptive-scaffolding",
  "formative-assessment-loop",
  "item-validation",
  "learner-modeling",
  "learning-impact-experiment",
  "safety-teacher-oversight",
];
const EXPECTED_MINUTES = 450;
const EXPECTED_PHASES = 4;
const EXPECTED_PROGRESS_MILESTONES = 10;

const errors = [];
const warnings = [];
const notes = [];
const fail = (message) => errors.push(message);
const note = (message) => notes.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");
const absolute = (path) => resolve(ROOT, path);

function regularFile(path, label = rel(path)) {
  if (!existsSync(path)) {
    fail(`${label}: required file is missing`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${label}: expected a regular, non-symbolic file`);
    return false;
  }
  return true;
}

function readText(path) {
  const resolved = absolute(path);
  return regularFile(resolved, path) ? readFileSync(resolved, "utf8") : "";
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
  if (!text) return "";
  for (const token of tokens) {
    if (!text.includes(token)) fail(`${path}: missing integration token ${JSON.stringify(token)}`);
  }
  return text;
}

function requirePattern(path, text, pattern, description) {
  if (text && !pattern.test(text)) fail(`${path}: ${description}`);
}

function checkIndependentCourseContract() {
  let validatorErrors = [];
  try {
    validatorErrors = validateAiTutorCourse();
  } catch (error) {
    fail(`Course validator threw: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const message of validatorErrors) fail(`Course validator: ${message}`);

  const manifest = AI_TUTOR_COURSE_MANIFEST;
  const manifestSlugs = manifest.modules.map((module) => module.slug);
  const exportedSlugs = [...AI_TUTOR_MODULE_SLUGS];
  const minutes = manifest.modules.reduce((sum, module) => sum + module.minutes, 0);

  if (manifest.id !== "ai-tutor") fail(`Manifest ID must be ai-tutor; found ${manifest.id}`);
  if (manifest.displayNumber !== 13) fail(`Display number must be 13; found ${manifest.displayNumber}`);
  if (manifest.contentLocale !== "en") fail(`Content locale must be en; found ${manifest.contentLocale}`);
  if (JSON.stringify(AI_TUTOR_TRANSLATED_LOCALES) !== JSON.stringify(["en"])) {
    fail("The first Course 13 release must advertise only the reviewed English translation bundle");
  }
  if (JSON.stringify(exportedSlugs) !== JSON.stringify(EXPECTED_SLUGS)) {
    fail(`Exported module slugs must be exactly ${EXPECTED_SLUGS.join(", ")} in order`);
  }
  if (JSON.stringify(manifestSlugs) !== JSON.stringify(EXPECTED_SLUGS)) {
    fail(`Manifest module slugs must be exactly ${EXPECTED_SLUGS.join(", ")} in order`);
  }
  if (manifest.modules.length !== EXPECTED_SLUGS.length) {
    fail(`Course 13 must contain exactly 8 modules; found ${manifest.modules.length}`);
  }
  if (manifest.phases.length !== EXPECTED_PHASES) {
    fail(`Course 13 must contain exactly 4 phases; found ${manifest.phases.length}`);
  }
  if (minutes !== EXPECTED_MINUTES) {
    fail(`Course 13 study time must total exactly 450 minutes; found ${minutes}`);
  }
  if (AI_TUTOR_PROGRESS_MILESTONES !== EXPECTED_PROGRESS_MILESTONES) {
    fail(`Progress must use 10 milestones (8 modules, assessment, capstone); found ${AI_TUTOR_PROGRESS_MILESTONES}`);
  }

  const sourceIds = AI_TUTOR_SOURCES.map((source) => source.id);
  if (new Set(sourceIds).size !== sourceIds.length) fail("Source IDs must be unique");
  const usedSourceIds = new Set(manifest.modules.flatMap((module) => module.sourceIds));
  for (const source of AI_TUTOR_SOURCES) {
    if (!usedSourceIds.has(source.id)) fail(`${source.id}: source is not used by any Course 13 module`);
    if (!source.url.startsWith("https://")) fail(`${source.id}: source URL must use HTTPS`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) fail(`${source.id}: accessedOn must be YYYY-MM-DD`);
  }

  note(`${manifest.modules.length} modules in ${manifest.phases.length} phases`);
  note(`${minutes} curriculum minutes and ${AI_TUTOR_PROGRESS_MILESTONES} progress milestones`);
  note(`${AI_TUTOR_SOURCES.length} source records and ${manifest.conceptEdges.length} concept-map relations`);
}

function checkRequiredFilesAndRoutes() {
  const requiredFiles = [
    "app/[locale]/ai-tutor/page.tsx",
    "components/ai-tutor/AiTutorCourse.module.css",
    "components/ai-tutor/ConceptMap.tsx",
    "components/ai-tutor/CourseDashboard.tsx",
    "components/ai-tutor/Interactions.tsx",
    "components/ai-tutor/ModuleView.tsx",
    "components/ai-tutor/progress-store.ts",
    "lib/ai-tutor/copy/en.ts",
    "lib/ai-tutor/format.ts",
    "lib/ai-tutor/index.ts",
    "lib/ai-tutor/load.ts",
    "lib/ai-tutor/manifest.ts",
    "lib/ai-tutor/progress.ts",
    "lib/ai-tutor/sources.ts",
    "lib/ai-tutor/types.ts",
    "lib/ai-tutor/validate.ts",
    "tests/ai-tutor-course.spec.ts",
  ];
  for (const path of requiredFiles) regularFile(absolute(path), path);

  const moduleRouteCandidates = [
    "app/[locale]/ai-tutor/[module]/page.tsx",
    "app/[locale]/ai-tutor/[lesson]/page.tsx",
    "app/[locale]/ai-tutor/[slug]/page.tsx",
  ];
  const moduleRoute = moduleRouteCandidates.find((path) => existsSync(absolute(path)));
  if (!moduleRoute) {
    fail(`AI Tutor module route is missing; expected one of ${moduleRouteCandidates.join(", ")}`);
  }

  const dashboardRoute = requireTokens("app/[locale]/ai-tutor/page.tsx", [
    "dynamicParams = false",
    "generateStaticParams",
    'courseLocaleParams("ai-tutor")',
    "await params",
    "availableLocales: AI_TUTOR_TRANSLATED_LOCALES",
    "canonicalLocale: course.contentLocale",
    'page: "ai-tutor/"',
    "inLanguage: course.contentLocale",
    "<CourseDashboard",
  ]);
  requirePattern(
    "app/[locale]/ai-tutor/page.tsx",
    dashboardRoute,
    /urlFor\(\s*course\.contentLocale\s*,\s*["']ai-tutor\/["']\s*\)/,
    "structured-data course URL must use the reviewed content locale",
  );

  if (moduleRoute) {
    const routeText = requireTokens(moduleRoute, [
      "dynamicParams = false",
      "generateStaticParams",
      "courseChildParams",
      "AI_TUTOR_MODULE_SLUGS",
      "await params",
      "isAiTutorLocale",
      "isAiTutorModuleSlug",
      "aiTutorModulePage",
      "availableLocales: AI_TUTOR_TRANSLATED_LOCALES",
      "canonicalLocale: course.contentLocale",
      "inLanguage: course.contentLocale",
      "<ModuleView",
    ]);
    requirePattern(
      moduleRoute,
      routeText,
      /urlFor\(\s*course\.contentLocale\s*,\s*aiTutorModulePage\(/,
      "structured-data module URL must use the reviewed content locale",
    );
  }

  const dashboard = requireTokens("components/ai-tutor/CourseDashboard.tsx", [
    "lang={course.contentLocale}",
    "dir={course.contentDirection}",
    'data-testid="ai-tutor-course-dashboard"',
    "course.locale !== course.contentLocale",
    "course.copy.meta.englishOnly",
  ]);
  const moduleView = requireTokens("components/ai-tutor/ModuleView.tsx", [
    "lang={course.contentLocale}",
    "dir={course.contentDirection}",
    "data-testid={`ai-tutor-module-${module.slug}`}",
    "course.locale !== course.contentLocale",
    "course.copy.meta.englishOnly",
  ]);
  for (const [path, text] of [
    ["components/ai-tutor/CourseDashboard.tsx", dashboard],
    ["components/ai-tutor/ModuleView.tsx", moduleView],
  ]) {
    if (/\bsrc\s*=\s*["']https?:\/\//i.test(text)) fail(`${path}: remote embedded media is prohibited`);
  }

  const store = requireTokens("components/ai-tutor/progress-store.ts", [
    'AI_TUTOR_PROGRESS_STORAGE_KEY = "ae.progress"',
    "AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY,",
    '} from "@/lib/progress-storage-contract"',
    "sessionStorage.setItem(AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY, raw)",
    "key.startsWith(AI_TUTOR_PROGRESS_PREFIX)",
    "AI_TUTOR_PROGRESS_VERSION_KEY",
    "AI_TUTOR_PROGRESS_RESET_EVENT",
  ]);
  if (/localStorage\.clear\s*\(/.test(store)) {
    fail("components/ai-tutor/progress-store.ts: Course 13 must never clear the shared progress store");
  }
  const progressStorageContract = requireTokens("lib/progress-storage-contract.ts", [
    "export const AI_TUTOR_CORRUPT_PROGRESS_BACKUP_KEY =",
    '"ae.progress.ai-tutor-corrupt-backup"',
  ]);
  if (!progressStorageContract) return;
  if (/const\s+\w*CORRUPT\w*BACKUP\w*\s*=/.test(store)) {
    fail("components/ai-tutor/progress-store.ts: import, do not redeclare, the corrupt-backup key");
  }
}

function checkReleaseIntegration() {
  requireTokens("lib/seo.ts", [
    'AI_TUTOR_MODULE_PAGES = childPagesFor("ai-tutor")',
    "function aiTutorModulePage",
    "export const PAGES = PUBLISHED_LOCALIZED_PAGES",
  ]);

  const sitemap = requireTokens("app/sitemap.ts", ["PAGES.flatMap", "DEFAULT_LOCALE"]);
  if (
    !/page\s*===\s*["']ai-tutor\/["']/.test(sitemap)
    || !/page\.startsWith\(\s*["']ai-tutor\/["']\s*\)/.test(sitemap)
  ) {
    fail("app/sitemap.ts: Course 13 dashboard and modules must publish only the English canonical locale");
  }

  requireTokens("lib/courses.ts", [
    'id: "ai-tutor"',
    "displayNumber: 13",
    'href: "/ai-tutor/"',
    "AI_TUTOR_COURSE_MANIFEST.modules",
    "aiTutorProgressPercent",
    '"c.ai-tutor.title"',
  ]);

  const coursesPage = requireTokens("app/[locale]/courses/page.tsx", [
    "courseThirteenParts",
    '"ai-tutor": courseThirteenParts',
  ]);
  requirePattern(
    "app/[locale]/courses/page.tsx",
    coursesPage,
    /courseThirteenParts[\s\S]*?url:\s*`\$\{urlFor\(aiTutorCourse\.contentLocale\)\}ai-tutor\//,
    "Course 13 hasPart URLs must use the reviewed content locale",
  );

  const catalog = readText("components/courses/Catalog.tsx");
  requirePattern(
    "components/courses/Catalog.tsx",
    catalog,
    /const\s+isAiTutor\s*=\s*course\.id\s*===\s*["']ai-tutor["']/,
    "Course 13 identity flag is missing",
  );
  if (!catalog.includes('"ai-tutor-learning-systems-engineering"')) {
    fail("components/courses/Catalog.tsx: Course 13 stable anchor is missing");
  }

  requireTokens("components/courses/Cover.tsx", [
    "data-course-cover={id}",
    'id === "ai-tutor" ? "ai-teaching"',
    '"ai-teaching": styles.teaching',
  ]);

  const englishMessages = readJson("messages/en.json");
  if (englishMessages) {
    for (const key of [
      "cat.course13",
      "c.ai-tutor.title",
      "c.ai-tutor.blurb",
      "c.ai-tutor.level",
      "c.ai-tutor.meta",
    ]) {
      if (typeof englishMessages[key] !== "string" || !englishMessages[key].trim()) {
        fail(`messages/en.json: missing non-empty Course 13 key ${key}`);
      }
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson) {
    const scripts = packageJson.scripts ?? {};
    const developmentCheck = String(scripts["ai-tutor:check"] ?? "");
    const releaseCheck = String(scripts["ai-tutor:check:release"] ?? "");
    const browserTest = String(scripts["test:ai-tutor"] ?? "");
    if (!developmentCheck.includes("node --import tsx scripts/check-ai-tutor-course.mjs")) {
      fail("package.json: ai-tutor:check must import the TypeScript course contract through tsx");
    }
    if (
      !releaseCheck.includes("node --import tsx scripts/check-ai-tutor-course.mjs")
      || !releaseCheck.includes("--release")
    ) {
      fail("package.json: ai-tutor:check:release must run this checker with --release through tsx");
    }
    if (!browserTest.includes("playwright test tests/ai-tutor-course.spec.ts")) {
      fail("package.json: test:ai-tutor must run the isolated Course 13 Playwright spec");
    }

  }
  for (const error of publishedReleaseIntegrationErrors(
    ROOT,
    "ai-tutor",
    "npm run ai-tutor:check:release",
    ["ai-tutor/", ...EXPECTED_SLUGS.map((slug) => `ai-tutor/${slug}/`)],
  )) fail(error);

  const vercel = readJson("vercel.json");
  if (vercel && vercel.buildCommand !== "npm run build:release") {
    fail("vercel.json: production deployment must use npm run build:release");
  }
}

function main() {
  checkIndependentCourseContract();
  checkRequiredFilesAndRoutes();
  checkReleaseIntegration();

  const ok = errors.length === 0 && (!RELEASE || warnings.length === 0);
  const result = {
    ok,
    course: "ai-tutor",
    displayNumber: 13,
    mode: RELEASE ? "release" : "development",
    modules: AI_TUTOR_COURSE_MANIFEST.modules.length,
    minutes: AI_TUTOR_COURSE_MANIFEST.modules.reduce((sum, module) => sum + module.minutes, 0),
    phases: AI_TUTOR_COURSE_MANIFEST.phases.length,
    sources: AI_TUTOR_SOURCES.length,
    progressMilestones: AI_TUTOR_PROGRESS_MILESTONES,
    contentLocale: AI_TUTOR_COURSE_MANIFEST.contentLocale,
    errors,
    warnings,
    notes,
  };

  if (JSON_OUTPUT) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (ok) {
    console.log(`Course 13 AI Tutor check: PASS (${result.mode})`);
    notes.forEach((message) => console.log(`NOTE: ${message}`));
  } else {
    console.error(`Course 13 AI Tutor check: FAIL (${result.mode})`);
    notes.forEach((message) => console.error(`NOTE: ${message}`));
    errors.forEach((message) => console.error(`ERROR: ${message}`));
    warnings.forEach((message) => console.error(`WARN: ${message}`));
  }

  if (!ok) process.exitCode = 1;
}

main();
