#!/usr/bin/env node

/**
 * Deterministic, offline release gate for Course 16.
 *
 *   node --import tsx scripts/check-creator-ops-course.mjs
 *   node --import tsx scripts/check-creator-ops-course.mjs --release
 *   node --import tsx scripts/check-creator-ops-course.mjs --json
 *
 * Both modes validate the complete checksum-backed review receipt. Development
 * mode reports unfinished markers as warnings; release mode also promotes those
 * warnings to failures.
 */

import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { CREATOR_OPS_COURSE_MANIFEST } from "../lib/creator-ops/manifest.ts";
import { CREATOR_OPS_EN_COPY } from "../lib/creator-ops/copy/en.ts";
import { CREATOR_OPS_ZH_HANS_COPY } from "../lib/creator-ops/copy/zh-Hans.ts";
import {
  CREATOR_OPS_CAPSTONE_ARTIFACT_COUNT,
  CREATOR_OPS_QUIZ_PASSED_KEY,
  creatorOpsArtifactEvidenceKey,
  creatorOpsCheckpointPassedKey,
  creatorOpsModuleProgressKey,
  gradeCreatorOpsAssessment,
  isMeaningfulCreatorOpsArtifact,
  isMeaningfulCreatorOpsArtifactDraft,
  recordCreatorOpsCapstone,
  reconcileCreatorOpsModuleCompletion,
} from "../lib/creator-ops/progress.ts";
import { CREATOR_OPS_SOURCES } from "../lib/creator-ops/sources.ts";
import { deterministicBuildId } from "../lib/deterministic-build-id.cjs";
import {
  CREATOR_OPS_COURSE_ID,
  CREATOR_OPS_DEFAULT_CONTENT_LOCALE,
  CREATOR_OPS_LOCALES,
  CREATOR_OPS_MODULE_SLUGS,
  CREATOR_OPS_PHASE_IDS,
} from "../lib/creator-ops/types.ts";
import { validateCreatorOpsCourse } from "../lib/creator-ops/validate.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");

const EXPECTED_MODULE_SLUGS = [
  "outcomes-operating-system",
  "audience-signal-radar",
  "evidence-research-packet",
  "editorial-agent-architecture",
  "writing-brand-fact-gates",
  "multimodal-asset-pipeline",
  "repurpose-content-assets",
  "human-approved-distribution",
  "community-analytics-loop",
  "evaluation-governance-capstone",
];
const EXPECTED_PHASE_IDS = ["radar", "studio", "publish", "learn"];
const EXPECTED_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
];
const EXPECTED_EXCLUDED_SOURCE_IDS = [
  "dify-case",
  "mediacrawler-case",
  "moneyprinter-case",
  "n8n-case",
];
const EXPECTED_SOURCE_COUNTS = Object.freeze({
  pass: 13,
  conditional: 10,
  excluded: 4,
});
const EXPECTED_MINUTES = 710;
const EXPECTED_SOURCE_COUNT = 27;
const COURSE_ROUTE_ROOT = "app/[locale]/creator-ops";
const COURSE_COMPONENT_ROOT = "components/creator-ops";
const COURSE_PUBLIC_ROOT = "public/courses/creator-ops";
const COURSE_LAB_ROOT = `${COURSE_PUBLIC_ROOT}/lab`;
const RESEARCH_BRIEF = "outputs/creator-ops-course-research-brief.md";
const PROVENANCE_SIDECAR = "outputs/creator-ops-course-research-brief.provenance.md";
const EXPECTED_LAB_FILES = Object.freeze([
  `${COURSE_LAB_ROOT}/README.md`,
  `${COURSE_LAB_ROOT}/fault-injections.json`,
  `${COURSE_LAB_ROOT}/manifest.sha256`,
  `${COURSE_LAB_ROOT}/mock-publish-scenarios.json`,
  `${COURSE_LAB_ROOT}/source-fixtures/README.md`,
  `${COURSE_LAB_ROOT}/source-fixtures/creator-suite-api-policy-v1.md`,
  `${COURSE_LAB_ROOT}/source-fixtures/creator-suite-api-release-v2.md`,
  `${COURSE_LAB_ROOT}/source-fixtures/creator-suite-method-note.md`,
  `${COURSE_LAB_ROOT}/source-fixtures/creator-suite-product-page.md`,
  `${COURSE_LAB_ROOT}/synthetic-events.csv`,
  `${COURSE_LAB_ROOT}/synthetic-feedback.jsonl`,
]);
const LOCKED_SURFACE_PATHS = Object.freeze([
  "app/[locale]/creator-ops/[module]/page.tsx",
  "app/[locale]/creator-ops/page.tsx",
  "app/[locale]/courses/page.tsx",
  "app/[locale]/layout.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "app/sitemap.ts",
  "components/JsonLd.tsx",
  "components/I18nProvider.tsx",
  "components/Icon.tsx",
  "components/LanguageMenu.tsx",
  "components/Logo.tsx",
  "components/MobileNav.tsx",
  "components/NavLinks.tsx",
  "components/ProductionAnalytics.tsx",
  "components/Shell.tsx",
  "components/ThemeToggle.tsx",
  "components/courses/Catalog.tsx",
  "components/courses/Cover.module.css",
  "components/courses/Cover.tsx",
  "components/creator-ops/CourseDashboard.tsx",
  "components/creator-ops/CreatorOpsCourse.module.css",
  "components/creator-ops/Interactions.tsx",
  "components/creator-ops/ModuleView.tsx",
  "components/creator-ops/progress-store.ts",
  "components/progress-reset.ts",
  "lib/courses.ts",
  "lib/creator-ops/manifest.ts",
  "lib/creator-ops/sources.ts",
  "lib/creator-ops/copy/en.ts",
  "lib/creator-ops/copy/zh-Hans.ts",
  "lib/deterministic-build-id.cjs",
  "lib/creator-ops/index.ts",
  "lib/creator-ops/load.ts",
  "lib/creator-ops/progress.ts",
  "lib/creator-ops/types.ts",
  "lib/creator-ops/validate.ts",
  "lib/i18n.ts",
  "lib/progress.ts",
  "lib/seo.ts",
  "messages/ar.json",
  "messages/de.json",
  "messages/en.json",
  "messages/es.json",
  "messages/fr.json",
  "messages/ja.json",
  "messages/ko.json",
  "messages/zh-Hans.json",
  "messages/zh-Hant.json",
  "next.config.ts",
  "outputs/creator-ops-course-research-brief.md",
  "package-lock.json",
  "package.json",
  "public/courses/creator-ops/NOTICE.md",
  "public/courses/creator-ops/lab/README.md",
  "public/courses/creator-ops/lab/fault-injections.json",
  "public/courses/creator-ops/lab/manifest.sha256",
  "public/courses/creator-ops/lab/mock-publish-scenarios.json",
  "public/courses/creator-ops/lab/source-fixtures/README.md",
  "public/courses/creator-ops/lab/source-fixtures/creator-suite-api-policy-v1.md",
  "public/courses/creator-ops/lab/source-fixtures/creator-suite-api-release-v2.md",
  "public/courses/creator-ops/lab/source-fixtures/creator-suite-method-note.md",
  "public/courses/creator-ops/lab/source-fixtures/creator-suite-product-page.md",
  "public/courses/creator-ops/lab/synthetic-events.csv",
  "public/courses/creator-ops/lab/synthetic-feedback.jsonl",
  "scripts/check-creator-ops-browser.mjs",
  "scripts/check-creator-ops-course.mjs",
  "scripts/check-creator-ops-static.mjs",
  "vercel.json",
]);
const EXPECTED_RELEASE_SCOPE = "static-course-link-only-synthetic-no-external-writes";

const errors = [];
const warnings = [];
const notes = [];
const alreadyReportedMissing = new Set();

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const note = (message) => notes.push(message);
const abs = (path) => resolve(ROOT, path);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

function regularFile(path, label = rel(path)) {
  if (!existsSync(path)) {
    if (!alreadyReportedMissing.has(label)) {
      fail(`${label}: required file is missing`);
      alreadyReportedMissing.add(label);
    }
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${label}: expected a regular, non-symbolic file`);
    return false;
  }
  return true;
}

function readText(path) {
  const resolved = abs(path);
  return regularFile(resolved, path) ? readFileSync(resolved, "utf8") : "";
}

function readJson(path) {
  const text = readText(path);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${path}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return null;
  }
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function fileSha256(path) {
  return sha256(readText(path));
}

function lockedSurfaceSha256() {
  if (new Set(LOCKED_SURFACE_PATHS).size !== LOCKED_SURFACE_PATHS.length) {
    fail("Course 16 locked release surface contains duplicate file paths");
  }
  if (LOCKED_SURFACE_PATHS.includes(PROVENANCE_SIDECAR)) {
    fail("The provenance sidecar cannot hash itself; that would create a circular checksum receipt");
  }
  return sha256(
    LOCKED_SURFACE_PATHS
      .map((path) => `${path}\0${readText(path)}`)
      .join("\0"),
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sidecarScalar(text, key) {
  const matches = [...text.matchAll(
    new RegExp(`^${escapeRegExp(key)}\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^#\\r\\n]+))\\s*$`, "gm"),
  )];
  if (matches.length !== 1) {
    fail(`${PROVENANCE_SIDECAR}: ${key} must appear exactly once; found ${matches.length}`);
    return matches.length > 0
      ? (matches[0][1] ?? matches[0][2] ?? matches[0][3] ?? "").trim()
      : null;
  }
  const match = matches[0];
  return (match[1] ?? match[2] ?? match[3] ?? "").trim();
}

function uniqueMarkdownSection(text, startHeading, endHeading, path) {
  const lines = text.split(/\r?\n/u);
  const startIndexes = lines.flatMap((line, index) => line === startHeading ? [index] : []);
  const endIndexes = lines.flatMap((line, index) => line === endHeading ? [index] : []);
  if (startIndexes.length !== 1 || endIndexes.length !== 1) {
    fail(
      `${path}: expected exactly one ${JSON.stringify(startHeading)} and one ${JSON.stringify(endHeading)}`,
    );
    return "";
  }
  const [startIndex] = startIndexes;
  const [endIndex] = endIndexes;
  if (endIndex <= startIndex) {
    fail(`${path}: ${JSON.stringify(endHeading)} must follow ${JSON.stringify(startHeading)}`);
    return "";
  }
  return lines.slice(startIndex + 1, endIndex).join("\n");
}

function checkCanonicalSourceLedger(brief) {
  const section = uniqueMarkdownSection(
    brief,
    "### 12.2 二十七条 canonical GitHub source ledger",
    "### 12.3 机器发布断言",
    RESEARCH_BRIEF,
  );
  if (!section) return;

  const numberedRows = section
    .split(/\r?\n/u)
    .filter((line) => /^\|\s*\d+\s*\|/u.test(line));
  if (numberedRows.length !== EXPECTED_SOURCE_COUNT) {
    fail(
      `${RESEARCH_BRIEF}: canonical ledger must contain exactly ${EXPECTED_SOURCE_COUNT} numbered rows; found ${numberedRows.length}`,
    );
  }

  const rowPattern = /^\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|\s*(https:\/\/github\.com\/[^|\s]+)\s*\|\s*`([a-f0-9]{40})`\s*\|\s*(PASS|CONDITIONAL|EXCLUDED)(?:\s+—[^|]*)?\s*\|$/u;
  const parsedRows = [];
  for (const line of numberedRows) {
    const match = line.match(rowPattern);
    if (!match) {
      fail(`${RESEARCH_BRIEF}: malformed canonical ledger row ${JSON.stringify(line)}`);
      continue;
    }
    parsedRows.push({
      number: Number(match[1]),
      id: match[2],
      url: match[3],
      revision: match[4],
      decision: match[5],
    });
  }

  for (const field of ["number", "id", "url", "revision"]) {
    const values = parsedRows.map((row) => row[field]);
    if (new Set(values).size !== values.length) {
      fail(`${RESEARCH_BRIEF}: canonical ledger field ${field} must be unique`);
    }
  }
  if (parsedRows.length !== CREATOR_OPS_SOURCES.length) return;
  for (let index = 0; index < CREATOR_OPS_SOURCES.length; index += 1) {
    const source = CREATOR_OPS_SOURCES[index];
    const row = parsedRows[index];
    const expectedDecision = source.decision.toUpperCase();
    if (
      row.number !== index + 1
      || row.id !== source.id
      || row.url !== source.url
      || row.revision !== source.revision
      || row.decision !== expectedDecision
    ) {
      fail(
        `${RESEARCH_BRIEF}: canonical ledger row ${index + 1} must exactly match ${source.id} / ${source.url} / ${source.revision} / ${expectedDecision}`,
      );
    }
  }
}

function checkSidecarDecisionReconciliation(provenance) {
  const section = uniqueMarkdownSection(
    provenance,
    "## 二点五、Course 16 canonical ledger 裁决",
    "## 三、关键版本与条件快照",
    PROVENANCE_SIDECAR,
  );
  if (!section) return;

  const expected = new Map([
    ["openai-agents", "CONDITIONAL"],
    ["crawl4ai", "CONDITIONAL"],
    ["ffmpeg", "CONDITIONAL"],
    ["langfuse", "CONDITIONAL"],
    ["markitdown", "CONDITIONAL"],
    ["rsshub", "CONDITIONAL"],
  ]);
  const bullets = section.split(/\r?\n/u).filter((line) => /^-\s+/u.test(line));
  if (bullets.length !== expected.size) {
    fail(`${PROVENANCE_SIDECAR}: reconciliation section must contain exactly ${expected.size} source bullets; found ${bullets.length}`);
  }

  const parsed = [];
  for (const line of bullets) {
    const id = line.match(/^-\s+`([^`]+)`/u)?.[1];
    const decisions = [...line.matchAll(/`(PASS|CONDITIONAL|EXCLUDED)`/gu)].map((match) => match[1]);
    if (!id || decisions.length === 0) {
      fail(`${PROVENANCE_SIDECAR}: malformed reconciliation bullet ${JSON.stringify(line)}`);
      continue;
    }
    parsed.push({ id, decision: decisions.at(-1) });
  }
  const ids = parsed.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) {
    fail(`${PROVENANCE_SIDECAR}: reconciliation source ids must be unique`);
  }
  for (const [sourceId, decision] of expected) {
    const matches = parsed.filter((entry) => entry.id === sourceId && entry.decision === decision);
    if (matches.length !== 1) {
      fail(`${PROVENANCE_SIDECAR}: reconciled source decision must appear exactly once: ${sourceId} = ${decision}`);
    }
  }
  for (const entry of parsed) {
    if (!expected.has(entry.id)) {
      fail(`${PROVENANCE_SIDECAR}: unexpected reconciliation source ${entry.id}`);
    }
  }
}

function requireTokens(path, tokens) {
  const text = readText(path);
  if (!text) return "";
  for (const token of tokens) {
    if (!text.includes(token)) {
      fail(`${path}: missing token ${JSON.stringify(token)}`);
    }
  }
  return text;
}

function requireSingleOccurrences(path, text, tokens) {
  for (const token of tokens) {
    const count = text.split(token).length - 1;
    if (count !== 1) {
      fail(`${path}: ${JSON.stringify(token)} must appear exactly once; found ${count}`);
    }
  }
}

function requirePattern(path, text, pattern, description) {
  if (text && !pattern.test(text)) {
    fail(`${path}: missing ${description}`);
  }
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sameList(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function listRegularFiles(directory) {
  const resolved = abs(directory);
  if (!existsSync(resolved)) {
    if (!alreadyReportedMissing.has(directory)) {
      fail(`${directory}: required directory is missing`);
      alreadyReportedMissing.add(directory);
    }
    return [];
  }
  if (!lstatSync(resolved).isDirectory() || lstatSync(resolved).isSymbolicLink()) {
    fail(`${directory}: expected a real directory, not a file or symbolic link`);
    return [];
  }

  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      if (entry.isSymbolicLink()) {
        fail(`${rel(path)}: symbolic links are not allowed in the Course 16 release surface`);
      } else if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        files.push(rel(path));
      }
    }
  };
  visit(resolved);
  return files.sort();
}

function checkUnfinishedMarkers(path, text) {
  if (!text) return;
  const patterns = [
    /\b(?:TODO|TBD|FIXME)\b/i,
    /\bfinal reviewer acceptance\s*:\s*pending\b/i,
    /(?:待补|待审|尚未完成|最终审阅待定)/u,
  ];
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      warn(`${path}: contains an unfinished-review marker matching ${pattern}`);
    }
  }
}

async function checkCourseContract() {
  try {
    const validation = await validateCreatorOpsCourse();
    const validationErrors = Array.isArray(validation)
      ? validation
      : Array.isArray(validation?.errors)
        ? validation.errors
        : validation == null
          ? []
          : null;
    if (validationErrors === null) {
      fail("Course validator must return an error array, an object with errors, or throw on invalid data");
    } else {
      for (const message of validationErrors) {
        fail(`Course validator: ${String(message)}`);
      }
    }
    if (Array.isArray(validation?.warnings)) {
      for (const message of validation.warnings) {
        warn(`Course validator: ${String(message)}`);
      }
    }
  } catch (error) {
    fail(`Course validator threw: ${error instanceof Error ? error.message : String(error)}`);
  }

  const manifest = CREATOR_OPS_COURSE_MANIFEST;
  const manifestSlugs = manifest.modules.map((module) => module.slug);
  const exportedSlugs = [...CREATOR_OPS_MODULE_SLUGS];
  const exportedLocales = [...CREATOR_OPS_LOCALES];
  const exportedPhases = [...CREATOR_OPS_PHASE_IDS];
  const minutes = manifest.modules.reduce((sum, module) => sum + module.minutes, 0);

  if (CREATOR_OPS_COURSE_ID !== "creator-ops" || manifest.id !== "creator-ops") {
    fail(`Course ID must remain creator-ops; found ${manifest.id}`);
  }
  if (manifest.displayNumber !== 16) {
    fail(`Display number must remain 16; found ${manifest.displayNumber}`);
  }
  if (
    CREATOR_OPS_DEFAULT_CONTENT_LOCALE !== "en"
    || manifest.defaultContentLocale !== "en"
  ) {
    fail("The default reviewed content locale must remain en");
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    fail(`Manifest version must be semantic x.y.z; found ${manifest.version}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.publishedOn)) {
    fail(`Manifest publishedOn must be YYYY-MM-DD; found ${manifest.publishedOn}`);
  }
  if (!sameList(exportedSlugs, EXPECTED_MODULE_SLUGS)) {
    fail("Exported Course 16 module order drifted from the independent release contract");
  }
  if (!sameList(manifestSlugs, EXPECTED_MODULE_SLUGS)) {
    fail("Manifest Course 16 module order drifted from the independent release contract");
  }
  if (!sameList(exportedLocales, EXPECTED_LOCALES)) {
    fail("Course 16 route locale coverage must match the platform's nine locales");
  }
  if (!sameList(exportedPhases, EXPECTED_PHASE_IDS)) {
    fail("Course 16 phase IDs or phase order drifted");
  }
  if (manifest.modules.length !== 10) {
    fail(`Course 16 must contain exactly 10 modules; found ${manifest.modules.length}`);
  }
  if (manifest.phases.length !== 4) {
    fail(`Course 16 must contain exactly 4 phases; found ${manifest.phases.length}`);
  }
  if (minutes !== EXPECTED_MINUTES) {
    fail(`Course 16 must total ${EXPECTED_MINUTES} minutes; found ${minutes}`);
  }

  const phaseSlugs = manifest.phases.flatMap((phase) => phase.moduleSlugs);
  if (!sameList(phaseSlugs, EXPECTED_MODULE_SLUGS)) {
    fail("Phase-to-module wiring must cover every module exactly once and in course order");
  }
  for (const [index, phase] of manifest.phases.entries()) {
    if (phase.order !== index + 1) {
      fail(`${phase.id}: phase order must be ${index + 1}; found ${phase.order}`);
    }
    if (phase.id !== EXPECTED_PHASE_IDS[index]) {
      fail(`Phase ${index + 1}: expected ${EXPECTED_PHASE_IDS[index]}; found ${phase.id}`);
    }
  }
  for (const [index, courseModule] of manifest.modules.entries()) {
    if (courseModule.order !== index + 1) {
      fail(`${courseModule.slug}: module order must be ${index + 1}; found ${courseModule.order}`);
    }
    if (!Number.isInteger(courseModule.minutes) || courseModule.minutes < 30) {
      fail(`${courseModule.slug}: minutes must be an integer of at least 30`);
    }
    if (courseModule.sourceIds.length < 4) {
      fail(`${courseModule.slug}: each module needs at least four bounded source records`);
    }
    if (new Set(courseModule.sourceIds).size !== courseModule.sourceIds.length) {
      fail(`${courseModule.slug}: duplicate source IDs are not allowed`);
    }
    const owningPhase = manifest.phases.find((phase) => phase.id === courseModule.phaseId);
    if (!owningPhase?.moduleSlugs.includes(courseModule.slug)) {
      fail(`${courseModule.slug}: phaseId and phase moduleSlugs disagree`);
    }
  }

  note(`${manifest.phases.length} phases, ${manifest.modules.length} modules, ${minutes} minutes`);
}

function checkSourceContract() {
  if (CREATOR_OPS_SOURCES.length !== EXPECTED_SOURCE_COUNT) {
    fail(`Course 16 source register must contain ${EXPECTED_SOURCE_COUNT} records; found ${CREATOR_OPS_SOURCES.length}`);
  }

  const sourceIds = CREATOR_OPS_SOURCES.map((source) => source.id);
  if (new Set(sourceIds).size !== sourceIds.length) {
    fail("Course 16 source IDs must be unique");
  }
  const sourceById = new Map(CREATOR_OPS_SOURCES.map((source) => [source.id, source]));
  const usedSourceIds = new Set(
    CREATOR_OPS_COURSE_MANIFEST.modules.flatMap((courseModule) => courseModule.sourceIds),
  );
  const reviewedSnapshotMarkers = new Map([
    ["langgraph", ["1.2.11"]],
    ["markitdown", ["0.1.7"]],
    ["prefect", ["3.8.4"]],
    ["playwright", ["1.63.0-next", "1.62.1"]],
    ["browser-use", ["0.13.8"]],
    ["comfyui", ["0.33.0", "0.34.0", ">=0.30.0"]],
    ["umami", ["3.3.1"]],
    ["langfuse", ["4.19.0", "4.21.0"]],
    ["c2pa-rs", ["0.28.0-dev", "0.91.0-dev", "0.27.15"]],
  ]);

  const decisionCounts = { pass: 0, conditional: 0, excluded: 0 };
  for (const source of CREATOR_OPS_SOURCES) {
    decisionCounts[source.decision] += 1;
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository)) {
      fail(`${source.id}: repository must be an owner/name GitHub identifier`);
    }
    if (source.url !== `https://github.com/${source.repository}`) {
      fail(`${source.id}: source URL must be the canonical HTTPS GitHub repository URL`);
    }
    if (!/^[a-f0-9]{40}$/.test(source.revision)) {
      fail(`${source.id}: revision must be an exact lowercase 40-character Git commit SHA`);
    }
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(source.committedAt)
      || Number.isNaN(Date.parse(source.committedAt))
    ) {
      fail(`${source.id}: committedAt must be a valid UTC second-resolution timestamp`);
    }
    const licenseUrls = [source.licenseUrl, ...(source.additionalLicenseUrls ?? [])];
    if (new Set(licenseUrls).size !== licenseUrls.length) {
      fail(`${source.id}: license evidence URLs must be unique`);
    }
    for (const licenseUrl of licenseUrls) {
      if (!licenseUrl.startsWith(`${source.url}/blob/${source.revision}/`)) {
        fail(`${source.id}: every license URL must pin the same exact revision as the source record`);
      }
    }
    if (source.id === "c2pa-rs" && licenseUrls.length !== 2) {
      fail("c2pa-rs: dual MIT OR Apache-2.0 evidence requires both pinned license files");
    }
    for (const marker of reviewedSnapshotMarkers.get(source.id) ?? []) {
      if (!source.snapshot.includes(marker)) {
        fail(`${source.id}: snapshot must retain reviewed version marker ${marker}`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) {
      fail(`${source.id}: accessedOn must use YYYY-MM-DD`);
    }
    if (source.snapshot.trim().length < 20) {
      fail(`${source.id}: a dated version, tag, commit, or bounded snapshot note is required`);
    }
    if (!source.license.trim() || /^(?:unknown|n\/a|none)$/i.test(source.license.trim())) {
      fail(`${source.id}: a reviewed license expression is required`);
    }
    if (!source.publisher.trim()) {
      fail(`${source.id}: publisher is required`);
    }
    for (const locale of ["en", "zh-Hans"]) {
      if (source.supports[locale].trim().length < 20) {
        fail(`${source.id}: ${locale} supports statement is too short`);
      }
      if (source.boundary[locale].trim().length < 20) {
        fail(`${source.id}: ${locale} boundary statement is too short`);
      }
      if (source.supports[locale] === source.boundary[locale]) {
        fail(`${source.id}: ${locale} support and boundary must be distinct`);
      }
    }

    if (source.decision === "excluded") {
      if (source.role !== "license-case") {
        fail(`${source.id}: EXCLUDED sources may appear only as license cases`);
      }
      if (usedSourceIds.has(source.id)) {
        fail(`${source.id}: EXCLUDED source is wired into a runnable course module`);
      }
    } else if (!usedSourceIds.has(source.id)) {
      fail(`${source.id}: PASS/CONDITIONAL source is not assigned to a module`);
    }
  }

  for (const courseModule of CREATOR_OPS_COURSE_MANIFEST.modules) {
    for (const sourceId of courseModule.sourceIds) {
      const source = sourceById.get(sourceId);
      if (!source) {
        fail(`${courseModule.slug}: unknown source ID ${sourceId}`);
      } else if (source.decision === "excluded") {
        fail(`${courseModule.slug}: source ${sourceId} is EXCLUDED and cannot support hands-on work`);
      }
    }
  }

  const excludedIds = sorted(
    CREATOR_OPS_SOURCES
      .filter((source) => source.decision === "excluded")
      .map((source) => source.id),
  );
  if (!sameList(excludedIds, EXPECTED_EXCLUDED_SOURCE_IDS)) {
    fail(`EXCLUDED source set drifted: ${excludedIds.join(", ")}`);
  }
  for (const [decision, expected] of Object.entries(EXPECTED_SOURCE_COUNTS)) {
    if (decisionCounts[decision] !== expected) {
      fail(`Expected ${expected} ${decision.toUpperCase()} sources; found ${decisionCounts[decision]}`);
    }
  }

  const moneyPrinter = sourceById.get("moneyprinter-case");
  if (
    !moneyPrinter
    || moneyPrinter.repository !== "harry0703/MoneyPrinterTurbo"
    || moneyPrinter.decision !== "excluded"
    || !/不进入动手实验/u.test(moneyPrinter.boundary["zh-Hans"])
  ) {
    fail("MoneyPrinterTurbo must remain an EXCLUDED, non-hands-on licensing case");
  }
  const mediaCrawler = sourceById.get("mediacrawler-case");
  if (
    !mediaCrawler
    || mediaCrawler.repository !== "NanmiCoder/MediaCrawler"
    || mediaCrawler.decision !== "excluded"
    || !/不得安装或运行/u.test(mediaCrawler.boundary["zh-Hans"])
  ) {
    fail("MediaCrawler must remain EXCLUDED from installation and execution");
  }

  note(
    `${CREATOR_OPS_SOURCES.length} link-only GitHub records (${decisionCounts.pass} PASS, ${decisionCounts.conditional} CONDITIONAL, ${decisionCounts.excluded} EXCLUDED)`,
  );
}

function checkBehaviorContract() {
  const rejectedArtifacts = [
    "",
    "x".repeat(160),
    ["same placeholder line".repeat(4), "same placeholder line".repeat(4), "same placeholder line".repeat(4)].join("\n"),
    "One long line with several words but no operational structure, review boundary, evidence receipt, or additional substantive lines.".repeat(2),
  ];
  for (const [index, fixture] of rejectedArtifacts.entries()) {
    if (isMeaningfulCreatorOpsArtifact(fixture)) {
      fail(`Artifact behavior fixture ${index + 1}: low-information input must not unlock a receipt`);
    }
  }
  const meaningfulArtifact = [
    "Audience signal: independent language teachers need one dependable weekly publishing rhythm with a defined harm metric.",
    "Evidence receipt: every factual claim keeps a source URL, retrieval date, confidence note, and a named human reviewer.",
    "Authority boundary: the agent may draft and package assets, while a human alone approves distribution or correction.",
  ].join("\n");
  if (!isMeaningfulCreatorOpsArtifact(meaningfulArtifact)) {
    fail("Artifact behavior fixture: a substantive three-line operating artifact must unlock a receipt");
  }
  if (!isMeaningfulCreatorOpsArtifactDraft(
    meaningfulArtifact,
    CREATOR_OPS_EN_COPY.modules[EXPECTED_MODULE_SLUGS[0]].practice.template,
  )) {
    fail("Artifact behavior fixture: original substantive work must pass the template-similarity guard");
  }
  const copyPastePadding = {
    en: "\nUnrelated padding: pineapple comet velvet marble lantern quartz. This text does not answer any field or prove learner work.",
    "zh-Hans": "\n无关填充：菠萝彗星天鹅绒大理石灯笼石英。这段文字没有回答任何字段，也不能证明学习者完成了原创工作。",
  };
  for (const [locale, copy] of [["en", CREATOR_OPS_EN_COPY], ["zh-Hans", CREATOR_OPS_ZH_HANS_COPY]]) {
    const filenames = new Set();
    for (const slug of EXPECTED_MODULE_SLUGS) {
      const template = copy.modules[slug].practice.template;
      const filename = copy.modules[slug].practice.downloadFilename;
      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u.test(filename)
        || filenames.has(filename)
        || copy.modules[slug].practice.artifact !== filename
      ) {
        fail(`${locale}/${slug}: browser export requires a unique, safe Markdown download filename`);
      }
      filenames.add(filename);
      if (
        isMeaningfulCreatorOpsArtifactDraft(template, template)
        || isMeaningfulCreatorOpsArtifactDraft(`${template} x`, template)
        || isMeaningfulCreatorOpsArtifactDraft(`x ${template}`, template)
        || isMeaningfulCreatorOpsArtifactDraft(`${template}${copyPastePadding[locale]}`, template)
        || isMeaningfulCreatorOpsArtifactDraft(`${copyPastePadding[locale]}${template}`, template)
      ) {
        fail(`${locale}/${slug}: reference template, one-character edit, or copy-paste padding must not unlock a receipt`);
      }
    }
  }

  const questions = Array.from({ length: 10 }, (_, index) => ({
    id: `release-fixture-${index + 1}`,
    moduleTitle: `Module ${index + 1}`,
    question: `Boundary question ${index + 1}`,
    options: ["human gate", "autopublish", "hide evidence", "share secrets"],
    correctIndex: 0,
    explanation: "Human authority and evidence remain explicit.",
  }));
  const eightCorrect = Object.fromEntries(questions.map((question, index) => [question.id, index < 8 ? 0 : 1]));
  const sevenCorrect = Object.fromEntries(questions.map((question, index) => [question.id, index < 7 ? 0 : 1]));
  const passResult = gradeCreatorOpsAssessment(questions, eightCorrect);
  const failResult = gradeCreatorOpsAssessment(questions, sevenCorrect);
  if (!passResult.passed || passResult.percent !== 80 || failResult.passed || failResult.percent !== 70) {
    fail("Assessment behavior fixture: the release contract requires an exact 80% passing threshold");
  }

  const slug = EXPECTED_MODULE_SLUGS[0];
  const receipt = {};
  if (reconcileCreatorOpsModuleCompletion(receipt, slug)) {
    fail("Module behavior fixture: an empty record must not complete a module");
  }
  receipt[creatorOpsArtifactEvidenceKey(slug)] = true;
  if (reconcileCreatorOpsModuleCompletion(receipt, slug)) {
    fail("Module behavior fixture: artifact evidence alone must not complete a module");
  }
  receipt[creatorOpsCheckpointPassedKey(slug)] = true;
  if (
    !reconcileCreatorOpsModuleCompletion(receipt, slug)
    || receipt[creatorOpsModuleProgressKey(slug)] !== true
  ) {
    fail("Module behavior fixture: artifact plus passing checkpoint must complete a module");
  }

  const capstoneRecord = {};
  const completeChecks = Array.from(
    { length: CREATOR_OPS_CAPSTONE_ARTIFACT_COUNT },
    () => true,
  );
  if (recordCreatorOpsCapstone(capstoneRecord, completeChecks)) {
    fail("Capstone behavior fixture: ten self-checked artifacts alone must not complete the capstone");
  }
  for (const courseModule of CREATOR_OPS_COURSE_MANIFEST.modules) {
    capstoneRecord[creatorOpsArtifactEvidenceKey(courseModule.slug)] = true;
    capstoneRecord[creatorOpsCheckpointPassedKey(courseModule.slug)] = true;
    reconcileCreatorOpsModuleCompletion(capstoneRecord, courseModule.slug);
  }
  capstoneRecord[CREATOR_OPS_QUIZ_PASSED_KEY] = true;
  if (!recordCreatorOpsCapstone(capstoneRecord, completeChecks)) {
    fail("Capstone behavior fixture: all modules, a passed assessment, and ten checked artifacts must complete the capstone");
  }

  const interactions = readText(`${COURSE_COMPONENT_ROOT}/Interactions.tsx`);
  for (const token of [
    'useState("")',
    "isMeaningfulCreatorOpsArtifactDraft",
    "Reference template",
    "beforeunload",
    "stopImmediatePropagation",
    "history.pushState",
    "__creatorOpsDraftGuard",
    "armLegacySentinel",
    'addEventListener("popstate", interceptLegacyTraversal)',
    "navigator.clipboard.writeText",
    "practice.downloadFilename",
    "!exported",
    "hasCreatorOpsCapstonePrerequisites",
    "receiptBoundary",
    "draft is not saved",
  ]) {
    if (!interactions.includes(token)) {
      fail(`${COURSE_COMPONENT_ROOT}/Interactions.tsx: missing behavior guard ${JSON.stringify(token)}`);
    }
  }
  if (/useState\(\s*practice\.template\s*\)/.test(interactions)) {
    fail("Practice workbench must start blank; the reference template cannot prefill learner evidence");
  }
  if (/correct\s*\|\|\s*passed/.test(interactions)) {
    fail("Current checkpoint feedback must not report a wrong retry as correct after a historical pass");
  }

  const moduleView = readText(`${COURSE_COMPONENT_ROOT}/ModuleView.tsx`);
  if (!moduleView.includes('aria-label={`${ui.module} ${candidate.order}: ${candidate.copy.title}`}')) {
    fail("Module rail links require module number and title in their accessible names");
  }
  const browserAudit = requireTokens("scripts/check-creator-ops-browser.mjs", [
    'chromium.launch({ headless: true })',
    "axe.run",
    "template}x",
    "complete reference template plus copy-paste padding",
    "operating-contract.md",
    "signal-radar-and-editorial-queue.md",
    "manifest.sha256",
    "mock-publish-scenarios.json",
    "nine route locales hydrate",
    "creator-ops.capstone.v1",
    "localStorage",
    "Storage denied by Course 16 audit",
    "triggerHistoryDialog",
    "typeof window.navigation",
    "1_440",
  ]);
  if (/"creator-ops\.progress\.version"\s*:\s*"\d+\.\d+\.\d+:progress-v1"/u.test(browserAudit)) {
    fail("Course 16 browser audit must derive the progress version from the built app instead of hard-coding a course version");
  }
  if (!browserAudit.includes('existing["creator-ops.progress.version"]')) {
    fail("Course 16 browser audit must reuse the built app progress-version marker in prerequisite fixtures");
  }
  requireTokens("scripts/check-creator-ops-static.mjs", [
    "isRegularDeploymentFile",
    "collectDeploymentFiles",
    "collectTopLevelDeploymentFiles",
    'collectDeploymentFiles(OUTPUT_ROOT, "out")',
    'file.relative === "ar/about/index.html"',
    "manifestVersion",
    'join(OUTPUT_ROOT, "_next")',
    'join(OUTPUT_ROOT, "courses", "creator-ops", "NOTICE.md")',
    "deploymentSurfaceDigest",
    "mutationCandidate",
    "local deployment reference escapes out/",
    'targetRelative.startsWith(`..${sep}`)',
  ]);
  note("Behavior fixtures passed: meaningful artifact, safe download, 80% assessment, module/capstone prerequisites, and draft privacy guards");
}

function checkOfflineLabContract() {
  const actualFiles = listRegularFiles(COURSE_LAB_ROOT);
  if (!sameList(actualFiles, [...EXPECTED_LAB_FILES])) {
    fail(`${COURSE_LAB_ROOT}: offline lab inventory must match the ${EXPECTED_LAB_FILES.length}-file release contract exactly`);
  }

  const manifestPath = `${COURSE_LAB_ROOT}/manifest.sha256`;
  const manifest = readText(manifestPath);
  const manifestEntries = manifest
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-f0-9]{64}) {2}([^\0\r\n]+)$/u);
      if (!match) {
        fail(`${manifestPath}: malformed SHA-256 line ${JSON.stringify(line)}`);
        return null;
      }
      return { digest: match[1], relative: match[2] };
    })
    .filter(Boolean);
  const expectedManifestRelatives = EXPECTED_LAB_FILES
    .filter((path) => path !== manifestPath)
    .map((path) => path.slice(`${COURSE_LAB_ROOT}/`.length));
  const manifestRelatives = manifestEntries.map((entry) => entry.relative);
  if (
    manifestEntries.length !== expectedManifestRelatives.length
    || new Set(manifestRelatives).size !== manifestRelatives.length
    || !sameList(sorted(manifestRelatives), sorted(expectedManifestRelatives))
  ) {
    fail(`${manifestPath}: manifest must cover every non-manifest lab file exactly once and no other path`);
  }
  for (const entry of manifestEntries) {
    if (entry.relative.startsWith("/") || entry.relative.split("/").includes("..")) {
      fail(`${manifestPath}: unsafe manifest path ${JSON.stringify(entry.relative)}`);
      continue;
    }
    const path = `${COURSE_LAB_ROOT}/${entry.relative}`;
    if (fileSha256(path) !== entry.digest) {
      fail(`${manifestPath}: digest mismatch for ${entry.relative}`);
    }
  }

  const allLabText = actualFiles.map(readText).join("\n");
  if (/https?:\/\//iu.test(allLabText)) {
    fail(`${COURSE_LAB_ROOT}: offline synthetic fixtures must not contain HTTP(S) endpoints or remote dependencies`);
  }
  for (const token of ["CC0-1.0", "synthetic", "network_required", "mock://"]) {
    if (!allLabText.includes(token)) fail(`${COURSE_LAB_ROOT}: missing offline-fixture boundary ${JSON.stringify(token)}`);
  }

  const sensitiveKeys = new Set([
    "api_key", "access_token", "refresh_token", "password", "secret", "cookie", "authorization",
  ]);
  const inspectKeys = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => inspectKeys(item, `${path}[${index}]`));
    } else if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        if (sensitiveKeys.has(key.toLocaleLowerCase("en-US"))) {
          fail(`${path}: synthetic lab must not contain credential field ${key}`);
        }
        inspectKeys(nested, `${path}.${key}`);
      }
    }
  };

  const faults = readJson(`${COURSE_LAB_ROOT}/fault-injections.json`);
  const expectedFaultIds = [
    "F01_MISSING_EVIDENCE",
    "F02_SOURCE_INJECTION",
    "F03_UNLICENSED_ASSET",
    "F04_AMBIGUOUS_PUBLISH",
    "F05_CORRECTION_REQUEST",
    "F06_METRIC_ANOMALY",
  ];
  if (
    faults?.synthetic !== true
    || faults?.network_required !== false
    || faults?.license !== "CC0-1.0"
    || !Array.isArray(faults?.faults)
    || !sameList(faults.faults.map((fault) => fault.fault_id), expectedFaultIds)
  ) {
    fail(`${COURSE_LAB_ROOT}/fault-injections.json: six-fault offline contract is invalid`);
  } else {
    for (const fault of faults.faults) {
      if (
        !fault.expected_control?.decision
        || fault.expected_control.automatic_retry !== false
        || !fault.expected_receipt?.status
        || !Array.isArray(fault.expected_receipt.required_fields)
        || fault.expected_receipt.required_fields.length < 5
        || !fault.pass_condition
        || !fault.prohibited_action
      ) {
        fail(`${COURSE_LAB_ROOT}/fault-injections.json: ${fault.fault_id} lacks a fail-closed control, receipt, or pass contract`);
      }
    }
    inspectKeys(faults, `${COURSE_LAB_ROOT}/fault-injections.json`);
  }

  const publishScenarios = readJson(`${COURSE_LAB_ROOT}/mock-publish-scenarios.json`);
  if (
    publishScenarios?.synthetic !== true
    || publishScenarios?.network_required !== false
    || publishScenarios?.license !== "CC0-1.0"
    || !Array.isArray(publishScenarios?.scenarios)
    || publishScenarios.scenarios.length !== 6
  ) {
    fail(`${COURSE_LAB_ROOT}/mock-publish-scenarios.json: six-scenario offline publish contract is invalid`);
  } else {
    for (const scenario of publishScenarios.scenarios) {
      const locators = [scenario.endpoint, scenario.reconciliation?.lookup].filter(Boolean);
      if (
        !scenario.scenario_id
        || locators.some((locator) => typeof locator !== "string" || !locator.startsWith("mock://"))
        || !scenario.expected_control?.decision
        || !scenario.expected_receipt?.status
        || !Array.isArray(scenario.expected_receipt.required_fields)
        || scenario.expected_receipt.required_fields.length < 5
        || !scenario.pass_condition
      ) {
        fail(`${COURSE_LAB_ROOT}/mock-publish-scenarios.json: ${scenario.scenario_id ?? "unknown"} lacks an inert locator, control, receipt, or pass condition`);
      }
    }
    const legacy = publishScenarios.scenarios.find((scenario) => scenario.scenario_id === "PUB-06-V1-AMBIGUOUS-LEGACY");
    if (legacy?.request?.idempotency_key !== null || legacy?.expected_control?.decision !== "stop_and_escalate") {
      fail(`${COURSE_LAB_ROOT}/mock-publish-scenarios.json: legacy no-idempotency ambiguity must stop and escalate`);
    }
    inspectKeys(publishScenarios, `${COURSE_LAB_ROOT}/mock-publish-scenarios.json`);
  }

  const eventPath = `${COURSE_LAB_ROOT}/synthetic-events.csv`;
  const eventLines = readText(eventPath).trim().split(/\r?\n/u);
  const expectedEventHeader = [
    "event_id", "occurred_at", "content_id", "content_version", "channel", "session_key",
    "event_name", "qualified", "consented", "bot_suspected", "campaign", "experiment_arm", "value",
  ];
  const eventRows = eventLines.slice(1).map((line) => line.split(","));
  if (
    !sameList(eventLines[0]?.split(",") ?? [], expectedEventHeader)
    || eventRows.length !== 33
    || eventRows.some((row) => row.length !== expectedEventHeader.length)
    || new Set(eventRows.map((row) => row[0])).size !== eventRows.length
    || !eventRows.some((row) => row[8] === "false")
    || !eventRows.some((row) => row[9] === "true")
    || !eventRows.some((row) => row[3] === "v2")
  ) {
    fail(`${eventPath}: expected 33 unique, consent/anomaly/version-bearing synthetic event rows`);
  }

  const feedbackPath = `${COURSE_LAB_ROOT}/synthetic-feedback.jsonl`;
  const feedback = readText(feedbackPath).trim().split(/\r?\n/u).flatMap((line, index) => {
    try {
      return [JSON.parse(line)];
    } catch (error) {
      fail(`${feedbackPath}:${index + 1}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
      return [];
    }
  });
  const requiredFeedbackCategories = new Set([
    "question", "confusion", "objection", "correction", "lived_example", "support_need", "harmful_behavior",
  ]);
  const observedFeedbackCategories = new Set(feedback.map((item) => item.category));
  if (
    feedback.length !== 10
    || new Set(feedback.map((item) => item.feedback_id)).size !== feedback.length
    || feedback.some((item) => item.contains_personal_data !== false || item.consent_basis !== "synthetic-lab-fixture")
    || [...requiredFeedbackCategories].some((category) => !observedFeedbackCategories.has(category))
  ) {
    fail(`${feedbackPath}: expected ten unique, non-personal synthetic feedback records with all required categories`);
  }

  const moduleView = readText(`${COURSE_COMPONENT_ROOT}/ModuleView.tsx`);
  const dashboard = readText(`${COURSE_COMPONENT_ROOT}/CourseDashboard.tsx`);
  for (const resource of [
    "source-fixtures/README.md",
    "source-fixtures/creator-suite-method-note.md",
    "fault-injections.json",
    "mock-publish-scenarios.json",
    "synthetic-events.csv",
    "synthetic-feedback.jsonl",
    "manifest.sha256",
  ]) {
    if (!moduleView.includes(resource)) fail(`${COURSE_COMPONENT_ROOT}/ModuleView.tsx: lab resource is not discoverable: ${resource}`);
  }
  if (!dashboard.includes("/courses/creator-ops/lab/README.md")) {
    fail(`${COURSE_COMPONENT_ROOT}/CourseDashboard.tsx: capstone does not link the offline lab package`);
  }
  note("Offline lab fixtures passed: exact 11-file inventory, SHA-256 manifest, six faults, six mock publishes, 33 events, and 10 feedback records");
}

function checkBilingualContract() {
  const enPath = "lib/creator-ops/copy/en.ts";
  const zhPath = "lib/creator-ops/copy/zh-Hans.ts";
  const en = requireTokens(enPath, ["CREATOR_OPS_EN_COPY"]);
  const zh = requireTokens(zhPath, ["CREATOR_OPS_ZH_HANS_COPY"]);
  const load = requireTokens("lib/creator-ops/load.ts", [
    "CREATOR_OPS_EN_COPY",
    "CREATOR_OPS_ZH_HANS_COPY",
    "CREATOR_OPS_COPY_BUNDLES",
    "CREATOR_OPS_TRANSLATED_LOCALES",
    "contentLocale",
    "loadCreatorOpsCourse",
    "getCreatorOpsModule",
    "isCreatorOpsLocale",
    "isCreatorOpsModuleSlug",
  ]);

  for (const [path, text] of [[enPath, en], [zhPath, zh]]) {
    for (const slug of EXPECTED_MODULE_SLUGS) {
      if (!text.includes(slug)) {
        fail(`${path}: missing copy for module ${slug}`);
      }
    }
    checkUnfinishedMarkers(path, text);
  }
  if (en) {
    const englishWords = en.match(/\b[A-Za-z][A-Za-z'-]*\b/g)?.length ?? 0;
    if (englishWords < 800) {
      fail(`${enPath}: expected substantive English long-form copy; found about ${englishWords} words`);
    }
  }
  if (zh) {
    const chineseCharacters = zh.match(/[\u3400-\u9fff]/g)?.length ?? 0;
    if (chineseCharacters < 800) {
      fail(`${zhPath}: expected substantive Simplified-Chinese long-form copy; found ${chineseCharacters} CJK characters`);
    }
  }
  if (load) {
    requirePattern(
      "lib/creator-ops/load.ts",
      load,
      /en\s*:\s*\{[^}]*contentLocale\s*:\s*["']en["']/s,
      "an explicitly reviewed English content bundle",
    );
    requirePattern(
      "lib/creator-ops/load.ts",
      load,
      /["']zh-Hans["']\s*:\s*\{[^}]*contentLocale\s*:\s*["']zh-Hans["']/s,
      "an explicitly reviewed Simplified-Chinese content bundle",
    );
  }
}

function checkFilesRoutesAndPresentation() {
  const requiredFiles = [
    `${COURSE_ROUTE_ROOT}/page.tsx`,
    `${COURSE_ROUTE_ROOT}/[module]/page.tsx`,
    `${COURSE_COMPONENT_ROOT}/CourseDashboard.tsx`,
    `${COURSE_COMPONENT_ROOT}/Interactions.tsx`,
    `${COURSE_COMPONENT_ROOT}/ModuleView.tsx`,
    `${COURSE_COMPONENT_ROOT}/progress-store.ts`,
    "components/ProductionAnalytics.tsx",
    "lib/creator-ops/copy/en.ts",
    "lib/creator-ops/copy/zh-Hans.ts",
    "lib/creator-ops/index.ts",
    "lib/creator-ops/load.ts",
    "lib/creator-ops/manifest.ts",
    "lib/creator-ops/progress.ts",
    "lib/creator-ops/sources.ts",
    "lib/creator-ops/types.ts",
    "lib/creator-ops/validate.ts",
    RESEARCH_BRIEF,
    PROVENANCE_SIDECAR,
    `${COURSE_PUBLIC_ROOT}/NOTICE.md`,
  ];
  for (const path of requiredFiles) regularFile(abs(path), path);

  const overviewRoute = requireTokens(`${COURSE_ROUTE_ROOT}/page.tsx`, [
    "dynamicParams = false",
    "generateStaticParams",
    "params: Promise",
    "CREATOR_OPS_LOCALES.map",
    "CREATOR_OPS_TRANSLATED_LOCALES",
    "availableLocales:",
    "canonicalLocale: course.contentLocale",
    "notFound",
    'courseCode: "16"',
    '"Course"',
    '"BreadcrumbList"',
    "<CourseDashboard",
  ]);
  const moduleRoute = requireTokens(`${COURSE_ROUTE_ROOT}/[module]/page.tsx`, [
    "dynamicParams = false",
    "generateStaticParams",
    "params: Promise",
    "CREATOR_OPS_MODULE_SLUGS.map",
    "isCreatorOpsModuleSlug",
    "creatorOpsModulePage",
    "notFound",
    '"LearningResource"',
    '"BreadcrumbList"',
    "<ModuleView",
  ]);
  if (/<main\b/.test(overviewRoute) || /<main\b/.test(moduleRoute)) {
    fail("Course 16 routes must not nest a second main landmark inside Shell");
  }

  const dashboard = requireTokens(`${COURSE_COMPONENT_ROOT}/CourseDashboard.tsx`, [
    "course.contentLocale",
    "course.copy.meta.languageNotice",
    "course.copy.meta.evidenceNote",
    "course.copy.sourceDecisions",
    "course.phases",
    "course.modules",
    "additionalLicenseUrls",
    "/courses/creator-ops/lab/README.md",
  ]);
  const moduleView = requireTokens(`${COURSE_COMPONENT_ROOT}/ModuleView.tsx`, [
    "course.contentLocale",
    "module.copy.sections",
    "module.copy.practice",
    "module.copy.checkpoint",
    "source.decision",
    "source.license",
    "source.supports",
    "source.boundary",
    "additionalLicenseUrls",
    "CREATOR_OPS_LAB_RESOURCES",
    "sourceRoleNotice",
  ]);
  const interactions = requireTokens(`${COURSE_COMPONENT_ROOT}/Interactions.tsx`, [
    "ModuleCheckpoint",
    "ModuleCompletion",
    "FinalAssessment",
    "CapstoneChecklist",
  ]);
  const progressStore = requireTokens(`${COURSE_COMPONENT_ROOT}/progress-store.ts`, [
    "PROG",
    "CREATOR_OPS_PROGRESS_VERSION_KEY",
    "CREATOR_OPS_PROGRESS_RESET_EVENT",
  ]);
  if (/localStorage\.clear\s*\(/.test(progressStore)) {
    fail("Course 16 must not clear the shared progress store");
  }

  const localeLayout = requireTokens("app/[locale]/layout.tsx", [
    "ProductionAnalytics",
    "<ProductionAnalytics />",
    "Viewport",
    "export const viewport",
    'colorScheme: "light dark"',
  ]);
  if (/<meta\s+name=["']color-scheme["']/u.test(localeLayout)) {
    fail("app/[locale]/layout.tsx: color-scheme must use Next's static Viewport API, not hand-authored head markup");
  }
  if (/process\.env\.VERCEL/u.test(localeLayout)) {
    fail("app/[locale]/layout.tsx: build-host markers must not change the signed static export");
  }
  const nextConfig = requireTokens("next.config.ts", [
    "createRequire",
    "requireFromConfig",
    "import.meta.url",
    "deterministicBuildId",
    "generateBuildId",
    'output: "export"',
  ]);
  const buildIdHelper = requireTokens("lib/deterministic-build-id.cjs", [
    "BUILD_ID_INPUT_PATHS",
    "DEFAULT_PROJECT_ROOT",
    'resolve(__dirname, "..")',
    '"app"',
    '"components"',
    '"lib"',
    '"messages"',
    '"public"',
    '"next.config.ts"',
    '"package-lock.json"',
    '"package.json"',
    '"tsconfig.json"',
    '"vercel.json"',
    'createHash("sha256")',
    'agentic-engineering-build-input-v1',
    'hash.update("\\0")',
  ]);
  if (/process\.cwd\s*\(/u.test(buildIdHelper)) {
    fail("lib/deterministic-build-id.cjs: the default project root must not depend on the invoking shell cwd");
  }
  const originalWorkingDirectory = process.cwd();
  try {
    process.chdir(dirname(ROOT));
    if (deterministicBuildId() !== deterministicBuildId(ROOT)) {
      fail("lib/deterministic-build-id.cjs: the default root must match an explicit project root from an external cwd");
    }
  } catch (error) {
    fail(`lib/deterministic-build-id.cjs: external-cwd regression fixture failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    process.chdir(originalWorkingDirectory);
  }
  if (/generateBuildId[\s\S]{0,160}process\.env\./u.test(nextConfig)) {
    fail("next.config.ts: generateBuildId must not depend on a build-host environment marker");
  }
  const nextConfigEnvironmentRefs = [...nextConfig.matchAll(/\bprocess\.env\.([A-Z0-9_]+)/gu)]
    .map((match) => match[1]);
  if (
    [...nextConfig.matchAll(/\bprocess\.env\b/gu)].length !== 1
    || !sameList(nextConfigEnvironmentRefs, ["NODE_ENV"])
  ) {
    fail("next.config.ts: NODE_ENV may select static export mode, but no build-host environment value may affect output");
  }
  for (const sourceRoot of ["app", "components", "lib"]) {
    for (const path of listRegularFiles(sourceRoot).filter((file) => /\.(?:[cm]?js|tsx?)$/u.test(file))) {
      if (/\b(?:process\.env|import\.meta\.env)\b/u.test(readText(path))) {
        fail(`${path}: static application source must not branch on build-host environment values`);
      }
    }
  }
  requireTokens("components/ProductionAnalytics.tsx", [
    "useSyncExternalStore",
    "window.location.hostname",
    'hostname === "aicourse.top"',
    'hostname.endsWith(".vercel.app")',
  ]);

  const componentFiles = listRegularFiles(COURSE_COMPONENT_ROOT);
  const routeFiles = listRegularFiles(COURSE_ROUTE_ROOT);
  const cssFiles = componentFiles.filter((path) => path.endsWith(".module.css"));
  if (cssFiles.length === 0) {
    fail(`${COURSE_COMPONENT_ROOT}: at least one CSS module is required`);
  }
  const combinedCss = cssFiles.map(readText).join("\n");
  if (combinedCss && !/:focus-visible\b/.test(combinedCss)) {
    fail("Course 16 CSS requires an explicit :focus-visible rule");
  }
  if (
    combinedCss
    && !/:focus-visible[^{}]*\{[^}]*(?:outline|box-shadow)\s*:/s.test(combinedCss)
  ) {
    fail("Course 16 focus-visible rule requires a visible outline or box-shadow");
  }
  if (combinedCss && !/@media[^{}]*\(prefers-reduced-motion\s*:\s*reduce\)/s.test(combinedCss)) {
    fail("Course 16 CSS requires a prefers-reduced-motion: reduce override");
  }
  if (/url\(\s*["']?https?:\/\//i.test(combinedCss)) {
    fail("Course 16 CSS must not load remote media, fonts, or stylesheets");
  }

  const cssClasses = new Set(
    Array.from(combinedCss.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g), (match) => match[1]),
  );
  const codeFiles = [...componentFiles, ...routeFiles]
    .filter((path) => /\.(?:ts|tsx|js|jsx)$/.test(path));
  for (const path of codeFiles) {
    const text = readText(path);
    if (/\b(?:src|srcSet|poster)\s*=\s*["'`]https?:\/\//i.test(text)) {
      fail(`${path}: remote embedded media is prohibited`);
    }
    if (/<main\b/.test(text)) {
      fail(`${path}: Shell owns the only main landmark`);
    }
    if (/tabIndex\s*=\s*\{?[1-9]\d*\}?/.test(text)) {
      fail(`${path}: positive tabIndex values are prohibited`);
    }
    for (const className of Array.from(
      text.matchAll(/styles\.([A-Za-z][A-Za-z0-9_]*)/g),
      (match) => match[1],
    )) {
      if (cssClasses.size > 0 && !cssClasses.has(className)) {
        fail(`${path}: CSS module class .${className} is not defined`);
      }
    }
    checkUnfinishedMarkers(path, text);
  }
  for (const [path, text] of [
    [`${COURSE_COMPONENT_ROOT}/CourseDashboard.tsx`, dashboard],
    [`${COURSE_COMPONENT_ROOT}/ModuleView.tsx`, moduleView],
    [`${COURSE_COMPONENT_ROOT}/Interactions.tsx`, interactions],
  ]) {
    if (/<main\b/.test(text)) fail(`${path}: nested main landmark is prohibited`);
  }

  const publicFiles = listRegularFiles(COURSE_PUBLIC_ROOT);
  const mediaExtensions = new Set([
    ".avif", ".gif", ".jpeg", ".jpg", ".m4a", ".mp3", ".mp4", ".ogg",
    ".png", ".svg", ".wav", ".webm", ".webp",
  ]);
  for (const path of publicFiles) {
    if (mediaExtensions.has(extname(path).toLowerCase())) {
      fail(`${path}: Course 16 publishes no copied or third-party media assets`);
    }
  }
}

function checkNoticeAndResearch() {
  const noticePath = `${COURSE_PUBLIC_ROOT}/NOTICE.md`;
  const notice = requireTokens(noticePath, [
    "Course 16",
    "creator-ops",
    "Link-only use of GitHub",
    "No third-party code or media is copied",
    "PASS",
    "CONDITIONAL",
    "EXCLUDED",
    "MoneyPrinterTurbo",
    "MediaCrawler",
    "not installed, invoked, packaged, adapted, or exercised",
    "official APIs",
    "human approval",
    "licenses",
    "AGPL network-interaction duties or GPL distribution duties",
  ]);
  if (/!\[[^\]]*\]\(\s*https?:\/\//i.test(notice) || /<img\b/i.test(notice)) {
    fail(`${noticePath}: NOTICE must not embed remote or third-party images`);
  }
  if (!/MoneyPrinterTurbo[\s\S]{0,900}EXCLUDED/i.test(notice)) {
    fail(`${noticePath}: MoneyPrinterTurbo requires an explicit nearby EXCLUDED boundary`);
  }
  if (!/MediaCrawler[\s\S]{0,900}EXCLUDED/i.test(notice)) {
    fail(`${noticePath}: MediaCrawler requires an explicit nearby EXCLUDED boundary`);
  }
  if (/AGPL or GPL network\/distribution duties/i.test(notice)) {
    fail(`${noticePath}: NOTICE must distinguish AGPL network duties from GPL distribution duties`);
  }

  const brief = readText(RESEARCH_BRIEF);
  if (brief) {
    for (const token of [
      "creator-ops",
      "PASS",
      "CONDITIONAL",
      "EXCLUDED",
      "MoneyPrinterTurbo",
      "MediaCrawler",
    ]) {
      if (!brief.includes(token)) {
        fail(`${RESEARCH_BRIEF}: missing ${JSON.stringify(token)}`);
      }
    }
    for (const slug of EXPECTED_MODULE_SLUGS) {
      if (!brief.includes(slug)) {
        fail(`${RESEARCH_BRIEF}: missing module evidence row ${slug}`);
      }
    }
    checkCanonicalSourceLedger(brief);
    if (!brief.includes("唯一发布裁决")) {
      fail(`${RESEARCH_BRIEF}: candidate research must explicitly defer to the canonical ledger as the sole release decision`);
    }
    for (const [pattern, description] of [
      [/###\s+5\.1\s+PASS/iu, "a contradictory preliminary PASS heading"],
      [/FunAudioLLM\/CosyVoice/iu, "the former CosyVoice repository owner"],
      [/0\.19\.x/iu, "the stale OpenAI Agents release line"],
      [/0\.26\.x/iu, "the stale c2patool stable release line"],
      [/0\.13\.7/iu, "the stale browser-use pinned metadata version"],
      [/\b1\.2\.9\b/iu, "the stale LangGraph review snapshot"],
      [/\b1\.60\.0\b/iu, "the stale Playwright review snapshot"],
      [/\b0\.12\.9\b/iu, "the stale browser-use release snapshot"],
      [/\bv3\.3\.0\b/iu, "the stale Umami review snapshot"],
      [/\bv3\.176\.0\b/iu, "the stale Langfuse review snapshot"],
      [/\bPython\s+1\.2\.0\b/iu, "the stale Microsoft Agent Framework Python snapshot"],
      [/\b1\.14\.7\b/iu, "the stale CrewAI review snapshot"],
      [/release(?:\s+页面可见)?\s+0\.1\.6/iu, "the stale MarkItDown release snapshot"],
      [/release[／/]源码版本漂移/iu, "the false browser-use release/source drift claim"],
      [/它不删减或覆盖前文的研究判断/iu, "a statement that lets preliminary research override the canonical ledger"],
    ]) {
      if (pattern.test(brief)) fail(`${RESEARCH_BRIEF}: contains ${description}`);
    }
    for (const marker of [
      "1.2.11",
      "1.63.0-next",
      "v1.62.1",
      "0.13.8",
      "0.33.0",
      "v0.34.0",
      "v3.3.1",
      "4.19.0",
      "v4.21.0",
      "Python 1.15.0",
      "1.15.17",
      "maintenance mode",
      "LICENSE-CODE",
      "0.91.0-dev",
    ]) {
      if (!brief.includes(marker)) fail(`${RESEARCH_BRIEF}: missing reviewed source marker ${marker}`);
    }
    requirePattern(
      RESEARCH_BRIEF,
      brief,
      /(?:人工(?:审批|复核|批准)|human approval)/iu,
      "a human-approval publication boundary",
    );
    requirePattern(
      RESEARCH_BRIEF,
      brief,
      /(?:官方\s*API|official APIs?)/iu,
      "an official-API distribution boundary",
    );
    requirePattern(
      RESEARCH_BRIEF,
      brief,
      /(?:许可证|license|licence)/iu,
      "a repository-license review boundary",
    );
    requirePattern(
      RESEARCH_BRIEF,
      brief,
      /(?:版权|著作权|copyright)/iu,
      "a content-rights boundary",
    );
    if (/!\[[^\]]*\]\(\s*https?:\/\//i.test(brief) || /<img[^>]+src=["']https?:\/\//i.test(brief)) {
      fail(`${RESEARCH_BRIEF}: remote embedded media is prohibited`);
    }
    checkUnfinishedMarkers(RESEARCH_BRIEF, brief);
  }

  const provenance = readText(PROVENANCE_SIDECAR);
  if (provenance) {
    const provenanceErrorsBefore = errors.length;
    if (/FunAudioLLM\/CosyVoice|0\.19\.x|0\.26\.x|0\.13\.7|\b1\.2\.9\b|\b1\.60\.0\b|\b0\.12\.9\b|\bv3\.3\.0\b|\bv3\.176\.0\b|\bPython\s+1\.2\.0\b|\b1\.14\.7\b|release[／/]源码版本漂移/iu.test(provenance)) {
      fail(`${PROVENANCE_SIDECAR}: contains a stale repository owner or release line`);
    }
    for (const marker of [
      "1.2.11",
      "1.63.0-next",
      "v1.62.1",
      "0.13.8",
      "0.33.0",
      "v0.34.0",
      "v3.3.1",
      "4.19.0",
      "v4.21.0",
      "Python 1.15.0",
      "1.15.17",
      "maintenance mode",
      "LICENSE-CODE",
      "0.91.0-dev",
    ]) {
      if (!provenance.includes(marker)) fail(`${PROVENANCE_SIDECAR}: missing reviewed source marker ${marker}`);
    }
    requireSingleOccurrences(PROVENANCE_SIDECAR, provenance, [
      "checksum-backed review receipt",
      "意外漂移",
      "不是密码学身份签名",
      "受保护的 Git review／commit history",
      "外部审计",
    ]);
    if (/(?:这是|属于|提供|构成).{0,24}(?:不可伪造|unforgeable).{0,16}(?:签名|signature)/iu.test(provenance)) {
      fail(`${PROVENANCE_SIDECAR}: an affirmative unforgeable-signature claim is prohibited`);
    }
    const expectedHashes = {
      locked_surface_sha256: lockedSurfaceSha256(),
      manifest_sha256: fileSha256("lib/creator-ops/manifest.ts"),
      source_register_sha256: fileSha256("lib/creator-ops/sources.ts"),
      english_copy_sha256: fileSha256("lib/creator-ops/copy/en.ts"),
      simplified_chinese_copy_sha256: fileSha256("lib/creator-ops/copy/zh-Hans.ts"),
    };
    const scalarExpectations = {
      research_snapshot: "2026-08-26",
      course_version: CREATOR_OPS_COURSE_MANIFEST.version,
      deterministic_build_id: deterministicBuildId(ROOT),
      release_scope: EXPECTED_RELEASE_SCOPE,
      source_count: String(EXPECTED_SOURCE_COUNT),
      source_decision_counts: "13 PASS / 10 CONDITIONAL / 4 EXCLUDED",
      locked_surface_file_count: String(LOCKED_SURFACE_PATHS.length),
      release_decision: "pass",
      blocking_findings: "[]",
      ...expectedHashes,
    };
    for (const [key, expected] of Object.entries(scalarExpectations)) {
      const actual = sidecarScalar(provenance, key);
      if (actual !== expected) {
        fail(`${PROVENANCE_SIDECAR}: ${key} must equal ${JSON.stringify(expected)}; found ${JSON.stringify(actual)}`);
      }
    }

    const deploymentSurfaceFileCount = sidecarScalar(provenance, "deployment_surface_file_count");
    const deploymentSurfaceSha256 = sidecarScalar(provenance, "deployment_surface_sha256");
    if (!deploymentSurfaceFileCount || !/^[1-9]\d*$/u.test(deploymentSurfaceFileCount)) {
      fail(`${PROVENANCE_SIDECAR}: deployment_surface_file_count must be a positive integer`);
    }
    if (!deploymentSurfaceSha256 || !/^[a-f0-9]{64}$/u.test(deploymentSurfaceSha256)) {
      fail(`${PROVENANCE_SIDECAR}: deployment_surface_sha256 must be a lowercase SHA-256 digest`);
    }

    const reviewFields = [
      ["repository_review_reviewer", "repository_reviewed_at", "repository_review_decision"],
      ["security_review_reviewer", "security_reviewed_at", "security_review_decision"],
      ["rights_review_reviewer", "rights_reviewed_at", "rights_review_decision"],
      ["platform_policy_review_reviewer", "platform_policy_reviewed_at", "platform_policy_review_decision"],
      ["offline_lab_reproduction_reviewer", "offline_lab_reproduced_at", "offline_lab_reproduction_decision"],
      ["english_content_review_reviewer", "english_content_reviewed_at", "english_content_review_decision"],
      ["simplified_chinese_content_review_reviewer", "simplified_chinese_content_reviewed_at", "simplified_chinese_content_review_decision"],
      ["build_reproducibility_review_reviewer", "build_reproducibility_reviewed_at", "build_reproducibility_review_decision"],
      ["independent_release_review_reviewer", "independent_release_reviewed_at", "independent_release_review_decision"],
    ];
    for (const [reviewerKey, reviewedAtKey, decisionKey] of reviewFields) {
      const reviewer = sidecarScalar(provenance, reviewerKey);
      const reviewedAt = sidecarScalar(provenance, reviewedAtKey);
      const decision = sidecarScalar(provenance, decisionKey);
      if (!reviewer || reviewer.length < 6) {
        fail(`${PROVENANCE_SIDECAR}: ${reviewerKey} requires a review-receipt label`);
      }
      if (
        !reviewedAt
        || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(reviewedAt)
        || Number.isNaN(Date.parse(reviewedAt))
      ) {
        fail(`${PROVENANCE_SIDECAR}: ${reviewedAtKey} requires a valid UTC timestamp`);
      }
      if (decision !== "pass") {
        fail(`${PROVENANCE_SIDECAR}: ${decisionKey} must be pass for this bounded release scope`);
      }
    }
    checkSidecarDecisionReconciliation(provenance);
    if (/签字模板|pass\s*\|\s*conditional|reviewer:\s*["']{2}|locked_manifest_sha256/iu.test(provenance)) {
      fail(`${PROVENANCE_SIDECAR}: unsigned template state is prohibited`);
    }
    if (errors.length === provenanceErrorsBefore) {
      note(`Checksum-backed review receipt matches the locked Course 16 surface (${expectedHashes.locked_surface_sha256.slice(0, 12)}…)`);
    }
  }
  checkUnfinishedMarkers(noticePath, notice);
  checkUnfinishedMarkers(PROVENANCE_SIDECAR, provenance);
}

function checkIntegration() {
  const seo = requireTokens("lib/seo.ts", [
    "CREATOR_OPS_MODULE_PAGES",
    '"creator-ops/"',
    "creatorOpsModulePage",
    "...CREATOR_OPS_MODULE_PAGES",
  ]);
  const seoUsesManifestMapping = seo.includes("CREATOR_OPS_MODULE_SLUGS") && /\.map\s*\(/.test(seo);
  if (!seoUsesManifestMapping) {
    for (const slug of EXPECTED_MODULE_SLUGS) {
      if (!seo.includes(`"creator-ops/${slug}/"`)) {
        fail(`lib/seo.ts: missing creator-ops/${slug}/`);
      }
    }
  }

  requireTokens("app/sitemap.ts", [
    "CREATOR_OPS_TRANSLATED_LOCALES",
    'page === "creator-ops/"',
    'page.startsWith("creator-ops/")',
  ]);
  requireTokens("lib/courses.ts", [
    'id: "creator-ops"',
    "displayNumber: 16",
    'href: "/creator-ops/"',
    "CREATOR_OPS_COURSE_MANIFEST.modules",
    "creatorOpsProgressPercent",
    '"c.creator-ops.title"',
  ]);
  requireTokens("app/[locale]/courses/page.tsx", [
    "courseSixteenParts",
    '"creator-ops": courseSixteenParts',
    'course.id === "creator-ops"',
    "creatorOpsCourse.contentLocale",
  ]);
  requireTokens("components/courses/Catalog.tsx", [
    'course.id === "creator-ops"',
    '"creator-ops"',
  ]);
  requireTokens("components/courses/Cover.tsx", ['"creator-ops":']);
  requireTokens("components/Shell.tsx", [
    'p("/creator-ops/")',
    't("c.creator-ops.title")',
  ]);
  requireTokens("components/progress-reset.ts", ["resetCreatorOpsProgress"]);

  const readme = requireTokens("README.md", [
    "creator-ops",
    "creator-ops:check",
    "test:creator-ops",
    "creator-ops-course-research-brief.md",
    "public/courses/creator-ops/NOTICE.md",
  ]);
  requireSingleOccurrences("README.md", readme, [
    "checksum-backed review receipts",
    "accidental drift",
    "not cryptographic identity signatures",
    "protected Git review/commit history",
    "external audit record",
  ]);
  requirePattern(
    "README.md",
    readme,
    /(?:Course\s*16|Creator Operations|智能体赋能自媒体运营)/iu,
    "a visible Course 16 heading or description",
  );

  for (const locale of EXPECTED_LOCALES) {
    const messages = readJson(`messages/${locale}.json`);
    if (!messages) continue;
    for (const key of [
      "cat.course16",
      "c.creator-ops.title",
      "c.creator-ops.blurb",
      "c.creator-ops.level",
      "c.creator-ops.meta",
    ]) {
      if (typeof messages[key] !== "string" || !messages[key].trim()) {
        fail(`messages/${locale}.json: missing non-empty ${key}`);
      }
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson) {
    const scripts = packageJson.scripts ?? {};
    const checkScript = String(scripts["creator-ops:check"] ?? "");
    const releaseScript = String(scripts["creator-ops:check:release"] ?? "");
    const browserScript = String(scripts["test:creator-ops"] ?? "");
    const courseReleaseScript = String(scripts["creator-ops:release"] ?? "");
    if (
      !checkScript.includes("--import tsx")
      || !checkScript.includes("scripts/check-creator-ops-course.mjs")
      || checkScript.includes("--release")
    ) {
      fail("package.json: creator-ops:check must run the development checker through tsx");
    }
    if (
      !releaseScript.includes("scripts/check-creator-ops-course.mjs")
      || !releaseScript.includes("--release")
    ) {
      fail("package.json: creator-ops:check:release must invoke this checker with --release");
    }
    if (browserScript !== "node scripts/check-creator-ops-browser.mjs") {
      fail("package.json: test:creator-ops must run the repeatable production-export browser gate");
    }
    const courseReleaseGateIndex = courseReleaseScript.indexOf("npm run creator-ops:check:release");
    const courseNextBuildIndex = courseReleaseScript.indexOf("next build");
    const courseStaticGateIndex = courseReleaseScript.indexOf("npm run creator-ops:static-check");
    const courseBrowserGateIndex = courseReleaseScript.indexOf("npm run test:creator-ops");
    if (
      courseReleaseGateIndex < 0
      || courseNextBuildIndex < 0
      || courseStaticGateIndex < 0
      || courseBrowserGateIndex < 0
      || courseReleaseGateIndex > courseNextBuildIndex
      || courseNextBuildIndex > courseStaticGateIndex
      || courseStaticGateIndex > courseBrowserGateIndex
    ) {
      fail("package.json: creator-ops:release must run release -> build -> static -> browser gates in order");
    }
    for (const scriptName of ["build", "build:release"]) {
      const build = String(scripts[scriptName] ?? "");
      const releaseGateIndex = build.indexOf("npm run creator-ops:check:release");
      const nextBuildIndex = build.lastIndexOf("next build");
      const staticGateIndex = build.indexOf("npm run creator-ops:static-check");
      const browserGateIndex = build.indexOf("npm run test:creator-ops");
      if (
        releaseGateIndex < 0
        || nextBuildIndex < 0
        || staticGateIndex < 0
        || browserGateIndex < 0
        || releaseGateIndex > nextBuildIndex
        || nextBuildIndex > staticGateIndex
        || staticGateIndex > browserGateIndex
      ) {
        fail(`package.json: ${scriptName} must run Course 16 release -> build -> static -> browser gates in order`);
      }
    }
  }
}

async function main() {
  await checkCourseContract();
  checkSourceContract();
  checkBehaviorContract();
  checkOfflineLabContract();
  checkBilingualContract();
  checkFilesRoutesAndPresentation();
  checkNoticeAndResearch();
  checkIntegration();

  const ok = errors.length === 0 && (!RELEASE || warnings.length === 0);
  const result = {
    ok,
    course: "creator-ops",
    displayNumber: 16,
    mode: RELEASE ? "release" : "development",
    phases: CREATOR_OPS_COURSE_MANIFEST.phases.length,
    modules: CREATOR_OPS_COURSE_MANIFEST.modules.length,
    minutes: CREATOR_OPS_COURSE_MANIFEST.modules.reduce(
      (sum, courseModule) => sum + courseModule.minutes,
      0,
    ),
    sources: CREATOR_OPS_SOURCES.length,
    sourceDecisions: EXPECTED_SOURCE_COUNTS,
    errors,
    warnings,
    notes,
  };

  if (JSON_OUTPUT) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (ok) {
    console.log(`Course 16 Creator Operations check: PASS (${result.mode})`);
    notes.forEach((message) => console.log(`NOTE: ${message}`));
    warnings.forEach((message) => console.log(`WARN: ${message}`));
  } else {
    console.error(`Course 16 Creator Operations check: FAIL (${result.mode})`);
    notes.forEach((message) => console.error(`NOTE: ${message}`));
    errors.forEach((message) => console.error(`ERROR: ${message}`));
    warnings.forEach((message) => console.error(`WARN: ${message}`));
  }
  if (!ok) process.exitCode = 1;
}

await main();
