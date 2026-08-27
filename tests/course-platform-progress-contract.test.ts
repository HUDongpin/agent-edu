import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateProgressContract,
} from "../scripts/check-progress-contract.mjs";
import {
  evaluateCourseFixture,
} from "../scripts/check-course-platform-release.mjs";

test("progress contract fails when a reporting course omits its event and reset import", () => {
  const result = evaluateProgressContract({
    entries: [{
      id: "fixture-course",
      where: "CATALOG_COURSES",
      progress: () => 0,
    }],
    files: [{
      path: "/fixture/components/fixture-course/progress-store.ts",
      text: "export function resetFixtureProgress() { return true; }",
    }],
    resetText: 'import { resetLearningState } from "@/lib/progress";\nresetLearningState("all");',
    storeDirs: ["fixture-course"],
    canonicalProgressText: "export const LEARNING_KEY = 'ae.learning.v2'; createLearningStore(); resetLearningState();",
    hardCodedLegacyKeyLimit: 99,
    root: "/fixture",
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "progress-event-missing"));
  assert.ok(result.issues.some((issue) => issue.code === "progress-reset-store-missing"));
});

test("platform release fixture fails closed when checker, route, SEO, and sitemap evidence are missing", () => {
  const course = {
    id: "fixture-course",
    displayNumber: 1,
    durationMinutes: 45,
    minutes: 45,
    moduleIds: ["intro"],
  };
  const result = evaluateCourseFixture({
    course,
    catalogRecord: { id: "fixture-course", status: "available" },
    availableCount: 1,
    checkerRegistered: false,
    routePresent: false,
    seoPresent: false,
    sitemapPresent: false,
  });

  assert.equal(result.status, "fail");
  assert.equal(result.gates.checker.status, "fail");
  assert.equal(result.gates.routes.status, "fail");
  assert.equal(result.gates.seo.status, "fail");
  assert.equal(result.gates.sitemap.status, "fail");
});
