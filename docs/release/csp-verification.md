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
- Observation window:
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
