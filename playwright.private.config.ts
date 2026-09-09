import { defineConfig, devices } from "@playwright/test";

// Private Lab/Provider suites are intentionally separate from safe smoke.
// PLAYWRIGHT_NO_COPY_PROMPT=1 disables Playwright's ARIA page snapshot. The
// private reporter discards titles, errors, steps and worker stdio; no raw
// reporter is configured. preserveOutput removes transient error-context files
// instead of making them uploadable diagnostics.
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["lab-private-state.spec.ts", "lab-provider-contract.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["./e2e/private-reporter.ts"]],
  outputDir: ".playwright-private",
  preserveOutput: "never",
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
  /* All three engines, because the thing these suites exercise is storage.
     lib/byok/key-store.ts writes the reader's key to sessionStorage and reads
     it straight back, treating a value that did not stick as no key at all;
     that guard is written for Safari's private mode, and WebKit was the one
     engine it never ran in. The draft and the progress record are the same
     shape of bet on localStorage. Neither suite uses CDP or branches on
     browserName, so the only thing that was missing was the projects. */
  projects: [
    { name: "private-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "private-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "private-webkit", use: { ...devices["Desktop Safari"] } },
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
