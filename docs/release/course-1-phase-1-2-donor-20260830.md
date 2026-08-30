# Course 1 Phase 1+2 local donor

This note records a local, reviewable Course 1 integration donor. It is not a
release attestation and does not authorize a push, merge, Preview, promotion,
or production deployment.

## Provenance

- Integration base: `bf1fde5bb09150bde3cba7b447f71a63dec3c160`.
- Durable Phase 1+2 snapshot:
  `origin/codex/wip-main-course1-handbook-ux-a11y-20260829` at
  `ffb3259d2cfdbf87917e892b56f085bd72b5adec`.
- Snapshot tree: `b54db1cdf6e069bde3882bf01673af69e30d6daf`.
- Isolated donor branch: `codex/course-1-final-ux-a11y-20260830`.
- Separate sibling forward-link fix:
  `f2a63ee3331728b0a0659b822936c1b23db53ff8`.

The snapshot and the forward-link fix are siblings with the same integration
base. The sibling was not cherry-picked: its complete `markup.ts` would replace
the broader Phase 1+2 transformation layer, and its nine Handbook locale hunks
conflict with the snapshot. The snapshot already enforces the exact
`00→01→02→03→04→05→06→07→08→09→10` route and inverse Back route. The donor
retains that implementation and carries over only the sibling's two clearer,
beginner-oriented Next labels across all nine Handbook locale tables.

Repository-wide ref, reflog, registered-worktree, pickaxe, unreachable-object,
and dangling-object checks found no later or lost Phase 2 source/test variant.
Every distinctive completed Phase 2 behavior is present in `ffb3259d`; generated
browser/build artifacts were intentionally excluded.

## User-facing contracts preserved

- All eleven sections are required for Course 1 completion.
- A finished ten-answer run is recorded as `Assessment submitted`, including a
  zero-score run; no score is described as mastery.
- Section exploration and assessment submission remain separate progress facts.
- The recommended Continue-to-Lab action appears in the Control Room result.
- Optional teaching detail uses native progressive disclosure without hiding
  the primary route.
- Mobile/RTL navigation, keyboard-operable overflow, visible focus, contrast,
  44 px targets, print, no-JavaScript, and reduced-motion behavior remain owned
  by explicit tests.

## Additional cross-browser repair

The first full donor run reproduced missed rapid activations in Firefox and
WebKit. Capturing the pointer event path showed that smooth programmatic and
browser scroll-to-control movement could move a button between `pointerdown`
and `pointerup`, retargeting `click` to the panel behind it. The donor makes
Course 1 section/focus repositioning immediate and scopes the Handbook document
to `scroll-behavior: auto`. This leaves the rest of the site unchanged and keeps
rapid controls stationary. The previously failing paths then passed 18/18
repeated Firefox/WebKit runs before the complete browser matrix was rerun.

## Intentional file set

The implementation carries the snapshot's 45 source, configuration,
localization, and test files:

- `app/globals.css`;
- `components/MobileNav.tsx`, `components/Progress.tsx`,
  `components/courses/Catalog.tsx`, and
  `components/handbook/Handbook.tsx`;
- `config/release-readiness.json`;
- `lib/handbook/behaviour.ts`, `lib/handbook/markup.ts`, and
  `lib/progress.ts`;
- `scripts/check-widgets.mjs`;
- `tests/course-truth.test.ts`, `tests/handbook-p0.test.ts`, and
  `tests/progress.test.ts`;
- `e2e/compat.spec.ts`, `e2e/handbook-lifecycle.spec.ts`,
  `e2e/handbook-phase1.spec.ts`, `e2e/handbook-phase2.spec.ts`, and
  `e2e/smoke.spec.ts`;
- the nine locale files under each of `messages/`, `messages/handbook/`, and
  `messages/widgets/`: `ar`, `de`, `en`, `es`, `fr`, `ja`, `ko`, `zh-Hans`,
  and `zh-Hant`.

This provenance note is the only additional committed file. No `.next/`,
`out/`, Playwright output, screenshots, browser evidence, temporary diagnostic
spec, dependency directory, or private evidence belongs to the donor.

## Final local validation

The following gates passed on the isolated donor source tree and its static
export:

- repository unit tests: 250/250;
- Course 1 progress/reset subset: 38/38;
- TypeScript: exit 0 with incremental output disabled;
- ESLint: exit 0 with `--max-warnings 0`;
- Handbook extraction: 540 strings current;
- widget/localization integrity: 133 queried IDs, 0 hard-coded literals/words,
  710 call sites, and 674 keys consistent;
- Next.js 16.3.1 production build: 68 static pages;
- generated routes: 68 routes and 70 artifacts;
- static-asset budgets: all pass;
- Course 1 Phase 1, lifecycle, Phase 2, accessibility, and responsive matrix:
  78/78 across Chromium, Firefox, and WebKit;
- repeated formerly failing Firefox/WebKit interaction paths: 18/18;
- compatibility: 12/12 across Chromium, Firefox, and WebKit;
- safe smoke: 59/59 across nine locales, light/dark, mobile/desktop, and RTL;
- private-state browser contract: 14/14;
- constrained-profile resilience: 1/1;
- CSP, analytics, tracked-secret, route, asset, and Git diff checks: pass.

Manual visual spot checks covered English desktop Start plus English mobile
Start, Compare, and the submitted Control Room result. The captures remained
local ignored artifacts and are not part of the donor.

Formal release evidence remains separately pending under the repository's
fail-closed release-readiness contract.
