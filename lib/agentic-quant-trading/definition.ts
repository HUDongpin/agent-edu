import { buildCourseKitDefinition } from "../course-kit/authoring";
import {
  AGENTIC_QUANT_TRADING_CAPSTONE_ARTIFACTS,
  AGENTIC_QUANT_TRADING_CAPSTONE_VERSION,
} from "./capstone";
import { AGENTIC_QUANT_TRADING_MODULES } from "./modules";
import {
  AGENTIC_QUANT_TRADING_QUESTION_BANK,
  AGENTIC_QUANT_TRADING_QUIZ_VERSION,
} from "./quiz";
import { AGENTIC_QUANT_TRADING_SOURCE_SEEDS } from "./sources";

export const AGENTIC_QUANT_TRADING_COURSE = buildCourseKitDefinition({
  manifest: {
    id: "agentic-quant-trading",
    version: "2026.08.26-v3",
    displayNumber: 17,
    publishedOn: "2026-08-26",
    milestoneCount: 14,
    phases: [
      {
        id: "mandate-data-authority",
        copy: {
          en: {
            title: "Mandate, data, and authority",
            summary: "Bound the paper-only mission, make time-aware data reproducible, and separate probabilistic proposals from deterministic permission.",
          },
          zhHans: {
            title: "授权、数据与权限",
            summary: "限定仅限模拟盘的任务，使时间感知数据可复现，并把概率型建议与确定性许可分开。",
          },
        },
      },
      {
        id: "research-signals-backtest",
        copy: {
          en: {
            title: "Research, signals, and backtesting",
            summary: "Register falsifiable hypotheses, preserve signal provenance, and attack time-ordered simulations with leakage and cost tests without claiming causality.",
          },
          zhHans: {
            title: "研究、信号与回测",
            summary: "登记可证伪假设，保存信号血缘，并用泄漏与成本测试攻击按时间顺序的模拟，同时不声称因果关系。",
          },
        },
      },
      {
        id: "evaluation-agents-risk",
        copy: {
          en: {
            title: "Evaluation, agents, and risk",
            summary: "Measure uncertainty and search burden, verify structured debate, and enforce portfolio limits outside the model.",
          },
          zhHans: {
            title: "评估、智能体与风险",
            summary: "衡量不确定性与搜索负担，核验结构化辩论，并在模型之外执行组合上限。",
          },
        },
      },
      {
        id: "execution-operations-capstone",
        copy: {
          en: {
            title: "Local synthetic execution, operations, and capstone",
            summary: "Reconcile local synthetic execution, test deterministic stopping and recovery, and release an independently auditable local desk.",
          },
          zhHans: {
            title: "本地合成执行、运营与结课项目",
            summary: "核对本地合成执行，测试确定性停止与恢复，并发布可独立审计的本地研究台。",
          },
        },
      },
    ],
  },
  sources: AGENTIC_QUANT_TRADING_SOURCE_SEEDS,
  modules: AGENTIC_QUANT_TRADING_MODULES,
  courseCopy: {
    en: {
      meta: {
        title: "Agentic AI for Quantitative Trading",
        kicker: "Course 17 · Build the controls before the agent",
        summary: "Design, test, and audit a bounded multi-agent quantitative research desk—from point-in-time data and falsifiable experiments through friction-aware backtests, deterministic risk gates, local synthetic execution, reconciliation, monitoring, and incident recovery. Every activity is educational and local-synthetic only: no network, external account, credential, remote endpoint, or market-action path, and no investment advice.",
        audience: "Engineers, quantitative researchers, data scientists, product and risk teams who want to evaluate agentic workflows without delegating financial authority to a model.",
        prerequisite: "Comfort with Python, tabular market data, basic statistics, and software testing. No broker or vendor account—including paper or sandbox access—credential, network integration, or live market access is needed or permitted.",
        level: "Advanced",
        duration: "13 hours",
        startCta: "Start the paper-desk mandate",
        resumeCta: "Resume the auditable paper desk",
        fallbackNotice: "This course provides English and Simplified Chinese editions. Other locales use the English fallback until a documented language review is complete.",
        evidenceNote: "GitHub repositories and primary X posts establish versioned capabilities or industry claims only within their stated boundaries. Financial, safety, and overfitting claims require official, regulatory, research, or locally reproduced evidence.",
      },
      principles: [
        "Local synthetic replay only: use bundled SYN-A files on the local filesystem. No network, external account—including broker or vendor paper/sandbox accounts—credential, remote endpoint, or market-action path is permitted. In this course, “paper desk” means only this local educational system.",
        "Educational evidence, not investment advice: no personalized recommendation, suitability judgment, or promise of return.",
        "Probabilistic agents may propose and critique; deterministic code and named humans own authority, risk, stopping, and recovery.",
        "Point-in-time data, immutable experiment receipts, realistic costs, uncertainty, negative results, and failures are first-class artifacts.",
        "X posts are time-bound primary industry claims, not proof of performance, safety, independence, or future profitability.",
      ],
      outcomes: [
        "Write a fail-closed mandate, authority matrix, and typed agent architecture for a paper-only research desk.",
        "Build point-in-time data, feature, label, and text-signal contracts with reproducible lineage.",
        "Register hypotheses and run time-ordered, no-look-ahead, cost-aware simulations that detect leakage, preserve negative results, and make no causal claim.",
        "Evaluate uncertainty, search burden, correlated agent failures, and claim-evidence quality before selection.",
        "Specify deterministic portfolio-risk, protected-channel or signature-verified exact-intent human approval, local synthetic execution, reconciliation, monitoring, kill-switch, and recovery gates.",
        "Release an eight-artifact dossier that an independent reviewer can replay, challenge, and safely reject.",
      ],
      quiz: {
        title: "Local synthetic-desk control review",
        intro: "Answer 12 sampled questions and score at least 10. Every sampled critical safety question must be correct. Passing assesses control reasoning; it does not verify the learner's controls, authorize any external replay or market action, or constitute investment advice.",
      },
      capstone: {
        title: "Auditable local synthetic-trading desk",
        intro: "Complete one narrow research-to-local-synthetic-execution slice and submit all eight linked artifacts. Simulated performance is not the grading target; reconstructability, evidence boundaries, verifiable exact-intent human issuance, and safe failure are.",
        instructions: [
          "Use only lawful, approved, point-in-time data and pin every source, snapshot, dependency, prompt, model, configuration, and random seed.",
          "Include a null or negative result, an abstention, a risk rejection, a reconciliation break, and a tested kill-switch event.",
          "Replay the package from a clean environment and document exact matches, tolerances, unresolved differences, and reviewer findings.",
          "Do not use a network, any external account (including paper or sandbox), a credential, or a remote endpoint; do not create or transmit a market order, or present any output as investment advice or expected return.",
        ],
        attestation: "I attest that this dossier is an educational, local-synthetic simulation using only bundled files; no network, external account, credential, remote endpoint, or market-order path was used; no output is investment advice; synthetic fills do not establish executable performance; historical results do not promise future returns; and every policy change and exact-intent approval is issued through a human-controlled, agent-non-writable or signature-verified path.",
      },
    },
    zhHans: {
      meta: {
        title: "智能体赋能量化交易",
        kicker: "第 17 门课程 · 先构建控制，再部署智能体",
        summary: "设计、测试并审计一个有限自主的多智能体量化研究台：从时点一致数据和可证伪实验，到含现实摩擦假设的回测、确定性风险门禁、本地合成执行、对账、监控与事故恢复。所有活动仅供教学且仅限本地合成环境：禁止网络、外部账户、凭证、远程端点与任何市场操作路径，不构成投资建议。",
        audience: "希望评估智能体工作流、但不把金融决策权交给模型的工程师、量化研究员、数据科学家、产品与风险团队。",
        prerequisite: "熟悉 Python、表格型市场数据、基础统计与软件测试。无需且不得使用任何券商或供应商账户（包括 paper 或 sandbox）、凭证、网络集成或实盘市场访问。",
        level: "进阶",
        duration: "13 小时",
        startCta: "从模拟研究台授权开始",
        resumeCta: "继续构建可审计模拟研究台",
        fallbackNotice: "本课程提供英文与简体中文版本；其他语言环境在完成可审计的语言审校前回退到英文。",
        evidenceNote: "GitHub 仓库与一手 X 帖子只能在明确边界内证明带版本的能力或行业主张。金融、安全与过拟合结论必须依赖官方、监管、研究或本地复现证据。",
      },
      principles: [
        "仅限本地合成回放：只读取本地随附的 SYN-A 文件；禁止网络、任何外部账户（包括券商或供应商 paper/sandbox 账户）、凭证、远程端点与市场操作路径。正文中的“模拟研究台”只指这一教学性本地系统。",
        "提供教学证据，不构成投资建议：不做个性化推荐、适当性判断或收益承诺。",
        "概率型智能体可以建议和质疑；权限、风险、停止与恢复由确定性代码和具名人员负责。",
        "时点一致数据、不可变实验收据、真实成本、不确定性、负结果与失败都是一等产物。",
        "X 帖子是有时间边界的行业一手主张，不是表现、安全、独立性或未来盈利的证明。",
      ],
      outcomes: [
        "为仅限模拟盘的研究台编写默认关闭授权书、权限矩阵与类型化智能体架构。",
        "建立带可复现血缘的时点一致数据、特征、标签与文本信号契约。",
        "登记假设并运行按时间顺序、无前视、能检测泄漏、计入成本且保存负结果的模拟，同时不作因果声明。",
        "选择前评估不确定性、搜索负担、智能体相关性失败与主张—证据质量。",
        "设计确定性组合风险、经受保护通道或签名验证的精确意图人工批准、本地合成执行、对账、监控、紧急停止与恢复门禁。",
        "发布可由独立评审者重放、质疑并安全拒绝的八项产物档案。",
      ],
      quiz: {
        title: "本地合成研究台控制评审",
        intro: "系统抽取 12 题，至少答对 10 题；抽到的所有关键安全题必须答对。通过只代表理解控制逻辑，不核验学习者控制，不授权任何外部回放或市场操作，也不构成投资建议。",
      },
      capstone: {
        title: "可审计的本地合成交易研究台",
        intro: "完成一条狭窄的研究到本地合成执行纵切片，并提交全部八项关联产物。评分目标不是模拟收益，而是可重建性、证据边界、可核验的精确意图人工签发与安全失败。",
        instructions: [
          "只使用合法、已批准、时点一致的数据，并固定每个来源、快照、依赖、提示、模型、配置与随机种子。",
          "至少包含一个零或负结果、一次弃权、一次风险拒绝、一次对账差异与一次紧急停止测试。",
          "在洁净环境重放整个包，记录精确一致、容差、未解决差异与评审发现。",
          "不得使用网络、任何外部账户（包括 paper 或 sandbox）、凭证或远程端点；不得创建或发送市场订单，也不得把任何输出呈现为投资建议或预期收益。",
        ],
        attestation: "本人确认：本档案仅用于教学且只使用本地随附文件进行合成模拟；未使用网络、外部账户、凭证、远程端点或市场订单路径；任何输出均不构成投资建议；合成成交不能证明可执行表现；历史结果不承诺未来收益；所有政策变更与精确意图批准均通过人工受控且智能体无写权限的通道，或经签名验证的路径签发。",
      },
    },
  },
  quiz: {
    version: AGENTIC_QUANT_TRADING_QUIZ_VERSION,
    questions: AGENTIC_QUANT_TRADING_QUESTION_BANK,
  },
  capstone: {
    version: AGENTIC_QUANT_TRADING_CAPSTONE_VERSION,
    artifacts: AGENTIC_QUANT_TRADING_CAPSTONE_ARTIFACTS,
  },
});
