import type { McpAssessmentQuestion, McpKnowledgeCheck } from "./types";

type McpAnswerIndex = 0 | 1 | 2 | 3;

// These curated answer positions avoid a learnable A/B/C/D rhythm while keeping
// the presentation deterministic for review, screenshots, and regression tests.
export const MCP_FINAL_DISPLAY_CORRECT_INDEXES = [
  2, 0, 1, 3, 1, 0, 3, 2, 0, 1, 2, 3, 1, 0, 2, 3, 0, 1,
] as const satisfies readonly McpAnswerIndex[];

export const MCP_LESSON_DISPLAY_CORRECT_INDEXES = [
  1, 3, 0, 2, 3, 0, 2, 1, 0, 2, 1, 3, 2, 1, 3, 0, 1, 0,
] as const satisfies readonly McpAnswerIndex[];

export function presentMcpOptions(
  check: Pick<McpKnowledgeCheck, "options" | "correctIndex">,
  displayedCorrectIndex: McpAnswerIndex,
) {
  const options = check.options.map((text, originalIndex) => ({ text, originalIndex }));
  const correct = options[check.correctIndex];
  const distractors = options.filter((option) => option.originalIndex !== check.correctIndex);
  distractors.splice(displayedCorrectIndex, 0, correct);
  return distractors;
}

export const MCP_FINAL_ASSESSMENT = [
  {
    id: "fit-direct-api",
    reviewSlug: "why-mcp",
    outcome: "Choose MCP only when its interoperability boundary adds value.",
    question: "One internal dashboard owns both ends of a stable tax-rate lookup, no other host will use it, and no model judgment is needed. What is the strongest design?",
    options: [
      "Keep a direct deterministic API or function unless a portable MCP boundary becomes necessary",
      "Add MCP because every external lookup should be model-mediated",
      "Expose a write tool so the model can correct tax rates",
      "Publish the lookup in a registry before testing it",
    ],
    correctIndex: 0,
    explanation: "MCP is useful for a portable, discoverable capability boundary. It is not a requirement for a single-owner deterministic integration.",
  },
  {
    id: "separate-client-boundaries",
    reviewSlug: "architecture-trust",
    outcome: "Preserve server-specific connections and authority boundaries.",
    question: "A research host connects to a local PDF server and a remote student-record server. Which architecture best limits cross-server authority?",
    options: [
      "Give the model one shared bearer token for both servers",
      "Maintain a distinct MCP client relationship, credentials, and policy for each server",
      "Let the PDF server forward calls to the student-record server",
      "Merge both tool lists and discard the originating server name",
    ],
    correctIndex: 1,
    explanation: "Separate client relationships keep transports, credentials, negotiated capabilities, identities, and policies attributable to the correct server.",
  },
  {
    id: "inline-version-handling",
    reviewSlug: "discovery-versioning",
    outcome: "Apply the stateless version contract even when discovery is skipped.",
    question: "A client invokes resources/read without first calling server/discover. What must it still do?",
    options: [
      "Reuse version state from a previous connection",
      "Send initialize and wait for notifications/initialized",
      "Attach current per-request version and capability metadata and handle UnsupportedProtocolVersionError",
      "Add Mcp-Session-Id so the server can restore negotiation state",
    ],
    correctIndex: 2,
    explanation: "Servers must implement discovery, but clients may invoke another RPC inline. The request remains self-contained and must handle a version rejection explicitly.",
  },
  {
    id: "legacy-trace-reading",
    reviewSlug: "inspect-the-wire",
    outcome: "Use legacy traces as diagnostic evidence without copying obsolete envelopes.",
    question: "Inspector shows a successful tools/call trace labelled LEGACY, with no current request metadata or resultType. How should it be used?",
    options: [
      "As proof that current clients may omit required metadata",
      "As a template for a new Streamable HTTP server",
      "As proof that the server is secure in every host",
      "As evidence for method, direction, latency, and result debugging—paired with a current-envelope test",
    ],
    correctIndex: 3,
    explanation: "A legacy trace can still localize failures, but its era label and missing current fields prevent it from serving as a 2026 wire template.",
  },
  {
    id: "tool-name-collision",
    reviewSlug: "tools",
    outcome: "Resolve exact server and tool identities before execution.",
    question: "Two connected servers both expose a tool named search. What is the safest client behavior?",
    options: [
      "Namespace or otherwise bind each tool to its originating server before model selection and invocation",
      "Call whichever server responded first during discovery",
      "Ask the model to infer the server from tool descriptions after execution",
      "Treat duplicate names as proof the servers are equivalent",
    ],
    correctIndex: 0,
    explanation: "Tool names are unique within a server, not globally. The host/client must retain the originating server and enforce its policy.",
  },
  {
    id: "resource-update-reread",
    reviewSlug: "resources",
    outcome: "Preserve authorization and provenance when resources change.",
    question: "A subscribed course-policy resource emits an updated notification. What should the host place in model context?",
    options: [
      "The notification text, treated as authoritative content",
      "A fresh authorized resources/read result whose source URI and freshness are preserved",
      "The cached prior resource because the subscription already authorized it",
      "Every resource returned by resources/list",
    ],
    correctIndex: 1,
    explanation: "The notification signals change. A fresh read retrieves the current content through the normal authorization and provenance boundary.",
  },
  {
    id: "prompt-authority",
    reviewSlug: "prompts-completion",
    outcome: "Keep prompt templates separate from execution authority.",
    question: "A server prompt template recommends running a destructive cleanup tool. What authority does the prompt itself grant?",
    options: [
      "The right to bypass host approval because the prompt is server-authored",
      "The right to widen the tool token’s scopes",
      "None; the user may select the template, while tool policy and authorization remain separate",
      "Automatic access to every resource from the same server",
    ],
    correctIndex: 2,
    explanation: "Prompts are user-controlled templates. Their content cannot grant tool authority or replace host policy and server-side authorization.",
  },
  {
    id: "mrtr-retry",
    reviewSlug: "elicitation-mrtr",
    outcome: "Continue a multi-round operation through an explicit retry.",
    question: "tools/call returns InputRequiredResult with requestState and an input request. After gathering valid user input, what should the client do?",
    options: [
      "Send notifications/initialized with the input",
      "Resume the old HTTP response with Last-Event-ID",
      "Mutate the original request ID in place",
      "Retry the operation with a new JSON-RPC ID plus requestState and inputResponses",
    ],
    correctIndex: 3,
    explanation: "MRTR makes continuation explicit: the retry is a new request carrying the returned state and the client’s input responses.",
  },
  {
    id: "http-notification-response",
    reviewSlug: "transports-json-rpc",
    outcome: "Distinguish request responses from notification acceptance in Streamable HTTP.",
    question: "A valid JSON-RPC notification defined by a negotiated extension or custom method is POSTed to a current Streamable HTTP endpoint and accepted. What response is correct?",
    options: [
      "HTTP 202 Accepted with no body",
      "A JSON-RPC result with the notification ID",
      "A permanent SSE stream opened by GET",
      "HTTP 200 with Mcp-Session-Id",
    ],
    correctIndex: 0,
    explanation: "MCP 2026-07-28 core defines no client-to-server notifications over Streamable HTTP; its only client-sent core notification, notifications/cancelled, is used on stdio. For a valid extension or custom notification POST, JSON-RPC has no response object and Streamable HTTP acknowledges acceptance with HTTP 202 and no body.",
  },
  {
    id: "subscription-correlation",
    reviewSlug: "flow-control",
    outcome: "Correlate subscription notifications without invented session state.",
    question: "A subscriptions/listen request uses JSON-RPC ID 42. Which value correlates later notifications on that stream?",
    options: [
      "A random subscription token minted after the first update",
      "io.modelcontextprotocol/subscriptionId equal to 42, first shown in the acknowledged notification",
      "Mcp-Session-Id from the connection response",
      "The resource URI without any subscription identifier",
    ],
    correctIndex: 1,
    explanation: "The subscription ID is the original listen request’s JSON-RPC ID; the acknowledgement is the first stream message and later notifications repeat it.",
  },
  {
    id: "scope-step-up",
    reviewSlug: "authorization",
    outcome: "Add scope only through an explicit authorization challenge and consent path.",
    question: "A read token reaches a write tool and the server returns an insufficient-scope challenge. What should a capable host do next?",
    options: [
      "Forward the read token to the upstream write API",
      "Retry repeatedly until the server accepts it",
      "Explain the minimum added scope, obtain user approval, reauthorize, then retry with the new token",
      "Store a broad administrator token in the tool description",
    ],
    correctIndex: 2,
    explanation: "Step-up authorization is explicit. Unsupported clients should leave the operation unavailable rather than silently broadening authority.",
  },
  {
    id: "state-handle-theft",
    reviewSlug: "security",
    outcome: "Treat state handles as names, not bearer capabilities.",
    question: "An attacker obtains another user’s opaque state handle. Which server control prevents the handle alone from granting access?",
    options: [
      "Documenting the handle in a tool annotation",
      "Keeping the same handle predictable across users",
      "Trusting the host because it completed discovery",
      "Using unpredictable handles and rechecking the caller’s authorization for that state on every request",
    ],
    correctIndex: 3,
    explanation: "Explicit state handles do not carry authority. The server must bind and reauthorize access on every request and make handles difficult to guess.",
  },
  {
    id: "sdk-tier-boundary",
    reviewSlug: "build-server",
    outcome: "Interpret SDK support tiers without inventing a security certification.",
    question: "A server uses a Tier 1 MCP SDK. What conclusion is justified?",
    options: [
      "It uses a strongly supported SDK baseline, but still needs pinned versions and security and compatibility tests",
      "Its tools are automatically least-privilege",
      "Every host will support every extension it exposes",
      "Its registry package can be installed without review",
    ],
    correctIndex: 0,
    explanation: "SDK tiers concern protocol support, completeness, documentation, and maintenance commitment; they are not security certifications.",
  },
  {
    id: "hostile-tool-result",
    reviewSlug: "build-client",
    outcome: "Preserve result semantics while treating returned content as untrusted.",
    question: "A tool result contains hostile prose plus valid structured data. What should the client do?",
    options: [
      "Promote the prose into the system instruction because it came from MCP",
      "Preserve result fields and provenance, validate declared structured output, and keep all returned content in an untrusted data channel",
      "Drop resultType and isError before sending anything to the host",
      "Assume annotations prove the result is safe",
    ],
    correctIndex: 1,
    explanation: "MCP transports data; it does not elevate its trust. Clients should preserve the contract while isolating hostile or untrusted content.",
  },
  {
    id: "codelab-credential-boundary",
    reviewSlug: "host-integrations",
    outcome: "Use current product evidence without inheriting insecure example credentials.",
    question: "An official codelab places a broad PAT inline in project settings. What is the right production adaptation?",
    options: [
      "Commit the same settings file because the source is official",
      "Grant additional scopes so fewer calls fail",
      "Use the UI workflow as dated evidence, but inject a least-privilege credential securely and verify current docs",
      "Replace OAuth with a token embedded in the prompt",
    ],
    correctIndex: 2,
    explanation: "Official educational sources can age or simplify credential handling. Their workflow evidence does not override least privilege and secret-management practice.",
  },
  {
    id: "issue-evidence-boundary",
    reviewSlug: "practitioner-patterns",
    outcome: "Bound practitioner evidence to what a report actually establishes.",
    question: "One GitHub issue reports MCP calls hanging in a particular loopback setup. Which course claim is defensible?",
    options: [
      "All loopback MCP servers are unreliable",
      "The named product always fails after the same duration",
      "MCP should never be used for personal knowledge work",
      "That reporter observed a layered health failure under stated conditions, motivating local reproduction and timeout probes",
    ],
    correctIndex: 3,
    explanation: "An issue is bounded implementation evidence, not prevalence. Preserve the environment and reproduce before generalizing.",
  },
  {
    id: "registry-proof",
    reviewSlug: "production-registry",
    outcome: "Separate namespace identity from package and deployment safety.",
    question: "A registry entry has a verified publisher namespace. What remains necessary before installation?",
    options: [
      "Review the immutable package or endpoint, permissions, version, provenance, license, and local threat model",
      "Nothing; namespace verification certifies every tool",
      "Only a star-count check",
      "A model-generated summary of the server title",
    ],
    correctIndex: 0,
    explanation: "Namespace verification helps identify the publisher. It does not establish code integrity, least privilege, licensing, or organizational fit.",
  },
  {
    id: "apps-negotiation-fallback",
    reviewSlug: "apps-tasks-capstone",
    outcome: "Add interactive UI only through negotiated extension support with a usable fallback.",
    question: "A tool references a ui:// resource, but the client did not advertise MCP Apps support. What should the server return?",
    options: [
      "An Apps-only result and require the client to infer the extension",
      "A useful ordinary content result, without assuming the disabled extension is available",
      "A legacy HTTP+SSE session that renders the component",
      "A broader OAuth token containing UI permissions",
    ],
    correctIndex: 1,
    explanation: "Extensions are disabled by default and negotiated explicitly. The base tool result should remain useful when an App cannot render.",
  },
] as const satisfies readonly McpAssessmentQuestion[];
