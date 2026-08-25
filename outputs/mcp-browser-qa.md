# MCP Course 10 browser and release QA

Verified: 2026-08-24 (Asia/Taipei)  
Course release: `1.0.0`  
Core protocol target: MCP `2026-07-28`  
Assessment version: `2026-07-28-v2`  
Canonical English course: `https://aicourse.top/en/mcp/`

## Acceptance result

Course 10 passes its source, localization, rights, static-export, accessibility, interaction, responsive-layout, and browser acceptance gates. The final static build generated 1,841 site pages; the MCP-specific export audit accepted all 171/171 MCP HTML files, both referenced local CSS files, all 171/171 MCP sitemap URLs, all 8/8 provenance-checked figures, every downloadable evidence artifact, and the freshness boundary. The final Playwright release run passed 42/42 Playwright executions.

The accepted course contains:

- 5 units and 18 lessons totaling 1,075 minutes (17 h 55 min, presented as about 18 hours);
- 48 concepts covering current core primitives, production practices, independent extensions, and explicitly marked removed/deprecated material;
- 71 sources and 12 high-risk claim mappings;
- 8 real interface figures: six first-party MCP Inspector documentation interfaces, one reproducible Gemini CLI interface, and one reproducible OpenAI Codex CLI interface;
- 18 lesson-level formative checks and an independent 18-scenario summative assessment;
- a 10-part capstone evidence contract and a 12-case adversarial test matrix; and
- complete instructional bundles for English, Spanish, French, German, Simplified Chinese, Traditional Chinese, Japanese, Korean, and Arabic.

No commit, push, merge, deployment, or Course 3 edit was performed as part of this acceptance.

## Version and authority boundary

The course freezes three evidence layers instead of merging them into one misleading chronology:

1. **Current core:** normative protocol claims target the MCP `2026-07-28` core specification. The course teaches stateless discovery, per-request protocol/capability metadata, the current result model, current transports, capability primitives, authorization, security, lifecycle, and production operation against that version.
2. **Independently versioned extensions:** MCP Apps is recorded as **Stable** at its frozen `2026-01-26` specification. Tasks remains **Draft** at revision `e434597`. Enterprise-Managed Authorization is **Stable**, while OAuth Client Credentials remains **Draft**, at the frozen authorization-extension revision `fb374c7`. Extension maturity is never inferred from the core date.
3. **Legacy or dated tutorials/UI:** older initialization, dynamic-client-registration, SSE, sampling/roots/notification, and host-UI examples remain useful only as visibly dated workflow or diagnostic evidence. They are not presented as current `2026-07-28` wire templates.

One subtle transport correction is explicitly preserved across all nine languages: current core defines no client-to-server notification over **Streamable HTTP**; the client-sent core notification `notifications/cancelled` is used on `stdio`. A valid notification POST defined by a negotiated extension or custom method receives `HTTP 202 Accepted` with no body and no JSON-RPC response object.

## Source and link audit

The 71-source ledger contains:

| Publisher class | Records |
| --- | ---: |
| Model Context Protocol | 45 |
| Anthropic | 5 |
| OpenAI | 7 |
| Google | 6 |
| GitHub | 4 |
| Community projects | 4 |

Normative claims are mapped to first-party MCP specification pages. Anthropic and OpenAI Academy materials are treated as dated educational guidance, not normative protocol authority. Google/OpenAI/Claude product guidance is bounded to the named product, version, account path, and observation date. GitHub issues, discussions, repositories, and demos are labeled as bounded implementation or practitioner evidence; no prevalence claim is inferred from a single report.

`npm run mcp:check:links` attempted all 71 distinct source and figure URLs. Sixty-five were machine-retrievable. Six first-party pages rejected or interrupted the automated fetch because of provider access controls; each was manually verified during the 2026-08-24 evidence audit:

- Claude Academy, Introduction to Model Context Protocol;
- Claude Academy, Model Context Protocol: Advanced Topics;
- Claude Support, Getting started with local MCP servers on Claude Desktop;
- Claude Code MCP documentation;
- OpenAI, MCP documentation for extending ChatGPT/Codex surfaces; and
- Claude Support, custom connectors using remote MCP.

The link gate therefore reports six transparent availability warnings rather than misclassifying provider anti-bot behavior as either a broken source or an automated pass. No known source URL is broken at the frozen evidence date.

## Deterministic release matrix

| Check | Final result |
| --- | --- |
| `npm run mcp:check:release` | PASS; 9 bundles × 1,131 localized string leaves, 5 units, 18 lessons, 48 concepts, 71 sources, 12 claim mappings, 8 figures, 18 summative scenarios |
| `npx tsc --noEmit --pretty false` | PASS; includes the corrected `InteractiveLab` architecture-state union |
| Focused MCP ESLint | PASS; zero errors and zero warnings |
| `env -u VERCEL npx next build` | PASS; 1,841 static pages generated; analytics remained disabled outside Vercel production |
| `npm run mcp:audit:export` | PASS; 171/171 MCP HTML files, 2 local CSS files, 171/171 sitemap URLs, 8/8 figures, fresh output |
| `npm run test:mcp:export` | PASS; 42/42 Playwright executions in 1.2 minutes |
| `npm test --prefix examples/mcp-courseops` | PASS; 8/8 protocol tests |
| `npm run client --prefix examples/mcp-courseops` | PASS; five expected JSON-RPC responses including one deliberate revision conflict |
| `unzip -t public/courses/mcp/courseops-reference.zip` | PASS; no compressed-data error |
| CourseOps archive SHA-256 | `b4bf8ee63fa8ac18fb7c7527c6d1a9de2b0064323ef7c8e8a6a0f676066275ea` |
| `npm run github:check:release` | PASS; Course 6 remains 12 lessons, 660 minutes, 9 locales, 44 sources, 21 authentic figures, and a 24-question bank |

The fixture suite verifies discovery, mandatory cache hints, per-request capability envelopes, legal JSON-RPC request IDs, structured normal/error tool results, schema rejection, valid notification silence, dry-run behavior, and exact-revision writes. Its client trace returns discovery, tool inventory, read, expected `REVISION_CONFLICT`, and resource-read results without secrets or network access.

## Static routes, localization, RTL, and metadata

The release contains exactly 19 MCP pages per locale—one dashboard and 18 lessons—for 171 localized routes. Every route returned HTTP 200, exposed one `main` and one `h1`, declared the correct `html[lang]`, and used `dir="rtl"` only for Arabic. Every non-English dashboard title differs from the English source title; Arabic contains Arabic-script instructional copy rather than the retired English fallback.

Every page exposes:

- a locale-specific canonical URL;
- reciprocal alternates for all nine locales plus `x-default` to English;
- localized `Course` or `LearningResource` JSON-LD with the matching `inLanguage`; and
- visible MCP `2026-07-28` and evidence snapshot `2026-08-24` badges.

Each translation bundle has the exact English key/array shape, 1,131 checked localized leaves, 18 formative and 18 summative four-option scenarios, unchanged answer ordering, preserved placeholders and protocol literals, and no leaked translation sentinels. Arabic has no unsafe bidi controls. The embedded Inspector/Gemini/Codex pixel surfaces and protocol identifiers remain LTR inside Arabic RTL teaching prose.

Translation provenance is intentionally conservative. English is the authored source. The other eight bundles retain `translationMethod: "machine-translated"` and `reviewStatus: "automated-structure-and-terminology-reviewed"`; their visible locale notes do not claim human linguistic review. Detailed bilingual semantic review corrected high-impact authorization/authentication/approval distinctions, assessment polarity, transport notification wording, extension maturity, and rights-layer terminology, but this does not substitute for a native-speaker human editorial sign-off.

## Real interface evidence and rights

The public figure inventory contains 24 delivery files: eight preserved PNG masters and sixteen responsive WebP derivatives. At narrow viewports the browser selects a 960×540 WebP; at desktop width it selects a 1600×900 WebP. Every selected image decoded to a non-zero natural size, remained same-origin, retained a visible caption and teaching boundary with JavaScript disabled, and matched the path/dimensions/SHA-256 recorded in `figure-manifest.json`.

Rights are layered rather than collapsed:

- **Inspector (6 figures):** first-party MCP documentation UI from immutable documentation commit `e24f0099b60f7c00e165a0faa02a72029d2fa654`, reused under CC BY 4.0 with attribution and transformation records.
- **Gemini CLI 0.56.0:** course-authored terminal capture of a synthetic local configuration. The capture layer is offered under the course MIT license; the visible Gemini CLI interface/output remains subject to the pinned upstream Apache-2.0 license and provider trademark terms. The Everything reference server is pinned to `@modelcontextprotocol/server-everything@2026.8.18`, with tarball integrity recorded and the no-lockfile transitive reproducibility limit disclosed.
- **OpenAI Codex CLI 0.149.1:** course-authored terminal capture of a synthetic configuration. The course layer is MIT; the visible Codex interface/output remains Apache-2.0 with the exact upstream NOTICE retained locally. The wrapper and native executable hashes, platform artifact, capture-time boundary, and no-endorsement limit are recorded.

The two host captures passed internal rights and privacy review for course release. That internal decision is not described as Google/OpenAI provider authorization, affiliation, or endorsement. Raw captures remain outside `public/`; public crops remove the window chrome and user name, contain no live credential, and disclose synthetic placeholders. Two unresolved candidate records remain explicitly `not-distributed` rather than being silently published.

Key integrity digests:

| Record | SHA-256 |
| --- | --- |
| `figure-manifest.json` | `2c0098883f79e493be966317ad02f1cea921becf5acc0e4d4fc74310845dee1b` |
| `NOTICE.md` | `ffe2439751c66611a69f9ea01cbb3548443d8874f41a7e61152517a928511096` |
| `licenses/APACHE-2.0.txt` | `73ba74dfaa520b49a401b5d21459a8523a146f3b7518a833eea5efa85130bf68` |
| `licenses/CODEX-NOTICE.txt` | `e1009277af02b0de8794d34a676f988d029c9c4012e131c99d0effd5dba82c66` |

The course dashboard exposes all four rights/provenance records to learners as local links.

## Browser, interaction, and accessibility acceptance

The authoritative Playwright inventory contains 40 Chromium executions, one Firefox smoke execution, and one WebKit smoke execution. The two non-Chromium runs validate the dashboard, a real host-evidence lesson, native lazy-image decoding, runtime errors, request failures, and HTTP failures. Chromium carries the deeper interaction and accessibility matrix; the report does not overstate the Firefox/WebKit scope as full parity testing.

Accepted behavior includes:

- all 171 routes and all nine localized dashboards;
- eight masters and sixteen responsive figure derivatives, plus no-JavaScript image/caption delivery;
- interactive architecture, current-envelope, tool-contract, and four-case risk workbenches;
- keyboard activation, mutually exclusive `aria-pressed` state, named groups, focus transfer, and lesson navigation;
- an axe-core WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA scan of the dashboard, submitted assessment, all four lab lessons, capstone/extension lesson, and Arabic host-evidence lesson;
- 320, 390, 768, and 1,440 px layout checks for the dashboard, interactive code, host figures, capstone, and RTL page, with no document overflow;
- local-storage denial while preserving readable lesson and evidence content;
- localized canonical, reciprocal hreflang, JSON-LD, sitemap, and download delivery; and
- runtime watchers requiring zero console errors, uncaught page errors, unexpected request failures, and HTTP error responses.

The test harness itself was corrected during QA. Figure tests now select the local image link rather than the separate first-party-source link; state tests count pressed buttons at the correct DOM level; and native lazy images are scrolled into view before decode assertions. WebKit navigation waits for dashboard prefetches to settle instead of masking real request failures. Eight consecutive targeted WebKit repetitions passed before the final 42/42 release run.

Visual review caught a usability issue that overflow automation could not: at 390 px the full 18-lesson rail originally appeared before the lesson body. The final CSS hides that long rail at phone width so the initial view begins with the breadcrumb, evidence badges, lesson title, summary, concepts, and objective. Phone learners retain the course-dashboard breadcrumb and previous/next pager; the full rail remains visible on larger screens.

## Assessment, capstone, progress, and failure behavior

The independent final assessment enforces an 80% gate: 14/18 fails and 15/18 passes. The browser suite verifies all 18 visible controls, focus on the result region, retry behavior, a best score that cannot decrease, and a pass that cannot be erased by a later failed retry. Formative and summative displayed-answer distributions are both balanced 5/5/4/4 across the four positions.

Capstone completion remains disabled until all ten evidence classes are checked, then persists across reload. The evidence pack includes builder and auditor tracks, the same ten evidence classes, a 12-row adversarial matrix, exact version fields, limitations, recovery/disable evidence, and localized packs for all nine languages. The self-attestation is explicitly not represented as an independently verified credential.

MCP progress reset removes only `mcp.*` keys. The regression fixture proves that GitHub lesson/quiz/capstone keys, Codex progress, and unrelated local state survive. If local storage is denied, lesson content, real figures, exercises, and completion-status guidance remain usable without pretending that progress will persist.

## Local downloads accepted

The browser and byte-for-byte export audits accepted these same-origin artifacts:

- the generic and nine localized capstone evidence packs;
- `courseops-reference.zip` and its checksum sidecar;
- `figure-manifest.json` and `NOTICE.md`;
- the complete local Apache 2.0 license; and
- the exact Codex upstream NOTICE.

The exported bytes match their `public/` source bytes. The CourseOps archive checksum is `b4bf8ee63fa8ac18fb7c7527c6d1a9de2b0064323ef7c8e8a6a0f676066275ea`.

## Course 6 additive-integration regression

The protected GitHub course remains intact after Course 10 registration. The final shared-file audit preserves `loadGithubCourse`, `courseSixParts`, and `github: courseSixParts` in the course-directory structured data; `github` was not replaced with an empty array. The dedicated gate passes with 12 lessons, 660 minutes, 9 locales, 44 sources, 21 authentic figures, and a 24-question bank. Course 10 is registered separately as `mcp`/Course 10 in the catalogue, cover, shell, SEO registry, sitemap, root messages, progress registry, and structured-data map.

## Visual inspection artifacts

| Capture | Dimensions | SHA-256 | Inspection result |
| --- | ---: | --- | --- |
| `outputs/mcp-browser-qa-screenshots/en-dashboard-1440x1100.png` | 1440×1100 | `27a285b20f29d7985afb05ab058eeb8a7cf52a29a7adedf83badee3ca79e98a2` | Clear evidence-first hierarchy; 18 lessons, 17 h 55 min, 8 figures, 48 concepts, protocol version, and evidence date are legible above the fold. |
| `outputs/mcp-browser-qa-screenshots/en-tools-mobile-390x844.png` | 390×844 | `24137dcc85bee0fa3f4b60d6fffbd444a70d75b7ea298135839dd353532ff5bc` | Learning-first phone layout after the rail correction; no clipping, horizontal overflow, or hidden evidence badge. |
| `outputs/mcp-browser-qa-screenshots/ar-host-evidence-rtl.png` | 1440×1100 | `41747fc351fcce5a24820f3f20de620d984aa3a51ce5d547e6a852ba1a1aba79` | Arabic shell, rail, headings, captions, and teaching notes flow RTL; the Gemini/Codex terminal pixels and identifiers remain correctly LTR. |

All three captures were generated from the accepted local static export and visually inspected at original resolution.

## Residual boundaries

- The eight translated editions have detailed automated structure, terminology, assessment, protocol, rights, and bidi review, but no native-speaker human linguistic review is claimed.
- Firefox and WebKit receive explicit real-image/runtime smoke coverage; the full interaction, axe, persistence, and viewport matrix runs in Chromium.
- Six first-party source pages required manual verification because their providers did not permit the automated fetch. Their continued future availability is outside the repository’s control.
- Browser QA validates the generated static export locally. This task did not authorize or perform production deployment, so no claim is made about a deployed CDN response, production analytics, or post-deployment monitoring.
