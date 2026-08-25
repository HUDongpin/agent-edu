#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PROJECT = resolve(process.cwd());
const CONTRACT = resolve(PROJECT, "config/course-release-surface.json");
const DEFAULT_OUTPUT = resolve(PROJECT, "tmp/release/published-course-gates.json");

function commandArgs(command) {
  const parts = command.trim().split(/\s+/);
  if (parts[0] === "npm" && parts[1] === "run" && parts.length === 3) {
    return { executable: process.platform === "win32" ? "npm.cmd" : "npm", args: parts.slice(1) };
  }
  if (parts[0] === "node" && parts.length >= 2 && parts.slice(1).every((part) => !/[;&|`$<>]/.test(part))) {
    return { executable: process.execPath, args: parts.slice(1) };
  }
  throw new Error(`unsupported releaseGate command shape: ${command}`);
}

function commitSha() {
  const fromEnvironment = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (fromEnvironment) return fromEnvironment;
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: PROJECT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 ? result.stdout.trim() : "local-unresolved";
}

export function runPublishedReleaseGates(options = {}) {
  const contract = JSON.parse(readFileSync(CONTRACT, "utf8"));
  const published = contract.courses.filter((course) => course.state === "published");

  const results = [];
  for (const course of published) {
    if (typeof course.releaseGate !== "string" || !course.releaseGate.trim()) {
      throw new Error(`${course.id}: releaseGate is missing`);
    }
    const { executable, args } = commandArgs(course.releaseGate);
    console.log(`\n[published gate] ${course.id}: ${course.releaseGate}`);
    const started = Date.now();
    const result = spawnSync(executable, args, {
      cwd: PROJECT,
      env: process.env,
      stdio: "inherit",
    });
    results.push({
      courseId: course.id,
      releaseGate: course.releaseGate,
      status: result.status === 0 ? "pass" : "fail",
      exitCode: result.status ?? 1,
      durationMs: Date.now() - started,
    });
  }

  const ledger = {
    schemaVersion: 1,
    commitSha: commitSha(),
    generatedAt: new Date().toISOString(),
    publishedCount: published.length,
    passedCount: results.filter((result) => result.status === "pass").length,
    failedCount: results.filter((result) => result.status === "fail").length,
    gates: results,
  };
  const output = resolve(options.output ?? DEFAULT_OUTPUT);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 });
  console.log(`\npublished gates: ${ledger.passedCount}/${ledger.publishedCount} PASS; ledger ${output}`);
  if (ledger.failedCount) throw new Error(`${ledger.failedCount} published release gate(s) failed`);
  return ledger;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    runPublishedReleaseGates();
  } catch (error) {
    console.error(`published gates: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
