#!/usr/bin/env node

/**
 * Offline release gate for the Codex course.
 *
 * The validator deliberately reads source and local artifacts only. It never
 * fetches a citation URL or screenshot, so it is deterministic in CI and safe
 * to run without credentials:
 *
 *   node scripts/check-codex-course.mjs
 *   node scripts/check-codex-course.mjs --release
 *   node scripts/check-codex-course.mjs --json
 *
 * Development mode permits honest `capture-required` figure records and emits
 * warnings. Release mode fails until every referenced figure is a verified,
 * privacy-reviewed local asset with matching provenance and SHA-256.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CODEX_MEDIA_CHECKLIST,
  inspectPng,
  inspectWebp,
  isPathInside,
  rejectImageMetadataAndFeatures,
  sha256,
} from "./lib/codex-media.mjs";
import { resolveStaticConst } from "./lib/codex-static-source.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");

const EXPECTED_SLUGS = [
  "meet-codex",
  "task-contracts",
  "environments-permissions",
  "ground-plan",
  "implement-steer",
  "debug-test",
  "review-diff",
  "agents-skills",
  "cli",
  "ide",
  "cloud-parallel",
  "automation-capstone",
];

const COURSE_MODULES = [
  "lib/codex/course.ts",
  "lib/codex/index.ts",
];

const COURSE_MANIFESTS = [
  "lib/codex/course.manifest.json",
  "lib/codex/manifest.json",
];

const COURSE_INDEX_ROUTE = "app/[locale]/_blocked/codex/page.tsx";
const COURSE_LESSON_ROUTES = [
  "app/[locale]/_blocked/codex/[lesson]/page.tsx",
  "app/[locale]/_blocked/codex/[slug]/page.tsx",
];

const FIGURE_AUDIT_PATH = "lib/codex/figure-audits.json";
const FIGURE_AUDIT_SCHEMA = "aicourse.codex.figure-audits.v1";
const LOCALIZATION_REVIEW_PATH = "lib/codex/localization-reviews.json";
const LOCALIZATION_REVIEW_SCHEMA = "aicourse.codex.localization-reviews.v1";
const LOCALIZATION_REVIEW_CHECKLIST_VERSION = "codex-localization-second-pass.v1";
const LOCALIZATION_REVIEW_LOCALES = ["es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const LOCALIZATION_REVIEW_CHECKS = [
  "completeBundleReviewed",
  "terminologyReviewed",
  "semanticFidelityReviewed",
];
const FIGURE_ASSET_PREFIX = "/courses/codex/figures/";
const FIGURE_ASSET_ROOT = join(ROOT, "public/courses/codex/figures");
const PUBLIC_ROOT = join(ROOT, "public");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const FIGURE_ID_PATTERN = /^fig-(?:0[1-9]|1\d|2[0-4])$/;
const FIGURE_AUDIT_ID_PATTERN = /^codex-figure-audit\.fig-(?:0[1-9]|1\d|2[0-4])\.[a-z0-9][a-z0-9._-]*$/;
const FIGURE_OCR_CHECKLIST_VERSION = "codex-figure-ocr.v1";
const FIGURE_METADATA_CHECKLIST_VERSION = "codex-figure-metadata.v1";
const FIGURE_PRIVACY_CHECKLIST_VERSION = "codex-figure-privacy.v2";
const FIGURE_OCR_CHECKS = [
  "noPersonalPaths",
  "noEmailAddresses",
  "noSecretsOrTokens",
  "noRemoteRepositoryUrls",
  "noRealNamesOrAccountIdentifiers",
  "noCustomerOrPrivateRepositoryData",
  "visibleTextMatchesSyntheticScenario",
];
const FIGURE_METADATA_CHECKS = [
  "metadataStripped",
  "noExifOrXmp",
  "noGpsCoordinates",
  "noAuthorOrDeviceIdentifiers",
  "noEmbeddedThumbnail",
  "finalDerivativeReinspected",
];

const CAPSTONE_ROOT = "tests/fixtures/codex-course-demo";
const CAPSTONE_ARCHIVE = "public/courses/codex/aicourse-codex-demo-v1.zip";
const CAPSTONE_CHECKSUM = "public/courses/codex/aicourse-codex-demo-v1.sha256";
const CAPSTONE_BROWSER_CONTRACT = "lib/codex/capstone.ts";
const CAPSTONE_FILES = [
  ".gitignore",
  "LICENSE",
  "README.md",
  "package.json",
  "package-lock.json",
  "course-fixture.json",
  "next.config.ts",
  "tsconfig.json",
  "eslint.config.mjs",
  "scripts/course-verify.mjs",
  "scripts/verifier-integrity.mjs",
  "tests/setup.ts",
  "tests/CourseList.test.tsx",
  "tests/verifier-integrity.test.mjs",
  "components/CourseList.tsx",
  "lib/courses.ts",
  "app/layout.tsx",
  "app/page.tsx",
  "app/styles.css",
  "app/courses/page.tsx",
];

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

function readJson(path, label = rel(path)) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label}: invalid JSON (${error.message})`);
    return null;
  }
}

function staticExport(source, name, sourcePath) {
  try {
    return resolveStaticConst(source, name, rel(sourcePath));
  } catch (error) {
    fail(
      `${rel(sourcePath)}: ${name} must be statically inspectable (${error.message}). ` +
      "Use plain literal data or add lib/codex/course.manifest.json.",
    );
    return undefined;
  }
}

function shapeFrom(value) {
  if (!value || typeof value !== "object") return {};
  const course = value.COURSE ?? value.course ?? value;
  return {
    lessons: value.LESSONS ?? value.lessons ?? course.LESSONS ?? course.lessons,
    sources: value.SOURCES ?? value.sources ?? course.SOURCES ?? course.sources,
    figures: value.FIGURES ?? value.figures ?? course.FIGURES ?? course.figures,
    quizzes:
      value.QUIZ_QUESTIONS ?? value.quizQuestions ?? value.quizzes ??
      course.QUIZ_QUESTIONS ?? course.quizQuestions ?? course.quizzes,
    practices: value.PRACTICES ?? value.practices ?? course.PRACTICES ?? course.practices,
  };
}

function namedExportFromDirectory(names) {
  const directory = join(ROOT, "lib/codex");
  if (!existsSync(directory)) return {};
  const files = walk(directory).filter((path) => [".ts", ".tsx", ".js", ".mjs"].includes(extname(path)));
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    for (const name of names) {
      if (!new RegExp(`(?:export\\s+)?const\\s+${name}\\b`).test(source)) continue;
      return { value: staticExport(source, name, path), path };
    }
  }
  return {};
}

function loadCourseData() {
  const manifestPath = COURSE_MANIFESTS.map((path) => join(ROOT, path)).find(existsSync);
  if (manifestPath) {
    const manifest = readJson(manifestPath);
    return { ...shapeFrom(manifest), sourcePath: manifestPath };
  }

  const modulePath = COURSE_MODULES.map((path) => join(ROOT, path)).find(existsSync);
  if (!modulePath) {
    fail(
      `missing Codex course data: expected ${COURSE_MODULES.join(" or ")} ` +
      `(a JSON manifest at ${COURSE_MANIFESTS.join(" or ")} is also accepted)`,
    );
    return {};
  }

  const source = readFileSync(modulePath, "utf8");
  const data = {
    lessons: staticExport(source, "LESSONS", modulePath),
    sources: staticExport(source, "SOURCES", modulePath),
    figures: staticExport(source, "FIGURES", modulePath),
    quizzes: staticExport(source, "QUIZ_QUESTIONS", modulePath),
    practices: staticExport(source, "PRACTICES", modulePath),
    sourcePath: modulePath,
  };

  if ([data.lessons, data.sources, data.figures, data.quizzes].some((value) => value === undefined)) {
    const course = staticExport(source, "COURSE", modulePath);
    const nested = shapeFrom(course);
    data.lessons ??= nested.lessons;
    data.sources ??= nested.sources;
    data.figures ??= nested.figures;
    data.quizzes ??= nested.quizzes;
    data.practices ??= nested.practices;
  }

  const split = [
    ["lessons", ["LESSONS", "CODEX_LESSONS"]],
    ["sources", ["SOURCES", "RAW_CODEX_SOURCES", "CODEX_SOURCES"]],
    ["figures", ["FIGURES", "RAW_CODEX_FIGURES", "CODEX_FIGURES"]],
    ["quizzes", ["QUIZ_QUESTIONS", "CODEX_QUIZ"]],
    ["practices", ["PRACTICES", "CODEX_PRACTICES"]],
  ];
  for (const [field, names] of split) {
    if (data[field] !== undefined) continue;
    const found = namedExportFromDirectory(names);
    data[field] = found.value;
  }
  return data;
}

function expectArray(value, name, sourcePath) {
  if (!Array.isArray(value)) {
    fail(`${sourcePath ? rel(sourcePath) : "course data"}: ${name} must be an array`);
    return [];
  }
  return value;
}

function nonEmptyStrings(value) {
  return Array.isArray(value) && value.length > 0 &&
    value.every((entry) => typeof entry === "string" && entry.trim());
}

function uniqueIds(items, label) {
  const ids = new Set();
  for (const [index, item] of items.entries()) {
    const id = item?.id;
    if (typeof id !== "string" || !id.trim()) {
      fail(`${label}[${index}]: id must be a non-empty string`);
    } else if (ids.has(id)) {
      fail(`${label}: duplicate id "${id}"`);
    } else {
      ids.add(id);
    }
  }
  return ids;
}

function lessonUnit(lesson) {
  return lesson?.unit ?? lesson?.unitId;
}

function lessonDuration(lesson) {
  return lesson?.durationMinutes ?? lesson?.minutes;
}

function checkLessons(lessons) {
  const slugs = lessons.map((lesson) => lesson?.slug);
  if (lessons.length !== EXPECTED_SLUGS.length) {
    fail(`LESSONS: expected ${EXPECTED_SLUGS.length} lessons, found ${lessons.length}`);
  }
  if (JSON.stringify(slugs) !== JSON.stringify(EXPECTED_SLUGS)) {
    fail(
      "LESSONS: slugs or ordering changed. Expected:\n  " +
      EXPECTED_SLUGS.join("\n  ") + "\nFound:\n  " + slugs.join("\n  "),
    );
  }

  const practiceIds = new Set();
  for (const [index, lesson] of lessons.entries()) {
    const label = `LESSONS[${index}] (${lesson?.slug ?? "unknown"})`;
    const unit = lessonUnit(lesson);
    if ((typeof unit !== "string" || !unit.trim()) && (!Number.isInteger(unit) || unit < 1)) {
      fail(`${label}: unit or unitId is required`);
    }
    if (lesson?.order !== index + 1) fail(`${label}: order must be ${index + 1}`);
    if (!Number.isInteger(lessonDuration(lesson)) || lessonDuration(lesson) < 1) {
      fail(`${label}: durationMinutes (or minutes) must be a positive integer`);
    }
    if (!nonEmptyStrings(lesson?.objectiveKeys)) {
      fail(`${label}: objectiveKeys must contain translation keys`);
    }
    if (!Array.isArray(lesson?.blocks) || lesson.blocks.length === 0) {
      fail(`${label}: blocks must not be empty`);
    } else {
      for (const [blockIndex, block] of lesson.blocks.entries()) {
        const blockLabel = `${label}: blocks[${blockIndex}]`;
        if (block?.type === "steps" || block?.type === "callout") {
          if (typeof block.copyKey !== "string" || !block.copyKey.trim()) {
            fail(`${blockLabel}: ${block.type} requires a non-empty copyKey`);
          }
        } else if (block?.type === "code") {
          if (typeof block.language !== "string" || !block.language.trim() || typeof block.code !== "string" || !block.code.trim()) {
            fail(`${blockLabel}: code requires a language and non-empty code`);
          }
        } else if (block?.type === "comparison") {
          if (typeof block.copyKey !== "string" || !block.copyKey.trim()) {
            fail(`${blockLabel}: comparison requires a non-empty row copyKey`);
          }
          if (!Array.isArray(block.columns) || block.columns.length < 2 || !nonEmptyStrings(block.columns) || new Set(block.columns).size !== block.columns.length) {
            fail(`${blockLabel}: comparison requires at least two unique localized column keys`);
          }
        }
      }
    }
    if (!Array.isArray(lesson?.prerequisites) || !lesson.prerequisites.every((value) => typeof value === "string" && value.trim())) {
      fail(`${label}: prerequisites must be an array of lesson slugs`);
    }
    if (!nonEmptyStrings(lesson?.quizTags)) fail(`${label}: quizTags must contain at least one stable tag`);
    if (!Array.isArray(lesson?.figureIds) || lesson.figureIds.length < 1 || !nonEmptyStrings(lesson.figureIds)) {
      fail(`${label}: figureIds must contain at least one instructional figure`);
    }
    if (typeof lesson?.practiceId !== "string" || !lesson.practiceId.trim()) {
      fail(`${label}: practiceId must be a non-empty string`);
    } else if (practiceIds.has(lesson.practiceId)) {
      fail(`${label}: duplicate practiceId "${lesson.practiceId}"`);
    } else {
      practiceIds.add(lesson.practiceId);
    }
    if (!nonEmptyStrings(lesson?.sourceIds)) fail(`${label}: sourceIds must cite at least one source`);
    if (!Array.isArray(lesson?.quizIds) || lesson.quizIds.length < 1 || !nonEmptyStrings(lesson.quizIds)) {
      fail(`${label}: quizIds must contain at least one question ID`);
    }
  }
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return false;
  const normalized = value.length === 10 ? `${value}T00:00:00Z` : value;
  return !Number.isNaN(Date.parse(normalized));
}

function validHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function checkSources(sources) {
  const ids = uniqueIds(sources, "SOURCES");
  for (const [index, source] of sources.entries()) {
    const label = `SOURCES[${index}] (${source?.id ?? "unknown"})`;
    const tier = source?.tier ?? source?.kind;
    if (typeof tier !== "string" || !tier.trim()) fail(`${label}: tier (or kind) is required`);
    if (source?.tier !== undefined && !new Set(["primary", "corroborating"]).has(source.tier)) {
      fail(`${label}: tier must be "primary" or "corroborating"`);
    }
    if (!validHttps(source?.url)) fail(`${label}: url must be an HTTPS URL`);
    if (!validDate(source?.verifiedAt ?? source?.accessedOn)) {
      fail(`${label}: verifiedAt (or accessedOn) must be an ISO date or timestamp`);
    }
    if (source?.stars !== undefined && (!Number.isInteger(source.stars) || source.stars < 0)) {
      fail(`${label}: stars must be a non-negative integer when present`);
    }
    if (source?.starsSnapshotOn !== undefined && !validDate(source.starsSnapshotOn)) {
      fail(`${label}: starsSnapshotOn must be an ISO date or timestamp when present`);
    }
    for (const optional of ["license", "release"]) {
      if (source?.[optional] !== undefined && typeof source[optional] !== "string") {
        fail(`${label}: ${optional} must be a string when present`);
      }
    }
    if (source?.claimIds !== undefined && !nonEmptyStrings(source.claimIds)) {
      fail(`${label}: claimIds must be a non-empty string array when present`);
    }
    if (source?.kind === "official-github" || source?.kind === "community-github") {
      if (!Number.isInteger(source.stars) || source.stars < 0) fail(`${label}: GitHub sources require a star snapshot`);
      if (!validDate(source.starsSnapshotOn)) fail(`${label}: GitHub sources require a dated star snapshot`);
      if (typeof source.license !== "string" || !source.license.trim()) fail(`${label}: GitHub sources require a license record`);
    }
  }
  return ids;
}

function checkCourseRoutes() {
  const indexPath = join(ROOT, COURSE_INDEX_ROUTE);
  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    fail(`${COURSE_INDEX_ROUTE}: missing Codex course index route`);
  }

  const lessonRoute = COURSE_LESSON_ROUTES
    .map((path) => ({ relativePath: path, path: join(ROOT, path) }))
    .find(({ path }) => existsSync(path) && statSync(path).isFile());
  if (!lessonRoute) {
    fail(`${COURSE_LESSON_ROUTES.join(" or ")}: missing dynamic Codex lesson route`);
    return;
  }

  const source = readFileSync(lessonRoute.path, "utf8");
  if (!/\b(?:export\s+)?(?:async\s+)?function\s+generateStaticParams\b|\bexport\s+const\s+generateStaticParams\b/.test(source)) {
    fail(`${lessonRoute.relativePath}: static export requires generateStaticParams`);
  }
  if (!/CODEX_(?:LESSON_SLUGS|LESSONS)|CODEX_COURSE\.lessons/.test(source)) {
    fail(
      `${lessonRoute.relativePath}: generateStaticParams must derive lesson routes from the canonical Codex manifest`,
    );
  }
}

function sortedRecord(value) {
  return Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right));
}

function canonicalizeJson(value) {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalizeJson(nested)]),
    );
  }
  return value;
}

function canonicalJsonSha256(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalizeJson(value)))
    .digest("hex");
}

function checkCapstoneFixture() {
  let complete = true;
  for (const relativePath of CAPSTONE_FILES) {
    const path = join(ROOT, CAPSTONE_ROOT, relativePath);
    if (!existsSync(path) || !statSync(path).isFile()) {
      fail(`${CAPSTONE_ROOT}/${relativePath}: missing capstone starter file`);
      complete = false;
    }
  }
  if (!complete) return;

  const fixturePath = join(ROOT, CAPSTONE_ROOT, "course-fixture.json");
  const packagePath = join(ROOT, CAPSTONE_ROOT, "package.json");
  const lockPath = join(ROOT, CAPSTONE_ROOT, "package-lock.json");
  const verifierPath = join(ROOT, CAPSTONE_ROOT, "scripts/course-verify.mjs");
  const verifierIntegrityPath = join(ROOT, CAPSTONE_ROOT, "scripts/verifier-integrity.mjs");
  const verifierIntegrityTestPath = join(ROOT, CAPSTONE_ROOT, "tests/verifier-integrity.test.mjs");
  const componentPath = join(ROOT, CAPSTONE_ROOT, "components/CourseList.tsx");
  const coursesPath = join(ROOT, CAPSTONE_ROOT, "lib/courses.ts");
  const testPath = join(ROOT, CAPSTONE_ROOT, "tests/CourseList.test.tsx");
  const readmePath = join(ROOT, CAPSTONE_ROOT, "README.md");
  const browserContractPath = join(ROOT, CAPSTONE_BROWSER_CONTRACT);
  if (!existsSync(browserContractPath) || !statSync(browserContractPath).isFile()) {
    fail(`${CAPSTONE_BROWSER_CONTRACT}: browser receipt contract is missing`);
    return;
  }
  const fixture = readJson(fixturePath);
  const packageJson = readJson(packagePath);
  const packageLock = readJson(lockPath);
  if (!fixture || !packageJson || !packageLock) return;

  if (fixture.schema !== "aicourse.codex.capstone.fixture.v1") {
    fail(`${CAPSTONE_ROOT}/course-fixture.json: unexpected fixture schema`);
  }
  if (typeof fixture.fixtureVersion !== "string" || !fixture.fixtureVersion.trim()) {
    fail(`${CAPSTONE_ROOT}/course-fixture.json: fixtureVersion is required`);
  }
  if (JSON.stringify(fixture.routes) !== JSON.stringify(["/", "/courses/"])) {
    fail(`${CAPSTONE_ROOT}/course-fixture.json: routes must preserve / and /courses/`);
  }
  const expectedCourseListTestSha256 = createHash("sha256").update(readFileSync(testPath)).digest("hex");
  if (fixture.courseListTestSha256 !== expectedCourseListTestSha256) {
    fail(`${CAPSTONE_ROOT}/course-fixture.json: courseListTestSha256 must lock the supplied acceptance test`);
  }
  for (const [field, actual] of [
    ["packageJsonSha256", canonicalJsonSha256(packageJson)],
    ["packageLockSha256", canonicalJsonSha256(packageLock)],
  ]) {
    if (!/^[a-f0-9]{64}$/.test(fixture[field] ?? "")) {
      fail(`${CAPSTONE_ROOT}/course-fixture.json: ${field} must be a lowercase SHA-256 digest`);
    } else if (fixture[field] !== actual) {
      fail(`${CAPSTONE_ROOT}/course-fixture.json: ${field} does not lock the current complete package manifest`);
    }
  }
  for (const script of ["test", "lint", "build", "course:verify"]) {
    if (typeof packageJson.scripts?.[script] !== "string" || !packageJson.scripts[script].trim()) {
      fail(`${CAPSTONE_ROOT}/package.json: missing ${script} script`);
    }
  }
  const lockRoot = packageLock.packages?.[""];
  if (!lockRoot) {
    fail(`${CAPSTONE_ROOT}/package-lock.json: lockfile root package is missing`);
  } else {
    for (const field of ["dependencies", "devDependencies"]) {
      const expected = JSON.stringify(sortedRecord(fixture[field]));
      if (JSON.stringify(sortedRecord(packageJson[field])) !== expected) {
        fail(`${CAPSTONE_ROOT}/package.json: ${field} differ from the immutable fixture manifest`);
      }
      if (JSON.stringify(sortedRecord(lockRoot[field])) !== expected) {
        fail(`${CAPSTONE_ROOT}/package-lock.json: root ${field} differ from the immutable fixture manifest`);
      }
    }
  }

  const fixtureHash = createHash("sha256").update(readFileSync(fixturePath)).digest("hex");
  const verifier = readFileSync(verifierPath, "utf8");
  const browserContract = readFileSync(browserContractPath, "utf8");
  const expectedHash = /EXPECTED_FIXTURE_SHA256\s*=\s*["']([a-f0-9]{64})["']/.exec(verifier)?.[1];
  if (expectedHash !== fixtureHash) {
    fail(`${CAPSTONE_ROOT}/scripts/course-verify.mjs: fixture SHA-256 is missing or stale`);
  }
  if (!verifier.includes("aicourse.codex.capstone.v1")) {
    fail(`${CAPSTONE_ROOT}/scripts/course-verify.mjs: receipt schema must be aicourse.codex.capstone.v1`);
  }

  // The starter and browser used to be checked independently. Keep the exact
  // receipt contract joined here so a valid local receipt cannot be rejected
  // after either side changes its fixture version, manifest hash, schema, or
  // required check set. The public .sha256 file intentionally covers the ZIP;
  // fixtureSha256 in a receipt covers course-fixture.json inside that ZIP.
  const browserStringConstant = (name) => new RegExp(
    `(?:export\\s+)?const\\s+${name}\\b[^=]*=\\s*["']([^"']+)["']`,
  ).exec(browserContract)?.[1];
  const browserReceiptSchema = browserStringConstant("CODEX_CAPSTONE_RECEIPT_SCHEMA");
  const browserFixtureVersion = browserStringConstant("CODEX_CAPSTONE_FIXTURE_VERSION");
  const browserFixtureHash = browserStringConstant("CODEX_CAPSTONE_FIXTURE_SHA256");
  const browserRequiredChecks = staticExport(
    browserContract,
    "CODEX_CAPSTONE_REQUIRED_CHECKS",
    browserContractPath,
  );
  const expectedRequiredChecks = [
    "tests",
    "lint",
    "build",
    "routesPreserved",
    "keyboardBehavior",
    "noNewDependencies",
  ];

  if (browserReceiptSchema !== "aicourse.codex.capstone.v1") {
    fail(`${CAPSTONE_BROWSER_CONTRACT}: receipt schema differs from the starter verifier`);
  }
  if (browserFixtureVersion !== fixture.fixtureVersion) {
    fail(`${CAPSTONE_BROWSER_CONTRACT}: fixture version differs from course-fixture.json`);
  }
  if (browserFixtureHash !== fixtureHash) {
    fail(`${CAPSTONE_BROWSER_CONTRACT}: fixture SHA-256 differs from course-fixture.json`);
  }
  if (JSON.stringify(browserRequiredChecks) !== JSON.stringify(expectedRequiredChecks)) {
    fail(`${CAPSTONE_BROWSER_CONTRACT}: required receipt checks differ from the starter verifier`);
  }
  for (const check of expectedRequiredChecks) {
    if (!new RegExp(`\\b${check}\\s*(?::|,)`).test(verifier)) {
      fail(`${CAPSTONE_ROOT}/scripts/course-verify.mjs: receipt is missing the ${check} check`);
    }
  }
  const clearReceiptIndex = verifier.indexOf("clearReceipt(RECEIPT_FILE)");
  const firstCheckIndex = verifier.indexOf('run("test")');
  if (clearReceiptIndex < 0 || firstCheckIndex < 0 || clearReceiptIndex > firstCheckIndex) {
    fail(`${CAPSTONE_ROOT}/scripts/course-verify.mjs: each verification must clear stale receipts before running checks`);
  }
  if (!verifier.includes("writeReceiptAtomically(RECEIPT_FILE, receipt)")) {
    fail(`${CAPSTONE_ROOT}/scripts/course-verify.mjs: passing receipts must be published atomically`);
  }
  if (!verifier.includes("frozenFileMatchesBaseline(") || !verifier.includes("fixture.courseListTestSha256")) {
    fail(`${CAPSTONE_ROOT}/scripts/course-verify.mjs: the supplied CourseList acceptance test must be integrity-checked`);
  }

  const verifierIntegrity = readFileSync(verifierIntegrityPath, "utf8");
  if (!verifierIntegrity.includes("canonicalJsonSha256(packageJson)") ||
      !verifierIntegrity.includes("canonicalJsonSha256(packageLock)")) {
    fail(`${CAPSTONE_ROOT}/scripts/verifier-integrity.mjs: complete package and lock manifests must be checked`);
  }
  const verifierIntegrityTests = readFileSync(verifierIntegrityTestPath, "utf8");
  const requiredPackageManagerSidecars = [
    ".npmrc",
    "npm-shrinkwrap.json",
    "yarn.lock",
    ".yarnrc",
    ".yarnrc.yml",
    ".yarn",
    ".pnp.cjs",
    ".pnp.js",
    ".pnp.loader.mjs",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".pnpmfile.cjs",
    ".pnpmfile.js",
    "bun.lock",
    "bun.lockb",
    "bunfig.toml",
  ];
  for (const sidecar of requiredPackageManagerSidecars) {
    const quotedSidecar = JSON.stringify(sidecar);
    if (!verifierIntegrity.includes(quotedSidecar)) {
      fail(`${CAPSTONE_ROOT}/scripts/verifier-integrity.mjs: forbidden package-manager sidecar is not checked (${sidecar})`);
    }
    if (!verifierIntegrityTests.includes(quotedSidecar)) {
      fail(`${CAPSTONE_ROOT}/tests/verifier-integrity.test.mjs: package-manager sidecar regression case is missing (${sidecar})`);
    }
  }
  for (const assertion of [
    /optionalDependencies/,
    /overrides/,
    /postinstall/,
    /unexpected lockfile entry/,
    /npm sidecars/,
    /Yarn sidecars/,
    /pnpm sidecars/,
    /Bun sidecars/,
    /supplied acceptance test must match its frozen byte hash/,
    /frozenFileMatchesBaseline/,
    /clearReceipt/,
    /writeReceiptAtomically/,
  ]) {
    if (!assertion.test(verifierIntegrityTests)) {
      fail(`${CAPSTONE_ROOT}/tests/verifier-integrity.test.mjs: required verifier regression case is missing`);
    }
  }

  const component = readFileSync(componentPath, "utf8");
  const courses = readFileSync(coursesPath, "utf8");
  const tests = readFileSync(testPath, "utf8");
  if (/value:\s*["']incomplete["']|label:\s*["']Incomplete["']/.test(component) ||
      /filter\s*===\s*["']incomplete["']|!\s*course\.complete/.test(courses)) {
    fail(`${CAPSTONE_ROOT}: starter must intentionally omit the learner's Incomplete filter implementation`);
  }
  for (const assertion of [
    /incomplete returns only unfinished courses/,
    /native keyboard button behaviour/,
    /user\.click\(incomplete\)/,
    /user\.keyboard\(["']\{Enter\}["']\)/,
    /user\.keyboard\(["'] ["']\)/,
    /aria-pressed/,
    /original routes remain in place/,
  ]) {
    if (!assertion.test(tests)) fail(`${CAPSTONE_ROOT}/tests/CourseList.test.tsx: required capstone assertion is missing`);
  }
  const readme = readFileSync(readmePath, "utf8");
  for (const token of ["components/CourseList.tsx", "lib/courses.ts", "tests/CourseList.test.tsx", "frozen"]) {
    if (!readme.includes(token)) {
      fail(`${CAPSTONE_ROOT}/README.md: capstone implementation and frozen-test contract is missing ${token}`);
    }
  }

  const archivePath = join(ROOT, CAPSTONE_ARCHIVE);
  const checksumPath = join(ROOT, CAPSTONE_CHECKSUM);
  if (!existsSync(archivePath) || !statSync(archivePath).isFile()) {
    fail(`${CAPSTONE_ARCHIVE}: versioned starter archive is missing`);
    return;
  }
  if (!existsSync(checksumPath) || !statSync(checksumPath).isFile()) {
    fail(`${CAPSTONE_CHECKSUM}: starter archive checksum is missing`);
    return;
  }

  const archiveSha256 = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
  const checksumText = readFileSync(checksumPath, "utf8").trim();
  const checksumMatch = /^([a-f0-9]{64})\s+aicourse-codex-demo-v1\.zip$/.exec(checksumText);
  if (!checksumMatch || checksumMatch[1] !== archiveSha256) {
    fail(`${CAPSTONE_CHECKSUM}: checksum does not match the published starter archive`);
  }

  const listing = spawnSync("unzip", ["-Z1", archivePath], { encoding: "utf8" });
  if (listing.error || listing.status !== 0) {
    fail(`${CAPSTONE_ARCHIVE}: could not inspect archive entries (${listing.error?.message || listing.stderr.trim() || `exit ${listing.status}`})`);
    return;
  }
  const archivedFiles = listing.stdout.split(/\r?\n/).filter(Boolean).sort();
  const expectedFiles = [...CAPSTONE_FILES].sort();
  if (JSON.stringify(archivedFiles) !== JSON.stringify(expectedFiles)) {
    fail(`${CAPSTONE_ARCHIVE}: entries differ from the versioned fixture source`);
    return;
  }
  for (const relativePath of expectedFiles) {
    const archived = spawnSync("unzip", ["-p", archivePath, relativePath], {
      encoding: null,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (archived.error || archived.status !== 0) {
      fail(`${CAPSTONE_ARCHIVE}: could not read ${relativePath}`);
      continue;
    }
    const source = readFileSync(join(ROOT, CAPSTONE_ROOT, relativePath));
    if (!Buffer.from(archived.stdout).equals(source)) {
      fail(`${CAPSTONE_ARCHIVE}: ${relativePath} is stale or differs from the fixture source`);
    }
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

const PLACEHOLDER_HUMAN_REVIEWER = /(?:^|[-_.\s])(?:tbd|pending|unknown|anonymous|ai|codex|bot|agent)(?:$|[-_.\s])/iu;

function validHumanReviewerId(value) {
  return typeof value === "string" &&
    Boolean(value.trim()) &&
    value.trim() === value &&
    !PLACEHOLDER_HUMAN_REVIEWER.test(value);
}

function canonicalFigureAssetPaths(figureId, includeMobile) {
  return {
    png2240: `${FIGURE_ASSET_PREFIX}${figureId}-master.png`,
    webp2240: `${FIGURE_ASSET_PREFIX}${figureId}-2240.webp`,
    webp1120: `${FIGURE_ASSET_PREFIX}${figureId}-1120.webp`,
    ...(includeMobile ? { mobile: `${FIGURE_ASSET_PREFIX}${figureId}-mobile.webp` } : {}),
  };
}

function exactKeySet(value, expectedKeys, label) {
  if (!isPlainObject(value)) {
    fail(`${label}: expected an object`);
    return false;
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.join("|") !== expected.join("|")) {
    fail(`${label}: keys must be exactly ${expected.join(", ")}`);
    return false;
  }
  return true;
}

function checkLocalizationReviews() {
  const ledgerPath = join(ROOT, LOCALIZATION_REVIEW_PATH);
  if (!existsSync(ledgerPath) || !statSync(ledgerPath).isFile()) {
    const message = `${LOCALIZATION_REVIEW_PATH}: exact-bundle human localization approvals are missing`;
    if (RELEASE) fail(message);
    else warn(message);
    return 0;
  }

  const ledger = readJson(ledgerPath, LOCALIZATION_REVIEW_PATH);
  if (!ledger) return 0;
  if (!exactKeySet(
    ledger,
    ["schema", "courseId", "sourceLocale", "sourceMessageSha256", "checklistVersion", "locales"],
    LOCALIZATION_REVIEW_PATH,
  )) return 0;

  if (ledger.schema !== LOCALIZATION_REVIEW_SCHEMA) {
    fail(`${LOCALIZATION_REVIEW_PATH}.schema: expected ${LOCALIZATION_REVIEW_SCHEMA}`);
  }
  if (ledger.courseId !== "how-to-use-codex") {
    fail(`${LOCALIZATION_REVIEW_PATH}.courseId: expected how-to-use-codex`);
  }
  if (ledger.sourceLocale !== "en") {
    fail(`${LOCALIZATION_REVIEW_PATH}.sourceLocale: expected en`);
  }
  if (ledger.checklistVersion !== LOCALIZATION_REVIEW_CHECKLIST_VERSION) {
    fail(`${LOCALIZATION_REVIEW_PATH}.checklistVersion: expected ${LOCALIZATION_REVIEW_CHECKLIST_VERSION}`);
  }

  const englishPath = join(ROOT, "messages/codex/en.json");
  if (!SHA256_PATTERN.test(ledger.sourceMessageSha256 ?? "")) {
    fail(`${LOCALIZATION_REVIEW_PATH}.sourceMessageSha256: lowercase SHA-256 is required`);
  } else if (!existsSync(englishPath) || !statSync(englishPath).isFile()) {
    fail("messages/codex/en.json: source bundle required by localization approvals is missing");
  } else if (ledger.sourceMessageSha256 !== sha256(readFileSync(englishPath))) {
    fail(`${LOCALIZATION_REVIEW_PATH}.sourceMessageSha256: English source changed after localization review`);
  }

  if (!exactKeySet(ledger.locales, LOCALIZATION_REVIEW_LOCALES, `${LOCALIZATION_REVIEW_PATH}.locales`)) {
    return 0;
  }

  let approvedCount = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const locale of LOCALIZATION_REVIEW_LOCALES) {
    const label = `${LOCALIZATION_REVIEW_PATH}.locales.${locale}`;
    const review = ledger.locales[locale];
    if (!isPlainObject(review)) {
      fail(`${label}: expected an object`);
      continue;
    }
    if (review.status === "pending") {
      exactKeySet(review, ["status"], label);
      const message = `${label}: human terminology and semantic review is pending`;
      if (RELEASE) fail(message);
      else warn(message);
      continue;
    }

    const errorCountBefore = errors.length;
    if (!exactKeySet(review, ["status", "reviewer", "reviewedOn", "messageSha256", "checks"], label)) {
      continue;
    }
    if (review.status !== "approved") fail(`${label}.status: expected approved or pending`);
    if (!validHumanReviewerId(review.reviewer)) {
      fail(`${label}.reviewer: a non-placeholder stable human reviewer ID is required`);
    }
    if (!validDateOnly(review.reviewedOn) || review.reviewedOn > today) {
      fail(`${label}.reviewedOn: a real, non-future YYYY-MM-DD review date is required`);
    }
    if (!SHA256_PATTERN.test(review.messageSha256 ?? "")) {
      fail(`${label}.messageSha256: lowercase SHA-256 is required`);
    }
    if (exactKeySet(review.checks, LOCALIZATION_REVIEW_CHECKS, `${label}.checks`)) {
      for (const check of LOCALIZATION_REVIEW_CHECKS) {
        if (review.checks[check] !== true) fail(`${label}.checks.${check}: approved review result must be true`);
      }
    }

    const messagePath = join(ROOT, `messages/codex/${locale}.json`);
    if (!existsSync(messagePath) || !statSync(messagePath).isFile()) {
      fail(`${label}.messageSha256: messages/codex/${locale}.json is missing`);
    } else if (SHA256_PATTERN.test(review.messageSha256 ?? "") &&
               review.messageSha256 !== sha256(readFileSync(messagePath))) {
      fail(`${label}.messageSha256: messages/codex/${locale}.json changed after localization review`);
    }

    if (errors.length === errorCountBefore) approvedCount++;
  }

  if (RELEASE && approvedCount !== LOCALIZATION_REVIEW_LOCALES.length) {
    fail(`${LOCALIZATION_REVIEW_PATH}: expected 8 current localization approvals, found ${approvedCount}`);
  }
  return approvedCount;
}

function checkReviewRecord(review, expectedVersion, expectedChecks, expectedKeys, label) {
  if (!isPlainObject(review)) {
    fail(`${label}: structured review record is required`);
    return;
  }
  exactKeySet(review, expectedKeys, label);
  if (!validHumanReviewerId(review.reviewer)) {
    fail(`${label}.reviewer: a non-placeholder stable human reviewer ID is required`);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (!validDateOnly(review.reviewedOn) || review.reviewedOn > today) {
    fail(`${label}.reviewedOn: a real, non-future YYYY-MM-DD review date is required`);
  }
  if (review.checklistVersion !== expectedVersion) fail(`${label}.checklistVersion: expected ${expectedVersion}`);
  if (!exactKeySet(review.checks, expectedChecks, `${label}.checks`)) return;
  for (const key of expectedChecks) {
    if (review.checks[key] !== true) fail(`${label}.checks.${key}: approved review result must be true`);
  }
}

function checkStructuredFigureAudit(audit, figure, sourcesById, label) {
  if (audit.status !== "approved") fail(`${label}.status: audit must be approved`);
  if (!isPlainObject(audit.binding) || audit.binding.lessonSlug !== figure.lessonSlug || audit.binding.surface !== figure.surface) {
    fail(`${label}.binding: lesson and surface must match the figure manifest`);
  } else {
    exactKeySet(audit.binding, ["lessonSlug", "surface"], `${label}.binding`);
  }
  if (!isPlainObject(audit.rawSource)) {
    fail(`${label}.rawSource: external raw-source record is required`);
  } else {
    exactKeySet(
      audit.rawSource,
      ["kind", "archivalRef", "mediaType", "width", "height", "sha256", "retainedOutsidePublic"],
      `${label}.rawSource`,
    );
    if (!["course-authored-capture", "third-party-original"].includes(audit.rawSource.kind)) {
      fail(`${label}.rawSource.kind: unsupported raw-source kind`);
    }
    if (!Number.isInteger(audit.rawSource.width) || audit.rawSource.width < 1 ||
        !Number.isInteger(audit.rawSource.height) || audit.rawSource.height < 1) {
      fail(`${label}.rawSource: positive source dimensions are required`);
    }
    if (!SHA256_PATTERN.test(audit.rawSource.sha256 ?? "")) fail(`${label}.rawSource.sha256: lowercase SHA-256 is required`);
    if (!["image/png", "image/webp"].includes(audit.rawSource.mediaType)) fail(`${label}.rawSource.mediaType: image/png or image/webp is required`);
    if (audit.rawSource.retainedOutsidePublic !== true) fail(`${label}.rawSource.retainedOutsidePublic: must be true`);
  }

  if (!isPlainObject(audit.product) ||
      audit.product.capturedOn !== figure.capturedOn ||
      audit.product.codexVersion !== figure.codexVersion ||
      audit.product.operatingSystem !== figure.os) {
    fail(`${label}.product: capture date, Codex version, and operating system must match the manifest`);
  } else {
    exactKeySet(audit.product, ["capturedOn", "codexVersion", "operatingSystem"], `${label}.product`);
  }
  const supportingSource = sourcesById.get(audit.officialSupportingSourceId);
  if (!supportingSource || supportingSource.kind !== "official-doc" ||
      audit.officialSupportingSourceId !== figure.officialSupportingSourceId) {
    fail(`${label}.officialSupportingSourceId: matching official OpenAI documentation source is required`);
  }

  if (!isPlainObject(audit.reviews)) {
    fail(`${label}.reviews: OCR, metadata, and privacy reviews are required`);
  } else {
    exactKeySet(audit.reviews, ["ocr", "metadata", "privacy"], `${label}.reviews`);
    checkReviewRecord(
      audit.reviews.ocr,
      FIGURE_OCR_CHECKLIST_VERSION,
      FIGURE_OCR_CHECKS,
      ["reviewer", "reviewedOn", "checklistVersion", "engine", "engineVersion", "transcriptSha256", "checks"],
      `${label}.reviews.ocr`,
    );
    checkReviewRecord(
      audit.reviews.metadata,
      FIGURE_METADATA_CHECKLIST_VERSION,
      FIGURE_METADATA_CHECKS,
      ["reviewer", "reviewedOn", "checklistVersion", "tool", "toolVersion", "checks"],
      `${label}.reviews.metadata`,
    );
    checkReviewRecord(
      audit.reviews.privacy,
      FIGURE_PRIVACY_CHECKLIST_VERSION,
      CODEX_MEDIA_CHECKLIST,
      ["reviewer", "reviewedOn", "checklistVersion", "checks"],
      `${label}.reviews.privacy`,
    );
    if (!isPlainObject(audit.reviews.ocr) ||
        typeof audit.reviews.ocr.engine !== "string" || !audit.reviews.ocr.engine.trim() ||
        typeof audit.reviews.ocr.engineVersion !== "string" || !audit.reviews.ocr.engineVersion.trim() ||
        !SHA256_PATTERN.test(audit.reviews.ocr.transcriptSha256 ?? "")) {
      fail(`${label}.reviews.ocr: engine, version, and transcript digest are required`);
    }
    if (!isPlainObject(audit.reviews.metadata) ||
        typeof audit.reviews.metadata.tool !== "string" || !audit.reviews.metadata.tool.trim() ||
        typeof audit.reviews.metadata.toolVersion !== "string" || !audit.reviews.metadata.toolVersion.trim()) {
      fail(`${label}.reviews.metadata: tool and version are required`);
    }
  }

  if (!isPlainObject(audit.provenance)) {
    fail(`${label}.provenance: structured capture or reuse provenance is required`);
  } else if (audit.provenance.kind === "course-authored-editorial-capture") {
    exactKeySet(
      audit.provenance,
      ["kind", "capturedBy", "rightsHolder", "editorialPurpose", "rightsReviewer", "rightsReviewedOn", "originalCaptureConfirmed", "syntheticDataConfirmed", "publicationApproved"],
      `${label}.provenance`,
    );
    for (const key of ["capturedBy", "rightsHolder", "editorialPurpose"]) {
      if (typeof audit.provenance[key] !== "string" || !audit.provenance[key].trim()) fail(`${label}.provenance.${key}: value is required`);
    }
    if (!validHumanReviewerId(audit.provenance.rightsReviewer)) {
      fail(`${label}.provenance.rightsReviewer: a non-placeholder stable human reviewer ID is required`);
    }
    const today = new Date().toISOString().slice(0, 10);
    if (!validDateOnly(audit.provenance.rightsReviewedOn) || audit.provenance.rightsReviewedOn > today) {
      fail(`${label}.provenance.rightsReviewedOn: a real, non-future YYYY-MM-DD date is required`);
    }
    for (const key of ["originalCaptureConfirmed", "syntheticDataConfirmed", "publicationApproved"]) {
      if (audit.provenance[key] !== true) fail(`${label}.provenance.${key}: must be true`);
    }
    if (audit.rawSource?.kind !== "course-authored-capture") fail(`${label}.provenance: editorial capture requires a course-authored raw source`);
  } else if (audit.provenance.kind === "third-party-reuse") {
    exactKeySet(
      audit.provenance,
      ["kind", "sourceAssetUrl", "rightsBasis", "rightsReferenceUrl", "license", "attribution", "rightsReviewer", "rightsReviewedOn", "localHostingAllowed", "derivativesAllowed", "coursePublicationAllowed"],
      `${label}.provenance`,
    );
    if (!validHttps(audit.provenance.sourceAssetUrl) || !validHttps(audit.provenance.rightsReferenceUrl)) {
      fail(`${label}.provenance: third-party source and rights-reference URLs must use HTTPS`);
    }
    if (!["license", "written-permission", "published-reuse-terms"].includes(audit.provenance.rightsBasis)) {
      fail(`${label}.provenance.rightsBasis: explicit reuse basis is required`);
    }
    for (const key of ["license", "attribution"]) {
      if (typeof audit.provenance[key] !== "string" || !audit.provenance[key].trim()) fail(`${label}.provenance.${key}: value is required`);
    }
    if (!validHumanReviewerId(audit.provenance.rightsReviewer)) {
      fail(`${label}.provenance.rightsReviewer: a non-placeholder stable human reviewer ID is required`);
    }
    const today = new Date().toISOString().slice(0, 10);
    if (!validDateOnly(audit.provenance.rightsReviewedOn) || audit.provenance.rightsReviewedOn > today) {
      fail(`${label}.provenance.rightsReviewedOn: a real, non-future YYYY-MM-DD date is required`);
    }
    for (const key of ["localHostingAllowed", "derivativesAllowed", "coursePublicationAllowed"]) {
      if (audit.provenance[key] !== true) fail(`${label}.provenance.${key}: must be true`);
    }
    if (audit.rawSource?.kind !== "third-party-original") fail(`${label}.provenance: third-party reuse requires a third-party raw source`);
  } else {
    fail(`${label}.provenance.kind: must distinguish editorial capture from third-party reuse`);
  }
}

function loadFigureAuditBindings(figures, sources) {
  const path = join(ROOT, FIGURE_AUDIT_PATH);
  const ledger = readJson(path, FIGURE_AUDIT_PATH);
  const auditById = new Map();
  const auditByFigureId = new Map();
  if (!isPlainObject(ledger)) return { auditById, auditByFigureId };
  exactKeySet(ledger, ["schema", "audits"], FIGURE_AUDIT_PATH);
  if (ledger.schema !== FIGURE_AUDIT_SCHEMA) fail(`${FIGURE_AUDIT_PATH}: schema must be ${FIGURE_AUDIT_SCHEMA}`);
  if (!Array.isArray(ledger.audits)) {
    fail(`${FIGURE_AUDIT_PATH}: audits must be an array`);
    return { auditById, auditByFigureId };
  }

  const figureById = new Map(figures.map((figure) => [figure?.id, figure]));
  const sourcesById = new Map(sources.map((source) => [source?.id, source]));
  for (const [index, audit] of ledger.audits.entries()) {
    const label = `${FIGURE_AUDIT_PATH}: audits[${index}]`;
    if (!isPlainObject(audit)) {
      fail(`${label}: audit must be an object`);
      continue;
    }
    exactKeySet(
      audit,
      ["id", "figureId", "status", "binding", "rawSource", "servedAssets", "product", "officialSupportingSourceId", "reviews", "provenance"],
      label,
    );
    if (typeof audit.id !== "string" || !FIGURE_AUDIT_ID_PATTERN.test(audit.id)) {
      fail(`${label}.id: must use codex-figure-audit.fig-XX.<stable-suffix>`);
    } else if (auditById.has(audit.id)) {
      fail(`${label}.id: duplicate audit ID ${audit.id}`);
    } else {
      auditById.set(audit.id, audit);
    }
    if (!FIGURE_ID_PATTERN.test(audit.figureId ?? "")) {
      fail(`${label}.figureId: must identify fig-01 through fig-24`);
    } else if (auditByFigureId.has(audit.figureId)) {
      fail(`${label}.figureId: multiple audits bind ${audit.figureId}`);
    } else {
      auditByFigureId.set(audit.figureId, audit);
    }

    const figure = figureById.get(audit.figureId);
    if (!figure) {
      fail(`${label}.figureId: orphan audit does not match a figure manifest`);
      continue;
    }
    if (figure.status !== "available") {
      fail(`${label}.figureId: approved audit may bind only an available figure`);
      continue;
    }
    if (figure.auditId !== audit.id) fail(`${label}.id: figure auditId does not bind back to this record`);
    checkStructuredFigureAudit(audit, figure, sourcesById, label);
  }
  return { auditById, auditByFigureId };
}

function noSymlinkComponents(path, label) {
  const parts = relative(PUBLIC_ROOT, path).split(sep).filter(Boolean);
  let current = PUBLIC_ROOT;
  for (const part of ["", ...parts]) {
    if (part) current = join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) {
        fail(`${label}: symbolic links are forbidden (${rel(current)})`);
        return false;
      }
    } catch (error) {
      fail(`${label}: could not inspect path component ${rel(current)} (${error.message})`);
      return false;
    }
  }
  return true;
}

function checkFilesystemExtendedAttributes(path, label) {
  // macOS may attach an 11-byte OS-managed `com.apple.provenance` record:
  // marker 0102, a NUL byte, then eight opaque host-local bytes. The suffix is
  // checked only for length and hex form and is never reported or persisted.
  // This is not embedded image metadata and is not transported by Git or HTTP.
  // Inspect it only when macOS exposes its absolute system tool; other hosts do
  // not fail merely because `xattr` is unavailable.
  if (process.platform !== "darwin") return;
  const xattrTool = "/usr/bin/xattr";
  if (!existsSync(xattrTool)) return;

  const inspection = spawnSync(xattrTool, [path], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    shell: false,
    timeout: 5_000,
  });
  if (inspection.error || inspection.status !== 0) {
    fail(`${label}: could not list filesystem extended attributes`);
    return;
  }

  const stdout = typeof inspection.stdout === "string" ? inspection.stdout : "";
  const attributes = stdout
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean)
    .sort();
  if (attributes.length === 0) return;
  if (attributes.length !== 1 || attributes[0] !== "com.apple.provenance") {
    const unsupported = attributes.filter((attribute) => attribute !== "com.apple.provenance");
    fail(
      `${label}: unsupported filesystem extended attributes must be stripped${unsupported.length ? ` (${unsupported.join(", ")})` : ""}`,
    );
    return;
  }

  const provenance = spawnSync(xattrTool, ["-px", "com.apple.provenance", path], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    shell: false,
    timeout: 5_000,
  });
  if (provenance.error || provenance.status !== 0) {
    fail(`${label}: could not inspect the OS-managed provenance marker`);
    return;
  }
  const provenanceHex = typeof provenance.stdout === "string" ? provenance.stdout.replace(/\s+/gu, "").toLowerCase() : "";
  if (!/^010200[a-f0-9]{16}$/u.test(provenanceHex)) {
    fail(`${label}: OS-managed provenance marker does not have the permitted form`);
  }
}

function readCanonicalFigureAsset(src, expectedSrc, label) {
  if (src !== expectedSrc) {
    fail(`${label}: path must be exactly ${expectedSrc}`);
    return null;
  }
  const requestedPath = resolve(PUBLIC_ROOT, `.${src}`);
  if (!isPathInside(requestedPath, FIGURE_ASSET_ROOT)) {
    fail(`${label}: path escapes ${rel(FIGURE_ASSET_ROOT)}`);
    return null;
  }
  if (!existsSync(requestedPath)) {
    fail(`${label}: referenced canonical asset does not exist (${src})`);
    return null;
  }
  if (!noSymlinkComponents(requestedPath, label)) return null;
  const target = lstatSync(requestedPath);
  if (!target.isFile()) {
    fail(`${label}: canonical asset must be a regular file`);
    return null;
  }
  try {
    const realPublicRoot = realpathSync(PUBLIC_ROOT);
    const realAssetRoot = realpathSync(FIGURE_ASSET_ROOT);
    const realPath = realpathSync(requestedPath);
    if (!isPathInside(realAssetRoot, realPublicRoot) || !isPathInside(realPath, realAssetRoot)) {
      fail(`${label}: real path escapes the canonical figure directory`);
      return null;
    }
  } catch (error) {
    fail(`${label}: could not resolve canonical real path (${error.message})`);
    return null;
  }
  checkFilesystemExtendedAttributes(requestedPath, label);
  return readFileSync(requestedPath);
}

function inspectCanonicalFigureAsset(src, expectedSrc, role, label) {
  const bytes = readCanonicalFigureAsset(src, expectedSrc, label);
  if (!bytes) return null;
  const expectedMediaType = role === "png2240" ? "image/png" : "image/webp";
  const inspection = role === "png2240" ? inspectPng(bytes) : inspectWebp(bytes);
  if (!inspection.ok) fail(`${label}: invalid ${inspection.format} container (${inspection.errors.join("; ")})`);
  if (!inspection.complete) fail(`${label}: ${inspection.format} container does not terminate exactly at EOF`);
  const policy = rejectImageMetadataAndFeatures(inspection);
  if (!policy.ok) fail(`${label}: forbidden metadata or container feature (${policy.errors.join("; ")})`);
  return {
    bytes: bytes.length,
    width: inspection.width,
    height: inspection.height,
    mediaType: expectedMediaType,
    sha256: sha256(bytes),
  };
}

function registerUniqueValue(registry, value, owner, kind) {
  if (typeof value !== "string" || !value) return;
  const previous = registry.get(value);
  if (previous) fail(`${owner}: duplicate served ${kind} already used by ${previous}`);
  else registry.set(value, owner);
}

function checkFigureAssetDirectory(expectedPaths) {
  if (!existsSync(FIGURE_ASSET_ROOT)) return;
  const realRoot = realpathSync(FIGURE_ASSET_ROOT);
  const inspect = (path) => {
    const label = rel(path);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      fail(`${label}: symbolic links are forbidden under the Codex figure directory`);
      return;
    }
    const realPath = realpathSync(path);
    if (!isPathInside(realPath, realRoot)) {
      fail(`${label}: real path escapes the Codex figure directory`);
      return;
    }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) inspect(join(path, entry));
      return;
    }
    if (!stat.isFile() || !/\.(?:png|webp|jpe?g|gif|avif|svg)$/i.test(path)) return;
    const publicPath = `/${relative(PUBLIC_ROOT, path).split(sep).join("/")}`;
    if (!expectedPaths.has(publicPath)) fail(`${label}: orphan image is not bound to an available Course 2 figure`);
  };
  inspect(FIGURE_ASSET_ROOT);
}

function checkFigures(figures, sources) {
  const ids = uniqueIds(figures, "FIGURES");
  const { auditById } = loadFigureAuditBindings(figures, sources);
  const servedPaths = new Map();
  const servedHashes = new Map();
  const declaredHashes = new Map();
  const expectedPaths = new Set();
  for (const [index, figure] of figures.entries()) {
    const label = `FIGURES[${index}] (${figure?.id ?? "unknown"})`;
    if ((figure?.altKey !== undefined || figure?.captionKey !== undefined) &&
        !nonEmptyStrings([figure?.altKey, figure?.captionKey])) {
      fail(`${label}: altKey and captionKey are required`);
    }
    if (!new Set(["app", "cli", "ide", "cloud", "github"]).has(figure?.surface)) {
      fail(`${label}: surface must be app, cli, ide, cloud, or github`);
    }

    if (figure?.status === "capture-required") {
      const premature = [
        "auditId",
        "officialSupportingSourceId",
        "src",
        "fallback",
        "srcSet",
        "assetSha256",
        "width",
        "height",
        "sha256",
        "capturedAt",
        "capturedOn",
        "productVersion",
        "codexVersion",
        "os",
        "privacyReviewed",
        "sourceUrl",
        "thirdPartySourceUrl",
        "thirdPartyLicense",
      ].filter(
        (field) => figure[field] !== undefined,
      );
      if (premature.length) fail(`${label}: capture-required records must not carry ${premature.join(", ")}`);
      if (typeof figure.captureIntent !== "string" || !figure.captureIntent.trim()) {
        fail(`${label}: captureIntent must describe the real UI evidence still needed`);
      }
      if (!nonEmptyStrings(figure.privacyChecklist)) fail(`${label}: privacyChecklist must be present before capture`);
      const message = `${label}: real Codex UI capture is still required`;
      if (RELEASE) fail(message);
      else warn(message);
      continue;
    }

    if (!new Set(["ready", "available"]).has(figure?.status)) {
      fail(`${label}: status must be "capture-required", "ready", or the live-schema alias "available"`);
      continue;
    }
    if (!FIGURE_ID_PATTERN.test(figure.id ?? "")) {
      fail(`${label}: available figure ID must be fig-01 through fig-24`);
      continue;
    }
    if (figure.fallback !== undefined) fail(`${label}.fallback: noncanonical fallback assets are forbidden`);
    if (figure.width !== 2240 || !Number.isInteger(figure.height) || figure.height < 1) {
      fail(`${label}: available figures need a 2240-pixel master and positive integer height`);
    }
    const capturedAt = figure.capturedAt ?? figure.capturedOn;
    const productVersion = figure.productVersion ?? figure.codexVersion;
    if (!validDate(capturedAt)) {
      fail(`${label}: capturedAt (or capturedOn) must be an ISO date or timestamp`);
    } else {
      const capturedTime = Date.parse(capturedAt.length === 10 ? `${capturedAt}T00:00:00Z` : capturedAt);
      const ageDays = (Date.now() - capturedTime) / 86_400_000;
      if (ageDays < -1) fail(`${label}: capture date is unexpectedly in the future`);
      if (ageDays > 90) fail(`${label}: capture is older than the required 90-day freshness window`);
    }
    if (typeof productVersion !== "string" || !productVersion.trim()) fail(`${label}: Codex product version is required`);
    if (typeof figure.os !== "string" || !figure.os.trim()) fail(`${label}: os is required when available`);
    if (figure.privacyReviewed !== true) fail(`${label}: compatibility privacyReviewed flag must be true`);
    if (!validHttps(figure.sourceUrl)) fail(`${label}: sourceUrl must be an HTTPS provenance URL`);
    if (!SHA256_PATTERN.test(figure.sha256 ?? "")) fail(`${label}: sha256 must be 64 lowercase hexadecimal characters`);

    const audit = typeof figure.auditId === "string" ? auditById.get(figure.auditId) : undefined;
    if (!audit) {
      fail(`${label}.auditId: no matching approved figure-audit record; privacyReviewed alone is insufficient`);
    } else if (audit.figureId !== figure.id || audit.id !== figure.auditId || audit.status !== "approved") {
      fail(`${label}.auditId: manifest and audit do not form an approved two-way binding`);
    }

    const includeMobile = figure.srcSet?.mobile !== undefined;
    const canonical = canonicalFigureAssetPaths(figure.id, includeMobile);
    const manifestPaths = {
      png2240: figure.src,
      webp2240: figure.srcSet?.webp2240,
      webp1120: figure.srcSet?.webp1120,
      ...(includeMobile ? { mobile: figure.srcSet.mobile } : {}),
    };
    const roles = Object.keys(canonical);
    exactKeySet(figure.assetSha256, roles, `${label}.assetSha256`);
    if (figure.sha256 !== figure.assetSha256?.png2240) fail(`${label}.sha256: must equal assetSha256.png2240`);
    if (audit && !exactKeySet(audit.servedAssets, roles, `${label}.audit.servedAssets`)) {
      // The mismatch is already recorded; individual bindings below remain fail-closed.
    }

    const inspectedByRole = new Map();
    for (const role of roles) {
      const owner = `${label}.${role}`;
      const src = manifestPaths[role];
      const expectedSrc = canonical[role];
      expectedPaths.add(expectedSrc);
      registerUniqueValue(servedPaths, src, owner, "path");
      registerUniqueValue(declaredHashes, figure.assetSha256?.[role], owner, "manifest hash");
      const inspected = inspectCanonicalFigureAsset(src, expectedSrc, role, owner);
      if (inspected) {
        inspectedByRole.set(role, inspected);
        registerUniqueValue(servedHashes, inspected.sha256, owner, "binary hash");
        if (figure.assetSha256?.[role] !== inspected.sha256) fail(`${owner}: manifest SHA-256 does not match actual bytes`);
      }

      const frozen = audit?.servedAssets?.[role];
      if (!isPlainObject(frozen)) {
        fail(`${owner}: bound audit is missing the frozen served-asset record`);
        continue;
      }
      exactKeySet(frozen, ["path", "mediaType", "width", "height", "sha256"], `${owner}.audit`);
      if (frozen.path !== expectedSrc || frozen.path !== src) fail(`${owner}: audit path, manifest path, and canonical path must match`);
      const expectedMediaType = role === "png2240" ? "image/png" : "image/webp";
      if (frozen.mediaType !== expectedMediaType) fail(`${owner}: audit MIME type must be ${expectedMediaType}`);
      if (!SHA256_PATTERN.test(frozen.sha256 ?? "")) fail(`${owner}: audit SHA-256 must be lowercase hexadecimal`);
      if (frozen.sha256 !== figure.assetSha256?.[role]) fail(`${owner}: audit and manifest SHA-256 values differ`);
      if (inspected) {
        if (frozen.sha256 !== inspected.sha256) fail(`${owner}: frozen audit SHA-256 does not match actual bytes`);
        if (frozen.width !== inspected.width || frozen.height !== inspected.height) fail(`${owner}: frozen audit dimensions do not match actual bytes`);
        if (frozen.mediaType !== inspected.mediaType) fail(`${owner}: frozen audit MIME type does not match decoded container`);
      }
    }

    const master = inspectedByRole.get("png2240");
    const large = inspectedByRole.get("webp2240");
    const small = inspectedByRole.get("webp1120");
    if (master && (master.width !== 2240 || master.width !== figure.width || master.height !== figure.height)) {
      fail(`${label}.dimensions: master container dimensions do not match the manifest`);
    }
    if (large && (large.width !== 2240 || (master && large.height !== master.height))) {
      fail(`${label}.srcSet.webp2240: dimensions must match the 2240-pixel PNG master`);
    }
    if (small && small.width !== 1120) fail(`${label}.srcSet.webp1120: width must be exactly 1120 pixels`);
    if (master && small && Math.abs(small.height - Math.round(master.height / 2)) > 1) {
      fail(`${label}.srcSet.webp1120: derivative aspect ratio does not match the master`);
    }
  }
  checkFigureAssetDirectory(expectedPaths);
  return ids;
}

function checkQuizzes(quizzes, sourceIds, lessons) {
  const ids = uniqueIds(quizzes, "QUIZ_QUESTIONS");
  const quizUnits = new Set();
  const quizLessons = new Set();
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  for (const [index, quiz] of quizzes.entries()) {
    const label = `QUIZ_QUESTIONS[${index}] (${quiz?.id ?? "unknown"})`;
    const relatedLesson = lessonBySlug.get(quiz?.lessonSlug);
    const declaredUnit = quiz?.unit ?? quiz?.unitId;
    const expectedUnit = lessonUnit(relatedLesson);
    const unit = declaredUnit ?? expectedUnit;
    if ((typeof unit !== "string" || !unit.trim()) && !Number.isInteger(unit)) {
      fail(`${label}: unit or lessonSlug is required`);
    } else {
      quizUnits.add(String(unit));
    }
    if (quiz?.lessonSlug !== undefined) {
      if (!relatedLesson) fail(`${label}: unknown lessonSlug "${quiz.lessonSlug}"`);
      else quizLessons.add(quiz.lessonSlug);
    }
    if (relatedLesson && declaredUnit !== undefined && String(declaredUnit) !== String(expectedUnit)) {
      fail(`${label}: unit must match lesson ${quiz.lessonSlug}'s unit (${expectedUnit})`);
    }
    if (quiz?.promptKey !== undefined && (typeof quiz.promptKey !== "string" || !quiz.promptKey.trim())) {
      fail(`${label}: promptKey must be a translation key`);
    }
    if (quiz?.optionKeys !== undefined &&
        (!Array.isArray(quiz.optionKeys) || quiz.optionKeys.length < 2 ||
         !quiz.optionKeys.every((key) => typeof key === "string" && key))) {
      fail(`${label}: optionKeys must contain at least two translation keys`);
    }
    const optionCount = quiz.optionKeys?.length ?? 4;
    if (!Number.isInteger(quiz?.correctIndex) || quiz.correctIndex < 0 || quiz.correctIndex >= optionCount) {
      fail(`${label}: correctIndex must point to an optionKeys entry`);
    }
    if (quiz?.explanationKey !== undefined &&
        (typeof quiz.explanationKey !== "string" || !quiz.explanationKey.trim())) {
      fail(`${label}: explanationKey is required`);
    }
    if (!nonEmptyStrings(quiz?.sourceIds)) {
      fail(`${label}: sourceIds must cite at least one source`);
    } else {
      for (const id of quiz.sourceIds) if (!sourceIds.has(id)) fail(`${label}: unknown sourceId "${id}"`);
    }
  }
  for (const unit of new Set(lessons.map(lessonUnit))) {
    if (!quizUnits.has(String(unit))) fail(`QUIZ_QUESTIONS: no question covers lesson unit ${unit}`);
  }
  if (quizzes.some((quiz) => quiz?.lessonSlug !== undefined)) {
    for (const lesson of lessons) {
      if (!quizLessons.has(lesson.slug)) fail(`QUIZ_QUESTIONS: no question covers lesson ${lesson.slug}`);
    }
  }
  return ids;
}

function checkPractices(practices, lessons) {
  if (!Array.isArray(practices)) {
    if (lessons.every((lesson) => typeof lesson?.practiceId === "string" && lesson.practiceId)) return;
    fail("PRACTICES: expected a split practice manifest or a practiceId on every lesson");
    return;
  }
  uniqueIds(practices, "PRACTICES");
  const represented = new Set();
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  for (const [index, practice] of practices.entries()) {
    const lessonSlug = practice?.lessonSlug;
    if (typeof lessonSlug !== "string" || !EXPECTED_SLUGS.includes(lessonSlug)) {
      fail(`PRACTICES[${index}]: lessonSlug must name a course lesson`);
      continue;
    }
    if (represented.has(lessonSlug)) fail(`PRACTICES: duplicate practice for ${lessonSlug}`);
    represented.add(lessonSlug);
    const expectedId = lessonBySlug.get(lessonSlug)?.practiceId;
    if (expectedId !== undefined && practice?.id !== expectedId) {
      fail(`PRACTICES[${index}]: id must match ${lessonSlug}'s practiceId "${expectedId}"`);
    }
    if (typeof practice?.promptKey !== "string" || !practice.promptKey.trim()) {
      fail(`PRACTICES[${index}]: promptKey is required`);
    }
    if (!Number.isInteger(practice?.observableActionCount) || practice.observableActionCount < 1) {
      fail(`PRACTICES[${index}]: observableActionCount must be positive`);
    }
    if (!Number.isInteger(practice?.selfCheckCriteriaCount) || practice.selfCheckCriteriaCount < 1) {
      fail(`PRACTICES[${index}]: selfCheckCriteriaCount must be positive`);
    }
    if (practice?.completionKey !== `codex.lesson.${lessonSlug}`) {
      fail(`PRACTICES[${index}]: completionKey must be codex.lesson.${lessonSlug}`);
    }
  }
  for (const lesson of lessons) {
    if (!represented.has(lesson.slug)) fail(`PRACTICES: no practice is defined for ${lesson.slug}`);
  }
}

function flattenMessages(value, prefix = "", output = {}, label = "messages/codex/en.json") {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => flattenMessages(child, `${prefix}[${index}]`, output, label));
    return output;
  }
  if (!value || typeof value !== "object") {
    fail(`${label}: "${prefix || "<root>"}" must resolve to a string`);
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    flattenMessages(child, prefix ? `${prefix}.${key}` : key, output, label);
  }
  return output;
}

function translationKeys(value, output = new Set()) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const child of value) translationKeys(child, output);
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key.endsWith("Key") && typeof child === "string") output.add(child);
    if (key.endsWith("Keys") && Array.isArray(child)) {
      for (const candidate of child) if (typeof candidate === "string") output.add(candidate);
    }
    translationKeys(child, output);
  }
  return output;
}

function checkTranslations(data) {
  const mainMessages = join(ROOT, "messages");
  if (!existsSync(mainMessages)) {
    fail("messages/: main locale directory is missing");
    return { locales: [], english: {} };
  }
  const locales = readdirSync(mainMessages)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -5))
    .sort();
  const codexMessages = join(mainMessages, "codex");
  if (!existsSync(codexMessages)) {
    fail("messages/codex/: course translation directory is missing");
    return { locales, english: {} };
  }
  const unexpectedLocales = readdirSync(codexMessages)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -5))
    .filter((locale) => !locales.includes(locale));
  if (unexpectedLocales.length) {
    fail(`messages/codex/: translation tables have no matching main locale: ${unexpectedLocales.join(", ")}`);
  }
  const tables = new Map();
  for (const locale of locales) {
    const path = join(codexMessages, `${locale}.json`);
    if (!existsSync(path)) {
      fail(`messages/codex/${locale}.json: missing translation table`);
      continue;
    }
    const value = readJson(path);
    if (value) tables.set(locale, flattenMessages(value, "", {}, `messages/codex/${locale}.json`));
  }

  const english = tables.get("en") ?? {};
  if (!tables.has("en")) fail("messages/codex/en.json: canonical English table is missing");
  const englishKeys = Object.keys(english).sort();
  for (const [locale, table] of tables) {
    const keys = Object.keys(table).sort();
    const missing = englishKeys.filter((key) => !(key in table));
    const extra = keys.filter((key) => !(key in english));
    if (missing.length) fail(`messages/codex/${locale}.json: missing keys: ${missing.join(", ")}`);
    if (extra.length) fail(`messages/codex/${locale}.json: extra keys: ${extra.join(", ")}`);
    for (const [key, value] of Object.entries(table)) {
      if (!value.trim()) fail(`messages/codex/${locale}.json: "${key}" is empty`);
    }
  }

  const simplifiedChinese = tables.get("zh-Hans");
  const traditionalChinese = tables.get("zh-Hant");
  if (simplifiedChinese && traditionalChinese) {
    const sharedKeys = Object.keys(simplifiedChinese).filter((key) => key in traditionalChinese);
    const distinctValues = sharedKeys.filter((key) => simplifiedChinese[key] !== traditionalChinese[key]).length;
    const minimumDistinctValues = Math.max(25, Math.ceil(sharedKeys.length * 0.1));
    if (distinctValues < minimumDistinctValues) {
      fail(
        `messages/codex/zh-Hans.json and zh-Hant.json must remain distinct localized bundles ` +
        `(found ${distinctValues} differing learner-visible strings; expected at least ${minimumDistinctValues})`,
      );
    }
  }

  const implementationContractKeys = [
    "lessons.ground-plan.practice.steps[1]",
    "lessons.debug-test.practice.steps[1]",
    "lessons.automation-capstone.practice.steps[0]",
    "lessons.automation-capstone.practice.steps[1]",
    "lessons.automation-capstone.practice.evidence[0]",
    "figures.fig-03.caption",
    "figures.fig-10.alt",
    "capstone.scenario",
    "capstone.instructions[1]",
    "capstone.instructions[2]",
    "capstone.instructions[3]",
  ];
  for (const [locale, table] of tables) {
    for (const key of implementationContractKeys) {
      if (!table[key]?.includes("lib/courses.ts")) {
        fail(`messages/codex/${locale}.json: ${key} must identify lib/courses.ts as part of the capstone implementation contract`);
      }
    }
  }

  const required = translationKeys(data);
  for (const key of required) {
    if (!(key in english)) fail(`messages/codex/en.json: referenced key "${key}" is missing`);
  }

  for (const lesson of data.lessons ?? []) {
    const prefix = `lessons.${lesson.slug}`;
    for (const suffix of ["title", "objective", "practice.title", "practice.brief", "takeaway"]) {
      if (!( `${prefix}.${suffix}` in english)) {
        fail(`messages/codex/en.json: ${prefix}.${suffix} is required for the lesson experience`);
      }
    }
    const sectionHeadings = Object.keys(english).filter((key) =>
      new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.sections\\[\\d+\\]\\.heading$`).test(key));
    if (sectionHeadings.length < 1 && !lesson.blocks?.length) {
      fail(`messages/codex/en.json: ${prefix}.sections must contain teaching content`);
    }
  }
  for (const quiz of data.quizzes ?? []) {
    if (quiz.promptKey) continue;
    const prefix = `quiz.${quiz.id}`;
    for (const suffix of ["question", "explanation"]) {
      if (!( `${prefix}.${suffix}` in english)) fail(`messages/codex/en.json: ${prefix}.${suffix} is required`);
    }
    const options = Object.keys(english).filter((key) => key.startsWith(`${prefix}.options[`));
    if (options.length !== 4) fail(`messages/codex/en.json: ${prefix}.options must contain exactly four choices`);
  }
  for (const figure of data.figures ?? []) {
    if (figure.altKey && figure.captionKey) continue;
    for (const suffix of ["alt", "caption"]) {
      const key = `figures.${figure.id}.${suffix}`;
      if (!(key in english)) fail(`messages/codex/en.json: ${key} is required`);
    }
  }
  return { locales, english };
}

function walk(path) {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".next", "out", ".git"].includes(entry.name)) return [];
    return walk(join(path, entry.name));
  });
}

function scanTextSafety() {
  const roots = [
    join(ROOT, "app/[locale]/_blocked/codex"),
    join(ROOT, "components/codex"),
    join(ROOT, "lib/codex"),
    join(ROOT, "messages/codex"),
    join(ROOT, "tests/fixtures/codex-course-demo"),
    join(ROOT, "public/courses/codex"),
  ];
  const textExtensions = new Set(["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".css", ".html", ".svg", ".txt", ".sha256"]);
  const remoteSourcePatterns = [
    /\bsrc(?:Set)?\s*=\s*(?:\{\s*)?["'`]\s*https?:\/\//i,
    /(?:["'](?:src|fallback|srcSet)["']|\b(?:src|fallback|srcSet))\s*:\s*(?:\{\s*)?["'`]\s*https?:\/\//i,
    /url\(\s*["']?https?:\/\//i,
    /!\[[^\]]*\]\(https?:\/\//i,
  ];
  const secretPatterns = [
    ["personal macOS path", /\/Users\/[^\s"'`/]+\//g],
    ["email address", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
    ["OpenAI-style secret", /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g],
    ["GitHub token", /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/g],
    ["AWS access key", /\bAKIA[A-Z0-9]{16}\b/g],
    ["Google API key", /\bAIza[A-Za-z0-9_-]{30,}\b/g],
    ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
    ["Bearer token", /\bBearer\s+[A-Za-z0-9._~-]{24,}\b/g],
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ];

  for (const path of roots.flatMap(walk)) {
    if (!textExtensions.has(extname(path).toLowerCase())) continue;
    const source = readFileSync(path, "utf8");
    for (const pattern of remoteSourcePatterns) {
      if (pattern.test(source)) {
        fail(`${rel(path)}: remote image/script src detected; commit instructional assets locally`);
        break;
      }
    }
    for (const [name, pattern] of secretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(source)) fail(`${rel(path)}: possible ${name} detected`);
    }
  }
}

function checkTypedContent() {
  const runner = join(ROOT, "scripts", "check-codex-content.ts");
  const validation = spawnSync(process.execPath, ["--import", "tsx", runner], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });

  if (validation.error) {
    fail(`typed content validator could not start (${validation.error.message})`);
    return;
  }
  if (validation.status !== 0) {
    fail(`typed content validator crashed (${validation.stderr.trim() || `exit ${validation.status}`})`);
    return;
  }

  try {
    const parsed = JSON.parse(validation.stdout);
    if (!Array.isArray(parsed.issues)) throw new Error("issues is not an array");
    for (const issue of parsed.issues) {
      fail(`CONTENT [${issue.locale}] ${issue.path}: ${issue.message}`);
    }
  } catch (error) {
    fail(`typed content validator returned invalid JSON (${error.message})`);
  }
}

const loaded = loadCourseData();
const lessons = expectArray(loaded.lessons, "LESSONS", loaded.sourcePath);
const sources = expectArray(loaded.sources, "SOURCES", loaded.sourcePath);
const figures = expectArray(loaded.figures, "FIGURES", loaded.sourcePath);
const quizzes = expectArray(loaded.quizzes, "QUIZ_QUESTIONS", loaded.sourcePath);

checkCourseRoutes();
checkCapstoneFixture();
checkLessons(lessons);
checkPractices(loaded.practices, lessons);
const sourceIds = checkSources(sources);
const figureIds = checkFigures(figures, sources);
if (figureIds.size !== 24) fail(`FIGURES: expected exactly 24 unique figures, found ${figureIds.size}`);
const figureById = new Map(figures.map((figure) => [figure?.id, figure]));
const referencedFigureIds = new Set();
const lessonIndexBySlug = new Map(lessons.map((lesson, index) => [lesson?.slug, index]));
const allowedBlockTypes = new Set(["prose", "steps", "code", "callout", "comparison", "figure", "exercise", "source-note"]);

for (const [index, lesson] of lessons.entries()) {
  const label = `LESSONS[${index}] (${lesson?.slug ?? "unknown"})`;
  const prerequisites = lesson?.prerequisites ?? [];
  if (new Set(prerequisites).size !== prerequisites.length) fail(`${label}: prerequisites must not contain duplicates`);
  for (const prerequisite of prerequisites) {
    const prerequisiteIndex = lessonIndexBySlug.get(prerequisite);
    if (prerequisiteIndex === undefined) fail(`${label}: unknown prerequisite "${prerequisite}"`);
    else if (prerequisiteIndex >= index) fail(`${label}: prerequisite "${prerequisite}" must precede this lesson`);
  }

  const blocks = lesson?.blocks ?? [];
  for (const [blockIndex, block] of blocks.entries()) {
    if (!allowedBlockTypes.has(block?.type)) fail(`${label}: blocks[${blockIndex}] has an unknown type`);
  }
  const blockFigureIds = blocks.filter((block) => block?.type === "figure").map((block) => block?.figureId);
  if (JSON.stringify(blockFigureIds) !== JSON.stringify(lesson?.figureIds ?? [])) {
    fail(`${label}: figure blocks must match figureIds in order`);
  }
  const proseSectionIndices = blocks.filter((block) => block?.type === "prose").map((block) => block?.sectionIndex);
  if (JSON.stringify(proseSectionIndices) !== JSON.stringify([0, 1, 2])) {
    fail(`${label}: prose blocks must reference sections 0, 1, and 2 exactly once and in order`);
  }
  const exerciseBlocks = blocks.filter((block) => block?.type === "exercise");
  if (exerciseBlocks.length !== 1 || exerciseBlocks[0]?.practiceId !== lesson?.practiceId) {
    fail(`${label}: exactly one exercise block must reference practiceId`);
  }
  const sourceNotes = blocks.filter((block) => block?.type === "source-note");
  if (sourceNotes.length !== 1 || JSON.stringify(sourceNotes[0]?.sourceIds) !== JSON.stringify(lesson?.sourceIds)) {
    fail(`${label}: exactly one source-note block must match sourceIds`);
  }
  for (const id of lesson?.sourceIds ?? []) if (!sourceIds.has(id)) fail(`${label}: unknown sourceId "${id}"`);
  for (const id of lesson?.figureIds ?? []) {
    if (!figureIds.has(id)) fail(`${label}: unknown figureId "${id}"`);
    else if (figureById.get(id)?.lessonSlug !== undefined && figureById.get(id).lessonSlug !== lesson.slug) {
      fail(`${label}: figureId "${id}" belongs to ${figureById.get(id).lessonSlug}`);
    }
    if (referencedFigureIds.has(id)) fail(`${label}: figureId "${id}" is referenced by more than one lesson`);
    referencedFigureIds.add(id);
  }
}
for (const id of figureIds) {
  if (!referencedFigureIds.has(id)) fail(`FIGURES: "${id}" is not referenced by any lesson`);
}
if (referencedFigureIds.size !== 24) {
  fail(`FIGURES: expected exactly 24 figures referenced once, found ${referencedFigureIds.size}`);
}

const quizIds = checkQuizzes(quizzes, sourceIds, lessons);
if (quizIds.size !== 24) fail(`QUIZ_QUESTIONS: expected exactly 24 unique questions, found ${quizIds.size}`);
const quizCountsByUnit = new Map();
for (const quiz of quizzes) {
  const unit = quiz?.unit ?? quiz?.unitId;
  if (unit !== undefined) quizCountsByUnit.set(String(unit), (quizCountsByUnit.get(String(unit)) ?? 0) + 1);
}
for (const unit of ["unit-1", "unit-2", "unit-3", "unit-4"]) {
  if ((quizCountsByUnit.get(unit) ?? 0) < 3) fail(`QUIZ_QUESTIONS: ${unit} must provide at least three questions`);
}
if (![...quizCountsByUnit.values()].some((count) => count > 3)) {
  fail("QUIZ_QUESTIONS: at least one unit needs an unused alternative so a retry can draw a distinct stratified set");
}
const quizById = new Map(quizzes.map((quiz) => [quiz?.id, quiz]));
const referencedQuizIds = new Set();
for (const [index, lesson] of lessons.entries()) {
  const label = `LESSONS[${index}] (${lesson?.slug ?? "unknown"})`;
  for (const id of lesson?.quizIds ?? []) {
    if (!quizIds.has(id)) fail(`${label}: unknown quizId "${id}"`);
    else if (quizById.get(id)?.lessonSlug !== undefined && quizById.get(id).lessonSlug !== lesson.slug) {
      fail(`${label}: quizId "${id}" belongs to ${quizById.get(id).lessonSlug}`);
    }
    if (referencedQuizIds.has(id)) fail(`${label}: quizId "${id}" is referenced by more than one lesson`);
    referencedQuizIds.add(id);
  }
}
if (lessons.some((lesson) => lesson?.quizIds !== undefined)) {
  for (const id of quizIds) {
    if (!referencedQuizIds.has(id)) fail(`QUIZ_QUESTIONS: "${id}" is not referenced by any lesson`);
  }
}
checkTranslations({ lessons, sources, figures, quizzes });
const localizationReviewCount = checkLocalizationReviews();
scanTextSafety();
checkTypedContent();

const result = {
  ok: errors.length === 0,
  mode: RELEASE ? "release" : "development",
  lessonCount: lessons.length,
  expectedLessonCount: EXPECTED_SLUGS.length,
  localizationReviewCount,
  expectedLocalizationReviewCount: LOCALIZATION_REVIEW_LOCALES.length,
  warnings,
  errors,
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const message of warnings) console.warn(`WARN  ${message}`);
  for (const message of errors) console.error(`FAIL  ${message}`);
  if (result.ok) {
    console.log(
      `PASS  Codex course (${lessons.length} lessons, ${sources.length} sources, ` +
      `${figures.length} figures, ${quizzes.length} quiz questions; ${result.mode} mode)`,
    );
  } else {
    console.error(`\nCodex course check failed with ${errors.length} problem(s).`);
  }
}

process.exit(result.ok ? 0 : 1);
