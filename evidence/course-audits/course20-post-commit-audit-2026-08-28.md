# Course 20 v1.2.0 first-principles 来源与证据审计

- 审计日期：2026-08-28
- 基线提交：`35ed70003b78b3f398058ee741a1d5c6f5694183`
- 已推送基线：`origin/codex/course-20-agentic-video-editing`
- 当前修复分支：`codex/course-20-first-principles-fix`
- 本次复核运行位置：`/private/tmp/course20-first-principles-final`（临时路径不是永久可复现身份）
- 发布边界：本文的验收数值是 2026-08-28 历史快照。2026-08-30 的后续指令只授权把最终 v1.2.0 技术候选固化为一个本地 commit，供上层任务按准确 SHA 转移；未授权 push、merge、Preview 或部署，本文不是生产批准。
- Historical promotion wording: at the 2026-08-28 snapshot the repair was **not committed** and **not deployed**. The later local transfer commit is not a deployment, and the current bilingual receipt is stale/fail-closed after reviewed-byte changes.
- 学习合约：M6 先定义工具权限，M7 冻结交付合同，M8 才执行；artifact registry 明确区分 **13 process**、12 module-completion 与 **12 Capstone** artifacts。

## 1. 为什么需要 post-commit 审计

2026-08-26 报告是 v1.1.0 的 pre-commit 本地快照。该候选后来在 2026-08-27 提交并推送为 `35ed700`，所以旧报告中“尚未提交、推送”的陈述不能继续当作当前状态。旧 `/private/tmp/aicourse-agentic-video-editing` 工作树也已不存在。

本次审计从已推送基线建立新的隔离分支，不修改 Course 16 主工作树，也不把旧 PASS 沿用为 v1.2.0 的 PASS。最终课程发布仍须重新运行内容、类型、构建、完整静态导出与浏览器门禁。

## 2. 来源账本的结构修复

v1.2.0 账本共有 43 条记录，并按证据性质分开：

| 类型 | 数量 | 证明范围 |
|---|---:|---|
| 固定 GitHub repository | 20 | 固定提交或 release-resolved commit 中可检查的代码/文档/许可证主张 |
| X post | 5 | X 官方 oEmbed 在记录日期可见的作者、日期、URL 与帖子文字；截断即披露 |
| official standard | 5 | MCP、WCAG、ITU、EBU 与 C2PA 的版本化范围 |
| official documentation | 9 | FFmpeg/OTIO/W3C/ACES/OWASP/BBC/Adobe 的具名文档边界 |
| law / regulatory guidance | 2 | EU 与美国法域材料；不是全球规则或法律意见 |
| dated repository issue | 1 | Qwen3-VL issue #1761 在 2026-08-28 的状态与正文指纹 |
| dated official web | 1 | Mosaic API/legal 页面在 2026-08-28 的可见状态 |

这解决了三种原有混淆：

1. **固定仓库不再吸收可变 issue。** `qwen3-vl` 只承担固定 commit 的能力主张；`qwen3-vl-issue-1761` 单独记录 `observedAt=2026-08-28`、`state=open` 与正文 SHA-256 `8bf6791a91280bb0cfe51d9bbc3f74786c7e15d8c2033d849000341db3ea6eae`。该 issue 仍只是一条用户报告，不是维护者确认根因、发生率证据或普遍缺陷。
2. **固定 skill 不再吸收 live 服务声明。** `mosaic-skills` 只证明 commit `8331979...` 中的 skill 表面；当前 API、认证、credits、数据处理与法律页面由 `mosaic-service-observation` 独立承担。live 页面不能冻结价格、保留、训练用途、provider 或社交发布授权。
3. **工程政策不再伪装成上游事实。** Paragraph evidence 使用七种模式：`source-grounded`、`engineering-synthesis`、`version-watch`、`course-policy`、`official-standard`、`dated-observation` 与 `jurisdiction-dependent`。Source ledger 另用四种用途：`claim-evidence`、`version-watch`、`field-signal-context` 与 `atlas-only`。stable asset ID、unknown-rights blocking、有限 repair loop、默认断网与 fail-closed 发布属于课程工程综合或课程政策，除非某一固定来源明确直接支持。

## 3. 新增与修正的一方证据

### OpenTimelineIO file bundle

OTIO 记录新增固定提交中的 [file-bundle 文档](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/44236713c1db295a6ffc66189ae98dbdfd0cb9c4/docs/tutorials/otio-filebundles.md)。因此课程可以准确区分：核心 `.otio` 引用媒体；`.otioz` / `.otiod` adapters 可以打包相关媒体；OTIO 本身仍不负责解码、编码或渲染，adapter 往返保真也必须实测。

### MCP 规范

新增 `model-context-protocol-spec`，绑定 MCP `2025-11-25` 规范与证据 commit `d8fdc88fb970313247d8a180ac1ec3f6a10a8885`：

- [Tools specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/d8fdc88fb970313247d8a180ac1ec3f6a10a8885/docs/specification/2025-11-25/server/tools.mdx)
- [Authorization specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/d8fdc88fb970313247d8a180ac1ec3f6a10a8885/docs/specification/2025-11-25/basic/authorization.mdx)

规范可支持 tool schema、输入/结果校验、访问控制、敏感操作确认、超时、日志、scope 与 audience 控制；它不等于宿主沙箱、媒体权利、成本/撤销策略，也不保证 server、tool description 或 tool output 可信。

### 提示注入与不可信媒体输入

课程账本采用 OWASP Prompt Injection 与 Excessive Agency 的官方安全资料，直接支持把外部内容保持为不可信数据、限制工具权限并保护 secrets。当前 `sources.ts` 没有 `openai-codex-action-security` 记录，因此本报告不把该仓库声称为已纳入的固定课程来源。

课程进一步把文件名、EXIF、metadata、OCR、转录、字幕、网页内容与 MCP/tool output 视为不可信数据。这是保守的 `course-policy`，不是把 OpenAI 文档未逐项列出的内容冒充直接引文。解析器默认低权限、资源受限、断网；内容中的“扩大目录、联网、读取 secret、安装组件、改变批准状态或发布”文字不得自行升级成指令。

### 字幕与无障碍

新增 [WCAG 2.2 SC 1.2.2](https://www.w3.org/TR/WCAG22/#captions-prerecorded) 与 [W3C Understanding document](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)。该标准支持预录同步媒体字幕以及相关语音/非语音信息边界；它不证明一个 sidecar 或自动转录已经满足 timing、speaker、可读性、语言和交付要求，也不替代适用法律、机构、合同或平台政策。

## 4. 保留 pins，同时记录 latest-observed drift

| Source | 课程 pin | 2026-08-28 latest observed | 判断 |
|---|---|---|---|
| Remotion | `v4.0.517` / `a2c2a626...` | [v4.0.518](https://github.com/remotion-dev/remotion/releases/tag/v4.0.518) | 不机械 repin |
| Montaj | `v3.10.1` / `634d523f...` | [v4.2.0](https://github.com/theSamPadilla/montaj/releases/tag/v4.2.0) | 不机械 repin |
| Timeline Studio | `v1.0.5` / `2a59ffcf...` | [v1.0.6](https://github.com/MartinDelophy/ai-video-editor/releases/tag/v1.0.6) | 不机械 repin |
| QCut | `v2026.08.26.1` / `d297613a...` | [v2026.08.26.3](https://github.com/Quriosity-agent/qcut/releases/tag/v2026.08.26.3) | 不机械 repin |
| Velorn | `v0.3.29` / `90aa9028...` | [v0.3.30](https://github.com/VelornLabs/velorn/releases/tag/v0.3.30) | 不机械 repin |

`revision` / `resolvedCommit` 回答课程依据什么；`latestObserved*` 回答 2026-08-28 看到什么。新 release 尚未经过等价性、许可、隐私、安全、接口与回归测试，因此“旧 pin 不是 latest”不构成旧快照错误，“出现新 release”也不构成当前教学主张失效证明。

## 5. 当前结论、验收证据与发布边界

来源与证据层的 P1 已按 fail-closed 方式修复：固定/可变来源分离，Qwen issue 具备状态与正文指纹，Mosaic repo/service 不再混写，OTIO bundle 有固定文档，MCP、安全与字幕标准均有一方记录，版本漂移不会静默覆盖可复现 pins。

下表只记录 2026-08-28 当时对 Course 20 v1.2.0 的验收。后续字节变化使这些结果不能代替最终 exact-SHA candidate 的重新运行结果，也使当时的人工签署失效：

| 门禁 | 当前结果 |
|---|---|
| Course 20 release / artifact / assessment | PASS；13 process、12 module-completion、12 Capstone；20/20 unit |
| 本地实验合同与 adversarial controls | PASS；16/16 阻断 |
| 真实 FFmpeg/ffprobe smoke | PASS；`course20-smoke-20260827231607-51093464`；122 秒 30/1 源 → 47 秒、1080×1920、30/1 candidate；candidate SHA-256 `2b2f98180a4b1eb8f6e716a0a531e6b0dd51ceb807f54ae733e11e33fb5a4fec`；plan SHA-256 `e49463187b75ae62c863ec3ebd50789621019eb40a7723156119138fe41c6fff`；最终 `do-not-publish` |
| TypeScript / targeted ESLint / progress / i18n / diff check | PASS |
| Next.js 16.3.1 direct production build | PASS；1,940 static pages |
| Schema-3 Course 20 export/static | PASS；99 routes、13 JS/CSS、12,157 manifest-bound files |
| Playwright | PASS；17/17 |
| 人工双语编辑审核 | 2026-08-28 surface 的历史 PASS；后续受审 byte 已变化，当前 receipt 为 `stale-human-editorial-signoff` 并阻断 production promotion；旧签署不得沿用 |

Playwright 新增并通过：五维 Capstone rubric 与 12/15 门、浏览器内本地文件 SHA-256 且不持久化文件名/bytes、以及 home/catalog/dashboard 对同一 10/12 receipts 一致显示 83%。Module 页面也逐页显示 `Consumes / Produces / Entry gate / Invalidates when`。

历史人工签署只曾解除其准确绑定 surface 的 Course 20 双语编辑阻断；它现在已经 stale，不能解除当前阻断，也从未授权 push、merge、Vercel Preview promotion 或 production deployment。累计仓库 release 仍受 Course Codex 真实 UI captures 缺失所阻断。

全仓 `npm run build:release` 仍在 Course 20 之前被 Course Codex 的 18 张真实 UI capture 门阻断；因此本报告不把 Course 20 的局部 PASS 提升为累计全站、Vercel Preview 或生产部署 PASS。2026-08-30 后续授权仅允许一个本地 exact-SHA transfer commit；旧 v1.1.0 PASS、本文的 2026-08-28 数值与远程基线都不能替代最终 commit 字节的审查。
