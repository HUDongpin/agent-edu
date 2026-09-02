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
import {
  MAKE_MONEY_PROGRESS_LESSON_SLUGS,
  MAKE_MONEY_PROGRESS_SCHEMA,
} from "../lib/progress-topology";
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
      .toHaveAttribute("aria-current", "location");
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
      .toHaveAttribute("aria-current", "location");
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
  await expect(page.locator(
    'section[aria-labelledby="learning-continue-title"] .learning-course-card',
  )).toHaveCount(0);
  await expect(page.locator(
    'section[aria-labelledby="learning-in-progress-title"] .learning-course-card',
  )).toHaveCount(0);
  await expect(page.locator(
    'section[aria-labelledby="learning-completed-title"] .learning-course-card',
  )).toHaveCount(0);
  await expect(page.locator(
    'section[aria-labelledby="learning-suggested-title"] '
      + '.learning-course-card[data-learning-state="not-started"]',
  )).toHaveCount(3);
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
  await expect(button).toHaveAccessibleName("Mark lesson incomplete");

  await page.locator('header a[href="/en/learning/"]').click();
  await expect(page).toHaveURL(/\/en\/learning\/$/);
  await waitForLearningDashboard(page);
  const action = page.locator(
    `section[aria-labelledby="learning-continue-title"] a[href="${secondHref}"]`,
  );
  await expect(action).toHaveAccessibleName(/Resume/);
  await action.click();
  await expect(page).toHaveURL(new RegExp(`${secondHref}$`));
  await expect(page.locator("main h1").first()).toBeFocused();
});

test("Make Money with Codex exposes the late active lesson through a compact mobile outline", async ({ page }) => {
  const lesson = MAKE_MONEY_WITH_CODEX_COURSE.lessons.at(-1)!;
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`/en/make-money-with-codex/${lesson.slug}/`);
  expect(response?.status()).toBe(200);

  const outline = page.locator("[data-course-mobile-outline]");
  const summary = outline.locator("summary");
  await expect(outline).toBeVisible();
  await expect(summary).toContainText(`Lesson ${lesson.order} / ${MAKE_MONEY_WITH_CODEX_COURSE.lessons.length}`);
  await expect(summary).toContainText(lesson.title);
  await expect(page.locator("[data-course-desktop-outline]")).toBeHidden();

  await summary.click();
  const active = outline.locator('a[aria-current="page"]');
  await expect(active).toBeVisible();
  await expect(active).toContainText(lesson.title);
  await expect.poll(async () => {
    const activeBox = await active.boundingBox();
    const navBox = await outline.locator("nav").boundingBox();
    return Boolean(
      activeBox
      && navBox
      && activeBox.y >= navBox.y
      && activeBox.y + activeBox.height <= navBox.y + navBox.height + 1,
    );
  }).toBe(true);

  const targetHeights = await outline.locator("nav a").evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height),
  );
  expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(44);
  await expectNoHorizontalOverflow(page);
});

test("Make Money with Codex routes the final lesson to the final evidence check", async ({ page }) => {
  const lesson = MAKE_MONEY_WITH_CODEX_COURSE.lessons.at(-1)!;
  const response = await page.goto(`/en/make-money-with-codex/${lesson.slug}/`);
  expect(response?.status()).toBe(200);
  const finalAction = page.locator("[data-course-lesson-nav] a").last();
  await expect(finalAction).toHaveAttribute(
    "href",
    "/en/make-money-with-codex/#income-knowledge-check",
  );
});

test("Make Money with Codex focuses the quiz when it is the hero resume target", async ({ page }) => {
  const progress: Record<string, unknown> = {
    [MAKE_MONEY_PROGRESS_SCHEMA.courseVersionKey]: MAKE_MONEY_PROGRESS_SCHEMA.courseVersion,
    "make-money-with-codex.capstone.checks": Array.from(
      { length: MAKE_MONEY_PROGRESS_SCHEMA.capstoneItemCount },
      () => true,
    ),
    "make-money-with-codex.capstone.v1": true,
  };
  for (const slug of MAKE_MONEY_PROGRESS_LESSON_SLUGS) {
    progress[`make-money-with-codex.lesson.${slug}`] = true;
  }
  await page.addInitScript((value) => {
    localStorage.setItem("ae.progress", JSON.stringify(value));
  }, progress);

  const response = await page.goto("/en/make-money-with-codex/");
  expect(response?.status()).toBe(200);
  const journey = page.locator("[data-course-journey-action]");
  await expect(journey).toHaveAccessibleName("Resume course");
  await expect(journey).toHaveAttribute(
    "href",
    "/en/make-money-with-codex/#income-knowledge-check",
  );
  await journey.click();
  await expect(page).toHaveURL(/#income-knowledge-check$/);
  await expect(page.getByTestId("income-knowledge-check")).toBeFocused();
});

test("Make Money with Codex restores a scorecard draft and protects its clear action", async ({ page }) => {
  const lesson = MAKE_MONEY_WITH_CODEX_COURSE.lessons.find(
    (candidate) => candidate.slug === "choose-market-wedge",
  )!;
  const response = await page.goto(`/en/make-money-with-codex/${lesson.slug}/`);
  expect(response?.status()).toBe(200);

  const candidate = page.getByLabel("Candidate name");
  await candidate.fill("Synthetic accessibility review");
  await expect.poll(() => page.evaluate(() =>
    sessionStorage.getItem("aicourse.course11.scorecard.v1"),
  )).toContain("Synthetic accessibility review");

  await page.locator("main a[rel=next]").click();
  await expect(page).toHaveURL(/\/en\/make-money-with-codex\/validate-before-building\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/make-money-with-codex\/choose-market-wedge\/$/);
  const restoredCandidate = page.getByLabel("Candidate name");
  await expect(restoredCandidate).toHaveValue("Synthetic accessibility review");

  const clear = page.getByRole("button", { name: "Clear for next candidate" });
  page.once("dialog", (dialog) => dialog.dismiss());
  await clear.click();
  await expect(restoredCandidate).toHaveValue("Synthetic accessibility review");

  page.once("dialog", (dialog) => dialog.accept());
  await clear.click();
  await expect(restoredCandidate).toHaveValue("");
});

test("Make Money with Codex identifies correct answers and restores focus on retry", async ({ page }) => {
  const response = await page.goto("/en/make-money-with-codex/#income-knowledge-check");
  expect(response?.status()).toBe(200);
  const assessment = page.getByTestId("income-knowledge-check");
  const fieldsets = assessment.locator("fieldset");
  await expect(fieldsets).toHaveCount(MAKE_MONEY_WITH_CODEX_COURSE.quiz.length);
  for (let index = 0; index < MAKE_MONEY_WITH_CODEX_COURSE.quiz.length; index += 1) {
    await fieldsets.nth(index).locator('input[type="radio"]').first().check();
  }
  await assessment.getByRole("button", { name: "Check every answer" }).click();

  const result = assessment.getByRole("heading", {
    name: /Evidence check passed|Review the missed boundaries/,
  });
  await expect(result).toBeFocused();
  await expect(assessment.getByText("Correct answer.", { exact: false }).first()).toBeVisible();

  await assessment.getByRole("button", { name: "Start a fresh attempt" }).click();
  const firstOption = fieldsets.first().locator('input[type="radio"]').first();
  await expect(firstOption).toBeFocused();
  await expect(firstOption).toBeInViewport();
});

test("Course 11 catalog Resume opens the exact next lesson", async ({ page }) => {
  const first = MAKE_MONEY_WITH_CODEX_COURSE.lessons[0];
  const second = MAKE_MONEY_WITH_CODEX_COURSE.lessons[1];
  await page.addInitScript(({ version, firstSlug }) => {
    localStorage.setItem("ae.progress", JSON.stringify({
      "make-money-with-codex.course.version": version,
      [`make-money-with-codex.lesson.${firstSlug}`]: true,
    }));
  }, { version: MAKE_MONEY_WITH_CODEX_COURSE.version, firstSlug: first.slug });

  const response = await page.goto("/en/courses/");
  expect(response?.status()).toBe(200);
  const card = page.locator('[data-course-id="make-money-with-codex"] > a');
  await expect(card).toHaveAttribute(
    "href",
    `/en/make-money-with-codex/${second.slug}/`,
  );
  await expect(card).toContainText("Resume");
});
