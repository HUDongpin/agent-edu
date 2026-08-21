# Approved roadmap implementation matrix

This matrix maps the approved **20260821 Codex Priority Implementation Plan on
Agent Edu v1.0** to repository evidence. It deliberately separates five states:

- **implemented** — the required repository behavior or protocol exists;
- **implemented early** — later-phase repository work exists, but P0 has not
  yet received external release acceptance;
- **automatic pass** — the named deterministic command has passed on the local
  integration candidate;
- **external pending** — a real deployment, Provider, device, native reviewer,
  GitHub setting or participant is required;
- **excluded** — the roadmap explicitly says not to build it.

An implemented row is not permission to publish. The machine release decision
is `config/release-readiness.json`; `npm run release:check` must remain non-zero
until every external P0 record is signed against one frozen candidate and
deployment.

P1/P2 work was implemented early on the integration candidate. Its presence in
Git history is not evidence that P0 stabilized first, nor permission to release
those phases. P1/P2 release acceptance remains pending until the external P0
gates below pass against a frozen candidate; no history rewrite is implied.

## Wave 0 and P0

| Roadmap requirement | Repository evidence | Deterministic gate | Current state |
|---|---|---|---|
| Recoverable checkpoint; no destructive cleanup | Checkpoint `0f4246ab19a0b4f987f45a50ec6a3b2e7eac14bd`; subsequent work isolated on the planned integration branch `codex/release-202608-agent-edu` | `git status`, staged-file review, `npm run secrets:check` | Implemented; checkpoint retained |
| Node 20 quality and Chromium smoke CI | `.github/workflows/ci.yml`, `package.json`, `playwright.config.ts`, `e2e/smoke.spec.ts`; exact report-only predecessor metadata in `docs/release/evidence/stage-a-automated-precheck-29e1f8b.json` | `npm test`, `npm run lint`, `npm run build`, `npm run routes:check`, `npm run test:smoke` | Implemented; report-only predecessor run `32448414858` passed attempt 1, while GitHub required-check proof and three final-candidate runs remain external pending |
| Active source lint is zero-error/zero-warning | ESLint scopes active site and scripts; generated/build/legacy paths stay outside that gate | `npm run lint` | Automatic pass |
| Part 1/2/3 and Python-legacy truth is consistent | Handbook content, localized site catalogs, `README.md`, `TEACHING.md`, `/[locale]/build/`, `public/teacher-pack.txt` | `npm run handbook:check`, `npm run widgets:check`, route/browser journeys | Implemented; eight native reviews external pending |
| Learning state v2 separates visit, task completion and score | `lib/progress.ts`; Home, Catalog, Handbook and Lab consumers; migration/reset tests | Progress and integration tests under `tests/` and `e2e/smoke.spec.ts` | Implemented and automatically covered |
| Part 3 has no website percentage or Resume claim | Catalog selector and localized Build handoff; local course owns `course/progress.json` | Progress tests; nine-locale journey | Implemented and automatically covered |
| Typed BYOK result/error/usage/billing contracts plus bounded request/response resources | `lib/byok/`, `lib/deepseek.ts`, `lib/lab/`; shared message count/character/UTF-8 caps and a streamed 256 KiB response ceiling | BYOK boundary, pricing, key-verifier and runner unit tests | Implemented and automatically covered |
| No silent network retry; Stop/fail-fast/run isolation | Single-dispatch client and abort-aware batch runner | Runner tests; Lab cancellation browser test | Implemented and automatically covered |
| Call disclosure and conservative cap | Lab plans lock 1, 3, 28, 56 and recommended 60 calls / 16,350 output-token cap | `tests/byok-pricing-plans.test.ts`, `tests/lab-runner.test.ts` | Implemented and automatically covered |
| Flash/Pro, peak/off-peak, cache hit/miss and unknown billing | Dated/sourced snapshot in `lib/byok/pricing.ts`; shared course pricing | Pricing and course-usage tests | Implemented; release-date official price/model/CORS/bill reconciliation external pending |
| Save & test uses one `GET /models`; six key states | `lib/byok/key-verifier.ts`, session-only key store, KeyBar UI | Key verifier tests; Provider contract browser suite | Implemented; low-limit real-key canary external pending |
| Fake key, Prompt, reply and raw Provider data stay out of persistent/exported surfaces | Session-only key, restricted draft codec, redaction, fail-closed test routing and curated browser-evidence pipeline | Secrets/privacy unit tests; Provider contract browser tests; artifact intentional-failure gate | Implemented; CI failure-evidence behavior still requires frozen GitHub run evidence |
| Runtime widget HTML cannot be created by ordinary translation/state interpolation | `lib/handbook/copy.ts` escapes all ordinary `C.h()` variables; only two fixed code fragments and two internal links use opaque reviewed markup | Handbook copy security tests plus the exact four-site `widgets:check` ratchet | Implemented and automatically covered |
| Handbook 979/980 orientation, roving focus, Home/End, RTL arrows and visible active tab | `lib/handbook/behaviour.ts`, scoped styles and smoke matrix | Handbook unit tests; Arabic width/theme keyboard matrix | Implemented and automatically covered; human RTL/device matrix external pending |
| Stable page H1 and task-equivalent non-visual judgements | Handbook markup/behavior and screen-reader-only structures | Handbook P0/content-equivalence tests and browser task | Implemented; human screen-reader review external pending |
| Nine complete machine catalogs with no unexplained fallback | `messages/`, `messages/widgets/`, `messages/handbook/`, narrow allowlist | `npm run handbook:check`, `npm run widgets:check`, `npm run release:check` localization phase | Automatic structural pass; eight native-language sign-offs external pending |

Catalog-count reconciliation: the roadmap recorded the pre-closeout baselines as
560 Handbook strings and 685 Widget keys. Enforcing the approved offline Part 1
and truthful-progress scope removed 20 Handbook live-Provider strings and 19
Widget live/legacy-progress keys; localizing ten previously hard-coded kiosk
fixtures then brought the source-derived contracts to 540 Handbook strings and
676 Widget keys. The gates derive their expected sets from current markup and
call sites, so dead keys are not retained merely to preserve obsolete totals.
Removing the live block also changed the queried-DOM-ID baseline from 138 to
133 (seven obsolete live-mode DOM nodes were removed); the current checker
derives and verifies all 133 IDs from the surviving call sites.

## P1

| Roadmap requirement | Repository evidence | Deterministic gate | Current state |
|---|---|---|---|
| Local Lab draft restores and clears without storing key/reply/error/billing | `lib/lab/draft.ts`, `lib/lab/rules.ts`, `components/lab/Lab.tsx` | Draft/rule tests; reload, pagehide and client-navigation browser test | Implemented early and automatically covered; P1 release acceptance pending |
| Scaffolding fades without hard locks; two guided pre-Eval pauses | Lab Stage 2/3 UI and reflection lifecycle | Lab integration/source contract plus browser composition test | Implemented early; learner-comprehension evidence and P1 release acceptance pending |
| Localized Part 3 transition and offline Stage 0 | `app/[locale]/build/`, `course/`, teacher pack; nine guided/checkable stages 0–8 are distinguished from the Stage 9 transfer project | Offline preflight/check and course-truth tests; route manifest; nine-locale handoff | Implemented early and automatically covered; P1 release acceptance pending |
| Diagram-independent task completion | Handbook structured alternatives and CSS utility | Content-equivalence tests; diagrams-hidden browser task | Implemented early; human assistive-technology review and P1 release acceptance pending |
| Transfer artifact and evidence rubric | Stage 9 project template/rubric, `TEACHING.md`, Teach page/pack | Course-truth checks and route artifact markers | Implemented early; P1 release acceptance pending |

## P2 and post-release evidence

| Roadmap requirement | Repository evidence | Deterministic gate | Current state |
|---|---|---|---|
| Teacher pack reachable in two interactions, printable/downloadable, no-key/offline path, worksheet/cues/rubric | `/[locale]/teach/`, `public/teacher-pack.txt`, `TEACHING.md`; the download explicitly requires filling Stage 0 `QUESTION` | Compat browser test and route artifact markers | Implemented early; downloadable TXT is explicitly English and P2 release acceptance pending |
| Six-learner / three-teacher evidence protocol without product telemetry | `docs/release/pilot-protocol.md` includes fixed stimuli, C1–C6 participant composite, separate X-A/X-B denominator, help/blocker/withdrawal rules, codebook, double review and retention | Pilot protocol contract test | Implemented early; recruitment, observed exit metrics and P2 release acceptance pending |
| Language-neutral recovery 404 | `app/global-not-found.tsx` uses `lang="und"` and nine equal recovery cards | Route manifest and three-engine compat test | Implemented early and automatically covered; P2 release acceptance pending |
| Firefox and WebKit baseline | `e2e/compat.spec.ts`, three Playwright projects, compatibility CI job | `npm run test:compat` | Suite implemented early; archived source-candidate three-engine run retained, final-candidate rerun plus physical Safari/device evidence and P2 release acceptance pending |
| Declared weak-network/low-end regression | `e2e/resilience.spec.ts` records CPU/network profile and keeps no-key path local | `npm run test:resilience` | Implemented early as emulated lab evidence; physical evidence and P2 release acceptance pending |
| Complete static-export regression budget and reproducible local CWV measurement | `scripts/check-static-assets.mjs` inventories Next chunks, emitted public assets and route payloads; `scripts/measure-lab-vitals.mjs` binds `.next/BUILD_ID` and a complete sorted `out/` SHA-256/file-count/byte-count fingerprint; `docs/release/evidence/lab-vitals-a586b44.json` preserves an archived source-candidate run | fresh `npm run build && npm run assets:check`; `npm run --silent vitals:lab` (three cold/warm samples per route) | Implemented early; archived six-route synthetic lab evidence passed its schema with 3 cold/3 warm samples. A final-candidate rerun, physical-device, field CWV, real-network evidence and P2 release acceptance remain pending |
| Measure before any large Handbook rewrite; independently study strict hash/SRI CSP | `docs/release/handbook-profiling-gate.md`, `docs/release/csp-hash-sri-spike.md`, `docs/release/evidence/csp-hash-sri-spike-a586b44.json`, current static architecture | Profiling/CSP governance contract tests; two clean spike builds, privacy-safe three-browser report-only observation and ordinary rollback | No large rewrite performed. The source-bound local strict hash/SRI spike executed and failed closed: incomplete SRI plus runtime style-attribute violations made it unsuitable for enforcement on that static architecture. It is not evidence for a later release candidate. The committed P0 staged CSP is unchanged; external CSP stages and P2 acceptance remain pending |

## Release-only external gates

The following cannot be completed truthfully in a local mock-only task. Their
forms and fail-closed schema exist under `docs/release/`, but they remain
blocking:

1. eight independent native-language reviews;
2. the full human Arabic RTL/device/keyboard matrix and assistive-technology
   review;
3. a low-limit, revocable real DeepSeek canary with model, usage, pricing,
   billing and CORS reconciliation;
4. actual Vercel report-only response-header and deployed-browser observation
   (the target-bound automated CI/deployment-config precheck is retained but
   does not pass Stage A), followed by a separate enforced preview;
5. GitHub proof that required checks are protected plus three unique first-run
   successes on one frozen candidate/workflow;
6. an ordinary-PR rollback target and recovery validation;
7. physical low-end/real-network and field Core Web Vitals evidence;
8. the six-learner/three-teacher pilot.

No deployment, push, required-check mutation, real Provider call, participant
recruitment or native-review signature is implied by this repository work.

## Explicit non-goals preserved

The implementation does not add customer-service features, accounts, a teacher
dashboard, full learning telemetry, reminders, personalized paths, a browser
multi-Provider/BFF key store, hard Lab gating, forced long reflection, social
portfolio or an in-browser IDE. Analytics remains the disclosed aggregate
pageview integration only; repository source checks reject custom Lab events.
