#!/usr/bin/env node

import { statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  buildReceiptBase,
  findStream,
  FRAME_RATE,
  loadPublicContracts,
  loadRequiredReceipt,
  loadWorkspace,
  mediaDurationSeconds,
  parseCliArguments,
  parseWebVtt,
  PROJECT_SPEC_ID,
  readJsonFile,
  readUtf8File,
  sanitizeArguments,
  sha256File,
  spawnMediaTool,
  workspaceRelativePath,
  writeJsonExclusive,
} from "./lab-core.mjs";
import { evaluateAllNegativeFixtures } from "./negative-fixtures.mjs";

const COMPILE_INPUT_KEYS = [
  "editPlan",
  "deliveryContract",
  "assetLedger",
  "toolPolicy",
];

export function verificationClosureFailures({
  actualCompileHashes,
  planReceipt,
  approval,
  renderReceipt,
  commandReceipt,
  approvalSha256,
  commandReceiptSha256,
}) {
  const failures = [];
  for (const key of COMPILE_INPUT_KEYS) {
    const actual = actualCompileHashes[key];
    for (const [label, expected] of [
      ["plan receipt", planReceipt.compileInputs?.[key]?.sha256],
      ["independent fixture approval", approval.compileInputs?.[key]?.sha256],
      ["render receipt", renderReceipt.upstream?.compileHashes?.[key]],
      ["render command receipt", commandReceipt.compileInputs?.[key]?.sha256],
    ]) {
      if (!/^[0-9a-f]{64}$/u.test(String(actual)) || actual !== expected) {
        failures.push(`${key} no longer matches the ${label} hash.`);
      }
    }
  }
  if (approval.planSha256 !== actualCompileHashes.editPlan) {
    failures.push("The independent approval no longer binds the current plan bytes.");
  }
  if (renderReceipt.upstream?.fixturePlanApprovalSha256 !== approvalSha256) {
    failures.push("The current plan-approval receipt bytes no longer match the render receipt.");
  }
  if (renderReceipt.outputs?.commandReceipt?.sha256 !== commandReceiptSha256) {
    failures.push("The current render command receipt bytes no longer match the render receipt.");
  }
  if (renderReceipt.status !== "pass-awaiting-verification") {
    failures.push("The render receipt is not in the expected pre-verification state.");
  }
  if (commandReceipt.projectSpecId !== PROJECT_SPEC_ID
    || approval.projectSpecId !== PROJECT_SPEC_ID) {
    failures.push("The approval or render command receipt belongs to another project specification.");
  }
  return failures;
}

function addCheck(checks, id, passed, observed, expected, layer) {
  checks.push({ id, layer, status: passed ? "pass" : "fail", observed, expected });
}

function lastIntegratedLufs(text) {
  const values = [...text.matchAll(/\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/gu)].map((match) => Number(match[1]));
  return values.at(-1) ?? null;
}

function lumaRange(text) {
  const values = [...text.matchAll(/lavfi\.signalstats\.YAVG=(\d+(?:\.\d+)?)/gu)].map((match) => Number(match[1]));
  return values.length ? { minimum: Math.min(...values), maximum: Math.max(...values), delta: Math.max(...values) - Math.min(...values) } : null;
}

function cueChecks(cues, duration) {
  return {
    count: cues.length,
    nonOverlapping: cues.every((cue, index) => index === 0 || cue.start >= cues[index - 1].end),
    withinDuration: cues.every((cue) => cue.start >= 0 && cue.end <= duration && cue.end > cue.start),
    noActiveContent: cues.every((cue) => !/[<>]|https?:\/\//iu.test(cue.text)),
  };
}

export async function runVerify({ runId } = {}) {
  assert(runId, "verify requires --run-id from a successful render stage");
  const workspace = loadWorkspace(runId);
  const { receipt: preflight } = loadRequiredReceipt(workspace, "preflight");
  const { receipt: generateReceipt } = loadRequiredReceipt(workspace, "generate");
  const { receipt: planReceipt } = loadRequiredReceipt(workspace, "plan");
  const { receipt: renderReceipt, sha256: renderReceiptSha256 } = loadRequiredReceipt(workspace, "render");
  const contracts = loadPublicContracts();
  const planPath = join(workspace, planReceipt.outputs.editPlan.relativePath);
  const approvalPath = join(workspace, planReceipt.outputs.fixturePlanApproval.relativePath);
  const commandReceiptPath = join(workspace, renderReceipt.outputs.commandReceipt.relativePath);
  const plan = readJsonFile(planPath, workspace);
  const approval = readJsonFile(approvalPath, workspace);
  const commandReceipt = readJsonFile(commandReceiptPath, workspace);
  const actualCompileHashes = Object.fromEntries(
    COMPILE_INPUT_KEYS.map((key) => [
      key,
      sha256File(join(workspace, planReceipt.compileInputs[key].relativePath), workspace),
    ]),
  );
  const closureFailures = verificationClosureFailures({
    actualCompileHashes,
    planReceipt,
    approval,
    renderReceipt,
    commandReceipt,
    approvalSha256: sha256File(approvalPath, workspace),
    commandReceiptSha256: sha256File(commandReceiptPath, workspace),
  });
  assert(!closureFailures.length, `Verification compile-input closure blocked: ${closureFailures.join(" ")}`);
  const outputPath = join(workspace, renderReceipt.outputs.candidate.relativePath);
  const captionPath = join(workspace, renderReceipt.outputs.captionSidecar.relativePath);
  const faultPath = join(workspace, generateReceipt.outputs.media["course20-fault-reel"].relativePath);
  const faultCaptionPath = join(workspace, generateReceipt.outputs.faultCaptions.relativePath);
  const probeArgs = ["-v", "error", "-show_format", "-show_streams", "-count_frames", "-of", "json", outputPath];
  const probeResult = await spawnMediaTool(preflight.tools.ffprobe.realpath, probeArgs, { cwd: workspace, timeoutSeconds: 60 });
  const probe = JSON.parse(probeResult.stdout);
  const video = findStream(probe, "video");
  const audio = findStream(probe, "audio");
  const duration = mediaDurationSeconds(probe);
  const captions = parseWebVtt(readUtf8File(captionPath, workspace));
  const canonicalCaptionChecks = cueChecks(captions, duration);

  const detectorArgs = [
    "-hide_banner", "-nostdin", "-n", "-i", faultPath,
    "-vf", "freezedetect=n=-50dB:d=0.5",
    "-af", "silencedetect=n=-50dB:d=0.25",
    "-f", "null", "-",
  ];
  const detectorResult = await spawnMediaTool(preflight.tools.ffmpeg.realpath, detectorArgs, { cwd: workspace, timeoutSeconds: 60 });
  const statsArgs = [
    "-hide_banner", "-nostdin", "-n", "-i", faultPath,
    "-vf", "signalstats,metadata=print",
    "-af", "ebur128=peak=true",
    "-f", "null", "-",
  ];
  const statsResult = await spawnMediaTool(preflight.tools.ffmpeg.realpath, statsArgs, { cwd: workspace, timeoutSeconds: 60 });
  const detectorText = `${detectorResult.stdout}\n${detectorResult.stderr}`;
  const statsText = `${statsResult.stdout}\n${statsResult.stderr}`;
  const luma = lumaRange(statsText);
  const integratedLufs = lastIntegratedLufs(statsText);
  const silenceEnd = Number(detectorText.match(/silence_end:\s*(\d+(?:\.\d+)?)/u)?.[1]);
  const actualFaultObservations = {
    freezeDetected: /freeze_start/iu.test(detectorText),
    silenceDetected: /silence_start/iu.test(detectorText),
    firstSilenceEndSeconds: Number.isFinite(silenceEnd) ? silenceEnd : null,
    luma,
    integratedLufs,
    flashThresholdExceeded: Boolean(luma && luma.delta > 80),
    syncOffsetSeconds: Number.isFinite(silenceEnd) ? Math.abs(silenceEnd - 4) : null,
    loudnessAboveFixtureLimit: Number.isFinite(integratedLufs) ? integratedLufs > -24 : false,
  };
  const negativeResults = evaluateAllNegativeFixtures(contracts.negativeFixtures);
  const faultCodes = new Set(negativeResults.filter((result) => result.status === "pass").map((result) => result.observedBlockCode));
  const missingFaultCodes = contracts.failureLedger.faults
    .map((fault) => fault.expectedBlockCode)
    .filter((code) => !faultCodes.has(code));

  const checks = [];
  addCheck(checks, "project-identity", plan.projectSpecId === PROJECT_SPEC_ID, plan.projectSpecId, PROJECT_SPEC_ID, "semantic");
  addCheck(checks, "duration", Math.abs(duration - contracts.golden.candidate.durationSeconds) <= contracts.golden.candidate.durationToleranceSeconds, duration, contracts.golden.candidate.durationSeconds, "technical");
  addCheck(
    checks,
    "portrait-canvas",
    video?.width === contracts.golden.candidate.width
      && video?.height === contracts.golden.candidate.height,
    `${video?.width}x${video?.height}`,
    `${contracts.golden.candidate.width}x${contracts.golden.candidate.height}`,
    "technical",
  );
  addCheck(checks, "frame-rate", video?.r_frame_rate === FRAME_RATE && video?.avg_frame_rate === FRAME_RATE, { r: video?.r_frame_rate, average: video?.avg_frame_rate }, FRAME_RATE, "technical");
  addCheck(checks, "audio-48khz", audio?.sample_rate === "48000", audio?.sample_rate, "48000", "technical");
  addCheck(checks, "candidate-hash", sha256File(outputPath, workspace) === renderReceipt.outputs.candidate.sha256, sha256File(outputPath, workspace), renderReceipt.outputs.candidate.sha256, "delivery");
  addCheck(
    checks,
    "caption-count",
    canonicalCaptionChecks.count === contracts.golden.candidate.captionCueCount,
    canonicalCaptionChecks.count,
    contracts.golden.candidate.captionCueCount,
    "captions",
  );
  addCheck(checks, "caption-non-overlap", canonicalCaptionChecks.nonOverlapping, canonicalCaptionChecks.nonOverlapping, true, "captions");
  addCheck(checks, "caption-bounds", canonicalCaptionChecks.withinDuration, canonicalCaptionChecks.withinDuration, true, "captions");
  addCheck(checks, "caption-untrusted-data", canonicalCaptionChecks.noActiveContent, canonicalCaptionChecks.noActiveContent, true, "captions");
  for (const key of COMPILE_INPUT_KEYS) {
    addCheck(
      checks,
      `compile-${key}-hash`,
      actualCompileHashes[key] === planReceipt.compileInputs[key].sha256,
      actualCompileHashes[key],
      planReceipt.compileInputs[key].sha256,
      "delivery",
    );
  }
  for (const input of plan.inputs) {
    const inputPath = join(workspace, input.path);
    addCheck(checks, `source-unchanged-${input.mediaId}`, sha256File(inputPath, workspace) === input.sha256, sha256File(inputPath, workspace), input.sha256, "provenance");
    addCheck(checks, `source-read-only-${input.mediaId}`, (statSync(inputPath).mode & 0o222) === 0, (statSync(inputPath).mode & 0o777).toString(8), "no write bits", "provenance");
  }
  addCheck(checks, "network-boundary", renderReceipt.mutationSummary.networkRequests === 0, renderReceipt.mutationSummary.networkRequests, 0, "authority");
  addCheck(checks, "publication-boundary", renderReceipt.mutationSummary.publicationActions === 0 && plan.publicationDecision === "do-not-publish", plan.publicationDecision, "do-not-publish", "authority");
  addCheck(checks, "fault-freeze-control", actualFaultObservations.freezeDetected, actualFaultObservations.freezeDetected, true, "negative-controls");
  addCheck(checks, "fault-silence-control", actualFaultObservations.silenceDetected, actualFaultObservations.silenceDetected, true, "negative-controls");
  addCheck(checks, "fault-flash-control", actualFaultObservations.flashThresholdExceeded, actualFaultObservations.luma, "luma delta > 80", "negative-controls");
  addCheck(checks, "fault-sync-control", Number(actualFaultObservations.syncOffsetSeconds) > 0.1, actualFaultObservations.syncOffsetSeconds, "> 0.1 seconds", "negative-controls");
  addCheck(checks, "fault-loudness-control", actualFaultObservations.loudnessAboveFixtureLimit, actualFaultObservations.integratedLufs, "> -24 LUFS fixture limit", "negative-controls");
  addCheck(checks, "fault-ledger-coverage", missingFaultCodes.length === 0, missingFaultCodes, [], "negative-controls");
  const failures = checks.filter((check) => check.status !== "pass");

  const report = {
    schemaVersion: "aicourse.agentic-video-editing.verification-report.v1",
    projectSpecId: PROJECT_SPEC_ID,
    runId,
    status: failures.length ? "blocked" : "pass-for-local-review-only",
    layers: Object.fromEntries([...new Set(checks.map((check) => check.layer))].map((layer) => [layer, checks.filter((check) => check.layer === layer)])),
    allChecks: checks,
    knownBadControlEvidence: {
      faultReelRelativePath: workspaceRelativePath(workspace, faultPath),
      faultReelSha256: sha256File(faultPath, workspace),
      faultCaptionRelativePath: workspaceRelativePath(workspace, faultCaptionPath),
      faultCaptionSha256: sha256File(faultCaptionPath, workspace),
      observations: actualFaultObservations,
      negativeFixtureResults: negativeResults,
      detectorCommands: [
        { executable: "ffmpeg", arguments: sanitizeArguments(detectorArgs, workspace), shell: false },
        { executable: "ffmpeg", arguments: sanitizeArguments(statsArgs, workspace), shell: false },
      ],
      boundary: "Known-bad controls validate rejection paths; they are not release candidates and never receive automatic repair.",
    },
    unresolvedCriticalBlockers: failures.map((failure) => failure.id),
    regressionStatus: failures.length ? "blocked" : "pass",
    publicationDecision: "do-not-publish",
    boundary: "Automated checks do not judge narrative quality, real-media rights, accessibility completeness, legal clearance, or publication authority.",
  };
  const reportPath = join(workspace, "evidence/verification-report.v1.json");
  writeJsonExclusive(reportPath, report, workspace);
  const probePath = join(workspace, "evidence/candidate.ffprobe.json");
  writeJsonExclusive(probePath, probe, workspace);
  const receipt = {
    ...buildReceiptBase("verify", runId, workspace),
    status: failures.length ? "blocked" : "pass-for-local-review-only",
    upstream: {
      renderReceiptSha256,
      candidateSha256: renderReceipt.outputs.candidate.sha256,
      compileInputs: planReceipt.compileInputs,
      reverifiedCompileHashes: actualCompileHashes,
      planApprovalSha256: sha256File(approvalPath, workspace),
      renderCommandReceiptSha256: sha256File(commandReceiptPath, workspace),
    },
    probeCommand: { executable: "ffprobe", arguments: sanitizeArguments(probeArgs, workspace), shell: false, network: false },
    observed: {
      durationSeconds: duration,
      canvas: `${video?.width}x${video?.height}`,
      frameRate: video?.r_frame_rate,
      videoCodec: video?.codec_name,
      audioCodec: audio?.codec_name,
      audioSampleRateHz: audio?.sample_rate,
      captionCueCount: captions.length,
      knownBadFaultsBlocked: contracts.failureLedger.faults.length,
    },
    outputs: {
      verificationReport: { relativePath: workspaceRelativePath(workspace, reportPath), sha256: sha256File(reportPath, workspace) },
      candidateProbe: { relativePath: workspaceRelativePath(workspace, probePath), sha256: sha256File(probePath, workspace) },
    },
    passedCheckCount: checks.length - failures.length,
    failedCheckIds: failures.map((failure) => failure.id),
    releaseEligible: false,
    requiredNamedHumanDecision: "do-not-publish",
  };
  const receiptPath = join(workspace, "receipts/verify.receipt.json");
  writeJsonExclusive(receiptPath, receipt, workspace);
  assert(!failures.length, `Verification blocked: ${failures.map((failure) => failure.id).join(", ")}`);
  return { runId, workspace, receipt, receiptPath };
}

async function main() {
  const options = parseCliArguments();
  const result = await runVerify({ runId: options.runId });
  if (options.json) console.log(JSON.stringify(result.receipt, null, 2));
  else {
    console.log(`PASS Course 20 lab verify (${result.runId})`);
    console.log(`- ${result.receipt.observed.durationSeconds}s, ${result.receipt.observed.canvas}, ${result.receipt.observed.frameRate}, 48 kHz audio`);
    console.log(`- ${result.receipt.observed.knownBadFaultsBlocked} caption/safe-zone/crop/flash/contrast/freeze/sync/loudness controls blocked`);
    console.log("- final publication decision remains do-not-publish");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  main().catch((error) => {
    console.error(`FAIL Course 20 lab verify: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
