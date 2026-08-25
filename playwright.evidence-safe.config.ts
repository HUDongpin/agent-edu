import { defineConfig, devices } from "@playwright/test";
import {
  PLAYWRIGHT_TEST_HOME_URL,
  PLAYWRIGHT_TEST_ORIGIN,
} from "./tests/playwright-test-url";

export default defineConfig({
  testDir: "./e2e-contract",
  testMatch: "intentional-safe-failure.spec.ts",
  reporter: [["list"]],
  outputDir: ".playwright-evidence-contract-safe",
  preserveOutput: "never",
  workers: 1,
  use: {
    baseURL: PLAYWRIGHT_TEST_ORIGIN,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [{ name: "safe-contract-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview:test",
    url: PLAYWRIGHT_TEST_HOME_URL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
