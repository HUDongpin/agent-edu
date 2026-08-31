import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";
import axe from "axe-core";
import { readFileSync } from "node:fs";
import {
  GROK_PROGRESS_MILESTONES,
  GROK_PROGRESS_STORAGE_KEY,
  grokProgressPercent,
} from "../lib/grok/progress";
import { GROK_PROGRESS_RESET_QUARANTINE_KEY } from "../lib/progress-storage-contract";
import { withIsolatedRoutePage } from "./published-course-test-helpers";

type TestLesson = {
  readonly slug: string;
  readonly figureIds: readonly string[];
  readonly sourceIds: readonly string[];
};

type TestFigure = {
  readonly status: string;
  readonly sha256: string;
  readonly src: string;
  readonly srcSet: { readonly webp1120: string; readonly webp2240: string; readonly mobile: string };
  readonly derivatives: Readonly<Record<"webp1120" | "webp2240" | "mobile", {
    readonly width: number;
    readonly height: number;
    readonly sha256: string;
  }>>;
  readonly privacyReview: { readonly status: string; readonly syntheticOrPublicDataOnly: boolean };
  readonly callouts: readonly {
    readonly xPercent: number;
    readonly yPercent: number;
  }[];
};

type TestFigureVariant = keyof TestFigure["srcSet"];

type TestCourseCopy = {
  readonly meta: { readonly title: string; readonly summary: string; readonly outcome: string };
  readonly ui: { readonly durationCompact: string; readonly milestoneLegend: string };
  readonly lessons: Readonly<Record<string, {
    readonly title: string;
    readonly practice: { readonly prompt: string };
  }>>;
};

const COURSE_MANIFEST = JSON.parse(readFileSync(
  new URL("../lib/grok/course.manifest.json", import.meta.url),
  "utf8",
)) as { readonly lessons: readonly TestLesson[] };
const FIGURES = JSON.parse(readFileSync(
  new URL("../lib/grok/figures.json", import.meta.url),
  "utf8",
)) as readonly TestFigure[];
const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"] as const;
const REFLOW_LOCALES = ["en", "de", "ar", "zh-Hant"] as const;
const REFLOW_WIDTHS = [320, 375, 390, 768, 1440] as const;

function readCourseCopy(locale: (typeof LOCALES)[number]): TestCourseCopy {
  return JSON.parse(readFileSync(
    new URL(`../messages/grok/${locale}.json`, import.meta.url),
    "utf8",
  )) as TestCourseCopy;
}

const DASHBOARD = "/en/grok/";
const PROGRESS_KEY = GROK_PROGRESS_STORAGE_KEY;
const QUIZ_ATTEMPT_KEY = "aicourse.grok.quiz-attempt.v1";
const TASK_CONTRACT_DRAFT_KEY = "aicourse.grok.task-contract-draft.v1";
const CORRECT_ANSWER_INDEXES = [1, 2, 1, 2, 2, 1, 2, 1, 1, 2, 2, 1, 1, 2] as const;

async function answerQuizThroughCheckedFinalQuestion(page: Page, correctAnswers: number) {
  for (let index = 0; index < COURSE_MANIFEST.lessons.length; index += 1) {
    const correctIndex = CORRECT_ANSWER_INDEXES[index];
    const answerIndex = index < correctAnswers
      ? correctIndex
      : (correctIndex + 1) % 4;
    const quiz = page.getByTestId("grok-final-quiz");

    await quiz.locator('input[type="radio"]').nth(answerIndex).check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await expect(quiz.locator('form [role="status"]')).toContainText(
      index < correctAnswers ? "Correct" : "Not yet",
    );
    if (index < COURSE_MANIFEST.lessons.length - 1) {
      await quiz.getByRole("button", { name: "Next question" }).click();
    }
  }
}

async function completeQuiz(page: Page, correctAnswers: number) {
  await answerQuizThroughCheckedFinalQuestion(page, correctAnswers);
  await page.getByTestId("grok-final-quiz").getByRole("button", { name: "Finish quiz" }).click();
}

async function setProgressAndDispatchStorage(page: Page, raw: string) {
  await page.evaluate(({ key, nextRaw }) => {
    const oldValue = window.localStorage.getItem(key);
    window.localStorage.setItem(key, nextRaw);
    window.dispatchEvent(new StorageEvent("storage", {
      key,
      oldValue,
      newValue: nextRaw,
      storageArea: window.localStorage,
      url: window.location.href,
    }));
  }, { key: PROGRESS_KEY, nextRaw: raw });
}

async function expectMinimumTouchTarget(locator: Locator, label: string) {
  const count = await locator.count();
  expect(count, `${label} should exist`).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const target = locator.nth(index);
    await expect(target, `${label} ${index + 1} should be visible`).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `${label} ${index + 1} should have a layout box`).not.toBeNull();
    expect(box!.width, `${label} ${index + 1} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${label} ${index + 1} height`).toBeGreaterThanOrEqual(44);
  }
}

async function expectFullyInsideViewport(
  locator: Locator,
  viewport: { readonly width: number; readonly height: number },
  label: string,
) {
  await expect(locator, `${label} should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should have a layout box`).not.toBeNull();
  expect(box!.x, `${label} left edge`).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width, `${label} right edge`).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y, `${label} top edge`).toBeGreaterThanOrEqual(-1);
  expect(box!.y + box!.height, `${label} bottom edge`).toBeLessThanOrEqual(viewport.height + 1);
}

async function clickWithConfirm(locator: Locator, decision: "accept" | "dismiss") {
  let dialogType = "";
  await Promise.all([
    locator.page().waitForEvent("dialog").then(async (dialog) => {
      dialogType = dialog.type();
      if (decision === "accept") await dialog.accept();
      else await dialog.dismiss();
    }),
    locator.click(),
  ]);
  return dialogType;
}

async function denySessionStorageWrites(page: Page) {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (this === window.sessionStorage) {
        throw new DOMException("Session storage denied for deterministic testing", "SecurityError");
      }
      return originalSetItem.call(this, key, value);
    };
  });
}

async function denyGrokProgressWritesWithQuota(page: Page) {
  await page.addInitScript((progressKey) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (this === window.localStorage && key === progressKey) {
        throw new DOMException("Grok progress quota for deterministic testing", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  }, PROGRESS_KEY);
}

async function expectReloadBlockedByDirtyMemory(page: Page) {
  const dialogPromise = page.waitForEvent("dialog", { timeout: 5_000 });
  const reloadPromise = page.reload({ timeout: 2_000 }).catch(() => null);
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await reloadPromise;
}

async function seedSessionDeniedQuizAndTaskFallbacks(page: Page) {
  await page.goto(DASHBOARD);
  const quiz = page.getByTestId("grok-final-quiz");
  await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
  await quiz.locator('input[type="radio"]').nth(1).check();
  await expect(quiz.getByTestId("grok-quiz-attempt-status")).toBeVisible();

  await page
    .locator('section[aria-labelledby="grok-curriculum-title"]')
    .locator('a[href="/en/grok/task-contracts/"]')
    .click();
  await expect(page).toHaveURL(/\/en\/grok\/task-contracts\/$/);
  const builder = page.getByTestId("grok-task-contract-builder");
  await builder.getByRole("textbox", { name: "Goal", exact: true })
    .fill("Reset must clear this fallback");
  await expect(builder.getByTestId("grok-task-contract-draft-status")).toBeVisible();

  await page
    .getByTestId("grok-lesson-task-contracts")
    .locator('nav a[href="/en/grok/"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/grok\/$/);
  await expect(page.getByTestId("grok-quiz-saved-attempt")).toBeVisible();
}

async function expectSessionMemoryFallbacksClearedAfterRemount(page: Page) {
  await expect(page.getByTestId("grok-quiz-saved-attempt")).toHaveCount(0);
  await expect(page.getByTestId("grok-final-quiz").getByRole("button", {
    name: "Begin knowledge check",
  })).toBeVisible();

  await page
    .locator('section[aria-labelledby="grok-curriculum-title"]')
    .locator('a[href="/en/grok/task-contracts/"]')
    .click();
  await expect(page).toHaveURL(/\/en\/grok\/task-contracts\/$/);
  await expect(page
    .getByTestId("grok-task-contract-builder")
    .getByRole("textbox", { name: "Goal", exact: true }))
    .toHaveValue("");
}

function imagePreloadPaths(linkHeader: string | undefined): string[] {
  return (linkHeader ?? "")
    .split(/,\s*(?=<)/)
    .filter((entry) => /;\s*rel=preload(?:;|$)/i.test(entry) && /;\s*as="?image"?(?:;|$)/i.test(entry))
    .map((entry) => entry.match(/^<([^>]+)>/)?.[1])
    .filter((path): path is string => Boolean(path))
    .map((path) => new URL(path, "https://aicourse.top").pathname);
}

async function documentImagePreloadPaths(page: Page): Promise<string[]> {
  return page.locator('link[rel="preload"][as="image"]').evaluateAll((nodes) => (
    nodes.map((node) => new URL((node as HTMLLinkElement).href).pathname)
  ));
}

async function allImagePreloadPaths(page: Page, linkHeader: string | undefined): Promise<string[]> {
  return [...new Set([
    ...imagePreloadPaths(linkHeader),
    ...await documentImagePreloadPaths(page),
  ])];
}

type AxeRunOnly = {
  readonly type: "rule" | "tag";
  readonly values: readonly string[];
};

async function getAxeViolations(
  page: Page,
  runOnly: AxeRunOnly = {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async (requestedRunOnly) => {
    const axeApi = (window as unknown as {
      axe: {
        run: (
          root: Document,
          options: Readonly<Record<string, unknown>>,
        ) => Promise<{
          violations: readonly {
            id: string;
            impact: string | null;
            nodes: readonly {
              target: readonly string[];
              html: string;
              failureSummary?: string;
            }[];
          }[];
        }>;
      };
    }).axe;
    const results = await axeApi.run(document, {
      runOnly: requestedRunOnly,
      resultTypes: ["violations"],
    });
    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    }));
  }, runOnly);
}

test.describe("How to Use Grok course", () => {
  test("local Grok pages do not load Vercel-only analytics endpoints", async ({ page }) => {
    const analyticsRequests: string[] = [];
    const analyticsConsoleMessages: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("va.vercel-scripts.com") || url.includes("/_vercel/insights/")) {
        analyticsRequests.push(url);
      }
    });
    page.on("console", (message) => {
      if (/Vercel Web Analytics|vercel[^\n]*analytics/i.test(message.text())) {
        analyticsConsoleMessages.push(message.text());
      }
    });

    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);
    const hostname = new URL(page.url()).hostname;
    test.skip(!["127.0.0.1", "localhost"].includes(hostname), "This assertion is specific to local hosting.");
    await expect(page.getByTestId("grok-course-dashboard")).toBeVisible();
    await page.waitForTimeout(750);

    expect(analyticsRequests).toEqual([]);
    expect(analyticsConsoleMessages).toEqual([]);
  });

  test("dashboard exposes the complete evidence-led curriculum", async ({ page }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/How to Use Grok/);
    await expect(page.getByRole("heading", { level: 1, name: "How to Use Grok" })).toBeVisible();
    await expect(page.locator('section[aria-labelledby="grok-curriculum-title"] ol > li > a')).toHaveCount(14);
    await expect(page.getByText("11h 35m", { exact: true })).toBeVisible();
    await expect(page.locator('time[datetime="2026-08-23"]')).toBeVisible();
    await expect(page.getByTestId("grok-final-quiz")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Independent course notice" })).toBeVisible();
    await expect(page.getByText("The site may still count anonymous page views.", { exact: false })).toBeVisible();
    await expect(page.getByTestId("grok-course-dashboard").getByRole("img")).toHaveCount(4);
  });

  test("the hero keeps course identity, outcome, and the progress-aware action above the fold", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ] as const;

    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        const response = await page.goto(DASHBOARD, { waitUntil: "domcontentloaded" });
        expect(response?.status(), `${colorScheme} ${viewport.width}px dashboard`).toBe(200);

        const hero = page.locator('section[aria-labelledby="grok-course-title"]');
        const title = hero.getByRole("heading", { level: 1, name: "How to Use Grok" });
        const outcome = hero.getByTestId("grok-hero-outcome");
        const action = hero.getByTestId("grok-hero-journey-action");
        await expect(outcome).toContainText(readCourseCopy("en").meta.outcome);
        await expect(action).toHaveAttribute("href", "/en/grok/map-grok/");
        await expectFullyInsideViewport(
          title,
          viewport,
          `${colorScheme} ${viewport.width}px course identity`,
        );
        await expectFullyInsideViewport(
          outcome,
          viewport,
          `${colorScheme} ${viewport.width}px course outcome`,
        );
        await expectFullyInsideViewport(
          action,
          viewport,
          `${colorScheme} ${viewport.width}px primary action`,
        );
        await expectMinimumTouchTarget(action, `${colorScheme} ${viewport.width}px hero action`);
        const overflow = await page.evaluate(() => (
          document.documentElement.scrollWidth - document.documentElement.clientWidth
        ));
        expect(overflow, `${colorScheme} ${viewport.width}px dashboard overflow`).toBeLessThanOrEqual(1);

        const hierarchy = await hero.evaluate((node) => {
          const heading = node.querySelector("h1") as HTMLElement;
          const summary = node.querySelector("h1 + p") as HTMLElement;
          const outcomeNode = node.querySelector('[data-testid="grok-hero-outcome"]') as HTMLElement;
          const actionNode = node.querySelector('[data-testid="grok-hero-journey-action"]') as HTMLElement;
          const headingBox = heading.getBoundingClientRect();
          const summaryBox = summary.getBoundingClientRect();
          const outcomeBox = outcomeNode.getBoundingClientRect();
          const actionBox = actionNode.getBoundingClientRect();
          return {
            headingBottom: headingBox.bottom,
            headingFontSize: Number.parseFloat(getComputedStyle(heading).fontSize),
            summaryTop: summaryBox.top,
            summaryBottom: summaryBox.bottom,
            summaryFontSize: Number.parseFloat(getComputedStyle(summary).fontSize),
            outcomeTop: outcomeBox.top,
            outcomeBottom: outcomeBox.bottom,
            actionTop: actionBox.top,
          };
        });
        expect(hierarchy.headingFontSize).toBeGreaterThan(hierarchy.summaryFontSize * 1.2);
        expect(hierarchy.summaryTop).toBeGreaterThanOrEqual(hierarchy.headingBottom - 1);
        expect(hierarchy.outcomeTop).toBeGreaterThanOrEqual(hierarchy.summaryBottom - 1);
        expect(hierarchy.actionTop).toBeGreaterThanOrEqual(hierarchy.outcomeBottom - 1);
      }
    }
  });

  test("the dashboard passes focused color-contrast checks in light and dark themes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      const response = await page.goto(DASHBOARD, { waitUntil: "domcontentloaded" });
      expect(response?.status(), colorScheme).toBe(200);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      expect(
        await getAxeViolations(page, { type: "rule", values: ["color-contrast"] }),
        `${colorScheme} dashboard color contrast`,
      ).toEqual([]);
    }
  });

  test("mobile lessons start with a compact course map and put the lesson heading in the first viewport", async ({ page }) => {
    const cases = [
      { locale: "en", slug: "map-grok", viewport: { width: 390, height: 844 } },
      { locale: "de", slug: "teaching-workflow", viewport: { width: 320, height: 844 } },
    ] as const;

    for (const { locale, slug, viewport } of cases) {
      await page.setViewportSize(viewport);
      const path = `/${locale}/grok/${slug}/`;
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBe(200);

      const mobileMap = page.getByTestId("grok-mobile-course-map");
      await expect(mobileMap).toBeVisible();
      await expect(page.getByTestId("grok-desktop-course-map")).toBeHidden();
      await expect(mobileMap).not.toHaveAttribute("open", "");
      await expect(mobileMap.locator("summary")).toContainText(/\d+\s*\/\s*14/);
      const collapsedBox = await mobileMap.boundingBox();
      expect(collapsedBox, `${path} mobile course map`).not.toBeNull();
      expect(collapsedBox!.height, `${path} collapsed course-map height`).toBeLessThanOrEqual(80);
      await expectFullyInsideViewport(
        page.locator("article > header h1"),
        viewport,
        `${path} lesson heading`,
      );

      await mobileMap.locator("summary").click();
      await expect(mobileMap).toHaveAttribute("open", "");
      await expect(mobileMap.locator("nav a")).toHaveCount(14);
      await expect(mobileMap.locator('a[aria-current="page"]')).toBeVisible();
    }
  });

  for (const lesson of COURSE_MANIFEST.lessons) {
    test(`English lesson ${lesson.slug} renders its authentic figures and evidence`, async ({ page }) => {
      const response = await page.goto(`/en/grok/${lesson.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId(`grok-lesson-${lesson.slug}`)).toBeVisible();
      await expect(page.locator("article > header h1")).toBeVisible();

      const figures = page.locator('[data-testid^="grok-figure-"]');
      await expect(figures).toHaveCount(lesson.figureIds.length);
      for (let index = 0; index < lesson.figureIds.length; index += 1) {
        const figure = figures.nth(index);
        await expect(figure).toHaveAttribute("data-figure-status", "available");
        await expect(figure).toHaveAttribute("data-capture-sha256", /^[a-f0-9]{64}$/);
        const image = figure.getByRole("img");
        await expect(image).toBeVisible();
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((node: HTMLImageElement) => (
          node.complete && node.currentSrc.length > 0 && node.naturalWidth > 0
        ))).toBe(true);
        const imageEvidence = await image.evaluate(async (node: HTMLImageElement) => {
          const response = await fetch(node.currentSrc);
          const bitmap = await createImageBitmap(await response.blob());
          const evidence = {
            responseStatus: response.status,
            contentType: response.headers.get("content-type"),
            currentPath: new URL(node.currentSrc).pathname,
            naturalWidth: node.naturalWidth,
            naturalHeight: node.naturalHeight,
            decodedWidth: bitmap.width,
            decodedHeight: bitmap.height,
          };
          bitmap.close();
          return evidence;
        });
        expect(imageEvidence.responseStatus).toBe(200);
        expect(imageEvidence.contentType).toContain("image/webp");
        expect(imageEvidence.currentPath).toMatch(
          /^\/courses\/grok\/figures\/fig-\d{2}-[a-z0-9-]+-(?:1120|2240|mobile)\.webp$/,
        );
        expect(imageEvidence.naturalWidth).toBeGreaterThan(0);
        expect(imageEvidence.naturalHeight).toBeGreaterThan(0);
        const figureRecord = FIGURES.find((record) => (
          Object.values(record.srcSet).includes(imageEvidence.currentPath)
        ));
        expect(figureRecord, imageEvidence.currentPath).toBeDefined();
        const variant = (Object.keys(figureRecord!.srcSet) as TestFigureVariant[]).find(
          (candidate) => figureRecord!.srcSet[candidate] === imageEvidence.currentPath,
        );
        expect(variant, imageEvidence.currentPath).toBeDefined();
        expect(imageEvidence.naturalWidth / imageEvidence.naturalHeight).toBeCloseTo(
          figureRecord!.derivatives[variant!].width / figureRecord!.derivatives[variant!].height,
          2,
        );
        expect(imageEvidence.decodedWidth).toBe(figureRecord!.derivatives[variant!].width);
        expect(imageEvidence.decodedHeight).toBe(figureRecord!.derivatives[variant!].height);
        await expect(figure.getByText("Figure provenance")).toBeVisible();
        await expect(figure.locator('a[target="_blank"]')).toHaveCount(1);
      }

      await expect(page.locator('section[aria-labelledby="grok-sources-title"] article')).toHaveCount(
        lesson.sourceIds.length,
      );
      await expect(page.locator('section[aria-labelledby="grok-practice-title"]')).toBeVisible();
      await expect(page.getByText("Safety boundary:", { exact: true })).toBeVisible();
      await expect(page.getByTestId(`grok-lesson-completion-${lesson.slug}`)).toBeVisible();
    });
  }

  test("all ten local figure records are unique, hashed, responsive and privacy-reviewed", () => {
    expect(FIGURES).toHaveLength(10);
    expect(new Set(FIGURES.map((figure) => figure.sha256)).size).toBe(10);
    for (const figure of FIGURES) {
      expect(figure.status).toBe("available");
      expect(figure.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(figure.src).toMatch(/^\/courses\/grok\/figures\/fig-\d{2}-[a-z0-9-]+\.png$/);
      expect(figure.srcSet.webp1120).toMatch(/-1120\.webp$/);
      expect(figure.srcSet.webp2240).toMatch(/-2240\.webp$/);
      expect(figure.srcSet.mobile).toMatch(/-mobile\.webp$/);
      for (const derivative of Object.values(figure.derivatives)) {
        expect(derivative.width).toBeGreaterThanOrEqual(320);
        expect(derivative.height).toBeGreaterThanOrEqual(200);
        expect(derivative.sha256).toMatch(/^[a-f0-9]{64}$/);
      }
      expect(figure.privacyReview.status).toBe("passed");
      expect(figure.privacyReview.syntheticOrPublicDataOnly).toBe(true);
      expect(figure.callouts.length).toBeGreaterThan(0);
    }
  });

  test("a lesson requests exactly one selected WebP without a raw PNG or image preload", async ({ page }) => {
    const figureManifest = FIGURES.find((figure) => figure.src.includes("fig-01-"))!;
    const requestedFigurePaths: string[] = [];
    page.on("request", (request) => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith("/courses/grok/figures/")) requestedFigurePaths.push(path);
    });

    const response = await page.goto("/en/grok/map-grok/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    expect(await allImagePreloadPaths(page, (await response!.allHeaders()).link)).toEqual([]);

    const image = page.getByTestId("grok-figure-fig-01").getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
      .toBe(true);
    const currentPath = await image.evaluate((node: HTMLImageElement) => new URL(node.currentSrc).pathname);
    expect(Object.values(figureManifest.srcSet)).toContain(currentPath);
    await expect.poll(() => requestedFigurePaths.filter((path) => path === currentPath).length).toBe(1);

    const requestsForFigure = requestedFigurePaths.filter((path) => (
      path === figureManifest.src || Object.values(figureManifest.srcSet).includes(path)
    ));
    expect(requestsForFigure).toEqual([currentPath]);
    expect(requestedFigurePaths).not.toContain(figureManifest.src);
  });

  test("the dashboard hero has one image preload and one matching network request", async ({ page }) => {
    const heroManifest = FIGURES.find((figure) => figure.src.includes("fig-01-"))!;
    const heroPath = heroManifest.srcSet.webp1120;
    const requestedHeroPaths: string[] = [];
    page.on("request", (request) => {
      const path = new URL(request.url()).pathname;
      if (path === heroPath || path === heroManifest.src) requestedHeroPaths.push(path);
    });

    const response = await page.goto(DASHBOARD, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    const heroImage = page.locator('section[aria-labelledby="grok-course-title"] figure img');
    await expect.poll(() => heroImage.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
      .toBe(true);

    const preloadPaths = await allImagePreloadPaths(page, (await response!.allHeaders()).link);
    expect(preloadPaths).toEqual([heroPath]);
    await expect.poll(() => requestedHeroPaths.filter((path) => path === heroPath).length).toBe(1);
    expect(requestedHeroPaths).toEqual([heroPath]);
  });

  test("the held mobile photo-edit derivative reserves its final geometry without layout shift", async ({ page }) => {
    test.setTimeout(60_000);
    const figureManifest = FIGURES.find((figure) => figure.src.includes("fig-09-"))!;
    const mobilePath = figureManifest.srcSet.mobile;
    let signalRequestStarted = () => {};
    const requestStarted = new Promise<void>((resolve) => { signalRequestStarted = resolve; });
    let releaseImage = () => {};
    const imageGate = new Promise<void>((resolve) => { releaseImage = resolve; });
    let interceptedRequests = 0;
    let interceptedPath = "";

    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(`**${mobilePath}`, async (route) => {
      interceptedRequests += 1;
      interceptedPath = new URL(route.request().url()).pathname;
      signalRequestStarted();
      await imageGate;
      await route.continue();
    });
    const response = await page.goto("/en/grok/imagine-multimodal/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const figure = page.getByTestId("grok-figure-fig-09");
    const image = figure.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await requestStarted;
    const naturalWidthBeforeLoad = await image.evaluate((node: HTMLImageElement) => node.naturalWidth);
    const before = await image.boundingBox();
    expect(before).not.toBeNull();
    expect(interceptedPath).toBe(mobilePath);
    expect(naturalWidthBeforeLoad).toBe(0);
    await expect(figure.locator('source[media="(max-width: 640px)"]'))
      .toHaveAttribute("width", String(figureManifest.derivatives.mobile.width));
    await expect(figure.locator('source[media="(max-width: 640px)"]'))
      .toHaveAttribute("height", String(figureManifest.derivatives.mobile.height));

    releaseImage();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => ({
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      currentPath: node.currentSrc ? new URL(node.currentSrc).pathname : "",
    }))).toEqual({
      naturalWidth: figureManifest.derivatives.mobile.width,
      naturalHeight: figureManifest.derivatives.mobile.height,
      currentPath: mobilePath,
    });
    const after = await image.boundingBox();
    expect(after).not.toBeNull();
    expect(interceptedRequests).toBe(1);
    expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(after!.width - before!.width)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(after!.height - before!.height)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(
      before!.height
      - (before!.width * figureManifest.derivatives.mobile.height
        / figureManifest.derivatives.mobile.width),
    )).toBeLessThanOrEqual(0.5);
  });

  test("catalogue adapter counts fourteen lessons, quiz and capstone as sixteen milestones", () => {
    expect(GROK_PROGRESS_MILESTONES).toBe(16);
    expect(grokProgressPercent({
      schemaVersion: 1,
      lessons: Object.fromEntries(COURSE_MANIFEST.lessons.map((lesson) => [lesson.slug, true])),
      quizBest: 12,
      quizPassed: true,
      capstoneChecks: [true, true, true, true, true, true, true],
      capstoneReady: true,
    })).toBe(100);
    expect(grokProgressPercent({
      schemaVersion: 1,
      lessons: { "map-grok": true },
      quizPassed: false,
      capstoneReady: false,
    })).toBe(6);
    expect(grokProgressPercent({
      schemaVersion: 1,
      lessons: Object.fromEntries(COURSE_MANIFEST.lessons.map((lesson) => [lesson.slug, true])),
      quizBest: 0,
      quizPassed: true,
      capstoneChecks: [false, false, false, false, false, false, false],
      capstoneReady: true,
    })).toBe(88);
    expect(grokProgressPercent({ schemaVersion: 999, lessons: { "map-grok": true } })).toBe(0);
  });

  test("catalogue, homepage, and My Learning share exact Course 5 progress", async ({ page }) => {
    await page.addInitScript(({ key, guardKey }) => {
      if (window.sessionStorage.getItem(guardKey) === "1") return;
      window.sessionStorage.setItem(guardKey, "1");
      window.localStorage.setItem(key, JSON.stringify({
        schemaVersion: 1,
        lessons: { "map-grok": true },
        quizBest: 0,
        quizPassed: false,
        capstoneChecks: [false, false, false, false, false, false, false],
        capstoneReady: false,
      }));
    }, { key: PROGRESS_KEY, guardKey: `${PROGRESS_KEY}.e2e-seeded` });

    const catalogueResponse = await page.goto("/en/courses/");
    expect(catalogueResponse?.status()).toBe(200);
    const card = page.locator("#how-to-use-grok");
    await expect(card.getByRole("heading", { name: "How to Use Grok" })).toBeVisible();
    await expect(card).toContainText("Course 5");
    await expect(card).toContainText("14 lessons, 11 hours 35 minutes, 10 authentic UI figures");
    await expect(card.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6");
    await expect(card.getByRole("link")).toHaveAttribute(
      "href",
      `/en/grok/${COURSE_MANIFEST.lessons[1].slug}/`,
    );
    const catalogueJsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map((value) => JSON.parse(value) as Record<string, unknown>)
      .find((value) => value["@type"] === "ItemList") as {
        itemListElement: readonly {
          position: number;
          item: { name: string; url: string; inLanguage: readonly string[]; hasPart: readonly unknown[] };
        }[];
      } | undefined;
    const grokListItem = catalogueJsonLd?.itemListElement.find(
      (item) => item.item.url === "https://aicourse.top/en/grok/",
    );
    expect(grokListItem?.item).toMatchObject({
      name: "How to Use Grok",
      url: "https://aicourse.top/en/grok/",
      inLanguage: [...LOCALES],
    });
    expect(grokListItem?.item.hasPart).toHaveLength(14);
    const softwareEngineeringListItem = catalogueJsonLd?.itemListElement.find(
      (item) => item.item.url === "https://aicourse.top/en/software-engineering/",
    );
    expect(softwareEngineeringListItem?.item).toMatchObject({
      name: "Software Engineering with Agentic AI",
      inLanguage: ["en"],
    });

    const homeResponse = await page.goto("/en/");
    expect(homeResponse?.status()).toBe(200);
    const homeProgress = page.locator(".progress-course").filter({ hasText: "How to Use Grok" });
    await expect(homeProgress.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6");
    await expect(homeProgress.getByRole("link", { name: /Resume/ })).toHaveAttribute(
      "href",
      `/en/grok/${COURSE_MANIFEST.lessons[1].slug}/`,
    );

    const learningResponse = await page.goto("/en/learning/");
    expect(learningResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "My Learning" })).toBeVisible();
    page.once("dialog", async (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear all progress" }).click();
    await expect(page.locator('.learning-feedback[role="status"][aria-live="polite"]'))
      .toHaveText("All active learning progress on this device was cleared.");

    await page.goto("/en/");
    await expect(page.locator(".progress-course").filter({ hasText: "How to Use Grok" })).toHaveCount(0);
    expect(await page.evaluate((key) => window.localStorage.getItem(key), PROGRESS_KEY)).toBeNull();
  });

  for (const locale of LOCALES) {
    test(`${locale} materialises localized visible and machine-readable course copy`, async ({ page }) => {
      const copy = readCourseCopy(locale);
      const response = await page.goto(`/${locale}/grok/`);
      expect(response?.status(), locale).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.getByRole("heading", { level: 1, name: copy.meta.title })).toBeVisible();
      const numberFormat = new Intl.NumberFormat(locale);
      const localizedDuration = copy.ui.durationCompact
        .replace("{hours}", numberFormat.format(11))
        .replace("{minutes}", numberFormat.format(35));
      await expect(page.getByText(localizedDuration, { exact: true })).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(copy.meta.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", copy.meta.summary);
      await expect(page.getByTestId("grok-milestone-legend")).toHaveText(copy.ui.milestoneLegend);
      const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
      expect(jsonLd).toContain(`"name":"${copy.meta.title}"`);
      expect(jsonLd).toContain(`"inLanguage":"${locale}"`);
      if (locale !== "en") expect(copy.meta.title).not.toBe(readCourseCopy("en").meta.title);
    });
  }

  test("every non-English practice placeholder is translated without changing its contract", () => {
    const english = readCourseCopy("en");
    for (const locale of LOCALES.filter((candidate) => candidate !== "en")) {
      const localized = readCourseCopy(locale);
      for (const lesson of COURSE_MANIFEST.lessons) {
        const expected = [...english.lessons[lesson.slug].practice.prompt.matchAll(/\[([^\]\n]+)\]/g)]
          .map((match) => match[1]);
        const actual = [...localized.lessons[lesson.slug].practice.prompt.matchAll(/\[([^\]\n]+)\]/g)]
          .map((match) => match[1]);
        expect(actual, `${locale}/${lesson.slug} placeholder count`).toHaveLength(expected.length);
        actual.forEach((placeholder, index) => {
          expect(placeholder, `${locale}/${lesson.slug} placeholder ${index + 1}`).not.toBe(expected[index]);
        });
      }
    }
  });

  for (const locale of ["en", "de", "ar"] as const) {
    test(`${locale} standalone lesson and dashboard links expose 44px touch targets`, async ({ page }) => {
      const viewport = { width: 390, height: 844 };
      await withIsolatedRoutePage(page, `/${locale}/grok/map-grok/`, async (routePage) => {
        const lesson = routePage.getByTestId("grok-lesson-map-grok");
        await expectMinimumTouchTarget(
          lesson.locator(`nav a[href="/${locale}/grok/"]`).first(),
          `${locale} breadcrumb link`,
        );

        const figure = routePage.getByTestId("grok-figure-fig-01");
        await figure.locator("summary").click();
        await expectMinimumTouchTarget(
          figure.locator('details > a[target="_blank"]'),
          `${locale} figure-source link`,
        );
        await expectMinimumTouchTarget(
          lesson.locator(
            'section[aria-labelledby="grok-sources-title"] article > a[target="_blank"]',
          ),
          `${locale} source-card links`,
        );
      }, { viewport });

      await withIsolatedRoutePage(page, `/${locale}/grok/`, async (routePage) => {
        await expectMinimumTouchTarget(
          routePage
            .getByTestId("grok-course-dashboard")
            .locator(`a[href="/${locale}/courses/"]`),
          `${locale} catalogue-back link`,
        );
      }, { viewport });
    });
  }

  test("Arabic keeps authentic interface figures LTR and marker centers on the manifest x coordinate", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/ar/grok/map-grok/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const figure = page.getByTestId("grok-figure-fig-01");
    const imageArea = figure.locator('div[aria-describedby="fig-01-caption"][dir="ltr"]');
    await expect(imageArea).toHaveCount(1);
    const image = figure.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth > 0)).toBe(true);
    const marker = imageArea.locator(':scope > span[aria-hidden="true"] > span').first();
    await expect(marker).toBeVisible();
    const imageBox = await image.boundingBox();
    const markerBox = await marker.boundingBox();
    expect(imageBox).not.toBeNull();
    expect(markerBox).not.toBeNull();
    const figureManifest = FIGURES.find((record) => record.src.includes("fig-01-"))!;
    const expectedCenterX = imageBox!.x
      + imageBox!.width * figureManifest.callouts[0].xPercent / 100;
    const actualCenterX = markerBox!.x + markerBox!.width / 2;
    expect(Math.abs(actualCenterX - expectedCenterX)).toBeLessThanOrEqual(2);
  });

  test("forward and back direction affordances mirror once under RTL", async ({ page }) => {
    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/${locale}/grok/`);
      const forwardIcon = page
        .getByTestId("grok-hero-journey-action")
        .locator('span[aria-hidden="true"]')
        .last();
      await expect(forwardIcon).toHaveText(locale === "ar" ? "←" : "→");
      const forwardScaleX = await forwardIcon.evaluate((node) => {
        const transform = getComputedStyle(node).transform;
        if (transform === "none") return 1;
        const values = transform.match(/matrix(?:3d)?\(([^)]+)\)/)?.[1]
          .split(",")
          .map((value) => Number.parseFloat(value.trim()));
        return values?.[0] ?? Number.NaN;
      });
      expect(forwardScaleX, `${locale} forward action should not be double-mirrored`).toBeCloseTo(1, 2);

      await page.goto(`/${locale}/grok/map-grok/`);
      const backLink = page
        .getByTestId("grok-lesson-map-grok")
        .locator(`nav a[href="/${locale}/grok/"]`)
        .first();
      const backIcon = backLink.locator('span[aria-hidden="true"]').first();
      await expect(backIcon).toHaveText("←");
      const backScaleX = await backIcon.evaluate((node) => {
        const transform = getComputedStyle(node).transform;
        if (transform === "none") return 1;
        const values = transform.match(/matrix(?:3d)?\(([^)]+)\)/)?.[1]
          .split(",")
          .map((value) => Number.parseFloat(value.trim()));
        return values?.[0] ?? Number.NaN;
      });
      expect(backScaleX, `${locale} back action direction`).toBeCloseTo(locale === "ar" ? -1 : 1, 2);
    }
  });

  test("lesson metadata is canonical, reciprocal and course-specific", async ({ page }) => {
    const frenchCopy = readCourseCopy("fr");
    await page.goto("/fr/grok/research-workflow/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/fr/grok/research-workflow/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/grok/research-workflow/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/grok/research-workflow/",
    );
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.join("\n")).toContain("LearningResource");
    expect(jsonLd.join("\n")).toContain("BreadcrumbList");
    expect(jsonLd.join("\n")).toContain(frenchCopy.meta.title);
    expect(jsonLd.join("\n")).toContain(frenchCopy.lessons["research-workflow"].title);
    expect(jsonLd.join("\n")).not.toContain("How to Use Grok");
  });

  test("lesson progress persists and Grok-only reset preserves unrelated storage", async ({ page }) => {
    await page.goto("/en/grok/map-grok/");
    await page.evaluate(() => window.localStorage.setItem("unrelated.course", "keep-me"));
    const completion = page.getByTestId("grok-lesson-completion-map-grok");
    await completion.getByRole("button", { name: "Mark lesson complete" }).click();
    await expect(completion.getByRole("button")).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await expect(completion.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    let stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), PROGRESS_KEY);
    expect(stored.lessons["map-grok"]).toBe(true);

    await page.goto(DASHBOARD);
    const firstMilestone = page.getByTestId("grok-course-progress")
      .locator('ol a[href="/en/grok/map-grok/"]');
    await expect(firstMilestone).toHaveAccessibleName(/, Complete$/);
    await expect(firstMilestone.getByText("✓", { exact: true })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(firstMilestone).toHaveAccessibleName(/, Incomplete$/);
    await expect(firstMilestone.getByText("✓", { exact: true })).toHaveCount(0);
    stored = await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY);
    expect(stored).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("unrelated.course"))).toBe("keep-me");
  });

  test("last-visited resumption and completed-lesson course-map state stay distinct", async ({ page }) => {
    await page.goto("/en/grok/map-grok/");
    const completion = page.getByTestId("grok-lesson-completion-map-grok");
    await completion.getByRole("button", { name: "Mark lesson complete" }).click();
    await expect(completion.getByRole("button")).toHaveAttribute("aria-pressed", "true");

    const lastVisitedPath = "/en/grok/search-verify/";
    await page.goto(lastVisitedPath);
    await expect.poll(() => page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw).lastVisitedLesson : null;
    }, PROGRESS_KEY)).toBe("search-verify");

    await page.goto(DASHBOARD);
    await expect(page.getByTestId("grok-hero-journey-action")).toHaveAttribute(
      "href",
      lastVisitedPath,
    );
    await expect(page.getByTestId("grok-progress-journey-action")).toHaveAttribute(
      "href",
      lastVisitedPath,
    );

    const legend = page.getByTestId("grok-milestone-legend");
    await expect(legend).toBeVisible();
    await expect(legend).toContainText("Q");
    await expect(legend).toContainText(/final knowledge check/i);
    await expect(legend).toContainText("C");
    await expect(legend).toContainText(/portfolio capstone/i);
    await expect(page.locator('[data-milestone="quiz"]')).toBeVisible();
    await expect(page.locator('[data-milestone="capstone"]')).toBeVisible();

    await page.goto("/en/grok/read-interface/");
    const completedLink = page
      .getByTestId("grok-desktop-course-map")
      .locator('a[href="/en/grok/map-grok/"]');
    await expect(completedLink).toHaveAccessibleName(/, Complete$/);
    await expect(completedLink.getByText("✓", { exact: true })).toBeVisible();
    await expect(completedLink.locator("..")).toHaveAttribute("data-complete", "true");
  });

  test("every malformed schema-v1 shape stays byte-exact until explicit verified-quarantine repair", async ({ page }) => {
    test.setTimeout(120_000);
    const malformedCases = [
      {
        label: "missing required quizBest",
        raw: '{"schemaVersion":1,"lessons":{},"quizPassed":false,"capstoneChecks":[false,false,false,false,false,false,false],"capstoneReady":false}',
      },
      {
        label: "unknown lesson key",
        raw: '{"schemaVersion":1,"lessons":{"unknown-lesson":true},"quizBest":0,"quizPassed":false,"capstoneChecks":[false,false,false,false,false,false,false],"capstoneReady":false}',
      },
      {
        label: "false lesson value",
        raw: '{"schemaVersion":1,"lessons":{"map-grok":false},"quizBest":0,"quizPassed":false,"capstoneChecks":[false,false,false,false,false,false,false],"capstoneReady":false}',
      },
      {
        label: "out-of-range quizBest",
        raw: '{"schemaVersion":1,"lessons":{},"quizBest":15,"quizPassed":false,"capstoneChecks":[false,false,false,false,false,false,false],"capstoneReady":false}',
      },
      {
        label: "noninteger quizBest",
        raw: '{"schemaVersion":1,"lessons":{},"quizBest":1.5,"quizPassed":false,"capstoneChecks":[false,false,false,false,false,false,false],"capstoneReady":false}',
      },
      {
        label: "wrong-length capstoneChecks",
        raw: '{"schemaVersion":1,"lessons":{},"quizBest":0,"quizPassed":false,"capstoneChecks":[false],"capstoneReady":false}',
      },
      {
        label: "nonboolean capstoneChecks",
        raw: '{"schemaVersion":1,"lessons":{},"quizBest":0,"quizPassed":false,"capstoneChecks":[false,false,false,false,false,false,"false"],"capstoneReady":false}',
      },
    ] as const;

    await page.goto(DASHBOARD);
    await page.evaluate(() => localStorage.setItem("unrelated.course", "keep-me"));
    let warning = page.getByTestId("grok-progress-storage-warning");
    const repairStatus = page.getByTestId("grok-progress-repair-status");

    for (const malformed of malformedCases) {
      await page.evaluate((quarantineKey) => {
        localStorage.removeItem(quarantineKey);
      }, GROK_PROGRESS_RESET_QUARANTINE_KEY);
      await setProgressAndDispatchStorage(page, malformed.raw);
      warning = page.getByTestId("grok-progress-storage-warning");
      await expect(warning, malformed.label).toHaveAttribute("data-storage-reason", "corrupt");
      await expect(warning, malformed.label).toBeVisible();
      expect(
        await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY),
        malformed.label,
      ).toBe(malformed.raw);

      await page.getByTestId("grok-hero-journey-action").click();
      await expect(page, malformed.label).toHaveURL(/\/en\/grok\/map-grok\/$/);
      const corruptCompletion = page
        .getByTestId("grok-lesson-completion-map-grok")
        .getByRole("button");
      await corruptCompletion.click();
      await expect(corruptCompletion, malformed.label).toHaveAttribute("aria-pressed", "true");
      expect(
        await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY),
        `${malformed.label} after lesson visit`,
      ).toBe(malformed.raw);

      await page
        .getByTestId("grok-lesson-map-grok")
        .locator('nav a[href="/en/grok/"]')
        .first()
        .click();
      await expect(page, malformed.label).toHaveURL(/\/en\/grok\/$/);
      warning = page.getByTestId("grok-progress-storage-warning");
      await expect(warning, malformed.label).toHaveAttribute("data-storage-reason", "corrupt");
      expect(
        await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY),
        `${malformed.label} before repair`,
      ).toBe(malformed.raw);

      expect(await clickWithConfirm(page.getByTestId("grok-repair-progress"), "accept"))
        .toBe("confirm");
      await expect(warning, malformed.label).toHaveCount(0);
      await expect(repairStatus, malformed.label).toContainText(/preserved|reset/i);
      expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBeNull();
      expect(
        await page.evaluate(
          (key) => localStorage.getItem(key),
          GROK_PROGRESS_RESET_QUARANTINE_KEY,
        ),
        `${malformed.label} quarantine bytes`,
      ).toBe(malformed.raw);
      expect(await page.evaluate(() => localStorage.getItem("unrelated.course"))).toBe("keep-me");
    }

    const conflictingRaw = '{"schemaVersion":1,"lessons":{},"quizBest":"wrong-type"}';
    await setProgressAndDispatchStorage(page, conflictingRaw);
    await expect(warning).toHaveAttribute("data-storage-reason", "corrupt");
    expect(await clickWithConfirm(page.getByTestId("grok-repair-progress"), "accept"))
      .toBe("confirm");
    await expect(warning).toHaveAttribute("data-storage-reason", "corrupt");
    await expect(repairStatus).toContainText(/could not|failed|unable/i);
    expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBe(conflictingRaw);
    expect(await page.evaluate(
      (key) => localStorage.getItem(key),
      GROK_PROGRESS_RESET_QUARANTINE_KEY,
    )).toBe(malformedCases[malformedCases.length - 1].raw);
  });

  test("a cross-tab localStorage clear invalidates cached Grok progress", async ({ page }) => {
    await page.goto("/en/grok/map-grok/");
    const completionButton = page
      .getByTestId("grok-lesson-completion-map-grok")
      .getByRole("button");
    await setProgressAndDispatchStorage(page, JSON.stringify({
      schemaVersion: 1,
      lessons: { "map-grok": true },
      quizBest: 0,
      quizPassed: false,
      capstoneChecks: [false, false, false, false, false, false, false],
      capstoneReady: false,
    }));
    await expect(completionButton).toHaveAttribute("aria-pressed", "true");

    await page.evaluate(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", {
        key: null,
        oldValue: null,
        newValue: null,
        storageArea: window.localStorage,
        url: window.location.href,
      }));
    });
    await expect(completionButton).toHaveAttribute("aria-pressed", "false");
  });

  test("semantically impossible completion flags fail closed", async ({ page }) => {
    await page.goto(DASHBOARD);
    await setProgressAndDispatchStorage(page, JSON.stringify({
      schemaVersion: 1,
      lessons: {},
      quizBest: 0,
      quizPassed: true,
      capstoneChecks: [false, false, false, false, false, false, false],
      capstoneReady: true,
    }));
    const progress = page.getByTestId("grok-course-progress");
    await expect(progress.locator("output")).toContainText(/0\s*\/\s*16/);
    await expect(progress.locator('a[href="#grok-final-quiz"]')).toHaveAccessibleName(/, Incomplete$/);
    await expect(progress.getByRole("link", { name: "Portfolio capstone, Incomplete" }))
      .toBeVisible();
  });

  test("reset handles a failed quiz best and partial capstone without deleting unrelated storage", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(() => window.localStorage.setItem("unrelated.course", "keep-me"));
    const resetButton = page.getByRole("button", { name: "Reset progress" });
    const partialStates = [
      {
        schemaVersion: 1,
        lessons: {},
        quizBest: 11,
        quizPassed: false,
        capstoneChecks: [false, false, false, false, false, false, false],
        capstoneReady: false,
      },
      {
        schemaVersion: 1,
        lessons: {},
        quizBest: 0,
        quizPassed: false,
        capstoneChecks: [true, false, false, false, false, false, false],
        capstoneReady: false,
      },
    ] as const;

    for (const progress of partialStates) {
      await setProgressAndDispatchStorage(page, JSON.stringify(progress));
      await expect(resetButton).toBeEnabled();
      page.once("dialog", (dialog) => dialog.accept());
      await resetButton.click();
      await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY))
        .toBeNull();
      expect(await page.evaluate(() => localStorage.getItem("unrelated.course"))).toBe("keep-me");
      await expect(resetButton).toBeDisabled();
    }
  });

  test("storage denial leaves every lesson usable and states the limitation", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value: () => { throw new DOMException("denied"); },
      });
    });
    await page.goto("/en/grok/privacy-boundaries/");
    await expect(page.getByText("Browser storage is unavailable.", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Mark lesson complete" }).click();
    await expect(page.locator("article > header h1")).toBeVisible();
    await page.getByText("Figure provenance", { exact: true }).click();
    await expect(page.getByText("Privacy review passed", { exact: true })).toBeVisible();
  });

  test("storage denial disables the capstone checklist and explains the limitation in place", async ({ page }) => {
    const denyStorage = async (routePage: Page) => {
      await routePage.addInitScript(() => {
        Object.defineProperty(Storage.prototype, "setItem", {
          configurable: true,
          value: () => { throw new DOMException("denied"); },
        });
      });
    };
    await withIsolatedRoutePage(page, "/en/grok/capstone/", async (routePage) => {
      const checklist = routePage.getByTestId("grok-capstone-checklist");
      await expect(checklist.getByText("Browser storage is unavailable.", { exact: false }))
        .toBeVisible();
      const checkboxes = checklist.locator('input[type="checkbox"]');
      await expect(checkboxes).toHaveCount(7);
      for (const checkbox of await checkboxes.all()) await expect(checkbox).toBeDisabled();
    }, { setup: denyStorage });

    await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
      const quiz = routePage.getByTestId("grok-final-quiz");
      await expect(quiz.getByText("Browser storage is unavailable.", { exact: false }))
        .toBeVisible();
      await expect(quiz.getByRole("button", { name: "Begin knowledge check" })).toBeEnabled();
    }, { setup: denyStorage });
  });

  test("quiz fails at eleven and passes at the exact twelve-of-fourteen boundary", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: "Begin knowledge check" }).click();
    await completeQuiz(page, 11);
    const quiz = page.getByTestId("grok-final-quiz");
    await expect(quiz).toContainText("Score: 11 / 14");
    await expect(quiz).toContainText("Review the evidence boundaries");
    const reviewResult = quiz.getByRole("status").filter({ hasText: "Score: 11 / 14" });
    await expect(reviewResult).toBeFocused();
    await expect(page.getByTestId("grok-hero-journey-action"))
      .not.toHaveAttribute("href", "#grok-final-quiz");

    await page.getByRole("button", { name: "Retry knowledge check" }).click();
    await completeQuiz(page, 12);
    await expect(quiz).toContainText("Score: 12 / 14");
    await expect(quiz).toContainText("Knowledge check passed");
    const passedResult = quiz.getByRole("status").filter({ hasText: "Score: 12 / 14" });
    await expect(passedResult).toBeFocused();
    await expect(page.getByTestId("grok-hero-journey-action"))
      .not.toHaveAttribute("href", "#grok-final-quiz");
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), PROGRESS_KEY);
    expect(stored.quizBest).toBe(12);
    expect(stored.quizPassed).toBe(true);
  });

  test("quiz identifies the correct and selected wrong options without relying on color", async ({ page }) => {
    await page.goto(DASHBOARD);
    const quiz = page.getByTestId("grok-final-quiz");
    await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
    const firstOption = quiz.locator("fieldset label").nth(0);
    const firstRadio = firstOption.locator('input[type="radio"]');
    await firstRadio.focus();
    await expect(firstRadio).toBeFocused();
    await expect.poll(() => firstOption.evaluate((node) => {
      const style = getComputedStyle(node);
      return style.boxShadow !== "none"
        || (style.outlineStyle !== "none" && style.outlineWidth !== "0px");
    }),
      "the entire quiz option card should expose a keyboard-focus treatment",
    ).toBe(true);
    await firstRadio.check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await expect(quiz.getByText("Correct answer", { exact: true })).toBeVisible();
    await expect(quiz.getByText("Your answer", { exact: true })).toBeVisible();
    await expect(quiz.locator("fieldset label").nth(1)).toContainText("Correct answer");
    await expect(quiz.locator("fieldset label").nth(0)).toContainText("Your answer");
    await expectMinimumTouchTarget(
      quiz.getByRole("status").locator('a[target="_blank"]'),
      "quiz feedback source links",
    );
  });

  test("an in-progress quiz survives reload and navigation, then discards only after confirmation", async ({ page }) => {
    await page.goto(DASHBOARD);
    const quiz = page.getByTestId("grok-final-quiz");
    await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
    await quiz.locator('input[type="radio"]').nth(1).check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await quiz.getByRole("button", { name: "Next question" }).click();
    await quiz.locator('input[type="radio"]').nth(2).check();
    await expect.poll(() => page.evaluate((key) => {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const attempt = JSON.parse(raw);
      return {
        questionIndex: attempt.questionIndex,
        selected: attempt.selected,
        answerCount: attempt.answers.length,
      };
    }, QUIZ_ATTEMPT_KEY)).toEqual({ questionIndex: 1, selected: 2, answerCount: 1 });

    await page.reload();
    await expect(quiz.getByTestId("grok-quiz-saved-attempt")).toBeVisible();
    await quiz.getByTestId("grok-quiz-resume-attempt").click();
    await expect(quiz).toContainText(/Question\s+2\s+of\s+14/);
    await expect(quiz.locator('input[type="radio"]').nth(2)).toBeChecked();

    await page.goto("/en/grok/map-grok/");
    await page.goto(DASHBOARD);
    await expect(quiz.getByTestId("grok-quiz-saved-attempt")).toBeVisible();
    expect(await clickWithConfirm(quiz.getByTestId("grok-quiz-discard-attempt"), "accept"))
      .toBe("confirm");
    await expect(quiz.getByRole("button", { name: "Begin knowledge check" })).toBeVisible();
    await expect(quiz.getByTestId("grok-quiz-attempt-status")).toContainText(/discard/i);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), QUIZ_ATTEMPT_KEY)).toBeNull();
  });

  test("the hero resumes only a valid current quiz attempt and clears the override on discard", async ({ page }) => {
    await page.goto(DASHBOARD);
    let heroAction = page.getByTestId("grok-hero-journey-action");
    await expect(heroAction).toHaveAttribute("href", "/en/grok/map-grok/");
    await expect(heroAction).toContainText(/Start/i);

    let quiz = page.getByTestId("grok-final-quiz");
    await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
    await quiz.locator('input[type="radio"]').nth(1).check();
    await expect.poll(() => page.evaluate(
      (key) => Boolean(sessionStorage.getItem(key)),
      QUIZ_ATTEMPT_KEY,
    )).toBe(true);

    await page.reload();
    heroAction = page.getByTestId("grok-hero-journey-action");
    await expect(heroAction).toHaveAttribute("href", "#grok-final-quiz");
    await expect(heroAction).toContainText(/Resume/i);
    quiz = page.getByTestId("grok-final-quiz");
    await expect(quiz.getByTestId("grok-quiz-saved-attempt")).toBeVisible();
    expect(await clickWithConfirm(quiz.getByTestId("grok-quiz-discard-attempt"), "accept"))
      .toBe("confirm");
    await expect(heroAction).toHaveAttribute("href", "/en/grok/map-grok/");
    await expect(heroAction).toContainText(/Start/i);

    await page.evaluate((key) => {
      sessionStorage.setItem(key, JSON.stringify({
        schemaVersion: 1,
        signature: "stale-course-signature",
        questionIndex: 0,
        selected: null,
        answers: [],
        checked: false,
      }));
    }, QUIZ_ATTEMPT_KEY);
    await page.reload();
    heroAction = page.getByTestId("grok-hero-journey-action");
    await expect(heroAction).toHaveAttribute("href", "/en/grok/map-grok/");
    await expect(heroAction).toContainText(/Start/i);
    await expect(page.getByTestId("grok-quiz-saved-attempt")).toHaveCount(0);
  });

  test("quiz memory fallback survives internal Next navigation when session writes are denied", async ({ page }) => {
    await denySessionStorageWrites(page);
    await page.goto(DASHBOARD);
    let quiz = page.getByTestId("grok-final-quiz");
    await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
    await quiz.locator('input[type="radio"]').nth(1).check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await quiz.getByRole("button", { name: "Next question" }).click();
    await quiz.locator('input[type="radio"]').nth(2).check();
    const attemptWarning = quiz.getByTestId("grok-quiz-attempt-status");
    await expect(attemptWarning).toBeVisible();
    await expect(attemptWarning).toContainText(/could not be saved/i);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), QUIZ_ATTEMPT_KEY)).toBeNull();

    await page
      .locator('section[aria-labelledby="grok-curriculum-title"]')
      .locator('a[href="/en/grok/map-grok/"]')
      .click();
    await expect(page).toHaveURL(/\/en\/grok\/map-grok\/$/);
    await expectReloadBlockedByDirtyMemory(page);
    await expect(page).toHaveURL(/\/en\/grok\/map-grok\/$/);
    await page
      .getByTestId("grok-lesson-map-grok")
      .locator('nav a[href="/en/grok/"]')
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/grok\/$/);

    quiz = page.getByTestId("grok-final-quiz");
    await expect(quiz.getByTestId("grok-quiz-saved-attempt")).toBeVisible();
    await expect(quiz.getByTestId("grok-quiz-attempt-status")).toBeVisible();
    await expect(quiz.getByTestId("grok-quiz-attempt-status"))
      .toContainText(/could not be saved/i);
    await quiz.getByTestId("grok-quiz-resume-attempt").click();
    await expect(quiz).toContainText(/Question\s+2\s+of\s+14/);
    await expect(quiz.locator('input[type="radio"]').nth(2)).toBeChecked();
  });

  test("a quota-blocked progress write retains the fully answered quiz attempt for recovery", async ({ page }) => {
    test.setTimeout(120_000);
    await denyGrokProgressWritesWithQuota(page);
    await page.goto(DASHBOARD);
    let quiz = page.getByTestId("grok-final-quiz");
    await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
    await answerQuizThroughCheckedFinalQuestion(page, COURSE_MANIFEST.lessons.length);

    const expectedFinalAttempt = {
      questionIndex: COURSE_MANIFEST.lessons.length - 1,
      selected: CORRECT_ANSWER_INDEXES[CORRECT_ANSWER_INDEXES.length - 1],
      checked: true,
      answerCount: COURSE_MANIFEST.lessons.length,
      allCorrect: true,
    };
    await expect.poll(() => page.evaluate((key) => {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const attempt = JSON.parse(raw);
      return {
        questionIndex: attempt.questionIndex,
        selected: attempt.selected,
        checked: attempt.checked,
        answerCount: attempt.answers.length,
        allCorrect: attempt.answers.every(Boolean),
      };
    }, QUIZ_ATTEMPT_KEY)).toEqual(expectedFinalAttempt);

    await quiz.getByRole("button", { name: "Finish quiz" }).click();
    expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBeNull();
    await expect.poll(() => page.evaluate((key) => {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const attempt = JSON.parse(raw);
      return {
        questionIndex: attempt.questionIndex,
        selected: attempt.selected,
        checked: attempt.checked,
        answerCount: attempt.answers.length,
        allCorrect: attempt.answers.every(Boolean),
      };
    }, QUIZ_ATTEMPT_KEY)).toEqual(expectedFinalAttempt);

    await page.reload();
    quiz = page.getByTestId("grok-final-quiz");
    await expect(quiz.getByTestId("grok-quiz-saved-attempt")).toBeVisible();
    await quiz.getByTestId("grok-quiz-resume-attempt").click();
    await expect(quiz).toContainText(/Question\s+14\s+of\s+14/);
    const finalOption = quiz.locator('input[type="radio"]').nth(
      CORRECT_ANSWER_INDEXES[CORRECT_ANSWER_INDEXES.length - 1],
    );
    await expect(finalOption).toBeChecked();
    await expect(finalOption).toBeDisabled();
    await expect(quiz.locator('form [role="status"]')).toContainText("Correct");
    await expect(quiz.getByRole("button", { name: "Finish quiz" })).toBeVisible();
  });

  test("task-contract drafts restore in-session and destructive discard supports confirmation and undo", async ({ page }) => {
    await page.goto("/en/grok/task-contracts/");
    let builder = page.getByTestId("grok-task-contract-builder");
    await builder.getByRole("textbox", { name: "Goal", exact: true }).fill("Produce an evidence table");
    await builder.getByRole("textbox", { name: "Evidence boundary", exact: true })
      .fill("Use only the supplied sources");
    await expect(builder).toContainText("GOAL: Produce an evidence table");
    await expect(builder).toContainText("EVIDENCE BOUNDARY: Use only the supplied sources");
    await expect.poll(() => page.evaluate((key) => {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw).values : null;
    }, TASK_CONTRACT_DRAFT_KEY)).toEqual([
      "Produce an evidence table",
      "",
      "Use only the supplied sources",
      "",
      "",
      "",
    ]);

    await page.goto("/en/grok/search-verify/");
    await page.goto("/en/grok/task-contracts/");
    builder = page.getByTestId("grok-task-contract-builder");
    await expect(builder.getByRole("textbox", { name: "Goal", exact: true }))
      .toHaveValue("Produce an evidence table");
    await expect(builder.getByRole("textbox", { name: "Evidence boundary", exact: true }))
      .toHaveValue("Use only the supplied sources");
    await expect(builder.getByTestId("grok-task-contract-draft-status")).toContainText(/restor/i);

    expect(await clickWithConfirm(builder.getByTestId("grok-task-contract-discard"), "dismiss"))
      .toBe("confirm");
    await expect(builder.getByRole("textbox", { name: "Goal", exact: true }))
      .toHaveValue("Produce an evidence table");

    expect(await clickWithConfirm(builder.getByTestId("grok-task-contract-discard"), "accept"))
      .toBe("confirm");
    await expect(builder.getByRole("textbox", { name: "Goal", exact: true })).toHaveValue("");
    await expect(builder.getByTestId("grok-task-contract-draft-status")).toContainText(/discard/i);
    await expect.poll(() => page.evaluate(
      (key) => sessionStorage.getItem(key),
      TASK_CONTRACT_DRAFT_KEY,
    )).toBeNull();

    await builder.getByTestId("grok-task-contract-undo").click();
    await expect(builder.getByRole("textbox", { name: "Goal", exact: true }))
      .toHaveValue("Produce an evidence table");
    await expect(builder.getByRole("textbox", { name: "Evidence boundary", exact: true }))
      .toHaveValue("Use only the supplied sources");
    await expect(builder.getByTestId("grok-task-contract-undo")).toHaveCount(0);
    await expect.poll(() => page.evaluate((key) => {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw).values[0] : null;
    }, TASK_CONTRACT_DRAFT_KEY)).toBe("Produce an evidence table");
  });

  test("task-contract memory fallback survives internal Next navigation when session writes are denied", async ({ page }) => {
    await denySessionStorageWrites(page);
    await page.goto("/en/grok/task-contracts/");
    let builder = page.getByTestId("grok-task-contract-builder");
    await builder.getByRole("textbox", { name: "Goal", exact: true })
      .fill("Preserve this local draft");
    await builder.getByRole("textbox", { name: "Evidence boundary", exact: true })
      .fill("Synthetic sources only");
    const draftWarning = builder.getByTestId("grok-task-contract-draft-status");
    await expect(draftWarning).toBeVisible();
    await expect(draftWarning).toContainText(/could not be saved/i);
    expect(await page.evaluate(
      (key) => sessionStorage.getItem(key),
      TASK_CONTRACT_DRAFT_KEY,
    )).toBeNull();

    await page
      .getByTestId("grok-desktop-course-map")
      .locator('a[href="/en/grok/search-verify/"]')
      .click();
    await expect(page).toHaveURL(/\/en\/grok\/search-verify\/$/);
    await page
      .getByTestId("grok-desktop-course-map")
      .locator('a[href="/en/grok/task-contracts/"]')
      .click();
    await expect(page).toHaveURL(/\/en\/grok\/task-contracts\/$/);

    builder = page.getByTestId("grok-task-contract-builder");
    await expect(builder.getByRole("textbox", { name: "Goal", exact: true }))
      .toHaveValue("Preserve this local draft");
    await expect(builder.getByRole("textbox", { name: "Evidence boundary", exact: true }))
      .toHaveValue("Synthetic sources only");
    await expect(builder.getByTestId("grok-task-contract-draft-status")).toBeVisible();
    await expect(builder.getByTestId("grok-task-contract-draft-status"))
      .toContainText(/could not be saved/i);
  });

  test("Course 5 reset clears session-denied quiz and task memory fallbacks", async ({ page }) => {
    await denySessionStorageWrites(page);
    await seedSessionDeniedQuizAndTaskFallbacks(page);
    const resetButton = page
      .getByTestId("grok-course-progress")
      .getByRole("button", { name: "Reset progress" });
    await expect(resetButton).toBeEnabled();
    expect(await clickWithConfirm(resetButton, "accept")).toBe("confirm");
    await expectSessionMemoryFallbacksClearedAfterRemount(page);
  });

  test("global learning reset clears session-denied quiz and task memory fallbacks", async ({ page }) => {
    await denySessionStorageWrites(page);
    await seedSessionDeniedQuizAndTaskFallbacks(page);
    await page.locator('footer a[href="/en/learning/"]').click();
    await expect(page).toHaveURL(/\/en\/learning\/$/);
    expect(await clickWithConfirm(
      page.getByRole("button", { name: "Clear all progress" }),
      "accept",
    )).toBe("confirm");
    await expect(page.locator('.learning-feedback[role="status"][aria-live="polite"]'))
      .toHaveText(
        "The current tab was reset, but one or more records on this device could not be cleared safely. They may reappear after refresh.",
      );
    await page.locator('footer a[href="/en/grok/"]').click();
    await expect(page).toHaveURL(/\/en\/grok\/$/);
    await expectSessionMemoryFallbacksClearedAfterRemount(page);
  });

  test("capstone requires all seven inspectable evidence items", async ({ page }) => {
    await page.goto("/en/grok/capstone/");
    const checklist = page.getByTestId("grok-capstone-checklist");
    await expect(checklist.locator('input[type="checkbox"]')).toHaveCount(7);
    await expect(checklist).toContainText("Complete all seven evidence items");
    for (const checkbox of await checklist.locator('input[type="checkbox"]').all()) {
      await checkbox.check();
    }
    await expect(checklist).toContainText("Capstone packet ready");
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), PROGRESS_KEY);
    expect(stored.capstoneReady).toBe(true);
    expect(stored.capstoneChecks).toEqual([true, true, true, true, true, true, true]);
  });

  test("figures and evidence remain available without JavaScript", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/en/grok/software-engineering/");
    await expect(page.getByTestId("grok-figure-fig-06").getByRole("img")).toBeVisible();
    await expect(page.getByTestId("grok-figure-fig-10").getByRole("img")).toBeVisible();
    const sourceCount = COURSE_MANIFEST.lessons.find(
      (lesson) => lesson.slug === "software-engineering",
    )?.sourceIds.length;
    expect(sourceCount).toBeGreaterThan(0);
    await expect(page.locator('section[aria-labelledby="grok-sources-title"] article')).toHaveCount(
      sourceCount!,
    );
    await context.close();
  });

  test("dashboard, interacted tools, capstone, and Arabic surface pass automated WCAG A and AA checks", async ({ page }) => {
    const paths = [
      DASHBOARD,
      "/en/grok/task-contracts/",
      "/en/grok/capstone/",
      "/ar/grok/files-data/",
    ];

    for (const path of paths) {
      await withIsolatedRoutePage(page, path, async (routePage) => {
        await routePage.locator("main").waitFor();
        await routePage.evaluate(async () => {
          await document.fonts.ready;
        });

        if (path === DASHBOARD) {
          const quiz = routePage.getByTestId("grok-final-quiz");
          await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
          await quiz.locator('input[type="radio"]').first().check();
          await quiz.getByRole("button", { name: "Check answer" }).click();
        } else if (path.includes("task-contracts")) {
          await routePage.getByRole("textbox", { name: "Goal", exact: true })
            .fill("Produce an evidence table");
        } else if (path.includes("capstone")) {
          for (const checkbox of await routePage
            .getByTestId("grok-capstone-checklist")
            .locator('input[type="checkbox"]')
            .all()) {
            await checkbox.check();
          }
        }

        expect(await getAxeViolations(routePage), path).toEqual([]);
      });
    }
  });

  test("all 14 lessons reflow without horizontal clipping across the release viewport matrix", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "The exhaustive 280-combination reflow matrix runs once in Chromium.");
    test.setTimeout(240_000);

    for (const locale of REFLOW_LOCALES) {
      for (const lesson of COURSE_MANIFEST.lessons) {
        const path = `/${locale}/grok/${lesson.slug}/`;
        const response = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(response?.status(), path).toBe(200);

        for (const width of REFLOW_WIDTHS) {
          const viewport = { width, height: width <= 390 ? 844 : 1000 };
          await page.setViewportSize(viewport);
          await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          });

          const geometry = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
          }));
          expect(
            geometry.scrollWidth - geometry.clientWidth,
            `${path} at ${width}px should not overflow horizontally`,
          ).toBeLessThanOrEqual(1);

          const heading = page.locator("article > header h1");
          const box = await heading.boundingBox();
          expect(box, `${path} at ${width}px should render its lesson heading`).not.toBeNull();
          expect(box!.x, `${path} at ${width}px heading left edge`).toBeGreaterThanOrEqual(-1);
          expect(
            box!.x + box!.width,
            `${path} at ${width}px heading right edge`,
          ).toBeLessThanOrEqual(width + 1);
        }
      }
    }
  });
});
