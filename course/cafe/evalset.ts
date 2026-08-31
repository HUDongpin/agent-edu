/**
 * Twenty real orders, and the machinery to score a system against them.
 *
 * This is the most important file in the course. Once you can run it, every
 * later change becomes a measurement instead of an opinion.
 *
 * Two kinds of case:
 *   rule  — plain code decides pass/fail. Cheap, exact, no model involved.
 *           Use this wherever you possibly can.
 *   judge — "correct" is a judgement call, so a second model call grades the
 *           answer against a written standard. Slower, costs money, and is
 *           itself fallible — which is why only 8 of the 20 use it.
 */
import { ask } from "./llm";
import type { Order } from "./menu";

export { CASES, named } from "../../lib/cafe/evalset";
export type { EvalCase, Verdict } from "../../lib/cafe/evalset";
import { CASES } from "../../lib/cafe/evalset";

/** The shape every stage from 2 onward asks the model to produce. */
export const ORDER_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          size: { type: "string", enum: ["S", "L"] },
          price: { type: "number" },
        },
        required: ["name", "size", "price"],
        additionalProperties: false,
      },
    },
    total: { type: "number" },
    needs_confirmation: { type: "boolean" },
  },
  required: ["items", "total", "needs_confirmation"],
  additionalProperties: false,
};

const JUDGE_SCHEMA = {
  type: "object",
  properties: { passes: { type: "boolean" }, why: { type: "string" } },
  required: ["passes", "why"],
  additionalProperties: false,
};

/**
 * Ask a second model whether the answer meets a written standard.
 *
 * Note what makes this auditable: the standard is specific and checkable. A
 * standard like "the answer should be good" leaves the model judge's
 * run-dependent decision underspecified.
 */
export async function judge(said: string, order: Order, standard: string): Promise<[boolean, string]> {
  const v = await ask<{ passes: boolean; why: string }>(
    `A café customer said: ${JSON.stringify(said)}\n` +
    `The order-taking system produced: ${JSON.stringify(order)}\n\n` +
    `Standard to judge against: ${standard}\n\n` +
    `Does the output meet the standard? Be strict.`,
    {
      system: "You grade one output against one written standard. " +
        "You are not judging style, only whether the standard is met.",
      schema: JUDGE_SCHEMA,
    });
  return [!!v.passes, String(v.why ?? "")];
}

export type TakeOrder = (said: string) => Promise<Order>;

/** Run every case through `takeOrder` and return [score, failures]. */
export async function run(
  takeOrder: TakeOrder,
  { verbose = true }: { verbose?: boolean } = {},
): Promise<[number, string[]]> {
  let score = 0;
  const failures: string[] = [];
  for (const c of CASES) {
    let ok = false;
    let why = "";
    try {
      const order = await takeOrder(c.said);
      [ok, why] = c.kind === "rule" ? c.rule!(order) : await judge(c.said, order, c.standard!);
    } catch (err) {
      ok = false;                                    // a crash is a failure
      why = `threw ${(err as Error).message}`;
    }
    if (ok) score++;
    if (verbose) console.log(`  ${ok ? "PASS" : "FAIL"}  ${c.id.padEnd(18)} ${ok ? "" : why}`);
    if (!ok) failures.push(c.id);
  }
  return [score, failures];
}
