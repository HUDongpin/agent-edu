#!/usr/bin/env node

/**
 * Deterministic offline quality gate for MCP Course 10.
 *
 *   node --import tsx scripts/check-mcp-course.mjs
 *   node --import tsx scripts/check-mcp-course.mjs --release
 *   node --import tsx scripts/check-mcp-course.mjs --links
 *   node --import tsx scripts/check-mcp-course.mjs --json
 */

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  MCP_ASSESSMENT_VERSION,
  MCP_CLAIM_MAP,
  MCP_CONCEPTS,
  MCP_COURSE_SEQUENCE,
  MCP_COURSE_VERSION,
  MCP_EXTENSIONS,
  MCP_FIGURES,
  MCP_FINAL_ASSESSMENT,
  MCP_FINAL_DISPLAY_CORRECT_INDEXES,
  MCP_LESSONS,
  MCP_LESSON_DISPLAY_CORRECT_INDEXES,
  MCP_LOCALES,
  MCP_PROTOCOL_VERSION,
  MCP_SOURCES,
  MCP_UNITS,
  presentMcpOptions,
} from "../lib/mcp/index.ts";
import { MCP_ENGLISH_UI_COPY } from "../lib/mcp/copy.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = resolve(ROOT, "public");
const RELEASE = process.argv.includes("--release");
const CHECK_LINKS = process.argv.includes("--links");
const JSON_OUTPUT = process.argv.includes("--json");
const errors = [];
const warnings = [];
const notes = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const note = (message) => notes.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

const REQUIRED_FILES = [
  "app/[locale]/mcp/page.tsx",
  "app/[locale]/mcp/[lesson]/page.tsx",
  "components/mcp/CapstoneChecklist.tsx",
  "components/mcp/CourseDashboard.tsx",
  "components/mcp/CourseProgress.tsx",
  "components/mcp/FinalAssessment.tsx",
  "components/mcp/InteractiveLab.tsx",
  "components/mcp/KnowledgeCheck.tsx",
  "components/mcp/LessonCompletion.tsx",
  "components/mcp/LessonView.tsx",
  "components/mcp/McpCourse.module.css",
  "components/mcp/McpFigure.tsx",
  "components/mcp/progress-store.ts",
  "components/mcp/useMcpProgress.ts",
  "examples/mcp-courseops/README.md",
  "examples/mcp-courseops/package-lock.json",
  "examples/mcp-courseops/src/client.mjs",
  "examples/mcp-courseops/src/server.mjs",
  "examples/mcp-courseops/test/courseops.test.mjs",
  "lib/mcp/assessment.ts",
  "lib/mcp/claims.ts",
  "lib/mcp/copy.ts",
  "lib/mcp/course.ts",
  "lib/mcp/extensions.ts",
  "lib/mcp/figures.ts",
  "lib/mcp/index.ts",
  "lib/mcp/load.ts",
  "lib/mcp/format.ts",
  "lib/mcp/sources.ts",
  "lib/mcp/types.ts",
  "outputs/mcp-browser-qa.md",
  "outputs/mcp-course-research-brief.md",
  "outputs/mcp-course-research-brief.provenance.md",
  "outputs/mcp-host-ui-capture-provenance.md",
  "public/courses/mcp/MCP_CAPSTONE_EVIDENCE_PACK.md",
  "public/courses/mcp/NOTICE.md",
  "public/courses/mcp/licenses/APACHE-2.0.txt",
  "public/courses/mcp/licenses/CODEX-NOTICE.txt",
  "public/courses/mcp/courseops-reference.zip",
  "public/courses/mcp/courseops-reference.sha256",
  "public/courses/mcp/figure-manifest.json",
  "scripts/build-mcp-figure-derivatives.mjs",
  "scripts/build-mcp-host-captures.mjs",
  "scripts/build-mcp-courseops-archive.mjs",
  "scripts/build-mcp-capstone-packs.mjs",
  "scripts/build-mcp-locales.mjs",
  "scripts/audit-mcp-export.mjs",
  "scripts/test-mcp-export.mjs",
  "tests/mcp-course.spec.ts",
  "tests/mcp-playwright.config.ts",
  ...MCP_LOCALES.map((locale) => `messages/mcp/${locale}.json`),
  ...MCP_LOCALES.map((locale) => `public/courses/mcp/capstone/MCP_CAPSTONE_EVIDENCE_PACK-${locale}.md`),
];

function regularFile(path, label = rel(path)) {
  if (!existsSync(path)) {
    fail(`${label}: required file is missing`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${label}: expected a regular non-symbolic file`);
    return false;
  }
  return true;
}

function readText(name) {
  const path = resolve(ROOT, name);
  return regularFile(path, name) ? readFileSync(path, "utf8") : "";
}

function readJson(name) {
  const text = readText(name);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${name}: invalid JSON (${error.message})`);
    return null;
  }
}

function unique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) fail(`${label}: duplicate ${value}`);
    seen.add(value);
  }
  return seen;
}

function exactKeys(actual, expected, label) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    fail(`${label}: key set mismatch (expected ${right.join(", ")}; found ${left.join(", ")})`);
  }
}

function compareCopyShape(reference, candidate, label, path = "") {
  const location = path ? `${label}.${path}` : label;
  if (typeof reference === "string") {
    if (typeof candidate !== "string") fail(`${location}: expected a string`);
    else if (!candidate.trim()) fail(`${location}: localized copy is empty`);
    return;
  }
  if (Array.isArray(reference)) {
    if (!Array.isArray(candidate)) {
      fail(`${location}: expected an array`);
      return;
    }
    if (candidate.length !== reference.length) fail(`${location}: expected ${reference.length} items, found ${candidate.length}`);
    reference.forEach((item, index) => compareCopyShape(item, candidate[index], label, path ? `${path}.${index}` : String(index)));
    return;
  }
  if (reference && typeof reference === "object") {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      fail(`${location}: expected an object`);
      return;
    }
    exactKeys(Object.keys(candidate), Object.keys(reference), `${location} object`);
    for (const [key, value] of Object.entries(reference)) {
      compareCopyShape(value, candidate[key], label, path ? `${path}.${key}` : key);
    }
    return;
  }
  if (candidate !== reference) fail(`${location}: scalar invariant changed`);
}

function stringLeaves(value, path = [], output = []) {
  if (typeof value === "string") output.push({ path: path.join("."), value });
  else if (Array.isArray(value)) value.forEach((item, index) => stringLeaves(item, [...path, String(index)], output));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => stringLeaves(item, [...path, key], output));
  return output;
}

const REQUIRED_TECHNICAL_TERMS = [
  "MCP Inspector",
  "Streamable HTTP",
  "Gemini CLI",
  "Codex CLI",
  "CourseOps",
  "JSON-RPC",
  "HTTP+SSE",
  "HTTP 202 Accepted",
  "MRTR",
  "OAuth",
  "MCP Apps",
  "MCP App",
  "MCP Tasks",
  "MCP",
  "SDK",
  "DCR",
];

function technicalTokens(text) {
  const values = new Set();
  for (const term of REQUIRED_TECHNICAL_TERMS) if (text.includes(term)) values.add(term);
  for (const match of text.matchAll(/https?:\/\/[^\s)]+|\{[A-Za-z][A-Za-z0-9]*\}|\b(?:application\/json|text\/event-stream|text\/html|(?:server|tools|resources|prompts|completion|logging|elicitation|sampling|roots|notifications|tasks)\/[A-Za-z][A-Za-z0-9_-]*)\b|\b(?:initialize|Mcp-[A-Za-z-]+|x-mcp-header|Last-Event-ID|_meta|inputSchema|outputSchema|structuredContent|resultType|requestState|inputResponses|nextCursor|ttlMs|cacheScope|readOnlyHint|destructiveHint|idempotentHint|openWorldHint|clientInfo|HeaderMismatch|UnsupportedProtocolVersionError)\b|\b20\d{2}-\d{2}-\d{2}(?:-v\d+)?\b/g)) {
    values.add(match[0]);
  }
  return [...values];
}

function checkLocalization() {
  const english = readJson("messages/mcp/en.json");
  if (!english) return;
  exactKeys(Object.keys(english.ui ?? {}), Object.keys(MCP_ENGLISH_UI_COPY), "messages/mcp/en.json.ui");
  exactKeys(Object.keys(english.units ?? {}), MCP_UNITS.map((unit) => unit.id), "English MCP units");
  exactKeys(Object.keys(english.concepts ?? {}), MCP_CONCEPTS.map((concept) => concept.id), "English MCP concepts");
  exactKeys(Object.keys(english.lessons ?? {}), MCP_LESSONS.map((lesson) => lesson.slug), "English MCP lessons");
  exactKeys(Object.keys(english.assessment ?? {}), MCP_FINAL_ASSESSMENT.map((question) => question.id), "English MCP assessment");
  exactKeys(Object.keys(english.figures ?? {}), MCP_FIGURES.map((figure) => figure.id), "English MCP figures");
  exactKeys(Object.keys(english.sourceNotes ?? {}), MCP_SOURCES.map((source) => source.id), "English MCP source notes");
  exactKeys(Object.keys(english.claims ?? {}), MCP_CLAIM_MAP.map((claim) => claim.id), "English MCP claims");
  exactKeys(Object.keys(english.extensions ?? {}), MCP_EXTENSIONS.map((extension) => extension.id), "English MCP extensions");

  const englishLeaves = stringLeaves(english).filter((entry) => !entry.path.startsWith("_meta."));
  const localizedCopies = new Map();

  for (const locale of MCP_LOCALES) {
    const name = `messages/mcp/${locale}.json`;
    const copy = readJson(name);
    if (!copy) continue;
    localizedCopies.set(locale, copy);
    compareCopyShape(english, copy, name);
    if (copy._meta?.locale !== locale || copy._meta?.sourceLocale !== "en") fail(`${name}: locale metadata mismatch`);
    if (locale === "en") {
      if (copy._meta?.translationMethod !== "authored-source" || copy._meta?.reviewStatus !== "source-authored") fail(`${name}: English source authorship metadata is incorrect`);
    } else if (copy._meta?.translationMethod !== "machine-translated" || copy._meta?.reviewStatus !== "automated-structure-and-terminology-reviewed") {
      fail(`${name}: translation provenance must disclose machine translation and automated review without claiming human review`);
    }

    const leaves = stringLeaves(copy).filter((entry) => !entry.path.startsWith("_meta."));
    const byPath = new Map(leaves.map((entry) => [entry.path, entry.value]));
    let identicalLong = 0;
    let eligibleLong = 0;
    for (const { path, value: source } of englishLeaves) {
      const localized = byPath.get(path);
      if (typeof localized !== "string") continue;
      if (/[\u202A-\u202E\u2066-\u2069]/u.test(localized)) fail(`${name}.${path}: unsafe bidi embedding, override, or isolate control`);
      if (/ZXQ|ZQQ|QXZ|QTKZ|T[KQ]\d{3,}|[⟦⟧]|<\/?x-keep\b|data-i\s*=|<\/?span\b[^>]*\bid\s*=\s*["']?x\d{4}/u.test(localized)) fail(`${name}.${path}: leaked translation sentinel`);
      const sourcePlaceholders = [...source.matchAll(/\{[A-Za-z][A-Za-z0-9]*\}/g)].map((match) => match[0]).sort();
      const localizedPlaceholders = [...localized.matchAll(/\{[A-Za-z][A-Za-z0-9]*\}/g)].map((match) => match[0]).sort();
      if (JSON.stringify(sourcePlaceholders) !== JSON.stringify(localizedPlaceholders)) fail(`${name}.${path}: template placeholders changed`);
      for (const token of technicalTokens(source)) if (!localized.includes(token)) fail(`${name}.${path}: required technical token changed or disappeared (${token})`);
      if (locale !== "en" && source.length >= 80 && /[A-Za-z]{5}/.test(source)) {
        eligibleLong += 1;
        if (localized === source) identicalLong += 1;
      }
    }
    if (locale !== "en" && eligibleLong && identicalLong / eligibleLong > 0.08) fail(`${name}: too much long-form English remains unchanged (${identicalLong}/${eligibleLong})`);

    for (const lesson of MCP_LESSONS) {
      const localizedLesson = copy.lessons?.[lesson.slug];
      if (localizedLesson?.sections?.length !== lesson.sections.length) fail(`${name}: ${lesson.slug} section count changed`);
      if (localizedLesson?.check?.options?.length !== 4) fail(`${name}: ${lesson.slug} formative check must retain four options`);
    }
    for (const question of MCP_FINAL_ASSESSMENT) {
      if (copy.assessment?.[question.id]?.options?.length !== 4) fail(`${name}: ${question.id} assessment must retain four options`);
    }
    if (!String(copy.assessment?.["tool-name-collision"]?.question).includes("search")) {
      fail(`${name}: tool-name-collision must preserve the literal tool identifier search`);
    }
  }

  const simplified = localizedCopies.get("zh-Hans");
  const traditional = localizedCopies.get("zh-Hant");
  if (simplified && traditional) {
    const simplifiedLeaves = new Map(stringLeaves(simplified).map((entry) => [entry.path, entry.value]));
    const distinctions = stringLeaves(traditional).filter((entry) => simplifiedLeaves.get(entry.path) !== entry.value).length;
    if (distinctions < 300) fail(`zh-Hans and zh-Hant are not meaningfully distinct enough (${distinctions} differing strings)`);
  }
  const arabic = localizedCopies.get("ar");
  if (arabic) {
    const text = stringLeaves(arabic).map((entry) => entry.value).join(" ");
    if ((text.match(/[\u0600-\u06ff]/g) ?? []).length < 20_000) fail("Arabic bundle lacks substantial Arabic instructional text");
  }

  const componentRoot = resolve(ROOT, "components/mcp");
  const componentText = readdirSync(componentRoot).filter((name) => /\.(?:ts|tsx)$/.test(name)).map((name) => readFileSync(resolve(componentRoot, name), "utf8")).join("\n");
  for (const stale of ["Private browser progress", "Knowledge check", "Final protocol and practice check", "Auditable capstone", "Evidence checkpoint", "Interactive practice", "Sources used in this lesson"]) {
    if (componentText.includes(stale)) fail(`hard-coded learner-facing English remains in MCP components: ${stale}`);
  }
  const css = readText("components/mcp/McpCourse.module.css");
  if (/content:\s*["']Takeaway/u.test(css)) fail("localized takeaway label must not be generated by CSS");
  note(`${MCP_LOCALES.length} complete MCP locale bundles; ${englishLeaves.length} localized string leaves per bundle`);
}

function assetPath(rootRelativePath, label) {
  if (typeof rootRelativePath !== "string" || !rootRelativePath.startsWith("/")) {
    fail(`${label}: asset path must be root-relative`);
    return null;
  }
  const path = resolve(PUBLIC_ROOT, `.${rootRelativePath}`);
  if (path !== PUBLIC_ROOT && !path.startsWith(`${PUBLIC_ROOT}${sep}`)) {
    fail(`${label}: asset path escapes public/`);
    return null;
  }
  return path;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pngDimensions(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const size = bytes.readUInt16BE(offset + 2);
    if (size < 2 || offset + 2 + size > bytes.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += 2 + size;
  }
  return null;
}

function webpDimensions(bytes) {
  if (bytes.length < 20 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > bytes.length) return null;
    if (type === "VP8X" && size >= 10) return { width: 1 + bytes.readUIntLE(data + 4, 3), height: 1 + bytes.readUIntLE(data + 7, 3) };
    if (type === "VP8 " && size >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
      return { width: bytes.readUInt16LE(data + 6) & 0x3fff, height: bytes.readUInt16LE(data + 8) & 0x3fff };
    }
    if (type === "VP8L" && size >= 5 && bytes[data] === 0x2f) {
      const bits = bytes.readUInt32LE(data + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    offset = data + size + (size % 2);
  }
  return null;
}

function imageDimensions(path, bytes) {
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return pngDimensions(bytes);
  if (extension === ".jpg" || extension === ".jpeg") return jpegDimensions(bytes);
  if (extension === ".webp") return webpDimensions(bytes);
  return null;
}

function hasSimplePeriod(sequence) {
  for (let period = 1; period <= 6; period += 1) {
    if (sequence.every((value, index) => value === sequence[index % period])) return period;
  }
  return 0;
}

function checkDisplaySequence(sequence, label, expectedLength) {
  if (sequence.length !== expectedLength) fail(`${label}: expected ${expectedLength} positions, found ${sequence.length}`);
  if (sequence.some((value) => !Number.isInteger(value) || value < 0 || value > 3)) fail(`${label}: positions must be 0..3`);
  const counts = [0, 1, 2, 3].map((index) => sequence.filter((value) => value === index).length);
  if (Math.max(...counts) - Math.min(...counts) > 1) fail(`${label}: answer positions are imbalanced (${counts.join("/")})`);
  const period = hasSimplePeriod(sequence);
  if (period) fail(`${label}: answer positions repeat with a learnable period of ${period}`);
  return counts;
}

function checkCurriculum() {
  const englishCopy = readJson("messages/mcp/en.json");
  if (MCP_COURSE_SEQUENCE !== 10) fail("course sequence must be 10");
  if (MCP_COURSE_VERSION !== "1.0.0" || MCP_PROTOCOL_VERSION !== "2026-07-28") fail("course version constants disagree");
  if (MCP_UNITS.length !== 5 || MCP_LESSONS.length !== 18) fail("course must contain five units and 18 lessons");
  if (MCP_LOCALES.length !== 9) fail("route locale contract must contain nine platform locales");

  const lessonSlugs = unique(MCP_LESSONS.map((lesson) => lesson.slug), "lesson slugs");
  const lessonOrders = MCP_LESSONS.map((lesson) => lesson.order);
  if (lessonOrders.some((order, index) => order !== index + 1)) fail("lesson order must be contiguous 1..18");
  const unitIds = unique(MCP_UNITS.map((unit) => unit.id), "unit IDs");
  const orderedFromUnits = MCP_UNITS.flatMap((unit) => unit.lessonSlugs);
  if (JSON.stringify(orderedFromUnits) !== JSON.stringify(MCP_LESSONS.map((lesson) => lesson.slug))) fail("unit lesson order differs from the canonical lesson order");
  for (const unit of MCP_UNITS) {
    if (unit.lessonSlugs.some((slug) => !lessonSlugs.has(slug))) fail(`${unit.id}: unknown lesson slug`);
  }

  const conceptIds = unique(MCP_CONCEPTS.map((concept) => concept.id), "concept IDs");
  const usedConcepts = new Set(MCP_LESSONS.flatMap((lesson) => lesson.conceptIds));
  for (const id of conceptIds) if (!usedConcepts.has(id)) fail(`${id}: concept is not mapped to a lesson`);
  for (const lesson of MCP_LESSONS) {
    if (!unitIds.has(lesson.unitId)) fail(`${lesson.slug}: unknown unit ${lesson.unitId}`);
    if (lesson.minutes < 25 || lesson.minutes > 120) fail(`${lesson.slug}: implausible lesson duration ${lesson.minutes}`);
    if (lesson.conceptIds.some((id) => !conceptIds.has(id))) fail(`${lesson.slug}: unknown concept`);
    if (lesson.sections.length < 3) fail(`${lesson.slug}: needs at least three teaching sections`);
    if (lesson.practice.steps.length < 3 || lesson.practice.evidence.length < 2) fail(`${lesson.slug}: practice is not auditable enough`);
    if (lesson.check.options.length !== 4) fail(`${lesson.slug}: formative check must have four choices`);
  }

  const statuses = new Set(MCP_CONCEPTS.map((concept) => concept.status));
  for (const status of ["core", "optional", "practice", "extension", "deprecated", "removed"]) {
    if (!statuses.has(status)) fail(`concept ledger is missing ${status} semantics`);
  }

  const text = JSON.stringify({ lessons: MCP_LESSONS, copy: englishCopy });
  for (const phrase of [
    "accepted notification receives HTTP 202 with no body",
    "subscriptions/listen",
    "must increase with every later notification",
    "Authorization is optional in MCP overall",
    "empty string is a valid cursor",
    "Extensions are disabled by default",
    "_meta.ui.resourceUri",
    "text/html;profile=mcp-app",
    "must include ttlMs and cacheScope",
    "currently augments tools/call only",
    "community-maintained and can be incomplete",
  ]) {
    if (!text.includes(phrase)) fail(`current-protocol correction is missing: ${phrase}`);
  }
  for (const phrase of ["initialize / initialized lifecycle", "ping utility"]) {
    if (!text.includes(phrase)) fail(`removed-feature history is missing: ${phrase}`);
  }

  if (MCP_EXTENSIONS.length !== 4) fail(`extension manifest must freeze four independently versioned contracts; found ${MCP_EXTENSIONS.length}`);
  const maturityByName = Object.fromEntries(MCP_EXTENSIONS.map((extension) => [extension.name, extension.maturity]));
  if (maturityByName["MCP Apps"] !== "stable") fail("MCP Apps must remain labelled Stable at the frozen 2026-01-26 specification");
  if (maturityByName["Enterprise-Managed Authorization"] !== "stable") fail("Enterprise-Managed Authorization must remain labelled Stable at the frozen revision");
  if (maturityByName["OAuth Client Credentials"] !== "draft" || maturityByName.Tasks !== "draft") fail("Tasks and OAuth Client Credentials must remain labelled Draft at the frozen revisions");
  for (const extension of MCP_EXTENSIONS) {
    if (!/^[0-9a-f]{40}$/.test(extension.revision)) fail(`${extension.id}: extension revision is not an immutable commit`);
    if (!extension.specificationUrl.includes(extension.revision)) fail(`${extension.id}: extension source is not pinned to its recorded revision`);
  }
}

function checkSourcesAndClaims() {
  const sourceIds = unique(MCP_SOURCES.map((source) => source.id), "source IDs");
  for (const source of MCP_SOURCES) {
    if (!source.url.startsWith("https://")) fail(`${source.id}: source URL must use HTTPS`);
    if (!["2026-08-23", "2026-08-24"].includes(source.accessedOn)) fail(`${source.id}: accessed date is outside the frozen evidence snapshots`);
    if (source.tier === "normative" && source.publisher !== "Model Context Protocol") fail(`${source.id}: normative authority must be the MCP specification`);
  }
  for (const publisher of ["Anthropic", "OpenAI", "Google", "GitHub"]) {
    if (!MCP_SOURCES.some((source) => source.publisher === publisher)) fail(`source ledger has no ${publisher} evidence`);
  }
  if (!MCP_SOURCES.some((source) => source.publisher === "Anthropic" && source.tier === "academy")) fail("Claude Academy evidence is missing");
  if (!MCP_SOURCES.some((source) => source.publisher === "OpenAI" && source.tier === "academy")) fail("OpenAI Academy evidence is missing");
  const practitioner = MCP_SOURCES.filter((source) => source.tier === "practitioner");
  if (practitioner.length < 7) fail(`need at least seven bounded practitioner records; found ${practitioner.length}`);
  for (const source of practitioner) {
    if (!source.url.startsWith("https://github.com/")) fail(`${source.id}: practitioner record must resolve to GitHub`);
    if (source.id.startsWith("github-experience-") && !/(single|one |bounded|maintainer|report|case|issue|discussion)/i.test(source.note)) fail(`${source.id}: practitioner note does not bound its evidence`);
  }

  const lessons = new Map(MCP_LESSONS.map((lesson) => [lesson.slug, lesson]));
  const sourceUse = new Set(MCP_LESSONS.flatMap((lesson) => lesson.sourceIds));
  for (const lesson of MCP_LESSONS) {
    for (const id of lesson.sourceIds) if (!sourceIds.has(id)) fail(`${lesson.slug}: unknown source ${id}`);
  }
  for (const source of MCP_SOURCES) {
    if (!sourceUse.has(source.id)) warn(`${source.id}: source is not mapped to a lesson`);
  }

  unique(MCP_CLAIM_MAP.map((entry) => entry.id), "claim map IDs");
  for (const entry of MCP_CLAIM_MAP) {
    const lesson = lessons.get(entry.lessonSlug);
    if (!lesson) fail(`${entry.id}: unknown lesson ${entry.lessonSlug}`);
    else if (lesson.order !== entry.lessonOrder) fail(`${entry.id}: lesson order is stale`);
    if (!entry.sourceIds.length) fail(`${entry.id}: claim has no source`);
    for (const id of entry.sourceIds) if (!sourceIds.has(id)) fail(`${entry.id}: unknown source ${id}`);
  }
}

function checkFigures() {
  const ids = unique(MCP_FIGURES.map((figure) => figure.id), "figure IDs");
  const counts = Object.fromEntries(["direct-mcp-ui", "host-inventory", "host-context", "design-example"].map((kind) => [kind, MCP_FIGURES.filter((figure) => figure.evidenceClass === kind).length]));
  const inspectorIds = ["inspector-settings", "inspector-tools", "inspector-resources", "inspector-prompts", "inspector-protocol", "inspector-apps"];
  const hostIds = ["gemini-cli-mcp-inventory", "codex-cli-mcp-configuration"];
  if (counts["direct-mcp-ui"] !== 6 || counts["host-inventory"] !== 2 || MCP_FIGURES.length !== 8) fail(`release set must contain six Inspector UI figures and two provider host-inventory figures; found ${counts["direct-mcp-ui"]}/${counts["host-inventory"]}/${MCP_FIGURES.length}`);
  for (const id of [...inspectorIds, ...hostIds]) if (!ids.has(id)) fail(`${id}: required release figure is missing`);
  const hostLesson = MCP_LESSONS.find((lesson) => lesson.slug === "host-integrations");
  for (const id of hostIds) if (!hostLesson?.figureIds.includes(id)) fail(`${id}: provider evidence is not mapped to host-integrations`);

  const referenced = new Set(MCP_LESSONS.flatMap((lesson) => lesson.figureIds));
  for (const lesson of MCP_LESSONS) {
    for (const id of lesson.figureIds) if (!ids.has(id)) fail(`${lesson.slug}: unknown figure ${id}`);
  }
  for (const figure of MCP_FIGURES) {
    if (!referenced.has(figure.id)) fail(`${figure.id}: figure is not mapped to a lesson`);
    if (!figure.alt || !figure.caption || !figure.teachingPoint) fail(`${figure.id}: accessibility or teaching copy is missing`);
    if (!figure.sourceUrl.startsWith("https://")) fail(`${figure.id}: source URL must use HTTPS`);
    for (const [field, rootPath] of [["src", figure.src], ["webpSrc", figure.webpSrc], ["mobileWebpSrc", figure.mobileWebpSrc]]) {
      const path = assetPath(rootPath, `${figure.id}.${field}`);
      if (!path || !regularFile(path, `${figure.id}.${field}`)) continue;
      const bytes = readFileSync(path);
      const dimensions = imageDimensions(path, bytes);
      if (!dimensions) fail(`${figure.id}.${field}: unrecognized or corrupt image`);
      if (field === "src") {
        if (dimensions && (dimensions.width !== figure.width || dimensions.height !== figure.height)) fail(`${figure.id}: recorded dimensions do not match the original`);
        if (sha256(bytes) !== figure.sha256) fail(`${figure.id}: original SHA-256 mismatch`);
      } else {
        const widthMatch = rootPath.match(/-(\d+)\.webp$/);
        if (dimensions && widthMatch && dimensions.width !== Number(widthMatch[1])) fail(`${figure.id}.${field}: width does not match its filename`);
      }
    }
  }

  const assetRoot = resolve(PUBLIC_ROOT, "courses/mcp/figures");
  if (existsSync(assetRoot)) {
    const declared = new Set(MCP_FIGURES.flatMap((figure) => [figure.src, figure.webpSrc, figure.mobileWebpSrc]).map((path) => path.split("/").at(-1)));
    for (const name of readdirSync(assetRoot)) if (!declared.has(name)) warn(`public/courses/mcp/figures/${name}: undeclared asset`);
  }
}

function checkAssessment() {
  if (MCP_ASSESSMENT_VERSION !== "2026-07-28-v2") fail("assessment bank version must be v2 after answer-presentation correction");
  if (MCP_FINAL_ASSESSMENT.length !== 18) fail("summative assessment must contain 18 scenarios");
  unique(MCP_FINAL_ASSESSMENT.map((question) => question.id), "assessment IDs");
  const slugs = new Set(MCP_LESSONS.map((lesson) => lesson.slug));
  const formativeQuestions = new Set(MCP_LESSONS.map((lesson) => lesson.check.question));
  for (const question of MCP_FINAL_ASSESSMENT) {
    if (!slugs.has(question.reviewSlug)) fail(`${question.id}: unknown review lesson ${question.reviewSlug}`);
    if (formativeQuestions.has(question.question)) fail(`${question.id}: summative question repeats a formative item`);
    if (question.options.length !== 4 || question.correctIndex < 0 || question.correctIndex > 3) fail(`${question.id}: invalid answer contract`);
  }
  const finalCounts = checkDisplaySequence(MCP_FINAL_DISPLAY_CORRECT_INDEXES, "summative displayed positions", MCP_FINAL_ASSESSMENT.length);
  const lessonCounts = checkDisplaySequence(MCP_LESSON_DISPLAY_CORRECT_INDEXES, "formative displayed positions", MCP_LESSONS.length);
  MCP_FINAL_ASSESSMENT.forEach((question, index) => {
    const presented = presentMcpOptions(question, MCP_FINAL_DISPLAY_CORRECT_INDEXES[index]);
    if (presented[MCP_FINAL_DISPLAY_CORRECT_INDEXES[index]]?.originalIndex !== question.correctIndex) fail(`${question.id}: displayed answer mapping is incorrect`);
  });
  MCP_LESSONS.forEach((lesson, index) => {
    const presented = presentMcpOptions(lesson.check, MCP_LESSON_DISPLAY_CORRECT_INDEXES[index]);
    if (presented[MCP_LESSON_DISPLAY_CORRECT_INDEXES[index]]?.originalIndex !== lesson.check.correctIndex) fail(`${lesson.slug}: displayed formative mapping is incorrect`);
  });
  const threshold = Math.ceil(MCP_FINAL_ASSESSMENT.length * 0.8);
  if (threshold !== 15) fail(`summative threshold should be 15, found ${threshold}`);
  const englishCopy = readJson("messages/mcp/en.json");
  if (!String(englishCopy?.ui?.assessmentIntroTemplate).includes("≥80%") || String(englishCopy?.ui?.assessmentIntroTemplate).includes("15/18 (80%)")) fail("assessment threshold copy is mathematically imprecise");
  note(`summative displayed-answer distribution ${finalCounts.join("/")}; formative ${lessonCounts.join("/")}`);
}

function checkFixture() {
  const archive = resolve(ROOT, "public/courses/mcp/courseops-reference.zip");
  const archiveExists = regularFile(archive);
  if (archiveExists && (statSync(archive).size < 5_000 || readFileSync(archive).subarray(0, 2).toString("ascii") !== "PK")) fail("CourseOps download is not a plausible ZIP archive");
  if (archiveExists) {
    const checksum = readText("public/courses/mcp/courseops-reference.sha256").trim().split(/\s+/)[0];
    if (!/^[0-9a-f]{64}$/.test(checksum) || checksum !== sha256(readFileSync(archive))) fail("CourseOps archive checksum is missing or stale");
    const expectedFiles = ["README.md", "package-lock.json", "package.json", "fixtures/course.json", "src/client.mjs", "src/server.mjs", "test/courseops.test.mjs"];
    const listed = spawnSync("unzip", ["-Z1", archive], { encoding: "utf8" });
    if (listed.error || listed.status !== 0) fail("CourseOps archive member list could not be inspected");
    else {
      const files = listed.stdout.split(/\r?\n/).filter((name) => name && !name.endsWith("/")).map((name) => name.replace(/^mcp-courseops\//, "")).sort();
      if (JSON.stringify(files) !== JSON.stringify([...expectedFiles].sort())) fail(`CourseOps archive file allowlist mismatch: ${files.join(", ")}`);
      for (const file of expectedFiles) {
        const archived = spawnSync("unzip", ["-p", archive, `mcp-courseops/${file}`], { encoding: null });
        if (archived.error || archived.status !== 0 || !Buffer.from(archived.stdout).equals(readFileSync(resolve(ROOT, "examples/mcp-courseops", file)))) fail(`CourseOps archive differs from source fixture: ${file}`);
      }
    }
  }
  const fixtureRoot = resolve(ROOT, "examples/mcp-courseops");
  const result = spawnSync(process.execPath, ["--test", "test/courseops.test.mjs"], { cwd: fixtureRoot, encoding: "utf8" });
  if (result.status !== 0) fail(`CourseOps fixture tests failed: ${(result.stderr || result.stdout).trim()}`);
  const combined = `${result.stdout}\n${result.stderr}`;
  if (!combined.includes("pass 8") && !combined.includes("# pass 8")) fail("CourseOps fixture must retain eight protocol tests, including mandatory caching hints");
  const lesson = readText("components/mcp/LessonView.tsx");
  const capstone = readText("components/mcp/CapstoneChecklist.tsx");
  if (!lesson.includes("/courses/mcp/courseops-reference.zip") || !capstone.includes("/courses/mcp/courseops-reference.zip")) fail("CourseOps archive is not visibly linked from lessons and capstone");
}

function checkCapstone() {
  const template = readText("public/courses/mcp/MCP_CAPSTONE_EVIDENCE_PACK.md");
  const rows = template.match(/^\| (?:[1-9]|1[0-2]) \|/gm) ?? [];
  if (rows.length !== 12) fail(`capstone template must prepopulate exactly 12 adversarial rows; found ${rows.length}`);
  if (!template.includes(`Course assessment version: \`${MCP_ASSESSMENT_VERSION}\``)) fail("capstone template has a stale assessment version");
  const englishCopy = readJson("messages/mcp/en.json");
  if (!englishCopy?.capstone?.deliverables?.includes("Threat model and 12-case adversarial test matrix")) fail("capstone checklist and template disagree on threat-test count");
  for (const locale of MCP_LOCALES) {
    const packName = `public/courses/mcp/capstone/MCP_CAPSTONE_EVIDENCE_PACK-${locale}.md`;
    const pack = readText(packName);
    const copy = readJson(`messages/mcp/${locale}.json`);
    const localizedRows = pack.match(/^\| (?:[1-9]|1[0-2]) \|/gm) ?? [];
    const numberedSections = pack.match(/^## (?:[1-9]|10)\./gm) ?? [];
    if (localizedRows.length !== 12) fail(`${packName}: expected 12 adversarial rows; found ${localizedRows.length}`);
    if (numberedSections.length !== 10) fail(`${packName}: expected ten numbered evidence sections; found ${numberedSections.length}`);
    for (const invariant of [MCP_PROTOCOL_VERSION, MCP_ASSESSMENT_VERSION, "2026-08-24"]) {
      if (!pack.includes(invariant)) fail(`${packName}: missing invariant ${invariant}`);
    }
    if (!copy?.meta?.localeNote || !pack.includes(copy.meta.localeNote)) fail(`${packName}: localized provenance note is missing`);
    if (/[\u202A-\u202E\u2066-\u2069]/u.test(pack)) fail(`${packName}: unsafe bidi control found`);
    if (/[⟦⟧]|<\/?x-keep\b|<\/?span\b[^>]*\bid\s*=\s*["']?x\d{4}/u.test(pack)) fail(`${packName}: leaked translation sentinel`);
    if (Buffer.byteLength(pack, "utf8") < 4_500) fail(`${packName}: localized evidence pack is implausibly short`);
  }
  const progress = readText("components/mcp/CourseProgress.tsx");
  if (!progress.includes('key.startsWith("mcp.")') || !progress.includes("hasMcpProgress ?")) {
    fail("MCP reset control must remain available for partial or failed progress that does not count toward completion");
  }
}

function checkIntegration() {
  const coursesPage = readText("app/[locale]/courses/page.tsx");
  for (const invariant of ["loadGithubCourse", "courseSixParts", "github: courseSixParts"]) {
    if (!coursesPage.includes(invariant)) fail(`Course 6 integration invariant missing: ${invariant}`);
  }
  for (const invariant of ["loadMcpCourse", "courseTenParts", "mcp: courseTenParts"]) {
    if (!coursesPage.includes(invariant)) fail(`MCP catalogue integration missing: ${invariant}`);
  }
  const catalogue = readText("lib/courses.ts");
  if (!catalogue.includes('id: "github"') || !catalogue.includes('id: "mcp"') || !catalogue.includes('href: "/mcp/"')) fail("course registry must preserve GitHub and add MCP");
  const catalogComponent = readText("components/courses/Catalog.tsx");
  if (!catalogComponent.includes("model-context-protocol") || !catalogComponent.includes("isMcp")) fail("catalogue card lacks MCP anchor or styling hook");
  const cover = readText("components/courses/Cover.tsx");
  if (!cover.includes("mcp: (") || !cover.includes("A host negotiates one explicit client boundary")) fail("course cover lacks an MCP-specific motif");
  const shell = readText("components/Shell.tsx");
  if (!shell.includes('p("/mcp/")') || !shell.includes('t("c.mcp.title")')) fail("site shell lacks the MCP course link");
  const seo = readText("lib/seo.ts");
  if (!seo.includes('"mcp/"') || MCP_LESSONS.some((lesson) => !seo.includes(`"mcp/${lesson.slug}/"`))) fail("SEO page registry lacks MCP routes");
  const sitemap = readText("app/sitemap.ts");
  if (!sitemap.includes('page === "mcp/"') || !sitemap.includes('page.startsWith("mcp/")')) fail("sitemap lacks the MCP multilingual route rule");
  for (const locale of MCP_LOCALES) {
    const messages = readJson(`messages/${locale}.json`);
    if (!messages) continue;
    if (!messages["cat.course10"]) fail(`messages/${locale}.json: cat.course10 missing`);
    for (const key of ["title", "blurb", "level", "meta"]) if (!messages[`c.mcp.${key}`]) fail(`messages/${locale}.json: c.mcp.${key} missing`);
    if (!/(?:8|٨)/u.test(String(messages["c.mcp.meta"]))) fail(`messages/${locale}.json: c.mcp.meta must report eight rights-cleared MCP UI figures`);
  }

  const routeText = `${readText("app/[locale]/mcp/page.tsx")}\n${readText("app/[locale]/mcp/[lesson]/page.tsx")}`;
  for (const phrase of ["availableLocales: MCP_LOCALES", "canonicalLocale: locale", "inLanguage: course.contentLocale"]) if (!routeText.includes(phrase)) fail(`localized canonical route contract missing: ${phrase}`);
  const componentRoot = resolve(ROOT, "components/mcp");
  const componentText = readdirSync(componentRoot).filter((name) => /\.(?:ts|tsx)$/.test(name)).map((name) => readFileSync(resolve(componentRoot, name), "utf8")).join("\n");
  if (/<main\b/.test(componentText)) fail("MCP components must not nest a second main landmark inside the shared shell");
  if (/\bsrc\s*=\s*["']https?:\/\//i.test(componentText)) fail("MCP components must not hotlink remote media");
  if (!componentText.includes("lang={course.contentLocale}") || !componentText.includes("dir={course.contentDirection}")) fail("localized long-form content must declare its actual language and direction");
  const englishCopy = readJson("messages/mcp/en.json");
  if (!String(englishCopy?.ui?.completionStorageUnavailable).includes("until you refresh or close it") || String(englishCopy?.ui?.completionStorageUnavailable).includes("this tab will remember progress")) fail("storage fallback copy overstates in-memory persistence");
  if (/from\s+["']@\/lib\/(?:claude|codex|cursor|github|grok|prompts|rag|software-engineering)/.test(componentText)) fail("MCP product namespace imports another course namespace");
}

function checkBrowserQaRecord() {
  if (!RELEASE) return;
  const qa = readText("outputs/mcp-browser-qa.md");
  const required = [
    "Verified: 2026-08-24 (Asia/Taipei)",
    `${MCP_CONCEPTS.length} concepts`,
    `${MCP_SOURCES.length} sources`,
    `${MCP_FIGURES.length} real interface figures`,
    "171/171 MCP HTML files",
    "171/171 MCP sitemap URLs",
    "8/8 provenance-checked figures",
    "42/42 Playwright executions",
    "8/8 protocol tests",
    "44 sources, 21 authentic figures",
    "b4bf8ee63fa8ac18fb7c7527c6d1a9de2b0064323ef7c8e8a6a0f676066275ea",
    'translationMethod: "machine-translated"',
  ];
  for (const invariant of required) {
    if (!qa.includes(invariant)) fail(`browser QA record is stale or incomplete: ${invariant}`);
  }
  for (const retired of [
    "47 concepts",
    "59 sources",
    "7/7 protocol tests",
    "19 English MCP URLs",
    "English course in its own [lang=en][dir=ltr] subtree",
  ]) {
    if (qa.includes(retired)) fail(`browser QA record retains retired release evidence: ${retired}`);
  }
}

function checkReleaseRights() {
  const notice = readText("public/courses/mcp/NOTICE.md");
  const apacheLicense = readText("public/courses/mcp/licenses/APACHE-2.0.txt");
  const codexNotice = readText("public/courses/mcp/licenses/CODEX-NOTICE.txt");
  const dashboard = readText("components/mcp/CourseDashboard.tsx");
  const manifest = readJson("public/courses/mcp/figure-manifest.json");
  if (!manifest) return;
  if (!apacheLicense.includes("Apache License") || !apacheLicense.includes("Version 2.0, January 2004") || !apacheLicense.includes("END OF TERMS AND CONDITIONS")) fail("local Apache-2.0 license copy is incomplete");
  for (const phrase of ["OpenAI Codex", "Copyright 2025 OpenAI", "Ratatui", "Florian Dehau", "The Ratatui Developers"]) {
    if (!codexNotice.includes(phrase)) fail(`local Codex NOTICE is missing attribution: ${phrase}`);
  }
  for (const path of ["/courses/mcp/figure-manifest.json", "/courses/mcp/NOTICE.md", "/courses/mcp/licenses/APACHE-2.0.txt", "/courses/mcp/licenses/CODEX-NOTICE.txt"]) {
    if (!dashboard.includes(path)) fail(`course dashboard does not expose the rights record ${path}`);
  }
  if (manifest.schemaVersion !== 2 || manifest.releaseStatus !== "approved") fail("figure manifest is not release-approved under the heterogeneous-rights schema");
  if (manifest.privacyReview?.status !== "passed") fail("figure manifest privacy review is incomplete");
  if (!/^[0-9a-f]{40}$/.test(manifest.upstreamCommit ?? "")) fail("figure manifest lacks an immutable upstream commit");
  if (manifest.derivativeRecipe?.runtime !== "sharp 0.35.3") fail("figure derivative runtime is not pinned");
  const records = new Map((manifest.figures ?? []).map((record) => [record.id, record]));
  if (records.size !== MCP_FIGURES.length) fail("figure manifest and TypeScript registry have different counts");
  for (const figure of MCP_FIGURES) {
    const record = records.get(figure.id);
    if (!record) { fail(`${figure.id}: missing from figure-manifest.json`); continue; }
    if (record.releaseEligibility !== "publish") fail(`${figure.id}: asset is not publication-approved`);
    const collection = manifest.rightsCollections?.[record.rightsCollection];
    if (!collection || collection.rightsStatus !== record.rightsStatus) fail(`${figure.id}: rights collection is missing or inconsistent`);
    if (figure.id.startsWith("inspector-")) {
      if (record.rightsStatus !== "approved-cc-by-4.0" || record.rightsCollection !== "mcp-inspector-documentation") fail(`${figure.id}: Inspector rights status is incomplete`);
      if (!String(record.upstream?.url).includes(manifest.upstreamCommit) || record.upstream?.sha256 !== figure.sha256) fail(`${figure.id}: immutable upstream record does not match the course master`);
    } else {
      if (record.rightsStatus !== "reviewed-course-capture") fail(`${figure.id}: host capture rights status must distinguish internal review from provider approval`);
      if (collection.internalReviewStatus !== "approved-for-course-release" || !String(collection.providerAuthorization).startsWith("not claimed")) fail(`${figure.id}: internal release review is not separated from provider authorization`);
      if (record.captureAuthor !== "aicourse.top course team" || !String(record.captureLicense).includes("MIT") || record.embeddedWorkLicense !== "Apache-2.0") fail(`${figure.id}: layered capture authorship or licensing is incomplete`);
      if (record.localLicensePath !== "licenses/APACHE-2.0.txt" || collection.localLicensePath !== record.localLicensePath) fail(`${figure.id}: local Apache-2.0 license reference is missing or inconsistent`);
      if (!/^[0-9a-f]{40}$/.test(record.product?.gitCommit ?? "")) fail(`${figure.id}: host capture lacks an immutable client commit`);
      if (!/^[0-9a-f]{64}$/.test(record.capture?.rawMaster?.sha256 ?? "") || record.capture?.rawMaster?.retainedOutsidePublic !== true) fail(`${figure.id}: raw capture integrity or storage boundary is incomplete`);
      if (!String(record.capture?.rawMaster?.archivalRef).startsWith("tmp/mcp-ui-evidence/")) fail(`${figure.id}: raw capture archival reference is outside the protected MCP workspace`);
      if (!String(record.capture?.privacyTransformation).includes("removes") || !String(record.privacyReview).startsWith("passed")) fail(`${figure.id}: privacy transformation or review is incomplete`);
      if (figure.id === "gemini-cli-mcp-inventory") {
        if (collection.noticeUrl !== null || !String(collection.noticeFinding).includes("No NOTICE or NOTICE.* file exists")) fail(`${figure.id}: pinned Gemini NOTICE-tree finding is incomplete`);
        if (record.syntheticServer?.package !== "@modelcontextprotocol/server-everything" || record.syntheticServer?.version !== "2026.8.18") fail(`${figure.id}: synthetic reference server pin is incomplete`);
        if (!String(record.syntheticServer?.npmTarball).endsWith("server-everything-2026.8.18.tgz") || !String(record.syntheticServer?.npmIntegrity).startsWith("sha512-") || !/^[0-9a-f]{40}$/.test(record.syntheticServer?.npmSha1 ?? "")) fail(`${figure.id}: synthetic reference server artifact integrity is incomplete`);
        if (!String(record.syntheticServer?.declaredSdkRange).includes("^1.30.0") || !String(record.syntheticServer?.lockfileFinding).includes("no lockfile")) fail(`${figure.id}: transitive dependency reproducibility boundary is missing`);
      }
      if (figure.id === "codex-cli-mcp-configuration") {
        const executable = record.capture?.executableEvidence;
        if (record.localNoticePath !== "licenses/CODEX-NOTICE.txt" || collection.localNoticePath !== record.localNoticePath) fail(`${figure.id}: local upstream NOTICE reference is missing or inconsistent`);
        if (record.product?.platformArtifact?.version !== "0.149.1-darwin-arm64" || !String(record.product?.platformArtifact?.npmIntegrity).startsWith("sha512-")) fail(`${figure.id}: platform package artifact is not pinned`);
        if (!/^[0-9a-f]{64}$/.test(executable?.wrapperSha256 ?? "") || !/^[0-9a-f]{64}$/.test(executable?.nativeExecutableSha256 ?? "") || executable?.reportedVersion !== "codex-cli 0.149.1") fail(`${figure.id}: actual command wrapper or native executable evidence is incomplete`);
        if (!String(executable?.evidenceBoundary).includes("not presented as cryptographic proof")) fail(`${figure.id}: executable timing limitation is not disclosed`);
      }
    }
    if (record.courseMaster?.sha256 !== figure.sha256 || `/courses/mcp/${record.courseMaster?.path}` !== figure.src) fail(`${figure.id}: course master disagrees with TypeScript`);
    for (const derivative of record.derivatives ?? []) {
      const path = resolve(ROOT, "public/courses/mcp", derivative.path);
      if (!regularFile(path, `${figure.id}.${derivative.path}`)) continue;
      const bytes = readFileSync(path);
      const dimensions = imageDimensions(path, bytes);
      if (sha256(bytes) !== derivative.sha256 || dimensions?.width !== derivative.width || dimensions?.height !== derivative.height) fail(`${figure.id}: derivative manifest mismatch for ${derivative.path}`);
    }
  }
  const withheldIds = new Set((manifest.withheld ?? []).flatMap((record) => record.ids ?? []));
  for (const id of withheldIds) {
    if (MCP_FIGURES.some((figure) => figure.id === id)) fail(`${id}: withheld figure remains in the course registry`);
    const publicMatches = readdirSync(resolve(PUBLIC_ROOT, "courses/mcp/figures")).filter((name) => name.startsWith(id));
    if (publicMatches.length) fail(`${id}: withheld files remain publicly served`);
  }
  for (const phrase of ["CC BY 4.0", "e24f0099b60f7c00e165a0faa02a72029d2fa654", "Gemini CLI 0.56.0", "Codex CLI 0.149.1", "reviewed-course-capture", "internal rights and privacy review", "not distributed", "No affiliation or endorsement"]) {
    if (!notice.includes(phrase)) fail(`NOTICE.md is missing required rights wording: ${phrase}`);
  }
  const uncleared = MCP_FIGURES.filter((figure) => /clearance|commentary|except as otherwise noted/i.test(figure.rights));
  if (uncleared.length) {
    const message = `figure reuse not publication-cleared: ${uncleared.map((figure) => figure.id).join(", ")}`;
    if (RELEASE) fail(message); else warn(message);
  }
}

async function checkLinks() {
  if (!CHECK_LINKS) return;
  const urls = [...new Set([...MCP_SOURCES.map((source) => source.url), ...MCP_FIGURES.map((figure) => figure.sourceUrl)])];
  let cursor = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "aicourse.top MCP source verifier/1.0" }, signal: AbortSignal.timeout(20_000) });
        if (response.status >= 400 && ![401, 403, 429].includes(response.status)) fail(`${url}: HTTP ${response.status}`);
        else if ([401, 403, 429].includes(response.status)) warn(`${url}: verifier received HTTP ${response.status}; manual browser check required`);
      } catch (error) {
        warn(`${url}: link check unavailable (${error.message})`);
      }
    }
  });
  await Promise.all(workers);
  note(`${urls.length} source and figure links checked`);
}

async function main() {
  REQUIRED_FILES.forEach((name) => regularFile(resolve(ROOT, name), name));
  checkCurriculum();
  checkLocalization();
  checkSourcesAndClaims();
  checkFigures();
  checkAssessment();
  checkFixture();
  checkCapstone();
  checkIntegration();
  checkBrowserQaRecord();
  checkReleaseRights();
  await checkLinks();

  note(`${MCP_UNITS.length} units, ${MCP_LESSONS.length} lessons, ${MCP_CONCEPTS.length} concepts`);
  note(`${MCP_SOURCES.length} sources, ${MCP_CLAIM_MAP.length} high-risk claim mappings`);
  note(`${MCP_FIGURES.length} classified interface figures, ${MCP_FINAL_ASSESSMENT.length} summative scenarios`);

  const status = errors.length ? "FAIL" : warnings.length ? "WARN" : "PASS";
  const summary = {
    course: "mcp",
    sequence: MCP_COURSE_SEQUENCE,
    protocolVersion: MCP_PROTOCOL_VERSION,
    courseVersion: MCP_COURSE_VERSION,
    assessmentVersion: MCP_ASSESSMENT_VERSION,
    mode: RELEASE ? "release" : "development",
    status,
    counts: {
      units: MCP_UNITS.length,
      lessons: MCP_LESSONS.length,
      concepts: MCP_CONCEPTS.length,
      sources: MCP_SOURCES.length,
      claims: MCP_CLAIM_MAP.length,
      figures: MCP_FIGURES.length,
      assessmentQuestions: MCP_FINAL_ASSESSMENT.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
    notes,
  };

  if (JSON_OUTPUT) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`MCP Course 10 check: ${status} (${summary.mode})`);
    notes.forEach((message) => console.log(`NOTE: ${message}`));
    warnings.forEach((message) => console.warn(`WARN: ${message}`));
    errors.forEach((message) => console.error(`ERROR: ${message}`));
  }
  if (errors.length) process.exitCode = 1;
}

await main();
