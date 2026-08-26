# aicourse.top Course 17《智能体赋能量化交易》权威来源与主张溯源

- 文档状态：当前权威溯源，与运行时来源注册表一一对应
- 快照日期：2026-08-26（Asia/Taipei）
- 适用课程：Course 17 `agentic-quant-trading`
- 机器可读主账：`lib/agentic-quant-trading/sources.ts`
配套研究简报：`agentic-quant-trading-course-research-brief.md`

## 1. 权威边界

本表与运行时 source registry 一一对应，共 27 条：13 个钉定 GitHub 仓库、6 条直接 X status（仅限 version-watch）和 8 条论文或官方风险材料。每条记录都保存 canonical URL、证据 URL、访问日、版本、许可说明、`supports` 与 `boundary`；课程正文只能引用注册表中的 source ID。

- GitHub 仓库必须钉定 40 位 commit SHA；tag 仅作人类可读补充，不能替代 commit。
- X 只作为“项目在特定日期公开表达过什么”的版本观察信号；任何技术能力必须回到官方仓库、论文或机构材料验证。
- 监管与标准材料仅提供其声明法域和日期内的风险背景，不构成法律意见、合规认证或交易授权。
- 随课程分发的本地包只包含合成 fixtures、声明式风险政策与确定性的 fixture-contract self-test；它不执行策略、订单、成交、回放、成本、风险、PnL、绩效指标或对账。
- 本地包没有网络客户端路径，但这不等于证明操作系统已断网；课程边界仍要求本地离线运行，不读取凭证、不连接外部 paper/sandbox/live 账户、不访问远端 endpoint，也不触发任何市场动作。
- fixture 自检只能产生合同检查回执；不得外推为无前视策略证明、alpha、未来收益、生产安全、适当性、回放授权或“可实盘”。

## 2. GitHub 主证据（13/13 已钉定）

| Source ID | 仓库与不可变版本 | 许可快照 | 可支持的课程主张 | 不可外推 |
|---|---|---|---|---|
| `github-openbb` | [OpenBB](https://github.com/OpenBB-finance/OpenBB) · [`3e071fcc…`](https://github.com/OpenBB-finance/OpenBB/commit/3e071fcc2cd9f891cac6040ae60296dba76dab46) | AGPL-3.0；上游数据另有条款 | 可组合的数据访问层可保留 provider 信息 | 不保证上游数据完整、时点正确、免费或可再分发，也不证明信号或收益 |
| `github-qlib` | [Qlib v0.9.7](https://github.com/microsoft/qlib/releases/tag/v0.9.7) · [`79633dd9…`](https://github.com/microsoft/qlib/commit/79633dd9506ea689e5400dea0197717b5b3d74b7) | MIT | 数据、模型、信号、组合、含成本回测与实验记录的研究流水线 | 示例数据和 benchmark 不证明 point-in-time 质量、可部署 alpha 或未来表现 |
| `github-rd-agent` | [RD-Agent v0.8.0](https://github.com/microsoft/RD-Agent/releases/tag/v0.8.0) · [`6762f84f…`](https://github.com/microsoft/RD-Agent/commit/6762f84f9bc0f5c6486c50a00e128a57ac6c3683) | MIT | 提案、实现、运行、评估因子/模型实验的智能体循环 | 官方定位不是即用型投资建议；自动搜索会扩大多重检验、执行与泄漏风险 |
| `github-tradingagents` | [TradingAgents v0.3.1](https://github.com/TauricResearch/TradingAgents/releases/tag/v0.3.1) · [`a33fd4c0…`](https://github.com/TauricResearch/TradingAgents/commit/a33fd4c0f134485a43553a2c23a63cb14adbd88f) | Apache-2.0 | 分析、正反辩论、风险审查、组合批准与模拟执行的角色结构 | 多智能体共识不保证事实、可复现性、收益或安全券商权限 |
| `github-fingpt` | [FinGPT v1.0.0](https://github.com/AI4Finance-Foundation/FinGPT/releases/tag/v1.0.0) · [`f79aaaf0…`](https://github.com/AI4Finance-Foundation/FinGPT/commit/f79aaaf0b667076e69c779bae8789ba53ea02284) | MIT；模型与数据许可另审 | 金融 NLP、情绪、实体、关系和 RAG 可形成带时间戳的候选特征 | NLP 准确率不等于价格预测或交易 alpha；训练数据记忆与权利需另审 |
| `github-backtesting-py` | [Backtesting.py](https://github.com/kernc/backtesting.py) · [`ca2e2611…`](https://github.com/kernc/backtesting.py/commit/ca2e2611621e472542ba90f7243a1fa06a7d7108) | AGPL-3.0 | 紧凑事件驱动策略、成交、费用、止损与参数实验基线 | 成交模型不是交易所；优化结果默认是样本内选择，产品集成还需审查 AGPL |
| `github-alpaca-py` | [alpaca-py v0.44.0](https://github.com/alpacahq/alpaca-py/releases/tag/v0.44.0) · [`45d4b389…`](https://github.com/alpacahq/alpaca-py/commit/45d4b389147a32343f5a0bc45674b44c4e6f3d4d) | Apache-2.0；账户/数据条款另计 | 用于识别外部行情、订单和账户状态接口，进而定义课程明确排除的边界 | SDK 不是策略或风控；paper fill 不复现实盘流动性、延迟、部分成交、故障或费用 |
| `github-vectorbt` | [vectorbt v1.1.0](https://github.com/polakowo/vectorbt/releases/tag/v1.1.0) · [`34b6d593…`](https://github.com/polakowo/vectorbt/commit/34b6d5935e3ea3eccd549e2592bc0f455b8045f5) | Apache-2.0 + Commons Clause；非纯 Apache | 多资产、多参数的向量化信号和组合敏感性实验 | 更快搜索也会更快过拟合；向量执行语义可能不同于事件驱动 |
| `github-finrl` | [FinRL v0.3.8](https://github.com/AI4Finance-Foundation/FinRL/releases/tag/v0.3.8) · [`2334a5fe…`](https://github.com/AI4Finance-Foundation/FinRL/commit/2334a5fe6d30629157f13c3b0319e1637e15e123) | MIT；商标另有约束 | 用状态、动作、奖励、成本与 train/validation/trading split 教授金融强化学习 | 奖励增长、单 seed 或历史利润不代表稳健 alpha 或生产就绪 |
| `github-finrl-x` | [FinRL-X v1.0.0](https://github.com/AI4Finance-Foundation/FinRL-Trading/releases/tag/v1.0.0) · [`e65d6f04…`](https://github.com/AI4Finance-Foundation/FinRL-Trading/commit/e65d6f0483ead7d2ef4a5fc940cdf960392a25c1) | 根目录 Apache-2.0；示例 README 有冲突说明 | 以权重接口衔接数据、策略、回测、组合约束及执行的架构参考 | “production-oriented”不证明运行安全、券商一致、盈利、法律适用或故障恢复 |
| `github-freqtrade` | [Freqtrade 2026.7](https://github.com/freqtrade/freqtrade/releases/tag/2026.7) · [`936f28e2…`](https://github.com/freqtrade/freqtrade/commit/936f28e28cbcd4e9e146cbc076c54933517a92eb) | GPL-3.0；交易所/数据条款另计 | 回测、look-ahead/recursive analysis、参数搜索与 dry-run 的故障检查参考 | 官方亦警告回测可能不准确；加密交易所行为与法域不能泛化至证券市场 |
| `github-lean` | [LEAN](https://github.com/QuantConnect/Lean) · [`185c691b…`](https://github.com/QuantConnect/Lean/commit/185c691b89f28bd68e48d53c02147415134975f0) | 引擎 Apache-2.0；数据/云/券商另有条款 | 研究、回测、handler、订单处理和 live job 的专业事件驱动架构参考 | 架构广度和 live 集成不使学习者策略自动正确、盈利或可部署 |
| `github-backtrader` | [Backtrader](https://github.com/mementum/backtrader) · [`b853d7c9…`](https://github.com/mementum/backtrader/commit/b853d7c90b6721476eb5a5ea3135224e33db1f14) | GPL-3.0 | 经典 Python 事件循环、broker abstraction 与 analyzer 教学对照 | 仓库活跃度、模拟成交与历史范例不证明当前生产适配或现实执行 |

## 3. X 版本观察信号（6/6 直接 status）

| Source ID | 原帖 | 课程中的有限用途 | 必须同时查验 | 禁止用途 |
|---|---|---|---|---|
| `x-openbb-workspace-mcp-2026` | OpenBB，2026-05-26，[status 2059380084612440390](https://x.com/openbb_finance/status/2059380084612440390) | 记录 OpenBB 当日发布 Workspace MCP 的项目动向 | OpenBB 官方发布材料与钉定仓库 | 不证明收益、控制有效或机构可安全自治 |
| `x-didier-openbb-codex-2026` | Didier Lopes，2026-05-13，[status 2054654792312488438](https://x.com/didier_lopes/status/2054654792312488438) | 记录 Codex/Workspace 演示这一公开表述 | OpenBB 官方发布材料 | 创始人演示不是独立性能评测或合规认证 |
| `x-alpaca-cli-agents-2026` | Alpaca，2026-04-23，[status 2047307001307316247](https://x.com/AlpacaHQ/status/2047307001307316247) | 记录 Alpaca 宣布 agent-facing CLI | Alpaca 官方产品文章与 SDK 仓库 | 不支持免人工确认、安全实盘或自动盈利；课程不调用该 CLI |
| `x-ai4finance-finrlx-2026` | AI4Finance，2026-06-16，[status 2066883676290613608](https://x.com/AI4FinanceFound/status/2066883676290613608) | 记录 FinRL-X 的公开项目动态 | FinRL-X 钉定仓库及论文 | 项目展示或奖项不证明课程策略有效 |
| `x-ai4finance-finrl-deepseek-2025` | AI4Finance，2025-02-18，[status 1891873143804813379](https://x.com/AI4FinanceFound/status/1891873143804813379) | 记录 LLM 与 risk-sensitive RL 的研究方向 | 原论文与代码 | 历史实验不能外推其他资产、时期或实盘 |
| `x-openbb-excel-to-agents-2025` | OpenBB，2025-04-17，[status 1912938049102913666](https://x.com/openbb_finance/status/1912938049102913666) | 记录从表格工作流迁向 agent-facing 基础设施的一方叙事 | OpenBB 官方案例文章 | 一方案例不证明节省、准确、血缘完备或投资结果 |

X 页面可能因登录、地区或反爬限制只返回空壳。若原帖失效，注册表应将它标为不可访问；不得用搜索摘要、镜像或搬运号替代。课程技术主张仍须由交叉来源独立成立。

## 4. 论文、监管与标准证据（8/8）

| Source ID | 一手来源 | 可支持 | 边界 |
|---|---|---|---|
| `paper-backtest-overfitting` | [The Probability of Backtest Overfitting](https://doi.org/10.21314/JCF.2016.322) | 组合对称交叉验证与 PBO，用于揭示从许多候选中挑赢家的风险 | PBO 不证明因果、盈利或安全；结果依赖配置、样本、统计量和假设 |
| `paper-deflated-sharpe-ratio` | [The Deflated Sharpe Ratio](https://doi.org/10.2139/ssrn.2460551)；[SSRN 原始记录](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2460551) | 针对多次试验选择偏差与非正态收益修正观察到的 Sharpe，并用相关性估计有效独立试验数 | DSR 依赖完整收益序列、完整试验清单、相关结构与分布输入；不替代时点一致数据、现实成本或未触碰测试集，也不证明未来盈利 |
| `paper-financial-cross-validation-comparison` | [Knowledge-Based Systems 2024, article 112477](https://doi.org/10.1016/j.knosys.2024.112477)；[期刊页面](https://www.sciencedirect.com/science/article/pii/S0950705124011110) | 在非平稳、自相关与状态切换条件下比较走步、purged 方法、CPCV、PBO 与 DSR 等金融样本外验证方法 | 结果受论文的合成设计与历史 S&P 500 分析限定；不证明存在普遍最优切分，项目仍须披露标签区间、依赖、样本量、状态与计算约束 |
| `finra-auto-trading-risk` | [FINRA：未注册实体自动交易风险](https://www.finra.org/investors/insights/auto-trading-unregistered-entities) | 官方提醒核验 AI、无风险、易用和稳定收益等宣传 | 投资者教育不是法律意见或对所有服务的认定 |
| `sec-ai-investment-fraud` | [SEC/NASAA/FINRA AI 投资欺诈警示](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/artificial-intelligence-fraud) | 警惕保证收益、未注册平台、社媒操纵、深伪和单独依赖 AI 信息 | staff alert 无独立法律效力，不判断具体项目合法性、适当性或结果 |
| `nist-ai-rmf` | [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10) | Govern–Map–Measure–Manage，用于记录情境、测试、监测、问责和残余风险 | 自愿通用框架，不是法律、金融认证、券商批准或控制有效性证据 |
| `finra-algorithmic-trading` | [FINRA Algorithmic Trading](https://www.finra.org/rules-guidance/key-topics/algorithmic-trading) | 算法开发、测试、实施、变更控制、监控与审查职责 | 位于美国会员机构监督情境；不规定本课程通用阈值或授权订单 |
| `sec-market-access-rule-faq` | [SEC Market Access Rule FAQ](https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions/divisionsmarketregfaq-0) | 预设阈值、错误订单控制、授权访问、交易后报告和定期审查的监管背景 | 直接面向受规则覆盖的 broker-dealer；课程只借鉴可测试模式，不作合规结论 |

## 5. 主张—证据闭环

| 课程主张 | 主要 source ID | 验收方式 | 对外显示边界 |
|---|---|---|---|
| 数据必须保留 provider、版本、时间与权利信息 | `github-openbb`, `github-qlib` | source ledger、checksum，以及 `event_at` / `available_at` / `ingested_at` / `known_at` / `decision_at` 合同：`known_at >= max(available_at, ingested_at)` 且 `known_at <= decision_at` | 不声称数据完整或 point-in-time 正确，除非该数据集另有证据；事后 `evaluation_regime_label` 始终 `evaluation_regime_feature_eligible=false` |
| 智能体循环必须保存提案、代码、运行和失败 | `github-rd-agent`, `github-tradingagents` | experiment registry、immutable ID、失败记录、人工升级 | 不把角色共识称作事实或投资委员会批准 |
| 情绪/NLP 只能形成候选特征 | `github-fingpt` | 逐条来源、事件/可得时间、实体与去重检查 | 不把分类准确率写成价格预测或 alpha |
| 高频搜索会扩大选择偏差；金融验证方法须匹配标签区间与依赖结构 | `github-vectorbt`, `github-freqtrade`, `paper-backtest-overfitting`, `paper-deflated-sharpe-ratio`, `paper-financial-cross-validation-comparison` | M7 保存完整试验清单、locked out-of-sample、DSR 有效独立试验估计、PBO/CSCV 完整且同步的 T×N 统计量矩阵，以及所选 CV 方法的适用条件 | PBO 不是 p 值或 FDR；DSR/PBO/CV 都不能修复前视、错误时点、漏成本或结构断裂；不得只展示最佳 Sharpe |
| 外部执行接口不能代表真实成交，也不属于本地 fixture 包 | `github-backtesting-py`, `github-alpaca-py`, `github-lean`, `github-backtrader` | 课程用接口文档界定排除项；随课程分发的 self-test 只检查 fixture 合同，不生成 order/fill/replay/performance | 不连接外部 paper/sandbox/live 账户，不接收凭证或 endpoint，不称 paper 等于 live |
| 风控必须由确定性规则和具名人类控制 | `nist-ai-rmf`, `finra-algorithmic-trading`, `sec-market-access-rule-faq` | 课程教学综合要求 default-deny、受保护通道或固定公钥验签的 exact-intent 具名人工批准、撤销与防重放消费、kill-switch 和 incident schema；随课 self-test 只检查声明式政策形状 | 不是上述来源直接规定的统一实现，也不是已部署控制、合规认证或市场动作授权 |
| AI 交易营销不得暗示无风险或保证收益 | `finra-auto-trading-risk`, `sec-ai-investment-fraud` | 课程、目录、SEO 与测试中的 prohibited-claim scan | 只允许描述“受控研究、本地合成执行/对账规格与 fixture 合同自检”，并明确自检不执行 replay/performance |

运行时定义的 60 个中英双语模块段落均显式携带 source ID；专项发布检查验证 27/27 来源至少被引用一次。6 条 X 来源只允许出现在显式标为 version-watch 的段落中，不进入模块根来源、测验或 capstone 证据链。

## 6. 实现与发布边界

- 本成果在隔离的功能实现中将 Course 17 `agentic-quant-trading` 接入 CourseKit，并以 Course 16 `responsible-ai` 作为连续编号的前置课程；其他课程定义保持不变。
- 是否合并该功能实现并纳入生产课程路线，属于单独的产品与发布决策。
- 本地注册、测试和构建不等于 `aicourse.top` 已部署。只有生产部署、线上 URL、静态资源和 release evidence 全部验证后才能声称发布。
- 课程下载文件为本地合成 fixture、声明式风险政策与 `fixture-contract-self-test.py`；文件 SHA-256 和结构化自测回执属于课程证据，不是策略/order/fill/replay/performance 执行、金融数据、无前视证明或市场授权。
- 自测脚本没有网络客户端路径，但其 `network_isolation_verified` 明确为 `false`：操作系统级断网仍须由运行环境另行保证。

## 7. 可复核命令

```bash
npm run agentic-quant-trading:check:content-release
npm run course-kit:check:release
npm run test:agentic-quant-trading
npm run test:course-kit
python3 public/courses/agentic-quant-trading/fixture-contract-self-test.py --self-test
```

发布检查至少应证明：12 modules、780 minutes、36 questions、8 capstone criteria、13 个 GitHub commit、6 个仅作 version-watch 的 X status、8 条论文/官方材料、27/27 source closure、6 个同目录本地下载（含自测必需的 provenance 清单与 MIT 许可证）及其 hash，以及 fixture 自检的 7 项结构化断言。自检成功只表示该 fixture 包可进入具名人类复核；它不执行或证明策略、订单、成交、回放、绩效、风险控制或市场动作。

## 8. 复核触发器

发生以下任一情况即重新采集或降级相关主张：仓库 default branch/tag/license/disclaimer 变化；X 原帖删除或账号变更；NIST/SEC/FINRA 材料修订；课程接入任何远端数据、账户、credential、paper/live broker 或用户资金；rolling 来源超过 90 天；准备从本地实现状态转为生产发布。

复核完成前，不得把旧快照静默描述为当前事实；无法独立验证的内容必须显示为未知、版本观察或教学假设。
