import type { ClaudeSourceId, ClaudeSourceRecord } from "./types";

export const CLAUDE_ACADEMY_CATALOG = {
  url: "https://academy.claude.com/assets/data/catalog.json",
  generatedAt: "2026-08-21T17:04:36.545Z",
  staleAfter: "2026-09-20T17:04:36.545Z",
  itemCount: 289,
  fetchedOn: "2026-08-23",
} as const;

const accessedOn = "2026-08-23";
const verifiedAt = "2026-08-23";

type OfficialInput = Omit<Extract<ClaudeSourceRecord, { kind: "official-doc" }>,
  "kind" | "tier" | "publisher" | "accessedOn" | "verifiedAt" | "latestObservedRelease" | "reuseMode"> & {
    readonly publisher?: string;
    readonly tier?: "primary" | "corroborating";
    readonly accessedOn?: string;
    readonly verifiedAt?: string;
    readonly latestObservedRelease?: string | null;
    readonly reuseMode?: "paraphrased" | "asset-reused" | "link-only";
  };

function official(input: OfficialInput): ClaudeSourceRecord {
  const {
    publisher = "Anthropic",
    tier = "primary",
    accessedOn: sourceAccessedOn = accessedOn,
    verifiedAt: sourceVerifiedAt = verifiedAt,
    latestObservedRelease = null,
    reuseMode = "paraphrased",
    ...source
  } = input;
  return {
    kind: "official-doc",
    tier,
    publisher,
    accessedOn: sourceAccessedOn,
    verifiedAt: sourceVerifiedAt,
    latestObservedRelease,
    reuseMode,
    ...source,
  };
}

type GitHubInput = Omit<Extract<ClaudeSourceRecord, { kind: "official-github" | "community-github" }>,
  "tier" | "publisher" | "accessedOn" | "verifiedAt" | "latestObservedRelease" | "reuseMode"> & {
    readonly publisher?: string;
    readonly tier?: "primary" | "corroborating";
    readonly latestObservedRelease?: string | null;
    readonly reuseMode?: "paraphrased" | "asset-reused" | "link-only";
  };

function github(input: GitHubInput): ClaudeSourceRecord {
  return {
    tier: input.tier ?? "corroborating",
    publisher: input.publisher ?? "GitHub",
    accessedOn,
    verifiedAt,
    latestObservedRelease: input.latestObservedRelease ?? `HEAD ${input.commit?.slice(0, 12) ?? "observed"} on ${accessedOn}`,
    reuseMode: input.reuseMode ?? "paraphrased",
    ...input,
  };
}

export const CLAUDE_SOURCES = [
  official({
    id: "academy-catalog",
    title: "Claude Academy live catalogue",
    url: CLAUDE_ACADEMY_CATALOG.url,
    exactAnchor: CLAUDE_ACADEMY_CATALOG.url,
    claimIds: ["academy-item-identity", "catalogue-freshness", "exact-resource-urls"],
    note: `Catalogue generated ${CLAUDE_ACADEMY_CATALOG.generatedAt}; trusted only before ${CLAUDE_ACADEMY_CATALOG.staleAfter}.`,
  }),
  official({
    id: "academy-claude-101",
    title: "Claude 101",
    url: "https://academy.claude.com/courses/claude-101",
    exactAnchor: "https://academy.claude.com/courses/claude-101",
    claimIds: ["beginner-scope", "projects-artifacts-skills-connectors-research"],
    note: "Primary Academy curriculum spine; feature instructions are cross-checked against newer Help Centre pages.",
  }),
  official({
    id: "academy-fluency",
    title: "Getting good at Claude: A research-backed curriculum",
    url: "https://academy.claude.com/tutorials/getting-good-at-claude-a-research-backed-curriculum",
    exactAnchor: "https://academy.claude.com/tutorials/getting-good-at-claude-a-research-backed-curriculum",
    supportingAnchors: ["https://www.anthropic.com/ai-fluency"],
    claimIds: ["signature-moves", "description-spectrum", "discernment-repeated"],
    note: "Grounds the Describe–Delegate–Discern sequence. Framework text is paraphrased; CC BY-NC-SA material is not copied.",
  }),
  official({
    id: "academy-desktop",
    title: "Navigating the Claude desktop app: Chat, Claude Cowork, Claude Code",
    url: "https://academy.claude.com/tutorials/navigating-the-claude-desktop-app",
    exactAnchor: "https://academy.claude.com/tutorials/navigating-the-claude-desktop-app",
    claimIds: ["desktop-three-modes", "surface-selection"],
    reuseMode: "paraphrased",
    note: "Supports the surface-selection lesson by paraphrase only; no Academy visual asset is reused.",
  }),
  official({
    id: "academy-files",
    title: "Create and edit files with Claude to eliminate hours of busy work",
    url: "https://academy.claude.com/tutorials/create-and-edit-files-with-claude-to-eliminate-hours-of-busy-work",
    exactAnchor: "https://academy.claude.com/tutorials/create-and-edit-files-with-claude-to-eliminate-hours-of-busy-work",
    claimIds: ["file-creation-workflow", "native-file-inspection"],
    reuseMode: "paraphrased",
    note: "Supports the guided file workflow by paraphrase; the accompanying diagram is course-original.",
  }),
  official({
    id: "academy-projects",
    title: "Intro to Projects",
    url: "https://academy.claude.com/tutorials/intro-to-projects",
    exactAnchor: "https://academy.claude.com/tutorials/intro-to-projects",
    claimIds: ["project-knowledge", "project-instructions"],
    note: "Conceptual introduction; current entitlement and memory behavior come from the Help Centre.",
  }),
  official({
    id: "academy-artifacts",
    title: "Use Artifacts to visualise and create AI apps",
    url: "https://academy.claude.com/tutorials/use-artifacts-to-visualize-and-create-ai-apps-without-ever-writing-a-line-of-code",
    exactAnchor: "https://academy.claude.com/tutorials/use-artifacts-to-visualize-and-create-ai-apps-without-ever-writing-a-line-of-code",
    claimIds: ["artifact-iteration", "artifact-preview", "artifact-sharing-review"],
    reuseMode: "paraphrased",
    note: "Supports Artifact workflows by paraphrase; the accompanying diagrams are course-original.",
  }),
  official({
    id: "academy-research",
    title: "Using Research",
    url: "https://academy.claude.com/tutorials/using-research",
    exactAnchor: "https://academy.claude.com/tutorials/using-research",
    claimIds: ["research-mode", "multi-source-investigation", "citation-review"],
    note: "Research duration and source counts are deliberately not promised.",
  }),
  official({
    id: "academy-skills",
    title: "Teach Claude your way of working using Skills",
    url: "https://academy.claude.com/tutorials/teach-claude-your-way-of-working-using-skills",
    exactAnchor: "https://academy.claude.com/tutorials/teach-claude-your-way-of-working-using-skills",
    claimIds: ["skills-as-procedure", "skill-testing"],
    note: "Current plan availability and management paths are taken from the newer Help Centre.",
  }),
  official({
    id: "academy-connectors",
    title: "Connect your tools to unlock a more capable AI companion",
    url: "https://academy.claude.com/tutorials/connect-your-tools-to-unlock-a-smarter-more-capable-ai-companion",
    exactAnchor: "https://academy.claude.com/tutorials/connect-your-tools-to-unlock-a-smarter-more-capable-ai-companion",
    claimIds: ["connector-discovery", "connected-context"],
    reuseMode: "paraphrased",
    note: "Supports connector discovery by paraphrase; permission behavior is cross-checked against current Help Centre guidance and the diagram is course-original.",
  }),
  official({
    id: "academy-cowork",
    title: "Get started in Claude Cowork in three steps",
    url: "https://academy.claude.com/tutorials/get-started-in-claude-cowork-in-three-steps",
    exactAnchor: "https://academy.claude.com/tutorials/get-started-in-claude-cowork-in-three-steps",
    claimIds: ["cowork-mode-selection", "outcome-brief", "folder-scope"],
    reuseMode: "paraphrased",
    note: "Surface availability is volatile; the lesson paraphrases this source, uses current Help Centre caveats and manual approvals, and relies on a course-original diagram.",
  }),
  official({
    id: "academy-powerpoint",
    title: "Building a PowerPoint with Claude",
    url: "https://academy.claude.com/tutorials/building-a-powerpoint-with-claude",
    exactAnchor: "https://academy.claude.com/tutorials/building-a-powerpoint-with-claude",
    claimIds: ["presentation-brief", "slide-review"],
    note: "Used for an office-work practice; learners inspect the downloaded file in its native application.",
  }),
  official({
    id: "academy-teachers",
    title: "Claude for Teachers in action",
    url: "https://academy.claude.com/tutorials/claude-for-teachers-in-action",
    exactAnchor: "https://academy.claude.com/tutorials/claude-for-teachers-in-action",
    claimIds: ["teacher-workflows", "educator-review"],
    note: "Supports teacher-facing workflow transfer without delegating high-impact grading decisions.",
  }),
  official({
    id: "support-projects",
    title: "How can I create and manage Projects?",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects",
    exactAnchor: "https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects",
    claimIds: ["projects-all-plans", "free-project-limit", "knowledge-chat-boundary", "project-memory"],
    note: "Operational source of truth when older Academy wording differs.",
  }),
  official({
    id: "support-research",
    title: "Use Research on Claude",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/11088861-use-research-on-claude",
    exactAnchor: "https://support.claude.com/en/articles/11088861-use-research-on-claude",
    supportingAnchors: ["https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research"],
    claimIds: ["research-paid", "web-search-required", "connected-sources"],
    note: "Plan, interface, and capability details are volatile and date-stamped in the course.",
  }),
  official({
    id: "support-skills",
    title: "Use Skills in Claude",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/12512180-use-skills-in-claude",
    exactAnchor: "https://support.claude.com/en/articles/12512180-use-skills-in-claude",
    supportingAnchors: ["https://support.claude.com/en/articles/12512176-what-are-skills"],
    claimIds: ["skills-current-plans", "code-execution-dependency", "skill-risk"],
    note: "Only trusted Skills are used; custom Skill files are treated as executable instructions.",
  }),
  official({
    id: "support-connectors",
    title: "Use Connectors to extend Claude's capabilities",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities",
    exactAnchor: "https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities",
    claimIds: ["connector-read-write", "inherited-permissions", "connector-trust"],
    note: "Authentication is not treated as authorization for every available action.",
  }),
  official({
    id: "support-files",
    title: "Create and edit files with Claude",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude",
    exactAnchor: "https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude",
    supportingAnchors: ["https://support.claude.com/en/articles/8241126-upload-files-to-claude"],
    claimIds: ["supported-office-files", "file-size-boundary", "file-tool-security"],
    note: "Learners verify generated files outside Claude; network and prompt-injection risks are explicit.",
  }),
  official({
    id: "support-artifacts",
    title: "What are artifacts and how do I use them?",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them",
    exactAnchor: "https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them",
    supportingAnchors: ["https://support.claude.com/en/articles/9547008-publish-and-share-artifacts"],
    claimIds: ["artifact-current-surfaces", "artifact-code-execution-dependency", "artifact-publication-boundary", "artifact-sharing-exposure"],
    note: "Operational source of truth for current availability and for the distinct public-publishing, organization-sharing, attachment, and storage boundaries.",
  }),
  official({
    id: "support-cowork",
    title: "Get started with Claude Cowork",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork",
    exactAnchor: "https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork",
    supportingAnchors: ["https://support.claude.com/en/articles/13364135-use-claude-cowork-safely"],
    claimIds: ["cowork-current-surfaces", "cloud-session-boundary", "desktop-folder-bridge", "manual-approvals", "prompt-injection"],
    note: "Course practice uses manual approval, a dedicated connected folder, synthetic data, recoverable copies, and the current cloud-execution boundary.",
  }),
  official({
    id: "support-cowork-architecture",
    title: "Claude Cowork architecture overview",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview",
    exactAnchor: "https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview",
    accessedOn: "2026-08-24",
    verifiedAt: "2026-08-24",
    latestObservedRelease: "Help Centre page observed updated 2026-08-23",
    claimIds: [
      "cowork-cloud-default",
      "cowork-cloud-sandbox-lifecycle",
      "cowork-account-session-file-persistence",
      "cowork-existing-local-execution",
      "cowork-desktop-device-bridge",
    ],
    note: "Operational source of truth for cloud-versus-local execution, temporary sandbox lifecycle, account persistence, and the Desktop device bridge; availability remains rollout- and policy-dependent.",
  }),
  official({
    id: "support-tool-access",
    title: "Manage Claude's tool access",
    publisher: "Claude Help Centre",
    url: "https://support.claude.com/en/articles/13730515-manage-claude-s-tool-access",
    exactAnchor: "https://support.claude.com/en/articles/13730515-manage-claude-s-tool-access",
    claimIds: ["least-privilege", "approval-review", "tool-boundaries"],
    note: "Supports the course-wide rule that tool access must trace to a current, named step.",
  }),
  official({
    id: "claude-pricing",
    title: "Plans & Pricing",
    url: "https://claude.com/pricing",
    exactAnchor: "https://claude.com/pricing",
    claimIds: ["claude-code-paid-entitlement", "free-chat-code-and-file-path"],
    note: "Current plan source states that Claude Code is included in all paid plans and lists the Free-plan Chat, code generation, file creation, and code execution fallback; prices and entitlements remain date-sensitive.",
  }),
  github({
    id: "github-anthropic-skills", kind: "official-github", publisher: "Anthropic",
    title: "anthropics/skills", url: "https://github.com/anthropics/skills",
    exactAnchor: "https://github.com/anthropics/skills/blob/3b3fad96af16a10759d930941b4520ba0c40edae/skills/academy-guide/SKILL.md",
    commit: "3b3fad96af16a10759d930941b4520ba0c40edae", license: "Mixed; academy-guide is Apache-2.0",
    claimIds: ["academy-catalogue-rule", "skill-structure"],
    note: "Only the Apache-licensed Academy Guide pattern is adapted; restrictive document-skill files are not copied.",
  }),
  github({
    id: "github-claude-code", kind: "official-github", publisher: "Anthropic",
    title: "anthropics/claude-code", url: "https://github.com/anthropics/claude-code",
    exactAnchor: "https://github.com/anthropics/claude-code/blob/5cfc0a1905ce0c0a9bd81d8a90fe6b62ff614357/README.md",
    commit: "5cfc0a1905ce0c0a9bd81d8a90fe6b62ff614357", license: "NOASSERTION; link and paraphrase only", reuseMode: "link-only",
    claimIds: ["code-surfaces", "repository-work"],
    note: "No repository-root licence was found; no source code or media is copied.",
  }),
  github({
    id: "github-claude-code-action", kind: "official-github", publisher: "Anthropic",
    title: "anthropics/claude-code-action", url: "https://github.com/anthropics/claude-code-action",
    exactAnchor: "https://github.com/anthropics/claude-code-action/blob/24dcd50c0568f0fc9e9211213a4fd2d9eb15c4e0/docs/solutions.md",
    commit: "24dcd50c0568f0fc9e9211213a4fd2d9eb15c4e0", license: "MIT",
    claimIds: ["github-review-workflow", "scheduled-maintenance", "human-review-gate"],
    note: "Workflow patterns are paraphrased with additional least-privilege and protected-branch safeguards.",
  }),
  github({
    id: "github-cookbooks", kind: "official-github", publisher: "Anthropic",
    title: "anthropics/claude-cookbooks", url: "https://github.com/anthropics/claude-cookbooks",
    exactAnchor: "https://github.com/anthropics/claude-cookbooks/tree/35f2eec7e44897c537e44441b7dff2f0ecbfb804/claude_agent_sdk/research_agent",
    supportingAnchors: ["https://github.com/anthropics/claude-cookbooks/blob/35f2eec7e44897c537e44441b7dff2f0ecbfb804/managed_agents/README.md"],
    commit: "35f2eec7e44897c537e44441b7dff2f0ecbfb804", license: "MIT",
    claimIds: ["research-citations", "data-analysis", "human-approval-gates"],
    note: "Developer/API examples are translated into product-agnostic evidence and verification practices.",
  }),
  github({
    id: "github-knowledge-work", kind: "official-github", publisher: "Anthropic",
    title: "anthropics/knowledge-work-plugins", url: "https://github.com/anthropics/knowledge-work-plugins",
    exactAnchor: "https://github.com/anthropics/knowledge-work-plugins/tree/5267cf7bff3031921d4474b8e8f86ad02d2b8f6d/productivity",
    supportingAnchors: ["https://github.com/anthropics/knowledge-work-plugins/blob/5267cf7bff3031921d4474b8e8f86ad02d2b8f6d/marketing/skills/content-creation/SKILL.md"],
    commit: "5267cf7bff3031921d4474b8e8f86ad02d2b8f6d", license: "Apache-2.0; inspect partner subdirectories separately",
    claimIds: ["role-workflows", "persistent-work-record", "content-creation-process"],
    note: "Supports context–plan–action–verification workflow patterns, not claims of measured productivity.",
  }),
  github({
    id: "github-k12-teacher-skills", kind: "official-github", publisher: "Anthropic",
    title: "anthropics/k12-teacher-skills", url: "https://github.com/anthropics/k12-teacher-skills",
    exactAnchor: "https://github.com/anthropics/k12-teacher-skills/blob/6fc400329540e068516bd34aa78120d89e5e4e8b/plugin/skills/k12-lesson-planning/SKILL.md",
    supportingAnchors: ["https://github.com/anthropics/k12-teacher-skills/blob/6fc400329540e068516bd34aa78120d89e5e4e8b/evals/README.md"],
    commit: "6fc400329540e068516bd34aa78120d89e5e4e8b", license: "Apache-2.0",
    claimIds: ["standards-grounding", "differentiation", "educator-review", "teaching-evaluation"],
    note: "Teacher review and classroom evidence remain required; LLM-as-judge scores are not treated as validation.",
  }),
  github({
    id: "github-cwc-workshops", kind: "official-github", publisher: "Anthropic",
    title: "anthropics/cwc-workshops", url: "https://github.com/anthropics/cwc-workshops",
    exactAnchor: "https://github.com/anthropics/cwc-workshops/tree/068b84bb03d2ae87c51edb2837dda25c84c1d686/how-we-claude-code",
    commit: "068b84bb03d2ae87c51edb2837dda25c84c1d686", license: "Apache-2.0",
    claimIds: ["interview-to-spec", "divergent-prototypes", "machine-verifiable-contract"],
    note: "Workshop materials are not maintained; concepts are pinned, paraphrased, and checked against current product docs.",
  }),
  github({
    id: "github-superpowers", kind: "community-github", publisher: "Jesse Vincent / obra",
    title: "obra/superpowers", url: "https://github.com/obra/superpowers",
    exactAnchor: "https://github.com/obra/superpowers/tree/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills",
    commit: "b36e0829c6d0140e93cfef2ca599b1b07d4a7797", license: "MIT",
    claimIds: ["plan-first", "systematic-debugging", "test-first", "independent-review"],
    note: "Practitioner workflow evidence; productivity claims are excluded.",
  }),
  github({
    id: "github-paper-writing", kind: "community-github", publisher: "SNL-UCSB",
    title: "SNL-UCSB/paper-writing-skill", url: "https://github.com/SNL-UCSB/paper-writing-skill",
    exactAnchor: "https://github.com/SNL-UCSB/paper-writing-skill/tree/676f8520bba54208eb4fe1d41620e365d9af6a24",
    commit: "676f8520bba54208eb4fe1d41620e365d9af6a24", license: "MIT",
    claimIds: ["writing-architecture", "versioned-revision", "red-team-review"],
    note: "Domain-specific style thresholds are presented as optional heuristics, not universal writing rules.",
  }),
  github({
    id: "github-learning-opportunities", kind: "community-github", publisher: "Cat Hicks",
    title: "DrCatHicks/learning-opportunities", url: "https://github.com/DrCatHicks/learning-opportunities",
    exactAnchor: "https://github.com/DrCatHicks/learning-opportunities/tree/3862d2eb6e93427f1f163a54360d11ef943b88b7",
    commit: "3862d2eb6e93427f1f163a54360d11ef943b88b7", license: "CC BY 4.0",
    claimIds: ["predict-before-generation", "trace-and-debug", "teach-back"],
    note: "Research-informed learning design is distinguished from causal efficacy evidence.",
  }),
  github({
    id: "github-academic-workflow", kind: "community-github", publisher: "Pedro H. C. G. S.",
    title: "pedrohcgs/claude-code-my-workflow", url: "https://github.com/pedrohcgs/claude-code-my-workflow",
    exactAnchor: "https://github.com/pedrohcgs/claude-code-my-workflow/tree/be53c12f235996dff41fb7f21580506fd2dd8d50",
    commit: "be53c12f235996dff41fb7f21580506fd2dd8d50", license: "MIT",
    claimIds: ["claim-validation", "reproducibility-passport", "research-to-teaching"],
    note: "Local quality thresholds and bypass-permission guidance are not adopted; least privilege replaces them.",
  }),
  github({
    id: "github-claudeblattman", kind: "community-github", publisher: "Chris Blattman",
    title: "chrisblattman/claudeblattman", url: "https://github.com/chrisblattman/claudeblattman",
    exactAnchor: "https://github.com/chrisblattman/claudeblattman/blob/12e14d42d5c8af6383019ac27ef91e898e812fc2/docs/essentials/project-folders.md",
    supportingAnchors: ["https://github.com/chrisblattman/claudeblattman/blob/12e14d42d5c8af6383019ac27ef91e898e812fc2/docs/toolkit/executive-assistant.md"],
    commit: "12e14d42d5c8af6383019ac27ef91e898e812fc2", license: "MIT",
    claimIds: ["project-context-design", "fresh-chat-testing", "graduated-autonomy", "office-work"],
    note: "Anecdotal time-saving claims are excluded. One licensed, dated Projects UI image is attributed separately.",
  }),
] as const satisfies readonly ClaudeSourceRecord[];

export const CLAUDE_SOURCE_BY_ID = Object.fromEntries(
  CLAUDE_SOURCES.map((source) => [source.id, source]),
) as Readonly<Record<ClaudeSourceId, ClaudeSourceRecord>>;
