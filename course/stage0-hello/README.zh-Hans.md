> English：[README.md](README.md)

# 第 0 阶段 —— 一次调用

**目标：** 在别的东西把你搞糊涂之前，先证明 TypeScript 入口、服务商配置和网络是通的。加上 `--offline` 时，同一次预检会在没有密钥、也不发网络请求的情况下，证明本地代码路径是通的。

```bash
npm ci
export DEEPSEEK_API_KEY=your_key_here     # platform.deepseek.com/api_keys
# or: export ANTHROPIC_API_KEY=your_key_here
#     export CAFE_PROVIDER=anthropic
npx tsx course/stage0-hello/run.ts
```

`run.ts` 里有一个 `TODO`。填上，再跑一遍。

```bash
npx tsx course/check.ts 0
```

**卡住了？** 提示 1 和提示 2 在 [HINTS.zh-Hans.md](../HINTS.zh-Hans.md#第-0-阶段)，然后看 [SOLUTIONS.md](../SOLUTIONS.md)。

## 要注意什么

最后一行会打印这次调用花了多少钱。通常是几分钱的零头。阶段变大时盯着它——到第 3 阶段，每次运行就要打 20 多次调用，正是那些从不看这个数字的人会吃一惊的地方。

如果没有 API 密钥，每个阶段都可以用 `--offline` 走课程自带的脚本化替身：

```bash
npx tsx course/stage0-hello/run.ts --offline
```

离线模式是退路，不是这门课。第 2 阶段留着参考提示词的一次真实运行：含糊的问题常常重复同一个回答，清楚的订单重复了一个错误的价格。替身不会产生那份记录。[recorded.ts](../stage2-prompt/recorded.ts) 不需要密钥就能打印它，第 2 阶段加上 `--offline` 也会打印。

## 逐条讲解 TODO

`run.ts` 里只有一个 `TODO`。

**`QUESTION`。** 它现在是空字符串。你要做的，是写成一句你自己的问题——任何问题都行。这一阶段不在乎模型说了什么，只在乎密钥、网络和 SDK 在你往上堆东西之前已经对齐。检查器会拒绝空的 `QUESTION`，然后调用 `runQuestion()`，要求回来的是一段非空的回答。离线模式下，脚本化替身也会给出一段回答，用来证明本地控制路径；它不能证明一把真实密钥或网络是通的。不要去改 `ask` 的调用方式，也不要去「优化」问题本身。

**下一步：** [第 1 阶段 —— 做不到的点单机](../stage1-kiosk/README.zh-Hans.md)
