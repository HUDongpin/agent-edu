/**
 * Deterministic local stand-in used only when a learner passes `--offline`.
 *
 * This is intentionally not presented as a model. It accepts the same small
 * contracts as the course so a clean clone can exercise every code path
 * without a key, network request, private fixture, or previously recorded
 * model output. Live model variation remains a separate lesson.
 */
import { MENU, NON_COFFEE, priceOf, type Order, type OrderItem, type Size } from "../../lib/cafe/menu";

interface OfflineTextOptions {
  system?: string;
  schema?: { required?: readonly string[] } & object;
  variant?: number;
}

type Message = { role?: string; content?: unknown };

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function saidFrom(prompt: string): string {
  const match = /Customer said:\s*("(?:[^"\\]|\\.)*")/i.exec(prompt);
  if (!match) return prompt;
  try {
    return JSON.parse(match[1]) as string;
  } catch {
    return match[1].slice(1, -1);
  }
}

function menuIsPresent(system: string): boolean {
  return /MENU \(name, small price, large price\)|flat white\s+S \$4\.20/i.test(system);
}

function makeItem(name: string, size: Size, grounded: boolean, variant: number): OrderItem {
  const actual = priceOf(name, size) ?? 0;
  const price = grounded ? actual : roundMoney(actual + 0.5 + (Math.abs(variant) % 3) * 0.25);
  return { name, size, price };
}

/** A small parser, not an AI. It exists to make offline control flow runnable. */
export function offlineOrder(prompt: string, system = "", variant = 0): Order {
  const said = saidFrom(prompt).toLowerCase().replace(/[!?]/g, " ").replace(/\s+/g, " ").trim();
  const grounded = menuIsPresent(system);
  const items: OrderItem[] = [];
  const add = (name: string, size: Size, count = 1) => {
    for (let i = 0; i < count; i++) items.push(makeItem(name, size, grounded, variant + i));
  };

  if (/one tea in each size/.test(said)) {
    add("tea", "S"); add("tea", "L");
  } else if (/two large lattes?.*small tea/.test(said)) {
    add("latte", "L", 2); add("tea", "S");
  } else if (/small latte.*large americano/.test(said)) {
    add("latte", "S"); add("americano", "L");
  } else if (/two teas?/.test(said)) {
    add("tea", "S", 2);
  } else {
    const named = Object.keys(MENU).find((name) => said.includes(name));
    if (named) {
      const size: Size = /large|make it large/.test(said) && !/small/.test(said) ? "L" : "S";
      add(named, size);
    } else if (/black coffee/.test(said)) {
      add("americano", "S");
    } else if (/kid|child|daughter|son|no coffee|caffeine-free/.test(said)) {
      const choice = NON_COFFEE[Math.abs(variant) % NON_COFFEE.length];
      add(choice, "S");
    }
  }

  const vague = items.length === 0 ||
    /usual|same as yesterday|just a coffee|kids? drink|something|surprise me|isn't too sweet|no coffee|caffeine-free/.test(said);
  return {
    items,
    total: roundMoney(items.reduce((sum, item) => sum + item.price, 0)),
    needs_confirmation: vague,
  };
}

function parsedOrder(prompt: string): Order | null {
  const start = prompt.indexOf("The order-taking system produced:");
  const end = prompt.indexOf("\n\nStandard to judge against:");
  if (start < 0 || end <= start) return null;
  const raw = prompt.slice(start + "The order-taking system produced:".length, end).trim();
  try {
    return JSON.parse(raw) as Order;
  } catch {
    return null;
  }
}

export function offlineJudge(prompt: string): { passes: boolean; why: string } {
  const order = parsedOrder(prompt);
  const standard = prompt.split("Standard to judge against:")[1] ?? "";
  if (!order) return { passes: false, why: "The scripted offline judge could not read the order." };

  let passes = true;
  if (/needs_confirmation must be true/i.test(standard)) passes &&= order.needs_confirmation === true;
  if (/caffeine-free/i.test(standard)) {
    passes &&= order.items.length > 0 && order.items.every((item) => NON_COFFEE.includes(item.name));
  }
  if (/on the menu/i.test(standard)) {
    passes &&= order.items.every((item) => priceOf(item.name, item.size) !== undefined);
  }
  if (/Americano is the reasonable reading/i.test(standard)) {
    passes &&= order.items.some((item) => item.name === "americano") || order.needs_confirmation;
  }
  return {
    passes,
    why: passes ? "The scripted offline checks meet the written standard." : "The output misses a written condition.",
  };
}

function hasRequired(options: OfflineTextOptions, ...keys: string[]): boolean {
  const required = new Set(options.schema?.required ?? []);
  return keys.every((key) => required.has(key));
}

/** Return text in the same shape a live Provider would return. */
export function offlineText(prompt: string, options: OfflineTextOptions = {}): string {
  const system = options.system ?? "";
  const variant = options.variant ?? 0;

  if (hasRequired(options, "items", "total", "needs_confirmation")) {
    return JSON.stringify(offlineOrder(prompt, system, variant));
  }
  if (hasRequired(options, "passes", "why")) {
    return JSON.stringify(offlineJudge(prompt));
  }
  if (hasRequired(options, "lane")) {
    const lane = /complain|crushed|damaged|refund|disappointed/i.test(prompt)
      ? "complaint" : /order|buy|drink/i.test(prompt) ? "order" : "question";
    return JSON.stringify({ lane });
  }
  if (hasRequired(options, "approved", "problem")) {
    const violation = /entire order|store credit|free delivery/i.test(prompt);
    return JSON.stringify({
      approved: !violation,
      problem: violation ? "The draft exceeds the written damaged-item policy." : "",
    });
  }
  if (hasRequired(options, "refund_amount", "send_address_list", "reply")) {
    const labelled = /untrusted|quoted material|content to report|do not obey/i.test(system);
    return JSON.stringify(labelled
      ? { refund_amount: 18.6, send_address_list: false, reply: "We will refund the damaged bag." }
      : { refund_amount: 4210, send_address_list: true, reply: "A full refund has been requested." });
  }

  if (/A customer complained:/i.test(prompt)) {
    return /reviewer rejected/i.test(prompt)
      ? "I’m sorry about the damaged bag. We will refund that item under the stated policy."
      : "I’m sorry. We will refund the entire order and add free delivery.";
  }
  return "This is a scripted offline response. It proves the local code path without contacting a model Provider.";
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((block) => {
    if (!block || typeof block !== "object") return "";
    const value = block as Record<string, unknown>;
    return `${String(value.tool_use_id ?? "")} ${String(value.content ?? "")}`;
  }).join("\n");
}

function toolUse(name: string, input: Record<string, unknown>, index: number) {
  const subject = name === "place_order" && typeof input.item === "string" ? `-${input.item}` : "";
  return {
    type: "tool_use",
    id: `offline-${name}${subject}-${index}`,
    name,
    input,
  };
}

/** Anthropic-compatible subset for stages that teach raw tool-use loops. */
export function createOfflineClient() {
  return {
    messages: {
      async create(request: { messages?: Message[] }) {
        const messages = request.messages ?? [];
        const transcript = messages.map((message) => textOf(message.content)).join("\n");
        const index = messages.length;
        const content: Record<string, unknown>[] = [];

        if (!/offline-read_inventory-/i.test(transcript)) {
          content.push(toolUse("read_inventory", {}, index), toolUse("read_sales", { days: 7 }, index));
        } else if (/offline-read_sales-/.test(transcript) && !/coffee_beans\s+6(?:\.0)?\/wk/.test(transcript)) {
          if (/temporary network failure/i.test(transcript)) {
            content.push(toolUse("read_sales", { days: 7 }, index));
          }
        } else if (!/offline-place_order-coffee_beans-|for 4 coffee_beans/.test(transcript)) {
          content.push(toolUse("place_order", { item: "coffee_beans", qty: 4 }, index));
        } else if (
          !/offline-place_order-cups_12oz-[\s\S]*for 1000 cups_12oz/.test(transcript) &&
          !/Blocked:[\s\S]*(?:limit|approval)|approval was refused/i.test(transcript)
        ) {
          const qty = /supplier minimum for cups_12oz is 1000/i.test(transcript) ? 1000 : 270;
          content.push(toolUse("place_order", { item: "cups_12oz", qty }, index));
        } else if (!/offline-send_email-/.test(transcript)) {
          content.push(toolUse("send_email", {
            to: "manager@example.invalid",
            body: "Offline exercise: restock actions completed or safely blocked.",
          }, index));
        }

        const done = content.length === 0;
        return {
          id: `offline-response-${index}`,
          model: "scripted-offline",
          stop_reason: done ? "end_turn" : "tool_use",
          content: done ? [{ type: "text", text: "The scripted offline run is complete." }] : content,
          usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0 },
        };
      },
      async countTokens(request: { messages?: Message[] }) {
        const text = (request.messages ?? []).map((message) => textOf(message.content)).join("\n");
        return { input_tokens: Math.max(1, Math.ceil(text.length / 4)) };
      },
    },
  };
}
