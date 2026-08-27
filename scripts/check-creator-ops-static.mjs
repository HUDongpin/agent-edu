#!/usr/bin/env node

/** Audit Course 16 emitted HTML and sitemap after `next build`. */
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  BUILD_ID_INPUT_PATHS,
  deterministicBuildId,
} from "../lib/deterministic-build-id.cjs";

const ROOT = process.cwd();
const OUTPUT_ROOT = join(ROOT, "out");
const PROVENANCE_PATH = join(ROOT, "outputs", "creator-ops-course-research-brief.provenance.md");
const SITE = "https://aicourse.top";
const manifestSource = readFileSync(join(ROOT, "lib", "creator-ops", "manifest.ts"), "utf8");
const manifestVersion = manifestSource.match(/\bversion:\s*"(\d+\.\d+\.\d+)"/u)?.[1] ?? null;
const locales = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const nativeLocales = new Set(["en", "zh-Hans"]);
const slugs = [
  "outcomes-operating-system",
  "audience-signal-radar",
  "evidence-research-packet",
  "editorial-agent-architecture",
  "writing-brand-fact-gates",
  "multimodal-asset-pipeline",
  "repurpose-content-assets",
  "human-approved-distribution",
  "community-analytics-loop",
  "evaluation-governance-capstone",
];
const failures = [];
const fail = (message) => failures.push(message);
const utf8PathCompare = (left, right) => (
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
);
if (!existsSync(OUTPUT_ROOT)) {
  console.error("FAIL Course 16 static output audit: out/ is missing; run `next build` first.");
  process.exit(1);
}

function latestMtimeMs(path) {
  if (!existsSync(path)) return 0;
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.mtimeMs;
  return Math.max(
    stat.mtimeMs,
    ...readdirSync(path, { withFileTypes: true }).map((entry) => latestMtimeMs(join(path, entry.name))),
  );
}

// The deployment receipt signs all of out/, so freshness must cover the same
// full-site build-input boundary rather than a hand-picked Course 16 subset.
const buildInputs = BUILD_ID_INPUT_PATHS.map((path) => join(ROOT, path));

const expectedBuildId = deterministicBuildId(ROOT);
const nextBuildIdPath = join(ROOT, ".next", "BUILD_ID");
let emittedBuildId = null;
if (!isRegularDeploymentFile(nextBuildIdPath)) {
  fail(".next/BUILD_ID: deterministic build identifier is missing; run `next build` again");
} else {
  emittedBuildId = readFileSync(nextBuildIdPath, "utf8").trim();
  if (emittedBuildId !== expectedBuildId) {
    fail(`.next/BUILD_ID is ${JSON.stringify(emittedBuildId)}, expected ${JSON.stringify(expectedBuildId)} from frozen build inputs`);
  }
  for (const filename of ["_buildManifest.js", "_clientMiddlewareManifest.js", "_ssgManifest.js"]) {
    const manifestPath = join(OUTPUT_ROOT, "_next", "static", emittedBuildId, filename);
    if (!isRegularDeploymentFile(manifestPath)) {
      fail(`${relative(ROOT, manifestPath)}: deterministic build manifest is missing`);
    }
  }
}

function coursePath(locale, slug) {
  return slug
    ? join(OUTPUT_ROOT, locale, "creator-ops", slug, "index.html")
    : join(OUTPUT_ROOT, locale, "creator-ops", "index.html");
}

function publicUrl(locale, slug) {
  return `${SITE}/${locale}/creator-ops/${slug ? `${slug}/` : ""}`;
}

function isRegularDeploymentFile(path) {
  if (!existsSync(path)) return false;
  const stat = lstatSync(path);
  return stat.isFile() && !stat.isSymbolicLink();
}

function collectDeploymentFiles(directory, label) {
  if (!existsSync(directory)) {
    fail(`${label}: deployment directory is missing`);
    return [];
  }
  const rootStat = lstatSync(directory);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    fail(`${label}: expected a real deployment directory`);
    return [];
  }
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isSymbolicLink()) {
        fail(`${relative(OUTPUT_ROOT, path)}: deployment surface cannot contain symbolic links`);
      } else if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        files.push(path);
      } else {
        fail(`${relative(OUTPUT_ROOT, path)}: deployment surface contains a non-regular entry`);
      }
    }
  };
  visit(directory);
  return files;
}

function collectTopLevelDeploymentFiles(directory, label) {
  if (!existsSync(directory)) {
    fail(`${label}: deployment directory is missing`);
    return [];
  }
  const rootStat = lstatSync(directory);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    fail(`${label}: expected a real deployment directory`);
    return [];
  }
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      fail(`${relative(OUTPUT_ROOT, path)}: deployment surface cannot contain symbolic links`);
    } else if (entry.isFile()) {
      files.push(path);
    } else if (!entry.isDirectory()) {
      fail(`${relative(OUTPUT_ROOT, path)}: deployment surface contains a non-regular entry`);
    }
  }
  return files;
}

const expected = locales.flatMap((locale) => [
  coursePath(locale),
  ...slugs.map((slug) => coursePath(locale, slug)),
]);
const catalogPages = locales.map((locale) => join(OUTPUT_ROOT, locale, "courses", "index.html"));
const missing = [...expected, ...catalogPages].filter((path) => !isRegularDeploymentFile(path));
if (missing.length) {
  console.error(`FAIL Course 16 static output audit: ${missing.length} deployment HTML files are missing from out/.`);
  missing.slice(0, 12).forEach((path) => console.error(`- ${relative(ROOT, path)}`));
  process.exit(1);
}

const sitemapPath = join(OUTPUT_ROOT, "sitemap.xml");
const buildArtifacts = [...expected, sitemapPath].filter(isRegularDeploymentFile);
if (
  buildArtifacts.length > 0
  && Math.min(...buildArtifacts.map((path) => statSync(path).mtimeMs))
    < Math.max(...buildInputs.map(latestMtimeMs))
) {
  fail("out/ deployment artifacts predate a Course 16 input; run `next build` again");
}

function deploymentPathFor(urlPath, reportEscape = true) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split(/[?#]/u)[0]);
  } catch {
    pathname = urlPath.split(/[?#]/u)[0];
  }
  if (!pathname || !pathname.startsWith("/")) return null;
  const relativePath = pathname.replace(/^\/+/, "");
  const target = pathname.endsWith("/")
    ? join(OUTPUT_ROOT, relativePath, "index.html")
    : join(OUTPUT_ROOT, relativePath);
  const targetRelative = relative(OUTPUT_ROOT, target);
  if (targetRelative === ".." || targetRelative.startsWith(`..${sep}`)) {
    if (reportEscape) fail(`local deployment reference escapes out/: ${urlPath}`);
    return null;
  }
  return target;
}

for (const escapeProbe of ["/../README.md", "/%2e%2e/README.md"]) {
  if (deploymentPathFor(escapeProbe, false) !== null) {
    fail(`deployment path containment fixture accepted ${escapeProbe}`);
  }
}

function runtimeAssetPathFor(reference) {
  const pathname = reference.split(/[?#]/u)[0];
  if (
    !pathname.startsWith("/_next/")
    && !/\.(?:avif|css|gif|ico|jpe?g|js|json|mjs|png|svg|webmanifest|webp|woff2?|ttf|otf)$/iu.test(pathname)
  ) {
    return null;
  }
  const path = deploymentPathFor(reference);
  if (!path) return null;
  const relativePath = relative(OUTPUT_ROOT, path);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`)) {
    fail(`deployment asset escapes out/: ${reference}`);
    return null;
  }
  return path;
}

function uniqueSidecarScalar(text, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...text.matchAll(
    new RegExp(`^${escapedKey}\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^#\\r\\n]+))\\s*$`, "gm"),
  )];
  if (matches.length !== 1) {
    fail(`${relative(ROOT, PROVENANCE_PATH)}: ${key} must appear exactly once; found ${matches.length}`);
    return matches.length > 0
      ? (matches[0][1] ?? matches[0][2] ?? matches[0][3] ?? "").trim()
      : null;
  }
  return (matches[0][1] ?? matches[0][2] ?? matches[0][3] ?? "").trim();
}

const deploymentSurface = new Set([...expected, ...catalogPages, sitemapPath]);
const publicNoticePath = join(OUTPUT_ROOT, "courses", "creator-ops", "NOTICE.md");
if (!isRegularDeploymentFile(publicNoticePath)) {
  fail("out/courses/creator-ops/NOTICE.md: published Course 16 rights notice is missing");
} else {
  deploymentSurface.add(publicNoticePath);
}
// The browser can prefetch shared-navigation routes that are not directly
// linked by the Course 16 body. Sign the complete static export so every file
// this server can return is inside the independently reviewed deployment
// closure, including prefetched HTML and RSC payloads.
for (const path of collectDeploymentFiles(OUTPUT_ROOT, "out")) {
  deploymentSurface.add(path);
}
for (const path of collectDeploymentFiles(join(OUTPUT_ROOT, "_next"), "out/_next")) {
  deploymentSurface.add(path);
}
for (const locale of locales) {
  for (const path of collectTopLevelDeploymentFiles(join(OUTPUT_ROOT, locale), `out/${locale}`)) {
    deploymentSurface.add(path);
  }
  for (const [label, directory] of [
    [`out/${locale}/creator-ops`, join(OUTPUT_ROOT, locale, "creator-ops")],
    [`out/${locale}/courses`, join(OUTPUT_ROOT, locale, "courses")],
  ]) {
    for (const path of collectDeploymentFiles(directory, label)) deploymentSurface.add(path);
  }
}

function collectRuntimeAssets(html, file) {
  const references = new Set(
    [...html.matchAll(/\s(?:href|src)="([^"]+)"/gu)].map((match) => match[1]),
  );
  for (const reference of references) {
    const assetPath = runtimeAssetPathFor(reference);
    if (!assetPath) continue;
    if (!isRegularDeploymentFile(assetPath)) {
      fail(`${file}: runtime deployment asset is missing: ${reference}`);
      continue;
    }
    deploymentSurface.add(assetPath);
  }
}

function extractJsonLd(html, file) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) {
    fail(`${file}: expected one JSON-LD block, found ${blocks.length}`);
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

for (const locale of locales) {
  for (const slug of [undefined, ...slugs]) {
    const absolute = coursePath(locale, slug);
    const file = relative(ROOT, absolute);
    const html = readFileSync(absolute, "utf8");
    collectRuntimeAssets(html, file);
    const contentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
    const expectedCanonical = publicUrl(contentLocale, slug);
    const outerDirection = locale === "ar" ? "rtl" : "ltr";
    const testId = slug ? `creator-ops-module-${slug}` : "creator-ops-course";

    if (!html.includes(`<html lang="${locale}" dir="${outerDirection}"`)) {
      fail(`${file}: outer html lang/dir mismatch`);
    }
    const colorSchemeTags = [...html.matchAll(/<meta\b[^>]*\bname="color-scheme"[^>]*>/gu)];
    if (colorSchemeTags.length !== 1 || !colorSchemeTags[0][0].includes('content="light dark"')) {
      fail(`${file}: expected exactly one Next-managed light/dark color-scheme meta tag`);
    }
    const wrapperPattern = new RegExp(`<div[^>]+lang="${contentLocale}"[^>]+dir="ltr"[^>]+data-testid="${testId}"`);
    if (!wrapperPattern.test(html)) fail(`${file}: content language wrapper is missing`);
    if ([...html.matchAll(/<h1(?:\s|>)/g)].length !== 1) fail(`${file}: expected exactly one h1`);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicates.length) fail(`${file}: duplicate ids: ${duplicates.join(", ")}`);
    if (!html.includes(`<link rel="canonical" href="${expectedCanonical}"/>`)) {
      fail(`${file}: canonical is not ${expectedCanonical}`);
    }
    for (const [hrefLang, target] of [["en", "en"], ["zh-Hans", "zh-Hans"], ["x-default", "en"]]) {
      if (!html.includes(`<link rel="alternate" hrefLang="${hrefLang}" href="${publicUrl(target, slug)}"/>`)) {
        fail(`${file}: missing ${hrefLang} alternate`);
      }
    }
    const graph = extractJsonLd(html, file);
    const type = slug ? "LearningResource" : "Course";
    const primary = graph.find((node) => node?.["@type"] === type);
    if (!primary) fail(`${file}: missing ${type} structured data`);
    else {
      if (primary.inLanguage !== contentLocale) fail(`${file}: JSON-LD language mismatch`);
      if (primary.url !== expectedCanonical) fail(`${file}: JSON-LD URL mismatch`);
      if ((slug ? primary.isPartOf?.courseCode : primary.courseCode) !== "16") {
        fail(`${file}: Course 16 code is missing from structured data`);
      }
    }

    const localReferences = new Set(
      [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)]
        .map((match) => match[1])
        .filter((reference) => reference.startsWith("/") && !reference.startsWith("//")),
    );
    for (const reference of localReferences) {
      const deploymentPath = deploymentPathFor(reference);
      if (deploymentPath && !isRegularDeploymentFile(deploymentPath)) {
        fail(`${file}: local deployment reference is missing: ${reference}`);
      }
    }
  }
}

for (const absolute of catalogPages) {
  if (!isRegularDeploymentFile(absolute)) continue;
  const file = relative(ROOT, absolute);
  const html = readFileSync(absolute, "utf8");
  collectRuntimeAssets(html, file);
  if (!html.includes("/creator-ops/")) {
    fail(`${file}: catalog does not expose Course 16`);
  }
}

const emitted = locales.flatMap((locale) => [
  coursePath(locale),
  ...readdirSync(join(OUTPUT_ROOT, locale, "creator-ops"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(OUTPUT_ROOT, locale, "creator-ops", entry.name, "index.html")))
    .map((entry) => join(OUTPUT_ROOT, locale, "creator-ops", entry.name, "index.html")),
]);
if (emitted.length !== 99) fail(`emitted Course 16 HTML count is ${emitted.length}, expected 99`);

const enOverview = readFileSync(coursePath("en"), "utf8");
const zhOverview = readFileSync(coursePath("zh-Hans"), "utf8");
const zhC2paModule = readFileSync(coursePath("zh-Hans", "multimodal-asset-pipeline"), "utf8");
const enOverviewWithoutComments = enOverview.replace(/<!--[\s\S]*?-->/gu, "");
if (!manifestVersion) {
  fail("lib/creator-ops/manifest.ts: semantic course version is missing");
} else if (!enOverviewWithoutComments.includes(`>v${manifestVersion}<`)) {
  fail(`English overview is missing the visible manifest version v${manifestVersion}`);
}
for (const token of ["MoneyPrinterTurbo", "MediaCrawler", "human authority"]) {
  if (!enOverview.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US"))) {
    fail(`English overview is missing ${token}`);
  }
}
if (!/27(?:<!-- -->|\s)*GitHub records/.test(enOverview)) {
  fail("English overview is missing the 27-record source count");
}
for (const token of ["智能体赋能自媒体运营", "人工", "证据", "版权"]) {
  if (!zhOverview.includes(token)) fail(`Chinese overview is missing ${token}`);
}
for (const token of ["LICENSE-MIT", "LICENSE-APACHE", "MIT OR Apache-2.0 (1/2)", "MIT OR Apache-2.0 (2/2)"]) {
  if (!zhC2paModule.includes(token)) fail(`c2pa-rs dual-license evidence is missing ${token}`);
}

if (!isRegularDeploymentFile(sitemapPath)) fail(`${relative(ROOT, sitemapPath)}: missing emitted sitemap`);
else {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((match) => match[1])
    .filter((entry) => entry.includes("/creator-ops/"));
  if (entries.length !== 22) fail(`Course 16 sitemap count is ${entries.length}, expected 22`);
  for (const entry of entries) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
    if (!/^https:\/\/aicourse\.top\/(?:en|zh-Hans)\/creator-ops\//.test(loc)) {
      fail(`sitemap includes a non-native Course 16 URL: ${loc || "<missing>"}`);
    }
    for (const hrefLang of ["en", "zh-Hans", "x-default"]) {
      if (!entry.includes(`hreflang="${hrefLang}"`)) fail(`${loc}: missing ${hrefLang} alternate`);
    }
    for (const fallback of locales.filter((locale) => !nativeLocales.has(locale))) {
      if (entry.includes(`hreflang="${fallback}"`)) fail(`${loc}: fallback locale ${fallback} advertised as a translation`);
    }
  }
}


const normalizedDeploymentFiles = [...deploymentSurface]
  .filter(isRegularDeploymentFile)
  .map((path) => ({
    absolute: path,
    relative: relative(OUTPUT_ROOT, path).split(sep).join("/"),
  }))
  .sort((left, right) => utf8PathCompare(left.relative, right.relative));

function deploymentSurfaceDigest(files, mutationRelative = null) {
  const hash = createHash("sha256");
  for (const file of files) {
    let bytes = readFileSync(file.absolute);
    if (file.relative === mutationRelative) {
      bytes = Buffer.from(bytes);
      bytes[0] ^= 1;
    }
    hash.update(file.relative, "utf8");
    hash.update("\0", "utf8");
    hash.update(bytes);
    hash.update("\0", "utf8");
  }
  return hash.digest("hex");
}
const deploymentSurfaceSha256 = deploymentSurfaceDigest(normalizedDeploymentFiles);
const deploymentSurfaceFileCount = normalizedDeploymentFiles.length;
const mutationCandidate = normalizedDeploymentFiles.find((file) => (
  file.relative === "ar/about/index.html" && statSync(file.absolute).size > 0
)) ?? normalizedDeploymentFiles.find((file) => (
  file.relative.startsWith("_next/") && statSync(file.absolute).size > 0
));
if (!mutationCandidate) {
  fail("deployment surface mutation fixture could not find a non-empty _next file");
} else if (
  deploymentSurfaceDigest(normalizedDeploymentFiles, mutationCandidate.relative)
  === deploymentSurfaceSha256
) {
  fail(`deployment surface hash ignored a one-byte mutation in ${mutationCandidate.relative}`);
}
if (!existsSync(PROVENANCE_PATH)) {
  fail(`${relative(ROOT, PROVENANCE_PATH)}: checksum-backed review receipt is missing`);
} else {
  const provenance = readFileSync(PROVENANCE_PATH, "utf8");
  const signedBuildId = uniqueSidecarScalar(provenance, "deterministic_build_id");
  const signedCount = uniqueSidecarScalar(provenance, "deployment_surface_file_count");
  const signedHash = uniqueSidecarScalar(provenance, "deployment_surface_sha256");
  if (signedBuildId !== expectedBuildId || signedBuildId !== emittedBuildId) {
    fail(
      `${relative(ROOT, PROVENANCE_PATH)}: deterministic_build_id must equal source and emitted build ID ${JSON.stringify(expectedBuildId)}; found ${JSON.stringify(signedBuildId)}`,
    );
  }
  if (signedCount !== String(deploymentSurfaceFileCount)) {
    fail(
      `${relative(ROOT, PROVENANCE_PATH)}: deployment_surface_file_count must equal ${deploymentSurfaceFileCount}; found ${JSON.stringify(signedCount)}`,
    );
  }
  if (signedHash !== deploymentSurfaceSha256) {
    fail(
      `${relative(ROOT, PROVENANCE_PATH)}: deployment_surface_sha256 must equal ${deploymentSurfaceSha256}; found ${JSON.stringify(signedHash)}`,
    );
  }
}

if (failures.length) {
  console.error(`FAIL Course 16 static output audit (${failures.length} findings)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`- computed deployment surface: ${deploymentSurfaceFileCount} files / ${deploymentSurfaceSha256}`);
  process.exit(1);
}

console.log("PASS Course 16 static output audit");
console.log("- 99 HTML documents: 9 route locales × (1 overview + 10 modules)");
console.log("- one h1, one Next-managed color scheme, unique ids, content language, canonical/hreflang, JSON-LD, and Course 16 code verified");
console.log("- 22 sitemap URLs: reviewed en + zh-Hans only, with reciprocal alternates");
console.log(`- deterministic source-derived Next build ID: ${emittedBuildId}`);
console.log(`- checksum-backed complete static-export closure: ${deploymentSurfaceFileCount} files / ${deploymentSurfaceSha256}`);
