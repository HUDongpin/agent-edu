import {
  DEEPSEEK_PRICING,
  ratesForModel,
  type PriceBand,
} from "../../lib/byok/pricing";
import type { Model } from "../../lib/byok/types";

export interface CourseTokenUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
}

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

function isModel(value: string): value is Model {
  return Object.prototype.hasOwnProperty.call(DEEPSEEK_PRICING.models, value);
}

function validCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Price the course's accumulated DeepSeek usage against the same dated
 * snapshot as the browser Lab. A missing cache split is represented as zero
 * cached tokens, which prices every input token at the cache-miss rate.
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
  if (
    ![inputTokens, cachedInputTokens, outputTokens].every(validCount)
    || cachedInputTokens > inputTokens
  ) {
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
