# Course 7 source-comparison matrix

**Course:** How to Write Prompts  
**Course version:** 1.1.0  
**Evidence snapshot:** 2026-08-24  
**Purpose:** Record which sources support each teaching decision, where recommendations differ, and which claims the course deliberately narrows or rejects.

## Source hierarchy and use boundary

1. Current official DeepLearning.AI course pages provide the Andrew Ng curriculum spine and the boundary between consumer/no-code prompting and developer/API prompting.
2. Current first-party OpenAI, Google, and Anthropic documentation governs provider-sensitive behavior, evaluation, structured output, safety, tools, and model-specific advice.
3. Official GitHub repositories provide inspectable examples and implementation patterns. They do not override newer first-party product documentation.
4. Community repositories provide terminology, taxonomies, and discovery paths only. Material claims are checked against primary sources.
5. DeepLearning.AI course materials are link-and-paraphrase only. Course 7's prompts, figures, fixtures, questions, explanations, and rubrics are original aicourse.top materials.

## Comparison matrix

| Topic | DeepLearning.AI / Andrew Ng | Current provider evidence | GitHub evidence | Course 7 decision |
|---|---|---|---|---|
| Audience | [AI Prompting for Everyone](https://www.deeplearning.ai/courses/ai-prompting-for-everyone) is beginner-facing, requires no prerequisites, and covers current consumer prompting. [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/courses/chatgpt-prompt-eng) uses an API, Python, and notebooks. | Provider API guides are implementation-facing and product-specific. | Microsoft examples are code-oriented. | Make Course 7 readable without code, but state that empirical before/after runs and a self-authored capstone require access to an AI assistant. Never describe the Ng/Fulford course itself as no-code. |
| Curriculum spine | Andrew Ng's current course covers context, web search, deep research, source use, critique, model comparison, multimedia, and no-code building. The Ng/Fulford course contributes iterative development and summarize/infer/transform/expand. | Current provider guides refine model- and product-sensitive advice. | Tutorials corroborate techniques. | Use Andrew Ng as the central pedagogical source while keeping the course original and updating technical details from current primary documentation. |
| Prompt structure | DeepLearning.AI supports clear purpose, context, iteration, and task-relevant information. | [Google's prompt guide](https://ai.google.dev/gemini-api/docs/prompting-strategies#prompt-components) names task, system instructions, few-shot examples, and context; OpenAI and Anthropic use overlapping but different vocabularies. | Microsoft and DAIR.AI offer broader taxonomies. | Teach Goal, Context, Task, Constraints, Output, and Success Criteria as this course's optional drafting scaffold, not a universal standard. |
| Instructions versus data | Current-information and source-aware work requires distinguishing the requested task from retrieved material. | The [2026-08-18 OpenAI Model Spec](https://model-spec.openai.com/2026-08-18.html#ignore_untrusted_data) treats quoted, retrieved, file, and tool content as untrusted by default. | Tutorials demonstrate delimiters and structured fields. | Put authoritative instructions outside serialized untrusted data; delimiters help interpretation but are not a security boundary. |
| Evidence extraction | Source-aware answers are central to the current Andrew Ng course. | Provider guidance does not make record-level citations sufficient for multi-field extraction. | Repository examples show structured extraction. | Require field-level paragraph IDs for every extracted value; allow `null` with missing evidence rather than inventing a value or attaching one paragraph ID to an entire record. |
| Zero-shot versus few-shot | Examples are a practical technique, not a guaranteed improvement. | Google broadly recommends few-shot examples; model behavior and other provider guidance still require empirical validation. | Microsoft and DAIR.AI catalogue both approaches. | Run a one-factor experiment: same full contract, held-out cases, model, surface, settings, source set, and fresh-conversation procedure; add only examples in the few-shot condition. |
| Task families | The Ng/Fulford developer course teaches summarize, infer, transform, and expand. | Providers support many other task and output types. | Community guides contain overlapping taxonomies. | Teach the four jobs as a useful curriculum family, not an exhaustive ontology. |
| Basic prompt evaluation | DeepLearning.AI emphasizes iteration and comparison. | The current OpenAI practical prompt guide recommends a small known-answer check, including roughly 5 to 10 examples, as a basic guardrail. | The guide is an official OpenAI Cookbook repository page. | Use this source for scoping, acceptance criteria, and small known-answer checks only. It does not support a claim that an evaluation set represents the task distribution. |
| Representative evaluation | Iteration alone does not establish generalization. | OpenAI's [evaluation flywheel](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md) supports analyze/measure/improve and risk-relevant evaluation; its judge-alignment section requires comparison against human subject-matter-expert labels and a gold-standard dataset. | The flywheel is the stronger official GitHub evidence for evaluation design. | Build a task-distribution and risk-based set, preserve run metadata, label failures, make one targeted change, rerun all cases, and display regressions. This source alone owns the course claim `eval.representative-test-set`. |
| Automated judges | Not a central public DeepLearning.AI course-page claim. | An LLM judge must be validated against reliable human labels. Candidate text alone cannot prove factual grounding. | OpenAI's evaluation flywheel provides the relevant alignment example. | Give the evaluator source, prompt, candidate, and rubric as untrusted inputs. Require paragraph evidence for grounding. Return `unknown` when evidence is unavailable, excluding it from both earned and possible points. Do not compare percentages across unequal denominators. |
| Exact return contracts | Clear output requests improve inspectability. | Structured-output and prompt guides distinguish formatting contracts from truth and failure handling. | Examples show exact labels and schemas. | When a status line must be exact, require that line first and place any required explanation on later lines. The Lesson 8 answer key follows the same physical-line contract. |
| Structured output | The developer course demonstrates formatted outputs. | [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs#handling-mistakes) constrains schema shape but still documents refusals, incompatible inputs, incomplete/truncated responses, and model mistakes. | SDK examples vary in age. | Separate shape from truth. Validate schema in application code and independently verify claims against sources. |
| Clarifying questions | Iterative prompting supports clarification. | Current guidance favors explicit success criteria and scoped autonomy. | Examples often omit a stopping contract. | Ask no more than three materially consequential questions; if any are asked, stop and wait. Do not draft the reusable prompt in the same turn. |
| Chaining | The developer and systems courses use decomposition. | Anthropic recommends chaining when intermediate outputs need inspection or a fixed pipeline requires it; extra calls also add latency, cost, and failure points. | Microsoft advanced prompts and Anthropic's tutorial catalogue chains. | Chain only at a meaningful, checkable handoff; never claim that more calls automatically improve reliability. |
| Grounding and citations | AI Prompting for Everyone emphasizes well-sourced answers. | Retrieval, citation formatting, and truth are separate properties. | DAIR.AI is discovery support, not current provider authority. | Distinguish direct support, inference, conflict, and no matching evidence. Require claim-level paragraph citations and an explicit unsupported status. |
| Permissions and side effects | Permission enforcement is not a prompt-writing feature. | Model Spec sections on [scope of autonomy](https://model-spec.openai.com/2026-08-18.html#scope_of_autonomy) and [side effects](https://model-spec.openai.com/2026-08-18.html#control_side_effects), plus OpenAI and Anthropic agent-safety guidance, require application-level controls. | Code examples can illustrate validation but cannot grant or constrain real authority. | Enforce least privilege, narrow tools, approvals, input/tool-result validation, trace review, and monitoring outside the prompt. Prompt text may describe a boundary but cannot enforce it. |
| Prompt injection | Modern courses discuss context, but public course pages are not security specifications. | OpenAI and [Anthropic's injection guidance](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks#indirect-prompt-injection) prescribe layered mitigations and do not promise elimination. | Generic delimiter examples are insufficient as security evidence. | Treat external text as data, layer preventive and detective controls, and state residual risk. |
| Reuse and licensing | [DeepLearning.AI's materials policy](https://community.deeplearning.ai/t/respecting-intellectual-property-how-to-share-deeplearning-ai-course-materials-responsibly/681787) restricts direct reuse of lessons, quizzes, labs, notebooks, prompts, and related materials. | Provider-site terms continue to apply. | Microsoft and DAIR.AI declare MIT; Anthropic's interactive tutorial has no declared root licence in this audit. | Link and paraphrase. Use original Course 7 materials. Treat the Anthropic tutorial as link-only and legacy/model-specific. |

## Canonical source ledger decisions

| Source | Role | Currency | Release decision |
|---|---|---|---|
| DeepLearning.AI, AI Prompting for Everyone | Primary curriculum | Current | Central modern Andrew Ng source. Recheck product/model details before future releases. |
| DeepLearning.AI, ChatGPT Prompt Engineering for Developers | Primary curriculum | Historical/current curriculum reference | Retain for iterative prompting and four-task taxonomy; preserve its API/Python boundary. |
| DeepLearning.AI, New course: ChatGPT Prompt Engineering for Developers | Primary announcement | Historical | Title canonicalized to the current official metadata; use for 2023 launch provenance only. |
| DeepLearning.AI materials policy | Primary reuse policy | Current | Link-only and paraphrase-only boundary for proprietary course assets. |
| OpenAI practical prompt guide | Primary official GitHub guide | Current | Supports scoping, structure, criteria, grounding rules, and a small known-answer check. Does not own the representative-set claim. |
| OpenAI evaluation flywheel | Primary official GitHub guide | Current | Owns representative/risk-based evaluation and LLM-judge alignment claims. |
| OpenAI model guidance | Primary provider documentation | Current | Use for model-sensitive prompting; recheck at release time. |
| OpenAI Structured Outputs | Primary provider documentation | Current | Use for schema and documented failure boundaries. |
| OpenAI Model Spec, 2026-08-18 | Primary specification | Dated current snapshot | Use canonical underscore anchors for untrusted data, scope, and side effects. |
| OpenAI Safety in building agents | Primary provider documentation | Legacy/deprecated product page | Use only for the stated layered-control concepts. Agent Builder is deprecated and scheduled to shut down on 2026-11-30. |
| Google prompt design strategies | Primary provider documentation | Current | Use canonical `prompting-strategies` URL and live section fragments. |
| Anthropic prompt-engineering overview | Primary provider documentation | Current | Use for criteria/evaluation-first framing and the boundary that not every failure is fixed by prompting. |
| Anthropic prompting best practices | Primary provider documentation | Current, model-sensitive | Use with provider/model caveats. |
| Anthropic injection mitigation | Primary provider documentation | Current | Use for indirect injection and layered mitigations. |
| Microsoft fundamentals and advanced prompts | Corroborating official GitHub lessons | Mixed | Use as MIT-licensed examples and terminology, not current provider authority. |
| DAIR.AI Prompt Engineering Guide | Corroborating community GitHub guide | Mixed | Use as an MIT taxonomy/discovery map only. |
| Welcome to Anthropic's Prompt Engineering Interactive Tutorial | Corroborating official GitHub tutorial | Legacy | Exact README title retained; link-only because no root licence was found. |

## Disagreements preserved as learning decisions

1. Few-shot prompting is neither universally required nor universally obsolete. The course makes it a controlled test.
2. A small known-answer check is useful, but it is not evidence that a test set represents the deployment distribution. Those claims now have different source ownership.
3. Schema conformance and factual correctness remain separate evaluation dimensions.
4. Delimiters and prompt wording improve interpretation, but application permissions and validation determine actual authority.
5. Current model guidance can supersede old repository examples. Legacy examples remain labelled and never silently generalized.

## Audit conclusion

The 2026-08-24 comparison found no remaining material contradiction in Course 7 after correcting duration accounting, field-level source evidence, the exact-return answer key, the clarifying-question stop rule, canonical source fragments/titles, and evaluation-claim ownership. Provider-sensitive guidance remains a dated snapshot and must be rechecked for a later release.
