import { createRequire } from "node:module";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"] as const;
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;
const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

async function settleLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

test("the long mobile journey starts with core work and four closed secondary disclosures", async ({ page }) => {
  for (const { locale, maxCourseHeight } of [
    { locale: "en", maxCourseHeight: 4600 },
    { locale: "ar", maxCourseHeight: 4600 },
  ]) {
    await test.step(locale, async () => {
      await page.setViewportSize(VIEWPORTS[0]);
      expect((await page.goto(`/${locale}/build/`))?.status()).toBe(200);
      await settleLayout(page);

      await expect(page.locator("#local-setup")).toBeVisible();
      await expect(page.locator("[data-course-stage-map] a")).toHaveCount(10);
      const disclosures = page.locator("details[data-course3-disclosure]");
      await expect(disclosures).toHaveCount(4);
      for (const disclosure of await disclosures.all()) {
        await expect(disclosure).not.toHaveAttribute("open", "");
        const summary = disclosure.locator(":scope > summary");
        await expect(summary).toBeVisible();
        const box = await summary.boundingBox();
        expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
      }
      await expect(page.locator("#provider-options .provider-card")).toHaveCount(4);
      await expect(page.locator("#provider-options .provider-card").first()).not.toBeVisible();
      // Bound the Course 3 journey itself. The shared footer grows whenever a
      // separate course is published and is not owned by this page contract.
      const courseHeight = await page.locator(".build-page").evaluate((element) =>
        Math.round(element.getBoundingClientRect().height),
      );
      expect(courseHeight).toBeLessThanOrEqual(maxCourseHeight);
    });
  }
});

test("native Provider disclosure is keyboard-operable and reveals dated primary-source notes", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  expect((await page.goto("/en/build/"))?.status()).toBe(200);

  const provider = page.locator("#provider-options");
  const summary = provider.locator(":scope > summary");
  const firstSource = provider.locator("[data-course3-source-notes] a").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(provider).toHaveAttribute("open", "");
  await expect(provider.locator(".provider-card")).toHaveCount(4);
  await expect(provider.locator("[data-course-command]")).toHaveCount(5);
  const liveCommands = await provider.locator("[data-course-command] code").allTextContents();
  expect(liveCommands.filter((command) => command.includes("DEEPSEEK_API_KEY")))
    .toEqual(expect.arrayContaining([
      expect.stringMatching(/CAFE_PROVIDER=deepseek[\s\S]*unset CAFE_MODEL/),
      expect.stringMatching(/CAFE_PROVIDER = "deepseek"[\s\S]*CAFE_MODEL = \$null/),
    ]));
  expect(liveCommands.filter((command) => command.includes("ANTHROPIC_API_KEY")))
    .toEqual(expect.arrayContaining([
      expect.stringMatching(/CAFE_PROVIDER=anthropic[\s\S]*unset CAFE_MODEL/),
      expect.stringMatching(/CAFE_PROVIDER = "anthropic"[\s\S]*CAFE_MODEL = \$null/),
    ]));
  await expect(provider.locator("[data-course3-source-notes]")).toBeVisible();
  await expect(provider.locator("[data-course3-source-notes] time")).toHaveCount(3);
  await expect(provider.locator("[data-course3-source-notes] a")).toHaveCount(9);
  await expect(firstSource).toHaveAttribute("href", /^https:\/\//);
  await expect(firstSource).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(firstSource.locator(":scope > *")).toHaveCount(2);
  await expect(summary.locator(":scope > span")).toHaveCount(2);
  await expect(summary.locator(":scope > span").last()).toHaveAttribute("aria-hidden", "true");

  await summary.focus();
  await page.keyboard.press("Space");
  await expect(provider).not.toHaveAttribute("open", "");
  await expect(firstSource).not.toBeVisible();
});

test("Course 3 anchors clear the sticky header without a duplicate offset", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  expect((await page.goto("/en/build/"))?.status()).toBe(200);
  await page.locator('.hero a[href="#local-setup"]').click();
  await expect(page).toHaveURL(/#local-setup$/);

  const readClearance = () => page.evaluate(() => {
    const header = document.querySelector(".topbar")?.getBoundingClientRect();
    const target = document.querySelector("#local-setup")?.getBoundingClientRect();
    return header && target ? Math.round(target.top - header.bottom) : -999;
  });
  await expect.poll(readClearance).toBeLessThanOrEqual(32);
  expect(await readClearance()).toBeGreaterThanOrEqual(8);
});

test("native disclosure and source notes remain usable without JavaScript", async ({ browser }) => {
  for (const locale of ["en", "zh-Hant", "ar"] as const) {
    await test.step(locale, async () => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: VIEWPORTS[0] });
      const page = await context.newPage();
      expect((await page.goto(`/${locale}/build/`))?.status()).toBe(200);
      await expect(page.locator("[data-course-stage-map] a")).toHaveCount(10);
      const provider = page.locator("#provider-options");
      await provider.locator(":scope > summary").click();
      await expect(provider).toHaveAttribute("open", "");
      await expect(provider.locator("[data-course3-source-notes]")).toBeVisible();
      await expect(provider.locator("[data-course3-source-notes] a")).toHaveCount(9);
      await context.close();
    });
  }
});

test("all localized disclosures wrap without horizontal overflow", async ({ page }) => {
  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      await test.step(`${locale}-${viewport.width}`, async () => {
        await page.setViewportSize(viewport);
        expect((await page.goto(`/${locale}/build/`))?.status()).toBe(200);
        await settleLayout(page);
        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
        });
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }
  }
});

test("opened Phase 2 content has no serious or critical axe violations", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  for (const locale of ["en", "zh-Hant", "ar"] as const) {
    await test.step(locale, async () => {
      expect((await page.goto(`/${locale}/build/`))?.status()).toBe(200);
      for (const summary of await page.locator("details[data-course3-disclosure] > summary").all()) {
        await summary.click();
      }
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => {
        type AxeResult = {
          violations: Array<{
            id: string;
            impact: string | null;
            nodes: Array<{ target: string[] }>;
          }>;
        };
        const axe = (globalThis as unknown as {
          axe: { run: (context: Document) => Promise<AxeResult> };
        }).axe;
        const result = await axe.run(document);
        return result.violations
          .filter(({ impact }) => impact === "serious" || impact === "critical")
          .map(({ id, impact, nodes }) => ({
            id,
            impact,
            targets: nodes.flatMap(({ target }) => target),
          }));
      });
      expect(violations, `${locale}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
    });
  }
});

test("print opens every disclosure and restores the learner's screen state", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[1]);
  expect((await page.goto("/en/build/"))?.status()).toBe(200);
  const provider = page.locator("#provider-options");
  await provider.locator(":scope > summary").click();
  await expect(provider).toHaveAttribute("open", "");
  await expect(page.locator("details[data-course3-disclosure][open]")).toHaveCount(1);
  await expect.poll(async () => {
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    return page.locator("details[data-course3-disclosure][open]").count();
  }).toBe(4);
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(page.locator("details[data-course3-disclosure][open]")).toHaveCount(4);
  await page.emulateMedia({ media: "print" });
  for (const body of await page.locator("[data-course3-disclosure-body]").all()) {
    await expect(body).toBeVisible();
  }
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator("details[data-course3-disclosure][open]")).toHaveCount(1);
  await expect(provider).toHaveAttribute("open", "");
});
