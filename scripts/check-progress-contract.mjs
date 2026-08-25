/**
 * One progress contract, proved on every build.
 *
 * `ae.progress` is written by fifteen modules: the Lab and the handbook
 * through `lib/progress.ts`, and every course through its own
 * `components/*\/progress-store.ts`. They agree about the record only because
 * each of them independently keeps four promises — quarantine an unreadable
 * record, latch persistence after a failure, report whether a write landed,
 * and fire a DOM event so the same tab repaints. Nothing in the type system
 * says so, and the one store that quietly stopped keeping them went unnoticed
 * for as long as it took a reader to lose their milestones.
 *
 * So this asserts what a reviewer would otherwise take on trust:
 *
 *   1  every catalogue entry that reports progress declares a progressEvent
 *   2  every declared event is dispatched by exactly one module
 *   3  the site-wide reset knows about every store that exists
 *   4  the count of modules still hard-coding the key only ever goes down
 *
 * Run by `npm run progress:check`, inside `npm run build`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORES = join(ROOT, "components");
const RESET = join(ROOT, "components/progress-reset.ts");

/* The migration ratchet, in the shape `widgets:check` already uses. Each of
   these declares its own alias for "ae.progress" instead of importing PROG.
   `npm run progress:check` prints the live figure; lower it as stores move
   across. It may fall and never rise. */
const HARD_CODED_KEY = 12;

const problems = [];
const notes = [];
const fail = (m) => problems.push(m);

const { CATALOG_COURSES, TOP_LEVEL_COURSES } = await import("../lib/courses.ts");

/* ------------------------------------------------------------------ *
 * 1 — a course that reports progress must say when it changes
 * ------------------------------------------------------------------ */
const entries = [
  ...TOP_LEVEL_COURSES.map((c) => ({ ...c, where: "TOP_LEVEL_COURSES" })),
  ...CATALOG_COURSES.map((c) => ({ ...c, where: "CATALOG_COURSES" })),
];

const declared = new Set();
let reporting = 0;
for (const course of entries) {
  if (typeof course.progress !== "function") continue;
  reporting++;
  if (!course.progressEvent) {
    fail(`${course.where}: "${course.id}" reports progress but declares no ` +
         `progressEvent, so the home page and the catalogue cannot repaint ` +
         `in the tab that wrote it — a "storage" event never fires there.`);
    continue;
  }
  declared.add(course.progressEvent);
}
if (!problems.length) {
  notes.push(`${reporting} progress adapters, ${declared.size} distinct events, all declared`);
}

/* ------------------------------------------------------------------ *
 * 2 — every declared event has exactly one dispatcher
 * ------------------------------------------------------------------ */
function sources(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      sources(path, found);
    } else if (/\.tsx?$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

const files = [...sources(join(ROOT, "lib")), ...sources(join(ROOT, "components"))]
  .map((path) => ({ path, text: readFileSync(path, "utf8") }));

/* Dispatch sites name a constant, never the string, and the constant may be
   declared in `lib/` and re-exported under another name in `components/`.
   Resolve `const X = "…"` and `const Y = X` to a fixed point, and treat a name
   two modules define differently as unresolvable rather than guessing. */
const literalOf = new Map();
const aliasOf = new Map();
const ambiguous = new Set();

const remember = (map, name, value) => {
  if (map.has(name) && map.get(name) !== value) ambiguous.add(name);
  map.set(name, value);
};

for (const { text } of files) {
  for (const [, name, value] of text.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*["'`]([^"'`]+)["'`]/g)) {
    remember(literalOf, name, value);
  }
  for (const [, name, target] of text.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(\w+)\s*;/g)) {
    remember(aliasOf, name, target);
  }
}

for (let pass = 0; pass < 8; pass++) {
  for (const [name, target] of aliasOf) {
    if (!literalOf.has(name) && literalOf.has(target)) literalOf.set(name, literalOf.get(target));
  }
}

const namesFor = (event) => [
  JSON.stringify(event),
  `'${event}'`,
  ...[...literalOf].filter(([name, value]) => value === event && !ambiguous.has(name)).map(([name]) => name),
];

for (const event of declared) {
  const names = namesFor(event);
  const dispatchers = files.filter(({ text }) =>
    names.some((name) => text.includes(`dispatchEvent(new Event(${name}`)
      || text.includes(`dispatchEvent(new CustomEvent(${name}`)));

  if (dispatchers.length === 0) {
    fail(`"${event}" is declared in lib/courses.ts but nothing dispatches it. ` +
         `A milestone written in this tab would go unpainted until refocus.`);
  } else if (dispatchers.length > 1) {
    fail(`"${event}" is dispatched by ${dispatchers.length} modules ` +
         `(${dispatchers.map((f) => f.path.slice(ROOT.length + 1)).join(", ")}). ` +
         `One event, one owner.`);
  }
}
if (!problems.length) notes.push(`${declared.size} events, each with exactly one dispatcher`);

/* ------------------------------------------------------------------ *
 * 3 — the site-wide reset knows every store
 * ------------------------------------------------------------------ */
const resetText = readFileSync(RESET, "utf8");
const storeDirs = readdirSync(STORES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => {
    try {
      readFileSync(join(STORES, name, "progress-store.ts"));
      return true;
    } catch { return false; }
  });

const unreset = storeDirs.filter((name) => !resetText.includes(`./${name}/progress-store`));
if (unreset.length) {
  fail(`components/progress-reset.ts does not import ${unreset.join(", ")}. ` +
       `Those stores keep a module-level copy of the shared record, so after ` +
       `a site-wide reset their next write revives what the reader cleared.`);
} else {
  notes.push(`${storeDirs.length} course stores, all reachable from the site-wide reset`);
}

/* ------------------------------------------------------------------ *
 * 4 — the ratchet
 * ------------------------------------------------------------------ */
const hardCoded = files.filter(({ path, text }) =>
  path !== join(ROOT, "lib/progress.ts") && /"ae\.progress"/.test(text));

if (hardCoded.length > HARD_CODED_KEY) {
  fail(`modules hard-coding "ae.progress" grew to ${hardCoded.length}, ratchet ` +
       `allows ${HARD_CODED_KEY}. Import PROG from lib/progress.ts rather than ` +
       `raising the ratchet.`);
} else {
  notes.push(`${hardCoded.length} modules still hard-code the key ` +
    `(ratchet ${HARD_CODED_KEY}${
      hardCoded.length < HARD_CODED_KEY ? ` — lower it to ${hardCoded.length}` : ""})`);
}

/* ------------------------------------------------------------------ */
for (const n of notes) console.log(`progress: ${n}`);
if (problems.length) {
  console.error(`\nprogress: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("progress: contract holds");
