# Stage 7 — guarantee the check happens

**Goal:** stop hoping the model reviews its work, and make the review structurally unavoidable.

```bash
python stage7_graph/run.py
```

Two `TODO`s: the router, and the reviewer node. Then:

```bash
python check.py 7
```

## What to notice

`run.py` sends the same complaint through twice — once with the reviewer node wired in, once with it bypassed — and prints what would have gone to the customer.

With the reviewer off, an off-policy reply reaches a real person. With it on, the draft comes back for a rewrite and the second attempt goes out.

Nothing about the model changed between those two runs. What changed is that **no path through the graph reaches "send" without passing through "review".**

## Loop vs graph, concretely

In stage 5 you could add *"always check your reply against the refund policy"* to the prompt. Sometimes it would. That is a request.

Here, `send()` is only ever called from one place, and that place is downstream of `review()`. That is a guarantee. The difference is not the model's diligence — it is whether the wrong thing is *possible*.

Notice this is ordinary Python: functions, an `if`, a loop with a retry cap. A "graph" is not a framework you install. It is your control flow, written down deliberately, with the model doing the thinking inside individual boxes.

## What you give up

The map only handles cases you thought of. A message that is neither an order, a question, nor a complaint falls through your router and hits the default branch. Watch how the default behaves and decide whether you like it — because in production, that branch is where the surprises live.

**Next:** [stage 8 — when the input fights back](../stage8_security/README.md)
