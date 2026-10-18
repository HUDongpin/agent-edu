> English：[README.md](README.md)

# 第 1 阶段 —— 做不到的点单机

**目标：** 亲身碰到那堵让这一切变得必要的墙。这一阶段完全没有模型。

```bash
npx tsx course/stage1-kiosk/run.ts
```

你在写一台普通的咖啡馆点单机：规则进去，订单出来。它很快、免费，而且完全可预测。

只有一个 `TODO`：让 `"large flat white"` 能用。然后试试文件底部那些输入。

```bash
npx tsx course/check.ts 1
```

**卡住了？** 提示 1 和提示 2 在 [HINTS.zh-Hans.md](../HINTS.zh-Hans.md)，然后看 [SOLUTIONS.md](../SOLUTIONS.md)。

## 要注意什么

`check.ts` 故意只盯 **两件事**：

1. 你为它们写了规则的那些说法必须能用。
2. `"could I grab a large flat white when you get a sec"` 必须失败。

第二件不是要你修的 bug。它就是发现本身。你 *可以* 让它通过——再加一个 `if`。然后有人说 *"one large flat white, ta"*，你再加一个。真正的咖啡馆会有几百种说法，而你必须在顾客开口之前把每一种都想到。

也请注意这段代码无可争辩的优点：同样的输入，同样的输出，每一次，免费，不到一毫秒。接下来八个阶段不要把它扔掉。真实系统的大部分，仍然应该长得像这个文件。

## 逐条讲解 TODO

`run.ts` 里只有一个 `TODO`。

**让 `"large flat white"` 能用。** `takeOrder` 现在只会处理 `"tea"` 和 `"large tea"`，其他一律返回 `null`。你要补上一条规则，把 `"large flat white"` 变成一张票据：名字是 `"flat white"`，杯型是 `"L"`，价格来自 `MENU["flat white"].L`（5.10）。写法随便——`includes`、拆词、一张表、一条正则都可以。检查器还会确认你没有把已经能用的茶规则弄坏。

正确的答案看起来像：对那句精确的菜单说法返回对的票据；对那句更长、更口语的句子仍然返回 `null`。把每一种新说法都写成规则，并不是这一阶段的目标——那正是后面为什么要上模型的原因。

**下一步：** [第 2 阶段 —— 第一次真正的模型调用](../stage2-prompt/README.zh-Hans.md)
