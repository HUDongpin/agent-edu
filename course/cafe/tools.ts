/**
 * Tools the agent may call, from stage 5 onward.
 *
 * A "tool" is nothing exotic: a JSON schema the model can read, plus a
 * function you run when it asks. The model never executes anything — it only
 * ever asks. You decide what actually happens. That gap is where stage 6's
 * whole job lives.
 */

/** A tiny fake store room, so the stages have something to change. */
export const STOCK: Record<string, number> = {
  coffee_beans: 2.0, oat_milk: 6.0, cups_12oz: 40, tea: 8,
};
export const WEEKLY_SALES: Record<string, number> = {
  coffee_beans: 6.0, oat_milk: 5.0, cups_12oz: 310, tea: 3,
};
export const SUPPLIER_MINIMUM: Record<string, number> = { cups_12oz: 1000 };

export const ORDERS: { item: string; qty: number }[] = [];
export const LOG: string[] = [];

/** Stage 6 flips these to show what each harness part is worth. */
export const FAIL_ONCE: Record<string, boolean> = { read_sales: true };

export function read_inventory(): string {
  return Object.entries(STOCK).map(([k, v]) => `${k} ${v}`).join(" · ");
}

export function read_sales(): string {
  // Transient failures are normal. Without a retry, this ends the run.
  if (FAIL_ONCE.read_sales) {
    FAIL_ONCE.read_sales = false;
    throw new Error("temporary network failure talking to the sales API");
  }
  return Object.entries(WEEKLY_SALES).map(([k, v]) => `${k} ${v}/wk`).join(" · ");
}

export function place_order({ item, qty }: { item: string; qty: number }): string {
  const minimum = SUPPLIER_MINIMUM[item];
  if (minimum && qty < minimum) {
    // A refusal with a *reason*. Stage 6 shows what happens when the reason
    // is stripped out and the model just sees "Error".
    throw new Error(`supplier minimum for ${item} is ${minimum}`);
  }
  ORDERS.push({ item, qty });
  return `OK — order #${1180 + ORDERS.length} for ${qty} ${item}`;
}

export function send_email({ to, body }: { to: string; body: string }): string {
  LOG.push(`email to ${to}: ${body}`);
  return "sent";
}

/**
 * What the model sees. Descriptions do real work here: be specific about
 * *when* to call a tool, not just what it does.
 */
export const SCHEMAS = [
  {
    name: "read_inventory",
    description: "Read current stock levels in the store room. Call this first when " +
      "asked about restocking — you cannot know what is short without it.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "read_sales",
    description: "How much of each item sells per week. Needed to work out how long " +
      "current stock will last.",
    input_schema: {
      type: "object",
      properties: { days: { type: "number", description: "Look-back window; default 7." } },
      required: [],
    },
  },
  {
    name: "place_order",
    description: "Order more of one item from the supplier. This spends real money and " +
      "cannot be undone.",
    input_schema: {
      type: "object",
      properties: { item: { type: "string" }, qty: { type: "number" } },
      required: ["item", "qty"],
    },
  },
  {
    name: "send_email",
    description: "Email a person. Use it to report what you did once the ordering is done.",
    input_schema: {
      type: "object",
      properties: { to: { type: "string" }, body: { type: "string" } },
      required: ["to", "body"],
    },
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export const RUNNERS: Record<string, (args: any) => string> = {
  read_inventory, read_sales, place_order, send_email,
};

/** Put the store room back how it was, between runs. */
export function reset(): void {
  ORDERS.length = 0;
  LOG.length = 0;
  FAIL_ONCE.read_sales = true;
  Object.assign(STOCK, { coffee_beans: 2.0, oat_milk: 6.0, cups_12oz: 40, tea: 8 });
}
