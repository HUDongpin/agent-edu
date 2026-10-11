import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"] as const;
const KEYS = ["c.build.prerequisite", "build.beforeTools"] as const;

test("build copy names Node.js 24, the engines field the site actually requires", () => {
  const engines = JSON.parse(readFileSync("package.json", "utf8")).engines.node;
  assert.equal(engines, "24.x");
  for (const locale of LOCALES) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    for (const key of KEYS) {
      const value = messages[key];
      assert.equal(typeof value, "string", `${locale} ${key}`);
      assert.match(value, /Node\.js 24/, `${locale} ${key} must name Node.js 24`);
      assert.doesNotMatch(value, /20\.9/, `${locale} ${key} still names Node.js 20.9`);
    }
  }
});

test("the static-export comment names the Vercel host, not a GitHub Pages mirror", () => {
  const source = readFileSync("next.config.ts", "utf8");
  assert.match(source, /Vercel/);
  assert.match(source, /aicourse\.top/);
  assert.doesNotMatch(source, /GitHub Pages/);
});
