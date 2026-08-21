# Authoritative roadmap completion audit

Status: **repository implementation audited; external P0 and later field
evidence pending**.

This is the human-readable companion to
`evidence/roadmap-completion-audit-20260821.json`. The machine record binds the
audit to the authoritative plan, immutable commits, the current Draft PR, the
33-item P0 release schema, later P1/P2 evidence, and the explicit non-goals.

## Authority and source boundary

The requirements source is `20260821_Codex Priority Implementation Plan on
Agent Edu.docx`, v1.0, SHA-256
`4116ea2ece55ab72796e35b3021015f5622de921773d63ed9c8b2b708b5cc107`.
The DOCX is deliberately not tracked in Git. Its original statement that its
own delivery turn would create only a plan describes that earlier turn; it is
not a runtime instruction. The later direct user request authorizes the present
implementation, isolated-branch push, Draft PR, and external-evidence work.

## Bound targets

| Role | Immutable value |
|---|---|
| Roadmap baseline / current production anchor | `67e1beba98fee926925b254a152a1a1de1176376` |
| Recoverable checkpoint | `0f4246ab19a0b4f987f45a50ec6a3b2e7eac14bd` |
| Product candidate | `2cdf1d6894b2f8293631742229fdd52cfa744d4d` |
| Stage A report-only predecessor | `29e1f8b8405068875b1ba94a92b516930bc0d6b0` |
| Integration branch | `codex/release-202608-agent-edu` |
| Draft integration PR | [#3](https://github.com/HUDongpin/agent-edu/pull/3) |

The checkpoint and topic branches exist locally. Only the integration branch
is observed on `origin`. The roadmap proposed one PR per risk topic, but the
observed remote topology is one Draft integration PR. This is an explicit
deviation, not a silently completed requirement. No extra branch push or topic
PR is inferred from the authorization to push this isolated branch and create
its PR.

## Implementation conclusion by phase

| Phase | Repository conclusion | Remaining truth boundary |
|---|---|---|
| Wave 0 | Checkpoint and CI foundation are implemented and verified | Required-check protection and final-candidate stable runs remain external |
| P0 | Content truth, i18n structure, progress v2, BYOK contracts, pricing logic, Key lifecycle, privacy, mobile/keyboard accessibility, Analytics disclosure, and staged CSP are implemented and automatically covered | Human languages/devices, real Provider, deployed CSP stages, GitHub protection/stability, and rollback proof remain blocking |
| P1 | Five work packages are present early | P1 is not accepted until P0 stabilizes; learner and assistive-technology evidence remains pending |
| P2 | Teacher pack, pilot protocol, recovery 404, browser/resilience suites, asset/vitals tooling, profiling gate, and failed-closed CSP spike are present early | Participant, physical-device, real-network, field-CWV, final-candidate, and P2 acceptance evidence remains pending |

The exact requirement IDs and per-item state are in the machine companion. An
“implemented early” entry is not evidence that the roadmap sequence occurred
and is not permission to publish that phase.

## P0 release decision

`npm run release:check` remains deliberately non-zero. The 33 external records
are:

| Gate | Pending records |
|---|---:|
| Native reviews | 8 |
| Arabic RTL/device/keyboard matrix | 8 |
| Real Provider canary and reconciliation | 10 |
| Vercel report-only then enforced CSP stages | 2 |
| GitHub required checks plus three first-attempt stable runs | 4 |
| Rollback target, ordinary revert PR, and recovery validation | 1 |
| **Total** | **33** |

The frozen Stage A Preview now has an actual Chrome 200-response observation in
`evidence/stage-a-browser-header-observation-20260821.json`: the expected
`Content-Security-Policy-Report-Only` value and the reviewed supporting headers
were present. That closes only the response-header observation. Stage A stays
pending. Computer Use also observed all nine locales on the deployed Home →
Handbook → Control Room → Lab → Build path (45/45 route/role cases), then all
eight Arabic 390/979/980/1440 × light/dark mechanical cases. The prior
data-font report did not reproduce after all enabled extensions were
temporarily disabled, and every extension state was restored. A separate
Computer Use observation found only same-origin Vercel Analytics script/view
traffic and an SDK queue containing `pageview` on Home and Lab; safe no-key Lab
interactions emitted no custom event, and no Analytics payload was inspected.
A subsequent credential-free browser precheck reached the real DeepSeek
`/models` endpoint and received a CORS-readable 401 without an Authorization
value, request body, response-body read, or billable call. That closes only the
browser-connectivity uncertainty; authenticated model discovery and the full
low-limit Provider sequence remain unobserved. The mechanical Arabic precheck
does not replace the eight pending Arabic matrix records or the Arabic
native-review signature in the release schema.

Three unique attempt-1 GitHub workflows also completed green on the same
report-only integration head and workflow definition. They are retained as a
repeatability precheck, not inserted into the formal stable-run records:
`main` remains unprotected, Stage A has not passed, and an enforced-CSP final
candidate does not exist. Consequently all 33 formal external P0 records above
remain pending.

## Later field evidence is not hidden inside the P0 count

The 33-record schema is the P0 release gate. It does not pretend to complete the
later requirements below:

- P1 acceptance after P0 stabilization;
- human assistive-technology task review;
- P2 acceptance and a final-candidate Firefox/WebKit rerun;
- physical Safari, low-end-device, and real-network evidence;
- field Core Web Vitals evidence;
- the six-learner/three-teacher pilot and its exit metrics.

## Preserved safety and scope boundaries

No production deployment, PR merge, Ready transition, GitHub protection
mutation, Vercel protection reduction, fabricated human signature, fabricated
participant result, or recorded real Provider credential is claimed. A
transient CLI-created Vercel bypass credential was revoked and was neither
retained nor reused; the Computer Use observation relied on the existing
Vercel-authenticated browser session instead. The customer-service system,
accounts/dashboard/full telemetry, reminder/personalization platform, browser
multi-Provider/BFF Key store, hard Lab gating, forced long reflection, social
portfolio, in-browser IDE, unmeasured diagram rewrite, and unprofiled Handbook
rewrite remain out of scope.
