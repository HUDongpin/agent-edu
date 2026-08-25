# Course 7 content and release audit

**Course:** How to Write Prompts  
**Course version:** 1.1.0  
**Evidence snapshot:** 2026-08-23  
**Audit outcome:** The course passes its Course 7 release gate. No material factual contradiction remains in the instructional content. The course is suitable for publication as an original, English-language prompt-engineering course, subject to the limitations below.

## Decision

Course 7 is not presented as a transcription or substitute for an Andrew Ng course. It is an original aicourse.top course whose source policy is now explicit:

- [Andrew Ng's AI Prompting for Everyone](https://www.deeplearning.ai/courses/ai-prompting-for-everyone) supports the modern consumer-facing treatment of context, source-aware search, deep research, critique, model comparison, multimedia, and no-code use.
- [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/courses/chatgpt-prompt-eng), taught by Isa Fulford and Andrew Ng in collaboration with OpenAI, supports iterative prompt development and the summarize, infer, transform, and expand task family. The original course uses Python, an API, and notebook exercises; Course 7 deliberately provides a no-code adaptation instead of claiming the same delivery mode.
- Current first-party guidance from [OpenAI](https://developers.openai.com/api/docs/guides/prompt-engineering), [Google](https://ai.google.dev/gemini-api/docs/prompting-strategies), [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview), and the [OpenAI Model Spec](https://model-spec.openai.com/2026-08-18.html) supports model-current and safety-sensitive claims. Application controls are additionally bounded by OpenAI's [Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety) and Anthropic's [Mitigate jailbreaks and prompt injections](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks), including their provider/product caveats.
- Selected GitHub references provide corroboration and taxonomies, not authority over current provider behavior. Microsoft and DAIR.AI repositories are used under their declared MIT licences; Anthropic's public interactive tutorial has no declared licence in the audited repository and is therefore link-only.

The public [DeepLearning.AI course-material policy](https://community.deeplearning.ai/t/respecting-intellectual-property-how-to-share-deeplearning-ai-course-materials-responsibly/681787) prohibits direct commercial reuse of quizzes, lectures, labs, and other course materials while permitting newly authored, course-inspired projects with attribution. The Course 7 prompts, exercises, quiz items, fixtures, rubrics, and figures are newly authored. No gated DeepLearning.AI quiz, lab, transcript, notebook, or answer key was used.

## Claim audit

| Course proposition | Audit status | Evidence and boundary | Course treatment |
|---|---|---|---|
| A prompt should define an observable task and acceptance criteria. | Supported | OpenAI's current prompt guidance emphasizes clear instructions, context, and output requirements; Anthropic recommends defining success criteria and evaluations before optimizing prompts. | Retained. The course treats a prompt as a testable specification, not magic wording. |
| Prompt quality cannot repair missing evidence, tools, permissions, or product architecture. | Supported | [Anthropic's overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) explicitly frames prompt engineering as one optimization lever rather than a universal fix. The [Model Spec](https://model-spec.openai.com/2026-08-18.html#control_side_effects) addresses scope and side effects outside prompt prose. | Retained and made more explicit in Lessons 1, 8, and 9. |
| Goal, context, task, constraints, output, and success criteria form a universal provider taxonomy. | Not supported as a universal claim | Providers use overlapping but non-identical terminology. | Corrected. The six-part structure is now labelled "this course's optional drafting scaffold." |
| Quoted, retrieved, or tool-returned text does not automatically gain instruction authority. | Supported | The [OpenAI Model Spec section on untrusted data](https://model-spec.openai.com/2026-08-18.html#ignore_untrusted_data) treats quoted text, files, tool output, and similar material as untrusted by default. | Retained. Prompts now require provider-native untrusted fields where available or correctly escaped JSON, YAML, or XML. |
| Delimiters alone solve prompt injection. | Rejected | The Model Spec describes interpretation behavior, not a complete application-security boundary. OpenAI and Anthropic both describe layered application controls and explicitly avoid a no-risk guarantee. | Corrected. The course teaches least privilege, narrowly scoped tools, application-enforced approvals, input and tool-result validation, trace review, and continuous monitoring around the model. |
| Few-shot examples are always better than zero-shot prompts. | Rejected | [Google's guide](https://ai.google.dev/gemini-api/docs/prompting-strategies#few-shot) broadly recommends examples, while provider and model behavior differs. Current OpenAI and Anthropic guidance places more weight on model-specific validation and clear criteria. | Corrected. Learners hold the full classifier contract, cases, model, product surface, settings, and run procedure constant, then add only the examples. |
| Summarize, infer, transform, and expand are useful prompt task families. | Supported as a curriculum taxonomy | This is a central applied structure in the Ng/Fulford developer course. It is not a claim that all prompting tasks fall into exactly four categories. | Retained with the taxonomy boundary stated. |
| Reliable improvement requires failure analysis, a fixed baseline, and rerunning task-relevant cases. | Supported | OpenAI's [evaluation flywheel](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md) describes analyze, measure, improve; its judge-alignment section requires comparison with human subject-matter-expert labels and a gold-standard dataset. | Strengthened. The course now requires risk-based cases, visible regressions, richer run metadata, and a full rerun. |
| Model-generated tests are representative by construction. | Rejected | Generated sets can be homogeneous and can reproduce the generator's blind spots. | Corrected. The capstone calls generated tests candidates for human validation against real task data. |
| An LLM judge can grade factual grounding from the candidate answer alone. | Rejected | A candidate sentence proves only what was claimed. Grounding needs the supporting or contradicting source record, and automated judges require validation against reliable labels. | Corrected. The evaluator must cite source paragraph IDs and may return `unknown` when evidence is unavailable. |
| More prompt-chain stages automatically improve reliability. | Rejected | [Anthropic's current best-practices page](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) reserves explicit chains for inspectable intermediate results or required pipelines; extra calls also add cost, latency, and failure opportunities. | Corrected. Chaining is taught at meaningful verification boundaries only. |
| A citation is sufficient when the document exists or the domain is authoritative. | Rejected | Support is claim-level and scope-sensitive. | Strengthened. The grounding lesson distinguishes direct support, inference, and no matching evidence, with paragraph-level citations. |
| Structured output establishes factual correctness. | Rejected | [OpenAI Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs) constrains schema adherence, not truth, and documents incompatible input, refusals, incomplete output, and other mistakes that applications must handle. | Corrected in the source ledger and lesson language. |
| Prompt text can enforce tool permission and approval boundaries. | Rejected | The [Model Spec's scope-of-autonomy section](https://model-spec.openai.com/2026-08-18.html#scope_of_autonomy) covers allowed tools, access, side effects, and approval points. OpenAI and Anthropic application-security guidance adds approval, validation, least-privilege, screening, trace-review, and monitoring controls. Enforcement still belongs to the surrounding application. | Strengthened in Lesson 8 and the final assessment. |
| Confidence is a useful substitute for evidence status. | Rejected | Model self-confidence is not calibrated evidence of factual support. | Corrected. The course asks for operational statuses such as direct support, inference, conflict, missing evidence, or unknown. |
| Never submit any confidential or regulated data to any AI system under any circumstances. | Too broad | Some authorized enterprise and regulated workflows may use approved controls. Credentials and unnecessary personal data remain inappropriate. | Corrected. The course requires authorization, approved controls, minimization, and task-specific privacy review. |

## Corrections made

### Source accuracy and attribution

- Narrowed the Andrew Ng attribution to topics visible on the current official course pages.
- Identified the Ng/Fulford developer course's Python, API, and notebook context instead of implying a no-code original.
- Corrected the exact OpenAI prompt-guide title and separated Structured model outputs into its own source record.
- Updated the Google canonical prompt-strategies URL and section anchors.
- Added Anthropic's current living best-practices page rather than relying only on a broad overview.
- Updated the Model Spec record to the 2026-08-18 version and added direct scope and side-effect anchors.
- Expanded the ledger to 18 sources with per-source claim IDs, currency, reuse boundary, caveats, and verification date; added current OpenAI and Anthropic application-security records with explicit provider, deprecation, and no-guarantee boundaries.

### Prompt and exercise correctness

- Clarified the Lesson 1 confidence check as an anchored learner self-rating and prohibited the model from answering it for the learner.
- Replaced record-level evidence IDs with field-level evidence IDs in policy extraction.
- Correctly serialized external values and marked them as untrusted data in extraction, classification, transformation, evaluation, synthesis, grounding, and capstone prompts.
- Added the missing `other` classifier example and a held-out instruction-in-data case.
- Defined every classifier label and corrected the missing-information fixture so a vague help request maps to the declared `other` label rather than an undeclared response type.
- Turned the zero-shot/few-shot practice into a controlled one-factor comparison: condition B adds only examples to the complete condition-A contract.
- Made factual fidelity outrank an incompatible word range and prohibited invented commitments.
- Added universal 0/1/2 evaluator anchors, source evidence requirements, omission rules, and `unknown` behavior. Unknown is excluded from both earned and possible points, aggregate runs with different denominators are not compared, and a full-score evaluation returns no invented revision.
- Separated an authoritative budget rule from untrusted decision evidence.
- Reconciled the grounding refusal status with the requested missing-information list.
- Required the capstone meta-prompt to stop and wait after clarifying questions.
- Required human validation before describing generated cases as representative.
- Expanded experiment logging to include provider, product surface, exact model identifier when available, date, settings, tools, source set, and prompt version.

### Assessment integrity

- Replaced the duplicated formative-checkpoint final test with nine independent scenario-transfer questions.
- Attached each final question to a source ID and claim ID and added a rationale for every distractor.
- Preserved the exact pass boundary: 6/9 fails and 7/9 passes.
- Rebuilt the capstone as a persisted five-criterion rubric scored 0, 1, or 2.
- Set the capstone pass rule to 8/10 with no criterion scored zero; a defining requirement cannot be compensated for by unrelated points.
- Required all six evidence artefacts before a self-attested pass can be recorded.
- Made the interface disclose that the capstone record is local self-attestation, not external certification.

### Practice and visual evidence

- Added a downloadable synthetic fixture pack with expected behavior, deliberate failures, and a fixed six-case evaluation set. It supports representative Lessons 3 through 9 inspection and revision planning without an AI account, but does not supply empirical reruns or complete a learner-authored capstone.
- Corrected the six-case fixture's task wording, genuinely non-diagnostic E2 case, and E4 formatting-noise description so none claims unsupported case counts, labels, or input length.
- Regenerated the workbench image with the exact six taught labels: Goal, Context, Task, Constraints, Output, and Success Criteria.
- Replaced generic semantic layouts with relationship-specific diagrams for the task pipeline, authority boundary, zero-shot/few-shot experiment, checkable chain, and claim-to-evidence matrix.
- Kept the original workbench files as recoverable historical assets and routed the course to version 2 with verified PNG and WebP hashes.

### Workload and discovery accuracy

- Recomputed the guided workload as 365 lesson minutes plus a 15-minute final knowledge check, for 380 minutes total.
- Made the top-level registry, catalogue JSON-LD, and all nine localized catalogue summaries agree on 380 minutes.
- Centralized Course 7 progress keys so the dashboard, catalogue, and homepage all recognize the v2 capstone; all 11 milestones now yield 100% everywhere.
- Clarified that live model runs and portfolio completion can take longer.
- Kept non-English shell routes usable while identifying the long-form course as English.
- Canonicalized every Course 7 shell to the English content and removed untranslated Course 7 variants from hreflang and the sitemap.
- Preserved all Course 6 GitHub catalogue, structured-data, and sitemap integrations.

## Verification evidence

| Check | Result | What it establishes |
|---|---|---|
| `npm run prompts:check:release` | Pass | 9 lessons, 18 sources, 9 figures, 2 raster pairs, source/claim resolution, timing, shared catalogue duration/progress, capstone score truth table, fixture semantics, and asset hashes satisfy the release contract. |
| Scoped ESLint | Pass | Course 7 components, routes, ledgers, checker, tests, shared SEO helper, and sitemap have no lint errors. |
| Playwright Course 7 suite | 35/35 pass | Routes, exact lesson count, fixture delivery, image hashes, diagram relationships and labels, clipboard, progress isolation, storage denial, quiz boundary, all capstone zero cases, 100% catalogue/home completion, 380-minute JSON-LD, RTL/LTR containment, canonical/hreflang behavior, responsive overflow, Course 6 to Course 7 catalogue ordering, search, and sitemap output work in Chromium. |
| Course 6 release and browser regression | Pass, 26/26 | The 12-lesson, 660-minute, 9-locale Course 6 contract and all browser journeys remain intact after the additive Course 7 corrections. |
| Manual visual contact sheet | Pass | The diagrams communicate the intended relationships at 1200px and remain readable; this supplements rather than replaces DOM and accessibility checks. |
| `git diff --check` | Pass | No whitespace-error patch was introduced. |
| Repository-wide TypeScript | Blocked by unrelated work | The repository still has concurrent Cursor locale-copy parity errors in `lib/cursor/load.ts`. The compiler reported no Course 7, shared catalogue, SEO, sitemap, or Course 6 error. This is not a repository-wide green build. |

## Remaining limitations

1. This audit verifies curriculum claims, source mapping, interface behavior, and synthetic assessment fixtures. It does not establish learner achievement, retention, transfer, or accessibility conformance through a human study.
2. The live behavior of a model can change after publication. The source ledger and model-specific recommendations should be rechecked before a later release.
3. The no-account path uses hand-authored simulated outputs. It teaches diagnosis and revision but cannot prove how a specific live model behaves.
4. The final quiz and capstone are local formative/self-attested assessments, not identity-verified certification.
5. Direct retrieval of the DeepLearning.AI canonical pages returned a bot-protection response during the final refresh; the current official URLs and indexed first-party page content were still available. No gated content was bypassed.
6. Course 7 remains English-only. The surrounding nine-language shell is not evidence of translated lesson content.

## Release recommendation

Course 7 version 1.1.0 is ready for the project's Course 7 release gate. A site-wide release should still wait for the repository-wide TypeScript blockers owned by other concurrent courses to be resolved or explicitly waived through the project's normal release process.
