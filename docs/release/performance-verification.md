# Performance and compatibility verification

This protocol keeps three kinds of evidence separate. A static byte inventory is
not a Core Web Vitals result, an emulated browser is not a physical low-end
device, and a local Lighthouse run is not field data.

## 1. Deterministic static-asset inventory

Run against a clean, freshly built release commit:

```bash
npm ci
npm run build
npm run assets:check
```

`assets:check` writes a sorted JSON inventory of every file below `out/` to
`tmp/release/static-asset-inventory.json`. It
separates Next chunks, byte-for-byte copies of `public/`, and generated route
HTML/RSC/text payloads; it also verifies that every public source asset was
actually emitted unchanged. The inventory contains no clock time or
machine-specific absolute path and normalizes Next's per-build identifier, so
repeated builds of the same source are auditable and diffable. This closes the
blind spot where large Open Graph images or duplicated localized route payloads
could grow while an `_next/static`-only total stayed green.

The current baselines were reviewed from two clean, byte-identical Node 24 /
Next 16.3.1 exports of content candidate `342ab475` on 2026-08-31. Fixed-size
aggregate budgets retain 10% headroom; public media and individual route files
retain their 500 KiB safety caps. Route and whole-export limits scale with the
generated route count. Values are uncompressed bytes in the exported files,
not HTTP transfer sizes after content encoding:

| Measure | Baseline bytes | Limit bytes |
|---|---:|---:|
| All `_next/static` assets | 5,318,714 | 5,850,586 |
| JavaScript | 4,627,427 | 5,090,170 |
| CSS | 691,287 | 760,416 |
| Largest `_next/static` asset | 234,172 | 257,590 |
| Emitted `public/` assets | 14,814,031 | 16,295,435 |
| Largest emitted public media asset | 495,549 | 512,000 |
| Generated route payloads | 402,827,884 | 417,331,200 at 741 routes |
| Largest HTML/RSC payload | 414,577 | 512,000 |
| Largest sitemap shard | 21,785 | 512,000 |
| Complete exported site | 422,960,629 | 522,379,264 at 741 routes |

These are regression budgets, not claims that the current payload is optimal.
Change a limit only in a review that records the before/after inventory and why
the additional bytes are proportionate. Never raise a limit merely to make CI
green.

The 2026-08-31 review, duplicate/orphan analysis, exact CSS chunk hashes, route
load distributions, optimization delta, and remaining work are recorded in
`docs/release/evidence/static-asset-baseline-review-342ab475.md`.

## 2. Local lab compatibility and Web Vitals

The repository compatibility suite is intentionally smaller than the release
Chromium matrix:

```bash
npm run build
npm run test:compat
```

It checks Chromium, Firefox, and WebKit against the static `out` server for the
English Home/Handbook/Lab/Build paths, the real recovery 404, the mobile Teach
entry and teacher-pack download, plus basic 390/1440 horizontal overflow. It
does not replace the nine-language Chromium release suite.

The repository includes a standalone Chromium harness for reproducible local
measurements. It is browser automation rather than a Playwright test spec, and
it deliberately sets no numeric pass/fail threshold:

```bash
npm run build
npm run --silent vitals:lab > lab-vitals.json
```

The default run takes three cold and three warm samples for each of Home,
Handbook, Lab, Build, Teach and the real 404. Cold samples disable Chromium's
cache. Warm samples use an explicit test-only `public, max-age=3600` server
header and prime the route once before measurement. Each route has a scripted
interaction. The report records raw and median LCP, CLS and browser-reported
interaction latency for the single controlled interaction, using Event Timing
and its `first-input` entry when the interaction is below the event observer's
16 ms reporting threshold. It also records commit, dirty-tree flag,
Node/Next/Chromium/platform, viewport, cache, no-network-throttle status and the
explicit 4× CPU slowdown.
Missing LCP, CLS or INP is an error;
the harness never substitutes zero for unavailable INP.

The report is bound to the files actually served, not merely to `git HEAD`: it
requires and records `.next/BUILD_ID`, plus a sorted, path-framed SHA-256 over
every file below `out/` with the export file count and total bytes. Missing
`out/`, a missing or malformed build ID, an empty export, or an unsupported
symlink fails closed. Recompute the report after every build; matching source
SHA with a different export fingerprint is not the same candidate artifact.

CI runs `npm run --silent vitals:lab -- --samples=1` only as a harness/schema
smoke. A release evidence record still requires the default three samples on the frozen
candidate, and should preserve stdout as the sanitized JSON evidence reference.

Use the frozen release commit and built static server. Record:

- commit SHA, Node/Next/browser versions and operating system;
- cold versus warm-cache run;
- route, viewport and network/CPU emulation settings;
- at least three runs per Home, Handbook, Lab, Build, Teach and 404 route;
- individual and median LCP/CLS/INP results and the named scripted interaction;
- the raw sanitized report reference, not only a screenshot of a score.

### Archived synthetic lab record (2026-08-21)

The default harness was run from clean product commit
`a586b44a6b58bf209864d2cd9529bb9adff12012`. The complete sanitized JSON is
`docs/release/evidence/lab-vitals-a586b44.json`. It binds build ID
`0GwnNBsh0p0oK6n5oI0Kt` to export SHA-256
`75e74e7c138cf5da9f6a5cbb342f8e9c0a75a4bea7b456a82b52a467cf9987cb`
(448 files; 24,247,762 bytes). Conditions were Chromium 151.0.7922.34 on
darwin-arm64, 390×844, 4× CPU slowdown, no network throttling and three cold
plus three warm samples per route.

| Route | Cold median LCP / CLS / INP | Warm median LCP / CLS / INP |
|---|---:|---:|
| Home | 164 ms / 0 / 40 ms | 36 ms / 0 / 40 ms |
| Handbook | 460 ms / 0 / 80 ms | 292 ms / 0 / 80 ms |
| Lab | 172 ms / 0 / 56 ms | 36 ms / 0 / 56 ms |
| Build | 148 ms / 0 / 40 ms | 32 ms / 0 / 40 ms |
| Teach | 144 ms / 0 / 48 ms | 32 ms / 0 / 40 ms |
| Real 404 | 128 ms / 0 / 8 ms | 24 ms / 0 / 8 ms |

This is a reproducible synthetic-lab record and a schema/measurement pass; the
harness deliberately defines no product threshold. It is not physical-device,
classroom-network or field-CWV evidence and does not close those external gates.
It is retained as source-bound historical evidence after a later Vercel build-input
fix; it does not claim to measure that later report-only predecessor or the final
enforced candidate. Run the default three-sample matrix again after the final
candidate is frozen before using synthetic results in a release decision.

The harness labels its output `synthetic-lab`; its 4× browser CPU throttle is
an emulation profile, not a claim about a specific device. A delayed route or
different browser CPU/network emulation may be useful for a separate regression
test, but label that **emulated lab evidence**. Neither form is a classroom
network or physical low-end-device result.

## 3. Physical-device and real-network evidence

Use at least one currently supported low-end mobile device and the intended
classroom/network environment. Exercise navigation, Handbook tab scrolling,
Lab typing and Stop, the no-key route, Build instructions, Teach printing and
404 recovery. Record device/OS/browser versions, connection type, observable
blocking behavior and a sanitized evidence reference.

This stage is human evidence. Playwright WebKit is a cross-engine baseline, not
proof of every Safari/iOS combination. A desktop throttle is not proof of a
physical device's memory pressure, keyboard behavior or main-thread latency.

## 4. Field Core Web Vitals

Field CWV requires an actual deployed origin and representative traffic. Use a
privacy-reviewed source already covered by the site's disclosure, such as
eligible public CrUX data or the existing aggregate Vercel Web Analytics view.
Do not add learner-event telemetry, Prompts, model replies, credentials or
identifiable work for this purpose.

Record the deployed commit and deployment ID, source, observation window,
sample eligibility, route scope, device class, and 75th-percentile LCP, INP and
CLS. A release has **no field conclusion** when the sample is absent or too
small. Local Lighthouse and synthetic Playwright numbers may guide engineering,
but must remain labelled as lab evidence.

## 5. Change-decision records

A broad Handbook rewrite is not approved by a green bundle or CWV number alone.
Use `docs/release/handbook-profiling-gate.md` to record a demonstrated problem,
comparable before/after profiles, accessibility/task evidence, risk and
rollback before proposing one.

The optional strict CSP investigation is separately specified in
`docs/release/csp-hash-sri-spike.md`. Its local feasibility run failed closed
and preserved the static-export boundary; it did not authorize a dynamic nonce
service or deploy hash/SRI enforcement.

## Evidence record

- Evidence source commit: `a586b44a6b58bf209864d2cd9529bb9adff12012`
- Deployment ID/origin (if applicable): none; local static server only
- Static inventory reference and result: fresh 448-file export, 24,247,762
  bytes; all nine repository budgets passed
- Compatibility run IDs and three-engine result: archived local source-candidate run;
  Chromium 3/3, Firefox 3/3 and WebKit 3/3 passed
- Lab CWV reports and conditions:
  `docs/release/evidence/lab-vitals-a586b44.json`; 3 cold + 3 warm per six
  routes, 390×844, 4× CPU, no network throttle
- Physical-device/network matrix reference: pending external execution
- Field source, window, eligibility and p75 values: pending; no field conclusion
- Regressions or blockers: no local harness/schema regression; physical,
  classroom-network and field evidence remain unavailable
- Reviewer and checked-at UTC: Codex local evidence run,
  `2026-08-21T02:41:51.640Z`; independent release binding review follows the
  metadata-only commit
- Overall conclusion: archived local synthetic-lab pass / final-candidate rerun
  pending / physical pending / field insufficient evidence
