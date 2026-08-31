import axe from "axe-core";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";
import {
  GITHUB_FIGURES,
  GITHUB_FINAL_QUIZ,
  GITHUB_LESSONS,
  GITHUB_LESSON_SLUGS,
  GITHUB_LOCALES,
  GITHUB_QUIZ,
  formatGithubNumber,
  formatGithubPercent,
} from "../lib/github";
import {
  publishedSitemapUrls,
  withIsolatedRoutePage,
} from "./published-course-test-helpers";

const dashboard = "/en/github/";
const GITHUB_QUIZ_DRAFT_STORAGE_KEY = "github.quiz.draft.v1";
const GITHUB_CAPSTONE_DRAFT_STORAGE_KEY = "github.capstone.draft.v1";
const GITHUB_CAPSTONE_ARTIFACT_SET_VERSION =
  "github-capstone-artifacts-2026-08-30-v1";
const GITHUB_CAPSTONE_ARTIFACT_IDS = [
  "boundary",
  "issue",
  "history",
  "review",
  "project",
  "checks",
  "context",
  "release",
] as const;
const correctIndex: ReadonlyMap<string, number> = new Map(
  GITHUB_QUIZ.map((question) => [question.id, question.correctIndex]),
);
const validDraftQuestionIds = ["unit-1", "unit-2", "unit-3"].flatMap(
  (unitId) =>
    GITHUB_QUIZ.filter((question) => question.unitId === unitId)
      .slice(0, GITHUB_FINAL_QUIZ.questionsPerUnit)
      .map((question) => question.id),
);

async function waitForStableLayout(page: Page) {
  await page.locator("main").waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await waitForStableLayout(page);
  const dimensions = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      clientWidth: root.clientWidth,
      scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
    };
  });
  expect(
    dimensions.scrollWidth,
    `${label}: ${dimensions.scrollWidth}px document in ${dimensions.clientWidth}px viewport`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectMinimumTarget(locator: Locator, label: string) {
  const count = await locator.count();
  expect(count, `${label}: target inventory`).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const target = locator.nth(index);
    await expect(target, `${label}: target ${index + 1}`).toBeVisible();
    const bounds = await target.boundingBox();
    expect(bounds, `${label}: target ${index + 1} layout box`).not.toBeNull();
    expect(bounds!.width, `${label}: target ${index + 1} width`).toBeGreaterThanOrEqual(44);
    expect(bounds!.height, `${label}: target ${index + 1} height`).toBeGreaterThanOrEqual(44);
  }
}

async function expectMinimumFontSize(
  locator: Locator,
  label: string,
  minimum = 13,
) {
  await expect(locator, `${label}: visible text`).toBeVisible();
  const fontSize = await locator.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(fontSize, `${label}: computed font size`).toBeGreaterThanOrEqual(minimum);
}

async function expectInsideScrollport(
  target: Locator,
  scrollport: Locator,
  label: string,
) {
  await expect.poll(async () => {
    const [targetBounds, scrollportBounds] = await Promise.all([
      target.boundingBox(),
      scrollport.boundingBox(),
    ]);
    if (!targetBounds || !scrollportBounds) return false;
    return targetBounds.x >= scrollportBounds.x - 1 &&
      targetBounds.x + targetBounds.width <=
        scrollportBounds.x + scrollportBounds.width + 1 &&
      targetBounds.y >= scrollportBounds.y - 1 &&
      targetBounds.y + targetBounds.height <=
        scrollportBounds.y + scrollportBounds.height + 1;
  }, { message: `${label}: active lesson must be revealed inside its nested scrollport` })
    .toBe(true);

  const scrolling = await scrollport.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
  }));
  if (scrolling.scrollHeight > scrolling.clientHeight + 1) {
    expect(scrolling.scrollTop, `${label}: overflowing map must reveal Lesson 12`).toBeGreaterThan(0);
  }
}

async function resolvedCssColor(page: Page, variable: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, variable);
}

async function runAxe(page: Page, label: string) {
  await waitForStableLayout(page);
  if (!await page.evaluate(() => "axe" in window)) {
    await page.addScriptTag({ content: axe.source });
  }
  const violations = await page.evaluate(async () => {
    const axeApi = (window as unknown as {
      axe: {
        run: (
          root: Document,
          options: Readonly<Record<string, unknown>>,
        ) => Promise<{
          violations: readonly {
            id: string;
            impact: string | null;
            nodes: readonly { target: readonly string[] }[];
          }[];
        }>;
      };
    }).axe;
    const results = await axeApi.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      resultTypes: ["violations"],
    });
    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));
  });
  expect(violations, label).toEqual([]);
}

async function finishQuiz(page: Page, correctAnswers: number) {
  const ids = [];
  const units = [];
  for (let index = 0; index < GITHUB_FINAL_QUIZ.questionCount; index += 1) {
    const form = page.locator(
      '[data-testid="github-final-quiz"] form[data-question-id]',
    );
    await expect(form).toBeVisible();
    const id = await form.getAttribute("data-question-id");
    const unit = await form.getAttribute("data-unit-id");
    expect(id).toBeTruthy();
    expect(unit).toBeTruthy();
    ids.push(id!);
    units.push(unit!);

    const answer = correctIndex.get(id!);
    expect(answer).toBeDefined();
    const selected = index < correctAnswers ? answer! : (answer! + 1) % 4;
    await form.locator('input[type="radio"]').nth(selected).check();
    await form.getByRole("button", { name: "Check answer" }).click();
    await expect(form.getByRole("status")).toBeFocused();
    await expect(
      form.getByRole("status").locator('a[href^="https://"]'),
    ).not.toHaveCount(0);
    await form
      .getByRole("button", {
        name:
          index === GITHUB_FINAL_QUIZ.questionCount - 1
            ? "Finish assessment"
            : "Next question",
      })
      .click();
  }
  return { ids, units };
}

test.describe("Course 6 static curriculum and provenance", () => {
  test("dashboard exposes the complete sourced curriculum", async ({
    page,
  }) => {
    const response = await page.goto(dashboard);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/How to Use GitHub/);
    await expect(
      page.getByRole("heading", { level: 1, name: "How to Use GitHub" }),
    ).toBeVisible();
    await expect(page.getByText("Pass with 10 of 12")).toBeVisible();
    await expect(
      page.getByText("Course 6 · GitHub", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(
        'section[aria-labelledby="github-curriculum-title"] ol > li > a',
      ),
    ).toHaveCount(12);
    await expect(
      page.getByText("11 guided hours · 12 lessons · one continuous capstone", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("github-final-quiz")).toBeVisible();
    await expect(
      page.getByText(/21 interface figures are authentic GitHub Docs assets/),
    ).toBeVisible();
    await expect(
      page.getByText(/not affiliated with or endorsed by GitHub/).first(),
    ).toBeVisible();
  });

  for (const slug of GITHUB_LESSON_SLUGS) {
    test(`English lesson ${slug} renders authentic local figures and evidence`, async ({
      page,
    }) => {
      const response = await page.goto(`/en/github/${slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("article > header h1")).toBeVisible();
      const expectedFigures = GITHUB_FIGURES.filter(
        (figure) => figure.lessonSlug === slug,
      );
      const figures = page.locator('figure[data-testid^="github-figure-"]');
      await expect(figures).toHaveCount(expectedFigures.length);
      for (const expectedFigure of expectedFigures) {
        const figure = page.getByTestId(`github-figure-${expectedFigure.id}`);
        await expect(figure).toHaveAttribute("data-figure-status", "available");
        await expect(figure).toHaveAttribute(
          "data-figure-sha256",
          expectedFigure.sha256,
        );
        const image = figure.locator("img");
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute("src", expectedFigure.src);
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((node: HTMLImageElement) => ({
          complete: node.complete,
          width: node.naturalWidth,
          height: node.naturalHeight,
        }))).toEqual({
          complete: true,
          width: expectedFigure.width,
          height: expectedFigure.height,
        });
        await expect(figure.locator("figcaption")).toContainText(
          "GitHub Docs © GitHub, Inc.",
        );
        await expect(
          figure.locator('figcaption a[href^="https://docs.github.com/"]'),
        ).toHaveCount(1);
      }
      await expect(
        page
          .locator('section[aria-labelledby="github-sources-title"] li')
          .first(),
      ).toBeVisible();
      await expect(
        page.getByText("Practice lab", { exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('img[src^="http"], source[srcset^="http"]'),
      ).toHaveCount(0);
    });
  }

  test("every locale materializes and Arabic keeps GitHub figures LTR", async ({
    context,
  }) => {
    for (const locale of GITHUB_LOCALES) {
      const localePage = await context.newPage();
      try {
        const response = await localePage.goto(`/${locale}/github/`);
        expect(response, `${locale}: dashboard document response`).not.toBeNull();
        expect(response!.status(), locale).toBe(200);
        await expect(
          localePage.getByTestId("github-course-dashboard"),
        ).toBeVisible();
        await expect(localePage.locator("html")).toHaveAttribute("lang", locale);
      } finally {
        await localePage.close();
      }
    }
    const lessonPage = await context.newPage();
    try {
      const response = await lessonPage.goto(
        "/ar/github/pull-requests-reviews/",
      );
      expect(response, "Arabic lesson document response").not.toBeNull();
      expect(response!.status()).toBe(200);
      await expect(lessonPage.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(
        lessonPage
          .getByTestId("github-figure-fig-07")
          .locator('a[aria-describedby="github-fig-07-caption"]'),
      ).toHaveAttribute("dir", "ltr");
      await expect(
        lessonPage.getByTestId("github-figure-fig-07").locator("img"),
      ).toBeVisible();
    } finally {
      await lessonPage.close();
    }
  });

  test("metadata is canonical, reciprocal, and course-specific", async ({
    page,
  }) => {
    await page.goto("/fr/github/research-reproducibility/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/fr/github/research-reproducibility/",
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute(
      "href",
      "https://aicourse.top/en/github/research-reproducibility/",
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute(
      "href",
      "https://aicourse.top/en/github/research-reproducibility/",
    );
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.join("\n")).toContain("LearningResource");
    expect(jsonLd.join("\n")).toContain("courseCode");
    expect(jsonLd.join("\n")).toContain('"6"');
  });

  test("teaching lesson carries the current Classroom retirement boundary", async ({
    page,
  }) => {
    await page.goto("/en/github/teaching-capstone/");
    await expect(
      page.getByText("Current teaching notice", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/stopped new Classroom sign-ups on 26 May 2026/).first(),
    ).toBeVisible();
    await expect(
      page
        .getByText(/Export required Classroom-only data before 28 August/)
        .first(),
    ).toBeVisible();
    await expect(
      page
        .getByText(/scheduled for final deletion on 4 September 2026/)
        .first(),
    ).toBeVisible();
    await expect(
      page
        .getByText(
          /Existing GitHub accounts, organizations, and repositories remain/,
        )
        .first(),
    ).toBeVisible();
    await expect(
      page
        .getByText(/requires a GitHub organization on Team or Enterprise/)
        .first(),
    ).toBeVisible();
    await expect(
      page.locator(
        'a[href="https://github.blog/changelog/2026-05-26-github-classroom-sign-ups-are-no-longer-available/"]',
      ),
    ).toBeVisible();
    await expect(
      page.locator(
        'a[href="https://github.com/orgs/community/discussions/196615"]',
      ),
    ).toBeVisible();
    await expect(
      page.locator('a[href="https://github.com/foundation50/classroom50"]'),
    ).toBeVisible();
  });

  test("technical literals render as semantic LTR code instead of raw Markdown", async ({
    page,
  }) => {
    await page.goto("/ar/github/research-reproducibility/");
    const citation = page.locator("code", { hasText: "CITATION.cff" }).first();
    await expect(citation).toBeVisible();
    await expect(citation).toHaveAttribute("dir", "ltr");
    await expect(citation).toHaveAttribute("translate", "no");
    await expect(page.locator("article")).not.toContainText("`CITATION.cff`");
  });
});

test.describe.serial("Course 6 private progress and assessment", () => {
  test("lesson completion persists and Course 6 reset preserves unrelated data", async ({
    page,
  }) => {
    const firstDraftQuestionId = validDraftQuestionIds[0]!;
    const quizDraft = {
      schemaVersion: 1,
      bankVersion: GITHUB_FINAL_QUIZ.bankVersion,
      orderedQuestionIds: validDraftQuestionIds,
      questionIndex: 1,
      selectedIndex: null,
      submittedAnswers: {
        [firstDraftQuestionId]: correctIndex.get(firstDraftQuestionId) ?? 0,
      },
    };
    const capstoneDraft = {
      schemaVersion: 1,
      artifactSetVersion: GITHUB_CAPSTONE_ARTIFACT_SET_VERSION,
      artifactIds: GITHUB_CAPSTONE_ARTIFACT_IDS,
      checkedArtifactIds: ["boundary", "review"],
    };
    await page.addInitScript(({ quizDraftFixture, capstoneDraftFixture }) => {
      if (!window.localStorage.getItem("ae.progress")) {
        window.localStorage.setItem(
          "ae.progress",
          JSON.stringify({
            "codex.lesson.meet-codex": true,
            "github.lesson.github-mental-model.practice": true,
            "github.future.setting": "preserve-me",
            "github.quiz.best": 10,
            "github.quiz.passed": false,
            "github.quiz.version": "github-quiz-2026-08-23-v2",
            "github.quiz.draft.v1": quizDraftFixture,
            "github.capstone.v1": false,
            "github.capstone.draft.v1": capstoneDraftFixture,
            unrelated: true,
          }),
        );
      }
    }, { quizDraftFixture: quizDraft, capstoneDraftFixture: capstoneDraft });
    await page.goto("/en/github/start-secure/");
    await page.getByRole("button", { name: "Mark lesson complete" }).click();
    await expect(
      page.getByRole("button", { name: "Lesson complete", exact: true }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Lesson complete", exact: true }),
    ).toHaveAttribute("aria-disabled", "true");

    await page.goto(dashboard);
    await expect(
      page.locator('[data-testid="github-course-progress"] progress'),
    ).toHaveAttribute("value", "1");
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Reset GitHub course progress" })
      .click();
    await expect(
      page.getByText("GitHub course progress was reset."),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Reset GitHub course progress" }),
    ).toBeDisabled();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    );
    expect(stored["github.lesson.start-secure"]).toBeUndefined();
    expect(stored["github.quiz.best"]).toBeUndefined();
    expect(stored["github.quiz.passed"]).toBeUndefined();
    expect(stored["github.quiz.version"]).toBeUndefined();
    expect(stored[GITHUB_QUIZ_DRAFT_STORAGE_KEY]).toBeUndefined();
    expect(stored["github.capstone.v1"]).toBeUndefined();
    expect(stored[GITHUB_CAPSTONE_DRAFT_STORAGE_KEY]).toBeUndefined();
    expect(stored["github.lesson.github-mental-model.practice"]).toBe(true);
    expect(stored["github.future.setting"]).toBe("preserve-me");
    expect(stored["codex.lesson.meet-codex"]).toBe(true);
    expect(stored.unrelated).toBe(true);
    await expect(
      page.getByRole("button", { name: "Begin 12-question assessment" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resume unfinished assessment" }),
    ).toHaveCount(0);
  });

  test("storage denial keeps all lesson content usable", async ({
    browser,
    baseURL,
  }) => {
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
    await page.goto("/en/github/repository-readme/");
    await expect(
      page.getByText(/browser is blocking local storage/i),
    ).toBeVisible();
    await expect(page.locator("article > header h1")).toBeVisible();
    await expect(
      page.getByTestId("github-figure-fig-01").locator("img"),
    ).toBeVisible();
    await context.close();
  });

  test("quiz is stratified four per unit and passes at exactly 10 of 12", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto(dashboard);
    await page
      .getByRole("button", { name: "Begin 12-question assessment" })
      .click();
    const attempt = await finishQuiz(page, 10);
    expect(new Set(attempt.ids).size).toBe(12);
    expect(
      Object.fromEntries(
        ["unit-1", "unit-2", "unit-3"].map((unit) => [
          unit,
          attempt.units.filter((candidate) => candidate === unit).length,
        ]),
      ),
    ).toEqual({ "unit-1": 4, "unit-2": 4, "unit-3": 4 });
    await expect(page.getByText(/Assessment passed/)).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    );
    expect(stored[GITHUB_FINAL_QUIZ.bestScoreStorageKey]).toBe(10);
    expect(stored[GITHUB_FINAL_QUIZ.passedStorageKey]).toBe(true);
    expect(stored[GITHUB_FINAL_QUIZ.versionStorageKey]).toBe(
      GITHUB_FINAL_QUIZ.bankVersion,
    );

    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Reset GitHub course progress" })
      .click();
    await expect(
      page.getByRole("button", { name: "Begin 12-question assessment" }),
    ).toBeVisible();
    await expect(page.getByText(/Assessment passed/)).toHaveCount(0);
    await expect(page.getByText("Best score: 0/12")).toBeVisible();
    const reset = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    );
    expect(reset[GITHUB_FINAL_QUIZ.bestScoreStorageKey]).toBeUndefined();
    expect(reset[GITHUB_FINAL_QUIZ.passedStorageKey]).toBeUndefined();
    expect(reset[GITHUB_FINAL_QUIZ.versionStorageKey]).toBeUndefined();
  });

  test("capstone requires all eight inspectable artifacts", async ({
    page,
  }) => {
    await page.goto("/en/github/teaching-capstone/");
    await page.getByRole("button", { name: "Complete capstone" }).click();
    await expect(
      page.getByText("Check every artifact before completing the capstone."),
    ).toBeVisible();
    const checks = page
      .getByTestId("github-capstone")
      .locator('input[type="checkbox"]');
    await expect(checks).toHaveCount(8);
    for (let index = 0; index < 8; index += 1) await checks.nth(index).check();
    await page.getByRole("button", { name: "Complete capstone" }).click();
    await expect(
      page.getByText("Capstone complete", { exact: true }),
    ).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    );
    expect(stored["github.capstone.v1"]).toBe(true);
  });
});

test.describe("Course 6 responsive and static delivery", () => {
  test("figures remain instructional without JavaScript", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/en/github/pull-requests-reviews/");
    await expect(
      page.getByTestId("github-figure-fig-07").locator("img"),
    ).toBeVisible();
    await expect(
      page.getByTestId("github-figure-fig-07").locator("figcaption"),
    ).toContainText("GitHub Docs");
    await context.close();
  });

  for (const width of [390, 768, 1440]) {
    test(`dashboard and RTL lesson do not overflow at ${width}px`, async ({
      page,
    }) => {
      for (const path of [
        dashboard,
        "/en/github/projects-office-work/",
        "/ar/github/research-reproducibility/",
      ]) {
        await withIsolatedRoutePage(page, path, async (routePage) => {
          const overflow = await routePage.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          );
          expect(overflow).toBeLessThanOrEqual(1);
        }, { viewport: { width, height: 900 } });
      }
    });
  }

  test("sitemap contains the dashboard and every lesson in all locales", async ({
    request,
  }) => {
    const urls = await publishedSitemapUrls(request);
    for (const locale of GITHUB_LOCALES) {
      expect(urls).toContain(`https://aicourse.top/${locale}/github/`);
      for (const slug of GITHUB_LESSON_SLUGS) {
        expect(urls).toContain(`https://aicourse.top/${locale}/github/${slug}/`);
      }
    }
  });
});

test.describe("Course 6 Phase 1 UI/UX regressions", () => {
  test("Course 6 Phase 1 all nine locale dashboards fit 320px without clipped actions", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    for (const locale of GITHUB_LOCALES) {
      await test.step(locale, async () => {
        await withIsolatedRoutePage(
          page,
          `/${locale}/github/`,
          async (routePage) => {
            const course = routePage.getByTestId("github-course-dashboard");
            await expect(course).toBeVisible();
            await expect(routePage.locator("html")).toHaveAttribute("lang", locale);
            await expect(routePage.locator("html")).toHaveAttribute(
              "dir",
              locale === "ar" ? "rtl" : "ltr",
            );
            await waitForStableLayout(routePage);

            const pageBounds = await routePage.evaluate(() => {
              const root = document.documentElement;
              return {
                clientWidth: root.clientWidth,
                scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
              };
            });
            expect.soft(
              pageBounds.scrollWidth,
              `${locale}: 320px document width`,
            ).toBeLessThanOrEqual(pageBounds.clientWidth + 1);

            const actions = course.locator([
              "[data-course-journey-action]:visible",
              'aside[aria-labelledby="github-capstone-path-title"] a:visible',
              '[data-testid="github-course-progress"] button:visible',
              '[data-testid="github-final-quiz"] button:visible',
            ].join(", "));
            const actionCount = await actions.count();
            expect(actionCount, `${locale}: visible learner actions`).toBeGreaterThanOrEqual(4);
            for (let index = 0; index < actionCount; index += 1) {
              const bounds = await actions.nth(index).boundingBox();
              expect(bounds, `${locale}: action ${index + 1} layout box`).not.toBeNull();
              expect.soft(
                bounds!.x,
                `${locale}: action ${index + 1} left edge`,
              ).toBeGreaterThanOrEqual(-1);
              expect.soft(
                bounds!.x + bounds!.width,
                `${locale}: action ${index + 1} right edge`,
              ).toBeLessThanOrEqual(pageBounds.clientWidth + 1);
              expect.soft(
                bounds!.width,
                `${locale}: action ${index + 1} width`,
              ).toBeGreaterThanOrEqual(44);
              expect.soft(
                bounds!.height,
                `${locale}: action ${index + 1} height`,
              ).toBeGreaterThanOrEqual(44);
            }
          },
          { viewport: { width: 320, height: 900 } },
        );

        await withIsolatedRoutePage(
          page,
          `/${locale}/github/repository-readme/`,
          async (routePage) => {
            await expect(routePage.locator("html")).toHaveAttribute("lang", locale);
            await expect(routePage.locator("html")).toHaveAttribute(
              "dir",
              locale === "ar" ? "rtl" : "ltr",
            );
            await expect(
              routePage.getByTestId("github-lesson-repository-readme"),
            ).toBeVisible();
            await waitForStableLayout(routePage);
            const dimensions = await routePage.evaluate(() => {
              const root = document.documentElement;
              return {
                clientWidth: root.clientWidth,
                scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
              };
            });
            expect.soft(
              dimensions.scrollWidth,
              `${locale}: 320px localized Lesson 2 document width`,
            ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
          },
          { viewport: { width: 320, height: 900 } },
        );
      });
    }
  });

  test("Course 6 Phase 1 Lesson 2 technical phrase wraps at 320px and 390px", async ({
    page,
  }) => {
    for (const width of [320, 390] as const) {
      await test.step(`${width}px`, async () => {
        await withIsolatedRoutePage(
          page,
          "/en/github/repository-readme/",
          async (routePage) => {
            await waitForStableLayout(routePage);
            const phrase = routePage.locator("code", {
              hasText: "Add repository purpose and working agreement",
            }).first();
            await expect(phrase).toBeVisible();
            const layout = await phrase.evaluate((element) => {
              const root = document.documentElement;
              const range = document.createRange();
              range.selectNodeContents(element);
              return {
                clientWidth: root.clientWidth,
                scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
                fragments: [...range.getClientRects()].map((rectangle) => ({
                  left: rectangle.left,
                  right: rectangle.right,
                })),
              };
            });
            expect.soft(
              layout.scrollWidth,
              `${width}px Lesson 2 document width`,
            ).toBeLessThanOrEqual(layout.clientWidth + 1);
            expect.soft(
              layout.fragments.length,
              `${width}px phrase line fragments`,
            ).toBeGreaterThan(1);
            for (const [index, fragment] of layout.fragments.entries()) {
              expect.soft(
                fragment.left,
                `${width}px phrase fragment ${index + 1} left edge`,
              ).toBeGreaterThanOrEqual(-1);
              expect.soft(
                fragment.right,
                `${width}px phrase fragment ${index + 1} right edge`,
              ).toBeLessThanOrEqual(layout.clientWidth + 1);
            }
          },
          { viewport: { width, height: 844 } },
        );
      });
    }
  });

  for (const width of [390, 768, 900] as const) {
    test(`Course 6 Phase 1 Lesson 12 mobile course map works at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/en/github/teaching-capstone/");
      const lesson = page.getByTestId("github-lesson-teaching-capstone");
      const breadcrumb = lesson.locator("nav").first();
      const renderedBreadcrumb = (await breadcrumb.innerText()).trim();
      expect.soft(renderedBreadcrumb, `${width}px breadcrumb`).not.toMatch(/\/$/);

      const mobileMap = page.getByTestId("github-mobile-course-map");
      const desktopMap = page.getByTestId("github-desktop-course-map");
      await expect(desktopMap).toBeHidden();
      await expect(mobileMap).toBeVisible();
      await expect(mobileMap).not.toHaveAttribute("open", "");

      const summary = mobileMap.locator("summary");
      const lessonTitle = (await lesson.locator("article > header h1").innerText()).trim();
      await expect(summary).toContainText(/Lesson 12 of 12/i);
      await expect(summary).toContainText(lessonTitle);
      await expectMinimumTarget(summary, `${width}px mobile map summary`);
      await expect(mobileMap.locator("a:visible")).toHaveCount(0);

      await summary.focus();
      await expect(summary).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(mobileMap.locator("a:focus")).toHaveCount(0);
      await page.keyboard.press("Shift+Tab");
      await expect(summary).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(mobileMap).toHaveAttribute("open", "");

      const links = mobileMap.locator('a[href^="/en/github/"]');
      await expect(links).toHaveCount(GITHUB_LESSON_SLUGS.length);
      await expectMinimumTarget(links, `${width}px mobile lesson links`);
      const active = mobileMap.locator(
        'a[href="/en/github/teaching-capstone/"][aria-current="page"]',
      );
      await expect(active).toHaveCount(1);
      await expect(active).toHaveAttribute(
        "href",
        "/en/github/teaching-capstone/",
      );
      const scrollport = mobileMap.getByTestId(
        "github-mobile-course-map-scrollport",
      );
      await expect(scrollport).toBeVisible();
      await expectInsideScrollport(active, scrollport, `${width}px Lesson 12`);

      const previousSlug = GITHUB_LESSON_SLUGS.at(-2)!;
      const previousLink = mobileMap.locator(
        `a[href="/en/github/${previousSlug}/"]`,
      );
      await previousLink.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/en/github/${previousSlug}/$`));
      await expect(page.locator("main h1").first()).toBeFocused();
    });
  }

  test("Course 6 Phase 1 desktop course map reveals the active lesson without moving the document", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 901, height: 900 });
    await page.goto("/en/github/teaching-capstone/");
    await waitForStableLayout(page);
    const desktopMap = page.getByTestId("github-desktop-course-map");
    const active = desktopMap.locator(
      'a[href="/en/github/teaching-capstone/"][aria-current="page"]',
    );

    await expect(desktopMap).toBeVisible();
    await expect(page.getByTestId("github-mobile-course-map")).toBeHidden();
    await expect(active).toHaveCount(1);
    await expectInsideScrollport(active, desktopMap, "901px desktop Lesson 12");
    await expect.poll(() => page.evaluate(() => window.scrollY), {
      message: "desktop active-lesson reveal must not scroll the document",
    }).toBe(0);
  });

  test("Course 6 Phase 1 failed and passed assessments expose truthful visual states", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => localStorage.setItem("ae.theme", "light"));
    await page.goto(dashboard);
    const quiz = page.getByTestId("github-final-quiz");
    await quiz.getByRole("button", { name: "Begin 12-question assessment" }).click();
    await finishQuiz(page, 3);

    const result = quiz.locator(":scope > [role=status]");
    await expect(result).toBeFocused();
    await expect.soft(result).toHaveAttribute("data-result-state", "retry");
    const retryStyle = await result.evaluate((element) => {
      const style = getComputedStyle(element);
      const score = element.querySelector("strong");
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
        score: score ? getComputedStyle(score).color : "",
      };
    });
    const [goldSoft, goldLine, gold, greenSoft] = await Promise.all([
      resolvedCssColor(page, "--gold-soft"),
      resolvedCssColor(page, "--gold-line"),
      resolvedCssColor(page, "--gold"),
      resolvedCssColor(page, "--green-soft"),
    ]);
    expect.soft(retryStyle.background, "failed result background").toBe(goldSoft);
    expect.soft(retryStyle.border, "failed result border").toBe(goldLine);
    expect.soft(retryStyle.score, "failed result score").toBe(gold);
    expect.soft(retryStyle.background, "failed result must not look successful")
      .not.toBe(greenSoft);
    await runAxe(page, "failed Course 6 assessment in light theme");

    await result.getByRole("button", { name: "Try a new set" }).click();
    await finishQuiz(page, 10);
    await expect(result).toBeFocused();
    await expect.soft(result).toHaveAttribute("data-result-state", "passed");
    const passedStyle = await result.evaluate((element) => {
      const style = getComputedStyle(element);
      const score = element.querySelector("strong");
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
        score: score ? getComputedStyle(score).color : "",
      };
    });
    const [greenLine, green] = await Promise.all([
      resolvedCssColor(page, "--green-line"),
      resolvedCssColor(page, "--green"),
    ]);
    expect.soft(passedStyle.background, "passed result background").toBe(greenSoft);
    expect.soft(passedStyle.border, "passed result border").toBe(greenLine);
    expect.soft(passedStyle.score, "passed result score").toBe(green);
    await runAxe(page, "passed Course 6 assessment in light theme");
  });

  test("Course 6 Phase 1 exact quiz draft reload offers Resume and Discard", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      if (localStorage.getItem("ae.progress")) return;
      localStorage.setItem("ae.progress", JSON.stringify({
        "github.future.setting": "preserve-me",
        unrelated: true,
      }));
    });
    await page.goto(dashboard);
    await page.getByRole("button", { name: "Begin 12-question assessment" }).click();

    let form = page.locator(
      '[data-testid="github-final-quiz"] form[data-question-id]',
    );
    const firstId = await form.getAttribute("data-question-id");
    expect(firstId).toBeTruthy();
    const firstSelection = correctIndex.get(firstId!)!;
    await form.locator('input[type="radio"]').nth(firstSelection).check();
    await form.getByRole("button", { name: "Check answer" }).click();
    const disabledLabels = form.locator("fieldset label");
    for (let index = 0; index < await disabledLabels.count(); index += 1) {
      expect.soft(
        await disabledLabels.nth(index).evaluate((element) => getComputedStyle(element).cursor),
        `disabled quiz option ${index + 1} cursor`,
      ).not.toBe("pointer");
    }
    await form.getByRole("button", { name: "Next question" }).click();

    form = page.locator(
      '[data-testid="github-final-quiz"] form[data-question-id]',
    );
    const secondId = await form.getAttribute("data-question-id");
    expect(secondId).toBeTruthy();
    const secondSelection = 2;
    await form.locator('input[type="radio"]').nth(secondSelection).check();

    await expect.poll(() => page.evaluate((key) => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress[key];
    }, GITHUB_QUIZ_DRAFT_STORAGE_KEY), {
      message: "the selected but unfinished assessment must persist a safe draft",
    }).toMatchObject({
      schemaVersion: 1,
      bankVersion: GITHUB_FINAL_QUIZ.bankVersion,
      questionIndex: 1,
      selectedIndex: secondSelection,
      submittedAnswers: { [firstId!]: firstSelection },
    });
    const draft = await page.evaluate((key) => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress[key] as {
        orderedQuestionIds: string[];
        submittedAnswers: Record<string, unknown>;
      };
    }, GITHUB_QUIZ_DRAFT_STORAGE_KEY);
    expect(draft.orderedQuestionIds).toHaveLength(GITHUB_FINAL_QUIZ.questionCount);
    expect(new Set(draft.orderedQuestionIds).size).toBe(GITHUB_FINAL_QUIZ.questionCount);
    expect(draft.orderedQuestionIds[0]).toBe(firstId);
    expect(draft.orderedQuestionIds[1]).toBe(secondId);
    expect(draft.submittedAnswers[firstId!]).toBe(firstSelection);
    expect(Object.values(draft.submittedAnswers).every(Number.isInteger)).toBe(true);

    await page.reload();
    const resume = page.getByRole("button", {
      name: "Resume unfinished assessment",
    });
    const discard = page.getByRole("button", {
      name: "Discard unfinished assessment",
    });
    await expect(resume).toBeVisible();
    await expect(discard).toBeVisible();
    await resume.focus();
    await page.keyboard.press("Enter");
    form = page.locator(
      '[data-testid="github-final-quiz"] form[data-question-id]',
    );
    await expect(form).toHaveAttribute("data-question-id", secondId!);
    await expect(form.locator('input[type="radio"]').nth(secondSelection)).toBeChecked();
    await expect(form.getByText("Question 2 of 12", { exact: true })).toBeVisible();

    await page.reload();
    const restoredDiscard = page.getByRole("button", {
      name: "Discard unfinished assessment",
    });
    await restoredDiscard.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate((key) => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress[key];
    }, GITHUB_QUIZ_DRAFT_STORAGE_KEY)).toBeUndefined();
    await expect(
      page.getByRole("button", { name: "Begin 12-question assessment" }),
    ).toBeVisible();
    const preserved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    );
    expect(preserved["github.future.setting"]).toBe("preserve-me");
    expect(preserved.unrelated).toBe(true);
  });

  test("Course 6 Phase 1 partial capstone draft restores stable artifact IDs and discards narrowly", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem("ae.progress")) return;
      localStorage.setItem("ae.progress", JSON.stringify({
        "github.future.setting": "preserve-me",
        unrelated: true,
      }));
    });
    await page.goto("/en/github/teaching-capstone/");
    const capstone = page.getByTestId("github-capstone");
    let checks = capstone.locator('input[type="checkbox"]');
    await expect(checks).toHaveCount(GITHUB_CAPSTONE_ARTIFACT_IDS.length);
    for (const [index, artifactId] of GITHUB_CAPSTONE_ARTIFACT_IDS.entries()) {
      await expect.soft(checks.nth(index), `capstone artifact ${artifactId}`)
        .toHaveAttribute("value", artifactId);
    }
    await checks.nth(0).check();
    await checks.nth(3).check();

    await expect.poll(() => page.evaluate((key) => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress[key];
    }, GITHUB_CAPSTONE_DRAFT_STORAGE_KEY), {
      message: "partial capstone work must persist by stable artifact ID",
    }).toEqual({
      schemaVersion: 1,
      artifactSetVersion: GITHUB_CAPSTONE_ARTIFACT_SET_VERSION,
      artifactIds: GITHUB_CAPSTONE_ARTIFACT_IDS,
      checkedArtifactIds: ["boundary", "review"],
    });

    await page.reload();
    const resume = page.getByRole("button", { name: "Resume capstone draft" });
    let discard = page.getByRole("button", { name: "Discard capstone draft" });
    await expect(resume).toBeVisible();
    await expect(discard).toBeVisible();
    await resume.focus();
    await page.keyboard.press("Enter");
    checks = page.getByTestId("github-capstone").locator('input[type="checkbox"]');
    await expect(checks.nth(0)).toBeChecked();
    await expect(checks.nth(3)).toBeChecked();
    await expect(checks.nth(1)).not.toBeChecked();
    await expect(
      page.getByRole("status").filter({ hasText: /capstone draft.*restored/i }),
    ).toBeVisible();
    await page.reload();
    discard = page.getByRole("button", { name: "Discard capstone draft" });
    await expect(discard).toBeVisible();
    await discard.focus();
    await page.keyboard.press("Enter");
    checks = page.getByTestId("github-capstone").locator('input[type="checkbox"]');
    await expect(
      page.getByTestId("github-capstone").locator('input[type="checkbox"]:checked'),
    ).toHaveCount(0);
    await expect.poll(() => page.evaluate((key) => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress[key];
    }, GITHUB_CAPSTONE_DRAFT_STORAGE_KEY)).toBeUndefined();
    const preserved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    );
    expect(preserved["github.future.setting"]).toBe("preserve-me");
    expect(preserved.unrelated).toBe(true);
  });

  test("Course 6 Phase 1 stale and corrupt drafts fail closed with narrow deletion", async ({
    page,
  }) => {
    await page.addInitScript(({ orderedQuestionIds, artifactIds }) => {
      localStorage.setItem("ae.progress", JSON.stringify({
        "github.quiz.best": 7,
        "github.future.setting": "preserve-me",
        "codex.lesson.meet-codex": true,
        unrelated: true,
        "github.quiz.draft.v1": {
          schemaVersion: 1,
          bankVersion: "stale-bank-version",
          orderedQuestionIds,
          questionIndex: 1,
          selectedIndex: 0,
          submittedAnswers: { [orderedQuestionIds[0]]: 0 },
        },
        "github.capstone.draft.v1": {
          schemaVersion: 1,
          artifactSetVersion: "github-capstone-artifacts-2026-08-30-v1",
          artifactIds,
          checkedArtifactIds: ["boundary", "not-a-real-artifact"],
        },
      }));
    }, {
      orderedQuestionIds: validDraftQuestionIds,
      artifactIds: GITHUB_CAPSTONE_ARTIFACT_IDS,
    });

    await page.goto(dashboard);
    await expect(
      page.getByRole("button", { name: "Resume unfinished assessment" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Begin 12-question assessment" }),
    ).toBeVisible();
    await expect.poll(() => page.evaluate((key) => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress[key];
    }, GITHUB_QUIZ_DRAFT_STORAGE_KEY)).toBeUndefined();

    await page.goto("/en/github/teaching-capstone/");
    await expect(
      page.getByTestId("github-capstone").locator('input[type="checkbox"]:checked'),
    ).toHaveCount(0);
    await expect.poll(() => page.evaluate((key) => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress[key];
    }, GITHUB_CAPSTONE_DRAFT_STORAGE_KEY)).toBeUndefined();
    const preserved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    );
    expect(preserved["github.quiz.best"]).toBe(7);
    expect(preserved["github.future.setting"]).toBe("preserve-me");
    expect(preserved["codex.lesson.meet-codex"]).toBe(true);
    expect(preserved.unrelated).toBe(true);
  });

  test("Course 6 Phase 1 storage-denied warnings are live on every interactive surface", async ({
    browser,
    baseURL,
  }) => {
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
    try {
      await page.goto(dashboard);
      await expect.soft(
        page.getByTestId("github-course-progress").getByRole("status")
          .filter({ hasText: /browser.*local storage/i }),
        "dashboard progress storage warning",
      ).toContainText(/browser.*local storage/i);
      await expect.soft(
        page.getByTestId("github-final-quiz").getByRole("status")
          .filter({ hasText: /browser.*local storage/i }),
        "assessment storage warning",
      ).toContainText(/browser.*local storage/i);

      await page.goto("/en/github/teaching-capstone/");
      await expect.soft(
        page.getByTestId("github-capstone").getByRole("status")
          .filter({ hasText: /browser.*local storage/i }),
        "capstone storage warning",
      ).toContainText(/browser.*local storage/i);
      await expect.soft(
        page.getByTestId("github-lesson-completion-teaching-capstone")
          .getByRole("status")
          .filter({ hasText: /browser.*local storage/i }),
        "lesson completion storage warning",
      ).toContainText(/browser.*local storage/i);
    } finally {
      await context.close();
    }
  });

  test("Course 6 Phase 1 malformed shared progress remains byte-for-byte intact", async ({
    page,
  }) => {
    const malformed = '{"private-progress":';
    await page.addInitScript((raw) => {
      localStorage.setItem("ae.progress", raw);
    }, malformed);
    await page.goto(dashboard);
    await expect(
      page.getByTestId("github-course-progress").getByRole("status")
        .filter({ hasText: /browser.*local storage/i }),
    ).toBeVisible();
    await page.getByRole("button", {
      name: "Begin 12-question assessment",
    }).click();
    const form = page.locator(
      '[data-testid="github-final-quiz"] form[data-question-id]',
    );
    await form.locator('input[type="radio"]').first().check();
    await expect(form).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("ae.progress")))
      .toBe(malformed);
  });

  test("Course 6 Phase 1 cross-tab reset clears active quiz and capstone state before it can be restored", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ baseURL });
    await context.addInitScript(() => {
      if (localStorage.getItem("ae.progress")) return;
      localStorage.setItem("ae.progress", JSON.stringify({
        "codex.lesson.meet-codex": true,
        unrelated: true,
      }));
    });
    const quizPage = await context.newPage();
    const capstonePage = await context.newPage();
    const resetPage = await context.newPage();
    try {
      await quizPage.goto(dashboard);
      await quizPage
        .getByRole("button", { name: "Begin 12-question assessment" })
        .click();
      const quizForm = quizPage.locator(
        '[data-testid="github-final-quiz"] form[data-question-id]',
      );
      await quizForm.locator('input[type="radio"]').first().check();

      await capstonePage.goto("/en/github/teaching-capstone/");
      const capstone = capstonePage.getByTestId("github-capstone");
      await capstone.locator('input[type="checkbox"]').first().check();

      await resetPage.goto(dashboard);
      await expect.poll(() => resetPage.evaluate(({ quizKey, capstoneKey }) => {
        const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
        return {
          quiz: Object.hasOwn(progress, quizKey),
          capstone: Object.hasOwn(progress, capstoneKey),
        };
      }, {
        quizKey: GITHUB_QUIZ_DRAFT_STORAGE_KEY,
        capstoneKey: GITHUB_CAPSTONE_DRAFT_STORAGE_KEY,
      })).toEqual({ quiz: true, capstone: true });

      const activeQuestionId = await quizForm.getAttribute("data-question-id");
      await resetPage.evaluate(() => {
        const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
        progress["github.lesson.start-secure"] = true;
        localStorage.setItem("ae.progress", JSON.stringify(progress));
      });
      await expect(
        quizForm,
        "an ordinary remote progress write must not reset the active quiz",
      ).toHaveAttribute("data-question-id", activeQuestionId!);
      await expect(
        capstone.locator('input[type="checkbox"]').first(),
        "an ordinary remote progress write must not reset live capstone work",
      ).toBeChecked();

      const reset = resetPage.getByRole("button", {
        name: "Reset GitHub course progress",
      });
      await expect(reset).toBeEnabled();
      resetPage.once("dialog", (dialog) => dialog.accept());
      await reset.click();

      await expect(
        quizPage.getByRole("button", { name: "Begin 12-question assessment" }),
      ).toBeVisible();
      await expect(quizForm).toHaveCount(0);
      await expect(capstone.locator('input[type="checkbox"]:checked')).toHaveCount(0);
      await expect(
        capstonePage.getByRole("button", { name: "Resume capstone draft" }),
      ).toHaveCount(0);

      const stored = await quizPage.evaluate(() =>
        JSON.parse(localStorage.getItem("ae.progress") || "{}"),
      );
      expect(stored[GITHUB_QUIZ_DRAFT_STORAGE_KEY]).toBeUndefined();
      expect(stored[GITHUB_CAPSTONE_DRAFT_STORAGE_KEY]).toBeUndefined();
      expect(stored["codex.lesson.meet-codex"]).toBe(true);
      expect(stored.unrelated).toBe(true);
    } finally {
      await context.close();
    }
  });

  test("Course 6 Phase 1 cross-tab reset overrides stale session fallback", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ baseURL });
    await context.addInitScript(() => {
      if (localStorage.getItem("ae.progress")) return;
      localStorage.setItem("ae.progress", JSON.stringify({
        "codex.lesson.meet-codex": true,
        unrelated: true,
      }));
    });
    const quizPage = await context.newPage();
    const resetPage = await context.newPage();
    try {
      await quizPage.goto(dashboard);
      await quizPage.evaluate(() => {
        const nativeSetItem = Storage.prototype.setItem;
        Object.defineProperty(Storage.prototype, "setItem", {
          configurable: true,
          value(this: Storage, key: string, value: string) {
            if (this === localStorage && key === "ae.progress") {
              throw new DOMException("Storage full", "QuotaExceededError");
            }
            return nativeSetItem.call(this, key, value);
          },
        });
      });
      await quizPage
        .getByRole("button", { name: "Begin 12-question assessment" })
        .click();
      const quizForm = quizPage.locator(
        '[data-testid="github-final-quiz"] form[data-question-id]',
      );
      await quizForm.locator('input[type="radio"]').first().check();
      await expect(
        quizPage.getByTestId("github-final-quiz").getByRole("status")
          .filter({ hasText: /browser.*local storage/i }),
      ).toBeVisible();
      expect(await quizPage.evaluate((draftKey) => {
        const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
        return Object.hasOwn(progress, draftKey);
      }, GITHUB_QUIZ_DRAFT_STORAGE_KEY)).toBe(false);

      await resetPage.goto(dashboard);
      const questionId = await quizForm.getAttribute("data-question-id");
      await resetPage.evaluate(() => {
        const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
        progress["github.lesson.start-secure"] = true;
        localStorage.setItem("ae.progress", JSON.stringify(progress));
      });
      await expect(
        quizForm,
        "ordinary remote progress must preserve an unsaved session attempt",
      ).toHaveAttribute("data-question-id", questionId!);

      await resetPage.reload();
      const reset = resetPage.getByRole("button", {
        name: "Reset GitHub course progress",
      });
      await expect(reset).toBeEnabled();
      resetPage.once("dialog", (dialog) => dialog.accept());
      await reset.click();

      await expect(quizForm).toHaveCount(0);
      await expect(
        quizPage.getByRole("button", { name: "Resume unfinished assessment" }),
      ).toHaveCount(0);
      await expect(
        quizPage.getByRole("button", { name: "Begin 12-question assessment" }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("Course 6 Phase 1 site-wide cross-tab removal clears a session-only attempt", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ baseURL });
    await context.addInitScript(() => {
      if (localStorage.getItem("ae.progress")) return;
      localStorage.setItem("ae.progress", JSON.stringify({
        "codex.lesson.meet-codex": true,
        unrelated: true,
      }));
    });
    const quizPage = await context.newPage();
    const resetPage = await context.newPage();
    try {
      await quizPage.goto(dashboard);
      await quizPage.evaluate(() => {
        const nativeSetItem = Storage.prototype.setItem;
        Object.defineProperty(Storage.prototype, "setItem", {
          configurable: true,
          value(this: Storage, key: string, value: string) {
            if (this === localStorage && key === "ae.progress") {
              throw new DOMException("Storage full", "QuotaExceededError");
            }
            return nativeSetItem.call(this, key, value);
          },
        });
      });
      await quizPage
        .getByRole("button", { name: "Begin 12-question assessment" })
        .click();
      const quizForm = quizPage.locator(
        '[data-testid="github-final-quiz"] form[data-question-id]',
      );
      await quizForm.locator('input[type="radio"]').first().check();
      await expect(
        quizPage.getByTestId("github-final-quiz").getByRole("status")
          .filter({ hasText: /browser.*local storage/i }),
      ).toBeVisible();

      await resetPage.goto(dashboard);
      await resetPage.evaluate(() => localStorage.removeItem("ae.progress"));

      await expect(quizForm).toHaveCount(0);
      await expect(
        quizPage.getByRole("button", { name: "Resume unfinished assessment" }),
      ).toHaveCount(0);
      await expect(
        quizPage.getByRole("button", { name: "Begin 12-question assessment" }),
      ).toBeVisible();
      expect(await quizPage.evaluate(() => localStorage.getItem("ae.progress")))
        .toBeNull();
    } finally {
      await context.close();
    }
  });

  test("Course 6 Phase 1 incomplete capstone is associated, focused, dark-safe, and clears pointer cursors", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(() => localStorage.setItem("ae.theme", "dark"));
    await page.goto("/en/github/teaching-capstone/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const capstone = page.getByTestId("github-capstone");
    const fieldset = capstone.locator("fieldset");
    const complete = capstone.getByRole("button", { name: "Complete capstone" });
    await complete.focus();
    await page.keyboard.press("Enter");

    await expect.soft(fieldset).toHaveAttribute("aria-invalid", "true");
    const describedBy = await fieldset.getAttribute("aria-describedby");
    expect.soft(describedBy, "incomplete capstone fieldset description").toBeTruthy();
    let error: Locator | null = null;
    if (describedBy) {
      error = page.locator(`[id="${describedBy}"]`);
      await expect.soft(error).toBeVisible();
      await expect.soft(error).toContainText(
        "Check every artifact before completing the capstone.",
      );
    }
    const correctionFocused = await page.evaluate((errorId) => {
      const firstUnchecked = document.querySelector<HTMLInputElement>(
        '[data-testid="github-capstone"] input[type="checkbox"]:not(:checked)',
      );
      const errorNode = errorId ? document.getElementById(errorId) : null;
      return document.activeElement === firstUnchecked || document.activeElement === errorNode;
    }, describedBy);
    expect.soft(correctionFocused, "incomplete capstone correction focus").toBe(true);
    await runAxe(page, "incomplete Course 6 capstone in dark theme");

    const checks = capstone.locator('input[type="checkbox"]');
    for (let index = 0; index < await checks.count(); index += 1) {
      await checks.nth(index).check();
    }
    await complete.click();
    await expect(capstone.locator('input[type="checkbox"]:not(:disabled)')).toHaveCount(0);
    const labels = capstone.locator("fieldset label");
    for (let index = 0; index < await labels.count(); index += 1) {
      expect.soft(
        await labels.nth(index).evaluate((element) => getComputedStyle(element).cursor),
        `completed capstone label ${index + 1} cursor`,
      ).not.toBe("pointer");
    }
  });

  test("Course 6 Phase 1 Arabic dark mobile map passes interacted axe and overflow checks", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addInitScript(() => localStorage.setItem("ae.theme", "dark"));
    await page.goto("/ar/github/teaching-capstone/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const mobileMap = page.getByTestId("github-mobile-course-map");
    const summary = mobileMap.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(mobileMap).toHaveAttribute("open", "");
    const active = mobileMap.locator(
      'a[href="/ar/github/teaching-capstone/"][aria-current="page"]',
    );
    await expect(active).toHaveAttribute(
      "href",
      "/ar/github/teaching-capstone/",
    );
    await expectInsideScrollport(
      active,
      mobileMap.getByTestId("github-mobile-course-map-scrollport"),
      "Arabic 320px Lesson 12",
    );
    await expectNoHorizontalOverflow(page, "Arabic dark open mobile course map");
    await runAxe(page, "Arabic dark open Course 6 mobile course map");
  });
});

test.describe("Course 6 Phase 2 UI/UX regressions", () => {
  test("Course 6 Phase 2 puts exactly one primary journey directly after the hero promise inside the first mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(dashboard);
    await waitForStableLayout(page);
    const course = page.getByTestId("github-course-dashboard");
    const promise = course.getByTestId("github-hero-promise");
    const journey = course.locator("[data-course-journey-action]:visible");
    await expect(promise).toBeVisible();
    await expect(
      journey,
      "the dashboard must expose one and only one primary learning journey",
    ).toHaveCount(1);

    const [promiseBounds, journeyBounds] = await Promise.all([
      promise.boundingBox(),
      journey.boundingBox(),
    ]);
    expect(promiseBounds, "hero promise geometry").not.toBeNull();
    expect(journeyBounds, "primary journey geometry").not.toBeNull();
    expect(journeyBounds!.y, "journey begins below the promise")
      .toBeGreaterThanOrEqual(promiseBounds!.y + promiseBounds!.height - 1);
    expect(
      journeyBounds!.y - (promiseBounds!.y + promiseBounds!.height),
      "journey follows the promise without an intervening content block",
    ).toBeLessThanOrEqual(32);
    expect(journeyBounds!.y, "journey top edge is visible").toBeGreaterThanOrEqual(0);
    expect(
      journeyBounds!.y + journeyBounds!.height,
      "the complete journey action is inside the first 844px viewport",
    ).toBeLessThanOrEqual(844);
    expect(journeyBounds!.x, "journey left edge").toBeGreaterThanOrEqual(-1);
    expect(
      journeyBounds!.x + journeyBounds!.width,
      "journey right edge",
    ).toBeLessThanOrEqual(391);
    expect(await promise.evaluate((element) => {
      const action = document.querySelector("[data-course-journey-action]");
      return Boolean(
        action &&
        element.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }), "journey follows the hero promise in document order").toBe(true);
  });

  test("Course 6 Phase 2 keeps the early capstone shortcut secondary and outlined", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(dashboard);
    const primary = page.locator("[data-course-journey-action]:visible");
    const shortcut = page.getByTestId("github-capstone-shortcut");
    await expect(primary).toHaveCount(1);
    await expect(shortcut).toBeVisible();
    await expect(shortcut).toHaveAttribute("data-action-variant", "secondary");
    const [primaryStyle, shortcutStyle] = await Promise.all([
      primary.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          border: style.borderTopColor,
        };
      }),
      shortcut.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          border: style.borderTopColor,
          borderStyle: style.borderTopStyle,
          borderWidth: Number.parseFloat(style.borderTopWidth),
        };
      }),
    ]);
    expect(shortcutStyle.background, "capstone shortcut is not filled like Start/Resume")
      .not.toBe(primaryStyle.background);
    expect(shortcutStyle.borderStyle, "capstone shortcut outline style").toBe("solid");
    expect(shortcutStyle.borderWidth, "capstone shortcut outline width")
      .toBeGreaterThanOrEqual(1);
    expect(shortcutStyle.border, "capstone shortcut exposes a visible outline")
      .not.toBe(shortcutStyle.background);
  });

  test("Course 6 Phase 2 completion indicators persist across dashboard and both lesson maps, remain links, and reset cleanly", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const lessonHref = "/en/github/start-secure/";
    const mapRoute = "/en/github/repository-readme/";

    const expectCompletedLink = async (link: Locator, label: string) => {
      await expect(link, `${label}: completed-state hook`)
        .toHaveAttribute("data-completion-state", "complete");
      await expect(link, `${label}: accessible completion`)
        .toHaveAccessibleName(/, Completed$/);
      await expect(link, `${label}: remains enabled`).toBeEnabled();
      await expect(link, `${label}: no fake disabled state`)
        .not.toHaveAttribute("aria-disabled", "true");
      const indicator = link.locator("[data-completion-indicator]");
      await expect(indicator, `${label}: subtle visual completion indicator`).toBeVisible();
      await expect(indicator).toHaveAttribute("aria-hidden", "true");
    };
    const expectResetLink = async (link: Locator, label: string) => {
      await expect(link, `${label}: reset-state hook`)
        .toHaveAttribute("data-completion-state", "incomplete");
      await expect(link, `${label}: completion removed from accessible name`)
        .not.toHaveAccessibleName(/, Completed$/);
      await expect(link.locator("[data-completion-indicator]"), `${label}: indicator removed`)
        .toHaveCount(0);
      await expect(link, `${label}: remains navigable after reset`).toBeEnabled();
    };

    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(lessonHref);
    await page.getByRole("button", { name: "Mark lesson complete" }).click();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Lesson complete", exact: true }),
    ).toBeDisabled();

    await page.goto(dashboard);
    await page.reload();
    const dashboardLink = page.locator(
      `section[aria-labelledby="github-curriculum-title"] a[href="${lessonHref}"]`,
    );
    await expectCompletedLink(dashboardLink, "dashboard curriculum");

    await page.goto(mapRoute);
    const desktopLink = page.getByTestId("github-desktop-course-map")
      .locator(`a[href="${lessonHref}"]`);
    await expectCompletedLink(desktopLink, "desktop lesson map");

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileMap = page.getByTestId("github-mobile-course-map");
    await mobileMap.locator("summary").click();
    const mobileLink = mobileMap.locator(`a[href="${lessonHref}"]`);
    await expectCompletedLink(mobileLink, "mobile lesson map");

    await page.goto(dashboard);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset GitHub course progress" }).click();
    await expectResetLink(page.locator(
      `section[aria-labelledby="github-curriculum-title"] a[href="${lessonHref}"]`,
    ), "reset dashboard curriculum");

    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(mapRoute);
    await expectResetLink(
      page.getByTestId("github-desktop-course-map").locator(`a[href="${lessonHref}"]`),
      "reset desktop lesson map",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const resetMobileMap = page.getByTestId("github-mobile-course-map");
    await resetMobileMap.locator("summary").click();
    await expectResetLink(
      resetMobileMap.locator(`a[href="${lessonHref}"]`),
      "reset mobile lesson map",
    );
  });

  test("Course 6 Phase 2 reset reports storage failure truthfully and retained progress returns after reload", async ({
    page,
  }) => {
    const retainedProgress = {
      "github.lesson.start-secure": true,
      "github.future.setting": "preserve-me",
      unrelated: true,
    };
    await page.addInitScript((fixture) => {
      localStorage.setItem("ae.progress", JSON.stringify(fixture));
      const nativeSetItem = Storage.prototype.setItem;
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value(this: Storage, key: string, value: string) {
          if (key === "ae.progress") {
            throw new DOMException("Storage full", "QuotaExceededError");
          }
          return nativeSetItem.call(this, key, value);
        },
      });
    }, retainedProgress);

    await page.goto(dashboard);
    const progressPanel = page.getByTestId("github-course-progress");
    const reset = progressPanel.getByRole("button", {
      name: "Reset GitHub course progress",
    });
    await expect(reset).toBeEnabled();
    page.once("dialog", (dialog) => dialog.accept());
    await reset.click();

    const resetStatus = progressPanel.locator(
      'p[role="status"][tabindex="-1"]',
    );
    await expect(resetStatus).toBeFocused();
    await expect(resetStatus).toHaveText(
      "Progress was cleared for this tab, but the browser could not save the reset. It may return after reload.",
    );
    await expect(
      progressPanel.getByRole("status")
        .filter({ hasText: /browser.*local storage/i }),
    ).toBeVisible();
    await expect(
      progressPanel.getByText("GitHub course progress was reset.", { exact: true }),
    ).toHaveCount(0);
    const [statusColors, warningColors, successColors] = await Promise.all([
      resetStatus.evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, color: style.color };
      }),
      Promise.all([
        resolvedCssColor(page, "--gold-soft"),
        resolvedCssColor(page, "--ink-2"),
      ]),
      Promise.all([
        resolvedCssColor(page, "--green-soft"),
        resolvedCssColor(page, "--green"),
      ]),
    ]);
    expect(statusColors).toEqual({
      background: warningColors[0],
      color: warningColors[1],
    });
    expect(statusColors).not.toEqual({
      background: successColors[0],
      color: successColors[1],
    });
    expect(await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    )).toEqual(retainedProgress);

    await page.reload();
    await expect(
      progressPanel.getByRole("button", { name: "Reset GitHub course progress" }),
    ).toBeEnabled();
    await expect(
      page.locator(
        'section[aria-labelledby="github-curriculum-title"] a[href="/en/github/start-secure/"]',
      ),
    ).toHaveAttribute("data-completion-state", "complete");
  });

  test("Course 6 Phase 2 capstone journey targets and focuses the Lesson 12 checklist", async ({
    page,
  }) => {
    await page.addInitScript(({ lessonSlugs, bankVersion }) => {
      localStorage.setItem("ae.progress", JSON.stringify({
        ...Object.fromEntries(
          lessonSlugs.map((slug) => [`github.lesson.${slug}`, true]),
        ),
        "github.quiz.best": 10,
        "github.quiz.passed": true,
        "github.quiz.version": bankVersion,
        "github.capstone.v1": false,
      }));
    }, {
      lessonSlugs: GITHUB_LESSON_SLUGS,
      bankVersion: GITHUB_FINAL_QUIZ.bankVersion,
    });
    await page.goto(dashboard);
    const journey = page.locator("[data-course-journey-action]:visible");
    await expect(journey).toHaveCount(1);
    await expect(journey).toHaveAttribute(
      "href",
      "/en/github/teaching-capstone/#github-capstone",
    );
    await journey.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      /\/en\/github\/teaching-capstone\/#github-capstone$/,
    );
    const checklist = page.locator("#github-capstone");
    await expect(checklist).toBeVisible();
    await expect(checklist).toHaveAttribute("tabindex", "-1");
    await expect(checklist).toBeFocused();
  });

  test("Course 6 Phase 2 functional desktop and mobile navigation text stays at least 13px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(dashboard);
    await expectMinimumFontSize(
      page.locator(
        'section[aria-labelledby="github-contexts-title"] a small',
      ).first(),
      "desktop context-card summary",
    );

    await page.goto("/en/github/repository-readme/");
    const desktopMap = page.getByTestId("github-desktop-course-map");
    await expectMinimumFontSize(
      desktopMap.locator("nav > strong"),
      "desktop course-map title",
    );
    await expectMinimumFontSize(
      desktopMap.locator("nav p").first(),
      "desktop course-map unit title",
    );
    await expectMinimumFontSize(
      desktopMap.locator("nav a").first(),
      "desktop course-map lesson link",
    );
    const provenance = page.getByTestId("github-figure-fig-01").locator("figcaption small");
    await expect(provenance).toBeVisible();
    expect(
      await provenance.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      "nonessential provenance remains legible without being forced into the 13px functional-text contract",
    ).toBeGreaterThan(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileMap = page.getByTestId("github-mobile-course-map");
    const summary = mobileMap.locator("summary");
    await expectMinimumFontSize(
      summary.locator(":scope > span:first-child > span:first-child"),
      "mobile course-map position",
    );
    await expectMinimumFontSize(
      summary.locator(":scope > span:first-child > span:nth-child(2)"),
      "mobile course-map current title",
    );
    await summary.click();
    const scrollport = mobileMap.getByTestId("github-mobile-course-map-scrollport");
    await expectMinimumFontSize(
      scrollport.locator("nav p").first(),
      "mobile course-map unit title",
    );
    await expectMinimumFontSize(
      scrollport.locator("nav a").first(),
      "mobile course-map lesson link",
    );
  });

  for (const locale of ["ar", "zh-Hans"] as const) {
    test(`Course 6 Phase 2 ${locale} formats lesson, minute, source, score, and percent numbers`, async ({
      page,
    }) => {
      const lesson = GITHUB_LESSONS
        .find((candidate) => candidate.slug === "repository-readme")!;
      const number = (value: number) => formatGithubNumber(locale, value);
      const progressFixture = {
        "github.lesson.start-secure": true,
        "github.quiz.best": 7,
        "github.quiz.passed": false,
        "github.quiz.version": GITHUB_FINAL_QUIZ.bankVersion,
      };
      const setupProgress = async (routePage: Page) => {
        await routePage.addInitScript((progress) => {
          localStorage.setItem("ae.progress", JSON.stringify(progress));
        }, progressFixture);
      };
      let pageErrorCount = 0;
      const observePageErrors = (routePage: Page) => {
        routePage.on("pageerror", () => { pageErrorCount += 1; });
      };
      page.context().on("page", observePageErrors);

      await withIsolatedRoutePage(
        page,
        `/${locale}/github/`,
        async (routePage) => {
          await expect(routePage.locator("html")).toHaveAttribute(
            "dir",
            locale === "ar" ? "rtl" : "ltr",
          );
          const facts = routePage.getByTestId("github-course-dashboard")
            .locator("header aside dl dd");
          await expect(facts).toHaveText([
            number(GITHUB_LESSON_SLUGS.length),
            number(GITHUB_FIGURES.length),
            number(GITHUB_FINAL_QUIZ.questionCount),
          ]);
          await expect(routePage.getByTestId("github-progress-percent"))
            .toHaveText(formatGithubPercent(locale, 1 / (GITHUB_LESSON_SLUGS.length + 2)));
          await expect(routePage.getByTestId("github-quiz-best-score"))
            .toContainText(number(7));
          await expect(routePage.getByTestId("github-quiz-best-score"))
            .toContainText(number(GITHUB_FINAL_QUIZ.questionCount));
        },
        {
          setup: setupProgress,
          viewport: { width: 390, height: 844 },
        },
      );

      await withIsolatedRoutePage(
        page,
        `/${locale}/github/repository-readme/`,
        async (routePage) => {
          const metaValues = routePage
            .getByTestId("github-lesson-repository-readme")
            .locator("article > header dl dd");
          await expect(metaValues).toHaveText([
            number(lesson.minutes),
            number(lesson.sourceIds.length),
          ]);
          const summary = routePage
            .getByTestId("github-mobile-course-map")
            .locator("summary");
          await expect(summary).toContainText(number(lesson.order));
          await expect(summary).toContainText(
            number(GITHUB_LESSON_SLUGS.length),
          );
        },
        {
          setup: setupProgress,
          viewport: { width: 390, height: 844 },
        },
      );
      page.context().off("page", observePageErrors);
      expect(
        pageErrorCount,
        `${locale}: deterministic number formatting hydrates without page errors`,
      ).toBe(0);
    });
  }

  test("Course 6 Phase 2 visible figure and source provenance dates use semantic ISO time elements", async ({
    page,
  }) => {
    await page.goto("/en/github/repository-readme/");
    const figures = page.locator('figure[data-testid^="github-figure-"]');
    const expectedFigureCount = GITHUB_FIGURES.filter(
      (figure) => figure.lessonSlug === "repository-readme",
    ).length;
    await expect(figures).toHaveCount(expectedFigureCount);
    const figureTimes = figures.locator("figcaption time[datetime]");
    await expect.soft(figureTimes, "one semantic observed date per figure")
      .toHaveCount(expectedFigureCount);
    for (let index = 0; index < await figureTimes.count(); index += 1) {
      const time = figureTimes.nth(index);
      await expect.soft(time).toBeVisible();
      expect.soft(await time.getAttribute("datetime"), `figure date ${index + 1}`)
        .toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    const sourceItems = page.locator(
      'section[aria-labelledby="github-sources-title"] > ol > li',
    );
    const sourceCount = await sourceItems.count();
    expect(sourceCount, "source provenance inventory").toBeGreaterThan(0);
    const sourceTimes = sourceItems.locator("time[datetime]");
    await expect.soft(sourceTimes, "one semantic accessed date per source")
      .toHaveCount(sourceCount);
    for (let index = 0; index < await sourceTimes.count(); index += 1) {
      const time = sourceTimes.nth(index);
      await expect.soft(time).toBeVisible();
      expect.soft(await time.getAttribute("datetime"), `source date ${index + 1}`)
        .toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    await page.goto(dashboard);
    const snapshotTime = page.locator(
      'aside[aria-labelledby="github-course-sources-title"] time[datetime]',
    );
    await expect(snapshotTime).toHaveCount(1);
    await expect(snapshotTime).toBeVisible();
    expect(await snapshotTime.getAttribute("datetime"))
      .toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("Course 6 Phase 2 full-size figure action is explicit and opens a new tab without losing the course", async ({
    page,
  }) => {
    await page.goto("/en/github/repository-readme/");
    const figure = page.getByTestId("github-figure-fig-01");
    const action = figure.getByTestId("github-figure-fullsize-action");
    await expect(action).toBeVisible();
    await expect(action).toHaveAccessibleName(/open.+full.?size/i);
    await expect(action).toHaveAttribute("target", "_blank");
    const rel = (await action.getAttribute("rel") ?? "").split(/\s+/);
    expect(rel).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));

    const courseUrl = page.url();
    const [fullSize] = await Promise.all([
      page.waitForEvent("popup"),
      action.click(),
    ]);
    try {
      await expect.poll(() => fullSize.url()).toContain(
        "/courses/github/figures/01-create-menu.png",
      );
      expect(page.url(), "opening the full-size figure preserves the course page")
        .toBe(courseUrl);
      await expect(page.getByTestId("github-lesson-repository-readme")).toBeVisible();
    } finally {
      await fullSize.close();
    }
  });
});

test.describe("Course 6 Phase 3 premium interaction and quality gates", () => {
  test("Course 6 Phase 3 exposes distinct hover, active, disabled, and focus states without geometry motion", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const snapshot = async (target: Locator) => {
      await expect(target).toBeVisible();
      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      return {
        box: box!,
        style: await target.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            background: style.backgroundColor,
            border: style.borderTopColor,
            boxShadow: style.boxShadow,
            color: style.color,
            cursor: style.cursor,
            opacity: Number.parseFloat(style.opacity),
            outlineStyle: style.outlineStyle,
            outlineWidth: Number.parseFloat(style.outlineWidth),
            transform: style.transform,
          };
        }),
      };
    };
    const expectSameGeometry = (
      before: Awaited<ReturnType<typeof snapshot>>["box"],
      after: Awaited<ReturnType<typeof snapshot>>["box"],
      label: string,
    ) => {
      expect.soft(after.width, `${label}: width`).toBeCloseTo(before.width, 1);
      expect.soft(after.height, `${label}: height`).toBeCloseTo(before.height, 1);
    };

    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(dashboard);
    const primary = page.getByTestId("github-hero-journey-action");
    await page.mouse.move(0, 0);
    const resting = await snapshot(primary);

    await primary.hover();
    await expect.poll(() => primary.evaluate((element) => {
      const style = getComputedStyle(element);
      return `${style.backgroundColor}|${style.borderTopColor}`;
    }), { message: "primary hover transition settles" })
      .not.toBe(`${resting.style.background}|${resting.style.border}`);
    const hovered = await snapshot(primary);
    expect.soft(
      `${hovered.style.background}|${hovered.style.border}`,
      "primary hover state",
    ).not.toBe(`${resting.style.background}|${resting.style.border}`);
    expectSameGeometry(resting.box, hovered.box, "primary hover geometry");

    await page.mouse.down();
    const active = await snapshot(primary);
    expect.soft(active.style.boxShadow, "primary active state").not.toBe(
      hovered.style.boxShadow,
    );
    expect.soft(active.style.transform, "active feedback does not move geometry")
      .toBe("none");
    expectSameGeometry(resting.box, active.box, "primary active geometry");
    await page.mouse.move(0, 0);
    await page.mouse.up();

    await page.keyboard.press("Tab");
    await primary.focus();
    await expect(primary).toBeFocused();
    const focused = await snapshot(primary);
    expect.soft(focused.style.outlineStyle, "primary focus outline style")
      .not.toBe("none");
    expect.soft(focused.style.outlineWidth, "primary focus outline width")
      .toBeGreaterThanOrEqual(2);
    expectSameGeometry(resting.box, focused.box, "primary focus geometry");

    const reset = page.getByTestId("github-course-progress").getByRole("button", {
      name: "Reset GitHub course progress",
    });
    await expect(reset).toBeDisabled();
    const disabledReset = await snapshot(reset);
    expect.soft(disabledReset.style.cursor, "disabled reset cursor").not.toBe("pointer");
    expect.soft(disabledReset.style.opacity, "disabled reset opacity").toBeLessThan(1);
    await expectMinimumTarget(reset, "disabled reset action");

    await page.goto("/en/github/repository-readme/");
    const completion = page
      .getByTestId("github-lesson-completion-repository-readme")
      .getByRole("button");
    await expectMinimumTarget(completion, "lesson completion action");
    await completion.click();
    await expect(completion).toBeDisabled();
    await expect(
      page
        .getByTestId("github-lesson-completion-repository-readme")
        .locator('[aria-live="polite"]'),
    ).toBeFocused();
    const disabledCompletion = await snapshot(completion);
    expect.soft(disabledCompletion.style.cursor, "disabled completion cursor")
      .not.toBe("pointer");
    expect.soft(disabledCompletion.style.opacity, "disabled completion opacity")
      .toBeLessThan(1);

    const activeLesson = page.getByTestId("github-desktop-course-map")
      .locator('a[aria-current="page"]');
    const lessonResting = await snapshot(activeLesson);
    await activeLesson.hover();
    await page.mouse.down();
    const lessonActive = await snapshot(activeLesson);
    expect.soft(lessonActive.style.boxShadow, "active lesson pressed state")
      .not.toBe(lessonResting.style.boxShadow);
    expect.soft(lessonActive.style.transform, "lesson link does not move when active")
      .toBe("none");
    expectSameGeometry(lessonResting.box, lessonActive.box, "lesson active geometry");
    await page.mouse.move(0, 0);
    await page.mouse.up();

    await page.setViewportSize({ width: 390, height: 844 });
    const summary = page.getByTestId("github-mobile-course-map").locator("summary");
    const summaryResting = await snapshot(summary);
    await summary.hover();
    await expect.poll(() => summary.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    )).not.toBe(summaryResting.style.background);
    const summaryHover = await snapshot(summary);
    expect.soft(summaryHover.style.background, "course-map summary hover")
      .not.toBe(summaryResting.style.background);
    expectSameGeometry(summaryResting.box, summaryHover.box, "summary hover geometry");
    await page.mouse.down();
    const summaryActive = await snapshot(summary);
    expect.soft(summaryActive.style.boxShadow, "course-map summary active")
      .not.toBe("none");
    expect.soft(
      await summary.evaluate((element) => element.matches(":active")),
      "course-map summary is in its native active state while pressed",
    ).toBe(true);
    expect.soft(summaryActive.style.transform, "summary does not move when active")
      .toBe("none");
    expectSameGeometry(summaryResting.box, summaryActive.box, "summary active geometry");
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await page.keyboard.press("Tab");
    await summary.focus();
    await expect(summary).toBeFocused();
    const summaryFocus = await snapshot(summary);
    expect.soft(
      summaryFocus.style.outlineWidth >= 2 || summaryFocus.style.boxShadow !== "none",
      "mobile summary exposes an unclipped custom focus indicator",
    ).toBe(true);

    await page.goto(dashboard);
    const quiz = page.getByTestId("github-final-quiz");
    await quiz.getByRole("button", { name: "Begin 12-question assessment" }).click();
    const form = quiz.locator("form[data-question-id]");
    const firstLabel = form.locator("fieldset label").first();
    const firstLabelResting = await snapshot(firstLabel);
    const firstRadio = firstLabel.locator('input[type="radio"]');
    await firstRadio.focus();
    const firstLabelFocused = await snapshot(firstLabel);
    expect.soft(firstLabelFocused.style.outlineStyle, "quiz option focus-within")
      .not.toBe("none");
    expect.soft(firstLabelFocused.style.outlineWidth, "quiz option focus width")
      .toBeGreaterThanOrEqual(2);
    await page.keyboard.press("Space");
    await expect(firstRadio).toBeChecked();
    await expect.poll(
      () => firstLabel.evaluate((element) => getComputedStyle(element).backgroundColor),
      { message: "selected quiz option receives container feedback" },
    ).not.toBe(firstLabelResting.style.background);
    await form.getByRole("button", { name: "Check answer" }).click();
    const disabledPlain = form.locator("fieldset label:not(:has(strong))").first();
    const disabledResting = await snapshot(disabledPlain);
    await disabledPlain.hover();
    await expect.poll(async () => {
      const disabledHover = await snapshot(disabledPlain);
      return {
        background: disabledHover.style.background,
        border: disabledHover.style.border,
      };
    }, { message: "disabled quiz option does not retain hover feedback" }).toEqual({
      background: disabledResting.style.background,
      border: disabledResting.style.border,
    });
    expect((await snapshot(disabledPlain)).style.cursor).not.toBe("pointer");
  });

  test("Course 6 Phase 3 keeps interaction changes interruptible and honors reduced motion", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(dashboard);

    const primary = page.getByTestId("github-hero-journey-action");
    const contextLink = page.locator(
      'section[aria-labelledby="github-contexts-title"] a',
    ).first();
    for (const [label, target] of [
      ["primary journey", primary],
      ["context lesson", contextLink],
    ] as const) {
      await target.hover();
      await page.mouse.move(0, 0);
      await page.keyboard.press("Tab");
      await target.focus();
      await expect(target).toBeFocused();
      await expect.poll(
        () => target.evaluate((element) => getComputedStyle(element).outlineStyle),
        { message: `${label}: final focus state wins after interrupted pointer state` },
      ).not.toBe("none");
      const motion = await target.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          animationDuration: style.animationDuration,
          transitionDuration: style.transitionDuration,
          transitionProperty: style.transitionProperty,
          transform: style.transform,
        };
      });
      expect.soft(motion.transitionProperty, `${label}: no implicit all transition`)
        .not.toContain("all");
      expect.soft(
        motion.transitionDuration.split(",").every((duration) =>
          Number.parseFloat(duration) === 0
        ),
        `${label}: reduced-motion transition duration`,
      ).toBe(true);
      expect.soft(
        motion.animationDuration.split(",").every((duration) => {
          const value = Number.parseFloat(duration);
          return duration.includes("ms") ? value <= 0.001 : value <= 0.000001;
        }),
        `${label}: reduced-motion animation duration`,
      ).toBe(true);
      expect.soft(motion.transform, `${label}: reduced-motion transform`).toBe("none");
    }
    expect(await page.locator("html").evaluate((element) =>
      getComputedStyle(element).scrollBehavior
    )).toBe("auto");

    await page.goto("/en/github/teaching-capstone/");
    const mobileMap = page.getByTestId("github-mobile-course-map");
    const summary = mobileMap.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(mobileMap).toHaveAttribute("open", "");
    await expectInsideScrollport(
      mobileMap.locator('a[aria-current="page"]'),
      mobileMap.getByTestId("github-mobile-course-map-scrollport"),
      "reduced-motion Lesson 12 reveal",
    );
    const summaryMotion = await summary.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        transitionDuration: style.transitionDuration,
        transitionProperty: style.transitionProperty,
        transform: style.transform,
      };
    });
    expect(summaryMotion.transitionProperty).not.toContain("all");
    expect(summaryMotion.transitionDuration.split(",").every((duration) =>
      Number.parseFloat(duration) === 0
    )).toBe(true);
    expect(summaryMotion.transform).toBe("none");
  });

  test("Course 6 Phase 3 binds light, dark, RTL, CJK, long-label, overflow, active-map, and 44px layout contracts", async ({
    page,
  }) => {
    test.setTimeout(360_000);
    const cases = [
      { locale: "fr", width: 320, height: 900, route: "", theme: "light", dir: "ltr" },
      { locale: "es", width: 320, height: 900, route: "", theme: "light", dir: "ltr" },
      { locale: "en", width: 390, height: 844, route: "teaching-capstone/", theme: "light", dir: "ltr" },
      { locale: "zh-Hans", width: 768, height: 900, route: "teaching-capstone/", theme: "light", dir: "ltr" },
      { locale: "ar", width: 900, height: 900, route: "teaching-capstone/", theme: "dark", dir: "rtl" },
      { locale: "en", width: 1440, height: 1000, route: "", theme: "light", dir: "ltr" },
    ] as const;

    for (const item of cases) {
      await test.step(
        `${item.locale} ${item.theme} ${item.width}px`,
        async () => withIsolatedRoutePage(
          page,
          `/${item.locale}/github/${item.route}`,
          async (routePage) => {
            await expect(routePage.locator("html")).toHaveAttribute("lang", item.locale);
            await expect(routePage.locator("html")).toHaveAttribute("dir", item.dir);
            await expect(routePage.locator("html")).toHaveAttribute(
              "data-theme",
              item.theme,
            );
            await expectNoHorizontalOverflow(
              routePage,
              `${item.locale} ${item.theme} ${item.width}px`,
            );

            if (!item.route) {
              await expectMinimumTarget(
                routePage.getByTestId("github-hero-journey-action"),
                `${item.locale} ${item.width}px primary journey`,
              );
              await expectMinimumTarget(
                routePage.getByTestId("github-capstone-shortcut"),
                `${item.locale} ${item.width}px capstone shortcut`,
              );
              const actionGeometry = await routePage
                .locator('[data-course-journey-action], [data-testid="github-capstone-shortcut"]')
                .evaluateAll((elements) => elements.map((element) => ({
                  clientWidth: element.clientWidth,
                  scrollWidth: element.scrollWidth,
                })));
              expect.soft(
                actionGeometry.every((entry) => entry.scrollWidth <= entry.clientWidth + 1),
                `${item.locale} localized actions wrap without clipping`,
              ).toBe(true);
              return;
            }

            const mobileMap = routePage.getByTestId("github-mobile-course-map");
            await expect(mobileMap).toBeVisible();
            await expect(routePage.getByTestId("github-desktop-course-map")).toBeHidden();
            const summary = mobileMap.locator("summary");
            await expectMinimumTarget(summary, `${item.locale} ${item.width}px map summary`);
            await summary.focus();
            await routePage.keyboard.press("Enter");
            await expect(mobileMap).toHaveAttribute("open", "");
            const links = mobileMap.locator('a[href^="/' + item.locale + '/github/"]');
            await expectMinimumTarget(links, `${item.locale} ${item.width}px map links`);
            const active = mobileMap.locator('a[aria-current="page"]');
            await expectInsideScrollport(
              active,
              mobileMap.getByTestId("github-mobile-course-map-scrollport"),
              `${item.locale} ${item.width}px active Lesson 12`,
            );
            const capstone = routePage.getByTestId("github-capstone");
            await expectMinimumTarget(
              capstone.locator("fieldset label"),
              `${item.locale} ${item.width}px capstone labels`,
            );
            await expectMinimumTarget(
              capstone.getByRole("button"),
              `${item.locale} ${item.width}px capstone action`,
            );
          },
          {
            setup: async (routePage) => {
              await routePage.addInitScript((theme) => {
                localStorage.clear();
                localStorage.setItem("ae.theme", theme);
              }, item.theme);
            },
            viewport: { width: item.width, height: item.height },
          },
        ),
      );
    }

    for (const locale of ["fr", "es"] as const) {
      for (const width of [320, 390] as const) {
        await test.step(`${locale} Lesson 2 inline code at ${width}px`, async () =>
          withIsolatedRoutePage(
            page,
            `/${locale}/github/repository-readme/`,
            async (routePage) => {
              await expectNoHorizontalOverflow(
                routePage,
                `${locale} Lesson 2 at ${width}px`,
              );
              const phrase = routePage.locator("code", {
                hasText: "Add repository purpose and working agreement",
              }).first();
              await expect(phrase).toBeVisible();
              const fragments = await phrase.evaluate((element) => {
                const range = document.createRange();
                range.selectNodeContents(element);
                return [...range.getClientRects()].map((rectangle) => ({
                  left: rectangle.left,
                  right: rectangle.right,
                }));
              });
              expect.soft(fragments.length, `${locale} ${width}px wrapped fragments`)
                .toBeGreaterThan(1);
              expect.soft(
                fragments.every((fragment) =>
                  fragment.left >= -1 && fragment.right <= width + 1
                ),
                `${locale} ${width}px inline-code fragments stay in viewport`,
              ).toBe(true);
            },
            { viewport: { width, height: 900 } },
          )
        );
      }
    }

    await withIsolatedRoutePage(
      page,
      dashboard,
      async (routePage) => {
        const exportAction = routePage
          .getByTestId("github-completion-summary")
          .getByRole("button", { name: /export completion summary/i });
        await expect(exportAction).toBeVisible();
        await expectMinimumTarget(
          exportAction,
          "completion-summary export action",
        );
      },
      {
        setup: async (routePage) => {
          await routePage.addInitScript(({ lessonSlugs, bankVersion }) => {
            localStorage.setItem("ae.progress", JSON.stringify({
              ...Object.fromEntries(
                lessonSlugs.map((slug) => [`github.lesson.${slug}`, true]),
              ),
              "github.quiz.best": 12,
              "github.quiz.passed": true,
              "github.quiz.version": bankVersion,
              "github.capstone.v1": true,
            }));
          }, {
            lessonSlugs: GITHUB_LESSON_SLUGS,
            bankVersion: GITHUB_FINAL_QUIZ.bankVersion,
          });
        },
        viewport: { width: 390, height: 900 },
      },
    );
  });

  test("Course 6 Phase 3 supports keyboard disclosure, active reveal, checkpoint, previous-next navigation, and interacted lesson Axe", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/en/github/teaching-capstone/");
    const mobileMap = page.getByTestId("github-mobile-course-map");
    const mapSummary = mobileMap.locator("summary");
    await expectMinimumTarget(mapSummary, "keyboard mobile map summary");
    await mapSummary.focus();
    await page.keyboard.press("Enter");
    await expect(mobileMap).toHaveAttribute("open", "");
    await expectInsideScrollport(
      mobileMap.locator('a[aria-current="page"]'),
      mobileMap.getByTestId("github-mobile-course-map-scrollport"),
      "keyboard active Lesson 12 reveal",
    );
    await page.keyboard.press("Space");
    await expect(mobileMap).not.toHaveAttribute("open", "");

    await page.goto("/en/github/repository-readme/");

    const checkpoint = page.locator(
      'section[aria-labelledby="github-checkpoint-title"] details',
    );
    const checkpointSummary = checkpoint.locator(":scope > summary");
    await expectMinimumTarget(checkpointSummary, "checkpoint disclosure");
    await checkpointSummary.focus();
    await page.keyboard.press("Enter");
    await expect(checkpoint).toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(checkpoint).not.toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(checkpoint).toHaveAttribute("open", "");
    await runAxe(page, "Course 6 lesson with open checkpoint");

    const next = page.locator('[data-course-lesson-nav] a[rel="next"]');
    await expectMinimumTarget(next, "next lesson pager");
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/github\/branches-commits\/$/);
    await expect(page.locator("main h1").first()).toBeFocused();

    const previous = page.locator('[data-course-lesson-nav] a[rel="prev"]');
    await expectMinimumTarget(previous, "previous lesson pager");
    await previous.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/github\/repository-readme\/$/);
    await expect(page.locator("main h1").first()).toBeFocused();
  });

  test("Course 6 Phase 3 supports keyboard quiz progression, exact interrupted restoration, and failed-passed Axe semantics", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.goto(dashboard);
    const quiz = page.getByTestId("github-final-quiz");
    const begin = quiz.getByRole("button", { name: "Begin 12-question assessment" });
    await expectMinimumTarget(begin, "begin assessment action");
    await begin.focus();
    await page.keyboard.press("Enter");

    let form = quiz.locator("form[data-question-id]");
    await expect(form.locator("h3")).toBeFocused();
    const firstQuestionId = await form.getAttribute("data-question-id");
    expect(firstQuestionId).toBeTruthy();
    const firstOption = form.locator('input[type="radio"]').first();
    await firstOption.focus();
    await page.keyboard.press("Space");
    await expect(firstOption).toBeChecked();
    await expectMinimumTarget(form.locator("fieldset label"), "quiz option labels");
    const check = form.getByRole("button", { name: "Check answer" });
    await expectMinimumTarget(check, "check-answer action");
    await check.focus();
    await page.keyboard.press("Enter");
    await expect(form.getByRole("status")).toBeFocused();
    const next = form.getByRole("button", { name: "Next question" });
    await next.focus();
    await page.keyboard.press("Enter");

    form = quiz.locator("form[data-question-id]");
    const secondQuestionId = await form.getAttribute("data-question-id");
    expect(secondQuestionId).toBeTruthy();
    expect(secondQuestionId).not.toBe(firstQuestionId);
    await expect(form.locator("h3")).toBeFocused();
    const selectedIndex = 1;
    const secondOption = form.locator('input[type="radio"]').nth(selectedIndex);
    await secondOption.focus();
    await page.keyboard.press("Space");
    await expect(secondOption).toBeChecked();

    await page.reload();
    const resume = quiz.getByRole("button", { name: "Resume unfinished assessment" });
    await resume.focus();
    await page.keyboard.press("Enter");
    form = quiz.locator("form[data-question-id]");
    await expect(form).toHaveAttribute("data-question-id", secondQuestionId!);
    await expect(form.locator("h3")).toBeFocused();
    await expect(form.locator('input[type="radio"]').nth(selectedIndex)).toBeChecked();
    await form.getByRole("button", { name: "Check answer" }).focus();
    await page.keyboard.press("Enter");
    await expect(form.getByRole("status")).toBeFocused();
    await form.getByRole("button", { name: "Next question" }).focus();
    await page.keyboard.press("Enter");

    for (let index = 2; index < GITHUB_FINAL_QUIZ.questionCount; index += 1) {
      form = quiz.locator("form[data-question-id]");
      const questionId = await form.getAttribute("data-question-id");
      expect(questionId).toBeTruthy();
      const correct = correctIndex.get(questionId!)!;
      await form.locator('input[type="radio"]').nth((correct + 1) % 4).check();
      await form.getByRole("button", { name: "Check answer" }).click();
      await form.getByRole("button", {
        name:
          index === GITHUB_FINAL_QUIZ.questionCount - 1
            ? "Finish assessment"
            : "Next question",
      }).click();
    }

    const result = quiz.locator(':scope > [role="status"][data-result-state]');
    await expect(result).toBeFocused();
    await expect(result).toHaveAttribute("data-result-state", "retry");
    const retryStyle = await result.evaluate((element) => {
      const style = getComputedStyle(element);
      const score = element.querySelector("strong");
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
        score: score ? getComputedStyle(score).color : "",
      };
    });
    const [goldSoft, goldLine, gold, greenSoft] = await Promise.all([
      resolvedCssColor(page, "--gold-soft"),
      resolvedCssColor(page, "--gold-line"),
      resolvedCssColor(page, "--gold"),
      resolvedCssColor(page, "--green-soft"),
    ]);
    expect(retryStyle).toEqual({ background: goldSoft, border: goldLine, score: gold });
    expect(retryStyle.background).not.toBe(greenSoft);
    await runAxe(page, "failed Course 6 assessment after keyboard progression");

    const retry = result.getByRole("button", { name: "Try a new set" });
    await retry.focus();
    await page.keyboard.press("Enter");
    await finishQuiz(page, 10);
    await expect(result).toHaveAttribute("data-result-state", "passed");
    await runAxe(page, "passed Course 6 assessment after keyboard progression");
  });

  test("Course 6 Phase 3 supports partial capstone restoration, keyboard validation, completed disabled states, targets, and Axe", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(() => localStorage.setItem("ae.theme", "dark"));
    await page.goto("/en/github/teaching-capstone/");
    let capstone = page.getByTestId("github-capstone");
    let labels = capstone.locator("fieldset label");
    let checks = capstone.locator('input[type="checkbox"]');
    const complete = capstone.getByRole("button", { name: "Complete capstone" });
    await expectMinimumTarget(labels, "capstone checkbox labels");
    await expectMinimumTarget(complete, "complete capstone action");

    await checks.nth(0).focus();
    await page.keyboard.press("Space");
    await checks.nth(3).focus();
    await page.keyboard.press("Space");
    await expect(checks.nth(0)).toBeChecked();
    await expect(checks.nth(3)).toBeChecked();

    await page.reload();
    const resume = page.getByRole("button", { name: "Resume capstone draft" });
    await resume.focus();
    await page.keyboard.press("Enter");
    capstone = page.getByTestId("github-capstone");
    labels = capstone.locator("fieldset label");
    checks = capstone.locator('input[type="checkbox"]');
    await expect(checks.nth(0)).toBeChecked();
    await expect(checks.nth(3)).toBeChecked();
    await expect(checks.nth(1)).not.toBeChecked();

    const restoredComplete = capstone.getByRole("button", {
      name: "Complete capstone",
    });
    await restoredComplete.focus();
    await page.keyboard.press("Enter");
    await expect(capstone.locator("fieldset")).toHaveAttribute("aria-invalid", "true");
    await expect(capstone.getByRole("alert")).toBeFocused();
    await runAxe(page, "incomplete restored Course 6 capstone in dark theme");

    for (let index = 0; index < await checks.count(); index += 1) {
      if (!await checks.nth(index).isChecked()) {
        await checks.nth(index).focus();
        await page.keyboard.press("Space");
      }
    }
    await restoredComplete.focus();
    await page.keyboard.press("Enter");
    const completedStatus = capstone.locator('p[role="status"]');
    await expect(completedStatus).toBeVisible();
    await expect(completedStatus).toBeFocused();
    await expect(capstone.locator('input[type="checkbox"]:not(:disabled)')).toHaveCount(0);
    await expectMinimumTarget(labels, "completed capstone labels");
    for (let index = 0; index < await labels.count(); index += 1) {
      expect.soft(
        await labels.nth(index).evaluate((element) => getComputedStyle(element).cursor),
        `completed capstone label ${index + 1} cursor`,
      ).not.toBe("pointer");
    }
    await runAxe(page, "completed Course 6 capstone in dark theme");
  });
});
