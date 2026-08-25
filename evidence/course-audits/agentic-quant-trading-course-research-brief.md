# aicourse.top Course 17《智能体赋能量化交易》研究简报

- 文档状态：实施前研究快照与当前本地验收附录；不是线上发布证明、投资建议、收益承诺、经纪服务或实盘部署授权
- 来源快照日期：2026-08-26（Asia/Taipei）
- 课程编号：Course 17
- 课程边界：12 modules、4 phases，终点严格限制为**断网、本地、确定性的合成回放**；不连接第三方模拟盘或实盘
配套权威溯源：[agentic-quant-trading-course-research-brief.provenance.md](./agentic-quant-trading-course-research-brief.provenance.md)

## 1. 建设决定

Course 17 不应被包装成“AI 自动赚钱”课程。它教授的是一条可审计、可复现、可停止的智能体量化研究链：

```text
来源与时点合同
  → 可证伪的策略规格
  → 有角色边界的研究智能体
  → 可复现回测与反泄漏审计
  → 风险门控和人工批准
  → 纯本地、确定性的合成回放与对账
```

学员完成课程时，应能交付一个不接触真实资金、账户、凭证或远程端点的量化研究与本地合成回放档案，并证明：

1. 每个信号只使用决策时点真实可得的数据；
2. 每个研究主张能回到 GitHub、官方文档、论文或 X 原帖及其第一方交叉证据；
3. 回测记录全部尝试，而不是只展示最佳参数；
4. 语言模型不能绕过确定性订单校验、风险限额和人工批准；
5. 系统在数据陈旧、超限、重复下单或组件异常时会停止；
6. 最终执行只发生在不联网的本地合成回放器中；课程不连接任何券商账户，不接受券商凭证，也不存在 live-trading 开关或实盘晋级作业。

GitHub 是实现主证据；论文和监管/标准材料界定方法与风险；X 原帖只提供项目方当时如何描述产品或工作流的行业现场。X 的浏览量、点赞、收益截图和第三方宣传不构成策略有效性证据。

## 2. 课程编号与发布边界

### 2.1 Course 16 连续编号门与当前本地状态

研究启动时，课程注册表只到 Course 15；这条历史观察说明了为何需要连续编号门。到 2026-08-26，当前实现保留 Course 16 Responsible AI，并新增唯一的 `displayNumber: 17` 对应 `agentic-quant-trading`；其他课程定义保持不变。

当前本地证据包括：Course 17 专项内容闸门、Course Kit 发布闸门、Course Kit 合同测试、TypeScript、定向 ESLint、进度合同、证据覆盖与 i18n key 检查均通过；Course 17 首页及 12 个模块已进入 SEO page list 和 sitemap。完整仓库发布脚本仍会被基线 Codex 课程缺少真实 UI 截图的既有闸门阻断；这与 Course 17 的课程闸门分开报告。任何本地状态都不等于 `aicourse.top` 生产环境已部署。

### 2.2 产品决策边界

本成果只定义此功能实现中的 Course 17《智能体赋能量化交易》。因此：

- 本简报对 Course 17 的编号主张只适用于此功能实现；
- 是否把该实现合并为生产路线，是后续产品决策，不是本地实现自动获得的权限；
- Course 17 只教授量化研究所需的 bounded evidence ledger、数据时点核验和实验留痕，不教授系统综述、PRISMA、定性编码或“一键生成论文”；
- Course 17 的 capstone 是本地合成回放研究档案，不是论文、系统综述、投资报告或证券推荐。

## 3. 四阶段、十二模块合同

每阶段三模块；每个模块必须产出可检查 artifact。完成视频、阅读页面或运行一次 notebook 不能单独计为通过。

### 3.0 研究标签与最终路由 slug 对照

下文表格保留研究阶段的内容标签；实现采用更短、稳定且与课程 UI 一致的 route slug，并按学习顺序重组相邻内容。它们不是两套课程，映射也不必机械地一一对应：

| # | 最终 route slug | 研究阶段标签 |
|---:|---|---|
| 1 | `scope-safety-autonomy` | `scope-ethics-market-mechanics` |
| 2 | `market-data-time-contracts` | `point-in-time-data-provenance` |
| 3 | `agent-architecture-authority` | `agent-roles-state-and-tools` |
| 4 | `hypotheses-experiment-ledger` | `falsifiable-strategy-specification` + `hypothesis-to-code-rd-loop` |
| 5 | `features-labels-text-signals` | `grounded-market-research` |
| 6 | `backtest-leakage-costs` | `backtest-engine-execution-semantics` + `leakage-overfitting-red-team` |
| 7 | `evaluation-uncertainty-overfitting` | `leakage-overfitting-red-team` + `risk-uncertainty-stress-testing` |
| 8 | `multi-agent-debate-verification` | `agent-roles-state-and-tools` + `grounded-market-research` 的结构化反方核验 |
| 9 | `portfolio-risk-deterministic-gates` | `risk-uncertainty-stress-testing` + `human-approval-risk-gates-kill-switch` 的 pre-trade 部分 |
| 10 | `paper-execution-reconciliation` | `paper-broker-orders-and-reconciliation` |
| 11 | `monitoring-kill-switch-incidents` | `human-approval-risk-gates-kill-switch` |
| 12 | `capstone-auditable-paper-desk` | `auditable-paper-trading-capstone` |

最终实现将研究阶段相邻内容重新切分为“数据与权限 → 实验与信号 → 评估与风险 → 模拟执行与运营”，但不删除任何研究要求；发布检查以最终 route slug、模块 artifact 和来源绑定为准。

| Phase | 目的 | Modules | 阶段闸门 |
|---|---|---|---|
| I. Evidence & Market-Time Contract | 把“想交易什么”改写为可核验问题、数据和决策时点 | M1–M3 | 策略规格、来源台账、point-in-time 数据合同通过 |
| II. Agentic Research Workflow | 用有职责边界的智能体提出、实现、反驳和记录假设 | M4–M6 | 每个智能体有输入/输出 schema、工具权限、失败条件和 trace |
| III. Backtesting & Adversarial Validation | 证明系统没有靠未来信息、多重试验或不现实成交条件美化结果 | M7–M9 | leakage red-team、样本外评估、成本/容量/压力测试通过 |
| IV. Governed Synthetic Replay | 在纯本地回放器中处理经人工批准、可停止、可对账的合成意图 | M10–M12 | 本地回放、kill-switch 演练和 capstone dossier 通过 |

### 3.1 模块—证据—产物映射

| # / module | 学习结果与稳定主张 | 技术主证据 | 必交 artifact | 不可越过的边界 |
|---:|---|---|---|---|
| 1 `scope-safety-autonomy` | 区分研究、信号、订单、成交、持仓、PnL 和建议；定义自主性与禁行边界 | `nist-ai-rmf`, `sec-ai-investment-fraud`, `finra-auto-trading-risk`, `finra-algorithmic-trading`, `sec-market-access-rule-faq` | 模拟研究台授权书与禁行事项登记表 | 不教收益承诺、复制交易、代客下单；不使用真实资金或真实账户 |
| 2 `market-data-time-contracts` | 保存事件、可得、抓取和决策时间、版本、provider、许可与 checksum；强制 `available_at <= decision_at` | `github-qlib`, `github-openbb`；X 版本观察 `x-openbb-workspace-mcp-2026` | 时点一致的数据契约与血缘表 | 当前成分、重述财报、事件后结局与模型记忆都可能泄漏未来信息 |
| 3 `agent-architecture-authority` | 拆分 researcher、developer、critic、risk reviewer 与 approver；工具按最小权限授权 | `github-rd-agent`, `github-tradingagents`；X 版本观察 `x-didier-openbb-codex-2026` | 带类型的智能体图与工具权限矩阵 | 多智能体共识不等于正确；模型不得拥有 broker write 权限 |
| 4 `hypotheses-experiment-ledger` | 回测前写可证伪假设、预注册搜索空间和拒绝条件；保留全部候选与失败 | `github-rd-agent`, `paper-backtest-overfitting`；两条 X 仅作版本观察 | 假设卡与只追加实验台账 | 自动搜索会扩大 multiple testing；查看测试结果后修改即产生新试验 |
| 5 `features-labels-text-signals` | 把数值、文本和情绪转成带时点、来源与标签定义的候选特征 | `github-fingpt`, `github-openbb`, `github-qlib` | 特征—标签规格与文本信号证据卡 | 情绪不是事实，NLP 准确率不是价格预测或 alpha |
| 6 `backtest-leakage-costs` | 建模日历、延迟、价差、滑点、手续费和拒单；检测 look-ahead 与不现实成交 | `github-backtesting-py`, `github-vectorbt`, `github-freqtrade`, `github-lean`, `github-backtrader`, `paper-backtest-overfitting` | 因果回测规格与泄漏测试套件 | 模拟成交不是现实保证；零成本、无限流动性或同 bar 偷看结果不得称为可部署表现 |
| 7 `evaluation-uncertainty-overfitting` | 锁定样本外区间，报告试验次数、分布、回撤、换手、成本与未知项 | `paper-backtest-overfitting`, `github-qlib`, `github-finrl`；X 仅作研究方向观察 | 评估协议、不确定性表与模型选择台账 | 单一 holdout 或最佳 Sharpe 不消除选择偏差，也不保证未来表现 |
| 8 `multi-agent-debate-verification` | 用结构化正反论证、逐项 evidence verdict 和人工裁决检验主张 | `github-tradingagents`, `github-rd-agent` | 主张—证据图与已裁决辩论记录 | 辩论不会自动消除幻觉、共享数据错误或非确定性 |
| 9 `portfolio-risk-deterministic-gates` | 用不可由模型修改的 size、exposure、staleness、rate 和 default-deny 规则门控合成意图 | `github-finrl`, `github-finrl-x`, `github-freqtrade`, `nist-ai-rmf`, `finra-algorithmic-trading`, `sec-market-access-rule-faq` | 风险政策、黄金 fixtures 与门禁决策日志 | 监管材料仅作工程背景；风险指标与规则通过不等于合规或实盘批准 |
| 10 `paper-execution-reconciliation` | 不使用账户或凭证；在断网、本地确定性回放器中保存合成意图、成交状态与对账 | `github-backtesting-py`, `github-freqtrade`, `github-alpaca-py`；X 仅作外部能力警示 | 本地回放意图状态机与对账报告 | 第三方 paper/live 能力只界定排除项；课程不得连接账户、接受 key 或提供模式切换 |
| 11 `monitoring-kill-switch-incidents` | 数据陈旧、超限、重复意图或 schema 失败时阻止新动作、保全证据并要求具名人类处置 | `nist-ai-rmf`, `finra-auto-trading-risk`, `finra-algorithmic-trading`, `sec-market-access-rule-faq`, `sec-ai-investment-fraud` | 监控地图、紧急停止测试与事故手册 | human-in-the-loop 不能是默认同意；自动全部平仓不是所有故障的通用响应 |
| 12 `capstone-auditable-paper-desk` | 交付 source→feature→signal→decision→approval→synthetic intent→synthetic fill→illustrative PnL 的可逆追踪、局限与复盘 | `github-openbb`, `github-qlib`, `github-rd-agent`, `github-backtesting-py`, `nist-ai-rmf` | 八项产物组成的可审计模拟研究台档案 | 结课只证明受控教学系统达标；不证明盈利、适合实盘、符合法律或可管理他人资金 |

## 4. GitHub 技术主证据及教学用途

| Evidence | 项目能力 | 课程采用方式 | 必须保留的边界 |
|---|---|---|---|
| `github-qlib`, `github-openbb` | 数据处理、provider 接入、时点、模型、回测与研究记录 | 研究流水线、数据契约和来源血缘参照 | 框架能力不证明数据正确、策略有效或生产合规 |
| `github-rd-agent`, `github-tradingagents` | 研究—开发—验证循环与多角色智能体结构 | 实验台账、权限分离、反方论证和人工裁决 | 自动研究与多角色共识都可能放大搜索、执行、泄漏和一致地犯错 |
| `github-fingpt` | 金融 NLP、情绪、实体、关系与 RAG 示例 | 仅作有时点、有来源的候选文本特征 | 模型和数据权利另审；NLP benchmark 不等于交易预测 |
| `github-backtesting-py`, `github-backtrader`, `github-lean` | 事件驱动策略、broker abstraction、订单处理和成交记录 | 对照回测语义、成本、状态机与可审计 ledger | 模拟器不是交易所；广泛功能也不证明策略可部署 |
| `github-vectorbt` | 多资产、多参数向量化研究 | 参数敏感性与搜索规模教学 | 搜索速度会同步放大过拟合，且向量语义不必然等同事件执行 |
| `github-finrl`, `github-finrl-x` | 强化学习环境、数据—策略—组合接口 | 教授状态/动作/奖励、切分和风险叠加 | 奖励增长、单 seed、历史利润和生产定位都不证明稳健 alpha |
| `github-freqtrade` | 回测、look-ahead/recursive analysis 与 dry-run 工作流 | 泄漏故障检查与外部执行边界材料 | 加密市场行为不能泛化；官方亦警告回测不准确风险 |
| `github-alpaca-py` | 外部行情、订单和账户状态 API surface | 只用于定义明确排除的账户/凭证/远端执行边界 | SDK 不是策略或风控；paper fill 不复现实盘 |

13 个仓库在课程 source registry 中均已保存 canonical URL、owner、许可证、accessed date、40 位 commit SHA、可支持主张、禁止外推和复核触发器；详见配套权威溯源。GitHub star/fork 数不进入证据权重。

## 5. 六条已核验 X 原帖

X 原帖的正文可能因登录、地区或反爬限制无法稳定展示。下表只保留可定位的原帖 URL、账号和日期，并用官方博客、GitHub 或 arXiv 交叉验证。日期由帖子 ID 还原，均早于来源快照日。

| ID | 账号 / 日期 / 原帖 | 可用于课程的实际表述 | 官方交叉证据 | 不能支持 |
|---|---|---|---|---|
| X01 | OpenBB `@openbb_finance`，2026-05-26，[原帖](https://x.com/openbb_finance/status/2059380084612440390) | 长运行金融智能体需要数据权限、血缘、安全边界和可复用工件；Workspace MCP 可让 agent 做组合风险评估并把结果写回工作台 | [OpenBB Workspace MCP](https://openbb.co/blog/introducing-workspace-mcp/) | 不支持策略收益、风险控制已完备或所有机构可安全自治 |
| X02 | Didier Lopes `@didier_lopes`，2026-05-13，[原帖](https://x.com/didier_lopes/status/2054654792312488438) | 展示 Codex 与金融 Workspace 端到端交互，并强调 enterprise controls/governance | [OpenBB Workspace MCP](https://openbb.co/blog/introducing-workspace-mcp/)中的 Codex demo | 创始人演示不是独立性能评测或合规认证 |
| X03 | Alpaca `@AlpacaHQ`，2026-04-23，[原帖](https://x.com/AlpacaHQ/status/2047307001307316247) | Trading API CLI 可供终端和 AI agent 使用，支持 100+ 功能并快速进入 paper trade | [Alpaca CLI 官方发布](https://alpaca.markets/blog/alpaca-introduces-cli-for-trading-api/)确认 108 项和模拟交易、安全注意事项 | 不支持免人工确认、无风险实盘或 CLI 自动盈利 |
| X04 | AI4Finance Foundation `@AI4FinanceFound`，2026-06-16，[原帖](https://x.com/AI4FinanceFound/status/2066883676290613608) | 将 FinRL-X 定位为开源、AI-native 的量化交易基础设施，并报告其 PAKDD 2026 展示动态 | [FinRL-X paper](https://arxiv.org/abs/2603.21330)、[GitHub](https://github.com/AI4Finance-Foundation/FinRL-Trading) | 项目发布与奖项不证明课程策略或学员策略有效 |
| X05 | AI4Finance Foundation `@AI4FinanceFound`，2025-02-18，[原帖](https://x.com/AI4FinanceFound/status/1891873143804813379) | 介绍 FinRL-DeepSeek：把 LLM 信号融入 risk-sensitive RL trading agents | [论文](https://arxiv.org/abs/2502.07393)、[代码](https://github.com/benstaf/FinRL_DeepSeek) | 论文只做 Nasdaq-100 历史回测，不能外推实盘、其他市场或未来状态 |
| X06 | OpenBB `@openbb_finance`，2025-04-17，[原帖](https://x.com/openbb_finance/status/1912938049102913666) | 推荐从 Excel/notebook 转向模块化、可共享、可审计、可复现的 agent-ready 宏观研究工作流 | [OpenBB 官方文章](https://openbb.co/blog/from-excel-to-agents-rebuilding-the-macro-research-workflow-for-the-ai-era/) | 文章是工作流案例，不证明任何宏观预测或交易收益 |

发布时建议使用“双来源”格式：X 原帖作为项目当时的公开表述，紧邻官方技术来源作为架构、算法和边界依据。若 X 正文无法在用户浏览器显示，课程主张仍必须能由交叉来源独立成立。

## 6. 回测、时间泄漏与过拟合合同

### 6.1 强制时间字段

所有研究输入至少保存：

```text
event_time        事件发生时间
published_at      来源首次公开时间
available_at      教学系统实际可获得时间
retrieved_at      本次抓取时间
decision_at       策略形成决策时间
submitted_at      模拟订单提交时间
filled_at         模拟成交时间
source_version    来源/数据版本
```

核心不变量是 `available_at <= decision_at < submitted_at <= filled_at`。财报修订、新闻更新、X 删除/编辑、指数成分变化和模型训练知识都要单独处理，不能用抓取时间替代首次可得时间。

### 6.2 必测失败类型

- look-ahead：使用决策后信息，或用同一 bar 的收盘信号假设按同一收盘成交；
- survivorship：历史 universe 只含后来存活的资产；
- revision leakage：使用后来重述的财务值；
- label overlap：训练与测试样本的持有区间交叠；
- LLM memorisation：模型可能见过旧事件及其结果；
- test-set reuse：查看最终测试后继续修改提示词、参数或代码；
- multiple testing：大量策略/提示/模型尝试后只报告赢家；
- execution fantasy：忽略价差、滑点、拒单、容量、借券和交易日历；
- mutable sources：今天运行旧交易日期时却读到今天的新闻/社交内容；
- non-determinism concealment：只展示一次有利的 LLM/随机种子运行。

### 6.3 报告最低字段

每个策略结果必须同时报告：样本区间和切分、universe 形成方式、试验次数、benchmark、成本假设、换手、最大回撤、波动/尾部指标、暴露、容量限制、多次运行分布、样本外结果、失败情景和已知未验证项。没有这些字段时，只能标记为“教学演示”，不能称“验证通过”。

## 7. 风险控制、人类审批与 kill switch

### 7.1 确定性控制优先于模型意见

语言模型可以生成研究建议，但以下控制必须由可测试代码执行：symbol allowlist、市场状态、price/size/notional、position/exposure、leverage、staleness、duplicate/idempotency、order rate、daily loss、drawdown 和 broker response 校验。模型不能修改或绕过阈值。

### 7.2 逐单审批卡

每笔模拟订单必须向人显示：标的/市场、方向、订单类型、数量/名义金额、价格约束、当前及成交后暴露、成本与滑点估计、最坏情景、数据时间、模型/策略/提示版本、支持与反方证据、触发的风险规则、审批人和时间。无显式批准则不提交；不得超时自动同意、批量默认同意或永久白名单。

### 7.3 Kill switch

触发条件至少覆盖：数据陈旧/缺失/冲突、单笔或累计暴露超限、订单速率异常、重复订单、日亏损/回撤阈值、滑点异常、broker 拒绝/断连、schema 失败、未经批准的模型/提示/数据源变更。

默认动作顺序：

1. 阻止所有新订单；
2. 取消未成交模拟订单；
3. 保存不可变状态、工具调用、审批和 broker 回执；
4. 告警并要求指定人员处理；
5. 是否平仓由预先批准的情景规则决定，不能把自动全部平仓作为所有故障的通用默认；
6. 恢复必须由不同于触发 agent 的人显式批准，并形成 postmortem。

这些工程控制借鉴 NIST AI RMF、SEC Market Access Rule 和 FINRA algorithmic trading 指引，但课程必须说明具体法规的适用主体和法域不同；引用监管材料不等于对学员或网站给出法律结论。

## 8. 评估与 capstone 验收

### 8.1 四阶段闸门

- Gate I：来源 ledger、时点不变量和策略规格的 gold tests 全部通过；
- Gate II：所有 agent 有 schema、权限、trace、超时、失败和人工升级路径；
- Gate III：故障注入能抓住至少 8 类偏差，最终样本外区间保持锁定；
- Gate IV：本地合成回放器完成意图状态机、逐条批准、对账和 kill-switch 恢复演练。

### 8.2 Capstone dossier

必须包含：

- scope/disclaimer 与 prohibited uses；
- data card、source ledger、rights 和 point-in-time contract；
- strategy card、agent graph、tool permissions 和 prompts/version receipt；
- 完整 experiment registry，包括失败试验；
- leakage tests、成本模型、样本外/压力测试和风险报告；
- synthetic intent/fill ledger、人工审批记录、三方本地对账、kill-switch 演练；
- 从 source → feature → signal → decision → approval → order → fill → paper PnL 的双向追踪；
- limitations、residual risks、未验证项和 postmortem。

页面只显示“通过教学验收”，不得显示“可实盘”“策略获批”“合规”“稳定盈利”或类似 badge。

## 9. 禁止主张

课程、目录卡、SEO、图表、讲义和营销材料均禁止：

- “AI 自动赚钱”“稳定盈利”“稳赚”“躺赚”“睡后收益”；
- “击败市场”“战胜华尔街”而无预先注册、完整试验数和独立样本外复现；
- “多智能体消除了幻觉/偏差/风险”；
- “高 Sharpe 或低回撤证明策略有效”；
- “回测结果等于未来收益”或“paper trading 等于实盘”；
- “接上 MCP/CLI 即可安全自动交易”；
- “开源”“高 star”“官方项目”“获奖”因此就是生产级、合规或可盈利；
- 将第三方 X 贴、搜索摘要、RAG 片段、收益截图或排行榜当作事实和绩效证据；
- 暗示课程提供个性化证券建议、代客理财、信号订阅、复制交易或真实资金管理；
- 在界面中收集真实 broker secret，提供 live/paper 切换，或指导移除人工确认。

允许的表述是：“构建受控的智能体量化研究与本地合成回放工作流；学习识别时间泄漏、回测过拟合、执行风险和治理边界。”

## 10. 发布验收清单

- [x] 当前本地 Course 16 使用 `displayNumber: 16`；Course 17 为 17，课程编号连续且无重复。
- [x] Course 17 恰好 12 modules / 4 phases；所有 module 有 artifact 和 failure path。
- [x] Course 17 的教学执行路径限定为不联网的本地合成回放器；不接受券商账户、凭证或 live key。
- [x] Course 17 注册范围限定在此功能实现；其他课程定义保持不变。
- [x] 13 个 GitHub 来源全部钉定 40 位 commit SHA/明确 tag；6 条 X 原帖均有第一方交叉来源；accessed date 为 2026-08-26。
- [ ] 所有收益图同时显示成本、benchmark、样本外、试验次数和“模拟结果不代表未来”。
- [ ] leakage、survivorship、revision、LLM memorisation、multiple testing 和 mutable-source fixtures 可重复运行。
- [ ] 人工审批不能被跳过；kill switch 能被测试、记录和恢复。
- [x] 英文与简体中文正文完整表达仅限合成回放、非投资建议和禁止主张；其余 locale 明示英文回退。
- [ ] 基线 Codex 截图发布闸门、完整 `next build`、冻结静态导出、生产证据、干净提交与线上 URL 核验全部通过后，才可称 `aicourse.top` 已发布 Course 17。

若任一项未通过，只能报告“研究简报/局部实现完成”，不能报告课程发布或 aicourse.top 已上线。
