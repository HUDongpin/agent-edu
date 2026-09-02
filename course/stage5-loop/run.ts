/** Stage 5 — the agent loop, written by hand. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  assertCompleteToolTurn,
  getClient,
  meter,
  MODEL,
  preflight,
  spend,
  tuning,
} from "../cafe/llm";
import * as tools from "../cafe/tools";

const GOAL = "Restock the café. Work out what is running short and order enough of " +
  "it, then email the manager a one-line summary of what you ordered.";

const MAX_STEPS = 8;

/** Loop until the model stops asking for tools. Returns the orders placed. */
export async function runAgent(verbose = true) {
  const client = getClient();
  const messages: any[] = [{ role: "user", content: GOAL }];

  for (let step = 1; step <= MAX_STEPS; step++) {
    const response: any = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      tools: tools.SCHEMAS as any,
      messages,
      ...tuning(),          // vendor-specific "how hard to think"
    } as any);
    meter(response);
    assertCompleteToolTurn(response);

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim() && verbose) {
        console.log(`  [${step}] ${block.text.trim().slice(0, 120)}`);
      }
    }

    if (response.stop_reason === "end_turn") {
      if (verbose) console.log(`  [${step}] done — the model stopped asking for tools`);
      break;
    }

    // -----------------------------------------------------------------
    // TODO: this is the loop.
    //
    // 1. Append the assistant's whole `response.content` to `messages`.
    //    Pass the array through unchanged — it carries the tool_use blocks
    //    (and the model's thinking) that the next turn needs.
    //
    // 2. For every block where block.type === "tool_use":
    //       - look the function up in tools.RUNNERS[block.name]
    //       - call it with block.input
    //       - build { type: "tool_result",
    //                 tool_use_id: block.id,
    //                 content: <the result, as a string> }
    //
    //    When the tool throws, do NOT let it crash the loop. Send the error
    //    back as a tool_result with is_error: true — the model reads it and
    //    adapts. That is the whole trick.
    //
    // 3. Append all the results as ONE user message:
    //       messages.push({ role: "user", content: results })
    //    All of them, in one message. Splitting them across several messages
    //    quietly teaches the model to stop calling tools in parallel.
    // -----------------------------------------------------------------
    throw new Error("TODO: write the loop body above, then run this again.");
  }

  return tools.ORDERS;
}

if (import.meta.filename === process.argv[1]) {
  preflight();
  tools.reset();
  console.log(`\ngoal  : ${GOAL}\n`);
  const placed = await runAgent();
  console.log(`\norders: ${JSON.stringify(placed)}`);
  console.log(`emails: ${JSON.stringify(tools.LOG)}`);
  console.log(`\ncost  : ${spend()}`);
}
