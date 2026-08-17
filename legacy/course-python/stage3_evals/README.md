# Stage 3 — how do you test this?

**Goal:** turn "it seems better" into a number. This is the stage that makes every later stage measurable, which is why it comes third and not last.

```bash
python stage3_evals/run.py
```

There is one `TODO`: import your stage-2 prompt and point the eval at it.

```bash
python check.py 3
```

## What to notice

You just scored your stage-2 prompt out of 20. **Write the number down.** Every remaining stage gets compared to it.

It will not be 20. Read the failures — most of them are prices, because the model has never seen your menu. You are about to fix that in stage 4 and watch the number move.

## Why this replaces unit testing

In stage 1 you could write `assert take_order("tea")["price"] == 2.80` and it held forever. From stage 2 on, that assertion is a coin flip, because the same input can give different output.

So you stop asserting one answer and start measuring a rate over many cases. `cafe/evalset.py` has twenty; look at it. Twelve are checked by a plain Python function — exact, free, instant. Only eight need a second model call to judge, because "did it handle the vague order sensibly?" has no `==` you can write.

**Prefer the rule-checked kind.** They cost nothing and never disagree with themselves. A judge is a model, with all the same problems — a vague standard makes it a coin flip too. Read the standards in `evalset.py`: each one is specific enough that a stranger could apply it.

## The trap

Twenty cases cannot detect a one-case difference. If a change takes you from 14 to 15, that is noise — run it again and it may go back. To act on a one-case change you would need hundreds of cases.

So: make changes big enough to see, or gather more cases. And when a real bug turns up in real use, **paste it into `CASES` before you fix it.** That is how the set becomes worth having, and it is the single habit that separates people who get good at this from people who keep guessing.

**Next:** [stage 4 — give it the menu](../stage4_context/README.md)
