import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const DISCLOSURE_IDS = [
  "provider-options",
  "local-progress",
  "stage9-artifact",
  "setup-help",
] as const;
const PHASE_TWO_KEYS = [
  "build.referenceTitle",
  "build.referenceBody",
  "build.providerDisclosure",
  "build.progressDisclosure",
  "build.artifactDisclosure",
  "build.helpDisclosure",
  "build.sourcesTitle",
  "build.sourcesBody",
  "build.sourcesDeepSeekSnapshotLabel",
  "build.sourcesClaudeSnapshotLabel",
  "build.sourcesOfficialReviewLabel",
  "build.sourcesSdkLabel",
  "build.sourcesClaudeBoundary",
  "build.sourcesObservationBoundary",
  "build.sourcesDeepSeekPricing",
  "build.sourcesDeepSeekCompatibility",
  "build.sourcesDeepSeekThinking",
  "build.sourcesClaudeStructured",
  "build.sourcesClaudeEffort",
  "build.sourcesClaudeTokenCounting",
  "build.sourcesClaudeToolRunner",
  "build.sourcesClaudePricing",
  "build.sourcesSdk",
] as const;
const OFFICIAL_URLS = [
  "https://api-docs.deepseek.com/quick_start/pricing/",
  "https://api-docs.deepseek.com/guides/anthropic_api/",
  "https://api-docs.deepseek.com/guides/thinking_mode/",
  "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
  "https://platform.claude.com/docs/en/build-with-claude/effort",
  "https://platform.claude.com/docs/en/build-with-claude/token-counting",
  "https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner",
  "https://platform.claude.com/docs/en/about-claude/pricing",
  "https://github.com/anthropics/anthropic-sdk-typescript/tree/sdk-v0.117.1",
] as const;

test("Course 3 keeps its essential journey open and puts exactly four secondary areas behind native disclosure", () => {
  const page = readFileSync("app/[locale]/build/page.tsx", "utf8");
  const setupIndex = page.indexOf('id="local-setup"');
  const stagesIndex = page.indexOf('id="course-stages"');
  const referenceIndex = page.indexOf("data-course3-reference");

  assert.doesNotMatch(page, /^\s*["']use client["']/m);
  assert.ok(setupIndex >= 0 && stagesIndex > setupIndex && referenceIndex > stagesIndex);
  assert.equal((page.match(/data-course3-disclosure(?:\s|>)/g) ?? []).length, 4);
  for (const id of DISCLOSURE_IDS) {
    assert.match(page, new RegExp(`<details[^>]*id=["']${id}["'][^>]*data-course3-disclosure`));
  }
  assert.doesNotMatch(page, /<details[^>]*data-course3-disclosure[^>]*\sopen(?:\s|=|>)/);
  assert.match(page, /<summary[^>]*className=\{styles\.disclosureSummary\}/);
  assert.match(page, /className=\{styles\.summaryText\}/);
  assert.match(page, /className=\{styles\.sourceLinkText\}/);
  assert.match(page, /data-course3-source-notes/);
  assert.match(page, /export CAFE_PROVIDER=deepseek\\nunset CAFE_MODEL/);
  assert.match(page, /\$env:CAFE_PROVIDER = \"deepseek\"\\n\$env:CAFE_MODEL = \$null/);
  assert.match(page, /export CAFE_PROVIDER=anthropic\\nunset CAFE_MODEL/);
  assert.match(page, /\$env:CAFE_PROVIDER = \"anthropic\"\\n\$env:CAFE_MODEL = \$null/);
  assert.ok(
    page.indexOf("data-course3-source-notes") > page.indexOf('id="provider-options"'),
    "source notes should travel with the mutable live-provider material",
  );
});

test("Course 3 source facts bind visible dates and the exact installed SDK to official primary sources", () => {
  const page = readFileSync("app/[locale]/build/page.tsx", "utf8");
  const facts = readFileSync("lib/course3-sources.ts", "utf8");
  const pricing = readFileSync("lib/byok/pricing.ts", "utf8");
  const anthropicPricing = readFileSync("course/cafe/pricing.ts", "utf8");
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
    packages: Record<string, { version?: string }>;
  };

  assert.match(page, /COURSE3_SOURCE_FACTS/);
  assert.match(page, /<time[^>]*dateTime=/);
  assert.match(page, /<dl[^>]*className=\{styles\.sourceFacts\}/);
  assert.equal(lock.packages["node_modules/@anthropic-ai/sdk"].version, "0.117.1");
  assert.match(facts, /COURSE3_SDK_VERSION\s*=\s*["']0\.117\.1["']/);
  assert.match(facts, /sdkVersion:\s*COURSE3_SDK_VERSION/);
  assert.match(facts, /sdk-v\$\{COURSE3_SDK_VERSION\}/);
  assert.match(facts, /officialSourcesReviewedAt:\s*["']2026-08-31["']/);
  assert.match(facts, /claudePricingCheckedAt:\s*ANTHROPIC_COURSE_PRICING\.checkedAt/);
  assert.match(facts, /DEEPSEEK_PRICING\.checkedAt/);
  for (const url of OFFICIAL_URLS.filter((url) => !url.includes("anthropic-sdk-typescript"))) {
    assert.ok(`${facts}\n${pricing}\n${anthropicPricing}`.includes(url), url);
  }
});

test("all nine launchpads localize the disclosure and evidence-boundary copy without English fallback", () => {
  const english = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;
  for (const locale of LOCALES) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    for (const key of PHASE_TWO_KEYS) {
      assert.equal(typeof messages[key], "string", `${locale}:${key} must exist`);
      assert.ok(messages[key].trim(), `${locale}:${key} must not be blank`);
      if (key === "build.sourcesClaudeBoundary") {
        assert.doesNotMatch(
          messages[key],
          /\b\d{4}-\d{2}-\d{2}\b/,
          `${locale}:${key} must use the manifest-backed date shown above`,
        );
      }
      if (key === "build.sourcesSdk") {
        assert.doesNotMatch(
          messages[key],
          /\b\d+\.\d+\.\d+\b/,
          `${locale}:${key} must render the manifest-backed version separately`,
        );
      }
      if (locale !== "en") {
        assert.notEqual(messages[key], english[key], `${locale}:${key} must not fall back to English`);
      }
    }
  }
});

test("all launchpads distinguish the static-site boundary from the optional live Claude path", () => {
  const english = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;
  assert.match(english["build.providerClaudeBody"], /optional live Provider/i);
  assert.doesNotMatch(english["build.providerClaudeBody"], /local Provider/i);
  assert.match(
    english["build.boundaryBody"],
    /static website never receives[\s\S]*live CLI mode[\s\S]*selected credential and request[\s\S]*course\/progress\.json/i,
  );
  assert.doesNotMatch(
    english["build.boundaryBody"],
    /keys, outputs and progress stay in your local clone/i,
  );

  for (const locale of LOCALES) {
    const messages = JSON.parse(
      readFileSync(`messages/${locale}.json`, "utf8"),
    ) as Record<string, string>;
    assert.match(messages["build.providerClaudeBody"], /Claude/);
    assert.match(messages["build.providerClaudeBody"], /CAFE_PROVIDER/);
    assert.match(messages["build.boundaryBody"], /CLI/);
    assert.match(messages["build.boundaryBody"], /course\/progress\.json/);
    if (locale !== "en") {
      assert.notEqual(
        messages["build.providerClaudeBody"],
        english["build.providerClaudeBody"],
      );
      assert.notEqual(messages["build.boundaryBody"], english["build.boundaryBody"]);
    }
  }
});

test("native disclosure keeps 44px targets, visible focus, and printable content", () => {
  const css = readFileSync("components/courses/Course3Launchpad.module.css", "utf8");
  const printHelper = readFileSync("components/courses/Course3PrintDisclosures.tsx", "utf8");

  assert.match(css, /\.disclosureSummary\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(css, /\.disclosureSummary:focus-visible\s*\{[\s\S]*outline:/);
  assert.match(css, /\.disclosureMarker::after/);
  assert.match(css, /\.disclosure\[open\] \.disclosureMarker::after/);
  assert.match(css, /@media print\s*\{[\s\S]*\.disclosure\[data-course3-disclosure\]:not\(\[open\]\)/);
  assert.match(css, /\.disclosure::details-content\s*\{[\s\S]*content-visibility:\s*visible/);
  assert.doesNotMatch(css, /\.sectionAnchor\s*\{[\s\S]*scroll-margin-top:\s*88px/);
  assert.match(printHelper, /^"use client";/);
  assert.match(printHelper, /addEventListener\("beforeprint"/);
  assert.match(printHelper, /addEventListener\("afterprint"/);
  assert.doesNotMatch(printHelper, /useState|localStorage|sessionStorage/);
});

test("learner documentation distinguishes official contracts and run-dependent behavior", () => {
  const root = readFileSync("course/README.md", "utf8");
  const stageTwo = readFileSync("course/stage2-prompt/README.md", "utf8");
  const stageFive = readFileSync("course/stage5-loop/README.md", "utf8");
  const stageEight = readFileSync("course/stage8-security/README.md", "utf8");
  const llm = readFileSync("course/cafe/llm.ts", "utf8");
  const combined = `${root}\n${stageTwo}\n${stageFive}\n${stageEight}\n${llm}`;

  for (const url of OFFICIAL_URLS) assert.ok(combined.includes(url), url);
  assert.doesNotMatch(root, /default if both are set/i);
  assert.doesNotMatch(root, /the same question, five different answers/i);
  assert.doesNotMatch(combined, /accepted and silently ignored/i);
  assert.doesNotMatch(stageTwo, /reply (?:is|\*\*cannot\*\*)[^\n]*wrong shape/i);
  assert.doesNotMatch(stageFive, /tool_runner/);
  assert.match(stageFive, /toolRunner\(\)/);
  assert.doesNotMatch(stageTwo, /Usually it is not one|flag[^\n]*flip on phrasing alone/);
  assert.match(stageTwo, /bundled offline fixture/);
  assert.doesNotMatch(stageFive, /It reads the error, and tries something else/);
  assert.match(stageFive, /guarantees no[\s\S]{0,80}recovery behavior/);
  assert.match(stageEight, /bundled offline fixture/);
  assert.match(root, /Monday.?Friday/i);
  assert.match(root, /run-dependent behaviors to measure/i);
  assert.doesNotMatch(root, /dated observations|observed during development/i);
  assert.match(stageTwo, /every constraint[^\n]*draft-7-compatible/i);
  assert.match(root, /both keys[\s\S]{0,100}stops/i);
  assert.doesNotMatch(root, /Two local limitations matter/i);
});
