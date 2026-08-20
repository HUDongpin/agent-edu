# Transfer project rubric

Score each criterion **0 absent · 1 partial · 2 evidenced**. A score is a review aid, not a claim of mastery.

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| Problem boundary | Missing or unlimited | Goal named, authority vague | Goal, non-goals and model/code/person authority explicit |
| Failure input | Happy path only | Failure named but not reproducible | Concrete input reliably exposes the weakness |
| Minimal eval | Selected good outputs | Cases exist without decision rule | Cases, expected evidence and scoring rule inspectable |
| Irreversible gate | No enforced gate | Warning or prompt-only request | Code/person gate executes before the action and cannot be bypassed by model text |
| Trust boundaries | Not identified | Provider or tool named | Provider, tools, secrets, storage and untrusted input mapped |
| Reflection | Success claim only | One limitation named | Failures, regressions, cost, trade-offs, unknowns and next test discussed |

## Acceptable evidence

- secret-free console output;
- a small Markdown or JSON eval result;
- a link to the relevant code/commit;
- one redacted failed-case trace;
- a local report card;
- a diagram showing an enforced boundary, paired with code or a runnable check.

Evidence does not need to be long. It does need to let another person test the claim. Never submit a live key, Authorization header, raw Provider body or identifiable personal record.

## Review prompts

- Is a claimed guarantee actually enforced in code, or merely requested in a prompt?
- Does the eval include at least one likely failure and one boundary/hostile case?
- Would a lower-cost or deterministic method satisfy the same goal?
- What happens when the Provider, tool or network fails after a request may have been sent?
- Which conclusion is supported by the evidence, and which remains a hypothesis?
