import type { CodexSourceId, CodexSourceRecord } from "./types";

const accessedOn = "2026-08-24";
const verifiedAt = "2026-08-24T01:55:04+08:00";

const SOURCE_AUDIT: Record<CodexSourceId, {
  exactAnchor: string;
  supportingAnchors?: readonly string[];
  latestObservedRelease: string | null;
  claimIds: readonly string[];
  reuseMode: "paraphrased" | "asset-reused" | "link-only";
}> = {
  "openai-app": {
    exactAnchor: "https://learn.chatgpt.com/docs/app#get-started-with-the-desktop-app",
    supportingAnchors: ["https://learn.chatgpt.com/docs/app#other-chatgpt-and-codex-surfaces"],
    latestObservedRelease: null,
    claimIds: ["desktop-codex-selection", "workspace-selection", "surface-overview"],
    reuseMode: "paraphrased",
  },
  "openai-auth": {
    exactAnchor: "https://learn.chatgpt.com/docs/auth#openai-authentication",
    supportingAnchors: ["https://learn.chatgpt.com/docs/auth#sign-in-with-chatgpt"],
    latestObservedRelease: null,
    claimIds: ["chatgpt-subscription-access", "api-usage-access", "cloud-authentication"],
    reuseMode: "paraphrased",
  },
  "openai-quickstart": {
    exactAnchor: "https://learn.chatgpt.com/docs/quickstart#setup",
    supportingAnchors: ["https://learn.chatgpt.com/docs/quickstart#where-to-use-chatgpt"],
    latestObservedRelease: null,
    claimIds: ["first-message", "select-codex", "open-location"],
    reuseMode: "paraphrased",
  },
  "openai-prompting": {
    exactAnchor: "https://learn.chatgpt.com/docs/prompting#prompting-codex",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/prompting#prompting-overview",
      "https://learn.chatgpt.com/docs/prompting#fix-a-bug",
      "https://learn.chatgpt.com/docs/prompting#write-a-test",
    ],
    latestObservedRelease: null,
    claimIds: [
      "task-contract",
      "observable-outcome",
      "constraints",
      "verification",
      "bug-reproduction",
      "minimal-fix",
      "regression-test",
      "focused-verification",
    ],
    reuseMode: "paraphrased",
  },
  "openai-projects": {
    exactAnchor: "https://learn.chatgpt.com/docs/projects#work-in-a-project-directory",
    supportingAnchors: ["https://learn.chatgpt.com/docs/projects#choose-a-project-or-start-without-one"],
    latestObservedRelease: null,
    claimIds: ["project-boundary", "chat-boundary", "project-context"],
    reuseMode: "paraphrased",
  },
  "openai-agents-md": {
    exactAnchor: "https://learn.chatgpt.com/docs/agent-configuration/agents-md#how-codex-discovers-guidance",
    latestObservedRelease: null,
    claimIds: ["instruction-discovery", "instruction-precedence", "nested-instruction-scope"],
    reuseMode: "paraphrased",
  },
  "openai-subagents": {
    exactAnchor: "https://learn.chatgpt.com/docs/agent-configuration/subagents#triggering-subagent-workflows",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/agent-configuration/subagents#availability",
      "https://learn.chatgpt.com/docs/agent-configuration/subagents#why-subagent-workflows-help",
      "https://learn.chatgpt.com/docs/agent-configuration/subagents#orchestration-and-thread-controls",
      "https://learn.chatgpt.com/docs/agent-configuration/subagents#managing-subagents",
      "https://learn.chatgpt.com/docs/agent-configuration/subagents#approvals-and-sandbox-controls",
    ],
    latestObservedRelease: null,
    claimIds: ["independent-delegation", "agent-thread-review", "integration-owner"],
    reuseMode: "paraphrased",
  },
  "openai-code-review": {
    exactAnchor: "https://learn.chatgpt.com/docs/code-review#what-changes-it-shows",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/code-review#start-a-review",
      "https://learn.chatgpt.com/docs/code-review#inline-comments-for-feedback",
      "https://learn.chatgpt.com/docs/code-review#staging-and-reverting-files",
      "https://learn.chatgpt.com/docs/code-review#work-with-review-results",
      "https://learn.chatgpt.com/docs/code-review#navigating-the-review-pane",
    ],
    latestObservedRelease: null,
    claimIds: ["review-scopes", "inline-findings", "stage-revert", "detached-review"],
    reuseMode: "paraphrased",
  },
  "openai-build-skills": {
    exactAnchor: "https://learn.chatgpt.com/docs/build-skills#create-a-skill",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills",
      "https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills",
      "https://learn.chatgpt.com/docs/build-skills#best-practices",
    ],
    latestObservedRelease: null,
    claimIds: ["repeatable-workflow", "progressive-disclosure", "instruction-first-skill"],
    reuseMode: "paraphrased",
  },
  "openai-hooks": {
    exactAnchor: "https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/hooks#where-codex-looks-for-hooks",
      "https://learn.chatgpt.com/docs/hooks#plugin-bundled-hooks",
    ],
    latestObservedRelease: null,
    claimIds: ["hook-source-review", "hook-hash-trust", "plugin-hook-trust"],
    reuseMode: "paraphrased",
  },
  "openai-permissions": {
    exactAnchor: "https://learn.chatgpt.com/docs/agent-approvals-security#sandbox-and-approvals",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/agent-approvals-security#defaults-and-recommendations",
      "https://learn.chatgpt.com/docs/agent-approvals-security#automatic-approval-reviews",
      "https://learn.chatgpt.com/docs/agent-approvals-security#network-access",
      "https://learn.chatgpt.com/docs/agent-approvals-security#traffic-outside-the-command-network-proxy",
    ],
    latestObservedRelease: null,
    claimIds: ["sandbox-boundary", "approval-policy", "least-privilege", "untrusted-input"],
    reuseMode: "paraphrased",
  },
  "openai-automations": {
    exactAnchor: "https://learn.chatgpt.com/docs/automations#test-scheduled-tasks",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/automations#schedule-a-task-inside-a-chat",
      "https://learn.chatgpt.com/docs/automations#permissions-and-security-model",
    ],
    latestObservedRelease: null,
    claimIds: ["scheduled-task-runtime", "durable-scheduled-prompt", "test-before-scheduling", "scheduled-task-safety"],
    reuseMode: "paraphrased",
  },
  "openai-environment-modes": {
    exactAnchor: "https://learn.chatgpt.com/docs/environments/modes",
    latestObservedRelease: null,
    claimIds: ["local-mode", "worktree-mode", "cloud-mode"],
    reuseMode: "paraphrased",
  },
  "openai-local-environment": {
    exactAnchor: "https://learn.chatgpt.com/docs/environments/local-environment#setup-scripts",
    supportingAnchors: ["https://learn.chatgpt.com/docs/environments/local-environment#actions"],
    latestObservedRelease: null,
    claimIds: ["worktree-setup-script", "reusable-local-actions"],
    reuseMode: "paraphrased",
  },
  "openai-cloud-environment": {
    exactAnchor: "https://learn.chatgpt.com/docs/environments/cloud-environment#environment-variables-and-secrets",
    supportingAnchors: ["https://learn.chatgpt.com/docs/environments/cloud-environment#how-codex-cloud-chats-run"],
    latestObservedRelease: null,
    claimIds: ["cloud-setup", "setup-only-secrets", "cloud-network-default"],
    reuseMode: "paraphrased",
  },
  "openai-worktrees": {
    exactAnchor: "https://learn.chatgpt.com/docs/environments/git-worktrees",
    supportingAnchors: ["https://learn.chatgpt.com/docs/environments/git-worktrees#whats-a-worktree"],
    latestObservedRelease: null,
    claimIds: ["parallel-isolation", "worktree-handoff", "integration-verification"],
    reuseMode: "paraphrased",
  },
  "openai-github-action": {
    exactAnchor: "https://learn.chatgpt.com/docs/github-action",
    latestObservedRelease: null,
    claimIds: ["action-usage", "read-only-review-job", "separate-feedback-job"],
    reuseMode: "paraphrased",
  },
  "openai-noninteractive": {
    exactAnchor: "https://learn.chatgpt.com/docs/non-interactive-mode#basic-usage",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/non-interactive-mode#make-output-machine-readable",
      "https://learn.chatgpt.com/docs/non-interactive-mode#create-structured-outputs-with-a-schema",
      "https://learn.chatgpt.com/docs/non-interactive-mode#permissions-and-safety",
    ],
    latestObservedRelease: null,
    claimIds: ["codex-exec", "exec-unconfigured-read-only-default", "jsonl-events", "schema-constrained-output", "automation-failure"],
    reuseMode: "paraphrased",
  },
  "openai-developer-commands": {
    exactAnchor: "https://learn.chatgpt.com/docs/developer-commands?surface=cli#built-in-slash-commands",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/developer-commands?surface=cli#codex-exec",
      "https://learn.chatgpt.com/docs/developer-commands?surface=ide#available-slash-commands",
    ],
    latestObservedRelease: null,
    claimIds: ["cli-slash-commands", "ide-slash-commands", "login-status", "resume", "exec-sandbox-defaults"],
    reuseMode: "paraphrased",
  },
  "openai-long-running-work": {
    exactAnchor: "https://learn.chatgpt.com/docs/long-running-work#start-a-goal",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/long-running-work#define-what-done-means",
      "https://learn.chatgpt.com/docs/long-running-work#steer-a-running-goal",
    ],
    latestObservedRelease: null,
    claimIds: ["goal-mode", "goal-completion-criteria", "goal-steering", "permission-continuity"],
    reuseMode: "paraphrased",
  },
  "openai-integrated-terminal": {
    exactAnchor: "https://learn.chatgpt.com/docs/integrated-terminal#run-and-validate-your-project",
    latestObservedRelease: null,
    claimIds: ["project-scoped-terminal", "terminal-output-context", "local-validation"],
    reuseMode: "paraphrased",
  },
  "openai-cli": {
    exactAnchor: "https://learn.chatgpt.com/docs/codex/cli#get-started-with-codex-cli",
    supportingAnchors: ["https://learn.chatgpt.com/docs/codex/cli#start-your-first-task"],
    latestObservedRelease: null,
    claimIds: ["cli-install", "cli-working-directory", "interactive-loop", "git-checkpoints"],
    reuseMode: "paraphrased",
  },
  "openai-ide": {
    exactAnchor: "https://learn.chatgpt.com/docs/codex/ide#use-the-context-already-open",
    supportingAnchors: [
      "https://learn.chatgpt.com/docs/codex/ide#review-changes-beside-your-code",
      "https://learn.chatgpt.com/docs/codex/ide#delegate-when-the-task-grows",
    ],
    latestObservedRelease: null,
    claimIds: ["open-file-context", "selected-code-context", "inline-review", "cloud-delegation"],
    reuseMode: "paraphrased",
  },
  "openai-cloud": {
    exactAnchor: "https://learn.chatgpt.com/docs/cloud#set-up-codex-cloud",
    supportingAnchors: ["https://learn.chatgpt.com/docs/cloud#run-work-in-parallel"],
    latestObservedRelease: null,
    claimIds: ["cloud-delegation", "parallel-cloud-work", "hosted-task-boundary"],
    reuseMode: "paraphrased",
  },
  "github-openai-codex": {
    exactAnchor: "https://github.com/openai/codex/blob/2161ec272a7d6b775c9c721e6206f4fe63e383f2/README.md",
    supportingAnchors: [
      "https://github.com/openai/codex/blob/2161ec272a7d6b775c9c721e6206f4fe63e383f2/AGENTS.md",
      "https://github.com/openai/codex/blob/2161ec272a7d6b775c9c721e6206f4fe63e383f2/codex-rs/tui/src/bottom_pane/AGENTS.md",
    ],
    latestObservedRelease: "rust-v0.149.0 observed 2026-08-24",
    claimIds: ["first-party-implementation", "root-agents-example", "nested-agents-example"],
    reuseMode: "paraphrased",
  },
  "github-openai-cookbook": {
    exactAnchor: "https://github.com/openai/openai-cookbook/blob/79791c4e0dcc794d0110787805a5833c87092132/articles/codex_exec_plans.md#milestones",
    latestObservedRelease: null,
    claimIds: ["living-exec-plan", "independently-verifiable-milestone", "safe-recovery"],
    reuseMode: "paraphrased",
  },
  "github-openai-codex-action": {
    exactAnchor: "https://github.com/openai/codex-action/blob/86365089eb2b84e0a8fb0717b304f8bdcb13b20e/README.md#permission-profiles",
    supportingAnchors: [
      "https://github.com/openai/codex-action/blob/86365089eb2b84e0a8fb0717b304f8bdcb13b20e/README.md#safety-strategy",
      "https://github.com/openai/codex-action/blob/86365089eb2b84e0a8fb0717b304f8bdcb13b20e/docs/security.md#defending-against-untrusted-input",
      "https://github.com/openai/codex-action/blob/86365089eb2b84e0a8fb0717b304f8bdcb13b20e/CHANGELOG.md#v112-2026-08-20",
    ],
    latestObservedRelease: "v1.12 tag and changelog observed 2026-08-24; GitHub tag verification reports unsigned",
    claimIds: ["action-hardening", "permission-profile", "untrusted-input", "secret-isolation"],
    reuseMode: "paraphrased",
  },
  "github-spec-kit": {
    exactAnchor: "https://github.com/github/spec-kit/blob/27f50f7e6b618ea14d74dd4037f9e7c60218b16c/README.md#sdd-quickstart",
    supportingAnchors: ["https://github.com/github/spec-kit/blob/27f50f7e6b618ea14d74dd4037f9e7c60218b16c/README.md#optional-commands"],
    latestObservedRelease: "v1.0.1 observed 2026-08-24",
    claimIds: ["specify-plan-tasks-implement-converge", "optional-clarification"],
    reuseMode: "paraphrased",
  },
  "github-superpowers": {
    exactAnchor: "https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/systematic-debugging/SKILL.md",
    supportingAnchors: [
      "https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/test-driven-development/SKILL.md",
      "https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/verification-before-completion/SKILL.md",
    ],
    latestObservedRelease: "v6.3.0 observed 2026-08-24",
    claimIds: ["root-cause-first", "one-hypothesis", "red-green-refactor", "fresh-verification"],
    reuseMode: "paraphrased",
  },
  "github-agents-md": {
    exactAnchor: "https://github.com/agentsmd/agents.md/blob/d1ac7f063d20e70015ed6732664049ae4ba9d74e/README.md",
    latestObservedRelease: null,
    claimIds: ["agent-instruction-format"],
    reuseMode: "paraphrased",
  },
  "github-openspec": {
    exactAnchor: "https://github.com/Fission-AI/OpenSpec/blob/f1b521dffac38ed6638689cd28b0c204b1eef0f1/docs/workflows.md#workflow-at-a-glance",
    supportingAnchors: [
      "https://github.com/Fission-AI/OpenSpec/blob/f1b521dffac38ed6638689cd28b0c204b1eef0f1/docs/workflows.md#default-quick-path-core-profile",
      "https://github.com/Fission-AI/OpenSpec/blob/f1b521dffac38ed6638689cd28b0c204b1eef0f1/docs/how-commands-work.md#which-commands-do-i-even-have",
    ],
    latestObservedRelease: "v1.10.0 observed 2026-08-24",
    claimIds: ["auditable-change-artifacts", "optional-explore", "default-propose-apply-archive", "optional-verification"],
    reuseMode: "paraphrased",
  },
};

const RAW_CODEX_SOURCES = [
  { id: "openai-app", kind: "official-doc", title: "ChatGPT desktop app with Codex", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/app", accessedOn, note: "Primary reference for selecting Codex in the ChatGPT desktop app and choosing a workspace surface." },
  { id: "openai-auth", kind: "official-doc", title: "Authentication", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/auth", accessedOn, note: "Primary reference for ChatGPT subscription access, API-funded access, and the cloud sign-in requirement." },
  { id: "openai-quickstart", kind: "official-doc", title: "Quickstart", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/quickstart", accessedOn, note: "Primary reference for selecting Codex, opening a location, and sending a first message." },
  { id: "openai-prompting", kind: "official-doc", title: "Prompting", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/prompting", accessedOn, note: "Primary reference for concrete outcomes, relevant context, constraints, and verification." },
  { id: "openai-projects", kind: "official-doc", title: "Projects and chats", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/projects", accessedOn, note: "Primary reference for project directories, workspaces, and self-contained chats without a project." },
  { id: "openai-agents-md", kind: "official-doc", title: "Custom instructions with AGENTS.md", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/agent-configuration/agents-md", accessedOn, note: "Primary reference for instruction discovery, root-to-leaf precedence, and nested scope." },
  { id: "openai-subagents", kind: "official-doc", title: "Subagents", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/agent-configuration/subagents", accessedOn, note: "Primary reference for bounded delegation, agent-thread inspection, and integration ownership." },
  { id: "openai-code-review", kind: "official-doc", title: "Code review", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/code-review", accessedOn, note: "Primary reference for review scopes, inline findings, detached review, and stage or revert controls." },
  { id: "openai-build-skills", kind: "official-doc", title: "Build skills", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/build-skills", accessedOn, note: "Primary reference for focused, instruction-first Skills and progressive disclosure." },
  { id: "openai-hooks", kind: "official-doc", title: "Hooks", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/hooks", accessedOn, note: "Primary reference for hook discovery, exact-definition trust review, and plugin-bundled hook controls." },
  { id: "openai-permissions", kind: "official-doc", title: "Agent approvals and security", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/agent-approvals-security", accessedOn, note: "Primary reference for the distinct sandbox and approval controls, least privilege, and untrusted input." },
  { id: "openai-automations", kind: "official-doc", title: "Scheduled tasks", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/automations", accessedOn, note: "Primary reference for local and web scheduled-task behavior, durable prompts, testing, and unattended permissions." },
  { id: "openai-environment-modes", kind: "official-doc", title: "Environment modes", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/environments/modes", accessedOn, note: "Primary reference for Local, Worktree, and Cloud execution modes." },
  { id: "openai-local-environment", kind: "official-doc", title: "Local environments", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/environments/local-environment", accessedOn, note: "Primary reference for desktop worktree setup scripts and reusable local project actions, not Local execution mode." },
  { id: "openai-cloud-environment", kind: "official-doc", title: "Cloud environments", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/environments/cloud-environment", accessedOn, note: "Primary reference for cloud checkout and setup, setup-only secrets, and agent-phase network controls." },
  { id: "openai-worktrees", kind: "official-doc", title: "Git worktrees", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/environments/git-worktrees", accessedOn, note: "Primary reference for isolated local chats, handoff, and combined verification." },
  { id: "openai-github-action", kind: "official-doc", title: "Codex GitHub Action", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/github-action", accessedOn, note: "Primary reference for using the Codex Action in a least-privilege review workflow." },
  { id: "openai-noninteractive", kind: "official-doc", title: "Non-interactive mode", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/non-interactive-mode", accessedOn, note: "Primary reference for codex exec, the unconfigured read-only default described by the guide, JSONL events, schema-constrained final output, and automation failures." },
  { id: "openai-developer-commands", kind: "official-doc", title: "Developer commands", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/developer-commands?surface=cli", accessedOn, note: "Primary reference for current CLI and IDE slash commands, login status, session controls, and the command-reference rule that an omitted codex exec sandbox flag inherits active configuration." },
  { id: "openai-long-running-work", kind: "official-doc", title: "Long-running work", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/long-running-work", accessedOn, note: "Primary reference for /plan, /goal, measurable completion criteria, progress controls, and same-chat steering." },
  { id: "openai-integrated-terminal", kind: "official-doc", title: "Integrated terminal", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/integrated-terminal", accessedOn, note: "Primary reference for the project- or worktree-scoped desktop terminal and visible validation output." },
  { id: "openai-cli", kind: "official-doc", title: "Codex CLI", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/codex/cli", accessedOn, note: "Primary reference for installing, starting the interactive terminal surface, and creating Git checkpoints before and after a task." },
  { id: "openai-ide", kind: "official-doc", title: "Codex IDE extension", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/codex/ide", accessedOn, note: "Primary reference for open-file and selected-code context, inline review, and cloud delegation." },
  { id: "openai-cloud", kind: "official-doc", title: "Codex cloud", publisher: "OpenAI", url: "https://learn.chatgpt.com/docs/cloud", accessedOn, note: "Primary reference for hosted repository tasks and parallel cloud work." },
  { id: "github-openai-codex", kind: "official-github", title: "openai/codex", publisher: "OpenAI", url: "https://github.com/openai/codex", accessedOn, verifiedRevision: "2161ec272a7d6b775c9c721e6206f4fe63e383f2", stars: 114995, starsSnapshotOn: accessedOn, license: "Apache-2.0", note: "First-party implementation plus real root and nested AGENTS.md examples; latest stable release rust-v0.149.0 observed." },
  { id: "github-openai-cookbook", kind: "official-github", title: "openai/openai-cookbook", publisher: "OpenAI", url: "https://github.com/openai/openai-cookbook", accessedOn, verifiedRevision: "79791c4e0dcc794d0110787805a5833c87092132", stars: 75497, starsSnapshotOn: accessedOn, license: "MIT", note: "First-party ExecPlans guidance for living plans and independently verifiable milestones." },
  { id: "github-openai-codex-action", kind: "official-github", title: "openai/codex-action", publisher: "OpenAI", url: "https://github.com/openai/codex-action", accessedOn, verifiedRevision: "86365089eb2b84e0a8fb0717b304f8bdcb13b20e", stars: 1205, starsSnapshotOn: accessedOn, license: "Apache-2.0", note: "First-party permission-profile, safety-strategy, and untrusted-input guidance; v1.12 tag and changelog observed, with GitHub tag verification reporting unsigned." },
  { id: "github-spec-kit", kind: "community-github", title: "github/spec-kit", publisher: "GitHub", url: "https://github.com/github/spec-kit", accessedOn, verifiedRevision: "27f50f7e6b618ea14d74dd4037f9e7c60218b16c", stars: 130924, starsSnapshotOn: accessedOn, license: "MIT", note: "Community corroboration for Specify, Plan, Tasks, Implement, and Converge, with clarification optional before planning." },
  { id: "github-superpowers", kind: "community-github", title: "obra/superpowers", publisher: "obra", url: "https://github.com/obra/superpowers", accessedOn, verifiedRevision: "b36e0829c6d0140e93cfef2ca599b1b07d4a7797", stars: 276585, starsSnapshotOn: accessedOn, license: "MIT", note: "Community corroboration for systematic debugging, red-green-refactor, and fresh verification; release v6.3.0 observed." },
  { id: "github-agents-md", kind: "community-github", title: "agentsmd/agents.md", publisher: "agentsmd", url: "https://github.com/agentsmd/agents.md", accessedOn, verifiedRevision: "d1ac7f063d20e70015ed6732664049ae4ba9d74e", stars: 23809, starsSnapshotOn: accessedOn, license: "MIT", note: "Community corroboration for a concise, predictable repository instruction format." },
  { id: "github-openspec", kind: "community-github", title: "Fission-AI/OpenSpec", publisher: "Fission-AI", url: "https://github.com/Fission-AI/OpenSpec", accessedOn, verifiedRevision: "f1b521dffac38ed6638689cd28b0c204b1eef0f1", stars: 65976, starsSnapshotOn: accessedOn, license: "MIT", note: "Optional community corroboration for auditable change artifacts; the current core path makes Explore optional, then uses Propose, Apply, Sync, and Archive, while Verify is optional in the expanded profile; release v1.10.0 observed." },
] as const;

export const CODEX_SOURCES = RAW_CODEX_SOURCES.map((source) => ({
  ...source,
  tier: source.kind === "community-github" ? "corroborating" as const : "primary" as const,
  verifiedAt,
  ...SOURCE_AUDIT[source.id],
})) satisfies readonly CodexSourceRecord[];

export const CODEX_SOURCE_BY_ID = Object.fromEntries(
  CODEX_SOURCES.map((source) => [source.id, source]),
) as Readonly<Record<CodexSourceId, CodexSourceRecord>>;
