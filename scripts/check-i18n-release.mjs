#!/usr/bin/env node

/**
 * Release-grade, fail-closed internationalisation audit.
 *
 * This is deliberately a reporter rather than a translator.  It discovers the
 * current locale/message/route/course surface, records reproducible evidence,
 * and refuses to turn an incomplete or moving workspace into a percentage.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import vm from "node:vm";
import { walkHandbook } from "../lib/handbook/segments.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const RELEASE = argv.includes("--release");
const JSON_ONLY = argv.includes("--json");
const productionArg = argv.find((arg) => arg.startsWith("--production="));
const PRODUCTION = productionArg ? productionArg.slice("--production=".length).replace(/\/$/, "") : null;
const startedAt = new Date().toISOString();

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const posix = (value) => value.split(sep).join("/");
const readText = (path) => readFileSync(path, "utf8");
const jsonParse = (path) => JSON.parse(readText(path));
const rel = (path) => posix(relative(ROOT, path));

function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, value);
  renameSync(temporary, path);
}

function walk(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() || entry.isSymbolicLink()) {
        if (predicate(full)) files.push(full);
      }
    }
  };
  visit(directory);
  return files.sort();
}

function git(args, fallback = "") {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch {
    return fallback;
  }
}

const ignoredInput = /^(?:node_modules|\.git|\.next|out|output|\.playwright-cli|playwright-report|test-results)(?:\/|$)/;

function trackedInputPaths() {
  const raw = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
  return raw.split("\0").filter(Boolean).map(posix).filter((path) => !ignoredInput.test(path)).sort();
}

function fileRecord(path) {
  const absolute = join(ROOT, path);
  try {
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) return { path, type: "symlink", sha256: sha256(readlinkSync(absolute)) };
    if (!stat.isFile()) return { path, type: "other", sha256: "" };
    return { path, type: "file", bytes: stat.size, sha256: sha256(readFileSync(absolute)) };
  } catch {
    return { path, type: "missing", sha256: "" };
  }
}

function inputSnapshot() {
  const files = trackedInputPaths().map(fileRecord);
  const canonical = JSON.stringify(files);
  return {
    files,
    hash: sha256(canonical),
    stagedDiffHash: sha256(git(["diff", "--cached", "--binary"])),
    unstagedDiffHash: sha256(git(["diff", "--binary"])),
    untracked: git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean).sort(),
  };
}

function siteContentHash(snapshot) {
  const include = /^(?:app|components|lib|messages|public|course)(?:\/|$)|^(?:package(?:-lock)?\.json|next\.config\.[cm]?[jt]s|vercel\.json|tsconfig\.json)$/;
  return sha256(JSON.stringify(snapshot.files.filter((file) => include.test(file.path))));
}

const startSnapshot = inputSnapshot();
const commit = git(["rev-parse", "HEAD"], "NO_GIT");
const branch = git(["branch", "--show-current"], "DETACHED");
const contentHash = siteContentHash(startSnapshot);
const snapshotId = `${commit.slice(0, 12)}-${contentHash.slice(0, 16)}`;
const AUDIT_DIR = join(ROOT, "output", "i18n-audit", snapshotId);
const PLAYWRIGHT_DIR = join(ROOT, "output", "playwright", snapshotId);

/** @type {Array<Record<string, unknown>>} */
const findings = [];
function finding({
  target = "local-candidate",
  locale = "*",
  domain = "global",
  route = "",
  state,
  key = "",
  category,
  observed = "",
  source = "",
  evidence = "",
  disposition = state === "PASS" ? "accepted" : "blocking",
  reviewer = "",
}) {
  findings.push({
    target,
    locale,
    domain,
    route,
    state,
    key,
    category,
    observed: String(observed),
    source,
    evidence,
    disposition,
    reviewer,
  });
}

function safeJson(path, { domain = "global", locale = "*" } = {}) {
  try {
    return jsonParse(path);
  } catch (error) {
    finding({
      locale,
      domain,
      state: "FAIL",
      category: "invalid-json",
      observed: error instanceof Error ? error.message : String(error),
      source: rel(path),
      evidence: "The locale file must exist and parse as JSON.",
    });
    return null;
  }
}

function discoverLocales() {
  const source = readText(join(ROOT, "lib", "i18n.ts"));
  const locales = [];
  for (const match of source.matchAll(/\{\s*code:\s*["']([^"']+)["'][\s\S]*?dir:\s*["'](ltr|rtl)["'][\s\S]*?\}/g)) {
    locales.push({ code: match[1], dir: match[2] });
  }
  if (!locales.length) {
    finding({ state: "NOT_ASSESSABLE", category: "locale-discovery-failed", source: "lib/i18n.ts" });
  }
  return locales;
}

const localeMeta = discoverLocales();
const locales = localeMeta.map((item) => item.code);
const defaultLocale = /DEFAULT_LOCALE\s*=\s*["']([^"']+)/.exec(readText(join(ROOT, "lib", "i18n.ts")))?.[1] ?? "en";
const targetLocales = locales.filter((locale) => locale !== defaultLocale);

function discoverDomains() {
  return walk(join(ROOT, "messages"), (path) => path.endsWith(`${sep}en.json`) || path === join(ROOT, "messages", "en.json"))
    .map((path) => ({
      name: dirname(path) === join(ROOT, "messages") ? "main" : posix(relative(join(ROOT, "messages"), dirname(path))),
      directory: dirname(path),
      englishPath: path,
    }));
}

const domains = discoverDomains();
if (!domains.some((domain) => domain.name === "main")) {
  finding({ state: "NOT_ASSESSABLE", domain: "main", category: "english-source-missing", source: "messages/en.json" });
}

const exceptionDocument = safeJson(join(ROOT, "i18n-exceptions.json")) ?? { exceptions: [] };
const exceptions = Array.isArray(exceptionDocument.exceptions) ? exceptionDocument.exceptions : [];
const exceptionIds = new Set();
for (const exception of exceptions) {
  const required = ["id", "domain", "reason", "expectedLanguage", "expectedDirection", "approvedBy", "approvedAt"];
  const missing = required.filter((field) => !String(exception?.[field] ?? "").trim());
  if (missing.length || (!exception?.key && !exception?.selector) || exceptionIds.has(exception?.id)) {
    finding({
      state: "FAIL",
      domain: "exceptions",
      category: "invalid-exception",
      key: String(exception?.id ?? ""),
      observed: missing.length ? `missing ${missing.join(", ")}` : "duplicate id or missing key/selector",
      source: "i18n-exceptions.json",
    });
  }
  exceptionIds.add(exception?.id);
}

function approvedException(domain, key = "", selector = "") {
  return exceptions.find((entry) =>
    entry.domain === domain
    && (!entry.key || entry.key === key)
    && (!entry.selector || entry.selector === selector));
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function flatten(value, prefix = "", leaves = new Map(), shapes = new Map()) {
  const type = valueType(value);
  if (prefix) shapes.set(prefix, type);
  if (type === "object") {
    for (const key of Object.keys(value).sort()) flatten(value[key], prefix ? `${prefix}.${key}` : key, leaves, shapes);
  } else if (type === "array") {
    value.forEach((entry, index) => flatten(entry, `${prefix}[${index}]`, leaves, shapes));
  } else {
    leaves.set(prefix, value);
  }
  return { leaves, shapes };
}

function pluralPlan(domain, locale, englishLeaves) {
  if (domain !== "widgets") return null;
  const candidates = new Map();
  for (const key of englishLeaves.keys()) {
    const match = /^(.*)\.(zero|one|two|few|many|other)$/.exec(key);
    if (match) {
      if (!candidates.has(match[1])) candidates.set(match[1], new Set());
      candidates.get(match[1]).add(match[2]);
    }
  }
  // A key ending in `.one` or `.other` is not automatically a plural.  The
  // widgets contract uses at least the English one+other pair for a true stem.
  const stems = new Set([...candidates].filter(([, categories]) => categories.has("one") && categories.has("other")).map(([stem]) => stem));
  // Match the runtime/checker contract: these widgets pluralise bounded
  // counts, so use the categories actually selected for 0..200 (plus other),
  // not theoretical CLDR categories reachable only by values such as 1e6.
  const rules = new Intl.PluralRules(locale);
  const categories = new Set(["other"]);
  for (let value = 0; value <= 200; value++) categories.add(rules.select(value));
  return { stems, categories };
}

function expectedLeafKeys(domain, locale, englishLeaves) {
  if (locale === defaultLocale) return new Set(englishLeaves.keys());
  const plural = pluralPlan(domain, locale, englishLeaves);
  if (!plural) return new Set(englishLeaves.keys());
  const expected = new Set();
  for (const key of englishLeaves.keys()) {
    const match = /^(.*)\.(zero|one|two|few|many|other)$/.exec(key);
    if (!match || !plural.stems.has(match[1])) expected.add(key);
  }
  for (const stem of plural.stems) for (const category of plural.categories) expected.add(`${stem}.${category}`);
  return expected;
}

function englishReferenceFor(domain, key, englishLeaves) {
  if (englishLeaves.has(key)) return englishLeaves.get(key);
  if (domain === "widgets") {
    const match = /^(.*)\.(zero|one|two|few|many|other)$/.exec(key);
    if (match) return englishLeaves.get(`${match[1]}.other`);
  }
  return undefined;
}

function placeholders(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(/(?<!\{)\{([A-Za-z_$][\w$]*)\}(?!\})/g)].map((match) => match[1]).sort();
}

function markerSignature(value) {
  if (typeof value !== "string") return { bold: 0, italic: 0 };
  const bold = (value.match(/\*\*/g) ?? []).length;
  const withoutBold = value.replace(/\*\*/g, "");
  return { bold, italic: (withoutBold.match(/\*/g) ?? []).length };
}

const matrix = {};
const reviewRows = Object.fromEntries(targetLocales.map((locale) => [locale, []]));
const domainData = new Map();

for (const domain of domains) {
  const english = safeJson(domain.englishPath, { domain: domain.name, locale: defaultLocale });
  if (!english) continue;
  const englishFlat = flatten(english);
  domainData.set(domain.name, { ...domain, english, ...englishFlat });
  matrix[domain.name] = {};

  for (const locale of locales) {
    const path = join(domain.directory, `${locale}.json`);
    if (!existsSync(path)) {
      finding({
        locale,
        domain: domain.name,
        state: "FAIL",
        category: "locale-file-missing",
        source: rel(path),
        evidence: "Every discovered namespace must have a file for every discovered locale.",
      });
      if (locale !== defaultLocale) {
        for (const [key, sourceValue] of englishFlat.leaves) reviewRows[locale].push({ domain: domain.name, key, source: sourceValue, target: "", automaticStatus: "missing-locale-file", exceptionId: "" });
      }
      matrix[domain.name][locale] = { status: "FAIL", source: englishFlat.leaves.size, required: englishFlat.leaves.size, provided: 0, missing: englishFlat.leaves.size, extra: 0, empty: 0, identical: 0, exceptions: 0 };
      continue;
    }
    const own = safeJson(path, { domain: domain.name, locale });
    if (!own) continue;
    const ownFlat = flatten(own);
    const expected = expectedLeafKeys(domain.name, locale, englishFlat.leaves);
    const missing = [...expected].filter((key) => !ownFlat.leaves.has(key));
    const extra = [...ownFlat.leaves.keys()].filter((key) => !expected.has(key));
    let empty = 0;
    let identical = 0;
    let allowed = 0;

    for (const key of missing) {
      const exception = approvedException(domain.name, key);
      if (locale !== defaultLocale) reviewRows[locale].push({ domain: domain.name, key, source: englishReferenceFor(domain.name, key, englishFlat.leaves), target: "", automaticStatus: exception ? "approved-exception" : "missing", exceptionId: exception?.id ?? "" });
      if (exception) {
        allowed++;
        continue;
      }
      finding({ locale, domain: domain.name, state: "FAIL", key, category: "missing-key-english-fallback", source: rel(path), evidence: `English source: ${String(englishReferenceFor(domain.name, key, englishFlat.leaves) ?? "")}` });
    }
    for (const key of extra) {
      finding({ locale, domain: domain.name, state: "FAIL", key, category: "extra-key", observed: ownFlat.leaves.get(key), source: rel(path) });
    }
    for (const [key, value] of ownFlat.leaves) {
      if (value === null || (typeof value === "string" && value.trim() === "")) {
        empty++;
        finding({ locale, domain: domain.name, state: "FAIL", key, category: "empty-value", source: rel(path) });
      }
      if (!expected.has(key)) continue;
      const sourceValue = englishReferenceFor(domain.name, key, englishFlat.leaves);
      if (sourceValue !== undefined && valueType(value) !== valueType(sourceValue)) {
        finding({ locale, domain: domain.name, state: "FAIL", key, category: "leaf-type-mismatch", observed: valueType(value), source: rel(path), evidence: `Expected ${valueType(sourceValue)}` });
      }
      if (typeof value === "string" && typeof sourceValue === "string") {
        const wantedPlaceholders = placeholders(sourceValue);
        const observedPlaceholders = placeholders(value);
        if (JSON.stringify(wantedPlaceholders) !== JSON.stringify(observedPlaceholders)) {
          finding({ locale, domain: domain.name, state: "FAIL", key, category: "placeholder-mismatch", observed: observedPlaceholders.join(","), source: rel(path), evidence: `Expected ${wantedPlaceholders.join(",")}` });
        }
        const wantedMarkers = markerSignature(sourceValue);
        const observedMarkers = markerSignature(value);
        if (JSON.stringify(wantedMarkers) !== JSON.stringify(observedMarkers)) {
          finding({ locale, domain: domain.name, state: "FAIL", key, category: "format-marker-mismatch", observed: JSON.stringify(observedMarkers), source: rel(path), evidence: `Expected ${JSON.stringify(wantedMarkers)}` });
        }
        if (locale !== defaultLocale && value === sourceValue) {
          identical++;
          const exception = approvedException(domain.name, key);
          if (exception) allowed++;
          else finding({
            locale,
            domain: domain.name,
            state: "FAIL",
            key,
            category: "unapproved-identical-to-english",
            observed: value,
            source: rel(path),
            evidence: "Identical values require a key-specific brand/code/proper-name approval; language detection alone is not a decision.",
            disposition: "review_required",
          });
        }
        if (locale !== defaultLocale) reviewRows[locale].push({ domain: domain.name, key, source: sourceValue, target: value, automaticStatus: value === sourceValue ? (approvedException(domain.name, key) ? "approved-exception" : "review-identical") : "provided", exceptionId: approvedException(domain.name, key)?.id ?? "" });
      }
    }
    // Object/array shape is compared separately from leaf keys.
    if (domain.name !== "widgets") {
      for (const [key, type] of englishFlat.shapes) {
        if (ownFlat.shapes.has(key) && ownFlat.shapes.get(key) !== type) {
          finding({ locale, domain: domain.name, state: "FAIL", key, category: "container-type-mismatch", observed: ownFlat.shapes.get(key), source: rel(path), evidence: `Expected ${type}` });
        }
      }
    }
    const domainFailure = findings.some((item) => item.target === "local-candidate" && item.locale === locale && item.domain === domain.name && item.state !== "PASS");
    matrix[domain.name][locale] = {
      status: domainFailure ? "FAIL" : "PASS",
      source: englishFlat.leaves.size,
      required: expected.size,
      provided: ownFlat.leaves.size,
      missing: missing.filter((key) => !approvedException(domain.name, key)).length,
      extra: extra.length,
      empty,
      identical,
      exceptions: allowed,
    };
  }
}

function extractConstArrays(path) {
  const source = readText(path);
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const arrays = {};
  const unwrap = (node) => ts.isAsExpression(node) || ts.isSatisfiesExpression(node) ? unwrap(node.expression) : node;
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      const init = unwrap(declaration.initializer);
      if (!ts.isArrayLiteralExpression(init)) continue;
      const values = init.elements.map((element) => unwrap(element)).filter(ts.isStringLiteralLike).map((element) => element.text);
      if (values.length === init.elements.length) arrays[declaration.name.text] = values;
    }
  });
  return arrays;
}

function extractObjectKeys(path, suffix) {
  if (!existsSync(path)) return [];
  const source = readText(path);
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const unwrap = (node) => ts.isAsExpression(node) || ts.isSatisfiesExpression(node) ? unwrap(node.expression) : node;
  const keys = [];
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.name.text.endsWith(suffix) || !declaration.initializer) continue;
      const init = unwrap(declaration.initializer);
      if (!ts.isObjectLiteralExpression(init)) continue;
      for (const property of init.properties) {
        if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) continue;
        const name = property.name;
        if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) keys.push(name.text);
      }
    }
  });
  return keys;
}

function discoverCourses() {
  const courses = [];
  for (const path of walk(join(ROOT, "lib"), (entry) => entry.endsWith(`${sep}types.ts`))) {
    const source = readText(path);
    if (!/_COURSE_ID\s*=/.test(source) || !/_(?:LESSON|MODULE)_SLUGS\s*=/.test(source)) continue;
    const name = posix(relative(join(ROOT, "lib"), dirname(path)));
    const arrays = extractConstArrays(path);
    const pick = (suffix) => Object.entries(arrays).find(([key]) => key.endsWith(suffix))?.[1] ?? [];
    const lessons = pick("_LESSON_SLUGS");
    const modules = pick("_MODULE_SLUGS");
    const routeParam = lessons.length ? "lesson" : "module";
    const loadPath = join(dirname(path), "load.ts");
    const translatedLocales = extractObjectKeys(loadPath, "_COPY_BUNDLES");
    courses.push({
      name,
      path,
      loadPath,
      routeParam,
      units: lessons.length ? lessons : modules,
      lessons,
      modules,
      locales: pick("_LOCALES"),
      translatedLocales,
      quizzes: pick("_QUIZ_IDS"),
      figures: pick("_FIGURE_IDS"),
      practices: pick("_PRACTICE_IDS"),
    });
  }
  return courses;
}

const courses = discoverCourses();
for (const course of courses) {
  const routeRoot = join(ROOT, "app", "[locale]", course.name, "page.tsx");
  const routeUnit = join(ROOT, "app", "[locale]", course.name, `[${course.routeParam}]`, "page.tsx");
  const publishedInSource = existsSync(routeRoot) || existsSync(routeUnit);
  const namespace = domainData.get(course.name);
  if (!publishedInSource && !namespace) {
    finding({ domain: course.name, state: "PASS", category: "staging-course-discovered", source: rel(course.path), disposition: "staging_not_published" });
    continue;
  }
  if (!namespace && !course.translatedLocales.length) {
    finding({ domain: course.name, state: "NOT_ASSESSABLE", category: "published-course-missing-messages", source: rel(course.path) });
    continue;
  }
  if (!publishedInSource && namespace) {
    finding({ domain: course.name, state: "PASS", category: "message-namespace-not-published", source: rel(namespace.englishPath), disposition: "staging_not_published" });
  }
  const compareContract = (field, expected) => {
    const observed = Object.keys(namespace.english?.[field] ?? {});
    const missing = expected.filter((id) => !observed.includes(id));
    const extra = observed.filter((id) => !expected.includes(id));
    if (missing.length || extra.length) finding({
      domain: course.name,
      state: "NOT_ASSESSABLE",
      category: "course-contract-drift",
      key: field,
      observed: `missing=${missing.join(",") || "0"}; extra=${extra.join(",") || "0"}`,
      source: `${rel(course.path)} ↔ ${rel(namespace.englishPath)}`,
      evidence: "The canonical English copy does not match the current course type contract.",
    });
  };
  if (namespace) {
    compareContract(course.routeParam === "module" ? "modules" : "lessons", course.units);
    compareContract("quiz", course.quizzes);
    compareContract("figures", course.figures);
  } else {
    const declaredLocales = course.locales.length ? course.locales : locales;
    const duplicateTranslations = course.translatedLocales.filter((locale, index, values) => values.indexOf(locale) !== index);
    const unknownTranslations = course.translatedLocales.filter((locale) => !declaredLocales.includes(locale));
    const missingShellLocales = locales.filter((locale) => !declaredLocales.includes(locale));
    const extraShellLocales = declaredLocales.filter((locale) => !locales.includes(locale));
    if (missingShellLocales.length || extraShellLocales.length) {
      finding({
        domain: course.name,
        state: "FAIL",
        category: "course-shell-locale-contract-drift",
        observed: `missing=${missingShellLocales.join(",") || "0"}; extra=${extraShellLocales.join(",") || "0"}`,
        source: rel(course.path),
        evidence: "Published course shell locales must match the site locale registry before fallback behavior can be audited.",
      });
    }
    if (!course.translatedLocales.includes(defaultLocale) || duplicateTranslations.length || unknownTranslations.length) {
      finding({
        domain: course.name,
        state: "FAIL",
        category: "typescript-copy-bundle-contract-invalid",
        observed: `translated=${course.translatedLocales.join(",") || "0"}; duplicate=${duplicateTranslations.join(",") || "0"}; unknown=${unknownTranslations.join(",") || "0"}`,
        source: rel(course.loadPath),
        evidence: `A TypeScript copy registry must include ${defaultLocale} exactly once and may advertise only declared course locales.`,
      });
    }
    matrix[course.name] ??= {};
    for (const locale of declaredLocales) {
      const translated = course.translatedLocales.includes(locale);
      const contentLocale = translated ? locale : defaultLocale;
      const copyPath = join(dirname(course.path), "copy", `${contentLocale}.ts`);
      if (!existsSync(copyPath)) {
        finding({ locale, domain: course.name, state: "FAIL", category: "typescript-copy-file-missing", source: rel(copyPath) });
      } else {
        finding({
          locale,
          domain: course.name,
          state: "PASS",
          category: translated ? "typescript-copy-bundle-discovered" : "intentional-content-fallback-declared",
          source: rel(copyPath),
          evidence: translated
            ? `Reviewed ${locale} long-form bundle is registered in ${rel(course.loadPath)}.`
            : `${locale} intentionally serves ${defaultLocale} long-form content and must canonicalize to the ${defaultLocale} sibling.`,
          disposition: translated ? "accepted" : "accepted_explicit_fallback",
        });
      }
      matrix[course.name][locale] = {
        status: existsSync(copyPath) ? "PASS" : "FAIL",
        source: 1,
        required: 1,
        provided: existsSync(copyPath) ? 1 : 0,
        missing: existsSync(copyPath) ? 0 : 1,
        extra: 0,
        empty: 0,
        identical: translated ? 0 : 1,
        exceptions: translated ? 0 : 1,
        contentLocale,
        mode: translated ? "reviewed-translation" : "explicit-fallback",
      };
    }
    for (const routePath of [routeRoot, routeUnit].filter(existsSync)) {
      const routeSource = readText(routePath);
      for (const [category, pattern, evidence] of [
        ["translated-locale-metadata-missing", /availableLocales:\s*[A-Z][A-Z0-9_]*_TRANSLATED_LOCALES/, "Metadata must advertise only reviewed long-form locales."],
        ["content-canonical-metadata-missing", /canonicalLocale:\s*course\.contentLocale/, "Fallback metadata must canonicalize to the materialized content locale."],
      ]) {
        if (!pattern.test(routeSource)) finding({ domain: course.name, state: "FAIL", category, source: rel(routePath), evidence });
      }
    }
    if (course.name === "agent-orchestration") {
      for (const componentPath of [
        join(ROOT, "components", "agent-orchestration", "CourseDashboard.tsx"),
        join(ROOT, "components", "agent-orchestration", "ModuleView.tsx"),
      ]) {
        if (!existsSync(componentPath)) {
          finding({ domain: course.name, state: "FAIL", category: "content-language-wrapper-missing", source: rel(componentPath) });
          continue;
        }
        const componentSource = readText(componentPath);
        for (const [key, token] of [
          ["lang", "lang={course.contentLocale}"],
          ["dir", "dir={course.contentDirection}"],
          ["fallback-condition", "course.locale !== course.contentLocale"],
          ["fallback-notice", "course.copy.meta.translationNote"],
        ]) {
          if (!componentSource.includes(token)) finding({ domain: course.name, state: "FAIL", key, category: "content-language-wrapper-incomplete", source: rel(componentPath), evidence: `Missing ${token}` });
        }
      }
    }
  }

    if (namespace && course.name !== "codex") {
      const englishLeaves = namespace.leaves;
      for (const [key, value] of englishLeaves) {
      if (typeof value !== "string" || !/\b(?:Codex|Course\s*2)\b/i.test(value)) continue;
      if (/^(?:sources?|references?|citations?)(?:\.|$)/i.test(key) || /(?:url|publisher|officialSource|sourceTitle)$/i.test(key)) continue;
      finding({ domain: course.name, locale: "en", state: "FAIL", key, category: "course-clone-leak", observed: value, source: rel(namespace.englishPath), evidence: "Non-reference course copy contains a Codex/Course 2 clone marker." });
      }
    }

  const checker = join(ROOT, "scripts", `check-${course.name}-course.mjs`);
  if (publishedInSource && !existsSync(checker)) {
    finding({ domain: course.name, state: "NOT_ASSESSABLE", category: "course-validator-missing", source: rel(checker) });
  }
}

function runValidator(domain, command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const validatorSource = args.find((arg) => /\.(?:mjs|cjs|js|ts)$/.test(arg)) ?? args[0] ?? command;
  if (result.error) {
    finding({ domain, state: "NOT_ASSESSABLE", category: "validator-execution-failed", observed: result.error.message, source: validatorSource });
    return;
  }
  if (result.status !== 0) {
    const contractStale = /stale|cannot read|could not read|unknown .* route|must be an array|SyntaxError/i.test(output);
    finding({
      domain,
      state: contractStale ? "NOT_ASSESSABLE" : "FAIL",
      category: contractStale ? "validator-contract-stale" : "validator-failed",
      observed: `exit ${result.status}`,
      source: validatorSource,
      evidence: output.slice(-6000),
    });
  } else {
    finding({ domain, state: "PASS", category: "validator-passed", source: validatorSource, evidence: output.slice(-1500) });
  }
  return output;
}

runValidator("handbook", process.execPath, ["scripts/extract-handbook.mjs", "--check"]);
const widgetOutput = runValidator("widgets", process.execPath, ["scripts/check-widgets.mjs"]);
if (widgetOutput) {
  const hardcoded = /([\d,]+)\s+literals?\s*\/\s*([\d,]+)\s+words?/i.exec(widgetOutput);
  if (hardcoded && (Number(hardcoded[1].replaceAll(",", "")) > 0 || Number(hardcoded[2].replaceAll(",", "")) > 0)) {
    finding({ domain: "widgets", state: "FAIL", category: "hardcoded-widget-copy", observed: `${hardcoded[1]} literals / ${hardcoded[2]} words`, source: "lib/handbook/behaviour.ts", evidence: "The development ratchet permits this count; the release gate requires zero." });
  }
  for (const match of widgetOutput.matchAll(/\b(es|fr|de|zh-Hans|zh-Hant|ja|ko|ar)\b[^\n]*?([\d,]+)\s+(?:English\s+)?fallback/gi)) {
    const count = Number(match[2].replaceAll(",", ""));
    if (count > 0) finding({ locale: match[1], domain: "widgets", state: "FAIL", category: "english-fallback-count", observed: count, source: "messages/widgets", evidence: match[0] });
  }
}
for (const course of courses) {
  const checker = join(ROOT, "scripts", `check-${course.name}-course.mjs`);
  const published = existsSync(join(ROOT, "app", "[locale]", course.name, "page.tsx"))
    || existsSync(join(ROOT, "app", "[locale]", course.name, `[${course.routeParam}]`, "page.tsx"));
  if (published && existsSync(checker)) runValidator(course.name, process.execPath, ["--import", "tsx", rel(checker), "--release", "--json"]);
}

function runQualityGate(domain, command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  if (result.error) {
    finding({ domain, state: "NOT_ASSESSABLE", category: `${domain}-execution-failed`, observed: result.error.message, source: [command, ...args].join(" ") });
    return false;
  }
  if (result.status !== 0) {
    finding({
      domain,
      state: domain === "build" || domain === "typescript" ? "NOT_ASSESSABLE" : "FAIL",
      category: `${domain}-failed`,
      observed: `exit ${result.status}`,
      source: [command, ...args].join(" "),
      evidence: output.slice(-12000),
    });
    return false;
  }
  finding({ domain, state: "PASS", category: `${domain}-passed`, source: [command, ...args].join(" "), evidence: output.slice(-1500) });
  return true;
}

if (RELEASE) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  runQualityGate("typescript", process.execPath, [join(ROOT, "node_modules", "typescript", "bin", "tsc"), "--noEmit"]);
  runQualityGate("lint", npm, ["run", "lint"]);
  const buildPassed = runQualityGate("build", npm, ["run", "build"]);
  if (buildPassed) {
    const packageJson = safeJson(join(ROOT, "package.json"), { domain: "regression" });
    const regressionScripts = Object.keys(packageJson?.scripts ?? {}).filter((name) => name.startsWith("test:") && name !== "test:i18n");
    for (const name of regressionScripts) runQualityGate("regression", npm, ["run", name]);
  } else {
    finding({ domain: "regression", state: "NOT_ASSESSABLE", category: "regression-suite-not-run", observed: "production build failed", evidence: "Existing course regression suites run only after a successful production build." });
  }
}

function resolveImport(from, specifier) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;
  const base = specifier.startsWith("@/") ? join(ROOT, specifier.slice(2)) : resolve(dirname(from), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && lstatSync(candidate).isFile()) return candidate;
  }
  return null;
}

function reachableSources() {
  const queue = walk(join(ROOT, "app"), (path) => /\.[jt]sx?$/.test(path));
  const seen = new Set();
  while (queue.length) {
    const path = queue.shift();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const source = readText(path);
    const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    sourceFile.forEachChild(function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
        const resolved = resolveImport(path, node.moduleSpecifier.text);
        if (resolved && !seen.has(resolved)) queue.push(resolved);
      }
      ts.forEachChild(node, visit);
    });
  }
  return [...seen].sort();
}

const visibleAttributes = new Set(["aria-label", "aria-description", "title", "placeholder", "alt", "label", "caption"]);
const naturalLanguage = (text) => /\p{L}/u.test(text) && text.trim().length >= 2;
function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}
function literalText(node) {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxExpression(node) && node.expression && (ts.isStringLiteralLike(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression))) return node.expression.text;
  return null;
}

const reachable = reachableSources();
const reachableText = reachable.map((path) => readText(path)).join("\n");
for (const path of reachable) {
  if (!/^(?:app\/\[locale\]|components\/)/.test(rel(path))) continue;
  const source = readText(path);
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    let text = null;
    let category = null;
    if (ts.isJsxText(node) && naturalLanguage(node.text.trim())) {
      text = node.text.trim().replace(/\s+/g, " ");
      category = "hardcoded-jsx-text";
    } else if (ts.isJsxAttribute(node) && visibleAttributes.has(node.name.getText(sourceFile))) {
      text = node.initializer ? literalText(node.initializer) : null;
      category = text && naturalLanguage(text) ? "hardcoded-visible-attribute" : null;
    } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["alert", "confirm", "prompt"].includes(node.expression.text)) {
      text = node.arguments[0] ? literalText(node.arguments[0]) : null;
      category = text && naturalLanguage(text) ? "hardcoded-dialog-copy" : null;
    } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && ["textContent", "innerHTML"].includes(node.left.name.text)) {
      text = literalText(node.right);
      category = text && naturalLanguage(text) ? "hardcoded-imperative-copy" : null;
    }
    if (category && text) finding({ domain: "source", state: "FAIL", category, observed: text, source: `${rel(path)}:${lineOf(sourceFile, node)}`, evidence: "Reachable user-visible literal must use a locale dictionary or a narrow approved exception." });
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

const mainMessages = domainData.get("main");
if (mainMessages) {
  const referenced = new Set();
  for (const match of reachableText.matchAll(/\b(?:t|translator)\s*\(\s*["']([A-Za-z0-9_.-]+)["']/g)) {
    const key = match[1];
    referenced.add(key);
    // Handbook widget references (w.*) have dynamic prefixes/plural stems and
    // are exhaustively validated by check-widgets.mjs above.
    if (!key.startsWith("w.") && key.includes(".") && !mainMessages.leaves.has(key)) finding({ domain: "main", state: "FAIL", key, category: "source-reference-missing-key", source: "reachable app/component import graph" });
  }
  for (const match of reachableText.matchAll(/data-i18n=["']([^"']+)["']/g)) referenced.add(match[1]);
  for (const key of mainMessages.leaves.keys()) {
    if (referenced.has(key) || reachableText.includes(JSON.stringify(key)) || reachableText.includes(`'${key}'`)) continue;
    finding({ domain: "main", state: "FAIL", key, category: "message-key-without-caller", source: "messages/en.json", evidence: "No literal caller was found in the current app/component import graph; reserve it explicitly or remove it." });
  }
}

const handbookMarkup = join(ROOT, "lib", "handbook", "markup.ts");
if (existsSync(handbookMarkup)) {
  const source = readText(handbookMarkup);
  const evaluated = vm.runInNewContext(
    `${source.replace(/^\s*export default MARKUP;\s*$/m, "")}\nMARKUP`,
    Object.create(null),
    { filename: handbookMarkup },
  );
  const localisedAttributes = new Set(
    walkHandbook(evaluated).filter((segment) => segment.kind === "attr").map((segment) => segment.text),
  );
  for (const match of evaluated.matchAll(/\b(aria-label|aria-description|title|placeholder|alt)=(?:"([^"]*)"|'([^']*)')/gi)) {
    const value = match[2] ?? match[3];
    if (!naturalLanguage(value)) continue;
    /* The markup remains the English source of truth, just as it does for
       body text. An attribute registered by segments.mjs is replaced from
       messages/handbook/<locale>.json before export and is therefore not a
       hard-coded-English escape hatch. */
    if (localisedAttributes.has(value)) continue;
    finding({ domain: "handbook", state: "FAIL", category: "untranslated-handbook-attribute", key: match[1], observed: value, source: "lib/handbook/markup.ts" });
  }
}

const seoSource = existsSync(join(ROOT, "lib", "seo.ts")) ? readText(join(ROOT, "lib", "seo.ts")) : "";
if (/\/docs\/og-card\.png/.test(seoSource)) {
  finding({ domain: "seo-media", state: "FAIL", category: "shared-english-og-image", observed: "/docs/og-card.png", source: "lib/seo.ts", evidence: "A shared site-owned card is not a product screenshot exception; localized text or a text-free approved asset is required." });
}

const publicFiles = walk(join(ROOT, "public"));
const downloadable = publicFiles.filter((path) => /\.(?:zip|pdf|docx|pptx|xlsx|csv|txt|md)$/i.test(path));
for (const path of downloadable) finding({ domain: "downloads", state: "NOT_ASSESSABLE", category: "download-learner-copy-review-pending", source: rel(path), evidence: "Public download instructions and embedded learner-facing copy require locale review or a narrow technical-artifact exception." });
for (const path of publicFiles.filter((entry) => entry.endsWith(".svg"))) {
  const source = readText(path);
  for (const match of source.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)) {
    const text = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (naturalLanguage(text)) finding({ domain: "seo-media", state: "FAIL", category: "hardcoded-svg-text", observed: text, source: rel(path) });
  }
}
const rasterMedia = publicFiles.filter((path) => /\.(?:png|jpe?g|webp|gif|avif)$/i.test(path));
if (rasterMedia.length) finding({ domain: "seo-media", state: "NOT_ASSESSABLE", category: "raster-image-text-review-pending", observed: rasterMedia.length, source: "public/", evidence: "Binary image text cannot be cleared by key parity; OCR or human image review must be bound to this snapshot." });

for (const required of ["app/[locale]/not-found.tsx", "app/[locale]/error.tsx", "app/global-error.tsx"]) {
  if (!existsSync(join(ROOT, required))) finding({ domain: "error-surfaces", state: "NOT_ASSESSABLE", category: "localized-error-surface-missing", source: required, evidence: "Unknown locale/lesson, 404 and runtime error copy cannot be declared localized without an explicit surface." });
}

function routePattern(path) {
  const directory = rel(dirname(path)).replace(/^app\/?/, "");
  if (!directory) return "/";
  return `/${directory}/`.replace(/\/+/g, "/");
}
const routePatterns = walk(join(ROOT, "app"), (path) => path.endsWith(`${sep}page.tsx`)).map(routePattern).sort();

const courseMap = new Map(courses.map((course) => [course.name, course]));
const expectedRoutes = new Set(["/"]);
const expectedSitemapRoutes = new Set();
const courseForPattern = (pattern) => {
  const courseName = pattern.split("/").find((part) => part && !part.startsWith("["));
  return courseName ? courseMap.get(courseName) : undefined;
};
const indexableLocalesFor = (course) => course?.translatedLocales?.length ? course.translatedLocales : locales;
for (const pattern of routePatterns) {
  if (!pattern.includes("[locale]")) continue;
  const course = courseForPattern(pattern);
  const dynamicSegments = [...pattern.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]).filter((name) => name !== "locale");
  for (const locale of locales) {
    const addRoute = (route) => {
      expectedRoutes.add(route);
      if (indexableLocalesFor(course).includes(locale)) expectedSitemapRoutes.add(route);
    };
    if (!dynamicSegments.length) addRoute(pattern.replace("[locale]", locale));
    else if (dynamicSegments.length === 1) {
      if (!course) {
        finding({ domain: "routes", route: pattern, state: "NOT_ASSESSABLE", category: "dynamic-route-params-undiscoverable", source: "app/**/page.tsx" });
      } else if (dynamicSegments[0] !== course.routeParam) {
        finding({ domain: course.name, route: pattern, state: "NOT_ASSESSABLE", category: "dynamic-route-contract-mismatch", observed: dynamicSegments[0], source: `${rel(course.path)} ↔ app/**/page.tsx`, evidence: `Expected [${course.routeParam}] from the discovered course contract.` });
      } else for (const unit of course.units) addRoute(pattern.replace("[locale]", locale).replace(`[${course.routeParam}]`, unit));
    } else {
      finding({ domain: "routes", route: pattern, state: "NOT_ASSESSABLE", category: "multi-dynamic-route-params-undiscoverable", observed: dynamicSegments.join(","), source: "app/**/page.tsx" });
    }
  }
}

function htmlRoute(path) {
  const relativePath = posix(relative(join(ROOT, "out"), path));
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) return `/${relativePath.slice(0, -"index.html".length)}`;
  return `/${relativePath}`;
}
const outHtml = walk(join(ROOT, "out"), (path) => extname(path) === ".html");
const outRoutes = new Map(outHtml.map((path) => [htmlRoute(path), path]));
if (!outHtml.length) {
  finding({ domain: "build", state: "NOT_ASSESSABLE", category: "static-export-missing", source: "out/", evidence: "Run npm run build on the frozen candidate before release audit." });
} else {
  const sourceInputs = startSnapshot.files.filter((file) => /^(?:app|components|lib|messages|public)\//.test(file.path)).map((file) => join(ROOT, file.path)).filter(existsSync);
  const newestSource = Math.max(...sourceInputs.map((path) => statSync(path).mtimeMs));
  const newestHtml = Math.max(...outHtml.map((path) => statSync(path).mtimeMs));
  if (newestSource > newestHtml) finding({ domain: "build", state: "NOT_ASSESSABLE", category: "static-export-stale", observed: `source=${new Date(newestSource).toISOString()} out=${new Date(newestHtml).toISOString()}`, source: "out/" });
  for (const route of expectedRoutes) if (!outRoutes.has(route)) finding({ domain: "routes", route, state: "NOT_ASSESSABLE", category: "expected-route-missing-from-export", source: "app routes + course contracts ↔ out/" });
  for (const route of outRoutes.keys()) {
    if (route === "/404.html" || route === "/404/") continue;
    if (!expectedRoutes.has(route)) finding({ domain: "routes", route, state: "FAIL", category: "unexpected-exported-route", source: "out/" });
  }
}

function extractSeoPages() {
  const arrays = extractConstArrays(join(ROOT, "lib", "seo.ts"));
  const source = seoSource;
  const match = /export\s+const\s+PAGES\s*=\s*\[([\s\S]*?)\]\s*as\s+const/.exec(source);
  if (!match) return [];
  const pages = [...match[1].matchAll(/["']([^"']*)["']/g)].map((item) => item[1]);
  for (const spread of match[1].matchAll(/\.\.\.([A-Za-z_$][\w$]*)/g)) pages.push(...(arrays[spread[1]] ?? []));
  return [...new Set(pages)];
}
const seoPages = extractSeoPages();
const expectedFamilies = new Set([...expectedRoutes].filter((route) => route !== "/").map((route) => route.replace(/^\/(?:en|es|fr|de|zh-Hans|zh-Hant|ja|ko|ar)\//, "")));
for (const family of expectedFamilies) if (!seoPages.includes(family)) finding({ domain: "seo", route: family, state: "FAIL", category: "route-missing-from-seo-pages", source: "lib/seo.ts" });

const sitemapPath = join(ROOT, "out", "sitemap.xml");
if (outHtml.length && !existsSync(sitemapPath)) {
  finding({ domain: "seo", state: "NOT_ASSESSABLE", category: "sitemap-missing", source: "out/sitemap.xml" });
} else if (existsSync(sitemapPath)) {
  const sitemap = readText(sitemapPath);
  const sitemapRoutes = new Set([...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((match) => match[1] || "/"));
  for (const route of expectedSitemapRoutes) if (!sitemapRoutes.has(route)) finding({ domain: "seo", route, state: "FAIL", category: "route-missing-from-sitemap", source: "out/sitemap.xml" });
}

function stripHtml(html) {
  return html
    .replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos);/g, " ")
    .replace(/&#(?:x[0-9a-f]+|\d+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagAttribute(tag, name) {
  return new RegExp(`\\b${name}=["']([^"']*)`, "i").exec(tag)?.[1] ?? "";
}

const configuredSite = /export\s+const\s+SITE\s*=\s*["']([^"']+)/.exec(seoSource)?.[1]?.replace(/\/$/, "") ?? "https://aicourse.top";

function coursePolicyForRoute(route) {
  const [, routeLocale = "", courseName = ""] = /^\/([^/]+)\/([^/]+)\//.exec(route) ?? [];
  const course = courseMap.get(courseName);
  if (!course?.translatedLocales.length) return null;
  const contentLocale = course.translatedLocales.includes(routeLocale) ? routeLocale : defaultLocale;
  return {
    course,
    routeLocale,
    contentLocale,
    canonicalRoute: route.replace(`/${routeLocale}/`, `/${contentLocale}/`),
    hreflangLocales: course.translatedLocales,
  };
}

for (const [route, path] of outRoutes) {
  const locale = route.split("/")[1];
  if (!locales.includes(locale)) continue;
  const html = readText(path);
  const coursePolicy = coursePolicyForRoute(route);
  const expectedContentLocale = coursePolicy?.contentLocale ?? locale;
  const expectedCanonicalRoute = coursePolicy?.canonicalRoute ?? route;
  const expectedHreflangLocales = coursePolicy?.hreflangLocales ?? locales;
  const expectedDir = localeMeta.find((item) => item.code === locale)?.dir ?? "ltr";
  const lang = /<html\b[^>]*\blang=["']([^"']+)/i.exec(html)?.[1] ?? "";
  const dir = /<html\b[^>]*\bdir=["']([^"']+)/i.exec(html)?.[1] ?? "";
  if (lang !== locale) finding({ locale, domain: "rendered-html", route, state: "FAIL", category: "html-lang-mismatch", observed: lang, source: rel(path), evidence: `Expected ${locale}` });
  if (dir !== expectedDir) finding({ locale, domain: "rendered-html", route, state: "FAIL", category: "html-dir-mismatch", observed: dir, source: rel(path), evidence: `Expected ${expectedDir}` });
  if (!/<title>[^<]+<\/title>/i.test(html)) finding({ locale, domain: "seo", route, state: "FAIL", category: "empty-title", source: rel(path) });
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const canonicalTag = linkTags.find((tag) => tagAttribute(tag, "rel").split(/\s+/).includes("canonical"));
  const canonical = canonicalTag ? tagAttribute(canonicalTag, "href") : "";
  if (!canonical) finding({ locale, domain: "seo", route, state: "FAIL", category: "canonical-missing", source: rel(path) });
  else if (canonical !== `${configuredSite}${expectedCanonicalRoute}`) finding({ locale, domain: "seo", route, state: "FAIL", category: "canonical-mismatch", observed: canonical, source: rel(path), evidence: `Expected ${configuredSite}${expectedCanonicalRoute}` });
  const alternateTags = linkTags.filter((tag) => tagAttribute(tag, "rel").split(/\s+/).includes("alternate") && tagAttribute(tag, "hreflang"));
  const hreflangs = new Map(alternateTags.map((tag) => [tagAttribute(tag, "hreflang"), tagAttribute(tag, "href")]));
  const requiredHreflangs = [...expectedHreflangLocales, "x-default"];
  for (const required of requiredHreflangs) {
    const observed = hreflangs.get(required);
    const targetLocale = required === "x-default" ? defaultLocale : required;
    const expected = `${configuredSite}${route.replace(`/${locale}/`, `/${targetLocale}/`)}`;
    if (!observed) finding({ locale, domain: "seo", route, state: "FAIL", key: required, category: "hreflang-missing", source: rel(path) });
    else if (observed !== expected) finding({ locale, domain: "seo", route, state: "FAIL", key: required, category: "hreflang-target-mismatch", observed, source: rel(path), evidence: `Expected ${expected}` });
  }
  if (coursePolicy) {
    for (const observed of hreflangs.keys()) if (!requiredHreflangs.includes(observed)) finding({ locale, domain: "seo", route, state: "FAIL", key: observed, category: "unreviewed-course-hreflang-advertised", source: rel(path), evidence: `Only reviewed long-form locales may be advertised: ${expectedHreflangLocales.join(", ")}.` });
  }
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const metaValue = (attribute, name) => {
    const tag = metaTags.find((candidate) => tagAttribute(candidate, attribute) === name);
    return tag ? tagAttribute(tag, "content") : "";
  };
  for (const [attribute, name] of [["property", "og:title"], ["property", "og:description"], ["property", "og:url"], ["name", "twitter:card"]]) {
    if (!metaValue(attribute, name)) finding({ locale, domain: "seo", route, state: "FAIL", key: name, category: "social-metadata-missing", source: rel(path) });
  }
  const ogUrl = metaValue("property", "og:url");
  if (ogUrl && ogUrl !== canonical) finding({ locale, domain: "seo", route, state: "FAIL", key: "og:url", category: "social-url-mismatch", observed: ogUrl, source: rel(path), evidence: `Canonical ${canonical}` });
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(match[1]);
      const languages = [];
      const collect = (item) => {
        if (!item || typeof item !== "object") return;
        if (typeof item.inLanguage === "string") languages.push(item.inLanguage);
        for (const child of Object.values(item)) collect(child);
      };
      collect(value);
      for (const observed of languages) if (observed !== expectedContentLocale) finding({ locale, domain: "seo", route, state: "FAIL", key: "inLanguage", category: "json-ld-language-mismatch", observed, source: rel(path), evidence: `Expected materialized content locale ${expectedContentLocale}` });
    } catch (error) {
      finding({ locale, domain: "seo", route, state: "FAIL", category: "invalid-json-ld", observed: error instanceof Error ? error.message : String(error), source: rel(path) });
    }
  }
  const visible = stripHtml(html);
  const rawKey = visible.match(/\b(?:ui|nav|course|hb|w)\.[A-Za-z0-9_.-]{2,}\b/)?.[0] ?? "";
  const auditableMarkup = html.replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1>/gi, " ");
  const serializedEmpty = />\s*(?:<!--[^]*?-->\s*)*(undefined|null)\s*(?:<!--[^]*?-->\s*)*</i.exec(auditableMarkup)?.[1] ?? "";
  if (rawKey || serializedEmpty) finding({ locale, domain: "rendered-html", route, state: "FAIL", category: "raw-key-or-undefined", observed: rawKey || serializedEmpty, source: rel(path) });
  if (expectedContentLocale !== defaultLocale) {
    const suspicious = visible.match(/(?:\b[A-Za-z][A-Za-z'-]*\b[\s,.:;!?—–-]*){8,}/g) ?? [];
    for (const excerpt of suspicious.slice(0, 5)) finding({ locale, domain: "rendered-html", route, state: "FAIL", category: "suspected-english-leak", observed: excerpt.trim().slice(0, 300), source: rel(path), evidence: "Heuristic only: approve a narrow exception or confirm and translate in rendered context.", disposition: "review_required" });
  }
}

const reviewDocument = safeJson(join(ROOT, "i18n-reviews.json"), { domain: "human-review" }) ?? { locales: {} };
for (const locale of targetLocales) {
  const review = reviewDocument.locales?.[locale];
  const approved = review?.status === "approved" && review?.snapshotId === snapshotId && String(review?.reviewer ?? "").trim() && String(review?.reviewedAt ?? "").trim();
  if (!approved) finding({ locale, domain: "human-review", state: "NOT_ASSESSABLE", category: "native-review-pending-or-stale", observed: review?.status ?? "missing", source: "i18n-reviews.json", evidence: `Approval must name a reviewer/date and bind to snapshot ${snapshotId}.`, reviewer: review?.reviewer ?? "" });
  else finding({ locale, domain: "human-review", state: "PASS", category: "native-review-approved", source: "i18n-reviews.json", reviewer: review.reviewer, evidence: review.reviewedAt });
}

const browserReportPath = join(PLAYWRIGHT_DIR, "browser-report.json");
if (!existsSync(browserReportPath)) {
  finding({ domain: "browser", state: "NOT_ASSESSABLE", category: "browser-evidence-missing", source: rel(browserReportPath), evidence: `Run npm run i18n:audit:browser -- --snapshot-id=${snapshotId} after a fresh build.` });
} else {
  const browserReport = safeJson(browserReportPath, { domain: "browser" });
  if (!browserReport || browserReport.snapshotId !== snapshotId || browserReport.status !== "PASS") finding({ domain: "browser", state: "NOT_ASSESSABLE", category: "browser-evidence-failed-or-stale", observed: browserReport?.status ?? "invalid", source: rel(browserReportPath) });
  else finding({ domain: "browser", state: "PASS", category: "browser-evidence-passed", source: rel(browserReportPath) });
}

const artifactFiles = walk(join(ROOT, "out"));
const artifactManifest = artifactFiles.map((path) => ({ path: posix(relative(join(ROOT, "out"), path)), bytes: statSync(path).size, sha256: sha256(readFileSync(path)) }));
const artifactHash = sha256(JSON.stringify(artifactManifest));

async function fetchWithTimeout(url, timeout = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "user-agent": "aicourse-i18n-release-audit/1.0" } });
  } finally {
    clearTimeout(timer);
  }
}

async function productionAudit() {
  if (!PRODUCTION) {
    finding({ target: "production", domain: "production", state: "NOT_ASSESSABLE", category: "production-not-audited", evidence: "Run npm run i18n:audit:production only after the identical local artifact passes." });
    return;
  }
  const unresolvedLocal = findings.some((item) => item.target === "local-candidate" && item.state !== "PASS");
  if (unresolvedLocal) {
    finding({ target: "production", domain: "production", state: "NOT_ASSESSABLE", category: "local-release-precondition-failed", evidence: "Production parity is intentionally not promoted or fully fetched until the exact local candidate passes every earlier gate." });
    return;
  }
  if (!outHtml.length) {
    finding({ target: "production", domain: "production", state: "NOT_ASSESSABLE", category: "local-artifact-unavailable", source: "out/" });
    return;
  }
  try {
    const sitemapResponse = await fetchWithTimeout(`${PRODUCTION}/sitemap.xml`);
    if (!sitemapResponse.ok) finding({ target: "production", domain: "production", route: "/sitemap.xml", state: "FAIL", category: "production-sitemap-http-error", observed: sitemapResponse.status, source: `${PRODUCTION}/sitemap.xml` });
    else {
      const sitemap = await sitemapResponse.text();
      const liveRoutes = new Set([...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((match) => match[1] || "/"));
      for (const route of expectedSitemapRoutes) if (!liveRoutes.has(route)) finding({ target: "production", domain: "production", route, state: "FAIL", category: "production-route-missing-from-sitemap", source: `${PRODUCTION}/sitemap.xml` });
      for (const route of liveRoutes) if (!expectedSitemapRoutes.has(route)) finding({ target: "production", domain: "production", route, state: "FAIL", category: "production-sitemap-route-not-in-candidate", source: `${PRODUCTION}/sitemap.xml` });
    }
  } catch (error) {
    finding({ target: "production", domain: "production", route: "/sitemap.xml", state: "NOT_ASSESSABLE", category: "production-sitemap-fetch-failed", observed: error instanceof Error ? error.message : String(error), source: `${PRODUCTION}/sitemap.xml` });
  }
  const entries = [
    ...[...outRoutes].filter(([route]) => route !== "/404.html").map(([route, path]) => ({ urlPath: route, localPath: path, kind: "html" })),
    ...artifactFiles.filter((path) => extname(path) !== ".html").map((path) => ({ urlPath: `/${posix(relative(join(ROOT, "out"), path))}`, localPath: path, kind: "asset" })),
  ];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(6, entries.length) }, async () => {
    while (cursor < entries.length) {
      const { urlPath, localPath, kind } = entries[cursor++];
      const locale = urlPath.split("/")[1] || "*";
      try {
        const response = await fetchWithTimeout(`${PRODUCTION}${urlPath}`);
        const body = Buffer.from(await response.arrayBuffer());
        if (!response.ok) finding({ target: "production", locale, domain: "production", route: urlPath, state: "FAIL", category: "production-http-error", observed: response.status, source: `${PRODUCTION}${urlPath}` });
        else if (sha256(body) !== sha256(readFileSync(localPath))) finding({ target: "production", locale, domain: "production", route: urlPath, state: "FAIL", category: kind === "html" ? "artifact-html-hash-mismatch" : "artifact-asset-hash-mismatch", observed: sha256(body), source: `${PRODUCTION}${urlPath}`, evidence: `Local ${sha256(readFileSync(localPath))}` });
      } catch (error) {
        finding({ target: "production", locale, domain: "production", route: urlPath, state: "NOT_ASSESSABLE", category: "production-fetch-failed", observed: error instanceof Error ? error.message : String(error), source: `${PRODUCTION}${urlPath}` });
      }
    }
  });
  await Promise.all(workers);
}
await productionAudit();

const endSnapshot = inputSnapshot();
if (startSnapshot.hash !== endSnapshot.hash || startSnapshot.stagedDiffHash !== endSnapshot.stagedDiffHash || startSnapshot.unstagedDiffHash !== endSnapshot.unstagedDiffHash) {
  finding({ state: "NOT_ASSESSABLE", domain: "snapshot", category: "workspace-drift-during-audit", observed: `start=${startSnapshot.hash} end=${endSnapshot.hash}`, evidence: "The audit is invalid because an input file was added, removed, or changed while it ran." });
}

const statusFor = (items) => items.some((item) => item.state === "NOT_ASSESSABLE") ? "NOT_ASSESSABLE" : items.some((item) => item.state === "FAIL") ? "FAIL" : "PASS";
const localStatus = statusFor(findings.filter((item) => item.target === "local-candidate"));
const productionStatus = statusFor(findings.filter((item) => item.target === "production"));
const globalStatus = localStatus === "PASS" && productionStatus === "PASS" ? "PASS" : (localStatus === "NOT_ASSESSABLE" || productionStatus === "NOT_ASSESSABLE" ? "NOT_ASSESSABLE" : "FAIL");
const counts = Object.fromEntries(["PASS", "FAIL", "NOT_ASSESSABLE"].map((state) => [state, findings.filter((item) => item.state === state).length]));

for (const locale of targetLocales) {
  const rows = reviewRows[locale] ?? [];
  const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["snapshot_id", "locale", "domain", "key", "source", "target", "automatic_status", "exception_id", "reviewer", "reviewed_at", "decision", "comment"];
  const csv = [header.map(csvEscape).join(","), ...rows.map((row) => [snapshotId, locale, row.domain, row.key, row.source, row.target, row.automaticStatus, row.exceptionId, "", "", "", ""].map(csvEscape).join(","))].join("\n") + "\n";
  atomicWrite(join(AUDIT_DIR, `review-${locale}.csv`), csv);
}
atomicWrite(join(AUDIT_DIR, "artifact-sha256.json"), JSON.stringify({ snapshotId, artifactHash, files: artifactManifest }, null, 2) + "\n");

const report = {
  schemaVersion: 1,
  snapshotId,
  startedAt,
  finishedAt: new Date().toISOString(),
  releaseMode: RELEASE,
  status: globalStatus,
  releaseReady: globalStatus === "PASS",
  targets: { "local-candidate": localStatus, production: productionStatus },
  git: { commit, branch, dirty: startSnapshot.stagedDiffHash !== sha256("") || startSnapshot.unstagedDiffHash !== sha256("") || startSnapshot.untracked.length > 0, stagedDiffHash: startSnapshot.stagedDiffHash, unstagedDiffHash: startSnapshot.unstagedDiffHash, untracked: startSnapshot.untracked },
  inputManifest: { startHash: startSnapshot.hash, endHash: endSnapshot.hash, contentHash },
  discovered: {
    locales: localeMeta,
    domains: domains.map((domain) => domain.name),
    courses: courses.map((course) => ({
      name: course.name,
      routeParam: course.routeParam,
      units: course.units.length,
      lessons: course.lessons.length,
      modules: course.modules.length,
      translatedLocales: course.translatedLocales,
      quizzes: course.quizzes.length,
      figures: course.figures.length,
      practices: course.practices.length,
    })),
    routePatterns,
    expectedRoutes: [...expectedRoutes].sort(),
    expectedSitemapRoutes: [...expectedSitemapRoutes].sort(),
    exportedRoutes: [...outRoutes.keys()].sort(),
    seoPages,
  },
  artifact: { root: "out/", hash: artifactHash, fileCount: artifactManifest.length },
  counts,
  matrix,
  findings,
};
atomicWrite(join(AUDIT_DIR, "report.json"), JSON.stringify(report, null, 2) + "\n");

const blockers = findings.filter((item) => item.state !== "PASS");
const summary = [
  "# Translation release audit",
  "",
  `- Snapshot: \`${snapshotId}\``,
  `- Global status: **${globalStatus}**`,
  `- Local candidate: **${localStatus}**`,
  `- Production: **${productionStatus}**`,
  `- Findings: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.NOT_ASSESSABLE} NOT_ASSESSABLE`,
  `- Artifact: \`${artifactHash}\` (${artifactManifest.length} files)`,
  "",
  "## Locale × subsystem matrix",
  "",
  "| Domain | Locale | Status | Required | Provided | Missing | Extra | Empty | Identical | Exceptions |",
  "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...Object.entries(matrix).flatMap(([domain, entries]) => Object.entries(entries).map(([locale, value]) => `| ${domain} | ${locale} | ${value.status} | ${value.required} | ${value.provided} | ${value.missing} | ${value.extra} | ${value.empty} | ${value.identical} | ${value.exceptions} |`)),
  "",
  "## Blocking findings",
  "",
  ...(blockers.length ? blockers.slice(0, 500).map((item) => `- [${item.state}] ${item.target} / ${item.locale} / ${item.domain} / ${item.category}${item.route ? ` / ${item.route}` : ""}${item.key ? ` / ${item.key}` : ""}: ${String(item.observed).replace(/\s+/g, " ").slice(0, 240)}`) : ["- None."]),
  blockers.length > 500 ? `- … ${blockers.length - 500} additional findings are in report.json.` : "",
  "",
  globalStatus === "PASS" ? "The exact local artifact and production target passed all automated and signed human gates." : "Do not claim that all translations are complete. The release remains NOT READY.",
  "",
].join("\n");
atomicWrite(join(AUDIT_DIR, "summary.md"), summary);

const stdout = { status: globalStatus, releaseReady: globalStatus === "PASS", snapshotId, targets: report.targets, counts, reportPath: rel(join(AUDIT_DIR, "report.json")), summaryPath: rel(join(AUDIT_DIR, "summary.md")), browserEvidencePath: rel(browserReportPath), artifactHash };
if (JSON_ONLY) process.stdout.write(`${JSON.stringify(stdout)}\n`);
else {
  process.stdout.write(`i18n release audit: ${globalStatus}\n`);
  process.stdout.write(`snapshot: ${snapshotId}\n`);
  process.stdout.write(`local-candidate=${localStatus} production=${productionStatus}\n`);
  process.stdout.write(`report: ${stdout.reportPath}\n`);
  process.stdout.write(`summary: ${stdout.summaryPath}\n`);
}
process.exitCode = globalStatus === "PASS" ? 0 : 1;
