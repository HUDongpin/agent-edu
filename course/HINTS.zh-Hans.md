# 提示

每个引导阶段两条提示。先打开提示 1。还是卡住，再打开提示 2。能通过检查的代码在 [SOLUTIONS.md](SOLUTIONS.md)。这份参考解答目前只有英文，等你准备好不再自己琢磨时再打开。

第 5a 步和第 5b 步分开计分。下面的第 5 阶段只告诉你该打开哪一步。第 9 阶段是迁移项目，这里没有它的提示。

检查器打印的是英文 `Hint 1`。它和下面的「提示 1」是同一条。

## 第 0 阶段

<details>
<summary>提示 1（Hint 1）</summary>

检查器只看有没有把一个问题发出去、有没有收回一个回答。你问什么，不是这一课的重点。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage0-hello/run.ts` 里，把 `QUESTION` 设成任意非空字符串。`runQuestion` 会把它交给 `ask`。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 1 阶段

<details>
<summary>提示 1（Hint 1）</summary>

点单机只懂你写过规则的句子。「large flat white」还没有规则。文件里现成的茶规则，就是一条能用的规则该有的样子。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage1-kiosk/run.ts` 的 `takeOrder` 里，为这句原文加一条分支。单据的名字是 flat white，`size` 是 `L`，价格用 `MENU` 上的大杯价。原来的茶规则留着。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 2 阶段

<details>
<summary>提示 1（Hint 1）</summary>

第 1 阶段失败，是因为普通句子没有对应的规则。系统提示词就是请模型来做这件事。菜单先不要放进去。价格是第 4 阶段的课，两边一比才看得出差别。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage2-prompt/run.ts` 里写 `SYSTEM`，让一句话变成一张订单。检查器要看的字段是 `items`、`total` 和 `needs_confirmation`。`ask` 已经带上 `ORDER_SCHEMA`，提示词不必再描述 JSON。不要粘贴菜单。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 3 阶段

<details>
<summary>提示 1（Hint 1）</summary>

要测量的东西你已经写过了。这一阶段不要一条新提示词。它要那二十个用例去调用第 2 阶段的函数。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage3-evals/run.ts` 里，从第 2 阶段导入 `takeOrder`，赋给 `SYSTEM_UNDER_TEST`。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 4 阶段

<details>
<summary>提示 1（Hint 1）</summary>

第 3 阶段没过的，多半是价格。模型在编价格，因为提示词从没说过这家店卖什么。加上「要准确」这类话，并没有补上这个事实。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage4-context/run.ts` 里，从你的第 2 阶段 `SYSTEM` 出发，调用 `menuText` 把菜单放进去。顾客说得含糊，或者要了菜单上没有的东西，就把 `needs_confirmation` 设为 true。没说杯型时用小杯。提示词里的价格必须是菜单上的价格。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 5 阶段

<details>
<summary>提示 1（Hint 1）</summary>

不要先写整个循环。先看清一次工具调用里到底有什么，再回答这一次。失败、一次要好几个工具、还有步数上限，都是下一步的事。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

先做 5a，再做 5b。单独的 5 会两个都打分。在 `stage5-loop/run.ts` 里，函数按顺序是 `describeToolUse`、`answerOneTool` 和 `runAgent`。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 5a 步

<details>
<summary>提示 1（Hint 1）</summary>

工具调用不是用一句话交回来的，而是模型回复里的一块内容。你面前只有一次回复，只回答第一块工具。错误和并行调用都是下一步的事。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `describeToolUse` 里先把 `response.content` 打出来，再从第一块 `type` 为 `tool_use` 的内容上抄下 `type`、`id`、`name` 和 `input` 返回。

在 `answerOneTool` 里，把同一份 `response.content` 原样追加为助手这一轮。到 `tools.RUNNERS` 里按名字找到函数，用块上的 `input` 调用它。推入一条用户消息。里面唯一的 `tool_result` 把 `tool_use_id` 设成这块的 `id`，`content` 设成工具返回值的字符串。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 5b 步

<details>
<summary>提示 1（Hint 1）</summary>

有一个工具会失败，而咖啡馆缺两样东西。失败如果让循环崩掉，第二笔订单就不会发生，经理也收不到邮件。不肯自己停下来的运行，得由你的上限把它停住。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `runAgent` 里，把 `response.content` 原样追加。每一个 `tool_use` 块都做一条 `tool_result`。调用抛错时接住它，把错误文本放进 `content`，并把 `is_error` 设为 true。推入一条用户消息，它的 `content` 是这整个数组。循环的上限留给 `MAX_STEPS`。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 6 阶段

<details>
<summary>提示 1（Hint 1）</summary>

五次运行用的是同一个模型、同一条提示词、同一组工具。你改的只是工具调用外面的代码。如果开着闸门花的钱和关着一样多，闸门就没有真的在拒绝。默认放行的闸门不是闸门。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage6-harness/run.ts` 的 `callTool` 里、工具真正跑起来之前：`parts.gate` 开着时，一次 `place_order` 不能让已承诺的花费超过 `APPROVAL_THRESHOLD`。已承诺的花费是 `tools.ORDERS` 里已有的订单，用 `UNIT_COST` 计价。未知价格，以及不是正数、不是有限数的数量，都要失败即拒绝（fail closed）。订单会超过阈值时，去问 `approve`；被拒绝就作为错误结果交还给模型，让它读得懂。

`try` 里应该调用 `tools.RUNNERS`。`parts.errors` 开着时，最后的失败文本是真正的原因；关着时，文本就是光秃秃的 Error。`callTool` 返回之后，`parts.log` 开着就把一行追加到 `RUN_LOG`。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 7 阶段

<details>
<summary>提示 1（Hint 1）</summary>

请模型小心，只是一条请求。图是一种保证：没有任何一条通向顾客的路径可以绕过审阅者，而且只有一个函数可以把回复送出去。你写的两个节点负责分类和判断。它们不发送。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage7-graph/run.ts` 里，`route` 用 `ROUTE_SCHEMA` 去 `ask`，返回 `lane`。`review` 用 `REVIEW_SCHEMA` 去 `ask`，判断草稿是否守住 `POLICY`，把 `approved` 和 `problem` 一起返回。`send` 留给 `handle`。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。

## 第 8 阶段

<details>
<summary>提示 1（Hint 1）</summary>

模型会把整封邮件读成它该遵守的句子。一道防御告诉它哪一段是陌生人的数据。另一道防御不指望它听进去：模型做完决定之后，用代码限制这个决定能做什么。

</details>

<details>
<summary>提示 2（Hint 2）</summary>

在 `stage8-security/run.ts` 里，`labelAsData` 为 true 时，往 `system` 加一句话，告诉模型这封邮件是不可信的材料，并说明谁才有权给它下指令。然后把邮件包进一道看得见的边界，再交给 `ask`。

`capTools` 为 true 时，在 `ask` 返回之后，用代码把 `refund_amount` 限制在 0 到 `ORDER_TOTAL` 之间，并把 `send_address_list` 设为 false。这件事写在代码里，不写在提示词里。

</details>

完整答案在 [SOLUTIONS.md](SOLUTIONS.md)（目前只有英文）。
