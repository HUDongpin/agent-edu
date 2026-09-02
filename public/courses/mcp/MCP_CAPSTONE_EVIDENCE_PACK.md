# MCP Course 10 — Capstone Evidence Pack

Protocol baseline: MCP `2026-07-28`<br>
Course assessment version: `2026-07-28-v2`<br>
Course evidence snapshot: `2026-08-24`

This template supports either the builder track (implement a small server and client) or the auditor track (reproduce and review a public server). Completing it is self-attestation, not an independently verified certificate. Remove all secrets and private data before sharing.

## 1. Fit decision

- User and job:
- Why MCP rather than a direct API or ordinary function:
- Minimum capability surface:
- Explicit non-goals:
- Authority introduced:

## 2. Architecture and data flow

Attach a diagram showing the user, model, host, one MCP client per server, servers, upstream systems, transports, credentials, logs, and stored state. For every edge, state what data crosses it and who can persist it.

## 3. Version manifest

| Item | Exact version or immutable revision | Source | Verified date |
| --- | --- | --- | --- |
| MCP protocol | 2026-07-28 |  |  |
| SDK |  |  |  |
| Server |  |  |  |
| Host/client |  |  |  |
| Runtime and lockfile |  |  |  |

## 4. Capability contracts

For every tool, resource, prompt, elicitation, and negotiated extension, record:

- name or URI;
- interaction owner;
- input and output schema;
- authorization and approval rule;
- normal, empty, invalid, unauthorized, conflict, timeout, and upstream-failure behavior;
- evidence returned;
- rollback or compensation for writes.

## 5. Direct protocol evidence

- `server/discover` request/response with current per-request metadata and `resultType`;
- primitive list/read/get/call traces;
- normal and expected-failure traces;
- redaction log;
- note for any Legacy Inspector UI that is retained only as historical evidence.

## 6. Host integration evidence

- host name and exact version;
- configured transport and server identity;
- negotiated protocol and capabilities;
- effective tool allowlist and approval policy;
- one successful read-only workflow;
- one denied or expected-failure workflow.

## 7. Threat model and adversarial tests

Run all 12 named cases below. If one row combines related variants, exercise each variant and retain separate observations in that row.

| Case | Asset or boundary | Enforced control | Expected signal | Observed result |
| --- | --- | --- | --- | --- |
| 1 | Prompt or result injection | Keep returned content in an untrusted data channel | Injection cannot change higher-priority policy |  |
| 2 | Hostile annotations or hidden instructions | Treat annotations as hints; inspect content blocks | No authority or policy elevation |  |
| 3 | Path traversal | Canonicalize and constrain allowed paths | Out-of-scope path rejected |  |
| 4 | Oversized content | Enforce byte, item, and context limits | Bounded rejection or safe truncation signal |  |
| 5 | Schema bypass or unknown fields | Validate JSON Schema and reject extras | Deterministic invalid-params result |  |
| 6 | Wrong audience or token passthrough | Validate audience; never forward client tokens upstream | Request denied without token leakage |  |
| 7 | Redirect, SSRF, or DNS rebinding | Allowlist destinations and revalidate every hop | Internal or disallowed target blocked |  |
| 8 | State-handle replay | Use unpredictable handles and reauthorize each request | Cross-user or expired replay denied |  |
| 9 | Duplicate write | Idempotency or exact-revision guard | At most one intended change |  |
| 10 | Cancellation race | Cooperative cancellation plus post-cancel state check | No hidden late side effect |  |
| 11 | Package or endpoint compromise | Pin immutable provenance and exercise disable path | Compromised integration can be isolated |  |
| 12 | Upstream timeout | Deadline, bounded retry, and clear error mapping | No infinite hang or duplicate effect |  |

## 8. Sources and figures

For every factual claim or reused figure, record title, publisher, direct URL, exact revision where possible, access/observation date, evidence tier, reuse basis, and the bounded claim it supports.

## 9. Evaluation and limitations

Report connection, discovery, selection, argument validity, execution, authorization, user denial, cancellation, and end-to-end task outcomes separately. State sample, environment, missing evidence, and known limitations.

## 10. Disable and recovery drill

- disable one server or tool;
- revoke its credentials;
- identify its recent actions from redacted logs;
- restore known-good configuration;
- verify the old server cannot act;
- record time, owner, failures, and follow-up work.

## Reviewer sign-off (optional)

- Reviewer:
- Review date:
- Evidence inspected:
- Reproduced safe path:
- Reproduced expected failures:
- Corrections required:
- Decision and scope:
