# Release evidence gates

This directory is the human side of `config/release-readiness.json`. The JSON
file is the machine-readable release decision; these forms define how a person
may create the evidence referenced by that decision.

`npm run release:check` is deliberately **not** part of the ordinary CI quality
job. Product development must continue while native review, real Provider
access, Vercel preview inspection, and GitHub branch protection are pending. A
release candidate, however, remains blocked until this command exits zero.

## Evidence boundary

The repository may contain only a sanitized conclusion and a stable reference:

- a relative path below `docs/release/evidence/`; or
- an opaque ID beginning with `review-record:`, `matrix-record:`,
  `canary-record:`, `billing-record:`, `csp-record:`, `github-run:`, or
  `vercel-deployment:`.

Do not commit credentials, Authorization or Cookie values, signed/bypass URLs,
Prompts, model replies, Provider raw response bodies, screenshots containing
sensitive values, or copied billing-account details. Public canonical
documentation URLs may be recorded only without query parameters.

Relative evidence paths are not labels. The checker resolves each path below
`docs/release/evidence/`, rejects missing files, directories, symlinks, path
escapes, binary/oversized files, and scans the text without echoing a matched
value. An opaque record ID remains an external attestation: its format is
checked here, while the reviewer verifies that the referenced system really
contains the sanitized record.

## Frozen release target and non-self-reference

`releaseTarget` binds every non-pending evidence record to five values, except
the predecessor report-only CSP observation described below:

- `candidateCommitSha` — the frozen product commit being tested;
- `checkpointSha` — the distinct pre-implementation recovery point;
- `integrationBranch` — the branch on which the candidate is exercised;
- `vercelDeploymentId` — the exact preview inspected by people and canaries;
- `workflowDefinitionSha` — the Git blob SHA of `.github/workflows/ci.yml`
  used for all three stable runs.

The candidate commit is deliberately frozen **before** evidence metadata is
filled in. Commits that only add sanitized review IDs, timestamps, release
status, or this documentation are not a new product candidate and must not
replace `candidateCommitSha`; doing so would create an impossible self-reference
where the evidence commit claims to have tested itself before it existed. A
post-candidate commit may only harden the evidence schema/checker or add
sanitized evidence metadata and release documentation. Any change to product or
course code, runtime configuration, messages, dependencies, build inputs, or
the workflow definition creates a new candidate and restarts affected evidence.

While the release is pending, target fields that do not exist yet may be null.
The first `pass` or `fail` evidence requires its target's five fields to be
frozen. Every non-pending record repeats five safe binding refs
(`candidate-commit:`, `checkpoint:`, `integration-branch:`,
`vercel-deployment:`, and `workflow-definition:`) plus its substantive evidence
ID/path; a mismatched deployment or commit fails the schema.

CSP is the only two-target exception. `vercelPreviewCsp.reportOnlyTarget` binds
Stage A to the predecessor report-only commit and deployment. Stage B binds to
the final `releaseTarget`. Once Stage B has a conclusion, the checker requires
the two commits and deployments to be different, the checkpoint, integration
branch, and workflow blob to be identical, and the Stage A UTC timestamp to be
strictly earlier than Stage B. Stage B cannot be concluded unless Stage A
passed. While a CSP stage is pending, its not-yet-known target fields may remain
null and its timestamp and evidence list must remain empty.

An evidence record has one of three states:

- `pending`: no conclusion, no timestamp, and no evidence reference;
- `pass`: a canonical UTC timestamp plus at least one sanitized reference; or
- `fail`: the failed observation, timestamp, and sanitized reference are kept so
  a release cannot quietly reinterpret a failed check as “not run”.

Group and top-level statuses must agree with their child records. The checker
rejects optimistic aggregate statuses.

## Release-candidate workflow

1. Freeze the report-only predecessor commit and Vercel preview deployment ID
   in `vercelPreviewCsp.reportOnlyTarget`.
2. Run `npm test`, `npm run lint`, the normal build/smoke pipeline, and then
   `npm run release:check`.
   Browser failure evidence may be uploaded only after `npm run artifacts:check`
   passes; a rejected or unparseable artifact remains local and blocks upload.
3. Complete CSP Stage A against that exact predecessor commit/deployment. Keep
   the candidate in `report-only` until Stage A passes; a failed Stage A stops
   promotion.
4. Promote with `npm run csp:set -- enforced` in a separately reviewed commit,
   deploy a fresh preview, and freeze that commit/deployment in `releaseTarget`.
5. Complete Stage B and the remaining forms against the final release target.
6. Sanitize the evidence. A second reviewer confirms that no prohibited value
   is present.
7. Add stable evidence references and UTC timestamps to
   `config/release-readiness.json`; update child, group, and overall statuses.
8. Complete `rollback.md`, record the previous production target, ordinary
   revert PR plan, and recovery validation; rollback readiness is a P0 release
   gate, not a post-release promise.
9. Run `npm run release:check` again. Preserve its passing output with the
   release record.
10. If any native review, Arabic case, canary reconciliation, CSP stage, CI
   observation, or rollback validation fails, stop the release and retain the
   failure as `fail`.

Automatic key, placeholder, plural, and fallback checks cannot sign for a
native speaker. Mock Provider tests cannot replace the low-limit real canary.
Local header configuration cannot replace inspecting Vercel preview response
headers. A green run cannot prove that GitHub made the jobs required.

## Forms

- `native-review-form.md` — one signed copy for each of eight non-English locales.
- `arabic-rtl-matrix.md` — the 979/980 breakpoint plus 390/1440 representative paths.
- `provider-canary.md` — low-limit real Provider run and reconciliation.
- `csp-verification.md` — executable report-only → enforced transition plus
  external response-header observation.
- `github-readiness.md` — required checks and three consecutive green runs.
- `rollback.md` — previous production target, ordinary revert PR, and recovery validation.
- `pilot-protocol.md` — later six-learner/three-teacher pilot and its exit metrics.
- `implementation-matrix.md` — approved roadmap requirements mapped to
  repository evidence, deterministic gates, external work, and explicit non-goals.
- `performance-verification.md` — static budgets, three-engine compatibility,
  emulated resilience, physical-device, and field-CWV evidence boundaries.
