import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const fallbackPort = Number(process.env.AGENT_EDU_TEST_PORT ?? 4173);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${fallbackPort}`;

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
    baseURL,
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
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run preview:test",
        url: `${baseURL}/en/`,
        reuseExistingServer: false,
        timeout: 30_000,
      },
});
