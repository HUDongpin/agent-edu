import { expect, test as base } from "@playwright/test";

/**
 * Every browser test starts with the paid Provider blocked. Tests that need a
 * Provider response must register a narrower route explicitly; Playwright runs
 * the most recently registered matching route first. This makes an omitted
 * mock fail closed instead of reaching the live service.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("https://api.deepseek.com/**", (route) =>
      route.abort("blockedbyclient"),
    );
    await use(page);
  },
});

export { expect };
