import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground: string, background: string) {
  const parse = (value: string) => {
    const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!channels || channels.length !== 3) throw new Error(`Cannot parse colour: ${value}`);
    return 0.2126 * channel(channels[0])
      + 0.7152 * channel(channels[1])
      + 0.0722 * channel(channels[2]);
  };
  const left = parse(foreground);
  const right = parse(background);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

async function colors(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    let current: Element | null = element;
    let background = "rgb(255, 255, 255)";
    while (current) {
      const candidate = getComputedStyle(current).backgroundColor;
      if (candidate !== "rgba(0, 0, 0, 0)" && candidate !== "transparent") {
        background = candidate;
        break;
      }
      current = current.parentElement;
    }
    return { foreground: style.color, background };
  });
}

async function expectTextContrast(locator: Locator, minimum = 4.5) {
  const { foreground, background } = await colors(locator);
  expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(minimum);
}

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

test("dark-theme Course 3 prints with a readable light palette and exact state restoration", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  expect((await page.goto("/en/build/"))?.status()).toBe(200);
  await page.locator("#provider-options > summary").click();
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await expect(page.locator("details[data-course3-disclosure][open]")).toHaveCount(1);

  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("details[data-course3-disclosure][open]")).toHaveCount(4);

  const palette = await page.locator(".build-page").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      scheme: style.colorScheme,
      ink: style.getPropertyValue("--ink").trim(),
      card: style.getPropertyValue("--card").trim(),
    };
  });
  expect(palette.scheme).toBe("light");
  expect(palette.ink.toUpperCase()).toBe("#16192B");
  expect(palette.card.toUpperCase()).toMatch(/^#FFF(?:FFF)?$/);
  await expectTextContrast(page.locator(".build-page h1"), 3);
  await expectTextContrast(page.locator(".build-page .lede"));
  await expectTextContrast(page.locator(".build-page .card p").first());
  await expectTextContrast(page.locator("[data-course3-source-notes] p").first());
  await expectNoOverflow(page);

  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator("details[data-course3-disclosure][open]")).toHaveCount(1);
  await expect(page.locator("#provider-options")).toHaveAttribute("open", "");
});

test("English and Arabic printed source notes retain wrapped LTR destinations", async ({ page }) => {
  for (const locale of ["en", "ar"] as const) {
    await test.step(locale, async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      expect((await page.goto(`/${locale}/build/`))?.status()).toBe(200);
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "dark");
        window.dispatchEvent(new Event("beforeprint"));
      });
      await page.emulateMedia({ media: "print" });

      const links = page.locator("[data-course3-source-notes] a");
      await expect(links).toHaveCount(9);
      for (const link of await links.all()) {
        const href = await link.getAttribute("href");
        const pseudo = await link.evaluate((element) => {
          const style = getComputedStyle(element, "::after");
          const arrow = element.querySelector(".arrow");
          return {
            content: style.content,
            direction: style.direction,
            unicodeBidi: style.unicodeBidi,
            overflowWrap: style.overflowWrap,
            arrowDisplay: arrow ? getComputedStyle(arrow).display : "missing",
          };
        });
        // Firefox exposes the authored attr() expression here while resolving
        // it in generated/printed content; Chromium and WebKit expose the
        // resolved destination. The static contract separately locks
        // content: attr(href), so both computed-style representations are
        // valid cross-browser evidence.
        expect(
          pseudo.content.includes(href!) || pseudo.content === "attr(href)",
        ).toBe(true);
        expect(pseudo.direction).toBe("ltr");
        expect(pseudo.unicodeBidi).toBe("isolate");
        expect(pseudo.overflowWrap).toBe("anywhere");
        expect(pseudo.arrowDisplay).toBe("none");
      }
      await expectNoOverflow(page);
      await page.emulateMedia({ media: "screen" });
      await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    });
  }
});

test("no-JavaScript commands stay selectable without dead Copy controls and remain printable", async ({ browser }) => {
  for (const locale of ["en", "zh-Hant", "ar"] as const) {
    await test.step(locale, async () => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      expect((await page.goto(`/${locale}/build/`))?.status()).toBe(200);

      await expect(page.locator("[data-command-copy]:visible")).toHaveCount(0);
      const selectableCommands = page.locator("[data-command-scroll]:visible");
      expect(await selectableCommands.count()).toBeGreaterThanOrEqual(3);
      for (const command of await selectableCommands.all()) {
        await expect(command).toHaveAttribute("tabindex", "0");
      }

      if (locale === "en") {
        await page.emulateMedia({ media: "print" });
        const disclosures = page.locator("details[data-course3-disclosure]");
        await expect(disclosures).toHaveCount(4);
        for (const disclosure of await disclosures.all()) {
          await expect(disclosure).not.toHaveAttribute("open", "");
          const rendering = await disclosure.evaluate((element) => {
            const body = element.querySelector<HTMLElement>("[data-course3-disclosure-body]");
            if (!body) return null;
            const style = getComputedStyle(body);
            const slot = getComputedStyle(element, "::details-content");
            const rect = body.getBoundingClientRect();
            return {
              bodyDisplay: style.display,
              bodyVisibility: style.visibility,
              bodyContentVisibility: style.contentVisibility,
              slotDisplay: slot.display,
              slotContentVisibility: slot.contentVisibility,
              width: rect.width,
              height: rect.height,
            };
          });
          expect(rendering).not.toBeNull();
          expect(rendering!.bodyDisplay).not.toBe("none");
          expect(rendering!.bodyVisibility).toBe("visible");
          expect(rendering!.bodyContentVisibility).toBe("visible");
          expect(rendering!.slotDisplay).not.toBe("none");
          expect(rendering!.slotContentVisibility).toBe("visible");
          expect(rendering!.width).toBeGreaterThan(0);
          expect(rendering!.height).toBeGreaterThan(0);
        }
      }
      await context.close();
    });
  }
});

test("the no-JavaScript fallback does not hide Copy after client-side navigation", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  expect((await page.goto("/en/courses/"))?.status()).toBe(200);
  await page.evaluate(() => {
    (window as typeof window & { course3NavigationMarker?: string })
      .course3NavigationMarker = "preserved";
  });
  await page.locator('a[href="/en/build/"]').first().click();
  await expect(page).toHaveURL(/\/en\/build\/$/);
  expect(await page.evaluate(() =>
    (window as typeof window & { course3NavigationMarker?: string })
      .course3NavigationMarker,
  )).toBe("preserved");

  const buttons = page.locator("[data-command-copy]:visible");
  expect(await buttons.count()).toBeGreaterThanOrEqual(4);
  const firstCommand = page.locator("[data-course-command]:visible").first();
  await firstCommand.locator("[data-command-copy]").click();
  await expect(firstCommand.locator('[role="status"]')).toHaveAttribute(
    "data-copy-state",
    "success",
  );
});

test("Copy live feedback is mounted while idle and distinguishes success from failure", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          if (document.documentElement.hasAttribute("data-copy-fails")) {
            throw new Error("fixture rejection");
          }
        },
      },
    });
  });

  for (const theme of ["light", "dark"] as const) {
    await test.step(theme, async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      expect((await page.goto("/en/build/"))?.status()).toBe(200);
      await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
      const command = page.locator("[data-course-command]").first();
      const status = command.locator('[role="status"]');
      const button = command.locator("[data-command-copy]");

      await expect(status).toHaveAttribute("data-copy-state", "idle");
      expect(await status.evaluate((element) => getComputedStyle(element).display)).not.toBe("none");
      const idleBox = await status.boundingBox();
      expect((idleBox?.width ?? 0) * (idleBox?.height ?? 0)).toBeLessThanOrEqual(1);

      await button.focus();
      await expect(button).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(status).toHaveAttribute("data-copy-state", "success");
      await expect(status).toHaveText("Copied");
      await expect(status).toBeVisible();
      await expectTextContrast(status);
      await expect(button).toBeFocused();

      await page.locator("html").evaluate((root) => root.setAttribute("data-copy-fails", ""));
      await page.keyboard.press("Space");
      await expect(status).toHaveAttribute("data-copy-state", "error");
      await expect(status).toContainText("Copy failed");
      await expect(status).toBeVisible();
      await expectTextContrast(status);
      await expect(button).toBeFocused();
      await expect(command.locator("[data-command-scroll]")).toHaveAttribute("tabindex", "0");
    });
  }
});

test("Phase 3 preserves narrow, dark, RTL, focus, and reduced-motion contracts", async ({ page }) => {
  for (const locale of ["en", "zh-Hant", "ar"] as const) {
    for (const theme of ["light", "dark"] as const) {
      await test.step(`${locale}-${theme}`, async () => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width: 320, height: 760 });
        expect((await page.goto(`/${locale}/build/`))?.status()).toBe(200);
        await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
        for (const summary of await page.locator("details[data-course3-disclosure] > summary").all()) {
          await summary.click();
        }
        await expectNoOverflow(page);

        const firstSummary = page.locator("details[data-course3-disclosure] > summary").first();
        // Establish keyboard modality so :focus-visible is the contract under
        // test rather than each engine's pointer/programmatic-focus heuristic.
        await page.keyboard.press("Tab");
        await firstSummary.focus();
        await expect(firstSummary).toBeFocused();
        const outline = await firstSummary.evaluate((element) => {
          const style = getComputedStyle(element);
          return { width: style.outlineWidth, style: style.outlineStyle };
        });
        expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
        expect(outline.style).not.toBe("none");
        const transition = await firstSummary.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).transitionDuration) || 0,
        );
        expect(transition).toBeLessThanOrEqual(0.001);

        for (const token of await page.locator("bdi[data-course-technical-token]").all()) {
          await expect(token).toHaveAttribute("dir", "ltr");
        }
      });
    }
  }
});
