import assert from "node:assert/strict";
import test from "node:test";

import { inspectReleaseGateWiring } from "../scripts/release-gate-wiring.mjs";

test("accepts a direct course gate before next build", () => {
  const result = inspectReleaseGateWiring({
    build: "npm run course:check:release && next build",
    "course:check:release": "node scripts/check-course.mjs --release",
  }, "build", "course:check:release");
  assert.equal(result.releaseBeforeBuild, true);
});

test("accepts an executable unified gate through nested build scripts", () => {
  const scripts = {
    build: "npm run course-platform:check && next build && npm run course:static-check",
    "build:release": "npm run build && npm run course-platform:check:release",
    "course-platform:check": "node scripts/check-course-platform-release.mjs --local",
    "course-platform:check:release": "node scripts/check-course-platform-release.mjs",
    "course:static-check": "node scripts/check-course-static.mjs",
  };
  const result = inspectReleaseGateWiring(
    scripts,
    "build:release",
    "course:check:release",
    "course:static-check",
  );
  assert.equal(result.releaseBeforeBuild, true);
  assert.equal(result.staticAfterBuild, true);
});

test("rejects a release gate that only runs after next build", () => {
  const result = inspectReleaseGateWiring({
    build: "next build && npm run course:check:release",
    "course:check:release": "node scripts/check-course.mjs --release",
  }, "build", "course:check:release");
  assert.equal(result.releaseBeforeBuild, false);
});

test("does not treat a structural-only platform scan as checker execution", () => {
  const result = inspectReleaseGateWiring({
    build: "npm run course-platform:scan && next build",
    "course-platform:scan": "node scripts/check-course-platform-release.mjs --structural-only",
  }, "build", "course:check:release");
  assert.equal(result.releaseBeforeBuild, false);
});

test("rejects a static-output gate that runs before next build", () => {
  const result = inspectReleaseGateWiring({
    build: "npm run course:check:release && npm run course:static-check && next build",
    "course:check:release": "node scripts/check-course.mjs --release",
    "course:static-check": "node scripts/check-course-static.mjs",
  }, "build", "course:check:release", "course:static-check");
  assert.equal(result.staticAfterBuild, false);
});
