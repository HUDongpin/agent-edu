import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";
import { CURSOR_FINAL_QUIZ, CURSOR_QUIZ_BY_ID } from "../lib/cursor";

const dashboard = "/en/cursor/";
const firstLesson = "/en/cursor/orient-privacy/";
const capstoneLesson = "/en/cursor/workflow-capstone/";

const localizedFinalQuizLabels = {
  en: "Final quiz questions",
  es: "Preguntas del cuestionario final",
  fr: "Questions du quiz final",
  de: "Fragen im Abschlusstest",
  "zh-Hans": "期末测验题目",
  "zh-Hant": "期末測驗題目",
  ja: "最終クイズの問題",
  ko: "최종 퀴즈 문항",
  ar: "أسئلة الاختبار النهائي",
} as const;

async function runAxe(page: Page): Promise<unknown[]> {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const results = await (window as unknown as {
      axe: { run: (root: Document, options: Record<string, unknown>) => Promise<{ violations: unknown[] }> };
    }).axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      resultTypes: ["violations"],
    });
    return results.violations;
  });
}

async function completeFinalQuiz(page: Page, correctAnswers: number): Promise<void> {
  const quiz = page.getByTestId("cursor-final-quiz");
  for (let index = 0; index < CURSOR_FINAL_QUIZ.questionCount; index += 1) {
    const form = quiz.locator("form");
    const questionId = await form.getAttribute("data-question-id");
    const question = CURSOR_QUIZ_BY_ID[questionId as keyof typeof CURSOR_QUIZ_BY_ID];
    const option = index < correctAnswers
      ? form.locator(`input[value="${question.correctOptionId}"]`)
      : form.locator(`input[type="radio"]:not([value="${question.correctOptionId}"])`).first();
    await option.check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await quiz.getByRole("button", {
      name: index === CURSOR_FINAL_QUIZ.questionCount - 1 ? "Finish quiz" : "Next question",
    }).click();
  }
}

async function pressForwardTab(page: Page, browserName: string): Promise<void> {
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
}

test.describe("Cursor Course 4 Phase 2", () => {
  test("dashboard names the 12-question final quiz truthfully in every locale", async ({ page }) => {
    for (const [locale, label] of Object.entries(localizedFinalQuizLabels)) {
      await page.goto(`/${locale}/cursor/`);
      const fact = page.getByTestId("cursor-course-facts").locator("div").filter({ hasText: label });
      await expect(fact.locator("dt")).toHaveText(label);
      await expect(fact.locator("dd")).toHaveText("12");
    }
  });

  test("desktop keeps one rail while exposing stable, active lesson-section links", async ({ page }) => {
    await page.goto(firstLesson);
    const lessonMap = page.getByTestId("cursor-desktop-lesson-nav");
    const sectionMap = page.getByTestId("cursor-desktop-section-nav");
    await expect(lessonMap).toBeVisible();
    await expect(sectionMap).toBeVisible();
    await expect(lessonMap.locator("xpath=ancestor::aside")).toHaveCount(1);
    await expect(sectionMap.locator("xpath=ancestor::aside")).toHaveCount(1);
    expect(await lessonMap.locator("xpath=ancestor::aside").evaluate((element) => (
      element.querySelector('[data-testid="cursor-desktop-section-nav"]') !== null
    ))).toBe(true);

    const expected = [
      ["Learn", "#cursor-lesson-learn"],
      ["Practice", "#cursor-lesson-practice"],
      ["Checkpoint", "#cursor-lesson-checkpoint"],
      ["Knowledge check", "#cursor-lesson-knowledge-check"],
      ["Sources", "#cursor-lesson-sources"],
      ["Completion", "#cursor-lesson-completion"],
    ] as const;
    await expect(sectionMap.getByRole("link")).toHaveCount(expected.length);
    for (const [label, href] of expected) {
      const link = sectionMap.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      await expect(page.locator(href)).toHaveCount(1);
    }

    const prose = page.getByTestId("cursor-lesson-prose-0");
    await expect(prose.locator(":scope > p")).toHaveCount(2);

    const practiceLink = sectionMap.getByRole("link", { name: "Practice", exact: true });
    await practiceLink.click();
    await expect(page).toHaveURL(/#cursor-lesson-practice$/);
    await expect(practiceLink).toHaveAttribute("aria-current", "location");
    await expect.poll(() => page.evaluate(() => {
      const target = document.getElementById("cursor-lesson-practice")?.getBoundingClientRect();
      const header = document.querySelector("header.topbar")?.getBoundingClientRect();
      return Boolean(target && header && target.top >= header.bottom && target.top < 180);
    })).toBe(true);
  });

  test("mobile section control is distinct, sticky, touch-safe, and includes capstone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(capstoneLesson);
    const lessonMap = page.getByTestId("cursor-mobile-lesson-nav");
    const sectionMap = page.getByTestId("cursor-mobile-section-nav");
    await expect(lessonMap).toBeVisible();
    await expect(sectionMap).toBeVisible();
    await expect(sectionMap).toHaveCSS("position", "sticky");

    await sectionMap.locator("summary").click();
    const links = sectionMap.locator("nav a");
    await expect(links).toHaveCount(7);
    await expect(sectionMap.getByRole("link", { name: "Capstone", exact: true })).toHaveAttribute(
      "href",
      "#cursor-lesson-capstone",
    );
    const heights = await links.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);

    const knowledgeLink = sectionMap.locator('a[href="#cursor-lesson-knowledge-check"]');
    await knowledgeLink.click();
    await expect(page).toHaveURL(/#cursor-lesson-knowledge-check$/);
    await expect(sectionMap).not.toHaveAttribute("open", "");
    await expect(knowledgeLink).toHaveAttribute("aria-current", "location");
    await expect.poll(() => page.evaluate(() => {
      const target = document.getElementById("cursor-lesson-knowledge-check")?.getBoundingClientRect();
      const header = document.querySelector("header.topbar")?.getBoundingClientRect();
      const map = document.querySelector('[data-testid="cursor-mobile-section-nav"]')?.getBoundingClientRect();
      return Boolean(target && header && map && target.top >= Math.max(header.bottom, map.bottom) && target.top < 190);
    })).toBe(true);
    await expect(page.locator("#cursor-lesson-knowledge-check")).toBeFocused();
  });

  test("failed final quiz groups every missed item by unit and leads to remediation", async ({ page, browserName }) => {
    await page.goto(dashboard);
    const quiz = page.getByTestId("cursor-final-quiz");
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    const missedQuestionIds: string[] = [];

    for (let index = 0; index < CURSOR_FINAL_QUIZ.questionCount; index += 1) {
      const form = quiz.locator("form");
      const questionId = await form.getAttribute("data-question-id");
      const question = CURSOR_QUIZ_BY_ID[questionId as keyof typeof CURSOR_QUIZ_BY_ID];
      await form.locator(`input[type="radio"]:not([value="${question.correctOptionId}"])`).first().check();
      await quiz.getByRole("button", { name: "Check answer" }).click();
      if (await form.locator('[data-answer-state="incorrect"]').count()) {
        missedQuestionIds.push(questionId || "");
      }
      if (index < CURSOR_FINAL_QUIZ.questionCount - 1) {
        await quiz.getByRole("button", { name: "Next question" }).click();
      }
    }
    await quiz.getByRole("button", { name: "Finish quiz" }).click();

    const review = quiz.getByTestId("cursor-final-quiz-review");
    await expect(review).toBeVisible();
    await expect(review.locator("[data-unit-id]")).toHaveCount(4);
    expect(await review.locator("[data-unit-id]").evaluateAll((groups) => (
      groups.map((group) => group.getAttribute("data-unit-id"))
    ))).toEqual(["unit-1", "unit-2", "unit-3", "unit-4"]);
    expect(missedQuestionIds).toHaveLength(CURSOR_FINAL_QUIZ.questionCount);
    await expect(review.locator("[data-missed-question-id]")).toHaveCount(CURSOR_FINAL_QUIZ.questionCount);
    for (const questionId of missedQuestionIds) {
      const item = review.locator(`[data-missed-question-id="${questionId}"]`);
      await expect(item).toBeVisible();
      const question = CURSOR_QUIZ_BY_ID[questionId as keyof typeof CURSOR_QUIZ_BY_ID];
      await expect(item.getByRole("link")).toHaveAttribute(
        "href",
        `/en/cursor/${question.lessonSlug}/#cursor-lesson-knowledge-check`,
      );
    }

    const primaryReview = review.getByRole("link", { name: "Review missed lessons" });
    await expect(primaryReview).toHaveClass(/primaryAction/);
    await expect(review.getByRole("button", { name: "Retry quiz" })).toHaveClass(/secondaryAction/);
    await expect(quiz.locator('[role="status"][tabindex="-1"]')).toBeFocused();
    await pressForwardTab(page, browserName);
    await expect(primaryReview).toBeFocused();
    expect(await runAxe(page)).toEqual([]);

    await primaryReview.click();
    await expect(page).toHaveURL(/\/en\/cursor\/[a-z-]+\/#cursor-lesson-knowledge-check$/);
    await expect(page.locator("#cursor-lesson-knowledge-check")).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId("cursor-final-quiz-review")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("cursor-final-quiz-review").locator("[data-missed-question-id]")).toHaveCount(12);
    await page.goto("/ar/cursor/");
    const arabicReview = page.getByTestId("cursor-final-quiz-review");
    await expect(arabicReview.locator("[data-unit-id]")).toHaveCount(4);
    await expect(arabicReview.locator("a[href^='/ar/cursor/']")).toHaveCount(13);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    expect(await runAxe(page)).toEqual([]);
  });

  test("Arabic section navigation preserves RTL layout and an isolated content order", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar/cursor/orient-privacy/");
    const sectionMap = page.getByTestId("cursor-mobile-section-nav");
    await sectionMap.locator("summary").click();
    await expect(sectionMap.locator("nav")).toHaveAttribute("dir", "rtl");
    const heights = await sectionMap.locator("nav a").evaluateAll((items) => (
      items.map((item) => item.getBoundingClientRect().height)
    ));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    expect(await runAxe(page)).toEqual([]);
  });

  test("direct fragments and browser history keep the active section synchronized", async ({ page }) => {
    await page.goto(`${firstLesson}#cursor-lesson-sources`);
    const sectionMap = page.getByTestId("cursor-desktop-section-nav");
    const sources = sectionMap.locator('a[href="#cursor-lesson-sources"]');
    const completion = sectionMap.locator('a[href="#cursor-lesson-completion"]');
    await expect(sources).toHaveAttribute("aria-current", "location");
    await expect.poll(() => page.locator("#cursor-lesson-sources").evaluate((element) => (
      element.getBoundingClientRect().top < 180
    ))).toBe(true);

    await completion.click();
    await expect(page).toHaveURL(/#cursor-lesson-completion$/);
    await expect(completion).toHaveAttribute("aria-current", "location");
    await page.goBack();
    await expect(page).toHaveURL(/#cursor-lesson-sources$/);
    await expect(sources).toHaveAttribute("aria-current", "location");
  });

  test("long Latin, Arabic, Chinese, and Japanese teaching prose renders as balanced paragraphs", async ({ page }) => {
    for (const locale of ["en", "de", "ar", "zh-Hans", "ja"]) {
      await page.goto(`/${locale}/cursor/orient-privacy/`);
      const prose = page.getByTestId("cursor-lesson-prose-0");
      await expect(prose.locator(":scope > p")).toHaveCount(2);
      const paragraphLengths = await prose.locator(":scope > p").evaluateAll((paragraphs) => (
        paragraphs.map((paragraph) => paragraph.textContent?.trim().length ?? 0)
      ));
      expect(Math.min(...paragraphLengths), locale).toBeGreaterThan(80);
    }
  });

  test("late mobile lesson maps restore the active row and every locale remains touch-safe", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const locale of ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"]) {
      await page.goto(`/${locale}/cursor/workflow-capstone/`);
      const map = page.getByTestId("cursor-mobile-lesson-nav");
      await map.locator("summary").click();
      const nav = map.locator("nav");
      const current = nav.locator('a[aria-current="page"]');
      await expect.poll(() => current.evaluate((element) => {
        const link = element.getBoundingClientRect();
        const bounds = element.closest("nav")?.getBoundingClientRect();
        return Boolean(bounds && link.top >= bounds.top && link.bottom <= bounds.bottom);
      })).toBe(true);
      const rowHeights = await nav.locator("a").evaluateAll((links) => (
        links.map((link) => link.getBoundingClientRect().height)
      ));
      expect(Math.min(...rowHeights), locale).toBeGreaterThanOrEqual(44);

      if (locale === "en") {
        await nav.evaluate((element) => { element.scrollTop = 0; });
        await expect.poll(() => current.evaluate((element) => {
          const link = element.getBoundingClientRect();
          const bounds = element.closest("nav")?.getBoundingClientRect();
          return Boolean(bounds && (link.bottom < bounds.top || link.top > bounds.bottom));
        })).toBe(true);
        await map.locator("summary").click();
        await map.locator("summary").click();
        await expect.poll(() => current.evaluate((element) => {
          const link = element.getBoundingClientRect();
          const bounds = element.closest("nav")?.getBoundingClientRect();
          return Boolean(bounds && link.top >= bounds.top && link.bottom <= bounds.bottom);
        })).toBe(true);
      }
    }
  });

  test("language trigger and all locale rows remain 44px touch targets at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    for (const locale of ["en", "ar"]) {
      await page.goto(`/${locale}/cursor/`);
      const trigger = page.locator(".langwrap > button");
      const triggerBox = await trigger.boundingBox();
      expect(triggerBox?.width, locale).toBeGreaterThanOrEqual(44);
      expect(triggerBox?.height, locale).toBeGreaterThanOrEqual(44);
      await trigger.click();
      const rows = page.getByRole("menuitem");
      await expect(rows).toHaveCount(9);
      const heights = await rows.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
      expect(Math.min(...heights), locale).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    }
  });

  test("the strict 10-of-12 boundary shows remediation only below passing", async ({ page }) => {
    await page.goto(dashboard);
    const quiz = page.getByTestId("cursor-final-quiz");
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    await completeFinalQuiz(page, 9);
    await expect(quiz.getByText("Score: 9 of 12", { exact: true })).toBeVisible();
    await expect(quiz.getByTestId("cursor-final-quiz-review")).toBeVisible();

    await quiz.getByRole("button", { name: "Retry quiz" }).click();
    await completeFinalQuiz(page, 10);
    await expect(quiz.getByText("Score: 10 of 12", { exact: true })).toBeVisible();
    await expect(quiz.getByText("Knowledge check passed", { exact: true })).toBeVisible();
    await expect(quiz.getByTestId("cursor-final-quiz-review")).toHaveCount(0);
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`Phase 2 navigation has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [firstLesson, capstoneLesson]) {
        await page.goto(path);
        expect(await page.evaluate(() => (
          document.documentElement.scrollWidth - document.documentElement.clientWidth
        )), path).toBeLessThanOrEqual(1);
      }
    });
  }
});
