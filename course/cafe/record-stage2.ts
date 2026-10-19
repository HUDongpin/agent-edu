/**
 * One-off recorder for course/cafe/recordings/stage2.json.
 *
 * Uses the reference SYSTEM prompt, the stage 2 probe sentences, and ask()
 * with the course defaults (model, effort, no temperature override). Prices
 * every call through the course ledger and stops before the next call if the
 * estimate reaches US$0.50. Does not print the API key.
 *
 *   npx tsx course/cafe/record-stage2.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { priceBandAt } from "../../lib/byok/pricing";
import { priceDeepSeekCourseUsage } from "./pricing";

const CAP_USD = 0.5;
const PROBE1_SESSIONS = 20;
const PROBE3_SESSIONS = 3;
const CLEAR_CALLS = 5;

if (process.argv.includes("--offline") || process.env.npm_config_offline === "true") {
  console.error("record-stage2 makes live calls. Do not pass --offline.");
  process.exit(1);
}
if (!process.env.DEEPSEEK_API_KEY) {
  console.error("DEEPSEEK_API_KEY is not set.");
  process.exit(1);
}

// Course defaults. An inherited override would record a different model.
process.env.CAFE_PROVIDER = "deepseek";
delete process.env.CAFE_MODEL;
delete process.env.CAFE_EFFORT;

function redact(value: unknown): string {
  const text = value instanceof Error ? (value.stack ?? value.message) : String(value);
  return text.replace(/sk-[A-Za-z0-9_-]{6,}/g, "sk-[redacted]");
}

function referenceSystem(): string {
  const source = readFileSync(new URL("../SOLUTIONS.md", import.meta.url), "utf8");
  const stage = source.split("## Stage 2")[1]?.split("## Stage 3")[0] ?? "";
  const fence = /```ts\r?\n([\s\S]*?)```/.exec(stage);
  const assigned = fence && /export const SYSTEM = `([\s\S]*?)`;/.exec(fence[1]);
  if (!assigned) throw new Error("Could not read the stage 2 SYSTEM prompt from SOLUTIONS.md");
  return assigned[1];
}

const { loadLlm, loadEvalset } = await import("../preflight");
const llm = await loadLlm();
const { ORDER_SCHEMA } = await loadEvalset();
const { CLEAR_ORDER, VAGUE_QUESTION, SAME_INTENT } = await import("../stage2-prompt/run");

const {
  ask, courseSpendLedger, MODEL, EFFORT, PROVIDER, PROVIDERS, tuning, OFFLINE, preflight,
} = llm;

if (OFFLINE) {
  console.error("offline is on; refusing to record scripted replies as real runs");
  process.exit(1);
}
if (PROVIDER !== "deepseek" || MODEL !== "deepseek-flash" || EFFORT !== "low") {
  console.error(`refusing to record ${PROVIDER} ${MODEL} effort=${EFFORT}; course defaults were not in force`);
  process.exit(1);
}
if (PROVIDERS[PROVIDER].quirks.jsonSchema) {
  console.error("refusing to record: this provider path enables json schema, which is not the DeepSeek default");
  process.exit(1);
}

const SYSTEM = referenceSystem();
const OUT = join(dirname(fileURLToPath(import.meta.url)), "recordings", "stage2.json");

interface CallUsage {
  inputTokens: number;
  cachedInputTokens: number;
  cacheCreationInputTokens: number;
  outputTokens: number;
}

function priceNow(): { usd: number; band: "off-peak" | "peak" } {
  const ledger = courseSpendLedger();
  if (ledger.unknownCalls > 0) {
    console.error("usage was not priceable with the course ledger; aborting");
    process.exit(2);
  }
  const band = priceBandAt();
  const priced = priceDeepSeekCourseUsage(MODEL, {
    inputTokens: ledger.inputTokens,
    cachedInputTokens: ledger.cachedInputTokens,
    cacheCreationInputTokens: ledger.cacheCreationInputTokens,
    outputTokens: ledger.outputTokens,
  }, band);
  if (!priced.known) {
    console.error(`cost unknown (${priced.reason}); aborting`);
    process.exit(2);
  }
  if (priced.usd >= CAP_USD) {
    console.error(`spend cap $${CAP_USD.toFixed(2)} reached at $${priced.usd.toFixed(4)}; aborting`);
    process.exit(2);
  }
  return { usd: priced.usd, band };
}

async function recordCall(said: string, variant: number): Promise<{
  input: string;
  variant: number;
  output: { items: unknown; total: unknown; needs_confirmation: unknown };
  usage: CallUsage;
}> {
  priceNow();
  const before = courseSpendLedger();
  const input = `Customer said: ${JSON.stringify(said)}`;
  let output: { items: unknown; total: unknown; needs_confirmation: unknown };
  try {
    output = await ask<{ items: unknown; total: unknown; needs_confirmation: unknown }>(input, {
      system: SYSTEM,
      schema: ORDER_SCHEMA,
      variant,
    });
  } catch (error) {
    console.error(redact(error).slice(0, 400));
    process.exit(1);
  }
  const after = courseSpendLedger();
  if (after.calls !== before.calls + 1 || after.unknownCalls !== before.unknownCalls) {
    console.error("the course ledger did not meter this call as one known usage; aborting");
    process.exit(2);
  }
  const { usd } = priceNow();
  console.error(`  $${usd.toFixed(4)}  variant=${variant}  ${said.slice(0, 48)}`);
  return {
    input,
    variant,
    output,
    usage: {
      inputTokens: after.inputTokens - before.inputTokens,
      cachedInputTokens: after.cachedInputTokens - before.cachedInputTokens,
      cacheCreationInputTokens: after.cacheCreationInputTokens - before.cacheCreationInputTokens,
      outputTokens: after.outputTokens - before.outputTokens,
    },
  };
}

preflight();
console.error(`cap $${CAP_USD.toFixed(2)} · probe 1 ×${PROBE1_SESSIONS} · probe 3 ×${PROBE3_SESSIONS} · clear ×${CLEAR_CALLS}`);

const clearCalls = [];
for (let i = 0; i < CLEAR_CALLS; i++) {
  console.error(`clear ${i + 1}/${CLEAR_CALLS}`);
  clearCalls.push(await recordCall(CLEAR_ORDER, 0));
}

const vagueSessions = [];
for (let session = 0; session < PROBE1_SESSIONS; session++) {
  console.error(`probe 1 session ${session + 1}/${PROBE1_SESSIONS}`);
  const calls = [];
  for (let i = 0; i < 5; i++) calls.push(await recordCall(VAGUE_QUESTION, i));
  vagueSessions.push(calls);
}

const phrasingSessions = [];
for (let session = 0; session < PROBE3_SESSIONS; session++) {
  console.error(`probe 3 session ${session + 1}/${PROBE3_SESSIONS}`);
  const calls = [];
  for (let i = 0; i < SAME_INTENT.length; i++) {
    calls.push(await recordCall(SAME_INTENT[i], 10 + i));
  }
  phrasingSessions.push(calls);
}

const ledger = courseSpendLedger();
const band = priceBandAt();
const priced = priceDeepSeekCourseUsage(MODEL, {
  inputTokens: ledger.inputTokens,
  cachedInputTokens: ledger.cachedInputTokens,
  cacheCreationInputTokens: ledger.cacheCreationInputTokens,
  outputTokens: ledger.outputTokens,
}, band);
if (!priced.known || ledger.unknownCalls > 0 || priced.usd >= CAP_USD) {
  console.error("final price check failed; not writing the fixture");
  process.exit(2);
}

const fixture = {
  kind: "recorded-real-run",
  notLive: true,
  recordedAt: new Date().toISOString(),
  provider: PROVIDER,
  model: MODEL,
  settings: {
    effort: EFFORT,
    maxTokens: 2000,
    temperature: null,
    requestTuning: tuning(EFFORT),
    jsonSchema: PROVIDERS[PROVIDER].quirks.jsonSchema,
    variantSentToProvider: false,
  },
  system: SYSTEM,
  clearCalls,
  vagueSessions,
  phrasingSessions,
  usage: ledger,
  estimatedCostUsd: priced.usd,
  priceBand: band,
  pricesCheckedAt: priced.checkedAt,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`wrote ${OUT}`);
console.log(`calls ${ledger.calls} · in ${ledger.inputTokens} · out ${ledger.outputTokens} · $${priced.usd.toFixed(6)} · ${band}`);
