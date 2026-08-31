#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import {
  COURSE20_BILINGUAL_EDITORIAL_SURFACE_SCHEMA,
  COURSE20_HUMAN_REVIEW_SCOPE,
  COURSE20_HUMAN_SIGNOFF_DECISION,
  COURSE20_HUMAN_SIGNOFF_IDENTITY_BASIS,
  COURSE20_HUMAN_SIGNOFF_IDENTITY_BOUNDARY,
  COURSE20_HUMAN_SIGNOFF_STATUS,
  createCourse20BilingualEditorialSnapshot,
  createCourse20HumanSignoffFingerprint,
} from "./course20-bilingual-editorial-surface.mjs";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = join(
  REPOSITORY_ROOT,
  "staging/course-assets/agentic-video-editing",
);
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");

const issues = [];
const notes = [];
const staleReceiptReasons = [];

function add(gate, message) {
  issues.push({ gate, message });
}

function staleReceipt(message) {
  staleReceiptReasons.push(message);
}

function readJson(path, gate = "assets") {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    add(gate, `${relative(REPOSITORY_ROOT, path)}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function requireRegularFile(path, gate = "files") {
  const label = relative(REPOSITORY_ROOT, path);
  if (!existsSync(path)) {
    add(gate, `${label}: missing.`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    add(gate, `${label}: expected a regular, non-symbolic file.`);
    return false;
  }
  return true;
}

function validateProvenanceManifest(path, baseRoot) {
  if (!requireRegularFile(path, "integrity")) return;
  const manifest = readJson(path, "integrity");
  if (!manifest || !Array.isArray(manifest.files)) {
    add("integrity", `${relative(REPOSITORY_ROOT, path)}: files[] is required.`);
    return;
  }
  const seen = new Set();
  for (const record of manifest.files) {
    if (!record || typeof record.path !== "string"
      || typeof record.sha256 !== "string") {
      add("integrity", `${relative(REPOSITORY_ROOT, path)}: malformed file record.`);
      continue;
    }
    if (seen.has(record.path)) {
      add("integrity", `${relative(REPOSITORY_ROOT, path)}: duplicate ${record.path}.`);
    }
    seen.add(record.path);
    const target = join(baseRoot, record.path);
    if (!requireRegularFile(target, "integrity")) continue;
    const digest = sha256File(target);
    if (digest !== record.sha256) {
      add("integrity", `${relative(REPOSITORY_ROOT, target)}: SHA-256 ${digest} differs from ${record.sha256}.`);
    }
    if (Number.isInteger(record.byteLength)
      && lstatSync(target).size !== record.byteLength) {
      add("integrity", `${relative(REPOSITORY_ROOT, target)}: byte length differs from manifest.`);
    }
  }
}

function validateSchemas() {
  const schemaNames = [
    "artifact-submission.schema.json",
    "delivery-contract.schema.json",
    "edit-plan.schema.json",
    "edit-plan-v3.schema.json",
  ];
  for (const name of schemaNames) {
    const path = join(PUBLIC_ROOT, name);
    if (!requireRegularFile(path, "schemas")) continue;
    const schema = readJson(path, "schemas");
    if (!schema) continue;
    try {
      const ajv = new Ajv2020({ allErrors: true, strict: true });
      ajv.compile(schema);
    } catch (error) {
      add("schemas", `${name}: strict Draft 2020-12 compilation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function validateVercelContract() {
  const path = join(REPOSITORY_ROOT, "vercel.json");
  const config = readJson(path, "release");
  if (!config) return;
  if (config.buildCommand !== "npm run build:release") {
    add("release", "vercel.json buildCommand must be npm run build:release.");
  }
  if (config.outputDirectory !== "out") {
    add("release", "vercel.json outputDirectory must be out.");
  }
  const pkg = readJson(join(REPOSITORY_ROOT, "package.json"), "release");
  if (!pkg?.scripts) return;
  const expectedReleaseGate = [
    "npm run release-manifest:assert",
    "node --import tsx scripts/check-agentic-video-editing-course.mjs --release",
    "npm run agentic-video-editing:artifact-check",
    "npm run agentic-video-editing:unit",
    "npm run agentic-video-editing:lab-check",
  ];
  const releaseGate = String(
    pkg.scripts["agentic-video-editing:check:release"] ?? "",
  ).split(/\s*&&\s*/u);
  if (JSON.stringify(releaseGate) !== JSON.stringify(expectedReleaseGate)) {
    add("release", "Course 20 release-gate order must be content/release → artifact → unit → lab exactly once.");
  }
  for (const scriptName of ["build", "build:release"]) {
    const steps = String(pkg.scripts[scriptName] ?? "").split(/\s*&&\s*/u);
    const buildIndex = steps.indexOf("next build");
    const pruneIndex = steps.indexOf("npm run export:prune-blocked");
    if (buildIndex < 0 || pruneIndex <= buildIndex) {
      add("release", `${scriptName}: next build must be followed by the blocked-export pruning gate.`);
    }
    const sourceGate = scriptName === "build"
      ? "npm run courses:check:development"
      : "npm run verify:source";
    const sourceGateIndex = steps.indexOf(sourceGate);
    if (sourceGateIndex < 0 || sourceGateIndex > buildIndex) {
      add("release", "build: development course gates must run before next build.");
    }
  }
}

function validateReports() {
  const required = [
    "evidence/course-audits/course20-agentic-video-editing-research.md",
    "evidence/course-audits/course20-agentic-video-editing-research.provenance.md",
    "evidence/course-audits/course20-content-verification-2026-08-26.md",
    "evidence/course-audits/course20-content-verification-2026-08-26.provenance.md",
    "evidence/course-audits/course20-first-principles-audit-fix-2026-08-28.md",
    "evidence/course-audits/course20-branch-integration-handoff-2026-08-28.md",
    "evidence/course-audits/course20-source-claim-ledger-2026-08-28.md",
    "evidence/course-audits/course20-bilingual-review-receipt-2026-08-28.json",
    "evidence/course-audits/course20-post-commit-audit-2026-08-28.md",
  ];
  for (const file of required) requireRegularFile(join(REPOSITORY_ROOT, file), "reports");
  const handoffPath = join(
    REPOSITORY_ROOT,
    "evidence/course-audits/course20-branch-integration-handoff-2026-08-28.md",
  );
  if (existsSync(handoffPath)) {
    const handoff = readFileSync(handoffPath, "utf8");
    for (const token of [
      "codex/course-20-agentic-video-editing",
      "codex/course-20-first-principles-fix",
      "codex/complete-course-roadmap",
      "Deep Learning",
      "Courses 16–19",
      "stop integration",
    ]) {
      if (!handoff.includes(token)) {
        add("reports", `Integration handoff is missing ${JSON.stringify(token)}.`);
      }
    }
  }
  const receiptPath = join(
    REPOSITORY_ROOT,
    "evidence/course-audits/course20-bilingual-review-receipt-2026-08-28.json",
  );
  if (existsSync(receiptPath)) {
    const receipt = readJson(receiptPath, "reports");
    const expectedFiles = {
      englishCopy: "staging/course-src/agentic-video-editing/copy/en.ts",
      zhHansCopy: "staging/course-src/agentic-video-editing/copy/zh-Hans.ts",
      bindingCode: "staging/course-src/agentic-video-editing/copy/bind-options.ts",
      assessmentContract: "staging/course-src/agentic-video-editing/assessment-contract.ts",
    };
    if (receipt?.schemaVersion
        !== "aicourse.course20.bilingual-review-receipt.v2"
      || receipt?.courseVersion !== "1.2.0"
      || receipt?.reviewedOn !== "2026-08-28"
      || receipt?.machineParity?.status !== "pass"
      || receipt?.machineParity?.digestAlgorithm !== "sha256-file-bytes") {
      staleReceipt("receipt identity, date, or digest algorithm drifted");
    }
    const receiptFiles = receipt?.machineParity?.files ?? {};
    if (JSON.stringify(Object.keys(receiptFiles))
      !== JSON.stringify(Object.keys(expectedFiles))) {
      staleReceipt("receipt source-file inventory drifted");
    }
    for (const [id, path] of Object.entries(expectedFiles)) {
      if (receiptFiles[id]?.path !== path
        || receiptFiles[id]?.sha256 !== sha256File(join(REPOSITORY_ROOT, path))) {
        staleReceipt(`receipt path or hash drifted for ${path}`);
      }
    }
    const currentEditorialSurface = createCourse20BilingualEditorialSnapshot();
    const storedEditorialSurface = receipt?.machineParity?.editorialSurface;
    if (storedEditorialSurface?.schemaVersion
        !== COURSE20_BILINGUAL_EDITORIAL_SURFACE_SCHEMA
      || storedEditorialSurface?.digestAlgorithm
        !== currentEditorialSurface.digestAlgorithm
      || storedEditorialSurface?.sha256 !== currentEditorialSurface.sha256
      || storedEditorialSurface?.fileCount !== currentEditorialSurface.fileCount
      || JSON.stringify(storedEditorialSurface?.roots)
        !== JSON.stringify(currentEditorialSurface.roots)
      || JSON.stringify(storedEditorialSurface?.files)
        !== JSON.stringify(currentEditorialSurface.files)
      || JSON.stringify(storedEditorialSurface?.fileHashes)
        !== JSON.stringify(currentEditorialSurface.fileHashes)) {
      staleReceipt("receipt does not bind the current private Course 20 editorial inventory");
    }
    const signoff = receipt?.humanEditorialSignoff ?? {};
    const expectedReviewedHashes = {
      reviewedEnglishSha256: receiptFiles.englishCopy?.sha256,
      reviewedZhHansSha256: receiptFiles.zhHansCopy?.sha256,
      reviewedBindingCodeSha256: receiptFiles.bindingCode?.sha256,
      reviewedAssessmentContractSha256:
        receiptFiles.assessmentContract?.sha256,
    };
    if (signoff.status !== COURSE20_HUMAN_SIGNOFF_STATUS
      || typeof signoff.reviewerName !== "string"
      || signoff.reviewerName.trim().length === 0
      || typeof signoff.reviewerRole !== "string"
      || signoff.reviewerRole.trim().length === 0
      || signoff.identityBasis !== COURSE20_HUMAN_SIGNOFF_IDENTITY_BASIS
      || signoff.identityVerificationBoundary
        !== COURSE20_HUMAN_SIGNOFF_IDENTITY_BOUNDARY
      || typeof signoff.signedAt !== "string"
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(signoff.signedAt)
      || Number.isNaN(Date.parse(signoff.signedAt))
      || signoff.blockingForPublicProductionPromotion !== false) {
      staleReceipt("human signoff identity or promotion-boundary fields drifted");
    }
    for (const [hashField, expectedHash] of Object.entries(expectedReviewedHashes)) {
      if (signoff[hashField] !== expectedHash) {
        staleReceipt(`human signoff is stale or unbound at ${hashField}`);
      }
    }
    if (signoff.reviewedEditorialSurfaceSchemaVersion
        !== currentEditorialSurface.schemaVersion
      || signoff.reviewedEditorialSurfaceSha256
        !== currentEditorialSurface.sha256
      || signoff.reviewedEditorialFileCount
        !== currentEditorialSurface.fileCount) {
      staleReceipt("human signoff is stale for the complete Course 20 editorial inventory");
    }
    if (JSON.stringify(signoff.reviewScope)
        !== JSON.stringify(COURSE20_HUMAN_REVIEW_SCOPE)
      || !signoff.attestationSource?.includes("人工审核全部通过")
      || receipt?.decision !== COURSE20_HUMAN_SIGNOFF_DECISION
      || signoff.signoffMetadataFingerprint
        !== createCourse20HumanSignoffFingerprint(signoff)) {
      staleReceipt("human signoff scope, provenance, identity boundary, or no-deployment decision drifted");
    }
  }
  if (staleReceiptReasons.length > 0) {
    const message = `human-provenance-receipt-stale: ${staleReceiptReasons.join("; ")}`;
    if (RELEASE) add("human-provenance-receipt-stale", message);
    else notes.push({ gate: "human-provenance-receipt-stale", message });
  }
  const currentReports = [
    "evidence/course-audits/course20-first-principles-audit-fix-2026-08-28.md",
    "evidence/course-audits/course20-post-commit-audit-2026-08-28.md",
  ];
  for (const reportFile of currentReports) {
    const reportPath = join(REPOSITORY_ROOT, reportFile);
    if (!existsSync(reportPath)) continue;
    const report = readFileSync(reportPath, "utf8");
    for (const token of [
      "1.2.0",
      "13 process",
      "12 Capstone",
      "M6",
      "M7",
      "not committed",
      "not deployed",
    ]) {
      if (!report.includes(token)) {
        add("reports", `${reportFile} is missing current audit token ${JSON.stringify(token)}.`);
      }
    }
  }
}

function validatePublicSurface() {
  const required = [
    "NOTICE.md",
    "artifact-submission.schema.json",
    "delivery-contract.schema.json",
    "edit-plan.schema.json",
    "edit-plan-v3.schema.json",
    "fixtures.provenance.json",
    "qc-checklist.md",
    "lab/fixture-manifest.v1.json",
    "lab/frozen-media-receipt.v1.json",
    "lab/frozen/course20-original-fixture.mp4",
    "lab/frozen/course20-fault-reel.mp4",
    "lab/project-spec.v2.json",
    "lab/failure-ledger.v1.json",
  ];
  for (const file of required) {
    requireRegularFile(join(PUBLIC_ROOT, file), "assets");
  }
  validateProvenanceManifest(
    join(PUBLIC_ROOT, "fixtures.provenance.json"),
    PUBLIC_ROOT,
  );
  validateProvenanceManifest(
    join(PUBLIC_ROOT, "lab/fixture-manifest.v1.json"),
    PUBLIC_ROOT,
  );
  const noticePath = join(PUBLIC_ROOT, "NOTICE.md");
  if (existsSync(noticePath)) {
    const notice = readFileSync(noticePath, "utf8");
    for (const token of [
      "project-authored",
      "no personal data",
      "no third-party media",
      "do-not-publish",
      "learner-owned",
    ]) {
      if (!notice.toLowerCase().includes(token.toLowerCase())) {
        add("rights", `NOTICE.md is missing ${JSON.stringify(token)}.`);
      }
    }
  }
}

let course = null;
try {
  course = await import("../staging/course-src/agentic-video-editing/index.ts");
  for (const validationIssue of course.validateAgenticVideoEditingCourse()) {
    add("course-definition", validationIssue);
  }
} catch (error) {
  add(
    "course-definition",
    `Course module import failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
  );
}

validateSchemas();
validatePublicSurface();
validateReports();
if (RELEASE) validateVercelContract();

const counts = course
  ? {
    phases: course.AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.phases.length,
    modules: course.AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.length,
    coreMinutes: course.AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.reduce(
      (sum, moduleRecord) => sum + moduleRecord.minutes,
      0,
    ),
    builderMinutes: course.AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.reduce(
      (sum, moduleRecord) => sum + moduleRecord.extensionMinutes,
      0,
    ),
    artifacts: course.AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.length,
    claims: course.AGENTIC_VIDEO_EDITING_CLAIMS.length,
    sources: course.AGENTIC_VIDEO_EDITING_SOURCES.length,
    github: course.AGENTIC_VIDEO_EDITING_SOURCES.filter(
      (source) => source.kind === "github-repository",
    ).length,
    xPosts: course.AGENTIC_VIDEO_EDITING_SOURCES.filter(
      (source) => source.kind === "x-post",
    ).length,
    official: course.AGENTIC_VIDEO_EDITING_SOURCES.filter(
      (source) => source.kind !== "github-repository"
        && source.kind !== "x-post",
    ).length,
    questions: course.AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions.length,
    criticalControls: course.AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions.filter(
      (question) => question.criticalControlId,
    ).length,
  }
  : {
    phases: 0,
    modules: 0,
    coreMinutes: 0,
    builderMinutes: 0,
    artifacts: 0,
    claims: 0,
    sources: 0,
    github: 0,
    xPosts: 0,
    official: 0,
    questions: 0,
    criticalControls: 0,
  };

const result = {
  schemaVersion: 2,
  courseId: "agentic-video-editing",
  courseVersion: course?.AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version ?? null,
  mode: RELEASE ? "release" : "content",
  status: issues.length ? "fail" : "pass",
  reviewedOn: "2026-08-28",
  blockingForPublicProductionPromotion: staleReceiptReasons.length > 0,
  blockers: staleReceiptReasons.length > 0
    ? ["human-provenance-receipt-stale"]
    : [],
  counts,
  issues,
  notes,
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify(result, null, 2));
} else if (issues.length) {
  console.error(`Course 20 ${result.mode} gate: FAIL (${issues.length})`);
  for (const item of issues) console.error(`- [${item.gate}] ${item.message}`);
  if (notes.length) {
    console.error("Notes:");
    for (const item of notes) console.error(`- [${item.gate}] ${item.message}`);
  }
} else {
  console.log(`Course 20 ${result.mode} gate: PASS`);
  console.log(JSON.stringify(counts));
  for (const item of notes) console.log(`- [${item.gate}] ${item.message}`);
}

process.exitCode = issues.length ? 1 : 0;
