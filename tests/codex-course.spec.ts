import type { Browser, Page } from "@playwright/test";
import axe from "axe-core";
import { expect, test } from "../e2e/fixtures";
import {
  CODEX_CAPSTONE_FIXTURE_SHA256,
  CODEX_CAPSTONE_FIXTURE_VERSION,
  CODEX_CAPSTONE_RECEIPT_SCHEMA,
  CODEX_CAPSTONE_REQUIRED_CHECKS,
} from "../lib/codex/capstone";
import { CODEX_COURSE_MANIFEST } from "../lib/codex/manifest";
import { CODEX_QUIZ } from "../lib/codex/quiz";

const LESSON_SLUGS = [
  "meet-codex",
  "task-contracts",
  "environments-permissions",
  "ground-plan",
  "implement-steer",
  "debug-test",
  "review-diff",
  "agents-skills",
  "cli",
  "ide",
  "cloud-parallel",
  "automation-capstone",
] as const;

const ENGLISH_CODEX_PATHS = [
  "/en/codex/",
  ...LESSON_SLUGS.map((slug) => `/en/codex/${slug}/`),
];

const CORRECT_INDEX = new Map<string, number>(
  CODEX_QUIZ.map((question) => [question.id, question.correctIndex]),
);
const VALID_RECEIPT = {
  schema: CODEX_CAPSTONE_RECEIPT_SCHEMA,
  fixtureVersion: CODEX_CAPSTONE_FIXTURE_VERSION,
  fixtureSha256: CODEX_CAPSTONE_FIXTURE_SHA256,
  checks: Object.fromEntries(CODEX_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, true])),
};

async function settleHydration(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function gotoHydrated(page: Page, path: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const previousURL = page.url();
    try {
      const response = await page.goto(path);
      await settleHydration(page);
      return response;
    } catch (error) {
      // The loopback Webpack harness can perform one late first-compilation
      // refresh of the exact page it just hydrated. Retry only that previous-
      // URL refresh; redirects and every other navigation failure stay fatal.
      const previousPageRefresh = attempt === 0
        && previousURL !== "about:blank"
        && error instanceof Error
        && error.message.includes(`another navigation to "${previousURL}"`);
      if (!previousPageRefresh) throw error;
      await settleHydration(page);
    }
  }
  throw new Error(`Unable to navigate to hydrated Course 2 route: ${path}`);
}

async function clearProgress(page: Page) {
  await gotoHydrated(page, "/en/codex/");
  await page.evaluate(() => {
    localStorage.removeItem("ae.progress");
    localStorage.removeItem("tch.seen");
    sessionStorage.removeItem("aicourse.codex.capstone-draft.v1");
    window.dispatchEvent(new Event("codex:progress-change"));
    window.dispatchEvent(new Event("codex:progress-reset"));
  });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  await expect(page.locator('[data-testid="codex-course-progress"] progress'))
    .toHaveAttribute("value", "0");
}

async function completeQuizAttempt(page: Page, correctAnswers: number) {
  const ids: string[] = [];
  const units: string[] = [];

  for (let index = 0; index < 12; index += 1) {
    const question = page.locator("form[data-question-id]");
    await expect(question).toBeVisible();
    const id = await question.getAttribute("data-question-id");
    const unit = await question.getAttribute("data-unit-id");
    expect(id).toBeTruthy();
    expect(unit).toBeTruthy();
    ids.push(id!);
    units.push(unit!);

    const correct = CORRECT_INDEX.get(id!);
    expect(correct).toBeDefined();
    const selected = index < correctAnswers ? correct! : (correct! + 1) % 4;
    await question.locator('input[type="radio"]').nth(selected).check();
    await question.getByRole("button", { name: "Check answer" }).click();
    const feedback = question.locator('[role="status"]');
    await expect(feedback).toBeVisible();
    await expect(question.locator('[data-answer-state="correct"]')).toHaveText("Correct");
    if (selected !== correct) {
      await expect(question.locator('[data-answer-state="incorrect"]')).toHaveText("Not yet");
    }
    await expect(feedback.locator("a").first()).toHaveAttribute("href", /^https:\/\//);
    await expect(feedback).toBeFocused();

    await question.getByRole("button", {
      name: index === 11 ? "Finish quiz" : "Next question",
    }).click();
  }

  await expect(page.locator(
    '[data-testid="codex-final-quiz"] [data-outcome][role="status"]',
  )).toBeVisible();
  return { ids, units };
}

test.describe("Codex static routes and hierarchy", () => {
  for (const path of ENGLISH_CODEX_PATHS) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      if (path === "/en/codex/") {
        await expect(page.locator('[data-testid="codex-course-dashboard"]')).toBeVisible();
      } else {
        const slug = path.split("/").filter(Boolean).at(-1);
        await expect(page.locator(`[data-testid="codex-lesson-${slug}"]`)).toBeVisible();
      }
      await expect(page.locator('img[src^="http"], source[srcset^="http"]')).toHaveCount(0);
    });
  }

  const representativeLocales = [
    ["es", "task-contracts"],
    ["fr", "debug-test"],
    ["de", "review-diff"],
    ["zh-Hans", "agents-skills"],
    ["zh-Hant", "cli"],
    ["ja", "ide"],
    ["ko", "cloud-parallel"],
    ["ar", "automation-capstone"],
  ] as const;

  for (const [locale, slug] of representativeLocales) {
    test(`${locale} localized lesson renders`, async ({ page }) => {
      const response = await page.goto(`/${locale}/codex/${slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator(`[data-testid="codex-lesson-${slug}"]`)).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }

  test("course catalogue keeps blocked Course 2 visible and non-linkable while preserving Course 1 links", async ({ page }) => {
    await page.goto("/en/courses/");
    const releasedSection = page.locator(
      'section[aria-labelledby="catalog-released-courses-title"]',
    );
    const comingSoonSection = page.locator(
      'section[aria-labelledby="catalog-coming-soon-courses-title"]',
    );
    await expect(releasedSection.getByRole("heading", { name: /Available now/ })).toBeVisible();
    await expect(comingSoonSection.getByRole("heading", { name: /Coming soon/ })).toBeVisible();
    expect(await page.locator(".catalog-course-section").evaluateAll((sections) => (
      sections.map((section) => section.getAttribute("aria-labelledby"))
    ))).toEqual([
      "catalog-released-courses-title",
      "catalog-coming-soon-courses-title",
    ]);
    await expect(releasedSection.locator("li.catalog-course-card-upcoming")).toHaveCount(0);
    await expect(comingSoonSection.locator("li.catalog-course-card-upcoming")).not.toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Agentic Engineering" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How to Use Codex" })).toBeVisible();
    const agenticCard = page.locator("li.catalog-course-card").filter({
      has: page.getByRole("heading", { name: "Agentic Engineering" }),
    });
    await expect(agenticCard.getByRole("link", { name: "The Handbook", exact: true })).toHaveAttribute("href", "/en/handbook/");
    await expect(agenticCard.getByRole("link", { name: "The Lab", exact: true })).toHaveAttribute("href", "/en/lab/");
    await expect(agenticCard.getByRole("link", { name: "Build an Agent", exact: true })).toHaveAttribute("href", "/en/build/");
    const codexCard = comingSoonSection.locator("li.catalog-course-card").filter({
      has: page.getByRole("heading", { name: "How to Use Codex" }),
    });
    await expect(codexCard).toHaveClass(/catalog-course-card-upcoming/);
    await expect(codexCard.locator('.catalog-course-disabled[aria-disabled="true"]')).toBeVisible();
    await expect(codexCard.locator("a[href]")).toHaveCount(0);

    expect((await page.request.get("/en/handbook/")).status()).toBe(200);
    expect((await page.request.get("/en/lab/")).status()).toBe(200);

    const previewResponse = await page.goto("/en/codex/");
    expect(previewResponse?.status()).toBe(200);
    await expect(page.locator('[data-testid="codex-course-dashboard"]')).toBeVisible();
  });

  test("language switching preserves a Codex lesson slug and Arabic direction", async ({ page }) => {
    await page.goto("/en/codex/debug-test/");
    const englishStructuredData = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
    expect(englishStructuredData).toContain("https://aicourse.top/en/codex/debug-test/");
    await page.getByRole("button", { name: /Language:/ }).click();
    await page.getByRole("menuitem", { name: /العربية/ }).click();
    await expect(page).toHaveURL(/\/ar\/codex\/debug-test\/$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('[data-testid="codex-lesson-debug-test"]')).toBeVisible();
    const arabicStructuredData = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
    expect(arabicStructuredData).toContain("https://aicourse.top/ar/codex/debug-test/");
    expect(arabicStructuredData).not.toContain("https://aicourse.top/en/codex/debug-test/");
  });
});

test.describe.serial("private browser progress", () => {
  test("cold start, reload persistence, Codex-only reset, and global reset", async ({ page }) => {
    await clearProgress(page);
    await expect(page.locator('[data-testid="codex-course-progress"] progress')).toHaveAttribute("value", "0");

    await page.evaluate(() => localStorage.setItem("ae.progress", JSON.stringify({ unrelated: true })));
    await gotoHydrated(page, "/en/codex/meet-codex/");
    await page.getByRole("button", { name: "Mark complete" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="codex-lesson-completion-meet-codex"] strong[aria-live="polite"]'))
      .toHaveText("Completed");
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeFocused();
    await page.reload();
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    await gotoHydrated(page, "/en/codex/");
    await expect(page.locator('[data-testid="codex-course-progress"] progress')).toHaveAttribute("value", "1");
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Reset all saved course progress?");
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(page.getByText("Course progress reset.")).toBeFocused();
    await expect(page.locator('[data-testid="codex-course-progress"] progress')).toHaveAttribute("value", "0");
    const afterCourseReset = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(afterCourseReset).toEqual({ unrelated: true });

    await page.evaluate(() => localStorage.setItem("ae.progress", JSON.stringify({
      unrelated: true,
      play0: true,
      "codex.quizPassed": true,
    })));
    await gotoHydrated(page, "/en/learning/");
    await expect(page.locator(".learning-dashboard")).toHaveAttribute("aria-busy", "false");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear all progress" }).click();
    await expect(page.getByRole("status")).toContainText(
      "All active learning progress on this device was cleared.",
    );
    expect(await page.evaluate(() => localStorage.getItem("ae.progress"))).toBeNull();
  });

  test("reversible completion updates dashboard and lesson-outline completed and next markers", async ({ page }) => {
    await clearProgress(page);
    await gotoHydrated(page, "/en/codex/meet-codex/");
    const completion = page.locator('[data-testid="codex-lesson-completion-meet-codex"]');
    const markComplete = completion.getByRole("button", { name: "Mark complete" });
    await markComplete.focus();
    await page.keyboard.press("Enter");
    const markIncomplete = completion.getByRole("button", { name: "Mark incomplete" });
    await expect(completion.locator('strong[aria-live="polite"]')).toHaveText("Completed");
    await expect(markIncomplete).toBeFocused();

    const outline = page.locator('aside nav[aria-label="All lessons"]');
    const currentOutlineLesson = outline.locator('a[href="/en/codex/meet-codex/"]');
    await expect(currentOutlineLesson).toHaveAttribute("aria-current", "page");
    await expect(currentOutlineLesson).toHaveAttribute("data-complete", "true");
    await expect(currentOutlineLesson).toContainText("✓");
    const nextOutlineLesson = outline.locator('a[href="/en/codex/task-contracts/"]');
    await expect(nextOutlineLesson).toHaveAttribute("data-state", "next");
    await expect(nextOutlineLesson).toContainText("Recommended next lesson");

    await markIncomplete.focus();
    await page.keyboard.press("Enter");
    await expect(completion.getByRole("button", { name: "Mark complete" })).toBeVisible();
    await expect(completion.locator('strong[aria-live="polite"]')).toHaveText("Mark complete");
    await expect(currentOutlineLesson).not.toHaveAttribute("data-complete", "true");

    await completion.getByRole("button", { name: "Mark complete" }).click();
    await gotoHydrated(page, "/en/codex/");
    const curriculum = page.locator('section[aria-labelledby="codex-curriculum-title"]');
    const completedRow = curriculum.locator("li").filter({
      has: page.locator('a[href="/en/codex/meet-codex/"]'),
    });
    const nextRow = curriculum.locator("li").filter({
      has: page.locator('a[href="/en/codex/task-contracts/"]'),
    });
    await expect(completedRow).toHaveAttribute("data-state", "completed");
    await expect(completedRow).toContainText("Completed lesson");
    await expect(nextRow).toHaveAttribute("data-state", "next");
    await expect(nextRow).toContainText("Recommended next lesson");

    const reset = page.getByRole("button", { name: "Reset progress" });
    await expect(reset).toBeEnabled();
    page.once("dialog", (dialog) => dialog.accept());
    await reset.click();
    await expect(page.getByText("Course progress reset.")).toBeFocused();
    await expect(completedRow).toHaveAttribute("data-state", "next");
    await expect(completedRow).toContainText("Recommended next lesson");
    await expect(nextRow).toHaveAttribute("data-state", "remaining");
    await expect(reset).toBeDisabled();
  });

  test("storage denial keeps the course usable and announces that progress is not saved", async ({ browser }) => {
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
    await page.goto("/en/codex/");
    await expect(page.getByText("Browser storage is unavailable. The course remains usable, but progress and completion will not be saved after this session.").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Start/ }).first()).toBeVisible();
    await context.close();
  });

  test("global reset clears the in-memory fallback after a storage write failure", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/en/codex/");
    await page.evaluate(() => {
      localStorage.setItem("ae.progress", JSON.stringify({ "codex.lesson.task-contracts": true }));
    });
    await context.addInitScript(() => {
      Storage.prototype.setItem = function setItem() {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      };
    });

    await gotoHydrated(page, "/en/codex/meet-codex/");
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    await gotoHydrated(page, "/en/learning/");
    await expect(page.locator(".learning-dashboard")).toHaveAttribute("aria-busy", "false");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear all progress" }).click();
    expect(await page.evaluate(() => localStorage.getItem("ae.progress"))).toBeNull();

    await gotoHydrated(page, "/en/codex/");
    await expect(page.locator('[data-testid="codex-course-progress"] progress')).toHaveAttribute("value", "0");
    await context.close();
  });

  test("the dashboard moves keyboard focus to the final quiz when lessons are complete", async ({ page }) => {
    await clearProgress(page);
    await page.evaluate((slugs) => {
      localStorage.setItem("ae.progress", JSON.stringify(Object.fromEntries(
        slugs.map((slug) => [`codex.lesson.${slug}`, true]),
      )));
    }, LESSON_SLUGS);
    await page.reload();

    const continueLink = page.locator('[data-testid="codex-course-progress"] a[href="#codex-final-quiz-title"]');
    await continueLink.focus();
    await continueLink.press("Enter");
    await expect(page.locator("#codex-final-quiz-title")).toBeFocused();
    await expect(page).toHaveURL(/#codex-final-quiz-title$/);
  });

  test("all fourteen milestones expose a privacy-limited exportable completion summary", async ({ page }) => {
    await clearProgress(page);
    await page.evaluate((slugs) => {
      localStorage.setItem("ae.progress", JSON.stringify({
        ...Object.fromEntries(slugs.map((slug) => [`codex.lesson.${slug}`, true])),
        "codex.quizBest": 12,
        "codex.quizPassed": true,
        "codex.quizBankVersion": "1",
        "codex.capstone.v1": true,
      }));
    }, LESSON_SLUGS);
    await page.reload();

    const summaryPanel = page.locator('[data-testid="codex-completion-summary"]');
    await expect(summaryPanel).toBeVisible();
    await expect(summaryPanel.getByLabel("Course progress: 100%")).toHaveText("100%");

    const downloadPromise = page.waitForEvent("download");
    await summaryPanel.getByRole("button", { name: "Export summary" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("aicourse-codex-completion-summary.json");
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const exported = JSON.parse(Buffer.concat(chunks).toString("utf8"));

    expect(exported).toMatchObject({
      schema: "aicourse.codex.completion-summary.v1",
      course: "how-to-use-codex",
      courseVersion: CODEX_COURSE_MANIFEST.version,
      milestones: { completed: 14, total: 14 },
      quizBest: 12,
      capstoneReceiptVerified: true,
      credential: false,
    });
    expect(new Date(exported.generatedAt).toString()).not.toBe("Invalid Date");
    expect(JSON.stringify(exported)).not.toMatch(/source\s*code|file\s*path|terminal\s*log|receipt\s*text/i);
  });

  test("write-only storage denial keeps progress in memory and never implies persistence", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Storage.prototype.setItem = function setItem() {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      };
    });
    const page = await context.newPage();

    await gotoHydrated(page, "/en/codex/meet-codex/");
    await page.getByRole("button", { name: "Mark complete" }).focus();
    await page.keyboard.press("Enter");
    const marked = page.getByRole("button", { name: "Mark incomplete" });
    await expect(marked).toBeVisible();
    await expect(marked).toBeFocused();
    await expect(page.getByRole("status")).toContainText("progress and completion will not be saved");

    await page.reload();
    await expect(page.getByRole("button", { name: "Mark complete" })).toBeVisible();

    await gotoHydrated(page, "/en/codex/automation-capstone/");
    await page.locator('[data-testid="codex-capstone-receipt-input"]').fill(JSON.stringify(VALID_RECEIPT));
    await page.getByRole("button", { name: "Verify receipt" }).click();
    await expect(page.locator('[data-testid="codex-capstone-receipt"]')).toBeVisible();
    await expect(page.locator('[data-testid="codex-capstone-receipt"] small')).toContainText("progress and completion will not be saved");
    const storageWarning = page.getByRole("status").filter({
      hasText: "progress and completion will not be saved",
    });
    await expect(storageWarning).toHaveCount(1);
    await expect(storageWarning).toBeVisible();

    await page.reload();
    await expect(page.locator('[data-testid="codex-capstone-receipt"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="codex-capstone-receipt-input"]')).toBeVisible();
    await context.close();
  });
});

test.describe.serial("final quiz", () => {
  test.beforeEach(({ browserName }) => {
    test.slow(browserName === "webkit", "WebKit runs the dense serial quiz flow");
  });

  test("reload restores the exact in-progress question and Course reset clears the active attempt", async ({ page }) => {
    await clearProgress(page);
    const quiz = page.locator('[data-testid="codex-final-quiz"]');
    await quiz.getByRole("button", { name: "Begin quiz" }).click();

    const firstQuestion = quiz.locator("form[data-question-id]");
    const firstId = await firstQuestion.getAttribute("data-question-id");
    expect(firstId).toBeTruthy();
    await firstQuestion.locator('input[type="radio"]').first().check();
    await firstQuestion.getByRole("button", { name: "Check answer" }).click();
    await firstQuestion.getByRole("button", { name: "Next question" }).click();

    const secondQuestion = quiz.locator("form[data-question-id]");
    const secondId = await secondQuestion.getAttribute("data-question-id");
    expect(secondId).toBeTruthy();
    expect(secondId).not.toBe(firstId);
    await secondQuestion.locator('input[type="radio"]').nth(2).check();

    const draft = await page.evaluate(() => (
      JSON.parse(localStorage.getItem("ae.progress") || "{}")["codex.quizDraft.v1"]
    ));
    expect(draft).toMatchObject({
      version: 1,
      bankVersion: "1",
      questionIndex: 1,
      selectedIndex: 2,
    });
    expect(draft.questionIds).toHaveLength(12);
    expect(draft.questionIds.slice(0, 2)).toEqual([firstId, secondId]);
    expect(Object.keys(draft.answers)).toEqual([firstId]);

    await page.reload();
    await expect(quiz.getByRole("button", { name: "Continue quiz" })).toBeVisible();
    await expect(quiz.getByText("Quiz in progress", { exact: true }).first()).toBeVisible();
    await quiz.getByRole("button", { name: "Continue quiz" }).click();
    const restoredQuestion = quiz.locator(`form[data-question-id="${secondId}"]`);
    await expect(restoredQuestion).toBeVisible();
    await expect(restoredQuestion.locator('input[type="radio"]').nth(2)).toBeChecked();
    await expect(quiz.locator('[role="status"][aria-live="polite"]'))
      .toHaveText("Your in-progress quiz was restored.");

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Reset all saved course progress?");
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(page.getByText("Course progress reset.")).toBeFocused();
    await expect(quiz.getByRole("button", { name: "Begin quiz" })).toBeVisible();
    await expect(quiz.locator("form[data-question-id]")).toHaveCount(0);
    const afterReset = await page.evaluate(() => (
      JSON.parse(localStorage.getItem("ae.progress") || "{}")["codex.quizDraft.v1"]
    ));
    expect(afterReset).toBeUndefined();

    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    await expect(quiz.locator("form[data-question-id]")).toBeVisible();
    await expect(page.getByText("Course progress reset.", { exact: true })).toHaveCount(0);
  });

  test("a Course reset in another tab clears the active quiz without stale-control resurrection", async ({ context, page }) => {
    await clearProgress(page);
    const resetPage = await context.newPage();
    await gotoHydrated(resetPage, "/en/codex/");

    const quiz = page.locator('[data-testid="codex-final-quiz"]');
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    const activeQuestion = quiz.locator("form[data-question-id]");
    await expect(activeQuestion).toBeVisible();
    await activeQuestion.locator('input[type="radio"]').nth(1).focus();
    await page.keyboard.press("Space");
    expect(await page.evaluate(() => (
      JSON.parse(localStorage.getItem("ae.progress") || "{}")["codex.quizDraft.v1"]
    ))).toBeTruthy();

    const reset = resetPage.getByRole("button", { name: "Reset progress" });
    await expect(reset).toBeEnabled();
    resetPage.once("dialog", (dialog) => dialog.accept());
    await reset.click();
    await expect(resetPage.getByText("Course progress reset.")).toBeFocused();

    await expect(activeQuestion).toHaveCount(0);
    await expect(quiz.getByRole("button", { name: "Begin quiz" })).toBeVisible();
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await expect(activeQuestion).toHaveCount(0);
    expect(await page.evaluate(() => (
      JSON.parse(localStorage.getItem("ae.progress") || "{}")["codex.quizDraft.v1"]
    ))).toBeUndefined();
    await resetPage.close();
  });

  test("a fresh zero-of-twelve attempt is an explicit needs-review result", async ({ page }) => {
    await clearProgress(page);
    const quiz = page.locator('[data-testid="codex-final-quiz"]');
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    await completeQuizAttempt(page, 0);

    const result = quiz.locator('[data-outcome="needs-review"]');
    await expect(result).toBeVisible();
    await expect(result).toContainText("Score: 0 of 12");
    await expect(result).toContainText("Review the lesson and try again");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(saved["codex.quizBest"]).toBe(0);
    expect(saved["codex.quizPassed"]).toBe(false);
    expect(saved["codex.quizDraft.v1"]).toBeUndefined();
  });

  test("fails at 9 of 12 and passes at the exact 10 of 12 boundary", async ({ page }) => {
    await clearProgress(page);
    await page.getByRole("button", { name: "Begin quiz" }).click();
    await completeQuizAttempt(page, 9);
    await expect(page.locator('[data-testid="codex-final-quiz"] [data-outcome="needs-review"]'))
      .toBeVisible();
    await expect(page.getByText("Review the lesson and try again")).toBeVisible();
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(saved["codex.quizBest"]).toBe(9);
    expect(saved["codex.quizPassed"]).toBe(false);

    await page.getByRole("button", { name: "Retry quiz" }).click();
    await completeQuizAttempt(page, 10);
    await expect(page.locator('[data-testid="codex-final-quiz"] [data-outcome="passed"]'))
      .toBeVisible();
    await expect(page.getByText("Knowledge check passed")).toBeVisible();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(saved["codex.quizBest"]).toBe(10);
    expect(saved["codex.quizPassed"]).toBe(true);
  });

  test("selects three unique questions per unit, explains every answer, and retains the best score", async ({ page }) => {
    await clearProgress(page);
    await page.getByRole("button", { name: "Begin quiz" }).click();
    const first = await completeQuizAttempt(page, 12);

    expect(new Set(first.ids).size).toBe(12);
    const unitCounts = Object.fromEntries(
      ["unit-1", "unit-2", "unit-3", "unit-4"].map((unit) => [
        unit,
        first.units.filter((candidate) => candidate === unit).length,
      ]),
    );
    expect(unitCounts).toEqual({ "unit-1": 3, "unit-2": 3, "unit-3": 3, "unit-4": 3 });
    await expect(page.getByText("Knowledge check passed")).toBeVisible();
    await expect(page.getByText("Score: 12 of 12", { exact: true })).toBeVisible();

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(saved["codex.quizBest"]).toBe(12);
    expect(saved["codex.quizPassed"]).toBe(true);
    expect(saved["codex.quizBankVersion"]).toBe("1");

    await page.getByRole("button", { name: "Retake quiz" }).click();
    const second = await completeQuizAttempt(page, 0);
    expect(second.ids.join("|")).not.toBe(first.ids.join("|"));
    expect([...second.ids].sort().join("|")).not.toBe([...first.ids].sort().join("|"));
    const preservedResult = page.locator(
      '[data-testid="codex-final-quiz"] [data-outcome="prior-pass-preserved"]',
    );
    await expect(preservedResult).toBeVisible();
    await expect(preservedResult).toContainText("Score: 0 of 12");
    await expect(preservedResult).toContainText("Your earlier passing result is still preserved.");
    const afterRetry = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(afterRetry["codex.quizBest"]).toBe(12);
    expect(afterRetry["codex.quizPassed"]).toBe(true);

    await page.reload();
    await expect(page.locator('[data-testid="codex-final-quiz"] [data-outcome="passed"]'))
      .toBeVisible();
    await expect(page.getByText("Best score: 12 of 12")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retake quiz" })).toBeVisible();
  });
});

test.describe.serial("capstone receipt", () => {
  test.beforeEach(({ browserName }) => {
    test.slow(browserName === "webkit", "WebKit runs the dense serial capstone flow");
  });

  test("restores the exact session draft after reload and Course reset clears it", async ({ page }) => {
    await clearProgress(page);
    await gotoHydrated(page, "/en/codex/automation-capstone/");
    const input = page.locator('[data-testid="codex-capstone-receipt-input"]');
    const draftText = '{\n  "checks": {"tests": true}\n}';
    await input.fill(draftText);

    const storedDraft = await page.evaluate(() => JSON.parse(
      sessionStorage.getItem("aicourse.codex.capstone-draft.v1") || "null",
    ));
    expect(Object.keys(storedDraft).sort()).toEqual([
      "fixtureSha256",
      "fixtureVersion",
      "input",
      "receiptSchema",
      "version",
    ]);
    expect(storedDraft).toMatchObject({
      version: 1,
      receiptSchema: CODEX_CAPSTONE_RECEIPT_SCHEMA,
      fixtureVersion: CODEX_CAPSTONE_FIXTURE_VERSION,
      fixtureSha256: CODEX_CAPSTONE_FIXTURE_SHA256,
      input: draftText,
    });

    const acceptDialog = (dialog: { accept(): Promise<void> }) => {
      void dialog.accept();
    };
    page.on("dialog", acceptDialog);
    await page.reload();
    await settleHydration(page);
    page.off("dialog", acceptDialog);
    await expect(input).toHaveValue(draftText);
    await expect(page.getByRole("status")).toContainText(
      "Your capstone receipt draft was restored.",
    );

    page.on("dialog", acceptDialog);
    await gotoHydrated(page, "/en/codex/");
    page.off("dialog", acceptDialog);
    const reset = page.getByRole("button", { name: "Reset progress" });
    await expect(reset).toBeEnabled();
    page.once("dialog", (dialog) => dialog.accept());
    await reset.click();
    await expect(page.getByText("Course progress reset.")).toBeFocused();
    expect(await page.evaluate(() => (
      sessionStorage.getItem("aicourse.codex.capstone-draft.v1")
    ))).toBeNull();

    await gotoHydrated(page, "/en/codex/automation-capstone/");
    await expect(input).toHaveValue("");
    await expect(page.getByText("Your capstone receipt draft was restored."))
      .toHaveCount(0);
  });

  test("Lesson 12 completion hands off from capstone to quiz to course", async ({ page }) => {
    await clearProgress(page);
    await gotoHydrated(page, "/en/codex/automation-capstone/");
    const completion = page.locator(
      '[data-testid="codex-lesson-completion-automation-capstone"]',
    );
    await completion.getByRole("button", { name: "Mark complete" }).click();
    await expect(completion.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
    await expect(completion.locator('strong[aria-live="polite"]')).toHaveText("Completed");
    await expect(completion.getByRole("link", { name: "Capstone path" }))
      .toHaveAttribute("href", "#codex-capstone-title");

    await page.locator('[data-testid="codex-capstone-receipt-input"]')
      .fill(JSON.stringify(VALID_RECEIPT));
    await page.getByRole("button", { name: "Verify receipt" }).click();
    await expect(page.locator('[data-testid="codex-capstone-receipt"]')).toBeVisible();
    await expect(completion.getByRole("link", { name: "Begin quiz" }))
      .toHaveAttribute("href", "/en/codex/#codex-final-quiz-title");

    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      progress["codex.quizBest"] = 10;
      progress["codex.quizPassed"] = true;
      progress["codex.quizBankVersion"] = "1";
      localStorage.setItem("ae.progress", JSON.stringify(progress));
      window.dispatchEvent(new Event("codex:progress-change"));
    });
    await expect(completion.getByRole("link", { name: "Back to course" }))
      .toHaveAttribute("href", "/en/codex/");
  });

  test("rejects wrong-version, incomplete, and tampered receipts before accepting the exact fixture", async ({ page }) => {
    await clearProgress(page);
    await gotoHydrated(page, "/en/codex/automation-capstone/");
    const input = page.locator('[data-testid="codex-capstone-receipt-input"]');
    const submit = page.getByRole("button", { name: "Verify receipt" });

    await input.fill(JSON.stringify({ ...VALID_RECEIPT, fixtureVersion: "999" }));
    await submit.click();
    await expect(page.getByText("The receipt fixture version is not supported.")).toBeFocused();

    await input.fill(JSON.stringify({
      ...VALID_RECEIPT,
      checks: { ...VALID_RECEIPT.checks, lint: false },
    }));
    await submit.click();
    await expect(page.getByText("The receipt is missing required passing checks.")).toBeFocused();

    await input.fill(JSON.stringify({ ...VALID_RECEIPT, fixtureSha256: "0".repeat(64) }));
    await submit.click();
    await expect(page.getByText("The receipt does not match the required starter fixture.")).toBeFocused();

    await input.fill(JSON.stringify(VALID_RECEIPT));
    await submit.click();
    const receipt = page.locator('[data-testid="codex-capstone-receipt"]');
    await expect(receipt).toBeVisible();
    await expect(page.getByRole("heading", { name: "Receipt verified" })).toBeFocused();
    await expect(receipt).toHaveAttribute("data-schema", CODEX_CAPSTONE_RECEIPT_SCHEMA);
    await expect(receipt).toHaveAttribute("data-fixture-version", CODEX_CAPSTONE_FIXTURE_VERSION);
    await expect(receipt).toHaveAttribute("data-fixture-sha256", CODEX_CAPSTONE_FIXTURE_SHA256);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["codex.capstone.v1"]).toBe(true);
    expect(JSON.stringify(stored)).not.toContain(CODEX_CAPSTONE_FIXTURE_SHA256);
    expect(JSON.stringify(stored)).not.toContain("fixtureVersion");
  });

  test("starter download and receipt controls follow keyboard order", async ({ page }) => {
    await clearProgress(page);
    await gotoHydrated(page, "/en/codex/automation-capstone/");
    const download = page.getByRole("link", { name: "Download starter project" });
    const input = page.locator('[data-testid="codex-capstone-receipt-input"]');
    const submit = page.getByRole("button", { name: "Verify receipt" });
    await expect(download).toHaveAttribute("href", "/courses/codex/aicourse-codex-demo-v1.zip");
    expect((await page.request.get("/courses/codex/aicourse-codex-demo-v1.zip")).status()).toBe(200);
    await download.focus();
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    await page.keyboard.type("{");
    expect(await submit.evaluate((element) => (element as HTMLButtonElement).tabIndex)).toBe(0);
    expect(await page.locator('[data-testid="codex-capstone"]').evaluate((root) => {
      const textarea = root.querySelector('[data-testid="codex-capstone-receipt-input"]');
      const button = root.querySelector('form button[type="submit"]');
      return Boolean(
        textarea
        && button
        && (textarea.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING),
      );
    })).toBe(true);
    await submit.focus();
    await expect(submit).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("This is not valid JSON.")).toBeFocused();
  });
});

test.describe("accessibility, responsive layout, and static metadata", () => {
  test("dashboard, compact outline, quiz feedback and result, and capstone error have no automated WCAG A or AA violations", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "The committed axe-core state sweep runs once in Chromium");

    const expectNoViolations = async (state: string) => {
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await page.addScriptTag({ content: axe.source });
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
      expect(violations, state).toEqual([]);
    };

    await clearProgress(page);
    await expectNoViolations("Course 2 dashboard");

    await page.setViewportSize({ width: 320, height: 640 });
    await gotoHydrated(page, "/en/codex/automation-capstone/");
    const compactOutline = page.locator("details").filter({
      has: page.locator("summary").filter({ hasText: "All lessons" }),
    }).first();
    await compactOutline.locator("summary").click();
    await expect(compactOutline).toHaveAttribute("open", "");
    await expectNoViolations("opened compact Course 2 lesson outline");

    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHydrated(page, "/en/codex/");
    const quiz = page.locator('[data-testid="codex-final-quiz"]');
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    const question = quiz.locator("form[data-question-id]");
    await question.locator('input[type="radio"]').first().check();
    await question.getByRole("button", { name: "Check answer" }).click();
    await expect(question.locator('[role="status"]')).toBeFocused();
    await expectNoViolations("active Course 2 quiz feedback");

    await page.evaluate(() => {
      localStorage.setItem("ae.progress", JSON.stringify({
        "codex.quizBest": 0,
        "codex.quizPassed": false,
        "codex.quizBankVersion": "1",
      }));
      window.dispatchEvent(new Event("codex:progress-change"));
      window.dispatchEvent(new Event("codex:progress-reset"));
    });
    await expect(quiz.locator('[data-outcome="needs-review"]')).toBeVisible();
    await expectNoViolations("Course 2 quiz result");

    await gotoHydrated(page, "/en/codex/automation-capstone/");
    await page.locator('[data-testid="codex-capstone-receipt-input"]').fill("{");
    await page.getByRole("button", { name: "Verify receipt" }).click();
    await expect(page.getByText("This is not valid JSON.")).toBeFocused();
    await expectNoViolations("Course 2 capstone validation error");
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`dashboard and lesson do not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/en/codex/",
        "/en/codex/meet-codex/",
        "/en/codex/automation-capstone/",
        "/ar/codex/automation-capstone/",
      ]) {
        await page.goto(path);
        const dimensions = await page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
        const availableImages = page.locator('[data-figure-status="available"] img');
        for (let index = 0; index < await availableImages.count(); index += 1) {
          const image = availableImages.nth(index);
          await expect.poll(() => image.evaluate((element: HTMLImageElement) => (
            element.complete && element.naturalWidth > 0
          ))).toBe(true);
          const imageState = await image.evaluate((element: HTMLImageElement) => ({
            currentOrigin: new URL(element.currentSrc, location.href).origin,
            pageOrigin: location.origin,
            right: element.getBoundingClientRect().right,
            viewport: document.documentElement.clientWidth,
          }));
          expect(imageState.currentOrigin).toBe(imageState.pageOrigin);
          expect(imageState.right).toBeLessThanOrEqual(imageState.viewport + 1);
        }
      }
    });
  }

  test("Arabic stays RTL while technical identifiers stay LTR and bounded", async ({ page }) => {
    await page.goto("/ar/codex/cli/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const objective = page.locator('section[aria-labelledby="codex-objective-title"]');
    await expect(objective.locator('code[dir="ltr"]')).toContainText(["/review", "codex exec"]);

    await gotoHydrated(page, "/ar/codex/automation-capstone/");
    const capstoneTechnical = page.locator('[data-testid="codex-capstone"] ol').first().locator('code[dir="ltr"]');
    await expect(capstoneTechnical).toContainText(["npm ci", "CourseList.tsx"]);
    const code = page.locator('[data-testid="codex-capstone"] code[dir="ltr"]').first();
    expect(await code.evaluate((element) => getComputedStyle(element).direction)).toBe("ltr");
    await expect(page.locator('[data-testid="codex-capstone-receipt-input"]')).toHaveAttribute("dir", "ltr");

    await page.locator('[data-testid="codex-capstone-receipt-input"]')
      .fill(JSON.stringify(VALID_RECEIPT));
    await page.locator('[data-testid="codex-capstone"] form button[type="submit"]').click();
    await expect(page.locator('[data-testid="codex-capstone-receipt"]')).toBeVisible();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => {
        const requiredTokens = new Set(["CourseList.tsx", "CourseList.test.tsx", "npm run course:verify"]);
        const technical = [...document.querySelectorAll<HTMLElement>('[data-testid="codex-capstone"] code[dir="ltr"]')]
          .filter((element) => requiredTokens.has(element.textContent?.trim() || ""))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const owner = element.closest("li")?.getBoundingClientRect();
            return {
              text: element.textContent?.trim(),
              left: rect.left,
              right: rect.right,
              height: rect.height,
              ownerLeft: owner?.left,
              ownerRight: owner?.right,
            };
          });
        const receipt = [...document.querySelectorAll<HTMLElement>('[data-testid="codex-capstone-receipt"] dd')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const owner = element.parentElement!.getBoundingClientRect();
            return { left: rect.left, right: rect.right, ownerLeft: owner.left, ownerRight: owner.right };
          });
        return {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          technical,
          receipt,
        };
      });

      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
      expect(layout.technical.length).toBeGreaterThanOrEqual(3);
      for (const item of layout.technical) {
        expect(item.height, `${item.text} should not wrap one character per line at ${width}px`).toBeLessThanOrEqual(45);
        expect(item.left).toBeGreaterThanOrEqual((item.ownerLeft ?? 0) - 1);
        expect(item.right).toBeLessThanOrEqual((item.ownerRight ?? width) + 1);
      }
      expect(layout.receipt).toHaveLength(4);
      for (const item of layout.receipt) {
        expect(item.left).toBeGreaterThanOrEqual(item.ownerLeft - 1);
        expect(item.right).toBeLessThanOrEqual(item.ownerRight + 1);
      }
    }
  });

  test("an Arabic quiz prompt isolates its slash command from surrounding RTL copy", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Crypto.prototype, "getRandomValues", {
        configurable: true,
        value<T extends ArrayBufferView>(array: T): T {
          new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(0);
          return array;
        },
      });
    });
    await gotoHydrated(page, "/ar/codex/");
    const quiz = page.locator('[data-testid="codex-final-quiz"]');
    await quiz.getByRole("button").click();
    for (let index = 0; index < 2; index += 1) {
      const question = quiz.locator("form[data-question-id]");
      await question.locator('input[type="radio"]').first().check();
      await question.getByRole("button").click();
      await question.getByRole("button").click();
    }
    const prompt = quiz.locator('form[data-question-id="q10"] h3');
    await expect(prompt).toBeVisible();
    await expect(prompt.locator('code[dir="ltr"]')).toHaveText("/goal");
  });

  test("lesson navigation and a quiz response work from the keyboard", async ({ page }) => {
    await gotoHydrated(page, "/en/codex/meet-codex/");
    const railLink = page.locator('aside nav a[href="/en/codex/task-contracts/"]');
    await railLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/codex\/task-contracts\/$/);
    await settleHydration(page);

    const nextLink = page.locator('article nav a[rel="next"]');
    await nextLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/codex\/environments-permissions\/$/);

    await gotoHydrated(page, "/en/codex/");
    const begin = page.getByRole("button", { name: "Begin quiz" });
    await begin.focus();
    await page.keyboard.press("Enter");
    const question = page.locator("form[data-question-id]");
    await expect(question.getByRole("heading")).toBeFocused();
    const firstOption = question.locator('input[type="radio"]').first();
    await firstOption.focus();
    await page.keyboard.press("Space");
    const check = question.getByRole("button", { name: "Check answer" });
    await check.focus();
    await page.keyboard.press("Enter");
    const feedback = question.locator('[role="status"]');
    await expect(feedback).toBeFocused();
    const sourceLink = feedback.locator("a").first();
    await expect(sourceLink).toHaveAttribute("href", /^https:\/\//);
    expect(await sourceLink.evaluate((element) => (element as HTMLAnchorElement).tabIndex)).toBe(0);
    await sourceLink.focus();
    await expect(sourceLink).toBeFocused();
  });

  test("all 24 figure fallbacks remain semantic without JavaScript and available images are local", async ({ browser }) => {
    for (const lesson of CODEX_COURSE_MANIFEST.lessons) {
      await assertNoJsFigureFallback(
        browser,
        `/en/codex/${lesson.slug}/`,
        lesson.figureIds,
      );
    }
  });

  test("an available full-resolution figure link is keyboard operable", async ({ page }) => {
    for (const lesson of CODEX_COURSE_MANIFEST.lessons) {
      await page.goto(`/en/codex/${lesson.slug}/`);
      const link = page.locator('[data-figure-status="available"] a').first();
      if (await link.count()) {
        const href = await link.getAttribute("href");
        expect(href).toMatch(/^\/courses\/codex\//);
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
        return;
      }
    }
    test.info().annotations.push({
      type: "release-blocker",
      description: "No available figure exists yet; codex:check --release remains responsible for failing the release.",
    });
  });

  test("a verified capstone prints as one isolated, light, readable receipt", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Playwright page.pdf() is Chromium-only");
    await clearProgress(page);
    await gotoHydrated(page, "/en/codex/automation-capstone/");
    await page.locator('[data-testid="codex-capstone-receipt-input"]').fill(JSON.stringify(VALID_RECEIPT));
    await page.getByRole("button", { name: "Verify receipt" }).click();
    await expect(page.locator('[data-testid="codex-capstone-receipt"]')).toBeVisible();

    await page.emulateMedia({ media: "print", colorScheme: "dark" });
    await expect(page.locator(".topbar")).toBeHidden();
    await expect(page.locator('[data-testid="codex-lesson-automation-capstone"] article > header')).toBeHidden();
    const receipt = page.locator('[data-testid="codex-capstone-receipt"]');
    const printStyle = await receipt.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color, position: style.position };
    });
    expect(printStyle.background).toBe("rgb(255, 255, 255)");
    expect(printStyle.color).toBe("rgb(17, 24, 39)");
    expect(printStyle.position).toBe("static");

    const pdf = await page.pdf({ format: "A4", printBackground: false });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    const pageObjects = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
    expect(pageObjects).toBe(1);
  });

  test("printed lessons retain their evidence sources and verification metadata", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Playwright page.pdf() is Chromium-only");
    await page.goto("/en/codex/meet-codex/");
    await page.emulateMedia({ media: "print", colorScheme: "light" });
    const sources = page.locator('section[aria-labelledby="codex-sources-title"]');
    await expect(sources).toBeVisible();
    expect(await sources.locator("h2").evaluate((heading) => getComputedStyle(heading).breakAfter)).toBe("avoid");
    await expect(sources.locator(":scope > ol > li")).toHaveCount(4);
    await expect(sources.locator("time")).toHaveCount(4);
    const hrefs = await sources.locator('a[href]').evaluateAll((links) => (
      links.map((link) => (link as HTMLAnchorElement).href)
    ));
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    expect(hrefs.every((href) => href.startsWith("https://"))).toBe(true);

    const pdf = await page.pdf({ format: "A4", printBackground: false });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("canonical, reciprocal hreflang, Course, LearningResource, and breadcrumbs are emitted", async ({ page }) => {
    await page.goto("/en/codex/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aicourse.top/en/codex/");
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(10);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(8);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "How to Use Codex · aicourse.top");
    let jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map((text) => JSON.parse(text));
    expect(JSON.stringify(jsonLd)).toContain('"@type":"Course"');
    expect(JSON.stringify(jsonLd)).toContain('"@type":"BreadcrumbList"');
    expect(JSON.stringify(jsonLd)).toContain('"hasPart"');

    await page.goto("/ar/codex/cli/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aicourse.top/ar/codex/cli/");
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(10);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ar_SA");
    jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map((text) => JSON.parse(text));
    expect(JSON.stringify(jsonLd)).toContain('"@type":"LearningResource"');
    expect(JSON.stringify(jsonLd)).toContain('"@type":"BreadcrumbList"');
  });

  test("the compact outline is closed by default, reveals the active lesson, and keeps 44px targets", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await clearProgress(page);
    await page.evaluate((slugs) => {
      localStorage.setItem("ae.progress", JSON.stringify(Object.fromEntries(
        slugs.map((slug) => [`codex.lesson.${slug}`, true]),
      )));
      window.dispatchEvent(new Event("codex:progress-change"));
    }, LESSON_SLUGS.slice(0, -1));
    await gotoHydrated(page, "/en/codex/automation-capstone/");

    const compactOutline = page.locator("details").filter({
      has: page.locator("summary").filter({ hasText: "All lessons" }),
    }).first();
    const summary = compactOutline.locator("summary");
    const activeLesson = compactOutline.locator('a[aria-current="page"]');
    await expect(compactOutline).toBeVisible();
    await expect(compactOutline).not.toHaveAttribute("open", "");
    await expect(summary).toContainText("Lesson 12 of 12");
    await expect(activeLesson).toBeHidden();
    expect((await summary.boundingBox())?.height).toBeGreaterThanOrEqual(44);

    await summary.click();
    await expect(compactOutline).toHaveAttribute("open", "");
    await expect(activeLesson).toBeVisible();
    await expect(activeLesson).toHaveAttribute("href", "/en/codex/automation-capstone/");
    await expect.poll(() => activeLesson.evaluate((element) => {
      const scroller = element.closest("nav")?.parentElement;
      if (!scroller) return false;
      const linkRect = element.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      return linkRect.top >= scrollRect.top - 1 && linkRect.bottom <= scrollRect.bottom + 1;
    })).toBe(true);
    const targetHeights = await compactOutline.locator("summary, a[href]")
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    expect(targetHeights.length).toBeGreaterThan(12);
    expect(targetHeights.every((height) => height >= 44)).toBe(true);
  });

  test("public sitemap contains no blocked Codex URLs during prepublication", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const allUrls = xml.match(/<loc>[^<]+<\/loc>/g) || [];
    const codexUrls = allUrls.filter((entry) => /\/codex(?:\/|&lt;)/.test(entry));
    expect(allUrls.length).toBeGreaterThan(0);
    expect(codexUrls).toHaveLength(0);
    expect(xml).not.toContain("https://aicourse.top/en/codex/");
    expect(xml).not.toContain("https://aicourse.top/ar/codex/automation-capstone/");
  });
});

async function assertNoJsFigureFallback(
  browser: Browser,
  path: string,
  expectedFigureIds: readonly string[],
) {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(path);
  const figures = page.locator('[data-testid^="codex-figure-"]');
  await expect(figures).toHaveCount(expectedFigureIds.length);
  for (const id of expectedFigureIds) {
    const figure = page.locator(`[data-testid="codex-figure-${id}"]`);
    const status = await figure.getAttribute("data-figure-status");
    if (status === "available") {
      await figure.scrollIntoViewIfNeeded();
      const link = figure.locator("a");
      await expect(link).toHaveAttribute("href", /^\/courses\/codex\//);
      await expect(link).toHaveAttribute("dir", "ltr");
      expect(await link.evaluate((element) => getComputedStyle(element).direction)).toBe("ltr");
      const image = link.locator("img");
      await expect(image).toHaveAttribute("width", /\d+/);
      await expect(image).toHaveAttribute("height", /\d+/);
      await expect(image).toHaveAttribute("loading", id === "fig-01" ? "eager" : "lazy");
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => (
        element.complete && element.naturalWidth > 0
      ))).toBe(true);
      const remoteResponsiveSourceCount = await link.locator('source[srcset^="http"]').count();
      expect(remoteResponsiveSourceCount).toBe(0);
    } else {
      expect(status).toBe("capture-required");
      await expect(figure.getByRole("img")).toBeVisible();
      await expect(figure.locator("figcaption")).not.toBeEmpty();
    }
  }

  await context.close();
}
