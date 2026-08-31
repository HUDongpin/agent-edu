#!/usr/bin/env node

/**
 * Fail-closed audit of the built Course 20 static surface.
 *
 * The build is accepted only when all 99 course routes, their directly loaded
 * JS/CSS, and every public learning/lab byte agree with the Course 20 v1.2.0 source
 * contracts. Hashing proves byte identity only; the provenance ledgers state
 * the separate rights, truth, accessibility, and release boundaries.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";
import {
  COURSE20_EXPECTED_VERSION,
  compareCourse20ExportIntegrity,
  createCourse20FileIntegritySnapshot,
  validateCourse20ExportState,
} from "./agentic-video-editing-export-state.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const COURSE_DIRECTORY = "courses/agentic-video-editing";
const SOURCE_PUBLIC = join(ROOT, "public", COURSE_DIRECTORY);
const EXPORTED_PUBLIC = join(OUT, COURSE_DIRECTORY);
const COURSE_VERSION = COURSE20_EXPECTED_VERSION;
const CONTENT_FALLBACK_DISCLOSURE =
  "displays the reviewed English course edition";
const LOCALES = [
  "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
];
const MODULES = [
  { slug: "agentic-editing-contract", minutes: 75 },
  { slug: "media-ingest-provenance", minutes: 65 },
  { slug: "transcripts-shots-index", minutes: 75 },
  { slug: "semantic-analysis-director", minutes: 75 },
  { slug: "declarative-edit-plan", minutes: 80 },
  { slug: "agent-tools-mcp", minutes: 75 },
  { slug: "captions-audio-formats", minutes: 70 },
  { slug: "deterministic-rendering", minutes: 85 },
  { slug: "verification-human-review", minutes: 75 },
  { slug: "production-capstone", minutes: 75 },
];
const MODULE_SLUGS = MODULES.map((moduleRecord) => moduleRecord.slug);
const ARTIFACT_IDS = [
  "creative-brief-responsibility-map",
  "media-manifest-provenance-quarantine",
  "evidence-index-transcript-shots",
  "candidate-segments-system-card",
  "edit-plan-v3-validation-approval",
  "plan-diff-independent-approval",
  "tool-policy-adversarial-recovery",
  "delivery-matrix-accessibility",
  "render-receipt-output-probe",
  "candidate-media-reference",
  "verification-repair-approval",
  "release-package-runbook-recovery",
  "release-decision-postmortem",
];
const REQUIRED_RUNTIME_TOKENS = [
  "course20-artifacts.v1.2.0",
  "aicourse.course20.assessment.v1.2.0",
  "aicourse.course20.checkpoint-receipt.v1",
  "aicourse.course20.module-receipt.v1",
  "aicourse.course20.quiz-receipt.v1",
  "aicourse.course20.capstone.v2",
  "aicourse.course20.capstone-rubric.v1.2.0",
  "aicourse.agentic-video-editing.selection-plan.v2",
  "aicourse.agentic-video-editing.edit-plan.v3",
  "aicourse.course20.artifact-submission.v2",
  ...ARTIFACT_IDS,
];
const FORBIDDEN_RUNTIME_TOKENS = [
  "2.0.0:progress-v2",
  "course20-browser-v2.0.0",
  "course20-artifacts.v2.0.0",
  "course20-synthetic-practicum-v1",
  "aicourse.agentic-video-editing.cut-plan.v1",
  "aicourse.agentic-video-editing.cut-plan.v2",
  "aicourse.course20.artifact-submission.v1",
  "aicourse.course20.audit-capstone.v1",
  "audit-core",
];
const TOP_PROVENANCE_PATHS = [
  "NOTICE.md",
  "artifact-fixtures.v1.json",
  "artifact-submission.schema.json",
  "creative-brief.fixture.json",
  "delivery-contract.schema.json",
  "edit-plan.schema.json",
  "edit-plan-v3.schema.json",
  "lab/fixture-manifest.v1.json",
  "media-manifest.fixture.json",
  "media-manifest.fixture.yaml",
  "qc-checklist.md",
];
const MEDIA_PATHS = [
  "lab/frozen/course20-original-fixture.mp4",
  "lab/frozen/course20-fault-reel.mp4",
];
const VTT_PATHS = [
  "lab/course20-review-candidate.en.vtt",
  "lab/course20-fault-reel.en.vtt",
];
const SHA_PATTERN = /^[a-f0-9]{64}$/u;

function canonicalPath(path) {
  return path.split(sep).join("/").normalize("NFC");
}

function isWithin(root, candidate) {
  const fromRoot = relative(root, candidate);
  return fromRoot === ""
    || (!fromRoot.startsWith(`..${sep}`)
      && fromRoot !== ".."
      && !isAbsolute(fromRoot));
}

function safeRelativePath(path) {
  if (typeof path !== "string") return false;
  const canonical = canonicalPath(path);
  return canonical.length > 0
    && !canonical.startsWith("/")
    && !canonical.includes("\\")
    && !canonical.includes("\0")
    && canonical.split("/").every(
      (part) => part !== "" && part !== "." && part !== "..",
    );
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function listRegularFiles(root) {
  const absoluteRoot = resolve(root);
  const rootStat = lstatSync(absoluteRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(`${canonicalPath(relative(ROOT, root))}: expected a real directory`);
  }

  function visit(relativePath = "") {
    const absolutePath = relativePath
      ? resolve(absoluteRoot, relativePath)
      : absoluteRoot;
    if (!isWithin(absoluteRoot, absolutePath)) {
      throw new Error(`${canonicalPath(relative(ROOT, absolutePath))}: path escapes its root`);
    }
    const stat = lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      throw new Error(`${canonicalPath(relative(ROOT, absolutePath))}: symbolic links are forbidden`);
    }
    if (stat.isFile()) return [absolutePath];
    if (!stat.isDirectory()) {
      throw new Error(`${canonicalPath(relative(ROOT, absolutePath))}: special entries are forbidden`);
    }
    return readdirSync(absolutePath, { withFileTypes: true })
      .filter((entry) => entry.name !== ".DS_Store")
      .sort((left, right) => left.name.localeCompare(right.name, "en"))
      .flatMap((entry) => visit(join(relativePath, entry.name)));
  }

  return visit();
}

function integritySnapshot(root, paths = listRegularFiles(root)) {
  const records = paths
    .map((path) => ({
      path: canonicalPath(relative(root, path)),
      bytes: readFileSync(path),
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  const hash = createHash("sha256");
  for (const record of records) {
    const pathBytes = Buffer.from(record.path, "utf8");
    hash.update(String(pathBytes.length));
    hash.update(":");
    hash.update(pathBytes);
    hash.update(":");
    hash.update(String(record.bytes.length));
    hash.update(":");
    hash.update(record.bytes);
    hash.update("\0");
  }
  return {
    fileCount: records.length,
    files: records.map((record) => record.path),
    hash: hash.digest("hex"),
  };
}

function attributeValue(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "iu").exec(tag);
  return match?.[2] ?? null;
}

function linkRecords(html) {
  return [...html.matchAll(/<link\b[^>]*>/giu)].map((match) => ({
    rel: attributeValue(match[0], "rel")?.toLowerCase() ?? "",
    href: attributeValue(match[0], "href"),
    hreflang: attributeValue(match[0], "hreflang"),
  }));
}

function jsonLdRecords(html, relativePath, errors) {
  const records = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/giu)) {
    const openingTag = match[0].slice(0, match[0].indexOf(">") + 1);
    if (attributeValue(openingTag, "type") !== "application/ld+json") continue;
    try {
      records.push(JSON.parse(match[2]));
    } catch (error) {
      errors.push(
        `${relativePath}: invalid JSON-LD (${error instanceof Error ? error.message : String(error)})`,
      );
    }
  }
  return records.flatMap((record) =>
    Array.isArray(record?.["@graph"]) ? record["@graph"] : [record]);
}

function expectedRoute(locale, slug = "") {
  return canonicalPath(join(
    locale,
    "agentic-video-editing",
    slug,
    "index.html",
  ));
}

/** Validate one rendered page without mutating its bytes. */
export function course20HtmlContractErrors({ html, locale, slug, relativePath }) {
  const errors = [];
  const contentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  const route = `agentic-video-editing/${slug ? `${slug}/` : ""}`;
  const canonicalUrl = `https://aicourse.top/${contentLocale}/${route}`;
  const expectedTestId = slug
    ? `agentic-video-editing-module-${slug}`
    : "agentic-video-editing-course-dashboard";

  const htmlTag = /<html\b[^>]*>/iu.exec(html)?.[0];
  if (!htmlTag || attributeValue(htmlTag, "lang") !== locale) {
    errors.push(`${relativePath}: <html> language must be ${locale}`);
  }
  const contentTag = [...html.matchAll(/<[a-z][^>]*data-testid=(["'])(.*?)\1[^>]*>/giu)]
    .map((match) => match[0])
    .find((tag) => attributeValue(tag, "data-testid") === expectedTestId);
  if (!contentTag) {
    errors.push(`${relativePath}: missing data-testid=${expectedTestId}`);
  } else if (attributeValue(contentTag, "lang") !== contentLocale) {
    errors.push(`${relativePath}: course content language must be ${contentLocale}`);
  }

  const h1Count = [...html.matchAll(/<h1(?:\s|>)/giu)].length;
  if (h1Count !== 1) {
    errors.push(`${relativePath}: expected exactly one h1; found ${h1Count}`);
  }

  const links = linkRecords(html);
  const canonicals = links.filter((link) => link.rel === "canonical");
  if (canonicals.length !== 1 || canonicals[0].href !== canonicalUrl) {
    errors.push(`${relativePath}: canonical must be exactly ${canonicalUrl}`);
  }
  const alternates = links.filter((link) =>
    link.rel === "alternate" && link.hreflang);
  const expectedAlternates = new Map([
    ["en", `https://aicourse.top/en/${route}`],
    ["zh-Hans", `https://aicourse.top/zh-Hans/${route}`],
    ["x-default", `https://aicourse.top/en/${route}`],
  ]);
  if (alternates.length !== expectedAlternates.size
    || new Set(alternates.map((link) => link.hreflang)).size
      !== expectedAlternates.size) {
    errors.push(`${relativePath}: expected exactly en, zh-Hans, and x-default alternates`);
  }
  for (const [hreflang, href] of expectedAlternates) {
    if (alternates.filter((link) =>
      link.hreflang === hreflang && link.href === href).length !== 1) {
      errors.push(`${relativePath}: missing unique hreflang ${hreflang} -> ${href}`);
    }
  }

  if (locale !== "en" && locale !== "zh-Hans"
    && !html.includes(CONTENT_FALLBACK_DISCLOSURE)) {
    errors.push(`${relativePath}: English content fallback is not visibly disclosed`);
  }

  const jsonLd = jsonLdRecords(html, relativePath, errors);
  const resource = slug
    ? jsonLd.find((record) => record?.["@type"] === "LearningResource")
    : jsonLd.find((record) => record?.["@type"] === "Course");
  if (!resource) {
    errors.push(`${relativePath}: missing Course 20 JSON-LD resource`);
  } else {
    if (resource.url !== canonicalUrl) {
      errors.push(`${relativePath}: JSON-LD URL must match ${canonicalUrl}`);
    }
    if (resource.inLanguage !== contentLocale) {
      errors.push(`${relativePath}: JSON-LD inLanguage must be ${contentLocale}`);
    }
    const courseCode = slug ? resource.isPartOf?.courseCode : resource.courseCode;
    if (courseCode !== "20") errors.push(`${relativePath}: JSON-LD courseCode must be 20`);
    if (slug) {
      const moduleRecord = MODULES.find((candidate) => candidate.slug === slug);
      if (resource.position !== MODULE_SLUGS.indexOf(slug) + 1
        || resource.timeRequired !== `PT${moduleRecord?.minutes}M`) {
        errors.push(`${relativePath}: module JSON-LD position/time drifted`);
      }
    } else {
      if (resource.hasCourseInstance?.courseWorkload !== "PT750M") {
        errors.push(`${relativePath}: core guided JSON-LD workload must be PT750M`);
      }
      const workloadProperties = resource.hasCourseInstance?.additionalProperty ?? [];
      for (const duration of ["PT180M", "PT240M", "PT30M"]) {
        if (!workloadProperties.some((record) => record?.value === duration)) {
          errors.push(`${relativePath}: JSON-LD is missing ${duration} optional/independent workload`);
        }
      }
      const parts = resource.hasPart ?? [];
      if (!same(parts.map((part) => part.position), MODULES.map((_, index) => index + 1))
        || !same(parts.map((part) => part.timeRequired), MODULES.map((part) => `PT${part.minutes}M`))) {
        errors.push(`${relativePath}: JSON-LD hasPart order or module minutes drifted`);
      }
    }
  }

  if (html.includes("[object Object]") || html.includes(">undefined<")) {
    errors.push(`${relativePath}: contains a serialization placeholder`);
  }
  return errors;
}

function routeAuditErrors() {
  const errors = [];
  for (const locale of LOCALES) {
    const localeRoot = join(OUT, locale, "agentic-video-editing");
    if (!existsSync(localeRoot)) {
      errors.push(`${locale}/agentic-video-editing: exported route root is missing`);
      continue;
    }
    const observedRoutes = listRegularFiles(localeRoot)
      .filter((path) => path.endsWith(`${sep}index.html`)
        || path === join(localeRoot, "index.html"))
      .map((path) => canonicalPath(relative(OUT, path)));
    const expectedRoutes = ["", ...MODULE_SLUGS].map((slug) =>
      expectedRoute(locale, slug));
    if (!same(sorted(observedRoutes), sorted(expectedRoutes))) {
      errors.push(`${locale}: Course 20 route inventory drifted`);
    }

    for (const slug of ["", ...MODULE_SLUGS]) {
      const relativePath = expectedRoute(locale, slug);
      const path = join(OUT, relativePath);
      if (!existsSync(path)) {
        errors.push(`${relativePath}: missing static HTML`);
        continue;
      }
      const stat = lstatSync(path);
      if (stat.isSymbolicLink() || !stat.isFile()) {
        errors.push(`${relativePath}: expected a regular non-symbolic HTML file`);
        continue;
      }
      const html = readFileSync(path, "utf8");
      errors.push(...course20HtmlContractErrors({
        html,
        locale,
        slug,
        relativePath,
      }));
      if (!slug) {
        let previousIndex = -1;
        for (const moduleSlug of MODULE_SLUGS) {
          const nextIndex = html.indexOf(`/agentic-video-editing/${moduleSlug}/`);
          if (nextIndex < 0 || nextIndex <= previousIndex) {
            errors.push(`${relativePath}: canonical module link order drifted at ${moduleSlug}`);
            break;
          }
          previousIndex = nextIndex;
        }
        for (const publicPath of [...MEDIA_PATHS, ...VTT_PATHS]) {
          if (!html.includes(`/courses/agentic-video-editing/${publicPath}`)) {
            errors.push(`${relativePath}: browser lab does not expose ${publicPath}`);
          }
        }
        if ((html.match(/<video(?:\s|>)/giu) ?? []).length < 2) {
          errors.push(`${relativePath}: browser lab must render both playable media controls`);
        }
      }
    }
  }
  return errors;
}

function assetReferences(html) {
  const references = [];
  for (const match of html.matchAll(/<(?:link|script)\b[^>]*>/giu)) {
    const reference = attributeValue(match[0], "src")
      ?? attributeValue(match[0], "href");
    if (reference && /\.(?:css|js)(?:\?|$)/iu.test(reference)) references.push(reference);
  }
  return references;
}

function runtimeAssetAuditErrors() {
  const errors = [];
  const htmlPaths = LOCALES.flatMap((locale) =>
    ["", ...MODULE_SLUGS].map((slug) => join(OUT, expectedRoute(locale, slug))));
  const assets = new Set();
  for (const htmlPath of htmlPaths) {
    if (!existsSync(htmlPath)) continue;
    for (const reference of assetReferences(readFileSync(htmlPath, "utf8"))) {
      let url;
      try {
        url = new URL(reference, "https://aicourse.top/");
      } catch {
        errors.push(`${relative(OUT, htmlPath)}: invalid asset URL ${reference}`);
        continue;
      }
      if (url.origin !== "https://aicourse.top") continue;
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        errors.push(`${relative(OUT, htmlPath)}: malformed asset path ${reference}`);
        continue;
      }
      const assetPath = resolve(OUT, pathname.replace(/^\/+/, ""));
      if (!isWithin(OUT, assetPath) || !existsSync(assetPath)) {
        errors.push(`${relative(OUT, htmlPath)}: missing/escaping asset ${reference}`);
        continue;
      }
      const stat = lstatSync(assetPath);
      if (stat.isSymbolicLink() || !stat.isFile()) {
        errors.push(`${relative(OUT, assetPath)}: runtime dependency is not a regular file`);
        continue;
      }
      assets.add(assetPath);
    }
  }
  const assetPaths = sorted(assets);
  if (!assetPaths.some((path) => path.endsWith(".js"))) {
    errors.push("Course 20 routes do not bind any JavaScript asset");
  }
  if (!assetPaths.some((path) => path.endsWith(".css"))) {
    errors.push("Course 20 routes do not bind any CSS asset");
  }
  const runtimeSource = assetPaths
    .filter((path) => path.endsWith(".js"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const token of REQUIRED_RUNTIME_TOKENS) {
    if (!runtimeSource.includes(token)) {
      errors.push(`Course 20 JavaScript is missing current contract token ${token}`);
    }
  }
  for (const token of FORBIDDEN_RUNTIME_TOKENS) {
    if (runtimeSource.includes(token)) {
      errors.push(`Course 20 JavaScript still contains retired contract token ${token}`);
    }
  }
  return { errors, assetPaths };
}

function parseJson(path, errors, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${label}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return null;
  }
}

function validateHashRecords({ records, expectedPaths, label, errors }) {
  const paths = records.map((record) => record?.path);
  if (paths.some((path) => !safeRelativePath(path))
    || new Set(paths).size !== paths.length
    || !same(sorted(paths), sorted(expectedPaths))) {
    errors.push(`${label}: hash inventory is incomplete, duplicated, or unsafe`);
  }
  for (const record of records) {
    if (!safeRelativePath(record?.path)) continue;
    const path = resolve(SOURCE_PUBLIC, record.path);
    if (!isWithin(SOURCE_PUBLIC, path) || !existsSync(path)) {
      errors.push(`${label}: missing/escaping record ${record.path}`);
      continue;
    }
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      errors.push(`${label}: ${record.path} is not a regular file`);
      continue;
    }
    const bytes = readFileSync(path);
    if (!SHA_PATTERN.test(record.sha256 ?? "") || sha256(bytes) !== record.sha256) {
      errors.push(`${label}: ${record.path} SHA-256 drifted`);
    }
    if (record.byteLength !== undefined && record.byteLength !== bytes.byteLength) {
      errors.push(`${label}: ${record.path} byteLength drifted`);
    }
  }
}

function provenanceAuditErrors() {
  const errors = [];
  const provenance = parseJson(
    join(SOURCE_PUBLIC, "fixtures.provenance.json"),
    errors,
    "fixtures.provenance.json",
  );
  if (provenance) {
    if (provenance.schemaVersion !== "aicourse.public-fixtures.provenance.v2"
      || provenance.courseId !== "agentic-video-editing"
      || provenance.courseVersion !== COURSE_VERSION
      || provenance.fixtureSetVersion !== COURSE_VERSION
      || provenance.selfHashExcluded !== true) {
      errors.push(`fixtures.provenance.json: identity/version/self-hash boundary must bind Course 20 ${COURSE_VERSION}`);
    }
    if (provenance.rights?.containsThirdPartyMedia !== false
      || provenance.rights?.containsPersonalData !== false
      || provenance.rights?.containsModelOutput !== false
      || provenance.rights?.shipsFrozenReferenceMedia !== true
      || provenance.scope?.authorizesPublication !== false
      || provenance.scope?.syntheticFixtureDecision !== "do-not-publish") {
      errors.push("fixtures.provenance.json: rights/privacy/media/publication boundary drifted");
    }
    validateHashRecords({
      records: Array.isArray(provenance.files) ? provenance.files : [],
      expectedPaths: TOP_PROVENANCE_PATHS,
      label: "fixtures.provenance.json",
      errors,
    });
  }

  const labManifest = parseJson(
    join(SOURCE_PUBLIC, "lab/fixture-manifest.v1.json"),
    errors,
    "lab/fixture-manifest.v1.json",
  );
  if (labManifest) {
    if (labManifest.schemaVersion
        !== "aicourse.agentic-video-editing.fixture-manifest.v1"
      || labManifest.projectSpecId !== "course20-verified-cut-v2"
      || labManifest.selfHashExcluded !== true) {
      errors.push("lab/fixture-manifest.v1.json: identity/self-hash boundary drifted");
    }
    let labFiles = [];
    try {
      labFiles = listRegularFiles(join(SOURCE_PUBLIC, "lab"))
        .map((path) => `lab/${canonicalPath(relative(join(SOURCE_PUBLIC, "lab"), path))}`)
        .filter((path) => path !== "lab/fixture-manifest.v1.json");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    validateHashRecords({
      records: Array.isArray(labManifest.files) ? labManifest.files : [],
      expectedPaths: ["edit-plan-v3.schema.json", ...labFiles],
      label: "lab/fixture-manifest.v1.json",
      errors,
    });
  }

  const frozen = parseJson(
    join(SOURCE_PUBLIC, "lab/frozen-media-receipt.v1.json"),
    errors,
    "lab/frozen-media-receipt.v1.json",
  );
  if (frozen) {
    if (frozen.courseVersion !== COURSE_VERSION
      || frozen.projectSpecId !== "course20-verified-cut-v2"
      || frozen.publicationDecision !== "do-not-publish"
      || !Array.isArray(frozen.media)
      || frozen.media.length !== 2) {
      errors.push("lab/frozen-media-receipt.v1.json: v1.2 identity/media/publication boundary drifted");
    }
    for (const record of frozen.media ?? []) {
      if (!safeRelativePath(record.path)) {
        errors.push(`frozen media: unsafe path ${String(record.path)}`);
        continue;
      }
      const path = resolve(SOURCE_PUBLIC, record.path);
      if (!isWithin(SOURCE_PUBLIC, path) || !existsSync(path)) {
        errors.push(`frozen media: missing ${record.path}`);
        continue;
      }
      const bytes = readFileSync(path);
      if (sha256(bytes) !== record.sha256 || bytes.byteLength !== record.byteLength) {
        errors.push(`frozen media: ${record.path} hash/length drifted`);
      }
      if (!bytes.subarray(4, 12).toString("ascii").includes("ftyp")) {
        errors.push(`frozen media: ${record.path} lacks an MP4 ftyp signature`);
      }
      const expectedDuration = record.id === "original-fixture" ? 122 : 6;
      if (record.observations?.audioSampleRateHz !== "48000"
        || Math.abs(
          Number(record.observations?.durationSeconds) - expectedDuration,
        ) > 0.08) {
        errors.push(`frozen media: ${record.path} must be the declared ${expectedDuration}s, 48 kHz control`);
      }
    }
  }

  const projectSpec = parseJson(
    join(SOURCE_PUBLIC, "lab/project-spec.v2.json"),
    errors,
    "lab/project-spec.v2.json",
  );
  if (projectSpec && (projectSpec.courseVersion !== COURSE_VERSION
    || projectSpec.rights?.peopleOrPersonalData !== false
    || projectSpec.rights?.thirdPartyMedia !== false
    || projectSpec.processing?.networkAllowed !== false
    || projectSpec.delivery?.publicationDecision !== "do-not-publish")) {
    errors.push("lab/project-spec.v2.json: v2 original/offline/do-not-publish contract drifted");
  }

  for (const vttPath of VTT_PATHS) {
    const source = readFileSync(join(SOURCE_PUBLIC, vttPath), "utf8");
    if (!source.startsWith("WEBVTT")
      || !/\d\d:\d\d:\d\d\.\d{3}\s+-->\s+\d\d:\d\d:\d\d\.\d{3}/u.test(source)) {
      errors.push(`${vttPath}: expected a valid-looking WebVTT cue timeline`);
    }
  }
  const reviewedCaptions = readFileSync(
    join(SOURCE_PUBLIC, "lab/course20-review-candidate.en.vtt"),
    "utf8",
  );
  if (!/\[[^\]]+\]/u.test(reviewedCaptions)) {
    errors.push("lab/course20-review-candidate.en.vtt: reviewed captions must include a non-speech audio cue");
  }
  for (const schemaPath of [
    "artifact-submission.schema.json",
    "delivery-contract.schema.json",
    "edit-plan.schema.json",
    "edit-plan-v3.schema.json",
    "lab/edit-plan-v3-fixture.schema.json",
  ]) {
    const record = parseJson(join(SOURCE_PUBLIC, schemaPath), errors, schemaPath);
    if (record && record.$schema !== "https://json-schema.org/draft/2020-12/schema") {
      errors.push(`${schemaPath}: must declare Draft 2020-12`);
    }
  }
  return errors;
}

function publicExportAuditErrors() {
  const errors = [];
  if (!existsSync(SOURCE_PUBLIC) || !existsSync(EXPORTED_PUBLIC)) {
    return [`${COURSE_DIRECTORY}: source or exported public directory is missing`];
  }
  let sourceFiles;
  let exportedFiles;
  try {
    sourceFiles = listRegularFiles(SOURCE_PUBLIC);
    exportedFiles = listRegularFiles(EXPORTED_PUBLIC);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const sourceNames = sourceFiles.map((path) =>
    canonicalPath(relative(SOURCE_PUBLIC, path)));
  const exportedNames = exportedFiles.map((path) =>
    canonicalPath(relative(EXPORTED_PUBLIC, path)));
  if (!same(sourceNames, exportedNames)) {
    errors.push(`${COURSE_DIRECTORY}: source/export inventories differ`);
  }
  for (const name of sourceNames) {
    const emittedPath = join(EXPORTED_PUBLIC, name);
    if (!existsSync(emittedPath)) continue;
    if (!readFileSync(join(SOURCE_PUBLIC, name)).equals(readFileSync(emittedPath))) {
      errors.push(`${COURSE_DIRECTORY}/${name}: exported bytes differ from public source`);
    }
  }
  return errors;
}

function releaseConfigurationErrors() {
  const errors = [];
  const vercel = parseJson(join(ROOT, "vercel.json"), errors, "vercel.json");
  if (vercel && (vercel.buildCommand !== "npm run build:release"
    || vercel.outputDirectory !== "out")) {
    errors.push("vercel.json must use npm run build:release and outputDirectory=out");
  }
  const pkg = parseJson(join(ROOT, "package.json"), errors, "package.json");
  const release = pkg?.scripts?.["build:release"] ?? "";
  const requiredCommands = [
    "agentic-video-editing:check:release",
    "next build",
    "agentic-video-editing:export-manifest",
    "agentic-video-editing:static-check",
    "test:agentic-video-editing",
  ];
  const steps = release.split(/\s*&&\s*/u);
  let previousIndex = -1;
  for (const command of requiredCommands) {
    const matchingIndexes = steps.flatMap((step, index) => (
      step.includes(command) ? [index] : []
    ));
    if (matchingIndexes.length !== 1) {
      errors.push(`package.json build:release is missing ${command}`);
      continue;
    }
    if (matchingIndexes[0] <= previousIndex) {
      errors.push(`package.json build:release orders ${command} incorrectly`);
    }
    previousIndex = matchingIndexes[0];
  }
  return errors;
}

function freshnessErrors() {
  const errors = [];
  const sourceRoots = [
    "app/[locale]/_blocked/agentic-video-editing",
    "staging/course-src/agentic-video-editing/components",
    "staging/course-src/agentic-video-editing",
    "staging/course-assets/agentic-video-editing",
  ];
  const sourceFiles = sourceRoots.flatMap((path) => {
    const absolutePath = join(ROOT, path);
    return existsSync(absolutePath) ? listRegularFiles(absolutePath) : [];
  });
  const htmlFiles = LOCALES.flatMap((locale) =>
    ["", ...MODULE_SLUGS].map((slug) => join(OUT, expectedRoute(locale, slug))))
    .filter(existsSync);
  if (!sourceFiles.length || htmlFiles.length !== LOCALES.length * 11) return errors;
  const newestSource = Math.max(...sourceFiles.map((path) => lstatSync(path).mtimeMs));
  const oldestRoute = Math.min(...htmlFiles.map((path) => lstatSync(path).mtimeMs));
  if (newestSource > oldestRoute + 2_000) {
    errors.push(
      `Course 20 source is newer than its static routes (source=${new Date(newestSource).toISOString()}, route=${new Date(oldestRoute).toISOString()})`,
    );
  }
  return errors;
}

function integrityContractSelfTestErrors() {
  const errors = [];
  const baseline = createCourse20FileIntegritySnapshot([
    { path: "a.js", bytes: "alpha" },
    { path: "b.css", bytes: "beta" },
  ]);
  const tampered = createCourse20FileIntegritySnapshot([
    { path: "a.js", bytes: "alphA" },
    { path: "b.css", bytes: "beta" },
  ]);
  const stored = {
    exportHash: baseline.hash,
    exportFileCount: baseline.fileCount,
    exportFiles: baseline.files,
    assetHash: baseline.hash,
    assetFileCount: baseline.fileCount,
    assetFiles: baseline.files,
    assetHashes: baseline.fileHashes,
  };
  const currentTampered = {
    ...stored,
    exportHash: tampered.hash,
    assetHash: tampered.hash,
    assetHashes: tampered.fileHashes,
  };
  if (!compareCourse20ExportIntegrity(stored, currentTampered).length) {
    errors.push("schema-3 integrity self-test did not reject a one-byte JS/CSS change");
  }
  for (const files of [["a.js"], ["a.js", "b.css", "extra.txt"]]) {
    const current = {
      ...stored,
      exportFileCount: files.length,
      exportFiles: files,
    };
    if (!compareCourse20ExportIntegrity(stored, current).length) {
      errors.push("schema-3 integrity self-test did not reject a missing/extra file");
    }
  }
  let rejectedSymlink = false;
  try {
    createCourse20FileIntegritySnapshot([
      { path: "linked.js", bytes: "", type: "symlink" },
    ]);
  } catch {
    rejectedSymlink = true;
  }
  if (!rejectedSymlink) {
    errors.push("schema-3 integrity self-test did not reject a symlink");
  }
  return errors;
}

function blockedExportAuditErrors() {
  const errors = [];
  if (existsSync(join(ROOT, "public/courses/agentic-video-editing"))) {
    errors.push("public/courses/agentic-video-editing must stay absent while Course 20 is blocked");
  }
  if (existsSync(join(ROOT, "app/[locale]/agentic-video-editing"))) {
    errors.push("app/[locale]/agentic-video-editing must stay absent while Course 20 is blocked");
  }
  if (existsSync(EXPORTED_PUBLIC)) {
    errors.push("out/courses/agentic-video-editing leaked from the private staging asset root");
  }
  for (const locale of LOCALES) {
    for (const slug of ["", ...MODULE_SLUGS]) {
      const routeRoot = join(OUT, locale, "agentic-video-editing", slug);
      for (const candidate of [routeRoot, `${routeRoot}.html`, join(routeRoot, "index.html")]) {
        if (existsSync(candidate)) {
          errors.push(`${canonicalPath(relative(ROOT, candidate))}: blocked Course 20 route was emitted`);
        }
      }
    }
  }
  const sentinels = [
    "/courses/agentic-video-editing/",
    "/agentic-video-editing/agentic-editing-contract/",
    "course20-artifacts.v1.2.0",
  ].map((value) => Buffer.from(value));
  for (const path of listRegularFiles(OUT)) {
    if (!/\.(?:html|js|mjs|rsc|txt)$/u.test(path)) continue;
    const bytes = readFileSync(path);
    for (const sentinel of sentinels) {
      if (bytes.includes(sentinel)) {
        errors.push(`${canonicalPath(relative(ROOT, path))}: blocked Course 20 runtime bytes leaked`);
        break;
      }
    }
  }
  return errors;
}

export function checkCourse20StaticExport() {
  if (!existsSync(OUT)) {
    return { errors: ["out/: static export is missing; run next build first"] };
  }
  const releaseManifest = JSON.parse(readFileSync(
    join(ROOT, "config/course-release-manifest.json"),
    "utf8",
  ));
  const course20 = releaseManifest.courses?.find(
    (course) => course.id === "agentic-video-editing",
  );
  if (course20?.state === "blocked") {
    const outputSnapshot = integritySnapshot(OUT);
    return {
      mode: "blocked",
      errors: blockedExportAuditErrors(),
      routeCount: 0,
      assetCount: 0,
      outputFileCount: outputSnapshot.fileCount,
      outputHash: outputSnapshot.hash,
    };
  }
  let outputSnapshot = null;
  try {
    outputSnapshot = integritySnapshot(OUT);
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : String(error)] };
  }
  const runtime = runtimeAssetAuditErrors();
  const errors = [
    ...validateCourse20ExportState(),
    ...integrityContractSelfTestErrors(),
    ...routeAuditErrors(),
    ...runtime.errors,
    ...publicExportAuditErrors(),
    ...provenanceAuditErrors(),
    ...releaseConfigurationErrors(),
    ...freshnessErrors(),
  ];
  return {
    mode: "published",
    errors,
    routeCount: LOCALES.length * (MODULES.length + 1),
    assetCount: runtime.assetPaths.length,
    outputFileCount: outputSnapshot.fileCount,
    outputHash: outputSnapshot.hash,
  };
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = checkCourse20StaticExport();
  if (result.errors.length) {
    process.stderr.write(
      `FAIL Course 20 static export (${result.errors.length} finding${result.errors.length === 1 ? "" : "s"})\n`
      + `- ${result.errors.join("\n- ")}\n`,
    );
    process.exit(1);
  }
  if (result.mode === "blocked") {
    process.stdout.write(
      `PASS Course 20 blocked static export: 0 routes, 0 media assets, ${result.outputFileCount} total export files scanned (${result.outputHash.slice(0, 16)}...).\n`
      + "- source and media remain under _blocked/staging; no Course 20 route, runtime contract, or /courses asset path entered out\n",
    );
    process.exit(0);
  }
  process.stdout.write(
    `PASS Course 20 static export: ${result.routeCount} routes, ${result.assetCount} bound JS/CSS assets, ${result.outputFileCount - 1} manifest-bound export files and ${result.outputFileCount} files including the manifest (${result.outputHash.slice(0, 16)}...).\n`
    + "- canonical/JSON-LD language, 750/180/30/240 workloads, ten-route order, and visible fallback disclosure close\n"
    + "- two MP4 controls, two WebVTT tracks, strict schemas, nested SHA-256 provenance, and exact public/export bytes close\n"
    + "- schema-3 source/route/JS/CSS/full-out hashes and freshness order close, including missing/extra/symlink/tamper self-tests\n"
    + "- runtime JS contains current v1.2 receipt/artifact/selection/v3 contracts and no retired Course 20 contract tokens\n"
    + "- Vercel is bound to npm run build:release and out\n",
  );
}
