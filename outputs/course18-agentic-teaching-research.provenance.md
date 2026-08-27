# 第 18 门课研究来源与主张溯源台账

> 对应文件：`course18-agentic-teaching-research.md`  
> 检索/核验日期：2026-08-26（Asia/Taipei）  
> 研究范围：教育智能体架构、工具调用、MCP、browser/computer use、多智能体、evals/observability、K-12 与大学工作流、隐私、未成年人和教师监督。  
> 核心来源约束：GitHub 固定提交与 X 原帖是技术/生态主轴；论文只支持其具体研究设计下的结果；官方治理材料支持规范性边界。

## 1. 台账规则

### 1.1 证据对象

- **GitHub**：同时记录滚动项目页与本次核验时的 `HEAD` SHA。课程中的源码截图、文件路径和接口说明应链接固定 SHA，项目状态入口保留滚动链接。
- **X**：链接原帖；作者、帖文和日期通过 X/Twitter 官方 oEmbed 展示内容核对。帖子只作为发布/作者主张，绝不作为学习效果证据。
- **论文**：优先期刊/机构全文或 arXiv 原始记录，并明确版本、样本、处理、结果和外推边界。
- **治理**：记录发布/更新日期和发布机构；作为政策/权利框架，不冒充本地法律意见。

### 1.2 证据强度

| 代码 | 定义 |
|---|---|
| A-E | 同行评审的现场实验；因果解释仅限研究设计和结果变量 |
| A-N | 官方规范、法律文本或国际组织治理材料；支持规范内容，不支持效果 |
| B-E | 工作论文/预印本现场实验；预注册与随机化等设计特征另列，结果仍待同行评审或进一步复现 |
| C-T | 官方/维护者代码与技术文档；支持能力、接口和已知风险 |
| D-S | 官方/作者社交帖；支持发布时间和发布者主张 |

### 1.3 转换规则

对每个来源，只进行以下转换：

1. 精确摘要，不长段复制；
2. 数字与具体版本绑定；
3. 技术能力、实证结果、推断和课程建议分开；
4. stars/forks/下载量不进入效果主张；
5. 许可只说明再利用边界，不代表安全或有效；
6. 发布日当天重新检查滚动状态。

## 2. 16 个来源包的逐项记录

### S01 — OpenAI Agents SDK for Python

- **标题/组织**：OpenAI Agents SDK for Python；OpenAI。
- **类型/强度**：官方开源仓库与官方文档；C-T。
- **项目页**：<https://github.com/openai/openai-agents-python>
- **核验固定提交**：`5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec`
- **固定入口**：<https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/README.md>
- **固定主张文档**：
  - Human-in-the-loop：<https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/docs/human_in_the_loop.md>
  - Tracing：<https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/docs/tracing.md>
  - Guardrails：<https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/docs/guardrails.md>
  - Testing：<https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/docs/testing.md>
- **日期/状态**：公开、活跃；本次状态核验于 2026-08-26。课程主张绑定上述固定提交；发布前仍应检查当前 API 漂移。
- **明确支持的事实**：
  1. SDK 提供 agents、tools、guardrails、handoffs、runner、tracing、HITL 和测试工具。
  2. tracing 记录模型生成、工具调用、handoff、guardrail 与自定义事件；默认启用。
  3. `trace_include_sensitive_data` 默认值为 `True`；generation/function span 可能含输入输出。
  4. HITL 可为敏感工具调用暂停运行、展示 interruption、批准/拒绝后恢复；审批可跨 handoff/嵌套 agent 在外层 run 呈现。
  5. 测试工具可在内存中、无真实模型/网络请求地验证 SDK/应用拥有的编排；外部模型、网络和沙箱仍需集成环境。
- **不支持的主张**：不证明任何教学工作流有效、安全或合规；不证明 tracing 等于 eval。
- **许可/再利用**：仓库 MIT；课程可引用和演示，但仍需保留许可/署名并避免复制商标。动态文档以链接和短摘要为主。
- **用于课程**：M1、M2、M10、M11、M12；主张 C01、C06、C09、C11。
- **主要风险**：SDK/API 漂移；追踪敏感数据；暂停状态序列化可能携带上下文和工具参数。

### S02 — Model Context Protocol 核心规范

- **标题/组织**：Model Context Protocol specification and documentation；Model Context Protocol / LF Projects 生态。
- **类型/强度**：官方协议规范、安全策略；A-N/C-T。
- **项目页**：<https://github.com/modelcontextprotocol/modelcontextprotocol>
- **核验固定提交**：`57ac4a2ec742e0cb7622d899b0f5d3bcf769fd69`
- **固定架构页**：<https://github.com/modelcontextprotocol/modelcontextprotocol/blob/57ac4a2ec742e0cb7622d899b0f5d3bcf769fd69/docs/specification/2026-07-28/architecture/index.mdx>
- **固定 Streamable HTTP 页**：<https://github.com/modelcontextprotocol/modelcontextprotocol/blob/57ac4a2ec742e0cb7622d899b0f5d3bcf769fd69/docs/specification/2026-07-28/basic/transports/streamable-http.mdx>
- **固定安全策略**：<https://github.com/modelcontextprotocol/modelcontextprotocol/blob/57ac4a2ec742e0cb7622d899b0f5d3bcf769fd69/SECURITY.md>
- **协议版本**：课程采用 `2026-07-28`，不是旧版教程中的默认语义。
- **明确支持的事实**：
  1. MCP 是 stateless client-host-server 协议；host 可运行多个 client，每个 client 与一个 server 形成 1:1 关系。
  2. server 暴露 resources、tools、prompts；host 负责复杂编排、连接权限、生命周期、安全政策、同意、授权和上下文聚合。
  3. 设计原则要求 server 仅接收必要上下文，不能读取完整对话或其他 server；host 控制跨 server 交互。
  4. client 信任所连接的 server；本地 server 像其他已安装软件一样受信任并拥有执行环境可用资源；STDIO transport 不是沙箱。
  5. LLM 可能以用户未逐字要求的方式调用已暴露工具；应用和运营方必须实施最小权限、展示、同意和沙箱。
- **不支持的主张**：MCP 不自动提供课程标准、教学策略、正确性、安全性或合规性；不是教学法，也不是完整任务编排器。
- **许可/再利用**：本次仓库处于许可迁移：新代码/规范贡献为 Apache-2.0；未取得重许可同意的旧贡献仍为 MIT；非规范文档为 CC-BY-4.0。课程只链接和摘要，复制时逐文件核验。
- **用于课程**：M3、M10、M12；主张 C02、C03、C09、C10。
- **主要风险**：协议和安全要求快速变化；错误配置 server、过宽权限和远程 transport 会扩大数据与动作面。

### S03 — Anthropic Computer Use Demo

- **标题/组织**：Anthropic Computer Use Demo；Anthropic。
- **类型/强度**：官方 quickstart/最小参考实现；C-T。
- **仓库**：<https://github.com/anthropics/claude-quickstarts>
- **核验固定提交**：`3313e9716fb5b977248bcd06cb0cc86a8c547b9b`
- **固定目录**：<https://github.com/anthropics/claude-quickstarts/tree/3313e9716fb5b977248bcd06cb0cc86a8c547b9b/computer-use-demo>
- **明确支持的事实**：
  1. 项目是容器化的最小 computer-use agent loop 参考，并非生产架构。
  2. 文档明确称 computer use 为 beta，并提醒互联网环境风险更高。
  3. 推荐专用 VM/容器、最小权限、不提供敏感登录数据、域白名单，以及对现实后果和需要肯定同意的动作进行人工确认。
  4. 网页/图像中的指令可能影响模型、造成提示注入；文档建议隔离敏感数据和动作。
  5. 项目还指出弱组件隔离、单会话和重启/重置限制，并把轨迹记录列为生产可靠性模式之一。
- **不支持的主张**：不证明在 LMS、SIS、邮件、浏览器登录或学生数据环境中安全可靠。
- **许可/再利用**：仓库采用 MIT；课程链接固定目录并以摘要/自写示例为主。
- **用于课程**：M4、M12；主张 C04、C10。
- **主要风险**：提示注入、凭据泄露、误点击、现实副作用、UI 漂移、demo 与生产差距。

### S04 — Browser Use

- **标题/组织**：Browser Use；Browser Use 维护团队。
- **类型/强度**：社区维护开源项目与维护者文档；C-T。
- **项目页**：<https://github.com/browser-use/browser-use>
- **核验固定提交**：`9a2db2d2db42c6f68a871f011b3b25fdcaa71847`
- **固定 README**：<https://github.com/browser-use/browser-use/blob/9a2db2d2db42c6f68a871f011b3b25fdcaa71847/README.md>
- **固定子智能体指南**：<https://github.com/browser-use/browser-use/blob/9a2db2d2db42c6f68a871f011b3b25fdcaa71847/skills/cloud/references/guides/subagent.md>
- **明确支持的事实**：
  1. CLI/库可 open、检查 state、click、type/input、upload 和 screenshot，并保持浏览器会话。
  2. 可连接真实 Chrome profile、已有登录与 cookies。
  3. subagent 文档建议在“自包含、task-in/result-out、不需要逐步控制”的网页任务使用黑盒委派。
- **不支持的主张**：不证明自主浏览适合学生数据、高风险提交或任何教学成效。
- **许可/再利用**：仓库 MIT；项目同时提供商业 cloud，开源代码与托管服务条款要分开。
- **用于课程**：M4、M12；主张 C04、C10。
- **主要风险**：真实 profile 暴露凭据和历史；黑盒缺少逐动作控制；页面漂移、CAPTCHA/反自动化、注入和误提交。

### S05 — Google Agent Development Kit for Python

- **标题/组织**：Agent Development Kit (ADK) for Python；Google。
- **类型/强度**：官方开源框架、样例与文档；C-T。
- **项目页**：<https://github.com/google/adk-python>
- **核验固定提交**：`ef2d68080a05f2fc3e00634c4f6c4d3d43c2a7f1`
- **固定 README**：<https://github.com/google/adk-python/blob/ef2d68080a05f2fc3e00634c4f6c4d3d43c2a7f1/README.md>
- **固定 workflow triage 样例**：<https://github.com/google/adk-python/blob/ef2d68080a05f2fc3e00634c4f6c4d3d43c2a7f1/contributing/samples/patterns/workflow_triage/README.md>
- **动态评测指南**：<https://adk.dev/evaluate/>
- **明确支持的事实**：
  1. ADK 支持 coordinator/sub_agents、多智能体、开发 UI、构建/评测/部署。
  2. workflow triage 样例由执行经理、顺序计划执行和并行专业 worker 组成；意图不清时先澄清；通过状态键汇总结果。
  3. 官方评测指南把结构化 eval、trace、工具调用、回答质量和边缘案例纳入生命周期。
- **不支持的主张**：样例不证明并行或更多智能体提升教学质量；trace 不自动是有效评分器。
- **许可/再利用**：Apache-2.0；注意模型和云服务另有条款。
- **用于课程**：M9、M10、M12；主张 C05、C09、C12。
- **主要风险**：供应商/模型依赖；协调器错误、状态污染、并行成本、评分器偏差。

### S06 — Oak Open Curriculum Ecosystem

- **标题/组织**：Oak Open Curriculum Ecosystem；Oak National Academy。
- **类型/强度**：官方教育机构开源课程基础设施；C-T。
- **项目页**：<https://github.com/oaknational/oak-open-curriculum-ecosystem>
- **核验固定提交**：`1173c1adf252eab2dbe7d95f2494139f51504243`
- **固定 README**：<https://github.com/oaknational/oak-open-curriculum-ecosystem/blob/1173c1adf252eab2dbe7d95f2494139f51504243/README.md>
- **日期/状态**：README 标明 Public Beta；任何人可创建 Oak 账号连接，无需 invitation 或 allowlist；本次核验 2026-08-26。
- **明确支持的事实**：
  1. 项目提供课程 API 的类型安全 SDK、MCP server/app、混合语义搜索、图工具和教育证据表面。
  2. MCP primitives 包含 curriculum tools、resources 和教师工作流 prompts，可检索 lessons、units、threads、sequences、quizzes、transcripts、先备知识与误概念图。
  3. 项目以英格兰国家课程及 Oak 课程为主要结构背景。
- **不支持的主张**：连接经组织整理的课程数据不证明自动生成内容准确、适龄、适合本地课程或有效。
- **许可/再利用**：代码 MIT；Oak curriculum API/data 为 OGL v3.0；ontology data OGL v3.0、代码 MIT；EEF 内容要求署名；Oak 品牌另受保护。逐资产处理，不能用根许可证覆盖一切。
- **用于课程**：M3、M5、M12；主张 C03、C08。
- **主要风险**：public-beta 可用性与接口漂移、地区课程差异、上游数据/许可差异、检索错误、把 evidence surface 当成具体课堂效果保证。

### S07 — Tutor CoPilot

- **标题/作者**：Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise；Rose E. Wang、Ana T. Ribeiro、Carly D. Robinson、Susanna Loeb、Dorottya/Dora Demszky。
- **类型/强度**：预注册、导师层随机的现场实验工作论文 + demo 代码；B-E/C-T。预注册与随机化提高设计可检查性，但不改变其尚未同行评审的出版状态。
- **代码项目**：<https://github.com/rosewang2008/tutor-copilot/>
- **核验固定提交**：`25c6eab7e416614f2033358bceddd30a4d5ca616`
- **固定 README**：<https://github.com/rosewang2008/tutor-copilot/blob/25c6eab7e416614f2033358bceddd30a4d5ca616/README.md>
- **采用的结果版本**：2025-11 修订工作论文：<https://scale.stanford.edu/sites/default/files/ai24_1054_v2.pdf>
- **arXiv v2**：<https://arxiv.org/abs/2410.03017>（2025-01-26 修订）
- **机构项目页**：<https://scale.stanford.edu/ai/repository/tutor-copilot-human-ai-approach-scaling-real-time-expertise>
- **明确支持的事实（以 2025-11 版本为数字锚）**：
  1. 现场随机试验包含 700+ tutors 和 1,000+ students（正文报告 `n=783` tutors），来自低收入家庭学生所在的美国南部学区数学虚拟辅导。
  2. treatment 是导师可调用的建议系统；学生并不直接面对该界面；系统提供多个策略，导师可选择、编辑或重生成。
  3. 以导师为随机化单位的 ITT 结果显示，获得 Tutor CoPilot 访问权限的导师所教学生，无条件 exit-ticket 通过率由 62% 升至 66%（+4 个百分点）；低评分导师层由 56% 升至 65%（+9 个百分点）。这不是实际使用某条建议这一机制的独立因果效果。
  4. 系统增加 probing questions、减少 generic praise；文档也报告过年级语言不适切问题。
  5. 架构图说明自动去标识姓名并减少发送到外部模型的信息。
- **版本警告**：arXiv/repo 摘要写 900 tutors、1,800 K-12 students 和 550k+ messages；2025-11 修订版写 700+ tutors、1,000+ students 和 350k+ messages。课程数字必须和明确版本绑定；本简报采用修订工作论文版本。
- **不支持的主张**：不支持“AI 独立导师有效”“所有 K-12/所有学科同样增益”“低成本估算可直接复制到其他机构”。论文的全年标准化考试估算不是该研究设计直接识别的结果，课程不将其写作因果效果。
- **许可/再利用**：demo 仓库 Apache-2.0；论文以引用/链接使用，遵循论文页面许可。
- **用于课程**：M6、M8、M11、M12；主张 C07、C11、C13。
- **主要风险**：年级适切性、版本差异、外推、导师采纳偏差、学生数据和供应商依赖。

### S08 — OpenMAIC

- **标题/组织**：Open Multi-Agent Interactive Classroom；THU-MAIC。
- **类型/强度**：维护者开源系统 + 论文；C-T（架构），论文结果需逐项另审。
- **项目页**：<https://github.com/THU-MAIC/OpenMAIC>
- **核验固定提交**：`4a9f906a1378a51b84e020828cf8af25bb5d8a2d`
- **固定 README**：<https://github.com/THU-MAIC/OpenMAIC/blob/4a9f906a1378a51b84e020828cf8af25bb5d8a2d/README.md>
- **论文 DOI**：<https://doi.org/10.1007/s11390-025-6000-0>
- **明确支持的事实**：
  1. 仓库将 topic/document 转为 slides、quizzes、interactive simulations 和 PBL 场景。
  2. 系统以 AI teacher/peers 的多角色课堂呈现，并包含 LangGraph 多智能体编排目录。
  3. 固定提交 README 根许可证为 MIT，并列出第三方包的独立条款。
- **不支持的主张**：一键生成、实时评分、多角色体验和 repo popularity 都不证明内容正确、学习增益或安全；不能把产品功能表当 RCT。
- **许可/再利用**：固定提交根许可证 MIT；`packages/mathml2omml` 为 LGPL-3.0-or-later，`packages/pptxgenjs` 保留其 MIT 条款。早期版本曾显示不同许可，因此必须使用固定版本。
- **用于课程**：M9、M12；主张 C05、C12、C14。
- **主要风险**：自动生成内容、实时评分、角色拟人化、复杂供应链、多模型成本、许可证漂移。

### S09 — Generative AI without guardrails can harm learning

- **标题/作者**：Generative AI without guardrails can harm learning: Evidence from high school mathematics；Hamsa Bastani、Osbert Bastani、Alp Sungu、Haosen Ge、Özge Kabakcı、Rei Mariman。
- **类型/强度**：同行评审现场 RCT + 数据/分析代码；A-E/C-T。
- **期刊/日期**：PNAS 122(26)，2025-06-25；DOI <https://doi.org/10.1073/pnas.2422633122>。作者单位勘误于 2025-08-20 在线发表，PNAS 122(34)，e2518204122；DOI <https://doi.org/10.1073/pnas.2518204122>。
- **开放全文**：<https://pmc.ncbi.nlm.nih.gov/articles/PMC12232635/>
- **勘误全文**：<https://pmc.ncbi.nlm.nih.gov/articles/PMC12403119/>；只更正 Osbert Bastani 的作者单位，不涉及研究设计、数据、分析或结果。
- **代码/匿名数据**：<https://github.com/obastani/GenAICanHarmLearning>
- **核验固定提交**：`2f63dae1a01d51453826fe07ef5cf6678e339588`
- **固定仓库**：<https://github.com/obastani/GenAICanHarmLearning/tree/2f63dae1a01d51453826fe07ef5cf6678e339588>
- **明确支持的事实**：
  1. 研究在土耳其一所高中开展 4 次 90 分钟课节，覆盖约 50 个九至十一年级班级、接近 1,000 名数学学生，比较 GPT Base、教师参与设计的 GPT Tutor 和无 AI 对照。
  2. 处理在班级层分配；论文明确把班级称为随机化单位并按班级聚类标准误。班级通过匹配可观测特征且满足排课约束的整数规划分组；常规班学生原先由学校随机分班，荣誉班因非随机分班而从主样本排除。
  3. 有 AI 时，GPT Base/GPT Tutor 的练习表现相对对照分别高 48%/127%。
  4. 移除 AI 后的考试中，GPT Base 组比对照低 17%；采用教师输入与提示护栏的 GPT Tutor 组大幅缓解了负效应，但没有观察到正向效果。
  5. 交互分析显示 GPT Base 更容易成为直接复制答案的“拐杖”，GPT Tutor 采用教师设计的学习护栏和提示。
- **不支持的主张**：不支持所有生成式 AI 一定伤害学习；不支持 17% 外推到其他学科、国家、年龄、模型或长期结果；不支持 GPT Tutor 已证明提高独立考试成绩。
- **许可/再利用**：论文开放全文；仓库本次未把明确根许可证作为课程可复制授权依据，因此只链接、运行允许的公开分析并引用，不复制再发布数据/代码，除非再次法律核验。
- **用于课程**：M1、M6、M10、M12；主张 C06、C08、C13。
- **主要风险**：把班级层随机误写成学生个体随机、把练习表现误写为学习、反向混淆两个 treatment 的百分比、过度外推、忽略特定模型/学校。

### S10 — Harvard 高等教育 AI 导师 RCT

- **标题/作者**：AI tutoring outperforms in-class active learning: an RCT introducing a novel research-based design in an authentic educational setting；Greg Kestin、Kelly Miller、Anna Klales、Timothy Milbourne、Gregorio Ponti。
- **类型/强度**：同行评审交叉随机实验；A-E。
- **期刊/日期**：Scientific Reports 15, 17458；2025-06-03。
- **原文**：<https://www.nature.com/articles/s41598-025-97652-6>
- **数据入口**：<https://github.com/HarvardAItutor/Study-Data-v4>
- **明确支持的事实**：
  1. 哈佛本科生命科学物理课交叉设计；233 人注册，194 人符合研究纳入条件。
  2. 学生各经历一次 AI 条件和一次课堂 active-learning 条件；原有 2–3 人 peer group 是随机化单位；内容相同，使用前后测。
  3. AI 组短期学习增益更高；AI 平台实测中位任务时间为 49 分钟，课堂学习时间按研究设计假定为 60 分钟。学生自报投入与动机更高；享受程度与成长型思维无显著差异。
  4. 系统明确设计了 active learning、cognitive load、growth mindset、scaffolding、accuracy、targeted/timely feedback 和 self-pacing。
- **不支持的主张**：不支持普遍“AI 比教师/课堂好”；研究不是长期、多学科、多机构或大规模自治系统测试；主观体验不能替代学习结果。
- **许可/再利用**：开放获取文章，遵循页面许可和署名；课程摘要与链接，不大段复制。
- **用于课程**：M7、M10、M12；主张 C08、C13。
- **主要风险**：标题式过度推广、短期后测、单课单校、定制系统、交叉设计解释。

### S11 — AI Assistance for Discretionary Work

- **标题/作者**：AI Assistance for Discretionary Work: Increasing Feedback Provision in Higher Education；Romina Mahinpei、Victoria Dean、Ruth Fong、Lydia T. Liu、Manoel Horta Ribeiro。
- **类型/强度**：随机现场实验 + 访谈的预印本与代码；B-E/C-T。
- **arXiv/日期**：<https://arxiv.org/abs/2606.03095>；v1，2026-06-02。
- **代码**：<https://github.com/humans-and-machines/ai-feedback-provision>
- **核验固定提交**：`e4613f58a71777e29f8c2a4310db90d108f24557`
- **固定仓库**：<https://github.com/humans-and-machines/ai-feedback-provision/tree/e4613f58a71777e29f8c2a4310db90d108f24557>
- **明确支持的事实**：
  1. 场景为 300-level machine-learning course；`n=11` TAs、`n=88` students。
  2. 每次作业内先把学生随机分入 A/B，处理条件按题目轮换；treatment 在 TA 完成评分之后提供 AI 反馈草稿，TA 可使用、编辑或忽略。反馈结果的有效观察为 2,828 个 student-question submissions。
  3. 反馈提供率增加 10.81 个百分点（SE=1.10，p<0.001）。反馈长度把未提供反馈的提交编码为 0 后增加 39.79 字符（SE=3.45，p<0.001）；因此该长度结果混合了“更常提供反馈”与“已提供反馈的长度”，不能解释成纯条件长度效应。
  4. 单位字符耗时只在有反馈时间的 664 条提交中定义，学生有用性评分只在有评分的 468 条提交中定义；两个子样本都未见显著组间差异。论文明确要求把这些条件性结果视为描述性而非因果，不能外推到全部提交或全体学生体验。定性结果把草稿描述为降低启动障碍的可编辑脚手架。
- **不支持的主张**：不证明学习增益、自动评分有效、总体时间减少或长期采用；不能用反馈长度替代质量。
- **许可/再利用**：预印本按 arXiv 页面许可；仓库本次未把明确根许可证作为可复制授权依据，因此课程只链接和自写实现。
- **用于课程**：M8、M10、M12；主张 C07、C13。
- **主要风险**：小样本、单课、预印本、行为随学期下降、反馈更多但不一定更好。

### S12 — OpenAI Developers：Codex subagents X 原帖

- **作者/账号**：OpenAI Developers（`@OpenAIDevs`）。
- **类型/强度**：官方产品发布帖；D-S。
- **原帖**：<https://x.com/OpenAIDevs/status/2033636701848174967>
- **日期**：2026-03-16。
- **核验方式**：X/Twitter 官方 oEmbed：<https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FOpenAIDevs%2Fstatus%2F2033636701848174967&omit_script=true>
- **线程边界**：目标帖属于同一官方账号的 live self-thread；页面同时呈现续帖 <https://x.com/OpenAIDevs/status/2033636713877430747>。课程只使用目标帖实际写出的发布主张，现行能力由当前一方文档承担。
- **当前技术佐证**：<https://developers.openai.com/codex/subagents>；现行产品行为以当前官方文档为准，X 只记录发布时点。
- **明确支持的事实**：发布者称 Codex 已提供 subagents，并主张其可保持主上下文整洁、并行处理不同部分、在运行中干预个别 agent。
- **不支持的主张**：不证明 subagents 在教育中提升速度、准确、安全或学习；不证明 2026-08-26 后产品状态。
- **许可/再利用**：原帖链接和极短摘要；不复制媒体。
- **用于课程**：M9；主张 C05、C14。
- **主要风险**：产品漂移、营销语境、把软件开发模式直接类比教育效果。

### S13 — OpenAI Study Mode X 原帖

- **作者/账号**：OpenAI（`@OpenAI`）。
- **类型/强度**：官方产品发布帖；D-S。
- **原帖**：<https://x.com/OpenAI/status/1950240351547248941>
- **日期**：2025-07-29。
- **核验方式**：X/Twitter 官方 oEmbed：<https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FOpenAI%2Fstatus%2F1950240351547248941&omit_script=true>
- **线程边界**：目标帖属于同一官方账号的 live self-thread；页面同时呈现前帖 <https://x.com/OpenAI/status/1950240348695072934> 与 <https://x.com/OpenAI/status/1950240350129574358>。课程只使用目标帖实际写出的发布主张与一方佐证页面。
- **明确支持的事实**：发布者称 Study Mode 与教育者/专家共同构建，并把它称为“first step”；帖子提到通过 NextGenAI 与 Stanford SCALE 进行长期研究以了解学习。
- **不支持的主张**：不证明 Study Mode 学习有效；“共同构建”不等于同行评审；课程发布前需检查产品和研究更新。
- **许可/再利用**：链接与短摘要。
- **用于课程**：M1、M6；主张 C14、C15。
- **主要风险**：把产品定位当成效果；功能/模型已变化。

### S14 — Jifan Yu：OpenMAIC X 原帖

- **作者/账号**：Jifan Yu（`@yujifan_0326`），OpenMAIC 作者。
- **类型/强度**：作者发布帖；D-S。
- **原帖**：<https://x.com/yujifan_0326/status/2033174084331475423>
- **日期**：2026-03-15。
- **核验方式**：X/Twitter 官方 oEmbed：<https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2Fyujifan_0326%2Fstatus%2F2033174084331475423&omit_script=true>
- **线程边界**：目标帖是编号两部分公告的开篇（`1/2`）；对应 `(2/2)` 为 <https://x.com/yujifan_0326/status/2033174088672510069>，live same-author self-thread 还呈现 <https://x.com/yujifan_0326/status/2033189543579648306> 与 <https://x.com/yujifan_0326/status/2033196896555319416>。本台账和课程只依赖目标帖实际写出的发布主张，技术与许可仍由固定仓库和论文承担。
- **明确支持的事实**：作者宣布开放 OpenMAIC，并把 MAIC-Craft/可扩展、自适应在线教育作为其架构/愿景主张。
- **核验配对**：产品能力必须与 S08 固定仓库和论文 DOI 对照；X 只记录发布与作者表述。
- **不支持的主张**：不支持学习效果、可扩展性或个性化质量结论。
- **许可/再利用**：链接与短摘要。
- **用于课程**：M9；主张 C05、C14。
- **主要风险**：作者自述、发布时点仓库与当前仓库差异、二手转述扩大原意。

### S15 — UNESCO 生成式 AI 教育与研究指南

- **标题/组织**：Guidance for generative AI in education and research；UNESCO；Fengchun Miao、Wayne Holmes。
- **类型/强度**：国际组织官方治理指南；A-N。
- **页面**：<https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=387>
- **发布日期/更新**：2023-09-07；页面最后更新 2026-01-16。
- **明确支持的事实**：指南主张人本方法、数据隐私保护、独立与生成式 AI 对话的年龄限制，以及人-agent 和年龄适切的伦理验证与教学设计。
- **不支持的主张**：不是任一司法管辖区的直接法律；不设本课程可通用的具体法定年龄；不证明某产品符合要求。
- **许可/再利用**：链接和摘要；再用出版物内容按 UNESCO 页面/出版物条款处理。
- **用于课程**：M2、M5、M7、M11、M12；主张 C11、C15。
- **主要风险**：把全球指导误作本地法律、忽略后续更新和机构政策。

### S16 — UNICEF AI and Children v3.0 与 AI companions brief

- **标题/组织**：Guidance on AI and Children v3.0；UNICEF Innocenti。
- **类型/强度**：国际组织官方儿童权利治理材料；A-N。
- **主页面**：<https://www.unicef.org/innocenti/reports/policy-guidance-ai-children>
- **发布日期**：2025-12。
- **完整 v3.0 PDF**：<https://www.unicef.org/innocenti/media/11991/file/UNICEF-Innocenti-Guidance-on-AI-and-Children-3-2025.pdf>
- **清单 PDF**：<https://www.unicef.org/innocenti/media/11996/file/UNICEF-Innocenti-Guidance-on-AI-and-Children-3-Checklist-2025.pdf>
- **2026 policy brief**：<https://www.unicef.org/media/181131/file/UNICEF-When-AI-becomes-friend-policy-brief-2026.pdf>
- **2026 business recommendations**：<https://www.unicef.org/media/181136/file/UNICEF-When-AI-becomes-friend-Business-recommendations-2026.pdf>
- **明确支持的事实**：
  1. v3.0 给出十项儿童中心 AI 要求：监管/监督、儿童安全、数据与隐私、非歧视/公平、透明/解释/问责、权利、最佳利益/发展/福祉、包容、技能与有利环境。
  2. checklist 建议清楚告知儿童/照护者其正在与 AI 而非人互动，并防止拟人化。
  3. 2026 brief 指出关系化聊天机器人/companions 对儿童有独特且加剧的风险，并主张从事后反应转向预防性、生态化责任。
- **不支持的主张**：不是国家合规清单；不证明任何年龄验证、内容过滤或陪伴功能已经安全。
- **许可/再利用**：链接与摘要；引用 UNICEF 出版物并遵循其使用规则。
- **用于课程**：M2、M6、M8、M11、M12；主张 C11、C15。
- **主要风险**：把原则性治理压缩成单一年龄门槛；忽略儿童参与、公平、申诉、持续监测和供应链。

## 3. 补充司法辖区锚点（不计入 16 个强来源包）

### J01 — FERPA 官方学生隐私页面（美国）

- **组织**：U.S. Department of Education, Student Privacy Policy Office。
- **页面**：<https://studentprivacy.ed.gov/privacy-and-data-sharing>
- **支持的有限事实**：FERPA 的一般规则是未经书面同意不披露教育记录中的 PII，但存在满足特定条件的例外；许多数据共享情形需要书面协议和不同保障。
- **边界**：美国特定法律背景；不覆盖所有学生数据法律，不是个案法律意见。

### J02 — COPPA 2025 修订最终规则（美国）

- **组织**：Federal Trade Commission / Federal Register。
- **原文**：<https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule>
- **发布日期/状态**：2025-04-22；规则生效 2025-06-23；除规则指定条款外合规日期为 2026-04-22。
- **支持的有限事实**：适用于面向 13 岁以下儿童的在线服务运营者，或实际知道正在收集其个人信息的运营者；涉及通知、可核验家长同意、安全、保留/删除等要求。
- **边界**：美国特定；适用性取决于运营者、服务、数据和实际知识，需法律审查。

## 4. 主张—来源严格映射

| Claim ID | 研究简报中的主张 | 类型 | 来源 | 允许表述 | 禁止扩大 |
|---|---|---|---|---|---|
| C01 | 现代 agent SDK 提供 tools、handoffs、guardrails、HITL、tracing、testing | 事实 | S01 | 技术能力/接口 | 教学有效或安全 |
| C02 | MCP 是 host-client-server；host 负责复杂编排、权限和授权 | 事实 | S02 | 2026-07-28 规范语义 | “MCP 自动编排/自动安全” |
| C03 | MCP/SDK 可将结构化课程资源暴露给 AI | 事实 | S02, S06 | 可检索和连接的能力 | 自动准确、适龄、合规、有效 |
| C04 | computer/browser agent 可执行真实网页动作，且有注入/凭据/副作用风险 | 事实 | S03, S04 | 隔离、白名单、审批建议 | 在真实学生系统已可靠安全 |
| C05 | 协调器、并行专家和汇总器是可实现的多智能体模式 | 事实 | S05, S08, S12, S14 | 架构/发布信号 | 多 agent 一定更好或提升学习 |
| C06 | trace 是事件记录，不是 eval；敏感捕获需显式治理 | 事实+推断 | S01 | 默认行为、隐私风险、课程设计 | “有 trace 就合规/有效” |
| C07 | 人类选择/编辑的 AI 中间产物可支持导师和 TA 工作 | 事实+有限推断 | S07, S11 | 特定实验的增益/行为改变 | 自动替代、跨学科泛化 |
| C08 | 使用 AI 时的任务表现不等于无 AI 学习迁移 | 事实 | S09；S10 作为对照 | 17% 及护栏结果绑定 S09 条件 | 所有 AI 必然伤害/帮助 |
| C09 | 评测应覆盖编排、来源、教学、学习、安全、公平和运营 | 建议 | S01, S05, S09, S15, S16 | 课程综合框架 | 声称来源原样提出七层模型 |
| C10 | 教育工具应采用读写分离、最小权限、人工确认和动作后验证 | 推断+建议 | S02, S03, S04 | 风险控制设计 | 称其可消除所有风险 |
| C11 | 未成年人场景需要隐私、年龄适切、AI 身份披露、监督和儿童权利评估 | 事实+建议 | S07, S15, S16；J01/J02 为美国例 | 治理原则与地区例子 | 全球统一法定年龄/法律结论 |
| C12 | 单智能体应是多智能体的比较基线 | 建议 | S05, S08, S12, S14 | 复杂度与可验证性原则 | 声称已有教育 RCT 证明此顺序 |
| C13 | 无 AI 迁移测验、教师最终控制和提示阶梯应成为课程硬要求 | 推断+建议 | S07, S09, S10, S11 | 教学与责任设计 | 称所有来源共同直接要求同一模板 |
| C14 | X 原帖仅记录产品/项目发布和作者主张 | 事实边界 | S12, S13, S14 | 日期、账号、原帖主张 | 可靠性、采用率、学习效果 |
| C15 | 当前证据不足以支持自主教育智能体的普遍长期成效 | 综合判断 | S09, S10, S11, S13, S15, S16 | 明确说明现有研究的范围/缺口 | 宣称已证明无效或有害 |

## 5. 模块—来源矩阵

| 模块 | S01 | S02 | S03 | S04 | S05 | S06 | S07 | S08 | S09 | S10 | S11 | S12 | S13 | S14 | S15 | S16 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| M1 | ● |  |  |  |  |  |  |  | ● |  |  |  | ● |  |  |  |
| M2 | ● |  |  |  |  |  |  |  |  |  |  |  |  |  | ● | ● |
| M3 |  | ● |  |  |  | ● |  |  |  |  |  |  |  |  |  |  |
| M4 |  |  | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |
| M5 |  |  |  |  |  | ● |  |  |  |  |  |  |  |  | ● |  |
| M6 |  |  |  |  |  |  | ● |  | ● |  |  |  | ● |  |  | ● |
| M7 |  |  |  |  |  |  |  |  |  | ● |  |  |  |  | ● |  |
| M8 |  |  |  |  |  |  | ● |  |  |  | ● |  |  |  |  | ● |
| M9 |  |  |  |  | ● |  |  | ● |  |  |  | ● |  | ● |  |  |
| M10 | ● |  |  |  | ● |  |  |  | ● |  | ● |  |  |  |  |  |
| M11 | ● |  |  |  |  |  | ● |  |  |  |  |  |  |  | ● | ● |
| M12 | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |  |  |  | ● | ● |

## 6. 关键数字审计

| 数字 | 来源版本 | 可写法 | 审计提示 |
|---|---|---|---|
| `62%→66%`（`+4 p.p.`）、低评分导师层 `56%→65%`（`+9 p.p.`） | S07，2025-11 工作论文 | 以导师为随机化单位、随机分配访问权限的 ITT exit-ticket 结果 | 不写成实际使用某条建议的机制效果、长期成绩或所有学生效果 |
| 700+ tutors、1,000+ students；正文 `n=783` tutors | S07，2025-11 工作论文 | 与该版本绑定 | 不与 arXiv/repo 的 900/1,800 混用 |
| 练习 `+48%` / `+127%`；无 AI 考试 GPT Base `-17%` | S09，PNAS 2025 | 依次对应 GPT Base/GPT Tutor 练习；`-17%` 仅 GPT Base | 防止把两个练习百分比对调；护栏组未显示正向考试效果 |
| `N=194` | S10，Scientific Reports 2025 | 符合纳入条件的本科物理学生 | 不是所有注册者、不是多机构样本 |
| 中位 49 分钟 vs 研究设定的 60 分钟课堂学习时间 | S10 | 可写“该研究中” | 不推广为所有 AI 节省时间 |
| `+10.8 p.p.`、`+39.8 chars`；`n=11` TA、`n=88` students | S11，arXiv v1 2026 | 反馈提供率/长度与样本 | 不写成学习增益或总耗时下降 |

## 7. 风险与不确定性登记

| 风险 | 受影响来源 | 控制 |
|---|---|---|
| 仓库 HEAD/API/许可漂移 | S01–S08, S09, S11 | 固定 SHA；发布日重查；许可按文件而非仓库印象 |
| X 删除、编辑、登录墙或产品变化 | S12–S14 | 原帖 + 官方 oEmbed；只留短摘要；不依赖嵌入可用性 |
| 论文版本数字不同 | S07 | 使用 2025-11 版本；在文案标明版本 |
| 短期/单场景外推 | S07, S09–S11 | 写清学科、学校、样本、处理和结果变量 |
| demo 被误作生产保证 | S03–S08 | 加最小权限、HITL、集成测试、事故与退出门槛 |
| trace 扩大敏感数据面 | S01 | 敏感捕获关闭、去标识、访问控制、保留/删除 |
| 课程连接被误作教学有效 | S02, S06 | 人工审核、来源忠实 eval、年级/地区/许可检查 |
| 拟人化/陪伴风险 | S08, S13, S16 | 明确 AI 身份；禁情感依赖；危机转交；儿童权利评估 |
| 合规被全球化 | S15, S16, J01, J02 | 按地区/年龄/数据/供应商审查；注明非法律意见 |

## 8. 发布日复核协议

发布或重大更新前，研究编辑应完成：

1. 对 10 个 GitHub 项目重新运行 `git ls-remote <repo> HEAD`，记录新 SHA；若变化，逐项比对课程引用文件。
2. 检查根许可证、目标文件许可证和第三方资产许可证，尤其 MCP 许可迁移、OpenMAIC 与 Oak 数据/品牌。
3. 打开 S12–S14 原帖及官方 oEmbed；若帖子不可用，保留“已于 2026-08-26 核验”的历史标注，不以二手截图替代一手证据。
4. 检查 S07 是否出现新版本/正式发表，并统一样本数字。
5. 检查 S11 是否经过同行评审或有新版本；未更新前始终称“预印本”。
6. 检查 OpenAI Agents SDK tracing/HITL 默认值和 MCP 最新规范；任何变化都更新实验和安全提示。
7. 检查 UNESCO/UNICEF 页面更新，以及课程目标地区的最新教育、隐私、儿童和 AI 法规。
8. 对网站上的每个效果数字执行一次“数字 → 来源版本 → 结果变量 → 外推边界”反向核对。

## 9. 审计结论

本来源集足以支持一门以“人类监督的教育智能体工程”为主题的当前课程，尤其支持：

- 构建 agent/tool/MCP/browser/multi-agent/eval 的技术教学；
- 以 Tutor CoPilot、Bastani 高中数学 RCT、哈佛物理 RCT 和高教反馈实验形成互相制衡的教学证据；
- 以 UNESCO/UNICEF 建立未成年人和人本治理底线；
- 用 X 原帖呈现生态变化，同时训练学习者识别“发布信号 ≠ 效果证据”。

它**不足以**支持“自主智能体已被证明能普遍提高 K-12 或大学学习”的结论。课程应把这一不足公开呈现，并把学习迁移、教师责任、隐私和分阶段试点设为 capstone 的发布门槛。
