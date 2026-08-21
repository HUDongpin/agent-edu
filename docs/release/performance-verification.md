# Performance and compatibility verification

This protocol keeps three kinds of evidence separate. A static byte inventory is
not a Core Web Vitals result, an emulated browser is not a physical low-end
device, and a local Lighthouse run is not field data.

## 1. Deterministic static-asset inventory

Run against a clean, freshly built release commit:

```bash
npm ci
npm run build
npm run --silent assets:check > static-assets.json
```

`assets:check` emits a sorted JSON inventory of every file below `out/`. It
separates Next chunks, byte-for-byte copies of `public/`, and generated route
HTML/RSC/text payloads; it also verifies that every public source asset was
actually emitted unchanged. The inventory contains no clock time or
machine-specific absolute path and normalizes Next's per-build identifier, so
repeated builds of the same source are auditable and diffable. This closes the
blind spot where large Open Graph images or duplicated localized route payloads
could grow while an `_next/static`-only total stayed green.

The initial limits are based on release candidate `60f7edc` with
30.9–47.5% headroom. Values are uncompressed bytes in the exported files, not
HTTP transfer sizes after content encoding:

| Measure | Baseline bytes | Limit bytes |
|---|---:|---:|
| All `_next/static` assets | 2,055,566 | 2,750,000 |
| JavaScript | 1,985,800 | 2,650,000 |
| CSS | 69,766 | 100,000 |
| Largest `_next/static` asset | 229,156 | 300,000 |
| Emitted `public/` assets | 1,136,379 | 1,600,000 |
| Largest emitted public asset | 373,193 | 500,000 |
| Generated route payloads | 20,978,583 | 30,000,000 |
| Largest route payload | 338,889 | 500,000 |
| Complete exported site | 24,141,664 | 34,000,000 |

These are regression budgets, not claims that the current payload is optimal.
Change a limit only in a review that records the before/after inventory and why
the additional bytes are proportionate. Never raise a limit merely to make CI
green.

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
`docs/release/csp-hash-sri-spike.md`. That spike is pending and preserves the
static-export boundary; it does not authorize a dynamic nonce service or imply
that hash/SRI enforcement has been deployed.

## Evidence record

- Release commit:
- Deployment ID/origin (if applicable):
- Static inventory reference and result:
- Compatibility run IDs and three-engine result:
- Lab CWV reports and conditions:
- Physical-device/network matrix reference:
- Field source, window, eligibility and p75 values:
- Regressions or blockers:
- Reviewer and checked-at UTC:
- Overall conclusion: local pass / physical pass / field pass / insufficient evidence
