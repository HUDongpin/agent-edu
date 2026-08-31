import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertExactCourseIdSet,
  registryOrderedCourseRecords,
} from "../lib/course-collection-contract";
import {
  CATALOG_COURSES,
  TOP_LEVEL_COURSES,
} from "../lib/courses";
import {
  CATALOG_COURSE_RELEASES as PUBLIC_CATALOG_COURSE_RELEASES,
} from "../lib/public-courses";
import {
  PUBLIC_COURSE_IDS,
  PUBLIC_COURSE_SURFACES,
} from "../lib/public-release-surface";
import { COURSE_IDS, COURSE_RELEASE_SURFACES } from "../lib/release-surface";
import { validateCourseReleaseManifest } from "../scripts/sync-course-public-surface.mjs";

function assertExactIds(expected: readonly string[], actual: readonly string[]): void {
  assert.equal(new Set(actual).size, actual.length, "course ids must be unique");
  assert.deepEqual([...actual].sort(), [...expected].sort());
}

test("course collection contracts reject duplicate, missing, and extra ids", () => {
  assert.throws(
    () => assertExactCourseIdSet(["agentic", "grok"], ["agentic", "agentic"], "fixture"),
    /fixture contains duplicate course ids: agentic/,
  );
  assert.throws(
    () => assertExactCourseIdSet(["agentic", "grok"], ["agentic"], "fixture"),
    /fixture must match the course registry exactly \(missing: grok\)/,
  );
  assert.throws(
    () => assertExactCourseIdSet(["agentic"], ["agentic", "grok"], "fixture"),
    /fixture must match the course registry exactly \(extra: grok\)/,
  );
  assert.throws(
    () => assertExactCourseIdSet(["agentic", "agentic"], ["agentic"], "fixture"),
    /course registry contains duplicate course ids: agentic/,
  );
});

test("registry ordering validates membership before materializing records", () => {
  const records = [
    { id: "grok", value: 2 },
    { id: "agentic", value: 1 },
  ];
  assert.deepEqual(
    registryOrderedCourseRecords(["agentic", "grok"], records, "fixture"),
    [records[1], records[0]],
  );
  assert.throws(
    () => registryOrderedCourseRecords(["agentic", "grok"], [records[0]], "fixture"),
    /missing: agentic/,
  );
});

test("the public views derive their exact id set by excluding staged records", () => {
  const registryIds = COURSE_RELEASE_SURFACES.map((course) => course.id);
  const publicIds = COURSE_RELEASE_SURFACES
    .filter((course) => course.state !== "staged")
    .map((course) => course.id);
  const implementedIds = COURSE_RELEASE_SURFACES
    .filter((course) => course.state !== "roadmap" && course.state !== "staged")
    .map((course) => course.id);

  assert.deepEqual(COURSE_IDS, registryIds);
  assert.deepEqual(PUBLIC_COURSE_IDS, publicIds);
  assert.deepEqual(PUBLIC_COURSE_SURFACES.map((course) => course.id), publicIds);
  assert.deepEqual(TOP_LEVEL_COURSES.map((course) => course.id), implementedIds);
  assert.deepEqual(CATALOG_COURSES.map((course) => course.id), publicIds);
  assertExactIds(
    publicIds,
    PUBLIC_CATALOG_COURSE_RELEASES.map(({ course }) => course.id),
  );
});

test("registry-derived public catalogue preserves the reviewed visual order", () => {
  assert.deepEqual(
    PUBLIC_CATALOG_COURSE_RELEASES.map(({ course }) => course.catalogOrder),
    Array.from({ length: PUBLIC_CATALOG_COURSE_RELEASES.length }, (_, index) => index + 1),
  );
  assert.deepEqual(
    PUBLIC_CATALOG_COURSE_RELEASES.map(({ course }) => course.id),
    [
      "agentic", "codex", "claude", "cursor", "grok", "ai-research", "github",
      "prompts", "software-engineering", "rag", "mcp", "make-money-with-codex",
      "claude-income", "ai-tutor", "product-management", "agent-orchestration",
      "responsible-ai", "agentic-quant-trading", "ai-teaching", "math-animation",
      "agentic-video-editing",
    ],
  );
});

test("client projection rejects duplicate registry ids before writing", () => {
  const contract = JSON.parse(readFileSync("config/course-release-manifest.json", "utf8"));
  const duplicate = structuredClone(contract);
  duplicate.courses.push(structuredClone(duplicate.courses[0]));
  assert.throws(
    () => validateCourseReleaseManifest(duplicate),
    /course ids must be unique/,
  );
});
