/**
 * Cross-course progress contract.
 *
 * This is a semantic port of 0235363, not a file-level cherry-pick. Course 1
 * now uses the versioned `ae.learning.v2` store, while the remaining released
 * courses still expose component-local stores. The contract therefore proves:
 *
 *   1. every catalog/top-level progress adapter declares a same-tab event;
 *   2. each declared event has exactly one source dispatcher;
 *   3. every discovered course store is represented in the global reset;
 *   4. the reset includes the canonical v2 store;
 *   5. hard-coded legacy keys cannot grow beyond the migration ratchet.
 *
 * The exported evaluator accepts fixtures so negative tests can demonstrate
 * that a missing event or reset import fails closed.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// The newer base adds the course-kit defaults and the v2 compatibility bridge,
// so its honest starting point is 16 rather than 0235363's earlier 12. This is
// a one-way ceiling: lower it whenever a consumer imports the canonical key.
export const HARD_CODED_LEGACY_KEY_LIMIT = 16;

function issue(code, message, details = {}) {
  return { code, message, ...details };
}

function sourceFiles(directory, found = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      sourceFiles(path, found);
    } else if (/\.tsx?$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

function eventNamesByLiteral(files) {
  const literalOf = new Map();
  const aliasOf = new Map();
  const ambiguous = new Set();

  const remember = (map, name, value) => {
    if (map.has(name) && map.get(name) !== value) ambiguous.add(name);
    map.set(name, value);
  };

  for (const { text } of files) {
    for (const match of text.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*["'`]([^"'`]+)["'`](?:\s+as\s+const)?/g)) {
      remember(literalOf, match[1], match[2]);
    }
    for (const match of text.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(\w+)\s*;/g)) {
      remember(aliasOf, match[1], match[2]);
    }
  }

  for (let pass = 0; pass < 12; pass += 1) {
    for (const [name, target] of aliasOf) {
      if (!literalOf.has(name) && literalOf.has(target)) literalOf.set(name, literalOf.get(target));
    }
  }

  return (event) => [
    JSON.stringify(event),
    `'${event}'`,
    ...[...literalOf]
      .filter(([name, value]) => value === event && !ambiguous.has(name))
      .map(([name]) => name),
  ];
}

/** Evaluate already-loaded data. Intended for the live gate and negative fixtures. */
export function evaluateProgressContract({
  entries,
  files,
  resetText,
  storeDirs,
  canonicalProgressText,
  hardCodedLegacyKeyLimit = HARD_CODED_LEGACY_KEY_LIMIT,
  root = "",
}) {
  const issues = [];
  const notes = [];
  const declared = new Set();
  const eventByCourse = new Map();
  let reportingAdapters = 0;

  for (const entry of entries) {
    if (typeof entry.progress !== "function") continue;
    reportingAdapters += 1;
    if (!entry.progressEvent) {
      issues.push(issue(
        "progress-event-missing",
        `${entry.where}: ${JSON.stringify(entry.id)} reports progress but declares no progressEvent`,
        { courseId: entry.id, source: entry.where },
      ));
      continue;
    }
    const prior = eventByCourse.get(entry.id);
    if (prior && prior !== entry.progressEvent) {
      issues.push(issue(
        "progress-event-drift",
        `${entry.id} declares different events in the top-level and catalog records`,
        { courseId: entry.id, expected: prior, observed: entry.progressEvent },
      ));
    }
    eventByCourse.set(entry.id, entry.progressEvent);
    declared.add(entry.progressEvent);
  }
  if (!issues.some((item) => item.code.startsWith("progress-event"))) {
    notes.push(`${reportingAdapters} progress adapters declare ${declared.size} distinct events`);
  }

  const namesFor = eventNamesByLiteral(files);
  for (const event of declared) {
    const names = namesFor(event);
    const dispatchers = files.filter(({ text }) => names.some((name) => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(
        `dispatchEvent\\s*\\(\\s*new\\s+(?:Custom)?Event\\s*\\(\\s*${escaped}`,
      ).test(text);
    }));
    if (dispatchers.length === 0) {
      issues.push(issue(
        "progress-event-undispatched",
        `${JSON.stringify(event)} is declared but no source dispatches it`,
        { event },
      ));
    } else if (dispatchers.length > 1) {
      issues.push(issue(
        "progress-event-multiple-dispatchers",
        `${JSON.stringify(event)} is dispatched by ${dispatchers.length} source files`,
        {
          event,
          files: dispatchers.map((file) => root ? relative(root, file.path) : file.path),
        },
      ));
    }
  }
  if (!issues.some((item) => item.code.includes("dispatch"))) {
    notes.push(`${declared.size} events each have one dispatcher`);
  }

  for (const storeDir of storeDirs) {
    if (!resetText.includes(`./${storeDir}/progress-store`)) {
      issues.push(issue(
        "progress-reset-store-missing",
        `components/progress-reset.ts does not import ${storeDir}/progress-store`,
        { courseId: storeDir },
      ));
    }
  }
  if (!issues.some((item) => item.code === "progress-reset-store-missing")) {
    notes.push(`${storeDirs.length} discovered course stores are reachable from the global reset`);
  }

  if (!resetText.includes('resetLearningState("all")')) {
    issues.push(issue(
      "progress-reset-canonical-missing",
      "the global reset does not clear the canonical ae.learning.v2 store",
    ));
  }
  for (const token of ["LEARNING_KEY", "createLearningStore", "resetLearningState"]) {
    if (!canonicalProgressText.includes(token)) {
      issues.push(issue(
        "progress-canonical-contract-missing",
        `lib/progress.ts is missing canonical contract token ${token}`,
        { token },
      ));
    }
  }

  const hardCoded = files.filter(({ path, text }) => (
    !path.endsWith("lib/progress.ts") && /["']ae\.progress["']/.test(text)
  ));
  if (hardCoded.length > hardCodedLegacyKeyLimit) {
    issues.push(issue(
      "progress-legacy-key-ratchet",
      `${hardCoded.length} modules hard-code ae.progress; the ratchet allows ${hardCodedLegacyKeyLimit}`,
      {
        observed: hardCoded.length,
        allowed: hardCodedLegacyKeyLimit,
        files: hardCoded.map((file) => root ? relative(root, file.path) : file.path),
      },
    ));
  } else {
    notes.push(`${hardCoded.length} modules hard-code ae.progress (ratchet ${hardCodedLegacyKeyLimit})`);
  }

  return {
    ok: issues.length === 0,
    counts: {
      reportingAdapters,
      distinctEvents: declared.size,
      stores: storeDirs.length,
      hardCodedLegacyKeys: hardCoded.length,
    },
    issues,
    notes,
  };
}

export async function checkProgressContract(projectRoot = DEFAULT_ROOT) {
  const root = resolve(projectRoot);
  const componentsRoot = join(root, "components");
  const files = [
    ...sourceFiles(join(root, "lib")),
    ...sourceFiles(componentsRoot),
  ].map((path) => ({ path, text: readFileSync(path, "utf8") }));
  const { CATALOG_COURSES, TOP_LEVEL_COURSES } = await import(
    `${pathToFileURL(join(root, "lib/courses.ts")).href}?progress-contract=${Date.now()}`
  );
  const entries = [
    ...TOP_LEVEL_COURSES.map((course) => ({ ...course, where: "TOP_LEVEL_COURSES" })),
    ...CATALOG_COURSES.map((course) => ({ ...course, where: "CATALOG_COURSES" })),
  ];
  const storeDirs = readdirSync(componentsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      try {
        readFileSync(join(componentsRoot, entry.name, "progress-store.ts"));
        return true;
      } catch {
        return false;
      }
    })
    .map((entry) => entry.name)
    .sort();

  return evaluateProgressContract({
    entries,
    files,
    resetText: readFileSync(join(componentsRoot, "progress-reset.ts"), "utf8"),
    storeDirs,
    canonicalProgressText: readFileSync(join(root, "lib/progress.ts"), "utf8"),
    root,
  });
}

export function formatProgressContract(result) {
  const lines = [
    `progress: ${result.ok ? "PASS" : "FAIL"}`,
    ...result.notes.map((note) => `progress: ${note}`),
  ];
  for (const item of result.issues) lines.push(`progress: ${item.code}: ${item.message}`);
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const result = await checkProgressContract();
  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else console.log(formatProgressContract(result));
  if (!result.ok) process.exitCode = 1;
}
