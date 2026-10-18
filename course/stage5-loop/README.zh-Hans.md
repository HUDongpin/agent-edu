> English：[README.md](README.md)

# 第 5 阶段 —— 让它行动

**目标：** 亲手写出智能体循环。不是某个框架的循环 —— 而是框架包起来的那十二行。

```bash
npx tsx course/stage5-loop/run.ts
```

任务是：**「给咖啡馆补货。」** 没有人告诉模型该怎么做，也没有人能事先说清要走多少步。这项工作分成两个计分步骤。按顺序做。

**步骤 5a —— 先看，再回答一次调用。** `run.ts` 里的 `describeToolUse` 只收到这次回复，别的什么都没有，所以消息格式得先放一放。先用 `console.log` 打出 `response.content`。一个 `tool_use` 块带着 `type`、`id`、`name` 和 `input`；`JSON.stringify` 能让日志读得清。从第一个 `tool_use` 块返回这四个字段。`answerOneTool` 在这之后才跑：把 `response.content` 原样作为助手这一轮追加进 `messages`，对那一个块调用 `tools.RUNNERS`，再推入一条用户消息，里面只有一个 `tool_result`，它的 `tool_use_id` 就是这个块的 `id`。其余的块留给下一步。

```bash
npx tsx course/check.ts 5a
```

用离线替身时，第一个块是 `read_inventory`，它会正常返回。`read_sales` 第一次调用会失败，而那次失败属于步骤 5b。

**步骤 5b —— 循环。** 每一个 `tool_use` 块都要跑。工具抛错时，把错误放进 `tool_result`，并把 `is_error` 设为 true。一条用户消息带上这一轮的全部结果。循环仍然受 `MAX_STEPS` 限制。

```bash
npx tsx course/check.ts 5b
```

`npx tsx course/check.ts 5` 给两个步骤一起打分。通过这一阶段，标准仍然是下了两笔订单，并且给经理发了邮件。

**卡住了？** 提示 1 和提示 2 在 [HINTS.zh-Hans.md](../HINTS.zh-Hans.md)，然后看 [SOLUTIONS.md](../SOLUTIONS.md)。

## 要注意什么

`cafe/tools.ts` 里的工具是故意做了手脚的：

- `read_sales` **第一次被调用时会失败。** 真实的 API 就会这样。
- `place_order("cups_12oz", 500)` **会被拒绝**，因为供应商起订量是 1000。

看模型对这两件事怎么做。它读到错误，然后换一条路。没有人写过那种恢复 —— 它是循环把失败当作信息喂回去之后自然长出来的。

然后再看每一步的 token 数。每一轮都会把整份对话记录再发一遍，所以第 8 轮比第 1 轮贵得多。那是第 4 阶段的问题按时间表抵达了，也是长时间运行的智能体需要压缩上下文的原因。

## 为什么要你亲手写一遍

SDK 自带一个工具运行器（`client.beta.messages.toolRunner`），会替你做这个循环；在真实项目里你大概应该用它 —— 它把重试、流式输出和每一轮的钩子都处理好了。

你亲手写一次，是因为循环 *就是* 那个概念。过了这一阶段，「一个智能体」应该读成它本来的样子：一个 while 循环、一份工具列表，加上一条停止规则。

## 停止规则是你的

`MAX_STEPS` 不是安全毯，它就是设计。没有它的循环可以拿你的钱跑一整夜。把它设成 3 再跑一遍：活只干了一半，咖啡订了，杯子忘了。**选择这个取舍，才是工程。**

## 你现在能读懂什么

回到 `client.beta.messages.toolRunner`。它不再是黑盒：它就是你刚刚写下的那个循环，再加上被正确处理的重试、流式输出和每轮钩子；在真实项目里你应该去用它。它回答不了的，是这一阶段让你亲身感到的那两个问题。仍然得有人选择 `MAX_STEPS`，仍然得有东西决定 `read_sales` 第一次失败时怎么办。运行器替你省掉的是 while 循环。判断从来不在 while 循环里。

## 逐条讲解 TODO

`run.ts` 里有三处 `TODO`，分属两个计分步骤。按顺序做：先看一次调用，再回答它，最后才补上整个循环。

**TODO 5a，第一处：`describeToolUse`。** 你面前只有一次模型回复。这个函数拿不到 `messages`，所以不要在这里拼 `tool_result`。`response.content` 是一块一块的数组。先用 `console.log` 把它打出来，才能看见一个 `tool_use` 块长什么样：`type`、`id`、`name`、`input`。`JSON.stringify` 能让这行日志读得清。然后返回第一个 `type` 为 `"tool_use"` 的块，四个字段从块上抄下来，形状是 `{ type, id, name, input }`。`id` 就是后面那条 `tool_result` 指回这次调用的办法。

**TODO 5a，第二处：`answerOneTool`。** 块已经看见了，这里只回答那一次调用。把助手这一轮完整的 `response.content` 原样追加进 `messages`，不要拆开。只取第一个 `block.type === "tool_use"` 的块，其余留给下一步。在 `tools.RUNNERS` 里按 `block.name` 查出函数，用 `block.input` 调用它。再推入一条用户消息，里面只有一个 `tool_result`：`tool_use_id` 就是这个块的 `id`，`content` 是结果的字符串。错误、并行调用和步数上限都还不是这一处的事。

**TODO 5b：`runAgent` 里循环的其余部分。** 步骤 5a 回答了一个工具；这里要回答每一个工具，包括抛错的那些。

1. 把助手这一轮完整的 `response.content` 追加进 `messages`。数组原样传过去 —— 它带着下一轮需要的 `tool_use` 块（以及模型的思考）。不要拆开，不要只留下文本。

2. 对每一个 `block.type === "tool_use"` 的块：在 `tools.RUNNERS` 里按 `block.name` 查出函数，用 `block.input` 调用它，再做成一条 `tool_result`。`tool_use_id` 是 `block.id`，`content` 是结果字符串；工具抛错时把 `is_error` 设为 true。**不要**让抛错把循环打崩。把错误送回去，模型会读到它并调整。这就是全部诀窍。

3. 把这一轮的全部结果作为一条用户消息追加：`messages.push({ role: "user", content: results })`。全部放进同一条消息。拆成几条会悄悄教会模型不要并行调用工具。

上面那个 `for` 就是步数上限。让 `MAX_STEPS` 继续做主。

`npx tsx course/check.ts 5a` 只看前两处：内容先被打出来，返回的是第一个 `tool_use` 块，助手这一轮原样在前，后面恰好一条用户消息、恰好一个 `tool_result`。`npx tsx course/check.ts 5b` 以及 `npx tsx course/check.ts 5` 还要求至少两笔订单（咖啡馆缺两样东西），并且经理收到了邮件。正确的答案看起来像：失败变成下一轮的数据，而不是一次崩溃的运行；并行的工具调用仍然并行。

**下一步：** [第 6 阶段 —— 围在它外面的机器](../stage6-harness/README.zh-Hans.md)
