# Two-learner dry run

## What this is not

This is **not** the pilot, and nothing produced by it is release evidence. It
cannot satisfy the pilot gate in `config/release-readiness.json`, and it does
not change release status. The release instrument is the six-learner protocol
in `docs/release/pilot-protocol.md`, version 1.4, and it is unchanged by this
document.

That protocol defines its release metric as `sum(yes) / 6` and says not to
replace participants or change a denominator. Two learners therefore produce no
metric at all — not a rate, not a ratio, not an "N of M". A dry run that
reported one would be inventing the very number the protocol was written to
make reproducible.

## What it is for

The six-learner pilot has never run. It costs nine consented people, a
facilitator and two observers, and a frozen build — and the first run of any
protocol spends part of that budget discovering that a task card is ambiguous,
that an observation column is hard to fill in live, or that a product blocker
sits so early that every later task inherits it.

A dry run with two learners and one teacher buys that discovery cheaply, so the
real pilot spends its six learners on the product rather than on the protocol.

## What it can and cannot conclude

It can conclude:

- **Observed blockers.** Anything that stopped a learner is a defect, and one
  learner hitting it is enough to justify a fix. Each becomes an issue or a PR.
- **Ambiguity in the materials.** A task card two learners read differently is a
  card to rewrite before six learners meet it.
- **An order-of-magnitude check on duration.** Whether a part takes ten minutes
  or ninety, against the "about four hours" in `README.md`.
- **Whether the facilitator kit works** — consent, recording, custody.

It cannot conclude:

- any rate, ratio, percentage, threshold or pass/fail for the release;
- that a task is *not* a blocker, because two learners finding nothing is not
  evidence of absence;
- anything about a build other than the frozen one named below;
- anything about the Lab's paid path or about installing the toolchain, neither
  of which this run exercises — see the fixed conditions under "Tasks".

## Participants

Two learners new to agentic engineering (`L1`, `L2`) and one teacher (`T1`), and
one facilitator. Anonymous IDs only.

Consent, accessibility, local custody and retention follow the full protocol
without modification — see "Consent, accessibility and local custody" in
`docs/release/pilot-protocol.md`. A dry run collects the same kinds of
observation about the same kinds of person, so it earns no shortcut: the
consent sheet in appendix A is the full one, narrowed to this run's scale and
purpose.

## Tasks

Use the task list and the fixed scenario cards from
`docs/release/pilot-protocol.md` **verbatim and by reference**. They are
deliberately not restated here: a second copy would drift from the first, and a
dry run measuring a different card than the pilot teaches nothing about the
pilot.

Run `C1`–`C6` with both learners, and the teacher path with `T1`. `X-A` and
`X-B` are optional at this scale; run them only if `C1`–`C6` produced few
findings.

Two conditions are fixed below rather than left to the day. Both learners meet
the same ones, or their rows describe different tasks.

### C3 runs without a key

No learner is given a Provider credential, and none is asked for one. The Lab's
paid steps stay locked, so the scored journey C3 names is not on offer: what a
keyless reader gets is the scripted run, a fixed recording that does not use
the prompt they wrote. Record C3 as complete, **for this run only**, when the
learner writes at least one rule on the wall, writes a prompt, opens the
scripted run, and explains why the cases failed without the menu and what
changed once it was there.

That is a narrower task than the protocol's C3, and it is deliberately not a
change to the protocol: version 1.4 still reads as it does, and whether the
six-learner pilot runs C3 with a credential is still open. Informing that
decision is one of the things this dry run is for. Keyless buys the rest of the
journey for nothing, keeps credentials out of a session whose consent sheet
promises none are recorded, and cannot trip the unexpected-charge stop rule.
What it cannot do is tell anyone whether the paid path works for a real
learner; that needs its own run, before the pilot, with a low-limit credential
the facilitator owns and revokes.

### C6 runs on a prepared machine

C6 is the transfer from a website to the learner's own machine, not the
installation of a toolchain. The facilitator supplies the machine, with Node
24.x and Git installed, the repository cloned at the commit under test and
`npm ci` already run. Install time is not part of C6.

Left to the learner, the install is several hundred megabytes; on venue
wireless it can pass the ten-minute Blocker rule on its own, and the row would
then record a blocker about broadband rather than about the course. Whether a
beginner can install Node at all is a real question, and a different one: two
learners is not how it gets answered.

## Recording

One row per participant per task, with the columns the full protocol names.
Record the observable — completed, independent, help, blocker, time band,
artifact reference — and no sensitive model content, no credentials, no prompts
or replies.

Stop rules are the protocol's: a privacy or security incident, an unexpected
real charge, or credential exposure ends the session.

## Output

A findings list, in this repository, as issues or pull requests. No evidence
JSON, no entry in `config/release-readiness.json`, no status change anywhere.
If the dry run produces product changes, the six-learner pilot must run against
a build that includes them — which is the point of doing this first.

## Frozen target

Fill in before recruiting, and do not change mid-run:

- Commit under test:
- Deployment under test:
- Dry-run date:
- Facilitator:
- Lab key: none. Both learners run keyless — see "C3 runs without a key".
- Learner machine: facilitator-supplied, Node 24.x and Git installed,
  repository cloned at the commit under test, `npm ci` already run. Install
  time is not part of C6.
- Local custodian and storage location:
- Participant-row deletion deadline:

C5 stages a damaged local draft and asks the learner to notice that it was
ignored. The Lab only says so from the commit that added `lab.draft.damaged`,
so check the commit under test carries it — `git log -S lab.draft.damaged` —
or C5 measures the facilitator instead of the product.

## Appendix A — consent sheet

> **What this is.** You are helping test a free online course before a larger
> study. You will work through some tasks on a website while someone watches and
> takes notes.
>
> **How long.** About two hours. You may stop at any time, for any reason, and
> nothing happens if you do.
>
> **What is recorded.** Whether you finished each task, whether you asked for
> help, anything that blocked you, roughly how long each task took, and notes on
> what you said about the task. Your name is not recorded; you are `L1` or `L2`
> in every note.
>
> **What is never recorded.** No account details, no API keys, no payment
> details, and nothing you type into the model or it types back.
>
> **Accessibility.** Tell us what you need to use the site. We record the
> adjustment, never a diagnosis or a health detail.
>
> **Your data.** Held by the custodian named above, at the location named above,
> and deleted on the date named above. You can ask for your notes to be deleted
> at any point before the findings are written up; you do not have to say why.
>
> **This is not research approval.** If this is ever run inside an institution
> or as research, that organisation decides whether ethics review is needed.
>
> Participant ID: ______   Date: ______   Consent given: ______

## Appendix B — observation sheet

| Participant | Task ID | Completed? | Independent? | Help? | Blocker? | Time band | Artifact ID | Note |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

## Appendix C — prechecks before recruiting

Machine-checkable preconditions. Run them on the frozen commit and record the
output; they are not evidence about learners, only proof that the tasks are
runnable at all.

| Check | Command | Covers |
|---|---|---|
| The offline path needs no credential | `npm run course:offline` | `C6` |
| Stage 0 itself completes offline | fill `QUESTION` in the prepared clone, then `npx tsx course/check.ts 0 --offline` | `C6` |
| The site builds and exports | `npm run build` | every task |
| Routes and artifacts are present | `npm run routes:check` | `C1` |
| The Lab's scripted run exists for a keyless reader | `node --import tsx --test tests/lab-integration.test.ts` | `C3` |

On 2026-09-20, against commit `93e0a3d8`, `npm run course:offline` reported
`no API key is required`, `the scripted local response is available` and
`offline — no tokens spent`.
