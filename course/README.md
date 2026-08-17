# Part 2 — build the thing

The [web page](../index.html) gives you the mental model in 45 minutes. It does not make you a practitioner, because you never write anything and every model reply on it is scripted.

This is the other half. **One café, nine commits, real API calls.** At the end you have an agent you built, an eval suite that scores it, and a harness you would leave running overnight.

## Before you start

```bash
pip install anthropic
export DEEPSEEK_API_KEY=sk-...             # platform.deepseek.com/api_keys
# ...or, if you'd rather run it on Claude:
export ANTHROPIC_API_KEY=sk-ant-...        # console.anthropic.com
cd course
python stage0_hello/run.py
```

Each stage is a folder with a `README.md` and a `run.py` containing one or two `TODO`s. Fill them in, run it, then grade yourself:

```bash
python check.py 0
```

**No API key?** Add `--offline` to any command to replay recorded answers. Every stage runs. But stage 2's entire lesson is watching the same question come back different, and a recording cannot show you that — so borrow a key for at least stages 2 to 4 if you possibly can.

**Stuck?** [`SOLUTIONS.md`](SOLUTIONS.md) has every `TODO` filled in, one section per stage.

**Cost:** far less than you would guess. A full run of all nine stages on `deepseek-v4-flash` came to **under 2 cents**. Every stage prints what it spent. On Claude Opus it is a few dollars — same code, ~250× the price, and stage 3 is how you find out whether that buys you anything.

## Two providers, one seam

The course runs on **DeepSeek** or on **Anthropic's Claude**, and not one line of any stage changes between them. Set whichever key you have; if you have both, pick with `CAFE_PROVIDER`.

```bash
export DEEPSEEK_API_KEY=sk-...      # default if both are set
export ANTHROPIC_API_KEY=sk-ant-...
export CAFE_PROVIDER=anthropic      # force one
export CAFE_MODEL=deepseek-v4-pro   # or a different model on either
```

That works because DeepSeek publishes an **Anthropic-compatible endpoint**, so the same `anthropic` SDK drives both with a different `base_url`. Stages 5 and 6 build raw `tool_use` / `tool_result` blocks by hand and never notice.

The differences that *don't* vanish are the interesting part, and all of them live in [`cafe/llm.py`](cafe/llm.py):

| | Anthropic | DeepSeek |
|---|---|---|
| structured outputs | native — the reply **cannot** be the wrong shape | **accepted and silently ignored.** You get prose. `llm.py` asks in the prompt and validates the answer itself |
| "think harder" | `output_config.effort` | `thinking: {type: disabled}` — and left on with a small `max_tokens`, it spends the whole budget thinking and returns an **empty string with no error** |
| token counting | counts your text | counts the whole request, ~83 tokens of scaffolding included, so `llm.py` subtracts the floor |
| price | flat | **halves off-peak** (outside 01:00–04:00 and 06:00–10:00 UTC) |

This is what a provider abstraction is actually for. Not "swap the URL" — anyone can do that. It is knowing which of your assumptions were really vendor behaviour, and the only way to find out is to run the same suite against two of them. Try it: `CAFE_PROVIDER=... python check.py 3` and compare the scores.

## The nine stages

| | Stage | You write | What it teaches |
|---|---|---|---|
| 0 | [hello](stage0_hello/) | one API call | your key works |
| 1 | [kiosk](stage1_kiosk/) | if/else rules | the wall that starts all of this |
| 2 | [prompt](stage2_prompt/) | a system prompt | **the same question, five different answers** |
| 3 | [evals](stage3_evals/) | wire up 20 cases | you can't `assert` any more — you measure |
| 4 | [context](stage4_context/) | the menu, in the prompt | most "bad model" is "never told" |
| 5 | [loop](stage5_loop/) | the agent loop itself | tools, failure, recovery, a step limit |
| 6 | [harness](stage6_harness/) | retry, gate, log | same model, four different mornings |
| 7 | [graph](stage7_graph/) | a router and a reviewer | request vs guarantee |
| 8 | [security](stage8_security/) | trust boundaries | your input can give orders |

**Evals come third on purpose.** Once you have a number, every later stage is a measurement instead of an argument — and "change one thing, re-run the set" becomes a habit rather than a chapter.

## The shared package

`cafe/` is the part you don't write. Read it anyway — it is short:

- **`llm.py`** — the only place that talks to the API. Model id, effort, cost tracking, and the `--offline` record/replay seam.
- **`menu.py`** — the café's menu, and the ground truth the eval checks against.
- **`evalset.py`** — the twenty cases and the scorer. The most important file here.
- **`tools.py`** — the tools the agent may call from stage 5, rigged to fail realistically.

## If you only do two stages

Do **2 and 3**. First real call, first eval. That pair turns a reader into a practitioner more than the other seven combined: stage 2 is where nondeterminism stops being a word you read and becomes a thing that happened to you, and stage 3 is where you get the tool for coping with it.

## Honest limits

- The tools are fake. A real integration brings auth, pagination, rate limits and partial failure — none of which are here.
- The eval is twenty cases. A production set is hundreds, and mostly harvested from real bugs.
- Stage 8 shows the plainest possible injection. Real attacks are subtler, and defence in depth is a field, not a stage.

What is real: the API calls, the nondeterminism, the failures your agent recovers from, and the money it spends.

---

Licensed [MIT](../LICENSE), same as the rest of this repo. Corrections and extra stages welcome via [issues](https://github.com/HUDongpin/agent-edu/issues).
