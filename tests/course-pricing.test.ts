import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { priceDeepSeekCourseUsage } from "../course/cafe/pricing";

const usage = { inputTokens: 1_000, cachedInputTokens: 200, outputTokens: 100 };

test("the local course prices Flash and Pro through the shared DeepSeek snapshot", () => {
  const flash = priceDeepSeekCourseUsage("deepseek-v4-flash", usage, "off-peak");
  const pro = priceDeepSeekCourseUsage("deepseek-v4-pro", usage, "peak");
  assert.equal(flash.known, true);
  assert.equal(pro.known, true);
  if (!flash.known || !pro.known) return;
  assert.equal(flash.usd, (200 * 0.007 + 800 * 0.22 + 100 * 0.66) / 1_000_000);
  assert.equal(pro.usd, (200 * 0.044 + 800 * 1.32 + 100 * 3.96) / 1_000_000);
  assert.equal(pro.checkedAt, "2026-08-21");
});

test("missing cache split is all miss while unknown models and invalid usage stay unknown", () => {
  const noSplit = priceDeepSeekCourseUsage(
    "deepseek-v4-flash",
    { ...usage, cachedInputTokens: 0 },
    "off-peak",
  );
  assert.equal(noSplit.known, true);
  if (noSplit.known) {
    assert.equal(noSplit.usd, (1_000 * 0.22 + 100 * 0.66) / 1_000_000);
  }
  assert.deepEqual(
    priceDeepSeekCourseUsage("future-model", usage, "peak").known,
    false,
  );
  const invalid = priceDeepSeekCourseUsage(
    "deepseek-v4-pro",
    { ...usage, cachedInputTokens: 1_001 },
    "peak",
  );
  assert.equal(invalid.known, false);
  if (!invalid.known) assert.equal(invalid.usd, null);
});

test("the Stage 6 public tool boundary defaults to the unattended fail-closed approver", () => {
  const source = readFileSync("course/stage6-harness/run.ts", "utf8");
  assert.match(source, /approve:\s*\(q: string\) => boolean = nobodyIsAwake/);
  assert.doesNotMatch(source, /approve:\s*\(q: string\) => boolean = \(\) => true/);
});
