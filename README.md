# aicourse.top — Top AI course

**Learn to build with AI, from first principles — written for people who are new to software engineering.**

Every program is a list of steps. The only question is *who picks them*. Three parts, about four hours, and you finish having built a working agent and an eval suite that scores it.

**▶ [aicourse.top](https://aicourse.top)** · free · no account · no ads · anonymous page counts only · nine languages

<img src="public/logo-lockup.svg" alt="aicourse.top — top AI course" width="252">

| | | Needs |
|---|---|---|
| **1 · [The Handbook](https://aicourse.top/en/handbook/)** | eleven illustrated sections and scripted interactive simulations | nothing · works offline · no key |
| **2 · [The Lab](https://aicourse.top/en/lab/)** | four browser steps — a real DeepSeek call, the rules wall, your own prompt, **and twenty cases that score it** | your DeepSeek key · real Provider charges |
| **3 · [The Course](https://aicourse.top/en/build/)** | nine guided TypeScript stages (0–8), then a Stage 9 transfer project — the agent loop, a permission gate, a mandatory reviewer, prompt injection | TypeScript · DeepSeek / Claude / offline |

All three, and what is still to come, are listed on the [catalogue](https://aicourse.top/en/courses/). Teaching it? There's a **[90-minute lesson plan](TEACHING.md)**.

---

## Run it locally

```bash
npm install && npm run dev
```

`npm run build` type-checks and writes the whole site to `out/` as static files. `npm run routes:check` compares every exported route and recovery artifact with the committed manifest. There is no application server, database or API route; you can serve `out/` with any static host.

**Part 1 is not a real AI.** Every Handbook "model" reply is scripted, so it works offline, needs no key and stays pedagogically reproducible. Part 2 is deliberately different: give the browser Lab your own [DeepSeek](https://platform.deepseek.com/api_keys) key and it makes real calls with real Provider charges. The key is held in session storage for that tab; closing the tab forgets the local copy but does not revoke the Provider-side credential. The site does not intentionally send keys, prompts or replies to analytics. Vercel Analytics is nevertheless a same-origin third-party script and therefore a disclosed trust boundary, not a technical guarantee of isolation.

---

## What's inside

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

So it is now **Next.js 16 / React 19 / TypeScript, exported as static files** (`output: "export"`). The Handbook is scripted and the Lab talks to the fixed Provider endpoint from the browser. The static architecture removes an application backend, but it does not erase browser, hosting, analytics or Provider trust boundaries; those are disclosed and constrained separately.

| | |
|---|---|
| `app/[locale]/` | the localized pages — home, courses, handbook, lab, build and about — across 9 locales |
| `messages/*.json` | every string, one flat file per language. A translator edits one line; no React, no build |
| `messages/handbook/` | the handbook's article prose, extracted from the markup — same idea, one file per language |
| `components/` | the shell React owns: nav, language menu, theme toggle, the Lab |
| `lib/flowchart.ts` | the diagram engine, byte-identical to the verified original |
| `lib/handbook/` | `markup.ts`, the verified handbook markup, and `behaviour.ts`, its 22 widget modules |
| `scripts/` | `extract-handbook.mjs`, which turns the markup's text nodes into `messages/handbook/en.json` |
| `course/` | nine guided TypeScript stages (0–8) plus the Stage 9 transfer project |
| `legacy/` | the original single-file HTML, and the Python course |

Bare `/` is a real page rather than a redirect — a static export has no server to redirect with — so it reads your saved choice or your browser's languages and sends you on to `/en/`, `/ar/` and so on. Inside the handbook every section has its own hash: [`/en/handbook/#security`](https://aicourse.top/en/handbook/#security).

Two things were deliberately **ported, not rewritten**: the flowchart engine and the handbook's widgets. Twenty diagrams were verified for text overlap, edge-through-node crossings and greyscale legibility; rewriting them in React idiom would have risked all of that and shown the reader nothing new. React owns mounting, the verified imperative code owns behaviour.

## Languages

The interface is fully translated into nine languages, and Arabic flips the whole layout to right-to-left:

English · Español · Français · Deutsch · 简体中文 · 繁體中文 · 日本語 · 한국어 · العربية

Pick one from the 🌐 menu, or link straight to it — each language is its own URL, so `/ar/handbook/` *is* the Arabic handbook. Your choice is remembered in the browser.

The Handbook article dictionaries contain all 540 current source keys in every locale. Code, URLs and model identifiers stay left-to-right inside Arabic. Structure checks can prove key, placeholder and markup parity; they do **not** replace the release gate for native-speaker review of meaning, terminology and beginner readability. The authoritative count is printed by `npm run handbook:check`; update this sentence whenever that source contract changes.

`messages/handbook/en.json` holds the 540 current strings of article prose, pulled out of the markup by `npm run handbook:extract`; each sibling locale file supplies the translated values. Substitution happens at build time, so the exported page is localized for a reader, crawler and anyone with JavaScript off. A part-finished contribution may use the English fallback during development, but the nine-language release gate rejects unexplained user-visible fallbacks.

Keys are `hb.body.<nearest ancestor id>.<nth text node>`, and text broken by an `<em>` or a link arrives in pieces: only text is replaced, never the tags around it, which is what keeps the verified markup and its DOM queries intact. Dynamic readouts use the separate `messages/widgets/*.json` dictionaries and are subject to the same zero-unexplained-fallback release gate.

Every string lives in [`messages/`](messages/) — one flat JSON file per language, the same keys in each. To fix a translation, edit one line. To add a language, copy `en.json`, translate the values, and add a row to `LOCALES` in [`lib/i18n.ts`](lib/i18n.ts) (set `dir:"rtl"` if it needs it). A missing key falls back to English rather than rendering blank, and the menu shows each translation's coverage — so a partial contribution is useful rather than embarrassing.

## Contributing a section

New sections are genuinely welcome. Here's the whole recipe.

**Looking for the courses the catalogue does not offer yet?** *Tool design*, *cost engineering* and *human-in-the-loop design* are each specified in [`docs/course-briefs/`](docs/course-briefs/) — scope, outline, the boundary against what the site already teaches, and the four catalogue strings each one needs. They are standalone courses rather than handbook sections, so the recipe below is not the route to them; each brief names its own.

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

`npm run build`, `npm run routes:check` and `npm run handbook:check` must pass. `lib/flowchart.ts`, `lib/handbook/behaviour.ts` and `lib/handbook/markup.ts` were ported from the verified single-file build and contain tightly coupled DOM queries: fix a real bug in place, in the smallest diff you can, and do not rename an id, reformat, or turn the port into JSX as a side effect.

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
