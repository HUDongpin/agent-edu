import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // WebKit crashes in CI — "page.goto: WebKit encountered an internal error",
  // twice in one day, once failing a documentation-only change. A browser that
  // dies mid-navigation should cost a retry, not a red main. Locally it stays
  // at 0, where a flake is worth seeing. The private suite got the same
  // treatment; the evidence-safe config deliberately did not, because it drives
  // intentional failures whose attempt count is the contract.
  //
  // A failed attempt still writes its curated bundle (e2e/fixtures.ts), so a
  // retried-then-passed run can leave one behind. It is neither scanned nor
  // uploaded — both steps run only when the job fails — and the runner discards
  // it with the workspace.
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // Browser evidence is produced by e2e/fixtures.ts as a deliberately small,
  // sanitized bundle. Playwright's raw HTML/file reporters and automatic
  // media can contain page text, form values, headers, and request bodies.
  reporter: [["list"]],
  outputDir: ".playwright-raw",
  preserveOutput: "never",
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run preview:test",
    url: "http://127.0.0.1:4173/en/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
