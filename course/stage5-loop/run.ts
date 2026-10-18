/** Stage 5 — the agent loop, written by hand, in two graded steps. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadLlm } from "../preflight";
import * as tools from "../cafe/tools";

// Dynamic import: the dependency check has to run before the SDK is linked.
const { getClient, meter, MODEL, preflight, spend, tuning } = await loadLlm();

const GOAL = "Restock the café. Work out what is running short and order enough of " +
  "it, then email the manager a one-line summary of what you ordered.";

/** The stopping rule. A loop without one can run all night on your money. */
export const MAX_STEPS = 8;

/** The four fields a tool_use block carries. Step 5a returns these. */
export interface ToolUseSeen {
  type: string;
  id: string;
  name: string;
  input: unknown;
}

/**
 * The transcript of the last `runAgent` call.
 *
 * The checker reads it. The scaffold assigns it after the loop, from the
 * `messages` array step 5b fills in.
 */
export let transcript: any[] = [];

/**
 * Step 5a. Ask once, look at the tool call, then answer that one block.
 *
 * `describeToolUse` runs first and is the only place whose `console.log`
 * calls are kept on `noted`. `answerOneTool` runs after that, so the message
 * format cannot come before the look. Step 5b is a different function.
 */
export async function inspectOneCall(verbose = true) {
  const client = getClient();
  const messages: any[] = [{ role: "user", content: GOAL }];
  const response: any = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    tools: tools.SCHEMAS as any,
    messages,
    ...tuning(),
  } as any);
  meter(response);
  if (response.stop_reason === "refusal") throw new Error("the model declined this request");

  const noted: string[] = [];
  const orig = console.log;
  console.log = (...args: any[]) => {
    const line = args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" ");
    noted.push(line);
    if (verbose) orig(...args);
  };
  let seen: ToolUseSeen;
  try {
    seen = describeToolUse(response);
  } finally {
    console.log = orig;
  }
  answerOneTool(messages, response);
  return { messages, seen, response, noted };
}

/**
 * TODO 5a, first. You are looking at one model response. Do not build a
 * tool_result in this function — you have not been given `messages`.
 *
 * `response.content` is an array of blocks. Log it with console.log so you
 * can see a tool_use block: type, id, name, input. JSON.stringify makes the
 * log readable. Then return the first block whose type is "tool_use", as
 * { type, id, name, input }. Copy those four fields off the block. The id
 * is how a later tool_result points back at this call.
 */
export function describeToolUse(response: any): ToolUseSeen {
  throw new Error("TODO 5a: print response.content, then return the first tool_use block.");
}

/**
 * TODO 5a, second. You have seen the block. Answer exactly one tool call.
 *
 * 1. Append the assistant's whole `response.content` to `messages`. Pass the
 *    array through unchanged.
 * 2. Take the first block where block.type === "tool_use". Ignore any others.
 * 3. Call tools.RUNNERS[block.name] with block.input.
 * 4. Push ONE user message whose content is a one-element array:
 *      { type: "tool_result", tool_use_id: block.id, content: String(result) }
 *
 * Errors, parallel calls and the step limit are step 5b. This function
 * answers one call so the shape is obvious.
 */
export function answerOneTool(messages: any[], response: any): void {
  throw new Error("TODO 5a: append the assistant turn and one tool_result.");
}

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
      ...tuning(),
    } as any);
    meter(response);

    if (response.stop_reason === "refusal") throw new Error("the model declined this request");

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
    // TODO 5b: the rest of the loop. Step 5a answered one tool. This
    // answers every tool, including the ones that fail.
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
    //                 content: <the result, as a string>,
    //                 is_error: <true when the tool threw> }
    //
    //    When the tool throws, do NOT let it crash the loop. Send the error
    //    back as a tool_result with is_error: true — the model reads it and
    //    adapts. That is the whole trick.
    //
    // 3. Append all the results as ONE user message:
    //       messages.push({ role: "user", content: results })
    //    All of them, in one message. Splitting them across several messages
    //    quietly teaches the model to stop calling tools in parallel.
    //
    // The `for` above is the step limit. Leave MAX_STEPS in charge.
    // -----------------------------------------------------------------
    throw new Error("TODO 5b: feed every tool result back, including errors, in one user message.");
  }

  transcript = messages;
  return tools.ORDERS;
}

if (import.meta.filename === process.argv[1]) {
  preflight();
  tools.reset();
  console.log(`\ngoal  : ${GOAL}\n`);
  try {
    console.log("step 5a — look at one tool call, then answer it:\n");
    await inspectOneCall(true);
    console.log("\nstep 5b — the whole loop:\n");
    tools.reset();
    const placed = await runAgent();
    console.log(`\norders: ${JSON.stringify(placed)}`);
    console.log(`emails: ${JSON.stringify(tools.LOG)}`);
    console.log(`\ncost  : ${spend()}`);
  } catch (err) {
    if (/TODO/.test((err as Error).message)) {
      console.log(`\n  ${(err as Error).message}\n`);
      process.exit(1);
    }
    throw err;
  }
}
