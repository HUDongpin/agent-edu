import { expect, test as base } from "@playwright/test";

/**
 * Every browser test starts with the paid Provider blocked. Tests that need a
 * Provider response must register a narrower route explicitly; Playwright runs
 * the most recently registered matching route first. This makes an omitted
 * mock fail closed instead of reaching the live service.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    let unmockedProviderRequests = 0;
    await page.route("https://api.deepseek.com/**", (route) => {
      unmockedProviderRequests += 1;
      return route.abort("blockedbyclient");
    });
    await use(page);
    expect(
      unmockedProviderRequests,
      "every Provider request must be handled by an explicit test mock",
    ).toBe(0);
  },
});

export { expect };
