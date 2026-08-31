#!/usr/bin/env node

/**
 * Deterministic long-form i18n and fallback gate for Course 15.
 *
 * The repository-wide i18n audit also discovers this course. This narrower
 * gate is kept in the Course 15 release chain because unrelated legacy-course
 * and signed-review findings currently prevent the global audit from serving
 * as a course-local pass/fail signal.
 *
 *   node --import tsx scripts/check-agent-orchestration-i18n.mjs
 *   node --import tsx scripts/check-agent-orchestration-i18n.mjs --json
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import sitemap from "../app/sitemap.ts";
import {
  AGENT_ORCHESTRATION_EN_COPY,
  AGENT_ORCHESTRATION_LOCALES,
  AGENT_ORCHESTRATION_MODULE_SLUGS,
  AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
  AGENT_ORCHESTRATION_ZH_HANS_COPY,
  loadAgentOrchestrationCourse,
  validateAgentOrchestrationCourse,
} from "../lib/agent-orchestration/index.ts";
import {
  SITE,
  agentOrchestrationFixedPage,
  agentOrchestrationModulePage,
  alternatesFor,
  urlFor,
} from "../lib/seo.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUTPUT = process.argv.includes("--json");
const EXPECTED_LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const EXPECTED_TRANSLATED = ["en", "zh-Hans"];
const EXPECTED_FALLBACKS = ["es", "fr", "de", "zh-Hant", "ja", "ko", "ar"];
const MIN_UI_LABEL_CALLS = 150;
const MIN_UNIQUE_UI_LABEL_KEYS = 125;
const KNOWN_MULTILINE_UI_LABEL_KEYS = ["artifactEditRequired", "evidenceGuidance"];
const errors = [];
const notes = [];

const fail = (message) => errors.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function collectReferencedUiLabels(componentPaths) {
  const referencedUiKeys = new Set();
  const multilineUiKeys = new Set();
  let labelCallCount = 0;

  for (const filename of componentPaths) {
    const absolute = resolve(ROOT, "components", "agent-orchestration", filename);
    const source = readFileSync(absolute, "utf8");
    const sourceFile = ts.createSourceFile(
      absolute,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    function visit(node) {
      if (
        ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && node.expression.text === "label"
      ) {
        labelCallCount += 1;
        const keyArgument = node.arguments[1];
        const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const locationLabel = `${rel(absolute)}:${location.line + 1}`;

        if (!keyArgument || !ts.isStringLiteralLike(keyArgument)) {
          fail(`${locationLabel}: label() UI key must be a string literal so both native bundles can be audited`);
        } else if (!keyArgument.text.trim()) {
          fail(`${locationLabel}: label() UI key must not be empty`);
        } else {
          referencedUiKeys.add(keyArgument.text);
          const end = sourceFile.getLineAndCharacterOfPosition(node.end);
          if (end.line > location.line) multilineUiKeys.add(keyArgument.text);
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  if (labelCallCount < MIN_UI_LABEL_CALLS) {
    fail(`UI label AST audit found ${labelCallCount} calls; expected at least ${MIN_UI_LABEL_CALLS}`);
  }
  if (referencedUiKeys.size < MIN_UNIQUE_UI_LABEL_KEYS) {
    fail(`UI label AST audit found ${referencedUiKeys.size} unique keys; expected at least ${MIN_UNIQUE_UI_LABEL_KEYS}`);
  }
  for (const key of KNOWN_MULTILINE_UI_LABEL_KEYS) {
    if (!multilineUiKeys.has(key)) fail(`UI label AST audit no longer reaches known multiline key ${key}`);
  }

  notes.push(`${labelCallCount} literal label() calls and ${referencedUiKeys.size} unique UI keys audited through the TypeScript AST`);
  return referencedUiKeys;
}

function compareCopyContracts() {
  for (const field of ["meta", "ui", "principles", "outcomes", "distinctions", "phases", "conceptDomains", "patterns", "modules", "finalAssessment", "capstone"]) {
    if (!(field in AGENT_ORCHESTRATION_EN_COPY)) fail(`English copy is missing top-level field ${field}`);
    if (!(field in AGENT_ORCHESTRATION_ZH_HANS_COPY)) fail(`zh-Hans copy is missing top-level field ${field}`);
  }
  for (const field of ["phases", "conceptDomains", "patterns", "modules"]) {
    const englishKeys = Object.keys(AGENT_ORCHESTRATION_EN_COPY[field]).sort();
    const chineseKeys = Object.keys(AGENT_ORCHESTRATION_ZH_HANS_COPY[field]).sort();
    if (!equal(englishKeys, chineseKeys)) fail(`${field}: English and zh-Hans record keys differ`);
  }
  const han = /[\u3400-\u9fff]/;
  for (const slug of AGENT_ORCHESTRATION_MODULE_SLUGS) {
    const en = AGENT_ORCHESTRATION_EN_COPY.modules[slug];
    const zh = AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[slug];
    if (!en || !zh) {
      fail(`${slug}: both English and zh-Hans module copy must exist`);
      continue;
    }
    for (const key of ["title", "summary", "objective", "artifact", "takeaway"]) {
      if (!han.test(String(zh[key] ?? ""))) fail(`${slug}: zh-Hans ${key} lacks Chinese learner-facing copy`);
      if (han.test(String(en[key] ?? ""))) fail(`${slug}: English ${key} unexpectedly contains Han-script learner-facing copy`);
      if (zh[key] === en[key]) fail(`${slug}: zh-Hans ${key} is identical to English`);
    }
    for (const key of ["question", "explanation"]) {
      if (!han.test(String(zh.checkpoint[key] ?? ""))) fail(`${slug}: zh-Hans checkpoint ${key} lacks Chinese copy`);
    }
  }

  const componentPaths = [
    "ArtifactWorkbench.tsx",
    "AssessmentInteractions.tsx",
    "CourseDashboard.tsx",
    "CourseWorkspacePortability.tsx",
    "draft-status.ts",
    "Interactions.tsx",
    "ModuleView.tsx",
    "OrchestrationLab.tsx",
    "OrchestrationMap.tsx",
    "interaction-helpers.ts",
  ];
  const referencedUiKeys = collectReferencedUiLabels(componentPaths);
  for (const key of referencedUiKeys) {
    for (const [locale, copy] of [["en", AGENT_ORCHESTRATION_EN_COPY], ["zh-Hans", AGENT_ORCHESTRATION_ZH_HANS_COPY]]) {
      if (typeof copy.ui[key] !== "string" || !copy.ui[key].trim()) fail(`${locale} UI copy is missing referenced label ${key}`);
    }
  }
}

function checkSourceContracts() {
  const required = new Map([
    ["app/[locale]/agent-orchestration/page.tsx", [
      'courseLocaleParams("agent-orchestration")',
      "availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES",
      "canonicalLocale: course.contentLocale",
      "inLanguage: course.contentLocale",
    ]],
    ["app/[locale]/agent-orchestration/[module]/page.tsx", [
      "courseChildParams",
      "AGENT_ORCHESTRATION_MODULE_SLUGS",
      "availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES",
      "canonicalLocale: course.contentLocale",
      "inLanguage: course.contentLocale",
    ]],
    ["app/[locale]/agent-orchestration/assessment/page.tsx", [
      'courseLocaleParams("agent-orchestration")',
      'agentOrchestrationFixedPage("assessment")',
      "availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES",
      "canonicalLocale: course.contentLocale",
      "inLanguage: course.contentLocale",
    ]],
    ["app/[locale]/agent-orchestration/capstone/page.tsx", [
      'courseLocaleParams("agent-orchestration")',
      'agentOrchestrationFixedPage("capstone")',
      "availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES",
      "canonicalLocale: course.contentLocale",
      "inLanguage: course.contentLocale",
    ]],
    ["components/agent-orchestration/CourseDashboard.tsx", [
      "lang={course.contentLocale}",
      "dir={course.contentDirection}",
      "course.locale !== course.contentLocale",
      "course.copy.meta.translationNote",
    ]],
    ["components/agent-orchestration/ModuleView.tsx", [
      "lang={course.contentLocale}",
      "dir={course.contentDirection}",
      "course.locale !== course.contentLocale",
      "course.copy.meta.translationNote",
    ]],
  ]);
  for (const [path, tokens] of required) {
    const absolute = resolve(ROOT, path);
    if (!existsSync(absolute)) {
      fail(`${path}: required i18n surface is missing`);
      continue;
    }
    const source = read(path);
    for (const token of tokens) if (!source.includes(token)) fail(`${path}: missing i18n contract ${JSON.stringify(token)}`);
  }
}

function expectedAlternates(page, contentLocale) {
  return {
    canonical: urlFor(contentLocale, page),
    languages: {
      en: urlFor("en", page),
      "zh-Hans": urlFor("zh-Hans", page),
      "x-default": urlFor("en", page),
    },
  };
}

async function checkMaterializationAndSeo() {
  const pages = [
    "agent-orchestration/",
    ...AGENT_ORCHESTRATION_MODULE_SLUGS.map(agentOrchestrationModulePage),
    agentOrchestrationFixedPage("assessment"),
    agentOrchestrationFixedPage("capstone"),
  ];
  for (const locale of AGENT_ORCHESTRATION_LOCALES) {
    const course = await loadAgentOrchestrationCourse(locale);
    const expectedContentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
    const expectedCopy = expectedContentLocale === "zh-Hans" ? AGENT_ORCHESTRATION_ZH_HANS_COPY : AGENT_ORCHESTRATION_EN_COPY;
    if (course.locale !== locale) fail(`${locale}: materialized route locale drifted to ${course.locale}`);
    if (course.contentLocale !== expectedContentLocale) fail(`${locale}: expected content locale ${expectedContentLocale}, found ${course.contentLocale}`);
    if (course.contentDirection !== "ltr") fail(`${locale}: long-form content direction must be ltr, found ${course.contentDirection}`);
    if (course.copy !== expectedCopy) fail(`${locale}: materialized the wrong long-form copy bundle`);
    if (course.modules.length !== AGENT_ORCHESTRATION_MODULE_SLUGS.length) fail(`${locale}: materialized ${course.modules.length} modules`);
    if (locale !== expectedContentLocale && !course.copy.meta.translationNote.trim()) fail(`${locale}: fallback page has no visible translation notice`);
    for (const page of pages) {
      const observed = alternatesFor(locale, page, {
        availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
        canonicalLocale: course.contentLocale,
      });
      const expected = expectedAlternates(page, expectedContentLocale);
      if (!equal(observed, expected)) fail(`${locale}/${page}: SEO alternate contract drifted: ${JSON.stringify(observed)}`);
    }
  }

  const entries = sitemap().filter((entry) => String(entry.url).includes("/agent-orchestration/"));
  if (entries.length !== pages.length * EXPECTED_TRANSLATED.length) {
    fail(`sitemap: expected ${pages.length * EXPECTED_TRANSLATED.length} Course 15 entries; found ${entries.length}`);
  }
  const expectedUrls = new Set(pages.flatMap((page) => EXPECTED_TRANSLATED.map((locale) => urlFor(locale, page))));
  for (const entry of entries) {
    const url = String(entry.url);
    if (!expectedUrls.delete(url)) fail(`sitemap: unexpected or duplicate Course 15 URL ${url}`);
    const page = url.slice(`${SITE}/`.length).split("/").slice(1).join("/");
    const expectedLanguages = expectedAlternates(page, "en").languages;
    if (!equal(entry.alternates?.languages, expectedLanguages)) fail(`sitemap: alternate map drifted for ${url}`);
  }
  for (const url of expectedUrls) fail(`sitemap: missing Course 15 URL ${url}`);
  for (const fallback of EXPECTED_FALLBACKS) {
    if (entries.some((entry) => String(entry.url).startsWith(`${SITE}/${fallback}/agent-orchestration/`))) {
      fail(`sitemap: fallback locale ${fallback} must not be indexed as translated Course 15 content`);
    }
  }
}

function checkShellCatalogCopy() {
  for (const locale of EXPECTED_LOCALES) {
    const path = resolve(ROOT, "messages", `${locale}.json`);
    if (!existsSync(path)) {
      fail(`${rel(path)}: shell message file is missing`);
      continue;
    }
    let messages;
    try {
      messages = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      fail(`${rel(path)}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
      continue;
    }
    for (const key of ["cat.course15", "c.agent-orchestration.title", "c.agent-orchestration.blurb", "c.agent-orchestration.level", "c.agent-orchestration.meta"]) {
      if (typeof messages[key] !== "string" || !messages[key].trim()) fail(`${rel(path)}: missing non-empty ${key}`);
    }
  }
}

async function main() {
  if (!equal([...AGENT_ORCHESTRATION_LOCALES], EXPECTED_LOCALES)) fail(`route locales must be ${EXPECTED_LOCALES.join(", ")}`);
  if (!equal([...AGENT_ORCHESTRATION_TRANSLATED_LOCALES], EXPECTED_TRANSLATED)) fail(`reviewed long-form locales must be exactly ${EXPECTED_TRANSLATED.join(", ")}`);
  for (const message of validateAgentOrchestrationCourse()) fail(`course validator: ${message}`);
  compareCopyContracts();
  checkSourceContracts();
  checkShellCatalogCopy();
  await checkMaterializationAndSeo();
  notes.push("2 reviewed long-form bundles: en, zh-Hans");
  notes.push("7 explicit English fallbacks: es, fr, de, zh-Hant, ja, ko, ar");
  notes.push("144 loader fallback combinations audited; 36 published static routes and sitemap entries");

  const result = { ok: errors.length === 0, course: "agent-orchestration", errors, notes };
  if (JSON_OUTPUT) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    process.stdout.write(`${result.ok ? "PASS" : "FAIL"}: Course 15 i18n and fallback gate\n`);
    for (const note of notes) process.stdout.write(`- ${note}\n`);
    for (const error of errors) process.stderr.write(`- ${error}\n`);
  }
  if (!result.ok) process.exitCode = 1;
}

await main();
