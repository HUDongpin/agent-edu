import assert from "node:assert/strict";
import test from "node:test";
import { createBillingLedger } from "../lib/byok/ledger";
import {
  DEEPSEEK_PRICING,
  conservativePromptTokenUpperBound,
  conservativePrice,
  priceBandAt,
  priceUsage,
  ratesForModel,
} from "../lib/byok/pricing";
import { ProviderError, type Usage } from "../lib/byok/types";
import {
  EVAL_PLAN,
  LAB_CONCURRENCY,
  RECOMMENDED_LAB_JOURNEY,
  STAGE_1_PLAN,
  STAGE_3_PLAN,
  TWO_EVAL_PLAN,
  assertEvalShape,
} from "../lib/lab/plans";

const USAGE: Usage = {
  promptTokens: 1_000_000,
  promptCacheHitTokens: 250_000,
  promptCacheMissTokens: 750_000,
  completionTokens: 500_000,
};

test("pricing snapshot is dated, sourced and complete for Flash and Pro", () => {
  assert.equal(DEEPSEEK_PRICING.checkedAt, "2026-08-21");
  assert.equal(
    DEEPSEEK_PRICING.sourceUrl,
    "https://api-docs.deepseek.com/quick_start/pricing/",
  );
  assert.deepEqual(ratesForModel("deepseek-v4-flash", "off-peak"), {
    cacheHitInput: 0.007,
    cacheMissInput: 0.22,
    output: 0.66,
  });
  assert.deepEqual(ratesForModel("deepseek-v4-flash", "peak"), {
    cacheHitInput: 0.014,
    cacheMissInput: 0.44,
    output: 1.32,
  });
  assert.deepEqual(ratesForModel("deepseek-v4-pro", "off-peak"), {
    cacheHitInput: 0.022,
    cacheMissInput: 0.66,
    output: 1.98,
  });
  assert.deepEqual(ratesForModel("deepseek-v4-pro", "peak"), {
    cacheHitInput: 0.044,
    cacheMissInput: 1.32,
    output: 3.96,
  });
});

test("peak windows use UTC boundaries from the approved snapshot", () => {
  assert.equal(priceBandAt(new Date("2026-08-21T00:59:59Z")), "off-peak");
  assert.equal(priceBandAt(new Date("2026-08-21T01:00:00Z")), "peak");
  assert.equal(priceBandAt(new Date("2026-08-21T03:59:59Z")), "peak");
  assert.equal(priceBandAt(new Date("2026-08-21T04:00:00Z")), "off-peak");
  assert.equal(priceBandAt(new Date("2026-08-21T06:00:00Z")), "peak");
  assert.equal(priceBandAt(new Date("2026-08-21T10:00:00Z")), "off-peak");
});

test("actual cost uses cache hit, miss and output for the selected model and band", () => {
  const flash = priceUsage("deepseek-v4-flash", USAGE, new Date("2026-08-21T00:00:00Z"));
  assert.equal(flash.known, true);
  assert.ok(flash.known);
  assert.equal(flash.usd, 0.25 * 0.007 + 0.75 * 0.22 + 0.5 * 0.66);

  const proPeak = priceUsage("deepseek-v4-pro", USAGE, new Date("2026-08-21T06:00:00Z"));
  assert.equal(proPeak.known, true);
  assert.ok(proPeak.known);
  assert.equal(proPeak.usd, 0.25 * 0.044 + 0.75 * 1.32 + 0.5 * 3.96);
});

test("missing usage is unknown with null dollars, never known zero", () => {
  const result = priceUsage("deepseek-v4-flash", undefined);
  assert.deepEqual(result, {
    known: false,
    usd: null,
    reason: "missing-usage",
    model: "deepseek-v4-flash",
    sourceUrl: DEEPSEEK_PRICING.sourceUrl,
    checkedAt: DEEPSEEK_PRICING.checkedAt,
  });
});

test("pre-run estimate always uses peak, cache miss and the output cap", () => {
  const estimate = conservativePrice("deepseek-v4-pro", 1_000, 7_600);
  assert.equal(estimate.band, "peak");
  assert.equal(estimate.usd, (1_000 * 1.32 + 7_600 * 3.96) / 1_000_000);
});

test("prompt estimates include framing and UTF-8 bytes without a tokenizer dependency", () => {
  const empty = conservativePromptTokenUpperBound([]);
  const ascii = conservativePromptTokenUpperBound([{ content: "a" }]);
  const nonAscii = conservativePromptTokenUpperBound([{ content: "學" }]);
  assert.equal(empty, 32);
  assert.equal(ascii, 49);
  assert.equal(nonAscii, 51);
  assert.ok(nonAscii > ascii);
});

test("billing ledger keeps a known subtotal and a separate unknown count", () => {
  const ledger = createBillingLedger();
  ledger.record({
    state: "usage-confirmed",
    requestedModel: "deepseek-v4-flash",
    usage: USAGE,
    occurredAt: Date.parse("2026-08-21T00:00:00Z"),
  });
  ledger.record({ state: "unknown-after-send", requestedModel: "deepseek-v4-flash" });
  ledger.record({ state: "provider-rejected-no-usage", requestedModel: "deepseek-v4-flash" });
  ledger.record({ state: "not-sent", requestedModel: "deepseek-v4-flash" });

  const snapshot = ledger.snapshot();
  assert.equal(snapshot.dispatchedCalls, 3);
  assert.equal(snapshot.usageConfirmedCalls, 1);
  assert.equal(snapshot.unknownAfterSendCalls, 1);
  assert.equal(snapshot.providerRejectedCalls, 1);
  assert.equal(snapshot.notSentAttempts, 1);
  assert.equal(snapshot.hasUnknown, true);
  assert.ok(snapshot.knownUsd > 0);
});

test("billing ledger preserves usage attached to a ProviderError", () => {
  const ledger = createBillingLedger();
  const error = new ProviderError("provider", "failed after usage", {
    billing: "usage-confirmed",
    requestedModel: "deepseek-v4-pro",
    usage: USAGE,
    createdAt: Date.parse("2026-08-21T00:00:00Z") / 1_000,
  });
  ledger.recordError(error, "deepseek-v4-flash");
  const snapshot = ledger.snapshot();
  assert.equal(snapshot.usageConfirmedCalls, 1);
  assert.equal(snapshot.usage.promptTokens, USAGE.promptTokens);
  assert.ok(snapshot.knownUsd > 1);
});

test("Lab plans lock 1, 3, 28, 56 and recommended 60-call caps", () => {
  assert.deepEqual(STAGE_1_PLAN, {
    calls: 1,
    maxOutputTokensPerCall: 250,
    maxOutputTokens: 250,
  });
  assert.deepEqual(STAGE_3_PLAN, {
    calls: 3,
    maxOutputTokensPerCall: 300,
    maxOutputTokens: 900,
  });
  assert.equal(EVAL_PLAN.generatorCalls, 20);
  assert.equal(EVAL_PLAN.judgeCalls, 8);
  assert.equal(EVAL_PLAN.calls, 28);
  assert.equal(EVAL_PLAN.maxOutputTokens, 7_600);
  assert.equal(EVAL_PLAN.concurrency, 4);
  assert.equal(TWO_EVAL_PLAN.calls, 56);
  assert.equal(RECOMMENDED_LAB_JOURNEY.calls, 60);
  assert.equal(RECOMMENDED_LAB_JOURNEY.maxOutputTokens, 16_350);
  assert.equal(LAB_CONCURRENCY, 4);
  assert.doesNotThrow(() => assertEvalShape(20, 8));
  assert.throws(() => assertEvalShape(20, 9), /Eval plan drifted/);
});
