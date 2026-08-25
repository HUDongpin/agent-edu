# Provenance ledger: Course 9, Retrieval-Augmented Generation

Snapshot date: 2026-08-23 (Asia/Taipei)  
Course version: 1.1.0  
Machine-readable curriculum: `lib/rag/manifest.ts`  
Machine-readable source records: `lib/rag/sources.ts`  
Machine-readable figure records: `lib/rag/figures.ts`  
Machine-readable concept and content contracts: `lib/rag/types.ts`  
Nine locale copies: `messages/rag/{en,es,fr,de,zh-Hans,zh-Hant,ja,ko,ar}.json`  
Public asset notice: `public/courses/rag/NOTICE.md`

## Audit method

The research and verification work used separate source-discovery and challenge passes. The final documentation audit then inspected the implemented manifest, source registry, figure registry, content JSON, assessment wiring, and public rights notice.

Evidence was accepted under the following rules:

1. Current provider behaviour requires an appropriately typed official course, event, video, documentation page, help article, or official repository.
2. A research paper supports the architecture or method it actually studied, not an expanded production claim.
3. Maintainer repositories support concrete implementation patterns but do not prove comparative efficacy or production readiness.
4. Individual GitHub issues and discussions support only the reported case and the negative test derived from it.
5. Every copied screenshot requires a local licence basis, an upstream URL, a pinned commit, a checksum, a privacy review, and non-endorsement wording.
6. Product UI is historical evidence. A screenshot does not establish current feature location, plan access, limits, or behaviour.
7. Numeric product settings are examples unless a task-specific evaluation establishes them as appropriate.
8. The source snapshot date is not renewed by editing a constant. It can change only after the official links and time-sensitive claims are actually rechecked.

The audit explicitly searched for common RAG overclaims: guaranteed truth, universal chunk sizes, similarity as confidence, citation markers as proof, automatic hybrid or reranker superiority, complete prompt-injection protection, and generalisation from an individual issue. It found and corrected several claim and traceability errors detailed below. Automated structure checks can preserve those known corrections, but neither they nor this ledger are semantic proof that every course claim is correct.

## Current-state inventory

| Contract | Verified value on 2026-08-23 | Evidence location |
|---|---:|---|
| Units | 4 | `RAG_UNITS` in `lib/rag/manifest.ts` |
| Lessons | 12 | `RAG_LESSONS` in `lib/rag/manifest.ts` |
| Guided duration | 780 minutes | Sum of lesson `minutes` |
| Explicit concept IDs | 34 | `RAG_CONCEPT_IDS` in `lib/rag/types.ts` |
| Concepts assigned to at least one lesson | 34 | Manifest-to-type enumeration |
| Source records | 40 | `RAG_SOURCES` in `lib/rag/sources.ts` |
| Source records assigned to lessons | 40 | Manifest-to-source enumeration |
| Official learning sources | 5 | Three courses: two Claude Academy and one Google Skills; one OpenAI Academy event; one OpenAI Academy video session |
| Official documentation pages | 17 | Anthropic, OpenAI, Google, and Sourcegraph provider documentation |
| Official repositories | 5 | Anthropic, OpenAI, Microsoft, and Azure Samples |
| Research papers | 2 | Lewis et al., NeurIPS 2020; Self-RAG, ICLR 2024 |
| Security guidance | 1 | OWASP RAG Security Cheat Sheet |
| Maintainer repositories or documentation | 5 | PaperQA, PrivateGPT, RAGFlow, LangChain, Dify |
| Individual user reports | 5 | Four GitHub issues and one discussion |
| Teaching figures | 12 | `RAG_FIGURES` in `lib/rag/figures.ts` |
| Authentic licensed screenshots | 5 | One Anthropic quickstart, four Dify documentation screens |
| Official licensed teaching diagrams | 1 | Anthropic knowledge-wiki architecture, byte-pinned SVG, not product UI |
| Course-original semantic figures | 6 | Rendered as semantic HTML/CSS |
| Complete content locales | 9 | English, Spanish, French, German, Simplified Chinese, Traditional Chinese, Japanese, Korean, and Arabic |
| Lesson practices | 12 | One per lesson in `messages/rag/en.json` |
| Final assessment questions | 12 | One checkpoint per lesson, materialised by `CourseDashboard.tsx` |
| Pass threshold | 9 of 12 | RAG interaction labels and assessment component |
| Capstone requirements | 9 | `capstone.required` in `messages/rag/en.json` |
| Capstone rubric | 5 dimensions, 0 to 2 points each | `capstone.rubric` in `messages/rag/en.json` |

## Lesson-to-evidence map

This table records the source IDs assigned in the implemented manifest. It is the operative trace from lesson copy to the source ledger.

| Lesson | Figure | Explicit concepts | Assigned source IDs |
|---|---|---|---|
| `choose-rag` | `rag-decision-map` | RAG definition; selection; long context; fine-tuning; search, tools, and SQL | `anthropic-academy-api`, `anthropic-academy-vertex`, `openai-academy-rag-bootcamp`, `google-skills-boost-rag`, `anthropic-contextual-retrieval`, `google-rag-engine-overview`, `lewis-rag-paper` |
| `trace-the-pipeline` | `dify-rag-workflow` | RAG definition; observability; reliability | `google-rag-engine-overview`, `openai-retrieval-guide`, `langchain-rag-from-scratch`, `dify-docs` |
| `corpus-contract` | `corpus-control-plane` | authority; permissions and provenance; metadata and versions; privacy and tenancy; freshness and deletion | `google-rag-reference-architecture`, `openai-knowledge-retrieval`, `openai-data-controls`, `owasp-rag-security`, `azure-search-rag-demo`, `user-report-paperqa-vendor-leak` |
| `parse-and-chunk` | `dify-chunk-settings` | parsing, OCR, and layout; chunking; metadata and versions | `google-parse-chunk`, `openai-retrieval-guide`, `anthropic-contextual-retrieval`, `dify-docs`, `ragflow`, `user-report-ragflow-reading-order` |
| `embeddings-and-indexes` | `dify-chunk-inspector` | embeddings; vector indexes; dense retrieval; metadata and versions | `anthropic-academy-api`, `google-rag-engine-overview`, `openai-retrieval-guide`, `dify-docs` |
| `retrieval-engineering` | `retrieval-scoreboard` | dense; sparse; hybrid; query transformation; filters and ACLs; domain contexts | `anthropic-academy-api`, `anthropic-contextual-retrieval`, `google-hybrid-search`, `openai-retrieval-guide`, `openai-file-search-guide`, `openai-knowledge-retrieval`, `azure-search-rag-demo`, `sourcegraph-cody-context`, `user-report-sourcegraph-no-context` |
| `rerank-and-assemble` | `context-budget` | reranking and diversity; context assembly; cost and latency | `google-ranking`, `anthropic-contextual-retrieval`, `anthropic-context-engineering`, `openai-retrieval-guide` |
| `ground-and-cite` | `claude-support-rag-ui` | grounding and abstention; citations; answer evaluation; citation evaluation | `anthropic-citations`, `anthropic-projects-rag-help`, `anthropic-quickstarts`, `google-check-grounding`, `openai-file-search-guide`, `user-report-azure-missing-citations` |
| `advanced-patterns` | `anthropic-knowledge-wiki-architecture` | agentic multi-hop; multimodal RAG; GraphRAG; domain contexts | `openai-academy-graphrag`, `openai-multimodal-rag`, `anthropic-quickstarts`, `self-rag-paper`, `microsoft-graphrag`, `paperqa`, `sourcegraph-cody-context`, `privategpt` |
| `evaluate-rag` | `evaluation-stack` | retrieval, answer, and citation evaluation; observability | `openai-evaluation-guide`, `openai-knowledge-retrieval`, `google-check-grounding`, `azure-search-rag-demo`, `user-report-privategpt-wrong-answer`, `user-report-azure-missing-citations` |
| `secure-and-refresh` | `threat-boundary` | filters and ACLs; prompt injection and poisoning; privacy and tenancy; freshness and deletion; reliability | `owasp-rag-security`, `anthropic-prompt-injection-defences`, `google-model-armor`, `google-rag-reference-architecture`, `openai-data-controls`, `azure-search-rag-demo`, `user-report-paperqa-vendor-leak` |
| `production-capstone` | `dify-citations-ui` | cost and latency; reliability; domains; retrieval, answer, and citation evaluation; observability | `google-rag-reference-architecture`, `openai-knowledge-retrieval`, `azure-search-rag-demo`, `paperqa`, `privategpt`, `dify-docs` |

## Official learning evidence

| Source ID | Precise type | Exact source | Course use | Reuse and freshness boundary |
|---|---|---|---|---|
| `anthropic-academy-api` | Official course | [Building with the Claude API](https://academy.claude.com/courses/building-with-the-claude-api) | RAG flow, embeddings, lexical retrieval, implementation, and multi-index retrieval | Link and independent synthesis only; no Academy lesson, video, quiz, or screenshot is republished |
| `anthropic-academy-vertex` | Official course | [Claude with Google Cloud's Vertex AI](https://academy.claude.com/courses/claude-with-google-cloud-s-vertex-ai) | Claude, Vertex AI, hybrid retrieval, reranking, and contextual retrieval | Course structure and product behaviour can change; no media is copied |
| `openai-academy-rag-bootcamp` | Official event and livestream | [Builder Bootcamp: RAG](https://academy.openai.com/public/clubs/builders-etkn1/events/builder-bootcamp-rag-b3yo6kdfwv) | File Search, Responses, vector stores, grounded answers, tuning, and evaluation | Linked and synthesised independently; Academy material is not rehosted |
| `openai-academy-graphrag` | Official video session | [Automate Knowledge Graphs for RAG](https://academy.openai.com/public/videos/automate-knowledge-graphs) | Graph-based enrichment and advanced-pattern selection | Not treated as the sole definition or proof that GraphRAG is superior |
| `google-skills-boost-rag` | Official course | [Create Generative AI Apps on Google Cloud](https://www.skills.google/paths/1282/course_templates/1120) | Formal Google RAG learning path and production architecture | Labs can require credits; course assets are linked, not copied |

## Official provider documentation

| Source ID | Exact source | Claim scope | Important caveat |
|---|---|---|---|
| `anthropic-contextual-retrieval` | [Introducing Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval) | Contextual chunks, dense plus BM25 retrieval, fusion, reranking, and evaluation | Anthropic's measured gains belong to its experiments and are not universal guarantees |
| `anthropic-context-engineering` | [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Finite context budgets, selection, ordering, and useful context | Advice is model- and workflow-dependent |
| `anthropic-prompt-injection-defences` | [Mitigating the risk of prompt injections in browser use](https://www.anthropic.com/research/prompt-injection-defenses) | Browser-agent-specific evidence about indirect injection from untrusted content and layered defences | General RAG controls come from OWASP and deployment testing; no defence is treated as complete |
| `anthropic-citations` | [Citations](https://platform.claude.com/docs/en/build-with-claude/citations) | Structured document citations and source positions | A rendered citation is not proof of claim support |
| `anthropic-projects-rag-help` | [Retrieval augmented generation for Projects](https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects) | Claude Projects retrieval behaviour | UI, plan access, limits, and activation are time sensitive |
| `openai-retrieval-guide` | [Retrieval guide](https://developers.openai.com/api/docs/guides/retrieval) | Vector stores, the current 800-token and 400-token-overlap managed default, search, rewrites, ranking, and filters | Managed defaults are service-specific evaluation starting points, not universal optima |
| `openai-file-search-guide` | [File Search](https://developers.openai.com/api/docs/guides/tools-file-search) | Managed file retrieval, attributes, result inclusion, and annotations | Names, shapes, limits, and billing can change |
| `openai-evaluation-guide` | [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) | Representative eval sets, rubrics, human calibration, and regression tests | Principles remain applicable, but hosted Evals becomes read-only on 2026-10-31 and is scheduled to shut down on 2026-11-30; verify current tooling |
| `openai-data-controls` | [Your data and API data controls](https://developers.openai.com/api/docs/guides/your-data#default-usage-policies-by-endpoint) | Application state, retention, deletion, and endpoint controls | Depends on endpoint, account, agreement, region, and date |
| `google-rag-engine-overview` | [RAG Engine overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/rag-engine/rag-overview) | Ingestion, transformation, embeddings, indexing, retrieval, and generation | Product architecture is not a universal RAG definition |
| `google-rag-reference-architecture` | [RAG reference architecture with Vertex AI](https://docs.cloud.google.com/architecture/rag-genai-gemini-enterprise-vertexai) | Ingestion and serving flows, security, metadata, and operations | Service selection is Google specific |
| `google-parse-chunk` | [Parse and chunk documents](https://docs.cloud.google.com/generative-ai-app-builder/docs/parse-chunk-documents) | Digital parsing, OCR or image-aware extraction, layout, content-aware chunks, and a default 500-token chunk-size limit for layout-aware document chunking | Formats, defaults, and parser behaviour are product specific and time sensitive |
| `google-hybrid-search` | [Query a Vector Search index](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/vector-search/query-index-public-endpoint) | Hybrid search, filters, and reciprocal-rank fusion | Sample fusion weights and thresholds are examples |
| `google-ranking` | [Rank and rerank documents](https://docs.cloud.google.com/generative-ai-app-builder/docs/ranking) | Candidate retrieval followed by more expensive relevance ranking | Added cost and latency require a no-reranker baseline |
| `google-check-grounding` | [Check grounding](https://docs.cloud.google.com/generative-ai-app-builder/docs/check-grounding) | Overall support score, claim-level support scores, and claim citations | A score is a system output, not a guaranteed probability of truth; this source is not described as contradiction scoring |
| `google-model-armor` | [Model Armor overview](https://docs.cloud.google.com/model-armor/overview) | Screening prompts, responses, and documents | Screening does not replace authorisation, provenance, least privilege, or adversarial testing |
| `sourcegraph-cody-context` | [Cody context](https://sourcegraph.com/docs/cody/core-concepts/context) | Lexical code search, graph context, repository scope, and explicit file context | Current product behaviour comes from current official documentation, not old repository snapshots |

All official documentation records have `accessedOn: 2026-08-23`. Google documentation is linked and synthesised under the recorded site-policy and CC BY 4.0 terms. Anthropic and OpenAI documentation is linked and paraphrased under site terms; no protected course or documentation media is copied.

## Research, official repositories, and security guidance

| Source ID | Exact source | Licence record | Accepted use and exclusion |
|---|---|---|---|
| `lewis-rag-paper` | [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://papers.nips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html) | Undeclared in course ledger; link and synthesis | Foundational parametric plus non-parametric memory; not a complete modern production architecture |
| `self-rag-paper` | [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://openreview.net/forum?id=hSyW5go0v8) | Undeclared in course ledger; link and synthesis | Primary source for the trained Self-RAG architecture and reflection signals; not a generic name for every iterative retrieval workflow |
| `anthropic-quickstarts` | [Claude quickstarts at pinned commit](https://github.com/anthropics/claude-quickstarts/tree/5264b729deda905dba3e5402d717bebed000325c) | MIT, commit `5264b729deda905dba3e5402d717bebed000325c` | Licensed customer-support reference UI plus official knowledge-wiki teaching diagram; neither is consumer Claude.ai and the diagram is not product UI |
| `openai-knowledge-retrieval` | [OpenAI Knowledge Retrieval starter kit](https://github.com/openai/openai-knowledge-retrieval) | MIT | Chunking, expansion, HyDE, filters, reranking, citations, and evals; a starter is not proof of production readiness |
| `openai-multimodal-rag` | [Image understanding with RAG](https://developers.openai.com/cookbook/examples/multimodal/image_understanding_with_rag) | MIT | Image and text retrieval pattern; no universal representation or embedding claim |
| `microsoft-graphrag` | [Microsoft GraphRAG](https://microsoft.github.io/graphrag/index/overview/) | MIT | Entity, relationship, community, local, and global retrieval patterns; cost can be substantial and superiority is conditional |
| `azure-search-rag-demo` | [Azure Search OpenAI Demo](https://github.com/Azure-Samples/azure-search-openai-demo) | MIT | Citations, retrieval inspection, ACLs, telemetry, evaluation, and multimodal paths; additional production security is still required |
| `owasp-rag-security` | [OWASP RAG Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) | CC BY-SA 4.0 | Poisoning, indirect injection, provenance, least privilege, and output validation; no certification claim |

## Maintainer repositories and domain contexts

| Source ID | Exact source | Licence record | Accepted course use and exclusion |
|---|---|---|---|
| `paperqa` | [PaperQA2](https://github.com/Future-House/paper-qa) | Apache 2.0 | Scientific metadata, page evidence, reranking, iterative queries, and citation quality; benchmark and hosted-service claims are not generalised |
| `privategpt` | [PrivateGPT](https://github.com/zylon-ai/private-gpt) | Apache 2.0 | Local ingestion, parsing, embeddings, storage, API, and UI; "local" alone does not prove that every dependency remains offline |
| `ragflow` | [RAGFlow RAG basics](https://github.com/infiniflow/ragflow/blob/main/docs/basics/rag.md) | Apache 2.0 | Complex-document parsing, chunk templates, retrieval tests, and multimodal support; maintainer capabilities are not independent validation |
| `langchain-rag-from-scratch` | [RAG From Scratch](https://github.com/langchain-ai/rag-from-scratch) | Licence undeclared; link and synthesise only | Clear separation of indexing, retrieval, and generation; intentionally simplified and package imports can age |
| `dify-docs` | [Dify Knowledge Retrieval documentation at pinned commit](https://github.com/langgenius/dify-docs/blob/bca060d6b2d741071394605cadae46badb9911c5/en/cloud/use-dify/nodes/knowledge-retrieval.mdx) | CC BY 4.0, commit `bca060d6b2d741071394605cadae46badb9911c5` | Licensed local UI figures; visible models and values are historical examples, not recommended defaults |

## Individual GitHub reports

Every record in this section has evidence label `individual-user-report`. Each supports one test idea and carries a non-generalisation caveat in `lib/rag/sources.ts`.

| Source ID | Exact report | Course use | Explicit limitation |
|---|---|---|---|
| `user-report-sourcegraph-no-context` | [Sourcegraph issue 60500](https://github.com/sourcegraph/sourcegraph-public-snapshot/issues/60500) | Test plausible answering when no usable context is available | One closed report from one product version; no prevalence or current-behaviour claim |
| `user-report-ragflow-reading-order` | [RAGFlow issue 10147](https://github.com/infiniflow/ragflow/issues/10147) | Test parser reading order before changing embeddings | One report does not establish a defect rate or current behaviour |
| `user-report-paperqa-vendor-leak` | [PaperQA issue 1321](https://github.com/Future-House/paper-qa/issues/1321) | Audit network flow across local indexing stages | Configuration- and version-specific; not proof of current defaults |
| `user-report-privategpt-wrong-answer` | [PrivateGPT discussion 241](https://github.com/zylon-ai/private-gpt/discussions/241) | Separate relevant retrieved references from answer correctness | Old mixed reports across versions and configurations; failure-analysis prompt only |
| `user-report-azure-missing-citations` | [Azure Search OpenAI Demo issue 562](https://github.com/Azure-Samples/azure-search-openai-demo/issues/562) | Separate citation presence from citation correctness and completeness | Older model and API context; no claim about current behaviour |

These issue and discussion pages have no declared reuse licence in the course ledger. The course links and independently paraphrases the failure pattern. It does not copy issue prose, screenshots, personal identifiers, or attachments.

## Figure provenance and integrity

### Authentic Anthropic-maintained interface

| Field | Recorded value |
|---|---|
| Figure ID | `claude-support-rag-ui` |
| Lesson | `ground-and-cite` |
| Product label | `Claude-powered Anthropic quickstart` |
| Upstream | `https://raw.githubusercontent.com/anthropics/claude-quickstarts/5264b729deda905dba3e5402d717bebed000325c/customer-support-agent/tutorial/preview.png` |
| Pinned commit | `5264b729deda905dba3e5402d717bebed000325c` |
| Licence | MIT, Copyright (c) 2023 Anthropic |
| Local PNG | `/courses/rag/figures/claude-support-rag-ui.png` |
| Local WebP | `/courses/rag/figures/claude-support-rag-ui.webp` |
| Intrinsic size | 3272 by 2212 pixels |
| PNG SHA-256 | `58fc30873b8a0023b0c6033340f16c69441e645bcdc2c56ed15d385d7835dbfa` |
| WebP SHA-256 | `d3c794a984d49dc68953c4923bb610a95f0bbbb10ee623927abb638c4821882f` |
| Transformation | PNG preserved byte for byte; WebP quality-82 conversion |
| Privacy review | No personal account data, private documents, credentials, or user identifiers visible |
| Observation date | 2026-08-23 |
| Mandatory label | Anthropic-maintained Claude-powered RAG quickstart; not the consumer Claude.ai interface |

The screenshot shows an Anthropic-maintained reference application's customer-support conversation, application activity status, context-use status, knowledge-base history, match indicator, and source link. Its visible `Assistant Thinking` cards are application status summaries, not evidence that hidden model reasoning is exposed. It is authentic to the pinned repository. It must not be described as the current Claude.ai chat, Claude Projects UI, or evidence of a consumer plan entitlement.

### Official Anthropic teaching diagram

| Field | Recorded value |
|---|---|
| Figure ID | `anthropic-knowledge-wiki-architecture` |
| Lesson | `advanced-patterns` |
| Evidence label | Official licensed teaching diagram, not product UI |
| Upstream | `https://raw.githubusercontent.com/anthropics/claude-quickstarts/5264b729deda905dba3e5402d717bebed000325c/managed-agents/knowledge-wiki/assets/architecture.svg` |
| Pinned commit | `5264b729deda905dba3e5402d717bebed000325c` |
| Licence | MIT, Copyright (c) 2023 Anthropic |
| Local SVG | `/courses/rag/figures/anthropic-knowledge-wiki-architecture.svg` |
| Intrinsic viewBox | 960 by 700 |
| SVG SHA-256 | `947a005c4690087aed08f92a1681e95c2e6de7909e1edc7a75e085fa5d00131f` |
| Transformation | None; SVG preserved byte for byte |
| Safety and privacy review | No personal data, scripts, `foreignObject`, event handlers, or external embedded resources |
| Observation date | 2026-08-24 |

The diagram records the pinned quickstart's build-and-query architecture and visible historical model/API labels. It is authentic official teaching evidence but is not a screenshot, consumer Claude.ai, current product navigation, or proof that its architecture is universally appropriate.

### Authentic Dify documentation interfaces

| Figure ID | Upstream path at commit `bca060d6b2d741071394605cadae46badb9911c5` | Size | PNG SHA-256 | WebP SHA-256 |
|---|---|---:|---|---|
| `dify-rag-workflow` | `images/use-dify/workflow/knowledge-retrieval-node-example.png` | 2022 by 580 | `3ba484c0884aa3c91024d8aaec177b237dda7a4840489d5055270931bdc5b17f` | `2de71da3040cb166c5fe0d3f94f39d739a78e9f8dac838515a5360c2373fe64e` |
| `dify-chunk-settings` | `images/use-dify/tutorial/workflow-101-lesson-04/document-processing.png` | 846 by 913 | `3aa56fb2498d3a34bc44a34fb71026790a77dfc95aae3570642cd677740745ce` | `702d39414250c5f677f00739aa5d39e048ac95cf9ecef7d96fd51a51a14a62dd` |
| `dify-chunk-inspector` | `images/use-dify/knowledge/manage-document-chunks.png` | 3398 by 1320 | `4c5666db5e406e79f4614a814cb74417f66f15c969e48991f0dcce0a0030ece9` | `1e8fe1aec6fb6a7e8ad035d8f8c07d1c046092389b367e8a17fbe0bc3065d980` |
| `dify-citations-ui` | `images/use-dify/workflow/citations-and-attributions.png` | 1578 by 904 | `88e33f0ac6573c2a380924a6c9cef419f52f752ec3db14bd137cb90152c55d50` | `e9928c4819c90728aef178b22c477499c7ad0ecb00a3aae8573f086b27d8ced1` |

All four Dify PNG files are preserved byte for byte. Their WebP derivatives are quality-82 conversions. The source repository records Creative Commons Attribution 4.0. The course notice names LangGenius, links the pinned source and licence, records the transformations, and states that no personal data is visible.

The `dify-citations-ui` image shows a generated answer followed by a `CITATIONS` panel naming `remote-work-policy.md` and `leave-and-time-off-policy.md`. It does not show highlighted inline markers, supporting spans, or claim-to-source inspection. The lesson therefore treats file attribution as the visible UI and requires claim-to-span validation as a separate capstone artifact.

### Course-original semantic figures

| Figure ID | Lesson | Teaching purpose |
|---|---|---|
| `rag-decision-map` | Choose RAG | Route an evidence need to direct context, retrieval, tools, SQL, search, or fine-tuning |
| `corpus-control-plane` | Corpus contract | Put authority, provenance, permission, version, tenancy, freshness, and deletion above derivatives |
| `retrieval-scoreboard` | Retrieval engineering | Compare lexical, dense, hybrid, threshold, top K, and reranking signals |
| `context-budget` | Rerank and assemble | Show evidence competing inside a finite model input budget |
| `evaluation-stack` | Evaluate RAG | Separate source, parser, retrieval, context, answer, citation, safety, and system outcomes |
| `threat-boundary` | Secure and refresh | Show permissions and provenance before retrieval and untrusted content before tools, output, traces, and users |

These figures are rendered from course code rather than copied raster media. Their visible text, caption, alternative text, and transcript live in the course content contract.

## Rights and trademark boundary

The public notice includes the full Anthropic quickstart MIT licence text and Dify CC BY 4.0 attribution. It also states:

- no publisher sponsors or endorses aicourse.top;
- the interfaces are dated historical snapshots;
- names and marks remain the property of their owners;
- the PNG masters are preserved and the WebP derivatives are disclosed transformations;
- screenshot model names, values, and settings are examples rather than recommendations;
- the Claude-powered quickstart is not consumer Claude.ai.
- the knowledge-wiki SVG is an official teaching diagram, not product UI, and its visible labels are historical examples.

The official learning pages are used only as linked, paraphrased evidence. No Claude Academy, OpenAI Academy, or Google Skills screenshots, videos, quizzes, or lesson text are republished.

## Claim-to-source verification matrix

| Claim family | Principal source IDs | Verification conclusion |
|---|---|---|
| RAG definition and complete ingestion-serving pipeline | `lewis-rag-paper`, `google-rag-engine-overview`, `openai-retrieval-guide`, `langchain-rag-from-scratch` | Supported; the historical paper is not presented as a full modern production architecture |
| Selection among RAG, long context, fine-tuning, search, SQL, and tools | `anthropic-academy-api`, `anthropic-academy-vertex`, `openai-academy-rag-bootcamp`, `google-skills-boost-rag` | Supported as an engineering decision framework; not claimed as a provider mandate |
| Corpus authority, permissions, lineage, tenancy, versioning, and deletion | `google-rag-reference-architecture`, `openai-data-controls`, `owasp-rag-security`, `azure-search-rag-demo`, `user-report-paperqa-vendor-leak` | Supported; the PaperQA report motivates only a configuration-specific network-flow audit and does not establish current defaults |
| Parsing, OCR or image-aware extraction, layout, and chunk strategies | `google-parse-chunk`, `openai-retrieval-guide`, `anthropic-contextual-retrieval`, `ragflow` | Supported after correction; OpenAI's managed default of 800-token chunks with 400-token overlap and Google's default 500-token chunk-size limit are product-specific evaluation starting points |
| Embeddings, vector indexes, migration, and dense retrieval | `anthropic-academy-api`, `google-rag-engine-overview`, `openai-retrieval-guide` | Supported; similarity is explicitly not truth, permission, freshness, or authority |
| Lexical, dense, hybrid, fusion, query transforms, filters, and ACLs | `anthropic-contextual-retrieval`, `google-hybrid-search`, `openai-retrieval-guide`, `openai-file-search-guide`, `azure-search-rag-demo` | Supported; each strategy requires labelled query-slice evaluation |
| Reranking, diversity, and bounded context | `google-ranking`, `anthropic-contextual-retrieval`, `anthropic-context-engineering`, `openai-retrieval-guide` | Supported; the no-reranker baseline and cost-latency tradeoff remain visible |
| Grounding, citation positions, support scores, and abstention | `anthropic-citations`, `anthropic-projects-rag-help`, `google-check-grounding`, `openai-file-search-guide` | Supported after correction; Google Check grounding is limited to overall and claim-level support plus citations, and citation presence is separated from claim support |
| Agentic, multimodal, graph, research, code, local, and enterprise contexts | `openai-academy-graphrag`, `openai-multimodal-rag`, `microsoft-graphrag`, `paperqa`, `sourcegraph-cody-context`, `privategpt` | Supported as conditional patterns; no maturity-ladder or superiority claim |
| Retrieval, answer, citation, and system evaluation | `openai-evaluation-guide`, `openai-knowledge-retrieval`, `google-check-grounding`, `azure-search-rag-demo` | Supported; metrics are selected by assumptions and calibrated to human decisions |
| Prompt injection, poisoning, privacy, freshness, deletion, and recovery | `owasp-rag-security`, `anthropic-prompt-injection-defences`, `google-model-armor`, `openai-data-controls`, `google-rag-reference-architecture` | Supported as layered controls; complete protection is explicitly rejected |
| Production reliability, observability, cost, latency, canaries, and rollback | `google-rag-reference-architecture`, `openai-knowledge-retrieval`, `azure-search-rag-demo` | Supported as release evidence; no threshold is universal without a task and risk budget |

## Named-technique trace audit

The lesson copy contains several named techniques that deserve direct source traceability rather than relying on general model knowledge.

| Technique | Current direct source | Audit rule |
|---|---|---|
| BM25 and dense plus sparse retrieval | `anthropic-contextual-retrieval` | Keep the Anthropic experimental caveat |
| Reciprocal-rank fusion | `google-hybrid-search` | Treat weights and thresholds as examples |
| Query rewriting and filters | `openai-retrieval-guide` | Recheck API behaviour before release |
| HyDE | `openai-knowledge-retrieval` | The source is assigned to the lesson that names HyDE; retain the starter-kit caveat |
| Measured diversification | No named algorithm asserted | Compare generic source- or cluster-diversification with the unmodified ranking baseline; add a direct source before naming a specific method |
| Self-RAG | `self-rag-paper` | The ICLR 2024 primary paper is assigned to `advanced-patterns`; retain the boundary that this is a specific trained architecture |
| GraphRAG communities, local, and global retrieval | `microsoft-graphrag` | Keep cost and baseline-comparison caveats |

## Content corrections and challenge findings

The verification pass made the following corrections before release:

1. Google Check grounding was narrowed from an unsupported contradiction-scoring claim to the documented overall support score, claim-level support scores, and claim citations.
2. The unsupported 512-token and 100-token-overlap example was removed. The copy now names only OpenAI's managed default of 800-token chunks with 400-token overlap and Google's default 500-token chunk-size limit for layout-aware document chunking, explicitly as product-specific evaluation starting points.
3. The scanned-page sentence now permits OCR or image-aware vision extraction rather than categorically requiring OCR.
4. Named maximum marginal relevance and crowding claims were removed. The lesson retains the diversity concept as measured generic diversification against an unmodified ranking baseline.
5. The OpenAI Academy RAG bootcamp is typed as an official event and livestream, and the GraphRAG item as an official video session. The five-source learning spine is three courses, one event, and one video, not five courses.
6. The Google learning source now uses the canonical `skills.google` URL and the publisher brand Google Skills.
7. The PaperQA individual report is assigned to `corpus-contract`, where its local-indexing network-flow audit is invoked, while retaining its version- and configuration-specific caveat.
8. Sourcegraph Cody context is typed as current official documentation, not a repository.
9. HyDE is directly traceable through `openai-knowledge-retrieval`, and Self-RAG through the primary `self-rag-paper`, each with its scope caveat.
10. The Claude image remains accurately described as a Claude-powered Anthropic quickstart rather than consumer Claude.ai, and Dify interface values remain historical screenshot examples rather than recommended defaults.
11. A pixel-level figure audit removed claims that the Dify citation image contains highlighted markers or source spans, corrected the selected Dify chunk mode and preprocessing label, narrowed the retrieval scoreboard description to its two numeric columns and fused pipeline, and described Claude quickstart activity cards without implying hidden chain-of-thought access.
12. The LangChain RAG From Scratch licence was corrected from a false MIT claim to undeclared with link-and-synthesise-only reuse.
13. Microsoft GraphRAG implementation details were qualified as properties of its standard pipeline rather than a universal graph-RAG definition.
14. The OpenAI evaluation source now records the hosted Evals retirement dates, and Anthropic's prompt-injection article is bounded to browser-agent evidence with OWASP retained as the general RAG authority.
15. Every final checkpoint now names its supporting source ID explicitly and the checker validates that mapping; no source is inferred from array order.
16. The final answer-key positions are balanced exactly 3/3/3/3, so always selecting a single option position can score at most three of twelve rather than pass.
17. Eight complete translated bundles replace the prior English fallback; loader, metadata, sitemap, structured data, Arabic RTL, option order, stable IDs, and placeholders are now explicit release contracts.
18. An official Anthropic knowledge-wiki teaching diagram replaces the prior original advanced-routing figure. Its MIT basis, immutable source, exact bytes, checksum, safety review, historical-label boundary, and non-product-UI label are recorded without claiming a second Claude UI.

No correction should silently broaden a source's authority. For example, adding a primary Self-RAG paper can support what that paper defines and evaluates; it cannot establish that Self-RAG is best for an unrelated production corpus.

## Source time and volatility policy

All source records currently resolve through the shared constant `RAG_SOURCE_SNAPSHOT_ON = "2026-08-23"`. Every authentic screenshot records `observedOn: "2026-08-23"`; the added official Anthropic SVG records its separate 2026-08-24 figure audit. Both reusable repositories are pinned to immutable commit hashes.

Source categories have different drift profiles:

| Drift level | Sources | Release rule |
|---|---|---|
| Very high | plan access, limits, API schemas, billing, retention, data controls, service names, UI locations | Reopen immediately before release; update or remove stale operational statements |
| High | current provider tutorials, Help Center pages, Academy course, event, or video structure, managed product defaults | Recheck before release and whenever lesson behaviour changes |
| Medium | maintainer documentation and main-branch repositories | Pin when copied; recheck when implementation advice or capability claims change |
| Low but not immutable | foundational papers, OWASP guidance, stable architecture concepts | Verify URL and version; revisit when the course expands the claim |
| Immutable asset evidence | pinned quickstart and Dify commits | Recompute local checksums and retain the pinned source and licence notice |
| Case evidence only | individual GitHub issues and discussions | Preserve accessed date and version caveat; never infer current product truth |

The source snapshot date must not be advanced only to silence a checker. A new date requires actual verification of the affected official pages, lesson claims, source anchors, and rights records.

## Correction protocol

When verification finds a problem:

1. Classify it as factual error, product drift, source-definition gap, lesson-source assignment gap, rights problem, accessibility problem, assessment ambiguity, or implementation failure.
2. Freeze the exact affected claim, source ID, lesson, figure, question, and route.
3. Prefer the current primary source. If no source supports the claim, narrow or remove it.
4. Update the lesson explanation, checkpoint answer, source list, figure caption, alt text, transcript, and public notice together when they share the same product fact.
5. Preserve explicit uncertainty. Do not convert "may", "reported", or "in this experiment" into a general claim.
6. Re-run concept coverage, source resolution, JSON contract, type checking, build, release checker, browser interaction, and asset-integrity tests.
7. Increment the course version when the learning contract or assessment meaning changes.
8. Record the reason for any answer-key change so a learner's prior saved result is not silently reinterpreted.

## Reproduction and acceptance checks

This research ledger expects the implementation QA layer to verify at least:

```sh
npm run rag:check
npm run rag:check:release -- --json
npm run test:rag
npm run build
npm run i18n:check:release -- --json
```

The dedicated checker should fail when any of the following is true:

- manifest totals, order, slugs, or 780-minute duration drift;
- any of the 34 concept IDs loses lesson coverage;
- a lesson source ID or figure ID does not resolve;
- any of the five precisely typed official learning sources disappears or changes type: three courses, one OpenAI Academy event, and one OpenAI Academy video;
- a lesson loses its three sections, practice, four-option checkpoint, takeaway, or sources;
- an authentic screenshot is remote-only, missing, dimensionally wrong, checksum changed, unlicensed, unpinned, or missing its privacy review;
- the Claude figure is called consumer Claude.ai;
- a screenshot value is presented as a universal recommendation;
- an individual report loses its evidence label or caveat;
- the 12-question assessment or 9-of-12 pass rule changes without an intentional course-version change;
- any locale bundle falls back to English, changes a stable ID or answer key, loses an interpolation placeholder, or fails Arabic RTL rendering;
- the official Anthropic diagram is represented as product UI or its byte-pinned SVG drifts;
- visible course copy contains a known overclaim such as "RAG eliminates hallucinations";
- the source snapshot is advanced without a corresponding evidence refresh.

The dedicated checker enforces manifest structure, exact source assignments and labels, known wording boundaries, interactions, and asset integrity. Those checks are valuable release evidence, but they cannot semantically prove every instructional claim; primary-source review and adversarial content audit remain separate gates.

## Final provenance boundary

This ledger supports the claim that Course 9 has an explicit, dated, inspectable evidence basis and that its authentic local figures have documented upstream sources and licence paths. It does not certify any third-party product, guarantee RAG performance, establish that individual GitHub reports remain current, imply publisher endorsement, or prove the absence of semantic errors. It also does not turn successful content review or structural checking into successful software release: build and browser evidence must be produced separately from the current worktree.
