# 《智能体赋能自媒体运营》研究简报：证据与来源侧车

- 对应主文档：[creator-ops-course-research-brief.md](./creator-ops-course-research-brief.md)
- 检索与核验日期：**2026-08-26**
- 证据优先级：官方 GitHub 仓库／GitHub API → 官方 LICENSE／SECURITY／advisory → 官方 release／changelog／commit／PR → 项目官方文档
- 用途：让课程团队逐条复核选型、许可证、安全版本、维护状态和课程设计推论
- 边界：这是工程与课程选源记录，不是法律意见、平台授权或对项目安全性的永久保证

---

## 一、核验方法

### 1.1 纳入证据

本轮只把以下材料当作关键结论的一手依据：

1. 项目所属组织或维护者的官方 GitHub 仓库；
2. 仓库中的 LICENSE、README、SECURITY、版本文件和 changelog；
3. GitHub 官方 releases、commits、pull requests、security advisories 与 REST API 元数据；
4. 项目或标准组织维护的官方文档站。

### 1.2 结论标记

- **直接核验**：页面直接给出许可证、版本、日期、归档状态或漏洞影响范围。
- **工程推论**：由多个直接事实推导出的课程使用条件，例如“必须锁版本”“只绑定 loopback”。推论会明确标注，不能冒充项目官方要求。
- **未核验范围**：没有逐一审计源代码、所有传递依赖、每个模型权重、所有 custom node、每个容器层或各国法律；这些内容必须在实际采用时再审。

### 1.3 时效限制

所有“最新”“活跃”“已修补”都只代表 **2026-08-26** 核验时可见的官方状态。滚动分支、容器标签、GitHub release、漏洞公告和许可证随时可能变化。课程发布必须以精确 tag／commit／digest 重新执行同一核验，而不能只引用本文件。

---

## 二、逐条结论与一手来源

### P01｜LangGraph 适合作为编辑部状态机主线

- **关键结论**：LangGraph 提供有状态图、持久执行／检查点与人机中断所需的主干能力；仓库许可证为 MIT。课程固定提交的 `pyproject.toml` 与核验时最新 core 稳定版均为 1.2.11（2026-08-11）。
- **课程判定**：PASS；主线编排层。
- **一手来源**：
  - https://github.com/langchain-ai/langgraph
  - https://github.com/langchain-ai/langgraph/releases
  - https://api.github.com/repos/langchain-ai/langgraph
  - https://docs.langchain.com/oss/python/langgraph/overview
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库元数据、LICENSE 展示、release 列表和官方功能文档；版本日期来自官方 release 条目。
- **局限**：没有审计全部依赖或对任何单一版本做渗透测试；“适合课程”是基于功能与许可证的课程设计判断，不是官方背书。

### P02｜Open Deep Research 适合作为研究代理架构案例，而非稳定产品承诺

- **关键结论**：该官方 LangChain 仓库以开放实现展示深度研究流程，许可证为 MIT；仓库已在课程固定提交后由维护者归档。其教学价值主要在固定架构拆解，不应把归档仓库等同于持续维护的产品依赖。
- **课程判定**：PASS（参考实现）；不作为唯一稳定运行依赖。
- **一手来源**：
  - https://github.com/langchain-ai/open_deep_research
  - https://github.com/langchain-ai/open_deep_research/pulls
- **核验日期**：2026-08-26
- **核验说明**：检查官方 README、LICENSE、固定提交与仓库归档状态。
- **局限**：归档不表示固定提交中的结构失效，但意味着只读且不再有持续维护承诺；未逐一验证示例所需的外部模型服务。

### P03｜OpenAI Agents SDK 可作为 handoff／guardrail／trace 对照，并可用 mock provider 教学

- **关键结论**：官方 Python SDK 仓库许可证为 MIT；课程固定提交 `5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec` 中的官方 release notes 顶部版本为 0.22.0。核心课程无需把付费模型调用设为验收前提。
- **课程判定**：CONDITIONAL；框架比较／选修。
- **一手来源**：
  - https://github.com/openai/openai-agents-python
  - https://api.github.com/repos/openai/openai-agents-python
  - https://github.com/openai/openai-agents-python/blob/main/docs/release.md
- **核验日期**：2026-08-26
- **核验说明**：读取仓库、API `pushed_at`／license 元数据与官方 release notes。
- **局限**：没有验证所有 provider 组合；“可用 mock 完成教学”是课程适配方案，并非仓库对所有功能的离线保证。

### P04｜Microsoft Agent Framework 是比 AutoGen 更合适的微软当前框架入口

- **关键结论**：Microsoft Agent Framework 官方仓库许可证为 MIT，官方发布页可见 Python 1.15.0（2026-08-21）。相比之下，AutoGen 官方 README 已声明 maintenance mode，并引导新用户转向 Agent Framework；AutoGen 仓库顶层内容许可证为 CC-BY-4.0，代码另由 `LICENSE-CODE` 采用 MIT。因此课程用 Agent Framework 替代 AutoGen，依据是维护状态与继任方向，不是代码许可证。
- **课程判定**：Agent Framework 为 CONDITIONAL；AutoGen 为 EXCLUDE。
- **一手来源**：
  - https://github.com/microsoft/agent-framework
  - https://github.com/microsoft/agent-framework/blob/main/LICENSE
  - https://github.com/microsoft/agent-framework/releases
  - https://github.com/microsoft/autogen
  - https://github.com/microsoft/autogen/blob/main/LICENSE-CODE
  - https://github.com/microsoft/autogen/blob/main/LICENSE
  - https://api.github.com/repos/microsoft/autogen
- **核验日期**：2026-08-26
- **核验说明**：对照两个微软官方仓库的许可证、发布与 GitHub API 元数据。
- **局限**：`activeRepoStatus` 是仓库自定义属性，不是 GitHub 的通用维护保证；排除是课程维护成本判断，不代表 AutoGen 代码不可研究。

### P05｜CrewAI 可用于角色式编排对照，但不能替代权限与状态契约

- **关键结论**：CrewAI 官方仓库许可证为 MIT，官方发布页核验时可见 1.15.17（2026-08-20）。它适合与状态图方案比较角色／任务抽象。
- **课程判定**：CONDITIONAL；对照实验，不进入最小预装主干。
- **一手来源**：
  - https://github.com/crewAIInc/crewAI
  - https://github.com/crewAIInc/crewAI/releases
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库许可证展示、README 与 release 页面。
- **局限**：“角色描述不足以形成最小权限”是安全工程推论；未比较该项目所有企业功能或 provider。

### P06｜RSSHub 能支撑公开信号雷达，但须承担 AGPL 与来源规则

- **关键结论**：RSSHub 官方仓库以 AGPL-3.0 许可；2026-07 仍有可见 PR 活动。它适合把教师批准的公开信息源转换为统一 RSS 输入。
- **课程判定**：CONDITIONAL；仅用于教师批准的官方 RSS、开放 API、自有或明确授权来源，并在部署时履行 AGPL 义务。
- **一手来源**：
  - https://github.com/DIYgod/RSSHub
  - https://github.com/DIYgod/RSSHub/pulls
  - https://docs.rsshub.app/
- **核验日期**：2026-08-26
- **核验说明**：核对官方仓库许可证展示、PR 活动与官方文档。
- **局限**：未逐条审核数千条路由对应站点的服务条款；某路由存在不代表课程获准抓取或再发布其内容。

### P07｜Crawl4AI 有很强教学价值，但需最低安全版本、隔离与额外署名核对

- **关键结论**：官方 release 页面核验时可见 v0.9.2（2026-07）。LICENSE 包含 Apache-2.0 文本并突出额外 attribution 要求，不能在课程材料中简写为“无附加条件的 Apache-2.0”。官方安全页显示 2026 年曾有涉及 Docker API 的严重公告。
- **课程判定**：CONDITIONAL；锁定 **≥0.9.2**、loopback、token、非特权隔离。
- **一手来源**：
  - https://github.com/unclecode/crawl4ai
  - https://github.com/unclecode/crawl4ai/releases
  - https://github.com/unclecode/crawl4ai/blob/main/LICENSE
  - https://github.com/unclecode/crawl4ai/security
  - https://docs.crawl4ai.com/
- **核验日期**：2026-08-26
- **核验说明**：直接核对 release、许可证文本和官方 security 页面；安全下限来自核验时公告与当前 0.9.x 安全默认的综合判断。
- **局限**：GitHub security 页面可能只向登录用户展示部分细节；没有重新利用漏洞或独立验证所有修补。最低版本在开课前必须重查。

### P08｜MarkItDown 是证据规范化核心，但不可信文件必须沙箱化

- **关键结论**：MarkItDown 官方仓库为 MIT；v0.1.7 已于 2026-07-29 正式发布。官方 README 对不可信输入给出安全提示；可选 extras 与传递依赖需要另做许可证／安全扫描。
- **课程判定**：CONDITIONAL，但进入受控核心环境。
- **一手来源**：
  - https://github.com/microsoft/markitdown
  - https://github.com/microsoft/markitdown/blob/main/LICENSE
  - https://github.com/microsoft/markitdown/blob/main/README.md
  - https://github.com/microsoft/markitdown/releases
  - https://github.com/microsoft/markitdown/commits
- **核验日期**：2026-08-26
- **核验说明**：对照 release 与主分支版本活动，并读取 README 安全说明和 LICENSE。
- **局限**：未对所有输入格式做恶意文件测试；主分支版本不等于正式发布，课程必须锁正式 tag 或审核过的 commit。

### P09｜Playwright 是确定性浏览器实验的首选，但不授权绕过平台规则

- **关键结论**：Playwright 官方仓库采用 Apache-2.0；课程固定提交的 `package.json` 为 1.63.0-next，核验时最新稳定 release 为 v1.62.1（2026-07-30）。其浏览器自动化能力适合允许页面渲染和本地 mock 发布测试，开发树版本与稳定发布线必须分别记录。
- **课程判定**：PASS；浏览器主线。
- **一手来源**：
  - https://github.com/microsoft/playwright
  - https://github.com/microsoft/playwright/releases
  - https://playwright.dev/docs/intro
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库许可证展示、release 与官方文档。
- **局限**：软件能力本身不构成目标网站授权；域名白名单、动作上限、速率和平台条款属于课程安全合同，不是 Playwright 许可证的替代物。

### P10｜browser-use 存在 release 与主分支版本漂移，必须锁定测试过的版本

- **关键结论**：官方仓库为 MIT；固定提交的 `pyproject.toml` 与核验时最新稳定 release 均为 0.13.8（2026-08-16），不存在先前记录的版本差异。课程仍不能使用浮动 main 或 `latest` 叙述复现性。
- **课程判定**：CONDITIONAL；浏览器代理案例。
- **一手来源**：
  - https://github.com/browser-use/browser-use
  - https://github.com/browser-use/browser-use/blob/main/LICENSE
  - https://github.com/browser-use/browser-use/releases
  - https://github.com/browser-use/browser-use/blob/main/pyproject.toml
  - https://docs.browser-use.com/
- **核验日期**：2026-08-26
- **核验说明**：同日对照官方 release 与主分支版本声明。
- **局限**：版本差异不等于缺陷，只表明发布与开发线不同；未验证某个 commit 的完整兼容矩阵。

### P11｜ComfyUI 必须使用已修补版本，并对 custom nodes 与模型单独核权

- **关键结论**：ComfyUI 官方仓库为 GPL-3.0；课程固定提交为 0.33.0，核验时最新稳定 release 为 v0.34.0（2026-08-26）。官方公告 GHSA-pj59-g5vv-74q4 记录路径穿越问题，修补版本线包含 v0.28.0；课程保留更高的 ≥0.30.0 安全下限。Custom nodes 和模型不因主仓库 GPL 自动获得同一许可或安全状态。
- **课程判定**：CONDITIONAL；多模态扩展包，最低 **≥0.30.0**。
- **一手来源**：
  - https://github.com/Comfy-Org/ComfyUI
  - https://github.com/Comfy-Org/ComfyUI/releases
  - https://github.com/Comfy-Org/ComfyUI/security/advisories/GHSA-pj59-g5vv-74q4
  - https://docs.comfy.org/
- **核验日期**：2026-08-26
- **核验说明**：核对官方 LICENSE 展示、release 和安全公告的受影响／修补版本。
- **局限**：没有审计任何第三方 custom node 或模型；“≥0.30.0”是课程保守基线，不代表不存在后续漏洞。

### P12｜Diffusers 的代码许可与模型权重许可必须分开

- **关键结论**：Diffusers 官方仓库代码为 Apache-2.0；release 页面可见 v0.40.0（2026-08-20）。库能运行许多模型，但模型卡、权重、训练数据与输出限制不是由代码许可证统一决定。
- **课程判定**：PASS（代码）；每个模型为 CONDITIONAL。
- **一手来源**：
  - https://github.com/huggingface/diffusers
  - https://github.com/huggingface/diffusers/releases
  - https://huggingface.co/docs/hub/model-cards
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库许可证／release，并以 Hugging Face 官方模型卡文档确认模型需独立记录用途信息。
- **局限**：未选择或审核某个具体 checkpoint；采用时必须记录模型页、license、hash 与允许用途。

### P13｜Whisper 可支撑免费本地字幕实验，但转写结果仍须人工核对

- **关键结论**：Whisper 官方仓库为 MIT；正式 release 页面可见 v20250625，2026-07 仍有 PR 活动。它能在本地完成语音识别，适合不依赖付费 API 的字幕底稿。
- **课程判定**：PASS。
- **一手来源**：
  - https://github.com/openai/whisper
  - https://github.com/openai/whisper/blob/main/LICENSE
  - https://github.com/openai/whisper/releases
  - https://github.com/openai/whisper/pulls
- **核验日期**：2026-08-26
- **核验说明**：检查 LICENSE、正式 release 与 PR 时间线。
- **局限**：维护活动不保证特定语言、口音或噪声条件下的准确度；人声素材授权和人工校对是课程额外要求。

### P14｜CosyVoice 的 Apache-2.0 代码不覆盖声音同意与所有模型条款

- **关键结论**：CosyVoice 官方仓库代码采用 Apache-2.0；项目适合中文语音合成实验，但声音人格权、被模仿者同意、模型权重与数据条款必须单独核验。
- **课程判定**：CONDITIONAL。
- **一手来源**：
  - https://github.com/QwenAudio/CosyVoice
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库的许可证与模型／使用说明入口；把代码和非代码权利分栏记录。
- **局限**：未审计每个发布模型、训练语料或目标法域的人格权规则；课程默认使用教师授权音频作为低风险替代。

### P15｜FFmpeg 的分发义务取决于构建配置

- **关键结论**：FFmpeg 官方 LICENSE 说明默认采用 LGPL-2.1-or-later；启用 GPL 组件会使整个构建受 GPL 约束，启用 `--enable-nonfree` 可能使生成二进制不可再分发。因此课程必须保存实际构建配置，而不能只写“FFmpeg 是 LGPL”。
- **课程判定**：CONDITIONAL；必须保存实际构建账，并在分发前按启用组件重新核对许可证义务。
- **一手来源**：
  - https://github.com/FFmpeg/FFmpeg
  - https://github.com/FFmpeg/FFmpeg/blob/master/LICENSE.md
  - https://ffmpeg.org/legal.html
- **核验日期**：2026-08-26
- **核验说明**：直接读取官方 LICENSE 和 FFmpeg 官方法律／许可说明。
- **局限**：未核验学生机器上的具体二进制、编解码器专利或地区法规；实际分发前必须检查 `ffmpeg -buildconf` 和目标用途。

### P16｜Prefect 适合课堂调度、重试和人工审批暂停

- **关键结论**：Prefect 官方仓库为 Apache-2.0；课程固定提交就是正式 3.8.4 release 的提交（2026-08-25）。它适合作为课程调度与运行记录层。
- **课程判定**：PASS。
- **一手来源**：
  - https://github.com/PrefectHQ/prefect
  - https://github.com/PrefectHQ/prefect/releases/tag/3.8.4
  - https://docs.prefect.io/
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库许可证展示、提交时间线与官方文档。
- **局限**：没有把托管云服务的商业条款纳入开源代码结论；课程建议的“人工暂停／收据”需要自行实现明确的状态契约。

### P17｜Temporal 适合进阶持久执行，不适合作为基础班唯一编排层

- **关键结论**：Temporal Server 官方仓库为 MIT；release 页面核验时可见 v1.31.2（2026-07-08）。它能用于解释持久执行和长事务，但部署复杂度高于基础实验需要。
- **课程判定**：CONDITIONAL；进阶阅读／实验。
- **一手来源**：
  - https://github.com/temporalio/temporal
  - https://github.com/temporalio/temporal/blob/main/LICENSE
  - https://github.com/temporalio/temporal/releases
- **核验日期**：2026-08-26
- **核验说明**：核对官方 LICENSE 与 release。
- **局限**：“复杂度更高”是课程运维判断；没有比较所有部署模式或托管服务。

### P18｜Mixpost Lite 是许可清楚的自托管分发案例，但真实平台连接仍须另审

- **关键结论**：Mixpost Lite 官方仓库为 MIT；release 页面可见 v2.6.0（2026-03-16）。它适合作为审批后调度器的参考，但仓库许可证不替代每个目标平台的 API 与内容规则。
- **课程判定**：PASS（仅 mock／受控连接）。
- **一手来源**：
  - https://github.com/inovector/mixpost
  - https://github.com/inovector/mixpost/releases
  - https://docs.mixpost.app/
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库许可证、release 与文档。
- **局限**：未对每个社媒连接器、平台 API 版本或商业版条款做逐项审核；核心实验不连接真实账号。

### P19｜Postiz 只能使用已修补版本并隔离部署

- **关键结论**：Postiz 官方仓库为 AGPL-3.0。官方安全公告 GHSA-hhxq-3wg7-4rj8 显示 XSS 影响 ≥2.21.6，并在 ≥2.21.7 修补；核验时可见 2.22.1 容器／版本线信号。
- **课程判定**：CONDITIONAL；最低 **≥2.21.7**，建议使用当期更高已测试版本。
- **一手来源**：
  - https://github.com/gitroomhq/postiz-app
  - https://github.com/gitroomhq/postiz-app/security/advisories/GHSA-hhxq-3wg7-4rj8
  - https://github.com/gitroomhq/postiz-app/pkgs/container/postiz-app
- **核验日期**：2026-08-26
- **核验说明**：直接读取官方 advisory 的 affected／patched 版本，并检查官方包页面。
- **局限**：修补这一公告不等于没有其他漏洞；没有审计真实平台凭据处理。课程只用非生产凭据和 mock 目标。

### P20｜Umami 适合作为隐私友好的站内事件主线

- **关键结论**：Umami 官方仓库为 MIT；课程固定提交的 `package.json` 与核验时最新稳定 release 均为 v3.3.1（2026-08-20）。它适合教授匿名站内事件与转化，而不是跨站身份画像。
- **课程判定**：PASS。
- **一手来源**：
  - https://github.com/umami-software/umami
  - https://github.com/umami-software/umami/blob/master/LICENSE
  - https://github.com/umami-software/umami/discussions/4442
  - https://umami.is/docs
- **核验日期**：2026-08-26
- **核验说明**：核对官方 LICENSE、版本公告与官方文档。
- **局限**：“隐私友好”不代表任何部署天然合规；IP 处理、事件属性、cookie、保留期和服务器日志仍需配置与地区化审查。

### P21｜Plausible 必须使用 3.2.1 或更高的已测试版本

- **关键结论**：Plausible Community Edition 官方仓库为 AGPL-3.0-or-later。官方 advisory GHSA-mhcv-h7gf-57cf 记录未认证 RCE 影响 ≥3,<3.2.1，并在 3.2.1 修补。
- **课程判定**：CONDITIONAL；最低 **≥3.2.1**。
- **一手来源**：
  - https://github.com/plausible/analytics
  - https://github.com/plausible/analytics/security/advisories/GHSA-mhcv-h7gf-57cf
- **核验日期**：2026-08-26
- **核验说明**：直接读取官方安全公告影响范围和修补版本。
- **局限**：最低安全版本只针对这条公告；采用时仍需检查新的 advisories、部署暴露面和依赖锁。

### P22｜Langfuse 的核心 MIT 与 `ee/` 企业许可证必须分开

- **关键结论**：Langfuse 官方仓库核心代码采用 MIT，但 `ee/` 目录有单独企业许可证；课程固定提交的 `package.json` 为 4.19.0，核验时最新稳定 release 为 v4.21.0（2026-08-26）。追踪数据可能包含提示、用户输入、模型输出与工具参数，因此课程必须脱敏。
- **课程判定**：CONDITIONAL；只有明确排除 `ee/`、限定许可证范围并完成 trace 脱敏与保留策略的核心路径才可进入实验。
- **一手来源**：
  - https://github.com/langfuse/langfuse
  - https://github.com/langfuse/langfuse/blob/main/ee/LICENSE
  - https://github.com/langfuse/langfuse/releases
  - https://langfuse.com/docs
- **核验日期**：2026-08-26
- **核验说明**：检查仓库根许可说明、`ee/` 许可证、release 与 tracing 文档。
- **局限**：未审计具体部署的数据流或企业功能；“追踪可能含 PII”是由典型 trace 字段推导的隐私风险，实施时要实测脱敏。

### P23｜Promptfoo 适合离线回归与红队，但需跟随其安全支持策略

- **关键结论**：Promptfoo 官方仓库为 MIT；课程固定提交的 `package.json` 为 0.122.0，同版 release 在 2026-08-04 可见。官方 security 页面说明其安全支持范围。课程使用固定版本、固定 fixtures 和最小权限 provider。
- **课程判定**：PASS。
- **一手来源**：
  - https://github.com/promptfoo/promptfoo
  - https://github.com/promptfoo/promptfoo/blob/main/package.json
  - https://github.com/promptfoo/promptfoo/security
  - https://www.promptfoo.dev/docs/intro/
- **核验日期**：2026-08-26
- **核验说明**：读取官方 LICENSE 展示、版本文件、安全支持页和文档。
- **局限**：未执行所有红队插件或 provider；不可信模板／插件仍可能引入代码执行或网络风险，需隔离。

### P24｜NeMo Guardrails 可做运行时护栏，但不能替代事实核验

- **关键结论**：NeMo Guardrails 官方仓库为 Apache-2.0；课程固定提交报告 0.24.0.dev0，而核验时官方稳定线为 v0.23.0（2026-07-01）。它适合表达输入、输出、对话与工具调用规则，但开发提交与稳定文档必须明确区分。
- **课程判定**：PASS。
- **一手来源**：
  - https://github.com/NVIDIA-NeMo/Guardrails
  - https://github.com/NVIDIA-NeMo/Guardrails/blob/develop/CHANGELOG.md
  - https://docs.nvidia.com/nemo/guardrails/latest/
- **核验日期**：2026-08-26
- **核验说明**：核对官方许可证展示、CHANGELOG 和当前官方文档。
- **局限**：护栏效果取决于规则、模型和集成；文档命令可能随版本变化。课程必须把版本化测试作为真值，不依赖文字示例。

### P25｜c2pa-rs/c2patool 可记录来源声明，但不能证明事实真实

- **关键结论**：c2pa-rs 官方仓库采用 MIT OR Apache-2.0 双许可证；课程固定提交的 c2patool CLI 报告 0.28.0-dev，而根 c2pa crate 报告 0.91.0-dev；核验时官方最新稳定 c2patool release 为 v0.27.15（2026-08-13）。CLI 能创建／读取／验证内容凭证。C2PA 规范描述的是内容来源机制；有效凭证证明的是声明与签名链／篡改状态，不自动证明被声明事件或内容语义真实。
- **课程判定**：PASS；按 0.x beta 管理。
- **一手来源**：
  - https://github.com/contentauth/c2pa-rs
  - https://github.com/contentauth/c2pa-rs/releases
  - https://github.com/contentauth/c2pa-rs/blob/7132161cdb0dbb01f01ae0563d5926214c9044db/Cargo.toml
  - https://github.com/contentauth/c2pa-rs/blob/7132161cdb0dbb01f01ae0563d5926214c9044db/cli/Cargo.toml
  - https://github.com/contentauth/c2pa-rs/blob/main/cli/README.md
  - https://github.com/contentauth/c2pa-rs/security
  - https://c2pa.org/specifications/
- **核验日期**：2026-08-26
- **核验说明**：核对官方仓库许可证、release、CLI 功能与标准组织规范入口。
- **局限**：未搭建生产证书／信任列表；0.x API 和格式工具可能变化。对“不是事实认证”的表述是对标准能力边界的保守解释。

### P26｜ScanCode Toolkit 适合生成许可证线索，但扫描结果不是法律结论

- **关键结论**：ScanCode Toolkit 的代码采用 Apache-2.0，参考数据还包含 CC-BY-4.0 与其他第三方条款；课程固定提交报告 33.0.0rc1，而核验时官方稳定 release 为 v32.5.0。它适合建立组件／许可证清单和人工复核队列，候选版与稳定版必须分开记录。
- **课程判定**：PASS。
- **一手来源**：
  - https://github.com/aboutcode-org/scancode-toolkit
  - https://github.com/aboutcode-org/scancode-toolkit/releases
  - https://scancode-toolkit.readthedocs.io/
- **核验日期**：2026-08-26
- **核验说明**：读取官方仓库许可说明、第三方数据提示、release 与文档。
- **局限**：没有验证每个参考数据文件；许可证识别可能有误报／漏报，冲突判断和法律适用仍需人工审核。

### P27｜Ollama 的 MIT 代码不等于其拉取模型均可商用

- **关键结论**：Ollama 官方代码仓库为 MIT；模型由不同发布者提供，须分别核对模型卡、许可证和用途限制。因此课程只把 Ollama 当本地运行器，不把某个模型权利写进运行器结论。
- **课程判定**：CONDITIONAL。
- **一手来源**：
  - https://github.com/ollama/ollama
  - https://github.com/ollama/ollama/blob/main/LICENSE
- **核验日期**：2026-08-26
- **核验说明**：核对代码 LICENSE，并把模型权利作为独立账本字段。
- **局限**：未指定、下载或审核任何模型；模型目录和上游权重条款可能变化。

### P28｜SearXNG 可作为自托管搜索扩展，但滚动镜像需锁 digest

- **关键结论**：SearXNG 官方仓库为 AGPL-3.0-or-later；官方容器页面核验时可见 2026.8.20 滚动版本信号。课程采用时必须固定 digest、限制引擎和外网范围。
- **课程判定**：CONDITIONAL。
- **一手来源**：
  - https://github.com/searxng/searxng
  - https://github.com/searxng/searxng/pkgs/container/searxng
  - https://docs.searxng.org/
- **核验日期**：2026-08-26
- **核验说明**：读取官方 LICENSE 展示、容器包时间线与文档。
- **局限**：没有审核每个上游搜索引擎的条款、访问限制或结果许可；滚动版本日期不等于稳定 release。

### P29｜Firecrawl 各目录许可不完全相同，不适合作为本课的简化主干

- **关键结论**：Firecrawl 官方 README 说明核心采用 AGPL，同时部分 SDK／UI 目录采用 MIT。课程若使用，必须做目录级许可证清单，不能给整个生态贴单一 MIT 标签。
- **课程判定**：CONDITIONAL；不进入最小主干。
- **一手来源**：
  - https://github.com/firecrawl/firecrawl
  - https://github.com/firecrawl/firecrawl/blob/main/README.md
- **核验日期**：2026-08-26
- **核验说明**：读取官方 README 中的 license 说明和仓库结构。
- **局限**：未逐文件执行许可证扫描；实际版本可能调整目录或许可，采用时应以锁定 commit 再审。

### P30｜LLM Guard 已归档，不进入学生依赖锁

- **关键结论**：Protect AI 的 LLM Guard 官方仓库在 2026-07-09 显示 archived；归档意味着只读和维护／漏洞响应不确定。
- **课程判定**：EXCLUDE。
- **一手来源**：
  - https://github.com/protectai/llm-guard
  - https://github.com/protectai/llm-guard/blob/main/LICENSE
  - https://api.github.com/repos/protectai/llm-guard
- **核验日期**：2026-08-26
- **核验说明**：检查 GitHub 仓库横幅与 API `archived`／`archived_at` 元数据。
- **局限**：归档不表示现有代码失效；排除仅针对需要持续安全维护的课程依赖。

### P31｜GPT Researcher 在 XSS 修复得到官方确认前排除

- **关键结论**：GPT Researcher 官方仓库许可证元数据为 Apache-2.0；公开 issue #1692 记录 3.4.3 及更早版本的 reflected XSS 风险。核验时未获得一个可由官方公告确认的修补版本，因此不进入课程执行主线。
- **课程判定**：EXCLUDE，直到官方修复与安全版本可核验。
- **一手来源**：
  - https://api.github.com/repos/assafelovic/gpt-researcher
  - https://github.com/assafelovic/gpt-researcher
  - https://github.com/assafelovic/gpt-researcher/issues/1692
- **核验日期**：2026-08-26
- **核验说明**：对照 GitHub API 许可证元数据与官方仓库 issue；采用失败关闭原则。
- **局限**：issue 是公开仓库问题而非 GitHub Security Advisory；没有独立复现漏洞，也不能排除修补已存在但未被本轮定位。重新纳入前需找到官方 merge／release／advisory 证据。

### P32｜n8n 的 Sustainable Use License 不应被讲成标准开源许可证

- **关键结论**：n8n 官方 LICENSE 为 Sustainable Use License，包含特定使用限制；它不是本课程采用的标准 OSI 开源主线许可模型。
- **课程判定**：EXCLUDE（可作 source-available 许可比较案例）。
- **一手来源**：
  - https://github.com/n8n-io/n8n/blob/master/LICENSE.md
- **核验日期**：2026-08-26
- **核验说明**：直接读取官方许可证全文，而不是依赖仓库标签或第三方许可证数据库。
- **局限**：未对用户的具体商业场景提供法律判断；排除是课程叙事与复用边界选择，不表示任何使用都不允许。

### P33｜Remotion 采用特殊许可证，不能作为“普通开源视频库”进入主线

- **关键结论**：Remotion 官方 LICENSE 对不同主体和用途设置特定条件；其中超过三人的营利组织等场景需要公司许可证。为避免学生误用，视频主线采用 FFmpeg。
- **课程判定**：EXCLUDE（单独核权后可选修）。
- **一手来源**：
  - https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- **核验日期**：2026-08-26
- **核验说明**：直接读取官方特殊许可证中的主体／用途条件。
- **局限**：没有为任何具体组织解释合同适用；如需采用，必须针对当期许可证与主体规模重新审查。

### P34｜“四账分离”是由多仓库许可边界共同支持的课程治理推论

- **关键结论**：代码、模型／权重、输入素材／数据、人格／音色／隐私／平台授权必须分账。该结论由多个一手事实共同支持：Diffusers／Ollama／CosyVoice 的代码与模型或声音权利不同；ComfyUI 主仓与 custom nodes／模型不同；FFmpeg 构建选项改变分发义务；Langfuse 核心与 `ee/` 不同；Firecrawl 子目录许可不同。
- **课程判定**：课程硬门。
- **一手来源**：
  - https://github.com/huggingface/diffusers
  - https://huggingface.co/docs/hub/model-cards
  - https://github.com/ollama/ollama/blob/main/LICENSE
  - https://github.com/QwenAudio/CosyVoice
  - https://github.com/Comfy-Org/ComfyUI
  - https://github.com/FFmpeg/FFmpeg/blob/master/LICENSE.md
  - https://github.com/langfuse/langfuse/blob/main/ee/LICENSE
  - https://github.com/firecrawl/firecrawl/blob/main/README.md
- **核验日期**：2026-08-26
- **核验说明**：跨项目比较官方许可层次，并将其转成课程资产清单结构。
- **局限**：四账是工程治理模型，不是完整法律分类；地区著作权、数据库权、人格权、消费者保护、广告披露和平台合同仍需专业复核。

### P35｜课程可以在不依赖付费 API 的情况下覆盖十模块核心能力

- **关键结论**：核心仓库均提供可本地运行或可用纯规则／fixture 替代的教学路径：LangGraph／Prefect 可用纯函数节点；RSSHub／Crawl4AI／MarkItDown 可处理教师固定材料；Whisper／FFmpeg 可本地执行；Promptfoo 支持本地断言；ScanCode／c2patool 提供本地 CLI；Umami／Langfuse 可由本地 JSONL／合成数据适配。
- **课程判定**：课程可达性合同；云 API 仅为可替换选修适配器。
- **一手来源**：
  - https://github.com/langchain-ai/langgraph
  - https://github.com/PrefectHQ/prefect
  - https://github.com/DIYgod/RSSHub
  - https://github.com/unclecode/crawl4ai
  - https://github.com/microsoft/markitdown
  - https://github.com/openai/whisper
  - https://github.com/FFmpeg/FFmpeg
  - https://github.com/promptfoo/promptfoo
  - https://github.com/aboutcode-org/scancode-toolkit
  - https://github.com/contentauth/c2pa-rs/blob/main/cli/README.md
  - https://github.com/umami-software/umami
  - https://github.com/langfuse/langfuse
- **核验日期**：2026-08-26
- **核验说明**：检查各项目本地运行／CLI／自托管能力后，设计同一接口的规则、fixture 和 mock 降级路径。
- **局限**：没有在所有硬件组合上基准测试；ComfyUI／Diffusers／CosyVoice 可能需要 GPU，因此多模态核心验收以教师素材、Whisper 和 FFmpeg 为低资源路径。

### P36｜“人审后发布、默认 mock、官方 API 优先”是风险边界，不是仓库功能限制

- **关键结论**：Playwright、browser-use、Mixpost、Postiz 能执行浏览器或分发动作，但这些软件的存在不提供目标平台授权。课程将公开发布、删除、付费、私信和账号权限变更定义为不可逆高风险动作，必须人工批准；核心实验只用本地 mock。
- **课程判定**：发布安全合同。
- **一手来源**：
  - https://playwright.dev/docs/intro
  - https://docs.browser-use.com/
  - https://docs.mixpost.app/
  - https://github.com/gitroomhq/postiz-app
- **核验日期**：2026-08-26
- **核验说明**：确认工具的能力边界后，以最小权限、人在回路和失败关闭原则形成课程工程推论。
- **局限**：本轮没有逐个平台检索 X、YouTube、抖音、小红书、微信等当期开发者条款；任何真实连接器启用前必须重新读取目标平台官方规则和地区要求。

### P37｜外部内容必须当作不可信输入

- **关键结论**：网页、PDF、Office 文档、模型输出和工具返回值可能包含恶意内容或提示注入。MarkItDown 对不可信文件给出风险提示；Crawl4AI 和 ComfyUI 的历史公告也表明暴露服务／输入处理会形成攻击面。课程因此采用沙箱、大小／格式上限、域名允许清单、无 secrets 运行和工具最小权限。
- **课程判定**：发布安全合同。
- **一手来源**：
  - https://github.com/microsoft/markitdown/blob/main/README.md
  - https://github.com/unclecode/crawl4ai/security
  - https://github.com/Comfy-Org/ComfyUI/security/advisories/GHSA-pj59-g5vv-74q4
- **核验日期**：2026-08-26
- **核验说明**：把官方安全提示和公告转译为通用内容供应链防护。
- **局限**：不是完整威胁模型；没有覆盖操作系统、浏览器零日、模型文件反序列化、容器逃逸或所有提示注入类型。

### P38｜版本锁、哈希和安全下限是复现与发布的共同条件

- **关键结论**：browser-use 的 release／main 漂移、ComfyUI／Postiz／Plausible 的明确修补版本、FFmpeg 构建差异、SearXNG 滚动镜像和模型权重独立变化共同说明：只写项目名或 `latest` 不足以复现或判断安全／许可。
- **课程判定**：所有模块的供应链硬门。
- **一手来源**：
  - https://github.com/browser-use/browser-use/releases
  - https://github.com/browser-use/browser-use/blob/main/pyproject.toml
  - https://github.com/Comfy-Org/ComfyUI/security/advisories/GHSA-pj59-g5vv-74q4
  - https://github.com/gitroomhq/postiz-app/security/advisories/GHSA-hhxq-3wg7-4rj8
  - https://github.com/plausible/analytics/security/advisories/GHSA-mhcv-h7gf-57cf
  - https://github.com/FFmpeg/FFmpeg/blob/master/LICENSE.md
  - https://github.com/searxng/searxng/pkgs/container/searxng
  - https://huggingface.co/docs/hub/model-cards
- **核验日期**：2026-08-26
- **核验说明**：比较版本、公告、构建与模型元数据后形成发布物料清单要求。
- **局限**：锁版本只能提高可复现性，不能自动消除漏洞；仍需定期升级、回归和重新核权。

### P39｜维护活动是纳入信号，不是质量或安全担保

- **关键结论**：本简报使用 release、commit 和 PR 的近期活动帮助排除明显停止维护的依赖，但活跃项目仍可能存在严重漏洞；Plausible、Postiz、ComfyUI 和 Crawl4AI 的官方安全记录即是例证。
- **课程判定**：选源方法限制。
- **一手来源**：
  - https://github.com/plausible/analytics/security/advisories/GHSA-mhcv-h7gf-57cf
  - https://github.com/gitroomhq/postiz-app/security/advisories/GHSA-hhxq-3wg7-4rj8
  - https://github.com/Comfy-Org/ComfyUI/security/advisories/GHSA-pj59-g5vv-74q4
  - https://github.com/unclecode/crawl4ai/security
- **核验日期**：2026-08-26
- **核验说明**：将维护信号与安全公告分开记录，不以 GitHub 星标、提交频率或版本号代替风险评估。
- **局限**：未构建量化维护评分，也未使用 GitHub 星数作为质量指标；部分私下披露漏洞不会出现在公开页面。

### P40｜课程的 10 模块映射是综合设计推论

- **关键结论**：十模块不是任一仓库官方课程，而是把上述项目的可核验能力组合为“目标—信号—证据—编排—门禁—多模态—资产化—审批发布—反馈—治理”的教学闭环。每模块至少 3 个仓库，并提供一个无需付费 API 的实验。
- **课程判定**：课程蓝图。
- **一手来源**：上述 P01–P39 所列官方仓库与文档；重点功能入口包括：
  - https://docs.langchain.com/oss/python/langgraph/overview
  - https://docs.rsshub.app/
  - https://docs.crawl4ai.com/
  - https://playwright.dev/docs/intro
  - https://docs.prefect.io/
  - https://www.promptfoo.dev/docs/intro/
  - https://docs.nvidia.com/nemo/guardrails/latest/
  - https://c2pa.org/specifications/
  - https://scancode-toolkit.readthedocs.io/
- **核验日期**：2026-08-26
- **核验说明**：先做仓库级选源与风险审查，再按学习成果和产出物进行模块化，而不是按工具品牌开章。
- **局限**：课程学习效果尚需首轮教学数据验证；不应把技术选型报告当作已经完成的教学有效性研究。

### P41｜Course 16 已提供可离线复跑的原创合成验收材料

- **关键结论**：`public/courses/creator-ops/lab/` 已交付四份冲突来源、33 条合成事件、10 条合成反馈、六类故障和六个 mock 发布情境；全部为原创合成材料、`CC0-1.0`、无需网络或凭证，并由十文件 SHA-256 清单锁定。课程页面直接链接相应材料。
- **课程判定**：可用于模块 2–3、5、8–10 与 Capstone 的确定性离线核心实验。
- **直接来源**：
  - `public/courses/creator-ops/lab/README.md`
  - `public/courses/creator-ops/lab/manifest.sha256`
  - `public/courses/creator-ops/lab/fault-injections.json`
  - `public/courses/creator-ops/lab/mock-publish-scenarios.json`
  - `public/courses/creator-ops/lab/synthetic-events.csv`
  - `public/courses/creator-ops/lab/synthetic-feedback.jsonl`
- **核验日期**：2026-08-26
- **核验说明**：离线检查器验证精确 11 文件清单、十文件逐项 SHA-256、JSON/JSONL/CSV 结构、六故障与六场景控制合同、惰性 `mock://` 定位和 UI 可发现性；真实浏览器检查器再验证公开链接可达。
- **局限**：合成材料只能证明课程工作流与控制决策可复跑，不能证明真实平台合规、性能、触达、收入或因果效果；工作台完成状态仍是自我声明，需人工复核成果质量。

---

## 二点五、Course 16 canonical ledger 裁决

最终课程台账以 `lib/creator-ops/sources.ts` 的 27 条固定 revision 为唯一发布判定源，完整统计为 **13 PASS / 10 CONDITIONAL / 4 EXCLUDED**，并采用研究侧车中更保守的边界：

- `openai-agents` 保持 `CONDITIONAL`：只在 mock／本地比较路径使用，不把云模型、API 访问或费用写成核心前提；
- `crawl4ai` 保持 `CONDITIONAL`：最低安全版本、loopback、token、非特权隔离、额外署名和目标站点授权必须同时满足；
- `ffmpeg` 保持 `CONDITIONAL`：最终许可证义务取决于实际构建配置、启用组件与处理素材权利，必须保存 `ffmpeg -buildconf` 和分发账；
- `langfuse` 保持 `CONDITIONAL`：核心与 `ee/` 许可范围必须分账，真实 trace 还必须完成脱敏、采样、访问与保留策略；
- `markitdown` 保持 `CONDITIONAL`：只处理自有或获授权输入，并对不可信文件、extras 与传递依赖另做沙箱和审查；
- `rsshub` 从早期研究建议的 `PASS` 收紧为 `CONDITIONAL`：AGPL 许可证不能统一授权数千条路由所对应的目标站点采集，核心实验只允许教师批准来源。

这六项均不是从有条件状态提升为无条件采用。主研究简报发布附录、运行时来源数组、页面决策卡和 release checker 必须逐 ID 保持一致；未来任何判定提升都要记录精确 revision、理由、复核人和复核时间。

---

## 三、关键版本与条件快照

下表便于发布工程快速做 fail-closed 检查。它不替代逐项来源核验。

| 项目 | 2026-08-26 核验快照 | 课程最低条件 | 复核入口 |
|---|---|---|---|
| LangGraph | 固定提交与最新 core 稳定版均为 1.2.11，2026-08-11 | 锁定精确版本 | https://github.com/langchain-ai/langgraph/releases/tag/1.2.11 |
| Crawl4AI | release 可见 0.9.2，2026-07 | ≥0.9.2；loopback + token + 隔离 | https://github.com/unclecode/crawl4ai/releases |
| MarkItDown | 正式 release v0.1.7，2026-07-29 | 锁 tag／commit；不可信输入沙箱 | https://github.com/microsoft/markitdown/releases/tag/v0.1.7 |
| Prefect | 固定提交即正式 release 3.8.4，2026-08-25 | 锁版本；worker 权限与集成测试 | https://github.com/PrefectHQ/prefect/releases/tag/3.8.4 |
| Playwright | 固定提交 1.63.0-next；最新稳定版 v1.62.1，2026-07-30 | 锁版本；域名／动作允许清单 | https://github.com/microsoft/playwright/releases/tag/v1.62.1 |
| browser-use | 固定提交与最新稳定 release 均为 0.13.8，2026-08-16 | 锁经过课程测试的 tag／commit | https://github.com/browser-use/browser-use/releases/tag/0.13.8 |
| ComfyUI | 固定提交 0.33.0；最新稳定版 v0.34.0，2026-08-26 | 保留 ≥0.30.0 安全下限；节点允许清单 | https://github.com/Comfy-Org/ComfyUI/releases/tag/v0.34.0 |
| Diffusers | release 可见 v0.40.0，2026-08-20 | 代码与模型权重分账 | https://github.com/huggingface/diffusers/releases |
| Whisper | release 可见 v20250625 | 人声授权；人工校对 | https://github.com/openai/whisper/releases |
| Temporal | release 可见 v1.31.2，2026-07-08 | 仅进阶；锁 server／SDK 兼容版本 | https://github.com/temporalio/temporal/releases |
| Mixpost | release 可见 v2.6.0，2026-03-16 | 默认 mock；真实 API 另审 | https://github.com/inovector/mixpost/releases |
| Postiz | XSS 修补下限 2.21.7 | ≥2.21.7；隔离；非生产凭据 | https://github.com/gitroomhq/postiz-app/security/advisories/GHSA-hhxq-3wg7-4rj8 |
| Umami | 固定提交与最新稳定版均为 v3.3.1，2026-08-20 | 匿名／合成数据；保留期 | https://github.com/umami-software/umami/releases/tag/v3.3.1 |
| Plausible | RCE 修补下限 3.2.1 | ≥3.2.1；限制暴露面 | https://github.com/plausible/analytics/security/advisories/GHSA-mhcv-h7gf-57cf |
| Langfuse | 固定提交 4.19.0；最新稳定版 v4.21.0，2026-08-26 | 核心与 `ee/` 分账；trace 脱敏 | https://github.com/langfuse/langfuse/releases/tag/v4.21.0 |
| Promptfoo | 固定提交 0.122.0；同版 release 可见 2026-08-04 | 锁版本；跟随官方安全支持范围 | https://github.com/promptfoo/promptfoo/security |
| NeMo Guardrails | 固定提交 0.24.0.dev0；稳定线 v0.23.0 | 开发提交与稳定文档分开；回归测试 | https://github.com/NVIDIA-NeMo/Guardrails/blob/develop/CHANGELOG.md |
| c2patool | 固定 CLI 0.28.0-dev（根 c2pa crate 0.91.0-dev）；最新稳定 release v0.27.15（2026-08-13） | 0.x beta；固定版本与凭证测试 | https://github.com/contentauth/c2pa-rs/releases |
| ScanCode Toolkit | 固定提交 33.0.0rc1；稳定 release v32.5.0 | 候选版与稳定版分开；数据许可分账 | https://github.com/aboutcode-org/scancode-toolkit/releases |
| SearXNG | 容器可见 2026.8.20 | 锁 digest；限制引擎／网络 | https://github.com/searxng/searxng/pkgs/container/searxng |

---

## 四、证据未覆盖与发布前待办

本轮研究有意没有把下列内容包装成“已核验”：

1. **具体模型与素材**：尚未为课程选定的 LLM、图像 checkpoint、LoRA、TTS 权重、音乐、字体、图片和人物素材做逐项权利审计。
2. **平台条款**：尚未逐一核验微信、视频号、抖音、小红书、Bilibili、YouTube、X、Instagram、TikTok 等在目标地区的 2026-08 当期 API、自动化、广告、AI 披露与数据规则。
3. **完整安全审计**：没有对候选仓库运行 SAST、依赖漏洞扫描、容器扫描、恶意模型扫描、动态测试或渗透测试。
4. **法律适用**：没有对版权例外、数据库权、个人信息保护、声音／肖像权、广告法或消费者保护作地区化法律意见。
5. **性能与硬件**：没有在所有学生设备上验证 ComfyUI、Diffusers、Whisper、CosyVoice 和本地 LLM 的性能。
6. **教学有效性**：没有首轮学生数据，不能宣称十模块已经被实证证明优于其他课程设计。

正式上线前，课程团队应把以下动作作为 release gate：

- 用实际锁文件重新生成 SBOM／ScanCode 报告；
- 对所有容器锁 digest，并检查当前 advisories；
- 为每个模型、节点、字体、图片、音频和视频建立四账记录；
- 对外部输入、浏览器动作、连接器和追踪数据完成威胁模型；
- 用 mock 账号先跑完整人工审批、幂等、失败恢复和更正流程；
- 由熟悉目标地区的合规人员复核实际平台、广告、隐私和人格权要求；
- 在课程网页明确展示依赖核验日期，并避免使用“完全合规”“绝对安全”“全自动无人值守”等不可证明承诺。

---

## 五、Course 16 有界发布复核收据

本复核收据只覆盖课程网页当前实现：原创静态课程文本与界面、固定 GitHub 提交的 link-only 引用、合成／浏览器本地练习，以及默认不连接账号、不调用付费模型、不安装第三方仓库、不向外部平台写入的教学路径。它不授权把课程示例直接改造成真实生产发布系统。

`locked_surface_sha256` 锁定 `scripts/check-creator-ops-course.mjs` 中 `LOCKED_SURFACE_PATHS` 的完整、有序文件清单，而不是只锁课程文案。清单覆盖课程路由与布局、Course 16 组件和 CSS、确定性生产分析入口、共享导航直接依赖、进度存储与全站重置、课程目录、SEO／sitemap、9 个界面语言消息、完整英中内容与来源账本、研究简报／NOTICE、11 个离线实验包文件、Next／Vercel／包锁配置，以及 release、static、真实浏览器三个检查器自身。确定性算法为：按该常量的顺序读取 UTF-8 原始字节，将每项编码为 `path + NUL + file`，项目之间再以 NUL 连接，最后计算 SHA-256。侧车自身不进入哈希，以避免循环；检查器会要求每个复核收据键恰好出现一次，并逐项核对本记录。

`deployment_surface_sha256` 另行锁定 `next build` 实际生成的 **完整 `out/` 静态导出闭包**，而不只锁课程目录。这样会覆盖 99 份课程 HTML、课程目录、站点地图、NOTICE、离线实验包、所有 HTML／RSC 预取文件和共享 `_next` 运行时；共享导航预取的 About 等页面也不会落在哈希之外。静态检查器把全部普通非符号链接文件的部署相对路径按 UTF-8 字节序排序，并按 `path + NUL + raw bytes + NUL` 计算 SHA-256；它优先在内存中翻转一个真实会被预取的 `ar/about/index.html` 字节（不存在时才退回 `_next` 文件），确认聚合哈希必然变化。因此任何可由静态服务器返回的文件发生漂移，部署校验和都会失配并 fail closed。代价是其他课程或共享页面引起的任何导出变化也会要求 Course 16 重新构建与复核，这是本门课程选择的保守发布边界。

`deterministic_build_id` 由 `lib/deterministic-build-id.cjs` 对 `app/`、`components/`、`lib/`、`messages/`、`public/` 及 Next／包锁／TypeScript／Vercel 配置的有序相对路径与原始字节计算完整 SHA-256。算法使用 UTF-8 字节序、版本化命名空间和路径／文件长度 framing，拒绝符号链接、重复路径及哈希期间发生的并发改写；文件系统元数据只用于发现竞争写入，不进入摘要。默认项目根锚定该模块所在目录，而不是调用命令的 shell `cwd`，并使用 CommonJS 形态兼容 Next 16.3.1 默认的 `next.config.ts` 配置加载器，因此从项目根或父目录调用官方 `next build [directory]` 入口会使用同一输入边界。它不读取 Git 状态、`VERCEL` 标记或 `.env`，也不纳入被 gitignore 且会在 `next dev`／`next build` 间由 Next 重写的派生 `next-env.d.ts`。这样既避免 Next 默认随机 ID 让同一源码产生不同 manifest 路径，也避免永久常量 ID 跨版本复用缓存。静态检查器会重新计算该 ID，要求它同时等于 `.next/BUILD_ID`、三个导出 manifest 的目录和本收据字段。构建环境独立性仍须另行实测；不能因为 ID 相同就推断所有渲染字节相同。

2026-08-26 的独立可重复性审计从同一冻结源码分别执行一次父目录 `next build [absolute-directory]`、一次项目根构建和一次父目录 `VERCEL=1` 构建：三者的 build ID、12,137 个相对路径、逐文件原始字节与聚合摘要均完全一致，路径差异与内容差异均为 0；共享 `out/` 也逐字节匹配。负向夹具同时确认：只改变 mtime 不改变 ID，构建输入改变一个字节必然改变 ID，恢复字节会恢复 ID，改动排除的 `out/`／`.next/` 不改变 ID，输入根内符号链接则明确失败。浏览器对 99／99 Course 16 页面完成水合和运行时错误检查，实际服务的 363 个普通文件全部落在签名闭包内。

这些 SHA-256 是 **checksum-backed review receipt（校验和支持的复核收据）**，其威胁模型是发现受审内容与发布产物的意外漂移；它们不是密码学身份签名，不能单独证明“谁批准了什么”。责任身份与审批证据必须由受保护的 Git review／commit history 或外部审计记录承担。任何有工作区写权限的人理论上都能同时修改检查器、重新计算哈希并改写本侧车，因此不得把本记录描述为不可伪造签名。

下面四个单文件哈希是为了让课程结构、来源账本和两份审校正文能够单独复核；它们是总锁的一部分，不是总锁的范围上限。

```yaml
research_snapshot: "2026-08-26"
course: "aicourse.top / Course 16 / 智能体赋能自媒体运营"
course_version: "1.0.2"
deterministic_build_id: "src-5fcc22b1128cdbe381cb0834e905949a173948bf4c6caa25b2eedddcd6f7916d"
release_scope: "static-course-link-only-synthetic-no-external-writes"
source_count: "27"
source_decision_counts: "13 PASS / 10 CONDITIONAL / 4 EXCLUDED"
locked_surface_file_count: "69"
locked_surface_sha256: "0ba5bf210b68cecc5df8119fce6155ff9c2d77282d9f27e3659dfee4ab7a6a47"
deployment_surface_file_count: "12137"
deployment_surface_sha256: "b2a82c2b105a798c9717a207af9a4e39e4534150f8134f6d050def9403ea1239"
manifest_sha256: "7f4283c0ef19992efd20906de57a926da23a6ecc290ec3ee5660e7fbccb5dfef"
source_register_sha256: "11f8cf948d7586907a3a18343b552a319e214f6a20246dcdfe98a885ebec69aa"
english_copy_sha256: "019eac70e709188d155410859d52c9bba6307475345c08accb7dc3962dee3cbb"
simplified_chinese_copy_sha256: "60a7ec48d829f5d9766aa8d47002d473f06e2d3df26d86bf6bbc599284421706"
repository_review_reviewer: "Codex + independent agent / Course 16 corrected GitHub source review"
repository_reviewed_at: "2026-08-26T15:29:50Z"
repository_review_decision: "pass"
security_review_reviewer: "Codex + independent agent / Course 16 bounded source and security review"
security_reviewed_at: "2026-08-26T15:29:50Z"
security_review_decision: "pass"
rights_review_reviewer: "Codex + independent agent / Course 16 link-only rights boundary review"
rights_reviewed_at: "2026-08-26T15:29:50Z"
rights_review_decision: "pass"
platform_policy_review_reviewer: "Codex + independent agent / Course 16 no-production-write policy review"
platform_policy_reviewed_at: "2026-08-26T15:29:50Z"
platform_policy_review_decision: "pass"
offline_lab_reproduction_reviewer: "Independent read-only Course 16 runtime and offline-lab review"
offline_lab_reproduced_at: "2026-08-26T15:51:45Z"
offline_lab_reproduction_decision: "pass"
english_content_review_reviewer: "Codex + independent agent / Course 16 English content review"
english_content_reviewed_at: "2026-08-26T15:29:50Z"
english_content_review_decision: "pass"
simplified_chinese_content_review_reviewer: "Codex + independent agent / Course 16 Simplified Chinese content review"
simplified_chinese_content_reviewed_at: "2026-08-26T15:29:50Z"
simplified_chinese_content_review_decision: "pass"
build_reproducibility_review_reviewer: "Codex + independent agent / post-fix directory-root-VERCEL reproducibility audit"
build_reproducibility_reviewed_at: "2026-08-26T15:57:03Z"
build_reproducibility_review_decision: "pass"
independent_release_review_reviewer: "Independent read-only post-fix Course 16 v1.0.2 incremental audit"
independent_release_reviewed_at: "2026-08-26T15:51:45Z"
independent_release_review_decision: "pass"
release_decision: "pass"
blocking_findings: []
```

若未来接入真实模型、连接器、账号、用户数据、平台 API、第三方媒体或自动发布，必须重新生成依赖／模型／素材／人格与平台授权四账，复查当期安全公告和平台规则，并重新取得人工安全、权利与平台政策复核；本静态课程复核收据不能沿用为生产系统批准。
