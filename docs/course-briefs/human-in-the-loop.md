# Human in the Loop — course brief

> **Historical design snapshot.** Preserved from donor commit `2c55e768`
> (2026-08-30). The current release registry has no `hitl` course id. This is
> an archived proposal, not an active specification or publication authority;
> revalidate every path, count, source claim, and shared contract before reuse.

**Status at the donor snapshot:** approved specification, awaiting implementation. No code
existed. `lib/courses.ts` carried the catalogue row (`id: "hitl"`, `href: "#"`,
`status: "soon"`) and `components/courses/Cover.tsx` carried a cover motif; nothing else in the
repository implemented this course. This document replaced the one-line blurb as the proposal
and ended a circular README/catalogue reference. An approved brief was not permission to publish.

Repository facts below were read on 2026-08-30 and carry file and line references. Anything
the author cannot re-verify at implementation time should be treated as drifted.

---

## What this course is for

The reader arrives having been told, correctly and repeatedly, that a gate must exist. The
Handbook's harness section weights the permission gate heaviest of six parts — 30 of 100, in
`PARTS` at `lib/handbook/behaviour.ts:1246` — and attaches the failure story:
`w.harness.part.gate.fail` reads "It read the unit as kilograms and ordered 1,000 kg of
beans — $41,200 — and nobody was asked." Build's stage 6 makes the reader write that gate as
an `if` in the tool runner, and supplies the sentence the whole site rests on: "A model can be
talked out of a request. It cannot be talked out of an `if`." Both then move on. Neither ever
shows the person standing at the gate.

That is what this course is for, and it is what the shipped blurb already promises:
"Designing the moment a person steps in, so it happens before the damage and not after." The
blurb is about a moment, not a mechanism. Where the gate lives is settled everywhere on this
site. When it fires, what it says, how often it says it, who is awake to read it, and what is
left to do when the answer was wrong — none of that is settled anywhere.

The change in thinking this course is responsible for is one sentence: **a gate is not a
control until somebody can answer it well.** The Handbook records "1 human approval at 02:14"
as a fact and moves straight on (`w.harness.ok`, `messages/widgets/en.json`). Build's approver
is `nobodyIsAwake()` at `course/stage6-harness/run.ts:22`, a function that returns `false`,
documented with "A gate whose default is *allow* is not a gate" and the unbuilt suggestion
"Swap this for a readline prompt and you have a human in the loop." That swap is this course.
A reader should finish able to say, for a system of their own: who is interrupted, at what
rate, with what in front of them, and what the recovery is when the answer was yes and should
have been no.

---

## Boundary

### What is already taught, and must not be re-taught

| Claim | Where it already lives | What this course may do with it |
|---|---|---|
| A gate must exist, and belongs in code rather than in the prompt | Handbook §06 harness (`w.harness.part.gate.*`, `w.harness.strip.s3` "🚦 Gate the dangerous bits"); Build stage 6 TODO 1 | Cite in one clause in §01. Never re-derive. |
| "A prompt is a request; a node or an `if` is a guarantee" | Handbook §05 thesis, `w.decide.rec.promptGraph.body`; Build stages 6 and 7 | Assume known. Do not restate. |
| The mandatory, unskippable review step, and why a loop's self-check is not one | Handbook §05 in full, including `w.graph.note.bad` | Assume known. The only new fact is that §05's reviewer is a model: `kind:'m'` at `lib/handbook/behaviour.ts:1034`. |
| The step limit as a cost/completion trade-off, and that a limit buys you a half-finished job | Handbook §04 `w.loop.stopped` ("The coffee was ordered but the cups weren't, and nobody was told"); Build stage 5 `MAX_STEPS` | Out of scope. §04 may cite `w.loop.stopped` in one clause and must not re-derive it. |
| Approval as blast-radius reduction against prompt injection | Handbook §08 `w.security.def.confirm.*`, `w.security.act.held`; Build stage 8 | Out of scope. Note only that the `confirm` defence fires as the fallback when least privilege is off, so approval is taught there as one of four interchangeable caps. |
| Trust follows the source, not the sentence | Handbook §08 entire; `course/stage8-security/README.md` | Out of scope entirely. Do not restate it as "who is allowed to approve". |
| The autonomy dial, its two axes and its four readings | Handbook §00–§06 | Must not be re-derived. This course has no opinion about where a problem sits on that dial. |
| Comparing approaches — code, prompt, context, loop, graph | The static `<table>` inside `id="p-compare"` in `lib/handbook/markup.ts`, extracted as `hb.body.p-compare.*` | Out of scope. See the columnar constraint in §07 below. |
| Evals belong on your bench, not in production | Handbook §07 | Out of scope. |
| The vocabulary: guardrail, least privilege, harness, prompt injection, LLM-as-judge | Handbook §09 glossary — "🛡️ **guardrail** — A check the system cannot skip", "🔩 **harness** — … retries failures, **asks permission** and writes the log" | Reuse the words. Do not redefine them. |
| An irreversible action labelled as such in a tool description | `course/cafe/tools.ts:77` — `place_order` is described to the model as "This spends real money and cannot be undone" | §05 cites this as the place the distinction already surfaces, then supplies the missing middle class. Do not re-derive. |
| Escalation, in one sentence | `course/SOLUTIONS.md:324` | §06 grows from it. Cite in one clause; do not treat the topic as taught. |
| The gate as a transfer-project requirement | `course/stage9-project/artifact-template.md` §6 "Irreversible gate" (three fields) and the `RUBRIC.md` row | Extend those three fields. Do not restate them. |

### What this course covers, because nothing else does

Absence verified across `lib/handbook/markup.ts`, `messages/widgets/en.json`, `messages/*.json`
and `course/**`: `undo`, `rollback`, `revert`, `escalat*`, `notif*`, `interrupt`, `pause`,
`delegat*`, `oversight`, `supervis*`, `consent`, `queue`, `batch`, `fatigue`. The two hits
worth naming are already in the table above and are labels, not lessons.

- The content of an approval request, and what a person needs in order to decide well and quickly.
- Gate placement economics, and approval fatigue as a modelled effect rather than a warning.
- The three interception points: a proposed plan, a specific action, and after the fact.
- Stopping the *effects* of a run, as distinct from stopping the program.
- Reversibility as a designed property, and recovery after a wrong approval.
- Notification and escalation, including the case where nobody answers.
- Calibrating autonomy over time, in both directions.
- A human reviewer as a role distinct from a model reviewer.

### One prerequisite hazard the author must design around

The Handbook's section-nav forward buttons skip the harness. `#p-graph` carries
`data-goto="loop"` and `data-goto="compare"`; `#p-harness` carries `data-goto="graph"` and
`data-goto="compare"`. A reader who follows those forward buttons rather than the rail travels
start → code → prompt → context → loop → graph → compare → play and never opens §06, §07 or
§08. The `#p-start` hub does offer a direct button to §06, so the hazard is narrower than "the
buttons" — but it is real. §01 of this course must therefore re-establish the gate's existence
in one sentence rather than assume it, and no later section may depend on the reader having
met `w.harness.part.gate.*`.

### Out of scope entirely

- **Anything requiring a server.** `output: "export"`. No approval queue, no shared inbox, no
  delivered notification, no account. The course may draw an escalation policy; it may not
  send anything.
- **Organisational process.** Rotas, RACI, incident command, regulatory sign-off. The course
  covers what a system must offer a person, not how a company staffs it.
- **Legal accountability.** Named as a real question in §06, then dropped.
- **Model-graded review.** LLM-as-judge is Handbook §07.
- **Any live provider call.** The format is `read`; every simulation is scripted, exactly as
  the Handbook's are. There is no key, no terminal and no cost.

---

## Who it is for

The shipped level is `intermediate`, on a site whose `home.lede` says it is "written for
people who are new to software engineering". That is worth stating plainly rather than
smoothing over.

**Decision: the level stays `intermediate`, and `c.hitl.prerequisite` names the prerequisite
explicitly.** Intermediate here means *third thing you read, not first*. The course assumes the
reader has met the harness and the gate — Handbook §04 to §06, or Build stage 6. It does not
assume they can write TypeScript. There is no code to write and no file to open, so a complete
beginner can finish it; they will get less from §03 and §05, both of which trade on having once
watched an agent take an action nobody expected. The alternative — dropping to beginner and
teaching enough of the harness in §01 for the course to stand alone — was rejected because it
grows §01 into a second harness section and duplicates Handbook §06.

The prerequisite knowledge, stated as three facts: an agent loop chooses its own next step; a
tool is a function the model asks for rather than runs; a gate is code around the tool, not a
sentence in the prompt.

**On the shipped 35 minutes.** `minutes: 35` is a number in `lib/courses.ts`, not a translated
string, and it is rendered on the card beside the level, so a reader checks it against their
own watch. The budget is therefore stated rather than assumed: **seven sections at roughly four
minutes of reading each is 28 minutes, and the oversight plan is the remaining seven.** The
artifact is inside the number, not additional to it. This is why the outline below has seven
sections and not eight — see the note under §01.

---

## Outline

Seven sections, modelled on the Handbook's panel shape: eyebrow → `<h2>` → thesis → method
strip → plain-English box → mechanism flowchart → the interactive → three takeaways. Diagrams
are drawn with `lib/flowchart.ts` through `FC.draw` and `FC.strip`, which need no edit to that
file.

**Interactives are decided here, not at implementation time.** Four sections ship an
interactive — §01, §03, §05 and §07. Three ship a diagram and a worked example — §02, §04 and
§06. "Prefer deleting a widget over adding one" is the reason the count is four and not seven.

**01 · What the request has to say — "approve? y/n" is not a question.**
Opens the course, so it carries the frame an earlier §00 would have carried: the two counters
used throughout (interruptions per hour, damage let through), one sentence restating that the
gate belongs in code, and the shape legend. It introduces one new mark, a person. Note the
wording trap: the Handbook masthead already spends "a human decided this" on a *design-time*
meaning, against "a model decided this". The new mark needs different words — "a person answers
this" is the proposed label.
Then the section proper: the anatomy of an approval request — the action in the reader's
vocabulary rather than the program's, what it costs, what it cannot be undone from, what
happens if nobody answers, and the alternative to yes that is not simply no.
**Reader does:** rebuild one. The section ships a bare call — `place_order({item:"coffee_beans",
qty:1000})` — and the reader assembles a request card from a fixed field set, then watches the
same decision made with each field removed. Beans are the right example throughout: `UNIT_COST`
at `course/stage6-harness/run.ts:8` prices them at 18.0 against an `APPROVAL_THRESHOLD` of
100.0, so any order of six bags or more crosses the gate, and the failing case is already
`w.harness.part.gate.fail` — 1,000 units read as kilograms, $41,200, nobody asked. Do **not**
use `cups_12oz`: at 0.04 a unit, even the 1,000-unit order comes to $40 and never reaches the
threshold, and `SUPPLIER_MINIMUM` at `course/cafe/tools.ts:17` makes `qty:1000` the *corrected*
order rather than the refused one.
A request that shows the unit and the total is answerable. A request that shows the function
call is not.
**Diagram:** one `FC.draw` mechanism chart of a single tool call, with the gate node expanded
into what crosses to the person and what does not.
**Negative constraint:** this is not a UI design lesson. The subject is the information, not the
layout.

**02 · Proposal, preview, or action — three moments, not equally useful.**
Interrupt before the plan runs (cheap to correct, poor information), before one action (good
information, narrow view), or after the fact (full information, no leverage). Dry runs and
diffs are the middle case: an action computed and displayed, not taken.
**Reader does:** reads a worked timeline of six scripted events and the note of what was
knowable at each instant. One of the six is deliberately unanswerable at every point, and the
section says so.
**Diagram:** `FC.strip` for the four-step method, plus one timeline figure.
**Boundary to hold:** Handbook §05 asks whether a check happens at all. This asks *when* it
happens and what is visible then.

**03 · The cost of asking — a gate that fires forty times an hour is a rubber stamp.**
The centre of the course and the largest untouched area on the site. Gate placement as an
economic choice: firing rate times cost per interruption, against expected damage prevented.
Approval fatigue enters as a modelled effect: above some rate, approver accuracy falls, and a
gate whose answers are all yes has stopped being a control.

**Domain: a coding agent running shell commands over one eight-hour session.** Not the café
night shift. Handbook §06 already stages a night shift — its card header reads "🌙 Run the night
shift — same job as §04 — restock the café, unattended", with a control panel and a three-meter
morning report — and a job that runs once a night cannot demonstrate a gate firing forty times
an hour. The café night shift stays in §06 of this course, where it is answering
`w.harness.ok` directly.

**The model is specified here so that the contributor implements a design rather than authors
one.** Forty scripted events in fixed order, no randomness anywhere. Six are damaging, with
stated amounts. One threshold slider selects which events require approval. Cost per
interruption is 45 seconds of operator attention. Read-rate falls linearly from 1.00 at five or
fewer interruptions per hour to 0.35 at thirty or more, and is flat outside that band; an
unread approval is granted. Three readouts: interruptions per hour, damage let through, and
approvals granted without the request being read. The third is mandatory — without it the
section teaches the wrong lesson.

**Required disclosure, on the page and not only in this brief:** the fatigue curve is
illustrative, chosen to be legible, and is not a measurement. `lib/handbook/behaviour.ts`
already computes a teaching cost meter from an invented formula; this follows that precedent
and must follow its honesty too.

**Negative constraints:** do not name a recommended threshold; do not add a score. The section
is about the shape of the curve and the reader choosing a point on it.

**04 · Stopping a run that is already going — cancel is not undo.**
The load-bearing distinction is between stopping a program and stopping its effects. A
cancelled run may already have sent the email; cancelling the process does not unsend it. Two
claims only: cancel-with-cleanup and the compensating action, and amending a goal mid-run.
**Reader does:** reads a worked example. **No step-through control.** Handbook §04's widget is
already an eight-step scripted run with Step, Run-to-the-end and Reset controls, a step-limit
slider and a stop verdict; adding a Step button here reproduces the very demo control this
section criticises, and the section's thesis is that the *operator* has no way in.
`w.loop.stopped` is the sentence that already covers "a limit buys you a half-finished job" and
may be cited but not re-derived.
**Straight statement to include:** an agent with no stop control is a design defect, and the
stop control is harness code, not model behaviour.

**05 · After a wrong yes — reversibility is designed in, not discovered.**
The classification the rest of the course rests on: reversible, review-required, irreversible.
Use exactly those words — `course/stage9-project/eval-template.json` already ships them as
`risk` values, and a third vocabulary for the same idea would be a regression across the site.
`place_order`'s own description already tells the model an action "cannot be undone"
(`course/cafe/tools.ts:77`); this section supplies the middle class that description has no word
for. Then: what recovery costs in each class, and why only the irreversible class *has* to be
gated before the fact.
**Reader does:** sorts twelve scripted actions into the three classes, then sees which of the
gates they set in §03 the classification makes unnecessary. Sending an email is the trap —
irreversible and cheap, which is why it gets classified wrong.

**06 · Who gets woken — "nobody was woken up" is a claim about the good nights.**
Notification and escalation as a design surface: thresholds, who is on the other end, what
happens when they do not answer, and what a system should do at 03:00 when the only approver is
asleep. `w.harness.ok` ends "Nobody was woken up." That is the success case; this section is
about the night when somebody should have been. This is where the café night shift belongs.
It also carries the two questions nothing on the site answers: who owns the outcome of an
approval, and what a rejection is worth as data. A rejection that goes nowhere is a wasted
measurement.
**Reader does:** reads a worked escalation policy run against a timeout. Approve, deny and no
answer are three outcomes, and the third is the one systems get wrong.
**Boundary:** the course specifies what the system offers. It does not specify a rota, and under
`output: "export"` it cannot deliver a message.

**07 · Turning the gate down, and back up.**
Calibration over time: start gated, loosen on recorded evidence, re-gate after an incident, and
the asymmetry between those two directions.
**Reader does:** completes the oversight plan and reads back their own eight answers as one
page.
**Comparison artefact:** one table, six oversight controls as rows — pre-approval, dry run,
post-hoc review, notification, rate limit, undo — against four columns: operator attention per
event, what it catches, what it lets through, and when it is the wrong choice.
**The real overlap risk is columnar, not row-wise.** The Handbook's approach table under
`#p-compare` has seven columns — Approach, Who picks the steps, Same answer every time?,
Handles messy language?, Can it act on the world?, Cost per run, How it fails — and two of them
sit close to this one's. The distinction to hold and to state on the page: that table's unit of
comparison is an approach at run time and its cost column is machine cost per run; this table's
unit is a control's demand on a person, and its cost column is human attention per event. No row
is shared, because no row there is an oversight control.
**Closing line:** must not restate the Handbook's ("Hand over as little control as the problem
actually requires — and whatever you hand over, put a fence around it"). Proposed instead: *ask
for the smallest number of decisions a person can actually make well, and make each one
answerable in ten seconds.*

---

## The artifact

An **oversight plan** for one system the reader names. It is filled a field at a time as the
sections supply them, and shown at the end as plain text the reader can copy out. §01 supplies
the first two fields; every later section supplies one.

1. The system, and its most irreversible action.
2. Who is asked, and what the request tells them.
3. The interception point: plan, action, or after the fact.
4. The firing rate the reader will accept, and what they have decided to let through.
5. How a run is stopped, and what remains true afterwards.
6. The recovery for a wrong yes, by class.
7. Who is notified, at what threshold, and what happens on no answer.
8. What evidence would loosen the gate, and what would re-tighten it.

It is deliberately shaped to extend `course/stage9-project/artifact-template.md` §6,
"Irreversible gate", which asks three questions — most irreversible action, gate enforced before
it, evidence a model request cannot bypass it — and none of the eight above. A reader who has
done Build can paste this straight underneath. That is the intended relationship between the two
courses, and it is the reason the fields are ordered this way rather than by section number.

**Storage: none. Decided, not deferred.** The plan is a form and a textarea, and a reload
destroys it. The reader is told so, on the page, beside the copy-out control — an artifact the
reader must copy before leaving is honest; one that silently disappears is not. Persistence
would mean new browser storage on a site with an explicit non-goals list, and it is not worth
opening in the first release. If it is ever added, `lib/lab/draft.ts` is the precedent for how
narrow it must be — a versioned schema, explicit length caps, a decoder that rejects unknown
fields — and `tests/lab-draft.test.ts` is the neighbourhood the new assertions belong in.

---

## Evidence of completion

**There is no observer, and the section must not pretend otherwise.** This course is
`format: "read"` on a static export: no key, no terminal, no checker, and — by the decision
above — no storage. Nothing on the site can tell whether a reader finished.

So the criterion is written for the reader, not for the page: **you have finished when you can
answer all eight fields of the oversight plan for a system you named yourself, and you have
copied it somewhere.** Opening seven sections is not the same thing, and neither is moving the
§03 slider — not because the site will catch the difference, but because the plan is the only
thing that leaves with you.

**What the site records: nothing.** `selectCourseProgress` in `lib/progress.ts` returns
`{kind: "untracked", courseId, action: "unavailable", percent: null}` for any id that is not
`handbook`, `lab` or `build`, and `tests/progress.test.ts:477` asserts exactly that object,
under the test name "unavailable catalogue entries are untracked rather than fake zero
progress". Shipping `hitl` as `available` without touching that function is therefore safe and
honest: `components/courses/Catalog.tsx` skips the `.cprog` bar and falls to the final branch.
`c.hitl.evidence` says as much on the card.

One visible consequence the author should accept rather than discover: that final branch
renders the call to action **without** an arrow — `<span className="cgo" …>{cta(progress)}</span>`
at `Catalog.tsx:150`, against `{cta(progress)} <span className="arrow">→</span>` for a tracked
course. The `hitl` card will read "Start" with no arrow, beside three cards that have one.

Tracking is not a flag. Adding it means a branch in `selectCourseProgress`, widening the
`CourseProgress` union's course-id literals, a shape under the versioned learning state, and a
migration. Do not open that in the same change as the course.

---

## Catalogue facts

Four new keys. `c.hitl.title` and `c.hitl.blurb` already exist in all nine files and do not
change. `components/courses/Catalog.tsx` renders the `<dl className="course-facts">` only when
the course is not `soon`, so these four values, the `status` flip **and the `href` change from
`"#"` to `"/hitl/"`** land in the same commit — nine files, thirty-six values. Flipping to
`available` also publishes a structured-data `Course` claim: `app/[locale]/courses/page.tsx`
filters the JSON-LD `ItemList` on `status === "available"`, so the course becomes a claim to
crawlers in the same commit it becomes clickable.

| Key | English value | Words | Chars |
|---|---|---:|---:|
| `c.hitl.prerequisite` | The Handbook harness and graph sections. No key, no terminal, no code. | 12 | 70 |
| `c.hitl.outcome` | Place an approval where it still prevents harm, and make it answerable. | 12 | 71 |
| `c.hitl.artifact` | A one-page oversight plan for a system of your own, copied out as text. | 14 | 71 |
| `c.hitl.evidence` | The plan is the evidence; the site records nothing and claims no completion. | 13 | 76 |

All four sit inside the measured band of the nine shipped values (10–15 words, 61–86
characters). `prerequisite` names concrete prerequisites and then removes the doubt about
tooling in the same breath. `outcome` is verb-first and describes a capability. `artifact` is a
noun phrase naming something the reader can point at. `evidence` carries the negation, as all
three existing entries do.

These are the source text for eight translations. They contain no idiom, no assembled fragments
and no numbers that would need re-checking per language. "One-page" is the only compound worth
flagging to a translator: it means the length of the output, not a page of the website.

---

## What this course reuses

**Reusable as-is, no edit.**

- `lib/flowchart.ts` — typed boundary, `export default FC as FCEngine`, with `draw`, `strip`,
  `roundPath` and `anchor`. Browser-only. `FC.draw` writes `class="fc-n t-" + n.type` for any
  type string, and only `dec`, `tool` and `start` are drawn differently — `start` sets
  `rx:(n.type==='start'?Math.min(n.h/2,22):7)` at `lib/flowchart.ts:141`. A ninth node type
  therefore reaches the stylesheet through its `t-<type>` class without touching the engine,
  which is under the do-not-rewrite rule.
- `lib/handbook/copy.ts` — `makeCopy(locale, table)` takes any table, so the `C.t` / `C.h` /
  `C.p` contract, the escape-then-markers ordering and `trustedMarkup` transfer whole.
- `components/handbook/Handbook.tsx` as a pattern: markup rendered rather than assigned so a
  crawler and a no-JavaScript reader see the prose, widgets started once per body of markup,
  and a widget failure caught so the articles survive it.
- **The slider.** `.hb .slider-row` and `.hb input[type=range]{accent-color:var(--sec);width:150px}`
  at `app/globals.css:798–799` already ship the pattern §03 needs — slider, live value readout,
  one line of prose saying what dragging it costs — and they are theme-correct. The one
  constraint is that they are scoped under `.hb`; see the stylesheet decision below.
- `--brand-2`, and the eleven Handbook section hues (`--green`, `--blue`, `--teal`,
  `--magenta`, `--amber`, `--violet`, `--steel`, `--olive`, `--bronze`, `--indigo`, `--coral`).
  Each is already defined in all three theme blocks of `app/globals.css`. **This course claims
  no new colour.** The seven panels take seven of the existing eleven, and the person mark
  reuses the Handbook masthead's existing human-swatch colour rather than introducing a hue —
  so the three-block rule is satisfied without a new token. One `.t-person` rule beside
  `.hb .t-model` at `app/globals.css:665` is the whole of it.
- `components/courses/Cover.tsx`. A `hitl` motif already ships: two horizontal strokes at
  different opacities with an upright barrier between them, carrying a dot at head height. The
  design committed to the gate metaphor before the course did, and the outline above is written
  to honour it.

**Must be built.**

- **The course's own markup and behaviour.** `lib/handbook/markup.ts` and
  `lib/handbook/behaviour.ts` are under the do-not-rewrite rule and are the Handbook's, not a
  shared engine. A second course needs its own pair. Neither exists.
- **The stylesheet, and a scope decision — the largest single item.** Every rule the adopted
  panel shape needs is scoped under `.hb`: `.hb .panel` (606), `.hb .rule` (615), `.hb .plain`
  (617), `.hb .takes` / `.take` (715–717), the whole flowchart palette `.hb .fc-n` (657) and
  `.hb .t-start` … `.hb .t-idle` (663–670) — 414 `.hb`-scoped declarations in all.
  **Decision: the wrapper carries `class="hb hitl"`**, inheriting all of it, with one override.
  `.hb .rail-list::before` at `app/globals.css:593` hard-codes an eleven-stop gradient for
  eleven sections; `.hitl .rail-list::before` restates it with seven. Make this decision in the
  first commit, not the fifth.
- **Parameterising the localisation path.** `lib/handbook/localise.ts` is hard-bound to the
  Handbook: it does `import MARKUP from "./markup"`, computes `const SEGMENTS = walkHandbook(MARKUP)`
  once at module scope, and `localiseHandbook(locale)` takes only a locale before loading
  `messages/handbook/${locale}.json`. `loadWidgetCopy` in `lib/handbook/copy.ts` is bound the
  same way to `messages/widgets/${locale}.json`. Neither can be called for a second body of
  markup as written. Both need the markup and the table directory as arguments, and the
  `SEGMENTS` memo needs a key. Decide in the same edit whether this course's prose lives in
  `messages/handbook/` under a second key prefix or in a new directory, because that choice
  picks which of the two files changes shape.
- **The prose extraction.** `scripts/extract-handbook.mjs` hard-codes `lib/handbook/markup.ts`
  and `messages/handbook/en.json`, and the key prefix `hb.body.` is hard-coded in
  `lib/handbook/segments.mjs`. `walkHandbook(html)` itself takes a markup string and is
  otherwise generic. Parameterising that prefix is a small edit to a file that is *not* under
  the do-not-rewrite rule; `npm run handbook:check` will not cover the new course until someone
  extends it.
- **A widened string checker. Decided: widen it.** `scripts/check-widgets.mjs` reads exactly one
  behaviour file — `lib/handbook/behaviour.ts`, at line 30 — and fails at line 256 on any key in
  `messages/widgets/en.json` that no widget uses. It must take a **list of (behaviour, markup,
  table) triples**, not a list of behaviour files: the DOM-id proof and the unused-key proof are
  both meaningless unless the three move together. The alternative — accepting the unchecked
  `messages/*.json` gap the Lab already lives with — costs least now and most later, and is
  rejected for that reason.
- **A route and a component.** `app/[locale]/handbook/page.tsx` is 35 lines and is the model.
  Neither the page nor the client component exists.
- **A route-manifest entry.** `config/route-manifest.json` `localizedPaths` currently holds
  seven entries and `locales` holds nine, so adding one path adds nine exported pages and
  `npm run routes:check` fails until manifest and export agree. The current build emits 68
  pages — `routes:check` reports 66 public plus 2 internal — so this course takes it to 77.
  CLAUDE.md's "must pass and still emit 50 pages" line is **already wrong** and is being
  corrected in the same commit, not incremented: 50 was true before `build/` and `teach/`
  shipped and has not been true since.
- **A `lib/seo.ts` entry.** `PAGES` is a closed `as const` tuple with
  `type Page = (typeof PAGES)[number]`, and every page calls `seoFor({ locale, page })` against
  it. `app/sitemap.ts` maps the same tuple, so this entry is what puts the nine new URLs into
  the sitemap and into `alternatesFor`'s reciprocal hreflang set.
- **Everything modelled in §03 and §05.** The slider exists; the threshold model, the fatigue
  curve and the action classifier do not.

---

## Open questions

The four questions that would have blocked a contributor are closed above: the level stays
`intermediate` with a named prerequisite; the run-time strings go into `messages/widgets/` behind
a widened checker; the artifact does not persist; and four sections ship an interactive. What
remains is genuinely open.

1. **Does the person mark need its own hue after all?** The decision above reuses the masthead's
   human-swatch colour so that no token is added. If that colour reads badly inside a flowchart
   node at small sizes, the mark needs three new token definitions rather than one CSS rule, and
   the "no new colour" claim in this brief becomes false. Decide by drawing it, not by arguing.

2. **Does §07's comparison table survive contact with the §09 approach table?** The columnar
   distinction above is stated but not tested on a reader. If both tables read as "the
   comparison table" to someone who has just met them ten minutes apart, one of them should
   change shape.

3. **Where does the seven-stop rail gradient stop being worth it?** `.hb .rail-list::before` is
   hidden below the mobile breakpoint at `app/globals.css:990`. If the override is only visible
   on wide screens, it may be cheaper to accept the eleven-stop gradient truncated at seven than
   to carry a second rule.

**Closed, and recorded here so it is not reopened:** this course does **not** get a brief in the
Control Room. `lib/handbook/behaviour.ts:1703` reads `deck=shuffle(BRIEFS.slice()).slice(0,10)`
— ten of fourteen, sampled at random — so a fifteenth brief would lower every brief's appearance
rate from 10/14 to 10/15 while leaving the round counter correct. That alone would be tolerable.
The decisive fact is one line earlier: `ORDER` at `lib/handbook/behaviour.ts:1651` is
`['code','prompt','context','loop','graph','harness','evals','security']` — the answer set has
eight entries, so a brief whose correct answer is "human in the loop" cannot exist without a
ninth Handbook discipline. That would be a twelfth section, which moves `HANDBOOK_SECTION_IDS`
(`lib/progress.ts:18`) and falsifies "Eleven illustrated sections" in nine languages. The same
fact disposes of the alternative shape of this whole proposal: **this cannot be a Handbook
section, because its subject has no slot in the Handbook's answer set.**

---

## Honest limits

This course will not make the reader an operator. It teaches what a system must offer a person.
It cannot give them the experience of being paged at 03:00, and reading about approval fatigue
is not the same as feeling it on the fortieth request of a shift.

Every number in it is scripted, and the fatigue curve in §03 is invented. Its shape was chosen
to be legible, in the same way `lib/handbook/behaviour.ts` computes a teaching cost meter from
an invented formula. The page must say so where the readout is, not only here. Do not present
any of it as measured.

It will not tell the reader where to put their gate. The economics differ per system and the
course refuses to name a threshold. A reader looking for a rule will leave without one, and that
is the design.

It cannot check anything. `format: "read"`, static export, no key and no terminal mean there is
no equivalent of `course/check.ts` — nothing can tell the reader their plan is wrong. Unlike
Build, this course grades nothing, and its own catalogue evidence line says so.

**What will date:** the assumption that a person is available at all. §03 and §06 both assume
the approver is a human being who could in principle be woken. Approvals delegated to a second
model, or to a policy engine, are live and moving, and §06 will age fastest.

**What will not date:** the classification in §05 and the timing question in §02. Those are
properties of actions and of time, not of the current generation of tools.

**What will drift:** the boundary table above. It is true of `lib/handbook/markup.ts`,
`messages/widgets/en.json`, `messages/*.json` and `course/**` as of 2026-08-30. If a twelfth
Handbook section is ever added, or if §05's reviewer node ever becomes a person rather than
`kind:'m'`, rows in that table become wrong. Re-check it against all four before the first
commit, and do not trust it after that.
