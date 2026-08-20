# Vercel preview CSP verification

The target is a baseline egress CSP for the static site, not a claim of strict
XSS protection. Verification has two ordered stages: observe report-only first,
then enforce on a fresh preview after reviewing violations.

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

Store only the deployment ID and sanitized header/violation summary. Never paste
a signed preview bypass URL, Cookie/Authorization header, credential, Prompt,
reply, or Provider raw response body. Local automated config checks cannot
replace inspecting the deployed response headers.
