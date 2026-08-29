import { expect, test } from "../e2e/fixtures";
import { withIsolatedRoutePage } from "./published-course-test-helpers";

test("Course 2 public routes stay 404 without preview authority", async ({ page }) => {
  for (const path of [
    "/en/codex/",
    "/en/codex/meet-codex/",
    "/ar/codex/",
    "/ar/codex/automation-capstone/",
  ]) {
    await withIsolatedRoutePage(
      page,
      path,
      async (routePage) => {
        await expect(routePage.locator('meta[name="robots"]'))
          .toHaveAttribute("content", /noindex/i);
      },
      { expectedStatus: 404 },
    );
  }
});

test("Course 2 stays visible but non-linkable on public discovery surfaces", async ({ page }) => {
  for (const path of ["/en/", "/en/courses/", "/en/learning/"]) {
    await withIsolatedRoutePage(page, path, async (routePage) => {
      if (path === "/en/learning/") {
        await expect(routePage.locator(".learning-dashboard"))
          .toHaveAttribute("aria-busy", "false");
      }
      const paths = await routePage.locator('a[href]').evaluateAll((links) => (
        links.map((link) => new URL((link as HTMLAnchorElement).href).pathname)
      ));
      expect(paths.some((href) => href.startsWith("/en/codex/"))).toBe(false);

      if (path === "/en/courses/") {
        const card = routePage.locator('[data-course-id="codex"]');
        await expect(card).toBeVisible();
        await expect(card.locator('.catalog-course-disabled[aria-disabled="true"]'))
          .toBeVisible();
        await expect(card.locator("a[href]")).toHaveCount(0);
      }
    });
  }
});

test("Course 2 stays absent from the public sitemap", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1]);
  expect(locations.length).toBeGreaterThan(0);
  expect(locations.every((url) => !new URL(url).pathname.includes("/codex/")))
    .toBe(true);
});
