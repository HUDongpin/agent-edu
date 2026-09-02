import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { AGENTIC_TEACHING_VERSION } from "../lib/ai-teaching/types.ts";

export const COURSE18_EXPORT_LOCALES = [
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

export const COURSE18_EXPORT_MODULES = [
  "agentic-teaching-boundaries",
  "learning-design-task-contracts",
  "teacher-copilot-workflows",
  "tutoring-feedback-agents",
  "multi-agent-inquiry",
  "knowledge-tools-mcp",
  "k12-safeguards",
  "higher-ed-integrity",
  "evals-learning-evidence",
  "pilot-capstone",
];

export const COURSE18_EXPORT_MANIFEST_SCHEMA = 3;
export const COURSE18_BROWSER_CONTRACT = "course18-browser-v4";

const COURSE18_EXPORT_MANIFEST_NAME = ".course18-export-manifest.json";

export const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const OUT = join(ROOT, "out");
export const COURSE18_EXPORT_MANIFEST_PATH = join(
  OUT,
  COURSE18_EXPORT_MANIFEST_NAME,
);

// Hash the conservative build dependency surface, rather than a hand-maintained
// list of Course 18 imports. Shared layout, navigation, i18n, JSON-LD and asset
// changes can all alter the rendered course even when its route files do not.
const SOURCE_INPUTS = [
  "app",
  "components",
  "lib",
  "messages",
  "public",
  "next-env.d.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
  "scripts/ai-teaching-export-state.mjs",
  "scripts/check-ai-teaching-course.mjs",
  "scripts/check-ai-teaching-progress.mjs",
  "scripts/check-ai-teaching-static.mjs",
  "scripts/serve-static-export.mjs",
  "scripts/write-ai-teaching-export-manifest.mjs",
  "tests/ai-teaching-course.spec.ts",
  "tests/ai-teaching-playwright.config.ts",
];

function isInsideRoot(path) {
  return path === ROOT || path.startsWith(`${ROOT}${sep}`);
}

function compareCanonicalPaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
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
    throw new Error(`Course 18 integrity inventory contains an unsafe path: ${JSON.stringify(path)}`);
  }
  return canonical;
}

function collectFiles(relativePath) {
  const absolutePath = resolve(ROOT, relativePath);
  if (!isInsideRoot(absolutePath)) {
    throw new Error(`Course 18 source input escapes the repository: ${relativePath}`);
  }
  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(`Course 18 source input must not be a symlink: ${relativePath}`);
  }
  if (metadata.isFile()) return [absolutePath];
  if (!metadata.isDirectory()) {
    throw new Error(`Course 18 source input is not a file or directory: ${relativePath}`);
  }
  return readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.name !== ".DS_Store")
    .sort((left, right) => compareCanonicalPaths(left.name, right.name))
    .flatMap((entry) =>
      collectFiles(join(relativePath, entry.name)),
    );
}

/**
 * Build a location-independent snapshot from virtual file records.
 *
 * The production export scanner and the static check's negative fixtures both
 * use this function, so the asset-drift tests exercise the same framing,
 * canonical path ordering and SHA-256 contract as the manifest validator.
 */
export function createCourse18FileIntegritySnapshot(records) {
  const canonicalRecords = records
    .map((record) => ({
      path: canonicalRelativePath(record.path),
      bytes: Buffer.isBuffer(record.bytes)
        ? record.bytes
        : Buffer.from(record.bytes),
    }))
    .sort((left, right) => compareCanonicalPaths(left.path, right.path));

  const files = canonicalRecords.map((record) => record.path);
  if (new Set(files).size !== files.length) {
    throw new Error("Course 18 integrity inventory contains duplicate canonical paths");
  }

  const hash = createHash("sha256");
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
  }
  return {
    hash: hash.digest("hex"),
    fileCount: files.length,
    files,
  };
}

function snapshotFiles(basePath, paths) {
  const records = paths.map((path) => ({
    path: relative(basePath, path),
    bytes: readFileSync(path),
  }));
  return createCourse18FileIntegritySnapshot(records);
}

export function course18SourceFiles() {
  return [...new Set(SOURCE_INPUTS.flatMap(collectFiles))].sort(compareCanonicalPaths);
}

export function course18ExportHtmlFiles() {
  return COURSE18_EXPORT_LOCALES.flatMap((locale) =>
    ["", ...COURSE18_EXPORT_MODULES].map((slug) =>
      join(OUT, locale, "ai-teaching", slug, "index.html"),
    ),
  ).sort(compareCanonicalPaths);
}

/**
 * Recursively enumerate the complete static export. The manifest excludes
 * itself to avoid a self-referential hash; Finder metadata is intentionally
 * ignored. Every other entry must be a regular file or directory, with
 * symlinks and special files failing closed.
 */
export function course18ExportFiles(exportRoot = OUT) {
  const root = resolve(exportRoot);
  const rootMetadata = lstatSync(root);
  if (rootMetadata.isSymbolicLink() || !rootMetadata.isDirectory()) {
    throw new Error(`Course 18 export root is not a regular directory: ${root}`);
  }

  function visit(relativePath = "") {
    const absolutePath = relativePath ? resolve(root, relativePath) : root;
    if (absolutePath !== root && !absolutePath.startsWith(`${root}${sep}`)) {
      throw new Error(`Course 18 export path escapes the export root: ${relativePath}`);
    }
    const metadata = lstatSync(absolutePath);
    if (metadata.isSymbolicLink()) {
      throw new Error(`Course 18 export must not contain symlinks: ${relativePath}`);
    }
    if (metadata.isFile()) return [absolutePath];
    if (!metadata.isDirectory()) {
      throw new Error(`Course 18 export contains a non-file entry: ${relativePath}`);
    }

    return readdirSync(absolutePath, { withFileTypes: true })
      .filter((entry) => {
        if (entry.name === ".DS_Store") return false;
        return relativePath !== "" || entry.name !== COURSE18_EXPORT_MANIFEST_NAME;
      })
      .sort((left, right) => compareCanonicalPaths(left.name, right.name))
      .flatMap((entry) => visit(join(relativePath, entry.name)));
  }

  return visit();
}

export function compareCourse18ExportIntegrity(stored, current) {
  const errors = [];
  for (const key of ["exportHash", "exportFileCount"]) {
    if (stored?.[key] !== current?.[key]) {
      errors.push(
        `Course 18 export manifest mismatch for ${key}: stored=${JSON.stringify(stored?.[key])} current=${JSON.stringify(current?.[key])}`,
      );
    }
  }
  if (JSON.stringify(stored?.exportFiles) !== JSON.stringify(current?.exportFiles)) {
    errors.push("Course 18 export manifest export-file inventory is stale");
  }
  return errors;
}

export function createCourse18ExportState() {
  const sourceFiles = course18SourceFiles();
  const htmlFiles = course18ExportHtmlFiles();
  const exportFiles = course18ExportFiles();
  for (const path of htmlFiles) {
    const metadata = lstatSync(path);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new Error(`Course 18 export path is not a regular file: ${path}`);
    }
  }
  const sourceSnapshot = snapshotFiles(ROOT, sourceFiles);
  const htmlSnapshot = snapshotFiles(OUT, htmlFiles);
  const exportSnapshot = snapshotFiles(OUT, exportFiles);
  const sourceNewestMtimeMs = Math.max(
    ...sourceFiles.map((path) => lstatSync(path).mtimeMs),
  );
  const exportOldestMtimeMs = Math.min(
    ...exportFiles.map((path) => lstatSync(path).mtimeMs),
  );
  return {
    schema: COURSE18_EXPORT_MANIFEST_SCHEMA,
    courseId: "ai-teaching",
    courseVersion: AGENTIC_TEACHING_VERSION,
    browserContract: COURSE18_BROWSER_CONTRACT,
    sourceHash: sourceSnapshot.hash,
    exportHtmlHash: htmlSnapshot.hash,
    routeCount: htmlFiles.length,
    exportHash: exportSnapshot.hash,
    exportFileCount: exportSnapshot.fileCount,
    sourceNewestMtime: new Date(sourceNewestMtimeMs).toISOString(),
    exportOldestMtime: new Date(exportOldestMtimeMs).toISOString(),
    sourcePrecedesExport: sourceNewestMtimeMs <= exportOldestMtimeMs,
    sourceFiles: sourceSnapshot.files,
    exportFiles: exportSnapshot.files,
  };
}

export function validateCourse18ExportState() {
  const errors = [];
  let stored;
  try {
    const metadata = lstatSync(COURSE18_EXPORT_MANIFEST_PATH);
    if (metadata.isSymbolicLink() || !metadata.isFile()) {
      throw new Error("manifest path is not a regular file");
    }
    stored = JSON.parse(readFileSync(COURSE18_EXPORT_MANIFEST_PATH, "utf8"));
  } catch (error) {
    return [
      `Course 18 export manifest is missing or unreadable (${error instanceof Error ? error.message : String(error)})`,
    ];
  }

  let current;
  try {
    current = createCourse18ExportState();
  } catch (error) {
    return [
      `Course 18 export state cannot be recomputed (${error instanceof Error ? error.message : String(error)})`,
    ];
  }

  for (const key of [
    "schema",
    "courseId",
    "courseVersion",
    "browserContract",
    "sourceHash",
    "exportHtmlHash",
    "routeCount",
    "sourceNewestMtime",
    "exportOldestMtime",
    "sourcePrecedesExport",
  ]) {
    if (stored?.[key] !== current[key]) {
      errors.push(
        `Course 18 export manifest mismatch for ${key}: stored=${JSON.stringify(stored?.[key])} current=${JSON.stringify(current[key])}`,
      );
    }
  }
  errors.push(...compareCourse18ExportIntegrity(stored, current));
  if (JSON.stringify(stored?.sourceFiles) !== JSON.stringify(current.sourceFiles)) {
    errors.push("Course 18 export manifest source-file inventory is stale");
  }
  if (!current.sourcePrecedesExport) {
    errors.push(
      `Course 18 source is newer than the export: source=${current.sourceNewestMtime} export=${current.exportOldestMtime}`,
    );
  }
  return errors;
}
