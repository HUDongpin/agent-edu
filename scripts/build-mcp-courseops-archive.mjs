#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_ROOT = resolve(ROOT, "tests/fixtures/mcp-courseops");
const OUTPUT = resolve(ROOT, "public/courses/mcp/courseops-reference.zip");
const CHECKSUM = resolve(ROOT, "public/courses/mcp/courseops-reference.sha256");
const FILES = [
  "README.md",
  "package-lock.json",
  "package.json",
  "fixtures/course.json",
  "src/client.mjs",
  "src/server.mjs",
  "test/courseops.test.mjs",
];
const ARCHIVE_MEMBERS = [
  "mcp-courseops/",
  "mcp-courseops/fixtures/",
  "mcp-courseops/src/",
  "mcp-courseops/test/",
  ...FILES.map((file) => `mcp-courseops/${file}`),
].sort();
const FIXED_TIME = new Date("2026-08-24T00:00:00.000Z");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message || result.stderr || `exit ${result.status}`}`);
  return result.stdout;
}

const stagingParent = await mkdtemp(join(tmpdir(), "aicourse-mcp-courseops-"));
try {
  const staging = join(stagingParent, "mcp-courseops");
  const directories = [staging, join(staging, "fixtures"), join(staging, "src"), join(staging, "test")];
  for (const directory of directories) await mkdir(directory, { recursive: true });
  for (const file of FILES) {
    const destination = join(staging, file);
    await copyFile(join(FIXTURE_ROOT, file), destination);
    await utimes(destination, FIXED_TIME, FIXED_TIME);
  }
  for (const directory of directories.toReversed()) await utimes(directory, FIXED_TIME, FIXED_TIME);

  const temporaryArchive = join(stagingParent, "courseops-reference.zip");
  run("zip", ["-X", "-q", temporaryArchive, ...ARCHIVE_MEMBERS], stagingParent);
  const listed = run("unzip", ["-Z1", temporaryArchive], stagingParent).split(/\r?\n/).filter(Boolean).sort();
  if (JSON.stringify(listed) !== JSON.stringify(ARCHIVE_MEMBERS)) throw new Error(`archive member mismatch: ${listed.join(", ")}`);
  for (const file of FILES) {
    const archived = spawnSync("unzip", ["-p", temporaryArchive, `mcp-courseops/${file}`], { encoding: null });
    if (archived.error || archived.status !== 0) throw new Error(`could not read archived ${file}`);
    const source = await readFile(join(FIXTURE_ROOT, file));
    if (!Buffer.from(archived.stdout).equals(source)) throw new Error(`archived ${file} differs from source`);
  }

  const bytes = await readFile(temporaryArchive);
  const hash = createHash("sha256").update(bytes).digest("hex");
  await writeFile(OUTPUT, bytes);
  await writeFile(CHECKSUM, `${hash}  courseops-reference.zip\n`, "utf8");
  console.log(`courseops-reference.zip: ${bytes.length} bytes ${hash}`);
} finally {
  await rm(stagingParent, { recursive: true, force: true });
}
