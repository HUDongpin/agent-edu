import { defineConfig, devices } from "@playwright/test";

const COURSE_IDS = [
  "grok",
  "prompts",
  "github",
  "software-engineering",
  "rag",
  "claude-income",
  "ai-tutor",
] as const;

type CourseId = (typeof COURSE_IDS)[number];

const requestedCourse = process.env.COURSE_TEST_ID?.trim();

if (!COURSE_IDS.includes(requestedCourse as CourseId)) {
  throw new Error(
    `COURSE_TEST_ID must be one of ${COURSE_IDS.join(", ")}; received ${requestedCourse ?? "<unset>"}`,
  );
}

const courseId = requestedCourse as CourseId;
const externalBaseUrl =
  process.env.COURSE_TEST_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.COURSE_TEST_PORT);

if (!externalBaseUrl && (!Number.isInteger(port) || port < 1 || port > 65_535)) {
  throw new Error(
    `COURSE_TEST_PORT must be a valid TCP port when no external base URL is configured; received ${process.env.COURSE_TEST_PORT ?? "<unset>"}`,
  );
}

const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

/**
 * Browser contract for the legacy top-level course specs under tests/.
 *
 * The repository root config deliberately owns e2e/ only. Keeping this
 * separate prevents a broad testDir from silently collecting Node tests while
 * preserving the original Chromium/Firefox/WebKit coverage of these scripts.
 * Each package script supplies a distinct port so independently invoked suites
 * never attach to a different course's local server.
 */
export default defineConfig({
  testDir: ".",
  testMatch: `${courseId}-course.spec.ts`,
  outputDir: `../output/playwright/${courseId}-results`,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
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
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `AGENT_EDU_TEST_PORT=${port} npm run preview:test`,
        url: `${baseURL}/en/${courseId}/`,
        reuseExistingServer: false,
        timeout: 30_000,
      },
});
