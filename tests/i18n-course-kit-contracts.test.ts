import assert from "node:assert/strict";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  courseKitRouteContractIssues,
  courseKitSeoPages,
  courseKitSharedContractIssues,
  coursePolicyForRoute,
  discoverCourseKitContract,
  isAllowedFrameworkExportRoute,
  jsonLdLanguageIssues,
} from "../scripts/i18n-course-kit-contracts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("i18n discovery resolves all Course 16–21 contracts from the shared registry", () => {
  const contract = discoverCourseKitContract(ROOT);

  assert.deepEqual(contract.courseIds, [
    "responsible-ai",
    "ai-research",
    "ai-python-data",
    "machine-learning",
    "deep-learning",
    "production-ai",
  ]);
  assert.deepEqual(contract.courses.map((course) => course.name), contract.courseIds);
  assert.deepEqual(contract.shellLocales, [
    "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
  ]);
  assert.deepEqual(contract.contentLocales, ["en", "zh-Hans"]);
  assert.deepEqual(contract.courses.map((course) => course.modules.length), [10, 10, 10, 12, 12, 12]);
  assert.equal(new Set(contract.courses.flatMap((course) => course.modules.map((slug) => `${course.name}/${slug}`))).size, 66);
  assert.deepEqual(contract.courses[0]?.modules.slice(0, 1), ["purpose-risk-classification"]);
  assert.deepEqual(contract.courses[5]?.modules.slice(-1), ["dual-system-production-capstone"]);
});

test("CourseKit registry expands to the complete 72-page SEO family", () => {
  const contract = discoverCourseKitContract(ROOT);
  const pages = courseKitSeoPages(contract.courses);

  assert.equal(pages.length, 72);
  assert.equal(new Set(pages).size, 72);
  assert.ok(pages.includes("responsible-ai/"));
  assert.ok(pages.includes("responsible-ai/purpose-risk-classification/"));
  assert.ok(pages.includes("production-ai/dual-system-production-capstone/"));
});

test("fallback shells canonicalize to English and advertise only native content locales", () => {
  const contract = discoverCourseKitContract(ROOT);
  const courseMap = new Map(contract.courses.map((course) => [course.name, course]));
  const fallback = coursePolicyForRoute(
    "/ar/responsible-ai/purpose-risk-classification/",
    courseMap,
    "en",
  );
  const chinese = coursePolicyForRoute(
    "/zh-Hans/responsible-ai/purpose-risk-classification/",
    courseMap,
    "en",
  );

  assert.equal(fallback?.contentLocale, "en");
  assert.equal(fallback?.canonicalRoute, "/en/responsible-ai/purpose-risk-classification/");
  assert.deepEqual(fallback?.hreflangLocales, ["en", "zh-Hans"]);
  assert.equal(chinese?.contentLocale, "zh-Hans");
  assert.equal(chinese?.canonicalRoute, "/zh-Hans/responsible-ai/purpose-risk-classification/");
});

test("CourseKit routes may inherit metadata only through the audited shared helper", () => {
  assert.deepEqual(courseKitSharedContractIssues(ROOT), []);
  assert.deepEqual(
    courseKitRouteContractIssues("return courseKitMetadata({ definition, locale });"),
    [],
  );
  assert.deepEqual(
    courseKitRouteContractIssues("return seoFor({ locale, page });"),
    ["route-course-kit-metadata-call"],
  );
  assert.deepEqual(
    courseKitRouteContractIssues("import { courseKitMetadata } from './shared';"),
    ["route-course-kit-metadata-call"],
  );
  assert.deepEqual(
    courseKitRouteContractIssues("return courseKitMetadata({ definition, locale });", ["metadata-canonical-content"]),
    ["metadata-canonical-content"],
  );
});

test("the static route allowlist accepts Next's internal not-found page only", () => {
  assert.equal(isAllowedFrameworkExportRoute("/404.html"), true);
  assert.equal(isAllowedFrameworkExportRoute("/404/"), true);
  assert.equal(isAllowedFrameworkExportRoute("/_not-found/"), true);
  assert.equal(isAllowedFrameworkExportRoute("/_not-found/extra/"), false);
  assert.equal(isAllowedFrameworkExportRoute("/unregistered-course/"), false);
});

test("catalog JSON-LD resolves each embedded course language from its own target contract", () => {
  const courses = new Map([
    ["make-money-with-codex", {
      translatedLocales: ["en"],
      contentLocaleMode: "fixed-default",
      canonicalLocaleMode: "content-locale",
    }],
    ["software-engineering", {
      translatedLocales: ["en", "es"],
      contentLocaleMode: "fixed-default",
      canonicalLocaleMode: "route-locale",
    }],
  ]);
  const value = {
    "@type": "ItemList",
    itemListElement: [
      { item: { "@type": "Course", url: "https://aicourse.top/es/handbook/", inLanguage: "es" } },
      { item: { "@type": "Course", url: "https://aicourse.top/en/make-money-with-codex/", inLanguage: "en" } },
      { item: { "@type": "Course", url: "https://aicourse.top/es/software-engineering/", inLanguage: "en" } },
    ],
  };
  assert.deepEqual(jsonLdLanguageIssues(value, {
    pageRoute: "/es/courses/",
    pageContentLocale: "es",
    courseMap: courses,
    defaultLocale: "en",
    site: "https://aicourse.top",
    siteLocales: ["en", "es"],
    knownRoutes: new Set([
      "/es/handbook/",
      "/en/make-money-with-codex/",
      "/es/software-engineering/",
    ]),
  }), []);
});

test("catalog JSON-LD remains fail closed for wrong language, missing URL and unknown targets", () => {
  const courses = new Map([
    ["software-engineering", {
      translatedLocales: ["en", "es"],
      contentLocaleMode: "fixed-default",
      canonicalLocaleMode: "route-locale",
    }],
  ]);
  const issues = jsonLdLanguageIssues({
    "@type": "ItemList",
    itemListElement: [
      { item: { "@type": "Course", url: "https://aicourse.top/es/software-engineering/", inLanguage: "es" } },
      { item: { "@type": "Course", inLanguage: "en" } },
      { item: { "@type": "Course", url: "https://aicourse.top/es/not-a-course/", inLanguage: "es" } },
      { item: { "@type": "Course", url: "https://aicourse.top/es/software-engineering/" } },
    ],
  }, {
    pageRoute: "/es/courses/",
    pageContentLocale: "es",
    courseMap: courses,
    defaultLocale: "en",
    site: "https://aicourse.top",
    siteLocales: ["en", "es"],
    knownRoutes: new Set(["/es/software-engineering/"]),
  });
  assert.deepEqual(issues.map((issue) => issue.reason), [
    "language-mismatch",
    "target-url-missing",
    "target-route-unknown",
    "language-missing",
  ]);
  assert.equal(issues[0]?.expected, "en");
  assert.equal(issues[0]?.observed, "es");
});

test("non-catalog JSON-LD still requires one page content language recursively", () => {
  const issues = jsonLdLanguageIssues({
    "@type": "Course",
    inLanguage: "en",
    hasPart: [{ "@type": "LearningResource", inLanguage: "fr" }],
  }, {
    pageRoute: "/en/course/",
    pageContentLocale: "en",
    courseMap: new Map(),
    defaultLocale: "en",
    site: "https://aicourse.top",
    siteLocales: ["en", "fr"],
    knownRoutes: new Set(["/en/course/"]),
  });
  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.reason, "language-mismatch");
  assert.equal(issues[0]?.expected, "en");
  assert.equal(issues[0]?.observed, "fr");
});
