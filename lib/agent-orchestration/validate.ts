import { AGENT_ORCHESTRATION_EN_COPY } from "./copy/en";
import { AGENT_ORCHESTRATION_ZH_HANS_COPY } from "./copy/zh-Hans";
import { AGENT_ORCHESTRATION_COURSE_MANIFEST } from "./manifest";
import { AGENT_ORCHESTRATION_SOURCES } from "./sources";
import {
  AGENT_ORCHESTRATION_CONCEPT_DOMAIN_IDS,
  AGENT_ORCHESTRATION_MODULE_SLUGS,
  AGENT_ORCHESTRATION_PATTERN_IDS,
  AGENT_ORCHESTRATION_PHASE_IDS,
  type AgentOrchestrationCourseCopy,
  type AgentOrchestrationSourceRecord,
} from "./types";

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(stringsIn);
  }
  return [];
}

function duplicateValues(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function validateCopy(
  label: string,
  copy: AgentOrchestrationCourseCopy,
  sourceSet: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  const copySlugs = Object.keys(copy.modules);
  if (
    copySlugs.length !== AGENT_ORCHESTRATION_MODULE_SLUGS.length
    || AGENT_ORCHESTRATION_MODULE_SLUGS.some((slug) => !copySlugs.includes(slug))
  ) {
    errors.push(`${label}: copy must have exact module parity with the manifest.`);
  }
  if (copy.principles.length !== 5) errors.push(`${label}: five operating principles are required.`);
  if (copy.outcomes.length !== 10) errors.push(`${label}: ten observable outcomes are required.`);
  if (copy.distinctions.length !== 6) errors.push(`${label}: six boundary distinctions are required.`);
  if (copy.finalAssessment.passPercent !== 80) errors.push(`${label}: pass mark must be 80 percent.`);
  if (copy.capstone.artifacts.length !== 15) errors.push(`${label}: capstone requires exactly 15 auditable artifacts.`);

  for (const phaseId of AGENT_ORCHESTRATION_PHASE_IDS) {
    if (!copy.phases[phaseId]) errors.push(`${label}: missing phase copy ${phaseId}.`);
  }
  for (const domainId of AGENT_ORCHESTRATION_CONCEPT_DOMAIN_IDS) {
    if (!copy.conceptDomains[domainId]) errors.push(`${label}: missing concept domain ${domainId}.`);
  }
  for (const patternId of AGENT_ORCHESTRATION_PATTERN_IDS) {
    if (!copy.patterns[patternId]) errors.push(`${label}: missing pattern ${patternId}.`);
  }

  for (const moduleManifest of AGENT_ORCHESTRATION_COURSE_MANIFEST.modules) {
    const moduleCopy = copy.modules[moduleManifest.slug];
    if (!moduleCopy) continue;
    if (moduleCopy.sections.length !== 3) {
      errors.push(`${label}/${moduleManifest.slug}: exactly three teaching sections are required.`);
    }
    const evidenceModes = new Set(moduleCopy.sections.map((section) => section.evidenceMode));
    for (const requiredMode of ["source-grounded", "engineering-synthesis", "version-watch"] as const) {
      if (!evidenceModes.has(requiredMode)) {
        errors.push(`${label}/${moduleManifest.slug}: missing ${requiredMode} section.`);
      }
    }
    if (moduleCopy.practice.steps.length < 4) {
      errors.push(`${label}/${moduleManifest.slug}: practice requires at least four steps.`);
    }
    if (moduleCopy.practice.template.trim().length < 260) {
      errors.push(`${label}/${moduleManifest.slug}: artifact template is too thin.`);
    }
    if (moduleCopy.checkpoint.options.length !== 4) {
      errors.push(`${label}/${moduleManifest.slug}: checkpoint requires four options.`);
    }
    const declared = new Set<string>(moduleManifest.sourceIds);
    const cited = new Set<string>(moduleCopy.sections.flatMap((section) => section.sourceIds));
    for (const sourceId of moduleManifest.sourceIds) {
      if (!sourceSet.has(sourceId)) errors.push(`${label}/${moduleManifest.slug}: unknown source ${sourceId}.`);
      if (!cited.has(sourceId)) errors.push(`${label}/${moduleManifest.slug}: declared source ${sourceId} is never cited.`);
    }
    for (const section of moduleCopy.sections) {
      if (!section.heading.trim()) errors.push(`${label}/${moduleManifest.slug}: empty section heading.`);
      if (section.paragraphs.some((paragraph) => paragraph.trim().length < 70)) {
        errors.push(`${label}/${moduleManifest.slug}: every teaching paragraph must be substantive.`);
      }
      for (const sourceId of section.sourceIds) {
        if (!declared.has(sourceId)) {
          errors.push(`${label}/${moduleManifest.slug}: section cites undeclared source ${sourceId}.`);
        }
      }
    }
    const contractValues = Object.values(moduleCopy.contract);
    if (contractValues.length !== 12 || contractValues.some((value) => value.trim().length < 20)) {
      errors.push(`${label}/${moduleManifest.slug}: all twelve contract fields must be substantive.`);
    }
  }

  const visibleText = stringsIn(copy).join("\n");
  if (/\b(?:todo|tbd|lorem ipsum|placeholder)\b/i.test(visibleText)) {
    errors.push(`${label}: visible copy contains a placeholder token.`);
  }
  return errors;
}

export function validateAgentOrchestrationCourse(): string[] {
  const errors: string[] = [];
  const manifest = AGENT_ORCHESTRATION_COURSE_MANIFEST;
  const sourceIds = AGENT_ORCHESTRATION_SOURCES.map((source) => source.id);
  const sourceSet = new Set<string>(sourceIds);
  const slugs = manifest.modules.map((module) => module.slug);
  const phaseIds = manifest.phases.map((phase) => phase.id);

  if (manifest.id !== "agent-orchestration") errors.push("Course ID must be agent-orchestration.");
  if (manifest.displayNumber !== 15) errors.push("Course display number must be 15.");
  if (manifest.defaultContentLocale !== "en") errors.push("Default content locale must be en.");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push("Course version must be semantic.");
  if (manifest.modules.length !== 15) errors.push(`Course 15 requires 15 modules, found ${manifest.modules.length}.`);
  if (manifest.phases.length !== 4) errors.push("Course 15 requires four phases.");
  if (manifest.modules.reduce((sum, module) => sum + module.minutes, 0) !== 1060) {
    errors.push("Course 15 must total 1060 minutes.");
  }
  if (duplicateValues(slugs).length) errors.push("Module slugs must be unique.");
  if (duplicateValues(phaseIds).length) errors.push("Phase IDs must be unique.");
  if (duplicateValues(sourceIds).length) errors.push("Source IDs must be unique.");
  if (JSON.stringify(slugs) !== JSON.stringify([...AGENT_ORCHESTRATION_MODULE_SLUGS])) {
    errors.push("Module order must match the canonical Course 15 slug order.");
  }
  if (JSON.stringify(phaseIds) !== JSON.stringify([...AGENT_ORCHESTRATION_PHASE_IDS])) {
    errors.push("Phase order must match the canonical Course 15 phase order.");
  }

  const phaseCoverage = manifest.phases.flatMap((phase) => phase.moduleSlugs);
  if (
    phaseCoverage.length !== manifest.modules.length
    || new Set(phaseCoverage).size !== manifest.modules.length
  ) {
    errors.push("Each module must appear exactly once across the four phases.");
  }
  for (const [index, phase] of manifest.phases.entries()) {
    if (phase.order !== index + 1) errors.push(`${phase.id}: phase order is invalid.`);
    for (const slug of phase.moduleSlugs) {
      const moduleManifest = manifest.modules.find((candidate) => candidate.slug === slug);
      if (!moduleManifest) errors.push(`${phase.id}: unknown module ${slug}.`);
      else if (moduleManifest.phaseId !== phase.id) errors.push(`${slug}: phase reference is inconsistent.`);
    }
  }

  const domainCoverage = new Map(
    AGENT_ORCHESTRATION_CONCEPT_DOMAIN_IDS.map((domain) => [domain, 0]),
  );
  for (const [index, module] of manifest.modules.entries()) {
    if (module.order !== index + 1) errors.push(`${module.slug}: module order is invalid.`);
    if (module.minutes < 50) errors.push(`${module.slug}: study time is implausibly short.`);
    for (const sourceId of module.sourceIds) {
      if (!sourceSet.has(sourceId)) errors.push(`${module.slug}: manifest references missing source ${sourceId}.`);
    }
    for (const domain of module.conceptDomainIds) {
      domainCoverage.set(domain, (domainCoverage.get(domain) ?? 0) + 1);
    }
  }
  for (const [domain, count] of domainCoverage) {
    if (!count) errors.push(`${domain}: concept domain has no module coverage.`);
  }

  const requiredModuleSources: Readonly<
    Partial<Record<(typeof manifest.modules)[number]["slug"], readonly string[]>>
  > = {
    "parallel-fanout-fanin": [
      "openai-responses-multi-agent",
      "openai-codex-subagents",
      "openai-codex-sandbox-security",
    ],
    "tools-aci-mcp": [
      "anthropic-effective-agents",
      "mcp-spec-2026",
      "mcp-changelog-2026",
      "mcp-versioning-2026",
      "claude-academy-mcp-legacy",
    ],
    "budgets-concurrency-stopping": [
      "openai-responses-multi-agent",
      "openai-codex-subagents",
      "openai-codex-sandbox-security",
    ],
    "reliability-recovery": [
      "azure-retry-storm",
      "aws-idempotent-apis",
      "azure-compensating-transactions",
    ],
    "tracing-observability-economics": ["google-sre-error-budget"],
    "evaluation-regression-evolution": ["openai-swarm-lifecycle"],
  };
  for (const [slug, requiredSourceIds] of Object.entries(requiredModuleSources)) {
    const moduleManifest = manifest.modules.find((module) => module.slug === slug);
    if (!moduleManifest) continue;
    const declaredSourceIds = new Set<string>(moduleManifest.sourceIds);
    for (const sourceId of requiredSourceIds ?? []) {
      if (!declaredSourceIds.has(sourceId)) {
        errors.push(`${slug}: missing required release source ${sourceId}.`);
      }
    }
  }

  for (const source of AGENT_ORCHESTRATION_SOURCES as readonly AgentOrchestrationSourceRecord[]) {
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: source URL must use HTTPS.`);
    if (/\/releases\/tag\//.test(source.url)) {
      errors.push(`${source.id}: a release/tag locator must use versionAnchorUrl, not the primary claim-evidence URL.`);
    }
    if (!source.claimEvidenceUrls.length || !source.claimEvidenceUrls.includes(source.url)) {
      errors.push(`${source.id}: claimEvidenceUrls must be non-empty and include the primary source URL.`);
    }
    if (new Set(source.claimEvidenceUrls).size !== source.claimEvidenceUrls.length) {
      errors.push(`${source.id}: claimEvidenceUrls must not contain duplicates.`);
    }
    for (const evidenceUrl of source.claimEvidenceUrls) {
      if (!evidenceUrl.startsWith("https://")) {
        errors.push(`${source.id}: every claim-evidence URL must use HTTPS.`);
      }
    }
    if (source.versionAnchorUrl) {
      if (!source.versionAnchorUrl.startsWith("https://") || source.versionAnchorUrl === source.url) {
        errors.push(`${source.id}: versionAnchorUrl must be a distinct HTTPS locator.`);
      }
      if (!source.revision) {
        errors.push(`${source.id}: a version anchor requires an explicit revision.`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) errors.push(`${source.id}: accessed date is invalid.`);
    if (!source.supports.trim() || !source.boundary.trim()) {
      errors.push(`${source.id}: support and boundary are required.`);
    }
    if (!source.supportsZhHans.trim() || !source.boundaryZhHans.trim()) {
      errors.push(`${source.id}: Simplified-Chinese support and boundary are required.`);
    }
    if (!source.layer.trim() || !source.reuseStatus.trim() || source.transformation.trim().length < 80) {
      errors.push(`${source.id}: layer, reuse status, and substantive transformation are required.`);
    }
    if (source.reuseStatus === "license-noted-no-copy" && !source.license) {
      errors.push(`${source.id}: license-noted reuse status requires an explicit source license note.`);
    }
    if (source.stability === "version-pinned" && !source.revision) {
      errors.push(`${source.id}: a version-pinned source requires a revision.`);
    }
  }

  errors.push(...validateCopy("en", AGENT_ORCHESTRATION_EN_COPY, sourceSet));
  errors.push(...validateCopy("zh-Hans", AGENT_ORCHESTRATION_ZH_HANS_COPY, sourceSet));

  const english = stringsIn(AGENT_ORCHESTRATION_EN_COPY).join("\n").toLocaleLowerCase("en");
  const chinese = stringsIn(AGENT_ORCHESTRATION_ZH_HANS_COPY).join("\n").toLocaleLowerCase("zh-Hans");
  const requiredCoverage: Readonly<Record<string, readonly string[]>> = {
    "runtime layers": ["protocol", "provider api", "sdk", "application", "runtime", "model"],
    "control patterns": ["prompt chain", "router", "fan-out", "fan-in", "agents-as-tools", "handoff", "orchestrator", "evaluator"],
    "state boundaries": ["context", "session", "event log", "checkpoint", "memory", "compaction"],
    "resource control": ["backpressure", "admission control", "deadline", "cancellation", "load shedding", "retry budget"],
    "effect reliability": ["ambiguous outcome", "idempotency", "effect ledger", "compensation", "manual reconciliation"],
    "authority security": ["prompt injection", "least privilege", "sandbox", "approval", "confused deputy", "tenant"],
    "operations and evaluation": ["trace", "monitoring", "audit log", "eval", "p95", "cost per successful task", "canary", "kill switch"],
  };
  for (const [group, terms] of Object.entries(requiredCoverage)) {
    for (const term of terms) {
      if (!english.includes(term)) errors.push(`English copy does not visibly cover ${group}: ${term}.`);
    }
  }

  const bilingualReleaseTerms: Readonly<
    Record<string, { readonly en: readonly string[]; readonly zhHans: readonly string[] }>
  > = {
    "Responses versus Codex runtime semantics": {
      en: [
        "2026-08-23",
        "multi_agent.max_concurrent_subagents",
        "agents.max_concurrent_threads_per_session",
        "excludes `/root`",
        "excluding the primary",
        "default and recommendation are `3`",
        "no fixed limit on tree depth",
        "do not state the responses no-fixed-depth",
        "`/responses/compact`",
        "`reasoning.summary`",
        "`max_tool_calls`",
        "all gpt-5.6 models",
        "sandbox and permission",
      ],
      zhHans: [
        "2026-08-23",
        "multi_agent.max_concurrent_subagents",
        "agents.max_concurrent_threads_per_session",
        "排除 `/root`",
        "排除 primary",
        "默认值与推荐值均为 `3`",
        "没有固定树深",
        "codex 文档也没有声明 responses",
        "`/responses/compact`",
        "`reasoning.summary`",
        "`max_tool_calls`",
        "全部 gpt-5.6 模型",
        "沙箱、权限模式",
      ],
    },
    "MCP 2026-07-28 migration semantics": {
      en: [
        "`mcp-session-id`",
        "`initialize` / `notifications/initialized`",
        "`server/discover`",
        "subscriptions/listen",
        "mrtr",
        "`resulttype`",
        "roots, sampling, logging, http+sse",
        "unsupportedprotocolversionerror",
        "older result lacking `resulttype`",
        "transport recovery—not business idempotency",
      ],
      zhHans: [
        "`mcp-session-id`",
        "`initialize` / `notifications/initialized`",
        "`server/discover`",
        "subscriptions/listen",
        "mrtr",
        "`resulttype",
        "roots、sampling、logging、http+sse",
        "unsupportedprotocolversionerror",
        "旧服务若缺少 `resulttype`",
        "传输恢复，不是业务幂等",
      ],
    },
    "production must-cover concepts": {
      en: [
        "critical path",
        "retry-after",
        "circuit breaker",
        "partial failure",
        "confused deputy",
        "p99",
        "error budget",
        "fail-open",
        "fail-closed",
        "swarm",
        "replaced by the production-ready agents sdk",
      ],
      zhHans: [
        "关键路径（critical path）",
        "retry-after",
        "circuit breaker（断路器）",
        "partial failure（部分失败）",
        "confused deputy（混淆代理人）",
        "p99 尾延迟",
        "错误预算（error budget）",
        "fail-open",
        "fail-closed",
        "swarm",
        "production-ready agents sdk 取代",
      ],
    },
  };
  for (const [group, terms] of Object.entries(bilingualReleaseTerms)) {
    for (const term of terms.en) {
      if (!english.includes(term)) errors.push(`English copy does not preserve ${group}: ${term}.`);
    }
    for (const term of terms.zhHans) {
      if (!chinese.includes(term)) errors.push(`Simplified-Chinese copy does not preserve ${group}: ${term}.`);
    }
  }

  const requiredModuleReleaseTerms = [
    {
      slug: "parallel-fanout-fanin",
      en: [
        "critical path",
        "beta for all gpt-5.6 models",
        "multi_agent.max_concurrent_subagents",
        "excludes `/root`",
        "default and recommendation are `3`",
        "no api-fixed upper bound",
        "no fixed limit on tree depth or total subagents created",
        "agents.max_concurrent_threads_per_session",
        "excluding the primary",
        "does not promise a numeric value",
        "do not state the responses no-fixed-depth",
        "`/responses/compact`",
        "`reasoning.summary`",
        "`max_tool_calls`",
        "sandbox and permission mode",
      ],
      zhHans: [
        "关键路径（critical path）",
        "全部 gpt-5.6 模型的 beta",
        "multi_agent.max_concurrent_subagents",
        "排除 `/root`",
        "默认值与推荐值均为 `3`",
        "api 固定上界",
        "固定树深",
        "累计创建子智能体总数限制",
        "agents.max_concurrent_threads_per_session",
        "排除 primary",
        "没有承诺具体数字",
        "codex 文档也没有声明 responses",
        "`/responses/compact`",
        "`reasoning.summary`",
        "`max_tool_calls`",
        "沙箱、权限模式",
      ],
    },
    {
      slug: "tools-aci-mcp",
      en: [
        "2026-07-28 changelog removes",
        "`mcp-session-id`",
        "`initialize` / `notifications/initialized`",
        "`server/discover`",
        "subscriptions/listen",
        "mrtr",
        "`resulttype`",
        "deprecates—but has not yet removed",
        "unsupportedprotocolversionerror",
        "older result lacking `resulttype`",
        "transport recovery—not business idempotency",
      ],
      zhHans: [
        "2026-07-28 changelog 删除",
        "`mcp-session-id`",
        "`initialize` / `notifications/initialized`",
        "`server/discover`",
        "subscriptions/listen",
        "mrtr",
        "`resulttype",
        "标为 deprecated，而不是已经 removed",
        "unsupportedprotocolversionerror",
        "旧服务若缺少 `resulttype`",
        "传输恢复，不是业务幂等",
      ],
    },
    {
      slug: "budgets-concurrency-stopping",
      en: [
        "critical path",
        "beta for all gpt-5.6 models",
        "multi_agent.max_concurrent_subagents",
        "excludes `/root`",
        "default and recommendation are `3`",
        "no fixed api upper bound",
        "total-created-subagent limit",
        "tree-depth limit",
        "agents.max_concurrent_threads_per_session",
        "excludes the primary",
        "no numeric promise",
        "does not state responses' no-fixed-depth rule",
        "`/responses/compact`",
        "`reasoning.summary`",
        "`max_tool_calls`",
        "sandbox and permission policy",
      ],
      zhHans: [
        "关键路径（critical path）",
        "全部 gpt-5.6 模型的 beta",
        "multi_agent.max_concurrent_subagents",
        "排除 `/root`",
        "默认值与推荐值为 `3`",
        "固定 api 上界",
        "累计创建子智能体总数",
        "树深",
        "agents.max_concurrent_threads_per_session",
        "排除 primary",
        "没有给出固定数字",
        "codex 文档没有声明 responses",
        "`/responses/compact`",
        "`reasoning.summary`",
        "`max_tool_calls`",
        "沙箱、权限模式",
      ],
    },
    {
      slug: "reliability-recovery",
      en: ["partial failure", "retry-after", "circuit breaker", "fail-open", "fail-closed"],
      zhHans: ["部分失败（partial failure）", "retry-after", "circuit breaker（断路器）", "fail-open", "fail-closed"],
    },
    {
      slug: "security-authority-human-control",
      en: ["confused deputy"],
      zhHans: ["confused deputy（混淆代理人）"],
    },
    {
      slug: "tracing-observability-economics",
      en: ["p99 tail latency", "error budget"],
      zhHans: ["p99 尾延迟", "错误预算（error budget）"],
    },
    {
      slug: "evaluation-regression-evolution",
      en: ["replaced by the production-ready agents sdk"],
      zhHans: ["production-ready agents sdk 取代"],
    },
  ] as const;
  for (const requirement of requiredModuleReleaseTerms) {
    const englishModule = stringsIn(AGENT_ORCHESTRATION_EN_COPY.modules[requirement.slug])
      .join("\n")
      .toLocaleLowerCase("en");
    const chineseModule = stringsIn(AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[requirement.slug])
      .join("\n")
      .toLocaleLowerCase("zh-Hans");
    for (const term of requirement.en) {
      if (!englishModule.includes(term)) {
        errors.push(`English/${requirement.slug}: missing release term ${term}.`);
      }
    }
    for (const term of requirement.zhHans) {
      if (!chineseModule.includes(term)) {
        errors.push(`Simplified-Chinese/${requirement.slug}: missing release term ${term}.`);
      }
    }
  }
  return errors;
}

export function assertValidAgentOrchestrationCourse(): void {
  const errors = validateAgentOrchestrationCourse();
  if (errors.length) {
    throw new Error(`Invalid Agent Orchestration course:\n${errors.join("\n")}`);
  }
}
