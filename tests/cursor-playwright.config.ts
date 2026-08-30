import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.CURSOR_BASE_URL;
const port = Number(process.env.CURSOR_TEST_PORT ?? 3100);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "cursor-course.spec.ts",
  outputDir: "../output/playwright/cursor-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../output/playwright/cursor-report", open: "never" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: `${baseURL}/en/cursor/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
