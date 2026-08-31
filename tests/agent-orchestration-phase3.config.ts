import { defineConfig, devices } from "@playwright/test";

const origin = process.env.COURSE15_PHASE3_ORIGIN ?? "http://localhost:3015";

export default defineConfig({
  testDir: "..",
  testMatch: ["tests/agent-orchestration-phase3.spec.ts"],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "line",
  outputDir: "../output/playwright/course15-phase3/raw",
  preserveOutput: "never",
  timeout: 240_000,
  expect: { timeout: 12_000 },
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
