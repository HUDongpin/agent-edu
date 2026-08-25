# DeepTutor 对本项目的启发与落地路线图

**副标题：从“证据优先的静态课程平台”走向“可审计的闭环学习系统”**  
**对象：aicourse.top / Agentic Engineering 项目**  
**快照日期：2026-08-23（Asia/Taipei）**  
**DeepTutor 基准：HKUDS/DeepTutor v1.5.16，提交 `8515dfdbe64574681c747fdda7a470044adc628f`**

> 核心判断：DeepTutor 最值得借鉴的不是功能数量，也不是在每页加一个聊天框，而是把“课程材料—证据检索—对话辅导—学习者证据—针对性练习—效果评估”连成一个可追溯、可纠错的闭环。本项目应保留静态课程作为权威发布面，再增加一个可选、可撤销、受课程边界约束的 Tutor 服务面。

## 执行摘要

### 五个结论

1. **课程内容方面：补的不是又一门提示词课，而是“AI Tutor 与学习系统工程”。** 当前工作树已有 Agentic Engineering、RAG、Prompt、Software Engineering 等本地课程资产；真正的缺口是教育特有的学习目标与概念图、诊断与支架、掌握度估计、形成性评价、题目验证、学习成效实验、隐私与教师监督。[L5][L7][L8]
2. **AI Tutor 方面：先做课程内闭环，不做开放域万能助手。** 首个版本只支持“解释、苏格拉底式提示、练习与反馈”三种明确模式；每次回答绑定课程版本、来源片段和学习目标；用户可以看到为什么系统认为自己“薄弱”，并可以改正或删除该判断。
3. **RAG 方面：把现有 RAG 课程中的概念升级为平台级服务，但先坚持一个默认引擎。** 建议以混合检索（BM25＋向量）和可选重排为基线，建立课程语料版本、页/节/块级引文、拒答机制、黄金查询集和回滚；GraphRAG、PageIndex 或多引擎切换只在评测暴露具体失败后引入。DeepTutor 固定提交为混合检索提供了可检查的实现参考，但并未替本项目完成效果验证。[D4][D5][D6]
4. **评估方面：DeepTutor 论文报告的是“交互质量与题目质量的代理指标提升”，不是已经证明真实学习增益。** 本项目不能用 LLM judge 分数替代延迟测验、迁移任务、提示依赖、时间成本、信心校准和真实学生研究。[P1][P2]
5. **工程方面：推荐“双平面架构”。** 现有静态站点继续做免费、无需账户、可缓存、可审计的课程发布面；独立 Tutor 服务先以匿名会话处理检索、对话和短期观察。二者通过版本化的“课程学习契约”连接；账户、长期状态、上传和任意代码执行均不属于首轮范围。[L2][L3]

### 建议决策

**建议采用“原生薄 Tutor 层＋DeepTutor 作为参考实现与隔离试验侧车”的路线。** 首个范围统一为**英语 RAG 课程的固定版本**；侧车锁定提交，只使用合成或去标识数据、独立存储和测试密钥，没有生产身份、用户上传或直接发布路径。首轮只判断检索、引文、拒答、提示阶梯、成本与可用性是否达门，不以得到正向学习效果作为工程退出条件。

## 1. 范围、方法与证据边界

本报告同时审计三类材料：本项目当前工作树中的 README、课程 manifest、实验组件和本地进度实现；DeepTutor v1.5.16 的 README、AGENTS.md、RAG、Memory、Mastery、Question、Book 与 Sandbox 源码；DeepTutor v3 论文及其 TutorBench、消融、人类偏好一致性和限制部分。该论文在 arXiv 被标为 work-in-progress technical report；本报告没有把它升级为已完成同行评审或已独立复现的证据。[D2][P1]

为了避免把营销功能表当作教育成效，本报告使用三层证据标记：

- **已核实事实**：可由固定提交的源码、README、发布页或论文直接支持。
- **合理推断**：由多个事实组合而成，但不是原作者直接声称的结果。
- **本项目建议**：针对 aicourse.top 的设计选择；不是 DeepTutor 已验证的结论。

还要特别强调两条边界。第一，本项目当前工作树有大量在建内容；本轮没有验收生产站点，因此线上状态为 **NOT_ASSESSABLE**，“available”“草稿包”“路由映射”都不等于已经上线。[L1][L7] 第二，DeepTutor 论文的核心定量评估主要使用模拟学生和 LLM judge；其 45 个会话、10 名学生标注者（每个会话由两名被分配的标注者盲评）用于核验评审排序的一致性，并不是纵向学习成效实验。[P2]

## 2. 本项目当前基线：优势与结构性缺口

### 2.1 已有优势

先固定状态口径，避免把代码、发布契约与生产部署混在一起：

| 状态 | 本次可以说 | 本次不可以说 |
|---|---|---|
| 远端生产 | `NOT_ASSESSABLE`；本轮未验收生产制品 | “已上线九门课程”或“生产已覆盖全部主题” |
| 本地发布契约 | 当前 `TOP_LEVEL_COURSES` 有九条记录标为 `available` | 自动等同于部署、翻译或全部 release gate 通过 |
| 候选/受门控 | Cursor 为 `soon`；Claude 通用课受版权门控；Grok 有课程 manifest 与路由、但未进入顶层目录 | “现有已发布课程”或“Tutor 已实现” [L7][L10] |
| 草稿资产 | S00–S10 与路由映射可作为课程设计输入 | 已完成课程、已上线或已有真实学习效果 |

在这一口径下，本项目可确认的定位是免费、开源、多语言、强调证据、验证与可操作练习的 AI 学习平台。当前本地发布契约将 Agentic Engineering、Codex、GitHub、Prompts、Software Engineering、RAG、MCP、Make Money with Codex 和 Claude Income 标为 `available`；README 的 Available course 表仍只列四门，说明文档与目录契约存在漂移。下文只称这些为“本地已配置课程”。[L1][L7]

现有架构还有四个难得的产品优势：

- **发布可靠**：Next.js 静态导出，不依赖生产数据库或常驻应用服务器；课程可以被缓存和长期引用。[L1][L2]
- **隐私默认较强**：学习进度只存在浏览器 localStorage；通用课程无需账户。[L3]
- **证据意识成熟**：RAG 课程对来源、许可、媒体来源、检查和 fail-closed 行为有明确结构。[L5]
- **已有正确的知识主线**：Agentic Engineering 覆盖上下文、harness、评估和安全；RAG 课程从语料治理一直讲到评估、安全、新鲜度和生产 capstone。[L1][L5]

### 2.2 目前不是 AI Tutor 的原因

当前页面主要提供课程阅读、测验、确定性实验和本地进度。DeepSeek 实验室可以让用户自带密钥调用模型，但它本质上是预设提示、案例和评测的实验界面；不是跨课次、跨会话、会诊断误解并调整教学策略的 Tutor。[L3][L4]

RAG 课程里的 Retrieval Lab 也很有价值，但其分数矩阵是浏览器内的确定性模拟。它适合教“top-k、阈值、重排策略如何改变结果”，却没有真实语料摄取、索引版本、检索调用、引用对齐、删除传播或在线失败恢复。因此，**本项目已经会“教 RAG”，尚未让 RAG 成为“教人的平台能力”。**[L5][L6]

### 2.3 工作树中的潜力与边界

项目还存在 S00–S10 的 V3.1 课程包与路由映射草稿，覆盖 Python、LLM 应用、RAG、评估、生产、多代理等方向。这些内容是建设 AI Tutor 课程的良好原料，但本报告把它们视作可复用草稿，而不是已经发布的事实。[L8]

工作树也并非从零设计 Tutor policy：Cursor 候选课 Lesson 13 已写出“每轮一个学习者动作、逐级提示、只读验证、预测—反思—迁移、隐私保护与学习者停止权”。但 Cursor 的目录状态仍为 `soon`，所以这是可复用的**候选设计种子**，不是已上线 Tutor 证据。[L7][L9]

### 2.4 一页对照矩阵

| 维度 | 本项目当前工作树 | DeepTutor v1.5.16 | 论文证据 | 本项目决策 |
|---|---|---|---|---|
| 课程 | 静态课程、manifest、确定性互动；发布 QA 较强 | Book proposal、spine、typed blocks、进度与 drift | Book 属架构扩展，未验证纵向学习效果 | 权威课程保持人工发布；AI 只进入作者草稿工作台 |
| Tutor | 未发现运行时 Tutor；Cursor 有候选 policy | 共享上下文/工具协议与多种能力，但存在专用 pipeline | investigate–solve–write 与闭环个性化 | 三模式、一次一行动、逐级提示、可停止 |
| RAG | 会教 RAG；无平台实时索引 | 多 provider；默认 LlamaIndex 为 BM25＋vector RRF | 论文 SKG 为 graph＋dense，不能等同当前默认实现 | 一个混合检索基线，先评测再加复杂引擎 |
| 学习者状态 | localStorage 完成度，无 learner model | 文件式 L1/L2/L3 Memory＋启发式 Mastery | DPM Trace Forest 是另一 schema | 首轮会话内 observation；审批后才做长期状态 |
| 评估 | 课程 release checks；无 Tutor outcome 研究 | 产品管线与功能测试 | 模拟学生＋LLM judge；45 会话做人类偏好对齐 | 离线质量→可用性→审批后的真实学习研究 |
| 安全/运维 | 静态、无服务端，威胁面较小 | 状态型、多用户、外部 provider 与不同隔离级别 | 论文承认成本与真实世界限制 | 隔离侧车、最小数据、kill switch、静态降级 |

## 3. DeepTutor 到底提供了什么

### 3.1 从“聊天功能”到统一学习运行时

DeepTutor 以统一上下文、工具协议、能力注册和事件流连接 Chat、Quiz、Research、Visualize、Solve、Mastery Path、Immersive Reading 等学习表面；但不能按字面写成“所有模式都执行同一个控制 loop”。Question、Research、Visualize、Math Animator 和 Book 仍有专用 pipeline，BookEngine 也不是普通 BaseCapability。准确的借鉴点是**统一契约与共享上下文**，而不是强迫所有教学任务使用同一种编排。[D1][D3]

由此推断：本项目应让解释、出题、研究和可视化共享检索、来源读取、学习者观察和审计事件，但每种能力仍有自己的目标、工具权限、停止条件与产物契约；控制流可以不同。

### 3.2 RAG 不是一个按钮，而是生命周期

固定提交的 RAG factory 列出七类 provider：LlamaIndex、PageIndex Cloud、PageIndex OSS、GraphRAG、LightRAG、LightRAG Server 和 IMA；每个知识库绑定一个 provider。MarginNote 与 Obsidian 通过专门 capability/连接方式进入产品，不宜与 factory provider 混为一类。默认 LlamaIndex 路径将向量检索与 BM25 通过 reciprocal-rank fusion 融合；结果可携带标题、正文、来源、页码、chunk id、分数和 provider。[D4][D5][D6]

更值得借鉴的是索引生命周期思想：重建写入新的 `version-N` 并保留旧版。当前默认 LlamaIndex 路径使用活动 embedding signature 选择可读版本，失配时返回 `needs_reindex`；其他 provider 有各自的版本或连接语义，不能泛化为同一套 embedding 机制。代码还不足以证明成熟的用户级手工回滚流程，因此本项目需要另行定义切换、回滚与验证协议。[D4][D6]

### 3.3 可检查的三层 Memory

DeepTutor 当前产品的 Memory 是文件式、非向量结构：L1 是按学习表面和日期追加的 JSONL 原始事件；L2 是各表面的 Markdown 整理事实；L3 是跨表面的 profile、recent、scope、preferences Markdown 综合。L2 条目可以引用原始 entity/trace，条目有稳定 ID，且支持删除；当前检查到的 L3 契约只引用表面/L2 文件级来源，并未为每条 L3 claim 保存具体 L2 entry id。因此，README 所说“任一综合判断精确回到原始事件”比当前代码证据更强。[D1][D7]

注意：论文 DPM 的 Trace Forest 按会话摘要、规划单元、执行/工具/证据记录组织节点，并描述 dense embedding 与专门 memory agents；它与上述产品 L1/L2/L3 不是同一 schema，也未确认完整实现对应关系。本文分别借鉴当前产品的可编辑/可删除方向与论文的多分辨率轨迹思想，不用论文消融结果证明当前文件式 Memory 已有效。[P2][D7]

本项目建议只保留可观察证据，避免存储模型隐藏推理或不必要敏感信息；把事实、推断、偏好、掌握度估计分开；为每条学习者判断显示具体事件或条目级证据、置信度、过期时间与更正入口。

### 3.4 掌握路径和题目生成

DeepTutor 的 Mastery Path 有持久化路径、待答问题、尝试记录、复习和掌握度计算。当前掌握度策略是最近表现的加权正确率并设低样本上限；它是透明的规则基线，不是已经校准的 BKT、IRT 或知识追踪模型。本项目可以借状态机，不能照搬阈值或效果宣称。[D12]

当前题目管线分为 Explore、Plan、Quiz：先探索与规划，再逐题产出并做结构/schema 检查和一次 repair；修复后仍可能以 best-effort 形式返回带 issues 的题目。论文描述的独立 validator、事实/教学性检查和计算题沙箱比当前主 pipeline 的可验证实现更强。因而本项目必须另建 Evidence、Correctness、Pedagogy 三类发布闸门，不能把 schema 合法等同于题目正确。[D8][P2]

### 3.5 Living Book 与可控生成

Book Engine 从知识库、笔记、题库或对话快照构建 proposal 和 spine，先让用户确认结构，再生成页面与 typed blocks。块类型包括正文、提示框、测验、闪卡、时间线、代码、图、交互、动画、概念图、诊断与检索练习；编译支持 partial/error、暂停和恢复。schema 为章节和块提供 `source_anchors`，但字段允许为空，部分生成路径也会在 RAG 失败后继续。[D1][D9]

本项目应借鉴“先批准结构，再生成可编辑块”，同时收紧为 fail-closed：检查 source-anchor 覆盖率和主张—来源支持；无可定位来源、关键矛盾未解决或人工审查未通过时，只能保留为草稿，不能进入权威发布面。

## 4. DeepTutor 的证据能说明什么、不能说明什么

DeepTutor 论文提出 Static Knowledge Grounding（SKG）和 Dynamic Personal Memory（DPM）的混合个性化框架：前者将课程材料分成原子多模态单元，并结合知识图谱与稠密检索；后者以 Trace Forest 和不同职责的 memory agents 提取历史、薄弱点与教学反思。问题辅导采用调查、引导求解、证据写作的多阶段流程；出题采用基于薄弱点的构思、生成和独立验证。这里描述的是论文设计，不是对 v1.5.16 每条产品路径的实现断言。[P1][P2]

TutorBench 包含 30 个知识库、5 个广泛学科、90 个学习者画像和 270 个交互任务，并用 10 个 1–5 分指标评估辅导与练习质量。表 2 中 DeepTutor OQ 为 3.91；Naive Tutor 为 3.53，论文据此报告相对 `+10.76%`；Self-Refine 为 3.57，是 OQ 最高的非 DeepTutor baseline，但不是该百分比的分母。在这套代理评价中，消融显示移除 SKG 主要伤害 groundedness/来源忠实度/跨概念质量，移除 DPM 主要伤害个性化与适配。[P2]

由此可形成两个待本项目检验的工程假设：课程证据和学习者证据应分开建模；个性化不应只靠把聊天历史塞进提示词。但这些结果**不支持**以下说法：DeepTutor 已提高长期保持、迁移、成绩或公平性；多代理一定优于简单 Tutor；所有学科都需要图检索；持续主动消息一定改善学习。

论文自己指出：模拟学生/LLM judge 与真实学习者之间仍有差距；多阶段推理增加成本；Book、Partners 对保持、投入、打断和真实学习结果需要纵向研究。另一个通用求解基准的平均提升是在关闭 personalization、SKG 和 DPM 时得到的，不能当作个性化学习效果证据。当前固定提交也未确认公开了 TutorBench 完整数据、harness、transcripts 与 judge records，所以本报告不把作者结果写成独立复现。[P1][P2]

## 5. 课程内容：建议新增“AI Tutor 与学习系统工程”

建议将现有 RAG、Agentic Engineering 以及 S04/S05/S06/S08 等草稿资产重组为一门教育特化的实践课程；Cursor 候选 Lesson 13 可作为教学策略种子。课程不是教学生调用某个 Tutor API，而是要求完成一个可验证、以学习结果为目标的 Tutor。[L8][L9]

| 模块 | 新学习成果 | 复用现有资产 | 必交产物 |
|---|---|---|---|
| 1. Tutor 边界与学习目标 | 区分聊天助手、解题器、教练与教学系统；定义成功和禁区 | Agentic Engineering 的目标/停止条件 | Tutor 产品边界、失败案例和结果指标 |
| 2. 课程学习契约 | 将目标、概念、先修、证据、题目和权限版本化 | 课程 manifest、RAG sources/checks | `course-learning-contract.json` 与概念图 |
| 3. 证据型 RAG | 建立可定位、可更新、可拒答的课程检索 | RAG 12 课与 Retrieval Lab | 真实语料索引、黄金查询集、引文评测 |
| 4. 对话教学策略 | 实现诊断、逐级提示、追问、解释与答案披露规则 | Prompt、Agentic loop 内容 | 三模式 Tutor policy 与对话回归测试 |
| 5. 学习者模型与 Memory | 把观察、推断、偏好、掌握度分层并可纠错 | 本地进度、context/memory 主题 | 可检查学习者档案和删除/导出流程 |
| 6. 形成性评价 | 生成题目、独立验证、记录误解并安排复习 | 现有 quiz/capstone、eval 草稿 | 题库与 Evidence/Correctness/Pedagogy gates；受控验证器 |
| 7. Tutor 评估与实验 | 区分代理指标和真实学习增益 | Agent eval、RAG eval 内容 | 离线评测＋小型随机/交叉学习实验方案 |
| 8. 安全、隐私与人类监督 | 处理提示注入、数据隔离、未成年人、成本和教师覆盖 | Security、Responsible AI 草稿 | 威胁模型、数据保留表、人工升级机制 |

课程 capstone 建议限定为一门课程和一个版本化语料库，并把三套样本严格分开：50–100 条 `retrieval gold queries` 测召回、排序、过滤、拒答与版本；20–30 个经人工审阅的多轮 `tutor dialogue cases` 测诊断、提示、答案泄露与边界；`protected outcome items` 则用于即时/延迟/迁移结果，数量由研究设计与样本量决定。学生必须提交检索失败报告、引文对齐、对话回归、学习者状态审计和预注册实验方案，而不只是一次漂亮演示。

## 6. AI Tutor：从功能清单变成闭环协议

### 6.1 首版只保留三个模式

- **解释 Explain**：先识别目标概念和已有证据，再给分层解释；所有可核实知识主张显示课程出处；证据不足时明确拒答或请求补充。
- **引导 Coach**：先诊断卡点，再按提示阶梯推进（澄清问题→轻提示→强提示→局部示例→完整解法）；默认不直接泄露完整答案。
- **练习 Practice**：首版只从冻结、人工审核、带课程来源与参考答案的题库选题，不生成新题；作答后给可执行反馈，并更新“观察记录”，而非直接写入不可争辩的用户画像。独立生成新题及其 Evidence/Correctness/Pedagogy 验证属于 P1-2b，不是 P0-1 能力。

### 6.2 学习闭环

推荐闭环是：**选择课程版本 → 诊断目标与先备知识 → 检索课程证据 → 选择教学动作 → 检查理解 → 生成针对性练习 → 验证作答 → 更新可检查学习者状态 → 安排延迟复习。** 任一步证据不足，都要显式降级或停下。这里延续了本项目已有的 fail-closed 课程设计，并吸收 Cursor 候选课的逐级提示与停止权。[L5][L9]

### 6.3 学习者模型最小数据结构

每条状态至少包括：`concept_id`、观察类型、证据事件、时间、任务难度、是否获得提示、正确性/评分依据、推断置信度、过期时间、课程版本、用户确认状态。把“用户偏好简短回答”和“用户尚未掌握向量检索”分开；把“做错一次”与“稳定误解”分开；把教师/用户更正置于模型推断之上。

### 6.4 交互设计原则

Tutor 页面应同时展示“正在学习什么”“引用了什么”“为什么这样提示”“系统记录了什么”。建议提供证据抽屉、教学模式切换、显示更多提示、查看/更正学习档案、删除本次记忆，以及“交给教师/人工复核”。不要在首版加入主动推送、跨渠道机器人或拟人化依赖设计。

## 7. RAG：从教学示例到课程级证据服务

### 7.1 推荐的默认检索栈

首版采用：结构化解析 → 课程感知 chunk → BM25＋向量混合检索 → 可选轻量重排 → context packing → answerability gate → 带引文生成。保留统一 Retriever 接口，使未来可以插入 PageIndex/GraphRAG，但 UI 不给普通学习者暴露引擎菜单。

选择混合检索作为基线有三个原因：课程材料既有精确术语、命令和代码标识符，也有需要语义匹配的解释；DeepTutor 固定提交提供了 BM25＋vector RRF 的可检查工程参考；它比一开始维护多个重型引擎更容易评测、部署和回滚。但实现存在不等于在本项目语料、英语课程和学习任务上已验证，本项目仍需自己的黄金集和运行评测。[D5][D6]

### 7.2 课程学习契约是桥梁

建议每个 Tutor-enabled 课程发布一个版本化契约，至少包含：

- `course_id`、`locale`、`release_version`、`content_hash`；
- 学习目标、概念、先修关系、lesson/page/section anchors；
- 权威来源、许可、可用范围、引用格式和撤回状态；
- 题目、rubric、常见误解、允许的提示阶梯；
- 模型和工具权限、允许的数据保留范围；
- 索引/provider 版本、适用时的 embedding signature、评测集版本和回滚目标。

这样可以防止“页面已更新、索引仍是旧版”的无声漂移。索引构建应写入新版本，完成结构检查和黄金集回归后再原子切换；删除或撤回来源必须传播到索引、缓存、题库和生成产物。版本失配必须 fail closed，不能回退到未经标记的旧索引。

### 7.3 引文必须可操作

引文不仅显示文件名，还应定位到课程、lesson、页面/节、chunk 和版本。回答面板提供“打开原文”“查看上下文”“报告引用不支持该句”。在生成前运行 answerability gate；生成后把每个可核实主张与证据片段对齐。检索到了相关片段不等于该片段支持最终主张，因此需要分别测检索和引文忠实度。

### 7.4 RAG 评测体系

离线检索至少报告 Recall@K、MRR/nDCG、过滤正确率、版本命中率和重排增益；回答层报告引用精确率/召回率、主张—证据蕴含、拒答正确率和答案完整性；运行层报告 p50/p95 延迟、单次/单会话成本、索引失败率、删除传播时限和回滚演练结果。阈值在冻结样本建立 baseline 后预先设定，不看完结果再移动门槛。

评测域必须隔离：`authoring corpus`、Tutor 可检索语料、development/eval cases 和受保护学习结果题分别版本化与授权。后测、迁移题、答案键及 judge rubric 不进入 Tutor 可检索或可写域；Tutor 生成题也不能自动回流为受保护测试题。TutorBench 同样把正确理解保留给 judge，而不向 Tutor 暴露为 ground truth。[P2]

## 8. 其他重要启发

### 8.1 作者工作台，而不是自动发布器

借鉴 Living Book 和 Co-Writer 的结构批准、typed block、逐块编辑与来源字段，为课程作者提供“生成草稿—显示来源—差异比较—逐块接受—验证—发布”的流程。由于 DeepTutor 的 anchor 字段允许为空且部分路径 fail open，本项目必须把覆盖率、主张支持和人工批准变成发布硬门。[D9]

### 8.2 工具与能力分层

把 `retrieve`、`read_source`、`grade`、`run_controlled_check`、`save_observation` 作为受权限约束的工具；把 Explain、Coach、Practice、Authoring 作为多阶段能力。每个能力声明可用工具、最大迭代、最大成本、暂停点、必须产物和失败状态。首轮 `run_controlled_check` 只允许维护者预置、固定命令、无网络的验证器，不接受用户任意代码。

### 8.3 可恢复执行与成本预算

多阶段 Tutor 会遇到配额、网关、索引和工具故障。应借鉴 DeepTutor 的流式阶段、可暂停/恢复和版本化产物，但为每个能力增加预算：最大工具调用、token、墙钟时间、重试次数和降级路径。学习者应能看到“正在检索/验证/等待回答”，而不是把长延迟误解为系统失灵。

### 8.4 安全与多用户隔离

一旦加入账户、上传材料或代码执行，本项目的威胁面会从静态站点跃迁为状态型应用。首轮试点因此明确**无账户、无上传、无任意代码、无长期 Memory**。后续若开放代码，只允许 SYSTEM/OS 强隔离、资源受限、默认无网络与只读挂载；应用层路径检查不等于安全沙箱。[D10]

### 8.5 可复用技能，但要有课程边界

DeepTutor 的 Skills/MCP/CLI 插件显示了可扩展生态的价值。对本项目而言，技能应首先服务课程任务，例如“核验引用”“运行单元测试”“比较检索结果”，并绑定课程允许的工具清单、数据域和输出 schema。开放插件市场应放到后期，因为它会显著放大数据外发、依赖供应链和评测组合爆炸。

## 9. 推荐目标架构：双平面＋课程学习契约

### 9.1 发布面（保持现状优势）

静态课程、manifest、来源与许可、确定性互动、公开测验和本地进度继续由 Next.js 静态导出。它是可引用的权威课程版本，也是 Tutor 的事实边界；Tutor 服务不可用时，静态课程仍须完整可用。[L2][L3]

### 9.2 Tutor 服务面（独立、可选）

独立后端负责匿名会话编排、课程 RAG、题目验证、短期学习者观察、工具预算与脱敏遥测。首轮使用 `anonymous_session_id`，只读英语 RAG 固定语料，无上传、无跨设备、无长期 profile；账户、多租户与长期状态必须在独立隐私/安全门后引入。

### 9.3 连接层

课程学习契约及其内容 hash 是两个平面的权威桥梁。Tutor 每次回答、题目、学习者观察和评测记录都带 `course_version` 与 `contract_hash`。若索引与课程不匹配，系统必须 fail closed；Tutor 有 feature flag 与 kill switch，故障时回到静态课程而不是绕过版本门。

### 9.4 观测与评估层

把事件分成四类：内容/索引事件、Tutor 决策事件、学习行为事件和安全/运维事件。保留可审计的结果与工具证据，但不保存模型隐藏思维链。authoring、Tutor 检索、开发评测和受保护学习结果四个数据域分开授权；在线研究只采集回答预注册问题所需的最小数据。

## 10. 单一路线图与决策门

以下周期仅用于量级估算，假设有 2 名全职工程师、0.5 名课程/学习科学负责人，以及设计与安全按需支持；已有模型网关。采购、伦理/隐私审批和研究招募等待时间不包含在内。若资源不同，应以工作包和退出证据为准，不以日期制造确定感。

| 阶段 | 范围与明确不做 | 退出证据 | 依赖与周期 |
|---|---|---|---|
| P0-0 契约与冻结基线 | 英语 RAG 固定版本；课程契约；50–100 条检索查询；20–30 个多轮 Tutor cases；四数据域与威胁模型。不做在线 Tutor | 契约/hash、语料、样本与评测协议均冻结；版本失配、无证据和污染会 fail closed | 课程专家＋RAG 工程；约 3–4 周 |
| P0-1 匿名侧车 MVP | Explain、Coach，以及仅从冻结人工审核题库选题的 Practice；混合检索；会话内 observation；引文抽屉。无新题生成、账户、上传、任意代码、长期 Memory 或多引擎 | 离线门通过；冻结题库来源与答案复核通过；静态降级、feature flag/kill switch、服务端秘密、预算/限速、脱敏日志、版本失配演练通过 | 模型/检索供应稳定；约 6–8 周 |
| P1-2a 数据权利与可检查状态 | 明确同意；观察证据；更正、导出、删除与删除传播。不做跨课程人格推断 | 任一状态可回到事件级证据；过期/更正优先；备份与索引删除演练可复核 | 隐私/安全评审；约 4–6 周 |
| P1-2b 评价与研究准备 | 新题生成及 Evidence/Correctness/Pedagogy gates；受控固定验证器；延迟复习；受保护 outcome set 与研究协议。无用户任意代码 | 生成题必须唯一作答、来源支持且人工抽检通过；协议、随机化/交叉设计、结果项和分析计划预先冻结；审批完成后才招募；无论方向如何报告效应量、区间、流失和不良事件 | 研究审批与招募为外部依赖；工程约 6–10 周 |
| P1-3 作者工作台 | proposal/spine/typed blocks、逐块 diff、来源覆盖与人工发布门；选择性接入 S00–S10 草稿 | AI 内容不能绕过人工批准；来源、许可、技术与教学 QA 可审计 | 在 Tutor 基线稳定后排期；约 6–10 周 |
| P2-4 证据驱动扩展 | PageIndex/图检索、多引擎、多代理、主动伙伴、开放插件、跨渠道与通用任意代码 | 只有基线暴露明确失败、A/B 显示净价值且安全/成本门通过时才立项 | 按问题单独估算；默认暂缓 |

隔离试验侧车的操作定义是：固定 DeepTutor 提交、合成/去标识数据、独立身份与存储、无生产密钥、无用户上传、只用于基准和架构验证，产物不能直接发布；试验结束后保存配置与证据，关闭服务并删除临时数据。

## 11. 成功指标与受保护实验

### 11.1 系统质量

检索和引文不能合并成一个“RAG 分数”。分别设置检索 Recall@K/MRR/nDCG、引用支持精确率/召回率、无证据拒答正确率、答案正确性、提示注入成功率、p95 延迟、成本/完成任务和工具失败率。阈值在冻结样本上建立 baseline 后预先设定，并按课程、语言和问题类型报告。

### 11.2 教学质量

离线对话 rubric 检查诊断、提示是否循序、是否过早给答案、反馈能否解释原因、是否依据作答调整，以及是否保持课程边界。LLM judge 可用于规模化回归，但必须以盲化人工抽检、评审一致性和失败样本复核校准；DeepTutor 的 human alignment 只能支持偏好排序相近，不能支持学习增益。[P2]

### 11.3 学习成效与研究门

在审批允许的真实试点中，可采用随机或交叉设计，对比“静态课程”“静态课程＋通用问答”“静态课程＋课程闭环 Tutor”。主要结果包括受保护的延迟后测和迁移任务；次要结果包括完成时间、提示依赖、帮助寻求、信心校准、流失、满意度和先备水平异质效应。若样本不足，只能称可用性/可行性试点；结果无论正负都报告，不能把“出现正向效果”设为退出条件。

## 12. 风险、缓解与停止条件

| 风险 | 为什么重要 | 主要缓解 | 触发停止/回退 |
|---|---|---|---|
| 状态型复杂度吞噬课程质量 | 当前静态平台与 DeepTutor 式后端是两类产品 | 双平面；一个英语 RAG 试点；预算与 SLO | 静态课程受影响、成本/故障超门即关闭 Tutor |
| 学习者误判被固化 | 一次错误不等于稳定误解 | 观察/推断分层、置信度、寿命、更正优先 | 无法提供事件级证据或删除传播即停长期状态 |
| 题目格式正确但教育错误 | 当前 QuestionPipeline 的 schema repair 不等于正确性 | Evidence/Correctness/Pedagogy gates＋人工抽样 | 无法唯一作答、无来源或 validator 分歧即不发布 |
| 多引擎扩大回归矩阵 | provider 语义、成本和引用结构不同 | 单一基线；按失败类型做 A/B | 无显著净收益或成本过门即保留基线 |
| 评测污染 | Tutor 看到后测/答案会制造虚假成绩 | 四数据域、访问控制、冻结与污染审计 | 发现泄漏即作废该轮结果并轮换受保护题 |
| 主动伙伴造成打扰或依赖 | 论文未验证 retention/打扰/学习结果 | 默认不做；未来可关闭、可调节节奏 | 负面体验、过度帮助或退出率上升即回退 [P2] |
| 许可和外部数据流 | Apache-2.0 仅覆盖其范围内代码 | LICENSE/NOTICE、SBOM、依赖/内容/模型/商标/隐私逐项审计 | 权利、地域、删除或供应商条款不清即不用 [D11] |

论文报告的 OQ 相对 Naive Tutor 提升 10.76% 值得作为代理质量结果关注，但绝不能改写为“学习提高 10.76%”。[P2]

## 13. 最终批准事项

建议只批准一个下一步：**以英语 RAG 课程固定版本为范围，完成课程学习契约、50–100 条检索黄金查询、20–30 个多轮 Tutor cases，以及匿名、无上传、无任意代码、无长期 Memory 的三模式隔离侧车；只有通过离线引文/教学/安全/成本门，才讨论账户、长期状态和真实学习研究。** DeepTutor 在此阶段是固定提交的参考与基准环境，不是生产依赖，也不是新的课程事实来源。

## 附录 A：主要证据来源

### DeepTutor 固定版本与官方材料

- [D1] HKUDS/DeepTutor v1.5.16 固定提交 README（学习表面、Book、KB、Memory）：[学习表面 L203–213](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/README.md#L203-L213)；[Book 输入、typed blocks 与暂停恢复 L568–578](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/README.md#L568-L578)；[KB 生命周期 L583–595](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/README.md#L583-L595)；[Memory L617–629](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/README.md#L617-L629)
- [D2] 当前版本与日期：[v1.5.16 发布页](https://github.com/HKUDS/DeepTutor/releases/tag/v1.5.16)
- [D3] 共享上下文、Tools/Capabilities 与专用管线边界：[AGENTS.md L1–71](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/AGENTS.md#L1-L71)
- [D4] provider、每 KB 单引擎与 embedding-signature 适用边界：[RAG factory L1–75](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/rag/factory.py#L1-L75)
- [D5] BM25＋向量 RRF：[LlamaIndex retriever L119–151](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/rag/pipelines/llamaindex/retrievers.py#L119-L151)
- [D6] embedding signature、`needs_reindex` 与结果元数据：[LlamaIndex pipeline L126–226](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/rag/pipelines/llamaindex/pipeline.py#L126-L226)
- [D7] 文件式 Memory、L2 稳定条目与删除、L3 文件级引用边界：[trace.py L1–67](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/memory/trace.py#L1-L67)；[document.py L1–33、L64–102](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/memory/document.py#L1-L102)；[L3 prompt L1–37](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/memory/consolidator/prompts/en/update_l3.yaml#L1-L37)
- [D8] Explore/Plan/Quiz 与结构检查：[QuestionPipeline overview](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/agents/question/pipeline.py#L1-L23)；[schema issue checks](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/agents/question/pipeline.py#L1358-L1416)
- [D9] proposal、spine、typed blocks、可空 anchors 与 best-effort RAG：[BlockType L59–83](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/book/models.py#L59-L83)；[SourceAnchor/Chapter L216–236](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/book/models.py#L216-L236)；[Block anchors L411–425](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/book/models.py#L411-L425)；[可选 RAG 与失败降级 L47–128](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/book/blocks/_rag_helpers.py#L47-L128)
- [D10] SYSTEM/APPLICATION/OFF：[Sandbox spec L16–40](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/sandbox/spec.py#L16-L40)
- [D11] 代码主体许可：[Apache-2.0 LICENSE](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/LICENSE)
- [D12] Mastery 持久路径、待答题、尝试、复习与启发式掌握度：[阶段、尝试、待答题与交互 L61–223](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/models.py#L61-L223)；[SQLite 持久化 L1–45](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/storage.py#L1-L45)；[复习调度 L13–98](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/scheduler.py#L13-L98)；[掌握度计算 L1–37](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/mastery.py#L1-L37)

### DeepTutor 论文

- [P1] *DeepTutor: Towards Agentic Personalized Tutoring*，v3（2026-07-09）：[arXiv 摘要页](https://arxiv.org/abs/2604.26962)
- [P2] 方法、TutorBench、消融、人类对齐与限制：[arXiv v3 PDF](https://arxiv.org/pdf/2604.26962)

### 本项目本地证据

- [L1] `README.md:1–7, 11–30, 72–120, 156–180`：项目定位、README 四门表、静态/隐私边界、英语 RAG、Agentic Engineering 主线与线上/本地分列要求。
- [L2] `next.config.ts:3–23`：`output: "export"` 与无常驻后端假设。
- [L3] `lib/progress.ts:1–52`：localStorage-only 进度。
- [L4] `lib/deepseek.ts:1–11, 76–122`、`components/lab/Lab.tsx:32–49, 85–142`：BYOK 模型通道与预设实验。
- [L5] `lib/rag/manifest.ts:9–278`、`lib/rag/types.ts:48–126, 273–320`：RAG 4 单元、12 课、34 concepts、40 sources 与证据契约。
- [L6] `components/rag/RetrievalLab.tsx:8–79`：确定性浏览器检索实验，而非平台实时 RAG。
- [L7] `lib/courses.ts:290–450, 510–554`：当前工作树的本地 `available`、Cursor `soon` 与在建入口。
- [L8] `course_review_2026-08-23/staging/AI应用工程课程_V3.1_非软件背景友好版/manifest.json`：S00–S10 草稿包与路由映射；本报告不把它当作已发布站点。
- [L9] `messages/cursor/en.json:581–618`：Cursor 候选 Lesson 13 的逐级提示、单轮行动、迁移、隐私与停止权设计种子。
- [L10] `lib/claude/manifest.ts:158–164`、`lib/grok/course.manifest.json:1–30`、`app/[locale]/grok/page.tsx:1–18`、`lib/courses.ts:303–463`：Claude 通用课为 `rights-gated`；Grok 有课程 manifest 与路由，但未列入 `TOP_LEVEL_COURSES`。

## 附录 B：复核说明

- DeepTutor 仓库核验基于固定提交，不把 GitHub 默认分支未来变化混入当前判断。
- 论文中的定量数字来自 v3 PDF；报告未把模拟学生或 LLM judge 结果表述为真实学习增益。
- 本项目核验针对 2026-08-23 当前工作树；远端生产状态为 `NOT_ASSESSABLE`，正文不把本地 `available` 写成已上线。
- 路线图周期是资源假设下的量级估算；指标门槛需在冻结样本建立 baseline 后预先设定，研究伦理/隐私审批与招募是外部依赖。
