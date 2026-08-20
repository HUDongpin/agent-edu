/**
 * What replaces reading the diff.
 *
 * `behaviour.ts` is verified code: twenty diagrams checked for text overlap,
 * 210 DOM queries against ids nobody may rename. The house rule that protects
 * it asks for the smallest possible change, and the reason that rule works is
 * that a small diff can be read. Moving the widgets' strings out touches every
 * readout in the file, and no reviewer is going to eyeball five hundred lines
 * and be sure nothing else moved.
 *
 * So the proof changes shape rather than the work shrinking. This asserts, on
 * every build, the things a reviewer would otherwise have to take on trust:
 *
 *   1  every key a widget asks for exists, and every key in the table is asked
 *      for — the file is @ts-nocheck, so nothing else catches a typo
 *   2  the {placeholders} a message declares are exactly the values the call
 *      site passes, in English and in every translation
 *   3  a plural carries the categories its language actually needs
 *   4  every id `behaviour.ts` queries still exists in `markup.ts`
 *   5  the count of strings still hard-coded only ever goes down
 *
 * Run by `npm run widgets:check`, alongside `handbook:check`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BEHAVIOUR = join(ROOT, "lib/handbook/behaviour.ts");
const MARKUP = join(ROOT, "lib/handbook/markup.ts");
const TABLES = join(ROOT, "messages/widgets");

/* The migration ratchet. `npm run widgets:check` prints the live figure; paste
   it here when you move another widget across. It may fall and never rise —
   that is the whole mechanism, and it is why this can be done a widget at a
   time without the half-finished state rotting. */
const REMAINING = { literals: 0, words: 0 };

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];

const problems = [];
const notes = [];
const fail = (m) => problems.push(m);

/* ------------------------------------------------------------------ *
 * A small lexer. behaviour.ts is one 1,900-line function of hand-rolled
 * JavaScript; a parser would be a dependency and a liability. All this
 * needs is to know where the strings are.
 * ------------------------------------------------------------------ */
function lex(src) {
  const out = [];
  let i = 0, line = 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === "/" && src[i + 1] === "/") { const e = src.indexOf("\n", i); i = e === -1 ? src.length : e; continue; }
    if (c === "/" && src[i + 1] === "*") {
      const e = src.indexOf("*/", i + 2);
      if (e === -1) { i = src.length; continue; }
      line += (src.slice(i, e).match(/\n/g) || []).length; i = e + 2; continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c, start = i, at = line; i++;
      let v = "";
      while (i < src.length) {
        const d = src[i];
        if (d === "\\") { v += src.slice(i, i + 2); i += 2; continue; }
        if (d === "\n") line++;
        if (d === q) { i++; break; }
        v += d; i++;
      }
      out.push({ kind: "str", value: v, start, end: i, line: at });
      continue;
    }
    i++;
  }
  return out;
}

const unescape = (s) => s
  .replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r")
  .replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\`/g, "`").replace(/\\\\/g, "\\");

/** The source text of a balanced (...) starting at the opening paren. */
function balanced(src, open, oc = "(", cc = ")") {
  let dep = 0, i = open, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === oc) dep++;
    else if (c === cc) { dep--; if (dep === 0) return src.slice(open, i + 1); }
  }
  return null;
}

/** Split a call's argument list on top-level commas. */
function args(list) {
  const inner = list.slice(1, -1);
  const parts = [];
  let dep = 0, q = null, cur = "";
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (q) { cur += c; if (c === "\\") { cur += inner[++i]; } else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; cur += c; continue; }
    if ("([{".includes(c)) dep++;
    else if (")]}".includes(c)) dep--;
    if (c === "," && dep === 0) { parts.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/* ------------------------------------------------------------------ *
 * 1 + 2 — keys and placeholders
 * ------------------------------------------------------------------ */
const behaviour = readFileSync(BEHAVIOUR, "utf8");

/** Every C.t / C.h / C.p call, with the key form and the vars it passes. */
const calls = [];
for (const m of behaviour.matchAll(/\bC\.([thp])\s*\(/g)) {
  const open = m.index + m[0].length - 1;
  const list = balanced(behaviour, open);
  if (!list) { fail(`unbalanced C.${m[1]}( at offset ${m.index}`); continue; }
  const a = args(list);
  const line = behaviour.slice(0, m.index).split("\n").length;
  calls.push({ fn: m[1], keyExpr: a[0] ?? "", varsExpr: a[m[1] === "p" ? 2 : 1] ?? "", line });
}

/** Keys a call can name: a literal, a ternary of literals, or a prefix. */
function keysOf(expr) {
  const lits = [...expr.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)]
    .map((m) => unescape(m[1] ?? m[2]))
    .filter((s) => s.startsWith("w."));
  if (!lits.length) return { keys: [], prefixes: [] };
  // `C.t('w.theme.mode.'+m)` — a literal glued to an expression is a prefix.
  if (/\+/.test(expr) && lits.length === 1 && expr.trim().startsWith("'")) {
    return { keys: [], prefixes: lits };
  }
  return { keys: lits, prefixes: [] };
}

/** Top-level names in a `{a:…, b:…}` object literal. */
function varNames(expr) {
  if (!expr || !expr.trim().startsWith("{")) return null;
  const body = balanced(expr, expr.indexOf("{"), "{", "}");
  if (!body) return null;
  return args("(" + body.slice(1, -1) + ")")
    .map((p) => /^([A-Za-z_$][\w$]*)\s*:/.exec(p)?.[1])
    .filter(Boolean);
}

const tables = {};
for (const loc of LOCALES) {
  try {
    tables[loc] = JSON.parse(readFileSync(join(TABLES, `${loc}.json`), "utf8"));
  } catch {
    tables[loc] = null; // not translated yet — legitimate, see copy.ts
  }
}
const en = tables.en;
if (!en) { fail("messages/widgets/en.json is missing or unparseable"); }

const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const used = new Set();
const pluralStems = new Set();

if (en) {
  for (const c of calls) {
    /* `C.t(C.p('w.x', n), vars)` — the key is chosen by the inner call, which
       was collected as its own entry. The outer call still owns the vars, so
       they are checked below against every one of that stem's forms. */
    const nested = /\bC\.p\s*\(/.test(c.keyExpr);
    const { keys, prefixes } = nested ? { keys: [], prefixes: [] } : keysOf(c.keyExpr);
    if (!nested && !keys.length && !prefixes.length) {
      fail(`behaviour.ts:${c.line} — C.${c.fn}() key is not a literal: ${c.keyExpr}`);
    }
    for (const p of prefixes) {
      const hits = Object.keys(en).filter((k) => k.startsWith(p));
      if (!hits.length) fail(`behaviour.ts:${c.line} — no key starts with "${p}"`);
      hits.forEach((k) => used.add(k));
    }
    for (const k of keys) {
      if (c.fn === "p") {
        pluralStems.add(k);
        const cats = Object.keys(en).filter((x) => x.startsWith(k + "."));
        if (!cats.length) fail(`behaviour.ts:${c.line} — no plural forms for "${k}"`);
        cats.forEach((x) => used.add(x));
        continue;
      }
      used.add(k);
      if (en[k] == null) { fail(`behaviour.ts:${c.line} — unknown key "${k}"`); continue; }
      const want = holes(en[k]);
      const got = (varNames(c.varsExpr) ?? []).sort();
      // A key reached through C.p() gets its vars checked at the outer call.
      if (String(want) !== String(got)) {
        fail(`behaviour.ts:${c.line} — "${k}" wants {${want.join("} {")}} ` +
             `but the call passes ${got.length ? "{" + got.join("} {") + "}" : "nothing"}`);
      }
    }
    // C.t(C.p('w.x', n), {…}) — check the vars against every plural form.
    const inner = /\bC\.p\s*\(\s*'([^']+)'/.exec(c.keyExpr)?.[1];
    if (inner) {
      const got = (varNames(c.varsExpr) ?? []).sort();
      for (const k of Object.keys(en).filter((x) => x.startsWith(inner + "."))) {
        if (String(holes(en[k])) !== String(got)) {
          fail(`behaviour.ts:${c.line} — "${k}" wants {${holes(en[k]).join("} {")}} ` +
               `but the call passes ${got.length ? "{" + got.join("} {") + "}" : "nothing"}`);
        }
      }
    }
  }

  for (const k of Object.keys(en)) {
    if (!used.has(k)) fail(`messages/widgets/en.json — "${k}" is not used by any widget`);
  }
}

/* ------------------------------------------------------------------ *
 * 2b + 3 — every translation agrees with English
 * ------------------------------------------------------------------ */
const CATS = /\.(zero|one|two|few|many|other)$/;

/** The categories a locale's plural rules can actually produce. */
function categories(loc) {
  const rules = new Intl.PluralRules(loc);
  const out = new Set(["other"]);
  for (let n = 0; n <= 200; n++) out.add(rules.select(n));
  return out;
}

/**
 * The English string a translated key answers to.
 *
 * A plural form answers to its stem's `.other`, not to a key of the same
 * name: Arabic needs `zero`, `two`, `few` and `many`, and English has none
 * of them. Asking for an identical key would reject the very forms the
 * plural check below goes on to demand.
 */
function counterpart(k) {
  if (en[k] != null) return en[k];
  const m = CATS.exec(k);
  if (m && pluralStems.has(k.slice(0, m.index))) return en[`${k.slice(0, m.index)}.other`];
  return null;
}

for (const loc of LOCALES) {
  const own = tables[loc];
  if (!own || loc === "en" || !en) continue;
  const cats = categories(loc);
  for (const [k, v] of Object.entries(own)) {
    const source = counterpart(k);
    if (source == null) { fail(`messages/widgets/${loc}.json — "${k}" is not a key in English`); continue; }
    const m = CATS.exec(k);
    if (m && pluralStems.has(k.slice(0, m.index)) && !cats.has(m[1])) {
      fail(`messages/widgets/${loc}.json — "${k}" is a plural form ${loc} never uses`);
      continue;
    }
    const want = holes(source), got = holes(v);
    if (String(want) !== String(got)) {
      fail(`messages/widgets/${loc}.json — "${k}" must keep {${want.join("} {")}}, has ` +
           `${got.length ? "{" + got.join("} {") + "}" : "none"}`);
    }
  }
  /* Count against the keys this language actually needs, so a locale with one
     plural category is not reported as missing the forms it has no use for. */
  const wanted = Object.keys(en).filter((k) => {
    const m = CATS.exec(k);
    return !(m && pluralStems.has(k.slice(0, m.index))) || cats.has(m[1]);
  });
  const missing = wanted.filter((k) => own[k] == null).length;
  if (missing) notes.push(`${loc}: ${missing} of ${wanted.length} strings still English`);
}

/* A language only needs the categories its plural rules can actually
   produce. Arabic has six, Japanese one; demanding all six everywhere would
   send translators a file full of forms their language does not have. */
for (const stem of pluralStems) {
  for (const loc of LOCALES) {
    const own = tables[loc];
    if (!own) continue;
    const rules = new Intl.PluralRules(loc);
    const needed = new Set(["other"]);
    for (let n = 0; n <= 200; n++) needed.add(rules.select(n));
    const have = Object.keys(own).filter((k) => k.startsWith(stem + ".")).length;
    if (!have) continue; // this locale has not started on this key
    for (const cat of needed) {
      if (own[`${stem}.${cat}`] == null) {
        fail(`messages/widgets/${loc}.json — "${stem}" is partly translated but ` +
             `missing the "${cat}" form, which ${loc} needs`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 4 — the DOM queries still resolve
 * ------------------------------------------------------------------ */
const markup = readFileSync(MARKUP, "utf8");
const markupIds = new Set([...markup.matchAll(/id=\\"([^\\"]+)\\"/g)].map((m) => m[1]));

/* Only what is actually handed to a query. Scanning every `#word` in every
   string also catches `url(#ga)` — an SVG marker the widget creates in its
   own <defs>, which has no business being in the markup. */
const queried = new Set();
/* The trailing `[),]` keeps out `getElementById('p-'+id)`: a selector glued
   to an expression names no single id, and guessing at one would either miss
   a real break or invent a false one. */
for (const m of behaviour.matchAll(/(?:\$\$?|querySelector(?:All)?|getElementById)\s*\(\s*(['"])((?:[^'"\\]|\\.)*)\1\s*[),]/g)) {
  const sel = unescape(m[2]);
  if (m[0].includes("getElementById")) { queried.add(sel); continue; }
  for (const id of sel.matchAll(/#([A-Za-z][\w-]*)/g)) queried.add(id[1]);
}
const dangling = [...queried].filter((id) => !markupIds.has(id));
if (markupIds.size === 0) {
  fail("could not read any ids out of markup.ts — the id check did not run");
} else if (dangling.length) {
  fail(`behaviour.ts queries ${dangling.length} id(s) that markup.ts does not ` +
       `define: ${dangling.slice(0, 8).join(", ")}${dangling.length > 8 ? " …" : ""}`);
} else {
  notes.push(`${queried.size} queried ids all resolve against markup.ts`);
}

/* ------------------------------------------------------------------ *
 * 5 — the ratchet
 * ------------------------------------------------------------------ */
const NOISE = [
  /^var\(--/, /^-soft\)?$/, /^translate\(/, /^\)\s*rotate/, /^text-anchor:/,
  /^M$/, /^[,\d.\s]*L$/, /^@\//, /^use strict$/, /^Arrow(Up|Down|Left|Right)$/,
  /^\(prefers-/, /^--rc/, /^Bearer $/, /^HTTP $/, /^[a-z]+\d*>[a-z]*$/,
  /^\]\/g/, /^\}\[c\]/, /^w\./, /^#[a-z]/i, /^\.[a-z]/, /^\[?data-/,
  // Bare lower/camel-case literals in this module are event names, DOM/SVG
  // attributes, state ids or code identifiers. Visible lower-case kiosk
  // fixtures are intentionally C.t(...) calls and therefore never reach here.
  /^[a-z][a-z0-9_-]*$/, /^[a-z]+(?:[A-Z][a-z]*)+$/,
  // Keyboard values, HTML assembly, CSS values, SVG geometry and internal
  // graph ids are executable structure, not reader-facing prose. Keep these
  // patterns narrow: a closed element containing text does not match them.
  /^(?:Enter|Home|End)$/, /^<(?:button|div|span|i|b)\b[^>]*$/,
  /^<\/strong>\s*&nbsp;“$/, /^"?\s*style="--/, /^\);--dc-soft:/, /^-soft\)">$/,
  /^(?:font-(?:size|family):|\d+px$)/,
  /^(?:chip (?:ok|bad)|fc-n t-|seg ph|ci m|g-edge back|g-elabel backlabel)$/,
  /^M[\d.,\sCL-]+z?$/, /^url\(#[A-Za-z][\w-]*\)$/, /^C$/,
  /^>[a-z0-9_]+$/, /^[a-z0-9_]+>[a-z0-9_]+$/, /^__p$/,
  // These are deliberately displayed as LTR code/data fixtures. Natural-
  // language labels and kiosk inputs live in w.code.*; only syntax remains.
  /^<code>[^<]*<\/code>$/, /^<span class="tok-[ks]">/, /^text = text\./,
  /^"<\/span>\).*<span class="tok-k">return/, /^"<\/span>;$/,
  /^<span>text === "/, /^" &nbsp;→&nbsp;$/, /^[SL]$/,
  /^":"L","price":$/, /^","price":$/, /^\{\n\s*"items": \[$/,
  /^\],\n\s*"total":$/, /^,\n\s*"needs_confirmation": true$/,
  /^[a-z_]+\([^)]*\)$/,
];
const isCopy = (s) => {
  const t = s.trim();
  if (NOISE.some((r) => r.test(t))) return false;
  if (/^[#.\[]/.test(t) || /^[a-z][\w-]*\s*[.#\[]/.test(t)) return false;
  return (t.replace(/<[^>]*>/g, " ").match(/[\p{L}][\p{L}'’-]*/gu) || []).length > 0;
};
let litN = 0, wordN = 0;
for (const tok of lex(behaviour)) {
  const s = unescape(tok.value);
  if (!isCopy(s)) continue;
  litN++;
  wordN += (s.replace(/<[^>]*>/g, " ").match(/[\p{L}][\p{L}'’-]*/gu) || []).length;
}
if (litN > REMAINING.literals || wordN > REMAINING.words) {
  fail(`hard-coded copy grew: ${litN} literals / ${wordN} words, ratchet allows ` +
       `${REMAINING.literals} / ${REMAINING.words}. Move it into ` +
       `messages/widgets/en.json rather than raising the ratchet.`);
} else {
  notes.push(`${litN} literals / ${wordN} words still hard-coded ` +
    `(ratchet ${REMAINING.literals} / ${REMAINING.words}` +
    `${litN < REMAINING.literals ? ` — lower it to ${litN} / ${wordN}` : ""})`);
}

/* ------------------------------------------------------------------ */
for (const n of notes) console.log(`widgets: ${n}`);
if (problems.length) {
  console.error(`\nwidgets: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`widgets: ${calls.length} call sites, ${Object.keys(en ?? {}).length} keys, all consistent`);
