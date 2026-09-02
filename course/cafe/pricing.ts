import {
  DEEPSEEK_PRICING,
  ratesForModel,
  type PriceBand,
} from "../../lib/byok/pricing";
import type { Model } from "../../lib/byok/types";

export interface CourseTokenUsage {
  /** All billed input buckets, including cache reads and cache creation. */
  inputTokens: number;
  /** Cache-read / cache-hit input tokens. */
  cachedInputTokens: number;
  /** Cache-write tokens, tracked separately because Anthropic prices them separately. */
  cacheCreationInputTokens: number;
  outputTokens: number;
}

export type CourseUsageShape = "anthropic" | "openai";

export interface KnownCourseUsage {
  known: true;
  shape: CourseUsageShape;
  usage: CourseTokenUsage;
}

export interface UnknownCourseUsage {
  known: false;
  reason: "missing-usage" | "invalid-usage";
}

export type ParsedCourseUsage = KnownCourseUsage | UnknownCourseUsage;

export interface CourseUsageLedger extends CourseTokenUsage {
  calls: number;
  unknownCalls: number;
}

export const EMPTY_COURSE_USAGE_LEDGER: CourseUsageLedger = Object.freeze({
  inputTokens: 0,
  cachedInputTokens: 0,
  cacheCreationInputTokens: 0,
  outputTokens: 0,
  calls: 0,
  unknownCalls: 0,
});

export interface KnownCoursePrice {
  known: true;
  usd: number;
  band: PriceBand;
  model: Model;
  checkedAt: string;
  sourceUrl: string;
}

export interface UnknownCoursePrice {
  known: false;
  usd: null;
  reason: "unknown-model" | "invalid-usage";
  model: string;
  checkedAt: string;
  sourceUrl: string;
}

export type CoursePrice = KnownCoursePrice | UnknownCoursePrice;

export interface KnownAnthropicCoursePrice {
  known: true;
  usd: number;
  model: string;
  checkedAt: string;
  sourceUrl: string;
}

export interface UnknownAnthropicCoursePrice {
  known: false;
  usd: null;
  reason: "unknown-model" | "invalid-usage" | "cache-creation-price-unknown";
  model: string;
  checkedAt: string;
  sourceUrl: string;
}

export type AnthropicCoursePrice = KnownAnthropicCoursePrice | UnknownAnthropicCoursePrice;

/**
 * Claude's standard first-party global/default USD prices per one million
 * tokens. Optional regional, long-context, fast-mode, batch and other
 * modifiers are outside this deliberately narrow course snapshot.
 *
 * Anthropic publishes both five-minute and one-hour cache-write rates. The
 * compact runtime ledger records only an aggregate cache-creation count, so
 * those tokens remain deliberately unpriceable unless their TTL is known.
 */
export const ANTHROPIC_COURSE_PRICING = {
  currency: "USD",
  unitTokens: 1_000_000,
  checkedAt: "2026-08-31",
  sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
  scope: "standard first-party global/default pricing",
  models: {
    "claude-opus-5": {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10,
    },
  },
} as const;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function hasOwn(value: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function count(value: unknown): number | undefined {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : undefined;
}

function safeSum(...values: number[]): number | undefined {
  const result = values.reduce((sum, value) => sum + value, 0);
  return Number.isSafeInteger(result) && result >= 0 ? result : undefined;
}

/**
 * Convert either supported Provider usage shape into one inclusive input total.
 *
 * Anthropic defines total input as the sum of ordinary input, cache creation,
 * and cache reads. OpenAI-compatible DeepSeek responses instead expose an
 * inclusive prompt total plus a hit/miss decomposition; that decomposition
 * must exactly equal the total. Missing fields are not guessed.
 */
export function parseCourseUsage(value: unknown): ParsedCourseUsage {
  if (value === null || value === undefined) {
    return { known: false, reason: "missing-usage" };
  }
  const usage = record(value);
  if (!usage) return { known: false, reason: "invalid-usage" };

  const anthropicKeys = [
    "input_tokens",
    "output_tokens",
    "cache_creation_input_tokens",
    "cache_read_input_tokens",
  ] as const;
  const openAIKeys = [
    "prompt_tokens",
    "completion_tokens",
    "prompt_cache_hit_tokens",
    "prompt_cache_miss_tokens",
  ] as const;
  const hasAnthropicField = anthropicKeys.some((key) => hasOwn(usage, key));
  const hasOpenAIField = openAIKeys.some((key) => hasOwn(usage, key));
  if (hasAnthropicField === hasOpenAIField) {
    return { known: false, reason: "invalid-usage" };
  }

  if (hasAnthropicField) {
    if (!anthropicKeys.every((key) => hasOwn(usage, key))) {
      return { known: false, reason: "invalid-usage" };
    }
    const direct = count(usage.input_tokens);
    const created = count(usage.cache_creation_input_tokens);
    const cached = count(usage.cache_read_input_tokens);
    const output = count(usage.output_tokens);
    if (
      direct === undefined
      || created === undefined
      || cached === undefined
      || output === undefined
    ) {
      return { known: false, reason: "invalid-usage" };
    }
    const input = safeSum(direct, created, cached);
    if (input === undefined) return { known: false, reason: "invalid-usage" };
    return {
      known: true,
      shape: "anthropic",
      usage: {
        inputTokens: input,
        cachedInputTokens: cached,
        cacheCreationInputTokens: created,
        outputTokens: output,
      },
    };
  }

  if (!openAIKeys.every((key) => hasOwn(usage, key))) {
    return { known: false, reason: "invalid-usage" };
  }
  const input = count(usage.prompt_tokens);
  const cached = count(usage.prompt_cache_hit_tokens);
  const miss = count(usage.prompt_cache_miss_tokens);
  const output = count(usage.completion_tokens);
  if (
    input === undefined
    || cached === undefined
    || miss === undefined
    || output === undefined
  ) {
    return { known: false, reason: "invalid-usage" };
  }
  const split = safeSum(cached, miss);
  if (split === undefined || split !== input) {
    return { known: false, reason: "invalid-usage" };
  }
  return {
    known: true,
    shape: "openai",
    usage: {
      inputTokens: input,
      cachedInputTokens: cached,
      cacheCreationInputTokens: 0,
      outputTokens: output,
    },
  };
}

/** Pure ledger update used by meter(); unknown calls never corrupt known totals. */
export function recordCourseUsage(
  ledger: CourseUsageLedger,
  rawUsage: unknown,
): CourseUsageLedger {
  const calls = safeSum(ledger.calls, 1);
  if (calls === undefined) return ledger;

  const parsed = parseCourseUsage(rawUsage);
  if (!parsed.known) {
    const unknownCalls = safeSum(ledger.unknownCalls, 1);
    return unknownCalls === undefined ? ledger : { ...ledger, calls, unknownCalls };
  }

  const inputTokens = safeSum(ledger.inputTokens, parsed.usage.inputTokens);
  const cachedInputTokens = safeSum(
    ledger.cachedInputTokens,
    parsed.usage.cachedInputTokens,
  );
  const cacheCreationInputTokens = safeSum(
    ledger.cacheCreationInputTokens,
    parsed.usage.cacheCreationInputTokens,
  );
  const outputTokens = safeSum(ledger.outputTokens, parsed.usage.outputTokens);
  if (
    inputTokens === undefined
    || cachedInputTokens === undefined
    || cacheCreationInputTokens === undefined
    || outputTokens === undefined
  ) {
    const unknownCalls = safeSum(ledger.unknownCalls, 1);
    return unknownCalls === undefined ? ledger : { ...ledger, calls, unknownCalls };
  }

  return {
    inputTokens,
    cachedInputTokens,
    cacheCreationInputTokens,
    outputTokens,
    calls,
    unknownCalls: ledger.unknownCalls,
  };
}

function isModel(value: string): value is Model {
  return Object.prototype.hasOwnProperty.call(DEEPSEEK_PRICING.models, value);
}

function validCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function validCourseUsage(usage: CourseTokenUsage): boolean {
  const {
    inputTokens,
    cachedInputTokens,
    cacheCreationInputTokens,
    outputTokens,
  } = usage;
  return [
    inputTokens,
    cachedInputTokens,
    cacheCreationInputTokens,
    outputTokens,
  ].every(validCount)
    && cachedInputTokens <= inputTokens
    && cacheCreationInputTokens <= inputTokens - cachedInputTokens;
}

/**
 * Price the course's accumulated DeepSeek usage against the same dated
 * snapshot as the browser Lab. The parser admits only complete cache splits;
 * callers constructing this type directly must likewise provide every bucket.
 */
export function priceDeepSeekCourseUsage(
  model: string,
  usage: CourseTokenUsage,
  band: PriceBand,
): CoursePrice {
  const common = {
    model,
    checkedAt: DEEPSEEK_PRICING.checkedAt,
    sourceUrl: DEEPSEEK_PRICING.sourceUrl,
  };
  if (!isModel(model)) {
    return { ...common, known: false, usd: null, reason: "unknown-model" };
  }
  const { inputTokens, cachedInputTokens, outputTokens } = usage;
  if (!validCourseUsage(usage)) {
    return { ...common, known: false, usd: null, reason: "invalid-usage" };
  }

  const rates = ratesForModel(model, band);
  const cacheMissInputTokens = inputTokens - cachedInputTokens;
  return {
    ...common,
    known: true,
    model,
    band,
    usd: (
      cachedInputTokens * rates.cacheHitInput
      + cacheMissInputTokens * rates.cacheMissInput
      + outputTokens * rates.output
    ) / DEEPSEEK_PRICING.unitTokens,
  };
}

/**
 * Price only models covered by the dated course snapshot. Cache creation has
 * distinct five-minute and one-hour rates, but the aggregate Provider usage
 * shape does not identify the TTL, so any cache-write call is deliberately
 * unpriceable rather than guessed.
 */
export function priceAnthropicCourseUsage(
  model: string,
  usage: CourseTokenUsage,
): AnthropicCoursePrice {
  const common = {
    model,
    checkedAt: ANTHROPIC_COURSE_PRICING.checkedAt,
    sourceUrl: ANTHROPIC_COURSE_PRICING.sourceUrl,
  };
  const unknown = (
    reason: UnknownAnthropicCoursePrice["reason"],
  ): UnknownAnthropicCoursePrice => ({
    ...common,
    known: false,
    usd: null,
    reason,
  });
  if (!validCourseUsage(usage)) return unknown("invalid-usage");
  if (!Object.prototype.hasOwnProperty.call(ANTHROPIC_COURSE_PRICING.models, model)) {
    return unknown("unknown-model");
  }
  if (usage.cacheCreationInputTokens > 0) {
    return unknown("cache-creation-price-unknown");
  }

  const rates = ANTHROPIC_COURSE_PRICING.models[
    model as keyof typeof ANTHROPIC_COURSE_PRICING.models
  ];

  const freshInputTokens = usage.inputTokens - usage.cachedInputTokens;
  const usd = (
    freshInputTokens * rates.input
    + usage.cachedInputTokens * rates.cacheRead
    + usage.outputTokens * rates.output
  ) / ANTHROPIC_COURSE_PRICING.unitTokens;
  if (!Number.isFinite(usd)) return unknown("invalid-usage");
  return {
    ...common,
    known: true,
    usd,
  };
}
