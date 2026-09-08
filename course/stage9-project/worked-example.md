# A worked Stage 9 — the returns desk at a public library

This is one person's completed transfer project, filled into the template in
this folder. It exists because everything up to Stage 8 hands you a worked
example — the café — and Stage 8 is where it stops. Removing the scaffolding is
the point of Stage 9, but nobody had ever shown you what the finished thing
looks like, which is a strange moment to find out.

**Read it as one defensible answer, not the answer.** The rubric awards an
observable boundary, a proportionate control and honest evidence. It does not
award this domain, this shape, or these choices. A project that decides
differently and says why scores the same.

It is deliberately not perfect. It scores 11 of 12 on the rubric at the end,
and the row it loses is marked and explained rather than quietly fixed.

---

## 1. Domain and problem boundary

- **Domain I know:** the returns desk of a public library branch. I worked one
  for two years.
- **User and goal:** a library assistant, standing at the desk with a queue.
  They want the return logged and the exceptions surfaced, in one pass.
- **In scope:** reading what the patron says about a returned item, matching it
  to the open loan, proposing an action.
- **Explicitly out of scope:** anything about the patron other than this loan.
  Reservations, membership, and the shelving workflow are somebody else's
  system and stay that way.
- **Decisions the model may make:** what the patron's sentence means. "The
  cover came off in my bag" is a damage report; "I think my daughter has the
  other one" is a partial return with an unreturned item.
- **Decisions code must make:** which loan record matches, how many days
  overdue, what the fine arithmetic comes to. All three are exact, cheap and
  auditable, and a model has no business anywhere near them.
- **Decisions a person must make:** waiving a fine above five pounds, and
  declaring an item lost. Both are irreversible against the patron's record.

The boundary that took me longest to see: the model is doing reading
comprehension, not judgement. Everything that felt like judgement turned out to
be either arithmetic or a decision I was not willing to delegate.

---

## 2. Rules wall

- **Smallest deterministic version:** a keyword matcher. Look for "damaged",
  "lost", "torn", "wet"; anything else is a clean return.

- **Realistic input that breaks it:** an assistant typed, verbatim,

  > came back with the cover off, she says it was like that when she got it

  No keyword. Logged clean. The damage went unrecorded and the next borrower
  was charged for it — which is the failure that made me write this rather than
  add a rule.

- **Why another rule is not durable:** I added "cover off" and within a week had
  "spine's gone", "pages fell out", "it got rained on", "the dog". These are not
  variants of one phrasing; they are the open set of ways a person describes
  damage. I stopped at eleven rules and eight of the ten phrasings I collected
  from a fortnight of desk notes still missed.

---

## 3. Prompt and context

- **Prompt contract:** you are reading a returns note written by a library
  assistant. Report what was returned, its condition, and whether anything is
  unaccounted for. Never decide a fine. Never decide an item is lost.

- **Context the model needs:** the open loan record for that patron — titles,
  due dates, how many items. Without it the model invents plausible titles,
  which is the same failure the café has with prices, and it took me an
  embarrassingly long time to recognise it as the same failure.

- **Context deliberately withheld:** borrowing history, address, anything about
  other patrons. None of it improves the reading and all of it would be sent to
  a third party. The loan record goes out with the patron's name stripped and a
  local id substituted.

- **Required output shape and validation:** a JSON object with the returned
  items, a condition for each, an unaccounted list, and a flag for human review.
  Validated against a schema before anything acts on it. A reply that does not
  parse is a failure, not a retry — a retry on a malformed reply spent real
  money twice for the same answer, once.

---

## 4. Minimal eval

- **Cases:** twenty real returns notes, copied from a fortnight at the desk with
  names removed. Fourteen are checked by an exact rule; six need a judge,
  because "did it correctly report nothing was wrong?" has no equality test.

- **Scoring rule:** a case passes when the returned titles match the loan record
  exactly, the condition matches what I recorded at the time, and the human-
  review flag is set for every case that needed a person.

- **Baseline prediction and reason:** 9 of 20. I expected the plain returns to
  work and the damage phrasings to fail, and there were eleven plain ones.

- **Baseline result:** **8 of 20.** One of the plain returns failed too: a
  two-item return where the patron named only one title, and the model reported
  one item returned rather than one returned and one outstanding.

- **One failed case trace:**

  ```text
  case: partial-return-unnamed
  note: "bringing back the Pratchett, the other one's still at home"
  loan: [Guards! Guards!, The Hobbit]
  got:  items=[Guards! Guards!]            unaccounted=[]
  want: items=[Guards! Guards!]            unaccounted=[The Hobbit]
  why:  the model reported what was returned and stopped; nothing asked it
        to reconcile the loan record against the note.
  ```

- **One change:** put the open loan record in the prompt and ask explicitly for
  anything on it that was not mentioned.

- **Second prediction and reason:** 15 of 20. I expected the partial returns to
  come right and the damage phrasings to stay hard.

- **Second result, including regressions:** **16 of 20 — and one regression.**
  The case `clean-return-no-note`, an empty note against a single-item loan,
  passed at baseline and now fails: with the loan record in the prompt the model
  began reporting the item as returned *and* flagging it for review, because the
  note said nothing to confirm the condition. Net +8, and I would ship it, but
  the report card says 16 and the honest sentence is "16, and it got worse at
  the one thing it already did".

---

## 5. Loop, tools and limits

- **Available tools:** one to look up the open loan by card number, one to write
  the return. The write is behind the gate in section 6.
- **Expected tool failure:** the loan lookup is a request to the catalogue
  service, and the catalogue service is down most Tuesday mornings for reasons
  nobody has ever explained to me. It times out rather than erroring, which is
  worse.
- **Step, time and cost limit:** four steps, twenty seconds, and the loop refuses
  to start a second lookup for the same card in one pass. The step limit is not
  a safety net, it is the design — at four steps a stuck run comes back to the
  assistant in the time it takes to say "one moment".
- **Recovery or safe-stop behaviour:** on a lookup failure the run stops and
  hands the assistant the note and the card number. It does not guess the loan.
  A wrong loan record is worse than no loan record, because the wrong one looks
  finished.

---

## 6. Irreversible gate

- **Most irreversible action:** waiving a fine, and declaring an item lost. Both
  write to the patron's record, both are visible to them, and neither is undone
  by an apology.

- **Gate enforced before that action:** the write tool takes a waiver amount and
  refuses any value above five pounds unless a supervisor id is present. The
  check is the first thing in the function, before any network call, and the
  supervisor id comes from the desk login rather than from anything the model
  produced.

- **Evidence a model request cannot bypass it:**

  ```text
  $ node check-gate.mjs
  waive £3.00, no supervisor   -> allowed
  waive £8.50, no supervisor   -> REFUSED (needs a supervisor)
  waive £8.50, supervisor=desk4 -> allowed
  model asks to waive £8.50 with supervisor_id in its own JSON
                               -> REFUSED (field ignored: not from the model)
  ```

  The last line is the one that matters. The model can ask for the supervisor
  field; the tool does not read it from there.

---

## 7. Trust boundaries

- **Provider and data sent:** one commercial model provider. What leaves the
  building is the returns note and the loan record with the patron's name
  replaced by a local id. Titles do go out, which is a real disclosure and I
  decided it was acceptable for a public lending catalogue. Someone at a medical
  library should decide differently.
- **Secrets and storage lifetime:** the key is in the desk machine's environment,
  not in the repository, and is rotated when a member of staff leaves.
- **Tools and external systems:** the catalogue service, on the internal network.
  The model never talks to it; the harness does.
- **Untrusted inputs:** the returns note. It is typed by staff but it quotes
  patrons, so it is the sentence a stranger wrote. It is labelled as data in the
  prompt, and section 6's gate is what actually holds if that labelling fails.
- **Analytics, logging and diagnostics:** **this is the row I did not do
  properly.** The run log writes the note and the model's reply to a local file
  so I can debug a bad reading, which means a patron's words sit on a desk
  machine for as long as nobody clears it. I have not decided a retention
  period, I have not asked whether the branch's own policy already covers it,
  and I only noticed while filling in this section. It is written down here
  rather than tidied away because that is the honest state.

---

## 8. Retrospective

- **What failed:** the first version reported what it was told and never
  reconciled it against the loan record, so partial returns looked like complete
  ones. That is the same failure as the café inventing prices — the model was
  never given the thing it was being asked about — and I did not recognise it
  until I had the number in front of me.
- **What improved:** 8 to 16 of 20, entirely from putting the loan record in the
  prompt. No prompt wording I tried moved it more than one case.
- **What regressed:** the clean single-item return, described in section 4. One
  case, and a one-case change is inside the noise of a twenty-case set — which
  means I do not actually know whether it regressed or whether I got unlucky. I
  am recording it as a regression because assuming the flattering reading is how
  you end up with a suite you cannot trust.
- **Cost and latency trade-off:** about a third of a penny per return and
  roughly two seconds. At the volume of one branch that is nothing. The reason
  to keep the fine arithmetic in code is not cost, it is that arithmetic in a
  model is a coin flip you pay for.
- **What remains unknown:** whether twenty cases are enough to see a real change
  — I do not think they are. Whether the damage phrasings that still fail share
  a shape I could name. And the retention question in section 7.
- **Smallest useful next test:** collect the next twenty returns notes without
  looking at them first, run the current version, and see whether 16 of 20
  holds on cases I did not choose. Everything above is measured on the set I
  built from the failures I already knew about, which is the most flattering set
  that exists.

---

## Self-score against the rubric

Filled in honestly, including the row that is not a 2.

| Criterion | Score | Why |
|---|---:|---|
| Problem boundary | 2 | Goal, non-goals, and the model/code/person split are all named, with the fine arithmetic explicitly refused to the model |
| Failure input | 2 | A verbatim note that reliably defeats the keyword version, and the count of how many rules failed to fix it |
| Minimal eval | 2 | Twenty real cases, a stated scoring rule, both predictions recorded before the runs, and the regression kept |
| Irreversible gate | 2 | The refusal runs before the network call and ignores the field when the model supplies it, with output showing all four paths |
| Trust boundaries | **1** | Provider, secrets, tools and untrusted input are mapped. The logging boundary is identified and **not** resolved — no retention decision, no check against branch policy |
| Reflection | 2 | Failure, improvement, a regression that is honestly inside the noise, cost, and a next test designed to be less flattering than the last |

**11 of 12.** The missing point is real and the fix is not a paragraph — it is a
decision about somebody else's data that I should make with the branch manager
rather than alone. A project that scored 12 by writing "logs are local, so this
is fine" would have scored worse and known less.

---

## What to take from this

Three things, none of which are about libraries.

**The number came before the prompt engineering.** Eight of twenty is not a
verdict on the model, it is a starting position, and it is what made the missing
loan record visible. Guessing at wording without it would have felt like
progress.

**The gate is code, not instruction.** Section 6 would score a 1 if it said
"the prompt tells the model not to waive large fines". It scores a 2 because the
tool refuses, first line, before the network, and ignores the field when the
model tries to supply it.

**The retrospective is where the marks are, and where the learning is.** The
regression, the one-case noise, and the unresolved logging boundary are all
things it would have been easy not to write down. Writing them down is what
makes the rest of the document worth reading.
