import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  deriveBlockedGatePlan,
  gateExpectationFailures,
  summarizeOutput,
} from "../scripts/run-blocked-course-backlog.mjs";

test("blocked backlog derives every registry-owned development and release gate", () => {
  const contract = JSON.parse(readFileSync("config/course-release-surface.json", "utf8"));
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const plan: Array<{
    courseId: string;
    declaredBlockers: string[];
    devGate: string;
    releaseGate: string;
  }> = deriveBlockedGatePlan(contract, packageJson);

  const blockedRecords = contract.courses
    .filter((course: { state: string }) => course.state === "blocked")
    .sort((left: { id: string }, right: { id: string }) => left.id.localeCompare(right.id));
  assert.deepEqual(
    plan.map((course) => course.courseId),
    blockedRecords.map((course: { id: string }) => course.id),
  );
  assert.deepEqual(
    plan.map((course) => [course.devGate, course.releaseGate]),
    blockedRecords.map((course: { releaseGate: string }) => [
      course.releaseGate.replace(/:release$/u, ""),
      course.releaseGate,
    ]),
  );
  assert.ok(plan.every((course) => course.declaredBlockers.length > 0));

  const onePublished = {
    ...contract,
    courses: contract.courses.map((course: { id: string; state: string }) =>
      course.id === "codex" ? { ...course, state: "published" } : course,
    ),
  };
  assert.deepEqual(
    deriveBlockedGatePlan(onePublished, packageJson).map(
      (course: { courseId: string }) => course.courseId,
    ),
    blockedRecords
      .map((course: { id: string }) => course.id)
      .filter((courseId: string) => courseId !== "codex"),
  );
  assert.deepEqual(
    deriveBlockedGatePlan({ ...contract, courses: [] }, packageJson),
    [],
  );
});

test("blocked backlog fails closed on a broken dev check, a green release gate, or a spawn error", () => {
  const healthyBlocked = {
    courseId: "codex",
    dev: { exitCode: 0, signal: null, spawnError: null },
    release: { exitCode: 1, signal: null, spawnError: null },
  };
  assert.deepEqual(gateExpectationFailures([healthyBlocked]), []);
  assert.match(
    gateExpectationFailures([{ ...healthyBlocked, dev: { ...healthyBlocked.dev, exitCode: 1 } }])[0],
    /development checker did not pass/,
  );
  assert.match(
    gateExpectationFailures([{ ...healthyBlocked, release: { ...healthyBlocked.release, exitCode: 0 } }])[0],
    /unexpectedly passed/,
  );
  assert.match(
    gateExpectationFailures([{
      ...healthyBlocked,
      release: { ...healthyBlocked.release, exitCode: null, spawnError: "ENOENT" },
    }])[0],
    /did not complete normally/,
  );
});

test("blocked backlog summaries retain real tail output with a content hash", () => {
  const raw = ["header", "WARN real warning", "FAIL release evidence pending"].join("\n");
  const summary = summarizeOutput(raw, 2);
  assert.equal(summary.lineCount, 3);
  assert.equal(summary.truncated, true);
  assert.deepEqual(summary.lines, ["WARN real warning", "FAIL release evidence pending"]);
  assert.match(summary.sha256, /^[a-f0-9]{64}$/);
});

test("verify:source records the blocked backlog only after the published release ledger", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["blocked:check:backlog"],
    "node scripts/run-blocked-course-backlog.mjs",
  );
  const verify = packageJson.scripts["verify:source"];
  assert.ok(verify.indexOf("npm run published:check:release") >= 0);
  assert.ok(verify.indexOf("npm run blocked:check:backlog") > verify.indexOf("npm run published:check:release"));

  const publishedRunner = readFileSync("scripts/run-published-release-gates.mjs", "utf8");
  const blockedRunner = readFileSync("scripts/run-blocked-course-backlog.mjs", "utf8");
  assert.doesNotMatch(publishedRunner, /published\.length\s*!==\s*12/);
  assert.doesNotMatch(blockedRunner, /EXPECTED_BLOCKED_IDS|expectedBlockedCount:\s*3/);
});
