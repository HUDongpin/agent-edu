#!/usr/bin/env node

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  buildReceiptBase,
  loadRequiredReceipt,
  loadWorkspace,
  moveFileExclusive,
  parseCliArguments,
  readJsonFile,
  sha256File,
  workspaceRelativePath,
  writeJsonExclusive,
} from "./lab-core.mjs";

export async function runRollback({ runId } = {}) {
  assert(runId, "rollback requires --run-id from a successful verify stage");
  const workspace = loadWorkspace(runId);
  const { receipt: planReceipt } = loadRequiredReceipt(workspace, "plan");
  const { receipt: renderReceipt } = loadRequiredReceipt(workspace, "render");
  const { receipt: verifyReceipt, sha256: verifyReceiptSha256 } = loadRequiredReceipt(workspace, "verify");
  assert(verifyReceipt.status === "pass-for-local-review-only", "Rollback drill requires a verified local candidate.");
  const candidatePath = join(workspace, renderReceipt.outputs.candidate.relativePath);
  const candidateSha256Before = sha256File(candidatePath, workspace);
  const canaryPath = join(workspace, renderReceipt.outputs.rollbackCanary.relativePath);
  const canarySha256Before = sha256File(canaryPath, workspace);
  const quarantinePath = join(workspace, "rollback/quarantine/unapproved-rollback-canary.mp4");
  moveFileExclusive(canaryPath, quarantinePath, workspace);
  const quarantinedSha256 = sha256File(quarantinePath, workspace);
  assert(quarantinedSha256 === canarySha256Before, "Rollback changed the unapproved canary bytes.");
  assert(sha256File(candidatePath, workspace) === candidateSha256Before, "Rollback changed the verified candidate.");
  const plan = readJsonFile(join(workspace, planReceipt.outputs.editPlan.relativePath), workspace);
  const sourceChecks = plan.inputs.map((input) => ({
    mediaId: input.mediaId,
    expectedSha256: input.sha256,
    observedSha256: sha256File(join(workspace, input.path), workspace),
  }));
  assert(sourceChecks.every((check) => check.expectedSha256 === check.observedSha256), "Rollback changed an immutable source proxy.");
  const receipt = {
    ...buildReceiptBase("rollback", runId, workspace),
    status: "pass-recoverable",
    upstream: { verifyReceiptSha256, candidateSha256: candidateSha256Before },
    action: {
      kind: "quarantine-unapproved-canary",
      from: renderReceipt.outputs.rollbackCanary.relativePath,
      to: workspaceRelativePath(workspace, quarantinePath),
      sha256Before: canarySha256Before,
      sha256After: quarantinedSha256,
      existingArtifactOverwritten: false,
      verifiedCandidatePreserved: true,
      sourcesPreserved: true,
    },
    sourceChecks,
    terminalState: "verified-candidate-preserved-unapproved-canary-quarantined-do-not-publish",
    releaseEligible: false,
    recoveryBoundary: "This reversible drill moves only a synthetic unapproved copy inside the unique run workspace; it never deletes user media or rewrites the verified candidate.",
  };
  const receiptPath = join(workspace, "receipts/rollback.receipt.json");
  writeJsonExclusive(receiptPath, receipt, workspace);
  return { runId, workspace, receipt, receiptPath };
}

async function main() {
  const options = parseCliArguments();
  const result = await runRollback({ runId: options.runId });
  if (options.json) console.log(JSON.stringify(result.receipt, null, 2));
  else {
    console.log(`PASS Course 20 lab rollback (${result.runId})`);
    console.log("- unapproved media canary quarantined with the same hash");
    console.log("- verified candidate, immutable sources, receipts, and do-not-publish boundary preserved");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  main().catch((error) => {
    console.error(`FAIL Course 20 lab rollback: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
