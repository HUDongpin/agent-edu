import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { resolvePlaywrightTestPort } from "./playwright-test-url";

const PORT_AWARE_CONFIGS = [
  "playwright.config.ts",
  "playwright.private.config.ts",
  "playwright.evidence-safe.config.ts",
  "playwright.evidence-private.config.ts",
  "tests/published-playwright.config.ts",
] as const;

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

test("the shared Playwright port parser is strict and bounded", () => {
  assert.equal(resolvePlaywrightTestPort(undefined), 4173);
  assert.equal(resolvePlaywrightTestPort("1"), 1);
  assert.equal(resolvePlaywrightTestPort("42731"), 42731);
  assert.equal(resolvePlaywrightTestPort("65535"), 65535);

  for (const invalid of ["", "0", "01", "4173 ", " 4173", "+4173", "65536", "abc"]) {
    assert.throws(
      () => resolvePlaywrightTestPort(invalid),
      /AGENT_EDU_TEST_PORT must be an integer between 1 and 65535/,
    );
  }
});

test("every release Playwright config derives its server and browser URL from one helper", () => {
  for (const path of PORT_AWARE_CONFIGS) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /PLAYWRIGHT_TEST_ORIGIN/);
    assert.match(source, /PLAYWRIGHT_TEST_HOME_URL/);
    assert.match(source, /baseURL: PLAYWRIGHT_TEST_ORIGIN/);
    assert.match(source, /url: PLAYWRIGHT_TEST_HOME_URL/);
    assert.match(source, /reuseExistingServer: false/);
  }
});

test("Playwright contracts cannot silently reintroduce the default localhost literal", () => {
  const forbiddenOrigin = ["http://127.0.0.1", ":4173"].join("");
  const candidates = [
    ...typescriptFiles("e2e"),
    ...typescriptFiles("tests"),
    ...readdirSync(".").filter((name) => /^playwright(?:\..+)?\.config\.ts$/.test(name)),
  ];

  for (const path of candidates) {
    if (path === "tests/playwright-test-url.ts") continue;
    assert.equal(
      readFileSync(path, "utf8").includes(forbiddenOrigin),
      false,
      `${path} must use PLAYWRIGHT_TEST_ORIGIN instead of a hard-coded default`,
    );
  }
});

test("the static preview server emits browser-safe media types and keeps unknown files inert", () => {
  const source = readFileSync("scripts/serve-out.mjs", "utf8");
  for (const [extension, mediaType] of [
    [".avif", "image/avif"],
    [".jpg", "image/jpeg"],
    [".png", "image/png"],
    [".webp", "image/webp"],
    [".woff2", "font/woff2"],
    [".zip", "application/zip"],
  ] as const) {
    assert.match(source, new RegExp(`"${extension.replace(".", "\\.")}":\\s*"${mediaType}"`));
  }
  assert.match(source, /TYPES\[extname\(body\)\]\s*\?\?\s*"application\/octet-stream"/);
});

test("safe smoke follows the current accessible home surface", () => {
  const source = readFileSync("e2e/smoke.spec.ts", "utf8");
  assert.match(source, /"": "\.platform-home #home-title"/);
  assert.match(source, /\.platform-hero a\[href=/);
  assert.match(source, /\[data-course-lesson-nav\] a\[rel="next"\]/);
  assert.doesNotMatch(source, /#curriculum|main \.hero/);
  assert.doesNotMatch(source, /header\.topbar a\[href=.*\/lab\//);
});
