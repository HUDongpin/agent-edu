> English：[README.md](README.md)

# 第三部分 —— 动手把它做出来

[手册](https://aicourse.top/zh-Hans/handbook/)给你心智模型，[实验室](https://aicourse.top/zh-Hans/lab/)让你亲手摸到它。这边是另一半：**同一家咖啡馆，九个引导阶段（0–8），再加一个第 9 阶段迁移项目，在你自己的机器上发起真实的 API 调用。** 结束时，你手里会有一个自己做出来的智能体、一套给它打分的评测集、一个你敢让它整夜跑下去的运行框架，以及把这些控制手段迁移到你熟悉领域的脚手架。

> **这一部分假定你会读写基础 TypeScript** —— 函数、对象、`for` 循环、`await`。多不了多少。如果这让你发虚，先去做 **[实验室](https://aicourse.top/zh-Hans/lab/)**：和第 0 到第 4 阶段同一块地，在浏览器里完成，什么都不用装。

## 开始之前

下面所有命令都从 **仓库根目录** 运行 —— 课程和网站共用一份 `package.json`，这个文件夹里没有额外要装的东西。

```bash
npm install
export DEEPSEEK_API_KEY=your_key_here      # platform.deepseek.com/api_keys
# ...or, if you'd rather run it on Claude:
export ANTHROPIC_API_KEY=your_key_here     # console.anthropic.com
npx tsx course/stage0-hello/run.ts
```

如果 `npx tsx` 停下来问要不要安装这个包，请拒绝。这表示依赖还没安装，只装这一个包仍然缺 `@anthropic-ai/sdk`。请在仓库根目录运行 `npm ci`，然后再执行刚才的命令。依赖缺失但脚本已经启动时，它会打印两行（一行英文、一行中文），让你运行 `npm ci`，然后退出。

每个阶段都是一个文件夹，里面有 `README.md`（以及这份 `README.zh-Hans.md`）和一份 `run.ts`。第 0–4 阶段各有一个 `TODO`；第 5 阶段有两个计分步骤（先 5a，再 5b）；第 6 阶段有四个；第 7 和第 8 阶段各有两个。把它们填上，跑起来，然后给自己打分：

```bash
npx tsx course/check.ts 0      # or: npm run course 0
```

在干净的克隆上，先在改任何东西之前证明「无密钥」这条路是通的：

```bash
npm run course:offline
```

这条命令用的是课程自带、结果确定的脚本化替身。它不会向服务商发请求，也不会写下任何私密记录。它证明的是本地控制流，不是真实模型的质量或波动。

**没有 API 密钥？** 在任意命令后面加 `--offline`，填完该阶段的 `TODO` 之后就会用这个脚本化本地替身。用 `npx` 时加在末尾；用 `npm run` 时必须先写 `--`，因为 npm 会把裸的 `--offline` 当成自己的旗标吃掉：

```bash
npx tsx course/check.ts 4 --offline
npm run course -- 4 --offline
```

每个已完成的阶段都支持这条路径。第 2 阶段的课包含：看一个真实模型对同一问题给出不同回答，而结果确定的替身做不到这一点；如果你之后想看这种对比，请用一把你自己的、额度低、可撤销的密钥。绝不要借用或分享别人的凭证。

**卡住了？** 提示 1 和提示 2 在 [HINTS.zh-Hans.md](HINTS.zh-Hans.md)，然后看 [SOLUTIONS.md](SOLUTIONS.md)。[`SOLUTIONS.md`](SOLUTIONS.md) 里每个 `TODO` 都填好了，一个阶段一节。这份参考解答目前只有英文。

**费用：** 离线替身不会向服务商发请求。实时阶段会打印实测用量，以及按代码里的模型和带日期的价格表估算的费用。总额会随服务商、模型、缓存、高峰时段和你重跑的次数变化；一份旧的样例总额不是承诺。跑之前先看估算，把服务商控制台当作账单记录。同样的练习，Claude 可能比 DeepSeek 贵得多。

## 两家服务商，同一条接缝

课程可以跑在 **DeepSeek** 上，也可以跑在 **Anthropic 的 Claude** 上，各阶段的代码一行都不用改。

```bash
export DEEPSEEK_API_KEY=your_key_here # default if both are set
export CAFE_PROVIDER=anthropic      # force one
export CAFE_MODEL=deepseek-v4-pro   # or a Provider-supported model
```

之所以能这样，是因为 DeepSeek 提供了 **兼容 Anthropic 的端点**，同一份 `@anthropic-ai/sdk` 换一个 `baseURL` 就能驱动两边。第 5、第 6 阶段是亲手拼 `tool_use` / `tool_result` 块的，它们根本察觉不到差别。

*消不掉* 的那些差别才是有意思的部分，而且它们全都住在 [`cafe/llm.ts`](cafe/llm.ts) 里：

| | Anthropic | DeepSeek |
|---|---|---|
| 结构化输出 | 原生 —— 回复的形状 **不可能** 错 | **接受了，然后默默忽略。** 你拿到的是散文。`llm.ts` 在提示词里开口要，再自己校验答案 |
| 「再想认真一点」 | `output_config.effort` | `thinking: {type:"disabled"}` —— 如果开着思考、又把 `max_tokens` 设得很小，它会把整段预算都花在思考上，然后返回一个 **没有报错的空字符串** |
| token 计数 | 数你的文本 | 数整次请求，大约 83 个脚手架 token 也算进去，所以 `llm.ts` 会把这个底数减掉 |
| 价格 | 本课程快照里是一口价 | Flash/Pro、缓存命中/未命中和输出使用带日期的共享表；高峰窗口是 UTC 周一到周五 01:00–04:00 和 06:00–10:00；周末是非高峰 |

这才是服务商抽象真正要做的事。不是「换个 URL」——谁都会。而是弄清你的哪些假设其实是厂商行为，而唯一的办法，就是拿同一套评测去打两家。

## 九个引导阶段（0–8）

| | 阶段 | 你要写的 | 它教什么 | 难度 | 大致用时 |
|---|---|---|---|---|---|
| 0 | [hello](stage0-hello/README.zh-Hans.md) | 一次 API 调用 | 你的密钥能用 | ★ | 10 分钟 |
| 1 | [kiosk](stage1-kiosk/README.zh-Hans.md) | if/else 规则 | 把这一切逼出来的那堵墙 | ★ | 15 分钟 |
| 2 | [prompt](stage2-prompt/README.zh-Hans.md) | 一条系统提示词 | **同一个问题，五种不同的回答** | ★★ | 20 分钟 |
| 3 | [evals](stage3-evals/README.zh-Hans.md) | 接上 20 个用例 | 会变的模型输出需要评测；确定的代码仍然需要单元测试 | ★ | 15 分钟 |
| 4 | [context](stage4-context/README.zh-Hans.md) | 把菜单放进提示词 | 多数「模型很差」其实是「从没告诉它」 | ★★ | 25 分钟 |
| 5 | [loop](stage5-loop/README.zh-Hans.md) | 一次工具调用，然后是循环 | 工具、失败、恢复、步数上限 | ★★★ | 40 分钟 |
| 6 | [harness](stage6-harness/README.zh-Hans.md) | 重试、闸门、日志 | 同一个模型，五次受控运行 | ★★★★ | 60 分钟 |
| 7 | [graph](stage7-graph/README.zh-Hans.md) | 一个路由器和一个审阅节点 | 请求 vs 保证 | ★★★ | 30 分钟 |
| 8 | [security](stage8-security/README.zh-Hans.md) | 两道防线 | 试图发号施令的输入 | ★★ | 25 分钟 |

难度看的是该阶段 `run.ts` 里的 `TODO`：有多少个，以及每一处要你写多少代码。★ 是一处小改动。★★★★ 是第 6 阶段：四个 `TODO`，其中包括累计审批闸门。表里的时间是离线路径上大致的第一遍，阅读也算在内。加在一起，第 0–8 阶段大约四小时。第 9 阶段是开放式的，不计入这个总数。

**评测故意放在第三。** 一旦你有了一个数字，后面每一次改动都是一次测量，而不是一场争论。

**如果只做两个阶段：做 3 和 4。** 看着一个数字从 7/20 变成 19/20，原因只是你告诉了模型它在卖什么——这是这里最有用的一件事。

## 你的成绩单

```bash
npx tsx course/report.ts       # or: npm run report
```

```
  3  evals      7/20  ← your baseline
  4  context    19/20  with the menu in context
  ...
  The only number that matters: 7/20 → 19/20 (+12)
```

这 20 个咖啡馆用例故意在第 4 阶段 **停住**。一个去下补货单的智能体并不是在点单，所以第 5–8 阶段报告的是真正适合它们的量——无人值守时花掉的钱、被审阅者拦住的草稿、额度守住的退款。把同一套评测套到每个阶段上会看起来更整齐，告诉你的东西却更少。

## [第 9 阶段 —— 自己动手做](stage9-project/README.zh-Hans.md)

咖啡馆只是替身。最后一件事是把它扔掉。

选一个你真正懂的领域：图书馆的还书台、实验室预约系统、辅导服务、你自己的收件箱。然后为它做出同样的九件事——规则版，以及把它拆穿的那句措辞；一条取代规则的提示词；**你自己的二十个用例**；模型需要却缺少的上下文；一个工具和循环；一道守住那个无法撤销的动作的闸门；一个任何模型都不能跳过的步骤；以及来自陌生人的输入。

没有人会给它打分。重点是：你现在知道，对你自己的领域来说，那二十个用例 *是什么* —— 这是咖啡馆教不了的部分。

[`stage9-project/`](stage9-project/) 文件夹提供一份 Markdown 作品模板、JSON 评测模板、基于证据的量规，以及一份 [完整范例](stage9-project/worked-example.md) —— 一个做完的图书馆还书台项目，按量规诚实打出 12 分中的 11 分。它要求问题边界、失败输入、最小评测、不可逆闸门、信任边界和坦诚的回顾；它不指定某一家服务商、某一个框架或某一条提示词。第 9 阶段的这些模板（`artifact-template.md`、`eval-template.json`、`RUBRIC.md`、`worked-example.md`）目前仍是英文，没有翻译。

## 诚实的边界

这里不会把你变成机器学习工程师；它讲的是 **构建会调用模型的系统**，那是另一份工作。安全阶段是对一种攻击的入门，不是一门安全课。而展示出来的每一种模型行为，都是 **截至你实际跑的那个模型** —— 有些一年后就会错。问题不会。

---

许可为 [MIT](../LICENSE)。欢迎通过 [issues](https://github.com/HUDongpin/agent-edu/issues) 提交勘误和额外阶段。

**一份遗留的 Python 版** 保存在 [`legacy/course-python/`](../legacy/course-python/)，供对照。网站、检查器和进度文件所描述的、正在维护的第三部分路径，是这份 TypeScript 课程。
