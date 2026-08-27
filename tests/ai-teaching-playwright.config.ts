import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl =
  process.env.AI_TEACHING_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.AI_TEACHING_TEST_PORT ?? 3118);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "ai-teaching-course.spec.ts",
  outputDir: "../output/playwright/ai-teaching-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `node --import tsx scripts/serve-static-export.mjs --host 127.0.0.1 --port ${port}`,
        cwd: "..",
        url: `${baseURL}/en/ai-teaching/`,
        reuseExistingServer: false,
        timeout: 30_000,
      },
});
