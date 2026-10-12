import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"] as const;
const messages = (locale: string) =>
  JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
const snapshot = (dispatchedCalls: number) => ({
  dispatchedCalls, usageConfirmedCalls: dispatchedCalls, providerRejectedCalls: 0, unknownAfterSendCalls: 0,
  notSentAttempts: 0, knownUsd: 0.000123, hasUnknown: false,
  usage: { promptTokens: 0, promptCacheHitTokens: 0, promptCacheMissTokens: 0, completionTokens: 0 },
});

/* The spend line was `{n} {lab.spendCalls}`: a raw number glued to a bare
   plural noun, so after the first request English read "1 calls", and every
   language got the count in English position. */
test("the spend line no longer glues a count to a bare noun", () => {
  for (const file of ["components/lab/Lab.tsx", "components/lab/KeyBar.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /lab\.spendCalls/, `${file} still assembles the spend line`);
    assert.doesNotMatch(source, /dispatchedCalls\}\s*\{t\(/, `${file} still puts a raw count before a noun`);
  }
  for (const locale of LOCALES) assert.equal(messages(locale)["lab.spendCalls"], undefined, `${locale}: old fragment key`);
});

test("the spend line is one whole, correctly pluralised sentence in every language", async () => {
  const { spendText } = await import("../lib/lab/cost");
  for (const locale of LOCALES) {
    const table = messages(locale);
    const t = (key: string) => table[key] ?? key;
    const rules = new Intl.PluralRules(locale);
    for (let n = 0; n <= 200; n++) {
      const category = rules.select(n);
      // every category a counter can reach has its own message (other is always there)
      const key = `lab.spend.${category}`;
      assert.ok(table[key] ?? (category === "other" ? undefined : table["lab.spend.other"]),
        `${locale}: no message for ${n}`);
      if (n > 3) continue;
      const out = spendText(snapshot(n), t, locale);
      assert.doesNotMatch(out, /\{|lab\./, `${locale} ${n}: unfilled placeholder or raw key: ${out}`);
      assert.ok(out.includes(String(n)), `${locale} ${n}: count missing: ${out}`);
    }
    for (const [key, value] of Object.entries(table)) {
      if (!key.startsWith("lab.spend.")) continue;
      const names = [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      assert.deepEqual(names, ["billing", "calls"], `${locale}: ${key} must carry exactly {calls} and {billing}`);
    }
  }
  const en = messages("en");
  const t = (key: string) => en[key] ?? key;
  assert.equal(spendText(snapshot(1), t, "en"), "1 call · known subtotal $0.00012");
  assert.equal(spendText(snapshot(2), t, "en"), "2 calls · known subtotal $0.00012");
  assert.equal(spendText(snapshot(1200), t, "en"), "1,200 calls · known subtotal $0.00012");
  // Arabic picks its own category for each count
  const ar = messages("ar");
  const ta = (key: string) => ar[key] ?? key;
  assert.match(spendText(snapshot(2), ta, "ar"), /^استدعاءان/);
  assert.match(spendText(snapshot(5), ta, "ar"), /استدعاءات/);
});
