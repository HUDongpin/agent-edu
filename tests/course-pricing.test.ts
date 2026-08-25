import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EMPTY_COURSE_USAGE_LEDGER,
  parseCourseUsage,
  priceAnthropicCourseUsage,
  priceDeepSeekCourseUsage,
  recordCourseUsage,
  type CourseTokenUsage,
} from "../course/cafe/pricing";

const usage: CourseTokenUsage = {
  inputTokens: 1_000,
  cachedInputTokens: 200,
  cacheCreationInputTokens: 0,
  outputTokens: 100,
};

test("Anthropic usage sums direct, cache-creation and cache-read input buckets", () => {
  assert.deepEqual(parseCourseUsage({
    input_tokens: 700,
    cache_creation_input_tokens: 100,
    cache_read_input_tokens: 200,
    output_tokens: 80,
  }), {
    known: true,
    shape: "anthropic",
    usage: {
      inputTokens: 1_000,
      cachedInputTokens: 200,
      cacheCreationInputTokens: 100,
      outputTokens: 80,
    },
  });
});

test("Anthropic null cache counters remain unknown rather than being guessed as zero", () => {
  assert.deepEqual(parseCourseUsage({
    input_tokens: 7,
    cache_creation_input_tokens: null,
    cache_read_input_tokens: null,
    output_tokens: 3,
  }), {
    known: false,
    reason: "invalid-usage",
  });
});

test("OpenAI-compatible usage requires an exact prompt hit/miss split", () => {
  assert.deepEqual(parseCourseUsage({
    prompt_tokens: 1_000,
    prompt_cache_hit_tokens: 200,
    prompt_cache_miss_tokens: 800,
    completion_tokens: 80,
  }), {
    known: true,
    shape: "openai",
    usage: {
      inputTokens: 1_000,
      cachedInputTokens: 200,
      cacheCreationInputTokens: 0,
      outputTokens: 80,
    },
  });

  for (const invalid of [
    {
      prompt_tokens: 1_000,
      prompt_cache_hit_tokens: 200,
      prompt_cache_miss_tokens: 799,
      completion_tokens: 80,
    },
    { prompt_tokens: 1_000, completion_tokens: 80 },
    {
      prompt_tokens: 1_000,
      prompt_cache_hit_tokens: 200,
      prompt_cache_miss_tokens: 800,
    },
  ]) {
    assert.deepEqual(parseCourseUsage(invalid), {
      known: false,
      reason: "invalid-usage",
    });
  }
});

test("usage parsing rejects missing, mixed, non-integer and overflowing values", () => {
  assert.deepEqual(parseCourseUsage(undefined), {
    known: false,
    reason: "missing-usage",
  });
  assert.deepEqual(parseCourseUsage(null), {
    known: false,
    reason: "missing-usage",
  });

  const invalid = [
    {},
    [],
    {
      input_tokens: 10,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 2,
      prompt_tokens: 10,
    },
    {
      input_tokens: -1,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 2,
    },
    {
      input_tokens: 1.5,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 2,
    },
    {
      input_tokens: Number.NaN,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 2,
    },
    {
      input_tokens: Number.POSITIVE_INFINITY,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 2,
    },
    {
      input_tokens: Number.MAX_SAFE_INTEGER,
      cache_creation_input_tokens: 1,
      cache_read_input_tokens: 0,
      output_tokens: 2,
    },
    {
      input_tokens: 10,
      cache_read_input_tokens: 0,
      output_tokens: 2,
    },
  ];
  for (const value of invalid) {
    assert.deepEqual(parseCourseUsage(value), {
      known: false,
      reason: "invalid-usage",
    });
  }
});

test("the pure usage ledger counts unknown calls without corrupting confirmed totals", () => {
  const confirmed = recordCourseUsage(EMPTY_COURSE_USAGE_LEDGER, {
    input_tokens: 8,
    cache_creation_input_tokens: 2,
    cache_read_input_tokens: 5,
    output_tokens: 3,
  });
  assert.deepEqual(confirmed, {
    inputTokens: 15,
    cachedInputTokens: 5,
    cacheCreationInputTokens: 2,
    outputTokens: 3,
    calls: 1,
    unknownCalls: 0,
  });

  const missing = recordCourseUsage(confirmed, undefined);
  assert.deepEqual(missing, {
    ...confirmed,
    calls: 2,
    unknownCalls: 1,
  });

  const inconsistent = recordCourseUsage(missing, {
    prompt_tokens: 10,
    prompt_cache_hit_tokens: 9,
    prompt_cache_miss_tokens: 9,
    completion_tokens: 1,
  });
  assert.deepEqual(inconsistent, {
    ...confirmed,
    calls: 3,
    unknownCalls: 2,
  });
});

test("aggregate token overflow becomes an unknown call instead of a rounded total", () => {
  const nearLimit = {
    ...EMPTY_COURSE_USAGE_LEDGER,
    inputTokens: Number.MAX_SAFE_INTEGER,
    calls: 4,
  };
  const next = recordCourseUsage(nearLimit, {
    input_tokens: 1,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    output_tokens: 0,
  });
  assert.deepEqual(next, {
    ...nearLimit,
    calls: 5,
    unknownCalls: 1,
  });
});

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

test("unknown DeepSeek models and invalid token buckets stay unpriceable", () => {
  const unknown = priceDeepSeekCourseUsage("future-model", usage, "peak");
  assert.equal(unknown.known, false);
  if (!unknown.known) assert.equal(unknown.reason, "unknown-model");

  const invalid = priceDeepSeekCourseUsage("deepseek-v4-pro", {
    ...usage,
    cacheCreationInputTokens: 801,
  }, "peak");
  assert.equal(invalid.known, false);
  if (!invalid.known) {
    assert.equal(invalid.reason, "invalid-usage");
    assert.equal(invalid.usd, null);
  }

  const invalidRead = priceDeepSeekCourseUsage("deepseek-v4-pro", {
    ...usage,
    cachedInputTokens: 1_001,
  }, "peak");
  assert.equal(invalidRead.known, false);
  if (!invalidRead.known) assert.equal(invalidRead.reason, "invalid-usage");
});

test("Anthropic pricing refuses cache creation and custom models", () => {
  const rates = { input: 5, output: 25, cachedInput: 0.5 };
  const known = priceAnthropicCourseUsage(
    "claude-opus-5",
    "claude-opus-5",
    usage,
    rates,
  );
  assert.deepEqual(known, {
    known: true,
    model: "claude-opus-5",
    usd: (800 * 5 + 200 * 0.5 + 100 * 25) / 1_000_000,
  });

  const cacheCreation = priceAnthropicCourseUsage(
    "claude-opus-5",
    "claude-opus-5",
    { ...usage, cacheCreationInputTokens: 100 },
    rates,
  );
  assert.equal(cacheCreation.known, false);
  if (!cacheCreation.known) {
    assert.equal(cacheCreation.reason, "cache-creation-price-unknown");
    assert.equal(cacheCreation.usd, null);
  }

  const customModel = priceAnthropicCourseUsage(
    "claude-custom",
    "claude-opus-5",
    usage,
    rates,
  );
  assert.equal(customModel.known, false);
  if (!customModel.known) assert.equal(customModel.reason, "unknown-model");

  const overflowingRate = priceAnthropicCourseUsage(
    "claude-opus-5",
    "claude-opus-5",
    usage,
    { ...rates, input: Number.MAX_VALUE },
  );
  assert.equal(overflowingRate.known, false);
  if (!overflowingRate.known) assert.equal(overflowingRate.reason, "invalid-usage");
});

test("the CLI meter makes a missing-usage response explicitly unpriceable", async () => {
  const previousProvider = process.env.CAFE_PROVIDER;
  const previousModel = process.env.CAFE_MODEL;
  process.env.CAFE_PROVIDER = "deepseek";
  process.env.CAFE_MODEL = "deepseek-v4-flash";
  try {
    const { meter, spend } = await import("../course/cafe/llm");
    meter({ content: [], usage: undefined });
    const summary = spend();
    assert.match(summary, /^1 call\(s\)/);
    assert.match(summary, /0 confirmed in \/ 0 confirmed out/);
    assert.match(summary, /cost unknown on deepseek-v4-flash/);
    assert.match(summary, /1 call\(s\) had missing, invalid, or unrecognised usage/);
    assert.doesNotMatch(summary, /\$0(?:\.0+)?/);
  } finally {
    if (previousProvider === undefined) delete process.env.CAFE_PROVIDER;
    else process.env.CAFE_PROVIDER = previousProvider;
    if (previousModel === undefined) delete process.env.CAFE_MODEL;
    else process.env.CAFE_MODEL = previousModel;
  }
});

test("the CLI meter wires all pricing decisions through the safe ledger", () => {
  const source = readFileSync("course/cafe/llm.ts", "utf8");
  assert.match(source, /spent = recordCourseUsage\(spent, usage\)/);
  assert.match(source, /spent\.unknownCalls > 0/);
  assert.match(source, /priceAnthropicCourseUsage\([\s\S]*?MODEL,[\s\S]*?CFG\.model,/);
  assert.doesNotMatch(source, /spent\.in \+=|spent\.cached \+=/);

  const responseStart = source.indexOf("const response: any = await getClient().messages.create");
  const meterAt = source.indexOf("meter(response);", responseStart);
  const refusalAt = source.indexOf('if (response.stop_reason === "refusal")', responseStart);
  assert.ok(responseStart >= 0 && meterAt > responseStart && refusalAt > meterAt,
    "HTTP-success refusals must be metered before ask() throws");
});

test("the Stage 6 public tool boundary defaults to the unattended fail-closed approver", () => {
  const source = readFileSync("course/stage6-harness/run.ts", "utf8");
  assert.match(source, /approve:\s*\(q: string\) => boolean = nobodyIsAwake/);
  assert.doesNotMatch(source, /approve:\s*\(q: string\) => boolean = \(\) => true/);
});
