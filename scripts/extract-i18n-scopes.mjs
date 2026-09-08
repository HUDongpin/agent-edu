/**
 * Which strings each route actually sends to the browser.
 *
 * `Shell` handed the whole dictionary to `I18nProvider`, and `I18nProvider`
 * is a client component, so every key crossed the server/client boundary on
 * every page. Everything that crosses is serialised twice over: once into the
 * flight payload inlined in the HTML, and again into the `.txt` payload a
 * <Link> prefetches. Measured on the built export, that was 35 kB of a 62 kB
 * /en/about/ document — 427 keys shipped so that the theme toggle and the
 * language menu could read about twelve of them. Arabic paid 51 kB.
 *
 * So the table is now scoped: the layout provides the chrome's keys, and each
 * route adds its own on top (see `I18nScope`). A key the scope misses does not
 * throw — `t` returns the key — so the reader would simply see `nav.theme`
 * printed on the page. That failure is silent, which is exactly the kind this
 * repository gates rather than trusts.
 *
 * Hence this file. It derives each scope from the code rather than asking
 * anyone to maintain a list:
 *
 *   1  walk the import graph from each route's entry point
 *   2  mark everything reachable through a "use client" file
 *   3  in those files, collect every string literal that is a key in
 *      messages/en.json, and every template literal whose static head is a
 *      prefix of one — `t(`c.${id}.title`)` becomes the prefix `c.`
 *
 * Rule 3 is deliberately blunt. It catches `t("lab.s1.h")`, but it also
 * catches `return "lab.err.noKey"` in lib/deepseek.ts, which reaches a reader
 * through `<Fail msgKey={...}>` several files away and which no analysis of
 * `t()` call sites alone would find. Over-collecting costs bytes; under-
 * collecting prints a raw key to a reader.
 *
 *   npm run i18n:extract   rewrite config/i18n-scopes.json
 *   npm run i18n:check     fail if it has drifted from the code
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

/* `--root=` points the checker at a copy of the repository, so
   tests/i18n-scopes.test.ts can watch each rule fail on an injected defect
   without editing the tree it is running in. Node resolves a symlinked
   entry point to its real path, so the default cannot be derived from
   import.meta.url alone and be fixture-aware. */
const rootArg = process.argv.find((a) => a.startsWith("--root="));
const ROOT = rootArg
  ? resolve(rootArg.slice("--root=".length))
  : join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "config/i18n-scopes.json");
const KEYS = Object.keys(JSON.parse(readFileSync(join(ROOT, "messages/en.json"), "utf8")));
const KEY_SET = new Set(KEYS);

/* ------------------------------------------------------------------ *
 * Module resolution. Only the three source trees; node_modules is not
 * ours to scan and never reads a message key.
 * ------------------------------------------------------------------ */
const EXTS = [".tsx", ".ts"];

function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // a package
  for (const ext of EXTS) {
    if (existsSync(base + ext)) return base + ext;
  }
  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const ext of EXTS) {
      const index = join(base, "index" + ext);
      if (existsSync(index)) return index;
    }
  }
  return null; // .json and friends carry no call sites
}

function importsOf(src) {
  const out = [];
  const patterns = [
    /\bimport\s+[^"';]*?\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bexport\s+[^"';]*?\bfrom\s*["']([^"']+)["']/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(src)) !== null) out.push(m[1]);
  }
  return out;
}

const isClientFile = (src) => /^\s*(["'])use client\1/.test(src);

/* ------------------------------------------------------------------ *
 * A small lexer, for the same reason check-widgets.mjs has one: the
 * strings are all that matter, and a parser would be a dependency.
 * ------------------------------------------------------------------ */
function stringsIn(src) {
  const plain = [];   // "..." and '...' with no interpolation
  const heads = [];   // the static head of a `...${...}` template
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") { const e = src.indexOf("\n", i); i = e === -1 ? src.length : e; continue; }
    if (c === "/" && src[i + 1] === "*") { const e = src.indexOf("*/", i + 2); i = e === -1 ? src.length : e + 2; continue; }
    if (c === '"' || c === "'") {
      const q = c; i++;
      let v = "";
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") { v += src[i + 1] ?? ""; i += 2; continue; }
        if (src[i] === "\n") break;
        v += src[i++];
      }
      i++;
      plain.push(v);
      continue;
    }
    if (c === "`") {
      i++;
      let v = "";
      let interpolated = false;
      while (i < src.length) {
        if (src[i] === "\\") { v += src[i + 1] ?? ""; i += 2; continue; }
        if (src[i] === "$" && src[i + 1] === "{") {
          if (!interpolated) { interpolated = true; heads.push(v); }
          /* The expression is lexed too, not skipped. `aria-label={`${t(
             "nav.lang")}: …`}` in LanguageMenu.tsx puts a key inside an
             interpolation inside an attribute, and skipping the expression
             dropped it — which is the one failure mode that matters here,
             because a scope that is short by one key is silent. */
          const start = (i += 2);
          let depth = 1;
          while (i < src.length && depth > 0) {
            const d = src[i];
            if (d === "{") depth++;
            else if (d === "}") depth--;
            else if (d === '"' || d === "'" || d === "`") {
              const q = d; i++;
              while (i < src.length && src[i] !== q) i += src[i] === "\\" ? 2 : 1;
            }
            i++;
          }
          const inner = stringsIn(src.slice(start, i - 1));
          plain.push(...inner.plain);
          heads.push(...inner.heads);
          continue;
        }
        if (src[i] === "`") { i++; break; }
        v += src[i++];
      }
      if (!interpolated) plain.push(v);
      continue;
    }
    i++;
  }
  return { plain, heads };
}

/**
 * The props a server file hands to a component.
 *
 * A server file's own `t("...")` calls are resolved before the HTML is
 * written and never reach the browser, so collecting them would ship strings
 * nobody needs. But a key can be *built* on the server and *resolved* in the
 * browser — the home page passes `fallback={`track.${tr.k}.cta`}` to
 * <TrackCta>, which calls `t(fallback)` — and that key has to be in scope or
 * the reader sees `track.1.cta` where the button's label should be.
 *
 * So server files are read for one thing only: what is written between
 * `<Component` and the `>` that closes that opening tag.
 */
function componentProps(src) {
  const regions = [];
  const re = /<[A-Z][\w.]*/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    let i = m.index + m[0].length;
    let depth = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === "{") { depth++; i++; continue; }
      if (c === "}") { depth--; i++; continue; }
      if (c === '"' || c === "'" || c === "`") {
        const q = c; i++;
        while (i < src.length && src[i] !== q) i += src[i] === "\\" ? 2 : 1;
        i++;
        continue;
      }
      if (c === ">" && depth === 0) break;
      i++;
    }
    regions.push(src.slice(m.index, i));
  }
  return regions.join("\n");
}

/* ------------------------------------------------------------------ */
function collect(entry) {
  const keys = new Set();
  const prefixes = new Set();
  const seen = new Set();
  const files = [];

  /* `clientside` is sticky: once the walk crosses a "use client" file,
     everything below it is shipped to the browser too. */
  const walk = (file, clientside) => {
    const id = file + (clientside ? "|c" : "|s");
    if (seen.has(id)) return;
    seen.add(id);
    const src = readFileSync(file, "utf8");
    const client = clientside || isClientFile(src);
    /* A client file ships whole; a server file contributes only what it
       hands to a component. */
    const text = client ? src : componentProps(src);
    if (client) files.push(relative(ROOT, file));
    const { plain, heads } = stringsIn(text);
    for (const s of plain) if (KEY_SET.has(s)) keys.add(s);
    for (const h of heads) {
      if (!h.includes(".")) continue;
      if (KEYS.some((k) => k.startsWith(h))) prefixes.add(h);
    }
    for (const spec of importsOf(src)) {
      const next = resolveImport(spec, file);
      if (next) walk(next, client);
    }
  };

  walk(entry, false);
  return { keys, prefixes, files: [...new Set(files)].sort() };
}

/** Every en.json key a scope resolves, prefixes expanded. */
export function expand(scope) {
  const out = new Set(scope.keys ?? []);
  for (const p of scope.prefixes ?? []) for (const k of KEYS) if (k.startsWith(p)) out.add(k);
  return out;
}

/* ------------------------------------------------------------------ *
 * Entry points. The chrome is whatever app/[locale]/layout.tsx pulls in;
 * every page under it is a scope of its own, named by its route.
 * ------------------------------------------------------------------ */
const APP = join(ROOT, "app/[locale]");

function routeEntries() {
  const out = [{ scope: "", entry: join(APP, "page.tsx") }];
  for (const name of readdirSync(APP, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const page = join(APP, name.name, "page.tsx");
    if (existsSync(page)) out.push({ scope: name.name, entry: page });
  }
  return out.sort((a, b) => a.scope.localeCompare(b.scope));
}

export function buildScopes() {
  const chrome = collect(join(APP, "layout.tsx"));
  const chromeKeys = expand({ keys: [...chrome.keys], prefixes: [...chrome.prefixes] });

  const scopes = {
    chrome: {
      keys: [...chrome.keys].sort(),
      prefixes: [...chrome.prefixes].sort(),
      from: chrome.files,
    },
  };

  for (const { scope, entry } of routeEntries()) {
    const found = collect(entry);
    /* A route never repeats what the chrome already provides: I18nScope
       falls through to the parent context, so those keys resolve anyway. */
    const keys = [...found.keys].filter((k) => !chromeKeys.has(k)).sort();
    const prefixes = [...found.prefixes].sort();
    scopes[scope || "home"] = { keys, prefixes, from: found.files };
  }
  return scopes;
}

/* ------------------------------------------------------------------ *
 * The rest of the gate.
 *
 * Drift between the manifest and the code is one failure. The others are a
 * route that has a scope and never applies it, a page that asks for a scope
 * that does not exist, and — the one that catches everything the static walk
 * missed — a key printed to a reader as itself in the built export.
 * ------------------------------------------------------------------ */
function usesContext(files) {
  return files.some((f) => readFileSync(join(ROOT, f), "utf8").includes("useI18n"));
}

function checkPagesApplyScopes(scopes, problems) {
  const known = new Set(Object.keys(scopes));
  for (const { scope, entry } of routeEntries()) {
    const name = scope || "home";
    const src = readFileSync(entry, "utf8");
    /* The element, not the import: a page that keeps the import and drops
       the wrapper is exactly the regression this is here to catch. */
    const applied = /<I18nScope[\s>]/.test(src);
    const needed = usesContext(scopes[name].from);
    if (needed && !applied) {
      problems.push(
        `${relative(ROOT, entry)} renders a client component that calls useI18n, ` +
        `but does not wrap it in <I18nScope>. Its ${expand(scopes[name]).size} ` +
        `key(s) would resolve to themselves.`,
      );
    }
    if (applied && !needed) {
      problems.push(
        `${relative(ROOT, entry)} wraps an <I18nScope> that nothing reads. ` +
        `Remove it rather than shipping a table no component asks for.`,
      );
    }
    for (const m of src.matchAll(/scopeMessages\([^,]+,\s*["']([^"']+)["']\)/g)) {
      if (!known.has(m[1])) problems.push(`${relative(ROOT, entry)} asks for unknown scope "${m[1]}"`);
    }
  }
}

/**
 * The empirical half.
 *
 * Everything above reasons about source. This reads what was actually built
 * and fails if a message key reached a reader as its own name — the exact
 * shape of the failure a scope that is short by one key produces. It only
 * sees server-rendered text; the widgets' own strings are covered by the
 * Playwright journey, and by `npm run widgets:check` for the handbook.
 */
function checkBuiltOutput(problems, notes) {
  const dir = join(ROOT, "out");
  if (!existsSync(dir)) {
    notes.push("no out/ to scan — run after `npm run build` for the rendered-key check");
    return;
  }
  const html = [];
  const walkDir = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walkDir(f);
      else if (e.name.endsWith(".html")) html.push(f);
    }
  };
  walkDir(dir);

  let found = 0;
  for (const file of html) {
    const visible = readFileSync(file, "utf8")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
    const seen = new Set();
    for (const m of visible.matchAll(/>([^<>{}]{2,80})</g)) seen.add(m[1].trim());
    for (const m of visible.matchAll(/(?:aria-label|title|alt|placeholder)="([^"]{2,80})"/g)) seen.add(m[1].trim());
    for (const s of seen) {
      if (!KEY_SET.has(s)) continue;
      problems.push(`${relative(ROOT, file)} renders the raw key \`${s}\``);
      found++;
    }
  }
  if (!found) notes.push(`${html.length} built pages scanned, no key rendered as itself`);
}

/* ------------------------------------------------------------------ */
function main() {
  const check = process.argv.includes("--check");
  const scopes = buildScopes();
  const text = JSON.stringify(scopes, null, 2) + "\n";
  const problems = [];
  const notes = [];

  if (check) {
    const have = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (have !== text) {
      problems.push(
        "config/i18n-scopes.json has drifted from the code — run " +
        "`npm run i18n:extract` and commit the result",
      );
    }
    checkPagesApplyScopes(scopes, problems);
    checkBuiltOutput(problems, notes);
  } else {
    writeFileSync(OUT, text);
  }

  const total = KEYS.length;
  for (const n of notes) console.log(`i18n-scopes: ${n}`);
  if (problems.length) {
    console.error(`\ni18n-scopes: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    console.error(
      "\n  A key outside its route's scope does not throw: `t` returns the key, " +
      "\n  so the reader sees `nav.theme` where a label should be.\n",
    );
    process.exit(1);
  }
  const lines = Object.entries(scopes).map(([name, s]) => {
    const n = expand(s).size;
    return `  ${name.padEnd(10)} ${String(n).padStart(3)} keys` +
      (s.prefixes.length ? `  (prefixes: ${s.prefixes.join(" ")})` : "");
  });
  console.log(`i18n-scopes: ${total} keys in messages/en.json, scoped to:`);
  for (const l of lines) console.log(l);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
