import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.MATH_ANIMATION_BASE_URL
  ?? process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.MATH_ANIMATION_TEST_PORT ?? 4173);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "math-animation-course.spec.ts",
  outputDir: "../output/playwright/math-animation-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../output/playwright/math-animation-report", open: "never" }],
  ],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-smoke",
      grep: /@browser-smoke/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-smoke",
      grep: /@browser-smoke/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `AGENT_EDU_TEST_PORT=${port} npm run preview:test`,
        url: `${baseURL}/en/math-animation/`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
