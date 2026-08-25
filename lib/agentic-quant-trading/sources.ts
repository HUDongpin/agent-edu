import type { CourseKitSourceAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_SOURCE_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitSourceRecord,
} from "../course-kit/types";

const ACCESSED_ON = "2026-08-26";

/**
 * Course 17 evidence ledger.
 *
 * GitHub records pin a tag or a default-branch revision. X records are dated
 * ecosystem signals only: their boundaries deliberately prohibit using a post
 * as evidence of returns, correctness, safety, or technical effectiveness.
 */
export const AGENTIC_QUANT_TRADING_SOURCE_SEEDS = [
  {
    record: {
      id: "github-openbb",
      title: "OpenBB — open data platform for analysts, quants, and AI agents",
      publisher: "OpenBB",
      url: "https://github.com/OpenBB-finance/OpenBB",
      evidenceUrls: [
        "https://github.com/OpenBB-finance/OpenBB",
        "https://github.com/OpenBB-finance/OpenBB/commit/3e071fcc2cd9f891cac6040ae60296dba76dab46",
        "https://github.com/OpenBB-finance/OpenBB/blob/3e071fcc2cd9f891cac6040ae60296dba76dab46/openbb_platform/README.md",
        "https://github.com/OpenBB-finance/OpenBB/blob/3e071fcc2cd9f891cac6040ae60296dba76dab46/LICENSE",
      ],
      accessedOn: ACCESSED_ON,
      revision: "develop@3e071fcc2cd9f891cac6040ae60296dba76dab46; repository pushed 2026-07-30",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "AGPL-3.0 software; every upstream data provider has separate terms",
      supports:
        "A provider-oriented Python, CLI, REST, and agent-facing data access layer that can preserve the selected provider in a research pipeline.",
      boundary:
        "OpenBB does not make upstream market data complete, point-in-time, free, or redistributable, and it does not establish a strategy, signal, or investment return.",
    },
    zhHans: {
      supports: "支持把 OpenBB 作为保留 provider 信息的 Python、CLI、REST 与智能体数据访问层。",
      boundary: "OpenBB 不保证上游行情完整、时点正确、免费或可再分发，也不证明任何策略、信号或收益。",
    },
  },
  {
    record: {
      id: "github-qlib",
      title: "Qlib — AI-oriented quantitative investment platform",
      publisher: "Microsoft",
      url: "https://github.com/microsoft/qlib",
      evidenceUrls: [
        "https://github.com/microsoft/qlib",
        "https://github.com/microsoft/qlib/releases/tag/v0.9.7",
        "https://github.com/microsoft/qlib/commit/79633dd9506ea689e5400dea0197717b5b3d74b7",
        "https://github.com/microsoft/qlib/blob/79633dd9506ea689e5400dea0197717b5b3d74b7/docs/start/initialization.rst",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v0.9.7; main@79633dd9506ea689e5400dea0197717b5b3d74b7 (2026-07-23)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "MIT",
      supports:
        "A reproducible quant-research pipeline spanning data processing, feature/model workflows, signals, portfolios, transaction-cost-aware backtests, and experiment records.",
      boundary:
        "The sample Yahoo-derived data is documented as potentially imperfect; example benchmarks do not prove point-in-time data quality, deployable alpha, or future performance.",
    },
    zhHans: {
      supports: "支持覆盖数据处理、特征与模型、信号、组合、含成本回测和实验记录的可复现量化研究管线。",
      boundary: "示例 Yahoo 数据可能不完善；示例 benchmark 不证明时点数据质量、可部署 alpha 或未来表现。",
    },
  },
  {
    record: {
      id: "github-rd-agent",
      title: "RD-Agent — automated data-driven research and development",
      publisher: "Microsoft",
      url: "https://github.com/microsoft/RD-Agent",
      evidenceUrls: [
        "https://github.com/microsoft/RD-Agent",
        "https://github.com/microsoft/RD-Agent/releases/tag/v0.8.0",
        "https://github.com/microsoft/RD-Agent/commit/6762f84f9bc0f5c6486c50a00e128a57ac6c3683",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v0.8.0; main@6762f84f9bc0f5c6486c50a00e128a57ac6c3683 (2026-08-04)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "MIT",
      supports:
        "A data-centric agent loop for proposing, implementing, executing, and evaluating factor and model experiments, including the documented fin_quant scenario.",
      boundary:
        "Microsoft states RD-Agent is not ready-to-use financial advice; automated search expands multiple-testing, code-execution, cost, and data-leakage risk unless sandboxed and human-gated.",
    },
    zhHans: {
      supports: "支持提出、实现、执行和评估因子与模型实验的数据中心智能体循环，包括 fin_quant 场景。",
      boundary: "RD-Agent 不是即用型金融建议；自动搜索会扩大多重检验、代码执行、成本与数据泄漏风险。",
    },
  },
  {
    record: {
      id: "github-tradingagents",
      title: "TradingAgents — multi-agent LLM financial trading framework",
      publisher: "TauricResearch",
      url: "https://github.com/TauricResearch/TradingAgents",
      evidenceUrls: [
        "https://github.com/TauricResearch/TradingAgents",
        "https://github.com/TauricResearch/TradingAgents/releases/tag/v0.3.1",
        "https://github.com/TauricResearch/TradingAgents/commit/a33fd4c0f134485a43553a2c23a63cb14adbd88f",
        "https://arxiv.org/abs/2412.20138",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v0.3.1; main@a33fd4c0f134485a43553a2c23a63cb14adbd88f (2026-07-18)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0",
      supports:
        "A research scaffold with specialist analysts, bull/bear debate, a trader, risk reviewers, and a portfolio-manager approval role ending in simulated execution.",
      boundary:
        "Role-play and debate do not guarantee factual grounding, calibrated uncertainty, reproducible decisions, superior returns, or safe authority over a broker account.",
    },
    zhHans: {
      supports: "支持由专业分析员、多空辩论、交易员、风险审查与组合经理批准组成的研究型多智能体结构。",
      boundary: "角色扮演和辩论不保证事实落地、校准不确定性、可复现决策、超额收益或安全券商权限。",
    },
  },
  {
    record: {
      id: "github-fingpt",
      title: "FinGPT — open-source financial large language models",
      publisher: "AI4Finance Foundation",
      url: "https://github.com/AI4Finance-Foundation/FinGPT",
      evidenceUrls: [
        "https://github.com/AI4Finance-Foundation/FinGPT",
        "https://github.com/AI4Finance-Foundation/FinGPT/releases/tag/v1.0.0",
        "https://github.com/AI4Finance-Foundation/FinGPT/commit/f79aaaf0b667076e69c779bae8789ba53ea02284",
        "https://arxiv.org/abs/2306.06031",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v1.0.0; master@f79aaaf0b667076e69c779bae8789ba53ea02284 (2026-08-02)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "MIT repository; base models and datasets retain separate licences",
      supports:
        "Financial sentiment, entity, relation, instruction-tuning, LoRA, and retrieval-augmented NLP examples that can be converted into timestamped candidate features.",
      boundary:
        "NLP benchmark accuracy is not price predictability or trading alpha; model, dataset, timestamp, duplication, entity-resolution, and redistribution rights require separate audits.",
    },
    zhHans: {
      supports: "支持将金融情绪、实体、关系、指令微调、LoRA 与 RAG 示例转成带时间戳的候选特征。",
      boundary: "NLP 准确率不等于价格预测或交易 alpha；模型、数据、时间、去重、实体和权利须另行审计。",
    },
  },
  {
    record: {
      id: "github-backtesting-py",
      title: "Backtesting.py — Python strategy backtesting",
      publisher: "Backtesting.py maintainers",
      url: "https://github.com/kernc/backtesting.py",
      evidenceUrls: [
        "https://github.com/kernc/backtesting.py",
        "https://github.com/kernc/backtesting.py/commit/ca2e2611621e472542ba90f7243a1fa06a7d7108",
        "https://github.com/kernc/backtesting.py/blob/ca2e2611621e472542ba90f7243a1fa06a7d7108/backtesting/__init__.py",
      ],
      accessedOn: ACCESSED_ON,
      revision: "master@ca2e2611621e472542ba90f7243a1fa06a7d7108 (2026-08-05); no GitHub latest release",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "AGPL-3.0",
      supports:
        "A compact event-driven Strategy and Backtest API for transparent baseline logic, trades, fees, stops, statistics, and parameter experiments.",
      boundary:
        "Its fill model is not an exchange simulator; optimization output is in-sample selection unless independently validated, and AGPL obligations require product-specific review.",
    },
    zhHans: {
      supports: "支持用紧凑事件驱动 API 检查基线逻辑、成交、费用、止损、统计和参数实验。",
      boundary: "其成交模型不是交易所模拟器；优化结果须独立验证，产品集成还要审查 AGPL 义务。",
    },
  },
  {
    record: {
      id: "github-alpaca-py",
      title: "alpaca-py — official Python SDK for Alpaca APIs",
      publisher: "Alpaca",
      url: "https://github.com/alpacahq/alpaca-py",
      evidenceUrls: [
        "https://github.com/alpacahq/alpaca-py",
        "https://github.com/alpacahq/alpaca-py/releases/tag/v0.44.0",
        "https://github.com/alpacahq/alpaca-py/commit/45d4b389147a32343f5a0bc45674b44c4e6f3d4d",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v0.44.0; master@45d4b389147a32343f5a0bc45674b44c4e6f3d4d (2026-08-24)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0; Alpaca account, API, data, and market terms apply separately",
      supports:
        "An official typed API surface that documents external data, order, and account-state contracts; this course uses it only to define an excluded integration boundary.",
      boundary:
        "An API client is not a strategy or risk system; paper fills do not reproduce live liquidity, queueing, latency, partial fills, outages, eligibility, or fees.",
    },
    zhHans: {
      supports: "支持识别外部数据、订单与账户状态契约；本课程仅用它界定明确排除的集成边界。",
      boundary: "API 客户端不是策略或风控系统；纸上成交不复现实盘流动性、排队、延迟、部分成交和故障。",
    },
  },
  {
    record: {
      id: "github-vectorbt",
      title: "vectorbt — vectorized quantitative analysis and backtesting",
      publisher: "Oleg Polakow / vectorbt",
      url: "https://github.com/polakowo/vectorbt",
      evidenceUrls: [
        "https://github.com/polakowo/vectorbt",
        "https://github.com/polakowo/vectorbt/releases/tag/v1.1.0",
        "https://github.com/polakowo/vectorbt/commit/34b6d5935e3ea3eccd549e2592bc0f455b8045f5",
        "https://github.com/polakowo/vectorbt/blob/34b6d5935e3ea3eccd549e2592bc0f455b8045f5/LICENSE.md",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v1.1.0; master@34b6d5935e3ea3eccd549e2592bc0f455b8045f5 (2026-08-02)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 with Commons Clause; source-available, not plain Apache-2.0",
      supports:
        "Vectorized signal and portfolio experiments across many assets and parameter combinations, with risk and trade records for sensitivity analysis.",
      boundary:
        "Faster parameter search can accelerate overfitting; vectorized semantics can differ from event-driven execution, and the Commons Clause limits selling derivative services.",
    },
    zhHans: {
      supports: "支持跨资产和参数组合的向量化信号、组合、风险与成交敏感性实验。",
      boundary: "更快搜索也会更快过拟合；向量语义可能不同于事件执行，Commons Clause 还限制衍生服务销售。",
    },
  },
  {
    record: {
      id: "github-finrl",
      title: "FinRL — educational financial reinforcement learning framework",
      publisher: "AI4Finance Foundation",
      url: "https://github.com/AI4Finance-Foundation/FinRL",
      evidenceUrls: [
        "https://github.com/AI4Finance-Foundation/FinRL",
        "https://github.com/AI4Finance-Foundation/FinRL/releases/tag/v0.3.8",
        "https://github.com/AI4Finance-Foundation/FinRL/commit/2334a5fe6d30629157f13c3b0319e1637e15e123",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v0.3.8; master@2334a5fe6d30629157f13c3b0319e1637e15e123 (2026-07-12)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "MIT software; FinRL names and logos have separate trademark restrictions",
      supports:
        "An educational environment for states, actions, rewards, transaction costs, training/validation/trading splits, and financial reinforcement-learning baselines.",
      boundary:
        "The repository now identifies itself as the original education and research framework; reward growth, a single seed, or historical profit is not production readiness or robust alpha.",
    },
    zhHans: {
      supports: "支持用状态、动作、奖励、成本和训练/验证/交易切分教授金融强化学习。",
      boundary: "该仓库定位为原始教育研究框架；奖励增长、单一 seed 或历史利润不代表生产就绪或稳健 alpha。",
    },
  },
  {
    record: {
      id: "github-finrl-x",
      title: "FinRL-X — AI-native modular quantitative trading infrastructure",
      publisher: "AI4Finance Foundation",
      url: "https://github.com/AI4Finance-Foundation/FinRL-Trading",
      evidenceUrls: [
        "https://github.com/AI4Finance-Foundation/FinRL-Trading",
        "https://github.com/AI4Finance-Foundation/FinRL-Trading/releases/tag/v1.0.0",
        "https://github.com/AI4Finance-Foundation/FinRL-Trading/commit/e65d6f0483ead7d2ef4a5fc940cdf960392a25c1",
        "https://github.com/AI4Finance-Foundation/FinRL-Trading/blob/e65d6f0483ead7d2ef4a5fc940cdf960392a25c1/LICENSE",
        "https://arxiv.org/abs/2603.21330",
      ],
      accessedOn: ACCESSED_ON,
      revision: "v1.0.0; master@e65d6f0483ead7d2ef4a5fc940cdf960392a25c1 (2026-05-02)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 root licence; an examples README still incorrectly says MIT",
      supports:
        "A weight-centric interface intended to connect data, strategy composition, backtesting, portfolio constraints, and broker execution, including a paper-trading tutorial.",
      boundary:
        "The project's production-oriented positioning is not independent evidence of operational safety, broker parity, profitability, legal fitness, or failure recovery.",
    },
    zhHans: {
      supports: "支持以权重接口连接数据、策略、回测、组合约束和券商执行，包括纸上交易教程。",
      boundary: "项目的生产导向定位不独立证明运行安全、券商一致、盈利、法律适用或故障恢复。",
    },
  },
  {
    record: {
      id: "github-freqtrade",
      title: "Freqtrade — open-source crypto trading bot",
      publisher: "Freqtrade project",
      url: "https://github.com/freqtrade/freqtrade",
      evidenceUrls: [
        "https://github.com/freqtrade/freqtrade",
        "https://github.com/freqtrade/freqtrade/releases/tag/2026.7",
        "https://github.com/freqtrade/freqtrade/commit/936f28e28cbcd4e9e146cbc076c54933517a92eb",
        "https://github.com/freqtrade/freqtrade/blob/936f28e28cbcd4e9e146cbc076c54933517a92eb/docs/strategy-101.md",
      ],
      accessedOn: ACCESSED_ON,
      revision: "2026.7; develop@936f28e28cbcd4e9e146cbc076c54933517a92eb (2026-08-25)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "GPL-3.0; exchange and market-data terms apply separately",
      supports:
        "A crypto-focused workflow for downloading candles, writing strategies, backtesting, look-ahead analysis, recursive analysis, hyperparameter search, and dry-run forward testing.",
      boundary:
        "Freqtrade warns that backtests can be inaccurate and directs users to dry-run first; crypto exchange behavior and jurisdictional rules do not generalize to securities markets.",
    },
    zhHans: {
      supports: "支持加密行情、策略、回测、前视与递归分析、参数搜索和 dry-run 前向测试。",
      boundary: "官方提醒回测可能不准确且应先 dry-run；加密交易所行为与法域规则不能泛化到证券市场。",
    },
  },
  {
    record: {
      id: "github-lean",
      title: "LEAN algorithmic trading engine",
      publisher: "QuantConnect",
      url: "https://github.com/QuantConnect/Lean",
      evidenceUrls: [
        "https://github.com/QuantConnect/Lean",
        "https://github.com/QuantConnect/Lean/commit/185c691b89f28bd68e48d53c02147415134975f0",
        "https://github.com/QuantConnect/Lean/blob/185c691b89f28bd68e48d53c02147415134975f0/Engine/Engine.cs",
        "https://github.com/QuantConnect/Lean/blob/185c691b89f28bd68e48d53c02147415134975f0/ToolBox/README.md",
      ],
      accessedOn: ACCESSED_ON,
      revision: "master@185c691b89f28bd68e48d53c02147415134975f0 (2026-08-26)",
      kind: "github-repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 engine; data, cloud, brokerage, and CLI services have separate terms",
      supports:
        "A professional event-driven reference architecture for research, backtests, modular handlers, order processing, and live jobs across Python and C# algorithms.",
      boundary:
        "LEAN's breadth and live integrations do not make a learner strategy correct, profitable, broker-portable, or deployable without its data and operational contracts.",
    },
    zhHans: {
      supports: "支持把 LEAN 用作研究、回测、模块化 handler、订单处理和 live job 的专业事件驱动架构参考。",
      boundary: "LEAN 的广度与 live 集成不使学习者策略自动正确、盈利、跨券商或可部署。",
    },
  },
  {
    record: {
      id: "github-backtrader",
      title: "Backtrader — Python backtesting library",
      publisher: "Backtrader maintainers",
      url: "https://github.com/mementum/backtrader",
      evidenceUrls: [
        "https://github.com/mementum/backtrader",
        "https://github.com/mementum/backtrader/commit/b853d7c90b6721476eb5a5ea3135224e33db1f14",
        "https://github.com/mementum/backtrader/blob/b853d7c90b6721476eb5a5ea3135224e33db1f14/LICENSE",
      ],
      accessedOn: ACCESSED_ON,
      revision: "master@b853d7c90b6721476eb5a5ea3135224e33db1f14; last repository push 2024-08-19 in the 2026-08-26 GitHub snapshot",
      kind: "github-repository",
      stability: "historical",
      reuseStatus: "licence-noted-no-copy",
      licence: "GPL-3.0",
      supports:
        "A historically important Python event-driven design with data feeds, indicators, strategies, brokers, analyzers, and reusable execution concepts.",
      boundary:
        "Its weaker recent maintenance signal makes it a comparison or migration source, not the course's default 2026 engine or evidence of current broker compatibility.",
    },
    zhHans: {
      supports: "支持把 Backtrader 作为数据源、指标、策略、broker 与 analyzer 的历史事件驱动设计参考。",
      boundary: "较弱的近期维护信号使它适合作为比较或迁移来源，而非 2026 默认引擎或当前券商兼容证据。",
    },
  },
  {
    record: {
      id: "x-openbb-workspace-mcp-2026",
      title: "OpenBB post announcing Workspace MCP",
      publisher: "OpenBB on X",
      url: "https://x.com/openbb_finance/status/2059380084612440390",
      evidenceUrls: [
        "https://x.com/openbb_finance/status/2059380084612440390",
        "https://openbb.co/blog/introducing-workspace-mcp/",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2026-05-26",
      revision: "Direct X status and official OpenBB launch article accessed 2026-08-26",
      kind: "social-post",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Attributed link only; post text and media are not reused",
      supports:
        "That OpenBB publicly announced a Workspace MCP connection pattern and described the product workflow in its own launch article.",
      boundary:
        "The post is marketing and ecosystem context only; it supports no investment return, data quality, agent accuracy, security, kill-switch, or technical-effectiveness claim.",
    },
    zhHans: {
      supports: "仅支持 OpenBB 曾公开宣布 Workspace MCP 连接模式，并由官方文章描述其产品流程。",
      boundary: "该帖仅作行业动态，不支持收益、数据质量、智能体准确性、安全、kill switch 或技术有效性。",
    },
  },
  {
    record: {
      id: "x-didier-openbb-codex-2026",
      title: "Didier Lopes post demonstrating Codex with OpenBB Workspace MCP",
      publisher: "Didier Lopes on X",
      url: "https://x.com/didier_lopes/status/2054654792312488438",
      evidenceUrls: [
        "https://x.com/didier_lopes/status/2054654792312488438",
        "https://openbb.co/blog/introducing-workspace-mcp/",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2026-05-13",
      revision: "Direct X status and official OpenBB launch article accessed 2026-08-26",
      kind: "social-post",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Attributed link only; post text and media are not reused",
      supports:
        "An attributed founder demonstration of connecting an external coding agent to an OpenBB research workspace, paired with OpenBB's product documentation.",
      boundary:
        "A founder demo is not independent testing and supports no investment return, reliability, security, general compatibility, time saving, or production-readiness claim.",
    },
    zhHans: {
      supports: "仅支持创始人曾演示把外部编程智能体连接到 OpenBB 研究工作区，并有官方产品文档旁证。",
      boundary: "创始人演示不是独立测试，不支持收益、可靠性、安全、普遍兼容、节时或生产就绪结论。",
    },
  },
  {
    record: {
      id: "x-alpaca-cli-agents-2026",
      title: "Alpaca post announcing its CLI for trading APIs and agents",
      publisher: "Alpaca on X",
      url: "https://x.com/AlpacaHQ/status/2047307001307316247",
      evidenceUrls: [
        "https://x.com/AlpacaHQ/status/2047307001307316247",
        "https://alpaca.markets/blog/alpaca-introduces-cli-for-trading-api/",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2026-04-23",
      revision: "Direct X status and official Alpaca product article accessed 2026-08-26",
      kind: "social-post",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Attributed link only; post text and media are not reused",
      supports:
        "That Alpaca publicly announced a CLI intended to expose its API workflow to developers and coding agents, as described in its own article.",
      boundary:
        "The announcement supports no investment return and does not establish strategy quality, correct orders, safe autonomous authority, paper/live parity, market eligibility, or investment performance.",
    },
    zhHans: {
      supports: "仅支持 Alpaca 曾公开宣布面向开发者与编程智能体的 API CLI，并由官方文章描述。",
      boundary: "公告不证明策略质量、订单正确、自主权限安全、纸上/实盘一致、市场资格或投资表现。",
    },
  },
  {
    record: {
      id: "x-ai4finance-finrlx-2026",
      title: "AI4Finance post announcing FinRL-X",
      publisher: "AI4Finance Foundation on X",
      url: "https://x.com/AI4FinanceFound/status/2066883676290613608",
      evidenceUrls: [
        "https://x.com/AI4FinanceFound/status/2066883676290613608",
        "https://arxiv.org/abs/2603.21330",
        "https://github.com/AI4Finance-Foundation/FinRL-Trading",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2026-06-16",
      revision: "Direct X status, arXiv record, and official repository accessed 2026-08-26",
      kind: "social-post",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Attributed link only; post text and media are not reused",
      supports:
        "That AI4Finance publicly announced FinRL-X and linked a paper and open repository for its proposed modular architecture.",
      boundary:
        "An author announcement supports no investment return and does not independently validate production safety, broker parity, reproducibility, legal fitness, or superiority.",
    },
    zhHans: {
      supports: "仅支持 AI4Finance 曾公开发布 FinRL-X，并提供论文和开源仓库描述其模块架构。",
      boundary: "作者公告和论文不独立验证收益、生产安全、券商一致、可复现、法律适用或优越性。",
    },
  },
  {
    record: {
      id: "x-ai4finance-finrl-deepseek-2025",
      title: "AI4Finance post about FinRL-DeepSeek research",
      publisher: "AI4Finance Foundation on X",
      url: "https://x.com/AI4FinanceFound/status/1891873143804813379",
      evidenceUrls: [
        "https://x.com/AI4FinanceFound/status/1891873143804813379",
        "https://arxiv.org/abs/2502.07393",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2025-02-18",
      revision: "Direct X status and primary arXiv record accessed 2026-08-26",
      kind: "social-post",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Attributed link only; post text and media are not reused",
      supports:
        "That AI4Finance promoted a named research artifact combining financial reinforcement learning and a language-model workflow, with a linked primary manuscript.",
      boundary:
        "The post supports no investment return and cannot support the manuscript's performance numbers, external validity, reproducibility, deployability, costs, or risk controls.",
    },
    zhHans: {
      supports: "仅支持 AI4Finance 曾推广结合金融强化学习与语言模型工作流的研究产物，并有一手稿件链接。",
      boundary: "该帖不支持论文性能数字、外部效度、可复现、可部署、成本、风控或未来收益。",
    },
  },
  {
    record: {
      id: "x-openbb-excel-to-agents-2025",
      title: "OpenBB post on moving a macro workflow from Excel to agents",
      publisher: "OpenBB on X",
      url: "https://x.com/openbb_finance/status/1912938049102913666",
      evidenceUrls: [
        "https://x.com/openbb_finance/status/1912938049102913666",
        "https://openbb.co/blog/from-excel-to-agents-rebuilding-the-macro-research-workflow-for-the-ai-era/",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2025-04-17",
      revision: "Direct X status and official OpenBB case article accessed 2026-08-26",
      kind: "social-post",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Attributed link only; post text and media are not reused",
      supports:
        "That OpenBB published a first-party workflow narrative about replacing parts of a spreadsheet-centered macro-research process with agent-facing infrastructure.",
      boundary:
        "The first-party narrative is not a controlled productivity study and supports no investment return, savings, accuracy, data lineage, or universal workflow claim.",
    },
    zhHans: {
      supports: "仅支持 OpenBB 曾发布把部分表格中心宏观研究流程迁移到智能体基础设施的一方叙事。",
      boundary: "一方叙事不是受控生产率研究，不支持节省、准确、数据 lineage、投资结果或普遍工作流结论。",
    },
  },
  {
    record: {
      id: "paper-backtest-overfitting",
      title: "The Probability of Backtest Overfitting",
      publisher: "The Journal of Computational Finance",
      url: "https://doi.org/10.21314/JCF.2016.322",
      evidenceUrls: [
        "https://doi.org/10.21314/JCF.2016.322",
        "https://www.risk.net/journal-of-computational-finance/2471206/the-probability-of-backtest-overfitting",
        "https://escholarship.org/uc/item/4w1110bb",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2016-09-19",
      revision: "First published online 2016-09-19; Journal of Computational Finance 20(4), April 2017; DOI 10.21314/JCF.2016.322",
      kind: "research",
      stability: "stable-concept",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Publisher and author copyright; linked and independently paraphrased only",
      supports:
        "A primary framework for estimating the probability of backtest overfitting and a combinatorially symmetric cross-validation implementation in investment simulations.",
      boundary:
        "PBO does not prove a selected strategy is true, causal, profitable, or safe, and its estimate depends on the tested configurations, sample, performance statistic, and exchangeability assumptions.",
    },
    zhHans: {
      supports: "支持估计回测过拟合概率的框架，以及投资模拟中的组合对称交叉验证实现。",
      boundary: "PBO 不证明策略真实、因果、盈利或安全；估计依赖候选配置、样本、统计量与可交换性假设。",
    },
  },
  {
    record: {
      id: "finra-auto-trading-risk",
      title: "Know the Risks of Auto-Trading Services Offered by Unregistered Entities",
      publisher: "Financial Industry Regulatory Authority",
      url: "https://www.finra.org/investors/insights/auto-trading-unregistered-entities",
      evidenceUrls: ["https://www.finra.org/investors/insights/auto-trading-unregistered-entities"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2025-07-29",
      revision: "FINRA investor article accessed 2026-08-26",
      jurisdiction: "United States investor education; scope stated by FINRA",
      kind: "official-guidance",
      stability: "jurisdiction-and-date-bound",
      reuseStatus: "link-and-paraphrase-only",
      licence: "FINRA publisher copyright; linked and independently paraphrased only",
      supports:
        "FINRA's warning that unregistered auto-trading services may make misleading AI, risk-free, beginner-friendly, or consistent-return claims and should be independently checked.",
      boundary:
        "This investor education is not legal advice, a finding about every automated service, or a substitute for current registration, product, adviser, broker, and jurisdiction-specific analysis.",
    },
    zhHans: {
      supports: "支持 FINRA 对未注册自动交易服务可能作出 AI、无风险、易用或稳定收益误导宣传的警示。",
      boundary: "该投资者教育不是法律意见、对所有服务的认定，也不替代当前注册、产品、顾问、券商和法域分析。",
    },
  },
  {
    record: {
      id: "sec-ai-investment-fraud",
      title: "Artificial Intelligence (AI) and Investment Fraud: Investor Alert",
      publisher: "SEC Office of Investor Education and Advocacy, NASAA, and FINRA",
      url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/artificial-intelligence-fraud",
      evidenceUrls: [
        "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/artificial-intelligence-fraud",
        "https://www.finra.org/investors/insights/artificial-intelligence-and-investment-fraud",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2024-01-25",
      revision: "Joint SEC OIEA, NASAA, and FINRA investor alert accessed 2026-08-26",
      jurisdiction: "United States and referenced North American investor-protection context",
      kind: "official-guidance",
      stability: "jurisdiction-and-date-bound",
      reuseStatus: "link-and-paraphrase-only",
      licence: "United States government-work boundary; jointly authored NASAA and FINRA material is linked and paraphrased only",
      supports:
        "Official warnings against guaranteed AI returns, unregistered platforms, social-media manipulation, deepfakes, and sole reliance on AI-generated investment information.",
      boundary:
        "The staff alert says it has no legal force and does not determine the legality, registration status, suitability, truth, or outcome of a particular course project or service.",
    },
    zhHans: {
      supports: "支持对 AI 保证收益、未注册平台、社媒操纵、深伪和单独依赖 AI 投资信息的官方警示。",
      boundary: "该工作人员警示无独立法律效力，也不判断具体课程项目或服务的合法、注册、适当、真实或结果。",
    },
  },
  {
    record: {
      id: "nist-ai-rmf",
      title: "Artificial Intelligence Risk Management Framework (AI RMF 1.0)",
      publisher: "National Institute of Standards and Technology",
      url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
      evidenceUrls: [
        "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
        "https://doi.org/10.6028/NIST.AI.100-1",
        "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2023-01-26",
      revision: "NIST AI 100-1 version 1.0; NIST states revision is in progress",
      kind: "official-guidance",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "United States government work boundary; third-party credited material excluded",
      supports:
        "A voluntary Govern–Map–Measure–Manage structure for documenting context, testing, monitoring, accountability, residual risk, and lifecycle controls for an AI-enabled trading research system.",
      boundary:
        "AI RMF 1.0 is not law, certification, investment governance, broker approval, a complete local risk assessment, or evidence that a model or control is effective.",
    },
    zhHans: {
      supports: "支持以 Govern、Map、Measure、Manage 记录智能体交易研究系统的情境、测试、监测、问责与残余风险。",
      boundary: "AI RMF 1.0 不是法律、认证、投资治理、券商批准、完整本地评估或控制有效性证据。",
    },
  },
  {
    record: {
      id: "finra-algorithmic-trading",
      title: "Algorithmic Trading — supervision and control resources",
      publisher: "Financial Industry Regulatory Authority",
      url: "https://www.finra.org/rules-guidance/key-topics/algorithmic-trading",
      evidenceUrls: [
        "https://www.finra.org/rules-guidance/key-topics/algorithmic-trading",
        "https://www.finra.org/rules-guidance/guidance/reports/2015-report-exam-findings-and-observations-effective-practices/algorithmic-trading",
      ],
      accessedOn: ACCESSED_ON,
      revision: "FINRA key-topic hub and linked effective-practices report accessed 2026-08-26",
      jurisdiction: "United States FINRA member-firm supervision context",
      kind: "official-guidance",
      stability: "jurisdiction-and-date-bound",
      reuseStatus: "link-and-paraphrase-only",
      licence: "FINRA publisher copyright; linked and independently paraphrased only",
      supports:
        "A primary supervisory reference for algorithm development, testing, implementation, change control, monitoring, controls, and review responsibilities.",
      boundary:
        "FINRA guidance applies in a member-firm regulatory context; it does not make this course a compliant trading system, prescribe one universal kill-switch threshold, or authorise any live order.",
    },
    zhHans: {
      supports: "支持把算法开发、测试、实施、变更控制、监控、控制与审查职责作为交易系统监督要点。",
      boundary: "FINRA 指引位于会员机构监管情境；它不证明本课程系统合规，不规定统一熔断阈值，也不授权任何实盘订单。",
    },
  },
  {
    record: {
      id: "sec-market-access-rule-faq",
      title: "Responses to Frequently Asked Questions Concerning Risk Management Controls for Brokers or Dealers with Market Access",
      publisher: "U.S. Securities and Exchange Commission, Division of Trading and Markets",
      url: "https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions/divisionsmarketregfaq-0",
      evidenceUrls: [
        "https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions/divisionsmarketregfaq-0",
        "https://www.ecfr.gov/current/title-17/chapter-II/part-240/section-240.15c3-5",
      ],
      accessedOn: ACCESSED_ON,
      revision: "SEC Division of Trading and Markets FAQ and current eCFR rule text accessed 2026-08-26",
      jurisdiction: "United States broker-dealer market-access context",
      kind: "official-guidance",
      stability: "jurisdiction-and-date-bound",
      reuseStatus: "link-and-paraphrase-only",
      licence: "United States government-work boundary; linked and independently paraphrased",
      supports:
        "Primary regulatory context for pre-set credit and capital thresholds, erroneous-order controls, authorised access, post-trade reporting, and regular review of market-access risk controls.",
      boundary:
        "The rule and staff FAQ directly concern covered broker-dealers; this course only borrows testable engineering patterns and does not provide a legal opinion, compliance determination, or live-market approval.",
    },
    zhHans: {
      supports: "支持预设信用与资本阈值、错误订单控制、授权访问、交易后报告及定期审查市场接入风险控制的监管背景。",
      boundary: "规则与工作人员 FAQ 直接面向特定券商；课程只借鉴可测试工程模式，不提供法律意见、合规结论或实盘批准。",
    },
  },
] as const satisfies CourseKitNonEmpty<CourseKitSourceAuthoringSeed>;

export type AgenticQuantTradingSourceId =
  (typeof AGENTIC_QUANT_TRADING_SOURCE_SEEDS)[number]["record"]["id"];

export const AGENTIC_QUANT_TRADING_SOURCES = AGENTIC_QUANT_TRADING_SOURCE_SEEDS.map(
  ({ record }) => ({ ...record, schemaVersion: COURSE_KIT_SOURCE_SCHEMA_VERSION }),
) as unknown as CourseKitNonEmpty<CourseKitSourceRecord<AgenticQuantTradingSourceId>>;

export function getAgenticQuantTradingSource(
  sourceId: AgenticQuantTradingSourceId,
): CourseKitSourceRecord<AgenticQuantTradingSourceId> {
  const source = AGENTIC_QUANT_TRADING_SOURCES.find((candidate) => candidate.id === sourceId);
  if (!source) throw new Error(`Unknown Agentic Quant Trading source: ${sourceId}`);
  return source;
}
