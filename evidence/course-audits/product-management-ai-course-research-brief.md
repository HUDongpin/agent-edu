# Course 14 research brief

**Course:** How Products Are Imagined, Designed, and Built in the Age of AI<br>
**Site:** aicourse.top<br>
**Prepared:** 2026-08-23<br>
**Status:** release evidence brief

## Executive finding

PMaker is a strong narrative anchor for an AI-era product course because it connects product judgment, behavioral discovery, explicit scope, experience states, specification, AI-assisted implementation, and validation. It is not, by itself, a complete professional product-management curriculum. The released Course 14 therefore keeps PMaker's practical problem-to-product spine while adding strategy, market and business economics, rigorous research, stakeholder leadership, outcome roadmaps, requirements and non-functional qualities, engineering and release, go-to-market, causal experimentation, growth, lifecycle, accessibility, governance, and production AI operations.

The curriculum's governing loop is:

> evidence → judgment → artifact → review gate

That loop prevents two common failures: treating frameworks as answers and treating AI-generated output as validated product judgment.

## Source hierarchy

### 1. Primary orientation source

[PMaker](https://pmaker.space/en/) supplies the course's practical orientation: a product manager is responsible for product choices; needs should be reconstructed from behavior and context; a product definition must identify user, value, and boundary; work should be cut into an end-to-end learning slice; interface states and data structure belong in the specification; and AI-assisted construction still requires evidence and validation.

PMaker is treated as practitioner guidance, not as an empirical effectiveness study or universal standard. Its visible material is linked and paraphrased. No long passages, illustrations, prompt sets, page layouts, or worked examples are copied.

### 2. Open and inspectable product practice

- [PM-Skills](https://github.com/product-on-purpose/pm-skills) is an Apache-2.0, versioned collection of product-management skills and sample artifacts. It is used as a practical comparison point, not as proof that any template is correct.
- [Awesome Product Management](https://github.com/dend/awesome-product-management) is a CC0 breadth index. Its linked resources retain their own rights and still need source-level evaluation.
- [GitHub's public roadmap](https://github.com/github/roadmap) is a real artifact for studying phases, audience, uncertainty, and the boundary between direction and delivery commitment.
- [GitHub Projects documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects) demonstrates how issues, pull requests, fields, views, and automation can support delivery. Tool capabilities are not a substitute for strategy or discovery.
- [GitLab's product handbook](https://handbook.gitlab.com/handbook/product/) provides a transparent company operating example spanning roles, product processes, planning, cross-functional work, and lifecycle decisions. It is one organization's model, not a universal prescription.
- [GitLab's product-development budgeting process](https://handbook.gitlab.com/handbook/product-development/how-we-work/product-development-flow/product-development-budgeting/) supplies a current, inspectable example of documenting, vetting, prioritizing, and communicating investment cases; its organizational and accounting assumptions remain GitLab-specific.
- [GitLab's tiering guidance](https://handbook.gitlab.com/handbook/product/product-processes/tiering-guidance-for-features/) supplies a current example of connecting buyer, value, maturity, packaging, pricing governance, adoption, and revenue; its open-core model is not a universal pricing method.
- [GitLab's deprecations and removals policy](https://handbook.gitlab.com/handbook/product/categories/gitlab-the-product/#deprecations--removals-policy) supplies a current example of defining breaking changes, tracking affected use, communicating migration, scheduling removals, and assigning product ownership; notice and support duties vary by product and contract.

### 3. Primary, official, and research calibration

- Research and discovery: [GOV.UK User Research](https://www.gov.uk/service-manual/user-research) and [Nielsen Norman Group on interviews](https://www.nngroup.com/articles/user-interviews/).
- Delivery boundary: [The Scrum Guide](https://scrumguides.org/scrum-guide.html). Scrum is taught as a delivery framework, not a complete product-management system.
- Measurement: [Google HEART](https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/), the original [Intercom RICE description](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/), and Microsoft Research's [during-experiment trust patterns](https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-during-experiment-stage/).
- Accessibility: [W3C WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).
- Human-centered AI: [Google People + AI Guidebook](https://pair.withgoogle.com/guidebook-v2/) and [Microsoft HAX Toolkit](https://www.microsoft.com/en-us/haxtoolkit/).
- AI system design: [Google Rules of ML](https://developers.google.com/machine-learning/guides/rules-of-ml) and [Anthropic on effective agents](https://www.anthropic.com/engineering/building-effective-agents).
- AI evaluation: [OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) and [Anthropic on agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents). OpenAI's methodology remains useful, but its legacy Evals dashboard/API is in a published [deprecation process](https://developers.openai.com/api/docs/deprecations#2026-06-03-evals-platform), so the course keeps implementation vendor-portable.
- Operations: [Google Cloud's generative-AI deployment and operations guidance](https://docs.cloud.google.com/architecture/deploy-operate-generative-ai-applications).
- Risk and security: [NIST AI RMF 1.0](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf), the [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf), and the versioned [OWASP 2025 Top 10 for LLM and GenAI applications](https://genai.owasp.org/llm-top-10/).
- Current legal text: the [original authentic EU Regulation 2024/1689](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32024R1689) is paired with the [consolidated documentation version of 27 July 2026](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02024R1689-20260727). The consolidated view has no independent legal effect, authentic Official Journal acts control, and the course is not legal advice.

## Coverage judgment

The 14-module release covers these product-management domains:

1. Role, decision rights, product triad, stakeholders, and operating cadence.
2. Vision, product strategy, segmentation, positioning, competition, business model, pricing, and unit economics.
3. Research questions, recruitment, consent, interviews, observation, analytics, support/sales evidence, and triangulation.
4. Synthesis, jobs to be done, opportunity framing, assumptions, product definition, MVP, scope, and non-goals.
5. Outcomes, North Star, input and guardrail measures, metric definitions, instrumentation, funnels, cohorts, and retention.
6. Kano, RICE, cost of delay, confidence, dependencies, portfolio choices, and outcome roadmaps.
7. Value, usability, feasibility, viability, ethics, prototypes, assumption tests, and precommitted decisions.
8. Journey and service design, information architecture, content, states, recovery, accessibility, and design systems.
9. Living PRDs, use cases, stories, acceptance criteria, non-functional requirements, data, permissions, events, APIs, and decision logs.
10. Non-AI baselines, model and provider choice, prompt/context, RAG, workflows, agents, evaluation, AI UX, cost, latency, and fallback.
11. Dual-track work, thin slices, Scrum/Kanban boundaries, GitHub workflow, AI coding-agent contracts, flags, canaries, rollback, and technical debt.
12. Task/RAG/agent evaluation, human calibration, threats, privacy, copyright, bias, oversight, least privilege, observability, drift, incidents, and governance.
13. Positioning, packaging, launch stages, documentation, sales/support enablement, onboarding, adoption, retention, growth, and deprecation.
14. Randomized experiments, power and minimum detectable effect, guardrails, Product Ops, portfolio reviews, conflict, narrative, lifecycle leadership, and capstone defense.

## Rights and evidence boundary

- PMaker did not expose a clear site-wide open license during this audit. Use is limited to linking and original paraphrase unless permission is obtained.
- Apache, MIT, CC0, CC BY, and CC BY-SA materials retain their individual obligations. A repository's license does not automatically cover third-party frameworks or links within it.
- Google PAIR is marked CC BY-NC-SA 4.0. The course links and independently summarizes its ideas; it does not import its visual or exercise assets.
- Vendor guidance is useful first-party documentation for a product or method, but it may contain provider assumptions. Course decisions remain vendor-portable and task-specific.
- Framework scores are decision aids, not objective truth. Estimates, samples, confidence, and sensitivity remain visible.
- AI model features, prices, retention terms, legal obligations, and platform APIs can change. Learners are directed to current primary documentation for consequential decisions.
- Teaching constraints such as artifact counts, time boxes, or starter evaluation-set sizes are labeled as pedagogical choices, not universal industry thresholds.

## Release recommendation

Release Course 14 as an original, evidence-bounded English long-form course with localized catalog metadata. Preserve a single English canonical URL until each full translation has been professionally reviewed. Keep the source registry visible at module level, including what each source supports and where it does not establish a conclusion.

The capstone should be passed only when a reviewer can trace the learner's product bet from observed customer context through strategy, scope, experience, requirements, AI evaluation, risk controls, release design, go-to-market, measurement, and the next continue/pivot/stop decision.
