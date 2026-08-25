import "server-only";

import type { CodexIncomeLocale, CodexIncomeLocaleCopy } from "./types";

type CopyModule = { default: CodexIncomeLocaleCopy };

const COPY_LOADERS: Record<CodexIncomeLocale, () => Promise<CopyModule>> = {
  en: () => import("@/messages/make-money-with-codex/en.json") as Promise<CopyModule>,
  es: () => import("@/messages/make-money-with-codex/es.json") as Promise<CopyModule>,
  fr: () => import("@/messages/make-money-with-codex/fr.json") as Promise<CopyModule>,
  de: () => import("@/messages/make-money-with-codex/de.json") as Promise<CopyModule>,
  "zh-Hans": () => import("@/messages/make-money-with-codex/zh-Hans.json") as Promise<CopyModule>,
  "zh-Hant": () => import("@/messages/make-money-with-codex/zh-Hant.json") as Promise<CopyModule>,
  ja: () => import("@/messages/make-money-with-codex/ja.json") as Promise<CopyModule>,
  ko: () => import("@/messages/make-money-with-codex/ko.json") as Promise<CopyModule>,
  ar: () => import("@/messages/make-money-with-codex/ar.json") as Promise<CopyModule>,
};

export async function loadCodexIncomeCopy(locale: CodexIncomeLocale): Promise<CodexIncomeLocaleCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}
