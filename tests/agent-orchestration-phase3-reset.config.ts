import { defineConfig, devices } from "@playwright/test";

const origin = process.env.COURSE15_PHASE3_ORIGIN ?? "http://localhost:3015";

export default defineConfig({
  testDir: "..",
  testMatch: ["tests/agent-orchestration-phase3-reset.spec.ts"],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "line",
  outputDir: "../.playwright-phase3-reset-raw",
  preserveOutput: "never",
  timeout: 45_000,
  expect: { timeout: 13_000 },
  use: {
    baseURL: origin,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
