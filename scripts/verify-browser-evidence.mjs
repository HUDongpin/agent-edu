import { readFileSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { relative, resolve, sep } from "node:path";
import { scanArtifactRoots } from "./check-artifacts.mjs";
import { runPrivatePlaywright } from "./run-private-playwright.mjs";

const cwd = process.cwd();
const evidenceRoot = resolve(cwd, "browser-evidence");
const privateOutput = resolve(cwd, ".playwright-evidence-contract-private");
const privateKey = ["contract", "private", "key", "91f0"].join("-");
const privatePrompt = ["contract private", " learner prompt 42b7"].join("");
const timeoutKey = ["contract", "timeout", "key", "7c3a"].join("-");
const privateCanaries = [
  privateKey,
  privatePrompt,
  timeoutKey,
  "91f0",
  "42b7",
  "7c3a",
];
const safeMarker = "safe evidence contract: reached intentional assertion";

function runSafe(config) {
  return spawnSync(
    "npx",
    ["playwright", "test", `--config=${config}`],
    {
      cwd,
      encoding: "utf8",
      env: { ...process.env, PLAYWRIGHT_NO_COPY_PROMPT: "1" },
      maxBuffer: 8 * 1024 * 1024,
    },
  );
}

function regularFiles(root) {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error("browser evidence contract found a non-regular output entry");
    }
  }
  try { walk(root); } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
  }
  return files;
}

rmSync(evidenceRoot, { recursive: true, force: true });
const safe = runSafe("playwright.evidence-safe.config.ts");
const safeOutput = `${safe.stdout ?? ""}${safe.stderr ?? ""}`;
if (safe.status !== 1 || !safeOutput.includes(safeMarker)) {
  throw new Error("intentional safe failure did not reach its fixed assertion marker");
}
await scanArtifactRoots(["browser-evidence"], { cwd, curated: true, requireRoots: true });
const evidenceFiles = regularFiles(evidenceRoot).map((path) => path.slice(evidenceRoot.length + 1));
for (const required of ["manifest.json", "screenshot.png", "trace.json", "console.json"]) {
  if (!evidenceFiles.some((path) => path.endsWith(required))) {
    throw new Error(`safe failure did not produce ${required}`);
  }
}

rmSync(evidenceRoot, { recursive: true, force: true });
rmSync(privateOutput, { recursive: true, force: true });
const privateRun = runPrivatePlaywright({
  config: "playwright.evidence-private.config.ts",
  cwd,
  requireContractMarkers: true,
});
if (privateRun.status !== 1) throw new Error("intentional private failure did not return the expected test-failure status");
if (
  privateRun.signal !== null
  || privateRun.report?.runStatus !== "failed"
  || privateRun.report.assertionMarkerCount !== 1
  || privateRun.report.timeoutMarkerCount !== 1
  || privateRun.report.total !== 2
  || privateRun.report.testStatuses.length !== 2
  || !privateRun.report.testStatuses.every(
    (status) => status === "failed" || status === "timedOut",
  )
) {
  throw new Error("intentional private failures did not produce the closed reporter contract");
}
const persistedEvidence = regularFiles(evidenceRoot);
if (persistedEvidence.length !== 0) {
  throw new Error("private failure persisted a curated or unbound browser-evidence file");
}
const privateFiles = regularFiles(privateOutput);
const privateRelative = privateFiles.map((path) => relative(privateOutput, path).split(sep).join("/"));
if (privateRelative.length !== 1 || privateRelative[0] !== ".last-run.json") {
  throw new Error("private failure persisted an output other than the fixed last-run status file");
}
const lastRunBytes = readFileSync(privateFiles[0]);
const lastRunText = lastRunBytes.toString("utf8");
if (privateCanaries.some((value) => lastRunText.includes(value))) {
  throw new Error("private last-run status contained a private fixture value");
}
let lastRun;
try {
  lastRun = JSON.parse(lastRunText);
} catch {
  throw new Error("private last-run status was not valid JSON");
}
const lastRunKeys = lastRun && typeof lastRun === "object" && !Array.isArray(lastRun)
  ? Object.keys(lastRun).sort()
  : [];
if (
  lastRunKeys.length !== 2 || lastRunKeys[0] !== "failedTests" || lastRunKeys[1] !== "status"
  || lastRun.status !== "failed" || !Array.isArray(lastRun.failedTests)
  || lastRun.failedTests.length !== 2
  || new Set(lastRun.failedTests).size !== 2
  || !lastRun.failedTests.every(
    (testId) => /^[0-9a-f]{20}-[0-9a-f]{20}$/.test(testId ?? ""),
  )
) {
  throw new Error("private last-run status did not describe exactly two intentional failed tests");
}

console.log("browser evidence contract: PASS — safe failure produced curated evidence; private failure persisted only a closed failure-status record");
