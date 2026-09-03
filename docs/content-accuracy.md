# Keeping the teaching true

A development guide for the one property this site cannot check by building:
that what it teaches is **correct**, and still correct on the day someone reads it.

Everything else here already has a gate. `npm run build` proves the site
compiles, `routes:check` proves every page exists, `handbook:check` proves the
prose and the markup agree, `widgets:check` proves 133 ids resolve and no
reader-facing literal escaped translation, and `prose:check` — added by this
guide, see Gap 2 — proves the course READMEs still name things that exist.
Not one of them can tell you that a provider quietly started honouring a schema
it used to ignore, or that a price doubled. That is the hole this guide is
about.

---

## The rule

> **A claim that can go stale needs a date, a source, and a check that fails
> when it drifts. A claim that cannot go stale needs none of those — and must
> not be given them.**

Both halves matter. The first is obvious. The second is what keeps this
document from turning the handbook into a maintenance burden: most of what
this site teaches is *deliberately* immune to model releases, and dating it
would be a lie about how much re-checking it needs.

---

## Where staleness can actually live

The audit behind this guide read every prose surface on the site and every
line of the course. The finding worth internalising before you plan any work:

**the risk is not spread evenly, and it is not where it feels like it is.**

| Surface | Volatile claims found | Why |
|---|---|---|
| Handbook prose, 540 strings | **effectively none** | It teaches who decides the next step. Loops, graphs, injection, blast radius and evals do not change when a model ships |
| Handbook glossary, 15 terms | **none wrong** | Every definition is mechanism-level. "An agent is a model running in a loop with tools" will outlive every model named in this repo |
| Site strings, `messages/en.json` | **none wrong** | Already hedged on purpose — *"All model behaviour shown is as of the model you run it on"*, *"Treat any course estimate as dated"* |
| Browser Lab | volatile, **defended** | Dated pricing snapshot plus a release-gated provider canary |
| **Local course, `course/`** | volatile, **defended** | Every volatile claim now has a dated snapshot and a release row: DeepSeek ids and prices, the schema quirk stage 2 rests on, and the Anthropic model id and prices. What is left is judgement, not machinery |
| **Course prose, `course/**/README.md`** | volatile, **now gated** | Names real functions in real files; `prose:check` verifies the names still exist. Five wrong identifiers found so far |

The handbook is the biggest surface and carries the least risk. The course is
the smallest and carries nearly all of it. Spend your effort accordingly —
do **not** start a currency pass by rereading the handbook.

### Why the handbook is safe, and how to keep it that way

It is not luck. The prose was written at the mechanism level, so a sentence
survives a model release because it never depended on one. `p-security.21`
says a successful injection should refund $18.60 instead of $4,210 — those are
this course's own café numbers, true by construction, not observations about a
vendor. That is the pattern to preserve.

The one thing that would break it: writing *"models today have 200k context
windows"* or *"the current best model scores X"* into a panel. Don't. If a
section genuinely needs a number from the outside world, it belongs in the
course where it can be dated, not in the handbook where it cannot.

---

## What already defends the content

Credit where it is due — reuse these rather than inventing parallel machinery.

- **`lib/byok/pricing.ts:16-41`** — DeepSeek prices as a *dated snapshot*, not
  an anonymous table: `checkedAt`, `sourceUrl`, and a comment saying release
  must re-check before shipping.
- **`priceUsage` / `conservativePrice`** — every price the site quotes carries
  its own `checkedAt` and `sourceUrl` in the return value, so a stale number
  cannot be displayed without its date attached.
- **`priceAnthropicCourseUsage` (`course/cafe/pricing.ts`)** — refuses to price
  what it cannot price. A cache-write call returns
  `cache-creation-price-unknown` rather than a plausible guess. Copy this
  instinct: **an honest "unknown" beats an invented number**, and it is the
  single most transferable habit in this repo.
- **The release provider canary** (`scripts/check-release-readiness.mjs:58`
  and `:66`) — reconciles `pricing`, `modelId`, `usage`, `billing`, `cors`,
  `credentialLifecycle` and `jsonSchemaIgnored` against the live provider
  before a release ships.
- **`course/cafe/offline.ts`** — the offline stand-in is *synthesised*, not
  recorded model output, and says so in its header. Recorded fixtures rot;
  this cannot. Do not "improve" it by recording real replies.

---

## The four gaps

Each gap below names the check that closes it. A gap without a check is a
to-do that will be true again in six months.

### Gap 1 — the course's Anthropic snapshot is undated — **closed**

`course/cafe/llm.ts:57-58` hard-codes `claude-opus-5` at `{ in: 5.0, out:
25.0, cachedIn: 0.5 }` with **no `checkedAt` and no `sourceUrl`**, while the
DeepSeek half of the very same file defers to the dated snapshot in
`lib/byok/pricing.ts`. So the course prints an Anthropic cost with no
provenance, and nothing anywhere will notice when that price moves.

*Both numbers are correct as of 2026-09-02.* That is not the problem. The
problem is that their being correct is currently an accident.

**Closed by `ANTHROPIC_COURSE_PRICING` in `course/cafe/pricing.ts`** — a dated
snapshot with `checkedAt`, `sourceUrl` and the model id, the same shape
`DEEPSEEK_PRICING` has. `llm.ts` now defers to it instead of holding its own
literal, `priceAnthropicCourseUsage` carries the date and source out of every
return path the way `priceDeepSeekCourseUsage` does, and the cost line the
learner sees ends `prices checked 2026-09-03` on both providers rather than
only one.

The struct really was small. Doing it alone was the part that was not, and the
priority list below was right to say so: a `checkedAt` nothing re-reads is
worse than no date, because it looks verified. So the second half shipped with
it — `anthropicCourseSnapshot`, a seventh release gate with a `modelId` row and
a `pricing` row, bound to the same published page the snapshot cites. It could
not be a row on `providerCanary`: that gate is bound to DeepSeek's pricing URL
and its steps are Flash-shaped, because it also covers the browser Lab.

The figures were checked against the published page on 2026-09-03 — model id
`claude-opus-5`, $5 and $25 per MTok, cache reads $0.50 at the standard 0.1×
multiplier. That is why the date is honest; it is **not** why the gate passes.
Both rows are `pending`, because a release row needs the release process's own
recorded evidence rather than an author's reading, and
`evidence/gate-set-revision-20260903.json` says so in as many words.

Cache writes stay unpriced on purpose. They were $6.25/MTok on the same page,
so the number is now knowable — but the course does not meter them, and
`priceAnthropicCourseUsage` refusing with `cache-creation-price-unknown` is the
habit this document calls the most transferable in the repo.

### Gap 2 — course prose names code that nothing verifies — **closed**

`course/**/README.md` is teaching material that points at real identifiers in
real files, and no checker reads it. This is not hypothetical: **three wrong
identifiers were sitting in stage 2's README**, survivors of the Python
original, telling learners to open `cafe/llm.ts` and read two functions that
have never existed in it. Fixed below — but they were only found by hand.

**Closed by `scripts/check-course-prose.mjs`**, run as `npm run prose:check`
beside `widgets:check` in CI. Named for what it reads rather than the
`docs:check` sketched here, because it deliberately does *not* read `docs/`.
Four rules:

1. **Paths resolve** — inline spans, link targets, the commands in ` ```bash `
   fences and the imports in ` ```ts ` fences. A bare filename (`run.ts`)
   resolves against any basename in the tree, since "each stage has a `run.ts`"
   means all nine; a file the course *writes* (`course/progress.json`) resolves
   through the source that names it, since it is absent from a clean checkout
   and still a correct reference.
2. **Identifiers exist** in `course/**/*.ts` or in the shipped
   `@anthropic-ai/sdk` types. Reading the vendor's types is what lets
   `max_tokens` and `output_config.format` resolve without an allowlist — and
   it is why the gate caught `tool_runner`, which the SDK spells `toolRunner`.
3. **An identifier named in the same paragraph as one of the course's own
   files is in that file.** This is the rule that catches renames: "open
   `cafe/llm.ts` and read `schemaFallback`" is a claim about a *file*, and
   presence somewhere in `course/` is not that claim.
4. **The cross-language shapes fail outright** — `_leading_underscore` names
   and `name=value` keyword arguments, both wrong in a TypeScript course and
   both exactly what a Python-era paragraph looks like.

Two rules learned from the prototype and kept:

- Skip `docs/course-briefs/` — those specify courses that do not exist yet, so
  their identifiers are *supposed* to be unresolvable. Anything that scans
  them will drown in false positives and get switched off. This stayed the
  only exemption.
- Do not ban `snake_case` outright, as the prototype did. `place_order`,
  `read_sales`, `cups_12oz` and `needs_confirmation` are tool names, SKUs and
  wire fields that are *correctly* snake_case. Rule 2 already fails an invented
  one, and rule 4 catches the leading underscore that actually marks the port.

What it cannot do, so nobody over-trusts it: rule 2 is word-presence, not
semantics. It proves a name is not invented. It cannot prove the name still
means what the sentence claims — that stays a reading job, and rule 3 is the
only part that narrows it.

`tests/course-prose.test.ts` watches each rule fail on the prose it was written
to catch, against a copy of the real course tree. A gate nobody has seen fail
is indistinguishable from one that returns zero.

### Gap 3 — vendor behavioural claims have no expiry — **schema quirk closed**

The course asserts things about vendors that were true when written and are
nobody's contract:

- `llm.ts:73` — DeepSeek serves an Anthropic-compatible endpoint at
  `https://api.deepseek.com/anthropic`, so the official SDK drives it with
  only a `baseURL` change.
- `llm.ts:78` — DeepSeek **accepts `output_config.format` and silently
  ignores it**. The whole of stage 2's second lesson rests on this.
- `llm.ts:74` — `deepseek-v4-flash` and `deepseek-v4-pro` are the current ids.

If DeepSeek starts honouring schemas, stage 2 does not merely go stale — it
teaches a fallback the learner no longer needs, and `schemaFallback` starts
degrading answers for no reason. This is the highest-consequence staleness in
the repo.

**The schema quirk is closed.** `jsonSchemaIgnored` now sits in the canary's
`reconciliations` beside `modelId` and `pricing`, and `release:check` is
fail-closed, so a release cannot ship until someone has sent a schema and
recorded whether the reply parsed. `docs/release/provider-canary.md` carries
the procedure and what a `fail` obliges: `quirks.jsonSchema`, `schemaFallback`'s
reason for existing and stage 2's second lesson all change together, and
`prose:check` then holds the README to whatever the code ends up saying.

Adding it cost more than the one line this section predicted, and the reason is
worth recording. The gate set is tallied in two *dated attestations* bound to
`20260821_Codex Priority Implementation Plan on Agent Edu.docx` by SHA-256, and
`tests/roadmap-completion.test.ts` asserted those frozen tallies against the
live config — so growing the gate set from 33 records to 34 could only be
answered by falsifying an attestation or going red. Neither is acceptable, so
the tally moved: `docs/release/evidence/gate-set-revision-20260902.json` is a
new dated record carrying 34, the two older ones are unedited at 33, and the
living cross-check now runs against the new one. A test asserts the frozen
records still say 33, which is what would catch someone "fixing" them.

**Still open:** the endpoint claim at `llm.ts:73` — that DeepSeek serves an
Anthropic-compatible API at `/anthropic` — has no row of its own. The model-id
claim at `llm.ts:74` does: `modelId` reconciles requested against returned, and
the `models` step lists what the provider actually offers. Both are
lower-consequence anyway — a wrong endpoint or model id fails loudly on the
next call, where a silently-honoured schema fails quietly forever.

### Gap 4 — the course stops before the thing they will actually use — **closed**

Not an error; an omission that reads as one to a learner who goes looking.

Stage 5 hand-writes the agent loop, and is right to: *"not a framework's loop
— the twelve lines the frameworks wrap"* is the correct lesson and the reason
the stage exists. The stage does point at the SDK's own runner, and
`prose:check` found that it had been pointing at it under a Python-shaped name
since the port: `client.beta.messages.tool_runner`, which the SDK spells
`toolRunner`. Fixed below. What is still missing is the *closing* move — the
paragraph runs before the loop is written, so a learner finishes stage 5 with
no invitation to go back and recognise what they just built.

Likewise the glossary defines harness, agent, tool, eval and compaction — and
not **MCP**. In 2026 that is a hole in a beginner's vocabulary, not a
sophistication they can defer.

**Closed by two additions**, neither disturbing the pedagogy. Stage 5 ends on
*What you can read now*: the runner is the loop you just wrote, reach for it —
and the two things it cannot decide for you are the two the stage made you
feel, `MAX_STEPS` and what happens when `read_sales` fails. `prose:check` gates
all three names, so the paragraph cannot drift back to `tool_runner`.

The glossary gains `🔌 MCP (Model Context Protocol)`, in all nine languages.

Two mechanics worth knowing before adding any handbook string, because the
"budget nine translations" note above understated the cost:

- **Append, never insert.** Keys are bare ordinals — `hb.body.glossary.31`. A
  mid-list insert renumbers everything after it and silently re-points every
  translation of those keys in all eight files. Appending to the end of the
  container leaves the other thirty untouched, which was verified by diffing
  `en.json` against `HEAD`: two keys added, none changed, none removed.
- **Nine or none.** `localiseHandbook` sets `localised` false when a locale's
  file is missing *any* key, and `Handbook.tsx` reads that to show the
  English-only note and force `dir="ltr"`. Two untranslated strings would
  therefore take the entire Arabic handbook out of RTL. The "translation queue"
  framing in `CLAUDE.md` was about a locale with no file at all; it has been
  corrected to say so. Verified by building the half-finished state and
  reading `out/ar/handbook/index.html`: `class="hb en-content"` with
  `dir="ltr"`, and back to `class="hb"` once the ninth file landed.
- **A locale value identical to English needs a reason.** German keeps
  `Model Context Protocol`, because `de.json` keeps this field's vocabulary in
  English throughout — `Retrieval (RAG)`, `Harness`, `LLM-as-judge`. That trips
  the release config's `catalog-unexplained-english` check, whose designed
  answer is a narrow entry in `sameAsEnglishAllowlist` saying why. One was
  added; it is the 42nd, beside `Format` and `Optional`.

Two gates enforce this and neither is an npm script, which is worth knowing
before assuming a translation is unguarded: `tests/handbook-p0.test.ts` fails
when a locale's key set diverges from English, and `tests/release-readiness.test.ts`
fails on an English-identical value with no allowlist entry.

---

## Confirmed defects

Found by audit on 2026-09-02, then two more by the gate the audit asked for —
on its first run, before it had been wired into CI. All five are fixed.

| # | Where | Was | Now | Status |
|---|---|---|---|---|
| 1 | `course/stage2-prompt/README.md:31` | `llm.ask(..., schema=...)` — Python keyword-argument syntax in a TypeScript course | `ask(prompt, { schema })` | **fixed** |
| 2 | `course/stage2-prompt/README.md:33` | `_schema_fallback`, `_extract_json` — neither has ever existed in `cafe/llm.ts` | `schemaFallback`, `extractJSON` | **fixed** |
| 3 | `course/cafe/llm.ts` | On exhausting `max_tokens`, told **every** learner to `pass effort:"low" to turn thinking off` | Remedy now branches on provider | **fixed** |
| 4 | `course/stage5-loop/README.md:28` | `client.beta.messages.tool_runner` — the SDK spells it `toolRunner`; wrong since the Python port | `client.beta.messages.toolRunner` | **fixed**, found by `prose:check` |
| 5 | `course/stage3-evals/README.md:23` | `handleOrder("tea")` — said "in stage 1 you could write", but stage 1's function is `takeOrder` | `takeOrder("tea")` | **fixed**, found by `prose:check` |

Defect 3 is worth understanding, because it is the shape most of the remaining
risk will take. The advice was true on DeepSeek, where `tuning()` maps low
effort to `thinking: { type: "disabled" }`. It was false on Anthropic, where
thinking stays on at every effort level and low only makes it shorter — so a
learner following the error message would watch it not work and have no idea
why. **A claim that is true of one provider, stated as though it were true of
both**, is how a dual-provider course goes wrong, and no type checker will ever
catch it.

Two claims were checked against the current Anthropic API and are **correct**:
structured outputs via `output_config.format` (not the deprecated
`output_format`), and the `stop_reason === "refusal"` guard with
`stop_details.category` read before indexing into `content`. The refusal guard
in `llm.ts` is better than most production code.

---

## The re-verification protocol

Not everything needs the same cadence. Re-checking the handbook quarterly is
waste; re-checking DeepSeek's schema behaviour annually is negligence.

| Claim | Re-check | Against | Fails how |
|---|---|---|---|
| DeepSeek prices | every release | `api-docs.deepseek.com/quick_start/pricing/` | canary `pricing` |
| DeepSeek model ids | every release | live `GET /models` | canary `modelId` |
| DeepSeek ignores `output_config.format` | every release | one live call with a schema | canary `jsonSchemaIgnored` |
| Anthropic model id and prices | every release | `platform.claude.com/docs/en/about-claude/pricing` | `anthropicCourseSnapshot` (Gap 1) |
| Identifiers named in course prose | every commit | the tree and the SDK types | `prose:check` (Gap 2) |
| SDK call shapes | on `@anthropic-ai/sdk` major bump | the SDK's own docs | course runs live |
| Handbook prose | **only when the mechanism changes** | judgement | nothing, correctly |

The last row is the one people get wrong. Do not put the handbook on a
calendar. Put it on a trigger: if the *mechanism* being taught changes, the
section changes; otherwise leave it alone. Rewriting sound explanations to
feel current is how a good course decays.

---

## Priority

1. ~~**Gap 2, the prose-to-code checker.**~~ **Done** — `npm run prose:check`,
   in CI beside `widgets:check`. It was right about the value: as a throwaway
   script it found three defects, and as a gate it found two more the audit had
   read past, one of them in the very paragraph the audit was quoting. It is
   the only item here that pays off on every future commit rather than once.
2. ~~**Gap 1, dating the Anthropic snapshot.**~~ **Done**, and done as one
   change with the second provider dimension it needed. Taken last because it
   was the item this document had most misjudged: `check-release-readiness.mjs`
   hard-codes `providerCanary` to DeepSeek's pricing URL and shapes its steps
   around Flash, so nothing could have re-read an Anthropic number. Dating the
   snapshot alone would have bought the appearance of provenance and nothing
   else. The gate came with it.
3. ~~**Gap 3, the schema-quirk canary.**~~ **Done** — `jsonSchemaIgnored`, in
   the release canary, fail-closed. Taken before Gap 1 on the reasoning below.
4. ~~**Gap 4, tool runner and MCP.**~~ **Done** — stage 5's closing paragraph
   and one glossary entry in nine languages. The nine-language cost was real
   and slightly worse than budgeted: not translating all eight would have
   dropped Arabic out of RTL, so there was no partial version to ship.

---

## What not to do

- **Do not chase model releases into the prose.** A new model does not make
  "an agent is a model running in a loop with tools" less true. If a release
  changes nothing about the mechanism, it changes nothing here.
- **Do not add a dated claim you have no way to re-check.** An undated number
  is bad; a number with a `checkedAt` that nobody ever re-checks is worse,
  because it now looks verified.
- **Do not name a specific model in prose to sound current.** `llm.ts` names
  the Anthropic model in exactly one place and no document repeats it — that
  is why the model can change in a one-line diff. `course/README.md:46` says
  "or a Provider-supported model" rather than naming one. Keep it that way.
- **Do not record live model output into fixtures.** `offline.ts` is
  synthesised on purpose. Recorded replies are stale the moment the model
  updates and, being plausible, nobody notices.
- **Do not touch `lib/flowchart.ts`, `lib/handbook/behaviour.ts` or
  `lib/handbook/markup.ts`** for accuracy work. Handbook wording changes go
  through `markup.ts` and `npm run handbook:extract`, per the house rules —
  and per the audit, the handbook is the surface least likely to need them.
