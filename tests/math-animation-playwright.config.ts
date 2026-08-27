import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.MATH_ANIMATION_BASE_URL
  ?? process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.MATH_ANIMATION_TEST_PORT ?? 4173);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "math-animation-course.spec.ts",
  outputDir: "../.playwright-raw/math-animation",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
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
