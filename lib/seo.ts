/**
 * The canonical domain, the page list, and the per-page alternates.
 *
 * Every page used to inherit its `alternates` from app/[locale]/layout.tsx,
 * which names the locale root. So /en/lab/ shipped
 * `<link rel="canonical" href="https://aicourse.top/en/">` — telling a crawler
 * "this page is a duplicate of the home page, index that one instead" — and
 * its hreflang set listed the nine locale ROOTS rather than the nine
 * translations of the lab. Thirty-six of the forty-five pages did this. The
 * sitemap had it right from the start, so the two contradicted each other,
 * and the per-locale URLs the whole migration was for were pointing at
 * themselves as duplicates.
 *
 * One helper, used by the layout and by every page, so the two cannot drift
 * apart again. `SITE` lives here alone: it used to be copied into four files.
 */
import type { Metadata } from "next";
import { LOCALE_CODES, DEFAULT_LOCALE } from "@/lib/i18n";

export const SITE = "https://aicourse.top";

/** Every route under a locale, as a path relative to the locale root. */
export const PAGES = ["", "courses/", "handbook/", "lab/", "about/"] as const;
export type Page = (typeof PAGES)[number];

/** One shared card for now — see the note in app/[locale]/layout.tsx. */
const OG_IMAGE = { url: "/docs/og-card.png", width: 2400, height: 1260 };

export function urlFor(locale: string, page: Page = ""): string {
  return `${SITE}/${locale}/${page}`;
}

/**
 * Canonical and the full hreflang set for ONE page across every language.
 *
 * Self-referential (each page names itself) and reciprocal (each page names
 * all nine siblings), which is what tells a crawler these are translations of
 * one page rather than nine near-duplicates.
 */
export function alternatesFor(locale: string, page: Page = "") {
  const languages: Record<string, string> = {};
  for (const code of LOCALE_CODES) languages[code] = urlFor(code, page);
  languages["x-default"] = urlFor(DEFAULT_LOCALE, page);
  return { canonical: urlFor(locale, page), languages };
}

/**
 * The metadata every page shares, with its own URL threaded through the
 * canonical, the hreflang set and og:url.
 *
 * Next replaces `alternates` and `openGraph` wholesale when a page defines
 * them, rather than merging field by field — which is exactly how the og:url
 * and canonical came to be inherited from the layout in the first place. So
 * pages build the whole object here instead of overriding one key.
 */
export function seoFor(o: {
  locale: string;
  page: Page;
  title: string;
  description: string;
  siteName: string;
  /** When the card should say something shorter than the meta description. */
  ogDescription?: string;
}): Metadata {
  return {
    title: o.title,
    description: o.description,
    alternates: alternatesFor(o.locale, o.page),
    openGraph: {
      type: "website",
      siteName: o.siteName,
      title: o.title,
      description: o.ogDescription ?? o.description,
      url: urlFor(o.locale, o.page),
      locale: o.locale,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
