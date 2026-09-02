import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALE_CODES } from "@/lib/i18n";
import { SITE } from "@/lib/seo";
import type { ClaudeLessonSlug } from "./types";

export const CLAUDE_SITE = SITE;

export function claudePage(slug?: ClaudeLessonSlug): string {
  return slug ? `claude/${slug}/` : "claude/";
}

export function claudeUrlFor(locale: string, slug?: ClaudeLessonSlug): string {
  return `${CLAUDE_SITE}/${locale}/${claudePage(slug)}`;
}

export function claudeAlternates(locale: string, slug?: ClaudeLessonSlug) {
  const languages: Record<string, string> = {};
  for (const code of LOCALE_CODES) languages[code] = claudeUrlFor(code, slug);
  languages["x-default"] = claudeUrlFor(DEFAULT_LOCALE, slug);
  return { canonical: claudeUrlFor(locale, slug), languages };
}

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

export function claudeSeoFor(input: {
  readonly locale: string;
  readonly slug?: ClaudeLessonSlug;
  readonly title: string;
  readonly description: string;
  readonly siteName: string;
}): Metadata {
  const url = claudeUrlFor(input.locale, input.slug);
  const alternateLocale = LOCALE_CODES
    .filter((locale) => locale !== input.locale)
    .map((locale) => OPEN_GRAPH_LOCALES[locale]);
  return {
    title: input.title,
    description: input.description,
    alternates: claudeAlternates(input.locale, input.slug),
    openGraph: {
      type: "website",
      siteName: input.siteName,
      title: input.title,
      description: input.description,
      url,
      locale: OPEN_GRAPH_LOCALES[input.locale],
      alternateLocale,
      images: [{ ...OG_IMAGE, alt: input.title }],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
