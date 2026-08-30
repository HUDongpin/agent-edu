# Course 14 内容核验与纠错报告

**课程：** How Products Are Imagined, Designed, and Built in the Age of AI<br>
**网站：** aicourse.top<br>
**核验日期：** 2026-08-23<br>
**核验范围：** 14 个模块的正文、概念覆盖、来源映射、互动计算器、模块自测、结业测验、capstone、类型约束与发布校验<br>
**状态：** 已修正可确认错误；Course 14 专项开发与发布校验、专项 ESLint、Course 14 路由选择性 Next.js 生产构建均通过

## 一、结论

本轮不是对课程做表面润色，而是进行“主张—来源—教学边界—测验—实现”五层一致性审查。经修订后，Course 14 形成了一条可审计的产品管理主线：

> 客户与市场证据 → 战略与价值交换 → 机会与范围 → 指标与优先级 → 体验与需求 → AI 架构与评测 → 交付与治理 → 上市、实验与组织学习

课程目前包含：

- 14 个连续模块、4 个学习阶段、总学习时间 910 分钟；
- 14 个产品管理概念域与 16 个进度里程碑；
- 102 条带有 supports 与 boundary 的来源记录，其中 37 条来自 PMaker；
- 37 条 PMaker 记录全部改为英文 /en/ 路由；
- 14 道模块 checkpoint 与 14 道独立、综合型结业情境题；
- 14 项 capstone 可审计产物，包括产品运营知识库索引。

“内容正确”在这里不被理解为所有框架在任何组织中都具有唯一标准答案。课程明确区分了：

1. 规范性定义，例如 Scrum Product Owner、WCAG 2.2、NIST AI RMF、OWASP 2025；
2. 研究或统计边界，例如 cohort 不能单独证明因果、反复查看实验显著性会增加错误率；
3. 行业实践，例如 RICE、AARRR、Product Ops、GitLab 发布流程；
4. 本课程的教学约定，例如“最小可行产品必须保留必要的信任、无障碍、数据与支持边界”。

## 二、已确认并修正的关键问题

| 编号 | 原问题或风险 | 已完成的修正 | 主要核验依据 |
|---|---|---|---|
| 1 | PMaker 明细来源大多指向中文根路由，与指定的 pmaker.space/en 不一致 | 37 条 PMaker 来源全部切换为英文 /en/ 路由，并在 validator 中新增强制检查 | [PMaker English](https://pmaker.space/en/) |
| 2 | Scrum Product Owner 被不完整地描述成 Product Goal 与 Backlog 的 accountability，且漏掉最大化产品价值 | 改为 Scrum Guide 的完整责任边界：最大化产品价值，并对有效的 Product Backlog 管理负责，包括制定和明确沟通 Product Goal；同时把通用 PM 角色与 Scrum 角色分开 | [Scrum Guide](https://scrumguides.org/scrum-guide.html) |
| 3 | product triad、DACI/RACI 只出现在标签中，没有定义 | 明确定义 product/design/engineering 核心协作关系，并说明 DACI 与 RACI 的角色含义和局限 | [Atlassian DACI](https://www.atlassian.com/team-playbook/plays/daci) |
| 4 | diagnosis、guiding policy、coherent actions 未归属 Richard Rumelt | 明确标注 Rumelt strategy kernel，并在策略练习中要求同时提交 viability canvas | [Rumelt strategy kernel](https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights/the-perils-of-bad-strategy) |
| 5 | ICP、TAM/SAM/SOM、PMF 与 unit economics 只有术语清单，容易造成虚假精确 | 增加情境化定义、bottom-up 假设、单位/地域/时间/价格边界；unit economics 只选择适合商业模式的指标，并要求定义公式、cohort、窗口与成本范围 | [U.S. SBA market research](https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis) |
| 6 | 研究 consent 与 data minimization 只挂在 GOV.UK 总索引上，JTBD 未定义；M3 checkpoint 容易被读成普遍证据等级 | 改用 consent 与 participant privacy 直接页面；把 JTBD 定义为情境中的进步；题干收窄为“这些选项中的最强质性证据”，并明确不能估计 prevalence 或建立 causality | [GOV.UK consent](https://www.gov.uk/service-manual/user-research/getting-users-consent-for-research)、[GOV.UK research privacy](https://www.gov.uk/service-manual/user-research/managing-user-research-data-participant-privacy) |
| 7 | 质性综合标题把解释写成 causal story；MVP 未定义 | 改为 traceable explanatory hypothesis；把观察和解释分开；将 MVP 明确为本课程中的“能检验价值假设的最小、负责任且相对完整的产品切片” | [Opportunity Solution Trees](https://www.producttalk.org/opportunity-solution-trees/) |
| 8 | Product Goal、OKR 与 metric 混在同一层级；要求所有指标都有 numerator/denominator；cohort 被写成能显示变化是否持续 | 分开 Scrum Product Goal、Objective 与 Key Result；按 count/rate/percentile 选择适当计算定义；明确 funnel 与 cohort 是描述性分析，不能单独证明产品变更造成差异 | [What Matters OKR](https://www.whatmatters.com/resources/okr-glossary)、[Google funnel exploration](https://support.google.com/analytics/answer/9327974?hl=en)、[Google cohort exploration](https://support.google.com/analytics/answer/9670133?hl=en) |
| 9 | Kano、RICE、ICE、MoSCoW、WSJF 只被并排列名；RICE 计算器未明确 confidence 百分比换算和候选项可比条件 | 为每个框架增加用途/公式/局限；RICE 显示公式改为 Reach × Impact × (Confidence% ÷ 100) ÷ Effort，并强制强调共同人群、时间窗口、impact 标尺与 effort 单位 | [Intercom RICE](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/)、[SAFe WSJF](https://framework.scaledagile.com/wsjf/)、[Agile Business MoSCoW](https://www.agilebusiness.org/resource/what-is-moscow-prioritization/) |
| 10 | five-second test 被写成 recognition 测试，且容易被误解成 usability 或 demand 证明；所有 discovery 方法又被统一要求数值 success threshold | 改为只检验 first-impression comprehension，并明确不能证明 usability、value、retention、business viability 或 willingness to pay；探索方法改用与方法相称的 evidence standard、sampling rule、inference boundary 与 decision rule，只有适当设计才使用数值阈值 | [PMaker five-second test](https://pmaker.space/en/patterns/five-second-test.html)、[SVPG Four Big Risks](https://www.svpg.com/four-big-risks/) |
| 11 | 三段式 AI 编码任务被写成 context/task/acceptance boundary，与 PMaker 原定义不一致 | 统一改为 desired outcome、constraints、testable acceptance criteria，并要求包含相关 edge cases；PRD 与 coding-agent 模板同步修正 | [PMaker three-part prompt](https://pmaker.space/en/patterns/three-part-prompt.html) |
| 12 | RAG 被写成固定的 chunking/embedding/reranking/citation 技术栈；fine-tuning 与 freshness 的界线过于简化 | 把 RAG 定义为从索引或数据源检索相关信息并加入模型输入；关键词、语义、向量、混合检索、重排、授权过滤与引用按场景选择；fine-tuning 用于稳定行为/风格/格式/任务表现，而不是保持可追溯的新鲜事实 | [Microsoft Foundry RAG](https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation)、[Anthropic effective agents](https://www.anthropic.com/engineering/building-effective-agents) |
| 13 | golden set、agent trajectory、LLM judge、p50/p95、human takeover 与 cost per successful task 缺少可执行定义 | 改为可维护、版本化、有 holdout 与 contamination 边界的 representative evaluation suite；优先评分真实最终状态，只用 trajectory 检查必要不变量；为 task-success rate、latency percentile、takeover rate 与完整成本分母补充定义；model judge 必须用盲化人类标签校准并保留争议裁决 | [OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)、[Anthropic agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)、[Google SRE SLO](https://sre.google/sre-book/service-level-objectives/) |
| 14 | Scrum/Kanban、CI/CD 与 canary 只有术语；coding-agent 安全主张挂在不支持该主张的 PM 模板来源上 | 分开 Scrum 与 Kanban 的职责；定义 CI/CD 与 canary；编码代理增加文件系统、网络、secret 与 branch 最小权限，人工审查/合并、扫描、依赖检查与发布控制 | [Kanban Guide](https://kanbanguides.org/the-kanban-guide/)、[GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)、[Google SRE canary](https://sre.google/workbook/canarying-releases/)、[GitHub coding-agent risks](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations) |
| 15 | OWASP 使用旧入口与旧术语 insecure output handling；retrieval 被暗示成可信输入 | 锁定 OWASP 2025 taxonomy，改为 improper output handling；所有用户、检索、工具、文件与网页内容均作为不可信外部数据处理，加入 downstream authorization、隔离、验证、审批、预算、日志与恢复 | [OWASP 2025 Top 10](https://genai.owasp.org/llm-top-10/)、[OWASP Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)、[OWASP Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) |
| 16 | NIST AI RMF 与 GenAI Profile 混成一条；governance 将 consent/deletion 写成无条件通用义务；未真正教学 continuous evaluation、drift 与全系统 rollback | 拆分 NIST AI RMF 1.0 与 NIST AI 600-1；按适用 privacy basis 与具体义务表述；加入持续评测、质量衰退与分布 drift 的区别，以及 model/prompt/retrieval/tools/permissions/orchestration 的 last-known-good 配置 | [NIST AI RMF 1.0](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf)、[NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)、[Google Cloud AI operations](https://docs.cloud.google.com/architecture/deploy-operate-generative-ai-applications) |
| 17 | EU AI Act 只保留 2024 原始法案，无法代表 2026-08-23 的当前文本状态 | 同时保存 2024 authentic act 与 2026-07-27 consolidated documentation view；新增 law 来源类型，并明确 consolidated text 无独立法律效力、Official Journal authentic acts 优先 | [Original act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32024R1689)、[2026-07-27 consolidated text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02024R1689-20260727) |
| 18 | AARRR 的准确顺序与 PMaker 指向页不一致；PLG 与 growth loop 被混为一谈；发布阶段容易被理解成 alpha→beta→limited→GA 必经流程 | 显式归属 Dave McClure 的 Acquisition、Activation、Retention、Referral、Revenue；分开定义 PLG 与 loop；按风险和不确定性选择最小必要 staging，普通功能不必经过全部阶段 | [Dave McClure AARRR](https://www.slideshare.net/slideshow/startup-metrics-for-pirates-long-version/89026)、[Reforge PLG](https://www.reforge.com/blog/product-led-growth)、[Reforge growth loops](https://www.reforge.com/blog/growth-loops)、[GitLab development flow](https://handbook.gitlab.com/handbook/product-development/how-we-work/product-development-flow/) |
| 19 | “Avoid peeking” 未区分未经校正的 efficacy peeking 与持续 safety/data-quality monitoring | 明确预先定义 randomization unit、primary/OEC、guardrails、power/MDE、duration 与 analysis；持续监控安全和数据质量，但不得根据未经校正的重复观察宣告 efficacy，必须使用有效 sequential method 或预定期限 | [Microsoft trustworthy experimentation](https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-during-experiment-stage/) |
| 20 | Product Ops 被普遍缩减为知识库；M14 承诺 operating repository，却没有在练习、模板与 capstone 中闭环 | 把 Product Ops 说明为流程、工具、数据与复用知识的 operating capability；知识库只是一个实现；新增 owner/status/decision/last-review/next-review 的 repository index，并纳入 capstone | [Productboard Product Operations](https://www.productboard.com/glossary/product-operations/) |
| 21 | 结业测验直接复用 14 道模块 checkpoint，无法独立证明综合判断 | 新增 14 道跨概念情境题；validator 强制数量、ID、题干与选项唯一性、答案索引、14 模块标题一一覆盖，以及不得与 checkpoint 题干重复 | 课程实现与离线 validator |

## 三、经核验可保留的内容

以下内容在来源边界内成立，未发现需要反向修改：

- WCAG 2.2 所涉及的键盘操作、焦点、名称与标签、对比度、媒体替代、错误识别、响应式与 reflow 方向正确；课程同时说明 conformance 不能取代残障用户研究。[W3C WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- workflow 与 agent 的基本区分成立：workflow 使用预定义路径，agent 动态选择过程与工具；课程继续要求先用能完成任务的最简单、可观察架构。[Anthropic effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- AI 输出被定位为候选证据、方案或草稿，而不是自动获得客户真实性、责任或决策权。
- GitLab 的 portfolio budgeting、tiering/pricing 与 deprecation 证据链各自绑定到它们真正支持的主张，没有再由通用 delivery 工具页面代替。
- 模块 checkpoint 的 14 个 correctIndex 均与 explanation 一致，每题均有唯一最佳答案。

## 四、结业测验完整性

结业测验现在不再由 CourseDashboard 动态复制各模块 checkpoint，而是读取课程 copy 中的独立 questions 数据：

- 恰好 14 题，每个模块对应 1 题；
- 每题 4 个互不重复选项；
- 每题只有 1 个最佳答案；
- 14 个 ID 与题干唯一；
- 题干不与任何模块 checkpoint 重复；
- 通过线仍为 80%，14 题计分时至少需答对 12 题；
- 题目覆盖证据冲突、战略与经济边界、guardrail、RICE 约束、实验推断、失败状态、PRD edge cases、AI architecture、agent delivery、prompt injection、launch readiness 与 efficacy peeking。

## 五、时间敏感来源处理

- OpenAI 的 evaluation methodology 仍被用来支持任务化评测设计，但其 legacy Evals dashboard/API 已公布迁移和停用时间：现有 evals 计划于 2026-10-31 只读，dashboard/API 计划于 2026-11-30 关闭。课程不绑定该平台实现。[OpenAI deprecations](https://developers.openai.com/api/docs/deprecations#2026-06-03-evals-platform)
- OWASP 来源固定到 2025 taxonomy，避免把 2023–24 的编号和名称混入当前课程。
- NIST AI RMF 1.0 与 GenAI Profile 分开记录；AI RMF 1.0 当前处于修订过程，因此 source boundary 要求未来发布时重新检查。
- EU AI Act 同时保留 authentic original act 与截至 2026-07-27 的 consolidated documentation view，并明确二者的法律地位不同。

## 六、验证结果

| 验证 | 结果 | 说明 |
|---|---|---|
| npm run product-management:check | PASS | 14 modules、4 phases、910 minutes、14 concept domains、16 milestones、102 sources |
| npm run product-management:check:release | PASS | Course 14 独立发布门禁通过 |
| Course 14 scoped ESLint | PASS | lib/product-management、components/product-management、Course 14 routes 与 release checker 无 ESLint 错误 |
| Course 14 selective Next build | PASS | Next.js 16.3.1 完成编译与全项目 TypeScript 检查，并生成 Course 14 的 137 个静态页面 |
| npx next build（最终全站复跑） | BLOCKED，非 Course 14 回归 | TypeScript 已通过；预渲染被 Agent Orchestration 课程的既有/并行变更校验阻断：3 个 zh-Hans source mapping 问题及 1 个英文 critical path 缺词 |
| npm run lint（全仓库） | FAIL，非 Course 14 回归 | 被既有的 5 个无关错误阻断，位置包括 course/stage8-security/run.ts、lib/flowchart.ts、lib/handbook/behaviour.ts；本轮未越权修改 |

## 七、仍然明确保留的边界

1. 本轮验证显著提高了课程的定义精度、来源匹配、版本透明度与测验完整性，但不能实证证明“世界第一”或保证所有组织采用后都会获得同样结果。
2. 课程主要面向数字软件与 AI-enabled products；硬件、医药、金融、公共安全及其他强监管产品必须增加行业专门的 discovery、quality、clinical/safety、legal 与 assurance 要求。
3. 长篇教学正文当前只有英文经过内容审查；其他语言路由只承载已本地化的导航/目录信息与清晰的英文内容提示。
4. 法律、模型能力、API、平台弃用、价格、数据条款、标准与行业做法具有时效性。重要现实决策必须重新核验当前一手来源。
5. 自动化静态校验与生产构建不能取代真实学习者的可用性测试、教学有效性研究、无障碍人工评估或领域专家审查。

## 八、发布判断

从内容准确性与实现一致性看，Course 14 已达到可发布状态：主要定义错误已修正，关键主张具有直接来源与可见边界，互动工具与教学公式一致，capstone 产物闭环，结业测验能够独立检验综合产品判断。

建议后续把本报告作为版本化 release evidence 保留，并在 OWASP、NIST、OpenAI、EU AI Act 或 PMaker 内容变化时重新运行相同核验流程。
