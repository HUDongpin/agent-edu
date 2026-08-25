import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { SITE } from "@/lib/seo";
import type { ClaudeIncomeLessonSlug } from "./types";

export function claudeIncomePage(slug?: ClaudeIncomeLessonSlug): string {
  return slug ? `claude-income/${slug}/` : "claude-income/";
}

export function claudeIncomeUrlFor(locale: string, slug?: ClaudeIncomeLessonSlug): string {
  return `${SITE}/${locale}/${claudeIncomePage(slug)}`;
}

export function claudeIncomeAlternates(locale: string, slug?: ClaudeIncomeLessonSlug) {
  // The surrounding shell supports nine locales, but Course 12 content is
  // currently English. Do not claim false hreflang translations.
  const languages: Record<string, string> = {
    en: claudeIncomeUrlFor("en", slug),
  };
  languages["x-default"] = claudeIncomeUrlFor(DEFAULT_LOCALE, slug);
  return { canonical: claudeIncomeUrlFor(locale, slug), languages };
}

const OG_IMAGE = { url: "/docs/og-card.png", width: 2400, height: 1260 };

export function claudeIncomeSeoFor(input: {
  readonly locale: string;
  readonly slug?: ClaudeIncomeLessonSlug;
  readonly title: string;
  readonly description: string;
  readonly siteName: string;
}): Metadata {
  const url = claudeIncomeUrlFor(input.locale, input.slug);
  return {
    title: input.title,
    description: input.description,
    alternates: claudeIncomeAlternates(input.locale, input.slug),
    openGraph: {
      type: "website",
      siteName: input.siteName,
      title: input.title,
      description: input.description,
      url,
      locale: input.locale,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
