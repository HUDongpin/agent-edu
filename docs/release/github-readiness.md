# GitHub required-check and stability evidence

The release needs both job names—`quality` and `smoke-chromium`—configured as
required checks, plus three consecutive green runs on the integration/main
history that contains the release candidate.

## Branch protection

- Protected branch:
- Ruleset/branch-protection record ID:
- `quality` required: yes / no
- `smoke-chromium` required: yes / no
- Administrators/bypass behavior reviewed:
- Checked at (UTC):
- Reviewer reference:

A green workflow run does not prove that GitHub requires it. Record this as a
separate evidence item.

## Consecutive stable runs

| Sequence | Commit SHA | GitHub run ID | `quality` | `smoke-chromium` | Completed at UTC | Result |
|---:|---|---|---|---|---|---|
| 1 |  |  | pending | pending |  | pending |
| 2 |  |  | pending | pending |  | pending |
| 3 |  |  | pending | pending |  | pending |

The runs must be consecutive and use the same workflow definitions. A rerun that
only turns a flaky failure green restarts the three-run sequence unless the
failure is explained and the underlying cause is fixed. Store public run IDs,
not authenticated, signed, or token-bearing URLs.

- Overall result: pass / fail
- Evidence sanitization confirmed by:
- Completed at (UTC):
