# Provenance ledger: Course 3 — How to Use Claude

Snapshot date: 2026-08-24
Media resolution date: 2026-08-26
Machine-readable source records: `lib/claude/sources.ts`
Machine-readable figure records: `lib/claude/figures.ts`
Public figure provenance: `public/courses/claude/figure-provenance.v1.json`
Public figure hashes: `public/courses/claude/figure-hashes.sha256`
Offline release gate: `scripts/check-claude-course.mjs`

## Research method

The evidence review used three independent roles:

- curriculum researcher: audited the live Claude Academy catalogue and mapped the primary learning spine;
- workflow researcher: audited official and community GitHub repositories for software engineering, research, writing, office, and teaching practices, including repository-level licence boundaries;
- independent verifier: challenged plan claims, pedagogy, screenshot rights, and whether each cross-context practice was supported at the pinned source.

Claims were accepted only when the exact URL or pinned commit was available. Current product operation was checked against Help Centre and official pricing sources rather than inferred from screenshots. GitHub experience was treated as workflow evidence, not proof of productivity or learning efficacy.

## Academy catalogue snapshot

| Field | Recorded value |
|---|---|
| URL | `https://academy.claude.com/assets/data/catalog.json` |
| Generated at | `2026-08-21T17:04:36.545Z` |
| Stale after | `2026-09-20T17:04:36.545Z` |
| Items | `289` |
| Retrieved | `2026-08-23` |
| Rule | Fail closed after stale-after; refresh exact URLs and re-audit affected claims |

## Primary Academy, support, and pricing evidence

| Source ID | Exact source | Claims used | Reuse |
|---|---|---|---|
| `academy-claude-101` | https://academy.claude.com/courses/claude-101 | Beginner scope and core Claude workflows | Paraphrase |
| `academy-fluency` | https://academy.claude.com/tutorials/getting-good-at-claude-a-research-backed-curriculum | Signature moves, description spectrum, recurring discernment | Paraphrase; no framework text copied |
| `academy-desktop` | https://academy.claude.com/tutorials/navigating-the-claude-desktop-app | Chat, Cowork, and Code surface selection | Paraphrase only; no Academy visual asset reused |
| `academy-files` | https://academy.claude.com/tutorials/create-and-edit-files-with-claude-to-eliminate-hours-of-busy-work | File creation workflow and native inspection | Paraphrase only; accompanying diagram is course-original |
| `academy-projects` | https://academy.claude.com/tutorials/intro-to-projects | Project knowledge and instructions | Paraphrase; entitlement deferred to Help Centre |
| `academy-artifacts` | https://academy.claude.com/tutorials/use-artifacts-to-visualize-and-create-ai-apps-without-ever-writing-a-line-of-code | Artifact iteration, preview, and sharing review | Paraphrase only; accompanying diagrams are course-original |
| `academy-research` | https://academy.claude.com/tutorials/using-research | Research mode and citation review | Paraphrase; no duration or source-count promise |
| `academy-skills` | https://academy.claude.com/tutorials/teach-claude-your-way-of-working-using-skills | Skills as reusable procedures and testing | Paraphrase; availability deferred to Help Centre |
| `academy-connectors` | https://academy.claude.com/tutorials/connect-your-tools-to-unlock-a-smarter-more-capable-ai-companion | Connector discovery and connected context | Paraphrase only; accompanying diagram is course-original |
| `academy-cowork` | https://academy.claude.com/tutorials/get-started-in-claude-cowork-in-three-steps | Cowork mode, outcome brief, and folder scope | Paraphrase only; accompanying diagram is course-original |
| `academy-powerpoint` | https://academy.claude.com/tutorials/building-a-powerpoint-with-claude | Presentation brief and slide review | Paraphrase |
| `academy-teachers` | https://academy.claude.com/tutorials/claude-for-teachers-in-action | Teacher workflow transfer and educator review | Paraphrase |
| `support-projects` | https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects | Current Project operation, plan conditions, and boundaries | Paraphrase; operational authority |
| `support-research` | https://support.claude.com/en/articles/11088861-use-research-on-claude | Current Research availability and web-search dependency | Paraphrase; date-sensitive |
| `support-skills` | https://support.claude.com/en/articles/12512180-use-skills-in-claude | Current Skill availability, execution dependency, and risk | Paraphrase; date-sensitive |
| `support-connectors` | https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities | Connector read/write scope, inherited permissions, and trust | Paraphrase; date-sensitive |
| `support-files` | https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude | Supported file workflow and security boundaries | Paraphrase; date-sensitive |
| `support-artifacts` | https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them | Current Artifact surfaces, code-execution dependency, public-publishing boundary, and sharing exposure | Paraphrase; operational authority; publishing article cross-linked |
| `support-cowork` | https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork | Current surfaces, Cowork setup, Desktop local-folder bridge, and manual approvals | Paraphrase; date-sensitive; safety article cross-linked |
| `support-cowork-architecture` | https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview | Cloud-by-default execution, temporary sandbox lifecycle, account persistence, existing Desktop local execution, and the Desktop device bridge | Paraphrase; operational authority; verified 2026-08-24 |
| `support-tool-access` | https://support.claude.com/en/articles/13730515-manage-claude-s-tool-access | Least privilege and approval review | Paraphrase; date-sensitive |
| `claude-pricing` | https://claude.com/pricing | Claude Code inclusion in all paid plans and the Free-plan Chat, code-generation, file-creation, and code-execution fallback | Paraphrase; primary plan source; date-sensitive |

## Pinned GitHub evidence

| Source ID | Repository and commit | Licence assessment | Course use and exclusion |
|---|---|---|---|
| `github-anthropic-skills` | `anthropics/skills@3b3fad96af16a10759d930941b4520ba0c40edae` | Mixed; Academy Guide path Apache-2.0 | Skill structure and catalogue discipline; restrictive office-skill files not copied |
| `github-claude-code` | `anthropics/claude-code@5cfc0a1905ce0c0a9bd81d8a90fe6b62ff614357` | No general root reuse licence established | Link and paraphrase only for repository work |
| `github-claude-code-action` | `anthropics/claude-code-action@24dcd50c0568f0fc9e9211213a4fd2d9eb15c4e0` | MIT | Human-gated GitHub review and maintenance patterns |
| `github-cookbooks` | `anthropics/claude-cookbooks@35f2eec7e44897c537e44441b7dff2f0ecbfb804` | MIT; third-party paths assessed separately | Research, data analysis, citations, and approval gates; no performance inference |
| `github-knowledge-work` | `anthropics/knowledge-work-plugins@5267cf7bff3031921d4474b8e8f86ad02d2b8f6d` | Apache-2.0 core; partner paths separate | Context–plan–action–verification and role workflows |
| `github-k12-teacher-skills` | `anthropics/k12-teacher-skills@6fc400329540e068516bd34aa78120d89e5e4e8b` | Apache-2.0 plus NOTICE | Grounding, differentiation, educator review, and evaluation boundaries |
| `github-cwc-workshops` | `anthropics/cwc-workshops@068b84bb03d2ae87c51edb2837dda25c84c1d686` | Apache-2.0 | Interview-to-spec, divergent prototype, and verifiable contract patterns; stale workshop facts not used as current product truth |
| `github-superpowers` | `obra/superpowers@b36e0829c6d0140e93cfef2ca599b1b07d4a7797` | MIT | Plan-first, systematic debugging, tests, and independent review; productivity claims excluded |
| `github-paper-writing` | `SNL-UCSB/paper-writing-skill@676f8520bba54208eb4fe1d41620e365d9af6a24` | MIT | Writing architecture, versioned revision, and red-team review; local thresholds treated as optional heuristics |
| `github-learning-opportunities` | `DrCatHicks/learning-opportunities@3862d2eb6e93427f1f163a54360d11ef943b88b7` | CC BY 4.0; embedded survey materials separately scoped | Predict-before-generation, trace-and-debug, and teach-back; no causal learning claim |
| `github-academic-workflow` | `pedrohcgs/claude-code-my-workflow@be53c12f235996dff41fb7f21580506fd2dd8d50` | MIT | Claim validation and reproducibility passport; bypass-permission guidance excluded |
| `github-claudeblattman` | `chrisblattman/claudeblattman@12e14d42d5c8af6383019ac27ef91e898e812fc2` | MIT | Project context, fresh-chat testing, graduated autonomy, and office work; anecdotal time-savings excluded |

## Figure provenance and rights gate

| Figures | Source class | Current rights state | Release action |
|---|---|---|---|
| 01–05, 07–10, 13–15 | Course-original deterministic SVG diagrams | `course-original`, CC0-1.0; no Academy pixels, third-party visual assets, remote assets, or scripts | Retain visible not-product-UI label, public provenance, exact hash, privacy review, and localized boundary copy |
| 06 | `chrisblattman/claudeblattman`, pinned above | Repository licence reviewed; UI/trademark caveat disclosed | Retain attribution and NOTICE; confirm publication review |
| 11 | `anthropics/claude-plugins-official@340e33aef211d95769d252324854497af871dafe` | Apache-2.0 repository licence reviewed; UI/trademark caveat disclosed | Retain attribution, exact source hash, metadata-removal record, and NOTICE |
| 12 | `anthropics/claude-cookbooks`, pinned above | Repository licence reviewed; UI/trademark caveat disclosed | Retain attribution and NOTICE; confirm publication review |

Each original-diagram record contains its local SVG path, creation date and method, dimensions, SHA-256 digest, CC0 dedication, privacy checklist, attribution, and provenance-ledger path. Each licensed screenshot record retains its local PNG/WebP paths, source URL and commit, observation date, dimensions, source and derivative hashes, modification record, privacy checklist, attribution, and rights state. The offline checker validates SVG structure and safety, visible diagram labelling, raster signatures and metadata boundaries, public provenance coverage, and every pinned digest.

Authenticity and republication rights remain independent for any future first-party screenshot. The old Academy binaries were retired, not relabelled. Figure 01’s former `CLAUDE-FIG-01-PROVENANCE-UNVERIFIED` blocker was closed only by removing the unverifiable binary and creating a different, original diagram with a new hash and authorship record. The first-party screenshot validator still fails closed unless an image has both reviewed source provenance and a defensible permission state.

## Claim boundaries

The course does not claim:

- that a feature is available merely because it appears in a screenshot;
- that every plan, region, organisation, or administrator exposes the same tools;
- that a temporary cloud sandbox means the Cowork session or files are ephemeral; sessions and files may persist in the learner’s Claude account;
- that every Cowork deployment uses cloud execution; existing Desktop deployments may still use local execution and must be checked;
- that authentication grants authorisation for every Connector or Cowork action;
- that valid code, a successful tool call, or a polished output establishes factual correctness;
- that a GitHub workflow proves measured productivity, quality, or learning gains;
- that Claude’s self-critique is independent verification;
- that the portfolio score is a credential or external assessment;
- that repository licences automatically resolve all UI, trademark, or third-party content rights.

## Reproduction commands

Development audit:

```sh
node --import tsx scripts/check-claude-course.mjs
```

Machine-readable audit:

```sh
node --import tsx scripts/check-claude-course.mjs --json
```

Fail-closed publication audit:

```sh
node --import tsx scripts/check-claude-course.mjs --release
```

The release command is expected to fail for any Academy or product screenshot that remains `permission-required`, any unresolved screenshot-authenticity record, any unsafe or unlabelled original SVG, any provenance/hash mismatch, or an expired Academy catalogue snapshot. As of 2026-08-26 the Claude-specific release checker passes with twelve original diagrams and three repository-licensed screenshots.
