import type { AgentOrchestrationModuleSlug } from "./types";

/**
 * Browser-safe canonical practice templates.
 *
 * Progress validation needs the exact starter text without importing the
 * complete bilingual course copy into the interactive client bundle. The
 * contract test binds every value here to the authoritative locale copy.
 */
export const AGENT_ORCHESTRATION_PRACTICE_TEMPLATES =
{
  "workflow-agent-boundary": {
    "en": "# Autonomy boundary brief\n\n## Outcome, environment, and consequence\n- User outcome:\n- Execution environment:\n- Consequence / reversibility:\n- Non-goals:\n\n## Minimum topology test\n| Candidate | What it handles | Why insufficient or selected | New risks | Evidence needed |\n|---|---|---|---|---|\n| Ordinary code | | | | |\n| Code-directed workflow | | | | |\n| Single agent | | | | |\n| Multiple agents | | | | |\n\n## Decision and falsification rule\n",
    "zh-Hans": "# 自治边界说明书\n\n## 任务与不可逆影响\n- 输入：\n- 产物：\n- 不可接受结果：\n\n## 自治梯度\n| 方案 | 需要模型判断 | 新增控制边 | 权限面 | 验收方法 |\n|---|---|---:|---|---|\n| 普通代码/工作流 |  |  |  |  |\n| 单智能体 |  |  |  |  |\n| 多智能体 |  |  |  |  |\n\n## 决议\n- 选择：\n- 升级证据：\n- 回退条件：\n- 权限/质量/责任负责人：\n\n## 观测窗口\n- 成功率/延迟/单位成功成本基线：\n- 何时复核：\n- 决议版本与批准者："
  },
  "task-graphs-contracts": {
    "en": "# Task graph specification\n\n## Global contract\n- Trigger:\n- Completion predicate:\n- State owner:\n- Control owner:\n\n## Nodes\n| Node | Input schema | Output schema | Authority | Deadline | Terminal states |\n|---|---|---|---|---|---|\n| | | | | | |\n\n## Edges and joins\n| From | To | Edge type / condition | Join policy | Return destination |\n|---|---|---|---|---|\n| | | | | |\n\n## Invalid transitions and escalation\n",
    "zh-Hans": "# 任务图契约\n\n## 终态\n- succeeded：\n- failed：\n- cancelled：\n- interrupted：\n- outcome_unknown：\n\n## 节点表\n| 节点 | 前置 | 输入模式 | 输出模式 | 控制者 | 状态写入 | 副作用 | 失败边 |\n|---|---|---|---|---|---|---|---|\n|  |  |  |  |  |  |  |  |\n\n## 关键节点 12 项契约\n- 拓扑/触发/完成：\n- 控制/状态所有者：\n- 上下文/权限：\n- 委派/并发：\n- 失败/证据/升级：\n\n## 演练记录\n1. 成功：\n2. 上游失败：\n3. 结果未知："
  },
  "chaining-routing": {
    "en": "# Chain and route specification\n\n## Deterministic preprocessing\n1.\n2.\n\n## Route schema\n```json\n{\"route\": \"declared | unknown\", \"confidence\": 0, \"evidence_refs\": [], \"status\": \"complete | refused | incomplete\"}\n```\n\n## Route table\n| Route | Inclusion | Exclusion | Destination | Authority | Fallback |\n|---|---|---|---|---|---|\n| | | | | | |\n\n## Evaluation fixtures and threshold\n",
    "zh-Hans": "# 双层路由契约\n\n## 代码政策层\n| 条件 | 允许集合 | 拒绝/升级 |\n|---|---|---|\n|  |  |  |\n\n## 语义路由层\n| 类别 | 定义 | 正例 | 反例 | 目的地 | 低置信处理 |\n|---|---|---|---|---|---|\n|  |  |  |  |  |  |\n\n## 输出模式\n- schema_version：\n- category：\n- evidence：\n- confidence_band：\n\n## 回归与安全默认\n- refusal：\n- incomplete：\n- unknown：\n- 连续修复上限："
  },
  "parallel-fanout-fanin": {
    "en": "# Fan-out / fan-in contract\n\n## Execution plane and independence proof\n\n## Capacity\n- Active limit:\n- Queue limit:\n- Branch budget:\n- Overall deadline:\n\n## Join\n- Policy: all | validated-k-of-n | first-valid | best-effort\n- k / n and per-result validator:\n- Partial-result rule:\n- Late-result rule:\n- Cancellation rule:\n\n## Failure injections\n| Injection | Expected state | Evidence retained |\n|---|---|---|\n| Slow branch | | |\n| Invalid result | | |\n| Duplicate return | | |\n",
    "zh-Hans": "# 并行编排契约\n\n## 并发平面\n- 运行时/版本：\n- 平面：单轮工具调用 / SDK 本地 / 应用多运行 / 托管任务树\n- 上限的精确定义：\n\n## 分支与依赖\n| branch_id | 输入 | 依赖 | 写资源 | 截止 | 输出模式 |\n|---|---|---|---|---|---|\n|  |  |  |  |  |  |\n\n## Join\n- 条件：all / validated-k-of-n / first-valid / deadline-partial\n- k / n 与逐结果校验器：\n- 稳定排序：\n- 冲突解决：\n- 缺失标记：\n- 取消传播：\n\n## 故障注入结果\n- 慢分支：\n- 失败分支：\n- 冲突结果："
  },
  "manager-roles-ownership": {
    "en": "# Manager and role contract\n\n## Ownership\n| Concern | Owner | Acceptance evidence |\n|---|---|---|\n| Control | | |\n| Durable state | | |\n| Quality | | |\n| External action | | |\n| Final answer | | |\n\n## Role cards\n| Role | Objective | Context | Tools | Prohibited | Output schema | Escalate when |\n|---|---|---|---|---|---|---|\n| Manager | | | | | | |\n| Specialist | | | | | | |\n",
    "zh-Hans": "# 角色与所有权\n\n## 角色卡\n| 角色 | 唯一责任 | 禁止行动 | 输入 | 产物 | 成功判据 |\n|---|---|---|---|---|---|\n| 经理 |  |  |  |  |  |\n| 专家 |  |  |  |  |  |\n| 验证者 |  |  |  |  |  |\n| 批准者 |  |  |  |  |  |\n\n## 四张图\n- 任务树：\n- Host/沙箱：\n- 容量：\n- 责任链：\n\n## 冲突规则\n- 证据冲突：\n- 专家缺失：\n- 验证失败：\n\n## 最终答案责任\n- 最终答案所有者：\n- 采用/拒绝专家意见的记录位置：\n- 必须升级给人类的分歧："
  },
  "delegation-handoffs": {
    "en": "# Delegation and handoff protocol\n\n## Task packet\n```json\n{\"task_id\":\"\",\"caller_id\":\"\",\"return_to\":\"\",\"objective\":\"\",\"non_goals\":[],\"evidence_refs\":[],\"allowed_tools\":[],\"budget\":{},\"output_schema\":\"\",\"escalate_to\":\"\"}\n```\n\n## Ownership comparison\n| Moment | Manager-as-tools owner | Handoff owner | Durable state change |\n|---|---|---|---|\n| Before delegation | | | |\n| Specialist active | | | |\n| Result returned | | | |\n| Next user turn | | | |\n",
    "zh-Hans": "# 委派与交接协议\n\n## 选型\n- agents-as-tools / handoff：\n- 为什么：\n\n## 委派包\n- task_id / branch_id：\n- caller_id / return_to：\n- 目标 / 非目标：\n- 输入引用 / 输出模式：\n- 权限 / 预算 / 截止：\n- 证据要求：\n\n## 返回信封\n- status：\n- artifacts / evidence：\n- effects：\n- unknowns / blockers：\n- recommended_next：\n\n## 连续性\n- control_owner：\n- last-agent：\n- 恢复测试："
  },
  "orchestrator-workers-verification": {
    "en": "# Dynamic work harness\n\n## Coverage and stop criteria\n\n## Worker task packet\n| Field | Value |\n|---|---|\n| Objective / exclusions | |\n| Evidence scope | |\n| Artifact path / schema | |\n| Budget / deadline | |\n| Return destination | |\n\n## Progress ledger\n- Completed:\n- In progress / owner:\n- Blockers:\n- Verification evidence:\n- Next safe action:\n\n## Verifier rubric and independence check\n",
    "zh-Hans": "# 动态编排与验证\n\n## 最终验收\n- 必需覆盖：\n- 证据质量：\n- 不可接受遗漏：\n\n## 工作包\n- work_id / parent_id：\n- 目标 / 非目标：\n- 依赖 / 去重键：\n- 产物路径 / 输出模式：\n- 预算 / 截止：\n\n## 验证量规\n| criterion_id | 判据 | 原始证据 | 通过阈值 |\n|---|---|---|---|\n|  |  |  |  |\n\n## 返工与停止\n- failed_criteria：\n- 最大返工：\n- 无改进判据：\n- 人工升级：\n- 停止后的部分产物与未决项："
  },
  "tools-aci-mcp": {
    "en": "# Tool and MCP capability contract\n\n## Tool catalog\n| Tool / version | Purpose | Input / output | Authority | Approval | Error states |\n|---|---|---|---|---|---|\n| | | | | | |\n\n## Responsibility boundary\n| Concern | MCP | Client / orchestrator | Application / infrastructure |\n|---|---|---|---|\n| Capability description | | | |\n| Task decomposition | | | |\n| Authorization | | | |\n| Sandbox / credentials | | | |\n| Durable state / eval | | | |\n\n## Protocol versions and migration tests\n",
    "zh-Hans": "# 工具 / ACI / MCP 登记册\n\n| capability_id | 类型 | 主体 | 对象 | 读/写 | schema/version | 审批 | 幂等/效果核对 | 隔离/外流 |\n|---|---|---|---|---|---|---|---|---|\n|  | local/hosted/MCP |  |  |  |  |  |  |  |\n\n## MCP 版本边界\n- 规范：2026-07-28\n- SDK/包版本：\n- 旧示例假设：\n- 迁移变化：\n- 互操作测试：\n\n## 错误与升级\n- validation：\n- authorization：\n- transport：\n- execution：\n- outcome_unknown："
  },
  "context-state-memory": {
    "en": "# Context and state architecture\n\n| Datum | System of record | Model-visible? | Retention | Provenance | Recovery role |\n|---|---|---|---|---|---|\n| Instruction | | | | | |\n| Task fact | | | | | |\n| Tool effect | | | | | |\n| Memory | | | | | |\n| Approval | | | | | |\n\n## Context assembler\n- Required:\n- Retrieved just in time:\n- Excluded / redacted:\n- Compaction rule:\n\n## Resume invariant\n",
    "zh-Hans": "# 七对象信息与恢复\n\n| 信息 | 对象 | 规范来源 | 读/写者 | 敏感性 | 保留/删除 |\n|---|---|---|---|---|---|\n|  | context / application-run state / conversation-session / event log-history / checkpoint-RunState / memory / compaction |  |  |  |  |\n\n## 续接策略\n- 规范连续性来源：history / session / conversation / previous response\n- 有意组合的对象：\n- 协调与去重规则：\n- 防重复注入测试：\n\n## 状态与恢复\n- interrupted：\n- resumed：\n- completed：\n- stale_state：\n- 权限重新计算：\n\n## 长期记忆\n- 可写入类型：\n- 来源/有效期：\n- 用户查看与删除："
  },
  "budgets-concurrency-stopping": {
    "en": "# Budget and scheduler policy\n\n## Budget vector\n| Scope | Turns | Tokens | Cost | Time | Tool calls | Breadth/depth |\n|---|---|---|---|---|---|---|\n| Worker | | | | | | |\n| Run | | | | | | |\n| Tenant | | | | | | |\n\n## Admission and backpressure\n- Active / queue limits:\n- Priority and fairness:\n- Load-shed rule:\n- Cancellation propagation:\n\n## Stop predicates and degraded modes\n",
    "zh-Hans": "# 预算与停止契约\n\n## 运行时容量\n- runtime/version：\n- 数字：\n- 计数口径：整树 / 每父节点 / 进程 / 工具处理器\n- root 是否计入：\n- 排队是否计入：\n\n## 总预算\n| 时间 | 令牌 | 成本 | 外部调用 | 宽度 | 深度 | 轮次 |\n|---|---|---|---|---|---|---|\n|  |  |  |  |  |  |  |\n\n## 背压与停止\n- 队列上限/优先级：\n- 取消传播：\n- 成功/部分完成：\n- 预算耗尽：\n- 无改进/重复：\n- 人工停止："
  },
  "reliability-recovery": {
    "en": "# Reliability and recovery runbook\n\n## Replay-safety matrix\n| Operation | Effect | Stable operation ID | Dedupe owner | Retry class | Reconcile | Compensate |\n|---|---|---|---|---|---|---|\n| | | | | | | |\n\n## Dedupe identity and lifetime\n- Scope: authenticated caller or tenant + operation type + operation ID\n- Canonical request fingerprint:\n- Fingerprint mismatch: conflict / no effect\n- Retention: >= maximum retry + reconciliation + late-delivery horizon\n- After expiry: fail closed or query/reconcile\n\n## Outcome state machine\n- Definite failure:\n- Definite success:\n- Ambiguous:\n- Permanent / policy failure:\n\n## Retry envelope\n- Attempts / timeout / backoff / jitter:\n\n## Manual reconciliation and compensation\n",
    "zh-Hans": "# 效果与恢复契约\n\n## 操作身份\n- operation_id：\n- caller_id / tenant_id / return_to：\n- idempotency_key：\n- dedupe_scope：认证调用者或租户 + 操作类型 + operation_id\n- canonical_request_fingerprint：\n- fingerprint_mismatch：conflict / 不执行\n- retention：>= 最大重试 + 对账 + 迟到投递窗口\n- 过期后：fail closed 或查询/核对\n- semantic_equivalence：\n\n## 效果账本\n| effect | intent_hash | state | external_receipt | checked_at |\n|---|---|---|---|---|\n|  |  | pending/confirmed/rejected/outcome_unknown/compensated |  |  |\n\n## 重试\n- class：safe_read / idempotent_write / unsafe_write\n- max_attempts / deadline：\n- backoff + jitter：\n\n## 补偿与人工对账\n| 正向效果 | 补偿 | 是否可精确恢复 | 补偿失败 | 人工负责人 |\n|---|---|---|---|---|\n|  |  |  |  |  |"
  },
  "security-authority-human-control": {
    "en": "# Authority and human-control case\n\n| Action | User right | Agent role | Purpose/resource | Sandbox | Approval | Quality gate | Sign-off | Revoke/rollback |\n|---|---|---|---|---|---|---|---|---|\n| | | | | | | | | |\n\n## Threat and control\n| Threat | Prevent | Detect | Contain / recover | Owner |\n|---|---|---|---|---|\n| Prompt injection | | | | |\n| Confused deputy | | | | |\n| Data exfiltration | | | | |\n\n## User recourse and incident path\n",
    "zh-Hans": "# 授权与人工控制\n\n## 五层权限\n| 主体 | 任务目的 | 能力 | 对象/数据范围 | 具体效果 | 决定 |\n|---|---|---|---|---|---|\n|  |  |  |  |  | allow/ask/deny |\n\n## 控制层\n- input guardrail：\n- tool guardrail/approval：\n- output guardrail：\n- sandbox/network：\n- credential proxy：\n\n## 三项独立记录\n- 权限批准：\n- 质量证据：\n- 人类最终签核：\n\n## 事故\n- kill switch：\n- 凭证撤销：\n- 通知/取证："
  },
  "tracing-observability-economics": {
    "en": "# Observability and economics specification\n\n| Evidence system | Question answered | Core fields | Retention/access | Owner |\n|---|---|---|---|---|\n| Trace | What executed? | | | |\n| Monitor | Is the service healthy now? | | | |\n| Audit | Who authorized and what changed? | | | |\n| Eval | Did behavior meet the criterion? | | | |\n\n## Economics\n- Cost per accepted task:\n- Tail-latency target:\n- Retry / fan-out allocation:\n\n## Redaction and deletion tests\n",
    "zh-Hans": "# 遥测与经济性\n\n| 层 | 回答的问题 | 必需字段 | 消费者 | 保留/访问 |\n|---|---|---|---|---|\n| Trace | 一次执行发生什么 |  |  |  |\n| Monitoring | 服务是否健康 |  |  |  |\n| Audit | 谁批准并产生什么效果 |  |  |  |\n| Eval | 表现是否可接受 |  |  |  |\n\n## 关联与 SLO\n- trace/task/operation_id：\n- success：\n- p95 latency：\n- error/queue：\n\n## 经济性\n- 单位成功成本 =（模型 + 工具 + 重试 + 人工 + 恢复）/ 成功结果数\n- 预算阈值：\n\n## 隐私\n- 禁止字段：\n- 脱敏/采样："
  },
  "evaluation-regression-evolution": {
    "en": "# Evaluation and regression pack\n\n## Release manifest\n- Model / SDK / packages:\n- Prompt / schema / graph:\n- Tools / MCP / policies:\n- Data / retrieval / grader:\n\n## Evaluation matrix\n| Fixture | Node contract | Trajectory | Outcome | Safety | Latency / cost | Trials | Threshold |\n|---|---|---|---|---|---|---|---|\n| | | | | | | | |\n\n## Grader calibration and variance\n\n## Decision: pass | narrow | investigate | reject\n",
    "zh-Hans": "# 编排回归门\n\n## 版本矩阵\n| 项目 | 基线 | 候选 | 锁定证据 |\n|---|---|---|---|\n| 模型 |  |  |  |\n| 提示/图 |  |  |  |\n| 工具/MCP |  |  |  |\n| SDK/框架 |  |  |  |\n\n## 评估层\n| 层 | 量规 | 硬门 | trial 数 | 评分者 |\n|---|---|---|---:|---|\n| 节点 |  |  |  |  |\n| 轨迹 |  |  |  |  |\n| 结果 |  |  |  |  |\n| 业务/安全 |  |  |  |  |\n\n## 差异与决议\n- 质量：\n- 安全：\n- p95：\n- 单位成功成本：\n- ship/hold/rollback："
  },
  "production-orchestration-capstone": {
    "en": "# Production orchestration dossier\n\n## Pilot boundary and topology decision\n\n## Graph, roles, state, authority, and recovery\n\n## Evaluation and release-stage evidence\n| Stage | Cohort / effects | Required evidence | Stage gate; traffic SLI/SLO window | Exit / rollback | Owner |\n|---|---|---|---|---|---|\n| Offline fixture / replay | 0 / simulated | | | | |\n| Sandbox / synthetic integration | synthetic / isolated | | | | |\n| No-business-write shadow | representative reads / no business writes | | | | |\n| Recommendation-only | human executes | | | | |\n| Approval-gated bounded canary | limited / per-action approval | | | | |\n| Limited autonomy | bounded traffic and authority | | | | |\n\n## Incident tabletop and reconciliation\n\n## Decision and residual risk\n",
    "zh-Hans": "# 生产编排发布档案\n\n## 发布边界\n- 任务/用户/租户：\n- 数据/工具/副作用：\n- 不可接受结果：\n\n## 版本与控制面\n- 模型/提示/图：\n- SDK/框架/MCP：\n- 状态/预算/并发：\n- 权限/审批/隔离：\n- 效果账本/恢复：\n- trace/monitor/audit/eval：\n\n## 发布阶梯\n| 阶段 | 流量 | 权限 | 进入证据 | 阶段门；流量阶段的 SLI/SLO 窗口 | 回滚 | 负责人 |\n|---|---:|---|---|---|---|---|\n| 离线评估/回放 | 0 | 模拟 |  |  |  |  |\n| Sandbox/synthetic integration | 合成/隔离 | 无生产业务写入 |  |  |  |  |\n| Shadow | 代表性读取 | 无生产业务写入 |  |  |  |  |\n| Recommendation-only | 代表性 | 人工执行 |  |  |  |  |\n| Approval-gated bounded canary | 有限 | 逐动作审批 |  |  |  |  |\n| Limited autonomy | 有界 | 有界 |  |  |  |  |\n\n## 事故演练\n- 结果未知：\n- 权限撤销：\n- 队列饱和：\n- 补偿失败：\n- 人工接管："
  }
} as const satisfies Readonly<
  Record<
    AgentOrchestrationModuleSlug,
    Readonly<{ en: string; "zh-Hans": string }>
  >
>;
