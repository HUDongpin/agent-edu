import type { Page } from "@playwright/test";
import { PLAYWRIGHT_TEST_ORIGIN } from "../tests/playwright-test-url";
import { expect, test } from "./fixtures";

const JOURNEY_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
] as const;

const CORE_ROUTES = ["", "handbook/", "lab/", "build/"] as const;
const CORE_ROUTE_MARKERS: Record<(typeof CORE_ROUTES)[number], string> = {
  "": ".platform-home #home-title",
  "handbook/": "#rail",
  "lab/": ".shellwrap.lab .labhero",
  "build/": ".build-page .build-steps",
};
const RELEASE_VIEWPORTS = [390, 1440] as const;
const RELEASE_THEMES = ["light", "dark"] as const;
const ARABIC_MATRIX_WIDTHS = [390, 979, 980, 1440] as const;

async function expectActiveHandbookTab(page: Page, id: string) {
  await expect(page.locator('.rail-btn[tabindex="0"]')).toHaveCount(1);
  await expect(page.locator('.rail-btn[aria-selected="true"]')).toHaveCount(1);
  await expect(page.locator(id)).toHaveAttribute("tabindex", "0");
  await expect(page.locator(id)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(id.replace("#tab-", "#p-"))).toHaveClass(/\bon\b/);
}

async function expectNoPageOverflow(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect.poll(() => page.evaluate(() => {
    const html = document.documentElement;
    return Math.max(html.scrollWidth, document.body.scrollWidth) - html.clientWidth;
  }), { message: "the document must not overflow the viewport horizontally" })
    .toBeLessThanOrEqual(1);
}

async function installSavedTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem("ae.theme", selectedTheme);
    (window as Window & { __firstFrameTheme?: string }).__firstFrameTheme = undefined;
    requestAnimationFrame(() => {
      (window as Window & { __firstFrameTheme?: string }).__firstFrameTheme =
        document.documentElement.getAttribute("data-theme") ?? "";
    });
  }, theme);
}

async function expectActiveTabInsideRail(page: Page, id: string) {
  const tab = page.locator(id);
  const [railBox, tabBox, viewport] = await Promise.all([
    page.locator("#rail").boundingBox(),
    tab.boundingBox(),
    page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
  ]);
  expect(railBox, "Handbook rail bounding box").not.toBeNull();
  expect(tabBox, `${id} bounding box`).not.toBeNull();
  expect(tabBox!.x).toBeGreaterThanOrEqual(railBox!.x - 1);
  expect(tabBox!.x + tabBox!.width).toBeLessThanOrEqual(railBox!.x + railBox!.width + 1);
  expect(tabBox!.y).toBeGreaterThanOrEqual(railBox!.y - 1);
  expect(tabBox!.y + tabBox!.height).toBeLessThanOrEqual(railBox!.y + railBox!.height + 1);
  // Bounding boxes can land on a fractional device pixel. One CSS pixel of
  // tolerance still proves the whole control is present in the viewport.
  expect(tabBox!.x).toBeGreaterThanOrEqual(-1);
  expect(tabBox!.x + tabBox!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(tabBox!.y).toBeGreaterThanOrEqual(-1);
  expect(tabBox!.y + tabBox!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function waitForDocumentScrollToSettle(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    let previousX = scrollX;
    let previousY = scrollY;
    let stableFrames = 0;
    let observedFrames = 0;

    const observe = () => {
      const stable = Math.abs(scrollX - previousX) < 0.01
        && Math.abs(scrollY - previousY) < 0.01;
      stableFrames = stable ? stableFrames + 1 : 0;
      previousX = scrollX;
      previousY = scrollY;
      observedFrames += 1;

      // Observe long enough for a newly scheduled smooth scroll to start,
      // then require four consecutive stationary frames. The hard ceiling
      // keeps a browser regression from hanging the release gate forever.
      if ((observedFrames >= 12 && stableFrames >= 4) || observedFrames >= 120) {
        resolve();
        return;
      }
      requestAnimationFrame(observe);
    };

    requestAnimationFrame(observe);
  }));
}

test("the unprefixed root resolves to the English home", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator(".platform-home #home-title")).toBeVisible();
});

for (const locale of JOURNEY_LOCALES) {
  test(`${locale}: home → Handbook → Lab → Part 3 stays local`, async ({ page }) => {
    const providerRequests: string[] = [];
    const unexpectedOrigins = new Set<string>();
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    await page.route("https://api.deepseek.com/**", async (route) => {
      providerRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ choices: [{ message: { content: "mock" } }] }),
      });
    });
    await page.route("**/_vercel/insights/script.js", (route) =>
      route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
    );

    page.on("request", (request) => {
      const origin = new URL(request.url()).origin;
      if (origin !== PLAYWRIGHT_TEST_ORIGIN && origin !== "https://api.deepseek.com") {
        unexpectedOrigins.add(origin);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const prefix = `/${locale}`;
    const homeResponse = await page.goto(`${prefix}/`);
    expect(homeResponse?.status(), `${prefix}/ must be a static 200`).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${prefix}/$`));
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.locator(".platform-home #home-title")).toBeVisible();

    await page.locator(`.platform-hero a[href="${prefix}/handbook/"]`).click();
    await expect.poll(() => page.evaluate(() => location.pathname))
      .toBe(`${prefix}/handbook/`);
    await expect(page.locator("#rail")).toBeVisible();
    await page.locator("#tab-play").click();
    await expectActiveHandbookTab(page, "#tab-play");
    await expect(page).toHaveURL(/#play$/);

    const handbookNext = page.locator('[data-course-lesson-nav] a[rel="next"]');
    await expect(handbookNext).toHaveAttribute("href", `${prefix}/lab/`);
    await handbookNext.click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/lab/$`));
    await expect(page.locator(".shellwrap.lab .labhero")).toBeVisible();
    await page.locator('.steps [role="tab"]').last().click();
    await expect(page.locator('[data-lab-handoff="part-3"]')).toBeVisible();

    await page.locator('[data-lab-handoff="part-3"]').click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/build/$`));
    await expect(page.locator(".build-page .build-steps")).toBeVisible();

    expect(providerRequests, "navigation must not make a paid Provider request").toEqual([]);
    expect([...unexpectedOrigins], "all network origins must be allow-listed").toEqual([]);
    expect(pageErrors, "page errors").toEqual([]);
    expect(consoleErrors, "console errors").toEqual([]);
  });
}

for (const locale of JOURNEY_LOCALES) {
  for (const width of RELEASE_VIEWPORTS) {
    for (const theme of RELEASE_THEMES) {
      test(`${locale}: ${width}px ${theme} core-route layout`, async ({ page }) => {
        const pageErrors: string[] = [];
        const consoleErrors: string[] = [];
        await page.setViewportSize({ width, height: 900 });
        await installSavedTheme(page, theme);
        await page.route("**/_vercel/insights/script.js", (route) =>
          route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
        );
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });

        for (const route of CORE_ROUTES) {
          await test.step(`/${locale}/${route}`, async () => {
            const response = await page.goto(`/${locale}/${route}`);
            expect(response, "main-document response").not.toBeNull();
            expect(response!.status(), `/${locale}/${route} must be a static 200`).toBe(200);
            await expect(page.locator("html")).toHaveAttribute("lang", locale);
            await expect(page.locator("html")).toHaveAttribute(
              "dir",
              locale === "ar" ? "rtl" : "ltr",
            );
            await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
            await expect.poll(() => page.evaluate(() =>
              (window as Window & { __firstFrameTheme?: string }).__firstFrameTheme,
            ), { message: "the saved theme must be present by the first animation frame" })
              .toBe(theme);
            await expect(page.locator(CORE_ROUTE_MARKERS[route])).toBeVisible();
            await expectNoPageOverflow(page);
          });
        }
        expect(pageErrors, "matrix page errors").toEqual([]);
        expect(consoleErrors, "matrix console errors").toEqual([]);
      });
    }
  }
}

for (const width of ARABIC_MATRIX_WIDTHS) {
  for (const theme of RELEASE_THEMES) {
    test(`ar: ${width}px ${theme} automated RTL keyboard baseline`, async ({ page }) => {
      const expectedOrientation = width < 980 ? "horizontal" : "vertical";
      await page.setViewportSize({ width, height: 900 });
      await installSavedTheme(page, theme);
      const response = await page.goto("/ar/handbook/#start");
      expect(response?.status(), "/ar/handbook/ must be a static 200").toBe(200);

      const rail = page.locator("#rail");
      await expect(rail).toHaveAttribute("aria-orientation", expectedOrientation);
      await page.locator("#tab-start").focus();
      await page.keyboard.press("End");
      await expectActiveHandbookTab(page, "#tab-play");
      await expect(page.locator("#tab-play")).toBeFocused();
      await expect(page).toHaveURL(/#play$/);
      await expectActiveTabInsideRail(page, "#tab-play");

      await page.keyboard.press("Home");
      await expectActiveHandbookTab(page, "#tab-start");
      await expect(page.locator("#tab-start")).toBeFocused();
      await expect(page).toHaveURL(/#start$/);

      if (expectedOrientation === "horizontal") {
        await page.keyboard.press("ArrowLeft");
        await expectActiveHandbookTab(page, "#tab-code");
        await page.keyboard.press("ArrowRight");
        await expectActiveHandbookTab(page, "#tab-start");
      } else {
        await page.keyboard.press("ArrowDown");
        await expectActiveHandbookTab(page, "#tab-code");
        await page.keyboard.press("ArrowUp");
        await expectActiveHandbookTab(page, "#tab-start");
        await page.keyboard.press("ArrowLeft");
        await expectActiveHandbookTab(page, "#tab-start");
        await page.keyboard.press("ArrowRight");
        await expectActiveHandbookTab(page, "#tab-start");
      }

      await page.locator("#tab-compare").click();
      await expectActiveHandbookTab(page, "#tab-compare");
      await waitForDocumentScrollToSettle(page);
      await expectActiveTabInsideRail(page, "#tab-compare");
      await expect(page.locator("#dialSvg")).toHaveCSS("direction", "ltr");
      await expectNoPageOverflow(page);

      if (width === 390 || width === 980) {
        const table = page.locator("#p-compare .tablewrap");
        await expect(page.locator("#p-compare .tablewrap + .scrollhint")).toBeVisible();
        const scroll = await table.evaluate((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            overflowX: style.overflowX,
            left: rect.left,
            right: rect.right,
            viewport: document.documentElement.clientWidth,
          };
        });
        expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
        expect(["auto", "scroll"]).toContain(scroll.overflowX);
        expect(scroll.left).toBeGreaterThanOrEqual(-1);
        expect(scroll.right).toBeLessThanOrEqual(scroll.viewport + 1);
      }

      const buildResponse = await page.goto("/ar/build/");
      expect(buildResponse?.status(), "/ar/build/ must be a static 200").toBe(200);
      await expect(page.locator(".build-page pre[dir='ltr']").first()).toHaveCSS("direction", "ltr");
      await expectNoPageOverflow(page);
    });
  }
}

test("Handbook tabs switch orientation at 979/980 and reveal the active tab", async ({ page }) => {
  await page.setViewportSize({ width: 979, height: 800 });
  await page.goto("/en/handbook/#play");

  const rail = page.locator("#rail");
  const active = page.locator("#tab-play");
  await expect(rail).toHaveAttribute("aria-orientation", "horizontal");
  await expectActiveHandbookTab(page, "#tab-play");

  const activeBox = await active.boundingBox();
  expect(activeBox).not.toBeNull();
  expect(activeBox!.x).toBeGreaterThanOrEqual(0);
  expect(activeBox!.x + activeBox!.width).toBeLessThanOrEqual(979);

  await page.setViewportSize({ width: 980, height: 800 });
  await expect(rail).toHaveAttribute("aria-orientation", "vertical");
  await expectActiveHandbookTab(page, "#tab-play");
});

test("Handbook tabs rove, wrap, support Home/End, and preserve the intended focus", async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 800 });
  await page.goto("/en/handbook/#start");

  await page.locator("#tab-start").focus();
  await page.keyboard.press("End");
  await expectActiveHandbookTab(page, "#tab-play");
  await expect(page.locator("#tab-play")).toBeFocused();

  await page.keyboard.press("Home");
  await expectActiveHandbookTab(page, "#tab-start");
  await page.keyboard.press("ArrowUp");
  await expectActiveHandbookTab(page, "#tab-play");

  await page.locator("#tab-code").click();
  await expectActiveHandbookTab(page, "#tab-code");
  await expect(page.locator("#tab-code")).toBeFocused();

  await page.locator('#p-code [data-goto="prompt"]').last().click();
  await expectActiveHandbookTab(page, "#tab-prompt");
  await expect(page.locator("#p-prompt")).toBeFocused();

  await page.setViewportSize({ width: 979, height: 800 });
  await page.locator("#tab-start").click();
  await page.keyboard.press("ArrowLeft");
  await expectActiveHandbookTab(page, "#tab-play");
  await page.keyboard.press("ArrowRight");
  await expectActiveHandbookTab(page, "#tab-start");
});

test("Arabic horizontal tabs mirror arrows in both Handbook and Lab", async ({ page }) => {
  await page.setViewportSize({ width: 979, height: 800 });
  await page.goto("/ar/handbook/#start");

  await page.locator("#tab-start").focus();
  await page.keyboard.press("ArrowLeft");
  await expectActiveHandbookTab(page, "#tab-code");
  await page.keyboard.press("ArrowRight");
  await expectActiveHandbookTab(page, "#tab-start");

  await page.goto("/ar/lab/");
  const stages = page.locator('.steps [role="tab"]');
  await stages.nth(0).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(stages.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(stages.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(stages.nth(0)).toHaveAttribute("aria-selected", "true");
  await expect(stages.nth(0)).toBeFocused();
});

test("Handbook deep links, history, restoration, and the page-level H1 stay consistent", async ({ page }) => {
  await page.goto("/en/handbook/#security");
  await expectActiveHandbookTab(page, "#tab-security");
  await expect(page.locator("#p-security")).toHaveClass(/\bon\b/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".panel h1")).toHaveCount(0);
  await expect(page.locator('#p-compare a[href="../build/"]')).toHaveAttribute("href", "../build/");

  await page.locator('#p-security [data-goto="compare"]').last().click();
  await expect(page).toHaveURL(/#compare$/);
  await expect(page.locator("#p-compare")).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/#security$/);
  await expectActiveHandbookTab(page, "#tab-security");

  await page.goto("/en/");
  await page.evaluate(() => {
    localStorage.removeItem("ae.learning.v2");
    localStorage.setItem("tch.section", "graph");
  });
  await page.goto("/en/handbook/");
  await expect(page).toHaveURL(/#graph$/);
  await expectActiveHandbookTab(page, "#tab-graph");
  await expect(page.locator("h1")).toHaveCount(1);
});

test("Handbook core judgements stay task-complete when diagrams are hidden", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/handbook/#start");
  await page.addStyleTag({ content: "svg { display: none !important; }" });

  await expect(page.locator("#dialSvg")).toHaveAttribute("role", "group");
  await page.locator('[data-disclosure="start-practices"] > summary').click();
  await page.locator('#p-start .c4[data-goto="loop"]').click();
  await expectActiveHandbookTab(page, "#tab-loop");

  const limit = page.locator("#lMax");
  await limit.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "4";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#lMaxV")).toHaveText("4");
  await page.locator("#lRun").click();
  await expect(page.locator("#lStatus")).toHaveText(/stopped at limit/i);
  await expect(page.locator("#stepLog .sl")).toHaveCount(4);
  await expect(page.locator("#lStepAnnounce")).toContainText(/Step 4/i);

  await page.locator("#tab-graph").click();
  const reviewer = page.locator("#gRev");
  await reviewer.click();
  await expect(reviewer).toHaveAttribute("aria-pressed", "false");
  await page.locator("#gButtons button").filter({ hasText: "Complaint" }).click();
  await expect(page.locator("#gLog")).toContainText(/Reviewer.*skipped/i);
  await expect(page.locator("#gResultBox")).toContainText(/outside refund policy/i);

  await page.locator("#tab-security").click();
  await page.locator("#secNone").click();
  await page.locator("#secRun").click();
  await expect(page.locator("#secVerdict")).toContainText(/taken over by an email/i);
  await expect(page.locator("#secActions")).toContainText(/Refunded \$4,210/i);
  await expect(page.locator("#secActions")).toContainText(/1,284 customer addresses/i);

  await page.locator("#tab-compare").click();
  const questions = page.locator("#decider fieldset.q");
  await expect(questions).toHaveCount(3);
  const exactRules = questions.nth(0).getByRole("button", { name: /fixed rules/i });
  await exactRules.click();
  await expect(exactRules).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#recTitle")).toContainText(/plain code/i);
  await expect(page.locator("#recBody")).toContainText(/rules are complete and exact/i);

  const needsJudgement = questions.nth(0).getByRole("button", { name: /needs judgement/i });
  await needsJudgement.click();
  await questions.nth(1).getByRole("button", { name: "One step", exact: true }).click();
  await questions.nth(2).getByRole("button", { name: /non-negotiable/i }).click();
  await expect(needsJudgement).toHaveAttribute("aria-pressed", "true");
  await expect(exactRules).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#recBox")).toHaveAttribute("role", "status");
  await expect(page.locator("#recTitle")).toContainText(/small graph/i);
  await expect(page.locator("#recBody")).toContainText(/mandatory check/i);
});
