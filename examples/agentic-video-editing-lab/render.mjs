#!/usr/bin/env node

import { statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  assertExistingPathContained,
  assertNewFilePathContained,
  buildReceiptBase,
  copyFileExclusive,
  loadRequiredReceipt,
  loadWorkspace,
  parseCliArguments,
  PROJECT_SPEC_ID,
  readJsonFile,
  sanitizeArguments,
  sha256File,
  spawnMediaTool,
  workspaceRelativePath,
  writeJsonExclusive,
} from "./lab-core.mjs";
import { compileEditPlanV3 } from "./compiler.mjs";

function validateCompileInputs({ plan, approval, planReceipt, workspace }) {
  const actual = {
    editPlan: sha256File(join(workspace, planReceipt.compileInputs.editPlan.relativePath), workspace),
    deliveryContract: sha256File(join(workspace, planReceipt.compileInputs.deliveryContract.relativePath), workspace),
    assetLedger: sha256File(join(workspace, planReceipt.compileInputs.assetLedger.relativePath), workspace),
    toolPolicy: sha256File(join(workspace, planReceipt.compileInputs.toolPolicy.relativePath), workspace),
  };
  for (const [key, hash] of Object.entries(actual)) {
    assert(hash === planReceipt.compileInputs[key].sha256, `${key} changed after planning.`);
    assert(hash === approval.compileInputs[key].sha256, `${key} does not match fixture approval.`);
  }
  assert(actual.editPlan === approval.planSha256, "Approved plan hash does not match plan bytes.");
  assert(JSON.stringify(plan.compileContract?.requires)
    === JSON.stringify(["plan", "delivery-contract", "asset-ledger", "tool-policy"]),
  "Plan compile contract no longer requires the four production inputs.");
  assert(approval.grantsPublicationAuthority === false && approval.grantsRealMediaAuthority === false,
    "Synthetic fixture approval exceeded its authority.");
  return actual;
}

export async function runRender({ runId } = {}) {
  assert(runId, "render requires --run-id from a successful plan stage");
  const workspace = loadWorkspace(runId);
  const { receipt: preflight } = loadRequiredReceipt(workspace, "preflight");
  const { receipt: planReceipt, sha256: planReceiptSha256 } = loadRequiredReceipt(workspace, "plan");
  const planPath = join(workspace, planReceipt.outputs.editPlan.relativePath);
  const approvalPath = join(workspace, planReceipt.outputs.fixturePlanApproval.relativePath);
  const deliveryPath = join(workspace, planReceipt.compileInputs.deliveryContract.relativePath);
  const toolPolicyPath = join(workspace, planReceipt.compileInputs.toolPolicy.relativePath);
  const plan = readJsonFile(planPath, workspace);
  const approval = readJsonFile(approvalPath, workspace);
  const delivery = readJsonFile(deliveryPath, workspace);
  const toolPolicy = readJsonFile(toolPolicyPath, workspace);
  const compileHashes = validateCompileInputs({ plan, approval, planReceipt, workspace });
  assert(plan.projectSpecId === PROJECT_SPEC_ID && delivery.projectSpecId === PROJECT_SPEC_ID, "Project identity drifted.");
  assert(toolPolicy.executables.shell === false && toolPolicy.network.allowed === false
    && toolPolicy.publication.allowed === false && toolPolicy.filesystem.overwriteExisting === false,
  "Tool policy escalated execution authority.");
  for (const input of plan.inputs) {
    const inputPath = join(workspace, input.path);
    assertExistingPathContained(workspace, inputPath);
    assert(sha256File(inputPath, workspace) === input.sha256, `${input.mediaId} bytes changed after approval.`);
    assert((statSync(inputPath).mode & 0o222) === 0, `${input.mediaId} is not read-only.`);
  }

  const outputPath = join(workspace, delivery.candidate.relativePath);
  const outputCaptionPath = join(workspace, delivery.captions.sidecarRelativePath);
  const canaryPath = join(workspace, "render/unapproved-rollback-canary.mp4");
  assertNewFilePathContained(workspace, outputPath);
  assertNewFilePathContained(workspace, outputCaptionPath);
  assertNewFilePathContained(workspace, canaryPath);
  const compilation = compileEditPlanV3({ plan, delivery });
  const filterGraph = compilation.filterGraph;
  const ffmpegArgs = [
    "-hide_banner", "-nostdin", "-n",
    ...plan.inputs.flatMap((input) => ["-i", join(workspace, input.path)]),
    "-filter_complex", filterGraph,
    "-map", "[vout]", "-map", "[aout]",
    "-t", String(delivery.candidate.durationSeconds),
    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-threads", "1",
    "-pix_fmt", "yuv420p", "-r", "30", "-fps_mode", "cfr", "-video_track_timescale", "30000",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "1",
    "-movflags", "+faststart+use_metadata_tags",
    "-metadata", "creation_time=1970-01-01T00:00:00Z",
    "-metadata", `projectSpecId=${PROJECT_SPEC_ID}`,
    "-metadata", `approvedPlanSha256=${compileHashes.editPlan}`,
    "-metadata", "publicationDecision=do-not-publish",
    outputPath,
  ];
  const result = await spawnMediaTool(preflight.tools.ffmpeg.realpath, ffmpegArgs, {
    cwd: workspace,
    timeoutSeconds: toolPolicy.process.timeoutSeconds,
  });
  const evidenceCaptionPath = join(workspace, "evidence/course20-review-candidate.en.vtt");
  copyFileExclusive(evidenceCaptionPath, outputCaptionPath, workspace, workspace);
  copyFileExclusive(outputPath, canaryPath, workspace, workspace);
  for (const input of plan.inputs) {
    assert(sha256File(join(workspace, input.path), workspace) === input.sha256,
      `Render changed ${input.mediaId}.`);
  }

  const commandReceipt = {
    schemaVersion: "aicourse.agentic-video-editing.render-command-receipt.v1",
    projectSpecId: PROJECT_SPEC_ID,
    runId,
    executable: "ffmpeg",
    executableRealpath: preflight.tools.ffmpeg.realpath,
    executableVersion: preflight.tools.ffmpeg.versionSummary,
    argumentTransport: "node-child-process-spawn-string-array",
    shell: false,
    stdin: "disabled-via-stdio-and-nostdin",
    overwrite: "disabled-via-new-path-check-and-ffmpeg-n",
    network: "disabled-by-policy-and-local-argument-allowlist",
    compileInputs: planReceipt.compileInputs,
    compiler: compilation,
    arguments: sanitizeArguments(ffmpegArgs, workspace),
    filterGraph,
    exitCode: result.code,
    stderrTail: result.stderr.slice(-2_000),
  };
  const commandReceiptPath = join(workspace, "receipts/render.command.receipt.json");
  writeJsonExclusive(commandReceiptPath, commandReceipt, workspace);
  const receipt = {
    ...buildReceiptBase("render", runId, workspace),
    status: "pass-awaiting-verification",
    upstream: {
      planReceiptSha256,
      fixturePlanApprovalSha256: sha256File(approvalPath, workspace),
      compileHashes,
    },
    outputs: {
      candidate: { relativePath: workspaceRelativePath(workspace, outputPath), sha256: sha256File(outputPath, workspace) },
      captionSidecar: { relativePath: workspaceRelativePath(workspace, outputCaptionPath), sha256: sha256File(outputCaptionPath, workspace) },
      rollbackCanary: { relativePath: workspaceRelativePath(workspace, canaryPath), sha256: sha256File(canaryPath, workspace) },
      commandReceipt: { relativePath: workspaceRelativePath(workspace, commandReceiptPath), sha256: sha256File(commandReceiptPath, workspace) },
    },
    mutationSummary: {
      sourceChanged: false,
      existingPathOverwritten: false,
      networkRequests: 0,
      publicationActions: 0,
      shellInvocations: 0,
    },
    releaseEligible: false,
  };
  const receiptPath = join(workspace, "receipts/render.receipt.json");
  writeJsonExclusive(receiptPath, receipt, workspace);
  return { runId, workspace, receipt, receiptPath };
}

async function main() {
  const options = parseCliArguments();
  const result = await runRender({ runId: options.runId });
  if (options.json) console.log(JSON.stringify(result.receipt, null, 2));
  else {
    console.log(`PASS Course 20 lab render (${result.runId})`);
    console.log("- four compile inputs matched exact approval hashes; 30/1 portrait candidate rendered locally");
    console.log("- no shell, network, overwrite, source mutation, or publication authority");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  main().catch((error) => {
    console.error(`FAIL Course 20 lab render: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
