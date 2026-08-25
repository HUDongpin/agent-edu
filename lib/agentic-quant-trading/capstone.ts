import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { AgenticQuantTradingSourceId } from "./sources";

export const AGENTIC_QUANT_TRADING_CAPSTONE_VERSION =
  "2026.08.26-capstone-v1";

export const AGENTIC_QUANT_TRADING_CAPSTONE_ARTIFACTS = [
  {
    id: "mandate-authority",
    sourceIds: ["nist-ai-rmf", "sec-ai-investment-fraud", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
    copy: {
      en: {
        title: "Mandate and authority dossier",
        description: "Decision owner, educational purpose, universe, horizon, benchmark, approved data, allow-deny-escalate tool matrix, prohibited actions, human approvals, expiration, and proof that live credentials, live endpoints, orders, and investment advice are impossible.",
      },
      zhHans: {
        title: "授权与权限档案",
        description: "决策负责人、教学目的、资产范围、周期、基准、批准数据、允许—禁止—升级工具矩阵、禁行事项、人工批准、失效时间，以及实盘凭证、实盘端点、订单和投资建议均不可发生的证明。",
      },
    },
  },
  {
    id: "data-signal-lineage",
    sourceIds: ["github-openbb", "github-qlib", "github-fingpt", "x-openbb-workspace-mcp-2026"],
    copy: {
      en: {
        title: "Point-in-time data and signal lineage",
        description: "Source and licence register, event-availability-ingestion clocks, calendar, universe, revisions, adjustments, immutable snapshot hashes, feature and label contracts, text spans, prompt and model versions, confidence, abstentions, and temporal-invariance tests.",
      },
      zhHans: {
        title: "时点一致数据与信号血缘",
        description: "来源与许可登记、事件—可得—摄取时钟、日历、资产池、修订、复权、不可变快照哈希、特征与标签契约、文本片段、提示和模型版本、置信度、弃权与时间不变性测试。",
      },
    },
  },
  {
    id: "agent-experiment-ledger",
    sourceIds: ["github-rd-agent", "github-tradingagents", "x-didier-openbb-codex-2026", "x-openbb-excel-to-agents-2025"],
    copy: {
      en: {
        title: "Agent graph and experiment ledger",
        description: "Typed roles and handoffs, least-privilege tools, deterministic gates, budgets, immutable hypothesis cards, parent-child runs, environments, seeds, outputs, failures, null results, deviations, deduplication, human decisions, and prompt-injection boundary tests.",
      },
      zhHans: {
        title: "智能体图与实验台账",
        description: "类型化角色与交接、最小权限工具、确定性门禁、预算、不可变假设卡、父子运行、环境、随机种子、输出、失败、零结果、偏离、去重、人工决定与提示词注入边界测试。",
      },
    },
  },
  {
    id: "backtest-evaluation",
    sourceIds: ["github-backtesting-py", "github-vectorbt", "paper-backtest-overfitting", "github-qlib"],
    copy: {
      en: {
        title: "Causal backtest and evaluation pack",
        description: "Event-order specification, point-in-time constituents, fills, costs, accounting invariants, leaked-feature fixture, vectorized-event parity, temporal folds, purge and embargo, baselines, ablations, search count, multiplicity control, uncertainty, regimes, sensitivities, and untouched-test result.",
      },
      zhHans: {
        title: "因果回测与评估包",
        description: "事件顺序、时点成分、成交、成本、会计不变量、泄漏特征 fixture、向量化—事件驱动一致性、时间折、purge 与 embargo、基线、消融、搜索次数、多重比较控制、不确定性、市场状态、敏感性与未触碰测试结果。",
      },
    },
  },
  {
    id: "claim-debate-audit",
    sourceIds: ["github-tradingagents", "github-rd-agent", "x-ai4finance-finrlx-2026"],
    copy: {
      en: {
        title: "Claim, debate, and verification audit",
        description: "Atomic claims, direct source locators, supports-contradicts-contextualizes edges, blind critiques, shared-dependency map, strongest objection, deterministic recomputation, adjudication, unresolved items, allowed wording, and explicit separation of X industry claims from verified evidence.",
      },
      zhHans: {
        title: "主张、辩论与核验审计",
        description: "原子主张、直接来源定位、支持—反驳—背景边、盲评、共享依赖图、最强反驳、确定性重算、裁决、未解决事项、允许措辞，以及 X 行业主张与已核证据的明确区分。",
      },
    },
  },
  {
    id: "risk-gates",
    sourceIds: ["github-finrl", "github-freqtrade", "nist-ai-rmf", "finra-algorithmic-trading", "sec-market-access-rule-faq", "x-ai4finance-finrl-deepseek-2025"],
    copy: {
      en: {
        title: "Deterministic portfolio-risk gates",
        description: "Versioned exposure, concentration, liquidity, turnover, leverage, drawdown, loss, stale-input, and scenario policies; pure-function reason codes; exact-boundary, missing-data, duplicate, correlated-shock, and property-test fixtures; authoritative paper-portfolio state; and proof that agents cannot override limits.",
      },
      zhHans: {
        title: "确定性组合风险门禁",
        description: "带版本的暴露、集中度、流动性、换手、杠杆、回撤、损失、陈旧输入与情景政策；纯函数原因代码；精确边界、缺失数据、重复、相关冲击与性质测试 fixtures；权威模拟组合状态；以及智能体无法覆盖上限的证明。",
      },
    },
  },
  {
    id: "paper-execution-reconciliation",
    sourceIds: ["github-alpaca-py", "github-freqtrade", "x-alpaca-cli-agents-2026"],
    copy: {
      en: {
        title: "Paper execution and reconciliation journal",
        description: "Simulator identity proof, typed immutable intent, risk-approved hash, idempotency key, full order state machine, raw and corrected events, synthetic-fill labels, cash-position-fee accounting, three-way reconciliation, discrepancy ownership, and explicit absence of live credentials and endpoints.",
      },
      zhHans: {
        title: "模拟执行与对账日志",
        description: "模拟器身份、类型化不可变意图、风险批准哈希、幂等键、完整订单状态机、原始与更正事件、合成成交标签、现金—头寸—费用会计、三方对账、差异负责人，以及不存在实盘凭证和端点的明确证明。",
      },
    },
  },
  {
    id: "operations-release",
    sourceIds: ["nist-ai-rmf", "github-alpaca-py", "github-openbb", "sec-ai-investment-fraud", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
    copy: {
      en: {
        title: "Monitoring, incident, replay, and release record",
        description: "Monitor ownership and thresholds, correlated traces, kill-switch and unauthorized-restart tests, incident timeline, containment, reconciliation, root cause, regression, recovery approval, clean-environment replay, review findings, unresolved limits, non-claims, and signed paper-only safety attestation.",
      },
      zhHans: {
        title: "监控、事故、重放与发布记录",
        description: "监控负责人和阈值、关联轨迹、紧急停止与未授权重启测试、事故时间线、遏制、对账、根因、回归、恢复批准、洁净环境重放、评审发现、未解决边界、非声明与签署的仅限模拟盘安全证明。",
      },
    },
  },
] as const satisfies CourseKitNonEmpty<
  CourseKitCapstoneArtifactAuthoringSeed<string, AgenticQuantTradingSourceId>
>;

export type AgenticQuantTradingCapstoneArtifactId =
  (typeof AGENTIC_QUANT_TRADING_CAPSTONE_ARTIFACTS)[number]["id"];

export const AGENTIC_QUANT_TRADING_CAPSTONE = {
  schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  version: AGENTIC_QUANT_TRADING_CAPSTONE_VERSION,
  artifacts: AGENTIC_QUANT_TRADING_CAPSTONE_ARTIFACTS.map((artifact) => ({
    id: artifact.id,
    sourceIds: artifact.sourceIds,
    required: true as const,
  })) as unknown as CourseKitCapstone<
    AgenticQuantTradingCapstoneArtifactId,
    AgenticQuantTradingSourceId
  >["artifacts"],
} satisfies CourseKitCapstone<
  AgenticQuantTradingCapstoneArtifactId,
  AgenticQuantTradingSourceId
>;
