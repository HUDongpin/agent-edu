# Stage 1 — the kiosk that can't

**Stage 1 of 10** · Previous: [Stage 0 — prove the call seam](../stage0-hello/README.md) ·
[Course index](../README.md) · Next: [Stage 2 — the first real model call](../stage2-prompt/README.md)

**Goal:** feel the wall that makes all of this necessary. No model in this stage at all.

```bash
npx tsx course/stage1-kiosk/run.ts
```

You are writing an ordinary café kiosk: rules in, orders out. It is fast, free, and perfectly predictable.

There is one `TODO`: make `"large flat white"` work. Then try the inputs at the bottom of the file.

```bash
npx tsx course/check.ts 1
```

## What to notice

`check.ts` deliberately holds you to **two** things:

1. The phrasings you wrote rules for must work.
2. `"could I grab a large flat white when you get a sec"` must fail.

That second one is not a bug to fix. It is the finding. You *can* make it pass — add another `if`. Then someone says *"one large flat white, ta"* and you add another. A real café gets hundreds of phrasings, and you have to think of each one before the customer does.

Notice also what this code is unarguably good at: same input, same output, every time, for free, in under a millisecond. Do not throw that away in the next eight stages. Most of a real system should still look like this file.

---

**Stage 1 of 10** · Previous: [Stage 0 — prove the call seam](../stage0-hello/README.md) ·
[Course index](../README.md) · Next: [Stage 2 — the first real model call](../stage2-prompt/README.md)
