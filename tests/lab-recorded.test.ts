import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { offlineJudge, offlineOrder } from "../course/cafe/offline";
import { CASES } from "../lib/cafe/evalset";
import { menuText } from "../lib/cafe/menu";
import { RECORDED_AFTER, RECORDED_BEFORE, RECORDED_RUN } from "../lib/lab/recorded";

/*
 * lib/lab/recorded.ts claims every verdict is what the course's offline
 * stand-in says. The rows shipped on 2026-09-08 were produced by handing
 * offlineJudge the *Lab's* judge prompt ("The system produced:" /
 * "Standard:"), which the stand-in cannot parse, so all eight judge cases
 * read "The scripted offline judge could not read the order." in both
 * columns, and the no-key table showed 0/20 -> 12/20 where `npx tsx
 * course/check.ts 3 --offline` and `4 --offline` give 8/20 -> 20/20.
 *
 * The judge prompt below is course/cafe/evalset.ts's judge(), verbatim; the
 * first test pins it so the two cannot drift apart. Each case uses its index
 * as the stand-in's variant, as the original generator did.
 */
const judgePrompt = (said: string, order: unknown, standard: string) =>
  `A café customer said: ${JSON.stringify(said)}\n` +
  `The order-taking system produced: ${JSON.stringify(order)}\n\n` +
  `Standard to judge against: ${standard}\n\n` +
  `Does the output meet the standard? Be strict.`;

test("the recording's judge prompt is the course's judge prompt", () => {
  const source = readFileSync("course/cafe/evalset.ts", "utf8");
  for (const piece of [
    "`A café customer said: ${JSON.stringify(said)}\\n`",
    "`The order-taking system produced: ${JSON.stringify(order)}\\n\\n`",
    "`Standard to judge against: ${standard}\\n\\n`",
    "`Does the output meet the standard? Be strict.`",
  ]) assert.ok(source.includes(piece), `course judge() no longer contains ${piece}`);
});

function standIn(entry: (typeof CASES)[number], system: string, variant: number): [boolean, string] {
  const order = offlineOrder(`Customer said: ${JSON.stringify(entry.said)}`, system, variant);
  if (entry.kind === "rule") return entry.rule!(order);
  const judged = offlineJudge(judgePrompt(entry.said, order, entry.standard!));
  return [judged.passes, judged.why];
}

test("the scripted Lab recording is what the course's offline stand-in actually says", () => {
  const expected = CASES.map((entry, i) => {
    const [before, why] = standIn(entry, "", i);
    const [after] = standIn(entry, menuText(), i);
    return { id: entry.id, said: entry.said, kind: entry.kind, before, after, why: before ? "" : why };
  });
  assert.deepEqual(RECORDED_RUN, expected);
  for (const row of RECORDED_RUN) {
    assert.doesNotMatch(row.why, /could not read the order/, `${row.id} shows a harness error, not a verdict`);
  }
  assert.equal(RECORDED_BEFORE, 8);
  assert.equal(RECORDED_AFTER, 20);
});
