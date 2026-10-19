> 简体中文：[README.zh-Hans.md](README.zh-Hans.md)

# Stage 4 — give it the menu

**Goal:** fix the failures from stage 3 by changing what the model can *see*, not how you ask.

```bash
npx tsx course/stage4-context/run.ts
```

One `TODO`: put the menu and the edge-case rules into the prompt. Then:

**Before you run it: which way does the number move, and by how much?** You wrote a baseline down in stage 3. Predicting the size, not just the direction, is what makes the answer land — and being wrong about the size is the interesting case.

```bash
npx tsx course/check.ts 4
```

The same optional flag as stage 3, still with nothing reading the keyboard: `npx tsx course/check.ts 4 --predict 16` stores `prediction` in `progress.json` when the check passes. `npx tsx course/report.ts` prints you predicted 16, got the score of that run. This stage only passes at 16 or above, and a failed check stores nothing, so a guess under that line is not written down here. Leave `--predict` off and a later passing run clears an old guess.

`check.ts` asks for **at least 16/20** — a real improvement over the stage-2 baseline, not a one-case wobble.

**Stuck?** Hint 1 and 2 in [HINTS.md](../HINTS.md#stage-4), then [SOLUTIONS.md](../SOLUTIONS.md).

## What to notice

You did not write a better instruction. You gave the model a fact it could not have known. Most "the model is bad at this" turns out to be "the model was never told."

Compare the two prompts side by side. Stage 2's was an instruction; stage 4's is an instruction plus a *briefing*.

## Where this stops working

Try pasting something big into the prompt — a thousand fake menu items, or the entire text of a novel. Two things happen:

1. Cost and latency climb, because you pay for every token on **every single call**.
2. The score can go *down*, because the one line that mattered is now buried in noise.

That is the actual discipline: not "give the model everything", but "give the model the few things that matter for *this* request". At scale you stop pasting and start retrieving — fetch the three relevant menu items rather than all seven hundred. The eval you built in stage 3 is what tells you whether your retrieval is actually picking the right three.

## The bit people skip

Run `npx tsx course/stage4-context/run.ts` twice and compare the token counts it prints. Context is not free, and it is the line item that grows fastest as a system gets more capable. In stage 5, it grows on *every turn of a loop*.

**Next:** [stage 5 — let it act](../stage5-loop/README.md)
