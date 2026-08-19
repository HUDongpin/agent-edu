# Part 3 — build the thing

The [handbook](https://aicourse.top/en/handbook/) gives you the mental model and the [Lab](https://aicourse.top/en/lab/) gets your hands on it. This is the other half: **one café, nine stages, real API calls, on your own machine.** At the end you have an agent you built, an eval suite that scores it, and a harness you would leave running overnight.

> **This part assumes you can read and write basic TypeScript** — functions, objects, a `for` loop, `await`. Not much more. If that made you uneasy, do the **[Lab](https://aicourse.top/en/lab/)** first: the same ground as stages 0 to 4, in your browser, nothing to install.

## Before you start

Everything below runs from the **repo root** — the course shares the site's `package.json`, so there is nothing to install in this folder.

```bash
npm install
export DEEPSEEK_API_KEY=sk-...             # platform.deepseek.com/api_keys
# ...or, if you'd rather run it on Claude:
export ANTHROPIC_API_KEY=sk-ant-...        # console.anthropic.com
npx tsx course/stage0-hello/run.ts
```

Each stage is a folder with a `README.md` and a `run.ts` containing one or two `TODO`s. Fill them in, run it, then grade yourself:

```bash
npx tsx course/check.ts 0      # or: npm run course 0
```

**No API key?** Add `--offline` to any command to replay recorded answers. Every stage runs. But stage 2's entire lesson is watching the same question come back different, and a recording cannot show you that — so borrow a key for at least stages 2 to 4 if you possibly can.

**Stuck?** [`SOLUTIONS.md`](SOLUTIONS.md) has every `TODO` filled in, one section per stage.

**Cost:** far less than you would guess. A full run of all nine stages on `deepseek-v4-flash` came to **under 2 cents**. Every stage prints what it spent. On Claude Opus it is a few dollars — same code, ~250× the price, and stage 3 is how you find out whether that buys you anything.

## Two providers, one seam

The course runs on **DeepSeek** or on **Anthropic's Claude**, and not one line of any stage changes between them.

```bash
export DEEPSEEK_API_KEY=sk-...      # default if both are set
export CAFE_PROVIDER=anthropic      # force one
export CAFE_MODEL=deepseek-v4-pro   # or a different model on either
```

That works because DeepSeek publishes an **Anthropic-compatible endpoint**, so the same `@anthropic-ai/sdk` drives both with a different `baseURL`. Stages 5 and 6 build raw `tool_use` / `tool_result` blocks by hand and never notice.

The differences that *don't* vanish are the interesting part, and all of them live in [`cafe/llm.ts`](cafe/llm.ts):

| | Anthropic | DeepSeek |
|---|---|---|
| structured outputs | native — the reply **cannot** be the wrong shape | **accepted and silently ignored.** You get prose. `llm.ts` asks in the prompt and validates the answer itself |
| "think harder" | `output_config.effort` | `thinking: {type:"disabled"}` — and left on with a small `max_tokens`, it spends the whole budget thinking and returns an **empty string with no error** |
| token counting | counts your text | counts the whole request, ~83 tokens of scaffolding included, so `llm.ts` subtracts the floor |
| price | flat | **halves off-peak** (outside 01:00–04:00 and 06:00–10:00 UTC) |

This is what a provider abstraction is actually for. Not "swap the URL" — anyone can do that. It is knowing which of your assumptions were really vendor behaviour, and the only way to find out is to run the same suite against two of them.

## The nine stages

| | Stage | You write | What it teaches |
|---|---|---|---|
| 0 | [hello](stage0-hello/) | one API call | your key works |
| 1 | [kiosk](stage1-kiosk/) | if/else rules | the wall that starts all of this |
| 2 | [prompt](stage2-prompt/) | a system prompt | **the same question, five different answers** |
| 3 | [evals](stage3-evals/) | wire up 20 cases | you can't `assert` any more — you measure |
| 4 | [context](stage4-context/) | the menu, in the prompt | most "bad model" is "never told" |
| 5 | [loop](stage5-loop/) | the agent loop itself | tools, failure, recovery, a step limit |
| 6 | [harness](stage6-harness/) | retry, gate, log | same model, four different mornings |
| 7 | [graph](stage7-graph/) | a router and a reviewer | request vs guarantee |
| 8 | [security](stage8-security/) | two defences | input that tries to give orders |

**Evals come third on purpose.** Once you have a number, every later change is a measurement instead of an argument.

**If you only do two stages: do 3 and 4.** Watching one number move from 7/20 to 19/20 because you told the model what it was selling is the single most useful thing here.

## Your report card

```bash
npx tsx course/report.ts       # or: npm run report
```

```
  3  evals      7/20  ← your baseline
  4  context    19/20  with the menu in context
  ...
  The only number that matters: 7/20 → 19/20 (+12)
```

The 20 café cases deliberately **stop** at stage 4. An agent placing restock orders is not taking orders, so stages 5–8 report the measure that actually fits them — money spent unattended, drafts the reviewer stopped, the refund the cap held. Forcing one suite onto every stage would look tidier and tell you less.

## Stage 9 — build your own

The café is a stand-in. The last thing to do is throw it away.

Pick a domain you actually know: a library's returns desk, a lab booking system, a tutoring service, your own inbox. Then build the same nine things for it — the rules version and the phrasing that breaks it; a prompt that replaces the rules; **twenty cases of your own**; the context the model needs and lacks; a tool and the loop; a gate on the one action you could not undo; a step no model may skip; and the input that comes from a stranger.

Nobody will grade it. The point is that you now know what the twenty cases *are* for your own domain — which is the part a café cannot teach.

## Honest limits

Nothing here makes you a machine-learning engineer; it is about **building systems that call models**, which is a different job. The security stage is an introduction to one attack, not a security course. And every model behaviour shown is **as of the model you run it on** — some will be wrong in a year. The questions will not be.

---

Licensed [MIT](../LICENSE). Corrections and extra stages welcome via [issues](https://github.com/HUDongpin/agent-edu/issues).

**A Python version of this course** is preserved at [`legacy/course-python/`](../legacy/course-python/). It teaches the identical nine stages; Python remains the lingua franca of AI engineering, so if that is where you want the skills to land, start there instead.
