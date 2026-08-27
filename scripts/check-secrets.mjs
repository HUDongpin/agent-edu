import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PRIVATE_KEY = new RegExp(
  ["-----BEGIN ", "(?:RSA |EC |OPENSSH )?", "PRIVATE KEY-----"].join(""),
  "g",
);
const DEEPSEEK_KEY = new RegExp(
  ["(?:^|[^A-Za-z0-9])", "sk", "-", "[A-Za-z0-9_-]{24,}"].join(""),
  "g",
);
const GITHUB_TOKEN = new RegExp(
  ["(?:^|[^A-Za-z0-9])", "gh", "[pousr]_", "[A-Za-z0-9]{30,}"].join(""),
  "g",
);
const AWS_ACCESS_KEY = new RegExp(
  ["(?:^|[^A-Z0-9])", "AKIA", "[A-Z0-9]{16}"].join(""),
  "g",
);
const GOOGLE_API_KEY = new RegExp(
  ["(?:^|[^A-Za-z0-9])", "AIza", "[A-Za-z0-9_-]{30,}"].join(""),
  "g",
);
const LITERAL_BEARER = new RegExp(
  ["Authorization", "[^\\n]{0,40}", "Bearer\\s+", "[A-Za-z0-9._~+/-]{20,}"].join(""),
  "gi",
);

const CONTENT_RULES = [
  ["private-key", PRIVATE_KEY],
  ["deepseek-key", DEEPSEEK_KEY],
  ["github-token", GITHUB_TOKEN],
  ["aws-access-key", AWS_ACCESS_KEY],
  ["google-api-key", GOOGLE_API_KEY],
  ["literal-bearer-token", LITERAL_BEARER],
];

export function pathFindings(file) {
  const rules = [];
  if (/(^|\/)(?:\.env(?:\.|$)|[^/]+\.env$)/i.test(file)) rules.push("environment-file");
  if (/(^|\/)\.claude\//i.test(file)) rules.push("private-tooling");
  if (/\.(?:docx?|pem|p12|pfx|key)$/i.test(file)) rules.push("sensitive-extension");
  if (
    file !== "scripts/check-secrets.mjs" &&
    /(?:secret|credential|api.?key)/i.test(file)
  ) {
    rules.push("sensitive-filename");
  }
  if (/^(?:course\/progress\.json|(?:course|legacy\/course-python)\/cafe\/fixtures\..*\.json)$/i.test(file)) {
    rules.push("private-runtime-data");
  }
  return rules;
}

export function contentFindings(text) {
  const findings = [];
  for (const [id, pattern] of CONTENT_RULES) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (!match) continue;
    const line = text.slice(0, match.index).split("\n").length;
    findings.push({ id, line });
  }
  return findings;
}

function trackedFiles() {
  const raw = execFileSync("git", ["ls-files", "-z"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return raw.split("\0").filter(Boolean);
}

function untrackedFiles() {
  const raw = execFileSync("git", ["ls-files", "-z", "--others", "--exclude-standard"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return raw.split("\0").filter(Boolean);
}

function candidateBytes(file) {
  const worktreePath = resolve(file);
  if (existsSync(worktreePath)) return readFileSync(worktreePath);

  // A tracked file can be deleted in the worktree while its blob still exists
  // in the index. Inspect that exact blob instead of either crashing or
  // silently dropping index coverage. Staged deletions are absent from
  // `git ls-files` and therefore do not reach this branch.
  return execFileSync("git", ["show", `:${file}`], {
    cwd: process.cwd(),
    encoding: null,
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function checkSecrets() {
  const findings = [];
  const files = [...new Set([...trackedFiles(), ...untrackedFiles()])];
  for (const file of files) {
    for (const id of pathFindings(file)) findings.push({ file, id });
    const bytes = candidateBytes(file);
    if (bytes.includes(0)) continue;
    for (const finding of contentFindings(bytes.toString("utf8"))) {
      findings.push({ file, ...finding });
    }
  }

  if (findings.length) {
    console.error("secrets: FAIL — tracked files matched high-confidence secret rules");
    for (const finding of findings) {
      const where = finding.line ? ":" + finding.line : "";
      console.error("  " + finding.id + ": " + finding.file + where);
    }
    throw new Error(findings.length + " tracked-file finding(s)");
  }
  console.log("secrets: " + files.length + " tracked and untracked files checked; no high-confidence findings");
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkSecrets();
  } catch (error) {
    if (!(error instanceof Error) || !/tracked-file finding/.test(error.message)) {
      console.error("secrets: scanner error — " + (error instanceof Error ? error.message : String(error)));
    }
    process.exitCode = 1;
  }
}
