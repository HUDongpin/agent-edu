import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  closeSync,
  constants as fsConstants,
  copyFileSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { access } from "node:fs/promises";
import { basename, delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const PROJECT_ID = "course20-synthetic-practicum-v2";
export const PROJECT_SPEC_ID = "course20-verified-cut-v2";
export const COURSE_VERSION = "1.2.0";
export const FRAME_RATE = "30/1";
export const SOURCE_DURATION_SECONDS = 122;
export const SOURCE_DURATION_FRAMES = 3660;
export const EXPECTED_OUTPUT_SECONDS = 47;
export const EXPECTED_OUTPUT_FRAMES = 1410;
export const FAULT_DURATION_SECONDS = 6;
export const SAFE_SEGMENT_IDS = ["hook", "context", "method", "close"];
export const QUARANTINED_SEGMENT_ID = "external-archive-unknown-rights";

export const EXAMPLES_ROOT = dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_ROOT = resolve(EXAMPLES_ROOT, "../..");
export const PUBLIC_ROOT = join(REPOSITORY_ROOT, "staging/course-assets/agentic-video-editing");
export const PUBLIC_LAB_ROOT = join(PUBLIC_ROOT, "lab");
export const RUNS_ROOT = join(REPOSITORY_ROOT, "tmp/agentic-video-editing-lab");
export const EDIT_PLAN_SCHEMA_PATH = join(PUBLIC_ROOT, "edit-plan-v3.schema.json");
export const FIXTURE_EDIT_PLAN_SCHEMA_PATH = join(PUBLIC_LAB_ROOT, "edit-plan-v3-fixture.schema.json");
export const PROJECT_SPEC_PATH = join(PUBLIC_LAB_ROOT, "project-spec.v2.json");
export const SEGMENT_MAP_PATH = join(PUBLIC_LAB_ROOT, "segment-map.v2.json");
export const TOOL_POLICY_PATH = join(PUBLIC_LAB_ROOT, "tool-policy.v1.json");
export const DELIVERY_CONTRACT_PATH = join(PUBLIC_LAB_ROOT, "delivery-contract.v1.json");
export const GOLDEN_EXPECTATIONS_PATH = join(PUBLIC_LAB_ROOT, "golden-structural-expectations.v1.json");
export const FAILURE_LEDGER_PATH = join(PUBLIC_LAB_ROOT, "failure-ledger.v1.json");
export const NEGATIVE_FIXTURES_PATH = join(PUBLIC_LAB_ROOT, "negative-fixtures.v1.json");
export const UNTRUSTED_CONTENT_PATH = join(PUBLIC_LAB_ROOT, "untrusted-content-fixtures.v1.json");
export const ARTIFACT_GRAPH_PATH = join(PUBLIC_LAB_ROOT, "expected-artifact-graph.v1.json");
export const CAPTION_PATH = join(PUBLIC_LAB_ROOT, "course20-review-candidate.en.vtt");
export const FAULT_CAPTION_PATH = join(PUBLIC_LAB_ROOT, "course20-fault-reel.en.vtt");
export const FIXTURE_MANIFEST_PATH = join(PUBLIC_LAB_ROOT, "fixture-manifest.v1.json");
export const FROZEN_RECEIPT_PATH = join(PUBLIC_LAB_ROOT, "frozen-media-receipt.v1.json");
export const FROZEN_MEDIA_ROOT = join(PUBLIC_LAB_ROOT, "frozen");

export const RUN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/u;
export const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const WORKSPACE_DIRECTORIES = ["source", "probe", "evidence", "plan", "render", "receipts", "rollback"];
const REMOTE_PROTOCOL = /(?:https?|ftp|ftps|rtmp|rtmps|rtsp|tcp|udp|srt|ssh):\/\//iu;
const NETWORK_OPTIONS = new Set(["-listen", "-method", "-headers", "-user_agent", "-cookies", "-auth_type"]);
const ALLOWED_EXECUTABLES = new Set(["ffmpeg", "ffprobe"]);

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function createRunId(prefix = "course20") {
  const stamp = new Date().toISOString().replace(/\D/gu, "").slice(0, 14);
  return `${prefix}-${stamp}-${randomBytes(4).toString("hex")}`;
}

export function parseCliArguments(argv = process.argv.slice(2), { allowAutomaticRunId = false } = {}) {
  const options = { plan: false, json: false, runId: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--plan") options.plan = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--run-id") {
      options.runId = argv[index + 1];
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  assert(!(options.plan && options.runId), "Choose --plan or --run-id, not both.");
  if (!options.plan && !options.runId && allowAutomaticRunId) options.runId = createRunId();
  assert(options.plan || Boolean(options.runId), "Use --plan or --run-id <id>.");
  if (options.runId) assert(RUN_ID_PATTERN.test(options.runId), "run-id must contain 3-64 lowercase letters, digits, or hyphens");
  return options;
}

export function isPathContained(root, candidate) {
  const delta = relative(resolve(root), resolve(candidate));
  return delta === "" || (delta !== ".." && !delta.startsWith(`..${sep}`) && !isAbsolute(delta));
}

function assertNoSymlinkBetween(root, candidate, { candidateMayBeMissing = false } = {}) {
  const absoluteRoot = resolve(root);
  const absoluteCandidate = resolve(candidate);
  assert(isPathContained(absoluteRoot, absoluteCandidate), `Path escapes controlled root: ${candidate}`);
  const rootStat = lstatSync(absoluteRoot);
  assert(!rootStat.isSymbolicLink(), `Symbolic-link root is forbidden: ${absoluteRoot}`);
  let cursor = absoluteRoot;
  for (const component of relative(absoluteRoot, absoluteCandidate).split(sep).filter(Boolean)) {
    cursor = join(cursor, component);
    try {
      const stat = lstatSync(cursor);
      assert(!stat.isSymbolicLink(), `Symbolic links are forbidden in lab paths: ${cursor}`);
    } catch (error) {
      if (candidateMayBeMissing && error?.code === "ENOENT") return;
      throw error;
    }
  }
}

export function assertExistingPathContained(root, candidate, kind = "file") {
  assertNoSymlinkBetween(root, candidate);
  const realRoot = realpathSync(root);
  const realCandidate = realpathSync(candidate);
  assert(isPathContained(realRoot, realCandidate), `Real path escapes controlled root: ${candidate}`);
  const stat = statSync(realCandidate);
  assert(kind === "directory" ? stat.isDirectory() : stat.isFile(), `Expected ${kind}: ${candidate}`);
  return realCandidate;
}

export function assertNewFilePathContained(root, candidate) {
  assert(isPathContained(root, candidate), `Output escapes controlled root: ${candidate}`);
  assertExistingPathContained(root, dirname(candidate), "directory");
  assertNoSymlinkBetween(root, candidate, { candidateMayBeMissing: true });
  return resolve(candidate);
}

export function createWorkspace(runId) {
  assert(RUN_ID_PATTERN.test(runId), "Invalid run-id.");
  mkdirSync(join(REPOSITORY_ROOT, "tmp"), { recursive: true, mode: 0o700 });
  assertNoSymlinkBetween(REPOSITORY_ROOT, join(REPOSITORY_ROOT, "tmp"));
  mkdirSync(RUNS_ROOT, { recursive: true, mode: 0o700 });
  assertNoSymlinkBetween(REPOSITORY_ROOT, RUNS_ROOT);
  const workspace = join(RUNS_ROOT, runId);
  mkdirSync(workspace, { recursive: false, mode: 0o700 });
  for (const directory of WORKSPACE_DIRECTORIES) mkdirSync(join(workspace, directory), { recursive: false, mode: 0o700 });
  mkdirSync(join(workspace, "rollback/quarantine"), { recursive: false, mode: 0o700 });
  return realpathSync(workspace);
}

export function loadWorkspace(runId) {
  assert(RUN_ID_PATTERN.test(runId), "Invalid run-id.");
  return assertExistingPathContained(RUNS_ROOT, join(RUNS_ROOT, runId), "directory");
}

export function writeFileExclusive(path, content, root) {
  const safePath = assertNewFilePathContained(root, path);
  const descriptor = openSync(safePath, fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY, 0o600);
  try {
    writeFileSync(descriptor, content);
  } finally {
    closeSync(descriptor);
  }
  return safePath;
}

export function writeJsonExclusive(path, value, root) {
  return writeFileExclusive(path, `${JSON.stringify(value, null, 2)}\n`, root);
}

export function copyFileExclusive(source, destination, destinationRoot, sourceRoot = PUBLIC_LAB_ROOT) {
  const safeSource = assertExistingPathContained(sourceRoot, source);
  const safeDestination = assertNewFilePathContained(destinationRoot, destination);
  copyFileSync(safeSource, safeDestination, fsConstants.COPYFILE_EXCL);
  return safeDestination;
}

export function moveFileExclusive(source, destination, root) {
  const safeSource = assertExistingPathContained(root, source);
  const safeDestination = assertNewFilePathContained(root, destination);
  const reservation = openSync(safeDestination, fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY, 0o600);
  closeSync(reservation);
  // The reservation proves that the destination did not exist. The workspace is unique
  // to this run, so removing only that zero-byte reservation cannot affect user media.
  unlinkSync(safeDestination);
  renameSync(safeSource, safeDestination);
  return safeDestination;
}

export function markReadOnly(path, root) {
  const safePath = assertExistingPathContained(root, path);
  chmodSync(safePath, 0o400);
  return safePath;
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256File(path, root = REPOSITORY_ROOT) {
  return sha256Bytes(readFileSync(assertExistingPathContained(root, path)));
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalSha256(value) {
  return sha256Bytes(JSON.stringify(canonicalize(value)));
}

export function readJsonFile(path, root = REPOSITORY_ROOT) {
  return JSON.parse(readFileSync(assertExistingPathContained(root, path), "utf8"));
}

export function readUtf8File(path, root = REPOSITORY_ROOT) {
  return readFileSync(assertExistingPathContained(root, path), "utf8");
}

export function workspaceRelativePath(workspace, path) {
  assertExistingPathContained(workspace, path);
  return relative(workspace, path).split(sep).join("/");
}

export function sanitizeArguments(args, workspace) {
  return args.map((argument) => argument
    .replaceAll(workspace, "$WORKSPACE")
    .replaceAll(REPOSITORY_ROOT, "$REPOSITORY"));
}

export function assertOfflineArguments(args) {
  assert(Array.isArray(args) && args.every((argument) => typeof argument === "string"), "Process arguments must be strings.");
  for (const argument of args) {
    assert(!argument.includes("\0"), "NUL bytes are forbidden in process arguments.");
    assert(!REMOTE_PROTOCOL.test(argument), `Remote protocol is forbidden: ${argument}`);
    assert(!NETWORK_OPTIONS.has(argument.toLowerCase()), `Network-capable option is forbidden: ${argument}`);
  }
}

async function resolveExecutable(name) {
  assert(ALLOWED_EXECUTABLES.has(name), `Executable is not allow-listed: ${name}`);
  for (const directory of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
    const candidate = join(directory, name);
    try {
      await access(candidate, fsConstants.X_OK);
      const real = realpathSync(candidate);
      assert(isAbsolute(real) && basename(real) === name, `${name} must resolve to an absolute executable with the expected basename.`);
      return real;
    } catch {
      // Continue without invoking a shell or accepting a caller-provided executable.
    }
  }
  throw new Error(`${name} is unavailable; full media execution is blocked.`);
}

export async function resolveMediaTools() {
  return { ffmpeg: await resolveExecutable("ffmpeg"), ffprobe: await resolveExecutable("ffprobe") };
}

function safeEnvironment() {
  const environment = { LANG: "C", LC_ALL: "C", AV_LOG_FORCE_NOCOLOR: "1" };
  if (process.env.PATH) environment.PATH = process.env.PATH;
  return environment;
}

export async function spawnMediaTool(command, args, { cwd, timeoutSeconds = 180, allowFailure = false } = {}) {
  const realCommand = realpathSync(command);
  assert(isAbsolute(realCommand) && ALLOWED_EXECUTABLES.has(basename(realCommand)), "Only resolved FFmpeg or ffprobe may execute.");
  assertOfflineArguments(args);
  const safeCwd = assertExistingPathContained(REPOSITORY_ROOT, cwd ?? REPOSITORY_ROOT, "directory");
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(realCommand, args, {
      cwd: safeCwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      env: safeEnvironment(),
    });
    let stdout = "";
    let stderr = "";
    // The six-second VFR fixture stays small, but leave room for a complete
    // ffprobe JSON document so bounded capture cannot create invalid JSON.
    const captureLimit = 16 * 1024 * 1024;
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { if (stdout.length < captureLimit) stdout += chunk; });
    child.stderr.on("data", (chunk) => { if (stderr.length < captureLimit) stderr += chunk; });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      rejectPromise(new Error(`Media process timed out after ${timeoutSeconds}s.`));
    }, timeoutSeconds * 1000);
    child.once("error", (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      const result = { code, signal, stdout, stderr };
      if (code !== 0 && !allowFailure) {
        rejectPromise(new Error(`Media process failed (code=${code}, signal=${signal ?? "none"}): ${stderr.slice(-4_000)}`));
      } else resolvePromise(result);
    });
  });
}

export function executableSummary(output) {
  return output.split(/\r?\n/u).filter(Boolean).slice(0, 3);
}

export function findStream(probe, type) {
  return (probe.streams ?? []).find((candidate) => candidate.codec_type === type);
}

export function mediaDurationSeconds(probe) {
  const formatDuration = Number(probe.format?.duration);
  if (Number.isFinite(formatDuration)) return formatDuration;
  const durations = (probe.streams ?? []).map((stream) => Number(stream.duration)).filter(Number.isFinite);
  return durations.length ? Math.max(...durations) : Number.NaN;
}

export async function probeMedia({ ffprobe, workspace, mediaPath, receiptBaseName, showFrames = false }) {
  assertExistingPathContained(workspace, mediaPath);
  const args = [
    "-v", "error",
    "-show_format",
    "-show_streams",
    ...(showFrames ? ["-select_streams", "v:0", "-show_entries", "frame=pts_time,pkt_duration_time", "-show_frames"] : []),
    "-of", "json",
    mediaPath,
  ];
  const result = await spawnMediaTool(ffprobe, args, { cwd: workspace, timeoutSeconds: 60 });
  const probe = JSON.parse(result.stdout);
  const path = join(workspace, "probe", `${receiptBaseName}.ffprobe.json`);
  writeJsonExclusive(path, probe, workspace);
  return { probe, path, sha256: sha256File(path, workspace), arguments: sanitizeArguments(args, workspace) };
}

export function validateJsonSchema(schemaPath, value) {
  const schema = readJsonFile(schemaPath, PUBLIC_ROOT);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  assert(validate(value), `Schema validation failed: ${ajv.errorsText(validate.errors)}`);
}

export function parseWebVtt(text) {
  const timestamp = (value) => {
    const match = value.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/u);
    assert(match, `Invalid WebVTT timestamp: ${value}`);
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
  };
  const cues = [];
  const lines = text.replace(/\r/gu, "").split("\n");
  assert(lines[0] === "WEBVTT", "Caption sidecar must begin with WEBVTT.");
  for (let index = 1; index < lines.length; index += 1) {
    if (!lines[index].includes(" --> ")) continue;
    const [startText, right] = lines[index].split(" --> ");
    const [endText, ...settings] = right.split(/\s+/u);
    const body = [];
    while (lines[index + 1]?.trim()) body.push(lines[index += 1]);
    cues.push({ start: timestamp(startText), end: timestamp(endText), settings, text: body.join("\n") });
  }
  return cues;
}

export function buildReceiptBase(stage, runId, workspace) {
  return {
    schemaVersion: `aicourse.agentic-video-editing.${stage}-receipt.v1`,
    projectSpecId: PROJECT_SPEC_ID,
    projectId: PROJECT_ID,
    courseVersion: COURSE_VERSION,
    runId,
    stage,
    workspace: typeof workspace === "string" && workspace !== "contract-only"
      ? relative(REPOSITORY_ROOT, workspace).split(sep).join("/")
      : "contract-only",
    localOnly: true,
    shellUsed: false,
    networkRequestCount: 0,
    credentialsAccepted: false,
    paidApiCallCount: 0,
    overwriteAllowed: false,
    publicationActionCount: 0,
    finalPublicationDecision: "do-not-publish",
  };
}

export function loadRequiredReceipt(workspace, stage) {
  const path = join(workspace, `receipts/${stage}.receipt.json`);
  const receipt = readJsonFile(path, workspace);
  assert(receipt.projectSpecId === PROJECT_SPEC_ID && receipt.runId === basename(workspace), `${stage} receipt identity mismatch.`);
  return { path, receipt, sha256: sha256File(path, workspace) };
}

export function loadPublicContracts({ allowMissingFrozen = false } = {}) {
  const contracts = {
    projectSpec: readJsonFile(PROJECT_SPEC_PATH),
    segmentMap: readJsonFile(SEGMENT_MAP_PATH),
    toolPolicy: readJsonFile(TOOL_POLICY_PATH),
    deliveryContract: readJsonFile(DELIVERY_CONTRACT_PATH),
    golden: readJsonFile(GOLDEN_EXPECTATIONS_PATH),
    failureLedger: readJsonFile(FAILURE_LEDGER_PATH),
    negativeFixtures: readJsonFile(NEGATIVE_FIXTURES_PATH),
    untrustedContent: readJsonFile(UNTRUSTED_CONTENT_PATH),
    artifactGraph: readJsonFile(ARTIFACT_GRAPH_PATH),
    captions: readUtf8File(CAPTION_PATH),
    faultCaptions: readUtf8File(FAULT_CAPTION_PATH),
    fixtureManifest: null,
    frozenReceipt: null,
  };
  try {
    contracts.fixtureManifest = readJsonFile(FIXTURE_MANIFEST_PATH);
    contracts.frozenReceipt = readJsonFile(FROZEN_RECEIPT_PATH);
  } catch (error) {
    if (!allowMissingFrozen || error?.code !== "ENOENT") throw error;
  }
  return contracts;
}

export function validatePublicContracts(contracts, { requireFrozen = true } = {}) {
  const failures = [];
  const add = (condition, message) => { if (!condition) failures.push(message); };
  const records = [
    contracts.projectSpec,
    contracts.segmentMap,
    contracts.toolPolicy,
    contracts.deliveryContract,
    contracts.golden,
    contracts.failureLedger,
    contracts.negativeFixtures,
    contracts.untrustedContent,
    contracts.artifactGraph,
  ];
  add(records.every((record) => record.projectSpecId === PROJECT_SPEC_ID), "Public contracts must share projectSpecId v2.");
  add(contracts.projectSpec.projectId === PROJECT_ID, "Project ID drifted.");
  add(contracts.projectSpec.courseVersion === COURSE_VERSION, `Project courseVersion must be ${COURSE_VERSION}.`);
  add(contracts.projectSpec.sourceRecipe.durationSeconds === SOURCE_DURATION_SECONDS,
    `Synthetic source must remain ${SOURCE_DURATION_SECONDS} seconds.`);
  add(contracts.projectSpec.sourceRecipe.canvas.width / contracts.projectSpec.sourceRecipe.canvas.height === 16 / 9,
    "Synthetic source must remain 16:9.");
  add(contracts.projectSpec.processing.networkAllowed === false
    && contracts.projectSpec.processing.shellAllowed === false
    && contracts.projectSpec.processing.overwriteAllowed === false, "Project processing boundary weakened.");
  add(contracts.toolPolicy.executables.shell === false
    && contracts.toolPolicy.network.allowed === false
    && contracts.toolPolicy.publication.allowed === false
    && contracts.toolPolicy.filesystem.nodeExclusiveCreate === true
    && contracts.toolPolicy.filesystem.followSymbolicLinks === false, "Tool policy weakened.");
  add(contracts.deliveryContract.candidate.frameRate === FRAME_RATE
    && contracts.deliveryContract.candidate.durationSeconds === EXPECTED_OUTPUT_SECONDS
    && contracts.deliveryContract.candidate.width === 1080
    && contracts.deliveryContract.candidate.height === 1920
    && contracts.deliveryContract.candidate.audioSampleRateHz === 48000
    && contracts.deliveryContract.approval.publicationDecision === "do-not-publish", "Delivery contract drifted.");
  const selected = contracts.segmentMap.canonicalSelectedSegmentIds;
  add(JSON.stringify(selected) === JSON.stringify(SAFE_SEGMENT_IDS), "Canonical segment order drifted.");
  add(contracts.segmentMap.quarantinedSegmentIds.includes(QUARANTINED_SEGMENT_ID), "Unknown-rights segment is no longer quarantined.");
  const faultCodes = new Set(contracts.failureLedger.faults.map((fault) => fault.expectedBlockCode));
  add(contracts.golden.requiredFaultBlockCodes.every((code) => faultCodes.has(code)), "Failure ledger does not cover every required audiovisual fault.");
  const negativeCodes = new Set(contracts.negativeFixtures.fixtures.map((fixture) => fixture.expectedBlockCode));
  add([...faultCodes].every((code) => negativeCodes.has(code)), "Negative fixtures do not cover every failure-ledger block code.");
  const nodes = contracts.artifactGraph.nodes;
  const seen = new Set();
  for (const node of nodes) {
    add(!seen.has(node.id), `Duplicate artifact-graph node: ${node.id}`);
    add(node.dependsOn.every((dependency) => seen.has(dependency)), `${node.id} has a missing or forward dependency.`);
    seen.add(node.id);
  }
  try {
    const cues = parseWebVtt(contracts.captions);
    add(cues.length === 4
      && cues[0]?.start === 0 && cues[0]?.end === 8
      && cues[1]?.start === 8 && cues[1]?.end === 20
      && cues[2]?.start === 20 && cues[2]?.end === 34
      && cues[3]?.start === 34 && cues[3]?.end === 47,
    "Canonical captions must cover the four reviewed segments without overlap.");
  } catch (error) {
    failures.push(`Canonical captions invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (requireFrozen) {
    add(Boolean(contracts.fixtureManifest), "Fixture hash manifest is missing.");
    add(Boolean(contracts.frozenReceipt), "Frozen media receipt is missing.");
    add(contracts.frozenReceipt?.courseVersion === COURSE_VERSION,
      `Frozen media receipt courseVersion must be ${COURSE_VERSION}.`);
  }
  return failures;
}

const GLYPHS = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  ":": ["0", "1", "0", "0", "1", "0", "0"],
  "-": ["000", "000", "000", "111", "000", "000", "000"],
  "0": ["111", "101", "101", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "010", "010", "111"],
  "2": ["111", "001", "001", "111", "100", "100", "111"],
  "3": ["111", "001", "001", "111", "001", "001", "111"],
  "4": ["101", "101", "101", "111", "001", "001", "001"],
  "5": ["111", "100", "100", "111", "001", "001", "111"],
  "6": ["111", "100", "100", "111", "101", "101", "111"],
  "7": ["111", "001", "001", "010", "010", "010", "010"],
  "8": ["111", "101", "101", "111", "101", "101", "111"],
  "9": ["111", "101", "101", "111", "001", "001", "111"],
  A: ["010", "101", "101", "111", "101", "101", "101"],
  C: ["111", "100", "100", "100", "100", "100", "111"],
  E: ["111", "100", "100", "110", "100", "100", "111"],
  L: ["100", "100", "100", "100", "100", "100", "111"],
  N: ["101", "111", "111", "111", "111", "111", "101"],
  O: ["111", "101", "101", "101", "101", "101", "111"],
  R: ["110", "101", "101", "110", "101", "101", "101"],
  S: ["111", "100", "100", "111", "001", "001", "111"],
  U: ["101", "101", "101", "101", "101", "101", "111"],
  Y: ["101", "101", "101", "010", "010", "010", "010"],
};

function setPixel(buffer, width, height, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = (y * width + x) * 3;
  buffer[offset] = color[0];
  buffer[offset + 1] = color[1];
  buffer[offset + 2] = color[2];
}

function fillRect(buffer, width, height, x, y, boxWidth, boxHeight, color) {
  for (let py = y; py < y + boxHeight; py += 1) {
    for (let px = x; px < x + boxWidth; px += 1) setPixel(buffer, width, height, px, py, color);
  }
}

function strokeRect(buffer, width, height, x, y, boxWidth, boxHeight, color, thickness = 1) {
  fillRect(buffer, width, height, x, y, boxWidth, thickness, color);
  fillRect(buffer, width, height, x, y + boxHeight - thickness, boxWidth, thickness, color);
  fillRect(buffer, width, height, x, y, thickness, boxHeight, color);
  fillRect(buffer, width, height, x + boxWidth - thickness, y, thickness, boxHeight, color);
}

function drawText(buffer, width, height, text, x, y, color, scale = 2) {
  let cursor = x;
  for (const character of text.toUpperCase()) {
    const glyph = GLYPHS[character] ?? GLYPHS[" "];
    const glyphWidth = Math.max(...glyph.map((row) => row.length));
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyph[row].length; column += 1) {
        if (glyph[row][column] === "1") fillRect(buffer, width, height, cursor + column * scale, y + row * scale, scale, scale, color);
      }
    }
    cursor += (glyphWidth + 1) * scale;
  }
}

export function renderSyntheticPpm({ second, fault = false, width = 320, height = 180 }) {
  const background = fault && second === 1 ? [245, 245, 245]
    : fault && second === 2 ? [125, 125, 125]
      : [18 + second * 7, 42 + second * 4, 76 + second * 5];
  const pixels = Buffer.alloc(width * height * 3);
  for (let offset = 0; offset < pixels.length; offset += 3) {
    pixels[offset] = background[0];
    pixels[offset + 1] = background[1];
    pixels[offset + 2] = background[2];
  }
  const grid = fault && second === 2 ? [132, 132, 132] : [55, 98, 130];
  for (let x = 0; x < width; x += 32) fillRect(pixels, width, height, x, 0, 1, height, grid);
  for (let y = 0; y < height; y += 30) fillRect(pixels, width, height, 0, y, width, 1, grid);
  strokeRect(pixels, width, height, 26, 18, 268, 144, fault && second === 0 ? [220, 30, 30] : [252, 163, 17], 2);
  fillRect(pixels, width, height, 0, 70, 8, 40, [220, 40, 40]);
  fillRect(pixels, width, height, width - 8, 70, 8, 40, [40, 220, 90]);
  const textColor = fault && second === 2 ? [132, 132, 132] : [245, 245, 245];
  drawText(pixels, width, height, "COURSE 20", 102, 26, textColor, 2);
  drawText(pixels, width, height, `00:00:0${second}`, 108, 50, textColor, 2);
  drawText(pixels, width, height, "LOCAL ONLY", 106, 146, textColor, 1);
  fillRect(pixels, width, height, 42 + second * 36, 105, 28, 20, [62, 201, 160]);
  if (fault && second === 4) fillRect(pixels, width, height, 140, 72, 40, 40, [255, 255, 255]);
  const header = Buffer.from(`P6\n${width} ${height}\n255\n`, "ascii");
  return Buffer.concat([header, pixels]);
}

export function writePpmSequence(
  workspace,
  directoryName,
  { fault = false, durationSeconds = SOURCE_DURATION_SECONDS } = {},
) {
  const directory = join(workspace, "source", directoryName);
  assertNewFilePathContained(workspace, join(workspace, "source", `${directoryName}.sentinel`));
  mkdirSync(directory, { recursive: false, mode: 0o700 });
  const paths = [];
  for (let second = 0; second < durationSeconds; second += 1) {
    const path = join(directory, `frame-${String(second).padStart(2, "0")}.ppm`);
    writeFileExclusive(path, renderSyntheticPpm({ second, fault }), workspace);
    paths.push(path);
  }
  return { directory, paths };
}

export function validateFixtureManifest(manifest) {
  const failures = [];
  if (!manifest || manifest.schemaVersion !== "aicourse.agentic-video-editing.fixture-manifest.v1") {
    return ["Fixture manifest schema is missing or invalid."];
  }
  const seen = new Set();
  for (const record of manifest.files ?? []) {
    if (seen.has(record.path)) failures.push(`Duplicate fixture-manifest path: ${record.path}`);
    seen.add(record.path);
    const path = join(PUBLIC_ROOT, record.path);
    try {
      const observed = sha256File(path, PUBLIC_ROOT);
      if (observed !== record.sha256) failures.push(`${record.path}: expected ${record.sha256}, observed ${observed}`);
    } catch (error) {
      failures.push(`${record.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (!(manifest.files ?? []).length) failures.push("Fixture manifest must bind at least one file.");
  return failures;
}

export function buildPlanOnlyReceipt() {
  const contracts = loadPublicContracts();
  const failures = validatePublicContracts(contracts);
  assert(!failures.length, `Public lab contract failed: ${failures.join("; ")}`);
  return {
    ...buildReceiptBase("plan-only", "contract-only", "contract-only"),
    status: "pass-no-media-executed",
    mediaToolsRequired: false,
    contracts: {
      projectSpecSha256: sha256File(PROJECT_SPEC_PATH),
      segmentMapSha256: sha256File(SEGMENT_MAP_PATH),
      deliveryContractSha256: sha256File(DELIVERY_CONTRACT_PATH),
      toolPolicySha256: sha256File(TOOL_POLICY_PATH),
      editPlanSchemaSha256: sha256File(EDIT_PLAN_SCHEMA_PATH),
      fixtureEditPlanSchemaSha256: sha256File(FIXTURE_EDIT_PLAN_SCHEMA_PATH),
    },
    expectedArtifactGraph: contracts.artifactGraph,
    stopCondition: "If FFmpeg or ffprobe is unavailable, retain a blocked preflight receipt and do not claim media success.",
    boundary: "Static contract and dependency validation only; no audiovisual artifact was generated or verified.",
    finalPublicationDecision: "do-not-publish",
  };
}
