import { createRequire } from "node:module";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const COURSE_ROOT = "https://github.com/HUDongpin/agent-edu/tree/main/course";
const STAGE_SLUGS = [
  "stage0-hello",
  "stage1-kiosk",
  "stage2-prompt",
  "stage3-evals",
  "stage4-context",
  "stage5-loop",
  "stage6-harness",
  "stage7-graph",
  "stage8-security",
  "stage9-project",
] as const;
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

async function expectNoHorizontalOverflow(page: Page) {
  await settleLayout(page);
  await expect.poll(() => page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  }), { message: "Course 3 must not overflow the viewport horizontally" }).toBeLessThanOrEqual(1);
}

test("Course 3 identifies Courses as its current parent location", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/en/build/");
  expect(response?.status()).toBe(200);

  const menu = page.getByRole("navigation", { name: "Menu", includeHidden: true });
  const courses = menu.getByRole("link", { name: "Courses", exact: true });
  await expect(courses).toHaveAttribute("aria-current", "location");
  await expect(menu.locator("[aria-current]")).toHaveCount(1);
});

test("the opened mobile menu puts its first link next in forward keyboard order", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/en/build/");
  expect(response?.status()).toBe(200);

  const menu = page.getByRole("navigation", { name: "Menu", includeHidden: true });
  const toggle = page.getByRole("button", { name: "Menu" });
  const firstLink = menu.getByRole("link", { name: "Courses", exact: true });
  const controlledId = await toggle.getAttribute("aria-controls");

  expect(controlledId).toBeTruthy();
  await expect(menu).toHaveAttribute("id", controlledId!);

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(firstLink).toBeVisible();

  // WebKit models Safari's default macOS preference: links join keyboard
  // traversal with Option+Tab. Chromium and Firefox use ordinary Tab.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(firstLink).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(firstLink).not.toBeVisible();
  await expect(toggle).toHaveAttribute("aria-controls", controlledId!);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.mouse.click(10, 800);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("the launchpad starts locally and makes every repository handoff explicit", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  const response = await page.goto("/en/build/");
  expect(response?.status()).toBe(200);

  const hero = page.locator(".build-page .hero");
  const start = hero.locator('a.btn.primary[href="#local-setup"]');
  const repository = hero.locator(`a[href="${COURSE_ROOT}"]`);
  await expect(start).toBeVisible();
  await expect(repository).toHaveAttribute("target", "_blank");
  await expect(repository).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(repository).toHaveAttribute("rel", /\bnoreferrer\b/);

  await start.click();
  await expect(page).toHaveURL(/#local-setup$/);
  await expect(page.locator("#local-setup")).toBeVisible();

  const continueStageOne = page.getByRole("link", { name: /Continue to Stage 1/i });
  await expect(continueStageOne).toHaveAttribute("href", `${COURSE_ROOT}/stage1-kiosk`);
  await expect(continueStageOne).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /View all stages/i })).toHaveAttribute(
    "href",
    "#course-stages",
  );

  const stageMap = page.locator("[data-course-stage-map]");
  const stageLinks = stageMap.locator("a");
  await expect(stageMap).toBeVisible();
  await expect(stageLinks).toHaveCount(STAGE_SLUGS.length);
  for (const [index, slug] of STAGE_SLUGS.entries()) {
    const link = stageLinks.nth(index);
    await expect(link).toHaveAttribute("href", `${COURSE_ROOT}/${slug}`);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
    await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  }
});

test("the external completion note is explicit, local, and reversible", async ({ page }) => {
  const response = await page.goto("/en/build/#local-progress");
  expect(response?.status()).toBe(200);

  const disclosure = page.locator("#local-progress");
  if ((await disclosure.getAttribute("open")) === null) {
    await disclosure.locator(":scope > summary").click();
  }
  const status = disclosure.getByRole("status").filter({ hasText: /Noted|storage/i });
  const declare = disclosure.getByRole("button", { name: "I have finished Part 3" });
  await expect(declare).toHaveAttribute("aria-pressed", "false");
  await declare.click();

  await expect(disclosure.getByRole("button", { name: "Remove this note" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect(status).toContainText("Noted in this browser only.");
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("ae.learning.v2");
    if (!raw) return [];
    return JSON.parse(raw).declared?.completed ?? [];
  })).toEqual(["build"]);

  await page.reload();
  const restored = page.locator("#local-progress");
  if ((await restored.getAttribute("open")) === null) {
    await restored.locator(":scope > summary").click();
  }
  const remove = restored.getByRole("button", { name: "Remove this note" });
  await expect(remove).toHaveAttribute("aria-pressed", "true");
  await remove.click();
  await expect(restored.getByRole("button", { name: "I have finished Part 3" }))
    .toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("ae.learning.v2");
    if (!raw) return null;
    return JSON.parse(raw).declared ?? null;
  })).toEqual({ completed: [] });
});

test("every command is keyboard focusable and Copy reports what it copied", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          if (document.documentElement.hasAttribute("data-copy-should-fail")) {
            throw new Error("simulated clipboard rejection");
          }
          document.documentElement.setAttribute("data-copied-text", value);
        },
      },
    });
  });
  await page.setViewportSize(VIEWPORTS[0]);
  const response = await page.goto("/en/build/");
  expect(response?.status()).toBe(200);

  const closedSummaries = page.locator("details:not([open]) > summary");
  for (let opened = 0; opened < 10 && await closedSummaries.count() > 0; opened += 1) {
    await closedSummaries.first().click();
  }
  await expect(closedSummaries).toHaveCount(0);

  const commands = page.locator("[data-course-command]");
  expect(await commands.count()).toBeGreaterThanOrEqual(3);
  for (const command of await commands.all()) {
    const scrollRegion = command.locator("[data-command-scroll]");
    await expect(scrollRegion).toHaveAttribute("tabindex", "0");
    await expect(scrollRegion).toHaveAttribute("aria-label", /\S/);
    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();
  }

  const first = commands.first();
  const copiedText = await first.locator("code").textContent();
  const status = first.locator('[data-command-status][role="status"]');
  await expect(status).toHaveText("");
  await first.locator("[data-command-copy]").click();
  await expect(status).not.toHaveText("");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-copied-text", copiedText!);

  const successText = (await status.innerText()).trim();
  const second = commands.nth(1);
  const secondButton = second.locator("[data-command-copy]");
  const secondStatus = second.locator('[data-command-status][role="status"]');
  const initialButtonText = (await secondButton.innerText()).trim();
  await page.locator("html").evaluate((root) => root.setAttribute("data-copy-should-fail", ""));
  await secondButton.click();
  await expect(secondStatus).toHaveAttribute("aria-live", "polite");
  await expect(secondStatus).toBeVisible();
  await expect(secondStatus).not.toHaveText("");
  expect((await secondStatus.innerText()).trim()).not.toBe(successText);
  await expect(secondButton).toHaveText(initialButtonText);
});

test("the English-only repository boundary and new-tab handoff are localized", async ({ page }) => {
  const disclosureText: string[] = [];
  for (const { locale, englishName, newTabName } of [
    { locale: "en", englishName: /English/, newTabName: /opens in a new tab/ },
    { locale: "zh-Hant", englishName: /英語/, newTabName: /在新分頁中開啟/ },
    { locale: "ar", englishName: /الإنجليزية/, newTabName: /يفتح في علامة تبويب جديدة/ },
  ]) {
    const response = await page.goto(`/${locale}/build/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);

    const boundary = page.locator("[data-repository-language-boundary]");
    await expect(boundary).toBeVisible();
    const text = (await boundary.innerText()).replace(/\s+/g, " ").trim();
    expect(text.length).toBeGreaterThan(20);
    expect(text).toMatch(englishName);
    disclosureText.push(text);
    await expect(page.locator(".build-page .hero .acts a[target='_blank']"))
      .toHaveAttribute("aria-label", newTabName);
    expect(await boundary.evaluate((node) => {
      const actionNode = document.querySelector(".build-page .hero .acts");
      return Boolean(actionNode
        && (node.compareDocumentPosition(actionNode) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toBe(true);
  }
  expect(new Set(disclosureText).size).toBe(disclosureText.length);
});

test("Arabic technical tokens keep LTR isolation inside the RTL launchpad", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  const response = await page.goto("/ar/build/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const technicalTokens = page.locator("bdi[data-course-technical-token]");
  expect(await technicalTokens.count()).toBeGreaterThan(8);
  for (const token of await technicalTokens.all()) {
    await expect(token).toHaveAttribute("dir", "ltr");
    await expect(token).toHaveAttribute("translate", "no");
  }
  await expect(technicalTokens.filter({ hasText: "course/progress.json" }).first()).toBeVisible();
  await expect(technicalTokens.filter({ hasText: "TypeScript" }).first()).toBeVisible();
  await expect(page.locator("[data-course-command] code").first()).toHaveAttribute("translate", "no");
  await expect(page.locator(".build-page .hero .lede")).toContainText("من 0 إلى 8");
  await expect(page.locator(".build-page .hero .lede")).not.toContainText("(0–8)");
});

test("Course 3 stays inside the viewport at mobile, tablet, and desktop widths", async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await test.step(`${viewport.width}px`, async () => {
      await page.setViewportSize(viewport);
      const response = await page.goto("/en/build/");
      expect(response?.status()).toBe(200);
      await expect(page.locator("#local-setup")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});

test("Course 3 navigation and actions keep comfortable touch targets", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  const response = await page.goto("/en/build/");
  expect(response?.status()).toBe(200);
  await settleLayout(page);

  const targets = page.locator([
    ".topbar .logo:visible",
    ".topbar .iconbtn:visible",
    ".build-page .btn:visible",
    "[data-course-stage-map] a:visible",
    "[data-command-copy]:visible",
  ].join(", "));
  expect(await targets.count()).toBeGreaterThan(8);
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    expect(box, `missing box for ${await target.evaluate((node) => node.outerHTML.slice(0, 160))}`).not.toBeNull();
    // Browser engines can expose an exact CSS-pixel target with a fractional
    // floating-point remainder; assert the rendered CSS-pixel size.
    expect(Math.round(box!.width)).toBeGreaterThanOrEqual(44);
    expect(Math.round(box!.height)).toBeGreaterThanOrEqual(44);
  }
});

test("Course 3 has no serious or critical axe violations in EN, CJK, or RTL", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  for (const locale of ["en", "zh-Hant", "ar"]) {
    await test.step(locale, async () => {
      const response = await page.goto(`/${locale}/build/`);
      expect(response?.status()).toBe(200);
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
