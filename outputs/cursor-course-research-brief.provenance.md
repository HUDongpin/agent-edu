# Provenance record: Course 4, How to Use Cursor

Snapshot date: 23 August 2026  
Verification timezone: Asia/Taipei  
Evidence policy: Cursor-owned sources establish product behaviour; revision-pinned GitHub sources support practitioner patterns only  
Runtime policy: the published course uses only local, course-original SVG figures and does not fetch remote media; any future third-party capture is independently rights-gated

## Claim and reuse rules

- `paraphrased`: facts or workflow guidance are restated without copying substantial source expression.
- `asset-reused`: a first-party Cursor visual is locally transformed for educational commentary, with attribution, a source link, a digest, and a freshness label.
- `link-only`: a repository or versioned course artifact is linked and analysed without copying third-party code, screenshots, prose, or media into the course.
- A recorded open-source licence applies only to covered repository content and does not automatically cover linked media, brands, private data, or third-party dependencies.
- No source is used to claim a causal productivity, correctness, research-quality, writing-quality, or learning gain.

## Cursor-owned authority ledger

All sources in this section were accessed and verified on 23 August 2026. The
machine ledger records that honest date precision; it does not invent a shared
midnight verification timestamp.

| Source ID | Page | Claims supported | Reuse |
| --- | --- | --- | --- |
| `cursor-quickstart` | [Quickstart](https://cursor.com/docs/get-started/quickstart) | Open Agent, begin with a bounded task, review changes, run checks, use planning for larger work | Paraphrased |
| `cursor-download` | [Cursor Download](https://cursor.com/download) | Desktop platforms and Desktop 3.17 marked Latest in the 23 August 2026 snapshot | Paraphrased; current version must be rechecked before release |
| `cursor-cli` | [Cursor CLI](https://cursor.com/docs/cli/overview) | Separate terminal surface, interactive and print operation, modes, sandbox controls | Paraphrased; executable course practice is explicitly scoped to Cursor Desktop 3.17 |
| `cursor-data-use` | [Data Use & Privacy Overview](https://cursor.com/data-use) | Privacy Mode, server processing, indexing metadata, abuse-investigation retention exception, designated or administrator-enabled non-ZDR models | Paraphrased; page updated 15 July 2026 |
| `cursor-tab` | [Cursor Tab](https://cursor.com/tab) | Next-action prediction, multiline suggestions, selective acceptance | Paraphrased plus one first-party visual |
| `cursor-inline-edit` | [Inline Edit](https://cursor.com/help/ai-features/inline-edit), with [Rules FAQ](https://cursor.com/docs/rules#faq) | Selection-bounded editing, platform shortcut, and categorical exclusion of User Rules from Inline Edit | Paraphrased |
| `cursor-agent-overview` | [Agent overview](https://cursor.com/docs/agent/overview) | Agent tools, clarification, checkpoints | Paraphrased; checkpoint section used to distinguish checkpoints from Git |
| `cursor-agent-security` | [Agent Security](https://cursor.com/docs/agent/security) | Immediate workspace edits, terminal approval default, and auto-reload risk | Paraphrased; file mutation and command approval are separate boundaries |
| `cursor-agents-window` | [Agents Window](https://cursor.com/docs/agent/agents-window) | Agent-first workspace, editor coexistence, local worktree, cloud and SSH surfaces | Paraphrased plus two first-party visuals |
| `cursor-prompting` | [Prompting agents](https://cursor.com/docs/agent/prompting) | Selective context, mentions, context inspection, Agent search | Paraphrased |
| `cursor-planning` | [Plan Mode documentation](https://cursor.com/docs/agent/plan-mode) | Repository research, clarifying questions, editable plans, approval before build | Paraphrased |
| `cursor-shell` | [Terminal tool](https://cursor.com/docs/agent/tools/terminal) | Integrated terminal, command review, terminal output as evidence | Paraphrased |
| `cursor-run-modes` | [Run Modes](https://cursor.com/docs/agent/security/run-modes) | Auto-review, Allowlist, Run Everything, limits of approval classifiers | Paraphrased |
| `cursor-security-hardening` | [Security and Privacy Hardening, agent runtime controls](https://cursor.com/docs/enterprise/security-hardening#agent-runtime-and-deterministic-controls) | `.cursorignore` limits, sandboxing, approvals, file permissions, MCP boundary | Paraphrased; defence-in-depth guidance, not a guarantee |
| `cursor-agent-review` | [Agent Review](https://cursor.com/docs/agent/agent-review) | Local Quick and Deep review, `/agent-review`, human triage | Paraphrased |
| `cursor-debugging` | [Debug Mode](https://cursor.com/docs/agent/debug-mode) | Reproduction, hypotheses, instrumentation, root cause | Paraphrased |
| `cursor-rules` | [Rule file structure](https://cursor.com/docs/rules#rule-file-structure), [Rule anatomy](https://cursor.com/docs/rules#rule-anatomy), and [Rules FAQ](https://cursor.com/docs/rules#faq) | `.cursor/rules/*.mdc`, ignored plain `.md`, `AGENTS.md`, activation, scope, and User Rules exclusion from Inline Edit | Paraphrased plus one first-party visual |
| `cursor-skills` | [Skills](https://cursor.com/docs/skills) | Agent Skills standard, Cursor and agents skill directories, manual invocation | Paraphrased |
| `cursor-plugins` | [Plugins](https://cursor.com/docs/plugins) | Bundled Rules, Skills, agents, Commands, MCP servers, Hooks, and installation scope | Paraphrased; installation is treated as a supply-chain change |
| `cursor-subagents` | [Subagents, isolated project copies](https://cursor.com/docs/subagents#isolated-project-copies) | Separate context windows, shared-checkout default, readonly local mutation, inherited tools, isolated project copies | Paraphrased; context isolation is not file isolation, and readonly is not an external-system boundary |
| `cursor-hooks` | [Hooks](https://cursor.com/docs/hooks) | Command-based denial, model-evaluated prompt Hooks, fail-open default, `failClosed`, and Cloud limitations | Paraphrased; only command-based pre-action decisions are described as deterministic |
| `cursor-mcp` | [Model Context Protocol](https://cursor.com/docs/mcp) | External tools and systems, MCP trust boundary | Paraphrased |
| `cursor-worktrees` | [Worktrees](https://cursor.com/docs/configuration/worktrees) | Isolated Git checkouts, Agents Window workflow, and Worktree Skill | Paraphrased; combined-state review remains required |
| `cursor-cloud-agents` | [Cloud Agents](https://cursor.com/docs/cloud-agent) | Isolated virtual machines, parallel work, branches, cloud security surface | Paraphrased |
| `cursor-cloud-builds` | [Cloud Agent Builds](https://cursor.com/docs/cloud-agent/builds#manage-builds) | Build type, status, start time, logs, commits, environment history, and exact Build used by a run | Paraphrased |
| `cursor-cloud-best-practices` | [Cloud Agent best practices](https://cursor.com/docs/cloud-agent/best-practices) | Environment preparation, local testability, rules and Skills, credential minimisation | Paraphrased |
| `cursor-automations` | [Cloud Agent automations](https://cursor.com/docs/cloud-agent/automations) | PR-creation defaults, persistent memory, computer use, external tools, identity, and review destinations | Paraphrased; synthetic dry run and least privilege required |
| `cursor-google-workspace` | [Google Workspace Plugins](https://cursor.com/changelog/google-workspace-plugins) | Drive, Gmail, and Calendar plugin announcement | Paraphrased; dated 3 August 2026 and not required by the core office exercise |
| `cursor-browser` | [Browser automated testing](https://cursor.com/docs/agent/tools/browser#automated-testing), with [Origin Allowlist](https://cursor.com/docs/agent/tools/browser#origin-allowlist) | Browser inspection, persistent per-workspace browser state, and optional best-effort enterprise Origin Allowlist | Paraphrased plus one first-party visual |
| `cursor-students` | [Cursor for Students](https://cursor.com/students) | Official education context | Paraphrased; no learning-effect claim |
| `cursor-plan-mode-blog` | [Plan Mode blog](https://cursor.com/blog/plan-mode) | Historical rollout, editable plans, Build transition | Paraphrased plus one historical, date-labelled visual; published 7 October 2025 |
| `cursor-changelog-2026-08` | [Custom Modes, VM subagents, subscriptions, and `/goal`](https://cursor.com/changelog/08-19-26) | Custom Modes, VM subagents, goal command, rolling release context | Paraphrased plus dated first-party media; published 19 August 2026 |
| `cursor-side-chat` | [Side Chat](https://cursor.com/changelog/side-chat) | Read-focused tangent and reference back to the primary conversation | Paraphrased plus dated first-party media |
| `cursor-product` | [Cursor product](https://cursor.com/product) | Agent-first editor and high-level surface map | Paraphrased; volatile marketing metrics excluded |
| `cursor-learn-understand` | [Understanding your codebase](https://cursor.com/learn/understanding-your-codebase) | Read and search before writing | Paraphrased plus one historical first-party lesson frame |
| `cursor-learn-features` | [Creating features](https://cursor.com/learn/creating-features) | Feature contract, planning, bounded implementation | Paraphrased plus one historical first-party lesson frame |
| `cursor-learn-debug` | [Finding and fixing bugs](https://cursor.com/learn/finding-fixing-bugs) | Reproduce-first debugging and regression checking | Paraphrased |
| `cursor-learn-review` | [Reviewing and testing code](https://cursor.com/learn/reviewing-testing) | Diff review, testing, feedback loop | Paraphrased |

## Course-owned assessment contract

| Source ID | Exact artifact | Claims supported | Boundary |
| --- | --- | --- | --- |
| `course-capstone-fixture` | [Public verifier contract](https://aicourse.top/courses/cursor/CAPSTONE_CONTRACT.md), [version 1 fixture ZIP](https://aicourse.top/courses/cursor/aicourse-cursor-demo-v1.zip), and [published SHA-256](https://aicourse.top/courses/cursor/aicourse-cursor-demo-v1.sha256) | Receipt schema, fixture manifest hash, six declared check fields, stale-receipt removal, and local verifier behaviour | Course contract only; not Cursor product evidence, an execution attestation, or identity proof |

## Revision-pinned practitioner ledger

All repositories were inspected on 23 August 2026. These records support patterns only.

| Source ID | Exact evidence | Licence and reuse boundary | Course use |
| --- | --- | --- | --- |
| `github-domain-agent` | [`alexmihalache/cursor_domain_agent`, commit `9add613d301e0f3ba980174a2c39b37291802d0c`](https://github.com/alexmihalache/cursor_domain_agent/blob/9add613d301e0f3ba980174a2c39b37291802d0c/documentation/ARTICLE_v2.md#L68-L166) | MIT; repository includes educational/research and no-financial-advice disclaimers; link-only | Artifact-first research, sanity and leakage gates, run metadata, negative results |
| `github-product-managers` | [`jinjin1/Cursor-for-Product-Managers`, commit `21a835d4a2736210f304df59633944e22c1eee31`](https://github.com/jinjin1/Cursor-for-Product-Managers/blob/21a835d4a2736210f304df59633944e22c1eee31/README.md#L33-L75) | Apache-2.0; link-only | Separate interview evidence, synthesis, PRD, and reusable workflow instructions |
| `github-strapi-docs` | [`strapi/documentation` AGENTS.md, commit `ede5b50b7a9ca89b5ccb49ca6d28c7d3985554f3`](https://github.com/strapi/documentation/blob/ede5b50b7a9ca89b5ccb49ca6d28c7d3985554f3/AGENTS.md#L85-L155) | MIT for covered repository content, with possible exceptions; link-only | Evidence review, outline, draft, style, integrity, and publication gates |
| `github-metamask-design` | [`MetaMask/metamask-design-system` rule, commit `e98ccb94827bf9370fd80d505a0be1d9b3c734f9`](https://github.com/MetaMask/metamask-design-system/blob/e98ccb94827bf9370fd80d505a0be1d9b3c734f9/.cursor/rules/pr.mdc#L9-L49) | No repository licence detected; citation-only; linked video excluded | Historical diff, template, draft pull-request, and side-effect review pattern; stale rule semantics are not taught |
| `github-alibaba-hooks` | [`alibaba/hooks` rule, commit `2b3a0afd67c9e92fa4542b485a711cd113668942`](https://github.com/alibaba/hooks/blob/2b3a0afd67c9e92fa4542b485a711cd113668942/.cursor/rules/git.mdc#L1-L15) | MIT; link-only | Branch, review, CI, tests, documentation, and team-policy gates |
| `github-tutor` | [`kevinnio/tutor`, commit `88ffe9ac5e3e41962393f8eb14b080a6c039ed40`](https://github.com/kevinnio/tutor/blob/88ffe9ac5e3e41962393f8eb14b080a6c039ed40/README.md#L5-L26) | MIT; link-only | Productive struggle, one learner action per turn, read-only verification, third-party Skill inspection |
| `github-cursor-workshop` | [`dotdc/cursor-workshop`, commit `ad5504f734016e54a5603946c75edbfc4d993ad4`](https://github.com/dotdc/cursor-workshop/blob/ad5504f734016e54a5603946c75edbfc4d993ad4/typescript-workshop/README.md#L33-L84) | MIT for the main repository; separately hosted media excluded; link-only | Small observable quests with tests and documentation evidence |
| `github-plaintext-crm` | [`anthroos/plaintext-crm`, commit `eaf2fb30af68e7a08c9b29c041e6edf50bacd837`](https://github.com/anthroos/plaintext-crm/blob/eaf2fb30af68e7a08c9b29c041e6edf50bacd837/README.md#L34-L70) | MIT; link-only | Plain-text office artifacts, schema validation, and versioning; the course's synthetic-data safety rule is not attributed to this repository |
| `github-spec-kit` | [`github/spec-kit`, commit `27f50f7e6b618ea14d74dd4037f9e7c60218b16c`](https://github.com/github/spec-kit/blob/27f50f7e6b618ea14d74dd4037f9e7c60218b16c/spec-driven.md) | MIT; link-only | Specify, clarify, plan, task, implement phase separation; cross-tool corroboration only |
| `github-superpowers` | [`obra/superpowers`, commit `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`](https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/systematic-debugging/SKILL.md) | MIT; link-only | Root-cause-first debugging, red-green checks, fresh verification; cross-tool corroboration only |
| `github-agents-md` | [`agentsmd/agents.md`, commit `d1ac7f063d20e70015ed6732664049ae4ba9d74e`](https://github.com/agentsmd/agents.md/blob/d1ac7f063d20e70015ed6732664049ae4ba9d74e/README.md) | MIT; link-only | Readable nested repository context; Cursor documentation governs Cursor activation semantics |

## Superseded third-party capture acquisition record

The table below records the 23 August 2026 internal acquisition audit only. It is retained as historical research provenance and does not describe the current runtime or authorize republication. On 26 August 2026, all fourteen screenshot masters and all twenty-eight responsive derivatives were removed from the current course after every lesson, locale, renderer, test, checker, and ledger reference moved to course-original SVGs. Git history remains the recovery mechanism for an internal audit.

The current publication artifacts are `fig-01-concept.svg` through `fig-14-concept.svg`. They are repository-native abstract diagrams authored from simple geometry, contain no third-party pixels or copied product layout, and are covered by the repository MIT licence. Exact authorship and methods are recorded in `public/courses/cursor/figure-provenance.json`; the publication decision and fail-closed future-capture policy are in `figure-rights.json`; byte integrity is in `figures.sha256`.

Every asset in the historical table was captured or derived on 23 August 2026. At that time, `master` named the locally stored PNG used for digest verification, and the 1600 and 960 pixel WebP files were delivery derivatives. None of those binaries is retained in the current publication package.

The former captures remained `rights-review-required`; no permission or other evidence-bearing republication basis was inferred from public hosting, attribution, or commentary. That fail-closed decision is why they were replaced rather than relabelled as cleared. The current course-original SVGs have a separate `original-authorship-reviewed` status and exact MIT rights record.

Historical privacy note: the acquired captures exposed no secrets or learner-supplied private content, but several retained public-demo identifiers. The current abstract SVGs contain no person, account, repository, path, credential, learner data, logo, avatar, screenshot, external font, remote asset, script, or `foreignObject`.

| Figure | Lesson | Official source page and media | Freshness | Master SHA-256 |
| --- | --- | --- | --- | --- |
| `fig-01` | Orient and protect data | [Agents Window](https://cursor.com/docs/agent/agents-window); [official image](https://cursor.com/docs-static/images/agent/open-agents-window-final.png) | Current documentation; accessed while Desktop 3.17 was latest | `57dc0260a1b60348d50814b253d3b55c6aa39428e8db6441af9c30820e42a013` |
| `fig-02` | Tab and Inline Edit | [Cursor Tab](https://cursor.com/tab); [official product image](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/features/tab-og-image-2.png) | Current product visual | `360a586c0c7562cb75df243a984a5f2190fe18792c2a0658799508a9015b8d93` |
| `fig-03` | Agent interface | [Agents Window](https://cursor.com/docs/agent/agents-window); [official image](https://cursor.com/docs-static/images/agent/file-agents-window-final.png) | Current documentation; accessed while Desktop 3.17 was latest | `6c0404d33c7f9035b8b186bffaa30da7120e2b71cd85a98c2fd08dcad8fcdd47` |
| `fig-04` | Task contracts | [19 August 2026 changelog](https://cursor.com/changelog/08-19-26); official `/goal` video frame recorded in the machine ledger | Dated-current, published 19 August 2026 | `f780f81227626bded06b552a1fac58d4940c4fdfd08384d0e807458ad15c004f` |
| `fig-05` | Plan, execute, and steer | [Plan Mode blog](https://cursor.com/blog/plan-mode); [official image](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/blog/plan-mode-0.png) | Historical interface, published 7 October 2025 | `e6d6b599ad5fc2d173bb855633fb983150b15ea62adf7a9b639e1db198329701` |
| `fig-06` | Test, review, and recover | [Cursor 3.0 changelog](https://cursor.com/changelog/3-0); [official agent-tabs media](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/agent-tabs) | Dated-current, Cursor 3.0, published 2 April 2026 | `458fccd51d59de6b52201efc01d3cd5d148cff48021fa006ae60c5ab1ca843c6` |
| `fig-07` | Rules, Skills, and MCP | [Rules](https://cursor.com/docs/rules); [official image](https://cursor.com/docs-static/images/context/rules/team-rules-1.png) | Current documentation | `16d0af902c226199ca2ad805633a4390a6d465488b7f947d928e947c1cf6d77e` |
| `fig-08` | Cloud and parallel work | [Cloud in Agents Window](https://cursor.com/changelog/cloud-in-agents-window); [official image](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/handoff-to-cloud.png) | Dated-current, Cursor 3.7, published 17 June 2026 | `e0856bda345d77bcef18d7643b0e680cb36b043c7f4127bccb9aa1739b6b2849` |
| `fig-09` | Software studio | [Browser tool, Origin Allowlist](https://cursor.com/docs/agent/tools/browser#origin-allowlist); [official image](https://cursor.com/docs-static/images/agent/browser-origin-allowlist.png) | Current optional enterprise-admin control; best-effort limitation taught in caption | `5d62e6a79cc1e735a95261d4890a4ed8812af20135f4c02f55cbd2069c490832` |
| `fig-10` | Research studio | [Understanding your codebase](https://cursor.com/learn/understanding-your-codebase); official Cursor Learn video frame recorded in the machine ledger | Historical interface | `cb48af304ab84d255535ec2dc13fab6ce39266a3eea87c9f40f6b7ae4d309cfd` |
| `fig-11` | Writing studio | [Creating features](https://cursor.com/learn/creating-features); official Cursor Learn video frame recorded in the machine ledger | Historical interface | `9eb3c0433416b0e338f1e130313ee29840db63b32d2ce9be3b2d22d7dbbb8e07` |
| `fig-12` | Office studio | [19 August 2026 changelog](https://cursor.com/changelog/08-19-26); official sticky-Skills video frame recorded in the machine ledger | Dated-current, 3.17-era UI | `04da725ef2d7ab5aa7b90e001b32e6f77fcc79495b60f82e909400933b4505e9` |
| `fig-13` | Teaching studio | [Side Chat changelog](https://cursor.com/changelog/side-chat); [official image](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/redesigned-picker.png) | Dated-current, Cursor 3.11, published 10 July 2026 | `2c8434e62417623149f0f6e3906ae625898f29bfb90621839a003dd7cae3449c` |
| `fig-14` | Workflow capstone | [13 August 2026 changelog](https://cursor.com/changelog/08-13-26); [official image](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/debug-builds-ERbRas4foKC6DFp3sTW0LSRfoFcxjG.png) | Dated-current, Cloud Builds | `2af5302873a7e429259a755c130ee9008d00b8f6a56b40cdbd03de15b91f28fe` |

The MP4-derived masters are reproducible at exactly 2.0 seconds. `fig-04` uses source-video SHA-256 `72c567f74492b46e2311af7cd334ad5f3c218ee53794c772e8d8d28787646c3f`; `fig-12` uses `0b8cbb230d10dd93a48fe7548156f54ae6f4a42b0ea24ffa4dd15bd5d0643962`. At those timestamps, decoded frames compare pixel-for-pixel with the stored PNG masters.

## Reproducibility and audit pointers

| Artifact | Role |
| --- | --- |
| `lib/cursor/sources.ts` | Typed claim, anchor, revision, licence, and reuse ledger |
| `lib/cursor/figures.ts` | Typed asset path, official origin, digest, freshness, privacy, and copyright ledger |
| `public/courses/cursor/THIRD_PARTY_NOTICES.md` | Public notice excluding Cursor-owned media derivatives from the repository MIT licence and linking every first-party source page |
| `lib/cursor/manifest.ts` | Lesson-to-source and lesson-to-figure mapping |
| `scripts/check-cursor-course.mjs` | Release gate for structure, evidence, terminology, localisation, figures, capstone, routes, and namespace isolation |
| `scripts/build-cursor-demo-archive.mjs` | Deterministic capstone archive and checksum builder |
| `public/courses/cursor/aicourse-cursor-demo-v1.sha256` | Published archive integrity digest |
| `public/courses/cursor/CAPSTONE_CONTRACT.md` | Public, inspectable receipt schema and non-attestation boundary |

## Known evidence boundaries

- Cursor is a fast-moving product. This record confirms the 23 August 2026 snapshot, not future behaviour.
- Pages without an explicit publication date are recorded as current only at the verification date.
- A first-party screenshot can accurately show an older interface. Historical figures are never used to establish current labels.
- GitHub files can demonstrate that a workflow was written or adopted; they cannot prove that the workflow caused a desired outcome.
- A licence record is not legal advice and does not supersede the source repository's current licence or third-party notices.
- The local capstone receipt is an unsigned structural self-check. It records declared results but does not prove that commands ran, attest identity, or replace review of the evidence packet.
- No credentials, personal records, private repositories, or real learner data were collected for the course or its figures.
