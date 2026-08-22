/**
 * Twenty real orders, and the machinery to score a system against them.
 *
 * Ported from the legacy Python edition so the browser Lab and current
 * TypeScript course grade identically. Two kinds
 * of case: `rule` is decided by plain code (cheap, exact, no model), `judge`
 * needs a second model call because "correct" is a judgement. Only 8 of 20
 * are judged — use a rule wherever you possibly can.
 */
import { priceOf, type Order } from "./menu";

export type Verdict = [boolean, string];
export type CaseKind = "rule" | "judge";
export interface EvalCase {
  id: string;
  said: string;
  kind: CaseKind;
  rule?: (o: Order) => Verdict;
  standard?: string;
}

type Want = [string, string];

export function named(o: Order, ...want: Want[]): Verdict {
  const got: Want[] = (o.items ?? []).map((i) => [
    String(i.name ?? "").trim().toLowerCase(),
    String(i.size ?? "").trim().toUpperCase(),
  ]);
  const key = (a: Want[]) => a.map((x) => x.join("|")).sort().join(",");
  if (key(got) !== key(want)) {
    return [false, `items were ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`];
  }
  for (const i of o.items ?? []) {
    const w = priceOf(i.name, i.size);
    if (w === undefined || Math.abs(i.price - w) > 0.005) {
      return [false, `${i.name} priced ${i.price}, menu says ${w ?? "not on the menu"}`];
    }
  }
  const total = want.reduce((s, [n, z]) => s + (priceOf(n, z) ?? 0), 0);
  if (Math.abs((o.total ?? -1) - total) > 0.005) {
    return [false, `total was ${o.total}, expected ${total.toFixed(2)}`];
  }
  return [true, "ok"];
}

export const CASES: EvalCase[] = [
  { id: "large-flat-white", said: "large flat white please", kind: "rule", rule: (o) => named(o, ["flat white", "L"]) },
  { id: "two-teas", said: "two teas", kind: "rule", rule: (o) => named(o, ["tea", "S"], ["tea", "S"]) },
  { id: "latte-americano", said: "a small latte and a large americano", kind: "rule", rule: (o) => named(o, ["latte", "S"], ["americano", "L"]) },
  { id: "the-usual", said: "I'll have the usual", kind: "judge", standard: "The order is impossible to know from the message alone, so needs_confirmation must be true." },
  { id: "hot-choc", said: "hot chocolate please", kind: "rule", rule: (o) => named(o, ["hot chocolate", "S"]) },
  { id: "make-it-large", said: "flat white, make it large", kind: "rule", rule: (o) => named(o, ["flat white", "L"]) },
  { id: "orange-juice", said: "can I get an orange juice", kind: "rule", rule: (o) => named(o, ["orange juice", "S"]) },
  { id: "kid-no-coffee", said: "something warm for my kid, no coffee", kind: "judge", standard: "The item must be a caffeine-free menu item (hot chocolate, tea or orange juice) and needs_confirmation must be true, because the customer did not name a drink." },
  { id: "tea-for-mum", said: "a tea for my mum", kind: "rule", rule: (o) => named(o, ["tea", "S"]) },
  { id: "large-cappuccino", said: "large cappuccino", kind: "rule", rule: (o) => named(o, ["cappuccino", "L"]) },
  { id: "a-coffee", said: "just a coffee", kind: "judge", standard: "Several menu items are coffee, so the model cannot know which one; needs_confirmation must be true." },
  { id: "two-lattes-tea", said: "two large lattes and a small tea", kind: "rule", rule: (o) => named(o, ["latte", "L"], ["latte", "L"], ["tea", "S"]) },
  { id: "kids-drink", said: "a kids drink", kind: "judge", standard: "The item must be caffeine-free and on the menu, and needs_confirmation must be true." },
  { id: "americano-small", said: "americano, small", kind: "rule", rule: (o) => named(o, ["americano", "S"]) },
  { id: "nothing-sweet", said: "something that isn't too sweet", kind: "judge", standard: "This is a preference, not an order; needs_confirmation must be true." },
  { id: "same-as-yesterday", said: "same as yesterday", kind: "judge", standard: "There is no record of yesterday in the message, so needs_confirmation must be true." },
  { id: "one-of-each-tea", said: "one tea in each size", kind: "rule", rule: (o) => named(o, ["tea", "S"], ["tea", "L"]) },
  { id: "black-coffee", said: "black coffee", kind: "judge", standard: "Americano is the reasonable reading of 'black coffee' on this menu; picking it is correct, and so is flagging for confirmation. Inventing an item that is not on the menu is wrong." },
  { id: "shouty", said: "LARGE FLAT WHITE!!!", kind: "rule", rule: (o) => named(o, ["flat white", "L"]) },
  { id: "a-treat", said: "surprise me with a treat", kind: "judge", standard: "The customer named no drink, so needs_confirmation must be true." },
];
