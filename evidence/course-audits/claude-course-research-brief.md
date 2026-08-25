# Research brief: Course 3 — How to Use Claude

Status: product slice implemented; public release blocked by unresolved rights for 12 Claude Academy images and unreproducible source-to-local provenance for Figure 01<br>
Research snapshot: 2026-08-24 (Asia/Taipei)<br>
Course version: 1.0.0<br>
Primary audience: first-time through intermediate Claude users who need transferable, evidence-based work practices

## Executive decision

Build a 15-lesson, 14.5-hour course around a single durable progression:

1. choose the right Claude surface;
2. describe an observable outcome;
3. iterate with examples and feedback;
4. discern, verify, and protect;
5. build durable context with files and Projects;
6. create and audit Artifacts and research outputs;
7. extend Claude with the minimum necessary tools and permissions;
8. transfer the method into software engineering, research and data, writing and office work, and teaching;
9. complete a six-artifact portfolio using all four AI Fluency dimensions.

This is not a catalogue of buttons and it does not promise that a particular plan, model label, or interface position will remain current. The course treats UI figures as dated evidence, current Help Centre pages as the operational source of truth, and Claude Academy as the principal instructional spine.

## Evidence hierarchy

The course uses four evidence levels.

| Priority | Source class | Course use | Boundary |
|---|---|---|---|
| 1 | Claude Academy | Curriculum sequence, signature moves, conceptual introductions, guided interface examples | Older product and entitlement details are not treated as current when newer Help Centre guidance differs |
| 2 | Claude Help Centre and official pricing | Current plan, availability, permission, safety, and workflow details | Date-stamped because these details can change |
| 3 | Anthropic GitHub repositories | Concrete engineering, research, knowledge-work, office, and teaching workflow patterns | Repositories are pinned to commits; performance claims are not inferred from examples |
| 4 | Licensed community GitHub repositories | Practitioner patterns and transfer examples | Used as corroborating experience, never as product documentation or causal efficacy evidence |

The live Claude Academy catalogue at `https://academy.claude.com/assets/data/catalog.json` contained 289 items in the 2026-08-21 generated snapshot. The snapshot is accepted only until its recorded 2026-09-20 stale-after boundary. Exact resource URLs are used; guessed or search-derived Academy slugs are not accepted into the source ledger.

## Instructional spine

### Claude Academy

The principal sequence is grounded in [Claude 101](https://academy.claude.com/courses/claude-101), which introduces core Claude workflows, and [Getting good at Claude](https://academy.claude.com/tutorials/getting-good-at-claude-a-research-backed-curriculum), which shifts attention from isolated prompt tricks to repeated human judgement.

The design decision is to make Discernment recur in every lesson. A learner sees a named “Discernment checkpoint” after the guided task and must distinguish a plausible output from an adequately verified one. This prevents later lessons about tools and agents from silently equating successful execution with correct or authorised work.

The capstone operationalises the complete AI Fluency model:

| Dimension | Weight | Course meaning |
|---|---:|---|
| Delegation | 25 | Select an appropriate task, surface, authority boundary, and human role |
| Description | 25 | Make the outcome, inputs, constraints, exclusions, and acceptance tests reproducible |
| Discernment | 30 | Verify claims and outputs using methods capable of revealing error |
| Diligence | 20 | Protect people and data, respect permissions and rights, disclose AI use, and retain accountability |

### Retrieval and product-truth rule

When Academy and current support guidance conflict, the course preserves the Academy concept but follows the newer support page for operation. Examples include Projects, Research, Skills, Connectors, file creation, Cowork, and tool access:

- [Projects](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects)
- [Research](https://support.claude.com/en/articles/11088861-use-research-on-claude)
- [Skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude)
- [Connectors](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)
- [File creation and editing](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude)
- [Artifacts](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) and [publishing/sharing](https://support.claude.com/en/articles/9547008-publish-and-share-artifacts)
- [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork)
- [Cowork safety and cloud execution](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely)
- [Cowork architecture](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview), including cloud-by-default execution, temporary sandbox lifecycle, account persistence, existing Desktop local execution, and the Desktop device bridge
- [Tool access](https://support.claude.com/en/articles/13730515-manage-claude-s-tool-access)
- [Plans & Pricing](https://claude.com/pricing), including Claude Code on all paid plans and the Free-plan Chat/code/file fallback

The course makes plan-sensitive pathways optional. Chat supplies the baseline route. Research, Cowork, Code, Connectors, and Skills are extensions when the learner’s account, organisation, surface, and administrator permit them. No learner must connect a live account, grant write access, or expose personal data to complete the course.

## Curriculum contract

| Unit | Lesson | Minutes | Transfer outcome |
|---|---|---:|---|
| 1. Direct Claude | Choose your surface | 35 | Match Chat, Cowork, Code, or another available surface to the task and authority boundary |
|  | Describe the outcome | 45 | Write an observable task contract with context, constraints, exclusions, and acceptance checks |
|  | Iterate with examples | 40 | Diagnose one failure at a time and use examples as evidence, not decoration |
|  | Discern, verify, protect | 50 | Apply consequence-matched verification, privacy review, and least privilege |
| 2. Build durable work | Work with files | 45 | Create or inspect a native deliverable and verify it outside Claude |
|  | Build Projects | 50 | Separate durable Project context, instructions, files, and individual chats |
|  | Create Artifacts | 45 | Iterate on a visible Artifact and audit its sharing boundary |
|  | Research with citations | 60 | Audit source identity, claim fit, dates, contradictions, and inference |
| 3. Extend and delegate | Extend with tools | 50 | Evaluate a Skill or Connector before enabling it and grant only necessary access |
|  | Delegate with Cowork | 60 | Confirm the deployment’s execution mode, then scope a bounded task with a dedicated connected folder, manual approvals, and recoverable copies |
|  | Software engineering | 70 | Move from issue to bounded diff, tests, review, and safe handoff |
| 4. Apply and demonstrate | Research and data | 70 | Create a reproducibility passport linking sources, transformations, code, checks, and uncertainty |
|  | Writing and office | 70 | Produce and natively inspect a memo, document, workbook, or presentation |
|  | Teaching and learning | 60 | Ground an activity, preserve learner thinking, and keep assessment decisions human |
|  | Portfolio capstone | 120 | Submit a six-artifact, four-dimension, self-audited work portfolio |

Total guided duration is 870 minutes. Every lesson contains three teaching sections, one real-interface figure, one three-step practice, two requested evidence items, one safety boundary, one Discernment checkpoint, and two source-traceable quiz questions.

## GitHub workflow transfer

### Software engineering

The engineering pathway triangulates official repositories with one mature community workflow:

- [anthropics/claude-code](https://github.com/anthropics/claude-code) supports repository-aware work and surface selection. Its repository is link-and-paraphrase only because no general root reuse licence was established in the audit.
- [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) supports review, scheduled maintenance, and human-gated GitHub workflows.
- [anthropics/cwc-workshops](https://github.com/anthropics/cwc-workshops) supports interview-to-specification, divergent prototypes, and machine-verifiable acceptance contracts.
- [obra/superpowers](https://github.com/obra/superpowers) contributes plan-first, systematic debugging, testing, and independent review practices as practitioner evidence.

The course excludes bypass-permission advice, unattended production changes, and unverified productivity claims. Learners work in version control, inspect the complete diff, run focused and broader checks, and retain a rollback path.

### Research and data

[anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) and [pedrohcgs/claude-code-my-workflow](https://github.com/pedrohcgs/claude-code-my-workflow) inform an auditable research workflow: narrow question, versioned sources, explicit transformation log, reproducible code or formulas, sample recalculation, claim-to-source checking, and a record of uncertainty. Community thresholds are not imported as universal standards.

The lesson distinguishes:

- a URL that opens from a source that supports the claim;
- valid code from a valid inference;
- a plausible chart from a chart with correct units, denominators, scales, and uncertainty;
- Claude’s self-critique from an independent check capable of falsifying the output.

### Writing and office work

[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins), [SNL-UCSB/paper-writing-skill](https://github.com/SNL-UCSB/paper-writing-skill), and [chrisblattman/claudeblattman](https://github.com/chrisblattman/claudeblattman) support a context–plan–draft–review–handoff pattern. The course requires inspection in the deliverable’s native application because a polished chat preview does not establish correct page layout, formulas, speaker notes, comments, links, accessibility, or file integrity.

A generated draft never authorises sending, signing, publishing, or editing a live workplace system. Those actions remain outside the exercise unless a person separately approves them.

### Teaching and learning

[anthropics/k12-teacher-skills](https://github.com/anthropics/k12-teacher-skills), [DrCatHicks/learning-opportunities](https://github.com/DrCatHicks/learning-opportunities), and the Academy’s teacher examples support goal grounding, differentiation, predict-before-generation, trace-and-debug, and teach-back. The course explicitly separates a good instructional design affordance from evidence that students actually learned.

Claude does not make high-impact grading, placement, discipline, accommodation, or safeguarding decisions in the course. Practices use synthetic students and public content. Teacher review remains required, and LLM-as-judge scores are not treated as classroom validation.

## Assessment design

The 30-question bank is balanced across the four units (8, 8, 6, and 8 items). Each final attempt draws four questions per unit for a 16-question stratified attempt. The passing threshold is 13 correct answers, and the browser retains the learner’s best score for the current versioned bank.

The capstone is deliberately a portfolio, not a generated certificate. It requires:

1. task brief;
2. input and data log;
3. prompt and run log;
4. final deliverable;
5. independent verification record;
6. disclosure and reflection.

The learner completes a conservative 100-point self-audit. The completion control remains disabled until all six artifacts are attested, the weighted four-dimension self-score reaches at least 80/100, and the learner explicitly confirms that no critical privacy, permission, fabricated-evidence, or undisclosed high-impact failure remains. The interface states that this is not an independently verified credential; a self-score cannot substitute for evidence.

## Interface figures and accessibility

The implemented figure ledger contains 15 local PNG masters and 30 responsive WebP derivatives. Every served image has a pinned SHA-256 digest. Each master additionally records intrinsic dimensions, observation date, source URL, privacy checklist, teaching intent, localized alt text and caption, and visible source attribution.

The images are evidence, not navigation instructions. Captions date the observed UI; lesson prose provides a text-equivalent workflow; and learners are told that visible buttons, model labels, plan labels, and beta states can change.

### Release blocker

Twelve images are excerpts of Claude Academy-hosted interface images. No general redistribution licence was found on the relevant Academy pages. Their ledger state is `permission-required`. Three repository-hosted images have pinned, recorded licences: Figures 06 and 12 under MIT, and Figure 11 under Apache 2.0. Their UI and trademark caveat remains disclosed.

Authenticity and republication rights are separate gates. A live match to an official Academy page can support authenticity without granting permission to republish the image. Conversely, permission cannot cure an unverified source chain. On 2026-08-24, eleven of the twelve Academy figures matched assets still served by their cited pages. Figure 01 did not match any current page asset, and the current ledger lacks an immutable source asset, source hash, and reproducible transformation record for the local montage. Figure 01 therefore carries the independent `CLAUDE-FIG-01-PROVENANCE-UNVERIFIED` blocker and must remain unpublished even if a general image permission is later obtained; it requires exact-source evidence or an approved replacement.

Figure 11 replaced the former Academy-derived Desktop Code image on 2026-08-23. Its new source is `claude-md-improver-example.png` from Anthropic's official `anthropics/claude-plugins-official` repository at commit `340e33aef211d95769d252324854497af871dafe`. The local PNG differs only by metadata removal; the two responsive WebP derivatives are additionally resized and compressed. The authentic Claude Code terminal view visibly supports the lesson's repository-instruction audit objective without being mislabeled as the Desktop graphical interface.

The development build can display the current figures for internal review. The release checker must fail in `--release` mode until a defensible publication basis is documented. Preferred resolution:

1. obtain written permission from Anthropic for the identified Academy image excerpts, while separately resolving Figure 01’s exact provenance; or
2. replace them with current, self-captured, synthetic-account screenshots and complete authenticity, privacy, terms, trademark, and publication-rights review.

No public deployment should be described as release-ready while this gate remains open.

## Internationalisation and inclusion

The course contract includes English, Spanish, French, German, Simplified Chinese, Traditional Chinese, Japanese, Korean, and Arabic. Locale files must preserve exact object shape, array lengths, and named placeholders. Right-to-left layout is inherited from the site’s locale shell. Translation acceptance includes automated parity checks and browser inspection of long German/French strings, CJK line breaks, and Arabic directionality.

Product access is separated from learning access. Feature-dependent lessons contain a Chat or paper-based fallback, and optional advanced surfaces do not control quiz or capstone completion. Practices use public, synthetic, or explicitly authorised inputs.

## Acceptance gates

The product slice is acceptable for shared integration only when all of the following pass:

- manifest contract: 4 units, 15 lessons, 870 minutes, 15 practices, 15 figures, 30 questions;
- locale contract: all 9 files are valid JSON with exact structural, placeholder, protected technical-token, and targeted product-identity parity;
- evidence contract: every lesson, quiz, and figure resolves to a known source ID or provenance URL;
- figure contract: local-only paths, valid PNG/WebP signatures, declared dimensions, checksums for every served asset, and privacy records;
- assessment contract: balanced final attempts, versioned best-score storage, all-six-artifact gate, weighted 80/100 self-score gate, critical-risk attestation, and no credential inflation;
- route contract: dashboard plus 15 lesson routes for every locale under static export;
- browser contract: keyboard, mobile, RTL, progress persistence, quiz, print/export, and no remote image dependencies;
- freshness contract: Academy catalogue is refreshed once stale and volatile product claims are rechecked;
- publication contract: no `permission-required` image or unresolved authenticity/provenance blocker remains in a public release.

## Open decisions

1. Resolve the 12 remaining Academy image permissions or replace the images before deployment; independently recover Figure 01’s immutable source chain or replace it.
2. Re-run the live Academy catalogue audit after 2026-09-20 or before any later release, whichever comes first.
3. Recheck plan and surface availability immediately before publication.
4. Complete the additive shared integration only after Course 4 and Course 5 provide their stable metadata and route contracts.
