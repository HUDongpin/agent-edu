# GitHub required-check and stability evidence

The release needs both job names—`quality` and `smoke-chromium`—configured as
required checks, plus three consecutive green runs on the integration/main
history that contains the release candidate.

## Branch protection

Read-only precheck `docs/release/evidence/external-readiness-precheck-20260821.json`
observed `main` at `67e1beba98fee926925b254a152a1a1de1176376` with
`protected: false`, zero applicable rules, and the branch-protection endpoint
returning `not protected`. Therefore neither required job is currently
enforced. The precheck changed no repository setting and leaves the formal gate
pending; a later independently reviewed ruleset/protection record is still
required.

- Protected branch:
- Ruleset/branch-protection record ID:
- `quality` required: yes / no
- `smoke-chromium` required: yes / no
- Administrators/bypass behavior reviewed:
- Checked at (UTC):
- Reviewer reference:

A green workflow run does not prove that GitHub requires it. Record this as a
separate `requiredChecks` evidence item. A passing record must name `main`, a
stable ruleset/branch-protection ID, and independently confirm that both
`quality` and `smoke-chromium` are required. Its evidence ref is
`github-ruleset:<rulesetId>`; a workflow run ID cannot substitute for it.

## Consecutive stable runs

| Sequence | Run ID | Attempt | Candidate commit | Integration branch | Workflow blob SHA | `quality` | `smoke-chromium` | Completed at UTC | Result |
|---:|---|---:|---|---|---|---|---|---|---|
| 1 |  | 1 |  |  |  | pending | pending |  | pending |
| 2 |  | 1 |  |  |  | pending | pending |  | pending |
| 3 |  | 1 |  |  |  | pending | pending |  | pending |

### Report-only repeatability precheck

Three unique attempt-1 runs completed green on the same report-only integration
head and unchanged workflow definition. The sanitized record is
`docs/release/evidence/report-only-ci-repeatability-precheck-20260821.json`.

| Sequence | Run ID | Event | Report-only head | `quality` | `smoke-chromium` | `compatibility` | Completed at UTC |
|---:|---|---|---|---|---|---|---|
| 1 | `32505449571` | pull request | `0b143664784cf8c48dabdabacf86ed722c21b84c` | success | success | success | 2026-08-21T16:58:12Z |
| 2 | `32506361214` | workflow dispatch | `0b143664784cf8c48dabdabacf86ed722c21b84c` | success | success | success | 2026-08-21T17:08:37Z |
| 3 | `32506674465` | workflow dispatch | `0b143664784cf8c48dabdabacf86ed722c21b84c` | success | success | success | 2026-08-21T17:12:05Z |

This is pre-promotion repeatability evidence only. It does not populate the
formal table above: `main` still lacks required-check protection, Stage A is
pending on the real Provider path, and the later enforced-CSP final candidate
does not yet exist. The formal three-run sequence starts on that final
candidate after its target is frozen.

The runs must be consecutive and use the same workflow definitions. A rerun that
only turns a flaky failure green restarts the three-run sequence unless the
failure is explained and the underlying cause is fixed. Store public run IDs,
not authenticated, signed, or token-bearing URLs.

The machine record is stricter than this table: array positions must be exactly
1, 2, 3; run IDs must be unique; every `runAttempt` must equal 1; completion
times must increase; and every run must name the frozen candidate commit,
integration branch, and workflow definition SHA from `releaseTarget`. Each
result uses `github-run:<runId>` plus all five target-binding refs. Metadata-only
evidence commits do not change the candidate; any product or workflow change
does and restarts the sequence.

- Overall result: pass / fail
- Evidence sanitization confirmed by:
- Completed at (UTC):
