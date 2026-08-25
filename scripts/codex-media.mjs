#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CODEX_MEDIA_AUDIT_SCHEMA,
  CODEX_MEDIA_CHECKLIST,
  CODEX_MEDIA_PATTERN_VERSION,
  CODEX_MEDIA_PRIVACY_CHECKLIST_VERSION,
  CODEX_MEDIA_TRANSFORM,
  assessPathConfinement,
  buildAssetInventory,
  expectedAssetNames,
  inspectPng,
  isPathInside,
  isRealIsoDate,
  parseGetfattrNames,
  parseMacOsXattrHex,
  parseMacOsXattrNames,
  scanOcrText,
  sha256,
  validateAuditRecord,
  validateFilesystemAttributes,
} from "./lib/codex-media.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const PUBLIC_ROOT = join(REPO_ROOT, "public");
const MAX_SOURCE_BYTES = 128 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 150_000_000;
const MAX_AUDIT_BYTES = 1024 * 1024;
const TOOL_TIMEOUT_MS = 120_000;
const REQUIRED_PREPARE_OPTIONS = [
  "id",
  "input",
  "output",
  "captured-on",
  "product-version",
  "operating-system",
  "surface",
  "source-id",
];

const USAGE = `Course 2 genuine-screenshot staging (never publishes or approves assets)

Usage:
  node scripts/codex-media.mjs prepare \\
    --id fig-01 \\
    --input /absolute/path/to/raw-capture.png \\
    --output /absolute/path/to/new-staging-directory \\
    --captured-on YYYY-MM-DD \\
    --product-version VERSION \\
    --operating-system "OS VERSION" \\
    --surface "app|cli|ide|cloud|github" \\
    --source-id OFFICIAL_SOURCE_ID

  node scripts/codex-media.mjs audit \\
    --dir /absolute/path/to/staging-directory

Prepare accepts only a complete PNG capture at least 2240 pixels wide. The raw
input and staging directory must remain outside this repository. Output names are
deterministic: fig-XX-master.png, fig-XX-2240.webp, fig-XX-1120.webp, and
fig-XX-audit.json. Automated checks leave privacyReview.status as "pending";
manual pixel/privacy review is mandatory before any separate publishing action.
Preparation also requires a working filesystem extended-attribute inspector,
removes user-attached attributes from generated derivatives, and fails unless
only the exact allowlisted macOS host-local provenance marker may remain. That
OS-managed marker is recorded as nontransported; embedded PNG/WebP metadata must
still be absent.
`;

class CliError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliError";
  }
}

function parseArguments(argv) {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    return { command: "help", options: {} };
  }
  const [command, ...tokens] = argv;
  if (!new Set(["prepare", "audit"]).has(command)) throw new CliError(`unknown command: ${command}`);
  if (tokens.length % 2 !== 0) throw new CliError(`option ${tokens.at(-1)} is missing a value`);
  const options = {};
  for (let index = 0; index < tokens.length; index += 2) {
    const flag = tokens[index];
    const value = tokens[index + 1];
    if (!flag.startsWith("--") || flag.length === 2) throw new CliError(`invalid option: ${flag}`);
    const key = flag.slice(2);
    if (key in options) throw new CliError(`duplicate option: ${flag}`);
    if (value.startsWith("--")) throw new CliError(`option ${flag} is missing a value`);
    options[key] = value;
  }
  const allowed = command === "prepare" ? new Set(REQUIRED_PREPARE_OPTIONS) : new Set(["dir"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) throw new CliError(`unknown ${command} option: --${key}`);
  }
  const required = command === "prepare" ? REQUIRED_PREPARE_OPTIONS : ["dir"];
  for (const key of required) {
    if (!options[key]) throw new CliError(`missing required option: --${key}`);
  }
  return { command, options };
}

async function existingForbiddenRoots() {
  const repoRoot = await realpath(REPO_ROOT);
  let publicRoot = PUBLIC_ROOT;
  try {
    publicRoot = await realpath(PUBLIC_ROOT);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return [...new Set([repoRoot, publicRoot])];
}

async function inspectExistingPath(path, { label, requireFile = false, requireDirectory = false }) {
  if (!isAbsolute(path)) throw new CliError(`${label} must be an absolute path`);
  const requestedPath = resolve(path);
  const details = await lstat(requestedPath).catch((error) => {
    if (error?.code === "ENOENT") throw new CliError(`${label} does not exist`);
    throw error;
  });
  const resolvedPath = await realpath(requestedPath);
  const confinement = assessPathConfinement({
    requestedPath,
    realPath: resolvedPath,
    forbiddenRoots: await existingForbiddenRoots(),
    targetIsSymlink: details.isSymbolicLink(),
    label,
  });
  if (!confinement.ok) throw new CliError(confinement.errors.join("; "));
  if (requireFile && !details.isFile()) throw new CliError(`${label} must be a regular file`);
  if (requireDirectory && !details.isDirectory()) throw new CliError(`${label} must be a directory`);
  return { requestedPath, resolvedPath, details };
}

async function inspectNewOutputDirectory(path) {
  if (!isAbsolute(path)) throw new CliError("output directory must be an absolute path");
  const requestedPath = resolve(path);
  try {
    await lstat(requestedPath);
    throw new CliError("output directory must not already exist");
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error?.code !== "ENOENT") throw error;
  }

  const parentPath = dirname(requestedPath);
  const parentDetails = await lstat(parentPath).catch((error) => {
    if (error?.code === "ENOENT") throw new CliError("output parent directory must already exist");
    throw error;
  });
  if (!parentDetails.isDirectory() || parentDetails.isSymbolicLink()) {
    throw new CliError("output parent must be a real directory, not a symbolic link");
  }
  const resolvedParent = await realpath(parentPath);
  const candidateRealPath = join(resolvedParent, basename(requestedPath));
  const confinement = assessPathConfinement({
    requestedPath,
    realPath: candidateRealPath,
    forbiddenRoots: await existingForbiddenRoots(),
    label: "output directory",
  });
  if (!confinement.ok) throw new CliError(confinement.errors.join("; "));
  return { requestedPath, candidateRealPath };
}

async function readBoundedFile(path, maximumBytes, label) {
  const details = await stat(path);
  if (details.size <= 0) throw new CliError(`${label} is empty`);
  if (details.size > maximumBytes) throw new CliError(`${label} exceeds ${maximumBytes} bytes`);
  return { buffer: await readFile(path), details };
}

function runTool(command, arguments_, { timeoutMs = TOOL_TIMEOUT_MS } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, arguments_, {
      env: { ...process.env, LC_ALL: "C", LANG: "C" },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let settled = false;
    let forcedFailure = null;
    const timer = setTimeout(() => {
      forcedFailure = `${command} timed out after ${timeoutMs} ms`;
      child.kill("SIGKILL");
    }, timeoutMs);

    const collect = (chunks, chunk) => {
      if (forcedFailure) return;
      outputBytes += chunk.length;
      if (outputBytes > 2 * 1024 * 1024) {
        forcedFailure = `${command} produced excessive diagnostic output`;
        child.kill("SIGKILL");
        return;
      }
      chunks.push(chunk);
    };
    child.stdout.on("data", (chunk) => collect(stdout, chunk));
    child.stderr.on("data", (chunk) => collect(stderr, chunk));
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error?.code === "ENOENT") rejectPromise(new CliError(`required tool is not installed or not on PATH: ${command}`));
      else rejectPromise(error);
    });
    // `exit` can fire before the child's stdio streams have closed. Waiting for
    // `close` guarantees the final diagnostic/version bytes have reached the
    // collectors before we decide whether the tool produced usable output.
    child.once("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (forcedFailure) {
        rejectPromise(new CliError(forcedFailure));
        return;
      }
      const stdoutText = Buffer.concat(stdout).toString("utf8");
      const stderrText = Buffer.concat(stderr).toString("utf8");
      if (code !== 0) {
        const diagnostic = stderrText.trim().split(/\r?\n/u).slice(-3).join(" | ");
        rejectPromise(new CliError(`${command} failed (${signal ?? `exit ${code}`}): ${diagnostic || "no diagnostic"}`));
        return;
      }
      resolvePromise({ stdout: stdoutText, stderr: stderrText });
    });
  });
}

function normalizeVersionOutput(value, command) {
  const line = value
    .split(/\r?\n/u)
    .map((candidate) => candidate.trim())
    .find(Boolean);
  if (!line) throw new CliError(`${command} did not report a version`);
  return line.slice(0, 240);
}

async function preflightExtendedAttributes({ requireClear }) {
  let backend;
  if (process.platform === "darwin") {
    const command = "/usr/bin/xattr";
    await runTool(command, ["-h"]);
    backend = {
      kind: "macos-xattr",
      inspectCommand: command,
      clearCommand: command,
      description: "macOS /usr/bin/xattr (system tool; no version flag)",
    };
  } else if (process.platform === "linux") {
    const getfattr = await runTool("getfattr", ["--version"]).catch((error) => {
      throw new CliError(`filesystem extended-attribute inspection is unavailable: ${error.message}`);
    });
    let setfattr = null;
    if (requireClear) {
      setfattr = await runTool("setfattr", ["--version"]).catch((error) => {
        throw new CliError(`filesystem extended-attribute clearing is unavailable: ${error.message}`);
      });
    }
    const inspectorVersion = normalizeVersionOutput(`${getfattr.stdout}\n${getfattr.stderr}`, "getfattr");
    const cleanerVersion = setfattr
      ? normalizeVersionOutput(`${setfattr.stdout}\n${setfattr.stderr}`, "setfattr")
      : "setfattr not required during read-only audit";
    backend = {
      kind: "linux-attr",
      inspectCommand: "getfattr",
      clearCommand: requireClear ? "setfattr" : null,
      description: `${inspectorVersion}; ${cleanerVersion}`,
    };
  } else {
    throw new CliError(
      `filesystem extended-attribute inspection is unsupported on ${process.platform}; attribute policy cannot be verified`,
    );
  }
  if (requireClear) await verifyExtendedAttributeClearingCapability(backend);
  return backend;
}

async function listExtendedAttributeNames(path, backend) {
  if (backend.kind === "macos-xattr") {
    const result = await runTool(backend.inspectCommand, [path]);
    return parseMacOsXattrNames(result.stdout);
  }
  if (backend.kind === "linux-attr") {
    const result = await runTool(backend.inspectCommand, ["--absolute-names", "-d", "-m", "-", "--", path]);
    return parseGetfattrNames(result.stdout);
  }
  throw new CliError("filesystem extended-attribute backend is unavailable; attribute policy cannot be verified");
}

async function inspectExtendedAttributes(path, backend) {
  const names = await listExtendedAttributeNames(path, backend);
  const attributes = [];
  for (const name of names) {
    let valueHex = null;
    if (backend.kind === "macos-xattr" && name === "com.apple.provenance") {
      const result = await runTool(backend.inspectCommand, ["-px", name, path]);
      valueHex = parseMacOsXattrHex(result.stdout);
    }
    attributes.push({ name, valueHex });
  }

  const namesAfterValueReads = await listExtendedAttributeNames(path, backend);
  const stableNames = [...names].sort().join("\0") === [...namesAfterValueReads].sort().join("\0");
  const validation = validateFilesystemAttributes(attributes);
  if (!stableNames) {
    validation.ok = false;
    validation.errors.push("filesystem extended attributes changed during inspection");
    validation.auditState = null;
  }
  return { names: validation.names, attributes, validation };
}

async function clearExtendedAttributes(paths, backend) {
  if (!backend.clearCommand) {
    throw new CliError("filesystem extended-attribute clearing is unavailable; preparation cannot continue");
  }
  for (const path of paths) {
    if (backend.kind === "macos-xattr") {
      await runTool(backend.clearCommand, ["-c", path]);
    } else if (backend.kind === "linux-attr") {
      const before = await inspectExtendedAttributes(path, backend);
      for (const name of before.names) await runTool(backend.clearCommand, ["-x", name, "--", path]);
    } else {
      throw new CliError("filesystem extended-attribute clearing backend is unsupported");
    }
    const after = await inspectExtendedAttributes(path, backend);
    if (!after.validation.ok) throw new CliError(`${basename(path)}: ${after.validation.errors.join("; ")}`);
  }
}

async function verifyExtendedAttributeClearingCapability(backend) {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "aicourse-codex-xattr-probe-"));
  const probe = join(temporaryDirectory, "probe.txt");
  const probeAttribute = backend.kind === "macos-xattr"
    ? "com.aicourse.codex-media-probe"
    : "user.aicourse_codex_media_probe";
  try {
    await writeFile(probe, "extended-attribute clearing probe\n", { encoding: "utf8", flag: "wx", mode: 0o600 });
    if (backend.kind === "macos-xattr") {
      await runTool(backend.clearCommand, ["-w", probeAttribute, "1", probe]);
    } else if (backend.kind === "linux-attr") {
      await runTool(backend.clearCommand, ["-n", probeAttribute, "-v", "1", "--", probe]);
    }
    const before = await inspectExtendedAttributes(probe, backend);
    if (!before.names.includes(probeAttribute)) {
      throw new CliError("user-defined probe attribute could not be attached and observed");
    }
    await clearExtendedAttributes([probe], backend);
    const after = await inspectExtendedAttributes(probe, backend);
    if (after.names.includes(probeAttribute)) {
      throw new CliError("user-defined probe attribute remained after clearing");
    }
    if (!after.validation.ok) {
      throw new CliError(`post-clear attribute policy failed: ${after.validation.errors.join("; ")}`);
    }
  } catch (error) {
    throw new CliError(
      `filesystem extended-attribute clearing verification failed; attribute policy cannot be claimed: ${error.message}`,
    );
  } finally {
    await unlink(probe).catch(() => {});
    await rmdir(temporaryDirectory).catch(() => {});
  }
}

async function preflightTools({ includeCwebp, requireAttributeClear }) {
  const [magick, tesseract, cwebp, extendedAttributes] = await Promise.all([
    runTool("magick", ["-version"]),
    runTool("tesseract", ["--version"]),
    includeCwebp ? runTool("cwebp", ["-version"]) : Promise.resolve(null),
    preflightExtendedAttributes({ requireClear: requireAttributeClear }),
  ]);
  return {
    record: {
      magick: normalizeVersionOutput(`${magick.stdout}\n${magick.stderr}`, "magick"),
      cwebp: cwebp ? normalizeVersionOutput(`${cwebp.stdout}\n${cwebp.stderr}`, "cwebp") : "not invoked during audit",
      tesseract: normalizeVersionOutput(`${tesseract.stdout}\n${tesseract.stderr}`, "tesseract"),
      extendedAttributes: extendedAttributes.description,
    },
    extendedAttributes,
  };
}

const MAGICK_RESOURCE_LIMITS = [
  "-limit", "memory", "512MiB",
  "-limit", "map", "1GiB",
  "-limit", "disk", "2GiB",
];

async function forceDecode(path) {
  await runTool("magick", ["-regard-warnings", ...MAGICK_RESOURCE_LIMITS, path, "null:"]);
}

async function generateAssets({ source, outputDirectory, figureId }) {
  const [masterName, largeName, smallName] = expectedAssetNames(figureId);
  const master = join(outputDirectory, masterName);
  const large = join(outputDirectory, largeName);
  const small = join(outputDirectory, smallName);

  await runTool("magick", [
    "-regard-warnings",
    ...MAGICK_RESOURCE_LIMITS,
    source,
    "-resize", "2240x",
    "-alpha", "remove",
    "-alpha", "off",
    "-depth", "8",
    "-strip",
    "-define", "png:exclude-chunk=all",
    `PNG24:${master}`,
  ]);
  await runTool("cwebp", [
    "-quiet",
    "-lossless",
    "-near_lossless", "95",
    "-m", "6",
    "-metadata", "none",
    master,
    "-o", large,
  ]);
  await runTool("cwebp", [
    "-quiet",
    "-lossless",
    "-near_lossless", "95",
    "-m", "6",
    "-metadata", "none",
    "-resize", "1120", "0",
    master,
    "-o", small,
  ]);
  await Promise.all([master, large, small].map(async (path) => {
    await chmod(path, 0o600);
    await forceDecode(path);
  }));
  return { master, large, small };
}

function addOcrMode(findings, mode) {
  return findings.map((finding) => ({ mode, ...finding }));
}

async function performOcr(masterPath) {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "aicourse-codex-ocr-"));
  try {
    const texts = [];
    const hardFindings = [];
    const reviewFindings = [];
    for (const mode of [6, 11]) {
      const outputBase = join(temporaryDirectory, `ocr-psm-${mode}`);
      await runTool("tesseract", [masterPath, outputBase, "--psm", String(mode), "-l", "eng", "txt"]);
      const text = await readFile(`${outputBase}.txt`, "utf8");
      texts.push({ mode, text });
      const scan = scanOcrText(text);
      hardFindings.push(...addOcrMode(scan.hardFindings, mode));
      reviewFindings.push(...addOcrMode(scan.reviewFindings, mode));
    }
    const digestInput = texts.map(({ mode, text }) => `psm=${mode}\0${text}`).join("\0");
    return {
      modes: [6, 11],
      digestSha256: sha256(digestInput),
      textBytes: texts.reduce((sum, item) => sum + Buffer.byteLength(item.text, "utf8"), 0),
      hardFindingCount: hardFindings.length,
      hardFindings,
      reviewFindings,
    };
  } finally {
    const entries = await readdir(temporaryDirectory).catch(() => []);
    await Promise.all(entries.map((name) => unlink(join(temporaryDirectory, name)).catch(() => {})));
    await rmdir(temporaryDirectory).catch(() => {});
  }
}

async function loadAssetInventory(outputDirectory, figureId, extendedAttributeBackend) {
  const assets = [];
  for (const name of expectedAssetNames(figureId)) {
    const path = join(outputDirectory, name);
    const details = await lstat(path).catch((error) => {
      if (error?.code === "ENOENT") throw new CliError(`missing staged asset ${name}`);
      throw error;
    });
    if (!details.isFile() || details.isSymbolicLink()) throw new CliError(`${name} must be a regular non-symlink file`);
    const resolvedPath = await realpath(path);
    const resolvedOutput = await realpath(outputDirectory);
    if (!isPathInside(resolvedPath, resolvedOutput)) throw new CliError(`${name} resolves outside the staging directory`);
    const { buffer } = await readBoundedFile(path, MAX_SOURCE_BYTES, name);
    const filesystemAttributes = await inspectExtendedAttributes(path, extendedAttributeBackend);
    assets.push({ name, buffer, filesystemAttributes: filesystemAttributes.attributes });
  }
  const result = buildAssetInventory({ figureId, assets });
  if (!result.ok) throw new CliError(result.errors.join("; "));
  return result.inventory;
}

function privacyChecklist(status = "pending") {
  return Object.fromEntries(CODEX_MEDIA_CHECKLIST.map((item) => [item, status]));
}

function makeAuditRecord({ options, source, sourceInspection, tools, inventory, ocr }) {
  return {
    schema: CODEX_MEDIA_AUDIT_SCHEMA,
    figureId: options.id,
    createdAt: new Date().toISOString(),
    publishable: false,
    rawSource: {
      kind: "course-authored-capture",
      format: "png",
      mediaType: "image/png",
      bytes: source.details.size,
      width: sourceInspection.width,
      height: sourceInspection.height,
      sha256: sha256(source.buffer),
      retainedOutsidePublic: true,
      retainedOutsideRepository: true,
    },
    provenance: {
      sourceId: options["source-id"],
      surface: options.surface,
      productVersion: options["product-version"],
      operatingSystem: options["operating-system"],
      capturedOn: options["captured-on"],
    },
    tools,
    transform: {
      png: CODEX_MEDIA_TRANSFORM.png,
      webp: CODEX_MEDIA_TRANSFORM.webp,
      filesystemAttributes: CODEX_MEDIA_TRANSFORM.filesystemAttributes,
      responsiveWidths: [...CODEX_MEDIA_TRANSFORM.responsiveWidths],
    },
    assets: inventory,
    ocr: {
      patternVersion: CODEX_MEDIA_PATTERN_VERSION,
      modes: ocr.modes,
      digestSha256: ocr.digestSha256,
      textBytes: ocr.textBytes,
      hardFindingCount: ocr.hardFindingCount,
      hardFindings: ocr.hardFindings,
      reviewFindingCount: ocr.reviewFindings.length,
      reviewFindings: ocr.reviewFindings,
    },
    automatedChecks: {
      fullDecode: "passed",
      containerIntegrity: "passed",
      metadataAndFeatures: "passed",
      filesystemAttributePolicy: "passed",
      hardPrivacyPatterns: "passed",
    },
    privacyReview: {
      status: "pending",
      reviewer: null,
      reviewedAt: null,
      automatedChecksDoNotConstituteApproval: true,
      checklistVersion: CODEX_MEDIA_PRIVACY_CHECKLIST_VERSION,
      checklist: privacyChecklist(),
    },
  };
}

async function cleanupPreparedDirectory(outputDirectory) {
  const names = await readdir(outputDirectory).catch(() => []);
  await Promise.all(names.map(async (name) => {
    const path = join(outputDirectory, name);
    const details = await lstat(path).catch(() => null);
    if (details?.isFile() || details?.isSymbolicLink()) await unlink(path).catch(() => {});
  }));
  await rmdir(outputDirectory).catch(() => {});
}

function validatePrepareMetadata(options) {
  if (!/^fig-(?:0[1-9]|1\d|2[0-4])$/.test(options.id)) {
    throw new CliError("--id must match fig-01 through fig-24");
  }
  if (!isRealIsoDate(options["captured-on"])) {
    throw new CliError("--captured-on must be a real YYYY-MM-DD date");
  }
  if (!/^openai-[a-z0-9-]{2,120}$/.test(options["source-id"])) {
    throw new CliError("--source-id must be a stable official OpenAI documentation ID such as openai-quickstart");
  }
  if (!["app", "cli", "ide", "cloud", "github"].includes(options.surface)) {
    throw new CliError("--surface must be app, cli, ide, cloud, or github");
  }
  for (const key of ["product-version", "operating-system", "surface"]) {
    if (options[key].length > 160 || /[\r\n\0]/u.test(options[key])) throw new CliError(`--${key} contains invalid text`);
  }
  const metadataScan = scanOcrText([
    options["source-id"],
    options.surface,
    options["product-version"],
    options["operating-system"],
  ].join("\n"));
  if (metadataScan.hardFindingCount > 0) {
    throw new CliError("capture metadata contains a hard privacy pattern");
  }
}

async function prepare(options) {
  validatePrepareMetadata(options);
  const sourcePath = await inspectExistingPath(options.input, { label: "raw input", requireFile: true });
  const output = await inspectNewOutputDirectory(options.output);

  const source = await readBoundedFile(sourcePath.resolvedPath, MAX_SOURCE_BYTES, "raw input");
  const sourceInspection = inspectPng(source.buffer);
  if (!sourceInspection.ok || !sourceInspection.complete) {
    throw new CliError(`raw input must be a complete PNG: ${sourceInspection.errors.join("; ")}`);
  }
  if (sourceInspection.width < 2240) throw new CliError("raw input width must be at least 2240 pixels");
  if (sourceInspection.width * sourceInspection.height > MAX_SOURCE_PIXELS) {
    throw new CliError(`raw input exceeds ${MAX_SOURCE_PIXELS} pixels`);
  }
  const sourceFeatureChunks = sourceInspection.chunks
    .map((chunk) => chunk.type)
    .filter((type) => ["acTL", "fcTL", "fdAT"].includes(type));
  if (sourceFeatureChunks.length > 0) {
    throw new CliError(`animated or multi-frame PNG input is not allowed: ${[...new Set(sourceFeatureChunks)].join(", ")}`);
  }

  const toolPreflight = await preflightTools({ includeCwebp: true, requireAttributeClear: true });
  await mkdir(output.requestedPath, { mode: 0o700 });
  let succeeded = false;
  try {
    const createdDirectory = await inspectExistingPath(output.requestedPath, {
      label: "created output directory",
      requireDirectory: true,
    });
    if (createdDirectory.resolvedPath !== output.candidateRealPath) {
      throw new CliError("created output directory resolved somewhere unexpected");
    }
    await forceDecode(sourcePath.resolvedPath);
    const generated = await generateAssets({
      source: sourcePath.resolvedPath,
      outputDirectory: output.requestedPath,
      figureId: options.id,
    });
    const generatedNames = (await readdir(output.requestedPath)).sort();
    const expectedGeneratedNames = expectedAssetNames(options.id).sort();
    if (JSON.stringify(generatedNames) !== JSON.stringify(expectedGeneratedNames)) {
      throw new CliError(`image tools created an unexpected staging inventory: ${generatedNames.join(", ")}`);
    }
    await clearExtendedAttributes(
      [generated.master, generated.large, generated.small],
      toolPreflight.extendedAttributes,
    );
    const ocr = await performOcr(generated.master);
    if (ocr.hardFindingCount > 0) {
      const ids = [...new Set(ocr.hardFindings.map((finding) => finding.id))].join(", ");
      throw new CliError(`OCR found ${ocr.hardFindingCount} hard privacy finding(s): ${ids}; recapture instead of blurring`);
    }
    const inventory = await loadAssetInventory(
      output.requestedPath,
      options.id,
      toolPreflight.extendedAttributes,
    );

    const audit = makeAuditRecord({
      options,
      source,
      sourceInspection,
      tools: toolPreflight.record,
      inventory,
      ocr,
    });
    const validation = validateAuditRecord(audit, { expectedInventory: inventory, requirePending: true });
    if (!validation.ok) throw new CliError(`generated audit draft is invalid: ${validation.errors.join("; ")}`);
    const auditName = `${options.id}-audit.json`;
    await writeFile(join(output.requestedPath, auditName), `${JSON.stringify(audit, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    succeeded = true;
    process.stdout.write(`${JSON.stringify({
      ok: true,
      command: "prepare",
      figureId: options.id,
      outputDirectory: output.requestedPath,
      files: [...expectedAssetNames(options.id), auditName],
      privacyReviewStatus: "pending",
      publishable: false,
      filesystemAttributes: "user-attached-attributes-removed-and-policy-verified",
      reviewFindingCount: ocr.reviewFindings.length,
    }, null, 2)}\n`);
  } finally {
    if (!succeeded) await cleanupPreparedDirectory(output.requestedPath);
  }
}

function ensureAuditDirectoryInventory(names, figureId) {
  const expected = [...expectedAssetNames(figureId), `${figureId}-audit.json`].sort();
  const actual = [...names].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new CliError(`staging directory inventory mismatch; expected only ${expected.join(", ")}`);
  }
}

function comparableOcr(ocr) {
  return {
    modes: ocr.modes,
    digestSha256: ocr.digestSha256,
    textBytes: ocr.textBytes,
    hardFindingCount: ocr.hardFindingCount,
    hardFindings: ocr.hardFindings,
    reviewFindingCount: ocr.reviewFindings.length,
    reviewFindings: ocr.reviewFindings,
  };
}

async function audit(options) {
  const directory = await inspectExistingPath(options.dir, { label: "staging directory", requireDirectory: true });
  const names = await readdir(directory.resolvedPath);
  const auditNames = names.filter((name) => /^fig-(?:0[1-9]|1\d|2[0-4])-audit\.json$/.test(name));
  if (auditNames.length !== 1) throw new CliError("staging directory must contain exactly one fig-XX-audit.json file");
  const figureId = auditNames[0].slice(0, 6);
  ensureAuditDirectoryInventory(names, figureId);
  const auditPath = join(directory.resolvedPath, auditNames[0]);
  const auditDetails = await lstat(auditPath);
  if (!auditDetails.isFile() || auditDetails.isSymbolicLink()) throw new CliError("audit draft must be a regular non-symlink file");
  const { buffer: auditBuffer } = await readBoundedFile(auditPath, MAX_AUDIT_BYTES, "audit draft");
  let record;
  try {
    record = JSON.parse(auditBuffer.toString("utf8"));
  } catch {
    throw new CliError("audit draft is not valid JSON");
  }
  if (record.figureId !== figureId) throw new CliError("audit filename and figureId disagree");

  const toolPreflight = await preflightTools({ includeCwebp: false, requireAttributeClear: false });
  const inventory = await loadAssetInventory(
    directory.resolvedPath,
    figureId,
    toolPreflight.extendedAttributes,
  );
  const validation = validateAuditRecord(record, { expectedInventory: inventory });
  if (!validation.ok) throw new CliError(`audit record failed validation: ${validation.errors.join("; ")}`);
  await Promise.all(expectedAssetNames(figureId).map((name) => forceDecode(join(directory.resolvedPath, name))));
  const currentOcr = await performOcr(join(directory.resolvedPath, `${figureId}-master.png`));
  if (currentOcr.hardFindingCount > 0) {
    const ids = [...new Set(currentOcr.hardFindings.map((finding) => finding.id))].join(", ");
    throw new CliError(`current OCR has hard privacy findings: ${ids}`);
  }
  if (JSON.stringify(comparableOcr(currentOcr)) !== JSON.stringify({
    modes: record.ocr.modes,
    digestSha256: record.ocr.digestSha256,
    textBytes: record.ocr.textBytes,
    hardFindingCount: record.ocr.hardFindingCount,
    hardFindings: record.ocr.hardFindings,
    reviewFindingCount: record.ocr.reviewFindingCount,
    reviewFindings: record.ocr.reviewFindings,
  })) {
    throw new CliError("current OCR result does not match the audit-bound OCR result; prepare the figure again");
  }
  const finalInventory = await loadAssetInventory(
    directory.resolvedPath,
    figureId,
    toolPreflight.extendedAttributes,
  );
  const finalValidation = validateAuditRecord(record, { expectedInventory: finalInventory });
  if (!finalValidation.ok) {
    throw new CliError(`final filesystem attribute audit failed: ${finalValidation.errors.join("; ")}`);
  }

  process.stdout.write(`${JSON.stringify({
    ok: true,
    command: "audit",
    figureId,
    assetCount: inventory.length,
    privacyReviewStatus: record.privacyReview.status,
    publishable: false,
    filesystemAttributes: "policy-verified",
    note: "Automated audit passed; manual privacy and pixel review is still authoritative.",
  }, null, 2)}\n`);
}

export async function main(argv = process.argv.slice(2)) {
  const parsed = parseArguments(argv);
  if (parsed.command === "help") {
    process.stdout.write(USAGE);
    return;
  }
  if (parsed.command === "prepare") await prepare(parsed.options);
  else await audit(parsed.options);
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    const message = error instanceof CliError ? error.message : `unexpected failure: ${error?.message ?? String(error)}`;
    process.stderr.write(`codex-media: ${message}\n`);
    process.exitCode = 1;
  });
}
