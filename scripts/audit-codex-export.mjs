#!/usr/bin/env node

/**
 * Post-build audit for the localized Course 2 static export.
 *
 * This script is deliberately dependency-free and reads only `out/`. It checks
 * the exact Codex HTML route inventory, prevents Course 2 pages and their
 * referenced stylesheets from loading off-site runtime assets, and verifies the
 * Course 2 sitemap inventory.
 *
 * Run after `next build`:
 *
 *   node scripts/audit-codex-export.mjs
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
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

const ROUTE_SUFFIXES = ["", ...LESSON_SLUGS];
const EXPECTED_PAGE_COUNT = LOCALES.length * ROUTE_SUFFIXES.length;
const errors = new Set();

function fail(message) {
  errors.add(message);
}

function posixPath(path) {
  return path.split(sep).join("/");
}

function outRelative(path) {
  return posixPath(relative(OUT, path));
}

function readText(path, label = outRelative(path)) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    fail(`${label}: could not be read (${error.message})`);
    return null;
  }
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

function expectedHtmlPaths() {
  const paths = [];
  for (const locale of LOCALES) {
    for (const suffix of ROUTE_SUFFIXES) {
      paths.push(
        suffix
          ? `${locale}/codex/${suffix}/index.html`
          : `${locale}/codex/index.html`,
      );
    }
  }
  return paths.sort((left, right) => left.localeCompare(right));
}

function expectedSitemapUrls() {
  const urls = [];
  for (const locale of LOCALES) {
    for (const suffix of ROUTE_SUFFIXES) {
      urls.push(
        suffix
          ? `${SITE_ORIGIN}/${locale}/codex/${suffix}/`
          : `${SITE_ORIGIN}/${locale}/codex/`,
      );
    }
  }
  return urls.sort((left, right) => left.localeCompare(right));
}

function isCodexIndex(path) {
  return /^[^/]+\/codex(?:\/.*)?\/index\.html$/.test(path);
}

function compareInventory(label, actualValues, expectedValues) {
  const actualSet = new Set(actualValues);
  const expectedSet = new Set(expectedValues);

  if (actualValues.length !== expectedValues.length) {
    fail(
      `${label}: expected exactly ${expectedValues.length}, found ${actualValues.length}`,
    );
  }

  if (actualSet.size !== actualValues.length) {
    const seen = new Set();
    for (const value of actualValues) {
      if (seen.has(value)) fail(`${label}: duplicate entry ${value}`);
      seen.add(value);
    }
  }

  for (const value of expectedValues) {
    if (!actualSet.has(value)) fail(`${label}: missing ${value}`);
  }
  for (const value of actualSet) {
    if (!expectedSet.has(value)) fail(`${label}: unexpected ${value}`);
  }
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributesFromTag(tag) {
  const attributes = new Map();
  const start = tag.search(/\s/);
  if (start === -1) return attributes;

  const source = tag.slice(start);
  const pattern = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attributes.set(name, decodeHtmlAttribute(value));
  }
  return attributes;
}

function lineAt(source, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor++) {
    if (source.charCodeAt(cursor) === 10) line++;
  }
  return line;
}

function networkReferences(value) {
  const references = [];
  const pattern = /(?:https?:)?\/\/[^\s,"'<>)}]+/gi;
  for (const match of value.matchAll(pattern)) {
    references.push(match[0]);
  }
  return references;
}

function isOffSite(reference) {
  try {
    return new URL(reference, SITE_ORIGIN).origin !== SITE_ORIGIN;
  } catch {
    return true;
  }
}

function checkAssetAttribute({
  attributes,
  attribute,
  html,
  index,
  page,
  tagName,
}) {
  const value = attributes.get(attribute);
  if (!value) return;

  for (const reference of networkReferences(value)) {
    if (!isOffSite(reference)) continue;
    fail(
      `${page}:${lineAt(html, index)}: off-site ${tagName} ${attribute} URL ${reference}`,
    );
  }
}

function localOutputPath(reference, pagePath, label) {
  let url;
  try {
    const pageUrl = new URL(`/${outRelative(pagePath)}`, SITE_ORIGIN);
    url = new URL(reference, pageUrl);
  } catch (error) {
    fail(`${label}: invalid local asset URL ${reference} (${error.message})`);
    return null;
  }

  if (url.origin !== SITE_ORIGIN) return null;

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
  return path;
}

function auditHtml(path, referencedCss) {
  const page = outRelative(path);
  const html = readText(path, page);
  if (html === null) return;

  const tagPattern = /<(img|source|script|link)\b[^>]*>/gi;
  for (const match of html.matchAll(tagPattern)) {
    const tagName = match[1].toLowerCase();
    const attributes = attributesFromTag(match[0]);
    const context = {
      attributes,
      html,
      index: match.index,
      page,
      tagName: `<${tagName}>`,
    };

    if (tagName === "img" || tagName === "source") {
      checkAssetAttribute({ ...context, attribute: "src" });
      checkAssetAttribute({ ...context, attribute: "srcset" });
      continue;
    }

    if (tagName === "script") {
      checkAssetAttribute({ ...context, attribute: "src" });
      continue;
    }

    const relations = new Set(
      (attributes.get("rel") ?? "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    );
    const resourceType = (attributes.get("as") ?? "").toLowerCase();
    const isStylesheet = relations.has("stylesheet");
    const isModulePreload = relations.has("modulepreload");
    const isAssetPreload =
      relations.has("preload") &&
      ["font", "image", "script", "style"].includes(resourceType);
    const isImageLink = ["icon", "apple-touch-icon", "mask-icon"].some(
      (relation) => relations.has(relation),
    );

    if (!isStylesheet && !isModulePreload && !isAssetPreload && !isImageLink) {
      continue;
    }

    checkAssetAttribute({ ...context, attribute: "href" });

    const href = attributes.get("href");
    const referencesCss =
      isStylesheet ||
      (relations.has("preload") && resourceType === "style");
    if (!href || !referencesCss) continue;

    const externalReferences = networkReferences(href).filter(isOffSite);
    if (externalReferences.length > 0) continue;

    const cssPath = localOutputPath(
      href,
      path,
      `${page}:${lineAt(html, match.index)}: stylesheet`,
    );
    if (cssPath) referencedCss.add(cssPath);
  }
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );
}

function auditCss(path) {
  const label = outRelative(path);
  if (!existsSync(path)) {
    fail(`${label}: referenced stylesheet is missing from out/`);
    return;
  }

  const original = readText(path, label);
  if (original === null) return;
  const css = stripCssComments(original);
  const patterns = [
    {
      label: "remote @import",
      pattern: /@import\s+(?:url\(\s*)?["']?\s*((?:https?:)?\/\/[^\s"')]+)["']?/gi,
    },
    {
      label: "remote url()",
      pattern: /url\(\s*["']?\s*((?:https?:)?\/\/[^\s"')]+)["']?\s*\)/gi,
    },
  ];

  for (const { label: finding, pattern } of patterns) {
    for (const match of css.matchAll(pattern)) {
      fail(
        `${label}:${lineAt(css, match.index)}: ${finding} ${match[1]}`,
      );
    }
  }
}

function decodeXmlText(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function isCodexSitemapUrl(value) {
  try {
    return /^\/[^/]+\/codex(?:\/|$)/.test(new URL(value).pathname);
  } catch {
    return /\/codex(?:\/|$)/.test(value);
  }
}

function auditSitemap() {
  const path = resolve(OUT, "sitemap.xml");
  if (!existsSync(path)) {
    fail("sitemap.xml: missing from out/");
    return 0;
  }

  const xml = readText(path, "sitemap.xml");
  if (xml === null) return 0;
  const locations = [];
  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    const value = decodeXmlText(match[1].trim());
    if (isCodexSitemapUrl(value)) locations.push(value);
  }

  const expected = expectedSitemapUrls();
  compareInventory("sitemap Codex URLs", locations, expected);
  return locations.length;
}

function main() {
  if (!existsSync(OUT)) {
    fail("out/: static export directory is missing; run the build first");
  }

  const allFiles = existsSync(OUT) ? walkFiles(OUT) : [];
  const actualHtml = allFiles
    .map(outRelative)
    .filter(isCodexIndex)
    .sort((left, right) => left.localeCompare(right));
  const expectedHtml = expectedHtmlPaths();
  compareInventory("Codex HTML files", actualHtml, expectedHtml);

  const referencedCss = new Set();
  for (const relativePath of expectedHtml) {
    const path = resolve(OUT, relativePath);
    if (existsSync(path)) auditHtml(path, referencedCss);
  }
  for (const path of [...referencedCss].sort((left, right) => left.localeCompare(right))) {
    auditCss(path);
  }

  const sitemapCount = auditSitemap();
  const findings = [...errors].sort((left, right) => left.localeCompare(right));
  if (findings.length > 0) {
    console.error(`Codex export audit failed with ${findings.length} error(s):`);
    for (const [index, message] of findings.entries()) {
      console.error(`  ${index + 1}. ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Codex export audit passed: ${actualHtml.length}/${EXPECTED_PAGE_COUNT} HTML files, ` +
    `${referencedCss.size} local CSS files, ${sitemapCount}/${EXPECTED_PAGE_COUNT} sitemap URLs.`,
  );
}

main();
