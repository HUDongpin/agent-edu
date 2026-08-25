# Cursor Course 4 — verification and correction report

Date: 2026-08-24 (resumed final acceptance; initial correction pass completed 2026-08-23)  
Course: **How to Use Cursor**  
Scope: Course 4 product namespaces plus read-only verification of its completed shared integration

## Outcome

Course 4 is technically implemented and integrated for development and internal review. The current curriculum, all nine product-local locale bundles, authentic first-party Cursor UI media, source ledger, assessment logic, isolated progress adapter, capstone contract, metadata, structured data, sitemap coverage, accessibility behavior, and responsive layouts pass Course 4's development checks.

Course 4 is **not yet cleared for public production release**. All 14 authentic Cursor figures are technically available, integrity-checked, privacy-reviewed, and attributed, but each remains `rights-review-required`. The product manifest is therefore `publicationStatus: "rights-gated"` with `publishedOn: null`. The strict release command intentionally fails until an evidence-bearing publication basis is reviewed for every exact derivative. This is an evidence and release-control boundary, not a legal conclusion.

Shared integration is already additive and complete: Cursor is Course 4 in the ordered catalogue; all 135 localized Cursor URLs are in the sitemap contract; catalogue structured data includes all 14 localized lesson parts; the global reset awaits Cursor's isolated reset adapter while preserving other courses' handlers; and both production build chains contain the strict Cursor release check. Shared catalogue `status: "available"` means the routes are integrated and linkable; it does not override the product-local publication-rights state.

## Verified inventory

| Contract | Verified value |
| --- | ---: |
| Units | 4 |
| Lessons | 14 |
| Study time | 800 minutes (about 13 hours 20 minutes) |
| Practices | 14 |
| Question bank | 28 questions |
| Final quiz | 12 questions, exactly 3 per unit |
| Passing score | 10/12 |
| Quiz identity | stable `a`/`b`/`c`/`d` option IDs, bank version 2 |
| Authentic figures | 14 |
| Local figure files | 42: PNG masters plus 1600 px and 960 px WebP derivatives |
| Source ledger | 50 records, all used |
| Official sources | 34 official documentation/product records and 4 official blog/changelog records |
| Practitioner sources | 11 revision-pinned community GitHub records |
| Course artifact sources | 1 |
| Capstone ZIP members | 17 |
| Progress milestones | 16: 14 lesson flags + strict final-quiz pass + current capstone pass |
| Locales | en, es, fr, de, zh-Hans, zh-Hant, ja, ko, ar |
| Publication state | `rights-gated`; no publication date |
| Figure rights state | 14/14 `rights-review-required` |

## Content and evidence corrections completed

### Current Cursor behavior

- Distinguished command-based pre-action Hooks, which can deterministically allow or deny supported actions, from prompt-based Hooks, which are model-evaluated. The course now states that failures are fail-open by default unless tested `failClosed` behavior is configured.
- Removed the assumption that local Hook behavior transfers uniformly to Cloud Agents.
- Corrected Inline Edit guidance: the selection identifies the requested edit target, but it is neither an access/security boundary nor proof that unselected nearby code is supplied as context.
- Corrected Subagent guidance: `readonly` blocks built-in write tools but does not remove inherited write-capable MCP or other external tools.
- Added the Browser state boundary that cookies and web storage persist per workspace.
- Added the documented Automation starting-capability boundary: PR creation, persistent memory, computer use, and external tools require least-privilege review, synthetic dry runs, and a human gate.
- Added Plugins as a supply-chain surface requiring manifest, dependency, permission, and provenance inspection.
- Corrected Figures 1 and 3 to say that they appear in the current Agents Window documentation and were accessed while Desktop 3.17 was the latest download; the stills are not falsely described as version-3.17 captures.
- Retained current distinctions for Privacy Mode, `.cursorignore`, Browser approvals and origin allowlists, Run Modes, Checkpoints, local versus cloud environments, Skills, Rules, and MCP.

### Source-to-claim integrity

- Added dedicated official records for Agent Security, Side Chat, Worktrees, and Plugins, and wired them to the lessons that make those claims.
- Removed an unused official-GitHub record that had no defensible course claim.
- Removed the unrelated product-manager repository from quiz question q08; the assessed explanation now cites only the official planning source.
- Added the MetaMask pinned rule to the software-studio lesson where its historical-diff/draft-PR pattern is actually discussed.
- Reworded writing-studio evidence from an effectiveness claim to an inspectable implementation example.
- Preserved the boundary that practitioner repositories illustrate patterns; they do not prove productivity, correctness, learning effects, or Cursor endorsement.
- Corrected the practitioner ledger so `anthroos/plaintext-crm` supports plain-text artifacts, schema validation, and versioning—not the course-authored synthetic-data safety rule.
- Required every source-ledger record to be used by at least one lesson or assessment. The live ledger is 50/50 used.
- Stored source verification at date precision rather than inventing a shared midnight access time.

### Nine-locale correction pass

- Reconciled all nine bundles with the corrected Hook, Inline Edit, Subagent, Browser, Automation, Plugin, and figure-freshness semantics.
- Aligned every localized figure notice with the executable policy: rights review is required before any public release or redistribution, not only commercial publication.
- Preserved required technical literals and stable option IDs while correcting the surrounding natural-language explanations.
- Replaced the Traditional Chinese model-context wording with `上下文` and removed an awkward repeated Arabic selection phrase.
- Confirmed exact object/key and placeholder parity, required literals, quiz identifiers, capstone keys, figure labels, and JSON validity across all nine locale files.
- Course-local validation finds no missing, extra, empty, malformed, or mojibake values. This is a structured editorial audit; it does not claim a formal external native-speaker certification.

### Interaction, accessibility, and responsive behavior

- Fixed a pre-hydration assessment race. The server-rendered lesson quiz now keeps its controls disabled until React hydration is complete and exposes an explicit `data-hydrated` readiness signal. A fast first answer can no longer appear checked while being absent from component state.
- Improved full-size figure-link accessible names so each combines the localized action with the image's pedagogical alt description.
- Preserved Arabic RTL layout while keeping image/code regions and technical identifiers appropriately isolated.
- Retained the responsive fix that allows long freshness labels to wrap without document-level horizontal overflow.
- Expanded the browser contract to include fail-closed rights-state assertions, all nine localized dashboards at 390 px, and all 126 combinations of 14 lesson figures across nine locales at a 390 px viewport.

### Progress, reset, assessment, and capstone

- Exported the pure `cursorProgressPercent` adapter over 16 strict milestones.
- Defined the 14 lesson milestones accurately as self-reported Booleans; the final quiz and current capstone have additional strict evidence contracts.
- Kept Cursor progress in `aicourse.cursor.progress.v1`, isolated from `ae.progress`, with same-tab, storage, and focus refresh; a Cursor Web Lock; bounded verified commits; and a memory-authoritative fallback after storage failure.
- Preserved `resetCursorProgressAfterGlobalReset()`, which uses the same lock, removes the isolated record, and clears the fallback cache. Shared reset awaits it after preserving Course 2's `resetAllCourseProgress()` behavior.
- Added a regression lock that reads the live shared progress component and fails if the Cursor reset import, `await`, or Course-2-before-Cursor call order is removed.
- Retained stable semantic answer IDs, bank version 2, exactly three final questions per unit, and a best-score policy.
- Retained the capstone's six required artifacts, 80-point minimum, mandatory safety and verification criteria, exact contract metadata, deterministic archive, and fail-closed receipt parser.
- Kept the learner export explicit that completion is self-reported, unsigned, non-attesting, non-credentialing, and not reviewed by the site.

## Media truth and publication boundary

All 14 lessons use one unique authentic first-party Cursor UI/product image. Each record has a local master, two responsive derivatives, an exact master SHA-256, source page, dimensions, capture/access date, current/dated-current/historical label, localized alt/caption text, privacy review, attribution, and non-affiliation notice. The two MP4-derived stills also have exact 2.0-second frame times and source-video SHA-256 values.

The resumed 2026-08-24 audit re-opened every first-party page/media endpoint represented by the runtime source and figure contracts: 55/55 resolved successfully. All 11 practitioner records also resolved at their exact pinned GitHub revisions. A fresh presentation-pixel comparison found all 12 static-source masters identical to their first-party sources after colour management; the two remaining figures are frame extracts whose source MP4 SHA-256 values exactly match the ledger. The stored 2026-08-23 snapshot date remains the honest acquisition/content-review date rather than being rewritten to imply that the local media were newly captured.

The figures remain suitable for development, content review, accessibility checks, and internal visual QA. They are not represented as publication-cleared. Cursor's public hosting, attribution, and limited educational commentary do not themselves satisfy the repository's release gate. Opening that gate requires a reviewed, evidence-bearing determination bound to the exact derivatives and intended publication scope.

## Capstone integrity values

```text
archive SHA-256:
4d7623fee2771309cac1d87c33da30883bec58938bcdc67a8f3995156f31a34e

internal course-fixture.json SHA-256:
3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b

checksum sidecar file SHA-256:
b41041a3696fd2b992e1e70d9b4aa7c94a364175122b8325c8b6b47c0da91ca5
```

These values identify three different artifacts and are intentionally not conflated.

The starter fixture was also exercised in both required states on 2026-08-24. The untouched starter correctly failed only the two intentional `Incomplete`-filter assertions, while still passing lint and the production build and refusing to emit a receipt. An isolated solved copy then passed 5/5 tests, 2/2 keyboard checks, lint, production build, both preserved routes, and dependency integrity. Its generated receipt used schema `aicourse.cursor.capstone.v1`, fixture version `1`, and the published internal fixture hash above; no solved file was written back into the course fixture.

## Current verification evidence

The following final checks were run against the live shared tree or, where stated, its isolated exported Course 4 routes on 2026-08-24:

```text
npm run cursor:check
PASS — all 10 technical/content gates
EXPECTED WARNING — 14 technically available figures lack evidence-bearing publication-rights determinations

npm run cursor:check:release
EXPECTED FAIL — the same 14 rights-review-required figures
EXPECTED FAIL — release mode requires publicationStatus=published and a non-null publication date
No content, source, locale, media-integrity, capstone, namespace, route, or metadata gate fails before those two publication controls.

npx tsc --noEmit --pretty false
PASS — the integrated tree was clean at the start of the resumed audit, with no Cursor TypeScript error
FINAL SHARED-TREE RE-RUN — repository-wide exit 2 after concurrent out-of-scope writes: one missing RAG locale import and two missing test-library imports under tmp/capture/aicourse-codex-demo; no error names a Cursor path

npx eslint 'app/[locale]/cursor' components/cursor lib/cursor tests/cursor-course.spec.ts scripts/check-cursor-course.mjs scripts/build-cursor-demo-archive.mjs
PASS

node JSON.parse over messages/cursor/*.json
PASS — 9/9 locale bundles

CURSOR_BASE_URL=http://127.0.0.1:4314 npx playwright test --config tests/cursor-playwright.config.ts --workers=1
PASS — 39/39 tests in Chromium (25.9 seconds) against the isolated static export, including all nine mobile dashboards and the shared sitemap

capstone starter: npm run course:verify
EXPECTED FAIL — exactly the two intentionally missing Incomplete-filter assertions; lint and production build pass; no receipt emitted

capstone isolated solved copy: npm run course:verify
PASS — 5/5 tests, 2/2 keyboard checks, lint, production build, both routes, dependency integrity, and canonical receipt generation

live source/media availability probe
PASS — 55/55 first-party Cursor page/media endpoints and 11/11 exact pinned GitHub practitioner revisions

figure-source integrity comparison
PASS — 12/12 static masters are presentation-pixel identical after colour management; both source MP4 hashes match the ledger
```

The browser suite covers the pure progress adapter, publication state, cross-manifest ownership, stable option IDs, all 14 English lesson routes and real figures, formative checks, every locale, Arabic RTL, metadata, isolated progress, two-tab concurrency, completion summary, storage denial, malformed storage, stratified final assessment, stable-ID grading, capstone rejection/acceptance, no-JavaScript figures, automated WCAG A/AA checks, three responsive widths, all 126 localized figure routes at 390 px, mobile navigation, and all 135 localized sitemap entries.

The isolated export was used because the concurrently shared Next development server acquired an unrelated RAG-course build overlay (`messages/rag/es.json` missing) during this audit. Before that overlay appeared, the live Cursor dashboard rendered with no Course 4 console error or warning. The isolated Course 4 browser run had no application failure; its only local-host console error was the expected absent Vercel Analytics endpoint, which exists only after deployment. No RAG or other-course file was changed to conceal the shared-server condition.

## Repository-wide boundaries

- `npm run build` is not a valid success claim while publication rights are unresolved. The current shared chain contains several other courses' release checks before Cursor; regardless of which earlier gate stops first, Course 4's own release check independently fails for its 14 pending determinations. Both `build` and `build:release` still include `cursor:check:release`, and Course 2's `codex:check:release` term remains preserved before it.
- The final repository-wide TypeScript re-run is not green because concurrent, out-of-scope work currently leaves `lib/rag/load.ts` without `messages/rag/de.json` and includes `tmp/capture/aicourse-codex-demo/tests/CourseList.test.tsx` without its Testing Library types. No Cursor path appears in that output; neither the RAG locale work, the Course 2 capture, nor shared compiler exclusions were changed to hide it.
- `npm run i18n:check:release` is site-wide `NOT_ASSESSABLE` in the fresh snapshot `0f4246ab19a0-4ab6d50fef052493` because several newer, unrelated course namespaces are unfinished. Cursor itself has 625/625 structural keys in English and 625/625 in each of the other eight bundles, with zero missing, extra, or empty values. Its 40 hard identical-text findings are exact-literal exception-policy gaps: the four q13 technical file paths repeated across eight translated bundles (32 findings) plus eight legitimate same-form French/German UI terms. The audit additionally emits 296 review-only English-leak heuristics for official titles, product labels, and repository names, and one validator result caused solely by Course 4's intentional figure-rights release gate. These are not evidence that the corrected Cursor prose is untranslated, but the shared i18n exception policy still needs a narrowly reviewed, locale-aware mechanism before a site-wide green result can be claimed.
- No shared production, catalogue, SEO, sitemap, package, or global-message surface was overwritten during this correction pass.

## Acceptance statement

After the corrections above, no known Course 4 content, implementation, localization-structure, source-use, assessment, progress, capstone, accessibility, or responsive-layout defect remains. Public publication remains intentionally blocked on the documented figure-rights review. The exact shared metadata, 14 ordered routes, progress/cache/reset contract, nine-locale global strings, SEO/sitemap behavior, and package scripts are recorded separately in `outputs/cursor-shared-integration-contract.md`.
