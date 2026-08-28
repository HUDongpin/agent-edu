import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import type {
  AgenticVideoEditingModuleManifest,
  AgenticVideoEditingModuleSlug,
} from "./types";

export const AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID =
  "course22-guided-video-project-v2" as const;
export const AGENTIC_VIDEO_EDITING_ARTIFACT_RECEIPT_SCHEMA =
  "aicourse.agentic-video-editing.module-receipt.v2" as const;
export const AGENTIC_VIDEO_EDITING_LEARNER_DOSSIER_SCHEMA =
  "aicourse.agentic-video-editing.learner-final.v2" as const;

const COURSE_ID = "agentic-video-editing" as const;
const COURSE_VERSION = "2.0.0" as const;

export const AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS = {
  "creative-brief": "artifacts/01-creative-brief.json",
  "media-manifest": "artifacts/02-media-manifest.json",
  "clock-receipt": "artifacts/02-clock-receipt.json",
  "transcript-shot-index": "artifacts/03-transcript-shot-index.json",
  "candidate-segments": "artifacts/04-candidate-segments.json",
  "edit-plan": "artifacts/05-edit-plan.json",
  "tool-permission-envelope": "artifacts/06-tool-permission-envelope.json",
  "render-receipt": "artifacts/07-render-receipt.json",
  "delivery-matrix": "artifacts/08-delivery-matrix.json",
  "variant-receipts": "artifacts/08-variant-receipts.json",
  "verification-report": "artifacts/09-verification-report.json",
} as const;

export const AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES = {
  "creative-brief": "capstone-creative-brief",
  "media-manifest": "capstone-media-manifest",
  "clock-receipt": "capstone-clock-receipt",
  "transcript-shot-index": "capstone-transcript-shot-index",
  "candidate-segments": "capstone-candidate-segments",
  "edit-plan": "capstone-edit-plan",
  "tool-permission-envelope": "capstone-tool-permission-envelope",
  "render-receipt": "capstone-render-receipt",
  "delivery-matrix": "capstone-delivery-matrix",
  "variant-receipts": "capstone-variant-receipts",
  "verification-report": "capstone-verification-report",
} as const;

const ARTIFACT_MODULE = Object.fromEntries(
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.flatMap((module) => (
    module.slug === "production-capstone"
      ? []
      : module.producesArtifactIds.map((artifactId) => [artifactId, module])
  )),
) as Readonly<Record<string, AgenticVideoEditingModuleManifest>>;

const SECRET_KEY_PATTERN = /(?:^|[-_])(api[-_]?key|access[-_]?token|refresh[-_]?token|password|secret|authorization)(?:$|[-_])/iu;
const SECRET_VALUE_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/u,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{12,}\b/u,
  /\bAKIA[A-Z0-9]{16}\b/u,
  /\b(?:bearer|basic)\s+[A-Za-z0-9._~+/=-]{12,}\b/iu,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
] as const;

type JsonRecord = Record<string, unknown>;

interface LocalMediaProbe {
  readonly tool: "ffprobe";
  readonly toolVersion: string;
  readonly container: string;
  readonly durationSeconds: number;
  readonly durationFrames: number;
  readonly video: {
    readonly codec: string;
    readonly width: number;
    readonly height: number;
    readonly frameRate: string;
  } | null;
  readonly audio: {
    readonly codec: string;
    readonly sampleRate: number;
    readonly channels: number;
  } | null;
}

export interface AgenticVideoEditingArtifactEnvelope {
  readonly schemaVersion: string;
  readonly courseId: typeof COURSE_ID;
  readonly courseVersion: typeof COURSE_VERSION;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly artifactId: string;
  readonly projectId: string;
  readonly parents: Readonly<Record<string, string>>;
  readonly payload: JsonRecord;
  readonly limitations: readonly string[];
}

export interface AgenticVideoEditingValidatedArtifact {
  readonly artifact: AgenticVideoEditingArtifactEnvelope;
  readonly absolutePath: string;
  readonly artifactPath: string;
  readonly sha256: string;
  readonly byteLength: number;
}

export interface AgenticVideoEditingArtifactReceiptV2 {
  readonly schemaVersion: typeof AGENTIC_VIDEO_EDITING_ARTIFACT_RECEIPT_SCHEMA;
  readonly courseId: typeof COURSE_ID;
  readonly courseVersion: typeof COURSE_VERSION;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly projectId: string;
  readonly artifactId: string;
  readonly artifactPath: string;
  readonly artifactSha256: string;
  readonly inputArtifactIdsAndHashes: Readonly<Record<string, string>>;
  readonly artifactSchemaId: string;
  readonly validatorId: string;
  readonly validatorVersion: "2.0.0";
  readonly executedCommand: string;
  readonly validatedAt: string;
  readonly status: "validated";
  readonly limitations: readonly string[];
}

export interface AgenticVideoEditingArtifactValidationResult {
  readonly ok: boolean;
  readonly issues: readonly string[];
  readonly validatedArtifact?: AgenticVideoEditingValidatedArtifact;
  readonly receipt?: AgenticVideoEditingArtifactReceiptV2;
}

export interface AgenticVideoEditingProjectValidationResult {
  readonly ok: boolean;
  readonly issues: readonly string[];
  readonly projectId?: string;
  readonly fixtureLedgerSha256?: string;
  readonly artifacts: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>;
  readonly receiptArrays: Readonly<
    Partial<Record<AgenticVideoEditingModuleSlug, readonly AgenticVideoEditingArtifactReceiptV2[]>>
  >;
}

interface ArtifactValidationOptions {
  readonly projectRoot: string;
  readonly artifactFile: string;
  readonly expectedModuleSlug: AgenticVideoEditingModuleSlug;
  readonly expectedArtifactId: string;
  readonly expectedProjectId: string;
  readonly priorArtifacts: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>;
  readonly mode: "guided" | "learner";
  readonly receiptPathRoot?: string;
  readonly validatedAt?: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}

function issueIfExtraOrMissingKeys(
  issues: string[],
  value: unknown,
  keys: readonly string[],
  label: string,
): value is JsonRecord {
  if (!isRecord(value)) {
    issues.push(`${label} must be an object`);
    return false;
  }
  if (!exactKeys(value, keys)) {
    issues.push(`${label} fields must be exactly: ${keys.join(", ")}`);
    return false;
  }
  return true;
}

function isStrongSha256(value: unknown): value is string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/u.test(value)) return false;
  if (/^0{64}$/u.test(value) || /^f{64}$/u.test(value)) return false;
  if (new Set(value).size < 5) return false;
  return !/^(.{1,16})\1+$/u.test(value);
}

function sha256Bytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

let guidedFixtureHashesCache: ReadonlySet<string> | null = null;

function guidedFixtureHashes(): ReadonlySet<string> {
  if (guidedFixtureHashesCache) return guidedFixtureHashesCache;
  const ledgerPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../public/courses/agentic-video-editing/lab/fixtures/guided-v2/guided-project.ledger.json",
  );
  try {
    const parsed: unknown = JSON.parse(readFileSync(ledgerPath, "utf8"));
    guidedFixtureHashesCache = isRecord(parsed) && isRecord(parsed.files)
      ? new Set(Object.values(parsed.files).filter(isStrongSha256))
      : new Set();
  } catch {
    guidedFixtureHashesCache = new Set();
  }
  return guidedFixtureHashesCache;
}

function probeLocalMedia(
  issues: string[],
  absolutePath: string,
  label: string,
): LocalMediaProbe | null {
  const probe = spawnSync(process.env.AICOURSE_FFPROBE_PATH ?? "ffprobe", [
    "-v", "error",
    "-show_entries",
    "format=format_name,duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,duration",
    "-of", "json",
    absolutePath,
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (probe.status !== 0) {
    issues.push(`${label} is not locally ffprobe-readable playable media: ${probe.stderr.trim() || "ffprobe unavailable"}`);
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(probe.stdout);
  } catch {
    issues.push(`${label} produced invalid ffprobe JSON`);
    return null;
  }
  if (!isRecord(parsed) || !isRecord(parsed.format) || !Array.isArray(parsed.streams)) {
    issues.push(`${label} ffprobe result lacks format or stream records`);
    return null;
  }
  const streams = parsed.streams.filter(isRecord);
  const video = streams.find((stream) => stream.codec_type === "video") ?? null;
  const audio = streams.find((stream) => stream.codec_type === "audio") ?? null;
  const durationSeconds = Number(parsed.format.duration ?? video?.duration ?? audio?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    issues.push(`${label} ffprobe duration must be positive`);
    return null;
  }
  const version = spawnSync(process.env.AICOURSE_FFPROBE_PATH ?? "ffprobe", ["-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const versionLine = version.status === 0 ? version.stdout.split("\n")[0] ?? "" : "";
  const toolVersion = versionLine.replace(/^ffprobe version\s+/u, "").split(/\s+/u)[0] || "unknown";
  return {
    tool: "ffprobe",
    toolVersion,
    container: String(parsed.format.format_name ?? "unknown"),
    durationSeconds,
    durationFrames: Math.round(durationSeconds * 30_000 / 1_001),
    video: video
      ? {
          codec: String(video.codec_name ?? "unknown"),
          width: Number(video.width),
          height: Number(video.height),
          frameRate: String(video.r_frame_rate ?? "unknown"),
        }
      : null,
    audio: audio
      ? {
          codec: String(audio.codec_name ?? "unknown"),
          sampleRate: Number(audio.sample_rate),
          channels: Number(audio.channels),
        }
      : null,
  };
}

function declaredProbeMatches(
  value: unknown,
  actual: LocalMediaProbe,
  sourceSha256: string,
): boolean {
  if (!isRecord(value) || !exactKeys(value, [
    "tool", "toolVersion", "container", "durationSeconds", "durationFrames",
    "video", "audio", "sourceSha256",
  ])) return false;
  const declaredVideo = value.video;
  const declaredAudio = value.audio;
  const videoMatches = actual.video === null
    ? declaredVideo === null
    : isRecord(declaredVideo)
      && exactKeys(declaredVideo, ["codec", "width", "height", "frameRate"])
      && declaredVideo.codec === actual.video.codec
      && declaredVideo.width === actual.video.width
      && declaredVideo.height === actual.video.height
      && declaredVideo.frameRate === actual.video.frameRate;
  const audioMatches = actual.audio === null
    ? declaredAudio === null
    : isRecord(declaredAudio)
      && exactKeys(declaredAudio, ["codec", "sampleRate", "channels"])
      && declaredAudio.codec === actual.audio.codec
      && declaredAudio.sampleRate === actual.audio.sampleRate
      && declaredAudio.channels === actual.audio.channels;
  return value.tool === "ffprobe"
    && meaningfulText(value.toolVersion, 2)
    && value.container === actual.container
    && Math.abs(Number(value.durationSeconds) - actual.durationSeconds) < 0.02
    && value.durationFrames === actual.durationFrames
    && value.sourceSha256 === sourceSha256
    && videoMatches
    && audioMatches;
}

function extensionMatchesContainer(relativePath: string, declaredFormat: string, probe: LocalMediaProbe): boolean {
  const extension = path.extname(relativePath).toLocaleLowerCase("en");
  if (declaredFormat === "mp4") return extension === ".mp4" && /(?:^|,)mp4(?:,|$)|mov/u.test(probe.container);
  if (declaredFormat === "mov") return extension === ".mov" && /mov/u.test(probe.container);
  if (declaredFormat === "webm") return extension === ".webm" && /webm/u.test(probe.container);
  return false;
}

export function sha256AgenticVideoEditingFile(filePath: string): string {
  return sha256Bytes(readFileSync(filePath));
}

function isOffsetTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && !Number.isNaN(new Date(value).valueOf());
}

function meaningfulText(value: unknown, minimum = 12): value is string {
  if (typeof value !== "string") return false;
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (normalized.length < minimum || normalized.length > 2_000) return false;
  if (/(.)\1{5,}/u.test(normalized)) return false;
  if (/\b(?:lorem ipsum|random text|placeholder|todo|tbd|dummy data|test test)\b/iu.test(normalized)) return false;
  if (/^[A-Za-z0-9+/=_-]{24,}$/u.test(normalized)) return false;
  const tokens = normalized.toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu) ?? [];
  if (tokens.length >= 4 && new Set(tokens).size / tokens.length < 0.45) return false;
  return true;
}

function meaningfulUniqueStrings(
  value: unknown,
  minimumItems: number,
  minimumLength = 12,
): value is string[] {
  return Array.isArray(value)
    && value.length >= minimumItems
    && value.every((item) => meaningfulText(item, minimumLength))
    && new Set(value.map((item) => item.trim().toLocaleLowerCase("en"))).size === value.length;
}

function pathInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function isSafeRelativePath(value: unknown, allowedRoots?: readonly string[]): value is string {
  if (typeof value !== "string" || !value || value.includes("\0")) return false;
  if (path.isAbsolute(value) || value.startsWith("~") || /^[a-z][a-z0-9+.-]*:/iu.test(value)) return false;
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) return false;
  if (!allowedRoots) return true;
  return allowedRoots.some((root) => normalized === root || normalized.startsWith(`${root}/`));
}

function resolveExistingProjectFile(
  issues: string[],
  projectRoot: string,
  relativePath: unknown,
  label: string,
  allowedRoots: readonly string[],
): string | null {
  if (!isSafeRelativePath(relativePath, allowedRoots)) {
    issues.push(`${label} must be a safe relative path inside ${allowedRoots.join(" or ")}`);
    return null;
  }
  const rootReal = realpathSync(projectRoot);
  const joined = path.resolve(projectRoot, relativePath);
  if (!pathInside(path.resolve(projectRoot), joined)) {
    issues.push(`${label} escapes the project root`);
    return null;
  }
  try {
    if (lstatSync(joined).isSymbolicLink()) {
      issues.push(`${label} must not be a symbolic link`);
      return null;
    }
    const real = realpathSync(joined);
    if (!pathInside(rootReal, real) || !statSync(real).isFile()) {
      issues.push(`${label} does not resolve to a regular file inside the project`);
      return null;
    }
    return real;
  } catch {
    issues.push(`${label} does not exist`);
    return null;
  }
}

function findSecretLeak(value: unknown, pointer = "$", keyName = ""): string | null {
  if (typeof value === "string") {
    if (SECRET_KEY_PATTERN.test(keyName) && !/^(?:none|not-configured|host-secret-store-or-environment|redacted)$/iu.test(value)) {
      return `${pointer} stores a secret-like field instead of an external-secret policy`;
    }
    const matched = SECRET_VALUE_PATTERNS.find((pattern) => pattern.test(value));
    return matched ? `${pointer} contains a credential-like value` : null;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const leak = findSecretLeak(value[index], `${pointer}[${index}]`, keyName);
      if (leak) return leak;
    }
    return null;
  }
  if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      const leak = findSecretLeak(nested, `${pointer}.${key}`, key);
      if (leak) return leak;
    }
  }
  return null;
}

function artifactByBaseId(
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  baseArtifactId: string,
): AgenticVideoEditingValidatedArtifact | undefined {
  return prior[baseArtifactId]
    ?? prior[AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES[
      baseArtifactId as keyof typeof AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES
    ]];
}

function artifactHash(
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  baseArtifactId: string,
): string | null {
  return artifactByBaseId(prior, baseArtifactId)?.sha256 ?? null;
}

function artifactPayload(
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  baseArtifactId: string,
): JsonRecord | null {
  return artifactByBaseId(prior, baseArtifactId)?.artifact.payload ?? null;
}

function validateCreativeBrief(payload: JsonRecord, issues: string[]): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "title", "objective", "audience", "successCriteria", "targetDurationFrames",
    "deliveryTargetIds", "rightsContract", "publicationAuthority", "stopConditions",
  ], "creative brief payload")) return;
  if (!meaningfulText(payload.title, 8) || !meaningfulText(payload.objective, 24) || !meaningfulText(payload.audience, 12)) {
    issues.push("creative brief title, objective, and audience must contain meaningful non-placeholder text");
  }
  if (!meaningfulUniqueStrings(payload.successCriteria, 4, 16)
    || !meaningfulUniqueStrings(payload.stopConditions, 4, 16)) {
    issues.push("creative brief requires four unique, meaningful success criteria and stop conditions");
  }
  const duration = payload.targetDurationFrames;
  if (!isRecord(duration) || !Number.isInteger(duration.minimum) || !Number.isInteger(duration.maximum)
    || Number(duration.minimum) < 1 || Number(duration.maximum) <= Number(duration.minimum)) {
    issues.push("creative brief targetDurationFrames must be a positive minimum/maximum range");
  }
  if (!Array.isArray(payload.deliveryTargetIds) || payload.deliveryTargetIds.length < 2
    || payload.deliveryTargetIds.some((id) => typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{3,63}$/u.test(id))
    || new Set(payload.deliveryTargetIds).size !== payload.deliveryTargetIds.length) {
    issues.push("creative brief requires at least two unique delivery target IDs");
  }
  const rights = payload.rightsContract;
  if (!issueIfExtraOrMissingKeys(issues, rights, [
    "mediaUse", "territories", "termEndsOn", "consentAndPrivacy", "decisionOwner",
  ], "creative brief rightsContract")) return;
  if (rights.mediaUse !== "authorized-for-declared-project"
    || !meaningfulUniqueStrings(rights.territories, 1, 2)
    || typeof rights.termEndsOn !== "string" || Number.isNaN(Date.parse(rights.termEndsOn))
    || !["cleared", "blocked"].includes(String(rights.consentAndPrivacy))
    || !meaningfulText(rights.decisionOwner, 8)) {
    issues.push("creative brief rights contract is incomplete or unauthorized");
  }
  if (payload.publicationAuthority !== "named-human-only") {
    issues.push("publication authority must remain named-human-only");
  }
}

function validateMediaManifest(
  payload: JsonRecord,
  issues: string[],
  root: string,
  mode: "guided" | "learner",
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "fixtureBoundary", "assets", "sourceRootsReadOnly", "overwriteOriginals",
    "fixityBaseline", "rightsDecision",
  ], "media manifest payload")) return;
  if (payload.fixtureBoundary !== (mode === "guided" ? "course-owned-synthetic" : "learner-authorized-media")) {
    issues.push(`${mode} media manifest has the wrong fixture/ownership boundary`);
  }
  if (payload.sourceRootsReadOnly !== true || payload.overwriteOriginals !== false
    || payload.fixityBaseline !== "sha256-byte-identity-not-authenticity") {
    issues.push("media manifest must preserve originals with fixity evidence without claiming authenticity");
  }
  if (!isRecord(payload.rightsDecision)
    || !meaningfulText(payload.rightsDecision.owner, 8)
    || payload.rightsDecision.status !== "approved-for-declared-use"
    || !isOffsetTimestamp(payload.rightsDecision.decidedAt)) {
    issues.push("media manifest requires a named, dated rights decision for the declared use");
  }
  if (!Array.isArray(payload.assets) || payload.assets.length < 2) {
    issues.push("media manifest requires at least two fixed assets");
    return;
  }
  const ids = new Set<string>();
  let playableVideoAssets = 0;
  let playableAudioAssets = 0;
  for (const [index, item] of payload.assets.entries()) {
    const label = `media manifest asset ${index}`;
    if (!issueIfExtraOrMissingKeys(issues, item, [
      "assetId", "relativePath", "sha256", "byteLength", "mediaKind", "owner",
      "rightsStatus", "consentStatus", "intakeDecision",
    ], label)) continue;
    if (typeof item.assetId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/u.test(item.assetId)
      || ids.has(item.assetId)) issues.push(`${label} has a duplicate or invalid assetId`);
    else ids.add(item.assetId);
    if (!meaningfulText(item.owner, 8)
      || item.rightsStatus !== "approved-for-declared-use"
      || (mode === "guided"
        ? !["not-applicable-synthetic", "cleared"].includes(String(item.consentStatus))
        : item.consentStatus !== "cleared")
      || item.intakeDecision !== "eligible-for-declared-edit") {
      issues.push(`${label} has unresolved owner, rights, consent, or intake state`);
    }
    if (item.mediaKind !== "video/mp4" && item.mediaKind !== "video/quicktime"
      && item.mediaKind !== "video/webm" && item.mediaKind !== "audio/wav") {
      issues.push(`${label}.mediaKind must identify playable MP4, MOV, WebM, or WAV media rather than metadata`);
    }
    if (typeof item.relativePath === "string" && /(?:\.json|\.stub)(?:$|\.)/iu.test(item.relativePath)) {
      issues.push(`${label}.relativePath cannot use a JSON or stub file as media evidence`);
    }
    const resolved = resolveExistingProjectFile(issues, root, item.relativePath, `${label}.relativePath`, ["assets"]);
    if (resolved && (item.sha256 !== sha256AgenticVideoEditingFile(resolved)
      || item.byteLength !== statSync(resolved).size || !isStrongSha256(item.sha256))) {
      issues.push(`${label} fixity hash or byte length does not match the actual asset bytes`);
    }
    if (mode === "learner" && isStrongSha256(item.sha256)
      && guidedFixtureHashes().has(item.sha256)) {
      issues.push(`${label} reuses exact guided-fixture bytes; learner final requires fresh authorized media`);
    }
    if (resolved) {
      const actualProbe = probeLocalMedia(issues, resolved, `${label}.relativePath`);
      if (actualProbe?.video) playableVideoAssets += 1;
      if (actualProbe?.audio) playableAudioAssets += 1;
      if (item.mediaKind === "audio/wav" && actualProbe?.video) {
        issues.push(`${label}.mediaKind says audio but ffprobe found a video stream`);
      }
      if (typeof item.mediaKind === "string" && item.mediaKind.startsWith("video/") && !actualProbe?.video) {
        issues.push(`${label}.mediaKind says video but ffprobe found no video stream`);
      }
    }
  }
  if (playableVideoAssets < 1 || playableAudioAssets < 1) {
    issues.push("media manifest requires ffprobe-readable video and audio source evidence");
  }
}

function validateClockReceipt(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  root: string,
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "timebase", "assetClocks", "normalizationPolicy", "allBoundsPass",
  ], "clock receipt payload")) return;
  const timebase = payload.timebase;
  if (!isRecord(timebase) || timebase.numerator !== 30_000 || timebase.denominator !== 1_001
    || timebase.dropFrame !== false) {
    issues.push("clock receipt must retain the fixed 30000/1001 non-drop-frame timebase");
  }
  const media = artifactPayload(prior, "media-manifest");
  const mediaAssets = Array.isArray(media?.assets) ? media.assets.filter(isRecord) : [];
  const mediaById = new Map(mediaAssets.map((item) => [String(item.assetId), item]));
  const assetIds = new Set(mediaById.keys());
  if (!Array.isArray(payload.assetClocks) || payload.assetClocks.length !== assetIds.size) {
    issues.push("clock receipt must cover every media manifest asset exactly once");
    return;
  }
  const seen = new Set<unknown>();
  for (const [index, clock] of payload.assetClocks.entries()) {
    const label = `clock receipt asset ${index}`;
    if (!issueIfExtraOrMissingKeys(issues, clock, [
      "assetId", "startFrame", "durationFrames", "probeReceiptPath", "probeReceiptSha256",
    ], label)) continue;
    if (!assetIds.has(String(clock.assetId)) || seen.has(clock.assetId)) issues.push(`${label} has an unknown or duplicate assetId`);
    seen.add(clock.assetId);
    if (!Number.isInteger(clock.startFrame) || Number(clock.startFrame) !== 0
      || !Number.isInteger(clock.durationFrames) || Number(clock.durationFrames) < 100) {
      issues.push(`${label} requires a zero start and a positive, useful duration`);
    }
    const resolved = resolveExistingProjectFile(issues, root, clock.probeReceiptPath, `${label}.probeReceiptPath`, ["assets"]);
    if (resolved && (clock.probeReceiptSha256 !== sha256AgenticVideoEditingFile(resolved)
      || !isStrongSha256(clock.probeReceiptSha256))) {
      issues.push(`${label} probe receipt hash does not match its actual bytes`);
    }
    const mediaAsset = mediaById.get(String(clock.assetId));
    if (resolved && mediaAsset) {
      let probeReceipt: unknown;
      try {
        probeReceipt = JSON.parse(readFileSync(resolved, "utf8"));
      } catch {
        issues.push(`${label} probe receipt is invalid JSON`);
      }
      const mediaPath = resolveExistingProjectFile(
        issues,
        root,
        mediaAsset.relativePath,
        `${label}.mediaPath`,
        ["assets"],
      );
      const actualProbe = mediaPath ? probeLocalMedia(issues, mediaPath, `${label}.mediaPath`) : null;
      if (!issueIfExtraOrMissingKeys(issues, probeReceipt, [
        "schemaVersion", "assetId", "assetPath", "assetSha256", "tool", "toolVersion",
        "container", "durationSeconds", "durationFrames", "video", "audio",
        "projectTimebase", "networkUsed",
      ], `${label} ffprobe receipt`)) continue;
      if (!actualProbe || probeReceipt.schemaVersion !== "aicourse.ffprobe-receipt.v2"
        || probeReceipt.assetId !== clock.assetId
        || probeReceipt.assetPath !== mediaAsset.relativePath
        || probeReceipt.assetSha256 !== mediaAsset.sha256
        || probeReceipt.tool !== "ffprobe" || !meaningfulText(probeReceipt.toolVersion, 2)
        || probeReceipt.container !== actualProbe.container
        || Math.abs(Number(probeReceipt.durationSeconds) - actualProbe.durationSeconds) >= 0.02
        || probeReceipt.durationFrames !== actualProbe.durationFrames
        || probeReceipt.durationFrames !== clock.durationFrames
        || probeReceipt.projectTimebase !== "30000/1001" || probeReceipt.networkUsed !== false) {
        issues.push(`${label} ffprobe receipt is not bound to the actual asset hash, streams, duration, and project timebase`);
      }
      if (actualProbe) {
        const syntheticDeclaredProbe = {
          tool: probeReceipt.tool,
          toolVersion: probeReceipt.toolVersion,
          container: probeReceipt.container,
          durationSeconds: probeReceipt.durationSeconds,
          durationFrames: probeReceipt.durationFrames,
          video: probeReceipt.video,
          audio: probeReceipt.audio,
          sourceSha256: probeReceipt.assetSha256,
        };
        if (!declaredProbeMatches(syntheticDeclaredProbe, actualProbe, String(mediaAsset.sha256))) {
          issues.push(`${label} ffprobe stream fields do not match the actual media bytes`);
        }
      }
    }
  }
  if (!meaningfulText(payload.normalizationPolicy, 24) || payload.allBoundsPass !== true) {
    issues.push("clock normalization policy or bounds result is incomplete");
  }
}

function mediaBounds(
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
): ReadonlyMap<string, number> {
  const clocks = artifactPayload(prior, "clock-receipt")?.assetClocks;
  return new Map(
    Array.isArray(clocks)
      ? clocks.filter(isRecord).map((item) => [String(item.assetId), Number(item.durationFrames)])
      : [],
  );
}

function validFrameRange(item: JsonRecord, bounds: ReadonlyMap<string, number>): boolean {
  const assetId = String(item.assetId ?? "");
  const maximum = bounds.get(assetId);
  return maximum !== undefined && Number.isInteger(item.startFrame) && Number.isInteger(item.endFrame)
    && Number(item.startFrame) >= 0 && Number(item.endFrame) > Number(item.startFrame)
    && Number(item.endFrame) <= maximum;
}

function validateTranscriptShotIndex(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "transcriptSegments", "shots", "evidenceIndex", "ambiguitiesRetained",
  ], "transcript/shot index payload")) return;
  const bounds = mediaBounds(prior);
  const transcriptIds = new Set<string>();
  if (!Array.isArray(payload.transcriptSegments) || payload.transcriptSegments.length < 3) {
    issues.push("transcript index requires at least three reviewed segments");
  } else {
    for (const [index, segment] of payload.transcriptSegments.entries()) {
      const label = `transcript segment ${index}`;
      if (!issueIfExtraOrMissingKeys(issues, segment, [
        "segmentId", "assetId", "startFrame", "endFrame", "speaker", "text", "confidence", "reviewState",
      ], label)) continue;
      if (typeof segment.segmentId !== "string" || transcriptIds.has(segment.segmentId)) issues.push(`${label} has a duplicate or invalid segmentId`);
      else transcriptIds.add(segment.segmentId);
      if (!validFrameRange(segment, bounds) || !meaningfulText(segment.speaker, 4)
        || !meaningfulText(segment.text, 12) || typeof segment.confidence !== "number"
        || segment.confidence < 0 || segment.confidence > 1
        || !["human-reviewed", "ambiguous-retained"].includes(String(segment.reviewState))) {
        issues.push(`${label} has invalid bounds, text, confidence, or review state`);
      }
    }
  }
  const shotIds = new Set<string>();
  if (!Array.isArray(payload.shots) || payload.shots.length < 3) issues.push("shot index requires at least three shots");
  else for (const [index, shot] of payload.shots.entries()) {
    const label = `shot ${index}`;
    if (!issueIfExtraOrMissingKeys(issues, shot, ["shotId", "assetId", "startFrame", "endFrame", "description", "reviewState"], label)) continue;
    if (typeof shot.shotId !== "string" || shotIds.has(shot.shotId)) issues.push(`${label} has a duplicate or invalid shotId`);
    else shotIds.add(shot.shotId);
    if (!validFrameRange(shot, bounds) || !meaningfulText(shot.description, 12) || shot.reviewState !== "human-reviewed") {
      issues.push(`${label} has invalid bounds, description, or review state`);
    }
  }
  const evidenceIds = new Set<string>();
  if (!Array.isArray(payload.evidenceIndex) || payload.evidenceIndex.length < 3) issues.push("evidence index requires at least three locators");
  else for (const [index, evidence] of payload.evidenceIndex.entries()) {
    const label = `evidence locator ${index}`;
    if (!issueIfExtraOrMissingKeys(issues, evidence, [
      "evidenceId", "assetId", "startFrame", "endFrame", "kind", "sourceLocator",
    ], label)) continue;
    if (typeof evidence.evidenceId !== "string" || evidenceIds.has(evidence.evidenceId)) issues.push(`${label} has a duplicate or invalid evidenceId`);
    else evidenceIds.add(evidence.evidenceId);
    if (!validFrameRange(evidence, bounds)
      || !["transcript", "shot", "human-note"].includes(String(evidence.kind))
      || !meaningfulText(evidence.sourceLocator, 8)) issues.push(`${label} does not resolve to bounded evidence`);
  }
  if (!Array.isArray(payload.ambiguitiesRetained)) issues.push("ambiguitiesRetained must be an array, including an empty explicit record");
}

const CANDIDATE_KEYS = [
  "candidateId", "assetId", "startFrame", "endFrame", "reason",
  "evidenceIds", "confidence", "decision",
] as const;

function evidenceIds(
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
): ReadonlySet<string> {
  const index = artifactPayload(prior, "transcript-shot-index")?.evidenceIndex;
  return new Set(Array.isArray(index) ? index.filter(isRecord).map((item) => String(item.evidenceId)) : []);
}

function validateCandidateSegments(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, ["candidateSchemaId", "lanes", "selectedLaneId"], "candidate segments payload")) return;
  if (payload.candidateSchemaId !== "aicourse.agentic-video-editing.candidate-segment.v2") {
    issues.push("candidate lanes must share candidate-segment.v2");
  }
  if (!Array.isArray(payload.lanes) || payload.lanes.length !== 3) {
    issues.push("candidate analysis must contain exactly manual, recorded-fixture, and optional-live lanes");
    return;
  }
  const expectedLaneIds = ["manual-review", "recorded-fixture", "optional-live-model"];
  const bounds = mediaBounds(prior);
  const knownEvidence = evidenceIds(prior);
  for (const [laneIndex, lane] of payload.lanes.entries()) {
    const label = `candidate lane ${laneIndex}`;
    if (!issueIfExtraOrMissingKeys(issues, lane, [
      "laneId", "execution", "enabled", "provider", "modelVersion", "networkRequired",
      "costUsd", "dataPath", "authority", "candidates",
    ], label)) continue;
    if (lane.laneId !== expectedLaneIds[laneIndex]) issues.push(`${label} has the wrong lane identity/order`);
    if (!Array.isArray(lane.candidates)) {
      issues.push(`${label}.candidates must be an array using the shared schema`);
      continue;
    }
    const candidateIds = new Set<string>();
    for (const [candidateIndex, candidate] of lane.candidates.entries()) {
      const candidateLabel = `${label} candidate ${candidateIndex}`;
      if (!issueIfExtraOrMissingKeys(issues, candidate, CANDIDATE_KEYS, candidateLabel)) continue;
      if (typeof candidate.candidateId !== "string" || candidateIds.has(candidate.candidateId)) issues.push(`${candidateLabel} has a duplicate/invalid candidateId`);
      else candidateIds.add(candidate.candidateId);
      if (!validFrameRange(candidate, bounds) || !meaningfulText(candidate.reason, 16)
        || typeof candidate.confidence !== "number" || candidate.confidence < 0 || candidate.confidence > 1
        || !["include", "exclude", "needs-human-review"].includes(String(candidate.decision))
        || !Array.isArray(candidate.evidenceIds) || candidate.evidenceIds.length < 1
        || candidate.evidenceIds.some((id) => !knownEvidence.has(String(id)))) {
        issues.push(`${candidateLabel} has invalid bounds, evidence, reason, confidence, or decision`);
      }
    }
    if (laneIndex < 2) {
      if (lane.enabled !== true || lane.networkRequired !== false || lane.costUsd !== 0
        || lane.authority !== "offline-core-authority" || lane.candidates.length < 2) {
        issues.push(`${label} must be an enabled, no-network, no-cost core lane with candidates`);
      }
    } else if (lane.enabled === false) {
      if (lane.execution !== "disabled-by-default" || lane.networkRequired !== true
        || lane.costUsd !== 0 || lane.provider !== "not-configured"
        || lane.modelVersion !== "not-configured" || lane.dataPath !== "no-data-sent-disabled"
        || lane.authority !== "not-granted" || lane.candidates.length !== 0) {
        issues.push("disabled live lane must send no data, spend no money, and retain no candidates");
      }
    } else {
      const authority = lane.authority;
      if (!isRecord(authority) || authority.networkAllowed !== true || authority.paidAllowed !== true
        || typeof authority.maxCostUsd !== "number" || authority.maxCostUsd < Number(lane.costUsd)
        || authority.secretDelivery !== "host-secret-store-or-environment"
        || authority.dataApproved !== true || lane.networkRequired !== true
        || !meaningfulText(lane.provider, 3) || !meaningfulText(lane.modelVersion, 3)
        || !meaningfulText(lane.dataPath, 8)) {
        issues.push("enabled live lane requires explicit network, paid, data-path, model-version, and external-secret authority");
      }
    }
  }
  if (!["manual-review", "recorded-fixture"].includes(String(payload.selectedLaneId))) {
    issues.push("core candidate selection must use the manual or recorded offline lane");
  }
}

function selectedCandidates(
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
): ReadonlyMap<string, JsonRecord> {
  const payload = artifactPayload(prior, "candidate-segments");
  const lanes = Array.isArray(payload?.lanes) ? payload.lanes.filter(isRecord) : [];
  const selected = lanes.find((lane) => lane.laneId === payload?.selectedLaneId);
  return new Map(
    Array.isArray(selected?.candidates)
      ? selected.candidates.filter(isRecord).map((item) => [String(item.candidateId), item])
      : [],
  );
}

function validateEditPlan(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "planId", "executionMode", "status", "inputAssetHashes", "operations",
    "targetDurationFrames", "actualDurationFrames", "analysisLaneId", "humanReviewRequired",
  ], "edit plan payload")) return;
  if (typeof payload.planId !== "string" || !/^[a-z0-9][a-z0-9.-]{7,79}$/u.test(payload.planId)
    || payload.executionMode !== "select-only"
    || !["blocked", "ready-for-human-review"].includes(String(payload.status))
    || payload.humanReviewRequired !== true) {
    issues.push("edit plan identity, select-only mode, status, or review gate is invalid");
  }
  const media = artifactPayload(prior, "media-manifest");
  const expectedAssetHashes = Object.fromEntries(
    Array.isArray(media?.assets)
      ? media.assets.filter(isRecord).map((asset) => [String(asset.assetId), asset.sha256])
      : [],
  );
  const inputAssetHashes = isRecord(payload.inputAssetHashes)
    ? payload.inputAssetHashes
    : null;
  if (!inputAssetHashes
    || JSON.stringify(Object.keys(inputAssetHashes).sort()) !== JSON.stringify(Object.keys(expectedAssetHashes).sort())
    || Object.entries(expectedAssetHashes).some(([id, hash]) => inputAssetHashes[id] !== hash)) {
    issues.push("edit plan input hashes must bind every manifest asset exactly");
  }
  const candidates = selectedCandidates(prior);
  if (!Array.isArray(payload.operations) || payload.operations.length < 2) {
    issues.push("select-only edit plan requires at least two operations");
    return;
  }
  let timelineCursor = 0;
  const operationIds = new Set<string>();
  let duration = 0;
  for (const [index, operation] of payload.operations.entries()) {
    const label = `edit operation ${index}`;
    if (!issueIfExtraOrMissingKeys(issues, operation, [
      "operationId", "kind", "assetId", "sourceStartFrame", "sourceEndFrame",
      "timelineStartFrame", "timelineEndFrame", "candidateId", "evidenceIds", "reason", "rightsState",
    ], label)) continue;
    const candidate = candidates.get(String(operation.candidateId));
    if (operation.kind !== "select" || typeof operation.operationId !== "string"
      || operationIds.has(operation.operationId) || !candidate
      || operation.assetId !== candidate?.assetId
      || operation.sourceStartFrame !== candidate?.startFrame
      || operation.sourceEndFrame !== candidate?.endFrame
      || operation.timelineStartFrame !== timelineCursor
      || Number(operation.timelineEndFrame) - Number(operation.timelineStartFrame)
        !== Number(operation.sourceEndFrame) - Number(operation.sourceStartFrame)
      || !meaningfulText(operation.reason, 16)
      || operation.rightsState !== "approved-for-declared-use") {
      issues.push(`${label} is not a resolved, sequential, authorized select operation`);
    }
    operationIds.add(String(operation.operationId));
    timelineCursor = Number(operation.timelineEndFrame);
    duration += Number(operation.sourceEndFrame) - Number(operation.sourceStartFrame);
  }
  const target = payload.targetDurationFrames;
  if (!isRecord(target) || !Number.isInteger(target.minimum) || !Number.isInteger(target.maximum)
    || duration !== payload.actualDurationFrames || duration !== timelineCursor
    || duration < Number(target.minimum) || duration > Number(target.maximum)) {
    issues.push("edit plan duration arithmetic or target range is invalid");
  }
  const candidatePayload = artifactPayload(prior, "candidate-segments");
  if (payload.analysisLaneId !== candidatePayload?.selectedLaneId) {
    issues.push("edit plan analysisLaneId does not match the reviewed candidate lane");
  }
}

function validateToolPolicy(payload: JsonRecord, issues: string[]): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "policyId", "allowedReadRoots", "allowedWriteRoots", "permissions", "network",
    "paidServices", "secretHandling", "timeoutSeconds", "retryPolicy", "idempotencyKey",
    "recoveryPlan", "logging",
  ], "tool policy payload")) return;
  if (typeof payload.policyId !== "string" || !/^[a-z0-9][a-z0-9.-]{7,79}$/u.test(payload.policyId)
    || !Array.isArray(payload.allowedReadRoots) || payload.allowedReadRoots.length < 1
    || payload.allowedReadRoots.some((root) => !isSafeRelativePath(root, ["assets", "artifacts"]))
    || !Array.isArray(payload.allowedWriteRoots) || payload.allowedWriteRoots.length !== 1
    || payload.allowedWriteRoots[0] !== "outputs") {
    issues.push("tool policy roots are missing, unsafe, or over-broad");
  }
  const permissions = payload.permissions;
  if (!isRecord(permissions) || permissions.readSource !== true || permissions.writeOutputs !== true
    || permissions.overwriteOriginals !== false || permissions.publish !== false || permissions.delete !== false) {
    issues.push("tool permissions must allow bounded reads/writes while denying overwrite, publish, and delete");
  }
  const network = payload.network;
  if (!isRecord(network) || network.allowed !== false || !Array.isArray(network.hosts) || network.hosts.length !== 0) {
    issues.push("core tool policy must deny network authority");
  }
  const paid = payload.paidServices;
  if (!isRecord(paid) || paid.allowed !== false || paid.maxCostUsd !== 0) {
    issues.push("core tool policy must deny paid services and retain a zero cost ceiling");
  }
  const secrets = payload.secretHandling;
  if (!isRecord(secrets) || secrets.delivery !== "host-secret-store-or-environment"
    || secrets.promptChat !== false || secrets.repository !== false || secrets.receipts !== false
    || secrets.logs !== false || secrets.rotationAndRevocation !== true) {
    issues.push("secret policy must prohibit prompts/chat, repository, receipt, and log storage and require rotation/revocation");
  }
  if (!Number.isInteger(payload.timeoutSeconds) || Number(payload.timeoutSeconds) < 1 || Number(payload.timeoutSeconds) > 600
    || !isRecord(payload.retryPolicy) || !Number.isInteger(payload.retryPolicy.maximumRetries)
    || Number(payload.retryPolicy.maximumRetries) < 0 || Number(payload.retryPolicy.maximumRetries) > 3
    || payload.retryPolicy.backoff !== "bounded-exponential"
    || typeof payload.idempotencyKey !== "string" || !/^[a-z0-9][a-z0-9.-]{7,79}$/u.test(payload.idempotencyKey)
    || !meaningfulText(payload.recoveryPlan, 24)
    || !isRecord(payload.logging) || payload.logging.redactSecrets !== true
    || payload.logging.includeHashes !== true || payload.logging.includeToolVersions !== true) {
    issues.push("tool timeout, bounded retry, idempotency, recovery, or logging policy is incomplete");
  }
}

const RENDER_COMMAND_FLAG_OPTIONS = new Set(["-nostdin", "-y"]);
const RENDER_COMMAND_VALUE_OPTIONS = new Set([
  "-v", "-i", "-filter_complex_script", "-map", "-c:v", "-preset", "-crf",
  "-pix_fmt", "-c:a", "-b:a", "-metadata",
]);

interface ParsedRenderCommand {
  readonly inputPaths: readonly string[];
  readonly filterScriptPaths: readonly string[];
  readonly outputPaths: readonly string[];
}

function parseBoundedRenderCommand(value: unknown, issues: string[]): ParsedRenderCommand | null {
  if (!Array.isArray(value) || value.length < 8
    || value.some((argument) => typeof argument !== "string"
      || argument.length === 0
      || /[\0\r\n;&|`$<>]/u.test(argument)
      || path.isAbsolute(argument)
      || argument.startsWith("~")
      || /^[a-z][a-z0-9+.-]*:/iu.test(argument)
      || /(?:^|[\\/])\.\.(?:[\\/]|$)/u.test(argument))
    || value[0] !== "ffmpeg") {
    issues.push("render command must be a shell-free relative-path argument array for the bounded FFmpeg renderer");
    return null;
  }

  const inputPaths: string[] = [];
  const filterScriptPaths: string[] = [];
  const outputPaths: string[] = [];
  const optionCounts = new Map<string, number>();
  for (let index = 1; index < value.length; index += 1) {
    const argument = value[index];
    if (RENDER_COMMAND_FLAG_OPTIONS.has(argument)) {
      optionCounts.set(argument, (optionCounts.get(argument) ?? 0) + 1);
      continue;
    }
    if (argument.startsWith("-")) {
      if (!RENDER_COMMAND_VALUE_OPTIONS.has(argument) || index + 1 >= value.length) {
        issues.push(`render command option is outside the bounded allowlist or lacks a value: ${argument}`);
        return null;
      }
      optionCounts.set(argument, (optionCounts.get(argument) ?? 0) + 1);
      const optionValue = value[index + 1];
      index += 1;
      if (argument === "-i") inputPaths.push(optionValue);
      if (argument === "-filter_complex_script") filterScriptPaths.push(optionValue);
      continue;
    }
    outputPaths.push(argument);
    if (index !== value.length - 1) {
      issues.push("render command output must be the single final positional argument");
    }
  }
  if (inputPaths.length < 1 || filterScriptPaths.length !== 1 || outputPaths.length !== 1) {
    issues.push("render command requires declared media input(s), one bound filter script, and one final output");
  }
  if (optionCounts.get("-nostdin") !== 1 || optionCounts.get("-y") !== 1) {
    issues.push("render command must contain exactly one -nostdin and one -y flag to prevent interactive input and bound output prompts");
  }
  for (const [option, count] of optionCounts) {
    if (count > 1 && !["-i", "-map", "-metadata"].includes(option)) {
      issues.push(`render command repeats singleton option: ${option}`);
    }
  }
  return { inputPaths, filterScriptPaths, outputPaths };
}

function validateRenderCommandAuthority(
  command: unknown,
  outputPath: unknown,
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  root: string,
  issues: string[],
): ParsedRenderCommand | null {
  const parsed = parseBoundedRenderCommand(command, issues);
  if (!parsed) return null;
  const policy = artifactPayload(prior, "tool-permission-envelope");
  const allowedReadRoots = Array.isArray(policy?.allowedReadRoots)
    ? policy.allowedReadRoots.filter((entry): entry is string => typeof entry === "string")
    : [];
  const allowedWriteRoots = Array.isArray(policy?.allowedWriteRoots)
    ? policy.allowedWriteRoots.filter((entry): entry is string => typeof entry === "string")
    : [];
  const manifest = artifactPayload(prior, "media-manifest");
  const declaredInputPaths = new Set(
    Array.isArray(manifest?.assets)
      ? manifest.assets.filter(isRecord).map((asset) => asset.relativePath).filter((entry): entry is string => typeof entry === "string")
      : [],
  );

  for (const [index, inputPath] of parsed.inputPaths.entries()) {
    if (!isSafeRelativePath(inputPath, allowedReadRoots) || !declaredInputPaths.has(inputPath)) {
      issues.push(`render command input ${index} must be a media-manifest path inside the M6 allowedReadRoots`);
      continue;
    }
    resolveExistingProjectFile(issues, root, inputPath, `render command input ${index}`, allowedReadRoots);
  }
  for (const [index, filterPath] of parsed.filterScriptPaths.entries()) {
    if (!isSafeRelativePath(filterPath, allowedReadRoots)) {
      issues.push(`render command filter script ${index} must stay inside the M6 allowedReadRoots`);
      continue;
    }
    resolveExistingProjectFile(issues, root, filterPath, `render command filter script ${index}`, allowedReadRoots);
  }
  const commandOutput = parsed.outputPaths[0];
  if (!isSafeRelativePath(commandOutput, allowedWriteRoots)
    || commandOutput !== outputPath) {
    issues.push("render command output must equal receipt output.relativePath inside the M6 allowedWriteRoots");
  }
  return parsed;
}

function canonicalFrameSeconds(frame: number): string {
  return Number(((frame * 1_001) / 30_000).toFixed(6)).toString();
}

function validateSelectOnlyFilterScript(
  value: unknown,
  parsedCommand: ParsedRenderCommand | null,
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  root: string,
  issues: string[],
): void {
  if (!issueIfExtraOrMissingKeys(issues, value, [
    "relativePath", "sha256", "byteLength",
  ], "render filterScript")) return;
  const policy = artifactPayload(prior, "tool-permission-envelope");
  const allowedReadRoots = Array.isArray(policy?.allowedReadRoots)
    ? policy.allowedReadRoots.filter((entry): entry is string => typeof entry === "string")
    : [];
  if (!parsedCommand || parsedCommand.filterScriptPaths.length !== 1
    || parsedCommand.filterScriptPaths[0] !== value.relativePath) {
    issues.push("render filterScript.relativePath must equal the command's single filter script path");
  }
  const resolved = resolveExistingProjectFile(
    issues,
    root,
    value.relativePath,
    "render filterScript.relativePath",
    allowedReadRoots,
  );
  if (!resolved) return;
  const bytes = readFileSync(resolved);
  if (!isStrongSha256(value.sha256)
    || value.sha256 !== sha256Bytes(bytes)
    || value.byteLength !== bytes.byteLength) {
    issues.push("render filterScript hash or byte length does not match the exact local filter bytes");
  }

  const text = bytes.toString("utf8");
  if (bytes.byteLength > 8_192 || text.includes("\0") || text.includes("\r")) {
    issues.push("render filterScript must be a small canonical UTF-8 select-only graph");
    return;
  }
  const lines = text.trim().split("\n");
  const editPlan = artifactPayload(prior, "edit-plan");
  const operations = Array.isArray(editPlan?.operations)
    ? editPlan.operations.filter(isRecord)
    : [];
  const mediaManifest = artifactPayload(prior, "media-manifest");
  const assetPaths = new Map(
    Array.isArray(mediaManifest?.assets)
      ? mediaManifest.assets.filter(isRecord).map((asset) => [String(asset.assetId), String(asset.relativePath)])
      : [],
  );
  const inputIndexes = new Map(
    (parsedCommand?.inputPaths ?? []).map((inputPath, index) => [inputPath, index]),
  );
  const expectedLines: string[] = [];
  for (const [index, operation] of operations.entries()) {
    const inputPath = assetPaths.get(String(operation.assetId));
    const inputIndex = inputPath === undefined ? undefined : inputIndexes.get(inputPath);
    const startFrame = Number(operation.sourceStartFrame);
    const endFrame = Number(operation.sourceEndFrame);
    if (inputIndex === undefined || !Number.isInteger(startFrame) || !Number.isInteger(endFrame)
      || endFrame <= startFrame) {
      issues.push(`render filterScript cannot resolve edit operation ${index} to a declared command input and frame range`);
      continue;
    }
    expectedLines.push(
      `[${inputIndex}:v]trim=start_frame=${startFrame}:end_frame=${endFrame},setpts=PTS-STARTPTS[v${index}];`,
      `[${inputIndex}:a]atrim=start=${canonicalFrameSeconds(startFrame)}:end=${canonicalFrameSeconds(endFrame)},asetpts=PTS-STARTPTS[a${index}];`,
    );
  }
  expectedLines.push(
    `${operations.map((_, index) => `[v${index}][a${index}]`).join("")}concat=n=${operations.length}:v=1:a=1[v][a]`,
  );
  if (operations.length < 2 || JSON.stringify(lines) !== JSON.stringify(expectedLines)) {
    issues.push("render filterScript must be the canonical select-only graph derived exactly from the validated edit-plan operations");
  }
}

function validateRenderReceipt(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  root: string,
  mode: "guided" | "learner",
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "renderId", "editPlanArtifactSha256", "toolPolicyArtifactSha256", "command",
    "filterScript", "environment", "output", "networkUsed", "paidCostUsd", "idempotencyKey", "recoveryTest",
  ], "render receipt payload")) return;
  if (payload.editPlanArtifactSha256 !== artifactHash(prior, "edit-plan")
    || payload.toolPolicyArtifactSha256 !== artifactHash(prior, "tool-permission-envelope")) {
    issues.push("render receipt is not hash-bound to the validated edit plan and prior tool policy");
  }
  const environment = payload.environment;
  if (!isRecord(environment) || environment.engine !== "ffmpeg"
    || !meaningfulText(environment.version, 2) || environment.codeDirected !== true
    || environment.inputsLocked !== true || environment.determinismClaim !== "not-claimed") {
    issues.push("render environment must describe code-directed locked execution without overclaiming determinism");
  }
  const output = payload.output;
  if (!issueIfExtraOrMissingKeys(issues, output, [
    "relativePath", "sha256", "byteLength", "format", "probe",
  ], "render output")) return;
  const parsedCommand = validateRenderCommandAuthority(
    payload.command,
    output.relativePath,
    prior,
    root,
    issues,
  );
  validateSelectOnlyFilterScript(payload.filterScript, parsedCommand, prior, root, issues);
  const resolved = resolveExistingProjectFile(issues, root, output.relativePath, "render output.relativePath", ["outputs"]);
  if (resolved && (output.sha256 !== sha256AgenticVideoEditingFile(resolved)
    || output.byteLength !== statSync(resolved).size || !isStrongSha256(output.sha256))) {
    issues.push("render output hash or byte length does not match the actual output bytes");
  }
  if (!["mp4", "webm", "mov"].includes(String(output.format))
    || (typeof output.relativePath === "string" && /(?:\.json|\.stub)(?:$|\.)/iu.test(output.relativePath))) {
    issues.push(`${mode} render output format is invalid`);
  }
  if (resolved) {
    const actualProbe = probeLocalMedia(issues, resolved, "render output");
    if (!actualProbe || !actualProbe.video || !actualProbe.audio
      || !extensionMatchesContainer(String(output.relativePath), String(output.format), actualProbe)
      || !declaredProbeMatches(output.probe, actualProbe, String(output.sha256))) {
      issues.push("render output requires actual playable video/audio bytes and an ffprobe record bound to hash, streams, dimensions, duration, container, and frame rate");
    }
  }
  if (mode === "learner" && isStrongSha256(output.sha256)
    && guidedFixtureHashes().has(output.sha256)) {
    issues.push("learner render reuses exact guided-fixture output bytes");
  }
  const policy = artifactPayload(prior, "tool-permission-envelope");
  if (payload.networkUsed !== false || payload.paidCostUsd !== 0
    || payload.idempotencyKey !== policy?.idempotencyKey
    || !isRecord(payload.recoveryTest) || payload.recoveryTest.interruptedRunResumed !== true
    || payload.recoveryTest.outputHashStable !== true) {
    issues.push("render execution exceeded authority or lacks idempotent recovery evidence");
  }
}

function validateDeliveryMatrix(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  root: string,
  mode: "guided" | "learner",
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "matrixId", "renderSourceSha256", "finalDeliveryVariantId", "variants",
  ], "delivery matrix payload")) return;
  const render = artifactPayload(prior, "render-receipt");
  const output = isRecord(render?.output) ? render.output : null;
  if (payload.renderSourceSha256 !== output?.sha256) issues.push("delivery matrix is not bound to the validated render bytes");
  if (!Array.isArray(payload.variants) || payload.variants.length < 2) {
    issues.push("delivery matrix requires at least two delivery variants");
    return;
  }
  const variantIds = new Set<string>();
  const variantProbes = new Map<string, LocalMediaProbe>();
  let captionSidecars = 0;
  for (const [index, variant] of payload.variants.entries()) {
    const label = `delivery variant ${index}`;
    if (!issueIfExtraOrMissingKeys(issues, variant, [
      "variantId", "deliveryTargetId", "container", "video", "audio", "captions", "outputPath",
    ], label)) continue;
    if (typeof variant.variantId !== "string" || variantIds.has(variant.variantId)) issues.push(`${label} has a duplicate or invalid variantId`);
    else variantIds.add(variant.variantId);
    if (!meaningfulText(variant.deliveryTargetId, 4)
      || !isRecord(variant.video) || variant.video.frameRate !== "30000/1001"
      || !Number.isInteger(variant.video.width) || !Number.isInteger(variant.video.height)
      || !isRecord(variant.audio) || variant.audio.profile !== "EBU-R128-training-profile"
      || variant.audio.scope !== "course-review-only-not-universal"
      || !issueIfExtraOrMissingKeys(issues, variant.captions, [
        "standard", "humanReviewRequired", "sidecarPath", "sidecarSha256",
      ], `${label}.captions`)
      || variant.captions.standard !== "WebVTT-WCAG-review"
      || variant.captions.humanReviewRequired !== true
      || !["mp4", "mov", "webm"].includes(String(variant.container))) {
      issues.push(`${label} has incomplete video, scoped-audio, or caption/accessibility delivery fields`);
    }
    if (isRecord(variant.captions) && variant.captions.sidecarPath !== null) {
      const captionPath = resolveExistingProjectFile(
        issues,
        root,
        variant.captions.sidecarPath,
        `${label}.captions.sidecarPath`,
        ["outputs"],
      );
      if (!captionPath || path.extname(captionPath).toLocaleLowerCase("en") !== ".vtt"
        || variant.captions.sidecarSha256 !== sha256AgenticVideoEditingFile(captionPath)
        || !isStrongSha256(variant.captions.sidecarSha256)) {
        issues.push(`${label} caption sidecar must be a hash-bound WebVTT file`);
      } else {
        captionSidecars += 1;
      }
    } else if (isRecord(variant.captions) && variant.captions.sidecarSha256 !== null) {
      issues.push(`${label} cannot declare a caption hash without a sidecar path`);
    }
    const resolved = resolveExistingProjectFile(issues, root, variant.outputPath, `${label}.outputPath`, ["outputs"]);
    if (resolved) {
      if (statSync(resolved).size < 128 || /(?:\.json|\.stub)(?:$|\.)/iu.test(resolved)) {
        issues.push(`${label} output is a stub or implausibly empty`);
      }
      const actualProbe = probeLocalMedia(issues, resolved, `${label}.outputPath`);
      const declaredVideo = isRecord(variant.video) ? variant.video : null;
      if (!actualProbe || !actualProbe.video || !actualProbe.audio || !declaredVideo
        || !extensionMatchesContainer(String(variant.outputPath), String(variant.container), actualProbe)
        || actualProbe.video.width !== declaredVideo.width
        || actualProbe.video.height !== declaredVideo.height
        || actualProbe.video.frameRate !== declaredVideo.frameRate) {
        issues.push(`${label} declaration does not match the actual playable container, streams, dimensions, or frame rate`);
      } else if (typeof variant.variantId === "string") {
        variantProbes.set(variant.variantId, actualProbe);
      }
    }
  }
  if (captionSidecars < 1) {
    issues.push("delivery matrix requires at least one hash-bound WebVTT caption sidecar");
  }
  const finalVariant = payload.variants.find((variant) => (
    isRecord(variant) && variant.variantId === payload.finalDeliveryVariantId
  ));
  if (!isRecord(finalVariant)) {
    issues.push("finalDeliveryVariantId must resolve to exactly one delivery variant");
  } else if (mode === "learner") {
    const finalProbe = variantProbes.get(String(finalVariant.variantId));
    if (finalVariant.container !== "mp4" || !isRecord(finalVariant.video)
      || finalVariant.video.width !== 1080 || finalVariant.video.height !== 1920
      || !finalProbe || finalProbe.durationSeconds < 45 || finalProbe.durationSeconds > 60) {
      issues.push("learner final delivery must select an actual 1080x1920 MP4 between 45 and 60 seconds");
    }
  }
}

function validateVariantReceipts(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  root: string,
  mode: "guided" | "learner",
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, ["deliveryMatrixArtifactSha256", "receipts"], "variant receipts payload")) return;
  if (payload.deliveryMatrixArtifactSha256 !== artifactHash(prior, "delivery-matrix")) {
    issues.push("variant receipts are not bound to the delivery matrix artifact bytes");
  }
  const matrix = artifactPayload(prior, "delivery-matrix");
  const variants = Array.isArray(matrix?.variants) ? matrix.variants.filter(isRecord) : [];
  if (!Array.isArray(payload.receipts) || payload.receipts.length !== variants.length) {
    issues.push("variant receipts must cover every delivery variant exactly once");
    return;
  }
  const seen = new Set<string>();
  for (const [index, receipt] of payload.receipts.entries()) {
    const label = `variant receipt ${index}`;
    if (!issueIfExtraOrMissingKeys(issues, receipt, [
      "variantId", "outputPath", "sha256", "byteLength", "probe",
      "captionReview", "audioReview", "technicalPass",
    ], label)) continue;
    const variant = variants.find((item) => item.variantId === receipt.variantId);
    if (!variant || seen.has(String(receipt.variantId)) || receipt.outputPath !== variant.outputPath) {
      issues.push(`${label} does not resolve uniquely to the delivery matrix`);
    }
    seen.add(String(receipt.variantId));
    const resolved = resolveExistingProjectFile(issues, root, receipt.outputPath, `${label}.outputPath`, ["outputs"]);
    if (resolved && (receipt.sha256 !== sha256AgenticVideoEditingFile(resolved)
      || receipt.byteLength !== statSync(resolved).size || !isStrongSha256(receipt.sha256))) {
      issues.push(`${label} hash or byte length does not match actual variant bytes`);
    }
    if (mode === "learner" && isStrongSha256(receipt.sha256)
      && guidedFixtureHashes().has(receipt.sha256)) {
      issues.push(`${label} reuses exact guided-fixture delivery bytes`);
    }
    if (resolved) {
      const actualProbe = probeLocalMedia(issues, resolved, `${label}.outputPath`);
      if (!actualProbe || !actualProbe.video || !actualProbe.audio
        || !declaredProbeMatches(receipt.probe, actualProbe, String(receipt.sha256))) {
        issues.push(`${label} ffprobe receipt does not match actual output bytes and streams`);
      }
    }
    const expectedCaptionReview = mode === "guided"
      ? "human-reviewed-fixture"
      : "human-reviewed-learner-final";
    if (receipt.captionReview !== expectedCaptionReview) issues.push(`${label} caption review is incomplete`);
    if (receipt.audioReview !== "scoped-profile-reviewed" || receipt.technicalPass !== true) {
      issues.push(`${label} audio or technical review is incomplete`);
    }
  }
}

function validNamedReview(value: unknown): boolean {
  return isRecord(value) && exactKeys(value, [
    "reviewerName", "reviewerRole", "reviewedAt", "status", "notes",
  ]) && meaningfulText(value.reviewerName, 5)
    && meaningfulText(value.reviewerRole, 5) && isOffsetTimestamp(value.reviewedAt)
    && ["pass", "blocked"].includes(String(value.status))
    && meaningfulText(value.notes, 16);
}

function validateVerificationReport(
  payload: JsonRecord,
  issues: string[],
  prior: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  mode: "guided" | "learner",
): void {
  if (!issueIfExtraOrMissingKeys(issues, payload, [
    "verificationId", "artifactHashes", "technicalChecks", "semanticReview",
    "accessibilityReview", "rightsReview", "repairLoop", "candidateReview",
  ], "verification report payload")) return;
  if (!isRecord(payload.artifactHashes)
    || !exactKeys(payload.artifactHashes, ["deliveryMatrix", "variantReceipts"])
    || payload.artifactHashes.deliveryMatrix !== artifactHash(prior, "delivery-matrix")
    || payload.artifactHashes.variantReceipts !== artifactHash(prior, "variant-receipts")) {
    issues.push("verification report is not bound to the delivery artifacts");
  }
  const editPlan = artifactPayload(prior, "edit-plan");
  const operations = Array.isArray(editPlan?.operations)
    ? editPlan.operations.filter(isRecord)
    : [];
  const clocks = artifactPayload(prior, "clock-receipt");
  const assetClocks = Array.isArray(clocks?.assetClocks)
    ? clocks.assetClocks.filter(isRecord)
    : [];
  const variantPayload = artifactPayload(prior, "variant-receipts");
  const variantReceipts = Array.isArray(variantPayload?.receipts)
    ? variantPayload.receipts.filter(isRecord)
    : [];
  const maximumSourceDuration = Math.max(
    0,
    ...assetClocks.map((clock) => Number(clock.durationFrames)).filter(Number.isFinite),
  );
  const expectedTechnicalEvidence = new Map([
    [
      "frame-boundary-check",
      `${operations.length} selected ranges stay inside their hash-bound source clocks; maximum declared source duration is ${maximumSourceDuration} frames.`,
    ],
    [
      "timeline-arithmetic-check",
      `${operations.length} sequential selections produce exactly ${String(editPlan?.actualDurationFrames)} frames without overlap or gaps.`,
    ],
    [
      "variant-fixity-check",
      `${variantReceipts.length} variant receipt hashes and ffprobe records match their actual playable output bytes.`,
    ],
  ]);
  if (!Array.isArray(payload.technicalChecks)
    || payload.technicalChecks.length !== expectedTechnicalEvidence.size
    || payload.technicalChecks.some((check) => !isRecord(check)
      || !exactKeys(check, ["checkId", "status", "evidence"])
      || check.status !== "pass"
      || check.evidence !== expectedTechnicalEvidence.get(String(check.checkId)))
    || new Set(payload.technicalChecks.map((check) => isRecord(check) ? check.checkId : null)).size
      !== expectedTechnicalEvidence.size) {
    issues.push("verification report technical checks must be the exact artifact-derived frame, timeline, and playable-variant evidence set");
  }
  if (!validNamedReview(payload.semanticReview)
    || !validNamedReview(payload.accessibilityReview)
    || !validNamedReview(payload.rightsReview)) {
    issues.push("semantic, accessibility, and rights reviews require named reviewers, roles, dates, notes, and explicit pass or blocked status");
  }
  const repair = payload.repairLoop;
  if (!isRecord(repair) || !exactKeys(repair, [
    "maximumAttempts", "attemptsUsed", "status",
  ]) || !Number.isInteger(repair.maximumAttempts) || Number(repair.maximumAttempts) < 1
    || Number(repair.maximumAttempts) > 3 || !Number.isInteger(repair.attemptsUsed)
    || Number(repair.attemptsUsed) < 0 || Number(repair.attemptsUsed) > Number(repair.maximumAttempts)
    || !["closed", "blocked"].includes(String(repair.status))) {
    issues.push("verification repair loop must be finite and explicitly closed or blocked");
  }
  const candidateReview = payload.candidateReview;
  const matrix = artifactPayload(prior, "delivery-matrix");
  const finalVariantId = matrix?.finalDeliveryVariantId;
  const variantReceiptPayload = artifactPayload(prior, "variant-receipts");
  const finalReceipt = Array.isArray(variantReceiptPayload?.receipts)
    ? variantReceiptPayload.receipts.find((entry) => isRecord(entry) && entry.variantId === finalVariantId)
    : null;
  if (!isRecord(candidateReview) || !exactKeys(candidateReview, [
    "reviewerName", "reviewerRole", "reviewedAt", "disposition", "reason",
    "candidateSha256", "notAgentGenerated",
  ]) || !meaningfulText(candidateReview.reviewerName, 5)
    || !meaningfulText(candidateReview.reviewerRole, 5) || !isOffsetTimestamp(candidateReview.reviewedAt)
    || !["ready-for-release-decision", "blocked-before-release-decision"].includes(String(candidateReview.disposition))
    || !meaningfulText(candidateReview.reason, 16) || !isStrongSha256(candidateReview.candidateSha256)
    || !isRecord(finalReceipt) || candidateReview.candidateSha256 !== finalReceipt.sha256
    || candidateReview.notAgentGenerated !== true) {
    issues.push("verification requires a named, dated candidate-review disposition bound to the selected final variant hash, without making the M10 release decision");
  }
  if (mode === "guided" && isRecord(candidateReview)
    && candidateReview.disposition !== "blocked-before-release-decision") {
    issues.push("guided fixture candidate review must remain blocked before the learner release decision");
  }
  const anyReviewBlocked = [
    payload.semanticReview,
    payload.accessibilityReview,
    payload.rightsReview,
  ].some((review) => isRecord(review) && review.status === "blocked");
  if (anyReviewBlocked && isRecord(repair) && repair.status !== "blocked") {
    issues.push("a blocked named review must leave the finite repair loop explicitly blocked");
  }
  const candidateMustBeBlocked = anyReviewBlocked
    || (isRecord(repair) && repair.status === "blocked");
  if (candidateMustBeBlocked && isRecord(candidateReview)
    && candidateReview.disposition !== "blocked-before-release-decision") {
    issues.push("a blocked review or repair loop must block the candidate before the M10 release decision");
  }
}

function semanticIssues(
  artifactId: string,
  payload: JsonRecord,
  context: Pick<ArtifactValidationOptions, "projectRoot" | "mode" | "priorArtifacts">,
): string[] {
  const issues: string[] = [];
  const baseId = artifactId.startsWith("capstone-") ? artifactId.slice("capstone-".length) : artifactId;
  switch (baseId) {
    case "creative-brief": validateCreativeBrief(payload, issues); break;
    case "media-manifest": validateMediaManifest(payload, issues, context.projectRoot, context.mode); break;
    case "clock-receipt": validateClockReceipt(payload, issues, context.priorArtifacts, context.projectRoot); break;
    case "transcript-shot-index": validateTranscriptShotIndex(payload, issues, context.priorArtifacts); break;
    case "candidate-segments": validateCandidateSegments(payload, issues, context.priorArtifacts); break;
    case "edit-plan": validateEditPlan(payload, issues, context.priorArtifacts); break;
    case "tool-permission-envelope": validateToolPolicy(payload, issues); break;
    case "render-receipt": validateRenderReceipt(payload, issues, context.priorArtifacts, context.projectRoot, context.mode); break;
    case "delivery-matrix": validateDeliveryMatrix(payload, issues, context.priorArtifacts, context.projectRoot, context.mode); break;
    case "variant-receipts": validateVariantReceipts(payload, issues, context.priorArtifacts, context.projectRoot, context.mode); break;
    case "verification-report": validateVerificationReport(payload, issues, context.priorArtifacts, context.mode); break;
    default: issues.push(`unknown artifact semantic contract: ${artifactId}`);
  }
  return issues;
}

function safeArtifactPath(absolutePath: string, projectRoot: string, receiptPathRoot?: string): string {
  const preferredRootCandidate = receiptPathRoot ? path.resolve(receiptPathRoot) : process.cwd();
  const preferredRoot = realpathSync(preferredRootCandidate);
  const fromPreferred = path.relative(preferredRoot, absolutePath).replaceAll(path.sep, "/");
  if (isSafeRelativePath(fromPreferred)) return fromPreferred;
  return path.relative(realpathSync(projectRoot), absolutePath).replaceAll(path.sep, "/");
}

function receiptFor(
  validated: AgenticVideoEditingValidatedArtifact,
  module: AgenticVideoEditingModuleManifest,
  validatedAt: string,
  projectRoot: string,
  mode: "guided" | "learner",
): AgenticVideoEditingArtifactReceiptV2 {
  const projectArgument = JSON.stringify(realpathSync(projectRoot));
  const command = module.validatorCommand
    .replace(
      /--(?:guided-project|learner-final) <project-root>/u,
      `${mode === "guided" ? "--guided-project" : "--learner-final"} ${projectArgument}`,
    )
    .replace("<artifact-id>", validated.artifact.artifactId)
    .replace("<artifact-path>", validated.artifactPath)
    .replace("<validated-at>", validatedAt);
  return {
    schemaVersion: AGENTIC_VIDEO_EDITING_ARTIFACT_RECEIPT_SCHEMA,
    courseId: COURSE_ID,
    courseVersion: COURSE_VERSION,
    moduleSlug: validated.artifact.moduleSlug,
    projectId: validated.artifact.projectId,
    artifactId: validated.artifact.artifactId,
    artifactPath: validated.artifactPath,
    artifactSha256: validated.sha256,
    inputArtifactIdsAndHashes: validated.artifact.parents,
    artifactSchemaId: module.artifactSchemaId,
    validatorId: module.validatorId,
    validatorVersion: "2.0.0",
    executedCommand: command,
    validatedAt,
    status: "validated",
    limitations: validated.artifact.limitations,
  };
}

export function validateAgenticVideoEditingArtifactFile(
  options: ArtifactValidationOptions,
): AgenticVideoEditingArtifactValidationResult {
  const issues: string[] = [];
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === options.expectedModuleSlug,
  );
  if (!moduleManifest || moduleManifest.slug === "production-capstone") {
    return { ok: false, issues: [`unknown M1-M9 module: ${options.expectedModuleSlug}`] };
  }
  const resolved = resolveExistingProjectFile(
    issues,
    options.projectRoot,
    options.artifactFile,
    "artifact file",
    ["artifacts"],
  );
  if (!resolved) return { ok: false, issues };
  let parsed: unknown;
  const bytes = readFileSync(resolved);
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    return { ok: false, issues: [`artifact is not valid UTF-8 JSON: ${String(error)}`] };
  }
  if (!issueIfExtraOrMissingKeys(issues, parsed, [
    "schemaVersion", "courseId", "courseVersion", "moduleSlug", "artifactId",
    "projectId", "parents", "payload", "limitations",
  ], "artifact envelope")) return { ok: false, issues };
  const expectedSchemaId = moduleManifest.artifactSchemaId;
  if (parsed.schemaVersion !== expectedSchemaId || parsed.courseId !== COURSE_ID
    || parsed.courseVersion !== COURSE_VERSION || parsed.moduleSlug !== options.expectedModuleSlug
    || parsed.artifactId !== options.expectedArtifactId || parsed.projectId !== options.expectedProjectId) {
    issues.push("artifact schema/course/module/artifact/project binding is incorrect");
  }
  if (!isRecord(parsed.parents) || !isRecord(parsed.payload)
    || !Array.isArray(parsed.limitations) || parsed.limitations.length < 2
    || parsed.limitations.some((item) => !meaningfulText(item, 16))) {
    issues.push("artifact parents, payload, or truthful limitations are incomplete");
  }
  const secretLeak = findSecretLeak(parsed);
  if (secretLeak) issues.push(secretLeak);
  const expectedBaseInputs = [...moduleManifest.consumesArtifactIds];
  const expectedInputs = options.mode === "learner"
    ? expectedBaseInputs.map((id) => AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES[
      id as keyof typeof AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES
    ] ?? id)
    : expectedBaseInputs;
  if (isRecord(parsed.parents)) {
    if (JSON.stringify(Object.keys(parsed.parents).sort()) !== JSON.stringify(expectedInputs.sort())) {
      issues.push("artifact parent IDs do not match the direct module dependency contract");
    }
    for (const [parentId, parentHash] of Object.entries(parsed.parents)) {
      const parent = options.priorArtifacts[parentId];
      if (!parent || parent.artifact.projectId !== options.expectedProjectId
        || parentHash !== parent.sha256 || !isStrongSha256(parentHash)) {
        issues.push(`artifact parent ${parentId} is missing, cross-project, placeholder, or hash-mismatched`);
      }
    }
  }
  if (isRecord(parsed.payload)) {
    issues.push(...semanticIssues(options.expectedArtifactId, parsed.payload, options));
  }
  if (issues.length > 0) return { ok: false, issues };
  const artifactPath = safeArtifactPath(resolved, path.resolve(options.projectRoot), options.receiptPathRoot);
  const validatedArtifact: AgenticVideoEditingValidatedArtifact = {
    artifact: parsed as unknown as AgenticVideoEditingArtifactEnvelope,
    absolutePath: resolved,
    artifactPath,
    sha256: sha256Bytes(bytes),
    byteLength: bytes.byteLength,
  };
  const validatedAt = options.validatedAt ?? new Date().toISOString();
  if (!isOffsetTimestamp(validatedAt)) {
    return { ok: false, issues: ["validatedAt must be an offset-aware timestamp"] };
  }
  return {
    ok: true,
    issues: [],
    validatedArtifact,
    receipt: receiptFor(
      validatedArtifact,
      moduleManifest,
      validatedAt,
      options.projectRoot,
      options.mode,
    ),
  };
}

interface FixtureLedger {
  readonly schemaVersion: string;
  readonly projectId: string;
  readonly courseId: string;
  readonly courseVersion: string;
  readonly timebase: string;
  readonly deliveryTargetIds: readonly string[];
  readonly files: Readonly<Record<string, string>>;
  readonly boundary: string;
}

function listProjectFileEntries(directory: string, base = directory): string[] {
  const entries: string[] = [];
  for (const name of readdirSync(directory).sort()) {
    const absolutePath = path.join(directory, name);
    const relativePath = path.relative(base, absolutePath).replaceAll(path.sep, "/");
    const stat = lstatSync(absolutePath);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      entries.push(...listProjectFileEntries(absolutePath, base));
    } else {
      entries.push(relativePath);
    }
  }
  return entries;
}

function validateFixtureLedger(projectRoot: string, issues: string[]): { ledger?: FixtureLedger; sha256?: string } {
  const ledgerPath = path.join(projectRoot, "guided-project.ledger.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(ledgerPath, "utf8"));
  } catch (error) {
    issues.push(`guided project ledger is unreadable: ${String(error)}`);
    return {};
  }
  if (!issueIfExtraOrMissingKeys(issues, parsed, [
    "schemaVersion", "projectId", "courseId", "courseVersion", "timebase",
    "deliveryTargetIds", "files", "boundary",
  ], "guided project ledger")) return {};
  if (parsed.schemaVersion !== "aicourse.agentic-video-editing.guided-project-ledger.v2"
    || parsed.projectId !== AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID
    || parsed.courseId !== COURSE_ID || parsed.courseVersion !== COURSE_VERSION
    || parsed.timebase !== "30000/1001"
    || JSON.stringify(parsed.deliveryTargetIds) !== JSON.stringify(["review-1080p", "review-captioned"])
    || !meaningfulText(parsed.boundary, 24) || !isRecord(parsed.files)) {
    issues.push("guided project ledger identity, timebase, targets, or boundary is invalid");
  }
  if (isRecord(parsed.files)) {
    const required = [
      ...Object.values(AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS),
      "assets/camera-a.mp4", "assets/room-audio.wav",
      "assets/camera-a.probe.json", "assets/room-audio.probe.json",
      "artifacts/07-render-filter.txt",
      "outputs/candidate-render.mp4", "outputs/review-1080p.mp4",
      "outputs/review-captioned.mp4", "outputs/review-captioned.vtt",
    ];
    if (JSON.stringify(Object.keys(parsed.files).sort()) !== JSON.stringify(required.sort())) {
      issues.push("guided project ledger must enumerate every and only required course-owned file");
    }
    const expectedDiskInventory = [...required, "guided-project.ledger.json"].sort();
    const actualDiskInventory = listProjectFileEntries(projectRoot).sort();
    if (JSON.stringify(actualDiskInventory) !== JSON.stringify(expectedDiskInventory)) {
      issues.push("guided project disk inventory must contain every and only the ledger-bound files plus the ledger itself");
    }
    const hashes = new Set<string>();
    for (const [relativePath, expectedHash] of Object.entries(parsed.files)) {
      const resolved = resolveExistingProjectFile(issues, projectRoot, relativePath, `ledger file ${relativePath}`, ["artifacts", "assets", "outputs"]);
      if (!resolved || !isStrongSha256(expectedHash) || sha256AgenticVideoEditingFile(resolved) !== expectedHash) {
        issues.push(`guided project ledger hash mismatch: ${relativePath}`);
      }
      if (resolved && statSync(resolved).nlink !== 1) {
        issues.push(`guided project ledger file must not be hard-linked: ${relativePath}`);
      }
      if (typeof expectedHash === "string") {
        if (hashes.has(expectedHash)) issues.push(`guided project ledger reuses a file hash: ${relativePath}`);
        hashes.add(expectedHash);
      }
    }
  }
  return {
    ledger: parsed as unknown as FixtureLedger,
    sha256: sha256AgenticVideoEditingFile(ledgerPath),
  };
}

function baseArtifactId(actualId: string): string {
  return actualId.startsWith("capstone-") ? actualId.slice("capstone-".length) : actualId;
}

function validateProjectArtifacts(
  projectRoot: string,
  projectId: string,
  mode: "guided" | "learner",
  receiptPathRoot?: string,
  validatedAt?: string,
  throughModuleSlug?: AgenticVideoEditingModuleSlug,
): AgenticVideoEditingProjectValidationResult {
  const issues: string[] = [];
  const artifacts: Record<string, AgenticVideoEditingValidatedArtifact> = {};
  const receiptArrays: Partial<Record<AgenticVideoEditingModuleSlug, AgenticVideoEditingArtifactReceiptV2[]>> = {};
  for (const [baseId, artifactFile] of Object.entries(AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS)) {
    const moduleManifest = ARTIFACT_MODULE[baseId];
    if (!moduleManifest) {
      issues.push(`no module contract for ${baseId}`);
      continue;
    }
    const targetOrder = throughModuleSlug
      ? AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find((module) => module.slug === throughModuleSlug)?.order
      : undefined;
    if (targetOrder !== undefined && moduleManifest.order > targetOrder) break;
    const expectedId = mode === "learner"
      ? AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES[
        baseId as keyof typeof AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES
      ]
      : baseId;
    const result = validateAgenticVideoEditingArtifactFile({
      projectRoot,
      artifactFile,
      expectedModuleSlug: moduleManifest.slug,
      expectedArtifactId: expectedId,
      expectedProjectId: projectId,
      priorArtifacts: artifacts,
      mode,
      receiptPathRoot,
      validatedAt,
    });
    if (!result.ok || !result.validatedArtifact || !result.receipt) {
      issues.push(...result.issues.map((issue) => `${expectedId}: ${issue}`));
      continue;
    }
    artifacts[expectedId] = result.validatedArtifact;
    const array = receiptArrays[moduleManifest.slug] ?? [];
    array.push(result.receipt);
    receiptArrays[moduleManifest.slug] = array;
  }
  return {
    ok: issues.length === 0,
    issues,
    projectId,
    artifacts,
    receiptArrays,
  };
}

export function validateAgenticVideoEditingGuidedProject(
  projectRoot: string,
  options: {
    readonly receiptPathRoot?: string;
    readonly validatedAt?: string;
    readonly verifyFixtureLedger?: boolean;
    readonly throughModuleSlug?: AgenticVideoEditingModuleSlug;
  } = {},
): AgenticVideoEditingProjectValidationResult {
  const issues: string[] = [];
  const ledger = options.verifyFixtureLedger === false
    ? {}
    : validateFixtureLedger(projectRoot, issues);
  const projectResult = validateProjectArtifacts(
    projectRoot,
    AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID,
    "guided",
    options.receiptPathRoot,
    options.validatedAt,
    options.throughModuleSlug,
  );
  issues.push(...projectResult.issues);
  return {
    ...projectResult,
    ok: issues.length === 0,
    issues,
    fixtureLedgerSha256: ledger.sha256,
  };
}

const LEARNER_EVIDENCE_IDS = [
  ...Object.values(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES),
  "release-decision",
] as const;

function validateReleaseDecision(
  projectRoot: string,
  expectedProjectId: string,
  priorArtifacts: Readonly<Record<string, AgenticVideoEditingValidatedArtifact>>,
  artifactFile = "release-decision.json",
): { issues: string[]; artifact?: AgenticVideoEditingValidatedArtifact } {
  const issues: string[] = [];
  const resolved = resolveExistingProjectFile(issues, projectRoot, artifactFile, "release decision", ["release-decision.json"]);
  if (!resolved) return { issues };
  let parsed: unknown;
  const bytes = readFileSync(resolved);
  try { parsed = JSON.parse(bytes.toString("utf8")); } catch (error) {
    return { issues: [`release decision is invalid JSON: ${String(error)}`] };
  }
  if (!issueIfExtraOrMissingKeys(issues, parsed, [
    "schemaVersion", "courseId", "courseVersion", "moduleSlug", "artifactId", "projectId",
    "parents", "payload", "limitations",
  ], "release decision envelope")) return { issues };
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find((candidate) => candidate.slug === "production-capstone")!;
  if (parsed.schemaVersion !== moduleManifest.artifactSchemaId || parsed.courseId !== COURSE_ID
    || parsed.courseVersion !== COURSE_VERSION || parsed.moduleSlug !== moduleManifest.slug
    || parsed.artifactId !== "release-decision" || parsed.projectId !== expectedProjectId
    || !isRecord(parsed.parents) || !isRecord(parsed.payload)) {
    issues.push("release decision schema/course/module/artifact/project binding is invalid");
  }
  const expectedParents = Object.values(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES).sort();
  if (isRecord(parsed.parents)) {
    if (JSON.stringify(Object.keys(parsed.parents).sort()) !== JSON.stringify(expectedParents)) {
      issues.push("release decision must bind all eleven learner project artifacts");
    }
    for (const [artifactId, hash] of Object.entries(parsed.parents)) {
      if (!priorArtifacts[artifactId] || priorArtifacts[artifactId].sha256 !== hash
        || priorArtifacts[artifactId].artifact.projectId !== expectedProjectId || !isStrongSha256(hash)) {
        issues.push(`release decision parent ${artifactId} is missing, cross-project, or hash-mismatched`);
      }
    }
  }
  if (isRecord(parsed.payload)) {
    if (!issueIfExtraOrMissingKeys(issues, parsed.payload, [
      "reviewerName", "reviewerRole", "signedAt", "decision", "reason", "candidateSha256",
      "rightsState", "semanticReview", "accessibilityReview", "notAgentGenerated",
    ], "release decision payload")) return { issues };
    const payload = parsed.payload;
    if (!meaningfulText(payload.reviewerName, 5) || !meaningfulText(payload.reviewerRole, 5)
      || !isOffsetTimestamp(payload.signedAt) || !["publish", "do-not-publish"].includes(String(payload.decision))
      || !meaningfulText(payload.reason, 20) || !isStrongSha256(payload.candidateSha256)
      || !["cleared-for-declared-use", "blocked"].includes(String(payload.rightsState))
      || !["pass", "blocked"].includes(String(payload.semanticReview))
      || !["pass", "blocked"].includes(String(payload.accessibilityReview))
      || payload.notAgentGenerated !== true) {
      issues.push("release decision requires a named role, offset date, exact candidate, review states, reason, and human authority");
    }
    if (payload.decision === "publish" && (payload.rightsState !== "cleared-for-declared-use"
      || payload.semanticReview !== "pass" || payload.accessibilityReview !== "pass")) {
      issues.push("publish is forbidden when rights, semantic, or accessibility review is not passing");
    }
    const verificationPayload = artifactPayload(priorArtifacts, "verification-report");
    const candidateReview = isRecord(verificationPayload?.candidateReview)
      ? verificationPayload.candidateReview
      : null;
    const deliveryPayload = artifactPayload(priorArtifacts, "delivery-matrix");
    const finalVariantId = deliveryPayload?.finalDeliveryVariantId;
    const receiptsPayload = artifactPayload(priorArtifacts, "variant-receipts");
    const finalReceipt = Array.isArray(receiptsPayload?.receipts)
      ? receiptsPayload.receipts.find((entry) => isRecord(entry) && entry.variantId === finalVariantId)
      : null;
    if (!candidateReview || !isRecord(finalReceipt)
      || payload.candidateSha256 !== candidateReview.candidateSha256
      || payload.candidateSha256 !== finalReceipt.sha256) {
      issues.push("release decision candidateSha256 must equal both the M9 candidate review and the selected final variant receipt hash");
    }
    const m9Semantic = isRecord(verificationPayload?.semanticReview)
      ? verificationPayload.semanticReview.status
      : null;
    const m9Accessibility = isRecord(verificationPayload?.accessibilityReview)
      ? verificationPayload.accessibilityReview.status
      : null;
    const m9Rights = isRecord(verificationPayload?.rightsReview)
      ? verificationPayload.rightsReview.status
      : null;
    if (payload.semanticReview !== m9Semantic
      || payload.accessibilityReview !== m9Accessibility
      || payload.rightsState !== (m9Rights === "pass" ? "cleared-for-declared-use" : "blocked")) {
      issues.push("M10 review states must agree with the bound M9 semantic, accessibility, and rights review outcomes");
    }
    if (payload.decision === "publish"
      && candidateReview?.disposition !== "ready-for-release-decision") {
      issues.push("publish is forbidden unless M9 marked the exact candidate ready for a release decision");
    }
  }
  const secret = findSecretLeak(parsed);
  if (secret) issues.push(secret);
  if (!Array.isArray(parsed.limitations) || parsed.limitations.length < 2
    || parsed.limitations.some((item) => !meaningfulText(item, 16))) {
    issues.push("release decision must retain validator and human-authority limitations");
  }
  if (issues.length > 0) return { issues };
  return {
    issues,
    artifact: {
      artifact: parsed as unknown as AgenticVideoEditingArtifactEnvelope,
      absolutePath: resolved,
      artifactPath: artifactFile,
      sha256: sha256Bytes(bytes),
      byteLength: bytes.length,
    },
  };
}

export function validateAgenticVideoEditingLearnerFinal(
  projectRoot: string,
  options: { readonly receiptPathRoot?: string; readonly validatedAt?: string } = {},
): AgenticVideoEditingProjectValidationResult {
  const issues: string[] = [];
  let firstArtifact: unknown;
  try {
    firstArtifact = JSON.parse(readFileSync(path.join(projectRoot, AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS["creative-brief"]), "utf8"));
  } catch (error) {
    return { ok: false, issues: [`learner creative brief is unreadable: ${String(error)}`], artifacts: {}, receiptArrays: {} };
  }
  const projectId = isRecord(firstArtifact) ? firstArtifact.projectId : null;
  if (typeof projectId !== "string" || !/^[a-z0-9][a-z0-9.-]{7,79}$/u.test(projectId)
    || projectId === AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID) {
    return { ok: false, issues: ["learner final requires a new stable projectId distinct from the guided project"], artifacts: {}, receiptArrays: {} };
  }
  const projectResult = validateProjectArtifacts(
    projectRoot,
    projectId,
    "learner",
    options.receiptPathRoot,
    options.validatedAt,
  );
  issues.push(...projectResult.issues);
  const artifacts = { ...projectResult.artifacts };
  const decisionResult = validateReleaseDecision(projectRoot, projectId, artifacts);
  issues.push(...decisionResult.issues.map((issue) => `release-decision: ${issue}`));
  if (decisionResult.artifact) artifacts["release-decision"] = decisionResult.artifact;

  const dossierPath = path.join(projectRoot, "production-dossier.json");
  let dossierParsed: unknown;
  let dossierBytes: Buffer | null = null;
  try {
    dossierBytes = readFileSync(dossierPath);
    dossierParsed = JSON.parse(dossierBytes.toString("utf8"));
  } catch (error) {
    issues.push(`production dossier is unreadable: ${String(error)}`);
  }
  const capstoneModule = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find((candidate) => candidate.slug === "production-capstone")!;
  let dossierArtifact: AgenticVideoEditingValidatedArtifact | undefined;
  if (issueIfExtraOrMissingKeys(issues, dossierParsed, [
    "schemaVersion", "courseId", "courseVersion", "moduleSlug", "artifactId", "projectId",
    "parents", "payload", "limitations",
  ], "production dossier envelope")) {
    if (dossierParsed.schemaVersion !== capstoneModule.artifactSchemaId || dossierParsed.courseId !== COURSE_ID
      || dossierParsed.courseVersion !== COURSE_VERSION || dossierParsed.moduleSlug !== "production-capstone"
      || dossierParsed.artifactId !== "production-dossier" || dossierParsed.projectId !== projectId
      || !isRecord(dossierParsed.parents) || !isRecord(dossierParsed.payload)) {
      issues.push("production dossier schema/course/module/artifact/project binding is invalid");
    }
    if (isRecord(dossierParsed.parents)) {
      const expectedParents = Object.values(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES).sort();
      if (JSON.stringify(Object.keys(dossierParsed.parents).sort()) !== JSON.stringify(expectedParents)) {
        issues.push("production dossier must bind all eleven fresh learner artifacts");
      }
      for (const [artifactId, hash] of Object.entries(dossierParsed.parents)) {
        if (!artifacts[artifactId] || artifacts[artifactId].sha256 !== hash || !isStrongSha256(hash)) {
          issues.push(`production dossier parent mismatch: ${artifactId}`);
        }
      }
    }
    if (isRecord(dossierParsed.payload)) {
      const payload = dossierParsed.payload;
      if (!issueIfExtraOrMissingKeys(issues, payload, [
        "learnerFinalSchemaId", "learnerProjectId", "guidedProjectIdReused",
        "readiness", "evidence", "attestation", "decisionArtifact",
      ], "production dossier payload")) {
        // Field issue already recorded.
      } else {
        if (payload.learnerFinalSchemaId !== AGENTIC_VIDEO_EDITING_LEARNER_DOSSIER_SCHEMA
          || payload.learnerProjectId !== projectId || payload.guidedProjectIdReused !== false) {
          issues.push("production dossier must identify the fresh learner project and reject guided-project reuse");
        }
        const readiness = payload.readiness;
        if (!isRecord(readiness) || readiness.quizVersion !== "2.0.0:quiz-v2"
          || readiness.currentAttemptPassed !== true || readiness.criticalQuestionsCorrect !== true
          || !isOffsetTimestamp(readiness.passedAt)) {
          issues.push("production dossier requires the current v2 readiness form and every critical question to pass");
        }
        const evidence = payload.evidence;
        if (!Array.isArray(evidence) || evidence.length !== LEARNER_EVIDENCE_IDS.length
          || JSON.stringify(evidence.map((item) => isRecord(item) ? item.artifactId : null).sort())
            !== JSON.stringify([...LEARNER_EVIDENCE_IDS].sort())) {
          issues.push("production dossier must contain the exact twelve semantic evidence IDs");
        } else {
          for (const entry of evidence) {
            if (!issueIfExtraOrMissingKeys(issues, entry, [
              "artifactId", "locator", "sha256", "reviewState", "artifactSchemaId", "validatorId",
            ], "production dossier evidence entry")) continue;
            const artifact = artifacts[String(entry.artifactId)];
            const actualId = String(entry.artifactId);
            const actualBaseId = baseArtifactId(actualId);
            const evidenceModule = actualId === "release-decision"
              ? capstoneModule
              : ARTIFACT_MODULE[actualBaseId];
            const expectedLocator = artifact
              ? path.relative(realpathSync(projectRoot), artifact.absolutePath).replaceAll(path.sep, "/")
              : null;
            const entryIssues: string[] = [];
            if (!artifact) entryIssues.push("artifact-missing");
            else if (entry.sha256 !== artifact.sha256) entryIssues.push("hash-mismatch");
            if (!isStrongSha256(entry.sha256)) entryIssues.push("weak-hash");
            if (!isSafeRelativePath(entry.locator) || entry.locator !== expectedLocator) entryIssues.push("locator-mismatch");
            if (!["reviewed-pass", "reviewed-blocked"].includes(String(entry.reviewState))) entryIssues.push("review-state-invalid");
            if (!evidenceModule || entry.artifactSchemaId !== evidenceModule.artifactSchemaId) entryIssues.push("schema-mismatch");
            if (!evidenceModule || entry.validatorId !== evidenceModule.validatorId) entryIssues.push("validator-mismatch");
            if (entryIssues.length > 0) {
              issues.push(`production dossier evidence is invalid or hash-drifted: ${String(entry.artifactId)} (${entryIssues.join(", ")})`);
            }
          }
          const decisionPayload = artifacts["release-decision"]?.artifact.payload;
          const decisionEvidence = evidence.find((entry) => isRecord(entry) && entry.artifactId === "release-decision");
          if (isRecord(decisionPayload) && isRecord(decisionEvidence)
            && ((decisionPayload.decision === "publish" && decisionEvidence.reviewState !== "reviewed-pass")
              || (decisionPayload.decision === "do-not-publish" && decisionEvidence.reviewState !== "reviewed-blocked"))) {
            issues.push("release-decision evidence state must match the named human publish or do-not-publish outcome");
          }
          const verificationArtifactId = AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["verification-report"];
          const verificationEvidence = evidence.find(
            (entry) => isRecord(entry) && entry.artifactId === verificationArtifactId,
          );
          const verificationPayload = artifacts[verificationArtifactId]?.artifact.payload;
          const m9Blocked = isRecord(verificationPayload)
            && ([
              verificationPayload.semanticReview,
              verificationPayload.accessibilityReview,
              verificationPayload.rightsReview,
            ].some((review) => isRecord(review) && review.status === "blocked")
              || (isRecord(verificationPayload.repairLoop)
                && verificationPayload.repairLoop.status === "blocked")
              || (isRecord(verificationPayload.candidateReview)
                && verificationPayload.candidateReview.disposition === "blocked-before-release-decision"));
          if (isRecord(verificationEvidence)
            && verificationEvidence.reviewState !== (m9Blocked ? "reviewed-blocked" : "reviewed-pass")) {
            issues.push("verification-report evidence state must match the bound M9 review, repair-loop, and candidate disposition");
          }
        }
        const attestation = payload.attestation;
        if (!isRecord(attestation) || !meaningfulText(attestation.learnerName, 5)
          || !isOffsetTimestamp(attestation.signedAt) || attestation.authorizedMedia === false
          || attestation.authorizedMedia !== true || attestation.noSecretsRetained !== true
          || attestation.humanDecisionNotAgentGenerated !== true) {
          issues.push("production dossier requires a named, dated learner attestation for authorization, no secrets, and human release authority");
        }
        if (!isRecord(payload.decisionArtifact) || payload.decisionArtifact.artifactId !== "release-decision"
          || payload.decisionArtifact.locator !== "release-decision.json"
          || payload.decisionArtifact.sha256 !== artifacts["release-decision"]?.sha256) {
          issues.push("production dossier decisionArtifact must bind the exact release-decision file");
        }
      }
    }
    const secret = findSecretLeak(dossierParsed);
    if (secret) issues.push(secret);
    if (!Array.isArray(dossierParsed.limitations) || dossierParsed.limitations.length < 2
      || dossierParsed.limitations.some((item) => !meaningfulText(item, 16))) {
      issues.push("production dossier must retain validator and human-review limitations");
    }
    if (dossierBytes && issues.length === 0) {
      dossierArtifact = {
        artifact: dossierParsed as unknown as AgenticVideoEditingArtifactEnvelope,
        absolutePath: dossierPath,
        artifactPath: safeArtifactPath(dossierPath, projectRoot, options.receiptPathRoot),
        sha256: sha256Bytes(dossierBytes),
        byteLength: dossierBytes.length,
      };
      artifacts["production-dossier"] = dossierArtifact;
    }
  }

  const receiptArrays = { ...projectResult.receiptArrays } as Partial<Record<AgenticVideoEditingModuleSlug, AgenticVideoEditingArtifactReceiptV2[]>>;
  if (issues.length === 0 && dossierArtifact && decisionResult.artifact) {
    const validatedAt = options.validatedAt ?? new Date().toISOString();
    const capstoneReceipts = [dossierArtifact, decisionResult.artifact].map((artifact) => ({
      ...receiptFor(artifact, capstoneModule, validatedAt, projectRoot, "learner"),
      inputArtifactIdsAndHashes: Object.fromEntries(
        Object.values(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES).map((id) => [id, artifacts[id].sha256]),
      ),
      artifactPath: artifact.artifact.artifactId === "release-decision"
        ? safeArtifactPath(artifact.absolutePath, projectRoot, options.receiptPathRoot)
        : artifact.artifactPath,
      executedCommand: capstoneModule.validatorCommand
        .replace("<project-root>", JSON.stringify(realpathSync(projectRoot)))
        .replace("<artifact-id>", artifact.artifact.artifactId)
        .replace("<artifact-path>", artifact.artifact.artifactId === "release-decision"
          ? safeArtifactPath(artifact.absolutePath, projectRoot, options.receiptPathRoot)
          : artifact.artifactPath)
        .replace("<validated-at>", validatedAt),
    }));
    receiptArrays["production-capstone"] = capstoneReceipts;
  }
  return {
    ok: issues.length === 0,
    issues,
    projectId,
    artifacts,
    receiptArrays,
  };
}

export function isAgenticVideoEditingStrongSha256(value: unknown): value is string {
  return isStrongSha256(value);
}

export function agenticVideoEditingBaseArtifactId(actualId: string): string {
  return baseArtifactId(actualId);
}
