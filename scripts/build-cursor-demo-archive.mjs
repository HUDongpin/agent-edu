#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "tests", "fixtures", "cursor-course-demo");
const outputDir = join(root, "public", "courses", "cursor");
const output = join(outputDir, "aicourse-cursor-demo-v1.zip");
const checksumFile = join(outputDir, "aicourse-cursor-demo-v1.sha256");
const expectedFiles = [
  ".gitignore",
  "LICENSE",
  "README.md",
  "app/courses/page.tsx",
  "app/layout.tsx",
  "app/page.tsx",
  "app/styles.css",
  "components/CourseList.tsx",
  "course-fixture.json",
  "eslint.config.mjs",
  "lib/courses.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "scripts/course-verify.mjs",
  "tests/CourseList.test.tsx",
  "tsconfig.json",
];
const ignored = new Set([
  ".DS_Store",
  ".next",
  "course-receipt.json",
  "next-env.d.ts",
  "node_modules",
  "out",
]);
const normalizedTime = new Date("2026-08-23T00:00:00.000Z");

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignored.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else if (entry.isFile()) files.push(absolute);
    else throw new Error(`Unsupported fixture entry (only regular files and directories are allowed): ${absolute}`);
  }

  return files;
}

function run(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      // Info-ZIP stores DOS timestamps in local time. Pinning the child
      // timezone prevents identical source files from producing a different
      // archive hash on machines outside the maintainer's timezone.
      env: { ...process.env, LC_ALL: "C", TZ: "UTC" },
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with status ${code}`));
    });
  });
}

function runCapture(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const stdout = [];
    const stderr = [];
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, LC_ALL: "C", TZ: "UTC" },
    });
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise(Buffer.concat(stdout));
      else reject(new Error(`${command} exited with status ${code}: ${Buffer.concat(stderr).toString("utf8").trim()}`));
    });
  });
}

async function verifyArchive(archivePath, relativeFiles) {
  const listed = (await runCapture("unzip", ["-Z1", archivePath], root))
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  if (listed.join("\n") !== relativeFiles.join("\n")) {
    throw new Error(`Temporary archive member mismatch. Expected: ${relativeFiles.join(", ")}. Actual: ${listed.join(", ")}.`);
  }

  for (const relativePath of relativeFiles) {
    const archived = await runCapture("unzip", ["-p", archivePath, relativePath], root);
    const source = await readFile(join(fixture, relativePath));
    if (!archived.equals(source)) {
      throw new Error(`Temporary archive member differs from fixture source: ${relativePath}`);
    }
  }
}

const stagingParent = await mkdtemp(join(tmpdir(), "aicourse-cursor-archive-"));
const staging = join(stagingParent, "aicourse-cursor-demo");
let publicationParent;

try {
  const sourceFiles = await collect(fixture);
  const relativeFiles = sourceFiles.map((file) => relative(fixture, file)).sort();
  if (relativeFiles.join("\n") !== [...expectedFiles].sort().join("\n")) {
    const expected = new Set(expectedFiles);
    const actual = new Set(relativeFiles);
    const missing = expectedFiles.filter((path) => !actual.has(path));
    const unexpected = relativeFiles.filter((path) => !expected.has(path));
    throw new Error(`Fixture archive allowlist mismatch. Missing: ${missing.join(", ") || "none"}. Unexpected: ${unexpected.join(", ") || "none"}.`);
  }

  for (const path of relativeFiles) {
    const target = join(staging, path);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(fixture, path), target);
    await utimes(target, normalizedTime, normalizedTime);
  }

  await mkdir(outputDir, { recursive: true });
  publicationParent = await mkdtemp(join(outputDir, ".aicourse-cursor-publish-"));
  const temporaryOutput = join(publicationParent, "aicourse-cursor-demo-v1.zip");
  const temporaryChecksumFile = join(publicationParent, "aicourse-cursor-demo-v1.sha256");
  await run("zip", ["-X", "-q", temporaryOutput, ...relativeFiles], staging);
  await verifyArchive(temporaryOutput, relativeFiles);

  const archive = await readFile(temporaryOutput);
  const sha256 = createHash("sha256").update(archive).digest("hex");
  await writeFile(temporaryChecksumFile, `${sha256}  aicourse-cursor-demo-v1.zip\n`, "utf8");

  // Both artifacts are complete and mutually consistent before either public
  // path changes. rename() replaces each file atomically on this filesystem.
  await rename(temporaryOutput, output);
  await rename(temporaryChecksumFile, checksumFile);

  const details = await stat(output);
  console.log(`Created ${relative(root, output)} (${details.size} bytes)`);
  console.log(`SHA-256 ${sha256}`);
} finally {
  await rm(stagingParent, { recursive: true, force: true });
  if (publicationParent) await rm(publicationParent, { recursive: true, force: true });
}
