import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALE_CODES } from "@/lib/i18n";
import { SITE } from "@/lib/seo";
import { CURSOR_LESSON_SLUGS, type CursorLessonSlug } from "./types";

export const CURSOR_LESSON_PAGES = CURSOR_LESSON_SLUGS.map(
  (slug) => `cursor/${slug}/` as const,
);

export const CURSOR_PAGES = ["cursor/", ...CURSOR_LESSON_PAGES] as const;
export type CursorPage = (typeof CURSOR_PAGES)[number];

export function cursorLessonPage(slug: CursorLessonSlug): CursorPage {
  return `cursor/${slug}/` as CursorPage;
}

export function cursorUrlFor(locale: string, page: CursorPage): string {
  return `${SITE}/${locale}/${page}`;
}

function cursorAlternatesFor(locale: string, page: CursorPage) {
  const languages: Record<string, string> = {};
  for (const code of LOCALE_CODES) languages[code] = cursorUrlFor(code, page);
  languages["x-default"] = cursorUrlFor(DEFAULT_LOCALE, page);
  return { canonical: cursorUrlFor(locale, page), languages };
}

const OG_IMAGE = { url: "/images/ai-learning-social.webp", width: 2400, height: 1260 };
export const CURSOR_OPEN_GRAPH_LOCALES: Readonly<Record<string, string>> = {
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

export function cursorSeoFor(input: {
  readonly locale: string;
  readonly page: CursorPage;
  readonly title: string;
  readonly description: string;
  readonly siteName: string;
}): Metadata {
  const alternateLocale = LOCALE_CODES
    .filter((locale) => locale !== input.locale)
    .map((locale) => CURSOR_OPEN_GRAPH_LOCALES[locale]);
  return {
    title: input.title,
    description: input.description,
    alternates: cursorAlternatesFor(input.locale, input.page),
    openGraph: {
      type: "website",
      siteName: input.siteName,
      title: input.title,
      description: input.description,
      url: cursorUrlFor(input.locale, input.page),
      locale: CURSOR_OPEN_GRAPH_LOCALES[input.locale],
      alternateLocale,
      images: [{ ...OG_IMAGE, alt: input.title }],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
