import type { Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";
import {
  AI_TUTOR_COURSE_MANIFEST,
  AI_TUTOR_MODULE_SLUGS,
  AI_TUTOR_PROGRESS_MILESTONES,
  AI_TUTOR_PROGRESS_VERSION,
  AI_TUTOR_PROGRESS_VERSION_KEY,
  aiTutorModuleProgressKey,
} from "../lib/ai-tutor";
import { withIsolatedRoutePage } from "./published-course-test-helpers";

const DASHBOARD = "/en/ai-tutor/";
const SITE = "https://aicourse.top";
const STORAGE_KEY = "ae.progress";
const CORRUPT_BACKUP_KEY = "ae.progress.ai-tutor-corrupt-backup";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test.describe("Course 13 public curriculum and routes", () => {
  test("dashboard publishes exactly eight modules in the canonical order", async ({ page }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);

    const dashboard = page.getByTestId("ai-tutor-course-dashboard");
    await expect(dashboard).toBeVisible();
    await expect(dashboard).toHaveAttribute("lang", "en");
    await expect(dashboard).toHaveAttribute("dir", "ltr");
    await expect(dashboard.getByRole("heading", {
      level: 1,
      name: "AI Tutor & Learning Systems Engineering",
    })).toBeVisible();

    const curriculum = dashboard.locator(
      'section[aria-labelledby="ai-tutor-curriculum-title"]',
    );
    const moduleLinks = curriculum.locator('ol a[href^="/en/ai-tutor/"]');
    await expect(moduleLinks).toHaveCount(8);
    expect(await moduleLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
      .toEqual(AI_TUTOR_MODULE_SLUGS.map((slug) => `/en/ai-tutor/${slug}/`));

    await expect(
      dashboard.locator('section[aria-label="AI Tutor & Learning Systems Engineering"]'),
    ).toContainText("450");
    await expect(dashboard.locator('progress[aria-labelledby="ai-tutor-progress-title"]'))
      .toHaveAttribute("max", String(AI_TUTOR_PROGRESS_MILESTONES));
  });

  test("dashboard and every module route render with an English canonical", async ({ page }) => {
    for (const [route, testId] of [
      [DASHBOARD, "ai-tutor-course-dashboard"],
      ...AI_TUTOR_MODULE_SLUGS.map((slug) => (
        [`/en/ai-tutor/${slug}/`, `ai-tutor-module-${slug}`] as const
      )),
    ] as const) {
      await withIsolatedRoutePage(page, route, async (routePage) => {
        const root = routePage.getByTestId(testId);
        await expect(root).toBeVisible();
        await expect(root).toHaveAttribute("lang", "en");
        await expect(root).toHaveAttribute("dir", "ltr");
        await expect(root.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(routePage.locator('link[rel="canonical"]'))
          .toHaveAttribute("href", `${SITE}${route}`);
      });
    }
  });

  test("unknown module slugs are not materialized", async ({ page }) => {
    const response = await page.goto("/en/ai-tutor/not-a-real-module/");
    expect(response?.status()).toBe(404);
  });

  test("English metadata is truthful and unsupported course locales fail closed", async ({ page }) => {
    await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
      await expect(routePage.getByTestId("ai-tutor-course-dashboard").getByText(
        /Course 13 is currently taught in English/,
      )).toHaveCount(0);
      await expect(routePage.locator('link[rel="canonical"]'))
        .toHaveAttribute("href", `${SITE}${DASHBOARD}`);
      await expect(routePage.locator('link[rel="alternate"][hreflang]')).toHaveCount(2);
      await expect(routePage.locator('link[rel="alternate"][hreflang="en"]'))
        .toHaveAttribute("href", `${SITE}${DASHBOARD}`);
      await expect(routePage.locator('link[rel="alternate"][hreflang="x-default"]'))
        .toHaveAttribute("href", `${SITE}${DASHBOARD}`);
    });

    for (const route of ["/fr/ai-tutor/", "/fr/ai-tutor/objectives-concept-map/"]) {
      await withIsolatedRoutePage(page, route, async (routePage) => {
        await expect(routePage.getByTestId("ai-tutor-course-dashboard")).toHaveCount(0);
      }, { expectedStatus: 404 });
    }

    await withIsolatedRoutePage(page, "/fr/courses/", async (routePage) => {
      await expect(routePage.locator('main a[href="/en/ai-tutor/?fromLocale=fr"]'))
        .toBeVisible();
    });
  });
});

test.describe("Course 13 private progress", () => {
  test("module progress persists and reset preserves unrelated shared data", async ({ page }) => {
    const unrelated = { owner: "another-course", completed: [1, 2, 3] };
    const firstSlug = AI_TUTOR_MODULE_SLUGS[0];
    const firstKey = aiTutorModuleProgressKey(firstSlug);

    await page.goto(DASHBOARD);
    await page.evaluate(({ storageKey, unrelatedValue }) => {
      localStorage.setItem(storageKey, JSON.stringify({
        "unrelated.course.keep": unrelatedValue,
        "ai-tutor.legacy.flag": true,
      }));
    }, { storageKey: STORAGE_KEY, unrelatedValue: unrelated });

    await page.goto(`/en/ai-tutor/${firstSlug}/`);
    const completion = page.locator(`section[aria-labelledby="completion-${firstSlug}"]`);
    await completion.getByRole("button", { name: "Mark module complete", exact: true }).click();
    await expect(completion.getByRole("button", { name: "Module complete", exact: true }))
      .toHaveAttribute("aria-disabled", "true");

    let stored = await page.evaluate((storageKey) => (
      JSON.parse(localStorage.getItem(storageKey) || "{}") as Record<string, unknown>
    ), STORAGE_KEY);
    expect(stored[firstKey]).toBe(true);
    expect(stored[AI_TUTOR_PROGRESS_VERSION_KEY]).toBe(AI_TUTOR_PROGRESS_VERSION);
    expect(stored["unrelated.course.keep"]).toEqual(unrelated);

    await page.reload();
    await expect(page.getByRole("button", { name: "Module complete", exact: true }))
      .toHaveAttribute("aria-disabled", "true");

    await page.goto(DASHBOARD);
    const progress = page.locator('section[aria-labelledby="ai-tutor-progress-title"]');
    await expect(progress.locator("progress")).toHaveAttribute("value", "1");
    await expect(progress.locator("output"))
      .toContainText(`1 of ${AI_TUTOR_PROGRESS_MILESTONES} milestones`);

    page.once("dialog", (dialog) => dialog.accept());
    await progress.getByRole("button", { name: "Reset Course 13 progress", exact: true }).click();
    await expect(progress.getByText(
      "Course 13 progress was reset. Other course records were preserved.",
      { exact: true },
    )).toBeVisible();

    stored = await page.evaluate((storageKey) => (
      JSON.parse(localStorage.getItem(storageKey) || "{}") as Record<string, unknown>
    ), STORAGE_KEY);
    expect(stored["unrelated.course.keep"]).toEqual(unrelated);
    expect(stored[firstKey]).toBeUndefined();
    expect(stored["ai-tutor.legacy.flag"]).toBeUndefined();
    expect(stored[AI_TUTOR_PROGRESS_VERSION_KEY]).toBe(AI_TUTOR_PROGRESS_VERSION);
    expect(
      Object.keys(stored)
        .filter((key) => key.startsWith("ai-tutor.") && key !== AI_TUTOR_PROGRESS_VERSION_KEY),
    ).toEqual([]);
  });

  test("corrupt shared storage leaves the course readable and preserves forensic evidence", async ({ page }) => {
    const malformed = '{"other.course":true,"ai-tutor.module":';

    await page.goto(DASHBOARD);
    await page.evaluate(({ storageKey, value }) => {
      localStorage.setItem(storageKey, value);
      sessionStorage.removeItem("ae.progress.ai-tutor-corrupt-backup");
    }, { storageKey: STORAGE_KEY, value: malformed });
    await page.reload();

    await expect(page.getByTestId("ai-tutor-course-dashboard")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /storage/i }).first())
      .toBeVisible();
    await expect(page.getByRole("link", { name: "Start with the learning contract" }))
      .toHaveAttribute("href", "/en/ai-tutor/objectives-concept-map/");

    const evidence = await page.evaluate(({ storageKey, backupKey }) => ({
      source: localStorage.getItem(storageKey),
      backup: sessionStorage.getItem(backupKey),
    }), { storageKey: STORAGE_KEY, backupKey: CORRUPT_BACKUP_KEY });
    expect(evidence.source).toBe(malformed);
    expect(evidence.backup).toBe(malformed);
  });
});

test("dashboard and a representative module do not overflow at 390px", async ({ page }) => {
  for (const route of [
    DASHBOARD,
    `/en/ai-tutor/${AI_TUTOR_COURSE_MANIFEST.modules.at(-1)!.slug}/`,
  ]) {
    await withIsolatedRoutePage(page, route, async (routePage) => {
      await expectNoHorizontalOverflow(routePage);
    }, { viewport: { width: 390, height: 844 } });
  }
});
