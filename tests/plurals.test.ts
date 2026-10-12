import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"] as const;
const STEMS = ["lab.billing.rejectedCount", "lab.billing.unknownCount", "cat.resultsCount"] as const;
/* Parenthetical plurals — "request(s)", "solicitud(es)", "Kurs(e)", "Anfrage(n)", "(e)s". */
const HACK = /\w\((?:s|es|e|n|en)\)|\(e\)s\b/;

const messages = (locale: string) =>
  JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;

function messageFiles(): string[] {
  const out: string[] = [];
  for (const dir of ["messages", "messages/widgets", "messages/handbook"]) {
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".json")) out.push(join(dir, name));
    }
  }
  return out;
}

test("no catalogue still fakes a plural with parentheses", () => {
  for (const file of messageFiles()) {
    const table = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    for (const [key, value] of Object.entries(table)) {
      assert.equal(typeof value, "string", `${file}: ${key} is not a string`);
      assert.doesNotMatch(String(value), HACK, `${file}: ${key} still uses a plural hack: ${value}`);
    }
  }
});

test("billing counts are real plural clauses, including the Arabic dual", async () => {
  const { billingText } = await import("../lib/lab/cost");
  const snapshot = {
    dispatchedCalls: 4, usageConfirmedCalls: 1, providerRejectedCalls: 1, unknownAfterSendCalls: 0,
    notSentAttempts: 0, knownUsd: 0.001234, hasUnknown: false,
    usage: { promptTokens: 0, promptCacheHitTokens: 0, promptCacheMissTokens: 0, completionTokens: 0 },
  };
  const en = messages("en");
  const t = (key: string) => en[key] ?? key;
  assert.equal(
    billingText(snapshot, t, "en"),
    "known subtotal $0.00123 + 1 provider-rejected request with no usage",
  );
  assert.equal(
    billingText({ ...snapshot, providerRejectedCalls: 0, unknownAfterSendCalls: 2, hasUnknown: true }, t, "en"),
    "known subtotal $0.00123 + 2 requests with unknown billing",
  );

  const ar = messages("ar");
  const ta = (key: string) => ar[key] ?? key;
  assert.match(
    billingText({ ...snapshot, providerRejectedCalls: 2 }, ta, "ar"),
    /طلبان \(2\)/,
  );
});

test("every plural category a count from 0 to 200 can reach has a message", () => {
  for (const locale of LOCALES) {
    const table = messages(locale);
    const rules = new Intl.PluralRules(locale);
    const categories = new Set<string>();
    for (let n = 0; n <= 200; n++) categories.add(rules.select(n));
    for (const stem of STEMS) {
      for (const category of categories) {
        const key = `${stem}.${category}`;
        assert.equal(typeof table[key], "string", `${locale}: missing ${key}`);
        assert.match(table[key], /\{n\}/, `${locale}: ${key} must carry {n}`);
      }
    }
  }
});

test("the catalogue no longer glues a count to cat.results", () => {
  const source = readFileSync("components/courses/Catalog.tsx", "utf8");
  assert.doesNotMatch(source, /t\("cat\.results"\)/);
});

test("the language menu does not count an unreachable plural form as missing", async () => {
  /* zh/ja/ko have no `.one` category, so they ship only `.other`. Counting
     English's `.one` keys against them made the language menu show 99%. */
  const { coverage } = await import("../lib/i18n");
  const en = messages("en");
  for (const locale of LOCALES) {
    assert.equal(coverage(messages(locale), en), 100, `${locale} coverage`);
  }
  assert.equal(coverage({ "x.other": "X" }, { "x.one": "1", "x.other": "X" }), 100);
  assert.equal(coverage({}, { "x.one": "1", "x.other": "X", y: "Y" }), 0);
});
