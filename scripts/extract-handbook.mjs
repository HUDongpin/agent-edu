#!/usr/bin/env node
/**
 * Pull the handbook's article prose out of the verified markup and into a
 * dictionary a translator can edit.
 *
 *   node scripts/extract-handbook.mjs          # write messages/handbook/en.json
 *   node scripts/extract-handbook.mjs --check  # fail if it is out of date
 *
 * `lib/handbook/markup.ts` is not touched, read only. The keys come from
 * `lib/handbook/segments.mjs`, the same walk the build uses to put the
 * translations back, so a key in this file always lands on the text node it
 * was taken from.
 *
 * Keys stay in document order rather than sorted: read the file top to bottom
 * and you read the handbook in the order a reader meets it, which is the only
 * context a flat dictionary can offer.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import { walkHandbook } from "../lib/handbook/segments.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKUP_TS = path.join(ROOT, "lib/handbook/markup.ts");
const BEHAVIOUR_TS = path.join(ROOT, "lib/handbook/behaviour.ts");
const OUT = path.join(ROOT, "messages/handbook/en.json");

/**
 * Read MARKUP without parsing TypeScript.
 *
 * markup.ts is plain JavaScript plus a default export, so the safest way to get
 * the exact string the site ships — including structural repair transforms —
 * is to run the exported expression rather than to write a second parser.
 */
async function loadMarkup() {
  const src = await readFile(MARKUP_TS, "utf8");
  const exported = /^\s*export default ([A-Z][A-Z0-9_]*);\s*$/m.exec(src);
  if (!exported) throw new Error(`${path.relative(ROOT, MARKUP_TS)} has no simple default export`);
  const js = src.replace(exported[0], "");
  let html;
  try {
    html = vm.runInNewContext(`${js}\n${exported[1]}`, Object.create(null), { filename: MARKUP_TS });
  } catch (err) {
    throw new Error(
      `could not evaluate ${path.relative(ROOT, MARKUP_TS)} as JavaScript (${err.message}).\n` +
      `It is meant to stay plain JavaScript — if it now carries TypeScript syntax, ` +
      `this loader needs updating rather than the markup.`,
    );
  }
  if (typeof html !== "string" || !html.length) {
    throw new Error(`${path.relative(ROOT, MARKUP_TS)} did not yield a default string`);
  }
  return html;
}

/**
 * Ids whose contents `behaviour.ts` writes at run time.
 *
 * Advisory only, and printed rather than written to the file: a widget that
 * rewrites its own readout will put English back the moment a reader touches
 * it, so those keys are worth less than the article prose around them. The
 * fix is not here — behaviour.ts is verified code and stays as it is.
 */
async function volatileIds() {
  const src = await readFile(BEHAVIOUR_TS, "utf8");
  const ids = new Set();
  const patterns = [
    /\$\(\s*['"]#([\w-]+)['"][^)]*\)\s*\.\s*(?:textContent|innerHTML)\s*=/g,
    /getElementById\(\s*['"]([\w-]+)['"]\s*\)\s*\.\s*(?:textContent|innerHTML)\s*=/g,
  ];
  for (const re of patterns) for (const m of src.matchAll(re)) ids.add(m[1]);
  return ids;
}

const check = process.argv.includes("--check");
const html = await loadMarkup();
const segments = walkHandbook(html);
const body = segments.filter((s) => s.kind === "body");

/** @type {Record<string, string>} */
const table = {};
for (const seg of body) table[seg.key] = seg.text;

const json = `${JSON.stringify(table, null, 2)}\n`;
const existing = await readFile(OUT, "utf8").catch(() => null);

if (check) {
  if (existing === json) {
    console.log(`✓ ${path.relative(ROOT, OUT)} is up to date — ${body.length} strings`);
    process.exit(0);
  }
  console.error(
    `✗ ${path.relative(ROOT, OUT)} does not match lib/handbook/markup.ts.\n` +
    `  Run: npm run handbook:extract\n` +
    `  Then translate any new keys in the other eight files under messages/handbook/.`,
  );
  process.exit(1);
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, json);

/* What came out, and what a translator should know about it. */
const perContainer = new Map();
for (const seg of body) {
  const id = seg.key.split(".")[2];
  perContainer.set(id, (perContainer.get(id) ?? 0) + 1);
}
const words = body.reduce((n, s) => n + s.text.trim().split(/\s+/).length, 0);
const fragments = body.filter((s) => s.text.trim().split(/\s+/).length < 3).length;
const volatile = await volatileIds();
const inWidgets = body.filter((s) => volatile.has(s.key.split(".")[2]));

console.log(`wrote ${path.relative(ROOT, OUT)}`);
console.log(`  ${body.length} strings, ~${words.toLocaleString("en-GB")} words, ${perContainer.size} containers`);
console.log(`  ${segments.length - body.length} data-i18n elements stay in messages/*.json`);
if (existing) console.log(`  ${existing === json ? "unchanged" : "CHANGED — the other eight files need re-checking"}`);
if (fragments) {
  console.log(
    `  ${fragments} strings are under three words: text broken by <em>, <strong> or <a> comes out ` +
    `in pieces, because splicing whole sentences back would mean moving the tags around them.`,
  );
}
if (inWidgets.length) {
  console.log(
    `  ${inWidgets.length} strings sit inside elements behaviour.ts rewrites at run time ` +
    `(${[...new Set(inWidgets.map((s) => s.key.split(".")[2]))].slice(0, 6).join(", ")}…) — ` +
    `translating them buys the first paint only.`,
  );
}
