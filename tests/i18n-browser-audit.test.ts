import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { seoContracts } from "../scripts/check-routes.mjs";
import { PLAYWRIGHT_TEST_ORIGIN } from "./playwright-test-url";
import {
  NAME_REQUIRED_CONTROL_SELECTOR,
  isExpectedNextRscAbort,
  partitionGeometryFindings,
  rawRenderedKeys,
  translationSegmentRequiresComparison,
} from "../scripts/lib/i18n-browser-audit-policy.mjs";

const surface = JSON.parse(readFileSync("config/course-release-surface.json", "utf8"));

test("browser SEO auditing follows each registry-owned content-locale contract", () => {
  const contracts = seoContracts(surface);
  assert.deepEqual(contracts.get("/en/agent-orchestration")?.contentLocales, [
    "en",
    "zh-Hans",
  ]);
  assert.deepEqual(contracts.get("/en/prompts")?.contentLocales, ["en"]);
  assert.equal(contracts.has("/ar/prompts"), false);

  const source = readFileSync("scripts/audit-i18n-browser.mjs", "utf8");
  assert.match(source, /seoContracts\(releaseSurface\)/);
  assert.match(source, /assertAlternateContract\(/);
  assert.match(source, /result\.finalUrl/);
  assert.doesNotMatch(source, /for \(const required of \[\.\.\.locales, "x-default"\]\)/);
});

test("browser raw-key detection rejects only complete rendered sentinels", () => {
  assert.deepEqual(rawRenderedKeys([
    "ui.resourceUri",
    "undefined",
    "null",
    "A null result can reflect no effect.",
    "A slow tail blocks an undefined join.",
    "The _meta.ui.resourceUri field is documented.",
    "nav.courses",
    " nav.courses ",
  ]), ["nav.courses", "null", "ui.resourceUri", "undefined"]);
});

test("only same-language translatable prose participates in exact-English comparison", () => {
  assert.equal(translationSegmentRequiresComparison({
    text: "Connector permissions differ.",
    lang: "en",
    auditExempt: false,
  }, "ar"), false);
  assert.equal(translationSegmentRequiresComparison({
    text: "git status && git diff",
    lang: "ar",
    auditExempt: true,
  }, "ar"), false);
  assert.equal(translationSegmentRequiresComparison({
    text: "This paragraph was not translated.",
    lang: "ar",
    auditExempt: false,
  }, "ar"), true);
});

test("only narrowly shaped Next RSC prefetch aborts are ignored", () => {
  assert.equal(isExpectedNextRscAbort({
    url: `${PLAYWRIGHT_TEST_ORIGIN}/en/__next.$d$locale.txt?_rsc=abc`,
    method: "GET",
    failure: "net::ERR_ABORTED",
  }), true);
  assert.equal(isExpectedNextRscAbort({
    url: `${PLAYWRIGHT_TEST_ORIGIN}/_next/static/chunk.js`,
    method: "GET",
    failure: "net::ERR_ABORTED",
  }), false);
  assert.equal(isExpectedNextRscAbort({
    url: `${PLAYWRIGHT_TEST_ORIGIN}/en/__next._tree.txt?_rsc=abc`,
    method: "POST",
    failure: "net::ERR_ABORTED",
  }), false);
});

test("name checks target interactive controls, not live regions or decorative images", () => {
  assert.match(NAME_REQUIRED_CONTROL_SELECTOR, /button/);
  assert.match(NAME_REQUIRED_CONTROL_SELECTOR, /a\[href\]/);
  assert.match(NAME_REQUIRED_CONTROL_SELECTOR, /img:not\(\[alt\]\)/);
  assert.doesNotMatch(NAME_REQUIRED_CONTROL_SELECTOR, /(^|,)\[role\](,|$)/);
  assert.doesNotMatch(NAME_REQUIRED_CONTROL_SELECTOR, /(^|,)img(,|$)/);
  assert.match(
    readFileSync("scripts/audit-i18n-browser.mjs", "utf8"),
    /descendantImageText/,
  );
  assert.match(
    readFileSync("scripts/audit-i18n-browser.mjs", "utf8"),
    /element\.hidden/,
  );
});

test("intentional line clamps stay reviewable while real overflow remains a failure", () => {
  const result = partitionGeometryFindings([
    {
      viewport: { width: 390, height: 844 },
      documentOverflow: false,
      clipped: [
        { text: "teaser", horizontal: false, vertical: true, intentional: true },
        { text: "breadcrumb", horizontal: true, vertical: false, intentional: true },
        {
          text: "contracted breadcrumb",
          horizontal: true,
          vertical: false,
          intentional: true,
          truncationContract: "breadcrumb-current",
        },
        { text: "heading", horizontal: true, vertical: false, intentional: false },
      ],
    },
    {
      viewport: { width: 768, height: 1024 },
      documentOverflow: true,
      clipped: [],
      overflowing: [{ tag: "pre", left: 0, right: 900 }],
    },
  ]);
  assert.equal(result.review.length, 2);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.fail.length, 2);
  assert.deepEqual(result.fail[1].overflowing, [{ tag: "pre", left: 0, right: 900 }]);
});

test("only explicitly owned breadcrumb and lesson-teaser truncation is accepted", () => {
  const source = readFileSync("scripts/audit-i18n-browser.mjs", "utf8");
  assert.match(source, /element\.dataset\.auditTruncation/);
  assert.match(source, /acceptedIntentionalTruncations/);

  for (const [file, contract] of [
    ["components/course-shell/CourseShell.tsx", "breadcrumb-current"],
    ["components/prompts/LessonView.tsx", "breadcrumb-current"],
    ["components/rag/LessonView.tsx", "breadcrumb-current"],
    ["components/grok/LessonView.tsx", "breadcrumb-current"],
    ["components/grok/CourseDashboard.tsx", "lesson-teaser"],
  ] as const) {
    assert.match(
      readFileSync(file, "utf8"),
      new RegExp(`data-audit-truncation="${contract}"`),
      `${file} must declare its reviewed truncation contract`,
    );
  }
});

test("the global 404 explicitly publishes the existing SVG favicon", () => {
  const source = readFileSync("app/global-not-found.tsx", "utf8");
  assert.match(source, /icons:\s*\{\s*icon:\s*\[\{\s*url:\s*"\/favicon\.svg"/);
});

test("GitHub lesson grid items may shrink around long inline technical text", () => {
  const styles = readFileSync("components/github/GithubCourse.module.css", "utf8");
  assert.match(
    styles,
    /\.sectionBody\s*>\s*\*\s*\{[^}]*min-inline-size:\s*0;/,
  );
});

test("proper names, approved official names, and source licences expose their English language", () => {
  const about = readFileSync("app/[locale]/about/page.tsx", "utf8");
  const orchestration = readFileSync("components/agent-orchestration/ModuleView.tsx", "utf8");
  assert.match(about, /<h3 lang="en" dir="ltr" translate="no">/);
  assert.match(about, /officialEnglishAffiliation\s*\?\s*"en"/);
  assert.match(orchestration, /<bdi lang="en" dir="ltr">\{source\.license\}<\/bdi>/);
});

test("long localized lesson titles may wrap before they widen the mobile document", () => {
  for (const file of [
    "components/grok/GrokCourse.module.css",
    "components/mcp/McpCourse.module.css",
  ]) {
    const styles = readFileSync(file, "utf8");
    assert.match(
      styles,
      /\.lessonHero\s+h1\s*\{[^}]*overflow-wrap:\s*anywhere;/,
      `${file} must allow long localized lesson titles to wrap`,
    );
  }
});

test("mobile semantic figures keep every label inside their visible frame", () => {
  const rag = readFileSync("components/rag/RagCourse.module.css", "utf8");
  const prompts = readFileSync("components/prompts/PromptCourse.module.css", "utf8");
  assert.match(rag, /\.budgetFigure\s+span\s*\{[^}]*min-inline-size:\s*52px;/);
  assert.match(
    rag,
    /\.scoreboardFigure\s+:is\(th,\s*td\)\s*\{[^}]*overflow-wrap:\s*anywhere;/,
  );
  assert.match(
    prompts,
    /\.authorityArrow\s*\{[^}]*inline-size:\s*40px;[^}]*justify-self:\s*center;[^}]*transform:\s*rotate\(90deg\);/,
  );
});
