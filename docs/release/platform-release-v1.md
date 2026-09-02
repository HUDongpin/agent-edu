# Platform release v1 integration contract

This document records the repository boundary for the platform-first iteration.
It is an implementation contract, not production deployment evidence and not
permission to publish another course.

## Baseline and scope

- Platform baseline: `codex/courses-on-main` at `760e65b`.
- Later non-course stability fix integrated as `737fd7a`.
- Integration branch: `codex/platform-release-v1`.
- New public-course intake is frozen for this iteration.
- The public set remains exactly twelve courses.
- Creator Ops is retained as an internal `staged` candidate. Its source and lab
  fixtures are reviewable, but it has no public App Router entry, public asset
  root, catalogue record, sitemap/SEO entry, JSON-LD record, or public progress
  adapter.

Courses 17–20 and the larger roadmap branch are deliberately outside this
integration. Their existence in other worktrees is not evidence of publication.

## One lifecycle authority

`config/course-release-manifest.json` is the only hand-edited lifecycle
authority. It owns publication state, the frozen allowlist, route vocabulary,
release gate, progress boundary, and the three language fields:

- `interfaceLocales`: shell languages in which the course may be presented;
- `reviewedContentLocales`: languages in which the long-form course body has a
  reviewed implementation;
- `fallbackLocale`: the reviewed body language used when the requested shell
  language has no reviewed body.

The two older JSON files are generated adapters:

- `config/course-release-surface.json` is a server/script compatibility view;
- `config/course-public-surface.json` is the client-safe view.

Both carry a source path, source schema version, do-not-edit marker, and SHA-256
of the authoritative manifest. Verification compares their complete generated
content. A gate must fail on drift; it must not silently rewrite drift and then
report success.

```text
course-release-manifest.json (authoritative v3)
             |
             +--> compatibility projection (generated, fingerprinted)
             |
             +--> client projection (generated, fingerprinted, no staged)
                         |
                         +--> catalogue / language UX / public progress

published allowlist --> routes / static params / SEO / sitemap / JSON-LD
staged             -X-> every public consumer above
```

The `platform-release-v1` freeze is intentionally checked both as auditable
manifest data and as an iteration lock in code. Changing a course state and the
manifest allowlist together must still fail before a projection or route wrapper
can be generated.

## Learner-facing contracts

The catalogue distinguishes shell language from reviewed course-body language
before navigation. A fallback CTA names the language it will open. The body
language filter is URL-addressable and matches reviewed languages only. Course
JSON-LD uses the same reviewed-language contract.

My Learning reads only browser-local progress and has four explicit groups:
Continue, In progress, Completed, and Suggested. Suggestions come from the
published client projection. The versioned JSON backup is local-only, bounded,
allowlisted to progress-owned keys, confirmed before replace-mode restore, and
must distinguish a successful rollback from a failed rollback.

CourseShell v1 separates static course facts from local progress. Server course
dashboards render the static shell on the server and hydrate only the progress
island. The legacy client Handbook uses a compatibility wrapper. The shell
includes breadcrumb, publication status, difficulty, duration, actual body
language, fallback state, local progress, primary action, prerequisites,
outcomes, artifacts, a native-details syllabus, and the local-storage notice.

## Required evidence before this branch can be called complete

The final integration must preserve all of the following evidence:

1. `release-surface:check` and its negative fixtures prove the frozen twelve,
   projection fingerprints, and staged exclusion.
2. Every release/development/progress/i18n entry point independently verifies
   the manifest/projection relationship when invoked directly.
3. Unit and contract tests cover language fallback, backup validation and both
   rollback outcomes, public-only progress, and the real CourseShell server/
   client call-site split.
4. The default Next.js build succeeds with a real in-tree dependency directory.
5. The exported output contains no Creator Ops route, asset, metadata, sitemap,
   RSC payload, or client-chunk reference and no Courses 17–20 surface.
6. Mobile LTR and RTL browser checks cover deep-linked language filtering,
   fallback CTAs, My Learning controls, keyboard operation, focus visibility,
   reduced motion, and horizontal overflow.

Repository checks and a local build do not prove a Vercel deployment, GitHub
required-check configuration, production traffic, or human native-language
acceptance. Those claims require their separate evidence gates.
