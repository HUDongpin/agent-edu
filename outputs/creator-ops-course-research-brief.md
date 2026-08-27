# aicourse.top 第 16 门课程研究简报

## 《智能体赋能自媒体运营》：从“会生成”到“可审计经营系统”

- 课程代号：Creator Ops / Course 16
- 文档用途：供课程负责人、教研、工程、内容安全与视觉团队共同定案
- 选源原则：以官方 GitHub 仓库、官方许可证、官方发布页、官方安全公告和官方文档为一手证据
- 核验日期：**2026-08-26**
- 结论状态：课程技术选型建议；不是法律意见，也不等同于对任一平台发布权限的授权
- 证据侧车：[creator-ops-course-research-brief.provenance.md](./creator-ops-course-research-brief.provenance.md)

---

## 一、先给结论

这门课不应被做成“提示词写作课”或“自动发帖工具合集”。世界级版本应把自媒体运营建模为一个有证据、有门禁、有人审、有反馈、有资产账的智能体经营系统：

> 受众与信号 → 证据研究包 → 编辑部多智能体 → 写作与事实门禁 → 多模态资产 → 一源多用 → 人工批准 → 受控发布 → 反馈分析 → 评测与治理闭环。

推荐以以下六层技术主线组织课程：

1. **编排层**：以 [LangGraph](https://github.com/langchain-ai/langgraph) 表达可恢复、有状态、可中断的编辑部流程；以 [Prefect](https://github.com/PrefectHQ/prefect) 处理定时、重试、运行记录；需要更强持久执行语义时再介绍 [Temporal](https://github.com/temporalio/temporal)。
2. **研究层**：以 [RSSHub](https://github.com/DIYgod/RSSHub)、[Crawl4AI](https://github.com/unclecode/crawl4ai)、[Playwright](https://github.com/microsoft/playwright) 和 [MarkItDown](https://github.com/microsoft/markitdown) 形成“公开信号—页面采集—规范化文本—证据卡”链路；[Open Deep Research](https://github.com/langchain-ai/open_deep_research) 作为研究代理架构案例。
3. **创作层**：文本任务允许纯规则或本地 [Ollama](https://github.com/ollama/ollama)；图像以 [Diffusers](https://github.com/huggingface/diffusers)／[ComfyUI](https://github.com/Comfy-Org/ComfyUI)，语音转写以 [Whisper](https://github.com/openai/whisper)，音视频装配以 [FFmpeg](https://github.com/FFmpeg/FFmpeg)；中文语音合成仅在权利清楚时选用 [CosyVoice](https://github.com/QwenAudio/CosyVoice)。
4. **质量与治理层**：以 [Promptfoo](https://github.com/promptfoo/promptfoo) 做回归评测，[NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) 做输入／输出／工具调用护栏，[ScanCode Toolkit](https://github.com/aboutcode-org/scancode-toolkit) 做软件与素材包许可证扫描，[c2pa-rs/c2patool](https://github.com/contentauth/c2pa-rs) 做来源声明。
5. **发布层**：课堂默认只发布到本地 outbox 或 mock 站；人工审批后才可连接 [Mixpost](https://github.com/inovector/mixpost) 等自托管调度器。真实平台只走其官方 API、OAuth 与权限范围，浏览器自动化不用于绕过验证码、登录保护、付费墙或反自动化规则。
6. **度量层**：以 [Umami](https://github.com/umami-software/umami) 做隐私友好的站内事件，以 [Langfuse](https://github.com/langfuse/langfuse) 做智能体追踪与质量／成本分析；课堂使用匿名合成数据，不采集真实用户隐私。

课程最重要的设计决定，是把“自主”限定在**可逆的草稿与分析动作**，把“不可逆的公开发布、付费、删除、私信、账号权限变更”保留给人。这样既能展示智能体价值，又不会把高风险平台行为包装成教学捷径。

---

## 二、研究问题与判定标准

### 2.1 核心研究问题

1. 哪些活跃的开源项目，能支撑从趋势发现到内容评测的完整自媒体运营闭环？
2. 哪些仓库适合成为学生真正动手的“主干依赖”，哪些只能作为受条件限制的扩展阅读？
3. 如何在不依赖付费 API 的前提下，让每个模块都有可复现、可验收的实验？
4. 如何把事实性、品牌一致性、版权、隐私、人格／音色权、平台规则与供应链安全变成机器可检查的发布门禁？
5. 如何避免把代码仓库的开源许可证错误延伸到模型权重、输入素材、声音、人物形象和最终输出？

### 2.2 选源判定标准

每个候选仓库按以下维度审核：

- **任务贴合度**：是否直接支撑课程十模块中的一个或多个能力。
- **可复现性**：是否能在本地、公开静态页面、合成数据或 mock 发布目标上完成免费实验。
- **维护信号**：截至核验日是否有可见的近期发布、提交、合并请求或维护活动；“活跃”不是质量担保。
- **许可证可读性**：代码许可证是否明确；是否存在企业版目录、模型权重、数据集、插件或构建选项的额外条款。
- **安全记录**：是否有官方安全公告；课程能否给出最低安全版本、隔离运行和失败关闭策略。
- **教学可解释性**：学生能否看见状态、证据、决策、失败、审批与度量，而不是只点一个“生成”按钮。
- **平台与社会风险**：是否可能诱导垃圾内容、虚假信息、身份冒用、侵权、隐私泄露或违反平台自动化规则。

### 2.3 三档结论

- **PASS**：可以进入推荐主线；仍须版本锁定、最小权限和课程安全合同。
- **CONDITIONAL**：有教学价值，但必须满足表中条件后使用；默认不是必装依赖。
- **EXCLUDE**：本轮不进入可执行主线；可用于反例、迁移说明或风险讨论。

---

## 三、推荐技术主线与最小可运行架构

### 3.1 建议的课程参考架构

```text
公开 RSS／网页／教师提供资料
          │
          ▼
RSSHub + Crawl4AI/Playwright + MarkItDown
          │  evidence_id / source_url / captured_at / rights_status
          ▼
       证据研究包
          │
          ▼
LangGraph 编辑部状态机 ─── Langfuse 追踪
  选题 → 研究 → 撰稿 → 事实核验 → 品牌门禁
          │                         │
          │                         └── Promptfoo + NeMo Guardrails
          ▼
Diffusers/ComfyUI + Whisper/CosyVoice + FFmpeg
          │
          ▼
一源多用资产包 + ScanCode 权利清单 + C2PA 来源声明
          │
          ▼
Prefect 人工审批暂停点
          │
          ├── 未批准：仅本地 outbox
          └── 已批准：mock 发布；选修课才连接官方 API / Mixpost
                                      │
                                      ▼
                          Umami 事件 + 内容反馈
                                      │
                                      └── 回流 Promptfoo 回归集
```

### 3.2 推荐的最小主干

为避免课程变成难以维护的“开源项目动物园”，核心教学环境建议只预装：

- LangGraph：编辑部状态、检查点、人机中断。
- RSSHub、Crawl4AI、MarkItDown：信号与证据规范化；Playwright 仅处理需要渲染的允许页面。
- Promptfoo、NeMo Guardrails：确定性门禁与红队回归。
- FFmpeg、Whisper：可在普通硬件降级运行的音视频基本链路。
- Prefect：调度、重试、人工批准与运行收据。
- Umami、Langfuse：合成事件与追踪；如果部署成本过高，可先用本地 JSONL／SQLite 适配器。
- ScanCode Toolkit、c2patool：权利与来源演练。

ComfyUI、Diffusers、CosyVoice、Mixpost、Temporal、Postiz、Plausible、Ollama 等放入“能力扩展包”。这一区分不是对项目优劣的排名，而是对课堂安装面、GPU 门槛、许可证复杂度和安全面的控制。

### 3.3 不依赖付费 API 的统一实验环境

- 默认模型：纯模板、确定性规则或本地小模型；所有核心验收不得把云端密钥作为前置条件。
- 默认输入：教师提供的 8 个公开网页／PDF 快照、3 个 CC0 图像、1 段经授权 WAV、匿名合成运营数据。
- 默认输出：本地 Markdown、JSON、SRT、MP4 与 mock 发布收据。
- 默认网络：核心实验可离线复跑；实时采集作为演示层，不纳入唯一验收路径。
- 默认身份：无真实平台账号、无真实 cookies、无个人 OAuth token、无用户私信数据。

---

## 四、十模块课程地图

每个模块列出 3–6 个推荐仓库，以及至少一个无需付费 API 的可验收实验。

### 模块 1：经营目标与边界

**能力目标**：把“多发内容”改写成可观测的经营假设，并把不可自动执行的动作写成策略。

**推荐仓库**：

- [Umami](https://github.com/umami-software/umami)：站内事件与转化目标。
- [Langfuse](https://github.com/langfuse/langfuse)：智能体运行追踪、提示与评测关联。
- [Promptfoo](https://github.com/promptfoo/promptfoo)：目标与约束的回归测试。
- [ScanCode Toolkit](https://github.com/aboutcode-org/scancode-toolkit)：依赖与素材包的权利扫描入口。
- [NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)：把禁止行为转成运行时护栏。

**免费实验 M1**：学生填写 `operating-contract.yaml`，包含受众、北极星指标、单件内容资源上限、禁止自主动作、版权门禁和升级联系人；导入合成 Umami 事件，用 Promptfoo mock provider 检查 10 个政策样例，并用 ScanCode 扫描教师提供的示例资产包。验收物为合同、测试结果和一次被门禁拒绝的运行收据。

**关键门禁**：目标不能只写“涨粉”；必须同时包含价值指标、负面反馈、事实错误率、人工返工率和权利不明资产数。

### 模块 2：受众与信号雷达

**能力目标**：在合法、低干扰的采集范围内，区分信号、噪声、重复内容和短期热度。

**推荐仓库**：

- [RSSHub](https://github.com/DIYgod/RSSHub)：把公开信息源规范成 RSS。
- [Crawl4AI](https://github.com/unclecode/crawl4ai)：页面内容抽取与结构化。
- [Playwright](https://github.com/microsoft/playwright)：对允许访问的动态页面做浏览器渲染。
- [MarkItDown](https://github.com/microsoft/markitdown)：把多种文档转成 Markdown。
- [SearXNG](https://github.com/searxng/searxng)：可选的自托管元搜索课堂示例。

**免费实验 M2**：从 3 个公开 RSS／教师指定站点抓取信号，保存 `source_url`、时间、标题、摘要和内容哈希；用纯 Python 的新颖度、相关性、时效性规则生成候选榜，并人工解释前 5 名。实验不登录、不绕过 robots／验证码、不抓取私域或付费内容。

**关键门禁**：浏览器代理使用域名允许清单、页面数上限、请求间隔、只读动作清单与临时浏览器配置；无允许规则即失败关闭。

### 模块 3：证据研究包

**能力目标**：让每个选题在写作前拥有可核查的证据、反证、时间范围和不确定性说明。

**推荐仓库**：

- [Open Deep Research](https://github.com/langchain-ai/open_deep_research)：研究代理的开放架构案例。
- [Crawl4AI](https://github.com/unclecode/crawl4ai)：公开页面正文抽取。
- [MarkItDown](https://github.com/microsoft/markitdown)：PDF／Office 等资料规范化。
- [LangGraph](https://github.com/langchain-ai/langgraph)：研究步骤、重试和人工复核状态。
- [Ollama](https://github.com/ollama/ollama)：可选本地模型运行器；模型权重另行核权。

**免费实验 M3**：对 8 个已保存的公开网页／PDF 快照生成研究包：问题树、证据卡、反证卡、来源时间、直接支持的主张、不能支持的主张和引用覆盖率。摘要可用本地模型，也可完全用模板与人工摘录完成。抽查时必须从 `evidence_id` 回到原文位置。

**关键门禁**：缺少来源、来源无法打开、日期超出问题窗口或证据只支持相关而不支持因果时，不得进入“可发布事实”。

### 模块 4：编辑部智能体架构

**能力目标**：理解角色不是“多开几个聊天窗口”，而是职责、状态、工具权限和交接契约。

**推荐仓库**：

- [LangGraph](https://github.com/langchain-ai/langgraph)：主线状态图与中断恢复。
- [OpenAI Agents SDK for Python](https://github.com/openai/openai-agents-python)：轻量 handoff／guardrail／trace 参考实现。
- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)：微软当前多智能体框架方向。
- [CrewAI](https://github.com/crewAIInc/crewAI)：角色／任务式编排的对照案例。
- [Prefect](https://github.com/PrefectHQ/prefect)：跨步骤的运行、重试与人工暂停。

**免费实验 M4**：实现“主编 → 研究员 → 撰稿人 → 事实核验员 → 人工审批”的本地状态机。各节点先用纯函数或固定 fixture；故意让事实核验失败，验证检查点、有限重试、人工中断、修改后恢复和最终运行收据。

**关键门禁**：每个角色只拥有完成职责所需的最小工具；“撰稿人”无发布工具，“发布者”无修改事实证据的权限。

### 模块 5：写作、品牌与事实门禁

**能力目标**：把“像品牌”与“是真的”拆成不同测试，把风格偏好与事实硬门禁分离。

**推荐仓库**：

- [LangGraph](https://github.com/langchain-ai/langgraph)：门禁状态与返工路径。
- [MarkItDown](https://github.com/microsoft/markitdown)：品牌指南和研究资料统一入口。
- [Promptfoo](https://github.com/promptfoo/promptfoo)：样例、断言、回归与红队。
- [NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)：内容和工具调用护栏。
- [ScanCode Toolkit](https://github.com/aboutcode-org/scancode-toolkit)：引用资产与依赖的许可证线索。

**免费实验 M5**：用确定性断言检查标题长度、禁用词、语气、CTA、来源数、引用覆盖率、数字与引号是否有证据；给出 20 条金标样例，要求系统拒绝无来源数字、伪造引语、绝对化医疗／财务主张和未披露广告。无需 LLM 即可通过核心验收。

**关键门禁**：事实门禁失败不能被“文案更流畅”覆盖；品牌评分低可返工，证据缺失必须阻断。

### 模块 6：多模态资产流水线

**能力目标**：把封面、配音、字幕和短视频装配变成可追溯的资产流水线，而非一次性生成。

**推荐仓库**：

- [ComfyUI](https://github.com/Comfy-Org/ComfyUI)：节点式图像生成工作流。
- [Diffusers](https://github.com/huggingface/diffusers)：扩散模型推理与训练组件。
- [Whisper](https://github.com/openai/whisper)：本地语音识别与字幕底稿。
- [CosyVoice](https://github.com/QwenAudio/CosyVoice)：可选中文语音合成；必须单独处理模型和音色权利。
- [FFmpeg](https://github.com/FFmpeg/FFmpeg)：转码、混流、字幕和版式装配。

**免费实验 M6**：使用 3 张明确标注 CC0 的图片、120 字中文脚本和教师授权 WAV，生成 SRT 字幕并用 FFmpeg 装配 30 秒 9:16 视频；有合适硬件时再用本地 Diffusers／ComfyUI 生成封面。无 GPU 时以模板封面和教师音频完成同一验收合同。

**关键门禁**：不得克隆未经明确同意的声音，不得使用身份不明的人脸，不得把代码许可证当作模型或生成内容的商业授权。

### 模块 7：一源多用与内容资产化

**能力目标**：从一个经审核的“事实源”派生多个渠道格式，同时保留来源、版本和权利元数据。

**推荐仓库**：

- [MarkItDown](https://github.com/microsoft/markitdown)：统一输入格式。
- [FFmpeg](https://github.com/FFmpeg/FFmpeg)：音视频派生与元数据处理。
- [ComfyUI](https://github.com/Comfy-Org/ComfyUI)：可复用视觉工作流。
- [Diffusers](https://github.com/huggingface/diffusers)：可复现的图像参数化生成。
- [c2pa-rs/c2patool](https://github.com/contentauth/c2pa-rs)：内容来源声明与验证实验。

**免费实验 M7**：从 `source-of-truth.md` 派生长文、短帖、6 张卡片 JSON、60 秒脚本和字幕；所有格式通过字段映射而不是重新“自由发挥”。为测试图片或视频写入 C2PA 清单并保存内容哈希，随后修改文件，观察验证结果变化。

**关键门禁**：C2PA 能记录声明和篡改状态，但不能证明内容本身真实；事实仍需回到证据包。

### 模块 8：人工审批与受控发布

**能力目标**：把发布当作高风险、不可逆事务；设计暂停、批准、撤回、幂等和收据。

**推荐仓库**：

- [Prefect](https://github.com/PrefectHQ/prefect)：调度、重试和可观测运行。
- [Temporal](https://github.com/temporalio/temporal)：持久执行和长事务的进阶案例。
- [Playwright](https://github.com/microsoft/playwright)：仅用于本地 mock 发布页与获准测试环境。
- [Mixpost](https://github.com/inovector/mixpost)：自托管社媒管理的可选案例。
- [Postiz](https://github.com/gitroomhq/postiz-app)：可选对照，必须使用已修补版本并隔离部署。

**免费实验 M8**：实现 `draft → policy_check → human_approve → publish_mock → receipt`。批准前内容只能进入本地 outbox；批准后向本地 mock 页面发布。重复提交相同 `content_hash` 必须幂等；收据包含审批者、时间、目标、版本和哈希。

**关键门禁**：真实社媒连接器只作为选修；必须使用官方 API／OAuth、最小权限和测试账号，不得演示验证码绕过、cookie 接管、批量私信或规避平台限制。

### 模块 9：社群反馈与分析

**能力目标**：把浏览、保存、评论与负面反馈连接到内容假设，而不是只追逐曝光量。

**推荐仓库**：

- [Umami](https://github.com/umami-software/umami)：站内匿名事件。
- [Plausible Analytics](https://github.com/plausible/analytics)：可选自托管分析对照；必须高于已修补安全下限。
- [Langfuse](https://github.com/langfuse/langfuse)：智能体运行质量和人工评分。
- [Promptfoo](https://github.com/promptfoo/promptfoo)：把失败样本变成回归集。
- [RSSHub](https://github.com/DIYgod/RSSHub)：公开反馈源的只读聚合示例。

**免费实验 M9**：导入匿名合成 CSV（曝光、点击、保存、评论、负面反馈、内容版本），本地计算漏斗和 cohort；把高负面反馈样本加入 Promptfoo 回归集，并把内容版本、证据覆盖、人工改动与结果关联。不得用代理变量推断个人敏感属性。

**关键门禁**：优化目标必须同时包含负面反馈、退订／隐藏和事实纠错；不能只优化点击率。

### 模块 10：评测治理与 30 天 Capstone

**能力目标**：把课程前九模块汇成一个可审计的小型内容经营系统，并证明它在失败时会停止。

**推荐仓库**：

- [Promptfoo](https://github.com/promptfoo/promptfoo)：离线回归与红队。
- [NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)：运行时策略。
- [c2pa-rs/c2patool](https://github.com/contentauth/c2pa-rs)：来源声明。
- [ScanCode Toolkit](https://github.com/aboutcode-org/scancode-toolkit)：许可证与组件清单。
- [Langfuse](https://github.com/langfuse/langfuse)：追踪、评分、成本与延迟。
- [Umami](https://github.com/umami-software/umami)：合成运营效果。

**免费实验 M10**：用合成数据模拟 30 天运营。每周产出评测报告、红队报告、护栏命中、许可证报告、C2PA 验证、人工返工、延迟／资源成本和转化／负面反馈。最终演示必须包含至少一次事实门禁失败、一次权利不明阻断、一次审批拒绝和一次恢复运行。

**Capstone 六道硬门**：事实、品牌、安全、版权／授权、人工批准、全链路追踪。任一门缺失即不通过，不允许以“最终作品很好看”替代系统性证据。

---

## 五、仓库候选调研记录（非发布裁决）

本节保留较宽的前期候选调研，用于比较技术路径、维护风险与许可证模式；分组表示当时的研究优先级，不是 Course 16 的发布状态。唯一发布裁决是第十二节的 27 条 canonical ledger 与 `lib/creator-ops/sources.ts`：**13 PASS / 10 CONDITIONAL / 4 EXCLUDED**。因此，本节出现但未进入 canonical ledger 的仓库只是背景或替代方案；本节提到的 FFmpeg 与 Langfuse 也必须服从 canonical ledger 的 `CONDITIONAL`，不能被解释为 `PASS`。

### 5.1 初筛优先研究（非发布状态）

| 仓库 | 课程用途 | 许可证／状态核验 | 截至 2026-08-26 的维护信号 | 使用条件 |
|---|---|---|---|---|
| [LangGraph](https://github.com/langchain-ai/langgraph) | 状态图、检查点、人机中断 | MIT | 固定提交与核验时最新 core 稳定版均为 1.2.11（2026-08-11） | 锁定精确版本；不得让单个节点同时拥有采集、改稿和发布权限 |
| [Open Deep Research](https://github.com/langchain-ai/open_deep_research) | 深度研究代理架构 | MIT | 仓库已在课程固定提交后由维护者归档 | 只作为固定提交的静态参考架构与结构拆解，不把归档仓库当成持续维护的产品依赖 |
| [Playwright](https://github.com/microsoft/playwright) | 允许页面渲染、mock 发布测试 | Apache-2.0 | 固定提交为 1.63.0-next；核验时最新稳定版为 v1.62.1（2026-07-30） | 锁定已测试版本；域名白名单、只读动作、临时 profile；不用于规避平台机制 |
| [Diffusers](https://github.com/huggingface/diffusers) | 本地图像生成与工作流理解 | Apache-2.0（代码） | 官方发布页可见 v0.40.0（2026-08-20） | 每个模型权重、数据和输出适用条款另查 |
| [Whisper](https://github.com/openai/whisper) | 本地语音识别／字幕 | MIT | 官方发布页可见 v20250625；2026-07 仍有 PR 活动 | 人声输入需授权；转写结果需人工校对 |
| [FFmpeg](https://github.com/FFmpeg/FFmpeg) | 转码、混流、字幕、视频装配 | 默认 LGPL-2.1-or-later；构建选项可改变整体许可证 | 官方仓库持续维护 | 保存构建配置；启用 GPL 组件会改变分发义务；`--enable-nonfree` 可能使构建不可再分发 |
| [Prefect](https://github.com/PrefectHQ/prefect) | 调度、重试、人工暂停、运行收据 | Apache-2.0 | 固定提交就是正式 3.8.4 release 的提交（2026-08-25） | 固定版本与 worker 权限；课堂 secrets 使用假值 |
| [Mixpost Lite](https://github.com/inovector/mixpost) | 自托管社媒调度案例 | MIT（Lite 仓库） | 官方发布页可见 v2.6.0（2026-03-16） | 主线只连 mock 目标；真实连接须逐平台审核 API 与权限 |
| [Umami](https://github.com/umami-software/umami) | 站内事件、转化、实验反馈 | MIT | 固定提交与核验时最新稳定版均为 v3.3.1（2026-08-20） | 合成或匿名最小数据；设置留存与删除策略 |
| [Langfuse](https://github.com/langfuse/langfuse) | 智能体追踪、评分与成本分析 | 核心 MIT；`ee/` 目录另有企业许可证 | 固定提交为 4.19.0；核验时最新稳定版为 v4.21.0（2026-08-26） | 不记录真实密钥、原始 PII 或未脱敏私信；区分核心与 `ee/` |
| [Promptfoo](https://github.com/promptfoo/promptfoo) | 回归评测、断言、红队 | MIT | 固定提交的 `package.json` 为 0.122.0；同版 release 可见于 2026-08-04 | 固定版本；不对不可信模板开放任意代码／网络权限 |
| [NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) | 输入／输出／工具护栏 | Apache-2.0 | 固定提交为 0.24.0.dev0；核验时稳定线为 v0.23.0（2026-07-01） | 明确区分开发提交与稳定版本；护栏不能替代事实核查 |
| [c2pa-rs / c2patool](https://github.com/contentauth/c2pa-rs) | 来源声明与篡改验证 | MIT OR Apache-2.0 | 固定提交的 c2patool CLI 为 0.28.0-dev、根 c2pa crate 为 0.91.0-dev；核验时最新稳定 c2patool release 为 v0.27.15（2026-08-13） | 0.x 期按 beta 对待；来源声明不等于事实认证 |
| [ScanCode Toolkit](https://github.com/aboutcode-org/scancode-toolkit) | 许可证、版权与组件清单 | 工具代码 Apache-2.0；参考数据含 CC-BY-4.0 | 固定提交为 33.0.0rc1；核验时稳定 release 为 v32.5.0 | 明确区分候选版与稳定版；扫描结果是线索而非法律结论 |

### 5.2 初筛需附加条件（非发布状态）

| 仓库 | 教学价值 | 条件／原因 | 建议替代或降级 |
|---|---|---|---|
| [RSSHub](https://github.com/DIYgod/RSSHub) | 获授权公开信号聚合 | AGPL-3.0；数千条路由对应的目标站点条款和稳定性无法由 RSSHub 许可证统一覆盖 | 只启用教师批准的官方 RSS、开放 API、自有或获授权来源；部署时履行 AGPL 义务 |
| [Crawl4AI](https://github.com/unclecode/crawl4ai) | 面向 LLM 的网页抽取 | v0.9.2（2026-07）可见；许可证文本为 Apache-2.0 并带醒目的额外署名要求，不能简写成“纯 Apache-2.0”；2026 年有严重 Docker API 公告 | 锁定 **≥0.9.2**，仅 loopback、token、非特权容器；低风险课可用保存好的 HTML + MarkItDown |
| [MarkItDown](https://github.com/microsoft/markitdown) | 文档转 Markdown | MIT；正式 v0.1.7 已于 2026-07-29 发布；README 明示处理不可信输入要谨慎，extras／传递依赖另查 | 用沙箱与大小／格式上限；仅启用课程需要的 extras；纯 PDF 可替换为固定解析器 |
| [browser-use](https://github.com/browser-use/browser-use) | 浏览器代理案例 | MIT；固定提交的 `pyproject.toml` 与核验时最新稳定 release 均为 0.13.8（2026-08-16） | 锁定经过测试的 tag 或 commit；主线使用 Playwright 的确定性脚本 |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | 节点式多模态工作流 | GPL-3.0；固定提交为 0.33.0，核验时最新稳定版为 v0.34.0（2026-08-26）；v0.28.0 修补高危路径穿越；custom nodes 与模型另有供应链风险 | 保留 **≥0.30.0** 安全下限并优先采用已复核新版本；节点允许清单、离线模型目录；低配设备用模板封面 |
| [CosyVoice](https://github.com/QwenAudio/CosyVoice) | 中文语音合成 | 代码 Apache-2.0，但模型、训练数据、声音同意和人格权不能由代码许可证覆盖 | 只用项目明确允许的模型与教师授权音色；否则使用教师预录 WAV |
| [Ollama](https://github.com/ollama/ollama) | 本地模型运行 | 代码 MIT；每个模型权重与模型卡另有条款 | 建立模型清单、哈希和用途限制；纯规则／fixture 是必备降级路径 |
| [SearXNG](https://github.com/searxng/searxng) | 自托管元搜索 | AGPL-3.0-or-later；滚动镜像在 2026-08-20 有活动 | 固定镜像 digest、限制引擎和网络；主线可用教师提供的 RSS 快照 |
| [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) | handoff、guardrail、trace 对照 | MIT；固定提交中的 release notes 顶部版本为 0.22.0；默认示例可能依赖模型服务 | 仅用本地／mock provider 做架构实验；不把云密钥设为必需 |
| [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) | 微软多智能体框架方向 | MIT；官方发布页可见 Python 1.15.0（2026-08-21） | 作为对照或迁移阅读；课程主干仍统一为 LangGraph，避免重复框架成本 |
| [CrewAI](https://github.com/crewAIInc/crewAI) | 角色／任务式编排对照 | MIT；官方发布页可见 1.15.17（2026-08-20） | 只做同一任务的框架比较；不得让角色描述替代工具权限与状态契约 |
| [Temporal](https://github.com/temporalio/temporal) | 持久执行与长事务 | MIT；官方发布页可见 v1.31.2（2026-07-08） | 适合进阶班；基础班以 Prefect + 本地状态收据降低运维负担 |
| [Postiz](https://github.com/gitroomhq/postiz-app) | 社媒调度与连接器对照 | AGPL-3.0；官方公告显示 XSS 影响 ≥2.21.6、在 ≥2.21.7 修补；2026-08 可见 2.22.1 容器线 | 只用 **≥2.21.7**，隔离、非生产凭据、mock 目标；优先 Mixpost Lite |
| [Plausible Analytics](https://github.com/plausible/analytics) | 隐私友好分析对照 | AGPL-3.0-or-later；官方公告显示未认证 RCE 影响 ≥3,<3.2.1，3.2.1 修补 | 只用 **≥3.2.1** 且限制暴露面；主线优先 Umami 或合成 CSV |
| [Firecrawl](https://github.com/firecrawl/firecrawl) | 抓取／搜索 API 结构参考 | 核心 AGPL，README 同时说明部分 SDK／UI 为 MIT；部署面与子目录许可需逐项核对 | 不设为主干；用 Crawl4AI 或固定页面语料，若采用则生成目录级许可证清单 |

### 5.3 初筛排除候选（非发布状态）

| 仓库／方案 | 排除原因 | 课程处理方式 |
|---|---|---|
| [Microsoft AutoGen](https://github.com/microsoft/autogen) | 官方 README 已声明 maintenance mode，并把 Agent Framework 定位为新项目入口；仓库顶层内容许可证为 CC-BY-4.0，代码另由 `LICENSE-CODE` 采用 MIT | 用 Microsoft Agent Framework 替代；AutoGen 只作为生态演进案例；排除依据是维护状态与继任方向，不是代码许可证 |
| [LLM Guard](https://github.com/protectai/llm-guard) | 官方仓库于 2026-07-09 归档，后续维护与漏洞响应不确定 | 用 NeMo Guardrails + Promptfoo；归档仓库不进入学生依赖锁 |
| [GPT Researcher](https://github.com/assafelovic/gpt-researcher) | 虽为 Apache-2.0，但公开问题记录 3.4.3 及更早版本存在未修补的 reflected XSS 风险；核验时未确认安全版本 | 在官方修复和公告确认前排除；研究架构用 Open Deep Research |
| [n8n](https://github.com/n8n-io/n8n) | Sustainable Use License 不是标准 OSI 开源许可证；与“以开放源码作为可自由复用教学主干”的课程叙事不匹配 | 可在商业／source-available 许可比较中阅读，不作为本课程开源主线 |
| [Remotion](https://github.com/remotion-dev/remotion) | 官方许可证为特殊许可；超过三人的营利组织使用需要公司许可证等条件，容易被误讲成普通开源视频库 | 视频装配主线用 FFmpeg；Remotion 仅在单独核权的选修说明中出现 |
| 漂移的 `latest` 镜像、未锁 custom nodes、未知模型 checkpoint | 无法复现，也无法把已知漏洞、许可证和输出追溯到确切组件 | 发布物必须记录 tag／commit、镜像 digest、模型哈希、节点允许清单与生成参数 |

---

## 六、“四账分离”：课程的权利与合规骨架

任何素材或组件进入流水线前，都必须分别登记四本账。四账中的任一本出现 `UNKNOWN`，该资产都只能停留在本地研究区，不能进入发布包。

| 账本 | 记录对象 | 最少字段 | 常见误区 | 发布判定 |
|---|---|---|---|---|
| **1. 代码许可证账** | 仓库、包、容器、插件、custom node、构建选项 | 名称、版本／commit、来源 URL、许可证 SPDX、NOTICE、修改、分发方式、漏洞状态 | “主仓库是 MIT，所以所有子目录／插件都一样”；忽略 FFmpeg 构建选项、Langfuse `ee/`、Firecrawl 子目录 | 许可证明确、义务已执行、无阻断漏洞、版本已锁定 |
| **2. 模型／权重许可证账** | LLM、扩散模型、语音模型、LoRA、embedding、checkpoint | 模型卡 URL、权重哈希、许可证、允许用途、地域／商用限制、训练数据说明、输出条款 | 把 Ollama／Diffusers／CosyVoice 的代码许可证当成模型权重授权 | 权重条款与课程／发布用途相容；模型来源和哈希可复核 |
| **3. 输入素材与数据权利账** | 网页、文章、PDF、图片、音乐、视频、字幕、评论、分析数据 | 来源、作者／权利人、授权或例外依据、用途、期限、改编／署名要求、个人数据字段、删除日 | “公开可见 = 可抓取和再发布”；“AI 改写后就没有原作权利问题” | 有明确授权／适用依据和必要署名；数据最小化且可删除 |
| **4. 人格／音色／隐私／平台授权账** | 人脸、声音、姓名、用户数据、账号、OAuth scope、平台 API 行为 | 同意主体、同意范围、用途／期限／撤回、敏感数据、平台条款版本、账号权限、审批人 | “开源 TTS = 可以模仿任何人”；“有 cookie = 有发布授权” | 明示同意、用途未超范围、最小权限、平台规则允许、保留撤回路径 |

### 6.1 建议统一资产清单字段

```yaml
asset_id: A-0001
kind: code | model | source | image | audio | video | dataset
source_url: https://...
captured_at: 2026-08-26T00:00:00Z
version_or_hash: "..."
license_expression: "..."
rights_holder: "..."
allowed_uses: [research, classroom, publish]
required_attribution: "..."
personal_data: false
voice_or_likeness_consent_id: null
platform_authorization_id: null
security_status: pass | conditional | block
rights_status: verified | conditional | unknown
reviewer: "..."
```

### 6.2 四账必须避免的结论跳跃

- MIT／Apache-2.0 的**代码**不自动授权仓库下载的模型、训练数据、示例素材、声音或输出。
- C2PA 记录“谁声明了什么、文件是否变化”，不证明声明真实，也不替代证据核验。
- 许可证扫描器能发现线索、文本和冲突候选，不能替代合格法律判断。
- 平台允许 API 调用不等于允许所有内容、频率、广告、私信或数据再利用。
- 公开网页可访问不等于可以批量抓取、训练、复制或重新发布；必须同时看来源条款、robots、请求负载、版权和个人数据。

---

## 七、发布安全合同（Release Safety Contract）

以下合同应同时进入教学讲义、样板仓库、自动测试和 Capstone 评分表。它不是一页“伦理提示”，而是发布工作流的失败关闭条件。

### 7.1 内容与证据

1. 每条可核验事实必须绑定至少一个 `evidence_id`；引用、数字、日期和因果主张必须精确回链。
2. 每个证据包含来源 URL、抓取时间、原文定位、支持范围和不确定性；二手转述不得冒充原始来源。
3. 未找到证据时写“未核验／不知道”，不得以模型自信度或多代理一致意见替代证据。
4. 更正是一级工作流：保留旧版本、纠错原因、批准者、时间和重新发布收据。

### 7.2 素材、身份与权利

5. 每个媒体资产必须有 `asset_id`、来源、许可证／授权、哈希和必要署名；未知即阻断。
6. 声音克隆、人物肖像和可识别用户内容必须有可验证、具体、可撤回的同意；仅“网上能找到”不构成同意。
7. 广告、赞助、联盟链接和 AI 生成／编辑披露必须符合目标地区和平台要求；课程模板保留披露字段。
8. ScanCode 与 C2PA 是辅助证据，不是法律结论或真实性认证。

### 7.3 智能体与浏览器权限

9. 研究、写作、审核、发布角色使用独立工具允许清单；发布工具只在人工批准后临时开放。
10. 浏览器智能体必须配置域名允许清单、只读／可写动作清单、最大页面数、最大动作数、超时、临时 profile 和截图／动作日志。
11. 禁止绕过验证码、付费墙、登录保护、速率限制、robots、反自动化或平台风控；禁止 cookie 接管、批量骚扰与未授权私信。
12. 外部网页、PDF 和工具返回值均视为不可信输入；不得让页面内提示改变系统策略、读取 secrets 或扩大工具权限。

### 7.4 凭据、隐私与供应链

13. 课程仓库、日志、追踪与截图中不得出现真实 API key、OAuth token、cookie、私信或个人身份数据；教学使用假值与匿名 fixture。
14. 依赖必须锁定 tag／commit／hash／镜像 digest；模型卡、权重哈希、ComfyUI 节点和 FFmpeg 构建参数进入物料清单。
15. 只维护最新版本的项目必须跟随其安全支持策略；严重或高危公告未评估前，发布流水线失败关闭。
16. 自托管服务默认只绑定 loopback 或受控网络，启用鉴权，使用非特权容器和最小文件系统权限。

### 7.5 人工批准与收据

17. 未批准内容只能存在本地 draft／outbox；不得通过“测试”名义连接真实公众账号。
18. 公开发布、删除、付费、私信、账号设置、权限扩大和批量动作必须逐项人工批准；批准有范围和失效时间。
19. 每次发布生成不可变收据：`content_hash`、证据包版本、资产清单版本、审批者、批准时间、目标、连接器版本、模型／代码版本和平台返回 ID。
20. 相同 `content_hash + target` 的重复请求必须幂等；失败后先确认平台状态，再决定重试，避免重复发布。

### 7.6 Capstone 阻断条件

以下任一情况出现，30 天项目不得通过：

- 事实性句子不能回到证据；
- 权利或声音／肖像同意为未知；
- 没有真实的人类审批暂停点；
- 红队高风险样例可以直接发布；
- 存在未处理的严重／高危安全公告；
- 运行无法复现到确切代码、模型、节点和输入版本；
- 只有点击／曝光优化，没有负面反馈、纠错或用户伤害指标；
- 使用真实账号、cookie、密钥或用户数据作为课程必备条件。

---

## 八、关键官方仓库与文档索引

本节是课程团队的统一书签。版本、许可证和安全结论以对应仓库在 **2026-08-26** 的官方页面为准；更细的逐条核验见 provenance 侧车。

### 8.1 智能体编排与深度研究

- LangGraph：[仓库](https://github.com/langchain-ai/langgraph) · [发布](https://github.com/langchain-ai/langgraph/releases) · [官方文档](https://docs.langchain.com/oss/python/langgraph/overview)
- Open Deep Research：[已归档仓库与固定历史](https://github.com/langchain-ai/open_deep_research)
- OpenAI Agents SDK：[仓库](https://github.com/openai/openai-agents-python) · [release notes](https://github.com/openai/openai-agents-python/blob/main/docs/release.md) · [GitHub API 元数据](https://api.github.com/repos/openai/openai-agents-python)
- Microsoft Agent Framework：[仓库](https://github.com/microsoft/agent-framework) · [许可证](https://github.com/microsoft/agent-framework/blob/main/LICENSE) · [发布](https://github.com/microsoft/agent-framework/releases)
- CrewAI：[仓库](https://github.com/crewAIInc/crewAI) · [发布](https://github.com/crewAIInc/crewAI/releases)
- Prefect：[仓库](https://github.com/PrefectHQ/prefect) · [发布](https://github.com/PrefectHQ/prefect/releases) · [官方文档](https://docs.prefect.io/)
- Temporal：[仓库](https://github.com/temporalio/temporal) · [许可证](https://github.com/temporalio/temporal/blob/main/LICENSE)

### 8.2 信号、采集与文档规范化

- RSSHub：[仓库](https://github.com/DIYgod/RSSHub) · [PR 活动](https://github.com/DIYgod/RSSHub/pulls) · [官方文档](https://docs.rsshub.app/)
- Crawl4AI：[仓库](https://github.com/unclecode/crawl4ai) · [发布](https://github.com/unclecode/crawl4ai/releases) · [许可证](https://github.com/unclecode/crawl4ai/blob/main/LICENSE) · [安全页](https://github.com/unclecode/crawl4ai/security) · [官方文档](https://docs.crawl4ai.com/)
- MarkItDown：[仓库](https://github.com/microsoft/markitdown) · [README](https://github.com/microsoft/markitdown/blob/main/README.md) · [许可证](https://github.com/microsoft/markitdown/blob/main/LICENSE) · [发布](https://github.com/microsoft/markitdown/releases) · [提交](https://github.com/microsoft/markitdown/commits)
- SearXNG：[仓库](https://github.com/searxng/searxng) · [容器版本](https://github.com/searxng/searxng/pkgs/container/searxng) · [官方文档](https://docs.searxng.org/)
- Firecrawl：[仓库／README 许可说明](https://github.com/firecrawl/firecrawl/blob/main/README.md)

### 8.3 浏览器自动化

- Playwright：[仓库](https://github.com/microsoft/playwright) · [发布](https://github.com/microsoft/playwright/releases) · [官方文档](https://playwright.dev/docs/intro)
- browser-use：[仓库](https://github.com/browser-use/browser-use) · [许可证](https://github.com/browser-use/browser-use/blob/main/LICENSE) · [发布](https://github.com/browser-use/browser-use/releases) · [`pyproject.toml`](https://github.com/browser-use/browser-use/blob/main/pyproject.toml) · [官方文档](https://docs.browser-use.com/)

### 8.4 图像、语音与视频

- ComfyUI：[仓库](https://github.com/Comfy-Org/ComfyUI) · [发布](https://github.com/Comfy-Org/ComfyUI/releases) · [路径穿越安全公告](https://github.com/Comfy-Org/ComfyUI/security/advisories/GHSA-pj59-g5vv-74q4) · [官方文档](https://docs.comfy.org/)
- Diffusers：[仓库](https://github.com/huggingface/diffusers) · [发布](https://github.com/huggingface/diffusers/releases) · [Hugging Face 模型卡说明](https://huggingface.co/docs/hub/model-cards)
- Whisper：[仓库](https://github.com/openai/whisper) · [许可证](https://github.com/openai/whisper/blob/main/LICENSE) · [发布](https://github.com/openai/whisper/releases) · [PR 活动](https://github.com/openai/whisper/pulls)
- CosyVoice：[仓库](https://github.com/QwenAudio/CosyVoice)
- FFmpeg：[仓库](https://github.com/FFmpeg/FFmpeg) · [许可证文件](https://github.com/FFmpeg/FFmpeg/blob/master/LICENSE.md) · [官方法律／许可说明](https://ffmpeg.org/legal.html)
- Ollama：[仓库](https://github.com/ollama/ollama) · [代码许可证](https://github.com/ollama/ollama/blob/main/LICENSE)

### 8.5 发布与分发

- Mixpost Lite：[仓库](https://github.com/inovector/mixpost) · [发布](https://github.com/inovector/mixpost/releases) · [官方文档](https://docs.mixpost.app/)
- Postiz：[仓库](https://github.com/gitroomhq/postiz-app) · [XSS 安全公告](https://github.com/gitroomhq/postiz-app/security/advisories/GHSA-hhxq-3wg7-4rj8)

### 8.6 分析、评测、安全与来源

- Umami：[仓库](https://github.com/umami-software/umami) · [许可证](https://github.com/umami-software/umami/blob/master/LICENSE) · [v3.3.1 发布](https://github.com/umami-software/umami/releases/tag/v3.3.1) · [官方文档](https://umami.is/docs)
- Plausible Analytics：[仓库](https://github.com/plausible/analytics) · [未认证 RCE 安全公告](https://github.com/plausible/analytics/security/advisories/GHSA-mhcv-h7gf-57cf)
- Langfuse：[仓库](https://github.com/langfuse/langfuse) · [`ee/` 许可证](https://github.com/langfuse/langfuse/blob/main/ee/LICENSE) · [发布](https://github.com/langfuse/langfuse/releases) · [官方文档](https://langfuse.com/docs)
- Promptfoo：[仓库](https://github.com/promptfoo/promptfoo) · [`package.json`](https://github.com/promptfoo/promptfoo/blob/main/package.json) · [安全与支持页](https://github.com/promptfoo/promptfoo/security) · [官方文档](https://www.promptfoo.dev/docs/intro/)
- NeMo Guardrails：[仓库](https://github.com/NVIDIA-NeMo/Guardrails) · [CHANGELOG](https://github.com/NVIDIA-NeMo/Guardrails/blob/develop/CHANGELOG.md) · [官方文档](https://docs.nvidia.com/nemo/guardrails/latest/)
- c2pa-rs/c2patool：[仓库](https://github.com/contentauth/c2pa-rs) · [发布](https://github.com/contentauth/c2pa-rs/releases) · [CLI 文档](https://github.com/contentauth/c2pa-rs/blob/main/cli/README.md) · [安全页](https://github.com/contentauth/c2pa-rs/security) · [C2PA 官方规范入口](https://c2pa.org/specifications/)
- ScanCode Toolkit：[仓库](https://github.com/aboutcode-org/scancode-toolkit) · [发布](https://github.com/aboutcode-org/scancode-toolkit/releases) · [官方文档](https://scancode-toolkit.readthedocs.io/)

### 8.7 排除项的一手依据

- AutoGen：[仓库与维护状态](https://github.com/microsoft/autogen) · [代码 MIT 许可证](https://github.com/microsoft/autogen/blob/main/LICENSE-CODE) · [内容 CC-BY-4.0 许可证](https://github.com/microsoft/autogen/blob/main/LICENSE) · [GitHub API 元数据](https://api.github.com/repos/microsoft/autogen)
- LLM Guard：[仓库／许可证页面（含归档状态）](https://github.com/protectai/llm-guard/blob/main/LICENSE)
- GPT Researcher：[GitHub API 元数据](https://api.github.com/repos/assafelovic/gpt-researcher) · [XSS 问题 #1692](https://github.com/assafelovic/gpt-researcher/issues/1692)
- n8n：[Sustainable Use License](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)
- Remotion：[官方许可证](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)

---

## 九、课程验收设计

### 9.1 每模块统一提交物

每个实验提交五件套：

1. `contract`：输入、输出、权限、预算与失败条件。
2. `fixture`：可离线复跑的固定输入和预期结果。
3. `run receipt`：版本、哈希、时间、状态和人工动作。
4. `eval`：至少一个成功样例、一个失败样例和一个边界样例。
5. `rights record`：四账中与本实验有关的条目。

### 9.2 Capstone 建议评分（100 分）

| 维度 | 分值 | 必须看见的证据 |
|---|---:|---|
| 经营问题与受众假设 | 10 | 北极星指标、伤害／负反馈指标、禁止自动动作 |
| 信号与证据质量 | 15 | 可回链证据卡、反证、不确定性、去重与时效 |
| 智能体架构 | 15 | 状态图、最小权限、检查点、中断、失败恢复 |
| 写作与事实门禁 | 15 | 金标集、断言、引用覆盖、失败关闭 |
| 多模态与一源多用 | 10 | 可复现参数、字幕、版本和派生关系 |
| 权利与来源 | 15 | 四账、SBOM／扫描线索、C2PA／哈希、同意记录 |
| 人工批准与发布收据 | 10 | 真实暂停点、幂等、mock 发布、不可变收据 |
| 反馈、评测与改进 | 10 | 合成漏斗、负面反馈、回归集、30 天变更记录 |

**硬门规则**：六道 Capstone 硬门中任何一道失败，总分上限为 59；真实密钥／cookie／个人数据进入作业仓库，作业直接停止评审并启动清理流程。

### 9.3 世界级课程与普通工具课的分界

- 不以“生成了多少内容”作为学习成果，而以“有多少可核验、可复现、可安全发布的内容资产”衡量。
- 不把 agent 数量当能力，而看状态、权限、交接、失败与恢复。
- 不把“开源”当一个布尔值，而用四账记录不同权利边界。
- 不把 C2PA、护栏或多代理投票神化为真实性保证；证据、人工责任和更正机制仍是核心。
- 不强迫学生购买 API；云模型只作为可替换适配器，免费本地／规则路径拥有同等验收地位。
- 不用平台灰色自动化换取炫技；mock 发布、官方 API 和人工审批更能教授可迁移的工程能力。

### 9.4 已交付的确定性离线实验包

课程公开交付 `public/courses/creator-ops/lab/`，并在相应模块与 Capstone 页面直接链接。该包完全由原创合成材料组成，采用 `CC0-1.0`，不需要账号、凭证、网络、付费 API 或真实平台写入：

- 四份带稳定 locator 的冲突来源样例，训练“营销主张不能覆盖方法边界”与“API 版本条件不能泛化”；
- 33 条匿名合成事件和 10 条不含个人数据的合成反馈，用于指标定义、异常过滤、质性分类与非因果解释；
- 六类固定故障及其 `expected_control`、`expected_receipt`、通过条件和禁止动作；
- 六个只使用惰性 `mock://` 标签的发布情境，覆盖原生幂等、无幂等旧版、重复抑制、提交后超时、审批缺失和资产哈希漂移；
- `manifest.sha256` 对除清单自身外的十个文件逐项锁定，离线发布检查器会复算内容哈希并拒绝额外、缺失或漂移文件。

浏览器工作台只导出一份与界面所示名称一致的 Markdown 成果包；“完成”是本机自我声明，不是自动质量认证。学员必须先复制或下载正文，仍须按模块人工复核门判断成果是否正确、充分和可发布。

---

## 十、维护与复核计划

本简报是 **2026-08-26** 的可核验快照。GitHub 项目、许可证、安全公告和平台规则都会变化，课程发布前建议执行以下复核：

- 每次开课前重新核验所有锁定依赖的官方 release、LICENSE、SECURITY／advisory 和归档状态。
- 每月检查 Crawl4AI、ComfyUI、Postiz、Plausible、Promptfoo 等有明确安全条件的项目；发现高危或严重漏洞即冻结相关实验。
- 每次更换模型、checkpoint、LoRA、声音或素材，都新增四账记录；不得继承旧条目的“已批准”状态。
- 每学期重跑全部免费／离线实验，确保云端服务不可用时仍能完成核心课程。
- 对真实平台的 API、自动化、广告和披露规则做地区化复核；本简报不替代目标平台的当期条款。
- 在课程网页上公开：依赖清单、权利说明、AI 使用披露、纠错渠道、隐私最小化策略和核验日期。

---

## 十一、最终建议

批准本课程立项，但以“**证据驱动、人在回路、免费可复现、四账分离、发布失败关闭**”为不可降级的课程合同。工程实现应先完成模块 1–5 和模块 8 的本地闭环，再接入多模态与分析；真实社媒连接器放在最后，而且不是毕业所必需。

建议首期对外承诺是：

> 30 天内，学生将建立一个可以发现信号、整理证据、协同写作、生成多模态资产、接受人工审批、在 mock 环境安全发布、从反馈学习，并能交付完整权利账与运行收据的智能体自媒体运营系统。

不要承诺“一键全自动涨粉”或“无人值守批量发布”。本课程真正有长期价值的能力，是让创作者能把智能体纳入一个可解释、可纠错、可审计、尊重创作者和受众的经营系统。

---

## 十二、Release ledger / 发布契约附录

本附录是 Course 16 `creator-ops` 发布检查器使用的机器可审计索引，也是课程采用状态的唯一文档裁决。它覆盖前文的候选调研分组；模块 slug 与来源标识严格对应课程清单和 `lib/creator-ops/sources.ts` 在 2026-08-26 的发布快照。来源状态只表示课程采用边界：`PASS` 可在限定实验中采用，`CONDITIONAL` 必须满足附加条件，`EXCLUDED` 仅作为许可证／授权反例，不得安装、调用、打包、改编或执行。

### 12.1 十个精确模块 slug

| 顺序 | 精确模块 slug | 中文模块 |
|---:|---|---|
| 1 | `outcomes-operating-system` | 经营目标与边界 |
| 2 | `audience-signal-radar` | 受众与信号雷达 |
| 3 | `evidence-research-packet` | 证据研究包 |
| 4 | `editorial-agent-architecture` | 编辑部智能体架构 |
| 5 | `writing-brand-fact-gates` | 写作、品牌与事实门禁 |
| 6 | `multimodal-asset-pipeline` | 多模态资产流水线 |
| 7 | `repurpose-content-assets` | 一源多用与内容资产化 |
| 8 | `human-approved-distribution` | 人工审批与受控发布 |
| 9 | `community-analytics-loop` | 社群反馈与分析 |
| 10 | `evaluation-governance-capstone` | 评测治理与 30 天 Capstone |

### 12.2 二十七条 canonical GitHub source ledger

下表每行同时给出精确 source id 与 canonical GitHub URL。所有链接均为“link-only”课程证据，不表示课程复制、打包或分发第三方代码、媒体、模型或品牌资产。

| # | 精确 source id | canonical GitHub URL | 固定 commit SHA | 发布判定 |
|---:|---|---|---|---|
| 1 | `openai-agents` | https://github.com/openai/openai-agents-python | `5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec` | CONDITIONAL |
| 2 | `langgraph` | https://github.com/langchain-ai/langgraph | `38031739e551638e373fb553453256c23feeb41f` | PASS |
| 3 | `open-deep-research` | https://github.com/langchain-ai/open_deep_research | `1b7d2e80db9faa586165c60e09096dbbfd483a64` | PASS |
| 4 | `crawl4ai` | https://github.com/unclecode/crawl4ai | `7e801521428ee12509994d39151006f64055ebe3` | CONDITIONAL |
| 5 | `rsshub` | https://github.com/DIYgod/RSSHub | `1afe42be27c7e95a641d59a89c97aa2d8f902655` | CONDITIONAL |
| 6 | `trendradar` | https://github.com/sansan0/TrendRadar | `8ee26026ba6c11dec41a95fb3895a7162876caa1` | CONDITIONAL |
| 7 | `markitdown` | https://github.com/microsoft/markitdown | `9dc0d6579b8739c9d0671ff205e071e3053c7df1` | CONDITIONAL |
| 8 | `activepieces` | https://github.com/activepieces/activepieces | `eb33135e7442c9d5463ed57aadd015ff9fc3c79d` | PASS |
| 9 | `prefect` | https://github.com/PrefectHQ/prefect | `57ee2c2c10f662fee32807c126a117adce32dd28` | PASS |
| 10 | `playwright` | https://github.com/microsoft/playwright | `036533f7f3c14b1d5b3359d69f0464ceba540334` | PASS |
| 11 | `browser-use` | https://github.com/browser-use/browser-use | `9a2db2d2db42c6f68a871f011b3b25fdcaa71847` | CONDITIONAL |
| 12 | `comfyui` | https://github.com/Comfy-Org/ComfyUI | `7d9d0c391b90b3d89c2ec880a870bb34236a417c` | CONDITIONAL |
| 13 | `diffusers` | https://github.com/huggingface/diffusers | `c969cf2f7ec56f0292c35bece674d170c8f9daa5` | PASS |
| 14 | `whisper` | https://github.com/openai/whisper | `5f86d1d86363843179951550570367b37c5d6f78` | PASS |
| 15 | `cosyvoice` | https://github.com/QwenAudio/CosyVoice | `074ca6dc9e80a2f424f1f74b48bdd7d3fea531cc` | CONDITIONAL |
| 16 | `ffmpeg` | https://github.com/FFmpeg/FFmpeg | `a1050d48b0df3f7c3fa1c631ec8e82528b3f7c85` | CONDITIONAL |
| 17 | `mixpost` | https://github.com/inovector/mixpost | `df57648b866310446703f5294350552b62735df5` | PASS |
| 18 | `umami` | https://github.com/umami-software/umami | `ca661c7057984aa98ed4f7083d84dae2f65bfcb0` | PASS |
| 19 | `langfuse` | https://github.com/langfuse/langfuse | `27807e9c241b1cde7c37fe4648205430259a0c91` | CONDITIONAL |
| 20 | `promptfoo` | https://github.com/promptfoo/promptfoo | `0170037970dd4732f7542c60ceafa5f4951289de` | PASS |
| 21 | `nemoguardrails` | https://github.com/NVIDIA-NeMo/Guardrails | `3524afa8a68f4f51506429d3009400c3bb8d2949` | PASS |
| 22 | `c2pa-rs` | https://github.com/contentauth/c2pa-rs | `7132161cdb0dbb01f01ae0563d5926214c9044db` | PASS |
| 23 | `scancode` | https://github.com/aboutcode-org/scancode-toolkit | `3c532f0fa89113c4aae0301664f17293562aeedb` | PASS |
| 24 | `n8n-case` | https://github.com/n8n-io/n8n | `e0c5edc84e784efa14459a2e1b03b223160ed951` | EXCLUDED |
| 25 | `dify-case` | https://github.com/langgenius/dify | `c7520d7c71031dfa5764d966a523c5766abdc2d6` | EXCLUDED |
| 26 | `moneyprinter-case` | https://github.com/harry0703/MoneyPrinterTurbo | `6cd36b5a2c56b49b24621463038e4db3963f0a43` | EXCLUDED — MoneyPrinterTurbo 只作许可证与默认媒体／上传边界反例 |
| 27 | `mediacrawler-case` | https://github.com/NanmiCoder/MediaCrawler | `d6f7c5bb906b6dac40ddf343ef9e26438a3de092` | EXCLUDED — MediaCrawler 只作非商业许可与平台登录态抓取风险反例 |

### 12.3 机器发布断言

- 来源总数必须保持为 27：13 个 `PASS`、10 个 `CONDITIONAL`、4 个 `EXCLUDED`；任何提升判定都必须新增精确 revision、理由与复核记录。
- `MoneyPrinterTurbo` 与 `MediaCrawler` 必须始终保持 `EXCLUDED`，只能出现在许可证／授权案例中，不能连接任何可运行课程模块。
- 课程分发只使用学员自有或明确授权的界面、官方 API、最小权限凭据和 human approval；浏览器能力不得被解释为第三方平台授权。
- 精确 id、canonical URL、判定或模块 slug 发生变化时，必须同步更新课程清单、研究简报、来源台账与离线发布检查器，并重新执行完整 release gate。
