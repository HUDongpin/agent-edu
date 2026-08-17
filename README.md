# aicourse.top — Top AI course

**Learn to build with AI, from first principles — written for people who are new to software engineering.**

Every program is a list of steps. The only question is *who picks them*. Three parts, about four hours, and you finish having built a working agent and an eval suite that scores it.

**▶ [aicourse.top](https://agent-edu-kohl.vercel.app/)** · free · no account · no tracking · nine languages

<img src="assets/logo-lockup.svg" alt="aicourse.top — top AI course" width="252">

| | | Needs |
|---|---|---|
| **1 · [The Handbook](handbook.html)** | eleven illustrated sections, twenty interactive diagrams | nothing |
| **2 · [The Lab](play.html)** | four hands-on stages in the browser — a real API call, the rules wall, your own prompt, **and twenty cases that score it** | a DeepSeek key · ~1¢ |
| **3 · [The Course](course/)** | five more stages — the agent loop, a permission gate, a mandatory reviewer, prompt injection | TypeScript · ~2¢ |

Teaching it? There's a **[90-minute lesson plan](TEACHING.md)**.

---

## Just open it

There is no build step, no `npm install`, no dev server.

```
git clone https://github.com/HUDongpin/agent-edu.git
open agent-edu/index.html
```

It works offline, on a plane, on a locked-down school computer. Nothing is loaded from anywhere else.

**Nothing here is a real AI — by default.** Every "model" reply in the handbook is scripted, so the patterns stay legible and the page can never break because a key expired. The Lab is the exception: give it your own [DeepSeek](https://platform.deepseek.com/api_keys) key and it calls a real model, so you can watch the same question come back different. Your key stays in that browser tab and goes to `api.deepseek.com` and nowhere else.

---

## What's inside

The page is built around one spine: **who decides the next step, at the moment the program runs?**

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
| `app/[locale]/` | home, handbook and lab — 30 prerendered pages, 9 locales |
| `messages/*.json` | every string, one flat file per language. A translator edits one line; no React, no build |
| `lib/flowchart.ts` | the diagram engine, byte-identical to the verified original |
| `lib/handbook/` | the handbook's verified markup and its 22 widget modules |
| `course/` | the nine-stage TypeScript course |
| `legacy/` | the original single-file HTML, and the Python course |

Two things were deliberately **ported, not rewritten**: the flowchart engine and the handbook's widgets. Twenty diagrams were verified for text overlap, edge-through-node crossings and greyscale legibility; rewriting them in React idiom would have risked all of that and shown the reader nothing new. React owns mounting, the verified imperative code owns behaviour.

```bash
npm install && npm run dev
```

## Languages

The interface is fully translated into nine languages, and Arabic flips the whole layout to right-to-left:

English · Español · Français · Deutsch · 简体中文 · 繁體中文 · 日本語 · 한국어 · العربية

Pick one from the 🌐 menu, or link straight to it with `?lang=ar`. Your choice is remembered in the browser.

**The long-form articles in the handbook are still English.** The interface around them is translated; the essays are not, and a banner says so in your language rather than pretending otherwise. Untranslated English keeps `dir="ltr"` inside the Arabic shell, so punctuation and code samples stay the right way round.

Every string lives in [`assets/i18n.js`](assets/i18n.js) — one object per language. To fix a translation, edit one line. To add a language, copy the English block, translate the values, and add one row to `LANGS` (set `dir:"rtl"` if it needs it). The language menu shows each translation's coverage automatically, so a partial contribution is useful rather than embarrassing.

## Contributing a section

New sections are genuinely welcome — *tool design*, *cost engineering* and *human-in-the-loop design* are all obvious gaps. Here's the whole recipe.

**1. Claim a colour.** Add three tokens in each of the three theme blocks near the top of `handbook.html` (`:root`, the `prefers-color-scheme: dark` media block, **and** `:root[data-theme="dark"]` — all three, or your section goes invisible when someone toggles the theme).

```css
--sage:#4A6B52;  --sage-soft:#E6EEE8;  --sage-line:#A8C4B0;
```

**2. Add a rail entry** in `handbook.html` and a `<section class="panel">` that sets `--sec` to your hue. Copy the shape of an existing section: eyebrow → `<h2>` with an emoji → `.rule` → thesis → *(the recall card and deps bar are injected automatically)* → method strip → plain-English box → mechanism flowchart → the interactive → three takeaways.

**3. Register it in the three tables** in the connective-tissue block, so the page can wire it up:

```js
SEC.yours    = {n:'09 Your engineering', c:'sage'};
DEPS.yours   = {on:['loop'], un:[], note:'optional cross-cutting note'};
RECALL.yours = {from:'graph', q:'…a question about something they DID…', a:'…the bridge into your section…'};
```

**4. Draw the diagrams** with the built-in engine — no library, no runtime:

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

### Before you open a PR

These are the checks used on every change to this page. Paste them into the browser console with the page open:

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

And the two that catch the most:

```bash
# the whole script block must parse
node --check <(sed -n '/<script>/,/<\/script>/p' handbook.html | sed '1d;$d')

# nothing may be LOADED from off-site. (<a href> links to GitHub are fine —
# this looks only at script/img/link, and ignores inline data: URIs.)
grep -o 'src="[^"]*"\|<link[^>]*href="[^"]*"' handbook.html | grep -v 'data:\|assets/' || echo "clean"
```

**House style:** British spelling, sentence case in prose, no em-dash-free rewriting of existing copy just to match a linter. Prefer deleting a widget over adding one — the page has been trimmed once already for exactly that reason.

---

## Publishing your own copy

The live link is GitHub Pages serving this repo directly:

1. Keep **`index.html`** in the repo root, so the URL is a clean `/`.
2. **Settings → Pages → Source: Deploy from a branch → `main` → `/ (root)` → Save.**
3. Wait a minute, then visit `https://<your-username>.github.io/<repo>/`.
4. If you fork it, update `og:url`, `og:image`, `twitter:image` and the two footer links in the `<head>` and footer — they point at this repo.

No workflow file and no `.nojekyll` are needed: a plain HTML file at the root is served as-is.

---

## Licence

[MIT](LICENSE) — use it, fork it, translate it, put it in front of a class. Attribution appreciated but not required.

Built by [HU Dongpin](https://github.com/HUDongpin). Corrections and new sections welcome via [issues](https://github.com/HUDongpin/agent-edu/issues).
