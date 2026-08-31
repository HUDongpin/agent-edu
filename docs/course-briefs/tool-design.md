# Tool Design — course brief

> **Historical design snapshot.** Preserved from donor commit `2c55e768`
> (2026-08-30). The current release registry has no `tools` course id. This is
> an archived proposal, not an active specification or publication authority;
> revalidate every path, count, provider fact, and shared contract before reuse.

**Status at the donor snapshot:** approved specification, awaiting implementation. No code
existed. `lib/courses.ts` still carried `href: "#"` and `status: "soon"`;
`messages/*.json` carried `c.tools.title` and `c.tools.blurb` in all nine locales and nothing
else; there was no `course/tools/` directory. This document was the missing proposal behind the
old README/catalogue loop.

Repository facts below were read on 2026-08-30 and carry file and line references. Anything the
author cannot re-verify at implementation time should be treated as drifted.

The historical proposal froze 60 minutes, format `code`, topic `agents`, level `advanced`, hue
`var(--gold-mark)`, and the shipped blurb — *"What makes a tool a model can actually use, and why
most tool descriptions fail."* The blurb is already translated into nine languages and is a
promise this brief is written to keep.

---

## What this course is for

The reader arrives having finished Part 3. They can write an agent loop by hand, they know a tool
is a JSON schema plus a function, and they have a permission gate sitting in their tool runner
that a model cannot argue with. What they have never done is ask whether the model could work out
*which* tool to call, or build arguments worth executing, or use what came back. Part 3 hands
them four tools that already work.

**And it hands them the standard, too.** `course/cafe/tools.ts` says above `SCHEMAS`:
"Descriptions do real work here: be specific about *when* to call a tool, not just what it does."
It then demonstrates that four times — "Call this first when asked about restocking — you cannot
know what is short without it", "Needed to work out how long current stock will last", "This
spends real money and cannot be undone", "Use it to report what you did once the ordering is
done" — and even carries a per-argument description. A reader who finished Part 3 has read all of
it and accepted it.

So this course does not teach the what-versus-when distinction. **It teaches that the distinction
can be measured, and then measures it.** Today the reader has opinions about tool wording, because
opinions are all anyone has without a number. `course/README.md` already makes the argument in its
own domain — once you have a number, every later change is a measurement instead of an argument —
and applies it to order-taking only. `TakeOrder` in `course/cafe/evalset.ts:72` is
`(said: string) => Promise<Order>`; nothing in this repository scores which tool was called, or
with what. That absence is the gap.

The change this course is responsible for is narrow and specific: **a tool definition is an
interface, its user is the model, and it can be measured.**

There is a second reason the ground is worth covering, and the handbook supplies it.
`w.harness.part.gate.fail` reads: "It read the unit as kilograms and ordered 1,000 kg of beans —
$41,200 — and nobody was asked." The handbook attributes that failure to the missing permission
gate, correctly. It has an earlier cause the handbook does not mention: a schema in which `qty` is
an unbounded number and the unit is something the model was left to infer. The gate is the last
defence. This course is about the failure that never reaches it.

---

## Boundary

This is the most important section of the brief, and a contributor should read it before writing a
line.

### What this course covers

Four properties of a tool *definition* rather than of the code that executes a call: the
description the model reads, the input schema it fills in, the result string it reads back, and the
shape of the tool set as a whole. Plus the one thing that makes the other four teachable — a case
set that scores tool selection and argument construction, so a wording change produces a number.

### What it does not cover, because the site already does

| Already taught | Where | What is already there |
|---|---|---|
| What a tool is, mechanically | `course/cafe/tools.ts` header; handbook glossary | Schema plus function; the model only ever asks; you decide what happens |
| **That a description must say *when* to call a tool, not just what it does** | `course/cafe/tools.ts`, above `SCHEMAS`, plus four worked examples in the shipped descriptions | The standard itself. This course diffs against it; it never re-teaches it. |
| The `tool_use` / `tool_result` wire shape | `course/stage5-loop/run.ts` | Pass the assistant `content` array back unchanged, match `tool_use_id`, batch every result into one user message |
| Tool failure as information | Stage 5 | `is_error: true`, and recovery falling out of the loop rather than being written |
| The step limit as a trade-off | `course/stage5-loop/run.ts` (`MAX_STEPS`) and its README; handbook §04 `w.loop.stopped` | "Choosing that trade-off is the engineering" |
| Retry, and why it answers a different failure from good error text | `course/stage6-harness/run.ts` TODOs 2 and 3; `SOLUTIONS.md` | Retry handles a transient failure; useful final errors handle a persistent one |
| The cumulative permission gate | Stage 6 TODO 1; handbook §06 `w.harness.part.gate.*` | Total not per-call, fails closed on unknown price, refuses with a reason the model can act on |
| Prompt versus code | `course/stage6-harness/README.md`; stage 7 README; handbook §05 | "A model can be talked out of a request. It cannot be talked out of an `if`." |
| Least privilege on a tool | Stage 8; handbook `w.security.def.privilege.*` | The refund tool can only refund the order being discussed, up to its own value |
| Trust boundaries and prompt injection | Stage 8 in full; handbook §08 | Trust follows the source, not the sentence; cap effects in code; make losing cheap |
| **That a bigger context costs more and scores worse** | `course/stage4-context/README.md` ("Cost and latency climb, because you pay for every token on **every single call**"; "The score can go *down*, because the one line that mattered is now buried in noise"); handbook §03 "More context is not better context." | The volume argument, twice. This course must not tell it a third time. |
| The run log | Stage 6 TODO 4 | The log makes the next-morning question answerable |
| Which practice fits which problem | Handbook §09 and the Control Room | The eight practices, the decision questions, the nesting diagram |

Three rows sit close enough to need an explicit line drawn, and a contributor who blurs any of them
has written the wrong course.

**Error text.** Stage 6 makes error text a binary switch: the real reason, or the literal string
`"Error"`. It proves the reason must survive. This course starts one step past that and asks what a
reason must *contain* — specifically whether the caller can tell retryable from terminal. Do not
restate stage 6's finding. Cite it in a clause and move.

**Constrained schemas.** Stage 8 narrows a tool's authority so that being fooled costs less. That
argument belongs to security and stays there. This course narrows a schema so that a wrong call
cannot be *expressed*, which is a different property with a different failure mode: an `enum` stops
a typo and stops nothing at all about an attacker. Do not present schema constraints as a security
control.

**Tool-set size.** Stage 4 of Part 3 and handbook §03 have both already taught that more context
costs more and scores worse. This course's tool-set stage is about **ambiguity**, not volume: two
neighbouring tools whose boundary no description rewrite can fix, so the remedy is to change the
set rather than the wording. That is not a volume effect, and it is genuinely untouched. The token
measurement stays to one sentence with a clause citing stage 4 — never a before/after table.

### Out of scope entirely

- **MCP, third-party or dynamically loaded tool sets, namespacing, allowlists.** Verified absent
  from `course/`. They are also ungradable here: a course that cannot pin a version cannot score
  one.
- **Human-in-the-loop UX.** `lib/courses.ts` reserves `hitl`. `nobodyIsAwake()` in stage 6 stays
  the only approver this repository ships.
- **Cost reduction as a subject.** `lib/courses.ts` reserves `cost`.
- **Compaction.** Named as necessary in `course/stage5-loop/README.md` and never built. It is a
  context problem, not a tool problem.
- **Streaming, timeouts as implementation, and the SDK's `tool_runner`.** Stage 5's README already
  declines the last one on purpose.
- **Anything requiring a server.** `output: "export"`. No grading service, no submissions, no
  leaderboard.

---

## Who it is for

The shipped metadata says `advanced`, on a site whose stated audience is people new to software
engineering. That is not a mistake and it should not be softened in the copy.

`advanced` here is a gate, not a boast. The course's first action is to score a tool set the reader
did not write. A reader who has never written a tool runner has nothing to compare the score
against, and the number teaches them nothing. Every later stage is a diff against that baseline. So
the honest prerequisite is not "advanced developer" — it is **Part 3 stages 5 to 8, finished, on
the reader's own machine**, plus a model key and a willingness to spend on it.

Concretely: read a JSON Schema fragment without looking it up, read and edit TypeScript at the
level `course/README.md` already demands ("functions, objects, a `for` loop, `await`"), run
`npx tsx`, and hold a key. `minutes: 60` assumes all of that is already true. A reader learning the
agent loop at the same time will not finish in sixty minutes, and the course should not pretend
otherwise.

**The sixty minutes is reconciled explicitly, because the earlier draft of this brief did not.**
The grader is sequential — `run()` in `course/cafe/evalset.ts` is a plain `for` loop with one
`await` per case, and nothing under `course/` provides concurrency. A full graded run is therefore
the dominant wall-clock cost. Two consequences, both decided here rather than left to the
contributor:

1. **Four graded stages, not five.** The baseline run folds into stage 0 rather than standing as
   its own stage — it is one export line and a run, and stage 0 immediately re-runs the same set.
2. **The transfer artefact sits outside the sixty minutes**, as an artefact the reader completes
   afterwards. Part 3 budgets its own transfer project inside 150 minutes for nine stages; sixty
   minutes buys four rewrite-and-rescore cycles or a transfer artefact, not both. Say so in
   `course/tools/README.md`.

---

## The graded instrument

Every stage depends on this, so it is specified here rather than assumed.

`course/tools/toolset-evalset.ts` holds **16 cases** against the café store room, scored in two
shapes. The rule-heavy split follows `lib/cafe/evalset.ts`, whose header states the design rule as
"use a rule wherever you possibly can". Tool selection is unusually rule-friendly: the target is a
function name and an object, not prose.

**Twelve rule cases — single-turn selection.** One model call, the tool set offered, no execution.
The scorer reads the response's content blocks and scores **the first `tool_use` block**: expected
tool name, plus a predicate over the argument object. A response with **no** `tool_use` block fails
with the sentence "no tool was called". A response with **more than one** scores the first and
appends a note naming the others, because calling three tools when one was asked for is a finding
rather than a pass. As in the existing scorer, a failure returns a sentence, not a boolean.

**Four judged cases — bounded multi-turn.** The runners **execute**, `reset()` is called before
every case (without it the `FAIL_ONCE.read_sales` rig would contaminate the baseline it exists to
establish), and the loop is capped at **three turns**. A judge call then scores one question: did
the model finish the job on the tool results alone?

One graded run is therefore **12 single-turn calls, up to 12 multi-turn calls, and 4 judge calls —
up to 28**. Five runs across the course, the baseline included, is up to 140 calls if the reader
never re-runs, and the reader will re-run.

**The graded four tool names are frozen for the life of the instrument.** This is what makes the
baseline and the final run two readings of one instrument rather than two different instruments.
`course/report.ts` argues the discipline in its own header — "Different questions need different
instruments; pretending otherwise is how dashboards start lying" — and stage 3 would break it by
renaming tools the rule cases match on. So stage 3 adds **seven ungraded tools around an untouched
graded four**, and merge/split targets only the seven. The 16 cases stay valid across all five
runs.

**What the progress file records, and with what semantics.** `record()` in `course/report.ts`
applies `Math.max` to exactly one key — the literal `"score"` — and overwrites every other key. The
course therefore uses **no key named `score`**, so that a fall after a rewrite survives as a real
result:

| Stage | Key | Semantics |
|---|---|---|
| 0 | `baseline`, `descriptionScore` | both overwrite; re-running stage 0 deliberately re-baselines, and the README says so |
| 1 | `schemaScore` | overwrite |
| 2 | `resultScore` | overwrite |
| 3 | `toolsetScore`, `tools`, `blockTokens` | overwrite |

Every entry also records **`model` and `provider`**. `MODEL` and `PROVIDER` are environment-driven,
so a baseline taken on DeepSeek and a later run taken on Anthropic would compare cleanly and mean
nothing. Each stage's checker prints a `NOTE` and refuses the comparison when the two runs disagree
on either.

---

## Outline

Four graded stages, each a folder under `course/tools/` holding a `README.md` and a `run.ts` with
one or two `TODO`s, graded by `course/tools/check.ts <0-3>`, exactly as Part 3 is graded. A fifth
artefact is prose and has no checker, following `course/stage9-project/`.

**0 · The description.** Opens with one export line — `TOOLSET_UNDER_TEST`, mirroring
`SYSTEM_UNDER_TEST` in `course/stage3-evals/run.ts` — and a run of all 16 cases against the
baseline tool set, which is deliberately thin: vague verbs, no argument descriptions, two tools
whose descriptions overlap. The README opens by quoting the shipped `read_inventory` description
("Call this first when asked about restocking — you cannot know what is short without it") as the
standard the baseline falls short of, so the reader diffs against something they already accepted.
The low number is the finding, in the register of stage 1's "the long phrasing still fails — that
is the finding, not a bug".
Then the `TODO`: rewrite three descriptions. The teaching is what the shipped standard does not
cover — disambiguating two neighbouring tools, and stating the unit and the precondition inside the
description rather than hoping. Re-run.
**Check:** records `baseline` and `descriptionScore`. A one-case move over sixteen is noise, so the
checker **passes with a `NOTE`** saying so. It does not withhold the pass: in the shipped course
every `NOTE` is additive to a `PASS` and never blocks (`bad()` is the only thing that exits 1).

**1 · The schema.** Two `TODO`s in the input schemas. The first replaces free-text
`item: {type: "string"}` with an `enum` over the store-room keys and adds `minimum` / `maximum` to
`qty`. The second adds a required `unit` enum, because the handbook's own $41,200 story is a unit
the model inferred.
The README's line is the one the course exists to draw: a constraint in the schema makes a call
unrepresentable; a constraint in the tool runner makes it catchable; you want both, and the second
is stage 6's, already built. **Make that a paragraph the reader verifies themselves — not a
checker assertion.**
**Check:** records `schemaScore`, and asserts behaviourally against **this course's own runner
export** — call it with an argument the schema now forbids and require an error result. It does
**not** inspect source text and does **not** reach into another stage's module. `course/check.ts`
never does either: each check receives the stage module it graded and asserts against its exports,
and `SOLUTIONS.md` promises that any implementation passing the checker and preserving the stage's
safety properties is valid, so a source-shaped assertion about an `if` would fail readers who
solved stage 6 differently.

**2 · The result.** Tool results in Part 3 are joined strings — `read_inventory()` returns
`"coffee_beans 2 · oat_milk 6 · cups_12oz 40 · tea 8"`, all four rows, fixed. Two `TODO`s.
The first rewrites a result so the next turn can act on it: the truncation case needs a result the
reader constructs, because a fixed four-row string cannot demonstrate a stated row count — the
stage supplies a longer scripted inventory for exactly that `TODO`.
The second is the **retryable/terminal split**, and it is the untouched ground here: a result must
let the caller decide whether calling again can help. Stage 6's retry currently retries *every*
tool including `place_order`, which is the thing that gets it wrong today, and
`toolspec-template.md` already demands this taxonomy from the reader in the transfer artefact. Cite
stage 6 in a clause; do not re-run its finding. **Do not** have the reader repair the
`place_order` refusal — `course/cafe/tools.ts` already ships it as the good case with the comment
"A refusal with a *reason*", so the answer would be one directory away.
The four judged cases live here; the standard is whether the model finished the job on the result
alone.
**Check:** records `resultScore`; prints a `NOTE`, not a `FAIL`, when the model recovers anyway,
since the outcome is non-deterministic and `course/check.ts` already establishes that a coin flip
gets a note.

**3 · The tool set.** The reader is given the frozen graded four plus **seven ungraded tools**, two
of which the model cannot reliably tell apart, and must merge or split **among the seven** until the
score recovers. The seven and the two confusable ones are named with one-line schemas in
`course/tools/README.md`, not invented by the contributor.
Then `tokens()` on the serialised tool block, before and after — **one sentence, with a clause
citing stage 4 of Part 3 for the volume argument.** Not a table.
**Check:** records `toolsetScore`, `tools` and `blockTokens`, and passes when `toolsetScore` is at
or above the stage-2 score with a smaller `tools` count. When the model distinguishes the two
tools anyway, it prints a `NOTE` and passes — the same NOTE-not-FAIL precedent `course/check.ts`
sets for stage 6's ungated run.

**Transfer — a tool spec of your own.** No `run.ts`, no model call, no automatic pass or fail.
**`toolspec-template.md` is a replacement for §5 of `course/stage9-project/artifact-template.md`**
— "Loop, tools and limits" — and says so in its own header, rather than being a second template for
a reader who has just completed the first. It asks for: name, when to call, arguments and their
constraints, result shape, error taxonomy split into retryable and terminal, and measured token
cost.
`toolset.eval.json` is kept as a genuinely new artefact: its three-case axis — an ordinary call, a
call the tool set cannot express, and one where two tools both look right — is different from
`eval-template.json`'s ordinary / boundary / hostile.
**No new `RUBRIC.md`.** `course/stage9-project/RUBRIC.md` gains one row instead: *Tool definition —
0 free-text schema, 1 constrained, 2 constrained and scored.* "Prefer deleting a widget over adding
one" applies to rubrics too.

`course/tools/SOLUTIONS.md` carries every `TODO` filled in, one section per stage, and opens by
refusing to be canonical in the same words the existing file uses.

---

## The artifact

Three things the reader can put in front of another person.

1. **A rewritten tool set** — the diff between the stage 0 baseline and the definitions at the end
   of stage 3.
2. **Two scored runs** — the baseline and the stage 3 result, on the same 16 cases, the same model
   and the same provider, printed by `course/tools/report.ts` in the format `course/report.ts`
   already uses.
3. **A one-page tool spec** for one tool in a domain they know, plus their own `toolset.eval.json`.
   This is the piece that survives the café, and the piece a colleague can act on without having
   taken the course.

---

## Evidence of completion

Completion is **two scored runs on the same 16 cases with the same model, plus a completed tool
spec.** Both halves count, and the catalogue fact says so too — the two must not disagree, and in
the earlier draft they did.

The runs are recorded to `course/progress.json` by `record()`. That file is **untracked**, kept out
of the repository by `.gitignore:20`. It is not exempted from the secrets scan: `pathFindings` in
`scripts/check-secrets.mjs` returns findings rather than exemptions, and `checkSecrets()` throws on
any finding — so the rule would **fail the build** should that file ever be committed. The website
cannot observe it and must not claim a percentage for this course.

What does not count, stated plainly because the honesty is the point:

Opening all four stage READMEs is not completion. Reading `SOLUTIONS.md` and pasting a description
is not completion; the checker cannot tell, and does not pretend to. A score that went up is not
proof the tool set is better — it is proof it is better on sixteen cases, against one model, on one
provider, in one week. Sixteen cases cannot detect a one-case difference, which is why stage 0's
checker notes a one-case move while still passing it. A score that went *down* after a rewrite is a
completed run and a real result; the course records it — which is why no recorded key is named
`score` — and asks the reader to read the failing cases, in the register `course/report.ts` already
uses for a falling eval score.

The checkers here are thin on purpose, and the course README should carry the same disclaimer
`course/check.ts` carries: they confirm you built the thing, they do not confirm you built it well.
The 16-case set is the instrument for the second question, and it is a small one.

---

## Catalogue facts

These become the four `<dl className="course-facts">` rows that `components/courses/Catalog.tsx`
renders once `status` flips to `available`. The four values, the `status` flip and the `href`
change land in the same commit — nine files, thirty-six values. English alone is a regression, not
a to-do. Measured against the **twelve** existing values, which run 10–15 words and 61–86
characters.

| Key | English value | Words | Chars |
|---|---|---:|---:|
| `c.tools.prerequisite` | Part 3 stages 5 to 8 finished, plus your own key; the graded runs cost money. | 14 | 76 |
| `c.tools.outcome` | Write a tool definition a model picks correctly, and measure that it does. | 13 | 74 |
| `c.tools.artifact` | A rewritten tool set, two scored runs, and a one-page spec for your own tool. | 15 | 77 |
| `c.tools.evidence` | Two scored runs on the same cases and a tool spec; a rewrite alone is not evidence. | 15 | 83 |

The `prerequisite` value carries the key and the spend, which the earlier draft omitted — the two
things a reader most needs before clicking, on the only course in the catalogue that puts roughly a
hundred billable calls behind a key. `c.lab.prerequisite` names the key; this one names the money
too. The `evidence` value now matches the section above rather than dropping the spec.

---

## What this course reuses

**Reused as it stands, no changes.**

- `course/cafe/tools.ts` — the **data only**: `STOCK`, `WEEKLY_SALES`, `SUPPLIER_MINIMUM`,
  `ORDERS`, `LOG`, `FAIL_ONCE`, `reset()`. The store room is the domain; one source of truth is why
  a score here is comparable to a score there.
- `course/report.ts` — `record()` and the `progress.json` contract, with the key semantics tabled
  above.
- `course/check.ts` as a pattern: `preflight()` before importing the stage; the `/TODO/` sentinel
  caught and printed as `TODO`; `NOTE` additive to `PASS`; `bad()` exiting 1.
- `course/stage9-project/artifact-template.md` and `eval-template.json` as the form of the transfer
  artefact.
- `components/courses/Cover.tsx` already carries a `tools` motif — "interlocking blocks". Nothing
  to draw.
- `--gold-mark` is already defined in all three theme blocks of `app/globals.css`. No new colour,
  no three-block edit.
- `lib/courses.ts` already holds the entry. Only `href` and `status` change.

**Reused, with a stated change or a stated limitation.**

- **`course/cafe/llm.ts`.** `getClient`, `MODEL`, `tuning`, `meter`, `spend`, `preflight`,
  `extractJSON` and `OFFLINE` are exported precisely so a stage can drive the client directly
  instead of going through `ask()`; stages 5 and 6 already do. But a second offline stand-in cannot
  be reached without a **client seam** in this file, so it does not belong on the no-changes list.
  Either `llm.ts` gains that seam, or the new stages call their own client directly and keep
  `meter()` / `spend()` by hand as stages 5 and 6 already do. Decide in the first commit.
- **`tokens()` measures the wrong thing for this purpose, and the README must say so.** It counts a
  *user message*: it sends the text as `messages: [{ role: "user", content: t }]` and subtracts a
  measured empty-request floor. The `countTokens` endpoint takes a `tools` field; `tokens()` does
  not expose it. Passing a serialised tool block through it prices that JSON as prose in a user
  turn, **not** as the tool block the provider actually bills. Keep `tokens()` and state the
  limitation plainly in stage 3's README, or widen the measurement and move it to new work — see
  Open questions.
- **`course/cafe/offline.ts`** — `createOfflineClient()` as the *shape* of a scripted stand-in. It
  is not the stand-in this course needs, and `offline-preflight.ts` cannot be its clean-clone
  proof.

**Genuinely new work.**

- **`course/tools/toolset-evalset.ts`** — the 16 cases, the two execution shapes specified above,
  and the scorer. Nothing in this repository scores a tool call; `course/cafe/evalset.ts` scores an
  `Order`.
- **The baseline tool set, and this course's own runners**, under `course/tools/`, importing only
  data from `course/cafe/tools.ts`. Stage 2 rewrites result strings, and the four `RUNNERS` in
  `course/cafe/tools.ts` are imported by `course/stage5-loop/run.ts` and
  `course/stage6-harness/run.ts` — editing them in place would change what stages 5 to 8 grade.
  That is the same reason already given for not rewriting the shipped `SCHEMAS`, and it applies to
  the runners verbatim.
- **`course/tools/offline.ts`** — a client that dispatches on properties of the tool block rather
  than on the transcript. **Decided: it rewards a better description**, following Part 3's stage 8
  precedent, and `course/tools/README.md` says in the words `course/cafe/offline.ts` already uses
  that the reward is authored rather than produced by a model.
- **`course/tools/offline-preflight.ts`** — a new clean-clone proof. The existing one proves the
  existing stand-in and cannot prove this one.
- **`course/tools/check.ts` and `course/tools/report.ts`**, with their own `SHAPE` rows.
- Four `README.md` / `run.ts` pairs, `SOLUTIONS.md`, `toolspec-template.md`, `toolset.eval.json`,
  and one added row in `course/stage9-project/RUBRIC.md`.
- **Two npm scripts**, mirroring `course` and `course:offline`. Part 3 carries two, the second
  being the clean-clone proof a test asserts against.
- **A pointer in `course/README.md`**, which currently describes Part 3 as stages 0–9 and would
  otherwise not mention the sibling directory.
- **A test under `tests/`**, in the register of "assert nothing you cannot name a checker for".
  `tests/course-truth.test.ts` filters stage folders with `/^stage\d+-/`, so a `course/tools/`
  sibling breaks no existing assertion — but the new course should get its own outside-in test
  rather than inheriting none.
- Thirty-six catalogue strings.

---

## Open questions

1. **How is the course reached from the catalogue?** `external: true` with an absolute GitHub URL
   changes no entry in `config/route-manifest.json`, so `npm run routes:check` is unaffected and no
   page is added. A `/tools/` landing page like `/build/` costs a manifest edit, an entry in
   `lib/seo.ts` `PAGES`, the pinned route count in `tests/ci-foundation.test.ts`, nine pages, and
   roughly the keys `build.*` occupies times nine locales. The second is what `build` does, and
   consistency has a value the first does not carry.

2. **Does `tokens()` get widened to pass `tools` to `countTokens`?** Doing so makes stage 3's
   measurement real and moves the function out of the reuse list into new work. Not doing so is
   honest only if the README says the number is the cost of the schema text and not of the tool
   block on the wire. Prefer widening if the seam in `llm.ts` is being opened anyway.

3. **Does `selectCourseProgress` get a `"tools"` branch?** With none, it returns `untracked` and
   `Catalog.tsx` renders `cat.start` with no arrow on a card that is nonetheless a link. Giving it
   the `external` shape means widening that variant's `courseId` from the literal `"build"` to
   `"build" | "tools"` and rewriting the assertion at `tests/progress.test.ts:478`, which currently
   names `"tools"` by hand as the example of an untracked entry. Shipping `untracked` first is
   defensible; the arrow-less CTA is the visible cost.

4. **One progress file or two?** Reusing `course/progress.json` under stage keys 10 to 13 needs no
   `.gitignore` line and no change to `scripts/check-secrets.mjs`, because `course/report.ts`'s
   `main()` iterates its own `SHAPE` and never sees them. A separate `course/tools/progress.json`
   is more legible and costs a `.gitignore` line plus a second `pathFindings` rule — not an
   exemption, since `pathFindings` has none to grant.

5. **Do the seven ungraded tools survive contact with the café?** The store room holds four items
   and the menu seven, so seven additional tools is close to the domain's ceiling. If the two
   confusable tools cannot be made genuinely ambiguous inside the café without inventing a second
   domain — which would break the "the numbers are comparable" property `course/cafe/menu.ts`
   argues for — cut stage 3 rather than ship it underspecified, and fold its token sentence into
   stage 1.

---

## Honest limits

This course will not make the reader good at tool design. It will make them able to measure one
tool set against sixteen cases and say which of two versions scored higher. That is a smaller claim
than the subject deserves and a larger one than anybody currently has.

The number will date, and faster than the rest of the site. A model upgrade can move the baseline
without anyone editing a description, which is itself worth seeing and makes any sample score
printed in a README a fiction within months. **Do not print one.** The README should say what the
reader will get — a number — and not what the number will be.

Sixteen cases is a small set, and the course says so in the same breath every time it prints a
score. The set is also written by one person against one café, so it measures the failures that
person thought of. A tool set that scores 16 out of 16 has passed sixteen cases and has not been
tested on the phrasing nobody wrote down.

The offline stand-in cannot demonstrate the central finding. `course/cafe/offline.ts` reaches its
stage 8 verdict by matching a regex against the system prompt, and this course's stand-in faces the
same problem one layer down: it is scripted to reward a better description, but the reward is
written by the author, not produced by a model. The offline path proves the grader runs, the
schemas validate and the control flow is sound. It does not prove that a model reads descriptions
the way the course claims. Say this in `course/tools/README.md` more than once, as Part 3 does.

Token measurement is provider-shaped, and — unless Open question 2 is answered by widening it — is
measuring schema text rather than a tool block. Both limitations belong in the same sentence in
stage 3.

Finally, the course teaches nothing about tools whose results are large documents, nothing about
tool sets the reader does not control, and nothing about what happens when a call may already have
been sent. That last question is posed in `course/stage9-project/RUBRIC.md` and answered nowhere in
this repository. It stays unanswered here too.
