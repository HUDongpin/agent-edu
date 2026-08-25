# Provenance sidecar: Course 7 content audit

**Audit date:** 2026-08-23  
**Timezone:** Asia/Taipei  
**Course version after correction:** 1.1.0  
**Repository:** `/Users/peter/Desktop/Agentic Engineering`

## Scope contract

The task was to verify and correct the factual and instructional integrity of Course 7, How to Write Prompts. In scope:

- public official course pages and public first-party documentation;
- selected public GitHub sources already declared by the course;
- all Course 7 lesson copy, prompts, quiz items, capstone rubric, source ledger, figures, fixture pack, route metadata, and browser behavior;
- additive Course 7 changes in shared SEO and sitemap code;
- regression protection for Course 6 GitHub integrations.

Out of scope:

- bypassing authentication, paywalls, bot protection, or gated course access;
- copying DeepLearning.AI videos, transcripts, labs, notebooks, quizzes, assignments, screenshots, or answer keys;
- claiming learning efficacy without learner data;
- resolving unrelated concurrent Course 8, Claude, Cursor, MCP, or Make Money with Codex build failures.

## First-party web sources consulted

### DeepLearning.AI

- [AI Prompting for Everyone](https://www.deeplearning.ai/courses/ai-prompting-for-everyone)
  - Supports instructor Andrew Ng, beginner/no-prerequisite audience, current-information/search/deep-research topics, context, critique, model comparison, multimedia, code, and no-code building.
  - Final direct fetch returned HTTP 403 bot protection. The official canonical URL and indexed official page content remained discoverable. No bypass was attempted.
- [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/courses/chatgpt-prompt-eng)
  - Supports Isa Fulford and Andrew Ng, collaboration with OpenAI, iterative prompting, summarize/infer/transform/expand, API/notebook context, and basic Python prerequisite.
  - Final direct fetch returned HTTP 403 bot protection. Earlier official-page verification and the repository's dated source ledger were retained.
- [Community Guidelines](https://community.deeplearning.ai/guidelines)
  - Supports the honor-code and public sharing boundary for homework, quizzes, exams, slides, and lecture notes.
- [Respecting Intellectual Property: How to Share DeepLearning.AI Course Materials Responsibly](https://community.deeplearning.ai/t/respecting-intellectual-property-how-to-share-deeplearning-ai-course-materials-responsibly/681787)
  - Supports the direct-course-material restriction and citation of original course-inspired project code.

### OpenAI

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [Building Resilient Prompts Using an Evaluation Flywheel](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md)
  - [Aligning your LLM judge](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md#aligning-your-llm-judge)
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
  - [Handling mistakes](https://developers.openai.com/api/docs/guides/structured-outputs#handling-mistakes)
  - [Refusals](https://developers.openai.com/api/docs/guides/structured-outputs#refusals)
- [Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)
  - Supports MCP tool approvals, structured data flow, input guardrails, trace review, and layered mitigations.
  - The page is under Legacy APIs; Agent Builder is deprecated and scheduled to shut down on 30 November 2026. Product-specific recommendations were not generalized.
- [OpenAI Model Spec, 2026-08-18](https://model-spec.openai.com/2026-08-18.html)
  - [Ignore untrusted data by default](https://model-spec.openai.com/2026-08-18.html#ignore_untrusted_data)
  - [Act within an agreed-upon scope of autonomy](https://model-spec.openai.com/2026-08-18.html#scope_of_autonomy)
  - [Control and communicate side effects](https://model-spec.openai.com/2026-08-18.html#control_side_effects)

### Google

- [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
  - [Clear and specific instructions](https://ai.google.dev/gemini-api/docs/prompting-strategies#clear-and-specific-instructions)
  - [Few-shot prompts](https://ai.google.dev/gemini-api/docs/prompting-strategies#few-shot)
  - [Prompt components](https://ai.google.dev/gemini-api/docs/prompting-strategies#prompt-components)

### Anthropic

- [Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Mitigate jailbreaks and prompt injections](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)
  - Supports least privilege, narrow permissions, sandboxed tools, untrusted tool-result screening, continuous monitoring, and layered safeguards.
  - Claude-specific message formats and named-model examples were not generalized.

## GitHub sources consulted

- [Microsoft Generative AI for Beginners: Prompt Engineering Fundamentals](https://github.com/microsoft/generative-ai-for-beginners/blob/main/04-prompt-engineering-fundamentals/README.md), MIT.
- [Microsoft Generative AI for Beginners: Creating Advanced Prompts](https://github.com/microsoft/generative-ai-for-beginners/blob/main/05-advanced-prompts/README.md), MIT.
- [DAIR.AI Prompt Engineering Guide](https://github.com/dair-ai/Prompt-Engineering-Guide), MIT; used as a community taxonomy and discovery map.
- [Welcome to Anthropic's Prompt Engineering Interactive Tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial), no declared root licence found; link-only and treated as legacy/model-specific corroboration.

## Local evidence inspected

- `messages/prompts/en.json`: course copy, prompts, formative checkpoints, final quiz, capstone.
- `lib/prompts/manifest.ts`: unit, lesson, timing, source, figure, and version contract.
- `lib/prompts/sources.ts`: 18-source provenance ledger.
- `lib/prompts/figures.ts`: nine-figure ledger and raster hashes.
- `components/prompts/*`: rendering, quiz, persistence, capstone, and semantic figures.
- `public/courses/prompts/course-7-fixture-pack-v1.json`: synthetic offline practice pack.
- `scripts/check-prompts-course.mjs`: development and release validation.
- `tests/prompts-course.spec.ts`: browser acceptance suite.
- `lib/seo.ts`, `app/sitemap.ts`, and `app/[locale]/prompts/*`: canonical, hreflang, JSON-LD, and sitemap behavior.
- `app/[locale]/courses/page.tsx`: Course 6 preservation sentinels and Course 7 catalogue relationship.

## Visual-asset provenance

The corrected workbench is an edit of the existing original aicourse.top workbench image using OpenAI's built-in image-generation tool. The exact creation prompt is stored in `lib/prompts/figures.ts`.

- PNG: `/public/courses/prompts/prompt-workbench-v2.png`
  - Dimensions: 1536 x 1024
  - SHA-256: `a5b67e088e559f67314ce812313e947ec433f6af9d4b99eea2b0f14115ba33d1`
- WebP: `/public/courses/prompts/prompt-workbench-v2.webp`
  - Dimensions: 1536 x 1024
  - SHA-256: `da07ae6ef9c65098621b7e07c2f73efacccea29bcebb4ba99d4d7a33a6714df6`

The prior workbench PNG/WebP pair was intentionally retained as a recoverable historical asset. The evaluation-loop raster was not regenerated because its visible labels were already correct after the course copy was standardized to American spelling.

## Search and verification procedure

1. Read the complete Course 7 copy, source ledger, manifest, figure ledger, components, route metadata, validator, and tests.
2. Verified DeepLearning.AI curriculum attribution against official canonical pages or indexed first-party page content.
3. Compared each provider-sensitive claim with current official OpenAI, Google, and Anthropic documentation.
4. Checked instruction authority against the dated OpenAI Model Spec and application controls against current OpenAI and Anthropic security guidance rather than relying on generic prompt tutorials.
5. Checked GitHub owner, declared licence, currency, and whether the repository was primary or corroborating.
6. Ran an adversarial content audit for contradictions, unsatisfiable prompts, evidence gaps, security overclaims, assessment leakage, and misleading metadata.
7. Corrected the source ledger, prompts, copy, assessment, capstone, fixtures, figures, and discovery metadata.
8. Ran the release checker, scoped ESLint, repository-wide TypeScript, diff whitespace check, and 35-test Course 7 Playwright suite.
9. Captured and visually inspected the six semantic teaching figures as a contact sheet.
10. Rechecked the Course 6 sentinels after editing shared SEO and sitemap files.

## Reproducible command evidence

```text
npm run prompts:check:release
PASS: 9 lessons, 18 sources, 9 available figures, 2 verified raster pairs

npx eslint components/prompts 'app/[locale]/prompts' lib/prompts scripts/check-prompts-course.mjs tests/prompts-course.spec.ts lib/seo.ts app/sitemap.ts
PASS

PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:prompts
PASS: 35/35

npm run github:check:release
PASS: Course 6, 12 lessons, 660 minutes, 9 locales, 40 sources, 21 authentic figures, 24-question bank

PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:github
PASS: 26/26

git diff --check
PASS

npx tsc --noEmit --pretty false
NONZERO: unrelated concurrent Cursor locale-copy parity errors in lib/cursor/load.ts; no Course 7, shared catalogue, Course 6, lib/seo.ts, or app/sitemap.ts diagnostic
```

## Uncertainty and drift policy

- All current-product details are a 2026-08-23 snapshot and may drift.
- Exact model behavior must be tested on the deployed model, product surface, settings, tools, and source set.
- "No declared licence found" means no licence was observed in the audited repository root; it is not a legal conclusion about every file.
- "No material factual contradiction remains" is bounded to the audited source set and implemented course, not all possible prompt-engineering knowledge.
- Browser and validator passes establish product behavior under the tested environment, not production deployment or educational effectiveness.
