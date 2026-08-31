# Stage 5 — let it act

**Stage 5 of 10** · Previous: [Stage 4 — give it the menu](../stage4-context/README.md) ·
[Course index](../README.md) · Next: [Stage 6 — the machine around it](../stage6-harness/README.md)

**Goal:** write the agent loop yourself. Not a framework's loop — the twelve lines the frameworks wrap.

```bash
npx tsx course/stage5-loop/run.ts
```

The job: **"restock the café."** Nobody tells the model how, and nobody can say up front how many steps it takes. There is one `TODO`: the body of the loop.

```bash
npx tsx course/check.ts 5
```

## What to notice

The tools in `cafe/tools.ts` are rigged, on purpose:

- `read_sales` **fails the first time it is called.** A real API does this.
- `place_order("cups_12oz", 500)` **is refused**, because the supplier minimum is 1000.

The bundled offline fixture reads both tool failures and tries a different
action, demonstrating the recovery path deterministically. A live model may
recover, repeat the failed action or stop. Record what it does and keep the step
limit and tool boundary responsible for safety; the loop itself guarantees no
particular recovery behavior.

Then watch the returned token count per step. Every later turn re-sends the
accumulated transcript, so input can grow as the run continues; the exact cost
depends on which turns occur, the Provider's usage buckets and the dated rate
table. That is why long-running agents need a measured compaction policy.

## Why you are writing this by hand

The locked [Anthropic TypeScript SDK
0.117.1](https://github.com/anthropics/anthropic-sdk-typescript/tree/sdk-v0.117.1)
includes beta `client.beta.messages.toolRunner()`. It can automate Claude's
[assistant → tool → result loop, stream events and bound
iterations](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner).
A manual loop remains the clearer choice for approval gates, custom logging
and conditional execution. Do not assume this beta helper works through
another Provider's compatibility endpoint without a dated test.

You are writing it manually once because the loop *is* the concept. After this stage, "an agent" should read as what it is: a while-loop, a list of tools, and a stopping rule.

## The stopping rule is yours

`MAX_STEPS` is not a safety blanket, it is the design. A loop without one can run all night on your money. Set it to 3 and run again: the job comes out half-done, coffee ordered and cups forgotten. **Choosing that trade-off is the engineering.**

---

**Stage 5 of 10** · Previous: [Stage 4 — give it the menu](../stage4-context/README.md) ·
[Course index](../README.md) · Next: [Stage 6 — the machine around it](../stage6-harness/README.md)
