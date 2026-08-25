# Course 12 release audit: How to Make Money with Claude

**Site:** aicourse.top  
**Course ID:** `claude-income`  
**Course ordinal:** 12  
**Audit date:** 2026-08-23; re-audited 2026-08-24, Asia/Taipei  
**Content version:** 1.0.1  
**Audit posture:** fail closed  
**Independent preimplementation verdict:** HOLD  
**Current Course 12 decision:** PASS for the corrected v1.0.1 Course 12 slice;
its browser suite and static export passed in an isolated current-workspace
snapshot, while unrelated shared-repository blockers are recorded separately

## 1. Scope and release contract

This record closes the ten blockers in
`evidence/course-audits/claude-income-source-verification.md` against the implemented and
browser-rendered Course 12 product. The independent HOLD report is preserved as
the preimplementation baseline; it has not been rewritten after the course was
corrected.

The release candidate contains:

- 4 units and 12 lessons, numbered 1 through 12;
- exactly 895 instructional minutes;
- a release curriculum companion whose four unit titles, 12 lesson titles,
  lesson order, lesson minutes, and 895-minute total are checked against the
  authoritative TypeScript data;
- 7 course-authored captures of the real Claude Desktop interface;
- 7 PNG masters and 14 WebP derivatives with frozen SHA-256 records;
- 29 source records: current Anthropic/Claude sources, audited GitHub sources,
  X practitioner reports, and the current X automation rules;
- 24 evidence-linked scenario questions;
- one balanced 16-question final attempt with exactly four questions from each
  unit and exactly one selected critical boundary from each unit;
- a passing rule of at least 13 correct answers and all four selected critical
  boundaries correct;
- a 100-point capstone, an 80-point minimum, 9 portfolio deliverables, and 8
  non-compensable critical-failure gates; and
- nine locale shells that explicitly identify the course body as English and do
  not advertise translations that do not exist.

## 2. Independent source-verification blocker closure

- [x] **1. Outcome-claim blocker closed.** The dashboard and every lesson use
  the course-wide disclaimer: the course does not promise income or business
  success; results depend on expertise, demand, sales, execution, quality,
  costs, terms, and law. Practitioner results are labeled self-reported and
  non-representative. SEO and JSON-LD describe value creation and demand
  validation, not earnings. The capstone states that earning revenue is neither
  required nor sufficient to pass. Searches found no get-rich, passive-income,
  or typical-earnings promise. A final language review also replaced the stray
  phrase `profitable asset` with `commercially defensible asset`.

- [x] **2. Product-fact blocker closed.** The current course consistently states
  that Free users can create up to five Projects, enhanced Project retrieval is
  paid, Research is on paid plans and opened from the composer `+` control with
  Web search enabled, Artifact publishing is sharing/discovery rather than
  payment, current Skills guidance covers Free/Pro/Max/Team/Enterprise subject
  to execution and organization controls, and the 2026-08-14 Auto-mode default
  is scoped to new Pro/Max/Team sessions unless user or administrator settings
  differ. Every volatile fact is date-stamped or accompanied by a recheck rule.

- [x] **3. Terms-scope blocker closed.** Output-rights language is limited to the
  relationship between Anthropic and the customer and to the extent permitted
  by applicable law. It explicitly does not establish copyrightability,
  originality, accuracy, non-infringement, rights in third-party material, or
  fitness for a client use. The course distinguishes commercial from consumer
  account terms, links the current Commercial Terms and Usage Policy, and
  requires independent verification and appropriate human review.

- [x] **4. Policy blocker closed.** The course excludes spam, unsolicited
  automated replies or DMs, deceptive personas, fake reviews, plagiarism,
  account farming, proxy or fingerprint rotation, ban evasion, safeguard
  circumvention, and scraped-list outreach. Automation lessons require the
  applicable Anthropic policy, destination-platform rules, law, consent,
  privacy, and human-authorization gates. The current X rule that an AI reply
  bot requires prior written and explicit X approval appears in instruction and
  assessment.

- [x] **5. X-evidence blocker closed.** All X evidence is link-only, Grade C
  practitioner report unless blocked. No X screenshot or media is reproduced.
  The Cody Schneider URL was corrected to the canonical post recovered through
  X's public oEmbed endpoint; its course-safe support is narrowed to the
  attributed data-analyst self-report. Degen Sing and Sam Ragsdale are now Grade
  D because current public retrieval does not reproduce their detailed claims;
  AdiiX remains Grade D. The validator proves that none of these three Grade D
  sources is referenced by a lesson, section, or assessment. Elvis Sun is
  narrowed to triple billing totaling $240 without a Stripe or refund claim,
  and William Candillon is limited to a Remotion output without Claude
  attribution. Levi, Noisy, and the
  Belogubov evasion material are absent. Practitioner metrics are not presented
  as audited, causal, profitable, or typical results.

- [x] **6. Repository-rights blocker closed.** Every GitHub-backed source now
  records a 40-character immutable commit, an immutable GitHub permalink, and an
  exact license-scope note. Course source links use the permalink and visibly
  identify the short pinned revision. The
  file-level record in
  `public/courses/claude-income/repository-rights-manifest.json` records the
  inspected path, license finding, course use, notice/modification status, and
  third-party-review condition. It records zero redistributed repository
  assets: the course links to repositories and paraphrases patterns in original
  prose, but copies no code, instructions, screenshots, or dependencies. The
  mixed-license Anthropic Skills repository is labeled by directory, and the
  unlicensed Remotion source is explicitly excluded.

- [x] **7. Real-UI blocker closed.** All seven figures are fresh,
  course-authored captures from the real Claude Desktop app on 2026-08-23. The
  captures use blank, synthetic, or low-sensitivity Anthropic-supplied example
  content. Account identity, conversation history, client material, private
  Project names, local paths, usage, spend, credentials, and browser tabs are
  absent or cropped. Every figure has an observation date, interface surface,
  intrinsic dimensions, meaningful alt text, caption, teaching points,
  full-resolution link, official-guidance link, privacy status, capture basis,
  and rights status. The dashboard and every lesson display the full
  independent-project, trademark, no-affiliation, no-sponsorship, and
  no-endorsement notice.

- [x] **8. Safety and quality blocker closed.** Lesson contracts require input
  authorization, data minimization, prompt-injection awareness, connector least
  privilege, output provenance, acceptance tests, citations, human review,
  billing invariants, sandbox tests, idempotency, retries, reconciliation,
  refund handling, backups, rollback, monitoring, customer disclosure, and
  stop/escalation rules where relevant. The final assessment and capstone make
  privacy, terms, source integrity, billing safety, and non-deceptive outreach
  non-compensable boundaries.

- [x] **9. Cost-evidence blocker closed.** The course does not use a static
  token-price profit promise. Learners measure cost per accepted delivery,
  including model and tool cost, retries, review labor, hosting, payment fees,
  acquisition, support, refunds, taxes, incidents, and failure cost. Batch is
  correctly described as 50% off eligible token usage for work that may wait up
  to 24 hours, not as a 50% reduction in total business cost or proof of profit.
  Learners must pull current official pricing into a dated worksheet.

- [x] **10. Instructional-QA blocker closed for the Course 12 product.** Every
  lesson route renders its objective, evidence classes, source links, workflow,
  reusable prompt, economics, quality gate, red flags, field exercise,
  deliverables, completion criteria, safety boundary, checkpoint, and takeaway.
  Quiz keys and the exact-one-critical selector are executable-tested. The
  capstone cannot pass when any deliverable, score threshold, or critical gate
  is missing. Browser QA covers every route, unknown-route failure, metadata,
  progress isolation, storage denial, responsive widths, theme, visible keyboard
  focus, no-JavaScript access, and assessment behavior. The final rendered pages
  were also visually inspected at 390 and 1440 pixels.

## 3. Current-fact reconciliation record

The volatile claims were reopened on 2026-08-23 and rechecked on 2026-08-24
after the evidence corrections:

| Claim | Release wording | Primary control source |
|---|---|---|
| Projects | Available to all users; Free has a maximum of five; enhanced RAG is paid | Anthropic Help Center, `What are projects?` |
| Skills | Free, Pro, Max, Team, Enterprise; Code execution and file creation must be enabled; organization/admin controls can apply | Anthropic Help Center, `Use skills in Claude` |
| Research | Paid plans; Web search required; open `+` at bottom-left and choose Research | Anthropic Help Center, `Use research on Claude` |
| Artifacts | Code execution and file creation must be enabled; publishing supports sharing but is not checkout or payment | Anthropic Help Center, `What are artifacts and how do I use them?` |
| Cowork safety | Sessions run in Anthropic's cloud; local files accessed are processed there; approval behavior varies by mode and tool | Anthropic Help Center, `Use Claude Cowork safely` |
| Auto mode | New Pro/Max/Team sessions from 2026-08-14, subject to pinned/user/admin defaults | Anthropic product announcement dated 2026-08-07 |
| Output rights | Between the parties and only to the extent permitted by law; independent evaluation remains required | Anthropic Commercial Terms, effective 2025-06-17 |
| Batch | 50% off eligible request tokens for results that may arrive within 24 hours | Claude Platform cost-optimization guide |
| X automation | No website scripting or unsolicited bulk activity; AI reply bots need prior written and explicit X approval | X Automation Rules, updated 2026-04 |

The Academy tutorial index, Claude Code 101, Cowork tutorial, the six material
Help Center articles, prompting guide, cost guide, Auto-mode announcement,
Commercial Terms, Usage Policy, and X Automation Rules all rendered through the
browser retrieval path. GitHub and original X post URLs returned HTTP 200 in the
transport check. Direct command-line access to several Claude Academy, Help, and
Platform hosts timed out during TLS setup, and the X Help endpoint returned 403
to curl; those command-line results are recorded as client-access limitations,
not as claims that the browser-verified pages are absent.

## 4. Media and rights acceptance

The independent media audit is PASS. The deterministic checker independently
decodes and checks every image rather than trusting filenames:

- all 21 documented SHA-256 hashes match;
- master and derivative dimensions match the TypeScript and JSON manifests;
- PNGs contain only required image chunks and WebPs contain no optional EXIF,
  XMP, ICC, animation, comment, GPS, or application metadata;
- the renderer uses actual decoded-width descriptors and de-duplicates the two
  native-size Figure 04 WebPs to one 510w candidate;
- no remote image dependency, GitHub media, or X media is present;
- Figure 05 repeats the network-access risk in HTML;
- Figure 06 is explicitly an in-progress workspace, not proof of a completed,
  published, sold, or production-ready Artifact; and
- interface labels and visible model names are dated observations, not plan,
  price, entitlement, revenue, or endorsement claims.

The notice and repository-rights manifest were revalidated after their final
rights-record extension. No media binary or figure metadata changed.

## 5. Assessment integrity acceptance

The first browser run exposed a genuine final-quiz defect: a second critical
item could be drawn from one unit, while scoring required exactly four selected
critical items. A perfect answer set could therefore be impossible to pass. The
selector now draws one critical item and three non-critical items from every
unit. The validator proves each unit has enough non-critical questions, and the
browser suite proves that a 15/16 score still fails when the one missed answer
is a selected critical boundary.

The capstone totals exactly 100 points and requires all of the following:

- all 9 evidence-portfolio deliverables;
- at least 80 points across 7 bounded rubric criteria; and
- all 8 non-compensable critical failures explicitly confirmed clear.

A 100/100 rubric score cannot compensate for one uncleared critical failure.

## 6. Validation evidence

| Gate | Command or method | Result |
|---|---|---|
| Typed content validator | `node --import tsx -e ...validateClaudeIncomeCourse()` | PASS, `[]` |
| Release-curriculum parity | deterministic title, order, lesson-minute, unit-title, and 895-minute checks against `evidence/course-audits/claude-income-curriculum-draft.md` | PASS; all 4 units and all 12 lessons match the implemented data |
| Course 12 deterministic development gate | `npm run claude-income:check` | PASS after the release curriculum was synchronized |
| Course 12 deterministic release gate | `npm run claude-income:check:release` | PASS after the synchronized curriculum and scoped decision were recorded |
| Course 12 and touched-integration ESLint | `npx eslint 'app/[locale]/claude-income' components/claude-income lib/claude-income tests/claude-income-course.spec.ts scripts/check-claude-income-course.mjs app/sitemap.ts components/courses/Catalog.tsx --max-warnings=0` | PASS, zero warnings and errors |
| Course 12 TypeScript slice | full `npx tsc --noEmit --incremental false --pretty false`, diagnostics filtered by ownership | PASS, zero Course 12 diagnostics |
| Current static Playwright contracts | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:1 npx playwright test tests/claude-income-course.spec.ts --grep 'Course 12 typed release contracts' --workers=1` | PASS, 2/2 for v1.0.1 typed contracts and all 21 media files |
| Browser suite | dedicated v1.0.1 snapshot on port 48113: `npx playwright test tests/claude-income-course.spec.ts --workers=1 --timeout=120000` | PASS, 27/27 in 1.4 minutes |
| Route coverage | dashboard, all 12 lessons, 9 locale shells, unknown lesson and locale | PASS |
| Progress resilience | resume, scoped reset, unrelated-key preservation, storage denial | PASS |
| Assessment behavior | balanced attempt, critical failure, capstone non-compensation | PASS |
| Responsive rendering | 390, 768, 1440 pixels; dashboard and figure-rich capstone | PASS, no horizontal overflow |
| Accessibility basics | semantic figures/captions, alt text, keyboard focus, light/dark, no JavaScript, hydration-safe quiz readiness, and live copy/status feedback | PASS |
| Media audit | independent ledger plus deterministic decode/hash/metadata checks | PASS, 21/21 assets |
| Figure guidance links | headless Chromium navigation to all seven official guidance URLs | PASS, 7/7 returned HTTP 200 with the expected page title |
| Visual inspection | current v1.0.1 dashboard and Cowork-safety lesson at 1280×720, plus browser assertions at 390/768/1440 | PASS; no clipping, overflow, missing disclosure, or unsupported outcome language |
| Repository TypeScript | `npx tsc --noEmit --incremental false --pretty false` on the final 2026-08-24 snapshot | BLOCKED by three non-Course 12 missing modules: `messages/rag/fr.json`, `@testing-library/react`, and `@testing-library/user-event`; zero Course 12 diagnostics. The missing RAG locale changed from `de.json` to `fr.json` during concurrent RAG edits, confirming that this is active external-worktree drift rather than a Course 12 dependency. |
| Isolated v1.0.1 static export | `npx next build --webpack` in a current-workspace snapshot with documented external-only shims | PASS: 1,841 pages; 9 Course 12 dashboards and 108 lesson pages; generated sitemap contains exactly 13 English Course 12 URLs with only `en` and `x-default` alternates |
| Repository release wrapper | final `npm run build` snapshot on 2026-08-24 | BLOCKED at the first, unrelated `handbook:check`: Korean and Arabic each lack 28 handbook keys. An earlier run also reported Japanese, which the concurrent handbook task resolved before this final run. The wrapper did not reach Course 12 or Next.js, so later repository gates remain unevaluated. |

At the corrected v1.0.1 snapshot, full-repository TypeScript is externally
blocked by a missing RAG locale message (`fr.json` in the final run, after an
earlier run reported `de.json`) and two testing-library dependencies in a
temporary Codex demo. No diagnostic names a Course 12 file. The dedicated
v1.0.1 browser and static-export runs used a copied workspace with the same
Course 12 product files plus narrow, documented shims only for those unrelated
import-graph failures: the missing RAG locale was temporarily mapped to an
existing locale, a Course 8 `server-only` import was removed, temporary/example
trees were excluded from TypeScript, and one external RAG candidate value was
narrowed. No Course 12 assertion, content rule, source rule, media check,
assessment rule, or route was bypassed. This establishes the Course 12 slice;
it does not establish that the live shared repository is release-clean.

## 7. Honest residual boundaries

- The course teaches methods for testing and delivering value; it cannot prove
  learner demand, competence, sales, revenue, profit, legality, or business
  success.
- Practitioner reports are idea signals, not representative outcome evidence.
- The course body is English. Localized shells and catalog copy do not constitute
  translated lesson content.
- Claude capabilities, plans, prices, terms, policies, and interface locations
  are volatile. Recheck all high-volatility claims before a later release.
- Commercial Terms and policy summaries are educational boundaries, not legal,
  tax, financial, or regulatory advice.
- Real UI figures document the interface observed on 2026-08-23 and do not imply
  Anthropic affiliation, sponsorship, endorsement, or permanent availability.
- Any future reuse of repository files, X media, or third-party screenshots
  requires a fresh file-level rights and privacy review.

## 8. Reactivation re-audit — 2026-08-24

The reactivated task was audited from the current shared worktree rather than
from the earlier completion report. The 2026-08-24 live-source pass found and
corrected material evidence drift:

- the seven PNG masters and fourteen WebP derivatives again passed independent
  visual, privacy, rights, decode, dimension, metadata, and SHA-256 checks;
- Skills and Artifacts now state the required Code execution and file creation
  setting, and Cowork instruction now identifies cloud processing plus the
  mode-specific approval and computer-use boundaries;
- Degen Sing and Sam Ragsdale are Grade D and absent from every lesson, section,
  and assessment; Cody Schneider, Elvis Sun, and William Candillon are narrowed
  to their currently recoverable self-reports;
- all GitHub material remains pinned and link-only, source renderers now open
  immutable commit URLs and display the pinned revision, and no third-party
  repository or social-media asset is redistributed;
- the Course 12 release checker verifies the sitemap and SEO registration from
  source without executing unrelated course loaders, while the isolated static
  export separately verifies the emitted 13-URL English-only sitemap result;
- the typed validator, deterministic Course 12 development/release checks, and
  targeted Course 12 plus touched-integration ESLint were rerun after these
  corrections;
- the complete v1.0.1 browser suite passed 27/27 on a dedicated copied snapshot,
  including all routes, nine locale shells, responsive widths, progress/storage
  behavior, balanced quiz selection, critical failure, capstone
  non-compensation, hydration readiness, live clipboard feedback, and the
  no-JavaScript state;
- the same v1.0.1 snapshot passed a webpack static export of 1,841 pages,
  including 9 Course 12 dashboards and 108 Course 12 lesson routes; its emitted
  sitemap contained exactly 13 Course 12 URLs, all English with only `en` and
  `x-default` alternates; and
- the current 1280×720 dashboard and Cowork-safety lesson captures were visually
  re-inspected without overflow, inaccessible focus behavior, missing figure
  context, or unsupported outcome language.

The shared development server could not provide a valid integration surface
because concurrent course work repeatedly introduced unrelated RAG and Course 8
module failures, while Next.js allowed only one development-server lock for the
worktree. A copied snapshot and dedicated port isolated server ownership without
changing Course 12. The complete v1.0.1 suite then passed 27/27; no assertion,
timeout, product logic, evidence boundary, or assessment boundary was weakened
to obtain the pass.

The multilingual boundary is unchanged and explicit: nine locale-aware shells
and catalog entries are localized, while the instructional body is English.
Neither metadata nor visible course copy claims that full lesson translations
exist.

## 9. Decision

Release decision: PASS for the corrected v1.0.1 Course 12 evidence, content,
media, and product slice; final repository publication remains blocked by the
shared-repository gates named above.

Course 12 has passed its factual, instructional, media, rights, assessment, and
targeted static gates. The current v1.0.1 browser and export evidence is scoped
to the documented isolated snapshot and is not promoted into a claim that the
live shared repository is clean. The current root wrapper stops first at
unrelated handbook localization gaps, and the full typecheck still has three
unrelated missing-module diagnostics. Those blockers—and any later gates not
reached by the wrapper—must pass in the live shared worktree before deployment
can be described as repository-clean.
