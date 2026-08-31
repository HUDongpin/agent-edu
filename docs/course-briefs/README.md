# Archived course design briefs

These three documents are preserved from the 2026-08-30 donor branch as dated
design inputs. They are not current catalogue entries, active roadmap
commitments, implementation-ready specifications, or permission to publish.

The authoritative current state is the generated release surface rooted in
`config/course-release-manifest.json`. At the integration base, it has no
`hitl`, `cost`, or `tools` course id. It instead keeps its explicit published,
blocked, staged, and roadmap records under the current course registry. Do not
add a route, progress adapter, localization claim, or catalogue row from these
documents without a new, reviewed registry change.

| Historical brief | Former id | Proposed shape | Current standing |
|---|---|---|---|
| [Human in the Loop](human-in-the-loop.md) | `hitl` | 35 min · reading · safety · intermediate | archived proposal |
| [Cost Engineering](cost-engineering.md) | `cost` | 35 min · interactive · evaluation · intermediate | archived proposal |
| [Tool Design](tool-design.md) | `tools` | 60 min · code · agents · advanced | archived proposal |

## How to reuse one safely

The briefs retain useful scope, boundary, exercise, artifact, and evidence
ideas. They also contain paths, line numbers, counts, catalogue assumptions,
progress assumptions, provider details, and release obligations observed on
2026-08-30. Treat every such statement as historical until it is rechecked
against the current tree.

Before implementation:

1. Write a current proposal mapped to the active release registry and course
   collection contracts.
2. Revalidate every referenced source file, provider fact, route, shared
   component, storage owner, and progress event.
3. Choose a current content-locale and native-review scope; the presence of old
   translations is not approval.
4. Add the course through the fail-closed development, publication, sitemap,
   progress-adapter, reset, static-export, and release gates.

The donor branch also identified two real cross-cutting needs. The current
platform now has a registry-derived adapter topology rather than a three-id
catalogue union, so new published courses must join that topology instead of
widening an old switch. The separate Build-an-Agent self-declaration is stored
inside the existing `ae.learning.v2` owner and remains a reversible learner note,
not proof that the local project was inspected.
