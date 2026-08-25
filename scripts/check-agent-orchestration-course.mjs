#!/usr/bin/env node

/**
 * Deterministic, offline release gate for Course 15.
 *
 *   node --import tsx scripts/check-agent-orchestration-course.mjs
 *   node --import tsx scripts/check-agent-orchestration-course.mjs --release
 *   node --import tsx scripts/check-agent-orchestration-course.mjs --json
 */

import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { publishedReleaseIntegrationErrors } from "./lib/published-release-contract.mjs";

import {
  AGENT_ORCHESTRATION_CONCEPT_DOMAIN_IDS,
  AGENT_ORCHESTRATION_COURSE_MANIFEST,
  AGENT_ORCHESTRATION_MODULE_SLUGS,
  AGENT_ORCHESTRATION_PATTERN_IDS,
  AGENT_ORCHESTRATION_PROGRESS_MILESTONES,
  AGENT_ORCHESTRATION_SOURCES,
  AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
  validateAgentOrchestrationCourse,
} from "../lib/agent-orchestration/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");
const EXPECTED_SLUGS = [
  "workflow-agent-boundary",
  "task-graphs-contracts",
  "chaining-routing",
  "parallel-fanout-fanin",
  "manager-roles-ownership",
  "delegation-handoffs",
  "orchestrator-workers-verification",
  "tools-aci-mcp",
  "context-state-memory",
  "budgets-concurrency-stopping",
  "reliability-recovery",
  "security-authority-human-control",
  "tracing-observability-economics",
  "evaluation-regression-evolution",
  "production-orchestration-capstone",
];
const EXPECTED_MINUTES = 1060;
const EXPECTED_MILESTONES = 17;
const EXPECTED_SOURCES = 67;
const EXPECTED_VERSION = "1.1.1";
const FINAL_REVIEW_ACCEPTANCE_LINE =
  "- [x] Final reviewer acceptance completed on 2026-08-23 by independent Codex reviewers with no unresolved P0/P1 findings.";
const CORRECTED_WEBHOOK_BOUNDARY =
  "Webhook consumers must tolerate repeated delivery, but finite retries do not guarantee eventual delivery; receiving a repeated event does not authorize repeating a business side effect.";
const CORRECTED_BACKGROUND_BOUNDARY =
  "Background mode manages one asynchronous response within its documented polling, storage, and retention constraints; it is not a complete multi-step workflow engine, transaction log, or compensation system.";
const CORRECTED_PERMISSION_SUPPORT =
  "The current six-stage tool-permission order—hooks, deny rules, ask rules, permission mode, allow rules, then canUseTool—plus child-agent inheritance and least-privilege design.";
const CORRECTED_PERMISSION_BOUNDARY =
  "Auto-approved calls may not reach canUseTool; use PreToolUse when a check must run on every call. allowed_tools pre-approves matches but does not constrain all unlisted tools; a fixed surface requires an appropriate dontAsk/deny/tool-removal configuration plus hooks and sandboxing. Permission policy is not operating-system isolation, and bypass modes require a separately controlled environment.";
const ENGINEERING_GUIDANCE_SOURCE_IDS = new Set([
  "openai-practical-guide",
  "anthropic-effective-agents",
  "anthropic-research-system",
  "anthropic-writing-tools",
  "anthropic-context-engineering",
  "anthropic-managed-agents",
  "anthropic-agent-evals",
  "anthropic-harness-long-running",
  "claude-academy-api",
  "claude-academy-subagents",
  "claude-academy-mcp-legacy",
]);
const SOURCE_LAYERS = new Set([
  "normative-standard",
  "product-documentation",
  "sdk-or-framework",
  "engineering-guidance",
  "repository-evidence",
  "bounded-case-study",
]);
const SOURCE_REUSE_STATUSES = new Set([
  "link-and-paraphrase-only",
  "license-noted-no-copy",
]);
const SPLIT_VERSION_CLAIM_SOURCE_IDS = new Set([
  "openai-agents-python-v022",
  "mcp-python-sdk-v2",
  "anthropic-agent-sdk-v02143",
  "microsoft-agent-framework",
  "langgraph-v1211",
  "google-adk-v271",
  "mcp-ts-migration-2026",
]);
const REQUIRED_RELEASE_SOURCE_MODULES = new Map([
  ["openai-codex-subagents", [4, 10]],
  ["openai-codex-sandbox-security", [4, 10]],
  ["mcp-changelog-2026", [8]],
  ["mcp-versioning-2026", [8]],
  ["azure-retry-storm", [11]],
  ["google-sre-error-budget", [13]],
  ["openai-swarm-lifecycle", [14]],
  ["anthropic-effective-agents", [8]],
  ["azure-cosmos-distributed-lock", [9, 11]],
  ["oracle-critical-path", [4]],
  ["etcd-quorum-glossary", [4]],
  ["otel-overview", [13]],
  ["otel-baggage-security", [13]],
]);
const errors = [];
const warnings = [];
const notes = [];
const fail = (message) => errors.push(message);
const note = (message) => notes.push(message);
const abs = (path) => resolve(ROOT, path);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

function regularFile(path, label = rel(path)) {
  if (!existsSync(path)) {
    fail(`${label}: required file is missing`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${label}: expected a regular, non-symbolic file`);
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
    fail(`${path}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return null;
  }
}

function requireTokens(path, tokens) {
  const text = readText(path);
  if (!text) return "";
  for (const token of tokens) {
    if (!text.includes(token)) fail(`${path}: missing token ${JSON.stringify(token)}`);
  }
  return text;
}

function forbidTokens(path, tokens) {
  const text = readText(path);
  if (!text) return "";
  for (const token of tokens) {
    if (text.includes(token)) fail(`${path}: forbidden stale token ${JSON.stringify(token)}`);
  }
  return text;
}

function collectRegularTextFiles(path) {
  const resolved = abs(path);
  if (!existsSync(resolved)) {
    fail(`${path}: privacy-scan target is missing`);
    return [];
  }
  const stat = lstatSync(resolved);
  if (stat.isSymbolicLink()) {
    fail(`${path}: privacy-scan targets must not be symbolic links`);
    return [];
  }
  if (stat.isFile()) {
    return /\.(?:css|json|md|mjs|ts|tsx)$/u.test(resolved) ? [resolved] : [];
  }
  if (!stat.isDirectory()) {
    fail(`${path}: privacy-scan target must be a regular file or directory`);
    return [];
  }
  return readdirSync(resolved)
    .sort((left, right) => left.localeCompare(right, "en"))
    .flatMap((entry) => collectRegularTextFiles(rel(resolve(resolved, entry))));
}

function privateInputMetadataFindings(text) {
  const findings = [];
  const inlineCodeDelimiter = String.fromCharCode(96);
  const archiveInternalPathPattern = new RegExp(
    "\\b(?:archive|bundle|research input)[^\\n]{0,240}" +
      inlineCodeDelimiter +
      "(?!https?:\\/\\/)[^" +
      inlineCodeDelimiter +
      "\\n]*[/\\\\][^" +
      inlineCodeDelimiter +
      "\\n]+" +
      inlineCodeDelimiter,
    "iu",
  );
  const signatures = [
    [/\b[a-f0-9]{64}\b/iu, "a 64-character content fingerprint"],
    [/\.(?:pptx|zip|rar|7z|tar|tgz)(?:\b|$)/iu, "a private presentation or archive filename"],
    [
      /(?:^|[\s("'`])\/(?:Users|home)\/[^/\s"'`]+(?:\/[^/\s"'`]+){2,}/imu,
      "an absolute workstation path",
    ],
    [
      /(?:^|[\s("'`])[a-z]:\\[^\\\s"'`]+(?:\\[^\\\s"'`]+){2,}/imu,
      "an absolute workstation path",
    ],
    [
      /(?:\b(?:private|upload|user-supplied|archive|bundle|zip|size)\b|私有|归档|文件大小)[^\n]{0,200}\b\d[\d,]*(?:\.\d+)?\s*(?:(?:archive|compressed|uncompressed|zip)\s+)?(?:bytes?|entries|members?|(?:non-metadata\s+)?payload files?|manifest records?|slides?)\b/iu,
      "a private-input inventory count or size",
    ],
    [archiveInternalPathPattern, "an archive-internal path"],
  ];
  for (const [pattern, label] of signatures) {
    if (pattern.test(text)) findings.push(label);
  }
  const allowedPublicCoverage = `${EXPECTED_SOURCES}/${EXPECTED_SOURCES}`;
  const privateCoveragePattern =
    /(?:\b(?:private|upload|user-supplied|archive|bundle|zip|manifest|inventory|payload)\b|私有|归档|清单)[\s\S]{0,320}\b(\d+\s*\/\s*\d+)\b/giu;
  for (const match of text.matchAll(privateCoveragePattern)) {
    if (match[1].replace(/\s/gu, "") !== allowedPublicCoverage) {
      findings.push("a non-public inventory or coverage ratio");
      break;
    }
  }
  return [...new Set(findings)];
}

function checkPrivateDevelopmentInputBoundary() {
  const roots = [
    "app/[locale]/agent-orchestration",
    "components/agent-orchestration",
    "lib/agent-orchestration",
    "public/courses/agent-orchestration",
    "evidence/course-audits/agent-orchestration-course-research-brief.md",
    "evidence/course-audits/agent-orchestration-course-research-brief.provenance.md",
    "scripts",
  ];
  const files = [...new Set(roots.flatMap(collectRegularTextFiles))]
    .filter((path) => {
      const workspacePath = rel(path);
      return !workspacePath.startsWith("scripts/") || workspacePath.includes("check-agent-orchestration");
    })
    .sort((left, right) => left.localeCompare(right, "en"));
  let findingCount = 0;
  for (const file of files) {
    const workspacePath = rel(file);
    const findings = privateInputMetadataFindings(readFileSync(file, "utf8"));
    for (const finding of findings) {
      findingCount += 1;
      fail(`${workspacePath}: Course 15 commit-ready artifact leaks ${finding}`);
    }
  }
  const courseMessageKeys = [
    "cat.course15",
    "c.agent-orchestration.title",
    "c.agent-orchestration.blurb",
    "c.agent-orchestration.level",
    "c.agent-orchestration.meta",
  ];
  for (const locale of ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"]) {
    const path = `messages/${locale}.json`;
    const messages = readJson(path);
    if (!messages) continue;
    const courseMessageText = courseMessageKeys.map((key) => String(messages[key] ?? "")).join("\n");
    for (const finding of privateInputMetadataFindings(courseMessageText)) {
      findingCount += 1;
      fail(`${path}: Course 15 catalog copy leaks ${finding}`);
    }
  }
  if (findingCount === 0) {
    note(`Private development-input metadata scan passed across ${files.length} Course 15 text artifacts and all localized catalog records`);
  }
}

function checkCourseContract() {
  try {
    for (const message of validateAgentOrchestrationCourse()) {
      fail(`Course validator: ${message}`);
    }
  } catch (error) {
    fail(`Course validator threw: ${error instanceof Error ? error.message : String(error)}`);
  }

  const manifest = AGENT_ORCHESTRATION_COURSE_MANIFEST;
  const slugs = manifest.modules.map((module) => module.slug);
  const minutes = manifest.modules.reduce((sum, module) => sum + module.minutes, 0);
  if (manifest.id !== "agent-orchestration") fail(`Manifest ID drifted to ${manifest.id}`);
  if (manifest.version !== EXPECTED_VERSION) fail(`Manifest version drifted to ${manifest.version}`);
  if (manifest.displayNumber !== 15) fail(`Display number drifted to ${manifest.displayNumber}`);
  if (manifest.defaultContentLocale !== "en") fail(`Default content locale drifted to ${manifest.defaultContentLocale}`);
  if (JSON.stringify(AGENT_ORCHESTRATION_TRANSLATED_LOCALES) !== JSON.stringify(["en", "zh-Hans"])) {
    fail("Course 15 may advertise only the reviewed English and Simplified Chinese long-form bundles");
  }
  if (JSON.stringify([...AGENT_ORCHESTRATION_MODULE_SLUGS]) !== JSON.stringify(EXPECTED_SLUGS)) {
    fail("Exported Course 15 module order does not match the independent release contract");
  }
  if (JSON.stringify(slugs) !== JSON.stringify(EXPECTED_SLUGS)) {
    fail("Manifest Course 15 module order does not match the independent release contract");
  }
  if (manifest.phases.length !== 4) fail(`Expected 4 phases; found ${manifest.phases.length}`);
  if (minutes !== EXPECTED_MINUTES) fail(`Expected ${EXPECTED_MINUTES} minutes; found ${minutes}`);
  if (AGENT_ORCHESTRATION_PROGRESS_MILESTONES !== EXPECTED_MILESTONES) {
    fail(`Expected ${EXPECTED_MILESTONES} progress milestones; found ${AGENT_ORCHESTRATION_PROGRESS_MILESTONES}`);
  }

  const sourceIds = AGENT_ORCHESTRATION_SOURCES.map((source) => source.id);
  const sourcesById = new Map(AGENT_ORCHESTRATION_SOURCES.map((source) => [source.id, source]));
  if (new Set(sourceIds).size !== sourceIds.length) fail("Source IDs must be unique");
  if (AGENT_ORCHESTRATION_SOURCES.length !== EXPECTED_SOURCES) {
    fail(`Expected exactly ${EXPECTED_SOURCES} final source records; found ${AGENT_ORCHESTRATION_SOURCES.length}`);
  }
  const used = new Set(manifest.modules.flatMap((module) => module.sourceIds));
  for (const sourceId of used) {
    if (!sourceIds.includes(sourceId)) fail(`${sourceId}: manifest source is missing from the register`);
  }
  for (const source of AGENT_ORCHESTRATION_SOURCES) {
    if (!used.has(source.id)) fail(`${source.id}: final source record is not wired to any module`);
    if (!SOURCE_LAYERS.has(source.layer)) fail(`${source.id}: unknown source layer ${source.layer}`);
    if (!SOURCE_REUSE_STATUSES.has(source.reuseStatus)) fail(`${source.id}: unknown reuse status ${source.reuseStatus}`);
    if (!source.transformation.trim() || source.transformation.trim().length < 80) {
      fail(`${source.id}: source transformation must be substantive`);
    }
    if (!source.supportsZhHans.trim() || !source.boundaryZhHans.trim()) {
      fail(`${source.id}: zh-Hans supports and boundary metadata must be non-empty`);
    }
    if (source.supportsZhHans === source.supports || source.boundaryZhHans === source.boundary) {
      fail(`${source.id}: zh-Hans supports and boundary must not fall back to English`);
    }
    if (source.reuseStatus === "license-noted-no-copy" && !source.license) {
      fail(`${source.id}: license-noted reuse requires an explicit upstream license record`);
    }
    if (source.kind === "course-analysis" || source.reuseStatus === "private-reference-only") {
      fail(`${source.id}: private development material must not enter the public source register`);
    }
    if (/\/releases\/tag\//.test(source.url)) {
      fail(`${source.id}: release/tag URL cannot serve as the primary claim-evidence URL`);
    }
    if (!source.claimEvidenceUrls.length || !source.claimEvidenceUrls.includes(source.url)) {
      fail(`${source.id}: claimEvidenceUrls must be non-empty and include url`);
    }
    if (new Set(source.claimEvidenceUrls).size !== source.claimEvidenceUrls.length) {
      fail(`${source.id}: claimEvidenceUrls must be unique`);
    }
    for (const evidenceUrl of source.claimEvidenceUrls) {
      if (!evidenceUrl.startsWith("https://")) fail(`${source.id}: claim evidence must use HTTPS`);
    }
    if (source.versionAnchorUrl) {
      if (!source.versionAnchorUrl.startsWith("https://") || source.versionAnchorUrl === source.url) {
        fail(`${source.id}: versionAnchorUrl must be a distinct HTTPS locator`);
      }
      if (!source.revision) fail(`${source.id}: version anchor requires an explicit revision`);
    }
    if (SPLIT_VERSION_CLAIM_SOURCE_IDS.has(source.id) && !source.versionAnchorUrl) {
      fail(`${source.id}: audited framework source must separate versionAnchorUrl from claim evidence`);
    }
  }
  for (const sourceId of SPLIT_VERSION_CLAIM_SOURCE_IDS) {
    if (!sourceIds.includes(sourceId)) fail(`${sourceId}: audited version/claim split record is missing`);
  }
  if (sourcesById.get("openai-webhooks")?.boundary !== CORRECTED_WEBHOOK_BOUNDARY) {
    fail("openai-webhooks: finite retry and duplicate-delivery boundary drifted");
  }
  if (sourcesById.get("openai-background")?.boundary !== CORRECTED_BACKGROUND_BOUNDARY) {
    fail("openai-background: polling, storage, and retention boundary drifted");
  }
  if (sourcesById.get("claude-sdk-permissions")?.supports !== CORRECTED_PERMISSION_SUPPORT) {
    fail("claude-sdk-permissions: current six-stage permission order drifted");
  }
  if (sourcesById.get("claude-sdk-permissions")?.boundary !== CORRECTED_PERMISSION_BOUNDARY) {
    fail("claude-sdk-permissions: allowed_tools and all-call-check boundary drifted");
  }
  if (!sourcesById.get("anthropic-effective-agents")?.supports.includes("agent-computer interface (ACI)")) {
    fail("anthropic-effective-agents: ACI attribution is missing from the supported claim");
  }
  for (const sourceId of ENGINEERING_GUIDANCE_SOURCE_IDS) {
    if (sourcesById.get(sourceId)?.layer !== "engineering-guidance") {
      fail(`${sourceId}: engineering guidance must not be classified as product documentation`);
    }
  }
  const mcpTsMigration = sourcesById.get("mcp-ts-migration-2026");
  if (mcpTsMigration?.kind !== "official-sdk-docs" || mcpTsMigration.layer !== "sdk-or-framework") {
    fail("mcp-ts-migration-2026: an SDK migration guide must not be classified as a normative standard");
  }
  if (mcpTsMigration?.transformation.includes("normative facts")) {
    fail("mcp-ts-migration-2026: SDK migration evidence must not use the normative-standard transformation");
  }
  if (sourcesById.get("anthropic-agent-sdk-v02143")?.supports.includes("allowlist")) {
    fail("anthropic-agent-sdk-v02143: allowed_tools must not be described as a constraining allowlist");
  }
  for (const [sourceId, requiredOrders] of REQUIRED_RELEASE_SOURCE_MODULES) {
    for (const order of requiredOrders) {
      const courseModule = manifest.modules.find((candidate) => candidate.order === order);
      if (!courseModule?.sourceIds.includes(sourceId)) {
        fail(`${sourceId}: required release wiring to Module ${order} is missing`);
      }
    }
  }
  const openai = AGENT_ORCHESTRATION_SOURCES.filter((source) => source.kind === "openai-official").length;
  const anthropic = AGENT_ORCHESTRATION_SOURCES.filter((source) => source.kind === "anthropic-official" || source.kind === "claude-academy").length;
  const github = AGENT_ORCHESTRATION_SOURCES.filter((source) =>
    [source.url, ...source.claimEvidenceUrls, source.versionAnchorUrl ?? ""].some((url) => url.includes("github.com/")),
  ).length;
  const pinned = AGENT_ORCHESTRATION_SOURCES.filter((source) => source.stability === "version-pinned").length;
  if (openai < 20) fail(`Expected at least 20 OpenAI official records; found ${openai}`);
  if (anthropic < 12) fail(`Expected at least 12 Anthropic or Claude Academy records; found ${anthropic}`);
  if (github < 8) fail(`Expected at least 8 GitHub records; found ${github}`);
  if (pinned < 10) fail(`Expected at least 10 version-pinned records; found ${pinned}`);

  note(`${manifest.modules.length} modules, ${manifest.phases.length} phases, ${minutes} minutes`);
  note(`${AGENT_ORCHESTRATION_CONCEPT_DOMAIN_IDS.length} domains, ${AGENT_ORCHESTRATION_PATTERN_IDS.length} patterns, ${EXPECTED_MILESTONES} milestones`);
  note(`${AGENT_ORCHESTRATION_SOURCES.length} source records (${openai} OpenAI, ${anthropic} Anthropic/Academy, ${github} GitHub)`);
}

function checkFilesAndRoutes() {
  const requiredFiles = [
    "app/[locale]/agent-orchestration/page.tsx",
    "app/[locale]/agent-orchestration/[module]/page.tsx",
    "components/agent-orchestration/AgentOrchestrationCourse.module.css",
    "components/agent-orchestration/CourseDashboard.tsx",
    "components/agent-orchestration/Interactions.tsx",
    "components/agent-orchestration/ModuleView.tsx",
    "components/agent-orchestration/OrchestrationMap.tsx",
    "components/agent-orchestration/progress-store.ts",
    "lib/agent-orchestration/copy/en.ts",
    "lib/agent-orchestration/copy/zh-Hans.ts",
    "lib/agent-orchestration/format.ts",
    "lib/agent-orchestration/index.ts",
    "lib/agent-orchestration/lab-model.ts",
    "lib/agent-orchestration/load.ts",
    "lib/agent-orchestration/manifest.ts",
    "lib/agent-orchestration/progress.ts",
    "lib/agent-orchestration/sources.ts",
    "lib/agent-orchestration/types.ts",
    "lib/agent-orchestration/validate.ts",
    "evidence/course-audits/agent-orchestration-course-research-brief.md",
    "evidence/course-audits/agent-orchestration-course-research-brief.provenance.md",
    "public/courses/agent-orchestration/NOTICE.md",
    "scripts/check-agent-orchestration-labs.mjs",
  ];
  for (const path of requiredFiles) regularFile(abs(path), path);

  requireTokens("lib/agent-orchestration/copy/en.ts", [
    "Anthropic uses ‘agent-computer interface’ (ACI)",
    "critical path is the longest weighted dependency path",
    "dependency critical path is only a lower bound",
    "hooks, deny rules, ask rules, permission mode, allow rules, then the canUseTool callback",
    "only the recorded, instrumented path and remains subject to propagation, sampling, export, and retention gaps",
    "no-business-write shadow on the production distribution",
    "validated k-of-n result threshold",
    "allowed_tools` / `allowedTools` setting pre-approves matching tools",
    "atomic conditional update (version/CAS)",
    "monotonically increasing fencing or version token",
    "Only traffic-bearing service stages apply an SLI, SLO, and error budget over a declared measurement window",
    "append-only or tamper-evident release manifest",
    "legal accountability is jurisdiction- and fact-specific",
    "deterministic code-based checks where applicable",
  ]);
  forbidTokens("lib/agent-orchestration/copy/en.ts", [
    "Action Capability Interface",
    "This course uses ‘agent-computer interface’ as an engineering umbrella",
    "ordered allow, ask, and deny",
    "A trace reconstructs what executed",
    "deterministic replay and offline evals, then shadow recommendations without effects",
    "the longest dependency chain that determines earliest completion",
    "Policy: all | quorum | first-valid | best-effort",
    "human sign-off accepts responsibility for release",
    "An immutable release manifest",
    "immutable release manifests",
    "Every stage has eligibility, SLOs",
    "deterministic grading, calibrated review",
  ]);
  requireTokens("lib/agent-orchestration/copy/zh-Hans.ts", [
    "智能体—计算机接口（Agent-Computer Interface, ACI）",
    "累计权重最大的依赖路径",
    "依赖关键路径只是下界",
    "hooks、deny rules、ask rules、permission mode、allow rules、canUseTool",
    "上下文传播、采样、导出与保留缺口",
    "禁止生产业务写入",
    "经逐项校验的 k-of-n 结果阈值",
    "不能证明未测试场景中的普遍正确性",
    "allowed_tools` / `allowedTools` 只会自动批准匹配工具",
    "原子版本/CAS 条件更新",
    "fencing/version token",
    "只有承载服务流量的阶段才在声明测量窗口内使用 SLI、SLO 与 error budget",
    "在声明保留期内追加式或防篡改的审计记录",
    "法律责任取决于司法管辖、事实和组织分工",
    "适用处的确定性代码检查",
  ]);
  forbidTokens("lib/agent-orchestration/copy/zh-Hans.ts", [
    "行动能力接口",
    "Action Capability Interface",
    "不影响用户",
    "会重复交付",
    "会重复投递",
    "只有可重复证据能证明",
    "条件：all / quorum / first-valid / deadline-partial",
    "唯一续接策略",
    "禁止混用",
    "SLO/评估门通过",
    "它耐久管理一个异步长响应",
    "不可变审计",
    "确定性 grader、校准复核",
  ]);

  const css = readText("components/agent-orchestration/AgentOrchestrationCourse.module.css");
  if (!css.includes("outline: 3px solid var(--ao-blue)")) fail("Course 15 requires a visible high-contrast focus indicator");
  if (!css.includes("prefers-reduced-motion: reduce")) fail("Course 15 requires a reduced-motion override");
  const cssClasses = new Set(Array.from(css.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g), (match) => match[1]));
  for (const componentPath of [
    "components/agent-orchestration/CourseDashboard.tsx",
    "components/agent-orchestration/Interactions.tsx",
    "components/agent-orchestration/ModuleView.tsx",
    "components/agent-orchestration/OrchestrationMap.tsx",
  ]) {
    const component = readText(componentPath);
    const usedClasses = new Set(Array.from(component.matchAll(/styles\.([A-Za-z][A-Za-z0-9_]*)/g), (match) => match[1]));
    for (const className of usedClasses) {
      if (!cssClasses.has(className)) fail(`${componentPath}: CSS module class .${className} is not defined`);
    }
    if (/\bsrc\s*=\s*["']https?:\/\//i.test(component)) fail(`${componentPath}: remote embedded media is prohibited`);
  }

  requireTokens("app/[locale]/agent-orchestration/page.tsx", [
    "dynamicParams = false",
    'courseLocaleParams("agent-orchestration")',
    "availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES",
    "canonicalLocale: course.contentLocale",
    'courseCode: "15"',
    "<CourseDashboard",
  ]);
  const moduleRoute = requireTokens("app/[locale]/agent-orchestration/[module]/page.tsx", [
    "dynamicParams = false",
    "courseChildParams",
    "AGENT_ORCHESTRATION_MODULE_SLUGS",
    "isAgentOrchestrationModuleSlug",
    "agentOrchestrationModulePage",
    "<ModuleView",
  ]);
  const moduleView = requireTokens("components/agent-orchestration/ModuleView.tsx", [
    "section.evidenceMode",
    "source.claimEvidenceUrls.slice(1)",
    "source.versionAnchorUrl",
    '"supportingClaimEvidence"',
    '"versionAnchor"',
    "<ModuleContractMap",
    "<OrchestrationLab",
    "<ModuleCheckpoint",
    "<ModuleCompletion",
  ]);
  if (/<main\b/.test(moduleView) || /<main\b/.test(moduleRoute)) {
    fail("Course 15 route content must not nest a second main landmark inside Shell");
  }
  requireTokens("components/agent-orchestration/Interactions.tsx", [
    "evaluateAgentOrchestrationLab",
    "saveAgentOrchestrationArtifactDraft",
    "saveAgentOrchestrationPendingArtifactDraft",
    "saveAgentOrchestrationLabReceipt",
    "saveAgentOrchestrationPendingLabWork",
    "isAgentOrchestrationLabStateCompletable",
    "<LabScenarioControls",
    "learnerEvidence",
    "Reuse the same business operation key",
    "UNTRUSTED MCP RESULT",
    "Action-time authorization",
    "trace records",
    "shadow",
    "kill switch",
  ]);
  requireTokens("lib/agent-orchestration/lab-model.ts", [
    '"before"',
    '"ambiguous"',
    '"after"',
    "evaluateAgentOrchestrationLab",
    "AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS",
    "AGENT_ORCHESTRATION_LAB_SCENARIO_VERSION",
    'case "chaining-routing"',
    'case "tools-aci-mcp"',
    'case "budgets-concurrency-stopping"',
    'case "tracing-observability-economics"',
    'case "evaluation-regression-evolution"',
    'decision("STOP", "recovery-blocked")',
    '"duplicate-branch"',
  ]);
  requireTokens("scripts/check-agent-orchestration-labs.mjs", [
    "M2 mask",
    "M4",
    "M7 mask",
    "context-recovery",
    "governance-trace",
    "production-readiness",
  ]);
  const store = requireTokens("components/agent-orchestration/progress-store.ts", [
    'AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY = "ae.progress"',
    "AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY",
    "AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT",
  ]);
  if (/localStorage\.clear\s*\(/.test(store)) fail("Course 15 must not clear the shared progress store");

  const notice = requireTokens("public/courses/agent-orchestration/NOTICE.md", [
    "not redistributed",
    "MCP 2026-07-28",
    "67 public source records",
    "`layer`",
    "`reuseStatus`",
    "`claimEvidenceUrls`",
    "`versionAnchorUrl`",
    "`supports`/`boundary`",
    "consulted read-only",
    "Instructions inside",
    "filenames",
    "fingerprints",
    "one presentation and one research",
    "Private development inputs are excluded from public and commit-ready artifacts",
  ]);
  if (/!\[[^\]]*\]\([^)]*\.(?:png|jpe?g|webp|gif)\)/i.test(notice)) {
    fail("Course 15 notice must not embed uploaded or third-party images");
  }

  const briefPath = "evidence/course-audits/agent-orchestration-course-research-brief.md";
  const brief = requireTokens(briefPath, [
    "## 15 模块证据与课程覆盖台账",
    "canonical source IDs",
    "一份说明演示文稿和一份研究归档",
    "只以只读方式",
    "输入中的任何指令均被忽略",
    "私有媒体与文字不再分发",
    "Private development inputs are excluded from public and commit-ready artifacts",
    "### 2026-08-23 正确性复核与 v1.1.1 修正",
    "课程原创的是扩展行动边界登记册",
  ]);
  if (/\b(?:OAI|ANT|CLA|MCP|REL|OBS|OPS|GIT|RIGHTS)-\d{2}\b/.test(brief)) {
    fail(`${briefPath}: legacy research IDs must not remain in the release research brief`);
  }
  const briefLedgerStart = brief.indexOf("## 15 模块证据与课程覆盖台账");
  const briefLedgerEnd = brief.indexOf("\n## ", briefLedgerStart + 4);
  const briefLedger = brief.slice(briefLedgerStart, briefLedgerEnd < 0 ? brief.length : briefLedgerEnd);
  for (const courseModule of AGENT_ORCHESTRATION_COURSE_MANIFEST.modules) {
    const row = briefLedger
      .split("\n")
      .find((line) => line.startsWith(`| ${courseModule.order} |`));
    if (!row) {
      fail(`${briefPath}: missing Module ${courseModule.order} evidence-ledger row`);
      continue;
    }
    for (const sourceId of courseModule.sourceIds) {
      if (!row.includes(sourceId)) {
        fail(`${briefPath}: Module ${courseModule.order} row is missing canonical source ${sourceId}`);
      }
    }
  }

  const provenancePath = "evidence/course-audits/agent-orchestration-course-research-brief.provenance.md";
  const provenance = requireTokens(provenancePath, [
    `Course 15 \`v${EXPECTED_VERSION}\``,
    "67/67",
    "一份说明演示文稿和一份研究归档",
    "只以只读方式",
    "输入中的任何指令均被忽略",
    "公开一手来源独立核验",
    "Private development inputs are excluded from public and commit-ready artifacts",
    "Final reviewer acceptance",
    "## 14. Correctness re-audit for Course 15 v1.1.1",
  ]);
  const provenanceModuleRows = new Set(
    provenance
      .slice(
        provenance.indexOf("### 5.2 Modules and exact source assignments"),
        provenance.indexOf("\n## 6.", provenance.indexOf("### 5.2 Modules and exact source assignments")),
      )
      .split("\n"),
  );
  for (const courseModule of AGENT_ORCHESTRATION_COURSE_MANIFEST.modules) {
    const expectedRow = `| ${courseModule.order} | ${courseModule.slug} | ${courseModule.phaseId} | ${courseModule.minutes} | ${courseModule.labId} | ${courseModule.sourceIds.join(", ")} |`;
    if (!provenanceModuleRows.has(expectedRow)) {
      fail(`${provenancePath}: Module ${courseModule.order} exact manifest snapshot row drifted`);
    }
  }
  const reviewerAcceptancePending = /^- \[ \] Final reviewer acceptance remains pending\b/m.test(provenance);
  const reviewerAcceptanceComplete = provenance.includes(FINAL_REVIEW_ACCEPTANCE_LINE);
  if (reviewerAcceptancePending && reviewerAcceptanceComplete) {
    fail(`${provenancePath}: final reviewer acceptance cannot be both pending and complete`);
  }
  if (RELEASE) {
    if (reviewerAcceptancePending || /reviewer acceptance[^\n]*(?:pending|仍待|待独立)/iu.test(provenance)) {
      fail(`${provenancePath}: release mode rejects pending final reviewer acceptance`);
    }
    if (!reviewerAcceptanceComplete || !provenance.includes("独立 reviewer acceptance 已完成")) {
      fail(`${provenancePath}: release mode requires ${JSON.stringify(FINAL_REVIEW_ACCEPTANCE_LINE)} and a completed status header`);
    }
  } else if (!reviewerAcceptancePending && !reviewerAcceptanceComplete) {
    fail(`${provenancePath}: development mode requires an explicit pending or completed final-review status`);
  }
  if (/\b(?:OAI|ANT|CLA|MCP|REL|OBS|OPS|GIT|RIGHTS)-\d{2}\b/.test(provenance)) {
    fail(`${provenancePath}: legacy research IDs must not remain in the canonical release snapshot`);
  }
  const transformationProfiles = new Map(
    Array.from(
      provenance.matchAll(/^\| (T\d+) \| (.+) \|$/gm),
      (match) => [match[1], match[2]],
    ),
  );
  for (const source of AGENT_ORCHESTRATION_SOURCES) {
    const marker = `- id=${source.id};`;
    const start = provenance.indexOf(marker);
    if (start < 0) {
      fail(`${provenancePath}: missing canonical source block ${source.id}`);
      continue;
    }
    if (provenance.split(marker).length !== 2) {
      fail(`${provenancePath}: canonical source block ${source.id} must appear exactly once`);
    }
    const next = provenance.indexOf("\n### 6.", start + marker.length);
    const block = provenance.slice(start, next < 0 ? provenance.length : next);
    const moduleRefs = AGENT_ORCHESTRATION_COURSE_MANIFEST.modules
      .filter((module) => module.sourceIds.includes(source.id))
      .map((module) => `${module.order}:${module.slug}`)
      .join(", ");
    const requiredSourceTokens = [
      source.title,
      source.publisher,
      source.url,
      `modules=${moduleRefs}`,
      `layer=${source.layer}`,
      `stability=${source.stability}`,
      `reuseStatus=${source.reuseStatus}`,
      "transformation=T",
      source.accessedOn,
      source.supports,
      source.boundary,
      source.supportsZhHans,
      source.boundaryZhHans,
    ];
    if (source.revision) requiredSourceTokens.push(source.revision);
    if (source.publishedOn) requiredSourceTokens.push(source.publishedOn);
    if (source.license) requiredSourceTokens.push(source.license);
    if (source.versionAnchorUrl) {
      requiredSourceTokens.push(`versionAnchorUrl=${source.versionAnchorUrl}`);
      requiredSourceTokens.push(`claimEvidenceUrls=${source.claimEvidenceUrls.join(" | ")}`);
    }
    for (const token of requiredSourceTokens) {
      if (!block.includes(token)) {
        fail(`${provenancePath}/${source.id}: missing ${JSON.stringify(token)}`);
      }
    }
    const transformationCode = block.match(/\btransformation=(T\d+)\b/)?.[1];
    if (!transformationCode || transformationProfiles.get(transformationCode) !== source.transformation) {
      fail(`${provenancePath}/${source.id}: transformation profile does not match the final source record`);
    }
  }
  for (const transformation of new Set(AGENT_ORCHESTRATION_SOURCES.map((source) => source.transformation))) {
    if (!provenance.includes(transformation)) {
      fail(`${provenancePath}: missing exact transformation profile ${JSON.stringify(transformation)}`);
    }
  }
}

function checkIntegration() {
  requireTokens("lib/seo.ts", [
    'AGENT_ORCHESTRATION_MODULE_PAGES = childPagesFor("agent-orchestration")',
    "function agentOrchestrationModulePage",
    "export const PAGES = PUBLISHED_LOCALIZED_PAGES",
  ]);
  requireTokens("app/sitemap.ts", [
    "AGENT_ORCHESTRATION_TRANSLATED_LOCALES",
    'page === "agent-orchestration/"',
    'page.startsWith("agent-orchestration/")',
  ]);
  requireTokens("lib/courses.ts", [
    'id: "agent-orchestration"',
    "displayNumber: 15",
    'href: "/agent-orchestration/"',
    "AGENT_ORCHESTRATION_COURSE_MANIFEST.modules",
    "agentOrchestrationProgressPercent",
    '"c.agent-orchestration.title"',
  ]);
  requireTokens("app/[locale]/courses/page.tsx", [
    "courseFifteenParts",
    '"agent-orchestration": courseFifteenParts',
    "agentOrchestrationCourse.contentLocale",
  ]);
  requireTokens("components/courses/Catalog.tsx", [
    'course.id === "agent-orchestration"',
    '"agent-orchestration"',
  ]);
  requireTokens("components/courses/Cover.tsx", [
    '"agent-orchestration": (',
    '"agent-orchestration": styles.engineering',
  ]);
  requireTokens("README.md", [
    "Course: Agent Orchestration",
    "agent-orchestration:check",
    "agent-orchestration-course-research-brief.md",
  ]);

  for (const locale of ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"]) {
    const messages = readJson(`messages/${locale}.json`);
    if (!messages) continue;
    for (const key of [
      "cat.course15",
      "c.agent-orchestration.title",
      "c.agent-orchestration.blurb",
      "c.agent-orchestration.level",
      "c.agent-orchestration.meta",
    ]) {
      if (typeof messages[key] !== "string" || !messages[key].trim()) {
        fail(`messages/${locale}.json: missing non-empty ${key}`);
      }
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson) {
    const scripts = packageJson.scripts ?? {};
    if (!String(scripts["agent-orchestration:check"] ?? "").includes("check-agent-orchestration-course.mjs")) {
      fail("package.json: agent-orchestration:check is missing");
    }
    if (!String(scripts["agent-orchestration:check:release"] ?? "").includes("--release")) {
      fail("package.json: Course 15 release checker must use --release");
    }
    if (!String(scripts["agent-orchestration:static-check"] ?? "").includes("check-agent-orchestration-static.mjs")) {
      fail("package.json: agent-orchestration:static-check is missing");
    }
    const releaseBuild = String(scripts["build:release"] ?? "");
    const nextBuildIndex = releaseBuild.indexOf("next build");
    const staticGateIndex = releaseBuild.indexOf("npm run agent-orchestration:static-check");
    if (nextBuildIndex < 0 || staticGateIndex < nextBuildIndex) {
      fail("package.json: build:release must run the Course 15 static-output gate after next build");
    }
  }
  for (const error of publishedReleaseIntegrationErrors(
    ROOT,
    "agent-orchestration",
    "npm run agent-orchestration:check:release",
    ["agent-orchestration/", ...EXPECTED_SLUGS.map((slug) => `agent-orchestration/${slug}/`)],
  )) fail(error);
}

function main() {
  checkCourseContract();
  checkFilesAndRoutes();
  checkIntegration();
  checkPrivateDevelopmentInputBoundary();
  const ok = errors.length === 0 && (!RELEASE || warnings.length === 0);
  const result = {
    ok,
    course: "agent-orchestration",
    displayNumber: 15,
    mode: RELEASE ? "release" : "development",
    modules: AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.length,
    minutes: AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.reduce((sum, module) => sum + module.minutes, 0),
    phases: AGENT_ORCHESTRATION_COURSE_MANIFEST.phases.length,
    sources: AGENT_ORCHESTRATION_SOURCES.length,
    progressMilestones: AGENT_ORCHESTRATION_PROGRESS_MILESTONES,
    errors,
    warnings,
    notes,
  };
  if (JSON_OUTPUT) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else if (ok) {
    console.log(`Course 15 Agent Orchestration check: PASS (${result.mode})`);
    notes.forEach((message) => console.log(`NOTE: ${message}`));
  } else {
    console.error(`Course 15 Agent Orchestration check: FAIL (${result.mode})`);
    notes.forEach((message) => console.error(`NOTE: ${message}`));
    errors.forEach((message) => console.error(`ERROR: ${message}`));
    warnings.forEach((message) => console.error(`WARN: ${message}`));
  }
  if (!ok) process.exitCode = 1;
}

main();
