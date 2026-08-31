#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { buildPlanOnlyReceipt, createRunId, parseCliArguments } from "./lab-core.mjs";
import { runPreflight } from "./preflight.mjs";
import { runGenerate } from "./generate.mjs";
import { runPlan } from "./plan.mjs";
import { runRender } from "./render.mjs";
import { runVerify } from "./verify.mjs";
import { runRollback } from "./rollback.mjs";
import { runNegativeFixtures } from "./negative-fixtures.mjs";

export async function runLab({ runId = createRunId() } = {}) {
  await runPreflight({ runId });
  await runGenerate({ runId });
  await runPlan({ runId });
  await runRender({ runId });
  const verification = await runVerify({ runId });
  const negativeFixtures = runNegativeFixtures({ runId });
  const rollback = await runRollback({ runId });
  return {
    runId,
    verification: verification.receipt,
    negativeFixtures: negativeFixtures.receipt,
    rollback: rollback.receipt,
  };
}

async function main() {
  const options = parseCliArguments(process.argv.slice(2), { allowAutomaticRunId: true });
  if (options.plan) {
    const receipt = buildPlanOnlyReceipt();
    console.log(JSON.stringify(receipt, null, 2));
    return;
  }
  const result = await runLab({ runId: options.runId });
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`PASS Course 20 complete offline lab (${result.runId})`);
    console.log(`- candidate: ${result.verification.observed.durationSeconds}s, ${result.verification.observed.canvas}, ${result.verification.observed.frameRate}`);
    console.log(`- ${result.negativeFixtures.blockedFixtureCount} negative fixtures blocked before output`);
    console.log(`- rollback: ${result.rollback.terminalState}`);
    console.log("- final boundary: local first-party synthetic evidence only; do-not-publish");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  main().catch((error) => {
    console.error(`FAIL Course 20 complete offline lab: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
