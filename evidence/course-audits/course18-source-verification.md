# 第 18 门课《智能体赋能 K-12 和大学教学》一手来源核验报告

> 核验快照：2026-08-26（Asia/Taipei）  
> 核验对象：拟用于 aicourse.top 课程内容、实验与延伸阅读的官方 GitHub 仓库、可定位的 X 原帖，以及教育、教师监督和学生隐私的一手材料。  
> 结论边界：本报告核验“来源能否支持某项课程主张”，不把仓库星数、厂商宣传、X 热度或框架功能自动解释为教学成效、安全性或合规性。

## 一、执行结论

1. **可形成可信的课程技术主线。** OpenAI Agents SDK、Microsoft Agent Framework、LangGraph、CrewAI、Google ADK、MCP、Codex、Claude Code 与 Browser Use 都有可达且可确认官方身份的仓库或官方项目仓库。它们足以支持“如何编排工具、状态、交接、人工审批、追踪与浏览器操作”等技术教学。
2. **Swarm 与 AutoGen 不应被讲成当前首选。** [OpenAI Swarm](https://github.com/openai/swarm) README 明确将自身界定为实验性、教育性项目，并要求生产用途迁移到 Agents SDK；[Microsoft AutoGen](https://github.com/microsoft/autogen) README 明确处于维护模式，并将新用户引向 Microsoft Agent Framework。两者适合放进“演化史/迁移”附录。
3. **“仓库可实现”不等于“课堂有效”。** 这些仓库可以证明框架提供某种能力，却不能证明它会提高 K-12 或大学生的学习成绩、降低教师工作量、改善公平性，或比单智能体更好。美国 NCES/IES 2026 年官方综述指出，当前 AI 工具与学生结果之间的强因果证据仍极有限，[What Works Clearinghouse](https://nces.ed.gov/learn/blog/ai-k-12-education-good-bad-and-guardrails-consider) 检索也未发现符合条件的相关研究。因此课程必须把相关表述改写为“待本地试点检验的假设”。
4. **教师在环必须是课程架构，而不是免责声明。** 美国教育部的一手报告要求教师掌握重大教学决定并能检查、覆盖或停止 AI；因此评分、反馈发布、家长/学生沟通、资源推荐及任何写回教务系统的动作，都应有明确的人工审批点。
5. **未成年人数据必须默认不进入公开或个人开发账号。** 开源许可证只规定代码使用，不代表托管服务满足 COPPA、FERPA、地方隐私法或学校合同。课程实验应默认使用虚构、去标识或教师自建样例数据，并要求机构批准的账号、数据处理协议、保留/删除机制、访问控制与审计记录。
6. **X 原帖只能作为时间线证据。** 本次找到了 11 条能够由 X 官方 oEmbed 返回作者、日期和正文的原帖；但直接打开 `x.com` 在无登录或受限网络中常返回 403/空白。X 可证明“某官方账号在某日发布过某项消息”，不能独立证明成熟度、可靠性、当前价格、许可证、教育效果或安全性。
7. **课程编号冲突不影响本报告。** Course 18 与 sibling roadmap 中 “AI Python” 的编号冲突属于课程目录/路由治理问题；它不会改变下列来源的身份、可达性或可支持主张。发布前仍需由主课程清单确定唯一编号、slug 与导航位置。

## 二、核验方法与证据等级

- **GitHub 身份：**以仓库所属组织、仓库 README、许可证文件及 GitHub API 元数据交叉核对。活动日期使用公开元数据的 `pushed_at`，只代表仓库最近有推送，不代表已经发布稳定版本、完成安全审计或适合学校生产环境。
- **X 原帖：**除原帖 URL 外，用 X 官方 `publish.twitter.com/oembed` 回读作者、正文、发布时间和 canonical URL。直接网页不可见但 oEmbed 可回读时，标为“已核验、访问不稳定”；无法回读、只有截图或只有二手转述时，不纳入事实链。
- **教育与隐私：**优先使用政府、联合国机构与平台官方安全文档。美国材料只直接适用于其法域；面向其他地区发布时仍须进行当地法律、机构政策与供应商合同审查。
- **证据等级：**
  - **A—课程核心：**官方仓库/规范/政府文件，可直接支持具体而有限的课程主张。
  - **B—时间线或示例：**官方 X/厂商发布文，可证明发布事件或演示意图，不能承担效果和安全结论。
  - **C—排除：**厂商绝对化宣传、未定位截图、趋势摘要、猜测的 status ID、当前价格/免费额度等易漂移信息。

### 本次核验限制

- GitHub 匿名 API 在核对“latest release”时触发速率限制，因此本报告没有把“最新 release/tag”当成已核验事实；发布实验前应再锁定实际 tag 或 commit，并记录依赖锁文件。
- X 的网页呈现、账号 handle、帖子可见性和嵌入策略可能变化；课程页面不能只依赖 X 嵌入，应同时保留官方文档/仓库链接和一条不依赖 X 的文字说明。
- 本报告不构成法律意见，也没有对第三方云服务、MCP server、扩展或依赖做代码级安全审计。

## 三、GitHub 与官方技术来源核验

下列活动时间均为 2026-08-26（Asia/Taipei）核验时取得的 GitHub `pushed_at` UTC 快照；它们只表示最近推送，不表示稳定发布。

| 项目 | 官方身份与 URL 可达性 | 活动/项目状态 | 许可证核验 | 可由来源直接支持 | 不能由来源推出 |
|---|---|---|---|---|---|
| [OpenAI Agents SDK for Python](https://github.com/openai/openai-agents-python) | `openai` 官方组织；公开仓库可达 | 创建 2025-03-11；最近推送 2026-08-25；未归档 | MIT | 提供 agents、handoffs/agents-as-tools、guardrails、tracing、sessions 与 human-in-the-loop 等编排原语 | 不证明 agent 输出正确、守护栏消除风险、课堂学习更好或教师必然省时 |
| [OpenAI Swarm](https://github.com/openai/swarm) | `openai` 官方组织；公开仓库可达 | 创建 2024-02-22；最近推送 2026-04-15；未归档；README 明示实验/教育用途且已被 Agents SDK 取代 | MIT | 可讲轻量 handoff 与例程思想，以及其对 Agents SDK 的历史影响 | 不应称为当前生产首选；“未归档”不能覆盖 README 的迁移声明 |
| [OpenAI Codex CLI](https://github.com/openai/codex) | `openai` 官方组织；公开仓库可达 | 创建 2025-04-13；最近推送 2026-08-25；未归档 | Apache-2.0 | 可把 Codex CLI 描述为本地运行的开源编码 agent，并用于教师备课代码、测试或资料转换的受监督示例 | 不证明生成代码安全、无版权/依赖风险，亦不能把 2025 年云端 Codex “research preview”状态套到当前 CLI |
| [Claude Code](https://github.com/anthropics/claude-code) | `anthropics` 官方组织；公开仓库可达 | 创建 2025-02-22；最近推送 2026-08-25；未归档 | **非开源许可**：根许可证为 Anthropic 版权所有、使用受其商业条款约束 | 可证明该终端工具存在，并由官方文档支持权限确认、沙箱、MCP 与安全建议 | “公开 GitHub 仓库”不等于 MIT/Apache 开源，也不等于本地数据永不离开设备 |
| [Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol) | MCP 官方项目组织；旧 `modelcontextprotocol/specification` 路径会转向当前 canonical 仓库；公开可达 | 创建 2024-09-24；最近推送 `2026-08-26T00:02:23Z`；未归档 | **迁移型许可**：新代码/规范贡献为 Apache-2.0，文档（规范除外）为 CC BY 4.0，部分早期贡献仍为 MIT；应逐文件核对 | 可讲 MCP 是连接 AI 应用、工具与数据源的开放协议，以及客户端/服务器边界 | 不证明某个 MCP server 经过安全审核，亦不代表把它接入后就获得最小权限、隐私或正确性 |
| [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) | `microsoft` 官方组织；公开仓库可达 | 创建 2025-04-28；最近推送 2026-08-25；未归档 | MIT | 支持顺序、并发、handoff、group 等图式工作流，以及 checkpoint、streaming、HITL/time-travel 等框架能力 | README 自身提醒第三方系统风险和数据流审查；不能声称框架替使用者完成负责任 AI、安全或学校合规 |
| [Microsoft AutoGen](https://github.com/microsoft/autogen) | `microsoft` 官方组织；公开仓库可达 | 创建 2023-08-18；最近推送 2026-04-15；未归档；README 明示 Maintenance Mode | 代码 MIT；文档 CC BY 4.0，应区分 `LICENSE-CODE` 与文档许可 | 可用于多智能体框架史、旧系统迁移和概念比较 | 不应作为新课程项目的默认新栈；不能因仓库仍有推送就称其继续接收新功能 |
| [LangGraph](https://github.com/langchain-ai/langgraph) | `langchain-ai` 项目官方组织；公开仓库可达 | 创建 2023-08-09；最近推送 2026-08-24；未归档 | MIT | 可支持“面向长运行、有状态 agent 的低层编排”，以及 durable execution、状态检查/修改、memory 与 HITL | 不能证明低层图式编排比简单工作流更适合所有课程，也不能证明耐久执行等于业务正确性 |
| [CrewAI](https://github.com/crewAIInc/crewAI) | `crewAIInc` 项目公司官方组织；公开仓库可达 | 创建 2023-10-27；最近推送 2026-08-25；未归档 | MIT | 可讲 Crews 与事件驱动 Flows、任务委派、human review 等框架能力 | README 中“适合每种用例”“已证明有效”等营销措辞不能作为独立证据；AI feedback loop 也不能保证结果正确 |
| [Google Agent Development Kit—Python](https://github.com/google/adk-python) | `google` 官方组织；公开仓库可达 | 创建 2025-04-01；最近推送 `2026-08-26T00:49:02Z`；未归档；README 已以 ADK 2.0 为当前主线并提示与 1.x 的破坏性变化 | Apache-2.0 | 可支持 model/deployment-agnostic（同时针对 Gemini 优化）、graph runtime、多 agent、HITL 与工具确认等能力 | 不证明跨模型行为完全一致；2.0 破坏性变化意味着旧教程不能未经复测直接复用 |
| [Browser Use](https://github.com/browser-use/browser-use) | `browser-use` 项目官方组织；公开仓库可达，但不是 OpenAI/Google 等模型厂商仓库 | 创建 2024-10-31；最近推送 `2026-08-26T00:16:01Z`；未归档 | MIT | 可证明 agent 能在浏览器中打开页面、点击、输入、填表，并使用浏览器会话/配置文件 | 不能证明自动操作符合每个网站条款、可绕过所有 CAPTCHA、不会误提交或适合接触真实学生账号与教务系统 |

### 三个容易被课程文案写错的许可证结论

1. **Claude Code：**仓库公开不等于开源。应链接其 [LICENSE.md](https://github.com/anthropics/claude-code/blob/main/LICENSE.md)，并写“受 Anthropic 商业条款约束”，不能贴 MIT 标签。
2. **MCP：**不能把当前整个仓库简化成“MIT”。其 [LICENSE](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/LICENSE) 说明了 Apache-2.0、CC BY 4.0 与早期 MIT 内容的过渡边界。
3. **AutoGen：**GitHub 顶层许可证识别可能只显示文档的 CC BY 4.0；课程复制代码时还必须核对 [LICENSE-CODE](https://github.com/microsoft/autogen/blob/master/LICENSE-CODE)，并保留对应声明。

## 四、各技术来源适合承担的课程角色

### 4.1 OpenAI：Agents SDK、Swarm 与 Codex

- [Agents SDK 官方仓库](https://github.com/openai/openai-agents-python)与 [2025-03-11 官方发布说明](https://openai.com/index/new-tools-for-building-agents/)显示 OpenAI 将 Agents SDK 定位为 Swarm 思路的 production-ready 演进，并列出其编排原语；“production-ready”仍是厂商产品定位，不是独立的安全或学校部署认证。
- [Human-in-the-loop 文档](https://openai.github.io/openai-agents-python/human_in_the_loop/)支持在敏感工具调用前暂停、批准或拒绝；这可以转化为课程里的“教师批准后才发布反馈/写回系统”。
- [Tracing 文档](https://openai.github.io/openai-agents-python/tracing/)说明 tracing 默认可把追踪数据发送到 OpenAI 后端，并可关闭；零数据保留场景不能把 hosted tracing 当成理所当然。课程必须提醒教师不要把学生身份、成绩、健康/特殊教育信息写入 trace。
- Swarm 只适合作为简短迁移阅读。把它用于主实验会制造技术债，也会和官方 README 的替代说明冲突。
- Codex 可作为“教师开发助手”案例，例如为脱敏样例生成测试、重构 rubric parser；所有修改仍需差异检查、测试和人工合并。它不是“自动写出可靠教育软件”的证据。

### 4.2 Anthropic：MCP 与 Claude Code

- [Anthropic 2024-11-25 MCP 发布文](https://www.anthropic.com/news/model-context-protocol)支持“MCP 起源于 Anthropic 发起的开放标准，用统一方式连接 AI 应用与工具/数据”。后续 [MCP 捐赠与 Agentic AI Foundation 公告](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)支持其治理后来转入更广泛基金会，而不应继续讲成 Anthropic 私有协议。
- MCP 课程实验宜使用**本地、只读、虚构课程数据 server**，明确展示工具 schema、权限边界与错误处理。未经审计的公共 MCP server 不应接触学校云盘、邮件、学生名单或成绩。
- [Claude Code 安全文档](https://code.claude.com/docs/en/security)明确指出 prompt injection 风险且没有系统能够完全免疫；它建议仅使用可信 MCP server，并说明 Anthropic 目录不代表逐个 server 的安全审计。该事实可直接反驳“只要使用官方目录就安全”。
- [权限文档](https://code.claude.com/docs/en/permissions)支持默认受控授权、沙箱和细粒度工具规则；绕过权限的模式只应在隔离容器/虚拟机中演示，不能放到装有真实学校凭证的教师电脑。

### 4.3 Microsoft、LangGraph、CrewAI 与 Google ADK

- Microsoft Agent Framework 可作为企业治理/工作流比较阅读；AutoGen 则用于迁移史。课程若保留 AutoGen 代码，必须标注“legacy lab”，而非假装它仍是 Microsoft 对新用户的首选。
- LangGraph 适合讲显式状态、checkpoint、暂停/恢复和人工修改状态；这些能力能支持“可检查的教学流程”，但不自动带来教育有效性。
- CrewAI 适合对比 role/crew 与 event-driven flow。其官方 X 教程能证明团队展示过 AI feedback loop，不能证明迭代一定收敛到正确答案。
- Google ADK 可作为另一官方厂商框架示例；实验需锁定 2.x 版本，并在每次课程发布前运行回归测试，避免沿用 1.x API 的截图或代码。

### 4.4 Browser Use

- 只建议做**选修红队实验**：在教师拥有的沙箱账号里，让 agent 打开模拟 LMS、填写但不提交表单，并在最终提交前强制人工批准。
- 禁止用真实学生用户名、密码、cookie、单点登录会话或真实成绩做演示；禁止把“能操作网页”宣传为“能合法、可靠地操作任何网站”。
- 需要显式教授 prompt injection、网页恶意指令、误点击/误提交、不可逆操作、网站条款、反自动化机制和审计日志。代理/隐身/CAPTCHA 相关功能不应被包装成绕过平台控制的教学目标。

## 五、X 原帖核验与稳定性

**共同可达性结论：**下列原帖 URL 均能被 X 官方 oEmbed 在 2026-08-26 回读出账号、正文和日期；但直接匿名打开 `x.com` 在本核验环境常返回 403 或空白。因此其身份核验为“通过”，作为长期课程资源的稳定性为“中/低”。

| 原帖 | 官方 oEmbed 核验 | 原帖能够支持的有限主张 | 不可据此声称 |
|---|---|---|---|
| [OpenAI Developers：Agents 工具发布，2025-03-11](https://x.com/OpenAIDevs/status/1899531225468969240) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FOpenAIDevs%2Fstatus%2F1899531225468969240)返回作者 OpenAI Developers、正文与日期 | 当日官方宣布 Agents SDK 等 agent building tools | 已在学校验证、生产无风险或提升学习成效 |
| [OpenAI Developers：MCP 与 Agents SDK，2025-03-26](https://x.com/OpenAIDevs/status/1904957755829481737) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FOpenAIDevs%2Fstatus%2F1904957755829481737)通过 | 当时官方说明 Agents SDK 可连接 MCP server，并描述后续产品意图 | 帖中的未来计划今天全部兑现；当前行为仍须查现行文档 |
| [OpenAI Developers：Codex CLI，2025-04-16](https://x.com/OpenAIDevs/status/1912556874211422572) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FOpenAIDevs%2Fstatus%2F1912556874211422572)通过 | 当日将 Codex CLI 描述为开源、本地运行的 coding agent | 自然语言必然生成可工作的安全代码；同线程旧模型清单仍是当前支持矩阵 |
| [Anthropic：Claude Code，2025-02-24](https://x.com/AnthropicAI/status/1894095276740055364) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FAnthropicAI%2Fstatus%2F1894095276740055364)通过 | 当日推出 Claude Code，且当时状态是 limited research preview | 2025 的 preview 状态等于 2026 当前许可、价格或产品状态 |
| [Anthropic：Claude for Education，2025-04-02](https://x.com/AnthropicAI/status/1907474208348856438) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FAnthropicAI%2Fstatus%2F1907474208348856438)通过 | 官方宣布大学合作与 learning mode 的存在 | 合作本身已经证明学习增益、公平性或适合所有大学生 |
| [Anthropic：捐赠 MCP，2025-12-09](https://x.com/AnthropicAI/status/1998437922849350141) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FAnthropicAI%2Fstatus%2F1998437922849350141)通过 | 官方宣布把 MCP 捐赠给 Linux Foundation 体系下的 Agentic AI Foundation | 每个 MCP 实现都因开放治理而安全、兼容或受到基金会审核 |
| [Microsoft Azure：Agent Framework，2025-10-01](https://x.com/Azure/status/1973390614608642444) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FAzure%2Fstatus%2F1973390614608642444)通过 | 官方宣布 Microsoft Agent Framework 进入 Azure AI Foundry 叙事 | “build/observe/govern at scale”等营销语已经被独立评测证明 |
| [LangChain：LangChain/LangGraph 1.0，2025-10-22](https://x.com/LangChain/status/1981030195873333269) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FLangChain%2Fstatus%2F1981030195873333269)通过；输入旧 handle `LangChainAI` 时 canonical URL 返回 `LangChain` | 当日发布 Python/TypeScript 1.0，并将 LangGraph 定位为低层编排 | 旧 handle 永久有效；1.0 标签等于不会有破坏性变更或适合所有教学场景 |
| [Google Cloud Tech：ADK 演示，2025-04-16](https://x.com/GoogleCloudTech/status/1912583522696520083) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FGoogleCloudTech%2Fstatus%2F1912583522696520083)通过 | 官方账号当日演示开源 ADK 及多 agent 控制 | 演示证明跨模型一致性、可靠性或学校合规 |
| [CrewAI：Flows feedback loop，2024-11-13](https://x.com/crewAIInc/status/1856771939374624814) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FcrewAIInc%2Fstatus%2F1856771939374624814)通过 | 官方账号发布过迭代 feedback loop 教程 | agent 自我反馈能检测自己的所有错误或保证达到质量标准 |
| [Browser Use：云浏览器宣传，2026-04-09](https://x.com/browser_use/status/2042077879186698386) | [回读](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2Fbrowser_use%2Fstatus%2F2042077879186698386)通过 | 可证明官方账号当日做过该产品/额度宣传 | “free”“unlimited”等价格或额度在课程生命周期内持续有效；建议从核心材料排除 |

### 尚未找到或应排除的 X 证据

- 本轮没有定位到一条能稳定核验、且与 Anthropic 2024-11-25 MCP 首发完全对应的原始 X status。**不得猜测 status ID 或用截图补造引用**；MCP 首发应引用 [Anthropic 官方发布文](https://www.anthropic.com/news/model-context-protocol)与官方仓库。
- `x.com/i/trending/...` 或 Grok 生成的趋势摘要不是原帖，可能混入错误日期、账号或二手解释，应排除。
- 只有截图、只有账号主页、未展开的 `t.co`、第三方镜像、无法由 oEmbed 回读的删除/受保护帖子，均不能进入核心事实链。
- handle 更名不一定是假链接：例如 LangChain 的旧 handle 被 oEmbed 规范化为新 handle。报告或课程应保存 canonical URL、status ID、作者与核验日期。
- X 帖可以佐证“何时宣布”，不能取代 README、版本文档、许可证、安全文档或教育效果研究。

## 六、教育落地、教师监督与学生隐私的一手材料

**URL 与身份：**本节所列美国教育部/ERIC PDF、NCES/IES、UNESCO、FTC 与美国教育部 Student Privacy Policy Office 页面在 2026-08-26 均可通过公开 HTTPS 访问，无需机构登录；前两份 PDF 的稳定文献标识分别为 `ED631097` 与 `ED661949`。它们属于发布机构的一手页面或官方文献托管，不是商业博客转载。

### 6.1 教师监督与教学决策

1. [美国教育部 2023《Artificial Intelligence and the Future of Teaching and Learning》](https://files.eric.ed.gov/fulltext/ED631097.pdf)（重点见 PDF 页 20、56–57）明确要求把人置于回路中，教师应继续掌握重大教学决定；报告还讨论教师监看学生使用聊天机器人的方式、发现 AI 教案缺陷、避免过度信任，以及系统应可检查、可解释、可覆盖和可停止。  
   **课程可支持主张：**agent 应增强教师判断，而非替代教师；重要决定需要人工审批和覆盖机制。  
   **不能支持：**只要设置一个“确认”按钮就已解决偏差、准确性、责任归属和可访问性问题。
2. [美国教育部 2024《Designing for Education with Artificial Intelligence》开发者指南](https://files.eric.ed.gov/fulltext/ED661949.pdf)覆盖 K-12、高等教育与非正式学习，强调安全、信任、隐私、公民权利、学习结果证据和师生反馈。文件本身是非监管指南。  
   **课程可支持主张：**应在开发生命周期中收集教育者/学生反馈，并用真实学习指标评估。  
   **不能支持：**遵循该指南自动等于满足法律或采购合规。
3. [NCES/IES 2026 官方综述](https://nces.ed.gov/learn/blog/ai-k-12-education-good-bad-and-guardrails-consider)指出当前强因果研究极少，且接触 AI 并不足以产生学习收益；AI 应支持而不是取代教师专业能力和学生思考。  
   **课程文案要求：**“提升成绩”“减少 X% 备课时间”“自动个性化有效”等句子，除非有明确研究或本地预注册试点数据，否则必须写成待验证假设。

### 6.2 年龄、隐私与学校授权

1. [UNESCO《Guidance for generative AI in education and research》官方页](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)（2023-09-07 发布，页面 2026-01-16 更新）要求人本、数据隐私、年龄适切验证，并建议为与生成式 AI 的独立对话设定年龄限制。  
   **重要限定：**文件讨论 13 岁门槛与家长许可的语境，但这不是全球统一授权年龄；供应商条款、国家/地区法律和学校政策可以更严格。
2. [FTC 2025 COPPA 最终修订](https://www.ftc.gov/legal-library/browse/federal-register-notices/16-cfr-part-312-coppa-final-rule-amendments)及其[官方说明](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data)强化了针对定向广告的单独选择加入同意、数据保留限制，并扩展部分个人信息类型。COPPA 的核心覆盖包括面向 13 岁以下儿童的在线服务，以及实际知情其正在收集 13 岁以下儿童个人信息的运营者。  
   **重要限定：**最终规则没有采纳拟议中的全部教育科技/学校授权修改；课程不能把提案内容错写成现行规则。
3. [FTC COPPA FAQ—学校部分](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)说明学校代为同意只限教育场景、为学校之使用与利益，且不得用于其他商业目的；如果运营方要作商业使用，仍需家长同意。[FTC 2022 教育科技政策声明](https://www.ftc.gov/news-events/news/press-releases/2022/05/ftc-crack-down-companies-illegally-surveil-children-learning-online)还强调不能强制收集超出合理必要范围的数据、不得将学生数据另作营销用途、不得无限期保留，并须维护机密性、安全性和完整性。
4. [美国教育部 FERPA—school official 例外 FAQ](https://studentprivacy.ed.gov/faq/who-school-official-under-ferpa)要求外部服务承担学校原本会使用人员完成的机构职能，受学校对教育记录使用与维护的直接控制，且服从目的限制与禁止再披露等条件。[FERPA 官方总页](https://studentprivacy.ed.gov/content/family-educational-rights-and-privacy-act)说明其适用范围是接受美国教育部资金的教育机构。  
   **重要限定：**FERPA 不仅涉及 K-12，也涉及符合范围的高等教育机构；但它不是全球通用法律。

### 6.3 课程必须落实的最低控制

- **数据最小化：**默认使用虚构、合成或充分去标识数据；公开/个人开发账号中不输入姓名、学号、联系方式、成绩、残障/健康资料、IEP、行为记录、家庭信息或可重识别的自由文本。
- **账号与合同：**只在学校/大学批准的租户中使用真实教学数据；上线前核对供应商年龄条款、DPA、数据用途、模型训练选择、子处理者、保存/删除、导出、数据驻留和事件通知。
- **权限与审批：**读取与写入分权；默认只读；发布成绩/反馈、发送消息、修改课程或记录、购买/注册、提交网页表单前必须由教师明确批准。
- **可追踪与可撤销：**保存必要且经脱敏的操作日志、提示版本、工具调用、人工批准者和产物版本；为错误反馈提供撤回、更正与申诉渠道。
- **安全隔离：**MCP server、浏览器 agent 和代码 agent 使用最小权限、单独测试账号、allowlist 域名、秘密管理与沙箱；把网页、文档和工具输出都视作可能含 prompt injection 的不可信输入。
- **未成年人参与：**没有完成地区法律、机构政策、家长/监护人通知或同意及厂商年龄资格核验之前，不创建学生直连 agent 账号；低龄学生优先采用教师中介、全班投影或离线样例。
- **效果评估：**先定义学习目标、教师工作量、错误率、公平性与可访问性指标，再做小规模试点；保留无 agent 对照或基线，不以满意度、演示成功或单次案例代替学习证据。

## 七、可发布与不可发布的课程主张

### 可发布，但必须保持限定语

- “Agents SDK、Microsoft Agent Framework、LangGraph、CrewAI 与 Google ADK 提供不同的 agent/workflow 编排原语。”
- “部分框架提供人工暂停/审批、追踪、checkpoint 或状态检查能力；具体能力按各仓库和版本说明。”
- “MCP 是连接 AI 应用与工具/数据源的开放协议；接入的每个 server 仍需单独做权限、安全和隐私评估。”
- “Codex CLI 和 Claude Code 可以在教师监督下帮助完成编码或资料处理任务；产物仍需人工审查和测试。”
- “Browser Use 能自动执行部分网页交互；课程只在沙箱中演示，并在所有有后果的动作前进行人工审批。”
- “教育领域需要 human-in-the-loop，教师保留重大教学决定权；学生数据处理须满足适用法律、学校政策和合同。”

### 不可发布，除非补充独立证据或本地试点数据

- “智能体已经被证明能提高 K-12/大学学习成绩。”
- “智能体能稳定减少教师 X% 工作量。”
- “多智能体一定比单智能体准确/公平/有效。”
- “自动评分已经足以替代教师复核。”
- “有 guardrail/HITL/tracing 就不会出错或泄露数据。”
- “开源框架天然免费、私密、可在学校合规使用。”
- “官方/目录中的 MCP server 已经过安全审计。”
- “任何年龄的学生都能直接注册和独立使用这些 agent。”
- “X 上的官方演示、点赞量或仓库星数证明产品成熟或教育有效。”
- “当前模型列表、免费额度、无限用量或价格会持续整个课程周期。”

## 八、建议的课程来源使用顺序

为避免变成“框架动物园”，第 18 门课应先教一个可审计的、供应商中立的流程，再做少量框架映射：

1. **核心概念：**目标 → 工具权限 → 状态 → 证据 → 人工审批 → 记录 → 评估。
2. **主实验：**选一个当前框架（例如 Agents SDK、LangGraph 或 ADK）完成“教师生成草稿—核对来源—教师批准—发布到模拟系统”的闭环。
3. **协议实验：**用本地只读 MCP server 访问虚构课程资料，故意加入恶意文档，展示 prompt injection 与 allowlist。
4. **比较阅读：**Microsoft Agent Framework、CrewAI 和另一主流框架只比较状态、handoff、checkpoint、HITL 和 tracing 的映射，不要求学生重复实现同一项目五次。
5. **教师工具：**Codex/Claude Code 只处理脱敏样例，并用测试和 diff 验收。
6. **选修红队：**Browser Use 在模拟 LMS 中运行，不连接真实学校系统。
7. **历史附录：**Swarm 与 AutoGen 的演化、迁移及为什么课程不再将其设为默认。

## 九、发布前来源验收清单

- [ ] 每个技术事实都链接到官方仓库、规范或当前官方文档；X 只做补充时间线。
- [ ] 代码实验锁定 tag/commit 和依赖锁文件，记录复测日期；不直接依赖随时变化的 `main`。
- [ ] 每条 X 引用保存 status ID、作者、日期、canonical URL 与一条非 X 的官方替代来源。
- [ ] 删除“提高成绩、节省时间、保证安全、适合所有学生”等未有独立证据的绝对化文案。
- [ ] 教师批准点在代码/交互中真实存在，不能只写在伦理说明里。
- [ ] 全部演示数据通过 PII/教育记录检查；trace、日志、截图和错误报告也纳入检查。
- [ ] 对 K-12 和高等教育分别核对年龄、账号、FERPA/COPPA 或当地法律、机构政策与供应商合同。
- [ ] 对每个第三方 MCP server、浏览器扩展与云服务单独做权限和数据流审查。
- [ ] 课程把“框架功能”“厂商自述”“独立教育证据”“本地试点结果”以不同标签呈现。
- [ ] 发布目录已解决 Course 18 与 sibling roadmap “AI Python”的编号/slug 冲突；该目录修复不应被误写为来源核验问题。

## 十、核验后的推荐来源集合

### A 级：课程核心

- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python)、[HITL](https://openai.github.io/openai-agents-python/human_in_the_loop/)、[Tracing](https://openai.github.io/openai-agents-python/tracing/)
- [OpenAI Codex CLI](https://github.com/openai/codex)
- [MCP canonical repository](https://github.com/modelcontextprotocol/modelcontextprotocol)、[Anthropic MCP launch](https://www.anthropic.com/news/model-context-protocol)
- [Claude Code repository](https://github.com/anthropics/claude-code)、[Security](https://code.claude.com/docs/en/security)、[Permissions](https://code.claude.com/docs/en/permissions)
- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)
- [LangGraph](https://github.com/langchain-ai/langgraph)
- [CrewAI](https://github.com/crewAIInc/crewAI)
- [Google ADK for Python](https://github.com/google/adk-python)
- [Browser Use](https://github.com/browser-use/browser-use)
- [U.S. Department of Education 2023 report](https://files.eric.ed.gov/fulltext/ED631097.pdf)
- [U.S. Department of Education 2024 developer guide](https://files.eric.ed.gov/fulltext/ED661949.pdf)
- [NCES/IES 2026 evidence review](https://nces.ed.gov/learn/blog/ai-k-12-education-good-bad-and-guardrails-consider)
- [UNESCO generative AI guidance](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)
- [FTC COPPA resources](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [FERPA official resources](https://studentprivacy.ed.gov/content/family-educational-rights-and-privacy-act)

### B 级：时间线/背景

- 本报告第五节中经 oEmbed 核验的官方 X 原帖。
- [OpenAI Swarm](https://github.com/openai/swarm)和 [Microsoft AutoGen](https://github.com/microsoft/autogen)仅作历史与迁移材料。

### C 级：不进入核心事实链

- 未定位原帖的截图、Grok/趋势摘要、第三方镜像与猜测的 X status ID。
- stars、点赞、转发、供应商客户数、厂商“适合所有场景/production-ready”式措辞。
- 未固定日期的价格、免费额度、模型清单和“无限”用量。
- 没有设计、样本、对照、指标和数据的一般性教育成效陈述。

---

**最终核验意见：**这些一手来源足以支撑一门高质量的“技术能力 + 教师监督 + 隐私安全 + 证据边界”课程；它们不足以支撑“智能体已被证明普遍改善 K-12 或大学教学”的宣传。课程达到世界级可信度的关键，不是堆叠更多框架或 X 帖，而是把每一项能力、风险、教育假设和合规要求分别绑定到能真正支持它的一手证据，并在真实教学前通过受控试点验证。
