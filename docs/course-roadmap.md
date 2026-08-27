# Courses 1–21: implementation and release roadmap

This document records the fixed 21-course candidate implemented by the
`codex/complete-course-roadmap` branch. It deliberately separates repository
completion from release readiness and production availability.

## Status contract

- **Locally implemented** means a course has a versioned manifest, learning
  outcomes, ordered modules, duration, sources, exercises, module checks, final
  assessment, reviewable capstone, progress adapter and static routes in the
  repository.
- **Release-ready** means the exact frozen commit passes the unified fail-closed
  release boundary. No catalogue flag, local route or successful targeted test
  can substitute for that result.
- **Production live** means the exact verified static artifact has been
  deployed and the current production course, module, asset, sitemap, canonical,
  hreflang, JSON-LD and progress behavior have been checked route by route.

As of 2026-08-26, this branch is a **locally verified 21-course candidate**. It
does not claim release readiness. A bounded, read-only production probe found
the legacy six-card catalogue, no Course 2–21 sitemap entries and HTTP 404 for
every planned Course 2–21 English entrypoint, so the 21-course candidate is
confirmed **not deployed** in that observation window. The machine-readable
candidate snapshot is
[`outputs/course-platform-matrix.2026-08-26.json`](../outputs/course-platform-matrix.2026-08-26.json),
and the edge observation is
[`outputs/production-course-probe.2026-08-26.json`](../outputs/production-course-probe.2026-08-26.json).

The latest candidate verification completed 347/347 unit tests, a 2,507-page
Next.js static export, 2,502 locale course routes, 1,406 sitemap entries, all
six executable Course 16–21 labs, and 162/162 targeted browser checks. The
strict course boundary still passes 14 courses and blocks 7 solely on recorded
human localization review; the repository-wide localization report remains
`NOT_ASSESSABLE` with 150 fail-closed findings and 525 review/evidence-pending
findings. These local results are diagnostic evidence, not a frozen release or
production-live claim.

## Candidate inventory

The values below are derived from the course contracts. All route prefixes are
locale-relative and end in a slash in the static export.

| No. | ID | Course | Route | Modules | Minutes |
|---:|---|---|---|---:|---:|
| 1 | `agentic` | Agentic Engineering | `/courses/#agentic-engineering` | 3 | 235 |
| 2 | `codex` | How to Use Codex | `/codex/` | 12 | 660 |
| 3 | `claude` | How to Use Claude | `/claude/` | 15 | 870 |
| 4 | `cursor` | How to Use Cursor | `/cursor/` | 14 | 800 |
| 5 | `grok` | How to Use Grok | `/grok/` | 14 | 695 |
| 6 | `github` | How to Use GitHub | `/github/` | 12 | 660 |
| 7 | `prompts` | How to Write Prompts | `/prompts/` | 9 | 380 |
| 8 | `software-engineering` | Software Engineering with Agentic AI | `/software-engineering/` | 18 | 908 |
| 9 | `rag` | Retrieval-Augmented Generation | `/rag/` | 12 | 780 |
| 10 | `mcp` | Model Context Protocol | `/mcp/` | 18 | 1,075 |
| 11 | `make-money-with-codex` | How to Make Money with Codex | `/make-money-with-codex/` | 12 | 630 |
| 12 | `claude-income` | How to Make Money with Claude | `/claude-income/` | 12 | 895 |
| 13 | `ai-tutor` | AI Tutor & Learning Systems Engineering | `/ai-tutor/` | 8 | 450 |
| 14 | `product-management` | Products in the Age of AI | `/product-management/` | 14 | 910 |
| 15 | `agent-orchestration` | Agent Orchestration | `/agent-orchestration/` | 15 | 1,060 |
| 16 | `responsible-ai` | Responsible AI and Human Oversight | `/responsible-ai/` | 10 | 650 |
| 17 | `ai-research` | AI for Evidence-Grounded Research | `/ai-research/` | 10 | 650 |
| 18 | `ai-python-data` | AI Python, Jupyter and Data Foundations | `/ai-python-data/` | 10 | 600 |
| 19 | `machine-learning` | Machine Learning Foundations | `/machine-learning/` | 12 | 840 |
| 20 | `deep-learning` | Deep Learning and Transformers | `/deep-learning/` | 12 | 900 |
| 21 | `production-ai` | Production AI and MLOps | `/production-ai/` | 12 | 900 |

## New-course contracts

Courses 16–21 share the Course Kit implementation boundary while preserving
course-specific manifests, complete authored copy, sources, quiz banks, capstone schemas
and progress stores:

| Course | Complete instructional content | Progress milestones | Final assessment |
|---|---|---:|---|
| 16 Responsible AI | English + Simplified Chinese | 10 modules + final + capstone | draw 12 of at least 24; pass 10; all critical safety items correct |
| 17 Evidence-Grounded Research | English + Simplified Chinese | 10 modules + final + capstone | draw 12 of at least 24; pass 10; all critical provenance items correct |
| 18 Python and Data | English + Simplified Chinese | 10 modules + final + capstone | draw 12 of at least 24; pass 10; all critical provenance items correct |
| 19 Machine Learning | English + Simplified Chinese | 12 modules + final + capstone | draw 16 of at least 32; pass 13; all critical leakage, authority and reproducibility items correct |
| 20 Deep Learning | English + Simplified Chinese | 12 modules + final + capstone | draw 16 of at least 32; pass 13; all critical authority and reproducibility items correct |
| 21 Production AI | English + Simplified Chinese | 12 modules + final + capstone | draw 16 of at least 32; pass 13; all critical rollback, authority and reproducibility items correct |

The seven other site locales retain their localized shell and explicitly show
that the instructional body is English. The content root remains LTR—including
inside the Arabic RTL shell. Metadata and JSON-LD declare `inLanguage: en`, the
canonical points to the English content route, and alternates expose only `en`,
`zh-Hans` and `x-default` for this full-content boundary. Human release approval
for each exact English and Simplified Chinese bundle remains pending in
[`lib/course-kit/localization-reviews.json`](../lib/course-kit/localization-reviews.json);
the strict release checker rejects automated reviewer IDs, stale hashes and
unsigned bundles.

## Learning paths and horizontal constraints

- Technical spine: Course 18 → Course 19 → Course 20 → Course 21.
- Responsible AI: Course 16 supplies mandatory risk, rights, fairness, human
  authority, no-deploy and governance criteria to Courses 17–21.
- Research path: Prompts/GitHub/RAG → Course 17; Course 18 is the recommended
  prerequisite for its technical studio work.
- Course 20 requires Course 19 and basic linear algebra. Required exercises are
  CPU-runnable; GPU work is optional.
- Course 21 requires Course 19 and provides predictive-ML and RAG/LLM operations
  tracks under one production contract.

## Retired duplicate placeholders

The former placeholders are covered by assessed capabilities rather than
separate catalogue entries:

| Retired placeholder | Assessed home |
|---|---|
| Tool Design | MCP tool protocol and capability boundaries; Agent Orchestration `tools-aci-mcp` |
| Cost Engineering | Agent Orchestration observability/economics; Production AI monitoring, performance and cost |
| Human in the Loop | Responsible AI authority, escalation and appeal; Agent Orchestration human-control boundaries |

The unused `ai-teaching` ghost ID is not part of the catalogue contract. These
placeholders may remain absent only while the machine-checked capability matrix
continues to cover their required concepts, exercises and assessment evidence.

## Unified release boundary

`npm run build` is the deterministic commit-level gate. It checks secrets,
TypeScript, ESLint, unit contracts, handbook/widgets, root i18n key parity,
progress, retired-capability coverage, every available course integration,
Next.js static export, the generated route/asset/link/JSON-LD/sitemap inventory,
and the existing Agent Orchestration and MCP export contracts.

`npm run build:release` adds strict localization evidence, the Course 16–21
browser export matrix, site smoke/compatibility/resilience checks, evidence and
artifact validation, formal release readiness and the frozen production-evidence
boundary. A missing checker, route, progress event, asset hash, rights record,
canonical, sitemap entry, browser result or production receipt fails closed.

The export inventory is calculated from locales, available courses and module
manifests; it does not rely on a hard-coded page count.

## Release waves

1. Close and verify Courses 1–15.
2. Release Courses 16–17 and remove the duplicate placeholders.
3. Release Courses 18–19.
4. Release Courses 20–21.

Each wave requires an exact commit, stored checker/build/browser/rights evidence,
the corresponding static artifact, current production route verification and a
known previous artifact for rollback. A failed production check must remove the
failed course entry by rolling back the artifact; it must not leave a public
catalogue link to a broken learning path.

Multimodal & Domain AI is explicitly outside this roadmap and starts only as a
separate project after Course 21 is released.
