import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-contract",
  testMatch: "intentional-safe-failure.spec.ts",
  reporter: [["list"]],
  outputDir: ".playwright-evidence-contract-safe",
  preserveOutput: "never",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [{ name: "safe-contract-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview:test",
    url: "http://127.0.0.1:4173/en/",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
