import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const CONTRACT_MARKER =
  "private evidence contract: reached intentional assertion";
const TIMEOUT_CONTRACT_MARKER =
  "private evidence contract: reached full-test input timeout";
const BEGIN_PATTERN = /^private-suite: ([1-9][0-9]*) test\(s\)$/;
const TEST_PATTERN =
  /^private-suite: test ([1-9][0-9]*)\/([1-9][0-9]*) (passed|failed|timedOut|skipped|interrupted)$/;
const END_PATTERN = /^private-suite: run (passed|failed|timedout|interrupted)$/;

export function validatePrivateReporterOutput(stdout, stderr, requireContractMarkers) {
  if (stderr.trim() !== "") return null;
  const lines = stdout.split(/\r?\n/).filter((line) => line.length > 0);
  const begin = BEGIN_PATTERN.exec(lines[0] ?? "");
  const end = END_PATTERN.exec(lines.at(-1) ?? "");
  if (!begin || !end) return null;

  const total = Number(begin[1]);
  const testStatuses = [];
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
    const match = TEST_PATTERN.exec(line);
    if (!match) return null;
    const index = Number(match[1]);
    const declaredTotal = Number(match[2]);
    if (declaredTotal !== total || index !== testStatuses.length + 1) return null;
    testStatuses.push(match[3]);
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
    report: validatePrivateReporterOutput(
      child.stdout ?? "",
      child.stderr ?? "",
      requireContractMarkers,
    ),
  };
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
      "private browser suite: FAIL — raw browser output was suppressed; inspect locally without using real credentials\n",
    );
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`private browser suite: PASS (${result.report.total} tests)\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
