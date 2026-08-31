import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertReleaseArtifactsCurrent,
  projectAuthoredCourseRouteWrappers,
  projectPublicCourseSurface,
  validateCourseReleaseManifest,
} from "../scripts/sync-course-public-surface.mjs";

test("both projections are byte-checked against the authoritative v3 manifest SHA", () => {
  const manifestText = readFileSync("config/course-release-manifest.json", "utf8");
  const manifest = JSON.parse(manifestText);
  const current = assertReleaseArtifactsCurrent();
  const expectedSha = createHash("sha256").update(manifestText).digest("hex");
  assert.equal(current.sourceSha256, expectedSha);
  assert.equal(current.releaseSurface.source.sha256, expectedSha);
  assert.equal(current.publicSurface.source.sha256, expectedSha);
  assert.equal(current.releaseSurface.manifestKind, "course-release-surface-projection");
  assert.equal(current.publicSurface.manifestKind, "course-public-surface-projection");
  const projection = projectPublicCourseSurface(manifest, current.publicSurface.source);
  assert.deepEqual(
    projection,
    JSON.parse(readFileSync("config/course-public-surface.json", "utf8")),
  );
  assert.equal(projection.courses.length, 20);
  assert.equal(projection.courses.some((course: { id: string }) => course.id === "creator-ops"), false);
  assert.equal(JSON.stringify(projection).includes("releaseGate"), false);
  assert.equal(JSON.stringify(projection).includes("blockers"), false);
  assert.equal(JSON.stringify(projection).includes("storageKey"), false);

  const flipped = structuredClone(manifest);
  const codex = flipped.courses.find((course: { id: string }) => course.id === "codex");
  codex.state = "published";
  const projectedCodex = projectPublicCourseSurface(flipped).courses.find(
    (course: { id: string }) => course.id === "codex",
  );
  assert.equal(projectedCodex?.state, "published");
  assert.equal(projectedCodex?.href, "/codex/");
  assert.equal(projectedCodex?.progressEvent, "codex:progress-change");
});

test("direct development, test, and course release entries validate projections without rewriting them", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["release-surface:sync"],
    "node scripts/sync-course-public-surface.mjs",
  );
  assert.match(packageJson.scripts["release-surface:check"], /sync-course-public-surface\.mjs --check/);
  assert.equal(packageJson.scripts.pretest, "npm run release-surface:check");
  assert.equal(packageJson.scripts.predev, "node scripts/sync-course-public-surface.mjs --check");
  const directCourseReleaseGates = [
    "agentic", "codex", "claude", "cursor", "grok", "github", "prompts",
    "software-engineering", "rag", "mcp", "make-money-with-codex", "claude-income",
    "ai-tutor", "product-management", "agent-orchestration",
    "responsible-ai", "agentic-quant-trading", "ai-teaching", "math-animation",
  ].map((courseId) => `${courseId}:check:release`);
  for (const name of directCourseReleaseGates) {
    const command = packageJson.scripts[name] as string;
    assert.match(command, /^npm run release-manifest:assert && /, name);
  }
});

test("blocked and staged curricula stay in one private root until an authorized state flip", () => {
  const manifest = JSON.parse(readFileSync("config/course-release-manifest.json", "utf8"));
  const current = projectAuthoredCourseRouteWrappers(manifest);
  assert.equal(current.length, 20);
  for (const wrapper of current) {
    assert.equal(wrapper.source, null, wrapper.path);
  }
  assert.equal(current.filter((wrapper) => wrapper.courseId === "creator-ops").length, 2);
  assert.ok(current
    .filter((wrapper) => wrapper.courseId === "creator-ops")
    .every((wrapper) => wrapper.privateFolder === "_staged"));

  const flipped = structuredClone(manifest);
  const codex = flipped.courses.find((course: { id: string }) => course.id === "codex");
  codex.state = "published";
  const futureCodex = projectAuthoredCourseRouteWrappers(flipped)
    .filter((wrapper) => wrapper.path.includes("/codex/"));
  assert.equal(futureCodex.length, 2);
  assert.ok(futureCodex.every((wrapper) => wrapper.source?.includes("_blocked/codex/")));
  assert.ok(futureCodex.every((wrapper) => wrapper.source?.includes('courseLocaleParams("codex")')
    || wrapper.source?.includes('courseChildParams(\n    "codex"')));
});

test("changing lifecycle state and the manifest allowlist together still fails the fixed freeze", () => {
  const manifest = JSON.parse(readFileSync("config/course-release-manifest.json", "utf8"));
  const mutated = structuredClone(manifest);
  mutated.courses.find((course: { id: string }) => course.id === "agentic").state = "staged";
  mutated.courses.find((course: { id: string }) => course.id === "creator-ops").state = "published";
  mutated.intakeFreeze.publishedCourseIds = mutated.intakeFreeze.publishedCourseIds
    .map((id: string) => id === "agentic" ? "creator-ops" : id);
  assert.throws(
    () => validateCourseReleaseManifest(mutated),
    /intakeFreeze\.publishedCourseIds must exactly equal/,
  );
});
