import { defineConfig, devices } from "@playwright/test";
import {
  PLAYWRIGHT_TEST_HOME_URL,
  PLAYWRIGHT_TEST_ORIGIN,
} from "./tests/playwright-test-url";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  globalSetup: "./scripts/prepare-browser-evidence.mjs",
  // Browser evidence is produced by e2e/fixtures.ts as a deliberately small,
  // sanitized bundle. Playwright's raw HTML/file reporters and automatic
  // media can contain page text, form values, headers, and request bodies.
  reporter: [["./e2e/curated-evidence-reporter.ts"]],
  outputDir: ".playwright-raw",
  preserveOutput: "never",
  use: {
    baseURL: PLAYWRIGHT_TEST_ORIGIN,
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
      /* The serial compatibility gate has produced a different one-off WebKit
         failure on successive CI runs, while each exact test and the complete
         suite pass under local repetition. Keep retries disabled locally so a
         flake stays visible during development; in CI, two retries still make a
         deterministic product failure fail after three attempts. */
      retries: process.env.CI ? 2 : 0,
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run preview:test",
    url: PLAYWRIGHT_TEST_HOME_URL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
