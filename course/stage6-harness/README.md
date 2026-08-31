# Stage 6 — the machine around it

**Stage 6 of 10** · Previous: [Stage 5 — let it act](../stage5-loop/README.md) ·
[Course index](../README.md) · Next: [Stage 7 — guarantee the check happens](../stage7-graph/README.md)

**Goal:** turn stage 5's demo into something you would leave running overnight. No prompt changes. No model changes.

```bash
npx tsx course/stage6-harness/run.ts
```

Four `TODO`s, one per harness part. Then:

```bash
npx tsx course/check.ts 6
```

## What to notice

`run.ts` runs the same job five times: once with everything on, then once with each of the four parts switched off. The model, the prompt and the tools are **identical** in every run. Only the code around them changes.

| Part off | What the morning looks like |
|---|---|
| retry | the first thrown tool error leaves the harness in this fixture |
| useful errors | the model receives only `Error`; any later action is run-dependent |
| permission gate | the code no longer blocks an over-threshold order before execution |
| run log | the run leaves no local event trail for later inspection |

The bundled offline fixture makes the contrasts reproducible. A live model's
drafts and follow-up actions can differ. Run the checker once and read the
actual output; **do not rerun it to force a preferred model behavior**.

When someone says "the model failed", it is very often this file that failed.

## The one that matters most

The **permission gate**. Everything else costs you a bad night; this one costs money you cannot get back.

Note where it lives: in the code that *executes* the tool, not in the prompt. "Never order more than £100 without asking" written in a system prompt is a request. The same rule written as an `if` in your tool runner is a guarantee. A model can be talked out of a request. It cannot be talked out of an `if`.

## Cheap and boring beats clever

None of this is interesting code. A retry is four lines. A timeout is one argument. That is the point: reliability comes from unglamorous plumbing that nobody demos, which is exactly why it is the first thing skipped and the first thing missed.

---

**Stage 6 of 10** · Previous: [Stage 5 — let it act](../stage5-loop/README.md) ·
[Course index](../README.md) · Next: [Stage 7 — guarantee the check happens](../stage7-graph/README.md)
