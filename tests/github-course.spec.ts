import { expect, test, type Page } from "@playwright/test";
import {
  GITHUB_FIGURES,
  GITHUB_FINAL_QUIZ,
  GITHUB_LESSON_SLUGS,
  GITHUB_LOCALES,
  GITHUB_QUIZ,
} from "../lib/github";
import { publishedSitemapUrls } from "./published-course-test-helpers";

const dashboard = "/en/github/";
const correctIndex: ReadonlyMap<string, number> = new Map(
  GITHUB_QUIZ.map((question) => [question.id, question.correctIndex]),
);

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
      const figures = page.locator('[data-testid^="github-figure-"]');
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
        expect(
          await image.evaluate((node: HTMLImageElement) => node.naturalWidth),
        ).toBe(expectedFigure.width);
        expect(
          await image.evaluate((node: HTMLImageElement) => node.naturalHeight),
        ).toBe(expectedFigure.height);
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
    page,
  }) => {
    for (const locale of GITHUB_LOCALES) {
      const response = await page.goto(`/${locale}/github/`);
      expect(response?.status(), locale).toBe(200);
      await expect(page.getByTestId("github-course-dashboard")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    }
    await page.goto("/ar/github/pull-requests-reviews/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page
        .getByTestId("github-figure-fig-07")
        .locator('a[aria-describedby="github-fig-07-caption"]'),
    ).toHaveAttribute("dir", "ltr");
    await expect(
      page.getByTestId("github-figure-fig-07").locator("img"),
    ).toBeVisible();
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
    await page.addInitScript(() => {
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
            "github.capstone.v1": false,
            unrelated: true,
          }),
        );
      }
    });
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
    expect(stored["github.capstone.v1"]).toBeUndefined();
    expect(stored["github.lesson.github-mental-model.practice"]).toBe(true);
    expect(stored["github.future.setting"]).toBe("preserve-me");
    expect(stored["codex.lesson.meet-codex"]).toBe(true);
    expect(stored.unrelated).toBe(true);
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
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        dashboard,
        "/en/github/projects-office-work/",
        "/ar/github/research-reproducibility/",
      ]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
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
