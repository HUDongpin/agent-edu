# Stage 4 — give it the menu

**Stage 4 of 10** · Previous: [Stage 3 — how do you test this?](../stage3-evals/README.md) ·
[Course index](../README.md) · Next: [Stage 5 — let it act](../stage5-loop/README.md)

**Goal:** fix the failures from stage 3 by changing what the model can *see*, not how you ask.

```bash
npx tsx course/stage4-context/run.ts
```

One `TODO`: put the menu and the edge-case rules into the prompt. Then:

```bash
npx tsx course/check.ts 4
```

`check.ts` asks for **at least 16/20** — a real improvement over the stage-2 baseline, not a one-case wobble.

## What to notice

You did not write a more forceful instruction. You supplied facts that were
absent from the Stage 2 request context. When the matching failures concern
those facts, Stage 4 lets you test whether missing context was the cause.

Compare the two prompts side by side. Stage 2's was an instruction; stage 4's is an instruction plus a *briefing*.
The report can establish that the two latest runs used matching runtime and
Eval context. It cannot establish that the menu was the only learner edit;
inspect this prompt diff before making that causal claim.

## Where this stops working

Try pasting something big into the prompt — a thousand fake menu items, or the
entire text of a novel. Separate what the request structure guarantees from
what the selected model does:

1. The repeated request contains more input tokens, which can increase the
   dated cost estimate.
2. Latency and score are run outcomes to measure. If the score changes, inspect
   the failures before attributing that change to relevant context being harder
   to retrieve.

That is the actual discipline: not "give the model everything", but "give the model the few things that matter for *this* request". At scale you stop pasting and start retrieving — fetch the three relevant menu items rather than all seven hundred. The eval you built in stage 3 is what tells you whether your retrieval is actually picking the right three.

## The bit people skip

Run `npx tsx course/stage4-context/run.ts` twice and compare the returned token
counts. Under the dated course rate tables, more billed input can increase the
estimate; the actual mix also depends on cache buckets, output and Provider
pricing. In stage 5, the loop resends its accumulated transcript on every turn.

---

**Stage 4 of 10** · Previous: [Stage 3 — how do you test this?](../stage3-evals/README.md) ·
[Course index](../README.md) · Next: [Stage 5 — let it act](../stage5-loop/README.md)
