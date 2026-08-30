import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const STATIC_PATHS = [
  { path: "/en/", marker: ".platform-hero" },
  { path: "/en/handbook/", marker: "#rail" },
  { path: "/en/lab/", marker: ".shellwrap.lab .labhero" },
  { path: "/en/build/", marker: ".build-page .build-steps" },
] as const;

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
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
  }), { message: "the static page must not overflow the viewport horizontally" }).toBeLessThanOrEqual(1);
}

test("the English static learning paths render at narrow and wide widths", async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (const route of STATIC_PATHS) {
      await test.step(`${route.path} at ${viewport.width}px`, async () => {
        const response = await page.goto(route.path);
        expect(response, "main-document response").not.toBeNull();
        expect(response!.status(), `${route.path} must be a static 200`).toBe(200);
        await expect(page.locator(route.marker)).toBeVisible();
        if (route.path === "/en/") {
          await expect(page.getByRole("heading", {
            level: 1,
            name: "Learn AI by doing. Build skills you can prove.",
          })).toBeVisible();
          await expect(page.getByRole("link", { name: "Explore all courses" })).toBeVisible();
        }
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await expectNoHorizontalOverflow(page);

        if (route.path === "/en/" && viewport.width === 1440) {
          const layout = await page.locator(".platform-hero").evaluate((hero) => {
            const rect = hero.getBoundingClientRect();
            const art = hero.querySelector(".platform-hero-art")?.getBoundingClientRect();
            const primaryCta = hero.querySelector(".btn.primary")?.getBoundingClientRect();
            return {
              display: getComputedStyle(hero).display,
              height: rect.height,
              bottom: rect.bottom,
              artBottom: art?.bottom ?? Number.POSITIVE_INFINITY,
              ctaBottom: primaryCta?.bottom ?? Number.POSITIVE_INFINITY,
            };
          });
          expect(layout.display).toBe("grid");
          expect(layout.height).toBeLessThan(1000);
          expect(layout.bottom).toBeLessThanOrEqual(1000);
          expect(layout.artBottom).toBeLessThanOrEqual(1000);
          expect(layout.ctaBottom).toBeLessThanOrEqual(1000);
        }
      });
    }
  }
});

test("an unknown static path returns the multilingual recovery 404", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  const response = await page.goto("/compatibility-check/missing-page/");
  expect(response, "404 main-document response").not.toBeNull();
  expect(response!.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "und");
  await expect(page.locator("h1")).toHaveText("404");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  await expect(page.locator(".recovery404-grid li")).toHaveCount(9);
  await expect(page.locator(".recovery404-missing")).toHaveCount(9);
  await expect(page.locator('a[href="/ar/courses/"]')).toBeVisible();

  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("href", "/en/");
  const focusRing = await focused.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  expect(focusRing.style).not.toBe("none");
  expect(focusRing.width).toBeGreaterThanOrEqual(2);
  await expectNoHorizontalOverflow(page);
});

test("the shared stylesheet honours reduced-motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/en/");
  expect(response?.status()).toBe(200);

  const motion = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const button = getComputedStyle(document.querySelector(".btn")!);
    return {
      scrollBehavior: root.scrollBehavior,
      transitionDuration: button.transitionDuration,
    };
  });
  const firstDuration = motion.transitionDuration.split(",", 1)[0].trim();
  const durationMs = firstDuration.endsWith("ms")
    ? Number.parseFloat(firstDuration)
    : Number.parseFloat(firstDuration) * 1000;
  expect(motion.scrollBehavior).toBe("auto");
  expect(durationMs).toBeLessThanOrEqual(0.01);
});

test("the mobile menu reaches Teach in two interactions and exposes its download", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]);
  const home = await page.goto("/en/");
  expect(home?.status()).toBe(200);

  const menu = page.getByRole("navigation", { name: "Menu" });
  const toggle = page.getByRole("button", { name: "Menu" });
  const teachLink = menu.locator('a[href="/en/teach/"]');
  await expect(teachLink).not.toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(teachLink).toBeVisible();
  await teachLink.click();

  await expect(page).toHaveURL(/\/en\/teach\/$/);
  await expect(page.locator(".teacher-pack h1")).toBeVisible();
  await expect(page.locator('[data-teach-offline="part-3"]')).toHaveAttribute(
    "href",
    "/en/build/",
  );
  const download = page.locator('a[download][href="/teacher-pack.txt"]');
  await expect(download).toBeVisible();
  await expect(download).toContainText("English");

  const downloadResponse = await page.request.get("/teacher-pack.txt");
  expect(downloadResponse.status()).toBe(200);
  expect(await downloadResponse.text()).toContain("AICOURSE.TOP — TEACHER QUICK PACK");
  expect(await downloadResponse.text()).toContain("npm run course:offline");
  await expectNoHorizontalOverflow(page);
});
