/**
 * What nothing was reading.
 *
 * `course/**\/*.md` is teaching material that points at real identifiers in
 * real files — "open `cafe/llm.ts` and read `schemaFallback`", "run `npx tsx
 * course/stage2-prompt/run.ts`". Every other prose surface here has a gate:
 * `handbook:check` proves the article text and the markup agree,
 * `widgets:check` proves every id a widget queries still exists. The course
 * READMEs had none, and it showed — three identifiers survived the port from
 * the Python original and sat in stage 2 telling learners to read two
 * functions that have never existed in `cafe/llm.ts`. Two more turned up the
 * first time this ran: `tool_runner` for the SDK's `toolRunner`, and
 * `handleOrder` for stage 1's `takeOrder`.
 *
 * A rename is silent here in a way it is nowhere else in this repo: the
 * compiler never opens a README, and prose that has gone wrong still reads
 * perfectly well. So this asserts, on every commit, the four things a
 * reviewer would otherwise have to take on trust:
 *
 *   1  every path the prose names resolves — inline spans, link targets, the
 *      commands in ```bash fences, and the imports in ```ts fences
 *   2  every identifier the prose names exists somewhere the course can reach:
 *      its own source, or the vendor SDK it drives
 *   3  an identifier named in the same paragraph as one of the course's own
 *      files exists *in that file*, which is the claim the sentence is
 *      actually making
 *   4  no Python leaks through — `_leading_underscore` names and `name=value`
 *      keyword arguments are both wrong in a TypeScript course, and both are
 *      exactly what a paragraph left over from the Python original looks like
 *
 * What it cannot do, said plainly so nobody over-trusts it: rule 2 is
 * word-presence, not semantics. It proves a name is not *invented*. It cannot
 * prove the name still means what the sentence claims — that stays a reading
 * job. Rule 3 is the part that catches renames, and it only reaches prose that
 * names the file it is talking about.
 *
 * The walk starts at `course/` and stops there, which keeps
 * `docs/course-briefs/` out by construction rather than by exemption. Leave it
 * that way: those briefs specify courses that do not exist yet, so their
 * identifiers are *supposed* to be unresolvable, and a checker that drowns in
 * false positives is one somebody switches off.
 *
 * Run by `npm run prose:check`, alongside `handbook:check` and `widgets:check`.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* `--course=<dir>` points the walk at a copy of the tree. Only the tests use
   it, and they use it to prove this file still fails on the prose it was
   written to catch — a gate nothing can demonstrate breaking is a gate nobody
   can trust to be still switched on. */
const arg = process.argv.slice(2).find((a) => a.startsWith("--course="));
const COURSE = arg ? resolve(arg.slice("--course=".length)) : join(ROOT, "course");
const SDK_TYPES = join(ROOT, "node_modules/@anthropic-ai/sdk");

const problems = [];
const notes = [];
const fail = (where, m) => problems.push(`${where}  ${m}`);

/* ------------------------------------------------------------------ *
 * The corpus an identifier may resolve against.
 *
 * Two halves, and the second is not a convenience. Course prose legitimately
 * names wire fields and SDK members — `max_tokens`, `output_config.format`,
 * `client.beta.messages.toolRunner` — which live in nobody's source but the
 * vendor's. Reading the shipped types means those resolve without an
 * allowlist. It is also what caught that last one: the README had spelled it
 * `tool_runner` since the port, and no other corpus could have known better.
 * ------------------------------------------------------------------ */
function walk(dir, keep, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, keep, out);
    else if (keep(entry)) out.push(p);
  }
  return out;
}

const sourceFiles = walk(COURSE, (f) => f.endsWith(".ts"));
const sources = new Map(sourceFiles.map((p) => [p, readFileSync(p, "utf8")]));

const words = (text) => new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? []);

const courseWords = new Set();
const fileWords = new Map();
for (const [p, src] of sources) {
  const w = words(src);
  fileWords.set(p, w);
  for (const x of w) courseWords.add(x);
}

const sdkWords = new Set();
if (existsSync(SDK_TYPES)) {
  for (const p of walk(SDK_TYPES, (f) => f.endsWith(".d.ts"))) {
    for (const x of words(readFileSync(p, "utf8"))) sdkWords.add(x);
  }
} else {
  // Half a corpus is worse than none: every SDK member the course names would
  // fail at once, and a hundred wrong answers hide the one real cause. Say the
  // cause and stop.
  console.error("\nprose: @anthropic-ai/sdk is not installed, so the vendor " +
    "half of the corpus is missing.\n       Run `npm ci` before this check.\n");
  process.exit(1);
}

/* The language and its runtime. Prose may name `assert`, `JSON` or `process`
   without the course having to declare them, and this surface is fixed by
   Node rather than by anything in this repo, so listing it does not rot. */
const GLOBALS = new Set([
  "assert", "console", "process", "fs", "path", "url", "crypto", "os", "http",
  "https", "util", "events", "stream", "buffer", "child_process", "test",
  "JSON", "Math", "Object", "Array", "String", "Number", "Boolean", "Date",
  "Map", "Set", "Promise", "Error", "RegExp", "Symbol", "BigInt", "globalThis",
  "fetch", "structuredClone", "setTimeout", "clearTimeout", "AbortController",
]);

const known = (name) =>
  courseWords.has(name) || sdkWords.has(name) || GLOBALS.has(name);

/* Bare filenames. Prose says "each stage has a `run.ts`" and means all nine of
   them; requiring a directory there would be pedantry, not accuracy. A bare
   name resolves when the tree holds a file called that. */
const basenames = new Set();
for (const p of walk(COURSE, () => true)) basenames.add(p.split("/").pop());
for (const entry of readdirSync(ROOT)) {
  if (!entry.startsWith(".") && statSync(join(ROOT, entry)).isFile()) basenames.add(entry);
}

/* Files the course writes rather than ships. `course/progress.json` does not
   exist in a clean checkout and is still a correct reference — the name is
   there in `report.ts`. A typo would be in neither place. */
const generated = new Set();
for (const src of sources.values()) {
  for (const m of src.matchAll(/["'`]([\w.-]+\.(?:json|md|txt|csv|log))["'`]/g)) generated.add(m[1]);
}

/* ------------------------------------------------------------------ *
 * Markdown, split into the four places a code reference can hide.
 * ------------------------------------------------------------------ */
function parse(src) {
  const lines = src.split("\n");
  const fences = [];
  const masked = lines.slice();
  for (let i = 0; i < lines.length; i++) {
    const open = /^\s*```(\S*)\s*$/.exec(lines[i]);
    if (!open) continue;
    const body = [];
    const from = i;
    masked[i] = "";
    for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) {
      body.push({ line: i + 1, text: lines[i] });
      masked[i] = "";
    }
    if (i < lines.length) masked[i] = "";
    fences.push({ lang: open[1], line: from + 1, body });
  }
  return { fences, masked };
}

/** Inline code spans, with the line they start on. Fences already masked. */
function spans(masked) {
  const text = masked.join("\n");
  const out = [];
  const re = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({
      value: m[2].trim(),
      line: text.slice(0, m.index).split("\n").length,
      offset: m.index,
    });
  }
  return out;
}

/** Blank-line separated blocks, as [start, end) offsets into the masked text. */
function paragraphs(masked) {
  const text = masked.join("\n");
  const out = [];
  let start = 0, at = 0;
  for (const line of text.split("\n")) {
    if (!line.trim()) {
      if (at > start) out.push([start, at]);
      start = at + line.length + 1;
    }
    at += line.length + 1;
  }
  if (at > start) out.push([start, at]);
  return out;
}

/* ------------------------------------------------------------------ *
 * Shapes. A span is checked only if it parses as a code reference; a span
 * that does not is prose in backticks, a shell assignment, a quoted
 * sentence or a JSON fragment, and is nobody's claim about the tree.
 * ------------------------------------------------------------------ */
const IDENT = /^[A-Za-z_$][\w$]*$/;
const DOTTED = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/;
const CALL = /^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\(([\s\S]*)\)$/;
const PKG = /^@[a-z0-9][\w.-]*\/[a-z0-9][\w.-]*$/i;
const FILE_EXT = /\.(?:tsx?|m?js|json|md|css|txt|ya?ml)$/i;

/** Names a span asserts exist, or null when the span is not a code reference. */
function reference(value) {
  if (IDENT.test(value)) return { kind: "ident", names: [value] };
  if (DOTTED.test(value)) return { kind: "member", names: value.split(".") };
  const call = CALL.exec(value);
  if (call) {
    const names = call[1].split(".");
    // Nested call heads inside the argument list are claims too.
    for (const m of call[2].matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) names.push(m[1]);
    return { kind: "call", names, args: call[2] };
  }
  return null;
}

/* Name it, rather than guessing at it. Flattening a name to letters finds the
   real one in the corpus when there is one — `_extract_json` and `extractJSON`
   flatten alike — so the message can say what to write instead of approximating
   a camel-case rendering that is itself wrong. */
const flat = (n) => n.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
const byFlat = new Map();
for (const n of courseWords) if (!byFlat.has(flat(n))) byFlat.set(flat(n), n);
for (const n of sdkWords) if (!byFlat.has(flat(n))) byFlat.set(flat(n), n);

function suggest(name) {
  const hit = byFlat.get(flat(name));
  if (hit) return `the name in the tree is \`${hit}\`.`;
  const camel = name.replace(/^_+/, "").replace(/_(\w)/g, (_, c) => c.toUpperCase());
  return `nothing in the tree matches it — \`${camel}\` is the shape it should have.`;
}

const isPathish = (v) =>
  !/\s/.test(v) && !PKG.test(v) && !/^[-.]/.test(v.replace(/^\.\.?\//, "")) &&
  (v.includes("/") || FILE_EXT.test(v));

/** Resolve a path the way a reader would: beside the file, then course/, then root. */
function resolvePath(target, mdDir) {
  const clean = target.replace(/[#?].*$/, "");
  if (!clean) return null;
  for (const base of [mdDir, COURSE, ROOT]) {
    const p = resolve(base, clean);
    if (existsSync(p)) return p;
  }
  return null;
}

/** Resolution as a *claim* rather than a path: does the tree hold this at all? */
function resolveClaim(target, mdDir) {
  const hit = resolvePath(target, mdDir);
  if (hit) return { path: hit };
  const clean = target.replace(/[#?].*$/, "");
  const base = clean.split("/").pop();
  if (!clean.includes("/") && basenames.has(base)) return { path: null, how: "basename" };
  if (generated.has(base)) return { path: null, how: "generated" };
  return null;
}

/* ------------------------------------------------------------------ *
 * The checks
 * ------------------------------------------------------------------ */
const docs = walk(COURSE, (f) => f.endsWith(".md")).sort();
let pathN = 0, identN = 0, scopedN = 0, looseN = 0;

for (const doc of docs) {
  const rel = relative(ROOT, doc);
  const mdDir = dirname(doc);
  const codeBases = [mdDir, ...readdirSync(COURSE)
    .map((e) => join(COURSE, e))
    .filter((p) => statSync(p).isDirectory())];
  const src = readFileSync(doc, "utf8");
  const { fences, masked } = parse(src);
  const at = (line) => `${rel}:${line}`;

  const inline = spans(masked);
  const text = masked.join("\n");

  /* --- 1  paths -------------------------------------------------- */
  const paths = [];

  for (const s of inline) {
    if (isPathish(s.value)) paths.push({ target: s.value, line: s.line, how: "code span" });
    else if (PKG.test(s.value)) {
      pathN++;
      if (!existsSync(join(ROOT, "node_modules", s.value)))
        fail(at(s.line), `\`${s.value}\` is not an installed package.`);
    }
  }

  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    paths.push({ target, line: text.slice(0, m.index).split("\n").length, how: "link" });
  }

  for (const fence of fences) {
    if (/^(?:bash|sh|shell|console)?$/i.test(fence.lang)) {
      for (const { line, text: raw } of fence.body) {
        // `CAFE_PROVIDER=anthropic npx tsx …` is still a command to run.
        const cmd = raw.replace(/#.*$/, "").replace(/^\s*(?:[A-Z_][A-Z0-9_]*=\S*\s+)+/, "");
        if (!/^\s*(?:npx|node|npm|tsx|cat|open|code)\b/.test(cmd)) continue;
        for (const tok of cmd.split(/\s+/)) {
          if (isPathish(tok) && FILE_EXT.test(tok)) paths.push({ target: tok, line, how: "command" });
        }
      }
    }
    if (/^(?:ts|tsx|typescript|js|javascript)$/i.test(fence.lang)) {
      for (const { line, text: raw } of fence.body) {
        for (const m of raw.matchAll(/\bfrom\s+["']([^"']+)["']/g)) {
          const spec = m[1];
          if (!spec.startsWith(".")) continue;
          // A TypeScript import drops the extension; the file on disk has one.
          // A snippet is written to be pasted somewhere else — SOLUTIONS.md
          // holds stage 3's import, whose `..` is stage 3's directory, not
          // SOLUTIONS.md's. So a relative import need only resolve from some
          // directory of the course; which one is the prose's business.
          const found = [spec, `${spec}.ts`, `${spec}.tsx`, `${spec}/index.ts`]
            .some((c) => codeBases.some((b) => resolvePath(c, b)));
          pathN++;
          if (!found) fail(at(line), `import from "${spec}" resolves to nothing.`);
        }
      }
    }
  }

  for (const { target, line, how } of paths) {
    pathN++;
    const claim = resolveClaim(target, mdDir);
    if (!claim) fail(at(line), `${how} \`${target}\` resolves to nothing.`);
    else if (claim.how) looseN++;
  }

  /* --- 2 + 4  identifiers, and the shapes that betray the port ---- */
  for (const s of inline) {
    if (isPathish(s.value) || PKG.test(s.value)) continue;
    const ref = reference(s.value);
    if (!ref) continue;

    for (const name of ref.names) {
      if (/^_[a-z]/.test(name)) {
        fail(at(s.line), `\`${name}\` uses Python's leading-underscore private ` +
          `naming. This course is TypeScript; ${suggest(name)}`);
      }
    }
    // `=(?![=>])` so `map(x => x.price)` and `a === b` stay clear of this.
    if (ref.kind === "call" && /(^|[(,\s])[A-Za-z_$][\w$]*\s*=(?![=>])/.test(ref.args)) {
      fail(at(s.line), `\`${s.value}\` passes a Python keyword argument. ` +
        `TypeScript has no \`name=value\` call syntax — an options object ` +
        `(\`{ name }\`) is what the code actually takes.`);
    }

    for (const name of ref.names) {
      identN++;
      if (!known(name)) {
        const near = byFlat.get(flat(name));
        fail(at(s.line), `\`${s.value}\` names \`${name}\`, which exists ` +
          `nowhere in course/ or in @anthropic-ai/sdk` +
          (near ? `. \`${near}\` is spelled that way in the tree.` : "."));
      }
    }
  }

  /* --- 3  an identifier named beside a file must be in that file --- */
  for (const [from, to] of paragraphs(masked)) {
    const here = inline.filter((s) => s.offset >= from && s.offset < to);
    const named = here
      .filter((s) => isPathish(s.value))
      .map((s) => resolvePath(s.value, mdDir))
      .filter((p) => p && sources.has(p));
    if (!named.length) continue;

    for (const s of here) {
      if (isPathish(s.value) || PKG.test(s.value)) continue;
      const ref = reference(s.value);
      if (!ref || ref.kind === "member") continue;   // member paths are the SDK's, not ours
      for (const name of ref.names) {
        if (!courseWords.has(name)) continue;        // rule 2 owns the unknown case
        scopedN++;
        if (named.some((p) => fileWords.get(p).has(name))) continue;
        fail(at(s.line), `\`${name}\` is named in a paragraph about ` +
          `${named.map((p) => relative(ROOT, p)).join(" / ")}, but it is not in ` +
          `${named.length > 1 ? "any of them" : "that file"}.`);
      }
    }
  }
}

/* ------------------------------------------------------------------ */
notes.push(`${docs.length} course documents, ${sources.size} source files, ` +
  `${sdkWords.size} SDK names`);
notes.push(`${pathN} paths (${looseN} by bare name or written at run time), ` +
  `${identN} identifiers, ${scopedN} of them checked against the file named beside them`);

for (const n of notes) console.log(`prose: ${n}`);
if (problems.length) {
  console.error(`\nprose: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("");
  process.exit(1);
}
console.log("prose: every path and identifier the course names resolves");
