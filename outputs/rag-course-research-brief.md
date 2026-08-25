# Research audit brief: Course 9, Retrieval-Augmented Generation

Status: curriculum and evidence audit complete; corrected implementation is undergoing the separate release QA gate  
Research snapshot: 2026-08-23 (Asia/Taipei)  
Course version: 1.1.0  
Primary audience: builders, researchers, educators, and technical leaders who need an auditable RAG system rather than a document-chat demonstration

## Executive result

Course 9 is designed as a complete evidence-systems course. Its central claim is deliberately narrower than "RAG makes answers true": retrieval can make external evidence available at answer time, while correctness still depends on source authority, parsing, permissions, candidate retrieval, context selection, generation, citation support, evaluation, security, and operations.

The implemented curriculum contract contains:

- 4 units, 12 lessons, and 780 guided minutes, or about 13 hours;
- 34 explicit RAG concepts, all assigned to at least one lesson;
- 12 substantive practices, one per lesson;
- a deterministic retrieval laboratory with lexical, dense, and hybrid teaching paths;
- 12 scenario-based final questions, assembled from the 12 lesson checkpoints, with 9 correct answers required to pass;
- a nine-item production evidence packet and a five-dimension, 10-point capstone rubric;
- 40 dated source records across five official learning sources (three courses, one event, and one video session), official documentation, research, security guidance, official and maintainer repositories, and five clearly labelled individual user reports;
- 12 teaching figures: 5 authentic, licensed interface screenshots, 1 official MIT-licensed Anthropic teaching diagram, and 6 course-original semantic figures;
- complete long-form copy in nine locales, including localized assessment, capstone, figure transcripts, self-canonical metadata, and Arabic right-to-left rendering;
- a balanced final-answer key with exactly three correct answers in each of the four option positions, preventing a constant-position guessing strategy from passing.

The adversarial factual review found and corrected several substantive claim and traceability errors. Google Check grounding had been misdescribed as contradiction scoring; OpenAI Academy event and video pages had been mislabelled as courses; an unsupported 512-token and 100-token-overlap example and unsupported named diversification methods were removed; the Google learning URL and publisher brand were updated; and the PaperQA network-flow report was assigned to the lesson that invokes it. After those corrections, the reviewed high-risk claims align with their assigned direct sources. This remains a scoped audit, not proof that no semantic error remains.

This result is a content and evidence audit. It does not substitute for a successful TypeScript check, static build, browser test, locale release check, route audit, or asset-integrity check.

## Evidence hierarchy

The course uses the highest available evidence for each kind of claim and does not flatten all links into equal authority.

| Priority | Evidence class | Role in the course | Required boundary |
|---:|---|---|---|
| 1 | Five official learning sources: three courses from Claude Academy and Google Skills, one OpenAI Academy event, and one OpenAI Academy video session | Curriculum spine, current provider-supported learning pathways, and the vocabulary learners will encounter | Media is linked and synthesised, not copied; event, video, course structure, and access can change |
| 2 | Official provider documentation | Current product behaviour for retrieval, file search, parsing, ranking, grounding, citations, data controls, and security services | Provider-specific behaviour is labelled as such and date stamped; examples are not universal standards |
| 3 | Foundational research and official repositories | Definitions, reproducible architectures, implementation patterns, and historical grounding | A paper or starter kit is not proof of universal production performance |
| 4 | OWASP security guidance | Threat modelling and layered defensive controls | A checklist does not certify a deployment as secure |
| 5 | Maintainer documentation and repositories | Concrete workflows for research papers, code context, local RAG, complex documents, and visual RAG pipelines | Maintainer claims are not independent efficacy evidence |
| 6 | Individual GitHub issues and discussions | Failure-analysis prompts and realistic negative test cases | Each report is one version- and configuration-specific observation, never a defect-rate or prevalence claim |

Official sources control product facts. Community repositories supply context-specific patterns. Individual reports only motivate tests that a learner should reproduce against the learner's own system.

## Primary source spine

### Claude Academy and Anthropic

[Building with the Claude API](https://academy.claude.com/courses/building-with-the-claude-api) and [Claude with Google Cloud's Vertex AI](https://academy.claude.com/courses/claude-with-google-cloud-s-vertex-ai) support the core RAG, hybrid retrieval, reranking, and contextual-retrieval sequence. Anthropic's [Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval), [context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [citations](https://platform.claude.com/docs/en/build-with-claude/citations), [prompt-injection defences](https://www.anthropic.com/research/prompt-injection-defenses), and [Claude Projects RAG guidance](https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects) support the corresponding technical and operational claims.

Anthropic's published experimental improvements for Contextual Retrieval are treated as results from Anthropic's own experimental setting. The course does not repeat them as guaranteed gains for another corpus, model, language, or query distribution.

### OpenAI Academy and OpenAI sources

[Builder Bootcamp: RAG](https://academy.openai.com/public/clubs/builders-etkn1/events/builder-bootcamp-rag-b3yo6kdfwv) is an official Academy event and livestream assigned to the system-selection lesson, not an Academy course. [Automate Knowledge Graphs for RAG](https://academy.openai.com/public/videos/automate-knowledge-graphs) is an official Academy-hosted video session supporting the advanced-patterns lesson, not a course. The [Retrieval guide](https://developers.openai.com/api/docs/guides/retrieval), [File Search guide](https://developers.openai.com/api/docs/guides/tools-file-search), [evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices), [data controls](https://developers.openai.com/api/docs/guides/your-data), [Knowledge Retrieval starter kit](https://github.com/openai/openai-knowledge-retrieval), and [multimodal RAG example](https://developers.openai.com/cookbook/examples/multimodal/image_understanding_with_rag) provide implementation and evaluation evidence.

Managed chunk settings, API shapes, limits, storage behaviour, retention, and billing are explicitly time sensitive. The current OpenAI Retrieval guide documents a managed default of 800-token chunks with 400-token overlap. The directly assigned Google parsing guide documents a default 500-token chunk-size limit for layout-aware document chunking. The course presents both as service-specific evaluation starting points, not recommendations or universal settings.

OpenAI's evaluation principles remain applicable, but its current guidance says the hosted Evals platform becomes read-only on 2026-10-31 and is scheduled to shut down on 2026-11-30. Implementers should therefore verify the current evaluation tooling rather than copy an older starter's hosted-Evals path unchanged.

### Google Skills and Google Cloud

[Create Generative AI Apps on Google Cloud](https://www.skills.google/paths/1282/course_templates/1120) is the formal Google Skills learning source. Google Cloud documentation supplies the managed [RAG overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/rag-engine/rag-overview), [reference architecture](https://docs.cloud.google.com/architecture/rag-genai-gemini-enterprise-vertexai), [parsing and chunking](https://docs.cloud.google.com/generative-ai-app-builder/docs/parse-chunk-documents), [hybrid search](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/vector-search/query-index-public-endpoint), [ranking](https://docs.cloud.google.com/generative-ai-app-builder/docs/ranking), [grounding checks](https://docs.cloud.google.com/generative-ai-app-builder/docs/check-grounding), and [Model Armor](https://docs.cloud.google.com/model-armor/overview).

The course separates transferable RAG principles from Google-specific services. Fusion weights, thresholds, parser support, ranking settings, and grounding scores remain product outputs or examples, not universal optima or probabilities of truth.

## Curriculum contract

| Unit | Lesson | Minutes | Evidence-system outcome |
|---|---|---:|---|
| 1. Frame the evidence system | Choose RAG, or choose something simpler | 45 | Decide between RAG, long-context prompting, fine-tuning, search, SQL, APIs, and direct tools from the evidence need |
|  | Trace one answer from source to citation | 50 | Separate ingestion and serving, then produce a query-to-citation trace |
|  | Write the corpus contract before embedding | 55 | Define authority, rights, provenance, permissions, versions, tenancy, freshness, and deletion |
| 2. Build the retrievable corpus | Parse structure, then design chunks | 65 | Test digital extraction, OCR, layout, chunk strategies, lineage, and difficult source formats |
|  | Understand embeddings and vector indexes | 60 | Distinguish semantic similarity from authority and manage index and embedding migrations safely |
|  | Engineer retrieval, do not merely call it | 75 | Compare lexical, dense, and hybrid retrieval, query transformations, filters, access control, and query classes |
| 3. Turn candidates into supported answers | Rerank candidates and assemble bounded context | 60 | Separate candidate retrieval from reranking, diversity, coherent context selection, cost, and latency |
|  | Ground claims, cite spans, and abstain | 65 | Test claim-to-span support, citation completeness, unsupported claims, and no-answer behaviour |
|  | Choose agentic, multimodal, graph, or domain RAG | 65 | Select advanced patterns only when the evidence structure and question class justify their extra complexity |
| 4. Evaluate, secure, and operate | Evaluate the stages, not just the chatbot | 75 | Build a versioned evaluation set with stage-specific metrics, traces, ablations, and human calibration |
|  | Secure the corpus and keep it fresh | 70 | Threat-model hostile sources, enforce tenant boundaries, verify deletion, and recover from poisoned or stale indexes |
|  | Ship a traceable production RAG packet | 95 | Defend release readiness with reproducible quality, safety, latency, cost, monitoring, migration, and rollback evidence |

## Thirty-four-concept coverage matrix

The identifiers below are the machine-readable acceptance contract in `lib/rag/types.ts`. "Reinforced" means a second or later lesson carries the same explicit concept identifier, not merely that related prose appears elsewhere.

| # | Concept identifier | Primary lesson | Reinforced in | Acceptance focus |
|---:|---|---|---|---|
| 1 | `rag-definition` | Choose RAG | Trace the pipeline | Retrieval plus bounded generation and evidence lineage, not "a vector database" |
| 2 | `selection-boundary` | Choose RAG | - | Use RAG only when answer-time external evidence is justified |
| 3 | `long-context` | Choose RAG | - | Prefer direct trusted context when it is simpler and sufficient |
| 4 | `fine-tuning` | Choose RAG | - | Separate behaviour adaptation from current-fact retrieval |
| 5 | `search-tools-sql` | Choose RAG | - | Route structured or deterministic facts to authoritative tools |
| 6 | `source-authority` | Corpus contract | - | Authority cannot be inferred from similarity score |
| 7 | `permissions-provenance` | Corpus contract | - | Authorisation and lineage precede model context |
| 8 | `parsing-ocr-layout` | Parse and chunk | - | Inspect OCR, reading order, tables, layout, and anchors before retrieval tuning |
| 9 | `chunking` | Parse and chunk | - | Compare chunk strategies on representative questions; no universal size |
| 10 | `metadata-versioning` | Corpus contract | Parse and chunk; Embeddings and indexes | Preserve document, parser, chunker, embedding, and index versions |
| 11 | `embeddings` | Embeddings and indexes | - | Treat embeddings as task-dependent representations |
| 12 | `vector-index` | Embeddings and indexes | - | Measure approximate-index recall and operational configuration separately |
| 13 | `dense-retrieval` | Embeddings and indexes | Retrieval engineering | Test semantic paraphrase retrieval without turning distance into truth |
| 14 | `sparse-retrieval` | Retrieval engineering | - | Preserve rare identifiers, exact terms, names, and phrases |
| 15 | `hybrid-fusion` | Retrieval engineering | - | Compare component retrievers and fusion against labelled slices |
| 16 | `query-transformation` | Retrieval engineering | - | Trace rewrites, expansion, decomposition, multi-query, HyDE, and routing |
| 17 | `filters-acl` | Retrieval engineering | Secure and refresh | Enforce permissions during retrieval and run negative leakage tests |
| 18 | `reranking-diversity` | Rerank and assemble | - | Compare with and without reranking; control duplicates and source diversity |
| 19 | `context-assembly` | Rerank and assemble | - | Select the smallest sufficient, coherent, authorised evidence set |
| 20 | `grounding-abstention` | Ground and cite | - | Preserve disagreement and abstain when support is insufficient |
| 21 | `citations` | Ground and cite | - | Resolve each material claim to an exact versioned span |
| 22 | `agentic-multihop` | Advanced patterns | - | Trace routing, tool calls, iterative retrieval, evidence grades, retries, and stops |
| 23 | `multimodal-rag` | Advanced patterns | - | Preserve modality-specific structure and evaluate each representation |
| 24 | `graph-rag` | Advanced patterns | - | Compare graph-based local or global retrieval with simpler baselines |
| 25 | `retrieval-evaluation` | Evaluate RAG | Production capstone | Measure candidate quality with suitable labelled metrics and slices |
| 26 | `answer-evaluation` | Ground and cite | Evaluate RAG; Production capstone | Separate correctness, relevance, faithfulness, completeness, and instructions |
| 27 | `citation-evaluation` | Ground and cite | Evaluate RAG; Production capstone | Test correctness, completeness, precision, and resolvability separately |
| 28 | `observability` | Trace the pipeline | Evaluate RAG; Production capstone | Record minimal, protected, versioned traces capable of locating failure |
| 29 | `prompt-injection-poisoning` | Secure and refresh | - | Treat retrieved instructions as untrusted data and layer controls |
| 30 | `privacy-tenancy` | Corpus contract | Secure and refresh | Protect source, derivatives, traces, caches, exports, and identities |
| 31 | `freshness-deletion` | Corpus contract | Secure and refresh | Propagate updates and deletions with verifiable receipts and recovery |
| 32 | `cost-latency` | Rerank and assemble | Production capstone | Budget and measure each offline and online stage |
| 33 | `production-reliability` | Trace the pipeline | Secure and refresh; Production capstone | Use visible states, idempotency, retries, canaries, fallbacks, and rollback |
| 34 | `domain-contexts` | Retrieval engineering | Advanced patterns; Production capstone | Test research, code, support, enterprise, local, and structured-data needs distinctly |

All 34 identifiers have at least one lesson assignment. Ten concepts receive an explicit second or third assignment in later units, so the production and evaluation ideas recur rather than appearing only once.

## Instructional and assessment design

Every lesson has the same inspectable learning shape:

1. three substantive teaching sections;
2. one figure with alt text and a learning transcript;
3. one four-step system practice;
4. three or more named evidence artefacts to retain;
5. one explicit boundary that prevents overclaiming or unsafe action;
6. one four-option checkpoint with a rationale;
7. one concise takeaway;
8. exact lesson-level source links and evidence labels.

The final knowledge check reuses the 12 scenario-based lesson checkpoints. Each checkpoint carries an explicit source ID that is validated against the lesson's source list; the interface does not infer support from source-array position. Nine of 12 is the stated pass condition, and the best score is stored only in the learner's browser.

The deterministic retrieval laboratory is intentionally not a simulated live model. It provides three controlled scenarios:

- a semantic paraphrase that rewards dense meaning;
- rare identifier `TS-999`, which exposes the value of lexical matching;
- conflicting policy versions, which makes authority and freshness visible.

Learners can change retrieval strategy, candidate top K, threshold, and reranking. Candidate scores are labelled teaching values. No model API, embedding API, vector database, network request, or hidden scoring call is used, so the causal demonstration is reproducible.

The capstone requires a corpus manifest, parser and chunking audit, lexical-dense-hybrid ablation, versioned evaluation set, claim-level citation audit, query-to-citation traces, security and deletion tests, stage-level cost and latency measurements, and operational runbooks. The rubric allocates 0 to 2 points to each of five dimensions: corpus governance; reproducible retrieval; grounded answers and citations; evaluation; and security plus operations.

## Interface figures and rights

The course uses authentic interfaces only where a pinned source and a documented publication basis are available. It does not reproduce Academy course media.

| Figure group | Count | Source and rights | Course use |
|---|---:|---|---|
| Claude-powered customer-support RAG interface | 1 | `anthropics/claude-quickstarts` at commit `5264b729deda905dba3e5402d717bebed000325c`, MIT | Shows context use, application activity status, knowledge-base history, a match indicator, and a source link |
| Anthropic knowledge-wiki architecture | 1 | `anthropics/claude-quickstarts` at the same pinned commit, MIT | Official teaching diagram for a build-once, query-with-provenance pattern; explicitly not product UI or Claude.ai |
| Dify workflow, chunk settings, chunk inspector, and citation interfaces | 4 | `langgenius/dify-docs` at commit `bca060d6b2d741071394605cadae46badb9911c5`, CC BY 4.0 | Shows visible RAG stages, document processing, derivative chunks, and a file-attribution panel; the citation screenshot does not expose supporting spans |
| Course-original semantic figures | 6 | Original HTML/CSS teaching diagrams | Covers system selection, governance, retrieval scores, context budgets, evaluation, and threat boundaries |

Each authentic screenshot has a local PNG master, responsive WebP derivative, intrinsic dimensions, SHA-256 digests, upstream URL, pinned commit, observation date, and a privacy review that records no visible personal data. The PNG masters are preserved byte for byte; WebP files are quality-82 conversions. The official Anthropic diagram is a byte-for-byte local SVG with a pinned SHA-256 digest and a safety review for active or external content. Numeric settings and model names visible inside product interfaces or the diagram are historical examples, not recommendations.

### Claude UI wording boundary

The Claude-related figure is authentic and Anthropic maintained, but it is a screenshot of the MIT-licensed customer-support quickstart powered by Claude and Amazon Bedrock Knowledge Bases. It is not a screenshot of the consumer Claude.ai chat or Projects interface.

The only defensible public wording is therefore:

> Authentic Anthropic-maintained Claude-powered RAG quickstart interface. It is not the consumer Claude.ai interface.

The course uses that boundary in its dashboard note, lesson prose, caption, figure product label, and `public/courses/rag/NOTICE.md`. It must not be shortened to "Claude.ai screenshot", "Claude Projects UI", or any wording that implies product identity, endorsement, or current consumer-interface parity.

If a future release requires an actual Claude.ai or Claude Projects screenshot, it needs a separate capture and publication review covering account state, private data, terms, trademark use, current product accuracy, and permission. The current quickstart image must not be relabelled to satisfy that request.

## Claim verification and corrections

| Course claim or design choice | Audit result | Evidence and boundary |
|---|---|---|
| RAG combines generation with retrieved non-parametric evidence | Supported | Lewis et al. supplies foundational grounding; current provider sources extend the production pipeline |
| RAG is not synonymous with vector search | Supported | Official sources use dense, lexical, hybrid, filtered, graph, file-search, and tool-mediated retrieval patterns |
| Current structured facts may belong behind SQL or an API | Supported engineering boundary | The course presents this as a system-selection rule, not a prohibition on generated formatting |
| Fine-tuning does not replace current-fact retrieval | Supported with scope | Framed as a normal division of responsibilities, not an absolute claim about every combined architecture |
| No universal chunk size or overlap exists | Supported after correction | The directly assigned OpenAI source documents a managed default of 800-token chunks with 400-token overlap, while Google documents a default 500-token chunk-size limit for layout-aware document chunking; both are product-specific starting points |
| Dense similarity is not truth, authority, permission, or freshness | Supported | These properties are carried by governance and metadata rather than vector distance |
| Hybrid retrieval and reranking can help but are not automatically superior | Supported | Anthropic and Google describe these techniques; the course requires ablation and cost-latency comparison |
| More context can introduce distraction, staleness, and cost | Supported | Anthropic context-engineering guidance and the course's bounded-context principle align |
| Citation presence does not prove citation correctness | Supported | Anthropic citations, OpenAI annotations, Google grounding, and the separate user-report test case support the distinction |
| Google Check grounding scores contradiction | Rejected and corrected | The current documentation supports an overall support score, claim-level support scores, and claim citations; it is not represented as a contradiction score |
| Retrieval quality and answer correctness must be evaluated separately | Supported | OpenAI evaluation guidance and the starter/evaluation repositories support staged metrics and traces |
| Retrieved content remains untrusted and no layer eliminates prompt injection | Supported | OWASP, Anthropic defences, and Google Model Armor support layered controls rather than a complete-safety claim |
| GraphRAG, agentic, and multimodal approaches are conditional patterns | Supported | Microsoft GraphRAG, OpenAI's GraphRAG and multimodal material, and domain repositories support comparison with simpler baselines |
| Provider data retention and deletion controls are time sensitive | Supported | OpenAI data controls are endpoint-, account-, agreement-, region-, and date-dependent; the course does not generalise one policy |
| The authentic Claude figure is consumer Claude.ai | Rejected and corrected by wording | The pinned source is the Anthropic quickstart repository, so the course explicitly says it is not Claude.ai |
| The Claude quickstart activity cards expose hidden model reasoning | Rejected and corrected by wording | The screenshot labels application-generated cards as `Assistant Thinking`; the course describes them as activity or status summaries, not chain-of-thought access |
| The Dify citation screenshot exposes highlighted citations or source spans | Rejected and corrected by visual audit | The pinned pixels show a generated answer and a `CITATIONS` panel naming two files; exact claim-to-span validation is a separate capstone requirement |
| Screenshot scores and numeric settings are recommended defaults | Rejected and corrected by captions | Every authentic figure is labelled as a dated example; settings require evaluation on a representative task set |
| Five GitHub reports demonstrate common or current product defects | Rejected | They are labelled individual reports and used only to design negative tests |

During this audit, the official OpenAI Academy RAG event and Google Skills course records were checked for lesson-level assignment, not merely registry presence. The current manifest assigns both to `choose-rag`. The PaperQA individual report is now also assigned to `corpus-contract`, where its configuration-specific local-indexing network-flow audit appears, and retains its anecdote caveat. The current 40-source registry has no orphaned source record.

The audit also checked named techniques against lesson sources. HyDE is now traceable through the registered OpenAI Knowledge Retrieval starter kit assigned to `retrieval-engineering`. Self-RAG is now traceable through the primary ICLR 2024 paper assigned to `advanced-patterns`; the course accurately limits the name to that specifically trained architecture rather than using it as a generic label for iterative retrieval.

## GitHub experience boundaries

Five individual reports are intentionally retained because they expose different evaluation failures:

| Report | What it can motivate | What it cannot establish |
|---|---|---|
| Sourcegraph issue 60500 | A no-context case in which the answer must abstain rather than sound plausible | The frequency or current behaviour of Cody across versions |
| RAGFlow issue 10147 | Reading-order and parser tests for complex PDFs before embedding changes | A general RAGFlow parser defect rate |
| PaperQA issue 1321 | A network-flow audit across parsing, metadata, embeddings, generation, and telemetry | Current default provider calls or a general privacy claim |
| PrivateGPT discussion 241 | Separate relevant retrieval from correct generation | Current PrivateGPT answer quality or a benchmark result |
| Azure Search OpenAI Demo issue 562 | Separate citation presence, completeness, and correctness | Current model or API citation behaviour |

The course paraphrases the failure pattern and links to the report. It does not republish report text, infer causality beyond the evidence, or treat a closed issue as current product truth. Learners are told to turn each pattern into a local regression case.

Maintainer repositories have a different role. PaperQA2, PrivateGPT, RAGFlow, LangChain RAG From Scratch, and Dify support domain and implementation patterns, while Azure Search OpenAI Demo and Microsoft GraphRAG are official repositories. Sourcegraph Cody context is current official product documentation and is labelled `official-doc`, not a repository. These source classes still do not prove comparative performance or production readiness.

## Internationalisation contract

Course 9 now carries complete copy bundles for English, Spanish, French, German, Simplified Chinese, Traditional Chinese, Japanese, Korean, and Arabic. The loader materializes each route from its own bundle rather than serving an English fallback. Structural parity covers all 12 lessons, three sections per lesson, practices, checkpoints, option order and answer keys, figure transcripts, laboratory strings, capstone, and interpolation placeholders.

Each route emits a self-canonical URL, nine locale alternates plus `x-default`, and structured data whose `inLanguage` matches the materialized locale. Arabic dashboard and lesson roots use `dir="rtl"`; identifiers, source URLs, commits, and stable machine keys remain unchanged. Translation parity and browser rendering are release-gated separately from the English semantic source audit.

## Correction and maintenance policy

The course should be maintained as a versioned evidence product.

### Before every public release

1. Reopen every official course, event, video, and documentation URL used by the affected lesson.
2. Recheck product names, API names, plan or access conditions, defaults, limits, data controls, retention, deletion, and pricing-related wording.
3. Re-resolve every lesson source ID, figure source ID, exact anchor, local asset, checksum, and licence notice.
4. Confirm all 34 concept identifiers remain assigned and every lesson retains three sections, one practice, one four-option checkpoint, one figure, and at least one exact source.
5. Re-run source-claim review for named techniques. A named method cannot rely only on general background knowledge when a primary source is reasonably available.
6. Verify all authentic-UI captions still describe the pinned historical interface rather than current navigation.
7. Recheck that the Claude figure is never labelled as consumer Claude.ai.
8. Revisit each individual GitHub report only to maintain its date, version, and status caveat. Never upgrade a report into a prevalence claim.
9. Run static type, build, release checker, route, browser, mobile, keyboard, RTL-shell, local-storage, and asset-integrity tests.
10. Record the new `sourceSnapshotOn` date only after the actual source refresh succeeds.

### Triggered corrections

A correction is required when a source moves, a provider changes behaviour, a named method lacks direct evidence, an interface caption implies current navigation, a licence or upstream commit changes, a checksum drifts, a concept loses lesson coverage, a question has more than one defensible answer, or a practice can expose unauthorised or personal data.

Correct the smallest responsible unit:

- wording-only product drift: revise the affected claim and caveat;
- changed operational truth: update the official source, lesson, question, and figure transcript together;
- source failure: replace with an authoritative source or remove the unsupported claim;
- rights failure: remove the local media from release until a defensible publication basis exists;
- evaluation error: version the case and record why the prior answer key changed;
- structural change: increment the course version and invalidate incompatible saved progress if necessary.

### Permanent claim boundaries

The course must never claim that:

- RAG eliminates hallucination or guarantees truth;
- a similarity, reranking, grounding, or model-judge score is a calibrated probability of correctness without validation;
- one chunk size, overlap, top K, threshold, embedding, index, reranker, or model is universally best;
- a citation marker proves that the exact span supports the claim;
- authentication alone proves resource-level authorisation;
- a local deployment label proves that every dependency stays offline;
- a successful demo, green response, or polished screenshot is a production release gate;
- a GitHub issue establishes prevalence, current behaviour, or causal efficacy;
- Anthropic, OpenAI, Google, Microsoft, Dify, or another publisher endorses aicourse.top.

## Content-audit acceptance

The content slice is acceptable when the following remain true:

- the manifest totals 4 units, 12 lessons, and 780 minutes;
- all 34 concept IDs resolve to one or more lessons;
- all 40 source records resolve to a lesson or a documented course-level purpose;
- five official learning sources are visibly and precisely typed: three courses, one OpenAI Academy event, and one OpenAI Academy video session, spanning Claude Academy, OpenAI Academy, and Google Skills;
- the 12-question assessment is source traceable and requires 9 correct answers;
- the laboratory is deterministic and visibly discloses that it is not a live model or benchmark;
- the capstone requires stage-level evidence, security tests, cost and latency, monitoring, and rollback;
- five authentic screenshots remain local, pinned, attributed, checksum verified, privacy reviewed, and accurately labelled;
- the official Anthropic teaching diagram remains byte-pinned, licensed, safety reviewed, and clearly distinguished from product UI;
- all nine locale bundles preserve the curriculum structure, stable IDs, placeholders, assessment keys, and genuine Arabic RTL behaviour;
- the four answer positions retain exactly three correct answers each;
- the Claude-powered figure remains explicitly distinct from consumer Claude.ai;
- individual GitHub reports remain individual reports;
- time-sensitive product claims retain a dated source and caveat;
- automated release and browser QA pass independently of this research brief, while being treated as structural and behavioural evidence rather than semantic proof of every claim.

## Current conclusion

Course 9 has the breadth expected of an advanced RAG curriculum and the boundaries expected of a trustworthy one. It teaches learners to choose whether RAG is appropriate, govern evidence before indexing, evaluate every causal stage, distinguish retrieval from grounded answering, protect permissions and privacy, and prove production readiness with traceable artefacts. Its visual evidence has a defensible licence path, the sole Claude-powered UI is described with the precise product boundary supported by the upstream repository, and the additional Anthropic visual is explicitly an official teaching diagram rather than product UI.

The remaining release decision belongs to implementation QA. A passing research audit cannot be promoted to a public-release claim until the current worktree also passes its build, route, locale, interaction, and asset checks.
