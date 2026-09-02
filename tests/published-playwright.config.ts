import { defineConfig, devices } from "@playwright/test";
import {
  PLAYWRIGHT_TEST_HOME_URL,
  PLAYWRIGHT_TEST_ORIGIN,
} from "./playwright-test-url";

// This is an allowlist, not a broad course-spec glob. A blocked course cannot
// enter the release browser gate merely by gaining or renaming a test file.
const publishedTestFiles = [
  "e2e/published-courses.spec.ts",
  "e2e/published-course-contracts.spec.ts",
  "e2e/catalog-language.spec.ts",
  "e2e/platform-learning-shell.spec.ts",
  "tests/agent-orchestration-course.spec.ts",
  "tests/agent-orchestration-phase2.spec.ts",
  "tests/agent-orchestration-phase3.spec.ts",
  "tests/agent-orchestration-phase3-reset.spec.ts",
  "tests/ai-tutor-course.spec.ts",
  "tests/claude-income-course.spec.ts",
  "tests/github-course.spec.ts",
  "tests/grok-course.spec.ts",
  "tests/mcp-course.spec.ts",
  "tests/product-management-course.spec.ts",
  "tests/prompts-course.spec.ts",
  "tests/rag-course.spec.ts",
  "tests/software-engineering-course.spec.ts",
] as const;

export default defineConfig({
  testDir: "..",
  testMatch: [...publishedTestFiles],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  /* One WebKit `page.goto` internal error anywhere in 1,066 tests fails a
     30-minute serial run of three engines. The crashing test differs every
     time — github+prompts one run, mcp+rag the next — which is a browser
     crash, not a product failure. Retry in CI and let Playwright report the
     test as flaky instead of failing the job. */
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  globalSetup: "../scripts/prepare-browser-evidence.mjs",
  expect: { timeout: 10_000 },
  // Automatic Playwright media can capture learner or Provider state. The
  // shared fixture and reporter fallback emit only the closed curated bundle.
  reporter: [["../e2e/curated-evidence-reporter.ts"]],
  outputDir: "../.playwright-raw",
  preserveOutput: "never",
  use: {
    baseURL: PLAYWRIGHT_TEST_ORIGIN,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run preview:test",
    url: PLAYWRIGHT_TEST_HOME_URL,
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
