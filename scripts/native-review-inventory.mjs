/**
 * Deterministic, privacy-safe native-review catalog inventory.
 *
 * The manifest is an automatic prerequisite only. It binds the exact 24
 * non-English review inputs to the frozen product commit and CI workflow blob;
 * it never creates or upgrades a human-review record.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const NATIVE_REVIEW_INVENTORY_SCHEMA = "agent-edu.native-review-catalog-inventory.v2";
export const NATIVE_REVIEW_INVENTORY_PATH = "docs/release/evidence/native-review-catalog-inventory.json";
export const NATIVE_REVIEW_WORKFLOW_PATH = ".github/workflows/ci.yml";
export const NATIVE_REVIEW_LOCALES = ["zh-Hans", "zh-Hant", "ar", "de", "es", "fr", "ja", "ko"];
export const ALL_REVIEW_CATALOG_LOCALES = ["en", ...NATIVE_REVIEW_LOCALES];
export const NATIVE_REVIEW_CATALOGS = [
  { id: "site", directory: "messages" },
  { id: "handbook", directory: "messages/handbook" },
  { id: "widgets", directory: "messages/widgets" },
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GIT_SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const MAX_GIT_FILE_BYTES = 4 * 1024 * 1024;
const MAX_INVENTORY_BYTES = 256 * 1024;
const INVENTORY_STATUS = "catalogs-inventoried-human-review-state-unchanged";
const EXPECTED_INVENTORY_KEYS = [
  "schema",
  "status",
  "target",
  "catalogTypes",
  "locales",
  "files",
  "gateEffect",
  "privacy",
];
const EXPECTED_TARGET_KEYS = [
  "candidateCommitSha",
  "workflowDefinitionPath",
  "workflowDefinitionSha",
];
const EXPECTED_FILE_KEYS = ["catalog", "locale", "path", "keyCount", "sha256"];
const EXPECTED_GATE_EFFECT_KEYS = [
  "nativeReviewStatusesChanged",
  "humanSignaturesPresent",
  "releaseAuthorized",
];
const EXPECTED_PRIVACY_KEYS = [
  "containsReviewerIdentity",
  "containsPrivateContactDetails",
  "containsCredentials",
  "containsAuthorizationOrCookies",
  "containsSignedOrBypassUrls",
  "containsScreenshotsOrTraces",
];
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /(?:^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/u,
  /(?:^|[^A-Za-z0-9])gh[pousr]_[A-Za-z0-9]{30,}/u,
  /Bearer\s+[A-Za-z0-9._~+/-]{16,}/iu,
  /https?:\/\/[^\s?#]+\?[^\s#]*/iu,
];
const SENSITIVE_FIELD = /^(?:authorization|cookie|prompt|reply|rawbody|rawresponse|providerbody|providerresponse|providerrawbody|providerrawresponse|signedurl|apikey|secret|token|credential|credentialvalue)$/iu;

/**
 * @typedef {{candidateCommitSha: string, workflowDefinitionSha: string}} NativeReviewReleaseTarget
 * @typedef {{catalog: string, locale: string, path: string}} NativeReviewExpectedFile
 * @typedef {{catalog: string, locale: string, path: string, keyCount: number, sha256: string}} NativeReviewInventoryFile
 * @typedef {{code: string, path: string, message: string}} NativeReviewInventoryIssue
 * @typedef {{
 *   schema: string,
 *   status: string,
 *   target: {candidateCommitSha: string, workflowDefinitionPath: string, workflowDefinitionSha: string},
 *   catalogTypes: string[],
 *   locales: string[],
 *   files: NativeReviewInventoryFile[],
 *   gateEffect: {nativeReviewStatusesChanged: boolean, humanSignaturesPresent: boolean, releaseAuthorized: boolean},
 *   privacy: {
 *     containsReviewerIdentity: boolean,
 *     containsPrivateContactDetails: boolean,
 *     containsCredentials: boolean,
 *     containsAuthorizationOrCookies: boolean,
 *     containsSignedOrBypassUrls: boolean,
 *     containsScreenshotsOrTraces: boolean,
 *   },
 * }} NativeReviewInventory
 */

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && [...actual].sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function sameOrderedStrings(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function addIssue(issues, code, path, message) {
  issues.push({ code, path, message });
}

function gitResult(projectRoot, args, encoding = "utf8") {
  return spawnSync("git", ["-C", projectRoot, ...args], {
    encoding,
    maxBuffer: MAX_GIT_FILE_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitText(projectRoot, args) {
  const result = gitResult(projectRoot, args, "utf8");
  if (result.status !== 0 || typeof result.stdout !== "string") {
    throw new Error("Git could not resolve the frozen native-review target");
  }
  return result.stdout.trim();
}

function gitBytes(projectRoot, args) {
  const result = gitResult(projectRoot, args, null);
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout)) {
    throw new Error("Git could not read a frozen native-review input");
  }
  return result.stdout;
}

function resolveCandidate(projectRoot, releaseTarget) {
  const candidateCommitSha = releaseTarget?.candidateCommitSha;
  const configuredWorkflowSha = releaseTarget?.workflowDefinitionSha;
  if (!GIT_SHA.test(candidateCommitSha)) {
    throw new Error("releaseTarget.candidateCommitSha must be one frozen lowercase 40-character Git commit SHA");
  }
  if (!GIT_SHA.test(configuredWorkflowSha)) {
    throw new Error("releaseTarget.workflowDefinitionSha must be one frozen lowercase 40-character Git blob SHA");
  }
  const resolvedCommit = gitText(projectRoot, ["rev-parse", "--verify", `${candidateCommitSha}^{commit}`]);
  if (resolvedCommit !== candidateCommitSha) {
    throw new Error("releaseTarget.candidateCommitSha does not resolve to the exact frozen commit");
  }
  const workflowDefinitionSha = gitText(
    projectRoot,
    ["rev-parse", "--verify", `${candidateCommitSha}:${NATIVE_REVIEW_WORKFLOW_PATH}`],
  );
  if (!GIT_SHA.test(workflowDefinitionSha)) {
    throw new Error("the candidate workflow definition did not resolve to one Git blob SHA");
  }
  const workflowObjectType = gitText(projectRoot, ["cat-file", "-t", workflowDefinitionSha]);
  if (workflowObjectType !== "blob") {
    throw new Error("the candidate workflow definition must resolve to a Git blob");
  }
  if (configuredWorkflowSha !== workflowDefinitionSha) {
    throw new Error("releaseTarget.workflowDefinitionSha does not match the candidate workflow blob");
  }
  return { candidateCommitSha, workflowDefinitionSha };
}

function parseCatalog(bytes, safePath) {
  if (!Buffer.isBuffer(bytes) || bytes.length > MAX_GIT_FILE_BYTES || bytes.includes(0)) {
    throw new Error(`${safePath} is not a bounded UTF-8 JSON catalog`);
  }
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${safePath} is not valid JSON`);
  }
  if (!isObject(parsed)) {
    throw new Error(`${safePath} must contain one JSON object catalog`);
  }
  return { keyCount: Object.keys(parsed).length, parsed };
}

function expectedLocaleFileNames() {
  return ALL_REVIEW_CATALOG_LOCALES.map((locale) => `${locale}.json`).sort();
}

function candidateCatalogFileNames(projectRoot, candidateCommitSha, directory) {
  const output = gitText(projectRoot, ["ls-tree", "--name-only", `${candidateCommitSha}:${directory}`]);
  return output
    .split("\n")
    .filter((name) => name.endsWith(".json") && !name.includes("/"))
    .sort();
}

function workingCatalogFileNames(projectRoot, directory) {
  try {
    return readdirSync(join(projectRoot, directory), { withFileTypes: true })
      .filter((entry) => entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();
  } catch {
    throw new Error(`${directory} could not be read as a catalog directory`);
  }
}

function assertExactCatalogFileSets(projectRoot, candidateCommitSha) {
  const expected = expectedLocaleFileNames();
  for (const descriptor of NATIVE_REVIEW_CATALOGS) {
    if (!sameOrderedStrings(candidateCatalogFileNames(projectRoot, candidateCommitSha, descriptor.directory), expected)) {
      throw new Error(`${descriptor.directory} has a missing or unexpected candidate locale JSON file`);
    }
    if (!sameOrderedStrings(workingCatalogFileNames(projectRoot, descriptor.directory), expected)) {
      throw new Error(`${descriptor.directory} has a missing or unexpected working-tree locale JSON file`);
    }
  }
}

function readWorkingFile(projectRoot, relativePath) {
  const root = realpathSync(projectRoot);
  const file = resolve(root, relativePath);
  if (!file.startsWith(root + sep)) {
    throw new Error("a native-review input path escaped the project root");
  }
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${relativePath} must be a regular non-symlink file`);
  }
  const canonical = realpathSync(file);
  if (!canonical.startsWith(root + sep)) {
    throw new Error("a native-review input canonical path escaped the project root");
  }
  return readFileSync(canonical);
}

/** @returns {NativeReviewExpectedFile[]} */
export function expectedNativeReviewFiles() {
  return NATIVE_REVIEW_LOCALES.flatMap((locale) =>
    NATIVE_REVIEW_CATALOGS.map((descriptor) => ({
      catalog: descriptor.id,
      locale,
      path: `${descriptor.directory}/${locale}.json`,
    })));
}

function makeInventory({ target, files }) {
  return {
    schema: NATIVE_REVIEW_INVENTORY_SCHEMA,
    status: INVENTORY_STATUS,
    target: {
      candidateCommitSha: target.candidateCommitSha,
      workflowDefinitionPath: NATIVE_REVIEW_WORKFLOW_PATH,
      workflowDefinitionSha: target.workflowDefinitionSha,
    },
    catalogTypes: NATIVE_REVIEW_CATALOGS.map(({ id }) => id),
    locales: [...NATIVE_REVIEW_LOCALES],
    files,
    gateEffect: {
      nativeReviewStatusesChanged: false,
      humanSignaturesPresent: false,
      releaseAuthorized: false,
    },
    privacy: {
      containsReviewerIdentity: false,
      containsPrivateContactDetails: false,
      containsCredentials: false,
      containsAuthorizationOrCookies: false,
      containsSignedOrBypassUrls: false,
      containsScreenshotsOrTraces: false,
    },
  };
}

function privacyFinding(value) {
  let found = false;
  const visit = (current) => {
    if (found) return;
    if (typeof current === "string") {
      if (SECRET_PATTERNS.some((pattern) => pattern.test(current))) found = true;
      return;
    }
    if (Array.isArray(current)) {
      for (const item of current) visit(item);
      return;
    }
    if (!isObject(current)) return;
    for (const [key, item] of Object.entries(current)) {
      if (SENSITIVE_FIELD.test(key)) {
        found = true;
        return;
      }
      visit(item);
    }
  };
  visit(value);
  return found;
}

function loadInventoryFile(projectRoot, issues) {
  let root;
  try {
    root = realpathSync(projectRoot);
  } catch {
    addIssue(issues, "native-inventory-file", NATIVE_REVIEW_INVENTORY_PATH, "project root could not be resolved safely");
    return null;
  }
  const file = resolve(root, NATIVE_REVIEW_INVENTORY_PATH);
  if (!file.startsWith(root + sep)) {
    addIssue(issues, "native-inventory-path", NATIVE_REVIEW_INVENTORY_PATH, "inventory path escaped the project root");
    return null;
  }
  let stat;
  try {
    stat = lstatSync(file);
  } catch {
    addIssue(issues, "native-inventory-file", NATIVE_REVIEW_INVENTORY_PATH, "final-candidate native-review inventory is missing");
    return null;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    addIssue(issues, "native-inventory-file", NATIVE_REVIEW_INVENTORY_PATH, "inventory must be a regular non-symlink file");
    return null;
  }
  if (stat.size > MAX_INVENTORY_BYTES) {
    addIssue(issues, "native-inventory-file", NATIVE_REVIEW_INVENTORY_PATH, "inventory must be 256 KiB or smaller");
    return null;
  }
  let bytes;
  try {
    const canonical = realpathSync(file);
    if (!canonical.startsWith(root + sep)) {
      addIssue(issues, "native-inventory-path", NATIVE_REVIEW_INVENTORY_PATH, "inventory canonical path escaped the project root");
      return null;
    }
    bytes = readFileSync(canonical);
  } catch {
    addIssue(issues, "native-inventory-file", NATIVE_REVIEW_INVENTORY_PATH, "inventory could not be read safely");
    return null;
  }
  if (bytes.includes(0)) {
    addIssue(issues, "native-inventory-privacy", NATIVE_REVIEW_INVENTORY_PATH, "binary inventory content is forbidden");
    return null;
  }
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    addIssue(issues, "native-inventory-file", NATIVE_REVIEW_INVENTORY_PATH, "inventory is not valid JSON");
    return null;
  }
}

function validateInventoryShape(inventory, issues) {
  if (!isObject(inventory)) {
    addIssue(issues, "native-inventory-schema", "$", "inventory must be one JSON object");
    return;
  }
  if (!sameMembers(Object.keys(inventory), EXPECTED_INVENTORY_KEYS)) {
    addIssue(issues, "native-inventory-schema", "$", "inventory must contain only the fixed privacy-safe schema fields");
  }
  if (inventory.schema !== NATIVE_REVIEW_INVENTORY_SCHEMA) {
    addIssue(issues, "native-inventory-schema", "$.schema", "inventory schema is unsupported");
  }
  if (inventory.status !== INVENTORY_STATUS) {
    addIssue(issues, "native-inventory-schema", "$.status", "inventory status must leave human-review state unchanged");
  }
  if (!isObject(inventory.target) || !sameMembers(Object.keys(inventory.target), EXPECTED_TARGET_KEYS)) {
    addIssue(issues, "native-inventory-schema", "$.target", "inventory target must contain the exact candidate and workflow binding fields");
  }
  if (!sameOrderedStrings(inventory.catalogTypes, NATIVE_REVIEW_CATALOGS.map(({ id }) => id))) {
    addIssue(issues, "native-inventory-file-set", "$.catalogTypes", "inventory must name the exact ordered site, handbook, and widgets catalogs");
  }
  if (!sameOrderedStrings(inventory.locales, NATIVE_REVIEW_LOCALES)) {
    addIssue(issues, "native-inventory-file-set", "$.locales", "inventory must name the exact ordered eight native-review locales");
  }
  if (!isObject(inventory.gateEffect) || !sameMembers(Object.keys(inventory.gateEffect), EXPECTED_GATE_EFFECT_KEYS)) {
    addIssue(issues, "native-inventory-schema", "$.gateEffect", "inventory must record the fixed non-authorizing gate effect");
  } else if (Object.values(inventory.gateEffect).some((value) => value !== false)) {
    addIssue(issues, "native-inventory-schema", "$.gateEffect", "inventory must not change review status, add signatures, or authorize release");
  }
  if (!isObject(inventory.privacy) || !sameMembers(Object.keys(inventory.privacy), EXPECTED_PRIVACY_KEYS)) {
    addIssue(issues, "native-inventory-schema", "$.privacy", "inventory must contain the fixed privacy declaration");
  } else if (Object.values(inventory.privacy).some((value) => value !== false)) {
    addIssue(issues, "native-inventory-privacy", "$.privacy", "inventory declares forbidden private content");
  }

  const expectedFiles = expectedNativeReviewFiles();
  if (!Array.isArray(inventory.files) || inventory.files.length !== expectedFiles.length) {
    addIssue(issues, "native-inventory-file-set", "$.files", "inventory must contain exactly 24 ordered review files");
    return;
  }
  for (let index = 0; index < expectedFiles.length; index += 1) {
    const entry = inventory.files[index];
    const expected = expectedFiles[index];
    const path = `$.files[${index}]`;
    if (!isObject(entry) || !sameMembers(Object.keys(entry), EXPECTED_FILE_KEYS)) {
      addIssue(issues, "native-inventory-schema", path, "file entry must contain only catalog, locale, path, keyCount, and sha256");
      continue;
    }
    if (entry.catalog !== expected.catalog || entry.locale !== expected.locale) {
      addIssue(issues, "native-inventory-file-set", path, "file entry is not in the canonical locale and catalog order");
    }
    if (entry.path !== expected.path) {
      addIssue(issues, "native-inventory-path", `${path}.path`, "file entry must use its exact canonical in-repository path");
    }
    if (!Number.isSafeInteger(entry.keyCount) || entry.keyCount < 0) {
      addIssue(issues, "native-inventory-schema", `${path}.keyCount`, "keyCount must be one non-negative safe integer");
    }
    if (!SHA256.test(entry.sha256)) {
      addIssue(issues, "native-inventory-schema", `${path}.sha256`, "sha256 must be one lowercase 64-character digest");
    }
  }
}

/**
 * @param {{
 *   projectRoot?: string,
 *   releaseTarget?: NativeReviewReleaseTarget,
 *   inventory?: NativeReviewInventory | Record<string, unknown>,
 * }} [options]
 * @returns {{ok: boolean, issues: NativeReviewInventoryIssue[], inventory: NativeReviewInventory | Record<string, unknown> | null}}
 */
export function checkNativeReviewInventory({
  projectRoot = ROOT,
  releaseTarget,
  inventory: providedInventory,
} = {}) {
  const issues = [];
  const inventory = providedInventory ?? loadInventoryFile(projectRoot, issues);
  if (inventory === null || inventory === undefined) return { ok: false, issues, inventory: null };

  if (privacyFinding(inventory)) {
    addIssue(
      issues,
      "native-inventory-privacy",
      "$",
      "inventory contains a forbidden private field or value; matched content is not displayed",
    );
  }
  validateInventoryShape(inventory, issues);

  if (!GIT_SHA.test(releaseTarget?.candidateCommitSha)) {
    addIssue(issues, "native-inventory-target-binding", "$.target.candidateCommitSha", "release target candidate is not frozen");
    return { ok: false, issues, inventory };
  }
  if (!GIT_SHA.test(releaseTarget?.workflowDefinitionSha)) {
    addIssue(issues, "native-inventory-workflow-binding", "$.target.workflowDefinitionSha", "release target workflow blob is not frozen");
    return { ok: false, issues, inventory };
  }
  if (inventory?.target?.candidateCommitSha !== releaseTarget.candidateCommitSha) {
    addIssue(issues, "native-inventory-target-binding", "$.target.candidateCommitSha", "inventory must bind the exact release target candidate commit");
  }
  if (inventory?.target?.workflowDefinitionPath !== NATIVE_REVIEW_WORKFLOW_PATH) {
    addIssue(issues, "native-inventory-workflow-binding", "$.target.workflowDefinitionPath", "inventory must bind the authoritative CI workflow path");
  }
  if (inventory?.target?.workflowDefinitionSha !== releaseTarget.workflowDefinitionSha) {
    addIssue(issues, "native-inventory-workflow-binding", "$.target.workflowDefinitionSha", "inventory must bind the exact release target workflow blob");
  }

  let resolvedTarget;
  try {
    resolvedTarget = resolveCandidate(projectRoot, releaseTarget);
  } catch {
    addIssue(issues, "native-inventory-candidate", "$.target", "candidate commit or workflow blob could not be verified from Git");
    if (GIT_SHA.test(releaseTarget.workflowDefinitionSha)) {
      addIssue(issues, "native-inventory-workflow-binding", "$.target.workflowDefinitionSha", "release target workflow blob does not match the candidate Git object");
    }
    return { ok: false, issues, inventory };
  }
  if (resolvedTarget.workflowDefinitionSha !== releaseTarget.workflowDefinitionSha) {
    addIssue(issues, "native-inventory-workflow-binding", "$.target.workflowDefinitionSha", "release target workflow blob does not match the candidate Git object");
  }

  const expectedNames = expectedLocaleFileNames();
  for (const descriptor of NATIVE_REVIEW_CATALOGS) {
    try {
      if (!sameOrderedStrings(candidateCatalogFileNames(projectRoot, resolvedTarget.candidateCommitSha, descriptor.directory), expectedNames)) {
        addIssue(issues, "native-inventory-candidate-file-set", descriptor.directory, "candidate has a missing or unexpected top-level locale JSON file");
      }
    } catch {
      addIssue(issues, "native-inventory-candidate-file-set", descriptor.directory, "candidate catalog file set could not be verified");
    }
    try {
      if (!sameOrderedStrings(workingCatalogFileNames(projectRoot, descriptor.directory), expectedNames)) {
        addIssue(issues, "native-inventory-working-file-set", descriptor.directory, "working tree has a missing or unexpected top-level locale JSON file");
      }
    } catch {
      addIssue(issues, "native-inventory-working-file-set", descriptor.directory, "working catalog file set could not be verified");
    }
  }

  const expectedFiles = expectedNativeReviewFiles();
  for (let index = 0; index < expectedFiles.length; index += 1) {
    const expected = expectedFiles[index];
    const entry = Array.isArray(inventory.files) ? inventory.files[index] : undefined;
    let candidateBytes;
    let candidateCatalog;
    try {
      candidateBytes = gitBytes(
        projectRoot,
        ["show", `${resolvedTarget.candidateCommitSha}:${expected.path}`],
      );
      candidateCatalog = parseCatalog(candidateBytes, expected.path);
    } catch {
      addIssue(issues, "native-inventory-candidate-file", expected.path, "candidate review file is missing or invalid");
      continue;
    }
    if (entry?.sha256 !== sha256(candidateBytes)) {
      addIssue(issues, "native-inventory-candidate-digest", `$.files[${index}].sha256`, "digest does not match the frozen candidate file");
    }
    if (entry?.keyCount !== candidateCatalog.keyCount) {
      addIssue(issues, "native-inventory-candidate-key-count", `$.files[${index}].keyCount`, "key count does not match the frozen candidate file");
    }

    let workingBytes;
    let workingCatalog;
    try {
      workingBytes = readWorkingFile(projectRoot, expected.path);
      workingCatalog = parseCatalog(workingBytes, expected.path);
    } catch {
      addIssue(issues, "native-inventory-working-file", expected.path, "working-tree review file is missing, unsafe, or invalid");
      continue;
    }
    if (!workingBytes.equals(candidateBytes) || entry?.sha256 !== sha256(workingBytes)) {
      addIssue(issues, "native-inventory-working-digest", expected.path, "working-tree bytes differ from the frozen candidate inventory");
    }
    if (workingCatalog.keyCount !== candidateCatalog.keyCount || entry?.keyCount !== workingCatalog.keyCount) {
      addIssue(issues, "native-inventory-working-key-count", expected.path, "working-tree key count differs from the frozen candidate inventory");
    }
  }

  return { ok: issues.length === 0, issues, inventory };
}

/**
 * @param {{projectRoot?: string, releaseTarget?: NativeReviewReleaseTarget}} [options]
 * @returns {NativeReviewInventory}
 */
export function buildNativeReviewInventory({ projectRoot = ROOT, releaseTarget } = {}) {
  const resolvedRoot = realpathSync(projectRoot);
  const target = resolveCandidate(resolvedRoot, releaseTarget);
  assertExactCatalogFileSets(resolvedRoot, target.candidateCommitSha);
  const files = expectedNativeReviewFiles().map((expected) => {
    const candidateBytes = gitBytes(
      resolvedRoot,
      ["show", `${target.candidateCommitSha}:${expected.path}`],
    );
    const workingBytes = readWorkingFile(resolvedRoot, expected.path);
    if (!workingBytes.equals(candidateBytes)) {
      throw new Error(`${expected.path} differs from the frozen candidate; inventory was not written`);
    }
    const catalog = parseCatalog(candidateBytes, expected.path);
    return {
      ...expected,
      keyCount: catalog.keyCount,
      sha256: sha256(candidateBytes),
    };
  });
  const inventory = makeInventory({ target, files });
  const checked = checkNativeReviewInventory({
    projectRoot: resolvedRoot,
    releaseTarget,
    inventory,
  });
  if (!checked.ok) {
    throw new Error("generated native-review inventory failed its own freshness contract");
  }
  return inventory;
}

/**
 * @param {{projectRoot?: string, releaseTarget?: NativeReviewReleaseTarget}} [options]
 * @returns {NativeReviewInventory}
 */
export function writeNativeReviewInventory({ projectRoot = ROOT, releaseTarget } = {}) {
  const resolvedRoot = realpathSync(projectRoot);
  const inventory = buildNativeReviewInventory({ projectRoot: resolvedRoot, releaseTarget });
  const lexicalOutput = resolve(resolvedRoot, NATIVE_REVIEW_INVENTORY_PATH);
  if (!lexicalOutput.startsWith(resolvedRoot + sep)) {
    throw new Error("native-review inventory output path escaped the project root");
  }
  mkdirSync(dirname(lexicalOutput), { recursive: true });
  const canonicalParent = realpathSync(dirname(lexicalOutput));
  if (!canonicalParent.startsWith(resolvedRoot + sep)) {
    throw new Error("native-review inventory output parent escaped through a symlink");
  }
  const output = join(canonicalParent, basename(lexicalOutput));
  if (existsSync(output)) {
    const outputStat = lstatSync(output);
    if (!outputStat.isFile() || outputStat.isSymbolicLink()) {
      throw new Error("native-review inventory output must be a regular non-symlink file");
    }
  }
  const temporary = `${output}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(inventory, null, 2)}\n`, {
      flag: "wx",
      mode: 0o600,
    });
    renameSync(temporary, output);
  } finally {
    rmSync(temporary, { force: true });
  }
  return inventory;
}

function readReleaseTarget(projectRoot) {
  const configPath = join(projectRoot, "config/release-readiness.json");
  let config;
  try {
    const stat = lstatSync(configPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_INVENTORY_BYTES) {
      throw new Error("unsafe release config");
    }
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    throw new Error("config/release-readiness.json could not be read safely");
  }
  return config?.releaseTarget;
}

function formatIssues(issues) {
  return issues
    .slice(0, 20)
    .map((issue) => `- ${issue.path} (${issue.code}): ${issue.message}`)
    .join("\n");
}

function safeCliErrorMessage(error) {
  const fallback = "operation failed; no private value or local absolute path is displayed";
  if (!(error instanceof Error)) return fallback;
  const message = error.message;
  if (
    message.length === 0
    || message.length > 240
    || privacyFinding(message)
    || message.includes(ROOT)
    || /\b(?:EACCES|EEXIST|ENOENT|EPERM)\b/u.test(message)
  ) {
    return fallback;
  }
  return message;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const action = process.argv[2];
  try {
    const releaseTarget = readReleaseTarget(ROOT);
    if (action === "--generate") {
      const inventory = writeNativeReviewInventory({ projectRoot: ROOT, releaseTarget });
      console.log(
        `native-review inventory: wrote ${inventory.files.length} candidate-bound files to ${NATIVE_REVIEW_INVENTORY_PATH}; human reviews unchanged`,
      );
    } else if (action === "--check") {
      const result = checkNativeReviewInventory({ projectRoot: ROOT, releaseTarget });
      if (!result.ok) {
        console.error(`native-review inventory: BLOCKED\n${formatIssues(result.issues)}`);
        process.exitCode = 1;
      } else {
        console.log("native-review inventory: PASS (24/24 files; exact candidate and workflow blob; human reviews unchanged)");
      }
    } else {
      console.error("usage: node scripts/native-review-inventory.mjs --generate|--check");
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`native-review inventory: BLOCKED (${safeCliErrorMessage(error)})`);
    process.exitCode = 1;
  }
}
