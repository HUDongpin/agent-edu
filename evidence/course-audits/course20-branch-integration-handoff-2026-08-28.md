# Course 20 conflict-aware integration handoff

## 2026-08-30 transfer-boundary update

This dated handoff originally authorized no repository mutation. A later delegated instruction now authorizes exactly one local commit containing the complete final Course 20 technical candidate so the root integration task can transfer that commit object by exact SHA. It still authorizes no push, pull request, merge, Vercel Preview, configuration mutation, promotion, or production deployment.

The 2026-08-28 human bilingual editorial pass is historical and bound only to its then-current bytes. Subsequent reviewed-byte changes made that receipt `stale-human-editorial-signoff`; production promotion remains blocked until a new human review binds the current exact surface. The old attestation must not be carried forward.

## Independent implementation identity

- Course identity selected by the user: **Course 20 — Agentic Video Editing**.
- Source feature branch: `codex/course-20-agentic-video-editing`.
- Repair branch: `codex/course-20-first-principles-fix`; this run used temporary clone `/private/tmp/course20-first-principles-final`, which is not a durable reproducibility anchor.
- Source Course 20 commit at branch creation: `35ed70003b78b3f398058ee741a1d5c6f5694183`.

This 2026-08-28 handoff itself authorized no commit, push, pull request, merge, Vercel configuration mutation, preview promotion, or production deployment. The later 2026-08-30 instruction supersedes only the local-commit prohibition, and only for the single exact-SHA transfer candidate described above.

The human bilingual editorial review was recorded as passed against a complete 72-file Course 20 editorial source inventory aggregate and four separately named canonical source hashes on 2026-08-28. Later reviewed-byte changes made that pass stale, so it no longer removes the Course 20 editorial prerequisite; it does not broaden this handoff or authorize any integration or deployment mutation.

## Sibling-branch boundary

Course 20 Agentic Video Editing and Courses 16–19 are sibling feature lines. This repair was intentionally not based on the active Course 16 worktree and does not absorb or overwrite Course 16, 17, 18, or 19 implementation commits.

Do not merge the whole Course 20 feature branch into an accumulated course branch without first resolving shared files such as:

- course catalogue and display numbers;
- route and sitemap arrays;
- shared progress reset and i18n contracts;
- `package.json` build/release chains;
- `vercel.json` release settings;
- shared shell/navigation surfaces;
- any overlapping messages or course metadata.

## Numbering collision

`codex/complete-course-roadmap` independently assigns **Deep Learning** to Course 20. This repair follows the user's explicit choice to keep **Agentic Video Editing** as Course 20.

That is a semantic catalogue conflict, not a mechanical merge conflict. Before cumulative integration, the course owner must choose one of these outcomes:

1. retain Agentic Video Editing as Course 20 and renumber the roadmap's Deep Learning course;
2. retain Deep Learning as Course 20 and renumber this course, including route metadata and progress namespace migration;
3. publish one as a non-numbered specialization with a deliberately different catalogue contract.

Until that decision is recorded, stop integration. Never resolve the collision by silently accepting whichever branch writes the catalogue last.

## Safe integration procedure

1. Start from the chosen clean integration base, not from a dirty feature worktree.
2. Inventory sibling commits and shared-file diffs before cherry-picking.
3. Resolve course-number/catalogue semantics explicitly.
4. Bring Course 20 files in ownership-aware groups: library/contracts, routes/components, public lab, tests/gates, messages/catalogue, then reports.
5. Re-run the accumulated platform release chain; do not reuse this branch's Course 20-only evidence as proof that Courses 16–19 survived.
6. Verify the exact resulting SHA on a Vercel Preview before any production promotion.

## Stop condition

If integration would delete, overwrite, or make Courses 16–19 unreachable, stop and return to an isolated branch. A standalone Course 20 repair with this handoff is preferable to an unaudited cumulative merge.
