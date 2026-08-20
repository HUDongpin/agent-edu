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

An evidence record has one of three states:

- `pending`: no conclusion, no timestamp, and no evidence reference;
- `pass`: a canonical UTC timestamp plus at least one sanitized reference; or
- `fail`: the failed observation, timestamp, and sanitized reference are kept so
  a release cannot quietly reinterpret a failed check as “not run”.

Group and top-level statuses must agree with their child records. The checker
rejects optimistic aggregate statuses.

## Release-candidate workflow

1. Freeze the release commit and Vercel preview deployment ID.
2. Run `npm test`, `npm run lint`, the normal build/smoke pipeline, and then
   `npm run release:check`.
3. Complete the forms in this directory against that exact commit/deployment.
4. Sanitize the evidence. A second reviewer confirms that no prohibited value
   is present.
5. Add stable evidence references and UTC timestamps to
   `config/release-readiness.json`; update child, group, and overall statuses.
6. Run `npm run release:check` again. Preserve its passing output with the
   release record.
7. If any native review, Arabic case, canary reconciliation, CSP stage, or CI
   observation fails, stop the release and retain the failure as `fail`.

Automatic key, placeholder, plural, and fallback checks cannot sign for a
native speaker. Mock Provider tests cannot replace the low-limit real canary.
Local header configuration cannot replace inspecting Vercel preview response
headers. A green run cannot prove that GitHub made the jobs required.

## Forms

- `native-review-form.md` — one signed copy for each of eight non-English locales.
- `arabic-rtl-matrix.md` — the 979/980 breakpoint plus 390/1440 representative paths.
- `provider-canary.md` — low-limit real Provider run and reconciliation.
- `csp-verification.md` — report-only observation followed by enforced CSP.
- `github-readiness.md` — required checks and three consecutive green runs.
- `pilot-protocol.md` — later six-learner/three-teacher pilot and its exit metrics.
