import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

export const EVIDENCE_SCHEMA = "agent-edu.curated-browser-evidence.v1";
export const SANITIZER_POLICY = "uniform-redaction-surface-v2";
export const FIXTURE_POLICY = "public-fixed-safe-smoke-only";
export const PUBLIC_EVIDENCE_CONTRACT_ANNOTATION =
  "agent-edu-public-evidence-contract";
export const CURATED_FILE_NAMES = [
  "console.json",
  "manifest.json",
  "screenshot.png",
  "trace.json",
] as const;

export type CuratedBrowserName = "chromium" | "firefox" | "webkit";
export type CuratedProjectName =
  | CuratedBrowserName
  | "safe-contract-chromium";

const CURATED_REQUEST_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;
const CURATED_RESOURCE_TYPES = [
  "document",
  "stylesheet",
  "image",
  "media",
  "font",
  "script",
  "texttrack",
  "xhr",
  "fetch",
  "eventsource",
  "websocket",
  "manifest",
  "other",
] as const;
const CURATED_ORIGIN_CLASSES = ["local", "provider", "external"] as const;
const CURATED_CONSOLE_TYPES = [
  "assert",
  "clear",
  "count",
  "debug",
  "dir",
  "dirxml",
  "endGroup",
  "error",
  "info",
  "log",
  "profile",
  "profileEnd",
  "startGroup",
  "startGroupCollapsed",
  "table",
  "timeEnd",
  "trace",
  "warning",
] as const;

type CuratedRequestMethod = (typeof CURATED_REQUEST_METHODS)[number];
type CuratedResourceType = (typeof CURATED_RESOURCE_TYPES)[number];
export type CuratedOriginClass = (typeof CURATED_ORIGIN_CLASSES)[number];
type CuratedConsoleType = (typeof CURATED_CONSOLE_TYPES)[number];

export type CuratedTraceEventInput =
  | Readonly<{ event: "main-frame-navigation" }>
  | Readonly<{
      event: "request";
      method: CuratedRequestMethod;
      resourceType: CuratedResourceType;
      originClass: CuratedOriginClass;
    }>
  | Readonly<{ event: "response"; status: number }>;
export type CuratedTraceEvent = CuratedTraceEventInput & Readonly<{ sequence: number }>;
export type CuratedConsoleCounts = Partial<Record<CuratedConsoleType, number>>;

type CuratedEvidence = {
  testId: string;
  browserName: CuratedBrowserName;
  projectName: CuratedProjectName;
  screenshot: Buffer;
  trace: readonly CuratedTraceEvent[];
  consoleCounts: Readonly<CuratedConsoleCounts>;
  pageErrorCount: number;
};

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeJson(path: string, value: unknown) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  writeFileSync(path, bytes, { mode: 0o600 });
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

function evidenceId(testId: string) {
  return sha256(testId).slice(0, 20);
}

export function toCuratedRequestMethod(value: string): CuratedRequestMethod | null {
  return CURATED_REQUEST_METHODS.includes(value as CuratedRequestMethod)
    ? value as CuratedRequestMethod
    : null;
}

export function toCuratedResourceType(value: string): CuratedResourceType | null {
  return CURATED_RESOURCE_TYPES.includes(value as CuratedResourceType)
    ? value as CuratedResourceType
    : null;
}

export function toCuratedConsoleType(value: string): CuratedConsoleType | null {
  return CURATED_CONSOLE_TYPES.includes(value as CuratedConsoleType)
    ? value as CuratedConsoleType
    : null;
}

export function curatedEvidenceDirectory(testId: string) {
  return resolve("browser-evidence", `safe-failure-${evidenceId(testId)}`);
}

export function hasPublishedCuratedEvidence(testId: string) {
  try {
    const directory = curatedEvidenceDirectory(testId);
    const directoryStat = lstatSync(directory);
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) return false;
    const names = readdirSync(directory).sort();
    return names.length === CURATED_FILE_NAMES.length
      && names.every((name, index) => name === CURATED_FILE_NAMES[index])
      && names.every((name) => {
        const stat = lstatSync(resolve(directory, name));
        return stat.isFile() && !stat.isSymbolicLink();
      });
  } catch {
    return false;
  }
}

function exactKeys(value: Readonly<Record<string, unknown>>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number) {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function assertClosedEvidence(evidence: CuratedEvidence) {
  if (
    !evidence.testId
    || browserNameForProject(evidence.projectName) !== evidence.browserName
    || !Buffer.isBuffer(evidence.screenshot)
    || evidence.screenshot.length === 0
    || evidence.trace.length > 500
    || !isIntegerInRange(evidence.pageErrorCount, 0, 1_000_000)
  ) {
    throw new Error("curated evidence violated the closed bundle contract");
  }

  for (const [index, event] of evidence.trace.entries()) {
    if (event.sequence !== index + 1) {
      throw new Error("curated evidence violated the closed trace contract");
    }
    if (event.event === "main-frame-navigation") {
      if (!exactKeys(event, ["event", "sequence"])) {
        throw new Error("curated evidence violated the closed trace contract");
      }
      continue;
    }
    if (event.event === "response") {
      if (
        !exactKeys(event, ["event", "sequence", "status"])
        || !isIntegerInRange(event.status, 100, 599)
      ) {
        throw new Error("curated evidence violated the closed trace contract");
      }
      continue;
    }
    if (
      !exactKeys(event, ["event", "method", "originClass", "resourceType", "sequence"])
      || !CURATED_REQUEST_METHODS.includes(event.method)
      || !CURATED_RESOURCE_TYPES.includes(event.resourceType)
      || !CURATED_ORIGIN_CLASSES.includes(event.originClass)
    ) {
      throw new Error("curated evidence violated the closed trace contract");
    }
  }

  for (const [type, count] of Object.entries(evidence.consoleCounts)) {
    if (
      !CURATED_CONSOLE_TYPES.includes(type as CuratedConsoleType)
      || !isIntegerInRange(count, 0, 1_000_000)
    ) {
      throw new Error("curated evidence violated the closed console contract");
    }
  }
}

export function browserNameForProject(
  projectName: string,
): CuratedBrowserName {
  if (projectName === "safe-contract-chromium") return "chromium";
  if (
    projectName === "chromium"
    || projectName === "firefox"
    || projectName === "webkit"
  ) {
    return projectName;
  }
  throw new Error("curated evidence received an unsupported browser project");
}

export function curatedProject(projectName: string) {
  return {
    browserName: browserNameForProject(projectName),
    projectName: projectName as CuratedProjectName,
  } as const;
}

/**
 * Persist only the closed evidence schema. A staging directory prevents a
 * normal writer failure from looking like a complete, manifest-bound bundle;
 * the independent scanner remains authoritative after the test process exits.
 */
export function writeCuratedEvidenceBundle(evidence: CuratedEvidence) {
  assertClosedEvidence(evidence);
  const root = resolve("browser-evidence");
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const directory = curatedEvidenceDirectory(evidence.testId);
  if (existsSync(directory)) {
    throw new Error("curated evidence final bundle already exists");
  }
  const staging = resolve(
    ".playwright-raw",
    "curated-staging",
    `safe-failure-${evidenceId(evidence.testId)}-${process.pid}`,
  );
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true, mode: 0o700 });
  try {
    const screenshotPath = resolve(staging, "screenshot.png");
    writeFileSync(screenshotPath, evidence.screenshot, { mode: 0o600 });
    const traceFile = writeJson(resolve(staging, "trace.json"), {
      schemaVersion: EVIDENCE_SCHEMA,
      tracePolicy: "structural-metadata-only-no-url-query-header-body-text",
      screenshots: false,
      sources: false,
      attachments: false,
      events: evidence.trace,
    });
    const consoleFile = writeJson(resolve(staging, "console.json"), {
      schemaVersion: EVIDENCE_SCHEMA,
      consolePolicy: "counts-only-no-console-or-error-text",
      counts: Object.fromEntries(Object.entries(evidence.consoleCounts).sort()),
      pageErrorCount: evidence.pageErrorCount,
    });
    const screenshotFile = {
      bytes: evidence.screenshot.length,
      sha256: sha256(evidence.screenshot),
    };
    writeJson(resolve(staging, "manifest.json"), {
      schemaVersion: EVIDENCE_SCHEMA,
      kind: "curated-safe-browser-failure",
      provenance: {
        sanitizerPolicy: SANITIZER_POLICY,
        fixturePolicy: FIXTURE_POLICY,
        testIdSha256: sha256(evidence.testId),
        browserName: evidence.browserName,
        projectName: evidence.projectName,
        commitSha: /^[0-9a-f]{40}$/i.test(process.env.GITHUB_SHA ?? "")
          ? process.env.GITHUB_SHA
          : "local-uncommitted",
      },
      files: {
        "console.json": { contentType: "application/json", ...consoleFile },
        "screenshot.png": {
          contentType: "image/png",
          sanitization: SANITIZER_POLICY,
          ...screenshotFile,
        },
        "trace.json": { contentType: "application/json", ...traceFile },
      },
    });
    renameSync(staging, directory);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
