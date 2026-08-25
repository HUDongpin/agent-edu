import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.MCP_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.MCP_TEST_PORT ?? 3110);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "mcp-course.spec.ts",
  outputDir: "../output/playwright/mcp-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../output/playwright/mcp-report", open: "never" }],
  ],
  expect: { timeout: 10_000 },
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
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: `${baseURL}/en/mcp/`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
