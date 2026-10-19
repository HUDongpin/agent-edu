> 简体中文：[README.zh-Hans.md](README.zh-Hans.md)

# Stage 2 — the first real model call

**Goal:** replace stage 1's rules with a prompt, and meet the thing that makes the next six stages necessary.

```bash
npx tsx course/stage2-prompt/run.ts
```

No key? Fill in `SYSTEM`, then run the same file with `--offline`. The stand-in is deterministic. After it, the script prints a saved real run. To read that run on its own:

```bash
npx tsx course/stage2-prompt/recorded.ts
```

There is one `TODO`: write the prompt. Then:

```bash
npx tsx course/check.ts 2
```

**Stuck?** Hint 1 and 2 in [HINTS.md](../HINTS.md#stage-2), then [SOLUTIONS.md](../SOLUTIONS.md).

## What to notice

**`"could I grab a large flat white when you get a sec"` now works**, and you never wrote a rule for it. That is the whole reason anyone puts a model in a program. Then the script runs three probes, and each one takes something away from you.

**Probe 1 — is it stable?** The same vague question, five times, counting distinct answers. It may be one answer. A saved run of the reference prompt, on the course default (`deepseek-flash`, effort low, temperature left unset, thinking off), is in [stage2.json](../cafe/recordings/stage2.json): 20 sessions, eleven with 1 distinct answer and nine with 2. 91 of the 100 replies were an empty order with `needs_confirmation` true. The other nine named a drink. No session produced five different answers. Your prompt can land somewhere else. The saved run is what this model and this prompt did, not a promise about the next one.

**Probe 2 — is it right?** Different question, and the one that matters. It compares a quoted price with the real menu. You never gave it the menu, so a number it prints was not looked up. In that saved run the clear order was the same five times: flat white, large, 4.50, and `needs_confirmation` false. The menu charges 5.10 for that drink. Stable, and wrong. An empty vague order is not a checked order either. **Consistency is not correctness.** A model that wobbles is obviously guessing; a model that repeats itself is guessing too, and hides it better.

**Probe 3 — does the wording move it?** Five ways of asking for the same drink. Real customers never repeat themselves verbatim. Watch `needs_confirmation` — the flag that decides whether you ask before charging someone — and watch the item. In the saved run the flag stayed true on every phrasing, in all three sessions. The item did not hold steady: some phrasings came back empty, some named a drink, and the name and price changed between them. Wording moved the order, but it did not flip the flag.

The clear order was the stable one, and its price was still invented. The vague question was mostly one empty order, with a second answer in nine sessions. **The model is not reliably random, and it is not looking anything up. It fills a gap you left, or leaves it empty, and neither one is the same as being right.** Stage 4 closes that gap on purpose. Five calls cannot tell you which one you are getting; stage 3 counts across many cases.

If your numbers look different from a friend's, or from this recording, that is the point too. Try `CAFE_PROVIDER=anthropic` or `CAFE_MODEL=deepseek-v4-pro`. How stable a model is, is a property of that model and that prompt, not of the task.

## About the JSON

`ask(prompt, { schema })` asks for **structured outputs**: the reply is constrained to your JSON Schema, so it *cannot* come back the wrong shape. You may have seen older code that begs in the prompt — *"reply with ONLY valid JSON, no preamble"* — then regex-extracts and retries on parse failure. Where the feature exists, that whole apparatus is replaced by passing the schema.

Where it doesn't, you write the apparatus. **DeepSeek accepts `output_config.format` and silently ignores it** — you get confident prose where you expected JSON, which is worse than an error, because an error would have told you. So `cafe/llm.ts` detects the provider, puts the schema into the prompt in words, and validates the reply itself. Open it and read `schemaFallback` and `extractJSON`; that is the fallback you would otherwise have written from scratch, and knowing when you still need it is the actual skill.

## About the prices

Look closely at what it charged for the flat white. You never told it the menu. Hold that thought until stage 4 — first you need a way to *measure* how wrong it is, which is stage 3.

**Next:** [stage 3 — how do you test this?](../stage3-evals/README.md)
