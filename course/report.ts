/**
 * Your report card:  npx tsx course/report.ts
 *
 * Every stage that produces a number writes it to progress.json when it
 * passes. This prints the lot, in order, so you can see the shape of what you
 * have actually built rather than a pile of terminal scrollback.
 *
 * Note what is deliberately NOT here: the 20 café cases do not apply to
 * stages 5 to 8. An agent placing restock orders is not taking orders, and
 * forcing the same suite onto it would be theatre. So each later stage
 * reports the measure that actually fits it — money spent, orders placed,
 * injections blocked — and the report shows them side by side. Different
 * questions need different instruments; pretending otherwise is how
 * dashboards start lying.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "progress.json");

type Entry = Record<string, number | boolean>;
type Data = Record<string, Entry>;

const SHAPE: [number, string, string, (v: never) => string][] = [
  [0, "hello",    "ok",       () => "your key works"],
  [1, "kiosk",    "passing",  (v) => `${v} rule-based phrasings handled`],
  [2, "prompt",   "distinct", (v) => `${v} distinct answers from 5 identical questions`],
  [3, "evals",    "score",    (v) => `${v}/20  ← your baseline`],
  [4, "context",  "score",    (v) => `${v}/20  with the menu in context`],
  [5, "loop",     "orders",   (v) => `${v} orders placed, recovering from a failed tool`],
  [6, "harness",  "gated",    (v) => `$${Number(v).toFixed(2)} spent unattended with the gate on`],
  [7, "graph",    "blocked",  (v) => `${v} off-policy draft(s) stopped by the reviewer`],
  [8, "security", "capped",   (v) => `refund capped at $${Number(v).toFixed(2)} despite the injection`],
];

export function load(): Data {
  if (!existsSync(FILE)) return {};
  try { return JSON.parse(readFileSync(FILE, "utf8")) as Data; } catch { return {}; }
}

/** Called by check.ts when a stage passes. Scores only ever go up. */
export function record(stage: number, values: Entry): void {
  const data = load();
  const entry = data[String(stage)] ?? {};
  for (const [k, v] of Object.entries(values)) {
    entry[k] = k === "score" && typeof entry[k] === "number"
      ? Math.max(entry[k] as number, v as number) : v;
  }
  data[String(stage)] = entry;
  writeFileSync(FILE, JSON.stringify(data, null, 1));
}

function main(): void {
  const data = load();
  if (!Object.keys(data).length) {
    console.log("\n  Nothing recorded yet.\n\n  Pass a stage first:  npx tsx course/check.ts 1\n");
    return;
  }
  console.log("\n  YOUR REPORT CARD\n  " + "─".repeat(56));
  for (const [stage, label, key, render] of SHAPE) {
    const entry = data[String(stage)];
    if (!entry || !(key in entry)) { console.log(`  ${stage}  ${label.padEnd(10)} ·`); continue; }
    console.log(`  ${stage}  ${label.padEnd(10)} ${render(entry[key] as never)}`);
  }
  console.log("  " + "─".repeat(56));

  const base = data["3"]?.score as number | undefined;
  const withCtx = data["4"]?.score as number | undefined;
  if (base !== undefined && withCtx !== undefined) {
    const delta = withCtx - base;
    console.log(`\n  The only number that matters: ${base}/20 → ${withCtx}/20 (${delta >= 0 ? "+" : ""}${delta})`);
    if (delta > 0) {
      console.log("  Same model. Same twenty questions. You told it what it was");
      console.log("  selling, and that was worth more than any prompt wording.");
    } else if (delta === 0) {
      console.log("  No movement. Worth knowing — and worth checking whether the");
      console.log("  menu actually reached the prompt.");
    } else {
      console.log("  It went down. Read the failures; something you added is");
      console.log("  fighting something already there.");
    }
  } else if (base !== undefined) {
    console.log(`\n  Baseline ${base}/20. Do stage 4 and watch what moves it.`);
  } else {
    console.log("\n  No eval score yet. Stage 3 is where this stops being opinion");
    console.log("  and starts being measurement.");
  }
  console.log();
}

if (import.meta.filename === process.argv[1]) main();
