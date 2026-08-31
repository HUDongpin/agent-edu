#!/usr/bin/env node

/**
 * Deterministic, offline content and release gate for Course 19.
 *
 *   node --import tsx scripts/check-math-animation-course.mjs
 *   node --import tsx scripts/check-math-animation-course.mjs --release
 *   node --import tsx scripts/check-math-animation-course.mjs --release --json
 */

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_ID = "math-animation";
const SNAPSHOT_DATE = "2026-08-26";
const EXPECTED_POSTER_SHA256 =
  "d194cbae12680e5014c82177239e5b0f179707be7290b4cc8bb373e8b64a8f98";
const EXPECTED_POSTER_WIDTH = 1536;
const EXPECTED_POSTER_HEIGHT = 1024;
const EXPECTED_SOURCE_COUNT = 23;
const EXPECTED_REPOSITORY_COUNT = 9;
const EXPECTED_ASSESSMENT_COUNT = 8;
const EXPECTED_CAPSTONE_ARTIFACTS = 6;
const EXPECTED_EVIDENCE_MODES = [
  "source-grounded",
  "engineering-synthesis",
  "version-watch",
];
const EXPECTED_LOCALES = [
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
const EXPECTED_MODULE_SLUGS = [
  "outcome-before-engine",
  "repository-evidence-lab",
  "scene-contract-storyboard",
  "manim-environment-first-scene",
  "transformations-camera-continuity",
  "equations-graphs-geometry",
  "codex-implementation-loop",
  "claude-direction-review",
  "motion-canvas-web-track",
  "voice-slides-remotion",
  "mathematical-visual-accessibility-qa",
  "capstone-release-pack",
];
const STARTER_KIT_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "LICENSE",
  "README.md",
  "SCENE_CONTRACT.md",
  "SOURCE_SNAPSHOT.json",
  "TRANSCRIPT.md",
  "export.sh",
  "manim/math_truth.py",
  "manim/scene.py",
  "manim/test_math_truth.py",
  "motion-canvas/unit-circle.tsx",
];
const LOCK_ID_BY_SOURCE_ID = new Map([
  ["github-manim-ce", "manim-community"],
  ["github-manimgl", "manimgl"],
  ["github-manim-slides", "manim-slides"],
  ["github-manim-voiceover", "manim-voiceover"],
  ["github-motion-canvas", "motion-canvas"],
  ["github-remotion", "remotion"],
  ["github-remotion-skills", "remotion-skills"],
  ["github-mafs", "mafs"],
  ["github-jsxgraph", "jsxgraph"],
]);
const SCORE_LIMITS = {
  mathSemantics: 20,
  deterministicTimeline: 15,
  agentReadable: 15,
  iterationPreview: 10,
  renderOutput: 10,
  maintenance: 10,
  licenseClarity: 10,
  accessibility: 5,
  ecosystem: 5,
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function add(issues, gate, message) {
  issues.push({ gate, message });
}

function hasDirectXStatusUrl(url) {
  return /^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(url);
}

function repositoryRevision(source) {
  return source.versionOrRevision.match(/\b[0-9a-f]{40}\b/i)?.[0]?.toLowerCase();
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(path, issues, gate, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    add(issues, gate, `${label}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return null;
  }
}

function regularFile(root, path, issues, gate = "files") {
  const resolved = resolve(root, path);
  if (!existsSync(resolved)) {
    add(issues, gate, `${path}: required file is missing`);
    return false;
  }
  const stat = lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    add(issues, gate, `${path}: expected a regular, non-symbolic file`);
    return false;
  }
  return true;
}

function readText(root, path, issues, gate = "files") {
  return regularFile(root, path, issues, gate)
    ? readFileSync(resolve(root, path), "utf8")
    : "";
}

function requireTokens(root, path, tokens, issues, gate) {
  const text = readText(root, path, issues, gate);
  for (const token of tokens) {
    if (!text.includes(token)) add(issues, gate, `${path}: missing ${JSON.stringify(token)}`);
  }
  return text;
}

function importFresh(path) {
  const url = pathToFileURL(path);
  url.searchParams.set("math-animation-check", `${Date.now()}-${Math.random()}`);
  return import(url.href);
}

function sourceCounts(sources) {
  return {
    github: sources.filter((source) => source.kind === "github-repository").length,
    xPosts: sources.filter((source) => source.kind === "x-post").length,
    officialDocumentation: sources.filter(
      (source) => source.kind === "official-documentation",
    ).length,
  };
}

function approximatelyEqual(actual, expected, tolerance = 0.02) {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
}

function svgElementAttributes(svg, tagName, id, findings) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const element = svg.match(new RegExp(`<${tagName}\\b(?=[^>]*\\bid="${escapedId}")[^>]*>`, "s"));
  if (!element) {
    findings.push(`missing <${tagName} id="${id}">`);
    return null;
  }
  return Object.fromEntries(
    [...element[0].matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
  );
}

function numericAttribute(attributes, name, label, findings) {
  const value = Number(attributes?.[name]);
  if (!attributes || attributes[name] === undefined || !Number.isFinite(value)) {
    findings.push(`${label}: ${name} must be a finite number`);
    return Number.NaN;
  }
  return value;
}

function expectCoordinate(actual, expected, label, findings) {
  if (!approximatelyEqual(actual, expected)) {
    findings.push(`${label}: expected ${expected.toFixed(6)}, found ${String(actual)}`);
  }
}

/**
 * Validate the poster as a mathematical artifact rather than trusting its caption.
 * The same theta must determine the unit-circle point, sine point, projections,
 * and timeline marker; the sampled graph must use a uniform linear x-axis and
 * equal positive/negative amplitudes.
 */
export function validateMathPosterSvg(svg) {
  const findings = [];
  if (/<image\b/i.test(svg) || /(?:href|src)="https?:\/\//i.test(svg)) {
    findings.push("poster must be self-contained vector geometry without raster or remote assets");
  }
  if (/<(?:script|foreignObject)\b/i.test(svg) || /\son[a-z]+\s*=/i.test(svg)) {
    findings.push("poster must not contain executable SVG content or event handlers");
  }
  if (/\s(?:href|xlink:href)\s*=\s*["']/i.test(svg)) {
    findings.push("poster must not contain linked resources");
  }

  const root = svgElementAttributes(svg, "svg", "math-poster", findings);
  const width = numericAttribute(root, "width", "math-poster", findings);
  const height = numericAttribute(root, "height", "math-poster", findings);
  const theta = numericAttribute(root, "data-theta-radians", "math-poster", findings);
  const thetaMin = numericAttribute(root, "data-theta-min", "math-poster", findings);
  const thetaMax = numericAttribute(root, "data-theta-max", "math-poster", findings);
  const expectedSamples = numericAttribute(root, "data-samples", "math-poster", findings);
  if (width !== EXPECTED_POSTER_WIDTH || height !== EXPECTED_POSTER_HEIGHT) {
    findings.push(`math-poster: expected ${EXPECTED_POSTER_WIDTH}x${EXPECTED_POSTER_HEIGHT}, found ${width}x${height}`);
  }
  if (root?.viewBox !== `0 0 ${EXPECTED_POSTER_WIDTH} ${EXPECTED_POSTER_HEIGHT}`) {
    findings.push(`math-poster: expected viewBox="0 0 ${EXPECTED_POSTER_WIDTH} ${EXPECTED_POSTER_HEIGHT}"`);
  }
  expectCoordinate(thetaMin, 0, "math-poster theta minimum", findings);
  expectCoordinate(thetaMax, 2 * Math.PI, "math-poster theta maximum", findings);
  if (!(theta >= thetaMin && theta <= thetaMax)) findings.push("math-poster: selected theta is outside the graph domain");

  const unitCircle = svgElementAttributes(svg, "circle", "unit-circle", findings);
  const circlePoint = svgElementAttributes(svg, "circle", "unit-circle-point", findings);
  const angleRay = svgElementAttributes(svg, "line", "unit-angle-ray", findings);
  const sineAxis = svgElementAttributes(svg, "line", "sine-x-axis", findings);
  const sinePoint = svgElementAttributes(svg, "circle", "sine-graph-point", findings);
  const valueProjection = svgElementAttributes(svg, "line", "sine-value-projection", findings);
  const thetaProjection = svgElementAttributes(svg, "line", "theta-projection", findings);
  const timelineAxis = svgElementAttributes(svg, "line", "timeline-axis", findings);
  const timelineMarker = svgElementAttributes(svg, "line", "timeline-marker", findings);
  const sineCurve = svgElementAttributes(svg, "polyline", "sine-curve", findings);

  const centerX = numericAttribute(unitCircle, "cx", "unit-circle", findings);
  const centerY = numericAttribute(unitCircle, "cy", "unit-circle", findings);
  const radius = numericAttribute(unitCircle, "r", "unit-circle", findings);
  const graphStart = numericAttribute(sineAxis, "x1", "sine-x-axis", findings);
  const baseline = numericAttribute(sineAxis, "y1", "sine-x-axis", findings);
  const graphEnd = numericAttribute(sineAxis, "x2", "sine-x-axis", findings);
  const axisEndY = numericAttribute(sineAxis, "y2", "sine-x-axis", findings);
  expectCoordinate(centerY, baseline, "shared circle/graph baseline", findings);
  expectCoordinate(axisEndY, baseline, "horizontal sine axis", findings);
  if (!(radius > 0) || !(graphEnd > graphStart)) findings.push("poster geometry requires positive radius and graph span");

  const expectedCircleX = centerX + radius * Math.cos(theta);
  const expectedValueY = centerY - radius * Math.sin(theta);
  const expectedGraphX = graphStart
    + ((theta - thetaMin) / (thetaMax - thetaMin)) * (graphEnd - graphStart);
  const circleX = numericAttribute(circlePoint, "cx", "unit-circle-point", findings);
  const circleY = numericAttribute(circlePoint, "cy", "unit-circle-point", findings);
  const graphX = numericAttribute(sinePoint, "cx", "sine-graph-point", findings);
  const graphY = numericAttribute(sinePoint, "cy", "sine-graph-point", findings);
  expectCoordinate(circleX, expectedCircleX, "unit-circle point x = cx + r cos(theta)", findings);
  expectCoordinate(circleY, expectedValueY, "unit-circle point y = cy - r sin(theta)", findings);
  expectCoordinate(graphX, expectedGraphX, "sine point linear theta mapping", findings);
  expectCoordinate(graphY, expectedValueY, "sine point y = baseline - r sin(theta)", findings);

  for (const [attributes, expected, label] of [
    [angleRay, [centerX, centerY, circleX, circleY], "unit-angle-ray"],
    [valueProjection, [circleX, circleY, graphX, graphY], "sine-value-projection"],
  ]) {
    ["x1", "y1", "x2", "y2"].forEach((name, index) => {
      expectCoordinate(numericAttribute(attributes, name, label, findings), expected[index], `${label} ${name}`, findings);
    });
  }

  const timelineY = numericAttribute(timelineAxis, "y1", "timeline-axis", findings);
  expectCoordinate(numericAttribute(timelineAxis, "x1", "timeline-axis", findings), graphStart, "timeline start", findings);
  expectCoordinate(numericAttribute(timelineAxis, "x2", "timeline-axis", findings), graphEnd, "timeline end", findings);
  expectCoordinate(numericAttribute(timelineAxis, "y2", "timeline-axis", findings), timelineY, "horizontal timeline", findings);
  expectCoordinate(numericAttribute(thetaProjection, "x1", "theta-projection", findings), graphX, "theta projection x1", findings);
  expectCoordinate(numericAttribute(thetaProjection, "y1", "theta-projection", findings), graphY, "theta projection y1", findings);
  expectCoordinate(numericAttribute(thetaProjection, "x2", "theta-projection", findings), graphX, "theta projection x2", findings);
  expectCoordinate(numericAttribute(thetaProjection, "y2", "theta-projection", findings), timelineY, "theta projection timeline y", findings);
  expectCoordinate(numericAttribute(timelineMarker, "x1", "timeline-marker", findings), graphX, "timeline marker x1", findings);
  expectCoordinate(numericAttribute(timelineMarker, "x2", "timeline-marker", findings), graphX, "timeline marker x2", findings);

  const points = String(sineCurve?.points ?? "").trim().split(/\s+/).filter(Boolean).map((point) => {
    const [x, y, extra] = point.split(",").map(Number);
    return { x, y, valid: extra === undefined && Number.isFinite(x) && Number.isFinite(y) };
  });
  if (!Number.isInteger(expectedSamples) || points.length !== expectedSamples) {
    findings.push(`sine-curve: expected ${expectedSamples} uniformly sampled points, found ${points.length}`);
  }
  const sampleDenominator = points.length - 1;
  points.forEach((point, index) => {
    if (!point.valid || sampleDenominator <= 0) {
      findings.push(`sine-curve sample ${index}: invalid coordinate`);
      return;
    }
    const sampleTheta = thetaMin + ((thetaMax - thetaMin) * index) / sampleDenominator;
    const expectedX = graphStart + ((graphEnd - graphStart) * index) / sampleDenominator;
    const expectedY = baseline - radius * Math.sin(sampleTheta);
    expectCoordinate(point.x, expectedX, `sine-curve sample ${index} linear x`, findings);
    expectCoordinate(point.y, expectedY, `sine-curve sample ${index} sin(theta)`, findings);
  });
  if (points.length > 2 && points.every((point) => point.valid)) {
    const yValues = points.map((point) => point.y);
    const positiveAmplitude = baseline - Math.min(...yValues);
    const negativeAmplitude = Math.max(...yValues) - baseline;
    expectCoordinate(positiveAmplitude, radius, "sine-curve positive amplitude", findings);
    expectCoordinate(negativeAmplitude, radius, "sine-curve negative amplitude", findings);
    expectCoordinate(positiveAmplitude, negativeAmplitude, "sine-curve amplitude symmetry", findings);
  }

  return findings;
}

function inspectPoster(root, issues) {
  const posterPath = "public/courses/math-animation/posters/unit-circle-sine-keyframes.svg";
  const retiredPosterPath = "public/courses/math-animation/posters/unit-circle-sine-keyframes.png";
  if (existsSync(resolve(root, retiredPosterPath))) {
    add(issues, "poster", `${retiredPosterPath}: inaccurate retired raster must not remain publicly served`);
  }
  if (!regularFile(root, posterPath, issues, "poster")) return;
  const poster = readFileSync(resolve(root, posterPath), "utf8");
  for (const finding of validateMathPosterSvg(poster)) add(issues, "poster", `${posterPath}: ${finding}`);
  const actualHash = sha256(poster);
  if (actualHash !== EXPECTED_POSTER_SHA256) {
    add(issues, "poster", `${posterPath}: SHA-256 ${actualHash} does not match the deterministic-asset ledger`);
  }
  const notice = readText(root, "public/courses/math-animation/NOTICE.md", issues, "rights");
  for (const token of [
    EXPECTED_POSTER_SHA256,
    "deterministic SVG",
    "same theta",
    "does not vendor",
  ]) {
    if (!notice.includes(token)) add(issues, "rights", `NOTICE.md: missing ${JSON.stringify(token)}`);
  }
  for (const forbidden of ["built-in image-generation tool", "generated poster is illustrative"]) {
    if (notice.includes(forbidden)) add(issues, "rights", `NOTICE.md: stale poster provenance ${JSON.stringify(forbidden)}`);
  }
  requireTokens(root, "evidence/course-audits/math-animation-course-research-brief.provenance.md", [
    "public/courses/math-animation/posters/unit-circle-sine-keyframes.svg",
    EXPECTED_POSTER_SHA256,
    "self-contained deterministic SVG",
    "129 uniformly spaced samples",
    "no generative image tool",
  ], issues, "rights");
}

function inspectStarterKit(root, issues, repositories) {
  const base = "public/courses/math-animation/starter-kit";
  for (const path of STARTER_KIT_FILES) regularFile(root, `${base}/${path}`, issues, "starter-kit");

  requireTokens(root, `${base}/README.md`, [
    "does not vendor Manim",
    "1dc796e9652273950d9863b35746c7329888e384",
    "manim/test_math_truth.py",
    "manim/math_truth.py",
    "TRANSCRIPT.md",
    "one downloadable ZIP",
    "SOURCE_SNAPSHOT.json",
    "LICENSE",
    "low quality",
    "eight deterministic state checks (five positive checkpoints and three negative samples)",
  ], issues, "starter-kit");
  const starterReadme = readText(root, `${base}/README.md`, issues, "starter-kit");
  if (!/(?:did not claim final video export|no final Motion Canvas video export is claimed)/i.test(starterReadme)) {
    add(issues, "starter-kit", `${base}/README.md: missing the Motion Canvas no-final-export boundary`);
  }
  requireTokens(root, `${base}/AGENTS.md`, [
    "Never introduce `manimgl`",
    "Run `manim/test_math_truth.py`",
    "Render low quality",
    "Do not add a dependency",
    "Do not print or store credentials",
    "SOURCE_SNAPSHOT.json",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/CLAUDE.md`, [
    "does not use ManimGL",
    "mathematical test",
    "Inspect start, quarter, midpoint, three-quarter, and final frames",
    "provides context",
    "provide enforcement",
    "SOURCE_SNAPSHOT.json",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/SCENE_CONTRACT.md`, [
    "positive `h` decreases from `2` to `0.08` and `h` never equals `0`",
    "two-sided limit",
    "Secant slope",
    "same tracker",
    "within `0.01`",
    "rights status",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/TRANSCRIPT.md`, [
    "Static equivalent",
    "h` starts at `2` and decreases to `0.08` without ever becoming zero",
    "2 + h",
    "do not replace the separate keyframe",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/manim/scene.py`, [
    "from manim import *",
    "from math_truth import format_slope, function, secant_state",
    "ValueTracker(2.0)",
    "Line(",
    "config.frame_width = config.frame_height * config.pixel_width / config.pixel_height",
    "vertical = config.pixel_height > config.pixel_width",
    "set_value(0.08)",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/manim/math_truth.py`, [
    "CHECKPOINTS = (2.0, 1.0, 0.5, 0.1, 0.08)",
    "if h == 0",
    "def secant_state",
    "def format_slope",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/manim/test_math_truth.py`, [
    "from math_truth import CHECKPOINTS, format_slope, secant_state",
    "for checkpoint in (*CHECKPOINTS, -0.08, -0.5, -1.0)",
    "line_slope",
    "displayed_value",
    "isclose",
    'print("mathematical invariant: pass")',
  ], issues, "starter-kit");
  requireTokens(root, `${base}/export.sh`, [
    "set -eu",
    "Input video not found",
    "-map 0:v:0",
    "-pix_fmt yuv420p",
    "-update 1",
    "$output_dir/keyframes/$name.png",
    "ffprobe -v error",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/motion-canvas/unit-circle.tsx`, [
    "makeScene2D",
    "createSignal(0)",
    "Math.cos(angle())",
    "Math.sin(angle())",
  ], issues, "starter-kit");
  requireTokens(root, `${base}/LICENSE`, [
    "MIT License",
    "Copyright (c) 2026 HU Dongpin",
    "THE SOFTWARE IS PROVIDED \"AS IS\"",
  ], issues, "starter-kit");
  const starterLicense = readText(root, `${base}/LICENSE`, issues, "starter-kit");
  const projectLicense = readText(root, "LICENSE", issues, "starter-kit");
  if (starterLicense && projectLicense && sha256(starterLicense) !== sha256(projectLicense)) {
    add(issues, "starter-kit", `${base}/LICENSE: packaged license differs from the project license`);
  }
  const sourceSnapshot = readJson(
    resolve(root, `${base}/SOURCE_SNAPSHOT.json`),
    issues,
    "starter-kit",
    "SOURCE_SNAPSHOT.json",
  );
  if (
    !isRecord(sourceSnapshot)
    || sourceSnapshot.courseId !== COURSE_ID
    || sourceSnapshot.capturedOn !== SNAPSHOT_DATE
    || !Array.isArray(sourceSnapshot.dependencies)
    || sourceSnapshot.dependencies.length !== 2
    || sourceSnapshot.courseFiles?.thirdPartyCodeVendored !== false
    || sourceSnapshot.courseFiles?.thirdPartyMediaIncluded !== false
  ) {
    add(issues, "starter-kit", `${base}/SOURCE_SNAPSHOT.json: self-contained pin or rights contract is invalid`);
  }
  if (isRecord(sourceSnapshot) && Array.isArray(sourceSnapshot.dependencies)) {
    for (const [sourceId, dependencyName] of [
      ["github-manim-ce", "Manim Community"],
      ["github-motion-canvas", "Motion Canvas"],
    ]) {
      const dependency = sourceSnapshot.dependencies.find((candidate) => candidate?.name === dependencyName);
      const repository = repositories.find((candidate) => candidate.sourceId === sourceId);
      if (!dependency || !repository || dependency.revision !== repository.testedRevision) {
        add(issues, "starter-kit", `${base}/SOURCE_SNAPSHOT.json: ${dependencyName} pin differs from the evaluated revision`);
      }
    }
    const manimSnapshot = sourceSnapshot.dependencies.find((candidate) => candidate?.name === "Manim Community");
    const expectedManimNotices = [
      "https://github.com/ManimCommunity/manim/blob/1dc796e9652273950d9863b35746c7329888e384/LICENSE",
      "https://github.com/ManimCommunity/manim/blob/1dc796e9652273950d9863b35746c7329888e384/LICENSE.community",
    ];
    if (
      manimSnapshot?.licenseEvidence
        !== "https://github.com/ManimCommunity/manim/blob/1dc796e9652273950d9863b35746c7329888e384/README.md#license"
      || JSON.stringify(manimSnapshot?.licenseNotices) !== JSON.stringify(expectedManimNotices)
    ) {
      add(issues, "starter-kit", `${base}/SOURCE_SNAPSHOT.json: Manim Community's two-notice MIT trail is incomplete`);
    }
  }

  for (const path of STARTER_KIT_FILES) {
    const absolute = resolve(root, base, path);
    if (!existsSync(absolute) || !lstatSync(absolute).isFile()) continue;
    const text = readFileSync(absolute, "utf8");
    const forbidden = [
      [/\bsk-[A-Za-z0-9_-]{12,}\b/, "an API-key-shaped token"],
      [/(?:^|[\s("'`])\/(?:Users|home|private\/tmp)\/[^\s"'`]+/m, "an absolute workstation path"],
      [/BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/, "a private key"],
      [/(?:password|api[_-]?key|secret|token)\s*[:=]\s*["'][^"']+["']/i, "a hard-coded credential"],
    ];
    for (const [pattern, label] of forbidden) {
      if (pattern.test(text)) add(issues, "starter-kit", `${base}/${path}: contains ${label}`);
    }
  }

  const archivePath = `${base}.zip`;
  if (regularFile(root, archivePath, issues, "starter-kit")) {
    const archiveBuffer = readFileSync(resolve(root, archivePath));
    const archiveEntries = readZipEntries(
      archiveBuffer,
      issues,
      archivePath,
    );
    const expectedEntries = [...STARTER_KIT_FILES].sort();
    const actualEntries = [...archiveEntries.keys()].sort();
    if (JSON.stringify(actualEntries) !== JSON.stringify(expectedEntries)) {
      add(
        issues,
        "starter-kit",
        `${archivePath}: archive file list differs from the public starter directory (${actualEntries.join(", ")})`,
      );
    }
    for (const path of STARTER_KIT_FILES) {
      const archived = archiveEntries.get(path);
      const sourcePath = resolve(root, base, path);
      if (!archived || !existsSync(sourcePath)) continue;
      if (sha256(archived) !== sha256(readFileSync(sourcePath))) {
        add(issues, "starter-kit", `${archivePath}: ${path} does not match the public starter directory`);
      }
    }
    const archiveHash = sha256(archiveBuffer);
    const notice = readText(root, "public/courses/math-animation/NOTICE.md", issues, "rights");
    if (!notice.includes(archiveHash)) {
      add(issues, "rights", `NOTICE.md: starter-kit.zip SHA-256 ${archiveHash} is not recorded`);
    }
  }

  const lockPath = resolve(root, "public/courses/math-animation/repository-lock.json");
  if (!regularFile(root, "public/courses/math-animation/repository-lock.json", issues, "repository-lock")) return;
  const lock = readJson(lockPath, issues, "repository-lock", "repository-lock.json");
  if (!isRecord(lock)) return;
  if (lock.schemaVersion !== 1 || lock.courseId !== COURSE_ID || lock.courseNumber !== 19) {
    add(issues, "repository-lock", "repository-lock.json: schema, course ID, or course number drifted");
  }
  if (lock.snapshotOn !== SNAPSHOT_DATE) {
    add(issues, "repository-lock", `repository-lock.json: snapshotOn must be ${SNAPSHOT_DATE}`);
  }
  if (!Array.isArray(lock.repositories) || lock.repositories.length !== EXPECTED_REPOSITORY_COUNT) {
    add(issues, "repository-lock", `repository-lock.json: expected ${EXPECTED_REPOSITORY_COUNT} repository pins`);
    return;
  }
  const lockIds = lock.repositories.map((record) => record?.id);
  if (new Set(lockIds).size !== lockIds.length) add(issues, "repository-lock", "repository-lock.json: duplicate repository IDs");

  for (const repository of repositories) {
    const lockId = LOCK_ID_BY_SOURCE_ID.get(repository.sourceId);
    const record = lock.repositories.find((candidate) => candidate?.id === lockId);
    if (!record) {
      add(issues, "repository-lock", `${repository.sourceId}: missing ${String(lockId)} lock record`);
      continue;
    }
    if (!/^https:\/\/github\.com\/.+\.git$/.test(String(record.clone))) {
      add(issues, "repository-lock", `${record.id}: clone must be a public HTTPS GitHub URL`);
    }
    if (record.revision !== repository.testedRevision) {
      add(issues, "repository-lock", `${record.id}: revision does not match the evaluated revision`);
    }
    if (!String(record.smoke).includes(repository.smokeStatus)) {
      add(issues, "repository-lock", `${record.id}: smoke boundary does not match ${repository.smokeStatus}`);
    }
    if (!String(record.license).trim()) add(issues, "repository-lock", `${record.id}: license boundary is empty`);
    if (JSON.stringify(record.githubSnapshot) !== JSON.stringify(repository.adoptionSnapshot)) {
      add(issues, "repository-lock", `${record.id}: GitHub adoption snapshot does not match the evaluated repository record`);
    }
    const snapshot = repository.adoptionSnapshot;
    if (!Number.isInteger(snapshot.stars) || snapshot.stars < 0) {
      add(issues, "repository-lock", `${record.id}: stars must be a non-negative integer`);
    }
    if (snapshot.capturedOn !== SNAPSHOT_DATE || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.defaultBranchHeadDate)) {
      add(issues, "repository-lock", `${record.id}: GitHub snapshot date or head date is invalid`);
    }
    if ((snapshot.latestRelease === null) !== (snapshot.latestReleasePublishedOn === null)) {
      add(issues, "repository-lock", `${record.id}: latest release and publication date must both be present or both be null`);
    }
  }
  const manimLock = lock.repositories.find((record) => record?.id === "manim-community");
  if (
    manimLock?.licenseEvidence
      !== "https://github.com/ManimCommunity/manim/blob/1dc796e9652273950d9863b35746c7329888e384/README.md#license"
    || !Array.isArray(manimLock?.licenseNotices)
    || manimLock.licenseNotices.length !== 2
    || !manimLock.licenseNotices.some((url) => String(url).endsWith("/LICENSE"))
    || !manimLock.licenseNotices.some((url) => String(url).endsWith("/LICENSE.community"))
  ) {
    add(issues, "repository-lock", "manim-community: two-notice MIT evidence trail is incomplete");
  }
  const jsxGraphLock = lock.repositories.find((record) => record?.id === "jsxgraph");
  if (jsxGraphLock?.license !== "MIT OR LGPL-3.0-or-later") {
    add(issues, "repository-lock", "jsxgraph: SPDX license choice must be MIT OR LGPL-3.0-or-later");
  }
}

function readZipEntries(buffer, issues, label) {
  const entries = new Map();
  const minimumEnd = Math.max(0, buffer.length - 65_557);
  let endOffset = -1;
  for (let offset = buffer.length - 22; offset >= minimumEnd; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) {
    add(issues, "starter-kit", `${label}: ZIP end-of-central-directory record is missing`);
    return entries;
  }
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let offset = buffer.readUInt32LE(endOffset + 16);
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      add(issues, "starter-kit", `${label}: invalid central-directory entry ${index + 1}`);
      return entries;
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    offset += 46 + nameLength + extraLength + commentLength;

    if (!name || name.startsWith("/") || name.includes("\\") || name.split("/").includes("..")) {
      add(issues, "starter-kit", `${label}: unsafe archive path ${JSON.stringify(name)}`);
      continue;
    }
    const unixMode = externalAttributes >>> 16;
    if ((unixMode & 0o170000) === 0o120000) {
      add(issues, "starter-kit", `${label}: symbolic-link entry is forbidden (${name})`);
      continue;
    }
    if (name.endsWith("/")) continue;
    if (entries.has(name)) {
      add(issues, "starter-kit", `${label}: duplicate archive entry ${name}`);
      continue;
    }
    if ((flags & 0x1) !== 0) {
      add(issues, "starter-kit", `${label}: encrypted archive entry is forbidden (${name})`);
      continue;
    }
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      add(issues, "starter-kit", `${label}: invalid local header for ${name}`);
      continue;
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let content;
    try {
      content = method === 0
        ? compressed
        : method === 8
          ? inflateRawSync(compressed)
          : null;
    } catch (error) {
      add(issues, "starter-kit", `${label}: cannot inflate ${name} (${error instanceof Error ? error.message : String(error)})`);
      continue;
    }
    if (!content) {
      add(issues, "starter-kit", `${label}: unsupported compression method ${method} for ${name}`);
      continue;
    }
    if (content.length !== uncompressedSize) {
      add(issues, "starter-kit", `${label}: uncompressed size mismatch for ${name}`);
      continue;
    }
    entries.set(name, content);
  }
  return entries;
}

function inspectRoutesAndComponents(root, issues, courseModule, release) {
  const routeRoot = release
    ? "app/[locale]/math-animation"
    : "app/[locale]/_blocked/math-animation";
  const required = [
    `${routeRoot}/page.tsx`,
    `${routeRoot}/[module]/page.tsx`,
    "components/math-animation/AnimationPreview.tsx",
    "components/math-animation/CourseDashboard.tsx",
    "components/math-animation/Interactions.tsx",
    "components/math-animation/MathAnimationCourse.module.css",
    "components/math-animation/ModuleView.tsx",
    "components/math-animation/PipelineMap.tsx",
    "components/math-animation/SourceTraceLinks.tsx",
    "components/math-animation/VisualWorkbench.module.css",
    "components/math-animation/progress-store.ts",
    "evidence/course-audits/math-animation-course-research-brief.md",
    "evidence/course-audits/math-animation-course-research-brief.provenance.md",
    "tests/math-animation-playwright.config.ts",
  ];
  for (const path of required) regularFile(root, path, issues, "files");

  requireTokens(root, `${routeRoot}/page.tsx`, [
    "dynamicParams = false",
    "generateStaticParams",
    "MATH_ANIMATION_LOCALES.map",
    "MATH_ANIMATION_TRANSLATED_LOCALES",
    "canonicalLocale: course.contentLocale",
    'courseCode: "19"',
    "assertValidMathAnimationCourse",
    "<CourseDashboard",
  ], issues, "routes");
  requireTokens(root, `${routeRoot}/[module]/page.tsx`, [
    "dynamicParams = false",
    "MATH_ANIMATION_MODULE_SLUGS.map",
    "isMathAnimationModuleSlug",
    "canonicalLocale: course.contentLocale",
    'courseCode: "19"',
    "assertValidMathAnimationCourse",
    "<ModuleView",
  ], issues, "routes");
  requireTokens(root, "components/math-animation/CourseDashboard.tsx", [
    'data-testid="math-animation-course"',
    "<AnimationPreview",
    "<CourseProgress",
    "<FinalAssessment",
    "<CapstoneChecklist",
    "/courses/math-animation/posters/unit-circle-sine-keyframes.svg",
  ], issues, "components");
  requireTokens(root, "components/math-animation/ModuleView.tsx", [
    "data-testid={`math-animation-module-${module.slug}`}",
    "<ModuleCheckpoint",
    "<ModuleEvidenceGate",
    "<CourseProgress",
    "<SourceTraceDisclosure",
    "tabIndex={0}",
    'aria-labelledby="module-code-title"',
  ], issues, "components");
  requireTokens(root, "components/math-animation/SourceTraceLinks.tsx", [
    "source.versionAnchorUrl",
    "source.licenseUrl",
    "source.claimEvidenceUrls.map",
    "source.accessedOn",
    "SourceTraceDisclosure",
    'target="_blank"',
    'rel="noopener noreferrer"',
  ], issues, "components");
  requireTokens(root, "components/math-animation/Interactions.tsx", [
    "mathAnimationModuleArtifactEvidenceKey",
    "mathAnimationModuleVerificationEvidenceKey",
    "MATH_ANIMATION_QUIZ_PASS_PERCENT",
    "reconcileMathAnimationCapstone",
  ], issues, "components");
  requireTokens(root, "components/math-animation/progress-store.ts", [
    "normalizeMathAnimationProgress",
    "MATH_ANIMATION_PROGRESS_PREFIX",
    "MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY",
    "MATH_ANIMATION_CORRUPT_PROGRESS_BACKUP_KEY",
    "sessionStorage.setItem",
  ], issues, "progress");
  requireTokens(root, "tests/math-animation-playwright.config.ts", [
    'testMatch: "math-animation-course.spec.ts"',
    'name: "chromium"',
    "npm run preview:test",
    "MATH_ANIMATION_BASE_URL",
  ], issues, "browser-tests");

  for (const path of [
    "components/math-animation/MathAnimationCourse.module.css",
    "components/math-animation/VisualWorkbench.module.css",
  ]) {
    const css = readText(root, path, issues, "components");
    for (const token of ["focus-visible", "prefers-reduced-motion", "@media (max-width:"]) {
      if (!css.includes(token)) add(issues, "components", `${path}: missing ${token}`);
    }
  }

  const examples = requireTokens(root, "lib/math-animation/examples.ts", [
    "from math_truth import CHECKPOINTS, format_slope, secant_state",
    "moving_point.add_updater",
    "self.play(FadeIn(limit_statement))",
    "start:0.14 quarter:0.30 midpoint:0.50 three-quarter:0.72 final:0.96",
  ], issues, "examples");
  for (const forbidden of ["DecimalNumber(", "frames/%06d.png"]) {
    if (examples.includes(forbidden)) add(issues, "examples", `lib/math-animation/examples.ts: stale ${forbidden} path is forbidden`);
  }
  const exampleContracts = [
    ["manim-graph", "manim/scene.py"],
    ["qa-script", "manim/test_math_truth.py"],
  ];
  for (const [exampleId, starterPath] of exampleContracts) {
    const example = courseModule.MATH_ANIMATION_CODE_EXAMPLES[exampleId];
    const publicPath = `public/courses/math-animation/starter-kit/${starterPath}`;
    const publicCode = readText(root, publicPath, issues, "examples").trimEnd();
    if (example?.filename !== starterPath) {
      add(issues, "examples", `${exampleId}: visible filename must be ${starterPath}`);
    }
    if (example?.code !== publicCode) {
      add(issues, "examples", `${exampleId}: visible code drifted from ${publicPath}`);
    }
  }

  requireTokens(root, "evidence/course-audits/math-animation-course-research-brief.md", [
    "### GitHub adoption and activity snapshot",
    "### Capability and dependency trace",
    "### Score reconstruction",
    "DOCUMENTARY_ONLY",
    "Stars are adoption context, not evidence of effectiveness",
  ], issues, "research");
  requireTokens(root, "evidence/course-audits/math-animation-course-research-brief.provenance.md", [
    "GitHub's primary REST metadata",
    "## X provenance",
    "## Inference register",
    "## Reproduction boundary",
  ], issues, "research");
}

async function inspectSharedRelease(root, issues, courseModule) {
  const packagePath = resolve(root, "package.json");
  const pkg = regularFile(root, "package.json", issues, "release")
    ? readJson(packagePath, issues, "release", "package.json")
    : null;
  if (isRecord(pkg)) {
    const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};
    const expected = {
      "math-animation:check": "node --import tsx scripts/check-math-animation-course.mjs",
      "math-animation:static-check": "node scripts/check-math-animation-static.mjs",
      "test:math-animation": "playwright test --config tests/math-animation-playwright.config.ts --project=chromium --workers=1",
    };
    for (const [name, command] of Object.entries(expected)) {
      if (scripts[name] !== command) add(issues, "release", `package.json: ${name} is not wired to ${command}`);
    }
    if (!String(scripts["math-animation:check:release"] ?? "").includes(
      "node --import tsx scripts/check-math-animation-course.mjs --release",
    )) {
      add(issues, "release", "package.json: math-animation:check:release is incomplete");
    }
    if (!String(scripts.build ?? "").includes("courses:check:development")) {
      add(issues, "release", "package.json: build must use registry development gates");
    }
    if (
      !String(scripts["verify:source"] ?? "").includes("published:check:release")
      || !String(scripts["build:release"] ?? "").includes("verify:source")
    ) {
      add(issues, "release", "package.json: release build must use registry published gates");
    }
  }

  requireTokens(root, "README.md", [
    "Course: Mathematical Animation with Codex and Claude",
    "npm run math-animation:check",
    "npm run math-animation:check:release",
    "npm run math-animation:static-check",
    "npm run test:math-animation",
  ], issues, "release");

  const requiredMessageKeys = [
    "c.math-animation.title",
    "c.math-animation.blurb",
    "c.math-animation.level",
    "c.math-animation.meta",
    "cat.course19",
  ];
  for (const locale of EXPECTED_LOCALES) {
    const path = resolve(root, "messages", `${locale}.json`);
    if (!regularFile(root, `messages/${locale}.json`, issues, "release")) continue;
    const messages = readJson(path, issues, "release", `messages/${locale}.json`);
    if (!isRecord(messages)) continue;
    for (const key of requiredMessageKeys) {
      if (typeof messages[key] !== "string" || !messages[key].trim()) {
        add(issues, "release", `messages/${locale}.json: missing ${key}`);
      }
    }
  }

  try {
    const [{ TOP_LEVEL_COURSES, CATALOG_COURSES }, { PAGES }] = await Promise.all([
      importFresh(resolve(root, "lib/courses.ts")),
      importFresh(resolve(root, "lib/seo.ts")),
    ]);
    const top = TOP_LEVEL_COURSES.find((record) => record.id === COURSE_ID);
    const catalog = CATALOG_COURSES.find((record) => record.id === COURSE_ID);
    if (!top || top.displayNumber !== 19 || top.href !== "/math-animation/" || top.status !== "available") {
      add(issues, "release", "Course 19 is not an available, linkable TOP_LEVEL_COURSES record");
    } else {
      if (top.durationMinutes !== 805 || top.minutes !== 805) {
        add(issues, "release", "Course 19 top-level duration must remain 805 minutes");
      }
      if (typeof top.progress !== "function") add(issues, "release", "Course 19 top-level progress adapter is missing");
      if (top.progressEvent !== courseModule.MATH_ANIMATION_PROGRESS_EVENT) {
        add(issues, "release", "Course 19 top-level progress event is not the course event");
      }
    }
    if (!catalog || catalog.status !== "available" || catalog.href !== "/math-animation/" || catalog.displayNumber !== 19) {
      add(issues, "release", "Course 19 catalogue record is not available, numbered, and linkable");
    }
    const expectedPages = [
      "math-animation/",
      ...EXPECTED_MODULE_SLUGS.map((slug) => `math-animation/${slug}/`),
    ];
    for (const page of expectedPages) {
      if (!PAGES.includes(page)) add(issues, "release", `lib/seo.ts PAGES is missing ${page}`);
    }
  } catch (error) {
    add(issues, "release", `Shared course/SEO registry could not be imported: ${error instanceof Error ? error.message : String(error)}`);
  }

  requireTokens(root, "app/sitemap.ts", [
    "MATH_ANIMATION_TRANSLATED_LOCALES",
    'page === "math-animation/"',
    'page.startsWith("math-animation/")',
  ], issues, "release");
}

export async function checkMathAnimationCourse({
  projectRoot = DEFAULT_ROOT,
  release = false,
} = {}) {
  const root = resolve(projectRoot);
  const issues = [];
  const notes = [];
  let courseModule;
  try {
    courseModule = await importFresh(resolve(root, "lib/math-animation/index.ts"));
  } catch (error) {
    add(issues, "course-definition", `Course module could not be imported: ${error instanceof Error ? error.message : String(error)}`);
    return {
      schemaVersion: 1,
      courseId: COURSE_ID,
      mode: release ? "release" : "content",
      status: "fail",
      snapshot: SNAPSHOT_DATE,
      counts: {},
      issues,
      notes,
    };
  }

  const {
    MATH_ANIMATION_COURSE_MANIFEST: manifest,
    MATH_ANIMATION_MODULE_SLUGS: exportedSlugs,
    MATH_ANIMATION_REPOSITORIES: repositories,
    MATH_ANIMATION_SOURCES: sources,
    MATH_ANIMATION_TOTAL_MINUTES: totalMinutes,
    MATH_ANIMATION_TRANSLATED_LOCALES: translatedLocales,
    loadMathAnimationCourse,
    validateMathAnimationCourse,
  } = courseModule;

  try {
    for (const message of validateMathAnimationCourse()) {
      add(issues, "course-definition", `Course validator: ${message}`);
    }
  } catch (error) {
    add(issues, "course-definition", `Course validator threw: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (manifest.id !== COURSE_ID || manifest.displayNumber !== 19) {
    add(issues, "manifest", "Course 19 must use math-animation as its manifest ID");
  }
  if (manifest.version !== "1.0.0" || manifest.publishedOn !== SNAPSHOT_DATE) {
    add(issues, "manifest", `Course 19 must publish v1.0.0 on ${SNAPSHOT_DATE}`);
  }
  if (manifest.modules.length !== 12 || manifest.phases.length !== 4 || totalMinutes !== 805) {
    add(issues, "manifest", `Expected 4 phases, 12 modules, and 805 minutes; found ${manifest.phases.length}, ${manifest.modules.length}, and ${totalMinutes}`);
  }
  if (JSON.stringify([...exportedSlugs]) !== JSON.stringify(EXPECTED_MODULE_SLUGS)) {
    add(issues, "manifest", "Exported module order drifted from the independent Course 19 contract");
  }
  if (JSON.stringify(manifest.modules.map((courseModuleRecord) => courseModuleRecord.slug)) !== JSON.stringify(EXPECTED_MODULE_SLUGS)) {
    add(issues, "manifest", "Manifest module order drifted from the independent Course 19 contract");
  }
  if (JSON.stringify([...translatedLocales]) !== JSON.stringify(["en", "zh-Hans"])) {
    add(issues, "copy", "Course 19 may advertise only reviewed English and Simplified Chinese long-form copy");
  }

  let english;
  let chinese;
  try {
    [english, chinese] = await Promise.all([
      loadMathAnimationCourse("en"),
      loadMathAnimationCourse("zh-Hans"),
    ]);
  } catch (error) {
    add(issues, "copy", `Localized course materialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (english && chinese) {
    for (const [locale, course] of [["en", english], ["zh-Hans", chinese]]) {
      if (course.modules.length !== 12 || course.copy.assessment.length !== EXPECTED_ASSESSMENT_COUNT) {
        add(issues, "copy", `${locale}: expected 12 modules and ${EXPECTED_ASSESSMENT_COUNT} assessment questions`);
      }
      if (course.copy.capstone.artifacts.length !== EXPECTED_CAPSTONE_ARTIFACTS) {
        add(issues, "copy", `${locale}: capstone must contain ${EXPECTED_CAPSTONE_ARTIFACTS} artifacts`);
      }
      const attestationBoundary = course.copy.ui.capstoneAttestationBoundary.trim();
      if (
        attestationBoundary.length < 24
        || !/(?:browser|浏览器)/i.test(attestationBoundary)
        || !/(?:cannot|不能)/i.test(attestationBoundary)
      ) {
        add(issues, "copy", `${locale}: capstone attestation boundary is missing or too thin`);
      }
      for (const courseModuleRecord of course.modules) {
        const modes = courseModuleRecord.copy.sections.map((section) => section.evidenceMode);
        if (JSON.stringify(modes) !== JSON.stringify(EXPECTED_EVIDENCE_MODES)) {
          add(issues, "copy", `${locale}/${courseModuleRecord.slug}: evidence modes must be source-grounded, engineering-synthesis, and version-watch in order`);
        }
      }
    }
    const englishQuestionContract = english.copy.assessment.map((question) => [question.id, question.correctIndex]);
    const chineseQuestionContract = chinese.copy.assessment.map((question) => [question.id, question.correctIndex]);
    if (JSON.stringify(englishQuestionContract) !== JSON.stringify(chineseQuestionContract)) {
      add(issues, "copy", "English and Simplified Chinese assessment IDs or answer keys drifted");
    }
    if (english.copy.capstone.artifacts.length !== chinese.copy.capstone.artifacts.length) {
      add(issues, "copy", "English and Simplified Chinese capstone structure drifted");
    }
  }

  if (sources.length !== EXPECTED_SOURCE_COUNT) {
    add(issues, "sources", `Expected ${EXPECTED_SOURCE_COUNT} source records; found ${sources.length}`);
  }
  const counts = sourceCounts(sources);
  if (counts.github < 10 || counts.xPosts < 4 || counts.officialDocumentation < 6) {
    add(issues, "sources", `Source mix is too narrow: ${counts.github} GitHub, ${counts.xPosts} X, ${counts.officialDocumentation} official documentation`);
  }
  const sourceIds = new Set(sources.map((source) => source.id));
  if (sourceIds.size !== sources.length) add(issues, "sources", "Source IDs must be unique");
  for (const source of sources) {
    if (source.accessedOn !== SNAPSHOT_DATE) add(issues, "sources", `${source.id}: accessedOn must be ${SNAPSHOT_DATE}`);
    if (!source.claimEvidenceUrls.includes(source.url)) add(issues, "sources", `${source.id}: primary URL is absent from claimEvidenceUrls`);
    if (source.kind === "github-repository") {
      const revision = repositoryRevision(source);
      if (!revision) add(issues, "sources", `${source.id}: versionOrRevision lacks a full commit SHA`);
      if (!source.versionAnchorUrl || !/^https:\/\/github\.com\//.test(source.versionAnchorUrl)) {
        add(issues, "sources", `${source.id}: immutable GitHub version anchor is missing`);
      }
      if (!source.licenseUrl && !/no (?:repository-wide|standalone) license/i.test(source.licenseOrRights)) {
        add(issues, "sources", `${source.id}: license URL or explicit no-license boundary is required`);
      }
    }
    if (
      typeof source.licenseOrRightsZhHans !== "string"
      || source.licenseOrRightsZhHans.trim().length < 12
      || source.licenseOrRightsZhHans === source.licenseOrRights
    ) {
      add(issues, "sources", `${source.id}: Simplified Chinese rights boundary is missing or untranslated`);
    }
    if (source.kind === "x-post") {
      if (!hasDirectXStatusUrl(source.url)) add(issues, "sources", `${source.id}: primary URL is not a direct X status`);
      if (source.claimEvidenceUrls.some((url) => !hasDirectXStatusUrl(url))) {
        add(issues, "sources", `${source.id}: X evidence ledger contains a non-status URL`);
      }
      if (source.role !== "discovery-signal") add(issues, "sources", `${source.id}: X evidence must remain a discovery signal`);
      if (!/(?:does not|not |cannot|no |不能|不证明|不是)/i.test(`${source.boundary} ${source.boundaryZhHans}`)) {
        add(issues, "sources", `${source.id}: X record lacks an explicit non-inference boundary`);
      }
      if (!/(?:not embedded|not copied|not reused|not redistributed)/i.test(source.licenseOrRights)) {
        add(issues, "rights", `${source.id}: linked-only media boundary is missing`);
      }
    }
  }
  const videosGuidance = sources.find((source) => source.id === "github-3b1b-videos-claude");
  const videosLicenseUrl = "https://github.com/3b1b/videos/blob/674b966fbb6cf0307590d27744d186165e8b6a76/LICENSE.txt";
  if (
    !videosGuidance
    || videosGuidance.licenseUrl !== videosLicenseUrl
    || !videosGuidance.claimEvidenceUrls.includes(videosLicenseUrl)
    || !/CC BY-NC-SA 4\.0/.test(videosGuidance.licenseOrRights)
    || /no repository-wide license/i.test(videosGuidance.licenseOrRights)
  ) {
    add(issues, "rights", "github-3b1b-videos-claude: pinned CC BY-NC-SA 4.0 root license is missing or misstated");
  }

  if (english && chinese) {
    const usedSourceIds = new Set();
    const sourceKind = new Map(sources.map((source) => [source.id, source.kind]));
    for (const course of [english, chinese]) {
      for (const courseModuleRecord of course.modules) {
        for (const id of courseModuleRecord.sourceIds) usedSourceIds.add(id);
        for (const section of courseModuleRecord.copy.sections) {
          for (const id of section.sourceIds) usedSourceIds.add(id);
          if (section.sourceIds.some((id) => sourceKind.get(id) === "x-post") && section.evidenceMode === "source-grounded") {
            add(issues, "sources", `${course.contentLocale}/${courseModuleRecord.slug}: X evidence cannot control a source-grounded section`);
          }
        }
      }
    }
    for (const source of sources) {
      if (!usedSourceIds.has(source.id)) add(issues, "sources", `${source.id}: unused ledger entry pads the source count`);
    }
  }

  if (repositories.length !== EXPECTED_REPOSITORY_COUNT) {
    add(issues, "repository-score", `Expected ${EXPECTED_REPOSITORY_COUNT} evaluated repositories; found ${repositories.length}`);
  }
  if (new Set(repositories.map((repository) => repository.sourceId)).size !== repositories.length) {
    add(issues, "repository-score", "Repository evaluations must use unique source IDs");
  }
  for (const repository of repositories) {
    const source = sources.find((candidate) => candidate.id === repository.sourceId);
    if (!source || source.kind !== "github-repository") {
      add(issues, "repository-score", `${repository.sourceId}: evaluation is not backed by a GitHub source record`);
      continue;
    }
    const breakdownKeys = Object.keys(repository.breakdown).sort();
    const expectedKeys = Object.keys(SCORE_LIMITS).sort();
    if (JSON.stringify(breakdownKeys) !== JSON.stringify(expectedKeys)) {
      add(issues, "repository-score", `${repository.sourceId}: score breakdown keys drifted`);
      continue;
    }
    let total = 0;
    for (const [key, maximum] of Object.entries(SCORE_LIMITS)) {
      const score = repository.breakdown[key];
      if (!Number.isInteger(score) || score < 0 || score > maximum) {
        add(issues, "repository-score", `${repository.sourceId}: ${key} must be an integer from 0 to ${maximum}`);
      }
      total += score;
    }
    if (repository.score !== total || repository.score < 0 || repository.score > 100) {
      add(issues, "repository-score", `${repository.sourceId}: total ${repository.score} does not equal the bounded breakdown ${total}`);
    }
    if (!/^[0-9a-f]{40}$/.test(repository.testedRevision)) {
      add(issues, "repository-score", `${repository.sourceId}: testedRevision must be a full commit SHA`);
    }
    if (repositoryRevision(source) !== repository.testedRevision) {
      add(issues, "repository-score", `${repository.sourceId}: source and evaluation revisions differ`);
    }
    if (repository.smokeEvidence.trim().length < 80) {
      add(issues, "repository-score", `${repository.sourceId}: smoke evidence is too thin`);
    }
    for (const [englishKey, chineseKey] of [
      ["bestFor", "bestForZhHans"],
      ["primaryLimit", "primaryLimitZhHans"],
      ["smokeEvidence", "smokeEvidenceZhHans"],
    ]) {
      if (typeof repository[chineseKey] !== "string" || repository[chineseKey].trim().length < 20) {
        add(issues, "repository-score", `${repository.sourceId}: ${chineseKey} is too thin`);
      } else if (repository[chineseKey] === repository[englishKey]) {
        add(issues, "repository-score", `${repository.sourceId}: ${chineseKey} repeats the English record`);
      }
    }
  }
  const manim = repositories.find((repository) => repository.sourceId === "github-manim-ce");
  if (!manim || manim.verdict !== "core" || manim.score < 90 || manim.smokeStatus !== "rendered") {
    add(issues, "repository-score", "Manim Community must remain the rendered core recommendation with a score of at least 90");
  }
  const scoredIds = new Set(repositories.map((repository) => repository.sourceId));
  const intentionallyUnscored = sources
    .filter((source) => source.kind === "github-repository" && !scoredIds.has(source.id))
    .map((source) => source.id);
  if (JSON.stringify(intentionallyUnscored) !== JSON.stringify(["github-3b1b-videos-claude"])) {
    add(issues, "repository-score", `Unexpected unscored GitHub sources: ${intentionallyUnscored.join(", ") || "none"}`);
  }

  inspectPoster(root, issues);
  inspectStarterKit(root, issues, repositories);
  inspectRoutesAndComponents(root, issues, courseModule, release);
  if (release) await inspectSharedRelease(root, issues, courseModule);

  notes.push(`${manifest.phases.length} phases · ${manifest.modules.length} modules · ${totalMinutes} minutes`);
  notes.push(`${sources.length} sources · ${repositories.length} scored repositories · ${counts.xPosts} direct X records`);
  notes.push(`${EXPECTED_ASSESSMENT_COUNT}-question assessment at 80% · ${EXPECTED_CAPSTONE_ARTIFACTS}-artifact capstone`);

  return {
    schemaVersion: 1,
    courseId: COURSE_ID,
    mode: release ? "release" : "content",
    status: issues.length ? "fail" : "pass",
    snapshot: SNAPSHOT_DATE,
    counts: {
      phases: manifest.phases.length,
      modules: manifest.modules.length,
      minutes: totalMinutes,
      sources: sources.length,
      repositories: repositories.length,
      ...counts,
      questions: english?.copy.assessment.length ?? 0,
      capstoneArtifacts: english?.copy.capstone.artifacts.length ?? 0,
      starterKitFiles: STARTER_KIT_FILES.length,
    },
    issues,
    notes,
  };
}

export function formatMathAnimationCheck(result) {
  const lines = [
    `math animation course: ${result.status.toUpperCase()} (${result.mode})`,
    `${result.counts.modules ?? 0} modules · ${result.counts.minutes ?? 0} minutes · ${result.counts.sources ?? 0} sources · ${result.counts.repositories ?? 0} repository scores`,
  ];
  for (const note of result.notes) lines.push(`- ${note}`);
  for (const issue of result.issues) lines.push(`- [${issue.gate}] ${issue.message}`);
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const result = await checkMathAnimationCourse({
    release: process.argv.includes("--release"),
  });
  console.log(
    process.argv.includes("--json")
      ? JSON.stringify(result, null, 2)
      : formatMathAnimationCheck(result),
  );
  if (result.status !== "pass") process.exitCode = 1;
}
