#!/usr/bin/env node

/**
 * Offline release gate for Course 11, "How to make money with Codex".
 *
 * This check validates the static curriculum contract, evidence references,
 * local figure bytes, release integration, and high-risk wording. It does not
 * fetch remote URLs, establish copyright permission, or audit a source's
 * underlying business result.
 *
 * Usage:
 *   node scripts/check-make-money-with-codex-course.mjs
 *   node scripts/check-make-money-with-codex-course.mjs --release
 *   node scripts/check-make-money-with-codex-course.mjs --json
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { publishedReleaseIntegrationErrors } from "./lib/published-release-contract.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");

const TYPES_PATH = "lib/make-money-with-codex/types.ts";
const SOURCES_PATH = "lib/make-money-with-codex/sources.ts";
const FIGURES_PATH = "lib/make-money-with-codex/figures.ts";
const DATA_PATH = "lib/make-money-with-codex/data.ts";
const ECONOMICS_PATH = "lib/make-money-with-codex/economics.ts";
const NOTICE_PATH = "public/courses/make-money-with-codex/NOTICE.md";
const UPSTREAM_LICENSE_PATH = "public/courses/make-money-with-codex/licenses/openai-codex-343074d-LICENSE.txt";
const UPSTREAM_NOTICE_PATH = "public/courses/make-money-with-codex/licenses/openai-codex-343074d-NOTICE.txt";
const RESEARCH_PATH = "evidence/course-audits/make-money-with-codex/research-brief.md";
const PROVENANCE_PATH = "evidence/course-audits/make-money-with-codex/figure-provenance.md";
const CLI_TRANSCRIPT_PATH = "evidence/course-audits/make-money-with-codex/first-party-captures/fig-04-cli-transcript.txt";
const FIGURE_FIXTURE_PATH = "evidence/course-audits/make-money-with-codex/first-party-captures/figure-fixture.html";
const TRANSLATION_READINESS_PATH = "evidence/course-audits/make-money-with-codex/translation-readiness.md";

const EXPECTED_LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const EXPECTED_LESSONS = [
  "money-not-magic",
  "choose-market-wedge",
  "validate-before-building",
  "write-commercial-spec",
  "protect-client-work",
  "build-verified-pilot",
  "price-for-margin",
  "sell-with-proof",
  "deliver-with-control",
  "productize-reuse",
  "retain-and-automate",
  "launch-capstone",
];
const EXPECTED_QUIZZES = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12"];
const EXPECTED_FIGURES = ["fig-1", "fig-2", "fig-3", "fig-4", "fig-5", "fig-6", "fig-7", "fig-8", "fig-9"];
const EXPECTED_EVIDENCE_CLASSES = [
  "commercial-signal",
  "paid-offer",
  "business-process",
  "official-workflow",
  "scope-exclusion",
];
const EXPECTED_UNIT_IDS = ["value", "pilot", "sell", "scale"];
const EXPECTED_LOCALIZED_UI_KEYS = [
  "course",
  "courses",
  "courseOutline",
  "lesson",
  "lessons",
  "minutes",
  "guidedWork",
  "authenticUi",
  "evidenceVerified",
  "startCourse",
  "inspectLessons",
  "curriculum",
  "time",
  "output",
  "evidence",
  "boundedSources",
  "previous",
  "next",
  "courseDashboard",
  "reviewEvidencePath",
  "backToCatalog",
  "resetConfirm",
];
const EXPECTED_SURFACES = {
  "fig-1": "codex-app",
  "fig-2": "codex-app",
  "fig-3": "codex-cli",
  "fig-4": "codex-cli",
  "fig-5": "product-output",
  "fig-6": "product-output",
  "fig-7": "product-output",
  "fig-8": "repository-handoff",
  "fig-9": "repository-handoff",
};

const errors = [];
const warnings = [];
const notes = [];
const parsedFiles = new Map();

function fail(message) {
  errors.push(message);
}

function note(message) {
  notes.push(message);
}

function rel(path) {
  return relative(ROOT, path).split(sep).join("/");
}

function absolute(relativePath) {
  return resolve(ROOT, relativePath);
}

function readText(relativePath, required = true) {
  const path = absolute(relativePath);
  if (!existsSync(path)) {
    if (required) fail(`Missing ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function markdownLevelTwoSection(text, heading) {
  const lines = text.split(/\r?\n/);
  const marker = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start < 0) return "";
  const next = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  return lines.slice(start + 1, next < 0 ? undefined : next).join("\n").trim();
}

function parse(relativePath) {
  if (parsedFiles.has(relativePath)) return parsedFiles.get(relativePath);
  const text = readText(relativePath);
  if (!text) return null;
  const sourceFile = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const diagnostics = sourceFile.parseDiagnostics ?? [];
  for (const diagnostic of diagnostics) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    fail(`${relativePath}: TypeScript parse error: ${message}`);
  }
  const declarations = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        declarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  const parsed = { text, sourceFile, declarations, cache: new Map() };
  parsedFiles.set(relativePath, parsed);
  return parsed;
}

function unwrap(node) {
  let current = node;
  while (
    current && (
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isNonNullExpression(current)
    )
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  if (ts.isComputedPropertyName(node)) return undefined;
  return node.getText();
}

function evaluate(node, parsed, stack = []) {
  const valueNode = unwrap(node);
  if (!valueNode) throw new Error("missing value");

  if (ts.isStringLiteral(valueNode) || ts.isNoSubstitutionTemplateLiteral(valueNode)) {
    return valueNode.text;
  }
  if (ts.isNumericLiteral(valueNode)) return Number(valueNode.text);
  if (valueNode.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (valueNode.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (valueNode.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(valueNode) && valueNode.operator === ts.SyntaxKind.MinusToken) {
    return -Number(evaluate(valueNode.operand, parsed, stack));
  }
  if (ts.isTemplateExpression(valueNode)) {
    let result = valueNode.head.text;
    for (const span of valueNode.templateSpans) {
      result += String(evaluate(span.expression, parsed, stack));
      result += span.literal.text;
    }
    return result;
  }
  if (ts.isIdentifier(valueNode)) {
    if (valueNode.text === "undefined") return undefined;
    if (parsed.cache.has(valueNode.text)) return parsed.cache.get(valueNode.text);
    const initializer = parsed.declarations.get(valueNode.text);
    if (!initializer) throw new Error(`unresolved identifier ${valueNode.text}`);
    if (stack.includes(valueNode.text)) throw new Error(`cyclic identifier ${valueNode.text}`);
    const result = evaluate(initializer, parsed, [...stack, valueNode.text]);
    parsed.cache.set(valueNode.text, result);
    return result;
  }
  if (ts.isArrayLiteralExpression(valueNode)) {
    return valueNode.elements.map((element) => {
      if (ts.isSpreadElement(element)) throw new Error("spread arrays are not statically accepted");
      return evaluate(element, parsed, stack);
    });
  }
  if (ts.isObjectLiteralExpression(valueNode)) {
    const result = {};
    for (const property of valueNode.properties) {
      if (ts.isPropertyAssignment(property)) {
        const name = propertyName(property.name);
        if (name === undefined) throw new Error("computed property names are not statically accepted");
        result[name] = evaluate(property.initializer, parsed, stack);
      } else if (ts.isShorthandPropertyAssignment(property)) {
        result[property.name.text] = evaluate(property.name, parsed, stack);
      } else {
        throw new Error(`unsupported object member ${ts.SyntaxKind[property.kind]}`);
      }
    }
    return result;
  }
  throw new Error(`unsupported static expression ${ts.SyntaxKind[valueNode.kind]}`);
}

function exportedValue(relativePath, name) {
  const parsed = parse(relativePath);
  if (!parsed) return undefined;
  const initializer = parsed.declarations.get(name);
  if (!initializer) {
    fail(`${relativePath}: missing ${name}`);
    return undefined;
  }
  try {
    return evaluate(initializer, parsed);
  } catch (error) {
    fail(`${relativePath}: ${name} must be statically inspectable (${error.message})`);
    return undefined;
  }
}

function directStringArray(relativePath, name) {
  const parsed = parse(relativePath);
  if (!parsed) return [];
  const initializer = parsed.declarations.get(name);
  if (!initializer) {
    fail(`${relativePath}: missing direct literal ID array ${name}`);
    return [];
  }
  const array = unwrap(initializer);
  if (!ts.isArrayLiteralExpression(array)) {
    fail(`${relativePath}: ${name} must be a direct array literal`);
    return [];
  }
  const values = [];
  for (const [index, element] of array.elements.entries()) {
    const item = unwrap(element);
    if (!ts.isStringLiteral(item) && !ts.isNoSubstitutionTemplateLiteral(item)) {
      fail(`${relativePath}: ${name}[${index}] must be a direct string literal`);
    } else {
      values.push(item.text);
    }
  }
  return values;
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string" || !value) fail(`${label}: every ID must be a non-empty string`);
    else if (seen.has(value)) fail(`${label}: duplicate ID ${value}`);
    seen.add(value);
  }
  return seen;
}

function assertExact(actual, expected, label) {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label}: expected [${expected.join(", ")}], found [${actual.join(", ")}]`);
  }
}

function assertKeySet(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label}: expected an object`);
    return;
  }
  assertExact(Object.keys(value).sort(), [...expected].sort(), `${label} keys`);
}

function assertNonEmptyStringValues(value, label) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childLabel = `${label}.${key}`;
    if (typeof child === "boolean") {
      fail(`${childLabel}: boolean coverage placeholders are not localized copy`);
    } else if (typeof child === "string") {
      if (!child.trim()) fail(`${childLabel}: localized copy must be a non-empty string`);
    } else if (child && typeof child === "object") {
      assertNonEmptyStringValues(child, childLabel);
    } else {
      fail(`${childLabel}: unsupported localized value`);
    }
  }
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function pngDimensions(buffer) {
  if (
    buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
    buffer.subarray(12, 16).toString("ascii") !== "IHDR"
  ) {
    throw new Error("invalid PNG signature or IHDR");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("invalid JPEG SOI marker");
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    if (startOfFrame.has(marker)) {
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  throw new Error("JPEG start-of-frame marker not found");
}

function webpDimensions(buffer) {
  if (
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    throw new Error("invalid RIFF WebP signature");
  }
  const kind = buffer.subarray(12, 16).toString("ascii");
  if (kind === "VP8X") {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (kind === "VP8L") {
    if (buffer[20] !== 0x2f) throw new Error("invalid VP8L signature");
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8 ") {
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) {
      throw new Error("invalid VP8 frame signature");
    }
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(`unsupported WebP chunk ${kind}`);
}

function imageDimensions(path) {
  const buffer = readFileSync(path);
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return pngDimensions(buffer);
  if (extension === ".jpg" || extension === ".jpeg") return jpegDimensions(buffer);
  if (extension === ".webp") return webpDimensions(buffer);
  throw new Error(`unsupported image extension ${extension}`);
}

function checkImage(figure, property, digestProperty) {
  const publicPath = figure[property];
  if (typeof publicPath !== "string" || !publicPath.startsWith("/courses/make-money-with-codex/figures/")) {
    fail(`${figure.id}: ${property} must use the Course 11 public figure directory`);
    return;
  }
  const path = absolute(`public${publicPath}`);
  if (!existsSync(path)) {
    fail(`${figure.id}: missing public${publicPath}`);
    return;
  }
  if (!statSync(path).isFile() || statSync(path).size === 0) {
    fail(`${figure.id}: public${publicPath} is not a non-empty file`);
    return;
  }
  const expectedDigest = figure[digestProperty];
  if (!/^[0-9a-f]{64}$/.test(expectedDigest ?? "")) {
    fail(`${figure.id}: ${digestProperty} must be a lowercase SHA-256 digest`);
  } else {
    const actualDigest = sha256(path);
    if (actualDigest !== expectedDigest) {
      fail(`${figure.id}: ${property} SHA-256 ${actualDigest} does not match ${expectedDigest}`);
    }
  }
  try {
    const dimensions = imageDimensions(path);
    if (dimensions.width !== figure.width || dimensions.height !== figure.height) {
      fail(`${figure.id}: ${property} is ${dimensions.width}x${dimensions.height}, expected ${figure.width}x${figure.height}`);
    }
  } catch (error) {
    fail(`${figure.id}: cannot read ${property} dimensions (${error.message})`);
  }
}

function walk(relativeDirectory) {
  const directory = absolute(relativeDirectory);
  if (!existsSync(directory)) return [];
  const output = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(rel(path)));
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function checkObjectRecords(relativePath, expected) {
  const text = readText(relativePath);
  if (!text) return [];
  const sourceFile = ts.createSourceFile(relativePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const records = [];
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const record = {};
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = propertyName(property.name);
        const value = unwrap(property.initializer);
        if (name && (ts.isStringLiteral(value) || ts.isNumericLiteral(value))) {
          record[name] = ts.isNumericLiteral(value) ? Number(value.text) : value.text;
        }
      }
      if (record.id === expected) records.push(record);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return records;
}

function visibleCopyFiles() {
  const files = [SOURCES_PATH, FIGURES_PATH, DATA_PATH];
  for (const directory of [
    "components/make-money-with-codex",
    "app/[locale]/make-money-with-codex",
    "messages/make-money-with-codex",
  ]) {
    for (const path of walk(directory)) {
      if ([".ts", ".tsx", ".js", ".jsx", ".json"].includes(extname(path))) files.push(rel(path));
    }
  }
  return [...new Set(files)].filter((path) => existsSync(absolute(path)));
}

function lineLocation(text, index) {
  return text.slice(0, index).split("\n").length;
}

// Static curriculum data and direct literal ID contracts.
const locales = directStringArray(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_LOCALES");
const lessonContract = directStringArray(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_LESSON_SLUGS");
const quizContract = directStringArray(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_QUIZ_IDS");
const figureContract = directStringArray(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_FIGURE_IDS");
const practiceContract = directStringArray(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_PRACTICE_IDS");
const sourceContract = directStringArray(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_SOURCE_IDS");
const evidenceClassContract = directStringArray(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_EVIDENCE_CLASSES");
const courseVersionContract = exportedValue(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_COURSE_VERSION");
const quizVersionContract = exportedValue(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_QUIZ_VERSION");
const courseLevelContract = exportedValue(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_LEVEL");
const progressVersionKeyContract = exportedValue(TYPES_PATH, "MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY");

assertExact(locales, EXPECTED_LOCALES, "locale contract");
assertExact(lessonContract, EXPECTED_LESSONS, "lesson contract");
assertExact(quizContract, EXPECTED_QUIZZES, "quiz contract");
assertExact(figureContract, EXPECTED_FIGURES, "figure contract");
assertExact(practiceContract, EXPECTED_LESSONS.map((slug) => `practice-${slug}`), "practice contract");
assertUnique(sourceContract, "source contract");
assertExact(evidenceClassContract, EXPECTED_EVIDENCE_CLASSES, "evidence-class contract");
if (courseVersionContract !== "1.0.0") fail(`course version contract: expected 1.0.0, found ${courseVersionContract}`);
if (quizVersionContract !== "2026-08-24.1") {
  fail(`quiz version contract: expected 2026-08-24.1 after the audited assessment revision, found ${quizVersionContract}`);
}
if (courseLevelContract !== "intermediate-to-advanced") {
  fail(`course level contract: expected intermediate-to-advanced, found ${courseLevelContract}`);
}
if (progressVersionKeyContract !== "make-money-with-codex.course.version") {
  fail(`progress version key contract is invalid: ${progressVersionKeyContract}`);
}

let englishLocaleCopy;
for (const locale of locales) {
  const path = `messages/make-money-with-codex/${locale}.json`;
  let copy;
  try {
    copy = JSON.parse(readText(path));
  } catch (error) {
    fail(`${path}: invalid JSON (${error.message})`);
    continue;
  }
  assertKeySet(copy, ["meta", "availability", "ui", "units", "lessons"], path);
  assertKeySet(copy.meta, ["title", "shortTitle", "languageNotice"], `${path}.meta`);
  assertKeySet(copy.availability, ["contentLanguage", "localizedScope", "reviewStatus"], `${path}.availability`);
  assertKeySet(copy.ui, EXPECTED_LOCALIZED_UI_KEYS, `${path}.ui`);
  assertKeySet(copy.units, EXPECTED_UNIT_IDS, `${path}.units`);
  assertKeySet(copy.lessons, lessonContract, `${path}.lessons`);
  assertNonEmptyStringValues(copy, path);
  if (copy.availability?.contentLanguage !== "en") fail(`${path}: contentLanguage must remain en`);
  if (copy.availability?.localizedScope !== "navigation-and-titles") {
    fail(`${path}: localizedScope must remain navigation-and-titles`);
  }
  if (copy.availability?.reviewStatus !== "pending-independent-native-review") {
    fail(`${path}: reviewStatus must remain pending-independent-native-review until documented human review exists`);
  }
  for (const unitId of EXPECTED_UNIT_IDS) {
    assertKeySet(copy.units?.[unitId], ["title"], `${path}.units.${unitId}`);
  }
  for (const slug of lessonContract) {
    assertKeySet(copy.lessons?.[slug], ["title"], `${path}.lessons.${slug}`);
  }
  if (locale === "en") englishLocaleCopy = copy;
  else if (englishLocaleCopy && copy.meta?.title === englishLocaleCopy.meta?.title) {
    fail(`${path}: localized course title must not silently fall back to English`);
  }
}

const sources = exportedValue(SOURCES_PATH, "CODEX_INCOME_SOURCES") ?? [];
const figures = exportedValue(FIGURES_PATH, "MAKE_MONEY_WITH_CODEX_FIGURES") ?? [];
const units = exportedValue(DATA_PATH, "MAKE_MONEY_WITH_CODEX_UNITS") ?? [];
const lessons = exportedValue(DATA_PATH, "MAKE_MONEY_WITH_CODEX_LESSONS") ?? [];
const quizzes = exportedValue(DATA_PATH, "MAKE_MONEY_WITH_CODEX_QUIZ") ?? [];

if (!Array.isArray(sources)) fail(`${SOURCES_PATH}: CODEX_INCOME_SOURCES must be an array`);
if (!Array.isArray(figures)) fail(`${FIGURES_PATH}: MAKE_MONEY_WITH_CODEX_FIGURES must be an array`);
if (!Array.isArray(units)) fail(`${DATA_PATH}: MAKE_MONEY_WITH_CODEX_UNITS must be an array`);
if (!Array.isArray(lessons)) fail(`${DATA_PATH}: MAKE_MONEY_WITH_CODEX_LESSONS must be an array`);
if (!Array.isArray(quizzes)) fail(`${DATA_PATH}: MAKE_MONEY_WITH_CODEX_QUIZ must be an array`);

const sourceIds = assertUnique(sources.map((source) => source?.id), "source records");
const figureIds = assertUnique(figures.map((figure) => figure?.id), "figure records");
const lessonIds = assertUnique(lessons.map((lesson) => lesson?.slug), "lesson records");
assertUnique(quizzes.map((quiz) => quiz?.id), "quiz records");

assertExact(sources.map((source) => source.id), sourceContract, "source records versus source contract");
assertExact(figures.map((figure) => figure.id), figureContract, "figure records versus figure contract");
assertExact(lessons.map((lesson) => lesson.slug), lessonContract, "lesson records versus lesson contract");
assertExact(quizzes.map((quiz) => quiz.id), quizContract, "quiz records versus quiz contract");

const usedSources = new Set();
const usedFigures = new Set();
let computedMinutes = 0;

for (const [index, lesson] of lessons.entries()) {
  if (lesson.order !== index + 1) fail(`${lesson.slug}: order must be ${index + 1}, found ${lesson.order}`);
  if (!Number.isInteger(lesson.minutes) || lesson.minutes <= 0) fail(`${lesson.slug}: minutes must be a positive integer`);
  else computedMinutes += lesson.minutes;
  if (!Array.isArray(lesson.sourceIds) || lesson.sourceIds.length === 0) fail(`${lesson.slug}: sourceIds must be non-empty`);
  for (const sourceId of lesson.sourceIds ?? []) {
    usedSources.add(sourceId);
    if (!sourceIds.has(sourceId)) fail(`${lesson.slug}: unknown source ${sourceId}`);
  }
  const declaredEvidenceClasses = [...new Set(lesson.evidenceClasses ?? [])].sort();
  const citedEvidenceClasses = [...new Set(
    (lesson.sourceIds ?? [])
      .map((sourceId) => sources.find((source) => source.id === sourceId)?.evidenceClass)
      .filter(Boolean),
  )].sort();
  assertExact(
    declaredEvidenceClasses,
    citedEvidenceClasses,
    `${lesson.slug}: declared evidence classes versus cited source classes`,
  );
  if (!Array.isArray(lesson.sections) || lesson.sections.length < 3) fail(`${lesson.slug}: expected at least three teaching sections`);
  for (const section of lesson.sections ?? []) {
    if (!section.figureId) continue;
    usedFigures.add(section.figureId);
    if (!figureIds.has(section.figureId)) fail(`${lesson.slug}: unknown figure ${section.figureId}`);
    const figure = figures.find((candidate) => candidate.id === section.figureId);
    if (figure) {
      const matchingSource = sources.find((source) => source.url === figure.sourceUrl);
      if (matchingSource && !lesson.sourceIds.includes(matchingSource.id)) {
        fail(`${lesson.slug}: uses ${section.figureId} but does not cite its source ${matchingSource.id}`);
      }
    }
  }
  if (!lesson.practice?.title || !lesson.practice?.prompt || !lesson.practice?.guardrail) {
    fail(`${lesson.slug}: practice needs a title, prompt, and guardrail`);
  }
  if (lesson.practice?.id !== `practice-${lesson.slug}` || lesson.practice?.lessonSlug !== lesson.slug) {
    fail(`${lesson.slug}: practice id and lessonSlug must match the literal practice contract`);
  }
}

for (const [index, quiz] of quizzes.entries()) {
  if (quiz.lessonSlug !== lessons[index]?.slug) {
    fail(`${quiz.id}: expected lessonSlug ${lessons[index]?.slug}, found ${quiz.lessonSlug}`);
  }
  if (!lessonIds.has(quiz.lessonSlug)) fail(`${quiz.id}: unknown lesson ${quiz.lessonSlug}`);
  if (!Array.isArray(quiz.options) || quiz.options.length !== 4) fail(`${quiz.id}: expected four options`);
  if (!Number.isInteger(quiz.correctIndex) || quiz.correctIndex < 0 || quiz.correctIndex > 3) {
    fail(`${quiz.id}: correctIndex must be 0, 1, 2, or 3`);
  }
  for (const sourceId of quiz.sourceIds ?? []) {
    usedSources.add(sourceId);
    if (!sourceIds.has(sourceId)) fail(`${quiz.id}: unknown source ${sourceId}`);
  }
}

const quizEntailmentRules = {
  q3: {
    question: "A prospect explicitly requests a $10,000-per-month contract",
    explanation: "does not establish that the contract was signed, paid, renewed, profitable, or typical",
    sourceIds: ["academy-goliath"],
  },
  q7: {
    question: "course-authored planning heuristic",
    explanation: "The cited sources support variable tool cost and evidence boundaries, not this particular formula",
  },
  q9: {
    question: "course's scope-control policy",
    explanation: "The cited sources support technical scoping and review, not the commercial change-control rule",
  },
  q10: {
    question: "course's confidentiality policy",
    explanation: "The cited OpenAI docs support scoped reusable instructions, not the legal permission rule",
  },
  q11: {
    question: "course's retained-service model",
    explanation: "The cited sources establish recurring workflows and review needs, not the complete commercial retainer model",
  },
};
for (const [quizId, rule] of Object.entries(quizEntailmentRules)) {
  const quiz = quizzes.find((candidate) => candidate.id === quizId);
  if (!quiz) continue;
  const optionAndQuestionText = [quiz.question, ...(quiz.options ?? [])].join(" ");
  if (!optionAndQuestionText.includes(rule.question)) fail(`${quizId}: missing evidence-boundary wording ${rule.question}`);
  if (!quiz.explanation.includes(rule.explanation)) fail(`${quizId}: explanation must preserve citation ceiling ${rule.explanation}`);
  if (rule.sourceIds && JSON.stringify(quiz.sourceIds) !== JSON.stringify(rule.sourceIds)) {
    fail(`${quizId}: sourceIds must be ${rule.sourceIds.join(", ")}`);
  }
}

if (units.length !== 4) fail(`Expected 4 units, found ${units.length}`);
const unitLessons = [];
for (const [index, unit] of units.entries()) {
  if (unit.order !== index + 1) fail(`${unit.id}: unit order must be ${index + 1}`);
  for (const slug of unit.lessonSlugs ?? []) {
    unitLessons.push(slug);
    const lesson = lessons.find((candidate) => candidate.slug === slug);
    if (!lesson) fail(`${unit.id}: unknown lesson ${slug}`);
    else if (lesson.unitId !== unit.id) fail(`${slug}: lesson unit ${lesson.unitId} does not match ${unit.id}`);
  }
}
assertExact(unitLessons, lessonContract, "unit lesson map");

for (const source of sources) {
  if (!/^https:\/\//.test(source.url ?? "")) fail(`${source.id}: source URL must use HTTPS`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn ?? "")) fail(`${source.id}: accessedOn must be an ISO date`);
  for (const dateField of ["publishedOn", "updatedOn", "eventOn"]) {
    if (source[dateField] && !/^\d{4}-\d{2}-\d{2}$/.test(source[dateField])) {
      fail(`${source.id}: ${dateField} must be an ISO date when present`);
    }
  }
  if (!source.supports || source.supports.length < 35) fail(`${source.id}: supports statement is too thin`);
  if (!source.boundary || source.boundary.length < 35) fail(`${source.id}: boundary statement is too thin`);
  if (!usedSources.has(source.id)) fail(`${source.id}: orphan source is never cited by a lesson or quiz`);
}

for (const figure of figures) {
  const expectedSurface = EXPECTED_SURFACES[figure.id];
  if (figure.surface !== expectedSurface) {
    fail(`${figure.id}: surface must be ${expectedSurface}, found ${figure.surface}`);
  }
  const officialRepositoryFigure = figure.id === "fig-3";
  const firstPartyFigure = figure.captureMethod === "first-party-synthetic-capture";
  if (officialRepositoryFigure) {
    if (figure.captureMethod !== "official-repository-image") {
      fail(`fig-3: captureMethod must remain official-repository-image, found ${figure.captureMethod}`);
    }
    if (figure.rightsBasis !== "apache-2.0-pinned-source") {
      fail(`fig-3: rightsBasis must remain apache-2.0-pinned-source, found ${figure.rightsBasis}`);
    }
  } else if (firstPartyFigure) {
    if (figure.rightsBasis !== "first-party-original") {
      fail(`${figure.id}: a first-party synthetic capture must use rightsBasis first-party-original`);
    }
  } else {
    fail(`${figure.id}: every non-official figure must use captureMethod first-party-synthetic-capture, found ${figure.captureMethod}`);
  }
  if (!Array.isArray(figure.visiblePublicIdentifiers)) fail(`${figure.id}: visiblePublicIdentifiers must be an array`);
  if (!figure.privacyReview || figure.privacyReview.length < 35) fail(`${figure.id}: privacyReview is missing or too thin`);
  if (!/^https:\/\//.test(figure.sourceUrl ?? "")) fail(`${figure.id}: sourceUrl must use HTTPS`);
  if (officialRepositoryFigure) {
    if (!/github\.com\/openai\/codex\/blob\/[0-9a-f]{40}\//.test(figure.sourceUrl)) {
      fail("fig-3: official repository sourceUrl must be pinned to a 40-character commit");
    }
    if (!/github\.com\/openai\/codex\/tree\/[0-9a-f]{40}$/.test(figure.sourcePage)) {
      fail("fig-3: official repository sourcePage must be an immutable commit tree");
    }
  } else if (firstPartyFigure) {
    if (figure.sourcePage !== "https://developers.openai.com/community") {
      fail(`${figure.id}: first-party figure sourcePage must preserve the OpenAI community context trail`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(figure.sourceDate ?? "")) fail(`${figure.id}: first-party capture sourceDate must be an ISO date`);
  }
  if (figure.rightsBasis === "first-party-original") {
    const evidencePath = figure.rightsEvidencePath;
    if (
      typeof evidencePath !== "string"
      || !evidencePath
      || evidencePath.startsWith("/")
      || evidencePath.split(/[\\/]/).includes("..")
    ) {
      fail(`${figure.id}: ${figure.rightsBasis} requires a safe repository-relative rightsEvidencePath`);
    } else {
      const evidenceText = readText(evidencePath);
      const evidenceSection = markdownLevelTwoSection(evidenceText, figure.id);
      if (!evidenceSection) {
        fail(`${figure.id}: rights evidence record is missing a scoped ## ${figure.id} section`);
      } else {
        const requiredRecords = [
          `Figure ID: ${figure.id}`,
          `Source URL: ${figure.sourceUrl}`,
          "Rights basis: first-party-original",
          "Synthetic data:",
          "Capture date:",
          "Product version:",
          "Operating system:",
          "Capture method:",
          `Published master SHA-256: \`${figure.sha256}\``,
          "Privacy review:",
        ];
        for (const record of requiredRecords) {
          if (!evidenceSection.includes(record)) fail(`${figure.id}: scoped rights evidence is missing ${record}`);
        }
        if (figure.id === "fig-4") {
          const transcriptHash = existsSync(absolute(CLI_TRANSCRIPT_PATH)) ? sha256(absolute(CLI_TRANSCRIPT_PATH)) : "missing";
          const fixtureHash = existsSync(absolute(FIGURE_FIXTURE_PATH)) ? sha256(absolute(FIGURE_FIXTURE_PATH)) : "missing";
          for (const record of [
            CLI_TRANSCRIPT_PATH,
            `${FIGURE_FIXTURE_PATH}?figure=4`,
            `Transcript SHA-256: \`${transcriptHash}\``,
            `Rendering fixture SHA-256: \`${fixtureHash}\``,
          ]) {
            if (!evidenceSection.includes(record)) fail(`${figure.id}: scoped rights evidence is missing referenced record ${record}`);
          }
        }
        if (["fig-5", "fig-6", "fig-7", "fig-8", "fig-9"].includes(figure.id)) {
          const fixtureReference = `${FIGURE_FIXTURE_PATH}?figure=${figure.id.slice(4)}`;
          if (!evidenceSection.includes(fixtureReference)) {
            fail(`${figure.id}: scoped rights evidence is missing referenced fixture ${fixtureReference}`);
          }
          const fixtureHash = existsSync(absolute(FIGURE_FIXTURE_PATH)) ? sha256(absolute(FIGURE_FIXTURE_PATH)) : "missing";
          const fixtureHashRecord = `Rendering fixture SHA-256: \`${fixtureHash}\``;
          if (!evidenceSection.includes(fixtureHashRecord)) {
            fail(`${figure.id}: scoped rights evidence is missing current fixture hash ${fixtureHashRecord}`);
          }
        }
      }
    }
  } else if (figure.rightsEvidencePath !== undefined) {
    fail(`${figure.id}: rightsEvidencePath is only valid for first-party captures`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(figure.verifiedOn ?? "")) fail(`${figure.id}: verifiedOn must be an ISO date`);
  if (!figure.alt || !figure.caption || !figure.boundary) fail(`${figure.id}: alt, caption, and boundary are required`);
  if (!Number.isInteger(figure.width) || !Number.isInteger(figure.height)) fail(`${figure.id}: dimensions must be integers`);
  checkImage(figure, "src", "sha256");
  checkImage(figure, "webp", "webpSha256");
}

for (const id of figureContract) {
  if (!usedFigures.has(id)) fail(`${id}: figure is never used by a lesson section`);
}

const surfaceCounts = Object.fromEntries(
  ["codex-app", "codex-cli", "product-output", "repository-handoff"].map((surface) => [
    surface,
    figures.filter((figure) => figure.surface === surface).length,
  ]),
);
if (surfaceCounts["codex-app"] !== 2 || surfaceCounts["codex-cli"] !== 2) {
  fail(`Expected four Codex UI or transcript records (2 current app, 1 official historical CLI illustration, and 1 actual CLI transcript rendering), found ${surfaceCounts["codex-app"] + surfaceCounts["codex-cli"]}`);
}
if (surfaceCounts["product-output"] !== 3 || surfaceCounts["repository-handoff"] !== 2) {
  fail(`Expected five non-UI evidence figures (3 product outputs and 2 repository handoffs)`);
}
for (const id of ["fig-5", "fig-6", "fig-7", "fig-8", "fig-9"]) {
  const figure = figures.find((candidate) => candidate.id === id);
  if (figure && /real Codex (?:desktop|CLI|interface)/i.test(figure.caption)) {
    fail(`${id}: non-UI evidence must not be captioned as a real Codex interface`);
  }
}

const expectedFigureAssets = new Set(
  figures.flatMap((figure) => [figure.src, figure.webp]).map((publicPath) => `public${publicPath}`),
);
for (const path of walk("public/courses/make-money-with-codex/figures")) {
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extname(path).toLowerCase()) && !expectedFigureAssets.has(rel(path))) {
    fail(`${rel(path)}: unreferenced figure asset must not remain in the public Course 11 directory`);
  }
}
const cliComposer = figures.find((figure) => figure.id === "fig-3");
if (cliComposer) {
  if (!/plan/i.test(`${cliComposer.alt} ${cliComposer.caption}`)) {
    fail("fig-3: official repository figure must identify the visible reviewable plan");
  }
  if (!cliComposer.sourceUrl.includes("343074d4207d572809bd8cea15f4be1d09d98e0b")) {
    fail("fig-3: source must remain pinned to the audited openai/codex commit 343074d");
  }
}

// Claim-boundary gates for the highest-risk commercial source.
const goliath = sources.find((source) => source.id === "academy-goliath");
if (!goliath) {
  fail("Missing academy-goliath source");
} else {
  if (!/prospect requested a \$10,000 per month contract/i.test(goliath.supports)) {
    fail("academy-goliath: must describe a prospect's contract request, not a signed or paid contract");
  }
  if (!/about \$40 of compute/i.test(goliath.supports)) fail("academy-goliath: compute amount must remain a company estimate");
  for (const term of ["does not confirm", "signed", "collected revenue", "Codex", "profit", "typical return"]) {
    if (!goliath.boundary.toLowerCase().includes(term.toLowerCase())) {
      fail(`academy-goliath: boundary must include ${term}`);
    }
  }
}
const pricing = sources.find((source) => source.id === "openai-pricing");
if (!pricing) {
  fail("Missing openai-pricing source for time-sensitive plan, price, limit, and entitlement checks");
} else {
  if (pricing.url !== "https://learn.chatgpt.com/docs/pricing") {
    fail("openai-pricing: URL must use the current official OpenAI pricing documentation");
  }
  if (pricing.accessedOn !== "2026-08-24") {
    fail(`openai-pricing: accessedOn must preserve the actual 2026-08-24 revalidation date, found ${pricing.accessedOn}`);
  }
  for (const term of ["time-sensitive", "Recheck", "actual account"]) {
    if (!pricing.boundary.includes(term)) fail(`openai-pricing: boundary must include ${term}`);
  }
}

const dataText = readText(DATA_PATH);
if (!/verifiedOn:\s*["']2026-08-24["']/.test(dataText)) {
  fail("Course verification date must record the final 2026-08-24 audit");
}
if (!/does not confirm that the contract was signed, paid, profitable, or typical/i.test(dataText)) {
  fail("Course copy must explicitly say the Goliath contract is not confirmed signed, paid, profitable, or typical");
}
if (!/No lesson in this course promises earnings, a passive-income system, or a typical financial return/i.test(dataText)) {
  fail("Course copy must carry the explicit no-earnings and no-passive-income warning");
}
if (/Codex turned \$40 into \$120,000/i.test(dataText) && !/Do not write:\s*["']Codex turned \$40 into \$120,000/i.test(dataText)) {
  fail("The false $40-to-$120,000 transformation appears without its explicit correction");
}
if (!/accepted purchase \+ collected revenue greater than total delivery cost/i.test(dataText)) {
  fail("The governing commercial chain must distinguish an accepted purchase and collected revenue from a quoted price");
}
if (/quality factor/i.test(dataText) || /verified hours saved times fully loaded labour cost/i.test(dataText)) {
  fail("The retained-service lesson must not hide uncertainty inside an undefined ROI multiplier");
}
for (const phrase of [
  "course-authored measurement worksheet",
  "Do not hide uncertainty",
  "not a formula established by OpenAI or the cited cases",
  "not cash savings, profit, revenue, or realised ROI",
]) {
  if (!dataText.includes(phrase)) fail(`Retained-service operational-value boundary is missing: ${phrase}`);
}
const contractor = sources.find((source) => source.id === "academy-contractor-exclusion");
if (contractor) {
  if (contractor.publishedOn !== "2026-05-08") fail("academy-contractor-exclusion: visible publication date must be 2026-05-08");
  if (!/ChatGPT workflows, not Codex/i.test(contractor.boundary)) fail("Contractor source must remain excluded from Codex outcome evidence");
}
const expectedSourceMetadata = {
  "academy-builders": { publishedOn: "2025-08-07", updatedOn: "2026-06-02" },
  "academy-business-ops": { publishedOn: "2026-06-18", title: "How business operations teams use Codex [Recording]" },
  "x-pedro-build-time": { publishedOn: "2026-02-04" },
  "x-flavio-app": { publishedOn: "2026-02-02" },
};
for (const [sourceId, expected] of Object.entries(expectedSourceMetadata)) {
  const source = sources.find((candidate) => candidate.id === sourceId);
  if (!source) continue;
  for (const [field, value] of Object.entries(expected)) {
    if (source[field] !== value) fail(`${sourceId}: ${field} must be ${value}, found ${source[field] ?? "missing"}`);
  }
}
const smallBusiness = sources.find((source) => source.id === "academy-small-business");
if (smallBusiness) {
  if (smallBusiness.eventOn !== "2026-08-27") fail("academy-small-business: eventOn must preserve the scheduled 2026-08-27 date");
  if (!/upcoming event description/i.test(smallBusiness.supports) || !/prospective event-description evidence/i.test(smallBusiness.boundary)) {
    fail("academy-small-business: must remain visibly prospective at the 2026-08-23 research cutoff");
  }
}
const billyDashboard = sources.find((source) => source.id === "x-billy-dashboard");
if (billyDashboard) {
  if (!/five-minute 3D-printer dashboard/i.test(billyDashboard.title) || !/live about five minutes after an on-a-whim request/i.test(billyDashboard.supports)) {
    fail("x-billy-dashboard: must not conflate the creator's general overnight workflow with the separate five-minute dashboard anecdote");
  }
}

// Release integration.
const dashboardRoute = "app/[locale]/make-money-with-codex/page.tsx";
const lessonRouteCandidates = [
  "app/[locale]/make-money-with-codex/[lesson]/page.tsx",
  "app/[locale]/make-money-with-codex/[slug]/page.tsx",
];
if (!existsSync(absolute(dashboardRoute))) fail(`Missing ${dashboardRoute}`);
if (!lessonRouteCandidates.some((path) => existsSync(absolute(path)))) {
  fail(`Missing lesson route: expected ${lessonRouteCandidates.join(" or ")}`);
}
for (const routePath of [dashboardRoute, ...lessonRouteCandidates.filter((path) => existsSync(absolute(path)))]) {
  if (!existsSync(absolute(routePath))) continue;
  const routeText = readText(routePath);
  if (!/availableLocales:\s*\[\s*["']en["']\s*\]/.test(routeText) || !/canonicalLocale:\s*["']en["']/.test(routeText)) {
    fail(`${routePath}: English-only course metadata must expose only the English hreflang and canonicalise to English`);
  }
  if (!/const\s+contentLocale\s*=\s*["']en["']/.test(routeText)) {
    fail(`${routePath}: structured-data content URLs must use the English content locale`);
  }
}

const catalogueRecords = checkObjectRecords("lib/courses.ts", "make-money-with-codex");
if (catalogueRecords.length === 0) {
  fail("lib/courses.ts: missing make-money-with-codex catalogue record");
} else {
  if (!catalogueRecords.some((record) => record.href === "/make-money-with-codex/")) {
    fail("lib/courses.ts: Course 11 needs href /make-money-with-codex/");
  }
  if (!catalogueRecords.some((record) => record.displayNumber === 11)) {
    fail("lib/courses.ts: Course 11 needs displayNumber 11");
  }
}

const sitemapText = readText("app/sitemap.ts");
if (!/import\s*\{[^}]*\bPAGES\b[^}]*\}\s*from\s*["']@\/lib\/seo["']/.test(sitemapText) || !/PAGES\.flatMap/.test(sitemapText)) {
  fail("app/sitemap.ts: sitemap must be generated from the canonical PAGES contract");
}
if (
  !/page\s*===\s*["']make-money-with-codex\/["']/.test(sitemapText)
  || !/page\.startsWith\(["']make-money-with-codex\/["']\)/.test(sitemapText)
) {
  fail("app/sitemap.ts: Course 11 sitemap entries must be English-only");
}
const cataloguePageText = readText("app/[locale]/courses/page.tsx");
if (!/courseElevenParts[\s\S]*?url:\s*`\$\{urlFor\(["']en["']\)\}make-money-with-codex\//.test(cataloguePageText)) {
  fail("app/[locale]/courses/page.tsx: Course 11 lesson structured-data URLs must use the English canonical");
}
const vercelText = readText("vercel.json");
for (const error of publishedReleaseIntegrationErrors(
  ROOT,
  "make-money-with-codex",
  "npm run make-money-with-codex:check:release",
  ["make-money-with-codex/", ...lessonContract.map((slug) => `make-money-with-codex/${slug}/`)],
)) fail(error);
if (!vercelText.includes('"buildCommand": "npm run build:release"')) {
  fail("vercel.json: production builds must use the release-gated build command");
}
const progressStoreText = readText("components/make-money-with-codex/progress-store.ts");
for (const token of [
  "MAKE_MONEY_WITH_CODEX_COURSE_VERSION",
  "MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY",
  "recordForCurrentCourseVersion",
  "event.key === null || event.key === SHARED_PROGRESS_KEY",
]) {
  if (!progressStoreText.includes(token)) fail(`Course 11 progress store is missing version/refresh control: ${token}`);
}
const courseRouteText = readText(dashboardRoute);
if (!courseRouteText.includes('educationalLevel: course.level.replaceAll("-", " ")')) {
  fail("Course 11 structured data must derive educationalLevel from the course-level contract");
}
const sharedCatalogueText = readText("lib/courses.ts");
for (const token of [
  "MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY",
  "MAKE_MONEY_WITH_CODEX_COURSE_VERSION",
  "level: MAKE_MONEY_WITH_CODEX_LEVEL",
]) {
  if (!sharedCatalogueText.includes(token)) fail(`lib/courses.ts: Course 11 is missing shared contract ${token}`);
}
const courseProgressText = readText("components/make-money-with-codex/CourseProgress.tsx");
if (courseProgressText.includes("#income-capstone")) {
  fail("CourseProgress.tsx: dangling #income-capstone fallback must not return");
}

const economicsText = readText(ECONOMICS_PATH);
for (const formula of [
  "inputs.directCosts / denominator",
  "(inputs.directCosts * 1.25) / denominator",
]) {
  if (!economicsText.includes(formula)) fail(`${ECONOMICS_PATH}: missing direct-cost allocation formula ${formula}`);
}

// Rights and research artefacts.
const noticeText = readText(NOTICE_PATH);
for (const phrase of [
  "first-party-original",
  "no creator-post image pixels",
  "Privacy review",
  "actual Codex CLI transcript",
  "repository-handoff",
  "not GitHub screenshots",
  "1898 x 1190 PNG",
  "1600 x 1003 JPEG",
  "1600 x 1003 WebP",
  "first-party-synthetic-capture",
  "openai-codex-343074d-LICENSE.txt",
  "openai-codex-343074d-NOTICE.txt",
]) {
  if (!noticeText.includes(phrase)) fail(`${NOTICE_PATH}: missing required notice phrase: ${phrase}`);
}
const upstreamLicenseText = readText(UPSTREAM_LICENSE_PATH);
const upstreamNoticeText = readText(UPSTREAM_NOTICE_PATH);
if (
  existsSync(absolute(UPSTREAM_LICENSE_PATH))
  && sha256(absolute(UPSTREAM_LICENSE_PATH)) !== "d17f227e4df5da1600391338865ce0f3055211760a36688f816941d58232d8dc"
) {
  fail(`${UPSTREAM_LICENSE_PATH}: bytes do not match the pinned openai/codex commit`);
}
if (
  existsSync(absolute(UPSTREAM_NOTICE_PATH))
  && sha256(absolute(UPSTREAM_NOTICE_PATH)) !== "9d71575ecfd9a843fc1677b0efb08053c6ba9fd686a0de1a6f5382fd3c220915"
) {
  fail(`${UPSTREAM_NOTICE_PATH}: bytes do not match the pinned openai/codex commit`);
}
if (!upstreamLicenseText.includes("Apache License") || !upstreamLicenseText.includes("Version 2.0")) {
  fail(`${UPSTREAM_LICENSE_PATH}: expected Apache-2.0 licence text`);
}
if (!upstreamNoticeText.includes("OpenAI Codex") || !upstreamNoticeText.includes("Copyright")) {
  fail(`${UPSTREAM_NOTICE_PATH}: expected OpenAI Codex notice text`);
}
const researchText = readText(RESEARCH_PATH);
for (const phrase of [
  "Official OpenAI docs revalidated: 2026-08-24",
  "requested a $10,000-per-month contract",
  "does not report that the contract was signed",
  "No reviewed source establishes typical earnings",
  "contractor case is an explicit exclusion",
]) {
  if (!researchText.includes(phrase)) fail(`${RESEARCH_PATH}: missing required evidence boundary: ${phrase}`);
}
const translationReadinessText = readText(TRANSLATION_READINESS_PATH);
for (const phrase of [
  "Course 11 is not a fully translated course",
  "contentLanguage: en",
  "localizedScope: navigation-and-titles",
  "reviewStatus: pending-independent-native-review",
  "canonical metadata and structured-data content language remain English",
]) {
  if (!translationReadinessText.includes(phrase)) {
    fail(`${TRANSLATION_READINESS_PATH}: missing multilingual release boundary: ${phrase}`);
  }
}
const provenanceText = readText(PROVENANCE_PATH);
for (const figure of figures) {
  for (const token of [figure.id, figure.sha256, figure.webpSha256, figure.sourceUrl]) {
    if (!provenanceText.includes(token)) fail(`${PROVENANCE_PATH}: missing ${figure.id} token ${token}`);
  }
}

const firstPartyFigures = figures.filter((figure) => figure.rightsBasis === "first-party-original");
if (firstPartyFigures.length !== 8) fail(`Expected 8 first-party-original figures, found ${firstPartyFigures.length}`);

const cliTranscriptText = readText(CLI_TRANSCRIPT_PATH);
const figureFixtureText = readText(FIGURE_FIXTURE_PATH);
if (!cliTranscriptText.includes("The substantive headings and response text below are unchanged.")) {
  fail(`${CLI_TRANSCRIPT_PATH}: sanitisation record must state that substantive headings and response text are unchanged`);
}
for (const heading of ["Scope", "Risks", "Verification", "Decision"]) {
  const section = markdownLevelTwoSection(cliTranscriptText, heading);
  if (!section) {
    fail(`${CLI_TRANSCRIPT_PATH}: missing ## ${heading} section`);
    continue;
  }
  const verbatimRecords = heading === "Verification"
    ? section.split(/\r?\n/).map((line) => line.startsWith("- ") ? line.slice(2) : line).filter(Boolean)
    : [section];
  if (verbatimRecords.length === 0) fail(`${CLI_TRANSCRIPT_PATH}: ## ${heading} contains no substantive record`);
  for (const record of verbatimRecords) {
    if (!figureFixtureText.includes(record)) {
      fail(`${FIGURE_FIXTURE_PATH}: fig-4 rendering does not preserve the transcript's ${heading} text verbatim: ${record}`);
    }
  }
}

// Copy-risk and house-style gates. Identifier fields and one exact quoted
// creator title are excluded from spelling checks; the rest is learner-visible.
const visibleFiles = visibleCopyFiles();
const usSpellings = [
  /\bcommercializ(?:e|es|ed|ing|ation)\b/giu,
  /\bmonetiz(?:e|es|ed|ing|ation)\b/giu,
  /\bproductiz(?:e|es|ed|ing|ation)\b/giu,
  /\blabor\b/giu,
  /\borganizational\b/giu,
  /\b(?:authorized|authorization|unauthorized)\b/giu,
  /\bbehavior\b/giu,
  /\bfavor\b/giu,
  /\blicenses\b/giu,
  /\bartifacts?\b/giu,
  /\blabeled\b/giu,
  /\b(?:analyze|analyzed)\b/giu,
  /\b(?:organize|organized)\b/giu,
  /\bsummarize\b/giu,
  /\bmodeled\b/giu,
  /\brecognizable\b/giu,
  /\bprioritization\b/giu,
  /\bminimiz(?:e|es|ed|ing|ation)\b/giu,
  /\bauthoriz(?:e|es|ed|ing|ation)\b/giu,
  /\butiliz(?:e|es|ed|ing|ation)\b/giu,
  /\bsummarized\b/giu,
  /\bunlabeled\b/giu,
];
const identifierLine = /^\s*(?:id|slug|lessonSlug|lessonSlugs|sourceIds|figureId|src|webp|sourceUrl)\s*:/;
const structuralJsonLine = /^\s*"[^"]+"\s*:\s*(?:true|false|null|-?\d+(?:\.\d+)?),?\s*$/;

for (const relativePath of visibleFiles) {
  const text = readText(relativePath);
  for (const [zeroIndex, line] of text.split("\n").entries()) {
    const jsonValueMatch = relativePath.endsWith(".json")
      ? line.match(/^\s*"[^"]+"\s*:\s*"((?:\\.|[^"])*)",?\s*$/)
      : null;
    if (relativePath.endsWith(".json") && !jsonValueMatch) continue;
    const visibleLine = jsonValueMatch?.[1] ?? line;
    if (visibleLine.includes("\u2014")) fail(`${relativePath}:${zeroIndex + 1}: U+2014 em dash is not allowed in new visible copy`);
    if (identifierLine.test(line) || structuralJsonLine.test(line)) continue;
    if (relativePath === SOURCES_PATH && line.includes('title: "Productized video hub built with Codex"')) continue;
    for (const pattern of usSpellings) {
      pattern.lastIndex = 0;
      const match = pattern.exec(visibleLine);
      if (match) fail(`${relativePath}:${zeroIndex + 1}: selected US spelling "${match[0]}" remains in visible copy`);
    }
  }

  const hypePatterns = [
    /\bget[- ]rich[- ]quick\b/giu,
    /\b(?:easy|effortless|automatic|guaranteed) passive income\b/giu,
    /\bguaranteed (?:earnings|income|returns?)\b/giu,
    /\bCodex (?:guarantees|will generate|will make you|earns you) (?:money|income|revenue|profit)\b/giu,
    /\bearn \$[\d,]+ (?:a|per) (?:day|week|month)\b/giu,
    /\bmake \$[\d,]+ (?:a|per) (?:day|week|month) with Codex\b/giu,
    /\bzero[- ]risk (?:income|profit)\b/giu,
  ];
  const hypeText = relativePath.endsWith(".json")
    ? text.split("\n")
      .map((line) => line.match(/^\s*"[^"]+"\s*:\s*"((?:\\.|[^"])*)",?\s*$/)?.[1] ?? "")
      .join("\n")
    : text;
  for (const pattern of hypePatterns) {
    pattern.lastIndex = 0;
    for (const match of hypeText.matchAll(pattern)) {
      fail(`${relativePath}:${lineLocation(hypeText, match.index)}: forbidden earnings hype "${match[0]}"`);
    }
  }
}

if (computedMinutes !== 630) fail(`Lesson minutes total ${computedMinutes}; expected 630`);

note(`${lessons.length} lessons, ${quizzes.length} quiz questions, ${sources.length} sources, ${figures.length} figures`);
note(`${computedMinutes} curriculum minutes`);
note(`${surfaceCounts["codex-app"] + surfaceCounts["codex-cli"]} authentic Codex UI or transcript figures and ${surfaceCounts["product-output"] + surfaceCounts["repository-handoff"]} synthetic downstream output or handoff figures`);
note("Remote source URLs were not fetched; this is a deterministic offline repository check");

const result = {
  ok: errors.length === 0,
  release: RELEASE,
  errors,
  warnings,
  notes,
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Course 11 release evidence check: ${result.ok ? "PASS" : "FAIL"}`);
  for (const message of notes) console.log(`  note: ${message}`);
  for (const message of warnings) console.warn(`  warning: ${message}`);
  for (const message of errors) console.error(`  error: ${message}`);
  console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s)`);
}

process.exitCode = result.ok ? 0 : 1;
