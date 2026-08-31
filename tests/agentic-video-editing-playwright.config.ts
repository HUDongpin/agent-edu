import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const port = Number(process.env.AGENTIC_VIDEO_EDITING_PLAYWRIGHT_PORT ?? "4174");
const hostname = process.env.AGENTIC_VIDEO_EDITING_PLAYWRIGHT_HOST ?? "127.0.0.1";
const managedBaseURL = `http://${hostname}:${port}`;
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const releaseManifest = JSON.parse(readFileSync(
  new URL("../config/course-release-manifest.json", import.meta.url),
  "utf8",
)) as {
  courses?: { id?: string; state?: string }[];
};
const course20State = releaseManifest.courses?.find(
  (course) => course.id === "agentic-video-editing",
)?.state;

if (course20State !== "blocked" && course20State !== "published") {
  throw new Error(
    `Course 20 browser gate requires a blocked or published registry state; received ${String(course20State)}`,
  );
}

const blocked = course20State === "blocked";
const readinessPath = blocked ? "/en/courses/" : "/en/agentic-video-editing/";

export default defineConfig({
  testDir: ".",
  testMatch: blocked
    ? "agentic-video-editing-blocked.spec.ts"
    : "agentic-video-editing-course.spec.ts",
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
    url: `${managedBaseURL}${readinessPath}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
