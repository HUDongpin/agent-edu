import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const requiredRootKeys = ["cat.course9", "c.rag.title", "c.rag.blurb", "c.rag.level", "c.rag.meta"];

test("RAG root copy requires the live nine-locale catalogue fields without restoring the retired English-only disclosure", () => {
  for (const locale of locales) {
    const copy = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, unknown>;
    for (const key of requiredRootKeys) {
      assert.equal(typeof copy[key], "string", `${locale} is missing ${key}`);
      assert.ok((copy[key] as string).trim(), `${locale} has an empty ${key}`);
    }
    assert.equal(copy["c.rag.contentLanguage"], undefined, `${locale} restored the obsolete English-only disclosure`);
  }

  const checker = readFileSync("scripts/check-rag-course.mjs", "utf8");
  assert.match(checker, /obsolete English-only Course 9 disclosure remains/);
  assert.doesNotMatch(
    checker,
    /\["cat\.course9"[^\]]*"c\.rag\.contentLanguage"/,
    "the release checker must validate the live localized contract rather than require a dead disclosure key",
  );
});
