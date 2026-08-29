# Stage 3 — how do you test this?

**Stage 3 of 10** · Previous: [Stage 2 — the first real model call](../stage2-prompt/README.md) ·
[Course index](../README.md) · Next: [Stage 4 — give it the menu](../stage4-context/README.md)

**Goal:** turn "it seems better" into a number. This is the stage that makes every later stage measurable, which is why it comes third and not last.

```bash
npx tsx course/stage3-evals/run.ts
```

There is one `TODO`: import your stage-2 prompt and point the eval at it.

```bash
npx tsx course/check.ts 3
```

## What to notice

You just scored your stage-2 prompt out of 20. The report stores this run as
the latest result and keeps a separate best result. Stage 4 is compared with
this run only when its recorded mode, Provider, model, effort, Eval and source
identities match; later stages use measures appropriate to their own jobs.
Even then, runtime comparability does not establish cause: inspect the learner
prompt diff between Stages 2 and 4 before attributing the score movement.

It will not be 20. Read the failures — most of them are prices, because the model has never seen your menu. You are about to fix that in stage 4 and watch the number move.

## Why this complements unit testing

In stage 1 you could write `assert.equal(handleOrder("tea")?.price, 2.80)` and it held forever. From stage 2 on, an exact assertion against the generated reply is a coin flip, because the same input can give different wording.

Keep unit tests for deterministic parsers, schemas, tools and safety gates. For the variable model output, stop asserting one exact answer and start measuring a rate over many cases. `cafe/evalset.ts` has twenty; look at it. Twelve are checked by a plain TypeScript function — exact, free, instant. Only eight need a second model call to judge, because "did it handle the vague order sensibly?" has no `===` you can write.

**Prefer the rule-checked kind.** They cost nothing and never disagree with themselves. A judge is a model, with all the same problems — a vague standard makes it a coin flip too. Read the standards in `cafe/evalset.ts`: each one is specific enough that a stranger could apply it.

## The trap

Twenty cases cannot detect a one-case difference. If a change takes you from 14 to 15, that is noise — run it again and it may go back. To act on a one-case change you would need hundreds of cases.

So: make changes big enough to see, or gather more cases. And when a real bug turns up in real use, **paste it into `CASES` before you fix it.** That is how the set becomes worth having, and it is the single habit that separates people who get good at this from people who keep guessing.

---

**Stage 3 of 10** · Previous: [Stage 2 — the first real model call](../stage2-prompt/README.md) ·
[Course index](../README.md) · Next: [Stage 4 — give it the menu](../stage4-context/README.md)
