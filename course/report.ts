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
import { assertDependencies } from "./preflight";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

assertDependencies();

const FILE = join(dirname(fileURLToPath(import.meta.url)), "progress.json");

type Entry = Record<string, number | boolean>;
type Data = Record<string, Entry>;

export type PredictionArg =
  | { status: "absent" }
  | { status: "ok"; value: number }
  | { status: "bad"; message: string };

/**
 * Optional score guess for stages 3 and 4.
 *
 * Read from the command line only. There is no prompt: this process is piped
 * and run in CI, and waiting on stdin would hang it.
 */
export function parsePrediction(argv: readonly string[]): PredictionArg {
  const at = argv.indexOf("--predict");
  if (at < 0) return { status: "absent" };
  const raw = argv[at + 1];
  if (raw === undefined || !/^(?:0|[1-9]\d*)$/.test(raw)) {
    return {
      status: "bad",
      message: "--predict needs a whole number, for example: npx tsx course/check.ts 3 --predict 12",
    };
  }
  return { status: "ok", value: Number(raw) };
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntry(value: unknown): value is Entry {
  return isRecord(value);
}

export type ProgressFile =
  | { readonly status: "missing" }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "ok"; readonly data: Data };

/**
 * Read the bytes of a progress file.
 *
 * A missing file is an empty report. A file that does not parse is not an
 * empty report: `record` used to treat the two the same and then overwrite
 * the file, so a half-written record disappeared on the run that should have
 * added one line.
 */
export function parseProgress(text: string): Exclude<ProgressFile, { status: "missing" }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "invalid", message };
  }
  if (!isRecord(parsed)) {
    return { status: "invalid", message: "progress.json must be a JSON object" };
  }
  return { status: "ok", data: parsed as Data };
}

function unreadable(message: string): string {
  return `${FILE} could not be read (${message}).\nIt was left unchanged.`;
}

export function readProgressFile(): ProgressFile {
  if (!existsSync(FILE)) return { status: "missing" };
  return parseProgress(readFileSync(FILE, "utf8"));
}

export function load(): Data {
  const read = readProgressFile();
  if (read.status === "invalid") throw new Error(unreadable(read.message));
  return read.status === "ok" ? read.data : {};
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
/**
 * Merge one stage's result into a progress object.
 *
 * `drop` removes keys the new run did not supply. A prediction belongs to the
 * run that stated it; leaving an old one beside a later score would pair two
 * moments that never happened together.
 */
export function applyRecord(
  data: Data,
  stage: number,
  values: Entry,
  drop: readonly string[] = [],
): Data {
  const previous = data[String(stage)];
  // A string or array spreads into index keys and the next write keeps them.
  const entry: Entry = isEntry(previous) ? { ...previous } : {};
  for (const key of drop) delete entry[key];
  for (const [k, v] of Object.entries(values)) {
    if (k === "score" && typeof v === "number") {
      entry.latest = v;
      entry[k] = typeof entry[k] === "number" ? Math.max(entry[k] as number, v) : v;
      continue;
    }
    entry[k] = v;
  }
  return { ...data, [String(stage)]: entry };
}

export function record(stage: number, values: Entry, drop: readonly string[] = []): void {
  let data: Data;
  try {
    data = load();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  writeFileSync(FILE, JSON.stringify(applyRecord(data, stage, values, drop), null, 1));
}

/** What the last run scored, falling back to the best for records written before `latest` existed. */
export function currentScore(entry: Entry | undefined): number | undefined {
  if (!entry) return undefined;
  const latest = entry.latest;
  if (typeof latest === "number") return latest;
  return typeof entry.score === "number" ? entry.score : undefined;
}

export function formatReport(data: Data): string {
  const lines: string[] = [];
  if (!isRecord(data) || !Object.keys(data).length) {
    return "\n  Nothing recorded yet.\n\n  Pass a stage first:  npx tsx course/check.ts 1\n";
  }
  lines.push("\n  YOUR REPORT CARD\n  " + "─".repeat(56));
  for (const [stage, label, key, render] of SHAPE) {
    const entry = data[String(stage)];
    if (!isEntry(entry) || !(key in entry)) { lines.push(`  ${stage}  ${label.padEnd(10)} ·`); continue; }
    // Report the run that happened, and say so when an earlier one went better.
    // A regression you can see is the thing stage 3 is for; a regression the
    // report card swallows is the thing it warns you about.
    const shown = key === "score" ? currentScore(entry) : entry[key];
    // Stage 0 stores a boolean and ignores the value. Every later key is a
    // number; anything else would print "undefined/20" or "$NaN".
    if (key === "score" ? typeof shown !== "number" : key !== "ok" && typeof shown !== "number") {
      lines.push(`  ${stage}  ${label.padEnd(10)} ·`);
      continue;
    }
    let line = render(shown as never);
    const best = entry.score;
    if (key === "score" && typeof best === "number" && typeof shown === "number" && best > shown) {
      line += `   (your best was ${best}/20)`;
    }
    const prediction = entry.prediction;
    if (key === "score" && typeof prediction === "number" && typeof shown === "number") {
      line += `   (you predicted ${prediction}, got ${shown})`;
    }
    lines.push(`  ${stage}  ${label.padEnd(10)} ${line}`);
  }
  lines.push("  " + "─".repeat(56));

  // Compare the runs that actually happened, not two high-water marks that may
  // never have coexisted: a best-of-3 against a best-of-4 can show a jump the
  // learner never got in one sitting.
  const base = currentScore(data["3"]);
  const withCtx = currentScore(data["4"]);
  if (base !== undefined && withCtx !== undefined) {
    const delta = withCtx - base;
    lines.push(`\n  The only number that matters: ${base}/20 → ${withCtx}/20 (${delta >= 0 ? "+" : ""}${delta})`);
    if (delta > 0) {
      lines.push("  Same model. Same twenty questions. You told it what it was");
      lines.push("  selling, and that was worth more than any prompt wording.");
    } else if (delta === 0) {
      lines.push("  No movement. Worth knowing — and worth checking whether the");
      lines.push("  menu actually reached the prompt.");
    } else {
      lines.push("  It went down. Read the failures; something you added is");
      lines.push("  fighting something already there.");
    }
  } else if (base !== undefined) {
    lines.push(`\n  Baseline ${base}/20. Do stage 4 and watch what moves it.`);
  } else {
    lines.push("\n  No eval score yet. Stage 3 is where this stops being opinion");
    lines.push("  and starts being measurement.");
  }
  lines.push("");
  return lines.join("\n");
}

function main(): void {
  try {
    console.log(formatReport(load()));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.filename === process.argv[1]) main();
