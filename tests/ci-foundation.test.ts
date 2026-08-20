import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LOCALE_CODES, LOCALES, coverage, isLocale, metaFor, translator } from "../lib/i18n";
import { PAGES, alternatesFor, urlFor } from "../lib/seo";
import { expandManifest } from "../scripts/check-routes.mjs";
import { contentFindings, pathFindings } from "../scripts/check-secrets.mjs";

test("the locale contract is nine unique languages with Arabic as the only RTL locale", () => {
  assert.equal(LOCALE_CODES.length, 9);
  assert.equal(new Set(LOCALE_CODES).size, 9);
  assert.equal(metaFor("ar").dir, "rtl");
  assert.deepEqual(LOCALES.filter((locale) => locale.dir === "rtl").map((locale) => locale.code), ["ar"]);
  assert.equal(isLocale("zh-Hant"), true);
  assert.equal(isLocale("xx"), false);
});

test("translation helpers preserve fallback and coverage boundaries", () => {
  assert.equal(translator({ hello: "Bonjour" })("hello"), "Bonjour");
  assert.equal(translator({})("missing.key"), "missing.key");
  assert.equal(coverage({ a: "A" }, { a: "A", b: "B", "brand.name": "Agent Edu" }), 50);
});

test("every page has reciprocal nine-language SEO alternates and x-default", () => {
  for (const page of PAGES) {
    const alternates = alternatesFor("fr", page);
    assert.equal(alternates.canonical, urlFor("fr", page));
    assert.equal(Object.keys(alternates.languages).length, 10);
    for (const locale of LOCALE_CODES) {
      assert.equal(alternates.languages[locale], urlFor(locale, page));
    }
    assert.equal(alternates.languages["x-default"], urlFor("en", page));
  }
});

test("the committed route manifest expands to the verified 50-route baseline", () => {
  const manifest = JSON.parse(readFileSync("config/route-manifest.json", "utf8"));
  const expanded = expandManifest(manifest);
  assert.equal(expanded.publicRoutes.length, 48);
  assert.equal(expanded.prerenderRoutes.length, 50);
  assert.equal(new Set(expanded.prerenderRoutes).size, 50);
});

test("tracked-file secret rules fail closed without echoing matched values", () => {
  assert.deepEqual(pathFindings("notes/private.env"), ["environment-file"]);
  assert.ok(pathFindings("All API Keys.docx").includes("sensitive-extension"));
  const privateKey = ["-----BEGIN ", "PRIVATE KEY-----"].join("");
  const providerKey = ["sk", "-", "A".repeat(28)].join("");
  assert.equal(contentFindings(privateKey).at(0)?.id, "private-key");
  assert.equal(contentFindings(providerKey).at(0)?.id, "deepseek-key");
  assert.deepEqual(contentFindings("Authorization: " + "Bearer $" + "{key}"), []);
});
