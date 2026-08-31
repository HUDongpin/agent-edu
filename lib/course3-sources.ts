import { DEEPSEEK_PRICING } from "@/lib/byok/pricing";
import { ANTHROPIC_COURSE_PRICING } from "@/course/cafe/pricing";

const COURSE3_SDK_VERSION = "0.117.1";

/**
 * Dated, build-time-only evidence for mutable Course 3 Provider guidance.
 *
 * Keep this manifest narrow and explicit: the static course page must never
 * fetch external documentation while it builds, and a mutable latest-doc URL
 * must never be presented as an immutable guarantee.
 */
export const COURSE3_SOURCE_FACTS = {
  officialSourcesReviewedAt: "2026-08-31",
  deepSeekPricingCheckedAt: DEEPSEEK_PRICING.checkedAt,
  claudePricingCheckedAt: ANTHROPIC_COURSE_PRICING.checkedAt,
  sdkVersion: COURSE3_SDK_VERSION,
  links: {
    deepSeekPricing: DEEPSEEK_PRICING.sourceUrl,
    deepSeekCompatibility: "https://api-docs.deepseek.com/guides/anthropic_api/",
    deepSeekThinking: "https://api-docs.deepseek.com/guides/thinking_mode/",
    claudeStructuredOutputs: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
    claudeEffort: "https://platform.claude.com/docs/en/build-with-claude/effort",
    claudeTokenCounting: "https://platform.claude.com/docs/en/build-with-claude/token-counting",
    claudeToolRunner: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner",
    claudePricing: ANTHROPIC_COURSE_PRICING.sourceUrl,
    sdk: `https://github.com/anthropics/anthropic-sdk-typescript/tree/sdk-v${COURSE3_SDK_VERSION}`,
  },
} as const;
