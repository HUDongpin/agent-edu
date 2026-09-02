---
fixture_id: SRC-REL-002
publisher: Northstar Lab (fictional)
document_date: 2026-02-15
source_type: synthetic API v2 release note
license: CC0-1.0
locator: source-fixtures/creator-suite-api-release-v2.md#idempotency-release
synthetic: true
---

# API v2 release note

<a id="idempotency-release"></a>

## Idempotency and reconciliation

The fictional API v2 adds an `Idempotency-Key` field to publish requests. Within the mock 24-hour replay window, the same key plus the same `content_digest` resolves to the original operation; the same key with a different digest returns a conflict. The v2 mock also supports operation lookup by `operation_id` after an ambiguous response.

These controls are version-specific. They do not change the behavior of the fictional v1 endpoint, guarantee successful publication, or authorize publishing without approval.

## Scope and reuse

This release note applies only to Course 16 mock scenarios marked `api_version: v2`. It is not a description of any real API. This entire fixture is original synthetic course material under `CC0-1.0`.
