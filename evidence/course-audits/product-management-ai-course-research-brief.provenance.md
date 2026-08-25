# Course 14 research provenance

**Access date:** 2026-08-23  
**Method:** public web search and direct source inspection; no authenticated or paywalled material used  
**Purpose:** source selection, concept coverage, currency check, and rights-boundary review

## Records retained in the implementation

The canonical machine-readable source registry is:

- `lib/product-management/sources.ts`

Each record stores a stable source ID, title, publisher, public HTTPS URL, access date, source kind, the claim area it supports, and a visible limitation or boundary. Module-to-source assignments are fixed in `lib/product-management/manifest.ts`; rendered lessons expose those records rather than hiding them in an end bibliography.

## Primary-source inspection

- PMaker English index and the linked role, workflow, product-type, industry, business-model, discovery, definition, backlog, roadmap, metrics, design, AI collaboration, model/RAG/agent, launch, safety, lifecycle, instrumentation, and validation pages were inspected. Some `.html` requests redirect to extensionless canonical paths.
- PMaker's English index was available, while some detail content was served in Chinese or did not expose a stable reviewed English body through the text fetcher. Course 14 therefore paraphrases verified concepts in independent English and does not claim complete PMaker English-detail parity.
- PMaker's interactive diagrams and images were not used as evidence where text extraction did not expose their exact contents.

## Independent calibration

Direct pages were inspected from GitHub, GitLab, GOV.UK, Scrum Guides, Kanban Guides, Atlassian, Strategyzer, Nielsen Norman Group, Product Talk, SVPG, Google Research, Google Analytics, Google SRE, W3C, Google PAIR, Google for Developers, Google Cloud, OpenAI Developers, Anthropic, NIST, Microsoft Learn, Microsoft Research/HAX, OWASP, EUR-Lex, Intercom, Scaled Agile, Agile Business Consortium, Reforge, Productboard, the U.S. Small Business Administration, and What Matters. The GitLab inspection included its public product handbook, product-development flow, product-development budgeting process, tiering guidance, and deprecations/removals policy so release-stage, portfolio-investment, packaging/pricing, and lifecycle-exit claims were not inferred from delivery-tracking documentation.

GitHub repositories were selected for inspectability and practical artifacts. Star count was not treated as authority. The main current PM skill repository was verified at `product-on-purpose/pm-skills`, including its Apache-2.0 license and current repository structure. Awesome lists were used only as discovery and coverage indices.

## Currency and legal limits

- Source claims reflect the pages available on 2026-08-23.
- All retained PMaker source records use the English `/en/` route, while the registry keeps a visible boundary where individual detail pages remain partly localized.
- OWASP terminology is locked to its 2025 taxonomy. NIST AI RMF 1.0 is separately identified from NIST AI 600-1 and is marked as under revision.
- OpenAI's legacy Evals platform deprecation dates and the 27 July 2026 EU AI Act consolidated view were checked as time-sensitive lifecycle facts. The consolidated EU text is recorded as a documentation tool, not an independently authoritative act.
- Model capabilities, provider pricing, API names, data terms, deprecations, standards implementation, and legal timelines require fresh verification before a consequential real-world decision.
- The course's legal and licensing notes are production safeguards, not legal advice.
- No source text was bulk downloaded into the public course; no credentials, cookies, tokens, private repositories, or signed URLs were used.

## Known limitations

- Public pages can change after access; URLs and source boundaries are revalidated by release review, not frozen as timeless fact.
- The research did not establish that any one product framework causes better outcomes across organizations.
- Company handbooks document situated operating models. Their inclusion demonstrates inspectable practice rather than universal best practice.
- The course primarily addresses digital software and AI-enabled products. Hardware, biomedical, financial, and other highly regulated product contexts need additional domain-specific controls and review.
- Long-form instruction is reviewed in English only for the first release. Other route locales render localized catalog/navigation metadata and a clear English-content notice; they are excluded from Course 14 hreflang and sitemap alternates until reviewed translations exist.
