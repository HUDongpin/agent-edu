import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl =
  process.env.COURSE_KIT_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.COURSE_KIT_TEST_PORT ?? 3111);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "course-kit-courses.spec.ts",
  outputDir: "../output/playwright/course-kit-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "../output/playwright/course-kit-report",
        open: "never",
      },
    ],
  ],
  expect: { timeout: 12_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-smoke",
      grep: /@engine-smoke/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-smoke",
      grep: /@engine-smoke/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `AGENT_EDU_TEST_PORT=${port} npm run preview:test`,
        url: `${baseURL}/en/responsible-ai/`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
