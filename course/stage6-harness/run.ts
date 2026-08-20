/** Stage 6 — the same agent, wrapped in the boring code that makes it safe. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient, meter, MODEL, preflight, spend, tuning } from "../cafe/llm";
import * as tools from "../cafe/tools";

/** Anything above this needs a human. Money is the classic irreversible action. */
export const APPROVAL_THRESHOLD = 100.0;
export const UNIT_COST: Record<string, number> = {
  coffee_beans: 18.0, cups_12oz: 0.04, oat_milk: 2.1, tea: 4.0,
};

export const RUN_LOG: string[] = [];

/**
 * The approver for an unattended 3am run.
 *
 * This is the whole reason a gate is worth building. The interesting question
 * is not "will a human say yes?" — it is "what happens when there is no human
 * at all?" A gate whose default is *allow* is not a gate. Swap this for a
 * readline prompt and you have a human in the loop.
 */
export function nobodyIsAwake(): boolean { return false; }

export interface Parts { retry: boolean; errors: boolean; gate: boolean; log: boolean }

/**
 * Run one tool call. Returns [resultText, isError].
 *
 * This function is the harness. Everything the model asks for comes through
 * here, which makes it the right place for every rule you actually want
 * enforced.
 */
export async function callTool(
  name: string, args: any, parts: Parts, approve: (q: string) => boolean = () => true,
): Promise<[string, boolean]> {
  // -- gate ---------------------------------------------------------------
  // TODO 1: if parts.gate and this is a place_order that would take the run's
  // TOTAL committed spend past APPROVAL_THRESHOLD, do not run it. Call
  // approve(question); if it returns false, return a plain-language refusal
  // as an error result so the model can adapt.
  //
  // Total, not just this one order. A per-order cap gets stepped around
  // without anyone intending it: refuse a single $180 order and the model
  // will place three $60 ones, because it is still trying to finish the job.
  // You can read what is already committed off tools.ORDERS.

  // -- run, with retry and timeout ----------------------------------------
  const attempts = parts.retry ? 2 : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // TODO 2: call tools.RUNNERS[name](args) and return its result.
      // A real harness would also bound this with a timeout; the fake tools
      // here return instantly, so a comment is honest enough.
      throw new Error("TODO 2");
    } catch (exc) {
      if ((exc as Error).message === "TODO 2") throw exc;
      if (attempt < attempts) {
        if (parts.log) RUN_LOG.push(`${name} failed (${(exc as Error).message}); retrying`);
        continue;
      }
      // -- useful errors --------------------------------------------------
      // TODO 3: when parts.errors is true, return the real reason so the
      // model can act on it. When it is false, return the bare string "Error"
      // and watch what that does to the run.
      throw new Error("TODO 3");
    }
  }
  return ["Error", true];
}

/** Run the restock job once, with the given harness parts switched on. */
export async function runAgent(parts: Parts) {
  const client = getClient();
  tools.reset();
  RUN_LOG.length = 0;
  const messages: any[] = [{
    role: "user",
    content: "Restock the café: order enough of whatever is running short.",
  }];

  for (let i = 0; i < 8; i++) {
    const response: any = await client.messages.create({
      model: MODEL, max_tokens: 2000, tools: tools.SCHEMAS as any, messages, ...tuning(),
    } as any);
    meter(response);
    if (response.stop_reason === "end_turn" || response.stop_reason === "refusal") break;

    messages.push({ role: "assistant", content: response.content });
    const results: any[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const [text, failed] = await callTool(block.name, block.input, parts, nobodyIsAwake);
      // TODO 4: append every call to RUN_LOG when parts.log is on. Without it
      // the "what happened last night?" question has no answer at all.
      results.push({ type: "tool_result", tool_use_id: block.id, content: text, is_error: failed });
    }
    messages.push({ role: "user", content: results });
  }

  const spentMoney = tools.ORDERS.reduce((s, o) => s + o.qty * (UNIT_COST[o.item] ?? 0), 0);
  return {
    orders: [...tools.ORDERS], spent: spentMoney,
    logLines: RUN_LOG.length, emails: tools.LOG.length,
  };
}

export const ALL_ON: Parts = { retry: true, errors: true, gate: true, log: true };

if (import.meta.filename === process.argv[1]) {
  preflight();
  console.log();
  for (const missing of [null, "retry", "errors", "gate", "log"] as const) {
    const parts = { ...ALL_ON } as any;
    let label = "everything on";
    if (missing) { parts[missing] = false; label = `${missing} OFF`; }
    try {
      const out = await runAgent(parts);
      console.log(`  ${label.padEnd(16)} orders=${out.orders.length} ` +
        `spent=$${out.spent.toFixed(2)} log=${out.logLines} emails=${out.emails}`);
    } catch (exc) {
      if (/TODO/.test((exc as Error).message)) {
        throw new Error(`\n  ${(exc as Error).message} — finish the TODOs in callTool first.\n`);
      }
      console.log(`  ${label.padEnd(16)} RUN DIED: ${(exc as Error).message}`);
    }
  }
  console.log("\n  Same model, same prompt, same tools in all five runs.");
  console.log(`\ncost  : ${spend()}`);
}
