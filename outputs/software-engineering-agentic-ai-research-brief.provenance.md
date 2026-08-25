# Software Engineering with Agentic AI

## Research-brief provenance and rights ledger

**Companion to:** software-engineering-agentic-ai-research-brief.md  
**Observation date for every record:** 2026-08-23  
**Purpose:** Auditable source ledger for the GitHub-hosted practitioner-evidence layer of aicourse.top Course 8.  
**Quotation policy:** Findings are paraphrased. No long copyrighted passage is reproduced.  
**Rights posture:** Conservative. A repository license is not assumed to cover papers, datasets, issue text, attachments, screenshots, logos, trademarks, linked content, or product interfaces.

## 1. Method

### 1.1 Selection criteria

Sources were prioritized when they offered one or more of the following:

- a defined sample, task set, or comparison;
- downloadable data, code, or an executable harness;
- concrete failure modes rather than promotional claims;
- observable controls for permissions, isolation, review, evaluation, or recovery;
- a maintained production instruction file or workflow;
- a maintainer policy that makes human responsibility explicit;
- a reproducible practice suitable for a course lab.

Sources were deprioritized when they relied primarily on product marketing, star counts, impressions without artifacts, unsupported model rankings, or success-only demonstrations.

### 1.2 Evidence classes

| Class | Meaning | Appropriate use |
|---|---|---|
| A | Controlled or reproducible empirical research | Bounded quantitative or qualitative finding with explicit sample and method |
| B | Executable reference implementation or evaluation harness | Reproducible mechanics, control design, trace structure, or grading pattern |
| C | Production instruction or control artifact | A concrete maintained practice; not causal proof |
| D | Maintainer governance or contribution policy | Project-specific accountability and contribution norms |
| E | Issue report or discussion case | Low-evidence failure illustration only; not prevalence or verified current behavior |

Some records have two classes because the artifact combines a research release with executable code, or a reference implementation with production guidance.

### 1.3 Audit rules

1. A numeric statement may be taught only with its sample, date or tool era, outcome definition, and principal limitation.
2. Main-branch and master-branch URLs are mutable. Pin an exact commit before quoting code, reproducing a file, or finalizing a course figure.
3. A license label applies only to the scope stated in the record. Verify vendored code, datasets, documentation, images, and linked materials separately.
4. Issue reports are introduced with “a user reported.” They are never used to estimate frequency.
5. Tool-author benchmarks are useful for mechanism and reproducibility but are not treated as neutral product rankings.
6. No source here authorizes reproduction of a Claude or OpenAI interface. UI assets follow the separate figure protocol in the brief.

## 2. Empirical research and replication artifacts

### E01 — Measuring Early-2025 AI on Experienced Open-Source Developer Productivity

- **URL:** https://github.com/METR/Measuring-Early-2025-AI-on-Exp-OSS-Devs
- **Source class:** A — controlled empirical research with public analysis artifacts.
- **Publisher or maintainer:** METR.
- **Observed:** 2026-08-23.
- **License and rights status:** No recognized repository-wide open-source license was detected during this review. The safest posture is link and paraphrase only. Do not redistribute code, data, tables, or figures without separate permission or a later verified license.
- **Evidence used:** The repository reports a randomized field study covering 246 real issues completed by 16 experienced open-source maintainers working in familiar repositories. The reported estimate was a 0.188 increase in task-completion time when early-2025 AI tools were allowed, conventionally summarized as about 19 percent slower in that study setting.
- **How used in the brief:** Supports the claim that productivity is contingent and must be measured locally. It anchors the course requirement to compare accepted outcomes and human effort with a baseline.
- **Limitations and cautions:** Small maintainer sample; mature familiar repositories; early-2025 tools and models; task-completion time rather than all dimensions of value; not evidence that agents universally slow development. Preserve the authors’ uncertainty estimates when teaching the result.
- **Reproduction note:** Pin the repository commit and follow its documented analysis environment before reproducing a result. Record any deviations.

### E02 — SWE-chat code and project repository

- **URL:** https://github.com/SALT-NLP/SWE-chat
- **Source class:** A/B — empirical research release and supporting repository.
- **Publisher or maintainer:** SALT-NLP and named project contributors.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository code declares the MIT License. License file: https://github.com/SALT-NLP/SWE-chat/blob/main/LICENSE. The MIT grant for repository code does not automatically license the underlying conversations, repository code appearing in records, paper figures, or third-party data.
- **Evidence used:** Project entry point for a large observational study of public-repository coding-agent sessions, including prompts, tool actions, corrections, and downstream commit survival.
- **How used in the brief:** Supports outcome-oriented evaluation: accepted code, human correction, tool behavior, and security findings rather than first-draft fluency.
- **Limitations and cautions:** Observational and opt-in; public repositories and a particular client ecosystem; dataset and code can evolve; selection effects are likely. GitHub repository status at observation suggested parts of the code release remained incomplete, so do not claim full reproduction without verifying current artifacts.
- **Reuse note:** Code reuse must retain the MIT notice. Do not publish raw session content without the dataset’s terms, privacy review, and third-party-rights assessment.

### E03 — SWE-chat dataset

- **URL:** https://huggingface.co/datasets/SALT-NLP/SWE-chat
- **Source class:** A — research dataset and dataset card.
- **Publisher or maintainer:** SALT-NLP.
- **Observed:** 2026-08-23.
- **License and rights status:** The dataset card identifies ODC-BY terms and access conditions. Those terms govern database rights but may not eliminate rights or privacy interests in individual prompts, code fragments, repository content, names, paths, or third-party material. Verify the live card before use.
- **Evidence used:** Approximately 6,000 sessions, about 63,000 prompts, and about 355,000 tool calls are reported across public repositories. Associated analyses report partial survival of generated code into commits and frequent user pushback or interruption.
- **How used in the brief:** Motivates measures of retained artifact value, intervention, rework, and trajectory risk.
- **Limitations and cautions:** Opt-in and observational; public-repository focus; client-specific collection; preprocessing and linkage choices affect derived statistics; the dataset is living; privacy and re-identification risk remain even when source repositories are public.
- **Reuse note:** Prefer aggregate statistics or a course-created synthetic example. Do not place raw transcripts in course content, exercises, retrieval systems, or screenshots without a separate lawful and ethical review.

### E04 — SWE-chat paper

- **URL:** https://arxiv.org/abs/2604.20779
- **Source class:** A — research paper describing dataset construction and analyses.
- **Publisher or maintainer:** Named paper authors; arXiv is the distribution host.
- **Observed:** 2026-08-23.
- **License and rights status:** The paper is distributed under CC BY 4.0 as shown on the observed arXiv record. Dataset/database rights, access conditions, repository material, and rights in underlying session content remain separate. No paper figure is copied here.
- **Evidence used:** Reported findings include roughly 44 percent survival of agent-generated code into commits, user pushback or interruption on roughly 44 percent of turns, and more Semgrep findings in sessions categorized as vibe coding.
- **How used in the brief:** Supports teaching accepted-artifact evaluation, correction behavior, and security review.
- **Limitations and cautions:** Observational association, not causal effect; definitions and linkage methods matter; Semgrep findings are not equivalent to exploitable vulnerabilities; percentages should be taught with the paper’s denominators and confidence or sensitivity analyses.
- **Figure rule:** Recreate only a simple chart from data whose reuse is allowed, cite the transformation, or link to the paper. Do not screenshot the PDF.

### E05 — Coding Agents in the Wild replication repository

- **URL:** https://github.com/mahdhindi/coding-agents-wild
- **Source class:** A/B — replication materials and analysis code.
- **Publisher or maintainer:** Mahdi Hindi and project contributors.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT. License: https://github.com/mahdhindi/coding-agents-wild/blob/main/LICENSE. The underlying AIDev dataset and paper have separate terms.
- **Evidence used:** Analysis of 12,433 agent-authored pull requests across 1,495 repositories, including 4,283 rejected pull requests; many rejections lacked inline feedback. The commented rejected subset contained a prominent functional-issue category.
- **How used in the brief:** Supports pull-request labs that require explicit intent, local validation, documentation, and an interpretable evidence package.
- **Limitations and cautions:** Silent closures make rejection reasons unknown for many cases; the detailed taxonomy applies to a commented subset; automated classification has imperfect accuracy; repository and time-period selection affect generalizability.
- **Reproduction note:** Obtain and document the exact AIDev snapshot and filters. Do not infer rejection cause where feedback is absent.

### E06 — Coding Agents in the Wild paper

- **URL:** https://doi.org/10.1109/ACCESS.2026.3696573
- **Source class:** A — peer-reviewed empirical article.
- **Publisher or maintainer:** IEEE Access and named authors.
- **Observed:** 2026-08-23.
- **License and rights status:** The article is reported as Creative Commons Attribution 4.0. Verify the license on the publisher record before reproducing a figure. Attribution must include author, title, source, license, and modifications.
- **Evidence used:** Functional issues were reported as the largest rejection-reason category in the analyzed commented subset; documentation co-change was associated with lower rejection odds, with an odds ratio reported around 0.62.
- **How used in the brief:** Supports the need for functional validation and documentation, while explicitly teaching the difference between association and causation.
- **Limitations and cautions:** Observational design; a documentation association does not prove documentation causes acceptance; detailed reason coding excludes silent rejections; model and repository populations can drift.
- **Teaching phrasing:** Say “documentation co-change was associated with lower rejection odds in this dataset,” not “documentation makes agent pull requests succeed.”

### E07 — Coding Agent Security Debt repository

- **URL:** https://github.com/microsoft/coding-agent-security-debt
- **Source class:** A/B — empirical security study with released analysis and harness artifacts.
- **Publisher or maintainer:** Microsoft Research and named contributors.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT. License: https://github.com/microsoft/coding-agent-security-debt/blob/main/LICENSE.
- **Evidence used:** More than 12,000 agent actions across five model backends and 93 setup tasks; about 21 percent of trajectories reportedly contained at least one detected insecure action, with information exposure a leading category.
- **How used in the brief:** Expands security beyond final source-code vulnerabilities to commands, credentials, files, network activity, configuration, and dependencies.
- **Limitations and cautions:** One OpenHands-based harness, bounded setup tasks, time-specific model snapshots, and detector limitations. Do not reproduce model rankings as current facts.
- **Reproduction note:** Preserve task definitions, detector version, model snapshot, harness commit, and action-level data. Report false-positive and false-negative assumptions.

### E08 — Coding Agent Security Debt paper

- **URL:** https://openreview.net/pdf?id=k6QhzThVSS
- **Source class:** A — research paper.
- **Publisher or maintainer:** Named authors; OpenReview is the distribution platform.
- **Observed:** 2026-08-23.
- **License and rights status:** No separate broad figure-reuse license was established in this review. Link and paraphrase; verify the live paper license or obtain permission before reproducing tables or figures.
- **Evidence used:** Documents the study design, insecurity taxonomy, detector validation, high-precision orientation, and reported detector recall of about 61.11 percent.
- **How used in the brief:** Justifies teaching trajectory inspection and the principle that a scanner is a signal, not proof of safety.
- **Limitations and cautions:** Workshop context; task and harness scope; incomplete detector recall means the reported insecurity rate is not a complete census. Exact values must be checked against the current paper.
- **Figure rule:** Do not screenshot or lift paper figures under an unverified license.

### E09 — Agent Library Usage

- **URL:** https://github.com/itsluketwist/agent-library-usage
- **Source class:** A — observational empirical analysis with released artifacts.
- **Publisher or maintainer:** Luke Twist and named project contributors.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares Creative Commons Attribution 4.0. License: https://github.com/itsluketwist/agent-library-usage/blob/main/LICENSE.
- **Evidence used:** Analysis of 26,760 pull requests reportedly found library imports in about 29.5 percent, new dependency additions in about 1.3 percent, and version constraints in about 75 percent of dependency additions.
- **How used in the brief:** Motivates a dependency-review checklist covering package identity, source, license, vulnerability status, version constraints, lockfiles, integrity, and maintenance.
- **Limitations and cautions:** Observational snapshot based on AIDev data from a defined period; frequencies do not establish correctness or safety; ecosystem and detection rules matter.
- **Reuse note:** CC BY 4.0 reuse requires attribution and indication of modifications. Verify third-party dataset terms separately.

### E10 — Context Files for Coding Agents

- **URL (paper):** https://arxiv.org/abs/2607.27250
- **Replication repository:** https://github.com/codeprakhar25/context-files-coding-agents
- **Source class:** A/B — empirical ablation study and executable safety harness.
- **Publisher or maintainer:** Prakhar Khatri; the replication repository is maintained under the `codeprakhar25` account.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT. License: https://github.com/codeprakhar25/context-files-coding-agents/blob/main/LICENSE.
- **Evidence used:** The repository contains 291 raw runs; 288 entered the paper’s correctness analysis. The bounded study detected no measurable correctness effect from context files. Exploratory, post-hoc process analyses in one repository reported fewer full-suite executions on three of four tasks (exact sign-flip p = .250) and lower wall-clock time on four of five Claude tasks. The harness removed remotes, denied push and GitHub commands, stripped tokens, pruned future solution history, and enforced a hard verification gate.
- **How used in the brief:** Supports two distinct lessons: context files are not guarantees, and experimental agent runs require strong environmental controls.
- **Limitations and cautions:** Under review at observation; only 15 Claude and 17 Codex tasks; underpowered for universal null effects; the process analyses are small, repository-specific, exploratory, and post hoc; client and model versions age quickly.
- **Teaching phrasing:** Say “this small study did not detect a correctness benefit,” not “instruction files never work.”

## 3. Evaluation harnesses, traces, and reversible workflows

### E11 — SWE-bench repository

- **URL:** https://github.com/SWE-bench/SWE-bench
- **Source class:** B — executable repository-level evaluation framework.
- **Publisher or maintainer:** SWE-bench maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT. License: https://github.com/SWE-bench/SWE-bench/blob/main/LICENSE. Individual benchmark source repositories retain their own licenses.
- **Evidence used:** Demonstrates task packaging, environment setup, patch application, test execution, and grading for real repository issues.
- **How used in the brief:** Provides a concrete basis for teaching frozen environments, independent graders, reproducible run records, and the distinction between harness success and production readiness.
- **Limitations and cautions:** Benchmark task distribution is not all software engineering; contamination and harness defects are possible; resolving a task under the harness does not establish non-functional quality or deployability.
- **Reuse note:** Course tasks derived from upstream projects require separate license and attribution review.

### E12 — SWE-bench grading implementation

- **URL:** https://github.com/SWE-bench/SWE-bench/blob/main/swebench/harness/grading.py
- **Source class:** B — executable evaluator implementation.
- **Publisher or maintainer:** SWE-bench maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Covered by the repository’s MIT License, subject to preserving the notice. The main-branch URL is mutable.
- **Evidence used:** Concrete grading logic suitable for showing how outcome categories and test results become benchmark scores.
- **How used in the brief:** Supports evaluator-audit exercises and the rule that graders must be protected, versioned, and inspected.
- **Limitations and cautions:** Behavior depends on the exact commit and surrounding harness. Pin a commit before analysis; do not present a main-branch code path as timeless.
- **Reproduction note:** Record the commit SHA, environment image, test patch, submitted patch, and raw logs.

### E13 — SWE-bench issue 538

- **URL:** https://github.com/SWE-bench/SWE-bench/issues/538
- **Source class:** E, supported by B — issue case describing evaluator path collision.
- **Publisher or maintainer:** User-authored report hosted in the SWE-bench repository; disposition by project maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Issue text and attachments are user-authored content and are not assumed to be licensed under the repository’s MIT License. Link and paraphrase only.
- **Evidence used:** A reported path collision allowed a submission patch to affect a path used by a test patch, illustrating a misleading benchmark result and evaluator attack surface.
- **How used in the brief:** Basis for a sanitized lab involving hidden tests, immutable grading assets, forbidden-path checks, and audit of surprising passes.
- **Limitations and cautions:** Closed issue; current exploitability may differ; do not imply the defect persists in current SWE-bench. The educational claim is the general control lesson.
- **Teaching phrasing:** Describe the documented case and verify the historical implementation if presenting technical details.

### E14 — SWE-agent trajectory documentation

- **URL:** https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/trajectories.md
- **Source class:** B — executable agent framework documentation.
- **Publisher or maintainer:** SWE-agent maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** SWE-agent declares MIT. License: https://github.com/SWE-agent/SWE-agent/blob/main/LICENSE. The documentation URL is mutable.
- **Evidence used:** Describes trajectory records including actions, observations, configuration, predictions, logs, and exit information.
- **How used in the brief:** Defines the minimum principle that agent runs are inspectable experiments whose stored configurations can support reruns without guaranteeing deterministic reproduction.
- **Limitations and cautions:** A trace records what the framework exposes; it may omit environmental state and does not make a model’s reasoning narrative causally faithful.
- **Reuse note:** Pin the documentation commit. Treat stored prompts, commands, paths, code, and outputs as potentially sensitive.

### E15 — SWE-agent trajectory inspector

- **URL:** https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/inspector.md
- **Source class:** B — trajectory inspection and visualization tooling.
- **Publisher or maintainer:** SWE-agent maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Covered by SWE-agent’s MIT License; retain notice for copied code or documentation excerpts.
- **Evidence used:** Shows how recorded `.traj` files can be visualized and navigated step by step for debugging and analysis.
- **How used in the brief:** Supports trace-review labs, failure analysis, and auditability.
- **Limitations and cautions:** The inspector does not replay a trajectory. A repeated run from stored configuration may diverge because model outputs, services, external dependencies, credentials, environment, or repository state changed; visualization is not independent outcome verification.
- **Privacy note:** Use course-owned synthetic or demo traces, not participant or public-user traces.

### E16 — SWE-agent command-line tutorial and cost controls

- **URL:** https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/cl_tutorial.md
- **Source class:** B — executable workflow and configuration documentation.
- **Publisher or maintainer:** SWE-agent maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Covered by SWE-agent’s MIT License. Pin the referenced commit.
- **Evidence used:** Documents command-line execution, configuration, output, and cost-related controls.
- **How used in the brief:** Supports explicit budgets, stopping conditions, run manifests, and cost-aware evaluation.
- **Limitations and cautions:** Product commands and configuration can change. Cost controls bound expenditure but do not establish correctness or safety.
- **Course-use note:** Recreate commands in a course-owned sandbox and label the tested version.

### E17 — Aider repository

- **URL:** https://github.com/Aider-AI/aider
- **Source class:** B — mature executable coding-agent implementation.
- **Publisher or maintainer:** Aider maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares Apache License 2.0. License: https://github.com/Aider-AI/aider/blob/main/LICENSE.txt.
- **Evidence used:** Integrates repository context, version control, linting, testing, and reversible edits.
- **How used in the brief:** Supports the pattern of context selection plus small inspectable diffs, checkpoints, executable feedback, and undo.
- **Limitations and cautions:** Implementation evidence from a tool maintainer is not an independent effectiveness comparison. Features and defaults change.
- **Reuse note:** Preserve Apache 2.0 notices and identify modifications. Product name and UI assets may have separate trademark or asset rights.

### E18 — Aider repository map

- **URL:** https://github.com/Aider-AI/aider/blob/main/aider/website/docs/repomap.md
- **Source class:** B — context-selection implementation documentation.
- **Publisher or maintainer:** Aider maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Covered as repository documentation under Apache 2.0 at observation; verify file history and asset-specific notices.
- **Evidence used:** Describes relevance-ranked repository mapping to expose important symbols and relationships within a limited context budget.
- **How used in the brief:** Supports repository comprehension and context engineering without indiscriminately loading the whole codebase.
- **Limitations and cautions:** A repository map is a lossy representation; omitted files or dynamic relationships may be decisive. It does not replace direct inspection.
- **Teaching use:** Reimplement the concept on a course demo repository rather than copying product screenshots.

### E19 — Aider benchmark documentation

- **URL:** https://github.com/Aider-AI/aider/blob/main/benchmark/README.md
- **Source class:** B — tool-maintainer benchmark definition.
- **Publisher or maintainer:** Aider maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository content is Apache 2.0, but benchmark exercises and dependencies may carry separate rights. Verify each component.
- **Evidence used:** Demonstrates an executable code-editing benchmark, repeatable runs, and model or configuration comparisons.
- **How used in the brief:** Helps teach benchmark design, configuration freezing, repeatability, and the limitations of narrow task suites.
- **Limitations and cautions:** Maintainer-authored evaluation; Exercism-style tasks are narrower than repository lifecycle work; scores are time-sensitive and not a universal ranking.
- **Teaching phrasing:** Use as a benchmark-construction example, not proof that one model or tool is globally best.

### E20 — Aider command and workflow documentation

- **URL:** https://github.com/Aider-AI/aider/blob/main/aider/website/docs/usage/commands.md
- **Source class:** B — workflow-control documentation.
- **Publisher or maintainer:** Aider maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Covered as repository documentation under Apache 2.0 at observation. Pin the commit.
- **Evidence used:** Documents commands for version-control interaction, undo, lint, test, and related feedback loops.
- **How used in the brief:** Supports reversible checkpoints and the integration of deterministic tools into the agent loop.
- **Limitations and cautions:** Commands and defaults can change; presence of a command is not evidence users apply it correctly.
- **UI note:** Do not reuse product screenshots without a separate asset-rights determination.

### E21 — OpenHands benchmarks

- **URL:** https://github.com/OpenHands/benchmarks
- **Source class:** B — benchmark implementations and configurations.
- **Publisher or maintainer:** OpenHands maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository displays an MIT License at observation. Verify individual benchmark datasets, upstream repositories, and container images separately.
- **Evidence used:** Shows pinned agent or SDK references, structured outputs, task setup, and benchmark-specific harnesses.
- **How used in the brief:** Supports reproducible evaluation, version pinning, and structured tool/error logs.
- **Limitations and cautions:** Multiple benchmark families have different validity and rights; infrastructure can drift; a pinned SDK alone does not freeze model service behavior.
- **Reproduction note:** Record image digests, SDK commit, model identifier, task data version, network policy, and evaluator commit.

### E22 — OpenHands security implementation notes

- **URL:** https://github.com/OpenHands/OpenHands/blob/main/openhands/security/README.md
- **Source class:** B/C — implementation and production security guidance.
- **Publisher or maintainer:** OpenHands maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** OpenHands declares MIT. License: https://github.com/OpenHands/OpenHands/blob/main/LICENSE.
- **Evidence used:** Describes confirmation, risk analysis, container or remote execution, and security-related action handling.
- **How used in the brief:** Supports layered controls before executing commands and the warning that risk analyzers are signals rather than guarantees.
- **Limitations and cautions:** At observation, a default risk analyzer involved model-based risk self-assessment. This is nondeterministic and potentially vulnerable to the same context that drives the action. Do not describe it as proof of safety.
- **Teaching use:** Pair any model judgment with deterministic policy, explicit approval, isolation, and logs.

### E23 — VS Code Copilot instructions

- **URL:** https://github.com/microsoft/vscode/blob/main/.github/copilot-instructions.md
- **Source class:** C — production repository instruction artifact.
- **Publisher or maintainer:** Microsoft VS Code maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** VS Code source is MIT. License: https://github.com/microsoft/vscode/blob/main/LICENSE.txt. Verify any linked assets or third-party components separately.
- **Evidence used:** Makes architecture, dependency layers, conventions, canonical build and test commands, and repository-specific checks explicit.
- **How used in the brief:** Exemplifies an agent-ready repository whose instructions point to real engineering structure and executable validation.
- **Limitations and cautions:** One large project’s production artifact; not a controlled test of instruction effectiveness; main-branch content changes.
- **Teaching use:** Paraphrase the structure and create course-specific instructions; do not copy large sections.

### E24 — VS Code Jupyter AI-Ready guidance

- **URL:** https://github.com/microsoft/vscode-jupyter/wiki/AI-Ready
- **Source class:** C/D — maintainer-authored operational guidance.
- **Publisher or maintainer:** Microsoft VS Code Jupyter maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** The associated repository is MIT, but the wiki page’s reuse status was not independently established for all prose and assets. Link and paraphrase. Do not reproduce images without separate permission.
- **Evidence used:** Recommends common scripts, targeted tests, path and architecture guidance, planning, and review of agent logs.
- **How used in the brief:** Supports the principle that making a repository agent-ready largely means making it legible, testable, and navigable for humans as well.
- **Limitations and cautions:** Normative maintainer experience, not causal evidence; wiki content is mutable.
- **Teaching use:** Translate recommendations into a repository-onboarding checklist and test it empirically.

## 4. Workflow security and authority separation

### E25 — GitHub Agentic Workflows repository

- **URL:** https://github.com/github/gh-aw
- **Source class:** B/C — executable workflow framework and maintained control patterns.
- **Publisher or maintainer:** GitHub.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT. License: https://github.com/github/gh-aw/blob/main/LICENSE.
- **Evidence used:** Implements agentic GitHub workflows with emphasis on controlled permissions, structured outputs, and integration with GitHub automation.
- **How used in the brief:** Anchors the design pattern in which analysis, proposed action, and authorized write are separated.
- **Limitations and cautions:** Framework implementation is not a security proof. Safe operation still depends on workflow configuration, GitHub permissions, branch protection, third-party actions, and human review.
- **Reuse note:** Preserve the MIT notice. GitHub names, marks, interface screenshots, and documentation assets may have separate terms.

### E26 — GitHub Agentic Workflows architecture

- **URL:** https://github.com/github/gh-aw/blob/main/docs/src/content/docs/introduction/architecture.mdx
- **Source class:** B/C — architecture documentation for a production-oriented framework.
- **Publisher or maintainer:** GitHub.
- **Observed:** 2026-08-23.
- **License and rights status:** Covered by the repository’s MIT License for repository content at observation; verify embedded assets separately.
- **Evidence used:** Describes a read-only agent, safe structured outputs, and a separate mechanism that performs writes.
- **How used in the brief:** Provides the course’s core control-plane pattern: separate reasoning authority from write or deploy authority.
- **Limitations and cautions:** Architecture descriptions can lag implementation; pin a commit and inspect workflow code before making exact claims.
- **Teaching use:** Build a simplified course-owned workflow with a JSON schema and separately scoped writer.

### E27 — GitHub Agentic Workflows security and implementation rules

- **URL:** https://github.com/github/gh-aw/blob/main/.github/aw/github-agentic-workflows.md
- **Source class:** C — production instruction and security-control artifact.
- **Publisher or maintainer:** GitHub.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT; preserve the notice for copied material. Main-branch content is mutable.
- **Evidence used:** Addresses read-only operation, safe outputs, egress control, sanitization of untrusted input, least-privilege tools, isolated threat detection, security scanning, secret scanning, and pinned dependencies.
- **How used in the brief:** Supplies concrete controls for the secure-CI lab and supply-chain checklist.
- **Limitations and cautions:** Sanitization reduces but cannot eliminate prompt injection. Model-based threat detection is not deterministic. Controls require correct deployment and do not replace protected branches or human authorization.
- **Teaching phrasing:** Say “the repository implements layered controls,” not “the workflow is immune to prompt injection.”

### E28 — Claude Code Action security documentation

- **URL:** https://github.com/anthropics/claude-code-action/blob/main/docs/security.md
- **Source class:** C — official security guidance for a GitHub action.
- **Publisher or maintainer:** Anthropic.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT. License: https://github.com/anthropics/claude-code-action/blob/main/LICENSE. Product UI, brand assets, issue text, and linked documentation are not assumed to be covered by that code license.
- **Evidence used:** Treats hidden Markdown, comments, and other repository inputs as prompt-injection vectors; recommends trusted or write-authorized triggers, explicit bot allowlists, short-lived tokens, avoiding personal access tokens, and minimal tools.
- **How used in the brief:** Supports the principle that every externally controlled text channel is untrusted and that trigger identity and token scope matter.
- **Limitations and cautions:** Sanitization is mitigation, not elimination; exact action behavior and GitHub permission defaults can change; verify the current release.
- **UI rule:** This source does not authorize copying Claude interface screenshots. Capture a course-owned real UI after separate rights and privacy review.

### E29 — OpenAI Codex Action

- **URL:** https://github.com/openai/codex-action
- **Source class:** B/C — executable official action and security-oriented implementation.
- **Publisher or maintainer:** OpenAI.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares Apache License 2.0. License: https://github.com/openai/codex-action/blob/main/LICENSE.
- **Evidence used:** Documents or implements reduced privilege, allowlists, output schemas, and platform-specific execution controls. At observation, supported sandboxing differed by runner platform, with an explicit limitation for Windows GitHub-hosted runners.
- **How used in the brief:** Supports platform-aware threat modeling, least privilege, schema validation, and the rule that permissions are part of task design.
- **Limitations and cautions:** Platform support and sandbox guarantees are time-sensitive. Verify the current README, release, and runner documentation before teaching exact behavior.
- **Reuse note:** Preserve Apache 2.0 notices. OpenAI marks and UI assets have separate rights.

### E30 — OpenAI Codex approval protocol documentation

- **URL:** https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md
- **Source class:** B/C — protocol and implementation documentation.
- **Publisher or maintainer:** OpenAI.
- **Observed:** 2026-08-23.
- **License and rights status:** Codex repository declares Apache License 2.0. License: https://github.com/openai/codex/blob/main/LICENSE.
- **Evidence used:** Approval interactions expose the proposed command, working directory, and reason or context to the approving user.
- **How used in the brief:** Defines a good command-approval lesson: the reviewer must see the exact action and scope rather than a vague request for permission.
- **Limitations and cautions:** Protocol and UI may change; an approval prompt is useful only if the command is intelligible and the environment enforces the approved scope.
- **UI rule:** A course figure must be a real authorized capture of the current product, labeled with date and version state; the repository license alone does not license UI screenshots.

### E31 — OpenAI Codex rollout-trace documentation

- **URL:** https://github.com/openai/codex/blob/main/codex-rs/rollout-trace/README.md
- **Source class:** B/C — trace implementation documentation.
- **Publisher or maintainer:** OpenAI.
- **Observed:** 2026-08-23.
- **License and rights status:** Covered by the Codex repository’s Apache License 2.0 for code and repository documentation. User trace contents retain separate sensitivity and rights.
- **Evidence used:** Describes local trace capture that can contain prompts, terminal activity, filesystem paths, tool activity, and other run context.
- **How used in the brief:** Supports auditability and the privacy rule that traces are sensitive records requiring minimization, access control, retention, and redaction.
- **Limitations and cautions:** Trace format and defaults can change. Trace completeness is not guaranteed, and more logging can increase privacy and secret-exposure risk.
- **Course-use note:** Use synthetic or course-owned traces and provide a deletion path.

### E32 — Entire CLI

- **URL:** https://github.com/entireio/cli
- **Source class:** B — executable session-provenance and checkpoint tool.
- **Publisher or maintainer:** Entire and project contributors.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository declares MIT. License: https://github.com/entireio/cli/blob/main/LICENSE.
- **Evidence used:** Links agent sessions and prompts to commits, separates checkpoints from ordinary code history, supports non-destructive rewind, and tracks worktree or concurrent activity.
- **How used in the brief:** Supports one-worktree-per-agent-task, provenance-linked commits, reversible experiments, and merge-after-review.
- **Limitations and cautions:** Tool behavior and integrations can change; provenance does not establish correctness. Stored prompts, code, paths, and session data may contain secrets, personal data, or confidential material.
- **Governance note:** Define consent, access, redaction, retention, export, and deletion before enabling session capture in a team.

## 5. Maintainer governance and delivery-system evidence

### E33 — curl contribution policy

- **URL:** https://github.com/curl/curl/blob/master/docs/CONTRIBUTE.md
- **Source class:** D — project contribution and governance policy.
- **Publisher or maintainer:** curl project maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** curl uses its own permissive curl license; GitHub license detection may show NOASSERTION for some paths. License reference: https://github.com/curl/curl/blob/master/COPYING. Link and paraphrase the policy; verify file-specific status before copying.
- **Evidence used:** Requires contributors to verify AI-found security reports and subjects contributions to ordinary documentation, test, and licensing expectations.
- **How used in the brief:** Shows that AI-assisted security findings still require human verification and normal contribution quality.
- **Limitations and cautions:** Normative policy for one project, not causal evidence or a universal open-source rule; master branch is mutable.
- **Teaching use:** Learners must inspect the target project’s current contribution policy rather than applying a generic disclosure template.

### E34 — Qiskit contribution policy

- **URL:** https://github.com/Qiskit/qiskit/blob/1977d1aa7d0a3a9212c07707929453a73788d8b0/CONTRIBUTING.md#use-of-generative-ai
- **Source class:** D — project contribution and governance policy.
- **Publisher or maintainer:** Qiskit maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** Qiskit source declares Apache License 2.0. License: https://github.com/Qiskit/qiskit/blob/main/LICENSE.txt. Contribution agreements and third-party content impose additional conditions.
- **Evidence used:** Requires disclosure of substantial generative-AI use, human-driven public repository interaction, contributor review, understanding and explanation, original authorship and CLA responsibility, and compliance with third-party licences and tool terms.
- **How used in the brief:** Supports disclosure, human understanding, original-authorship responsibility, and licence/tool-term review for a responsible pull request.
- **Limitations and cautions:** Project-specific and mutable; this record pins the revision current on the observation date. Verify the target branch’s current wording and CLA before contributing, and do not generalize its requirements to all repositories.
- **Teaching use:** Create a policy-reading exercise rather than copying the policy wholesale.

### E35 — pytest contribution policy

- **URL:** https://github.com/pytest-dev/pytest/blob/main/CONTRIBUTING.rst
- **Source class:** D — project contribution and governance policy.
- **Publisher or maintainer:** pytest maintainers.
- **Observed:** 2026-08-23.
- **License and rights status:** pytest declares MIT. License: https://github.com/pytest-dev/pytest/blob/main/LICENSE.
- **Evidence used:** Rejects unattended generated output and places responsibility on a human contributor to own and respond for the change.
- **How used in the brief:** Supports the rule that an agent is not the accountable maintainer and a human must understand and support the submission.
- **Limitations and cautions:** Normative policy for pytest; wording and enforcement can change; not evidence about general pull-request acceptance rates.
- **Teaching use:** Compare several project policies to show that disclosure and acceptance requirements vary.

### E36 — DORA website and research repository

- **URL:** https://github.com/dora-team/dora.dev
- **Source class:** B/C — maintained research website source and documentation.
- **Publisher or maintainer:** DORA team.
- **Observed:** 2026-08-23.
- **License and rights status:** Repository code is Apache License 2.0; documentation, media, and design content are identified as Creative Commons Attribution 4.0 in the repository’s licensing information. License: https://github.com/dora-team/dora.dev/blob/main/LICENSE.
- **Evidence used:** Provides source context for software-delivery research, measures, and the 2025 report.
- **How used in the brief:** Supports inclusion of delivery-system capabilities and outcome measures beyond code generation.
- **Limitations and cautions:** Website implementation is not itself the empirical study; individual linked reports and third-party assets may use different terms.
- **Reuse note:** Apply the correct license by asset type, give attribution, and record modifications.

### E37 — DORA 2025 report

- **URL:** https://dora.dev/research/2025/dora-report/
- **Source class:** A — research report and synthesis.
- **Publisher or maintainer:** DORA team.
- **Observed:** 2026-08-23.
- **License and rights status:** DORA website documentation, media, and design are identified as CC BY 4.0 through the repository license notice, but verify the report page and downloadable report for asset-specific terms before reuse.
- **Evidence used:** Frames AI as an amplifier of the surrounding delivery system and situates adoption within testing, version control, fast feedback, documentation, and deployment discipline.
- **How used in the brief:** Supports teaching that traditional software-delivery capabilities become more important as generation accelerates.
- **Limitations and cautions:** Organizational survey and synthesis evidence has construct, sampling, self-report, and causal-inference limitations. Do not convert broad associations into guarantees for one team.
- **Figure rule:** Prefer a course-created diagram based on paraphrased concepts; if reusing a report figure, supply full CC attribution and verify the exact asset license.

## 6. Low-evidence issue case studies

The following records are included only to seed sanitized failure-reproduction exercises. They do not support frequency claims, current-product claims, or a verified diagnosis unless corroborated by code, maintainers, and a reproducible environment.

### E38 — Claude Code issue 61519

- **URL:** https://github.com/anthropics/claude-code/issues/61519
- **Source class:** E — individual issue report.
- **Publisher or maintainer:** User-authored report hosted by Anthropic’s Claude Code repository.
- **Observed:** 2026-08-23.
- **License and rights status:** User-authored issue text and attachments are not assumed to be covered by the repository’s source-code license. Link and paraphrase only. Do not copy screenshots or personal details.
- **Evidence used:** A user reported a destructive shell-command scenario involving an unsafe removal target; the issue was closed as a duplicate.
- **How used in the brief:** Optional inspiration for a sanitized command-approval lab that requires exact target resolution, quoting, bounded permissions, and recoverability.
- **Limitations and cautions:** Single report; duplicate closure; environment and root cause not independently reproduced in this review; current behavior unknown.
- **Course-use rule:** Recreate the general hazard in a disposable course directory. Never execute a destructive command against a home directory or broad path.

### E39 — Claude Code issue 14081

- **URL:** https://github.com/anthropics/claude-code/issues/14081
- **Source class:** E — individual issue report.
- **Publisher or maintainer:** User-authored report hosted by Anthropic’s Claude Code repository.
- **Observed:** 2026-08-23.
- **License and rights status:** Issue prose, attachments, and screenshots are user-authored and have no verified downstream reuse license here. Link and paraphrase only.
- **Evidence used:** Illustrates a reported mismatch between expected safety or authorization behavior and an observed agent action.
- **How used in the brief:** Optional case for asking students to separate user intent, model proposal, client enforcement, shell semantics, and operating-system consequences.
- **Limitations and cautions:** A report is not proof of prevalence or current behavior; details may be incomplete, misdiagnosed, duplicated, or fixed.
- **Course-use rule:** Do not reproduce the reporter’s screenshot. Build an equivalent synthetic scenario with harmless commands and course-owned data.

### E40 — OpenAI Codex issue 8759

- **URL:** https://github.com/openai/codex/issues/8759
- **Source class:** E — individual issue report.
- **Publisher or maintainer:** User-authored report hosted by OpenAI’s Codex repository.
- **Observed:** 2026-08-23.
- **License and rights status:** Issue prose and attachments are user-authored and are not assumed to inherit the Codex repository’s Apache 2.0 license. Link and paraphrase only.
- **Evidence used:** Illustrates a reported agent or client failure mode relevant to approval, execution, or state interpretation.
- **How used in the brief:** Optional prompt for a lab that verifies actual repository and process state instead of trusting a completion narrative.
- **Limitations and cautions:** Single report; no prevalence estimate; current status and root cause must be verified before teaching product-specific behavior.
- **Course-use rule:** Reproduce only the abstract control failure in a demo repository and identify it as a constructed case.

## 7. Source-family synthesis and permitted claims

| Evidence family | Permitted teaching claim | Prohibited inference |
|---|---|---|
| E01 | A randomized field study found slower completion in its specific early-2025, experienced-maintainer setting | Agents universally make developers slower |
| E02–E06 | Real-world observational data show correction, partial artifact retention, rejection, and documentation associations worth measuring | A causal productivity effect or universal rejection cause |
| E07–E10 | Agent actions, dependencies, and context files have measurable security and workflow effects in bounded studies | Exact rates or null effects apply to all tools and repositories |
| E11–E13 | Evaluators require isolation, versioning, hidden checks, and adversarial audit | A current benchmark is necessarily exploitable or invalid |
| E14–E22 | Traces, maps, checkpoints, tests, budgets, and analyzers are implementable controls | The presence of a control guarantees correct use or safety |
| E23–E32 | Mature repositories implement explicit instructions, least privilege, authority separation, approvals, and provenance | Any named framework is secure by default |
| E33–E35 | Maintainers can require disclosure, understanding, testing, licensing, and human ownership | One project’s AI policy applies to every open-source project |
| E36–E37 | AI adoption should be evaluated within the broader delivery system | DORA evidence supplies a causal forecast for one organization |
| E38–E40 | A reported failure can motivate a sanitized defensive lab | The issue proves frequency, root cause, or current product behavior |

## 8. UI-image and asset-rights provenance protocol

No source in this ledger is treated as permission to copy a Claude or OpenAI interface. Course 8’s required real Claude UI figures need a separate figure record for each asset.

### 8.1 Release-ledger and capture-audit fields

For every released figure, the machine-readable ledger records:

- figure ID and final filename;
- instructional objective;
- product and surface;
- capture date and verification date;
- crop, redaction, annotation, scaling, and compression steps;
- identities, paths, secrets, code, and metadata checked;
- copyright or permission basis;
- logo and trademark treatment;
- caption;
- alt text;
- privacy-review state;
- responsive derivative dimensions and cryptographic hashes;
- source and licence links; and
- for repository assets, an immutable upstream URL and full commit.

For a course-authored interface capture, the companion capture audit should additionally record the account authorization basis, demo or synthetic-data boundary, operating system, client version/model/build when exposed, protected-original location and access class, relevant product/brand-policy URL and observation date, reviewer and approval date, refresh trigger, and retirement state. When evidence was not captured or a field does not apply, record that explicitly rather than infer it.

### 8.2 Rights interpretation

- **Course-owned screenshot:** The course team created the capture using an authorized account and controlled data. This resolves some privacy and source-rights issues but does not waive product terms, trademark rules, or rights in third-party content visible on screen.
- **Official product asset:** Reuse only under explicit official asset terms or written permission. Record the exact policy or permission.
- **Repository image:** Check whether the repository license covers that image and whether it contains third-party UI, logos, code, or data.
- **Paper figure:** Apply the paper’s exact license and attribution requirements. A code-repository license does not license the paper.
- **Issue attachment:** Treat as user-authored with unclear reuse rights unless explicit permission exists.
- **Generated or reconstructed UI:** Label as a conceptual mock-up. Never present it as a real Claude capture.

### 8.3 Privacy and accessibility controls

- Use a course-controlled demonstration account and repository.
- Do not capture participant or public-user sessions.
- Remove names, email addresses, avatars, private URLs, private code, paths, tokens, cookies, terminal history, billing, and account data.
- Flatten and inspect redaction at original resolution; remove metadata and hidden layers.
- Provide descriptive alt text and, for recordings, a transcript and keyboard-accessible equivalent.
- Retain originals only as long as the documented audit purpose requires.

## 9. Known gaps and required follow-up

1. **Academy refresh:** The released machine-readable source ledger in `lib/software-engineering/sources.ts` records the exact OpenAI Academy and Claude Academy resources used, publisher, access date, reuse boundary, evidence use, and caveat as of 2026-08-23. It does not audit every Academy lesson. Re-open those exact official pages before each major release because product mechanics and URLs are high-drift facts.
2. **Product interfaces:** The two released Claude Desktop captures passed the declared capture, privacy, accessibility, and rights checks for the interface observed on 2026-08-23. The release artifacts do not retain the operating system, client version/model/build, protected-original location/access class, a public Anthropic brand-policy URL, or an individually named reviewer; those values must not be inferred. Record them explicitly when future captures are made. Recheck labels, permissions, availability, and caption accuracy before each major release. The current images must not be relabeled as Claude Code screens.
3. **Mutable repository links:** Every copied Course 8 repository asset is pinned to a full commit in the figure ledger. Link-only documentation and evidence citations may retain a canonical current URL when the course is explicitly teaching current guidance; record the access date and re-verify it. Pin or hash any repository content used for byte-level reproduction, quotation, or computation.
4. **Dataset snapshots:** Record hashes or immutable revisions before computing from SWE-chat, AIDev-derived analyses, or another downloadable dataset. Course 8 currently links and cautiously paraphrases these studies; it does not claim to have rerun their datasets.
5. **Paper figures:** Verify article-level licenses before reuse; otherwise link or redraw from permitted data with attribution.
6. **Security findings:** Re-run or inspect current code before stating that a historical issue is unresolved.
7. **Legal review:** Copyright, trademark, privacy, terms-of-use, and contributor-license questions with material publication risk require qualified review.

## 10. Audit completion checklist

- [x] Every source used by the brief has a stable evidence ID.
- [x] Every record contains a URL, source class, publisher or maintainer, observation date, rights status, use, and limitations.
- [x] Empirical findings are paired with study-specific boundaries.
- [x] Tool documentation is not presented as independent proof of effectiveness.
- [x] Maintainer policies are identified as normative and project-specific.
- [x] Individual issues are segregated as low-evidence case studies.
- [x] Repository licenses are not extended to papers, datasets, issue text, or UI assets without verification.
- [x] UI screenshots require a separate per-figure provenance record.
- [x] No long copyrighted quotation is reproduced.
- [x] Every copied Course 8 repository image is pinned to an exact commit; canonical link-only sources carry access dates and explicit refresh boundaries.
- [x] The official Claude Academy and OpenAI Academy sources used by the released course are complete in the machine-readable source ledger for the 2026-08-23 snapshot.
- [x] Both real Claude UI captures passed the currently declared product-surface, privacy, accessibility, and editorial-rights checks recorded in the Course 8 figure ledger, rights report, public notice, and companion media audit; unavailable supplemental capture metadata is explicitly bounded in section 9.
- [ ] Before each future major release, re-open the official product sources and re-verify every dated real UI figure.
- [ ] Before any future dataset computation, pin and hash the exact downloadable dataset snapshot.
