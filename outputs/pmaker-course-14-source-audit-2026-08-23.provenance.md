# Provenance sidecar: PMaker course 14 source audit

**Audit date:** 2026-08-23  
**Timezone:** Asia/Taipei  
**Repository:** `/Users/peter/Desktop/Agentic Engineering`  
**Mode:** Read-only web research; no site edits, generation, or deployment

## Scope contract

In scope:

- the public PMaker English homepage;
- public PMaker Chinese detail pages reachable through the homepage or search;
- site structure, page titles, practitioner claims, embedded exercise ideas, AI-era framing, accessibility limitations, and evidence gaps;
- an original proposed module sequence for Course 14.

Out of scope:

- modifying the local site or PMaker;
- generating or deploying course pages;
- bypassing authentication, bot protection, cache failures, or unavailable pages;
- copying PMaker text, illustrations, templates, or visual design;
- treating unreferenced heuristics as empirically established universal facts;
- auditing the separate GitHub product-management source set assigned to another researcher.

## Primary site entry points

- [PMaker English homepage](https://pmaker.space/en/)
  - Supports the near-identical course title and the 14 top-level topic groups.
  - The visible English page still contains some Chinese navigation labels.
- [PMaker Chinese homepage](https://pmaker.space/)
  - Supports the full visible directory and the statement that material is curated from practice and public sources.

## PM and product-practice pages inspected

- [What a PM does](https://pmaker.space/basics/what-pm-does)
- [Product workflow](https://pmaker.space/basics/product-workflow)
- [Common business models](https://pmaker.space/basics/business-models)
- [Product thinking models](https://pmaker.space/basics/thinking-models)
- [What is a need](https://pmaker.space/patterns/what-is-need)
- [Ask behavior, not intention](https://pmaker.space/patterns/ask-behavior)
- [How to run a user interview](https://pmaker.space/patterns/interview)
- [Backlog and prioritization](https://pmaker.space/patterns/backlog-priority)
- [One-sentence product](https://pmaker.space/patterns/one-sentence)
- [Not-doing list](https://pmaker.space/patterns/not-doing-list)
- [Minimum slice](https://pmaker.space/patterns/thin-slice)
- [Connect the business model](https://pmaker.space/patterns/connect-business)
- [Product evolution blueprint](https://pmaker.space/patterns/roadmap-blueprint)
- [What is information architecture](https://pmaker.space/patterns/what-is-ia)
- [Card sorting](https://pmaker.space/patterns/card-sorting)
- [Data model first](https://pmaker.space/patterns/data-model-first)
- [Map the user journey](https://pmaker.space/patterns/user-journey)
- [Four states complete](https://pmaker.space/patterns/four-states)
- [Visual hierarchy](https://pmaker.space/patterns/visual-hierarchy)
- [Minimal design system](https://pmaker.space/patterns/design-system)
- [What AI can and cannot do](https://pmaker.space/patterns/ai-can-cannot)
- [Spec before code](https://pmaker.space/patterns/spec-before-code)
- [Context budget](https://pmaker.space/patterns/context-budget)
- [Three-part prompt](https://pmaker.space/patterns/three-part-prompt)
- [Usable, useful, used](https://pmaker.space/patterns/three-layers-of-validation)
- [One North Star](https://pmaker.space/patterns/north-star)
- [North Star decomposition](https://pmaker.space/patterns/north-star-split)

## AI product, safety, and evaluation pages inspected

- [Where AI stands today](https://pmaker.space/learn/current-state)
- [Model, Agent, and Application layers](https://pmaker.space/learn/agent-layers)
- [Three forms of Agent drift](https://pmaker.space/learn/agent-drift)
- [Permission levels and human checkpoints](https://pmaker.space/learn/permissions)
- [Agent evaluation](https://pmaker.space/learn/agent-eval)
- [Prompt injection](https://pmaker.space/learn/prompt-injection)
- [Where conversation data goes](https://pmaker.space/learn/data-usage)
- [Human boundary](https://pmaker.space/learn/human-boundary)

## Access limitations recorded

- Direct opening of `https://pmaker.space/en` failed in the web fetcher, while clicking the homepage language switch successfully resolved to `https://pmaker.space/en/` through `https://pmaker.space/en/index.html`.
- Clicking selected English-homepage detail links returned Chinese detail pages in the fetcher.
- Clicking the language switch on selected Chinese detail pages attempted the following English routes, but the fetcher returned `Cache miss`:
  - `https://pmaker.space/en/patterns/spec-before-code.html`
  - `https://pmaker.space/en/learn/current-state.html`
  - `https://pmaker.space/en/basics/business-models.html`
- Exact-site searches returned no indexed English detail result for the tested pages.
- Direct shell `curl` failed DNS resolution inside the restricted sandbox; no escalation or bypass was attempted because the approved web browser already supplied the public evidence needed.
- Text extraction did not expose every diagram, interactive element, or the workflow page's stated 16-step visual. Those contents were not inferred.

## Evidence classification

- **Direct site evidence:** page title, visible directory, visible method, visible example or checklist.
- **Author synthesis:** PMaker practitioner framing without an external bibliography; used as a pedagogical pattern, not a universal fact.
- **Time-sensitive claim:** model capability, price, vendor terms, data use, or product availability; requires current first-party verification before publication.
- **Course recommendation:** original synthesis in the research brief; not claimed to be a PMaker statement.

## Reuse and rights boundary

No explicit site-wide open-content licence was found in the search results or inspected pages. The brief therefore recommends link-and-paraphrase only. Original course copy, diagrams, prompts, cases, quizzes, rubrics, code, and layouts should be created independently unless separate permission is obtained.
