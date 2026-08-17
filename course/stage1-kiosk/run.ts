/** Stage 1 — a kiosk built out of rules. No model involved. */
import { MENU } from "../cafe/menu";

export interface Ticket { name: string; size: "S" | "L"; price: number }

/** Turn what the customer said into an order, using rules only. */
export function takeOrder(said: string): Ticket | null {
  const text = said.toLowerCase().trim();

  // -------------------------------------------------------------------
  // TODO: make "large flat white" work.
  //
  // Everything you need is in MENU: MENU["flat white"].L is 5.10.
  // Write the rule however you like — includes, split, a map, a regex.
  // -------------------------------------------------------------------

  if (text === "tea") return { name: "tea", size: "S", price: MENU.tea.S };
  if (text === "large tea") return { name: "tea", size: "L", price: MENU.tea.L };

  return null;
}

if (import.meta.filename === process.argv[1]) {
  const tries = [
    "tea", "large tea", "large flat white",
    "could I grab a large flat white when you get a sec",
  ];
  for (const said of tries) {
    const got = takeOrder(said);
    console.log(`  ${JSON.stringify(said).padEnd(55)} -> ${got ? JSON.stringify(got) : "no idea"}`);
  }
}
