#!/usr/bin/env node

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  buildReceiptBase,
  copyFileExclusive,
  DELIVERY_CONTRACT_PATH,
  EDIT_PLAN_SCHEMA_PATH,
  EXPECTED_OUTPUT_FRAMES,
  FIXTURE_EDIT_PLAN_SCHEMA_PATH,
  loadPublicContracts,
  loadRequiredReceipt,
  loadWorkspace,
  parseCliArguments,
  PROJECT_SPEC_ID,
  QUARANTINED_SEGMENT_ID,
  readJsonFile,
  SAFE_SEGMENT_IDS,
  SOURCE_DURATION_FRAMES,
  SOURCE_DURATION_SECONDS,
  sha256File,
  TOOL_POLICY_PATH,
  validateJsonSchema,
  workspaceRelativePath,
  writeJsonExclusive,
} from "./lab-core.mjs";
import { validateEditPlanV3ForFixture } from "./compiler.mjs";

const PROXY_TO_SOURCE = {
  "source-30-cfr": { sourceMediaId: "source-30-cfr", sourceMode: "30-cfr-canonical", sourceRate: "30/1" },
  "source-24-proxy-30-cfr": { sourceMediaId: "source-24-cfr", sourceMode: "24-cfr", sourceRate: "24/1" },
  "source-ntsc-proxy-30-cfr": { sourceMediaId: "source-30000-1001-cfr", sourceMode: "30000-1001-cfr", sourceRate: "30000/1001" },
  "source-vfr-proxy-30-cfr": { sourceMediaId: "source-vfr", sourceMode: "vfr-native-timestamps", sourceRate: "irregular PTS" },
};

function buildRightsDecision(assetLedgerId) {
  return {
    rightsDecisionId: `rights-${assetLedgerId}`,
    assetLedgerId,
    exactUse: "local Course 20 synthetic fixture rendering and verification",
    destination: "ignored local lab workspace",
    territory: "local workstation only",
    term: "this synthetic test run only",
    attribution: "Course 20 first-party synthetic fixture",
    transformation: "timing conform, reviewed crop, concatenate, encode, and verify",
    modelUploadPermission: false,
    reviewer: {
      name: "Course 20 fixture contract",
      role: "synthetic-fixture rights reviewer",
      authorityBoundary: "not a human approval for learner-owned media or publication",
    },
    reviewedAt: "1970-01-01T00:00:00.000Z",
  };
}

export async function runPlan({ runId } = {}) {
  assert(runId, "plan requires --run-id from a successful generate stage");
  const workspace = loadWorkspace(runId);
  const { receipt: generateReceipt, sha256: generateReceiptSha256 } = loadRequiredReceipt(workspace, "generate");
  assert(generateReceipt.status === "pass", "Generate stage did not pass.");
  const contracts = loadPublicContracts();
  const manifestPath = join(workspace, generateReceipt.outputs.mediaManifest.relativePath);
  const conformPath = join(workspace, generateReceipt.outputs.conformReceipt.relativePath);
  const segmentMapPath = join(workspace, generateReceipt.outputs.segmentMap.relativePath);
  const manifest = readJsonFile(manifestPath, workspace);
  const segmentMap = readJsonFile(segmentMapPath, workspace);
  const manifestById = new Map(manifest.records.map((record) => [record.mediaId, record]));
  const segmentById = new Map(segmentMap.segments.map((segment) => [segment.id, segment]));
  assert(JSON.stringify(segmentMap.canonicalSelectedSegmentIds) === JSON.stringify(SAFE_SEGMENT_IDS), "Canonical segment order drifted.");
  assert(segmentMap.quarantinedSegmentIds.includes(QUARANTINED_SEGMENT_ID), "Unknown-rights scenario is no longer quarantined.");

  const conformReceiptSha256 = sha256File(conformPath, workspace);
  const selectedSegments = SAFE_SEGMENT_IDS.map((segmentId) => {
    const segment = segmentById.get(segmentId);
    assert(segment?.scenarioRightsState === "first-party-synthetic-cleared", `${segmentId} is not eligible.`);
    return segment;
  });
  const inputMediaIds = [...new Set(selectedSegments.map((segment) => segment.sourceMediaId))];
  const inputs = inputMediaIds.map((mediaId) => {
    const proxy = manifestById.get(mediaId);
    const sourceIdentity = PROXY_TO_SOURCE[mediaId];
    const native = manifestById.get(sourceIdentity?.sourceMediaId);
    assert(proxy && native && sourceIdentity, `${mediaId} lacks proxy/native provenance.`);
    assert(proxy.audioSampleRateHz === "48000", `${proxy.mediaId} audio is not 48 kHz.`);
    return {
      mediaId: proxy.mediaId,
      assetLedgerId: proxy.mediaId,
      path: proxy.relativePath,
      sha256: proxy.sha256,
      probeReceiptSha256: proxy.probeSha256,
      clock: {
        rationalRate: { numerator: 30, denominator: 1 },
        durationFrames: SOURCE_DURATION_FRAMES,
        startTimecode: "00:00:00:00",
        dropFrame: false,
        cadence: "CFR",
        ptsReceiptSha256: native.probeSha256,
        conformReceiptSha256,
      },
      audio: {
        sampleRate: 48000,
        durationSamples: SOURCE_DURATION_SECONDS * 48000,
        timeBase: { numerator: 1, denominator: 48000 },
      },
    };
  });
  const rightsDecisions = inputs.map((input) => buildRightsDecision(input.assetLedgerId));
  const segmentMapSha256 = sha256File(segmentMapPath, workspace);
  let timelineStartFrame = 0;
  const clipOperations = SAFE_SEGMENT_IDS.map((segmentId) => {
    const segment = segmentById.get(segmentId);
    const operation = {
      operationId: `clip-${segmentId}`,
      type: "clip",
      trackId: "video-main",
      timelineStartFrame,
      durationFrames: segment.durationFrames,
      sourceMediaId: segment.sourceMediaId,
      sourceStartFrame: segment.inFrame,
      candidateSegmentId: segment.id,
      evidenceIds: [`segment-${segment.id}`, "clock-conform-receipt"],
      rightsDecisionId: `rights-${segment.sourceMediaId}`,
      reason: `Uses the reviewed first-party synthetic ${segment.id} evidence within the declared 122-second source and 47-second four-beat sequence.`,
      confidence: {
        localization: {
          value: 1,
          method: "deterministic fixture frame bounds verified against the 30/1 conformed proxy",
          calibrationStatus: "not-applicable",
        },
        transcript: {
          value: 1,
          method: "first-party authored caption text byte-matched to the reviewed WebVTT sidecar",
          calibrationStatus: "not-applicable",
        },
        semanticFit: {
          value: 0.99,
          method: "fixture-review rubric against the declared four-segment synthetic sequence",
          calibrationStatus: "uncalibrated",
        },
      },
      ambiguities: [],
      requiresHumanReview: true,
      reviewState: "approved-for-synthetic-fixture-only",
      untrustedTextPromotedToInstruction: false,
    };
    timelineStartFrame += segment.durationFrames;
    return operation;
  });
  assert(timelineStartFrame === EXPECTED_OUTPUT_FRAMES, "Canonical clips no longer total 1410 frames.");
  const captions = [
    ["hook", 0, 240, "Hook: intent and evidence come before execution."],
    ["context", 240, 360, "Context: rights, privacy, and untrusted data stay bounded."],
    ["method", 600, 420, "Method: an approved plan and least-privilege policy control rendering."],
    ["close", 1020, 390, "Close: verification never grants publication authority."],
  ].map(([id, start, duration, text]) => ({
    operationId: `caption-${id}`,
    type: "caption",
    trackId: "caption-en",
    timelineStartFrame: start,
    durationFrames: duration,
    captionId: `cue-${id}`,
    text,
    evidenceIds: ["reviewed-caption-sidecar", `timeline-frames-${start}-${start + duration}`],
    safeZoneState: "reviewed-pass",
    reviewer: "Course 20 caption fixture reviewer",
  }));
  const operations = [
    ...clipOperations,
    ...captions,
    { operationId: "title-course20", type: "title", trackId: "graphics", timelineStartFrame: 0, durationFrames: 240, text: "COURSE 20", safeZoneState: "reviewed-pass", reviewer: "Course 20 graphics fixture reviewer" },
    { operationId: "audio-preserve-48khz", type: "audio", trackId: "audio-main", timelineStartFrame: 0, durationFrames: EXPECTED_OUTPUT_FRAMES, sampleRate: 48000, mode: "replacement", action: "preserve-and-resample-to-48khz", reason: "Replaces any implicit render audio with the explicit concatenated source track, preserving test-tone and silence evidence on a declared 48 kHz clock." },
    { operationId: "crop-reviewed-portrait", type: "crop", trackId: "video-main", timelineStartFrame: 0, durationFrames: EXPECTED_OUTPUT_FRAMES, sourceCrop: contracts.deliveryContract.portraitComposition.sourceCrop, outputCanvas: { width: contracts.deliveryContract.candidate.width, height: contracts.deliveryContract.candidate.height }, safeZoneState: "reviewed-pass", reviewer: "Course 20 composition fixture reviewer" },
    { operationId: "transition-hook-context", type: "transition", trackId: "video-main", timelineStartFrame: 240, durationFrames: 0, fromClipId: "clip-hook", toClipId: "clip-context", transitionKind: "cut" },
    { operationId: "transition-context-method", type: "transition", trackId: "video-main", timelineStartFrame: 600, durationFrames: 0, fromClipId: "clip-context", toClipId: "clip-method", transitionKind: "cut" },
    { operationId: "transition-method-close", type: "transition", trackId: "video-main", timelineStartFrame: 1020, durationFrames: 0, fromClipId: "clip-method", toClipId: "clip-close", transitionKind: "cut" },
  ];

  const plan = {
    schemaVersion: "aicourse.agentic-video-editing.edit-plan.v3",
    projectSpecId: PROJECT_SPEC_ID,
    planId: `course20-${runId}-plan-v3`,
    status: "frozen-for-synthetic-fixture-execution",
    inputs,
    rightsDecisions,
    timeline: { editRate: { numerator: 30, denominator: 1 }, durationFrames: EXPECTED_OUTPUT_FRAMES, startTimecode: "00:00:00:00", dropFrame: false },
    operations,
    compileContract: {
      requires: ["plan", "delivery-contract", "asset-ledger", "tool-policy"],
      hashBindingStage: "external-compile-receipt-after-plan-freeze",
    },
    unresolvedCriticalBlockers: [],
    publicationDecision: "do-not-publish",
  };
  validateJsonSchema(EDIT_PLAN_SCHEMA_PATH, plan);
  validateJsonSchema(FIXTURE_EDIT_PLAN_SCHEMA_PATH, plan);
  validateEditPlanV3ForFixture(plan);
  const planPath = join(workspace, "plan/edit-plan-v3.json");
  writeJsonExclusive(planPath, plan, workspace);
  const planSha256 = sha256File(planPath, workspace);

  const deliveryPath = join(workspace, "plan/delivery-contract.v1.json");
  const toolPolicyPath = join(workspace, "plan/tool-policy.v1.json");
  copyFileExclusive(DELIVERY_CONTRACT_PATH, deliveryPath, workspace);
  copyFileExclusive(TOOL_POLICY_PATH, toolPolicyPath, workspace);
  const compileInputs = {
    editPlan: { relativePath: workspaceRelativePath(workspace, planPath), sha256: planSha256 },
    deliveryContract: { relativePath: workspaceRelativePath(workspace, deliveryPath), sha256: sha256File(deliveryPath, workspace) },
    assetLedger: { relativePath: workspaceRelativePath(workspace, manifestPath), sha256: sha256File(manifestPath, workspace) },
    toolPolicy: { relativePath: workspaceRelativePath(workspace, toolPolicyPath), sha256: sha256File(toolPolicyPath, workspace) },
  };
  const approval = {
    schemaVersion: "aicourse.agentic-video-editing.fixture-plan-approval.v1",
    projectSpecId: PROJECT_SPEC_ID,
    runId,
    approvalScope: "canonical-synthetic-fixture-execution-only",
    compileInputs,
    planSha256,
    reviewer: { name: "Course 20 fixture contract", role: "mechanical synthetic-fixture approver" },
    grantsRealMediaAuthority: false,
    grantsPublicationAuthority: false,
    decision: "approve-local-synthetic-render-only",
  };
  const approvalPath = join(workspace, "plan/fixture-plan-approval.v1.json");
  writeJsonExclusive(approvalPath, approval, workspace);
  const dryRun = {
    schemaVersion: "aicourse.agentic-video-editing.mutation-dry-run.v1",
    projectSpecId: PROJECT_SPEC_ID,
    runId,
    compileInputs,
    selectedSegmentIds: SAFE_SEGMENT_IDS,
    excludedSegmentIds: [QUARANTINED_SEGMENT_ID],
    reads: inputs.map((input) => input.path),
    writes: ["render/course20-review-candidate.mp4", "render/course20-review-candidate.en.vtt", "render/unapproved-rollback-canary.mp4"],
    overwriteExisting: false,
    shell: false,
    network: false,
    publish: false,
    recovery: contracts.toolPolicy.mutation.recoveryPath,
  };
  const dryRunPath = join(workspace, "plan/mutation-dry-run.v1.json");
  writeJsonExclusive(dryRunPath, dryRun, workspace);
  const receipt = {
    ...buildReceiptBase("plan", runId, workspace),
    status: "pass-frozen-awaiting-render",
    upstream: { generateReceiptSha256, conformReceiptSha256, segmentMapSha256 },
    outputs: {
      editPlan: { relativePath: workspaceRelativePath(workspace, planPath), sha256: planSha256 },
      fixturePlanApproval: { relativePath: workspaceRelativePath(workspace, approvalPath), sha256: sha256File(approvalPath, workspace) },
      mutationDryRun: { relativePath: workspaceRelativePath(workspace, dryRunPath), sha256: sha256File(dryRunPath, workspace) },
      deliveryContract: compileInputs.deliveryContract,
      assetLedger: compileInputs.assetLedger,
      toolPolicy: compileInputs.toolPolicy,
    },
    compileInputs,
    schemaValidation: {
      order: ["general-production-v3", "course20-synthetic-fixture-v3", "cross-field-semantic-compiler"],
      generalSchemaSha256: sha256File(EDIT_PLAN_SCHEMA_PATH),
      fixtureSchemaSha256: sha256File(FIXTURE_EDIT_PLAN_SCHEMA_PATH),
      status: "pass",
    },
    operationTypes: [...new Set(operations.map((operation) => operation.type))],
  };
  const receiptPath = join(workspace, "receipts/plan.receipt.json");
  writeJsonExclusive(receiptPath, receipt, workspace);
  return { runId, workspace, receipt, receiptPath };
}

async function main() {
  const options = parseCliArguments();
  const result = await runPlan({ runId: options.runId });
  if (options.json) console.log(JSON.stringify(result.receipt, null, 2));
  else {
    console.log(`PASS Course 20 lab plan (${result.runId})`);
    console.log("- edit-plan-v3 validated with clock/audio/rights/confidence/ambiguity contracts");
    console.log("- compile input hashes bind plan + delivery + asset ledger + tool policy");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  main().catch((error) => {
    console.error(`FAIL Course 20 lab plan: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
