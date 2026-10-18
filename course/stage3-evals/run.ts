/** Stage 3 — stop arguing about the prompt and start measuring it. */
import { loadEvalset, loadLlm } from "../preflight";
import type { TakeOrder } from "../cafe/evalset";

// Dynamic import: the dependency check has to run before the SDK is linked.
const { preflight, spend } = await loadLlm();
const { CASES, run } = await loadEvalset();

// ---------------------------------------------------------------------------
// TODO: point the eval at your stage-2 prompt.
//
//   import { takeOrder } from "../stage2-prompt/run";
//
// and then set SYSTEM_UNDER_TEST = takeOrder.
//
// (If that import feels like a hack: it is. Real projects put the prompt in a
// module both the app and the eval import. Doing it the awkward way once is a
// good argument for doing it properly next time.)
// ---------------------------------------------------------------------------
export const SYSTEM_UNDER_TEST: TakeOrder | null = null;
// ---------------------------------------------------------------------------

if (import.meta.filename === process.argv[1]) {
  preflight();
  if (!SYSTEM_UNDER_TEST) throw new Error("Set SYSTEM_UNDER_TEST above, then run this again.");
  const [score] = await run(SYSTEM_UNDER_TEST);
  console.log(`\n  ${score}/${CASES.length} — write that number down.`);
  console.log(`\ncost  : ${spend()}`);
}
