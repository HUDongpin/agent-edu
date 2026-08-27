import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyLatinLanguage,
  renderedLanguageCandidates,
  stripExplicitLanguageSubtrees,
} from "../scripts/i18n-rendered-language.mjs";

test("declared English subtrees are removed without swallowing localized siblings", () => {
  const markup = '<p>来源：<a lang="en"><span>How we built our research system</span></a><span>中文说明保留</span></p>';
  const stripped = stripExplicitLanguageSubtrees(markup, "en");
  assert.doesNotMatch(stripped, /How we built/);
  assert.match(stripped, /中文说明保留/);
  assert.match(stripped, /^<p>/);
});

test("nested target markup cannot reopen an explicitly English subtree", () => {
  const markup = '<aside lang="en">English evidence <span lang="zh-Hans">still part of the English evidence block</span></aside><p>中文</p>';
  const stripped = stripExplicitLanguageSubtrees(markup, "en");
  assert.doesNotMatch(stripped, /English evidence|still part/);
  assert.match(stripped, /中文/);
});

test("German, Spanish, and French prose is not mislabeled as English", () => {
  const samples = {
    de: "Diese Seite richtet die lokalen Werkzeuge ein und führt Sie dann sicher zum Repository.",
    es: "Esta página prepara las herramientas locales y verifica el proyecto sin conexión antes de continuar.",
    fr: "Cette page prépare les outils locaux et vérifie le projet sans connexion avant de continuer.",
  } as const;

  for (const [locale, sample] of Object.entries(samples)) {
    assert.equal(classifyLatinLanguage(sample, locale).classification, "target", `${locale}: ${sample}`);
    assert.equal(renderedLanguageCandidates(`<p>${sample}</p>`, locale).english.length, 0);
  }
});

test("an ordinary English teaching sentence still fails inside Latin-language pages", () => {
  const sentence = "You should verify the source before you use the claim in your final report.";
  for (const locale of ["de", "es", "fr"]) {
    const result = renderedLanguageCandidates(`<main><p>${sentence}</p></main>`, locale);
    assert.equal(result.english.length, 1, locale);
    assert.match(result.english[0].excerpt, /verify the source/);
  }
});

test("localized prose cannot hide an English instruction after a prose boundary", () => {
  const mixed = "Diese Seite erklärt den lokalen Ablauf: You should verify the source before you use the claim in your report.";
  const result = renderedLanguageCandidates(`<p>${mixed}</p>`, "de");
  assert.equal(result.english.length, 1);
  assert.match(result.english[0].excerpt, /^You should verify/);
});

test("unmarked English remains detectable in CJK and RTL locale shells", () => {
  const sentence = "How we built our multi agent research system with reliable evidence";
  for (const locale of ["zh-Hans", "zh-Hant", "ja", "ko", "ar"]) {
    assert.equal(renderedLanguageCandidates(`<p>${sentence}</p>`, locale).english.length, 1, locale);
  }
});

test("properly declared English evidence is outside the translated prose heuristic", () => {
  const result = renderedLanguageCandidates(
    '<p>来源标题：<cite lang="en">How we built our multi agent research system with reliable evidence</cite></p>',
    "zh-Hans",
  );
  assert.deepEqual(result, { english: [], ambiguous: [] });
});

test("ambiguous technical Latin text stays reviewable instead of being approved", () => {
  const result = renderedLanguageCandidates("<code>pipeline cache token budget latency trace receipt</code>", "fr");
  assert.equal(result.english.length, 0);
  assert.equal(result.ambiguous.length, 1);
});
