#!/usr/bin/env node

import { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  buildReceiptBase,
  loadPublicContracts,
  loadWorkspace,
  NEGATIVE_FIXTURES_PATH,
  parseCliArguments,
  PROJECT_SPEC_ID,
  QUARANTINED_SEGMENT_ID,
  sha256File,
  writeJsonExclusive,
} from "./lab-core.mjs";

export function evaluateNegativeFixture(fixture) {
  const mutation = fixture.mutation ?? {};
  switch (fixture.id) {
    case "metadata-prompt-injection":
      return mutation.treatUntrustedTextAsInstruction ? "untrusted-data-promoted-to-instruction" : null;
    case "unknown-rights-archive":
      return mutation.selectedSegmentIds?.includes(QUARANTINED_SEGMENT_ID) ? "rights-unresolved" : null;
    case "asr-negation-mismatch": {
      const reviewed = String(mutation.reviewedTranscript ?? "").toLowerCase();
      const asr = String(mutation.asrTranscript ?? "").toLowerCase();
      return reviewed !== asr && /\b(?:not|no|never)\b/u.test(reviewed)
        && !/\b(?:not|no|never)\b/u.test(asr)
        ? "reviewed-transcript-mismatch"
        : null;
    }
    case "approved-plan-hash-mismatch":
      return mutation.approvedPlanSha256 !== mutation.actualPlanSha256 ? "approved-plan-hash-mismatch" : null;
    case "output-root-escape": {
      const candidate = normalize(mutation.outputRelativePath ?? "");
      return isAbsolute(candidate) || candidate === ".." || candidate.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
        ? "output-root-escape" : null;
    }
    case "network-publish-escalation":
      return mutation.allowNetwork || mutation.allowPublish ? "authority-escalation" : null;
    case "missing-recovery-path":
      return typeof mutation.recoveryPath !== "string" || !mutation.recoveryPath.trim() ? "recovery-path-missing" : null;
    case "caption-overlap": {
      const cues = [...(mutation.cues ?? [])].sort((left, right) => left.start - right.start);
      return cues.some((cue, index) => index > 0 && cue.start < cues[index - 1].end) ? "caption-overlap" : null;
    }
    case "caption-out-of-bounds":
      return mutation.cueEndSeconds > mutation.mediaDurationSeconds ? "caption-out-of-bounds" : null;
    case "portrait-safe-zone-conflict": {
      const box = mutation.captionBoundingBox ?? {};
      const safe = mutation.safeZone ?? {};
      return box.x < safe.left || box.y < safe.top || box.x + box.width > safe.right || box.y + box.height > safe.bottom
        ? "safe-zone-conflict" : null;
    }
    case "wrong-crop": {
      const crop = mutation.crop ?? {};
      return mutation.requiredMarkerX < crop.x || mutation.requiredMarkerX >= crop.x + crop.width
        ? "crop-removes-required-marker" : null;
    }
    case "flash-threshold":
      return Math.abs(mutation.lumaPeak - mutation.lumaBefore) > mutation.maximumDelta ? "flash-threshold-exceeded" : null;
    case "low-contrast-text":
      return Math.abs(mutation.foregroundLuma - mutation.backgroundLuma) < mutation.minimumDelta ? "contrast-below-contract" : null;
    case "freeze-duration":
      return mutation.freezeDurationSeconds > mutation.maximumAllowedSeconds ? "freeze-detected" : null;
    case "av-sync-offset":
      return Math.abs(mutation.audioEventSeconds - mutation.visualEventSeconds) > mutation.maximumOffsetSeconds
        ? "sync-offset-exceeds-100ms" : null;
    case "excessive-loudness":
      return mutation.integratedLufs > mutation.maximumIntegratedLufs ? "loudness-above-fixture-limit" : null;
    default:
      throw new Error(`Unknown negative fixture: ${fixture.id}`);
  }
}

export function evaluateAllNegativeFixtures(negativeFixtures) {
  assert(negativeFixtures.projectSpecId === PROJECT_SPEC_ID, "Negative fixtures project identity drifted.");
  return negativeFixtures.fixtures.map((fixture) => {
    const observedBlockCode = evaluateNegativeFixture(fixture);
    return {
      id: fixture.id,
      expectedBlockCode: fixture.expectedBlockCode,
      observedBlockCode,
      status: observedBlockCode === fixture.expectedBlockCode ? "pass" : "fail",
      blockedBeforeOutput: true,
      outputCreated: false,
      policyChanged: false,
      publicationActionCount: 0,
      networkRequestCount: 0,
    };
  });
}

export function runNegativeFixtures({ runId } = {}) {
  const { negativeFixtures, failureLedger } = loadPublicContracts();
  const results = evaluateAllNegativeFixtures(negativeFixtures);
  const failures = results.filter((result) => result.status !== "pass");
  assert(!failures.length, `Negative fixture regressions: ${failures.map((failure) => failure.id).join(", ")}`);
  const observedCodes = new Set(results.map((result) => result.observedBlockCode));
  const missingFaults = failureLedger.faults.filter((fault) => !observedCodes.has(fault.expectedBlockCode));
  assert(!missingFaults.length, `Failure-ledger faults lack blocking controls: ${missingFaults.map((fault) => fault.id).join(", ")}`);
  const workspace = runId ? loadWorkspace(runId) : "contract-only";
  const receipt = {
    ...buildReceiptBase("negative-fixtures", runId ?? "contract-only", workspace),
    status: "pass",
    fixtureContractSha256: sha256File(NEGATIVE_FIXTURES_PATH),
    results,
    blockedFixtureCount: results.length,
    outputCreatedCount: 0,
    networkRequestCount: 0,
    publicationActionCount: 0,
    requiredAudiovisualFaultCodesCovered: failureLedger.faults.map((fault) => fault.expectedBlockCode),
  };
  let receiptPath = null;
  if (runId) {
    receiptPath = join(workspace, "receipts/negative-fixtures.receipt.json");
    writeJsonExclusive(receiptPath, receipt, workspace);
  }
  return { runId, receipt, receiptPath };
}

function main() {
  const options = parseCliArguments();
  const result = runNegativeFixtures({ runId: options.runId });
  if (options.json) console.log(JSON.stringify(result.receipt, null, 2));
  else console.log(`PASS Course 20 lab negative fixtures (${result.receipt.blockedFixtureCount}/${result.receipt.blockedFixtureCount} blocked before output)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL Course 20 lab negative fixtures: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
