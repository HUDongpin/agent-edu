import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const port = Number(process.env.AGENTIC_VIDEO_EDITING_PLAYWRIGHT_PORT ?? "4174");
const hostname = process.env.AGENTIC_VIDEO_EDITING_PLAYWRIGHT_HOST ?? "127.0.0.1";
const managedBaseURL = `http://${hostname}:${port}`;
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  testDir: ".",
  testMatch: "agentic-video-editing-course.spec.ts",
  outputDir: "../output/playwright/agentic-video-editing-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../output/playwright/agentic-video-editing-report", open: "never" }],
  ],
  use: {
    baseURL: managedBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "node scripts/serve-agentic-video-editing-static.mjs",
    cwd: projectRoot,
    url: `${managedBaseURL}/en/agentic-video-editing/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
