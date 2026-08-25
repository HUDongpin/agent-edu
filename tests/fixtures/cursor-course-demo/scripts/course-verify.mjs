#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_FILE = join(ROOT, "course-fixture.json");
const RECEIPT_FILE = join(ROOT, "course-receipt.json");
const EXPECTED_FIXTURE_SHA256 = "3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b";

function run(script) {
  const result = spawnSync("npm", ["run", script], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NO_COLOR: "1" },
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  console.log(`\n[${script}] ${result.status === 0 ? "PASS" : "FAIL"}`);
  if (output) console.log(output);
  return result.status === 0;
}

function sameRecord(actual, expected) {
  const actualEntries = Object.entries(actual ?? {}).sort(([left], [right]) => left.localeCompare(right));
  const expectedEntries = Object.entries(expected ?? {}).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(actualEntries) === JSON.stringify(expectedEntries);
}

function noNewDependencies(fixture) {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
    const rootLock = lock.packages?.[""];
    return Boolean(rootLock) &&
      sameRecord(pkg.dependencies, fixture.dependencies) &&
      sameRecord(pkg.devDependencies, fixture.devDependencies) &&
      sameRecord(rootLock.dependencies, fixture.dependencies) &&
      sameRecord(rootLock.devDependencies, fixture.devDependencies);
  } catch {
    return false;
  }
}

function routesPreserved(fixture, buildPassed) {
  if (!buildPassed) return false;
  const outputFor = (route) => route === "/"
    ? join(ROOT, "out/index.html")
    : join(ROOT, "out", route.replace(/^\/+|\/+$/g, ""), "index.html");
  const sourceFor = (route) => route === "/"
    ? join(ROOT, "app/page.tsx")
    : join(ROOT, "app", route.replace(/^\/+|\/+$/g, ""), "page.tsx");
  return fixture.routes.every((route) => existsSync(sourceFor(route)) && existsSync(outputFor(route)));
}

const fixtureBytes = readFileSync(FIXTURE_FILE);
const fixtureSha256 = createHash("sha256").update(fixtureBytes).digest("hex");
const fixture = JSON.parse(fixtureBytes.toString("utf8"));

// A fresh run must never leave a previously passing receipt in place if a
// current check fails. The receipt remains an unsigned self-check, not an
// execution or identity attestation.
rmSync(RECEIPT_FILE, { force: true });

if (fixtureSha256 !== EXPECTED_FIXTURE_SHA256) {
  console.error("course-fixture.json changed; restore the starter manifest before verifying.");
  process.exit(1);
}

const tests = run("test");
const keyboardBehavior = run("test:keyboard");
const lint = run("lint");
const build = run("build");

const receipt = {
  schema: "aicourse.cursor.capstone.v1",
  fixtureVersion: fixture.fixtureVersion,
  fixtureSha256,
  checks: {
    tests,
    lint,
    build,
    routesPreserved: routesPreserved(fixture, build),
    keyboardBehavior,
    noNewDependencies: noNewDependencies(fixture),
  },
};

console.log("\nVerification result:\n" + JSON.stringify(receipt, null, 2));

if (Object.values(receipt.checks).every(Boolean)) {
  writeFileSync(RECEIPT_FILE, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log("\nPASS: wrote course-receipt.json");
  process.exit(0);
}

console.error("\nFAIL: no receipt was written. Fix every failed check and run course:verify again.");
process.exit(1);
