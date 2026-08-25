#!/usr/bin/env node

/**
 * Fail-closed post-build audit for the Course 10 MCP static export.
 *
 * This intentionally reads only repository inputs and `out/`; it makes no
 * network requests. Run it after `next build`.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import {
  dirname,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "out");
const SITE_ORIGIN = "https://aicourse.top";
const PROTOCOL_VERSION = "2026-07-28";
const EVIDENCE_SNAPSHOT = "2026-08-24";

const LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
];

const LESSON_SLUGS = [
  "why-mcp",
  "architecture-trust",
  "discovery-versioning",
  "inspect-the-wire",
  "tools",
  "resources",
  "prompts-completion",
  "elicitation-mrtr",
  "transports-json-rpc",
  "flow-control",
  "authorization",
  "security",
  "build-server",
  "build-client",
  "host-integrations",
  "practitioner-patterns",
  "production-registry",
  "apps-tasks-capstone",
];

const FIGURE_IDS = [
  "inspector-settings",
  "inspector-tools",
  "inspector-resources",
  "inspector-prompts",
  "inspector-protocol",
  "inspector-apps",
  "gemini-cli-mcp-inventory",
  "codex-cli-mcp-configuration",
];

const ROUTE_SUFFIXES = ["", ...LESSON_SLUGS];
const EXPECTED_PAGE_COUNT = LOCALES.length * ROUTE_SUFFIXES.length;
const EXPECTED_HREFLANGS = [...LOCALES, "x-default"].sort();
const errors = new Set();

function fail(message) {
  errors.add(message);
}

function posixPath(path) {
  return path.split(sep).join("/");
}

function rootRelative(path) {
  return posixPath(relative(ROOT, path));
}

function outRelative(path) {
  return posixPath(relative(OUT, path));
}

function readBytes(path, label = rootRelative(path)) {
  try {
    return readFileSync(path);
  } catch (error) {
    fail(`${label}: could not be read (${error.message})`);
    return null;
  }
}

function readText(path, label = rootRelative(path)) {
  const bytes = readBytes(path, label);
  return bytes === null ? null : bytes.toString("utf8");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function expectedRoutes() {
  const routes = [];
  for (const locale of LOCALES) {
    for (const suffix of ROUTE_SUFFIXES) {
      const route = `/${locale}/mcp/${suffix ? `${suffix}/` : ""}`;
      routes.push({
        locale,
        suffix,
        route,
        canonical: `${SITE_ORIGIN}${route}`,
        html: `${locale}/mcp/${suffix ? `${suffix}/` : ""}index.html`,
      });
    }
  }
  return routes;
}

function compareExactInventory(label, actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  if (actual.length !== expected.length) {
    fail(`${label}: expected exactly ${expected.length}, found ${actual.length}`);
  }
  if (actualSet.size !== actual.length) {
    const seen = new Set();
    for (const value of actual) {
      if (seen.has(value)) fail(`${label}: duplicate ${value}`);
      seen.add(value);
    }
  }
  for (const value of expected) {
    if (!actualSet.has(value)) fail(`${label}: missing ${value}`);
  }
  for (const value of actualSet) {
    if (!expectedSet.has(value)) fail(`${label}: unexpected ${value}`);
  }
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributesFromTag(tag) {
  const attributes = new Map();
  const start = tag.search(/\s/);
  if (start === -1) return attributes;
  const pattern = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.slice(start).matchAll(pattern)) {
    attributes.set(
      match[1].toLowerCase(),
      decodeEntities(match[2] ?? match[3] ?? match[4] ?? ""),
    );
  }
  return attributes;
}

function tagsNamed(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => ({
    tag: match[0],
    index: match.index,
    attributes: attributesFromTag(match[0]),
  }));
}

function lineAt(source, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function visibleMarkup(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<template\b[\s\S]*?<\/template>/gi, "");
}

function textFromMarkup(markup) {
  return decodeEntities(markup.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function routeUrlFor(locale, suffix = "") {
  return `${SITE_ORIGIN}/${locale}/mcp/${suffix ? `${suffix}/` : ""}`;
}

function parseSrcset(value) {
  return value
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function outputPathForReference(reference, baseUrl, label) {
  if (!reference || /^(?:data:|blob:|mailto:|tel:|javascript:|#)/i.test(reference)) return null;
  let url;
  try {
    url = new URL(reference, baseUrl);
  } catch (error) {
    fail(`${label}: invalid URL ${reference} (${error.message})`);
    return null;
  }
  if (url.origin !== SITE_ORIGIN) {
    fail(`${label}: off-site runtime asset ${url.href}`);
    return null;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (error) {
    fail(`${label}: invalid URL encoding in ${reference} (${error.message})`);
    return null;
  }
  const path = resolve(OUT, `.${pathname}`);
  if (path !== OUT && !path.startsWith(`${OUT}${sep}`)) {
    fail(`${label}: local asset escapes out/ (${reference})`);
    return null;
  }
  return { path, url };
}

function requireLocalAsset(reference, baseUrl, label) {
  const resolved = outputPathForReference(reference, baseUrl, label);
  if (!resolved) return null;
  if (!existsSync(resolved.path) || !statSync(resolved.path).isFile()) {
    fail(`${label}: missing same-origin asset ${resolved.url.pathname}`);
  }
  return resolved;
}

function auditRuntimeAssets(html, pagePath, routeUrl, referencedCss) {
  for (const name of ["img", "source", "script", "link", "a"]) {
    for (const entry of tagsNamed(html, name)) {
      const label = `${outRelative(pagePath)}:${lineAt(html, entry.index)} <${name}>`;
      const attributes = entry.attributes;
      if (name === "img" || name === "source") {
        const src = attributes.get("src");
        if (src) requireLocalAsset(src, routeUrl, `${label} src`);
        const srcset = attributes.get("srcset");
        if (srcset) {
          for (const reference of parseSrcset(srcset)) {
            requireLocalAsset(reference, routeUrl, `${label} srcset`);
          }
        }
        continue;
      }
      if (name === "script") {
        const src = attributes.get("src");
        if (src) requireLocalAsset(src, routeUrl, `${label} src`);
        continue;
      }
      if (name === "a") {
        if (attributes.has("download") && attributes.get("href")) {
          requireLocalAsset(attributes.get("href"), routeUrl, `${label} download`);
        }
        continue;
      }

      const relations = new Set((attributes.get("rel") ?? "").toLowerCase().split(/\s+/).filter(Boolean));
      const resourceType = (attributes.get("as") ?? "").toLowerCase();
      const runtimeLink = relations.has("stylesheet") ||
        relations.has("modulepreload") ||
        ["icon", "apple-touch-icon", "mask-icon"].some((relation) => relations.has(relation)) ||
        (relations.has("preload") && ["font", "image", "script", "style"].includes(resourceType));
      if (!runtimeLink || !attributes.get("href")) continue;
      const resolved = requireLocalAsset(attributes.get("href"), routeUrl, `${label} href`);
      if (resolved && (relations.has("stylesheet") || (relations.has("preload") && resourceType === "style"))) {
        referencedCss.set(resolved.path, resolved.url.href);
      }
    }
  }
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

function auditCss(path, publicUrl) {
  const original = readText(path, outRelative(path));
  if (original === null) return;
  const css = stripCssComments(original);
  const patterns = [
    /@import\s+(?:url\(\s*)?["']?\s*([^\s"')]+)["']?/gi,
    /url\(\s*["']?\s*([^\s"')]+)["']?\s*\)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of css.matchAll(pattern)) {
      requireLocalAsset(match[1], publicUrl, `${outRelative(path)}:${lineAt(css, match.index)} CSS`);
    }
  }
}

function jsonLdDocuments(html, page) {
  const documents = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const attributes = attributesFromTag(`<script ${match[1]}>`);
    if ((attributes.get("type") ?? "").toLowerCase() !== "application/ld+json") continue;
    try {
      documents.push(JSON.parse(match[2]));
    } catch (error) {
      fail(`${page}: invalid JSON-LD (${error.message})`);
    }
  }
  return documents;
}

function jsonLdNodes(documents) {
  return documents.flatMap((document) => (
    Array.isArray(document?.["@graph"]) ? document["@graph"] : [document]
  ));
}

function auditPage(route, pagePath, html, referencedCss, dashboardTitles) {
  const page = outRelative(pagePath);
  const markup = visibleMarkup(html);
  const htmlTags = tagsNamed(markup, "html");
  if (htmlTags.length !== 1) fail(`${page}: expected one <html>, found ${htmlTags.length}`);
  const htmlAttributes = htmlTags[0]?.attributes ?? new Map();
  if (htmlAttributes.get("lang") !== route.locale) {
    fail(`${page}: html lang must be ${route.locale}, found ${htmlAttributes.get("lang") || "missing"}`);
  }
  const expectedDirection = route.locale === "ar" ? "rtl" : "ltr";
  if (htmlAttributes.get("dir") !== expectedDirection) {
    fail(`${page}: html dir must be ${expectedDirection}, found ${htmlAttributes.get("dir") || "missing"}`);
  }

  const mainCount = tagsNamed(markup, "main").length;
  if (mainCount !== 1) fail(`${page}: expected one <main>, found ${mainCount}`);
  const h1Matches = [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length !== 1) fail(`${page}: expected one <h1>, found ${h1Matches.length}`);
  if (!route.suffix && h1Matches[0]) dashboardTitles.set(route.locale, textFromMarkup(h1Matches[0][1]));

  const allIds = [...markup.matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/gi)].map((match) => match[1] ?? match[2]);
  const seenIds = new Set();
  for (const id of allIds) {
    if (seenIds.has(id)) fail(`${page}: duplicate id ${id}`);
    seenIds.add(id);
  }

  const canonicalLinks = tagsNamed(html, "link").filter((entry) => (
    (entry.attributes.get("rel") ?? "").toLowerCase().split(/\s+/).includes("canonical")
  ));
  if (canonicalLinks.length !== 1) fail(`${page}: expected one canonical link, found ${canonicalLinks.length}`);
  if (canonicalLinks[0]?.attributes.get("href") !== route.canonical) {
    fail(`${page}: canonical must be ${route.canonical}, found ${canonicalLinks[0]?.attributes.get("href") || "missing"}`);
  }

  const alternates = tagsNamed(html, "link").filter((entry) => (
    (entry.attributes.get("rel") ?? "").toLowerCase().split(/\s+/).includes("alternate") &&
    entry.attributes.has("hreflang")
  ));
  const actualHreflangs = alternates.map((entry) => entry.attributes.get("hreflang")).sort();
  compareExactInventory(`${page} hreflang`, actualHreflangs, EXPECTED_HREFLANGS);
  for (const locale of LOCALES) {
    const entry = alternates.find((candidate) => candidate.attributes.get("hreflang") === locale);
    const expected = routeUrlFor(locale, route.suffix);
    if (entry?.attributes.get("href") !== expected) {
      fail(`${page}: ${locale} alternate must be ${expected}, found ${entry?.attributes.get("href") || "missing"}`);
    }
  }
  const fallback = alternates.find((entry) => entry.attributes.get("hreflang") === "x-default");
  const expectedFallback = routeUrlFor("en", route.suffix);
  if (fallback?.attributes.get("href") !== expectedFallback) {
    fail(`${page}: x-default must be ${expectedFallback}, found ${fallback?.attributes.get("href") || "missing"}`);
  }

  const nodes = jsonLdNodes(jsonLdDocuments(html, page));
  const expectedType = route.suffix ? "LearningResource" : "Course";
  const primary = nodes.find((node) => node?.["@type"] === expectedType);
  if (!primary) {
    fail(`${page}: JSON-LD is missing ${expectedType}`);
  } else {
    if (primary.url !== route.canonical) fail(`${page}: JSON-LD URL must match the localized canonical`);
    if (primary.inLanguage !== route.locale) {
      fail(`${page}: JSON-LD inLanguage must be ${route.locale}, found ${primary.inLanguage || "missing"}`);
    }
  }
  if (!nodes.some((node) => node?.["@type"] === "BreadcrumbList")) {
    fail(`${page}: JSON-LD is missing BreadcrumbList`);
  }

  const visibleText = textFromMarkup(markup).toLowerCase();
  if (!visibleText.includes(PROTOCOL_VERSION)) fail(`${page}: missing protocol version ${PROTOCOL_VERSION}`);
  if (!visibleText.includes(EVIDENCE_SNAPSHOT)) fail(`${page}: missing evidence snapshot ${EVIDENCE_SNAPSHOT}`);
  if (route.locale !== "en" && (
    visibleText.includes("course teaching text is currently english") ||
    visibleText.includes("long-form teaching text is currently english")
  )) {
    fail(`${page}: contains the retired English-fallback disclosure instead of localized teaching copy`);
  }

  auditRuntimeAssets(html, pagePath, route.canonical, referencedCss);
}

function auditSitemap(routes) {
  const indexPath = resolve(OUT, "sitemap.xml");
  const indexXml = readText(indexPath, "out/sitemap.xml");
  if (indexXml === null) return { count: 0, paths: [] };
  if (!/<sitemapindex\b/i.test(indexXml)) {
    fail("out/sitemap.xml must be a sitemap index");
  }

  const expectedShardUrls = LOCALES.map((locale) => `${SITE_ORIGIN}/sitemaps/course-mcp-${locale}.xml`);
  const indexedShardUrls = [...indexXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => decodeEntities(match[1].trim()))
    .filter((value) => /\/sitemaps\/course-mcp-[^/]+\.xml$/.test(value));
  compareExactInventory("sitemap index MCP shards", indexedShardUrls, expectedShardUrls);

  const shardPaths = [];
  const urls = [];
  for (const locale of LOCALES) {
    const relativePath = `sitemaps/course-mcp-${locale}.xml`;
    const shardPath = resolve(OUT, relativePath);
    shardPaths.push(shardPath);
    if (existsSync(shardPath) && statSync(shardPath).size > 500 * 1024) {
      fail(`out/${relativePath}: sitemap shard exceeds 500 KiB`);
    }
    const xml = readText(shardPath, `out/${relativePath}`);
    if (xml === null) continue;
    if (!/<urlset\b/i.test(xml)) fail(`out/${relativePath}: must be a sitemap urlset`);
    urls.push(...[...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
      .map((match) => decodeEntities(match[1].trim())));
  }
  compareExactInventory("sitemap MCP URLs", urls, routes.map((route) => route.canonical));
  return { count: urls.length, paths: shardPaths };
}

function auditFigureManifest(allHtml) {
  const sourcePath = resolve(ROOT, "public/courses/mcp/figure-manifest.json");
  const exportPath = resolve(OUT, "courses/mcp/figure-manifest.json");
  const sourceBytes = readBytes(sourcePath);
  const exportBytes = readBytes(exportPath);
  if (sourceBytes === null || exportBytes === null) return 0;
  if (!sourceBytes.equals(exportBytes)) fail("exported figure-manifest.json does not match public/ source bytes");

  let manifest;
  try {
    manifest = JSON.parse(sourceBytes.toString("utf8"));
  } catch (error) {
    fail(`public figure manifest is invalid JSON (${error.message})`);
    return 0;
  }
  if (manifest.schemaVersion !== 2) fail(`figure manifest schemaVersion must be 2, found ${manifest.schemaVersion}`);
  if (manifest.courseId !== "mcp") fail(`figure manifest courseId must be mcp, found ${manifest.courseId}`);
  if (manifest.evidenceSnapshot !== EVIDENCE_SNAPSHOT) fail(`figure manifest snapshot must be ${EVIDENCE_SNAPSHOT}`);
  if (manifest.releaseStatus !== "approved") fail(`figure manifest releaseStatus must be approved`);
  if (manifest.privacyReview?.status !== "passed") fail("figure manifest privacy review must be passed");

  const figures = Array.isArray(manifest.figures) ? manifest.figures : [];
  compareExactInventory("figure manifest IDs", figures.map((figure) => figure.id), FIGURE_IDS);
  const inspector = figures.filter((figure) => figure.rightsCollection === "mcp-inspector-documentation");
  const hosts = figures.filter((figure) => [
    "google-gemini-cli-course-capture",
    "openai-codex-cli-course-capture",
  ].includes(figure.rightsCollection));
  if (inspector.length !== 6) fail(`figure manifest must contain 6 CC BY Inspector figures, found ${inspector.length}`);
  if (hosts.length !== 2) fail(`figure manifest must contain 2 course-authored host captures, found ${hosts.length}`);

  for (const figure of figures) {
    if (figure.releaseEligibility !== "publish") fail(`${figure.id}: releaseEligibility must be publish`);
    const records = [figure.courseMaster, ...(Array.isArray(figure.derivatives) ? figure.derivatives : [])];
    if (records.length !== 3) fail(`${figure.id}: expected one master and two responsive derivatives`);
    for (const record of records) {
      if (!record?.path || !/^[a-f0-9]{64}$/.test(record.sha256 ?? "")) {
        fail(`${figure.id}: incomplete path or SHA-256 in figure manifest`);
        continue;
      }
      const publicPath = resolve(ROOT, "public/courses/mcp", record.path);
      const outputPath = resolve(OUT, "courses/mcp", record.path);
      for (const [label, path] of [["public", publicPath], ["export", outputPath]]) {
        const bytes = readBytes(path, `${label} ${figure.id} ${record.path}`);
        if (bytes !== null && sha256(bytes) !== record.sha256) {
          fail(`${label} ${figure.id} ${record.path}: SHA-256 does not match the manifest`);
        }
      }
      const webPath = `/courses/mcp/${record.path}`;
      if (!allHtml.includes(webPath)) fail(`${figure.id}: ${webPath} is not referenced by any MCP HTML page`);
    }
  }

  const withheld = Array.isArray(manifest.withheld) ? manifest.withheld : [];
  if (withheld.length !== 2 || withheld.some((entry) => entry.status !== "not-distributed")) {
    fail("figure manifest must retain both not-distributed rights-review records");
  }
  const exportedCourseFiles = walkFiles(resolve(OUT, "courses/mcp")).map((path) => outRelative(path));
  for (const entry of withheld) {
    for (const id of entry.ids ?? []) {
      if (exportedCourseFiles.some((path) => path.includes(id))) {
        fail(`withheld asset ${id} appears in the static export`);
      }
    }
  }
  return figures.length;
}

function auditDownloads() {
  const files = [
    "MCP_CAPSTONE_EVIDENCE_PACK.md",
    "NOTICE.md",
    "licenses/APACHE-2.0.txt",
    "licenses/CODEX-NOTICE.txt",
    "courseops-reference.sha256",
    "courseops-reference.zip",
    ...LOCALES.map((locale) => `capstone/MCP_CAPSTONE_EVIDENCE_PACK-${locale}.md`),
  ];
  for (const file of files) {
    const source = readBytes(resolve(ROOT, "public/courses/mcp", file));
    const exported = readBytes(resolve(OUT, "courses/mcp", file));
    if (source !== null && exported !== null && !source.equals(exported)) {
      fail(`exported ${file} does not match public/ source bytes`);
    }
  }
  const zip = readBytes(resolve(OUT, "courses/mcp/courseops-reference.zip"));
  const sidecar = readText(resolve(OUT, "courses/mcp/courseops-reference.sha256"));
  if (zip !== null && sidecar !== null) {
    const expected = sidecar.trim().split(/\s+/)[0];
    if (!/^[a-f0-9]{64}$/.test(expected)) fail("courseops-reference.sha256 does not start with a SHA-256 digest");
    else if (sha256(zip) !== expected) fail("exported CourseOps archive does not match its SHA-256 sidecar");
  }
}

function auditFreshness(outputPages) {
  const inputRoots = [
    "app/[locale]/mcp",
    "components/mcp",
    "lib/mcp",
    "messages/mcp",
    "public/courses/mcp",
  ].map((path) => resolve(ROOT, path));
  const inputFiles = inputRoots.flatMap(walkFiles);
  for (const path of [
    "app/[locale]/courses/page.tsx",
    "app/[locale]/layout.tsx",
    "app/layout.tsx",
    "app/sitemap.ts",
    "app/globals.css",
    "components/LanguageMenu.tsx",
    "components/MobileNav.tsx",
    "components/Shell.tsx",
    "components/ThemeToggle.tsx",
    "components/courses/Catalog.tsx",
    "components/courses/Cover.module.css",
    "components/courses/Cover.tsx",
    "lib/courses.ts",
    "lib/i18n.ts",
    "lib/seo.ts",
    "next.config.ts",
    "package.json",
    "package-lock.json",
    "scripts/check-mcp-course.mjs",
    "scripts/generate-sitemaps.mjs",
    "tests/mcp-course.spec.ts",
    "tests/mcp-playwright.config.ts",
    "scripts/audit-mcp-export.mjs",
    "scripts/test-mcp-export.mjs",
    ...LOCALES.map((locale) => `messages/${locale}.json`),
  ].map((path) => resolve(ROOT, path))) {
    if (existsSync(path) && statSync(path).isFile()) inputFiles.push(path);
  }
  if (inputFiles.length === 0 || outputPages.length === 0) return;
  const newestInput = inputFiles
    .map((path) => ({ path, mtime: statSync(path).mtimeMs }))
    .sort((left, right) => right.mtime - left.mtime)[0];
  const oldestOutput = outputPages
    .map((path) => ({ path, mtime: statSync(path).mtimeMs }))
    .sort((left, right) => left.mtime - right.mtime)[0];
  if (newestInput.mtime > oldestOutput.mtime + 1) {
    fail(
      `stale export: ${rootRelative(newestInput.path)} is newer than ${rootRelative(oldestOutput.path)}; rebuild before release`,
    );
  }
}

function main() {
  if (!existsSync(OUT)) {
    fail("out/: static export directory is missing; run next build first");
  }
  const routes = expectedRoutes();
  const expectedHtml = routes.map((route) => route.html).sort();
  const allOutputFiles = existsSync(OUT) ? walkFiles(OUT) : [];
  const actualHtml = allOutputFiles
    .map(outRelative)
    .filter((path) => /^[^/]+\/mcp(?:\/[^/]+)?\/index\.html$/.test(path))
    .sort();
  compareExactInventory("MCP HTML files", actualHtml, expectedHtml);

  const referencedCss = new Map();
  const dashboardTitles = new Map();
  const pageHtml = [];
  const generatedPages = [];
  for (const route of routes) {
    const path = resolve(OUT, route.html);
    if (!existsSync(path)) continue;
    generatedPages.push(path);
    const html = readText(path, outRelative(path));
    if (html === null) continue;
    pageHtml.push(html);
    auditPage(route, path, html, referencedCss, dashboardTitles);
  }
  for (const [path, publicUrl] of referencedCss) auditCss(path, publicUrl);

  const englishTitle = dashboardTitles.get("en");
  if (!englishTitle) fail("English dashboard title is missing");
  for (const locale of LOCALES.filter((candidate) => candidate !== "en")) {
    const title = dashboardTitles.get(locale);
    if (!title) fail(`${locale} dashboard title is missing`);
    else if (title === englishTitle) fail(`${locale} dashboard title is still the English fallback`);
  }
  if (dashboardTitles.get("ar") && !/[\u0600-\u06ff]/.test(dashboardTitles.get("ar"))) {
    fail("Arabic dashboard title does not contain Arabic-script teaching copy");
  }

  const sitemap = auditSitemap(routes);
  const figureCount = auditFigureManifest(pageHtml.join("\n"));
  auditDownloads();
  if (existsSync(resolve(OUT, "sitemap.xml"))) generatedPages.push(resolve(OUT, "sitemap.xml"));
  generatedPages.push(...sitemap.paths.filter(existsSync));
  auditFreshness(generatedPages);

  const findings = [...errors].sort((left, right) => left.localeCompare(right));
  if (findings.length > 0) {
    console.error(`MCP export audit failed with ${findings.length} error(s):`);
    const displayed = findings.slice(0, 250);
    for (const [index, message] of displayed.entries()) console.error(`  ${index + 1}. ${message}`);
    if (displayed.length < findings.length) {
      console.error(`  … ${findings.length - displayed.length} additional error(s) omitted; fix the repeated contract before rerunning.`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `MCP export audit passed: ${actualHtml.length}/${EXPECTED_PAGE_COUNT} HTML files, ` +
    `${referencedCss.size} local CSS files, ${sitemap.count}/${EXPECTED_PAGE_COUNT} sitemap URLs, ` +
    `${figureCount}/8 provenance-checked figures, and fresh static output.`,
  );
}

main();
