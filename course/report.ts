/**
 * Local Course 3 evidence report:  npx tsx course/report.ts
 *
 * progress.json is an evidence cache, not a completion credential. Every read
 * and write is reconstructed through a stage-specific allowlist so malformed
 * or secret-bearing local data cannot become a report claim.
 */
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const COURSE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(COURSE_DIR, "..");
const FILE = resolve(COURSE_DIR, "progress.json");
const PAIRING_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ARTIFACTS = 64;
const MAX_ARTIFACT_BYTES = 5 * 1024 * 1024;
const MAX_SCOPE_BYTES = 20 * 1024 * 1024;

const PROVIDERS = ["deepseek", "anthropic"] as const;
const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
const STAGE9_STATES = ["not-started", "artifact-assembled", "self-reviewed"] as const;

type Provider = typeof PROVIDERS[number];
type Effort = typeof EFFORTS[number];
export type Stage9State = typeof STAGE9_STATES[number];

export interface ExecutionContext {
  schemaVersion: 1;
  mode: "offline" | "live";
  network: "not-attempted" | "response-received";
  provider?: Provider;
  model?: string;
  effort?: Effort;
  evalIdentity: string;
  sourceIdentity: string;
  recordedAt: string;
  runId: string;
}

export interface Entry {
  [key: string]: unknown;
  context?: ExecutionContext;
  bestContext?: ExecutionContext;
  score?: number;
  bestScore?: number;
  scoreTotal?: number;
  bestScoreTotal?: number;
  baselineRunId?: string;
  state?: Stage9State;
  stateRecordedAt?: string;
  scopePaths?: string[];
  scopeDigest?: string;
  scopeCount?: number;
  scopeRecordedAt?: string;
  reviewRecordedAt?: string;
}

export type Data = Record<string, Entry>;
type MetricValues = Record<string, number | boolean>;

interface ExecutionContextOptions {
  offline: boolean;
  provider?: string;
  model?: string;
  effort?: string;
  networkResponseReceived: boolean;
  sourceIdentity?: string;
  evalIdentity?: string;
  recordedAt?: string;
  runId?: string;
}

interface Stage9RecordOptions {
  artifacts?: string[];
  file?: string;
  root?: string;
  recordedAt?: string;
}

interface FormatOptions {
  root?: string;
}

export interface Stage9Command {
  state: Stage9State;
  artifacts: string[];
}

interface ArtifactScope {
  paths: string[];
  digest: string;
  count: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function digestFiles(paths: string[]): string {
  const hash = createHash("sha256");
  for (const path of paths) {
    hash.update(relative(ROOT_DIR, path).split(sep).join("/"));
    hash.update("\0");
    try {
      hash.update(readFileSync(path));
    } catch {
      hash.update("missing");
    }
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

function currentEvalIdentity(): string {
  return digestFiles([
    resolve(COURSE_DIR, "cafe/evalset.ts"),
    resolve(ROOT_DIR, "lib/cafe/evalset.ts"),
    resolve(ROOT_DIR, "lib/cafe/menu.ts"),
  ]);
}

function currentSourceIdentity(): string {
  // Learner-edited stage files are intentionally outside this shared-source
  // identity. Matching hashes support configuration-matched pairing, not cause.
  return digestFiles([
    resolve(ROOT_DIR, "package.json"),
    resolve(ROOT_DIR, "package-lock.json"),
    resolve(COURSE_DIR, "check.ts"),
    resolve(COURSE_DIR, "report.ts"),
    resolve(COURSE_DIR, "cafe/llm.ts"),
    resolve(COURSE_DIR, "cafe/menu.ts"),
    resolve(ROOT_DIR, "lib/cafe/menu.ts"),
  ]);
}

function looksLikeSecret(value: string): boolean {
  const trimmed = value.trim();
  if (/(?:^|[^A-Za-z0-9])sk[-_][A-Za-z0-9_-]{8,}/i.test(trimmed)) return true;
  if (/(?:^|[^A-Za-z0-9])gh[pousr]_[A-Za-z0-9]{12,}/i.test(trimmed)) return true;
  if (/(?:^|[^A-Za-z0-9])AKIA[A-Z0-9]{16}(?:$|[^A-Z0-9])/.test(trimmed)) return true;
  if (/(?:^|[^A-Za-z0-9])AIza[A-Za-z0-9_-]{20,}/.test(trimmed)) return true;
  if (/(?:^|[^A-Za-z0-9])(?:gsk_|xai-)[A-Za-z0-9_-]{12,}/i.test(trimmed)) return true;
  if (/\bBearer\s+\S{8,}/i.test(trimmed)) return true;
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(trimmed)) return true;
  if (/^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}$/.test(trimmed)) return true;

  const token = trimmed.match(/[A-Za-z0-9+/=_-]{40,}/)?.[0];
  if (!token) return false;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/].filter((pattern) => pattern.test(token)).length;
  return classes >= 3 && new Set(token).size >= 16;
}

function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/.test(trimmed)) return undefined;
  return looksLikeSecret(trimmed) ? undefined : trimmed;
}

function safeProvider(value: unknown): Provider | undefined {
  return typeof value === "string" && PROVIDERS.includes(value as Provider)
    ? value as Provider
    : undefined;
}

function safeEffort(value: unknown): Effort | undefined {
  return typeof value === "string" && EFFORTS.includes(value as Effort)
    ? value as Effort
    : undefined;
}

function safeTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length !== 24) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) return undefined;
  const year = parsed.getUTCFullYear();
  return year >= 2000 && year <= 2100 ? value : undefined;
}

function safeDigest(value: unknown): string | undefined {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value)
    ? value
    : undefined;
}

function safeInteger(value: unknown, minimum = 0, maximum = 1_000_000): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) &&
      value >= minimum && value <= maximum ? value : undefined;
}

function safeMoney(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000
    ? value
    : undefined;
}

function sanitizeContext(value: unknown): ExecutionContext | undefined {
  if (!isPlainObject(value) || value.schemaVersion !== 1) return undefined;
  if (value.mode !== "offline" && value.mode !== "live") return undefined;
  if (value.network !== "not-attempted" && value.network !== "response-received") return undefined;
  if (value.mode === "offline" && value.network !== "not-attempted") return undefined;

  const evalIdentity = safeDigest(value.evalIdentity);
  const sourceIdentity = safeDigest(value.sourceIdentity);
  const runId = safeIdentifier(value.runId);
  const recordedAt = safeTimestamp(value.recordedAt);
  if (!evalIdentity || !sourceIdentity || !runId || !recordedAt) return undefined;

  const context: ExecutionContext = {
    schemaVersion: 1,
    mode: value.mode,
    network: value.network,
    evalIdentity,
    sourceIdentity,
    recordedAt,
    runId,
  };
  if (value.mode === "live") {
    const provider = safeProvider(value.provider);
    const model = safeIdentifier(value.model);
    const effort = safeEffort(value.effort);
    if (provider) context.provider = provider;
    if (model) context.model = model;
    if (effort) context.effort = effort;
  }
  return context;
}

/** Build the only public execution metadata progress.json may retain. */
export function createExecutionContext(options: ExecutionContextOptions): ExecutionContext {
  const mode = options.offline ? "offline" : "live";
  const context: ExecutionContext = {
    schemaVersion: 1,
    mode,
    network: options.offline ? "not-attempted" :
      (options.networkResponseReceived ? "response-received" : "not-attempted"),
    evalIdentity: safeDigest(options.evalIdentity) ?? currentEvalIdentity(),
    sourceIdentity: safeDigest(options.sourceIdentity) ?? currentSourceIdentity(),
    recordedAt: safeTimestamp(options.recordedAt) ?? new Date().toISOString(),
    runId: safeIdentifier(options.runId) ?? randomUUID(),
  };
  if (mode === "live") {
    const provider = safeProvider(options.provider);
    const model = safeIdentifier(options.model);
    const effort = safeEffort(options.effort);
    if (provider) context.provider = provider;
    if (model) context.model = model;
    if (effort) context.effort = effort;
  }
  return context;
}

function copyContext(raw: Record<string, unknown>, key: "context" | "bestContext", out: Entry): void {
  const context = sanitizeContext(raw[key]);
  if (context) out[key] = context;
}

function normalizeScoreEntry(raw: Record<string, unknown>, stage: 3 | 4): Entry {
  const out: Entry = {};
  const score = safeInteger(raw.score);
  const total = safeInteger(raw.scoreTotal, 1);
  const best = safeInteger(raw.bestScore);
  const bestTotal = safeInteger(raw.bestScoreTotal, 1);
  if (score !== undefined && (total === undefined || score <= total)) out.score = score;
  if (total !== undefined) out.scoreTotal = total;
  if (best !== undefined && (bestTotal === undefined || best <= bestTotal)) out.bestScore = best;
  if (bestTotal !== undefined) out.bestScoreTotal = bestTotal;
  copyContext(raw, "context", out);
  copyContext(raw, "bestContext", out);
  if (stage === 4) {
    const baselineRunId = safeIdentifier(raw.baselineRunId);
    if (baselineRunId) out.baselineRunId = baselineRunId;
  }
  return out;
}

function safeStoredPath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length < 1 || value.length > 240) return undefined;
  if (isAbsolute(value) || value.includes("\\") || /[\0\r\n]/.test(value)) return undefined;
  const segments = value.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return undefined;
  if (looksLikeSecret(value) || value === "course/progress.json") return undefined;
  return value;
}

function normalizeStage9(raw: Record<string, unknown>): Entry {
  const out: Entry = {};
  if (typeof raw.state === "string" && STAGE9_STATES.includes(raw.state as Stage9State)) {
    out.state = raw.state as Stage9State;
  }
  const stateRecordedAt = safeTimestamp(raw.stateRecordedAt);
  if (stateRecordedAt) out.stateRecordedAt = stateRecordedAt;

  const paths = Array.isArray(raw.scopePaths)
    ? raw.scopePaths.map(safeStoredPath).filter((path): path is string => !!path)
    : [];
  const uniquePaths = [...new Set(paths)].sort();
  const digest = safeDigest(raw.scopeDigest);
  const count = safeInteger(raw.scopeCount, 1, MAX_ARTIFACTS);
  const scopeRecordedAt = safeTimestamp(raw.scopeRecordedAt);
  if (uniquePaths.length > 0 && uniquePaths.length <= MAX_ARTIFACTS &&
      uniquePaths.length === (Array.isArray(raw.scopePaths) ? raw.scopePaths.length : 0) &&
      digest && count === uniquePaths.length && scopeRecordedAt) {
    out.scopePaths = uniquePaths;
    out.scopeDigest = digest;
    out.scopeCount = count;
    out.scopeRecordedAt = scopeRecordedAt;
  }
  const reviewRecordedAt = safeTimestamp(raw.reviewRecordedAt);
  if (reviewRecordedAt) out.reviewRecordedAt = reviewRecordedAt;
  return out;
}

function normalizeEntry(stage: number, value: unknown): Entry | undefined {
  if (!isPlainObject(value)) return undefined;
  const out: Entry = {};
  switch (stage) {
    case 0:
      if (value.ok === true) out.ok = true;
      copyContext(value, "context", out);
      return out;
    case 1: {
      const passing = safeInteger(value.passing);
      if (passing !== undefined) out.passing = passing;
      return out;
    }
    case 2: {
      const distinct = safeInteger(value.distinct);
      const questions = safeInteger(value.questions, 1);
      if (distinct !== undefined && (questions === undefined || distinct <= questions)) out.distinct = distinct;
      if (questions !== undefined) out.questions = questions;
      copyContext(value, "context", out);
      return out;
    }
    case 3:
      return normalizeScoreEntry(value, 3);
    case 4:
      return normalizeScoreEntry(value, 4);
    case 5: {
      const orders = safeInteger(value.orders);
      if (orders !== undefined) out.orders = orders;
      copyContext(value, "context", out);
      return out;
    }
    case 6: {
      const gated = safeMoney(value.gated);
      if (gated !== undefined) out.gated = gated;
      copyContext(value, "context", out);
      return out;
    }
    case 7: {
      const blocked = safeInteger(value.blocked);
      if (blocked !== undefined) out.blocked = blocked;
      copyContext(value, "context", out);
      return out;
    }
    case 8: {
      const capped = safeMoney(value.capped);
      if (capped !== undefined) out.capped = capped;
      copyContext(value, "context", out);
      return out;
    }
    case 9:
      return normalizeStage9(value);
    default:
      return undefined;
  }
}

function normalizeData(value: unknown): Data {
  if (!isPlainObject(value)) return {};
  const data: Data = {};
  for (let stage = 0; stage <= 9; stage++) {
    const key = String(stage);
    if (!Object.hasOwn(value, key)) continue;
    const entry = normalizeEntry(stage, value[key]);
    if (entry) data[key] = entry;
  }
  return data;
}

export function load(file = FILE): Data {
  if (!existsSync(file)) return {};
  try {
    return normalizeData(JSON.parse(readFileSync(file, "utf8")) as unknown);
  } catch {
    return {};
  }
}

function persist(data: unknown, file: string): void {
  writeFileSync(file, `${JSON.stringify(normalizeData(data), null, 1)}\n`);
}

/** Record one passing guided-stage check and reconstruct the entire file. */
export function record(
  stage: number,
  values: MetricValues,
  context?: ExecutionContext,
  file = FILE,
): void {
  if (!Number.isInteger(stage) || stage < 0 || stage > 8) {
    throw new Error("Guided stage must be an integer from 0 through 8.");
  }
  const data = load(file);
  const entry: Entry = { ...(data[String(stage)] ?? {}) };
  const publicContext = sanitizeContext(context);

  const incomingScore = typeof values.score === "number" ? values.score : undefined;
  const previousLatest = typeof entry.score === "number" ? entry.score : undefined;
  const previousBest = typeof entry.bestScore === "number" ? entry.bestScore : previousLatest;
  for (const [key, value] of Object.entries(values)) entry[key] = value;
  if (publicContext) entry.context = publicContext;
  else delete entry.context;

  if (incomingScore !== undefined) {
    const nextBest = previousBest === undefined ? incomingScore : Math.max(previousBest, incomingScore);
    entry.score = incomingScore;
    entry.bestScore = nextBest;
    const incomingTotal = typeof values.scoreTotal === "number" ? values.scoreTotal : undefined;
    if (incomingScore >= (previousBest ?? Number.NEGATIVE_INFINITY)) {
      if (publicContext) entry.bestContext = publicContext;
      else delete entry.bestContext;
      if (incomingTotal !== undefined) entry.bestScoreTotal = incomingTotal;
    } else if (entry.bestScoreTotal === undefined && incomingTotal !== undefined) {
      entry.bestScoreTotal = incomingTotal;
    }
  }

  if (stage === 4) {
    const baseline = sanitizeContext(data["3"]?.context);
    if (baseline) entry.baselineRunId = baseline.runId;
    else delete entry.baselineRunId;
  }
  data[String(stage)] = entry;
  persist(data, file);
}

function artifactScopeError(): Error {
  return new Error("Artifact scope is invalid, missing, or outside the repository.");
}

function inventoryArtifacts(paths: string[], root: string): ArtifactScope {
  if (!Array.isArray(paths) || paths.length < 1 || paths.length > MAX_ARTIFACTS) {
    throw artifactScopeError();
  }
  let rootReal: string;
  try {
    rootReal = realpathSync(resolve(root));
  } catch {
    throw artifactScopeError();
  }

  const requested = [...new Set(paths)].sort();
  if (requested.length > MAX_ARTIFACTS) throw artifactScopeError();
  const files: { path: string; bytes: Buffer }[] = [];
  let totalBytes = 0;
  for (const input of requested) {
    const stored = safeStoredPath(input);
    if (!stored) throw artifactScopeError();
    const target = resolve(rootReal, ...stored.split("/"));
    const fromRoot = relative(rootReal, target);
    if (!fromRoot || fromRoot.startsWith(`..${sep}`) || fromRoot === ".." || isAbsolute(fromRoot)) {
      throw artifactScopeError();
    }
    try {
      const direct = lstatSync(target);
      if (!direct.isFile() || direct.isSymbolicLink() || direct.size > MAX_ARTIFACT_BYTES) {
        throw artifactScopeError();
      }
      const targetReal = realpathSync(target);
      const realFromRoot = relative(rootReal, targetReal);
      if (!realFromRoot || realFromRoot.startsWith(`..${sep}`) ||
          realFromRoot === ".." || isAbsolute(realFromRoot)) {
        throw artifactScopeError();
      }
      const bytes = readFileSync(targetReal);
      totalBytes += bytes.length;
      if (totalBytes > MAX_SCOPE_BYTES) throw artifactScopeError();
      files.push({ path: stored, bytes });
    } catch {
      throw artifactScopeError();
    }
  }

  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.path);
    hash.update("\0");
    hash.update(String(file.bytes.length));
    hash.update("\0");
    hash.update(file.bytes);
    hash.update("\0");
  }
  return {
    paths: files.map((file) => file.path),
    digest: `sha256:${hash.digest("hex")}`,
    count: files.length,
  };
}

function recordTimestamp(value: unknown): string {
  if (value === undefined) return new Date().toISOString();
  const safe = safeTimestamp(value);
  if (!safe) throw new Error("Evidence timestamp is invalid.");
  return safe;
}

/** Record a bounded Stage 9 attestation bound to current materialized files. */
export function recordStage9State(
  state: Stage9State,
  options: Stage9RecordOptions = {},
): void {
  if (!STAGE9_STATES.includes(state)) {
    throw new Error(`Stage 9 state must be one of: ${STAGE9_STATES.join(", ")}`);
  }
  const file = options.file ?? FILE;
  const root = options.root ?? ROOT_DIR;
  const timestamp = recordTimestamp(options.recordedAt);
  const data = load(file);

  if (state === "not-started") {
    if ((options.artifacts?.length ?? 0) > 0) {
      throw new Error("Stage 9 not-started cannot include an artifact scope.");
    }
    data["9"] = { state, stateRecordedAt: timestamp };
    persist(data, file);
    return;
  }

  let artifacts = options.artifacts ?? [];
  if (state === "self-reviewed" && artifacts.length === 0) {
    const existing = data["9"]?.scopePaths;
    artifacts = Array.isArray(existing) ? existing.filter((path): path is string => typeof path === "string") : [];
  }
  if (artifacts.length === 0) throw new Error("An explicit artifact scope is required for this Stage 9 state.");
  const scope = inventoryArtifacts(artifacts, root);
  data["9"] = {
    state,
    stateRecordedAt: timestamp,
    scopePaths: scope.paths,
    scopeDigest: scope.digest,
    scopeCount: scope.count,
    scopeRecordedAt: timestamp,
    ...(state === "self-reviewed" ? { reviewRecordedAt: timestamp } : {}),
  };
  persist(data, file);
}

function parseStage9State(value: string): Stage9State {
  if (!STAGE9_STATES.includes(value as Stage9State)) {
    throw new Error(`Stage 9 state must be one of: ${STAGE9_STATES.join(", ")}`);
  }
  return value as Stage9State;
}

/** Parse the bounded Stage 9 CLI surface without retaining arbitrary flags. */
export function parseStage9Command(args: string[]): Stage9Command | undefined {
  if (args.length === 0) return undefined;
  let state: Stage9State | undefined;
  const artifacts: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--stage9") {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error("Stage 9 state is required.");
      if (state) throw new Error("Stage 9 state may be provided only once.");
      state = parseStage9State(value);
    } else if (arg.startsWith("--stage9=")) {
      if (state) throw new Error("Stage 9 state may be provided only once.");
      state = parseStage9State(arg.slice("--stage9=".length));
    } else if (arg === "--artifact") {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error("Artifact path is required after --artifact.");
      artifacts.push(value);
    } else if (arg.startsWith("--artifact=")) {
      const value = arg.slice("--artifact=".length);
      if (!value) throw new Error("Artifact path is required after --artifact.");
      artifacts.push(value);
    } else {
      throw new Error("Usage: course/report.ts [--stage9 STATE] [--artifact RELATIVE_PATH ...]");
    }
  }
  if (!state) throw new Error("--artifact requires a Stage 9 state.");
  if (state === "not-started" && artifacts.length > 0) {
    throw new Error("Stage 9 not-started cannot include artifact paths.");
  }
  return { state, artifacts };
}

function number(entry: Entry, key: string): number | undefined {
  return typeof entry[key] === "number" && Number.isFinite(entry[key])
    ? entry[key] as number
    : undefined;
}

function renderStage0(entry: Entry): string {
  const context = sanitizeContext(entry.context);
  if (context?.mode === "offline" && context.network === "not-attempted") {
    return "offline path works; live credential was not checked";
  }
  if (context?.mode === "live" && context.network === "response-received" &&
      context.provider && context.model) {
    return `live credential and network path worked (${context.provider} · ${context.model})`;
  }
  return "completed; legacy record does not prove a live credential or network request";
}

function renderScore(entry: Entry): string {
  const latest = number(entry, "score");
  if (latest === undefined) return "·";
  const latestTotal = number(entry, "scoreTotal");
  const best = number(entry, "bestScore");
  const bestTotal = number(entry, "bestScoreTotal");
  const latestLabel = latestTotal === undefined
    ? `${latest} latest (denominator missing)`
    : `${latest}/${latestTotal} latest`;
  if (best === undefined) {
    return `${latestTotal === undefined ? latest : `${latest}/${latestTotal}`} legacy result ` +
      "(latest/best history unavailable)";
  }
  const bestLabel = bestTotal === undefined ? `${best} best (denominator missing)` : `${best}/${bestTotal} best`;
  return best === latest && bestTotal === latestTotal ? `${latestLabel}/best` : `${latestLabel} · ${bestLabel}`;
}

function verifyStoredScope(entry: Entry, root: string): ArtifactScope | undefined {
  if (!Array.isArray(entry.scopePaths) || !safeDigest(entry.scopeDigest) ||
      safeInteger(entry.scopeCount, 1, MAX_ARTIFACTS) !== entry.scopePaths.length ||
      !safeTimestamp(entry.scopeRecordedAt)) return undefined;
  try {
    const current = inventoryArtifacts(entry.scopePaths, root);
    return current.digest === entry.scopeDigest && current.count === entry.scopeCount ? current : undefined;
  } catch {
    return undefined;
  }
}

function renderStage9(entry: Entry | undefined, root: string): string {
  const state = entry?.state;
  if (!entry || (state !== "artifact-assembled" && state !== "self-reviewed")) {
    return "not started · manual evidence state, not automatic mastery";
  }
  const scope = verifyStoredScope(entry, root);
  const reviewRecordedAt = safeTimestamp(entry.reviewRecordedAt);
  const materialized = safeTimestamp(entry.scopeRecordedAt);
  if (!scope || !materialized || (state === "self-reviewed" && !reviewRecordedAt)) {
    const noun = state === "self-reviewed" ? "review" : "artifact state";
    return `${noun} invalidated: artifact scope is missing or changed · ` +
      "manual evidence state, not automatic mastery";
  }
  const abbreviated = scope.digest.slice("sha256:".length, "sha256:".length + 12);
  if (state === "self-reviewed") {
    return `self-reviewed (learner-attested) · review recorded ${reviewRecordedAt} · ` +
      `scope ${abbreviated} (${scope.count} files; materialized ${materialized}) · ` +
      "manual evidence state, not automatic mastery";
  }
  return `artifact assembled · scope ${abbreviated} (${scope.count} files; materialized ${materialized}) · ` +
    "manual evidence state, not automatic mastery";
}

function renderEntry(stage: number, entry: Entry): string {
  switch (stage) {
    case 0:
      return renderStage0(entry);
    case 1:
      return `${number(entry, "passing")} rule-based phrasings handled`;
    case 2: {
      const distinct = number(entry, "distinct");
      const questions = number(entry, "questions");
      return questions === undefined
        ? `${distinct} distinct answers; legacy record omitted the question count`
        : `${distinct} distinct answers from ${questions} identical questions`;
    }
    case 3:
      return `${renderScore(entry)} ← baseline`;
    case 4:
      return `${renderScore(entry)} with the menu in context`;
    case 5:
      return `${number(entry, "orders")} orders placed in the recorded run`;
    case 6:
      return `$${Number(number(entry, "gated")).toFixed(2)} spent unattended with the gate on`;
    case 7:
      return number(entry, "blocked") === 1
        ? "reviewed and unreviewed outputs differed in the recorded run"
        : "reviewed and unreviewed outputs matched in the recorded run";
    case 8:
      return `refund capped at $${Number(number(entry, "capped")).toFixed(2)} with injection input`;
    default:
      return "·";
  }
}

const SHAPE: [number, string, string][] = [
  [0, "hello", "ok"],
  [1, "kiosk", "passing"],
  [2, "prompt", "distinct"],
  [3, "evals", "score"],
  [4, "context", "score"],
  [5, "loop", "orders"],
  [6, "harness", "gated"],
  [7, "graph", "blocked"],
  [8, "security", "capped"],
];

function comparisonIssues(base: Entry, withContext: Entry): string[] {
  const a = sanitizeContext(base.context);
  const b = sanitizeContext(withContext.context);
  if (!a || !b) return ["missing execution context"];

  const issues: string[] = [];
  if (safeIdentifier(withContext.baselineRunId) !== a.runId) issues.push("baseline run binding does not match current Stage 3 run");
  const baseTime = Date.parse(a.recordedAt);
  const contextTime = Date.parse(b.recordedAt);
  if (contextTime < baseTime) issues.push("timestamp order is reversed");
  else if (contextTime - baseTime > PAIRING_WINDOW_MS) issues.push("24-hour pairing window was exceeded");
  if (a.mode !== b.mode) issues.push("mode differs");
  if (a.mode === "live" && (!a.provider || !a.model)) issues.push("Stage 3 live Provider and model are missing");
  if (b.mode === "live" && (!b.provider || !b.model)) issues.push("Stage 4 live Provider and model are missing");
  if (a.mode === "live" && !a.effort) issues.push("Stage 3 live effort is missing");
  if (b.mode === "live" && !b.effort) issues.push("Stage 4 live effort is missing");
  if (a.provider !== b.provider) issues.push("provider differs");
  if (a.model !== b.model) issues.push("model differs");
  if (a.effort !== b.effort) issues.push("effort differs");
  if (a.evalIdentity !== b.evalIdentity) issues.push("eval identity differs");
  if (a.sourceIdentity !== b.sourceIdentity) issues.push("source identity differs");
  if (a.mode === "live" &&
      (a.network !== "response-received" || b.network !== "response-received")) {
    issues.push("live network evidence is incomplete");
  }
  const baseTotal = number(base, "scoreTotal");
  const contextTotal = number(withContext, "scoreTotal");
  if (baseTotal === undefined || contextTotal === undefined) issues.push("score denominator is missing");
  else if (baseTotal !== contextTotal) issues.push("score denominator differs");
  return issues;
}

export function formatReport(value: Data, options: FormatOptions = {}): string {
  const data = normalizeData(value);
  const root = options.root ?? ROOT_DIR;
  if (!Object.keys(data).length) {
    return "\n  Nothing recorded yet.\n\n" +
      "  Start with Stage 0: fill in QUESTION, then run\n" +
      "  npx tsx course/check.ts 0 --offline\n\n" +
      `  Stage 9 transfer project  ${renderStage9(undefined, root)}\n`;
  }

  const lines = ["", "  YOUR REPORT CARD", `  ${"─".repeat(88)}`];
  for (const [stage, label, key] of SHAPE) {
    const entry = data[String(stage)];
    if (!entry || !(key in entry)) {
      lines.push(`  ${stage}  ${label.padEnd(10)} ·`);
      continue;
    }
    lines.push(`  ${stage}  ${label.padEnd(10)} ${renderEntry(stage, entry)}`);
  }
  lines.push(`  Stage 9  ${"transfer".padEnd(10)} ${renderStage9(data["9"], root)}`);
  lines.push(`  ${"─".repeat(88)}`);

  const base = data["3"];
  const withContext = data["4"];
  const baseScore = base && number(base, "score");
  const contextScore = withContext && number(withContext, "score");
  if (base && withContext && baseScore !== undefined && contextScore !== undefined) {
    const issues = comparisonIssues(base, withContext);
    if (issues.length) {
      lines.push("", `  Latest Stage 3 and Stage 4 results are not directly comparable: ${issues.join("; ")}.`);
      lines.push("  Re-run Stage 3, then Stage 4 within 24 hours under the same recorded configuration.");
    } else {
      const denominator = number(base, "scoreTotal")!;
      const delta = contextScore - baseScore;
      const baseContext = sanitizeContext(base.context)!;
      const stage4Context = sanitizeContext(withContext.context)!;
      lines.push("", `  Configuration-matched paired results: ${baseScore}/${denominator} → ` +
        `${contextScore}/${denominator} (${delta >= 0 ? "+" : ""}${delta})`);
      lines.push(`  Stage 3: ${baseContext.recordedAt} · Stage 4: ${stage4Context.recordedAt}`);
      lines.push(`  The paired score ${delta > 0 ? "rose" : delta < 0 ? "fell" : "did not move"}.`);
      lines.push("  Provider aliases may drift over time; inspect the exact Provider records.");
      lines.push("  Causal attribution requires inspecting the Stage 2–4 prompt diff; the shared");
      lines.push("  source identity does not include learner-edited prompt systems.");
    }
  } else if (baseScore !== undefined) {
    const total = number(base!, "scoreTotal");
    lines.push("", `  Latest baseline: ${total === undefined ? baseScore : `${baseScore}/${total}`}. ` +
      "Complete Stage 4 within 24 hours to create a paired comparison.");
  } else {
    lines.push("", "  No Eval score yet. Stage 3 is where this becomes measurement.");
  }
  lines.push("");
  return lines.join("\n");
}

function main(): void {
  try {
    const command = parseStage9Command(process.argv.slice(2));
    if (command) {
      recordStage9State(command.state, { artifacts: command.artifacts });
      console.log(`\n  Recorded Stage 9 manual state: ${command.state}.`);
    }
    console.log(formatReport(load()));
  } catch (error) {
    console.error(`\n  ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}

if (import.meta.filename === process.argv[1]) main();
