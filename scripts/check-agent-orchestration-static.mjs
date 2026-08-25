#!/usr/bin/env node

/**
 * Audits Course 15's emitted HTML and sitemap after a successful `next build`.
 * This deliberately reads only build artifacts; it does not launch a browser.
 *
 * Usage:
 *   npm run agent-orchestration:static-check
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APP_ROOT = join(ROOT, ".next", "server", "app");
const SITE = "https://aicourse.top";
const locales = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const nativeLocales = new Set(["en", "zh-Hans"]);
const fallbackLocales = new Set(locales.filter((locale) => !nativeLocales.has(locale)));
const slugs = [
  "workflow-agent-boundary",
  "task-graphs-contracts",
  "chaining-routing",
  "parallel-fanout-fanin",
  "manager-roles-ownership",
  "delegation-handoffs",
  "orchestrator-workers-verification",
  "tools-aci-mcp",
  "context-state-memory",
  "budgets-concurrency-stopping",
  "reliability-recovery",
  "security-authority-human-control",
  "tracing-observability-economics",
  "evaluation-regression-evolution",
  "production-orchestration-capstone",
];

const failures = [];
const fail = (message) => failures.push(message);
const count = (text, pattern) => [...text.matchAll(pattern)].length;
const has = (text, value) => text.includes(value);
const buildIdPath = join(ROOT, ".next", "BUILD_ID");

if (!existsSync(buildIdPath)) {
  console.error("FAIL Course 15 static output audit: .next/BUILD_ID is missing; run `next build` first.");
  process.exit(1);
}

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

const courseBuildInputs = [
  join(ROOT, "app", "[locale]", "agent-orchestration"),
  join(ROOT, "components", "agent-orchestration"),
  join(ROOT, "lib", "agent-orchestration"),
  join(ROOT, "app", "sitemap.ts"),
  join(ROOT, "scripts", "check-agent-orchestration-static.mjs"),
];
const latestCourseInputMtime = Math.max(...courseBuildInputs.map(latestMtimeMs));
if (statSync(buildIdPath).mtimeMs < latestCourseInputMtime) {
  fail("build artifacts predate a Course 15 source or static-audit input; run `next build` before the static audit");
}

const expectedCourseArtifacts = locales.flatMap((locale) => [
  join(APP_ROOT, locale, "agent-orchestration.html"),
  ...slugs.map((slug) => join(APP_ROOT, locale, "agent-orchestration", `${slug}.html`)),
]);
expectedCourseArtifacts.push(join(APP_ROOT, "sitemap.xml.body"));
const missingCourseArtifacts = expectedCourseArtifacts.filter((path) => !existsSync(path));
if (missingCourseArtifacts.length) {
  console.error(
    `FAIL Course 15 static output audit: ${missingCourseArtifacts.length} emitted artifact${missingCourseArtifacts.length === 1 ? " is" : "s are"} missing; run \`next build\` first.`,
  );
  for (const path of missingCourseArtifacts.slice(0, 12)) {
    console.error(`- ${relative(ROOT, path)}`);
  }
  if (missingCourseArtifacts.length > 12) {
    console.error(`- …and ${missingCourseArtifacts.length - 12} more`);
  }
  process.exit(1);
}

function coursePath(locale, slug) {
  return slug
    ? join(APP_ROOT, locale, "agent-orchestration", `${slug}.html`)
    : join(APP_ROOT, locale, "agent-orchestration.html");
}

function publicUrl(locale, slug) {
  return `${SITE}/${locale}/agent-orchestration/${slug ? `${slug}/` : ""}`;
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

function auditHtml(locale, slug) {
  const absolute = coursePath(locale, slug);
  const file = relative(ROOT, absolute);
  let html;
  try {
    html = readFileSync(absolute, "utf8");
  } catch {
    fail(`${file}: missing emitted HTML`);
    return;
  }

  const expectedOuterDir = locale === "ar" ? "rtl" : "ltr";
  const contentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  const canonicalLocale = contentLocale;
  const expectedCanonical = publicUrl(canonicalLocale, slug);

  if (!has(html, `<html lang="${locale}" dir="${expectedOuterDir}"`)) {
    fail(`${file}: outer html lang/dir does not match requested locale`);
  }
  if (!new RegExp(`<div[^>]+lang="${contentLocale}"[^>]+dir="ltr"[^>]+data-testid="agent-orchestration-(?:course|module-[^"]+)"`).test(html)) {
    fail(`${file}: content wrapper does not declare the native/fallback content language and direction`);
  }
  if (count(html, /<h1(?:\s|>)/g) !== 1) {
    fail(`${file}: expected exactly one h1`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) fail(`${file}: duplicate ids: ${duplicates.join(", ")}`);

  if (!has(html, `<link rel="canonical" href="${expectedCanonical}"/>`)) {
    fail(`${file}: canonical is not ${expectedCanonical}`);
  }
  for (const [hrefLang, targetLocale] of [["en", "en"], ["zh-Hans", "zh-Hans"], ["x-default", "en"]]) {
    const expected = `<link rel="alternate" hrefLang="${hrefLang}" href="${publicUrl(targetLocale, slug)}"/>`;
    if (!has(html, expected)) fail(`${file}: missing ${hrefLang} alternate ${publicUrl(targetLocale, slug)}`);
  }

  const graph = extractJsonLd(html, file);
  const primary = graph.find((node) => node?.["@type"] === (slug ? "LearningResource" : "Course"));
  if (!primary) {
    fail(`${file}: missing ${slug ? "LearningResource" : "Course"} JSON-LD node`);
  } else {
    if (primary.inLanguage !== contentLocale) {
      fail(`${file}: JSON-LD inLanguage is ${String(primary.inLanguage)}, expected ${contentLocale}`);
    }
    if (primary.url !== expectedCanonical) {
      fail(`${file}: JSON-LD url is ${String(primary.url)}, expected ${expectedCanonical}`);
    }
  }

  const fallbackNotice = "This is the canonical English edition. Interface localization does not change source boundaries, runtime caveats, or assessment standards.";
  if (fallbackLocales.has(locale) && !has(html, `languageNotice">${fallbackNotice}</p>`)) {
    fail(`${file}: missing visible English fallback notice`);
  }
  if (!fallbackLocales.has(locale) && has(html, `languageNotice">${fallbackNotice}</p>`)) {
    fail(`${file}: native edition unexpectedly shows the fallback notice`);
  }
}

for (const locale of locales) {
  auditHtml(locale, undefined);
  for (const slug of slugs) auditHtml(locale, slug);
}

const emitted = [];
for (const locale of locales) {
  const localeRoot = join(APP_ROOT, locale);
  for (const name of readdirSync(localeRoot)) {
    if (name === "agent-orchestration.html") emitted.push(join(localeRoot, name));
  }
  const moduleRoot = join(localeRoot, "agent-orchestration");
  for (const name of readdirSync(moduleRoot)) {
    if (name.endsWith(".html")) emitted.push(join(moduleRoot, name));
  }
}
if (emitted.length !== 144) fail(`emitted Course 15 HTML count is ${emitted.length}, expected 144`);

const enOverview = readFileSync(coursePath("en", undefined), "utf8");
const zhOverview = readFileSync(coursePath("zh-Hans", undefined), "utf8");
if (!/v(?:<!-- -->)?1\.1\.1/.test(enOverview) || !/v(?:<!-- -->)?1\.1\.1/.test(zhOverview)) {
  fail("Course 15 emitted overview does not expose the expected v1.1.1 release marker");
}
if (!has(enOverview, "Official GitHub")) fail("English overview does not expose the Official GitHub source role");
if (has(enOverview, "Version-pinned GitHub")) fail("English overview conflates source role with version stability");
if (!has(zhOverview, "官方 GitHub")) fail("Chinese overview does not expose the 官方 GitHub source role");
if (has(zhOverview, "固定版本的官方 GitHub")) fail("Chinese overview conflates source role with version stability");

const moduleHtml = slugs.map((slug) => readFileSync(coursePath("en", slug), "utf8")).join("\n");
const zhModuleHtml = slugs.map((slug) => readFileSync(coursePath("zh-Hans", slug), "utf8")).join("\n");
for (const label of ["Official GitHub", "Supporting claim evidence", "Version anchor"]) {
  if (!has(moduleHtml, label)) fail(`module output does not expose source role label: ${label}`);
}
if (!has(enOverview, "Official SDK docs") || !has(moduleHtml, "Official SDK docs")) {
  fail("English output does not label official-sdk-docs as Official SDK docs");
}
if (!has(zhOverview, "官方 SDK 文档") || !has(zhModuleHtml, "官方 SDK 文档")) {
  fail("Chinese output does not label official-sdk-docs as 官方 SDK 文档");
}

const emittedEnglishCourse = `${enOverview}\n${moduleHtml}`;
const emittedChineseCourse = `${zhOverview}\n${zhModuleHtml}`;
for (const stale of [
  "Action Capability Interface",
  "durably manages one response",
  "at-least-once in practice",
  "Deterministic workflows",
]) {
  if (has(emittedEnglishCourse, stale)) fail(`English static output retains corrected stale text: ${stale}`);
}
for (const stale of ["行动能力接口", "确定性工作流"]) {
  if (has(emittedChineseCourse, stale)) fail(`Chinese static output retains corrected stale text: ${stale}`);
}
for (const required of [
  "Agent-Computer Interface",
  "code-directed workflow",
  "Official SDK docs",
  "critical path is the longest weighted dependency path",
  "dependency critical path is only a lower bound",
  "no-business-write shadow on the production distribution",
  "no built-in integrity check",
]) {
  if (!has(emittedEnglishCourse, required)) fail(`English static output is missing corrected text: ${required}`);
}
for (const required of [
  "智能体—计算机接口",
  "代码主导的工作流",
  "官方 SDK 文档",
  "累计权重最大的依赖路径",
  "依赖关键路径只是下界",
  "禁止生产业务写入的 shadow",
  "没有内建完整性检查",
]) {
  if (!has(emittedChineseCourse, required)) fail(`Chinese static output is missing corrected text: ${required}`);
}

const sitemapPath = join(APP_ROOT, "sitemap.xml.body");
let sitemap = "";
try {
  sitemap = readFileSync(sitemapPath, "utf8");
} catch {
  fail(`${relative(ROOT, sitemapPath)}: missing emitted sitemap`);
}
const courseEntries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map((match) => match[1])
  .filter((entry) => entry.includes("/agent-orchestration/"));
if (courseEntries.length !== 32) fail(`Course 15 sitemap count is ${courseEntries.length}, expected 32`);
for (const entry of courseEntries) {
  const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
  if (!/^https:\/\/aicourse\.top\/(?:en|zh-Hans)\/agent-orchestration\//.test(loc)) {
    fail(`sitemap includes a non-native Course 15 URL: ${loc || "<missing loc>"}`);
  }
  for (const hrefLang of ["en", "zh-Hans", "x-default"]) {
    if (!entry.includes(`hreflang="${hrefLang}"`)) fail(`${loc}: sitemap is missing ${hrefLang} alternate`);
  }
  for (const fallback of fallbackLocales) {
    if (entry.includes(`hreflang="${fallback}"`)) fail(`${loc}: sitemap advertises fallback locale ${fallback} as a translation`);
  }
}

if (failures.length) {
  console.error(`FAIL Course 15 static output audit (${failures.length} finding${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS Course 15 static output audit");
console.log("- 144 HTML documents: 9 locales × (1 overview + 15 modules)");
console.log("- one h1, unique ids, locale/content lang-dir contracts, canonical/hreflang, and JSON-LD verified per document");
console.log("- 112 fallback documents visibly disclose canonical English content");
console.log("- source-role labels distinguish Official GitHub, supporting claim evidence, and version anchors");
console.log("- build freshness, v1.1.1 marker, corrected ACI/workflow/scheduling/shadow/Baggage terms, and Official SDK docs labels verified");
console.log("- 32 sitemap URLs: native en + zh-Hans only, with en/zh-Hans/x-default alternates");
