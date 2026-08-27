#!/usr/bin/env node

/**
 * Deterministic, offline, fail-closed gate for Course 20.
 *
 *   node --import tsx scripts/check-agentic-video-editing-course.mjs
 *   node --import tsx scripts/check-agentic-video-editing-course.mjs --release
 *   node --import tsx scripts/check-agentic-video-editing-course.mjs --release --json
 *
 * The gate validates source provenance and closure, the bilingual curriculum,
 * assessment/capstone contracts, original public fixtures, and (in release
 * mode) the route/catalog/i18n/build-chain integration. It performs no network
 * calls and does not turn repository integrity into media or release approval.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_ID = "agentic-video-editing";
const SNAPSHOT_DATE = "2026-08-26";
const COURSE_VERSION = "1.1.0";
const EXPECTED_PHASE_IDS = ["define", "understand", "edit", "verify"];
const EXPECTED_MODULE_SLUGS = [
  "agentic-editing-contract",
  "media-ingest-provenance",
  "transcripts-shots-index",
  "semantic-analysis-director",
  "declarative-edit-plan",
  "deterministic-rendering",
  "agent-tools-mcp",
  "captions-audio-formats",
  "verification-human-review",
  "production-capstone",
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
const REVIEWED_CONTENT_LOCALES = ["en", "zh-Hans"];
const EXPECTED_CRITICAL_QUESTION_IDS = ["q3", "q7", "q10"];
const ASSET_DIRECTORY = `public/courses/${COURSE_ID}`;
const HASHED_PUBLIC_FILES = [
  "creative-brief.fixture.json",
  "media-manifest.fixture.json",
  "edit-plan.schema.json",
  "qc-checklist.md",
  "NOTICE.md",
];
const ALL_PUBLIC_FILES = [...HASHED_PUBLIC_FILES, "fixtures.provenance.json"];
const REQUIRED_MESSAGE_KEYS = [
  "cat.course20",
  `c.${COURSE_ID}.title`,
  `c.${COURSE_ID}.blurb`,
  `c.${COURSE_ID}.level`,
  `c.${COURSE_ID}.meta`,
  `c.${COURSE_ID}.contentLanguage`,
];
const ALLOWED_REUSE_STATUSES = new Set([
  "link-and-paraphrase-only",
  "license-noted-no-code-copy",
]);
const ALLOWED_X_COMPLETENESS = new Set([
  "oembed-complete",
  "oembed-truncated-repository-corroborated",
]);
const ALLOWED_X_VERIFICATION_METHODS = new Set([
  "x-official-oembed",
]);
const ALLOWED_X_VERIFICATION_STATUSES = new Set([
  "identity-date-url-and-visible-text-verified",
  "identity-date-url-verified-visible-text-truncated",
]);
const EXPECTED_SOURCE_LEDGER_SHA256 = "a78f66c229dacd04bfa9b8c832a39250631f9d7ee6937b2a72172b9886a33322";
const EXPECTED_GITHUB_SNAPSHOTS = new Map([
  ["video-use", ["browser-use/video-use", "commit-pinned-at-cutoff", "92c2b34e44c205cbc2acae7f6ca7c1c219d5dd66", null, "MIT"]],
  ["ffmpeg", ["FFmpeg/FFmpeg", "release-pinned", "9.0.1 Lei", "bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa", "LGPL-2.1-or-later by default; build-dependent GPL/nonfree boundary"]],
  ["remotion", ["remotion-dev/remotion", "release-pinned", "v4.0.517", "a2c2a6260fee129bb55f97b9632d998f589839b7", "Remotion License (special commercial terms)"]],
  ["remotion-skills", ["remotion-dev/remotion", "commit-pinned-at-cutoff", "remotion 7aee2f4b3d5c05c77761f2dc6ec5aeac701dcce8; skills 7c5c10caa5294d01b168a08c9648b4deef717274", null, null]],
  ["opentimelineio", ["AcademySoftwareFoundation/OpenTimelineIO", "release-pinned", "v0.18.1 pre-release", "44236713c1db295a6ffc66189ae98dbdfd0cb9c4", "Apache-2.0"]],
  ["whisper", ["openai/whisper", "release-pinned", "v20250625", "31243bad24cc746f07d4c8bfdd2d974872cb1803", "MIT"]],
  ["whisperx", ["m-bain/whisperX", "release-pinned", "v3.8.6", "3ccc17b8de34f305300f8a3fd3c9f76ba820c0d0", "BSD-2-Clause"]],
  ["pyscenedetect", ["Breakthrough/PySceneDetect", "release-pinned", "v0.7.1", "6ebb72392de8acfb6c539bf15d0aa912ce7ab6b2", "BSD-3-Clause"]],
  ["qwen3-vl", ["QwenLM/Qwen3-VL", "commit-pinned-at-cutoff", "96588727e44c78b25ba03ea03b8e12f7e64fd0da", null, "Apache-2.0 for repository code; model terms are separate"]],
  ["vmaf", ["Netflix/vmaf", "release-pinned", "v3.2.0", "3f9e02af258a5c0e30124fc585a3c3af90126dee", "BSD-2-Clause-Patent"]],
  ["auto-editor", ["WyattBlue/auto-editor", "release-pinned", "31.5.0", "2f7ba68049ee67317a7afe6a0555ea6cf30ad101", "Unlicense"]],
  ["videodb-director", ["video-db/Director", "commit-pinned-at-cutoff", "70e0b3dfdf59c679a25f4bea511e3cc4c5f2457f; latest named release v0.1.1", null, "MIT"]],
  ["montaj", ["theSamPadilla/montaj", "release-pinned", "v3.10.1", "634d523f4b022a19c5cf98ffa4f9e609178437c7", "MIT"]],
  ["timeline-studio", ["MartinDelophy/ai-video-editor", "release-pinned", "v1.0.5", "2a59ffcfc6042deb56456cdadf6434ce39a647cd", "MIT"]],
  ["qcut", ["Quriosity-agent/qcut", "release-pinned", "v2026.08.26.1", "d297613a965102caf45cd5f7cbd0d407340b3dcd", "MIT for qcut source tree; providers and assets remain separate"]],
  ["velorn", ["VelornLabs/velorn", "release-pinned", "v0.3.29", "90aa9028ee38a98458c6fbd9a9a79b189462e019", "GPL-3.0-only"]],
  ["veac", ["AgentsMesh/veac", "release-pinned", "v0.2.0", "e3472918a8c05fe53be1c2bf6c6a76cd5730d8af", "MIT"]],
  ["video-edit-cli", ["computerlovetech/video-edit-cli", "release-pinned", "v0.1.2", "69aeeec7dad7470c1379c7115cbd4d96a4be8686", "MIT"]],
  ["davinci-resolve-mcp", ["samuelgursky/davinci-resolve-mcp", "commit-pinned-at-cutoff", "c3c075bcc930b4f967b3abae3073bc48e435c5af", null, "MIT"]],
  ["mosaic-skills", ["mosaic-ai-labs/skills", "commit-pinned-at-cutoff", "8331979eb00cc4840a78fddf2355c4a04c0c3219", null, "MIT"]],
]);
const EXPECTED_X_SNAPSHOTS = new Map([
  ["x-video-use-release", ["Introducing Video Use", "2044554557221675380", "Gregor Zunic (@gregpr07)", "2026-04-15", "oembed-truncated-repository-corroborated", "identity-date-url-verified-visible-text-truncated", ["video-use", "ffmpeg"]]],
  ["x-remotion-skills", ["Remotion now has Agent Skills", "2013626968386765291", "Remotion (@Remotion)", "2026-01-20", "oembed-complete", "identity-date-url-and-visible-text-verified", ["remotion", "remotion-skills"]]],
  ["x-davinci-mcp", ["DaVinci Resolve MCP Server showcase", "2075105180023144837", "GitHub Projects Community (@GithubProjects)", "2026-07-09", "oembed-truncated-repository-corroborated", "identity-date-url-verified-visible-text-truncated", ["davinci-resolve-mcp"]]],
  ["x-creator-workflow-guide", ["Claude Code video-production guide expansion", "1955108960060706862", "りょー｜AI動画制作・編集 (@cryptoninjanime)", "2025-08-12", "oembed-truncated-repository-corroborated", "identity-date-url-verified-visible-text-truncated", ["remotion", "remotion-skills"]]],
  ["x-mosaic-slack", ["Mosaic video editing API for agents", "2032121100126265551", "Adish Jain (@_adishj)", "2026-03-12", "oembed-truncated-repository-corroborated", "identity-date-url-verified-visible-text-truncated", ["mosaic-skills"]]],
]);

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function duplicateValues(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf())
    && parsed.toISOString().slice(0, 10) === value;
}

function githubRef(url, repository) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== "github.com") return null;
    const segments = decodeURIComponent(parsed.pathname).split("/").filter(Boolean);
    const [owner, name, operation, ref] = segments;
    if (`${owner}/${name}`.toLowerCase() !== repository.toLowerCase()) return null;
    if (!["blob", "tree"].includes(operation) || !ref) return null;
    return ref;
  } catch {
    return null;
  }
}

function isDefaultBranchGithubUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.hostname.toLowerCase() === "github.com"
      && /\/(?:blob|tree|commits?)\/(?:main|master)(?:\/|$)/iu.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isImmutableLicenseEvidence(url, repository, expectedRef) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== "github.com") return false;
    const path = decodeURIComponent(parsed.pathname);
    const prefix = `/${repository}/blob/${expectedRef}/`;
    if (!path.toLowerCase().startsWith(prefix.toLowerCase())) return false;
    return /\/(?:licen[cs]e|copying|copyright)(?:\.[^/]+)?$/iu.test(path);
  } catch {
    return false;
  }
}

function officialOembedTarget(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:"
      || parsed.hostname.toLowerCase() !== "publish.x.com"
      || parsed.pathname !== "/oembed") return null;
    return parsed.searchParams.get("url");
  } catch {
    return null;
  }
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function importFresh(path) {
  return import(`${pathToFileURL(path).href}?course20-check=${Date.now()}`);
}

export async function checkAgenticVideoEditingCourse({
  projectRoot = DEFAULT_ROOT,
  release = false,
} = {}) {
  const root = resolve(projectRoot);
  const issues = [];
  const notes = [];
  const add = (gate, message) => issues.push({ gate, message });
  const note = (message) => notes.push(message);
  const abs = (path) => resolve(root, path);
  const rel = (path) => relative(root, path).split(sep).join("/");

  function regularFile(path, label = rel(path)) {
    if (!existsSync(path)) {
      add("files", `${label}: required file is missing.`);
      return false;
    }
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      add("files", `${label}: expected a regular, non-symbolic file.`);
      return false;
    }
    return true;
  }

  function readText(path) {
    const resolved = abs(path);
    return regularFile(resolved, path) ? readFileSync(resolved, "utf8") : "";
  }

  function readJson(path) {
    const text = readText(path);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      add("assets", `${path}: invalid JSON (${error instanceof Error ? error.message : String(error)}).`);
      return null;
    }
  }

  function requireTokens(path, tokens, gate = "release") {
    const text = readText(path);
    if (!text) return "";
    for (const token of tokens) {
      if (!text.includes(token)) add(gate, `${path}: missing token ${JSON.stringify(token)}.`);
    }
    return text;
  }

  const counts = {
    phases: 0,
    modules: 0,
    minutes: 0,
    milestones: 0,
    sources: 0,
    github: 0,
    xPosts: 0,
    questions: 0,
    criticalQuestions: 0,
    capstoneArtifacts: 0,
    publicFiles: ALL_PUBLIC_FILES.length,
  };

  let courseModule = null;
  let schemaFixturePlan = null;
  try {
    courseModule = await importFresh(abs("lib/agentic-video-editing/index.ts"));
  } catch (error) {
    add("course-definition", `Course module import failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}.`);
  }

  if (courseModule) {
    const {
      AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT,
      AGENTIC_VIDEO_EDITING_COPY_BUNDLES,
      AGENTIC_VIDEO_EDITING_COURSE_MANIFEST: manifest,
      AGENTIC_VIDEO_EDITING_EN_COPY: enCopy,
      AGENTIC_VIDEO_EDITING_LOCALES,
      AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
      AGENTIC_VIDEO_EDITING_PHASE_IDS,
      AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES,
      AGENTIC_VIDEO_EDITING_QUIZ_PASS_PERCENT,
      AGENTIC_VIDEO_EDITING_SOURCES: sources,
      AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES,
      AGENTIC_VIDEO_EDITING_ZH_HANS_COPY: zhHansCopy,
      CUT_PLAN_LAB_FIXTURE,
      buildCutPlanLabPlan,
      loadAgenticVideoEditingCourse,
      validateCutPlanLabPlan,
      validateAgenticVideoEditingCourse,
    } = courseModule;

    if (!manifest || !sources || !enCopy || !zhHansCopy) {
      add("course-definition", "Course 20 must export its manifest, sources, and both reviewed copy bundles.");
    } else {
      try {
        const validationIssues = validateAgenticVideoEditingCourse();
        for (const message of validationIssues) add("course-definition", `Course validator: ${message}`);
      } catch (error) {
        add("course-definition", `Course validator threw: ${error instanceof Error ? error.message : String(error)}.`);
      }

      counts.phases = manifest.phases.length;
      counts.modules = manifest.modules.length;
      counts.minutes = manifest.modules.reduce((sum, module) => sum + module.minutes, 0);
      counts.milestones = AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES;
      counts.sources = sources.length;
      counts.github = sources.filter((source) => source.kind === "github-repository").length;
      counts.xPosts = sources.filter((source) => source.kind === "x-post").length;
      counts.questions = enCopy.finalAssessment.questions.length;
      counts.criticalQuestions = enCopy.finalAssessment.questions.filter((question) => question.critical).length;
      counts.capstoneArtifacts = enCopy.capstone.artifacts.length;

      if (manifest.id !== COURSE_ID) add("course-definition", `Manifest ID drifted to ${manifest.id}.`);
      if (manifest.version !== COURSE_VERSION) add("course-definition", `Manifest version drifted to ${manifest.version}.`);
      if (manifest.displayNumber !== 20) add("course-definition", `Display number drifted to ${manifest.displayNumber}.`);
      if (manifest.publishedOn !== SNAPSHOT_DATE || manifest.researchCutoff !== SNAPSHOT_DATE) {
        add("course-definition", `Published and research-cutoff dates must both be ${SNAPSHOT_DATE}.`);
      }
      if (manifest.defaultContentLocale !== "en") add("language", "Default content locale must be English.");
      if (!same([...AGENTIC_VIDEO_EDITING_PHASE_IDS], EXPECTED_PHASE_IDS)
        || !same(manifest.phases.map((phase) => phase.id), EXPECTED_PHASE_IDS)) {
        add("course-definition", "Phase IDs and phase order must be define → understand → edit → verify.");
      }
      if (!same([...AGENTIC_VIDEO_EDITING_MODULE_SLUGS], EXPECTED_MODULE_SLUGS)
        || !same(manifest.modules.map((module) => module.slug), EXPECTED_MODULE_SLUGS)) {
        add("course-definition", "Module slugs must match the independent Course 20 order exactly.");
      }
      if (manifest.modules.length !== 10) add("course-definition", `Expected 10 modules; found ${manifest.modules.length}.`);
      if (manifest.phases.length !== 4) add("course-definition", `Expected 4 phases; found ${manifest.phases.length}.`);
      if (counts.minutes !== 750) add("course-definition", `Expected 750 minutes; found ${counts.minutes}.`);

      const moduleSlugs = manifest.modules.map((module) => module.slug);
      if (duplicateValues(moduleSlugs).length) add("course-definition", "Module slugs must be unique.");
      for (const [index, module] of manifest.modules.entries()) {
        if (module.order !== index + 1) add("course-definition", `${module.slug}: order must be ${index + 1}, found ${module.order}.`);
        if (!Number.isInteger(module.minutes) || module.minutes <= 0) {
          add("course-definition", `${module.slug}: minutes must be a positive integer.`);
        }
        if (!module.sourceIds.length || duplicateValues([...module.sourceIds]).length) {
          add("sources", `${module.slug}: source IDs must be non-empty and unique within the module.`);
        }
      }
      const phaseCoverage = manifest.phases.flatMap((phase) => phase.moduleSlugs);
      if (!same([...phaseCoverage].sort(), [...EXPECTED_MODULE_SLUGS].sort())
        || phaseCoverage.length !== EXPECTED_MODULE_SLUGS.length) {
        add("course-definition", "Every canonical module must appear exactly once across the four phases.");
      }
      for (const [index, phase] of manifest.phases.entries()) {
        if (phase.order !== index + 1) add("course-definition", `${phase.id}: phase order must be ${index + 1}.`);
        if (!phase.moduleSlugs.length || duplicateValues([...phase.moduleSlugs]).length) {
          add("course-definition", `${phase.id}: phase module coverage must be non-empty and unique.`);
        }
        for (const slug of phase.moduleSlugs) {
          const moduleRecord = manifest.modules.find((candidate) => candidate.slug === slug);
          if (!moduleRecord || moduleRecord.phaseId !== phase.id) {
            add("course-definition", `${phase.id}/${slug}: phase and module declarations do not close.`);
          }
        }
      }

      const sourceIds = sources.map((source) => source.id);
      const primaryUrls = sources.map((source) => source.url);
      const sourcesById = new Map(sources.map((source) => [source.id, source]));
      if (sources.length !== 25 || counts.github !== 20 || counts.xPosts !== 5) {
        add("sources", `Expected exactly 25 sources (20 GitHub + 5 X); found ${sources.length} (${counts.github} GitHub + ${counts.xPosts} X).`);
      }
      const sourceLedgerHash = createHash("sha256").update(JSON.stringify(sources)).digest("hex");
      if (sourceLedgerHash !== EXPECTED_SOURCE_LEDGER_SHA256) {
        add("sources", `Source ledger content drifted from the externally reviewed snapshot (${sourceLedgerHash}).`);
      }
      for (const duplicate of duplicateValues(sourceIds)) add("sources", `${duplicate}: duplicate source ID.`);
      for (const duplicate of duplicateValues(primaryUrls)) add("sources", `${duplicate}: duplicate primary claim-evidence URL.`);

      const usedSourceIds = new Set(manifest.modules.flatMap((module) => module.sourceIds));
      for (const sourceId of usedSourceIds) {
        if (!sourcesById.has(sourceId)) add("sources", `${sourceId}: manifest reference is absent from the source ledger.`);
      }
      for (const source of sources) {
        if (!usedSourceIds.has(source.id)) add("sources", `${source.id}: source is not used by any module.`);
        if (!ALLOWED_REUSE_STATUSES.has(source.reuseStatus)) {
          add("rights", `${source.id}: unknown reuse status ${source.reuseStatus}.`);
        }
        if (!isIsoDate(source.accessedOn) || source.accessedOn !== SNAPSHOT_DATE) {
          add("sources", `${source.id}: accessedOn must be ${SNAPSHOT_DATE}.`);
        }
        if (!Array.isArray(source.claimEvidenceUrls) || !source.claimEvidenceUrls.length
          || !source.claimEvidenceUrls.includes(source.url)) {
          add("sources", `${source.id}: claimEvidenceUrls must be non-empty and include the primary URL.`);
        }
        for (const duplicate of duplicateValues([...source.claimEvidenceUrls])) {
          add("sources", `${source.id}: duplicate claim-evidence URL ${duplicate}.`);
        }
        for (const evidenceUrl of source.claimEvidenceUrls) {
          if (!/^https:\/\//u.test(evidenceUrl)) add("sources", `${source.id}: claim evidence must use HTTPS (${evidenceUrl}).`);
        }
        if (source.supports.trim().length < 80 || source.boundary.trim().length < 80
          || source.supportsZhHans.trim().length < 25 || source.boundaryZhHans.trim().length < 25) {
          add("sources", `${source.id}: bilingual support and non-inference boundaries must be substantive.`);
        }
        if (source.rightsDecision.trim().length < 55 || source.rightsDecisionZhHans.trim().length < 18) {
          add("rights", `${source.id}: bilingual rights decisions must be substantive.`);
        }

        if (source.kind === "github-repository") {
          const expectedSnapshot = EXPECTED_GITHUB_SNAPSHOTS.get(source.id);
          const actualSnapshot = [
            source.repository,
            source.stability,
            source.revision ?? null,
            source.resolvedCommit ?? null,
            source.license ?? null,
          ];
          if (!expectedSnapshot || !same(actualSnapshot, expectedSnapshot)) {
            add("sources", `${source.id}: repository, stability, version, resolved commit, or license drifted from the reviewed snapshot.`);
          }
          if (!/^https:\/\/github\.com\//iu.test(source.url)
            || !source.url.toLowerCase().includes(`github.com/${source.repository}`.toLowerCase())) {
            add("sources", `${source.id}: GitHub repository identity and primary URL disagree.`);
          }
          const primaryRef = githubRef(source.url, source.repository);
          if (!primaryRef) add("sources", `${source.id}: primary evidence must be a repository file/tree pinned by a full commit SHA.`);
          if (source.stability === "release-pinned") {
            if (!source.revision?.trim() || !source.versionAnchorUrl?.startsWith("https://")) {
              add("sources", `${source.id}: release-pinned evidence needs revision and a distinct HTTPS version anchor.`);
            }
            if (source.versionAnchorUrl === source.url) add("sources", `${source.id}: version anchor must be distinct from claim evidence.`);
            if (!/^[0-9a-f]{40}$/iu.test(source.resolvedCommit ?? "")) {
              add("sources", `${source.id}: release tag must resolve to a recorded full 40-character commit SHA.`);
            }
            if (!primaryRef || primaryRef.toLowerCase() !== source.resolvedCommit?.toLowerCase()) {
              add("sources", `${source.id}: release-pinned primary evidence must use the resolved commit, not the descriptive tag.`);
            }
            for (const url of [source.url, ...source.claimEvidenceUrls].filter(Boolean)) {
              if (isDefaultBranchGithubUrl(url)) add("sources", `${source.id}: release-pinned evidence may not use a main/master path (${url}).`);
              const evidenceRef = githubRef(url, source.repository);
              if (evidenceRef && evidenceRef.toLowerCase() !== source.resolvedCommit?.toLowerCase()) {
                add("sources", `${source.id}: same-repository claim evidence must use resolved commit ${source.resolvedCommit}, found ${evidenceRef}.`);
              }
            }
          } else if (source.stability === "commit-pinned-at-cutoff") {
            if (!primaryRef || !/^[0-9a-f]{40}$/iu.test(primaryRef)
              || !source.revision?.toLowerCase().includes(primaryRef.toLowerCase())) {
              add("sources", `${source.id}: cutoff evidence must pin the primary claim to a full 40-character commit SHA also recorded in revision.`);
            }
            for (const url of [source.url, ...source.claimEvidenceUrls]) {
              const evidenceRef = githubRef(url, source.repository);
              if (evidenceRef && primaryRef && evidenceRef.toLowerCase() !== primaryRef.toLowerCase()) {
                add("sources", `${source.id}: same-repository claim evidence must use one cutoff commit, found ${evidenceRef}.`);
              }
            }
          } else {
            add("sources", `${source.id}: GitHub stability must be release-pinned or commit-pinned-at-cutoff.`);
          }

          if (source.reuseStatus === "license-noted-no-code-copy") {
            if (!source.license?.trim()) add("rights", `${source.id}: license-noted reuse requires an explicit license record.`);
            const licenseEvidence = primaryRef
              ? source.claimEvidenceUrls.filter((url) => isImmutableLicenseEvidence(url, source.repository, primaryRef))
              : [];
            if (licenseEvidence.length !== 1) {
              add("rights", `${source.id}: expected exactly one immutable repository LICENSE/COPYING evidence URL at the primary ref; found ${licenseEvidence.length}.`);
            }
          } else if (!/(?:do not|does not|no |without|only|never|not |不|未|仅)/iu.test(`${source.rightsDecision} ${source.rightsDecisionZhHans}`)) {
            add("rights", `${source.id}: link-only reuse must explicitly deny unsupported copying or licensing.`);
          }
        } else if (source.kind === "x-post") {
          const expectedSnapshot = EXPECTED_X_SNAPSHOTS.get(source.id);
          const actualSnapshot = [
            source.title,
            source.statusId,
            source.authorIdentity,
            source.publishedOn,
            source.textCompleteness,
            source.verificationStatus,
            [...source.corroboratingSourceIds],
          ];
          if (!expectedSnapshot || !same(actualSnapshot, expectedSnapshot)) {
            add("sources", `${source.id}: title, status, author, date, completeness, verification, or corroboration drifted from the reviewed X snapshot.`);
          }
          const directMatch = source.url.match(/^https:\/\/x\.com\/([^/]+)\/status\/(\d+)$/u);
          if (!directMatch) add("sources", `${source.id}: X evidence must use a direct x.com status URL.`);
          if (!/^\d{15,22}$/u.test(source.statusId) || directMatch?.[2] !== source.statusId) {
            add("sources", `${source.id}: statusId must be numeric and match the direct status URL.`);
          }
          if (source.role !== "field-signal" || source.stability !== "dated-field-signal") {
            add("sources", `${source.id}: X evidence must remain a dated field signal.`);
          }
          if (source.reuseStatus !== "link-and-paraphrase-only") {
            add("rights", `${source.id}: X evidence must remain link-and-paraphrase-only.`);
          }
          if (!isIsoDate(source.publishedOn) || source.publishedOn > manifest.researchCutoff) {
            add("sources", `${source.id}: X publication date is missing, invalid, or later than the research cutoff.`);
          }
          if (!isIsoDate(source.verifiedOn) || source.verifiedOn > source.accessedOn) {
            add("sources", `${source.id}: verifiedOn is missing, invalid, or later than accessedOn.`);
          }
          const provenanceFields = [
            ["authorIdentity", source.authorIdentity, 8],
            ["authorRole", source.authorRole, 8],
            ["threadContext", source.threadContext, 45],
            ["mediaContext", source.mediaContext, 45],
            ["corroborationScope", source.corroborationScope, 90],
          ];
          for (const [field, value, minimum] of provenanceFields) {
            if (typeof value !== "string" || value.trim().length < minimum) {
              add("sources", `${source.id}: X provenance field ${field} is missing or too thin.`);
            }
          }
          if (!ALLOWED_X_COMPLETENESS.has(source.textCompleteness)) {
            add("sources", `${source.id}: unknown X textCompleteness ${source.textCompleteness}.`);
          }
          if (!ALLOWED_X_VERIFICATION_METHODS.has(source.verificationMethod)) {
            add("sources", `${source.id}: unknown X verificationMethod ${source.verificationMethod}.`);
          }
          if (!ALLOWED_X_VERIFICATION_STATUSES.has(source.verificationStatus)) {
            add("sources", `${source.id}: unknown X verificationStatus ${source.verificationStatus}.`);
          }
          if (source.textCompleteness === "oembed-complete"
            && source.verificationStatus !== "identity-date-url-and-visible-text-verified") {
            add("sources", `${source.id}: complete oEmbed text must use the complete-text verification status.`);
          }
          if (source.textCompleteness !== "oembed-complete"
            && source.verificationStatus !== "identity-date-url-verified-visible-text-truncated") {
            add("sources", `${source.id}: truncated oEmbed text must use the truncated-text verification status.`);
          }
          const oembedTargets = source.claimEvidenceUrls
            .map(officialOembedTarget)
            .filter((target) => target !== null);
          if (oembedTargets.length !== 1 || oembedTargets[0] !== source.url) {
            add("sources", `${source.id}: exactly one official publish.x.com/oembed URL must decode to the direct status URL.`);
          }
          if (!Array.isArray(source.corroboratingSourceIds) || !source.corroboratingSourceIds.length
            || duplicateValues([...source.corroboratingSourceIds]).length) {
            add("sources", `${source.id}: corroboratingSourceIds must be non-empty and unique.`);
          }
          for (const corroboratingId of source.corroboratingSourceIds ?? []) {
            const corroborator = sourcesById.get(corroboratingId);
            if (!corroborator || corroborator.kind !== "github-repository") {
              add("sources", `${source.id}: corroborator ${corroboratingId} must resolve only to a GitHub repository record.`);
            }
          }
        } else {
          add("sources", `${source.id}: unsupported source kind ${source.kind}.`);
        }
      }
      const xStatusIds = sources.filter((source) => source.kind === "x-post").map((source) => source.statusId);
      for (const duplicate of duplicateValues(xStatusIds)) add("sources", `${duplicate}: duplicate X status ID.`);

      const reviewedCopies = [
        ["en", enCopy],
        ["zh-Hans", zhHansCopy],
      ];
      for (const [locale, copy] of reviewedCopies) {
        const copySlugs = Object.keys(copy.modules);
        if (!same(copySlugs, EXPECTED_MODULE_SLUGS)) {
          add("language", `${locale}: reviewed copy must contain the ten canonical modules in order.`);
        }
        const citedAcrossCourse = new Set();
        for (const moduleRecord of manifest.modules) {
          const moduleCopy = copy.modules[moduleRecord.slug];
          if (!moduleCopy) continue;
          const declared = new Set(moduleRecord.sourceIds);
          const cited = new Set(moduleCopy.sections.flatMap((section) => section.sourceIds));
          for (const sourceId of declared) {
            if (!cited.has(sourceId)) add("sources", `${locale}/${moduleRecord.slug}: declared source ${sourceId} is not cited.`);
          }
          for (const section of moduleCopy.sections) {
            if (!section.sourceIds.length || duplicateValues([...section.sourceIds]).length) {
              add("sources", `${locale}/${moduleRecord.slug}/${section.heading}: sourceIds must be non-empty and unique.`);
            }
            for (const sourceId of section.sourceIds) {
              citedAcrossCourse.add(sourceId);
              if (!sourcesById.has(sourceId)) add("sources", `${locale}/${moduleRecord.slug}: citation ${sourceId} is absent from the source ledger.`);
              if (!declared.has(sourceId)) add("sources", `${locale}/${moduleRecord.slug}: citation ${sourceId} is outside the module source contract.`);
            }
          }
        }
        for (const sourceId of sourceIds) {
          if (!citedAcrossCourse.has(sourceId)) add("sources", `${locale}: final source ${sourceId} is not cited in reviewed teaching copy.`);
        }

        const assessment = copy.finalAssessment;
        const questionIds = assessment.questions.map((question) => question.id);
        const expectedQuestionIds = Array.from({ length: 10 }, (_, index) => `q${index + 1}`);
        if (assessment.passPercent !== 80 || !same(questionIds, expectedQuestionIds)) {
          add("assessment", `${locale}: assessment must have ordered q1–q10 and an 80% pass mark.`);
        }
        const criticalIds = assessment.questions.filter((question) => question.critical).map((question) => question.id);
        if (!same(criticalIds, EXPECTED_CRITICAL_QUESTION_IDS)) {
          add("assessment", `${locale}: critical questions must be exactly q3, q7, and q10.`);
        }
        for (const question of assessment.questions) {
          if (question.options.length !== 4
            || !Number.isInteger(question.correctIndex)
            || question.correctIndex < 0
            || question.correctIndex > 3
            || question.options.some((option) => !option.trim())) {
            add("assessment", `${locale}/${question.id}: four non-empty options and one valid answer index are required.`);
          }
        }
        const expectedAnswerIndexes = [2, 0, 3, 1, 2, 0, 1, 3, 0, 2];
        if (!same(assessment.questions.map((question) => question.correctIndex), expectedAnswerIndexes)) {
          add("assessment", `${locale}: answer positions must remain intentionally distributed and aligned to the reviewed answer key.`);
        }
        const minimumArtifactLength = locale === "zh-Hans" ? 8 : 18;
        if (copy.capstone.artifacts.length !== 12
          || duplicateValues([...copy.capstone.artifacts]).length
          || copy.capstone.artifacts.some((artifact) => artifact.trim().length < minimumArtifactLength)) {
          add("capstone", `${locale}: capstone must require twelve unique, substantive artifacts.`);
        }
        if (!/(?:local|本地)/iu.test(copy.capstone.completionStatement)
          || !/(?:authori[sz]|授权)/iu.test(copy.capstone.completionStatement)) {
          add("capstone", `${locale}: completion statement must disclose the local/self-attested and non-authorizing boundary.`);
        }
        if (!/(?:does not|not |neither|不|不会|不能)/iu.test(assessment.summary)) {
          add("assessment", `${locale}: assessment summary must deny release authority.`);
        }
      }
      if (!same([...AGENTIC_VIDEO_EDITING_LOCALES], EXPECTED_LOCALES)) {
        add("language", "Course locale routes must match the site's nine-locale contract exactly.");
      }
      if (!same([...AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES], REVIEWED_CONTENT_LOCALES)
        || !same(Object.keys(AGENTIC_VIDEO_EDITING_COPY_BUNDLES), REVIEWED_CONTENT_LOCALES)) {
        add("language", "Only English and Simplified Chinese may be advertised as reviewed long-form editions.");
      }
      if (!same(Object.keys(enCopy.ui).sort(), Object.keys(zhHansCopy.ui).sort())) {
        add("language", "English and Simplified Chinese course UI keys must have exact parity.");
      }
      if (!same(
        enCopy.finalAssessment.questions.map((question) => [question.id, question.critical]),
        zhHansCopy.finalAssessment.questions.map((question) => [question.id, question.critical]),
      )) {
        add("assessment", "English and Simplified Chinese question IDs and critical flags must have exact parity.");
      }
      if (AGENTIC_VIDEO_EDITING_QUIZ_PASS_PERCENT !== 80) add("assessment", "Progress contract pass percentage must remain 80.");
      if (AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT !== 12) add("capstone", "Progress contract must require twelve capstone artifacts.");
      if (AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES !== 12) add("course-definition", "Progress contract must expose ten modules plus assessment and capstone (12 milestones). ");

      if (typeof buildCutPlanLabPlan !== "function" || typeof validateCutPlanLabPlan !== "function"
        || !Array.isArray(CUT_PLAN_LAB_FIXTURE)) {
        add("assets", "Cut Plan Lab builder, fixture, and semantic validator must be exported.");
      } else {
        const selectedClips = CUT_PLAN_LAB_FIXTURE.filter((clip) => clip.id !== "archive");
        const reasons = Object.fromEntries(selectedClips.map((clip) => [clip.id, clip.defaultReason]));
        const basePlan = buildCutPlanLabPlan(selectedClips, reasons, 50);
        schemaFixturePlan = basePlan;
        const baseIssues = validateCutPlanLabPlan(basePlan);
        if (baseIssues.length || basePlan.status !== "blocked" || basePlan.executionPolicy.allowPublish !== false) {
          add("assets", `Cut Plan Lab valid teaching fixture must pass semantic checks while remaining blocked and non-publishing; found ${baseIssues.map((issue) => issue.code).join(", ") || "boundary drift"}.`);
        }
        const semanticRegressions = [
          ["too few clips", "minimum-clips", (plan) => { plan.timeline.operations = plan.timeline.operations.slice(0, 2); }],
          ["target below course range", "target-range", (plan) => { plan.timeline.targetDurationFrames = 44 * 30; }],
          ["selected duration below course range", "duration-range", (plan) => { plan.timeline.operations = plan.timeline.operations.slice(0, 3); }],
          ["target delta exceeds tolerance", "target-delta", (plan) => { plan.timeline.targetDurationFrames = 60 * 30; }],
          ["rationale too short", "reason-short", (plan) => { plan.timeline.operations[0].reason = "too short"; }],
          ["duplicate ID", "duplicate-operation-id", (plan) => { plan.timeline.operations[1].operationId = plan.timeline.operations[0].operationId; }],
          ["source input missing", "source-missing", (plan) => { plan.timeline.operations[0].sourceMediaId = "missing-source"; }],
          ["invalid source range", "source-range-invalid", (plan) => { plan.timeline.operations[0].sourceFrames.durationFrames = 0; }],
          ["out-of-bounds source range", "source-range-out-of-bounds", (plan) => { plan.timeline.operations[0].sourceFrames.startInclusive = plan.inputs[0].expectedDurationFrames; }],
          ["timeline discontinuity", "timeline-discontinuity", (plan) => { plan.timeline.operations[1].timelineStartFrame += 1; }],
          ["duration mismatch", "expected-duration-mismatch", (plan) => { plan.timeline.expectedDurationFrames += 1; }],
          ["unknown rights", "rights-unresolved", (plan) => { plan.timeline.operations[0].rightsState = "unknown"; }],
          ["unresolved ambiguity", "unresolved-ambiguity", (plan) => { plan.timeline.operations[0].ambiguity = "meaning"; }],
          ["human review disabled", "human-review-disabled", (plan) => { plan.timeline.operations[0].requiresHumanReview = false; }],
          ["unsafe output directory", "unsafe-output-directory", (plan) => { plan.executionPolicy.outputDirectory = "../escape/"; }],
          ["dry-run disabled", "unsafe-execution-policy", (plan) => { plan.executionPolicy.dryRunRequired = false; }],
          ["original overwrite enabled", "unsafe-execution-policy", (plan) => { plan.executionPolicy.overwriteOriginals = true; }],
          ["network enabled", "unsafe-execution-policy", (plan) => { plan.executionPolicy.allowNetwork = true; }],
          ["publishing enabled", "fixture-boundary", (plan) => { plan.executionPolicy.allowPublish = true; }],
          ["hash stop disabled", "unsafe-execution-policy", (plan) => { plan.executionPolicy.stopOnInputHashMismatch = false; }],
          ["ambiguity stop disabled", "unsafe-execution-policy", (plan) => { plan.executionPolicy.stopOnUnresolvedAmbiguity = false; }],
          ["timebase changed", "fixture-timebase", (plan) => { plan.timeline.timebase.framesPerSecondNumerator = 60; }],
          ["tolerance widened", "fixture-tolerance", (plan) => { plan.timeline.durationToleranceFrames = 999_999; }],
          ["fixture duration forged", "fixture-input", (plan) => { plan.inputs[0].expectedDurationFrames = 999_999; }],
          ["evidence locator forged", "evidence-unresolved", (plan) => { plan.timeline.operations[0].evidence[0].locator = "fixture:bogus:0-999s"; }],
          ["fixture operation identity changed", "fixture-operation", (plan) => { plan.timeline.operations[0].sourceFrames.startInclusive += 1; }],
        ];
        for (const [name, expectedCode, mutate] of semanticRegressions) {
          const mutated = structuredClone(basePlan);
          mutate(mutated);
          if (!validateCutPlanLabPlan(mutated).some((issue) => issue.code === expectedCode)) {
            add("assets", `Cut Plan Lab semantic validator failed regression ${name} (${expectedCode}).`);
          }
        }
        const missingSourceWithLaterDefects = structuredClone(basePlan);
        missingSourceWithLaterDefects.timeline.operations[0].sourceMediaId = "missing-source";
        missingSourceWithLaterDefects.timeline.operations[0].timelineStartFrame = 1;
        missingSourceWithLaterDefects.timeline.operations[0].reason = "too short";
        const missingSourceCodes = new Set(validateCutPlanLabPlan(missingSourceWithLaterDefects).map((issue) => issue.code));
        for (const expectedCode of ["source-missing", "timeline-discontinuity", "reason-short"]) {
          if (!missingSourceCodes.has(expectedCode)) {
            add("assets", `Cut Plan Lab source lookup failure skipped the later ${expectedCode} semantic check.`);
          }
        }
        const everyClipReasons = Object.fromEntries(CUT_PLAN_LAB_FIXTURE.map((clip) => [clip.id, clip.defaultReason]));
        const forgedRightsPlan = structuredClone(buildCutPlanLabPlan(CUT_PLAN_LAB_FIXTURE, everyClipReasons, 55));
        const archiveOperation = forgedRightsPlan.timeline.operations.find((operation) => operation.operationId === "op-keep-archive");
        if (!archiveOperation) {
          add("assets", "Cut Plan Lab rights regression could not find the unknown-rights archive operation.");
        } else {
          archiveOperation.rightsState = "simulated-cleared";
          archiveOperation.ambiguity = "none-declared";
          if (!validateCutPlanLabPlan(forgedRightsPlan).some((issue) => issue.code === "fixture-operation")) {
            add("assets", "Cut Plan Lab semantic validator allowed the unknown-rights fixture clip to self-declare cleared rights.");
          }
        }
      }

      for (const locale of EXPECTED_LOCALES) {
        try {
          const materialized = await loadAgenticVideoEditingCourse(locale);
          const expectedContentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
          if (materialized.locale !== locale || materialized.contentLocale !== expectedContentLocale
            || materialized.contentDirection !== "ltr") {
            add("language", `${locale}: materialized locale/content-locale/direction contract drifted.`);
          }
          if (!same(materialized.modules.map((module) => module.slug), EXPECTED_MODULE_SLUGS)
            || !same(materialized.phases.map((phase) => phase.id), EXPECTED_PHASE_IDS)) {
            add("language", `${locale}: materialized course does not close over all modules and phases.`);
          }
          if (locale !== "en" && locale !== "zh-Hans"
            && !/(?:reviewed English|English course edition)/iu.test(materialized.copy.meta.translationNote)) {
            add("language", `${locale}: fallback route must disclose that it displays reviewed English content.`);
          }
        } catch (error) {
          add("language", `${locale}: materialization failed (${error instanceof Error ? error.message : String(error)}).`);
        }
      }
    }
  }

  const assetDirectory = abs(ASSET_DIRECTORY);
  if (!existsSync(assetDirectory)) {
    add("assets", `${ASSET_DIRECTORY}: public fixture directory is missing.`);
  } else {
    const directoryStat = lstatSync(assetDirectory);
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
      add("assets", `${ASSET_DIRECTORY}: expected a real directory, not a file or symbolic link.`);
    } else {
      const entries = readdirSync(assetDirectory).sort((left, right) => left.localeCompare(right, "en"));
      const expectedEntries = [...ALL_PUBLIC_FILES].sort((left, right) => left.localeCompare(right, "en"));
      if (!same(entries, expectedEntries)) {
        add("assets", `${ASSET_DIRECTORY}: expected exactly ${expectedEntries.join(", ")}; found ${entries.join(", ") || "nothing"}.`);
      }
      for (const entry of entries) regularFile(join(assetDirectory, entry), `${ASSET_DIRECTORY}/${entry}`);
    }
  }

  const provenance = readJson(`${ASSET_DIRECTORY}/fixtures.provenance.json`);
  if (provenance) {
    if (provenance.schemaVersion !== "aicourse.public-fixtures.provenance.v1"
      || provenance.courseId !== COURSE_ID
      || provenance.fixtureSetVersion !== COURSE_VERSION
      || provenance.verifiedOn !== SNAPSHOT_DATE) {
      add("assets", "Fixture provenance identity, version, or verification date drifted.");
    }
    const rights = provenance.rights ?? {};
    if (rights.basis !== "original-project-fixture"
      || rights.repositoryLicense !== "MIT"
      || rights.publicationEligible !== true
      || rights.containsThirdPartyCode !== false
      || rights.containsThirdPartyMedia !== false
      || rights.containsPersonalData !== false
      || rights.containsPrivateInput !== false
      || rights.containsModelOutput !== false) {
      add("rights", "Fixture provenance must declare original-project rights and exclude third-party code/media, personal/private data, and model output.");
    }
    const scope = provenance.scope ?? {};
    if (scope.fictionalScenario !== true
      || scope.shipsSourceMedia !== false
      || scope.authorizesRealMediaUse !== false
      || scope.authorizesExecution !== false
      || scope.authorizesPublication !== false
      || scope.requiresNamedHumanReleaseDecision !== true
      || scope.unknownRightsDefault !== "block") {
      add("rights", "Fixture provenance must remain fictional, media-free, non-authorizing, human-released, and fail-closed on unknown rights.");
    }
    const records = Array.isArray(provenance.files) ? provenance.files : [];
    const recordPaths = records.map((record) => record.path);
    if (!same(recordPaths, HASHED_PUBLIC_FILES) || duplicateValues(recordPaths).length) {
      add("assets", "Fixture provenance must list the five hash-bound public files exactly once and in canonical order.");
    }
    for (const name of HASHED_PUBLIC_FILES) {
      const path = join(assetDirectory, name);
      const record = records.find((candidate) => candidate.path === name);
      if (!regularFile(path, `${ASSET_DIRECTORY}/${name}`)) continue;
      if (!record || !/^[a-f0-9]{64}$/u.test(record.sha256 ?? "") || record.sha256 !== sha256(path)) {
        add("assets", `${ASSET_DIRECTORY}/${name}: SHA-256 does not match fixtures.provenance.json.`);
      }
      if (record?.origin !== "original-project-fixture" || typeof record?.purpose !== "string" || record.purpose.length < 35) {
        add("rights", `${ASSET_DIRECTORY}/${name}: origin and purpose metadata must be explicit.`);
      }
    }
  }

  const brief = readJson(`${ASSET_DIRECTORY}/creative-brief.fixture.json`);
  if (brief) {
    const boundary = brief.fixtureBoundary ?? {};
    const approvals = brief.agentAuthority?.humanApprovals ?? {};
    const approverAssignments = approvals.namedApproverAssignments ?? {};
    if (brief.schemaVersion !== "aicourse.agentic-video-editing.creative-brief.v1"
      || brief.fixtureId !== "harbor-house-workshop-recap-v1"
      || brief.courseId !== COURSE_ID
      || brief.status !== "draft-not-approved-for-production"
      || boundary.fictionalScenario !== true
      || boundary.sourceMediaIncluded !== false
      || boundary.personalDataIncluded !== false
      || boundary.thirdPartyContentIncluded !== false
      || boundary.networkAccessRequired !== false
      || boundary.publicationAuthorized !== false) {
      add("assets", "Creative brief must remain a fictional, media-free, private-data-free, offline, non-publishable draft.");
    }
    if (brief.agentAuthority?.mustStopWhen?.length < 5
      || brief.agentAuthority?.mayNot?.length < 4
      || approvals.editorialPlanRequired !== true
      || approvals.rightsAndPrivacyRequired !== true
      || approvals.meaningAndAccessibilityRequired !== true
      || approvals.finalReleaseRequired !== true
      || approvals.agentSelfApprovalAllowed !== false
      || approvals.whenAnyNamedApproverIsUnassigned !== "block-and-request-assignment"
      || approverAssignments.editorialPlanHumanId !== null
      || approverAssignments.rightsAndPrivacyHumanId !== null
      || approverAssignments.meaningAndAccessibilityHumanId !== null
      || approverAssignments.finalReleaseHumanId !== null) {
      add("safety", "Creative brief must retain explicit stop conditions, forbidden authority, four human-approval requirements, and fail-closed unassigned named-approver slots.");
    }
    for (const dimension of ["technical", "semantic", "accessibility", "rightsAndPrivacy", "release"]) {
      if (!Array.isArray(brief.acceptanceContract?.[dimension]) || !brief.acceptanceContract[dimension].length) {
        add("assets", `Creative brief acceptance contract is missing ${dimension}.`);
      }
    }
  }

  const mediaManifest = readJson(`${ASSET_DIRECTORY}/media-manifest.fixture.json`);
  if (mediaManifest) {
    const policy = mediaManifest.workspacePolicy ?? {};
    const decision = mediaManifest.manifestDecision ?? {};
    if (mediaManifest.schemaVersion !== "aicourse.agentic-video-editing.media-manifest.v1"
      || mediaManifest.fixtureId !== "harbor-house-workshop-recap-v1"
      || mediaManifest.courseId !== COURSE_ID
      || mediaManifest.manifestStatus !== "blocked-no-source-media"
      || policy.networkAccess !== false
      || policy.externalAccounts !== false
      || policy.credentialsAccepted !== false
      || policy.sourceRootsReadOnly !== true
      || policy.overwriteOriginals !== false
      || policy.publishCapability !== false) {
      add("safety", "Media manifest must remain blocked, local-only, credential-free, source-read-only, non-destructive, and non-publishing.");
    }
    if (!Array.isArray(mediaManifest.mediaRecords) || mediaManifest.mediaRecords.length < 2) {
      add("assets", "Media manifest must retain at least two fictional quarantined records.");
    } else {
      for (const record of mediaManifest.mediaRecords) {
        if (record.fileIncludedInFixture !== false
          || record.sha256 !== null
          || record.byteLength !== null
          || record.probeReceiptSha256 !== null
          || record.technicalMetadata !== null
          || record.rights?.status !== "unknown"
          || record.rights?.licenseEvidence !== null
          || record.rights?.consentEvidence !== null
          || record.intakeDecision !== "quarantine"
          || record.releaseEligible !== false
          || !record.blockingReasons?.length) {
          add("rights", `${record.mediaId ?? "unknown media"}: fictional manifest record must remain absent, unhashed, unlicensed, unconsented, quarantined, and release-ineligible.`);
        }
      }
    }
    if (decision.eligibleForAnalysis !== false
      || decision.eligibleForEditing !== false
      || decision.eligibleForRendering !== false
      || decision.eligibleForPublication !== false
      || decision.defaultWhenEvidenceIsMissing !== "block-and-request-human-review"
      || decision.decisionOwner !== null
      || decision.decisionTimestamp !== null) {
      add("rights", "Manifest decision must fail closed with no analysis, edit, render, or publication authority.");
    }
  }

  const editPlanSchema = readJson(`${ASSET_DIRECTORY}/edit-plan.schema.json`);
  if (editPlanSchema) {
    const topRequired = editPlanSchema.required ?? [];
    const execution = editPlanSchema.$defs?.executionPolicy?.properties ?? {};
    const operation = editPlanSchema.$defs?.operation ?? {};
    const frameRange = editPlanSchema.$defs?.frameRange ?? {};
    const teachingBranch = editPlanSchema.allOf?.[0]?.then?.properties ?? {};
    const teachingRequired = editPlanSchema.allOf?.[0]?.then?.required ?? [];
    const productionForbidden = editPlanSchema.allOf?.[0]?.else?.not?.required ?? [];
    const productionRights = editPlanSchema.allOf?.[0]?.else?.properties?.timeline?.properties
      ?.operations?.items?.properties?.rightsState;
    for (const field of ["schemaVersion", "planId", "planMode", "status", "inputs", "timeline", "executionPolicy"]) {
      if (!topRequired.includes(field)) add("assets", `Edit-plan schema top-level required list is missing ${field}.`);
    }
    if (editPlanSchema.$schema !== "https://json-schema.org/draft/2020-12/schema"
      || !editPlanSchema.$id?.endsWith("edit-plan.v2.schema.json")
      || editPlanSchema.type !== "object"
      || editPlanSchema.additionalProperties !== false
      || editPlanSchema.properties?.schemaVersion?.const !== "aicourse.agentic-video-editing.edit-plan.v2"
      || editPlanSchema.properties?.status?.enum?.includes("approved")
      || Object.hasOwn(editPlanSchema.properties ?? {}, "approvals")
      || Object.hasOwn(editPlanSchema.properties ?? {}, "releaseDecision")
      || Object.hasOwn(editPlanSchema.$defs ?? {}, "approval")
      || Object.hasOwn(editPlanSchema.$defs ?? {}, "releaseDecision")
      || topRequired.includes("fixtureId")
      || execution.dryRunRequired?.const !== true
      || execution.overwriteOriginals?.const !== false
      || execution.allowNetwork?.const !== false
      || execution.allowPublish?.const !== false
      || execution.stopOnInputHashMismatch?.const !== true
      || execution.stopOnUnresolvedAmbiguity?.const !== true
      || operation.additionalProperties !== false
      || operation.properties?.requiresHumanReview?.const !== true
      || !same(operation.required, ["operationId", "kind", "trackId", "sourceMediaId", "sourceFrames", "timelineStartFrame", "reason", "evidence", "confidence", "ambiguity", "rightsState", "requiresHumanReview"])
      || !same(Object.keys(operation.properties ?? {}), ["operationId", "kind", "trackId", "sourceMediaId", "sourceFrames", "timelineStartFrame", "reason", "evidence", "confidence", "ambiguity", "rightsState", "requiresHumanReview"])
      || !same(frameRange.required, ["startInclusive", "durationFrames"])
      || frameRange.properties?.durationFrames?.minimum !== 1
      || teachingBranch.fixtureId?.const !== "course20-cut-plan-lab-v2"
      || !teachingRequired.includes("fixtureId")
      || !productionForbidden.includes("fixtureId")
      || teachingBranch.status?.const !== "blocked"
      || productionRights?.const !== "approved-for-declared-use"
      || !/(?:realpath|symlink)/iu.test(editPlanSchema.$comment ?? "")
      || !/(?:hash)/iu.test(editPlanSchema.$comment ?? "")
      || !/(?:human)/iu.test(editPlanSchema.$comment ?? "")) {
      add("safety", "Edit-plan v2 must remain a strict plan-only contract with frame ranges, dry-run-first non-destructive execution, blocked teaching fixtures, production rights constraints, and explicit runtime/human-review boundaries.");
    }
    try {
      const ajv = new Ajv2020({ allErrors: true, strict: true });
      const validateSchema = ajv.compile(editPlanSchema);
      if (!schemaFixturePlan) {
        add("assets", "Edit-plan schema validation fixture was not built by the Cut Plan Lab gate.");
      } else {
        if (!validateSchema(schemaFixturePlan)) {
          add("assets", `Edit-plan Draft 2020-12 schema rejected the canonical Cut Plan Lab plan (${ajv.errorsText(validateSchema.errors)}).`);
        }
        const unexpectedProperty = structuredClone(schemaFixturePlan);
        unexpectedProperty.unexpected = true;
        if (validateSchema(unexpectedProperty)) {
          add("assets", "Edit-plan Draft 2020-12 schema accepted an undeclared top-level property.");
        }
        const missingOperationReason = structuredClone(schemaFixturePlan);
        delete missingOperationReason.timeline.operations[0].reason;
        if (validateSchema(missingOperationReason)) {
          add("assets", "Edit-plan Draft 2020-12 schema accepted an operation with a missing required reason.");
        }
        const teachingWithoutFixtureId = structuredClone(schemaFixturePlan);
        delete teachingWithoutFixtureId.fixtureId;
        if (validateSchema(teachingWithoutFixtureId)) {
          add("assets", "Edit-plan Draft 2020-12 schema accepted a teaching plan without its required fixture identity.");
        }
        const productionPlan = structuredClone(schemaFixturePlan);
        delete productionPlan.fixtureId;
        productionPlan.planMode = "production";
        productionPlan.status = "ready-for-human-review";
        productionPlan.inputs[0] = {
          inputKind: "source-media",
          mediaId: "fixture-interview-a",
          expectedSha256: "a".repeat(64),
          manifestDecision: "eligible-for-editing",
          rightsDecision: "approved-for-declared-use",
          probeReceiptSha256: "b".repeat(64),
          expectedDurationFrames: 3_660,
        };
        for (const operation of productionPlan.timeline.operations) {
          operation.rightsState = "approved-for-declared-use";
          operation.evidence[0].artifactSha256 = "c".repeat(64);
          operation.evidence[0].evidenceMode = "source-record";
        }
        if (!validateSchema(productionPlan)) {
          add("assets", `Edit-plan Draft 2020-12 schema rejected the canonical production-plan branch (${ajv.errorsText(validateSchema.errors)}).`);
        }
        const productionWithFixtureId = structuredClone(productionPlan);
        productionWithFixtureId.fixtureId = "forged-production-fixture";
        if (validateSchema(productionWithFixtureId)) {
          add("assets", "Edit-plan Draft 2020-12 schema allowed a production plan to claim a teaching-fixture identity.");
        }
      }
    } catch (error) {
      add("assets", `Edit-plan Draft 2020-12 schema failed strict compilation (${error instanceof Error ? error.message : String(error)}).`);
    }
  }

  requireTokens(`${ASSET_DIRECTORY}/qc-checklist.md`, [
    "Candidate render SHA-256",
    "do not publish / 不发布",
    "service providers",
    "服务提供商",
    "Intake, rights, and privacy / 入库、权利与隐私",
    "Technical playback / 技术播放",
    "Meaning, chronology, and human editorial review",
    "Captions, audio, and accessibility",
    "Reproducibility, security, and delivery",
    "Named human release decision",
    "agent may prepare evidence but may not",
  ], "assets");
  requireTokens(`${ASSET_DIRECTORY}/NOTICE.md`, [
    "original text fixtures",
    "no source video",
    "third-party code",
    "link-and-paraphrase-only",
    "missing upstream license is not permission",
    "do not publish / 不发布",
    "fixtures.provenance.json",
    "SHA-256",
    "do not inspect learner media",
  ], "rights");

  const publicTexts = HASHED_PUBLIC_FILES
    .map((name) => readText(`${ASSET_DIRECTORY}/${name}`))
    .join("\n");
  for (const [pattern, label] of [
    [/(?:^|[\s("'`])\/(?:Users|home)\/[^\s"'`]+/imu, "absolute workstation path"],
    [/\b(?:api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["'][^"']+["']/iu, "credential-like assignment"],
    [/<(?:img|video|audio|iframe)\b/iu, "embedded media markup"],
    [/data:(?:image|video|audio)\//iu, "embedded media data URL"],
  ]) {
    if (pattern.test(publicTexts)) add("privacy", `${ASSET_DIRECTORY}: public fixture text contains an unexpected ${label}.`);
  }

  if (release) {
    const packageJson = readJson("package.json");
    if (packageJson) {
      const scripts = packageJson.scripts ?? {};
      const expectedContentCommand = "node --import tsx scripts/check-agentic-video-editing-course.mjs";
      const expectedReleaseCommand = `${expectedContentCommand} --release`;
      const expectedStaticCommand = "node scripts/check-agentic-video-editing-static.mjs";
      const expectedBrowserCommand = "playwright test --config tests/agentic-video-editing-playwright.config.ts --workers=1";
      if (packageJson.devDependencies?.ajv !== "8.20.0") {
        add("release", "Course 20 schema gate requires the exact Ajv 8.20.0 Draft 2020-12 validator dependency.");
      }
      if (scripts[`${COURSE_ID}:check`] !== expectedContentCommand) {
        add("release", `${COURSE_ID}:check must be ${JSON.stringify(expectedContentCommand)}.`);
      }
      if (scripts[`${COURSE_ID}:check:release`] !== expectedReleaseCommand) {
        add("release", `${COURSE_ID}:check:release must be ${JSON.stringify(expectedReleaseCommand)}.`);
      }
      if (scripts[`${COURSE_ID}:static-check`] !== expectedStaticCommand) {
        add("release", `${COURSE_ID}:static-check must be ${JSON.stringify(expectedStaticCommand)}.`);
      }
      if (scripts[`test:${COURSE_ID}`] !== expectedBrowserCommand) {
        add("release", `test:${COURSE_ID} must be ${JSON.stringify(expectedBrowserCommand)}.`);
      }
      for (const buildName of ["build", "build:release"]) {
        const steps = typeof scripts[buildName] === "string" ? scripts[buildName].split(" && ") : [];
        const releaseStep = `npm run ${COURSE_ID}:check:release`;
        const staticStep = `npm run ${COURSE_ID}:static-check`;
        const releaseIndex = steps.indexOf(releaseStep);
        const buildIndex = steps.indexOf("next build");
        const staticIndex = steps.indexOf(staticStep);
        if (steps.filter((step) => step === releaseStep).length !== 1
          || steps.filter((step) => step === "next build").length !== 1
          || steps.filter((step) => step === staticStep).length !== 1
          || releaseIndex < 0 || buildIndex < 0 || staticIndex < 0
          || !(releaseIndex < buildIndex && buildIndex < staticIndex)) {
          add("release", `${buildName}: Course 20 release gate must run exactly once before next build and its static gate exactly once after next build.`);
        }
        if (buildName === "build:release") {
          const browserStep = `npm run test:${COURSE_ID}`;
          const browserIndex = steps.indexOf(browserStep);
          if (steps.filter((step) => step === browserStep).length !== 1
            || browserIndex < 0 || !(staticIndex < browserIndex)) {
            add("release", `${buildName}: Course 20 browser acceptance must run exactly once after the static output gate.`);
          }
        }
      }
    }

    requireTokens(`app/[locale]/${COURSE_ID}/page.tsx`, [
      "dynamicParams = false",
      "generateStaticParams",
      "AGENTIC_VIDEO_EDITING_LOCALES",
      "validateAgenticVideoEditingCourse",
    ]);
    requireTokens(`app/[locale]/${COURSE_ID}/[module]/page.tsx`, [
      "dynamicParams = false",
      "generateStaticParams",
      "AGENTIC_VIDEO_EDITING_MODULE_SLUGS",
      "validateAgenticVideoEditingCourse",
    ]);
    requireTokens("README.md", [
      "Course: How to Edit Video with Agents",
      "20 GitHub",
      "direct X posts",
      "agentic-video-editing:check:release",
      "public/courses/agentic-video-editing/NOTICE.md",
    ]);
    requireTokens("tests/agentic-video-editing-course.spec.ts", [
      "all ten independent module routes render",
      "Cut Plan Lab passes a safe text fixture",
      "a failed repeat attempt is not presented as a current pass",
      "mobile layout keeps controls labelled",
      "static export acceptance preserves a missing-route 404",
    ]);
    const browserConfig = requireTokens("tests/agentic-video-editing-playwright.config.ts", [
      "serve-agentic-video-editing-static.mjs",
      "managedBaseURL",
      "webServer",
      "reuseExistingServer: false",
      "/en/agentic-video-editing/",
    ]);
    if (browserConfig.includes("PLAYWRIGHT_BASE_URL")) {
      add("release", "Course 20 release browser config must not permit an external base URL to bypass the candidate out/ server.");
    }
    requireTokens("scripts/serve-agentic-video-editing-static.mjs", [
      "Static export is missing",
      "no SPA fallback",
      "Not found",
      "out",
    ]);

    try {
      const [{ TOP_LEVEL_COURSES, CATALOG_COURSES }, { PAGES }] = await Promise.all([
        importFresh(abs("lib/courses.ts")),
        importFresh(abs("lib/seo.ts")),
      ]);
      const top = TOP_LEVEL_COURSES.find((course) => course.id === COURSE_ID);
      const catalog = CATALOG_COURSES.find((course) => course.id === COURSE_ID);
      if (!top || top.displayNumber !== 20 || top.href !== `/${COURSE_ID}/`
        || top.status !== "available" || top.minutes !== 750
        || !same([...top.moduleIds], EXPECTED_MODULE_SLUGS)
        || top.progressStrategy !== "twelve-equal-milestones") {
        add("release", "Course 20 top-level registration must be available, numbered 20, 750 minutes, linkable, and closed over ten modules plus two milestones.");
      }
      if (!catalog || catalog.displayNumber !== 20 || catalog.href !== `/${COURSE_ID}/`
        || catalog.status !== "available" || catalog.minutes !== 750
        || !same([...catalog.contentLocales], REVIEWED_CONTENT_LOCALES)) {
        add("release", "Course 20 catalogue registration must be available and advertise only English and Simplified Chinese content.");
      }
      const expectedPages = [
        `${COURSE_ID}/`,
        ...EXPECTED_MODULE_SLUGS.map((slug) => `${COURSE_ID}/${slug}/`),
      ];
      for (const page of expectedPages) {
        if (PAGES.filter((candidate) => candidate === page).length !== 1) {
          add("release", `SEO PAGES must contain ${page} exactly once.`);
        }
      }
    } catch (error) {
      add("release", `Course catalogue/SEO import failed: ${error instanceof Error ? error.message : String(error)}.`);
    }

    for (const locale of EXPECTED_LOCALES) {
      const messages = readJson(`messages/${locale}.json`);
      if (!messages) continue;
      for (const key of REQUIRED_MESSAGE_KEYS) {
        if (typeof messages[key] !== "string" || !messages[key].trim()) {
          add("language", `messages/${locale}.json: missing non-empty ${key}.`);
        }
      }
      const contentLanguage = messages[`c.${COURSE_ID}.contentLanguage`] ?? "";
      if (locale === "zh-Hans") {
        if (!/(?:简体中文|Simplified Chinese)/iu.test(contentLanguage)) {
          add("language", `messages/${locale}.json: must identify Simplified Chinese course content.`);
        }
      } else if (!/(?:English|inglés|anglais|Englisch|英语|英文|英語|영어|الإنجليزية)/iu.test(contentLanguage)) {
        add("language", `messages/${locale}.json: fallback route must identify English course content.`);
      }
    }
  }

  if (!issues.length) {
    note("Source ledger closes exactly over 20 commit-pinned GitHub records and 5 provenance-rich direct X posts.");
    note("Four phases, modules 1–10, 750 minutes, two reviewed languages, assessment, capstone, and progress contracts close.");
    note("Five original learning files plus one integrity ledger are regular, rights-bounded, and fail-closed; the five learning files are hash-bound and no learner media is inspected.");
    if (release) note("Routes, catalogue, SEO, message keys, README, and pre/post-build package gates are wired for release.");
  }

  return {
    schemaVersion: 1,
    courseId: COURSE_ID,
    mode: release ? "release" : "content",
    status: issues.length ? "fail" : "pass",
    snapshot: SNAPSHOT_DATE,
    counts,
    issues,
    notes,
  };
}

export function formatAgenticVideoEditingCheck(result) {
  const lines = [
    `agentic video editing course: ${result.status.toUpperCase()} (${result.mode})`,
    `${result.counts.phases} phases · ${result.counts.modules} modules · ${result.counts.minutes} minutes · ${result.counts.milestones} milestones`,
    `${result.counts.github} GitHub repositories · ${result.counts.xPosts} direct X posts · ${result.counts.questions} assessment questions · ${result.counts.capstoneArtifacts} capstone artifacts`,
  ];
  for (const issue of result.issues) lines.push(`- [${issue.gate}] ${issue.message}`);
  for (const message of result.notes) lines.push(`- ${message}`);
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const result = await checkAgenticVideoEditingCourse({
    release: process.argv.includes("--release"),
  });
  console.log(process.argv.includes("--json")
    ? JSON.stringify(result, null, 2)
    : formatAgenticVideoEditingCheck(result));
  if (result.status !== "pass") process.exitCode = 1;
}
