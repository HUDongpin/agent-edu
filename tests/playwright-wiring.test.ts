import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { inspectCoursePlaywrightWiring } from "../scripts/release-gate-wiring.mjs";

const EXPECTED = {
  courseId: "grok",
  specPath: "tests/grok-course.spec.ts",
  configPath: "tests/course-playwright.config.ts",
  port: 3120,
} as const;

test("accepts an isolated course Playwright command with an explicit spec and port", () => {
  const result = inspectCoursePlaywrightWiring(
    "COURSE_TEST_ID=grok COURSE_TEST_PORT=3120 playwright test tests/grok-course.spec.ts --config tests/course-playwright.config.ts",
    EXPECTED,
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("rejects the legacy command that resolves against the e2e-only root config", () => {
  const result = inspectCoursePlaywrightWiring(
    "playwright test tests/grok-course.spec.ts",
    EXPECTED,
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /COURSE_TEST_ID=grok/);
  assert.match(result.errors.join("\n"), /COURSE_TEST_PORT=3120/);
  assert.match(result.errors.join("\n"), /course-playwright\.config\.ts/);
});

test("rejects a command wired to another course or shared port", () => {
  const result = inspectCoursePlaywrightWiring(
    "COURSE_TEST_ID=ai-tutor COURSE_TEST_PORT=3126 playwright test tests/ai-tutor-course.spec.ts --config tests/course-playwright.config.ts",
    EXPECTED,
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /COURSE_TEST_ID=grok/);
  assert.match(result.errors.join("\n"), /COURSE_TEST_PORT=3120/);
  assert.match(result.errors.join("\n"), /tests\/grok-course\.spec\.ts/);
});

test("rejects chained commands even when all required tokens appear", () => {
  const result = inspectCoursePlaywrightWiring(
    "COURSE_TEST_ID=grok COURSE_TEST_PORT=3120 playwright test tests/grok-course.spec.ts --config tests/course-playwright.config.ts ||true",
    EXPECTED,
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /shell control operator/);
});

test("the Codex export wrapper and Playwright config share one external base URL variable", () => {
  const wrapper = readFileSync("scripts/test-codex-export.mjs", "utf8");
  const config = readFileSync("tests/codex-playwright.config.ts", "utf8");

  assert.match(wrapper, /PLAYWRIGHT_BASE_URL:\s*baseURL/);
  assert.match(
    config,
    /process\.env\.CODEX_BASE_URL\s*\?\?\s*process\.env\.PLAYWRIGHT_BASE_URL/,
    "the static wrapper must disable the dev webServer and target its out/ server",
  );
});

test("root safe browser suites use one random-port static-export wrapper", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts?: Record<string, string>;
  };
  const wrapperPath = "scripts/run-static-export-playwright.mjs";

  assert.equal(existsSync(wrapperPath), true, `${wrapperPath} must exist`);
  for (const [scriptName, spec, project] of [
    ["test:smoke:safe", "e2e/smoke.spec.ts", " --project=chromium"],
    ["test:compat:safe", "e2e/compat.spec.ts", ""],
    ["test:resilience:safe", "e2e/resilience.spec.ts", " --project=chromium"],
  ] as const) {
    assert.equal(
      packageJson.scripts?.[scriptName],
      `PLAYWRIGHT_NO_COPY_PROMPT=1 node ${wrapperPath} ${spec}${project}`,
    );
  }

  const wrapper = readFileSync(wrapperPath, "utf8");
  assert.match(wrapper, /server\.listen\(0, HOST/);
  assert.match(wrapper, /OUT_ROOT\s*=\s*join\(ROOT, "out"\)/);
  assert.match(wrapper, /PLAYWRIGHT_BASE_URL:\s*baseURL/);
  assert.match(wrapper, /spawn\([^,]+,[\s\S]*\["playwright", "test"/);
});

test("the shared course preview server serves WebP with its registered media type", () => {
  const server = readFileSync("scripts/serve-out.mjs", "utf8");

  assert.match(server, /"\.webp":\s*"image\/webp"/);
});

test("root Playwright config never reuses an unknown server", () => {
  const config = readFileSync("playwright.config.ts", "utf8");

  assert.match(config, /const externalBaseUrl = process\.env\.PLAYWRIGHT_BASE_URL/);
  assert.match(config, /baseURL,/);
  assert.match(config, /webServer:\s*externalBaseUrl[\s\S]*\?\s*undefined\s*:/);
  assert.match(config, /reuseExistingServer:\s*false/);
  assert.doesNotMatch(config, /reuseExistingServer:\s*!process\.env\.CI/);
});

test("safe smoke evidence classifies the wrapper origin dynamically", () => {
  const smoke = readFileSync("e2e/smoke.spec.ts", "utf8");
  const fixtures = readFileSync("e2e/fixtures.ts", "utf8");

  assert.doesNotMatch(smoke, /http:\/\/127\.0\.0\.1:4173/);
  assert.doesNotMatch(fixtures, /http:\/\/127\.0\.0\.1:4173/);
  assert.match(smoke, /new URL\(baseURL\)\.origin/);
  assert.match(fixtures, /new URL\(baseURL\)\.origin/);
});
