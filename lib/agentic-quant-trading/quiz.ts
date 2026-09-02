import { buildModuleQuestionBank } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
} from "../course-kit/types";
import { AGENTIC_QUANT_TRADING_MODULES } from "./modules";
import type { AgenticQuantTradingSourceId } from "./sources";

export const AGENTIC_QUANT_TRADING_QUIZ_VERSION =
  "2026.08.26-quiz-v4-module-twelve-contextual-seed-1118";

const generatedQuestionBank = buildModuleQuestionBank(
  AGENTIC_QUANT_TRADING_MODULES,
  {
    questionEvidenceMode: "instructional-synthesis",
    criticalQuestionIds: [
      "q-scope-safety-autonomy-core",
      "q-market-data-time-contracts-core",
      "q-backtest-leakage-costs-core",
      "q-portfolio-risk-deterministic-gates-core",
      "q-paper-execution-reconciliation-core",
      "q-monitoring-kill-switch-incidents-core",
    ],
    distractorsByModule: {
      "scope-safety-autonomy": {
        en: {
          evidence: [
            "A tool inventory that omits owners, deny rules, and escalation paths",
            "A role diagram in which every agent shares one unrestricted capability token",
            "A mission statement that never defines prohibited actions or stop conditions",
          ],
          boundary: [
            "Read-only access to a remote paper account is equivalent to a local synthetic boundary",
            "An agent may widen its mandate when it records a rationale after the fact",
            "Human review may occur after a synthetic state transition because no real money is used",
          ],
        },
        zhHans: {
          evidence: [
            "一份省略负责人、拒绝规则与升级路径的工具清单",
            "一张让所有智能体共享同一无限权能令牌的角色图",
            "一份从未定义禁止行为或停止条件的任务说明",
          ],
          boundary: [
            "只读访问远程模拟账户就等同于本地合成边界",
            "智能体只要事后记录理由，就可以扩大自己的授权范围",
            "因为不使用真钱，人工复核可以放到合成状态转换之后",
          ],
        },
      },
      "market-data-time-contracts": {
        en: {
          evidence: [
            "A latest-value table with no as-of clock, revision history, or source licence",
            "A cleaned dataset that overwrites raw observations and drops retrieval hashes",
            "A data dictionary that records event time but not availability, ingestion, knowledge, or decision time",
          ],
          boundary: [
            "event_at may stand in for available_at whenever the publisher date is visible",
            "Today's surviving constituents are an acceptable proxy for every historical universe",
            "Full-sample imputation is safe when the final table contains no missing values",
          ],
        },
        zhHans: {
          evidence: [
            "一张没有时点截止、修订历史或来源许可的最新值表",
            "一份覆盖原始观测并删除获取哈希的清洗数据集",
            "一份只记录事件时间、却没有可得、摄取、已知和决策时间的数据字典",
          ],
          boundary: [
            "只要能看到发布日期，event_at 就可以替代 available_at",
            "今天仍存续的成分可以代表所有历史时点的资产池",
            "只要最终表没有缺失值，就可以用全样本拟合插补规则",
          ],
        },
      },
      "agent-architecture-authority": {
        en: {
          evidence: [
            "A list of agent names with no typed inputs, outputs, budgets, or failure ownership",
            "A supervisor prompt that grants every specialist the same write-capable tools",
            "A successful demo transcript with no denied call, timeout, or invalid-handoff test",
          ],
          boundary: [
            "Different role names make agents independent even when they share tools and context",
            "A supervisor model may approve deterministic risk exceptions when confidence is high",
            "A retry may silently broaden permissions if the original tool call fails",
          ],
        },
        zhHans: {
          evidence: [
            "一份没有类型化输入输出、预算或失败负责人的智能体名称清单",
            "一段把同样可写工具授予所有专家角色的主管提示",
            "一份没有拒绝调用、超时或错误交接测试的成功演示记录",
          ],
          boundary: [
            "只要角色名称不同，即使共享工具和上下文也可视为相互独立",
            "当置信度很高时，主管模型可以批准确定性风控例外",
            "原工具调用失败后，重试可以静默扩大权限",
          ],
        },
      },
      "hypotheses-experiment-ledger": {
        en: {
          evidence: [
            "A hypothesis written after inspecting the best run, with no preregistered stop rule",
            "A notebook that retains only the winning configuration and deletes null results",
            "A prose conclusion with no parent-child run IDs, seeds, deviations, or immutable inputs",
          ],
          boundary: [
            "The hypothesis may be revised after each test as long as the final wording is precise",
            "Failed and duplicate trials may be discarded because they do not affect the winner",
            "The agent that proposes a hypothesis should also decide whether its evidence is sufficient",
          ],
        },
        zhHans: {
          evidence: [
            "一份看过最佳运行后才写、且没有预登记停止规则的假设",
            "一本只保留胜出配置并删除零结果的实验笔记",
            "一段没有父子运行 ID、随机种子、偏离记录或不可变输入的结论",
          ],
          boundary: [
            "只要最终措辞足够精确，就可以在每次测试后修改原假设",
            "失败和重复试验不会影响胜者，因此可以删除",
            "提出假设的智能体也应自行决定证据是否充分",
          ],
        },
      },
      "features-labels-text-signals": {
        en: {
          evidence: [
            "A feature table whose scaler and missing-value rules were fitted on the full history",
            "A sentiment column with no quoted span, source clock, model version, or abstention record",
            "A label file that permits retrospective regime labels to enter training features",
          ],
          boundary: [
            "A close-derived signal may be filled at that same close when the bar is daily",
            "A later-restated filing value is valid for an earlier decision if it is more accurate",
            "High model confidence can substitute for point-in-time text availability",
          ],
        },
        zhHans: {
          evidence: [
            "一张用完整历史拟合缩放和缺失规则的特征表",
            "一列没有引用片段、来源时钟、模型版本或弃权记录的情绪值",
            "一份允许事后状态标签进入训练特征的标签文件",
          ],
          boundary: [
            "如果使用日线，由收盘价生成的信号可以假设在同一收盘成交",
            "后来重述的财报值更准确，因此可以用于更早的决策",
            "模型置信度很高时，可以替代文本的时点可得性证据",
          ],
        },
      },
      "backtest-leakage-costs": {
        en: {
          evidence: [
            "An equity curve with no event-order contract, cost inputs, or accounting invariants",
            "A vectorized result accepted without parity checks against event-driven edge cases",
            "A best-case fill report that ignores spread, latency, capacity, rejects, and missing fees",
          ],
          boundary: [
            "A visually plausible curve is enough to rule out look-ahead leakage",
            "Paper fills establish executable prices whenever the strategy trades infrequently",
            "Costs may be added after model selection without changing the selection evidence",
          ],
        },
        zhHans: {
          evidence: [
            "一条没有事件顺序契约、成本输入或会计不变量的净值曲线",
            "一份未经事件驱动边界案例一致性检查就接受的向量化结果",
            "一份忽略价差、延迟、容量、拒绝和缺失费用的最佳成交报告",
          ],
          boundary: [
            "曲线看起来合理，就足以排除前视泄漏",
            "只要策略交易不频繁，模拟成交就能证明可执行价格",
            "成本可以在模型选择后补加，而且不会改变选择证据",
          ],
        },
      },
      "evaluation-uncertainty-overfitting": {
        en: {
          evidence: [
            "A report of the highest Sharpe with no raw trial ledger or untouched final test",
            "A PBO value computed from an incomplete matrix containing only surviving configurations",
            "A DSR result that omits the chosen effective-trial estimator and distributional inputs",
          ],
          boundary: [
            "PBO is a p-value, so it can replace a declared multiple-testing procedure",
            "The split method ranked best in one controlled study is universally optimal",
            "More agent-generated trials reduce selection bias even when failed trials are hidden",
          ],
        },
        zhHans: {
          evidence: [
            "一份只有最高 Sharpe、没有原始试验台账或未触碰最终测试集的报告",
            "一个从只保留存活配置的不完整矩阵计算出的 PBO 值",
            "一个省略所选有效试验估计器和分布输入的 DSR 结果",
          ],
          boundary: [
            "PBO 就是 p 值，因此可以取代预先声明的多重检验程序",
            "某项受控研究中排名最高的切分方法在所有场景都最优",
            "即使隐藏失败试验，生成更多智能体试验也会降低选择偏差",
          ],
        },
      },
      "multi-agent-debate-verification": {
        en: {
          evidence: [
            "A debate transcript with no atomic claims, direct locators, or recomputation receipts",
            "A majority-vote summary that hides shared data, prompts, models, and tools",
            "A citation count that never records whether each source supports, contradicts, or contextualizes a claim",
          ],
          boundary: [
            "Agreement among agents is independent evidence when their role prompts differ",
            "A critic's objection may be closed by the same agent that authored the claim",
            "An X announcement becomes verified technical evidence after several agents repeat it",
          ],
        },
        zhHans: {
          evidence: [
            "一份没有原子主张、直接定位或重算收据的辩论记录",
            "一份隐藏共享数据、提示、模型和工具的多数票摘要",
            "一份从不记录来源是支持、反驳还是提供背景的引用计数",
          ],
          boundary: [
            "只要角色提示不同，多智能体一致就属于独立证据",
            "提出主张的同一智能体可以自行关闭批评者的异议",
            "多名智能体重复 X 公告后，它就成为已核验技术证据",
          ],
        },
      },
      "portfolio-risk-deterministic-gates": {
        en: {
          evidence: [
            "A natural-language risk policy with no units, windows, reason codes, or boundary tests",
            "A portfolio snapshot supplied by the proposing agent with no independent recomputation",
            "A limit test suite that omits exact boundaries, missing data, duplicates, and rate bursts",
          ],
          boundary: [
            "Agent confidence may override a deterministic deny when the expected return is high",
            "An idempotent retry may be treated as a new intent and create a second position or exposure",
            "Gross exposure alone is sufficient; net, concentration, liquidity, and stale state need not be checked",
          ],
        },
        zhHans: {
          evidence: [
            "一份没有单位、窗口、原因代码或边界测试的自然语言风控政策",
            "一份由提案智能体提供、未经独立重算的组合快照",
            "一套省略精确边界、缺失数据、重复和速率突发的限额测试",
          ],
          boundary: [
            "预期收益很高时，智能体置信度可以覆盖确定性拒绝",
            "幂等重试可以被当作新意图，并产生第二份头寸或敞口",
            "只检查总敞口即可，无需检查净敞口、集中度、流动性和陈旧状态",
          ],
        },
      },
      "paper-execution-reconciliation": {
        en: {
          evidence: [
            "A receipt with approver fields but no protected issuer proof, revocation check, or consumption ledger",
            "A synthetic fill log that omits valuation time, lot policy, cash, fees, or corrected events",
            "A state machine that retries submission without an idempotency lookup",
          ],
          boundary: [
            "An approver name in JSON proves that a human issued the approval",
            "A previously consumed approval may be reused when the intent hash is unchanged",
            "Matching the synthetic engine view is enough; an independent portfolio ledger is unnecessary",
          ],
        },
        zhHans: {
          evidence: [
            "一份有审批人字段、却没有受保护签发证明、撤销检查或消费台账的收据",
            "一份省略估值时点、批次政策、现金、费用或更正事件的合成成交日志",
            "一个提交重试前不查询幂等键的状态机",
          ],
          boundary: [
            "JSON 中写有审批人姓名，就足以证明批准由人签发",
            "只要意图哈希未变，已消费批准就可以重复使用",
            "只需匹配合成引擎视图，无需独立组合台账",
          ],
        },
      },
      "monitoring-kill-switch-incidents": {
        en: {
          evidence: [
            "A dashboard with no named owners, thresholds, windows, severity, or response action",
            "A kill-switch screenshot with no race, unauthorized-restart, or idempotency test",
            "An incident note that overwrites raw events and omits containment, reconciliation, and recovery approval",
          ],
          boundary: [
            "The desk may auto-resume as soon as the triggering metric returns to normal",
            "A profitable simulation means stale data or broken controls are not incidents",
            "The language model may act as runtime authority and decide and execute the stop by itself",
          ],
        },
        zhHans: {
          evidence: [
            "一个没有具名负责人、阈值、窗口、严重度或响应动作的仪表板",
            "一张没有竞态、未授权重启或幂等测试的紧急停止截图",
            "一份覆盖原始事件且省略遏制、对账和恢复批准的事故说明",
          ],
          boundary: [
            "触发指标恢复正常后，研究台可以自动重启",
            "模拟结果盈利时，陈旧数据或控制失效就不算事故",
            "语言模型可以作为运行时权威，自行决定并执行停止",
          ],
        },
      },
      "capstone-auditable-paper-desk": {
        en: {
          evidence: [
            "A polished executive summary whose material claims do not link to exact receipts or limitations",
            "A bundle that omits the null result, abstention, risk rejection, reconciliation break, or stop test",
            "A clean replay claim with no pinned inputs, hashes, tolerances, or unresolved differences",
          ],
          boundary: [
            "High simulated performance may compensate for one missing safety artifact",
            "Repository capability and X announcements may be reported as locally verified outcomes",
            "A reviewer signature can turn unsupported claims into verified evidence",
          ],
        },
        zhHans: {
          evidence: [
            "一份重要主张未连接精确收据或限制的精美执行摘要",
            "一个省略零结果、弃权、风控拒绝、对账差异或停止测试的材料包",
            "一项没有固定输入、哈希、容差或未解决差异的洁净重放主张",
          ],
          boundary: [
            "模拟表现很高时，可以抵消一项缺失的安全产物",
            "仓库能力与 X 公告可以直接报告为本地已核验结果",
            "评审者签名可以把没有支持的主张变成已验证证据",
          ],
        },
      },
    },
  },
);

if (generatedQuestionBank.length !== 36) {
  throw new Error(
    `Agentic Quant Trading requires exactly 36 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const AGENTIC_QUANT_TRADING_QUESTION_BANK =
  generatedQuestionBank as unknown as CourseKitNonEmpty<
    (typeof generatedQuestionBank)[number]
  >;

export type AgenticQuantTradingQuestionId =
  (typeof AGENTIC_QUANT_TRADING_QUESTION_BANK)[number]["id"];

export const AGENTIC_QUANT_TRADING_CRITICAL_QUESTION_IDS = Object.freeze(
  AGENTIC_QUANT_TRADING_QUESTION_BANK.filter(
    (question) => question.critical === true,
  ).map((question) => question.id),
);

export const AGENTIC_QUANT_TRADING_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: AGENTIC_QUANT_TRADING_QUIZ_VERSION,
  drawCount: 12,
  passCount: 10,
  questions: AGENTIC_QUANT_TRADING_QUESTION_BANK.map((question) => ({
    id: question.id,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    evidenceMode: question.evidenceMode,
    critical: question.critical === true,
  })) as unknown as CourseKitQuiz<
    AgenticQuantTradingQuestionId,
    AgenticQuantTradingSourceId
  >["questions"],
} satisfies CourseKitQuiz<
  AgenticQuantTradingQuestionId,
  AgenticQuantTradingSourceId
>;
