/**
 * Locale configuration and the dictionary loader.
 *
 * Deliberately dependency-free: one flat JSON per language under /messages,
 * so a translator can fix a string by editing one line without knowing React
 * or installing anything. That was true of the old site and it stays true.
 */
import type { ReactNode } from "react";

export type Dir = "ltr" | "rtl";

export interface LocaleMeta {
  code: string;
  name: string;    // English name, for the menu's secondary label
  native: string;  // what speakers call it
  dir: Dir;
  flag: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: "en",      name: "English",               native: "English",  dir: "ltr", flag: "🇬🇧" },
  { code: "es",      name: "Spanish",               native: "Español",  dir: "ltr", flag: "🇪🇸" },
  { code: "fr",      name: "French",                native: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "de",      name: "German",                native: "Deutsch",  dir: "ltr", flag: "🇩🇪" },
  { code: "zh-Hans", name: "Chinese (Simplified)",  native: "简体中文",  dir: "ltr", flag: "🇨🇳" },
  { code: "zh-Hant", name: "Chinese (Traditional)", native: "繁體中文",  dir: "ltr", flag: "🇭🇰" },
  { code: "ja",      name: "Japanese",              native: "日本語",    dir: "ltr", flag: "🇯🇵" },
  { code: "ko",      name: "Korean",                native: "한국어",    dir: "ltr", flag: "🇰🇷" },
  { code: "ar",      name: "Arabic",                native: "العربية",   dir: "rtl", flag: "🇸🇦" },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);
export const DEFAULT_LOCALE = "en";

export function metaFor(code: string): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

export function isLocale(code: string): boolean {
  return LOCALE_CODES.includes(code);
}

export type Messages = Record<string, string>;

/**
 * Load one locale's strings, merged over English.
 *
 * The merge matters: a missing key renders the English string rather than a
 * blank element. A half-translated page is usable; an empty one is not.
 */
export async function getMessages(locale: string): Promise<Messages> {
  const en = (await import("@/messages/en.json")).default as Messages;
  if (locale === DEFAULT_LOCALE || !isLocale(locale)) return en;
  const own = (await import(`@/messages/${locale}.json`)).default as Messages;
  return { ...en, ...own };
}

/** Percentage of English keys this locale actually translates. */
export function coverage(own: Messages, en: Messages): number {
  const SKIP = new Set(["brand.name"]); // proper nouns are not translated
  let total = 0;
  let have = 0;
  for (const k of Object.keys(en)) {
    if (SKIP.has(k)) continue;
    total++;
    if (own[k] != null) have++;
  }
  return Math.round((have / total) * 100);
}

/** Build a translator bound to one dictionary. */
export function translator(messages: Messages) {
  return (key: string): string => messages[key] ?? key;
}

export interface LocaleParams {
  params: Promise<{ locale: string }>;
}

export type WithChildren = { children: ReactNode };
