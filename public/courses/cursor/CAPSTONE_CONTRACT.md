# Course 4 capstone self-check contract

Version: 1.0.0<br>
Receipt schema: `aicourse.cursor.capstone.v1`<br>
Fixture version: `1`

This document defines the aicourse.top Course 4 capstone checker. It is a
course-owned assessment artifact, not Cursor product documentation.

## Two different SHA-256 values

- Download archive SHA-256:
  `4d7623fee2771309cac1d87c33da30883bec58938bcdc67a8f3995156f31a34e`
- Internal `course-fixture.json` SHA-256:
  `3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b`

Verify the downloaded ZIP with the first value. The receipt's
`fixtureSha256` field must use the second value. The two values identify
different byte sequences and must not be compared with each other.

## Accepted receipt shape

The browser checker accepts only a JSON object with exactly these top-level
fields:

```json
{
  "schema": "aicourse.cursor.capstone.v1",
  "fixtureVersion": "1",
  "fixtureSha256": "3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b",
  "checks": {
    "tests": true,
    "lint": true,
    "build": true,
    "routesPreserved": true,
    "keyboardBehavior": true,
    "noNewDependencies": true
  }
}
```

The `checks` object must contain exactly those six Boolean keys and every value
must be `true`. The bundled verifier removes an older `course-receipt.json`
before running current checks, and writes a new one only when all six checks
pass.

## Visible learner self-assessment

Before the browser accepts a receipt, the course requires the learner to mark
all six evidence-packet artifacts as present and apply five visible weighted
criteria: scope 20, safety 20, implementation 20, verification 25, and handoff
15. The displayed score must reach 80/100, and both the safety and verification
criteria must be satisfied. This is a learner self-assessment, not a site review
or attestation.

The isolated browser record `aicourse.cursor.progress.v1` contains only the
Boolean milestone `cursor.capstone.v1`, a `cursor.capstoneMeta.v1` object made
from the public receipt schema, receipt
version, fixture version, fixture hash, and required-check names, and a
`cursor.capstoneAssessment.v1` object containing the selected public artifact
IDs, selected public rubric IDs, and derived score. The assessment companion
preserves an actual passing score such as 80/100 instead of reconstructing it as
100/100 after reload. Storage never contains pasted receipt text, file paths,
command output, or logs. A missing, internally inconsistent, or mismatched
companion object invalidates the saved milestone and requires the learner to run
the current self-check again.

## Trust boundary

The receipt is an unsigned local structural self-check. It records declared
results from the bundled verifier; it is not proof that commands ran, is not an
identity credential, does not attest a particular machine or checkout, and
does not authenticate the diff or logs. A learner must retain the reviewed
diff, fresh command output, Browser observation, limitations, and human-readable
handoff as a separate evidence packet. Hand-editing the receipt or verifier
invalidates the exercise even if the resulting JSON has the accepted shape.

The fixture and this checker are educational materials from aicourse.top.
aicourse.top is independent of Cursor and is not affiliated with or endorsed by
Cursor or Anysphere, Inc.
