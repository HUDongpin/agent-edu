/* eslint-disable @typescript-eslint/no-require-imports -- Next's legacy config loader requires CommonJS. */

const { createHash } = require("node:crypto");
const { lstatSync, readFileSync, readdirSync } = require("node:fs");
const { relative, resolve, sep } = require("node:path");

/**
 * Public, source-controlled inputs that can affect the static export.
 *
 * Environment files are intentionally absent: a build identifier must never
 * encode secrets, and the release audit separately proves that supported build
 * hosts do not change the emitted bytes.
 */
const BUILD_ID_INPUT_PATHS = Object.freeze([
  "app",
  "components",
  "lib",
  "messages",
  "public",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
  "vercel.json",
]);

const DEFAULT_PROJECT_ROOT = resolve(__dirname, "..");

function lexicalCompare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function projectRelativePath(projectRoot, absolutePath) {
  const path = relative(projectRoot, absolutePath).split(sep).join("/");
  if (!path || path === ".." || path.startsWith("../") || path.startsWith("/")) {
    throw new Error(`Deterministic build input escaped the project root: ${absolutePath}`);
  }
  return path;
}

function regularFilesUnder(projectRoot, path) {
  const stat = lstatSync(path, { bigint: true });
  if (stat.isSymbolicLink()) {
    throw new Error(`Deterministic build inputs cannot contain symbolic links: ${path}`);
  }
  if (stat.isDirectory()) {
    return readdirSync(path)
      .sort(lexicalCompare)
      .flatMap((entry) => regularFilesUnder(projectRoot, resolve(path, entry)));
  }
  if (!stat.isFile()) {
    throw new Error(`Deterministic build inputs must be regular files: ${path}`);
  }
  return [projectRelativePath(projectRoot, path)];
}

function hashRegularFile(hash, projectRoot, projectPath) {
  const absolutePath = resolve(projectRoot, projectPath);
  const before = lstatSync(absolutePath, { bigint: true });
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error(`Expected a regular non-symlink build input: ${projectPath}`);
  }

  const bytes = readFileSync(absolutePath);
  hash.update("F\0");
  hash.update(String(Buffer.byteLength(projectPath, "utf8")), "utf8");
  hash.update("\0");
  hash.update(projectPath, "utf8");
  hash.update("\0");
  hash.update(String(before.size), "utf8");
  hash.update("\0");
  hash.update(bytes);
  hash.update("\0");

  const after = lstatSync(absolutePath, { bigint: true });
  if (
    before.dev !== after.dev
    || before.ino !== after.ino
    || before.size !== after.size
    || before.mtimeNs !== after.mtimeNs
  ) {
    throw new Error(`Build input changed while hashing: ${projectPath}`);
  }
}

/**
 * Bind Next's build ID to ordered paths and raw source bytes, not a build-host
 * marker. Length framing makes the byte stream unambiguous; filesystem metadata
 * is checked only for concurrent writes and never enters the digest.
 *
 * The default root is anchored to this module, rather than the invoking shell's
 * working directory, so Next's documented `next build [directory]` entry point
 * produces the same ID as a build launched from the project root.
 */
function deterministicBuildId(root = DEFAULT_PROJECT_ROOT) {
  const projectRoot = resolve(root);
  const files = BUILD_ID_INPUT_PATHS
    .flatMap((path) => regularFilesUnder(projectRoot, resolve(projectRoot, path)))
    .sort(lexicalCompare);
  if (new Set(files).size !== files.length) {
    throw new Error("Duplicate deterministic build-input path");
  }
  const hash = createHash("sha256");
  hash.update("agentic-engineering-build-input-v1\0");

  for (const projectPath of files) hashRegularFile(hash, projectRoot, projectPath);

  // Next avoids "ad" in generated asset paths because broad ad-blocker rules
  // sometimes match it. The replacement is injective for a lowercase-hex ID.
  return `src-${hash.digest("hex").replaceAll("ad", "a_d")}`;
}

exports.BUILD_ID_INPUT_PATHS = BUILD_ID_INPUT_PATHS;
exports.deterministicBuildId = deterministicBuildId;
