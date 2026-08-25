# Course 8 capstone: ship one safe agent-assisted change

**Course:** Software Engineering with Agentic AI  
**Capstone version:** 1.0.0  
**Evidence snapshot:** 2026-08-23  
**Passing score:** 80/100  
**Required submissions:** exactly eight auditable artifacts

## The assignment

Take one bounded software change from problem framing to an evidence-backed release decision. The change may be a feature, defect repair, dependency or platform migration, reliability improvement, accessibility correction, or carefully scoped refactor. Use an agent for at least one meaningful engineering activity, but keep a named human accountable for scope, architecture, protected actions, review, and the final decision.

Use a repository that you own or are explicitly authorized to modify. A course sandbox is preferred. Do not use production credentials, personal data, unpublished employer code, or third-party material that you cannot lawfully submit. A release decision in this capstone is an evaluated decision record; it is **not** authorization to deploy to a real service.

Your goal is not to maximize agent autonomy or generated code. Your goal is to produce a change that another engineer can understand, reproduce, challenge, operate, and safely reject or release.

## Non-negotiable safety boundary

An agent may inspect, analyze, propose, test, document, and edit only within the filesystem, tool, data, network, command, and approval boundaries recorded in your run manifest.

An agent may not independently obtain or exercise the following authority. Each action requires specific authorization through the named human-owned control path:

- merging or deploying to a protected environment;
- accessing or revealing secrets, personal data, or restricted source;
- destructive or difficult-to-reverse commands;
- changing production data, infrastructure, identity, or access control;
- contacting users, maintainers, vendors, or any external party;
- changing protected evaluation or approval records.

Legal acceptance and residual-risk acceptance always remain accountable human judgments. An agent may assemble evidence or draft a recommendation, but it cannot own, grant, or impersonate that acceptance.

Hidden tests, grading logic, approval records, release credentials, and canonical evidence must remain outside the agent-writable workspace.

Stop and escalate when:

- ambiguity could materially change safety, rights, cost, data handling, architecture, or user impact;
- broader permissions, credentials, network access, or destructive action are requested;
- an unexpected or out-of-scope diff, evaluator change, secret exposure, critical finding, or unverifiable claim appears;
- consequential work has no credible rollback or recovery path;
- the accountable owner cannot inspect the evidence.

A passing quiz or capstone score never overrides one of these boundaries.

## Evidence rules

1. Grade the accepted engineering outcome, not conversational fluency or generated volume.
2. Preserve failed attempts, corrections, steering, and unresolved risks. A success-only transcript is incomplete evidence.
3. Record exact repository state, commands, environment, versions, permissions, and raw results. A narrative that says “tests passed” is not a test record.
4. Use independent checks. The same agent must not be the sole author, verifier, and approver.
5. Keep grading assets and protected checks beyond the agent's write authority.
6. Assess functional and non-functional quality: security, privacy, accessibility, reliability, performance, compatibility, maintainability, and operability where relevant.
7. Reward justified abstention. A well-supported **do not release** decision can earn full credit.
8. Redact secrets and personal or proprietary data before submission. Record what was redacted and why.

## The eight required artifacts

Submit one folder or archive with the following eight artifacts. Each artifact may contain several files, but it counts as one coherent evidence package. Use stable filenames, relative links, and cryptographic hashes for large or external records.

### 1. Requirements and risk contract

Suggested filename: `01-requirements-risk-contract.md`

Include:

- problem statement, named stakeholders, accountable human owner, and expected user or operator outcome;
- in-scope behavior, non-goals, exclusions, assumptions, constraints, dependencies, and change-control rule;
- traceable functional requirements and non-functional requirements, including relevant accessibility, reliability, performance, security, privacy, compatibility, and operability targets;
- acceptance criteria expressed as inspectable outcomes, not instructions to the agent;
- a requirement-to-test traceability table;
- a risk register with likelihood, impact, evidence, mitigation, owner, escalation trigger, and disposition;
- an approved definition of done and an explicit initial autonomy level.

This artifact fails its gate if success is only subjective, a material stakeholder or quality attribute is omitted, or the agent is left to decide what the product should do.

### 2. Architecture view and decision package

Suggested folder: `02-architecture/`

Include:

- a system-context view and the containers or components affected by the change;
- interfaces, contracts, data ownership, dependencies, deployment topology, and trust boundaries;
- effects on modularity, coupling and cohesion, state, concurrency, resource use, and failure behavior;
- at least two credible options compared against named quality attributes and constraints;
- an architecture decision record with context, decision, alternatives, consequences, reversibility, and approver;
- build-versus-buy, dependency, compatibility, accessibility, migration, and operational implications where applicable.

A diagram without a decision is not enough. A consequential design selected only because an agent preferred it fails this gate.

### 3. Repository, context, and run manifest

Suggested files: `03-run-manifest.json` and `03-run-log.md`

Include:

- task identifier and immutable task contract;
- repository URL, commit SHA, initial dirty-state policy, branch or worktree, dependency lock state, build image or environment, and artifact locations;
- agent product, model or model snapshot when exposed, client, harness, and tool versions;
- instruction and context files with hashes and a note explaining why each was included;
- filesystem, command, network, credential, approval, time, token or monetary cost, retry, and stopping boundaries;
- chronological actions and observations, prompts or task messages, checkpoints, failures, steering, human interventions, exit reason, and claimed outcome;
- trace access, redaction, privacy, retention, and deletion decisions.

Never place a live credential in this artifact. If the exact repository state and authority cannot be reconstructed, the run is not reproducible.

### 4. Reviewable implementation history

Suggested folder: `04-implementation/`

Include:

- small, scoped commits or checkpoints linked to the requirements they address;
- the complete final diff and an inventory of generated, modified, renamed, and deleted files;
- evidence that the change follows language idioms and repository conventions;
- treatment of naming, types, input validation, error paths, configuration, resource management, concurrency, compatibility, and deprecation;
- every dependency decision: identity, official source, necessity, API fit, maintenance, license, vulnerability status, version constraint, lockfile, integrity, and transitive implications;
- a documented correction or steering event;
- a demonstrated restore, revert, or recovery from a poor intermediate state.

Unrelated modernization, invented APIs, hidden generated files, or a history that cannot be reviewed and reversed fails this gate.

### 5. Independent verification package

Suggested folder: `05-verification/`

Include:

- the original failing reproduction or pre-change acceptance baseline;
- an observation and hypothesis log, minimization steps, root-cause account, and preserved regression case;
- risk-appropriate unit, component, integration, contract, end-to-end, acceptance, regression, property, fuzz, mutation, compatibility, accessibility, performance, and security checks, with reasons for any omitted category;
- a protected or independently authored check that would detect a plausible self-confirming implementation;
- a forbidden-path and unauthorized-change audit;
- exact commands, environment, test authorship, raw outputs, pre-fix and post-fix results, and relevant full-suite evidence;
- flake investigation, coverage interpretation, unresolved failures, residual gaps, and independent verifier identity.

Agent-authored tests are welcome but cannot be the only evidence. Retrying a flaky check until it passes, altering a grader, or omitting failed output fails this gate.

### 6. Security, privacy, and supply-chain review

Suggested folder: `06-assurance/`

Include:

- assets, actors, trust boundaries, abuse cases, likelihood, impact, and control owners;
- threats from prompt injection, malicious issue or repository text, tool poisoning, external tools or MCP servers, excessive agency, unsafe shell, data exfiltration, dependency hallucination, and CI privilege escalation;
- authentication, authorization, least privilege, secret handling, network and egress rules, input and output validation, logging, and cryptographic boundaries;
- data classification, minimization, retention, deletion, redaction, and access treatment for prompts, traces, code, and outputs;
- dependency and external-tool inventory, license review, SAST, DAST or SCA results as applicable, SBOM, artifact digest, signing or build provenance, and vulnerability-response owner;
- an action-trajectory review with findings, severity, disposition, scanner limitations, remediation, and independent re-verification.

A clean scanner report is a signal, not proof of safety. An unresolved credential exposure, unauthorized action, unknown dependency, critical vulnerability, or rights problem is a release blocker.

### 7. Release and operations package

Suggested folder: `07-release-operations/`

Include:

- reproducible build and CI evidence, immutable artifact identity, environment and configuration inventory, and protected approval path;
- deployment and migration sequence, compatibility window, feature flag or staged rollout strategy, canary or blue-green reasoning where appropriate, stop conditions, and change communication;
- a rehearsed rollback or recovery record, including backup restore evidence when data is affected;
- named incident roles, disaster-recovery assumptions, and a tested operational acceptance procedure;
- user-centered SLIs, SLOs, error-budget impact, failure modes, timeouts, retries, idempotency, backpressure, and graceful-degradation decisions where applicable;
- logs, metrics, traces, dashboards, actionable alerts, runbook, capacity evidence, and representative latency, throughput, resource, and cost measurements.

A local build alone is not release evidence. A change with no observable acceptance signal, owner, or tested recovery path fails this gate.

### 8. Human review, evaluation, and release decision

Suggested files: `08-review-evaluation.md` and `08-release-decision.yaml`

Include:

- a pull-request-style summary with requirement links, architecture decision, complete scope, diff summary, risks, validation and operational evidence, unresolved questions, and reviewer disposition;
- named human owner and independent reviewers, with CODEOWNERS or project ownership evidence where applicable;
- updated README, API documentation, ADRs, changelog, comments, diagrams, runbook, and onboarding material as the change requires;
- AI-use disclosure, project contribution-policy compliance, third-party attribution, license review, and provenance;
- an evaluation card covering the task population, missing tasks, baseline, frozen repository and controllable harness/tools/permissions, recorded model or product identifier and snapshot when exposed, observation time and known service variability, repetitions where feasible and decision-relevant, protected tests, functional and non-functional outcomes, unsafe actions, human review and rework, elapsed time, cost, failures, uncertainty, contamination, drift, abstention, and escalation;
- exactly one explicit decision: **release**, **release with conditions**, or **do not release**;
- decision owner, date, target environment, commit and artifact digest, gate results, residual risks, applicable conditions and expiry—or an explicit `not applicable` determination—rollback trigger, reevaluation trigger, and safety-boundary attestation.

The agent may prepare a draft, but an authorized human must own the decision. The rubric score is not a release credential.

## Release-decision template

```yaml
decision: release | release-with-conditions | do-not-release
decided_by: "Named accountable human"
decided_on: YYYY-MM-DD
target_environment: "sandbox, staging, or named release target"
repository_commit: "full commit SHA"
artifact_digest: "sha256:..."

gates:
  scope_and_acceptance: pass | fail
  independent_quality: pass | fail
  security_privacy_supply_chain_rights: pass | fail
  operational_readiness: pass | fail
  accountable_review: pass | fail

blocking_findings: []
residual_risks: []
conditions: []
conditions_expire_on: null
rollback_trigger: "Observable condition that requires rollback or safe stop"
reevaluation_trigger: "Change in requirements, dependencies, model, harness, policy, or evidence"
safety_boundary_attested: true
notes: "Why this decision follows from the submitted evidence"
```

Any failed gate or unresolved blocking finding requires **do not release**. A conditional release must name measurable conditions, owners, and an expiry; it cannot be used to waive a security, legal, privacy, rights, or recovery blocker.

The checklist on the course page is only a local self-attestation of progress. It does not upload or validate this dossier. The inspectable files, hashes, evidence references, gate outcomes, rationale, named approver, and decision record in this package are the assessable submission.

## Rubric: 100 points

| Dimension | Points | Evidence of excellent performance |
|---|---:|---|
| Requirements and design | 20 | Scope and acceptance are traceable; risks and quality attributes are explicit; alternatives are credible; the architecture decision is coherent, reversible where possible, and approved. |
| Implementation | 20 | The change is correct, minimal, idiomatic, maintainable, configuration-aware, compatible, dependency-disciplined, checkpointed, and easy to review or undo. |
| Verification | 25 | Diagnosis is reproducible; tests discriminate the outcome; protected independent checks cover functional and relevant non-functional quality; raw results, failures, flakes, and gaps are honest. |
| Delivery and operations | 20 | CI produces an identifiable artifact; rollout and migration are controlled; rollback or recovery is rehearsed; telemetry, SLOs, alerts, capacity evidence, runbook, and operational acceptance are ready. |
| Responsible agency | 15 | Permissions are minimal; trajectory, security, privacy, rights, and supply chain are reviewed; roles are separated; provenance and disclosure are complete; evaluation is repeated where feasible and decision-relevant, or the justified unrun limitation is recorded without expanding autonomy; a named human owns the decision. |
| **Total** | **100** | |

You pass at **80/100** only if all eight artifacts are present. A missing artifact, fabricated evidence, altered protected grader, undisclosed secret exposure, or unresolved blocking finding prevents completion regardless of the arithmetic score.

No points are awarded merely for using a more autonomous mode. Appropriate interruption, abstention, rollback, escalation, or a well-evidenced **do not release** decision can demonstrate stronger engineering than uninterrupted completion.

## Coverage audit

Together, the eight artifacts must make the following software-engineering domains visible rather than merely naming them:

| Domain | Primary artifact evidence |
|---|---|
| Foundations, lifecycle, professional responsibility, and human-agent modes | 1, 3, 8 |
| Requirements, estimation, project risk, traceability, and change control | 1, 8 |
| Architecture, design, data, interfaces, concurrency, and quality attributes | 2, 4 |
| Construction, build systems, configuration, dependencies, and version control | 3, 4 |
| Testing, quality assurance, debugging, review, and evaluator integrity | 5, 8 |
| Maintenance, refactoring, technical debt, compatibility, and documentation | 4, 5, 8 |
| Security, privacy, licensing, accessibility, ethics, and supply chain | 1, 2, 5, 6, 8 |
| CI/CD, releases, migrations, reliability, observability, incidents, and recovery | 7 |
| Performance, capacity, economics, delivery metrics, and sustainable flow | 1, 7, 8 |
| Team ownership, communication, governance, agent evaluation, and calibrated autonomy | 3, 8 |

## Evidence foundation

This capstone operationalizes, without reproducing, the following primary and practitioner sources:

- [SWEBOK Guide v4.0a](https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf) for the software-engineering lifecycle and knowledge areas.
- [OpenAI Academy: Codex for Builders](https://academy.openai.com/public/clubs/builders-etkn1/resources/codex-for-builders) and [Codex best practices](https://learn.chatgpt.com/guides/best-practices) for bounded context, planning, execution, and review.
- [Anthropic Academy: Claude Code tutorials](https://academy.claude.com/code/tutorials) and [Claude Code best practices](https://code.claude.com/docs/en/best-practices) for inspect-plan-act-verify workflows and steering.
- [NIST Secure Software Development Framework](https://csrc.nist.gov/Projects/ssdf) and [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) for secure development and accountable risk treatment.
- [DORA continuous delivery](https://dora.dev/capabilities/continuous-delivery/) and the [Google SRE book](https://sre.google/sre-book/table-of-contents/) for delivery, reliability, observability, and recovery.
- [SLSA provenance](https://slsa.dev/spec/v1.2/provenance) and OWASP's [2025 Top 10 Risk & Mitigations for LLMs and Gen AI Apps](https://genai.owasp.org/llm-top-10/) for supply-chain and agentic threat discovery.
- [SWE-bench](https://github.com/SWE-bench/SWE-bench) and [SWE-agent trajectories](https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/trajectories.md) for evaluator integrity and reproducible run evidence.

These sources are evidence inputs, not guarantees. Product behavior, repository policies, model snapshots, and operational risks change; record the versions you actually use and re-evaluate when they change.
