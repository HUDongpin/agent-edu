import { defineConfig, devices } from "@playwright/test";

// This is an allowlist, not a broad course-spec glob. A blocked course cannot
// enter the release browser gate merely by gaining or renaming a test file.
const publishedTestFiles = [
  "e2e/published-courses.spec.ts",
  "e2e/published-course-contracts.spec.ts",
  "tests/ai-tutor-course.spec.ts",
  "tests/claude-income-course.spec.ts",
  "tests/github-course.spec.ts",
  "tests/grok-course.spec.ts",
  "tests/mcp-course.spec.ts",
  "tests/prompts-course.spec.ts",
  "tests/rag-course.spec.ts",
  "tests/software-engineering-course.spec.ts",
] as const;

export default defineConfig({
  testDir: "..",
  testMatch: [...publishedTestFiles],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  expect: { timeout: 10_000 },
  // Automatic Playwright media can capture learner or Provider state. The
  // shared e2e fixture emits only its deliberately sanitized failure bundle.
  reporter: [["list"]],
  outputDir: "../.playwright-raw",
  preserveOutput: "never",
  use: {
    baseURL: "http://127.0.0.1:4173",
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
    url: "http://127.0.0.1:4173/en/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
