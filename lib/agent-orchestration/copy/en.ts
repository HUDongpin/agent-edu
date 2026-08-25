import type { AgentOrchestrationCourseCopy } from "../types";

/**
 * Canonical English curriculum for Course 15.
 *
 * The course deliberately separates three kinds of claims at section level:
 * source-grounded statements, portable engineering synthesis, and facts that
 * must be rechecked against a particular runtime or release. Linked sources
 * are paraphrased; third-party course text, screenshots, and diagrams are not
 * reproduced.
 */
export const AGENT_ORCHESTRATION_EN_COPY = {
  meta: {
    title: "Agent Orchestration: From Task Graphs to Production Control",
    shortTitle: "Agent Orchestration",
    kicker: "Course 15 · Design the control plane, not just the prompt",
    summary:
      "A rigorous, vendor-aware course for deciding when agents are justified, composing them with explicit contracts, bounding their authority, recovering from ambiguous failures, and evaluating the whole system in production.",
    audience:
      "Software engineers, AI application builders, technical product leaders, architects, researchers, and operators who need inspectable agent systems rather than orchestration demos.",
    prerequisite:
      "You should understand API calls, structured data, and basic software failure handling. Prior experience with an agent SDK is useful but not required.",
    level: "Intermediate to advanced",
    duration: "15 modules · 17 hr 40 min",
    startCta: "Start with the autonomy boundary",
    resumeCta: "Resume the orchestration system",
    translationNote:
      "This is the canonical English edition. Interface localization does not change source boundaries, runtime caveats, or assessment standards.",
    evidenceNote:
      "OpenAI, Anthropic, Claude Academy, the current MCP specification, and official repositories provide the primary evidence. Each lesson labels portable synthesis and version-sensitive facts. Private development inputs are excluded from the learner-facing evidence register; no private media or prose is redistributed.",
  },
  ui: {
    reviewCourse: "Review course",
    course: "Course 15",
    module: "Module",
    modules: "Modules",
    minute: "min",
    minutes: "min",
    phase: "Phase",
    source: "Source",
    sources: "Sources",
    sourceGrounded: "Source-grounded",
    engineeringSynthesis: "Engineering synthesis",
    versionWatch: "Version watch",
    supports: "What this supports",
    boundary: "Evidence boundary",
    contract: "Orchestration contract",
    contractTitle: "Make control and recovery explicit",
    practice: "Applied practice",
    steps: "Build steps",
    artifact: "Artifact",
    reviewGate: "Review gate",
    checkpoint: "Checkpoint",
    lab: "Control-room lab",
    takeaway: "Operating takeaway",
    topology: "Topology",
    trigger: "Trigger",
    completion: "Completion",
    controlOwner: "Control owner",
    stateOwner: "State owner",
    contextBoundary: "Context boundary",
    toolAuthority: "Tool authority",
    delegationPayload: "Delegation payload",
    concurrencyPolicy: "Concurrency policy",
    failurePolicy: "Failure policy",
    evidence: "Evidence",
    escalation: "Escalation",
    conceptMap: "Orchestration map",
    patternLibrary: "Pattern library",
    patterns: "Patterns",
    distinctions: "Critical distinctions",
    outcomes: "Learning outcomes",
    progress: "Course progress",
    markComplete: "Mark module complete",
    completed: "Completed",
    previous: "Previous",
    next: "Next",
    backToCourse: "Back to Course 15",
    finalAssessment: "Final assessment",
    capstone: "Production capstone",
    reset: "Reset Course 15 progress",
    rightsBoundary: "Sources, versions, and rights",
    explore: "Explore the system",
    duration: "Duration",
    level: "Level",
    language: "Content",
    researchGrounded: "Research-grounded",
    orchestrationControl: "Orchestration control",
    ready: "Ready",
    studyLoad: "Study load",
    phases: "Phases",
    labModes: "Lab modes",
    scopeContract: "The scope contract",
    scopeTitle: "Comprehensive production practice, with every boundary visible",
    boundaryTitle: "Six distinctions that prevent category errors",
    boundarySummary: "Each pair looks similar in a demo. In production, the difference changes ownership, persistence, authority, or evidence.",
    runtimeSemantics: "Runtime-specific semantics",
    runtimeTitle: "Do not flatten six layers into ‘multi-agent’",
    runtimeSummary: "Protocol, provider API, SDK, application orchestration, deployment runtime, and model are separate claim layers.",
    patternAtlasTitle: "Nine patterns, chosen by control need",
    patternAtlasSummary: "Patterns are not maturity levels. The best topology is the least autonomous one that meets an evaluated requirement.",
    control: "Control",
    useWhen: "Use when",
    stopWhen: "Stop when",
    curriculum: "Curriculum",
    curriculumTitle: "A production control system in fifteen modules",
    curriculumSummary: "Every module closes with an execution contract, an editable artifact, a deterministic lab, and one assessable boundary.",
    outcomesTitle: "What you can defend after the course",
    accountableReview: "Accountable review",
    accountableReviewTitle: "Questions your release panel must answer",
    integrityTitle: "Evidence is linked. Product claims are dated. Assets are original.",
    integrityEvidenceModes: "Every teaching section identifies its evidence mode and links its supporting records.",
    integrityBoundaries: "Every source states both the claim it supports and what it cannot establish.",
    integrityUploads: "Private development inputs are excluded from the public evidence register and are not redistributed.",
    noticeCta: "Read the source and asset notice",
    sourceRegister: "Evidence register",
    sourceRegisterCount: "unique linked records",
    sourceRegisterNote: "Each record supports a bounded claim. Its boundary is part of the lesson, not fine print.",
    courseMap: "Course map",
    whatChanges: "What changes by the end",
    conceptsInModule: "Concepts in this module",
    objective: "Module objective",
    onThisPage: "Execution notebook",
    evidenceLinks: "Evidence links",
    workSequence: "Work sequence",
    moduleTakeaway: "Module takeaway",
    return: "Return",
    sourceSupports: "Supports",
    sourceBoundary: "Boundary",
    supportingClaimEvidence: "Supporting claim evidence",
    versionAnchor: "Version anchor",
    accessed: "Accessed",
    revision: "Revision",
    license: "License",
    allCourseModules: "All course modules",
    moduleNavigation: "Module navigation",
    savedLocally: "Saved in this browser",
    memoryOnly: "Private browsing: progress lasts for this tab",
    resetComplete: "Course 15 progress reset in this browser",
    resetMemory: "Course 15 progress reset for this tab",
    checkingStorage: "Checking persistence…",
    confirmReset: "Confirm reset",
    artifactWorkbench: "Artifact workbench",
    artifactEditRequired:
      "Retain the starter headings and canonical field/table/code skeleton, then make a diverse, orchestration-relevant edit: complete at least three structured lines across multiple sections, change at least 32 letter or number characters, and add several distinct control/evidence concepts. Repeated characters, random word lists, one pasted tail, whitespace, and punctuation do not count. This browser gate is only a minimum; a human reviewer must judge quality.",
    artifactEvidenceSaved: "Evidence receipt saved.",
    draftAutoSaved:
      "Working draft auto-saved; it does not yet count as completion evidence.",
    draftRecovered:
      "Working draft restored; pass the evidence gate and save explicitly.",
    saved: "Saved",
    saveDraft: "Save draft",
    draft: "draft",
    checkAnswer: "Check answer",
    correct: "Correct",
    tryAgain: "Reconsider the boundary",
    saveLab: "Save lab state",
    complete: "Complete",
    inProgress: "In progress",
    markIncomplete: "Mark incomplete",
    assessment: "Final assessment",
    assessmentThreshold: "Pass",
    bestScore: "Best",
    submitAssessment: "Grade assessment",
    passed: "Passed",
    notYet: "Not yet",
    assessmentPass: "You cleared the architecture gate.",
    assessmentRetry: "Review the boundary explanations, then try another clean trial.",
    releaseContract: "Release contract",
    auditableArtifacts: "15 auditable artifacts",
    capstoneOpen: "Completion remains open until every artifact is evidenced.",
    savedArtifactRequired: "save a meaningfully edited artifact",
    savedLabRequired: "save this module’s lab state",
    correctCheckpointRequired: "answer the checkpoint correctly",
    completionNeeds: "Before completion:",
    passPreserved: "Attempt below threshold; prior pass preserved",
    bestPreserved: "Your best score and passing course status remain monotonic after a lower attempt.",
    evidenceReference: "Evidence / reference",
    evidencePlaceholder: "File, URL, trace ID, or review record",
    evidenceGuidance:
      "For each item, use a distinct HTTPS URL, file path with an extension, structured trace/ticket/review ID, or substantive review record with an identifier. The browser only rejects obvious placeholders; it cannot prove that an external object exists, so final human verification is still required.",
  },
  principles: [
    "Choose the least autonomous topology that can satisfy the task and its uncertainty.",
    "Write graph, role, state, authority, completion, and recovery contracts before delegating work.",
    "Capability is not authority: a callable tool, an approved action, a quality pass, and human sign-off are different gates.",
    "Preserve evidence and unresolved uncertainty across every context boundary; fluent summaries are not durable state.",
    "Evaluate end-to-end outcomes and failure recovery—not merely model responses, traces, or happy-path demos.",
  ],
  outcomes: [
    "Decide whether a problem needs ordinary software, a code-directed workflow, one agent, or multiple agents.",
    "Represent an agent system as a typed task graph with explicit dependencies, joins, owners, and completion predicates.",
    "Choose among chaining, routing, fan-out, manager, handoff, orchestrator-worker, evaluator, and hierarchical patterns.",
    "Write delegation and return contracts that preserve caller identity, evidence, uncertainty, and final-answer ownership.",
    "Separate tool interfaces, MCP capability exchange, agent control flow, and application authority.",
    "Design context, conversation, session, run state, checkpoints, memory, and audit records as distinct layers.",
    "Set budgets, concurrency limits, backpressure, stopping rules, and escalation paths for bounded execution.",
    "Handle timeouts, retries, duplicate delivery, partial completion, and ambiguous external side effects safely.",
    "Build least-privilege authority, approval, sandbox, guardrail, tracing, privacy, and incident controls.",
    "Evaluate nodes, trajectories, outcomes, regressions, economics, and production readiness across versioned releases.",
  ],
  distinctions: [
    [
      "Workflow vs agent",
      "A workflow follows a predefined control path; an agent chooses some path or action from model-visible state within bounded authority.",
    ],
    [
      "Manager tool call vs handoff",
      "A manager calling a specialist retains control and final-answer ownership; a handoff transfers control to the selected agent until the runtime or application transfers it again.",
    ],
    [
      "Tool-call parallelism vs agent parallelism",
      "Several tool calls in one model turn, concurrent local tool handlers, concurrent agent runs, and hosted subagents are different execution planes.",
    ],
    [
      "Context vs durable state",
      "Context is what a model can attend to now; durable state is application-owned data that survives retries, compaction, process loss, and model changes.",
    ],
    [
      "Permission vs isolation",
      "A policy can allow, ask, or deny an action; a sandbox, credential boundary, and network or filesystem control contain what execution can actually reach.",
    ],
    [
      "Trace vs monitor vs audit vs eval",
      "A trace reconstructs the recorded, instrumented path subject to propagation, sampling, export, and retention gaps; monitoring detects operating conditions, an audit record supports accountability, and an eval estimates quality against a declared criterion.",
    ],
  ],
  phases: {
    frame: {
      title: "Frame the control problem",
      summary:
        "Choose the minimum justified autonomy, draw the task graph, and make code-directed and concurrent boundaries inspectable.",
      verb: "Bound the system",
    },
    compose: {
      title: "Compose roles and capabilities",
      summary:
        "Assign ownership, select delegation semantics, design return paths, and expose tools through narrow interfaces.",
      verb: "Connect the actors",
    },
    control: {
      title: "Control state, authority, and failure",
      summary:
        "Separate state layers, constrain resources and permissions, and make interruption and recovery safe.",
      verb: "Contain uncertainty",
    },
    operate: {
      title: "Operate and evolve",
      summary:
        "Instrument costs and outcomes, run repeatable evaluations, govern versions, and release progressively.",
      verb: "Earn production trust",
    },
  },
  conceptDomains: {
    "boundaries-autonomy": {
      title: "Boundaries and autonomy",
      summary:
        "The decision ladder from ordinary code to workflows, one agent, and multi-agent systems.",
      concepts: [
        "workflow-agent boundary",
        "minimum justified autonomy",
        "environmental uncertainty",
        "human escalation",
      ],
    },
    "task-graphs-contracts": {
      title: "Task graphs and contracts",
      summary:
        "Typed nodes, dependencies, transitions, joins, completion predicates, and return paths.",
      concepts: ["DAG", "state machine", "execution contract", "join policy"],
    },
    "deterministic-workflows": {
      title: "Code-directed workflows",
      summary:
        "Code-owned transitions and gates around bounded model decisions; model nodes remain stochastic and require evaluation across trials.",
      concepts: [
        "prompt chain",
        "structured router",
        "refusal state",
        "fallback path",
      ],
    },
    "parallelism-aggregation": {
      title: "Parallelism and aggregation",
      summary:
        "Independent fan-out, bounded execution, partial results, and evidence-preserving joins.",
      concepts: [
        "concurrency plane",
        "fan-out/fan-in",
        "validated k-of-n join",
        "partial completion",
      ],
    },
    "roles-control-ownership": {
      title: "Roles, control, and ownership",
      summary:
        "Who decides the next step, owns state, speaks externally, and accepts completion.",
      concepts: [
        "manager",
        "control owner",
        "state owner",
        "final-answer owner",
      ],
    },
    "delegation-communication": {
      title: "Delegation and communication",
      summary:
        "Loss-aware task packets, handoff semantics, caller identity, and structured returns.",
      concepts: [
        "delegation payload",
        "handoff",
        "return destination",
        "unresolved uncertainty",
      ],
    },
    "dynamic-orchestration": {
      title: "Dynamic orchestration",
      summary:
        "Runtime decomposition with worker contracts, verification, stopping, and merge discipline.",
      concepts: [
        "orchestrator-workers",
        "evaluator-optimizer",
        "independent verifier",
        "progress artifact",
      ],
    },
    "tools-protocols": {
      title: "Tools, ACI, and protocols",
      summary:
        "The action boundary between model intent, typed interfaces, remote capabilities, and application authority.",
      concepts: [
        "agent-computer interface",
        "function tool",
        "MCP",
        "approval boundary",
      ],
    },
    "context-state-memory": {
      title: "Context, state, and memory",
      summary:
        "Distinct model-visible, conversational, operational, durable, and audit layers.",
      concepts: [
        "model context",
        "conversation",
        "session",
        "run state",
        "memory",
        "compaction",
      ],
    },
    "scheduling-budgets": {
      title: "Scheduling and budgets",
      summary:
        "Bounded time, turns, tokens, cost, concurrency, queues, and stopping conditions.",
      concepts: [
        "budget vector",
        "backpressure",
        "critical path",
        "deadline",
        "stop rule",
      ],
    },
    "reliability-durability": {
      title: "Reliability and durability",
      summary:
        "Replay-safe retries, deduplication, checkpoints, ambiguous outcomes, and compensation.",
      concepts: [
        "idempotency",
        "at-least-once delivery",
        "checkpoint",
        "reconciliation",
        "compensation",
      ],
    },
    "security-governance": {
      title: "Security and governance",
      summary:
        "Least privilege, isolation, approvals, guardrails, human authority, recourse, and incident control.",
      concepts: [
        "capability vs authority",
        "sandbox",
        "prompt injection",
        "human-in-the-loop",
      ],
    },
    "observability-economics": {
      title: "Observability and economics",
      summary:
        "Execution traces, service signals, outcome links, privacy, latency, token use, and cost per successful task.",
      concepts: [
        "trace",
        "metric",
        "audit event",
        "tail latency",
        "cost per success",
      ],
    },
    "evaluation-evolution": {
      title: "Evaluation and evolution",
      summary:
        "Node, trajectory, and outcome evaluation with repeated trials and version governance.",
      concepts: [
        "golden task",
        "trace grading",
        "calibrated grader",
        "regression gate",
      ],
    },
    "production-operations": {
      title: "Production operations",
      summary:
        "Progressive release, durable ownership, readiness evidence, incident response, and rollback.",
      concepts: [
        "release ladder",
        "runbook",
        "SLO",
        "kill switch",
        "post-incident learning",
      ],
    },
  },
  patterns: {
    "single-agent-loop": {
      title: "Single-agent loop",
      control: "One bounded agent chooses among approved tools until a completion or stop predicate is met.",
      bestWhen: "One context and one owner are sufficient and tool selection is the main uncertainty.",
      failureSignal: "The context becomes incoherent, privileges become too broad, or distinct roles cannot be independently verified.",
    },
    "prompt-chain": {
      title: "Prompt chain",
      control: "Code orders a fixed sequence and validates the output contract between stages.",
      bestWhen: "The stages and their dependencies are known and intermediate checks improve reliability.",
      failureSignal: "The chain repeatedly needs unplanned branches or propagates an unchecked early error.",
    },
    router: {
      title: "Router",
      control: "Code or a constrained model decision selects one declared path with a fallback.",
      bestWhen: "Inputs fall into meaningfully different classes that deserve different tools, prompts, or owners.",
      failureSignal: "Classes overlap, routing confidence is ignored, or there is no safe unknown route.",
    },
    "parallel-fanout": {
      title: "Parallel fan-out",
      control: "Independent branches run under a shared deadline and join through an explicit aggregation policy.",
      bestWhen: "Work items do not share mutable state and wall-clock reduction or diverse evidence justifies extra cost.",
      failureSignal: "Branches contend for state, duplicate expensive work, or a slow tail blocks an undefined join.",
    },
    "manager-tools": {
      title: "Manager with agents as tools",
      control: "A manager delegates bounded tasks, receives results, and retains conversation and final-answer ownership.",
      bestWhen: "A central owner must synthesize, enforce a shared policy, or preserve one user-facing voice.",
      failureSignal: "The manager becomes a context bottleneck or silently accepts lossy worker summaries as proof.",
    },
    handoff: {
      title: "Handoff",
      control: "A selected specialist becomes the active agent and owns subsequent turns until control is transferred again.",
      bestWhen: "The specialist should directly conduct a bounded sub-conversation or workflow with appropriate authority.",
      failureSignal: "The application loses current-agent state, user expectations, return ownership, or inherited safety controls.",
    },
    "orchestrator-workers": {
      title: "Orchestrator-workers",
      control: "An orchestrator decomposes an open task, launches scoped workers, and merges their inspectable artifacts.",
      bestWhen: "Subtasks cannot be known fully in advance and independent exploration materially improves coverage.",
      failureSignal: "Decomposition becomes recursive busywork, budgets are unbounded, or the merge cannot trace claims to worker evidence.",
    },
    "evaluator-optimizer": {
      title: "Evaluator-optimizer",
      control: "A producer revises against a declared rubric until a quality threshold or iteration budget is reached.",
      bestWhen: "Quality criteria can be made explicit and iteration is cheaper than accepting a weak first pass.",
      failureSignal: "The evaluator shares the same blind spot, optimizes proxy style, or has no hard stopping rule.",
    },
    "group-or-hierarchical": {
      title: "Group or hierarchical topology",
      control: "Multiple roles communicate through a coordinator, shared protocol, or layered supervisors with scoped authority.",
      bestWhen: "The problem genuinely requires several domains, teams, or trust zones and their interfaces can be governed.",
      failureSignal: "A fashionable ‘swarm’ hides ownership, amplifies communication cost, or creates circular delegation.",
    },
  },
  modules: {
    "workflow-agent-boundary": {
      kicker: "01 · Minimum justified autonomy",
      title: "When Not to Use an Agent—or Multiple Agents",
      summary:
        "Begin orchestration by proving that ordinary code, a code-directed workflow, or one bounded agent is insufficient.",
      objective:
        "Classify one real task on the code → workflow → single-agent → multi-agent ladder and defend the minimum sufficient topology.",
      artifact: "Autonomy boundary brief",
      concepts: [
        "workflow versus agent",
        "environmental uncertainty",
        "single-agent loop",
        "multi-agent justification",
        "non-goals",
      ],
      sections: [
        {
          heading: "Use the simplest control structure that can express the task",
          paragraphs: [
            "OpenAI and Anthropic both distinguish predefined workflows from agent loops in which a model chooses some sequence of actions. Begin with ordinary functions for known transformations, add a workflow when branches and checks are known, use one agent when tool choice or decomposition is meaningfully uncertain, and introduce multiple agents only when separate contexts, capabilities, trust zones, or parallel exploration create measurable value.",
            "Here, ‘code-directed’ means that application code predefines the control transitions and gates. It does not mean that an embedded LLM node or its final output is deterministic; any model-dependent result remains stochastic and must be evaluated across representative repeated trials.",
            "More agents do not automatically create more intelligence. They add model calls, communication loss, scheduling, state ownership, security boundaries, and new failure modes. A single agent with clear tools often remains the strongest baseline.",
          ],
          bullets: [
            "Prefer ordinary code for deterministic calculation and validation.",
            "Prefer a workflow for known branches, approvals, and joins.",
            "Prefer one agent when bounded semantic choice is the central uncertainty.",
            "Require an explicit benefit before separating roles across agents.",
          ],
          sourceIds: [
            "openai-building-agents",
            "openai-practical-guide",
            "anthropic-effective-agents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Calculate the coordination tax before accepting it",
          paragraphs: [
            "Write the expected gain and the new coordination cost in the same decision record. Gains may include context isolation, specialist permissions, independent verification, or parallel evidence gathering. Costs include additional tokens, tail latency, summary loss, duplicate work, nondeterministic interleavings, and a larger incident surface.",
            "A multi-agent design is justified when an evaluated task-success or operating benefit exceeds that tax under the intended workload—not when a diagram merely looks sophisticated. Preserve a single-agent comparator so later evaluation can falsify the architecture choice.",
          ],
          sourceIds: [
            "openai-practical-guide",
            "anthropic-effective-agents",
            "openai-building-agents",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Keep product labels local to their runtime",
          paragraphs: [
            "This course-original teaching model separates a conversation Session, a root or lead agent, and the Host or execution environment. It also distinguishes runtime capacity from the Host itself. These labels are not a cross-vendor specification: the meaning of root, primary, thread, session, slot, or sandbox must be read from the runtime you actually deploy.",
            "Write portable contracts in terms of control owner, state owner, execution boundary, active-work limit, and return destination. Then identify the claim layer—protocol, provider API, SDK, application orchestration, deployment runtime, or model—and map those fields to OpenAI, Claude, Codex, or another framework without pretending the product nouns are interchangeable.",
          ],
          sourceIds: ["openai-building-agents"],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "One bounded agent loop behind deterministic input and output checks.",
        trigger: "A validated task request whose semantic tool choice cannot be expressed reliably as ordinary branching.",
        completion: "A schema-valid deliverable meets the declared acceptance checks, or the run ends in an explicit stop state.",
        controlOwner: "The application runner; the agent chooses only among allowed next actions.",
        stateOwner: "The application record, not the model transcript.",
        contextBoundary: "Only task-relevant instructions, evidence, and tool results enter model context.",
        toolAuthority: "Read-only by default; each state-changing action has a separate policy and approval rule.",
        delegationPayload: "No subagent delegation in the baseline; tool calls carry typed arguments and call IDs.",
        concurrencyPolicy: "Sequential until an independent branch is demonstrated and given its own budget.",
        failurePolicy: "Fail closed on invalid input, tool ambiguity, exceeded budget, or missing completion evidence.",
        evidence: "Input record, tool-call/result pairs, final artifact, validation result, cost, latency, and stop reason.",
        escalation: "Route out-of-scope, consequential, or unresolved requests to a named human owner.",
      },
      practice: {
        title: "Defend the minimum sufficient topology",
        brief:
          "Choose one candidate use case and prove why each simpler design does or does not satisfy it.",
        steps: [
          "Write the user outcome, allowed environment, consequence level, and explicit non-goals.",
          "Attempt an ordinary-code solution and list the uncertainty it cannot handle.",
          "Attempt a code-directed workflow and one-agent baseline before proposing multiple agents.",
          "Quantify the expected benefit and coordination tax for every added agent role.",
          "Define an evaluation that could send the design back down the autonomy ladder.",
        ],
        artifact: "A one-page autonomy boundary brief with a rejected-alternatives table.",
        reviewGate:
          "A reviewer can identify the precise uncertainty that warrants autonomy and the evidence that would remove that warrant.",
        template:
          "# Autonomy boundary brief\n\n## Outcome, environment, and consequence\n- User outcome:\n- Execution environment:\n- Consequence / reversibility:\n- Non-goals:\n\n## Minimum topology test\n| Candidate | What it handles | Why insufficient or selected | New risks | Evidence needed |\n|---|---|---|---|---|\n| Ordinary code | | | | |\n| Code-directed workflow | | | | |\n| Single agent | | | | |\n| Multiple agents | | | | |\n\n## Decision and falsification rule\n",
      },
      checkpoint: {
        question:
          "A task has fixed inputs, known branches, deterministic validation, and no need for open-ended tool choice. What should be the default architecture?",
        options: [
          "A hierarchical multi-agent swarm",
          "A code-directed workflow with explicit deterministic checks",
          "A handoff network with one agent per branch",
          "A hosted subagent tree because it is easier to diagram",
        ],
        correctIndex: 1,
        explanation:
          "Known control flow belongs in code. Adding agents would introduce cost and failure modes without addressing a demonstrated uncertainty.",
      },
      lab: {
        title: "Pattern selector: autonomy ladder",
        instruction:
        "Tune semantic uncertainty, ordered dependencies, and shared writes to compare the minimum sufficient topology: deterministic code, one bounded agent, or bounded fan-out.",
        evidencePrompt:
        "Which active control changed the topology decision, what baseline would challenge it, and which real-world constraint remains outside this simulation?",
      },
      takeaway:
        "Orchestration begins with a refusal: do not buy coordination complexity until the task can repay it.",
    },
    "task-graphs-contracts": {
      kicker: "02 · Make execution legible",
      title: "Task Graphs, Execution Contracts, and State Boundaries",
      summary:
        "Replace an agent-role sketch with an executable graph whose nodes, edges, joins, owners, and terminal states can be inspected.",
      objective:
        "Model one workflow as a typed graph and write the twelve-field orchestration contract that governs it.",
      artifact: "Versioned task graph and execution-contract sheet",
      concepts: [
        "typed node",
        "dependency edge",
        "completion predicate",
        "join policy",
        "return destination",
        "state ownership",
      ],
      sections: [
        {
          heading: "A graph is control semantics, not presentation",
          paragraphs: [
            "OpenAI's SDK material shows code-directed chains, loops, routing, parallel calls, and model-directed orchestration; Anthropic describes related workflow patterns. Draw each unit of work as a typed node with declared inputs, outputs, preconditions, authority, deadline, and terminal states. Draw edges as permitted transitions or data dependencies rather than vague arrows labelled ‘collaborates.’",
            "Give every branch a join contract. All-success, best-effort, a validated k-of-n result threshold, first-valid, and deadline-bounded joins produce different system behavior. A graph without a completion predicate can continue generating work after the business task is already done. A k-of-n threshold is an application completion rule, not a distributed-consensus quorum and not proof that a majority answer is true.",
          ],
          sourceIds: [
            "openai-sdk-orchestration",
            "anthropic-effective-agents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Put ownership and return paths in data",
          paragraphs: [
            "The graph must identify who owns control, durable state, final synthesis, and external side effects at every node. A delegation edge carries a task ID, caller ID, return destination, evidence requirements, budget, and escalation target. The corresponding return carries status, artifact references, evidence, uncertainty, consumed budget, and unresolved blockers.",
            "Do not infer the return destination from natural-language instructions or current chat position. A portable return-path analysis distinguishes task trees from conversation threads, while Microsoft Agent Framework exposes explicit graph, checkpoint, and human-review concepts. Make identity and state transitions machine-checkable even when framework vocabulary differs.",
          ],
          sourceIds: [
            "microsoft-agent-framework",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Treat framework graphs as versioned implementations",
          paragraphs: [
            "A framework may provide sequential, concurrent, handoff, group, checkpoint, or time-travel primitives, but the application still owns the business completion rule and the meaning of success. Verify the exact component and language release: a repository-wide version label may not describe every package or runtime in that repository.",
            "Keep a framework-neutral graph specification beside the implementation mapping. That lets the team review semantics, migrate libraries, and detect when an SDK upgrade changes control flow or serialized state.",
          ],
          sourceIds: [
            "microsoft-agent-framework",
            "openai-sdk-orchestration",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Code-owned directed task graph with sequential, conditional, and bounded fan-out nodes.",
        trigger: "A versioned request record passes schema, policy, and duplicate-submission checks.",
        completion: "The terminal node records accepted, rejected, cancelled, expired, or escalated with artifact references.",
        controlOwner: "The graph runner selects eligible nodes; model outputs may propose only declared transitions.",
        stateOwner: "An application event and snapshot store keyed by workflow and task IDs.",
        contextBoundary: "Each node receives the minimum projection of state required for its contract.",
        toolAuthority: "Authority is assigned per node and cannot expand through a delegation edge.",
        delegationPayload: "Task ID, caller, return destination, objective, inputs, non-goals, output schema, evidence, budget, and escalation.",
        concurrencyPolicy: "Only dependency-free nodes with isolated mutable state may run together; joins have deadlines and partial-result rules.",
        failurePolicy: "Record node attempts separately from logical task state; retry only when replay safety is established.",
        evidence: "Graph version, transition events, node inputs and outputs by reference, validation results, approvals, and terminal reason.",
        escalation: "Unknown transition, broken invariant, expired deadline, or disputed high-impact output pauses the graph for its owner.",
      },
      practice: {
        title: "Turn a role diagram into an executable graph",
        brief:
          "Formalize one orchestration sketch until a runner and a reviewer would agree on every legal transition.",
        steps: [
          "Inventory nodes and assign typed input, output, owner, authority, deadline, and terminal status to each.",
          "Label every edge as a dependency, conditional transition, delegation, return, approval, or compensation path.",
          "Specify fan-out limits and an all, validated k-of-n, first-valid, or best-effort join policy.",
          "Write global and node-level completion and stopping predicates.",
          "Walk one success, one partial result, one timeout, and one human-escalation trace through the graph.",
        ],
        artifact: "A graph specification plus four annotated execution traces.",
        reviewGate:
          "No transition, return destination, state mutation, or terminal outcome depends on interpreting prose after execution begins.",
        template:
          "# Task graph specification\n\n## Global contract\n- Trigger:\n- Completion predicate:\n- State owner:\n- Control owner:\n\n## Nodes\n| Node | Input schema | Output schema | Authority | Deadline | Terminal states |\n|---|---|---|---|---|---|\n| | | | | | |\n\n## Edges and joins\n| From | To | Edge type / condition | Join policy | Return destination |\n|---|---|---|---|---|\n| | | | | |\n\n## Invalid transitions and escalation\n",
      },
      checkpoint: {
        question:
          "Which graph definition is sufficient for a three-worker fan-out?",
        options: [
          "Three arrows from a coordinator labelled ‘work in parallel’",
          "Three role descriptions and a shared chat transcript",
          "Typed worker contracts, isolated state, concurrency and budget limits, a join policy, and terminal states",
          "A framework name and a screenshot of its visualizer",
        ],
        correctIndex: 2,
        explanation:
          "A production graph must define legal execution and recovery semantics, not merely show that several boxes exist.",
      },
      lab: {
        title: "Graph contract: legal transitions",
        instruction:
        "Toggle a late worker, an invalid return destination, and a partial join; repair all three before the terminal graph state can become authoritative.",
        evidencePrompt:
          "Which invariant detected the failure before an incorrect terminal state was recorded?",
      },
      takeaway:
        "If an arrow cannot state its data, authority, timing, and failure semantics, it is not yet an orchestration edge.",
    },
    "chaining-routing": {
      kicker: "03 · Keep known control in code",
      title: "Prompt Chaining and Dual Routing",
      summary:
        "Use code-directed chains with predefined stage order and choose deliberately between code-owned and model-assisted routing.",
      objective:
        "Design a chain and router with typed intermediate outputs, uncertainty handling, and an explicit unknown path.",
      artifact: "Chain-and-route decision table",
      concepts: [
        "prompt chain",
        "code router",
        "model router",
        "structured output",
        "refusal",
        "incomplete result",
      ],
      sections: [
        {
          heading: "Chain when the stages and gates are known",
          paragraphs: [
            "Anthropic's workflow patterns and Claude Academy curriculum both use chaining to decompose a task into stages that can be checked independently. A chain should narrow responsibility: extract facts, validate them, transform the accepted record, then review the final artifact. Each stage receives a typed input and cannot silently repair an invalid predecessor.",
            "Add a gate between stages when an early error would contaminate later work. Preserve the rejected intermediate and reason so the chain remains debuggable rather than simply asking the next model call to ‘try harder.’",
          ],
          sourceIds: ["anthropic-effective-agents", "claude-academy-api"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Choose who owns the route",
          paragraphs: [
            "Use ordinary code when the class can be derived from authenticated metadata, a stable rule, or a deterministic policy. Use a constrained model router when selection depends on meaning that rules cannot capture economically. Even then, code owns the allowed route set, confidence threshold, fallback, budget, and authorization check.",
            "Routing is not delegation by itself. It selects a path; the selected path still needs its own completion, authority, and return contract. Log the input features and route decision without retaining unnecessary sensitive text.",
          ],
          sourceIds: ["openai-sdk-orchestration", "anthropic-effective-agents"],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Treat structured output as shape, not truth",
          paragraphs: [
            "OpenAI Structured Outputs can constrain supported response shapes, but a schema-valid label can still be false, unauthorized, or unsafe. The application must also handle refusal and incomplete states; neither should be coerced into the nearest business category merely to satisfy downstream code.",
            "Structured-output behavior, supported schema features, and SDK helpers can change. Pin and test the exact model and client version, keep a safe unknown route, and re-evaluate examples taken from current Academy or SDK lessons before production use.",
          ],
          sourceIds: [
            "openai-structured-outputs",
            "openai-sdk-orchestration",
            "claude-academy-api",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Code-owned chain followed by a bounded router with declared destinations.",
        trigger: "A normalized request passes deterministic validation and policy classification.",
        completion: "One route returns a validated artifact or the router records unknown, refused, incomplete, or escalated.",
        controlOwner: "Application code owns stage order and legal routes; a model may emit only a typed route proposal.",
        stateOwner: "A per-run chain record stores accepted intermediate outputs and gate decisions.",
        contextBoundary: "Each stage sees only its input contract and necessary provenance, not the entire accumulated transcript.",
        toolAuthority: "The router has no side-effect tools; destination workflows receive route-specific least privilege.",
        delegationPayload: "Route ID, normalized inputs, confidence or rationale fields, provenance, and destination contract version.",
        concurrencyPolicy: "Stages are sequential; independent post-route enrichments may fan out under their own join policy.",
        failurePolicy: "Do not guess through invalid, refused, or incomplete output; retry only bounded, replay-safe classification and then use unknown.",
        evidence: "Intermediate schemas, gate results, route selection, fallback rate, destination outcome, and misroute review.",
        escalation: "Unknown, low-confidence, policy-conflicting, or high-consequence requests go to a named reviewer.",
      },
      practice: {
        title: "Build a route table with an honest unknown",
        brief:
          "Turn one semantic triage problem into a deterministic envelope around a constrained model decision.",
        steps: [
          "Separate classes derivable from authenticated metadata from classes requiring semantic interpretation.",
          "Define mutually testable route descriptions and a mandatory unknown or escalate route.",
          "Design a strict route schema that can also represent refusal and incomplete output.",
          "Give each destination its own authority, budget, completion, and fallback contract.",
          "Create adversarial, ambiguous, multilingual, and out-of-scope route fixtures and set a release threshold.",
        ],
        artifact: "A route table, schema, fixture set, and fallback policy.",
        reviewGate:
          "A reviewer can explain why every route exists, how unknown is preserved, and why a schema-valid response is not automatically trusted.",
        template:
          "# Chain and route specification\n\n## Deterministic preprocessing\n1.\n2.\n\n## Route schema\n```json\n{\"route\": \"declared | unknown\", \"confidence\": 0, \"evidence_refs\": [], \"status\": \"complete | refused | incomplete\"}\n```\n\n## Route table\n| Route | Inclusion | Exclusion | Destination | Authority | Fallback |\n|---|---|---|---|---|---|\n| | | | | | |\n\n## Evaluation fixtures and threshold\n",
      },
      checkpoint: {
        question:
          "A router returns a schema-valid destination with high confidence. What has been established?",
        options: [
          "The route is true, safe, and authorized",
          "Only that the returned data conforms to the supported schema; policy and task correctness still require checks",
          "The destination may bypass its own tool permissions",
          "No unknown route is needed",
        ],
        correctIndex: 1,
        explanation:
          "Structured output constrains shape. It does not prove semantic correctness, authorization, or safety.",
      },
      lab: {
        title: "Pattern selector: chain or route",
        instruction:
        "Test known, ambiguous, and refused inputs against a closed structured route, an explicit unknown path, and a high-risk human-review gate.",
        evidencePrompt:
          "Which input reached the unknown path, and what unsafe behavior would forced classification have caused?",
      },
      takeaway:
        "Let models resolve semantic ambiguity, but let code define the legal choices and what happens when no choice is justified.",
    },
    "parallel-fanout-fanin": {
      kicker: "04 · Concurrency has several planes",
      title: "Parallel Fan-out, Joins, and Partial Results",
      summary:
        "Separate tool-call, handler, agent-run, and hosted-subagent concurrency before designing a safe join.",
      objective:
        "Specify a bounded fan-out with independent state, deadlines, cancellation, aggregation, and partial-result semantics.",
      artifact: "Concurrency-plane and join-policy specification",
      concepts: [
        "parallel tool calls",
        "local handler concurrency",
        "parallel agent runs",
        "hosted subagents",
        "critical path",
        "tail latency",
        "join policy",
      ],
      sections: [
        {
          heading: "Name the execution plane before saying parallel",
          paragraphs: [
            "OpenAI function calling can return several tool calls in one model turn. An SDK or application may execute local tool handlers concurrently. Application code can also run several complete agents at once, while a hosted multi-agent product can schedule a root and subagents inside its own service. These planes differ in context ownership, scheduling, cancellation, state, and billing.",
            "Anthropic's parallelization pattern and OpenAI's application-level examples support fan-out when branches are independent. Independence means more than different prompts: branches must not race on mutable state or create conflicting external effects.",
          ],
          sourceIds: [
            "openai-function-calling",
            "openai-sdk-orchestration",
            "anthropic-effective-agents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Design the join before launching the branches",
          paragraphs: [
            "Choose all-success when every result is essential, a validated k-of-n result threshold when a declared number of independently valid results is sufficient, first-valid when one independently validated answer is enough, and best-effort when partial evidence still has value. This threshold is an application join rule—not a consensus quorum or a truth vote. State the deadline, cancellation policy, duplicate handling, deterministic ordering, and whether late results are discarded, stored for audit, or considered in a later revision.",
            "The aggregator must preserve provenance and dissent. A synthesis that hides which branch failed or which evidence conflicted converts parallelism into false consensus. For a dependency DAG with estimated durations and no additional resource constraint, the critical path is the longest weighted dependency path and determines the dependency-constrained earliest finish. With finite workers, queues, or shared resources, compute the resource-constrained schedule and makespan separately: the dependency critical path is only a lower bound, and contention, retries, or tail latency can move the observed bottleneck. Node count alone never defines the critical path. Parallelize eligible work only when coordination overhead does not dominate, and measure total tokens and tail latency as well as median wall-clock time.",
          ],
          sourceIds: [
            "openai-agents-python-patterns",
            "openai-sdk-orchestration",
            "anthropic-effective-agents",
            "oracle-critical-path",
            "etcd-quorum-glossary",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Treat hosted multi-agent limits as runtime facts",
          paragraphs: [
            "As verified on 2026-08-23, Responses Multi-agent is Beta for all GPT-5.6 models and is enabled with `multi_agent.enabled` plus the `responses_multi_agent=v1` Beta. `multi_agent.max_concurrent_subagents` counts simultaneously active subagent turns across the entire tree—including children, grandchildren, and deeper descendants—but excludes `/root`. Its documented default and recommendation are `3`; there is no API-fixed upper bound for that field and no fixed limit on tree depth or total subagents created. Those absences are capacity facts, not permission to recurse without application budgets.",
            "The same dated Responses page says `/responses/compact`, `reasoning.summary`, and `max_tool_calls` are unsupported in Multi-agent; automatic server-side compaction is implicitly enabled and applied separately to root and each subagent. By contrast, Codex documents `agents.max_concurrent_threads_per_session` as a cap on concurrently open spawned-agent threads, excluding the primary. If unset, Codex chooses the default—the page does not promise a numeric value—and its legacy alias is `agents.max_threads`. Codex docs also do not state the Responses no-fixed-depth or no-total-created limit, so never transfer that claim.",
            "Codex subagents inherit the current sandbox and permission mode plus live runtime overrides; a custom agent may be narrowed, for example to read-only. Sandbox controls what commands can technically touch under the ordinary execution boundary, while approval policy controls when execution must pause—including before an escalation that may run outside that boundary or use the network. Approval is therefore a decision gate, not containment, and neither control is a concurrency counter. Keep a code-directed fallback and make capacity, inheritance, exclusions, queueing, and effective breadth observable.",
          ],
          sourceIds: [
            "openai-responses-multi-agent",
            "openai-codex-subagents",
            "openai-codex-sandbox-security",
            "openai-agents-python-patterns",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Bounded fan-out of independent workers followed by a typed evidence-preserving join.",
        trigger: "A decomposition produces a finite work set whose items pass independence and authority checks.",
        completion: "The declared all, validated k-of-n, first-valid, or best-effort join resolves before its deadline, or returns partial/expired explicitly.",
        controlOwner: "The application scheduler owns admission, cancellation, deadlines, and join resolution.",
        stateOwner: "Each branch has isolated attempt state; the parent owns immutable result references and join state.",
        contextBoundary: "Workers receive only their partition, shared rubric, and required reference snapshot.",
        toolAuthority: "Read-only parallel work is preferred; conflicting writes are serialized or assigned disjoint resources.",
        delegationPayload: "Parent/task IDs, partition key, output schema, evidence rule, deadline, budget, and return destination.",
        concurrencyPolicy: "A configured semaphore and queue bound active work; rate, token, and downstream capacity also constrain admission.",
        failurePolicy: "Classify branch failures, cancel when the join cannot succeed, and never relaunch ambiguous side effects as ordinary retries.",
        evidence: "Branch attempts, start/end times, resource use, artifacts, validation, cancellation reason, and join decision.",
        escalation: "Conflicting high-impact results, an unmet validated-result threshold, or an exhausted deadline returns the evidence set to a human owner.",
      },
      practice: {
        title: "Specify a fan-out that can fail honestly",
        brief:
          "Take a research, review, or processing task and design its concurrency and partial-result contract before running it.",
        steps: [
          "Identify the exact concurrency plane and prove that work items do not share unsafe mutable state.",
          "Set maximum active work, queue length, per-branch budget, overall deadline, and cancellation behavior.",
          "Choose and justify an all, validated k-of-n, first-valid, or best-effort join.",
          "Define result ordering, provenance, conflict, late-arrival, and partial-output semantics.",
          "Simulate one slow branch, one invalid branch, one duplicate return, and one capacity reduction.",
        ],
        artifact: "A concurrency matrix, join state machine, and injected-failure record.",
        reviewGate:
          "The system can explain what completed, what did not, why the join resolved, and whether any late or duplicated work can still change the outcome.",
        template:
          "# Fan-out / fan-in contract\n\n## Execution plane and independence proof\n\n## Capacity\n- Active limit:\n- Queue limit:\n- Branch budget:\n- Overall deadline:\n\n## Join\n- Policy: all | validated-k-of-n | first-valid | best-effort\n- k / n and per-result validator:\n- Partial-result rule:\n- Late-result rule:\n- Cancellation rule:\n\n## Failure injections\n| Injection | Expected state | Evidence retained |\n|---|---|---|\n| Slow branch | | |\n| Invalid result | | |\n| Duplicate return | | |\n",
      },
      checkpoint: {
        question:
          "A model emits four function calls in one response. What can you safely infer?",
        options: [
          "Four complete agents are running concurrently",
          "The provider returned four tool-call intents; execution concurrency and agent topology depend on the SDK and application",
          "All four calls are authorized and independent",
          "The join can be omitted because the model issued the calls together",
        ],
        correctIndex: 1,
        explanation:
          "Parallel tool-call emission is only one plane. Handler scheduling, authorization, state, and aggregation remain application concerns.",
      },
      lab: {
        title: "Graph contract: fan-out and join",
        instruction:
          "Run a deterministic simulation across all, validated k-of-n, first-valid, and best-effort joins under slow, invalid, and duplicate branches.",
        evidencePrompt:
          "Which join policy best matches the business completion rule, and what evidence would a partial answer need to display?",
      },
      takeaway:
        "Parallelism is safe only when independence, capacity, cancellation, and the meaning of partial completion are explicit.",
    },
    "manager-roles-ownership": {
      kicker: "05 · One owner must close the loop",
      title: "Manager Roles and Final-Answer Ownership",
      summary:
        "Design a manager topology in which delegation does not dissolve decision rights, state ownership, or accountability.",
      objective:
        "Write role cards for a manager and specialists, including what each may decide, return, publish, and escalate.",
      artifact: "Role, ownership, and final-answer matrix",
      concepts: [
        "manager pattern",
        "agents as tools",
        "role contract",
        "final-answer owner",
        "quality gate",
      ],
      sections: [
        {
          heading: "A manager delegates work but retains control",
          paragraphs: [
            "OpenAI distinguishes a manager that invokes specialist agents as tools from a handoff that transfers control. In the manager topology, specialists produce bounded results and the manager decides what to request next, how to reconcile them, and what final response to issue. The practical guide treats this centralized pattern as useful when one agent should preserve a shared policy or user-facing voice.",
            "Give the manager a narrow synthesis responsibility, not every capability. A manager with all tools and all context becomes a privilege and attention bottleneck, while specialists without explicit output contracts return prose the manager cannot verify.",
          ],
          sourceIds: [
            "openai-agents-orchestration",
            "openai-practical-guide",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Separate role expertise from authority",
          paragraphs: [
            "Anthropic's research system reports a lead researcher that plans and coordinates parallel research subagents. That case supports the value of context isolation and dynamic delegation for broad research, but its internal quality and token results are not universal constants. Translate the pattern into explicit role cards: objective, evidence access, allowed tools, prohibited actions, output schema, budget, and escalation.",
            "A specialist may be more knowledgeable about a domain without becoming authorized to publish, spend, delete, or make a final business decision. Final-answer ownership includes checking sources, surfacing dissent, recording unresolved uncertainty, and accepting or rejecting the completion claim.",
          ],
          sourceIds: [
            "anthropic-research-system",
            "openai-practical-guide",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Do not confuse runtime hierarchy with organizational accountability",
          paragraphs: [
            "The governance model distinguishes Session, root or lead agent, Host, permissions, quality evidence, and human sign-off. A runtime root may coordinate descendants, yet it is not an operating-system root and does not become the accountable human merely because it occupies the top of a task tree. Permission approval authorizes an attempted action; a quality gate judges evidence; human sign-off records the named decision-maker's release decision and acceptance of residual risk within an assigned governance role. The signing event does not by itself create, transfer, or exhaust organizational or legal accountability. This is a course governance boundary, not an OpenAI rule; legal accountability is jurisdiction- and fact-specific and requires qualified review.",
            "Framework names and inheritance rules vary. Verify whether child agents inherit tools, guardrails, budgets, callbacks, and tracing in the exact runtime, then encode the intended policy explicitly rather than relying on hierarchy alone.",
          ],
          sourceIds: [
            "openai-agents-orchestration",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "One manager uses specialists as bounded tools and remains the final-answer owner.",
        trigger: "The manager accepts a task and selects a specialist only when its role contract matches the needed evidence.",
        completion: "The manager validates required specialist artifacts, resolves or exposes conflict, and records one terminal response.",
        controlOwner: "The manager within application-enforced route, budget, and authority constraints.",
        stateOwner: "The application owns the task record; the manager owns only a model-visible projection.",
        contextBoundary: "Specialists receive scoped context; the manager receives structured results and artifact references, not hidden worker transcripts by default.",
        toolAuthority: "Specialists get role-specific least privilege; only the authorized external actor may publish or mutate consequential state.",
        delegationPayload: "Role ID, task, non-goals, evidence sources, output schema, quality rubric, budget, and return destination.",
        concurrencyPolicy: "Independent specialists may run concurrently; the manager admits work and waits according to the declared join.",
        failurePolicy: "Reject malformed or unsupported specialist claims, preserve dissent, and replan within budget rather than fabricating a synthesis.",
        evidence: "Role selection, task packets, structured returns, cited artifacts, manager validation, conflicts, and final decision.",
        escalation: "The manager escalates when roles disagree on a consequential fact, evidence is insufficient, or publication authority is absent.",
      },
      practice: {
        title: "Write role cards that prevent authority drift",
        brief:
          "Design a manager and three specialists for one task without giving any role implied privileges.",
        steps: [
          "Name the final-answer, state, quality, and external-action owners separately.",
          "For each role, define objective, evidence access, allowed tools, prohibited actions, and output schema.",
          "Specify how the manager verifies a specialist return and handles disagreement.",
          "Map runtime inheritance defaults to the intended policy and override unsafe assumptions.",
          "Test a specialist that exceeds scope, lacks evidence, or claims completion prematurely.",
        ],
        artifact: "A role matrix and three adversarial delegation traces.",
        reviewGate:
          "Every role can state what it owns, what it cannot authorize, where it returns results, and who accepts final completion.",
        template:
          "# Manager and role contract\n\n## Ownership\n| Concern | Owner | Acceptance evidence |\n|---|---|---|\n| Control | | |\n| Durable state | | |\n| Quality | | |\n| External action | | |\n| Final answer | | |\n\n## Role cards\n| Role | Objective | Context | Tools | Prohibited | Output schema | Escalate when |\n|---|---|---|---|---|---|---|\n| Manager | | | | | | |\n| Specialist | | | | | | |\n",
      },
      checkpoint: {
        question:
          "In a manager-with-agents-as-tools topology, who normally owns the final user-facing synthesis?",
        options: [
          "Whichever specialist finishes last",
          "The manager, after validating specialist returns",
          "The Host operating system",
          "Every worker independently",
        ],
        correctIndex: 1,
        explanation:
          "Agents-as-tools preserve the manager as the runtime control and final-synthesis owner. Specialists return bounded work; named humans and institutions retain the applicable release, organizational, and legal accountability.",
      },
      lab: {
        title: "Handoff contract: ownership matrix",
        instruction:
        "Make final-answer, durable-state, and external-action ownership explicit; the decision remains blocked while any one owner is missing.",
        evidencePrompt:
          "Which role had capability without authority, and what contract field prevented an unauthorized action?",
      },
      takeaway:
        "Hierarchy does not create accountability; named owners, bounded roles, and acceptance evidence do.",
    },
    "delegation-handoffs": {
      kicker: "06 · Transfer work without losing the caller",
      title: "Delegation, Agents-as-Tools, and Handoffs",
      summary:
        "Choose whether control stays with a manager or transfers to a specialist, then preserve continuity through a typed task and return packet.",
      objective:
        "Specify one manager delegation and one handoff, including active-agent state, return ownership, evidence, and escalation.",
      artifact: "Delegation and handoff protocol",
      concepts: [
        "agents as tools",
        "handoff",
        "active agent",
        "caller identity",
        "structured return",
        "context loss",
      ],
      sections: [
        {
          heading: "Decide whether control stays or moves",
          paragraphs: [
            "In OpenAI's orchestration semantics, a manager calling an agent as a tool retains control and normally synthesizes the final answer. A handoff changes the active agent so the specialist handles subsequent turns. These are not stylistic alternatives: they change who chooses the next action, which instructions and guardrails apply, and who owns completion.",
            "OpenAI run results expose last-agent or equivalent state because a handoff may need to continue on the next turn with the specialist still active. An application that always restarts from the original agent can silently undo the transfer and create inconsistent policy or conversation behavior.",
          ],
          sourceIds: [
            "openai-agents-orchestration",
            "openai-results-state",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Delegate through a loss-aware task packet",
          paragraphs: [
            "Claude Academy and the Claude Agent SDK emphasize scoped subagent instructions, context isolation, restricted tools, structured returns, and explicit obstacle reporting. Isolation reduces context competition, but the parent cannot assume a short summary preserves all evidence. Put artifact references, source citations, unresolved uncertainty, blockers, and consumed budget in distinct return fields.",
            "A delegation packet should carry caller and task identity, objective, non-goals, evidence scope, allowed tools, deadline, output schema, acceptance test, and return destination. A worker may propose follow-up work but should not recursively create a larger team unless the orchestration contract grants that capability and budget.",
          ],
          sourceIds: [
            "claude-academy-subagents",
            "claude-sdk-subagents",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Verify handoff and child semantics in the deployed runtime",
          paragraphs: [
            "Subagent tool inheritance, nested spawning, guardrails, turn limits, return channels, and whether a handoff persists are runtime-specific. A task tree is not necessarily a conversation-thread tree, and a capability to spawn descendants is not the same as a team policy permitting arbitrary delegation.",
            "Record the active agent, parent task, current owner, and expected return destination in durable state. Test resume, cancellation, a worker returning to the wrong caller, and a handoff followed by a new user turn against the exact SDK version.",
          ],
          sourceIds: [
            "claude-sdk-subagents",
            "openai-results-state",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Manager-as-tools for bounded background work; explicit handoff only when a specialist must own subsequent turns.",
        trigger: "A route selects a declared role and the application validates its authority and continuity requirements.",
        completion: "A tool-style delegation returns to the manager; a handoff remains active until its terminal or transfer condition is recorded.",
        controlOwner: "Manager for agent-tools; active specialist for handoffs, bounded by application policy.",
        stateOwner: "Application state records active agent, parent task, delegation attempts, and return status.",
        contextBoundary: "Each specialist receives a scoped task packet; sensitive parent context is referenced or redacted, not copied wholesale.",
        toolAuthority: "Role-specific tools and approvals; authority does not expand merely because control is handed off.",
        delegationPayload: "Task and caller IDs, return destination, objective, non-goals, evidence, tools, budget, schema, acceptance, and escalation.",
        concurrencyPolicy: "Independent tool-style delegations may run in parallel; user-facing handoffs are serialized unless multi-party semantics are explicit.",
        failurePolicy: "Preserve interruption and active-agent state; reject orphaned, duplicate, late, or misaddressed returns.",
        evidence: "Delegation packet, selected role, active-agent transitions, artifact references, validation, and terminal owner.",
        escalation: "Missing caller, unsafe inheritance, unresolved specialist obstacle, or disputed completion returns control to the designated human or manager.",
      },
      practice: {
        title: "Design the same task as a tool call and a handoff",
        brief:
          "Expose how ownership, state, and the next user turn change under the two delegation semantics.",
        steps: [
          "Write the specialist task packet and structured return schema once.",
          "Map control, active-agent state, final-answer ownership, and next-turn behavior for agents-as-tools.",
          "Map the same fields for a handoff and define when control returns or transfers again.",
          "Test missing evidence, wrong return destination, interrupted approval, and resume after a new turn.",
          "Choose the topology whose ownership semantics match the user experience and risk.",
        ],
        artifact: "A side-by-side protocol plus four continuity tests.",
        reviewGate:
          "A reviewer can identify the active agent and final-answer owner at every point without reading an informal transcript.",
        template:
          "# Delegation and handoff protocol\n\n## Task packet\n```json\n{\"task_id\":\"\",\"caller_id\":\"\",\"return_to\":\"\",\"objective\":\"\",\"non_goals\":[],\"evidence_refs\":[],\"allowed_tools\":[],\"budget\":{},\"output_schema\":\"\",\"escalate_to\":\"\"}\n```\n\n## Ownership comparison\n| Moment | Manager-as-tools owner | Handoff owner | Durable state change |\n|---|---|---|---|\n| Before delegation | | | |\n| Specialist active | | | |\n| Result returned | | | |\n| Next user turn | | | |\n",
      },
      checkpoint: {
        question:
          "After a handoff, a new user turn arrives. What must the application know?",
        options: [
          "Only the original manager's name",
          "Which agent is currently active and the runtime-specific state needed to continue it",
          "The total number of available Hosts",
          "Nothing; every turn should restart the original agent",
        ],
        correctIndex: 1,
        explanation:
          "A handoff changes control. Persisting active-agent state prevents the next turn from silently reverting ownership.",
      },
      lab: {
        title: "Handoff contract: preserve continuity",
        instruction:
        "Choose whether control transfers, then require a return envelope and explicit evidence/effect fields before either manager delegation or handoff can complete.",
        evidencePrompt:
          "At which transition could the system orphan work or lose the active specialist, and which durable field prevents it?",
      },
      takeaway:
        "Delegation is not a prompt; it is a transfer contract with identity, authority, evidence, and a return path.",
    },
    "orchestrator-workers-verification": {
      kicker: "07 · Decompose dynamically, verify independently",
      title: "Orchestrator-Workers and Evaluator-Optimizer Loops",
      summary:
        "Use dynamic decomposition for genuinely open tasks while keeping worker scope, merge evidence, verification independence, and stopping bounded.",
      objective:
        "Design an orchestrator-worker graph with a progress artifact, independent verifier, evaluator rubric, and hard stop conditions.",
      artifact: "Dynamic-work and verification protocol",
      concepts: [
        "dynamic decomposition",
        "worker isolation",
        "evaluator-optimizer",
        "independent verification",
        "progress artifact",
        "termination",
      ],
      sections: [
        {
          heading: "Use dynamic decomposition only when subtasks emerge from the evidence",
          paragraphs: [
            "Anthropic's effective-agent patterns distinguish orchestrator-workers from fixed parallelization: the orchestrator determines subtasks at runtime. Its multi-agent research account illustrates a lead agent creating parallel research directions and using isolated contexts. Pinned Claude Cookbooks provide minimal implementations of these patterns, but not production durability or security.",
            "A worker receives a bounded objective, evidence domain, output contract, budget, and return destination. The orchestrator tracks coverage and dependencies rather than repeatedly asking workers to produce broad answers that overlap.",
          ],
          sourceIds: [
            "anthropic-effective-agents",
            "anthropic-research-system",
            "claude-cookbooks-patterns",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Separate production, synthesis, and verification",
          paragraphs: [
            "OpenAI's SDK examples cover orchestration, parallel work, and judge-style loops. Use an evaluator-optimizer loop when a rubric can diagnose a revisable artifact, and use an independent verifier when the claim needs evidence that did not originate from the producer's own summary. The verifier should inspect referenced artifacts, run checks where possible, and be allowed to return fail or unknown.",
            "Independence is a design property, not a role name. A verifier that sees only the producer's rationale, shares the same missing source, or is pressured to approve completion cannot supply strong assurance. Preserve disagreement rather than averaging it away.",
          ],
          sourceIds: [
            "openai-sdk-orchestration",
            "openai-agents-python-patterns",
            "anthropic-effective-agents",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Carry progress across context windows and runtime changes",
          paragraphs: [
            "Anthropic's long-running harness guidance uses structured progress and verification artifacts so a later context can resume without reconstructing intent from chat. Record the plan, completed items, current owner, test results, blockers, and next safe action in durable form. A compact summary can point to that record but should not replace it.",
            "SDK pattern examples and orchestration helpers can evolve. Pin runnable references, test termination and resume semantics, and keep application-owned progress so the workflow can survive model, context, or worker replacement.",
          ],
          sourceIds: [
            "anthropic-harness-long-running",
            "openai-agents-python-patterns",
            "claude-cookbooks-patterns",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Dynamic orchestrator-workers with separate synthesis and independent verification stages.",
        trigger: "An open task passes the multi-agent justification gate and declares coverage and outcome criteria.",
        completion: "Required coverage is evidenced, artifacts pass independent checks, and all unresolved items are accepted, escalated, or explicitly deferred.",
        controlOwner: "The orchestrator plans within application-enforced depth, breadth, cost, and time limits.",
        stateOwner: "A durable progress ledger owns task, worker, artifact, verifier, and terminal status.",
        contextBoundary: "Workers see scoped evidence; synthesizer sees structured returns; verifier can inspect primary artifacts independently.",
        toolAuthority: "Workers receive domain-specific least privilege; verifier tools are read-only unless a separate repair task is authorized.",
        delegationPayload: "Coverage target, evidence scope, exclusions, output schema, artifact path, rubric, budget, and return destination.",
        concurrencyPolicy: "Breadth and depth are capped; only independent work runs concurrently and shared writes use isolated branches or serialization.",
        failurePolicy: "Do not recursively spawn to escape a blocker; record unknown, replan within budget, or escalate.",
        evidence: "Plan revisions, worker task packets, artifacts, source references, evaluator feedback, verifier results, and stop reason.",
        escalation: "Conflicting evidence, failed independent checks, repeated non-improvement, or exhausted budget goes to the accountable owner.",
      },
      practice: {
        title: "Build a bounded research-and-verification harness",
        brief:
          "Design a dynamic decomposition where completion depends on inspectable coverage and independent checks.",
        steps: [
          "Define coverage and terminal criteria before allowing runtime decomposition.",
          "Create a worker packet with an artifact path, evidence rule, uncertainty field, and budget.",
          "Separate synthesis criteria from an independent verification checklist.",
          "Write a durable progress record that another agent could resume without the original transcript.",
          "Inject duplicate work, a shared blind spot, evaluator non-improvement, and context replacement.",
        ],
        artifact: "A harness specification, progress ledger, and independent verification report.",
        reviewGate:
          "A new coordinator can resume from artifacts, and a verifier can fail the work without depending on the producer's narrative.",
        template:
          "# Dynamic work harness\n\n## Coverage and stop criteria\n\n## Worker task packet\n| Field | Value |\n|---|---|\n| Objective / exclusions | |\n| Evidence scope | |\n| Artifact path / schema | |\n| Budget / deadline | |\n| Return destination | |\n\n## Progress ledger\n- Completed:\n- In progress / owner:\n- Blockers:\n- Verification evidence:\n- Next safe action:\n\n## Verifier rubric and independence check\n",
      },
      checkpoint: {
        question:
          "What most strengthens an independent verifier?",
        options: [
          "Giving it the producer's approval rationale and asking it to agree",
          "Allowing it to inspect primary artifacts, run separate checks, and return fail or unknown",
          "Using the same summary as the only evidence",
          "Removing the stopping rule so it can keep reviewing",
        ],
        correctIndex: 1,
        explanation:
          "Verification gains value from independent evidence access, falsifiable checks, and permission to reject or remain uncertain.",
      },
      lab: {
        title: "Graph contract: orchestrate and verify",
        instruction:
          "Build a bounded worker tree, merge artifact references, and test a verifier against a producer with a shared blind spot.",
        evidencePrompt:
          "Which verifier input is independent of the producer, and what hard stop prevents an endless evaluator loop?",
      },
      takeaway:
        "Dynamic work becomes trustworthy when decomposition is bounded, progress is durable, and verification can contradict the producer.",
    },
    "tools-aci-mcp": {
      kicker: "08 · The action boundary",
      title: "Tools, Agent-Computer Interfaces, and MCP",
      summary:
        "Design narrow tool contracts, distinguish capability exchange from orchestration, and migrate deliberately across MCP protocol generations.",
      objective:
        "Specify one tool surface and one MCP integration with least privilege, approval, validation, and an explicit protocol-version boundary.",
      artifact: "Tool and MCP capability contract",
      concepts: [
        "agent-computer interface",
        "function schema",
        "tool result",
        "MCP capability",
        "protocol drift",
        "approval",
      ],
      sections: [
        {
          heading: "Treat every tool as a narrow action contract",
          paragraphs: [
            "OpenAI exposes hosted, local, function, MCP, agent-as-tool, and other tool surfaces. Function calling supplies model intent, typed arguments, a call identity, and a result loop; the application still validates arguments, authorizes the caller, executes the operation, and returns a compact result. Anthropic's tool guidance likewise emphasizes clear namespaces, precise schemas, actionable errors, and eval-driven refinement.",
            "Anthropic uses ‘agent-computer interface’ (ACI) for the interface between an agent and its tools or computing environment, drawing an analogy to HCI and emphasizing tool documentation and testing. This course operationalizes that established term as an action-boundary register that adds actor, object, read/write class, approval, idempotency, effect verification, isolation, data egress, and escalation. The register is course-original synthesis; ACI itself is not, and neither is an OpenAI API object or an MCP rename. Prefer task-level tools with narrow effects over generic shell, browser, database, or filesystem access.",
          ],
          sourceIds: [
            "openai-tools",
            "openai-function-calling",
            "anthropic-writing-tools",
            "anthropic-effective-agents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "MCP exposes capabilities; it does not orchestrate the task",
          paragraphs: [
            "The Current MCP revision verified on 2026-08-23 is `2026-07-28`. It defines a stateless core with self-contained requests: every request carries `io.modelcontextprotocol/protocolVersion` and `io.modelcontextprotocol/clientCapabilities` in `_meta`; clients SHOULD add `clientInfo`, and results SHOULD add `serverInfo`. It does not supply task decomposition, an agent loop, durable memory, sandboxing, human approval, or an evaluation harness. Those remain client, server, runtime, or application responsibilities.",
            "A version-pinned MCP SDK is an implementation anchor, not evidence that a remote server is trustworthy. Apply allowlists, input and output validation, consent and approval, credential separation, rate limits, data-minimization, and a clear trust label before exposing third-party capabilities.",
          ],
          sourceIds: [
            "mcp-spec-2026",
            "mcp-versioning-2026",
            "mcp-python-sdk-v2",
            "openai-mcp-connectors",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Use legacy Academy material as a migration contrast only",
          paragraphs: [
            "The 2026-07-28 changelog removes protocol sessions and `Mcp-Session-Id`, the `initialize` / `notifications/initialized` handshake, `ping`, `logging/setLevel`, `notifications/roots/list_changed`, the Streamable HTTP GET endpoint, `resources/subscribe` / `resources/unsubscribe`, and SSE resumption/redelivery through `Last-Event-ID` and event IDs. It introduces mandatory-to-implement `server/discover` (optional for a client to call up front), per-request version and capability metadata, explicit server-minted handles for cross-call state, `subscriptions/listen`, MRTR through `InputRequiredResult` plus retry with `inputResponses`, and required `resultType` values `complete` or `input_required`.",
            "The same revision deprecates—but has not yet removed—Roots, Sampling, Logging, HTTP+SSE, Sampling `includeContext` values `thisServer` / `allServers`, and OAuth Dynamic Client Registration in favor of Client ID Metadata Documents. Compatibility is explicit: Current may receive backward-compatible updates; peers may support several revisions; `UnsupportedProtocolVersionError` lists supported revisions; handshake-era `2025-11-25` and earlier needs the documented compatibility path; and an older result lacking `resultType` is treated as `complete`. A broken new response stream must be reissued with a new request ID, which is transport recovery—not business idempotency.",
            "Claude Academy's Advanced MCP course remains a useful historical example of the older session, initialization, Roots, Sampling, Logging, and SSE model, not a normative current contract. Pin actual client and server revisions, run negotiation and downgrade tests, and remember that protocol compatibility neither grants business authority nor proves server output safe.",
          ],
          sourceIds: [
            "claude-academy-mcp-legacy",
            "mcp-changelog-2026",
            "mcp-versioning-2026",
            "mcp-ts-migration-2026",
            "mcp-python-sdk-v2",
            "mcp-spec-2026",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "One agent uses approved function and MCP capabilities through an application policy gateway.",
        trigger: "A model proposes a declared tool call and the gateway authenticates user, agent, operation, and policy context.",
        completion: "The call returns a validated success, safe error, denied, approval-required, timeout, or ambiguous status.",
        controlOwner: "The application loop chooses whether a tool proposal may execute and how its result affects the next turn.",
        stateOwner: "The application records call ID, operation ID, approval, request hash, result, and side-effect status.",
        contextBoundary: "The model sees minimal descriptions and compact results; credentials and raw privileged data remain outside context.",
        toolAuthority: "Per-tool, per-user, per-resource least privilege with separate approval for consequential mutations.",
        delegationPayload: "Tool name/version, typed arguments, caller and operation IDs, requested authority, purpose, and deadline.",
        concurrencyPolicy: "Independent reads, and mutations that an authoritative store applies atomically under a proven commutative or merge contract, may run concurrently. Other shared-state mutations require authoritative CAS/OCC, a fenced lease or single writer, or serialization; stable idempotency keys separately deduplicate retries of the same logical operation.",
        failurePolicy: "Validate errors, distinguish definite failure from ambiguous outcome, and disable or quarantine a misbehaving remote capability.",
        evidence: "Tool definition version, authorization and approval decision, arguments hash, execution result, latency, and downstream effect.",
        escalation: "Unexpected capability drift, prompt injection, excessive data request, ambiguous mutation, or policy mismatch pauses execution.",
      },
      practice: {
        title: "Design and migrate a capability surface",
        brief:
          "Turn a broad computer action into narrow tools, then document the MCP version and trust boundary that exposes them.",
        steps: [
          "Replace one generic interface with task-level tools and explicit typed errors.",
          "Define authentication, authorization, approval, validation, idempotency, and audit fields per tool.",
          "Map which responsibilities belong to MCP and which remain in the orchestrator or application.",
          "Classify an older Academy or v1 example and rewrite its assumptions for MCP 2026-07-28.",
          "Run injection, overbroad-argument, server-drift, denial, timeout, and ambiguous-mutation fixtures.",
        ],
        artifact: "A tool catalog, MCP compatibility matrix, and trust-boundary test record.",
        reviewGate:
          "A reviewer can identify exactly what the protocol exchanges, what authority is enforced elsewhere, and which older examples must not govern the current implementation.",
        template:
          "# Tool and MCP capability contract\n\n## Tool catalog\n| Tool / version | Purpose | Input / output | Authority | Approval | Error states |\n|---|---|---|---|---|---|\n| | | | | | |\n\n## Responsibility boundary\n| Concern | MCP | Client / orchestrator | Application / infrastructure |\n|---|---|---|---|\n| Capability description | | | |\n| Task decomposition | | | |\n| Authorization | | | |\n| Sandbox / credentials | | | |\n| Durable state / eval | | | |\n\n## Protocol versions and migration tests\n",
      },
      checkpoint: {
        question: "What does MCP provide by itself?",
        options: [
          "A complete agent orchestrator with memory, sandboxing, and evals",
          "A standardized way to exchange declared capabilities and related protocol data",
          "Automatic authorization for every connected tool",
          "A guarantee that remote server output is safe",
        ],
        correctIndex: 1,
        explanation:
          "MCP is a capability protocol. Control flow, state, authority, isolation, approval, and evaluation remain separate responsibilities.",
      },
      lab: {
        title: "Handoff contract: capability versus authority",
        instruction:
        "Validate tool schema, side-effect declaration, execution-time authority, the MCP/application boundary, and isolation of an untrusted connected result.",
        evidencePrompt:
          "Which connected capability remained unauthorized, and which 2026 migration fact invalidated the legacy implementation?",
      },
      takeaway:
        "A protocol can describe a capability; only your control plane can decide whether, when, and with what evidence it may act.",
    },
    "context-state-memory": {
      kicker: "09 · Keep seven state objects separate",
      title: "Context, Conversation, Session, Run State, and Memory",
      summary:
        "Design what the model can see, what the application must preserve, and what may be retrieved later as separate layers.",
      objective:
        "Create a seven-object state map and recovery plan that distinguishes context, application/run state, conversation/session, event log/history, checkpoint/RunState, memory, and compaction; govern audit evidence across them.",
      artifact: "Context and durable-state architecture",
      concepts: [
        "context: application-local and model-visible projections",
        "application / run state",
        "conversation / session",
        "event log / history",
        "checkpoint / RunState",
        "memory",
        "compaction",
      ],
      sections: [
        {
          heading: "Separate application-local data from model-visible context",
          paragraphs: [
            "OpenAI's context guidance distinguishes local application context from the conversation content visible to a model. Running-agent guidance documents several continuation strategies, including application-managed history, sessions, conversation identifiers, and previous-response links. Results can also contain active-agent and interruption state rather than a completed answer.",
            "Define one canonical continuity source for each conversation. If the application deliberately combines replayed history with server-managed session, conversation, or previous-response state, document reconciliation and deduplication rules and test that content is not injected twice. Keep secrets, credential handles, and privileged objects in application context unless a narrowly approved tool needs a safe projection.",
          ],
          sourceIds: [
            "openai-context-management",
            "openai-running-agents",
            "openai-results-state",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Context is an attention budget, not the database",
          paragraphs: [
            "Anthropic describes context engineering as selecting the smallest high-signal set a model needs now. Retrieval, compaction, subagent isolation, and memory can improve attention, but none replaces structured task state, provenance, or access control. Store facts and artifacts durably, retrieve them just in time, and retain references so a claim can be traced after the visible context changes.",
            "OpenAI compaction helps control long-context cost and latency. Compacted state is optimized for continuation, not for human audit or exact reconstruction. Never use a compacted blob as the only record of approvals, tool effects, evidence, or unresolved uncertainty.",
          ],
          sourceIds: [
            "anthropic-context-engineering",
            "openai-compaction",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Map session and checkpoint semantics to the actual runtime",
          paragraphs: [
            "Anthropic's Managed Agents architecture separates a durable append-only Session event log, a Harness that runs the model loop and manages context, and a Sandbox that executes code. This is a useful current architecture, not a universal definition of ‘session.’ Another runtime may use session for conversation history, SDK storage, or a resumable run.",
            "Document exactly what survives process loss, compaction, cancellation, and SDK upgrades. A session log, checkpoint, memory record, snapshot, and audit event have different completeness and retention promises; test each instead of treating the labels as synonyms.",
            "State-write correctness remains an application boundary. Microsoft's Cosmos DB sample is a bounded example of atomic acquisition, ETag optimistic concurrency, TTL recovery, and monotonically increasing fencing tokens whose stale values are rejected downstream. Apply the mechanism only where the actual authoritative store and every consequential downstream write enforce the required atomic and stale-writer checks.",
          ],
          sourceIds: [
            "anthropic-managed-agents",
            "openai-running-agents",
            "openai-compaction",
            "azure-cosmos-distributed-lock",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "One agent loop over application-owned event and snapshot state with deliberate context assembly.",
        trigger: "A new or resumed run resolves an authenticated workflow ID and compatible state version.",
        completion: "Terminal business state is durably recorded independently of the final model message.",
        controlOwner: "The runner assembles context, resumes interruptions, and validates state transitions.",
        stateOwner: "Application event log and snapshots; model context is an ephemeral projection.",
        contextBoundary: "A documented assembler selects instructions, recent turns, retrieved evidence, and summaries under token and privacy budgets.",
        toolAuthority: "Application context holds credential handles; model-visible tool arguments expose only approved values.",
        delegationPayload: "State version, scoped task facts, artifact references, active owner, and continuation token where the runtime requires it.",
        concurrencyPolicy: "Use an authoritative store's atomic conditional update (version/CAS), or a single-writer or lease protocol with fencing, to reject stale concurrent writes; a best-effort process lock alone is insufficient.",
        failurePolicy: "Resume only from a verified checkpoint or event position; reject incompatible or partially persisted state.",
        evidence: "Context-assembly manifest, event sequence, snapshot version, memory reads/writes, compaction event, and terminal record.",
        escalation: "Missing provenance, state-version conflict, sensitive-context leak, or uncertain resume position pauses the run.",
      },
      practice: {
        title: "Design a seven-object state map",
        brief:
          "Assign each datum to its proper layer and prove that the workflow can resume without treating context as durable truth.",
        steps: [
          "Inventory instructions, turns, task facts, artifacts, preferences, approvals, tool effects, and audit requirements.",
          "Map each item across context, application/run state, conversation/session, event log/history, checkpoint/RunState, memory, and compaction; treat audit evidence as a governed cross-cutting record.",
          "Define retention, access, provenance, version, and deletion policy for every durable layer.",
          "Specify context assembly and compaction without losing artifact references or unresolved blockers.",
          "Simulate process loss, context replacement, state-version conflict, and deletion requests.",
        ],
        artifact: "A seven-object map, context assembler contract, audit linkage, and recovery trace.",
        reviewGate:
          "The system can resume and explain a decision from durable evidence even when the original model context is unavailable.",
        template:
          "# Context and state architecture\n\n| Datum | System of record | Model-visible? | Retention | Provenance | Recovery role |\n|---|---|---|---|---|---|\n| Instruction | | | | | |\n| Task fact | | | | | |\n| Tool effect | | | | | |\n| Memory | | | | | |\n| Approval | | | | | |\n\n## Context assembler\n- Required:\n- Retrieved just in time:\n- Excluded / redacted:\n- Compaction rule:\n\n## Resume invariant\n",
      },
      checkpoint: {
        question: "Which statement about compaction is safest?",
        options: [
          "A compacted context is a complete audit record",
          "Compaction can support continuation, but durable task state and evidence must remain separately inspectable",
          "Compaction makes versioned state unnecessary",
          "A compacted summary can safely contain every credential",
        ],
        correctIndex: 1,
        explanation:
          "Compaction optimizes model context. It does not guarantee exact provenance, human readability, or durable business-state recovery.",
      },
      lab: {
        title: "Context and recovery: classify the layers",
        instruction:
        "Lose model context, conversation continuity, application session, or run state; then test whether checkpoint, event-log, and audit-link evidence can reconstruct it.",
        evidencePrompt:
          "Which decision remained reconstructable after context loss, and which durable record made that possible?",
      },
      takeaway:
        "The model works from context; the system recovers from durable state; accountability depends on evidence that neither summary nor memory may replace.",
    },
    "budgets-concurrency-stopping": {
      kicker: "10 · Bound every dimension",
      title: "Budgets, Concurrency, Backpressure, and Stopping",
      summary:
        "Control turns, tokens, time, cost, breadth, depth, queues, and side-effect exposure as a budget vector rather than one magic limit.",
      objective:
        "Write admission, scheduling, and termination policies for a bounded multi-agent workload under changing runtime capacity.",
      artifact: "Budget and scheduler policy",
      concepts: [
        "budget vector",
        "admission control",
        "semaphore",
        "backpressure",
        "deadline",
        "critical path lower bound",
        "stopping rule",
      ],
      sections: [
        {
          heading: "Budget the loop and the graph",
          paragraphs: [
            "OpenAI's orchestration guidance and Claude Agent SDK loop documentation expose turn, time, cost, and execution controls through their respective runtimes. Define per-call, per-worker, per-run, and per-user or tenant limits. The budget must cover token input and output, tool calls, wall time, retries, fan-out breadth, nesting depth, active work, queued work, and consequential side-effect attempts.",
            "Stopping is a business predicate as well as a technical ceiling. Stop when the accepted artifact exists, incremental improvement falls below a threshold, the remaining budget cannot satisfy the join, evidence conflicts at a consequential boundary, or an authorized owner must decide.",
          ],
          sourceIds: [
            "openai-sdk-orchestration",
            "claude-sdk-agent-loop",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Use backpressure instead of spawning optimism",
          paragraphs: [
            "Parallel independent work can reduce wall-clock time, but OpenAI latency and cost guidance also make clear that more requests and tokens increase resource use. Anthropic's multi-agent research case reports substantial token multipliers in its own system; those figures illustrate a trade-off, not a universal constant. Measure cost and task success under representative load.",
            "A scheduler needs admission control, bounded queues, fair sharing, downstream rate awareness, deadlines, cancellation, and a current resource-constrained makespan and bottleneck estimate. The dependency critical path remains a lower bound when finite workers, queues, or shared resources add scheduling constraints; it is not the finite-capacity schedule itself. When capacity shrinks, protect work that is completion-critical in the current resource-constrained schedule; queue, reduce breadth, choose a cheaper verified path, or reject optional branches early. Do not launch work that cannot finish within its remaining budget merely because a slot appears momentarily free.",
          ],
          sourceIds: [
            "openai-latency",
            "openai-cost",
            "anthropic-research-system",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Capacity numbers belong to a specific runtime and date",
          paragraphs: [
            "As of 2026-08-23, Responses Multi-agent is Beta for all GPT-5.6 models. Its `multi_agent.max_concurrent_subagents` counts active descendant turns across the whole tree and excludes `/root`; the default and recommendation are `3`, with no fixed API upper bound, total-created-subagent limit, or tree-depth limit. Current limitations also exclude `/responses/compact`, `reasoning.summary`, and `max_tool_calls`, while enabling separate automatic compaction for root and subagents.",
            "Codex is a different surface: `agents.max_concurrent_threads_per_session` caps concurrently open spawned-agent threads and excludes the primary. If it is unset, Codex chooses the default but the cited page gives no numeric promise; `agents.max_threads` remains a legacy alias. Codex documentation does not state Responses' no-fixed-depth rule. Codex subagents inherit current sandbox and permission policy/live overrides, while an individual custom agent may be narrowed, so capacity and authority remain separate controls.",
            "Record the runtime, documentation access date, field, counting object, excluded root/primary, default source, queue semantics, inheritance, and observed limit. Test reduced capacity and preserve application-owned breadth, depth, cost, deadline, and stop budgets even where a provider publishes no fixed structural limit.",
          ],
          sourceIds: [
            "openai-responses-multi-agent",
            "openai-codex-subagents",
            "openai-codex-sandbox-security",
            "claude-sdk-agent-loop",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Admission controller and bounded scheduler around parallel workers and sequential control nodes.",
        trigger: "A request receives a budget envelope after tenant, priority, deadline, and risk checks.",
        completion: "The accepted outcome is recorded before deadline, or the system returns budget-exhausted, expired, cancelled, rejected, or escalated.",
        controlOwner: "The application scheduler, not the model, owns admission, queues, concurrency, cancellation, and stop decisions.",
        stateOwner: "A resource ledger records reservation, consumption, release, and terminal reason by run and worker.",
        contextBoundary: "Workers see their remaining local budget and deadline, not unrelated tenant or system capacity data.",
        toolAuthority: "High-cost and state-changing tools require separate quotas and cannot be unlocked by unused token budget.",
        delegationPayload: "Priority, deadline, turn/token/cost/tool limits, breadth/depth allowance, cancellation token, and return destination.",
        concurrencyPolicy: "Semaphores, bounded queues, fair admission, downstream limits, and backpressure govern active work.",
        failurePolicy: "Cancel work that cannot meet its join; do not convert capacity failure into recursive spawning or infinite retry.",
        evidence: "Admission decision, queue time, active counts, per-dimension consumption, cancellations, task outcome, and cost per success.",
        escalation: "Budget conflicts, high-priority starvation, risk-limit breach, or needed work beyond the envelope goes to its accountable owner.",
      },
      practice: {
        title: "Write a scheduler policy that degrades safely",
        brief:
          "Allocate a finite workload across variable capacity without hiding rejection, queueing, or incomplete coverage.",
        steps: [
          "Define per-call, worker, run, tenant, and global budget dimensions.",
          "Set admission, queue, fairness, deadline, cancellation, and load-shed rules.",
          "Connect each join policy to the remaining-work and remaining-budget calculation.",
          "Define business completion, diminishing-return, and human-escalation stopping predicates.",
          "Load-test reduced capacity, rate limiting, a slow tail, retry amplification, and priority contention.",
        ],
        artifact: "A scheduler configuration, load scenarios, and degradation decision table.",
        reviewGate:
          "Under overload, the system bounds work, preserves priority policy, exposes incomplete outcomes, and avoids an uncontrolled spawn or retry storm.",
        template:
          "# Budget and scheduler policy\n\n## Budget vector\n| Scope | Turns | Tokens | Cost | Time | Tool calls | Breadth/depth |\n|---|---|---|---|---|---|---|\n| Worker | | | | | | |\n| Run | | | | | | |\n| Tenant | | | | | | |\n\n## Admission and backpressure\n- Active / queue limits:\n- Priority and fairness:\n- Load-shed rule:\n- Cancellation propagation:\n\n## Stop predicates and degraded modes\n",
      },
      checkpoint: {
        question: "A runtime exposes eight open slots. What does that establish?",
        options: [
          "The optimal team has eight agents",
          "The Host is composed of eight agents",
          "One runtime currently exposes an active-work capacity; policy, budget, independence, and evaluation still determine useful concurrency",
          "Every task should immediately spawn eight descendants",
        ],
        correctIndex: 2,
        explanation:
          "Capacity is a runtime constraint, not an architecture requirement or a team-policy decision.",
      },
      lab: {
        title: "Context and recovery: budget controller",
        instruction:
        "Test normal, reduced, and slow-tail capacity with explicit admission, bounded queue, queue-full, budget-vector, deadline/cancellation, and stop-rule controls.",
        evidencePrompt:
          "Which request was queued, degraded, or rejected, and what declared policy—not model preference—made that decision?",
      },
      takeaway:
        "A bounded orchestrator knows not only how to start work, but when capacity, evidence, and value no longer justify continuing it.",
    },
    "reliability-recovery": {
      kicker: "11 · Recovery begins with outcome classification",
      title: "Timeouts, Retries, Idempotency, and Compensation",
      summary:
        "Recover from partial failure and ambiguous execution without repeating external effects or pretending a checkpoint is a transaction.",
      objective:
        "Design a replay-safety matrix, deduplication scheme, reconciliation path, checkpoint boundary, and compensating workflow.",
      artifact: "Reliability and recovery runbook",
      concepts: [
        "ambiguous outcome",
        "idempotency key",
        "deduplication",
        "backoff and jitter",
        "Retry-After",
        "circuit breaker",
        "partial failure",
        "fail-open vs fail-closed",
        "checkpoint",
        "compensation",
        "reconciliation",
      ],
      sections: [
        {
          heading: "Classify the outcome before deciding to retry",
          paragraphs: [
            "OpenAI's SDK guidance makes model retries opt-in and sensitive to timeouts, streaming, and stateful execution. A timeout proves that the caller lacks a timely response; it does not prove that a remote mutation failed. AWS's idempotent-API guidance describes the critical ambiguous case: the effect may commit and its response may be lost. Repeating it with a new semantic operation can duplicate a charge, message, booking, or deletion.",
            "Use a caller-generated operation identifier whose semantic meaning remains stable across attempts, and require the receiving service to deduplicate it. Scope each dedupe record to the authenticated caller or tenant, operation type, and operation ID; bind it to a canonical request fingerprint, and reject reuse with a different fingerprint as a conflict. Retain the record for at least the maximum retry, reconciliation, and documented late-delivery horizon. After that identity can no longer be proved, fail closed or query and reconcile before any new effect—never treat an expired record as proof that a late request is new. Retry only failures classified as transient and replay-safe. Honor a dependency's `Retry-After` response when supplied, apply finite exponential backoff with randomized jitter, and open a circuit breaker when failures persist so retry layers do not amplify an outage. None of these timing controls makes an unsafe mutation idempotent.",
          ],
          bullets: [
            "Definite pre-execution failure: retry may be safe within budget.",
            "Definite committed success: return or reconcile; do not repeat.",
            "Ambiguous outcome: query by operation ID or reconcile before any new effect.",
            "Permanent or policy failure: fail closed or escalate, not retry.",
          ],
          sourceIds: [
            "openai-model-retries",
            "aws-idempotent-apis",
            "aws-backoff-jitter",
            "azure-retry-storm",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Build durability at the application boundary",
          paragraphs: [
            "OpenAI webhooks can be delivered more than once, so verify signatures, acknowledge quickly, and deduplicate by webhook ID while keeping business-operation idempotency separate. Background mode manages one long response; it is not a workflow engine, transaction log, or compensation system. Running-agent continuation can resume model work, but durable business state must still be application-owned.",
            "Partial failure is a first-class state: some branches or effects can commit while siblings time out, fail validation, or remain unknown. Define whether each dependency failure is fail-closed or fail-open before the incident. Fail closed for authorization, uncertain mutation, required evidence, or regulated audit; fail open only for an explicitly optional, non-safety-critical enrichment or telemetry path, and mark the output degraded rather than silently complete.",
            "Claude file checkpointing covers documented editing operations, not every shell, subagent, network, or external side effect. Anthropic's Managed Agents architecture shows a durable event-log session separated from harness and sandbox, but that vendor runtime does not eliminate the need for an application-owned effect ledger recording attempted and committed mutations, business invariants, external operation IDs, partial failures, degradation decisions, and recovery actions. Microsoft's Cosmos DB lock sample supplies a bounded reference for atomic acquisition, ETag renewal, TTL recovery, and fencing-token rejection of stale writers; another store inherits none of those guarantees without equivalent authoritative enforcement and tests.",
          ],
          sourceIds: [
            "openai-webhooks",
            "openai-background",
            "openai-running-agents",
            "claude-sdk-checkpointing",
            "anthropic-managed-agents",
            "azure-cosmos-distributed-lock",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Compensate when rollback is impossible—and keep a manual path",
          paragraphs: [
            "The Azure compensating-transaction pattern addresses eventually consistent workflows whose earlier actions cannot be rolled back atomically. Compensation is a new forward operation, can require domain-specific ordering, may itself fail, and may not restore the exact prior state. Make compensators idempotent where possible and preserve a manual reconciliation queue for irreversible effects.",
            "A public AWS Labs issue provides a bounded historical example of work returning to the wrong place when caller identity and return paths are inferred. It does not prove a current product defect, but it motivates typed task IDs, caller IDs, and return destinations. Pin and test SDK retry, checkpoint, and resume semantics; never generalize one runtime's recovery guarantees to another.",
          ],
          sourceIds: [
            "azure-compensating-transactions",
            "github-aws-return-path-issue",
            "openai-model-retries",
            "claude-sdk-checkpointing",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Durable step runner with operation IDs, checkpoints, reconciliation, and compensating nodes.",
        trigger: "A new operation is admitted only after scoped dedupe lookup, request-fingerprint comparison, precondition checks, and recovery-state classification.",
        completion: "The business outcome is confirmed, compensated, cancelled before effect, or placed in explicit manual reconciliation.",
        controlOwner: "The application recovery controller chooses retry, reconcile, compensate, fail, or escalate.",
        stateOwner: "An append-only operation and attempt ledger plus versioned workflow snapshot.",
        contextBoundary: "Agents receive current logical state and evidence references, never permission to infer committed effects from missing responses.",
        toolAuthority: "Mutation tools require stable operation IDs; compensation uses separately scoped authority and approval when consequential.",
        delegationPayload: "Workflow, step, caller, return destination, operation ID, attempt, preconditions, replay class, deadline, and expected evidence.",
        concurrencyPolicy: "Only resource-isolated operations, or mutations atomically applied by an authoritative store under a proven commutative or merge contract, run concurrently; recovery locks logical operations, not merely HTTP requests. Lease-based ownership carries a monotonically increasing fencing or version token, and downstream writes reject stale tokens after failover.",
        failurePolicy: "Classify definite, transient, permanent, and ambiguous outcomes; use bounded jittered retry only for safe classes.",
        evidence: "Request hash, operation and attempt IDs, external receipt/query, webhook IDs, checkpoint, compensation, and reconciliation decision.",
        escalation: "Irreversible ambiguous effect, failed compensation, corrupted checkpoint, or ownerless return enters a human reconciliation queue.",
      },
      practice: {
        title: "Run the lost-response incident",
        brief:
          "Design recovery for a multi-step workflow where a state-changing call may succeed just before the connection is lost.",
        steps: [
          "Classify every step as read-only, idempotent by contract, conditionally replayable, compensatable, or irreversible.",
          "Define stable operation IDs, authenticated dedupe scope, request-fingerprint conflict behavior, retention horizon, and query-by-operation reconciliation.",
          "Set finite retry budgets with timeout, exponential backoff, jitter, and cancellation propagation.",
          "Place checkpoints around verified business state rather than around model turns alone.",
          "Write compensation and manual reconciliation for a committed effect whose next step fails.",
          "Inject duplicate webhooks, a lost response, a corrupt checkpoint, a wrong return path, and a failed compensator.",
        ],
        artifact: "A replay matrix, recovery state machine, and incident evidence packet.",
        reviewGate:
          "No timeout or duplicate delivery can silently repeat a business effect, and every ambiguous or irreversible outcome has a named reconciliation owner.",
        template:
          "# Reliability and recovery runbook\n\n## Replay-safety matrix\n| Operation | Effect | Stable operation ID | Dedupe owner | Retry class | Reconcile | Compensate |\n|---|---|---|---|---|---|---|\n| | | | | | | |\n\n## Dedupe identity and lifetime\n- Scope: authenticated caller or tenant + operation type + operation ID\n- Canonical request fingerprint:\n- Fingerprint mismatch: conflict / no effect\n- Retention: >= maximum retry + reconciliation + late-delivery horizon\n- After expiry: fail closed or query/reconcile\n\n## Outcome state machine\n- Definite failure:\n- Definite success:\n- Ambiguous:\n- Permanent / policy failure:\n\n## Retry envelope\n- Attempts / timeout / backoff / jitter:\n\n## Manual reconciliation and compensation\n",
      },
      checkpoint: {
        question:
          "A payment call times out after the server may have committed it. What is the safest next action?",
        options: [
          "Repeat the payment with a new operation ID immediately",
          "Assume failure because no response arrived",
          "Query or reconcile using the original stable operation ID before attempting any new effect",
          "Ask the model whether the payment probably succeeded",
        ],
        correctIndex: 2,
        explanation:
          "The outcome is ambiguous. Reconciliation with the original semantic operation prevents a lost response from becoming a duplicate effect.",
      },
      lab: {
        title: "Context and recovery: ambiguous side effect",
        instruction:
        "Inject pre-send, ambiguous-commit, and duplicate-delivery failures; require the same business operation key and effect ledger before replaying uncertain work.",
        evidencePrompt:
          "Which record distinguishes another delivery attempt from a new business operation, and who owns the unresolved outcome?",
      },
      takeaway:
        "A retry is safe only when the application can prove what operation it is repeating and how the receiver treats repetition.",
    },
    "security-authority-human-control": {
      kicker: "12 · Capability is not permission",
      title: "Security, Authority, Guardrails, and Human Control",
      summary:
        "Build least privilege, isolation, approval, guardrails, recourse, and incident controls around every consequential action.",
      objective:
        "Create an authority matrix and human-control flow that separates capability, policy permission, execution isolation, quality evidence, and release sign-off.",
      artifact: "Authority and human-control assurance case",
      concepts: [
        "least privilege",
        "permission",
        "sandbox",
        "approval",
        "guardrail",
        "prompt injection",
        "human sign-off",
      ],
      sections: [
        {
          heading: "Place controls before and around the side effect",
          paragraphs: [
            "OpenAI documents input, output, and tool guardrails plus interruptible human approval. Their scope matters: a guardrail on one agent or turn may not automatically cover every handoff or hosted tool, and an output check that runs after an external mutation cannot undo that mutation. Validate and authorize the operation at the execution boundary before committing the effect.",
            "Human-in-the-loop state can pause and resume a run, but approval means an authorized person permits an action—not that the proposal is correct. Give the reviewer evidence, alternatives, consequence, reversibility, and time to decide. General safety guidance still requires a system-specific threat model and qualified domain review.",
          ],
          sourceIds: [
            "openai-guardrails-approvals",
            "openai-sdk-hitl",
            "openai-safety",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Separate policy permission from execution isolation",
          paragraphs: [
            "Claude Agent SDK currently evaluates tool permissions in this order: hooks, deny rules, ask rules, permission mode, allow rules, then the canUseTool callback. A call approved earlier may never reach canUseTool, so a check that must cover every call belongs in PreToolUse. Its `allowed_tools` / `allowedTools` setting pre-approves matching tools; it does not hide or deny every unlisted tool. A fixed headless surface requires an appropriate combination such as explicit allowed tools with `dontAsk`, deny or tool-removal rules, hooks, and sandboxing. Child agents can inherit permission context. Permission is policy; it does not create operating-system isolation. Anthropic's secure-deployment guidance pairs least privilege with sandboxing, network and filesystem control, credential proxies, audit trails, and defenses for prompt injection and model error.",
            "Design authority as an intersection: authenticated user rights, agent-role policy, task purpose, resource scope, environment containment, and any required approval must all permit the action. A powerful tool in a sandbox may still be unauthorized; an approved request outside a sandbox may still expose an unacceptable blast radius.",
          ],
          sourceIds: [
            "claude-sdk-permissions",
            "claude-secure-deployment",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Treat connected systems and runtime inheritance as live risk",
          paragraphs: [
            "OpenAI warns that remote MCP servers are third parties with prompt-injection, data-sharing, retention, and behavior risks. Use explicit allowed tools and approval policies, minimize data sent, and do not inherit remote content into privileged instructions. Recheck connector, permission, handoff, and guardrail behavior at the deployed SDK and server versions.",
            "The governance contract treats runtime permission approval, quality PASS evidence, and accountable human sign-off as three separate gates. Passing one must not automatically set the others. Record each decision, its owner, evidence, scope, expiry, and revocation path.",
          ],
          sourceIds: [
            "openai-mcp-connectors",
            "claude-sdk-permissions",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Policy gateway, sandboxed execution, approval interrupts, and human escalation around bounded agents and tools.",
        trigger: "An authenticated task requests a capability under a declared purpose, role, resource, and consequence tier.",
        completion: "The action is denied, safely completed and verified, or held for an authorized decision with recourse.",
        controlOwner: "Application policy controls execution; authorized humans own consequential approval and release decisions.",
        stateOwner: "A tamper-evident decision and action ledger linked to workflow, user, role, resource, and policy versions.",
        contextBoundary: "Untrusted content remains data, secrets remain behind brokers, and only review-relevant evidence enters approval context.",
        toolAuthority: "Least privilege by role, purpose, resource, action, time, and environment; deny by default.",
        delegationPayload: "Authenticated principal, role, purpose, data classification, requested action, evidence, consequence, and approval requirement.",
        concurrencyPolicy: "Consequential mutations and approvals are serialized per resource; read work remains bounded and isolated.",
        failurePolicy: "Fail closed on policy uncertainty, prompt injection, unavailable isolation, stale approval, or incomplete audit capture.",
        evidence: "Policy evaluation, guardrail result, approval decision, sandbox and credential scope, tool effect, quality result, and sign-off.",
        escalation: "High-impact, disputed, out-of-policy, or incident-associated actions route to a named qualified owner with user recourse.",
      },
      practice: {
        title: "Build an authority matrix and approval experience",
        brief:
          "Map each action from callable capability through policy, isolation, approval, execution, quality review, and release sign-off.",
        steps: [
          "Inventory tools, resources, data classes, external effects, consequence, and reversibility.",
          "Define user, agent-role, task-purpose, resource, time, and environment constraints for each action.",
          "Separate allow/ask/deny policy from sandbox, network, filesystem, and credential containment.",
          "Design an approval view with evidence, alternatives, expiry, rejection, and recourse.",
          "Test prompt injection, confused deputy, child inheritance, stale approval, data exfiltration, and post-effect guardrail timing.",
          "Prove that permission, quality PASS, and human release sign-off remain distinct records.",
        ],
        artifact: "An authority matrix, approval flow, threat cases, and release-decision ledger.",
        reviewGate:
          "A security reviewer can trace each consequential effect to authenticated authority, containment, meaningful approval, execution evidence, and an accountable release decision.",
        template:
          "# Authority and human-control case\n\n| Action | User right | Agent role | Purpose/resource | Sandbox | Approval | Quality gate | Sign-off | Revoke/rollback |\n|---|---|---|---|---|---|---|---|---|\n| | | | | | | | | |\n\n## Threat and control\n| Threat | Prevent | Detect | Contain / recover | Owner |\n|---|---|---|---|---|\n| Prompt injection | | | | |\n| Confused deputy | | | | |\n| Data exfiltration | | | | |\n\n## User recourse and incident path\n",
      },
      checkpoint: {
        question:
          "A human approves a state-changing tool call. What does that approval establish?",
        options: [
          "The action is correct and the output passed quality review",
          "The approved action may proceed within its recorded scope; correctness, containment, execution evidence, and sign-off remain separate",
          "Every descendant agent inherits permission forever",
          "An output guardrail can undo any side effect",
        ],
        correctIndex: 1,
        explanation:
          "Approval is one authority gate. It neither proves quality nor replaces isolation, verification, expiry, or accountable release acceptance.",
      },
      lab: {
        title: "Governance and trace: authority gates",
        instruction:
        "Inject a poisoned connected result, then test allowlisting, default-deny egress, and execution-time approval as distinct pre-effect gates.",
        evidencePrompt:
          "Which gate stopped the action, and what evidence would be required before a different gate could legitimately pass?",
      },
      takeaway:
        "Safe agency comes from constrained authority and recoverable execution—not from a powerful model being politely asked to behave.",
    },
    "tracing-observability-economics": {
      kicker: "13 · Instrument without confusing the instruments",
      title: "Tracing, Monitoring, Audit, Evaluation, and Economics",
      summary:
        "Link execution evidence to service health, accountable decisions, user outcomes, latency, and cost while minimizing sensitive telemetry.",
      objective:
        "Design a telemetry model that keeps traces, monitors, audit records, and evaluations distinct and calculates cost per successful outcome.",
      artifact: "Observability and economics specification",
      concepts: [
        "trace and span",
        "monitor and alert",
        "audit event",
        "evaluation verdict",
        "tail latency",
        "cost per successful task",
        "SLO and error budget",
        "telemetry privacy",
      ],
      sections: [
        {
          heading: "Give four evidence systems four jobs",
          paragraphs: [
            "OpenAI's observability and tracing material supports workflow, model, tool, handoff, guardrail, and custom spans. Claude Agent SDK exposes OpenTelemetry traces, metrics, events, tokens, cost, latency, tool calls, and failures. A trace reconstructs only the recorded, instrumented path and remains subject to propagation, sampling, export, and retention gaps. Monitoring aggregates live conditions and triggers operational response. An audit record or audit log preserves accountable decisions and effects. An evaluation compares behavior or outcome with a declared criterion.",
            "One record may link to another, but they are not substitutes. At fan-in, a span has at most one parent, so use span links plus task and operation IDs to associate every contributing branch; do not invent a multi-parent tree or drop all but one initiator. A complete trace is not a passing eval; a green availability monitor says nothing about task correctness; an eval dataset is not an immutable audit trail; an audit event does not provide service-level alerting.",
          ],
          sourceIds: [
            "openai-observability",
            "openai-tracing",
            "claude-sdk-observability",
            "otel-overview",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Measure the whole successful task",
          paragraphs: [
            "Instrument model and tool latency, queue time, fan-out width, retries, cancellations, handoffs, approvals, branch failures, join result, token input and output, provider and infrastructure cost, and user or business outcome. Optimize cost per accepted task and report p50, p95, and p99 tail latency where the workload warrants them—not only the price or median speed of one model call.",
            "Define a user-centered SLI and SLO, then derive its error budget as the permitted unreliability over the measurement window. An error-budget policy names owners and precommits what happens as budget burns or is exhausted—for example slowing rollout or prioritizing reliability work. It is not permission to hide partial failures, and a vendor example's thresholds are not portable defaults.",
            "OpenAI latency guidance recommends reducing unnecessary tokens and requests and parallelizing appropriate independent work. Cost guidance recommends the smallest model that meets an evaluated threshold. Anthropic's research-system report illustrates how multi-agent quality can require materially more tokens in one system. Treat every optimization as a quality, safety, latency, reliability-budget, and cost trade-off.",
          ],
          sourceIds: [
            "openai-latency",
            "openai-cost",
            "anthropic-research-system",
            "google-sre-error-budget",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Telemetry is another sensitive data product",
          paragraphs: [
            "OpenAI tracing can capture prompts, tool arguments, results, and custom metadata; Claude telemetry has its own current feature and Beta boundaries. OpenTelemetry warns that sensitive Baggage can travel in HTTP headers to unintended resources and has no built-in integrity check: never put secrets or unminimized personal data in Baggage, and never use it as trusted authorization input. Define field-level minimization, redaction, sampling, residency, retention, access, deletion, and incident policy before enabling rich capture. Zero-data-retention or vendor settings may also constrain available tracing features.",
            "Version trace schemas and business outcome joins. Recheck default capture and export behavior on every SDK update, and test that disabling sensitive fields actually removes them from processors, exporters, logs, and support tooling.",
          ],
          sourceIds: [
            "openai-tracing",
            "claude-sdk-observability",
            "openai-observability",
            "otel-baggage-security",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Instrumented orchestration graph with linked trace, metric, audit, outcome, and cost records.",
        trigger: "Every admitted run creates correlation IDs and a telemetry policy before model or tool execution.",
        completion: "Terminal task outcome, resource totals, evidence links, and any incident or eval references are recorded.",
        controlOwner: "The application defines semantic spans, service signals, audit events, and outcome joins; exporters transport them.",
        stateOwner: "Separate stores own traces, operational metrics, audit events, eval results, and business outcomes under linked IDs.",
        contextBoundary: "Telemetry processors redact or hash sensitive content; model context never receives observability secrets or unrelated traces.",
        toolAuthority: "Telemetry exporters have append-only, destination-scoped credentials and cannot invoke business tools.",
        delegationPayload: "Correlation IDs, parent span reference, fan-in span links, task and role labels, privacy class, and measurement version.",
        concurrencyPolicy: "Branch spans preserve their single-parent lineage; fan-in uses links for all contributing branches, and asynchronous export is bounded so it cannot block critical recovery paths.",
        failurePolicy: "Buffer or degrade telemetry safely, alert on blind spots, and never claim an unobserved action did not happen.",
        evidence: "Trace graph, service metrics, audit decisions, accepted outcome, cost allocation, redaction test, and schema version.",
        escalation: "Security-sensitive trace leakage, observability blackout, unexplained cost spike, or outcome deterioration triggers the named runbook.",
      },
      practice: {
        title: "Instrument one run four ways",
        brief:
          "Design a trace, monitor, audit record, and evaluation link for the same orchestration without collapsing their meanings.",
        steps: [
          "Draw spans for model, tool, handoff, guardrail, approval, worker, and join events.",
          "Define service metrics, SLOs, alerts, and runbook owners for availability, latency, queueing, error, and cost.",
          "Define append-only audit events for authority decisions and external effects.",
          "Link terminal task and user outcomes to cost, tokens, latency percentiles, and evaluation results.",
          "Create field-level telemetry minimization, redaction, retention, access, and deletion tests.",
          "Simulate a green monitor with a failed task eval and a complete trace with a missing audit event.",
        ],
        artifact: "A telemetry schema, dashboard specification, audit map, and privacy test.",
        reviewGate:
          "An operator can detect incidents, an auditor can reconstruct authority and effects, and an evaluator can judge outcomes without any one evidence system pretending to be all three.",
        template:
          "# Observability and economics specification\n\n| Evidence system | Question answered | Core fields | Retention/access | Owner |\n|---|---|---|---|---|\n| Trace | What executed? | | | |\n| Monitor | Is the service healthy now? | | | |\n| Audit | Who authorized and what changed? | | | |\n| Eval | Did behavior meet the criterion? | | | |\n\n## Economics\n- Cost per accepted task:\n- Tail-latency target:\n- Retry / fan-out allocation:\n\n## Redaction and deletion tests\n",
      },
      checkpoint: {
        question:
          "A run has a complete trace with no errors. What can the team conclude?",
        options: [
          "The answer was correct and the user outcome succeeded",
          "The recorded execution path completed without a traced error; quality and outcome still need evaluation evidence",
          "No audit record is required",
          "The run was cost-effective",
        ],
        correctIndex: 1,
        explanation:
          "Tracing explains execution. It does not by itself judge correctness, business outcome, authority, or economic value.",
      },
      lab: {
        title: "Governance and trace: four evidence systems",
        instruction:
        "Match an execution-path, service-health, accountability, or outcome-quality question to trace, monitor, audit, or evaluation; then enforce telemetry redaction and outcome-cost linkage.",
        evidencePrompt:
          "Which evidence system answered the incident question, and which conclusion remained unsupported by it?",
      },
      takeaway:
        "Observe execution richly, but ask each instrument only the question it was designed to answer.",
    },
    "evaluation-regression-evolution": {
      kicker: "14 · Regressions happen at several levels",
      title: "Evaluation, Regression Gates, and Framework Evolution",
      summary:
        "Evaluate nodes, trajectories, and outcomes across repeated trials, then govern models, prompts, tools, policies, data, and frameworks as one release unit.",
      objective:
        "Create a multi-level evaluation suite and a version-governance matrix that can block an orchestration regression.",
      artifact: "Evaluation and release-governance pack",
      concepts: [
        "task and trial",
        "node eval",
        "trajectory eval",
        "outcome eval",
        "grader calibration",
        "regression gate",
        "version pin",
      ],
      sections: [
        {
          heading: "Evaluate local choices, trajectories, and terminal outcomes",
          paragraphs: [
            "OpenAI agent evals support datasets, trace grading, tool and handoff checks, and repeatable workflow evaluation. Anthropic distinguishes tasks, trials, graders, trajectories, outcomes, harnesses, and suites and emphasizes repeated trials and calibrated graders. Build a layered suite: validate node contracts, inspect route/tool/handoff trajectories, and independently score the terminal task and safety outcome.",
            "A worker can pass its local schema while the graph duplicates work, exceeds budget, or produces the wrong business state. Conversely, a successful final result can hide an unsafe or needlessly expensive trajectory. Report both and run enough trials to characterize nondeterministic variance. Use `pass@k` only for an exploration question such as whether at least one of k trials succeeds; use per-trial success and, when every repeated attempt must succeed, `pass^k` for consistency. Never present a higher at-least-one success rate across retries as single-run reliability.",
          ],
          sourceIds: ["openai-agent-evals", "anthropic-agent-evals"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Pin the reproducible implementation surface",
          paragraphs: [
            "The pinned OpenAI Agents Python and Claude Agent SDK releases provide reproducible anchors for tests, while LangGraph provides an explicit-state and durable-execution comparison. Record model snapshot, SDK and package versions, prompts and schemas, graph, tools and MCP servers, policies, data or retrieval index, grader, and infrastructure configuration as one release manifest.",
            "Do not infer hosted-service terms from an SDK's open-source license, and do not assume a rolling main branch matches the pinned release. Run contract, serialization, resume, guardrail, trace, and outcome suites against the actual dependency lock before accepting an upgrade.",
          ],
          sourceIds: [
            "openai-agents-python-v022",
            "anthropic-agent-sdk-v02143",
            "langgraph-v1211",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Treat framework lifecycle as evidence, not fashion",
          paragraphs: [
            "OpenAI's official Swarm README labels Swarm experimental and educational, states that it has been replaced by the production-ready Agents SDK, and recommends migrating production use cases to Agents SDK. This is a product lifecycle transition, not proof that a migration is risk-free: preserve a baseline, map Swarm agent/handoff/state behavior to the target SDK, and run contract, trajectory, recovery, security, and outcome regressions before cutover.",
            "Microsoft Agent Framework is the current Microsoft line represented here for graph, handoff, group, checkpoint, human-review, telemetry, MCP, and related patterns. AutoGen's pinned README places it in maintenance mode and points new work toward Agent Framework. Both lifecycle notices are useful evidence for new-project selection, not automatic rewrite orders for every maintained deployment.",
            "Framework component versions, language implementations, hosted services, and repositories can evolve independently. Recheck the exact release stream and migrate only after capability, state, security, performance, and operational regressions are tested against your application contract.",
          ],
          sourceIds: [
            "microsoft-agent-framework",
            "autogen-maintenance",
            "openai-swarm-lifecycle",
            "langgraph-v1211",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Versioned orchestration candidate executed repeatedly through node, trajectory, outcome, safety, and operating suites.",
        trigger: "Any change to model, SDK, prompt, graph, tool, policy, data, grader, or infrastructure creates a candidate release.",
        completion: "The candidate passes declared thresholds and human review, or is rejected, narrowed, or held with explicit evidence gaps.",
        controlOwner: "The evaluation harness controls fixtures and trials; a release owner accepts the evidence and residual risk.",
        stateOwner: "A versioned, append-only or tamper-evident release manifest links datasets, trial outputs, grader versions, traces, outcomes, and decisions within its declared retention window.",
        contextBoundary: "Evaluation fixtures are isolated from training and development prompts where possible; graders receive only required evidence.",
        toolAuthority: "Offline suites use mocks or sandboxes; any live side effect requires separate authorization and cleanup.",
        delegationPayload: "Candidate manifest, task fixture, seed or trial ID, rubric, outcome oracle, budget, and artifact destination.",
        concurrencyPolicy: "Trials may parallelize under fixed capacity while preserving independent IDs and representative production limits.",
        failurePolicy: "Treat grader errors, flaky infrastructure, and product failures separately; never drop failed trials from the denominator silently.",
        evidence: "Per-trial node, trajectory, outcome, safety, latency, cost, variance, grader-calibration, and regression results.",
        escalation: "Threshold failure, disputed grader, new high-severity behavior, or incompatible state migration blocks release for review.",
      },
      practice: {
        title: "Build a regression gate for one topology change",
        brief:
          "Compare a baseline and candidate across deterministic contracts and repeated end-to-end trials.",
        steps: [
          "Create representative success, ambiguity, adversarial, interruption, recovery, and high-cost fixtures.",
          "Define node schema, route/tool/handoff trajectory, terminal outcome, safety, latency, and cost criteria.",
          "Calibrate automated graders against qualified human judgments and allow unknown or abstain.",
          "Run repeated baseline and candidate trials and report variance, not only averages.",
          "Pin the entire release manifest and test serialized-state migration and rollback.",
          "Write pass, narrow, investigate, and reject decision rules before inspecting the candidate result.",
        ],
        artifact: "An evaluation suite, comparison report, release manifest, and signed decision.",
        reviewGate:
          "A reviewer can reconstruct the candidate manifest, rerun comparable trials without expecting identical stochastic outputs, see every failed trial, distinguish local from end-state quality, and explain why the release gate passed or failed.",
        template:
          "# Evaluation and regression pack\n\n## Release manifest\n- Model / SDK / packages:\n- Prompt / schema / graph:\n- Tools / MCP / policies:\n- Data / retrieval / grader:\n\n## Evaluation matrix\n| Fixture | Node contract | Trajectory | Outcome | Safety | Latency / cost | Trials | Threshold |\n|---|---|---|---|---|---|---|---|\n| | | | | | | | |\n\n## Grader calibration and variance\n\n## Decision: pass | narrow | investigate | reject\n",
      },
      checkpoint: {
        question:
          "A candidate gets the right final answer but calls an unauthorized tool during the trajectory. How should the release gate treat it?",
        options: [
          "Pass because only the final answer matters",
          "Fail or block according to the trajectory and safety criteria, even though the terminal answer is correct",
          "Delete the trace and rerun once",
          "Count it as a cost-only issue",
        ],
        correctIndex: 1,
        explanation:
          "End-state correctness cannot excuse an unsafe trajectory. Orchestration evaluation must inspect both local behavior and final outcome.",
      },
      lab: {
        title: "Governance and trace: regression gate",
        instruction:
        "Build a version-locked candidate gate from isolated repeated trials, deterministic code-based checks where applicable, repeated and human-calibrated model graders where necessary, qualified human review, and a declared regression threshold; then toggle an actual regression.",
        evidencePrompt:
          "Which declared threshold blocked the candidate, and how was grader uncertainty kept from becoming a false verdict?",
      },
      takeaway:
        "An orchestrator is a versioned system; release evidence must cover how it acted, what happened, and how reliably that result repeats.",
    },
    "production-orchestration-capstone": {
      kicker: "15 · Earn the right to widen autonomy",
      title: "Production Orchestration and Progressive Release",
      summary:
        "Assemble contracts, durability, authority, observability, evaluations, and runbooks into a staged production system with an evidence-based autonomy ladder.",
      objective:
        "Produce and defend a complete orchestration dossier for a low-risk pilot, including failure injection, rollback, and a decision to release, narrow, or stop.",
      artifact: "Production orchestration dossier",
      concepts: [
        "durable execution",
        "progressive autonomy",
        "shadow mode",
        "canary",
        "SLO",
        "incident runbook",
        "rollback",
        "framework portability",
      ],
      sections: [
        {
          heading: "Separate long model work from durable business execution",
          paragraphs: [
            "OpenAI background mode can run a long response asynchronously, webhooks can notify an application with duplicate-delivery handling, and running-agent APIs can continue agent state. None alone supplies a complete durable business workflow. Anthropic's Managed Agents architecture demonstrates another separation among durable Session events, the model-loop Harness, and the execution Sandbox.",
            "Build the production control plane around application-owned task state, operation IDs, policy, deadlines, reconciliation, and terminal outcomes. The model or hosted response is one worker in that system. A process restart, lost webhook, compacted context, or changed active agent must not erase the business record.",
          ],
          sourceIds: [
            "openai-background",
            "openai-webhooks",
            "openai-running-agents",
            "anthropic-managed-agents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "Release autonomy progressively with reversible evidence",
          paragraphs: [
            "Use one canonical six-stage ladder: fixture-controlled offline eval/replay; sandbox or synthetic integration; no-business-write shadow on the production distribution; recommendation-only with human execution; an approval-gated bounded canary; and finally limited autonomy. Pin inputs and versions and record or simulate external dependencies when reproducibility matters. Shadow still requires budgets and audit for reads, external calls, privacy exposure, telemetry, rate limits, queues, and cost. Traffic and authority widen independently: a stage may see representative traffic without gaining write authority. Every stage has eligibility, stage-specific evaluation, guardrail and operational gates, stop conditions, rollback, and an accountable owner. Only traffic-bearing service stages apply an SLI, SLO, and error budget over a declared measurement window.",
            "Microsoft Agent Framework's pinned README and Python 1.15.0 release evidence provide a version-bounded comparison for named graph, workflow, handoff, review, and related patterns. Google ADK's broader workflow, collaboration, and session-state capabilities instead come from current rolling official documentation; v2.7.1 is a separate package version anchor whose release page supports only its listed fixes. Use both surfaces for bounded comparison, not to outsource architecture judgment, and preserve a framework-neutral contract so the pilot can be tested against a replacement runtime.",
          ],
          sourceIds: [
            "microsoft-agent-framework",
            "google-adk-v271",
            "openai-running-agents",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Make the release dossier auditable and product-specific",
          paragraphs: [
            "Course-original diagrams separate Session, root or lead agent, Host, task tree, capacity, team policy, permission, quality evidence, and human sign-off. They are portable teaching models rather than vendor specifications. The final dossier maps those control questions to the exact runtime and versions selected for the pilot.",
            "Recheck hosted storage, webhook, resume, sandbox, framework, and capacity behavior immediately before release. A successful build or demo is not a production PASS. The release decision requires source and version provenance, evaluated outcomes, authority review, operational readiness, failure-injection evidence, rollback, and human acceptance of residual risk.",
          ],
          sourceIds: [
            "openai-background",
            "openai-webhooks",
            "anthropic-managed-agents",
            "microsoft-agent-framework",
            "google-adk-v271",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "Application-owned durable graph using deterministic nodes, one-agent loops, bounded workers, human gates, and staged external effects.",
        trigger: "An eligible pilot request passes identity, policy, schema, duplicate, capacity, and release-stage checks.",
        completion: "A verified business outcome is recorded, or the run ends as denied, cancelled, expired, partial, compensated, reconciled, or escalated.",
        controlOwner: "The production control service; accountable humans own release stage, consequential approval, and incident command.",
        stateOwner: "Versioned application events and snapshots linked to external operation records and release manifests that are append-only or tamper-evident within their declared retention window.",
        contextBoundary: "A tested assembler projects minimum task evidence to each model or worker; secrets and unrelated tenant data stay outside.",
        toolAuthority: "Stage- and role-specific least privilege with approval, sandbox, credential broker, rate, and resource boundaries.",
        delegationPayload: "Authenticated workflow/task/caller IDs, objective, state version, evidence, authority, budget, deadline, schema, return path, and escalation.",
        concurrencyPolicy: "Admission, bounded queues, isolated workers, resource locks, join deadlines, and load shedding protect downstream systems.",
        failurePolicy: "Classify and persist every outcome; retry only replay-safe work, reconcile ambiguity, compensate where possible, and retain manual recovery.",
        evidence: "Release manifest, graph events, task artifacts, approvals, traces, audit records, evals, outcomes, costs, incidents, and rollback results.",
        escalation: "Policy conflict, ambiguous consequential effect, failed SLO, safety event, evidence regression, or unavailable recovery pauses the release stage.",
      },
      practice: {
        title: "Defend a production-ready pilot",
        brief:
          "Assemble the course artifacts into one low-risk pilot and run the failure and governance review before any real effect.",
        steps: [
          "Select a bounded, reversible scenario and justify the minimum topology against a single-agent baseline.",
          "Version the graph, twelve-field contract, roles, state model, tools, policies, budgets, and dependencies.",
          "Create deterministic fixtures and repeated node, trajectory, outcome, safety, latency, and cost evaluations.",
          "Run offline, sandbox/synthetic, no-business-write shadow, recommendation-only, approval-gated bounded-canary, limited-autonomy, rollback, and manual-reconciliation exercises.",
          "Review telemetry privacy, incident ownership, SLOs, alerts, user communication, and recourse.",
          "Record a release, narrow, hold, or stop decision with residual risk and evidence that would change it.",
        ],
        artifact: "A 15-artifact dossier, tabletop incident record, and signed pilot decision.",
        reviewGate:
          "Engineering, security, operations, product, domain, and human-oversight reviewers can reconstruct the system, challenge its evidence, stop it, and recover it without relying on the demo conversation.",
        template:
          "# Production orchestration dossier\n\n## Pilot boundary and topology decision\n\n## Graph, roles, state, authority, and recovery\n\n## Evaluation and release-stage evidence\n| Stage | Cohort / effects | Required evidence | Stage gate; traffic SLI/SLO window | Exit / rollback | Owner |\n|---|---|---|---|---|---|\n| Offline fixture / replay | 0 / simulated | | | | |\n| Sandbox / synthetic integration | synthetic / isolated | | | | |\n| No-business-write shadow | representative reads / no business writes | | | | |\n| Recommendation-only | human executes | | | | |\n| Approval-gated bounded canary | limited / per-action approval | | | | |\n| Limited autonomy | bounded traffic and authority | | | | |\n\n## Incident tabletop and reconciliation\n\n## Decision and residual risk\n",
      },
      checkpoint: {
        question:
          "A background agent response completes successfully in a staging demo. What has been proven?",
        options: [
          "The complete multi-step business workflow is durable and production-ready",
          "That one staged response completed; production still requires application state, authority, recovery, eval, monitoring, and release evidence",
          "Webhooks will be delivered exactly once",
          "Human approval and rollback are no longer needed",
        ],
        correctIndex: 1,
        explanation:
          "A completed response is one execution result. It does not establish durable workflow semantics or production readiness for external effects.",
      },
      lab: {
        title: "Production readiness: release ladder",
        instruction:
        "Require shadow comparison, a bounded canary, and an exercised kill switch before the pilot can enter the next production release stage.",
        evidencePrompt:
          "Which release gate remains unmet, and what inspectable artifact—not confidence or demo fluency—would be required to pass it?",
      },
      takeaway:
        "Production autonomy is not switched on; it is widened in reversible stages as the system earns evidence across outcomes, safety, and recovery.",
    },
  },
  finalAssessment: {
    title: "Agent orchestration control review",
    summary:
      "Fifteen scenario questions test whether you can distinguish control planes, preserve state and authority, classify ambiguous failures, and demand end-to-end release evidence. A score of 80% is required.",
    passPercent: 80,
  },
  capstone: {
    title: "Capstone: a production-controlled agent workflow",
    summary:
      "Design a bounded pilot whose task graph, authority, durability, evidence, and recovery can survive an adversarial cross-functional review. The goal is an auditable next release decision—not a claim that more agents are inherently better.",
    scenario:
      "Use a real low-risk workflow with authorized reviewers, or the safe fixture: a research-brief service that gathers public sources, separates independent claims, drafts a cited brief, and requires a human to approve publication. Use synthetic identities and sandboxed effects during design and testing.",
    artifacts: [
      "Autonomy boundary brief with ordinary-code, workflow, single-agent, and multi-agent alternatives.",
      "Versioned task graph with typed nodes, edges, joins, completion, and invalid transitions.",
      "Twelve-field orchestration contract naming control, state, authority, evidence, failure, and escalation.",
      "Chain-and-route table with strict schemas, refusal, incomplete, unknown, and fallback paths.",
      "Concurrency-plane specification with budgets, isolation, deadlines, cancellation, and partial-result joins.",
      "Manager and specialist role cards with final-answer, quality, state, and external-action ownership.",
      "Delegation and handoff protocol with caller identity, active-agent continuity, structured return, and obstacle reporting.",
      "Dynamic worker, evaluator, independent-verifier, and durable-progress harness.",
      "Tool and MCP capability contract with protocol version, migration boundary, least privilege, validation, and approval.",
      "Context, conversation, session, run-state, memory, compaction, retention, and recovery architecture.",
      "Budget, admission, queue, backpressure, deadline, cancellation, and stopping policy.",
      "Retry, idempotency, dedupe, checkpoint, ambiguous-outcome reconciliation, and compensation runbook.",
      "Security and human-control assurance case separating permission, sandbox, approval, quality PASS, sign-off, recourse, and incident action.",
      "Trace, monitoring, audit, evaluation, outcome, latency, cost, and telemetry-privacy specification.",
      "Repeated evaluation, regression, version-governance, progressive-release, rollback, and final pilot decision pack.",
    ],
    completionStatement:
      "I can show why this topology is the minimum justified design, reconstruct its state and authority decisions, recover its ambiguous failures, and defend a reversible release decision with versioned outcome evidence. I have not treated a demo, permission approval, trace, quality check, or framework feature as production proof by itself.",
    reviewQuestions: [
      "Which uncertainty requires an agent, and which part of the graph should remain deterministic code?",
      "Who owns control, durable state, final synthesis, external effects, quality acceptance, and human sign-off at every transition?",
      "Can every delegation and return be routed from typed identity and state rather than inferred conversation position?",
      "Where could a timeout hide a committed effect, and how does the original operation ID drive reconciliation?",
      "Which capability is callable but not authorized, and what sandbox or credential boundary limits the blast radius?",
      "What do traces, monitors, audit records, and evaluations each establish—and what do they not establish?",
      "Which repeated outcome, safety, latency, and cost evidence justifies the current release stage over the single-agent baseline?",
      "How can an operator stop, resume, compensate, reconcile, or roll back the system during the worst credible incident?",
    ],
  },
} as const satisfies AgentOrchestrationCourseCopy;
