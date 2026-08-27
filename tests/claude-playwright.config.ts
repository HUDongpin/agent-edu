import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.CLAUDE_BASE_URL;
const port = Number(process.env.CLAUDE_TEST_PORT ?? 3103);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "claude-course.spec.ts",
  outputDir: "../output/playwright/claude-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../output/playwright/claude-report", open: "never" }],
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
        url: `${baseURL}/en/claude/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
