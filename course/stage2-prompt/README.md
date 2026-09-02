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

The bundled offline fixture handles **`"could I grab a large flat white when you
get a sec"`** even though you never wrote that rule. A live model may respond
differently; record what your selected Provider and model do. The script then
runs three probes that turn those run-specific outputs into evidence.

**Probe 1 — is it stable in this run?** Ask the same vague question five times
and count distinct answers. One result or five is an observation about this
configuration and sample, not an API guarantee. Prompting can narrow variation;
it cannot prove that a future run will be identical.

**Probe 2 — is it grounded?** Compare any quoted price with the real menu. You
did not provide that menu, so the answer is unsupported by the request context
even when it happens to match. A repeated wrong price can look stable while
remaining wrong. **Consistency is not correctness.** Keep the provenance test
separate from the variation count.

**Probe 3 — does wording move this configuration?** Try five ways of asking for
the same drink and compare `needs_confirmation`, the flag used before charging
someone. Record whether it changes; do not assume that every Provider or model
will reproduce an earlier course run.

In the bundled fixture, the clear order stays stable while the vague one varies.
For a live model, inspect the outputs before attributing a difference. Stage 4
tests one way to close a known information gap deliberately.

If your numbers differ from another run, preserve the Provider, requested model,
effort and date with the result. Try `CAFE_PROVIDER=anthropic` or
`CAFE_MODEL=deepseek-v4-pro` only as a new comparison condition, not as proof
that one Provider has a universal stability property.

## About the JSON

`llm.ask(..., schema=...)` asks for **structured outputs**. On supported Claude
models, [`output_config.format` uses constrained
decoding](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
and normally returns schema-compliant JSON. It is still not permission to skip
error handling: refusals and `max_tokens` truncation are documented exceptions,
and your application may have constraints that JSON Schema does not express.

Where that interface is unavailable, you write the fallback deliberately.
[DeepSeek's Anthropic-format compatibility
documentation](https://api-docs.deepseek.com/guides/anthropic_api/) currently
supports only `effort` inside `output_config`, not `format`. `cafe/llm.ts`
therefore puts the schema into the prompt, extracts and parses a JSON object,
then validates every constraint in the supplied draft-7-compatible course
schema locally. The same validator runs on Claude results as a defence in
depth. A refusal or schema response stopped by `max_tokens` or the model context
window is rejected before parsing even if its partial text looks complete.

The validator does not coerce types, remove extra properties or fill defaults.
The current course schemas do not use JSON Schema `format`; Ajv core does not
add format validators automatically. If a future schema introduces formats,
add and test the corresponding validator rather than claiming that the keyword
is enforced. Open `schemaFallback()` and `extractJSON()` to inspect the seam.

## About the prices

Compare the sampled flat-white quote with the menu. You never supplied that
menu in the request, so a match is not evidence of grounding and a mismatch is
not surprising. Stage 3 gives you a fixed set for measuring what happened;
Stage 4 tests the missing-context hypothesis.

---

**Stage 2 of 10** · Previous: [Stage 1 — the kiosk that can't](../stage1-kiosk/README.md) ·
[Course index](../README.md) · Next: [Stage 3 — how do you test this?](../stage3-evals/README.md)
