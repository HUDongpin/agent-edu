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

test("embedLtr isolates LTR runs only for RTL locales", async () => {
  const { embedLtr, isolateLtr, formatCost } = await import("../lib/lab/cost");
  const LRI = "\u2066";
  const PDI = "\u2069";
  const date = "2026-09-22";
  const formula = "(1 + 3 + 28 + 28)";

  assert.equal(isolateLtr(date), `${LRI}${date}${PDI}`);
  assert.equal(embedLtr(date, "en"), date);
  assert.equal(embedLtr(date, "zh-Hans"), date);
  assert.equal(embedLtr(date, "ar"), `${LRI}${date}${PDI}`);
  assert.equal(embedLtr(formula, "ar"), `${LRI}${formula}${PDI}`);
  assert.equal(embedLtr(formula, "de"), formula);

  const enCost = formatCost(0.00012, "en");
  assert.equal(enCost, "$0.00012");
  assert.doesNotMatch(enCost, new RegExp(LRI));

  const arCost = formatCost(0.00012, "ar");
  assert.ok(arCost.startsWith(LRI), `Arabic cost missing LRI: ${JSON.stringify(arCost)}`);
  assert.ok(arCost.endsWith(PDI), `Arabic cost missing PDI: ${JSON.stringify(arCost)}`);
  assert.match(arCost, /0\.00012/);
});

test("Arabic spendText keeps currency inside an LTR isolate", async () => {
  const { spendText } = await import("../lib/lab/cost");
  const LRI = "\u2066";
  const PDI = "\u2069";
  const ar = messages("ar");
  const t = (key: string) => ar[key] ?? key;
  const out = spendText(snapshot(1), t, "ar");
  assert.match(out, new RegExp(`${LRI}[^${PDI}]*0\\.00012[^${PDI}]*${PDI}`));
  // English exact strings must stay byte-identical (no invisible marks).
  const en = messages("en");
  const te = (key: string) => en[key] ?? key;
  assert.equal(spendText(snapshot(1), te, "en"), "1 call · known subtotal $0.00012");
});

test("KeyBar wraps the journey formula and pricing date for RTL", () => {
  const source = readFileSync("components/lab/KeyBar.tsx", "utf8");
  assert.match(source, /embedLtr\("\(1 \+ 3 \+ 28 \+ 28\)"/);
  assert.match(source, /embedLtr\(DEEPSEEK_PRICING\.checkedAt/);
  assert.match(source, /embedLtr, formatCost/);
});
