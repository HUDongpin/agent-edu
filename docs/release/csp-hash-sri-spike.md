# Static hash/SRI CSP feasibility spike

Status: local feasibility experiment executed and failed closed; not a release
pass and not an enforcement authorization.

The production candidate remains a Next.js static export with the staged CSP in
`config/csp-stage.json` and `vercel.json`. It currently permits inline script
and style. The roadmap asks for an independent P2 feasibility spike into a
stricter hash/SRI policy; it does not authorize a dynamic nonce service or a
change from static hosting.

## Executed local result

The isolated experiment ran against clean product commit
`a586b44a6b58bf209864d2cd9529bb9adff12012`. The sanitized decision record is
`docs/release/evidence/csp-hash-sri-spike-a586b44.json`; the route-level,
privacy-safe violation counts are in
`docs/release/evidence/csp-report-only-observation-a586b44.json`. Neither file
contains the generated policy, credentials, Prompts, replies or Provider
bodies.

Two clean static builds with `next.experimental.sri` and SHA-256 produced
different random build IDs and export hashes but the same normalized inventory
SHA-256, `4517b7e613dd8dff8947b1b032762636eaffa7f57046cb85d02824f81417998d`.
That closes the documented BUILD_ID normalization question. It does not make
the policy suitable for release:

- only 6 of 14 emitted external scripts had SHA-256 integrity metadata, and
  the one emitted stylesheet had none;
- the global candidate needed 122 inline-script hashes, 135 static
  style-attribute hashes, 65 distinct route authorization sets and 14,204
  header bytes; its platform-header fit was not asserted locally;
- after hashes were placed in their applicable script/style directives, local
  report-only runs over 15 routes and all nine locales produced 145
  `style-src-attr` violations in each of Chromium, Firefox and WebKit. All 435
  observations had report disposition and inline blocked category. Main route
  statuses, visibility and page-error counts remained clean, but an enforced
  version would reject required runtime styles.

Provider behavior was exercised only through the repository's mocks (14/14
private tests); no real key or Provider request was used. The Analytics source
gate checked 61 files. The compatibility suite passed 3/3 in each of Chromium,
Firefox and WebKit under report-only. Because the violation and SRI fail-closed
conditions were already met, no enforced preview was attempted.

The experimental SRI setting was removed. The ordinary static configuration
then passed `csp:check`, a fresh 68-page build, 70 route-artifact checks, all
nine asset budgets and the three-engine compatibility suite (9/9). The release
candidate therefore retains the existing staged report-only CSP; a future
strict hash/SRI design requires architectural remediation and a separately
reviewed spike.

The bundled Next.js 16 documentation establishes two boundaries used here:

- a request-unique nonce requires dynamic rendering because static output has
  no incoming request from which Next can propagate a nonce; and
- App Router SRI is experimental, operates at build time and adds integrity
  attributes to emitted JavaScript. It does not by itself prove that every
  inline bootstrap script, inline style block or style attribute is covered by
  a deployable CSP header.

## Spike question

Can one clean static build produce a stable, reviewable and hostable policy that
removes `unsafe-inline` without changing the product architecture, losing
Analytics disclosure, breaking hydration/navigation, or creating an
unmaintainable header?

## Isolated experiment

Run this only on a throwaway branch from a frozen candidate:

1. Record commit, Node/Next versions and current `csp:check`, build, route,
   smoke, compatibility and asset results.
2. Enable Next's experimental App Router SRI with one recorded algorithm. Do
   not change runtime hosting or introduce Proxy/middleware.
3. Build twice from clean state. Inventory every emitted external script,
   `integrity` attribute, inline script, inline style block and inline style
   attribute across all route HTML. Normalize only the documented random build
   identifier; identical payloads must produce identical hashes.
4. Generate a candidate policy from exact build bytes. Report the number of
   unique hashes and the final header byte length. Any per-route difference
   must be represented explicitly; do not silently use one route's hashes for
   all routes.
5. Verify that no source, analytics or Provider origin was widened and that
   `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` and the
   current connection boundaries remain intact.
6. Serve the exact export with the candidate header in report-only mode. Run
   route, nine-language smoke, Provider-mock, Analytics source, and all three
   browser suites; collect only privacy-safe CSP violations.
7. If report-only is clean, use a different preview deployment for enforcement
   and repeat the same suite. A local header/parser result cannot substitute
   for these two deployment stages.
8. Revert the experimental configuration and prove the ordinary rollback.

## Fail-closed decision record

The spike fails if any of the following is true:

- hashes differ across equivalent clean builds without a documented cause;
- an emitted executable script or required style has no reviewed authorization;
- the policy needs wildcard script/style origins or reintroduces
  `unsafe-inline` under another label;
- the hosting header cannot represent the route set within verified platform
  limits;
- hydration, client navigation, Analytics disclosure, Lab Provider mocks,
  keyboard/a11y behavior or static export regress;
- the experiment requires a dynamic nonce service, request-time rendering,
  account/session infrastructure or another roadmap non-goal.

Record before/after commits, normalized inventories, policy bytes, browser
matrix, report-only/enforced deployment references, violations, decision and
rollback reference here or in linked secret-free evidence files. For this
candidate the local spike result is **failed closed**, not “strict CSP
implemented.” The separate P0 Vercel report-only observation and later enforced
preview remain external pending and must follow their staged release gate.
