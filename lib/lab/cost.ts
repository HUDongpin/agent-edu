/**
 * How the Lab writes money and counts for a reader.
 *
 * Every cost the Lab showed went through `$${usd.toFixed(5)}`, and the billing
 * line glued counts to noun phrases with `+` in English order. A German reader
 * got "$0.01234" inside a German sentence, a Japanese reader got the count in
 * front of a relative clause, and in Arabic the bidi algorithm, not a
 * translator, decided where each piece landed. Amounts are formatted here, in
 * the page's locale and the price snapshot's currency, and the billing line is
 * one whole message per shape, so every piece is placed by whoever wrote the
 * sentence.
 *
 * Latin digits are pinned because that is what the site already shows Arabic
 * readers: the draft time's DateTimeFormat resolves to them, and the Arabic
 * copy writes its own figures ("7,600", "(1 + 3 + 28 + 28)") in them, often in
 * the same sentence as one of these placeholders. It also keeps the static
 * HTML identical to the first client render on an engine whose locale data
 * predates that default.
 */
import type { BillingSnapshot } from "../byok/ledger";
import { DEEPSEEK_PRICING } from "../byok/pricing";
import { formatCount, pluralKey } from "../plural";

export { formatCount };

const DIGITS = { numberingSystem: "latn" } as const;

/** An amount in the price snapshot's currency. Five decimals, because each call costs a fraction of a cent. */
export function formatCost(amount: number, locale: string, fractionDigits = 5): string {
  return new Intl.NumberFormat(locale, {
    ...DIGITS,
    style: "currency",
    currency: DEEPSEEK_PRICING.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** A cap in whole seconds, written the way a {seconds} placeholder is read. */
export function formatSeconds(ms: number, locale: string): string {
  return formatCount(Math.round(ms / 1000), locale);
}

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => vars[name] ?? whole);
}

/**
 * The message for this count. `lookup` is the call site's own template, so
 * the scope extractor sees the stem as a template head in that file.
 */
function pluralMessage(
  stem: string,
  count: number,
  locale: string,
  t: (key: string) => string,
  lookup: (category: string) => string,
): string {
  const key = pluralKey(stem, count, locale, t);
  return lookup(key.slice(stem.length + 1));
}

/**
 * What this tab has spent, as one message.
 *
 * Four shapes rather than three fragments: the result is also interpolated as
 * `{billing}` into the Eval's live announcement, so it has to stay one string,
 * and only a whole sentence lets each language choose its own order, counter
 * words and connective. `{rejected}` and `{unknown}` are themselves whole
 * plural clauses, not a bare count glued to a noun.
 */
export function billingText(
  snapshot: BillingSnapshot,
  t: (key: string) => string,
  locale: string,
): string {
  const rejected = snapshot.providerRejectedCalls > 0;
  const key = rejected && snapshot.hasUnknown
    ? "lab.billing.knownRejectedUnknown"
    : rejected
    ? "lab.billing.knownRejected"
    : snapshot.hasUnknown
    ? "lab.billing.knownUnknown"
    : "lab.billing.known";
  return fill(t(key), {
    cost: formatCost(snapshot.knownUsd, locale),
    rejected: fill(pluralMessage(
      "lab.billing.rejectedCount",
      snapshot.providerRejectedCalls,
      locale,
      t,
      (category) => t(`lab.billing.rejectedCount.${category}`),
    ), { n: formatCount(snapshot.providerRejectedCalls, locale) }),
    unknown: fill(pluralMessage(
      "lab.billing.unknownCount",
      snapshot.unknownAfterSendCalls,
      locale,
      t,
      (category) => t(`lab.billing.unknownCount.${category}`),
    ), { n: formatCount(snapshot.unknownAfterSendCalls, locale) }),
  });
}

/**
 * The spend line: how many requests this tab dispatched, then the billing
 * sentence above.
 *
 * It was `{n} {lab.spendCalls}` — a bare noun after a raw number, so English
 * read "1 calls" and every language took the count in English position. Now
 * it is one message per CLDR plural category (`lab.spend.one`,
 * `lab.spend.other`, and Arabic's six), chosen with Intl.PluralRules via
 * `pluralKey`, the same way the handbook widgets choose theirs; a table that
 * only has `.other` is complete for Chinese, Japanese and Korean.
 */
export function spendText(
  snapshot: BillingSnapshot,
  t: (key: string) => string,
  locale: string,
): string {
  const calls = snapshot.dispatchedCalls;
  return fill(pluralMessage("lab.spend", calls, locale, t, (category) => t(`lab.spend.${category}`)), {
    calls: formatCount(calls, locale),
    billing: billingText(snapshot, t, locale),
  });
}
