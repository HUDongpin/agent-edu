import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  SOFTWARE_ENGINEERING_CAPSTONE,
  SOFTWARE_ENGINEERING_COURSE_MANIFEST,
  SOFTWARE_ENGINEERING_COVERAGE,
  SOFTWARE_ENGINEERING_FINAL_ASSESSMENT,
  SOFTWARE_ENGINEERING_LESSONS,
  SOFTWARE_ENGINEERING_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_LOCALES,
  SOFTWARE_ENGINEERING_MEDIA,
  SOFTWARE_ENGINEERING_MEDIA_BY_ID,
  SOFTWARE_ENGINEERING_MEDIA_IDS,
  SOFTWARE_ENGINEERING_QUESTION_BANK,
  SOFTWARE_ENGINEERING_SOURCES,
  SOFTWARE_ENGINEERING_UNIT_IDS,
  type SoftwareEngineeringLocale,
  type SoftwareEngineeringLocaleCopy,
  type SoftwareEngineeringMediaRecord,
  type SoftwareEngineeringQuestionId,
} from "../lib/software-engineering";

const DASHBOARD = "/en/software-engineering/";

const localeCopy = Object.fromEntries(
  SOFTWARE_ENGINEERING_LOCALES.map((locale) => [
    locale,
    JSON.parse(
      readFileSync(
        new URL(`../messages/software-engineering/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ) as SoftwareEngineeringLocaleCopy,
  ]),
) as Record<SoftwareEngineeringLocale, SoftwareEngineeringLocaleCopy>;

const english = localeCopy.en;
const correctIndex = new Map<SoftwareEngineeringQuestionId, number>(
  SOFTWARE_ENGINEERING_QUESTION_BANK.map((question) => [question.id, question.correctIndex]),
);

type JsonLdNode = Record<string, unknown>;

async function readJsonLdNodes(page: Page): Promise<JsonLdNode[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.flatMap((text) => {
    const parsed = JSON.parse(text) as JsonLdNode;
    const graph = parsed["@graph"];
    return Array.isArray(graph) ? graph as JsonLdNode[] : [parsed];
  });
}

async function finishAssessment(page: Page, correctAnswers: number) {
  const ids: string[] = [];
  const units: string[] = [];

  for (let index = 0; index < SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.questionCount; index += 1) {
    const form = page
      .getByTestId("software-engineering-final-assessment")
      .locator("form[data-question-id]");
    await expect(form).toBeVisible();

    const id = await form.getAttribute("data-question-id");
    const unit = await form.getAttribute("data-unit-id");
    expect(id).toBeTruthy();
    expect(unit).toBeTruthy();
    ids.push(id!);
    units.push(unit!);

    const options = form.locator('input[type="radio"]');
    await expect(options).toHaveCount(4);
    const correct = correctIndex.get(id as SoftwareEngineeringQuestionId);
    expect(correct).toBeDefined();
    const selected = index < correctAnswers ? correct! : (correct! + 1) % 4;

    await options.nth(selected).check();
    await form.getByRole("button", { name: english.ui.checkAnswer }).click();

    const feedback = form.getByRole("status");
    await expect(feedback).toBeFocused();
    await expect(feedback.locator('a[href^="https://"]')).not.toHaveCount(0);
    await feedback.getByRole("button", {
      name: index === SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.questionCount - 1
        ? english.ui.finishAssessment
        : english.ui.nextQuestion,
    }).click();
  }

  return { ids, units };
}

function unitFrequency(units: readonly string[]) {
  return Object.fromEntries(
    SOFTWARE_ENGINEERING_UNIT_IDS.map((unit) => [
      unit,
      units.filter((candidate) => candidate === unit).length,
    ]),
  );
}

test.describe("Course 8 contract and static curriculum", () => {
  test("typed release contract is complete, balanced, and source-grounded", () => {
    expect(SOFTWARE_ENGINEERING_COURSE_MANIFEST.sequence).toBe(8);
    expect(SOFTWARE_ENGINEERING_COURSE_MANIFEST.contentLocale).toBe("en");
    expect(SOFTWARE_ENGINEERING_COURSE_MANIFEST.units).toHaveLength(5);
    expect(SOFTWARE_ENGINEERING_LESSONS).toHaveLength(18);
    expect(SOFTWARE_ENGINEERING_LESSONS.map((lesson) => lesson.slug))
      .toEqual(SOFTWARE_ENGINEERING_LESSON_SLUGS);
    expect(SOFTWARE_ENGINEERING_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0))
      .toBe(908);

    expect(SOFTWARE_ENGINEERING_COVERAGE).toHaveLength(18);
    expect(new Set(SOFTWARE_ENGINEERING_COVERAGE.map((entry) => entry.area)).size).toBe(18);
    expect(SOFTWARE_ENGINEERING_COVERAGE.every((entry) => (
      entry.lessonSlugs.length > 0 && entry.requiredConcepts.length > 0
    ))).toBe(true);

    expect(SOFTWARE_ENGINEERING_QUESTION_BANK).toHaveLength(25);
    expect(new Set(SOFTWARE_ENGINEERING_QUESTION_BANK.map((question) => question.id)).size).toBe(25);
    for (const unitId of SOFTWARE_ENGINEERING_UNIT_IDS) {
      expect(SOFTWARE_ENGINEERING_QUESTION_BANK.filter((question) => question.unitId === unitId))
        .toHaveLength(5);
    }
    expect(SOFTWARE_ENGINEERING_FINAL_ASSESSMENT).toMatchObject({
      bankSize: 25,
      questionCount: 15,
      questionsPerUnit: 3,
      passingCorrectAnswers: 12,
      selectionPolicy: "stratified-random",
    });

    expect(SOFTWARE_ENGINEERING_CAPSTONE.artifacts).toHaveLength(8);
    expect(SOFTWARE_ENGINEERING_CAPSTONE.releaseGates).toHaveLength(5);
    expect(SOFTWARE_ENGINEERING_CAPSTONE.rubric.reduce((sum, row) => sum + row.weight, 0))
      .toBe(100);
    expect(SOFTWARE_ENGINEERING_CAPSTONE.passingScore).toBe(80);
    expect(SOFTWARE_ENGINEERING_CAPSTONE.releaseDecisions)
      .toEqual(["release", "release-with-conditions", "do-not-release"]);

    const sourceIds = new Set(SOFTWARE_ENGINEERING_SOURCES.map((source) => source.id));
    for (const keySource of [
      "openai-academy-codex-builders",
      "openai-academy-codex-bootcamp",
      "anthropic-academy-code-tutorials",
      "anthropic-code-best-practices",
      "swebok-v4",
    ]) {
      expect(sourceIds, keySource).toContain(keySource);
    }
    for (const lesson of SOFTWARE_ENGINEERING_LESSONS) {
      expect(lesson.sections, lesson.slug).toHaveLength(3);
      expect(lesson.checkpoint.options, lesson.slug).toHaveLength(4);
      expect(lesson.sourceIds.every((id) => sourceIds.has(id)), lesson.slug).toBe(true);
    }
  });

  test("dashboard exposes all eighteen lessons, coverage, assessment, capstone, and local hero", async ({ page, request }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);

    const dashboard = page.getByTestId("software-engineering-course-dashboard");
    await expect(dashboard).toBeVisible();
    await expect(page).toHaveTitle(/Software Engineering with Agentic AI/);
    await expect(dashboard.getByRole("heading", {
      level: 1,
      name: english.meta.title,
    })).toBeVisible();
    await expect(dashboard.getByText("Course 8 · Evidence-first engineering", { exact: true }))
      .toBeVisible();

    const lessonLinks = dashboard.locator(
      'section[aria-labelledby="software-engineering-curriculum-title"] ol > li > a',
    );
    await expect(lessonLinks).toHaveCount(18);
    expect(await lessonLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
      .toEqual(SOFTWARE_ENGINEERING_LESSON_SLUGS.map(
        (slug) => `/en/software-engineering/${slug}/`,
      ));
    await expect(dashboard.locator('section[aria-labelledby="agentic-lifecycle-title"] li'))
      .toHaveCount(10);
    await expect(dashboard.locator(
      'section[aria-labelledby="software-engineering-coverage-title"] article',
    )).toHaveCount(18);
    const progressBar = dashboard.getByRole("progressbar", { name: english.ui.progress });
    await expect(progressBar).toHaveAttribute("max", "20");
    await expect(progressBar).toHaveAttribute("value", "0");
    await expect(page.getByTestId("software-engineering-final-assessment")).toBeVisible();
    await expect(page.getByTestId("software-engineering-capstone")).toBeVisible();

    const hero = dashboard.locator('figure[data-media-id="codex-plan-ui"]');
    await expect(hero).toBeVisible();
    await expect(hero.locator("img")).toHaveAttribute(
      "src",
      SOFTWARE_ENGINEERING_MEDIA_BY_ID["codex-plan-ui"].src,
    );
    await expect(hero.locator("details p")).toHaveCount(
      SOFTWARE_ENGINEERING_MEDIA_BY_ID["codex-plan-ui"].transcript.length,
    );
    await expect(dashboard.locator('img[src^="http"], source[srcset^="http"]')).toHaveCount(0);

    for (const path of [
      SOFTWARE_ENGINEERING_CAPSTONE.briefHref,
      "/courses/software-engineering/NOTICE.md",
    ]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });

  for (const lesson of SOFTWARE_ENGINEERING_LESSONS) {
    test(`English lesson ${lesson.slug} renders its complete evidence contract`, async ({ page }) => {
      const response = await page.goto(`/en/software-engineering/${lesson.slug}/`);
      expect(response?.status()).toBe(200);

      const view = page.getByTestId(`software-engineering-lesson-${lesson.slug}`);
      await expect(view).toBeVisible();
      await expect(view.getByRole("heading", { level: 1, name: lesson.title })).toBeVisible();
      await expect(view.locator('section[aria-labelledby^="lesson-section-"]')).toHaveCount(3);
      await expect(view.locator('section[aria-labelledby="lesson-objective-title"]')).toBeVisible();
      await expect(view.locator('section[aria-labelledby="lesson-concepts-title"]')).toBeVisible();
      await expect(view.getByRole("heading", { level: 2, name: lesson.practice.title })).toBeVisible();

      const checkpoint = view.locator(
        `section[aria-labelledby="checkpoint-${lesson.slug}-title"]`,
      );
      await expect(checkpoint.locator('input[type="radio"]')).toHaveCount(4);
      await expect(view.locator(
        'section[aria-labelledby="software-engineering-sources-title"] > ol > li',
      )).toHaveCount(lesson.sourceIds.length);

      const figures = view.locator("figure[data-media-id]");
      await expect(figures).toHaveCount(lesson.mediaIds.length);
      for (const mediaId of lesson.mediaIds) {
        const record = SOFTWARE_ENGINEERING_MEDIA_BY_ID[mediaId];
        const figure = view.locator(`figure[data-media-id="${mediaId}"]`);
        await expect(figure).toHaveCount(1);
        await expect(figure.getByRole("link", {
          name: `${english.ui.figureSource}: ${record.title}`,
        })).toHaveAttribute("href", record.immutableSourceUrl ?? record.sourceUrl);
        await expect(figure.locator("img")).toHaveAttribute("src", record.src);
        await expect(figure.locator("source")).toHaveAttribute("srcset", record.webpSrc);
        await expect(figure.locator("time")).toHaveAttribute("datetime", record.observedOn);
        await expect(figure.locator("figcaption")).toContainText(record.licence);
        await expect(figure.locator("details p")).toHaveCount(record.transcript.length);
      }
      await expect(view.locator('img[src^="http"], source[srcset^="http"]')).toHaveCount(0);

      if (lesson.slug === "agentic-engineering-system") {
        const checkpoint = view.locator(
          'section[aria-labelledby="checkpoint-agentic-engineering-system-title"]',
        );
        const wrongIndex = (lesson.checkpoint.correctIndex + 1) % lesson.checkpoint.options.length;
        await checkpoint.locator('input[type="radio"]').nth(wrongIndex).check();
        await checkpoint.getByRole("button", { name: english.ui.checkAnswer }).click();
        await expect(checkpoint.getByRole("status")).toBeFocused();
        await checkpoint.getByRole("button", { name: english.ui.retryAssessment }).click();
        await expect(checkpoint.locator('input[type="radio"]').first()).toBeFocused();
      }
    });
  }

  test("unknown lesson is not statically materialized", async ({ page }) => {
    const response = await page.goto("/en/software-engineering/not-a-lesson/");
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("software-engineering-course-dashboard")).toHaveCount(0);
  });
});

test.describe("authentic media and immutable provenance", () => {
  test("all declared rights-cleared figures are local, hash-exact, and provenance-complete", async ({ request }) => {
    expect(SOFTWARE_ENGINEERING_MEDIA).toHaveLength(SOFTWARE_ENGINEERING_MEDIA_IDS.length);
    expect(SOFTWARE_ENGINEERING_MEDIA.map((figure) => figure.id))
      .toEqual(SOFTWARE_ENGINEERING_MEDIA_IDS);
    expect(new Set(SOFTWARE_ENGINEERING_MEDIA.map((figure) => figure.id)).size)
      .toBe(SOFTWARE_ENGINEERING_MEDIA_IDS.length);
    expect(SOFTWARE_ENGINEERING_MEDIA.some((figure) => figure.product === "OpenAI Codex")).toBe(true);
    const claudeFigures = SOFTWARE_ENGINEERING_MEDIA.filter((figure) => figure.product === "Claude");
    expect(claudeFigures).toHaveLength(2);
    expect(claudeFigures.map((figure) => figure.id)).toEqual([
      "claude-cowork-ui",
      "claude-artifact-workspace-ui",
    ]);
    expect(claudeFigures.every((figure) => figure.provenance === "course-authored-capture"))
      .toBe(true);
    expect(claudeFigures.every((figure) => figure.alt.startsWith("Real Claude Desktop")))
      .toBe(true);

    for (const figure of SOFTWARE_ENGINEERING_MEDIA as readonly SoftwareEngineeringMediaRecord[]) {
      expect(figure.privacyReviewed, figure.id).toBe(true);
      expect(figure.sha256, figure.id).toMatch(/^[a-f0-9]{64}$/);
      expect(figure.webpSha256, figure.id).toMatch(/^[a-f0-9]{64}$/);
      expect(figure.src, figure.id).toMatch(/^\/courses\//);
      expect(figure.webpSrc, figure.id).toMatch(/^\/courses\//);
      expect(figure.width, figure.id).toBeGreaterThan(0);
      expect(figure.height, figure.id).toBeGreaterThan(0);
      expect(figure.webpWidth, figure.id).toBeGreaterThan(0);
      expect(figure.webpHeight, figure.id).toBeGreaterThan(0);
      expect(figure.transcript.length, figure.id).toBeGreaterThanOrEqual(3);
      expect(figure.sourceUrl, figure.id).toMatch(/^https:\/\//);
      expect(figure.licenceUrl, figure.id).toMatch(/^https:\/\//);

      if (figure.provenance === "licensed-repository") {
        expect(figure.sourceCommit, figure.id).toMatch(/^[a-f0-9]{40}$/);
        expect(figure.immutableSourceUrl, figure.id).toContain(figure.sourceCommit!);
        expect(["Apache-2.0", "MIT", "CC-BY-4.0"]).toContain(figure.licence);
      } else {
        expect(figure.licence, figure.id).toBe("Editorial capture");
        expect(figure.sourceCommit, figure.id).toBeUndefined();
        expect(figure.immutableSourceUrl, figure.id).toBeUndefined();
        expect(new URL(figure.sourceUrl).hostname, figure.id).toBe("aicourse.top");
      }

      for (const [path, expectedHash, expectedType] of [
        [figure.src, figure.sha256, "image/png"],
        [figure.webpSrc, figure.webpSha256, "image/webp"],
      ] as const) {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        expect(response.headers()["content-type"], path).toContain(expectedType);
        expect(
          createHash("sha256").update(await response.body()).digest("hex"),
          path,
        ).toBe(expectedHash);
      }
    }
  });
});

test.describe("localization, metadata, and discovery", () => {
  test("all locale dashboards materialize with an honest English-body boundary", async ({ page }) => {
    test.setTimeout(90_000);
    for (const locale of SOFTWARE_ENGINEERING_LOCALES) {
      const response = await page.goto(`/${locale}/software-engineering/`);
      expect(response?.status(), locale).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);

      const dashboard = page.getByTestId("software-engineering-course-dashboard");
      const heading = dashboard.getByRole("heading", {
        level: 1,
        name: localeCopy[locale].meta.title,
      });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveAttribute("lang", locale);
      await expect(heading).toHaveAttribute("dir", "auto");
      await expect(heading.locator("xpath=ancestor::header[1]"))
        .toHaveAttribute("lang", "en");
      await expect(heading.locator("xpath=ancestor::header[1]"))
        .toHaveAttribute("dir", "ltr");
      await expect(dashboard.locator(
        'section[aria-labelledby="software-engineering-curriculum-title"] ol > li span[lang="en"][dir="ltr"]',
      )).toHaveCount(18);
      if (locale === "en") {
        await expect(dashboard.getByText(localeCopy[locale].meta.languageNotice, { exact: true }))
          .toHaveCount(0);
      } else {
        await expect(dashboard.getByText(localeCopy[locale].meta.languageNotice, { exact: true }))
          .toBeVisible();
      }
    }
  });

  test("Arabic shell remains RTL while localized headings and English lesson body are explicit", async ({ page }) => {
    await page.goto("/ar/software-engineering/agent-evaluation/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    const lesson = page.getByTestId("software-engineering-lesson-agent-evaluation");
    await expect(lesson.getByText(localeCopy.ar.meta.languageNotice, { exact: true })).toBeVisible();
    const heading = lesson.getByRole("heading", {
      level: 1,
      name: localeCopy.ar.lessons["agent-evaluation"].title,
    });
    await expect(heading).toHaveAttribute("lang", "ar");
    await expect(heading).toHaveAttribute("dir", "auto");
    await expect(lesson.locator('section[aria-labelledby^="lesson-section-"][lang="en"][dir="ltr"]'))
      .toHaveCount(3);
    const englishSection = lesson.locator(
      'section[aria-labelledby^="lesson-section-"][lang="en"][dir="ltr"]',
    ).first();
    expect(await englishSection.evaluate((element) => getComputedStyle(element).direction))
      .toBe("ltr");

    const figure = lesson.locator("figure[data-media-id]").first();
    await expect(figure).toHaveAttribute("lang", "ar");
    await expect(figure).toHaveAttribute("dir", "auto");
    const localizedFigureChrome = figure.getByText(localeCopy.ar.ui.authenticUi, {
      exact: false,
    }).first();
    expect(await localizedFigureChrome.evaluate((element) => ({
      inheritedLanguage: element.closest("[lang]")?.getAttribute("lang"),
      direction: getComputedStyle(element).direction,
    }))).toEqual({ inheritedLanguage: "ar", direction: "rtl" });
    await expect(figure.locator("figcaption strong").first()).toHaveAttribute("lang", "en");
    await expect(figure.locator("figcaption strong").first()).toHaveAttribute("dir", "ltr");

    await page.goto("/ar/software-engineering/capstone-safe-change/");
    const capstone = page.getByTestId("software-engineering-capstone");
    const artifactLegend = capstone.locator("fieldset").first().locator("legend");
    await expect(artifactLegend).toHaveAttribute("lang", "ar");
    await expect(artifactLegend).toHaveAttribute("dir", "auto");
    await expect(capstone.locator("#capstone-rubric-title")).toHaveAttribute("lang", "ar");
    await expect(capstone.locator("#capstone-rubric-title")).toHaveAttribute("dir", "auto");
    await expect(capstone.locator('option[value=""]')).toHaveAttribute("lang", "en");
    await expect(capstone.locator('option[value="release"]')).toHaveAttribute("lang", "ar");
  });

  test("dashboard and lesson metadata are canonical, reciprocal, and honestly English", async ({ page }) => {
    await page.goto(DASHBOARD);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/software-engineering/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang]'))
      .toHaveCount(SOFTWARE_ENGINEERING_LOCALES.length + 1);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/software-engineering/",
    );

    let nodes = await readJsonLdNodes(page);
    const course = nodes.find((node) => node["@type"] === "Course");
    expect(course).toBeTruthy();
    expect(course?.courseCode).toBe("8");
    expect(course?.inLanguage).toBe("en");
    expect(course?.hasPart).toHaveLength(18);
    expect(course?.teaches).toHaveLength(18);
    expect(nodes.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);

    await page.goto("/fr/software-engineering/agent-evaluation/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/fr/software-engineering/agent-evaluation/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang]'))
      .toHaveCount(SOFTWARE_ENGINEERING_LOCALES.length + 1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/software-engineering/agent-evaluation/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/software-engineering/agent-evaluation/",
    );

    nodes = await readJsonLdNodes(page);
    const lesson = nodes.find((node) => node["@type"] === "LearningResource");
    expect(lesson).toBeTruthy();
    expect(lesson?.inLanguage).toBe("en");
    expect(lesson?.educationalAlignment).toBeInstanceOf(Array);
    expect(lesson?.educationalAlignment).not.toHaveLength(0);
    expect((lesson?.isPartOf as JsonLdNode | undefined)?.courseCode).toBe("8");
    expect(nodes.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
  });

  test("catalog places Course 8 after Course 7 and filters it as intermediate-to-advanced", async ({ page }) => {
    await page.goto("/en/courses/");
    const course8 = page.locator("#software-engineering-with-agentic-ai");
    await expect(course8).toHaveCount(1);
    await expect(course8.locator('[data-course-cover="software-engineering"]')).toHaveCount(1);
    await expect(course8.getByText("Course 8", { exact: true })).toBeVisible();
    await expect(course8.getByRole("heading", { level: 2 })).toHaveText(english.meta.title);
    await expect(course8.getByRole("link").first()).toHaveAttribute(
      "href",
      "/en/software-engineering/",
    );
    expect(await course8.evaluate((node) => node.previousElementSibling?.id))
      .toBe("how-to-write-prompts");

    const level = page.getByLabel("Level");
    await level.selectOption("beginner");
    await expect(page.locator("#software-engineering-with-agentic-ai")).toHaveCount(0);
    await level.selectOption("intermediate");
    await expect(page.locator("#software-engineering-with-agentic-ai")).toHaveCount(1);
    await level.selectOption("advanced");
    await expect(page.locator("#software-engineering-with-agentic-ai")).toHaveCount(1);

    await level.selectOption("__all__");
    await page.getByRole("searchbox", { name: "Search" }).fill(english.meta.title);
    await expect(page.locator("#catalog-course-results > li")).toHaveCount(1);
    await expect(page.locator("#software-engineering-with-agentic-ai")).toHaveCount(1);
  });

  test("sitemap contains all 171 Course 8 routes exactly once", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const courseLocations = locations.filter((location) => {
      const pathname = new URL(location).pathname;
      return SOFTWARE_ENGINEERING_LOCALES.some((locale) => (
        pathname.startsWith(`/${locale}/software-engineering/`)
      ));
    });
    const expectedCount = SOFTWARE_ENGINEERING_LOCALES.length
      * (SOFTWARE_ENGINEERING_LESSON_SLUGS.length + 1);
    expect(courseLocations).toHaveLength(expectedCount);
    expect(new Set(courseLocations).size).toBe(expectedCount);

    for (const locale of SOFTWARE_ENGINEERING_LOCALES) {
      expect(courseLocations).toContain(`https://aicourse.top/${locale}/software-engineering/`);
      for (const slug of SOFTWARE_ENGINEERING_LESSON_SLUGS) {
        expect(courseLocations).toContain(
          `https://aicourse.top/${locale}/software-engineering/${slug}/`,
        );
      }
    }
  });
});

test.describe("private progress, assessment, and capstone", () => {
  test("lesson completion persists and reset ignores stale quiz and legacy capstone flags", async ({ page }) => {
    await page.addInitScript(() => {
      if (!window.localStorage.getItem("ae.progress")) {
        window.localStorage.setItem("ae.progress", JSON.stringify({
          "codex.lesson.meet-codex": true,
          "softwareEngineering.quizBest": 15,
          "softwareEngineering.quizPassed": true,
          "softwareEngineering.quizVersion": "stale",
          "softwareEngineering.capstone.v1": true,
          unrelated: "keep",
        }));
      }
    });

    await page.goto("/en/software-engineering/agentic-engineering-system/");
    await page.getByRole("button", { name: english.ui.markComplete }).click();
    await expect(page.getByRole("button", { name: english.ui.completed }))
      .toBeDisabled();
    await page.reload();
    await expect(page.getByRole("button", { name: english.ui.completed }))
      .toBeDisabled();

    await page.goto(DASHBOARD);
    const progress = page.locator(
      'section[aria-labelledby="software-engineering-progress-title"] progress',
    );
    await expect(progress).toHaveAttribute("value", "1");
    await expect(progress).toHaveAttribute("max", "20");

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.accept();
    });
    await page.getByRole("button", { name: english.ui.resetProgress }).click();
    await expect(page.getByText(english.ui.resetDone, { exact: true })).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored).toEqual({
      "codex.lesson.meet-codex": true,
      unrelated: "keep",
    });
  });

  test("storage denial leaves lesson content and ephemeral completion usable", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("Storage denied", "SecurityError");
        },
      });
    });
    const page = await context.newPage();
    await page.goto("/en/software-engineering/repository-context/");
    await expect(page.getByText(english.ui.storageUnavailable, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", {
      level: 1,
      name: english.lessons["repository-context"].title,
    })).toBeVisible();
    await expect(page.locator('figure[data-media-id="claude-cowork-ui"] img')).toBeVisible();
    await page.getByRole("button", { name: english.ui.markComplete }).click();
    await expect(page.getByRole("button", { name: english.ui.completed }))
      .toBeDisabled();
    await expect(page.getByText(english.ui.storageUnavailable, { exact: true })).toBeVisible();
    await context.close();
  });

  test("eleven of fifteen fails and the exact twelve-of-fifteen boundary passes", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: english.ui.beginAssessment }).click();

    const firstAttempt = await finishAssessment(page, 11);
    expect(new Set(firstAttempt.ids).size).toBe(15);
    expect(unitFrequency(firstAttempt.units)).toEqual({
      frame: 3,
      shape: 3,
      verify: 3,
      deliver: 3,
      govern: 3,
    });
    const assessment = page.getByTestId("software-engineering-final-assessment");
    await expect(assessment.getByRole("status")).toContainText("11 / 15");
    await expect(assessment.getByText(english.ui.quizNeedsReview, { exact: true })).toBeVisible();

    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored[SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.bestScoreStorageKey]).toBe(11);
    expect(stored[SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.passedStorageKey]).toBe(false);
    expect(stored[SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.versionStorageKey])
      .toBe(SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.bankVersion);

    await assessment.getByRole("button", { name: english.ui.retryAssessment }).click();
    const secondAttempt = await finishAssessment(page, 12);
    expect(new Set(secondAttempt.ids).size).toBe(15);
    expect([...secondAttempt.ids].sort()).not.toEqual([...firstAttempt.ids].sort());
    expect(unitFrequency(secondAttempt.units)).toEqual({
      frame: 3,
      shape: 3,
      verify: 3,
      deliver: 3,
      govern: 3,
    });
    await expect(assessment.getByRole("status")).toContainText("12 / 15");
    await expect(assessment.getByText(english.ui.quizPassed, { exact: true })).toBeVisible();

    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored[SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.bestScoreStorageKey]).toBe(12);
    expect(stored[SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.passedStorageKey]).toBe(true);
    expect(stored[SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.versionStorageKey])
      .toBe(SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.bankVersion);

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.accept();
    });
    await page.getByRole("button", { name: english.ui.resetProgress }).click();
    await expect(assessment.getByRole("button", { name: english.ui.beginAssessment }))
      .toBeVisible();
    await expect(assessment.getByRole("status")).toHaveCount(0);
  });

  test("capstone rejects 79, accepts a supported do-not-release at 80, and preserves the record", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(() => {
      localStorage.setItem("ae.progress", JSON.stringify({
        "softwareEngineering.lesson.agentic-engineering-system": true,
      }));
    });
    await page.reload();
    const capstone = page.getByTestId("software-engineering-capstone");
    const validationBoundary = capstone.locator('aside[aria-label="Validation boundary"]');
    await expect(validationBoundary).toHaveAttribute("lang", "en");
    await expect(validationBoundary).toHaveAttribute("dir", "ltr");
    await expect(validationBoundary.getByText(
      SOFTWARE_ENGINEERING_CAPSTONE.validationBoundary,
      { exact: true },
    )).toBeVisible();
    await expect(capstone.getByRole("link", { name: english.ui.downloadBrief })).toHaveAttribute(
      "href",
      SOFTWARE_ENGINEERING_CAPSTONE.briefHref,
    );

    const submit = capstone.getByRole("button", { name: english.ui.completeCapstone });
    await submit.click();
    const validationFeedback = capstone.locator("#capstone-validation-feedback");
    await expect(validationFeedback).toBeFocused();
    await expect(validationFeedback.getByText(english.ui.capstoneIncomplete, { exact: true }))
      .toBeVisible();
    await expect(validationFeedback.locator("li")).toHaveCount(5);

    const artifacts = capstone
      .getByRole("group", { name: english.ui.capstoneArtifacts })
      .locator('input[type="checkbox"]');
    const gates = capstone
      .getByRole("group", { name: "Release-gate review" })
      .locator('input[type="checkbox"]');
    const score = capstone.getByRole("spinbutton", { name: /Self-assessed rubric score/ });
    const decision = capstone.getByRole("combobox", { name: "Recorded release decision" });
    const attestation = capstone.locator(
      'section[aria-labelledby="capstone-safety-title"] input[type="checkbox"]',
    );

    await expect(artifacts).toHaveCount(8);
    await expect(gates).toHaveCount(5);
    await expect(attestation).toHaveCount(1);
    await expect(artifacts.first().locator("xpath=ancestor::fieldset[1]"))
      .toHaveAttribute("aria-invalid", "true");
    await expect(artifacts.first().locator("xpath=ancestor::fieldset[1]"))
      .toHaveAttribute("aria-describedby", "capstone-validation-feedback");
    await expect(gates.first().locator("xpath=ancestor::fieldset[1]"))
      .toHaveAttribute("aria-invalid", "true");
    await expect(gates.first().locator("xpath=ancestor::fieldset[1]"))
      .toHaveAttribute("aria-describedby", "capstone-validation-feedback");
    await expect(score).toHaveAttribute("aria-invalid", "true");
    await expect(score).toHaveAttribute("aria-describedby", "capstone-validation-feedback");
    await expect(decision).toHaveAttribute("aria-invalid", "true");
    await expect(decision).toHaveAttribute("aria-describedby", "capstone-validation-feedback");
    await expect(attestation).toHaveAttribute("aria-invalid", "true");
    await expect(attestation).toHaveAttribute("aria-describedby", "capstone-validation-feedback");

    await artifacts.first().check();
    await score.fill("79");
    await decision.selectOption("do-not-release");
    await attestation.check();
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.accept();
    });
    await page.getByRole("button", { name: english.ui.resetProgress }).click();
    await expect(artifacts.first()).not.toBeChecked();
    await expect(score).toHaveValue("0");
    await expect(decision).toHaveValue("");
    await expect(attestation).not.toBeChecked();

    for (let index = 0; index < 8; index += 1) await artifacts.nth(index).check();
    for (let index = 0; index < 5; index += 1) await gates.nth(index).check();
    await attestation.check();
    await decision.selectOption("do-not-release");
    await score.fill("79");
    await submit.click();
    await expect(capstone.getByText(english.ui.capstoneIncomplete, { exact: true })).toBeVisible();

    await score.fill("80");
    await submit.click();
    await expect(capstone.getByText(english.ui.capstoneComplete, { exact: true })).toBeVisible();
    await expect(page.locator(
      'section[aria-labelledby="software-engineering-progress-title"] progress',
    )).toHaveAttribute("value", "1");

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored[SOFTWARE_ENGINEERING_CAPSTONE.progressKey]).toEqual({
      schemaVersion: SOFTWARE_ENGINEERING_CAPSTONE.schemaVersion,
      completed: true,
      artifactIds: [...SOFTWARE_ENGINEERING_CAPSTONE.artifactIds],
      reviewedGateIds: SOFTWARE_ENGINEERING_CAPSTONE.releaseGates.map((gate) => gate.id),
      score: 80,
      decision: "do-not-release",
      safetyBoundaryAttested: true,
    });

    await page.reload();
    const reloaded = page.getByTestId("software-engineering-capstone");
    await expect(reloaded.getByText(english.ui.capstoneComplete, { exact: true })).toBeVisible();
    await expect(reloaded.getByRole("spinbutton", { name: /Self-assessed rubric score/ }))
      .toHaveValue("80");
    await expect(reloaded.getByRole("spinbutton", { name: /Self-assessed rubric score/ }))
      .toBeDisabled();
    await expect(reloaded.getByRole("combobox", { name: "Recorded release decision" }))
      .toHaveValue("do-not-release");
    await expect(reloaded.getByRole("combobox", { name: "Recorded release decision" }))
      .toBeDisabled();
    const reloadedArtifacts = reloaded
      .getByRole("group", { name: english.ui.capstoneArtifacts })
      .locator('input[type="checkbox"]');
    const reloadedGates = reloaded
      .getByRole("group", { name: "Release-gate review" })
      .locator('input[type="checkbox"]');
    const reloadedAttestation = reloaded.locator(
      'section[aria-labelledby="capstone-safety-title"] input[type="checkbox"]',
    );
    for (let index = 0; index < 8; index += 1) {
      await expect(reloadedArtifacts.nth(index)).toBeChecked();
    }
    for (let index = 0; index < 5; index += 1) {
      await expect(reloadedGates.nth(index)).toBeChecked();
    }
    await expect(reloadedAttestation).toBeChecked();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.accept();
    });
    await page.getByRole("button", { name: english.ui.resetProgress }).click();
    await expect(reloadedArtifacts.first()).not.toBeChecked();
    await expect(reloadedGates.first()).not.toBeChecked();
    await expect(reloaded.getByRole("spinbutton", { name: /Self-assessed rubric score/ }))
      .toHaveValue("0");
    await expect(reloaded.getByRole("combobox", { name: "Recorded release decision" }))
      .toHaveValue("");
    await expect(reloadedAttestation).not.toBeChecked();
    await expect(reloaded.getByText(english.ui.capstoneComplete, { exact: true })).toHaveCount(0);
  });
});

test.describe("no-JavaScript and responsive publication", () => {
  test("dashboard and a real Claude figure remain instructional without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto(DASHBOARD);
    const dashboard = page.getByTestId("software-engineering-course-dashboard");
    await expect(dashboard.getByRole("heading", { level: 1, name: english.meta.title }))
      .toBeVisible();
    await expect(dashboard.locator(
      'section[aria-labelledby="software-engineering-curriculum-title"] ol > li > a',
    )).toHaveCount(18);
    const hero = dashboard.locator('figure[data-media-id="codex-plan-ui"]');
    await expect(hero.locator("img")).toBeVisible();
    await expect(hero.locator("figcaption")).not.toBeEmpty();
    await expect(hero.locator("details p")).toHaveCount(
      SOFTWARE_ENGINEERING_MEDIA_BY_ID["codex-plan-ui"].transcript.length,
    );

    for (const mediaId of ["claude-cowork-ui", "claude-artifact-workspace-ui"] as const) {
      const record = SOFTWARE_ENGINEERING_MEDIA_BY_ID[mediaId];
      await page.goto(`/en/software-engineering/${record.lessonSlugs[0]}/`);
      const figure = page.locator(`figure[data-media-id="${mediaId}"]`);
      await expect(figure.locator("img")).toBeVisible();
      await expect(figure.locator("figcaption")).not.toBeEmpty();
      await expect(figure.locator("details p")).toHaveCount(record.transcript.length);
      await expect(page.locator(
        'section[aria-labelledby="software-engineering-sources-title"] > ol > li',
      )).not.toHaveCount(0);
    }
    await context.close();
  });

  test("dashboard and lesson entry motion respect reduced-motion preferences", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(DASHBOARD);
    const dashboard = page.getByTestId("software-engineering-course-dashboard");
    const heroParts = dashboard.locator("header").first().locator(":scope > div");
    await expect(heroParts).toHaveCount(2);
    for (const index of [0, 1]) {
      expect(await heroParts.nth(index).evaluate((element) => getComputedStyle(element).animationName))
        .toBe("none");
    }

    await page.goto("/en/software-engineering/agentic-engineering-system/");
    const lessonHero = page
      .getByTestId("software-engineering-lesson-agentic-engineering-system")
      .locator("header")
      .first();
    expect(await lessonHero.evaluate((element) => getComputedStyle(element).animationName))
      .toBe("none");
  });

  for (const width of [390, 768, 1440]) {
    test(`dashboard and representative LTR/RTL lessons do not overflow at ${width}px`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        DASHBOARD,
        "/en/software-engineering/security-privacy-supply-chain/",
        "/ar/software-engineering/agent-evaluation/",
      ]) {
        await page.goto(path);
        await page.evaluate(async () => { await document.fonts.ready; });
        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scrollWidth, `${path} at ${width}px`)
          .toBeLessThanOrEqual(dimensions.clientWidth + 1);
      }
    });
  }
});
