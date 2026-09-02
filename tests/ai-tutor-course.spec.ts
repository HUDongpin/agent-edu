import type { Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";
import {
  AI_TUTOR_COURSE_MANIFEST,
  AI_TUTOR_CAPSTONE_KEY,
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
    const completeButton = completion.getByRole("button", { name: "Mark module complete", exact: true });
    await expect(completeButton).toBeDisabled();
    await page.getByRole("radio", {
      name: "Given a ratio table, learners will identify a multiplicative relationship and justify it with two corresponding pairs.",
    }).check();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await completion.getByRole("checkbox", {
      name: "I completed and reviewed this module's artifact.",
    }).check();
    await expect(completeButton).toBeEnabled();
    await completeButton.click();
    await expect(completion.getByRole("button", { name: "Mark module incomplete", exact: true }))
      .toBeEnabled();

    let stored = await page.evaluate((storageKey) => (
      JSON.parse(localStorage.getItem(storageKey) || "{}") as Record<string, unknown>
    ), STORAGE_KEY);
    expect(stored[firstKey]).toBe(true);
    expect(stored[AI_TUTOR_PROGRESS_VERSION_KEY]).toBe(AI_TUTOR_PROGRESS_VERSION);
    expect(stored["unrelated.course.keep"]).toEqual(unrelated);

    await page.reload();
    await expect(page.getByRole("button", { name: "Mark module incomplete", exact: true }))
      .toBeEnabled();

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

  test("a recorded capstone restores honestly without stealing focus or scroll", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(({ storageKey, versionKey, version, capstoneKey }) => {
      localStorage.setItem(storageKey, JSON.stringify({
        [versionKey]: version,
        [capstoneKey]: true,
      }));
    }, {
      storageKey: STORAGE_KEY,
      versionKey: AI_TUTOR_PROGRESS_VERSION_KEY,
      version: AI_TUTOR_PROGRESS_VERSION,
      capstoneKey: AI_TUTOR_CAPSTONE_KEY,
    });

    await page.goto(DASHBOARD);
    const capstone = page.locator("#ai-tutor-capstone");
    await expect(capstone.getByRole("status")).toContainText("Capstone design recorded");
    for (const checkbox of await capstone.getByRole("checkbox").all()) {
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toBeDisabled();
    }
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(80);
    expect(await page.evaluate(() => document.activeElement?.closest("#ai-tutor-capstone") !== null))
      .toBe(false);
  });

  test("same-page journey actions move keyboard focus to the next milestone", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(({ storageKey, versionKey, version, moduleKeys }) => {
      localStorage.setItem(storageKey, JSON.stringify({
        [versionKey]: version,
        ...Object.fromEntries(moduleKeys.map((key) => [key, true])),
      }));
    }, {
      storageKey: STORAGE_KEY,
      versionKey: AI_TUTOR_PROGRESS_VERSION_KEY,
      version: AI_TUTOR_PROGRESS_VERSION,
      moduleKeys: AI_TUTOR_MODULE_SLUGS.map(aiTutorModuleProgressKey),
    });

    await page.reload();
    const journey = page.locator("[data-course-journey-action]");
    await expect(journey).toHaveAttribute("href", "#ai-tutor-final-assessment");
    await journey.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#ai-tutor-final-assessment$/);
    await expect(page.locator("#ai-tutor-final-assessment")).toBeFocused();
  });

  test("partial capstone work survives a reload", async ({ page }) => {
    await page.goto(DASHBOARD);
    let capstone = page.locator("#ai-tutor-capstone");
    const checkboxes = capstone.getByRole("checkbox");
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.last().check();

    await page.reload();
    capstone = page.locator("#ai-tutor-capstone");
    await expect(capstone.getByRole("checkbox").nth(0)).toBeChecked();
    await expect(capstone.getByRole("checkbox").nth(1)).toBeChecked();
    await expect(capstone.getByRole("checkbox").nth(2)).not.toBeChecked();
    await expect(capstone.getByRole("checkbox").last()).toBeChecked();
    await expect(capstone.getByRole("button", { name: "Record capstone design complete" }))
      .toBeDisabled();
  });
});

test("dashboard and representative modules reflow at 320px and 390px", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
  ]) {
    for (const route of [
      DASHBOARD,
      `/en/ai-tutor/${AI_TUTOR_COURSE_MANIFEST.modules[0].slug}/`,
      `/en/ai-tutor/${AI_TUTOR_COURSE_MANIFEST.modules.at(-1)!.slug}/`,
    ]) {
      await withIsolatedRoutePage(page, route, async (routePage) => {
        await expectNoHorizontalOverflow(routePage);
      }, { viewport });
    }
  }
});

test("the primary journey is visible before the mobile concept map", async ({ page }) => {
  await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
    const journey = routePage.locator("[data-course-journey-action]");
    const conceptMap = routePage.locator("figure").filter({ hasText: "Course concept map" }).first();
    const [journeyBox, mapBox] = await Promise.all([journey.boundingBox(), conceptMap.boundingBox()]);
    expect(journeyBox).not.toBeNull();
    expect(mapBox).not.toBeNull();
    expect(journeyBox!.y).toBeLessThan(844);
    expect(journeyBox!.y).toBeLessThan(mapBox!.y);
  }, { viewport: { width: 390, height: 844 } });
});

test("module navigation exposes an on-page outline and 44px mobile targets", async ({ page }) => {
  await withIsolatedRoutePage(
    page,
    `/en/ai-tutor/${AI_TUTOR_COURSE_MANIFEST.modules[0].slug}/`,
    async (routePage) => {
      const onPage = routePage.getByRole("navigation", { name: "On this page" });
      await expect(onPage).toBeVisible();
      await expect(onPage.getByRole("link")).toHaveCount(8);
      const externalLinks = routePage.locator('a[target="_blank"]');
      await expect(externalLinks.first()).toHaveAccessibleName(/opens in a new tab/);
      await expect(externalLinks.first()).toHaveAttribute("rel", "noopener noreferrer");

      const courseMap = routePage.locator("details").filter({ hasText: "Open module map" });
      const summary = courseMap.locator("summary");
      await summary.click();
      const targets = [
        routePage.getByRole("link", { name: "Back to Course 13" }),
        summary,
        courseMap.getByRole("link").first(),
        routePage.getByRole("button", { name: "Mark module complete" }),
      ];
      for (const target of targets) {
        const box = await target.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    },
    { viewport: { width: 390, height: 844 } },
  );
});
