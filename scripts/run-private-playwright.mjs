import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const CONTRACT_MARKER =
  "private evidence contract: reached intentional assertion";
const TIMEOUT_CONTRACT_MARKER =
  "private evidence contract: reached full-test input timeout";
const BEGIN_PATTERN = /^private-suite: ([1-9][0-9]*) test\(s\)$/;
const TEST_PATTERN =
  /^private-suite: test ([1-9][0-9]*)\/([1-9][0-9]*) (passed|failed|timedOut|skipped|interrupted) ([a-z0-9-]{1,32})$/;
// A retried attempt carries no index: it is not a result, only a note that the
// suite spent one. Projects are bounded to the same token shape as above.
const RETRY_PATTERN = /^private-suite: retry (failed|timedOut) ([a-z0-9-]{1,32})$/;
const END_PATTERN = /^private-suite: run (passed|failed|timedout|interrupted)$/;

export function validatePrivateReporterOutput(stdout, stderr, requireContractMarkers) {
  if (stderr.trim() !== "") return null;
  const lines = stdout.split(/\r?\n/).filter((line) => line.length > 0);
  const begin = BEGIN_PATTERN.exec(lines[0] ?? "");
  const end = END_PATTERN.exec(lines.at(-1) ?? "");
  if (!begin || !end) return null;

  const total = Number(begin[1]);
  const testStatuses = [];
  const testProjects = [];
  const retriedAttempts = [];
  let assertionMarkerCount = 0;
  let timeoutMarkerCount = 0;
  for (const line of lines.slice(1, -1)) {
    if (line === CONTRACT_MARKER) {
      assertionMarkerCount += 1;
      continue;
    }
    if (line === TIMEOUT_CONTRACT_MARKER) {
      timeoutMarkerCount += 1;
      continue;
    }
    const retried = RETRY_PATTERN.exec(line);
    if (retried) {
      retriedAttempts.push({ status: retried[1], project: retried[2] });
      continue;
    }
    const match = TEST_PATTERN.exec(line);
    if (!match) return null;
    const index = Number(match[1]);
    const declaredTotal = Number(match[2]);
    if (declaredTotal !== total || index !== testStatuses.length + 1) return null;
    testStatuses.push(match[3]);
    testProjects.push(match[4]);
  }
  if (testStatuses.length !== total) return null;
  const expectedMarkerCount = requireContractMarkers ? 1 : 0;
  if (
    assertionMarkerCount !== expectedMarkerCount
    || timeoutMarkerCount !== expectedMarkerCount
  ) return null;
  return {
    total,
    testStatuses,
    testProjects,
    retriedAttempts,
    runStatus: end[1],
    assertionMarkerCount,
    timeoutMarkerCount,
  };
}

/**
 * Runs the private Playwright boundary without ever forwarding child stdout or
 * stderr. The caller receives only a closed, non-sensitive status structure.
 */
export function runPrivatePlaywright({
  config = "playwright.private.config.ts",
  cwd = process.cwd(),
  requireContractMarkers = false,
} = {}) {
  const child = spawnSync(
    "npx",
    ["playwright", "test", `--config=${config}`],
    {
      cwd,
      encoding: "utf8",
      env: { ...process.env, PLAYWRIGHT_NO_COPY_PROMPT: "1" },
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  return {
    status: child.status,
    signal: child.signal,
    stderrWasEmpty: (child.stderr ?? "").trim() === "",
    report: validatePrivateReporterOutput(
      child.stdout ?? "",
      child.stderr ?? "",
      requireContractMarkers,
    ),
  };
}

/**
 * Why a failure was a failure, in the reporter's own closed vocabulary.
 *
 * Every value here came through validatePrivateReporterOutput, which accepts
 * only counts, runner-controlled statuses and a bounded project token — so this
 * can say which test in which engine failed without forwarding a byte the
 * browser produced. A run that fails the contract outright has no such values,
 * and says only which structural expectation went unmet.
 */
export function describePrivateFailure(result) {
  const { report } = result;
  if (!report) {
    const reasons = [];
    if (result.signal !== null) reasons.push(`killed by ${result.signal}`);
    if (!result.stderrWasEmpty) reasons.push("the child wrote to stderr");
    reasons.push(`exit ${result.status}`);
    return `no valid reporter output (${reasons.join(", ")})`;
  }
  const failures = report.testStatuses
    .map((status, index) => ({ status, index, project: report.testProjects[index] }))
    .filter((entry) => entry.status !== "passed");
  const retried = report.retriedAttempts.length;
  const spent = retried === 0 ? "" : `; ${retried} retried attempt(s)`;
  if (failures.length === 0) {
    return `run reported ${report.runStatus} with every test passed${spent}`;
  }
  const listed = failures
    .slice(0, 5)
    .map((entry) => `${entry.index + 1}/${report.total} ${entry.status} [${entry.project}]`)
    .join(", ");
  const rest = failures.length > 5 ? `, and ${failures.length - 5} more` : "";
  return `${failures.length} of ${report.total} test(s) not passed: ${listed}${rest}${spent}`;
}

function main() {
  const result = runPrivatePlaywright();
  const passed =
    result.status === 0
    && result.signal === null
    && result.report?.runStatus === "passed"
    && result.report.testStatuses.every((status) => status === "passed");
  if (!passed) {
    process.stderr.write(
      `private browser suite: FAIL — ${describePrivateFailure(result)}. `
      + "Raw browser output stays suppressed; reproduce locally, without real "
      + "credentials, with: npm run test:smoke:private\n",
    );
    process.exitCode = 1;
    return;
  }
  const retried = result.report.retriedAttempts.length;
  process.stdout.write(
    `private browser suite: PASS (${result.report.total} tests`
    + `${retried === 0 ? "" : `, ${retried} retried attempt(s)`})\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
