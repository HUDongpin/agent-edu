/**
 * CLDR plurals for a count, shared by the Lab and the catalogue.
 *
 * Returns stem.category when that message exists and stem.other when it does
 * not, so a Chinese, Japanese or Korean table that only ships ".other" is
 * complete. An unrecognised locale tag uses English rules.
 *
 * A call site passes a literal stem and looks the message up with a template
 * whose head is that stem. The scope extractor only records string literals
 * and template heads, so a stem assembled only in here never reaches the browser.
 */

const DIGITS = { numberingSystem: "latn" } as const;

/** A whole number, grouped the way the page's language groups it, in Latin digits. */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, DIGITS).format(value);
}

function pluralCategory(count: number, locale: string): Intl.LDMLPluralRule {
  try {
    return new Intl.PluralRules(locale).select(count);
  } catch {
    return new Intl.PluralRules("en").select(count);
  }
}

export function pluralKey(
  stem: string,
  count: number,
  locale: string,
  t: (key: string) => string,
): string {
  const key = `${stem}.${pluralCategory(count, locale)}`;
  return t(key) !== key ? key : `${stem}.other`;
}
