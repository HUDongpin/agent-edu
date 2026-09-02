#!/usr/bin/env node

/**
 * Deterministic, offline release gate for Course 14.
 *
 *   node --import tsx scripts/check-product-management-course.mjs
 *   node --import tsx scripts/check-product-management-course.mjs --release
 *   node --import tsx scripts/check-product-management-course.mjs --json
 */

import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { publishedReleaseIntegrationErrors } from "./lib/published-release-contract.mjs";

import {
  PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS,
  PRODUCT_MANAGEMENT_COURSE_MANIFEST,
  PRODUCT_MANAGEMENT_MODULE_SLUGS,
  PRODUCT_MANAGEMENT_PROGRESS_MILESTONES,
  PRODUCT_MANAGEMENT_SOURCES,
  PRODUCT_MANAGEMENT_TRANSLATED_LOCALES,
  validateProductManagementCourse,
} from "../lib/product-management/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");
const EXPECTED_SLUGS = [
  "product-judgment-operating-model",
  "vision-strategy-business-model",
  "customer-market-discovery",
  "synthesis-opportunity-definition",
  "outcomes-metrics-analytics",
  "prioritization-roadmaps-portfolio",
  "solution-discovery-experiments",
  "product-design-experience-systems",
  "requirements-prd-decisions",
  "ai-capability-architecture",
  "delivery-engineering-ai-agents",
  "quality-safety-governance",
  "launch-go-to-market-growth",
  "experimentation-operations-leadership",
];
const EXPECTED_MINUTES = 910;
const EXPECTED_MILESTONES = 16;
const errors = [];
const warnings = [];
const notes = [];
const fail = (message) => errors.push(message);
const note = (message) => notes.push(message);
const abs = (path) => resolve(ROOT, path);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

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
  const resolved = abs(path);
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
    if (!text.includes(token)) fail(`${path}: missing token ${JSON.stringify(token)}`);
  }
  return text;
}

function checkCourseContract() {
  try {
    for (const message of validateProductManagementCourse()) {
      fail(`Course validator: ${message}`);
    }
  } catch (error) {
    fail(`Course validator threw: ${error instanceof Error ? error.message : String(error)}`);
  }

  const manifest = PRODUCT_MANAGEMENT_COURSE_MANIFEST;
  const manifestSlugs = manifest.modules.map((module) => module.slug);
  const minutes = manifest.modules.reduce((sum, module) => sum + module.minutes, 0);
  if (manifest.id !== "product-management") fail(`Manifest ID drifted to ${manifest.id}`);
  if (manifest.displayNumber !== 14) fail(`Display number drifted to ${manifest.displayNumber}`);
  if (manifest.contentLocale !== "en") fail(`Content locale drifted to ${manifest.contentLocale}`);
  if (JSON.stringify(PRODUCT_MANAGEMENT_TRANSLATED_LOCALES) !== JSON.stringify(["en"])) {
    fail("The first release may advertise only the reviewed English long-form bundle");
  }
  if (JSON.stringify([...PRODUCT_MANAGEMENT_MODULE_SLUGS]) !== JSON.stringify(EXPECTED_SLUGS)) {
    fail("Exported Course 14 module order does not match the independent release contract");
  }
  if (JSON.stringify(manifestSlugs) !== JSON.stringify(EXPECTED_SLUGS)) {
    fail("Manifest Course 14 module order does not match the independent release contract");
  }
  if (manifest.phases.length !== 4) fail(`Expected 4 phases; found ${manifest.phases.length}`);
  if (minutes !== EXPECTED_MINUTES) fail(`Expected ${EXPECTED_MINUTES} minutes; found ${minutes}`);
  if (PRODUCT_MANAGEMENT_PROGRESS_MILESTONES !== EXPECTED_MILESTONES) {
    fail(`Expected ${EXPECTED_MILESTONES} progress milestones; found ${PRODUCT_MANAGEMENT_PROGRESS_MILESTONES}`);
  }

  const sourceIds = PRODUCT_MANAGEMENT_SOURCES.map((source) => source.id);
  if (new Set(sourceIds).size !== sourceIds.length) fail("Source IDs must be unique");
  const used = new Set(manifest.modules.flatMap((module) => module.sourceIds));
  for (const source of PRODUCT_MANAGEMENT_SOURCES) {
    if (!used.has(source.id)) fail(`${source.id}: source is not used by a module`);
    if (!source.supports.trim() || !source.boundary.trim()) {
      fail(`${source.id}: evidence support and boundary are mandatory`);
    }
  }
  const pmaker = PRODUCT_MANAGEMENT_SOURCES.filter((source) => source.publisher === "PMaker").length;
  const github = PRODUCT_MANAGEMENT_SOURCES.filter((source) => source.url.includes("github.com/")).length;
  if (pmaker < 20) fail(`Expected broad PMaker coverage; found ${pmaker} records`);
  if (github < 4) fail(`Expected at least four GitHub sources; found ${github}`);

  note(`${manifest.modules.length} modules, ${manifest.phases.length} phases, and ${minutes} minutes`);
  note(`${PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS.length} concept domains and ${PRODUCT_MANAGEMENT_PROGRESS_MILESTONES} milestones`);
  note(`${PRODUCT_MANAGEMENT_SOURCES.length} evidence records (${pmaker} PMaker, ${github} GitHub)`);
}

function checkFilesAndRoutes() {
  const requiredFiles = [
    "app/[locale]/product-management/page.tsx",
    "app/[locale]/product-management/[module]/page.tsx",
    "components/product-management/ProductManagementCourse.module.css",
    "components/product-management/CourseDashboard.tsx",
    "components/product-management/Interactions.tsx",
    "components/product-management/ModuleView.tsx",
    "components/product-management/assessment-attempt-store.ts",
    "components/product-management/progress-store.ts",
    "tests/product-management-assessment-attempt.test.ts",
    "tests/product-management-course.spec.ts",
    "lib/product-management/copy/en.ts",
    "lib/product-management/format.ts",
    "lib/product-management/index.ts",
    "lib/product-management/load.ts",
    "lib/product-management/manifest.ts",
    "lib/product-management/progress.ts",
    "lib/product-management/sources.ts",
    "lib/product-management/types.ts",
    "lib/product-management/validate.ts",
    "evidence/course-audits/product-management-ai-course-research-brief.md",
    "evidence/course-audits/product-management-ai-course-research-brief.provenance.md",
    "evidence/course-audits/product-management-course-content-verification-2026-08-23.md",
    "evidence/course-audits/product-management-course-content-verification-2026-08-23.provenance.md",
  ];
  for (const path of requiredFiles) regularFile(abs(path), path);

  const css = readText("components/product-management/ProductManagementCourse.module.css");
  if (!css.includes("outline: 3px solid var(--pm-accent)")) {
    fail("Course 14 focus indicator must use the high-contrast course accent");
  }
  if (
    !css.includes(".loopList a:focus-visible")
    || !css.includes("box-shadow: inset 0 0 0 3px var(--gold-mark)")
  ) {
    fail("Course 14 dark product-loop panel requires a non-clipped high-contrast focus ring");
  }
  const cssClasses = new Set(
    Array.from(css.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g), (match) => match[1]),
  );
  for (const componentPath of [
    "components/product-management/CourseDashboard.tsx",
    "components/product-management/Interactions.tsx",
    "components/product-management/ModuleView.tsx",
  ]) {
    const component = readText(componentPath);
    const usedClasses = new Set(
      Array.from(component.matchAll(/styles\.([A-Za-z][A-Za-z0-9_]*)/g), (match) => match[1]),
    );
    for (const className of usedClasses) {
      if (!cssClasses.has(className)) {
        fail(`${componentPath}: CSS module class .${className} is not defined`);
      }
    }
  }

  requireTokens("app/[locale]/product-management/page.tsx", [
    "dynamicParams = false",
    "generateStaticParams",
    'courseLocaleParams("product-management")',
    "availableLocales: PRODUCT_MANAGEMENT_TRANSLATED_LOCALES",
    "canonicalLocale: course.contentLocale",
    'courseCode: "14"',
    "<CourseDashboard",
  ]);
  requireTokens("app/[locale]/product-management/[module]/page.tsx", [
    "dynamicParams = false",
    "courseChildParams",
    "PRODUCT_MANAGEMENT_MODULE_SLUGS",
    "isProductManagementModuleSlug",
    "productManagementModulePage",
    "<ModuleView",
  ]);
  const dashboard = requireTokens("components/product-management/CourseDashboard.tsx", [
    "course.copy.meta.englishOnly",
    "course.copy.meta.evidenceNote",
    "aria-label={`${module.copy.title}, module ${module.order}`}",
    "<CourseProgress",
    "<FinalAssessment",
    "<CapstoneChecklist",
  ]);
  const moduleView = requireTokens("components/product-management/ModuleView.tsx", [
    "course.copy.meta.englishOnly",
    "module.copy.decision",
    "module.copy.practice",
    "<ModuleCheckpoint",
    "<ModuleCompletion",
    "#product-management-final-assessment",
  ]);
  if (/<main\b/.test(moduleView)) {
    fail("components/product-management/ModuleView.tsx: Shell already owns the page's main landmark");
  }
  requireTokens("components/product-management/Interactions.tsx", [
    '"Checkpoint not yet passed"',
    '"Edit and save the artifact template"',
    "delete record[productManagementModuleProgressKey(slug)]",
    '"Edit the template before completing this module."',
  ]);
  for (const [path, text] of [
    ["components/product-management/CourseDashboard.tsx", dashboard],
    ["components/product-management/ModuleView.tsx", moduleView],
  ]) {
    if (/\bsrc\s*=\s*["']https?:\/\//i.test(text)) fail(`${path}: remote embedded media is prohibited`);
  }
  const store = requireTokens("components/product-management/progress-store.ts", [
    'PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY = "ae.progress"',
    "PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY",
    "PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT",
  ]);
  if (/localStorage\.clear\s*\(/.test(store)) {
    fail("Course 14 must not clear the shared progress store");
  }
  requireTokens("components/product-management/assessment-attempt-store.ts", [
    "parseProductManagementAssessmentAttempt",
    "PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY",
    "clearProductManagementAssessmentAttempt(): PersistenceResult",
    "window.sessionStorage.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY) !== null",
  ]);
}

function checkIntegration() {
  requireTokens("lib/seo.ts", [
    'PRODUCT_MANAGEMENT_MODULE_PAGES = childPagesFor("product-management")',
    "function productManagementModulePage",
    "export const PAGES = PUBLISHED_LOCALIZED_PAGES",
  ]);
  requireTokens("app/sitemap.ts", [
    "PRODUCT_MANAGEMENT_TRANSLATED_LOCALES",
    'page === "product-management/"',
    'page.startsWith("product-management/")',
  ]);
  requireTokens("lib/courses.ts", [
    'id: "product-management"',
    "displayNumber: 14",
    'href: "/product-management/"',
    "PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules",
    "productManagementProgressPercent",
    '"c.product-management.title"',
  ]);
  requireTokens("app/[locale]/courses/page.tsx", [
    "courseFourteenParts",
    '"product-management": courseFourteenParts',
    "productManagementCourse.contentLocale",
  ]);
  requireTokens("components/courses/Catalog.tsx", [
    'course.id === "product-management"',
    '"product-management-in-the-age-of-ai"',
  ]);
  requireTokens("components/courses/Cover.tsx", [
    '"product-management":',
    'id === "product-management"',
  ]);
  for (const locale of ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"]) {
    const messages = readJson(`messages/${locale}.json`);
    if (!messages) continue;
    for (const key of [
      "cat.course14",
      "c.product-management.title",
      "c.product-management.blurb",
      "c.product-management.level",
      "c.product-management.meta",
    ]) {
      if (typeof messages[key] !== "string" || !messages[key].trim()) {
        fail(`messages/${locale}.json: missing non-empty ${key}`);
      }
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson) {
    const scripts = packageJson.scripts ?? {};
    if (!String(scripts["product-management:check"] ?? "").includes("check-product-management-course.mjs")) {
      fail("package.json: product-management:check is missing");
    }
    if (!String(scripts["product-management:check:release"] ?? "").includes("--release")) {
      fail("package.json: release checker must use --release");
    }
  }
  for (const error of publishedReleaseIntegrationErrors(
    ROOT,
    "product-management",
    "npm run product-management:check:release",
    ["product-management/", ...EXPECTED_SLUGS.map((slug) => `product-management/${slug}/`)],
  )) fail(error);
}

function main() {
  checkCourseContract();
  checkFilesAndRoutes();
  checkIntegration();
  const ok = errors.length === 0 && (!RELEASE || warnings.length === 0);
  const result = {
    ok,
    course: "product-management",
    displayNumber: 14,
    mode: RELEASE ? "release" : "development",
    modules: PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.length,
    minutes: PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.reduce((sum, module) => sum + module.minutes, 0),
    phases: PRODUCT_MANAGEMENT_COURSE_MANIFEST.phases.length,
    sources: PRODUCT_MANAGEMENT_SOURCES.length,
    progressMilestones: PRODUCT_MANAGEMENT_PROGRESS_MILESTONES,
    errors,
    warnings,
    notes,
  };

  if (JSON_OUTPUT) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (ok) {
    console.log(`Course 14 Product Management check: PASS (${result.mode})`);
    notes.forEach((message) => console.log(`NOTE: ${message}`));
  } else {
    console.error(`Course 14 Product Management check: FAIL (${result.mode})`);
    notes.forEach((message) => console.error(`NOTE: ${message}`));
    errors.forEach((message) => console.error(`ERROR: ${message}`));
    warnings.forEach((message) => console.error(`WARN: ${message}`));
  }
  if (!ok) process.exitCode = 1;
}

main();
