# Synthetic source register

All documents in this directory are fictional originals created for Course 16. They are reusable under `CC0-1.0`; their locators are stable relative paths inside this package. The publisher label "Northstar Lab" is fictional and exists only to make source roles easy to distinguish.

| Fixture ID | Source type | Effective date | License | Locator | Safe use |
| --- | --- | --- | --- | --- | --- |
| `SRC-MKT-001` | Product page | 2026-01-10 | CC0-1.0 | `source-fixtures/creator-suite-product-page.md#claim-caption` | Record the marketing claim, not its truth |
| `SRC-MTH-001` | Method note | 2026-01-08 | CC0-1.0 | `source-fixtures/creator-suite-method-note.md#evaluation-caption` | State the measured sample and exclusions |
| `SRC-POL-001` | Legacy API policy | 2025-11-01 | CC0-1.0 | `source-fixtures/creator-suite-api-policy-v1.md#publish-behavior` | Model legacy behavior only |
| `SRC-REL-002` | Versioned release note | 2026-02-15 | CC0-1.0 | `source-fixtures/creator-suite-api-release-v2.md#idempotency-release` | Model API v2 behavior only |

## Required conflict decisions

### Conflict C-01: broad marketing claim versus bounded evaluation

`SRC-MKT-001` says the fictional caption feature is "publication-ready in 97% of clips." `SRC-MTH-001` reports a 97% reviewer-acceptance result only for 100 clean, English, scripted clips and excludes names, numbers, background noise, and non-English speech. The safe synthesis is: "In the synthetic clean-speech evaluation, reviewers accepted 97 of 100 captions without editing." Do not generalize it to all clips, languages, creators, or publication contexts.

### Conflict C-02: legacy publish behavior versus API v2

`SRC-POL-001` says the legacy endpoint has no native idempotency key and that a timeout can be ambiguous. `SRC-REL-002` adds idempotency and operation lookup only to the fictional API v2. The safe synthesis must name the API version. Do not rewrite the legacy policy as if v2 controls were universal or retroactive.

## Provenance rule

For each learner claim, retain `fixture_id`, the exact locator above, the source date, the source type, and the license. When two fixtures differ, preserve both records and document the resolution; do not silently select the more convenient source.
