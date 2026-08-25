# Agent transfer artifact

## 1. Domain and problem boundary

- Domain I know:
- User and goal:
- In scope:
- Explicitly out of scope:
- Decision(s) the model may make:
- Decision(s) code must make:
- Decision(s) a person must make:

## 2. Rules wall

- Smallest deterministic/rules version:
- Realistic input that breaks it:
- Why another rule is not a durable solution:

## 3. Prompt and context

- Prompt/system contract:
- Context the model needs:
- Context deliberately withheld, and why:
- Required output shape and validation:

## 4. Minimal eval

- Link to `eval-template.json` or equivalent:
- Scoring rule:
- Baseline prediction and reason:
- Baseline result:
- One failed case trace:
- One change:
- Second prediction and reason:
- Second result, including regressions:

## 5. Loop, tools and limits

- Available tool(s):
- Expected tool failure:
- Step/time/cost limit:
- Recovery or safe-stop behaviour:

## 6. Irreversible gate

- Most irreversible action:
- Gate enforced before that action:
- Evidence that a model request cannot bypass it:

## 7. Trust boundaries

- Model Provider and data sent:
- Secrets and storage lifetime:
- Tools/external systems:
- Untrusted inputs:
- Analytics/logging/diagnostic boundary:

## 8. Retrospective

- What failed:
- What improved:
- What regressed:
- Cost/latency trade-off:
- What remains unknown:
- Smallest useful next test:
