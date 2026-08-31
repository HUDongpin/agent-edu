#!/usr/bin/env node

import {
  buildPlanOnlyReceipt,
  parseCliArguments,
} from "../examples/agentic-video-editing-lab/lab-core.mjs";
import { runLab } from "../examples/agentic-video-editing-lab/run-lab.mjs";

async function main() {
  const options = parseCliArguments();
  const result = options.plan
    ? buildPlanOnlyReceipt()
    : await runLab({ runId: options.runId });
  process.stdout.write(`${JSON.stringify(result, null, options.json ? 0 : 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Course 20 synthetic practicum failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
