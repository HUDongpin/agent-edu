import type { Page } from "@playwright/test";
import {
  PRODUCT_MANAGEMENT_COURSE_MANIFEST,
} from "../lib/product-management";
import {
  AGENT_ORCHESTRATION_COURSE_MANIFEST,
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
  AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
} from "../lib/agent-orchestration";
import { MAKE_MONEY_WITH_CODEX_COURSE } from "../lib/make-money-with-codex";
import { expect, test } from "./fixtures";

const SITE = "https://aicourse.top";

const coursesWithoutLegacySpecs = [
  {
    id: "product-management",
    dashboardTestId: "product-management-course-dashboard",
    curriculum: "#product-management-curriculum",
    childTestId: (slug: string) => `product-management-module-${slug}`,
    childSlugs: PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.map((module) => module.slug),
  },
  {
    id: "agent-orchestration",
    dashboardTestId: "agent-orchestration-course",
    curriculum: "#agent-orchestration-curriculum",
    childTestId: (slug: string) => `agent-orchestration-module-${slug}`,
    childSlugs: AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.map((module) => module.slug),
  },
  {
    id: "make-money-with-codex",
    dashboardTestId: "income-course-dashboard",
    curriculum: "#income-curriculum",
    childTestId: (slug: string) => `income-lesson-${slug}`,
    childSlugs: MAKE_MONEY_WITH_CODEX_COURSE.lessons.map((lesson) => lesson.slug),
  },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect.poll(() => page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  })).toBeLessThanOrEqual(1);
}

async function waitForLearningDashboard(page: Page) {
  await expect(page.locator(".learning-dashboard"))
    .toHaveAttribute("aria-busy", "false");
}

for (const course of coursesWithoutLegacySpecs) {
  test(`${course.id}: dashboard, curriculum, and first child satisfy the shared course shell`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const dashboardHref = `/en/${course.id}/`;
    const childHrefs = course.childSlugs.map((slug) => `${dashboardHref}${slug}/`);

    const dashboardResponse = await page.goto(dashboardHref);
    expect(dashboardResponse?.status()).toBe(200);
    await expect(page.getByTestId(course.dashboardTestId)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('header a[href="/en/courses/"]'))
      .toHaveAttribute("aria-current", "page");
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href", `${SITE}${dashboardHref}`);

    const curriculumHrefs = new Set(
      await page.locator(`${course.curriculum} a[href]`).evaluateAll((links) =>
        links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
      ),
    );
    expect(
      [...curriculumHrefs].sort(),
      `${course.id}: every declared child route must be discoverable in the curriculum`,
    ).toEqual([...childHrefs].sort());
    await expectNoHorizontalOverflow(page);

    await page.locator(`a[href="${childHrefs[0]}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${childHrefs[0]}$`));
    await expect(page.getByTestId(course.childTestId(course.childSlugs[0]))).toBeVisible();
    await expect(page.locator("main h1").first()).toBeFocused();
    await expect(page.locator('header a[href="/en/courses/"]'))
      .toHaveAttribute("aria-current", "page");
    expect(
      await page.locator(`main a[aria-current="page"][href="${childHrefs[0]}"]`).count(),
      `${course.id}: the course map must identify the active child route`,
    ).toBeGreaterThan(0);
    await expect(page.locator('main [aria-current="page"]:visible').first()).toBeVisible();
    await expect(page.locator("main a[rel=next]"))
      .toHaveAttribute("href", childHrefs[1]);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href", `${SITE}${childHrefs[0]}`);
    await expectNoHorizontalOverflow(page);
  });
}

test("Agent Orchestration publishes its real Simplified Chinese content routes", async ({ page }) => {
  const response = await page.goto("/zh-Hans/agent-orchestration/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
  await expect(page.getByTestId("agent-orchestration-course"))
    .toHaveAttribute("lang", "zh-Hans");
  await expect(page.getByTestId("agent-orchestration-course"))
    .toHaveAttribute("dir", "ltr");
  await expect(page.locator(
    'a[href="/zh-Hans/agent-orchestration/workflow-agent-boundary/"]',
  ).first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]'))
    .toHaveAttribute("href", `${SITE}/zh-Hans/agent-orchestration/`);
});

test("Agent Orchestration's version marker alone is not learner progress", async ({ page }) => {
  const versionOnly = JSON.stringify({
    [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]: AGENT_ORCHESTRATION_PROGRESS_VERSION,
  });
  await page.addInitScript((raw) => {
    localStorage.setItem("ae.progress", raw);
  }, versionOnly);

  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);
  await expect(page.getByRole("heading", { name: "No learning progress yet" })).toBeVisible();
  await expect(page.locator(".learning-course-card")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("ae.progress"))).toBe(versionOnly);
});

test("Make Money with Codex reports same-tab completion and resumes the exact next lesson", async ({ page }) => {
  const first = MAKE_MONEY_WITH_CODEX_COURSE.lessons[0];
  const second = MAKE_MONEY_WITH_CODEX_COURSE.lessons[1];
  const firstHref = `/en/make-money-with-codex/${first.slug}/`;
  const secondHref = `/en/make-money-with-codex/${second.slug}/`;

  const response = await page.goto(firstHref);
  expect(response?.status()).toBe(200);
  const completion = page.getByTestId(`income-completion-${first.slug}`);
  const button = completion.getByRole("button");
  await expect(button).toHaveAccessibleName("Mark lesson complete");
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toHaveAccessibleName("Marked complete");

  await page.locator('header a[href="/en/learning/"]').click();
  await expect(page).toHaveURL(/\/en\/learning\/$/);
  await waitForLearningDashboard(page);
  const action = page.locator(
    `section[aria-labelledby="learning-in-progress-title"] a[href="${secondHref}"]`,
  );
  await expect(action).toHaveAccessibleName(/Resume/);
  await action.click();
  await expect(page).toHaveURL(new RegExp(`${secondHref}$`));
  await expect(page.locator("main h1").first()).toBeFocused();
});
