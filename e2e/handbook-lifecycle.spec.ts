import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { PLAYWRIGHT_TEST_ORIGIN } from "../tests/playwright-test-url";

declare global {
  interface Window {
    __globalListenerSummary?: () => Record<string, number>;
  }
}

const BASE_URL = process.env.HANDBOOK_TEST_BASE_URL ?? PLAYWRIGHT_TEST_ORIGIN;

async function installGlobalListenerProbe(page: Page) {
  await page.addInitScript(() => {
    type Tracked = {
      target: EventTarget;
      type: string;
      listener: EventListenerOrEventListenerObject | null;
      capture: boolean;
    };
    const active: Tracked[] = [];
    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;
    const capture = (options?: boolean | AddEventListenerOptions | EventListenerOptions) =>
      typeof options === "boolean" ? options : Boolean(options?.capture);
    const watched = (target: EventTarget) =>
      target === window
      || target === document
      || (typeof MediaQueryList !== "undefined" && target instanceof MediaQueryList);

    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (watched(this)) {
        const useCapture = capture(options);
        if (!active.some((entry) =>
          entry.target === this
          && entry.type === type
          && entry.listener === listener
          && entry.capture === useCapture)) {
          active.push({ target: this, type, listener, capture: useCapture });
        }
      }
      return originalAdd.call(this, type, listener as EventListenerOrEventListenerObject, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) {
      if (watched(this)) {
        const useCapture = capture(options);
        const index = active.findIndex((entry) =>
          entry.target === this
          && entry.type === type
          && entry.listener === listener
          && entry.capture === useCapture);
        if (index >= 0) active.splice(index, 1);
      }
      return originalRemove.call(this, type, listener as EventListenerOrEventListenerObject, options);
    };

    window.__globalListenerSummary = () => {
      const summary: Record<string, number> = {};
      for (const entry of active) {
        const owner = entry.target === window
          ? "window"
          : entry.target === document ? "document" : "media";
        const key = `${owner}:${entry.type}`;
        summary[key] = (summary[key] ?? 0) + 1;
      }
      return summary;
    };
  });
}

async function globalListenerSummary(page: Page) {
  return page.evaluate(() => {
    if (!window.__globalListenerSummary) throw new Error("global listener probe was not installed");
    return window.__globalListenerSummary();
  });
}

test("leaving the Handbook removes its global effects", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  await page.route("**/_vercel/insights/script.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const handbook = await page.goto(`${BASE_URL}/en/handbook/#security`);
  expect(handbook?.status()).toBe(200);
  await expect(page.locator("#p-security")).toBeVisible();
  await expect(page.locator(".hb .recall"), "generated recall cards are not duplicated").toHaveCount(7);
  await expect(page.locator(".hb .deps"), "generated dependency bars are not duplicated").toHaveCount(8);

  await page.locator('header.topbar a[href="/en/lab/"]').click();
  await expect(page).toHaveURL(/\/en\/lab\/$/);
  await expect(page.locator(".shellwrap.lab .labhero")).toBeVisible();

  await page.evaluate(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("focus"));
  });
  await page.waitForTimeout(250);

  await expect(page).toHaveURL(/\/en\/lab\/$/);
  const ownedGlobals = await page.evaluate(() => ({
    paintProgress: "__paintProgress" in window,
    show: "__show" in window,
  }));
  expect(ownedGlobals).toEqual({ paintProgress: false, show: false });
  expect(pageErrors, "stale Handbook callbacks must not touch the Lab DOM").toEqual([]);
  expect(consoleErrors, "route exit must not log stale Handbook errors").toEqual([]);
});

test("client-side locale changes replace the Handbook lifetime instead of stacking it", async ({ page }) => {
  const pageErrors: string[] = [];
  await installGlobalListenerProbe(page);
  await page.route("**/_vercel/insights/script.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const handbook = await page.goto(`${BASE_URL}/en/handbook/#context`);
  expect(handbook?.status()).toBe(200);
  await expect(page.locator("#p-context")).toBeVisible();
  const initialListeners = await globalListenerSummary(page);

  await page.locator('.topacts button[aria-haspopup="menu"]').click();
  await page.locator('.langmenu [role="menuitem"][lang="es"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveURL(/\/es\/handbook\/#context$/);
  await expect(page.locator("#p-context")).toBeVisible();
  await expect(page.locator(".hb .recall")).toHaveCount(7);
  await expect(page.locator(".hb .deps")).toHaveCount(8);

  await expect.poll(() => globalListenerSummary(page), {
    message: "a locale replacement must leave one global Handbook listener set",
  }).toEqual(initialListeners);
  expect(pageErrors).toEqual([]);
});

test("the static Handbook stays readable and navigable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    const handbook = await page.goto("/en/handbook/#security");
    expect(handbook?.status()).toBe(200);
    await expect(page).toHaveURL(/\/en\/handbook\/#security$/);

    const panels = page.locator(".hb .panel");
    await expect(panels).toHaveCount(11);
    for (let index = 0; index < 11; index += 1) {
      await expect(panels.nth(index), `panel ${index} remains readable`).toBeVisible();
    }
    await expect(page.locator("#p-security")).toBeVisible();

    const navigation = page.getByRole("navigation", { name: "Menu" });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link").first()).toBeVisible();
  } finally {
    await context.close();
  }
});
