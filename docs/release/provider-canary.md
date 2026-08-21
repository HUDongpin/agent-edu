# Low-limit Provider canary and reconciliation

This is a real-environment release gate. Provider mocks remain necessary for CI
but cannot make this form pass.

## Safety setup

- Use a separate, low-limit, immediately revocable credential.
- Use the frozen Vercel preview and release commit only.
- Keep the credential in memory/session input. Do not place it in URLs,
  localStorage, console output, screenshots, shell history, CI, Git, or this form.
- Prepare a stop/revoke path and a maximum expected call/charge budget.
- Store only aggregate facts and opaque evidence IDs—never Provider raw bodies,
  Prompts, replies, Authorization/Cookie values, account numbers, or signed URLs.

## Frozen target

- Release commit SHA:
- Vercel deployment ID:
- Canary operator reference:
- Independent low-limit account alias (non-identifying):
- Budget ceiling and currency:
- Started at (UTC):
- Canonical public pricing page (no query parameters):

## Required live sequence

| Step | Expected bound | Sanitized observation | Result | Evidence ID |
|---|---:|---|---|---|
| GET `/models` | one request | Reachability and available model IDs only | pending |  |
| Stage 1 | one generation | UI success, usage present, no retry | pending |  |
| Three-case preview | three generations | All three settle; cost remains bounded | pending |  |
| Flash Eval | 20 generators + at most 8 judges | Judges start only for usable generator outputs | pending |  |

Stop immediately on an unexpected endpoint, automatic retry, scheduling after a
terminal 401/402/403/429/5xx, cancellation that starts new calls, sensitive
console/storage/network leakage, or a charge above the ceiling. Preserve that
observation as `fail`.

## Reconciliation

The public-source precheck at
`docs/release/evidence/provider-pricing-precheck-20260821.json` retrieved the
official DeepSeek pricing page on 2026-08-21 and matched the repository's
Flash/Pro peak/off-peak and cache hit/miss snapshot exactly. It does not pass
the pricing row by itself: the release record must still bind the final target
and reconcile those public rates with the actual requested/returned model IDs,
aggregate usage and bounded Provider charge from the real canary.

| Check | What must agree | Sanitized fields to retain | Result | Evidence ID |
|---|---|---|---|---|
| Pricing | Current Flash/Pro, peak/off-peak, cache hit/miss rules | checked-at date, public source, expected aggregate range | pending |  |
| Model ID | Requested and returned model | model IDs only, no response body | pending |  |
| Usage | UI estimate and Provider usage | aggregate input/output/cache counts | pending |  |
| Billing | Usage-derived range and console charge | rounded aggregate amount/range; no account details | pending |  |
| CORS | Real browser preview origin | allowed/blocked conclusion and safe header names | pending |  |
| Credential lifecycle | Isolation and teardown | low-limit/revocable attestation and revocation time only | pending |  |

Missing cache fields are treated as cache miss. Unknown cost is never recorded
as zero. A successful request does not by itself establish price or billing
accuracy; all six reconciliation rows must pass.

## Teardown and signature

- [ ] Credential revoked or disabled after the run.
- [ ] Browser storage, console, screenshots, and artifacts rechecked for leakage.
- [ ] No signed/bypass URL or Provider raw body entered the evidence record.
- [ ] Operator and second reviewer agree that call counts and charge are bounded.

- Overall result: pass / fail
- Completed at (UTC):
- Canary record ID:
- Billing record ID:
- Operator reference:
- Independent reviewer reference:
