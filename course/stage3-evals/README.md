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

Read the **observed score** and the individual failures. If failures concern
facts absent from the prompt, missing menu context is a hypothesis, not a
foregone diagnosis. Stage 4 tests that hypothesis with a new run; compare it
only when the report marks the pair **configuration-matched** and inspect the
prompt diff before attributing any movement.

## Why this complements unit testing

In stage 1 you could write `assert.equal(handleOrder("tea")?.price, 2.80)` and
it held forever. From stage 2 on, one exact string assertion against generated
text is brittle: the same request can produce different valid wording.

Keep unit tests for deterministic parsers, schemas, tools and safety gates. For the variable model output, stop asserting one exact answer and start measuring a rate over many cases. `cafe/evalset.ts` has twenty; look at it. Twelve are checked by a plain TypeScript function — exact, free, instant. Only eight need a second model call to judge, because "did it handle the vague order sensibly?" has no `===` you can write.

**Prefer the rule-checked kind.** They make no Provider call and return the same
result for the same structured value. A model judge remains run-dependent; a
vague standard makes its result difficult to reproduce or audit. Read the
standards in `cafe/evalset.ts`: each one is specific enough that a stranger
could apply it.

## The trap

With twenty cases, one changed case moves the score by five percentage points.
A 14-to-15 result in one pair does not by itself establish a reliable
improvement. Preserve the cases and configuration, repeat deliberately, and
expand the representative set when the decision needs narrower uncertainty.

So: make changes big enough to see, or gather more cases. And when a real bug turns up in real use, **paste it into `CASES` before you fix it.** That is how the set becomes worth having, and it is the single habit that separates people who get good at this from people who keep guessing.

---

**Stage 3 of 10** · Previous: [Stage 2 — the first real model call](../stage2-prompt/README.md) ·
[Course index](../README.md) · Next: [Stage 4 — give it the menu](../stage4-context/README.md)
