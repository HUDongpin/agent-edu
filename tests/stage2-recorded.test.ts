import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { priceDeepSeekCourseUsage } from "../course/cafe/pricing";
import { CLEAR_ORDER, SAME_INTENT, VAGUE_QUESTION } from "../course/stage2-prompt/run";
import {
  distinctCount,
  formatRecordedStage2,
  loadStage2Recording,
  RECORDED_BANNER_PREFIX,
  STAGE2_RECORDING_PATH,
  variedFields,
} from "../course/stage2-prompt/recorded";
import { contentFindings } from "../scripts/check-secrets.mjs";

const recording = loadStage2Recording();

function userText(input: string): string {
  const match = /Customer said:\s*("(?:[^"\\]|\\.)*")/.exec(input);
  assert.ok(match, input);
  return JSON.parse(match[1]) as string;
}

test("the stage 2 fixture is a labelled real run with course defaults and a recomputed cost", () => {
  assert.equal(recording.kind, "recorded-real-run");
  assert.equal(recording.notLive, true);
  assert.equal(recording.provider, "deepseek");
  assert.equal(recording.model, "deepseek-flash");
  assert.equal(recording.settings.effort, "low");
  assert.equal(recording.settings.temperature, null);
  assert.equal(recording.settings.maxTokens, 2000);
  assert.equal(recording.settings.jsonSchema, false);
  assert.equal(recording.settings.variantSentToProvider, false);
  assert.equal(recording.settings.requestTuning.thinking?.type, "disabled");
  assert.equal(recording.priceBand, "off-peak");
  assert.equal(recording.usage.unknownCalls, 0);
  assert.equal(recording.vagueSessions.length, 20);
  assert.equal(recording.phrasingSessions.length, 3);
  assert.equal(recording.clearCalls.length, 5);

  const solutions = readFileSync("course/SOLUTIONS.md", "utf8");
  const stage = solutions.split("## Stage 2")[1]?.split("## Stage 3")[0] ?? "";
  const fence = /```ts\r?\n([\s\S]*?)```/.exec(stage);
  const system = fence && /export const SYSTEM = `([\s\S]*?)`;/.exec(fence[1]);
  assert.ok(system, "stage 2 solution prompt missing");
  assert.equal(recording.system, system[1]);

  const calls = [
    ...recording.clearCalls,
    ...recording.vagueSessions.flat(),
    ...recording.phrasingSessions.flat(),
  ];
  assert.equal(calls.length, recording.usage.calls);
  const sum = (key: "inputTokens" | "cachedInputTokens" | "cacheCreationInputTokens" | "outputTokens") =>
    calls.reduce((total, call) => total + call.usage[key], 0);
  assert.equal(sum("inputTokens"), recording.usage.inputTokens);
  assert.equal(sum("cachedInputTokens"), recording.usage.cachedInputTokens);
  assert.equal(sum("cacheCreationInputTokens"), recording.usage.cacheCreationInputTokens);
  assert.equal(sum("outputTokens"), recording.usage.outputTokens);

  const priced = priceDeepSeekCourseUsage(recording.model, recording.usage, recording.priceBand);
  assert.equal(priced.known, true);
  if (priced.known) {
    assert.ok(Math.abs(priced.usd - recording.estimatedCostUsd) < 1e-9);
    assert.equal(priced.checkedAt, recording.pricesCheckedAt);
  }
  assert.ok(recording.estimatedCostUsd > 0);
  assert.ok(recording.estimatedCostUsd < 0.5);

  const raw = readFileSync(STAGE2_RECORDING_PATH, "utf8");
  assert.deepEqual(contentFindings(raw), []);
  assert.doesNotMatch(raw, /sk-[A-Za-z0-9_-]{8,}/);
  assert.doesNotMatch(raw, /"(?:id|request_id|message_id)"\s*:/);

  for (const call of recording.clearCalls) assert.equal(userText(call.input), CLEAR_ORDER);
  for (const session of recording.vagueSessions) {
    assert.equal(session.length, 5);
    for (const call of session) assert.equal(userText(call.input), VAGUE_QUESTION);
  }
  for (const session of recording.phrasingSessions) {
    assert.deepEqual(session.map((call) => userText(call.input)), [...SAME_INTENT]);
    assert.deepEqual(session.map((call) => call.output.needs_confirmation), [true, true, true, true, true]);
  }
});

test("the saved run is not five different answers, and the prose says so", () => {
  const counts = recording.vagueSessions.map((session) => distinctCount(session));
  assert.deepEqual(counts, [1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2, 2, 2, 2, 1, 1, 2, 1]);
  assert.equal(counts.filter((count) => count === 1).length, 11);
  assert.equal(counts.filter((count) => count === 2).length, 9);
  assert.deepEqual(variedFields(recording.vagueSessions.flat()), ["item name", "size", "price"]);
  assert.equal(distinctCount(recording.clearCalls), 1);
  assert.equal(recording.clearCalls[0].output.items[0]?.name, "flat white");
  assert.equal(recording.clearCalls[0].output.items[0]?.price, 4.5);
  assert.equal(recording.clearCalls[0].output.needs_confirmation, false);

  const text = formatRecordedStage2(recording);
  assert.equal(text.split("\n")[0], `${RECORDED_BANNER_PREFIX}${recording.model}, ${recording.recordedAt}`);
  assert.match(text, /Not a live call\. Not the scripted stand-in\./);
  assert.match(text, /distinct answers per session: 1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2, 2, 2, 2, 1, 1, 2, 1/);
  assert.match(text, /needs_confirmation unchanged/);
  assert.match(text, /same in all 3 sessions/);
  for (const said of SAME_INTENT) assert.match(text, new RegExp(said.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const stage2 = readFileSync("course/stage2-prompt/README.md", "utf8");
  const stage2zh = readFileSync("course/stage2-prompt/README.zh-Hans.md", "utf8");
  const course = readFileSync("course/README.md", "utf8");
  const courseZh = readFileSync("course/README.zh-Hans.md", "utf8");
  assert.match(stage2, /eleven with 1 distinct answer and nine with 2/);
  assert.match(stage2, /No session produced five different answers/);
  assert.match(stage2, /npx tsx course\/stage2-prompt\/recorded\.ts/);
  assert.doesNotMatch(stage2, /Usually it is not one/);
  assert.match(stage2zh, /十一个只有 1 种回答，九个有 2 种/);
  assert.match(stage2zh, /没有一个会话给出五种不同的回答/);
  assert.match(stage2zh, /npx tsx course\/stage2-prompt\/recorded\.ts/);
  assert.doesNotMatch(stage2zh, /通常不是一种/);
  assert.match(course, /\*\*a repeated answer can still be wrong\*\*/);
  assert.doesNotMatch(course, /the same question, five different answers/);
  assert.match(course, /stage2-prompt\/recorded\.ts/);
  assert.match(courseZh, /\*\*重复的回答仍可能是错的\*\*/);
  assert.doesNotMatch(courseZh, /同一个问题，五种不同的回答/);
  assert.match(readFileSync("course/stage0-hello/README.md", "utf8"), /stage2-prompt\/recorded\.ts/);
  assert.match(readFileSync("course/stage0-hello/README.zh-Hans.md", "utf8"), /stage2-prompt\/recorded\.ts/);
  assert.match(readFileSync("course/stage3-evals/README.md", "utf8"), /identical and still be wrong/);
  assert.match(readFileSync("course/stage3-evals/README.zh-Hans.md", "utf8"), /原样回来，却仍然是错的/);
});

function offlineEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    FORCE_COLOR: "0",
    DEEPSEEK_API_KEY: "not-a-real-key",
    ANTHROPIC_API_KEY: "",
    CAFE_PROVIDER: "deepseek",
    HTTPS_PROXY: "http://127.0.0.1:9",
    HTTP_PROXY: "http://127.0.0.1:9",
  };
}

test("recorded.ts and offline stage 2 print the label and do not call the provider", () => {
  const recorded = spawnSync(
    process.execPath,
    ["--import", "tsx", "course/stage2-prompt/recorded.ts"],
    { cwd: process.cwd(), encoding: "utf8", env: offlineEnv(), timeout: 30_000 },
  );
  assert.equal(recorded.status, 0, recorded.stderr || recorded.stdout);
  assert.match(recorded.stdout, /RECORDED real runs \(not live\) — deepseek-flash, 2026-10-19T04:42:07\.186Z/);
  assert.doesNotMatch(`${recorded.stdout}\n${recorded.stderr}`, /api\.deepseek\.com|401|Authentication/);

  const run = spawnSync(
    process.execPath,
    ["--import", "tsx", "course/stage2-prompt/run.ts", "--offline"],
    { cwd: process.cwd(), encoding: "utf8", env: offlineEnv(), timeout: 30_000 },
  );
  const runOut = `${run.stdout}\n${run.stderr}`;
  assert.equal(run.status, 1, runOut);
  assert.match(run.stdout, /RECORDED real runs \(not live\)/);
  assert.match(run.stdout, /scripted local stand-in/);
  assert.match(run.stdout, /SYSTEM is still empty/);
  assert.match(run.stderr, /Write the SYSTEM prompt/);
  assert.doesNotMatch(runOut, /api\.deepseek\.com/);

  const check = spawnSync(
    process.execPath,
    ["--import", "tsx", "course/check.ts", "2", "--offline"],
    { cwd: process.cwd(), encoding: "utf8", env: offlineEnv(), timeout: 30_000 },
  );
  const checkOut = `${check.stdout}\n${check.stderr}`;
  assert.equal(check.status, 1, checkOut);
  assert.ok(check.stdout.indexOf("RECORDED real runs (not live)") < check.stdout.indexOf("FAIL  SYSTEM is still empty"));
  assert.doesNotMatch(checkOut, /api\.deepseek\.com/);
});

test("a filled stage 2 prints the stand-in before the recorded label and spends nothing", { timeout: 60_000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), "stage2-recorded-"));
  try {
    for (const entry of readdirSync(".")) {
      if (entry === "course" || entry.startsWith(".")) continue;
      symlinkSync(join(process.cwd(), entry), join(dir, entry));
    }
    cpSync("course", join(dir, "course"), { recursive: true });
    const runPath = join(dir, "course", "stage2-prompt", "run.ts");
    const src = readFileSync(runPath, "utf8");
    const needle = "export const SYSTEM = ``;";
    assert.equal(src.includes(needle), true);
    writeFileSync(runPath, src.replace(needle, `export const SYSTEM = ${JSON.stringify(recording.system)};`));

    const run = spawnSync(
      process.execPath,
      ["--import", "tsx", "course/stage2-prompt/run.ts", "--offline"],
      { cwd: dir, encoding: "utf8", env: offlineEnv(), timeout: 30_000 },
    );
    const out = `${run.stdout}\n${run.stderr}`;
    assert.equal(run.status, 0, out);
    assert.ok(run.stdout.indexOf("distinct answer(s)") < run.stdout.indexOf("RECORDED real runs (not live)"));
    assert.match(run.stdout, /offline — no tokens spent/);
    assert.match(run.stdout, /scripted local stand-in/);
    assert.doesNotMatch(out, /api\.deepseek\.com/);

    const check = spawnSync(
      process.execPath,
      ["--import", "tsx", "course/check.ts", "2", "--offline"],
      { cwd: dir, encoding: "utf8", env: offlineEnv(), timeout: 30_000 },
    );
    const checkOut = `${check.stdout}\n${check.stderr}`;
    assert.equal(check.status, 0, checkOut);
    assert.ok(check.stdout.indexOf("a clear order parses") < check.stdout.indexOf("RECORDED real runs (not live)"));
    assert.doesNotMatch(checkOut, /api\.deepseek\.com/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
