import { expect, test as base } from "@playwright/test";

/**
 * Private suites deliberately do not import the curated-evidence fixture.
 * Provider access is still fail-closed. Raw media is disabled, the private
 * reporter never renders errors or worker output, and the process wrapper
 * captures that reporter boundary before emitting a fixed summary.
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
      unmockedProviderRequests === 0,
      "every Provider request must be handled by an explicit test mock",
    ).toBe(true);
  },
});

export { expect };
