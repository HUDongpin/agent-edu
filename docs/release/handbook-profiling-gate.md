# Handbook rewrite profiling gate

Status: template implemented; no large Handbook rewrite is proposed or approved.

The approved roadmap does not authorize a broad Handbook rewrite merely because
one might make the code more idiomatic. Before a change that replaces the
verified imperative widget/diagram layer, changes several sections at once, or
adds a material client dependency can enter a release candidate, complete this
record against two explicit commits. A blank record is pending evidence, not a
pass.

## 1. Trigger and frozen comparison

- Problem demonstrated by a failing task, accessibility check, profile or
  maintenance incident:
- Why a local repair cannot address it:
- Before commit and clean-build identifier:
- After commit and clean-build identifier:
- Exact route/hash and locale:
- Browser/version, OS, viewport, theme and direction:
- CPU/network/cache profile, with `physical`, `emulated` or `synthetic-lab`
  label:
- Repetition count and aggregation rule:

Do not compare a warm after-build against a cold before-build, a different
browser, or a different content/catalog revision.

## 2. Before/after evidence

Record raw, secret-free evidence references rather than screenshots of summary
scores alone.

| Measure | Before | After | Method and raw evidence |
|---|---:|---:|---|
| JS transferred and executed |  |  | full `assets:check` inventory |
| Long tasks / main-thread time |  |  | browser performance profile |
| Heap after route ready and after interaction |  |  | same browser/profile |
| LCP / CLS / INP |  |  | `vitals:lab` plus any physical evidence |
| Handbook route-ready time |  |  | named readiness marker |
| Target interaction latency |  |  | named widget and input sequence |
| Keyboard/a11y task result |  |  | same deterministic and human matrix |
| Layout/diagram regression result |  |  | Handbook/widget/browser gates |

For a performance claim, report every raw run and the stated median; do not
select only the best sample. Local synthetic measurements do not become field
Core Web Vitals or a physical-device result.

## 3. Decision and rollback

- Expected learner or maintenance benefit:
- New dependency/runtime/translation/security surface:
- Regressions and uncertainty:
- Minimum material improvement agreed before measuring:
- Decision: reject / revise / accept:
- Independent reviewer:
- Rollback commit or ordinary revert plan:
- Post-merge observation window and abort condition:

Acceptance requires a demonstrated problem, a comparable before/after record,
no loss of task-equivalent non-visual content, and a recoverable rollback. This
template does not itself approve a rewrite.
