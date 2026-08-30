import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";
import {
  SOFTWARE_ENGINEERING_CAPSTONE,
  SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY,
  SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY,
  SOFTWARE_ENGINEERING_COURSE_MANIFEST,
  SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS,
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
import {
  publishedSitemapUrls,
  withIsolatedRoutePage,
} from "./published-course-test-helpers";

const DASHBOARD = "/en/software-engineering/";
const CAPSTONE = "/en/software-engineering/capstone-safe-change/#capstone-checklist";

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

async function courseResetButton(page: Page) {
  const button = page.getByRole("button", { name: english.ui.resetProgress });
  if (!await button.isVisible()) {
    const management = page.getByTestId("software-engineering-progress-management");
    if (await management.count()) await management.locator("summary").click();
  }
  await expect(button).toBeVisible();
  return button;
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
    const progressBar = dashboard.locator(".course-shell-progress [role=progressbar]");
    await expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    await expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    await expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    await expect(dashboard.locator(".course-shell-action")).toHaveCount(1);
    await expect(page.getByTestId("software-engineering-final-assessment")).toBeVisible();
    await expect(dashboard.locator(
      'section[aria-labelledby="software-engineering-capstone-entry-title"] a',
    )).toHaveAttribute(
      "href",
      "/en/software-engineering/capstone-safe-change/#capstone-checklist",
    );

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
  test("only the real English dashboard materializes and localized catalogues point to it", async ({ page }) => {
    test.setTimeout(90_000);
    await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
      await expect(routePage.locator("html")).toHaveAttribute("lang", "en");
      const dashboard = routePage.getByTestId("software-engineering-course-dashboard");
      const heading = dashboard.getByRole("heading", {
        level: 1,
        name: english.meta.title,
      });
      await expect(heading).toBeVisible();
      await expect(heading.locator("xpath=ancestor::header[1]"))
        .toHaveAttribute("lang", "en");
      await expect(heading.locator("xpath=ancestor::header[1]"))
        .toHaveAttribute("dir", "ltr");
      await expect(dashboard.locator(
        'section[aria-labelledby="software-engineering-curriculum-title"] ol > li span[lang="en"][dir="ltr"]',
      )).toHaveCount(18);
    });

    for (const locale of SOFTWARE_ENGINEERING_LOCALES.filter((candidate) => candidate !== "en")) {
      for (const suffix of ["", "agent-evaluation/"]) {
        const route = `/${locale}/software-engineering/${suffix}`;
        await withIsolatedRoutePage(page, route, async (routePage) => {
          await expect(routePage.getByTestId("software-engineering-course-dashboard"))
            .toHaveCount(0);
        }, { expectedStatus: 404 });
      }
    }

    await withIsolatedRoutePage(page, "/ar/courses/", async (routePage) => {
      await expect(routePage.locator(
        'main a[href="/en/software-engineering/?fromLocale=ar"]',
      )).toBeVisible();
    });
  });

  test("language selection keeps the dashboard and late lesson on real fallback routes", async ({ page }) => {
    const cases = [
      {
        path: `${DASHBOARD}#final-assessment`,
        requestedLocale: "es",
        expectedPath: "/en/software-engineering/?fromLocale=es#final-assessment",
        contentTestId: "software-engineering-course-dashboard",
      },
      {
        path: "/en/software-engineering/capstone-safe-change/#capstone-checklist",
        requestedLocale: "ar",
        expectedPath: "/en/software-engineering/capstone-safe-change/?fromLocale=ar#capstone-checklist",
        contentTestId: "software-engineering-lesson-capstone-safe-change",
      },
    ] as const;

    for (const { path, requestedLocale, expectedPath, contentTestId } of cases) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      const origin = new URL(page.url()).origin;

      await page.getByRole("button", { name: /Language:/ }).click();
      await page.locator(`[role="menuitem"][lang="${requestedLocale}"]`).click();

      await expect(page).toHaveURL(`${origin}${expectedPath}`);
      await expect(page.getByTestId(contentTestId)).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    }
  });

  test("the Arabic catalogue remains RTL and declares the English course language", async ({ page }) => {
    await page.goto("/ar/courses/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const card = page.locator("#software-engineering-with-agentic-ai");
    await expect(card.locator('[data-course-content-language="en"]')).toContainText("English");
    await expect(card.locator('[data-course-language-fallback="true"]')).toBeVisible();
    await expect(card.locator('bdi[lang="en"][dir="ltr"]')).not.toHaveCount(0);
    await expect(card.locator('a[href="/en/software-engineering/?fromLocale=ar"]'))
      .toBeVisible();
  });

  test("dashboard and lesson metadata are canonical, reciprocal, and honestly English", async ({ page }) => {
    await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
      await expect(routePage.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://aicourse.top/en/software-engineering/",
      );
      await expect(routePage.locator('link[rel="alternate"][hreflang]'))
        .toHaveCount(2);
      await expect(routePage.locator('link[rel="alternate"][hreflang="x-default"]'))
        .toHaveAttribute("href", "https://aicourse.top/en/software-engineering/");

      const nodes = await readJsonLdNodes(routePage);
      const course = nodes.find((node) => node["@type"] === "Course");
      expect(course).toBeTruthy();
      expect(course?.courseCode).toBe("8");
      expect(course?.inLanguage).toBe("en");
      expect(course?.hasPart).toHaveLength(18);
      expect(course?.teaches).toHaveLength(18);
      expect(nodes.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
    });

    await withIsolatedRoutePage(
      page,
      "/en/software-engineering/agent-evaluation/",
      async (routePage) => {
        await expect(routePage.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          "https://aicourse.top/en/software-engineering/agent-evaluation/",
        );
        await expect(routePage.locator('link[rel="alternate"][hreflang]'))
          .toHaveCount(2);
        await expect(routePage.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
          "href",
          "https://aicourse.top/en/software-engineering/agent-evaluation/",
        );
        await expect(routePage.locator('link[rel="alternate"][hreflang="x-default"]'))
          .toHaveAttribute(
            "href",
            "https://aicourse.top/en/software-engineering/agent-evaluation/",
          );

        const nodes = await readJsonLdNodes(routePage);
        const lesson = nodes.find((node) => node["@type"] === "LearningResource");
        expect(lesson).toBeTruthy();
        expect(lesson?.inLanguage).toBe("en");
        expect(lesson?.educationalAlignment).toBeInstanceOf(Array);
        expect(lesson?.educationalAlignment).not.toHaveLength(0);
        expect((lesson?.isPartOf as JsonLdNode | undefined)?.courseCode).toBe("8");
        expect(nodes.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
      },
    );
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

  test("sitemap contains only the real English Course 8 routes", async ({ request }) => {
    const urls = await publishedSitemapUrls(request);
    const courseLocations = [...urls].filter((location) => (
      /^\/[^/]+\/software-engineering\//.test(new URL(location).pathname)
    ));
    const expectedCount = SOFTWARE_ENGINEERING_LESSON_SLUGS.length + 1;
    expect(courseLocations).toHaveLength(expectedCount);
    expect(new Set(courseLocations).size).toBe(expectedCount);

    expect(courseLocations).toContain("https://aicourse.top/en/software-engineering/");
    for (const slug of SOFTWARE_ENGINEERING_LESSON_SLUGS) {
      expect(courseLocations).toContain(
        `https://aicourse.top/en/software-engineering/${slug}/`,
      );
    }
    expect(courseLocations.every((location) => location.includes("/en/software-engineering/")))
      .toBe(true);
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
    const markComplete = page.getByRole("button", { name: english.ui.markComplete });
    await markComplete.focus();
    // Verify keyboard-focus retention across engines. WebKit intentionally does
    // not focus buttons after a pointer click on macOS, so a click-based
    // assertion would test browser chrome convention rather than our state swap.
    await markComplete.press("Enter");
    const completed = page.getByRole("button", { name: english.ui.completed });
    await expect(completed).toHaveAttribute("aria-disabled", "true");
    await expect(completed).toHaveCSS("cursor", "default");
    await expect(completed).toBeFocused();
    await page.reload();
    await expect(page.getByRole("button", { name: english.ui.completed }))
      .toHaveAttribute("aria-disabled", "true");

    await page.goto(DASHBOARD);
    const progress = page.locator(".course-shell-progress [role=progressbar]");
    await expect(progress).toHaveAttribute("aria-valuenow", "5");

    let reset = await courseResetButton(page);
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.dismiss();
    });
    await reset.focus();
    await reset.press("Enter");
    await expect(reset).toBeFocused();
    await expect(page.getByTestId("software-engineering-reset-status")).toHaveText("");

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.accept();
    });
    reset = await courseResetButton(page);
    await reset.focus();
    await reset.press("Enter");
    const resetStatus = page.getByTestId("software-engineering-reset-status");
    await expect(resetStatus).toHaveText(english.ui.resetDone);
    await expect(resetStatus).toHaveAttribute("data-reset-outcome", "success");
    await expect(resetStatus).toBeFocused();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored).toEqual({
      "codex.lesson.meet-codex": true,
      unrelated: "keep",
    });
  });

  test("storage denial leaves lesson content and ephemeral completion usable", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
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
      .toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText(english.ui.storageUnavailable, { exact: true })).toBeVisible();
    await page.goto(CAPSTONE);
    await expect(page.getByTestId("software-engineering-capstone")
      .getByText(english.ui.storageUnavailable, { exact: true })).toBeVisible();
    await context.close();
  });

  test("assessment draft survives reload and its shared hash action focuses the heading", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: english.ui.beginAssessment }).click();

    let assessment = page.getByTestId("software-engineering-final-assessment");
    let form = assessment.locator("form[data-question-id]");
    const firstQuestionId = await form.getAttribute("data-question-id");
    expect(firstQuestionId).toBeTruthy();
    await form.locator('input[type="radio"]').nth(1).check();
    await form.getByRole("button", { name: english.ui.checkAnswer }).click();
    await form.getByRole("button", { name: english.ui.nextQuestion }).click();

    form = assessment.locator("form[data-question-id]");
    await expect(form).not.toHaveAttribute("data-question-id", firstQuestionId!);
    const restoredQuestionId = await form.getAttribute("data-question-id");
    expect(restoredQuestionId).toBeTruthy();
    await form.locator('input[type="radio"]').nth(2).check();

    const storedDraft = await page.evaluate((key) => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return record[key];
    }, SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY);
    expect(storedDraft).toMatchObject({
      version: 1,
      bankVersion: SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.bankVersion,
      questionIndex: 1,
      selectedIndex: 2,
    });

    await page.reload();
    assessment = page.getByTestId("software-engineering-final-assessment");
    form = assessment.locator("form[data-question-id]");
    await expect(form).toHaveAttribute("data-question-id", restoredQuestionId!);
    await expect(form.locator('input[type="radio"]').nth(2)).toBeChecked();
    await expect(assessment.getByRole("button", { name: english.ui.beginAssessment }))
      .toHaveCount(0);

    await page.evaluate((slugs) => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      for (const slug of slugs) record[`softwareEngineering.lesson.${slug}`] = true;
      localStorage.setItem("ae.progress", JSON.stringify(record));
    }, SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS);
    await page.goto(`${DASHBOARD}?fromLocale=ar`);

    const assessmentHeading = page.getByRole("heading", {
      level: 2,
      name: english.ui.finalAssessment,
      exact: true,
    });
    const sharedAction = page.locator(
      '.course-shell-action[href$="#final-assessment"]',
    );
    await expect(page.locator('a[href$="#final-assessment"]')).toHaveCount(1);
    await expect(sharedAction).toBeVisible();

    await sharedAction.click();
    await expect(page).toHaveURL(`${DASHBOARD}?fromLocale=ar#final-assessment`);
    await expect(assessmentHeading).toBeFocused();
    await assessment.getByRole("button", { name: english.ui.checkAnswer }).focus();
    await sharedAction.click();
    await expect(assessmentHeading).toBeFocused();
  });

  test("reset failure announces storage unavailability instead of persistence success", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    await context.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      originalSetItem.call(localStorage, "ae.progress", JSON.stringify({
        "softwareEngineering.lesson.agentic-engineering-system": true,
      }));
      Storage.prototype.setItem = function setItem(key: string, value: string) {
        if (this === localStorage && key === "ae.progress") {
          throw new DOMException("Storage write denied", "QuotaExceededError");
        }
        return originalSetItem.call(this, key, value);
      };
    });
    const page = await context.newPage();
    await page.goto(DASHBOARD);
    const reset = await courseResetButton(page);
    page.once("dialog", async (dialog) => dialog.accept());
    await reset.click();

    const resetStatus = page.getByTestId("software-engineering-reset-status");
    await expect(resetStatus).toHaveText(english.ui.storageUnavailable);
    await expect(resetStatus).toHaveAttribute("data-reset-outcome", "failure");
    await expect(resetStatus).not.toContainText(english.ui.resetDone);
    await expect(resetStatus).toBeFocused();
    await context.close();
  });

  test("shared journey action resumes active assessment and capstone drafts before incomplete lessons", async ({ page }) => {
    await page.goto(DASHBOARD);
    const sharedAction = page.locator("[data-course-journey-action]");
    await expect(sharedAction).toHaveAttribute(
      "href",
      "/en/software-engineering/agentic-engineering-system/",
    );

    await page.getByRole("button", { name: english.ui.beginAssessment }).click();
    await expect(page.getByTestId("software-engineering-final-assessment")
      .locator("form[data-question-id]")).toBeVisible();
    await page.reload();
    await expect(sharedAction).toHaveAttribute(
      "href",
      "/en/software-engineering/#final-assessment",
    );

    await page.evaluate(() => localStorage.removeItem("ae.progress"));
    await page.goto(CAPSTONE);
    const capstone = page.getByTestId("software-engineering-capstone");
    await capstone
      .getByRole("group", { name: english.ui.capstoneArtifacts })
      .locator('input[type="checkbox"]')
      .first()
      .check();
    await page.goto(DASHBOARD);
    await expect(sharedAction).toHaveAttribute(
      "href",
      "/en/software-engineering/capstone-safe-change/#capstone-checklist",
    );
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
    await (await courseResetButton(page)).click();
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
    await page.goto(CAPSTONE);
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
    await expect(score).toHaveValue("");
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
    await expect(validationFeedback).toBeVisible();
    await expect(artifacts.first().locator("xpath=ancestor::fieldset[1]"))
      .toHaveAttribute("aria-invalid", "true");
    await gates.first().check();
    await score.fill("79");
    await decision.selectOption("do-not-release");
    await attestation.check();

    const storedDraft = await page.evaluate((key) => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return record[key];
    }, SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY);
    expect(storedDraft).toMatchObject({
      version: 1,
      capstoneSchemaVersion: SOFTWARE_ENGINEERING_CAPSTONE.schemaVersion,
      artifactIds: [SOFTWARE_ENGINEERING_CAPSTONE.artifactIds[0]],
      reviewedGateIds: [SOFTWARE_ENGINEERING_CAPSTONE.releaseGates[0].id],
      score: 79,
      decision: "do-not-release",
      safetyBoundaryAttested: true,
    });

    await page.reload();
    await expect(artifacts.first()).toBeChecked();
    await expect(gates.first()).toBeChecked();
    await expect(score).toHaveValue("79");
    await expect(decision).toHaveValue("do-not-release");
    await expect(attestation).toBeChecked();

    await page.goto(DASHBOARD);
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.accept();
    });
    await (await courseResetButton(page)).click();
    await page.goto(CAPSTONE);
    await expect(artifacts.first()).not.toBeChecked();
    await expect(gates.first()).not.toBeChecked();
    await expect(score).toHaveValue("");
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
    const completedStatus = capstone.getByText(english.ui.capstoneComplete, { exact: true });
    await expect(completedStatus).toBeVisible();
    await expect(completedStatus).toBeFocused();

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

    await page.goto(DASHBOARD);
    await expect(page.locator(".course-shell-progress [role=progressbar]"))
      .toHaveAttribute("aria-valuenow", "5");
    await page.goto(CAPSTONE);
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

    await page.goto(DASHBOARD);
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(english.ui.resetConfirm);
      await dialog.accept();
    });
    await (await courseResetButton(page)).click();
    await page.goto(CAPSTONE);
    await expect(reloadedArtifacts.first()).not.toBeChecked();
    await expect(reloadedGates.first()).not.toBeChecked();
    await expect(reloaded.getByRole("spinbutton", { name: /Self-assessed rubric score/ }))
      .toHaveValue("");
    await expect(reloaded.getByRole("combobox", { name: "Recorded release decision" }))
      .toHaveValue("");
    await expect(reloadedAttestation).not.toBeChecked();
    await expect(reloaded.getByText(english.ui.capstoneComplete, { exact: true })).toHaveCount(0);
  });
});

test.describe("no-JavaScript and responsive publication", () => {
  test("dashboard and a real Claude figure remain instructional without JavaScript", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
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
    const setupReducedMotion = (routePage: Page) => routePage.emulateMedia({
      reducedMotion: "reduce",
    });
    await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
      const dashboard = routePage.getByTestId("software-engineering-course-dashboard");
      const heroParts = dashboard.locator("header").first().locator(":scope > div");
      await expect(heroParts).toHaveCount(2);
      for (const index of [0, 1]) {
        expect(await heroParts.nth(index).evaluate(
          (element) => getComputedStyle(element).animationName,
        )).toBe("none");
      }
    }, { setup: setupReducedMotion });

    await withIsolatedRoutePage(
      page,
      "/en/software-engineering/agentic-engineering-system/",
      async (routePage) => {
        const lessonHero = routePage
          .getByTestId("software-engineering-lesson-agentic-engineering-system")
          .locator("header")
          .first();
        expect(await lessonHero.evaluate((element) => getComputedStyle(element).animationName))
          .toBe("none");
      },
      { setup: setupReducedMotion },
    );
  });

  for (const width of [390, 768, 1440]) {
    test(`dashboard and representative English lessons do not overflow at ${width}px`, async ({ page }) => {
      test.setTimeout(90_000);
      for (const path of [
        DASHBOARD,
        "/en/software-engineering/security-privacy-supply-chain/",
        "/en/software-engineering/agent-evaluation/",
      ]) {
        await withIsolatedRoutePage(page, path, async (routePage) => {
          await routePage.evaluate(async () => { await document.fonts.ready; });
          const dimensions = await routePage.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
          }));
          expect(dimensions.scrollWidth, `${path} at ${width}px`)
            .toBeLessThanOrEqual(dimensions.clientWidth + 1);
        }, { viewport: { width, height: 900 } });
      }
    });
  }
});
