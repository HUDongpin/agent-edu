# Provenance sidecar: Course 7 reactivation audit

**Audit date:** 2026-08-24  
**Timezone:** Asia/Taipei  
**Course version:** 1.1.0  
**Repository:** `/Users/peter/Desktop/Agentic Engineering`

## Scope contract

This pass verifies and, where possible, corrects the seventh aicourse.top course, How to Write Prompts. The named review targets were:

- guided-duration arithmetic and catalogue/JSON-LD agreement;
- field-level source-extraction evidence;
- exact-return instruction consistency;
- clarifying-question stopping behavior;
- source URL, fragment, title, date, and claim canonicalization;
- evaluation-set, judge, unknown-score, denominator, comparison, and revision wording;
- nine locale shells, Arabic RTL containment, accessibility, responsive behavior, assessment, capstone, discovery metadata, and browser regression;
- additive preservation of Course 6's GitHub integration.

Out of scope:

- copying or bypassing gated DeepLearning.AI content;
- claiming educational effectiveness without learner data;
- translating Course 7's English long-form curriculum into eight additional languages;
- correcting unrelated courses or concurrent shared-worktree changes;
- committing, pushing, merging, or deploying.

## Source verification method

1. Read Course 7's source ledger, manifest, full English copy, fixtures, figure ledger, components, routes, structured data, release checker, and browser tests.
2. Compared all 18 ledger records with the current official page, repository, or first-party indexed result.
3. Checked canonical base URLs and material fragment identifiers, including Google prompt components, OpenAI Structured Outputs failure paths, the 2026-08-18 Model Spec, and OpenAI/Anthropic safety sections.
4. Kept Andrew Ng/DeepLearning.AI curriculum claims separate from model-provider behavior claims and GitHub corroboration.
5. Checked declared licences and reuse notes without inferring permission from public availability.
6. Ran adversarial prompt-contract checks for contradictory output requirements, unsafe authority assumptions, unsupported representative-set wording, unavailable evidence, and score-denominator errors.
7. Ran static validators, lint, browser tests, manual DOM/keyboard/visual checks, and Course 6 regression checks.

## First-party web sources consulted

### DeepLearning.AI

- [AI Prompting for Everyone](https://www.deeplearning.ai/courses/ai-prompting-for-everyone)
  - Current official page verified on 2026-08-24.
  - Supports Andrew Ng, beginner/no-prerequisite audience, 3 hours 4 minutes, 21 video lessons, context, current information, search, source-aware answers, deep research, comparison, critique, multimedia, and no-code building.
- [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/courses/chatgpt-prompt-eng)
  - Current official page verified on 2026-08-24.
  - Supports Isa Fulford and Andrew Ng, beginner level, 1 hour 30 minutes, 9 videos, 7 code examples, OpenAI API/Jupyter/basic Python, iteration, and summarize/infer/transform/expand.
- [New course: ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/the-batch/new-course-chatgpt-prompt-engineering-for-developers)
  - Historical 2023 launch announcement; exact ledger title canonicalized to the current official metadata.
- [Respecting Intellectual Property: How to Share DeepLearning.AI Course Materials Responsibly](https://community.deeplearning.ai/t/respecting-intellectual-property-how-to-share-deeplearning-ai-course-materials-responsibly/681787)
  - Supports the link/paraphrase boundary and original-project attribution.

### OpenAI

- [ChatGPT Enterprise: Practical prompt engineering for everyday work](https://github.com/openai/openai-cookbook/blob/main/examples/chatgpt/chatgpt_prompt_guide/chatgpt_prompt_guide.md)
  - Supports task scoping, structured instructions, acceptance criteria, grounding rules, and a small known-answer evaluation.
  - Does not substantiate distributional representativeness; that claim was removed from this source record.
- [Building Resilient Prompts Using an Evaluation Flywheel](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md)
  - Owns the course's representative/risk-based evaluation and analyze/measure/improve claims.
  - [Aligning your LLM judge](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md#aligning-your-llm-judge) supports validation against human subject-matter-expert labels and a gold-standard dataset.
- [Model guidance](https://developers.openai.com/api/docs/guides/latest-model)
  - Current provider-specific prompting guidance; treated as time-sensitive.
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
  - [Handling mistakes](https://developers.openai.com/api/docs/guides/structured-outputs#handling-mistakes), user-generated input, and refusals sections verified.
  - Supports schema-conformance boundaries, mistakes, incompatible input, refusals, and incomplete/truncated output handling.
- [OpenAI Model Spec, 2026-08-18](https://model-spec.openai.com/2026-08-18.html)
  - [Ignore untrusted data by default](https://model-spec.openai.com/2026-08-18.html#ignore_untrusted_data)
  - [Act within an agreed-upon scope of autonomy](https://model-spec.openai.com/2026-08-18.html#scope_of_autonomy)
  - [Control and communicate side effects](https://model-spec.openai.com/2026-08-18.html#control_side_effects)
  - The ledger and both 2026-08-23 historical reports were corrected to the live underscore fragments.
- [Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)
  - Supports tool approvals, structured data flow, guardrails, trace review, and layered mitigations.
  - The page is a legacy/deprecated Agent Builder guide with a stated 2026-11-30 shutdown; the course does not generalize its product-specific details.

### Google

- [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
  - Verified canonical URL and live fragments for [clear and specific instructions](https://ai.google.dev/gemini-api/docs/prompting-strategies#clear-and-specific-instructions), [few-shot](https://ai.google.dev/gemini-api/docs/prompting-strategies#few-shot), and [prompt components](https://ai.google.dev/gemini-api/docs/prompting-strategies#prompt-components).

### Anthropic

- [Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
  - Supports success-criteria/evaluation-first framing and the limit that not every failure is solved by prompting.
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
  - Treated as current but model- and provider-sensitive.
- [Mitigate jailbreaks and prompt injections](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)
  - Indirect prompt injection, serialized inputs, monitoring, permissions, screening, and layered safeguards were verified.

Direct terminal HTTP checks returned status 200 for 15 of 18 base URLs. The three `platform.claude.com` terminal requests did not complete, but each official page and relevant section was independently verified through the current official web index. No authentication or access control was bypassed.

## GitHub sources consulted

- [Microsoft Prompt Engineering Fundamentals](https://github.com/microsoft/generative-ai-for-beginners/blob/main/04-prompt-engineering-fundamentals/README.md), MIT.
- [Microsoft Creating Advanced Prompts](https://github.com/microsoft/generative-ai-for-beginners/blob/main/05-advanced-prompts/README.md), MIT.
- [DAIR.AI Prompt Engineering Guide](https://github.com/dair-ai/Prompt-Engineering-Guide), MIT; secondary taxonomy/discovery source.
- [Welcome to Anthropic's Prompt Engineering Interactive Tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial), no declared root licence observed; link-only, legacy/model-specific corroboration.

## Local evidence inspected

- `messages/prompts/en.json`: all lesson copy, real prompts, checkpoints, quiz, capstone, and UI labels.
- `lib/prompts/manifest.ts`: nine lessons, units, 365 guided lesson minutes, and 15-minute final check.
- `lib/prompts/sources.ts`: 18-source claim and provenance ledger.
- `lib/prompts/types.ts`: source snapshot and schema contracts.
- `lib/prompts/figures.ts`: nine teaching figures and two raster pairs.
- `public/courses/prompts/course-7-fixture-pack-v1.json`: offline examples, expected behavior, and deliberate failure cases.
- `components/prompts/*`: rendering, progress, assessment, capstone, figures, labels, and accessibility behavior.
- `app/[locale]/prompts/*`: localized shell routes, canonical metadata, JSON-LD, and lesson discovery.
- `app/[locale]/courses/page.tsx`: additive Course 6/Course 7 structured data.
- `scripts/check-prompts-course.mjs`: release invariants and regression guards.
- `tests/prompts-course.spec.ts`: 47-test final browser acceptance suite.

## Browser and accessibility evidence

The stable final Course 7 suite passed 47/47 in Chromium. It covers all nine English lessons; exact prompts; source/fixture and image hashes; semantic diagrams; progress isolation; storage denial; 6/9 fail and 7/9 pass; capstone all-zero cases; English canonical/hreflang behavior; 390/768/1440 widths; Course 6-to-7 catalogue order; all nine locale shells; Arabic RTL with English LTR content; and accessible names, labels, media alternatives, headings, unique IDs, skip navigation, and visible keyboard focus.

The manual browser pass additionally found no console errors or warnings, no Arabic capstone overflow, no duplicate IDs, no unlabelled controls, no unnamed focusable elements, no missing image alternatives/dimensions, and no heading jumps. The first Tab reached the localized skip link with visible focus. This is DOM, accessibility-tree, keyboard, responsive, and visual evidence, not a formal WCAG certification or axe audit.

CLI-first evidence:

- `output/playwright/course7-cli-20260824/.playwright-cli/page-2026-08-24T03-55-56-056Z.png`: English dashboard.
- `output/playwright/course7-cli-20260824/.playwright-cli/page-2026-08-24T03-56-08-416Z.png`: Arabic capstone.
- Adjacent YAML accessibility snapshots and console logs retain the inspected browser state.

The repository's default Playwright HTML and `.last-run.json` locations are shared and were subsequently overwritten by the 26-test Course 6 regression run. They remain green but are not treated as durable Course 7-specific artifacts. The dated CLI directory and this audit retain the Course 7-specific evidence.

An earlier run recorded five failures while another concurrent task had temporarily removed `messages/rag/ar.json`; captured Next.js error overlays prove those were build-state failures, not missing Course 7 figures. After the concurrent files were present, the complete 47-test suite passed. The passing rerun supersedes the transient run.

## Reproducible command evidence

```text
npm run prompts:check:release
PASS: 9 lessons, 18 sources, 9 available figures, 2 verified raster pairs

npx eslint components/prompts/CourseDashboard.tsx components/prompts/PromptInteractions.tsx lib/prompts/types.ts lib/prompts/sources.ts scripts/check-prompts-course.mjs tests/prompts-course.spec.ts 'app/[locale]/courses/page.tsx'
PASS

PLAYWRIGHT_BASE_URL=http://127.0.0.1:3213 npm run test:prompts
PASS: 47/47

npm run github:check:release
PASS: Course 6, 12 lessons, 660 minutes, 9 locales, 44 sources, 21 authentic figures, 24-question bank

PLAYWRIGHT_BASE_URL=http://127.0.0.1:3213 npm run test:github
PASS: 26/26

git diff --check
PASS

npm run i18n:check:release
NOT_ASSESSABLE: whole-site audit includes untranslated or incomplete concurrent courses, native-review and production-evidence gates, and detected workspace drift; Course 7's explicit English-only shell contract was tested separately in all nine locales

npx tsc --noEmit --pretty false
NONZERO: concurrent RAG import/file drift plus missing test-only packages under tmp/capture; no Course 7 diagnostic

npx tsc -p <temporary Course 7-only tsconfig> --pretty false
PASS: components/prompts, lib/prompts, app/[locale]/prompts, and tests/prompts-course.spec.ts
```

## Uncertainty and release boundary

- The source ledger is a 2026-08-24 snapshot. Model and product behavior may drift.
- The long-form course is English. The nine surrounding locale shells are localized navigation contexts, not a claim of nine translated curricula.
- Offline fixtures support diagnosis and revision planning. Empirical before/after claims and a self-authored capstone require live runs.
- Final quiz and capstone results are local formative/self-attested records, not identity-verified certification.
- The Course 7 scoped TypeScript compile and the Course 7/Course 6 release/browser gates are green. The whole-site i18n and repository-wide TypeScript gates remain non-green because of concurrent and out-of-scope repository state; therefore this audit does not claim that the entire site is production-release-ready.
