# Stage 5 — let it act

**Goal:** write the agent loop yourself. Not a framework's loop — the twelve lines the frameworks wrap.

```bash
python stage5_loop/run.py
```

The job: **"restock the café."** Nobody tells the model how, and nobody can say up front how many steps it takes. There is one `TODO`: the body of the loop.

```bash
python check.py 5
```

## What to notice

The tools in `cafe/tools.py` are rigged, on purpose:

- `read_sales` **fails the first time it is called.** A real API does this.
- `place_order("cups_12oz", 500)` **is refused**, because the supplier minimum is 1000.

Watch what the model does with both. It reads the error, and tries something else. Nobody wrote that recovery — it falls out of the loop having fed the failure back in as information.

Then watch the token count per step. Every turn re-sends the entire transcript, so turn 8 costs far more than turn 1. That is stage 4's problem arriving on a schedule, and it is why long-running agents need compaction.

## Why you are writing this by hand

The SDK ships a tool runner (`client.beta.messages.tool_runner`) that does this loop for you, and in a real project you should probably use it — it handles retries, streaming and per-turn hooks properly.

You are writing it manually once because the loop *is* the concept. After this stage, "an agent" should read as what it is: a while-loop, a list of tools, and a stopping rule.

## The stopping rule is yours

`MAX_STEPS` is not a safety blanket, it is the design. A loop without one can run all night on your money. Set it to 3 and run again: the job comes out half-done, coffee ordered and cups forgotten. **Choosing that trade-off is the engineering.**

**Next:** [stage 6 — the machine around it](../stage6_harness/README.md)
