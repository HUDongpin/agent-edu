import { defineConfig, devices } from "@playwright/test";
import {
  PLAYWRIGHT_TEST_HOME_URL,
  PLAYWRIGHT_TEST_ORIGIN,
  PLAYWRIGHT_TEST_PORT,
} from "./playwright-test-url";

const externalBaseURL = process.env.CODEX_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? PLAYWRIGHT_TEST_ORIGIN;
const localPrepublication = externalBaseURL === undefined;
const previewHeaders = {
  "x-aicourse-prepublication-course": "codex",
};

export default defineConfig({
  testDir: ".",
  testMatch: [
    "codex-course.spec.ts",
    "codex-blocked-surface.spec.ts",
  ],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  globalSetup: "../scripts/prepare-browser-evidence.mjs",
  reporter: [["../e2e/curated-evidence-reporter.ts"]],
  outputDir: "../.playwright-raw",
  preserveOutput: "never",
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    ...(localPrepublication
      ? [{
          name: "safe-contract-chromium",
          testMatch: "codex-blocked-surface.spec.ts",
          use: { ...devices["Desktop Chrome"] },
        }]
      : []),
    {
      name: "chromium",
      testMatch: "codex-course.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        ...(localPrepublication ? { extraHTTPHeaders: previewHeaders } : {}),
      },
    },
    {
      name: "firefox",
      testMatch: "codex-course.spec.ts",
      use: {
        ...devices["Desktop Firefox"],
        ...(localPrepublication ? { extraHTTPHeaders: previewHeaders } : {}),
      },
    },
    {
      name: "webkit",
      testMatch: "codex-course.spec.ts",
      use: {
        ...devices["Desktop Safari"],
        ...(localPrepublication ? { extraHTTPHeaders: previewHeaders } : {}),
      },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        // Next 16.3.1 has a Turbopack header-rewrite HMR incompatibility that
        // panics on the virtual /[locale]/codex endpoint. Scope the supported
        // Webpack dev fallback to this loopback-only prepublication harness;
        // normal development and production/static-export builds are unchanged.
        command: `npm run dev -- --webpack --hostname 127.0.0.1 --port ${PLAYWRIGHT_TEST_PORT}`,
        url: PLAYWRIGHT_TEST_HOME_URL,
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "ignore",
        env: {
          AICOURSE_PREPUBLICATION_COURSE: "codex",
        },
      },
});
