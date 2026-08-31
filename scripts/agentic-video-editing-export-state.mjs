import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const COURSE20_EXPORT_LOCALES = [
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

// Public slugs stay stable even when the teaching order changes. The manifest
// and browser copy own the visible order; this list owns the 99-route export
// surface (nine locales x one dashboard plus ten modules).
export const COURSE20_EXPORT_MODULES = [
  "agentic-editing-contract",
  "media-ingest-provenance",
  "transcripts-shots-index",
  "semantic-analysis-director",
  "declarative-edit-plan",
  "agent-tools-mcp",
  "captions-audio-formats",
  "deterministic-rendering",
  "verification-human-review",
  "production-capstone",
];

export const COURSE20_EXPORT_MANIFEST_SCHEMA = 3;
export const COURSE20_BROWSER_CONTRACT = "course20-browser-v1.2.0";
export const COURSE20_EXPECTED_VERSION = "1.2.0";

const COURSE20_EXPORT_MANIFEST_NAME = ".course20-export-manifest.json";

export const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const OUT = join(ROOT, "out");
export const COURSE20_EXPORT_MANIFEST_PATH = join(
  OUT,
  COURSE20_EXPORT_MANIFEST_NAME,
);

// Hash the conservative render/release dependency surface. Shared layout,
// navigation, i18n, JSON-LD and public-file changes can alter Course 20 even
// when neither of its route files changes.
const SOURCE_INPUTS = [
  "README.md",
  "app",
  "components",
  "examples/agentic-video-editing-lab",
  "lib",
  "messages",
  "public",
  "course",
  "schemas",
  "next-env.d.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
  "vercel.json",
  "scripts/agentic-video-editing-export-state.mjs",
  "scripts/check-agentic-video-editing-artifacts.mjs",
  "scripts/check-agentic-video-editing-course.mjs",
  "scripts/check-agentic-video-editing-lab.mjs",
  "scripts/check-agentic-video-editing-static.mjs",
  "scripts/course20-bilingual-editorial-surface.mjs",
  "scripts/course20-synthetic-practicum.mjs",
  "scripts/serve-agentic-video-editing-static.mjs",
  "scripts/write-agentic-video-editing-export-manifest.mjs",
  "scripts/write-agentic-video-editing-fixture-provenance.mjs",
  "scripts/write-course20-bilingual-review-receipt.mjs",
  "tests/agentic-video-editing-contracts.test.mjs",
  "tests/agentic-video-editing-course.spec.ts",
  "tests/agentic-video-editing-playwright.config.ts",
  "tests/agentic-video-editing-timing.test.ts",
  "types/js-yaml.d.ts",
  "evidence/course-audits/course20-agentic-video-editing-research.md",
  "evidence/course-audits/course20-agentic-video-editing-research.provenance.md",
  "evidence/course-audits/course20-bilingual-review-receipt-2026-08-28.json",
  "evidence/course-audits/course20-branch-integration-handoff-2026-08-28.md",
  "evidence/course-audits/course20-content-verification-2026-08-26.md",
  "evidence/course-audits/course20-content-verification-2026-08-26.provenance.md",
  "evidence/course-audits/course20-first-principles-audit-fix-2026-08-28.md",
  "evidence/course-audits/course20-post-commit-audit-2026-08-28.md",
  "evidence/course-audits/course20-source-claim-ledger-2026-08-28.md",
];

function compareCanonicalPaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isWithin(root, candidate) {
  const fromRoot = relative(root, candidate);
  return fromRoot === ""
    || (!fromRoot.startsWith(`..${sep}`)
      && fromRoot !== ".."
      && !isAbsolute(fromRoot));
}

function canonicalRelativePath(path) {
  const canonical = path.split(sep).join("/").normalize("NFC");
  if (
    canonical.length === 0
    || canonical.startsWith("/")
    || canonical.includes("\\")
    || canonical.includes("\0")
    || canonical.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(
      `Course 20 integrity inventory contains an unsafe path: ${JSON.stringify(path)}`,
    );
  }
  return canonical;
}

function collectRegularFiles(root, relativePath, options = {}) {
  const absolutePath = resolve(root, relativePath);
  if (!isWithin(root, absolutePath)) {
    throw new Error(`Course 20 inventory path escapes its root: ${relativePath}`);
  }
  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(`Course 20 inventory must not contain symlinks: ${relativePath}`);
  }
  if (metadata.isFile()) return [absolutePath];
  if (!metadata.isDirectory()) {
    throw new Error(`Course 20 inventory contains a non-file entry: ${relativePath}`);
  }

  return readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => {
      if (entry.name === ".DS_Store") return false;
      return !options.excludeRootNames?.has(entry.name) || relativePath !== "";
    })
    .sort((left, right) => compareCanonicalPaths(left.name, right.name))
    .flatMap((entry) =>
      collectRegularFiles(root, join(relativePath, entry.name), options),
    );
}

function collectSourceInput(relativePath) {
  const absolutePath = resolve(ROOT, relativePath);
  if (!isWithin(ROOT, absolutePath)) {
    throw new Error(`Course 20 source input escapes the repository: ${relativePath}`);
  }
  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(`Course 20 source input must not be a symlink: ${relativePath}`);
  }
  if (metadata.isFile()) return [absolutePath];
  if (!metadata.isDirectory()) {
    throw new Error(`Course 20 source input is not a file or directory: ${relativePath}`);
  }
  return collectRegularFiles(ROOT, relativePath);
}

/**
 * Build a location-independent snapshot from virtual file records.
 *
 * Production scans and negative fixtures share this function, so tests use
 * exactly the same canonical ordering, byte framing and SHA-256 algorithm as
 * the release manifest. A virtual record may set type="symlink" to prove the
 * fail-closed entry-type contract without touching the filesystem.
 */
export function createCourse20FileIntegritySnapshot(records) {
  const canonicalRecords = records
    .map((record) => {
      if ((record.type ?? "file") !== "file") {
        throw new Error(
          `Course 20 integrity inventory rejects non-file entry ${JSON.stringify(record.path)}`,
        );
      }
      return {
        path: canonicalRelativePath(record.path),
        bytes: Buffer.isBuffer(record.bytes)
          ? record.bytes
          : Buffer.from(record.bytes ?? ""),
      };
    })
    .sort((left, right) => compareCanonicalPaths(left.path, right.path));

  const files = canonicalRecords.map((record) => record.path);
  if (new Set(files).size !== files.length) {
    throw new Error("Course 20 integrity inventory contains duplicate canonical paths");
  }

  const hash = createHash("sha256");
  const fileHashes = {};
  for (const record of canonicalRecords) {
    const pathBytes = Buffer.from(record.path, "utf8");
    hash.update(String(pathBytes.length));
    hash.update(":");
    hash.update(pathBytes);
    hash.update(":");
    hash.update(String(record.bytes.length));
    hash.update(":");
    hash.update(record.bytes);
    hash.update("\0");
    fileHashes[record.path] = createHash("sha256")
      .update(record.bytes)
      .digest("hex");
  }

  return {
    hash: hash.digest("hex"),
    fileCount: files.length,
    files,
    fileHashes,
  };
}

function snapshotFiles(basePath, paths) {
  const records = paths.map((path) => ({
    path: relative(basePath, path),
    bytes: readFileSync(path),
  }));
  return createCourse20FileIntegritySnapshot(records);
}

export function course20SourceFiles() {
  return [...new Set(SOURCE_INPUTS.flatMap(collectSourceInput))]
    .sort(compareCanonicalPaths);
}

export function course20ExportHtmlFiles() {
  return COURSE20_EXPORT_LOCALES.flatMap((locale) =>
    ["", ...COURSE20_EXPORT_MODULES].map((slug) =>
      join(OUT, locale, "agentic-video-editing", slug, "index.html"),
    ),
  ).sort(compareCanonicalPaths);
}

/**
 * Enumerate the complete static export. The manifest excludes itself to avoid
 * a self-referential hash; Finder metadata is ignored. Every other entry must
 * be a real directory or regular file, with symlinks and special files failing
 * closed before any hash can be blessed.
 */
export function course20ExportFiles(exportRoot = OUT) {
  const root = resolve(exportRoot);
  const rootMetadata = lstatSync(root);
  if (rootMetadata.isSymbolicLink() || !rootMetadata.isDirectory()) {
    throw new Error(`Course 20 export root is not a regular directory: ${root}`);
  }
  return collectRegularFiles(root, "", {
    excludeRootNames: new Set([COURSE20_EXPORT_MANIFEST_NAME]),
  });
}

function attributeValue(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "iu").exec(tag);
  return match?.[2] ?? null;
}

function resolveExportAssetPath(reference) {
  let url;
  try {
    url = new URL(reference, "https://aicourse.top/");
  } catch {
    throw new Error(`Course 20 HTML contains an invalid asset URL: ${reference}`);
  }
  if (url.origin !== "https://aicourse.top") return null;
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw new Error(`Course 20 HTML contains a malformed encoded asset path: ${reference}`);
  }
  if (!/\.(?:css|js)$/iu.test(pathname)) return null;
  const absolutePath = resolve(OUT, pathname.replace(/^\/+/, ""));
  if (!isWithin(OUT, absolutePath)) {
    throw new Error(`Course 20 HTML asset escapes out/: ${reference}`);
  }
  return absolutePath;
}

/** Collect the JavaScript and CSS files directly required by all 99 pages. */
export function course20ExportAssetFiles(htmlFiles = course20ExportHtmlFiles()) {
  const assets = new Set();
  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, "utf8");
    for (const match of html.matchAll(/<(?:link|script)\b[^>]*>/giu)) {
      const reference = attributeValue(match[0], "src")
        ?? attributeValue(match[0], "href");
      if (!reference) continue;
      const assetPath = resolveExportAssetPath(reference);
      if (!assetPath) continue;
      const metadata = lstatSync(assetPath);
      if (metadata.isSymbolicLink() || !metadata.isFile()) {
        throw new Error(
          `Course 20 HTML dependency is not a regular file: ${relative(OUT, assetPath)}`,
        );
      }
      assets.add(assetPath);
    }
  }
  return [...assets].sort(compareCanonicalPaths);
}

export function compareCourse20ExportIntegrity(stored, current) {
  const errors = [];
  for (const key of [
    "exportHash",
    "exportFileCount",
    "assetHash",
    "assetFileCount",
  ]) {
    if (stored?.[key] !== current?.[key]) {
      errors.push(
        `Course 20 export manifest mismatch for ${key}: stored=${JSON.stringify(stored?.[key])} current=${JSON.stringify(current?.[key])}`,
      );
    }
  }
  if (JSON.stringify(stored?.exportFiles) !== JSON.stringify(current?.exportFiles)) {
    errors.push("Course 20 export manifest export-file inventory is stale");
  }
  if (JSON.stringify(stored?.assetFiles) !== JSON.stringify(current?.assetFiles)) {
    errors.push("Course 20 export manifest page-asset inventory is stale");
  }
  if (JSON.stringify(stored?.assetHashes) !== JSON.stringify(current?.assetHashes)) {
    errors.push("Course 20 export manifest page-asset hashes are stale");
  }
  return errors;
}

function readCourseVersion() {
  const manifestPath = join(ROOT, "staging/course-src/agentic-video-editing/manifest.ts");
  const source = readFileSync(manifestPath, "utf8");
  const versions = [...source.matchAll(/^\s*version:\s*["']([^"']+)["'],?\s*$/gmu)]
    .map((match) => match[1]);
  if (versions.length !== 1) {
    throw new Error(
      `Course 20 manifest must declare exactly one literal version; found ${versions.length}`,
    );
  }
  if (versions[0] !== COURSE20_EXPECTED_VERSION) {
    throw new Error(
      `Course 20 export contract expects version ${COURSE20_EXPECTED_VERSION}; manifest declares ${versions[0]}`,
    );
  }
  return versions[0];
}

export function createCourse20ExportState() {
  const sourceFiles = course20SourceFiles();
  const htmlFiles = course20ExportHtmlFiles();
  const exportFiles = course20ExportFiles();

  for (const path of htmlFiles) {
    const metadata = lstatSync(path);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new Error(`Course 20 export route is not a regular file: ${path}`);
    }
  }
  const assetFiles = course20ExportAssetFiles(htmlFiles);
  if (assetFiles.length === 0) {
    throw new Error("Course 20 export pages did not reference any JavaScript or CSS files");
  }

  const sourceSnapshot = snapshotFiles(ROOT, sourceFiles);
  const htmlSnapshot = snapshotFiles(OUT, htmlFiles);
  const assetSnapshot = snapshotFiles(OUT, assetFiles);
  const exportSnapshot = snapshotFiles(OUT, exportFiles);
  const sourceNewestMtimeMs = Math.max(
    ...sourceFiles.map((path) => lstatSync(path).mtimeMs),
  );
  const exportMtimes = exportFiles.map((path) => lstatSync(path).mtimeMs);
  const exportOldestMtimeMs = Math.min(...exportMtimes);
  const exportNewestMtimeMs = Math.max(...exportMtimes);

  return {
    schema: COURSE20_EXPORT_MANIFEST_SCHEMA,
    courseId: "agentic-video-editing",
    courseVersion: readCourseVersion(),
    browserContract: COURSE20_BROWSER_CONTRACT,
    sourceHash: sourceSnapshot.hash,
    sourceFileCount: sourceSnapshot.fileCount,
    sourceFiles: sourceSnapshot.files,
    exportHtmlHash: htmlSnapshot.hash,
    routeCount: htmlSnapshot.fileCount,
    routeFiles: htmlSnapshot.files,
    routeHashes: htmlSnapshot.fileHashes,
    assetHash: assetSnapshot.hash,
    assetFileCount: assetSnapshot.fileCount,
    assetFiles: assetSnapshot.files,
    assetHashes: assetSnapshot.fileHashes,
    exportHash: exportSnapshot.hash,
    exportFileCount: exportSnapshot.fileCount,
    exportFiles: exportSnapshot.files,
    sourceNewestMtime: new Date(sourceNewestMtimeMs).toISOString(),
    exportOldestMtime: new Date(exportOldestMtimeMs).toISOString(),
    exportNewestMtime: new Date(exportNewestMtimeMs).toISOString(),
    sourcePrecedesExport: sourceNewestMtimeMs <= exportOldestMtimeMs,
  };
}

function compareJsonField(errors, stored, current, key, message) {
  if (JSON.stringify(stored?.[key]) !== JSON.stringify(current?.[key])) {
    errors.push(message ?? `Course 20 export manifest mismatch for ${key}`);
  }
}

export function validateCourse20ExportState() {
  const errors = [];
  let stored;
  let manifestMetadata;
  try {
    manifestMetadata = lstatSync(COURSE20_EXPORT_MANIFEST_PATH);
    if (manifestMetadata.isSymbolicLink() || !manifestMetadata.isFile()) {
      throw new Error("manifest path is not a regular file");
    }
    stored = JSON.parse(readFileSync(COURSE20_EXPORT_MANIFEST_PATH, "utf8"));
  } catch (error) {
    return [
      `Course 20 export manifest is missing or unreadable (${error instanceof Error ? error.message : String(error)})`,
    ];
  }

  let current;
  try {
    current = createCourse20ExportState();
  } catch (error) {
    return [
      `Course 20 export state cannot be recomputed (${error instanceof Error ? error.message : String(error)})`,
    ];
  }

  for (const key of [
    "schema",
    "courseId",
    "courseVersion",
    "browserContract",
    "sourceHash",
    "sourceFileCount",
    "exportHtmlHash",
    "routeCount",
    "sourceNewestMtime",
    "exportOldestMtime",
    "exportNewestMtime",
    "sourcePrecedesExport",
  ]) {
    if (stored?.[key] !== current[key]) {
      errors.push(
        `Course 20 export manifest mismatch for ${key}: stored=${JSON.stringify(stored?.[key])} current=${JSON.stringify(current[key])}`,
      );
    }
  }
  errors.push(...compareCourse20ExportIntegrity(stored, current));
  compareJsonField(
    errors,
    stored,
    current,
    "sourceFiles",
    "Course 20 export manifest source-file inventory is stale",
  );
  compareJsonField(
    errors,
    stored,
    current,
    "routeFiles",
    "Course 20 export manifest route inventory is stale",
  );
  compareJsonField(
    errors,
    stored,
    current,
    "routeHashes",
    "Course 20 export manifest per-route HTML hashes are stale",
  );

  if (!current.sourcePrecedesExport) {
    errors.push(
      `Course 20 source is newer than the export: source=${current.sourceNewestMtime} export=${current.exportOldestMtime}`,
    );
  }

  const generatedAtMs = Date.parse(stored?.generatedAt ?? "");
  const exportNewestMtimeMs = Date.parse(current.exportNewestMtime);
  if (!Number.isFinite(generatedAtMs)) {
    errors.push("Course 20 export manifest generatedAt is missing or invalid");
  } else if (generatedAtMs < exportNewestMtimeMs) {
    errors.push(
      `Course 20 manifest predates the export: export=${current.exportNewestMtime} manifest=${stored.generatedAt}`,
    );
  }
  if (manifestMetadata.mtimeMs < exportNewestMtimeMs) {
    errors.push(
      `Course 20 manifest file is older than the export: export=${current.exportNewestMtime} manifestFile=${new Date(manifestMetadata.mtimeMs).toISOString()}`,
    );
  }
  if (
    Number.isFinite(generatedAtMs)
    && generatedAtMs > manifestMetadata.mtimeMs + 5_000
  ) {
    errors.push("Course 20 export manifest generatedAt is implausibly newer than its file timestamp");
  }
  return errors;
}
