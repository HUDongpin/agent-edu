/** Stage 0 — the smallest possible thing that proves the wiring works. */
import { ask, preflight, spend } from "../cafe/llm";

// ---------------------------------------------------------------------------
// TODO: ask the model something. Anything. The point is not the answer, it is
// that the key, the network and the SDK all line up before you build on them.
// ---------------------------------------------------------------------------
export const QUESTION = "";
// ---------------------------------------------------------------------------

export let answer = "";

if (import.meta.filename === process.argv[1]) {
  preflight();
  if (!QUESTION.trim()) throw new Error("Fill in QUESTION above, then run this again.");
  answer = await ask(QUESTION, { maxTokens: 300 });
  console.log(`\n${answer}\n`);
  console.log(`cost  : ${spend()}`);
}
