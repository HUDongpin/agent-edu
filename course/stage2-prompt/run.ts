/** Stage 2 — the same job as stage 1, but with a model. */
import { loadEvalset, loadLlm } from "../preflight";
import { priceOf, type Order } from "../cafe/menu";
import { formatRecordedStage2 } from "./recorded";

// Dynamic import: the dependency check has to run before the SDK is linked.
const { ask, preflight, spend, OFFLINE } = await loadLlm();
const { ORDER_SCHEMA } = await loadEvalset();

/** Five ways a real customer asks for one thing. Real people do not repeat
 *  themselves verbatim, so this is the variation that actually reaches you. */
export const SAME_INTENT = [
  "something warm for my kid, no coffee",
  "a warm drink for my little one, nothing with coffee in it",
  "my son wants something hot — he can't have caffeine",
  "got anything warm and caffeine-free for a child?",
  "a hot drink for my daughter please, decaf or no coffee",
];

/** The clear order and the vague question the probes below repeat. */
export const CLEAR_ORDER = "could I grab a large flat white when you get a sec";
export const VAGUE_QUESTION = "something warm for my kid, no coffee";

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
  if (!SYSTEM.trim()) {
    if (OFFLINE) {
      console.log(formatRecordedStage2());
      console.log("\n  The stand-in did not run: SYSTEM is still empty.");
    }
    throw new Error("Write the SYSTEM prompt above, then run this again.");
  }

  console.log(`\nA phrasing you never wrote a rule for:\n  ${JSON.stringify(CLEAR_ORDER)}`);
  console.log("  ->", JSON.stringify(await takeOrder(CLEAR_ORDER)));

  // ---- probe 1: is it stable? ---------------------------------------------
  console.log(`\nThe same vague question, five times:\n  ${JSON.stringify(VAGUE_QUESTION)}`);
  const seen = new Set<string>();
  const quotes: { name?: string; size?: string; price?: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const got = await takeOrder(VAGUE_QUESTION, i);
    seen.add(JSON.stringify(got));
    // An empty items array has no [0]. The reference prompt often returns one.
    quotes.push(got.items?.[0] ?? {});
    console.log(`  ${i + 1}. ${JSON.stringify(got)}`);
  }
  console.log(`\n  ${seen.size} distinct answer(s) from 5 identical questions.`);

  // ---- probe 2: is it right? ----------------------------------------------
  // Stability and correctness are different questions, and only one matters.
  // A model that wobbles is obviously guessing; one that says the same wrong
  // thing five times is guessing too, and hides it better.
  const asked = quotes.map((q) => q.price);
  const named = quotes.find((q) => q.name);
  const first = named ?? quotes[0] ?? {};
  const real = priceOf(first.name ?? "", first.size ?? "S");
  console.log(`\n  it quoted : ${JSON.stringify(asked)}`);
  console.log(`  menu says : ${real}`);
  if (!named) console.log("  -> it named no item. Empty can be the stable answer. It is still not a checked one.");
  else if (real === undefined) console.log("  -> that item is not on the menu at all. It invented one.");
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
  if (OFFLINE) {
    console.log();
    console.log(formatRecordedStage2());
  }
}
