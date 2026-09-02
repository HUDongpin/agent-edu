# aicourse.top Course 17《智能体赋能量化交易》研究简报

- 文档状态：实施前研究快照与当前本地验收附录；不是线上发布证明、投资建议、收益承诺、经纪服务或实盘部署授权
- 来源快照日期：2026-08-26（Asia/Taipei）
- 课程编号：Course 17
- 课程边界：12 modules、4 phases；随课本地包严格限制为**本地合成 fixture 合同自检**，不执行策略、order、fill、replay、绩效或市场动作，也不连接任何外部 paper/sandbox/live 账户
配套权威溯源：[agentic-quant-trading-course-research-brief.provenance.md](./agentic-quant-trading-course-research-brief.provenance.md)

## 1. 建设决定

Course 17 不应被包装成“AI 自动赚钱”课程。它教授的是一条可审计、可复现、可停止的智能体量化研究链：

```text
来源与时点合同
  → 可证伪的策略规格
  → 有角色边界的研究智能体
  → 时间顺序回测规格与反泄漏审计
  → 风险门控和人工批准
  → 具名人类复核 + 纯本地合成 fixture 合同自检
```

学员完成课程时，应能交付一个不接触真实资金、外部 paper/sandbox/live 账户、凭证或远程端点的量化研究档案，并用随课 fixture 自检证明其本地合成输入、时间合同与声明式政策形状满足最低结构约束。该自检不是策略运行器、订单/成交模拟器、回放器、绩效引擎或风控执行器。

1. 每个信号只使用决策时点真实可得的数据；
2. 每个研究主张能回到 GitHub、官方文档、论文或 X 原帖及其第一方交叉证据；
3. 回测记录全部尝试，而不是只展示最佳参数；
4. 课程设计要求确定性规则和经受保护通道或固定公钥签名验证、绑定 exact-intent SHA-256 的具名人类批准优先于模型意见；随课风险政策是声明式模板，不冒充已执行控制；
5. 学员能把数据陈旧、超限、重复意图或 schema 异常写成 fail-closed 条件与事故演练，但随课包不发送、取消或成交任何订单；
6. `fixture-contract-self-test.py` 只读取随课本地合成文件并输出合同检查回执；它没有网络客户端路径，但不证明操作系统已断网，也不接受账户、凭证、端点或任何市场操作。

来源注册表共 27 条：13 个 GitHub 技术主证据、6 条仅作 version-watch 的 X 原帖、8 条论文或官方/监管/标准材料。GitHub 是实现主证据；论文和监管/标准材料界定方法与风险；X 原帖只记录项目方在特定日期如何描述产品或工作流，不进入模块根来源、测验或 capstone 证据链。X 的浏览量、点赞、收益截图和第三方宣传不构成策略有效性证据。

## 2. 课程编号与发布边界

### 2.1 Course 16 连续编号门与当前本地状态

研究启动时，课程注册表只到 Course 15；这条历史观察说明了为何需要连续编号门。到 2026-08-26，当前实现保留 Course 16 Responsible AI，并新增唯一的 `displayNumber: 17` 对应 `agentic-quant-trading`；其他课程定义保持不变。

当前本地证据包括：Course 17 专项内容闸门、Course Kit 发布闸门、Course Kit 合同测试、TypeScript、定向 ESLint、进度合同、证据覆盖与 i18n key 检查均通过；Course 17 首页及 12 个模块已进入 SEO page list 和 sitemap。完整仓库发布脚本仍会被基线 Codex 课程缺少真实 UI 截图的既有闸门阻断；这与 Course 17 的课程闸门分开报告。任何本地状态都不等于 `aicourse.top` 生产环境已部署。

### 2.2 产品决策边界

本成果只定义此功能实现中的 Course 17《智能体赋能量化交易》。因此：

- 本简报对 Course 17 的编号主张只适用于此功能实现；
- 是否把该实现合并为生产路线，是后续产品决策，不是本地实现自动获得的权限；
- Course 17 只教授量化研究所需的 bounded evidence ledger、数据时点核验和实验留痕，不教授系统综述、PRISMA、定性编码或“一键生成论文”；
- Course 17 的 capstone 是具名人类评审的本地合成研究档案；随课包只提供 fixture-contract self-test，不生成策略、订单、成交、回放、PnL 或绩效结果。capstone 不是论文、系统综述、投资报告或证券推荐。

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
| 10 | `paper-execution-reconciliation` | 本地合成意图、人工批准与对账规格（不连接外部 paper/sandbox） |
| 11 | `monitoring-kill-switch-incidents` | `human-approval-risk-gates-kill-switch` |
| 12 | `capstone-auditable-paper-desk` | `auditable-paper-trading-capstone` |

最终实现按运行时定义切分为“授权、数据与权限 → 研究、信号与回测 → 评估、智能体与风险 → 本地合成执行、运营与结课项目”；发布检查以最终 route slug、模块 artifact 和来源绑定为准。第四阶段中的执行/对账是学员必须设计并接受评审的课程规格，不代表随课 fixture 包内存在执行器或回放器。

| Phase | 目的 | Modules | 阶段闸门 |
|---|---|---|---|
| I. Mandate, data, and authority / 授权、数据与权限 | 把“想交易什么”改写为受边界约束的研究问题、时点数据合同与最小权限智能体图 | M1–M3 | 研究台宪章、来源台账、五时钟数据合同和权限威胁模型通过 |
| II. Research, signals, and backtesting / 研究、信号与回测 | 预注册假设与搜索空间，把数值/文本转成时点一致候选特征，并设计按时间顺序、无前视的回测规格 | M4–M6 | 只追加实验台账、抗泄漏信号卡、时间顺序切分与成本/泄漏测试规格通过 |
| III. Evaluation, agents, and risk / 评估、智能体与风险 | 处理选择偏差与不确定性，用结构化反方核验主张，并把模型建议置于确定性风险门控之后 | M7–M9 | DSR/PBO/CV 适用性说明、主张裁决记录、声明式风险政策与攻击用例通过 |
| IV. Local synthetic execution, operations, and capstone / 本地合成执行、运营与结课项目 | 设计 exact-intent 人工批准、本地合成执行/对账规格、事故演练与完整研究档案 | M10–M12 | 学员规格与评审证据通过；随课 `fixture-contract-self-test.py` 只验证 fixture 合同，不执行策略、订单、成交、回放、绩效或对账 |

### 3.1 模块—证据—产物映射

| # / module | 学习结果与稳定主张 | 技术主证据 | 必交 artifact | 不可越过的边界 |
|---:|---|---|---|---|
| 1 `scope-safety-autonomy` | 区分研究、信号、订单、成交、持仓、PnL 和建议；定义自主性与禁行边界 | `nist-ai-rmf`, `sec-ai-investment-fraud`, `finra-auto-trading-risk`, `finra-algorithmic-trading`, `sec-market-access-rule-faq`（课程设计为教学综合，不声称这些来源规定了本地协议） | 模拟研究台授权书与禁行事项登记表 | 不教收益承诺、复制交易、代客下单；禁止网络、任何外部 paper/sandbox/live 账户、凭证、远程端点或市场操作 |
| 2 `market-data-time-contracts` | 保存 `event_at`、`available_at`、`ingested_at`、`known_at`、`decision_at`、版本、provider、许可与 checksum；强制 `known_at >= max(available_at, ingested_at)` 且 `known_at <= decision_at` | `github-qlib`, `github-openbb`；`x-openbb-workspace-mcp-2026` 只在显式 version-watch 段落出现 | 五时钟数据契约与血缘表 | 当前成分、重述财报、事件后结局与模型记忆都可能泄漏未来信息；事后 regime 只作评估且 `feature_eligible=false` |
| 3 `agent-architecture-authority` | 拆分 researcher、developer、critic、risk reviewer 与 approver；工具按最小权限授权 | `github-rd-agent`, `github-tradingagents`；X 版本观察 `x-didier-openbb-codex-2026` | 带类型的智能体图与工具权限矩阵 | 多智能体共识不等于正确；模型不得拥有 broker write 权限 |
| 4 `hypotheses-experiment-ledger` | 回测前写可证伪假设、预注册搜索空间和拒绝条件；保留全部候选与失败 | `github-rd-agent`, `paper-backtest-overfitting`；两条 X 仅作版本观察 | 假设卡与只追加实验台账 | 自动搜索会扩大 multiple testing；查看测试结果后修改即产生新试验 |
| 5 `features-labels-text-signals` | 把数值、文本和情绪转成带时点、来源与标签定义的候选特征 | `github-fingpt`, `github-openbb`, `github-qlib` | 特征—标签规格与文本信号证据卡 | 情绪不是事实，NLP 准确率不是价格预测或 alpha |
| 6 `backtest-leakage-costs` | 建模日历、延迟、价差、滑点、手续费与执行假设；检测 look-ahead 与不现实成交 | `github-backtesting-py`, `github-vectorbt`, `github-freqtrade`, `github-lean`, `github-backtrader`, `paper-backtest-overfitting` | 按时间顺序、无前视的回测规格与泄漏测试套件 | 该规格不建立因果关系；模拟成交不是现实保证，零成本、无限流动性或同 bar 偷看结果不得称为可部署表现 |
| 7 `evaluation-uncertainty-overfitting` | 锁定样本外区间；保存原始试验数与所选有效独立试验估计方法；按适用条件使用 DSR、PBO/CSCV 与金融 CV | `paper-backtest-overfitting`, `paper-deflated-sharpe-ratio`, `paper-financial-cross-validation-comparison`, `github-qlib`, `github-finrl` | 评估协议、不确定性表、完整同步的 T×N 试验统计量矩阵与模型选择台账 | PBO 不是 p 值或 FDR；DSR/PBO/CV 不修复前视、成本遗漏或结构断裂；单一 holdout 或最佳 Sharpe 不保证未来表现 |
| 8 `multi-agent-debate-verification` | 用结构化正反论证、逐项 evidence verdict 和人工裁决检验主张 | `github-tradingagents`, `github-rd-agent` | 主张—证据图与已裁决辩论记录 | 辩论不会自动消除幻觉、共享数据错误或非确定性 |
| 9 `portfolio-risk-deterministic-gates` | 用不可由模型修改的 size、风险敞口、staleness、rate 和 default-deny 规则门控合成意图 | `github-finrl`, `github-finrl-x`, `github-freqtrade`, `nist-ai-rmf`, `finra-algorithmic-trading`, `sec-market-access-rule-faq` | 风险政策、黄金 fixtures 与门禁决策日志 | 监管材料仅作工程背景；风险指标与规则通过不等于合规或实盘批准 |
| 10 `paper-execution-reconciliation` | 设计只面向 `SYN-A` 的本地合成意图状态、估值/mark/lot 规则，以及来自智能体无写权限通道或经固定公钥验签、绑定 exact intent SHA-256 与政策版本的一次性批准事件；消费前核验撤销并原子写入防重放台账 | `github-backtesting-py`, `github-freqtrade`, `github-alpaca-py`；相关 X 只作外部能力 version-watch | 本地合成意图与对账规格（非随课执行器） | 外部 paper/sandbox/live 能力只界定排除项；课程包没有账户、key、endpoint、模式切换、order/fill/replay 或市场动作能力 |
| 11 `monitoring-kill-switch-incidents` | 将数据陈旧、超限、意图速率、重复意图、secret-shaped 输入或 schema 失败写成 fail-closed 监控与具名人类处置规格 | `nist-ai-rmf`, `finra-algorithmic-trading`, `sec-market-access-rule-faq` | 监控地图、紧急停止测试规格与事故手册 | human-in-the-loop 不能是默认同意；声明式政策和演练不等于已部署技术控制，也不授权市场动作 |
| 12 `capstone-auditable-paper-desk` | 交付 source→feature→signal→decision→exact-intent approval→本地合成状态规格的可逆追踪、局限与复盘 | `github-openbb`, `github-qlib`, `github-rd-agent`, `github-backtesting-py`, `nist-ai-rmf` | 八项产物组成的可审计本地合成研究台档案与面向决策者的 claim→receipt 说明 | 随课 self-test 不生成订单、成交、PnL 或绩效；结课也不证明盈利、适合实盘、符合法律或可管理他人资金 |

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

### 5.1 八条论文与官方材料中的两项 M7 新证据

8 条 research/official 记录由 3 篇统计/验证论文与 5 项 NIST、SEC、FINRA 风险材料构成。M7 新加入：

| Source ID | 一手记录 | M7 可用主张 | 不可外推 |
|---|---|---|---|
| `paper-deflated-sharpe-ratio` | [The Deflated Sharpe Ratio](https://doi.org/10.2139/ssrn.2460551)；[SSRN 2460551](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2460551) | 在完整试验台账基础上，针对选择偏差、非正态收益与候选相关性修正观察到的 Sharpe，并披露原始试验数和估计的有效独立试验数 | 不替代 point-in-time 数据、现实成本、未触碰测试集或未来表现证据 |
| `paper-financial-cross-validation-comparison` | [Knowledge-Based Systems 305 (2024), 112477](https://doi.org/10.1016/j.knosys.2024.112477)；[期刊页面](https://www.sciencedirect.com/science/article/pii/S0950705124011110) | 支持在非平稳、自相关和 regime shift 条件下，比较 walk-forward、purged 方法、CPCV、PBO 与 DSR，并根据标签区间与依赖结构解释选择 | 论文中的方法排序受其合成设计与历史 S&P 500 分析限定，不存在由该研究证明的普遍最优切分 |

两项证据与 `paper-backtest-overfitting` 共同绑定 M7。PBO/CSCV 需要完整、同步、同一时钟口径的 T×N 候选统计量矩阵；PBO 不是 p 值或 FDR。DSR 需要实际收益序列和完整试验/相关结构。随课 fixture 缺少这些输入，因此不能计算 DSR、PBO 或任何绩效指标。

## 6. 回测、时间泄漏与过拟合合同

### 6.1 强制时间字段

所有可进入决策的研究输入至少保存五个时钟：

```text
event_at       事件发生时间
available_at   来源按其发布/数据规则可被取得的时间
ingested_at    教学系统完成抓取或接收的时间
known_at       通过解析、校验并实际可供决策使用的时间
decision_at    该研究决策冻结的时间
```

核心不变量是 `known_at >= max(available_at, ingested_at)` 且 `known_at <= decision_at`。`event_at` 不能冒充 `available_at`，`ingested_at` 也不能冒充已经校验可用的 `known_at`。来源版本、provider、许可与 checksum 另行保存；财报修订、新闻更新、X 删除/编辑、指数成分变化和模型训练知识都要单独处理。

随课 CSV 还包含 `observed_through`、日历、时区与 bar-label 语义。`evaluation_regime_label` 只供完整窗口结束后的事后评估，且每行 `evaluation_regime_feature_eligible=false`；它不得进入任何特征、标签或决策输入。

### 6.2 必测失败类型

- look-ahead：使用决策后信息，或用同一 bar 的收盘信号假设按同一收盘成交；
- survivorship：历史 universe 只含后来存活的资产；
- revision leakage：使用后来重述的财务值；
- label overlap：训练与测试样本的持有区间交叠；
- LLM memorisation：模型可能见过旧事件及其结果；
- test-set reuse：查看最终测试后继续修改提示词、参数或代码；
- multiple testing：大量策略/提示/模型尝试后只报告赢家；
- execution fantasy：忽略价差、滑点、容量、借券、交易日历或其他已声明的执行约束；
- mutable sources：今天运行旧交易日期时却读到今天的新闻/社交内容；
- non-determinism concealment：只展示一次有利的 LLM/随机种子运行。

### 6.3 报告最低字段

只有在实际存在相应输入时，策略研究结果才可报告：样本区间和切分、universe 形成方式、原始试验次数与有效独立试验估计、benchmark、成本假设、换手、最大回撤、波动/尾部指标、风险敞口、容量限制、多次运行分布、样本外结果、失败情景和已知未验证项。

随课 fixture 包没有策略收益、benchmark 或无风险收益、持仓、order/fill、费用/滑点、组合权益等序列，因此 Sharpe、最大回撤、换手和扣费后绩效均为 **not-computable**。自检必须如实输出缺失输入，不能用 OHLCV 行数、情绪置信度或任意公式伪造“Sharpe-like”指标。

## 7. 风险控制、人类审批与 kill switch

### 7.1 确定性控制优先于模型意见

语言模型可以生成研究建议，但课程设计要求 symbol allowlist、price/size/notional、gross/net exposure、leverage、staleness、duplicate/idempotency、intent rate、daily loss、drawdown 与 default-deny 等控制最终由可测试的确定性代码执行，模型不能修改或绕过阈值。

随课 `risk-policy.template.json` 只是声明式政策：它记录这些限制、exact-intent 人工批准字段与 fail-closed 情形，`fixture-contract-self-test.py` 只核验其中选定字段的形状。二者都不是风险计算或执行引擎，不能证明控制已在某个运行系统中生效。

### 7.2 逐单审批卡

每个候选本地合成意图必须向人显示：合成资产、方向、数量/名义单位、价格约束、当前及假设执行后的 gross/net exposure、成本与滑点假设、最坏情景、数据五时钟、模型/策略/提示版本、支持与反方证据，以及触发的风险规则。

批准事件至少绑定 `approvalId`、`approvalEventId`、`approverId`、`approvedAt`、`expiresAt`、`intentSha256`、`policyVersion`、`proofType` 与 `proofLocator`。字段齐全不等于人工签发：事件必须来自智能体无写权限的追加式人工通道并附 ACL 证据，或使用固定公钥验证分离签名；消费前检查签发证明与撤销状态，再原子写入防重放消费台账。missing、expired、reused、revoked、issuer-proof-invalid、intent-hash mismatch 或 policy-version mismatch 均 fail closed。课程规格不得超时自动同意、批量默认同意、永久白名单或 agent 自我批准。随课自检只检查这份声明式合同，不接收、验签、消费或提交任何意图。

### 7.3 Kill switch

课程事故规格的触发条件至少覆盖：数据陈旧/缺失/冲突、单个或累计风险敞口超限、意图速率异常、重复意图、日亏损/回撤阈值、滑点异常、secret-shaped 输入、schema 失败、未经批准的模型/提示/数据源变更。

默认动作顺序：

1. 阻止所有新的候选合成意图进入后续状态；
2. 将尚未获得有效 exact-intent 人工批准的待处理意图标为 deny；
3. 保存不可变状态、工具调用、政策版本、意图 hash 与人工审批证据；
4. 告警并要求指定人员处理；
5. 是否平仓由预先批准的情景规则决定，不能把自动全部平仓作为所有故障的通用默认；
6. 恢复必须由不同于触发 agent 的具名人类显式批准，并形成 postmortem。

这些工程模式借鉴 NIST AI RMF、SEC Market Access Rule 和 FINRA algorithmic trading 指引，但课程必须说明具体法规的适用主体和法域不同；引用监管材料不等于对学员或网站给出法律结论。随课 fixture 包没有运行中的 kill switch，只有供教学审查的政策形状与自检断言。

## 8. 评估与 capstone 验收

### 8.1 四阶段闸门

- Gate I：来源 ledger、时点不变量和策略规格的 gold tests 全部通过；
- Gate II：所有 agent 有 schema、权限、trace、超时、失败和人工升级路径；
- Gate III：故障注入能抓住至少 8 类偏差，最终样本外区间保持锁定，并说明 DSR、PBO/CSCV 与所选金融 CV 的输入和适用边界；
- Gate IV：学员提交本地合成意图状态、exact-intent 人工批准、对账与 kill-switch 恢复的规格和演练证据；随课 fixture-contract self-test 另行通过 7 项断言，但不执行这些运行行为。

### 8.2 Capstone dossier

必须包含：

- scope/disclaimer 与 prohibited uses；
- data card、source ledger、rights 和 point-in-time contract；
- strategy card、agent graph、tool permissions 和 prompts/version receipt；
- 完整 experiment registry，包括失败试验；
- leakage tests、成本模型、样本外/压力测试和风险报告；
- 学员设计的 synthetic-intent 状态与假设对账 schema、exact-intent 人工审批记录、kill-switch 演练；这些不是由随课 self-test 生成的运行回执；
- 从 source → feature → signal → decision → exact-intent approval → local synthetic state specification 的双向追踪；
- limitations、residual risks、未验证项和 postmortem。

`operations-release` 还必须包含面向决策者的叙述：逐项把每个 material claim 映射到相应 receipt，并明确哪些只是设计要求、哪些由 fixture 自检覆盖、哪些仍未实现或未验证。不得把清单通过写成执行或绩效通过。

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

允许的表述是：“构建受控的智能体量化研究与本地合成执行/对账规格；学习识别时间泄漏、回测过拟合、执行风险和治理边界。随课包只提供本地合成 fixture 合同自检，不执行策略、订单、成交、回放或绩效计算。”

## 10. 发布验收清单

- [x] 当前本地 Course 16 使用 `displayNumber: 16`；Course 17 为 17，课程编号连续且无重复。
- [x] Course 17 恰好 12 modules / 4 phases；所有 module 有 artifact 和 failure path。
- [x] Course 17 随课包限定为本地合成 fixture、声明式风险政策与 `fixture-contract-self-test.py`；不执行策略/order/fill/replay/performance，不接受外部 paper/sandbox/live 账户、凭证、endpoint 或市场操作。
- [x] Course 17 注册范围限定在此功能实现；其他课程定义保持不变。
- [x] 27 个来源闭环：13 个 GitHub 来源全部钉定 40 位 commit SHA/明确 tag；6 条 X 原帖仅作 version-watch 且有第一方交叉来源；8 条论文/官方材料含 DSR 与 2024 金融 CV 比较；accessed date 为 2026-08-26。
- [x] 随课 fixture 明示绩效指标 `not-computable`，因为不存在收益、benchmark/无风险收益、持仓、order/fill、费用/滑点或组合权益序列；不得生成收益图或代理指标。
- [x] fixture 自检可重复检查完整性、合成身份、bar 日期唯一且升序、五时钟合同、决策输入可得性、声明式政策形状与绩效不可计算；它不定义或验证训练—验证切分，也不证明完整策略无泄漏。
- [ ] 在未来实际运行实现中，exact-intent 人工审批不能被跳过，kill switch 能被测试、记录和恢复；当前随课包只有声明式合同与形状自检，不能把这一项勾为已执行。
- [x] 英文与简体中文正文完整表达“课程规格仅限本地合成、随课包仅作 fixture 合同自检”、非投资建议和禁止主张；其余 locale 明示英文回退。
- [ ] 基线 Codex 截图发布闸门、完整 `next build`、冻结静态导出、生产证据、干净提交与线上 URL 核验全部通过后，才可称 `aicourse.top` 已发布 Course 17。

若任一项未通过，只能报告“研究简报/局部实现完成”，不能报告课程发布或 aicourse.top 已上线。
