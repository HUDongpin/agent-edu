# MCP Course 10 browser and release QA

Verified: 2026-08-30 (Asia/Taipei)<br>
Course release: `1.0.0`<br>
Core protocol target: MCP `2026-07-28`<br>
Assessment version: `2026-07-28-v2`<br>
Canonical English course: `https://aicourse.top/en/mcp/`

## Acceptance result

Course 10 passes its source, localization, rights, static-export, accessibility, interaction, responsive-layout, recovery-state, and browser acceptance gates. The final static build generated 737 site pages; the MCP-specific export audit accepted all 171/171 MCP HTML files, both referenced local CSS files, all 171/171 MCP sitemap URLs, all 8/8 provenance-checked figures, every downloadable evidence artifact, and the freshness boundary. The final Playwright release run passed 58/58 Playwright executions.

The accepted course contains:

- 5 units and 18 lessons totaling 1,075 minutes (17 h 55 min, presented as about 18 hours);
- 48 concepts covering current core primitives, production practices, independent extensions, and explicitly marked removed/deprecated material;
- 71 sources and 12 high-risk claim mappings;
- 8 real interface figures: six first-party MCP Inspector documentation interfaces, one reproducible Gemini CLI interface, and one reproducible OpenAI Codex CLI interface;
- 18 lesson-level formative checks and an independent 18-scenario summative assessment;
- a 10-part capstone evidence contract and a 12-case adversarial test matrix; and
- complete instructional bundles for English, Spanish, French, German, Simplified Chinese, Traditional Chinese, Japanese, Korean, and Arabic.

No push, merge, Preview, deployment, or Course 3 edit was performed as part of this acceptance. The accepted Course 10 candidate is persisted as one local review commit for later integration by separate authority.

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
| `npm run mcp:check:release` | PASS; 9 bundles × 1,133 localized string leaves, 5 units, 18 lessons, 48 concepts, 71 sources, 12 claim mappings, 8 figures, 18 summative scenarios |
| `npm run typecheck` | PASS; exact final TypeScript graph checked without incremental state |
| `npm run lint` | PASS; zero errors and zero warnings across `app`, `components`, `lib`, and `scripts` |
| `npm test` | PASS; 345/345 unit and repository contract tests |
| `npm run progress:check` | PASS; shared storage, event, reset, adapter, and bundle boundaries remain closed |
| `npm run build` | PASS; 737 static pages generated, followed by 62 sitemap shards; largest shard 21,785 bytes |
| `npm run mcp:audit:export` | PASS; 171/171 MCP HTML files, 2 local CSS files, 171/171 sitemap URLs, 8/8 figures, fresh output |
| `npm run test:mcp:export` | PASS; 58/58 Playwright executions |
| `git diff --check` | PASS; no whitespace errors in the exact candidate patch |
| `npm test --prefix tests/fixtures/mcp-courseops` | PASS; 8/8 protocol tests |
| `npm run client --prefix tests/fixtures/mcp-courseops` | PASS; five expected JSON-RPC responses including one deliberate revision conflict |
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

Each translation bundle has the exact English key/array shape, 1,133 checked localized leaves, 18 formative and 18 summative four-option scenarios, unchanged answer ordering, preserved placeholders and protocol literals, and no leaked translation sentinels. Arabic has no unsafe bidi controls. Structured dates, publishers, technical controls, the embedded Inspector/Gemini/Codex pixel surfaces, and protocol identifiers remain LTR inside Arabic RTL teaching prose.

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

The authoritative Playwright inventory contains 54 Chromium executions, two Firefox smoke executions, and two WebKit smoke executions. The four non-Chromium runs validate the dashboard, a real host-evidence lesson, native lazy-image decoding, lesson completion across reload, assessment-fragment focus, runtime errors, request failures, and HTTP failures. Chromium carries the deeper interaction and accessibility matrix; the report does not overstate the Firefox/WebKit scope as full parity testing.

Accepted behavior includes:

- all 171 routes and all nine localized dashboards;
- eight masters and sixteen responsive figure derivatives, plus no-JavaScript image/caption delivery;
- interactive architecture, current-envelope, tool-contract, and four-case risk workbenches;
- keyboard activation, mutually exclusive `aria-pressed` state, named groups, fragment focus transfer, full mobile lesson navigation, and completion undo;
- an axe-core WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA scan of the dashboard, submitted assessment, all four lab lessons, capstone/extension lesson, and Arabic host-evidence lesson;
- 320, 390, 768, and 1,440 px layout checks for the dashboard, interactive code, host figures, capstone, RTL page, and known long German/Japanese routes, with no document overflow;
- keyboard-scrollable code, structured Arabic bidi isolation, and an assistive-text equivalent for both architecture transports;
- local-storage denial, quota-denied reset, cross-tab updates, and cross-locale continuity while preserving readable lesson and evidence content;
- localized canonical, reciprocal hreflang, JSON-LD, sitemap, and download delivery; and
- runtime watchers requiring zero console errors, uncaught page errors, unexpected request failures, and HTTP error responses.

The test harness itself was corrected during QA. Runtime cleanliness now binds expected Next prefetch cancellations to the actual page origin, so the random-port static export server is not mistaken for the fixed development origin. Figure tests select the local image link rather than the separate first-party-source link; state tests count pressed buttons at the correct DOM level; and native lazy images are scrolled into view before decode assertions. The exact final static-export run passed 58/58 executions.

Visual review caught a usability issue that overflow automation could not: at 390 px the full 18-lesson rail originally appeared before the lesson body. The final CSS replaces that rail with a compact native disclosure containing the complete keyboard-navigable 18-lesson index, so the initial view begins with the breadcrumb, compact index, evidence badges, lesson title, summary, concepts, and objective. The persistent desktop rail remains visible on larger screens.

## Assessment, capstone, progress, and failure behavior

The independent final assessment enforces an 80% gate: 14/18 fails and 15/18 passes. The browser suite verifies all 18 visible controls, focus on the result region, retry behavior, fail-closed validation of version/best/pass state, normalization of unknown or incomplete persisted draft answers, a best score that cannot decrease, and a pass that cannot be erased by a later failed retry. Version-bound answers and submitted review state survive refresh, mapped-lesson review, browser Back, and locale changes; focus returns to the originating feedback item. Formative and summative displayed-answer distributions are both balanced 5/5/4/4 across the four positions.

Capstone completion remains disabled until all ten evidence classes are checked, then persists across reload. The evidence pack includes builder and auditor tracks, the same ten evidence classes, a 12-row adversarial matrix, exact version fields, limitations, recovery/disable evidence, and localized packs for all nine languages. The self-attestation is explicitly not represented as an independently verified credential.

MCP progress reset removes only `mcp.*` keys. The regression fixture proves that GitHub lesson/quiz/capstone keys, Codex progress, and unrelated local state survive. Reset defaults focus to Cancel, restores focus on Escape, distinguishes persisted success from quota/write failure, and never reports a destructive success when the shared record remains. If local storage is denied or corrupt, lesson content, real figures, exercises, assessment guidance, and capstone guidance remain usable without pretending that progress will persist.

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

The capture paths below identify reproducible local QA output and are not
versioned release inputs. Their dimensions, hashes and inspection conclusions
remain in this audit ledger; a fresh browser run must regenerate any pixels
needed for a new review.

| Capture | Dimensions | SHA-256 | Inspection result |
| --- | ---: | --- | --- |
| `output/playwright/course10-final-visual/.playwright-cli/page-2026-08-30T04-15-48-917Z.png` | 1440×1000 | `cc523b6f3bee3ae04132c46c16fcbb7da0446921d4098c3f91cd90801c3f5d6a` | Dark-mode dashboard preserves the concise hierarchy, first-viewport progress action, evidence boundary, and sticky course navigation. |
| `output/playwright/course10-iteration1/.playwright-cli/page-2026-08-30T03-27-22-656Z.png` | 390×844 | `05c7732ba6eb59d235a5c6120a656be571cdd68543548341ad7c7c54fa739da4` | Phone dashboard exposes the primary Start/Resume action inside the initial viewport without clipping or document overflow. |
| `output/playwright/course10-iteration1/.playwright-cli/page-2026-08-30T03-28-11-273Z.png` | 390×844 | `ac74da49a55a7dd4f4cb621b18f83359e5d01c6bd844e4f6438b1eff407ffd75` | Phone lesson exposes the compact complete-course index, title, concepts, and objective in a learning-first sequence. |
| `output/playwright/course10-final-visual/.playwright-cli/page-2026-08-30T04-16-01-329Z.png` | 1280×720 | `667b11f8b0f8aca61d090b30db58ff7cb47c3002164d562990f7a5491868f398` | Arabic dashboard preserves RTL layout while structured MCP/date/progress values remain directionally stable. |

All four captures were generated from the local Course 10 candidate during visual QA and inspected at original resolution. They are not versioned release inputs; behavioral acceptance is bound by the 58-test exported-site run.

## Residual boundaries

- The eight translated editions have detailed automated structure, terminology, assessment, protocol, rights, and bidi review, but no native-speaker human linguistic review is claimed.
- Firefox and WebKit receive explicit real-image/runtime smoke coverage; the full interaction, axe, persistence, and viewport matrix runs in Chromium.
- Six first-party source pages required manual verification because their providers did not permit the automated fetch. Their continued future availability is outside the repository’s control.
- The raw Next development `/sitemap.xml` is 769,784 bytes and exceeds the repository's 500 KiB single-file cap. The release build replaces it with 62 shards (largest 21,785 bytes), and the exported sitemap gate passes; development-sitemap maintenance remains a separate platform task.
- Browser QA validates the generated static export locally. This task did not authorize or perform production deployment, so no claim is made about a deployed CDN response, production analytics, or post-deployment monitoring.
