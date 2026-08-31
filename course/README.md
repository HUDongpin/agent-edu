# Part 3 — build the thing

The [handbook](https://aicourse.top/en/handbook/) gives you the mental model and the [Lab](https://aicourse.top/en/lab/) gets your hands on it. This is the other half: **one café, nine guided stages (0–8), then a Stage 9 transfer project, with real API calls on your own machine.** At the end you have an agent you built, an eval suite that scores it, a harness you would leave running overnight, and a scaffold for transferring those controls to a domain you know.

> **This part assumes you can read and write basic TypeScript** — functions, objects, a `for` loop, `await`. Not much more. If that made you uneasy, do the **[Lab](https://aicourse.top/en/lab/)** first: the same ground as stages 0 to 4, in your browser, nothing to install.

## Before you start

Everything below runs from the **repo root** — the course shares the site's `package.json`, so there is nothing to install in this folder.

Start with the deterministic path. It verifies Node, TypeScript and the local
course seam without a key, network request or token spend:

```bash
npm ci
npm run course:offline
```

Then open [`stage0-hello/run.ts`](stage0-hello/run.ts), fill in `QUESTION`,
and prove the edited Stage 0 path offline before adding a credential:

```bash
npx tsx course/stage0-hello/run.ts --offline
npx tsx course/check.ts 0 --offline
```

The Stage 0 report now says exactly what that proves: the offline path works;
no live credential or network request was checked. If you choose to run live,
set one key in the shell you are actually using, then repeat the run and check
without `--offline`.

**Live-cost boundary:** each shell block below makes one live call in the Stage
0 run and another in its checker. Both may incur Provider charges. Review the
printed estimate and use the Provider dashboard as the billing record.

macOS/Linux (`bash` or `zsh`):

```bash
export DEEPSEEK_API_KEY=your_key_here      # platform.deepseek.com/api_keys
# or: export ANTHROPIC_API_KEY=your_key_here
#     export CAFE_PROVIDER=anthropic
npx tsx course/stage0-hello/run.ts
npx tsx course/check.ts 0
```

Windows PowerShell:

```powershell
$env:DEEPSEEK_API_KEY = "your_key_here"
# or: $env:ANTHROPIC_API_KEY = "your_key_here"
#     $env:CAFE_PROVIDER = "anthropic"
npx tsx course/stage0-hello/run.ts
npx tsx course/check.ts 0
```

Each later stage is a folder with a `README.md` and a `run.ts` containing one
or two `TODO`s. Fill them in, run the stage, then run its checker. The checker
prints the next stage or transfer action when it passes.

**No API key?** Add `--offline` to any command to use the scripted local
stand-in after you fill that stage's `TODO`s. Every completed stage supports
this path. Stage 2 samples whether a live model's answers vary; a deterministic
stand-in cannot reproduce that measurement. If you later want the comparison,
use a low-credit, revocable key of your own. Never borrow or share another
person's credential.

**Stuck?** [`SOLUTIONS.md`](SOLUTIONS.md) has every `TODO` filled in, one section per stage.

**Cost:** the offline stand-in makes no Provider request. Live stages print
returned usage and an estimated cost when the model and usage shape are
recognized. The total varies with Provider, model, cache, time band, optional
pricing modifiers and how often you re-run; an old sample total is not a
promise. Check the estimate before a run and treat the Provider dashboard as
the billing record. Claude can cost materially more than DeepSeek for the same
exercise.

## Two providers, one seam

The course runs on **DeepSeek** or on **Anthropic's Claude**, and not one line of any stage changes between them.

Choose one Provider explicitly, especially if both keys exist in your shell:

```bash
# DeepSeek
export DEEPSEEK_API_KEY=your_key_here
export CAFE_PROVIDER=deepseek
export CAFE_MODEL=deepseek-v4-pro

# Or Anthropic
export ANTHROPIC_API_KEY=your_key_here
export CAFE_PROVIDER=anthropic
export CAFE_MODEL=claude-opus-5
```

PowerShell uses the same variable names with `$env:`, for example
`$env:CAFE_PROVIDER = "deepseek"`. Do not combine a model name from one
Provider with the other Provider's key. With exactly one configured key, the
course infers that Provider. With neither key, it keeps DeepSeek as the
deterministic offline default. With both keys and no `CAFE_PROVIDER`, it stops
before constructing a client or sending a request and asks you to choose.

DeepSeek documents an **Anthropic-format endpoint**, so the same
`@anthropic-ai/sdk` transport can drive the subset of fields this course uses
with a different `baseURL`. That compatibility is not feature parity. The core
`tool_use` / `tool_result` fields used in stages 5 and 6 are supported, while
DeepSeek currently ignores `tool_result.is_error`; the portable error signal is
therefore the human-readable tool-result text.

The differences that *don't* vanish are the interesting part, and all of them live in [`cafe/llm.ts`](cafe/llm.ts):

| | Anthropic | DeepSeek |
|---|---|---|
| structured outputs | On supported Claude models, `output_config.format` uses constrained decoding. The adapter still meters and rejects refusal or schema-truncated responses, parses the result and validates every constraint in the supplied draft-7-compatible course schema. | DeepSeek's Anthropic-format interface currently supports only `output_config.effort`, not `output_config.format`. `llm.ts` prompts for JSON, then applies the same complete local schema validation before returning data. |
| "think harder" | The course sends all five effort values one-for-one through `output_config.effort`. | The same field uses DeepSeek's documented mapping: `low` → `low`; `medium`, `high` and `xhigh` → `high`; `max` → `max`. |
| token counting | The API estimates the whole structured request and may include system-added tokens. | The course measures and subtracts an empty-request baseline for its relative budgeting exercise. That normalization is implementation-specific, not a stable Provider constant. |
| price | The course snapshots standard first-party, global Opus 5 rates checked 2026-08-31, with no time-of-day band. Cache-write usage remains unpriceable from the aggregate usage shape, and optional modifiers can still change the bill. | Flash/Pro cache-hit, cache-miss and output rates use the dated shared table. Official peak windows apply 01:00–04:00 and 06:00–10:00 UTC, Monday–Friday; all weekend hours are off-peak. |

### Sources and version boundary

Provider contracts change. The links below were rechecked **2026-08-31** with
the locked **`@anthropic-ai/sdk` 0.117.1**. The DeepSeek price table in this
checkout remains a separate **2026-08-21 snapshot**. Always verify a current
Provider page before a paid run; returned usage supports an estimate, while the
Provider dashboard is the billing record.

- [DeepSeek models and pricing](https://api-docs.deepseek.com/quick_start/pricing/)
- [DeepSeek Anthropic API compatibility](https://api-docs.deepseek.com/guides/anthropic_api/)
- [DeepSeek thinking mode](https://api-docs.deepseek.com/guides/thinking_mode/)
- [Claude structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Claude effort controls](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Claude token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)
- [Claude tool runner](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner)
- [Official Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Anthropic TypeScript SDK 0.117.1](https://github.com/anthropics/anthropic-sdk-typescript/tree/sdk-v0.117.1)

The runtime binds its Claude rate table to the official pricing URL and the
2026-08-31 check date, and binds DeepSeek estimates to the separate 2026-08-21
snapshot. DeepSeek band selection is weekday-aware. These are still dated
course estimates, not invoices: unknown models, incomplete usage, Claude cache
creation and unsupported pricing modifiers fail closed as `cost unknown`.

Model variation, empty responses, token baselines, recovery and injection
behavior are run-dependent behaviors to measure, not API guarantees. Rerun the
evals for the Provider, requested model and version you select. A requested
model string is also not proof of the served backend:
DeepSeek documents alias mapping on its Anthropic-format endpoint.

This is what a provider abstraction is actually for. Not "swap the URL" — anyone can do that. It is knowing which of your assumptions were really vendor behaviour, and the only way to find out is to run the same suite against two of them.

## The nine guided stages (0–8)

| | Stage | You write | What it teaches |
|---|---|---|---|
| 0 | [call seam](stage0-hello/) | local call seam | local stand-in first, or a verified live response and network path |
| 1 | [kiosk](stage1-kiosk/) | if/else rules | the wall that starts all of this |
| 2 | [prompt](stage2-prompt/) | a system prompt | sample repeated answers and measure variation |
| 3 | [evals](stage3-evals/) | wire up 20 cases | variable model output needs evals; deterministic code still needs unit tests |
| 4 | [context](stage4-context/) | the menu, in the prompt | test whether missing facts explain a failure |
| 5 | [loop](stage5-loop/) | the agent loop itself | tools, failure, recovery, a step limit |
| 6 | [harness](stage6-harness/) | retry, gate, log | same model, five controlled runs |
| 7 | [graph](stage7-graph/) | a router and a reviewer | request vs guarantee |
| 8 | [security](stage8-security/) | two defences | input that tries to give orders |

**Evals come third on purpose.** Stage 3 depends on the prompt you build in
Stage 2. Work through Stages 0–4 in order; then the Stage 3 and 4 comparison is
a measurement instead of an argument.

## Your report card

```bash
npx tsx course/report.ts       # or: npm run report
```

```
  3  evals      7/20 latest · 9/20 best  ← baseline
  4  context    19/20 latest/best with the menu in context
  ...
  Stage 9  transfer   not started · manual evidence state, not automatic mastery
  Configuration-matched paired results: 7/20 → 19/20 (+12)
```

The report retains the **latest** and **best** Eval scores separately, so a
regression stays visible. It compares Stage 3 with Stage 4 only when the
recorded mode, Provider, model, effort, Eval identity, source identity and
denominator match; Stage 4 must also bind the current Stage 3 run, follow it in
time and run within 24 hours. The report displays both timestamps. That makes
the two runs configuration-matched and paired; it does not prove what caused
the difference, because Provider aliases may drift and learner-edited prompt
systems are deliberately outside the shared source fingerprint. Inspect the
Stage 2–4 prompt diff before attributing a change to the menu or any other
edit. Rerunning Stage 3 invalidates an older Stage 4 pairing. Older progress
files still load, but their missing execution context is reported rather than
invented.

The 20 café cases deliberately **stop** at stage 4. An agent placing restock orders is not taking orders, so stages 5–8 report the measure that actually fits them — money spent unattended, drafts the reviewer stopped, the refund the cap held. Forcing one suite onto every stage would look tidier and tell you less.

Stage 9 is manual evidence, not an automatic pass. Record only the bounded
state that you can support:

```bash
npx tsx course/report.ts --stage9 artifact-assembled \
  --artifact notes/agent-transfer-artifact.md \
  --artifact notes/eval-results.json
npx tsx course/report.ts --stage9 self-reviewed
```

The first command inventories regular files inside this repository and stores
only their bounded relative paths, count, timestamp and a deterministic
content hash—never their contents. `self-reviewed` re-hashes that same scope
and is an explicit learner attestation that the rubric was applied; it does
not certify mastery or deploy anything. A later missing or changed file
invalidates the rendered review state until the material is recorded again.

## [Stage 9 — build your own](stage9-project/)

The café is a stand-in. The last thing to do is throw it away.

Pick a domain you actually know: a library's returns desk, a lab booking system, a tutoring service, your own inbox. Then build the same nine things for it — the rules version and the phrasing that breaks it; a prompt that replaces the rules; **twenty cases of your own**; the context the model needs and lacks; a tool and the loop; a gate on the one action you could not undo; a step no model may skip; and the input that comes from a stranger.

Nobody will grade it. The point is that you now know what the twenty cases *are* for your own domain — which is the part a café cannot teach.

The [`stage9-project/`](stage9-project/) folder provides a Markdown artifact template, JSON eval template and evidence-based rubric. It asks for a problem boundary, failure input, minimal eval, irreversible gate, trust boundaries and candid retrospective; it does not prescribe one Provider, framework or prompt.

## Honest limits

Nothing here makes you a machine-learning engineer; it is about **building
systems that call models**, which is a different job. The security stage is an
introduction to one attack, not a security course. Bind every observed model
behavior to the Provider, requested model, configuration and run date. The
engineering questions remain useful even when those observations change.

---

Licensed [MIT](../LICENSE). Corrections and extra stages welcome via [issues](https://github.com/HUDongpin/agent-edu/issues).

**A legacy Python edition** is preserved at [`legacy/course-python/`](../legacy/course-python/) for reference. The maintained Part 3 path described by the site, checks and progress file is this TypeScript course.
