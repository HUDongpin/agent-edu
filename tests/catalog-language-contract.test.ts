import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = [
  "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
] as const;

type Locale = (typeof LOCALES)[number];

type PublicCourse = {
  readonly id: string;
  readonly state: "published" | "blocked" | "roadmap";
  readonly interfaceLocales: readonly Locale[];
  readonly reviewedContentLocales: readonly Locale[];
  readonly fallbackLocale: Locale | null;
};

const projection = JSON.parse(
  readFileSync("config/course-public-surface.json", "utf8"),
) as { readonly courses: readonly PublicCourse[] };

const catalogSource = readFileSync("components/courses/Catalog.tsx", "utf8");
const catalogStyles = readFileSync("components/courses/Catalog.module.css", "utf8");
const coursesPageSource = readFileSync("app/[locale]/courses/page.tsx", "utf8");

test("public course projection separates interface, reviewed content, and fallback languages", () => {
  assert.ok(projection.courses.length > 0);
  for (const course of projection.courses) {
    assert.ok(Array.isArray(course.interfaceLocales), `${course.id}: interfaceLocales`);
    assert.ok(Array.isArray(course.reviewedContentLocales), `${course.id}: reviewedContentLocales`);
    assert.ok(
      course.interfaceLocales.every((locale) => LOCALES.includes(locale)),
      `${course.id}: unknown interface locale`,
    );
    assert.ok(
      course.reviewedContentLocales.every((locale) => LOCALES.includes(locale)),
      `${course.id}: unknown reviewed locale`,
    );
    if (course.state === "published") {
      assert.deepEqual(
        [...course.interfaceLocales].sort(),
        [...LOCALES].sort(),
        `${course.id}: every published card has the nine-language interface`,
      );
      assert.ok(course.reviewedContentLocales.length > 0, `${course.id}: reviewed content`);
      assert.ok(course.fallbackLocale, `${course.id}: fallback locale`);
      assert.ok(
        course.reviewedContentLocales.includes(course.fallbackLocale!),
        `${course.id}: fallback must be reviewed`,
      );
    }
  }
});

test("catalog consumes the language contract before navigation", () => {
  assert.match(catalogSource, /course\.interfaceLocales\.includes/);
  assert.match(catalogSource, /surface\.reviewedContentLocales/);
  assert.match(catalogSource, /surface\.fallbackLocale/);
  assert.match(catalogSource, /data-course-content-language/);
  assert.match(catalogSource, /data-course-language-fallback/);
  assert.match(catalogSource, /hrefLang=\{course\.contentLocale/);
  assert.match(catalogSource, /<bdi/);
  assert.match(catalogSource, /dir=\{meta\.dir\}/);
  assert.match(catalogSource, /t\(actionKey\(progress\)\)/);
  assert.match(catalogSource, /progress\?\.state === "completed"/);
  assert.match(catalogSource, /progress\.percent >= 100/);
  assert.match(catalogSource, /"cat\.finishIn"/);
});

test("catalog progress adapter load failure becomes visible instead of loading forever", () => {
  assert.match(catalogSource, /import\("\.\.\/progress-adapters"\)/);
  assert.match(catalogSource, /\.catch\(\(\) => \{/);
  assert.match(catalogSource, /surface\.state === "published"/);
  assert.match(catalogSource, /state: "unavailable" as const/);
  assert.match(catalogSource, /const next = unavailablePublishedProgressMap\(\)/);
  assert.match(catalogSource, /setMap\(unavailablePublishedProgressMap\(\)\)/);
});

test("language filter accepts reviewed languages, deep-links, and preserves unrelated query state", () => {
  assert.match(catalogSource, /catalogLanguageFromQuery\(params\.get\("language"\)/);
  assert.match(catalogSource, /reviewedContentLocales\.includes\(language\)/);
  assert.match(catalogSource, /update\("language", language\)/);
  assert.match(catalogSource, /new URL\(window\.location\.href\)/);
  assert.match(catalogSource, /window\.history\.replaceState/);
  assert.match(catalogSource, /window\.addEventListener\("popstate"/);
});

test("catalog controls and actions keep touch, reflow, long-copy, and RTL safeguards", () => {
  assert.match(catalogStyles, /min-block-size:\s*44px/);
  assert.match(catalogStyles, /overflow-wrap:\s*anywhere/);
  assert.match(catalogStyles, /min-inline-size:\s*0/);
  assert.match(catalogStyles, /border-inline-start/);
  assert.match(catalogStyles, /unicode-bidi:\s*isolate/);
  assert.match(catalogStyles, /@media \(max-width:\s*620px\)/);
  assert.match(catalogStyles, /@media \(forced-colors:\s*active\)/);
});

test("Course JSON-LD advertises reviewed arrays and removes unreviewed parts", () => {
  assert.match(coursesPageSource, /partsWithReviewedLanguages/);
  assert.match(coursesPageSource, /reviewedContentLocales\.includes/);
  assert.match(coursesPageSource, /inLanguage:\s*\[\.\.\.surface\.reviewedContentLocales\]/);
  assert.match(coursesPageSource, /hasPart:\s*reviewedParts/);
  assert.doesNotMatch(
    coursesPageSource,
    /inLanguage:\s*contentLocaleForCourse\(course\.id, locale\)/,
  );
});

test("all nine interface catalogs include language, learning, and CourseShell product copy", () => {
  const requiredKeys = [
    "cat.filterLanguage",
    "cat.allLanguages",
    "cat.contentLanguage",
    "cat.fallbackNotice",
    "cat.startIn",
    "cat.resumeIn",
    "cat.finishIn",
    "cat.reviewIn",
    "learning.continue",
    "learning.inProgress",
    "learning.completed",
    "learning.suggested",
    "learning.emptySuggested",
    "learning.retryStorage",
    "learning.storageRecovered",
    "learning.storageStillUnavailable",
    "learning.backupTitle",
    "learning.export",
    "learning.import",
    "learning.importRollbackFailed",
    "courseShell.overview",
    "courseShell.contentLanguage",
    "courseShell.fallbackNotice",
    "courseShell.progressPending",
    "courseShell.start",
    "courseShell.prerequisiteAdvanced",
    "courseShell.artifactProject",
    "courseShell.syllabusSummary",
    "courseShell.localNote",
  ] as const;
  const placeholders = (value: string) => [...value.matchAll(/\{[A-Za-z]+\}/gu)]
    .map(([placeholder]) => placeholder)
    .sort();
  const english = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;

  for (const locale of LOCALES) {
    const messages = JSON.parse(
      readFileSync(`messages/${locale}.json`, "utf8"),
    ) as Record<string, string>;
    for (const key of requiredKeys) {
      assert.ok(messages[key]?.trim(), `${locale}: ${key}`);
      assert.deepEqual(
        placeholders(messages[key]),
        placeholders(english[key]),
        `${locale}: ${key} placeholders`,
      );
    }
  }
});
