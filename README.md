# aicourse.top — Top AI course

**Learn to build with AI, from first principles — written for people who are new to software engineering.**

Every program is a list of steps. The only question is *who picks them*. Three parts, about four hours, and you finish having built a working agent and an eval suite that scores it.

**▶ [aicourse.top](https://aicourse.top)** · free · no account · no ads · anonymous page counts only · nine languages

<img src="public/logo-lockup.svg" alt="aicourse.top — top AI course" width="252">

| | | Needs |
|---|---|---|
| **1 · [The Handbook](https://aicourse.top/en/handbook/)** | eleven illustrated sections, twenty interactive diagrams | nothing |
| **2 · [The Lab](https://aicourse.top/en/lab/)** | four hands-on steps in the browser — a real API call, the rules wall, your own prompt, **and twenty cases that score it** | a DeepSeek key · ~1¢ |
| **3 · [The Course](course/)** | five more stages — the agent loop, a permission gate, a mandatory reviewer, prompt injection | TypeScript · ~2¢ |

All three, and what is still to come, are listed on the [catalogue](https://aicourse.top/en/courses/). Teaching it? There's a **[90-minute lesson plan](TEACHING.md)**.

---

## Run it locally

```bash
npm install && npm run dev
```

`npm run build` type-checks and writes the whole site to `out/` as **50 static pages**. No server, no database, no API route — you can serve `out/` with anything.

**Nothing here is a real AI — by default.** Every "model" reply in the handbook is scripted, so the patterns stay legible and the page can never break because a key expired. The Lab is the exception: give it your own [DeepSeek](https://platform.deepseek.com/api_keys) key and it calls a real model, so you can watch the same question come back different. Your key is held in that one browser tab, erased when you close it, and sent to `api.deepseek.com` and nowhere else. No page loads a script, font or image from another host.

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

So it is now **Next.js 16 / React 19 / TypeScript, exported as static files** (`output: "export"`). No server: the handbook is scripted and the lab talks to the model provider straight from your browser with your own key, so hosting stays free and there is no runtime that can leak anything.

| | |
|---|---|
| `app/[locale]/` | the five pages — home, courses, handbook, lab, about — across 9 locales |
| `messages/*.json` | every string, one flat file per language. A translator edits one line; no React, no build |
| `components/` | the shell React owns: nav, language menu, theme toggle, the Lab |
| `lib/flowchart.ts` | the diagram engine, byte-identical to the verified original |
| `lib/handbook/` | `markup.ts`, the verified handbook markup, and `behaviour.ts`, its 22 widget modules |
| `course/` | the nine-stage TypeScript course |
| `legacy/` | the original single-file HTML, and the Python course |

Bare `/` is a real page rather than a redirect — a static export has no server to redirect with — so it reads your saved choice or your browser's languages and sends you on to `/en/`, `/ar/` and so on. Inside the handbook every section has its own hash: [`/en/handbook/#security`](https://aicourse.top/en/handbook/#security).

Two things were deliberately **ported, not rewritten**: the flowchart engine and the handbook's widgets. Twenty diagrams were verified for text overlap, edge-through-node crossings and greyscale legibility; rewriting them in React idiom would have risked all of that and shown the reader nothing new. React owns mounting, the verified imperative code owns behaviour.

## Languages

The interface is fully translated into nine languages, and Arabic flips the whole layout to right-to-left:

English · Español · Français · Deutsch · 简体中文 · 繁體中文 · 日本語 · 한국어 · العربية

Pick one from the 🌐 menu, or link straight to it — each language is its own URL, so `/ar/handbook/` *is* the Arabic handbook. Your choice is remembered in the browser.

**The long-form articles in the handbook are still English.** The interface around them is translated; the essays are not, and a banner says so in your language rather than pretending otherwise. Untranslated English keeps `dir="ltr"` inside the Arabic shell, so punctuation and code samples stay the right way round.

Every string lives in [`messages/`](messages/) — one flat JSON file per language, the same keys in each. To fix a translation, edit one line. To add a language, copy `en.json`, translate the values, and add a row to `LOCALES` in [`lib/i18n.ts`](lib/i18n.ts) (set `dir:"rtl"` if it needs it). A missing key falls back to English rather than rendering blank, and the menu shows each translation's coverage — so a partial contribution is useful rather than embarrassing.

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

**6. Add your rail label to all nine `messages/*.json`** as `hb.yours`. The article stays English; the rail does not.

### Before you open a PR

`npm run build` must pass and still say 50/50 pages. `lib/flowchart.ts`, `lib/handbook/behaviour.ts` and `lib/handbook/markup.ts` were ported byte-for-byte from the verified single-file build, and `behaviour.ts` holds 210 DOM queries against the ids in `markup.ts`: fix a real bug in place, in the smallest diff you can, and don't rename an id, reformat, or turn it into JSX. `npm run lint` has pre-existing complaints about those files that are meant to stay.

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
