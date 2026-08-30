import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  projectAuthoredCourseRouteWrappers,
  projectPublicCourseSurface,
} from "../scripts/sync-course-public-surface.mjs";

test("client-safe projection is generated from the authoritative registry", () => {
  const contract = JSON.parse(readFileSync("config/course-release-surface.json", "utf8"));
  const projection = projectPublicCourseSurface(contract);
  assert.deepEqual(
    projection,
    JSON.parse(readFileSync("config/course-public-surface.json", "utf8")),
  );
  assert.equal(JSON.stringify(projection).includes("releaseGate"), false);
  assert.equal(JSON.stringify(projection).includes("blockers"), false);
  assert.equal(JSON.stringify(projection).includes("storageKey"), false);

  const flipped = structuredClone(contract);
  const codex = flipped.courses.find((course: { id: string }) => course.id === "codex");
  codex.state = "published";
  const projectedCodex = projectPublicCourseSurface(flipped).courses.find(
    (course: { id: string }) => course.id === "codex",
  );
  assert.equal(projectedCodex?.state, "published");
  assert.equal(projectedCodex?.href, "/codex/");
  assert.equal(projectedCodex?.progressEvent, "codex:progress-change");
});

test("build scripts sync the client projection before consuming it", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["release-surface:sync"],
    "node scripts/sync-course-public-surface.mjs",
  );
  assert.match(packageJson.scripts["release-surface:check"], /^npm run release-surface:sync && /);
  assert.equal(packageJson.scripts.pretest, "npm run release-surface:sync");
});

test("blocked authored curricula stay outside the public route module graph until a state flip", () => {
  const contract = JSON.parse(readFileSync("config/course-release-surface.json", "utf8"));
  const current = projectAuthoredCourseRouteWrappers(contract);
  assert.equal(current.length, 6);
  for (const wrapper of current) {
    assert.equal(wrapper.source, null, wrapper.path);
  }

  const flipped = structuredClone(contract);
  const codex = flipped.courses.find((course: { id: string }) => course.id === "codex");
  codex.state = "published";
  const futureCodex = projectAuthoredCourseRouteWrappers(flipped)
    .filter((wrapper) => wrapper.path.includes("/codex/"));
  assert.equal(futureCodex.length, 2);
  assert.ok(futureCodex.every((wrapper) => wrapper.source?.includes("_blocked/codex/")));
  assert.ok(futureCodex.every((wrapper) => wrapper.source?.includes('courseLocaleParams("codex")')
    || wrapper.source?.includes('courseChildParams(\n    "codex"')));
});
