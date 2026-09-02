export * from "./types";
export * from "./sources";
export * from "./figures";
export * from "./data";
export * from "./economics";

import {
  MAKE_MONEY_WITH_CODEX_LESSON_SLUGS,
  MAKE_MONEY_WITH_CODEX_LOCALES,
  type CodexIncomeLessonSlug,
  type CodexIncomeLocale,
} from "./types";

export function isCodexIncomeLocale(value: string): value is CodexIncomeLocale {
  return (MAKE_MONEY_WITH_CODEX_LOCALES as readonly string[]).includes(value);
}

export function isCodexIncomeLessonSlug(value: string): value is CodexIncomeLessonSlug {
  return (MAKE_MONEY_WITH_CODEX_LESSON_SLUGS as readonly string[]).includes(value);
}
