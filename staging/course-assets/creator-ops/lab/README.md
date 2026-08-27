# Course 16 offline lab fixtures

This package is a deterministic, account-free lab for Course 16, "Agent-enabled creator operations." Every name, claim, event, message, policy, identifier, and outcome in this directory is original synthetic material created for the course. Nothing describes a real person, company, product, platform rule, or production API.

## Safety and use boundary

- Work locally. The fixtures require no network access, account, login, paid API, credential, token, or external write.
- Treat `mock://` locators as inert labels. They are not network endpoints.
- Never use a fixture as evidence about a real platform or as permission to publish.
- All fixture content in this directory is dedicated under `CC0-1.0`. No third-party text, media, data, or trademarks are included.
- Timestamps and identifiers are stable so that two learners can compare receipts exactly.

## Package map

| Path | Lab role | Expected learner output |
| --- | --- | --- |
| `source-fixtures/` | Conflicting source claims, scope limits, licenses, and locators | Source register, claim-evidence map, conflict note |
| `synthetic-events.csv` | Anonymous content events, including a bot-like burst and version change | Metric dictionary, anomaly note, measurement receipt |
| `synthetic-feedback.jsonl` | Synthetic questions, objections, corrections, and unsafe instructions | Feedback taxonomy, escalation queue, revision candidates |
| `fault-injections.json` | Six required operational failures | Control decision and structured receipt for every fault |
| `mock-publish-scenarios.json` | Deterministic publish outcomes, including lost-response cases | Reconciliation decision, idempotency evidence, publish receipt |
| `manifest.sha256` | Integrity manifest for every non-manifest file | Verification receipt |

## Suggested offline run

1. Read `source-fixtures/README.md` and register each source by its explicit locator, date, scope, and license.
2. Resolve the two documented conflicts without blending the sources into a stronger claim.
3. Parse `synthetic-events.csv` and `synthetic-feedback.jsonl`; define metrics before interpreting them.
4. Walk every entry in `fault-injections.json`. Record the named `expected_control` and an `expected_receipt` with all required fields.
5. Simulate each entry in `mock-publish-scenarios.json`. A timeout is not evidence of failure: reconcile state before any retry.
6. Verify package integrity from this directory:

```sh
shasum -a 256 -c manifest.sha256
```

## Module and capstone coverage

- Modules 2-3: the source set supports evidence boundaries, licensing, version-sensitive claims, and conflict handling.
- Module 5: all approval and publication scenarios use immutable `content_version` and `asset_digest` values.
- Module 8: mock publishing covers native idempotency, legacy channels, duplicate suppression, timeout-after-commit, and reconciliation.
- Module 9: anonymous events and synthetic feedback support a metric dictionary, qualitative coding, and anomaly review without claiming causality.
- Module 10 and the capstone: the six fault injections provide one auditable control/receipt pair per required failure.

## Completion contract

A fixture run is complete only when the learner can show: (a) a source locator for each material claim, (b) an explicit decision for each conflict, (c) a control and receipt for all six failures, (d) reconciliation evidence for ambiguous publication, and (e) a passing SHA-256 verification. The fixtures demonstrate workflow behavior; they do not prove real-world platform compliance, performance, reach, revenue, or causal impact.
