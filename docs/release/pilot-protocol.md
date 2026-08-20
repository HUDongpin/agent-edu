# Six-learner and three-teacher pilot protocol

This later pilot evaluates independent use without adding accounts, reminders,
product telemetry, or behavioral analytics. Evidence comes only from consented
observation sheets, local learner artifacts, and interviews.

Protocol version: `1.1`. Freeze the tested commit, static deployment and this
protocol version before recruitment. Product changes after the first participant
require a new pilot run; do not mix results from materially different builds.

## Participants and roles

- Six target learners who are new to agentic engineering; record anonymous IDs
  `L1`–`L6`, relevant background band, and accessibility needs.
- Three teachers using the materials for the first time; record anonymous IDs
  `T1`–`T3` and teaching context.
- One facilitator and one observer. Neither may complete steps for participants.
- Obtain consent and provide a withdrawal path. Do not collect Provider
  credentials, Prompts/replies, or unnecessary personal data.

## Consent, accessibility and local custody

Before any task, give each participant a plain-language local consent sheet
covering purpose, tasks, expected duration, voluntary participation, the right
to stop without penalty, the exact observations retained and the deletion date.
Name the local data custodian and storage location. A participant may ask for
their row and local artifacts to be deleted until the aggregate report is
finalized; record the request without retaining a reason.

Accessibility accommodations are not assistance. Record the accommodation
needed to make the task perceivable or operable, but do not record a diagnosis.
If this pilot is run as research or inside an institution, the responsible
organization must decide whether ethics/IRB or other data-governance review is
required. This repository protocol is not that approval.

Retention fields to complete before recruitment:

- Local custodian and encrypted storage location:
- Participant-row deletion deadline:
- Aggregate-report retention period:
- Consent form version and approval reference, if applicable:

## Learner protocol

Each learner works independently before any interview prompting:

1. Navigate from the home page through the course and explain cost/privacy boundaries.
2. Choose an appropriate method in a new scenario and explain who controls each decision.
3. Complete the rules → prompt → Eval journey, including interpreting a low score.
4. Refresh, recover a saved draft, and explain what was and was not stored.
5. Recover from one staged, non-sensitive error using the product guidance.
6. Run offline TypeScript Stage 0 without a Provider credential.
7. Transfer the method to two unfamiliar scenarios and explain the control boundary.

For every task, record independent completion, time band, observable blocker,
help requested, and artifact reference. Do not record sensitive model content.

### Fixed unfamiliar-scenario cards

Use both cards so every learner receives the same decision evidence. Alternate
their order: learners with odd IDs receive A then B; even IDs receive B then A.

**Card A — community library event enquiries.** A library receives free-text
questions about event dates, accessibility, age limits and cancellations. The
published calendar is authoritative. The system may draft a reply, but it may
not invent an event, promise an accommodation or cancel a booking. Ask the
learner to choose a method, name the information the model needs, propose one
minimal eval and place the final-action gate.

**Card B — school equipment reimbursement.** Staff submit free-text requests
for equipment reimbursement. Written policy fixes eligible categories and a
maximum amount; ambiguous cases require a finance officer. The system may
extract evidence and draft a recommendation, but it may not approve payment.
Ask the learner to choose a method, name one failure input, propose one minimal
eval and place the irreversible-action gate.

Do not tell participants that one card "is a graph" or "is a prompt". More
than one implementation can be defensible; score the control reasoning below.

### Staged, non-sensitive recovery task

Before the assigned learner opens the Lab, the facilitator places malformed
draft text under `ae.lab.draft.v1` in the disposable pilot browser profile. No
credential, Prompt or reply is used. The learner succeeds by reaching an
operable default Lab, recognizing that the damaged local draft was ignored,
and using **Clear draft** before continuing. If the facilitator must open
developer tools or tell the learner which button to press, record task help.

For teachers, use a separate offline setup card: the supplied Stage 0 file has
an empty `QUESTION`. Success means the teacher locates the Build guide, edits
the TODO, runs `npx tsx course/check.ts 0 --offline`, and recognizes
`stage 0 complete.` without entering a Provider key.

### Operational definitions

- **Independent:** completed using only the product, supplied task card and
  ordinary assistive technology; no task-specific hint from facilitator.
- **Clarification:** the facilitator may repeat the task verbatim or explain a
  device control. It is recorded but does not by itself negate independence.
- **Help:** any hint naming the next product location, control, answer category
  or recovery action. A helped completion is not independent.
- **Blocker:** the participant cannot proceed after ten minutes with available
  product guidance, abandons the task, encounters an undisclosed charge/privacy
  risk, or requires the facilitator to perform a learning step.
- **Time bands:** `<5 min`, `5–10 min`, `>10 min`, or `not completed`. Record a
  band, not a precise behavioral timestamp.
- **Correct control boundary:** names what the model may decide, what code or a
  person must retain, and why the retained action is consequential.
- **Correct method explanation:** connects the choice to variability,
  iteration and control needs; naming a fashionable framework without that
  reasoning does not pass.

## Teacher protocol

Each first-time teacher must independently locate and explain:

1. the no-credential/offline teaching path;
2. the pre-class checklist and 45/90/180-minute options; and
3. the worksheet/project scoring materials and acceptable-evidence rubric.

Interview whether the material supports facilitation without implying a single
correct open-ended Agent design.

Teachers complete their locating tasks before seeing `TEACHING.md` or receiving
a tour. The interview begins only after all tasks so it cannot teach answers
that are later scored as independent performance.

## Observer codebook and review

For each unfamiliar scenario, score the following 0–2; the method name itself
is not scored:

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Model authority | Unlimited or absent | One boundary named | Allowed and prohibited decisions are explicit |
| Grounding | No authoritative source | Source named | Source plus missing/ambiguous-data behavior stated |
| Minimal eval | Happy path only | Failure case without rule | Failure input, expected evidence and inspectable rule |
| Irreversible gate | Prompt warning only | Human/code mentioned after action | Enforced check before cancellation/payment or equivalent action |
| Trade-off | Claims one best method | One limitation named | Explains what control, cost or flexibility the choice changes |

A scenario passes when **model authority** and **irreversible gate** each score
2 and the learner can explain the choice in their own words. An observer marks
the evidence heard, not an inferred intention.

Before the pilot, both observers independently score the two supplied exemplar
responses below and resolve disagreements by the codebook. During the pilot,
the second observer re-scores at least two learner scenario records and all
borderline pass/fail decisions. Report the number of disagreements and their
resolution; do not average away a release-relevant disagreement.

- **Passing exemplar:** "The model may classify the request and draft a reply
  from the published policy, but code checks the amount and a finance officer
  approves ambiguous or payable cases before any payment instruction. I would
  test a missing receipt and a request just over the limit."
- **Failing exemplar:** "Use an agent because it is flexible. Tell it to follow
  policy and let it approve routine cases." This has no inspectable gate or
  failure evidence.

## Exit metrics

| Metric | Required threshold |
|---|---:|
| Navigation, cost, or privacy blockers | 0 |
| Learners independently complete the core journey | at least 5/6 |
| Learners correctly explain control boundaries in both new scenarios | at least 4/6 |
| Teachers find the no-credential path, checklist, and scoring materials | 3/3 |

All four thresholds must pass. Report denominators and withdrawals explicitly;
do not silently replace participants or change a denominator. A privacy/security
incident, unexpected real charge, or credential exposure stops the session and
the pilot remains failed until remediated and rerun under a new protocol version.

## Observation and interview record

| Participant | Task | Independent? | Blocker/help | Local artifact ID | Observer note |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

Use one row per task. Add `time band`, `scenario dimension scores`,
`accommodation`, and `second-review outcome` as separate columns in the local
working copy. Artifact IDs must be opaque local references; never paste the
artifact content into this repository.

After tasks, use a short interview to distinguish comprehension from lucky
completion. Aggregate results only. Store no account identifier, credential,
Prompt/reply, Provider body, or product telemetry.

## Pilot conclusion

- Protocol version and release commit:
- Dates and setting:
- Recruitment/withdrawal summary:
- Metric results with numerators and denominators:
- Overall result: pass / fail
- Required product/content changes:
- Pilot record ID:
- Facilitator and independent reviewer references:

## Metric calculation record

Complete this table from the participant rows; never fill it from memory.

| Metric | Numerator | Denominator | Withdrawals | Result |
|---|---:|---:|---:|---|
| Navigation/cost/privacy blockers |  | all completed learner and teacher tasks |  | must equal 0 |
| Learners independently complete core journey |  | 6 |  | must be at least 5/6 |
| Learners pass both unfamiliar scenarios |  | 6 |  | must be at least 4/6 |
| Teachers independently find all three material groups |  | 3 |  | must equal 3/3 |

Do not replace a withdrawn participant silently. If recruitment must continue,
record the original withdrawal and use a new anonymous ID; report both the
planned and observed denominators. Any protocol deviation is listed before the
overall conclusion and reviewed for whether a full rerun is required.

Automated tests can establish deterministic behavior but cannot replace this
observed learner/teacher evidence.
