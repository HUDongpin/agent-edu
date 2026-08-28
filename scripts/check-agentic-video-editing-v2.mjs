import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import {
  validateAgenticVideoEditingGuidedProject,
  validateAgenticVideoEditingLearnerFinal,
} from "../lib/agentic-video-editing/artifact-validation.ts";
import {
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  AGENTIC_VIDEO_EDITING_EN_COPY,
  AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256,
  AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONE_IDS,
  AGENTIC_VIDEO_EDITING_SOURCES,
  AGENTIC_VIDEO_EDITING_ZH_HANS_COPY,
  validateAgenticVideoEditingCourse,
} from "../lib/agentic-video-editing/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = join(ROOT, "public/courses/agentic-video-editing");
const GUIDED_ROOT = join(PUBLIC_ROOT, "lab/fixtures/guided-v2");
const GUIDED_LEDGER_SHA256 = "9f5c1feba951051d9147ccb4ace1a6b86cf36ade58de593e4739bbb5834cd02e";
const EXPECTED_MILESTONES = [
  "preflight",
  "agentic-editing-contract",
  "media-ingest-provenance",
  "transcripts-shots-index",
  "semantic-analysis-director",
  "declarative-edit-plan",
  "agent-tools-mcp",
  "deterministic-rendering",
  "captions-audio-formats",
  "verification-human-review",
  "readiness-quiz",
  "production-capstone",
];
const REQUIRED_SOURCE_KINDS = [
  "github-repository",
  "official-documentation",
  "open-standard",
  "legal-policy",
  "community-issue",
  "x-post",
];
const EXACT_PINS = {
  remotion: ["v4.0.518 (lightweight tag)", "ac804a72e09c97e79ae1bbae49f8a12e7beacd0c", null],
  montaj: ["v4.2.0 (lightweight tag)", "b63e46768029ffb12f6f06ff9432ac1a73403c9b", null],
  "timeline-studio": ["release tag v1.0.6 (lightweight); package.json name web-player version 1.0.0", "ed010e815a8b686e7cc0f349786a0af012764785", null],
  qcut: ["v2026.08.26.3", "a6ae6aed5d6546687d3b1c753a0195608b23d855", "e6432a83e48cb1f379661cfbb03d39358acb6b05"],
  velorn: ["v0.3.30", "05240b9aa971a24e19a51247ddae7fda919b1795", "535f2edda437e5b271b7ee9ff044a297c63ab18b"],
};
const TOP_PUBLIC_FILES = [
  "creative-brief.fixture.json",
  "media-manifest.fixture.json",
  "edit-plan.schema.json",
  "qc-checklist.md",
  "NOTICE.md",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const rel = (path) => relative(ROOT, path).split(sep).join("/");
const valueAfter = (flag) => {
  const index = process.argv.indexOf(flag);
  return index < 0 ? undefined : process.argv[index + 1];
};

function readJson(path, failures) {
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) {
    failures.push(`${rel(path)} must be a regular file`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${rel(path)} invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function localChecks(failures) {
  failures.push(...validateAgenticVideoEditingCourse());
  const manifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST;
  if (manifest.displayNumber !== 22 || manifest.version !== "2.0.0"
    || manifest.publishedOn !== "2026-08-28" || manifest.researchCutoff !== "2026-08-28") {
    failures.push("Course 22 identity/version/date contract drifted");
  }
  if (JSON.stringify(AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONE_IDS)
    !== JSON.stringify(EXPECTED_MILESTONES)) failures.push("12 milestone IDs/order drifted");
  if (AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256 !== GUIDED_LEDGER_SHA256) {
    failures.push(`preflight fixture ledger must equal guided ledger ${GUIDED_LEDGER_SHA256}`);
  }

  const guided = validateAgenticVideoEditingGuidedProject(GUIDED_ROOT, {
    validatedAt: "2026-08-28T00:00:00+08:00",
  });
  if (!guided.ok) failures.push(...guided.issues.map((issue) => `guided validator: ${issue}`));
  if (guided.fixtureLedgerSha256 !== GUIDED_LEDGER_SHA256) {
    failures.push(`guided ledger returned ${guided.fixtureLedgerSha256 ?? "nothing"}`);
  }
  for (const moduleRecord of manifest.modules.slice(0, 9)) {
    const receipts = guided.receiptArrays[moduleRecord.slug] ?? [];
    if (receipts.length !== moduleRecord.producesArtifactIds.length) {
      failures.push(`${moduleRecord.slug} guided receipt count does not match outputs`);
    }
  }

  for (const kind of REQUIRED_SOURCE_KINDS) {
    if (!AGENTIC_VIDEO_EDITING_SOURCES.some((source) => source.kind === kind)) {
      failures.push(`required source class ${kind} absent`);
    }
  }
  for (const source of AGENTIC_VIDEO_EDITING_SOURCES) {
    if (source.accessedAt !== "2026-08-28T00:00:00+08:00") {
      failures.push(`${source.id} missing offset-aware accessedAt`);
    }
    const pinned = ["release-pinned", "commit-pinned-at-cutoff", "version-pinned-standard"]
      .includes(source.stability);
    if (pinned !== Boolean(source.immutableRef)) {
      failures.push(`${source.id} immutableRef does not match its stability class`);
    }
    if ((source.kind === "x-post" || source.kind === "community-issue")
      && source.evidenceUse !== "version-watch-only") {
      failures.push(`${source.id} must be version-watch-only`);
    }
  }
  for (const [id, expected] of Object.entries(EXACT_PINS)) {
    const source = AGENTIC_VIDEO_EDITING_SOURCES.find((item) => item.id === id);
    if (!source || JSON.stringify([
      source.revision,
      source.resolvedCommit,
      source.tagObjectCommit ?? null,
    ]) !== JSON.stringify(expected)) failures.push(`${id} tag/peeled-commit tuple drifted`);
  }
  if (AGENTIC_VIDEO_EDITING_SOURCES.find((source) => source.id === "qwen3-vl-issue-1761")?.kind
    !== "community-issue") failures.push("Qwen issue must remain a bounded community issue");

  const provenance = readJson(join(PUBLIC_ROOT, "fixtures.provenance.json"), failures);
  if (provenance?.courseId !== "agentic-video-editing"
    || provenance?.fixtureSetVersion !== "2.0.0"
    || provenance?.verifiedOn !== "2026-08-28") failures.push("public provenance identity drifted");
  if (provenance?.scope?.shipsSourceMedia !== true
    || provenance?.scope?.sourceMediaBoundary !== "course-owned-synthetic-only"
    || provenance?.guidedProject?.ledgerSha256 !== GUIDED_LEDGER_SHA256
    || provenance?.guidedProject?.archivePath !== "lab/course22-guided-v2.zip"
    || provenance?.guidedProject?.archiveSha256 !== sha256(readFileSync(join(PUBLIC_ROOT, "lab/course22-guided-v2.zip")))
    || provenance?.guidedProject?.playableSourceMedia !== true
    || provenance?.guidedProject?.playableCpuRender !== true
    || provenance?.guidedProject?.networkRequired !== false
    || provenance?.guidedProject?.publicationAuthority !== false) {
    failures.push("guided playable synthetic-media provenance or authority boundary drifted");
  }
  for (const name of TOP_PUBLIC_FILES) {
    const path = join(PUBLIC_ROOT, name);
    const record = provenance?.files?.find?.((item) => item.path === name);
    if (!record || !existsSync(path) || sha256(readFileSync(path)) !== record.sha256) {
      failures.push(`${name} does not match public provenance`);
    }
  }
  const schema = readJson(join(PUBLIC_ROOT, "edit-plan.schema.json"), failures);
  if (schema) {
    try {
      new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    } catch (error) {
      failures.push(`edit-plan Draft 2020-12 compile failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (schema.properties?.executionMode?.const !== "select-only"
      || schema.$defs?.operation?.properties?.kind?.const !== "select") {
      failures.push("edit-plan.v2 must remain select-only");
    }
  }
  const copyText = JSON.stringify([AGENTIC_VIDEO_EDITING_EN_COPY, AGENTIC_VIDEO_EDITING_ZH_HANS_COPY]);
  for (const required of ["secret store", "short-lived", "redact", "rotate", "revoke", "secret-store", "短期", "脱敏", "轮换", "撤销"]) {
    if (!copyText.toLocaleLowerCase("en").includes(required.toLocaleLowerCase("en"))) {
      failures.push(`secret-handling copy misses ${required}`);
    }
  }
}

async function releaseChecks(failures) {
  const { TOP_LEVEL_COURSES, CATALOG_COURSES } = await import("../lib/courses.ts");
  const top = TOP_LEVEL_COURSES.find((course) => course.id === "agentic-video-editing");
  const catalog = CATALOG_COURSES.find((course) => course.id === "agentic-video-editing");
  if (!top || top.displayNumber !== 22 || top.moduleIds.length !== 10 || top.minutes !== 750) {
    failures.push("top-level Course 22 registration drifted");
  }
  if (!catalog || catalog.status !== "available" || catalog.displayNumber !== 22) {
    failures.push("Course 22 catalogue card drifted");
  }
  const reviews = readJson(join(ROOT, "lib/agentic-video-editing/localization-reviews.json"), failures);
  for (const bundle of reviews?.bundles ?? []) {
    const path = join(ROOT, bundle.path);
    if (!existsSync(path) || sha256(readFileSync(path)) !== bundle.sha256) {
      failures.push(`${bundle.locale} localization review hash is stale`);
    }
    if (bundle.status !== "approved" || !bundle.reviewerId || !bundle.reviewedAt) {
      failures.push(`${bundle.locale} named-human bundle review is ${bundle.status ?? "missing"}; release HOLD`);
    }
  }
  if ((reviews?.bundles ?? []).length !== 2) failures.push("EN/ZH localization review records missing");
}

function moduleDispatch(failures) {
  const moduleSlug = valueAfter("--module");
  const artifactId = valueAfter("--artifact-id");
  const artifactPath = valueAfter("--artifact");
  if (!moduleSlug && !artifactId && !artifactPath) return false;
  if (!moduleSlug || !artifactId || !artifactPath) {
    failures.push("--module, --artifact-id, and --artifact must be supplied together");
    return true;
  }
  const learnerRoot = valueAfter("--learner-final");
  const result = learnerRoot
    ? validateAgenticVideoEditingLearnerFinal(resolve(learnerRoot), {
      validatedAt: "2026-08-28T00:00:00+08:00",
    })
    : validateAgenticVideoEditingGuidedProject(GUIDED_ROOT, {
      validatedAt: "2026-08-28T00:00:00+08:00",
    });
  if (!result.ok) failures.push(...result.issues);
  const receipts = result.receiptArrays[moduleSlug] ?? [];
  const selected = receipts.find((receipt) => receipt.artifactId === artifactId);
  if (!selected || selected.artifactPath !== artifactPath) {
    failures.push(`no validated receipt for ${moduleSlug}/${artifactId}/${artifactPath}`);
  }
  if (!failures.length) process.stdout.write(`${JSON.stringify(selected, null, 2)}\n`);
  return true;
}

export async function runAgenticVideoEditingV2Check() {
  const failures = [];
  const dispatch = moduleDispatch(failures);
  if (!dispatch) {
    localChecks(failures);
    if (process.argv.includes("--release")) await releaseChecks(failures);
  }
  if (failures.length) {
    console.error(`Course 22 agentic-video-editing: FAIL (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    return 1;
  }
  if (!dispatch) {
    console.log(`Course 22 agentic-video-editing: PASS (${process.argv.includes("--release") ? "release" : "local"})`);
    console.log("- guided M1-M9 artifact bytes, semantics, lineage, and receipt arrays validated offline");
    console.log("- source classes, exact tag/peeled commits, select-only schema, secret policy, and public hashes close");
  }
  return 0;
}
