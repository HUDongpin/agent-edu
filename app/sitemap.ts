import type { MetadataRoute } from "next";
import { LOCALE_CODES, DEFAULT_LOCALE } from "@/lib/i18n";

const SITE = "https://aicourse.top";
const PAGES = ["", "courses/", "handbook/", "lab/", "about/"];

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
 * Each entry declares the whole set of alternates, which is what tells a
 * crawler these are nine translations of one page and not nine near-duplicates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const code of LOCALE_CODES) languages[code] = "";

  return PAGES.flatMap((page) =>
    LOCALE_CODES.map((locale) => ({
      url: `${SITE}/${locale}/${page}`,
      lastModified: new Date("2026-08-18"),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries([
          ...LOCALE_CODES.map((code) => [code, `${SITE}/${code}/${page}`]),
          ["x-default", `${SITE}/${DEFAULT_LOCALE}/${page}`],
        ]),
      },
    })),
  );
}
