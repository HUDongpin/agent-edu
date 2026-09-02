# P0 rollback readiness

Rollback is a release prerequisite, not permission to rewrite shared history.
This record proves that the frozen candidate can be backed out through one
ordinary GitHub pull request and that the previous production artifact remains
identifiable and testable. Never use force-push, `reset --hard`, or destructive
cleanup as a release rollback.

## Frozen targets

Read-only precheck `docs/release/evidence/external-readiness-precheck-20260821.json`
confirmed that current production deployment
`dpl_ESbehP8bB8n45aWks7EDBRUPXqVu` is `READY` and identifies commit
`67e1beba98fee926925b254a152a1a1de1176376`, which matches the observed `main`
head. This safely identifies the prospective previous-production anchor only.
It does not create a release tag or revert PR, exercise a revert preview,
compare recovered response headers, or pass rollback readiness.

That historical anchor has since been superseded. The read-only Vercel,
GitHub-deployment, alias, and canonical-response comparison in
`docs/release/evidence/production-rollback-anchor-observation-20260902.json`
shows that `aicourse.top` and `www.aicourse.top` currently resolve to READY
deployment `dpl_ChfEQ6t7LSL41pPbdgNoHdNXczVz`, bound to current `main` commit
`bf1fde5bb09150bde3cba7b447f71a63dec3c160`. A newer successful Production
deployment exists for another commit but does not own the canonical aliases.
The canonical release-metadata route currently returns 404, so this observation
identifies only the prospective previous-production anchor; it is not production
parity evidence and does not pass the rollback gate.

- Candidate commit SHA (must equal `releaseTarget.candidateCommitSha`):
- Candidate Vercel deployment ID (must equal `releaseTarget.vercelDeploymentId`):
- Previous production commit SHA (must be distinct):
- Previous production Vercel deployment ID (must be distinct):
- Release tag to retain:
- Integration branch:
- Checked at (UTC):

Do not paste preview URLs, bypass parameters, cookies, authorization values, or
deployment logs. Deployment IDs and full Git SHAs are sufficient.

## Ordinary revert PR plan

- Revert PR reference (`github-pr:<number>`):
- Revert range or explicitly listed commits:
- Reviewer confirms the PR changes only the intended release risk: yes / no
- Old locale files remain available until production validation: yes / no
- Old learning-state keys remain readable for the promised migration window: yes / no
- No force-push, history rewrite, or user-worktree cleanup is required: yes / no

The PR may be prepared and reviewed without merging it. If a canary, language
review, CSP stage, price check, or production validation fails, use the ordinary
PR path; do not make the failed release disappear from history.

## Recovery validation

Validate the previous production target, then validate the revert result in a
fresh preview or equivalent immutable artifact:

- [ ] Previous production commit and deployment agree.
- [ ] `quality` and `smoke-chromium` pass on the revert result.
- [ ] Route manifest and 404/recovery artifacts pass.
- [ ] No credential, Prompt/reply, signed URL, or Provider raw body enters Git,
      logs, screenshots, or artifacts.
- [ ] Nine locale routes remain available; rollback does not silently publish a
      partial language set.
- [ ] Handbook/Lab learning state either remains compatible or the user-visible
      recovery behavior is documented and tested.
- [ ] BYOK remains stopped or behaves according to the previously accepted
      production contract; no new Provider call is made merely to test rollback.
- [ ] Vercel response headers match the previous accepted deployment.

Store a sanitized conclusion as `rollback-record:<id>` or a checked text file
below `docs/release/evidence/`. The evidence record must also carry the five
target-binding refs required by the release schema.

## Release decision

- Result: pass / fail
- Validated candidate commit SHA:
- Rollback record ID:
- Independent reviewer reference:
- Completed at (UTC):

A pending rollback record keeps the release blocked. `pass` requires a distinct
previous commit/deployment, a stable release tag, an ordinary revert PR
reference, the candidate SHA that was validated, and a sanitized rollback
record. `fail` is retained as a failed release observation; it is not reset to
pending.
