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
 * perfectly well. So this asserts, on every commit, the things a reviewer
 * would otherwise have to take on trust. Rules 1-4 are scoped to `course/`,
 * where the prose is teaching material and the bar is highest. Rule 5 runs
 * over every document in the repository:
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
 *   5  every `file.ts:57` citation, anywhere in the repository, lands on its
 *      subject — the line exists, and what the sentence names in backticks is
 *      actually near it
 *
 * What it cannot do, said plainly so nobody over-trusts it: rule 2 is
 * word-presence, not semantics. It proves a name is not *invented*. It cannot
 * prove the name still means what the sentence claims — that stays a reading
 * job. Rule 3 is the part that catches renames, and it only reaches prose that
 * names the file it is talking about. Rule 5 needs the paragraph to name
 * something the cited file contains; a citation floating in prose that quotes
 * nothing is left alone rather than guessed at, and this repository also
 * writes line numbers as bare `(606)`, which nothing here can see.
 *
 * Rules 1-4 walk `course/` and stop there, which keeps `docs/course-briefs/`
 * out of them by construction rather than by exemption. Leave that alone:
 * those briefs specify courses that do not exist yet, so their identifiers are
 * *supposed* to be unresolvable, and a checker that drowns in false positives
 * is one somebody switches off. Rule 5 does read them, and should — their
 * citations point into `lib/`, `app/` and `tests/`, which exist and move. The
 * exemption was about a subject that is not written, never about a number.
 *
 * Run by `npm run prose:check`, alongside `handbook:check` and `widgets:check`.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

/* ------------------------------------------------------------------ *
 * 5 — `file.ts:57` citations, repository-wide
 *
 * A citation is a claim with a number in it, and the number is the part that
 * rots silently: insert eight lines above it and the prose now points at
 * something else while still reading perfectly. Three of these turned up in
 * `docs/` in a single day — a `check-release-readiness.mjs:58-59` that the
 * change's own comment had pushed to `:66`, and an `llm.ts:37` pointing at a
 * comment rather than the literal at `:65`.
 *
 * Rule 1 and rule 2 cannot catch that: the file resolves and the identifier
 * exists. What is wrong is only the line. So this corroborates instead —
 * whatever the surrounding paragraph names in backticks, at least one of those
 * things has to actually be near the line the citation points at. When none of
 * them is, the message says where the tree really has it.
 *
 * The scope is wider than the rules above on purpose. `docs/course-briefs/`
 * stays exempt from identifier resolution, because those briefs specify courses
 * that do not exist yet — but their *citations* point into `lib/`, `app/` and
 * `tests/`, which exist and move. The exemption was about a subject that is not
 * written; it was never about the line numbers.
 * ------------------------------------------------------------------ */
const CITE_WINDOW = 4;

/* An anchor scattered over dozens of lines locates nothing, and would
   corroborate almost any number by luck. The cap is generous on purpose: too
   tight and a citation with only one broad anchor gets skipped rather than
   checked, which loses real defects silently — the worst way for a gate to
   fail. Readability of the message is handled by truncating the line list, not
   by discarding the anchor. */
const MAX_ANCHOR_LINES = 24;

/* Frozen or dated by nature: the Python original the course was ported from,
   and review snapshots that describe a tree as it stood on their own date. */
const CITE_SKIP = /^(?:legacy|course_review_|node_modules|out|output|outputs|tmp)\b/;

const CITATION = new RegExp(
  "(?<![\\w/.-])((?:[A-Za-z0-9_@][\\w@.-]*\\/)*[A-Za-z0-9_@][\\w@.-]*" +
  // Prose ranges use an en dash as often as a hyphen; miss that and the end of
  // the range is silently dropped, narrowing the window without saying so.
  "\\.(?:tsx?|m?js|json|css|ya?ml)):(\\d+)(?:[-\u2013\u2014](\\d+))?(?![\\d.])",
  "g",
);

const norm = (s) => s.replace(/\s+/g, " ").trim();

/** The list item containing `at`, or the whole block when this is not a list. */
function itemScope(text, [lo, hi], at) {
  const bullet = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]/;
  let start = lo, end = hi, cursor = lo;
  for (const line of text.slice(lo, hi).split("\n")) {
    const next = cursor + line.length + 1;
    if (bullet.test(line)) {
      if (cursor <= at) start = cursor;
      else if (cursor > at) { end = cursor; break; }
    }
    cursor = next;
  }
  return [start, end];
}

/* What may serve as a paragraph's subject. `plan` is a word; `callStructure`,
   `.hb .rail-list::before` and `selectCourseProgress` are things in a file. A
   bare short lowercase word matches too much to locate anything, and treating
   one as an anchor is how a citation checker starts crying wolf. */
function isDistinctive(v) {
  if (v.length < 4 || /^\d+$/.test(v)) return false;
  if (CITATION.test(v)) { CITATION.lastIndex = 0; return false; }
  CITATION.lastIndex = 0;
  return v.length >= 8 || /[.:(){}\[\]/=#_-]/.test(v) || /[a-z][A-Z]/.test(v) || /^[A-Z0-9_]+$/.test(v);
}
const fileLines = new Map();
function linesOf(path) {
  if (!fileLines.has(path)) fileLines.set(path, readFileSync(path, "utf8").split("\n"));
  return fileLines.get(path);
}

/* Tracked *and* untracked-but-not-ignored. A gate that reads only what is
   committed goes green on a document added in the same change that breaks it,
   which is exactly when it needs to speak. `--exclude-standard` means
   `.gitignore` decides what is noise, so there is no second denylist here to
   drift out of step with the first. */
const trackedFiles = execFileSync(
  "git", ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: ROOT, encoding: "utf8" },
).split("\n").filter(Boolean);
const tracked = trackedFiles.filter((f) => f.endsWith(".md") && !CITE_SKIP.test(f)).sort();

/* A citation may name a file by its basename alone — `Catalog.tsx:150`. Accept
   that only when the tracked tree holds exactly one file with that name; two
   candidates mean the prose has not actually said which, and guessing would be
   worse than the citation it is checking. */
const uniqueByBasename = new Map();
for (const f of trackedFiles) {
  const base = f.split("/").pop();
  uniqueByBasename.set(base, uniqueByBasename.has(base) ? null : f);
}

function citedPath(target, mdDir) {
  const hit = resolvePath(target, mdDir);
  if (hit) return hit;
  if (target.includes("/")) return null;
  const only = uniqueByBasename.get(target);
  return only ? join(ROOT, only) : null;
}

let citeN = 0, corroboratedN = 0;

for (const rel of tracked) {
  const doc = join(ROOT, rel);
  const mdDir = dirname(doc);
  const { masked } = parse(readFileSync(doc, "utf8"));
  const text = masked.join("\n");
  const inline = spans(masked);
  const blocks = paragraphs(masked);
  const at = (line) => `${rel}:${line}`;

  for (const m of text.matchAll(CITATION)) {
    const [whole, target, from, to] = m;
    const line = text.slice(0, m.index).split("\n").length;

    const path = citedPath(target, mdDir);
    if (!path) { fail(at(line), `citation \`${whole}\` names a file that resolves to nothing.`); continue; }
    citeN++;

    const body = linesOf(path);
    const start = Number(from), end = to ? Number(to) : Number(from);
    if (end > body.length) {
      fail(at(line), `citation \`${whole}\` points past the end of ` +
        `${relative(ROOT, path)}, which has ${body.length} lines.`);
      continue;
    }

    /* Corroborate against what the paragraph names. An anchor is any inline
       span in the same block that the cited file actually contains; if none
       does, the paragraph offers nothing to check the number against and the
       citation is left alone rather than guessed at. */
    /* Narrow to the list item, not the whole block. A dense brief writes eight
       bullets with no blank line between them, and the neighbouring bullet's
       subject is not this citation's — reading one as the other reports a real
       defect against the wrong evidence, which is how a checker teaches people
       to distrust it. */
    const block = blocks.find(([lo, hi]) => m.index >= lo && m.index < hi);
    if (!block) continue;
    const collect = ([lo0, hi0]) => inline
      .filter((s) => s.offset >= lo0 && s.offset < hi0)
      .filter((s) => isDistinctive(s.value))
      .map(({ value: v, offset: at }) => ({ v, at, lines: body.reduce((acc, l, i) =>
        (norm(l).includes(norm(v)) ? (acc.push(i + 1), acc) : acc), []) }))
      .filter((a) => a.lines.length && a.lines.length <= MAX_ANCHOR_LINES);

    // The item is the right scope; the block is the fallback when a citation
    // sits in a bullet that names nothing the cited file contains.
    const anchors = ((inItem) => inItem.length ? inItem : collect(block))(
      collect(itemScope(text, block, m.index)));
    if (!anchors.length) continue;

    corroboratedN++;
    const lo = start - CITE_WINDOW, hi = end + CITE_WINDOW;
    if (anchors.some((a) => a.lines.some((l) => l >= lo && l <= hi))) continue;

    /* Same line first — a span beside the citation is the sentence's own
       subject, and beats a rarer one from three sentences up. Then fewest
       occurrences, then nearest. */
    const lineOf = (off) => text.slice(0, off).split("\n").length;
    const here = lineOf(m.index);
    const best = anchors.slice().sort((a, b) =>
      (lineOf(a.at) === here ? 0 : 1) - (lineOf(b.at) === here ? 0 : 1)
      || a.lines.length - b.lines.length
      || Math.abs(a.at - m.index) - Math.abs(b.at - m.index))[0];
    const where = best.lines.length > 6
      ? `${best.lines.slice(0, 6).join(", ")} and ${best.lines.length - 6} more`
      : best.lines.join(", ");
    fail(at(line), `citation \`${whole}\` is not where the paragraph's subject ` +
      `lives: \`${best.v.length > 60 ? best.v.slice(0, 57) + "..." : best.v}\` is at ` +
      `${relative(ROOT, path)}:${where}.`);
  }
}

/* ------------------------------------------------------------------ */
notes.push(`${docs.length} course documents, ${sources.size} source files, ` +
  `${sdkWords.size} SDK names`);
notes.push(`${pathN} paths (${looseN} by bare name or written at run time), ` +
  `${identN} identifiers, ${scopedN} of them checked against the file named beside them`);
notes.push(`${tracked.length} documents carry ${citeN} file:line citations, ` +
  `${corroboratedN} of them corroborated against the paragraph's own subject`);

for (const n of notes) console.log(`prose: ${n}`);
if (problems.length) {
  console.error(`\nprose: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("");
  process.exit(1);
}
console.log("prose: every path, identifier and citation resolves");
