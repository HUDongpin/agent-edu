import { defineConfig, devices } from "@playwright/test";
import {
  PLAYWRIGHT_TEST_HOME_URL,
  PLAYWRIGHT_TEST_ORIGIN,
} from "./tests/playwright-test-url";

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
    baseURL: PLAYWRIGHT_TEST_ORIGIN,
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
    url: PLAYWRIGHT_TEST_HOME_URL,
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
