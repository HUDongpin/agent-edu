export const SOFTWARE_ENGINEERING_CAPSTONE_SCHEMA_VERSION = "1.0.0" as const;
export const SOFTWARE_ENGINEERING_CAPSTONE_PROGRESS_KEY =
  "softwareEngineering.capstone.v1" as const;

export const SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACT_IDS = [
  "requirements-risk-contract",
  "architecture-decision-package",
  "repository-run-manifest",
  "reviewable-implementation-history",
  "independent-verification-package",
  "security-privacy-supply-chain-review",
  "release-operations-package",
  "human-review-evaluation-decision",
] as const;

export type SoftwareEngineeringCapstoneArtifactId =
  (typeof SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACT_IDS)[number];

export interface SoftwareEngineeringCapstoneArtifact {
  readonly id: SoftwareEngineeringCapstoneArtifactId;
  readonly title: string;
  readonly purpose: string;
  readonly requiredEvidence: readonly [string, ...string[]];
  readonly rejectIf: readonly [string, ...string[]];
  readonly sourceIds: readonly [string, ...string[]];
}

/** Exactly eight inspectable submissions form the capstone evidence package. */
export const SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACTS = [
  {
    id: "requirements-risk-contract",
    title: "Requirements and risk contract",
    purpose: "Prove that the learner framed the right problem and bounded the agent's mandate before implementation.",
    requiredEvidence: [
      "Named stakeholders and accountable human owner; problem statement; in-scope and out-of-scope behavior.",
      "Traceable functional requirements, quality attributes, constraints, assumptions, priorities, and acceptance criteria.",
      "Risk register with likelihood, impact, treatment, owner, escalation triggers, and explicit non-goals.",
      "A requirement-to-test traceability table and an approved definition of done.",
    ],
    rejectIf: [
      "Success is expressed only as an agent instruction or subjective request.",
      "A material ambiguity, affected stakeholder, non-functional requirement, or decision owner is missing.",
    ],
    sourceIds: ["swebok-v4", "openai-codex-best-practices", "anthropic-code-best-practices"],
  },
  {
    id: "architecture-decision-package",
    title: "Architecture view and decision package",
    purpose: "Make design boundaries and consequential trade-offs reviewable before code narrows the options.",
    requiredEvidence: [
      "A system-context view plus the containers or components touched, their interfaces, data ownership, dependencies, and deployment boundary.",
      "At least two credible options evaluated against named quality attributes, failure modes, concurrency and data concerns, and operational consequences.",
      "An architecture decision record with context, decision, alternatives, consequences, reversibility, and accountable approval.",
      "Compatibility, accessibility, build-versus-buy, and migration implications where applicable.",
    ],
    rejectIf: [
      "The artifact merely restates the generated implementation.",
      "A consequential architecture choice has no trade-off analysis or human approval.",
    ],
    sourceIds: ["swebok-v4", "openai-exec-plans", "wcag-22"],
  },
  {
    id: "repository-run-manifest",
    title: "Repository, context, and run manifest",
    purpose: "Make the work reproducible and establish the exact authority and information available to each agent run.",
    requiredEvidence: [
      "Repository URL, immutable commit, clean or dirty pre-state, branch or worktree, dependency lock state, build environment, and task identifier.",
      "Agent product, model or snapshot when exposed, client and harness versions, instruction and context file hashes, enabled tools, and stopping conditions.",
      "Filesystem, command, network, credential, approval, time, and cost boundaries; redaction, retention, and access policy for traces.",
      "Chronological run and intervention log with prompts or task contracts, actions, observations, checkpoints, failures, steering, exit reason, and artifact locations.",
    ],
    rejectIf: [
      "The repository state, permissions, or configuration cannot be reconstructed.",
      "The record contains live secrets or omits a material human intervention or failed attempt.",
    ],
    sourceIds: ["swe-agent-trajectories", "anthropic-context-engineering", "openai-codex-worktrees"],
  },
  {
    id: "reviewable-implementation-history",
    title: "Reviewable implementation history",
    purpose: "Show a coherent construction process whose changes can be understood, integrated, or reversed.",
    requiredEvidence: [
      "Small, scoped commits or checkpoints linked to requirements, with the complete diff and a list of generated, modified, and deleted files.",
      "Evidence of repository conventions, language idioms, types and input validation, error handling, configuration, resource and concurrency behavior.",
      "Dependency decisions with identity, source, necessity, license, version and lockfile treatment; compatibility, deprecation, and migration notes.",
      "A documented steering or correction event and a demonstrated recovery from a poor or risky intermediate state.",
    ],
    rejectIf: [
      "Unrelated rewrites, unexplained generated code, invented APIs, or unauthorized files remain in the change.",
      "The change cannot be rolled back or separated from unrelated work.",
    ],
    sourceIds: ["swebok-v4", "openai-codex-worktrees", "agent-library-usage"],
  },
  {
    id: "independent-verification-package",
    title: "Independent verification package",
    purpose: "Demonstrate correctness and quality with evidence that is not reducible to the author's or agent's completion claim.",
    requiredEvidence: [
      "Original failing reproduction or acceptance baseline, an observation-and-hypothesis log, root-cause account, and the preserved regression case.",
      "Risk-appropriate unit, component, integration, contract, end-to-end, acceptance, regression, compatibility, accessibility, performance, and security checks, with justified omissions.",
      "Protected or independently authored checks, a forbidden-path or unauthorized-change audit, exact commands, environment, raw results, and relevant full-suite evidence.",
      "Flake treatment, coverage interpretation, unresolved failures, residual quality gaps, and a verifier identity distinct from sole authorship.",
    ],
    rejectIf: [
      "Only agent-authored tests or an agent-written summary are submitted as proof.",
      "A failing check is hidden by retries, deletion, changed grading assets, or an undocumented exclusion.",
    ],
    sourceIds: ["swe-bench", "swebok-v4", "openai-codex-code-review", "wcag-22"],
  },
  {
    id: "security-privacy-supply-chain-review",
    title: "Security, privacy, and supply-chain review",
    purpose: "Assess both the produced artifact and the agent's action trajectory under an explicit threat model.",
    requiredEvidence: [
      "Assets, trust boundaries, actors, abuse cases, and controls for prompt injection, malicious repository text, tool poisoning, excessive agency, unsafe shell, and data exfiltration.",
      "Authentication and authorization, least privilege, secret and network handling, validation, logging, privacy minimization, retention, and trace access decisions.",
      "Dependency and external-tool inventory, license checks, SAST, DAST or SCA evidence as applicable, SBOM, artifact digest, signing or build provenance, and vulnerability response owner.",
      "Action-trace review with findings, severity, disposition, false-negative limits, remediations, and independent re-verification.",
    ],
    rejectIf: [
      "Review is limited to the final code diff or treats a clean scanner report as proof of safety.",
      "A credential exposure, unauthorized network action, dependency uncertainty, or critical finding is unresolved.",
    ],
    sourceIds: ["nist-ssdf", "owasp-llm-top10", "slsa-provenance", "microsoft-security-debt"],
  },
  {
    id: "release-operations-package",
    title: "Release and operations package",
    purpose: "Show that the accepted change can be built, delivered, observed, recovered, and operated safely.",
    requiredEvidence: [
      "Reproducible build and CI record, immutable artifact identity, environment and configuration inventory, and protected approval path.",
      "Deployment and migration plan using appropriate staging, feature flags, canary or blue-green controls, compatibility windows, stop conditions, and change communication.",
      "A rehearsed rollback or recovery record, backup restore evidence where relevant, disaster-recovery assumptions, and named incident roles.",
      "User-centered SLIs and SLOs, error-budget impact, logs, metrics, traces, dashboards, actionable alerts, runbook, capacity or cost evidence, and an operational acceptance test.",
    ],
    rejectIf: [
      "The only release evidence is a successful local build or agent claim.",
      "A migration has no safe intermediate state, rollback or recovery evidence, observability, or accountable deploy owner.",
    ],
    sourceIds: ["dora-continuous-delivery", "google-sre-book", "openai-harness-engineering"],
  },
  {
    id: "human-review-evaluation-decision",
    title: "Human review, evaluation, and release decision",
    purpose: "Close the lifecycle with accountable review, maintainable knowledge, calibrated autonomy, and an explicit go or no-go decision.",
    requiredEvidence: [
      "Pull-request package with requirement links, diff and risk summary, test and operational evidence, unresolved questions, CODEOWNERS or reviewer sign-off, and named final owner.",
      "Updated README or API documentation, ADRs, changelog, runbook, contribution-policy compliance, AI-use disclosure, third-party attribution, and license provenance.",
      "Evaluation card with representative tasks, baseline, recorded versions and frozen controllable inputs, repeated runs when feasible and decision-relevant—or a preregistered justified unrun design—independent checks, failures, uncertainty, human review and rework, elapsed time, cost, drift triggers, abstention, and escalation results.",
      "One recorded decision—release, release with conditions, or do not release—with gate evidence, residual risks, applicable conditions and expiry or an explicit not-applicable determination, rollback trigger, approver, and safety-boundary attestation.",
    ],
    rejectIf: [
      "The release decision is implicit, agent-authored without accountable approval, or based only on the rubric score.",
      "Documentation, disclosure, rights, evaluation failures, residual risks, or the applicable-conditions determination are omitted.",
    ],
    sourceIds: ["nist-ai-rmf", "openai-agent-evals", "pytest-ai-policy", "qiskit-ai-policy"],
  },
] as const satisfies readonly SoftwareEngineeringCapstoneArtifact[];

export const SOFTWARE_ENGINEERING_CAPSTONE_RUBRIC = [
  {
    id: "requirements-design",
    title: "Requirements and design",
    weight: 20,
    highPerformanceEvidence: "Traceable scope and acceptance, explicit risk and quality attributes, coherent architecture alternatives, and an approved decision with understood consequences.",
  },
  {
    id: "implementation",
    title: "Implementation",
    weight: 20,
    highPerformanceEvidence: "Correct, minimal, idiomatic, maintainable construction with disciplined dependencies, configuration, compatibility, checkpoints, and reviewable history.",
  },
  {
    id: "verification",
    title: "Verification",
    weight: 25,
    highPerformanceEvidence: "Reproducible diagnosis, discriminating regression, risk-appropriate functional and non-functional tests, independent protected checks, raw results, and honest residual gaps.",
  },
  {
    id: "delivery-operations",
    title: "Delivery and operations",
    weight: 20,
    highPerformanceEvidence: "Reproducible CI artifact, staged release and migration, rehearsed rollback or recovery, observability, reliability objectives, runbook, and operational acceptance.",
  },
  {
    id: "responsible-agency",
    title: "Responsible agency",
    weight: 15,
    highPerformanceEvidence: "Least privilege, trajectory and supply-chain review, privacy and rights treatment, role separation, disclosure, repeatable evaluation, named ownership, calibrated escalation, and an explicit release decision.",
  },
] as const;

export type SoftwareEngineeringCapstoneRubricId =
  (typeof SOFTWARE_ENGINEERING_CAPSTONE_RUBRIC)[number]["id"];

export const SOFTWARE_ENGINEERING_CAPSTONE_TOTAL_POINTS = 100 as const;
export const SOFTWARE_ENGINEERING_CAPSTONE_PASSING_SCORE = 80 as const;

export const SOFTWARE_ENGINEERING_RELEASE_DECISIONS = [
  "release",
  "release-with-conditions",
  "do-not-release",
] as const;

export type SoftwareEngineeringReleaseDecision =
  (typeof SOFTWARE_ENGINEERING_RELEASE_DECISIONS)[number];

export interface SoftwareEngineeringCapstoneSubmission {
  readonly schemaVersion: typeof SOFTWARE_ENGINEERING_CAPSTONE_SCHEMA_VERSION;
  readonly completed: true;
  readonly artifactIds: readonly SoftwareEngineeringCapstoneArtifactId[];
  readonly reviewedGateIds: readonly string[];
  readonly score: number;
  readonly decision: SoftwareEngineeringReleaseDecision;
  readonly safetyBoundaryAttested: true;
}

export const SOFTWARE_ENGINEERING_CAPSTONE_RELEASE_GATES = [
  {
    id: "scope-and-acceptance",
    question: "I reviewed the approved scope, acceptance criteria, and requirement links, and recorded every unsatisfied criterion or unauthorized change in the decision.",
  },
  {
    id: "independent-quality",
    question: "I reviewed independent functional and non-functional checks, and recorded every failure, gap, and unsupported outcome claim in the decision.",
  },
  {
    id: "security-and-rights",
    question: "I reviewed security, privacy, supply-chain, licensing, and provenance findings, and recorded every blocker or explicit rejection from release.",
  },
  {
    id: "operational-readiness",
    question: "I reviewed artifact, deployment, observability, migration, rollback, recovery, and ownership evidence, and recorded every readiness gap.",
  },
  {
    id: "accountable-decision",
    question: "I confirmed that an authorized human recorded the decision, residual risk, rollback trigger, and any applicable conditions and expiry—or explicitly recorded that conditions are not applicable; every missing required determination is recorded as a blocker.",
  },
] as const;

export type SoftwareEngineeringCapstoneGateId =
  (typeof SOFTWARE_ENGINEERING_CAPSTONE_RELEASE_GATES)[number]["id"];

export function isSoftwareEngineeringCapstoneSubmission(
  value: unknown,
): value is SoftwareEngineeringCapstoneSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const submission = value as Partial<SoftwareEngineeringCapstoneSubmission>;
  return submission.schemaVersion === SOFTWARE_ENGINEERING_CAPSTONE_SCHEMA_VERSION
    && submission.completed === true
    && Array.isArray(submission.artifactIds)
    && submission.artifactIds.length === SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACT_IDS.length
    && SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACT_IDS.every(
      (id) => submission.artifactIds?.includes(id),
    )
    && Array.isArray(submission.reviewedGateIds)
    && submission.reviewedGateIds.length === SOFTWARE_ENGINEERING_CAPSTONE_RELEASE_GATES.length
    && SOFTWARE_ENGINEERING_CAPSTONE_RELEASE_GATES.every(
      (gate) => submission.reviewedGateIds?.includes(gate.id),
    )
    && typeof submission.score === "number"
    && Number.isInteger(submission.score)
    && submission.score >= SOFTWARE_ENGINEERING_CAPSTONE_PASSING_SCORE
    && submission.score <= SOFTWARE_ENGINEERING_CAPSTONE_TOTAL_POINTS
    && SOFTWARE_ENGINEERING_RELEASE_DECISIONS.includes(
      submission.decision as SoftwareEngineeringReleaseDecision,
    )
    && submission.safetyBoundaryAttested === true;
}

export const SOFTWARE_ENGINEERING_CAPSTONE_SAFETY_BOUNDARY = {
  delegatedScope: "Agents may inspect, analyze, propose, test, document, and edit only within the recorded repository, tool, data, network, and approval boundaries.",
  protectedAuthority: "An agent may not independently obtain or exercise production deployment, merge approval, secret access, destructive or irreversible action, or external-communication authority. Each such action requires specific authorization through the named human-owned control path.",
  nonDelegableHumanJudgment: "Legal acceptance, residual-risk acceptance, and the accountable release decision remain human judgments. An agent may assemble evidence or draft a recommendation, but it cannot own or grant that acceptance.",
  protectedEvidence: "Hidden tests, grading logic, release credentials, approval records, and canonical evidence must remain outside the agent-writable boundary.",
  mandatoryStop: [
    "A requirement or architecture ambiguity could materially change safety, rights, cost, data handling, or user impact.",
    "The run requests broader permissions, credentials, network access, or destructive action than the approved contract permits.",
    "An unexpected or out-of-scope diff, secret exposure, evaluator modification, critical finding, or unverifiable outcome is discovered.",
    "Rollback or recovery is unavailable for a consequential change, or the named accountable owner cannot review the evidence.",
  ],
  nonAuthorizationRule: "Passing the quiz or earning 80 points does not authorize merge or release and cannot override a blocking safety, legal, privacy, security, or operational finding.",
} as const;

export const SOFTWARE_ENGINEERING_CAPSTONE = {
  schemaVersion: SOFTWARE_ENGINEERING_CAPSTONE_SCHEMA_VERSION,
  title: "Ship one safe agent-assisted change",
  validationBoundary: "This browser control is a local self-attested progress checklist. It does not upload, inspect, hash, reproduce, or validate your capstone dossier, and completing it never authorizes a merge, release, deployment, or risk acceptance. Use the downloadable brief to create the external evidence package and obtain the named independent and human reviews.",
  briefHref: "/courses/software-engineering/agentic-se-capstone-brief.md",
  artifactIds: SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACT_IDS,
  artifacts: SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACTS,
  rubric: SOFTWARE_ENGINEERING_CAPSTONE_RUBRIC,
  totalPoints: SOFTWARE_ENGINEERING_CAPSTONE_TOTAL_POINTS,
  passingScore: SOFTWARE_ENGINEERING_CAPSTONE_PASSING_SCORE,
  releaseDecisions: SOFTWARE_ENGINEERING_RELEASE_DECISIONS,
  releaseGates: SOFTWARE_ENGINEERING_CAPSTONE_RELEASE_GATES,
  safetyBoundary: SOFTWARE_ENGINEERING_CAPSTONE_SAFETY_BOUNDARY,
  progressKey: SOFTWARE_ENGINEERING_CAPSTONE_PROGRESS_KEY,
} as const;
