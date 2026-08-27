/**
 * The canonical domain, the page list, and the per-page alternates.
 *
 * Every page used to inherit its `alternates` from app/[locale]/layout.tsx,
 * which names the locale root. So /en/lab/ shipped
 * `<link rel="canonical" href="https://aicourse.top/en/">` — telling a crawler
 * "this page is a duplicate of the home page, index that one instead" — and
 * its hreflang set listed the nine locale ROOTS rather than the nine
 * translations of the lab. Thirty-six of the forty-five pages did this. The
 * sitemap had it right from the start, so the two contradicted each other,
 * and the per-locale URLs the whole migration was for were pointing at
 * themselves as duplicates.
 *
 * One helper, used by the layout and by every page, so the two cannot drift
 * apart again. `SITE` lives here alone: it used to be copied into four files.
 */
import type { Metadata } from "next";
import { LOCALE_CODES, DEFAULT_LOCALE } from "@/lib/i18n";

export const SITE = "https://aicourse.top";

/** Every route under a locale, as a path relative to the locale root. */
export const CODEX_LESSON_PAGES = [
  "codex/meet-codex/",
  "codex/task-contracts/",
  "codex/environments-permissions/",
  "codex/ground-plan/",
  "codex/implement-steer/",
  "codex/debug-test/",
  "codex/review-diff/",
  "codex/agents-skills/",
  "codex/cli/",
  "codex/ide/",
  "codex/cloud-parallel/",
  "codex/automation-capstone/",
] as const;

export const CLAUDE_LESSON_PAGES = [
  "claude/choose-your-surface/",
  "claude/describe-the-outcome/",
  "claude/iterate-with-examples/",
  "claude/discern-verify-protect/",
  "claude/work-with-files/",
  "claude/build-projects/",
  "claude/create-artifacts/",
  "claude/research-with-citations/",
  "claude/extend-with-tools/",
  "claude/delegate-with-cowork/",
  "claude/software-engineering/",
  "claude/research-and-data/",
  "claude/writing-and-office/",
  "claude/teaching-and-learning/",
  "claude/portfolio-capstone/",
] as const;

export const CURSOR_LESSON_PAGES = [
  "cursor/orient-privacy/",
  "cursor/tab-inline-edit/",
  "cursor/agent-interface/",
  "cursor/task-contracts/",
  "cursor/plan-execute-steer/",
  "cursor/test-review-recover/",
  "cursor/rules-skills-mcp/",
  "cursor/cloud-parallel/",
  "cursor/software-studio/",
  "cursor/research-studio/",
  "cursor/writing-studio/",
  "cursor/office-studio/",
  "cursor/teaching-studio/",
  "cursor/workflow-capstone/",
] as const;

export const GROK_LESSON_PAGES = [
  "grok/map-grok/",
  "grok/read-interface/",
  "grok/privacy-boundaries/",
  "grok/task-contracts/",
  "grok/search-verify/",
  "grok/files-data/",
  "grok/software-engineering/",
  "grok/research-workflow/",
  "grok/writing-workflow/",
  "grok/office-workflow/",
  "grok/teaching-workflow/",
  "grok/imagine-multimodal/",
  "grok/connect-automate/",
  "grok/capstone/",
] as const;

export const PROMPT_LESSON_PAGES = [
  "prompts/prompts-are-specifications/",
  "prompts/six-part-prompt/",
  "prompts/instructions-and-data/",
  "prompts/examples-and-contracts/",
  "prompts/four-prompt-jobs/",
  "prompts/evaluation-flywheel/",
  "prompts/decompose-and-chain/",
  "prompts/grounding-and-safety/",
  "prompts/capstone-prompt-packet/",
] as const;

export const GITHUB_LESSON_PAGES = [
  "github/start-secure/",
  "github/repository-readme/",
  "github/branches-commits/",
  "github/pull-requests-reviews/",
  "github/issues-discussions/",
  "github/projects-office-work/",
  "github/forks-conflicts/",
  "github/notifications-governance/",
  "github/software-automation/",
  "github/research-reproducibility/",
  "github/writing-publishing/",
  "github/teaching-capstone/",
] as const;

export const RAG_LESSON_PAGES = [
  "rag/choose-rag/",
  "rag/trace-the-pipeline/",
  "rag/corpus-contract/",
  "rag/parse-and-chunk/",
  "rag/embeddings-and-indexes/",
  "rag/retrieval-engineering/",
  "rag/rerank-and-assemble/",
  "rag/ground-and-cite/",
  "rag/advanced-patterns/",
  "rag/evaluate-rag/",
  "rag/secure-and-refresh/",
  "rag/production-capstone/",
] as const;

export const SOFTWARE_ENGINEERING_LESSON_PAGES = [
  "software-engineering/agentic-engineering-system/",
  "software-engineering/requirements-task-contracts/",
  "software-engineering/architecture-tradeoffs/",
  "software-engineering/planning-estimation-risk/",
  "software-engineering/repository-context/",
  "software-engineering/git-environments-worktrees/",
  "software-engineering/construction-quality/",
  "software-engineering/testing-strategy/",
  "software-engineering/debugging-root-cause/",
  "software-engineering/review-refactoring-debt/",
  "software-engineering/documentation-knowledge/",
  "software-engineering/cicd-release/",
  "software-engineering/reliability-observability/",
  "software-engineering/performance-economics/",
  "software-engineering/security-privacy-supply-chain/",
  "software-engineering/teams-governance/",
  "software-engineering/agent-evaluation/",
  "software-engineering/capstone-safe-change/",
] as const;

export const MAKE_MONEY_WITH_CODEX_LESSON_PAGES = [
  "make-money-with-codex/money-not-magic/",
  "make-money-with-codex/choose-market-wedge/",
  "make-money-with-codex/validate-before-building/",
  "make-money-with-codex/write-commercial-spec/",
  "make-money-with-codex/protect-client-work/",
  "make-money-with-codex/build-verified-pilot/",
  "make-money-with-codex/price-for-margin/",
  "make-money-with-codex/sell-with-proof/",
  "make-money-with-codex/deliver-with-control/",
  "make-money-with-codex/productize-reuse/",
  "make-money-with-codex/retain-and-automate/",
  "make-money-with-codex/launch-capstone/",
] as const;

export const CLAUDE_INCOME_LESSON_PAGES = [
  "claude-income/choose-a-money-path/",
  "claude-income/validate-paid-demand/",
  "claude-income/scope-and-price-the-offer/",
  "claude-income/write-a-delivery-spec/",
  "claude-income/run-client-projects/",
  "claude-income/sell-citation-grade-research/",
  "claude-income/deliver-files-that-survive-review/",
  "claude-income/standardize-with-skills-and-connectors/",
  "claude-income/prototype-with-artifacts/",
  "claude-income/build-software-with-claude/",
  "claude-income/earn-trust-and-retainers/",
  "claude-income/capstone-seven-day-demand-test/",
] as const;

export const MCP_LESSON_PAGES = [
  "mcp/why-mcp/",
  "mcp/architecture-trust/",
  "mcp/discovery-versioning/",
  "mcp/inspect-the-wire/",
  "mcp/tools/",
  "mcp/resources/",
  "mcp/prompts-completion/",
  "mcp/elicitation-mrtr/",
  "mcp/transports-json-rpc/",
  "mcp/flow-control/",
  "mcp/authorization/",
  "mcp/security/",
  "mcp/build-server/",
  "mcp/build-client/",
  "mcp/host-integrations/",
  "mcp/practitioner-patterns/",
  "mcp/production-registry/",
  "mcp/apps-tasks-capstone/",
] as const;

export const AI_TUTOR_MODULE_PAGES = [
  "ai-tutor/objectives-concept-map/",
  "ai-tutor/diagnostic-engine/",
  "ai-tutor/adaptive-scaffolding/",
  "ai-tutor/formative-assessment-loop/",
  "ai-tutor/item-validation/",
  "ai-tutor/learner-modeling/",
  "ai-tutor/learning-impact-experiment/",
  "ai-tutor/safety-teacher-oversight/",
] as const;

export const PRODUCT_MANAGEMENT_MODULE_PAGES = [
  "product-management/product-judgment-operating-model/",
  "product-management/vision-strategy-business-model/",
  "product-management/customer-market-discovery/",
  "product-management/synthesis-opportunity-definition/",
  "product-management/outcomes-metrics-analytics/",
  "product-management/prioritization-roadmaps-portfolio/",
  "product-management/solution-discovery-experiments/",
  "product-management/product-design-experience-systems/",
  "product-management/requirements-prd-decisions/",
  "product-management/ai-capability-architecture/",
  "product-management/delivery-engineering-ai-agents/",
  "product-management/quality-safety-governance/",
  "product-management/launch-go-to-market-growth/",
  "product-management/experimentation-operations-leadership/",
] as const;

export const AGENT_ORCHESTRATION_MODULE_PAGES = [
  "agent-orchestration/workflow-agent-boundary/",
  "agent-orchestration/task-graphs-contracts/",
  "agent-orchestration/chaining-routing/",
  "agent-orchestration/parallel-fanout-fanin/",
  "agent-orchestration/manager-roles-ownership/",
  "agent-orchestration/delegation-handoffs/",
  "agent-orchestration/orchestrator-workers-verification/",
  "agent-orchestration/tools-aci-mcp/",
  "agent-orchestration/context-state-memory/",
  "agent-orchestration/budgets-concurrency-stopping/",
  "agent-orchestration/reliability-recovery/",
  "agent-orchestration/security-authority-human-control/",
  "agent-orchestration/tracing-observability-economics/",
  "agent-orchestration/evaluation-regression-evolution/",
  "agent-orchestration/production-orchestration-capstone/",
] as const;

export const MATH_ANIMATION_MODULE_PAGES = [
  "math-animation/outcome-before-engine/",
  "math-animation/repository-evidence-lab/",
  "math-animation/scene-contract-storyboard/",
  "math-animation/manim-environment-first-scene/",
  "math-animation/transformations-camera-continuity/",
  "math-animation/equations-graphs-geometry/",
  "math-animation/codex-implementation-loop/",
  "math-animation/claude-direction-review/",
  "math-animation/motion-canvas-web-track/",
  "math-animation/voice-slides-remotion/",
  "math-animation/mathematical-visual-accessibility-qa/",
  "math-animation/capstone-release-pack/",
] as const;

export const PAGES = [
  "",
  "courses/",
  "handbook/",
  "lab/",
  "build/",
  "teach/",
  "about/",
  "codex/",
  "claude/",
  "cursor/",
  "grok/",
  "prompts/",
  "github/",
  "rag/",
  "mcp/",
  "software-engineering/",
  "make-money-with-codex/",
  "claude-income/",
  "ai-tutor/",
  "product-management/",
  "agent-orchestration/",
  "math-animation/",
  ...CODEX_LESSON_PAGES,
  ...CLAUDE_LESSON_PAGES,
  ...CURSOR_LESSON_PAGES,
  ...GROK_LESSON_PAGES,
  ...PROMPT_LESSON_PAGES,
  ...GITHUB_LESSON_PAGES,
  ...RAG_LESSON_PAGES,
  ...MCP_LESSON_PAGES,
  ...SOFTWARE_ENGINEERING_LESSON_PAGES,
  ...MAKE_MONEY_WITH_CODEX_LESSON_PAGES,
  ...CLAUDE_INCOME_LESSON_PAGES,
  ...AI_TUTOR_MODULE_PAGES,
  ...PRODUCT_MANAGEMENT_MODULE_PAGES,
  ...AGENT_ORCHESTRATION_MODULE_PAGES,
  ...MATH_ANIMATION_MODULE_PAGES,
] as const;
export type Page = (typeof PAGES)[number];

export function codexLessonPage(slug: string): Page {
  const page = `codex/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown Codex lesson route: ${slug}`);
  }
  return page as Page;
}

export function claudeLessonPage(slug: string): Page {
  const page = `claude/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown Claude lesson route: ${slug}`);
  }
  return page as Page;
}

export function promptLessonPage(slug: string): Page {
  const page = `prompts/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown prompt lesson route: ${slug}`);
  }
  return page as Page;
}

export function githubLessonPage(slug: string): Page {
  const page = `github/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown GitHub lesson route: ${slug}`);
  }
  return page as Page;
}

export function ragLessonPage(slug: string): Page {
  const page = `rag/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown RAG lesson route: ${slug}`);
  }
  return page as Page;
}

export function softwareEngineeringLessonPage(slug: string): Page {
  const page = `software-engineering/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown Software Engineering lesson route: ${slug}`);
  }
  return page as Page;
}

export function makeMoneyWithCodexLessonPage(slug: string): Page {
  const page = `make-money-with-codex/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown Make Money with Codex lesson route: ${slug}`);
  }
  return page as Page;
}

export function mcpLessonPage(slug: string): Page {
  const page = `mcp/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown MCP lesson route: ${slug}`);
  }
  return page as Page;
}

export function aiTutorModulePage(slug: string): Page {
  const page = `ai-tutor/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown AI Tutor module route: ${slug}`);
  }
  return page as Page;
}

export function productManagementModulePage(slug: string): Page {
  const page = `product-management/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown Product Management module route: ${slug}`);
  }
  return page as Page;
}

export function agentOrchestrationModulePage(slug: string): Page {
  const page = `agent-orchestration/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown Agent Orchestration module route: ${slug}`);
  }
  return page as Page;
}

export function mathAnimationModulePage(slug: string): Page {
  const page = `math-animation/${slug}/`;
  if (!(PAGES as readonly string[]).includes(page)) {
    throw new Error(`Unknown Math Animation module route: ${slug}`);
  }
  return page as Page;
}

/** Open Graph uses language_TERRITORY rather than the site's BCP-47 route tags. */
const OPEN_GRAPH_LOCALES: Readonly<Record<string, string>> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  "zh-Hans": "zh_CN",
  "zh-Hant": "zh_TW",
  ja: "ja_JP",
  ko: "ko_KR",
  ar: "ar_SA",
};

/** The platform card is language-neutral; course-specific cards can override it later. */
const OG_IMAGE = { url: "/images/ai-learning-social.webp", width: 2400, height: 1260 };

export function urlFor(locale: string, page: Page = ""): string {
  return `${SITE}/${locale}/${page}`;
}

/**
 * Canonical and the full hreflang set for ONE page across every language.
 *
 * Self-referential (each page names itself) and reciprocal (each page names
 * all nine siblings), which is what tells a crawler these are translations of
 * one page rather than nine near-duplicates.
 */
export function alternatesFor(
  locale: string,
  page: Page = "",
  options?: {
    availableLocales?: readonly string[];
    canonicalLocale?: string;
  },
) {
  const availableLocales = options?.availableLocales ?? LOCALE_CODES;
  const canonicalLocale = options?.canonicalLocale ?? locale;
  const languages: Record<string, string> = {};
  for (const code of availableLocales) languages[code] = urlFor(code, page);
  languages["x-default"] = urlFor(
    availableLocales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : canonicalLocale,
    page,
  );
  return { canonical: urlFor(canonicalLocale, page), languages };
}

/**
 * The metadata every page shares, with its own URL threaded through the
 * canonical, the hreflang set and og:url.
 *
 * Next replaces `alternates` and `openGraph` wholesale when a page defines
 * them, rather than merging field by field — which is exactly how the og:url
 * and canonical came to be inherited from the layout in the first place. So
 * pages build the whole object here instead of overriding one key.
 */
export function seoFor(o: {
  locale: string;
  page: Page;
  title: string;
  description: string;
  siteName: string;
  /** When the card should say something shorter than the meta description. */
  ogDescription?: string;
  /** Restrict hreflang when long-form content is not translated for every shell locale. */
  availableLocales?: readonly string[];
  /** Canonical content locale when a translated shell renders unchanged source-language content. */
  canonicalLocale?: string;
}): Metadata {
  const canonicalLocale = o.canonicalLocale ?? o.locale;
  const availableLocales = o.availableLocales ?? LOCALE_CODES;
  const openGraphLocale = OPEN_GRAPH_LOCALES[canonicalLocale];
  const alternateLocale = availableLocales
    .filter((locale) => locale !== canonicalLocale)
    .map((locale) => OPEN_GRAPH_LOCALES[locale]);

  return {
    title: o.title,
    description: o.description,
    alternates: alternatesFor(o.locale, o.page, {
      availableLocales,
      canonicalLocale,
    }),
    openGraph: {
      type: "website",
      siteName: o.siteName,
      title: o.title,
      description: o.ogDescription ?? o.description,
      url: urlFor(canonicalLocale, o.page),
      locale: openGraphLocale,
      alternateLocale,
      images: [{ ...OG_IMAGE, alt: o.title }],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
