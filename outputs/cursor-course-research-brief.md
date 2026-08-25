# Course 4 research brief: How to Use Cursor

Research snapshot: 23 August 2026  
Course version: 1.0.0  
Primary authority: Cursor-owned documentation, help, product, Learn, blog, and changelog pages  
Corroborating evidence: revision-pinned public GitHub repositories  
Intended course duration: 800 minutes across 14 lessons, followed by a final quiz and capstone verification

## Executive judgement

The course should teach Cursor as a supervised work system, not as a prompt box. The durable learning loop is:

1. inspect the workspace and decide what data may enter the workflow;
2. define a bounded task with evidence and acceptance checks;
3. choose the smallest suitable surface, from Tab or Inline Edit to Agent, Plan Mode, or Cloud Agents;
4. inspect proposed actions and execution boundaries;
5. test, review the diff, and recover from errors;
6. preserve a verifiable handoff.

This framing is supported by Cursor's current quickstart, Agent, planning, review, terminal, security, rules, Skills, MCP, Browser, and Cloud Agent documentation. GitHub examples add inspectable workflow patterns across software engineering, research, writing, office work, and teaching. They are not treated as proof that Cursor improves correctness, productivity, learning, or research validity.

## Research method

The research followed a source hierarchy and a claim gate.

- Product behaviour and terminology require a current Cursor-owned source.
- Dated Cursor pages may support history or a still-valid interaction principle only when the course labels the date and interface freshness.
- GitHub evidence must be inspectable at a fixed commit or a clearly dated snapshot, with its licence or citation-only boundary recorded.
- Practitioner repositories support patterns only. They cannot establish a product guarantee, a causal outcome, or Cursor endorsement.
- Volatile model names, quotas, prices, speed claims, and benchmark numbers are excluded from assessed learning.
- Every figure is tied to an official source page, a local master, two responsive derivatives, a SHA-256 digest, a freshness classification, and a privacy review.

The machine-readable evidence ledger is implemented in `lib/cursor/sources.ts`; the figure ledger is implemented in `lib/cursor/figures.ts`. The detailed human-readable provenance record is in `outputs/cursor-course-research-brief.provenance.md`.

## Current product model

The verified product vocabulary for this snapshot is:

| Need | Current Cursor surface | Course treatment |
| --- | --- | --- |
| Predict the next small edit | Tab | Accept selectively; inspect multi-line and cross-file suggestions before proceeding. |
| Transform a selected region | Inline Edit | Keep the selection narrow; verify that the result preserves surrounding behaviour. |
| Explore, edit, run tools, and clarify | Agent | Provide known context, let Agent search unknown context, and treat tool output as evidence rather than confidence. |
| Work from a terminal | Cursor CLI | Treat this as a separate surface with its own current installation, modes, sandbox, and approval controls; executable course practice targets Cursor Desktop 3.17. |
| Research before implementation | Plan Mode | Review and edit the plan before the Build transition; a plan is not a correctness guarantee. |
| Work across concurrent tasks | Agents Window | Use the current `Open Agents Window` and `Open IDE` commands to switch surfaces; keep task, environment, branch, and review state visible. |
| Delegate focused work | Subagents | Use separate context windows for focused tasks; remember that the parent checkout is shared by default, and that readonly local mutation does not remove inherited write-capable MCP tools. Use least privilege or isolated project copies before overlapping or external work. |
| Govern terminal execution | Run Modes | Teach the current labels Auto-review, Allowlist, and Run Everything, with the user retaining responsibility for commands and effects. |
| Review changes | Agent Review plus repository checks | Use Quick or Deep review as triage, then run deterministic project checks and inspect the actual diff. |
| Diagnose a reproducible defect | Debug Mode | Reproduce first, form hypotheses, instrument where needed, and preserve a regression check. |
| Store durable repository instructions | `.cursor/rules/*.mdc` or `AGENTS.md` | Keep rules scoped, observable, and repository-readable. A plain `.md` file inside `.cursor/rules` is not a Project Rule. |
| Package a reusable workflow | Skills and Plugins | Keep scripts, references, and instructions together; inspect every bundled Rule, Skill, agent, Command, MCP server, and Hook before enabling a Plugin. |
| Connect external systems | MCP | Treat every tool and connected system as a trust boundary with its own permissions and side effects. |
| Delegate in an isolated remote environment | Cloud Agents | Prepare the environment, minimise credentials, preserve branch/revision evidence, and review the handoff. |
| Verify a running web interface | Browser | Keep actions manually approved and use a verified local origin. Where an enterprise administrator has enabled Browser Origin Allowlist, treat it as an additional best-effort layer. Browser cookies and web storage persist per workspace, so use synthetic accounts and clear state after practice. Pair visual inspection with deterministic accessibility and application checks. |

Important boundaries are made explicit in lessons and assessment:

- Privacy Mode is not local-only processing. Cursor documents server-side processing, an abuse-investigation retention exception, and designated or administrator-enabled non-ZDR models.
- `.cursorignore` is not a universal security boundary for terminal commands or MCP tools.
- Rules and prompt-based Hooks are model-evaluated. Only command-based pre-action Hooks provide deterministic allow-or-deny decisions for supported actions; failures are fail-open by default unless `failClosed` is configured. Test the failure path, and do not assume local user, prompt, or MCP Hooks transfer to Cloud Agents.
- Checkpoints are convenience snapshots and do not replace Git history.
- An approval classifier or allowlist reduces friction; it is not a complete security boundary.
- Local Agent and Cloud Agents have different environments, credentials, and risk surfaces.
- Repo-backed Automations may begin with PR creation, persistent memory, computer use, and external tools enabled; dry-run synthetic work with least privilege and a human review gate before enabling capabilities individually.
- Current product documentation is authoritative when historical screenshots use older chrome or labels.

## Practitioner evidence by work context

| Context | Inspectable repository evidence | Pattern adopted | Boundary retained |
| --- | --- | --- | --- |
| Software engineering | `alibaba/hooks` at `2b3a0afd…`; `github/spec-kit`; `obra/superpowers`; MetaMask design-system rule at `e98ccb948…` | Separate specification, plan, implementation, tests, review, CI, and pull-request handoff. Verify from fresh output. | Repository rules are local policy, not Cursor requirements. MetaMask has no detected repository licence and is citation-only. |
| Research | `alexmihalache/cursor_domain_agent` at `9add613d…` | Use artifact-first runs, explicit assumptions, leakage and sanity gates, run metadata, and a place for negative results. | The repository does not prove scientific validity or financial correctness. Its disclaimers remain in force. |
| Writing and documentation | `strapi/documentation` at `ede5b50b…`, with pinned style and integrity rule revisions | Separate evidence inspection, outline, drafting, style review, integrity checking, and publication gates. | The course does not copy an organisation's large rule set wholesale. Source verification remains a human responsibility. |
| Office and product work | `jinjin1/Cursor-for-Product-Managers` at `21a835d4…`; `anthroos/plaintext-crm` at `eaf2fb30…` | Preserve raw evidence, analysis, synthesis, decision, approved output, schemas, and versioned plain-text artifacts as separate layers. | The course independently requires synthetic practice data and human approval; the cited repositories are not evidence for that safety rule. Real personal or confidential data is outside the exercise. |
| Teaching and learning | `kevinnio/tutor` at `88ffe9ac…`; `dotdc/cursor-workshop` at `ad5504f…` | Design small observable tasks, one learner action per turn, productive struggle, read-only verification, and evidence-bearing feedback. | These are practitioner designs, not learning-effect studies. Third-party Skills and media require independent inspection and rights review. |
| Cross-tool repository context | `agentsmd/agents.md` | Put durable commands, constraints, and verification expectations in readable repository context. | Cursor's own Rules documentation remains authoritative for Cursor-specific activation behaviour. |

## Curriculum rationale

The 14 lessons move from low-risk, reversible interactions to autonomous and cross-system work.

| Unit | Lessons | Instructional purpose |
| --- | --- | --- |
| 1. Control the surface | 1. Orient and protect data; 2. Tab and Inline Edit; 3. Agent interface; 4. Task contracts | Establish vocabulary, privacy judgement, selective acceptance, context inspection, and bounded requests before tool execution. |
| 2. Direct and govern work | 5. Plan, execute, and steer; 6. Test, review, and recover; 7. Rules, Skills, and MCP; 8. Cloud and parallel work | Move from planning to execution while keeping commands, diffs, failure recovery, reusable context, connected tools, and environment boundaries observable. |
| 3. Apply the workflow | 9. Software studio; 10. Research studio; 11. Writing studio; 12. Office studio | Transfer the same evidence loop into four materially different work contexts without pretending one prompt pattern fits all. |
| 4. Teach and demonstrate mastery | 13. Teaching studio; 14. Workflow capstone | Apply productive-struggle and assessment principles, then produce a verifiable end-to-end artifact and handoff. |

Every lesson contains one authentic UI figure, three explanatory sections, one bounded practice with required evidence and a safety note, one checkpoint, and two formative questions. The final quiz samples 12 questions with three from each unit and requires 10 correct answers. Completion also requires a locally verifiable capstone receipt, preventing a learner from completing the course by page navigation alone.

## Assessment and capstone design

Assessment targets judgement rather than feature recall:

- choose the smallest surface that fits the task;
- distinguish context from unsupported assumptions;
- identify the execution and data boundary;
- recognise evidence strong enough to accept a result;
- separate review aids from deterministic checks;
- preserve a safe recovery and handoff path.

The capstone is a deliberately incomplete, dependency-light web fixture. The learner must verify the ZIP against its published archive checksum, add an accessible `Incomplete` filter, keep scope bounded, run the supplied verifier, inspect the diff, and submit the self-check receipt with the human evidence packet. The internal fixture hash binds the declared receipt to `course-fixture.json`; the browser checker rejects malformed or mismatched records but, because it is local and unsigned, cannot detect a hand-crafted canonical declaration or prove that commands ran. The starter's expected failing assertions are part of the exercise and are not presented as a release failure.

## Figure and media policy

Fourteen figures are locally hosted transformations of public first-party Cursor media. No community screenshots are reused. The local derivatives strip metadata and resize the official image or a single representative official video frame; they do not fabricate, redraw, or cosmetically alter the Cursor interface.

Each figure is labelled as one of:

- `current`: matched to current documentation or product media at the research snapshot;
- `dated-current`: date-stamped media whose taught interaction remains current;
- `historical-interface`: older chrome used only for a durable workflow principle and disclosed as historical in the learner caption.

Public availability is not a blanket reuse licence. The implementation includes attribution, source-page links, independence and non-endorsement language, a publication-rights warning, and a public `THIRD_PARTY_NOTICES.md` that explicitly excludes the Cursor-owned media derivatives from the repository's MIT licence. The final media use requires an evidence-bearing publication-rights review before any public release or redistribution.

## Release and staleness controls

The course uses a dated source snapshot because Cursor is a rolling product. Before every substantive release, the maintainer should:

1. rerun the Cursor-specific validator;
2. reopen all primary sources marked current;
3. verify current labels for Agent surfaces, Run Modes, Rules, Skills, MCP, Browser, and Cloud Agents;
4. confirm that dated interfaces still teach the stated principle and relabel or replace them if needed;
5. recompute every local asset hash and capstone archive checksum;
6. rerun type checks, locale structure checks, the capstone fixture checks, and browser tests;
7. review pricing, quotas, model names, and entitlements only if future copy chooses to mention them.

The development validator rejects stale assessed terminology, missing source revisions, orphaned sources, unlicensed community reuse, remote runtime images, mismatched localisation structures, undisclosed historical figures, malformed or metadata-bearing figure files, capstone hash drift, and files outside the Cursor namespace. The release validator additionally fails closed while any first-party figure lacks an evidence-bearing publication-rights determination; all 14 figures are currently `rights-review-required`.

## Limitations

- This is an evidence-grounded instructional synthesis, not an experimental evaluation of Cursor.
- The GitHub sample is purposive, not representative of all Cursor users or professions.
- Repository popularity, adoption, or polish is not treated as correctness evidence.
- Cursor features, plan entitlements, and interfaces can change after the 23 August 2026 snapshot.
- The examples avoid real confidential data, credentials, production mutation, and high-stakes domain decisions.
- The capstone's unsigned local receipt checks structure and declared results only; the human-readable evidence packet is required because the receipt is not an execution or identity attestation.
- Accessibility and translation are checked structurally and in representative browser flows; publication still benefits from native-speaker and assistive-technology review.
