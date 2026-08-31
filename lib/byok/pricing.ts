import type { Model, Usage } from "./types";

export type PriceBand = "off-peak" | "peak";

export interface TokenRates {
  cacheHitInput: number;
  cacheMissInput: number;
  output: number;
}

export interface ModelPrice {
  offPeak: TokenRates;
  peak: TokenRates;
}

/**
 * DeepSeek's official USD prices per one million tokens.
 *
 * This is deliberately a dated snapshot rather than an anonymous collection
 * of numbers. Release canary must re-check the source before shipping.
 */
export const DEEPSEEK_PRICING = {
  currency: "USD",
  unitTokens: 1_000_000,
  checkedAt: "2026-08-21",
  sourceUrl: "https://api-docs.deepseek.com/quick_start/pricing/",
  /** JavaScript UTC weekday numbers: Monday (1) through Friday (5). */
  peakUtcWeekdays: [1, 2, 3, 4, 5],
  peakUtc: [
    { startHour: 1, endHour: 4 },
    { startHour: 6, endHour: 10 },
  ],
  models: {
    "deepseek-v4-flash": {
      offPeak: { cacheHitInput: 0.007, cacheMissInput: 0.22, output: 0.66 },
      peak: { cacheHitInput: 0.014, cacheMissInput: 0.44, output: 1.32 },
    },
    "deepseek-v4-pro": {
      offPeak: { cacheHitInput: 0.022, cacheMissInput: 0.66, output: 1.98 },
      peak: { cacheHitInput: 0.044, cacheMissInput: 1.32, output: 3.96 },
    },
  } satisfies Record<Model, ModelPrice>,
} as const;

export interface KnownPrice {
  known: true;
  usd: number;
  band: PriceBand;
  model: Model;
  sourceUrl: string;
  checkedAt: string;
}

export interface UnknownPrice {
  known: false;
  usd: null;
  reason: "missing-usage" | "invalid-usage";
  model: Model;
  sourceUrl: string;
  checkedAt: string;
}

export type UsagePrice = KnownPrice | UnknownPrice;

function dateFrom(value: Date | number): Date {
  if (value instanceof Date) return value;
  // Provider `created` values are Unix seconds; Date.now() is milliseconds.
  return new Date(value < 10_000_000_000 ? value * 1_000 : value);
}

export function priceBandAt(value: Date | number = Date.now()): PriceBand {
  const date = dateFrom(value);
  const weekday = date.getUTCDay();
  const hour = date.getUTCHours();
  const isPeakWeekday = DEEPSEEK_PRICING.peakUtcWeekdays.some(
    (peakWeekday) => peakWeekday === weekday,
  );
  return isPeakWeekday && DEEPSEEK_PRICING.peakUtc.some(({ startHour, endHour }) => (
    hour >= startHour && hour < endHour
  )) ? "peak" : "off-peak";
}

/** Pure model/band lookup shared by browser Lab and the local CLI course. */
export function ratesForModel(model: Model, band: PriceBand): TokenRates {
  const rates = DEEPSEEK_PRICING.models[model][band === "peak" ? "peak" : "offPeak"];
  return { ...rates };
}

function validCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function priceUsage(
  model: Model,
  usage: Usage | undefined,
  at: Date | number = Date.now(),
): UsagePrice {
  const common = {
    model,
    sourceUrl: DEEPSEEK_PRICING.sourceUrl,
    checkedAt: DEEPSEEK_PRICING.checkedAt,
  };
  if (!usage) return { ...common, known: false, usd: null, reason: "missing-usage" };
  if (![
    usage.promptTokens,
    usage.promptCacheHitTokens,
    usage.promptCacheMissTokens,
    usage.completionTokens,
  ].every(validCount)) {
    return { ...common, known: false, usd: null, reason: "invalid-usage" };
  }

  const band = priceBandAt(at);
  const rates = ratesForModel(model, band);
  const usd = (
    usage.promptCacheHitTokens * rates.cacheHitInput
    + usage.promptCacheMissTokens * rates.cacheMissInput
    + usage.completionTokens * rates.output
  ) / DEEPSEEK_PRICING.unitTokens;
  return { ...common, known: true, usd, band };
}

/** Peak + cache-miss estimate used before a user starts a paid action. */
export function conservativePrice(
  model: Model,
  promptTokens: number,
  maxOutputTokens: number,
): KnownPrice {
  if (![promptTokens, maxOutputTokens].every(validCount)) {
    throw new RangeError("Token estimates must be non-negative safe integers.");
  }
  const rates = ratesForModel(model, "peak");
  return {
    known: true,
    usd: (
      promptTokens * rates.cacheMissInput
      + maxOutputTokens * rates.output
    ) / DEEPSEEK_PRICING.unitTokens,
    band: "peak",
    model,
    sourceUrl: DEEPSEEK_PRICING.sourceUrl,
    checkedAt: DEEPSEEK_PRICING.checkedAt,
  };
}

/**
 * Conservative tokenizer-independent prompt bound for disclosure estimates.
 * A model token cannot contain less than one UTF-8 byte; the fixed allowance
 * covers per-message roles and chat framing that are not present in content.
 */
export function conservativePromptTokenUpperBound(
  messages: readonly { content: string }[],
): number {
  const encoder = new TextEncoder();
  return messages.reduce((total, message) => (
    total + encoder.encode(message.content).byteLength + 16
  ), 32);
}
