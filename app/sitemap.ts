import type { MetadataRoute } from "next";
import { LOCALE_CODES, DEFAULT_LOCALE } from "@/lib/i18n";
import { PAGES, urlFor } from "@/lib/seo";
import { AI_TUTOR_TRANSLATED_LOCALES } from "@/lib/ai-tutor";
import { PRODUCT_MANAGEMENT_TRANSLATED_LOCALES } from "@/lib/product-management";
import { AGENT_ORCHESTRATION_TRANSLATED_LOCALES } from "@/lib/agent-orchestration";
import { RAG_LOCALES } from "@/lib/rag";
import { MCP_LOCALES } from "@/lib/mcp";
import { isCourseKitPage } from "@/lib/course-kit/registry";
import { COURSE_KIT_REVIEWED_LOCALES } from "@/lib/course-kit/types";

export const dynamic = "force-static";

/**
 * The sitemap.
 *
 * The whole point of moving to per-locale URLs was that a search engine could
 * index /es/handbook/ as its own page rather than only ever seeing the English
 * copy. The pages carried hreflang for that from the start, but nothing ever
 * listed them, so the nine language versions had to be discovered by crawling
 * — and the language menu is a set of buttons, not links, so there was nothing
 * to crawl.
 *
 * Each entry declares only the locales with publishable instructional copy.
 * Fully translated courses expose their translated set; courses whose body is
 * still English expose only English plus x-default so the sitemap never claims
 * translations that do not exist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) => {
    const availableLocales = page === "ai-tutor/" || page.startsWith("ai-tutor/")
      ? AI_TUTOR_TRANSLATED_LOCALES
      : isCourseKitPage(page)
      ? COURSE_KIT_REVIEWED_LOCALES
      : page === "product-management/" || page.startsWith("product-management/")
      ? PRODUCT_MANAGEMENT_TRANSLATED_LOCALES
      : page === "agent-orchestration/" || page.startsWith("agent-orchestration/")
      ? AGENT_ORCHESTRATION_TRANSLATED_LOCALES
      : page === "rag/" || page.startsWith("rag/")
      ? RAG_LOCALES
      : page === "mcp/" || page.startsWith("mcp/")
      ? MCP_LOCALES
      : page === "prompts/" || page.startsWith("prompts/")
      || page === "make-money-with-codex/" || page.startsWith("make-money-with-codex/")
      || page === "claude-income/" || page.startsWith("claude-income/")
      ? [DEFAULT_LOCALE]
      : LOCALE_CODES;

    return availableLocales.map((locale) => ({
      url: urlFor(locale, page),
      lastModified: new Date(
        isCourseKitPage(page)
          ? "2026-08-26"
          : page === "rag/" || page.startsWith("rag/")
        || page === "mcp/" || page.startsWith("mcp/")
          ? "2026-08-24"
          : "2026-08-23",
      ),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries([
          ...availableLocales.map((code) => [code, urlFor(code, page)]),
          ["x-default", urlFor(DEFAULT_LOCALE, page)],
        ]),
      },
    }));
  });
}
