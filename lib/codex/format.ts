import { formatDeterministicInteger } from "../deterministic-format";
import type { CodexLocale } from "./types";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PERCENT_WITH_SPACE = new Set<CodexLocale>(["de", "es", "fr"]);

/** Apply a localized placeholder template without discarding unknown fields. */
export function formatCodexTemplate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

function dateTimeLocale(locale: CodexLocale): string {
  // The platform's short `ar` route intentionally uses Arabic-Indic digits.
  // Naming a region prevents runtime ICU implementations from selecting the
  // Latin-number default that some environments associate with bare `ar`.
  return locale === "ar" ? "ar-SA" : locale;
}

/**
 * Format learner-visible integers without grouping or runtime-dependent ICU
 * digit selection. Machine identifiers and serialized evidence remain ASCII.
 */
export function formatCodexVisibleInteger(value: number, locale: CodexLocale): string {
  return formatDeterministicInteger(value, locale);
}

/**
 * Format an integer percentage in the course's nine visible locales. The
 * numeric input is an already-computed percentage in the inclusive 0..100
 * range, rather than a 0..1 ratio.
 */
export function formatCodexVisiblePercent(value: number, locale: CodexLocale): string {
  if (!Number.isInteger(value)) {
    throw new RangeError("Codex visible percent formatting requires an integer");
  }
  if (value < 0 || value > 100) {
    throw new RangeError("Codex visible percent must be between 0 and 100");
  }

  const formatted = formatCodexVisibleInteger(value, locale);
  if (locale === "ar") return `${formatted}٪`;
  if (PERCENT_WITH_SPACE.has(locale)) return `${formatted}\u00a0%`;
  return `${formatted}%`;
}

/**
 * Format one authoritative ASCII date-only value for human display. Parsing
 * and formatting are pinned to UTC so local time zones can never move the
 * visible calendar day. Keep the original value in `dateTime` and machine
 * exports; this helper returns display copy only.
 */
export function formatCodexUtcMediumDate(value: string, locale: CodexLocale): string {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new RangeError("Codex visible dates require YYYY-MM-DD input");
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError("Codex visible dates require a real calendar date");
  }

  return new Intl.DateTimeFormat(dateTimeLocale(locale), {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}
