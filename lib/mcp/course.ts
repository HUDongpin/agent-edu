import {
  MCP_LOCALES,
  type McpConcept,
  type McpLesson,
  type McpLocale,
  type McpUnit,
} from "./types";

export const MCP_CONCEPTS = [
  { id: "scope", label: "Protocol scope and non-goals", status: "core" },
  { id: "participants", label: "Host, client, and server roles", status: "core" },
  { id: "layers", label: "Data and transport layers", status: "core" },
  { id: "json-rpc", label: "JSON-RPC requests, responses, errors, and notifications", status: "core" },
  { id: "stateless", label: "Stateless request model", status: "core" },
  { id: "state-handles", label: "Explicit state handles and per-request re-authorization", status: "optional" },
  { id: "metadata", label: "Per-request protocol, identity, and capability metadata", status: "core" },
  { id: "discovery", label: "server/discover and capability negotiation", status: "core" },
  { id: "versioning", label: "Protocol versions and compatibility", status: "core" },
  { id: "legacy-lifecycle", label: "initialize / initialized lifecycle", status: "removed" },
  { id: "ping", label: "ping utility", status: "removed" },
  { id: "tools", label: "Tool discovery and invocation", status: "core" },
  { id: "tool-schema", label: "JSON Schema 2020-12 input and output contracts", status: "core" },
  { id: "structured-content", label: "Content blocks, structuredContent, and errors", status: "core" },
  { id: "annotations", label: "Untrusted tool annotations and hints", status: "optional" },
  { id: "resources", label: "Resources, URIs, contents, and templates", status: "core" },
  { id: "prompts", label: "User-controlled prompt templates", status: "core" },
  { id: "completion", label: "Argument completion", status: "optional" },
  { id: "elicitation", label: "Form and URL elicitation", status: "core" },
  { id: "mrtr", label: "Multi round-trip requests", status: "core" },
  { id: "stdio", label: "stdio transport and stdout boundary", status: "core" },
  { id: "streamable-http", label: "Streamable HTTP transport", status: "core" },
  { id: "http-headers", label: "Required Streamable HTTP MCP headers", status: "core" },
  { id: "http-parameter-headers", label: "Optional x-mcp-header parameter mirroring", status: "optional" },
  { id: "subscriptions", label: "Subscribe-and-notify streams", status: "optional" },
  { id: "progress", label: "Progress reporting", status: "optional" },
  { id: "cancellation", label: "Cooperative cancellation", status: "optional" },
  { id: "caching", label: "Required TTL and cache scope on cacheable Complete results", status: "core" },
  { id: "pagination", label: "Cursor pagination", status: "optional" },
  { id: "authorization", label: "OAuth authorization for remote servers", status: "optional" },
  { id: "auth-discovery", label: "Protected-resource and authorization-server discovery", status: "optional" },
  { id: "client-registration", label: "Client ID metadata and registration", status: "optional" },
  { id: "security", label: "Threat modeling and least authority", status: "core" },
  { id: "approvals", label: "Human approval and reversible execution", status: "practice" },
  { id: "inspector", label: "Inspector, tracing, and debugging", status: "practice" },
  { id: "sdk", label: "SDK support tiers and implementation boundaries", status: "optional" },
  { id: "host-integration", label: "Claude, OpenAI, Codex, and Gemini host integration", status: "optional" },
  { id: "operations", label: "Observability, evaluation, rollout, and incident response", status: "optional" },
  { id: "registry", label: "Registry metadata and namespace verification", status: "optional" },
  { id: "extensions", label: "Extension capability negotiation", status: "extension" },
  { id: "apps", label: "MCP Apps interactive UI", status: "extension" },
  { id: "tasks", label: "Durable asynchronous Tasks", status: "extension" },
  { id: "enterprise-auth", label: "Enterprise-managed and client-credentials authorization", status: "extension" },
  { id: "roots", label: "Roots", status: "deprecated" },
  { id: "sampling", label: "Sampling", status: "deprecated" },
  { id: "logging", label: "Protocol logging", status: "deprecated" },
  { id: "dcr", label: "Dynamic Client Registration", status: "deprecated" },
  { id: "http-sse", label: "Legacy HTTP+SSE transport", status: "deprecated" },
] as const satisfies readonly McpConcept[];

export const MCP_UNITS = [
  {
    id: "unit-1",
    order: 1,
    title: "Read the protocol",
    summary: "Build the mental model, trust map, discovery sequence, and wire-reading habit before installing servers.",
    lessonSlugs: ["why-mcp", "architecture-trust", "discovery-versioning", "inspect-the-wire"],
  },
  {
    id: "unit-2",
    order: 2,
    title: "Design capabilities",
    summary: "Separate actions, context, templates, and human input; give each a precise contract.",
    lessonSlugs: ["tools", "resources", "prompts-completion", "elicitation-mrtr"],
  },
  {
    id: "unit-3",
    order: 3,
    title: "Move and protect messages",
    summary: "Choose a transport, control long-running flows, authorize remote access, and threat-model the full path.",
    lessonSlugs: ["transports-json-rpc", "flow-control", "authorization", "security"],
  },
  {
    id: "unit-4",
    order: 4,
    title: "Build and connect",
    summary: "Implement a small server and client, test them outside a model, then connect real hosts deliberately.",
    lessonSlugs: ["build-server", "build-client", "host-integrations", "practitioner-patterns"],
  },
  {
    id: "unit-5",
    order: 5,
    title: "Ship and extend",
    summary: "Operate, migrate, publish, and extend MCP without mistaking ecosystem convenience for a trust guarantee.",
    lessonSlugs: ["production-registry", "apps-tasks-capstone"],
  },
] as const satisfies readonly McpUnit[];

export const MCP_LESSONS = [
  {
    slug: "why-mcp",
    order: 1,
    unitId: "unit-1",
    minutes: 40,
    title: "What MCP standardizes—and what it does not",
    summary: "See MCP as a protocol for exchanging context and actions, not as an agent, a model, or a security product.",
    objective: "Decide whether a problem needs MCP, a direct API, an ordinary function, or no model at all.",
    conceptIds: ["scope", "participants", "layers"],
    sections: [
      {
        heading: "The interoperability problem",
        body: [
          "An AI application often needs the same kinds of external capability: list available actions, read context, invoke an operation, and show the result. Without a shared protocol, every host and integration invents its own discovery, schema, transport, and error conventions.",
          "MCP standardizes that exchange. A server can expose tools, resources, and prompts through a JSON-RPC data layer over a supported transport. A compatible host can connect through an MCP client without the server knowing which model will consume the result.",
        ],
        bullets: [
          "Use MCP when multiple compatible hosts should discover and use the same capability boundary.",
          "Prefer a direct API when one application owns both ends and MCP adds no portability or governance value.",
          "Keep deterministic work deterministic: MCP does not make every function an AI task.",
        ],
      },
      {
        heading: "Protocol, not product behavior",
        body: [
          "MCP defines messages and capability contracts. It does not select a model, decide when a model should call a tool, determine how retrieved context fits into a prompt, guarantee the truth of a result, or make a server safe.",
          "Vendor hosts add their own approval UI, configuration files, tool-selection policies, context windows, and extension support. Those surfaces are valuable, but none is the protocol itself. This course keeps the normative layer and each host layer visibly separate.",
        ],
        callout: {
          tone: "current",
          title: "Current baseline",
          body: "The course targets MCP protocol version 2026-07-28. Earlier Academy lessons and codelabs remain useful for concepts, but their wire examples are treated as historical until the current specification confirms them.",
        },
      },
      {
        heading: "The first design question",
        body: [
          "Start with the authority being introduced. Reading a public schema is different from sending an email, merging code, querying private records, or approving a payment. The protocol can carry all of those operations; your design must decide which should exist and who can authorize each one.",
          "A good MCP proposal therefore begins with a job, a user, a trust boundary, and evidence of success—not with a long catalogue of tools. The smallest sufficient capability surface is easier for a model to choose, a person to review, and an operator to secure.",
        ],
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-architecture", "mcp-spec-overview", "claude-academy-intro", "openai-academy-mcp"],
    practice: {
      title: "Write a one-page MCP fit decision",
      brief: "Choose a real workflow and argue for MCP, a direct API, or neither.",
      steps: [
        "Name the user outcome and the external system involved.",
        "List the minimum context to read and actions to perform.",
        "Name at least two hosts or clients that would justify a portable protocol.",
        "Record the authority added and the simpler alternative you rejected.",
      ],
      evidence: ["A one-sentence protocol fit decision", "A capability boundary", "A stated non-goal"],
      safety: "Do not connect production data or credentials during this design exercise.",
    },
    check: {
      question: "Which statement best describes MCP?",
      options: [
        "A standardized protocol for exchanging context and capabilities between AI applications and servers",
        "A model that autonomously decides which business actions are safe",
        "An authentication service that makes every connected server trustworthy",
        "A replacement for all direct APIs and ordinary functions",
      ],
      correctIndex: 0,
      explanation: "MCP standardizes the exchange. Model policy, authorization, safety, and application behavior remain separate responsibilities.",
    },
    takeaway: "MCP is valuable when a precise capability boundary should travel across compatible hosts; it is not a shortcut around product design or security.",
  },
  {
    slug: "architecture-trust",
    order: 2,
    unitId: "unit-1",
    minutes: 45,
    title: "Hosts, clients, servers, and trust boundaries",
    summary: "Trace one request through the architecture and identify which participant owns policy, connection, and capability execution.",
    objective: "Draw a correct participant map for local and remote servers and mark every data and authority boundary.",
    conceptIds: ["participants", "layers", "security", "approvals"],
    interactive: "architecture",
    sections: [
      {
        heading: "One host, one client per server",
        body: [
          "The host is the AI application. It coordinates the model, user experience, approvals, and one or more MCP clients. Each client maintains the relationship with one server. The server exposes capabilities and executes its own code or upstream API calls.",
          "A local stdio server usually runs as a child process for one client. A remote Streamable HTTP server can serve many clients. ‘Local’ and ‘remote’ describe deployment and transport, not trustworthiness: a local package can still read files or run commands, while a remote service can be narrowly scoped and audited.",
        ],
      },
      {
        heading: "Two layers, several policies",
        body: [
          "The data layer defines JSON-RPC messages, discovery, primitives, results, errors, and notifications. The transport layer defines framing and connection mechanics. Authorization for remote HTTP is attached to that transport boundary, while tool approval belongs to the host’s execution policy.",
          "Keep these controls independent. A successful OAuth flow says who may reach a server; it does not prove the server’s tool is safe. A host approval says a user consented to this call; it does not prove the token has the right audience. A valid tool schema says the arguments are well shaped; it does not prove the underlying operation is authorized.",
        ],
      },
      {
        heading: "Map data before code",
        body: [
          "For every edge, record what crosses it: prompt text, resource contents, tool arguments, tool results, credentials, logs, and telemetry. Then record who can persist, transform, or forward each item. This exposes accidental disclosure that a simple host-server box diagram hides.",
          "Also mark the model as an untrusted decision maker. The model may propose a tool call, but the host must validate it against available tools, permissions, user intent, and approval policy before the client invokes the server.",
        ],
        callout: {
          tone: "caution",
          title: "No inherited trust",
          body: "A server’s title, description, tool annotations, registry namespace, and familiar brand are inputs to a trust decision—not proof that the server or its current build deserves authority.",
        },
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-architecture", "mcp-security", "github-mcp-server"],
    practice: {
      title: "Draw a trust-boundary map",
      brief: "Map a host connected to one local filesystem server and one remote issue-tracker server.",
      steps: [
        "Draw the host and its two distinct MCP clients.",
        "Label stdio and Streamable HTTP on the correct edges.",
        "Add user, model, server process, upstream API, and credential store.",
        "Mark every read, write, credential, and approval boundary.",
      ],
      evidence: ["A participant diagram", "A data-flow legend", "Three explicit trust assumptions"],
      safety: "Use fictional systems and credentials; the artifact is a design model, not a connection test.",
    },
    check: {
      question: "A host connects to three MCP servers. What is the standard architectural relationship?",
      options: [
        "One shared MCP client controls all three servers as a single connection",
        "The host creates a distinct MCP client relationship for each server",
        "The model connects directly to each server",
        "Each server creates a client inside the host",
      ],
      correctIndex: 1,
      explanation: "The host coordinates one MCP client per server connection, preserving separate capabilities and trust boundaries.",
    },
    takeaway: "Architecture becomes actionable when every participant, edge, credential, and decision owner is explicit.",
  },
  {
    slug: "discovery-versioning",
    order: 3,
    unitId: "unit-1",
    minutes: 50,
    title: "Stateless discovery, versions, and capabilities",
    summary: "Read the current per-request metadata model and negotiate only the features both sides actually support.",
    objective: "Explain a 2026-07-28 discovery exchange and diagnose a version or capability mismatch without guessing.",
    conceptIds: ["stateless", "state-handles", "metadata", "discovery", "versioning", "legacy-lifecycle", "ping"],
    interactive: "envelope",
    sections: [
      {
        heading: "Every request carries its context",
        body: [
          "The 2026-07-28 core is stateless: a server must be able to process each request from the information in that request. Required _meta fields carry the protocol version and client capabilities; clients should also carry their identity unless configured not to.",
          "Stateless does not mean a server cannot use a database or task store. It means protocol correctness cannot depend on a connection, process, or prior call as implicit state. Authorization, opaque server-minted state handles, requestState for an explicit retry, durable task IDs, and application data must travel as explicit inputs, and authorization is checked again on every request.",
        ],
        code: {
          label: "Minimal discovery envelope for the current protocol",
          language: "json",
          value: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-lab",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": { "form": {}, "url": {} }
      }
    }
  }
}`,
        },
      },
      {
        heading: "Discover once, validate always",
        body: [
          "Servers must implement server/discover. A client may call it before other operations to learn supported versions, self-reported server identity, capabilities, cache lifetime, and cache scope. A complete response carries resultType: complete. A client may also attempt an operation directly and handle UnsupportedProtocolVersion.",
          "Discovery is a convenience and compatibility contract, not permission or authenticated identity. Cache its result within the advertised policy, but still attach current client metadata to every request and reject an operation the negotiated capability set does not support. Successful current results declare resultType; compatibility rules only infer complete for older responses.",
        ],
      },
      {
        heading: "Version by evidence, not date-shaped intuition",
        body: [
          "Protocol versions are date strings, and the current release can materially change lifecycle and message structure. A tutorial labelled 2025 may still teach a useful mental model while its initialize sequence, session assumptions, or transport examples no longer describe the current core.",
          "Pin the version in tests and documentation. On mismatch, use the server’s supportedVersions list or normative changelog to choose an intentional compatibility path. Never silently downgrade into deprecated HTTP+SSE or assume an old client primitive is still recommended.",
        ],
        bullets: [
          "initialize, notifications/initialized, and ping → absent from the 2026-07-28 core; support them only on an explicit legacy compatibility path.",
          "logging/setLevel and notifications/roots/list_changed → removed by the breaking revision; the broader Logging, Roots, and Sampling feature families remain Deprecated.",
          "resources/subscribe, resources/unsubscribe, and the endpoint GET stream → replaced by subscriptions/listen.",
          "The August 2026 roadmap is a future watchlist, not a source of current wire requirements.",
        ],
        callout: {
          tone: "current",
          title: "Migration signal",
          body: "In 2026-07-28, server/discover and per-request metadata replace the older connection-initialization mental model. initialize/notifications/initialized and the ping utility are removed from the current core. Roots, sampling, protocol logging, DCR, and HTTP+SSE are deprecated—not erased, but unsuitable for new designs.",
        },
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-architecture", "mcp-spec-overview", "mcp-discovery", "mcp-versioning", "mcp-changelog", "mcp-schema", "mcp-deprecated", "mcp-feature-lifecycle", "mcp-roadmap"],
    practice: {
      title: "Annotate a discovery trace",
      brief: "Label identity, version, capabilities, cache policy, and retry behavior in a sample exchange.",
      steps: [
        "Circle the JSON-RPC envelope fields and the MCP metadata fields separately.",
        "Identify one client capability and two server capabilities.",
        "State when the response can be cached and what must still appear on the next request.",
        "Write the response to an unsupported protocol version.",
      ],
      evidence: ["An annotated request", "An annotated response", "A deterministic mismatch rule"],
      safety: "Do not treat discovered tool descriptions as trusted instructions; discovery is descriptive.",
    },
    check: {
      question: "What does statelessness require in MCP 2026-07-28?",
      options: [
        "Servers may never persist application data",
        "Clients must call server/discover before every request",
        "Each request contains the protocol information needed to process it without hidden connection history",
        "Remote servers cannot authorize users",
      ],
      correctIndex: 2,
      explanation: "The protocol request is self-contained; explicit stores, auth inputs, task handles, and retry state can still exist.",
    },
    takeaway: "Pin the protocol version, carry required metadata on every request, and use discovery to negotiate—not to confer trust.",
  },
  {
    slug: "inspect-the-wire",
    order: 4,
    unitId: "unit-1",
    minutes: 50,
    title: "Use the Inspector before a model",
    summary: "Connect, enumerate, call, and trace a server directly so host or model behavior cannot hide a protocol defect.",
    objective: "Produce an Inspector evidence packet that distinguishes transport, discovery, schema, execution, and host-policy failures.",
    conceptIds: ["inspector", "json-rpc", "discovery"],
    sections: [
      {
        heading: "Five checks, in order",
        body: [
          "Start at the server settings: command or URL, transport, arguments, environment, and connection state. Then inspect discovered capabilities. Next inspect the relevant primitive contract. Invoke a safe test with known inputs. Finally read the Protocol and Network views when behavior differs from expectation.",
          "This sequence localizes failure. A process that never starts is not a tool-schema problem. A listed tool that rejects valid arguments is not a transport problem. A tool that succeeds in Inspector but not in a host points toward host configuration, approval, or compatibility.",
        ],
      },
      {
        heading: "The trace is the evidence",
        body: [
          "Capture the method, direction, request ID, parameters, required metadata, latency, result shape, and error status. Redact tokens and private content before sharing. A screenshot is useful for teaching; an exported machine-readable trace is better for regression tests.",
          "Use a direct primitive call before asking a model to choose the tool. That removes prompt interpretation and tool selection from the experiment, leaving the server contract itself under test.",
        ],
      },
      {
        heading: "Read real UI critically",
        body: [
          "The captured Inspector shows Servers, Apps, Tools, Prompts, Resources, Logs, Protocol, and Network surfaces. A tab appearing in a tool does not make its underlying feature core or recommended; Apps is an extension and protocol logging is deprecated even when a compatibility view remains present.",
          "The Protocol screenshot in this lesson is visibly marked LEGACY. It teaches how to read direction, method, parameters, latency, and results, but not the current envelope. Version labels inside screenshots are evidence of the captured build, not a promise about every deployment; pair every figure with its observed date and the current specification.",
        ],
      },
    ],
    figureIds: ["inspector-settings", "inspector-protocol"],
    sourceIds: ["mcp-inspector", "github-inspector", "claude-academy-intro", "mcp-deprecated"],
    practice: {
      title: "Create an Inspector evidence packet",
      brief: "Test a harmless reference or learning server without involving a model.",
      steps: [
        "Record exact server command or URL, transport, package version, and protocol version.",
        "Capture server/discover and one list operation.",
        "Invoke one read-only operation with a normal and invalid input.",
        "Export or copy the protocol messages, then redact secrets and personal data.",
      ],
      evidence: ["Environment manifest", "Successful trace", "Expected-failure trace", "Redaction note"],
      safety: "Use a read-only learning server and synthetic inputs. Never paste an access token into a screenshot or trace attachment.",
    },
    check: {
      question: "A tool succeeds in Inspector but fails in an AI host. What is the strongest next inference?",
      options: [
        "The tool implementation is certainly correct in production",
        "The model is defective",
        "MCP cannot support this tool",
        "The core server path works for that test, so investigate host configuration, approval, compatibility, and context next",
      ],
      correctIndex: 3,
      explanation: "Inspector narrows the fault domain; one successful test does not prove production correctness or every host path.",
    },
    takeaway: "A direct, redacted wire trace is the fastest way to separate protocol evidence from model behavior.",
  },
  {
    slug: "tools",
    order: 5,
    unitId: "unit-2",
    minutes: 55,
    title: "Tools: executable contracts with consequences",
    summary: "Design narrow actions whose names, schemas, results, errors, and approval needs are legible to both models and people.",
    objective: "Specify and test a tool contract that rejects ambiguity before execution and returns machine-checkable evidence.",
    conceptIds: ["tools", "tool-schema", "structured-content", "annotations", "approvals"],
    interactive: "tool-contract",
    sections: [
      {
        heading: "Discovery before invocation",
        body: [
          "A server that declares tools responds to tools/list; a client invokes one with tools/call. Tool names should be stable and unique within a server; clients must disambiguate same-name tools across servers. Descriptions should state exactly what changes, and inputSchema must be a valid JSON Schema object. In 2026-07-28, JSON Schema defaults to draft 2020-12, clients must not automatically dereference network $ref targets, and tool-list ordering should be deterministic for effective caching.",
          "Use required fields, enums, bounds, patterns, and additionalProperties deliberately. A vague string called input pushes critical validation into the model. A precise schema moves it into deterministic code where it belongs.",
        ],
        code: {
          label: "A bounded write tool contract",
          language: "json",
          value: `{
  "name": "issues.add_label",
  "description": "Add one existing label to one issue. Does not create labels.",
  "inputSchema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "repository": { "type": "string", "pattern": "^[^/]+/[^/]+$" },
      "issueNumber": { "type": "integer", "minimum": 1 },
      "label": { "type": "string", "minLength": 1, "maxLength": 50 }
    },
    "required": ["repository", "issueNumber", "label"],
    "additionalProperties": false
  }
}`,
        },
      },
      {
        heading: "Return evidence, not applause",
        body: [
          "A tool result can include text, image, audio, resource-link, or embedded-resource blocks, structuredContent containing any JSON value, and an error signal. When downstream code needs a stable shape, define outputSchema and return matching structured data. Keep human-readable text concise and include stable identifiers, before-and-after values, or a verification URL where appropriate.",
          "Expected domain failures should be legible to the model and user: not found, conflict, approval missing, precondition changed, or rate limited. Protocol errors are for malformed or unsupported protocol interactions; a normal business failure is often a successful tools/call that carries isError and actionable content.",
        ],
      },
      {
        heading: "Hints are not authority",
        body: [
          "Tool annotations can describe read-only, destructive, idempotent, or open-world behavior, but clients must treat them as untrusted unless the server itself is trusted. The x-mcp-header JSON Schema annotation can route selected parameters into Streamable HTTP headers; never use it for sensitive values. Enforcement belongs in authorization, validation, policy, and the underlying system—not in a descriptive flag.",
          "Hosts should keep a human able to inspect and deny consequential operations. Use allowlists, read-only modes, dry runs, idempotency keys, precondition checks, and narrow scopes so one mistaken selection does not become an irreversible incident.",
        ],
        callout: {
          tone: "caution",
          title: "Description injection",
          body: "Tool names, descriptions, results, and upstream data can contain hostile instructions. Display and pass them as data; never let server-authored text silently rewrite host policy.",
        },
      },
    ],
    figureIds: ["inspector-tools"],
    sourceIds: ["mcp-tools", "mcp-schema", "mcp-inspector", "mcp-security", "github-mcp-server"],
    practice: {
      title: "Red-team a tool contract",
      brief: "Turn a broad ‘manage repository’ tool into a safe, testable action.",
      steps: [
        "Split read and write behavior into separate tools.",
        "Constrain every argument with JSON Schema and reject unknown fields.",
        "Define normal, empty, conflict, unauthorized, and upstream-failure results.",
        "Add a dry run or precondition and state exactly when human approval is required.",
      ],
      evidence: ["Input schema", "Output schema", "Five test cases", "Approval and rollback rule"],
      safety: "Run tests against fixtures or a disposable repository, never a production workspace.",
    },
    check: {
      question: "Which control actually prevents a supposedly read-only tool from writing?",
      options: [
        "Enforced server credentials, validation, and underlying read-only authorization",
        "A readOnlyHint annotation by itself",
        "The tool description saying ‘safe’",
        "The model promising not to call write endpoints",
      ],
      correctIndex: 0,
      explanation: "Annotations and descriptions inform selection; enforced permissions and code determine what can happen.",
    },
    takeaway: "A good tool makes the safe action easy, the unsafe action impossible, and the result independently verifiable.",
  },
  {
    slug: "resources",
    order: 6,
    unitId: "unit-2",
    minutes: 50,
    title: "Resources: addressable context with provenance",
    summary: "Expose context through stable URIs, templates, MIME types, cache policy, and explicit host selection.",
    objective: "Design a resource surface that preserves identity, access control, freshness, and source boundaries.",
    conceptIds: ["resources", "caching", "pagination", "subscriptions"],
    sections: [
      {
        heading: "Application-driven context",
        body: [
          "Resources are server-exposed data identified by URIs. A host may present a picker, search them, include them automatically, or use another interface. MCP defines the list and read contracts; it does not require one UI or decide which resource belongs in a model context.",
          "A resource record can carry name, title, description, icons, MIME type, and size. Reading returns one or more text or binary contents. Keep the source URI in every returned content item so a learner, model, and audit log can trace where the bytes came from.",
        ],
      },
      {
        heading: "Templates and changing inventories",
        body: [
          "Resource templates use URI Template syntax for parameterized collections. Completion can help a user choose valid arguments. List and template-list operations can paginate and advertise caching; the visible set may vary with authorization but must not mutate merely because of hidden per-connection history.",
          "A server can advertise listChanged and subscription support. In the current protocol, clients open an explicit subscriptions/listen stream with filters. Its first message is notifications/subscriptions/acknowledged, whose io.modelcontextprotocol/subscriptionId equals the original listen request’s JSON-RPC ID; matching notifications carry the same value. On update, a client normally reads the resource again instead of treating the notification as the content.",
        ],
      },
      {
        heading: "Context is still untrusted data",
        body: [
          "A README, ticket, document, database row, or webpage can contain prompt injection, secrets, stale claims, or text from an untrusted author. Resource access should be least-privilege, and hosts should preserve provenance and isolate instructions from retrieved data.",
          "Design for size and freshness. Use cursor pagination for large inventories, ttlMs and cacheScope for cacheable responses, content size limits, MIME validation, and explicit truncation. Never smuggle a write through a resource/read path.",
        ],
        callout: {
          tone: "practice",
          title: "Resource test",
          body: "For every resource, ask: who can name it, who can read it, what makes it stale, how large can it be, and which source identifier survives into the final answer?",
        },
      },
    ],
    figureIds: ["inspector-resources"],
    sourceIds: ["mcp-resources", "mcp-completion", "mcp-subscriptions", "mcp-caching", "mcp-pagination", "mcp-inspector"],
    practice: {
      title: "Design a provenance-preserving library",
      brief: "Specify resources for a small research collection without sending the entire corpus to a model.",
      steps: [
        "Define a list record and URI for each document plus a template for page-level access.",
        "Specify MIME type, size limit, authorization filter, pagination, and cache scope.",
        "Design one update subscription and the subsequent re-read behavior.",
        "Show how a quoted claim retains document and page identity.",
      ],
      evidence: ["URI scheme", "Resource and template examples", "Cache/subscription policy", "Provenance trace"],
      safety: "Use public or synthetic documents and assume every resource body may contain hostile instructions.",
    },
    check: {
      question: "Who decides how an MCP resource is incorporated into model context?",
      options: [
        "The protocol mandates automatic inclusion",
        "The host application applies its user interface and context policy",
        "The resource server always injects it into the system prompt",
        "The resource URI itself grants permission",
      ],
      correctIndex: 1,
      explanation: "Resources are application-driven. MCP standardizes discovery and reading, while the host decides selection and use.",
    },
    takeaway: "Resources make context addressable; provenance, authorization, freshness, and injection resistance make it usable.",
  },
  {
    slug: "prompts-completion",
    order: 7,
    unitId: "unit-2",
    minutes: 45,
    title: "Prompts and completion: user-controlled workflows",
    summary: "Expose reusable message templates without confusing instructions with authority or completion with generation.",
    objective: "Create a prompt template with bounded arguments, useful completion, and an honest user-control model.",
    conceptIds: ["prompts", "completion", "subscriptions"],
    sections: [
      {
        heading: "Prompts are selected, not secretly injected",
        body: [
          "MCP prompts are designed to be user-controlled. Servers expose them through prompts/list, and clients retrieve a selected template through prompts/get with explicit arguments. A host might show them as slash commands, menu items, or another discoverable surface.",
          "The server authors the returned messages, while the user controls invocation. That distinction matters: a prompt is a reusable workflow scaffold, not a background policy channel and not permission to call a tool.",
        ],
      },
      {
        heading: "Arguments and completion",
        body: [
          "Prompt arguments should represent choices a user understands: repository, document, review mode, or audience. The completion utility can suggest values for a prompt argument or resource-template variable, often based on previously supplied context.",
          "Completion returns candidate values; it does not generate the final model answer and should not leak values the caller cannot access. Apply authorization and filtering before returning suggestions, cap result counts, and make free-text fallback behavior explicit.",
        ],
      },
      {
        heading: "Keep the rendered messages visible",
        body: [
          "A client should let the user see what a prompt will add, including embedded resources or images. Test the rendered result, not only the template string. A safe template separates server-authored instructions from resource data and does not claim that downstream content is trusted.",
          "As with other inventories, prompt lists can change and may support list-changed notifications. A client should refresh intentionally and preserve the selected prompt name, arguments, server identity, and version in evidence.",
        ],
      },
    ],
    figureIds: ["inspector-prompts"],
    sourceIds: ["mcp-prompts", "mcp-completion", "mcp-subscriptions", "mcp-inspector"],
    practice: {
      title: "Build a review prompt contract",
      brief: "Design a user-invoked prompt for reviewing one change against one rubric.",
      steps: [
        "Define prompt name, description, required arguments, and completion sources.",
        "Render the exact messages for one normal case and one missing argument.",
        "Separate rubric instructions from the untrusted change content.",
        "Record prompt identity, argument values, and resource URIs in the output evidence.",
      ],
      evidence: ["Prompt record", "Rendered message example", "Completion rule", "Injection boundary"],
      safety: "Never use completion to reveal private project names or records outside the caller’s authorization.",
    },
    check: {
      question: "What is the intended interaction model for MCP prompts?",
      options: [
        "Server-controlled hidden instructions",
        "Automatic authorization for related tools",
        "User-controlled selection of discoverable templates",
        "A replacement for tool schemas",
      ],
      correctIndex: 2,
      explanation: "Prompts are intended for explicit user selection. Their content still requires inspection and does not grant tool authority.",
    },
    takeaway: "Prompts package a visible workflow; completion helps choose arguments, and neither mechanism bypasses authorization or user control.",
  },
  {
    slug: "elicitation-mrtr",
    order: 8,
    unitId: "unit-2",
    minutes: 55,
    title: "Elicitation and multi round-trip requests",
    summary: "Pause a request for missing human input without giving a server a hidden channel to collect secrets.",
    objective: "Design a retryable form or URL elicitation flow with consent, validation, decline, and request-state handling.",
    conceptIds: ["elicitation", "mrtr", "approvals"],
    sections: [
      {
        heading: "A request can need another round trip",
        body: [
          "For tools/call, resources/read, and prompts/get, a server can return InputRequiredResult when it cannot complete without more input. The result has resultType input_required, carries one or more input requests and/or opaque requestState, and must include at least one. The client fulfills or declines the requests, then retries the original operation with a new JSON-RPC ID, inputResponses, and the exact requestState when provided.",
          "This multi round-trip request pattern keeps the server from initiating an unsolicited connection-level JSON-RPC call. The extra turn is explicit inside the original operation, and the client retains control over what the user sees and sends. Treat requestState as attacker-controlled unless the server protects its integrity and replay semantics.",
        ],
      },
      {
        heading: "Form mode versus URL mode",
        body: [
          "Form mode gathers flat, structured, non-secret data under a restricted JSON Schema. The client must identify the requesting server, let the user review or change the values, and provide accept, decline, and cancel paths.",
          "Passwords, API keys, access tokens, payment credentials, and other secrets must not pass through form mode. Use URL mode so the sensitive interaction happens out of band. The client must show the destination domain and obtain consent before opening it.",
        ],
        callout: {
          tone: "caution",
          title: "A confirmation is not an authorization system",
          body: "Elicitation can ask a user to confirm intent, but the server must still enforce identity, scope, preconditions, and business rules before performing an action.",
        },
      },
      {
        heading: "Retry safely",
        body: [
          "Treat retries as possible duplicates. Keep requestState opaque, validate that responses correspond to outstanding input requests, expire stale state, and use idempotency or preconditions for writes. Never trust a client-supplied response merely because its schema is valid.",
          "Record only what the audit requires. A consent log may need server identity, action, timestamp, and decision; it rarely needs the complete free-text input. Define deletion and redaction behavior before collecting data.",
        ],
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-elicitation", "mcp-mrtr", "mcp-security", "mcp-tasks"],
    practice: {
      title: "Design a safe missing-input flow",
      brief: "A deployment tool needs a region and then an external enterprise login.",
      steps: [
        "Use form mode for a bounded region choice with accept, decline, and cancel.",
        "Use URL mode for the login and show the exact destination origin.",
        "Define requestState lifetime, retry ID behavior, and idempotency.",
        "Write the audit record and the fields that must not be stored.",
      ],
      evidence: ["Form schema", "URL consent screen text", "Retry state machine", "Data-minimization rule"],
      safety: "Never place a real secret in a form-mode example or course artifact.",
    },
    check: {
      question: "A server needs an API key from the user. Which MCP elicitation design is permitted?",
      options: [
        "Ask for it in a form-mode password field",
        "Ask the model to infer it from context",
        "Return it in requestState",
        "Use URL mode for an out-of-band sensitive flow with visible destination and consent",
      ],
      correctIndex: 3,
      explanation: "Form mode must not collect secrets. URL mode keeps the sensitive exchange outside the MCP client.",
    },
    takeaway: "MRTR makes missing input explicit; elicitation keeps the human in control only when mode, consent, validation, and retries are designed together.",
  },
  {
    slug: "transports-json-rpc",
    order: 9,
    unitId: "unit-3",
    minutes: 55,
    title: "JSON-RPC over stdio and Streamable HTTP",
    summary: "Keep one data protocol intact across a local process boundary or a remote HTTP boundary.",
    objective: "Choose and verify the correct transport, framing, logging channel, and network controls for a deployment.",
    conceptIds: ["json-rpc", "stdio", "streamable-http", "http-headers", "http-parameter-headers", "http-sse"],
    interactive: "envelope",
    sections: [
      {
        heading: "The same message, different channel",
        body: [
          "MCP messages follow JSON-RPC 2.0: requests have IDs and expect responses, notifications do not expect responses, and errors use the JSON-RPC error shape. MCP adds method semantics and required metadata without changing those basic categories.",
          "The supported standard transports are stdio and Streamable HTTP. Custom transports can exist, but they must document connection establishment, framing, and cancellation well enough to interoperate. A vendor-specific WebSocket example is not automatically a standard MCP transport.",
        ],
      },
      {
        heading: "stdio is a protocol pipe",
        body: [
          "For stdio, the host launches the server process and exchanges one newline-delimited JSON-RPC message per line through standard input and standard output. Nothing except valid protocol frames belongs on stdout. In Python, use logging configured for stderr; in Node, use console.error or another stderr/file sink.",
          "Treat command, executable path, working directory, arguments, and environment variables as code-execution configuration. Pin packages, use absolute paths where required, minimize inherited environment, and explain what local files or commands the process can reach.",
        ],
      },
      {
        heading: "Streamable HTTP is a remote security boundary",
        body: [
          "Current Streamable HTTP sends each JSON-RPC request or notification in a new POST. The 2026-07-28 core defines no client-to-server notification over Streamable HTTP; the notification-POST rule is transport machinery for compatible extensions or custom methods. An accepted notification receives HTTP 202 with no body, while a request receives either one JSON response or a request-scoped SSE stream. There is no protocol session, MCP endpoint GET or DELETE, Mcp-Session-Id, or Last-Event-ID resumption. Every request POST advertises application/json and text/event-stream and carries MCP-Protocol-Version plus Mcp-Method; tools/call, resources/read, and prompts/get also carry Mcp-Name. Mirrored header values must match the body or the server returns HeaderMismatch.",
          "Keep those mandatory transport headers separate from x-mcp-header tool-parameter annotations. A server may annotate an input property for header mirroring; a conforming Streamable HTTP client must implement the annotation and must exclude a tool whose annotation is malformed or unsupported. Optional server use does not make client handling optional.",
          "The older standalone HTTP+SSE transport is deprecated. Do not label every appearance of SSE as legacy: SSE can still be a streaming mechanism inside Streamable HTTP. The deprecated item is the earlier transport design, not the web standard itself.",
        ],
        callout: {
          tone: "caution",
          title: "Transport downgrade",
          body: "If a tutorial configures a legacy SSE endpoint, do not copy it into a new server. Find the host’s current Streamable HTTP configuration and verify the negotiated protocol trace.",
        },
      },
    ],
    figureIds: ["inspector-protocol"],
    sourceIds: ["mcp-spec-overview", "mcp-transports", "mcp-stdio", "mcp-streamable-http", "mcp-build-server", "mcp-deprecated", "mcp-inspector"],
    practice: {
      title: "Choose a transport and prove the boundary",
      brief: "Compare a local private-file tool with a shared remote issue-tracker service.",
      steps: [
        "Choose stdio or Streamable HTTP for each case and justify it.",
        "List process or network configuration that must be pinned.",
        "Define where logs go and how secrets enter without appearing in output.",
        "Specify connection, malformed-message, timeout, and cancellation tests.",
      ],
      evidence: ["Transport decision record", "Configuration contract", "Logging rule", "Failure matrix"],
      safety: "Bind development HTTP servers to loopback unless remote access is explicitly required and protected.",
    },
    check: {
      question: "Why can console.log break a stdio MCP server?",
      options: [
        "stdout carries protocol frames, so ordinary log text corrupts the channel",
        "JSON-RPC forbids logs everywhere",
        "The model reads every console message as a tool",
        "Streamable HTTP requires stderr",
      ],
      correctIndex: 0,
      explanation: "In stdio, stdout is the transport. Logs belong on stderr or another dedicated sink.",
    },
    takeaway: "Transport choice changes deployment and threat boundaries, but the JSON-RPC contract and evidence discipline remain the same.",
  },
  {
    slug: "flow-control",
    order: 10,
    unitId: "unit-3",
    minutes: 50,
    title: "Subscriptions, progress, cancellation, caching, and pagination",
    summary: "Make changing, long, or large operations observable without rebuilding hidden connection state.",
    objective: "Choose the right cross-cutting pattern for a changing inventory, long request, large list, or cacheable result.",
    conceptIds: ["subscriptions", "progress", "cancellation", "caching", "pagination"],
    sections: [
      {
        heading: "Subscribe explicitly",
        body: [
          "List-changed and resource-updated notifications are opt-in. A client opens subscriptions/listen with filters. The first stream message must be notifications/subscriptions/acknowledged; its io.modelcontextprotocol/subscriptionId equals that listen request’s JSON-RPC ID, and every later notification on the stream carries the same value. Cancellation closes the subscription.",
          "When the server initiates a graceful shutdown of a subscriptions/listen stream, it should send a successful completion result carrying the standard result and subscription metadata before closing. Abrupt transport loss remains a different failure case and still requires reconnect and re-read logic.",
          "Notifications signal that something changed; they should not silently replace the authoritative list or resource. Re-list or re-read, apply authorization again, and tolerate duplicates or a reconnect gap.",
        ],
      },
      {
        heading: "Report progress; cancel cooperatively",
        body: [
          "A request can carry a progress token, letting the server report meaningful progress. A server may send no progress notifications; once it sends one, the numeric progress value must increase with every later notification. A human-readable message is recommended when useful, and unknown totals should remain honest. Progress is not a heartbeat and should not flood the client.",
          "Cancellation is cooperative and transport-specific. Over stdio the client sends notifications/cancelled; for a Streamable HTTP request with an SSE response, the client closes that response stream and no cancellation notification is required. The server should stop when possible, release resources, and avoid partial writes. If completion wins the race first, the ordinary response is valid; a response arriving after cancellation should be ignored.",
        ],
      },
      {
        heading: "Bound lists and reuse results",
        body: [
          "Cursor pagination prevents one list response from becoming an unbounded context or memory load. Treat cursors as opaque, maintain stable ordering where possible, and test empty and terminal pages. Test for the presence of nextCursor rather than its truthiness: an empty string is a valid cursor.",
          "Complete results from server/discover, tools/list, prompts/list, resources/list, resources/templates/list, and resources/read must include ttlMs and cacheScope. Public and private are access semantics, not merely performance hints. Do not cache a user-specific or authorization-sensitive response as public, and do not reuse a result beyond its advertised lifetime without revalidation.",
        ],
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-subscriptions", "mcp-subscriptions-clarification", "mcp-progress", "mcp-cancellation", "mcp-caching", "mcp-pagination", "mcp-resources", "mcp-tools"],
    practice: {
      title: "Design four bounded flows",
      brief: "Specify one changing resource, one long import, one paginated list, and one cacheable discovery result.",
      steps: [
        "Write subscription filters, acknowledgement, notification, and re-read steps.",
        "Define progress units and cancellation cleanup for the import.",
        "Define opaque cursor and stable-order behavior for the list.",
        "Set TTL and cache scope for discovery and justify both.",
      ],
      evidence: ["Four sequence sketches", "Reconnect behavior", "Race-condition note", "Privacy-aware cache policy"],
      safety: "A cancelled write may have partially executed; design compensation and verification instead of assuming rollback.",
    },
    check: {
      question: "A resources/updated notification arrives. What should the client usually do?",
      options: [
        "Treat the notification body as the complete new resource",
        "Re-read the resource through the authorized resources/read path",
        "Restart every connected server",
        "Ignore authorization because the subscription was already opened",
      ],
      correctIndex: 1,
      explanation: "The notification indicates change; a fresh authorized read obtains the current content.",
    },
    takeaway: "Explicit streams, bounded pages, honest progress, cooperative cancellation, and scoped caches keep stateless MCP usable at scale.",
  },
  {
    slug: "authorization",
    order: 11,
    unitId: "unit-3",
    minutes: 65,
    title: "Authorization for remote MCP servers",
    summary: "Use OAuth discovery, resource indicators, PKCE, constrained scopes, and current registration patterns without passing tokens through.",
    objective: "Trace and review a remote authorization flow from 401 discovery to an audience-bound tool call.",
    conceptIds: ["authorization", "auth-discovery", "client-registration", "dcr", "enterprise-auth"],
    sections: [
      {
        heading: "Separate the protected resource and authorization server",
        body: [
          "Authorization is optional in MCP overall. A Streamable HTTP implementation that offers authorization should follow MCP’s OAuth-based authorization specification; a stdio implementation should obtain credentials from its environment instead of using this browser flow.",
          "A protected MCP server can answer an unauthorized request with 401 and point to Protected Resource Metadata. The client reads that document to learn the resource identity, authorization servers, and supported scopes, then reads authorization-server metadata for the authorization and token endpoints.",
          "The browser authorization code flow uses PKCE. The client includes a resource indicator so the resulting access token is intended for the MCP server. The client validates the authorization response against the recorded issuer. The MCP server validates the access token under OAuth resource-server rules, including that it was issued specifically for this MCP server as its intended audience, and rejects invalid, expired, or insufficient-scope tokens.",
        ],
      },
      {
        heading: "Register current clients intentionally",
        body: [
          "A client may be pre-registered or use a Client ID Metadata Document when supported. Dynamic Client Registration remains in the 2026-07-28 specification only as deprecated compatibility; new designs should follow the current registration path and each authorization server’s policy.",
          "Older tutorials, including otherwise useful official examples, may still walk through DCR. Preserve them as migration evidence, not as an unqualified recommendation. Test the actual authorization server and host because support varies.",
        ],
        callout: {
          tone: "current",
          title: "Protocol correction",
          body: "Dynamic Client Registration was deprecated in 2026-07-28 in favor of Client ID Metadata Documents. Course examples call this out wherever an older source still demonstrates DCR.",
        },
      },
      {
        heading: "Tokens belong to their audience",
        body: [
          "An MCP server must not accept a token meant for another service or pass the client’s token through to an upstream API. Token passthrough breaks audience boundaries, hides which service used the credential, and can turn one compromised server into access elsewhere.",
          "When a call needs a scope the current token lacks, the server can reject it with an insufficient-scope challenge. A capable host can explain the additional authority, obtain explicit user approval, repeat authorization with the challenged scope, and retry only after a new token is available. Clients that do not support this step-up path should leave the write unavailable rather than broadening the original grant silently.",
          "Acquire an upstream credential through an explicit server-side flow, request the minimum scopes, keep refresh tokens protected, and log authorization decisions without logging bearer values. For machine-to-machine or enterprise-managed deployments, negotiate the relevant extension rather than pretending user OAuth fits every case.",
        ],
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-auth", "mcp-auth-security", "mcp-security", "mcp-deprecated", "mcp-auth-extensions", "github-openai-mcpkit", "openai-codex-mcp"],
    practice: {
      title: "Audit an OAuth sequence",
      brief: "Review a remote issue server from discovery through one scoped call.",
      steps: [
        "Trace 401, protected-resource metadata, authorization-server metadata, browser consent, code exchange, and request.",
        "Identify client registration method and reject a silent DCR assumption.",
        "Verify resource indicator, issuer, audience, scopes, expiry, and redirect URI.",
        "Show how the server acquires any upstream credential without token passthrough.",
      ],
      evidence: ["Authorization sequence", "Token validation checklist", "Scope map", "No-passthrough design"],
      safety: "Use redacted tokens or decoded synthetic claims. Never store a live bearer token in course evidence.",
    },
    check: {
      question: "Why must an MCP server validate a token’s audience?",
      options: [
        "To make the token last longer",
        "To let the server forward the token upstream",
        "To ensure the token was issued for this protected resource rather than another service",
        "To avoid using TLS",
      ],
      correctIndex: 2,
      explanation: "Audience validation prevents a token intended for one resource from being replayed against another.",
    },
    takeaway: "Remote MCP authorization is an audience-bound OAuth resource flow; it is not a license to relay tokens or broaden scopes.",
  },
  {
    slug: "security",
    order: 12,
    unitId: "unit-3",
    minutes: 70,
    title: "Threat-model the whole MCP path",
    summary: "Defend against prompt injection, confused deputies, token misuse, SSRF, local-code risks, and overpowered tools.",
    objective: "Produce a threat model with enforced mitigations, verification evidence, and incident boundaries for one MCP deployment.",
    conceptIds: ["security", "state-handles", "approvals", "authorization", "participants"],
    interactive: "risk-review",
    sections: [
      {
        heading: "Threats cross layers",
        body: [
          "A hostile resource can persuade a model to call a valid tool. A malicious server can describe a destructive tool as read-only. An authorization proxy can become a confused deputy. A remote URL can target internal services. A local package can inherit credentials and filesystem access. None of these failures is prevented by valid JSON-RPC.",
          "Build a threat model around assets, actors, entry points, trust boundaries, and abuse cases. Include the user, model, host, client, server, upstream APIs, package supply chain, registry or marketplace, network infrastructure, logs, and stored task or authorization state.",
        ],
      },
      {
        heading: "Use layered, testable controls",
        body: [
          "Minimize installed servers and exposed tools. Pin and verify packages. Run local processes with the least filesystem, environment, and network access. Require explicit approval for consequential calls. Constrain schemas, normalize paths, validate URLs and redirects, enforce authorization and audience, rate-limit, cap response sizes, and make writes idempotent or reversible.",
          "For remote servers, prevent DNS rebinding and SSRF, validate Origin where applicable, use TLS, and bind local listeners to loopback. For authorization, prevent token passthrough and open redirects. For explicit state handles, task IDs, or requestState, use unpredictable values, protect integrity, bind them to the authorized subject, re-authorize every request, and expire them. A handle names state; it is not permission by itself.",
        ],
      },
      {
        heading: "Evidence beats a safety label",
        body: [
          "Test a malicious tool description, prompt injection in a resource, path traversal, oversized content, invalid schema, replayed token, wrong audience, redirect to a private address, duplicate write, cancellation race, and upstream timeout. Record which deterministic control blocks each case.",
          "Design incident response before release: disable one tool or server without taking down the host, revoke credentials, preserve redacted traces, identify affected operations, and restore from known-good configuration. A kill switch that has never been exercised is only a hope.",
        ],
        callout: {
          tone: "caution",
          title: "Consent fatigue is a vulnerability",
          body: "Approving every low-risk read trains users to approve the dangerous write. Group predictable reads, escalate writes and sensitive disclosures, and show exact target, scope, and effect at the decision point.",
        },
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-security", "mcp-auth-security", "mcp-auth", "mcp-tools", "mcp-elicitation", "github-mcp-server"],
    practice: {
      title: "Run a twelve-case adversarial review",
      brief: "Apply the course threat matrix to your proposed server or a synthetic design.",
      steps: [
        "List assets, actors, entry points, and trust boundaries.",
        "Run or simulate twelve abuse cases spanning data, transport, auth, tools, and supply chain.",
        "Map each case to an enforced control and observable failure signal.",
        "Exercise disable, revoke, investigate, and recover procedures.",
      ],
      evidence: ["Threat model", "Twelve-case results", "Control-to-test matrix", "Incident runbook"],
      safety: "Use a sandbox and synthetic credentials. Do not probe systems you do not own or have explicit permission to test.",
    },
    check: {
      question: "Which statement is a valid MCP security conclusion?",
      options: [
        "A tool with a read-only annotation cannot write",
        "A registry namespace proves the current package is safe",
        "A user approval removes the need for server-side authorization",
        "Protocol validity and security are separate; authority must be minimized and enforced at every boundary",
      ],
      correctIndex: 3,
      explanation: "MCP messages can be perfectly valid while the capability or surrounding system is unsafe.",
    },
    takeaway: "Secure MCP comes from least authority, hostile-input assumptions, layered enforcement, and rehearsed recovery—not from the protocol name.",
  },
  {
    slug: "build-server",
    order: 13,
    unitId: "unit-4",
    minutes: 75,
    title: "Build a small server contract-first",
    summary: "Implement the thinnest useful capability with a current Tier 1 SDK, deterministic validation, fixtures, and Inspector evidence.",
    objective: "Build and test one read resource, one read tool, one bounded write tool, and one user prompt without exposing production data.",
    conceptIds: ["sdk", "tools", "resources", "prompts", "inspector", "stdio"],
    sections: [
      {
        heading: "Pin the current implementation surface",
        body: [
          "Choose a currently supported SDK and pin its version. The official SDK page separates support tiers by feature completeness, protocol support, and maintenance commitment; a Tier 1 SDK is the best-supported teaching baseline, not a security guarantee. Read that SDK’s version-specific guide instead of copying a generic snippet from an old blog post.",
          "Start with a capability contract and fixture data. The course uses the current official Python quickstart shape as one path, requiring Python MCP SDK 2.0.0 or higher. TypeScript is equally valid when its current SDK and transport APIs are pinned and tested.",
        ],
        code: {
          label: "Current Python learning environment",
          language: "shell",
          value: `uv init mcp-course-server
cd mcp-course-server
uv venv
uv add "mcp[cli]"

# Keep secrets out of source and stdout.
# Run the current server entry point using the pinned project environment.`,
        },
      },
      {
        heading: "Keep handlers thin",
        body: [
          "Schema validation, authorization, and business preconditions happen before side effects. The handler calls a small domain function, converts the result into declared content and structured data, and maps expected failures into stable error shapes. It does not let a model-generated argument become a shell command or raw SQL fragment.",
          "For stdio, never print ordinary logs to stdout. Keep stderr structured and redact secrets. Close files, network clients, and database handles deterministically so a host restart does not leave orphaned work.",
        ],
      },
      {
        heading: "Test outside the model",
        body: [
          "Unit-test the domain functions and schemas. Then use Inspector or its CLI to discover and call every primitive with normal, boundary, invalid, unauthorized, conflicting, and upstream-failure cases. Compare structured output to the declared schema.",
          "Only after this layer is stable should a host and model choose the tool. Keep the exact package lock, protocol trace, test output, and figure-free text evidence in the capstone packet so another learner can reproduce the result.",
        ],
      },
    ],
    figureIds: ["inspector-settings", "inspector-tools"],
    sourceIds: ["mcp-build-server", "mcp-sdk", "mcp-inspector", "github-official-servers"],
    practice: {
      title: "Build the CourseOps server slice",
      brief: "Use synthetic course data to expose a curriculum resource, a read tool, a bounded status-update tool, and a review prompt.",
      steps: [
        "Pin SDK and runtime versions and write a capability manifest first.",
        "Implement fixtures and pure domain functions before MCP handlers.",
        "Add schemas, read-only credentials, a dry-run write, stable errors, and stderr logging.",
        "Run direct tests plus Inspector normal and expected-failure calls.",
      ],
      evidence: ["Lockfile", "Capability manifest", "Automated tests", "Inspector trace bundle"],
      safety: "Use a disposable fixture directory; the write tool must default to dry-run until its precondition is proven.",
    },
    check: {
      question: "What should come before connecting a new server to a model-driven host?",
      options: [
        "Direct schema, handler, failure, and Inspector tests against fixtures",
        "A broad production credential",
        "A registry listing",
        "A promise that the model will only call safe tools",
      ],
      correctIndex: 0,
      explanation: "Direct deterministic tests isolate the server contract before model selection adds another variable.",
    },
    takeaway: "Build the smallest pinned capability, test every contract directly, and add model selection only after the server is independently sound.",
  },
  {
    slug: "build-client",
    order: 14,
    unitId: "unit-4",
    minutes: 70,
    title: "Build a client that keeps control",
    summary: "Manage servers, discovery, model-facing schemas, approvals, results, retries, and failures without turning the model into a transport.",
    objective: "Implement or specify a client loop that validates every proposed tool call against negotiated capabilities and host policy.",
    conceptIds: ["sdk", "discovery", "tools", "resources", "prompts", "approvals"],
    sections: [
      {
        heading: "The client owns the connection",
        body: [
          "A client configures a transport and includes identity and capabilities in every request. It may call server/discover to retrieve supported versions, capabilities, and self-reported server information, or invoke an RPC inline and handle UnsupportedProtocolVersionError. It handles pagination, caching, notifications, retries, and cleanup. The model never writes raw JSON-RPC to a server.",
          "Normalize server schemas into the model provider’s tool format without dropping constraints. Namespace tools when multiple servers can expose the same name, and preserve the originating server for every call and result.",
        ],
      },
      {
        heading: "A tool loop is a policy loop",
        body: [
          "When a model proposes a tool, the host validates server identity, tool name, schema, scope, target, and current user intent. It decides whether to deny, approve automatically under a narrow read policy, ask the user, or require an external workflow. Only then does the client call the server.",
          "The returned content is untrusted input to the next model turn. Preserve resultType, content, structuredContent, isError, and result _meta, plus content-block or source annotations. Preserve application-defined citation or truncation metadata when present, but do not pretend those are generic MCP fields. Never concatenate tool output into a higher-priority instruction channel.",
        ],
      },
      {
        heading: "Design for partial failure",
        body: [
          "One server can be slow, unavailable, unauthorized, incompatible, or malicious while others remain healthy. Time out independently, isolate process crashes, surface which server failed, and avoid retrying non-idempotent writes automatically.",
          "Evaluate selection and execution separately: did the model choose the correct capability, and did the capability execute correctly? A single end-to-end success rate hides which layer to improve.",
        ],
        callout: {
          tone: "practice",
          title: "Client invariant",
          body: "No model proposal reaches a server until deterministic code has resolved the exact server, validated the exact schema, and applied the exact host policy.",
        },
      },
    ],
    figureIds: ["inspector-protocol"],
    sourceIds: ["mcp-build-client", "mcp-architecture", "mcp-discovery", "mcp-tools", "mcp-security"],
    practice: {
      title: "Write a policy-aware client loop",
      brief: "Connect the CourseOps server and a second read-only server without giving either shared ambient authority.",
      steps: [
        "Create separate client records and discovered-capability caches.",
        "Namespace tool identities and convert schemas without weakening them.",
        "Implement deny, safe-read, confirm-write, timeout, and incompatible-version paths.",
        "Test wrong server, wrong tool, invalid arguments, hostile result, and duplicate-write retry.",
      ],
      evidence: ["Client state diagram", "Policy table", "Layered test results", "Redacted failure traces"],
      safety: "Never retry a consequential operation unless idempotency or a verified precondition makes repetition safe.",
    },
    check: {
      question: "Who should convert a model’s proposed tool use into an MCP tools/call request?",
      options: [
        "The model directly",
        "Deterministic host/client code after schema and policy validation",
        "The resource server",
        "Any connected server with the same tool name",
      ],
      correctIndex: 1,
      explanation: "The host and client retain connection and policy control; the model proposes rather than executes protocol traffic.",
    },
    takeaway: "A robust MCP client is an isolation and policy component, not a transparent pipe between a model and arbitrary servers.",
  },
  {
    slug: "host-integrations",
    order: 15,
    unitId: "unit-4",
    minutes: 65,
    title: "Connect Claude, OpenAI, Codex, and Gemini",
    summary: "Translate one server contract into four host surfaces while preserving transport, authentication, approvals, and support differences.",
    objective: "Configure and verify one server in a chosen host, then explain exactly what would change in the other three.",
    conceptIds: ["host-integration", "approvals", "authorization", "extensions"],
    sections: [
      {
        heading: "Claude: learn the workflow, verify the wire",
        body: [
          "Claude Academy’s introductory and advanced MCP courses provide a useful progression from concepts through server inspection and implementation. Current Claude Code documentation covers local stdio and remote HTTP servers. Claude Desktop installs local servers as desktop extensions, while Claude custom connectors reach remote MCP servers from Anthropic’s cloud infrastructure; those deployment paths have different network and authority boundaries.",
          "Treat Academy commands and screenshots as product guidance at their publication date. Confirm the host’s current documentation, inspect the negotiated protocol version, and never infer that a feature taught in an older Academy module remains recommended in 2026-07-28.",
        ],
      },
      {
        heading: "OpenAI and Codex: two integration layers",
        body: [
          "Codex clients support stdio and Streamable HTTP servers, shared configuration, authentication, tool allow/deny controls, and approval policies. The CLI can add, list, and log in to servers; the ChatGPT desktop surface can manage server configuration in Settings. In Codex CLI 0.149.1, MCP 2026-07-28 support is an under-development feature disabled by default. A modern stdio session requires both client feature enablement and a per-server CODEX_MCP_PROTOCOL_VERSION marker; mcp list/get only prove configuration, not a handshake.",
          "Product compatibility text may still mention initialization or DCR; those are not current-core design recommendations. The course’s OpenAI figure is therefore a reproducible, credential-free Codex configuration capture rather than a proprietary ChatGPT account screenshot or a claim of live negotiation.",
          "The Responses API can call a remote MCP server through an mcp tool definition with a server URL, optional authorization, an allowed-tool boundary, and approval controls. Compatibility with older HTTP/SSE servers does not make that deprecated transport the new-design default. OpenAI’s UI guidance layers interactive components on MCP tool and resource contracts; it does not replace server-side authorization.",
        ],
      },
      {
        heading: "Gemini CLI: inspect inventory and context",
        body: [
          "Google’s current Gemini CLI documentation and codelabs show server configuration in .gemini/settings.json plus /mcp and gemini mcp management surfaces. The course capture uses Gemini CLI 0.56.0 with synthetic local configuration: one pinned reference server reports Connected and the modern-only CourseOps fixture reports Disconnected. That difference is a host observation to investigate with traces, not a diagnosis or proof of 2026-07-28 compatibility.",
          "Gemini CLI 0.56.0 uses a legacy-era MCP SDK path. Google also moved individual Google AI plan access from Gemini CLI to Antigravity CLI in June 2026, while enterprise Code Assist and API-key paths remain distinct. Record the exact product, account path, client version, and SDK/protocol evidence rather than saying only ‘Gemini supports MCP.’",
          "One GitHub codelab exercise places a broad personal access token inline in project settings; use the workflow evidence, but inject credentials securely and never copy that pattern into a repository.",
          "Some codelab examples predate the 2026-07-28 protocol and may show legacy transport endpoints or now-deprecated reference servers. Inspect their dated UI at the linked source to learn the host workflow, but use the current MCP specification and current Gemini CLI documentation to choose a transport and security posture. The course does not redistribute codelab screenshots without explicit image-reuse terms.",
        ],
        callout: {
          tone: "current",
          title: "Cross-host verification rule",
          body: "For every host, capture four separate facts: configured transport, negotiated protocol/capabilities, effective tool allowlist and approvals, and the identity/scopes used by the server.",
        },
      },
    ],
    figureIds: ["gemini-cli-mcp-inventory", "codex-cli-mcp-configuration"],
    sourceIds: ["claude-academy-intro", "claude-academy-advanced", "anthropic-mcp", "claude-desktop-mcp", "claude-remote-mcp", "openai-codex-mcp", "openai-codex-0149-release", "openai-codex-0149-license", "openai-responses-mcp", "openai-apps-ui", "google-gemini-mcp", "google-gemini-mcp-current", "google-gemini-056-release", "google-gemini-056-license", "google-gemini-cli-transition", "google-github-mcp"],
    practice: {
      title: "Make a cross-host integration matrix",
      brief: "Connect a read-only learning server to one host and research the equivalent path in the other three.",
      steps: [
        "Record exact host version, configuration location or API shape, and transport.",
        "Capture the host’s server inventory and effective tools.",
        "Exercise one read-only call and record approval, trace, and result evidence.",
        "Compare local/remote support, authentication, tool filters, approvals, and extensions across all four hosts.",
      ],
      evidence: ["Four-host matrix", "One live host trace", "Approval screenshot or record", "Version and source links"],
      safety: "Begin with a read-only synthetic server. Do not copy credentials between hosts or commit their configuration.",
    },
    check: {
      question: "A Google codelab shows a legacy SSE server URL. What should a new 2026-07-28 implementation do?",
      options: [
        "Copy it because the page is official",
        "Replace the MCP protocol with WebSockets",
        "Use the codelab for host workflow, then verify and implement the current Streamable HTTP transport",
        "Assume Gemini does not support MCP",
      ],
      correctIndex: 2,
      explanation: "Official educational sources can age. The current normative specification governs new protocol design.",
    },
    takeaway: "Host UX varies; transport, capabilities, authority, approvals, and evidence are the stable comparison dimensions.",
  },
  {
    slug: "practitioner-patterns",
    order: 16,
    unitId: "unit-4",
    minutes: 65,
    title: "Practitioner patterns across real contexts",
    summary: "Learn from GitHub projects and issue histories without turning popularity, anecdotes, or example code into universal evidence.",
    objective: "Adapt one MCP pattern to software, research, teaching, operations, or personal knowledge work with an explicit evidence boundary.",
    conceptIds: ["tools", "resources", "prompts", "security", "operations"],
    sections: [
      {
        heading: "Software and operations",
        body: [
          "GitHub’s first-party MCP server demonstrates toolsets, read-only mode, and narrowly scoped configuration. Its dynamic toolset discovery is beta for supported local deployments and is unavailable in the Remote GitHub MCP Server. In issue 1683, one user reported token-scope, project-context, and verbose-interaction friction; the thread is a design tension, not prevalence, and later roots suggestions are now historical. Discussion 1802 documents GitHub’s own scope-challenge and tool-filtering implementation, not a universal MCP feature.",
          "Issue 1314 provides a second bounded case: one Docker MCP Toolkit setup could read but received 403 on writes, and later maintainer context tied step-up scopes to client support. The lesson is that connection, discovery, and reads do not prove effective write authorization. For operations, combine read-only diagnosis with approval-gated remediation instead of granting every administrative action.",
        ],
      },
      {
        heading: "Research, teaching, and knowledge work",
        body: [
          "Research and knowledge-work issues show different failure layers. In zotero-mcp issue 283, one large-library setup linked cross-encoder reranking to a 120-second client timeout while a disabled-reranker fallback returned quickly. In Obsidian MCP Plugin issue 268, one loopback deployment stayed visibly Running while ordinary reads hung until restart. These single reports motivate layered timing and health probes; they do not establish general product performance.",
          "Teaching and operations reveal capability and deployment gaps. Canvas LMS MCP issue 124 documents a New Quizzes workflow that had to fall back to direct APIs because the MCP surface lacked needed write tools. kagent issue 1272 traces one sidecar deployment’s intermittent startup failure to timeout propagation. Across contexts, record exact revision, environment, source IDs, parameters, and limitations so a polished answer does not erase how it was produced.",
        ],
      },
      {
        heading: "Read GitHub evidence correctly",
        body: [
          "A maintained example proves an implementation exists; it does not prove it fits your threat model. An issue proves one reporter observed a problem under stated conditions; it does not establish prevalence. Stars indicate attention, not reliability. A closed issue may document a fix, a workaround, a duplicate, or simply a changed scope.",
          "Use repository code, release notes, issues, discussions, and reproducible demos as different evidence types. Pin the commit or release when a behavior matters, reproduce it in your environment, and label any generalization as an inference.",
        ],
        callout: {
          tone: "practice",
          title: "Context adaptation rule",
          body: "Change the capability surface for the context; do not merely rename the same overpowered generic tools ‘research,’ ‘teaching,’ or ‘business.’",
        },
      },
    ],
    figureIds: [],
    sourceIds: ["github-mcp-server", "github-experience-tool-scope", "github-experience-write-auth", "github-experience-scope-challenges", "github-experience-research-timeout", "github-experience-knowledge-health", "github-experience-ops-timeout", "github-experience-teaching-gap", "github-official-servers", "github-inspector", "github-openai-mcpkit", "google-github-mcp"],
    practice: {
      title: "Write five context cards",
      brief: "Adapt one server idea to software, research, teaching, office operations, and personal knowledge.",
      steps: [
        "For each context, name the job, user, data, read capabilities, write capabilities, and prohibited capability.",
        "Choose tools, resources, and prompts by their actual interaction model.",
        "Add approval, evidence, privacy, and failure requirements.",
        "Link each design claim to repository code, documentation, an issue, or your own reproducible test.",
      ],
      evidence: ["Five context cards", "Evidence-type labels", "One reproduced behavior", "One bounded inference"],
      safety: "Do not use real student, employee, patient, customer, or private-repository data in a learning integration.",
    },
    check: {
      question: "What can a popular GitHub MCP repository establish by itself?",
      options: [
        "That every exposed tool is safe for every organization",
        "That user reports are statistically representative",
        "That a registry should automatically trust it",
        "That the implementation and its public history exist at a particular revision",
      ],
      correctIndex: 3,
      explanation: "Repository evidence supports bounded claims about code and history. Fit, safety, and prevalence need additional evidence.",
    },
    takeaway: "Practitioner evidence becomes useful when implementation, observation, inference, and local verification remain visibly separate.",
  },
  {
    slug: "production-registry",
    order: 17,
    unitId: "unit-5",
    minutes: 70,
    title: "Operate, version, deprecate, and publish",
    summary: "Ship with evaluation, observability, rollback, migration discipline, and an honest understanding of registry metadata.",
    objective: "Produce a release contract that proves behavior, bounds authority, and survives version change or server compromise.",
    conceptIds: ["operations", "versioning", "registry", "legacy-lifecycle", "ping", "roots", "sampling", "logging", "dcr", "http-sse"],
    sections: [
      {
        heading: "Measure each layer",
        body: [
          "Track connection success, discovery compatibility, list latency, tool-selection precision, argument validity, execution success, user denial, authorization failure, downstream error, cancellation, and end-to-end task success separately. A single ‘MCP success rate’ cannot tell you what to fix.",
          "Use structured stderr or OpenTelemetry for new implementations instead of the deprecated protocol logging feature. Redact content and credentials, sample high-volume traces, define retention, and keep a correlation identifier that does not become a bearer secret.",
        ],
      },
      {
        heading: "Migrate with an explicit ledger",
        body: [
          "Migration status matters: initialize/notifications/initialized and ping are removed from the current core, while roots, sampling, protocol logging, Dynamic Client Registration, legacy sampling context flags, and HTTP+SSE remain in the deprecated registry. Deprecated means still specified but scheduled for removal: new implementations should not adopt the feature, and existing ones should follow the named migration path.",
          "Build compatibility tests against the protocol versions you claim. Introduce one version change at a time, keep a rollback path, and update examples, host configurations, threat models, and monitoring together. Never let a green old integration silently define the new protocol contract.",
        ],
      },
      {
        heading: "A registry is metadata, not curation",
        body: [
          "The official MCP Registry is in preview. It standardizes public server metadata and verifies namespaces; it points to packages or remote endpoints. It does not host the packages, support private servers, or promise that server code is secure.",
          "Verify publisher namespace, package source, immutable version, hashes or signatures where available, licenses, capabilities, security posture, and local policy before installation. Downstream marketplaces may add ratings or scanning, but their conclusions still require an evidence date and scope.",
        ],
        callout: {
          tone: "caution",
          title: "Release invariant",
          body: "You must be able to disable one server, revoke its credentials, identify its recent actions, and restore the previous known-good configuration without relying on the compromised server.",
        },
      },
    ],
    figureIds: [],
    sourceIds: ["mcp-deprecated", "mcp-versioning", "mcp-changelog", "mcp-registry", "mcp-sdk", "mcp-security", "github-mcp-server", "github-inspector"],
    practice: {
      title: "Write the production release contract",
      brief: "Prepare your CourseOps server for a controlled pilot.",
      steps: [
        "Pin runtime, SDK, server, protocol, and host versions with rollback artifacts.",
        "Define layer-specific service indicators, redaction, retention, and alerts.",
        "Run compatibility, load, permission, abuse, cancellation, and recovery tests.",
        "Document deprecations, registry evidence, disable/revoke steps, and responsible owner.",
      ],
      evidence: ["Version manifest", "Evaluation report", "Observability/redaction plan", "Rollback and incident drill"],
      safety: "Pilot with least-privilege credentials, a tiny user group, reversible writes, and a rehearsed kill switch.",
    },
    check: {
      question: "What does official MCP Registry namespace verification establish?",
      options: [
        "The publisher controls the claimed namespace",
        "The current server package has no vulnerabilities",
        "Every tool follows least privilege",
        "The server is suitable for private enterprise data",
      ],
      correctIndex: 0,
      explanation: "Namespace verification supports publisher identity. Code security, permissions, and organizational fit require separate checks.",
    },
    takeaway: "Production readiness is the ability to measure, limit, migrate, disable, investigate, and recover—not merely connect.",
  },
  {
    slug: "apps-tasks-capstone",
    order: 18,
    unitId: "unit-5",
    minutes: 100,
    title: "Extensions and the capstone evidence pack",
    summary: "Use Apps, Tasks, and enterprise authorization only through negotiated extension support, then prove a complete MCP system.",
    objective: "Complete a builder or auditor capstone that demonstrates protocol literacy, useful capability design, security, real UI evidence, and reproducibility.",
    conceptIds: ["extensions", "apps", "tasks", "enterprise-auth", "operations", "security"],
    sections: [
      {
        heading: "Extensions are negotiated capabilities",
        body: [
          "Extensions are disabled by default, build on the core protocol, and require explicit support from both sides. They are versioned independently of the 2026-07-28 core: MCP Apps is Stable at the frozen 2026-01-26 specification, Tasks is frozen to Draft revision e434597, and authorization status is frozen to revision fb374c7.",
          "The public client matrix is community-maintained and can be incomplete; it currently omits Tasks. Use it only to discover candidates. Effective support is established by the client’s per-request capabilities, server/discover, current host documentation, and a saved compatibility trace.",
          "Enterprise-Managed Authorization is Stable at the frozen authorization-extension revision; OAuth Client Credentials is Draft. They address deployment cases that user browser OAuth does not fit, but maturity is not interchangeable and neither should be chosen merely to avoid a consent screen.",
        ],
        bullets: [
          "MCP Apps · Stable at specification 2026-01-26 · negotiate io.modelcontextprotocol/ui · provide useful text fallback.",
          "Tasks · Draft · currently augments tools/call only · negotiate io.modelcontextprotocol/tasks on each eligible request.",
          "Enterprise-Managed Authorization · Stable · adopt for a documented enterprise identity policy.",
          "OAuth Client Credentials · Draft · adopt only for a documented machine identity and explicit implementation support.",
        ],
      },
      {
        heading: "Apps and Tasks solve different problems",
        body: [
          "MCP Apps pair a tool with an _meta.ui.resourceUri reference to a ui:// resource. A supporting host reads the text/html;profile=mcp-app resource and renders it in a sandboxed iframe. The app communicates with the host through a JSON-RPC dialect over postMessage. Content Security Policy, requested UI permissions, tool-call proxying, and server authorization remain distinct controls. The ordinary text tool result should still be useful when the component is unavailable. The frozen Apps specification contains legacy initialize examples; translate its Stable extension contract through the current per-request capability and discovery model rather than copying that envelope.",
          "The current Draft Tasks extension augments tools/call only. CreateTaskResult requires resultType task, taskId, status, createdAt, lastUpdatedAt, and ttlMs, which may be null; pollIntervalMs is optional. The client uses tasks/get, tasks/update for requested input, and tasks/cancel. Polling is the default, with optional task notifications. Terminal states are completed, failed, and cancelled.",
        ],
      },
      {
        heading: "Capstone: prove the system",
        body: [
          "Builder track: finish the CourseOps server and client, connect one real host, and optionally add an App or Task only when the use case needs it. Auditor track: select a public server, reproduce its capabilities in Inspector, review code or immutable release evidence, threat-model its deployment, and test it with synthetic data.",
          "Both tracks submit the same evidence classes: fit decision, architecture and data-flow map, version manifest, capability contracts, direct traces, host trace, security tests, source ledger, figure provenance, evaluation results, limitations, and disable/recovery drill. A polished demo without those artifacts is incomplete.",
        ],
        callout: {
          tone: "practice",
          title: "Definition of done",
          body: "A reviewer can reproduce the safe path and the expected failures, trace every factual claim and figure, identify deprecated or extension-only features, and disable the integration without asking the author for hidden knowledge.",
        },
      },
    ],
    figureIds: ["inspector-apps"],
    sourceIds: ["mcp-extensions", "mcp-extension-matrix", "mcp-apps", "mcp-apps-spec", "mcp-tasks", "mcp-tasks-spec", "mcp-auth-extensions", "mcp-auth-extension-status", "mcp-client-credentials", "mcp-enterprise-auth", "openai-apps-ui", "github-mcp-apps-examples", "github-openai-mcpkit", "mcp-security"],
    practice: {
      title: "Submit the MCP evidence pack",
      brief: "Complete either the builder or auditor track and make every safety and correctness claim reviewable.",
      steps: [
        "Freeze the protocol, SDK, server, host, source, and figure versions.",
        "Demonstrate discovery and every primitive directly, then one host-mediated workflow.",
        "Run the security, compatibility, expected-failure, cancellation, and recovery matrices.",
        "Write limitations, deprecated-feature findings, extension support, and next-release criteria.",
      ],
      evidence: [
        "Fit, architecture, and threat-model documents",
        "Contracts, code or audit notes, lockfiles, and tests",
        "Inspector and host traces with redaction",
        "Source, figure, evaluation, limitation, and recovery records",
      ],
      safety: "Use synthetic data and least privilege. Remove or rotate all learning credentials and stop disposable servers after review.",
    },
    check: {
      question: "When may a server return an MCP Tasks result?",
      options: [
        "Whenever an operation takes more than one second",
        "Only when the client declared the Tasks extension capability and the server supports it",
        "Only over the deprecated HTTP+SSE transport",
        "Whenever an MCP App is visible",
      ],
      correctIndex: 1,
      explanation: "Extensions require capability negotiation. A server must not surprise an unsupported client with an extension result shape.",
    },
    takeaway: "Extensions add UI, durability, or enterprise identity only when negotiated; the capstone proves the complete core and its boundaries first.",
  },
] as const satisfies readonly McpLesson[];

export function isMcpLocale(value: string): value is McpLocale {
  return (MCP_LOCALES as readonly string[]).includes(value);
}

export function isMcpLessonSlug(value: string): boolean {
  return MCP_LESSONS.some((lesson) => lesson.slug === value);
}

export function getMcpLesson(slug: string): McpLesson | undefined {
  return MCP_LESSONS.find((lesson) => lesson.slug === slug);
}

export const MCP_TOTAL_MINUTES = MCP_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0);
