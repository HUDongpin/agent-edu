/**
 * Fail-closed static contract for browser-local course progress.
 *
 * Run with:
 *   node --import tsx scripts/check-progress-contract.mjs
 *
 * The coordinator still needs to wire this command into package.json/build.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { progressRegistryIntegrationErrors } from "./lib/progress-registry-contract.mjs";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMPONENTS = join(ROOT, "components");
const RESET = join(COMPONENTS, "progress-reset.ts");
const ADAPTERS = join(COMPONENTS, "progress-adapters.ts");
const PROGRESS_UI = join(COMPONENTS, "Progress.tsx");
const MY_LEARNING_UI = join(COMPONENTS, "learning", "MyLearning.tsx");
const CATALOG_UI = join(COMPONENTS, "courses", "Catalog.tsx");
const RECENCY = join(COMPONENTS, "progress-recency.ts");
const RECENCY_TRACKER = join(COMPONENTS, "ProgressRecencyTracker.tsx");
const SHELL = join(COMPONENTS, "Shell.tsx");
const PUBLIC_PROGRESS_CONTRACT = join(ROOT, "lib", "public-progress-contract.ts");
const PROGRESS_STORAGE_CONTRACT = join(ROOT, "lib", "progress-storage-contract.ts");

// Migration ratchet: all learner-facing progress surfaces use the registered
// adapters. Twelve legacy shared-key owners remain until their physical stores
// are migrated; this ceiling may never be raised.
const HARD_CODED_LEGACY_KEY_RATCHET = 12;

const EXPECTED_FRESH_NEXT_HREF = {
  agentic: "/en/handbook/#start",
  codex: "/en/codex/meet-codex/",
  claude: "/en/claude/choose-your-surface/",
  cursor: "/en/cursor/orient-privacy/",
  grok: "/en/grok/map-grok/",
  github: "/en/github/start-secure/",
  prompts: "/en/prompts/prompts-are-specifications/",
  "software-engineering": "/en/software-engineering/agentic-engineering-system/",
  rag: "/en/rag/choose-rag/",
  mcp: "/en/mcp/why-mcp/",
  "make-money-with-codex": "/en/make-money-with-codex/money-not-magic/",
  "claude-income": "/en/claude-income/choose-a-money-path/",
  "ai-tutor": "/en/ai-tutor/objectives-concept-map/",
  "product-management": "/en/product-management/product-judgment-operating-model/",
  "agent-orchestration": "/en/agent-orchestration/workflow-agent-boundary/",
};

const problems = [];
const notes = [];
const fail = (message) => problems.push(message);

class MemoryStorage {
  #values = new Map();
  get length() { return this.#values.size; }
  clear() { this.#values.clear(); }
  getItem(key) { return this.#values.get(key) ?? null; }
  key(index) { return [...this.#values.keys()][index] ?? null; }
  removeItem(key) { this.#values.delete(key); }
  setItem(key, value) { this.#values.set(key, String(value)); }
}

const contractLocalStorage = new MemoryStorage();
const contractSessionStorage = new MemoryStorage();
const contractWindow = new EventTarget();
Object.assign(contractWindow, {
  localStorage: contractLocalStorage,
  sessionStorage: contractSessionStorage,
});
globalThis.window = contractWindow;
globalThis.localStorage = contractLocalStorage;
globalThis.sessionStorage = contractSessionStorage;

const { manifest: releaseContract } = assertReleaseArtifactsCurrent({ projectRoot: ROOT });
const {
  createAllProgressAdapters,
  createPublishedProgressAdapters,
  validatePublishedProgressAdapterRegistry,
} = await import("../components/progress-adapters.ts");
const { PROGRESS_OWNED_STORAGE_KEYS } = await import("../lib/progress-storage-contract.ts");
const { PROGRESS_RESET_REGISTRY } = await import("../components/progress-reset.ts");

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

const files = [
  ...sourceFiles(join(ROOT, "lib")),
  ...sourceFiles(COMPONENTS),
].map((path) => ({ path, text: readFileSync(path, "utf8") }));

/* ------------------------------------------------------------------ *
 * 1 — every progress adapter has a same-tab repaint event
 * ------------------------------------------------------------------ */
const eventForCourse = new Map();
for (const course of releaseContract.courses.filter((entry) => entry.progress !== null)) {
  const event = course.progress?.event;
  if (typeof event === "string" && event.trim()) eventForCourse.set(course.id, event);
}

const declaredEvents = new Set(eventForCourse.values());
notes.push(`${eventForCourse.size} registry progress contracts resolve to ${declaredEvents.size} events`);

/* ------------------------------------------------------------------ *
 * 2 — every event has exactly one dispatching module
 * ------------------------------------------------------------------ */
const literalOf = new Map();
const aliasOf = new Map();
const ambiguous = new Set();

function remember(map, name, value) {
  if (map.has(name) && map.get(name) !== value) ambiguous.add(name);
  map.set(name, value);
}

for (const { text } of files) {
  for (const [, name, value] of text.matchAll(
    /(?:export\s+)?const\s+(\w+)\s*=\s*["'`]([^"'`]+)["'`]/g,
  )) {
    remember(literalOf, name, value);
  }
  for (const [, name, target] of text.matchAll(
    /(?:export\s+)?const\s+(\w+)\s*=\s*(\w+)\s*;/g,
  )) {
    remember(aliasOf, name, target);
  }
}

for (let pass = 0; pass < 8; pass += 1) {
  for (const [name, target] of aliasOf) {
    if (!literalOf.has(name) && literalOf.has(target)) {
      literalOf.set(name, literalOf.get(target));
    }
  }
}

function namesFor(event) {
  return [
    JSON.stringify(event),
    `'${event}'`,
    ...[...literalOf]
      .filter(([name, value]) => value === event && !ambiguous.has(name))
      .map(([name]) => name),
  ];
}

for (const event of declaredEvents) {
  const names = namesFor(event);
  const dispatchers = files.filter(({ text }) => names.some((name) =>
    text.includes(`dispatchEvent(new Event(${name}`)
      || text.includes(`dispatchEvent(new CustomEvent(${name}`),
  ));
  if (dispatchers.length === 0) {
    fail(`"${event}" is declared but no module dispatches it.`);
  } else if (dispatchers.length > 1) {
    fail(`"${event}" is dispatched by multiple modules: ${dispatchers
      .map(({ path }) => path.slice(ROOT.length + 1)).join(", ")}.`);
  }
}
notes.push(`${declaredEvents.size} same-tab events each have one owning module`);

/* ------------------------------------------------------------------ *
 * 3 — the site-wide reset reaches every store and ae.learning.v2
 * ------------------------------------------------------------------ */
const resetText = readFileSync(RESET, "utf8");
const adapterText = readFileSync(ADAPTERS, "utf8");
const recencyText = readFileSync(RECENCY, "utf8");
const recencyTrackerText = readFileSync(RECENCY_TRACKER, "utf8");
const publicProgressContractText = readFileSync(PUBLIC_PROGRESS_CONTRACT, "utf8");
const resetContractText = `${resetText}\n${adapterText}`;
const storeDirectories = readdirSync(COMPONENTS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => {
    try {
      readFileSync(join(COMPONENTS, name, "progress-store.ts"));
      return true;
    } catch {
      return false;
    }
  });

const missingFromReset = storeDirectories.filter(
  (name) => !resetContractText.includes(`./${name}/progress-store`),
);
if (missingFromReset.length) {
  fail(`progress-reset.ts does not register: ${missingFromReset.join(", ")}.`);
}
if (!resetContractText.includes('resetLearningStateWithResult("all")')) {
  fail("progress-reset.ts does not reset the authoritative ae.learning.v2 record.");
}
if (!resetText.includes("PROGRESS_RESET_REGISTRY")) {
  fail("progress-reset.ts has no inspectable reset registry.");
}
for (const token of [
  "resetProgressRecencyAfterGlobalReset",
  "isProgressRecencyPersistent",
  'id: "recency"',
]) {
  if (!resetText.includes(token)) fail(`progress-reset.ts does not register recency: ${token}.`);
}
notes.push(`${storeDirectories.length} course stores plus ae.learning.v2 are in the reset registry`);

/* ------------------------------------------------------------------ *
 * 3b — browser-storage operations form a closed, registered key set
 * ------------------------------------------------------------------ */
const expectedLocalStorageKeys = new Set([
  ...PROGRESS_OWNED_STORAGE_KEYS.localStorage.durable,
  ...PROGRESS_OWNED_STORAGE_KEYS.localStorage.ephemeral,
  ...PROGRESS_OWNED_STORAGE_KEYS.localStorage.quarantine,
]);
const expectedLocalQuarantineKeys = new Set(
  PROGRESS_OWNED_STORAGE_KEYS.localStorage.quarantine,
);
const expectedSessionStorageKeys = new Set(
  PROGRESS_OWNED_STORAGE_KEYS.sessionStorage.ephemeral,
);
const observedLocalStorageKeys = new Set();
const observedSessionStorageKeys = new Set();

function resolveStorageKeyToken(token, text) {
  const quoted = token.match(/^["'`]([^"'`]+)["'`]$/);
  if (quoted) return quoted[1];

  const localLiterals = new Map([...text.matchAll(
    /(?:export\s+)?const\s+(\w+)\s*=\s*["'`]([^"'`]+)["'`]/g,
  )].map((match) => [match[1], match[2]]));
  const localAliases = new Map([...text.matchAll(
    /(?:export\s+)?const\s+(\w+)\s*=\s*(\w+)\s*;/g,
  )].map((match) => [match[1], match[2]]));
  const seen = new Set();
  let name = token;
  while (!seen.has(name)) {
    seen.add(name);
    if (localLiterals.has(name)) return localLiterals.get(name);
    if (localAliases.has(name)) {
      name = localAliases.get(name);
      continue;
    }
    if (!ambiguous.has(name) && literalOf.has(name)) return literalOf.get(name);
    return null;
  }
  return null;
}

const progressStorageFiles = files.filter(({ path }) =>
  path === join(ROOT, "lib", "progress.ts")
    || path === RECENCY
    || path.endsWith("/progress-store.ts")
    || path.endsWith("/grok/quiz-attempt-store.ts")
    || path.endsWith("/grok/task-contract-draft-store.ts"));
for (const { path, text } of progressStorageFiles) {
  for (const match of text.matchAll(
    /(?:window\.)?(localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*(\w+|["'`][^"'`]+["'`])/g,
  )) {
    const key = resolveStorageKeyToken(match[2], text);
    if (!key) {
      fail(`${path.slice(ROOT.length + 1)} has an unresolved storage key: ${match[2]}.`);
      continue;
    }
    (match[1] === "localStorage" ? observedLocalStorageKeys : observedSessionStorageKeys).add(key);
  }
  if (path === join(ROOT, "lib", "progress.ts")) {
    for (const match of text.matchAll(
      /(?:safeRead|safeWrite|safeRemove|writeResult|removeResult)\(\s*storage\s*,\s*(\w+|["'`][^"'`]+["'`])/g,
    )) {
      // The safeWrite/safeRemove wrappers forward their already-audited key.
      if (match[1] === "key") continue;
      const key = resolveStorageKeyToken(match[1], text);
      if (!key) fail(`lib/progress.ts has an unresolved storage key: ${match[1]}.`);
      else observedLocalStorageKeys.add(key);
    }
  }
  for (const match of text.matchAll(/quarantineKey:\s*(\w+)/g)) {
    const key = resolveStorageKeyToken(match[1], text);
    if (!key) {
      fail(`${path.slice(ROOT.length + 1)} has an unresolved quarantine key: ${match[1]}.`);
    } else {
      observedLocalStorageKeys.add(key);
    }
  }
}

function compareClosedKeySet(label, observed, expected) {
  const unregistered = [...observed].filter((key) => !expected.has(key));
  const unused = [...expected].filter((key) => !observed.has(key));
  if (unregistered.length) fail(`${label} uses unregistered keys: ${unregistered.join(", ")}.`);
  if (unused.length) fail(`${label} declares unused keys: ${unused.join(", ")}.`);
}
compareClosedKeySet("progress localStorage", observedLocalStorageKeys, expectedLocalStorageKeys);
compareClosedKeySet("progress sessionStorage", observedSessionStorageKeys, expectedSessionStorageKeys);

const resetStorageKeys = new Set(PROGRESS_RESET_REGISTRY.flatMap((entry) => entry.storageKeys));
const expectedResetStorageKeys = new Set([
  ...PROGRESS_OWNED_STORAGE_KEYS.localStorage.durable,
  ...PROGRESS_OWNED_STORAGE_KEYS.localStorage.ephemeral,
  ...expectedSessionStorageKeys,
]);
compareClosedKeySet("progress reset registry", resetStorageKeys, expectedResetStorageKeys);
const activeQuarantineKeys = [...expectedLocalQuarantineKeys]
  .filter((key) => resetStorageKeys.has(key));
if (activeQuarantineKeys.length) {
  fail(`inactive quarantine keys must not be consumed as reset-active records: ${activeQuarantineKeys.join(", ")}.`);
}
notes.push(`${resetStorageKeys.size} active progress-owned keys and ${expectedLocalQuarantineKeys.size} inactive quarantine keys form a closed storage contract`);

/* ------------------------------------------------------------------ *
 * 4 — the public adapter registry matches the editorial release set
 * ------------------------------------------------------------------ */
const publishedAdapters = createPublishedProgressAdapters("en");
const allAdapters = createAllProgressAdapters("en");
if (!/ProgressSummaryState[\s\S]{0,160}["']unavailable["']/.test(publicProgressContractText)) {
  fail("ProgressSummaryState does not expose unavailable.");
}
if (!publicProgressContractText.includes("readonly nextHref: string | null")) {
  fail("ProgressStoreSummary.nextHref must be string | null.");
}
for (const reason of ["unavailable", "quota", "corrupt"]) {
  if (!publicProgressContractText.includes(`\"${reason}\"`)) {
    fail(`PersistenceResult is missing ${reason}.`);
  }
}
for (const error of validatePublishedProgressAdapterRegistry(publishedAdapters)) fail(error);
for (const error of progressRegistryIntegrationErrors(
  releaseContract,
  allAdapters,
  publishedAdapters,
)) fail(error);
if (new Set(allAdapters.map((adapter) => adapter.progressEvent)).size !== allAdapters.length) {
  fail("implemented progress adapters must own unique same-tab events.");
}
for (const adapter of allAdapters) {
  if (typeof adapter.readSummary !== "function") fail(`${adapter.courseId}: readSummary missing.`);
  if (typeof adapter.resetAfterGlobalReset !== "function") {
    fail(`${adapter.courseId}: resetAfterGlobalReset missing.`);
  }
  const fresh = adapter.readSummary();
  if (fresh.nextHref !== EXPECTED_FRESH_NEXT_HREF[adapter.courseId]) {
    fail(`${adapter.courseId}: fresh nextHref is ${fresh.nextHref}; expected `
      + `${EXPECTED_FRESH_NEXT_HREF[adapter.courseId]}.`);
  }
  if (fresh.percent < 0 || fresh.percent > 100) {
    fail(`${adapter.courseId}: percent is outside 0..100: ${fresh.percent}`);
  }
}
notes.push(`${publishedAdapters.length} published adapters expose summary, exact nextHref and reset`);
notes.push(`${allAdapters.length - publishedAdapters.length} dormant adapters are ready but not public`);

delete globalThis.window;
delete globalThis.localStorage;
delete globalThis.sessionStorage;
for (const adapter of createAllProgressAdapters("en")) {
  const unavailable = adapter.readSummary();
  if (unavailable.state !== "unavailable" || unavailable.nextHref !== null) {
    fail(`${adapter.courseId}: no-storage summary must be unavailable with a null nextHref.`);
  }
}
notes.push(`${allAdapters.length} adapters fail closed without browser storage`);

/* ------------------------------------------------------------------ *
 * 5 — reset confirmation and persistence feedback stay wired
 * ------------------------------------------------------------------ */
const progressUiText = readFileSync(PROGRESS_UI, "utf8");
const myLearningUiText = readFileSync(MY_LEARNING_UI, "utf8");
for (const token of [
  "window.confirm",
  "resetEveryCourseProgress",
  "createPublishedProgressAdapters",
  "storageUnavailable",
  "resetSessionOnly",
]) {
  if (!myLearningUiText.includes(token)) fail(`MyLearning.tsx is missing ${token}.`);
}
if (!progressUiText.includes("createPublishedProgressAdapters")) {
  fail("Progress.tsx does not consume the published adapter registry.");
}
for (const token of [
  "readProgressRecency",
  "sortCourseIdsByRecentActivity",
  "PROGRESS_RECENCY_EVENT",
]) {
  if (!myLearningUiText.includes(token)) fail(`MyLearning.tsx is missing recency contract ${token}.`);
}
for (const token of [
  "PROGRESS_RECENCY_STORAGE_KEY",
  "PublishedProgressCourseId",
  "recordProgressActivity",
  "reasonForStorageFailure",
]) {
  if (!recencyText.includes(token)) fail(`progress-recency.ts is missing ${token}.`);
}
if (!recencyTrackerText.includes("PUBLIC_PUBLISHED_COURSE_SURFACES")
  || !recencyTrackerText.includes("surface.progressEvent")
  || !recencyTrackerText.includes("recordProgressActivity(surface.id")) {
  fail("ProgressRecencyTracker must consume the lightweight canonical event projection.");
}
if (recencyTrackerText.includes("progress-adapters")) {
  fail("ProgressRecencyTracker must not load course progress adapters into every page.");
}
if (!readFileSync(SHELL, "utf8").includes("<ProgressRecencyTracker")) {
  fail("Shell.tsx does not mount the progress recency tracker.");
}
for (const [path, text] of [
  ["Progress.tsx", progressUiText],
  ["MyLearning.tsx", myLearningUiText],
  ["Catalog.tsx", readFileSync(CATALOG_UI, "utf8")],
]) {
  if (text.includes("adapter.isPersistent()")) {
    fail(`${path} must consume readSummary().state instead of guessing persistence.`);
  }
}

/* ------------------------------------------------------------------ *
 * 6 — root integration must move Catalog off legacy Agentic reads
 * ------------------------------------------------------------------ */
const catalogText = readFileSync(CATALOG_UI, "utf8");
if (!catalogText.includes("createPublishedProgressAdapters")) {
  fail("Catalog.tsx does not consume the ae.learning.v2-backed published adapter registry.");
}
if (catalogText.includes("progress?.percent ?? 0")) {
  fail("Catalog.tsx must not convert pending or unavailable progress into a false 0% claim.");
}
for (const token of ["progressPending", 't("ui.loading")', "progressUnavailable"]) {
  if (!catalogText.includes(token)) fail(`Catalog.tsx is missing explicit progress state ${token}.`);
}

const hardCodedLegacyKey = files.filter(({ path, text }) =>
  path !== join(ROOT, "lib", "progress.ts")
    && path !== PROGRESS_STORAGE_CONTRACT
    && /"ae\.progress"/.test(text));
if (hardCodedLegacyKey.length > HARD_CODED_LEGACY_KEY_RATCHET) {
  fail(`modules hard-coding ae.progress grew to ${hardCodedLegacyKey.length}; `
    + `ratchet allows ${HARD_CODED_LEGACY_KEY_RATCHET}. Import PROG instead: ${hardCodedLegacyKey
      .map(({ path }) => path.slice(ROOT.length + 1)).join(", ")}.`);
} else {
  notes.push(`${hardCodedLegacyKey.length} modules hard-code ae.progress `
    + `(ratchet ${HARD_CODED_LEGACY_KEY_RATCHET})`);
}

for (const note of notes) console.log(`progress: ${note}`);
if (problems.length) {
  console.error(`\nprogress: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log("progress: contract holds");
