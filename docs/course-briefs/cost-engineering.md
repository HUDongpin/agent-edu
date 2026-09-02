# Cost Engineering — course brief

> **Historical design snapshot.** Preserved from donor commit `2c55e768`
> (2026-08-30). The current release registry has no `cost` course id. This is
> an archived proposal, not an active specification or publication authority;
> revalidate every path, count, provider fact, and shared contract before reuse.

**Status at the donor snapshot:** approved specification, awaiting implementation. Nothing named
`cost` existed in the repository then beyond the catalogue reservation: `lib/courses.ts` carried
`{ id: "cost", href: "#", level: "intermediate", format: "interactive", topic: "evaluation",
minutes: 30, status: "soon", hue: "var(--red)" }`, all nine `messages/*.json` carry
`c.cost.title` and `c.cost.blurb` and none of the four facts, and `components/courses/Cover.tsx`
already held a `cost` motif commented "a falling stack — cost coming down". There was no route,
component, plan module, strings namespace, or test. This document was the
specification that `lib/courses.ts` and `README.md` have each been pointing at.

Repository facts below were read on 2026-08-30 and carry file and line references. Anything the
author cannot re-verify at implementation time should be treated as drifted.

**Historical proposal decision: Cost Engineering would be a standalone catalogue course,
not a twelfth handbook section.** The README's "Contributing a section" recipe builds handbook
panels, and every step of it writes to `lib/handbook/markup.ts`, `lib/handbook/behaviour.ts` or
the `hb.*` key space. Taking that route would move the handbook's denominator from eleven to
twelve and falsify the word "eleven" in `c.handbook.blurb` in nine languages. The catalogue route
is also half paid for already: the id, the hue, the motif and the blurb exist and are translated.

---

## What this course is for

The reader has finished the Lab. They pressed Run, they saw a known subtotal appear under the
button, and they moved on. They now hold a verified key, a prompt they wrote and a score out of
twenty, and no way to answer the only question a bill actually asks: which part of the thing I
built is expensive, and what would it cost me to make it cheaper?

**The site already says the right things about cost. It has never made them operable.** That
distinction is this course's whole reason to exist, and the brief is explicit about it because
the tempting framing — "nobody has explained this" — is false and would lead a contributor to
rewrite sentences that already ship in nine languages. `lab.pricingDisclosure` already explains
how an estimate is built ("Pre-run estimates use peak price, cache misses and the maximum output
caps. Actual totals use returned usage."). `teach.callsBody` already names all four levers
("model, cache, time window and current Provider pricing"). `lab.stopDisclosure` and
`teach.stopBody` already state the unknown-is-not-zero rule. Build's `spend()` readout already
decomposes a bill into buckets, resolves the band and refuses to price unrecognised usage.

What none of them does is put the arithmetic in the reader's hands, on their own returned usage,
with a score beside it. The reader has read that the estimate is conservative; they have never
multiplied it out and set it against a measurement.

The blurb is fixed and it promises two things: "Where the tokens go, and how to cut a bill by ten
times without losing accuracy." The first half is attribution and is not hard. The second half
contains the whole course, because *without losing accuracy* converts an optimisation into a
measurement. Anyone can cut a bill by ten times — send fewer tokens to a smaller model and stop
checking the result. Keeping the score is what costs work, and keeping the score requires pricing
both configurations and scoring both against the same saved set.

So the change in thinking this course is responsible for is this. **A price is not a number; it is
four numbers and a clock** — cache-hit input, cache-miss input, output, and the UTC hour the call
happened in. And a saving is not a saving until an evaluation says the score survived it. A reader
who finishes should be unable to say "we moved to the cheap model and it is fine" without
immediately reaching for a number.

---

## Boundary

### What this course covers

- The decomposition of one call's bill into the four billed buckets in `Usage`, the price band it
  landed in, and the known/unknown distinction `priceUsage` returns as a discriminated union.
- The gap between a pre-run estimate and a measured cost, performed rather than described.
- The four levers, with their ceilings derived from the shipped table rather than asserted.
- The run plan as the unit of spend — calls times output caps times concurrency, decided before
  the button exists rather than discovered afterwards.
- Cost per passing case, as the comparison between two priced, scored runs held on equal terms.

### What it does not cover, because something on this site already does

- **What a token is, and that models are billed by it.** Handbook §09 glossary,
  `hb.body.glossary.01` and `.02`.
- **That a long transcript gets more expensive every turn.** §04, `hb.body.p-loop.32`, and
  `course/stage5-loop/README.md`, which also names compaction as the consequence.
- **That irrelevant context harms the answer as well as the bill.** §03 `p-context` in full.
- **How to run a twenty-case evaluation, and why twelve are rules and eight are judges.** Lab
  step 4 and the header of `lib/cafe/evalset.ts`. This course *uses* that machinery. It must not
  re-render the case table, the pass-rate method or the noise argument.
- **That a one-case difference over twenty cases is noise.** §07 and `w.evals.noise`. This course
  applies the rule to its own verdict; it does not restate the argument.
- **That a cheaper model can be a regression.** `w.evals.change.cheaper` is "💰 switch to a
  cheaper model" and `w.evals.worse` ends "Cheaper is not cheaper if it breaks things — do not
  ship." Cite once; do not spend a section on it. This course's job is to price both sides.
- **How an estimate is constructed, and that it is deliberately conservative.**
  `lab.pricingDisclosure`. This course multiplies it out; it does not re-explain it.
- **The four levers, named.** `teach.callsBody`. This course derives their ceilings; it does not
  introduce them.
- **That a sent request may be billed with cost unknowable.** `lab.stopDisclosure`,
  `teach.stopBody`, and `LabRunOutcome.inFlightAtStop`.
- **A priced, bucketed, band-resolved spend line.** The Build course's `spend()` already prints
  one per stage, over the harder two-vendor union in `course/cafe/pricing.ts`. What step 1 adds is
  the per-call multiplication written out, in a browser, for a reader who has no terminal — and
  the prerequisite here is a finished Lab, not a finished Build, so most readers will not have
  seen it. Say that rather than pretending it does not exist.
- **The cost thread already running through the Control Room.** `w.quiz.brief1`, `brief7`,
  `brief8` and `brief14` traps, and `w.decide.rec.code.body`, each carry a one-line cost
  argument. Inherit them; do not rediscover them as new copy.
- **BYOK, key storage, verification and revocation.** `components/lab/KeyBar.tsx` and
  `lib/byok/key-store.ts` are reused with their existing copy. The course adds no new explanation
  of what an API key is.

### Out of scope entirely

- Hosting, storage and vector-database cost; GPU and self-hosting economics; fine-tuning
  economics; provider contract terms. This is a course about the cost of calls.
- Rate limits and quota management as an operational discipline. `lib/byok/client.ts` has no retry
  loop by design, and a course about backoff would be arguing with it.
- Multi-provider or multi-model comparison. `DEEPSEEK_PRICING` carries two models, one currency
  and one cache-split shape. Widening the table has a release obligation attached:
  `docs/release/provider-canary.md` carries a pricing reconciliation row that a public-source
  precheck alone does not pass.
- Spend across sessions, organisational budgets, chargeback, or any aggregate a second reader
  could see. `output: "export"` forbids the server that would hold them.
- **A budget ceiling presented as a guarantee.** Nothing in this repository compares accumulated
  `knownUsd` against a limit and refuses to dispatch, and `inFlightAtStop` documents that at most
  four dispatched requests can have billing that is never knowable. This course may teach the
  shape of a ceiling and may build a pre-flight refusal. It may not claim that a ceiling holds.
- Correcting the two invented prices inside `lib/handbook/behaviour.ts` — the agent-loop token
  formula and `PRICE=3/1e6`. That file is under the do-not-rewrite rule. The tension is real and
  is handed to Open questions rather than resolved here.

---

## Who it is for

A reader who has finished the Lab, and only that reader.

The shipped metadata says `intermediate`, not `advanced` — `tools` is the only advanced entry in
the catalogue. That level is right and this brief keeps it, but it needs saying plainly what it
means on a site whose audience is people new to software engineering. It does not mean
TypeScript. **The reader writes no code in this course**; they read numbers and press buttons,
exactly as in the Lab. What `intermediate` means here is that three things are assumed rather
than taught: a verified key in the key bar, one completed twenty-case evaluation with a score the
reader remembers, and the §09 glossary definition of a token.

A reader who arrives without a completed evaluation has nothing to compare against, and step 3
becomes theatre for them. The prerequisite string says so.

The one demand this course makes that the Lab does not is arithmetic. The reader has to be
willing to divide one number by another and say what the ratio means. That is the intellectual
content of step 2, and it is deliberately not hidden behind a widget that announces the answer.

**On the shipped 30 minutes: it becomes 35, and that is a one-line edit.** `minutes` is a number
in `lib/courses.ts`; the only translated part is the unit, `cat.minutes` = "min", so there is no
locale cost and the JSON-LD `courseWorkload` follows automatically. Fifty-seven paid calls at
concurrency 4 plus one free calculator step does not fit in 30 minutes, and the Lab is 40 minutes
for 60 calls. Set the honest figure rather than trimming the course to protect a number nobody
has published yet.

---

## Outline

**Three steps**, in the shape of `components/lab/Stages.tsx`: a tab strip that declares for each
step whether it spends money. Step ids, which would also be the progress ids if tracking is ever
added: `one-call`, `plan`, `ab-eval`.

The earlier draft of this brief had four, splitting the rate calculator from the call plan. They
are the two factors of one product — a bill is the plan times the rates — and two free
back-to-back calculator steps in a short course sit against "prefer deleting a widget over adding
one". Merging them is also what makes the running time honest.

**1 · What one call actually costs** — needs key, 1 request, 250-token output cap.

The reader sends one call and the page takes the response apart. **The call is a repeat of Lab
step 1 and the copy should say so; the reading is what is new.** Not a total: the four buckets
from `Usage` (`promptTokens`, `promptCacheHitTokens`, `promptCacheMissTokens`,
`completionTokens`), the band `priceBandAt` assigned from the provider's own `created` timestamp,
the three rates that band selected, and the multiplication written out in full to five decimals.
Those four buckets exist in `BillingSnapshot.usage` and **have never been rendered to anyone** —
the ledger sums them and the Lab prints only dispatched calls and a subtotal. That is the delta
this step exists for.

The reader is asked to write down which of the four terms dominates their own call. For most
single calls it is output, and that answer determines what step 2 means for them.

The step also shows the unknown path deliberately, whether or not the reader hits it: when the
provider omits usage, `priceUsage` returns `{ known: false, usd: null, reason: "missing-usage" }`,
and when the hit/miss split does not sum to `prompt_tokens`, `usageFromResponse` charges the whole
prompt as a miss. Both are visible states in the readout, described in copy, never rendered as
`$0.00000`.

**2 · The plan times the rates** — no key, no network, no cost.

One calculator, two halves. The right half is the rate table: model, band, cache-hit share of the
prompt, and the two token counts. The left half is the plan: calls, output caps, concurrency. One
output, a bill, and the ratio against wherever the reader started. One widget, one diagram — a
stacked bar of the four buckets that redraws as any input moves.

The teaching is in the ceilings, and every one is arithmetic on the shipped table, so the reader
can check them:

- Pro over Flash is exactly 3× on cache-miss input and on output, within either band.
- Peak over off-peak is exactly 2× on every bucket of both models.
- A cache miss is 31.43× a cache hit on Flash, and 30× on Pro.
- The widest input spread in the table — Pro at peak, all misses, against Flash off-peak, all
  hits — is 188.57×. The widest output spread is 6×.

The conclusion is derived by the reader rather than announced: **if the bill is mostly output,
configuration alone cannot reach ten times.** The remaining factor has to come from generating
fewer tokens. If the bill is mostly input, ten times is comfortably available and the lever is the
shape of the prompt, not the choice of model. This is where the blurb's "ten times" gets paid for
honestly instead of asserted.

**The clock is a lever the reader can pull, and the earlier draft was wrong to say otherwise.**
`priceBandAt` reads the UTC hour of the call's own timestamp and the ledger prices each call at
`result.createdAt`. Peak is 01:00–04:00 and 06:00–10:00 UTC, so **fifteen of the twenty-four hours
are off-peak**, and a reader who runs step 3 outside those windows pays half. It is pulled with a
clock rather than a config, which is exactly why it is worth teaching — and it is why the cost
record must carry the band each run landed in. Two runs in different bands are not comparable, and
a record that omits the band cannot be read six weeks later. Note also that `conservativePrice`
always quotes peak, so an off-peak run lands well under the disclosure that preceded it.

The plan half uses `lib/lab/plans.ts` as its worked example — `1 + 3 + 28 + 28`, a 60-call journey
with a 16,350-token output ceiling — and then builds this course's own. **The reader's inputs
drive a displayed ceiling only and never the dispatch.** Editable: judge count, per-call output
caps, number of runs. Say that in one sentence so nobody expects the widget to change what step 3
sends.

Two trades are priced here, and **neither is performed**:

- *Converting a judged case into a rule case.* `lib/cafe/evalset.ts` says in its header to "use a
  rule wherever you possibly can", which is a cost argument written into an evaluation file and
  never once priced. Converting one judged case removes one call from every future run of that
  suite, permanently, at no accuracy cost when the rule is exact. **The course prices it and
  refuses to perform it**, because `lib/cafe/evalset.ts` is one source of truth for three surfaces
  — this course, the Lab and the Build course — and the eight-judge shape is additionally pinned
  by a plan assertion and by required teacher-pack text. Seven of the eight judged standards
  reduce to "needs_confirmation must be true", which `named()` cannot express in any case. The
  refusal is the teaching.
- *Cutting the case set.* The cheapest cut on the table — dropping the eight judged cases removes
  29% of the calls immediately — and §07 has already proved it is the one cut that cannot be made,
  because the judged cases are precisely where correctness is a judgement, which is where a
  cheaper model degrades first.

The step ends with the reader having refused two savings and being able to say why. That refusal
is a required field in the artifact.

**The judge figure in this step is an estimate, and must be labelled as an upper bound.** There is
no measured judge cost available yet: the ledger keeps no generator/judge breakdown and the
reader's Lab session left nothing behind. Build it the way `Lab.tsx` builds a conservative
estimate, say so in the copy, and require step 3's record to overwrite it with the measured
number.

**3 · Cut the bill, then prove you did not break it** — needs key, up to 56 requests.

Two complete twenty-case evaluations against the same set, each reporting its own cost and its own
score. The verdict does three things in a fixed order: it states the score difference and applies
the noise rule *first*, it states the measured cost of each run, and only then does it divide. A
saving is not announced before the score is settled.

**The configuration is an explicit tuple the record carries: generator model, generator output
cap, system prompt. The judge model and `EVAL_PLAN.judgeMaxOutputTokens` are pinned across both
runs.** This matters more than it looks. The judge call passes the same selected model as the
generator, so a Pro-to-Flash saving would silently replace the instrument that scores 8 of the 20
cases, and "cheaper and no worse" would rest on two scores measured with two different judges —
which is not a comparison the noise rule covers.

**Therefore the cheap configuration is a prompt-shape change, not a model change.** This settles
three problems at once: the judge stays fixed; step 2's own conclusion already points at prompt
shape whenever the bill is input-dominated; and the two runs can genuinely be back to back.
Changing the model in `KeyBar.tsx` calls `markKeyUnverified()` and `paidKeyProblem()` then refuses
any paid run whose status is not `verified`, so a model swap would force a `GET /models`
re-verification into the middle of the course's central comparison.

Because `billingSnapshot()` yields one summed figure per run with no per-role split, **price each
`CallResult` at the call site with `priceUsage` and accumulate per role.** The verdict needs
generator and judge spend separately.

**Equal terms is a first-class requirement, not a footnote.** The second run's prompt prefix is
warm, and `usageFromResponse` reads `prompt_cache_hit_tokens` into a bucket priced at 1/31.43 of a
miss on Flash. Whatever share of run B arrives as hits is a saving with no relation to the
configuration change, and it can be the largest single term in the ratio the course exists to
teach. The house register forbids exactly this — "Do not compare a warm after-build against a cold
before-build". So: **run order is a recorded field, each run prints its cache-hit share of prompt
tokens beside its cost, and the verdict may not claim a saving when the two shares differ.**

Six outcomes, all of them completions:

1. cheaper and no worse;
2. cheaper and worse;
3. no cheaper;
4. unknown — a run with an unknown-billing call has no cost and must say so rather than report a
   partial subtotal as a total;
5. **not priced on equal terms** — the cache-hit shares differ enough that the ratio is not
   attributable to the configuration;
6. **incomplete** — any `ProviderError` that is not a content failure (a 429, a 402, a dropped
   connection) sets `status = "failed"`, aborts the remaining tasks and returns `inFlightAtStop` up
   to four. A run that dies at case fourteen has spent real money on fourteen generator calls and
   produced no score. In a course about cost, the abandoned half-run is the most expensive state to
   leave unspecified. Dispatched calls and known spend are recorded; no score is; the record says
   the comparison did not happen. **A stopped or failed run is never a baseline.**

Journey totals: **1 + 28 + 28 = 57 calls and 15,450 capped output tokens**, against the Lab's 60
and 16,350. The comparison worth printing in the call-plan disclosure is the model-independent
one: **fewer calls and a lower output ceiling than the Lab, at the same model.** Keep the dollar
claim out of it — a Pro baseline here against a Flash Lab journey costs three times more on
output, so the absolute figure is not a fact about this course.

---

## The artifact

A **cost record**: one dated, copyable block, in the register of `docs/release/evidence/`, that the
reader could paste into a pull request or hand to whoever asked why the bill changed.

It carries:

- the price snapshot date and source URL, both read from `DEEPSEEK_PRICING` rather than typed;
- the two configurations compared, as the named tuple — generator model, output cap, system prompt
  — plus the pinned judge model;
- per run — dispatched calls, usage-confirmed calls, the four token buckets, generator and judge
  spend separately, known USD to five decimals, the price band, the cache-hit share of prompt
  tokens, the run's order in the pair, and whether any call had unknown billing;
- per run — score out of twenty and the ids of the failing cases;
- the levers applied, and at least one lever refused with its reason.

It never carries the key, a prompt, or a model reply. Only counts, case ids, prices and scores.
Storage follows the precedent set by `lib/lab/draft.ts`: a versioned key (`ae.cost.record.v1`),
explicit length caps, a decoder that rejects unknown fields, and a test asserting that keys and
replies cannot enter it — the same shape as `tests/lab-draft.test.ts`.

The reason it is a record and not a score is the reason `DEEPSEEK_PRICING.checkedAt` exists. A cost
figure with no price date is unusable six weeks later. That date is already pinned by three test
files and bound to release evidence by the canary. The artifact inherits that discipline rather
than inventing a weaker one.

---

## Evidence of completion

**What counts:** both evaluations completed on the same twenty-case set, each with a known cost and
a score, held on equal terms, plus a saved cost record naming at least one lever refused.

**What does not count.** Opening all three steps. Pressing Run in step 1 — that is one call and one
number. Moving the calculator in step 2 costs nothing and proves nothing, by design. An estimate is
not a measurement: `conservativePrice` returns `known: true` because its arithmetic is certain, not
because the money was spent, and a record built from estimates is a plan, not evidence. A single
cheap run with no baseline is one number and not a comparison, and must not be recorded as a
saving.

A candidate configuration that scored *worse* is a complete result. So is one that came back "not
priced on equal terms". The record should say so, and completion does not depend on the direction
of either number. This follows `c.lab.evidence` exactly: a complete evaluation is recorded at any
score.

At ship, this course is **untracked**. `selectCourseProgress` in `lib/progress.ts` returns
`{ kind: "untracked", action: "unavailable", percent: null }` for any id that is not `handbook`,
`lab` or `build`, and `tests/progress.test.ts:478` pins that behaviour by name. `Catalog.tsx` will
therefore render no progress bar and a plain `cat.start` label — and, in that branch, no arrow
beside it. That is the correct first state and this brief recommends shipping in it: the reader's
own record is the evidence, and the site claims nothing about them. Adding tracking later is a
separate, larger change — a branch in `selectCourseProgress`, a widened `CourseProgress` union, new
state under the versioned learning key, and a migration.

---

## Catalogue facts

These render only once `status` flips to `available`: `Catalog.tsx` builds the
`<dl className="course-facts">` block under `{!soon && …}`. The four values, the `status` flip and
the `href` change from `"#"` to `"/cost/"` land in the same commit — nine files, thirty-six values.
Flipping to `available` also publishes a `schema.org/Course` node in the `ItemList` in
`app/[locale]/courses/page.tsx`, so the course becomes a claim to crawlers in the same commit it
becomes clickable.

| Key | English value | Words | Chars |
|---|---|---:|---:|
| `c.cost.prerequisite` | A low-credit DeepSeek key and a finished Lab evaluation; one step is local. | 13 | 76 |
| `c.cost.outcome` | Cut the cost of a run without losing the score that proves it works. | 14 | 68 |
| `c.cost.artifact` | A dated cost record: two priced runs, their eval scores, and what changed. | 13 | 74 |
| `c.cost.evidence` | Completion needs two priced, scored runs; a cheaper run alone is not evidence. | 13 | 78 |

All four sit inside the band the nine shipped values occupy (10–15 words, 61–86 characters). The
outcome opens with a verb and names a capability. The evidence line carries the required negation.
No idiom, no assembled fragments, no placeholder — every one is a single sentence a translator can
rewrite without seeing the page.

---

## What this course reuses

**Reusable as-is, by path, with no change.**

- `lib/byok/client.ts`, `types.ts`, `json.ts`, `key-store.ts`, `key-verifier.ts`, `ledger.ts`.
  Bounded requests, no retry, typed errors, key redaction, the five-counter ledger.
- `lib/byok/pricing.ts` in full. For this course the module is not a dependency, it is the
  syllabus: `priceBandAt`, `ratesForModel`, `priceUsage`, `conservativePrice`,
  `conservativePromptTokenUpperBound`, and the `{ known: false, usd: null }` rule that refuses to
  present an unknown charge as zero.
- `lib/lab/runner.ts` verbatim. It is written against `ProviderError` and a task interface with no
  Lab or café knowledge in it, and it already provides the one-active-run guarantee, the
  `checkpoint()` that stops a second billable call, and `inFlightAtStop`.
- `components/lab/Stages.tsx` and `components/Rich.tsx`.
- `lib/deepseek.ts` as the facade, including `errorKey()` and its ten-code mapping.
- `lib/cafe/evalset.ts` and `lib/cafe/menu.ts` — the same twenty cases, twelve rules and eight
  judges. One source of truth is the reason the numbers are comparable: a reader's score in this
  course must mean what their Lab score meant.
- `--red`. Already defined in all three theme blocks of `app/globals.css`. This course claims no
  new colour.

**Reusable, but with a named string change — not "as-is".**

- **`components/lab/KeyBar.tsx`.** It reads 28 message keys, 27 of them `lab.*`. The call-plan line
  is the problem: `lab.callPlan` interpolates only `{calls}` and `{tokens}`, and the structure
  `(1 + 3 + 28 + 28)` is **literal prose inside the translated message in all nine languages**,
  alongside a sentence about the Lab's extra evaluations. Re-pointing an import cannot fix this —
  `RECOMMENDED_LAB_JOURNEY.callStructure` is defined at `lib/lab/plans.ts:35` and referenced
  nowhere in the repository. Reused unchanged on a 1 + 28 + 28 course, KeyBar prints a wrong call
  structure in nine languages while the placeholders interpolate correctly: exactly the
  prose-versus-placeholder gap Open question 1 worries about, present before a single new key is
  written. **Decision: give KeyBar a `plan` prop and a caller-chosen copy key, and add a
  `cost.callPlan` whose structure is interpolated as `{structure}`.** That is a change to a Lab
  component and it touches all nine files.
- **`components/lab/Fail.tsx`.** It hard-codes `msgKey === "lab.err.noKey"` and `href="#labkey"`.
  The new page must either supply that anchor id or the component must take both as props. The
  `lab.*` keys KeyBar and Fail render, and the `#labkey` anchor, belong in the string budget.
- **The disclosure register** — `lab.pricingDisclosure`, `lab.stopDisclosure`,
  `lab.forgetDisclosure`. Reusable prose scaffolding, and the new copy should read as though
  written by the same hand.

**What genuinely must be built.**

- **`lib/cost/plans.ts`** and its drift guard. `lib/lab/plans.ts` is café-and-Lab-shaped: the
  pattern transfers, the constants do not. The guard is modelled on `assertEvalShape`, comparing
  `CASES` against the plan at module scope so that a twenty-first case breaks the build rather than
  quietly overspending. **It must derive the judge count from `CASES` rather than pin 8**, because
  `assertEvalShape` already permits fewer judged cases. This is maintainer machinery, not a beat in
  a lesson.
- **Per-run, per-role cost attribution.** `createBillingLedger` is cumulative and session-scoped.
  `billingSnapshot()` is the reader the Lab renders — not the only reader: the facade also exports
  `billingSnapshotOnServer` so the same component can render before hydration, and the new course
  inherits that requirement too. A per-run cost is a snapshot delta taken either side of a run, and
  it is only correct because the runner permits one active run at a time. That dependency must be
  stated in a comment at the call site, because it is not obvious and it is the thing that would
  silently break. The generator/judge split cannot come from the ledger at all and must be
  accumulated at the call site.
- **The record schema, decoder and test**, following `lib/lab/draft.ts`.
- **The calculator component** and the four-bucket bar. New CSS uses logical properties only.
- **The route — four files, not two.** `app/[locale]/cost/page.tsx`; `"cost"` added to
  `localizedPaths` in `config/route-manifest.json`; **`PAGES` in `lib/seo.ts`**, a closed `as const`
  tuple whose derived `Page` union types `urlFor()` and `alternatesFor()` — without an entry there
  the page gets no sitemap row and no hreflang alternates, and `urlFor(locale, "cost/")` will not
  typecheck; and **`tests/ci-foundation.test.ts:39`**, which pins `expanded.publicRoutes.length` to
  66 and turns `npm test` red the moment the manifest gains nine routes. The current build emits 68
  pages, so this course takes it to 77. CLAUDE.md's "must pass and still emit 50 pages" line is
  already wrong — 50 predates `build/` and `teach/` — and is corrected in the same commit rather
  than incremented.
- **The catalogue entry**, flipped to `status: "available"` with `href: "/cost/"` and
  `minutes: 35`.
- **Strings.** The Lab carries 127 `lab.*` keys. A comparable `cost.*` namespace is on the order of
  a thousand translated values across nine files, on top of the 36 for the four facts. Every
  `messages/*.json` currently holds exactly 406 keys with zero drift; that property is the one this
  course is most likely to break.

---

## Open questions

Two questions the earlier draft left open are closed above: the running time becomes 35 minutes
(one line, no locale cost), and the step-4 baseline is a prompt-shape change against a pinned
model. What remains is genuinely open.

1. **Which string space?** The Lab's keys live in top-level `messages/*.json` and are reached
   through `useI18n().t` and `Rich`. But `npm run widgets:check` reads only `behaviour.ts`,
   `markup.ts` and `messages/widgets/`, so nothing fails a build when a key is added to English
   alone. A course whose whole subject is numbers rendered into sentences is unusually exposed to a
   placeholder mismatch. Accept the gap as the Lab does, or write the sibling checker for
   `messages/*.json`? The Human in the Loop brief decides to widen the checker for its own strings;
   these two decisions should be made together.

2. **What happens to the invented prices in `lib/handbook/behaviour.ts`** — the loop cost formula
   and `PRICE=3/1e6`? Shipping a course about real prices beside a "$3 per million tokens, roughly"
   fiction is a defect a reader can find. Correcting it is a smallest-possible-diff exercise in a
   do-not-rewrite file with `widgets:check` as the proof, and it is not this course's change to
   make unilaterally.

3. **Does the cache lever stay arithmetic, or become an observation?** Nothing in this repository
   writes `cache_control`; the hit/miss split arrives from the provider and `usageFromResponse` only
   trusts it when hit plus miss equals `prompt_tokens`. So the reader cannot be told how to *cause*
   a cache hit. Either the 31.43× stays in step 2 as a ratio they cannot reproduce, or step 3
   reports observed cache-hit tokens across twenty-eight same-prefix calls and treats "none
   appeared" as a valid, recordable result. The second is more honest and more expensive — and note
   that step 3 now records the cache-hit share regardless, for the equal-terms rule, so the data is
   already there.

---

## Honest limits

This course will not make the reader able to forecast a bill. Everything it measures is either a
ceiling or a past fact. `conservativePrice` is an upper bound built from peak rates, all-miss input
and unspent output caps; `priceUsage` describes calls that have already happened. Neither is a
prediction, and the copy must never let one read as one.

Prices date, and this one is dated on purpose. `checkedAt` is `2026-08-21`, pinned by three tests
and bound to a release canary row. Every absolute dollar figure written into course prose becomes a
maintenance liability the day the snapshot moves. **Prefer ratios in the copy:** 3×, 2×, 31.43×
survive a table that scales; a five-decimal dollar figure does not.

One provider, two models, one currency, one cache-split shape. This is not a model-selection course
and cannot be turned into one without widening the table, and the table cannot be widened without
the canary.

Twenty cases cannot detect a small accuracy loss. A cheap configuration that costs one case is
statistically indistinguishable from one that costs nothing, and §07 already says how many cases it
would take to know. The course inherits that limit and states it in the verdict rather than routing
around it.

The bench is not production. §07 draws that line and this course stays behind it: a saving measured
over twenty café orders is evidence about twenty café orders. Nothing here observes a running
system, and `output: "export"` guarantees nothing here ever will.

**The measurement costs money, and for a small enough system it costs more than the saving.**
Fifty-seven calls to prove that a configuration change saves a fraction of a cent per request is
only worth it because the reader is learning to do it, not because the saving pays for it. A course
about cost that does not say that about itself has not understood its own subject.
