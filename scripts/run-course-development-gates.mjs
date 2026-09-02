#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const PROJECT = resolve(process.cwd());
const PACKAGE = resolve(PROJECT, "package.json");
const DEFAULT_OUTPUT = resolve(PROJECT, "tmp/release/course-development-gates.json");

function developmentGateFor(releaseGate) {
  const stagedGate = /^npm run ([a-z0-9-]+:check:staged)$/.exec(releaseGate ?? "");
  if (stagedGate) return `npm run ${stagedGate[1]}`;
  const npmGate = /^npm run ([a-z0-9-]+:check):release$/.exec(releaseGate ?? "");
  if (npmGate) return `npm run ${npmGate[1]}`;
  const nodeGate = /^node (scripts\/[a-z0-9-]+\.mjs) --release$/.exec(releaseGate ?? "");
  if (nodeGate) return `node ${nodeGate[1]}`;
  throw new Error(`unsupported release gate for development derivation: ${releaseGate}`);
}

function commandArgs(command) {
  const npmGate = /^npm run ([a-z0-9:-]+)$/.exec(command);
  if (npmGate) {
    return {
      executable: process.platform === "win32" ? "npm.cmd" : "npm",
      args: ["run", npmGate[1]],
    };
  }
  const nodeGate = /^node (scripts\/[a-z0-9-]+\.mjs)$/.exec(command);
  if (nodeGate) return { executable: process.execPath, args: [nodeGate[1]] };
  throw new Error(`unsupported development gate command: ${command}`);
}

export function deriveCourseDevelopmentGatePlan(contract, packageJson) {
  if (!Array.isArray(contract?.courses)) throw new Error("release registry courses are missing");
  return contract.courses
    .filter((course) => course.state !== "roadmap")
    .map((course) => {
      const developmentGate = developmentGateFor(course.releaseGate);
      const npmGate = /^npm run ([a-z0-9:-]+)$/.exec(developmentGate);
      if (npmGate && typeof packageJson?.scripts?.[npmGate[1]] !== "string") {
        throw new Error(`${course.id}: development script ${npmGate[1]} is missing`);
      }
      return { courseId: course.id, state: course.state, developmentGate };
    });
}

export function runCourseDevelopmentGates(options = {}) {
  const { manifest: contract } = assertReleaseArtifactsCurrent({ projectRoot: PROJECT });
  const packageJson = JSON.parse(readFileSync(PACKAGE, "utf8"));
  const plan = deriveCourseDevelopmentGatePlan(contract, packageJson);
  const gates = plan.map((entry) => {
    console.log(`\n[development gate] ${entry.courseId}: ${entry.developmentGate}`);
    const { executable, args } = commandArgs(entry.developmentGate);
    const started = Date.now();
    const result = spawnSync(executable, args, {
      cwd: PROJECT,
      env: process.env,
      stdio: "inherit",
    });
    return {
      ...entry,
      status: result.status === 0 ? "pass" : "fail",
      exitCode: result.status ?? 1,
      durationMs: Date.now() - started,
    };
  });
  const ledger = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    courseCount: gates.length,
    passedCount: gates.filter((gate) => gate.status === "pass").length,
    failedCount: gates.filter((gate) => gate.status === "fail").length,
    gates,
  };
  const output = resolve(options.output ?? DEFAULT_OUTPUT);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 });
  console.log(`\ndevelopment gates: ${ledger.passedCount}/${ledger.courseCount} PASS; ledger ${output}`);
  if (ledger.failedCount) throw new Error(`${ledger.failedCount} course development gate(s) failed`);
  return ledger;
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    runCourseDevelopmentGates();
  } catch (error) {
    console.error(`development gates: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
