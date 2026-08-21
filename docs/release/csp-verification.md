# Vercel preview CSP verification

The target is a baseline egress CSP for the static site, not a claim of strict
XSS protection. Verification has two ordered stages: observe report-only first,
then enforce on a fresh preview after reviewing violations. The committed local
configuration starts in `report-only`; neither stage is externally complete
until the deployed response and browser journey have been inspected.

## Repository state machine

`config/csp-stage.json` is the machine-readable stage and reviewed policy.
`vercel.json` must contain exactly one matching CSP header. These commands fail
closed if either file has drifted, if both CSP headers exist, or if the policy
has been weakened:

```bash
npm run csp:check
npm run csp:set -- report-only
npm run csp:set -- enforced
```

The setter changes only the stage plus the CSP header name. It does not edit the
policy, create evidence, deploy a preview, or mark either release gate as
passed. Promotion to `enforced` must be an explicit reviewed commit after Stage
A passes. Run `npm run csp:check` in CI and immediately before every preview.

The release-evidence schema preserves both immutable observations. Stage A's
five binding fields live in `vercelPreviewCsp.reportOnlyTarget`; Stage B's five
binding fields are the final top-level `releaseTarget`. Every non-pending stage
must repeat its own target as safe opaque refs plus a substantive CSP record.
For a concluded Stage B, the checker requires distinct commit and deployment
IDs, identical checkpoint/branch/workflow bindings, and a Stage A timestamp
strictly earlier than Stage B. A pending stage has no timestamp or evidence
refs, and target fields that are not known yet may remain null.

## Expected baseline policy

```text
default-src 'self';
script-src 'self' 'unsafe-inline';
script-src-attr 'none';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self' https://api.deepseek.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

## Stage A — report-only

An automated precheck for the frozen report-only predecessor is retained at
`docs/release/evidence/stage-a-automated-precheck-29e1f8b.json`. It binds the
exact commit, workflow blob, GitHub attempt-1 run and immutable Vercel
deployment; it also records the CI browser matrices and the CSP found in
Vercel's deployment build configuration. It is deliberately **not** Stage A
evidence: deployment configuration metadata is not an observed response
header, localhost CI is not a deployed-browser observation window, and
automation cannot sign the human or real-Provider gates below. Stage A remains
pending with no timestamp or evidence reference until those observations are
completed and sanitized.

A later partial browser observation is retained at
`docs/release/evidence/stage-a-browser-header-observation-20260821.json`. Chrome
received a fresh 200 response from the exact immutable deployment with the
reviewed `Content-Security-Policy-Report-Only` value and supporting security
headers. It does not pass Stage A: the complete fixed-width/theme, Provider,
Analytics, and console-classification matrix is not yet recorded. English and
Arabic completed the visible Home → Handbook → Control Room → Lab → Build
path, then the same deployed route/role matrix passed for all nine locales
(45/45 cases). Arabic Home/End plus theme switching were observed. The
fixed-width/theme matrix, Provider and Analytics paths remain outstanding; one
report-only data-font violation also requires clean-session provenance
classification.

- [ ] `config/csp-stage.json` says `report-only` and `npm run csp:check` passes.
- [ ] Vercel response contains `content-security-policy-report-only`.
- [ ] The value matches the reviewed baseline; no unexpected egress origin appears.
- [ ] Home → Handbook → Control Room → Lab → TypeScript handoff works in nine locales.
- [ ] DeepSeek access, static assets, fonts, data images, and disclosed Analytics are
      observed; every violation is classified rather than silently ignored.
- [ ] No Lab custom Analytics event exists.
- [ ] Observation covers 390px/1440px, light/dark, and the Arabic RTL journey.
- [ ] A sanitized violation summary and deployment ID are retained.

- Report-only result: pass / fail
- Checked at (UTC):
- Observation window:
- Candidate commit SHA:
- Checkpoint SHA:
- Integration branch:
- Workflow definition blob SHA:
- Vercel deployment ID:
- CSP record ID:

## Stage B — enforced

Begin only after Stage A passes and reviewed exceptions are reflected in the
baseline.

- [ ] Run `npm run csp:set -- enforced`, review the two-field transition, and
      commit it before creating a fresh preview.
- [ ] `npm run csp:check` passes for that exact release commit.
- [ ] Vercel response contains `content-security-policy`, not only a local config.
- [ ] The enforced value matches the reviewed baseline.
- [ ] Repeat the same nine-locale critical journey and Provider canary path.
- [ ] Confirm unexpected connections, objects, frames, forms, and base changes are blocked.
- [ ] Confirm static export remains intact; do not introduce nonce-dependent rendering.
- [ ] Inspect a fresh response, not a cached report-only deployment.

- Enforced result: pass / fail
- Checked at (UTC):
- Final candidate commit SHA:
- Checkpoint SHA:
- Integration branch:
- Workflow definition blob SHA:
- Vercel deployment ID:
- CSP record ID:

If enforcement breaks a critical journey, stop the release and revert the
isolated promotion commit. Restore `report-only`, retain the failed Stage B
record as `fail`, and investigate in a new change; do not silently relax the
policy or rewrite the failed evidence.

Store only the deployment ID and sanitized header/violation summary. Never paste
a signed preview bypass URL, Cookie/Authorization header, credential, Prompt,
reply, or Provider raw response body. Local automated config checks cannot
replace inspecting the deployed response headers.
