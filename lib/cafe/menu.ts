/** The café shared by the browser Lab and current TypeScript course. */

export const MENU: Record<string, { S: number; L: number }> = {
  "flat white":    { S: 4.2, L: 5.1 },
  latte:           { S: 4.0, L: 4.9 },
  cappuccino:      { S: 4.0, L: 4.9 },
  americano:       { S: 3.4, L: 4.1 },
  "hot chocolate": { S: 3.5, L: 4.2 },
  tea:             { S: 2.8, L: 3.4 },
  "orange juice":  { S: 3.6, L: 4.4 },
};

/** What a child may be served. Stage 4 gives this to the model; stage 2 doesn't. */
export const NON_COFFEE = ["hot chocolate", "tea", "orange juice"];

export type Size = "S" | "L";

export function priceOf(name: unknown, size: unknown): number | undefined {
  const row = MENU[String(name ?? "").trim().toLowerCase()];
  if (!row) return undefined;
  const s = String(size ?? "S").trim().toUpperCase();
  return s === "L" ? row.L : s === "S" ? row.S : undefined;
}

/** The menu as the model should see it: compact, complete, unambiguous. */
export function menuText(): string {
  const lines = ["MENU (name, small price, large price)"];
  for (const [name, p] of Object.entries(MENU)) {
    const caffeine = NON_COFFEE.includes(name) ? "" : "  [contains coffee]";
    lines.push(`  ${name.padEnd(14)} S $${p.S.toFixed(2)}   L $${p.L.toFixed(2)}${caffeine}`);
  }
  return lines.join("\n");
}

export interface OrderItem { name: string; size: Size; price: number }
export interface Order { items: OrderItem[]; total: number; needs_confirmation: boolean }
