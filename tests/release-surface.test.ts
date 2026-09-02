import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  BLOCKED_CATALOG_COURSES,
  CATALOG_COURSE_RELEASES,
  CATALOG_COURSES,
  PUBLISHED_CATALOG_COURSES,
  ROADMAP_CATALOG_COURSES,
  TOP_LEVEL_COURSES,
} from "../lib/courses";
import { LOCALE_CODES } from "../lib/i18n";
import { LEARNING_KEY, LEARNING_PROGRESS_EVENT } from "../lib/progress";
import { CODEX_LOCALES } from "../lib/codex";
import { CLAUDE_LOCALES } from "../lib/claude";
import { CURSOR_LOCALES } from "../lib/cursor";
import { GROK_LOCALES } from "../lib/grok";
import { GITHUB_LOCALES } from "../lib/github";
import { RAG_LOCALES } from "../lib/rag";
import { MCP_LOCALES } from "../lib/mcp";
import { loadPromptCourse } from "../lib/prompts";
import { loadSoftwareEngineeringCourse } from "../lib/software-engineering";
import { AI_TUTOR_TRANSLATED_LOCALES } from "../lib/ai-tutor";
import { PRODUCT_MANAGEMENT_TRANSLATED_LOCALES } from "../lib/product-management";
import { AGENT_ORCHESTRATION_TRANSLATED_LOCALES } from "../lib/agent-orchestration";
import {
  BLOCKED_COURSE_SURFACES,
  COURSE_RELEASE_SURFACE,
  PUBLISHED_COURSE_SURFACES,
  ROADMAP_COURSE_SURFACES,
  STAGED_COURSE_SURFACES,
  courseChildParams,
  courseChildRouteValues,
  courseHrefFor,
  courseLocaleParams,
  contentLocaleForCourse,
  PUBLISHED_LOCALIZED_PAGES,
  publishedGateLedger,
  publishedLocalizedRoutes,
  releaseSurfaceFor,
  type CourseId,
} from "../lib/release-surface";
import {
  AGENT_ORCHESTRATION_FIXED_PAGES,
  AGENT_ORCHESTRATION_MODULE_PAGES,
  INDEXABLE_PAGES,
  PAGES,
  agentOrchestrationFixedPage,
  agentOrchestrationModulePage,
} from "../lib/seo";
import {
  PUBLIC_COURSE_SURFACES,
  publicCourseHrefFor,
  publicLocaleSwitchHref,
  withPublicCourseReturnLocale,
} from "../lib/public-release-surface";
import {
  CATALOG_COURSE_RELEASES as PUBLIC_CATALOG_COURSE_RELEASES,
} from "../lib/public-courses";

const FULLY_LOCALIZED = ["agentic", "codex", "claude", "cursor", "grok", "github", "rag", "mcp"];
const ENGLISH_ONLY = [
  "prompts",
  "software-engineering",
  "make-money-with-codex",
  "claude-income",
  "ai-tutor",
  "product-management",
];

test("the manifest preserves the frozen published set and private candidate backlog", () => {
  assert.equal(COURSE_RELEASE_SURFACE.schemaVersion, 3);
  assert.deepEqual(COURSE_RELEASE_SURFACE.siteLocales, LOCALE_CODES);
  assert.equal(PUBLISHED_COURSE_SURFACES.length, 12);
  assert.deepEqual(
    BLOCKED_COURSE_SURFACES.map((course) => course.id).sort(),
    [
      "agentic-quant-trading",
      "agentic-video-editing",
      "ai-teaching",
      "claude",
      "codex",
      "cursor",
      "math-animation",
      "responsible-ai",
    ],
  );
  assert.deepEqual(
    ROADMAP_COURSE_SURFACES.map((course) => course.id).sort(),
    ["ai-research"],
  );
  assert.deepEqual(STAGED_COURSE_SURFACES.map((course) => course.id), ["creator-ops"]);
  const checkerSource = readFileSync("scripts/check-release-surface.mjs", "utf8");
  assert.doesNotMatch(checkerSource, /published\.length\s*===\s*12/);
  assert.doesNotMatch(checkerSource, /\b(?:AUTHORED_IDS|BLOCKED_IDS|ROADMAP_IDS)\b/);

  for (const course of [...PUBLISHED_COURSE_SURFACES, ...BLOCKED_COURSE_SURFACES]) {
    assert.equal(course.primaryLocale, "en");
    assert.ok(course.contentLocales.includes(course.primaryLocale));
    assert.equal(typeof course.releaseGate, "string");
    assert.ok(course.progress);
  }
  for (const course of ROADMAP_COURSE_SURFACES) {
    assert.equal(course.primaryLocale, null);
    assert.deepEqual(course.contentLocales, []);
    assert.deepEqual(course.routes, []);
    assert.equal(course.releaseGate, null);
    assert.equal(course.progress, null);
  }
  const creatorOps = STAGED_COURSE_SURFACES[0];
  assert.equal(creatorOps.fallbackLocale, "en");
  assert.deepEqual(creatorOps.reviewedContentLocales, ["en", "zh-Hans"]);
  assert.equal(creatorOps.progress, null);
  assert.equal(creatorOps.routes.length, 11);
});

test("the public README does not promote blocked course routes or detailed course sections", () => {
  const readme = readFileSync("README.md", "utf8");
  const englishMessages = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;
  for (const course of BLOCKED_COURSE_SURFACES) {
    const routeRoot = course.routes[0];
    assert.ok(routeRoot);
    const routePrefix = routeRoot.replace(/\/+$/, "");
    for (const locale of LOCALE_CODES) {
      const escapedPath = `/${locale}/${routePrefix}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert.doesNotMatch(
        readme,
        new RegExp(`${escapedPath}(?:/|[?#]|$)`),
        `${course.id} ${locale}`,
      );
    }
    assert.doesNotMatch(
      readme,
      new RegExp(`^## Course: ${englishMessages[course.titleKey]}\\s*$`, "m"),
      course.id,
    );
    assert.equal(readme.includes(course.releaseGate!), false, course.id);
  }
  const checker = readFileSync("scripts/check-release-surface.mjs", "utf8");
  assert.match(checker, /assertReadmePublicationBoundary\(contract, blocked\)/);
});

test("contentLocales match the loader-backed translation boundary", async () => {
  const loaderLocales = new Map<string, readonly string[]>([
    ["agentic", LOCALE_CODES],
    ["codex", CODEX_LOCALES],
    ["claude", CLAUDE_LOCALES],
    ["cursor", CURSOR_LOCALES],
    ["grok", GROK_LOCALES],
    ["github", GITHUB_LOCALES],
    ["rag", RAG_LOCALES],
    ["mcp", MCP_LOCALES],
  ]);
  for (const id of FULLY_LOCALIZED) {
    assert.deepEqual(releaseSurfaceFor(id as CourseId).contentLocales, loaderLocales.get(id), id);
  }
  for (const id of ENGLISH_ONLY) {
    assert.deepEqual(releaseSurfaceFor(id as CourseId).contentLocales, ["en"], id);
  }
  assert.equal((await loadPromptCourse("fr")).contentLocale, "en");
  assert.equal((await loadSoftwareEngineeringCourse("fr")).contentLocale, "en");
  assert.deepEqual(releaseSurfaceFor("ai-tutor").contentLocales, AI_TUTOR_TRANSLATED_LOCALES);
  assert.deepEqual(
    releaseSurfaceFor("product-management").contentLocales,
    PRODUCT_MANAGEMENT_TRANSLATED_LOCALES,
  );
  assert.deepEqual(
    releaseSurfaceFor("agent-orchestration").contentLocales,
    AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
  );

  // These two curricula intentionally localize chrome only; their lesson
  // components mark the long-form body as English.
  assert.match(
    readFileSync("components/make-money-with-codex/LessonView.tsx", "utf8"),
    /en-content/,
  );
  assert.match(
    readFileSync("components/claude-income/LessonView.tsx", "utf8"),
    /lang="en"/,
  );
});

test("catalogue display data and progress adapters stay joined to registry state", () => {
  assert.equal(CATALOG_COURSE_RELEASES.length, 21);
  assert.equal(PUBLISHED_CATALOG_COURSES.length, 12);
  assert.equal(BLOCKED_CATALOG_COURSES.length, 8);
  assert.equal(ROADMAP_CATALOG_COURSES.length, 1);

  const soon = CATALOG_COURSES.filter((course) => course.status === "soon")
    .map((course) => course.id)
    .sort();
  assert.deepEqual(soon, ["ai-research"]);

  for (const { course, surface } of CATALOG_COURSE_RELEASES) {
    assert.equal(course.titleKey, surface.titleKey);
    if (surface.state === "roadmap") {
      assert.equal(course.href, "#");
    } else {
      assert.equal(course.href, surface.href);
    }
  }

  for (const course of TOP_LEVEL_COURSES) {
    const surface = releaseSurfaceFor(course.id);
    if (course.id === "agentic") {
      assert.deepEqual(surface.progress, {
        strategy: "agentic-learning-v2",
        storageKey: LEARNING_KEY,
        event: LEARNING_PROGRESS_EVENT,
      });
      continue;
    }
    assert.equal(surface.progress?.strategy, course.progressStrategy);
    assert.equal(surface.progress?.storageKey, course.progressStorageKey ?? "ae.progress");
    assert.equal(surface.progress?.event, course.progressEvent ?? null);
  }
});

test("static params emit only published content locales", () => {
  for (const surface of PUBLISHED_COURSE_SURFACES) {
    assert.deepEqual(
      courseLocaleParams(surface.id).map(({ locale }) => locale),
      surface.contentLocales,
    );
  }
  for (const surface of [
    ...BLOCKED_COURSE_SURFACES,
    ...STAGED_COURSE_SURFACES,
    ...ROADMAP_COURSE_SURFACES,
  ]) {
    assert.deepEqual(courseLocaleParams(surface.id), []);
  }
  assert.deepEqual(courseChildParams("prompts", "lesson", ["one"]), [
    { locale: "en", lesson: "one" },
  ]);
  assert.deepEqual(courseChildParams("agent-orchestration", "module", ["one"]), [
    { locale: "en", module: "one" },
    { locale: "zh-Hans", module: "one" },
  ]);
  assert.deepEqual(courseChildParams("codex", "lesson", ["one"]), []);
  assert.deepEqual(
    courseChildRouteValues("codex"),
    releaseSurfaceFor("codex").routes.slice(1).map((route) => route.split("/")[1]),
  );
});

test("Course 15 fixed pages stay separate from its fifteen-module projection", () => {
  assert.deepEqual(AGENT_ORCHESTRATION_FIXED_PAGES, [
    "agent-orchestration/assessment/",
    "agent-orchestration/capstone/",
  ]);
  assert.equal(AGENT_ORCHESTRATION_MODULE_PAGES.length, 15);
  assert.equal(
    AGENT_ORCHESTRATION_MODULE_PAGES.includes("agent-orchestration/assessment/"),
    false,
  );
  assert.equal(
    AGENT_ORCHESTRATION_MODULE_PAGES.includes("agent-orchestration/capstone/"),
    false,
  );
  assert.equal(agentOrchestrationFixedPage("assessment"), "agent-orchestration/assessment/");
  assert.equal(agentOrchestrationFixedPage("capstone"), "agent-orchestration/capstone/");
  assert.throws(() => agentOrchestrationFixedPage("workflow-agent-boundary"));
  assert.throws(() => agentOrchestrationModulePage("assessment"));
  assert.throws(() => agentOrchestrationModulePage("capstone"));
});

test("registry sync keeps blocked implementations private and can generate public route wiring", () => {
  for (const surface of COURSE_RELEASE_SURFACE.courses.filter(
    (course) => course.state !== "roadmap",
  )) {
    for (const root of new Set(surface.routes.map((route) => route.split("/")[0]))) {
      const page = `app/[locale]/${root}/page.tsx`;
      const authored = existsSync(`app/[locale]/_blocked/${surface.id}/page.tsx`)
        || existsSync(`app/[locale]/_staged/${surface.id}/page.tsx`);
      if ((surface.state === "blocked" || surface.state === "staged") && authored) {
        assert.equal(existsSync(page), false, page);
        continue;
      }
      assert.equal(existsSync(page), true, page);
      const source = readFileSync(page, "utf8");
      assert.match(source, new RegExp(`courseLocaleParams\\(\"${surface.id}\"\\)`));
      assert.match(source, /export\s+const\s+dynamicParams\s*=\s*false\s*;/, page);

      const routeDirectory = `app/[locale]/${root}`;
      for (const entry of readdirSync(routeDirectory, { withFileTypes: true })) {
        if (!entry.isDirectory() || !/^\[[^\]]+\]$/.test(entry.name)) continue;
        const child = `${routeDirectory}/${entry.name}/page.tsx`;
        assert.equal(existsSync(child), true, child);
        assert.match(
          readFileSync(child, "utf8"),
          /export\s+const\s+dynamicParams\s*=\s*false\s*;/,
          child,
        );
      }
    }
  }
  const checker = readFileSync("scripts/check-release-surface.mjs", "utf8");
  assert.doesNotMatch(checker, /await\s+import\([^)]*_blocked/);
  for (const id of ["codex", "claude", "cursor"] as const) {
    const child = `app/[locale]/${id}/[lesson]/page.tsx`;
    assert.equal(existsSync(child), false, child);
    assert.equal(existsSync(`app/[locale]/_blocked/${id}/[lesson]/page.tsx`), true);
  }

  const catalogueSource = readFileSync("app/[locale]/courses/page.tsx", "utf8");
  assert.match(catalogueSource, /PUBLIC_COURSE_IDS\.map/);
  assert.match(catalogueSource, /\.\.\.registryPartsByCourse/);
  assert.match(catalogueSource, /partsByCourse\[course\.id\]\s*\?\?\s*\[\]/);
});

test("learner links resolve to real content locales and never expose blocked routes", () => {
  assert.equal(contentLocaleForCourse("grok", "fr"), "fr");
  assert.equal(courseHrefFor("grok", "fr"), "/fr/grok/");
  assert.equal(contentLocaleForCourse("prompts", "fr"), "en");
  assert.equal(courseHrefFor("prompts", "fr"), "/en/prompts/");
  assert.equal(contentLocaleForCourse("agent-orchestration", "zh-Hans"), "zh-Hans");
  assert.equal(courseHrefFor("agent-orchestration", "fr"), "/en/agent-orchestration/");
  assert.equal(courseHrefFor("codex", "en"), null);
  assert.equal(courseHrefFor("ai-research", "en"), null);
  assert.equal(publicCourseHrefFor("grok", "fr"), "/fr/grok/");
  assert.equal(publicCourseHrefFor("prompts", "fr"), "/en/prompts/");
  assert.equal(publicCourseHrefFor("codex", "en"), null);
  assert.equal(PUBLIC_COURSE_SURFACES.some((course) => "releaseGate" in course), false);
  assert.equal(PUBLIC_COURSE_SURFACES.some((course) => "blockers" in course), false);
  assert.equal(PUBLIC_CATALOG_COURSE_RELEASES.length, 21);
  assert.ok(PUBLIC_CATALOG_COURSE_RELEASES
    .filter(({ surface }) => surface.state !== "published")
    .every(({ course }) => course.href === "#" && course.status === "soon"));
});

test("cross-language course links preserve only an allowlisted shell locale", () => {
  assert.equal(
    withPublicCourseReturnLocale("/en/prompts/lesson/?view=compact#practice", "ar"),
    "/en/prompts/lesson/?view=compact&fromLocale=ar#practice",
  );
  assert.equal(
    withPublicCourseReturnLocale("/en/prompts/", "en"),
    "/en/prompts/",
  );
  assert.equal(
    withPublicCourseReturnLocale("/en/prompts/", "not-a-locale"),
    "/en/prompts/",
  );
});

test("language switching preserves real course paths and the requested shell locale", () => {
  assert.equal(
    publicLocaleSwitchHref("/en/claude-income/", "de"),
    "/en/claude-income/?fromLocale=de",
  );
  assert.equal(
    publicLocaleSwitchHref("/en/claude-income/choose-a-money-path/", "ar"),
    "/en/claude-income/choose-a-money-path/?fromLocale=ar",
  );
  assert.equal(
    publicLocaleSwitchHref("/en/claude-income/choose-a-money-path/", "en"),
    "/en/claude-income/choose-a-money-path/",
  );
  assert.equal(
    publicLocaleSwitchHref("/en/grok/read-interface/", "de"),
    "/de/grok/read-interface/",
  );
  assert.equal(
    publicLocaleSwitchHref(
      "/en/agent-orchestration/workflow-agent-boundary/",
      "zh-Hans",
    ),
    "/zh-Hans/agent-orchestration/workflow-agent-boundary/",
  );
  assert.equal(
    publicLocaleSwitchHref(
      "/en/agent-orchestration/workflow-agent-boundary/",
      "fr",
    ),
    "/en/agent-orchestration/workflow-agent-boundary/?fromLocale=fr",
  );
  assert.equal(publicLocaleSwitchHref("/en/about/", "de"), "/de/about/");
  assert.equal(
    publicLocaleSwitchHref("/en/claude-income-guide/", "de"),
    "/de/claude-income-guide/",
  );
  assert.equal(publicLocaleSwitchHref("/en/", "de"), "/de/");
  assert.equal(
    publicLocaleSwitchHref("/en/about/", "not-a-locale"),
    "/en/about/",
  );
  assert.equal(
    publicLocaleSwitchHref("/en/software-engineering/capstone-safe-change/", "ar", "#review"),
    "/en/software-engineering/capstone-safe-change/?fromLocale=ar#review",
  );
});

test("SEO, sitemap, and robots consume the same publication boundary", () => {
  const published = new Set([
    ...COURSE_RELEASE_SURFACE.core.routes,
    ...PUBLISHED_COURSE_SURFACES.flatMap((course) => course.routes),
  ]);
  assert.deepEqual(new Set(PAGES), published);
  assert.deepEqual(new Set(PAGES), new Set(PUBLISHED_LOCALIZED_PAGES));
  assert.deepEqual(new Set(INDEXABLE_PAGES), published);
  assert.equal([...PAGES].some((page) => /^(codex|claude|cursor|agentic-video-editing)\//.test(page)), false);

  const routes = publishedLocalizedRoutes();
  const expectedLocalizedRouteCount =
    COURSE_RELEASE_SURFACE.core.contentLocales.length * COURSE_RELEASE_SURFACE.core.routes.length
    + PUBLISHED_COURSE_SURFACES.reduce(
      (sum, course) => sum + course.contentLocales.length * course.routes.length,
      0,
    );
  assert.equal(routes.length, expectedLocalizedRouteCount);
  assert.equal(new Set(routes).size, expectedLocalizedRouteCount);
  assert.equal(routes.some((route) => /\/(codex|claude|cursor|agentic-video-editing)(\/|$)/.test(route)), false);
  assert.ok(routes.includes("/en/prompts"));
  assert.equal(routes.includes("/fr/prompts"), false);
  assert.ok(routes.includes("/zh-Hans/agent-orchestration"));
  assert.equal(routes.includes("/fr/agent-orchestration"), false);

  const sitemapUrls = sitemap().map((entry) => new URL(entry.url).pathname.replace(/\/$/, ""));
  assert.equal(sitemapUrls.length, expectedLocalizedRouteCount);
  assert.deepEqual(new Set(sitemapUrls), new Set(routes));

  const rules = robots().rules;
  assert.ok(Array.isArray(rules));
  const disallow = (rules[0] as { disallow?: string[] }).disallow ?? [];
  assert.deepEqual(disallow, []);
  assert.doesNotMatch(JSON.stringify(robots()), /\b(?:codex|claude|cursor|agentic-video-editing|ai-research|responsible-ai)\b/);
});

test("the published ledger contains one fail-closed gate per published course", () => {
  const ledger = publishedGateLedger();
  assert.equal(ledger.schemaVersion, 3);
  assert.equal(ledger.publishedCount, PUBLISHED_COURSE_SURFACES.length);
  assert.equal(ledger.blockedCount, BLOCKED_COURSE_SURFACES.length);
  assert.equal(ledger.gates.length, PUBLISHED_COURSE_SURFACES.length);
  assert.equal(
    new Set(ledger.gates.map((gate) => gate.courseId)).size,
    PUBLISHED_COURSE_SURFACES.length,
  );
  assert.ok(ledger.gates.every((gate) => gate.releaseGate.length > 0));
});

test("course collection JSON-LD enumerates only published registry entries", () => {
  const source = readFileSync("app/[locale]/courses/page.tsx", "utf8");
  assert.match(source, /PUBLISHED_CATALOG_COURSES\.map/);
  assert.doesNotMatch(source, /\bTOP_LEVEL_COURSES\.map/);
  assert.match(source, /name:[^\n]+t\(course\.titleKey\)/);
  assert.match(source, /description:[^\n]+t\(course\.blurbKey\)/);
  assert.match(source, /educationalLevel:\s*t\(course\.levelKey\)/);
  assert.doesNotMatch(source, /t\(`c\.\$\{course\.id\}\.(?:title|blurb|level)`\)/);
  assert.match(source, /courseHrefFor\(course\.id, locale\)/);
  assert.match(source, /contentLocaleForCourse\(courseId, locale\)/);
});
