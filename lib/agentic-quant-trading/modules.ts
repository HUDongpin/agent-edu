import type { CourseKitModuleAuthoringSeed } from "../course-kit/authoring";
import type { CourseKitTwelveModules } from "../course-kit/types";
import type { AgenticQuantTradingSourceId } from "./sources";

export const AGENTIC_QUANT_TRADING_MODULE_SLUGS = [
  "scope-safety-autonomy",
  "market-data-time-contracts",
  "agent-architecture-authority",
  "hypotheses-experiment-ledger",
  "features-labels-text-signals",
  "backtest-leakage-costs",
  "evaluation-uncertainty-overfitting",
  "multi-agent-debate-verification",
  "portfolio-risk-deterministic-gates",
  "paper-execution-reconciliation",
  "monitoring-kill-switch-incidents",
  "capstone-auditable-paper-desk",
] as const;

export type AgenticQuantTradingModuleSlug =
  (typeof AGENTIC_QUANT_TRADING_MODULE_SLUGS)[number];

export type AgenticQuantTradingPhaseId =
  | "mandate-data-authority"
  | "research-signals-backtest"
  | "evaluation-agents-risk"
  | "execution-operations-capstone";

export const AGENTIC_QUANT_TRADING_MODULES = [
  {
    slug: "scope-safety-autonomy",
    phaseId: "mandate-data-authority",
    minutes: 55,
    sourceIds: ["nist-ai-rmf", "sec-ai-investment-fraud", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
    copy: {
      en: {
        kicker: "Mandate before model",
        title: "Scope, safety, and bounded autonomy",
        summary: "Turn an exciting trading-agent idea into a paper-only research mandate with explicit users, non-users, permissions, prohibited actions, and escalation rules.",
        objective: "Write a scope and authority contract that prevents advice, live orders, secret handling, and autonomous expansion beyond a reviewed paper-trading experiment.",
        artifact: "Paper-desk mandate and prohibited-actions register",
        sections: [
          {
            heading: "Define the decision and the non-decision",
            sourceIds: ["sec-ai-investment-fraud", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
            paragraphs: [
              "A quantitative agent is not a free-standing investor. It is a research system that may propose hypotheses, transform approved data, run reproducible simulations, and prepare a paper-order candidate for human review. Begin with the decision owner, permitted universe, horizon, benchmark, data licence, intended learner, and evidence standard. Then state what the system does not decide: it does not provide investment advice, accept client money, personalize suitability, or send a live order.",
              "Separate analytical usefulness from financial performance. A workflow can be valuable because it exposes assumptions, lineage, uncertainty, and failure modes even when the simulated strategy loses money. Conversely, an attractive backtest is not authorization to trade. The mandate must name the review gate that converts an agent proposal into a paper-only experiment and the person allowed to stop it.",
            ],
            bullets: ["Paper trading only", "No investment advice", "No live broker credentials or order endpoints", "Human review owns every scope change"],
          },
          {
            heading: "Allocate authority and fail closed",
            sourceIds: ["nist-ai-rmf", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
            paragraphs: [
              "Build an authority matrix across data read, data write, code execution, model calls, experiment creation, paper-order creation, and incident response. Default every unlisted capability to denied. Give each permitted capability a narrow resource boundary, expiration, rate limit, audit record, and named approver. A language model may draft a proposal; deterministic code must enforce schemas, exposure ceilings, environment selection, and the ban on live execution.",
              "Treat prompts, retrieved text, repository issues, and social posts as untrusted inputs. They may contain persuasive claims or instructions that conflict with the mandate. Preserve them as evidence, never as authority. If identity, environment, freshness, licence, or approval cannot be established, the correct behavior is to abstain, quarantine the artifact, and escalate rather than improvise.",
            ],
            evidenceMode: "instructional-synthesis",
          },
        ],
        practice: {
          title: "Write the paper-desk constitution",
          brief: "Create a one-page mandate for a hypothetical research desk; do not connect any live brokerage account or provide recommendations.",
          steps: ["Name the decision owner, research question, universe, horizon, benchmark, and approved data.", "Create allow, deny, and escalate rows for every tool and action.", "Add a fail-closed test for missing approval, stale data, ambiguous environment, and prompt injection."],
          deliverable: "A signed scope card, authority matrix, and prohibited-actions register",
          reviewGate: "A reviewer can confirm that every unlisted action is denied and that no path can create or transmit a live order or investment recommendation.",
        },
        checkpoint: {
          question: "What is the safest default when a proposed tool action is absent from the authority matrix?",
          options: ["Allow it if the model explains why", "Run it once in production", "Deny it and request explicit review", "Infer permission from a social post"],
          correctIndex: 2,
          explanation: "Bounded autonomy is fail-closed: missing authority is a denial, not an invitation to infer permission.",
        },
        takeaway: "No mandate, no action: this course permits auditable research and paper simulation only—never live orders or investment advice.",
      },
      zhHans: {
        kicker: "先定授权，再谈模型",
        title: "范围、安全与有限自主权",
        summary: "把令人兴奋的交易智能体设想，收敛为仅限模拟盘的研究授权书，明确用户、非用户、权限、禁行事项与升级规则。",
        objective: "写出范围与权限契约，阻止投资建议、实盘下单、密钥处理以及未经评审的自主扩权。",
        artifact: "模拟研究台授权书与禁行事项登记表",
        sections: [
          {
            heading: "定义要做的决策，也定义不做的决策",
            sourceIds: ["sec-ai-investment-fraud", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
            paragraphs: [
              "量化智能体不是独立投资者，而是研究系统：它可以提出假设、处理已批准数据、运行可复现实验，并生成供人工审查的模拟订单候选。先写清决策负责人、允许的资产范围、持有期、基准、数据许可、目标学习者与证据标准；再明确系统不负责什么：不提供投资建议、不接收客户资金、不做适当性判断，也不发送任何实盘订单。",
              "分析价值必须与金融收益分开。即使模拟策略亏损，只要工作流能暴露假设、数据血缘、不确定性和失败模式，仍然具有学习价值；反过来，漂亮的回测也不构成交易授权。授权书必须写明：谁把智能体建议批准为模拟实验，谁有权随时停止。",
            ],
            bullets: ["仅限模拟盘", "不构成投资建议", "不得接入实盘凭证或订单端点", "任何扩展范围都由人类评审"],
          },
          {
            heading: "分配权限并默认关闭",
            sourceIds: ["nist-ai-rmf", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
            paragraphs: [
              "为数据读取、数据写入、代码执行、模型调用、实验创建、模拟订单创建与事故响应建立权限矩阵。未列出的能力一律拒绝；每项允许能力都要有资源边界、失效时间、速率限制、审计记录和具名批准人。语言模型可以起草建议，但环境选择、schema、风险上限与禁止实盘必须由确定性代码执行。",
              "提示词、检索文本、仓库 issue 与社交帖子都属于不可信输入，其中可能夹带与授权冲突的诱导性指令。它们可以作为待核验证据，却不能成为授权来源。身份、环境、时效、许可或批准无法确认时，正确行为是拒绝执行、隔离产物并升级，而不是自行补全。",
            ],
            evidenceMode: "instructional-synthesis",
          },
        ],
        practice: {
          title: "编写模拟研究台宪章",
          brief: "为一个假想研究台制作一页授权书；不得连接实盘券商账户，也不得给出买卖建议。",
          steps: ["写明决策负责人、研究问题、资产范围、时间跨度、基准与批准数据。", "为每种工具和动作建立允许、禁止、升级三类条目。", "为缺少批准、数据过期、环境含糊与提示词注入增加默认关闭测试。"],
          deliverable: "范围卡、权限矩阵与禁行事项登记表",
          reviewGate: "评审者能够确认：所有未列动作均被拒绝，系统不存在创建或发送实盘订单、输出投资建议的路径。",
        },
        checkpoint: {
          question: "某项工具动作没有出现在权限矩阵中时，最安全的默认处理是什么？",
          options: ["模型解释合理即可允许", "先在生产环境试一次", "拒绝执行并请求明确评审", "根据社交帖子推断权限"],
          correctIndex: 2,
          explanation: "有限自主权遵循默认关闭：缺少授权即拒绝，不能自行推断。",
        },
        takeaway: "无授权，不行动：本课程只允许可审计研究与模拟交易，绝不允许实盘订单或投资建议。",
      },
    },
  },
  {
    slug: "market-data-time-contracts",
    phaseId: "mandate-data-authority",
    minutes: 60,
    sourceIds: ["github-qlib", "github-openbb", "x-openbb-workspace-mcp-2026"],
    copy: {
      en: {
        kicker: "Time is part of the data",
        title: "Market data and time contracts",
        summary: "Make timestamps, availability, revisions, calendars, identifiers, corporate actions, and missingness explicit before any feature is computed.",
        objective: "Build a point-in-time data contract that prevents future information from entering a historical decision and makes every dataset snapshot reproducible.",
        artifact: "Point-in-time market-data contract and lineage table",
        sections: [
          {
            heading: "Model three clocks, not one timestamp",
            sourceIds: ["github-qlib", "github-openbb"],
            paragraphs: [
              "A market record can have an event time, a publication or availability time, and an ingestion time. A filing dated Tuesday may not have been public when Tuesday's simulated decision was made; a revised macro series may differ from the vintage available then. Define the decision cutoff and join only information whose availability time is at or before that cutoff. Record timezone, daylight-saving behavior, trading calendar, session boundaries, and whether bars are labeled by open or close.",
              "Identifiers also change through mergers, delistings, share-class changes, and vendor mappings. A point-in-time universe must retain dead and renamed instruments rather than quietly selecting today's survivors. Corporate actions require an explicit adjustment policy, and both raw and adjusted values need lineage. Missing values are states to explain—not permission to forward-fill across closures, suspensions, or pre-listing periods.",
            ],
          },
          {
            heading: "Freeze a reproducible snapshot",
            sourceIds: ["github-qlib", "github-openbb"],
            paragraphs: [
              "A usable contract names vendor or repository, endpoint or table, licence, schema, units, timezone, calendar, availability rule, revision policy, adjustment method, universe construction, missingness policy, quality checks, retrieval time, and content hash. Preserve raw immutably and create transformations as versioned derivatives. Every feature row should be traceable back to the exact snapshot and code version that created it.",
              "If a timestamp field or adjustment method is ambiguous, block the experiment until the contract is resolved; a silent assumption can turn future information into apparently exceptional alpha. Operational semantics must come from version-pinned documentation, repository code, and local contract tests.",
            ],
          },
          {
            heading: "Version watch: agent-facing access is an announcement",
            sourceIds: ["x-openbb-workspace-mcp-2026", "github-openbb"],
            paragraphs: [
              "OpenBB's May 2026 X post announced Workspace MCP and links to the vendor's launch article. That evidence establishes the dated announcement only. It does not establish point-in-time data quality, security, reliability, or fitness for a trading experiment; those claims require the pinned repository, provider documentation, and local tests.",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "Audit a two-table join",
          brief: "Design a paper experiment that joins daily prices with a slowly published signal while preserving historical availability.",
          steps: ["Label event, availability, and ingestion times for both tables.", "Specify an as-of join, calendar, timezone, revision, and missing-value policy.", "Construct one adversarial row that would leak future information and show the contract rejecting it."],
          deliverable: "A data dictionary, lineage table, and point-in-time join test",
          reviewGate: "Another learner can reproduce the snapshot and prove that no value unavailable at decision time enters the simulated feature set.",
        },
        checkpoint: {
          question: "Which timestamp controls whether a signal may enter a historical decision?",
          options: ["The filename date", "The economic event date alone", "The time the value was actually available to the decision maker", "The latest revision date"],
          correctIndex: 2,
          explanation: "Point-in-time research uses availability at the decision cutoff, not a convenient date that may encode hindsight.",
        },
        takeaway: "If availability time, calendar, revision, and lineage are not explicit, the dataset is not ready for a trading experiment.",
      },
      zhHans: {
        kicker: "时间本身就是数据",
        title: "市场数据与时间契约",
        summary: "在计算任何特征前，明确时间戳、可得性、修订、交易日历、标识映射、公司行动与缺失机制。",
        objective: "建立时点一致的数据契约，阻止未来信息进入历史决策，并让每个数据快照都可复现。",
        artifact: "时点一致的市场数据契约与血缘表",
        sections: [
          {
            heading: "一个记录至少有三只时钟",
            sourceIds: ["github-qlib", "github-openbb"],
            paragraphs: [
              "市场记录可能同时具有事件发生时间、公开可得时间与系统摄取时间。标注为周二的公告，未必在周二的模拟决策前已经公开；最新修订后的宏观序列，也未必等于当时可见的历史版本。必须定义决策截止点，只连接在截止点之前已实际可得的信息，并记录时区、夏令时、交易日历、盘中边界以及 K 线以开盘还是收盘标记。",
              "证券标识会随合并、退市、名称与股类变化而改变。时点一致的资产池必须保留已经消失的标的，不能悄悄只选择今天仍存续的赢家。公司行动需要明确复权政策，原始值和复权值都要保留血缘。缺失值也是需要解释的状态，不能跨休市、停牌或上市前时期随意填充。",
            ],
          },
          {
            heading: "冻结可复现的数据快照",
            sourceIds: ["github-qlib", "github-openbb"],
            paragraphs: [
              "完整契约要写明供应商或仓库、端点或表、许可、schema、单位、时区、日历、可得性规则、修订政策、复权方法、资产池构造、缺失政策、质量检查、抓取时间与内容哈希。原始数据只读保存，转换数据作为带版本的派生物。每条特征都应能追溯到精确快照与生成代码版本。",
              "若时间字段或复权方法含糊，应阻断实验直至契约澄清；一个静默假设就可能把未来信息伪装成惊人的 alpha。操作语义必须来自固定版本文档、仓库代码与本地契约测试。",
            ],
          },
          {
            heading: "版本观察：面向智能体的接入仍只是公告",
            sourceIds: ["x-openbb-workspace-mcp-2026", "github-openbb"],
            paragraphs: [
              "OpenBB 在 2026 年 5 月的 X 帖子中宣布 Workspace MCP，并链接厂商发布文章。该证据只能确认这条有日期的公告，不能证明时点数据质量、安全、可靠或适合交易实验；这些技术判断必须依赖固定仓库、供应商文档与本地测试。",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "审计双表连接",
          brief: "设计一个把日频价格与延迟发布信号连接起来的模拟实验，同时保留历史可得性。",
          steps: ["为两张表分别标记事件、可得与摄取时间。", "写明 as-of join、日历、时区、修订与缺失值政策。", "构造一条会泄漏未来信息的对抗样本，并展示契约如何拒绝它。"],
          deliverable: "数据字典、血缘表与时点连接测试",
          reviewGate: "另一位学习者可以重建快照，并证明决策时尚不可得的值没有进入模拟特征。",
        },
        checkpoint: {
          question: "哪个时间决定一项信号能否进入历史决策？",
          options: ["文件名日期", "仅看经济事件日期", "该值对决策者实际可得的时间", "最新修订日期"],
          correctIndex: 2,
          explanation: "时点一致研究依据决策截止时的实际可得性，而不是可能包含后见之明的方便日期。",
        },
        takeaway: "可得时间、日历、修订与血缘没有写清，数据就不能进入交易实验。",
      },
    },
  },
  {
    slug: "agent-architecture-authority",
    phaseId: "mandate-data-authority",
    minutes: 65,
    sourceIds: ["github-rd-agent", "github-tradingagents", "x-didier-openbb-codex-2026"],
    copy: {
      en: {
        kicker: "Separate proposing from permitting",
        title: "Agent architecture and authority boundaries",
        summary: "Design an event-driven research architecture in which probabilistic agents propose and critique while deterministic services validate, authorize, and record.",
        objective: "Draw a typed agent graph with least-privilege tools, immutable events, approval points, budgets, abstention, and deterministic paper-only enforcement.",
        artifact: "Typed agent graph and tool-policy matrix",
        sections: [
          {
            heading: "Use roles for accountability, not theatre",
            sourceIds: ["github-tradingagents", "github-rd-agent"],
            paragraphs: [
              "Useful roles correspond to distinct evidence responsibilities: a planner decomposes the mandate; a data steward verifies snapshots; a researcher proposes hypotheses; an experiment runner executes versioned code; a risk reviewer challenges assumptions; and an operator handles paper execution and incidents. Each role receives only the context and tools it needs. A role name does not create independence—agents sharing one model, prompt lineage, or dataset may fail together.",
              "Represent handoffs as typed messages containing task ID, inputs, source locators, code and data versions, assumptions, confidence, unresolved questions, and requested action. Reject free-form handoffs that omit required fields. Persist append-only events so a reviewer can reconstruct who proposed, checked, approved, rejected, or timed out at every transition.",
            ],
          },
          {
            heading: "Put deterministic gates around probabilistic work",
            sourceIds: ["github-rd-agent", "github-tradingagents"],
            paragraphs: [
              "Language models can generate research plans, code drafts, critiques, and explanations, but they must not decide environment, credentials, maximum exposure, order validity, or release eligibility. Deterministic services validate schemas, enforce resource and token budgets, pin environments, calculate limits, route only to a simulator, and refuse unknown tool calls. Human approval is a recorded transition, not a reassuring sentence inside a prompt.",
              "Add idempotency keys, bounded retries, timeouts, circuit breakers, and explicit terminal states: completed, rejected, abstained, quarantined, or escalated. An agent that cannot cite its evidence or satisfy a gate must stop. The authority model must be verified in code and local tests before trust is assigned.",
            ],
            evidenceMode: "instructional-synthesis",
          },
          {
            heading: "Version watch: a founder demo is not an authority model",
            sourceIds: ["x-didier-openbb-codex-2026"],
            paragraphs: [
              "A May 2026 founder post demonstrated an external coding agent connected to OpenBB Workspace MCP. It is a dated first-party demonstration and does not establish permissions, security, reliability, compatibility, or production readiness. Use it to watch the ecosystem; derive technical authority rules from pinned code and local boundary tests.",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "Threat-model an agent graph",
          brief: "Design a research-to-paper-order graph and identify where untrusted text, excessive permission, or correlated failures could cross a boundary.",
          steps: ["Draw roles, typed inputs and outputs, tools, stores, and trust boundaries.", "Mark deterministic gates, human approvals, budgets, retry rules, and terminal states.", "Inject one malicious retrieved instruction and one duplicated request; demonstrate rejection and idempotency."],
          deliverable: "An architecture diagram, tool-policy matrix, and two boundary-test traces",
          reviewGate: "No model-authored message can grant permission, access credentials, bypass a gate, or route anything beyond the paper simulator.",
        },
        checkpoint: {
          question: "Which responsibility must remain outside a language model's discretionary output?",
          options: ["Drafting a hypothesis", "Summarizing a source", "Enforcing environment and exposure limits", "Proposing a critique"],
          correctIndex: 2,
          explanation: "Hard safety and authority constraints belong to deterministic enforcement with auditable approval transitions.",
        },
        takeaway: "Agents may propose and challenge; deterministic gates and named humans own permission, limits, and the paper-only boundary.",
      },
      zhHans: {
        kicker: "把建议权与许可权分开",
        title: "智能体架构与权限边界",
        summary: "设计事件驱动的研究架构：概率型智能体负责提议和质疑，确定性服务负责校验、授权与留痕。",
        objective: "绘制带类型的智能体图，落实最小权限、不可变事件、批准点、预算、弃权与仅限模拟盘的确定性约束。",
        artifact: "带类型的智能体图与工具权限矩阵",
        sections: [
          {
            heading: "角色服务于问责，而不是角色扮演",
            sourceIds: ["github-tradingagents", "github-rd-agent"],
            paragraphs: [
              "有意义的角色对应不同证据责任：规划者拆解授权，数据管理员核验快照，研究者提出假设，实验执行者运行版本化代码，风险评审者挑战假设，运营者处理模拟执行和事故。每个角色只获得完成任务所需的上下文与工具。角色名称本身不等于独立性；共享同一模型、提示链或数据的多个智能体可能同时犯错。",
              "把交接表示为带类型消息，包含任务 ID、输入、来源定位、代码与数据版本、假设、置信度、未解决问题和请求动作。缺少必填字段的自由文本交接必须拒绝。保存只追加事件，使评审者能够重建每个转换中谁提出、谁核验、谁批准、谁拒绝或超时。",
            ],
          },
          {
            heading: "用确定性门禁包围概率型工作",
            sourceIds: ["github-rd-agent", "github-tradingagents"],
            paragraphs: [
              "语言模型可以生成研究计划、代码草稿、批评与解释，但不能自行决定运行环境、凭证、最大暴露、订单合法性或发布资格。确定性服务负责校验 schema、限制资源与 token、固定环境、计算上限、只路由到模拟器，并拒绝未知工具调用。人工批准必须是有记录的状态转换，不能只是提示词里的一句安慰。",
              "加入幂等键、有限重试、超时、熔断器以及明确终态：完成、拒绝、弃权、隔离或升级。无法引用证据或通过门禁的智能体必须停止。权限模型必须经代码检查与本地测试核验后才可信任。",
            ],
            evidenceMode: "instructional-synthesis",
          },
          {
            heading: "版本观察：创始人演示不是权限模型",
            sourceIds: ["x-didier-openbb-codex-2026"],
            paragraphs: [
              "2026 年 5 月的一则创始人帖子演示了外部编程智能体连接 OpenBB Workspace MCP。它只是有日期的一方演示，不证明权限、安全、可靠、兼容或生产就绪。它适合观察生态变化；技术权限规则必须来自固定代码与本地边界测试。",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "对智能体图进行威胁建模",
          brief: "设计从研究到模拟订单的图，识别不可信文本、过度权限或相关性失败可能跨越边界的位置。",
          steps: ["绘制角色、类型化输入输出、工具、存储和信任边界。", "标记确定性门禁、人工批准、预算、重试规则与终态。", "注入一条恶意检索指令和一个重复请求，展示拒绝与幂等处理。"],
          deliverable: "架构图、工具权限矩阵与两条边界测试轨迹",
          reviewGate: "任何模型生成消息都不能授予权限、读取凭证、绕过门禁或把动作路由到模拟器以外。",
        },
        checkpoint: {
          question: "哪项责任必须置于语言模型的自由裁量之外？",
          options: ["起草假设", "总结来源", "执行环境与暴露上限", "提出批评"],
          correctIndex: 2,
          explanation: "硬性安全与权限约束应由确定性机制执行，并通过可审计批准转换控制。",
        },
        takeaway: "智能体可以建议和质疑；许可、上限与仅限模拟盘的边界由确定性门禁和具名人员负责。",
      },
    },
  },
  {
    slug: "hypotheses-experiment-ledger",
    phaseId: "research-signals-backtest",
    minutes: 60,
    sourceIds: ["github-rd-agent", "paper-backtest-overfitting", "x-openbb-excel-to-agents-2025", "x-didier-openbb-codex-2026"],
    copy: {
      en: {
        kicker: "A claim needs a receipt",
        title: "Hypotheses and the experiment ledger",
        summary: "Convert agent-generated ideas into falsifiable, preregistered experiments with immutable lineage, budgets, negative results, and controlled deviations.",
        objective: "Operate a hypothesis ledger that prevents quiet story changes, duplicate discovery, selective reporting, and unlimited autonomous search.",
        artifact: "Hypothesis cards and append-only experiment ledger",
        sections: [
          {
            heading: "Precommit the testable claim",
            sourceIds: ["github-rd-agent", "paper-backtest-overfitting"],
            paragraphs: [
              "A hypothesis card states mechanism, observable prediction, universe, decision time, holding period, target, benchmark, evaluation metric, expected failure conditions, and evidence that would count against the claim. Freeze the card before inspecting the holdout. If an agent proposes a variation after seeing results, record a new hypothesis ID instead of rewriting the original story.",
              "Separate confirmatory tests from exploration. Exploration can discover useful questions, but its results require new out-of-sample confirmation. Limit each research cycle by hypotheses, compute, model calls, and wall time. A budget is a scientific control as well as a cost control: unlimited search increases the chance of finding a lucky pattern and presenting it as insight.",
            ],
          },
          {
            heading: "Make every run reconstructable",
            sourceIds: ["github-rd-agent"],
            paragraphs: [
              "The experiment ledger links hypothesis ID, parent run, agent and human roles, data snapshot, feature code, configuration, environment lock, random seeds, start and end time, outputs, diagnostics, decision, and failure reason. Store rejected, null, and crashed runs alongside winners. Deduplicate semantically equivalent proposals so repeated agents do not manufacture a false sense of replication.",
              "Deviations are allowed when they are visible and prospective. Record why the original plan was insufficient, who approved the change, which data had already been observed, and which claims are now exploratory. No workflow narrative substitutes for a frozen hypothesis, executable receipt, or independent evaluation.",
            ],
          },
          {
            heading: "Version watch: workflow narratives are inspiration only",
            sourceIds: ["x-openbb-excel-to-agents-2025", "x-didier-openbb-codex-2026"],
            paragraphs: [
              "OpenBB and its founder posted first-party narratives about moving research work from spreadsheets toward agent-facing infrastructure. Those dated posts establish that the narratives were published; they do not establish productivity, accuracy, lineage, general compatibility, or investment outcomes. Treat them as prompts for hypotheses, never as experiment receipts.",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "Register three competing hypotheses",
          brief: "Create one primary hypothesis, one plausible alternative, and one null explanation for a paper-only experiment.",
          steps: ["Write mechanism, prediction, universe, horizon, benchmark, metric, and falsifier for each card.", "Assign data, compute, model-call, and variation budgets before running anything.", "Design an append-only ledger row that records results, failures, deviations, and reviewer decisions."],
          deliverable: "Three frozen hypothesis cards and a populated experiment-ledger schema",
          reviewGate: "A reviewer can distinguish confirmatory from exploratory work and recover negative, failed, and superseded runs without relying on chat history.",
        },
        checkpoint: {
          question: "What should happen when an agent changes a hypothesis after seeing holdout results?",
          options: ["Silently update the original card", "Delete the failed run", "Create a new exploratory hypothesis and preserve the deviation", "Call the change independent confirmation"],
          correctIndex: 2,
          explanation: "Post-result changes must remain visible and exploratory; the original hypothesis and outcome stay immutable.",
        },
        takeaway: "An idea becomes research only when its claim, budget, lineage, deviations, and negative results have durable receipts.",
      },
      zhHans: {
        kicker: "每项主张都要有收据",
        title: "假设与实验台账",
        summary: "把智能体生成的想法转化为可证伪、预先登记的实验，并保留不可变血缘、预算、负结果与受控偏离。",
        objective: "运行假设台账，防止悄悄改故事、重复发现、选择性报告和无限制自主搜索。",
        artifact: "假设卡与只追加实验台账",
        sections: [
          {
            heading: "预先承诺可检验主张",
            sourceIds: ["github-rd-agent", "paper-backtest-overfitting"],
            paragraphs: [
              "假设卡要写明机制、可观察预测、资产范围、决策时点、持有期、目标、基准、评估指标、预期失败条件以及什么证据会反驳主张。查看留出集前冻结卡片。若智能体看完结果后提出变体，应创建新的假设 ID，而不是重写原来的故事。",
              "确认性检验与探索必须分开。探索可以发现好问题，但其结果需要新的样本外确认。按假设数量、计算量、模型调用和墙钟时间限制每轮研究。预算不仅控制成本，也是科学控制：无限搜索更容易找到幸运模式，再把偶然包装成洞见。",
            ],
          },
          {
            heading: "让每次运行都可重建",
            sourceIds: ["github-rd-agent"],
            paragraphs: [
              "实验台账连接假设 ID、父运行、智能体和人类角色、数据快照、特征代码、配置、环境锁、随机种子、起止时间、输出、诊断、决策与失败原因。被拒绝、无效和崩溃的运行要与优胜结果一起保存。语义相同的建议需要去重，避免多个智能体重复同一想法，却制造出虚假的重复验证感。",
              "偏离可以发生，但必须可见且前瞻记录：说明原计划为何不足、谁批准变更、已经看过哪些数据，以及哪些结论因此降级为探索性。任何工作流叙事都不能替代冻结假设、可执行收据或独立评估。",
            ],
          },
          {
            heading: "版本观察：工作流叙事只能启发问题",
            sourceIds: ["x-openbb-excel-to-agents-2025", "x-didier-openbb-codex-2026"],
            paragraphs: [
              "OpenBB 与其创始人发布过把研究从表格迁向智能体基础设施的一方叙事。这些有日期的帖子只能证明叙事曾发布，不能证明生产率、准确性、数据血缘、普遍兼容或投资结果。它们可以启发假设，却不能充当实验收据。",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "登记三个竞争假设",
          brief: "为仅限模拟盘的实验建立一个主要假设、一个合理替代解释和一个零效应解释。",
          steps: ["为每张卡写出机制、预测、资产范围、周期、基准、指标和证伪条件。", "运行前分配数据、计算、模型调用和变体预算。", "设计只追加台账行，记录结果、失败、偏离与评审决定。"],
          deliverable: "三张冻结假设卡与已填充的实验台账 schema",
          reviewGate: "评审者无需依赖聊天记录，就能区分确认与探索，并恢复负结果、失败运行和被取代版本。",
        },
        checkpoint: {
          question: "智能体看到留出集结果后改变假设，应如何处理？",
          options: ["静默更新原卡片", "删除失败运行", "创建新的探索性假设并保留偏离记录", "称其为独立确认"],
          correctIndex: 2,
          explanation: "观察结果后的改变必须保持可见，并降级为探索；原假设与结果不可改写。",
        },
        takeaway: "只有主张、预算、血缘、偏离和负结果都留下持久收据，想法才成为研究。",
      },
    },
  },
  {
    slug: "features-labels-text-signals",
    phaseId: "research-signals-backtest",
    minutes: 65,
    sourceIds: ["github-fingpt", "github-openbb", "github-qlib"],
    copy: {
      en: {
        kicker: "Signals inherit their provenance",
        title: "Features, labels, and text signals",
        summary: "Engineer numerical and text-derived signals with point-in-time lineage, train-only fitting, versioned models, and explicit abstention.",
        objective: "Specify a feature and label pipeline whose timing, transformations, text provenance, model version, and missingness can be audited row by row.",
        artifact: "Feature-label specification and text-signal evidence cards",
        sections: [
          {
            heading: "Define the prediction target before features",
            sourceIds: ["github-qlib"],
            paragraphs: [
              "A label needs an observation cutoff, entry convention, horizon, return definition, corporate-action treatment, cost assumption, and rule for overlapping outcomes. Features must be computable at the cutoff. Rolling normalization, imputation, vocabulary construction, embedding models, and feature selection are fitted on training data only, then applied unchanged to validation and test periods.",
              "Document units, direction, transformation window, minimum history, missingness semantics, and stability expectation for every feature. Economic intuition is not proof, but it helps identify impossible signs and hidden dependencies. Run invariance tests: shifting future rows must not change past features, and a newly listed asset must not inherit history it did not possess.",
            ],
          },
          {
            heading: "Treat text as timestamped evidence, not magic sentiment",
            sourceIds: ["github-fingpt", "github-openbb"],
            paragraphs: [
              "For filings, news, transcripts, repository discussions, and X posts, preserve author or publisher, direct URL, publication and edit times, collection time, language, document hash, deduplication rule, quoted span, and licence boundary. Separate the source text from the model's extracted event, sentiment, or risk classification. Store prompt, model and tokenizer version, decoding settings, structured output, confidence, and human verification status.",
              "Text models can hallucinate entities, misread negation, and retroactively absorb later knowledge. Use entity resolution, temporal cutoff tests, calibration samples, and an abstain state when evidence is ambiguous. X content is a contemporaneous claim stream, not verified truth and not a return forecast; corroborate material facts with primary documentation before a signal enters the experiment.",
            ],
            evidenceMode: "instructional-synthesis",
          },
        ],
        practice: {
          title: "Build a leak-resistant signal card",
          brief: "Specify one numerical feature and one text-derived event signal without producing a security recommendation.",
          steps: ["Define cutoff, label horizon, entry convention, transformations, and train-only fitted state.", "Attach source URL, timestamps, quote span, model version, prompt hash, confidence, and abstention rule to the text signal.", "Run a future-row mutation test and manually review a stratified sample of positive, negative, and abstained cases."],
          deliverable: "Two feature cards, a label contract, and temporal-invariance test results",
          reviewGate: "Every row can be recreated from information available at the cutoff, and uncertain text is abstained rather than converted into fabricated conviction.",
        },
        checkpoint: {
          question: "When should a normalization transform be fitted for an out-of-sample evaluation?",
          options: ["On the full dataset", "On the test period", "On training data only", "After selecting the best test result"],
          correctIndex: 2,
          explanation: "Fitting transforms on validation or test data leaks distributional information into the historical decision process.",
        },
        takeaway: "A signal is credible only when its cutoff, lineage, fitted state, model version, and abstention behavior are reconstructable.",
      },
      zhHans: {
        kicker: "信号继承其证据血缘",
        title: "特征、标签与文本信号",
        summary: "以时点一致的血缘、仅训练集拟合、模型版本和明确弃权机制，构建数值与文本信号。",
        objective: "规定一条可逐行审计的特征—标签流水线，覆盖时间、转换、文本来源、模型版本与缺失机制。",
        artifact: "特征—标签规格与文本信号证据卡",
        sections: [
          {
            heading: "先定义预测目标，再设计特征",
            sourceIds: ["github-qlib"],
            paragraphs: [
              "标签需要观察截止点、入场约定、预测周期、收益定义、公司行动处理、成本假设和重叠结果规则。所有特征必须在截止点可计算。滚动标准化、插补、词表构建、嵌入模型与特征选择只能在训练集拟合，然后原样应用到验证与测试时段。",
              "每个特征都要记录单位、方向、转换窗口、最少历史、缺失含义和预期稳定性。经济直觉不是证据，却有助于发现不可能的符号和隐藏依赖。应运行不变性测试：修改未来行不能改变过去特征，新上市标的也不能继承它从未拥有的历史。",
            ],
          },
          {
            heading: "把文本当作带时间戳的证据，而非魔法情绪",
            sourceIds: ["github-fingpt", "github-openbb"],
            paragraphs: [
              "对公告、新闻、电话会、仓库讨论和 X 帖子，保留作者或发布者、直接 URL、发布与编辑时间、采集时间、语言、文档哈希、去重规则、引用片段和许可边界。原始文本必须与模型抽取的事件、情绪或风险分类分开；同时保存提示词、模型与 tokenizer 版本、解码设置、结构化输出、置信度与人工核验状态。",
              "文本模型可能虚构实体、误读否定，并从训练数据中带入后来的知识。使用实体解析、时间截止测试、校准样本以及证据含糊时的弃权状态。X 内容是同时期主张流，不是已核事实，更不是收益预测；重大事实进入实验前必须由一手文档交叉核验。",
            ],
            evidenceMode: "instructional-synthesis",
          },
        ],
        practice: {
          title: "构建抗泄漏信号卡",
          brief: "规定一个数值特征和一个文本事件信号，不得据此输出证券买卖建议。",
          steps: ["定义截止点、标签周期、入场约定、转换和仅训练集拟合状态。", "为文本信号附加来源 URL、时间戳、引用片段、模型版本、提示哈希、置信度和弃权规则。", "运行未来行突变测试，并分层人工检查正例、负例与弃权案例。"],
          deliverable: "两张特征卡、一份标签契约与时间不变性测试结果",
          reviewGate: "每行都能从截止点前可得信息重建，含糊文本会触发弃权，而不是被转换成虚假的确定性。",
        },
        checkpoint: {
          question: "样本外评估中的标准化转换应在何时拟合？",
          options: ["在全数据上", "在测试期上", "只在训练数据上", "选出最佳测试结果后"],
          correctIndex: 2,
          explanation: "在验证或测试数据上拟合转换，会把分布信息泄漏进历史决策。",
        },
        takeaway: "只有截止点、血缘、拟合状态、模型版本与弃权行为均可重建，信号才可信。",
      },
    },
  },
  {
    slug: "backtest-leakage-costs",
    phaseId: "research-signals-backtest",
    minutes: 75,
    sourceIds: ["github-backtesting-py", "github-vectorbt", "github-freqtrade", "github-lean", "github-backtrader", "paper-backtest-overfitting"],
    copy: {
      en: {
        kicker: "A simulator is an argument",
        title: "Backtesting, leakage, and realistic costs",
        summary: "Construct a causal event simulation with executable timing, survivorship controls, realistic frictions, invariants, and adversarial leakage tests.",
        objective: "Produce a backtest specification whose data availability, signal timing, fills, costs, accounting, and failure tests can be independently reproduced.",
        artifact: "Causal backtest specification and leakage test suite",
        sections: [
          {
            heading: "Write the event order before running returns",
            sourceIds: ["github-backtesting-py", "github-lean", "github-backtrader"],
            paragraphs: [
              "Define when data becomes visible, when a signal is computed, when an order may be submitted, which price can plausibly fill it, and when the position enters the portfolio. A close-derived signal cannot fill at the same close unless an explicit auction mechanism and cutoff support that assumption. Use point-in-time constituents, delisted assets, corporate actions, borrow availability, and trading halts appropriate to the universe.",
              "Make the accounting identity executable: opening cash and positions plus fills, fees, financing, borrow costs, dividends, and mark-to-market changes must reconcile to closing equity. Decide how partial fills, rejected orders, limit gaps, zero volume, and missing bars behave. A vectorized implementation and an event-driven implementation should agree on a small deterministic fixture before scale hides mistakes.",
            ],
          },
          {
            heading: "Attack leakage and optimistic friction",
            sourceIds: ["paper-backtest-overfitting", "github-vectorbt", "github-freqtrade"],
            paragraphs: [
              "Create tests for label overlap, global normalization, future-aware joins, revised fundamentals, today's universe, feature selection on the test set, and accidental reuse of holdout results. Include a deliberately leaked feature and require the suite to detect it. Shift every signal by one bar and examine whether performance changes in a way consistent with execution timing.",
              "Costs are scenario variables, not a decorative fee. Model commissions, spread, slippage, market impact proxy, borrow and financing costs, turnover, order size relative to liquidity, and capacity ceilings. Stress them across plausible ranges and report gross beside net. If a result disappears under modest friction or alternative fills, the correct conclusion is fragility—not permission for the agent to search until a better chart appears.",
            ],
          },
        ],
        practice: {
          title: "Break a backtest before believing it",
          brief: "Use synthetic data to test a paper-only strategy engine; no live endpoint or real order is permitted.",
          steps: ["Specify event order, universe, fills, costs, accounting, and rejection behavior.", "Create fixtures for a delisting, missing bar, split, zero liquidity, and deliberately leaked feature.", "Compare vectorized and event-driven outputs and run cost, delay, and one-bar-shift stresses."],
          deliverable: "A versioned simulator spec, deterministic fixtures, and leakage-and-cost report",
          reviewGate: "The simulator fails the intentionally leaked case, reconciles cash and positions exactly, and labels all execution assumptions as simulations rather than observed fills.",
        },
        checkpoint: {
          question: "A signal computed from the closing price is filled at that same close without an auction cutoff model. What is the primary problem?",
          options: ["Too few assets", "Look-ahead in signal-to-fill timing", "Too much diversification", "Missing a language model"],
          correctIndex: 1,
          explanation: "The assumed fill uses information that may not have been actionable before the close, creating temporal leakage.",
        },
        takeaway: "A backtest is credible only after causal timing, point-in-time membership, costs, accounting, and adversarial leakage tests survive review.",
      },
      zhHans: {
        kicker: "模拟器本身就是一套论证",
        title: "回测、泄漏与真实成本",
        summary: "建立具有可执行时间顺序、幸存者控制、真实摩擦、不变量与对抗性泄漏测试的因果事件模拟。",
        objective: "产出可独立复现的回测规格，覆盖数据可得性、信号时间、成交、成本、会计与失败测试。",
        artifact: "因果回测规格与泄漏测试套件",
        sections: [
          {
            heading: "在计算收益前先写事件顺序",
            sourceIds: ["github-backtesting-py", "github-lean", "github-backtrader"],
            paragraphs: [
              "明确数据何时可见、信号何时计算、订单何时可提交、什么价格可能成交以及头寸何时进入组合。使用收盘价计算的信号不能默认在同一收盘价成交，除非明确的集合竞价机制和截止时间支持该假设。资产池应采用当时成分，包含退市标的，并正确处理公司行动、借券可得性与停牌。",
              "把会计恒等式写成可执行检查：期初现金与头寸，加上成交、费用、融资、借券成本、分红和盯市变化，必须与期末权益一致。规定部分成交、拒单、跳空、零成交量和缺失 K 线如何处理。先在小型确定性 fixture 上让向量化与事件驱动实现一致，再扩大规模。",
            ],
          },
          {
            heading: "主动攻击泄漏与乐观摩擦",
            sourceIds: ["paper-backtest-overfitting", "github-vectorbt", "github-freqtrade"],
            paragraphs: [
              "为标签重叠、全局标准化、未来感知连接、修订后基本面、今日资产池、测试集选特征和重复查看留出集建立测试。加入一个故意泄漏的特征，并要求测试套件必须发现。把所有信号延迟一根 K 线，检查表现变化是否与执行时序一致。",
              "成本是情景变量，不是装饰性手续费。建模佣金、价差、滑点、市场冲击代理、借券与融资成本、换手、订单规模相对流动性以及容量上限，并在合理范围内压力测试，同时报告毛收益与净收益。若结果在轻微摩擦或替代成交假设下消失，结论应是脆弱，而不是授权智能体继续搜索更漂亮的曲线。",
            ],
          },
        ],
        practice: {
          title: "先击破回测，再考虑相信",
          brief: "用合成数据测试仅限模拟盘的策略引擎；不得接入实盘端点或创建真实订单。",
          steps: ["规定事件顺序、资产池、成交、成本、会计与拒单行为。", "为退市、缺失 K 线、拆股、零流动性和故意泄漏特征创建 fixture。", "比较向量化与事件驱动输出，并运行成本、延迟和一根 K 线平移压力测试。"],
          deliverable: "带版本的模拟器规格、确定性 fixtures 与泄漏—成本报告",
          reviewGate: "模拟器能识别故意泄漏案例，现金和头寸精确对账，并把所有成交假设标注为模拟而非真实成交。",
        },
        checkpoint: {
          question: "信号使用收盘价计算，却在没有集合竞价截止模型的情况下按同一收盘价成交，首要问题是什么？",
          options: ["资产太少", "信号到成交的时间前视", "分散度过高", "缺少语言模型"],
          correctIndex: 1,
          explanation: "假定成交使用了收盘前可能无法行动的信息，造成时间泄漏。",
        },
        takeaway: "只有因果时序、时点成分、成本、会计与对抗性泄漏测试均通过评审，回测才可信。",
      },
    },
  },
  {
    slug: "evaluation-uncertainty-overfitting",
    phaseId: "evaluation-agents-risk",
    minutes: 70,
    sourceIds: ["paper-backtest-overfitting", "github-qlib", "github-finrl", "x-ai4finance-finrl-deepseek-2025"],
    copy: {
      en: {
        kicker: "One curve is not evidence",
        title: "Evaluation, uncertainty, and overfitting",
        summary: "Evaluate across time, regimes, baselines, seeds, costs, and multiplicity while preserving a genuinely untouched final test.",
        objective: "Create an evaluation protocol that reports uncertainty and search burden, challenges economic significance, and limits claims to the evidence observed.",
        artifact: "Evaluation protocol, uncertainty table, and model-selection ledger",
        sections: [
          {
            heading: "Use temporal validation and honest baselines",
            sourceIds: ["github-qlib", "github-finrl", "paper-backtest-overfitting"],
            paragraphs: [
              "Split chronologically, purge overlapping label windows, and apply an embargo where adjacent observations share information. Walk-forward evaluation should refit only on data available at each origin and preserve a final test never used for feature design, prompting, model choice, or threshold tuning. Compare with simple baselines: cash, benchmark, equal weight, naive momentum or mean reversion, and an ablation without the agent-generated component.",
              "Report return and risk metrics with their definitions, sample size, turnover, drawdown, tail behavior, exposure, capacity proxy, and cost scenario. Segment by regime and instrument without turning every slice into a new discovery claim. Show distributions across seeds and windows, not only the best run. Economic magnitude after plausible friction matters more than a small improvement in an optimized metric.",
            ],
          },
          {
            heading: "Account for search and correlated errors",
            sourceIds: ["paper-backtest-overfitting", "github-qlib"],
            paragraphs: [
              "Every tried feature, prompt, agent role, hyperparameter, universe, and evaluation window expands the search space. Record the effective number of attempts and apply multiple-testing or false-discovery controls appropriate to the design. Use resampling that respects temporal dependence, and interpret intervals as uncertainty summaries rather than guarantees about future markets.",
              "Multi-agent agreement is not independent evidence when agents share training data, tools, prompts, or market regimes. Challenge a candidate with alternative costs, delayed execution, missing sources, changed seeds, different baselines, and negative controls. Claims must remain simulation-bound and conditional.",
            ],
          },
          {
            heading: "Version watch: a research announcement is not a result",
            sourceIds: ["x-ai4finance-finrl-deepseek-2025"],
            paragraphs: [
              "AI4Finance's February 2025 post announced and linked the FinRL-DeepSeek research artifact. The post establishes the dated promotion and linked manuscript only; it cannot substantiate performance numbers, reproducibility, deployability, costs, controls, or expected returns. Evaluate any method through the primary paper, pinned implementation, and independent replay.",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "Design an evaluation card before selection",
          brief: "Specify how one candidate will be evaluated without repeatedly peeking at the final test.",
          steps: ["Define temporal folds, purge and embargo rules, baselines, metrics, costs, seeds, and regime slices.", "Count the planned search dimensions and state the multiplicity control and stopping rule.", "Prewrite allowed wording for strong, weak, null, and contradictory results."],
          deliverable: "A frozen evaluation card, search ledger, and uncertainty-report template",
          reviewGate: "The final test is untouched, search effort is visible, and no metric is interpreted as a promise of future performance or investment advice.",
        },
        checkpoint: {
          question: "Why is selecting the best result from many agent-generated trials risky?",
          options: ["Agents run too slowly", "The best result increasingly reflects selection noise unless search is counted and controlled", "More trials remove uncertainty", "A high Sharpe ratio proves causality"],
          correctIndex: 1,
          explanation: "Unreported multiplicity turns chance winners into apparently convincing strategies; search burden must be logged and controlled.",
        },
        takeaway: "Credible evaluation preserves an untouched test, exposes search, quantifies uncertainty, and keeps conclusions conditional on historical simulation.",
      },
      zhHans: {
        kicker: "一条曲线不是证据",
        title: "评估、不确定性与过拟合",
        summary: "跨时间、市场状态、基线、随机种子、成本与多重比较进行评估，同时保留真正未触碰的最终测试集。",
        objective: "建立报告不确定性与搜索负担的评估协议，检验经济意义，并把结论限制在实际观察证据内。",
        artifact: "评估协议、不确定性表与模型选择台账",
        sections: [
          {
            heading: "使用时间验证与诚实基线",
            sourceIds: ["github-qlib", "github-finrl", "paper-backtest-overfitting"],
            paragraphs: [
              "按时间切分数据，对重叠标签窗口进行 purging，并在相邻观察共享信息时设置 embargo。走步评估只能使用每个起点之前可得的数据重新拟合；最终测试集不能参与特征设计、提示调整、模型选择或阈值调优。基线应包含现金、市场基准、等权、朴素动量或均值回归，以及去掉智能体组件的消融版本。",
              "报告收益和风险指标时同时给出定义、样本量、换手、回撤、尾部行为、暴露、容量代理与成本情景。可以按市场状态和标的分段，但不能把每个切片都包装成新发现。展示不同随机种子和窗口的分布，而不只展示最佳运行；合理摩擦后的经济量级比被优化指标的一点提升更重要。",
            ],
          },
          {
            heading: "把搜索与相关性错误计入证据",
            sourceIds: ["paper-backtest-overfitting", "github-qlib"],
            paragraphs: [
              "每个尝试过的特征、提示、角色、超参数、资产池和评估窗口都会扩大搜索空间。记录有效尝试次数，并采用与设计匹配的多重检验或错误发现控制。重采样必须尊重时间依赖，区间只是对历史不确定性的摘要，不是未来市场保证。",
              "当多个智能体共享训练数据、工具、提示或市场状态时，它们的一致意见不是独立证据。用替代成本、延迟执行、缺失来源、不同种子、其他基线和负对照挑战候选；结论必须保持模拟限定和条件化。",
            ],
          },
          {
            heading: "版本观察：研究公告不等于研究结果",
            sourceIds: ["x-ai4finance-finrl-deepseek-2025"],
            paragraphs: [
              "AI4Finance 在 2025 年 2 月的帖子中宣布并链接 FinRL-DeepSeek 研究产物。该帖只能确认有日期的推广及其所链接稿件，不能支持性能数字、可复现、可部署、成本、控制或预期收益。任何方法都要回到一手论文、固定实现与独立重放评估。",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "选择前先冻结评估卡",
          brief: "规定一个候选如何评估，避免反复查看最终测试集。",
          steps: ["定义时间折、purge 与 embargo、基线、指标、成本、随机种子和状态切片。", "统计计划中的搜索维度，写明多重比较控制与停止规则。", "预先写出强、弱、零效应与矛盾结果各自允许使用的措辞。"],
          deliverable: "冻结评估卡、搜索台账与不确定性报告模板",
          reviewGate: "最终测试集未被触碰，搜索工作量可见，任何指标都不会被解释为未来收益承诺或投资建议。",
        },
        checkpoint: {
          question: "为什么从大量智能体试验中挑选最佳结果很危险？",
          options: ["智能体运行太慢", "若不记录并控制搜索，最佳结果会越来越多地反映选择噪声", "试验越多不确定性就会消失", "高夏普率可证明因果"],
          correctIndex: 1,
          explanation: "未披露的多重搜索会把偶然赢家包装成可信策略，因此必须记录和控制搜索负担。",
        },
        takeaway: "可信评估保留未触碰测试集、公开搜索、量化不确定性，并把结论限定为历史模拟条件。",
      },
    },
  },
  {
    slug: "multi-agent-debate-verification",
    phaseId: "evaluation-agents-risk",
    minutes: 60,
    sourceIds: ["github-tradingagents", "github-rd-agent"],
    copy: {
      en: {
        kicker: "Debate needs external anchors",
        title: "Multi-agent debate and verification",
        summary: "Use structured disagreement to surface assumptions, then verify claims against primary evidence, executable tests, and independent deterministic checks.",
        objective: "Design a debate protocol that measures diversity, prevents citation laundering and consensus theatre, and ends in verified, rejected, or unresolved claims.",
        artifact: "Claim-evidence graph and adjudicated debate transcript",
        sections: [
          {
            heading: "Decompose arguments into atomic claims",
            sourceIds: ["github-tradingagents", "github-rd-agent"],
            paragraphs: [
              "A proponent must submit an atomic claim with source locator, data and code versions, assumptions, uncertainty, and a falsification test. A critic identifies counterevidence, timing errors, hidden costs, alternative explanations, or unsupported scope. An adjudicator does not vote on eloquence; it checks whether the cited evidence and executable receipt support the exact wording.",
              "Track provenance through every summary. If one agent cites another agent that summarized an X post that linked a repository, the claim must still resolve to the original post and the version-pinned repository or documentation. A fluent paraphrase cannot upgrade weak evidence. Mark each edge as supports, contradicts, contextualizes, or merely motivates.",
            ],
          },
          {
            heading: "Engineer useful disagreement",
            sourceIds: ["github-tradingagents", "github-rd-agent"],
            paragraphs: [
              "Diversity requires more than different role labels. Vary evidence subsets, prompts, model families where authorized, and analytical methods; then disclose shared dependencies. Blind first-round assessments reduce anchoring. Require critics to state what result would change their view, and require proponents to answer the strongest objection rather than a convenient one.",
              "Terminate debate by budget and evidence state, not by forced consensus. Outcomes are verified within a stated boundary, rejected, or unresolved and escalated. Deterministic recomputation, schema validation, source reachability, and citation matching outrank a majority of agents. No debate outcome can authorize live trading or transform a simulation into investment advice.",
            ],
          },
        ],
        practice: {
          title: "Adjudicate one contested claim",
          brief: "Run a bounded proponent–critic–verifier exchange around a simulated strategy claim.",
          steps: ["Express the claim atomically and attach primary locators, versions, assumptions, and a falsifier.", "Collect blind critiques from two roles and map shared dependencies and counterevidence.", "Recompute one result deterministically and classify the claim as verified-with-boundary, rejected, or unresolved."],
          deliverable: "A claim-evidence graph, dependency map, and adjudication record",
          reviewGate: "The decision follows evidence and executable checks, preserves unresolved disagreement, and contains no permission for live orders or personalized advice.",
        },
        checkpoint: {
          question: "What makes multi-agent agreement weak evidence?",
          options: ["Agents use complete sentences", "The agents may share models, data, prompts, and upstream errors", "Critics ask questions", "The transcript is long"],
          correctIndex: 1,
          explanation: "Correlated dependencies can make many agents repeat one error; independence must be demonstrated, not assumed from role names.",
        },
        takeaway: "Debate is a discovery tool; primary evidence, executable tests, and explicit unresolved states determine what can be claimed.",
      },
      zhHans: {
        kicker: "辩论必须锚定外部证据",
        title: "多智能体辩论与核验",
        summary: "用结构化分歧暴露假设，再通过一手证据、可执行测试与独立确定性检查核验主张。",
        objective: "设计能衡量多样性、防止引文洗白和共识表演，并把主张归入已核验、已拒绝或未解决状态的辩论协议。",
        artifact: "主张—证据图与已裁决辩论记录",
        sections: [
          {
            heading: "把论证拆成原子主张",
            sourceIds: ["github-tradingagents", "github-rd-agent"],
            paragraphs: [
              "支持者必须提交原子主张，并附来源定位、数据与代码版本、假设、不确定性和证伪测试。批评者寻找反证、时间错误、隐藏成本、替代解释或超范围措辞。裁决者不按表达流畅度投票，而是检查所引证据与可执行收据是否支持准确措辞。",
              "每次摘要都要追踪来源。如果一个智能体引用另一个智能体对 X 帖子的总结，而帖子又链接到仓库，主张仍须解析到原帖及固定版本仓库或文档。流畅改写不能提升弱证据等级。每条证据边都标为支持、反驳、补充背景或仅启发。",
            ],
          },
          {
            heading: "设计有用的分歧",
            sourceIds: ["github-tradingagents", "github-rd-agent"],
            paragraphs: [
              "多样性不只是换角色名称。可在授权范围内改变证据子集、提示、模型族与分析方法，同时披露共享依赖。首轮盲评可以减少锚定；批评者要说明什么结果会改变判断，支持者必须回应最强反驳，而不是方便的弱反驳。",
              "辩论按预算和证据状态终止，而不是强迫形成共识。结果只能是：在明确边界内已核验、已拒绝，或未解决并升级。确定性重算、schema 校验、来源可达性与引文匹配优先于多数智能体意见。任何辩论都不能授权实盘，也不能把模拟结果变成投资建议。",
            ],
          },
        ],
        practice: {
          title: "裁决一项有争议主张",
          brief: "围绕一个模拟策略主张，运行有预算的支持者—批评者—核验者交换。",
          steps: ["把主张写成原子形式，附一手定位、版本、假设和证伪条件。", "收集两个角色的盲评，绘制共享依赖与反证。", "确定性重算一个结果，并把主张归为有边界地核验、拒绝或未解决。"],
          deliverable: "主张—证据图、依赖图与裁决记录",
          reviewGate: "决定依据证据与可执行检查，保留未解决分歧，且不包含实盘许可或个性化建议。",
        },
        checkpoint: {
          question: "什么会使多智能体一致意见成为弱证据？",
          options: ["智能体使用完整句子", "智能体可能共享模型、数据、提示与上游错误", "批评者提出问题", "记录很长"],
          correctIndex: 1,
          explanation: "相关性依赖可能让多个智能体重复同一错误；独立性必须证明，不能从角色名称推断。",
        },
        takeaway: "辩论用于发现问题；可声称什么，取决于一手证据、可执行测试和明确的未解决状态。",
      },
    },
  },
  {
    slug: "portfolio-risk-deterministic-gates",
    phaseId: "evaluation-agents-risk",
    minutes: 75,
    sourceIds: ["github-finrl", "github-finrl-x", "github-freqtrade", "nist-ai-rmf", "finra-algorithmic-trading", "sec-market-access-rule-faq", "x-ai4finance-finrlx-2026", "x-ai4finance-finrl-deepseek-2025"],
    copy: {
      en: {
        kicker: "Risk limits are code, not prose",
        title: "Portfolio risk and deterministic gates",
        summary: "Translate portfolio objectives into independently computed exposure, concentration, liquidity, turnover, leverage, drawdown, and scenario gates.",
        objective: "Implement a deterministic paper-portfolio risk envelope that rejects invalid proposals regardless of agent confidence or narrative quality.",
        artifact: "Risk policy, golden fixtures, and gate decision log",
        sections: [
          {
            heading: "Define the risk envelope before optimization",
            sourceIds: ["finra-algorithmic-trading", "sec-market-access-rule-faq", "github-freqtrade", "nist-ai-rmf"],
            paragraphs: [
              "Specify eligible instruments, gross and net exposure, leverage, single-name and sector concentration, factor and currency exposure, liquidity participation, turnover, borrow, drawdown, and loss limits. Define valuation prices, stale-price handling, unknown exposures, and aggregation across open paper orders. Keep hard limits distinct from research preferences and document who may change each threshold.",
              "Risk is stateful. A harmless-looking order can breach a limit when combined with existing positions, pending orders, correlated assets, or a common scenario. Recompute pre-trade and post-trade state from an authoritative paper ledger. Missing price, classification, FX rate, liquidity, or position data must fail closed or reduce permission—not be replaced by an agent's estimate.",
            ],
          },
          {
            heading: "Test gates as safety-critical code",
            sourceIds: ["nist-ai-rmf", "finra-algorithmic-trading", "sec-market-access-rule-faq", "github-finrl"],
            paragraphs: [
              "Use pure, versioned functions that return decision, reason codes, measured values, thresholds, input snapshot hash, and policy version. Test exact-boundary values, sign errors, unit conversions, duplicate orders, stale inputs, empty portfolios, short positions, nonlinear products, and concurrent proposals. Golden fixtures make reviews repeatable and property tests probe combinations humans may miss.",
              "Agents may explain a rejection or propose a smaller paper position, but cannot override the gate. Stress historical and hypothetical shocks, correlations, liquidity withdrawal, and model failure. The desk's tested policy and evidence register remain authoritative.",
            ],
          },
          {
            heading: "Version watch: architecture launches are not safety evidence",
            sourceIds: ["x-ai4finance-finrlx-2026", "x-ai4finance-finrl-deepseek-2025", "github-finrl-x", "github-finrl"],
            paragraphs: [
              "AI4Finance posts announced FinRL-X and promoted FinRL-DeepSeek, with links to a repository or manuscript. Those dated announcements establish project publication and pointers only. They do not independently validate safe thresholds, broker parity, reproducibility, legal fitness, superiority, or future robustness; technical review begins with the pinned repository and primary paper.",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "Build and attack a paper-risk gate",
          brief: "Implement a deterministic decision table for simulated positions only; no live order routing is allowed.",
          steps: ["Define exposure, concentration, liquidity, turnover, leverage, drawdown, and stale-data limits with units.", "Create golden accept, reject, exact-boundary, missing-data, duplicate-order, and correlated-shock fixtures.", "Record reason codes, policy version, input hash, computed state, and reviewer decision for every result."],
          deliverable: "A versioned risk policy, executable gate tests, and decision-log sample",
          reviewGate: "Unknown or stale state rejects safely, arithmetic is independently reproducible, and no agent message can bypass or edit a threshold.",
        },
        checkpoint: {
          question: "What should a pre-trade risk gate do when a required FX rate is missing?",
          options: ["Ask the agent to estimate it", "Assume one-to-one", "Reject or quarantine the paper proposal until authoritative data is available", "Ignore currency exposure"],
          correctIndex: 2,
          explanation: "A missing required input makes exposure unknown; fail-closed enforcement prevents narrative guesses from becoming risk decisions.",
        },
        takeaway: "Portfolio risk is independently computed state governed by tested code; agent confidence never overrides a deterministic rejection.",
      },
      zhHans: {
        kicker: "风险上限是代码，不是口号",
        title: "组合风险与确定性门禁",
        summary: "把组合目标转化为独立计算的暴露、集中度、流动性、换手、杠杆、回撤与情景门禁。",
        objective: "实现仅限模拟组合的确定性风险包络，无论智能体多自信、叙事多漂亮，都能拒绝无效建议。",
        artifact: "风险政策、黄金 fixtures 与门禁决策日志",
        sections: [
          {
            heading: "在优化之前定义风险包络",
            sourceIds: ["finra-algorithmic-trading", "sec-market-access-rule-faq", "github-freqtrade", "nist-ai-rmf"],
            paragraphs: [
              "规定合格标的、总净暴露、杠杆、单一标的与行业集中度、因子与货币暴露、流动性参与率、换手、借券、回撤和损失上限。定义估值价格、陈旧价格处理、未知暴露以及未成交模拟订单的汇总方法。硬性上限与研究偏好要分开，并写明谁能修改每个阈值。",
              "风险具有状态性。看似无害的订单与现有头寸、待处理订单、相关资产或共同情景叠加后，可能突破上限。必须从权威模拟台账重算交易前后状态。价格、分类、汇率、流动性或头寸缺失时，应默认关闭或收紧权限，不能用智能体估计补洞。",
            ],
          },
          {
            heading: "把门禁当作安全关键代码测试",
            sourceIds: ["nist-ai-rmf", "finra-algorithmic-trading", "sec-market-access-rule-faq", "github-finrl"],
            paragraphs: [
              "使用纯函数和版本控制，返回决定、原因代码、测量值、阈值、输入快照哈希与政策版本。测试精确边界、符号错误、单位转换、重复订单、陈旧输入、空组合、空头、非线性产品和并发建议。黄金 fixtures 让评审可重复，性质测试则探索人类可能漏掉的组合。",
              "智能体可以解释拒绝或提出更小的模拟头寸，但不能覆盖门禁。压力测试历史与假想冲击、相关性、流动性消失和模型故障；经测试的政策与证据登记表才是权威。",
            ],
          },
          {
            heading: "版本观察：架构发布不等于安全证据",
            sourceIds: ["x-ai4finance-finrlx-2026", "x-ai4finance-finrl-deepseek-2025", "github-finrl-x", "github-finrl"],
            paragraphs: [
              "AI4Finance 的帖子宣布 FinRL-X 并推广 FinRL-DeepSeek，同时链接仓库或稿件。这些有日期的公告只能证明项目发布及其指针，不能独立验证安全阈值、券商一致、可复现、法律适用、优越性或未来稳健性；技术审查必须从固定仓库与一手论文开始。",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "构建并攻击模拟风险门禁",
          brief: "为模拟头寸实现确定性决策表；禁止任何实盘订单路由。",
          steps: ["用明确单位定义暴露、集中度、流动性、换手、杠杆、回撤和陈旧数据上限。", "创建接受、拒绝、精确边界、缺失数据、重复订单和相关冲击的黄金 fixtures。", "为每个结果记录原因代码、政策版本、输入哈希、计算状态和评审决定。"],
          deliverable: "版本化风险政策、可执行门禁测试与决策日志样例",
          reviewGate: "未知或陈旧状态会安全拒绝，计算可独立复现，任何智能体消息都不能绕过或修改阈值。",
        },
        checkpoint: {
          question: "交易前风险门禁缺少必要汇率时，应如何处理？",
          options: ["让智能体估算", "假设一比一", "拒绝或隔离模拟建议，等待权威数据", "忽略货币暴露"],
          correctIndex: 2,
          explanation: "缺少必需输入意味着暴露未知；默认关闭可防止叙事性猜测变成风险决定。",
        },
        takeaway: "组合风险是经独立计算、由测试代码治理的状态；智能体置信度永远不能推翻确定性拒绝。",
      },
    },
  },
  {
    slug: "paper-execution-reconciliation",
    phaseId: "execution-operations-capstone",
    minutes: 65,
    sourceIds: ["github-backtesting-py", "github-freqtrade", "github-alpaca-py", "x-alpaca-cli-agents-2026"],
    copy: {
      en: {
        kicker: "Simulation must still reconcile",
        title: "Local replay execution and reconciliation",
        summary: "Model an order-like lifecycle, idempotency, partial synthetic fills, rejects, fees, and ledger reconciliation inside a deterministic offline replay with networking disabled.",
        objective: "Operate a local synthetic-replay adapter whose intents, acknowledgements, fills, positions, cash, and exceptions reconcile deterministically without any external endpoint.",
        artifact: "Local replay-intent state machine and reconciliation report",
        sections: [
          {
            heading: "Prove offline replay mode before accepting an intent",
            sourceIds: ["github-backtesting-py", "github-freqtrade"],
            paragraphs: [
              "The adapter must bind only to a local deterministic synthetic replay and verify at startup and before every transition that networking is disabled. It contains no external client, endpoint, identity, or secret-loading path. A typed replay intent contains strategy and experiment IDs, synthetic instrument, side, quantity or notional, event type, limit, time-in-force, decision timestamp, policy version, fixture ID, and idempotency key.",
              "Represent submitted, acknowledged, partially filled, filled, cancelled, expired, and rejected synthetic states explicitly. Retries query the local journal by idempotency key before replay. Out-of-order and duplicate fixture events must not double positions. Agent-produced text may explain an intent, but only validated structured fields enter the replay adapter, and the deterministic risk gate must approve the same immutable intent hash.",
            ],
          },
          {
            heading: "Reconcile three independent views",
            sourceIds: ["github-freqtrade", "github-backtesting-py"],
            paragraphs: [
              "At a defined cadence, compare the local intent-and-fill journal, the replay engine's event view, and the independently calculated synthetic portfolio ledger. Reconcile quantities, average price, fees, cash, positions, realized and unrealized P&L, and pending intents. Preserve raw fixture events and corrections instead of overwriting history. Every break receives a severity, owner, first-seen time, evidence, and resolution state.",
              "Replay fills are synthetic and do not represent queue position, market impact, outages, halts, or live liquidity. Label them accordingly and stress alternative fills rather than presenting them as achieved execution. Pinned code and local contract tests determine the replay fields and safety behavior.",
            ],
          },
          {
            heading: "Version watch: an external CLI remains outside the lab",
            sourceIds: ["x-alpaca-cli-agents-2026", "github-alpaca-py"],
            paragraphs: [
              "Alpaca's April 2026 X post announced a CLI for developers and coding agents, corroborated by its official article and SDK repository. That establishes the dated product announcement and external API surface only. The course does not invoke it: no external client, network request, remote identifier, or secret enters the local replay lab.",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "Reconcile a hostile local replay",
          brief: "Replay local synthetic events including partial fills, a reject, duplicate acknowledgement, late cancel, and missing fee.",
          steps: ["Define the typed replay intent, offline assertion, state machine, and idempotency behavior.", "Process the hostile fixture sequence with networking disabled and no external integration path.", "Reconcile journal, replay view, positions, cash, fees, and exceptions; quarantine every unexplained break."],
          deliverable: "A local replay event log, state-transition table, and three-way reconciliation report",
          reviewGate: "Offline replay mode is provable, duplicate events cannot create duplicate positions, and unexplained breaks block further synthetic transitions.",
        },
        checkpoint: {
          question: "What is the safest response to a timeout while processing a local replay intent?",
          options: ["Immediately process the same fixture again", "Enable networking", "Query the local journal by idempotency key before any replay", "Let the model guess whether it filled"],
          correctIndex: 2,
          explanation: "The local transition may have succeeded despite the timeout; idempotent journal lookup prevents a duplicate synthetic position and preserves auditability.",
        },
        takeaway: "Even an offline synthetic replay requires explicit mode proof, idempotent state transitions, and independent cash-position-intent reconciliation.",
      },
      zhHans: {
        kicker: "模拟执行同样必须对账",
        title: "本地回放执行与对账",
        summary: "在禁用网络的确定性离线回放中，建模类订单生命周期、幂等、部分合成成交、拒绝、费用与台账对账。",
        objective: "运行本地合成回放适配器，使意图、确认、成交、头寸、现金与异常都可确定性对账，且不存在任何外部端点。",
        artifact: "本地回放意图状态机与对账报告",
        sections: [
          {
            heading: "接收意图前先证明离线回放模式",
            sourceIds: ["github-backtesting-py", "github-freqtrade"],
            paragraphs: [
              "适配器只能绑定本地确定性合成回放，并在启动和每次状态转换前核验网络已禁用。系统不包含外部客户端、端点、身份或密钥加载路径。类型化回放意图包含策略与实验 ID、合成标的、方向、数量或名义金额、事件类型、限价、有效期、决策时间、政策版本、fixture ID 与幂等键。",
              "明确表示已提交、已确认、部分成交、全部成交、已取消、已过期和已拒绝的合成状态。重试前先按幂等键查询本地日志；乱序和重复 fixture 事件不得重复增加头寸。智能体文本可以解释意图，但进入回放适配器的只能是通过校验的结构化字段，而且确定性风险门禁必须批准同一个不可变意图哈希。",
            ],
          },
          {
            heading: "核对三个独立视图",
            sourceIds: ["github-freqtrade", "github-backtesting-py"],
            paragraphs: [
              "按明确频率比较本地意图—成交日志、回放引擎事件视图与独立计算的合成组合台账。核对数量、均价、费用、现金、头寸、已实现与未实现盈亏以及待处理意图。保存原始 fixture 事件与更正记录，不能覆盖历史。每个差异都要有严重性、负责人、首次发现时间、证据与解决状态。",
              "回放成交是合成结果，不代表真实排队位置、市场冲击、故障、停牌或流动性。必须明确标注，并压力测试替代成交，不能把它说成实际执行表现。回放字段与安全行为由固定代码和本地契约测试确定。",
            ],
          },
          {
            heading: "版本观察：外部 CLI 明确排除在实验之外",
            sourceIds: ["x-alpaca-cli-agents-2026", "github-alpaca-py"],
            paragraphs: [
              "Alpaca 在 2026 年 4 月的 X 帖子中宣布面向开发者与编程智能体的 CLI，并有官方文章与 SDK 仓库旁证。这只能确认有日期的产品公告与外部 API 表面。本课程不调用它：本地回放实验不接入外部客户端、网络请求、远程标识或密钥。",
            ],
            evidenceMode: "version-watch",
          },
        ],
        practice: {
          title: "对账一场恶意本地回放",
          brief: "重放包含部分成交、拒绝、重复确认、延迟取消与缺失费用的本地合成事件。",
          steps: ["定义类型化回放意图、离线断言、状态机与幂等行为。", "在禁用网络且无外部集成路径的情况下处理恶意 fixture 序列。", "核对日志、回放视图、头寸、现金、费用与异常；隔离所有无法解释的差异。"],
          deliverable: "本地回放事件日志、状态转换表与三方对账报告",
          reviewGate: "离线回放模式可证明，重复事件不会生成重复头寸，未解释差异会阻断后续合成状态转换。",
        },
        checkpoint: {
          question: "处理本地回放意图时发生超时，最安全的做法是什么？",
          options: ["立刻重放同一 fixture", "启用网络", "任何重放前先按幂等键查询本地日志", "让模型猜测是否成交"],
          correctIndex: 2,
          explanation: "本地状态转换可能已成功但响应超时；幂等日志查询可避免重复合成头寸并保留审计性。",
        },
        takeaway: "即使是离线合成回放，也需要明确模式证明、幂等状态转换以及独立的现金—头寸—意图对账。",
      },
    },
  },
  {
    slug: "monitoring-kill-switch-incidents",
    phaseId: "execution-operations-capstone",
    minutes: 60,
    sourceIds: ["nist-ai-rmf", "sec-ai-investment-fraud", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq"],
    copy: {
      en: {
        kicker: "Stop safely before explaining",
        title: "Monitoring, kill switches, and incidents",
        summary: "Monitor data, models, agents, risk, and paper execution with tested stop mechanisms, immutable incident evidence, and conservative recovery gates.",
        objective: "Create observable service objectives and a kill-switch runbook that stops new paper actions deterministically and preserves evidence for review.",
        artifact: "Monitoring map, kill-switch test, and incident runbook",
        sections: [
          {
            heading: "Monitor the full causal chain",
            sourceIds: ["nist-ai-rmf", "finra-algorithmic-trading"],
            paragraphs: [
              "Track source freshness, schema and distribution shifts, missingness, feature ranges, model and prompt versions, abstention rate, tool failures, token and compute budgets, experiment throughput, risk rejections, order-state latency, reconciliation breaks, and paper-portfolio exposure. Each metric needs owner, expected range, severity, observation window, and action. Logs carry correlation IDs across source, hypothesis, run, proposal, risk decision, and paper order.",
              "Separate service health from strategy performance. A losing paper strategy is not automatically a software incident, and a profitable simulation can coexist with stale data or broken controls. Alerts should identify actionable conditions, suppress duplicate noise, and never ask an agent to invent a missing threshold. Preserve dashboards and raw events with synchronized clocks and access controls.",
            ],
          },
          {
            heading: "Make stopping deterministic and recovery harder",
            sourceIds: ["nist-ai-rmf", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq", "sec-ai-investment-fraud"],
            paragraphs: [
              "A kill switch must reject new proposals at a gate outside the language model, disable paper submission, cancel eligible pending simulated orders, snapshot state, and page the named owner. Define triggers for stale or corrupt data, policy-service failure, unknown environment, excessive exposure, reconciliation breaks, runaway agents, credential exposure, and manual stop. Test local and global stops, permissions, race conditions, and idempotency on a schedule.",
              "Recovery requires evidence: cause understood, state reconciled, data refreshed, affected artifacts quarantined, regression test added, controls independently reviewed, and restart explicitly approved. Never auto-resume because a metric returns to normal. Official interfaces, tested code, and the desk runbook govern response.",
            ],
          },
        ],
        practice: {
          title: "Run a paper-desk game day",
          brief: "Simulate stale data followed by a reconciliation break and an attempted unauthorized restart.",
          steps: ["Define monitors, thresholds, owners, correlation IDs, and incident severity.", "Trigger the deterministic kill switch and verify new paper actions stop while evidence is preserved.", "Complete triage, containment, reconciliation, regression testing, review, and explicit recovery approval."],
          deliverable: "A timestamped game-day trace, incident report, and recovery decision",
          reviewGate: "The stop works without model cooperation, blocks unauthorized restart, preserves state, and cannot affect any live trading environment.",
        },
        checkpoint: {
          question: "When may a paper desk restart after a kill-switch event?",
          options: ["As soon as the alert disappears", "When an agent says confidence is high", "After reconciliation, root-cause evidence, regression tests, independent review, and explicit approval", "Automatically at the next market open"],
          correctIndex: 2,
          explanation: "Recovery is a conservative, evidence-gated decision; disappearance of a symptom does not prove safe state.",
        },
        takeaway: "The kill switch must work without the agent, and restart must be harder and more evidenced than stopping.",
      },
      zhHans: {
        kicker: "先安全停止，再讨论解释",
        title: "监控、紧急停止与事故",
        summary: "监控数据、模型、智能体、风险与模拟执行，以经测试的停止机制、不可变事故证据与保守恢复门禁运行。",
        objective: "建立可观察服务目标与紧急停止手册，确定性阻断新的模拟动作，并保存评审证据。",
        artifact: "监控地图、紧急停止测试与事故手册",
        sections: [
          {
            heading: "监控完整因果链",
            sourceIds: ["nist-ai-rmf", "finra-algorithmic-trading"],
            paragraphs: [
              "跟踪来源新鲜度、schema 与分布漂移、缺失、特征范围、模型和提示版本、弃权率、工具失败、token 与计算预算、实验吞吐、风险拒绝、订单状态延迟、对账差异和模拟组合暴露。每项指标需要负责人、预期范围、严重性、观察窗口与动作。相关 ID 要贯穿来源、假设、运行、建议、风险决定与模拟订单。",
              "服务健康与策略表现必须分开。模拟策略亏损不一定是软件事故，而盈利模拟也可能同时使用陈旧数据或损坏控制。告警要对应可执行条件并抑制重复噪声，绝不能让智能体临时编造缺失阈值。仪表板和原始事件应使用同步时钟与访问控制保存。",
            ],
          },
          {
            heading: "确定性停止，并让恢复更难",
            sourceIds: ["nist-ai-rmf", "finra-auto-trading-risk", "finra-algorithmic-trading", "sec-market-access-rule-faq", "sec-ai-investment-fraud"],
            paragraphs: [
              "紧急停止必须在语言模型之外的门禁拒绝新建议、禁用模拟提交、取消符合条件的待处理模拟订单、快照状态并通知具名负责人。为数据陈旧或损坏、政策服务故障、环境未知、暴露超限、对账差异、失控智能体、凭证暴露和人工停止定义触发器，并定期测试局部与全局停止、权限、竞态和幂等。",
              "恢复需要证据：原因已理解、状态已对账、数据已刷新、受影响产物已隔离、回归测试已加入、控制已独立评审、重启已明确批准。指标恢复正常不等于允许自动恢复。官方接口、经测试代码和研究台手册才支配响应。",
            ],
          },
        ],
        practice: {
          title: "运行模拟研究台演练日",
          brief: "模拟陈旧数据，随后发生对账差异和未经授权的重启尝试。",
          steps: ["定义监控、阈值、负责人、相关 ID 与事故等级。", "触发确定性紧急停止，验证新模拟动作停止且证据被保存。", "完成分诊、遏制、对账、回归测试、评审与明确恢复批准。"],
          deliverable: "带时间戳的演练轨迹、事故报告与恢复决定",
          reviewGate: "停止无需模型配合即可生效，阻断未授权重启，保存状态，并且不可能影响任何实盘环境。",
        },
        checkpoint: {
          question: "触发紧急停止后，模拟研究台何时可以重启？",
          options: ["告警一消失就重启", "智能体表示高置信度时", "完成对账、根因证据、回归测试、独立评审与明确批准后", "下个开盘自动重启"],
          correctIndex: 2,
          explanation: "恢复是保守且证据门控的决定；症状消失不能证明系统已安全。",
        },
        takeaway: "紧急停止必须不依赖智能体，而恢复应比停止更困难、需要更多证据。",
      },
    },
  },
  {
    slug: "capstone-auditable-paper-desk",
    phaseId: "execution-operations-capstone",
    minutes: 70,
    sourceIds: ["github-openbb", "github-qlib", "github-rd-agent", "github-backtesting-py", "nist-ai-rmf"],
    copy: {
      en: {
        kicker: "Evidence before automation",
        title: "Capstone: an auditable paper-trading desk",
        summary: "Integrate mandate, data, agents, experiments, simulation, evaluation, risk, paper execution, monitoring, and incident response into one reviewable package.",
        objective: "Demonstrate a complete paper-only research run whose claims, decisions, artifacts, controls, failures, and non-claims can be independently reconstructed.",
        artifact: "Eight-artifact auditable paper-desk dossier",
        sections: [
          {
            heading: "Execute one thin vertical slice",
            sourceIds: ["github-openbb", "github-qlib", "github-rd-agent", "github-backtesting-py"],
            paragraphs: [
              "Choose a narrow educational hypothesis and a small lawful dataset. Freeze the mandate and data snapshot, register the hypothesis, generate features, run a causal simulator, evaluate with a preserved test, apply deterministic risk gates, create at most a paper-order intent, and reconcile synthetic events. The goal is not a profitable strategy; it is a trustworthy chain of evidence under bounded autonomy.",
              "Assign unique IDs from source to claim, run, model, proposal, risk decision, paper order, incident, and final statement. Re-run from a clean environment and compare hashes or documented tolerances. Include at least one rejected proposal, one negative or null result, one abstention, and one injected failure so safety behavior is demonstrated rather than merely described.",
            ],
          },
          {
            heading: "Publish claims, boundaries, and non-claims together",
            sourceIds: ["nist-ai-rmf", "github-qlib", "github-rd-agent"],
            paragraphs: [
              "The review dossier includes eight required artifacts plus an executive narrative that links every material statement to a receipt. Distinguish repository capabilities, X-originated industry claims, your local test results, and instructional synthesis. State versions, access dates, licences, unresolved issues, failed reproductions, sensitivity results, and evidence that would change the conclusion.",
              "End with an explicit safety attestation: no live credentials were used, no live order was created or transmitted, outputs are educational and not investment advice, paper fills are synthetic, historical results do not promise future returns, and a named human owns every policy change. A capstone that cannot support this attestation does not pass, regardless of simulated performance.",
            ],
          },
        ],
        practice: {
          title: "Conduct the independent release review",
          brief: "Assemble the eight artifacts, run the clean-room replay, and invite a reviewer to challenge evidence and controls.",
          steps: ["Trace each claim through source, data, code, experiment, evaluation, risk, and paper-execution receipts.", "Replay from pinned inputs; compare results, trigger one rejection and the kill switch, and reconcile final state.", "Resolve or label every review finding, sign the safety attestation, and publish only the bounded educational dossier."],
          deliverable: "A reviewer-signed eight-artifact dossier with replay and safety-gate evidence",
          reviewGate: "All artifacts pass schema and evidence checks, the clean replay is explained, critical safety gates pass, and the package contains no live order path or investment advice.",
        },
        checkpoint: {
          question: "What is the primary success criterion for the capstone?",
          options: ["The highest simulated return", "The most agents", "An independently reconstructable paper-only evidence and control chain", "A live brokerage connection"],
          correctIndex: 2,
          explanation: "The capstone assesses auditability, bounded autonomy, reproducibility, and safety—not financial performance.",
        },
        takeaway: "The world-class outcome is not an autonomous trader; it is an auditable paper desk that knows, proves, and enforces its limits.",
      },
      zhHans: {
        kicker: "先有证据，再谈自动化",
        title: "结课项目：可审计的模拟交易研究台",
        summary: "把授权、数据、智能体、实验、模拟、评估、风险、模拟执行、监控与事故响应整合为可评审包。",
        objective: "展示一次完整的仅限模拟盘研究运行，使主张、决定、产物、控制、失败与非声明均可独立重建。",
        artifact: "八项产物组成的可审计模拟研究台档案",
        sections: [
          {
            heading: "执行一条精简的端到端纵切片",
            sourceIds: ["github-openbb", "github-qlib", "github-rd-agent", "github-backtesting-py"],
            paragraphs: [
              "选择狭窄的教学假设和小型合法数据集。冻结授权与快照，登记假设，生成特征，运行因果模拟器，使用保留测试集评估，应用确定性风险门禁，最多创建一个模拟订单意图，并对合成事件进行对账。目标不是盈利策略，而是在有限自主权下形成可信证据链。",
              "从来源到主张、运行、模型、建议、风险决定、模拟订单、事故和最终陈述分配唯一 ID。在洁净环境重跑并比较哈希或记录容差。至少加入一个被拒建议、一个负或零结果、一次弃权和一次注入故障，让安全行为被真正演示，而不只是写在文档里。",
            ],
          },
          {
            heading: "把主张、边界与非声明一起发布",
            sourceIds: ["nist-ai-rmf", "github-qlib", "github-rd-agent"],
            paragraphs: [
              "评审档案包含八项必需产物，以及把每条重要陈述连接到收据的执行摘要。区分仓库能力、源自 X 的行业主张、本地测试结果与教学综合。写明版本、访问日期、许可、未解决问题、复现失败、敏感性结果以及什么证据会改变结论。",
              "最后作出明确安全证明：未使用实盘凭证、未创建或发送实盘订单、输出仅供教学且不构成投资建议、模拟成交为合成结果、历史表现不承诺未来收益、每项政策变更都有具名人类负责。无论模拟收益多高，只要无法作出这份证明，结课项目就不通过。",
            ],
          },
        ],
        practice: {
          title: "执行独立发布评审",
          brief: "组装八项产物，运行洁净重放，并邀请评审者挑战证据与控制。",
          steps: ["沿来源、数据、代码、实验、评估、风险和模拟执行收据追踪每项主张。", "从固定输入重放；比较结果，触发一次拒绝与紧急停止，并核对最终状态。", "解决或标记所有评审发现，签署安全证明，只发布有边界的教学档案。"],
          deliverable: "经评审者签署、包含重放与安全门禁证据的八项产物档案",
          reviewGate: "所有产物通过 schema 与证据检查，洁净重放差异得到解释，关键安全门禁通过，且不存在实盘路径或投资建议。",
        },
        checkpoint: {
          question: "结课项目的首要成功标准是什么？",
          options: ["最高模拟收益", "最多智能体", "可独立重建的仅限模拟盘证据与控制链", "接入实盘券商"],
          correctIndex: 2,
          explanation: "结课项目评估可审计性、有限自主、可复现性与安全，而不是金融收益。",
        },
        takeaway: "世界级成果不是自主交易机器，而是知道、证明并强制执行自身边界的可审计模拟研究台。",
      },
    },
  },
] as const satisfies CourseKitTwelveModules<
  CourseKitModuleAuthoringSeed<
    AgenticQuantTradingModuleSlug,
    AgenticQuantTradingPhaseId,
    AgenticQuantTradingSourceId
  >
>;
