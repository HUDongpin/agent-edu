#!/usr/bin/env node

import { lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  buildPlanOnlyReceipt,
  createRunId,
  EDIT_PLAN_SCHEMA_PATH,
  FIXTURE_EDIT_PLAN_SCHEMA_PATH,
  loadPublicContracts,
  PROJECT_SPEC_ID,
  PUBLIC_LAB_ROOT,
  PUBLIC_ROOT,
  REPOSITORY_ROOT,
  sha256File,
  validateFixtureManifest,
  validatePublicContracts,
} from "../examples/agentic-video-editing-lab/lab-core.mjs";
import { evaluateAllNegativeFixtures } from "../examples/agentic-video-editing-lab/negative-fixtures.mjs";
import { runLab } from "../examples/agentic-video-editing-lab/run-lab.mjs";
import { verificationClosureFailures } from "../examples/agentic-video-editing-lab/verify.mjs";

const EXPECTED_PUBLIC_FILES = [
  "NOTICE.md",
  "README.md",
  "course20-fault-reel.en.vtt",
  "course20-review-candidate.en.vtt",
  "delivery-contract.v1.json",
  "edit-plan-v3-fixture.schema.json",
  "expected-artifact-graph.v1.json",
  "failure-ledger.v1.json",
  "fixture-manifest.v1.json",
  "frozen-media-receipt.v1.json",
  "frozen/course20-fault-reel.mp4",
  "frozen/course20-original-fixture.mp4",
  "golden-structural-expectations.v1.json",
  "negative-fixtures.v1.json",
  "project-spec.v2.json",
  "qc-checklist.v1.json",
  "segment-map.v2.json",
  "synthetic-source-recipe.v1.json",
  "tool-policy.v1.json",
  "untrusted-content-fixtures.v1.json",
];
const EXPECTED_EXAMPLE_FILES = [
  "README.md",
  "compiler.mjs",
  "freeze-fixtures.mjs",
  "generate.mjs",
  "lab-core.mjs",
  "negative-fixtures.mjs",
  "plan.mjs",
  "preflight.mjs",
  "render.mjs",
  "rollback.mjs",
  "run-lab.mjs",
  "verify.mjs",
];
const EXAMPLE_ROOT = new URL("../examples/agentic-video-editing-lab/", import.meta.url);
const failures = [];
const add = (condition, message) => { if (!condition) failures.push(message); };

function listFiles(directory, root = directory) {
  const files = [];
  for (const name of readdirSync(directory).sort((left, right) => left.localeCompare(right, "en"))) {
    const path = join(directory, name);
    const stat = lstatSync(path);
    add(!stat.isSymbolicLink(), `${relative(root, path)} must not be a symbolic link`);
    if (stat.isDirectory()) files.push(...listFiles(path, root));
    else if (stat.isFile()) files.push(relative(root, path).split(sep).join("/"));
    else add(false, `${relative(root, path)} must be a regular file or directory`);
  }
  return files;
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function genericProductionPlanSample() {
  const hash = "a".repeat(64);
  return {
    schemaVersion: "aicourse.agentic-video-editing.edit-plan.v3",
    projectSpecId: "client-documentary-2027",
    planId: "client-documentary-plan-v3",
    status: "ready-for-human-review",
    inputs: [{
      mediaId: "camera-a-vfr",
      assetLedgerId: "asset-camera-a",
      path: "media/camera-a.mov",
      sha256: hash,
      probeReceiptSha256: hash,
      clock: {
        rationalRate: { numerator: 30000, denominator: 1001 },
        durationFrames: 300,
        startTimecode: "01:00:00;00",
        dropFrame: true,
        cadence: "VFR",
        ptsReceiptSha256: hash,
        conformReceiptSha256: hash,
      },
      audio: { sampleRate: 48000, durationSamples: 480000, timeBase: { numerator: 1, denominator: 48000 } },
    }],
    rightsDecisions: [{
      rightsDecisionId: "rights-camera-a",
      assetLedgerId: "asset-camera-a",
      exactUse: "conference documentary excerpt",
      destination: "review portal and approved conference screen",
      territory: "named conference venues",
      term: "2027 event season",
      attribution: "speaker and camera operator credits",
      transformation: "trim, caption, crop, mix, and encode",
      modelUploadPermission: true,
      reviewer: { name: "Alex Reviewer", role: "rights owner delegate", authorityBoundary: "screening destinations named in this record only" },
      reviewedAt: "2027-01-15T10:30:00Z",
    }],
    timeline: { editRate: { numerator: 25, denominator: 1 }, durationFrames: 250, startTimecode: "00:00:00:00", dropFrame: false },
    operations: [
      { operationId: "clip-main", type: "clip", trackId: "v1", timelineStartFrame: 0, durationFrames: 250, sourceMediaId: "camera-a-vfr", sourceStartFrame: 0, candidateSegmentId: "candidate-opening", evidenceIds: ["transcript-1", "frame-contact-sheet-1"], rightsDecisionId: "rights-camera-a", reason: "Preserves the reviewed claim and its qualifying context.", confidence: { localization: { value: 0.91, method: "frame-boundary agreement on a held-out manually marked sample", calibrationStatus: "calibrated" }, transcript: { value: 0.97, method: "word-confidence calibration against a blinded correction set", calibrationStatus: "calibrated" }, semanticFit: { value: 0.84, method: "two-reviewer brief-fit rubric without an external calibration set", calibrationStatus: "uncalibrated" } }, ambiguities: [{ kind: "speaker-overlap", evidence: "transcript-1 at 00:00:03", status: "accepted-with-accountable-owner", owner: "Alex Reviewer", resolutionRequirement: "Confirm overlap remains intelligible in the final mix." }], requiresHumanReview: true, reviewState: "approved-for-plan", untrustedTextPromotedToInstruction: false },
      { operationId: "caption-main", type: "caption", trackId: "captions-en", timelineStartFrame: 0, durationFrames: 250, captionId: "cue-main", text: "A production-generic caption.", evidenceIds: ["transcript-1"], safeZoneState: "reviewed-pass", reviewer: "Caption Reviewer" },
      { operationId: "title-main", type: "title", trackId: "g1", timelineStartFrame: 0, durationFrames: 50, text: "Documentary", safeZoneState: "reviewed-pass", reviewer: "Graphics Reviewer" },
      { operationId: "audio-main", type: "audio", trackId: "a1", timelineStartFrame: 0, durationFrames: 250, sampleRate: 48000, mode: "mix", action: "preserve-dialogue-and-normalize", reason: "Mixes dialogue and cleared ambience under the delivery contract." },
      { operationId: "crop-main", type: "crop", trackId: "v1", timelineStartFrame: 0, durationFrames: 250, sourceCrop: { x: 0, y: 0, width: 1920, height: 1080 }, outputCanvas: { width: 1920, height: 1080 }, safeZoneState: "reviewed-pass", reviewer: "Picture Reviewer" },
      { operationId: "transition-main", type: "transition", trackId: "v1", timelineStartFrame: 250, durationFrames: 0, fromClipId: "clip-main", toClipId: "clip-main", transitionKind: "cut" },
    ],
    compileContract: { requires: ["plan", "delivery-contract", "asset-ledger", "tool-policy"], hashBindingStage: "external-compile-receipt-after-plan-freeze" },
    unresolvedCriticalBlockers: [],
    publicationDecision: "eligible-for-human-release-review",
  };
}

const contracts = loadPublicContracts();
for (const failure of validatePublicContracts(contracts)) failures.push(failure);
for (const failure of validateFixtureManifest(contracts.fixtureManifest)) failures.push(`fixture manifest: ${failure}`);
const observedPublicFiles = listFiles(PUBLIC_LAB_ROOT).sort((left, right) => left.localeCompare(right, "en"));
const expectedPublicFiles = [...EXPECTED_PUBLIC_FILES].sort((left, right) => left.localeCompare(right, "en"));
add(same(observedPublicFiles, expectedPublicFiles),
  `public Course 20 lab inventory drifted: ${listFiles(PUBLIC_LAB_ROOT).join(", ")}`);
const exampleNames = readdirSync(EXAMPLE_ROOT).sort((left, right) => left.localeCompare(right, "en"));
add(same(exampleNames, [...EXPECTED_EXAMPLE_FILES].sort((left, right) => left.localeCompare(right, "en"))), `Course 20 example inventory drifted: ${exampleNames.join(", ")}`);
for (const name of exampleNames) {
  const entry = lstatSync(new URL(name, EXAMPLE_ROOT));
  add(entry.isFile() && !entry.isSymbolicLink(), `examples/agentic-video-editing-lab/${name} must be a regular file`);
}

try {
  const generalSchemaSource = readFileSync(EDIT_PLAN_SCHEMA_PATH, "utf8");
  const fixtureSchemaSource = readFileSync(FIXTURE_EDIT_PLAN_SCHEMA_PATH, "utf8");
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateGeneral = ajv.compile(JSON.parse(generalSchemaSource));
  const validateFixture = ajv.compile(JSON.parse(fixtureSchemaSource));
  const productionSample = genericProductionPlanSample();
  add(validateGeneral(productionSample), `General production v3 rejected a non-Course20, one-input VFR plan: ${ajv.errorsText(validateGeneral.errors)}`);
  add(!validateFixture(productionSample), "Course 20 fixture schema incorrectly accepted a generic production plan.");
  const bareConfidenceSample = structuredClone(productionSample);
  bareConfidenceSample.operations.find((operation) => operation.type === "clip").confidence = {
    localization: 0.91,
    transcript: 0.97,
    semanticFit: 0.84,
  };
  add(!validateGeneral(bareConfidenceSample), "General production v3 still accepts bare numeric confidence without method and calibration status.");
  const ambiguousAudioModeSample = structuredClone(productionSample);
  ambiguousAudioModeSample.operations.find((operation) => operation.type === "audio").mode = "preserve";
  add(!validateGeneral(ambiguousAudioModeSample), "General production v3 accepts an audio operation without replacement/mix mode.");
  add(!generalSchemaSource.includes("course20-verified-cut-v2")
    && !generalSchemaSource.includes("local Course 20 synthetic fixture")
    && !generalSchemaSource.includes('"const": 180')
    && !generalSchemaSource.includes('"minItems": 3'),
  "General production v3 still contains fixture-specific identity, duration, rights wording, or input-count constants.");
  add(fixtureSchemaSource.includes("course20-verified-cut-v2")
    && fixtureSchemaSource.includes('"const": 3660')
    && fixtureSchemaSource.includes('"const": 5856000')
    && fixtureSchemaSource.includes('"const": 1410')
    && fixtureSchemaSource.includes('"minItems": 1'),
  "Course 20 fixture schema is missing the explicit synthetic-only constraints.");
} catch (error) {
  failures.push(`edit-plan-v3 schema compilation failed: ${error instanceof Error ? error.message : String(error)}`);
}

const manifestPaths = contracts.fixtureManifest.files.map((record) => record.path);
const expectedManifestPaths = [
  "edit-plan-v3.schema.json",
  ...EXPECTED_PUBLIC_FILES.filter((path) => path !== "fixture-manifest.v1.json").map((path) => `lab/${path}`),
].sort((left, right) => left.localeCompare(right, "en"));
add(same(manifestPaths, expectedManifestPaths), "Fixture manifest must bind the v3 schema and every public lab file except itself.");
add(contracts.fixtureManifest.selfHashExcluded === true, "Fixture manifest must explicitly exclude its own hash.");

add(contracts.frozenReceipt.schemaVersion === "aicourse.agentic-video-editing.frozen-media-receipt.v1"
  && contracts.frozenReceipt.projectSpecId === PROJECT_SPEC_ID
  && contracts.frozenReceipt.courseVersion === "1.2.0", "Frozen media receipt identity or courseVersion drifted.");
add(contracts.projectSpec.courseVersion === "1.2.0", "Lab project-spec courseVersion must be 1.2.0.");
add(contracts.frozenReceipt.canonicalRevalidation?.courseVersion === "1.2.0"
  && contracts.frozenReceipt.canonicalRevalidation.sourceDurationSeconds === 122
  && contracts.frozenReceipt.canonicalRevalidation.sourceFrameRate === "30/1"
  && contracts.frozenReceipt.canonicalRevalidation.timelineDurationFrames === 1410
  && contracts.frozenReceipt.canonicalRevalidation.conformedInputCount === 1
  && same(contracts.frozenReceipt.canonicalRevalidation.schemaGateOrder,
    ["general-production-v3", "course20-synthetic-fixture-v3", "cross-field-semantic-compiler"])
  && contracts.frozenReceipt.canonicalRevalidation.status === "pass",
"Frozen receipt lacks the explicit v1.2.0 122-to-47-second revalidation tuple.");
add(contracts.frozenReceipt.media.length === 2, "Frozen receipt must bind exactly two playable media controls.");
add(contracts.frozenReceipt.generatorSha256 === sha256File(join(REPOSITORY_ROOT, "examples/agentic-video-editing-lab/generate.mjs")),
  "Frozen receipt generator hash drifted.");
add(contracts.frozenReceipt.rendererSha256 === sha256File(join(REPOSITORY_ROOT, "examples/agentic-video-editing-lab/lab-core.mjs")),
  "Frozen receipt pixel-renderer hash drifted.");
add(contracts.frozenReceipt.sourceRecipeSha256 === sha256File(join(PUBLIC_LAB_ROOT, "synthetic-source-recipe.v1.json"), PUBLIC_LAB_ROOT),
  "Frozen receipt source-recipe hash drifted.");
const expectedFrozenMedia = new Map([
  ["original-fixture", { durationSeconds: 122, frameRate: "30/1" }],
  ["fault-reel", { durationSeconds: 6, frameRate: "30/1" }],
]);
for (const media of contracts.frozenReceipt.media) {
  const path = join(PUBLIC_ROOT, media.path);
  const expected = expectedFrozenMedia.get(media.id);
  add(Boolean(expected), `${media.id}: unexpected frozen media identity`);
  add(media.observations.durationSeconds === expected?.durationSeconds
    && media.observations.width === 320 && media.observations.height === 180
    && media.observations.frameRate === expected?.frameRate,
  `${media.id}: frozen v1.2.0 structural tuple drifted`);
  add(sha256File(path, PUBLIC_ROOT) === media.sha256, `${media.id}: frozen media hash drifted`);
  add(statSync(path).size === media.byteLength, `${media.id}: frozen media byte length drifted`);
  add(media.byteLength > 1_000 && media.byteLength < 5_000_000, `${media.id}: frozen media must remain bounded and non-empty`);
  const header = readFileSync(path).subarray(4, 12).toString("ascii");
  add(header.includes("ftyp"), `${media.id}: frozen media lacks an MP4 ftyp signature`);
  add(media.observations.audioSampleRateHz === "48000", `${media.id}: frozen receipt must record 48 kHz audio`);
}
add(contracts.frozenReceipt.publicationDecision === "do-not-publish", "Frozen receipt escalated publication authority.");

const negativeResults = evaluateAllNegativeFixtures(contracts.negativeFixtures);
for (const result of negativeResults) {
  add(result.status === "pass", `${result.id}: expected ${result.expectedBlockCode}, observed ${result.observedBlockCode}`);
  add(result.outputCreated === false && result.networkRequestCount === 0
    && result.publicationActionCount === 0, `${result.id}: blocked fixture produced a side effect`);
}
const failureCodes = contracts.failureLedger.faults.map((fault) => fault.expectedBlockCode);
const observedCodes = new Set(negativeResults.map((result) => result.observedBlockCode));
add(failureCodes.every((code) => observedCodes.has(code)), "Negative fixtures do not close every audiovisual failure-ledger code.");

let planOnly;
try {
  planOnly = buildPlanOnlyReceipt();
  add(planOnly.status === "pass-no-media-executed" && planOnly.mediaToolsRequired === false,
    "Plan-only mode must pass without claiming media execution.");
  add(planOnly.finalPublicationDecision === "do-not-publish", "Plan-only mode escalated publication authority.");
} catch (error) {
  failures.push(`Plan-only contract failed: ${error instanceof Error ? error.message : String(error)}`);
}

const scriptSource = EXPECTED_EXAMPLE_FILES.filter((name) => name.endsWith(".mjs"))
  .map((name) => readFileSync(new URL(name, EXAMPLE_ROOT), "utf8"))
  .join("\n");
add(!/\bexec(?:File|Sync)?\s*\(/u.test(scriptSource), "Lab must not invoke commands through exec/execFile");
add(!/shell\s*:\s*true/u.test(scriptSource), "Lab must never enable a command shell");
add(scriptSource.includes("spawn(realCommand, args") && scriptSource.includes("shell: false"),
  "Lab must invoke FFmpeg/ffprobe through string-array spawn with shell disabled");
add(scriptSource.includes("O_EXCL") && scriptSource.includes("COPYFILE_EXCL") && scriptSource.includes('"-n"'),
  "Lab must combine filesystem exclusive create/copy with FFmpeg no-overwrite mode");
add(scriptSource.includes("realpathSync") && scriptSource.includes("isPathContained")
  && scriptSource.includes("assertNoSymlinkBetween"), "Lab must enforce realpath containment and reject symbolic paths");
add(scriptSource.includes("REMOTE_PROTOCOL") && scriptSource.includes("NETWORK_OPTIONS"),
  "Lab must reject remote protocols and network-capable options");
add(scriptSource.includes("compileContract") && scriptSource.includes("delivery-contract")
  && scriptSource.includes("asset-ledger") && scriptSource.includes("tool-policy"),
"Lab compiler must require plan + delivery contract + asset ledger + tool policy");
add(scriptSource.includes("rationalRate") && scriptSource.includes("ptsReceiptSha256")
  && scriptSource.includes("durationSamples") && scriptSource.includes("modelUploadPermission")
  && scriptSource.includes("calibrationStatus") && scriptSource.includes('mode: "replacement"'),
"Lab v3 fixture must exercise clocks, PTS, audio samples/mode, rights, and calibrated confidence records");
add(!scriptSource.includes("edit-plan.v2.json") && !scriptSource.includes("project-spec.v1.json")
  && !scriptSource.includes("course20-synthetic-candidate.en.vtt"),
"Executable lab still references a retired v1/v2 filename");
const canonicalContractSources = [
  "lab-core.mjs",
  "compiler.mjs",
  "generate.mjs",
  "plan.mjs",
  "freeze-fixtures.mjs",
].map((name) => readFileSync(new URL(name, EXAMPLE_ROOT), "utf8")).join("\n");
const canonicalPublicSources = [
  "project-spec.v2.json",
  "delivery-contract.v1.json",
  "edit-plan-v3-fixture.schema.json",
  "frozen-media-receipt.v1.json",
  "golden-structural-expectations.v1.json",
  "segment-map.v2.json",
  "synthetic-source-recipe.v1.json",
].map((name) => readFileSync(join(PUBLIC_LAB_ROOT, name), "utf8")).join("\n");
for (const token of ['"1.2.0"', '"durationSeconds": 122', '"sourceFrameRate": "30/1 CFR"', '"const": 3660', '"const": 1410']) {
  add(canonicalContractSources.includes(token) || canonicalPublicSources.includes(token),
    `Executable v1.2.0 lab contract is missing canonical token ${token}`);
}
add(!canonicalContractSources.includes('"2.0.0"') && !canonicalPublicSources.includes('"2.0.0"'),
  "Executable lab still contains retired courseVersion 2.0.0.");

const closureHash = "a".repeat(64);
const closureCompileInputs = Object.fromEntries(
  ["editPlan", "deliveryContract", "assetLedger", "toolPolicy"].map(
    (key) => [key, { relativePath: `plan/${key}.json`, sha256: closureHash }],
  ),
);
const closureFixture = {
  actualCompileHashes: Object.fromEntries(
    Object.keys(closureCompileInputs).map((key) => [key, closureHash]),
  ),
  planReceipt: { compileInputs: closureCompileInputs },
  approval: {
    projectSpecId: PROJECT_SPEC_ID,
    compileInputs: closureCompileInputs,
    planSha256: closureHash,
  },
  renderReceipt: {
    status: "pass-awaiting-verification",
    upstream: {
      compileHashes: Object.fromEntries(
        Object.keys(closureCompileInputs).map((key) => [key, closureHash]),
      ),
      fixturePlanApprovalSha256: closureHash,
    },
    outputs: { commandReceipt: { sha256: closureHash } },
  },
  commandReceipt: {
    projectSpecId: PROJECT_SPEC_ID,
    compileInputs: closureCompileInputs,
  },
  approvalSha256: closureHash,
  commandReceiptSha256: closureHash,
};
add(verificationClosureFailures(closureFixture).length === 0,
  "Verification closure rejected its complete four-input baseline.");
for (const key of ["editPlan", "deliveryContract", "assetLedger", "toolPolicy"]) {
  const mutation = structuredClone(closureFixture);
  mutation.actualCompileHashes[key] = "b".repeat(64);
  add(verificationClosureFailures(mutation).length > 0,
    `Verification closure accepted post-render ${key} byte drift.`);
}
for (const [label, mutate] of [
  ["plan approval", (fixture) => { fixture.approvalSha256 = "b".repeat(64); }],
  ["render command receipt", (fixture) => { fixture.commandReceiptSha256 = "b".repeat(64); }],
  ["render status", (fixture) => { fixture.renderReceipt.status = "valid"; }],
]) {
  const mutation = structuredClone(closureFixture);
  mutate(mutation);
  add(verificationClosureFailures(mutation).length > 0,
    `Verification closure accepted stale ${label}.`);
}

const smoke = process.argv.includes("--smoke") || process.env.COURSE20_FFMPEG_SMOKE === "1";
if (!failures.length && smoke) {
  try {
    const result = await runLab({ runId: createRunId("course20-smoke") });
    add(result.verification.status === "pass-for-local-review-only", "FFmpeg smoke verification did not pass");
    add(result.verification.releaseEligible === false
      && result.verification.finalPublicationDecision === "do-not-publish", "FFmpeg smoke escalated release authority");
    add(result.verification.failedCheckIds.length === 0
      && result.verification.observed.audioSampleRateHz === "48000"
      && Math.abs(result.verification.observed.durationSeconds - 47) <= 0.08
      && result.verification.observed.canvas === "1080x1920"
      && result.verification.observed.frameRate === "30/1", "FFmpeg smoke media observations failed");
    add(result.verification.observed.knownBadFaultsBlocked === 8, "FFmpeg smoke did not exercise all eight audiovisual fault families");
    add(result.negativeFixtures.results.length === negativeResults.length
      && result.negativeFixtures.results.every((item) => item.status === "pass"), "FFmpeg smoke negative fixtures failed");
    add(result.rollback.status === "pass-recoverable"
      && result.rollback.terminalState === "verified-candidate-preserved-unapproved-canary-quarantined-do-not-publish",
    "FFmpeg smoke rollback did not preserve the terminal boundary");
    const workspace = join(REPOSITORY_ROOT, result.verification.workspace);
    const plan = JSON.parse(readFileSync(join(workspace, "plan/edit-plan-v3.json"), "utf8"));
    const planReceipt = JSON.parse(readFileSync(join(workspace, "receipts/plan.receipt.json"), "utf8"));
    add(same(planReceipt.schemaValidation?.order,
      ["general-production-v3", "course20-synthetic-fixture-v3", "cross-field-semantic-compiler"])
      && planReceipt.schemaValidation.status === "pass",
    "Smoke did not pass the general schema before the fixture schema and semantic compiler.");
    add(same(plan.compileContract.requires, ["plan", "delivery-contract", "asset-ledger", "tool-policy"]),
      "Smoke plan compile contract drifted");
    add(same([...new Set(plan.operations.map((operation) => operation.type))], ["clip", "caption", "title", "audio", "crop", "transition"]),
      "Smoke plan did not exercise all six operation variants");
    add(plan.inputs.length === 1
      && same(plan.inputs.map((input) => input.mediaId), ["source-30-cfr"])
      && plan.inputs.every((input) => input.clock.rationalRate.numerator === 30
      && input.clock.rationalRate.denominator === 1
      && input.audio.sampleRate === 48000
      && input.clock.durationFrames === 3660
      && input.audio.durationSamples === 5856000), "Smoke plan timing or audio contract drifted");
    add(plan.rightsDecisions.every((decision) => decision.modelUploadPermission === false
      && decision.reviewer.name && decision.reviewedAt), "Smoke plan rights decisions are incomplete");
    const smokeClips = plan.operations.filter((operation) => operation.type === "clip");
    add(smokeClips.every((clip) => ["localization", "transcript", "semanticFit"].every((dimension) => {
      const estimate = clip.confidence?.[dimension];
      return typeof estimate?.value === "number" && typeof estimate.method === "string"
        && ["calibrated", "uncalibrated", "not-applicable"].includes(estimate.calibrationStatus);
    })), "Smoke plan confidence dimensions lack value, method, or calibration status");
    add(plan.operations.find((operation) => operation.type === "audio")?.mode === "replacement",
      "Smoke fixture audio operation lacks explicit replacement mode");
  } catch (error) {
    failures.push(`FFmpeg smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  console.error(`FAIL Course 20 offline lab (${failures.length} finding${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS Course 20 offline lab contract");
console.log("- production-generic edit-plan-v3 passes before the separate Course 20 fixture schema and semantic gate");
console.log("- project-spec.v2 courseVersion 1.2.0 + segment-map.v2 bind the 122-second source to the 47-second, one-input executable lab line");
console.log("- frozen playable media, fixed hashes, original rights, artifact DAG, and do-not-publish boundary close");
console.log(`- ${negativeResults.length}/${negativeResults.length} injection, rights, hash, path, authority, caption, crop, flash, contrast, freeze, sync, loudness, and recovery negatives blocked`);
console.log("- argument-array FFmpeg, no shell/network, O_EXCL/COPYFILE_EXCL, -n, realpath, and rollback controls are enforced");
console.log(smoke ? "- real FFmpeg/ffprobe render → verify → rollback smoke completed" : "- media smoke skipped; pass --smoke or set COURSE20_FFMPEG_SMOKE=1");
