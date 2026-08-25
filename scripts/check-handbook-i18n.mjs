#!/usr/bin/env node
/**
 * Release contract for the handbook's long-form tables.
 *
 * The extractor proves that English still matches the frozen markup. This
 * proves the other eight files can replace every body and accessibility
 * segment without falling back to English or breaking a sentence at an
 * inline-element seam.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { walkHandbook } from "../lib/handbook/segments.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const problems = [];
const fail = (message) => problems.push(message);

const markupSource = readFileSync(join(ROOT, "lib/handbook/markup.ts"), "utf8")
  .replace(/^\s*export default MARKUP;\s*$/m, "");
const html = vm.runInNewContext(`${markupSource}\nMARKUP`, Object.create(null));
const segments = walkHandbook(html);
const owned = segments.filter((segment) => segment.kind !== "i18n");
const body = owned.filter((segment) => segment.kind === "body");
const english = JSON.parse(readFileSync(join(ROOT, "messages/handbook/en.json"), "utf8"));
const expectedKeys = owned.map((segment) => segment.key);

if (JSON.stringify(Object.keys(english)) !== JSON.stringify(expectedKeys)) {
  fail("messages/handbook/en.json is not in the exact segment order; run npm run handbook:extract");
}

/* Reviewed cases where the visible source is intentionally language-neutral
   code, a product name, a timing, or a genuine same-spelling loanword. */
const COMMON_IDENTICAL = new Set([
  "hb.body.p-code.10", "hb.body.pLiveBar.03", "hb.body.pLiveBar.07",
  "hb.body.pLiveBar.09", "hb.body.pLiveBar.11", "hb.body.p-loop.12",
  "hb.body.p-loop.13", "hb.body.p-loop.14", "hb.body.p-loop.15",
  "hb.body.p-graph.23", "hb.body.p-graph.25",
]);
const LOCALE_IDENTICAL = {
  es: new Set([
    "hb.body.p-context.21", "hb.body.winUsed.01", "hb.body.p-compare.17",
    "hb.body.p-compare.25", "hb.body.p-compare.32", "hb.body.p-compare.37",
    "hb.body.p-compare.45", "hb.body.p-compare.46", "hb.body.p-compare.52",
    "hb.body.p-compare.59", "hb.body.glossary.01", "hb.body.glossary.23",
  ]),
  fr: new Set([
    "hb.body.p-harness.20", "hb.body.p-security.07", "hb.body.p-security.26",
    "hb.body.glossary.01", "hb.body.glossary.21", "hb.body.glossary.23",
    "hb.body.gameCard.03",
  ]),
  de: new Set(["hb.body.glossary.13"]),
};

const references = (value) => [...String(value).matchAll(/§\s*\d+/g)].map((match) => match[0].replace(/\s/g, ""));
const protectedTerms = (value) => [...String(value).matchAll(
  /(?:DeepSeek|sessionStorage|(?:api|platform)\.deepseek\.com|kiosk\.js|[A-Za-z_][A-Za-z0-9_]*\([^)]*\))/g,
)].map((match) => match[0]);

/* Inline tags divide some grammatical sentences among several JSON values.
   Rebuild those values with browser-like whitespace collapsing and lint the
   seams, rather than validating each fragment in isolation. */
const INLINE = /^(?:\s|<\/?(?:em|strong|b|i|code|span|a|sup|sub|kbd|small|abbr)\b[^>]*>)*$/;
const groups = [];
let group = [body[0]];
for (let index = 1; index < body.length; index++) {
  if (INLINE.test(html.slice(body[index - 1].end, body[index].start))) group.push(body[index]);
  else { groups.push(group); group = [body[index]]; }
}
groups.push(group);

for (const locale of LOCALES) {
  const path = join(ROOT, `messages/handbook/${locale}.json`);
  let table;
  try { table = JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { fail(`${locale}: invalid or missing JSON (${error.message})`); continue; }

  const actualKeys = Object.keys(table);
  const missing = expectedKeys.filter((key) => table[key] == null);
  const extra = actualKeys.filter((key) => english[key] == null);
  if (missing.length) fail(`${locale}: ${missing.length} missing key(s): ${missing.slice(0, 8).join(", ")}`);
  if (extra.length) fail(`${locale}: ${extra.length} extra key(s): ${extra.slice(0, 8).join(", ")}`);
  if (!missing.length && !extra.length && JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    fail(`${locale}: keys are not in the canonical English order`);
  }

  for (const key of expectedKeys) {
    const value = table[key];
    if (typeof value !== "string") { if (value != null) fail(`${locale}:${key}: value is not a string`); continue; }
    if (!value.trim()) fail(`${locale}:${key}: empty translation`);
    if (value !== value.trim()) fail(`${locale}:${key}: leading or trailing whitespace`);
    if (/[<>]/.test(value)) fail(`${locale}:${key}: contains HTML delimiter; handbook values are plain text`);
    if (/⟪|⟫/.test(value)) fail(`${locale}:${key}: contains a translation-brief marker`);
    if (value === english[key] && !COMMON_IDENTICAL.has(key) && !LOCALE_IDENTICAL[locale]?.has(key)) {
      fail(`${locale}:${key}: identical to English without a reviewed code/name exception`);
    }
    if (String(references(value)) !== String(references(english[key]))) {
      fail(`${locale}:${key}: section references changed (${references(english[key])} -> ${references(value)})`);
    }
    for (const term of protectedTerms(english[key])) {
      if (!value.includes(term)) fail(`${locale}:${key}: protected code/product token changed or disappeared: ${term}`);
    }
  }

  for (const parts of groups.filter((candidate) => candidate.length > 1)) {
    if (!parts.every((part) => typeof table[part.key] === "string")) continue;
    const rebuilt = parts.map((part, index) => {
      const gap = index
        ? html.slice(parts[index - 1].end, part.start).replace(/<[^>]*>/g, "").replace(/\s+/g, " ")
        : "";
      return gap + table[part.key];
    }).join("");
    const label = parts.map((part) => part.key).join(" + ");
    const badPunctuation = locale === "fr" ? /\s+[,.]/ : /\s+[,.;:!?)]/;
    if (badPunctuation.test(rebuilt)) fail(`${locale}:${label}: whitespace seam before punctuation`);
    if (/ {2,}/.test(rebuilt.replace(/\n/g, " "))) fail(`${locale}:${label}: doubled-space seam`);
    if (/[（(]\s|\s[）)]/.test(rebuilt)) fail(`${locale}:${label}: whitespace seam inside brackets`);
    if (/[,，]\s*[,，]|[.。]\s*[.。]/.test(rebuilt)) fail(`${locale}:${label}: doubled punctuation seam`);
  }
}

if (problems.length) {
  console.error(`handbook i18n: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`handbook i18n: ${LOCALES.length} locales × ${expectedKeys.length} strings; keys, seams and protected tokens verified`);
