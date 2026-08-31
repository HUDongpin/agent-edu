#!/usr/bin/env node

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARTIFACT_GRAPH_PATH,
  buildReceiptBase,
  CAPTION_PATH,
  createRunId,
  createWorkspace,
  DELIVERY_CONTRACT_PATH,
  EDIT_PLAN_SCHEMA_PATH,
  executableSummary,
  FAILURE_LEDGER_PATH,
  FIXTURE_EDIT_PLAN_SCHEMA_PATH,
  FIXTURE_MANIFEST_PATH,
  FROZEN_RECEIPT_PATH,
  GOLDEN_EXPECTATIONS_PATH,
  loadPublicContracts,
  NEGATIVE_FIXTURES_PATH,
  parseCliArguments,
  PROJECT_SPEC_PATH,
  resolveMediaTools,
  sanitizeArguments,
  SEGMENT_MAP_PATH,
  sha256File,
  spawnMediaTool,
  TOOL_POLICY_PATH,
  validateFixtureManifest,
  validatePublicContracts,
  writeJsonExclusive,
} from "./lab-core.mjs";

const REQUIRED_FILTERS = [
  "aresample",
  "concat",
  "crop",
  "drawbox",
  "ebur128",
  "fps",
  "freezedetect",
  "scale",
  "signalstats",
  "silencedetect",
];

export async function runPreflight({ runId = createRunId(), bootstrapFrozen = false } = {}) {
  const workspace = createWorkspace(runId);
  let tools;
  try {
    const contracts = loadPublicContracts({ allowMissingFrozen: bootstrapFrozen });
    const failures = [
      ...validatePublicContracts(contracts, { requireFrozen: !bootstrapFrozen }),
      ...(!bootstrapFrozen ? validateFixtureManifest(contracts.fixtureManifest) : []),
    ];
    if (failures.length) throw new Error(`Public lab contract failed:\n- ${failures.join("\n- ")}`);
    tools = await resolveMediaTools();
    const versionArgs = ["-version"];
    const filterArgs = ["-hide_banner", "-filters"];
    const ffmpegVersion = await spawnMediaTool(tools.ffmpeg, versionArgs, { cwd: workspace, timeoutSeconds: 30 });
    const ffprobeVersion = await spawnMediaTool(tools.ffprobe, versionArgs, { cwd: workspace, timeoutSeconds: 30 });
    const filterResult = await spawnMediaTool(tools.ffmpeg, filterArgs, { cwd: workspace, timeoutSeconds: 30 });
    const availableFilters = REQUIRED_FILTERS.filter((filter) => new RegExp(`\\b${filter}\\b`, "u").test(filterResult.stdout));
    if (availableFilters.length !== REQUIRED_FILTERS.length) {
      const missing = REQUIRED_FILTERS.filter((filter) => !availableFilters.includes(filter));
      throw new Error(`FFmpeg build lacks required local filters: ${missing.join(", ")}`);
    }
    const receipt = {
      ...buildReceiptBase("preflight", runId, workspace),
      status: "pass",
      checks: {
        publicContracts: "pass",
        fixedHashes: "pass",
        originalRightsDeclaration: "pass",
        uniqueWorkspaceCreated: "pass",
        symbolicLinksRejected: "pass",
        ffmpegExecutable: "pass",
        ffprobeExecutable: "pass",
        requiredLocalFilters: "pass",
        noPaidApiOrNetworkRequired: "pass",
      },
      bootstrapFrozen,
      contractHashes: {
        projectSpecSha256: sha256File(PROJECT_SPEC_PATH),
        segmentMapSha256: sha256File(SEGMENT_MAP_PATH),
        deliveryContractSha256: sha256File(DELIVERY_CONTRACT_PATH),
        toolPolicySha256: sha256File(TOOL_POLICY_PATH),
        editPlanSchemaSha256: sha256File(EDIT_PLAN_SCHEMA_PATH),
        fixtureEditPlanSchemaSha256: sha256File(FIXTURE_EDIT_PLAN_SCHEMA_PATH),
        captionSha256: sha256File(CAPTION_PATH),
        goldenExpectationsSha256: sha256File(GOLDEN_EXPECTATIONS_PATH),
        failureLedgerSha256: sha256File(FAILURE_LEDGER_PATH),
        negativeFixturesSha256: sha256File(NEGATIVE_FIXTURES_PATH),
        artifactGraphSha256: sha256File(ARTIFACT_GRAPH_PATH),
        fixtureManifestSha256: bootstrapFrozen ? null : sha256File(FIXTURE_MANIFEST_PATH),
        frozenMediaReceiptSha256: bootstrapFrozen ? null : sha256File(FROZEN_RECEIPT_PATH),
      },
      tools: {
        ffmpeg: {
          realpath: tools.ffmpeg,
          versionCommand: sanitizeArguments(versionArgs, workspace),
          versionSummary: executableSummary(ffmpegVersion.stdout || ffmpegVersion.stderr),
        },
        ffprobe: {
          realpath: tools.ffprobe,
          versionCommand: sanitizeArguments(versionArgs, workspace),
          versionSummary: executableSummary(ffprobeVersion.stdout || ffprobeVersion.stderr),
        },
        filters: availableFilters,
      },
      stopCondition: null,
    };
    const receiptPath = join(workspace, "receipts/preflight.receipt.json");
    writeJsonExclusive(receiptPath, receipt, workspace);
    return { runId, workspace, receipt, receiptPath };
  } catch (error) {
    const receipt = {
      ...buildReceiptBase("preflight", runId, workspace),
      status: "blocked",
      blocker: error instanceof Error ? error.message : String(error),
      mediaGenerated: false,
      successClaimed: false,
      stopCondition: "Do not generate, render, verify, or claim success until contracts and both local media tools pass preflight.",
    };
    const receiptPath = join(workspace, "receipts/preflight.receipt.json");
    writeJsonExclusive(receiptPath, receipt, workspace);
    throw new Error(`${receipt.blocker} Blocked receipt: ${receiptPath}`);
  }
}

async function main() {
  const options = parseCliArguments();
  const result = await runPreflight({ runId: options.runId });
  if (options.json) console.log(JSON.stringify(result.receipt, null, 2));
  else {
    console.log(`PASS Course 20 lab preflight (${result.runId})`);
    console.log(`- workspace: ${result.receipt.workspace}`);
    console.log("- public hashes, rights boundary, FFmpeg/ffprobe, and local-only filters passed");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  main().catch((error) => {
    console.error(`FAIL Course 20 lab preflight: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
