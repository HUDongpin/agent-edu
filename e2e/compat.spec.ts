import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const STATIC_PATHS = [
  { path: "/en/", marker: "#curriculum" },
  { path: "/en/handbook/", marker: "#rail" },
  { path: "/en/lab/", marker: ".shellwrap.lab .labhero" },
  { path: "/en/build/", marker: ".build-page .build-steps" },
] as const;

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
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
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await expectNoHorizontalOverflow(page);
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
  await expect(page.locator(".recovery404-grid li")).toHaveCount(9);
  await expect(page.locator(".recovery404-missing")).toHaveCount(9);
  await expect(page.locator('a[href="/ar/courses/"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
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

/* The reviewed policy, read from the file the checker treats as canonical, so
   this test cannot drift from what vercel.json actually ships. */
const CSP_POLICY = (
  JSON.parse(
    readFileSync(new URL("../config/csp-stage.json", import.meta.url), "utf8"),
  ) as { policy: string }
).policy;

const CSP_PATHS = [
  "/en/",
  "/en/handbook/",
  "/en/lab/",
  "/en/courses/",
  "/en/about/",
  "/en/build/",
  "/en/teach/",
  "/ar/handbook/",
] as const;

test("the reviewed CSP is survivable, and is doing something", async ({ page }) => {
  // Vercel sets the header; serve-out.mjs does not. Applying it to the main
  // document here tests the policy against the pages as built, so a CDN script
  // or an off-origin image added later fails in CI rather than in a reader's
  // browser — which is the only place a report-only header with no reporting
  // endpoint would ever have shown it.
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") return route.fallback();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), "content-security-policy": CSP_POLICY },
    });
  });

  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __cspViolations: string[] }).__cspViolations = seen;
    document.addEventListener("securitypolicyviolation", (event) => {
      const violation = event as SecurityPolicyViolationEvent;
      seen.push(`${violation.effectiveDirective} blocked ${violation.blockedURI}`);
    });
  });

  for (const path of CSP_PATHS) {
    await test.step(path, async () => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} must be a static 200`).toBe(200);
      await page.waitForLoadState("networkidle");
      const violations = await page.evaluate(
        () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
      );
      expect(violations, `${path} must raise no CSP violation`).toEqual([]);
    });
  }

  // A policy that blocks nothing would pass the loop above whether or not the
  // header arrived at all, so prove it is live: an origin the policy does not
  // name must be refused, and the Provider it does name must not be.
  const offOrigin = await page.evaluate(async () => {
    try {
      await fetch("https://example.com/probe", { mode: "no-cors" });
      return "allowed";
    } catch {
      return "blocked";
    }
  });
  expect(offOrigin, "connect-src must refuse an origin the policy does not name").toBe("blocked");

  const violationsAfterProbe = await page.evaluate(
    () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
  );
  expect(violationsAfterProbe.join(" ")).toContain("connect-src");

  // The other half of the same claim, and the one the Lab depends on: the
  // Provider the policy names must still be reachable. Mocked explicitly, both
  // because the fixture blocks the paid service by default and because what is
  // being measured here is CSP, not the network.
  await page.route("https://api.deepseek.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "{}",
  }));
  await page.evaluate(async () => {
    try {
      await fetch("https://api.deepseek.com/models");
    } catch {
      /* a transport failure is not what this asserts */
    }
  });
  const afterProvider = await page.evaluate(
    () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
  );
  expect(
    afterProvider.filter((entry) => entry.includes("deepseek")),
    "connect-src must still permit the Provider the Lab calls",
  ).toEqual([]);
});
