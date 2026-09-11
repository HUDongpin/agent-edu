# Improving the course experience

A plan for the learner's experience of aicourse.top, written after reading the
three parts as a learner would meet them. It is scoped to what a reader feels,
not to code quality.

It is now half a record. Twenty-four of the forty findings have shipped, and
each carries a marker naming the commit; §0 is the running total. The findings
are written in the present tense they were found in, so a landed one describes
the defect rather than the fix — the marker underneath says what changed. Ten
remain open, listed in §0 in the order I would still take them.

The short version: **the teaching here is genuinely good, and that is mostly not
where the learners are being lost.** They are lost on the first screen of the
Lab, at the money gate, on the failure paths around a paid run, and at the seams
between the three parts. Most of what follows finishes something this project
already started, and there is more removal in it than addition.

With one exception, and it was the largest single item in this document: a
reader who followed the handbook's own forward button never reached evaluation.
See E1 — the first thing fixed, and three string swaps.

---

## 0 · What has shipped

Thirty-three of the forty findings have landed, each marked in place below with
the commit that carried it. This section is the short version; the markers are
the detail.

**Done.** Both blockers on the paid path (A2, B1) and the one in the free part
of the course (E1, the forward chain that skipped evaluation). The security
widget no longer teaches that a label makes you immune (E2). The Lab opens on a
step that runs (A1), stops the lesson being spendable by accident (B2), gives
"no credit" somewhere to go (B3), and offers a scripted run to a reader who
cannot pay (B8). Part 3's advertised no-key command works (C8), its stand-in
recognises a menu written any way (C9), its report card stops hiding regressions
(C1), and a failing check now says why and where to look (C2, C10). The
handbook's theme button agrees with the site and persists (D1), and hands
forward from every section (D5). The spine has a nav entry, links, action words,
honest filters, a confirmation, an ending, a stated language boundary,
state-aware calls and the scores the record was keeping in silence (D2, D3, D4,
D6, D7, D8, D9, D10). And the seventeen diagram descriptions that were English
in every locale are translated (F1).

**Open — seven of them**, in the order I would still take them. None is a
blocker; the two largest are teaching work rather than engineering.

| | Finding | Why it is still worth doing |
|---|---|---|
| B4 | The prediction is discarded before it is useful | The commitment step exists and is thrown away a moment before it would pay |
| E8 | The worksheet is behind a door marked "for teachers" | Four of its six prompts have no equivalent anywhere a solo learner goes |
| E6 | The handbook's graded capstone is invisible in its own card | D10 did this for the home page; the in-handbook card still reports attendance |
| E5 | The night-shift widget promises variance it does not have | A run counter that changes without meaning anything, two sections after two that meant something |
| B6 | One message answers five problems | A timeout is told to check a connection that is demonstrably up |
| B7 | Switching model reopens the onboarding panel | A free re-test would keep the reader where they are |
| A3 | Policy prose arrives before the first success | Including a paragraph about a button that is not on screen |

**Decisions rather than defects.** The portable record in Phase 5 is real work
nobody has chosen yet. §5 lists what should not be done at all, and E8 above is
the narrow exception §5.3 argues for: mirror four of the worksheet's prompts,
do not move the worksheet.

---

## 1 · How this was checked, and what I got wrong

Every claim carries a path, and the line numbers were opened rather than
inferred. Several of my own opening hypotheses were false, and two of my
corrections were themselves too generous. Recording that saves the next reader
from re-proposing them:

- **"The failure messages need work."** Wrong. There are nine distinct
  `lab.err.*` states, and `components/lab/Fail.tsx:16` gives the no-key case an
  icon and a button rather than a line of monospace. But see B3 — one of the
  nine is a dead end.
- **"The prediction step is only in the teacher's material."** Wrong. The Lab
  asks for it, in nine languages, with a privacy note and an opt-out. But see
  B4 — it then discards the prediction before the score exists, which was most
  of the value.
- **"After the second eval the reader must remember the first number."** Wrong,
  then wrong again the other way. Both integers survive; the twenty rows do not
  (B5), so the reader keeps the score and loses the mechanism.
- **"The decide widget on the home page adds a decision."** Wrong. It is two
  static diagrams and it removes one. The place a decision is genuinely added is
  the catalogue — D4.
- **"The worksheet is repo-only."** Wrong. `teach.work1` to `teach.work6` are on
  `/teach/` in nine languages; `messages/en.json:415` is the prediction item.
  That is placement, not absence, and §5.3 argues against moving it.
- **"The live eval progress and the handbook widgets are probably silent to a
  screen reader."** Wrong. The Lab carries eleven live regions, including
  `aria-atomic` on the result block, and `lib/handbook/behaviour.ts:170` gives
  thirteen output sinks `aria-live` and `aria-atomic`, with the graph log getting
  `aria-relevant` so it reads as additions rather than re-reading itself.
  Announcement of dynamic output is deliberate and thorough.

And one thing I asserted in an earlier draft of this document that is **wrong**,
which is worth more than the rest of the list:

- **"Coverage is complete, do not re-audit i18n."** The key counts are complete —
  408 site keys and 542 handbook keys in each of nine locales. But keys were never
  the whole surface. `lib/handbook/segments.mjs:181` captures only `id` and
  `data-i18n` from an element's attributes, so no attribute value has ever been
  extractable, and 17 long `aria-label` diagram descriptions in the handbook are
  English in every locale. Because the body keys are complete, `localised` stays
  true and nothing flags it. See F1: a blind Arabic reader gets an Arabic page
  whose every illustration is described in English, and the gate reports 100%.

So: coverage of the strings that have keys is complete. Coverage of the strings
that never got keys was never measured, and that is where the gap is.

---

## 2 · The shape of the problem

### The teaching asymmetry

Five teaching moves exist in the Lab and are absent from the local course:

| Teaching move | Lab | Part 3 |
|---|---|---|
| Predict before you measure | `lab.reflection.lede` | absent |
| State the before/after in one sentence | `lab.s4.jump` | the reader compares report-card rows |
| Disclose the cost of *this* action first | `lab.s1.callDisclosure` and its siblings | one paragraph in the course README |
| A forcing function that produces the insight | `lab.s2.ruleLimit` | none |
| A named recovery for every failure | nine `lab.err.*` states | `FAIL`, then exit |

**And the constraint that usually makes changes expensive does not apply to
Part 3.** A user-visible string costs nine translations. `course/` is English
only, carries no `messages/` keys, adds no route, and moves no gate except
`prose:check`. Part 3 is at once where the teaching is thinnest and where a fix
is cheapest. That alignment is unusual and should be spent.

### But the Lab is not therefore healthy

The Lab teaches better than anything else here and still holds the worst items
in this document, all on the path where the learner spends money. Good pedagogy
and a fragile payment path are independent properties, and this project has one
of each.

---

## 3 · Findings

### A · The first screen

#### A1 · The Lab opens on the one step that cannot run — high, small

> **Landed.** A first visit with no saved key now opens on the rules wall.
> A reader who has a key, or a saved draft, is unaffected. The baseline draft
> fingerprint moves with the opening stage, so arriving no longer looks like an
> edit and cannot persist a draft for someone who has typed nothing.

The stage is initialised with `useState(0)` in `components/lab/Lab.tsx`, and the draft restore only overrides it when a saved draft exists — so a first visit
always opens on step 1.

That step is marked `needsKey: true` at `components/lab/Lab.tsx`, while the
free rules-wall step immediately beside it is not.

So the Lab's opening screen is a signup wall for a paid provider account, and
the one exercise that costs nothing — which is also the pedagogically prior
lesson, the wall that motivates everything after it — is a tab away with nothing
inviting the reader into it. The string is already written: `lab.s2.lede` ends by
saying that step talks to no model and costs nothing. You only read it after
clicking.

**Do:** when there is no draft and no saved key, open on the rules wall instead.
Step 2 depends on nothing before it, and step 3 builds directly on its failure,
so the narrative survives. A returning reader is unaffected — their draft still
carries their stage. Zero new strings, zero new routes.

This is the highest-leverage small change in the document.

#### A2 · The learner is asked to fund an account before any price is named — blocker

> **Landed** (`c3671f27`). `lab.callPlan` carries a `{cost}` filled from the same conservative-price path the per-step disclosures use, summed over the three estimates the Lab already derives, so it cannot drift from them or from the dated snapshot. Reads "about $0.05 in total". All four disclosure paragraphs unchanged.

At the moment of deciding whether to open a provider account and put money in
it, the panel stacks four consecutive risk paragraphs — the call plan, the
pricing methodology, the stop-billing note and the key-revocation note — and not
one contains a currency amount. The catalogue card says only "Provider charges
vary". The journey is quantified as 60 paid requests and 16,350 output tokens.

A beginner reads four risk paragraphs with no number as *this could cost
anything*. The honesty is what makes the silence expensive: the reader cannot
tell that the careful disclosure is describing a few cents. Output alone, at the
peak rate in the repo's own table, is about two cents.

**Do:** give the existing `lab.callPlan` key a `{cost}` placeholder and fill it
from the same conservative-price path the per-action disclosures already use —
computed, never typed, so it cannot drift from the dated snapshot. Mirror the
figure onto the catalogue card so it is visible before the click. This changes
an existing line in nine languages rather than adding a key, and leaves all four
disclosure paragraphs exactly as written: the point is not to cut the honesty
but to put the number in front of it, so it reads as precision rather than
warning.

#### A3 · Policy prose arrives before the first success, including a paragraph about a button that is not on screen — medium

Before a beginner reaches any exercise, the Lab shows a hero, roughly 240 words
on storage, spend caps, peak pricing and stopping, then the tabs, then a
persistent aside about local storage. One of those paragraphs explains what Stop
does — and there is no Stop button on the opening screen, nor a path to one
until step 3.

**Do:** keep every word and change only when it arrives. Show the stop
disclosure when a stoppable action is reachable, which is the moment it becomes
true. Put the draft note behind the same expandable pattern the key panel
already uses, leaving the one-line saved status always visible. No new strings,
no new component.

### B · The paid run

#### B1 · One transient error destroys a paid eval and every row already billed — blocker

> **Landed** (`baedd2e2`). The runner returns what finished, densely and in order, on the cancelled and failed outcomes; `results` still appears only on completion, so a partial set can never be read as a score. Rendered in its own block with no meter, kept out of `rows` so the previous score's table stands. 429s are still **not** routed through the content handler.

The eval fires 28 requests at concurrency 4. If one returns a 429 or a 500, or
exceeds the 45-second cap, the run ends and every completed row is discarded.
`lib/lab/runner.ts:194` returns `completedTasks` on the failed and cancelled
outcomes but no results array, so there is nothing for the page to render. The
learner is told the model is busy and to try again — which means paying for all
28 a second time. Pressing Stop does the same.

For a beginner on a new account this is the difference between a course and a
bad experience with a card.

**Do:** return the sparse results on the cancelled and failed outcomes too, and
render those rows with no score recorded. The learner keeps what they paid for
and can see which cases had already failed.

**Do not** fix this by routing 429 and 500 through the content-failure handler.
That would silently turn a rate limit into a false low score, which the existing
`lab.s4.callDisclosure` copy explicitly promises will not happen.

#### B2 · The moment of the whole lesson can be spent by accident on the first click — high, small

> **Landed.** The button is rendered only once a score exists, so the baseline
> run always happens first and the label is true when it appears.

At step 4 the learner sees two enabled buttons: run the eval, and "Add the menu,
then re-run". The second sounds like the helpful one, and it carries
`disabled={busy0 || anyBatchBusy || !sys.trim()}` at `components/lab/Lab.tsx`
— enabled the moment a prompt exists, with no dependency on a completed run.

Press it first and you get a good score with no baseline. On a first run
`setPrev(score)` at `components/lab/Lab.tsx` leaves the previous score null,
so the before/after banner never renders and nothing says the point of the Lab
was just skipped.

**Do:** show that button only once a score exists. One conditional; it removes
an affordance rather than adding one, and makes the button appear exactly when
its label starts making sense.

#### B3 · A green tick, then no credit, and nothing to click — high

> **Landed** (`c3671f27`). `lab.err.noCredit` carries a link to the provider's console — the console itself, not a guessed billing path.

Key verification is a models call, and the code says plainly it never checks
balance — surfaced honestly as "It did not test account balance". So the panel
can read verified for an account that fails on its first paid call. When it
does, `lab.err.noCredit` tells the learner to add credit on the provider's site
and gives no link, while the panel above still says verified.

`components/lab/Fail.tsx:16` already singles out the no-key case for a button.
This is the one remaining failure whose fix genuinely lives on another website,
and the only one the code makes impossible to reach in a click.

**Do:** give it the same treatment — one external link to the billing page.

#### B4 · The prediction is discarded just before it becomes useful — high

The learner predicts a score and says why. `setPrediction` is cleared at
`components/lab/Lab.tsx`, and the score arrives some ninety lines later. The
one thing that makes a number land for someone working alone — *I said 12, I got
11, and I was right about why* — is deleted a moment before it could be shown.

Privacy is not the reason: the prediction is already excluded from the saved
draft and never enters the provider request. Dropping it from React state was
never what made it private.

**Do:** keep the numeric prediction through the run and show it beside the
result. Clearing the visible fields can stay.

#### B5 · Run 1 and run 2 cannot be read against each other — high

> **Landed** (`e8f5aa32`). The previous run's rows are captured before the overwrite and rendered below behind a disclosure, with their own meter carrying their own score.

`setRows(res)` at `components/lab/Lab.tsx` overwrites the whole table, so
after the second run the first run's twenty rows are gone and only two integers
survive. The payoff is supposed to be seeing which cases flipped from an invented
price to the menu price. The learner gets "11 → 18" and takes the mechanism on
faith.

**Do:** keep the previous run's rows and render its meter and table below the
current one. Both blocks already exist and can be reused verbatim; the score in
each meter distinguishes them, so this needs no new copy at all.

#### B6 · One message answers five problems, four of which are not the connection — medium

A genuine timeout and an unreachable provider collapse into one key whose text
tells the learner to check an internet connection they are demonstrably using.
The client already separates the two causes.

**Do:** give the timeout its own message naming the 45-second cap, and make the
network message online-aware — when the browser reports itself online, name the
two things that actually cause this instead of the connection. This compounds
with B1: today one slow request both kills the run and misdescribes why.

#### B7 · Switching model throws the learner back to "open an account" — medium

Changing the model marks the key unverified, and the panel treats unverified as
*not yet set up*, so the whole three-step onboarding block reopens with an empty
password box at the point the Lab has finally earned trust. The re-test is free —
the verifier calls the models endpoint and never touches the billing ledger.

**Do:** on a model change with a key already stored, re-run the existing test
automatically. No new strings.

#### B8 · The no-key path stops immediately before the payoff — high, and a genuine trade-off

> **Landed** (`02b05fb4`). Shipped as a scripted demonstration, framed as one. Every verdict comes from the course's own `offlineOrder` and `offlineJudge`; the note leads with "A scripted run, not a model", gives the stand-in's 0/20 → 12/20 and says a real run starts nearer 7/20. No meter, no jump banner. Offered only when no key is stored.

Only the rules wall works without a key. The other three steps render their full
controls and bounce at the Run click. Someone with no card, on a managed laptop,
or where the provider's billing does not reach, feels the wall and never sees
the answer. The same dead end catches anyone whose key is temporarily unusable.

**Do:** ship one recorded run as static data — the same twenty case ids, the
before-menu and after-menu verdicts — and let a learner with no usable key load
it into the meter and table that already exist. No widget, pure static data,
suits `output: "export"` exactly. Frame it plainly as somebody else's run,
offered only when no key is present, so it never competes with doing it
yourself.

State the trade-off honestly: watching a recording is weaker than running it.
But the alternative for that learner today is the wall with no answer behind it,
and the recording doubles as the fallback for B1 and B3.

### C · Part 3 is not taught to the Lab's standard

#### C1 · The report card hides regressions, and the course teaches the opposite

> **Landed** (`5d0f7729`). `score` keeps its ceiling so existing records still read; `latest` records the run that happened, and the card says "(your best was N/20)" only when an earlier run really went better. The headline compares the two latest values rather than two high-water marks.

The report card records a stage's score with `Math.max`, at
`course/report.ts:66`, under a comment saying scores only ever go up. The
worksheet the same project ships asks the learner to record one improvement and
one regression and not to hide inconvenient cases.

The instrument contradicts the lesson. A learner who changes a prompt, loses two
cases and re-runs sees the old number stand. The single habit the course says
separates people who get good at this from people who keep guessing is the habit
the tool prevents.

**Do:** record best *and* latest, print both when they differ, and say which run
the latest came from. Keep the maximum for the best-ever column; stop letting it
be the only column.

#### C2 · There is no hint layer between failing and being told the answer

> **Landed** (`f9fefb2e`). `bad()` takes an optional pointer and otherwise derives one from the stage being checked, so no call site can forget it.

`course/check.ts:45` is the whole failure path: print `FAIL`, exit. The messages
are specific and good — "scored 14/20, wanted at least 16. Still failing: …" —
but nothing points at the stage README or names the `TODO` that is probably
still empty. The only escalation is `SOLUTIONS.md`, which is the complete
answer. A learner who opens that at stage 3 has ended their own course.

**Do:** give the failure helper an optional second argument — the stage's own
next thing to look at — and thread one per check.

#### C3 · Part 3 never asks the learner to predict

> **Landed** (`9670c943`). Part 3 asks twice, in the two places the worksheet does: stage 3 for the score, stage 4 for which way the menu moves it and by how much. Printed rather than read from stdin, so the command stays pipeable and CI-safe.

`course/stage3-evals/README.md:17` says to write the number down *after* the
score exists. Asking first is the whole difference between a number that lands
and a number that is read.

**Do:** one line in the stage 3 README before the run command, and a prompt in
the check that pauses for a predicted score — free to skip, as the Lab's is.

#### C4 · Stage 9 has a template, a rubric, and no worked example

> **Landed** (`b6193344`). A public library's returns desk, filled into the folder's own template and scored against its own rubric at 11 of 12 — the row it loses is marked and left unresolved rather than tidied away.

At the exact moment the café scaffolding is removed, the worked example that
carried the learner through stages 0 to 8 disappears too. That is the standard
failure mode of transfer tasks, and why most of them do not transfer.

**Do:** one worked stage 9 in a domain that is emphatically not a café, written
to score well but not perfectly, with a retrospective naming what its author got
wrong. English only, no i18n cost.

#### C5 · Part 3's primary button skips the page it was built to be

> **Landed** (`9f4fb7a3`). The setup section gains an id and the hero's primary call points at it, using the already-translated `build.startTitle`; the repository is demoted to secondary.

The home page promises that Part 3 starts with an on-site setup guide and then
opens the course on GitHub. On the build page the first and most prominent
control is the repo link — `className="btn primary"` at
`app/[locale]/build/page.tsx:59` — straight to a tree listing. The setup guide
below it is the best-sequenced first success on the site: clone, make one edit,
run it offline, and here is the exact output you should see. Anyone who does
what the page tells them to do first skips it.

**Do:** give the setup section an id, point the hero's primary button at it
using the already-translated `build.startTitle` as its label, and demote the
GitHub link to the secondary slot. The repo is still linked twice further down.
A fragment is not a route, so `routes:check` does not move.

#### C8 · The advertised no-key command silently runs live, and then tells the learner to use the flag they just used — blocker

> **Landed** (`39fc8677`). The seam reads `npm_config_offline` as well as argv, so the advertised command works; the README writes the `npm run course -- 4 --offline` form beside the npx one and says why the `--` is needed.

`course/README.md` gives the grader two spellings, `npx tsx course/check.ts 0`
and `npm run course 0`, then says to add `--offline` to any command. Compose
those as instructed and you get `npm run course 0 --offline`.

`--offline` is one of npm's own config flags, so npm consumes it and it never
reaches the script. `course/cafe/llm.ts:118` reads `process.argv`, sees nothing,
and runs live. I ran it: the echoed command is `tsx course/check.ts 0`, and the
learner is told the key is not set and that they should "run any stage with
--offline to use the scripted local stand-in".

They did. They will do it again. This is the first grading command on the no-key
path, and it fails for exactly the learner the no-key path exists to serve —
someone who by definition cannot fall back to a key.

**Do:** widen the seam by one clause so the advertised command works —
`process.env.npm_config_offline` carries the flag npm swallowed — and write the
npm form correctly once in the README as `npm run course -- 4 --offline` so the
two spellings agree. Both changes are inside `course/` and English only.

#### C9 · The offline stand-in grades the learner's prose with hidden literal regexes — blocker

> **Landed** (`a9d442fa`). Recognition widened to the menu's content — four drink names beside four prices — with the two literals kept as the fast path. Both literal gates now say when they miss. A menu-less prompt still guesses, because that wrong number is stage 3's lesson.

`course/cafe/offline.ts:59` decides whether stage 4 passes with
`/MENU \(name, small price, large price\)|flat white\s+S \$4\.20/i`. A learner
whose prompt contains the menu, correctly, but typed or formatted their own way,
fails that test — every priced case then comes out wrong, which lands on exactly
8 of 20, below the stage's floor of 16. They are told which twelve cases failed
and nothing about why. Their prompt was fine; the stand-in did not recognise it.

Stage 8 has the same shape in the other direction: whether the defence counts is
decided at `course/cafe/offline.ts:187` by a prose match on four phrasings, so a
learner who writes a good instruction in different words watches the stage's
central lesson silently invert.

Both regexes match the wording of `SOLUTIONS.md`. So the offline path largely
certifies the reference answer rather than the learner's reasoning — and the
course tells the reader this path is a first-class route.

**Do:** do not loosen the patterns into guesswork. Make the miss speak. When the
menu is not recognised, or the label check falls through, print one line saying
the stand-in could not find it, that it matches literally, and that their prompt
may well be correct. That turns a silent misgrade into a diagnosable one and
changes no grading logic. Then say in the stage 4 and stage 8 READMEs that
offline recognition is literal.

#### C10 · The grader computes the reason each case failed, then throws it away

> **Landed** (`f9fefb2e`). Failures carry their reason through to both stage 3 and stage 4. A guessing till now reports "flat white priced 9.99, menu says 5.1" rather than a bare list of ids.

This is C2's cause, and it is worse than a missing hint layer: the information
already exists. `course/cafe/evalset.ts` builds a `why` for every case — strings
naming the wrong price against the menu price — and prints it only when
`verbose` is set. `course/check.ts` calls the runner with verbose off, so the
learner sees twelve case ids and no reasons. Stage 3's README tells them to read
the failures; stage 3 prints none.

**Do:** pass the reasons through on failure. The strings are already written and
already good.

#### C7 · Part 3's first instruction downloads the entire website — 478 MB for a course that imports one package

> **Landed** (`9f4fb7a3`). The build page names the download before the wait starts, and says the course itself imports one package.

The setup guide's first block is a clone followed by `npm ci` at
`app/[locale]/build/page.tsx:88`. That installs 292 packages and about 478 MB —
Next.js, React, Playwright, ESLint, the whole site — because the course
deliberately shares the site's manifest, and the course README says there is
nothing to install in this folder.

Meanwhile every non-relative import across all of `course/` is one package,
`@anthropic-ai/sdk`, plus three node builtins. The learner needs that, `tsx` to
run the files, and nothing else.

So the very first thing Part 3 asks of a beginner — often on a laptop and a
connection the site knows nothing about — is a half-gigabyte download for three
packages' worth of course, with no warning that it will be large or slow, and no
explanation of why.

**Do:** say the number, exactly as A2 says the price. One line above the block:
this installs the whole website, several hundred megabytes, because the course
shares its manifest; the course itself imports one package. That last clause is
worth saying out loud rather than hiding — *the entire agent course depends on
one SDK* is a genuine teaching point, and it is currently buried under 291
packages the learner did not ask for.

If a lighter path is ever wanted, a `course/package.json` naming the three
dependencies would make the folder installable on its own — but it contradicts
the current design and adds a second lockfile to keep in step, so it is a
decision, not an obvious win. Naming the size costs one string and no design
change.

#### C6 · The repo README sends developers looking for Part 3 back out to the website

> **Landed** (`9f4fb7a3`). The Part 3 row links `course/` beside the site page.

`README.md:15` links the Part 3 row to the site. The `course/` directory is named
once more, as plain text in an architecture table. So the shortest path from the
repository to the course inside it is a round trip through the website — for the
audience most likely to arrive on GitHub in the first place, and for whom
`course/README.md` is already an excellent front door.

**Do:** link the Part 3 row at `course/` as well as the site — the site page for
the guided walkthrough, the directory for the code. Two link edits in an
untranslated file.

### D · The spine, the ending, and two bugs

#### D1 · The handbook ships a second theme button that discards the site's saved theme — high

> **Landed** (`498d0c4b`). Seeded from the theme in force, labelled from that seed, persisted under the site's own key, and dispatching an event the site's toggle subscribes to, so the two controls agree while the page is open. Fixed in place; no id renamed, nothing reformatted.

`lib/handbook/behaviour.ts:49` declares the mode list and starts the cycle at
index zero, so the masthead button always reads "auto" regardless of what the
reader chose. Its handler only sets or removes the `data-theme` attribute; it
never writes the key that `components/ThemeToggle.tsx:62` persists and that the
layout re-applies before paint.

So a reader who chose dark on the home page opens the handbook, sees a control
claiming auto, presses it once and flips to light while the site's own toggle
centimetres away does not change — then reloads and the choice is gone.
Switching the theme is one of the first things many readers do, and here it
silently fails on the largest page.

**Do:** this is the sanctioned exception to the frozen-file rule — a real bug,
fixed in place, smallest possible diff. Inside the existing block: seed the index
from the current `data-theme` attribute rather than hard-coding zero, label the
button from that seed, and mirror the site's persistence in a `try`/`catch`. Two
or three lines. No id renamed, nothing reformatted, no message key added, so the
widget checks are untouched. Do **not** remove the button — the markup file's own
header records that dropping it threw and killed every diagram.

#### D2 · "Where you are" is a readout, not a way back in — and it can show 11 of 11 beside an empty circle

> **Landed** (`7a40deb5`). Each row is a link and carries the action word the catalogue was already choosing from the same selector. The eleven-of-eleven case now reads "11/11 sections · Finish".

`app/[locale]/page.tsx:133` is the only place `Progress` is rendered, so a reader
who bookmarks the handbook or arrives from search cannot see it at all. And
nothing in it is a link: a returning learner's most valuable click is *take me
back to where I stopped*, and the section built for that offers three lines of
plain text.

Worse, the tick and the count measure different things. `lib/progress.ts:450`
derives completion from control-room runs, while `lib/progress.ts:451` counts
visited sections — so a reader who has opened all eleven sections but submitted
no brief sees a full count beside an unticked circle, with nothing saying what
remains. That reads as a bug, and it is the moment a nearly-finished learner
decides the tracking is broken.

**Do:** render it at the end of the handbook and the Lab as well; make each label
a link to that course; and show the action word beside it. The catalogue already
solved this — `cat.start`, `cat.resume`, `cat.finish` and `cat.review` exist in
all nine locales, so this adds no string. The handbook already resumes to the
reader's last section on its own, so a plain link genuinely returns them there,
and "finish" tells the 11-of-11 reader that briefs remain.

#### D3 · One unconfirmed click destroys the whole record

> **Landed** (`c9eb0160`, `7a40deb5`). Reset clears the Lab draft alongside the
> learning record, so it no longer leaves a learner's prompt and rules on a
> shared machine, and it asks before erasing anything. The narrower scopes the
> library already supports are still unused, which is now a preference rather
> than a defect.

`components/Progress.tsx:70` calls the reset straight from the click handler, at
the widest scope. There is no account and no server, so nothing restores it, and
the library already supports narrower scopes.

And it is not actually the widest scope. `resetLearningState` touches the
learning keys only; the Lab's draft lives under its own key and is cleared from
exactly one place, the Lab's own clear-draft button. So a learner on a shared or
classroom machine presses the only control that looks like *clear me off this
computer*, walks away, and leaves their prompt, their edited rules and their step
position behind for the next person — the same store the site warns them not to
paste secrets into. Meanwhile the site contradicts itself: the Lab reopens at
step 4 with their work intact while the home widget says "Nothing yet".

**Do:** clear the draft alongside the record, so the label becomes true — two
lines, no new strings. Then confirm before doing it, or offer the narrower scopes
that already exist, or both. If the draft should deliberately survive, that is
defensible, but then it needs saying, which costs nine translations; clearing is
both smaller and more honest.

#### D4 · The catalogue asks four questions to show three courses, and two answers lead nowhere

> **Landed** (`7a40deb5`). Options are derived from the courses that exist, so an option can never match nothing. The constants stay exhaustive for the day a course fills them.

"Browse the curriculum" lands on four dropdowns above four cards. The learner who
came for a recommendation gets a query builder. Worse, `lib/courses.ts:56` still
offers an advanced level and `lib/courses.ts:58` an evaluation topic, and no
course carries either — so a beginner poking at the controls of a four-item list
can reach "no course matches" in one click. Nothing here carries the home page's
"start here" ordering either.

**Do:** in the spirit of preferring to delete a widget — drop the filter bar
until the catalogue outgrows one screen, and keep the course-facts rows that do
the real work of telling a beginner which one is theirs. The filter keys stay in
the message files, unused and ready. If that is too strong, derive each dropdown's
options from the courses that exist, so an option can never match nothing.

#### D5 · The handbook hands forward exactly once

> **Landed** (`e489ec9b`). A band in the wrapper React owns, outside every ported file, so it shows under every section instead of one — including §10, which had no way forward. Reuses `track.2.cta` and `track.3.cta`; changes its first line once the Control Room is finished.

Across all eleven sections, `lib/handbook/markup.ts` contains one link to the Lab
and one to Part 3. The prompt, context and evals sections are each the reading of
something the Lab lets a reader *do* within a minute, and none says so.

**Do:** carefully. That file is frozen, its ids are load-bearing and its prose is
generated, so the answer is almost certainly not to edit it mid-section. Append
at a container end where the content allows, or put the handoff in the shell
around the handbook. If neither is clean, do D2 instead and accept a thin seam —
a bad diff here costs more than the seam does.

#### D6 · The journey ends at a box the learner ticks themselves

> **Landed** (`2b3740de`). Marking Part 3 done now names what the reader built and what it makes them able to do, and points at Stage 9. The line saying nothing was checked stays directly above it.

`build.declareCta` is "I have finished Part 3" and `build.declareBody` says
"Nothing here checks your work." That is the right thing for a site to say about
a course it cannot observe. It is also the last thing that happens after roughly
four hours, and nothing anywhere tells a learner they are done or what they can
now do.

**Do:** after the declaration, say what they have just built in their own terms —
an agent, an eval suite that scores it, a harness, a gate — and name two or three
things they are now equipped to do. Six sentences, nine translations, and it is
the difference between finishing and merely stopping.

#### D7 · Part 3 leaves the translated site for an English-only repo

> **Landed** (`2b3740de`). The build page states the boundary in the reader's language with the reasoning the site already gives for the café's menu, and the teacher's pack says it is English before the click.

The build page sends the reader to the course on GitHub, and `course/**` is
English. For eight of nine locales Part 3 is untranslated — a defensible
decision, and the same one already taken and *explained* for the café's menu and
twenty cases. This one is not explained. It is discovered.

The teacher's printable pack has the same shape. It is linked from the teach
page and correctly marked `hrefLang="en" lang="en"`, so a screen reader announces
the language change — but a sighted Spanish or Arabic teacher reads a page in
their own language, clicks download, and gets English. The markup is right and
the reader-facing signal is missing.

**Do:** say both, in the reader's language, with the reasoning the site already
gives elsewhere. Two strings, nine translations. Do **not** translate `course/`
or the pack.

### E · The handbook's own teaching

The handbook's pedagogy is better than it looks from the markup: a
retrieval-practice card sits at the top of most sections, resume works and
reopens on the reader's last section, and the control room is the best-designed
thing on the site — forced choice among eight approaches, then feedback naming
both why the right answer is right and why the tempting wrong one tempts. The
findings below are about a broken path through good material, not bad material.

#### E1 · Reading straight through skips harness, evaluation and security — blocker

> **Landed.** The chain now runs start → … → graph → harness → evals →
> security → compare → play, expressed as three replacements in the
> `ACCESSIBLE_MARKUP` chain so the ported string stayed byte-stable, with the
> three labels re-translated in all nine locales. `tests/handbook-chain.test.ts`
> walks it and fails if a section is ever skipped again.

Section 00 tells the reader to work straight through, and the primary button at
the foot of each section is how they do it. But `hb.body.p-graph.41` reads
"Next: which one, when →" and points at the comparison section, and
`hb.body.p-harness.34` carries the same label and the same destination. The
comparison section's back button, `hb.body.p-compare.86`, reads "← Graph
engineering".

So the obedient reader goes graph → compare, and never sees harness, evaluation
or security. They then land on a comparison table with three rows for material
they were never shown, and a quiz whose briefs include several whose right answer
is one of the three. The rail still says eight of eleven seen, and nothing names
what is missing.

The section skipped is the one the project's own teaching notes call the moment
of the whole lesson.

**Do:** three destination swaps and three relabels, expressed through the
`.replace()` repair chain that `lib/handbook/markup.ts` already uses for its
existing structural repairs — the sanctioned channel, so no frozen file is
rewritten and no id is renamed. Point graph forward at harness, harness forward
at evaluation, and the comparison section's back button at security. Evaluation →
security and security → comparison are already correct, so the chain closes.

This is the highest-value item in the document and it is a handful of string
swaps.

#### E2 · The security widget teaches the opposite of the section it sits in — high

> **Landed** (`6ae5828e`). Copy only. The verdict now credits the attack it actually stopped rather than the technique, and points at the three defences that exist because a better-written attack gets through.

`lib/handbook/behaviour.ts:1493` decides the outcome with `const fooled=!on.label;`
— a single boolean. Labelling the untrusted text as data makes the model immune
no matter what else is off; turn only that toggle off and it is fooled every
time. The verdict the reader sees says the attack was handled "because the text
arrived labelled as data rather than as orders".

Three paragraphs above, the prose says there is no prompt you can write that
reliably prevents this and the defence is structural. The widget contradicts it,
and the misconception it plants — *label your inputs and injection is solved* —
is one of the more consequential ones in applied agent security.

**Do:** copy only, no logic change. Reword the verdict so the win is attributed
to *this* attack rather than to the technique: the label stopped a clumsy
attempt, a better-written one gets through, and that is what the other three
toggles are for. The widget then reads as an honest worked example instead of a
false general rule.

#### E3 · Nothing in the handbook asks the reader to commit before showing the answer — high

> **Landed** (`9670c943`). Two sentences reworded in place, so no node is created and no ordinal moves. §07 asks for the score before the run; §03 asks the reader to choose their four before reading the badges.

Every widget rewards pressing and shows the result at once, so the reader never
learns whether they would have been right. In the context section the ten items
arrive pre-badged as required, helpful or noise — so the section's own stated
hard part, choosing wrong, has been chosen for them, and ticking is transcription
rather than judgement. In the evaluation section the reader is invited to pick a
change and decide whether they would ship it, with no moment where they say what
they expect.

The Lab does this properly. So a reader meets prediction-before-observation only
if they buy a key.

**Do:** two existing sentences reworded in place — no new nodes, no widget
change. Ask for the number before the run in the evaluation section, and ask the
reader to choose their items before the badges are revealed in the context
section.

#### E4 · The "45 minutes" claim is roughly 40% short — medium

> **Landed** (`9f4fb7a3`). Split rather than inflated — about thirty minutes to read, about an hour to run everything — across the handbook line, the catalogue card in nine languages, and `lib/courses.ts`, which is what the schema.org workload asserts.

The prose alone is about 4,560 words, with eleven diagrams, before a single
button is pressed — and the page's whole method is pressing buttons, plus a
ten-round quiz at the end. A reader who budgets 45 minutes runs out around
section 05, which is exactly where E1 already drops them.

**Do:** split the claim rather than inflating one number — about thirty minutes
to read, about an hour if you run everything. It appears in the track metadata,
in the handbook's own opening line, and in `lib/courses.ts`, which is what the
structured data asserts.

#### E5 · The night-shift widget promises variance it does not have — medium

The reader is invited to send the agent off unattended and watch a night run,
and gets a reliability score, an incident count and a nights-run counter.
Pressing Run again with the same toggles produces a byte-identical result and
increments only the counter — the module has no randomness at all. This lands
immediately after two widgets that trained the reader to read a run counter as
evidence about variability.

**Do:** the same instinct as preferring to delete a widget, applied inside one.
Drop the nights-run meter, which is the only readout on the page that changes
without meaning anything, and reframe the idle prompt as a checklist rather than
a dice roll. The per-part incident lines are genuinely good and do the real
teaching; keep them.

#### E6 · The handbook's own graded capstone is invisible in its progress card — medium

The control room is the only thing the handbook grades and the only score it
stores, and the progress card does not mention it. What does drive the card is
having explored six sections — so skimming registers as progress and the
capstone registers as nothing.

**Do:** add one row to the card's item list, mirroring how the existing Lab row
already reports a best score. The selector already returns both the run count and
the best score, so nothing below changes.

#### E7 · The evaluation widget's "previous" score is frozen — low

> **Landed** (`9f4fb7a3`). The caption moves, not the sum: comparing every change against the baseline is the right arithmetic, so the meter now says so.

The comparison meter always renders the baseline, whatever the reader tried
last, in the section whose entire lesson is that a number means nothing except
next to the number it is compared with.

**Do:** leave the arithmetic alone — comparing every change against the baseline
is the right semantics, because the five changes are alternatives rather than
cumulative. Fix the caption: call it the baseline, which is what it is.

#### E8 · The worksheet is behind a door marked "for teachers" — high

`teach.work1` to `teach.work6` are on `/teach/` in nine languages, and the
handbook links to exactly two URLs: the Lab and Part 3. The nav label tells a
solo learner the page is not for them.

The prediction item is covered by the Lab and by E3, so that is not the gap. The
gap is the other four: attributing a failure to missing instructions versus
missing context versus stochastic output, naming one decision the model may make
and one a person must keep, and transferring both to a domain the reader knows.
Nothing on the learner's path asks for any of those.

**Do:** mirror, do not move — see §5.3. Append a closing block to the handbook
page that reuses the existing keys under a learner-facing heading and links to
the worksheet anchor. Six already-translated strings plus one new heading.

#### D8 · Part 3 is not in the navigation, and nothing in the course points back

> **Landed** (`7a40deb5`). `/build/` joins the nav under `track.3.title`, the key the footer already used for that link.

`components/Shell.tsx` builds the nav from home, courses, handbook, lab and
about, plus the teach link. There is no way to reach `/build/` from the nav on
any page — it appears only in the footer. So the page holding the box that closes
the whole curriculum is one the learner passed through days earlier and can no
longer navigate to.

The other direction is unsignposted too: `course/README.md` links forward to the
handbook and the Lab, and `course/stage9-project/README.md` ends on the rubric.
Neither mentions coming back. The site is explicit that it cannot observe the
course, which makes the learner's return trip the only mechanism there is.

**Do:** add `/build/` to the nav using `track.3.title`, which the footer already
uses for that link and which exists in nine languages; give the declaration
section an id so it can be linked; and add one line to the end of the course and
the stage 9 README pointing at it. No new strings.

#### D9 · The home page speaks to a first-time visitor forever

> **Landed** (`2b3740de`). The track calls read the same selector the catalogue used. The server still renders today's wording, so the static export and crawlers see the first-visit page.

The three track cards are a static array with the primary call and the "start
here" flag hard-coded to Part 1, so they never consult the record. A learner
three days and seven sections in lands on a page identical to the one they saw
first, telling them to start at the top.

The catalogue already solved this — it reads the same store and picks between
start, resume, finish and review, all four of which exist in nine languages.

**Do:** make the track cards state-aware with the selector and strings that
already exist, and move the "start here" flag to the first part that is not
finished. No new keys, and the server-rendered fallback stays exactly today's
wording, so the static export and crawlers are unaffected.

#### D10 · Everything the record knows about *understanding* is stored and never shown

> **Landed** (`2b3740de`). The card shows the Control Room best and the best Eval score beside the counts — numbers the record kept and the interface never displayed.

The store carefully distinguishes attendance from achievement — a control-room
best score, a rules best, whether the suggested eval target was met, how many
evals were run. Almost none of it is displayed anywhere; the one exception is the
Lab's best eval. What the learner is shown instead is how many sections they
opened.

So the record answers "did I understand this?" and the interface reports "did I
look at this?".

**Do:** show the earned number next to the thing it belongs to, reusing the
pattern the Lab's best-score note already establishes. And if a stored field
still has no reader afterwards, delete it — a field nobody displays is a promise
the product is not keeping.

### F · The gap the gate cannot see

#### F1 · Seventeen diagram descriptions are English in every language, and the gate reports 100% — high

> **Landed.** `segments.mjs` now extracts a closed allowlist of reader-facing
> attributes — `aria-label`, `title`, `placeholder` — as a third segment kind,
> keyed `hb.attr.<container>.<nn>` and counted separately so neither ordinal
> renumbers the other. Twenty-six strings, translated into all nine locales;
> every handbook file is now 568 keys. `localised` stays gated on body keys, so
> a future untranslated attribute warns loudly at build time and in
> `handbook:check` without ever forcing Arabic back to LTR.

`lib/handbook/segments.mjs:181` captures `id` and `data-i18n` from an element's
attributes and nothing else. No attribute value has ever been extractable, so
none has ever been translated.

The handbook carries 20 `aria-label` attributes, 17 of them long descriptions of
the illustrations — the scatter plot, the kiosk flowchart, the prompt pipeline,
the decision tree. None appears in any locale file. A blind Arabic reader gets an
Arabic page, an Arabic rail, Arabic widgets, and every illustration in an
illustrated handbook described to them in English.

The reason nobody noticed is the shape of the check: the body keys are complete,
so `localised` stays true, so no English-only note appears, and the count says
542 of 542. The gate is measuring the strings that have keys, and these never had
keys to be missing.

**Do:** `segments.mjs` and `localise.ts` are not on the frozen list, so fix it
there and leave `markup.ts` alone. Add a segment kind for a closed allowlist of
attributes — `aria-label`, `title`, `placeholder` — extract, translate, and
extend the handbook check to count them.

**Sequence this carefully.** If the new keys join the completeness test before
the translations land, every locale flips to `localised` false and Arabic loses
RTL entirely — the exact cliff the house rules warn about. Keep `localised` gated
on body keys until the attribute tables are complete in all nine languages, then
fold them in, in one commit.

---

## 4 · The plan

Five phases. Each names how you would know it worked, given the site has no
backend and collects nothing.

### Phase 0 — Fix the two things that are teaching the wrong lesson

**Items:** E1, E2.

Both are string changes and both are in the free, no-key part of the course that
most readers actually reach. E1 restores the path to the section the project
itself calls the point of the lesson; E2 stops a security widget teaching that a
label makes you immune. Neither is a feature and neither can wait behind a
funnel fix.

**Success signal:** click the primary button from section 00 to the end and
count the sections you pass. It should be eleven, not eight. Worth asserting in
a test, since the chain is data and data drifts.

### Phase 1 — Stop the first screen from being a paywall

**Items:** A1, A2, B2, B3, D1.

Four of these are one-conditional or one-string changes, and together they
address the two places a beginner actually leaves: the opening screen of the Lab,
and the moment they are asked to fund an account. D1 rides along because it is a
real bug on the largest page and the diff is three lines.

**Success signal:** open the Lab in a fresh profile with no key. The first thing
on screen should be something you can complete. Then read the key panel and find
a price without scrolling.

### Phase 2 — Make a paid run survivable

**Items:** B1, B6, then B8 as a separate decision.

B1 is the only substantial engineering in this document, and it is the one that
stops a learner paying twice for the same twenty cases. B8 is deliberately its
own yes-or-no because it is the only item here with a real pedagogical cost.

**Success signal:** run the 28-request eval with the network throttled hard
enough to trip the timeout, and confirm the completed rows are still on screen
afterwards. Worth a case in `test:resilience`, where the repo already keeps this
kind of scenario.

### Phase 3 — Finish what the Lab started

**Items:** B4, B5, B7, A3, E3, E8.

These complete features that already exist rather than adding any. E3 and E8
belong here rather than with the other handbook items because they are the same
move as B4 — giving the reader the commitment step and the reflection prompts the
Lab already has, so that meeting them no longer depends on buying a key.

**Success signal:** a learner who has just run the eval twice can point at a case
that changed and say why. A pilot question, not a metric.

### Phase 4 — Hold Part 3 to the Lab's standard

**Items:** C8, C9, C10, C1, C2, C3, C4, C5, C6, C7.

C8 and C9 come first and are blockers: the advertised no-key command does not
work, and the stand-in it points at grades prose by literal match. Together they
mean the entire no-key route — the one the course offers people who cannot or
should not pay — is broken for anyone who does not reproduce the reference
answer. C10 is C2's cause and should be done in the same pass.

Everything except C5 and C6 is inside `course/`: no strings, no routes, no
translation, no widget, only `prose:check` in the path. C1 should not wait for
the rest — it is about ten lines and it is teaching the wrong habit every day it
stands.

**Success signal:** extend `tests/prose.test.ts` in the spirit of the existing
rules — a check that the report card prints a latest value alongside the best,
and that the failure helper is never called without a pointer. A gate, not a
number written down here.

### Phase 5 — The spine and the ending

**Items:** D3, D8, D9, D2, D4, D6, D7, D10, and D5 only if it can be done without a bad diff.

D3 leads because it is the only privacy defect in the document: the reset button
leaves the learner's own prompt on a shared machine. D8 and D9 are next because
both reuse strings that already exist in nine languages.

The portable record belongs here too, and the framing problem is worth stating
exactly. Every string that mentions where the record lives sells it as a privacy
guarantee: saved in this browser only, no account, nothing sent anywhere, kept in
this browser, noted in this browser only. Not one of them says the other half —
that clearing site data, or opening the course on a second device, ends four
hours of work. The reassurance is true; the warning is simply absent, so the loss
is always discovered rather than expected.

The state is one serialisable object, so copy-out and paste-in needs no server,
and it gives a teacher a way to collect evidence without touching a key or a
student's prompts.

**Success signal:** `docs/release/pilot-protocol.md` already scores navigation
and boundaries as C1, and draft and guided recovery as C4 and C5. Add one
criterion beside them: could the participant say, without help, what they had
finished and what came next?

### Phase 7 — Translate what was never extractable

**Item:** F1.

Last in the list and not least in value — it is here because it is the only item
that needs translator time in nine languages before it can land, so it runs on a
different clock from everything else. Start it early even if it finishes late.

**Success signal:** extend `handbook:check` to count attribute segments the way
it counts body keys, so the gate stops reporting a completeness it never
measured. That check failing on the day the keys land, and passing when the
translations do, is the whole point.

**The one real risk in this document lives here.** Fold the new keys into the
completeness test only once all nine languages are in, or every locale flips to
`localised` false and Arabic loses RTL.

### Phase 6 — The handbook's remaining teaching debt

**Items:** E4, E5, E6, E7.

Four small honesty fixes in the entry course: a time estimate that matches what
the page asks for, a widget that stops promising variance it does not have, a
capstone that appears in the card that claims to say where you are, and a meter
that calls the baseline by its name. None is urgent; together they are the
difference between a handbook that is careful and one that is careful
*everywhere*, which is the standard the rest of this project sets.

E5 and E7 are the two places where the page's own numbers do not mean what a
reader will take them to mean — worth doing before the handbook is taught from
again.

**Success signal:** none of these needs a gate. Read section 06 and section 07
as a sceptical learner and check that every number on screen is a number you
could defend if asked what it measures.

---

## 5 · What I would not do

A plan that only adds is not a plan.

### 5.1 Do not add widgets to the handbook

The house rule is to prefer deleting one, and `lib/handbook/behaviour.ts` holds
210 DOM queries against ids in a frozen markup string. The correct number of new
widgets is zero. Note how much of the list above removes or completes something:
B2 removes a button, B7 removes a panel state, D4 removes a filter bar, and B4
and B5 finish features already built.

### 5.2 Do not add accounts, sync, badges, certificates or a leaderboard

Every one needs a server, and the absence of a server is what lets this site ask
for the reader's own key at all. The static export is not a limitation to work
around here; it is the product's main safety argument and should stay
load-bearing.

### 5.3 Do not *move* the worksheet from `/teach/` — mirror it

My first instinct was to move it onto the learner's path, and my second was to
leave it alone. Both are wrong, and the distinction matters.

Leave it where it is: the teacher's page needs it, and its prediction item is
already better served by the Lab, which asks interactively at the moment it
counts. Duplicating that in a worse medium would be a real loss.

But four of its six prompts have no equivalent anywhere a solo learner goes —
attributing a failure to its source, naming the model's decision and the
person's, and the transfer to a domain they know. Those are the whole point of
the exercise and the majority of readers never see them. Mirror those under a
learner-facing heading, as E8 describes, and link back to the original.

### 5.4 Do not translate `course/`

Nine translations of nine stage READMEs plus `SOLUTIONS.md`, kept in step with
changing code, for a part that already assumes the reader works in
English-language TypeScript tooling. Explain the boundary instead — that is D7,
and it costs one string.

### 5.5 Do not re-audit i18n *key* coverage — but do audit what has no keys

408 and 542 keys, complete in nine locales, and that part is done. I originally
wrote this section as "it is done" full stop, and F1 is what that blind spot was
hiding: a whole class of translatable string that was never extractable, so never
counted, so never missing. The lesson generalises — when a gate reports 100%, the
question worth asking is what it is 100% *of*.

---

## 6 · Open questions for the maintainer

Genuine forks where an outsider should not choose.

1. **Should the stage checker pause for input?** C3 assumes a prompt is
   acceptable in a script people may pipe or run in CI. A printed line that asks
   for a prediction with no read is weaker teaching but keeps the command
   non-interactive. I lean interactive behind a flag.
2. **Is B8 worth its cost?** A recorded run reaches learners who cannot pay at
   all, and weakens the "run it yourself" claim for everyone who can. I lean yes,
   offered only when no key is present. That is a teaching judgement, not an
   engineering one.
3. **Delete the catalogue filters or derive them?** D4 offers both. Deleting is
   more in keeping with the house rules; deriving is less of a decision to
   revisit when the fifth course lands.
4. **Is `hitl` still being built?** `lib/courses.ts:51` shows it as "soon", and
   the catalogue's own comment says an entry earns that only while someone is
   working on it. If nobody is, the reasoning that retired the other two applies.
5. **How much does the handbook seam matter to you?** D5 is the one item where
   the risk to a frozen file may exceed the gain, and that depends on how far you
   trust the extraction round-trip.

---

## 7 · Sequencing, and what it turned out to cost

The original order held. E1 first — three destination swaps restoring the path
to the section this project calls the point of the whole lesson, in the free
part of the course most readers reach. Then E2's reworded verdict, then A1 and
B2, two conditionals that stopped the Lab opening on a paywall and stopped the
lesson being spendable by accident. Then A2 and B3, a string and a link, and D1,
three lines and a real bug. Then B1, the only substantial engineering in the
list.

The shape of that list was the point and it survived contact: the first six
items were copy and conditionals, and they were the six that mattered most.

Two things the doing taught that the reading did not.

**The frozen files were less of an obstacle than they look.** Everything that
touched them went through the sanctioned repair chain or the wrapper React
already owns. Across every commit, `lib/flowchart.ts` is untouched and
`markup.ts` is additions only — the ported string still hashes identically. The
house rule was never the constraint; it was the design.

**The gates paid for themselves, repeatedly, against this document.** Rule 5
caught stale citations here on six separate occasions, twice in a tracked brief
in `docs/course-briefs/`, every time because code moved under prose that still
read perfectly. The `Lab.tsx` citations went stale three times in three
sittings, which is why they are now bare paths while the stable files keep their
line numbers. The widgets ratchet rejected an event name that looked like copy. The
release checker caught an untranslated French string and pointed at the
allowlist meant for it. None of that was friction; each was the defect found
early. The one thing that did go wrong went wrong exactly where no gate was
looking: a test asserting invented enum values, which passes at runtime and only
`npm run typecheck` sees.

The remaining sixteen are in §0. None is a blocker, and the largest of them — a
worked Stage 9, and asking the reader to commit before the answer in both the
handbook and Part 3 — are teaching work rather than engineering.
