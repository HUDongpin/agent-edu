# Hints

Two hints for each guided stage. Open Hint 1 first. Open Hint 2 only if you are still stuck. The code that passes is in [SOLUTIONS.md](SOLUTIONS.md), and reading it ends the attempt.

Stages 5a and 5b are graded apart. The stage 5 section only tells you which of those to open. Stage 9 is the transfer project and has no hints here.

## Stage 0

<details>
<summary>Hint 1</summary>

The checker only asks whether a question went out and an answer came back. What you ask is not the lesson.

</details>

<details>
<summary>Hint 2</summary>

In `stage0-hello/run.ts`, set `QUESTION` to any non-empty string. `runQuestion` passes that string to `ask`.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 1

<details>
<summary>Hint 1</summary>

The kiosk only understands a phrase you wrote a rule for. "large flat white" is not one of them yet. The tea rules already in the file show the shape of a rule that works.

</details>

<details>
<summary>Hint 2</summary>

In `stage1-kiosk/run.ts`, add a branch in `takeOrder` for that exact phrase. The ticket's name is flat white, its `size` is `L`, and its price is the large price on `MENU`. Leave the tea rules where they are.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 2

<details>
<summary>Hint 1</summary>

Stage 1 fell over because ordinary sentences had no rule. A system prompt asks the model to do that job. Leave the menu out on purpose. Stage 4 is where the prices come from, and the comparison is the point.

</details>

<details>
<summary>Hint 2</summary>

In `stage2-prompt/run.ts`, write `SYSTEM` so one customer sentence becomes an order. The checker looks for `items`, `total` and `needs_confirmation`. `ask` already sends `ORDER_SCHEMA`, so the prompt does not have to describe JSON. Do not paste the menu.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 3

<details>
<summary>Hint 1</summary>

You already wrote the thing to measure. This stage does not want a new prompt. It wants the twenty cases to call the stage 2 function.

</details>

<details>
<summary>Hint 2</summary>

In `stage3-evals/run.ts`, import `takeOrder` from stage 2 and assign it to `SYSTEM_UNDER_TEST`.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 4

<details>
<summary>Hint 1</summary>

The misses in stage 3 are mostly prices. The model is inventing them because the prompt never says what the café sells. Adding "be accurate" does not add that fact.

</details>

<details>
<summary>Hint 2</summary>

In `stage4-context/run.ts`, start from your stage 2 `SYSTEM` and include the menu by calling `menuText`. When the customer is vague, or asks for something that is not sold, `needs_confirmation` should be set. When no size is given, use the small one. A price in the prompt has to be a menu price.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 5

<details>
<summary>Hint 1</summary>

Do not write the whole loop first. Look at one tool call until you can say what is inside the block. Answering that one call is the next edit. Failures, several tools at once, and the step limit are the step after that.

</details>

<details>
<summary>Hint 2</summary>

Grade 5a before 5b. Plain 5 runs both. In `stage5-loop/run.ts` the functions, in order, are `describeToolUse`, `answerOneTool` and `runAgent`.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 5a

<details>
<summary>Hint 1</summary>

A tool call does not come back as a sentence. It comes back as a block inside the model's reply. You are looking at one reply, and you answer only the first tool block. Errors and parallel calls belong to the next step.

</details>

<details>
<summary>Hint 2</summary>

In `describeToolUse`, log `response.content`, then return `type`, `id`, `name` and `input` copied from the first block whose `type` is `tool_use`.

In `answerOneTool`, append that same `response.content` as the assistant turn, unchanged. Look the function up on `tools.RUNNERS` and call it with the block's `input`. Push one user message. Its single `tool_result` sets `tool_use_id` to the block's `id`, and `content` to the tool's return value as a string.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 5b

<details>
<summary>Hint 1</summary>

One tool will fail, and the café is short of two things. If the failure crashes the loop, the second order never happens and the manager never gets the email. A run that will not stop itself has to be stopped by your limit.

</details>

<details>
<summary>Hint 2</summary>

In `runAgent`, append `response.content` unchanged. For every `tool_use` block, build a `tool_result`. When the call throws, catch it, put the error text in `content`, and set `is_error` to true. Push one user message whose `content` is that whole array. Leave the loop bounded by `MAX_STEPS`.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 6

<details>
<summary>Hint 1</summary>

The five runs share one model, one prompt and one set of tools. The only thing you change is the code around the tool call. If the gated run spends as much as an ungated one, the gate is not actually refusing. A gate whose default is to allow is not a gate.

</details>

<details>
<summary>Hint 2</summary>

In `callTool` in `stage6-harness/run.ts`, before the tool runs: when `parts.gate` is on, a `place_order` must not push committed spend past `APPROVAL_THRESHOLD`. Committed spend is what is already in `tools.ORDERS`, priced with `UNIT_COST`. Unknown prices, and quantities that are not positive and finite, fail closed. Call `approve`. A refusal comes back as an error result the model can read.

The `try` should call `tools.RUNNERS`. When `parts.errors` is on, the final failure text is the real reason. When it is off, that text is the bare word Error. After `callTool` returns, append a line to `RUN_LOG` when `parts.log` is on.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 7

<details>
<summary>Hint 1</summary>

Asking the model to be careful is a request. The graph is a guarantee: no path to the customer skips the reviewer, and only one function may deliver the reply. The two nodes you write classify, and judge. They do not send.

</details>

<details>
<summary>Hint 2</summary>

In `stage7-graph/run.ts`, `route` should `ask` with `ROUTE_SCHEMA` and return the `lane`. `review` should `ask` with `REVIEW_SCHEMA` whether the draft stays inside `POLICY`, and return `approved` together with `problem`. Leave `send` to `handle`.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).

## Stage 8

<details>
<summary>Hint 1</summary>

The model reads the whole email as sentences it should follow. One defence tells it which part is data from a stranger. The other defence does not trust that it listened: after the model has decided, code limits what that decision is allowed to do.

</details>

<details>
<summary>Hint 2</summary>

In `stage8-security/run.ts`, when `labelAsData` is true, add a line to `system` saying the email is quoted material from an untrusted source and that only the café's operators can give instructions. Then wrap the email so the boundary is visible in the text passed to `ask`.

When `capTools` is true, after `ask` returns, keep `refund_amount` from exceeding `ORDER_TOTAL`, and set `send_address_list` to false. Do that in code, not in the prompt.

</details>

Full answer: [SOLUTIONS.md](SOLUTIONS.md).
