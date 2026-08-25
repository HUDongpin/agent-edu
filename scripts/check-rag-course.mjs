#!/usr/bin/env node

/**
 * Deterministic, offline release gate for Course 9: Retrieval-Augmented Generation.
 *
 * The checker imports the TypeScript ledgers through the repository's pinned
 * `tsx` binary, then validates the curriculum, evidence spine, UI provenance,
 * local raster/vector bytes, nine-locale parity, assessment, progress model,
 * routes, SEO, catalogue wiring, and safety claims without fetching the web.
 *
 *   node scripts/check-rag-course.mjs
 *   node scripts/check-rag-course.mjs --release
 *   node scripts/check-rag-course.mjs --json
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");
const SNAPSHOT_ON = "2026-08-23";
const PUBLISHED_ON = "2026-08-24";
const FIGURE_AUDIT_ON = "2026-08-24";
const CLAUDE_QUICKSTARTS_COMMIT = "5264b729deda905dba3e5402d717bebed000325c";
const DIFY_DOCS_COMMIT = "bca060d6b2d741071394605cadae46badb9911c5";

const EXPECTED_LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const EXPECTED_UNITS = ["frame", "index", "answer", "operate"];
const EXPECTED_LESSONS = [
  "choose-rag",
  "trace-the-pipeline",
  "corpus-contract",
  "parse-and-chunk",
  "embeddings-and-indexes",
  "retrieval-engineering",
  "rerank-and-assemble",
  "ground-and-cite",
  "advanced-patterns",
  "evaluate-rag",
  "secure-and-refresh",
  "production-capstone",
];
const EXPECTED_UNIT_LESSONS = {
  frame: EXPECTED_LESSONS.slice(0, 3),
  index: EXPECTED_LESSONS.slice(3, 6),
  answer: EXPECTED_LESSONS.slice(6, 9),
  operate: EXPECTED_LESSONS.slice(9, 12),
};
const EXPECTED_FIGURES = [
  "rag-decision-map",
  "dify-rag-workflow",
  "corpus-control-plane",
  "dify-chunk-settings",
  "dify-chunk-inspector",
  "retrieval-scoreboard",
  "context-budget",
  "claude-support-rag-ui",
  "anthropic-knowledge-wiki-architecture",
  "evaluation-stack",
  "threat-boundary",
  "dify-citations-ui",
];
const EXPECTED_CONCEPTS = [
  "rag-definition",
  "selection-boundary",
  "long-context",
  "fine-tuning",
  "search-tools-sql",
  "source-authority",
  "permissions-provenance",
  "parsing-ocr-layout",
  "chunking",
  "metadata-versioning",
  "embeddings",
  "vector-index",
  "dense-retrieval",
  "sparse-retrieval",
  "hybrid-fusion",
  "query-transformation",
  "filters-acl",
  "reranking-diversity",
  "context-assembly",
  "grounding-abstention",
  "citations",
  "agentic-multihop",
  "multimodal-rag",
  "graph-rag",
  "retrieval-evaluation",
  "answer-evaluation",
  "citation-evaluation",
  "observability",
  "prompt-injection-poisoning",
  "privacy-tenancy",
  "freshness-deletion",
  "cost-latency",
  "production-reliability",
  "domain-contexts",
];
const EXPECTED_SOURCE_IDS = [
  "anthropic-academy-api",
  "anthropic-academy-vertex",
  "anthropic-contextual-retrieval",
  "anthropic-context-engineering",
  "anthropic-prompt-injection-defences",
  "anthropic-citations",
  "anthropic-projects-rag-help",
  "anthropic-quickstarts",
  "openai-academy-rag-bootcamp",
  "openai-academy-graphrag",
  "openai-retrieval-guide",
  "openai-file-search-guide",
  "openai-evaluation-guide",
  "openai-data-controls",
  "openai-knowledge-retrieval",
  "openai-multimodal-rag",
  "google-skills-boost-rag",
  "google-rag-engine-overview",
  "google-rag-reference-architecture",
  "google-parse-chunk",
  "google-hybrid-search",
  "google-ranking",
  "google-check-grounding",
  "google-model-armor",
  "lewis-rag-paper",
  "self-rag-paper",
  "microsoft-graphrag",
  "owasp-rag-security",
  "azure-search-rag-demo",
  "paperqa",
  "sourcegraph-cody-context",
  "privategpt",
  "ragflow",
  "langchain-rag-from-scratch",
  "dify-docs",
  "user-report-sourcegraph-no-context",
  "user-report-ragflow-reading-order",
  "user-report-paperqa-vendor-leak",
  "user-report-privategpt-wrong-answer",
  "user-report-azure-missing-citations",
];
const EXPECTED_USER_REPORTS = EXPECTED_SOURCE_IDS.filter((id) => id.startsWith("user-report-"));
const EXPECTED_CHECKPOINT_SOURCES = {
  "choose-rag": "google-rag-engine-overview",
  "trace-the-pipeline": "langchain-rag-from-scratch",
  "corpus-contract": "owasp-rag-security",
  "parse-and-chunk": "google-parse-chunk",
  "embeddings-and-indexes": "google-rag-engine-overview",
  "retrieval-engineering": "anthropic-contextual-retrieval",
  "rerank-and-assemble": "anthropic-context-engineering",
  "ground-and-cite": "anthropic-citations",
  "advanced-patterns": "microsoft-graphrag",
  "evaluate-rag": "openai-evaluation-guide",
  "secure-and-refresh": "owasp-rag-security",
  "production-capstone": "google-rag-reference-architecture",
};
const REQUIRED_OFFICIAL_LEARNING_SOURCES = {
  "anthropic-academy-api": {
    url: "https://academy.claude.com/courses/building-with-the-claude-api",
    evidenceLabel: "official-course",
  },
  "anthropic-academy-vertex": {
    url: "https://academy.claude.com/courses/claude-with-google-cloud-s-vertex-ai",
    evidenceLabel: "official-course",
  },
  "openai-academy-rag-bootcamp": {
    url: "https://academy.openai.com/public/clubs/builders-etkn1/events/builder-bootcamp-rag-b3yo6kdfwv",
    evidenceLabel: "official-event",
  },
  "openai-academy-graphrag": {
    url: "https://academy.openai.com/public/videos/automate-knowledge-graphs",
    evidenceLabel: "official-video",
  },
  "google-skills-boost-rag": {
    url: "https://www.skills.google/paths/1282/course_templates/1120",
    evidenceLabel: "official-course",
  },
};

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value, label) {
  if (!isRecord(value)) {
    fail(`${label}: expected an object`);
    return false;
  }
  return true;
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${label}: expected a nonempty string`);
    return false;
  }
  return true;
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath}: invalid or missing JSON (${error.message})`);
    return null;
  }
}

function readText(relativePath, required = true) {
  try {
    return readFileSync(join(ROOT, relativePath), "utf8");
  } catch (error) {
    if (required) fail(`${relativePath}: cannot be read (${error.message})`);
    return "";
  }
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function exactSet(actualValues, expectedValues, label, allowRepeatedReferences = false) {
  const actual = sortedUnique(actualValues);
  const expected = sortedUnique(expectedValues);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    const missing = expected.filter((value) => !actual.includes(value));
    const extra = actual.filter((value) => !expected.includes(value));
    fail(`${label}: missing ${missing.join(", ") || "none"}; extra ${extra.join(", ") || "none"}`);
  }
  if (!allowRepeatedReferences && actualValues.length !== actual.length) {
    fail(`${label}: duplicate values found`);
  }
}

function exactKeys(value, expectedKeys, label) {
  if (!requireRecord(value, label)) return false;
  exactSet(Object.keys(value), expectedKeys, `${label} keys`);
  return true;
}

function requireStringArray(value, label, { exact, minimum = 1 } = {}) {
  if (!Array.isArray(value)) {
    fail(`${label}: expected an array`);
    return false;
  }
  if (exact !== undefined && value.length !== exact) fail(`${label}: expected ${exact} items, found ${value.length}`);
  if (value.length < minimum) fail(`${label}: expected at least ${minimum} items, found ${value.length}`);
  value.forEach((item, index) => requireString(item, `${label}[${index}]`));
  return true;
}

function isHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateVisibleStrings(value, label) {
  if (typeof value === "string") {
    if (!value.trim()) fail(`${label}: empty string`);
    if (/[\u2013\u2014]/u.test(value)) fail(`${label}: visible copy must not use an en or em dash`);
    if (/\b(?:TODO|TBD)\b/.test(value) || /\[(?:translation|translate)\]/i.test(value) || value.includes("\uFFFD")) {
      fail(`${label}: placeholder or replacement character found`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateVisibleStrings(item, `${label}[${index}]`));
    return;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) validateVisibleStrings(item, `${label}.${key}`);
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function pngDimensions(buffer, label) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${label}: invalid PNG signature`);
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function webpDimensions(buffer, label) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    fail(`${label}: invalid RIFF WebP signature`);
    return null;
  }
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === "VP8 ") {
    if (buffer.subarray(23, 26).toString("hex") !== "9d012a") {
      fail(`${label}: invalid VP8 frame header`);
      return null;
    }
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    if (buffer[20] !== 0x2f) {
      fail(`${label}: invalid VP8L frame header`);
      return null;
    }
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + b0 + ((b1 & 0x3f) << 8),
      height: 1 + (b1 >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10),
    };
  }
  fail(`${label}: unsupported WebP chunk ${JSON.stringify(chunk)}`);
  return null;
}

function validateRaster(pathname, expectedHash, expectedWidth, expectedHeight) {
  const absolutePath = join(ROOT, "public", pathname.replace(/^\//, ""));
  if (!existsSync(absolutePath)) {
    fail(`figure asset: missing ${pathname}`);
    return;
  }
  const buffer = readFileSync(absolutePath);
  const dimensions = extname(pathname).toLowerCase() === ".png"
    ? pngDimensions(buffer, pathname)
    : webpDimensions(buffer, pathname);
  if (dimensions && (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight)) {
    fail(`${pathname}: expected ${expectedWidth}x${expectedHeight}, found ${dimensions.width}x${dimensions.height}`);
  }
  const digest = sha256(buffer);
  if (!/^[a-f0-9]{64}$/.test(expectedHash || "")) fail(`${pathname}: ledger hash is not a lowercase SHA-256 digest`);
  if (digest !== expectedHash) fail(`${pathname}: SHA-256 mismatch; expected ${expectedHash}, found ${digest}`);
}

function validateVector(pathname, expectedHash, expectedWidth, expectedHeight) {
  const absolutePath = join(ROOT, "public", pathname.replace(/^\//, ""));
  if (!existsSync(absolutePath)) {
    fail(`figure asset: missing ${pathname}`);
    return;
  }
  if (extname(pathname).toLowerCase() !== ".svg") {
    fail(`${pathname}: official teaching vector must use SVG`);
    return;
  }
  const buffer = readFileSync(absolutePath);
  const source = buffer.toString("utf8");
  const digest = sha256(buffer);
  if (!/^[a-f0-9]{64}$/.test(expectedHash || "")) fail(`${pathname}: ledger hash is not a lowercase SHA-256 digest`);
  if (digest !== expectedHash) fail(`${pathname}: SHA-256 mismatch; expected ${expectedHash}, found ${digest}`);
  const viewBox = source.match(/<svg\b[^>]*\bviewBox=["']\s*0\s+0\s+(\d+)\s+(\d+)\s*["']/i);
  if (!viewBox || Number(viewBox[1]) !== expectedWidth || Number(viewBox[2]) !== expectedHeight) {
    fail(`${pathname}: expected viewBox 0 0 ${expectedWidth} ${expectedHeight}`);
  }
  for (const [pattern, description] of [
    [/<script\b/i, "script"],
    [/<foreignObject\b/i, "foreignObject"],
    [/\son[a-z]+\s*=/i, "event handler"],
    [/<(?:image|use)\b[^>]*(?:href|xlink:href)\s*=\s*["'](?:https?:|data:)/i, "external embedded resource"],
  ]) {
    if (pattern.test(source)) fail(`${pathname}: unsafe SVG ${description} found`);
  }
}

function loadLedgers() {
  const tsxPackage = join(ROOT, "node_modules", "tsx", "package.json");
  if (!existsSync(tsxPackage)) {
    fail("the local tsx package is required to import the Course 9 ledgers");
    return null;
  }
  const expression = [
    'import { RAG_COURSE_MANIFEST, RAG_SOURCES, RAG_FIGURES, RAG_CONCEPT_IDS, RAG_SOURCE_IDS, RAG_FIGURE_IDS, RAG_LESSON_SLUGS, RAG_LOCALES } from "./lib/rag/index.ts";',
    "process.stdout.write(JSON.stringify({manifest:RAG_COURSE_MANIFEST,sources:RAG_SOURCES,figures:RAG_FIGURES,conceptIds:RAG_CONCEPT_IDS,sourceIds:RAG_SOURCE_IDS,figureIds:RAG_FIGURE_IDS,lessonIds:RAG_LESSON_SLUGS,locales:RAG_LOCALES}));",
  ].join(" ");
  // Import through Node's loader instead of the tsx CLI. The CLI opens an IPC
  // socket for its evaluator, which is denied in sandboxed release checks.
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", expression], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    fail(`Course 9 TypeScript ledgers could not be imported: ${result.error?.message || result.stderr.trim() || `exit ${result.status}`}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`Course 9 TypeScript ledger output is invalid JSON: ${error.message}`);
    return null;
  }
}

function validateManifest(data) {
  const { manifest } = data;
  if (!exactKeys(manifest, ["id", "version", "displayNumber", "publishedOn", "sourceSnapshotOn", "units", "lessons"], "manifest")) return;
  if (manifest.id !== "rag") fail(`manifest.id: expected rag, found ${manifest.id}`);
  if (manifest.displayNumber !== 9) fail(`manifest.displayNumber: expected 9, found ${manifest.displayNumber}`);
  if (manifest.version !== "1.1.0") fail(`manifest.version: expected 1.1.0, found ${manifest.version}`);
  if (manifest.publishedOn !== PUBLISHED_ON || manifest.sourceSnapshotOn !== SNAPSHOT_ON) {
    fail(`manifest dates: expected publishedOn ${PUBLISHED_ON} and sourceSnapshotOn ${SNAPSHOT_ON}`);
  }
  exactSet(data.locales, EXPECTED_LOCALES, "locale type registry");
  exactSet(data.lessonIds, EXPECTED_LESSONS, "lesson type registry");
  exactSet(data.figureIds, EXPECTED_FIGURES, "figure type registry");
  exactSet(data.conceptIds, EXPECTED_CONCEPTS, "concept type registry");
  exactSet(data.sourceIds, EXPECTED_SOURCE_IDS, "source type registry");

  if (!Array.isArray(manifest.units)) {
    fail("manifest.units: expected an array");
  } else {
    if (manifest.units.length !== 4) fail(`manifest.units: expected 4, found ${manifest.units.length}`);
    exactSet(manifest.units.map((unit) => unit?.id), EXPECTED_UNITS, "manifest unit ids");
    manifest.units.forEach((unit, index) => {
      const label = `manifest.units[${index}]`;
      if (!requireRecord(unit, label)) return;
      const expectedId = EXPECTED_UNITS[index];
      if (unit.id !== expectedId) fail(`${label}.id: expected ${expectedId}, found ${unit.id}`);
      if (unit.order !== index + 1) fail(`${label}.order: expected ${index + 1}, found ${unit.order}`);
      if (JSON.stringify(unit.lessonSlugs) !== JSON.stringify(EXPECTED_UNIT_LESSONS[expectedId])) {
        fail(`${label}.lessonSlugs: expected ${EXPECTED_UNIT_LESSONS[expectedId].join(", ")} in order`);
      }
    });
  }

  if (!Array.isArray(manifest.lessons)) {
    fail("manifest.lessons: expected an array");
    return;
  }
  if (manifest.lessons.length !== 12) fail(`manifest.lessons: expected 12, found ${manifest.lessons.length}`);
  exactSet(manifest.lessons.map((lesson) => lesson?.slug), EXPECTED_LESSONS, "manifest lesson slugs");

  const usedConcepts = [];
  const usedSources = [];
  const usedFigures = [];
  let minutes = 0;
  manifest.lessons.forEach((lesson, index) => {
    const label = `manifest.lessons[${index}]`;
    if (!requireRecord(lesson, label)) return;
    const expectedSlug = EXPECTED_LESSONS[index];
    if (lesson.slug !== expectedSlug) fail(`${label}.slug: expected ${expectedSlug}, found ${lesson.slug}`);
    if (lesson.order !== index + 1) fail(`${label}.order: expected ${index + 1}, found ${lesson.order}`);
    const expectedUnit = Object.entries(EXPECTED_UNIT_LESSONS).find(([, slugs]) => slugs.includes(expectedSlug))?.[0];
    if (lesson.unitId !== expectedUnit) fail(`${label}.unitId: expected ${expectedUnit}, found ${lesson.unitId}`);
    if (!Number.isInteger(lesson.minutes) || lesson.minutes < 30) fail(`${label}.minutes: expected an integer of at least 30`);
    minutes += Number.isFinite(lesson.minutes) ? lesson.minutes : 0;
    if (lesson.figureId !== EXPECTED_FIGURES[index]) fail(`${label}.figureId: expected ${EXPECTED_FIGURES[index]}, found ${lesson.figureId}`);
    if (!Array.isArray(lesson.conceptIds) || !lesson.conceptIds.length) {
      fail(`${label}.conceptIds: at least one concept required`);
    } else {
      exactSet(lesson.conceptIds, sortedUnique(lesson.conceptIds), `${label}.conceptIds`);
      for (const id of lesson.conceptIds) {
        if (!EXPECTED_CONCEPTS.includes(id)) fail(`${label}.conceptIds: unknown concept ${id}`);
        usedConcepts.push(id);
      }
    }
    if (!Array.isArray(lesson.sourceIds) || !lesson.sourceIds.length) {
      fail(`${label}.sourceIds: at least one source required`);
    } else {
      exactSet(lesson.sourceIds, sortedUnique(lesson.sourceIds), `${label}.sourceIds`);
      for (const id of lesson.sourceIds) {
        if (!EXPECTED_SOURCE_IDS.includes(id)) fail(`${label}.sourceIds: unknown source ${id}`);
        usedSources.push(id);
      }
      const checkpointSource = EXPECTED_CHECKPOINT_SOURCES[lesson.slug];
      if (!lesson.sourceIds.includes(checkpointSource)) {
        fail(`${label}.sourceIds: checkpoint source ${checkpointSource} is not assigned to its lesson`);
      }
    }
    usedFigures.push(lesson.figureId);
  });
  if (minutes !== 780) fail(`manifest lesson minutes: expected 780, found ${minutes}`);
  exactSet(usedConcepts, EXPECTED_CONCEPTS, "34-concept curriculum coverage", true);
  exactSet(usedSources, EXPECTED_SOURCE_IDS, "source coverage by lessons", true);
  exactSet(usedFigures, EXPECTED_FIGURES, "one figure per lesson");

  const requiredLessonSources = {
    "choose-rag": ["openai-academy-rag-bootcamp", "google-skills-boost-rag"],
    "corpus-contract": ["user-report-paperqa-vendor-leak"],
    "retrieval-engineering": ["openai-knowledge-retrieval"],
    "advanced-patterns": ["self-rag-paper"],
  };
  for (const [slug, sourceIds] of Object.entries(requiredLessonSources)) {
    const lesson = manifest.lessons.find((item) => item.slug === slug);
    for (const sourceId of sourceIds) {
      if (!lesson?.sourceIds?.includes(sourceId)) fail(`manifest lesson ${slug}: required audit source ${sourceId} is missing`);
    }
  }
}

function validateSources(data) {
  const sources = data.sources;
  if (!Array.isArray(sources)) {
    fail("RAG_SOURCES: expected an array");
    return;
  }
  if (sources.length !== EXPECTED_SOURCE_IDS.length) fail(`RAG_SOURCES: expected ${EXPECTED_SOURCE_IDS.length} records, found ${sources.length}`);
  exactSet(sources.map((source) => source?.id), EXPECTED_SOURCE_IDS, "source ledger ids");
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const urls = [];
  const allowedLabels = new Set([
    "official-course",
    "official-event",
    "official-video",
    "official-doc",
    "official-repository",
    "research-paper",
    "maintainer-repository",
    "security-guidance",
    "individual-user-report",
  ]);
  const allowedReuse = new Set(["link-and-synthesise", "licensed-local-figure", "original-only"]);
  for (const [index, source] of sources.entries()) {
    const label = `RAG_SOURCES[${index}]`;
    if (!requireRecord(source, label)) continue;
    for (const key of ["id", "evidenceLabel", "title", "publisher", "licence", "reuse", "note", "caveat"]) requireString(source[key], `${label}.${key}`);
    if (!isHttps(source.url)) fail(`${label}.url: HTTPS required`);
    if (!isHttps(source.exactAnchor)) fail(`${label}.exactAnchor: HTTPS required`);
    if (source.licenceUrl !== null && !isHttps(source.licenceUrl)) fail(`${label}.licenceUrl: null or HTTPS required`);
    if (source.accessedOn !== SNAPSHOT_ON) fail(`${label}.accessedOn: expected ${SNAPSHOT_ON}, found ${source.accessedOn}`);
    if (!allowedLabels.has(source.evidenceLabel)) fail(`${label}.evidenceLabel: unsupported ${source.evidenceLabel}`);
    if (!allowedReuse.has(source.reuse)) fail(`${label}.reuse: unsupported ${source.reuse}`);
    if (source.reuse === "licensed-local-figure") {
      if (!source.commit || !/^[a-f0-9]{40}$/.test(source.commit)) fail(`${label}.commit: pinned 40-character commit required for a local figure`);
      if (!source.licenceUrl) fail(`${label}.licenceUrl: required for a local figure`);
    }
    urls.push(source.url);
  }
  if (new Set(urls).size !== urls.length) fail("RAG_SOURCES: duplicate canonical URLs found");

  for (const [id, expected] of Object.entries(REQUIRED_OFFICIAL_LEARNING_SOURCES)) {
    const source = sourceById.get(id);
    if (source?.url !== expected.url || source?.exactAnchor !== expected.url || source?.evidenceLabel !== expected.evidenceLabel) {
      fail(`${id}: official learning-source URL or evidence label differs from the verified contract`);
    }
  }
  const googleLearning = sourceById.get("google-skills-boost-rag");
  if (googleLearning?.publisher !== "Google Skills") fail("google-skills-boost-rag: publisher must use the current Google Skills brand");
  const selfRag = sourceById.get("self-rag-paper");
  if (selfRag?.url !== "https://openreview.net/forum?id=hSyW5go0v8" || selfRag?.exactAnchor !== selfRag.url || selfRag?.evidenceLabel !== "research-paper") {
    fail("self-rag-paper: canonical OpenReview record or research-paper label differs from the audited contract");
  }
  const officialLearningIds = Object.keys(REQUIRED_OFFICIAL_LEARNING_SOURCES);
  exactSet(
    sources.filter((source) => ["official-course", "official-event", "official-video"].includes(source.evidenceLabel)).map((source) => source.id),
    officialLearningIds,
    "five-source official learning spine",
  );
  exactSet(
    sources.filter((source) => source.evidenceLabel === "official-course").map((source) => source.id),
    ["anthropic-academy-api", "anthropic-academy-vertex", "google-skills-boost-rag"],
    "three official courses",
  );
  if (sourceById.get("sourcegraph-cody-context")?.evidenceLabel !== "official-doc") {
    fail("sourcegraph-cody-context: current Sourcegraph documentation must be labelled official-doc");
  }
  const langchainSource = sourceById.get("langchain-rag-from-scratch");
  if (langchainSource?.licence !== "undeclared" || langchainSource?.licenceUrl !== null || langchainSource?.reuse !== "link-and-synthesise") {
    fail("langchain-rag-from-scratch: undeclared licence and link-only reuse boundary are required");
  }
  const evaluationSource = sourceById.get("openai-evaluation-guide");
  if (!String(evaluationSource?.caveat || "").includes("2026-10-31") || !String(evaluationSource?.caveat || "").includes("2026-11-30")) {
    fail("openai-evaluation-guide: hosted Evals retirement dates are missing");
  }
  const injectionSource = sourceById.get("anthropic-prompt-injection-defences");
  if (!/browser-agent-specific/i.test(`${injectionSource?.note || ""} ${injectionSource?.caveat || ""}`) || !/OWASP/i.test(injectionSource?.caveat || "")) {
    fail("anthropic-prompt-injection-defences: browser-agent scope and OWASP boundary are required");
  }

  const providerCounts = {
    Anthropic: sources.filter((source) => source.id.startsWith("anthropic-")).length,
    OpenAI: sources.filter((source) => source.id.startsWith("openai-")).length,
    Google: sources.filter((source) => source.id.startsWith("google-")).length,
  };
  for (const [provider, count] of Object.entries(providerCounts)) {
    if (count < 8) fail(`source spine: expected at least 8 ${provider} records, found ${count}`);
  }

  const userReports = sources.filter((source) => source.evidenceLabel === "individual-user-report");
  exactSet(userReports.map((source) => source.id), EXPECTED_USER_REPORTS, "individual GitHub user reports");
  for (const source of userReports) {
    if (!source.url.startsWith("https://github.com/")) fail(`${source.id}: individual report must resolve to GitHub`);
    const boundary = `${source.note} ${source.caveat}`;
    if (!/\b(?:individual|one|single|report|reports|reported|case)\b/i.test(boundary)) fail(`${source.id}: individual-report boundary is not explicit`);
    if (!/\b(?:not|does not|cannot|only|old|version|configuration)\b/i.test(source.caveat)) fail(`${source.id}: caveat must prevent generalisation`);
  }

  const claudeSource = sourceById.get("anthropic-quickstarts");
  if (claudeSource?.commit !== CLAUDE_QUICKSTARTS_COMMIT || claudeSource?.licence !== "MIT" || claudeSource?.reuse !== "licensed-local-figure") {
    fail("anthropic-quickstarts: commit, MIT licence, or local-figure reuse contract is wrong");
  }
  if (!String(claudeSource?.caveat || "").includes("not the consumer Claude.ai interface")) {
    fail("anthropic-quickstarts: the non-consumer-Claude.ai boundary is missing");
  }
  if (/reasoning state/i.test(claudeSource?.note || "") || !/application activity status/i.test(claudeSource?.note || "")) {
    fail("anthropic-quickstarts: interface activity must not be represented as hidden model reasoning");
  }
  const difySource = sourceById.get("dify-docs");
  if (difySource?.commit !== DIFY_DOCS_COMMIT || difySource?.licence !== "CC-BY-4.0" || difySource?.reuse !== "licensed-local-figure") {
    fail("dify-docs: commit, CC-BY-4.0 licence, or local-figure reuse contract is wrong");
  }
}

function validateFigures(data) {
  const figures = data.figures;
  if (!Array.isArray(figures)) {
    fail("RAG_FIGURES: expected an array");
    return;
  }
  if (figures.length !== 12) fail(`RAG_FIGURES: expected 12 records, found ${figures.length}`);
  exactSet(figures.map((figure) => figure?.id), EXPECTED_FIGURES, "figure ledger ids");
  const sourceById = new Map(data.sources.map((source) => [source.id, source]));
  const authentic = figures.filter((figure) => figure.authenticUi === true);
  const semantic = figures.filter((figure) => figure.format === "semantic-html");
  const officialDiagrams = figures.filter((figure) => figure.format === "official-teaching-diagram");
  if (authentic.length !== 5) fail(`figures: expected 5 authentic UI screenshots, found ${authentic.length}`);
  if (semantic.length !== 6) fail(`figures: expected 6 original semantic figures, found ${semantic.length}`);
  if (officialDiagrams.length !== 1) fail(`figures: expected 1 official licensed teaching diagram, found ${officialDiagrams.length}`);

  for (const [index, figure] of figures.entries()) {
    const label = `RAG_FIGURES[${index}]`;
    if (!requireRecord(figure, label)) continue;
    if (figure.status !== "available") fail(`${label}.status: expected available`);
    if (figure.format === "semantic-html") {
      if (figure.authenticUi || figure.sourceId !== null || figure.product !== null || figure.rightsStatus !== "course-original" || figure.raster !== null || figure.vector != null) {
        fail(`${label}: semantic figures must be original HTML with no raster or product claim`);
      }
      continue;
    }
    if (figure.format === "official-teaching-diagram") {
      if (figure.authenticUi || figure.sourceId !== "anthropic-quickstarts" || figure.product !== "Anthropic knowledge-wiki architecture" || figure.rightsStatus !== "licensed-local-figure" || figure.raster !== null) {
        fail(`${label}: official teaching diagram must be licensed, non-UI Anthropic evidence with no raster claim`);
      }
      const source = sourceById.get(figure.sourceId);
      if (source?.reuse !== "licensed-local-figure" || source?.commit !== CLAUDE_QUICKSTARTS_COMMIT) {
        fail(`${label}: source ledger does not authorise the pinned official teaching diagram`);
      }
      if (!requireRecord(figure.vector, `${label}.vector`)) continue;
      const vector = figure.vector;
      if (vector.observedOn !== FIGURE_AUDIT_ON) fail(`${label}.vector.observedOn: expected ${FIGURE_AUDIT_ON}`);
      if (vector.privacyReview !== "no-personal-data-visible") fail(`${label}.vector.privacyReview: explicit review required`);
      if (!isHttps(vector.upstreamUrl) || !vector.upstreamUrl.includes(vector.upstreamCommit)) fail(`${label}.vector.upstreamUrl: immutable commit URL required`);
      if (vector.upstreamCommit !== CLAUDE_QUICKSTARTS_COMMIT) fail(`${label}.vector.upstreamCommit: differs from audited Anthropic commit`);
      if (vector.width !== 960 || vector.height !== 700) fail(`${label}.vector: expected 960x700, found ${vector.width}x${vector.height}`);
      validateVector(vector.svgPath, vector.svgSha256, vector.width, vector.height);
      continue;
    }
    if (!figure.authenticUi) fail(`${label}: non-authentic figure uses unsupported format ${figure.format}`);
    if (figure.format !== "authentic-ui-screenshot" || figure.rightsStatus !== "licensed-local-figure") {
      fail(`${label}: authentic UI must be a licensed local screenshot`);
    }
    if (figure.vector != null) fail(`${label}: authentic UI screenshot must not carry a vector asset`);
    if (!figure.sourceId || !sourceById.has(figure.sourceId)) fail(`${label}.sourceId: unresolved source`);
    const source = sourceById.get(figure.sourceId);
    if (source?.reuse !== "licensed-local-figure") fail(`${label}: source ledger does not authorise local figure reuse`);
    if (!requireRecord(figure.raster, `${label}.raster`)) continue;
    const raster = figure.raster;
    if (raster.observedOn !== SNAPSHOT_ON) fail(`${label}.raster.observedOn: expected ${SNAPSHOT_ON}`);
    if (raster.privacyReview !== "no-personal-data-visible") fail(`${label}.raster.privacyReview: explicit review required`);
    if (!isHttps(raster.upstreamUrl) || !raster.upstreamUrl.includes(raster.upstreamCommit)) fail(`${label}.raster.upstreamUrl: immutable commit URL required`);
    if (raster.upstreamCommit !== source?.commit) fail(`${label}.raster.upstreamCommit: differs from source ledger`);
    if (!Number.isInteger(raster.width) || !Number.isInteger(raster.height) || raster.width < 800 || raster.height < 500) {
      fail(`${label}.raster: implausible dimensions ${raster.width}x${raster.height}`);
    }
    validateRaster(raster.pngPath, raster.pngSha256, raster.width, raster.height);
    validateRaster(raster.webpPath, raster.webpSha256, raster.width, raster.height);
  }

  const claudeFigures = authentic.filter((figure) => figure.product === "Claude-powered Anthropic quickstart");
  if (claudeFigures.length !== 1 || claudeFigures[0]?.id !== "claude-support-rag-ui" || claudeFigures[0]?.sourceId !== "anthropic-quickstarts") {
    fail("figures: exactly one accurately labelled Claude-powered Anthropic quickstart UI is required");
  }
  if (claudeFigures[0]?.raster?.upstreamCommit !== CLAUDE_QUICKSTARTS_COMMIT) fail("Claude UI figure: pinned commit differs from the audited commit");
  const anthropicDiagram = officialDiagrams[0];
  if (anthropicDiagram?.id !== "anthropic-knowledge-wiki-architecture" || anthropicDiagram?.sourceId !== "anthropic-quickstarts") {
    fail("figures: the sole official teaching diagram must be the pinned Anthropic knowledge-wiki architecture");
  }
  const difyFigures = authentic.filter((figure) => figure.product === "Dify");
  if (difyFigures.length !== 4 || difyFigures.some((figure) => figure.sourceId !== "dify-docs" || figure.raster?.upstreamCommit !== DIFY_DOCS_COMMIT)) {
    fail("figures: four Dify screenshots pinned to the audited docs commit are required");
  }

  const assetDirectory = join(ROOT, "public", "courses", "rag", "figures");
  if (!existsSync(assetDirectory)) {
    fail("public/courses/rag/figures: directory missing");
  } else {
    const actual = readdirSync(assetDirectory)
      .filter((name) => statSync(join(assetDirectory, name)).isFile() && [".png", ".webp"].includes(extname(name)))
      .sort();
    const expected = authentic.flatMap((figure) => [figure.raster.pngPath, figure.raster.webpPath]).map((pathname) => pathname.split("/").at(-1)).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      fail(`figure assets: expected exactly the 10 ledger rasters; found ${actual.join(", ") || "none"}`);
    }
    const svgAssets = readdirSync(assetDirectory)
      .filter((name) => statSync(join(assetDirectory, name)).isFile() && extname(name) === ".svg")
      .sort();
    const expectedSvgAssets = officialDiagrams.map((figure) => figure.vector.svgPath.split("/").at(-1)).sort();
    if (JSON.stringify(svgAssets) !== JSON.stringify(expectedSvgAssets)) {
      fail(`figure assets: expected exactly the official diagram SVG; found ${svgAssets.join(", ") || "none"}`);
    }
  }
}

function validateFigureNotice() {
  const notice = readText("public/courses/rag/NOTICE.md");
  for (const required of [
    CLAUDE_QUICKSTARTS_COMMIT,
    DIFY_DOCS_COMMIT,
    "MIT License",
    "Creative Commons Attribution 4.0 International",
    "not the consumer Claude.ai interface",
    "not affiliated with or endorsed by",
    "no personal account data",
    "historical examples",
    "anthropic-knowledge-wiki-architecture",
    "official teaching diagram",
    "not product UI",
    "947a005c4690087aed08f92a1681e95c2e6de7909e1edc7a75e085fa5d00131f",
  ]) {
    if (!notice.includes(required)) fail(`public/courses/rag/NOTICE.md: missing provenance boundary ${JSON.stringify(required)}`);
  }
  const authenticPaths = [
    "claude-support-rag-ui",
    "dify-rag-workflow-ui",
    "dify-chunk-settings-ui",
    "dify-chunk-inspector-ui",
    "dify-citations-ui",
  ];
  for (const stem of authenticPaths) if (!notice.includes(stem)) fail(`public/courses/rag/NOTICE.md: missing asset attribution for ${stem}`);
}

function validateCopy(copy) {
  if (!copy) return;
  validateVisibleStrings(copy, "messages/rag/en.json");
  if (!exactKeys(copy, ["meta", "ui", "units", "lessons", "lab", "capstone"], "messages/rag/en.json")) return;
  if (exactKeys(copy.meta, ["title", "kicker", "summary", "audience", "duration", "sourceNote", "uiNote", "startCta", "resumeCta"], "copy.meta")) {
    Object.entries(copy.meta).forEach(([key, value]) => requireString(value, `copy.meta.${key}`));
  }
  for (const phrase of ["Google Cloud", "Google Skills", "Claude Academy", "OpenAI Academy", "open-source"]) {
    if (!copy.meta?.sourceNote?.includes(phrase)) fail(`copy.meta.sourceNote: missing named evidence spine ${phrase}`);
  }
  if (!/13 hours/i.test(copy.meta?.duration || "")) fail("copy.meta.duration: must state the 780-minute course as about 13 hours");
  if (!String(copy.meta?.uiNote || "").includes("not the consumer Claude.ai interface")) fail("copy.meta.uiNote: Claude quickstart boundary is missing");
  if (!/examples, not universal defaults/i.test(copy.meta?.uiNote || "")) fail("copy.meta.uiNote: screenshot-setting boundary is missing");
  for (const key of ["officialCourse", "officialEvent", "officialVideo", "officialDoc", "officialFigure"]) {
    requireString(copy.ui?.[key], `copy.ui.${key}`);
  }
  if (copy.ui?.authenticFigure !== "Authentic source interface screenshot") fail("copy.ui.authenticFigure: generic badge must not overclaim product identity");
  if (copy.ui?.officialFigure !== "Official licensed teaching diagram") fail("copy.ui.officialFigure: official diagram badge must distinguish teaching evidence from product UI");
  if (copy.ui?.breadcrumb !== "Breadcrumb") fail("copy.ui.breadcrumb: lesson breadcrumb landmark requires an accurate name");
  if (copy.ui?.catalogName !== "Courses") fail("copy.ui.catalogName: English canonical breadcrumb label is required");
  if (!/event.*livestream/i.test(copy.ui?.officialEvent || "")) fail("copy.ui.officialEvent: event and livestream type must be visible");
  if (!/video session/i.test(copy.ui?.officialVideo || "")) fail("copy.ui.officialVideo: video-session type must be visible");

  exactSet(Object.keys(copy.units || {}), EXPECTED_UNITS, "copy unit ids");
  for (const id of EXPECTED_UNITS) {
    if (exactKeys(copy.units?.[id], ["title", "summary"], `copy.units.${id}`)) {
      requireString(copy.units[id].title, `copy.units.${id}.title`);
      requireString(copy.units[id].summary, `copy.units.${id}.summary`);
    }
  }

  exactSet(Object.keys(copy.lessons || {}), EXPECTED_LESSONS, "copy lesson slugs");
  const checkpointQuestions = [];
  const checkpointCorrectIndexes = [];
  for (const slug of EXPECTED_LESSONS) {
    const lesson = copy.lessons?.[slug];
    const label = `copy.lessons.${slug}`;
    if (!exactKeys(lesson, ["kicker", "title", "summary", "objective", "sections", "figure", "practice", "checkpoint", "takeaway"], label)) continue;
    for (const key of ["kicker", "title", "summary", "objective", "takeaway"]) requireString(lesson[key], `${label}.${key}`);
    if (!Array.isArray(lesson.sections) || lesson.sections.length !== 3) {
      fail(`${label}.sections: exactly 3 substantive sections required`);
    } else {
      lesson.sections.forEach((section, index) => {
        const sectionLabel = `${label}.sections[${index}]`;
        if (exactKeys(section, ["heading", "paragraphs"], sectionLabel)) {
          requireString(section.heading, `${sectionLabel}.heading`);
          requireStringArray(section.paragraphs, `${sectionLabel}.paragraphs`, { minimum: 2 });
        }
      });
    }
    if (exactKeys(lesson.figure, ["title", "caption", "alt", "transcript"], `${label}.figure`)) {
      for (const key of ["title", "caption", "alt"]) requireString(lesson.figure[key], `${label}.figure.${key}`);
      requireStringArray(lesson.figure.transcript, `${label}.figure.transcript`, { minimum: 4 });
    }
    if (exactKeys(lesson.practice, ["title", "brief", "steps", "evidence", "boundary"], `${label}.practice`)) {
      for (const key of ["title", "brief", "boundary"]) requireString(lesson.practice[key], `${label}.practice.${key}`);
      requireStringArray(lesson.practice.steps, `${label}.practice.steps`, { minimum: 4 });
      requireStringArray(lesson.practice.evidence, `${label}.practice.evidence`, { minimum: 3 });
    }
    if (exactKeys(lesson.checkpoint, ["question", "options", "correctIndex", "sourceId", "explanation"], `${label}.checkpoint`)) {
      requireString(lesson.checkpoint.question, `${label}.checkpoint.question`);
      requireStringArray(lesson.checkpoint.options, `${label}.checkpoint.options`, { exact: 4 });
      if (!Number.isInteger(lesson.checkpoint.correctIndex) || lesson.checkpoint.correctIndex < 0 || lesson.checkpoint.correctIndex > 3) {
        fail(`${label}.checkpoint.correctIndex: expected an integer from 0 through 3`);
      }
      requireString(lesson.checkpoint.sourceId, `${label}.checkpoint.sourceId`);
      if (lesson.checkpoint.sourceId !== EXPECTED_CHECKPOINT_SOURCES[slug]) {
        fail(`${label}.checkpoint.sourceId: expected ${EXPECTED_CHECKPOINT_SOURCES[slug]}, found ${lesson.checkpoint.sourceId}`);
      }
      requireString(lesson.checkpoint.explanation, `${label}.checkpoint.explanation`);
      checkpointQuestions.push(lesson.checkpoint.question);
      checkpointCorrectIndexes.push(lesson.checkpoint.correctIndex);
    }
  }
  if (checkpointQuestions.length !== 12 || new Set(checkpointQuestions).size !== 12) fail("assessment: 12 unique lesson checkpoint questions are required");
  const answerHistogram = [0, 1, 2, 3].map((index) => checkpointCorrectIndexes.filter((value) => value === index).length);
  if (JSON.stringify(answerHistogram) !== JSON.stringify([3, 3, 3, 3])) {
    fail(`assessment: correct-answer positions must be balanced 3/3/3/3, found ${answerHistogram.join("/")}`);
  }

  validateLabCopy(copy.lab);
  if (exactKeys(copy.capstone, ["title", "summary", "required", "rubric"], "copy.capstone")) {
    requireString(copy.capstone.title, "copy.capstone.title");
    requireString(copy.capstone.summary, "copy.capstone.summary");
    requireStringArray(copy.capstone.required, "copy.capstone.required", { minimum: 9 });
    requireStringArray(copy.capstone.rubric, "copy.capstone.rubric", { exact: 5 });
    const packet = `${copy.capstone.summary} ${copy.capstone.required.join(" ")} ${copy.capstone.rubric.join(" ")}`;
    for (const concept of ["Corpus", "retrieval", "citation", "tenant", "deletion", "Latency", "rollback"]) {
      if (!new RegExp(concept, "i").test(packet)) fail(`copy.capstone: release evidence omits ${concept}`);
    }
  }

  const allCopy = JSON.stringify(copy);
  const groundAndCiteCopy = JSON.stringify(copy.lessons?.["ground-and-cite"] || {});
  const parseAndChunkCopy = JSON.stringify(copy.lessons?.["parse-and-chunk"] || {});
  const retrievalEngineeringCopy = JSON.stringify(copy.lessons?.["retrieval-engineering"] || {});
  const advancedPatternsCopy = JSON.stringify(copy.lessons?.["advanced-patterns"] || {});
  const productionCapstoneCopy = JSON.stringify(copy.lessons?.["production-capstone"] || {});
  const forbiddenClaims = [
    [/\bRAG\s+(?:always|never|guarantees?|eliminates?|prevents?)\b/i, "absolute RAG guarantee"],
    [/\b(?:eliminates?|prevents?)\s+(?:all\s+)?hallucinations?\b/i, "hallucination-elimination claim"],
    [/\bcitations?\s+(?:prove|proves|guarantee|guarantees|ensure|ensures)\b/i, "citation-as-proof claim"],
    [/\b(?:universal|universally optimal|one-size-fits-all)\s+(?:chunk|top\s*k|threshold|rerank)/i, "universal retrieval setting claim"],
    [/\bmaximum marginal relevance\b|\bcrowding\b/i, "named diversification method without an assigned direct source"],
    [/512[^.]{0,80}100/i, "unsupported 512-token and 100-overlap provider default"],
  ];
  for (const [pattern, description] of forbiddenClaims) if (pattern.test(allCopy)) fail(`course copy: forbidden ${description}`);
  if (/Google[^.]{0,120}contradiction/i.test(groundAndCiteCopy)) fail("ground-and-cite: Google Check grounding must not be described as contradiction scoring");
  if (!/overall support score[^.]{0,100}claim-level support scores[^.]{0,100}citations/i.test(groundAndCiteCopy)) {
    fail("ground-and-cite: Google Check grounding must retain overall and claim-level support plus citation scope");
  }
  if (/A scanned page needs OCR\./i.test(parseAndChunkCopy) || !/OCR or image-aware vision extraction/i.test(parseAndChunkCopy)) {
    fail("parse-and-chunk: scanned-page extraction must allow OCR or image-aware vision extraction");
  }
  if (!/800-token chunks[^.]{0,60}400-token overlap/i.test(parseAndChunkCopy) || !/default 500-token chunk-size limit/i.test(parseAndChunkCopy)) {
    fail("parse-and-chunk: audited OpenAI chunk default and Google chunk-size-limit default are missing");
  }
  if (!/General chunking selected/i.test(parseAndChunkCopy) || !/Parent-child mode available/i.test(parseAndChunkCopy) || !/Replace consecutive spaces, newlines and tabs/i.test(parseAndChunkCopy)) {
    fail("parse-and-chunk: Dify screenshot alternatives must describe the visible selected mode and preprocessing label");
  }
  if (/assistant reasoning|reasoning state/i.test(groundAndCiteCopy) || !/Assistant Thinking activity cards/i.test(groundAndCiteCopy)) {
    fail("ground-and-cite: visible quickstart activity cards must not be represented as hidden model reasoning");
  }
  if (/Lexical, dense, and hybrid rankings|comparing keyword, dense, and hybrid retrieval/i.test(retrievalEngineeringCopy) || !/Keyword and dense scores feed a fused-rank/i.test(retrievalEngineeringCopy)) {
    fail("retrieval-engineering: semantic scoreboard copy must match its two numeric signal columns and fused pipeline");
  }
  if (!/Microsoft GraphRAG's standard pipeline/i.test(advancedPatternsCopy) || /GraphRAG extracts entities/i.test(advancedPatternsCopy)) {
    fail("advanced-patterns: Microsoft GraphRAG implementation details must not be universalised");
  }
  for (const boundary of ["official Anthropic knowledge-wiki architecture", "teaching diagram, not Claude.ai or product UI", "historical examples"]) {
    if (!advancedPatternsCopy.toLowerCase().includes(boundary.toLowerCase())) fail(`advanced-patterns: official diagram boundary is missing ${boundary}`);
  }
  if (/highlighted source|highlighted citation|Claim-to-source inspection/i.test(productionCapstoneCopy)) {
    fail("production-capstone: Dify screenshot must not claim highlighted markers or span inspection that are not visible");
  }
  for (const visibleLabel of ["CITATIONS panel", "remote-work-policy.md", "leave-and-time-off-policy.md", "does not expose supporting spans"]) {
    if (!productionCapstoneCopy.includes(visibleLabel)) fail(`production-capstone: Dify screenshot boundary is missing ${visibleLabel}`);
  }
  for (const boundary of [
    "it does not guarantee truth",
    "citation can point to text that does not support the claim",
    "there is no universal best value",
  ]) {
    if (!allCopy.toLowerCase().includes(boundary)) fail(`course copy: required epistemic boundary missing: ${boundary}`);
  }
}

function validateLabCopy(lab) {
  const label = "copy.lab";
  if (!requireRecord(lab, label)) return;
  const requiredKeys = [
    "kicker", "title", "description", "disclosure", "scenarioLabel", "strategyLabel", "topKLabel",
    "thresholdLabel", "rerankLabel", "rerankOn", "rerankOff", "selectedContext", "answerPreview",
    "noContext", "unsupportedContext", "sourceScore", "dense", "keyword", "hybrid", "included", "excluded", "scenarios",
  ];
  exactSet(Object.keys(lab), requiredKeys, `${label} keys`);
  for (const key of requiredKeys.filter((key) => key !== "scenarios")) requireString(lab[key], `${label}.${key}`);
  if (!/No model|No API key/i.test(lab.disclosure) || !/network request/i.test(lab.disclosure) || !/deterministic/i.test(lab.disclosure)) {
    fail(`${label}.disclosure: deterministic, no-model, no-network boundary required`);
  }
  if (!Array.isArray(lab.scenarios) || lab.scenarios.length !== 3) {
    fail(`${label}.scenarios: exactly 3 required`);
    return;
  }
  const expectedIds = ["paraphrase", "identifier", "conflict"];
  if (JSON.stringify(lab.scenarios.map((scenario) => scenario.id)) !== JSON.stringify(expectedIds)) fail(`${label}.scenarios: expected paraphrase, identifier, conflict in order`);
  lab.scenarios.forEach((scenario, index) => {
    const scenarioLabel = `${label}.scenarios[${index}]`;
    if (!exactKeys(scenario, ["id", "title", "query", "candidates", "answer", "supplements"], scenarioLabel)) return;
    for (const key of ["id", "title", "query", "answer"]) requireString(scenario[key], `${scenarioLabel}.${key}`);
    requireStringArray(scenario.candidates, `${scenarioLabel}.candidates`, { exact: 4 });
    if (requireRecord(scenario.supplements, `${scenarioLabel}.supplements`)) {
      const supplementKeys = Object.keys(scenario.supplements);
      const unexpectedKeys = supplementKeys.filter((key) => !["C1", "C2", "C3", "C4"].includes(key));
      if (unexpectedKeys.length) fail(`${scenarioLabel}.supplements: unexpected candidate keys ${unexpectedKeys.join(", ")}`);
      supplementKeys.forEach((key) => requireString(scenario.supplements[key], `${scenarioLabel}.supplements.${key}`));
    }
    if (new Set(scenario.candidates).size !== 4) fail(`${scenarioLabel}.candidates: duplicate candidate text`);
  });
  const identifier = lab.scenarios.find((scenario) => scenario.id === "identifier");
  if (!identifier?.query.includes("TS-999") || !identifier?.candidates.some((candidate) => candidate.includes("TS-999"))) fail(`${label}: rare exact-identifier scenario must exercise TS-999`);
  const paraphrase = lab.scenarios.find((scenario) => scenario.id === "paraphrase");
  if (/final.sale|receipt/i.test(paraphrase?.answer || "") || !/final.sale/i.test(paraphrase?.supplements?.C4 || "")) {
    fail(`${label}: paraphrase answer must keep C4's final-sale claim in the C4-aligned supplement`);
  }
  const conflict = lab.scenarios.find((scenario) => scenario.id === "conflict");
  const conflictText = JSON.stringify(conflict);
  if (!/Policy v3/.test(conflictText) || !/Policy v2/.test(conflictText) || !/superseded/i.test(conflictText)) fail(`${label}: conflicting-version scenario must distinguish current and superseded policy`);
  if (/14-day|superseded/i.test(conflict?.answer || "") || !/14-day/i.test(conflict?.supplements?.C2 || "")) {
    fail(`${label}: conflict answer must keep C2's superseded rule in the C2-aligned supplement`);
  }
  if (!/No chunk passed/i.test(lab.noContext) || !/Chunks passed/i.test(lab.unsupportedContext)) {
    fail(`${label}: empty retrieval and selected-but-unsupported retrieval require distinct messages`);
  }
}

function validateInteractionContracts(copy) {
  const interactions = readText("components/rag/RagInteractions.tsx");
  const lab = readText("components/rag/RetrievalLab.tsx");
  const hydration = readText("components/rag/useRagHydrated.ts");
  const dashboard = readText("components/rag/CourseDashboard.tsx");
  const figure = readText("components/rag/RagFigure.tsx");
  const lessonView = readText("components/rag/LessonView.tsx");
  const progress = readText("components/rag/progress-store.ts");

  for (const marker of [
    "lessons.map((lesson)",
    "<FinalQuiz questions={quizQuestions}",
    "score >= 9",
    "finalScore >= 9",
    "questions.length",
    "RAG_QUIZ_BEST_KEY",
    "RAG_QUIZ_PASSED_KEY",
  ]) if (!`${dashboard}\n${interactions}`.includes(marker)) fail(`assessment implementation: missing ${marker}`);
  if (copy?.ui?.quizIntro !== "Answer 12 scenario questions. Nine correct answers pass. Your best score stays in this browser.") fail("copy.ui.quizIntro: final assessment contract must be 12 questions with 9 required");
  if (copy?.ui?.passRequirement !== "9 of 12 correct required") fail("copy.ui.passRequirement: expected 9 of 12");

  for (const marker of [
    'RAG_PROGRESS_STORAGE_KEY = "ae.progress"',
    'RAG_PROGRESS_PREFIX = "rag."',
    'RAG_QUIZ_BEST_KEY = "rag.quiz.best"',
    'RAG_QUIZ_PASSED_KEY = "rag.quiz.passed"',
    'RAG_QUIZ_DRAFT_KEY = "rag.quiz.draft.v1"',
    'RAG_CAPSTONE_KEY = "rag.capstone.v1"',
    'RAG_CAPSTONE_DRAFT_KEY = "rag.capstone.draft.v1"',
    'RAG_RESET_EVENT = "aicourse:rag-progress-reset"',
    'CORRUPT_BACKUP_KEY = "ae.progress.corrupt-backup"',
    "recoverCorruptProgress",
    "key.startsWith(RAG_PROGRESS_PREFIX)",
    "window.dispatchEvent(new CustomEvent(RAG_RESET_EVENT))",
  ]) if (!progress.includes(marker)) fail(`progress implementation: missing scoped marker ${marker}`);
  for (const marker of ["lessons.length + 2", "practices + quiz + capstone", "ragPracticeKey(lesson.slug)"]) {
    if (!interactions.includes(marker)) fail(`progress implementation: 14 equal milestones require ${marker}`);
  }
  if (!interactions.includes("window.addEventListener(RAG_RESET_EVENT")) {
    fail("progress implementation: quiz and capstone local state must subscribe to the scoped reset event");
  }
  for (const marker of ["parseQuizDraft", "RAG_QUIZ_DRAFT_KEY", "RAG_CAPSTONE_DRAFT_KEY", "delete record[RAG_QUIZ_DRAFT_KEY]", "delete record[RAG_CAPSTONE_DRAFT_KEY]"]) {
    if (!interactions.includes(marker)) fail(`draft persistence: missing scoped marker ${marker}`);
  }
  if (!interactions.includes('aria-labelledby="rag-progress-title"')) {
    fail("progress implementation: native progress element must expose the visible Course progress name");
  }
  for (const marker of ["queueMicrotask(notify)", "() => true", "() => false"]) {
    if (!hydration.includes(marker)) fail(`hydration implementation: missing client-readiness marker ${marker}`);
  }
  if (!interactions.includes('data-rag-hydrated={hydrated ? "true" : "false"}') || !interactions.includes("disabled={!hydrated}")) {
    fail("interaction hydration: stateful progress and assessment controls must remain disabled until React is ready");
  }
  for (const marker of ["checkpoint.sourceId", "lesson.sources.find", "data-testid=\"rag-catalog-label\"", "lang={course.locale}"]) {
    if (!dashboard.includes(marker)) fail(`dashboard: explicit checkpoint evidence or localized catalog label is missing ${marker}`);
  }
  for (const marker of ["state.nextHref?.startsWith", "window.requestAnimationFrame", "document.querySelector<HTMLElement>", "tabIndex={-1}"]) {
    if (!interactions.includes(marker)) fail(`progress fragment navigation: missing focus-transfer marker ${marker}`);
  }

  for (const marker of [
    '["dense", "keyword", "hybrid"]',
    'type="range"',
    "setTopK",
    "setThreshold",
    "setRerank",
    "candidate.included",
    "copy.noContext",
    "copy.unsupportedContext",
    "selected.length === 0",
    "scenario.supplements",
    "citedCandidates",
    'scenario: "ragScenario"',
    'strategy: "ragStrategy"',
    "window.history.replaceState",
    'data-rag-url-ready={urlReady ? "true" : "false"}',
  ]) if (!lab.includes(marker)) fail(`retrieval lab: missing deterministic control ${marker}`);
  if (!lab.includes('data-rag-hydrated={hydrated ? "true" : "false"}') || !lab.includes("disabled={!hydrated}")) {
    fail("retrieval lab: controls must remain disabled until React is ready");
  }
  if (/\bfetch\s*\(|\baxios\b|new\s+WebSocket\s*\(|XMLHttpRequest/.test(lab)) fail("retrieval lab: network access is forbidden in the deterministic teaching simulation");
  if (/<output\b/.test(lab)) fail("retrieval lab: inline control values must not create competing live status regions");
  if (!lessonView.includes('lesson.slug === "retrieval-engineering" ? <RetrievalLab')) fail("lesson view: retrieval lab is not mounted in the retrieval-engineering lesson");
  if (!lessonView.includes('lesson.slug === "production-capstone"')) fail("lesson view: production capstone checklist is not mounted");
  for (const marker of ["heroRaster.upstreamUrl", 'href="/courses/rag/NOTICE.md"', 'fetchPriority="high"', "heroRaster.upstreamCommit"]) {
    if (!dashboard.includes(marker)) fail(`dashboard hero figure: missing provenance or priority marker ${marker}`);
  }
  if (!dashboard.includes('role="group"') || !figure.includes("labels.openOriginal") || !lessonView.includes("estimatedLessonTime")) {
    fail("accessibility copy: hero principles, original-image action, and lesson-duration label must be explicit");
  }
  for (const marker of ["<table>", "<caption", '<th scope="col">', '<th scope="row">', "<ol>{copy.transcript.map"]) {
    if (!figure.includes(marker)) fail(`retrieval scoreboard: missing semantic table marker ${marker}`);
  }
  if (figure.includes('role="table"')) fail("retrieval scoreboard: simulated role table must not replace semantic table markup");
  if (!figure.includes('role="group"') || figure.includes('role="img"')) {
    fail("semantic figures: labelled group must preserve nested list and table semantics");
  }

  const referencedUiKeys = new Set();
  for (const source of [interactions, dashboard, lessonView, figure]) {
    for (const match of source.matchAll(/\b(?:labels|course\.copy\.ui)\.([A-Za-z][A-Za-z0-9]*)/g)) referencedUiKeys.add(match[1]);
  }
  for (const key of referencedUiKeys) if (!Object.hasOwn(copy?.ui || {}, key)) fail(`messages/rag/en.json.ui: component references missing key ${key}`);
}

function placeholderSet(value) {
  return [...value.matchAll(/\{[A-Za-z0-9_]+\}/g)].map((match) => match[0]).sort();
}

function validateLocaleValue(reference, localized, locale, path, stats) {
  if (typeof reference === "string") {
    stats.total += 1;
    if (typeof localized !== "string" || !localized.trim()) {
      fail(`messages/rag/${locale}.json ${path}: expected a nonempty localized string`);
      return;
    }
    if (/\b(?:TODO|TBD)\b/.test(localized) || /\[(?:translation|translate)\]/i.test(localized) || localized.includes("\uFFFD")) {
      fail(`messages/rag/${locale}.json ${path}: placeholder or replacement character found`);
    }
    if (JSON.stringify(placeholderSet(reference)) !== JSON.stringify(placeholderSet(localized))) {
      fail(`messages/rag/${locale}.json ${path}: interpolation placeholders differ from English`);
    }
    if ((path.endsWith(".id") || path.endsWith(".sourceId")) && localized !== reference) {
      fail(`messages/rag/${locale}.json ${path}: stable identifier must remain ${reference}`);
    }
    if (localized !== reference) stats.changed += 1;
    return;
  }
  if (Array.isArray(reference)) {
    if (!Array.isArray(localized) || localized.length !== reference.length) {
      fail(`messages/rag/${locale}.json ${path}: expected array length ${reference.length}`);
      return;
    }
    reference.forEach((item, index) => validateLocaleValue(item, localized[index], locale, `${path}[${index}]`, stats));
    return;
  }
  if (isRecord(reference)) {
    if (!isRecord(localized)) {
      fail(`messages/rag/${locale}.json ${path}: expected an object`);
      return;
    }
    const referenceKeys = Object.keys(reference).sort();
    const localizedKeys = Object.keys(localized).sort();
    if (JSON.stringify(referenceKeys) !== JSON.stringify(localizedKeys)) {
      fail(`messages/rag/${locale}.json ${path}: object keys differ from English`);
      return;
    }
    for (const key of referenceKeys) validateLocaleValue(reference[key], localized[key], locale, `${path}.${key}`, stats);
    return;
  }
  if (localized !== reference) fail(`messages/rag/${locale}.json ${path}: non-string value must remain ${JSON.stringify(reference)}`);
}

function validateLocalizedContract(copies) {
  const copy = copies.en;
  if (!copy) return;
  const scriptChecks = {
    "zh-Hans": /[\u3400-\u9fff]/g,
    "zh-Hant": /[\u3400-\u9fff]/g,
    ja: /[\u3040-\u30ff]/g,
    ko: /[\uac00-\ud7af]/g,
    ar: /[\u0600-\u06ff]/g,
  };
  for (const locale of EXPECTED_LOCALES.filter((value) => value !== "en")) {
    const localized = copies[locale];
    if (!localized) continue;
    const stats = { total: 0, changed: 0 };
    validateLocaleValue(copy, localized, locale, "$", stats);
    const changedRatio = stats.total ? stats.changed / stats.total : 0;
    // Stable IDs, code tokens, product names, filenames, URLs, and standard RAG
    // terminology intentionally remain unchanged, especially in Arabic copy.
    if (changedRatio < 0.65) fail(`messages/rag/${locale}.json: only ${(changedRatio * 100).toFixed(1)}% of strings differ from English`);
    const scriptPattern = scriptChecks[locale];
    if (scriptPattern && (JSON.stringify(localized).match(scriptPattern)?.length || 0) < 80) {
      fail(`messages/rag/${locale}.json: expected substantial ${locale} script content`);
    }
  }

  const load = readText("lib/rag/load.ts");
  const dashboard = readText("components/rag/CourseDashboard.tsx");
  const lesson = readText("components/rag/LessonView.tsx");
  const coursePage = readText("app/[locale]/rag/page.tsx");
  const lessonPage = readText("app/[locale]/rag/[lesson]/page.tsx");
  for (const locale of EXPECTED_LOCALES) {
    if (!load.includes(`@/messages/rag/${locale}.json`)) fail(`localized loader: missing ${locale} copy import`);
  }
  for (const marker of [
    "COPY_BY_LOCALE",
    "COPY_BY_LOCALE[locale]",
    "contentLocale: locale",
    "RAG_FIGURE_BY_ID",
    "RAG_SOURCE_BY_ID",
    "lesson.sourceIds.map",
    "RAG_COURSE_MANIFEST.lessons.map",
    "materializeLesson",
  ]) if (!load.includes(marker)) fail(`localized loader contract: missing ${marker}`);
  if (Object.hasOwn(copy.ui || {}, "englishOnly") || dashboard.includes("englishOnly") || lesson.includes("englishOnly")) {
    fail("localized views: obsolete English-only disclosure remains");
  }
  if (!dashboard.includes("lang={course.contentLocale}") || !dashboard.includes('dir={course.contentLocale === "ar" ? "rtl" : "ltr"}')) {
    fail("dashboard view: localized lang and Arabic RTL contract is missing");
  }
  if (!lesson.includes("lang={course.contentLocale}") || !lesson.includes('course.contentLocale === "ar" ? "rtl" : "ltr"') || !lesson.includes("dir={direction}")) {
    fail("lesson view: localized lang and Arabic RTL contract is missing");
  }
  for (const [path, source] of [["course page", coursePage], ["lesson page", lessonPage]]) {
    if (!source.includes("inLanguage: course.contentLocale")) fail(`${path}: JSON-LD must disclose the localized content language`);
    if (!source.includes("availableLocales: RAG_LOCALES") || !source.includes("canonicalLocale: locale")) {
      fail(`${path}: metadata must emit self-canonical nine-locale alternates`);
    }
    if (!source.includes("urlFor(course.contentLocale")) {
      fail(`${path}: structured-data URLs must use the localized content locale`);
    }
  }
}

function validateRoutesAndIntegration() {
  const requiredFiles = [
    "app/[locale]/rag/page.tsx",
    "app/[locale]/rag/[lesson]/page.tsx",
    "components/rag/CourseDashboard.tsx",
    "components/rag/LessonView.tsx",
    "components/rag/RagFigure.tsx",
    "components/rag/RetrievalLab.tsx",
    "components/rag/RagInteractions.tsx",
    "components/rag/useRagHydrated.ts",
    "components/rag/progress-store.ts",
    "components/rag/RagCourse.module.css",
  ];
  for (const file of requiredFiles) if (!existsSync(join(ROOT, file))) fail(`${file}: required Course 9 file is missing`);
  const courseCss = readText("components/rag/RagCourse.module.css");
  for (const marker of ["min-block-size: 44px", "text-wrap: balance", "text-wrap: pretty", "font-variant-numeric: tabular-nums", "touch-action: manipulation"]) {
    if (!courseCss.includes(marker)) fail(`Course 9 accessibility styles: missing ${marker}`);
  }

  const coursePage = readText("app/[locale]/rag/page.tsx");
  for (const marker of ["dynamicParams = false", "generateStaticParams", "RAG_LOCALES.map", "await params", 'page: "rag/"']) {
    if (!coursePage.includes(marker)) fail(`RAG dashboard route: missing static-export marker ${marker}`);
  }
  const lessonPage = readText("app/[locale]/rag/[lesson]/page.tsx");
  for (const marker of ["dynamicParams = false", "generateStaticParams", "RAG_LESSON_SLUGS.map", "await params", "ragLessonPage(lesson)"]) {
    if (!lessonPage.includes(marker)) fail(`RAG lesson route: missing static-export marker ${marker}`);
  }

  const seo = readText("lib/seo.ts");
  if (!seo.includes('"rag/"') || !seo.includes("RAG_LESSON_PAGES") || !seo.includes("function ragLessonPage")) fail("lib/seo.ts: RAG dashboard registry or route guard missing");
  for (const slug of EXPECTED_LESSONS) if (!seo.includes(`"rag/${slug}/"`)) fail(`lib/seo.ts: missing rag/${slug}/`);
  const sitemap = readText("app/sitemap.ts");
  if (!sitemap.includes("PAGES.flatMap") || !sitemap.includes("LOCALE_CODES") || !sitemap.includes("availableLocales.map")) {
    fail("app/sitemap.ts: locale-expanded PAGES registry is not used");
  }
  if (!sitemap.includes('page === "rag/"') || !sitemap.includes('page.startsWith("rag/")') || !sitemap.includes("RAG_LOCALES")) {
    fail("app/sitemap.ts: Course 9 pages must publish all nine localized sitemap entries");
  }

  const courses = readText("lib/courses.ts");
  for (const marker of [
    'id: "rag"',
    "displayNumber: 9",
    'href: "/rag/"',
    'hue: "var(--sky)"',
    'progressStrategy: "fourteen-equal-milestones"',
    'p["rag.quiz.passed"]',
    'p["rag.capstone.v1"]',
  ]) if (!courses.includes(marker)) fail(`lib/courses.ts: missing Course 9 contract ${marker}`);
  const catalog = readText("components/courses/Catalog.tsx");
  if (!catalog.includes('course.id === "rag"') || !catalog.includes('"retrieval-augmented-generation"')) fail("components/courses/Catalog.tsx: Course 9 identity or stable anchor missing");
  if (catalog.includes('(isRag || isClaudeIncome) && locale !== "en"') || catalog.includes('t(isRag ? "c.rag.contentLanguage"')) {
    fail("components/courses/Catalog.tsx: obsolete English-only Course 9 disclosure remains");
  }
  if (!catalog.includes('isClaudeIncome && locale !== "en"')) fail("components/courses/Catalog.tsx: unrelated Claude Income language boundary was not preserved");
  const cover = readText("components/courses/Cover.tsx");
  if (!cover.includes('id === "rag"') || !cover.includes("data-course-cover={id}")) fail("components/courses/Cover.tsx: Course 9 cover mapping missing");
  const shell = readText("components/Shell.tsx");
  if (!shell.includes('p("/rag/")') || !shell.includes('t("c.rag.title")')) fail("components/Shell.tsx: Course 9 navigation link missing");

  const coursesPage = readText("app/[locale]/courses/page.tsx");
  for (const marker of ["loadRagCourse", "RAG_LESSONS", "courseNineParts", "rag: courseNineParts"]) {
    if (!coursesPage.includes(marker)) fail(`courses page: Course 9 hasPart integration missing ${marker}`);
  }
  if (!coursesPage.includes("inLanguage: ragCourse.contentLocale") || !coursesPage.includes("urlFor(ragCourse.contentLocale)")) {
    fail("courses page: Course 9 lesson resources must use the localized content locale");
  }
  if (!/course\.id === "rag"\s*\?\s*ragCourse\.contentLocale/.test(coursesPage)) {
    fail("courses page: Course 9 ItemList must disclose its localized content language");
  }

  const ragDashboardPage = readText("app/[locale]/rag/page.tsx");
  const ragLessonPageSource = readText("app/[locale]/rag/[lesson]/page.tsx");
  const lessonView = readText("components/rag/LessonView.tsx");
  if (!ragDashboardPage.includes("name: course.copy.ui.catalogName") || !ragLessonPageSource.includes("name: course.copy.ui.catalogName")) {
    fail("RAG JSON-LD: localized breadcrumbs must use the localized catalog name");
  }
  if (!lessonView.includes("aria-label={course.copy.ui.breadcrumb}") || !lessonView.includes("styles.breadcrumbCourseLink") || !lessonView.includes("aria-label={course.copy.ui.takeaway}")) {
    fail("lesson accessibility: breadcrumb, mobile wrapping, or takeaway landmark contract is missing");
  }

  for (const locale of EXPECTED_LOCALES) {
    const root = readJson(`messages/${locale}.json`);
    if (!root) continue;
    for (const key of ["cat.course9", "c.rag.title", "c.rag.blurb", "c.rag.level", "c.rag.meta", "c.rag.contentLanguage"]) {
      if (typeof root[key] !== "string" || !root[key].trim()) fail(`messages/${locale}.json: missing ${key}`);
    }
  }

  const packageJson = readJson("package.json");
  for (const scriptName of ["build", "build:release"]) {
    if (!String(packageJson?.scripts?.[scriptName] || "").includes("npm run rag:check:release")) {
      fail(`package.json scripts.${scriptName}: Course 9 release gate must run before next build`);
    }
  }
  const readme = readText("README.md");
  for (const marker of ["twelve lessons in nine languages", "one official Anthropic teaching diagram", "Six additional figures are original semantic HTML", "Arabic course views render right to left"]) {
    if (!readme.includes(marker)) fail(`README.md: Course 9 release description is missing ${marker}`);
  }
}

const ledgers = loadLedgers();
const copies = Object.fromEntries(EXPECTED_LOCALES.map((locale) => [locale, readJson(`messages/rag/${locale}.json`)]));
const copy = copies.en;
if (ledgers) {
  validateManifest(ledgers);
  validateSources(ledgers);
  validateFigures(ledgers);
}
validateFigureNotice();
validateCopy(copy);
validateInteractionContracts(copy);
validateLocalizedContract(copies);
validateRoutesAndIntegration();

const figureBytes = existsSync(join(ROOT, "public", "courses", "rag", "figures"))
  ? readdirSync(join(ROOT, "public", "courses", "rag", "figures")).reduce((total, file) => total + statSync(join(ROOT, "public", "courses", "rag", "figures", file)).size, 0)
  : 0;
const result = {
  ok: errors.length === 0 && (!RELEASE || warnings.length === 0),
  release: RELEASE,
  course: "rag",
  sequence: 9,
  lessons: ledgers?.manifest?.lessons?.length ?? 0,
  minutes: ledgers?.manifest?.lessons?.reduce((total, lesson) => total + lesson.minutes, 0) ?? 0,
  concepts: ledgers?.conceptIds?.length ?? 0,
  sources: ledgers?.sources?.length ?? 0,
  officialLearningSources: ledgers ? {
    total: ledgers.sources.filter((source) => ["official-course", "official-event", "official-video"].includes(source.evidenceLabel)).length,
    courses: ledgers.sources.filter((source) => source.evidenceLabel === "official-course").length,
    events: ledgers.sources.filter((source) => source.evidenceLabel === "official-event").length,
    videos: ledgers.sources.filter((source) => source.evidenceLabel === "official-video").length,
  } : { total: 0, courses: 0, events: 0, videos: 0 },
  userReports: ledgers?.sources?.filter((source) => source.evidenceLabel === "individual-user-report").length ?? 0,
  figures: ledgers?.figures?.length ?? 0,
  authenticUiFigures: ledgers?.figures?.filter((figure) => figure.authenticUi).length ?? 0,
  claudeUiFigures: ledgers?.figures?.filter((figure) => figure.product === "Claude-powered Anthropic quickstart").length ?? 0,
  officialTeachingFigures: ledgers?.figures?.filter((figure) => figure.format === "official-teaching-diagram").length ?? 0,
  figureBytes,
  assessment: "12 questions; pass 9",
  progressMilestones: 14,
  contentLocales: EXPECTED_LOCALES,
  routeLocales: EXPECTED_LOCALES.length,
  warnings,
  errors,
};

if (JSON_OUTPUT) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else if (result.ok) {
  console.log(`PASS Course 9 RAG release gate: ${result.lessons} lessons, ${result.minutes} minutes, ${result.concepts} concepts, ${result.sources} sources, ${result.authenticUiFigures} authentic UI figures, ${result.officialTeachingFigures} official teaching diagram, ${result.routeLocales} localized routes, ${result.assessment}.`);
  warnings.forEach((message) => console.warn(`WARN ${message}`));
} else {
  console.error(`FAIL Course 9 RAG release gate with ${errors.length} error(s) and ${warnings.length} warning(s):`);
  errors.forEach((message) => console.error(`- ${message}`));
  warnings.forEach((message) => console.error(`- WARN ${message}`));
}

if (errors.length || (RELEASE && warnings.length)) process.exitCode = 1;
