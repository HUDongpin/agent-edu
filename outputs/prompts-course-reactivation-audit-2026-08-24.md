# Course 7 reactivation, content, and release audit

**Course:** How to Write Prompts  
**Course version:** 1.1.0  
**Source snapshot:** 2026-08-24  
**Scoped outcome:** PASS  
**Whole-site production outcome:** NOT ASSESSABLE from this shared worktree

## Decision

Course 7 passes its dedicated content, source, asset, browser, accessibility, locale-shell, RTL, assessment, capstone, SEO, sitemap, and Course 6 regression gates. The six named content defects are corrected and protected by automated checks. No material factual contradiction remains in the audited Course 7 source set.

This is a scoped Course 7 acceptance, not a claim that the entire concurrently edited site is ready to deploy. The whole-site i18n audit is `NOT_ASSESSABLE` because it includes unfinished translations and human-review/production-evidence gates outside Course 7, and it detected workspace drift while other tasks were writing files. Repository-wide TypeScript also encountered concurrent RAG file drift and unrelated test-only dependencies under `tmp/capture`. No Course 7 TypeScript diagnostic was reported. No commit, push, merge, or deployment was performed.

## Named issue disposition

| Issue | Resolution | Evidence and regression protection |
|---|---|---|
| Duration | Corrected and internally consistent. | Nine lessons total 365 minutes. The final knowledge check adds 15 minutes, so the published guided workload is 380 minutes (6 hours 20 minutes). Manifest, registry, dashboard, Course JSON-LD, catalogue JSON-LD, and all nine root catalogue strings agree. The release checker rejects duration drift. |
| Source-extraction evidence schema | Corrected to field-level evidence. | Policy extraction returns `policy_name_paragraph_id`, `effective_date_paragraph_id`, and `responsible_office_paragraph_id`. A record-level `paragraph_id` remains only inside a clearly labelled failure example. Fixture records and lesson instructions use the same schema. |
| Conflicting exact-return instructions | Corrected. | Lesson 8 requires the exact first line `Status: Not supported by the supplied source.` and then a separate missing-information list. The fixture answer now uses three physical lines: exact status, heading, and bullet. The release checker and browser fixture test enforce the contract. |
| Clarifying-question stop condition | Corrected. | The capstone meta-prompt asks at most three materially consequential questions. If it asks any, it must stop, wait for answers, and not draft the reusable prompt in that turn. |
| Source canonicalization | Corrected. | Snapshot date is 2026-08-24. Google uses the current `prompting-strategies` URL/fragments. The dated Model Spec uses `#ignore_untrusted_data`, `#scope_of_autonomy`, and `#control_side_effects`. Two exact source titles were canonicalized. The prior 2026-08-23 audit links were repaired. Non-English catalogue structured data now points Course 7 and all nine lessons to their English canonical URLs. |
| Evaluation wording | Corrected and source-bounded. | The general OpenAI practical prompt guide supports a small known-answer check but no longer owns the distributional `eval.representative-test-set` claim. The stronger evaluation-flywheel source owns representative/risk-based testing and judge alignment. `unknown` criteria are excluded from both earned and possible points; the denominator and unknown count are reported; scores with different denominators are not compared; source evidence is mandatory for grounding; and an all-full-score result does not invent a revision. |

## Source and factual review

The 18-source ledger was rechecked against current official DeepLearning.AI, OpenAI, Google, Anthropic, Microsoft, and GitHub sources. The source hierarchy is explicit:

1. [Andrew Ng's AI Prompting for Everyone](https://www.deeplearning.ai/courses/ai-prompting-for-everyone) is the central modern curriculum source for beginner/no-prerequisite prompting, context, current-information search, sources, deep research, critique, model comparison, multimedia, and no-code building.
2. [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/courses/chatgpt-prompt-eng), taught by Isa Fulford and Andrew Ng, supplies iterative development and summarize/infer/transform/expand. Its API, Python, and notebook delivery is stated honestly rather than recast as no-code.
3. Current first-party provider documentation governs model-sensitive prompting, structured outputs, evaluation, instruction authority, permissions, and injection controls.
4. Microsoft, DAIR.AI, OpenAI Cookbook, and Anthropic GitHub materials are used according to their authority, currency, and licence/reuse boundaries.

The full comparison and claim-ownership record is in `outputs/prompts-course-source-comparison-2026-08-24.md`. The detailed web and local evidence trail is in `outputs/prompts-course-reactivation-audit-2026-08-24.provenance.md`.

## Instructional contract review

### Prompt-writing model

The six-part structure is explicitly this course's optional scaffold, not a universal provider taxonomy:

1. Goal
2. Context
3. Task
4. Constraints
5. Output
6. Success Criteria

Learners see complete, copyable prompts and relationship-specific figures rather than decorative imagery. The prompt workbench image displays exactly the six labels. Other figures encode task-to-test flow, instruction/data authority, zero-shot/few-shot comparison, four task families, evaluation loops, checkable chains, evidence mapping, and the six-part capstone packet.

### Evidence, grounding, and safety

- Retrieved, quoted, uploaded, or tool-returned content is treated as untrusted data unless a higher-authority instruction explicitly delegates authority.
- External data is serialized and separated from instructions.
- Evidence is field- or claim-level; an authoritative domain or document title is not enough.
- The grounding lesson distinguishes direct support, inference, conflict, missing evidence, and unknown.
- Delimiters are not described as a security sandbox.
- Tool permissions, consequential approvals, validation, trace review, and monitoring remain application controls outside prompt prose.
- Structured output is separated from factual correctness and includes refusal, incompatible-input, incomplete-output, and model-mistake boundaries.

### Evaluation

- The baseline set follows the task distribution and material risks rather than being declared representative merely because a model generated it.
- The comparison holds model, product surface, settings, source set, prompt version, and fresh-conversation procedure fixed.
- One targeted change is followed by a full rerun, with regressions shown.
- Automated judges require human/ground-truth validation.
- A factual-grounding score requires the source record and paragraph evidence.
- `unknown` cannot silently become zero or receive invented evidence.

## Assessment and capstone acceptance

The final knowledge check uses nine independent scenario-transfer questions with a fixed answer key and source/claim mapping. The exact boundary was browser-tested: 6/9 fails and 7/9 passes.

The capstone requires all six named evidence artifacts:

1. Prompt version 1.
2. Six-case baseline.
3. Failure log.
4. Prompt version 2 and change log.
5. Before-and-after result table.
6. Reusable prompt card with limitations.

Five rubric criteria are each scored 0, 1, or 2. Passing requires at least 8/10 and no criterion scored zero. The browser suite independently set each criterion to zero while holding the others at two and confirmed that every such 8/10 state fails. A 10/10 state with all six artifacts enables the local self-attested pass, persists the v2 evidence/scores, and survives reload. Retired v1 progress does not count.

## Locale, RTL, accessibility, and browser acceptance

All nine platform locales were exercised in Chromium:

| Locale | Shell direction | Course content language/direction | Result |
|---|---:|---:|---:|
| en | LTR | English / LTR | PASS |
| es | LTR | English / LTR, disclosure shown | PASS |
| fr | LTR | English / LTR, disclosure shown | PASS |
| de | LTR | English / LTR, disclosure shown | PASS |
| zh-Hans | LTR | English / LTR, disclosure shown | PASS |
| zh-Hant | LTR | English / LTR, disclosure shown | PASS |
| ja | LTR | English / LTR, disclosure shown | PASS |
| ko | LTR | English / LTR, disclosure shown | PASS |
| ar | RTL | English / LTR, disclosure shown | PASS |

Every dashboard and representative lesson returned 200, exposed the correct shell `lang` and `dir`, kept the course root at `lang="en" dir="ltr"`, and computed LTR content inside Arabic RTL. Canonical metadata consistently identifies `/en/prompts/` and the English lesson URLs. Only English Course 7 pages appear in the sitemap and hreflang set.

Accessibility and interface review found:

- one visible `h1` and one `main` per audited page;
- no heading jumps or duplicate IDs;
- no missing image alternatives or dimensions;
- no unnamed focusable controls or unlabelled inputs;
- legends for fieldsets and meaningful names for capstone checkboxes;
- working skip navigation and visible keyboard focus;
- no horizontal overflow at 390, 768, or 1440 CSS pixels;
- no console errors or warnings in the stable manual pass;
- an eager above-fold hero with high fetch priority;
- quiz submit controls that remain available for native required-field validation.

This evidence is a DOM, browser accessibility-tree, keyboard, responsive, and visual audit. It is not a formal axe or WCAG conformance certification.

## Regression and release evidence

| Gate | Result | Meaning |
|---|---:|---|
| `npm run prompts:check:release` | PASS | 9 lessons, 18 sources, 9 figures, 2 verified raster pairs, duration, source/claim, fixture, capstone, and asset contracts. |
| Scoped ESLint | PASS | No lint error in changed Course 7 components, source/types, validator, tests, or additive catalogue integration. |
| Course 7 Playwright | 47/47 PASS | Routes, figures, fixtures, copying, progress, quiz, capstone, all locale shells, RTL, accessibility, responsive layout, metadata, catalogue, homepage, and sitemap. |
| Course 7 scoped TypeScript | PASS | Course 7 components, library, routes, and browser test type-check in an isolated temporary project. |
| Course 6 release gate | PASS | 12 lessons, 660 minutes, 9 locales, 44 sources, 21 authentic figures, 24-question bank. |
| Course 6 Playwright | 26/26 PASS | Course 6 browser journeys and locale behavior remain intact. |
| Course 6 sentinels | PASS | `loadGithubCourse`, `courseSixParts`, and `github: courseSixParts` remain present alongside Course 7. |
| `git diff --check` | PASS | No whitespace-error patch introduced. |
| Whole-site i18n release audit | NOT ASSESSABLE | Out-of-scope unfinished translations, missing human/production evidence, and concurrent workspace drift; Course 7's explicit English-only nine-shell contract passed separately. |
| Repository TypeScript | NONZERO, no Course 7 diagnostic | Concurrent `lib/rag/load.ts` file drift and missing test-only dependencies under `tmp/capture`; not a Course 7 failure. |

One earlier 47-test attempt encountered five Next.js build overlays while another task temporarily lacked `messages/rag/ar.json`. The captured failures named that missing module. The full stable rerun passed 47/47 and supersedes those infrastructure-only failures.

## Course 6 preservation

The shared catalogue change was reread before and after editing. It still imports and loads `GITHUB_LESSONS`/`loadGithubCourse`, constructs `courseSixParts`, and maps `github: courseSixParts`; Course 7 is additive through `PROMPT_LESSONS`/`loadPromptCourse`, `courseSevenParts`, and `prompts: courseSevenParts`. The Course 6 release and browser gates passed after the Course 7 corrections.

## Remaining limitations

1. Course 7's long-form content is English-only. The localized shell and notice do not constitute a translated curriculum.
2. Offline fixtures support inspection and revision planning, not empirical claims about a live model. Before/after evidence and the capstone require actual runs.
3. Model and provider behavior can change after the 2026-08-24 snapshot.
4. The quiz and capstone are formative/local self-attestation, not identity-verified certification.
5. Accessibility behavior was tested, but no human assistive-technology study or formal WCAG certification was conducted.
6. The legacy OpenAI Agent Builder safety page is retained only for bounded layered-control concepts and carries its deprecation/shutdown caveat.
7. A whole-site production release remains blocked outside this course by the current shared-worktree i18n, native-review, production-evidence, and TypeScript state.

## Release recommendation

Approve Course 7 version 1.1.0 at the dedicated Course 7 release boundary. Do not claim or perform a whole-site production deployment from this shared snapshot until the unrelated global i18n, human-review, production-evidence, and TypeScript gates are resolved and rerun on a stable workspace.
