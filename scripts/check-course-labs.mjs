#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_IDS = [
  "responsible-ai",
  "ai-research",
  "ai-python-data",
  "machine-learning",
  "deep-learning",
  "production-ai",
];

const PYTHON_TESTS = {
  "responsible-ai": "public/courses/responsible-ai/lab/test_lab.py",
  "ai-research": "public/courses/ai-research/lab/test_lab.py",
  "deep-learning": "public/courses/deep-learning/lab/test_lab.py",
  "production-ai": "public/courses/production-ai/lab/test_lab.py",
};

export function courseLabCommand(courseId, root = ROOT) {
  if (courseId === "ai-python-data" || courseId === "machine-learning") {
    return {
      command: process.execPath,
      args: [
        "--import",
        "tsx",
        "--test",
        `--test-name-pattern=${courseId}`,
        "tests/course18-19-labs.test.ts",
      ],
      cwd: root,
    };
  }
  const testPath = PYTHON_TESTS[courseId];
  if (!testPath) throw new Error(`No executable lab test registered for ${courseId}.`);
  return {
    command: "python3",
    args: [join(root, testPath)],
    cwd: join(root, "public/courses", courseId, "lab"),
  };
}

export function runCourseLabGate(courseId, root = ROOT) {
  const profile = courseLabCommand(courseId, root);
  const run = spawnSync(profile.command, profile.args, {
    cwd: profile.cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
      FORCE_COLOR: "0",
      PYTHONDONTWRITEBYTECODE: "1",
      PYTHONHASHSEED: "0",
      TZ: "UTC",
    },
    maxBuffer: 32 * 1024 * 1024,
  });
  const status = typeof run.status === "number" ? run.status : 1;
  return {
    courseId,
    ok: status === 0,
    exitCode: status,
    command: [profile.command, ...profile.args],
    stdout: String(run.stdout || "").trim(),
    stderr: String(run.stderr || run.error || "").trim(),
  };
}

export function formatCourseLabResults(results) {
  const lines = [];
  for (const result of results) {
    lines.push(`${result.courseId} executable lab: ${result.ok ? "PASS" : "FAIL"}`);
    if (result.stdout) lines.push(...result.stdout.split(/\r?\n/).map((line) => `  ${line}`));
    if (result.stderr) lines.push(...result.stderr.split(/\r?\n/).map((line) => `  ${line}`));
  }
  lines.push(`course executable labs: ${results.every((result) => result.ok) ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const courseIndex = process.argv.indexOf("--course");
  const selected = courseIndex >= 0 ? [process.argv[courseIndex + 1]] : COURSE_IDS;
  if (!selected[0] || selected.some((id) => !COURSE_IDS.includes(id))) {
    console.error(`Use --course with one of: ${COURSE_IDS.join(", ")}`);
    process.exitCode = 2;
  } else {
    const results = selected.map((courseId) => runCourseLabGate(courseId));
    if (process.argv.includes("--json")) {
      console.log(JSON.stringify({ ok: results.every((result) => result.ok), results }, null, 2));
    } else {
      console.log(formatCourseLabResults(results));
    }
    if (results.some((result) => !result.ok)) process.exitCode = 1;
  }
}
