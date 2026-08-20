# Six-learner and three-teacher pilot protocol

This later pilot evaluates independent use without adding accounts, reminders,
product telemetry, or behavioral analytics. Evidence comes only from consented
observation sheets, local learner artifacts, and interviews.

## Participants and roles

- Six target learners who are new to agentic engineering; record anonymous IDs
  `L1`–`L6`, relevant background band, and accessibility needs.
- Three teachers using the materials for the first time; record anonymous IDs
  `T1`–`T3` and teaching context.
- One facilitator and one observer. Neither may complete steps for participants.
- Obtain consent and provide a withdrawal path. Do not collect Provider
  credentials, Prompts/replies, or unnecessary personal data.

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

## Teacher protocol

Each first-time teacher must independently locate and explain:

1. the no-credential/offline teaching path;
2. the pre-class checklist and 45/90/180-minute options; and
3. the worksheet/project scoring materials and acceptable-evidence rubric.

Interview whether the material supports facilitation without implying a single
correct open-ended Agent design.

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

Automated tests can establish deterministic behavior but cannot replace this
observed learner/teacher evidence.
