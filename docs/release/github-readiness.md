# GitHub required-check and stability evidence

The release needs all four CI jobs—`quality`, `smoke-chromium`, `compatibility`,
and `published-courses`—plus the manually dispatched, same-SHA `Vercel Preview`
verification configured as required checks. It also needs three consecutive
green runs on the integration/main history that contains the release candidate.

## Branch protection

Read-only precheck `docs/release/evidence/external-readiness-precheck-20260821.json`
observed `main` at `67e1beba98fee926925b254a152a1a1de1176376` with
`protected: false`, zero applicable rules, and the branch-protection endpoint
returning `not protected`. Therefore none of the required checks is currently
enforced. The precheck changed no repository setting and leaves the formal gate
pending; a later independently reviewed ruleset/protection record is still
required.

That historical observation is now superseded for repository-configuration
purposes by the read-only REST and GraphQL observation in
`docs/release/evidence/github-required-checks-observation-20260902.json`.
At `2026-09-02T01:14:04Z`, `main` was protected by rule
`BPR_kwDOT7fvJ84E5_PT`; strict status checks, administrator enforcement, and all
five required contexts were active, while force-pushes and deletions were
disabled. The machine release record deliberately remains pending until the
complete final target is frozen and this evidence can carry its exact candidate,
checkpoint, integration-branch, deployment, and workflow bindings.

- Protected branch:
- Ruleset/branch-protection record ID:
- `quality` required: yes / no
- `smoke-chromium` required: yes / no
- `compatibility` required: yes / no
- `published-courses` required: yes / no
- `Vercel Preview` required: yes / no
- Administrators/bypass behavior reviewed:
- Checked at (UTC):
- Reviewer reference:

A green workflow run does not prove that GitHub requires it. Record this as a
separate `requiredChecks` evidence item. A passing record must name `main`, a
stable ruleset/branch-protection ID, and independently confirm that all five
checks are required. Its evidence ref is
`github-ruleset:<rulesetId>`; a workflow run ID cannot substitute for it.

## Consecutive stable runs

| Sequence | Run ID | Attempt | Candidate commit | Integration branch | Workflow blob SHA | `quality` | `smoke-chromium` | `compatibility` | `published-courses` | `Vercel Preview` | Completed at UTC | Result |
|---:|---|---:|---|---|---|---|---|---|---|---|---|---|
| 1 |  | 1 |  |  |  | pending | pending | pending | pending | pending |  | pending |
| 2 |  | 1 |  |  |  | pending | pending | pending | pending | pending |  | pending |
| 3 |  | 1 |  |  |  | pending | pending | pending | pending | pending |  | pending |

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

For the current hardening PR, `Vercel Preview` is produced by manually
dispatching the existing `CI` workflow on the exact candidate SHA with the
public Preview origin, Vercel deployment ID, and commit SHA. The job crawls the
registry-derived 200 and 404 surface, checks SEO/sitemaps/security headers,
opens every public document in Chromium for sanitized console evidence, and
uploads `vercel-preview-verification.json`. A skipped or absent Preview job is
not a passing conclusion.

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
