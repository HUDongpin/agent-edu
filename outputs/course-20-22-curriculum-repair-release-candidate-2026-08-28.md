# Course 20/22 curriculum repair: release-candidate ledger

- Date: 2026-08-28
- Integration branch: `codex/course-20-22-curriculum-repair`
- Integration baseline: archive tag
  `archive/complete-course-roadmap-03d0c600-20260829`, peeled to exact SHA
  `03d0c60017a29898bbc1db3ac3f259524f6170f6` (historical branch:
  `codex/complete-course-roadmap`)
- Frozen implementation commit: `c161549026dbb769c6be961164a40dc41eedae65`
- Decision: **HOLD**
- Production deployment: **not authorized**

This ledger records the implementation and verification boundary for Course 20
Deep Learning and Transformers v2 and Course 22 Agentic Video Editing v2. It is
not a release certificate, learner transcript, human approval or deployment
record. The old Course 20 video-editing branch is a course-file donor only; its
PASS reports do not transfer to Course 22.

## State separation

| State | Evidence required | Current record | What it does not prove |
|---|---|---|---|
| Local contract | Named command, exact source state, structured output and zero exit | Course 20 `PASS`; Course 22 `PASS`; full repository build `PASS` | Learner competence, human review, release eligibility or deployment |
| Reference fixture | Current reference schema/validator, artifact hashes and `REFERENCE_PASS` | Course 20 `REFERENCE_PASS`, `capstoneEligible=false`; Course 22 guided project validates as a non-publishing prerequisite lineage | Course completion or independent learner work |
| Learner competence | Current-version module receipts, assessment, learner-final lineage and capstone derivation | `NOT ESTABLISHED` by repository implementation | Reviewer identity, permission to train/deploy/publish |
| Human review | Named reviewer, role, date, scope and exact copy SHA-256 for English and Simplified Chinese | `PENDING` | Technical gate success outside the signed scope |
| Release eligibility | Complete fail-closed command chain, current human approvals, immutable candidate and rollback evidence | `false` / `HOLD` | Production availability |
| Production live | Separately authorized deployment plus same-artifact route, metadata, sitemap, behavior and rollback verification | `NOT AUTHORIZED` | Nothing in this repair plan authorizes deployment |

A page can be complete while its artifact is invalid. JSON can be structurally
valid while the local validator fails. A local validator can pass while no
learner has demonstrated competence. A learner package can pass while the
accountable human decides `no-train`, `no-deploy` or `do-not-publish`. Those are
valid evidence-backed outcomes; validator success never grants deployment or
publication authority.

## Candidate scope

| Course | Candidate contract | Intended evidence chain | Verification state |
|---|---|---|---|
| 20 Deep Learning and Transformers | Course `2026.08.28-v2`; quiz `2026.08.28-quiz-v2`; capstone `2026.08.28-capstone-v2`; schema `aicourse.deep-learning.capstone.v2`; validator `aicourse.deep-learning.validator.v2` | readiness bridge → M1–M12 validated artifacts → current rotating 16-question form → learner-final dossier → named-human decision | Local, lab, static and browser command chains pass; exact EN/zh-Hans human review remains pending |
| 22 Agentic Video Editing | Course `2.0.0`, display number 22, route `/agentic-video-editing/` | preflight → M1–M9 single-project lineage → readiness → fresh-project M10 package → named-human publish/do-not-publish decision | Local, real-media validator, static and browser command chains pass; exact EN/zh-Hans human review remains pending |

Course 20's course-owned MLP and other reference packages are teaching
examples only. A `REFERENCE_PASS` must remain `capstoneEligible=false` and must
never create learner completion. Course 22 v1 history is retained as history;
it cannot auto-complete the changed v2 order, schemas or capstone.

## Human review ledger

Every approval must bind the exact frozen language bundle. Any later copy
change invalidates that approval automatically. Agents must not populate the
reviewer or approval fields.

| Course | Bundle | Copy SHA-256 | Reviewer ID/name | Review date | Status |
|---|---|---|---|---|---|
| 20 | English, including the frozen atomic-claim/source extension | `37e363681d57d5b75a8d4973a0bb6ed0c48f61959810960f6f7191015efa0b2a` | `PENDING_HUMAN` | — | `PENDING` |
| 20 | Simplified Chinese, including the frozen atomic-claim/source extension | `218e2f40b6c2cd483ba50a71be28a7fbe67d3b33ee3ee739f5ebca07a473ad84` | `PENDING_HUMAN` | — | `PENDING` |
| 22 | English | `38b8f3e28b2766c3446d1faace2abe2b9f0a2da32df4cc444e8fd0993603a73a` | `PENDING_HUMAN` | — | `PENDING` |
| 22 | Simplified Chinese, including the lab guide | `af8785b852b60654bea41066065eb32fa60c14000586cf4229dd443a6bf6da23` | `PENDING_HUMAN` | — | `PENDING` |

The human scope must include terminology, semantic equivalence, technical
accuracy and the complete rendered bundle. Course 22 publication authority and
Course 20 train/deploy authority remain separate from language review.

## Verification ledger

Rows below record commands executed on this integration worktree. `HOLD
(expected)` is not a test pass: it means the local contract passed and the
release checker correctly refused eligibility because named-human review is
absent. The implementation commit is recorded after the final clean commit;
no result is inherited from the obsolete Course 20 video branch.

| Gate | Command or evidence | Status | Frozen commit / artifact | Evidence note or path |
|---:|---|---|---|---|
| V01 | `npm run typecheck` | `PASS` | `c1615490` | TypeScript no-emit check passed |
| V02 | `npm test` | `PASS` | `c1615490` | 426/426 Node unit, mutation and contract tests passed inside the final build |
| V03 | `npm run deep-learning:check` | `PASS` | `c1615490` | `course-kit local contract: PASS`; release not evaluated; three forms report 8 capability items each |
| V04 | `npm run deep-learning:check:release` | `HOLD (expected)` | `c1615490` | Only EN and zh-Hans named-human review findings remain |
| V05 | `node scripts/check-course-labs.mjs --course deep-learning` | `PASS` | `c1615490` | 7/7 v2 lab groups, 12 module validators, capstone mutations, no-train and eight-receipt browser round-trip passed in about 3 seconds |
| V06 | `npm run agentic-video-editing:check:release` | `HOLD (expected)` | `c1615490` | Local contract passes; only EN and zh-Hans named-human bundle reviews remain; old Course 20 video reports are superseded |
| V07 | `npm run course-static-export:check` | `PASS` | `c1615490`, fresh `out/` | 22 courses, 2,601 locale routes, 1,428 sitemap entries; Course 22 adds 99-shell canonical/hreflang/JSON-LD/catalog/sitemap checks |
| V08 | `npm run build` | `PASS` | `c1615490` | Secrets, lint, 426 tests, i18n, progress, 22/22 platform courses, 2,606 static pages and post-build audits passed |
| V09 | `npm run test:course-kit:export`; `npm run test:agentic-video-editing` | `PASS` | `c1615490`, fresh `out/` | CourseKit 48/48 across Chromium plus Firefox/WebKit smoke; Course 22 12/12 |
| V10 | EN/zh-Hans axe in both suites | `PASS` | `c1615490`, fresh `out/` | Full axe rule run; every violation carrying a WCAG tag is blocking; none observed |
| V11 | `git diff --check` | `PASS` | `c1615490` plus ledger | No whitespace errors |
| V12 | `git status --short --branch` | `PASS` | `codex/course-20-22-curriculum-repair` | Verified clean after the implementation and release-ledger commits |

## Additional bound artifacts

- Course 20 bilingual paragraph snapshot SHA-256:
  `b69d86e417fc3ed088ea4a020385ee0711318230a314d86c94d5cad791527f52`.
- Course 20 atomic claim plus full source-contract snapshot SHA-256:
  `bc5ab7e5c196762d00f240ded73118dcd542ee983d98de1e2e4dc1dba96639a7`.
- Course 20 maps 78 atomic bilingual claims onto all 36 paragraph positions.
  Three previously mixed research records were split into six one-publication
  records; every research provenance record now has one publication URL. The
  two snapshot hashes above are included in both human-review bundle hashes,
  but their status remains `pending-human` and no agent signature was added.
- Course 20 public fixture, schema, runner, validator, test, template and guide
  inventory contains 23 files; `shasum -a 256 -c checksums.sha256` passes for
  every entry. The reference validator remains separate and returns only
  `REFERENCE_PASS`; the learner capstone validator emits eight exact
  browser-parseable artifact receipts only after the complete package passes.
- Course 22 source ledger SHA-256:
  `ade90e834a8e5ee30c92dc5c650c2d5314005b90e46e077ea53b0c36d8b96dff`.
- Course 22 guided-project ledger SHA-256:
  `9f5c1feba951051d9147ccb4ace1a6b86cf36ade58de593e4739bbb5834cd02e`.
- Reproducible Course 22 downloadable guided ZIP SHA-256:
  `beeb72ceb9d859f3fe5dda5e331609a3cec54a0808914f15502ff935792a5356`.
- Course 22 M7 filter-script SHA-256:
  `60c3ff256ee375e8f83698541ebd9668d6092746ec31fa8abac2ba2258a38eda`.
  The receipt binds its bytes and canonical select-only graph to M2 inputs,
  M5 operations and M6 read/write authority. The ZIP has exactly the sorted
  20-file ledger inventory plus the ledger itself; extra files, symlinks,
  hardlinks, remote inputs, absolute paths and unbound outputs fail closed.
- Course 22 learner-final validator rejects exact guided bytes, JSON/stubs,
  declared-but-unprobeable media, wrong container/stream/dimensions/frame rate,
  non-1080×1920 final delivery, duration outside 45–60 seconds, weak or drifted
  lineage, M9 release decisions, and disagreement among final variant, M9
  candidate review and M10 human decision hashes.

Four independent multi-agent review lanes audited Course 20 capstone semantics,
Course 20 quiz capability evidence, Course 20 claim/source closure and Course
22 authority/review semantics. The final red-team reruns report no remaining
P0, P1 or P2 in those scopes. This is still an automated technical conclusion,
not the named-human bilingual review required for release.

Release eligibility may change from `false` only when every required P1
finding is closed, this ledger binds the exact candidate, all required commands
pass, all exact-bundle human reviews are current, and rollback evidence is
available. This document does not authorize a merge, deployment, production
configuration change or publication to aicourse.top.
