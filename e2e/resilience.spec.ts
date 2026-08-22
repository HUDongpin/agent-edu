import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const CONSTRAINED_PROFILE = {
  latencyMs: 150,
  downloadBytesPerSecond: 187_500,
  uploadBytesPerSecond: 75_000,
  cpuSlowdown: 4,
} as const;

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

test("the no-key learning path remains operable under a declared constrained profile", async ({
  browserName,
  context,
  page,
}) => {
  test.skip(browserName !== "chromium", "CDP CPU/network emulation is Chromium-specific lab evidence.");

  const providerRequests: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 2 });
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 2 });
  });
  await page.route("https://api.deepseek.com/**", async (route) => {
    providerRequests.push(route.request().url());
    await route.abort("blockedbyclient");
  });
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: "",
  }));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: CONSTRAINED_PROFILE.latencyMs,
    downloadThroughput: CONSTRAINED_PROFILE.downloadBytesPerSecond,
    uploadThroughput: CONSTRAINED_PROFILE.uploadBytesPerSecond,
    connectionType: "cellular3g",
  });
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: CONSTRAINED_PROFILE.cpuSlowdown,
  });

  const handbookResponse = await page.goto("/en/handbook/#start");
  expect(handbookResponse?.status()).toBe(200);
  await expect(page.locator("#rail")).toHaveAttribute("aria-orientation", "horizontal");
  await page.locator("#tab-play").click();
  await expect(page.locator("#tab-play")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#p-play")).toHaveClass(/\bon\b/);
  await expectNoHorizontalOverflow(page);

  // Once the scripted Handbook is loaded, its core interaction remains local
  // when the connection disappears. This does not claim uncached navigation
  // or the paid Lab works offline.
  await cdp.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
    connectionType: "none",
  });
  await page.locator("#tab-security").click();
  await expect(page.locator("#tab-security")).toHaveAttribute("aria-selected", "true");
  await page.locator("#secNone").click();
  await page.locator("#secRun").click();
  await expect(page.locator("#secVerdict")).toContainText(/taken over by an email/i);

  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: CONSTRAINED_PROFILE.latencyMs,
    downloadThroughput: CONSTRAINED_PROFILE.downloadBytesPerSecond,
    uploadThroughput: CONSTRAINED_PROFILE.uploadBytesPerSecond,
    connectionType: "cellular3g",
  });
  const labResponse = await page.goto("/en/lab/");
  expect(labResponse?.status()).toBe(200);
  await page.locator('.steps [role="tab"]').nth(1).click();
  await expect(page.locator("#labpanel h2")).toContainText("The kiosk that can't");
  await expect(page.locator("#labpanel")).toContainText("costs nothing");
  await expectNoHorizontalOverflow(page);

  const buildResponse = await page.goto("/en/build/");
  expect(buildResponse?.status()).toBe(200);
  await expect(page.locator(".build-page .build-steps")).toBeVisible();
  await expect(page.locator("pre").filter({ hasText: "npm run course:offline" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  expect(providerRequests, "the no-key constrained path must make no Provider request").toEqual([]);
  expect(pageErrors).toEqual([]);
  const unexpectedConsoleErrors = consoleErrors.filter(
    (message) => !message.includes("net::ERR_INTERNET_DISCONNECTED"),
  );
  expect(unexpectedConsoleErrors).toEqual([]);
});
