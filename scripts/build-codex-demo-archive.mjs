#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
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
const fixture = join(root, "tests", "fixtures", "codex-course-demo");
const outputDir = join(root, "public", "courses", "codex");
const output = join(outputDir, "aicourse-codex-demo-v1.zip");
const checksumFile = join(outputDir, "aicourse-codex-demo-v1.sha256");
const ignored = new Set([
  ".DS_Store",
  ".next",
  "course-receipt.json",
  "next-env.d.ts",
  "node_modules",
  "out",
]);
const normalizedTime = new Date("2026-08-21T00:00:00.000Z");

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignored.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else if (entry.isFile()) files.push(absolute);
  }

  return files;
}

function run(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with status ${code}`));
    });
  });
}

const stagingParent = await mkdtemp(join(tmpdir(), "aicourse-codex-archive-"));
const staging = join(stagingParent, "aicourse-codex-demo");

try {
  const sourceFiles = await collect(fixture);
  const relativeFiles = sourceFiles.map((file) => relative(fixture, file)).sort();

  for (const path of relativeFiles) {
    const target = join(staging, path);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(fixture, path), target);
    await utimes(target, normalizedTime, normalizedTime);
  }

  await mkdir(outputDir, { recursive: true });
  await rm(output, { force: true });
  await run("zip", ["-X", "-q", output, ...relativeFiles], staging);

  const archive = await readFile(output);
  const sha256 = createHash("sha256").update(archive).digest("hex");
  await writeFile(checksumFile, `${sha256}  aicourse-codex-demo-v1.zip\n`, "utf8");

  const details = await stat(output);
  console.log(`Created ${relative(root, output)} (${details.size} bytes)`);
  console.log(`SHA-256 ${sha256}`);
} finally {
  await rm(stagingParent, { recursive: true, force: true });
}
