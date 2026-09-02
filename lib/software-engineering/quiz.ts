import {
  SOFTWARE_ENGINEERING_QUESTION_IDS,
  type SoftwareEngineeringQuestion,
  type SoftwareEngineeringQuestionId,
} from "./types";

export const SOFTWARE_ENGINEERING_QUIZ_BANK_VERSION = "2" as const;

/**
 * A scenario-based bank covering the full software lifecycle. Questions assess
 * engineering judgment and evidence, not recall of a vendor interface.
 */
export const SOFTWARE_ENGINEERING_QUIZ = [
  {
    id: "q01",
    unitId: "frame",
    question: "An agent reports that a feature is complete and that its new tests pass. What should the accountable engineer do first?",
    options: [
      "Merge because a passing self-authored test suite is sufficient evidence.",
      "Ask the same agent to restate its confidence more precisely.",
      "Compare the diff with the task contract, inspect its scope, and independently reproduce the relevant checks.",
      "Replace the implementation with a manually written version without reviewing it.",
    ],
    correctIndex: 2,
    explanation: "Agent output is a proposed change, not proof of completion. Accountability stays with the engineer, who must trace the diff to the agreed outcome and obtain independent, reproducible evidence.",
    sourceIds: ["swebok-v4", "openai-harness-engineering", "anthropic-code-agent-loop"],
  },
  {
    id: "q02",
    unitId: "frame",
    question: "Which task contract best turns an ambiguous request into an engineering requirement?",
    options: [
      "A one-line prompt naming the preferred programming language.",
      "A stakeholder and scope statement with functional and non-functional requirements, constraints, exclusions, acceptance evidence, traceability, and escalation triggers.",
      "A long list of implementation steps with no user outcome.",
      "A request to make the system better while preserving everything.",
    ],
    correctIndex: 1,
    explanation: "A usable contract defines whose problem is being solved, what is in and out of scope, how quality will be judged, and when ambiguity or risk must return to a human decision-maker.",
    sourceIds: ["swebok-v4", "openai-codex-best-practices", "anthropic-code-best-practices"],
  },
  {
    id: "q03",
    unitId: "frame",
    question: "A proposed change improves throughput but weakens consistency and complicates recovery. What is the sound architecture response?",
    options: [
      "Choose throughput because it is the only measurable quality attribute.",
      "Let the agent select whichever option requires the smallest diff.",
      "Implement both designs in production and keep the faster one.",
      "Record alternatives, quality-attribute trade-offs, interfaces, failure modes, and the decision in an ADR before an accountable approval.",
    ],
    correctIndex: 3,
    explanation: "Architecture is a set of consequential trade-offs. An ADR makes the context, alternatives, quality attributes, consequences, and owner inspectable before code commits the organization to a design.",
    sourceIds: ["swebok-v4", "openai-exec-plans"],
  },
  {
    id: "q04",
    unitId: "frame",
    question: "How should a team estimate an unfamiliar agent-assisted migration?",
    options: [
      "Give a range tied to assumptions, dependencies, risk, validation work, and small milestones, then update the forecast as evidence arrives.",
      "Use the agent's generation time as the total project estimate.",
      "Count generated lines of code and convert them directly into engineer-days.",
      "Promise the best-case date because agents remove uncertainty.",
    ],
    correctIndex: 0,
    explanation: "Forecasts should expose uncertainty and include review, integration, migration, verification, and recovery—not only draft-generation time. Incremental evidence should revise the estimate.",
    sourceIds: ["swebok-v4", "dora-ai-report-2025", "metr-productivity-study"],
  },
  {
    id: "q05",
    unitId: "frame",
    question: "An agent is asked to change a production database schema. Which autonomy boundary is appropriate?",
    options: [
      "Grant unrestricted production access so the agent can recover from any mistake.",
      "Allow deployment whenever the generated migration passes its own tests.",
      "Let the agent analyze and prepare a reversible migration in an isolated environment, while a named human approves protected execution and rollback criteria.",
      "Forbid all agent involvement, including read-only analysis.",
    ],
    correctIndex: 2,
    explanation: "Reasoning and preparation can be delegated without delegating production authority. Least privilege, protected environments, explicit approval, and rehearsed rollback keep consequential action accountable.",
    sourceIds: ["openai-codex-approvals", "anthropic-code-permissions", "nist-ssdf"],
  },
  {
    id: "q06",
    unitId: "shape",
    question: "What is the correct role of an AGENTS.md, CLAUDE.md, or similar repository instruction file?",
    options: [
      "It is a security boundary that prevents prohibited commands.",
      "It supplies concise, scoped orientation and canonical commands; protected permissions, tests, CI, and policy enforcement must provide independently controlled boundaries.",
      "It should contain every fact about the system so no retrieval is needed.",
      "It guarantees a measurable correctness gain on every task.",
    ],
    correctIndex: 1,
    explanation: "Repository guidance can reduce ambiguity and point to canonical sources, but it remains advisory context. Enforceable boundaries require protected permissions, tooling, tests, CI, branch or environment controls, or managed policy.",
    sourceIds: ["anthropic-context-engineering", "context-files-study", "vscode-agent-instructions"],
  },
  {
    id: "q07",
    unitId: "shape",
    question: "What does a Git worktree provide when several agents work in parallel?",
    options: [
      "A separate repository history that cannot conflict with other work.",
      "Automatic semantic merging of overlapping changes.",
      "Permission isolation from the host and network.",
      "A separate working directory and index sharing repository history; ownership, overlap, review, and integration still require coordination.",
    ],
    correctIndex: 3,
    explanation: "Worktrees reduce file-level interference and make parallel diffs inspectable, but they do not resolve shared dependencies, conflicting intent, authorization, or merge responsibility.",
    sourceIds: ["openai-codex-worktrees", "openai-codex-app", "swebok-v4"],
  },
  {
    id: "q08",
    unitId: "shape",
    question: "Which implementation proposal is most reviewable?",
    options: [
      "A minimal, idiomatic diff that follows repository conventions, validates inputs, explains error paths and compatibility, and adds focused evidence.",
      "A broad rewrite that also modernizes unrelated modules.",
      "A patch that invents a convenient API because documentation was unclear.",
      "A generated implementation whose only explanation is that the model was confident.",
    ],
    correctIndex: 0,
    explanation: "Small coherent changes make correctness, error handling, compatibility, and rollback easier to inspect. Existing interfaces and repository conventions should be verified rather than guessed.",
    sourceIds: ["swebok-v4", "openai-codex-best-practices", "anthropic-code-best-practices"],
  },
  {
    id: "q09",
    unitId: "shape",
    question: "An agent proposes adding a new package to save twenty lines of code. What review is required?",
    options: [
      "Accept it if the package name looks familiar.",
      "Accept it whenever the package is open source.",
      "Verify identity and source, necessity, API and maintenance fit, license, vulnerabilities, version constraints, lockfile and integrity data, and transitive risk.",
      "Reject every dependency because reuse is not software engineering.",
    ],
    correctIndex: 2,
    explanation: "A dependency is a lasting architecture, security, legal, reliability, and maintenance decision. Its small local code saving does not remove supply-chain or total-cost obligations.",
    sourceIds: ["agent-library-usage", "nist-ssdf", "slsa-provenance"],
  },
  {
    id: "q10",
    unitId: "shape",
    question: "A payment handler may be retried after a timeout. Which design most directly prevents duplicate charges?",
    options: [
      "Increase the client timeout until retries never occur.",
      "Define an idempotency contract and durable request identity, model the operation as explicit state transitions, then test concurrency, retry, and partial-failure behavior.",
      "Ask the agent to avoid race conditions without specifying system behavior.",
      "Log every request but leave processing unchanged.",
    ],
    correctIndex: 1,
    explanation: "Concurrency and partial failure require an explicit behavioral contract. An invariant and finite-state model make allowed transitions inspectable; idempotency, durable request identity, and tests across retry interleavings address the failure mode rather than merely hiding it.",
    sourceIds: ["swebok-v4", "google-sre-book"],
  },
  {
    id: "q11",
    unitId: "verify",
    question: "An agent fixes a defect and writes a test that passes. What is the strongest next verification step?",
    options: [
      "Measure the number of new assertions.",
      "Ask the agent whether the test would have failed before its patch.",
      "Rerun only the new test until it passes twice.",
      "Reproduce the original failure, confirm a discriminating regression fails on the pre-fix state, then run independent protected checks and the relevant wider suite.",
    ],
    correctIndex: 3,
    explanation: "A regression test must discriminate the defect, and evidence should not be authored and judged solely by the same agent. Wider checks detect collateral behavior beyond the narrow fix.",
    sourceIds: ["swe-bench", "openai-codex-code-review", "swebok-v4"],
  },
  {
    id: "q12",
    unitId: "verify",
    question: "What is the most reliable first phase of debugging an intermittent failure?",
    options: [
      "Freeze relevant state, reproduce and minimize the failure, collect observations, and rank falsifiable hypotheses before editing.",
      "Apply the most plausible patch and look for supporting evidence afterward.",
      "Rewrite the subsystem so the original failure can no longer be reproduced.",
      "Increase retries and close the issue if CI turns green.",
    ],
    correctIndex: 0,
    explanation: "Diagnosis separates observations from hypotheses and preserves the failing case. Reproduction and minimization reduce confirmation bias and provide a basis for regression prevention.",
    sourceIds: ["swebok-v4", "anthropic-code-best-practices", "swe-agent-trajectories"],
  },
  {
    id: "q13",
    unitId: "verify",
    question: "Why should the same agent not be the sole author, verifier, and approver of a consequential change?",
    options: [
      "Because agents cannot read diffs.",
      "Because only a manager may run tests.",
      "Because correlated assumptions and self-confirming checks can survive; independent evidence and accountable approval create distinct control layers.",
      "Because a second agent always finds every defect.",
    ],
    correctIndex: 2,
    explanation: "Role separation reduces common-mode failure, but another agent is not automatically independent proof. Protected tools, CI, domain review, and a named human decision remain necessary.",
    sourceIds: ["openai-codex-code-review", "github-agentic-workflows", "pytest-ai-policy"],
  },
  {
    id: "q14",
    unitId: "verify",
    question: "What should precede a large behavior-preserving refactor of poorly documented legacy code?",
    options: [
      "Rename and restructure first so the tests become easier to write.",
      "Establish characterization and contract tests, document compatibility boundaries, and separate structural changes from behavior changes.",
      "Delete old tests because they encode technical debt.",
      "Judge equivalence by comparing line counts before and after.",
    ],
    correctIndex: 1,
    explanation: "Maintenance needs a behavior baseline. Separating refactoring from functional change makes review, regression detection, deprecation, and rollback substantially more reliable.",
    sourceIds: ["swebok-v4", "openai-harness-engineering"],
  },
  {
    id: "q15",
    unitId: "verify",
    question: "A suite has high line coverage but a flaky end-to-end test and no accessibility or contract checks. What conclusion is justified?",
    options: [
      "Quality is proven because coverage is high.",
      "The flaky test can be ignored if retries usually pass.",
      "Only more unit tests are needed because all test types are interchangeable.",
      "Coverage is incomplete evidence; investigate nondeterminism and add risk-appropriate contract, accessibility, integration, and acceptance checks.",
    ],
    correctIndex: 3,
    explanation: "Coverage shows which code executed, not whether requirements or failure modes were adequately tested. Flakiness is an engineering signal, and non-functional acceptance requires its own evidence.",
    sourceIds: ["swebok-v4", "wcag-22", "swe-bench"],
  },
  {
    id: "q16",
    unitId: "deliver",
    question: "Which CI design best limits an agent analyzing untrusted issue text?",
    options: [
      "Run a least-privileged read-only analyzer, validate its structured proposal, scan it, and let a separately authorized job apply approved changes.",
      "Give the analysis job a long-lived write token so it can finish without interruption.",
      "Rely on prompt text telling the agent not to modify the repository.",
      "Permit unrestricted network access because the job is temporary.",
    ],
    correctIndex: 0,
    explanation: "Read and write authority should be separated. Least privilege, constrained egress, structured outputs, independent checks, and protected application reduce the impact of prompt injection or unsafe tool use.",
    sourceIds: ["github-agentic-workflows", "anthropic-claude-action-security", "openai-codex-action"],
  },
  {
    id: "q17",
    unitId: "deliver",
    question: "What is the safest release plan for a backward-incompatible data migration?",
    options: [
      "Deploy schema and application changes simultaneously with no intermediate compatibility state.",
      "Take a backup and assume it is restorable.",
      "Use compatible expand-and-contract steps, protected CI artifacts, staged rollout and observation, a rehearsed rollback or recovery path, and explicit stop criteria.",
      "Let the agent choose a strategy during deployment based on live logs.",
    ],
    correctIndex: 2,
    explanation: "A safe migration controls sequencing and reversibility. Backups require restore evidence, and rollout authority and stop conditions should be explicit before production execution.",
    sourceIds: ["dora-continuous-delivery", "google-sre-book", "swebok-v4"],
  },
  {
    id: "q18",
    unitId: "deliver",
    question: "Before deploying a new critical API, what operational definition is most useful?",
    options: [
      "A dashboard containing every available metric.",
      "User-centered SLIs and SLOs, error-budget and failure-mode expectations, actionable alerts, a runbook, and tested recovery signals.",
      "A promise of 100 percent availability without a measurement window.",
      "A log statement saying the deployment succeeded.",
    ],
    correctIndex: 1,
    explanation: "Reliability is defined through observable user outcomes and an operational response. Metrics, traces, and logs matter when tied to objectives, failure modes, alerts, and recovery actions.",
    sourceIds: ["google-sre-book", "openai-harness-engineering"],
  },
  {
    id: "q19",
    unitId: "deliver",
    question: "How should a team evaluate an agent's claim that a patch improves performance?",
    options: [
      "Use fewer lines of code as a proxy for speed.",
      "Accept a microbenchmark run only on the agent's preferred input.",
      "Compare the model's written complexity analysis with its confidence score.",
      "Profile and load-test representative workloads against a pinned baseline, reporting latency distribution, throughput, resources, cost, variance, and quality regressions.",
    ],
    correctIndex: 3,
    explanation: "Performance and economics are empirical system properties. Representative workloads, controlled baselines, distributions, resource and cost data, and regression checks are stronger than plausible reasoning alone.",
    sourceIds: ["swebok-v4", "google-sre-book", "dora-ai-report-2025"],
  },
  {
    id: "q20",
    unitId: "deliver",
    question: "Which security review is adequate for an agent-authored change?",
    options: [
      "Review both the final artifacts and the action trajectory, covering applicable permissions, commands, secrets, network, inputs, dependencies, licenses, SBOM/provenance, privacy, and findings treatment for this system and change.",
      "Scan the final source only; actions taken during the run cannot create risk.",
      "Check that no secret appears in the final diff and approve automatically.",
      "Trust a clean scanner report as proof that no vulnerability exists.",
    ],
    correctIndex: 0,
    explanation: "Agentic risk includes the path as well as the patch. Scanners and provenance provide useful evidence but do not prove safety; authorization, data handling, dependencies, and residual findings also require review.",
    sourceIds: ["nist-ssdf", "owasp-llm-top10", "microsoft-security-debt", "slsa-provenance"],
  },
  {
    id: "q21",
    unitId: "govern",
    question: "Which measurement approach best evaluates an agent-assisted team workflow?",
    options: [
      "Maximize generated code volume because output predicts customer value.",
      "Optimize deployment frequency alone and ignore stability.",
      "Compare a defensible baseline across accepted outcomes, lead time, stability, defects, review and rework, human effort, cost, and maintenance burden.",
      "Use developer perception as the only metric because local data are noisy.",
    ],
    correctIndex: 2,
    explanation: "A single activity or flow metric is easy to game. Balanced outcome, delivery, quality, human-effort, economic, and downstream measures reveal whether the system creates accepted value sustainably.",
    sourceIds: ["dora-continuous-delivery", "dora-ai-report-2025", "metr-productivity-study", "swebok-v4"],
  },
  {
    id: "q22",
    unitId: "govern",
    question: "A study finds that one group was slower with a particular generation of AI tools. What may a team responsibly conclude?",
    options: [
      "Coding agents always reduce productivity.",
      "Benefits are contingent; inspect the population and task limits, then run a representative local comparison with repeats, failures, uncertainty, and human effort.",
      "The study is irrelevant because products change.",
      "A newer model is necessarily faster, so no evaluation is needed.",
    ],
    correctIndex: 1,
    explanation: "Empirical results are bounded by participants, tasks, tools, and measures. They should calibrate claims and motivate local evaluation, not be converted into a timeless universal rule.",
    sourceIds: ["metr-productivity-study", "swe-chat", "coding-agents-wild"],
  },
  {
    id: "q23",
    unitId: "govern",
    question: "A contributor uses an agent to prepare an open-source pull request. What responsibility remains with the contributor?",
    options: [
      "None, provided the tool generated the commit.",
      "Only fixing style comments after submission.",
      "Naming the model in the title, which replaces all other review duties.",
      "Understand and own the change, follow project policy, verify tests and rights, disclose use where required, answer review, and avoid shifting unreviewed work to maintainers.",
    ],
    correctIndex: 3,
    explanation: "Authorship assistance does not transfer accountability. Contribution rules, copyright and license duties, technical understanding, disclosure, review participation, and maintainer impact still apply.",
    sourceIds: ["pytest-ai-policy", "qiskit-ai-policy", "coding-agents-wild"],
  },
  {
    id: "q24",
    unitId: "govern",
    question: "Which evaluation design best supports a decision to expand agent autonomy?",
    options: [
      "A representative task suite and baseline with a frozen repository and all controllable harness, permission, tool, and environment inputs; recorded model/product identifiers and observation time; repeated runs; independent hidden checks; trajectory review; non-functional outcomes; failures, cost, uncertainty, and escalation results.",
      "The best result from one public benchmark attempt.",
      "A demonstration chosen by the product vendor.",
      "A count of tasks the agent claimed to complete.",
    ],
    correctIndex: 0,
    explanation: "An autonomy decision needs reproducible, representative, adversarial, and multidimensional evidence. Hosted models may not be perfectly freezeable, so record the exposed identifiers, time, and service variability. Repeats and failure analysis reveal variation; protected checks and traces can help detect reward hacking and unsafe actions.",
    sourceIds: ["openai-agent-evals", "swe-bench", "swe-agent-trajectories", "human-eval-pass-at-k", "tau-bench-pass-power-k", "nist-ai-rmf"],
  },
  {
    id: "q25",
    unitId: "govern",
    question: "All functional tests pass, but the run trace shows that a credential was printed and an unapproved package was fetched. What is the release decision?",
    options: [
      "Release because functional correctness outweighs process evidence.",
      "Release with no record because the credential is absent from the diff.",
      "Do not release until exposure is contained, the credential is rotated, dependency and provenance are reviewed, controls are corrected, and accountable reviewers accept the residual risk.",
      "Delete the trace and rerun the tests.",
    ],
    correctIndex: 2,
    explanation: "A passing score or functional suite cannot waive a blocking safety finding. The action trajectory is evidence; containment, remediation, independent re-verification, and an explicit human risk decision are required.",
    sourceIds: ["microsoft-security-debt", "nist-ssdf", "nist-ai-rmf"],
  },
] as const satisfies readonly SoftwareEngineeringQuestion[];

/** Stable 25-question bank from which every balanced 15-question attempt is drawn. */
export const SOFTWARE_ENGINEERING_FINAL_QUIZ_IDS = SOFTWARE_ENGINEERING_QUIZ.map(
  (question) => question.id,
) as readonly SoftwareEngineeringQuestionId[];

export const SOFTWARE_ENGINEERING_FINAL_QUIZ = {
  bankVersion: SOFTWARE_ENGINEERING_QUIZ_BANK_VERSION,
  bankQuestionIds: SOFTWARE_ENGINEERING_FINAL_QUIZ_IDS,
  bankSize: 25,
  questionCount: 15,
  questionsPerUnit: 3,
  passingCorrectAnswers: 12,
  selectionPolicy: "stratified-random" as const,
  scorePolicy: "best-score" as const,
  bestScoreStorageKey: "softwareEngineering.quizBest",
  passedStorageKey: "softwareEngineering.quizPassed",
  versionStorageKey: "softwareEngineering.quizVersion",
} as const;

/** Course-facing names retained alongside the explicit quiz names. */
export const SOFTWARE_ENGINEERING_QUESTION_BANK = SOFTWARE_ENGINEERING_QUIZ;
export const SOFTWARE_ENGINEERING_FINAL_ASSESSMENT = SOFTWARE_ENGINEERING_FINAL_QUIZ;

export function getSoftwareEngineeringQuizBest(
  progress: Readonly<Record<string, unknown>>,
): number | null {
  const value = progress[SOFTWARE_ENGINEERING_FINAL_QUIZ.bestScoreStorageKey];
  return progress[SOFTWARE_ENGINEERING_FINAL_QUIZ.versionStorageKey]
      === SOFTWARE_ENGINEERING_QUIZ_BANK_VERSION
    && typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= SOFTWARE_ENGINEERING_FINAL_QUIZ.questionCount
    ? value
    : null;
}

export function isSoftwareEngineeringQuizPassed(
  progress: Readonly<Record<string, unknown>>,
): boolean {
  const best = getSoftwareEngineeringQuizBest(progress);
  return progress[SOFTWARE_ENGINEERING_FINAL_QUIZ.passedStorageKey] === true
    && best !== null
    && best >= SOFTWARE_ENGINEERING_FINAL_QUIZ.passingCorrectAnswers;
}

export const SOFTWARE_ENGINEERING_QUIZ_BY_ID = Object.fromEntries(
  SOFTWARE_ENGINEERING_QUIZ.map((question) => [question.id, question]),
) as unknown as Readonly<
  Record<SoftwareEngineeringQuestionId, SoftwareEngineeringQuestion>
>;

if (
  SOFTWARE_ENGINEERING_FINAL_QUIZ_IDS.length !== SOFTWARE_ENGINEERING_QUESTION_IDS.length
) {
  throw new Error("Software-engineering question bank does not match its ID contract.");
}
