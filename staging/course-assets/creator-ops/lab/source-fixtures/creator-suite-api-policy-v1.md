---
fixture_id: SRC-POL-001
publisher: Northstar Lab (fictional)
document_date: 2025-11-01
source_type: synthetic legacy API policy
license: CC0-1.0
locator: source-fixtures/creator-suite-api-policy-v1.md#publish-behavior
synthetic: true
---

# Legacy publish policy (fictional API v1)

<a id="publish-behavior"></a>

## Publish behavior

The fictional v1 publish operation accepts a client-generated `request_id` for logging but does not enforce idempotency. A successful operation returns `201` with a `publication_id`. A validation failure returns `422` before any publication is created.

If the connection closes or times out after submission, the client cannot infer whether a publication was created. The safe control is to stop automatic retries, search the local mock publication ledger by `request_id` and `content_digest`, and route unresolved cases to manual reconciliation. Repeating the request may create a duplicate.

## Scope and reuse

This policy applies only to the Course 16 v1 mock scenarios. It is not a description of any real API. This entire fixture is original synthetic course material under `CC0-1.0`.
