# MCP Course 10 research brief

## Release objective

Create an evidence-first, practical course that takes a learner from deciding whether MCP fits a problem through reading the current wire model, designing capabilities, securing and authorizing them, building a reference server and client, connecting real hosts, learning from public implementation experience, operating a deployment, and completing an auditable capstone.

Release snapshot: 2026-08-24. Normative target: MCP 2026-07-28. Course sequence: 10.

## Evidence hierarchy

1. Normative MCP 2026-07-28 specification for protocol claims.
2. Current first-party MCP guides and SDK documentation for implementation guidance.
3. Current Anthropic/Claude, OpenAI, Codex, and Google/Gemini product documentation for host-specific behavior.
4. Claude Academy, OpenAI Academy, and Google codelabs for pedagogy and dated UI workflow evidence.
5. Exact GitHub repositories, issues, and discussions for bounded practitioner observations—not prevalence.

The course exposes this hierarchy in each lesson bibliography and in a separate high-risk claim-to-source map. Every dated product claim is kept distinct from normative protocol behavior.

## Protocol corrections that define the curriculum

- The 2026-07-28 core is stateless and handshake-free. Required protocol version and client capabilities travel in every request; client identity is recommended.
- Servers implement `server/discover`; clients may call it or invoke another RPC and handle an unsupported-version error.
- Complete results from `server/discover`, `tools/list`, `prompts/list`, `resources/list`, `resources/templates/list`, and `resources/read` must include `ttlMs` and `cacheScope`; the runnable CourseOps fixture now asserts this contract.
- Current results use `resultType`; MRTR represents missing user input as `InputRequiredResult` and continues through a new request carrying `requestState` and `inputResponses`.
- Streamable HTTP uses a new POST per message. The current core defines no client-to-server notification over Streamable HTTP, but the transport defines notification-POST mechanics: accepted notifications receive HTTP 202 with no body, while requests receive JSON or request-scoped SSE. Request POSTs carry `MCP-Protocol-Version` and required `Mcp-Method`; calls, reads, and prompt retrieval also carry required `Mcp-Name`. Optional server use of `x-mcp-header` parameter annotations is separate, while conforming clients must implement the annotation and exclude malformed annotated tools. Protocol sessions, endpoint GET/DELETE, `Mcp-Session-Id`, and `Last-Event-ID` resumption are absent.
- `subscriptions/listen` replaces legacy resource subscription flows. The listen request ID becomes the subscription correlation value. A server-initiated graceful shutdown should send a successful completion result before closing.
- Numeric progress must increase after reporting begins. Cancellation is transport-specific.
- Tools use JSON Schema 2020-12, do not automatically dereference remote `$ref` targets, may return any JSON `structuredContent`, and distinguish protocol errors from normal tool-execution errors.
- Authorization is optional overall. HTTP authorization follows MCP's OAuth resource-server flow when offered; stdio credentials come from the environment. Audience binding, no token passthrough, least scope, and explicit scope step-up are taught.
- Explicit state handles are identifiers, not bearer capabilities; authorization is rechecked on every request.
- Extensions are disabled by default, negotiated explicitly, and versioned independently of the core. The course freezes MCP Apps as Stable at its 2026-01-26 specification, Tasks to a pinned Draft revision with a current `tools/call`-only boundary, Enterprise-Managed Authorization as Stable, and OAuth Client Credentials as Draft. The community-maintained support matrix is a discovery aid, not effective compatibility evidence.
- `initialize`/`notifications/initialized` and `ping` are absent from the current core through the breaking revision. `logging/setLevel` and `notifications/roots/list_changed` were removed, while the broader Roots, Sampling, and Logging families remain Deprecated. Legacy resource subscription methods and endpoint GET streaming were replaced by `subscriptions/listen`.
- The August 2026 roadmap is a future-watchlist source only. Prospective webhooks, channels, DPoP, workload identity, server cards, progressive discovery, and Tasks migration are not classified as current core.

## Curriculum and assessment design

- 5 units, 18 lessons, approximately 18 hours.
- 48 status-labelled concepts spanning core specification material, optional capabilities, tooling/practice, negotiated extensions, deprecations, and legacy-version-only concepts.
- Four interactive labs: participant boundaries, current envelope generation, tool-contract design, and risk review.
- Eighteen formative lesson checks with balanced answer positions.
- A separate versioned 18-question scenario-based summative bank with an 80% gate, outcome mapping, explanations, lesson review links, persistent best score, and monotonic pass state within the assessment version.
- A persistent ten-artifact builder/auditor capstone with explicit self-attestation limits and a downloadable evidence-pack template.
- A dependency-free Node.js CourseOps reference under `examples/mcp-courseops`, including a pinned current-protocol stdio server, policy-aware client, synthetic fixture, lockfile, direct/expected-failure traces, eight automated tests, and a deterministic checksum-published archive.

## Visual evidence method

The release set contains eight genuine UI figures with reproducible responsive derivatives, observation dates, immutable source or capture provenance, asset-level rights records, dimensions, SHA-256 hashes, alternative text, teaching points, and bounded captions.

- 6 direct MCP Inspector UI captures.
- 1 course-authored Gemini CLI 0.56.0 host-inventory and live-status capture, explicitly bounded as legacy-era rather than 2026-07-28 wire evidence.
- 1 course-authored Codex CLI 0.149.1 configuration capture, explicitly bounded as experimental configuration rather than a handshake.
- Two Google and two OpenAI image candidates were audited and withheld because no explicit image-reuse license was established.

Legacy Inspector controls and traces are visibly labelled. The heterogeneous-rights manifest records the immutable Inspector revision and CC BY 4.0 scope, exact Gemini/Codex client releases and licenses, raw-capture hashes, deterministic privacy crops, derivative recipe, privacy reviews, protocol-evidence classes, and withheld-asset decisions in `public/courses/mcp/figure-manifest.json`, `NOTICE.md`, and `outputs/mcp-host-ui-capture-provenance.md`.

## Practitioner evidence selection

Exact GitHub records cover multiple contexts:

- Software collaboration and authorization: GitHub MCP Server issues 1683 and 1314, discussion 1802.
- Research: zotero-mcp issue 283.
- Personal knowledge: Obsidian MCP Plugin issue 268.
- Operations: kagent issue 1272.
- Teaching: Canvas LMS MCP issue 124.

Each is presented as one report, repository behavior, or maintainer announcement under stated conditions. The course does not infer prevalence from stars, issue state, or one user's experience.

## Publication-rights boundary

The six MCP documentation figures with verified CC BY 4.0 coverage and two independently captured, rights-reviewed provider terminal figures are publicly shipped. The four uncleared Google/OpenAI documentation candidates remain outside the public tree and are recorded as withheld. Product interfaces and plan availability can change before the normative protocol does; exact client versions, source observation dates, protocol-evidence class, and direct links therefore remain part of the release contract.

## Acceptance gates

- Content graph has no missing source, figure, concept, unit, lesson, or assessment references.
- Course 10 integration is additive and preserves the complete Course 6 GitHub loader, structured-data parts, catalog, footer, SEO, and sitemap contracts.
- Source links and original asset hashes verify.
- The CourseOps example tests and client trace pass.
- MCP-scoped lint/type checks, course validator, production build, and browser QA pass, with any unrelated shared-worktree failures reported separately.
