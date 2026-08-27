#!/usr/bin/env node

/**
 * Audits Course 19's emitted HTML and sitemap after `next build`.
 * It covers nine locale shells, the overview, all twelve modules, metadata,
 * structured data, language boundaries, and sitemap discovery without a browser.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP_ROOT = join(ROOT, ".next", "server", "app");
const SITE = "https://aicourse.top";
const COURSE_ID = "math-animation";
const COURSE_CODE = "19";
const locales = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const nativeLocales = new Set(["en", "zh-Hans"]);
const fallbackLocales = new Set(locales.filter((locale) => !nativeLocales.has(locale)));
const slugs = [
  "outcome-before-engine",
  "repository-evidence-lab",
  "scene-contract-storyboard",
  "manim-environment-first-scene",
  "transformations-camera-continuity",
  "equations-graphs-geometry",
  "codex-implementation-loop",
  "claude-direction-review",
  "motion-canvas-web-track",
  "voice-slides-remotion",
  "mathematical-visual-accessibility-qa",
  "capstone-release-pack",
];
const FALLBACK_NOTICE =
  "This course has reviewed long-form copy in English and Simplified Chinese. You are viewing the English content inside your selected site language.";
const EXPECTED_HTML_COUNT = locales.length * (slugs.length + 1);
const failures = [];
const notes = [];
const fail = (message) => failures.push(message);
const note = (message) => notes.push(message);
const count = (text, pattern) => [...text.matchAll(pattern)].length;

function latestMtimeMs(path) {
  if (!existsSync(path)) return 0;
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.mtimeMs;
  return Math.max(
    stat.mtimeMs,
    ...readdirSync(path, { withFileTypes: true }).map((entry) =>
      latestMtimeMs(join(path, entry.name)),
    ),
  );
}

function coursePath(locale, slug) {
  return slug
    ? join(APP_ROOT, locale, COURSE_ID, `${slug}.html`)
    : join(APP_ROOT, locale, `${COURSE_ID}.html`);
}

function publicUrl(locale, slug) {
  return `${SITE}/${locale}/${COURSE_ID}/${slug ? `${slug}/` : ""}`;
}

function htmlTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return match?.[1] ?? match?.[2];
}

function tagsWithAttribute(html, name, attributeName, expectedValue) {
  return htmlTags(html, name).filter(
    (tag) => attribute(tag, attributeName)?.toLowerCase() === expectedValue.toLowerCase(),
  );
}

function extractJsonLd(html, file) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) {
    fail(`${file}: expected exactly one JSON-LD block, found ${blocks.length}`);
    return [];
  }
  try {
    const value = JSON.parse(blocks[0][1]);
    return Array.isArray(value?.["@graph"]) ? value["@graph"] : [value];
  } catch (error) {
    fail(`${file}: invalid JSON-LD (${error instanceof Error ? error.message : String(error)})`);
    return [];
  }
}

function inspectMetadata(html, file, locale, slug) {
  const contentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  const expectedCanonical = publicUrl(contentLocale, slug);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const titleValues = [...head.matchAll(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, "").trim());
  if (titleValues.length !== 1 || Array.from(titleValues[0] ?? "").length < 12) {
    fail(`${file}: expected one substantive title`);
  }

  const descriptions = tagsWithAttribute(head, "meta", "name", "description");
  const descriptionLength = Array.from((attribute(descriptions[0] ?? "", "content") ?? "").trim()).length;
  const minimumDescriptionLength = contentLocale === "zh-Hans" ? 24 : 80;
  if (descriptions.length !== 1 || descriptionLength < minimumDescriptionLength) {
    fail(`${file}: expected one substantive metadata description`);
  }

  const canonicals = tagsWithAttribute(head, "link", "rel", "canonical");
  if (canonicals.length !== 1 || attribute(canonicals[0], "href") !== expectedCanonical) {
    fail(`${file}: canonical is not ${expectedCanonical}`);
  }

  const alternates = tagsWithAttribute(head, "link", "rel", "alternate")
    .filter((tag) => attribute(tag, "hrefLang") ?? attribute(tag, "hreflang"));
  const actualAlternates = new Map(
    alternates.map((tag) => [
      attribute(tag, "hrefLang") ?? attribute(tag, "hreflang"),
      attribute(tag, "href"),
    ]),
  );
  const expectedAlternates = new Map([
    ["en", publicUrl("en", slug)],
    ["zh-Hans", publicUrl("zh-Hans", slug)],
    ["x-default", publicUrl("en", slug)],
  ]);
  if (actualAlternates.size !== expectedAlternates.size) {
    fail(`${file}: expected exactly en, zh-Hans, and x-default alternates`);
  }
  for (const [hrefLang, href] of expectedAlternates) {
    if (actualAlternates.get(hrefLang) !== href) fail(`${file}: missing ${hrefLang} alternate ${href}`);
  }
  for (const fallback of fallbackLocales) {
    if (actualAlternates.has(fallback)) fail(`${file}: advertises fallback locale ${fallback} as translated content`);
  }

  const ogUrls = tagsWithAttribute(head, "meta", "property", "og:url");
  if (ogUrls.length !== 1 || attribute(ogUrls[0], "content") !== expectedCanonical) {
    fail(`${file}: og:url is not the canonical content URL`);
  }

  const graph = extractJsonLd(html, file);
  const expectedType = slug ? "LearningResource" : "Course";
  const primary = graph.find((node) => node?.["@type"] === expectedType);
  if (!primary) {
    fail(`${file}: missing ${expectedType} JSON-LD node`);
    return;
  }
  if (primary.inLanguage !== contentLocale) {
    fail(`${file}: JSON-LD inLanguage is ${String(primary.inLanguage)}, expected ${contentLocale}`);
  }
  if (primary.url !== expectedCanonical) {
    fail(`${file}: JSON-LD url is ${String(primary.url)}, expected ${expectedCanonical}`);
  }
  if (slug) {
    if (primary.position !== slugs.indexOf(slug) + 1) fail(`${file}: JSON-LD module position is wrong`);
    if (primary.isPartOf?.courseCode !== COURSE_CODE) fail(`${file}: JSON-LD isPartOf courseCode is not ${COURSE_CODE}`);
  } else {
    if (primary.courseCode !== COURSE_CODE) fail(`${file}: JSON-LD courseCode is not ${COURSE_CODE}`);
    if (!Array.isArray(primary.hasPart) || primary.hasPart.length !== slugs.length + 2) {
      fail(`${file}: Course JSON-LD must expose twelve modules, assessment, and capstone`);
    }
  }
}

function auditHtml(locale, slug) {
  const absolute = coursePath(locale, slug);
  const file = relative(ROOT, absolute);
  let html;
  try {
    html = readFileSync(absolute, "utf8");
  } catch {
    fail(`${file}: emitted HTML is missing`);
    return;
  }

  const htmlTag = htmlTags(html, "html")[0] ?? "";
  const expectedOuterDirection = locale === "ar" ? "rtl" : "ltr";
  if (attribute(htmlTag, "lang") !== locale || attribute(htmlTag, "dir") !== expectedOuterDirection) {
    fail(`${file}: outer html lang/dir does not match ${locale}/${expectedOuterDirection}`);
  }

  const testId = slug ? `math-animation-module-${slug}` : "math-animation-course";
  const wrappers = htmlTags(html, "div").filter((tag) => attribute(tag, "data-testid") === testId);
  const contentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  if (wrappers.length !== 1) {
    fail(`${file}: expected one ${testId} content wrapper, found ${wrappers.length}`);
  } else if (attribute(wrappers[0], "lang") !== contentLocale || attribute(wrappers[0], "dir") !== "ltr") {
    fail(`${file}: content wrapper must declare ${contentLocale}/ltr`);
  }

  if (count(html, /<h1(?:\s|>)/g) !== 1) fail(`${file}: expected exactly one h1`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) fail(`${file}: duplicate IDs: ${duplicateIds.join(", ")}`);

  // Next's RSC payload serializes the complete copy object, including the
  // fallback string, even when the notice is not rendered. Requiring the
  // adjacent closing paragraph distinguishes visible HTML from payload data.
  const hasFallbackNotice = html.includes(`>${FALLBACK_NOTICE}</p>`);
  if (fallbackLocales.has(locale) && !hasFallbackNotice) fail(`${file}: missing visible English-content fallback notice`);
  if (!fallbackLocales.has(locale) && hasFallbackNotice) fail(`${file}: native edition unexpectedly shows fallback notice`);

  if (slug) {
    if (!html.includes(`data-testid="math-animation-module-${slug}"`)) fail(`${file}: wrong module test ID`);
    if (count(html, /class="[^"]*proseSection[^"]*"/g) !== 3) fail(`${file}: expected three teaching sections`);
    const evidenceFields = htmlTags(html, "textarea");
    const evidenceMinimums = evidenceFields.map((tag) => attribute(tag, "minLength"));
    if (
      !html.includes(`aria-labelledby="${slug}-evidence-title"`) ||
      evidenceFields.length !== 2 ||
      !evidenceMinimums.includes("12") ||
      !evidenceMinimums.includes("20")
    ) {
      fail(`${file}: emitted module does not expose the two-part evidence gate`);
    }
  } else {
    for (const moduleSlug of slugs) {
      if (!html.includes(`/${locale}/${COURSE_ID}/${moduleSlug}/`)) {
        fail(`${file}: overview is missing module link ${moduleSlug}`);
      }
    }
    if (!html.includes("/courses/math-animation/posters/unit-circle-sine-keyframes.svg")) {
      fail(`${file}: overview is missing the deterministic local poster`);
    }
    if (!html.includes("/courses/math-animation/starter-kit.zip")) {
      fail(`${file}: overview is missing the complete starter-kit download`);
    }
    if (!html.includes("math-animation-assessment") || !html.includes("math-animation-capstone")) {
      fail(`${file}: overview is missing assessment or capstone anchors`);
    }
  }

  inspectMetadata(html, file, locale, slug);
}

const buildIdPath = join(ROOT, ".next", "BUILD_ID");
if (!existsSync(buildIdPath)) {
  console.error("FAIL Course 19 static audit: .next/BUILD_ID is missing; run `next build` first.");
  process.exit(1);
}

const courseBuildInputs = [
  join(ROOT, "app", "[locale]", COURSE_ID),
  join(ROOT, "components", COURSE_ID),
  join(ROOT, "lib", COURSE_ID),
  join(ROOT, "app", "sitemap.ts"),
  join(ROOT, "lib", "seo.ts"),
  join(ROOT, "scripts", "check-math-animation-static.mjs"),
];
const latestCourseInputMtime = Math.max(...courseBuildInputs.map(latestMtimeMs));
if (statSync(buildIdPath).mtimeMs < latestCourseInputMtime) {
  fail("build artifacts predate a Course 19 source or static-audit input; run `next build` before the static audit");
}

const expectedArtifacts = locales.flatMap((locale) => [
  coursePath(locale, undefined),
  ...slugs.map((slug) => coursePath(locale, slug)),
]);
expectedArtifacts.push(join(APP_ROOT, "sitemap.xml.body"));
const missing = expectedArtifacts.filter((path) => !existsSync(path));
if (missing.length) {
  for (const path of missing.slice(0, 20)) fail(`${relative(ROOT, path)}: emitted artifact is missing`);
  if (missing.length > 20) fail(`...and ${missing.length - 20} more emitted artifacts are missing`);
} else {
  for (const locale of locales) {
    auditHtml(locale, undefined);
    for (const slug of slugs) auditHtml(locale, slug);
  }
}

let emittedCount = 0;
for (const locale of locales) {
  const overview = coursePath(locale, undefined);
  if (existsSync(overview)) emittedCount += 1;
  const moduleRoot = join(APP_ROOT, locale, COURSE_ID);
  if (existsSync(moduleRoot)) {
    emittedCount += readdirSync(moduleRoot).filter((name) => name.endsWith(".html")).length;
  }
}
if (emittedCount !== EXPECTED_HTML_COUNT) {
  fail(`emitted Course 19 HTML count is ${emittedCount}, expected ${EXPECTED_HTML_COUNT}`);
}

const sitemapPath = join(APP_ROOT, "sitemap.xml.body");
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const courseEntries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((match) => match[1])
    .filter((entry) => entry.includes(`/${COURSE_ID}/`));
  const expectedSitemapEntries = (slugs.length + 1) * nativeLocales.size;
  if (courseEntries.length !== expectedSitemapEntries) {
    fail(`Course 19 sitemap count is ${courseEntries.length}, expected ${expectedSitemapEntries}`);
  }
  for (const entry of courseEntries) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
    if (!new RegExp(`^${SITE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/(?:en|zh-Hans)\/${COURSE_ID}\/`).test(loc)) {
      fail(`sitemap includes a non-native Course 19 URL: ${loc || "<missing loc>"}`);
    }
    for (const hrefLang of ["en", "zh-Hans", "x-default"]) {
      if (!entry.includes(`hreflang="${hrefLang}"`)) fail(`${loc}: sitemap is missing ${hrefLang} alternate`);
    }
    for (const fallback of fallbackLocales) {
      if (entry.includes(`hreflang="${fallback}"`)) fail(`${loc}: sitemap advertises fallback locale ${fallback}`);
    }
  }
}

note(`${EXPECTED_HTML_COUNT} HTML documents checked across ${locales.length} locale shells`);
note(`${slugs.length} module routes plus overview metadata and structured data checked per locale`);
note(`${(slugs.length + 1) * nativeLocales.size} native sitemap entries expected`);

const report = {
  schemaVersion: 1,
  courseId: COURSE_ID,
  status: failures.length ? "fail" : "pass",
  counts: {
    locales: locales.length,
    modules: slugs.length,
    html: emittedCount,
    expectedHtml: EXPECTED_HTML_COUNT,
  },
  failures,
  notes,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (failures.length) {
  process.stderr.write(`FAIL Course 19 static output audit (${failures.length} finding${failures.length === 1 ? "" : "s"})\n`);
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
} else {
  process.stdout.write("PASS Course 19 static output audit\n");
  for (const item of notes) process.stdout.write(`- ${item}\n`);
}

process.exitCode = failures.length ? 1 : 0;
