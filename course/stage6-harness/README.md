# Stage 6 — the machine around it

**Goal:** turn stage 5's demo into something you would leave running overnight. No prompt changes. No model changes.

```bash
npx tsx course/stage6-harness/run.ts
```

Four `TODO`s, one per harness part. Then:

```bash
npx tsx course/check.ts 6
```

## What to notice

`run.ts` runs the same job four times, switching one part off each time. The model, the prompt and the tools are **identical** in every run. Only the code around them changes.

| Part off | What the morning looks like |
|---|---|
| retry | one flaky network call ends the whole run |
| useful errors | the model sees `Error`, guesses wrong, and retries the same mistake |
| permission gate | it spends real money with nobody asked |
| run log | something went wrong and you cannot tell what |

When someone says "the model failed", it is very often this file that failed.

## The one that matters most

The **permission gate**. Everything else costs you a bad night; this one costs money you cannot get back.

Note where it lives: in the code that *executes* the tool, not in the prompt. "Never order more than £100 without asking" written in a system prompt is a request. The same rule written as an `if` in your tool runner is a guarantee. A model can be talked out of a request. It cannot be talked out of an `if`.

## Cheap and boring beats clever

None of this is interesting code. A retry is four lines. A timeout is one argument. That is the point: reliability comes from unglamorous plumbing that nobody demos, which is exactly why it is the first thing skipped and the first thing missed.

**Next:** [stage 7 — guarantee the check happens](../stage7-graph/README.md)
