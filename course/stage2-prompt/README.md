# Stage 2 — the first real model call

**Stage 2 of 10** · Previous: [Stage 1 — the kiosk that can't](../stage1-kiosk/README.md) ·
[Course index](../README.md) · Next: [Stage 3 — how do you test this?](../stage3-evals/README.md)

**Goal:** replace stage 1's rules with a prompt, and meet the thing that makes the next six stages necessary.

```bash
npx tsx course/stage2-prompt/run.ts
```

There is one `TODO`: write the prompt. Then:

```bash
npx tsx course/check.ts 2
```

## What to notice

**`"could I grab a large flat white when you get a sec"` now works**, and you never wrote a rule for it. That is the whole reason anyone puts a model in a program. Then the script runs three probes, and each one takes something away from you.

**Probe 1 — is it stable?** The same vague question, five times, counting distinct answers. Usually it is not one. That is not a bug and you cannot prompt it away entirely; you can only narrow it.

**Probe 2 — is it right?** Different question, and the one that matters. It compares the price it quoted against the real menu. You never gave it the menu, so anything it says is invented. Watch for the bad case: if it invents the *same* wrong price five times in a row, probe 1 says "stable" and probe 1 is worthless. **Consistency is not correctness.** A model that wobbles is obviously guessing; a model that repeats itself is guessing too, and hides it better.

**Probe 3 — does the wording move it?** Five ways of asking for the same drink. Real customers never repeat themselves verbatim, so this is the variation that actually reaches you. Watch `needs_confirmation` — the flag deciding whether you ask before charging someone — flip on phrasing alone.

Notice where the variation lives: the clear order comes back stable, the vague one doesn't. **The model is not being random — it is filling a gap you left.** Stage 4 is about closing gaps deliberately.

If your numbers look different from a friend's, that is the point too. Try `CAFE_PROVIDER=anthropic` or `CAFE_MODEL=deepseek-v4-pro` — how stable a model is, is a property *of that model*, not of the task.

## About the JSON

`llm.ask(..., schema=...)` asks for **structured outputs**: the reply is constrained to your JSON Schema, so it *cannot* come back the wrong shape. You may have seen older code that begs in the prompt — *"reply with ONLY valid JSON, no preamble"* — then regex-extracts and retries on parse failure. Where the feature exists, that whole apparatus is replaced by passing the schema.

Where it doesn't, you write the apparatus. **DeepSeek accepts `output_config.format` and silently ignores it** — you get confident prose where you expected JSON, which is worse than an error, because an error would have told you. So `cafe/llm.ts` detects the provider, puts the schema into the prompt in words, and validates the reply itself. Open it and read `_schema_fallback` and `_extract_json`; that is the fallback you would otherwise have written from scratch, and knowing when you still need it is the actual skill.

## About the prices

Look closely at what it charged for the flat white. You never told it the menu. Hold that thought until stage 4 — first you need a way to *measure* how wrong it is, which is stage 3.

---

**Stage 2 of 10** · Previous: [Stage 1 — the kiosk that can't](../stage1-kiosk/README.md) ·
[Course index](../README.md) · Next: [Stage 3 — how do you test this?](../stage3-evals/README.md)
