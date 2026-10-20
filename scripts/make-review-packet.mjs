#!/usr/bin/env node
/**
 * Build a side-by-side review packet for a native-language reviewer.
 *
 * `docs/release/native-review-form.md` asks a reviewer to judge terminology
 * consistency, unexplained English fallbacks and placeholder grammar. Nothing
 * in this repository let them see the English beside their own language, so
 * doing that honestly meant reading three JSON files or clicking every page.
 * This writes one Markdown file per locale that a reviewer can work through
 * without a development environment, which is the whole point of keeping the
 * strings flat and translator-editable in the first place.
 *
 * The packet is generated, never committed: it is bulk source text, and
 * `docs/release/evidence/` is for sanitized conclusions. Regenerate it against
 * the frozen candidate before a review starts.
 *
 *   node scripts/make-review-packet.mjs            # all eight locales
 *   node scripts/make-review-packet.mjs de fr      # just these
 *   node scripts/make-review-packet.mjs --since=<ref>
 *
 * `--since` marks every string added or reworded since a git ref and lists them
 * first. A reviewer facing 568 handbook strings needs to know which forty are
 * new, and a full re-read is not the same review as checking a change — the
 * packet should not make those look alike.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["zh-Hans", "zh-Hant", "ar", "de", "es", "fr", "ja", "ko"];
const CATALOGS = [
  { id: "site", label: "Interface", path: (l) => `messages/${l}.json` },
  { id: "handbook", label: "Handbook prose", path: (l) => `messages/handbook/${l}.json` },
  { id: "widgets", label: "Widget run-time text", path: (l) => `messages/widgets/${l}.json` },
];
const OUT_DIR = "review-packets";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const readOrNull = (p) => {
  try {
    return read(p);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

/** Pipe and newline are the two characters that break a Markdown table cell. */
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ⏎ ");

/** CJK carries no spaces, so a word count there is a character count. */
function words(s) {
  const cjk = [...s].filter((ch) => /[぀-ヿ一-鿿가-힯]/.test(ch)).length;
  return cjk > s.length * 0.3 ? cjk : s.split(/\s+/).filter(Boolean).length;
}

const PLACEHOLDER = /\{[a-zA-Z0-9_]+\}/g;

/**
 * Terminology drift: a Latin word left in a locale that writes in another script.
 *
 * Caught a real one — a new Japanese diagram description said "step の上限" while
 * the section beside it, and the rest of the file, says ステップ. That is the
 * failure mode of writing a string against the English rather than against the
 * catalogue it joins, and it is invisible to a placeholder check because
 * nothing is malformed.
 *
 * Placeholders are stripped first, so `{cost}` is not mistaken for prose. The
 * allowlist is the set this catalogue legitimately keeps in Latin script;
 * anything else is worth a reviewer's eye rather than an automatic verdict,
 * which is why it is a packet flag and not a gate.
 */
const NON_LATIN_LOCALES = new Set(["zh-Hans", "zh-Hant", "ja", "ko", "ar"]);
const KEPT_IN_LATIN = new Set([
  "json", "api", "deepseek", "anthropic", "claude", "npm", "npx", "tsx", "node",
  "token", "tokens", "lab", "menu", "ci", "rtl", "vercel", "github", "aicourse",
  "top", "html", "css", "url", "id", "ok", "pdf", "svg", "ui", "ux",
]);

function latinTerms(value) {
  const prose = value.replace(PLACEHOLDER, " ");
  const words = prose.match(/[A-Za-z][A-Za-z'-]{2,}/g) ?? [];
  return [...new Set(words.filter((w) => !KEPT_IN_LATIN.has(w.toLowerCase())))];
}

/**
 * A plural form a language genuinely does not have is not a missing string.
 * Japanese, Korean and both Chinese scripts carry only `.other`; Arabic carries
 * `.zero`, `.two`, `.few` and `.many` that English never needs. Reporting those
 * as gaps sends a reviewer hunting something that is correct.
 */
const PLURAL_TAIL = /\.(zero|one|two|few|many)$/;

function isUnusedPluralForm(key, target) {
  if (!PLURAL_TAIL.test(key)) return false;
  return `${key.replace(PLURAL_TAIL, "")}.other` in target;
}

/**
 * One string from three parts, with no character that can appear in a key.
 *
 * These were joined with a literal NUL, which works and made the whole file
 * binary to git — so every diff of this script read "Binary file not shown",
 * including the ones adding the flags a reviewer is meant to read about.
 * JSON.stringify escapes any separator a key could contain, so the join stays
 * unambiguous and the file stays text.
 */
const allowKey = (catalog, key, locale) => JSON.stringify([catalog, key, locale]);

function allowlistIndex() {
  const raw = read("config/release-readiness.json");
  const entries = raw?.localization?.sameAsEnglishAllowlist ?? [];
  const index = new Map();
  for (const entry of entries) {
    for (const locale of entry.locales ?? []) {
      index.set(allowKey(entry.catalog, entry.key, locale), entry.reason ?? "");
    }
  }
  return index;
}

/**
 * Group so a reviewer meets one screen at a time. The three catalogues are
 * keyed to different depths — `cat.review` is a whole area, `hb.body.p-loop.14`
 * is one text node in one section — so the useful cut differs per catalogue.
 */
const GROUP_DEPTH = { site: 1, handbook: 3, widgets: 2 };

function groupByPrefix(keys, catalogId) {
  const depth = GROUP_DEPTH[catalogId] ?? 1;
  const groups = new Map();
  for (const key of keys) {
    const prefix = key.split(".").slice(0, depth).join(".");
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(key);
  }
  return groups;
}

/**
 * English strings that differ from their state at `ref`, per catalogue.
 *
 * Compared on the English side on purpose: a translation that changed because
 * its source changed is what wants re-reading, and one that changed on its own
 * is a correction the reviewer already asked for.
 */
function changedSince(ref) {
  if (!ref) return null;
  // Resolve the ref once up front. Without this a typo fell into the per-file
  // catch below, so every string in every catalogue came out "new" and the
  // packet told the reviewer all of it was the review.
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    console.error(`review packet: --since=${ref} is not a commit in this repository`);
    process.exit(1);
  }
  const changed = new Map();
  for (const catalog of CATALOGS) {
    const path = catalog.path("en");
    let before = {};
    try {
      before = JSON.parse(execFileSync("git", ["show", `${ref}:${path}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }));
    } catch {
      // The file did not exist at that ref: everything in it is new.
    }
    const now = read(path);
    const keys = Object.keys(now).filter((k) => before[k] !== now[k]);
    changed.set(catalog.id, new Set(keys));
  }
  return changed;
}

function packetFor(locale, english, allow, changed) {
  const lines = [];
  const stats = [];
  const flagged = [];
  const newRows = [];

  for (const catalog of CATALOGS) {
    const source = english[catalog.id];
    const target = readOrNull(catalog.path(locale));
    if (target === null) {
      stats.push({ catalog: catalog.label, strings: 0, note: "no file — this locale falls back to English" });
      continue;
    }
    const missing = Object.keys(source)
      .filter((k) => !(k in target) && !isUnusedPluralForm(k, target));
    stats.push({
      catalog: catalog.label,
      strings: Object.keys(source).length,
      note: missing.length ? `${missing.length} missing` : "complete",
    });

    lines.push(`\n## ${catalog.label}\n`);
    for (const [prefix, keys] of groupByPrefix(Object.keys(source), catalog.id)) {
      lines.push(`\n### \`${prefix}\`\n`);
      lines.push("| Key | English | " + locale + " | |");
      lines.push("|---|---|---|---|");
      for (const key of keys) {
        const en = source[key];
        const tr = target[key];
        let flag = "";
        if (tr === undefined && isUnusedPluralForm(key, target)) {
          flag = "plural form this language does not use";
        } else if (tr === undefined) {
          flag = "**MISSING**";
          flagged.push(`${catalog.id} · \`${key}\` (missing)`);
        } else if (tr === en) {
          const reason = allow.get(allowKey(catalog.id, key, locale));
          flag = reason === undefined ? "**SAME — unexplained**" : "same (allowed)";
          if (reason === undefined) flagged.push(`${catalog.id} · \`${key}\``);
        } else {
          const a = (en.match(PLACEHOLDER) ?? []).sort().join(",");
          const b = (tr.match(PLACEHOLDER) ?? []).sort().join(",");
          if (a !== b) {
            flag = "**PLACEHOLDER MISMATCH**";
            flagged.push(`${catalog.id} · \`${key}\` (placeholders)`);
          }
        }
        if (tr !== undefined && NON_LATIN_LOCALES.has(locale)) {
          const stray = latinTerms(tr).filter((w) => !latinTerms(en).includes(w));
          if (stray.length) {
            flag = `${flag} **LATIN TERM: ${stray.join(", ")}**`.trim();
            flagged.push(`${catalog.id} · \`${key}\` (latin: ${stray.join(", ")})`);
          }
        }
        const isNew = changed?.get(catalog.id)?.has(key);
        if (isNew) newRows.push(`${catalog.id} · \`${key}\``);
        const mark = isNew ? "**NEW** " : "";
        lines.push(`| \`${key}\` | ${cell(en)} | ${tr === undefined ? "" : cell(tr)} | ${mark}${flag} |`);
      }
    }
  }

  const totalWords = CATALOGS.reduce(
    (sum, c) => sum + Object.values(english[c.id]).reduce((s, v) => s + words(v), 0), 0);

  const head = [
    `# Native review packet — \`${locale}\``,
    "",
    "Generated, not committed. Regenerate against the frozen release candidate before",
    "reviewing, and record the conclusion in `docs/release/native-review-form.md` — this",
    "file is a working aid and is **not** itself evidence.",
    "",
    "| Catalogue | Strings | State |",
    "|---|---:|---|",
    ...stats.map((s) => `| ${s.catalog} | ${s.strings} | ${s.note} |`),
    "",
    `**Scope: ${totalWords.toLocaleString("en-GB")} English source words.** Budget the review from that,`,
    "not from the string count — the three catalogues differ widely in words per string.",
    "",
    newRows.length
      ? `**${newRows.length} strings are new or reworded since the reference, and are the review.**\n\n`
        + "Everything else was reviewed against an earlier candidate. Start with the\n"
        + "`hb.attr.*` block: those are the descriptions read aloud in place of a diagram,\n"
        + "so a plausible-but-wrong one is not a cosmetic defect.\n\n"
        + newRows.slice(0, 80).map((f) => `- ${f}`).join("\n")
        + (newRows.length > 80 ? `\n- …and ${newRows.length - 80} more` : "")
        + "\n"
      : "",
    flagged.length
      ? `**${flagged.length} rows want an explanation.** They are marked in the tables below:\n\n`
        + flagged.slice(0, 40).map((f) => `- ${f}`).join("\n")
        + (flagged.length > 40 ? `\n- …and ${flagged.length - 40} more` : "")
      : "No unexplained identical strings and no placeholder mismatches.",
    "",
    "Anything identical to English needs either a correction or a reason. A reason belongs",
    "in `config/release-readiness.json` under `localization.sameAsEnglishAllowlist`, where a",
    "test checks it stays true.",
  ].join("\n");

  return head + lines.join("\n") + "\n";
}

function main() {
  const since = process.argv.slice(2).find((a) => a.startsWith("--since="))?.slice(8) ?? null;
  const requested = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = requested.length ? requested : LOCALES;
  const unknown = targets.filter((l) => !LOCALES.includes(l));
  if (unknown.length) {
    console.error(`review packet: unknown locale(s) ${unknown.join(", ")}`);
    console.error(`review packet: known locales are ${LOCALES.join(", ")}`);
    process.exit(1);
  }

  const english = Object.fromEntries(CATALOGS.map((c) => [c.id, read(c.path("en"))]));
  const allow = allowlistIndex();
  const changed = changedSince(since);
  if (since) {
    const n = [...(changed?.values() ?? [])].reduce((sum, set) => sum + set.size, 0);
    console.log(`review packet: ${n} English string(s) new or reworded since ${since}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  for (const locale of targets) {
    const file = join(OUT_DIR, `${locale}.md`);
    writeFileSync(file, packetFor(locale, english, allow, changed), "utf8");
    console.log(`review packet: wrote ${file}`);
  }
  console.log(`review packet: ${targets.length} locale(s); this directory is gitignored on purpose`);
}

main();
