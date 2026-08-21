# Static hash/SRI CSP feasibility spike

Status: planned experiment; not executed and not a release pass.

The production candidate remains a Next.js static export with the staged CSP in
`config/csp-stage.json` and `vercel.json`. It currently permits inline script
and style. The roadmap asks for an independent P2 feasibility spike into a
stricter hash/SRI policy; it does not authorize a dynamic nonce service or a
change from static hosting.

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
rollback reference here or in linked secret-free evidence files. Until those
fields exist, the truthful result is **pending**, not “strict CSP implemented.”
