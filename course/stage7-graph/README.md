# Stage 7 — guarantee the check happens

**Stage 7 of 10** · Previous: [Stage 6 — the machine around it](../stage6-harness/README.md) ·
[Course index](../README.md) · Next: [Stage 8 — when the input fights back](../stage8-security/README.md)

**Goal:** stop hoping the model reviews its work, and make the review structurally unavoidable.

```bash
npx tsx course/stage7-graph/run.ts
```

Two `TODO`s: the router, and the reviewer node. Then:

```bash
npx tsx course/check.ts 7
```

## What to notice

`run.ts` sends the same complaint through twice — once with the reviewer node wired in, once with it bypassed — and prints what would have gone to the customer.

With the reviewer bypassed, the first draft reaches `send()` without a policy
decision. With the reviewer wired in, each rejected draft can be rewritten up
to the configured cap before the final draft reaches `send()`. Whether a
particular draft is off-policy, approved or changed is an observed run result.

The bundled offline fixture demonstrates a blocked draft deterministically. A
live model may produce equal drafts on both paths. Run the checker once and
inspect the structural guarantee; **do not rerun it to force a contrasting
output**.

Nothing about the model changed between those two runs. What changed is that **no path through the graph reaches "send" without passing through "review".**

## Loop vs graph, concretely

In stage 5 you could add *"always check your reply against the refund policy"*
to the prompt. Whether a selected model follows it is run-dependent. It remains
a request.

Here, `send()` is only ever called from one place, and that place is downstream of `review()`. That is a guarantee. The difference is not the model's diligence — it is whether the wrong thing is *possible*.

Notice this is ordinary TypeScript: functions, an `if`, and a loop with a retry cap. A "graph" is not a framework you install. It is your control flow, written down deliberately, with the model doing the thinking inside individual boxes.

## What you give up

The map only handles cases you thought of. A message that is neither an order, a question, nor a complaint falls through your router and hits the default branch. Watch how the default behaves and decide whether you like it — because in production, that branch is where the surprises live.

---

**Stage 7 of 10** · Previous: [Stage 6 — the machine around it](../stage6-harness/README.md) ·
[Course index](../README.md) · Next: [Stage 8 — when the input fights back](../stage8-security/README.md)
