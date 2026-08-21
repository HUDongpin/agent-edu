import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
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
