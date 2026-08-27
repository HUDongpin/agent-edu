#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const PROJECT = resolve(process.cwd());
const PACKAGE = resolve(PROJECT, "package.json");
const DEFAULT_OUTPUT = resolve(PROJECT, "tmp/release/blocked-course-backlog.json");
const SUMMARY_LINE_LIMIT = 48;

function commandArgs(command) {
  const match = /^npm run ([a-z0-9-]+:check(?::release)?)$/.exec(command);
  if (!match) throw new Error(`unsupported blocked-course gate command: ${command}`);
  return {
    executable: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", match[1]],
  };
}

function gitValue(args, fallback) {
  const result = spawnSync("git", args, {
    cwd: PROJECT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 ? result.stdout.trim() : fallback;
}

function commitSha() {
  return process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GITHUB_SHA
    ?? gitValue(["rev-parse", "HEAD"], "local-unresolved");
}

function workingTreeDirty() {
  return gitValue(["status", "--porcelain"], "status-unavailable").length > 0;
}

export function summarizeOutput(rawOutput, lineLimit = SUMMARY_LINE_LIMIT) {
  const normalized = String(rawOutput ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
  const selected = normalized.length > lineLimit
    ? normalized.slice(-lineLimit)
    : normalized;
  return {
    lineCount: normalized.length,
    truncated: selected.length !== normalized.length,
    sha256: createHash("sha256").update(String(rawOutput ?? "")).digest("hex"),
    lines: selected,
  };
}

export function deriveBlockedGatePlan(contract, packageJson) {
  if (!Array.isArray(contract?.courses)) throw new Error("release registry courses are missing");
  const blocked = contract.courses.filter((course) => course.state === "blocked");

  return blocked
    .map((course) => {
      if (!Array.isArray(course.blockers) || course.blockers.length === 0) {
        throw new Error(`${course.id}: blocked registry record must retain at least one blocker`);
      }
      const releaseMatch = /^npm run ([a-z0-9-]+):check:release$/.exec(course.releaseGate ?? "");
      if (!releaseMatch) {
        throw new Error(`${course.id}: blocked releaseGate must be an npm :check:release script`);
      }
      const releaseScript = `${releaseMatch[1]}:check:release`;
      const devScript = `${releaseMatch[1]}:check`;
      if (typeof packageJson?.scripts?.[devScript] !== "string") {
        throw new Error(`${course.id}: development checker npm script ${devScript} is missing`);
      }
      if (typeof packageJson?.scripts?.[releaseScript] !== "string") {
        throw new Error(`${course.id}: release checker npm script ${releaseScript} is missing`);
      }
      return {
        courseId: course.id,
        declaredBlockers: [...course.blockers],
        devGate: `npm run ${devScript}`,
        releaseGate: course.releaseGate,
      };
    })
    .sort((left, right) => left.courseId.localeCompare(right.courseId));
}

function runGate(command) {
  const { executable, args } = commandArgs(command);
  const started = Date.now();
  const result = spawnSync(executable, args, {
    cwd: PROJECT,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = `${stdout}${stdout && stderr ? "\n" : ""}${stderr}`;
  if (combined) process.stdout.write(combined.endsWith("\n") ? combined : `${combined}\n`);
  return {
    exitCode: typeof result.status === "number" ? result.status : null,
    signal: result.signal ?? null,
    spawnError: result.error?.message ?? null,
    durationMs: Date.now() - started,
    outputSummary: summarizeOutput(combined),
  };
}

export function gateExpectationFailures(courses) {
  const failures = [];
  for (const course of courses) {
    if (course.dev.spawnError || course.dev.signal || course.dev.exitCode !== 0) {
      failures.push(`${course.courseId}: development checker did not pass`);
    }
    if (course.release.spawnError || course.release.signal || course.release.exitCode === null) {
      failures.push(`${course.courseId}: release checker did not complete normally`);
    } else if (course.release.exitCode === 0) {
      failures.push(`${course.courseId}: blocked release checker unexpectedly passed`);
    }
  }
  return failures;
}

export function runBlockedCourseBacklog(options = {}) {
  const { manifest: contract } = assertReleaseArtifactsCurrent({ projectRoot: PROJECT });
  const packageJson = JSON.parse(readFileSync(PACKAGE, "utf8"));
  const plan = deriveBlockedGatePlan(contract, packageJson);
  const courses = [];

  for (const entry of plan) {
    console.log(`\n[blocked development gate] ${entry.courseId}: ${entry.devGate}`);
    const dev = runGate(entry.devGate);
    console.log(`\n[blocked release gate] ${entry.courseId}: ${entry.releaseGate}`);
    const release = runGate(entry.releaseGate);
    courses.push({
      ...entry,
      expected: { devExitCode: 0, releaseExitCode: "non-zero" },
      dev,
      release,
      status: dev.exitCode === 0
        && !dev.spawnError
        && !dev.signal
        && typeof release.exitCode === "number"
        && release.exitCode !== 0
        && !release.spawnError
        && !release.signal
        ? "blocked-as-expected"
        : "unexpected",
    });
  }

  const failures = gateExpectationFailures(courses);
  const ledger = {
    schemaVersion: 1,
    commitSha: commitSha(),
    workingTreeDirty: workingTreeDirty(),
    generatedAt: new Date().toISOString(),
    blockedCount: courses.length,
    expectedBlockedCount: plan.length,
    expectedCount: courses.filter((course) => course.status === "blocked-as-expected").length,
    unexpectedCount: failures.length,
    courses,
    failures,
  };
  const output = resolve(options.output ?? DEFAULT_OUTPUT);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 });
  console.log(
    `\nblocked backlog: ${ledger.expectedCount}/${ledger.blockedCount} blocked as expected; ledger ${output}`,
  );
  if (failures.length > 0) throw new Error(failures.join("; "));
  return ledger;
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    runBlockedCourseBacklog();
  } catch (error) {
    console.error(`blocked backlog: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
