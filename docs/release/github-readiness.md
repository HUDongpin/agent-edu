# GitHub required-check and stability evidence

The release needs both job names—`quality` and `smoke-chromium`—configured as
required checks, plus three consecutive green runs on the integration/main
history that contains the release candidate.

## Branch protection

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
