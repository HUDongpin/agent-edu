/**
 * View of one saved real run of the stage 2 probes.
 *
 * The scripted stand-in in cafe/offline.ts is still what `--offline` executes.
 * This file only prints replies that were collected earlier, and it says so.
 * Regenerate with `npx tsx course/cafe/record-stage2.ts` (needs a key, spends
 * money, hard-capped). Do not hand-edit the JSON to invent variation.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const STAGE2_RECORDING_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "cafe",
  "recordings",
  "stage2.json",
);

export const RECORDED_BANNER_PREFIX = "RECORDED real runs (not live) — ";

export interface RecordedItem {
  name?: string;
  size?: string;
  price?: number;
}

export interface RecordedOrder {
  items: RecordedItem[];
  total: number;
  needs_confirmation: boolean;
}

export interface RecordedCallUsage {
  inputTokens: number;
  cachedInputTokens: number;
  cacheCreationInputTokens: number;
  outputTokens: number;
}

export interface RecordedCall {
  input: string;
  variant: number;
  output: RecordedOrder;
  usage: RecordedCallUsage;
}

export interface Stage2Recording {
  kind: "recorded-real-run";
  notLive: true;
  recordedAt: string;
  provider: string;
  model: string;
  settings: {
    effort: string;
    maxTokens: number;
    temperature: null;
    requestTuning: { thinking?: { type?: string } };
    jsonSchema: boolean;
    variantSentToProvider: false;
  };
  system: string;
  clearCalls: RecordedCall[];
  vagueSessions: RecordedCall[][];
  phrasingSessions: RecordedCall[][];
  usage: RecordedCallUsage & { calls: number; unknownCalls: number };
  estimatedCostUsd: number;
  priceBand: "off-peak" | "peak";
  pricesCheckedAt: string;
}

const FIELDS = ["item name", "size", "price", "needs_confirmation"] as const;
export type RecordedField = (typeof FIELDS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function callUsage(value: unknown): RecordedCallUsage {
  if (!isRecord(value)) throw new Error("recording call is missing usage");
  if (!integer(value.inputTokens) || !integer(value.cachedInputTokens)
    || !integer(value.cacheCreationInputTokens) || !integer(value.outputTokens)) {
    throw new Error("recording call usage is not a whole-token count");
  }
  return {
    inputTokens: value.inputTokens,
    cachedInputTokens: value.cachedInputTokens,
    cacheCreationInputTokens: value.cacheCreationInputTokens,
    outputTokens: value.outputTokens,
  };
}

function call(value: unknown): RecordedCall {
  if (!isRecord(value)) throw new Error("recording call is not an object");
  if (typeof value.input !== "string" || value.input.length === 0) {
    throw new Error("recording call is missing input");
  }
  if (!integer(value.variant)) throw new Error("recording call variant is not a count");
  if (!isRecord(value.output) || !Array.isArray(value.output.items)
    || typeof value.output.total !== "number" || !Number.isFinite(value.output.total)
    || typeof value.output.needs_confirmation !== "boolean") {
    throw new Error("recording call output is not an order");
  }
  for (const item of value.output.items) {
    if (!isRecord(item)) throw new Error("recording order item is not an object");
  }
  // Keep the parsed object, key order included. Distinct counts use that text,
  // which is the same comparison the stage 2 runner prints.
  return {
    input: value.input,
    variant: value.variant,
    output: value.output as unknown as RecordedOrder,
    usage: callUsage(value.usage),
  };
}

function sessions(value: unknown, per: number, label: string): RecordedCall[][] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`recording ${label} is empty`);
  }
  return value.map((session) => {
    if (!Array.isArray(session) || session.length !== per) {
      throw new Error(`recording ${label} session is not ${per} calls`);
    }
    return session.map(call);
  });
}

/** Read and check the committed fixture. Throws if the shape is wrong. */
export function loadStage2Recording(): Stage2Recording {
  const parsed: unknown = JSON.parse(readFileSync(STAGE2_RECORDING_PATH, "utf8"));
  if (!isRecord(parsed)) throw new Error("stage 2 recording is not an object");
  if (parsed.kind !== "recorded-real-run" || parsed.notLive !== true) {
    throw new Error("stage 2 recording is not labelled as a recorded real run");
  }
  if (typeof parsed.recordedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(parsed.recordedAt)) {
    throw new Error("stage 2 recording date is not an ISO UTC timestamp");
  }
  if (typeof parsed.provider !== "string" || typeof parsed.model !== "string" || typeof parsed.system !== "string") {
    throw new Error("stage 2 recording is missing provider, model, or system");
  }
  if (!parsed.system.trim()) throw new Error("stage 2 recording system prompt is empty");
  if (!isRecord(parsed.settings) || parsed.settings.temperature !== null
    || typeof parsed.settings.effort !== "string" || !integer(parsed.settings.maxTokens)
    || parsed.settings.variantSentToProvider !== false || typeof parsed.settings.jsonSchema !== "boolean"
    || !isRecord(parsed.settings.requestTuning)) {
    throw new Error("stage 2 recording settings are incomplete");
  }
  if (!isRecord(parsed.usage) || !integer(parsed.usage.calls) || !integer(parsed.usage.unknownCalls)) {
    throw new Error("stage 2 recording total usage is incomplete");
  }
  if (typeof parsed.estimatedCostUsd !== "number" || !Number.isFinite(parsed.estimatedCostUsd)) {
    throw new Error("stage 2 recording cost is not a number");
  }
  if (parsed.priceBand !== "off-peak" && parsed.priceBand !== "peak") {
    throw new Error("stage 2 recording price band is not off-peak or peak");
  }
  if (typeof parsed.pricesCheckedAt !== "string") {
    throw new Error("stage 2 recording is missing the price snapshot date");
  }
  const usage = callUsage(parsed.usage);
  const clearCalls = Array.isArray(parsed.clearCalls) ? parsed.clearCalls.map(call) : null;
  if (!clearCalls || clearCalls.length === 0) throw new Error("stage 2 recording has no clear order");
  return {
    kind: "recorded-real-run",
    notLive: true,
    recordedAt: parsed.recordedAt,
    provider: parsed.provider,
    model: parsed.model,
    settings: {
      effort: parsed.settings.effort as string,
      maxTokens: parsed.settings.maxTokens as number,
      temperature: null,
      requestTuning: parsed.settings.requestTuning as Stage2Recording["settings"]["requestTuning"],
      jsonSchema: parsed.settings.jsonSchema,
      variantSentToProvider: false,
    },
    system: parsed.system,
    clearCalls,
    vagueSessions: sessions(parsed.vagueSessions, 5, "probe 1"),
    phrasingSessions: sessions(parsed.phrasingSessions, 5, "probe 3"),
    usage: { ...usage, calls: parsed.usage.calls as number, unknownCalls: parsed.usage.unknownCalls as number },
    estimatedCostUsd: parsed.estimatedCostUsd,
    priceBand: parsed.priceBand,
    pricesCheckedAt: parsed.pricesCheckedAt,
  };
}

export function recordedBanner(recording: Stage2Recording = loadStage2Recording()): string {
  return `${RECORDED_BANNER_PREFIX}${recording.model}, ${recording.recordedAt}`;
}

/** Same distinct-answer rule as stage 2's runner: full JSON text of the order. */
export function distinctCount(calls: readonly RecordedCall[]): number {
  return new Set(calls.map((entry) => JSON.stringify(entry.output))).size;
}

function fieldValue(entry: RecordedCall, field: RecordedField): string {
  const item = entry.output.items[0];
  if (field === "needs_confirmation") return String(entry.output.needs_confirmation);
  if (!item) return "(no item)";
  if (field === "item name") return item.name ?? "(missing)";
  if (field === "size") return item.size ?? "(missing)";
  return item.price === undefined ? "(missing)" : String(item.price);
}

/** Which of the four lesson fields take more than one value across `calls`. */
export function variedFields(calls: readonly RecordedCall[]): RecordedField[] {
  return FIELDS.filter((field) => new Set(calls.map((entry) => fieldValue(entry, field))).size > 1);
}

function compact(entry: RecordedCall): string {
  const items = entry.output.items.length === 0
    ? "(no item)"
    : entry.output.items.map((item) =>
      `${item.name ?? "?"}/${item.size ?? "?"}/${item.price ?? "?"}`).join(", ");
  return `${items} total=${entry.output.total} needs_confirmation=${entry.output.needs_confirmation}`;
}

function tally(calls: readonly RecordedCall[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of calls) {
    const line = compact(entry);
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([line, count]) => `    ${count}× ${line}`);
}

function fieldLine(calls: readonly RecordedCall[]): string {
  const varied = new Set(variedFields(calls));
  return FIELDS.map((field) => `${field} ${varied.has(field) ? "varied" : "unchanged"}`).join(", ");
}

function saidOf(input: string): string {
  const match = /Customer said:\s*("(?:[^"\\]|\\.)*")/.exec(input);
  if (!match) return input;
  try {
    const parsed: unknown = JSON.parse(match[1]);
    return typeof parsed === "string" ? parsed : input;
  } catch {
    return input;
  }
}

function flagsAgree(sessions: readonly RecordedCall[][]): boolean {
  const first = sessions[0].map((entry) => entry.output.needs_confirmation).join(",");
  return sessions.every((session) =>
    session.map((entry) => entry.output.needs_confirmation).join(",") === first);
}

/**
 * The labelled section stage 2 prints after the scripted stand-in.
 * No network, no key, no new model call.
 */
export function formatRecordedStage2(recording: Stage2Recording = loadStage2Recording()): string {
  const vague = recording.vagueSessions.flat();
  const phrasing = recording.phrasingSessions.flat();
  const lines: string[] = [
    recordedBanner(recording),
    `Saved replies from one real ${recording.provider} run of the reference prompt. Not a live call. Not the scripted stand-in.`,
    `settings: effort=${recording.settings.effort}, maxTokens=${recording.settings.maxTokens}, temperature unset, jsonSchema=${recording.settings.jsonSchema}, variant is not sent to the provider`,
    `recorded usage: ${recording.usage.calls} calls · ${recording.usage.inputTokens} in / ${recording.usage.outputTokens} out · $${recording.estimatedCostUsd.toFixed(4)} · ${recording.priceBand} · prices checked ${recording.pricesCheckedAt}`,
    "",
    `Clear order — ${recording.clearCalls.length} call(s), ${distinctCount(recording.clearCalls)} distinct`,
    ...tally(recording.clearCalls),
    `  fields: ${fieldLine(recording.clearCalls)}`,
    "",
    `Probe 1 — same vague question, five times, ${recording.vagueSessions.length} sessions`,
    `  distinct answers per session: ${recording.vagueSessions.map((session) => distinctCount(session)).join(", ")}`,
    `  fields: ${fieldLine(vague)}`,
    "  answers:",
    ...tally(vague),
    "",
    `Probe 3 — needs_confirmation per phrasing${flagsAgree(recording.phrasingSessions) ? ` (same in all ${recording.phrasingSessions.length} sessions)` : ""}`,
  ];
  const shown = flagsAgree(recording.phrasingSessions)
    ? [recording.phrasingSessions[0]]
    : recording.phrasingSessions;
  shown.forEach((session, index) => {
    if (!flagsAgree(recording.phrasingSessions)) {
      lines.push(`  session ${index + 1}:`);
    }
    for (const entry of session) {
      lines.push(`  ${String(entry.output.needs_confirmation).padEnd(5)} ${JSON.stringify(saidOf(entry.input))}`);
    }
  });
  lines.push(`  fields across phrasings: ${fieldLine(phrasing)}`);
  return lines.join("\n");
}

if (import.meta.filename === process.argv[1]) {
  console.log(formatRecordedStage2());
}
