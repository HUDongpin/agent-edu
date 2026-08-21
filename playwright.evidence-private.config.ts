import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-contract",
  testMatch: [
    "intentional-private-failure.spec.ts",
    "intentional-private-timeout.spec.ts",
  ],
  reporter: [["./e2e/private-reporter.ts"]],
  outputDir: ".playwright-evidence-contract-private",
  preserveOutput: "never",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "off",
    trace: {
      mode: "off",
      screenshots: false,
      snapshots: false,
      sources: false,
      attachments: false,
    },
    video: "off",
  },
  projects: [{ name: "private-contract-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview:test",
    url: "http://127.0.0.1:4173/en/",
    reuseExistingServer: true,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
