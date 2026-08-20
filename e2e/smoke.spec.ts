import { expect, test } from "@playwright/test";

test("static home → Handbook → Lab journey stays local", async ({ page }) => {
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
    if (origin !== "http://127.0.0.1:4173" && origin !== "https://api.deepseek.com") {
      unexpectedOrigins.add(origin);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("h1")).toHaveCount(1);

  await page.locator('a[href="/en/handbook/"]').first().click();
  await expect(page).toHaveURL(/\/en\/handbook\/$/);
  await expect(page.locator("h1")).toHaveCount(1);

  await page.locator('a[href="/en/lab/"]').first().click();
  await expect(page).toHaveURL(/\/en\/lab\/$/);
  await expect(page.locator("h1")).toHaveCount(1);

  expect(providerRequests, "navigation must not make a paid Provider request").toEqual([]);
  expect([...unexpectedOrigins], "all network origins must be allow-listed").toEqual([]);
  expect(pageErrors, "page errors").toEqual([]);
  expect(consoleErrors, "console errors").toEqual([]);
});
