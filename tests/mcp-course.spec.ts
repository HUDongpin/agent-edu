import { expect, test, type Browser, type Page, type Request } from "@playwright/test";
import axe from "axe-core";
import { MCP_FINAL_ASSESSMENT, MCP_FINAL_DISPLAY_CORRECT_INDEXES } from "../lib/mcp/assessment";
import { MCP_LESSONS } from "../lib/mcp/course";
import { MCP_EXTENSIONS } from "../lib/mcp/extensions";
import { MCP_FIGURES } from "../lib/mcp/figures";
import { MCP_ASSESSMENT_VERSION, MCP_LOCALES } from "../lib/mcp/types";
import {
  isExpectedNextPrefetchCancellation,
  isExpectedWebKitRscPrefetchPageError,
  isNextLinkPrefetchRequest,
  renderedDocumentLinkTargets,
} from "./next-prefetch-test-helpers";
import { publishedSitemapUrls } from "./published-course-test-helpers";
import { PLAYWRIGHT_TEST_ORIGIN } from "./playwright-test-url";

const DASHBOARD = "/en/mcp/";
const LESSON_SLUGS = MCP_LESSONS.map((lesson) => lesson.slug);
const ROUTE_SUFFIXES = ["", ...LESSON_SLUGS] as const;
const EXPECTED_MCP_ROUTE_COUNT = MCP_LOCALES.length * ROUTE_SUFFIXES.length;
const EXPECTED_HREFLANGS = [...MCP_LOCALES, "x-default"].sort();

const lessonForFigure = new Map<string, string>();
for (const lesson of MCP_LESSONS) {
  for (const figureId of lesson.figureIds) {
    if (!lessonForFigure.has(figureId)) lessonForFigure.set(figureId, lesson.slug);
  }
}

type RuntimeAudit = {
  readonly consoleErrors: string[];
  readonly pageErrors: Error[];
  readonly requestFailures: Array<{ request: Request; reason: string }>;
  readonly failedResponses: string[];
  readonly nextPrefetchUrls: Set<string>;
};

function watchRuntime(page: Page): RuntimeAudit {
  const audit: RuntimeAudit = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    failedResponses: [],
    nextPrefetchUrls: new Set(),
  };

  page.on("request", (request) => {
    if (isNextLinkPrefetchRequest(request, PLAYWRIGHT_TEST_ORIGIN)) {
      audit.nextPrefetchUrls.add(request.url());
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      audit.consoleErrors.push(`${message.text()} @ ${message.location().url || "inline"}`);
    }
  });
  page.on("pageerror", (error) => audit.pageErrors.push(error));
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "unknown failure";
    audit.requestFailures.push({ request, reason });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      audit.failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  return audit;
}

function assertRuntimeClean(
  audit: RuntimeAudit,
  label: string,
  renderedLinkTargets: ReadonlySet<string>,
) {
  const pageErrors = audit.pageErrors
    .filter((error) => !isExpectedWebKitRscPrefetchPageError(
      error,
      PLAYWRIGHT_TEST_ORIGIN,
      audit.nextPrefetchUrls,
    ))
    .map((error) => error.stack || error.message);
  const requestFailures = audit.requestFailures
    .filter(({ request, reason }) => !(
      isNextLinkPrefetchRequest(request, PLAYWRIGHT_TEST_ORIGIN, renderedLinkTargets)
      && isExpectedNextPrefetchCancellation(reason)
    ))
    .map(({ request, reason }) => `${reason}: ${request.url()}`);

  expect(audit.consoleErrors, `${label}: console errors`).toEqual([]);
  expect(pageErrors, `${label}: uncaught page errors`).toEqual([]);
  expect(requestFailures, `${label}: request failures`).toEqual([]);
  expect(audit.failedResponses, `${label}: HTTP error responses`).toEqual([]);
}

async function waitForStableDocument(page: Page) {
  await page.locator("main").waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}

async function expectNoPageOverflow(page: Page, label: string) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `${label}: ${dimensions.scrollWidth}px document in ${dimensions.clientWidth}px viewport`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function clearMcpProgress(page: Page) {
  await page.goto(DASHBOARD);
  await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
    for (const key of Object.keys(progress)) {
      if (key.startsWith("mcp.")) delete progress[key];
    }
    localStorage.setItem("ae.progress", JSON.stringify(progress));
  });
  await page.reload();
}

async function answerAssessment(page: Page, correctAnswers: number) {
  const assessment = page.locator("#assessment");
  const fieldsets = assessment.locator("form fieldset");
  await expect(fieldsets).toHaveCount(MCP_FINAL_ASSESSMENT.length);

  for (let index = 0; index < MCP_FINAL_ASSESSMENT.length; index += 1) {
    const correctDisplayedIndex = MCP_FINAL_DISPLAY_CORRECT_INDEXES[index];
    const selected = index < correctAnswers
      ? correctDisplayedIndex
      : (correctDisplayedIndex + 1) % 4;
    await fieldsets.nth(index).locator('input[type="radio"]').nth(selected).check();
  }

  await assessment.locator('button[type="submit"]').click();
  const result = assessment.locator('[role="status"][tabindex="-1"]');
  await expect(result).toBeVisible();
  await expect(result).toBeFocused();
  return result;
}

async function runAxe(page: Page, label: string) {
  await waitForStableDocument(page);
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
            nodes: readonly {
              target: readonly string[];
              html: string;
              failureSummary?: string;
            }[];
          }[];
        }>;
      };
    }).axe;
    const result = await axeApi.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      resultTypes: ["violations"],
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    }));
  });
  expect(violations, label).toEqual([]);
}

async function newNoJavaScriptPage(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  return { context, page: await context.newPage() };
}

test.describe("Course 10 localized route contract", () => {
  test("the release inventory cannot silently shrink", () => {
    expect(MCP_LOCALES).toHaveLength(9);
    expect(MCP_LESSONS).toHaveLength(18);
    expect(MCP_FINAL_ASSESSMENT).toHaveLength(18);
    expect(MCP_FIGURES).toHaveLength(8);
    expect(EXPECTED_MCP_ROUTE_COUNT).toBe(171);
  });

  for (const locale of MCP_LOCALES) {
    test(`${locale} materializes the dashboard and all 18 lessons`, async ({ context }) => {
      test.setTimeout(180_000);

      for (const suffix of ROUTE_SUFFIXES) {
        const path = suffix ? `/${locale}/mcp/${suffix}/` : `/${locale}/mcp/`;
        // Each route gets a fresh document. Replacing one MCP document with
        // the next used to mix the previous page's cancellable Link prefetches
        // into the next route's runtime audit on WebKit/Linux. This page-local
        // audit still fails every console error, uncaught error, request
        // failure, or HTTP error produced by the route being asserted.
        const routePage = await context.newPage();
        const runtime = watchRuntime(routePage);
        try {
          const response = await routePage.goto(path);
          expect(response?.status(), path).toBe(200);
          await waitForStableDocument(routePage);
          await routePage.waitForLoadState("networkidle");
          await expect(routePage.locator("html")).toHaveAttribute("lang", locale);
          await expect(routePage.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
          await expect(routePage.locator("main")).toHaveCount(1);
          await expect(routePage.locator("main h1")).toHaveCount(1);
          if (suffix) {
            await expect(routePage.getByTestId(`mcp-lesson-${suffix}`)).toBeVisible();
          } else {
            await expect(routePage.getByTestId("mcp-course-dashboard")).toBeVisible();
          }
          await expectNoPageOverflow(routePage, path);
          assertRuntimeClean(runtime, path, await renderedDocumentLinkTargets(routePage));
        } finally {
          await routePage.close();
        }
      }
    });
  }

  test("all nine dashboards use localized content and Arabic owns the RTL surface", async ({ page }) => {
    const titles = new Map<string, string>();
    for (const locale of MCP_LOCALES) {
      await page.goto(`/${locale}/mcp/`);
      const dashboard = page.getByTestId("mcp-course-dashboard");
      await expect(dashboard).toHaveAttribute("lang", locale);
      await expect(dashboard).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      titles.set(locale, (await dashboard.locator("h1").innerText()).trim());
    }
    const englishTitle = titles.get("en");
    expect(englishTitle).toBeTruthy();
    for (const locale of MCP_LOCALES.filter((candidate) => candidate !== "en")) {
      expect(titles.get(locale), `${locale} dashboard title must not be the English fallback`).not.toBe(englishTitle);
    }
    expect(titles.get("ar")).toMatch(/[\u0600-\u06ff]/);

    await page.goto("/ar/mcp/host-integrations/");
    const lesson = page.getByTestId("mcp-lesson-host-integrations");
    await expect(lesson).toHaveAttribute("lang", "ar");
    await expect(lesson).toHaveAttribute("dir", "rtl");
    for (const figureId of ["gemini-cli-mcp-inventory", "codex-cli-mcp-configuration"]) {
      const figure = page.getByTestId(`mcp-figure-${figureId}`);
      await expect(figure.locator("a[dir=\"ltr\"]")).toHaveCount(1);
      expect(await figure.locator("a[dir=\"ltr\"]").evaluate((node) => getComputedStyle(node).direction)).toBe("ltr");
    }
  });

  test("@browser-smoke dashboard and a real host figure render in each engine", async ({ page, browserName }) => {
    const runtime = watchRuntime(page);
    const response = await page.goto(DASHBOARD);
    expect(response?.status(), browserName).toBe(200);
    await expect(page.getByTestId("mcp-course-dashboard")).toBeVisible();
    await page.waitForLoadState("networkidle");
    assertRuntimeClean(
      runtime,
      `${browserName} dashboard smoke`,
      await renderedDocumentLinkTargets(page),
    );

    const figurePage = await page.context().newPage();
    const figureRuntime = watchRuntime(figurePage);
    try {
      const figureResponse = await figurePage.goto("/en/mcp/host-integrations/");
      expect(figureResponse?.status(), browserName).toBe(200);
      const image = figurePage.getByTestId("mcp-figure-gemini-cli-mcp-inventory").locator("img");
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      await figurePage.waitForLoadState("networkidle");
      assertRuntimeClean(
        figureRuntime,
        `${browserName} smoke`,
        await renderedDocumentLinkTargets(figurePage),
      );
    } finally {
      await figurePage.close();
    }
  });
});

test.describe("Course 10 figure evidence", () => {
  for (const figure of MCP_FIGURES) {
    test(`${figure.id} serves an intact responsive master and derivatives`, async ({ page }) => {
      const slug = lessonForFigure.get(figure.id);
      expect(slug, `${figure.id} must be assigned to a lesson`).toBeTruthy();

      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(`/en/mcp/${slug}/`);
      let rendered = page.getByTestId(`mcp-figure-${figure.id}`);
      await rendered.locator("img").scrollIntoViewIfNeeded();
      await expect.poll(() => rendered.locator("img").evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(rendered).toHaveAttribute("data-figure-sha256", figure.sha256);
      await expect(rendered.locator("img")).toHaveAttribute("src", figure.src);
      await expect(rendered.locator('source[media="(max-width: 760px)"]')).toHaveAttribute("srcset", figure.mobileWebpSrc);
      await expect(rendered.locator("source:not([media])")).toHaveAttribute("srcset", figure.webpSrc);
      await expect(rendered.locator(`a[href="${figure.src}"]`)).toHaveCount(1);
      await expect(rendered.locator("figcaption")).toBeVisible();
      let source = await rendered.locator("img").evaluate((node: HTMLImageElement) => ({
        path: new URL(node.currentSrc).pathname,
        width: node.naturalWidth,
        height: node.naturalHeight,
      }));
      expect(source.path).toBe(figure.mobileWebpSrc);
      expect(source.width).toBeLessThanOrEqual(960);
      expect(source.height).toBeGreaterThan(0);

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.reload();
      rendered = page.getByTestId(`mcp-figure-${figure.id}`);
      await rendered.locator("img").scrollIntoViewIfNeeded();
      await expect.poll(() => rendered.locator("img").evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      source = await rendered.locator("img").evaluate((node: HTMLImageElement) => ({
        path: new URL(node.currentSrc).pathname,
        width: node.naturalWidth,
        height: node.naturalHeight,
      }));
      expect(source.path).toBe(figure.webpSrc);
      expect(source.width).toBeLessThanOrEqual(1600);
      expect(source.height).toBeGreaterThan(0);
      await expect(rendered.locator('img[src^="http"], source[srcset^="http"]')).toHaveCount(0);
    });
  }

  test("all eight real figures retain captions and local pixels without JavaScript", async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    const { context, page } = await newNoJavaScriptPage(browser, baseURL);
    for (const figure of MCP_FIGURES) {
      const slug = lessonForFigure.get(figure.id)!;
      const response = await page.goto(`/en/mcp/${slug}/`);
      expect(response?.status(), figure.id).toBe(200);
      const rendered = page.getByTestId(`mcp-figure-${figure.id}`);
      await rendered.locator("img").scrollIntoViewIfNeeded();
      await expect(rendered.locator("img")).toBeVisible();
      await expect.poll(() => rendered.locator("img").evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(rendered.locator("figcaption")).not.toBeEmpty();
      await expect(rendered.locator('a[href^="/courses/mcp/figures/"]')).toHaveCount(1);
    }
    await context.close();
  });
});

test.describe("Course 10 interactive workbenches", () => {
  test("extension maturity and fallback remain independent of the core version", async ({ page }) => {
    await page.goto("/en/mcp/apps-tasks-capstone/");
    const manifest = page.locator('section[aria-labelledby="mcp-extension-manifest-title"]');
    const scroller = manifest.locator('[role="region"]');
    await expect(scroller).toHaveAttribute("tabindex", "0");
    const rows = manifest.locator("tbody tr");
    await expect(rows).toHaveCount(MCP_EXTENSIONS.length);
    for (const [index, extension] of MCP_EXTENSIONS.entries()) {
      const row = rows.nth(index);
      await expect(row.locator("small[dir=\"ltr\"]").first()).toHaveText(extension.id);
      await expect(row.locator("[data-maturity]")).toHaveAttribute("data-maturity", extension.maturity);
      await expect(row.locator("code[dir=\"ltr\"]")).toHaveText(extension.specificationVersion);
      await expect(row.locator("a")).toHaveAttribute("href", extension.specificationUrl);
      await expect(row).toContainText(extension.fallback);
    }
  });

  test("architecture participant boundaries are keyboard-operable and mutually exclusive", async ({ page }) => {
    await page.goto("/en/mcp/architecture-trust/");
    const lab = page.locator('section[aria-labelledby="mcp-architecture-lab-title"]');
    const controls = lab.locator('[role="group"] button');
    await expect(controls).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await controls.nth(index).focus();
      await page.keyboard.press("Enter");
      await expect(controls.nth(index)).toHaveAttribute("aria-pressed", "true");
      await expect(lab.locator('[role="status"]')).toBeVisible();
      await expect(lab.locator('[role="group"] button[aria-pressed="true"]')).toHaveCount(1);
    }
  });

  test("the current-envelope workbench emits self-contained request metadata", async ({ page }) => {
    await page.goto("/en/mcp/discovery-versioning/");
    const lab = page.locator('section[aria-labelledby="mcp-envelope-lab-title"]');
    const methods = ["server/discover", "tools/list", "tools/call", "resources/read"];
    for (const method of methods) {
      await lab.locator("select").selectOption(method);
      await expect(lab.locator("pre")).toContainText(`"method": "${method}"`);
      await expect(lab.locator("pre")).toContainText("io.modelcontextprotocol/protocolVersion");
      await expect(lab.locator("pre")).toContainText("io.modelcontextprotocol/clientCapabilities");
    }
    await expect(lab.locator("pre")).toHaveAttribute("tabindex", "0");
  });

  test("the tool-contract builder exposes guardrail consequences", async ({ page }) => {
    await page.goto("/en/mcp/tools/");
    const lab = page.locator('section[aria-labelledby="mcp-tool-contract-lab-title"]');
    const score = lab.locator('[role="status"]');
    await expect(score).toContainText("3/3");
    await lab.locator('input[name="mcp-tool-name"]').fill("unsafe");
    await lab.locator('input[type="checkbox"]').nth(1).uncheck();
    await lab.locator('input[type="checkbox"]').nth(2).check();
    await expect(score).toContainText("0/3");
    await expect(lab.locator("pre")).toContainText('"additionalProperties": true');
    await expect(lab.locator("pre")).toHaveAttribute("tabindex", "0");
  });

  test("the risk drill reveals feedback for all four adversarial cases", async ({ page }) => {
    await page.goto("/en/mcp/security/");
    const lab = page.locator('section[aria-labelledby="mcp-risk-review-lab-title"]');
    const articles = lab.locator("article");
    await expect(articles).toHaveCount(4);
    const expectedButtonIndexes = [3, 3, 1, 2];
    for (const [index, buttonIndex] of expectedButtonIndexes.entries()) {
      const article = articles.nth(index);
      await article.locator("button").nth(buttonIndex).click();
      await expect(article.locator('[role="status"]')).toBeVisible();
      await expect(article.locator("button").nth(buttonIndex)).toHaveAttribute("aria-pressed", "true");
    }
  });
});

test.describe.serial("Course 10 private progress, assessment, and capstone", () => {
  test("lesson completion persists in the browser", async ({ page }) => {
    await clearMcpProgress(page);
    await page.goto("/en/mcp/why-mcp/");
    const completion = page.locator('section[aria-labelledby="mcp-completion-title"] button');
    await completion.click();
    await expect(completion).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.locator('section[aria-labelledby="mcp-completion-title"] button')).toHaveAttribute("aria-pressed", "true");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["mcp.lesson.why-mcp"]).toBe(true);
  });

  test("14/18 fails, 15/18 passes, and best/pass state is monotonic", async ({ page }) => {
    test.setTimeout(90_000);
    await clearMcpProgress(page);
    await page.goto(DASHBOARD);
    const assessment = page.locator("#assessment");
    await assessment.getByRole("button", { name: /Begin assessment/i }).click();
    let result = await answerAssessment(page, 14);
    await expect(result).toContainText("14/18");
    await expect(result).toContainText(/Review required/i);
    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["mcp.quiz.best"]).toBe(14);
    expect(stored["mcp.quiz.passed"]).toBe(false);
    expect(stored["mcp.quiz.version"]).toBe(MCP_ASSESSMENT_VERSION);

    await assessment.getByRole("button", { name: /Retry assessment/i }).click();
    result = await answerAssessment(page, 15);
    await expect(result).toContainText("15/18");
    await expect(result).toContainText(/Assessment passed/i);
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["mcp.quiz.best"]).toBe(15);
    expect(stored["mcp.quiz.passed"]).toBe(true);

    await page.reload();
    await assessment.getByRole("button", { name: /Begin assessment/i }).click();
    await answerAssessment(page, 0);
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["mcp.quiz.best"]).toBe(15);
    expect(stored["mcp.quiz.passed"]).toBe(true);
    expect(stored["mcp.quiz.version"]).toBe(MCP_ASSESSMENT_VERSION);
  });

  test("capstone completion requires all ten evidence classes and persists", async ({ page }) => {
    await clearMcpProgress(page);
    await page.goto(DASHBOARD);
    const capstone = page.locator("#capstone");
    const checks = capstone.locator('input[type="checkbox"]');
    const complete = capstone.locator("button");
    await expect(checks).toHaveCount(10);
    await expect(complete).toBeDisabled();
    for (let index = 0; index < 10; index += 1) await checks.nth(index).check();
    await expect(complete).toBeEnabled();
    await complete.click();
    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["mcp.capstone.v1"]).toBe(true);
    await page.reload();
    await expect(page.locator("#capstone").locator('input[type="checkbox"]:checked')).toHaveCount(10);
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["mcp.capstone.v1"]).toBe(true);
  });

  test("reset is keyboard-safe and removes only MCP keys", async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("mcp-reset-fixture")) {
        localStorage.setItem("ae.progress", JSON.stringify({
          "mcp.lesson.why-mcp": true,
          "mcp.quiz.best": 15,
          "mcp.quiz.passed": true,
          "mcp.quiz.version": "2026-07-28-v2",
          "mcp.capstone.v1": true,
          "github.lesson.start-secure": true,
          "github.quiz.best": 10,
          "github.capstone.v1": false,
          "codex.lesson.meet-codex": true,
          unrelated: "preserve-me",
        }));
        sessionStorage.setItem("mcp-reset-fixture", "ready");
      }
    });
    await page.goto(DASHBOARD);
    const trigger = page.getByRole("button", { name: /Reset MCP progress/i });
    await trigger.click();
    const confirmation = page.locator("#mcp-reset-confirmation");
    await expect(confirmation).toBeVisible();
    await expect(confirmation.locator("button").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(confirmation).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await confirmation.locator("button").first().click();
    await expect(page.locator('[role="status"][tabindex="-1"]')).toBeFocused();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(Object.keys(stored).filter((key) => key.startsWith("mcp."))).toEqual([]);
    expect(stored["github.lesson.start-secure"]).toBe(true);
    expect(stored["github.quiz.best"]).toBe(10);
    expect(stored["github.capstone.v1"]).toBe(false);
    expect(stored["codex.lesson.meet-codex"]).toBe(true);
    expect(stored.unrelated).toBe("preserve-me");
  });

  test("storage denial leaves lesson content and evidence usable", async ({ browser, baseURL }) => {
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
    const response = await page.goto("/en/mcp/tools/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("article h1")).toBeVisible();
    await expect(page.getByTestId("mcp-figure-inspector-tools").locator("img")).toBeVisible();
    await expect(page.locator('section[aria-labelledby="mcp-completion-title"] [role="status"]')).toBeVisible();
    await context.close();
  });
});

test.describe("Course 10 accessibility and responsive delivery", () => {
  test("dashboard, interacted assessment, all labs, capstone, and Arabic host evidence pass axe", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(DASHBOARD);
    await runAxe(page, DASHBOARD);

    const assessment = page.locator("#assessment");
    await assessment.getByRole("button", { name: /Begin assessment/i }).click();
    await answerAssessment(page, 0);
    await runAxe(page, "submitted MCP assessment");

    for (const path of [
      "/en/mcp/architecture-trust/",
      "/en/mcp/discovery-versioning/",
      "/en/mcp/tools/",
      "/en/mcp/security/",
      "/en/mcp/apps-tasks-capstone/",
      "/ar/mcp/host-integrations/",
    ]) {
      await page.goto(path);
      await runAxe(page, path);
    }
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`dashboard, interactive code, host figures, capstone, and RTL fit ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        DASHBOARD,
        "/en/mcp/tools/",
        "/en/mcp/host-integrations/",
        "/en/mcp/apps-tasks-capstone/",
        "/ar/mcp/host-integrations/",
      ]) {
        await page.goto(path);
        await waitForStableDocument(page);
        await expectNoPageOverflow(page, path);
        const figures = page.locator('[data-testid^="mcp-figure-"] img');
        for (let index = 0; index < await figures.count(); index += 1) {
          const bounds = await figures.nth(index).evaluate((node) => {
            const rectangle = node.getBoundingClientRect();
            return { left: rectangle.left, right: rectangle.right };
          });
          expect(bounds.left, `${path} figure ${index} left`).toBeGreaterThanOrEqual(-1);
          expect(bounds.right, `${path} figure ${index} right`).toBeLessThanOrEqual(width + 1);
        }
      }
    });
  }

  test("keyboard flow covers lesson navigation, a knowledge check, and reset cancellation", async ({ page }) => {
    await page.goto("/en/mcp/why-mcp/");
    const nextLesson = page.locator('a[href="/en/mcp/architecture-trust/"]').last();
    await nextLesson.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/mcp\/architecture-trust\/$/);
    await waitForStableDocument(page);

    const check = page.locator('section[aria-labelledby="mcp-knowledge-check-title"]');
    const option = check.locator('input[type="radio"]').first();
    await option.focus();
    await page.keyboard.press("Space");
    await expect(option).toBeChecked();
    const button = check.locator("button");
    await expect(button).toBeEnabled();
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(check.locator('[role="status"]')).toBeVisible();
  });
});

test.describe("Course 10 metadata and static publication inventory", () => {
  test("localized canonical, reciprocal hreflang, and JSON-LD are self-consistent", async ({ page }) => {
    for (const [locale, suffix, expectedType] of [
      ["fr", "resources", "LearningResource"],
      ["ar", "", "Course"],
    ] as const) {
      const path = suffix ? `/${locale}/mcp/${suffix}/` : `/${locale}/mcp/`;
      await page.goto(path);
      const canonical = `https://aicourse.top${path}`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
      const alternates = page.locator('link[rel="alternate"][hreflang]');
      await expect(alternates).toHaveCount(EXPECTED_HREFLANGS.length);
      const hreflangs = (await alternates.evaluateAll((links) => links.map((link) => link.getAttribute("hreflang") || ""))).sort();
      expect(hreflangs).toEqual(EXPECTED_HREFLANGS);
      for (const alternateLocale of MCP_LOCALES) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${alternateLocale}"]`)).toHaveAttribute(
          "href",
          `https://aicourse.top/${alternateLocale}/mcp/${suffix ? `${suffix}/` : ""}`,
        );
      }
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        "href",
        `https://aicourse.top/en/mcp/${suffix ? `${suffix}/` : ""}`,
      );
      const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
      const serialized = JSON.stringify(jsonLd);
      expect(serialized).toContain(`\"@type\":\"${expectedType}\"`);
      expect(serialized).toContain(`\"inLanguage\":\"${locale}\"`);
      expect(serialized).toContain(canonical);
    }
  });

  test("sitemap contains exactly 171 MCP URLs", async ({ request }) => {
    const pageUrls = await publishedSitemapUrls(request);
    const urls = [...pageUrls]
      .filter((url) => new URL(url).pathname.includes("/mcp/"));
    expect(urls).toHaveLength(EXPECTED_MCP_ROUTE_COUNT);
    expect(new Set(urls).size).toBe(EXPECTED_MCP_ROUTE_COUNT);
    for (const locale of MCP_LOCALES) {
      expect(urls).toContain(`https://aicourse.top/${locale}/mcp/`);
      for (const slug of LESSON_SLUGS) {
        expect(urls).toContain(`https://aicourse.top/${locale}/mcp/${slug}/`);
      }
    }
  });

  test("downloads are served locally with the published checksum sidecar", async ({ request }) => {
    for (const path of [
      "/courses/mcp/MCP_CAPSTONE_EVIDENCE_PACK.md",
      "/courses/mcp/courseops-reference.zip",
      "/courses/mcp/courseops-reference.sha256",
      "/courses/mcp/figure-manifest.json",
      "/courses/mcp/NOTICE.md",
      "/courses/mcp/licenses/APACHE-2.0.txt",
      "/courses/mcp/licenses/CODEX-NOTICE.txt",
      ...MCP_LOCALES.map((locale) => `/courses/mcp/capstone/MCP_CAPSTONE_EVIDENCE_PACK-${locale}.md`),
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect((await response.body()).length, path).toBeGreaterThan(0);
    }
  });
});
