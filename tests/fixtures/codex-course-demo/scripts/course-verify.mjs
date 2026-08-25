#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearReceipt,
  frozenFileMatchesBaseline,
  packageFilesMatchBaseline,
  writeReceiptAtomically,
} from "./verifier-integrity.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_FILE = join(ROOT, "course-fixture.json");
const RECEIPT_FILE = join(ROOT, "course-receipt.json");
const EXPECTED_FIXTURE_SHA256 = "66b0eacf5bf947fc0ac530ee31803404ee896550266699cb818908a2deca1d95";

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

function noNewDependencies(fixture) {
  return packageFilesMatchBaseline(ROOT, fixture);
}

function nativeButtonSemantics() {
  try {
    const component = readFileSync(join(ROOT, "components/CourseList.tsx"), "utf8");
    const courses = readFileSync(join(ROOT, "lib/courses.ts"), "utf8");
    return /label:\s*["']Incomplete["']/.test(component) &&
      /<button\b/.test(component) &&
      /type=["']button["']/.test(component) &&
      /aria-pressed=/.test(component) &&
      /role=["']group["']/.test(component) &&
      /aria-label=["']Filter courses["']/.test(component) &&
      !/<(?:div|span)[^>]+onClick=/.test(component) &&
      !/onKeyDown=.*preventDefault/.test(component) &&
      /["']incomplete["']/.test(courses) &&
      /!\s*course\.complete/.test(courses);
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

// A failed re-run must never leave an older passing receipt behind.
clearReceipt(RECEIPT_FILE);

const fixtureBytes = readFileSync(FIXTURE_FILE);
const fixtureSha256 = createHash("sha256").update(fixtureBytes).digest("hex");
const fixture = JSON.parse(fixtureBytes.toString("utf8"));

if (fixtureSha256 !== EXPECTED_FIXTURE_SHA256) {
  console.error("course-fixture.json changed; restore the starter manifest before verifying.");
  process.exit(1);
}

const testCommandPassed = run("test");
const suppliedTestPreserved = frozenFileMatchesBaseline(
  ROOT,
  "tests/CourseList.test.tsx",
  fixture.courseListTestSha256,
);
if (!suppliedTestPreserved) {
  console.error("The supplied CourseList.test.tsx changed; restore it and put any additional tests in a new file.");
}
const tests = testCommandPassed && suppliedTestPreserved;
const lint = run("lint");
const build = run("build");

const receipt = {
  schema: "aicourse.codex.capstone.v1",
  fixtureVersion: fixture.fixtureVersion,
  fixtureSha256,
  checks: {
    tests,
    lint,
    build,
    routesPreserved: routesPreserved(fixture, build),
    keyboardBehavior: tests && nativeButtonSemantics(),
    noNewDependencies: noNewDependencies(fixture),
  },
};

console.log("\nVerification result:\n" + JSON.stringify(receipt, null, 2));

if (Object.values(receipt.checks).every(Boolean)) {
  writeReceiptAtomically(RECEIPT_FILE, receipt);
  console.log("\nPASS: wrote course-receipt.json");
  process.exit(0);
}

console.error("\nFAIL: no receipt was written. Fix every failed check and run course:verify again.");
process.exit(1);
