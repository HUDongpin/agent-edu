# aicourse.top — Practical AI learning

**Free, open courses to understand, use, build, and evaluate AI.**

`aicourse.top` is a multilingual learning platform built around practical outcomes and visible evidence. Learners can start from AI first principles, practise with real model behaviour, build a small agent, or learn a complete evidence-first workflow for AI-assisted software work. Published courses are independent; curated paths help learners who want a sequence.

**▶ [aicourse.top](https://aicourse.top)** · free · no account · no ads · anonymous page counts only · nine languages

<img src="public/logo-lockup.svg" alt="aicourse.top" width="252">

| Available course | Modules and outcomes | Needs |
|---|---|---|
| **[Agentic Engineering](https://aicourse.top/en/courses/#agentic-engineering)** | [Handbook](https://aicourse.top/en/handbook/), [Lab](https://aicourse.top/en/lab/), and [Build an Agent](course/) | nothing for the handbook; a DeepSeek key for optional live Lab calls; TypeScript for the build |
| **[How to Use Codex](https://aicourse.top/en/codex/)** | four units, twelve lessons, a 24-question bank, final assessment, and locally verified capstone | Codex for the hands-on workflows; no third-party framework |
| **[Software Engineering with Agentic AI](https://aicourse.top/en/software-engineering/)** | five units, eighteen evidence-producing lessons, a stratified 25-question bank, nine authentic figures, and an eight-package safe-change capstone | no account for the course; Git and code-reading ability for the hands-on labs |
| **[How to Write Prompts](https://aicourse.top/en/prompts/)** | three units, nine lessons, nine original prompt figures, a source-linked assessment, and a prompt evidence-packet capstone | no account, API key, or coding experience |
| **[Retrieval-Augmented Generation](https://aicourse.top/en/rag/)** | four units, twelve lessons in nine languages, a deterministic retrieval lab, five authentic UI figures, one official Anthropic teaching diagram, a source-linked assessment, and a production evidence-packet capstone | no account, API key, vector database, or coding experience for the teaching lab |
| **[Agent Orchestration](https://aicourse.top/en/agent-orchestration/)** | four phases, fifteen evidence-bounded modules, six deterministic control-room labs, an assessment, and a fifteen-artifact production capstone | no account or API key; software-system design experience helps with the production exercises |
| **[智能体赋能自媒体运营 / Agentic Creator Operations](https://aicourse.top/zh-Hans/creator-ops/)** | four phases, ten evidence-producing modules, ten applied artifact workbenches, an assessment, and a 30-day simulation capstone | no account, paid API, production social account, or coding background for the core course |

Published courses and the open roadmap—including AI tools, research, teaching, evaluation, and responsible AI—are listed in the [catalogue](https://aicourse.top/en/courses/). Teaching the foundations material? There is a **[90-minute lesson plan](TEACHING.md)**.

---

## Run it locally

```bash
npm install && npm run dev
```

`npm run build` type-checks and writes the multilingual site to `out/` as static files. No server, no database, no API route — you can serve `out/` with anything.

**Nothing here is a real AI — by default.** Every "model" reply in the handbook is scripted, so the patterns stay legible and the page can never break because a key expired. The Lab is the exception: give it your own [DeepSeek](https://platform.deepseek.com/api_keys) key and it calls a real model, so you can watch the same question come back different. Your key is held in that one browser tab, erased when you close it, and sent to `api.deepseek.com` and nowhere else. No page loads a script, font or image from another host.

---

## Course: Agent Orchestration

Course 15 teaches agent orchestration as a production control system, not a
collection of impressive multi-agent demos. Its four phases and fifteen modules
cover the workflow/agent boundary; task graphs and typed execution contracts;
chaining, routing, fan-out/fan-in, managers, agents-as-tools and handoffs;
orchestrator-workers and evaluator/verifier loops; tool and MCP boundaries;
context, conversation state, sessions, checkpoints, memory and compaction;
budgets, queues, backpressure and cancellation; timeout, retry, ambiguous
outcomes, idempotency, effect journals, compensation and manual reconciliation;
authority, prompt injection, sandboxing and human review; tracing, monitoring,
audit and economics; evals, regression and version governance; and progressive
production rollout.

The long-form course is complete in English and Simplified Chinese. Its other
seven locale routes retain their translated site shell and catalogue card but
show an explicit English-content notice and canonicalize to the reviewed English
edition. Every module has exactly three visible evidence modes—source-grounded,
engineering synthesis and version watch—plus a twelve-field orchestration
contract, editable artifact template, deterministic local lab and checkpoint.
The labs make no model or network call and deliberately inject two critical
failures: a committed side effect whose response is lost, and an untrusted
RAG/MCP result that attempts to authorize data exfiltration.

OpenAI and Anthropic/Claude Academy sources form the main evidence spine, with
the current MCP 2026-07-28 specification and version-pinned official GitHub
repositories providing implementation and lifecycle anchors. Provider surfaces
remain distinct: OpenAI Responses Hosted Multi-agent Beta, Codex subagents,
OpenAI Agents SDK orchestration, Claude Agent SDK subagents, application-level
task graphs and MCP do not share one generic definition of root, session, slot,
state or control ownership. The uploaded PPTX and ZIP were verified and used only
as private reference evidence; third-party screenshots, chat captures, course
media and close redraws are not published. The public boundary is documented in
[`public/courses/agent-orchestration/NOTICE.md`](public/courses/agent-orchestration/NOTICE.md).

Useful maintenance commands:

```bash
npm run agent-orchestration:check         # curriculum, source, route, i18n, progress, rights and integration contracts
npm run agent-orchestration:check:release # strict Course 15 release gate
```

The evidence synthesis and publication boundaries live in
[`outputs/agent-orchestration-course-research-brief.md`](outputs/agent-orchestration-course-research-brief.md)
and
[`outputs/agent-orchestration-course-research-brief.provenance.md`](outputs/agent-orchestration-course-research-brief.provenance.md).

---

## Course 16: 智能体赋能自媒体运营

Course 16 treats creator media as an accountable operating system rather than a
one-click content machine. Its teaching loop is **signal → evidence → editorial
agent graph → factual/brand/rights gates → multimodal assets → one source of
truth → human approval → authorized distribution → first-party feedback →
governance**. Ten modules produce ten inspectable operating artifacts, followed
by a ten-question final assessment and a 30-day synthetic simulation capstone.

GitHub repositories are the primary implementation evidence. The course
separates code licenses, model and plug-in licenses, input-media rights, identity
and voice consent, output provenance, and platform permission instead of
inferring that an MIT or Apache repository makes every model, asset, output, or
publish action commercially usable. PASS sources support a bounded classroom
pattern; CONDITIONAL sources carry visible deployment, model, target-site, or
license constraints; EXCLUDED projects such as MediaCrawler and
MoneyPrinterTurbo appear only as compliance cases and are never installed or
run in the hands-on path. All real external writes remain off: publishing uses a
local outbox or an authorized official API path and requires human approval.

The complete long-form course is reviewed in English and Simplified Chinese.
The other seven route locales retain the translated platform shell and catalog
card, render the explicit reviewed-English fallback, and canonicalize to the
English edition. Browser progress shares `ae.progress` with the platform but
stores only milestone receipts; the editable practice text remains in component
memory and is never written to local storage.

Useful maintenance commands:

```bash
npm run creator-ops:check         # curriculum, GitHub ledger, bilingual copy, routes, rights and integration contracts
npm run creator-ops:check:release # strict fail-closed Course 16 gate
npm run creator-ops:static-check  # emitted out/ HTML, sitemap, local assets and deployment checksum receipt
npm run test:creator-ops          # real Chromium: a11y, responsive, privacy, download, quiz and History API regressions
npm run creator-ops:release       # Course 16 gate -> production build -> static audit -> browser audit
```

The two Course 16 SHA-256 surfaces are checksum-backed review receipts for
detecting accidental drift, not cryptographic identity signatures. Approval
identity remains the responsibility of protected Git review/commit history or
an external audit record.

The evidence synthesis and item-level provenance are in
[`outputs/creator-ops-course-research-brief.md`](outputs/creator-ops-course-research-brief.md)
and
[`outputs/creator-ops-course-research-brief.provenance.md`](outputs/creator-ops-course-research-brief.provenance.md).
The link-only source and rights boundary is published in
[`public/courses/creator-ops/NOTICE.md`](public/courses/creator-ops/NOTICE.md).

---

## Course: How to Use Codex

The Codex course uses one repeatable operating loop: bound the task, orient to the repository, plan from evidence, implement in testable slices, steer early, verify fresh behavior, and review the actual diff. It applies that loop across the desktop app, CLI, IDE extension, cloud environments, worktrees, subagents, Skills, scheduled tasks, and GitHub automation.

The course is deliberately fail-closed about product media. Every figure record begins as `capture-required`; `npm run codex:check:release` will not pass until a genuine Codex or GitHub surface has local responsive assets, dimensions, a matching SHA-256, version and operating-system metadata, a current source, and recorded privacy review. Generated or reconstructed Codex UI is not accepted.

The capstone starter lives in [`examples/codex-course-demo/`](examples/codex-course-demo/). It intentionally begins with two failing assertions for the missing keyboard-accessible **Incomplete** filter. After the learner implements the bounded fix, `npm run course:verify` inside the fixture runs tests, lint, build, route preservation, keyboard checks, and a no-new-dependencies check. It writes a receipt only when all six pass. The course browser validates that exact schema, fixture version, fixture hash, and check set, then stores only a completion boolean.

Useful maintenance commands:

```bash
npm run codex:fixture       # rebuild the deterministic starter ZIP and checksum
npm run codex:check         # content, locale, route, source, quiz, fixture, and media checks
npm run codex:check:release # same checks, with every pending real capture treated as an error
npm run test:codex          # Playwright smoke and interaction suite
```

Course content is language-neutral in `lib/codex/`; all learner-facing prose, questions, figure descriptions, feedback, and accessibility copy lives in `messages/codex/<locale>.json`. The nine locale files must have exact key and placeholder parity for release.

---

## Course: Software Engineering with Agentic AI

Course 8 teaches agentic coding as a controlled software-delivery system: specify, inspect, plan, implement, test, review, integrate, deploy, observe, and learn. Its five units and eighteen lessons orient learners to all eighteen SWEBOK v4.0a knowledge areas while covering requirements, architecture and design, construction, testing, debugging, Git and configuration management, review and maintenance, documentation, CI/CD, reliability, performance and economics, security/privacy/supply chain, professional practice, team governance, and agent evaluation. This is a knowledge-area orientation and evidence-producing practice course, not a claim to reproduce every topic in the SWEBOK guide.

The final assessment draws fifteen questions from a versioned 25-question bank, exactly three per unit, and passes at 12/15. The capstone requires eight inspectable evidence packages and a five-dimension 100-point rubric with an 80-point threshold. Its browser control is explicitly a local self-attested progress checklist: it does not inspect the external dossier or authorize merge, release, deployment, legal acceptance, or residual-risk acceptance. A well-supported **do not release** decision can pass; a score never waives a blocker.

Nine authentic figures are stored locally with dimensions, SHA-256 records, alt text, transcripts, dates, privacy review, rights notes, and responsive WebP delivery. One Codex and six GitHub assets are tied to immutable licensed repository commits. Two real Claude Desktop images are course-authored, privacy-reviewed editorial captures; they show a Cowork workspace/permission surface and an in-progress artifact workspace, and are never mislabeled as Claude Code diff, test, or release evidence. Claude/OpenAI Academy images remain link-only where republication rights were not established.

Useful maintenance commands:

```bash
npm run software-engineering:check         # curriculum, source, locale, assessment, capstone, media and file contracts
npm run software-engineering:check:release # strict shared-integration and release gate
npm run test:software-engineering           # 35 Playwright route, state, locale, media, SEO, no-JS and responsive checks
```

The instructional body is English in this edition. All nine locale routes provide translated titles, shell and interactive-control labels plus a visible language notice; structured data honestly declares English instructional content. The research brief, source boundary, public capstone dossier, and media-rights record live under `outputs/` and `public/courses/software-engineering/`.

---

## Course: How to Write Prompts

The prompt course uses an evidence-driven loop: specify an observable result, supply relevant context, separate instructions from data, test representative cases, label failures, revise one meaningful factor, and rerun the same evaluation. Its pedagogical spine is informed by Andrew Ng and Isa Fulford's official DeepLearning.AI course, with current first-party guidance and selected GitHub teaching repositories used to update evaluation, grounding, privacy, and prompt-injection coverage. All course explanations, prompts, exercises, datasets, quiz questions, and figures are original to aicourse.top.

Every lesson has its own static URL and includes a selectable prompt, an accessible instructional figure, a three-step practice, a scenario checkpoint, and exact source links. Two original raster teaching figures retain PNG masters, WebP delivery assets, intrinsic dimensions, SHA-256 records, image-generation provenance, and adjacent text transcripts. The remaining seven figures are semantic HTML so they remain readable, selectable, responsive, and accessible without images or JavaScript.

Useful maintenance commands:

```bash
npm run prompts:check         # curriculum, source, route, prompt, quiz, and media checks
npm run prompts:check:release # strict release gate; every required figure must be available
```

The long-form prompt course currently uses an explicit English content boundary inside its locale routes. Root-dictionary entries exist for the catalogue, homepage, progress labels and shell, but that structural fact is not a translation-quality approval; the release audit remains authoritative.

---

## Course: Retrieval-Augmented Generation

Course 9 treats RAG as an evidence system rather than a PDF-chatbot feature. Its four units cover system selection; corpus authority, rights, permissions, provenance and lifecycle; parsing, chunking, embeddings and indexes; lexical, dense and hybrid retrieval; query transformation, filters, reranking and bounded context; grounding, citations and abstention; agentic, multimodal and graph patterns; stage-specific evaluation; prompt injection, poisoning, privacy and tenancy; freshness, deletion, latency, cost, observability, reliability and rollback.

Every lesson has three teaching sections, one system practice, an evidence checklist, a four-option checkpoint, a figure with alternative text and a transcript, and exact source links with visible evidence labels. The browser-only retrieval laboratory compares deterministic lexical, dense and hybrid teaching scores without a model call, embedding API, vector database or network request. Twelve practices, a 12-question assessment and a production capstone form fourteen equal local progress milestones.

Five authentic interface figures are stored locally with intrinsic dimensions, SHA-256 records, immutable upstream commits, responsive WebP derivatives, privacy review and a public rights notice. One is the MIT-licensed Anthropic customer-support quickstart powered by Claude; it is deliberately labelled as an Anthropic-maintained Claude-powered RAG reference interface, not the consumer Claude.ai interface. Four Dify documentation screens are reused under CC BY 4.0. A second MIT-licensed Anthropic visual is an official knowledge-wiki teaching diagram, explicitly not product UI. Six additional figures are original semantic HTML.

Useful maintenance commands:

```bash
npm run rag:check         # curriculum, evidence, route, assessment, progress and media checks
npm run rag:check:release # strict Course 9 release gate
npm run test:rag          # Playwright route, interaction, mobile, locale and SEO suite
```

The complete long-form course, laboratory, assessment, capstone and figure transcripts are localized across English, Spanish, French, German, Simplified Chinese, Traditional Chinese, Japanese, Korean and Arabic. Metadata and structured data self-canonicalize to each content locale, while Arabic course views render right to left. The research audit and complete provenance ledger live in [`outputs/rag-course-research-brief.md`](outputs/rag-course-research-brief.md) and [`outputs/rag-course-research-brief.provenance.md`](outputs/rag-course-research-brief.provenance.md).

---

## Inside the Agentic Engineering course

The site is built around one spine: **who decides the next step, at the moment the program runs?**

Four settings on that dial, in order of how much control you hand over:

| | Section | You'll actually |
|---|---|---|
| 01 | 📜 **Writing code** | Watch a café kiosk fall over on `"a latte please"`, then add rules until you feel the wall |
| 02 | 💬 **Prompt engineering** | Toggle five prompt pieces and watch one prompt give five different answers |
| 04 | 🔁 **Loop engineering** | Step an agent through a restock job as it recovers from a missing tool and a rejected order |
| 05 | 🕸️ **Graph engineering** | Switch the reviewer off and watch an off-policy refund reach a real customer |

And four disciplines that sit underneath, whichever setting you picked:

| | Section | You'll actually |
|---|---|---|
| 03 | 🎒 **Context engineering** | Pack an 8,000-token window and discover that junk which *fits* still wrecks the answer |
| 06 | 🔩 **Harness engineering** | Run the night shift with the retries, timeouts and permission gates switched off |
| 07 | 📊 **Evaluation engineering** | A/B a prompt change over 20 cases and learn to tell a real win from noise |
| 08 | 🔒 **Security engineering** | Send an agent a poisoned email and watch it obey a stranger |

Plus **09 Which one, when** — a comparison table and a decision tree — and **10 Play the game**, ten real briefs where you pick the right tool and find out why the tempting answer was tempting.

### How it teaches

- **Every section opens by asking you to recall the last one** — from something you did with your hands, not something you read. The card is tinted in the colour of the section it reaches back to.
- **Every section closes with what it builds on and what it unlocks**, because the rail is a straight line but the subject isn't.
- **Shape *and* colour carry meaning** in all 19 flowcharts — ⬭ start/stop, ▭ fixed step, ▭ model decides, ▱ tool call, ◇ decision, ▭ failure — so the charts still read in greyscale or print.
- Runs about **45 minutes** end to end, or dip into any single section.

---

## Architecture

It began as one self-contained HTML file. Nine languages ended that: nine dictionaries hand-copied across three pages would drift, and a drifted translation is worse than none. Per-locale URLs then ended the no-build-step rule too — with one shared URL, search engines only ever indexed the English copy.

So it is now **Next.js 16 / React 19 / TypeScript, exported as static files** (`output: "export"`). No server: the handbook is scripted and the lab talks to the model provider straight from your browser with your own key, so hosting stays free and there is no runtime that can leak anything.

| | |
|---|---|
| `app/[locale]/` | localized platform, course, module, and lesson routes |
| `messages/*.json` | every string, one flat file per language. A translator edits one line; no React, no build |
| `messages/handbook/` | the handbook's article prose, extracted from the markup — same idea, one file per language |
| `messages/codex/` | Codex-course locale tables for prose, assessment, captions, feedback, and accessibility copy; release status comes from the audit, not file presence |
| `messages/prompts/` | original English prompt-course prose, prompts, practices, checkpoints, and capstone copy |
| `messages/software-engineering/` | localized Course 8 titles, shell, progress, assessment, capstone, media, and language-boundary copy |
| `messages/rag/` | original English RAG prose, deterministic lab scenarios, practices, checkpoints, accessibility copy, and capstone contract |
| `components/` | the shell React owns: nav, language menu, theme toggle, the Lab |
| `components/codex/` | Codex dashboard, lessons, private progress, figures, assessment, and capstone receipt verifier |
| `components/prompts/` | prompt-course dashboard, lesson renderer, selectable prompts, semantic figures, private progress, assessment, and capstone checklist |
| `components/software-engineering/` | Course 8 dashboard, lesson renderer, authentic figures, versioned progress, balanced final assessment, and self-attested capstone control |
| `components/rag/` | RAG dashboard, lesson renderer, authentic and semantic figures, deterministic retrieval lab, private progress, assessment, and capstone checklist |
| `lib/codex/` | language-neutral lesson, source, quiz, figure, practice, and receipt contracts |
| `lib/prompts/` | prompt-course curriculum, source ledger, figure provenance, locale boundary, and materialisation contracts |
| `lib/software-engineering/` | Course 8 curriculum, SWEBOK coverage map, source and media ledgers, quiz, capstone, locale, and manifest contracts |
| `lib/rag/` | RAG curriculum, 34-concept contract, 40-source evidence ledger, figure provenance, locale boundary, and materialisation contracts |
| `lib/flowchart.ts` | the diagram engine, byte-identical to the verified original |
| `lib/handbook/` | `markup.ts`, the verified handbook markup, and `behaviour.ts`, its 22 widget modules |
| `scripts/` | `extract-handbook.mjs`, which turns the markup's text nodes into `messages/handbook/en.json` |
| `course/` | the nine-stage TypeScript course |
| `legacy/` | the original single-file HTML, and the Python course |

Bare `/` is a real page rather than a redirect — a static export has no server to redirect with — so it reads your saved choice or your browser's languages and sends you on to `/en/`, `/ar/` and so on. Inside the handbook every section has its own hash: [`/en/handbook/#security`](https://aicourse.top/en/handbook/#security).

Two things were deliberately **ported, not rewritten**: the flowchart engine and the handbook's widgets. Twenty diagrams were verified for text overlap, edge-through-node crossings and greyscale legibility; rewriting them in React idiom would have risked all of that and shown the reader nothing new. React owns mounting, the verified imperative code owns behaviour.

## Languages

The site exposes nine locale routes, and Arabic flips the page shell to right-to-left:

English · Español · Français · Deutsch · 简体中文 · 繁體中文 · 日本語 · 한국어 · العربية

Pick one from the language menu, or link straight to it — each language is its own URL, so `/ar/handbook/` *is* the Arabic handbook. Your choice is remembered in the browser.

**Translation release status is currently `NOT READY`.** Locale files or a language-menu entry do not prove that the corresponding pages, widgets, course contracts, media, error states, metadata, or accessibility copy are complete. The local candidate and the deployed site are audited as separate targets; neither may be described as complete until both columns in the same frozen-snapshot report are `PASS`. English product data or screenshots remain LTR only when they have a narrow, recorded exception and localized surrounding explanation.

Translating them is now a matter of filling in one file. `messages/handbook/en.json` holds the 560 strings of article prose, pulled out of the markup by `npm run handbook:extract`; copy it to `fr.json`, translate the values, and `/fr/handbook/` ships in French — the substitution happens at build time, so the exported file is French for a reader, for a crawler and for anyone with JavaScript off. No code change, and nothing to know about React. A part-finished file is fine and its strings appear straight away; the banner and the `en-content` wrapper only drop away once every key is filled in, because flipping a half-translated Arabic page to right-to-left would lay the paragraphs nobody had reached yet out backwards. The build prints what is still missing.

Keys are `hb.body.<nearest ancestor id>.<nth text node>`, and text broken by an `<em>` or a link arrives in pieces: only text is replaced, never the tags around it, which is what keeps the verified markup and its 210 DOM queries intact. Readouts a widget rewrites as you use it — counters, verdicts, the game — come back in English, because those strings live in `behaviour.ts`.

Most translatable strings live in [`messages/`](messages/). To fix a translation, edit the relevant namespace file. To add a language, add it to `LOCALES` in [`lib/i18n.ts`](lib/i18n.ts) (set `dir:"rtl"` if it needs it) and supply every dynamically discovered namespace. A missing key may fall back to English during development, but it is a release failure. The language menu deliberately does not show a completion percentage because the old number covered only the root dictionary.

Release audits are fail-closed and bind every result to a content snapshot:

```bash
npm run i18n:check:release -- --json  # structure, source, course, build, route, SEO, review and artifact gates
npm run i18n:audit:browser            # CLI-only JS-on/JS-off browser evidence for that snapshot
npm run i18n:audit:production         # run only after the identical local artifact passes
```

Reports, per-locale native-review CSVs, screenshots, accessibility snapshots and hashes are written below `output/i18n-audit/<snapshot-id>/` and `output/playwright/<snapshot-id>/`. `PASS`, `FAIL`, and `NOT_ASSESSABLE` are the only release states; any non-`PASS` target means the site must not claim complete translation.

## Contributing a section

New sections are genuinely welcome — *tool design*, *cost engineering* and *human-in-the-loop design* are already named as gaps in the catalogue. Here's the whole recipe.

**1. Claim a colour.** Three tokens in each of the **three** theme blocks in `app/globals.css` — `:root`, the `prefers-color-scheme: dark` block, **and** `:root[data-theme="dark"]`. All three, or your section goes invisible for anyone who toggled the theme by hand. The handbook's own hues are in the second set of blocks, under the `the handbook` banner comment.

```css
--sage:#4A6B52;  --sage-soft:#E6EEE8;  --sage-line:#A8C4B0;
```

**2. Add a rail entry and a panel** in `lib/handbook/markup.ts` — one `<section class="panel">` that sets `--sec` to your hue. Copy the shape of an existing section: eyebrow → `<h2>` with an emoji → `.rule` → thesis → *(the recall card and deps bar are injected automatically)* → method strip → plain-English box → mechanism flowchart → the interactive → three takeaways.

**3. Register it in the three tables** near the top of `lib/handbook/behaviour.ts`:

```js
SEC.yours    = {n:'09 Your engineering', c:'sage'};
DEPS.yours   = {on:['loop'], un:[], note:'optional cross-cutting note'};
RECALL.yours = {from:'graph', q:'…a question about something they DID…', a:'…the bridge into your section…'};
```

**4. Draw the diagrams** with the engine in `lib/flowchart.ts` — no library, no runtime:

```js
FC.strip($('#stripYours'), [['1 Do this','a subtitle'], /* …4 total… */ ], 'the loop-back caption');

FC.draw($('#fcYours'), {
  viewBox: '0 0 900 400',
  nodes: [{id:'a', type:'start', x:20, y:20, w:200, h:44, lines:['▶ begin'], fs:12}],
  edges: [{from:'a', to:'b', fs:'s', ts:'n', kind:'yes', label:'yes', lx:120, ly:90}]
});
```

`type` is one of `start · proc · model · tool · dec · out · err · idle`. Edges route orthogonally with rounded corners; `fs`/`ts` are the from/to sides (`n·s·e·w`), and `via:[{x,y},…]` overrides the automatic route when you need to steer around a box.

**5. Add a brief to the game** in the `BRIEFS` array, and your discipline to `A` and `ORDER`. Give it a `trap` explaining why the *wrong* answer is tempting — that field does most of the teaching.

**6. Add your rail label to all nine `messages/*.json`** as `hb.yours`, then run `npm run handbook:extract` so your prose joins `messages/handbook/en.json`. Adding a whole section is safe — it is its own container, so nobody else's keys move. Adding a paragraph *inside* an existing section renumbers the text nodes after it in that section, which quietly re-points any translation of them; `npm run handbook:check` fails when the file and the markup have drifted apart.

### Before you open a PR

`npm run build` must pass for every generated route. Run `npm run handbook:check`, `npm run widgets:check`, and `npm run codex:check`; a release also requires `npm run codex:check:release`. `lib/flowchart.ts`, `lib/handbook/behaviour.ts` and `lib/handbook/markup.ts` were ported byte-for-byte from the verified single-file build, and `behaviour.ts` holds 210 DOM queries against the ids in `markup.ts`: fix a real bug in place, in the smallest diff you can, and don't rename an id, reformat, or turn it into JSX. `npm run lint` has pre-existing complaints about those files that are meant to stay.

Then the checks used on every change to the handbook. Open the page and paste them into the browser console:

```js
// 1. no chart has text colliding with a box or spilling its viewBox
// 2. no edge passes through a node it isn't connected to
// 3. every text element clears 4.5:1 contrast in BOTH themes
// 4. the page never scrolls sideways at 390px wide
document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
// 5. every data-goto points at a real panel
[...document.querySelectorAll('[data-goto]')].map(b=>b.dataset.goto)
  .filter(g=>!document.getElementById('p-'+g))            // must be []
```

And the one that catches the most — nothing may be *loaded* from off-site. Links to GitHub are fine; this looks only at `src`:

```bash
grep -rhoE 'src="https?://[^"]*"' out --include='*.html' | sort -u || echo "clean"
```

**House style:** British spelling, sentence case in prose, no rewriting of existing copy just to satisfy a linter. Prefer deleting a widget over adding one — the page has been trimmed once already for exactly that reason.

---

## Publishing your own copy

The live site is a static export on **Vercel** — zero config, it picks up `next build`. Any host that serves a folder will do just as well: `npm run build`, then upload `out/`.

If you fork it, change the canonical domain (`SITE`, in `lib/seo.ts` — one line, and the canonicals, hreflang, og:url, sitemap and robots.txt all follow) and the GitHub links in `components/Shell.tsx`. Note that Vercel uploads the working directory, not the git tree, so `.gitignore` does not protect you there — `.vercelignore` is what keeps `course/`, `legacy/` and anything secret out of the upload.

---

## Licence

[MIT](LICENSE) — use it, fork it, translate it, put it in front of a class. Attribution appreciated but not required.

Built by [HU Dongpin](https://github.com/HUDongpin). Corrections and new sections welcome via [issues](https://github.com/HUDongpin/agent-edu/issues).
