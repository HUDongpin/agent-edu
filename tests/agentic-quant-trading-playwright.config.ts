import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "agentic-quant-trading-ui.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  outputDir: "../.playwright-raw/course17",
  preserveOutput: "always",
  use: {
    baseURL: "http://localhost:3107",
    ...devices["Desktop Chrome"],
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "npm run dev -- --port 3107",
    url: "http://localhost:3107/zh-Hans/agentic-quant-trading/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
