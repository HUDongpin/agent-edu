#!/usr/bin/env node

/**
 * Post-build byte-for-byte audit for Course 20's original public fixtures.
 * Run only after `next build`; Next static export copies `public/` into `out/`.
 */

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_DIRECTORY = "courses/agentic-video-editing";
const SOURCE = join(ROOT, "public", COURSE_DIRECTORY);
const EMITTED = join(ROOT, "out", COURSE_DIRECTORY);
const HASHED_FILES = [
  "creative-brief.fixture.json",
  "media-manifest.fixture.json",
  "edit-plan.schema.json",
  "qc-checklist.md",
  "NOTICE.md",
];
const EXPECTED_FILES = [...HASHED_FILES, "fixtures.provenance.json"];
const failures = [];
const fail = (message) => failures.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

function regularDirectory(path) {
  if (!existsSync(path)) {
    fail(`${rel(path)}: directory is missing; run \`next build\` first.`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail(`${rel(path)}: expected a real directory, not a file or symbolic link.`);
    return false;
  }
  return true;
}

function regularFile(path) {
  if (!existsSync(path)) {
    fail(`${rel(path)}: required file is missing.`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${rel(path)}: expected a regular, non-symbolic file.`);
    return false;
  }
  return true;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseJson(path) {
  if (!regularFile(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${rel(path)}: invalid JSON (${error instanceof Error ? error.message : String(error)}).`);
    return null;
  }
}

const sourceDirectoryReady = regularDirectory(SOURCE);
const emittedDirectoryReady = regularDirectory(EMITTED);
if (!sourceDirectoryReady || !emittedDirectoryReady) {
  console.error(`FAIL Course 20 static fixture audit (${failures.length} finding${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

for (const directory of [SOURCE, EMITTED]) {
  const actual = readdirSync(directory).sort((left, right) => left.localeCompare(right, "en"));
  const expected = [...EXPECTED_FILES].sort((left, right) => left.localeCompare(right, "en"));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${rel(directory)}: expected exactly ${expected.join(", ")}; found ${actual.join(", ") || "nothing"}.`);
  }
  for (const name of actual) regularFile(join(directory, name));
}

const sourceProvenance = parseJson(join(SOURCE, "fixtures.provenance.json"));
const emittedProvenance = parseJson(join(EMITTED, "fixtures.provenance.json"));
if (sourceProvenance && emittedProvenance) {
  if (sourceProvenance.courseId !== "agentic-video-editing"
    || sourceProvenance.schemaVersion !== "aicourse.public-fixtures.provenance.v1"
    || sourceProvenance.fixtureSetVersion !== "1.1.0") {
    fail("Source fixture provenance identity or schema drifted.");
  }
  if (JSON.stringify(sourceProvenance) !== JSON.stringify(emittedProvenance)) {
    fail("Emitted fixtures.provenance.json is not byte-equivalent JSON to the source record.");
  }
}

for (const name of EXPECTED_FILES) {
  const sourcePath = join(SOURCE, name);
  const emittedPath = join(EMITTED, name);
  if (!regularFile(sourcePath) || !regularFile(emittedPath)) continue;
  const sourceBytes = readFileSync(sourcePath);
  const emittedBytes = readFileSync(emittedPath);
  if (!sourceBytes.equals(emittedBytes)) {
    fail(`${COURSE_DIRECTORY}/${name}: emitted bytes differ from public source bytes.`);
  }
}

if (sourceProvenance) {
  const records = Array.isArray(sourceProvenance.files) ? sourceProvenance.files : [];
  for (const name of HASHED_FILES) {
    const sourcePath = join(SOURCE, name);
    const emittedPath = join(EMITTED, name);
    const record = records.find((candidate) => candidate.path === name);
    if (!record || !/^[a-f0-9]{64}$/u.test(record.sha256 ?? "")) {
      fail(`${name}: provenance SHA-256 record is missing or malformed.`);
      continue;
    }
    if (regularFile(sourcePath) && sha256(sourcePath) !== record.sha256) {
      fail(`${name}: public source bytes do not match provenance SHA-256.`);
    }
    if (regularFile(emittedPath) && sha256(emittedPath) !== record.sha256) {
      fail(`${name}: emitted bytes do not match provenance SHA-256.`);
    }
  }
}

if (failures.length) {
  console.error(`FAIL Course 20 static fixture audit (${failures.length} finding${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS Course 20 static fixture audit");
console.log("- five original learning files plus one integrity ledger copied byte-for-byte into out/courses/agentic-video-editing");
console.log("- five learning assets match their SHA-256 provenance records");
console.log("- no missing, extra, or symbolic-linked file entered the emitted fixture set");
console.log("- repository integrity verified; real-media rights, edit quality, and publication approval remain human decisions");
