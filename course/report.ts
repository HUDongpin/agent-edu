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

/**
 * Called by check.ts when a stage passes.
 *
 * `score` is the best ever and only goes up. `latest` is what actually just
 * happened, and goes wherever the run went.
 *
 * Keeping only the maximum made this file disagree with the course it reports
 * on. Stage 3 teaches that a number is worth having because it can move, and
 * the worksheet asks the learner to record one improvement and one regression
 * and not to hide inconvenient cases — while the instrument quietly held the
 * high-water mark and showed nothing else. A learner who changed a prompt, lost
 * two cases and re-ran saw their old number stand. The single habit the course
 * says separates people who get good at this from people who keep guessing was
 * the one habit the tool prevented.
 *
 * `score` keeps its meaning so an existing progress.json still reads correctly;
 * `latest` is simply absent there, and the report falls back to the best.
 */
export function record(stage: number, values: Entry): void {
  const data = load();
  const entry = data[String(stage)] ?? {};
  for (const [k, v] of Object.entries(values)) {
    if (k === "score" && typeof v === "number") {
      entry.latest = v;
      entry[k] = typeof entry[k] === "number" ? Math.max(entry[k] as number, v) : v;
      continue;
    }
    entry[k] = v;
  }
  data[String(stage)] = entry;
  writeFileSync(FILE, JSON.stringify(data, null, 1));
}

/** What the last run scored, falling back to the best for records written before `latest` existed. */
export function currentScore(entry: Entry | undefined): number | undefined {
  if (!entry) return undefined;
  const latest = entry.latest;
  if (typeof latest === "number") return latest;
  return typeof entry.score === "number" ? entry.score : undefined;
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
    // Report the run that happened, and say so when an earlier one went better.
    // A regression you can see is the thing stage 3 is for; a regression the
    // report card swallows is the thing it warns you about.
    const shown = key === "score" ? currentScore(entry) : entry[key];
    let line = render(shown as never);
    const best = entry.score;
    if (key === "score" && typeof best === "number" && typeof shown === "number" && best > shown) {
      line += `   (your best was ${best}/20)`;
    }
    console.log(`  ${stage}  ${label.padEnd(10)} ${line}`);
  }
  console.log("  " + "─".repeat(56));

  // Compare the runs that actually happened, not two high-water marks that may
  // never have coexisted: a best-of-3 against a best-of-4 can show a jump the
  // learner never got in one sitting.
  const base = currentScore(data["3"]);
  const withCtx = currentScore(data["4"]);
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
