# Software Engineering with Agentic AI

## Course 8 research brief

**Prepared for:** aicourse.top, Course 8  
**Evidence observation date:** 2026-08-23  
**Scope:** GitHub-hosted empirical studies, executable evaluation artifacts, production control patterns, maintainer policies, and carefully bounded issue case studies relevant to real software engineering with coding agents.  
**Companion audit record:** software-engineering-agentic-ai-research-brief.provenance.md  
**Status:** Course-design evidence brief, not legal advice, a model ranking, or a substitute for current product documentation.

## Executive determination

A world-class course should teach agentic software engineering as a controlled, evidence-producing engineering process:

**specify → inspect → plan → implement → test → review → integrate → deploy → observe → learn**

The agent may accelerate or automate steps inside that loop, but it does not remove the need for requirements, architecture, version control, independent verification, security, operations, documentation, or accountable human judgment. The recurring lesson across the strongest sources is that probabilistic generation becomes useful when it is surrounded by independently controlled boundaries and evidence: scoped permissions, isolated workspaces, canonical commands, tests, review gates, protected evaluators, provenance, and rollback. Individual checks can still be incomplete, flaky, probabilistic, or misconfigured, so their independence and limitations must be inspected rather than assumed.

The course should therefore avoid becoming a collection of prompts or product demonstrations. Learners should repeatedly produce normal engineering artifacts—task contracts, architecture decisions, small diffs, tests, review evidence, release plans, runbooks, and evaluation cards—and learn when not to delegate.

Three findings should shape the course:

1. **Productivity is contingent, not automatic.** A controlled field study of experienced maintainers working in familiar repositories found that early-2025 AI tools increased task-completion time by an estimated 18.8 percent in that setting. This is evidence for local measurement and calibrated adoption, not a universal claim that agents make engineers slower. [E01]
2. **Output quality cannot be inferred from generation speed or benchmark success.** Large observational datasets show substantial human correction, partial survival of generated code into commits, rejected pull requests, and security findings. Evaluators themselves can also be defective or gameable. [E02–E13]
3. **Safe autonomy is a systems property.** Mature agent projects and production workflow repositories converge on isolation, least privilege, read-only analysis, structured outputs, separate writers, trace capture, cost limits, and human approval at consequential boundaries. [E14–E32]

## 1. Remit and evidence boundaries

This brief supplies the practitioner and engineering-evidence layer for Course 8. It is designed to complement, not replace:

- current Claude Academy and Claude Code learning materials for product-specific behavior;
- current OpenAI Academy and Codex documentation for product-specific behavior;
- primary software-engineering standards, textbooks, and organizational policies;
- the course author’s own privacy-reviewed captures of real Claude interfaces.

Academy pages and product interfaces can change. Any Academy-derived instruction, UI label, entitlement, quota, or safety behavior must be checked against the live official source at publication time and recorded in the course’s master source ledger. No current-product claim should be inferred from an older screenshot.

The evidence reviewed here does not justify:

- a universal productivity percentage;
- a universal ranking of models or coding tools;
- the claim that one instruction file guarantees compliance;
- the claim that a sandbox makes an action authorized;
- the claim that benchmark success establishes production readiness;
- the claim that an agent-generated test independently validates agent-generated code;
- the claim that automated review replaces human ownership or protected CI;
- prevalence estimates based on individual GitHub issues.

## 2. Evidence framework

### 2.1 Source classes

| Class | Source type | What it can support | What it cannot support by itself |
|---|---|---|---|
| A | Controlled or reproducible empirical research | Bounded quantitative findings, measured failure modes, study-specific associations | Universal causal claims outside the sample, tool, model, repository, or time period |
| B | Executable reference implementation or evaluation harness | Reproducible workflow mechanics, observable controls, trace and grading design | Independent proof that the implementation is complete, secure, or superior |
| C | Production instruction or control artifact | Concrete practices used in a maintained engineering environment | Causal estimates of effectiveness |
| D | Maintainer governance or contribution policy | Norms for accountability, disclosure, licensing, testing, and maintainability | General empirical claims about all projects |
| E | Issue report or discussion case | A concrete failure mode worth reproducing in a sanitized lab | Frequency, prevalence, current product behavior, or verified root cause unless independently confirmed |

### 2.2 Claim-calibration rule

Every course claim should carry the strength of its evidence:

- Use **found in this study** for a measured result tied to a defined sample.
- Use **the repository implements** for an observable design or control.
- Use **the maintainer requires or recommends** for a project policy.
- Use **a user reported** for an issue case.
- Use **the course recommends** for a pedagogical or risk-management decision.

Do not silently upgrade an association into causation, an implementation pattern into a guarantee, or an issue report into a product-wide defect.

## 3. Evidence synthesis for teaching

### 3.1 Productivity and value

The strongest productivity lesson is methodological. METR’s randomized field study covered 246 real issues completed by 16 experienced open-source maintainers in repositories they knew well. In that particular setting, allowing early-2025 AI tools was associated with an estimated 18.8 percent increase in task-completion time. The sample, tools, task mix, and outcome definition sharply constrain generalization. [E01]

SWE-chat adds observational evidence at larger scale: approximately 6,000 public-repository agent sessions, about 63,000 user prompts, and about 355,000 tool calls. Its reported analyses include substantial user pushback or interruption and only partial survival of agent-authored code into commits. This supports measuring accepted value and rework rather than counting generated lines or completed turns. It does not establish causal productivity effects. [E02–E04]

**Safe teaching claim:** Agents can improve, worsen, or redistribute engineering effort. Teams should run representative local trials and measure accepted outcomes, review time, rework, defects, cost, and delivery performance.

**Course consequence:** Learners must compare an agent-assisted workflow with a defensible baseline. A faster first draft earns no credit unless the accepted artifact and downstream cost are measured.

### 3.2 Pull-request acceptance, documentation, and human responsibility

The Coding Agents in the Wild replication materials analyze 12,433 agent-authored pull requests across 1,495 repositories, including 4,283 rejected pull requests. Many rejected pull requests had no inline feedback, which makes silent closure an important interpretive gap. Within the commented rejected subset, functional issues were prominent. Documentation co-change was associated with lower rejection odds, but the observational design does not show that adding documentation causes acceptance. [E05–E06]

Policies from curl, Qiskit, and pytest converge on a human-accountability principle: contributors remain responsible for understanding, validating, explaining, licensing, disclosing where required, and maintaining what they submit. Their policies differ, so students must read the target project’s actual rules. [E33–E35]

**Safe teaching claim:** AI can assist authorship, but a human contributor remains accountable for scope, correctness, test evidence, explanation, licensing, and follow-through.

**Course consequence:** Every graded pull request should identify the human owner, disclose tool use when the target policy requires it, explain the change in the learner’s own words, and include reproducible validation.

### 3.3 Security debt is broader than vulnerable source code

Microsoft’s coding-agent security-debt study observed more than 12,000 agent actions across five model backends and 93 setup tasks. About 21 percent of trajectories contained at least one action detected as insecure, with information exposure a major category. The detector emphasized precision but reported limited recall, and the study used one harness and a bounded task suite; therefore its exact rate and any model ordering should not be generalized. [E07–E08]

The agent library-usage dataset found that dependency additions were relatively uncommon compared with import use, and that many dependency additions were versioned. This is useful evidence that dependency behavior can be measured, not proof that selected packages or constraints were safe. [E09]

Security guidance in GitHub Agentic Workflows, Claude Code Action, OpenAI Codex, and OpenHands emphasizes untrusted input, tool boundaries, token scope, network access, command approval, output validation, and trace sensitivity. [E22, E25–E31]

**Safe teaching claim:** Agent security includes source changes, shell commands, credentials, dependencies, network egress, external tools, workflow permissions, evaluator integrity, and stored traces.

**Course consequence:** Security assessment must inspect both the final diff and the action trajectory. A secure-looking patch does not excuse an unsafe command, leaked secret, or unauthorized network call.

### 3.4 Instruction files help orientation but are not enforcement

An ablation study of Claude Code and Codex across three Python repositories collected 291 raw runs; 288 entered its correctness analysis. It found no measurable correctness effect from context files in this bounded sample. Exploratory, post-hoc process analyses in one repository reported fewer full-suite executions on three of four tasks and lower wall-clock time on four of five Claude tasks; these are hypotheses for replication, not demonstrated general improvements. The study was under review and underpowered for universal conclusions. Its harness is especially instructive: it removed remotes, denied push and GitHub commands, stripped tokens, pruned future solution history, and required a hard verification gate. [E10]

The VS Code repository’s Copilot instructions and the VS Code Jupyter maintainers’ AI-ready guidance show a complementary production pattern: make architecture, dependency layers, canonical commands, targeted tests, conventions, and expected planning legible. [E23–E24]

**Safe teaching claim:** Repository instructions can orient an agent. Protected permissions, CI, branch or environment rules, managed policy, and correctly configured fail-closed checks can enforce selected critical rules; tests, hooks, and review contribute according to their coverage, protection, handler type, and configuration.

**Course consequence:** Learners should build short, scoped instruction files that point to canonical sources and commands, then test whether they change behavior. Safety-critical requirements must be enforced outside the instruction text.

### 3.5 Evaluators and tests are part of the attack surface

SWE-bench supplies a reusable repository-level evaluation harness. A closed SWE-bench issue documented a path-collision condition in which a submitted patch could affect a test-patch path and produce a misleading result. Whether or not a particular exploit remains possible in a current version, the case demonstrates the need to protect evaluator code and inspect surprising passes. [E11–E13]

**Safe teaching claim:** A green evaluation means the submission passed the implemented harness under the recorded conditions. It does not prove requirement completeness, non-functional quality, security, or production readiness.

**Course consequence:** Course graders should be isolated from the agent workspace, use independent and partly hidden tests, reject unauthorized file changes, preserve grading artifacts, and audit unexpectedly strong results.

### 3.6 Traces, checkpoints, and reproducibility

SWE-agent records actions, observations, configuration, predictions, logs, exit status, and cost-relevant information. Its inspector supports step-by-step navigation and investigation; stored configuration can support a repeated run, subject to model, service, environment, dependency, credential, and repository nondeterminism. Aider combines relevance-ranked repository context with version-control checkpoints, linting, tests, and undo. Entire CLI links coding-agent sessions and prompts to commits and supports non-destructive rewind and worktree-aware tracking. [E14–E20, E32]

OpenHands’ benchmark and security artifacts illustrate pinned harness versions, structured tool/error logs, isolated execution, confirmation, and analyzers. Some analyzers rely on model self-assessment, so they are a layer rather than a guarantee. [E21–E22]

**Safe teaching claim:** Treat each agent run as an experiment whose configuration, repository state, permissions, actions, patch, tests, cost, and outcome are recorded for inspection and review. A recorded configuration can support a rerun; it does not guarantee deterministic reproduction.

**Course consequence:** Every substantial lab submission should contain a run manifest. Reasoning narratives can be useful for reflection, but tool calls, diffs, test outputs, and repository states are stronger audit evidence than a model’s explanation of its own reasoning.

### 3.7 Separate reasoning authority from write and deploy authority

GitHub Agentic Workflows uses a layered pattern: a read-only agent performs analysis, emits structured outputs, and a separate mechanism performs approved writes. Its materials also describe egress control, untrusted-input sanitization, scoped tools, isolated threat detection, and security scanners. Claude Code Action and Codex Action similarly emphasize constrained triggers, short-lived tokens, reduced privileges, explicit approvals, and platform-specific sandbox limitations. [E25–E31]

**Safe teaching claim:** Consequential writes should cross an explicit, inspectable boundary. The process that reasons about a change need not hold the authority to merge or deploy it.

**Course consequence:** Students should implement a read-only analysis stage, a schema-validated proposal, and a separately authorized writer or deployer. Protected branches and environments remain authoritative.

### 3.8 Traditional software engineering becomes more important

DORA’s 2025 report frames AI as an amplifier of the surrounding delivery system. The practical implication aligns with the reviewed repositories: fast feedback, version control, testing, documentation, deployment discipline, observability, and team processes determine whether faster generation becomes value or instability. [E36–E37]

**Safe teaching claim:** Agent capability does not substitute for software-engineering capability; it increases the leverage of both good and bad systems.

## 4. Claims approved for course use

The following claims are appropriately supported when taught with their qualifications:

1. Agentic software engineering is a closed-loop socio-technical process, not one-shot code generation.
2. Faster generation can shift bottlenecks to specification, review, integration, verification, and maintenance.
3. Productivity effects vary by developer, task, repository, workflow, model, and time; local measurement is necessary.
4. Prompt and repository instructions are advisory controls. A check is independently enforceable only when it is protected from the agent, correctly configured, repeatable enough for the decision, and fail-closed where required. Tests, permissions, hooks, schemas, protected branches, and review gates can contribute such controls, but none is automatically deterministic or authoritative merely because it is automated.
5. Passing tests is necessary evidence for many changes but is not sufficient evidence of complete requirements, security, maintainability, or production readiness.
6. Evaluators, test patches, CI definitions, instruction files, dependencies, actions, and external tools belong in the software supply-chain threat model.
7. Agent tasks should use isolated branches or worktrees, reversible checkpoints, and explicit merge ownership.
8. Engineering value should be measured through accepted outcomes, rework, review effort, defects, reliability, cost, and user value—not generated lines, tokens, commits, or tool calls alone.
9. Security review must cover commands, permissions, credentials, dependencies, network access, tools, model context, generated artifacts, and retained traces.
10. Human accountability for understanding, testing, explanation, disclosure, licensing, and maintenance remains.
11. Traditional requirements, architecture, testing, review, delivery, reliability, and governance are prerequisites for scaling safe autonomy.
12. Untrusted text can reach an agent through issues, pull requests, comments, repository files, web pages, tool descriptions, logs, and external context.
13. Agent self-report is not independent verification. Claims of completion should be checked against the repository state and external tests.
14. Autonomy should increase only when task risk, observability, reversibility, and evaluation quality justify it.

## 5. Claims to prohibit or rewrite

| Overclaim | Required rewrite |
|---|---|
| AI coding agents make developers a fixed percentage faster or slower | A named study found a bounded effect in a defined setting; results may differ elsewhere |
| This agent solved the benchmark, so it is production ready | The submission passed a specified harness; additional requirement, security, performance, operability, and review evidence is needed |
| An AGENTS.md or CLAUDE.md file guarantees compliant behavior | The file communicates guidance; enforce critical constraints through tools, permissions, tests, and CI |
| The task ran in a sandbox, so every action was safe and authorized | Isolation limits some consequences; authorization, scope, secrets, network access, and destructive actions still require controls |
| The agent wrote tests, so its implementation is verified | Agent-written tests are useful artifacts but require independent review and protected or hidden checks |
| AI review replaces human review and CI | AI review can add signals; accountable approval and independently run engineering gates remain |
| More code, commits, tokens, or tool calls means more productivity | Measure accepted value, elapsed and human effort, rework, defects, delivery, cost, and maintenance burden |
| The newest model is the best engineering choice | Evaluate current candidates on representative tasks, risk, cost, latency, reliability, and tool compatibility |
| One successful demo proves reliable autonomy | Repeat trials, include failures and adversarial cases, and report uncertainty |
| A GitHub issue proves a common defect | A user report illustrates a possible failure mode; prevalence and current status are unknown |

## 6. Complete software-engineering curriculum coverage

The following checklist is a minimum lifecycle-domain crosswalk. The released course orients learners to every listed domain and maps each domain to teaching, practice, assessment, and capstone evidence. It does not claim textbook-level treatment of every topic inside SWEBOK v4.0a; Computing, Mathematical, and Engineering Foundations are introduced explicitly and then exercised through state, invariant, graph, measurement, and trade-off reasoning across the course.

| Domain | Essential concepts | Agentic application and required artifact |
|---|---|---|
| 1. Foundations and lifecycle | Software as a socio-technical system; lifecycle models; complexity; change; quality; trade-offs; professional responsibility; predictive, iterative, and continuous delivery; assistant, pair, agent, and multi-agent modes | Classify task risk and choose an autonomy level; produce a lifecycle and responsibility map |
| 2. Requirements engineering | Stakeholders; problem framing; functional and non-functional requirements; use cases and user stories; constraints; acceptance criteria; ambiguity; prioritization; traceability; change control | Convert a vague request into a bounded engineering contract with assumptions, exclusions, acceptance tests, escalation triggers, and requirement links |
| 3. Architecture and design | Quality attributes; context, container, and component views; modularity; coupling and cohesion; interfaces and contracts; data design; patterns; concurrency; deployment topology; architectural decisions | Inspect before editing; propose a change plan and architecture decision record; require human approval for consequential design changes |
| 4. Construction | Language idioms; readability; naming; error handling; types; input validation; configuration; concurrency; resource management; reuse; build systems; dependency discipline | Produce a minimal diff, cite repository conventions, avoid invented APIs, and explain error paths and compatibility |
| 5. Version and configuration control | Working tree and index; diffs; commits; branches; worktrees; merge and rebase; conflicts; tags; releases; semantic versioning; rollback; CODEOWNERS; configuration and provenance | Use one isolated worktree or branch per task, checkpoint before risky changes, preserve a reviewable history, and keep merge authority human-controlled |
| 6. Testing and quality assurance | Unit, component, integration, contract, end-to-end, acceptance, regression, property, fuzz, mutation, performance, accessibility, compatibility, and security testing; test doubles; determinism; flaky tests; coverage interpretation | Reproduce first; write the smallest discriminating regression; use independent and hidden checks; record command, environment, result, and residual gaps |
| 7. Debugging and diagnosis | Reproduction; minimization; observation; hypothesis formation; logs; traces; debugger; profiler; bisection; root cause; regression prevention; rollback; postmortem | Require an evidence table of observations and hypotheses before the fix; compare expected and observed states; preserve the failing case |
| 8. Code review | Correctness; design; security; maintainability; tests; documentation; operability; scope; small pull requests; ownership; review evidence | The same agent must not be sole author, verifier, and approver; submit diff summary, risks, test evidence, and unresolved questions |
| 9. DevOps and CI/CD | Repeatable builds; CI; artifacts; environments; infrastructure as code; releases; feature flags; canary and blue-green deployment; migrations; rollback; change management; secret handling | Use read-only analysis, schema-validated safe outputs, separate write or deploy authority, protected environments, and a rehearsed rollback |
| 10. Maintenance, refactoring, and technical debt | Corrective, adaptive, perfective, and preventive maintenance; smells; characterization tests; behavior-preserving refactoring; migrations; deprecation; dependency updates; compatibility; debt economics | Baseline behavior before refactoring; separate structural change from functional change; quantify debt and migration risk |
| 11. Reliability and observability | Availability; latency; throughput; capacity; SLI, SLO, SLA, and error budgets; timeouts; retries; idempotency; backpressure; graceful degradation; disaster recovery; incidents; logs, metrics, traces, dashboards, alerts, and runbooks | Define failure modes and operational signals before deployment; test rollback and recovery; diagnose an incident from telemetry |
| 12. Security, privacy, and supply chain | Threat modeling; authentication; authorization; validation; secrets; cryptographic boundaries; least privilege; privacy; minimization; retention; SAST, DAST, SCA, SBOM, lockfiles, signing, provenance, and vulnerability response | Threat-model prompt injection, repository text, tool poisoning, external tools and MCP servers, data exfiltration, unsafe shell, dependency hallucination, and CI privilege escalation |
| 13. Documentation and knowledge | README; onboarding; architecture docs; decision records; API docs; runbooks; changelogs; comments; diagrams; docs as code; freshness and ownership | Keep agent instructions concise, scoped, linked to canonical sources, executable where possible, and tested for staleness |
| 14. Project and team processes | Agile, lean, and plan-driven approaches; backlog; task slicing; work in progress; risk; dependencies; roles; communication; retrospectives; incident coordination; handoffs | Decide whether a task is suitable for an agent; name a human owner; show progress, interruption, escalation, and handoff conventions |
| 15. Estimation, economics, and metrics | Forecast ranges; effort versus elapsed time; lead time; cycle time; throughput; work in progress; review time; defects; change-failure rate; recovery time; cost of delay; total cost of ownership; DORA measures | Track model cost, latency, retries, human review, rework, accepted value, escaped defects, and maintenance burden; compare with a baseline |
| 16. Ethics, law, and governance | Accountability; disclosure; authorship; copyright; licenses; provenance; accessibility; fairness; privacy; deskilling; environmental impact; open-source maintainer burden; audit and retention | Produce a disclosure and provenance record; check target-project contribution rules and third-party rights; define retention and deletion for traces |
| 17. Agent evaluation and oversight | Representative suites; baselines; recorded model or product identifier and snapshot when exposed; frozen controllable harness and environment; repeats; confidence intervals; functional, non-functional, security, and process metrics; contamination; hidden tests; trajectory review; adversarial evaluation; drift; pass@k and pass^k; abstention; escalation | Produce an evaluation card with task set, versions, permissions, budget, outcome rubric, uncertainty, failures, and release decision |
| 18. Human-agent interaction | Mode selection; plan versus execution; uncertainty; command and diff approval; interruption; steering; progress; accurate completion; reversible actions; accessibility | Demonstrate a plan review, scoped command approval, mid-course correction, safe stop, and evidence-backed definition of done |

## 7. Design synthesis behind the released course

The research synthesis below groups the completeness contract into twelve themes without treating traditional and agent-specific material as separate worlds. These are design groups, not the released lesson count: Course 8 implements eighteen ordered lessons and eighteen evidence-producing practice labs.

### Module 1 — What changes and what does not

- Software-engineering lifecycle, professional responsibility, and agent modes.
- Evidence literacy: experiments, observational studies, implementation artifacts, policy, and anecdotes.
- Lab: inspect the same task performed manually and with an agent; define valid comparison measures.

### Module 2 — From prompt to engineering contract

- Stakeholders, functional and non-functional requirements, constraints, acceptance criteria, traceability, and task slicing.
- Lab: transform an underspecified issue into an assumption ledger, explicit exclusions, acceptance tests, and escalation conditions.

### Module 3 — Repository comprehension and context engineering

- Architecture views, dependency layers, repository maps, canonical commands, instruction files, context budgets, and stale guidance.
- Lab: author scoped repository instructions, then run a controlled with-and-without comparison.

### Module 4 — Planning, design, and architectural decisions

- Quality attributes, interfaces, data and concurrency design, deployment implications, and architecture decision records.
- Lab: agent proposes two designs; learner evaluates trade-offs and approves a bounded plan before implementation.

### Module 5 — Construction with reversible version control

- Minimal diffs, language and repository conventions, branches, worktrees, commits, checkpoints, undo, and conflicts.
- Lab: implement in an isolated worktree, checkpoint, deliberately steer the agent, inspect the diff, and recover from a poor branch.

### Module 6 — Testing, debugging, and evaluator integrity

- Test layers, reproducible diagnosis, regression design, hidden tests, flaky tests, mutation, and evaluator attacks.
- Lab: reproduce a defect, create an independent failing test, fix it, and detect an attempted grading-path modification.

### Module 7 — Review, documentation, and open-source responsibility

- Review dimensions, small pull requests, disclosure, documentation, licensing, and maintainership.
- Lab: prepare a contribution-ready pull request with a human-authored rationale, validation record, documentation, and policy-compliant disclosure.

### Module 8 — Secure agent execution and supply-chain controls

- Prompt injection, secrets, permissions, tool and network boundaries, external tool trust, dependencies, SBOM, provenance, and trace privacy.
- Lab: defend a workflow against malicious issue text and dependency hallucination using least privilege, allowlists, scanners, and redaction.

### Module 9 — Agentic CI/CD as a control plane

- Reproducible builds, read-only analysis, structured safe outputs, separate writers, protected branches and environments, migrations, release, and rollback.
- Lab: implement a read-only analysis workflow whose schema-validated proposal is applied only by a separately authorized job.

### Module 10 — Reliability, observability, and incident work

- SLOs, error budgets, telemetry, resilience, rollout strategies, incident response, and postmortems.
- Lab: diagnose a seeded incident from logs, metrics, and traces; propose and verify rollback; write a blameless postmortem.

### Module 11 — Maintenance, technical debt, and team economics

- Characterization tests, refactoring, dependencies, deprecation, estimation, flow metrics, rework, and total cost.
- Lab: compare an agent-assisted refactor with a baseline using behavior, review burden, cost, and maintainability—not line count.

### Module 12 — Evaluation, governance, and calibrated autonomy

- Repeated evaluation, uncertainty, adversarial cases, abstention, escalation, drift, privacy, accountability, and organizational rollout.
- Lab: create an evaluation card and autonomy decision for a representative task portfolio.

### Mapping from the twelve design groups to the eighteen released lessons

| Design group | Released lesson or lessons |
|---|---|
| 1. What changes and what does not | 1. Agentic Engineering Is a System; 16. Teams, Process, and Governance |
| 2. From prompt to engineering contract | 2. Requirements as Task Contracts |
| 3. Repository comprehension and context engineering | 5. Engineer the Repository Context |
| 4. Planning, design, and architectural decisions | 3. Architecture and Trade-offs; 4. Planning, Estimation, and Risk |
| 5. Construction with reversible version control | 6. Git, Environments, and Worktrees; 7. Construction and Code Quality |
| 6. Testing, debugging, and evaluator integrity | 8. Testing as an Evidence System; 9. Debugging to Root Cause |
| 7. Review, documentation, and open-source responsibility | 10. Review, Refactoring, and Technical Debt; 11. Documentation and Durable Knowledge; 16. Teams, Process, and Governance |
| 8. Secure agent execution and supply-chain controls | 15. Security, Privacy, and the Supply Chain |
| 9. Agentic CI/CD as a control plane | 12. CI/CD, Release, and Rollback |
| 10. Reliability, observability, and incident work | 13. Reliability, Observability, and Incidents |
| 11. Maintenance, technical debt, and team economics | 10. Review, Refactoring, and Technical Debt; 14. Performance, Economics, and Sustainability |
| 12. Evaluation, governance, and calibrated autonomy | 17. Evaluate Agents as Engineering Systems; 18. Capstone: Ship a Safe Change |

## 8. Assessment and lab implications

### 8.1 Evidence-first assessment principles

1. **Grade the accepted engineering outcome, not the fluency of the interaction.**
2. **Require independent evidence.** The agent’s own claim that tests passed is not test evidence.
3. **Preserve failure.** Learners submit failed attempts, corrections, and residual risks rather than curating a success-only story.
4. **Protect the grader.** Evaluation files, hidden tests, and scoring logic remain outside the agent-writable workspace.
5. **Reward abstention and escalation.** A justified stop on an unsafe or underspecified task can outperform reckless completion.
6. **Separate roles.** Agent authoring, automated analysis, human review, CI verification, and merge or deploy authority are distinguishable.
7. **Record the experiment.** Repository SHA, branch or worktree, model and product version, harness, instructions, permissions, network policy, budget, trace location, patch, commands, results, cost, and human interventions are part of the submission.
8. **Assess non-functional quality.** Security, accessibility, reliability, performance, privacy, maintainability, and operability cannot be optional bonus sections.

### 8.2 Ten recurring lab archetypes

The released course contains one evidence-producing practice lab in each of its eighteen lessons. The ten rows below are recurring design archetypes that those lesson-level labs specialize; they are not a second or shorter released lab inventory.

| Lab | Learner task | Required evidence | Primary risk taught |
|---|---|---|---|
| 1. Vague issue to contract | Turn an ambiguous request into a bounded task | Stakeholders, assumptions, exclusions, acceptance criteria, non-functional constraints, escalation triggers | Solving the wrong problem |
| 2. Repository onboarding A/B | Build scoped instructions and compare runs | Frozen repository state, same task and budget, multiple repetitions, outcomes and caveats | Treating context files as magic |
| 3. Reproduce–diagnose–fix–regress | Repair a seeded defect | Failing reproduction, observation/hypothesis log, minimal patch, independent regression, full relevant suite | Premature editing and confirmation bias |
| 4. Worktree and checkpoint recovery | Execute a change with reversible state | Branch or worktree manifest, checkpoints, steering event, diff audit, rollback | Concurrent interference and destructive change |
| 5. Adversarial evaluation harness | Detect a misleading pass | Protected grader, hidden test, forbidden-path diff check, audit log | Reward hacking and evaluator compromise |
| 6. Prompt injection and least privilege | Process hostile issue or repository text | Threat model, token and tool scopes, network policy, sanitization, blocked action evidence | Untrusted input controlling tools |
| 7. Responsible pull request | Prepare a contribution-ready change | Human explanation, tests, docs, license review, disclosure, maintainer checklist | Outsourced accountability |
| 8. Multi-run local evaluation | Compare workflows or models | Representative task set, baseline, repeats, uncertainty, failure taxonomy, cost and human time | Benchmark theater |
| 9. Read-only agentic CI | Build a safe automation path | Read-only analyzer, output schema, separate writer, approvals, branch protection, audit record | Agent holding excessive write authority |
| 10. Reliability incident | Diagnose and remediate a service failure | SLO impact, telemetry, timeline, recovery, rollback, follow-up controls | Code-only view of engineering |

### 8.3 Capstone definition of done

The capstone is complete only when the learner submits:

- a requirements and risk contract;
- an architecture view and decision record;
- an isolated, reviewable implementation history;
- unit through acceptance evidence appropriate to the change;
- independent evaluator and forbidden-change checks;
- security, privacy, and supply-chain review;
- documentation, migration, deployment, rollback, and runbook updates;
- telemetry and an operational acceptance test;
- a pull-request review package with human ownership;
- a run manifest and agent-usage provenance;
- an evaluation card with repeated runs when feasible and decision-relevant—or a preregistered justified unrun design—with uncertainty, failures, and an explicit rule against expanding autonomy from missing evidence;
- a governance disclosure and retention decision.

### 8.4 Released capstone rubric

| Dimension | Weight | High-performance evidence |
|---|---:|---|
| Requirements and design | 20% | Scope and acceptance are traceable; risks and quality attributes are explicit; alternatives are credible; the architecture decision is coherent, reversible where possible, and approved. |
| Implementation | 20% | The change is correct, minimal, idiomatic, maintainable, configuration-aware, compatible, dependency-disciplined, checkpointed, and easy to review or undo. |
| Verification | 25% | Diagnosis is reproducible; tests discriminate the outcome; protected independent checks cover functional and relevant non-functional quality; raw results, failures, flakes, and gaps are honest. |
| Delivery and operations | 20% | CI produces an identifiable artifact; rollout and migration are controlled; rollback or recovery is rehearsed; telemetry, SLOs, alerts, capacity evidence, runbook, and operational acceptance are ready. |
| Responsible agency | 15% | Permissions are minimal; trajectory, security, privacy, rights, and supply chain are reviewed; roles are separated; provenance and disclosure are complete; evaluation is repeated where feasible and decision-relevant; a named human owns the decision. |

The five weights total 100 points and match the executable course rubric in `lib/software-engineering/capstone.ts`. Passing requires 80 points, all eight artifact packages, every release gate reviewed, the safety-boundary attestation, and an explicit decision. A documented **do not release** decision can pass; arithmetic never waives a blocker. No rubric dimension awards points merely for using a more autonomous mode.

## 9. Measurement and evaluation specification

### 9.1 Minimum run manifest

Each evaluated run should record:

- task identifier and immutable task text;
- repository URL, commit SHA, branch or worktree, and dirty-state policy;
- agent product, model, model snapshot if available, client and harness versions;
- instruction and context files with hashes;
- enabled tools, command policy, filesystem scope, network scope, credentials, and approval mode;
- time and monetary budget, retries, and stopping conditions;
- action and observation trace location;
- produced patch and generated artifacts;
- tests and analyzers run, including who or what authored them;
- exit reason, claimed outcome, independently verified outcome, and residual risk;
- human interventions, review time, rework, and final disposition;
- privacy, retention, redaction, and access status.

### 9.2 Outcome measures

Use a balanced set:

- acceptance-criteria pass rate;
- protected-test pass rate;
- non-functional requirement pass rate;
- security findings and unsafe actions;
- unauthorized or out-of-scope changes;
- regression and escaped-defect rate;
- human review and rework time;
- total elapsed time and active human effort;
- cost, token or compute consumption, retries, and latency;
- change size and complexity as context, not value;
- documentation and operational readiness;
- maintainability and follow-up burden;
- abstention, escalation, and correct safe-stop rate;
- reproducibility across repeated runs;
- user or maintainer acceptance where ethically and practically measurable.

Report dispersion and failures, not only the best run. For repeated independent success, distinguish the chance of at least one success from the chance that every run succeeds. Neither metric alone captures review burden or harm.

### 9.3 Evaluation card

Every course comparison should answer:

1. What population of tasks does the suite represent?
2. What important tasks are missing?
3. What baseline is used and why?
4. Which model, harness, tools, repository state, and policies were frozen?
5. How many repetitions were run?
6. Which artifacts were protected from the agent?
7. Who authored the tests, and which checks were independent or hidden?
8. What functional, security, reliability, maintainability, and process outcomes were measured?
9. How were human time, rework, and cost counted?
10. What failures, exclusions, contamination risks, and uncertainty remain?
11. What would trigger rollback, abstention, escalation, or reevaluation?
12. What evidence supports the chosen level of autonomy?

## 10. Real Claude UI figures: capture, rights, and integrity rules

The user requested real Claude UI figures. “Real” means an authentic interface captured by the course author from an account they are entitled to use, or an official asset whose reuse terms have been verified. A generated imitation or reconstructed interface must never be presented as a real product capture. Privacy cropping and responsive encoding are permitted only when recorded without altering the instructional state.

### 10.1 Approved acquisition route

Prefer course-owned captures created in a purpose-built demonstration repository and account:

1. Use a course-controlled account, repository, issue, branch, terminal, and test data.
2. Capture only the portion of the UI necessary for the lesson.
3. Record product or surface name, visible version or build if available, operating system, capture date, and workflow state.
4. Store the original privately, create a redacted teaching derivative, and retain a figure ledger.
5. Recheck interface accuracy before publication and on a defined refresh schedule.

Official screenshots, Academy assets, diagrams, logos, and interface recordings may be reused only when the applicable official terms or written permission permit the intended educational publication. Public availability is not permission to reproduce.

### 10.2 Required redaction

Before a figure enters the course, remove or replace:

- names, avatars, email addresses, account identifiers, and organization names;
- private repository names, branches, issue text, source code, and URLs;
- filesystem paths that reveal usernames or internal structure;
- API keys, tokens, cookies, environment variables, secret names, and credential prompts;
- terminal history, clipboard content, tool output, logs, and traces containing sensitive data;
- billing, subscription, quota, usage, workspace, or device details not needed for the lesson;
- third-party personal data and copyrighted content that the course team does not have a right to reproduce.

Redaction must be irreversible in the published asset. Cropping or flattening should be followed by a visual and metadata inspection.

### 10.3 Pedagogical figure design target and released set

Use screenshots only where the visual state materially teaches an interaction. An ideal future Claude Code capture set would show:

1. entering or selecting planning mode;
2. repository inspection before editing;
3. a proposed plan with explicit scope and uncertainty;
4. a tool or command approval showing exact command, working directory, and reason;
5. a bounded diff review;
6. a failing test and evidence-based diagnosis;
7. steering or interrupting an incorrect approach;
8. a successful test with the independent evidence visible;
9. a review handoff with unresolved risk;
10. an accurate completion summary linked to repository state.

The 2026-08-23 release does not claim to contain those ten Claude Code states. It publishes two authentic, privacy-reviewed Claude Desktop captures: a Cowork composer showing workspace and permission-mode controls, and an in-progress artifact workspace showing Progress, Outputs, and Context. They teach scoping, configuration awareness, evidence location, and the difference between visible progress and independently verified completion. One authentic Codex plan surface and six licensed GitHub project, branch, diff, review, CI, and release surfaces provide the other lifecycle visuals. This division is stated in every caption; a Claude Desktop image is never labeled as Claude Code, command approval, diff review, test evidence, or release authorization.

The previously considered Claude Platform session image is excluded from Course 8 because its visible avatar, URL, workspace, and session identifiers violated this course's strict publication-privacy rule. Academy images remain link-only because republication rights were not established. Future Claude Code captures may be added only after the same provenance, privacy, accuracy, and rights gate passes.

Avoid decorative product screenshots. Every released figure should answer a learning question that prose alone would not answer as clearly.

### 10.4 Caption and alt-text contract

Every real UI figure needs:

- a unique figure ID;
- a descriptive title;
- product or surface name;
- version or build when visible or knowable;
- operating system and capture date;
- source type: course-owned capture or licensed official asset;
- concise description of what is authentic and what was cropped, redacted, or annotated;
- pedagogical purpose;
- alt text that describes the state, action, and relevant outcome rather than colors or decoration;
- a warning when labels or behavior may change in later releases.

### 10.5 Rights rules

- A source-code repository license does not automatically license a product UI, logo, screenshot, trademark, trade dress, issue attachment, or user-authored discussion.
- Do not copy screenshots from GitHub issues, social media, blog posts, or videos merely because they are publicly viewable.
- For Creative Commons Attribution material, record creator, title, source URL, license version, and modifications.
- For MIT- or Apache-licensed code excerpts, preserve required notices and pin the referenced commit. Verify whether non-code assets use a different license.
- Prefer redrawing a simple chart from lawfully reusable data, with attribution and documented transformations, over screenshotting a paper figure.
- Link rather than reproduce when image or attachment rights are unclear.
- Follow current Anthropic and OpenAI brand and usage rules at the time of publication; record the policy URL and observation date in the master figure ledger.
- Do not imply product endorsement, partnership, or official course status.
- Do not publish raw user transcripts. Obtain informed permission for any participant data and define minimization, retention, access, and deletion.

These are conservative publication controls, not a legal opinion. Ambiguous cases require rights-holder permission or qualified legal review.

### 10.6 Figure acceptance checklist

A figure is publishable only if every answer is yes:

- Is it an authentic, authorized capture or a verified licensed official asset?
- Is the source, date, product surface, and version state recorded?
- Does the figure teach a specific interaction or decision?
- Are all identities, secrets, private paths, private code, and irrelevant account details removed?
- Was the flattened output inspected at full resolution and for embedded metadata?
- Are copyright, asset-license, trademark, and brand conditions recorded?
- Is the caption accurate about cropping, redaction, and annotation?
- Does the alt text communicate the instructional state and outcome?
- Can a reviewer reproduce the workflow in a course-controlled demo?
- Has the screenshot been checked against the current interface before release?

## 11. Reproducible course-control architecture

A recommended lab and production pattern is:

1. **Input boundary:** sanitize and label issue text, comments, repository content, web material, and tool output as untrusted.
2. **Read-only analysis:** permit inspection and planning without write, merge, deploy, or broad credential authority.
3. **Structured proposal:** require a schema containing scope, assumptions, planned files, commands, tests, risks, and escalation needs.
4. **Human decision:** approve the plan and exact consequential permissions.
5. **Isolated implementation:** use an ephemeral environment or dedicated worktree with scoped tools, network, tokens, time, and cost.
6. **Independently controlled gates:** run formatting, linting, type checks, protected tests, security and dependency scans, policy checks, and forbidden-path validation; record flakiness, uncertainty, and configuration limits rather than treating every signal as deterministic proof.
7. **Independent review:** inspect the diff, trajectory evidence, requirements, non-functional effects, and residual risk.
8. **Separate integration:** merge or deploy through protected credentials and environments outside the agent process.
9. **Observe and recover:** monitor agreed signals, preserve audit evidence, and execute rollback when thresholds are crossed.
10. **Learn:** record accepted value, failures, rework, cost, and control performance; update the suite and guidance.

## 12. Limitations of this brief

1. The empirical literature is fast-moving and often studies model snapshots, clients, harnesses, or repositories that will age quickly.
2. Several large datasets are observational and subject to selection, survivorship, classification, missing-feedback, and external-validity limitations.
3. Tool-maintainer benchmarks and documentation are useful for reproducible patterns but are not independent comparative validation.
4. Security detectors have false positives and false negatives; an absence of detected actions is not proof of safety.
5. Public issue reports may be incomplete, duplicated, stale, misdiagnosed, or later fixed.
6. GitHub repository licenses do not necessarily cover papers, datasets, issue text, attachments, logos, screenshots, or linked third-party assets.
7. The released source ledger records the exact Claude Academy and OpenAI Academy resources used by the course, but it does not claim to audit every lesson in either Academy. Product mechanics and asset rights still require a current official-source refresh before major releases.
8. The course should disclose the evidence observation date and revisit numeric claims, interfaces, permissions, and policies before each major release.

## 13. Update triggers

Re-run the relevant source review when:

- a cited repository or paper materially changes;
- a product changes sandboxing, approvals, permissions, or trace storage;
- an Academy lesson or interface is updated;
- a cited dataset releases a new snapshot;
- a benchmark fixes or changes its grader;
- a maintainer changes its AI-contribution policy;
- a course screenshot no longer matches the live interface;
- a new security incident changes the threat model;
- a license or asset-use policy changes.

## 14. Source register

The companion provenance file records source class, publisher, date, rights, use, and limitations for every URL. The following IDs are used in this brief:

- [E01] METR, Measuring Early-2025 AI on Experienced Open-Source Developer Productivity: https://github.com/METR/Measuring-Early-2025-AI-on-Exp-OSS-Devs
- [E02] SWE-chat repository: https://github.com/SALT-NLP/SWE-chat
- [E03] SWE-chat dataset: https://huggingface.co/datasets/SALT-NLP/SWE-chat
- [E04] SWE-chat paper: https://arxiv.org/abs/2604.20779
- [E05] Coding Agents in the Wild replication repository: https://github.com/mahdhindi/coding-agents-wild
- [E06] Coding Agents in the Wild paper DOI: https://doi.org/10.1109/ACCESS.2026.3696573
- [E07] Coding Agent Security Debt repository: https://github.com/microsoft/coding-agent-security-debt
- [E08] Coding Agent Security Debt paper: https://openreview.net/pdf?id=k6QhzThVSS
- [E09] Agent Library Usage repository: https://github.com/itsluketwist/agent-library-usage
- [E10] Context Files for Coding Agents paper and replication package: https://arxiv.org/abs/2607.27250 and https://github.com/codeprakhar25/context-files-coding-agents
- [E11] SWE-bench repository: https://github.com/SWE-bench/SWE-bench
- [E12] SWE-bench grading implementation: https://github.com/SWE-bench/SWE-bench/blob/main/swebench/harness/grading.py
- [E13] SWE-bench evaluator issue 538: https://github.com/SWE-bench/SWE-bench/issues/538
- [E14] SWE-agent trajectory documentation: https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/trajectories.md
- [E15] SWE-agent trajectory inspector: https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/inspector.md
- [E16] SWE-agent command-line tutorial and cost controls: https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/cl_tutorial.md
- [E17] Aider repository: https://github.com/Aider-AI/aider
- [E18] Aider repository map documentation: https://github.com/Aider-AI/aider/blob/main/aider/website/docs/repomap.md
- [E19] Aider benchmark documentation: https://github.com/Aider-AI/aider/blob/main/benchmark/README.md
- [E20] Aider command and workflow documentation: https://github.com/Aider-AI/aider/blob/main/aider/website/docs/usage/commands.md
- [E21] OpenHands benchmarks: https://github.com/OpenHands/benchmarks
- [E22] OpenHands security implementation notes: https://github.com/OpenHands/OpenHands/blob/main/openhands/security/README.md
- [E23] VS Code Copilot instructions: https://github.com/microsoft/vscode/blob/main/.github/copilot-instructions.md
- [E24] VS Code Jupyter AI-Ready guidance: https://github.com/microsoft/vscode-jupyter/wiki/AI-Ready
- [E25] GitHub Agentic Workflows repository: https://github.com/github/gh-aw
- [E26] GitHub Agentic Workflows architecture: https://github.com/github/gh-aw/blob/main/docs/src/content/docs/introduction/architecture.mdx
- [E27] GitHub Agentic Workflows security and implementation rules: https://github.com/github/gh-aw/blob/main/.github/aw/github-agentic-workflows.md
- [E28] Claude Code Action security documentation: https://github.com/anthropics/claude-code-action/blob/main/docs/security.md
- [E29] OpenAI Codex Action repository: https://github.com/openai/codex-action
- [E30] OpenAI Codex approval protocol documentation: https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md
- [E31] OpenAI Codex rollout-trace documentation: https://github.com/openai/codex/blob/main/codex-rs/rollout-trace/README.md
- [E32] Entire CLI repository: https://github.com/entireio/cli
- [E33] curl contribution policy: https://github.com/curl/curl/blob/master/docs/CONTRIBUTE.md
- [E34] Qiskit contribution policy (revision current on 2026-08-23): https://github.com/Qiskit/qiskit/blob/1977d1aa7d0a3a9212c07707929453a73788d8b0/CONTRIBUTING.md#use-of-generative-ai
- [E35] pytest contribution policy: https://github.com/pytest-dev/pytest/blob/main/CONTRIBUTING.rst
- [E36] DORA repository: https://github.com/dora-team/dora.dev
- [E37] DORA 2025 report: https://dora.dev/research/2025/dora-report/
- [E38] Claude Code issue 61519, case-study-only: https://github.com/anthropics/claude-code/issues/61519
- [E39] Claude Code issue 14081, case-study-only: https://github.com/anthropics/claude-code/issues/14081
- [E40] OpenAI Codex issue 8759, case-study-only: https://github.com/openai/codex/issues/8759

## 15. Bottom line for Course 8

Course 8 should graduate engineers who can use coding agents without surrendering engineering judgment. The learner should be able to scope a task, make the repository legible, choose an autonomy level, plan and implement in reversible isolation, validate independently, defend the execution environment, review and integrate responsibly, operate the result, measure local value, and explain every consequential decision.

The course’s signature should be visible evidence—not confident narration.
