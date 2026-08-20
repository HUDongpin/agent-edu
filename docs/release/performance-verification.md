# Performance and compatibility verification

This protocol keeps three kinds of evidence separate. A static byte inventory is
not a Core Web Vitals result, an emulated browser is not a physical low-end
device, and a local Lighthouse run is not field data.

## 1. Deterministic static-asset inventory

Run against a clean, freshly built release commit:

```bash
npm ci
npm run build
npm run assets:check > static-assets.json
```

`assets:check` emits a sorted JSON inventory of every file below
`out/_next/static`, aggregate JavaScript/CSS/total bytes, the largest asset, and
the explicit budget decision. It contains no clock time or machine-specific
absolute path, and normalizes Next's per-build identifier, so repeated builds
of the same source are auditable and diffable.

The initial limits are based on release candidate `60f7edc` with approximately
31–43% headroom:

| Measure | Baseline bytes | Limit bytes |
|---|---:|---:|
| All `_next/static` assets | 2,055,566 | 2,750,000 |
| JavaScript | 1,985,800 | 2,650,000 |
| CSS | 69,766 | 100,000 |
| Largest single asset | 229,156 | 300,000 |

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

For lab Web Vitals, use the frozen release commit and built static server. Record:

- commit SHA, Node/Next/browser versions and operating system;
- cold versus warm-cache run;
- route, viewport and network/CPU emulation settings;
- at least three runs per Home, Handbook, Lab, Build, Teach and 404 route;
- individual and median LCP/CLS results and a scripted interaction for INP;
- the raw sanitized report reference, not only a screenshot of a score.

A delayed Playwright route or browser CPU/network emulation is useful for
repeatable regression testing, but label it **emulated lab evidence**. Do not
describe it as a classroom network or low-end-device result.

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
