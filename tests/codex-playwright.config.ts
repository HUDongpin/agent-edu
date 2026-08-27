import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.CODEX_BASE_URL
  ?? process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.CODEX_TEST_PORT ?? 3102);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "codex-course.spec.ts",
  outputDir: "../output/playwright/codex-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: `${baseURL}/en/codex/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
