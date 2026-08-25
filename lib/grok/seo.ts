import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALE_CODES } from "@/lib/i18n";
import { SITE } from "@/lib/seo";

const OG_IMAGE = { url: "/docs/og-card.png", width: 2400, height: 1260 };
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

export function grokPage(slug?: string): string {
  return slug ? `grok/${slug}/` : "grok/";
}

export function grokUrlFor(locale: string, slug?: string): string {
  return `${SITE}/${locale}/${grokPage(slug)}`;
}

export function grokAlternatesFor(locale: string, slug?: string) {
  const languages: Record<string, string> = {};
  for (const code of LOCALE_CODES) languages[code] = grokUrlFor(code, slug);
  languages["x-default"] = grokUrlFor(DEFAULT_LOCALE, slug);
  return { canonical: grokUrlFor(locale, slug), languages };
}

export function grokSeoFor(options: {
  locale: string;
  slug?: string;
  title: string;
  description: string;
  siteName: string;
}): Metadata {
  const alternateLocale = LOCALE_CODES
    .filter((locale) => locale !== options.locale)
    .map((locale) => OPEN_GRAPH_LOCALES[locale]);
  return {
    title: options.title,
    description: options.description,
    alternates: grokAlternatesFor(options.locale, options.slug),
    openGraph: {
      type: "website",
      siteName: options.siteName,
      title: options.title,
      description: options.description,
      url: grokUrlFor(options.locale, options.slug),
      locale: OPEN_GRAPH_LOCALES[options.locale],
      alternateLocale,
      images: [{ ...OG_IMAGE, alt: options.title }],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
