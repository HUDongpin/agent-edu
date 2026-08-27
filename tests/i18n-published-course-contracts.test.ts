import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import test from "node:test";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { coursePolicyForRoute } from "../scripts/i18n-course-kit-contracts.mjs";
import {
  discoverClaudeIncomeContract,
  discoverMakeMoneyWithCodexFallbackContract,
  discoverMcpContract,
  discoverPromptsFallbackContract,
  discoverSoftwareEngineeringFallbackContract,
  findRawMessageKey,
  isCourseCloneLeak,
} from "../scripts/i18n-published-course-contracts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_LOCALES = [
  "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
];

function cloneContractFixture(paths: readonly string[]): string {
  const fixture = mkdtempSync(join(tmpdir(), "aicourse-i18n-contract-"));
  for (const path of paths) {
    const destination = join(fixture, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(ROOT, path), destination);
  }
  return fixture;
}

test("Claude Income discovery binds 12 generated lessons to its English-content shell contract", () => {
  const course = discoverClaudeIncomeContract(ROOT, SITE_LOCALES);

  assert.equal(course.name, "claude-income");
  assert.equal(course.units.length, 12);
  assert.equal(new Set(course.units).size, 12);
  assert.equal(course.units[0], "choose-a-money-path");
  assert.equal(course.units.at(-1), "capstone-seven-day-demand-test");
  assert.deepEqual(course.locales, SITE_LOCALES);
  assert.deepEqual(course.translatedLocales, ["en"]);
  assert.equal(course.contentLocaleMode, "fixed-default");
  assert.equal(course.canonicalLocaleMode, "route-locale");
});

test("MCP discovery binds 18 generated lessons and all nine native locale contracts", () => {
  const course = discoverMcpContract(ROOT, SITE_LOCALES);

  assert.equal(course.name, "mcp");
  assert.equal(course.units.length, 18);
  assert.equal(new Set(course.units).size, 18);
  assert.equal(course.units[0], "why-mcp");
  assert.equal(course.units.at(-1), "apps-tasks-capstone");
  assert.equal(course.figures.length, 8);
  assert.deepEqual(course.translatedLocales, SITE_LOCALES);
  assert.equal(course.contentLocaleMode, "route-locale");
  assert.equal(course.canonicalLocaleMode, "route-locale");
});

test("derived course policies keep content language, canonical and hreflang independent", () => {
  const claudeIncome = discoverClaudeIncomeContract(ROOT, SITE_LOCALES);
  const mcp = discoverMcpContract(ROOT, SITE_LOCALES);
  const courseMap = new Map<string, typeof claudeIncome | typeof mcp>();
  courseMap.set(claudeIncome.name, claudeIncome);
  courseMap.set(mcp.name, mcp);

  const claudeFrench = coursePolicyForRoute(
    "/fr/claude-income/choose-a-money-path/",
    courseMap,
  );
  assert.equal(claudeFrench?.contentLocale, "en");
  assert.equal(claudeFrench?.canonicalRoute, "/fr/claude-income/choose-a-money-path/");
  assert.deepEqual(claudeFrench?.hreflangLocales, ["en"]);

  const mcpArabic = coursePolicyForRoute("/ar/mcp/apps-tasks-capstone/", courseMap);
  assert.equal(mcpArabic?.contentLocale, "ar");
  assert.equal(mcpArabic?.canonicalRoute, "/ar/mcp/apps-tasks-capstone/");
  assert.deepEqual(mcpArabic?.hreflangLocales, SITE_LOCALES);
});

test("Prompts omits non-English message files only after its complete fallback contract passes", () => {
  const contract = discoverPromptsFallbackContract(ROOT, SITE_LOCALES);
  assert.deepEqual(contract.shellLocales, SITE_LOCALES);
  assert.deepEqual(contract.contentLocales, ["en"]);
  assert.equal(contract.fallbackLocale, "en");
  assert.equal(contract.units.length, 9);

  const promptCourse = {
    name: "prompts",
    translatedLocales: contract.contentLocales,
    contentLocaleMode: contract.contentLocaleMode,
    canonicalLocaleMode: contract.canonicalLocaleMode,
  };
  const policy = coursePolicyForRoute("/ja/prompts/six-part-prompt/", new Map([["prompts", promptCourse]]));
  assert.equal(policy?.contentLocale, "en");
  assert.equal(policy?.canonicalRoute, "/en/prompts/six-part-prompt/");
  assert.deepEqual(policy?.hreflangLocales, ["en"]);
});

test("Make Money with Codex declares English content, canonical and sitemap across nine localized shells", () => {
  const contract = discoverMakeMoneyWithCodexFallbackContract(ROOT, SITE_LOCALES);
  assert.equal(contract.domain, "make-money-with-codex");
  assert.deepEqual(contract.shellLocales, SITE_LOCALES);
  assert.deepEqual(contract.contentLocales, ["en"]);
  assert.deepEqual(contract.hreflangLocales, ["en"]);
  assert.equal(contract.contentLocaleMode, "fixed-default");
  assert.equal(contract.canonicalLocaleMode, "content-locale");
  assert.equal(contract.units.length, 12);
});

test("Make Money with Codex fallback discovery fails closed if English canonical metadata disappears", () => {
  const files = [
    "lib/make-money-with-codex/types.ts",
    "lib/make-money-with-codex/load.ts",
    "app/[locale]/make-money-with-codex/page.tsx",
    "app/[locale]/make-money-with-codex/[lesson]/page.tsx",
    "components/make-money-with-codex/CourseDashboard.tsx",
    "components/make-money-with-codex/LessonView.tsx",
    "app/sitemap.ts",
  ] as const;
  const fixture = cloneContractFixture(files);
  try {
    const route = join(fixture, "app/[locale]/make-money-with-codex/page.tsx");
    writeFileSync(route, readFileSync(route, "utf8").replace('canonicalLocale: "en",', ""));
    assert.throws(
      () => discoverMakeMoneyWithCodexFallbackContract(fixture, SITE_LOCALES),
      /dashboard-english-canonical/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("Software Engineering declares English instructional content inside nine indexable localized shells", () => {
  const contract = discoverSoftwareEngineeringFallbackContract(ROOT, SITE_LOCALES);
  assert.equal(contract.domain, "software-engineering");
  assert.deepEqual(contract.shellLocales, SITE_LOCALES);
  assert.deepEqual(contract.contentLocales, ["en"]);
  assert.deepEqual(contract.hreflangLocales, SITE_LOCALES);
  assert.equal(contract.contentLocaleMode, "fixed-default");
  assert.equal(contract.canonicalLocaleMode, "route-locale");
  assert.equal(contract.units.length, 18);
});

test("Software Engineering fallback discovery fails closed if the materialized English locale disappears", () => {
  const files = [
    "lib/software-engineering/types.ts",
    "lib/software-engineering/load.ts",
    "app/[locale]/software-engineering/page.tsx",
    "app/[locale]/software-engineering/[lesson]/page.tsx",
    "components/software-engineering/CourseDashboard.tsx",
    "components/software-engineering/LessonView.tsx",
    "app/sitemap.ts",
  ] as const;
  const fixture = cloneContractFixture(files);
  try {
    const load = join(fixture, "lib/software-engineering/load.ts");
    writeFileSync(load, readFileSync(load, "utf8").replace('contentLocale: "en",', 'contentLocale: locale,'));
    assert.throws(
      () => discoverSoftwareEngineeringFallbackContract(fixture, SITE_LOCALES),
      /materialized-english-content/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("the clone detector permits the declared Codex subject but still catches foreign clone markers", () => {
  assert.equal(
    isCourseCloneLeak("make-money-with-codex", "meta.title", "How to make money with Codex"),
    false,
  );
  assert.equal(
    isCourseCloneLeak("make-money-with-codex", "lessons.one.body", "Copied directly from Course 2"),
    true,
  );
  assert.equal(
    isCourseCloneLeak("machine-learning", "meta.title", "Codex course clone"),
    true,
  );
  assert.equal(
    isCourseCloneLeak("machine-learning", "sources.codex.title", "Codex documentation"),
    false,
  );
  assert.equal(
    isCourseCloneLeak("mcp", "lessons.host-integrations.title", "Connect Codex through MCP"),
    false,
  );
  assert.equal(
    isCourseCloneLeak("mcp", "lessons.tools.body", "Codex copied module"),
    true,
  );
});

test("raw-key detection distinguishes translation keys from nested protocol identifiers", () => {
  assert.equal(findRawMessageKey("Missing ui.resourceUri translation"), "ui.resourceUri");
  assert.equal(findRawMessageKey("Missing nav.courses translation"), "nav.courses");
  assert.equal(findRawMessageKey("MCP field _meta.ui.resourceUri is a protocol token"), "");
  assert.equal(findRawMessageKey("prefix.ui.resourceUri is not a root message key"), "");
});
