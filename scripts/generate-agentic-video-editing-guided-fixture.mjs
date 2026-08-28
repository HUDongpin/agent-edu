#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.join(
  repositoryRoot,
  "public/courses/agentic-video-editing/lab/fixtures/guided-v2",
);
const assetsRoot = path.join(projectRoot, "assets");
const artifactsRoot = path.join(projectRoot, "artifacts");
const outputsRoot = path.join(projectRoot, "outputs");
const projectId = "course22-guided-video-project-v2";
const frameRate = "30000/1001";
const sourceFrames = 1800;

const artifactFiles = {
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
};

const artifactInputs = {
  "creative-brief": [],
  "media-manifest": ["creative-brief"],
  "clock-receipt": ["creative-brief"],
  "transcript-shot-index": ["media-manifest", "clock-receipt"],
  "candidate-segments": ["transcript-shot-index"],
  "edit-plan": ["candidate-segments"],
  "tool-permission-envelope": ["edit-plan"],
  "render-receipt": ["tool-permission-envelope"],
  "delivery-matrix": ["render-receipt"],
  "variant-receipts": ["render-receipt"],
  "verification-report": ["delivery-matrix", "variant-receipts"],
};

function run(command, args, cwd = repositoryRoot) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(projectRoot, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  writeFileSync(path.join(projectRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function probe(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const parsed = JSON.parse(run("ffprobe", [
    "-v", "error",
    "-show_entries",
    "format=format_name,duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,duration",
    "-of", "json",
    absolutePath,
  ]));
  const versionLine = run("ffprobe", ["-version"]).split("\n")[0] ?? "ffprobe unknown";
  const video = parsed.streams?.find((stream) => stream.codec_type === "video") ?? null;
  const audio = parsed.streams?.find((stream) => stream.codec_type === "audio") ?? null;
  const durationSeconds = Number(parsed.format?.duration ?? video?.duration ?? audio?.duration);
  return {
    tool: "ffprobe",
    toolVersion: versionLine.replace(/^ffprobe version\s+/u, "").split(/\s+/u)[0],
    container: parsed.format?.format_name ?? "unknown",
    durationSeconds,
    durationFrames: Math.round(durationSeconds * 30_000 / 1_001),
    video: video
      ? {
          codec: video.codec_name,
          width: Number(video.width),
          height: Number(video.height),
          frameRate: video.r_frame_rate,
        }
      : null,
    audio: audio
      ? {
          codec: audio.codec_name,
          sampleRate: Number(audio.sample_rate),
          channels: Number(audio.channels),
        }
      : null,
  };
}

function fileRecord(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  return {
    relativePath,
    sha256: sha256(absolutePath),
    byteLength: statSync(absolutePath).size,
  };
}

function listRelativeRegularFiles(directory, base = directory) {
  const files = [];
  for (const name of readdirSync(directory).sort()) {
    const absolutePath = path.join(directory, name);
    const relativePath = path.relative(base, absolutePath).replaceAll(path.sep, "/");
    const stat = lstatSync(absolutePath);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
      throw new Error(`Guided fixture contains an unsupported filesystem entry: ${relativePath}`);
    }
    if (stat.isDirectory()) files.push(...listRelativeRegularFiles(absolutePath, base));
    else files.push(relativePath);
  }
  return files;
}

mkdirSync(assetsRoot, { recursive: true });
mkdirSync(artifactsRoot, { recursive: true });
mkdirSync(outputsRoot, { recursive: true });

const cameraPath = path.join(assetsRoot, "camera-a.mp4");
const audioPath = path.join(assetsRoot, "room-audio.wav");
const candidatePath = path.join(outputsRoot, "candidate-render.mp4");
const horizontalPath = path.join(outputsRoot, "review-1080p.mp4");
const verticalPath = path.join(outputsRoot, "review-captioned.mp4");
const renderFilterRelativePath = "artifacts/07-render-filter.txt";
const renderFilterPath = path.join(projectRoot, renderFilterRelativePath);

run("ffmpeg", [
  "-y", "-v", "error",
  "-f", "lavfi", "-i", `color=c=0x173b5e:s=640x360:r=${frameRate}`,
  "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
  "-frames:v", String(sourceFrames),
  "-c:v", "libx264", "-preset", "ultrafast", "-crf", "35", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "64k", "-shortest",
  "-metadata", "title=Course 22 synthetic source",
  cameraPath,
]);
run("ffmpeg", [
  "-y", "-v", "error",
  "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
  "-t", "60.06", "-c:a", "pcm_s16le",
  "-metadata", "title=Course 22 synthetic room audio",
  audioPath,
]);
writeFileSync(renderFilterPath, [
  "[0:v]trim=start_frame=0:end_frame=750,setpts=PTS-STARTPTS[v0];",
  "[0:a]atrim=start=0:end=25.025,asetpts=PTS-STARTPTS[a0];",
  "[0:v]trim=start_frame=900:end_frame=1650,setpts=PTS-STARTPTS[v1];",
  "[0:a]atrim=start=30.03:end=55.055,asetpts=PTS-STARTPTS[a1];",
  "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]",
  "",
].join("\n"));
const candidateCommandArgs = [
  "-nostdin", "-y", "-v", "error", "-i", "assets/camera-a.mp4",
  "-filter_complex_script", renderFilterRelativePath,
  "-map", "[v]", "-map", "[a]",
  "-c:v", "libx264", "-preset", "ultrafast", "-crf", "35", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "64k",
  "-metadata", "title=Course 22 controlled candidate render",
  "outputs/candidate-render.mp4",
];
run("ffmpeg", candidateCommandArgs, projectRoot);
run("ffmpeg", [
  "-y", "-v", "error", "-i", candidatePath,
  "-vf", "scale=1920:1080:flags=fast_bilinear",
  "-c:v", "libx264", "-preset", "ultrafast", "-crf", "37", "-pix_fmt", "yuv420p",
  "-c:a", "copy", "-metadata", "title=Course 22 horizontal review variant",
  horizontalPath,
]);
run("ffmpeg", [
  "-y", "-v", "error", "-i", candidatePath,
  "-vf", "scale=1080:608:flags=fast_bilinear,pad=1080:1920:0:656:color=black",
  "-c:v", "libx264", "-preset", "ultrafast", "-crf", "37", "-pix_fmt", "yuv420p",
  "-c:a", "copy", "-metadata", "title=Course 22 captioned vertical review variant",
  verticalPath,
]);

writeFileSync(path.join(outputsRoot, "review-captioned.vtt"), [
  "WEBVTT",
  "",
  "00:00:00.000 --> 00:00:24.900",
  "This fictional workshop introduces a careful local repair sequence.",
  "",
  "00:00:25.000 --> 00:00:49.900",
  "Disconnect the imaginary tool before the fictional safety demonstration.",
  "",
].join("\n"));

const camera = fileRecord("assets/camera-a.mp4");
const roomAudio = fileRecord("assets/room-audio.wav");
const renderFilter = fileRecord(renderFilterRelativePath);
const candidate = fileRecord("outputs/candidate-render.mp4");
const horizontal = fileRecord("outputs/review-1080p.mp4");
const vertical = fileRecord("outputs/review-captioned.mp4");
const captions = fileRecord("outputs/review-captioned.vtt");
const cameraProbe = probe(camera.relativePath);
const audioProbe = probe(roomAudio.relativePath);
const candidateProbe = probe(candidate.relativePath);
const horizontalProbe = probe(horizontal.relativePath);
const verticalProbe = probe(vertical.relativePath);

writeJson("assets/camera-a.probe.json", {
  schemaVersion: "aicourse.ffprobe-receipt.v2",
  assetId: "camera-a",
  assetPath: camera.relativePath,
  assetSha256: camera.sha256,
  ...cameraProbe,
  projectTimebase: frameRate,
  networkUsed: false,
});
writeJson("assets/room-audio.probe.json", {
  schemaVersion: "aicourse.ffprobe-receipt.v2",
  assetId: "room-audio",
  assetPath: roomAudio.relativePath,
  assetSha256: roomAudio.sha256,
  ...audioProbe,
  projectTimebase: frameRate,
  networkUsed: false,
});

const mediaManifest = readJson(artifactFiles["media-manifest"]);
mediaManifest.payload.assets = [
  {
    assetId: "camera-a",
    ...camera,
    mediaKind: "video/mp4",
    owner: "AI Course fixture governance team",
    rightsStatus: "approved-for-declared-use",
    consentStatus: "not-applicable-synthetic",
    intakeDecision: "eligible-for-declared-edit",
  },
  {
    assetId: "room-audio",
    ...roomAudio,
    mediaKind: "audio/wav",
    owner: "AI Course fixture governance team",
    rightsStatus: "approved-for-declared-use",
    consentStatus: "not-applicable-synthetic",
    intakeDecision: "eligible-for-declared-edit",
  },
];
mediaManifest.limitations = [
  "Read-only paths and matching hashes establish byte identity only against this course baseline.",
  "The playable source is course-authored synthetic media; fixity does not prove authenticity, ownership truth, consent, or C2PA provenance.",
];

const creativeBrief = readJson(artifactFiles["creative-brief"]);
creativeBrief.limitations = [
  "The course-owned fixture uses playable synthetic video, tone audio, and fictional text rather than personal or third-party media.",
  "A validated creative brief demonstrates contract structure and never grants external publication authority.",
];

const clockReceipt = readJson(artifactFiles["clock-receipt"]);
clockReceipt.payload.assetClocks = [
  {
    assetId: "camera-a",
    startFrame: 0,
    durationFrames: sourceFrames,
    probeReceiptPath: "assets/camera-a.probe.json",
    probeReceiptSha256: sha256(path.join(assetsRoot, "camera-a.probe.json")),
  },
  {
    assetId: "room-audio",
    startFrame: 0,
    durationFrames: sourceFrames,
    probeReceiptPath: "assets/room-audio.probe.json",
    probeReceiptSha256: sha256(path.join(assetsRoot, "room-audio.probe.json")),
  },
];
clockReceipt.limitations = [
  "The receipt binds committed ffprobe observations to actual course-owned playable source bytes.",
  "Frame normalization resolves the project clock but does not certify editorial meaning or publication readiness.",
];

const editPlan = readJson(artifactFiles["edit-plan"]);
editPlan.payload.inputAssetHashes = {
  "camera-a": camera.sha256,
  "room-audio": roomAudio.sha256,
};

const transcriptShotIndex = readJson(artifactFiles["transcript-shot-index"]);
transcriptShotIndex.payload.transcriptSegments[2].startFrame = 1650;
transcriptShotIndex.payload.transcriptSegments[2].endFrame = 1790;
transcriptShotIndex.payload.shots[2].startFrame = 1650;
transcriptShotIndex.payload.shots[2].endFrame = 1790;
transcriptShotIndex.payload.evidenceIndex[2].startFrame = 1650;
transcriptShotIndex.payload.evidenceIndex[2].endFrame = 1790;

const renderReceipt = readJson(artifactFiles["render-receipt"]);
renderReceipt.payload.command = [
  "ffmpeg", ...candidateCommandArgs,
];
renderReceipt.payload.filterScript = renderFilter;
renderReceipt.payload.environment = {
  engine: "ffmpeg",
  version: candidateProbe.toolVersion,
  codeDirected: true,
  inputsLocked: true,
  determinismClaim: "not-claimed",
};
renderReceipt.payload.output = {
  ...candidate,
  format: "mp4",
  probe: {
    ...candidateProbe,
    sourceSha256: candidate.sha256,
  },
};
renderReceipt.limitations = [
  "This is a real playable CPU FFmpeg render generated from course-owned synthetic media without network access.",
  "Code-directed execution is recorded, but deterministic equivalence is not claimed across unlocked FFmpeg builds or environments.",
];

const deliveryMatrix = readJson(artifactFiles["delivery-matrix"]);
deliveryMatrix.payload.finalDeliveryVariantId = "review-captioned";
deliveryMatrix.payload.renderSourceSha256 = candidate.sha256;
deliveryMatrix.payload.variants = [
  {
    variantId: "review-1080p",
    deliveryTargetId: "review-1080p",
    container: "mp4",
    video: { width: 1920, height: 1080, frameRate },
    audio: { profile: "EBU-R128-training-profile", scope: "course-review-only-not-universal" },
    captions: {
      standard: "WebVTT-WCAG-review",
      humanReviewRequired: true,
      sidecarPath: null,
      sidecarSha256: null,
    },
    outputPath: horizontal.relativePath,
  },
  {
    variantId: "review-captioned",
    deliveryTargetId: "review-captioned",
    container: "mp4",
    video: { width: 1080, height: 1920, frameRate },
    audio: { profile: "EBU-R128-training-profile", scope: "course-review-only-not-universal" },
    captions: {
      standard: "WebVTT-WCAG-review",
      humanReviewRequired: true,
      sidecarPath: captions.relativePath,
      sidecarSha256: captions.sha256,
    },
    outputPath: vertical.relativePath,
  },
];
deliveryMatrix.limitations = [
  "The EBU R128 label is a scoped instructional profile and is not a universal platform requirement.",
  "The playable variants and WebVTT bytes are hash-bound, but a named human must still review words, timing, cues, reading speed, and audiovisual meaning.",
];

const variantReceipts = readJson(artifactFiles["variant-receipts"]);
variantReceipts.payload.receipts = [
  {
    variantId: "review-1080p",
    outputPath: horizontal.relativePath,
    sha256: horizontal.sha256,
    byteLength: horizontal.byteLength,
    probe: { ...horizontalProbe, sourceSha256: horizontal.sha256 },
    captionReview: "human-reviewed-fixture",
    audioReview: "scoped-profile-reviewed",
    technicalPass: true,
  },
  {
    variantId: "review-captioned",
    outputPath: vertical.relativePath,
    sha256: vertical.sha256,
    byteLength: vertical.byteLength,
    probe: { ...verticalProbe, sourceSha256: vertical.sha256 },
    captionReview: "human-reviewed-fixture",
    audioReview: "scoped-profile-reviewed",
    technicalPass: true,
  },
];
variantReceipts.limitations = [
  "Variant hashes and ffprobe fields bind actual playable course-owned bytes but do not establish editorial truth or publication fitness.",
  "Human-reviewed-fixture labels describe course authorship and cannot authenticate an external reviewer identity or review quality.",
];

const verificationReport = readJson(artifactFiles["verification-report"]);
delete verificationReport.payload.finalHumanDecision;
verificationReport.payload.technicalChecks = [
  {
    checkId: "frame-boundary-check",
    status: "pass",
    evidence: "2 selected ranges stay inside their hash-bound source clocks; maximum declared source duration is 1800 frames.",
  },
  {
    checkId: "timeline-arithmetic-check",
    status: "pass",
    evidence: "2 sequential selections produce exactly 1500 frames without overlap or gaps.",
  },
  {
    checkId: "variant-fixity-check",
    status: "pass",
    evidence: "2 variant receipt hashes and ffprobe records match their actual playable output bytes.",
  },
];
verificationReport.payload.semanticReview.notes =
  "The selected fictional introduction and safety sequence retain the declared chronology in the exact playable candidate.";
verificationReport.payload.accessibilityReview.notes =
  "The playable variants retain a named human caption review requirement, WebVTT sidecar, and scoped audio profile.";
verificationReport.payload.rightsReview.notes =
  "Every referenced playable media byte is course-authored synthetic material approved for local instructional review only.";
verificationReport.payload.candidateReview = {
  reviewerName: "Course fixture reviewer",
  reviewerRole: "Instructional candidate review boundary",
  reviewedAt: "2026-08-28T09:26:00+08:00",
  disposition: "blocked-before-release-decision",
  reason: "The guided project demonstrates validation but never carries learner publication authority.",
  candidateSha256: vertical.sha256,
  notAgentGenerated: true,
};
verificationReport.limitations = [
  "Layered checks cover real course-owned synthetic media but do not establish the quality, truth, rights, or legality of learner media.",
  "M9 records candidate review only; the sole publish or do-not-publish decision belongs to a fresh learner M10 package.",
];

const updates = {
  "creative-brief": creativeBrief,
  "media-manifest": mediaManifest,
  "clock-receipt": clockReceipt,
  "transcript-shot-index": transcriptShotIndex,
  "edit-plan": editPlan,
  "render-receipt": renderReceipt,
  "delivery-matrix": deliveryMatrix,
  "variant-receipts": variantReceipts,
  "verification-report": verificationReport,
};
for (const [artifactId, artifact] of Object.entries(updates)) {
  writeJson(artifactFiles[artifactId], artifact);
}

const artifactHashes = {};
for (const [artifactId, relativePath] of Object.entries(artifactFiles)) {
  const artifact = readJson(relativePath);
  artifact.projectId = projectId;
  artifact.parents = Object.fromEntries(
    artifactInputs[artifactId].map((parentId) => [parentId, artifactHashes[parentId]]),
  );
  if (artifactId === "render-receipt") {
    artifact.payload.editPlanArtifactSha256 = artifactHashes["edit-plan"];
    artifact.payload.toolPolicyArtifactSha256 = artifactHashes["tool-permission-envelope"];
  }
  if (artifactId === "variant-receipts") {
    artifact.payload.deliveryMatrixArtifactSha256 = artifactHashes["delivery-matrix"];
  }
  if (artifactId === "verification-report") {
    artifact.payload.artifactHashes = {
      deliveryMatrix: artifactHashes["delivery-matrix"],
      variantReceipts: artifactHashes["variant-receipts"],
    };
  }
  writeJson(relativePath, artifact);
  artifactHashes[artifactId] = sha256(path.join(projectRoot, relativePath));
}

const ledgerFiles = [
  ...Object.values(artifactFiles),
  camera.relativePath,
  roomAudio.relativePath,
  "assets/camera-a.probe.json",
  "assets/room-audio.probe.json",
  renderFilterRelativePath,
  candidate.relativePath,
  horizontal.relativePath,
  vertical.relativePath,
  captions.relativePath,
];
writeJson("guided-project.ledger.json", {
  schemaVersion: "aicourse.agentic-video-editing.guided-project-ledger.v2",
  projectId,
  courseId: "agentic-video-editing",
  courseVersion: "2.0.0",
  timebase: frameRate,
  deliveryTargetIds: ["review-1080p", "review-captioned"],
  files: Object.fromEntries(ledgerFiles.map((relativePath) => [
    relativePath,
    sha256(path.join(projectRoot, relativePath)),
  ])),
  boundary: "This ledger binds course-authored playable synthetic media, exact artifacts, and ffprobe evidence for offline learning; it does not authenticate a reviewer or grant publication approval.",
});

const archiveInventory = [...ledgerFiles, "guided-project.ledger.json"].sort();
const actualInventory = listRelativeRegularFiles(projectRoot).sort();
if (JSON.stringify(actualInventory) !== JSON.stringify(archiveInventory)) {
  const expected = new Set(archiveInventory);
  const actual = new Set(actualInventory);
  const extras = actualInventory.filter((relativePath) => !expected.has(relativePath));
  const missing = archiveInventory.filter((relativePath) => !actual.has(relativePath));
  throw new Error(
    `Guided fixture inventory drift (extra=${extras.join(",") || "none"}; missing=${missing.join(",") || "none"})`,
  );
}

const labRoot = path.resolve(projectRoot, "../..");
const archivePath = path.join(labRoot, "course22-guided-v2.zip");
const archiveTimestamp = new Date("2026-08-28T00:00:00Z");
function lockArchiveTimestamps(directory) {
  for (const name of readdirSync(directory)) {
    const absolutePath = path.join(directory, name);
    if (lstatSync(absolutePath).isDirectory()) lockArchiveTimestamps(absolutePath);
    utimesSync(absolutePath, archiveTimestamp, archiveTimestamp);
  }
}
lockArchiveTimestamps(projectRoot);
utimesSync(projectRoot, archiveTimestamp, archiveTimestamp);
rmSync(archivePath, { force: true });
const archived = spawnSync("zip", [
  "-X", "-q", archivePath,
  ...archiveInventory.map((relativePath) => `fixtures/guided-v2/${relativePath}`),
], {
  cwd: labRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
if (archived.status !== 0) {
  throw new Error(`zip failed (${archived.status}): ${archived.stderr || archived.stdout}`);
}

console.log(`Generated Course 22 guided media fixture at ${projectRoot}`);
console.log(`Ledger SHA-256: ${sha256(path.join(projectRoot, "guided-project.ledger.json"))}`);
console.log(`Starter archive SHA-256: ${sha256(archivePath)}`);
