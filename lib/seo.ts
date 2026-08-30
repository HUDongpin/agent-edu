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
import { DEFAULT_LOCALE } from "@/lib/i18n";
import {
  KNOWN_LOCALIZED_PAGES,
  PUBLISHED_LOCALIZED_PAGES,
  contentLocalesForPage,
  releaseSurfaceFor,
  releaseSurfaceForPage,
  type CourseId,
} from "@/lib/release-surface";

export const SITE = "https://aicourse.top";

/**
 * Named route views remain for course-local helpers, but their contents are
 * projections of the registry. Publication state and route membership never
 * live in this SEO module.
 */
function childPagesFor(courseId: CourseId): readonly string[] {
  return releaseSurfaceFor(courseId).routes.slice(1);
}

export const CODEX_LESSON_PAGES = childPagesFor("codex");
export const CLAUDE_LESSON_PAGES = childPagesFor("claude");
export const CURSOR_LESSON_PAGES = childPagesFor("cursor");
export const GROK_LESSON_PAGES = childPagesFor("grok");
export const PROMPT_LESSON_PAGES = childPagesFor("prompts");
export const GITHUB_LESSON_PAGES = childPagesFor("github");
export const RAG_LESSON_PAGES = childPagesFor("rag");
export const SOFTWARE_ENGINEERING_LESSON_PAGES = childPagesFor("software-engineering");
export const MAKE_MONEY_WITH_CODEX_LESSON_PAGES = childPagesFor("make-money-with-codex");
export const CLAUDE_INCOME_LESSON_PAGES = childPagesFor("claude-income");
export const MCP_LESSON_PAGES = childPagesFor("mcp");
export const AI_TUTOR_MODULE_PAGES = childPagesFor("ai-tutor");
export const PRODUCT_MANAGEMENT_MODULE_PAGES = childPagesFor("product-management");
export const AGENT_ORCHESTRATION_MODULE_PAGES = childPagesFor("agent-orchestration");

/** SEO and sitemap consumers see only core and published-course routes. */
export const PAGES = PUBLISHED_LOCALIZED_PAGES;
export type Page = string;
export const INDEXABLE_PAGES = PAGES;

const KNOWN_PAGE_SET = new Set(KNOWN_LOCALIZED_PAGES);

export function codexLessonPage(slug: string): Page {
  const page = `codex/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown Codex lesson route: ${slug}`);
  }
  return page as Page;
}

export function claudeLessonPage(slug: string): Page {
  const page = `claude/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown Claude lesson route: ${slug}`);
  }
  return page as Page;
}

export function promptLessonPage(slug: string): Page {
  const page = `prompts/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown prompt lesson route: ${slug}`);
  }
  return page as Page;
}

export function githubLessonPage(slug: string): Page {
  const page = `github/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown GitHub lesson route: ${slug}`);
  }
  return page as Page;
}

export function ragLessonPage(slug: string): Page {
  const page = `rag/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown RAG lesson route: ${slug}`);
  }
  return page as Page;
}

export function softwareEngineeringLessonPage(slug: string): Page {
  const page = `software-engineering/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown Software Engineering lesson route: ${slug}`);
  }
  return page as Page;
}

export function makeMoneyWithCodexLessonPage(slug: string): Page {
  const page = `make-money-with-codex/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown Make Money with Codex lesson route: ${slug}`);
  }
  return page as Page;
}

export function mcpLessonPage(slug: string): Page {
  const page = `mcp/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown MCP lesson route: ${slug}`);
  }
  return page as Page;
}

export function aiTutorModulePage(slug: string): Page {
  const page = `ai-tutor/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown AI Tutor module route: ${slug}`);
  }
  return page as Page;
}

export function productManagementModulePage(slug: string): Page {
  const page = `product-management/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown Product Management module route: ${slug}`);
  }
  return page as Page;
}

export function agentOrchestrationModulePage(slug: string): Page {
  const page = `agent-orchestration/${slug}/`;
  if (!KNOWN_PAGE_SET.has(page)) {
    throw new Error(`Unknown Agent Orchestration module route: ${slug}`);
  }
  return page as Page;
}

/** Open Graph uses language_TERRITORY rather than the site's BCP-47 route tags. */
const OPEN_GRAPH_LOCALES: Readonly<Record<string, string>> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  "zh-Hans": "zh_CN",
  "zh-Hant": "zh_TW",
  ja: "ja_JP",
  ko: "ko_KR",
  ar: "ar_SA",
};

/** The platform card is language-neutral; course-specific cards can override it later. */
const OG_IMAGE = { url: "/images/ai-learning-social.webp", width: 2400, height: 1260 };

export function urlFor(locale: string, page: Page = ""): string {
  return `${SITE}/${locale}/${page}`;
}

/**
 * Canonical and the truthful hreflang set for one localized page.
 *
 * Platform pages name all nine siblings. Course pages name only the content
 * locales declared in the release registry; an English fallback can therefore
 * never masquerade as a translated page.
 */
export function alternatesFor(
  locale: string,
  page: Page = "",
  options?: {
    availableLocales?: readonly string[];
    canonicalLocale?: string;
  },
) {
  const surface = releaseSurfaceForPage(page);
  const availableLocales = options?.availableLocales ?? contentLocalesForPage(page);
  const canonicalLocale = options?.canonicalLocale
    ?? (availableLocales.includes(locale)
      ? locale
      : surface?.primaryLocale ?? DEFAULT_LOCALE);
  const languages: Record<string, string> = {};
  for (const code of availableLocales) languages[code] = urlFor(code, page);
  languages["x-default"] = urlFor(surface?.primaryLocale ?? DEFAULT_LOCALE, page);
  return { canonical: urlFor(canonicalLocale, page), languages };
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
  /** Restrict hreflang when long-form content is not translated for every shell locale. */
  availableLocales?: readonly string[];
  /** Canonical content locale when a translated shell renders unchanged source-language content. */
  canonicalLocale?: string;
}): Metadata {
  const surface = releaseSurfaceForPage(o.page);
  const availableLocales = o.availableLocales ?? contentLocalesForPage(o.page);
  const canonicalLocale = o.canonicalLocale
    ?? (availableLocales.includes(o.locale)
      ? o.locale
      : surface?.primaryLocale ?? DEFAULT_LOCALE);
  const openGraphLocale = OPEN_GRAPH_LOCALES[canonicalLocale];
  const alternateLocale = availableLocales
    .filter((locale) => locale !== canonicalLocale)
    .map((locale) => OPEN_GRAPH_LOCALES[locale]);

  return {
    title: o.title,
    description: o.description,
    alternates: alternatesFor(o.locale, o.page, {
      availableLocales,
      canonicalLocale,
    }),
    openGraph: {
      type: "website",
      siteName: o.siteName,
      title: o.title,
      description: o.ogDescription ?? o.description,
      url: urlFor(canonicalLocale, o.page),
      locale: openGraphLocale,
      alternateLocale,
      images: [{ ...OG_IMAGE, alt: o.title }],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
