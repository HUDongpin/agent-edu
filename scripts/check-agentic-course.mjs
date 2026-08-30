import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PROJECT = resolve(process.cwd());

const CHECKS = [
  ["scripts/extract-handbook.mjs", "--check"],
  ["scripts/check-handbook-i18n.mjs"],
  ["scripts/check-widgets.mjs"],
  ["scripts/check-styles.mjs"],
  ["scripts/check-media-optimization.mjs"],
  [
    "--import",
    "tsx",
    "--test",
    "tests/course-truth.test.ts",
    "tests/handbook-copy.test.ts",
    "tests/handbook-p0.test.ts",
    "tests/lab-draft.test.ts",
    "tests/lab-integration.test.ts",
    "tests/lab-rules.test.ts",
    "tests/lab-runner.test.ts",
    "tests/lab-vitals.test.ts",
    "tests/progress.test.ts",
  ],
];

export function checkAgenticCourse() {
  for (const args of CHECKS) {
    const result = spawnSync(process.execPath, args, {
      cwd: PROJECT,
      encoding: "utf8",
      stdio: "pipe",
    });
    if (result.status !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      throw new Error(`${args.join(" ")} failed${detail ? `:\n${detail}` : ""}`);
    }
  }
  return { checks: CHECKS.length };
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invoked) {
  try {
    const result = checkAgenticCourse();
    const mode = process.argv.includes("--release") ? "release" : "development";
    console.log(
      `agentic course: PASS (${mode}) — ${result.checks} fail-closed checks passed`,
    );
  } catch (error) {
    console.error(
      "agentic course: FAIL — "
      + (error instanceof Error ? error.message : String(error)),
    );
    process.exitCode = 1;
  }
}
