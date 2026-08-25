import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? "3100");
const hostname = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const managedBaseURL = `http://${hostname}:${port}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? managedBaseURL;

export default defineConfig({
  testDir: "./tests",
  outputDir: "output/playwright/test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "output/playwright/report", open: "never" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL ? {} : {
    webServer: {
      command: `npm run dev -- --hostname ${hostname} --port ${port}`,
      url: `${managedBaseURL}/en/codex/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  }),
});
