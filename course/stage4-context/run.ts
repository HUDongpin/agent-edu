/** Stage 4 — the same prompt, plus the one thing it was missing. */
import { ask, preflight, spend, tokens } from "../cafe/llm";
import { ORDER_SCHEMA, run } from "../cafe/evalset";
import { menuText, type Order } from "../cafe/menu";

// ---------------------------------------------------------------------------
// TODO: build the briefed prompt.
//
// Start from your stage-2 SYSTEM, then add:
//   - the menu, via menuText()
//   - what to do when the order is vague (set needs_confirmation)
//   - what to do when a customer asks for something not on the menu
//   - the default size when nobody says one
//
// Everything you add costs tokens on every call, so add what earns its place
// and let the eval tell you whether it did.
// ---------------------------------------------------------------------------
export const SYSTEM = ``;
// ---------------------------------------------------------------------------

export function takeOrder(said: string, variant = 0): Promise<Order> {
  return ask<Order>(`Customer said: ${JSON.stringify(said)}`,
    { system: SYSTEM, schema: ORDER_SCHEMA, variant });
}

if (import.meta.filename === process.argv[1]) {
  preflight();
  if (!SYSTEM.trim()) throw new Error("Write the SYSTEM prompt above, then run this again.");
  console.log(`  prompt size: ${await tokens(SYSTEM)} tokens, on every single call\n`);
  const [score] = await run(takeOrder);
  console.log(`\n  ${score}/20 with the menu in context.`);
  console.log("  Compare it with the number you wrote down in stage 3.");
  console.log(`\ncost  : ${spend()}`);
}
