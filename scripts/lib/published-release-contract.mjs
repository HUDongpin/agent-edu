import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readJson(root, path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function readText(root, path) {
  return readFileSync(resolve(root, path), "utf8");
}

/**
 * Validate the registry-derived publication wiring shared by every course gate.
 *
 * Course checkers still own their curriculum, evidence, media, assessment and
 * storage contracts. This helper owns the platform boundary so those checkers
 * do not regress to brittle searches for one hand-authored footer link or one
 * hard-coded npm build string.
 */
export function publishedReleaseIntegrationErrors(root, courseId, expectedGate, expectedRoutes) {
  const errors = [];
  let contract;
  let packageJson;
  try {
    contract = readJson(root, "config/course-release-surface.json");
    packageJson = readJson(root, "package.json");
  } catch (error) {
    return [`published release contract could not be read: ${error.message}`];
  }

  const matches = contract.courses?.filter((course) => course.id === courseId) ?? [];
  if (matches.length !== 1) {
    errors.push(`${courseId}: release registry must contain exactly one course record`);
  } else {
    const course = matches[0];
    if (course.state !== "published") {
      errors.push(`${courseId}: release registry state must be published`);
    }
    if (course.releaseGate !== expectedGate) {
      errors.push(`${courseId}: registry releaseGate must be ${expectedGate}`);
    }
    if (!course.primaryLocale || !course.contentLocales?.includes(course.primaryLocale)) {
      errors.push(`${courseId}: registry must declare a real primary content locale`);
    }
    if (!Array.isArray(course.routes) || course.routes.length === 0) {
      errors.push(`${courseId}: registry must declare at least one public route`);
    } else if (expectedRoutes && JSON.stringify(course.routes) !== JSON.stringify(expectedRoutes)) {
      errors.push(`${courseId}: registry routes must exactly match the curriculum route order`);
    }
  }

  const scripts = packageJson.scripts ?? {};
  if (scripts["published:check:release"] !== "node scripts/run-published-release-gates.mjs") {
    errors.push("package.json: published:check:release must use the registry-driven gate runner");
  }
  const verifySource = String(scripts["verify:source"] ?? "");
  if (!verifySource.includes("npm run published:check:release")) {
    errors.push("package.json: verify:source must run the published-course gate ledger");
  }
  const releaseBuild = String(scripts["build:release"] ?? "");
  const sourceAt = releaseBuild.indexOf("npm run verify:source");
  const buildAt = releaseBuild.indexOf("next build");
  if (sourceAt < 0 || buildAt < 0 || sourceAt > buildAt) {
    errors.push("package.json: build:release must run verify:source before next build");
  }

  const consumers = [
    ["app/[locale]/page.tsx", ["PUBLISHED_CATALOG_COURSES", "featuredCourses"]],
    ["app/[locale]/courses/page.tsx", ["PUBLISHED_CATALOG_COURSES.map", "courseHrefFor(course.id, locale)"]],
    ["components/courses/Catalog.tsx", ["CATALOG_COURSE_RELEASES.map", "courseHrefFor"]],
    ["components/Shell.tsx", ["PUBLISHED_CATALOG_COURSES", "footerCourses.map", "courseHrefFor"]],
    ["lib/seo.ts", ["PUBLISHED_LOCALIZED_PAGES", "export const PAGES = PUBLISHED_LOCALIZED_PAGES"]],
    ["app/sitemap.ts", ["PAGES.flatMap", "contentLocalesForPage"]],
    ["scripts/generate-sitemaps.mjs", ["state === \"published\"", "course.contentLocales"]],
  ];
  for (const [path, tokens] of consumers) {
    let source;
    try {
      source = readText(root, path);
    } catch (error) {
      errors.push(`${path}: registry consumer could not be read (${error.message})`);
      continue;
    }
    for (const token of tokens) {
      if (!source.includes(token)) errors.push(`${path}: missing registry-derived consumer token ${token}`);
    }
  }

  return errors;
}
