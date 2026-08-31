import { expect, test, type Dialog, type Page } from "@playwright/test";
import axe from "axe-core";
import {
  CURSOR_CAPSTONE_FIXTURE_SHA256,
  CURSOR_CAPSTONE_RECEIPT_SCHEMA,
  CURSOR_CAPSTONE_REQUIRED_CHECKS,
  CURSOR_FINAL_QUIZ,
  CURSOR_LESSON_PROGRESS_KEYS,
  CURSOR_PROGRESS_LOCK_NAME,
  CURSOR_PROGRESS_STORAGE_KEY,
} from "../lib/cursor";
import {
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
} from "../components/cursor/session-draft-store";

const dashboard = "/en/cursor/";
const firstLesson = "/en/cursor/orient-privacy/";
const secondLesson = "/en/cursor/tab-inline-edit/";
const capstoneLesson = "/en/cursor/workflow-capstone/";

async function seedProgress(page: Page, progress: Record<string, unknown>): Promise<void> {
  await page.goto(dashboard);
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: CURSOR_PROGRESS_STORAGE_KEY, value: progress });
  await page.reload();
}

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

async function expectVisibleCourseActionsAtLeast44px(page: Page): Promise<void> {
  const actionHeights = await page.locator("[data-course-action]").evaluateAll((actions) => (
    actions.filter((action) => {
      const style = getComputedStyle(action);
      const bounds = action.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && bounds.width > 0
        && bounds.height > 0;
    }).map((action) => action.getBoundingClientRect().height)
  ));
  expect(actionHeights.length).toBeGreaterThan(0);
  expect(Math.min(...actionHeights)).toBeGreaterThanOrEqual(44);
}

async function reachFinalQuizFinish(page: Page): Promise<void> {
  const quiz = page.getByTestId("cursor-final-quiz");
  await quiz.getByRole("button", { name: "Begin quiz" }).click();
  for (let index = 0; index < CURSOR_FINAL_QUIZ.questionCount; index += 1) {
    await quiz.locator('input[type="radio"]').first().check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    if (index < CURSOR_FINAL_QUIZ.questionCount - 1) {
      await quiz.getByRole("button", { name: "Next question" }).click();
    }
  }
  await expect(quiz.getByRole("button", { name: "Finish quiz" })).toBeVisible();
}

async function pressForwardTab(page: Page, browserName: string): Promise<void> {
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
}

test.describe("Cursor Course 4 world-class UX acceptance", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`language-menu switches preserve ${theme} theme, root attributes, and a clean runtime`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await page.goto(firstLesson);
      await page.evaluate((selectedTheme) => localStorage.setItem("ae.theme", selectedTheme), theme);
      await page.waitForLoadState("networkidle");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      // Let static-export route prefetches settle before the intentional
      // full-document locale switch. WebKit otherwise reports the navigation's
      // expected fetch cancellations as page errors.
      await page.waitForLoadState("networkidle");
      await page.locator(".langwrap > button").click();
      await page.locator('[role="menuitem"][lang="ar"]').click();
      await page.waitForURL("**/ar/cursor/orient-privacy/");
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      // A direct load must reproduce the exact root state created by the client switch.
      await page.waitForLoadState("networkidle");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      await page.waitForLoadState("networkidle");
      await page.locator(".langwrap > button").click();
      await page.locator('[role="menuitem"][lang="en"]').click();
      await page.waitForURL("**/en/cursor/orient-privacy/");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      await page.waitForLoadState("networkidle");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.waitForLoadState("networkidle");
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    });
  }

  test("keyboard users can skip to content and dismiss the language menu with focus restored", async ({ page, browserName }) => {
    await page.goto(firstLesson);
    await pressForwardTab(page, browserName);
    const skipLink = page.getByRole("link", { name: "Skip to the main content" });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();

    const languageButton = page.locator(".langwrap > button");
    await languageButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[role="menu"]')).toBeVisible();
    await expect(page.locator('[role="menuitem"]').first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="menu"]')).toBeHidden();
    await expect(languageButton).toBeFocused();
  });

  test("dashboard and both lesson maps expose completed, current, and next states", async ({ page }) => {
    await seedProgress(page, {
      [CURSOR_LESSON_PROGRESS_KEYS[0]]: true,
    });

    const curriculum = page.getByTestId("cursor-course-curriculum");
    await expect(curriculum.locator(`a[href="${firstLesson}"]`)).toHaveAttribute("data-progress-state", "completed");
    await expect(curriculum.locator(`a[href="${secondLesson}"]`)).toHaveAttribute("data-progress-state", "next");

    const resume = page.getByTestId("cursor-course-progress").getByRole("link");
    await expect(resume).toContainText("Continue learning");
    await expect(resume).toContainText("Use Tab and Inline Edit without surrendering judgement");
    await expect(resume).toHaveAttribute("href", secondLesson);

    await page.goto(secondLesson);
    const desktopMap = page.getByTestId("cursor-desktop-lesson-nav");
    const mobileMap = page.getByTestId("cursor-mobile-lesson-nav");
    await expect(desktopMap.locator(`a[href="${firstLesson}"]`)).toHaveAttribute("data-progress-state", "completed");
    await expect(desktopMap.locator(`a[href="${secondLesson}"]`)).toHaveAttribute("data-progress-state", "current");
    await expect(desktopMap.locator(`a[href="${secondLesson}"]`)).toHaveAttribute("data-learning-state", "next");
    await expect(desktopMap.locator(`a[href="${secondLesson}"] span[aria-hidden="true"]`)).toHaveText("→");
    await expect(mobileMap.locator(`a[href="${firstLesson}"]`)).toHaveAttribute("data-progress-state", "completed");
    await expect(mobileMap.locator(`a[href="${secondLesson}"]`)).toHaveAttribute("data-progress-state", "current");
    await expect(mobileMap.locator(`a[href="${secondLesson}"]`)).toHaveAttribute("data-learning-state", "next");
    await expect(mobileMap.locator(`a[href="${secondLesson}"] span[aria-hidden="true"]`)).toHaveText("→");

    await page.goto(firstLesson);
    for (const map of [page.getByTestId("cursor-desktop-lesson-nav"), page.getByTestId("cursor-mobile-lesson-nav")]) {
      const currentCompleted = map.locator(`a[href="${firstLesson}"]`);
      await expect(currentCompleted).toHaveAttribute("data-progress-state", "current");
      await expect(currentCompleted).toHaveAttribute("data-learning-state", "completed");
      await expect(currentCompleted.locator('span[aria-hidden="true"]')).toHaveText("✓");
    }
  });

  test("a completed lesson can be undone without changing any other milestone", async ({ page }) => {
    const preservedQuiz = {
      [CURSOR_FINAL_QUIZ.versionStorageKey]: CURSOR_FINAL_QUIZ.bankVersion,
      [CURSOR_FINAL_QUIZ.bestScoreStorageKey]: 7,
      [CURSOR_FINAL_QUIZ.passedStorageKey]: false,
    };
    await seedProgress(page, {
      [CURSOR_LESSON_PROGRESS_KEYS[0]]: true,
      [CURSOR_LESSON_PROGRESS_KEYS[1]]: true,
      ...preservedQuiz,
    });
    await page.goto(firstLesson);
    await page.getByRole("button", { name: "Mark incomplete" }).click();
    await expect(page.getByRole("button", { name: "Mark complete", exact: true })).toBeVisible();

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), CURSOR_PROGRESS_STORAGE_KEY);
    expect(stored[CURSOR_LESSON_PROGRESS_KEYS[0]]).toBeUndefined();
    expect(stored[CURSOR_LESSON_PROGRESS_KEYS[1]]).toBe(true);
    expect(stored).toMatchObject(preservedQuiz);
  });

  test("keyboard focus follows lesson completion and undo state changes", async ({ page }) => {
    await page.goto(firstLesson);
    const markComplete = page.getByRole("button", { name: "Mark complete", exact: true });
    await markComplete.focus();
    await page.keyboard.press("Enter");
    const markIncomplete = page.getByRole("button", { name: "Mark incomplete" });
    await expect(markIncomplete).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(markComplete).toBeFocused();
  });

  test("knowledge-check review and retry preserve a logical keyboard path", async ({ page, browserName }) => {
    await page.goto(firstLesson);
    const quiz = page.getByTestId("cursor-lesson-quiz");
    for (const question of await quiz.locator("fieldset").all()) {
      await question.locator('input[type="radio"]').first().check();
    }
    const checkAnswers = quiz.getByRole("button", { name: "Check answers" });
    await checkAnswers.focus();
    await page.keyboard.press("Enter");
    const result = quiz.locator('[role="status"][tabindex="-1"]');
    await expect(result).toBeFocused();

    await pressForwardTab(page, browserName);
    const tryAgain = quiz.getByRole("button", { name: "Try again" });
    await expect(tryAgain).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(quiz.locator('input[type="radio"]').first()).toBeFocused();
  });

  test("quiz-complete continuation and capstone preview land at the capstone heading", async ({ page }) => {
    const lessons = Object.fromEntries(CURSOR_LESSON_PROGRESS_KEYS.map((key) => [key, true]));
    await seedProgress(page, {
      ...lessons,
      [CURSOR_FINAL_QUIZ.versionStorageKey]: CURSOR_FINAL_QUIZ.bankVersion,
      [CURSOR_FINAL_QUIZ.bestScoreStorageKey]: CURSOR_FINAL_QUIZ.passingCorrectAnswers,
      [CURSOR_FINAL_QUIZ.passedStorageKey]: true,
    });

    const continuation = page.getByTestId("cursor-course-progress").getByRole("link");
    await expect(continuation).toContainText("Continue learning");
    await expect(continuation).toContainText("Reviewable Cursor workflow packet");
    await expect(continuation).toHaveAttribute("href", `${capstoneLesson}#cursor-capstone-title`);
    await expect(page.getByRole("link", { name: /Capstone path/ })).toHaveAttribute(
      "href",
      `${capstoneLesson}#cursor-capstone-title`,
    );

    await continuation.click();
    await page.waitForURL("**/en/cursor/workflow-capstone/#cursor-capstone-title");
    const geometry = await page.evaluate(() => {
      const heading = document.getElementById("cursor-capstone-title")?.getBoundingClientRect();
      const header = document.querySelector("header.topbar")?.getBoundingClientRect();
      return { headingTop: heading?.top ?? -1, headerBottom: header?.bottom ?? -1 };
    });
    expect(geometry.headingTop).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(geometry.headingTop).toBeLessThan(160);
  });

  test("late-lesson mobile map reveals the active link and all course controls meet 44px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(capstoneLesson);
    const map = page.getByTestId("cursor-mobile-lesson-nav");
    await map.locator("summary").click();
    const current = map.locator('a[aria-current="page"]');
    const inViewport = await current.evaluate((element) => {
      const link = element.getBoundingClientRect();
      const nav = element.closest("nav")?.getBoundingClientRect();
      return Boolean(nav && link.top >= nav.top && link.bottom <= nav.bottom);
    });
    expect(inViewport).toBe(true);

    const mapHeights = await map.locator("nav a").evaluateAll((links) => (
      links.map((link) => link.getBoundingClientRect().height)
    ));
    expect(Math.min(...mapHeights)).toBeGreaterThanOrEqual(44);

    for (const path of [dashboard, firstLesson, capstoneLesson]) {
      await page.goto(path);
      await expectVisibleCourseActionsAtLeast44px(page);
    }
  });

  test("final-quiz attempt survives leaving and returning to the dashboard", async ({ page }) => {
    await page.goto(dashboard);
    const quiz = page.getByTestId("cursor-final-quiz");
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    const questionId = await quiz.locator("form").getAttribute("data-question-id");
    await quiz.locator('input[type="radio"]').first().check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await expect(quiz.getByRole("button", { name: /Next question|Finish quiz/ })).toBeVisible();

    await page.goto(firstLesson);
    await page.goto(dashboard);
    await expect(quiz.locator("form")).toHaveAttribute("data-question-id", questionId || "");
    await expect(quiz.getByRole("button", { name: /Next question|Finish quiz/ })).toBeVisible();
  });

  test("final quiz keeps its last-question draft while the progress commit is locked", async ({ context, page }) => {
    const lockPage = await context.newPage();
    await lockPage.goto(dashboard);
    await lockPage.evaluate((lockName) => {
      const state: { held: boolean; release?: () => void } = { held: false };
      (window as unknown as { course4ProgressLock: typeof state }).course4ProgressLock = state;
      void navigator.locks.request(lockName, async () => {
        state.held = true;
        await new Promise<void>((resolve) => {
          state.release = resolve;
        });
      });
    }, CURSOR_PROGRESS_LOCK_NAME);
    await expect.poll(() => lockPage.evaluate(() => (
      (window as unknown as { course4ProgressLock: { held: boolean } }).course4ProgressLock.held
    ))).toBe(true);

    await page.goto(dashboard);
    await reachFinalQuizFinish(page);
    const finish = page.getByTestId("cursor-final-quiz").getByRole("button", { name: "Finish quiz" });
    await finish.click();
    await expect(finish).toBeDisabled();
    await expect.poll(() => page.evaluate(
      (key) => sessionStorage.getItem(key),
      CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
    )).not.toBeNull();
    expect(await page.evaluate((key) => localStorage.getItem(key), CURSOR_PROGRESS_STORAGE_KEY)).toBeNull();

    await page.reload();
    await expect(page.getByTestId("cursor-final-quiz").getByRole("button", { name: "Finish quiz" })).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY)).not.toBeNull();
    expect(await page.evaluate((key) => localStorage.getItem(key), CURSOR_PROGRESS_STORAGE_KEY)).toBeNull();

    await lockPage.evaluate(() => {
      (window as unknown as { course4ProgressLock: { release?: () => void } })
        .course4ProgressLock.release?.();
    });
    await lockPage.close();
  });

  test("a storage-denied quiz warns the learner and survives same-document navigation", async ({ page }) => {
    await page.addInitScript(() => {
      const nativeSetItem = Storage.prototype.setItem;
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value(this: Storage, key: string, value: string) {
          if (this === window.sessionStorage && key.startsWith("ae.cursor.")) {
            throw new DOMException("Session storage denied for acceptance test", "QuotaExceededError");
          }
          return nativeSetItem.call(this, key, value);
        },
      });
    });

    await page.goto(dashboard);
    const quiz = page.getByTestId("cursor-final-quiz");
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    const questionId = await quiz.locator("form").getAttribute("data-question-id");
    await quiz.locator('input[type="radio"]').first().check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await expect(quiz.getByRole("status").filter({ hasText: /storage|saved|session/i })).toBeVisible();

    await page.getByTestId("cursor-course-curriculum").locator(`a[href="${firstLesson}"]`).click();
    await page.waitForURL(`**${firstLesson}`);
    await page.goBack();
    await page.waitForURL(`**${dashboard}`);
    await expect(quiz.locator("form")).toHaveAttribute("data-question-id", questionId || "");
    await expect(quiz.getByRole("button", { name: /Next question|Finish quiz/ })).toBeVisible();
  });

  test("a storage-denied final score keeps the last-question draft recoverable", async ({ page }) => {
    await page.addInitScript((progressKey) => {
      const nativeSetItem = Storage.prototype.setItem;
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value(this: Storage, key: string, value: string) {
          if (this === window.localStorage && key === progressKey) {
            throw new DOMException("Progress storage denied for acceptance test", "QuotaExceededError");
          }
          return nativeSetItem.call(this, key, value);
        },
      });
    }, CURSOR_PROGRESS_STORAGE_KEY);

    await page.goto(dashboard);
    await reachFinalQuizFinish(page);
    await page.getByTestId("cursor-final-quiz").getByRole("button", { name: "Finish quiz" }).click();
    await expect(page.getByTestId("cursor-final-quiz").locator('[role="status"][tabindex="-1"]')).toBeVisible();
    await expect(page.getByTestId("cursor-final-quiz").getByRole("status").filter({ hasText: /storage|saved/i })).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY)).not.toBeNull();

    await page.reload();
    await expect(page.getByTestId("cursor-final-quiz").getByRole("button", { name: "Finish quiz" })).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY)).not.toBeNull();
  });

  test("malformed assessment drafts fail closed instead of hydrating quiz state", async ({ page }) => {
    await page.goto(dashboard);
    await page.evaluate((key) => sessionStorage.setItem(key, "{not-json"), CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    await page.reload();
    await expect(page.getByTestId("cursor-final-quiz").getByRole("button", { name: "Begin quiz" })).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY)).toBeNull();
  });

  test("reset progress also clears quiz and capstone assessment drafts", async ({ page }) => {
    await page.goto(dashboard);
    const quiz = page.getByTestId("cursor-final-quiz");
    await quiz.getByRole("button", { name: "Begin quiz" }).click();
    await quiz.locator('input[type="radio"]').first().check();
    await expect(page.getByRole("button", { name: "Reset progress" })).toBeEnabled();
    await expect.poll(() => page.evaluate(
      (key) => sessionStorage.getItem(key),
      CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
    )).not.toBeNull();

    await page.goto(capstoneLesson);
    await page.getByTestId("cursor-capstone-artifacts").locator('input[type="checkbox"]').first().check();
    await page.getByTestId("cursor-capstone-rubric").locator('input[type="checkbox"]').first().check();
    await expect.poll(() => page.evaluate(
      (key) => sessionStorage.getItem(key),
      CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
    )).not.toBeNull();

    await page.goto(dashboard);
    await expect(quiz.locator("form")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset progress" })).toBeEnabled();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(page.getByRole("status").filter({ hasText: /reset/i })).toBeVisible();
    await expect(quiz.getByRole("button", { name: "Begin quiz" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset progress" })).toBeDisabled();
    await expect.poll(() => page.evaluate(({ quizKey, capstoneKey }) => ({
      quiz: sessionStorage.getItem(quizKey),
      capstone: sessionStorage.getItem(capstoneKey),
    }), {
      quizKey: CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
      capstoneKey: CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
    })).toEqual({ quiz: null, capstone: null });

    await page.goto(capstoneLesson);
    for (const checkbox of await page.getByTestId("cursor-capstone").locator('input[type="checkbox"]').all()) {
      await expect(checkbox).not.toBeChecked();
    }
  });

  test("capstone checklist survives navigation and receipt text warns before discard", async ({ page }) => {
    await page.goto(capstoneLesson);
    const capstone = page.getByTestId("cursor-capstone");
    const artifact = capstone.getByTestId("cursor-capstone-artifacts").locator('input[type="checkbox"]').first();
    const rubric = capstone.getByTestId("cursor-capstone-rubric").locator('input[type="checkbox"]').first();
    await artifact.check();
    await rubric.check();

    await page.goto(firstLesson);
    await page.goto(capstoneLesson);
    await expect(artifact).toBeChecked();
    await expect(rubric).toBeChecked();

    for (const checkbox of await capstone.locator('input[type="checkbox"]').all()) {
      if (!await checkbox.isChecked()) await checkbox.check();
    }

    const receipt = capstone.getByTestId("cursor-capstone-receipt-input");
    await receipt.fill('{"draft":"keep only in memory"}');
    await expect(capstone.getByRole("status").filter({ hasText: /not saved|page/i })).toBeVisible();

    const unexpectedDialogs: string[] = [];
    const recordUnexpectedDialog = (dialog: Dialog) => {
      unexpectedDialogs.push(dialog.message());
      void dialog.dismiss();
    };
    page.on("dialog", recordUnexpectedDialog);
    await page.locator(".langwrap > button").click();
    await page.locator('[role="menuitem"][lang="en"]').click();
    page.off("dialog", recordUnexpectedDialog);
    expect(unexpectedDialogs).toEqual([]);
    await expect(page.locator('[role="menu"]')).toBeHidden();
    await expect(receipt).toHaveValue('{"draft":"keep only in memory"}');

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("link", { name: "Back to course" }).first().click();
    await expect(page).toHaveURL(/\/en\/cursor\/workflow-capstone\/$/);
    await expect(receipt).toHaveValue('{"draft":"keep only in memory"}');
  });

  test("capstone receipt text survives browser history and confirmed discard clears it", async ({ page }) => {
    await page.goto(dashboard);
    await page.getByRole("link", { name: /Capstone path/ }).click();
    await page.waitForURL("**/en/cursor/workflow-capstone/#cursor-capstone-title");
    const capstone = page.getByTestId("cursor-capstone");
    for (const checkbox of await capstone.locator('input[type="checkbox"]').all()) await checkbox.check();
    const receipt = capstone.getByTestId("cursor-capstone-receipt-input");
    await receipt.fill('{"history":"same-document recovery"}');

    await page.goBack();
    await page.waitForURL(`**${dashboard}`);
    await page.goForward();
    await page.waitForURL("**/en/cursor/workflow-capstone/#cursor-capstone-title");
    await expect(receipt).toHaveValue('{"history":"same-document recovery"}');

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("link", { name: "Back to course" }).first().click();
    await page.waitForURL(`**${dashboard}`);
    await page.getByRole("link", { name: /Capstone path/ }).click();
    await expect(page.getByTestId("cursor-capstone-receipt-input")).toHaveValue("");
  });

  test("a valid capstone receipt remains copyable when progress storage is denied", async ({ page }) => {
    await page.addInitScript((progressKey) => {
      const nativeSetItem = Storage.prototype.setItem;
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value(this: Storage, key: string, value: string) {
          if (this === window.localStorage && key === progressKey) {
            throw new DOMException("Progress storage denied for acceptance test", "QuotaExceededError");
          }
          return nativeSetItem.call(this, key, value);
        },
      });
    }, CURSOR_PROGRESS_STORAGE_KEY);

    await page.goto(capstoneLesson);
    const capstone = page.getByTestId("cursor-capstone");
    for (const checkbox of await capstone.locator('input[type="checkbox"]').all()) await checkbox.check();
    const checks = Object.fromEntries(CURSOR_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, true]));
    const receiptText = JSON.stringify({
      schema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
      fixtureVersion: "1",
      fixtureSha256: CURSOR_CAPSTONE_FIXTURE_SHA256,
      checks,
    });
    await capstone.getByTestId("cursor-capstone-receipt-input").fill(receiptText);
    await capstone.getByRole("button", { name: "Check receipt format" }).click();

    await expect(capstone.getByTestId("cursor-capstone-receipt")).toBeVisible();
    const recoverableReceipt = capstone.getByTestId("cursor-capstone-receipt-input");
    await expect(recoverableReceipt).toBeVisible();
    await expect(recoverableReceipt).toHaveValue(receiptText);
    expect(await recoverableReceipt.evaluate((element) => (element as HTMLTextAreaElement).readOnly)).toBe(true);
    await expect(capstone.getByRole("status").filter({ hasText: /not saved|page/i })).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), CURSOR_PROGRESS_STORAGE_KEY)).toBeNull();
    expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage }))).not.toContain(receiptText);
  });

  test("capstone verification stays recoverable and single-submit while the progress lock is held", async ({ context, page }) => {
    const lockPage = await context.newPage();
    await lockPage.goto(dashboard);
    await lockPage.evaluate((lockName) => {
      const state: { held: boolean; release?: () => void } = { held: false };
      (window as unknown as { course4ProgressLock: typeof state }).course4ProgressLock = state;
      void navigator.locks.request(lockName, async () => {
        state.held = true;
        await new Promise<void>((resolve) => {
          state.release = resolve;
        });
      });
    }, CURSOR_PROGRESS_LOCK_NAME);
    await expect.poll(() => lockPage.evaluate(() => (
      (window as unknown as { course4ProgressLock: { held: boolean } }).course4ProgressLock.held
    ))).toBe(true);

    await page.goto(capstoneLesson);
    const capstone = page.getByTestId("cursor-capstone");
    for (const checkbox of await capstone.locator('input[type="checkbox"]').all()) await checkbox.check();
    const checks = Object.fromEntries(CURSOR_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, true]));
    const receiptText = JSON.stringify({
      schema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
      fixtureVersion: "1",
      fixtureSha256: CURSOR_CAPSTONE_FIXTURE_SHA256,
      checks,
    });
    const input = capstone.getByTestId("cursor-capstone-receipt-input");
    await input.fill(receiptText);
    const verify = capstone.getByRole("button", { name: "Check receipt format" });
    await verify.click();
    await expect(verify).toBeDisabled();
    await expect(input).toHaveValue(receiptText);
    await expect.poll(() => page.evaluate(
      (key) => sessionStorage.getItem(key),
      CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
    )).not.toBeNull();

    await lockPage.evaluate(() => {
      (window as unknown as { course4ProgressLock: { release?: () => void } })
        .course4ProgressLock.release?.();
    });
    await expect(capstone.getByTestId("cursor-capstone-receipt")).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), CURSOR_PROGRESS_STORAGE_KEY)).not.toBeNull();
    await lockPage.close();
  });

  test("Arabic lesson position is an isolated LTR numeric run", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar/cursor/orient-privacy/");
    const position = page.getByTestId("cursor-mobile-lesson-position");
    await expect(position).toHaveText("1 / 14");
    await expect(position).toHaveAttribute("dir", "ltr");
  });

  test("new progress states and draft warning remain axe-clean", async ({ page }) => {
    await seedProgress(page, { [CURSOR_LESSON_PROGRESS_KEYS[0]]: true });
    expect(await runAxe(page)).toEqual([]);

    await page.goto(capstoneLesson);
    const capstone = page.getByTestId("cursor-capstone");
    for (const checkbox of await capstone.locator('input[type="checkbox"]').all()) await checkbox.check();
    await capstone.getByTestId("cursor-capstone-receipt-input").fill("draft");
    expect(await runAxe(page)).toEqual([]);
  });

  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`Course 4 remains free of horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [dashboard, capstoneLesson, "/ar/cursor/office-studio/"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => (
          document.documentElement.scrollWidth - document.documentElement.clientWidth
        ));
        expect(overflow, path).toBeLessThanOrEqual(1);
      }
    });
  }
});
