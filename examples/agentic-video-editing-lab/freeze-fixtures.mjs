#!/usr/bin/env node

import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
} from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  copyFileExclusive,
  canonicalSha256,
  createRunId,
  EDIT_PLAN_SCHEMA_PATH,
  EXAMPLES_ROOT,
  findStream,
  FROZEN_MEDIA_ROOT,
  FROZEN_RECEIPT_PATH,
  loadWorkspace,
  mediaDurationSeconds,
  PROJECT_ID,
  PROJECT_SPEC_ID,
  COURSE_VERSION,
  PUBLIC_LAB_ROOT,
  PUBLIC_ROOT,
  readJsonFile,
  sha256File,
  writeJsonExclusive,
} from "./lab-core.mjs";
import { runPreflight } from "./preflight.mjs";
import { runGenerate } from "./generate.mjs";

function publicRelative(path) {
  return relative(PUBLIC_ROOT, path).split(sep).join("/");
}

function collectFiles(directory) {
  const files = [];
  for (const name of readdirSync(directory).sort((left, right) => left.localeCompare(right, "en"))) {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Frozen fixture cannot include a symbolic link: ${path}`);
    if (stat.isDirectory()) files.push(...collectFiles(path));
    else if (stat.isFile()) files.push(path);
  }
  return files;
}

export async function freezeFixtures() {
  const runId = createRunId("course20-freeze");
  await runPreflight({ runId, bootstrapFrozen: true });
  const generated = await runGenerate({ runId });
  const workspace = loadWorkspace(runId);
  mkdirSync(FROZEN_MEDIA_ROOT, { recursive: true, mode: 0o755 });
  const originalSource = join(workspace, generated.receipt.outputs.media["source-30-cfr"].relativePath);
  const faultSource = join(workspace, generated.receipt.outputs.media["course20-fault-reel"].relativePath);
  const originalDestination = join(FROZEN_MEDIA_ROOT, "course20-original-fixture.mp4");
  const faultDestination = join(FROZEN_MEDIA_ROOT, "course20-fault-reel.mp4");
  for (const [source, destination] of [
    [originalSource, originalDestination],
    [faultSource, faultDestination],
  ]) {
    const temporary = `${destination}.${runId}.tmp`;
    copyFileExclusive(source, temporary, PUBLIC_LAB_ROOT, workspace);
    chmodSync(temporary, 0o444);
    renameSync(temporary, destination);
  }

  const manifest = readJsonFile(join(workspace, generated.receipt.outputs.mediaManifest.relativePath), workspace);
  const recordById = new Map(manifest.records.map((record) => [record.mediaId, record]));
  const frozenMedia = [
    ["original-fixture", originalDestination, recordById.get("source-30-cfr")],
    ["fault-reel", faultDestination, recordById.get("course20-fault-reel")],
  ].map(([id, path, record]) => {
    const probe = readJsonFile(join(workspace, record.probeRelativePath), workspace);
    const video = findStream(probe, "video");
    const audio = findStream(probe, "audio");
    const observations = {
      durationSeconds: mediaDurationSeconds(probe),
      width: video?.width,
      height: video?.height,
      frameRate: video?.r_frame_rate,
      averageFrameRate: video?.avg_frame_rate,
      audioSampleRateHz: audio?.sample_rate,
      videoCodec: video?.codec_name,
      audioCodec: audio?.codec_name,
    };
    return {
      id,
      path: publicRelative(path),
      sha256: sha256File(path, PUBLIC_LAB_ROOT),
      byteLength: statSync(path).size,
      probeReceiptSha256: canonicalSha256({
        schemaVersion: "aicourse.agentic-video-editing.normalized-probe-observation.v1",
        projectSpecId: PROJECT_SPEC_ID,
        mediaId: id,
        observations,
      }),
      observations,
    };
  });
  const receipt = {
    schemaVersion: "aicourse.agentic-video-editing.frozen-media-receipt.v1",
    projectSpecId: PROJECT_SPEC_ID,
    projectId: PROJECT_ID,
    courseVersion: COURSE_VERSION,
    frozenOn: "2026-08-28",
    generatorSha256: sha256File(join(EXAMPLES_ROOT, "generate.mjs")),
    rendererSha256: sha256File(join(EXAMPLES_ROOT, "lab-core.mjs")),
    sourceRecipeSha256: sha256File(join(PUBLIC_LAB_ROOT, "synthetic-source-recipe.v1.json")),
    ffmpegVersion: generated.receipt.commands[0]?.arguments ? readJsonFile(join(workspace, "receipts/preflight.receipt.json"), workspace).tools.ffmpeg.versionSummary : [],
    sourceRunId: runId,
    media: frozenMedia,
    canonicalRevalidation: {
      courseVersion: COURSE_VERSION,
      sourceDurationSeconds: 122,
      sourceFrameRate: "30/1",
      timelineDurationFrames: 1410,
      conformedInputCount: 1,
      schemaGateOrder: ["general-production-v3", "course20-synthetic-fixture-v3", "cross-field-semantic-compiler"],
      status: "pass",
    },
    reproducibilityBoundary: "Hashes bind these exact committed bytes and this build. Rebuilds on other FFmpeg versions must match structural expectations; cross-build byte identity is not promised.",
    rightsBoundary: "Both files are first-party synthetic controls with no people, personal data, third-party footage, voice performance, or music.",
    publicationDecision: "do-not-publish",
  };
  const receiptTemporary = `${FROZEN_RECEIPT_PATH}.${runId}.tmp`;
  writeJsonExclusive(receiptTemporary, receipt, PUBLIC_LAB_ROOT);
  renameSync(receiptTemporary, FROZEN_RECEIPT_PATH);

  const boundFiles = [
    EDIT_PLAN_SCHEMA_PATH,
    ...collectFiles(PUBLIC_LAB_ROOT).filter((path) => !path.endsWith("fixture-manifest.v1.json")),
  ].sort((left, right) => publicRelative(left).localeCompare(publicRelative(right), "en"));
  const fixtureManifest = {
    schemaVersion: "aicourse.agentic-video-editing.fixture-manifest.v1",
    projectSpecId: PROJECT_SPEC_ID,
    generatedOn: "2026-08-28",
    selfHashExcluded: true,
    files: boundFiles.map((path) => ({ path: publicRelative(path), sha256: sha256File(path, PUBLIC_ROOT), byteLength: statSync(path).size })),
    boundary: "This manifest binds the production-generic v3 schema, the separate Course 20 fixture schema, all public lab contracts, and frozen synthetic media. It excludes only itself to avoid a self-hash cycle.",
  };
  const manifestPath = join(PUBLIC_LAB_ROOT, "fixture-manifest.v1.json");
  const manifestTemporary = `${manifestPath}.${runId}.tmp`;
  writeJsonExclusive(manifestTemporary, fixtureManifest, PUBLIC_LAB_ROOT);
  renameSync(manifestTemporary, manifestPath);
  return { runId, receipt, fixtureManifest };
}

async function main() {
  const result = await freezeFixtures();
  console.log(`PASS Course 20 frozen media (${result.runId})`);
  for (const media of result.receipt.media) console.log(`- ${media.id}: ${media.sha256} (${media.byteLength} bytes)`);
  console.log(`- fixture manifest: ${result.fixtureManifest.files.length} hash-bound files`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  main().catch((error) => {
    console.error(`FAIL Course 20 frozen media: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
