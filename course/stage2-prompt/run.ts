/** Stage 2 — the same job as stage 1, but with a model. */
import { ask, preflight, spend } from "../cafe/llm";
import { ORDER_SCHEMA } from "../cafe/evalset";
import { priceOf, type Order } from "../cafe/menu";

/** Five ways a real customer asks for one thing. Real people do not repeat
 *  themselves verbatim, so this is the variation that actually reaches you. */
const SAME_INTENT = [
  "something warm for my kid, no coffee",
  "a warm drink for my little one, nothing with coffee in it",
  "my son wants something hot — he can't have caffeine",
  "got anything warm and caffeine-free for a child?",
  "a hot drink for my daughter please, decaf or no coffee",
];

// ---------------------------------------------------------------------------
// TODO: write the prompt.
//
// The model has to turn one customer sentence into an order matching
// ORDER_SCHEMA (see cafe/evalset.ts — items, total, needs_confirmation).
//
// Deliberately do NOT paste the menu in yet. Stage 4 does that, and the
// comparison is the lesson.
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

  const clear = "could I grab a large flat white when you get a sec";
  console.log(`\nA phrasing you never wrote a rule for:\n  ${JSON.stringify(clear)}`);
  console.log("  ->", JSON.stringify(await takeOrder(clear)));

  // ---- probe 1: is it stable? ---------------------------------------------
  const vague = "something warm for my kid, no coffee";
  console.log(`\nThe same vague question, five times:\n  ${JSON.stringify(vague)}`);
  const seen = new Set<string>();
  const quotes = [];
  for (let i = 0; i < 5; i++) {
    const got = await takeOrder(vague, i);
    seen.add(JSON.stringify(got));
    quotes.push((got.items ?? [{}])[0] as { name?: string; size?: string; price?: number });
    console.log(`  ${i + 1}. ${JSON.stringify(got)}`);
  }
  console.log(`\n  ${seen.size} distinct answer(s) from 5 identical questions.`);

  // ---- probe 2: is it right? ----------------------------------------------
  // Stability and correctness are different questions, and only one matters.
  // A model that wobbles is obviously guessing; one that says the same wrong
  // thing five times is guessing too, and hides it better.
  const asked = quotes.map((q) => q.price);
  const real = priceOf(quotes[0].name ?? "", quotes[0].size ?? "S");
  console.log(`\n  it quoted : ${JSON.stringify(asked)}`);
  console.log(`  menu says : ${real}`);
  if (real === undefined) console.log("  -> that item is not on the menu at all. It invented one.");
  else if (new Set(asked).size > 1) console.log("  -> it invented the price, differently each time.");
  else if (asked[0] !== real) console.log("  -> it invented the price. Confidently. Every single time.");
  else console.log("  -> right this time — but nobody told it the menu, so that is luck.");

  // ---- probe 3: does the wording move it? ---------------------------------
  console.log("\nFive ways of asking for the same thing:");
  const flags = new Set();
  for (let i = 0; i < SAME_INTENT.length; i++) {
    const got = await takeOrder(SAME_INTENT[i], 10 + i);
    flags.add(got.needs_confirmation);
    console.log(`  needs_confirmation=${String(got.needs_confirmation).padEnd(5)}  ${JSON.stringify(SAME_INTENT[i])}`);
  }
  if (flags.size > 1) {
    console.log("\n  -> the same order, and the flag that decides whether you ask");
    console.log("     before charging them flipped on phrasing alone.");
  }
  console.log("\n  One sample never settles any of this. Stage 3 is how you stop");
  console.log("  guessing and start counting.");
  console.log(`\ncost  : ${spend()}`);
}
