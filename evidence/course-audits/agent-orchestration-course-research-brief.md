# aicourse.top Course 15《智能体编排》研究简报

文档状态：课程内容研究基线，不是已发布课程，也不是产品实现说明<br>
研究与核验日期：2026-08-23（Asia/Taipei）<br>
适用课程：aicourse.top 第 15 门课<br>
建议课程名：**智能体编排：从模式选择到可恢复的生产系统**<br>
配套溯源：[agent-orchestration-course-research-brief.provenance.md](./agent-orchestration-course-research-brief.provenance.md)

## 执行摘要

本课程可以按 15 个模块建设。经独立核验，原概念图谱已经覆盖智能体编排的主要工程问题：何时需要 Agent、任务图与契约、链式与路由、并行与汇合、Manager、委派与 handoff、orchestrator–workers、evaluator–optimizer、工具与 MCP、上下文与状态、预算与停止、可靠性、安全、可观测性、评测以及生产发布。

要达到“世界级”而不是“模式名词展览”，课程必须同时做到四件事：

1. **跨层不混淆。** 模型能力、OpenAI Responses API、Codex、Agents SDK、Claude/Anthropic、MCP、第三方框架和应用自己的 orchestration policy 是不同层；任何产品参数都要标注产品、版本、成熟度和核验日期。
2. **从 happy path 升级到失败语义。** Timeout、retry、backoff 只是起点；必须讲清未知提交结果、稳定 operation ID、幂等、去重、effect journal、部分失败、恢复、补偿、不可逆点和人工对账。
3. **把“看见运行”与“证明质量”分开。** Trace、metrics、logs、audit record、production monitoring 和 eval 各有不同职责；一次漂亮 trace 不是回归评测，一次 PASS 也不是权限批准或人工签收。
4. **使用权利安全的原创教学图。** 两个私有开发输入（一份说明演示文稿和一份研究归档）只用于提出待核验问题；课程公开页面只发布从公开事实重新设计的原创 semantic HTML/CSS/SVG，不复制、近似描摹或公开再分发私有或第三方素材。

本课程的可发布范围应表述为：

> 系统覆盖现代生产级智能体编排的模式选择、执行契约、状态、可靠性、安全、可观测性、评测与发布；不声称穷尽全部形式化调度理论、所有厂商框架或未来产品行为。

## 研究问题与范围边界

课程要回答的不是“怎样堆更多 Agent”，而是以下连续问题：

```text
为什么要编排？
→ 谁决定下一步？
→ 谁拥有状态、权限、共享资源与最终答案？
→ 如何路由、并行、汇合、交接和停止？
→ 工具动作如何被授权、追踪、重试和恢复？
→ 如何证明结果正确、系统可控且值得上线？
```

纳入范围：

- code-directed workflow（代码预定义控制路径）、single-agent loop、multi-agent orchestration 的选择边界；
- prompt chaining、routing、parallelization、manager、handoff、orchestrator–workers、evaluator–optimizer；
- 任务图、节点契约、结构化工具接口、MCP 能力接入；
- context、conversation state、session、event log、checkpoint、memory、compaction；
- concurrency、queue、backpressure、budget、deadline、cancellation 和 stopping；
- retry、idempotency、deduplication、recovery、replay、compensation、manual reconciliation；
- least privilege、sandbox、approval、authorization、guardrails、HITL、prompt injection；
- tracing、observability、audit、privacy、economics、evals、regression、progressive rollout。

不纳入或不作普遍承诺：

- 把多 Agent 数量当成能力或质量等级；
- 暴露模型隐藏 chain-of-thought；课程只要求可审查的计划、证据、动作、状态和结论；
- 宣称 exactly-once、完整 rollback 或可重复 replay，除非具体依赖和实验明确证明；
- 把某一 SDK、Beta API、GitHub 模板或个人工作流当作跨平台标准；
- 公开再分发私有开发输入、Claude Academy 页面或任何权利与隐私状态未明确的第三方材料。

## 术语与分层法

### 七层分类

| 层 | 回答的问题 | 典型对象 | 不能替代什么 |
|---|---|---|---|
| 业务与任务层 | 要完成什么、成功和风险是什么？ | user goal、task、acceptance criteria、SLO | 不能由模型自己补成未经授权的新范围 |
| 模型层 | 模型能推理和生成什么？ | GPT、Claude、其他模型 | 不等于 Agent、状态机、权限系统或 durable workflow |
| Provider/API 产品层 | 某厂商当前暴露什么能力？ | Responses Multi-agent、Codex subagents | 产品 Beta 语义不是跨厂商标准 |
| SDK/框架层 | 怎样实现 loop、handoff、session、guardrail？ | OpenAI Agents SDK、Semantic Kernel、LangGraph | 框架不自动提供业务幂等、授权或正确性 |
| 应用编排层 | 谁运行、按什么图运行、怎样停止？ | router、manager、DAG、queue、policy、state owner | 不能把调度责任推给 MCP 或 prompt |
| 协议与工具层 | 能力怎样被描述、调用和返回？ | function calling、MCP、HTTP、JSON Schema | 工具可见不等于已授权执行；schema-valid 不等于正确 |
| 运行与治理层 | 在哪里执行、怎样限制和运营？ | host、sandbox、credentials、trace、eval、rollout | Host 不是 Agent；trace 不是 eval；approval 不是 PASS |

教学页面中的任何易变事实都应显示一个短标签，例如：

```text
[OpenAI Responses API · Beta · verified 2026-08-23]
[Codex · current docs · verified 2026-08-23]
[MCP core · 2026-07-28]
[Community implementation · not a platform guarantee]
```

### 必须区分的状态对象

| 术语 | 课程定义 | 核心边界 |
|---|---|---|
| Context | 某次 inference 实际送入模型的 tokens | 有窗口上限；只包含被选择进入本次调用的内容 |
| Application / run state | 控制一次执行的机器可读数据 | 可以完全不向模型暴露；需要明确 owner 和并发语义 |
| Conversation / session | 用于持续对话或保存历史的容器 | session 不是 context window，也不等于长期记忆 |
| Event log / history | 按时间记录 message、tool、handoff、approval、effect 等事件 | 可审计或重建输入，但不一定足以安全恢复 |
| Checkpoint / RunState | 足以恢复暂停运行的版本化快照 | 与 agent、SDK、schema、tool version 兼容性绑定 |
| Memory | 保存后可在未来检索或选择进入 context 的信息 | 在被检索并注入前，仍在模型 context 之外 |
| Compaction | 为降低 context 压力而进行的压缩或不透明延续状态 | 可能丢失细节；不是天然的 durable memory 或人工可读摘要 |

### 三道不可合并的门

```text
Permission / Approval
是否允许尝试这个动作？
        ↓
Quality Gate / PASS
证据是否满足预先定义的技术标准？
        ↓
Human Sign-off
有责任的人是否接受结果、风险和外部后果？
```

“获准执行”“动作执行成功”“质量验证通过”“人类接受交付”应是四个可分别记录的状态。

## 编排契约：课程的统一工程骨架

每个节点或 delegation 必须拥有可执行契约，而不仅是一段角色 prompt。建议课程统一使用以下字段：

```text
contract_version
workflow_id / run_id / task_id / parent_task_id
trigger / objective / non_goals
owner / final_answer_owner / state_owner
input_schema / output_schema
allowed_tools / authority / side_effect_class
state_read / state_write / consistency_policy
route / topology / dependencies / join_condition
deadline / timeout / cancellation_policy
max_turns / max_tool_calls / max_subagents / max_cost
retry_classification / retry_budget / idempotency_key
approval_policy / evidence_required / success_condition
failure_route / fallback / compensation / manual_reconciliation
model / prompt / tool / SDK / schema versions
```

建议的子任务回传 envelope 是本课程的教学契约，不是 OpenAI 或 Claude 的跨平台标准：

```json
{
  "contractVersion": "1.0",
  "taskId": "research-03",
  "producer": "/root/researcher",
  "status": "complete | partial | blocked | failed",
  "result": {},
  "evidence": [],
  "uncertainty": [],
  "obstacles": [],
  "effectsPerformed": [],
  "recommendedNextAction": ""
}
```

结构有效只证明字段符合 schema；它不证明事实正确、来源新鲜、动作已授权或外部状态已提交。

## 15 模块证据与课程覆盖台账

本表直接使用与课程 manifest 完全一致的 canonical source IDs；配套 provenance sidecar 为每个 ID 保存直接 claim evidence URL、独立 version anchor（如适用）、成熟度、许可和证据边界。

| # | 模块与核心成果 | 必须覆盖的概念 | 核心证据 | 发布门禁 |
|---:|---|---|---|---|
| 1 | **编排边界与必要性**：选择普通代码、workflow、single agent 或 multi-agent | augmented LLM、agent loop、workflow vs agent、autonomy ladder、when not to use multi-agent、单 Agent baseline | openai-building-agents、openai-practical-guide、anthropic-effective-agents | 至少一个“把五 Agent 压回单 Agent/普通代码”的反例；不写“更多 Agent 更强” |
| 2 | **任务图、执行契约与状态边界**：把目标变成可执行 graph | trigger、node/edge、ownership、termination、routing、schemas、permissions、handoff payload、budgets、evidence、fallback、versioning | openai-sdk-orchestration、anthropic-effective-agents、microsoft-agent-framework | 节点 contract 必须含 state owner、side effect、deadline/cancel、retry/idempotency、failure route |
| 3 | **链式编排、路由与 fallback**：比较 code-directed 与 model-directed control | prompt chaining、deterministic router、LLM router、triage、unknown/ambiguous/refusal/incomplete、fallback | anthropic-effective-agents、openai-sdk-orchestration、openai-structured-outputs、claude-academy-api | 模型返回的 confidence 不得默认称为校准概率；高风险路线需要 deterministic/human gate |
| 4 | **并行、汇合与冲突**：只并行真正独立的工作 | sectioning、voting、fan-out/fan-in、join/barrier、critical path、tail latency、shared-write isolation、locks/OCC/worktrees、cancellation | anthropic-effective-agents、openai-sdk-orchestration、openai-function-calling、openai-responses-multi-agent、openai-codex-subagents、openai-codex-sandbox-security、openai-agents-python-patterns、oracle-critical-path、etcd-quorum-glossary | 区分 parallel tool calls、application concurrency、Codex thread capacity、Responses subagent capacity；单一 merge owner |
| 5 | **Manager、角色契约与最终答案所有权** | manager/agents-as-tools、specialists、role/non-goals、least privilege、final answer owner、manager bottleneck | openai-agents-orchestration、openai-practical-guide、anthropic-research-system | 每张角色卡必须定义 authority、tool surface、state ownership、evidence 和 eval target |
| 6 | **委派、Subagent 与 Handoff**：区分结果返回和控制权转移 | delegation、agents-as-tools、handoff、conversation ownership、context filtering、structured return、continuation | openai-agents-orchestration、openai-results-state、claude-academy-subagents、claude-sdk-subagents | 学生必须画出两种结构的最终回复者和下一轮起点；回传 envelope 标为课程自定义 |
| 7 | **Orchestrator–Workers、Evaluator–Optimizer 与 Verifier** | dynamic decomposition、coverage/de-duplication、bounded loops、feedback、deterministic verifier、LLM judge、human reviewer | anthropic-effective-agents、anthropic-research-system、openai-sdk-orchestration、openai-agents-python-patterns、claude-cookbooks-patterns、anthropic-harness-long-running | voting 不得冒充独立验证；verifier 必须有独立任务、证据、失败权和停止规则 |
| 8 | **工具、ACI 与 MCP 能力边界** | function tool、hosted/local tool、structured I/O、error model、side effects、MCP Host/Client/Server、trust boundary | openai-tools、openai-function-calling、openai-mcp-connectors、anthropic-writing-tools、anthropic-effective-agents、mcp-spec-2026、mcp-changelog-2026、mcp-versioning-2026、mcp-python-sdk-v2、claude-academy-mcp-legacy、mcp-ts-migration-2026 | ACI 沿用 Anthropic 的 Agent-Computer Interface 原义；课程原创的是扩展行动边界登记册；MCP 是能力/上下文协议，不是 task scheduler；current/legacy 分栏 |
| 9 | **Context、State、Session、Log、Checkpoint 与 Memory** | context selection、local vs model-visible state、conversation continuation、event sourcing、checkpoint、memory retrieval、compaction loss | openai-context-management、openai-running-agents、openai-results-state、openai-compaction、anthropic-context-engineering、anthropic-managed-agents、azure-cosmos-distributed-lock | 使用本简报七对象定义；保存 retention、provenance、freshness、deletion 和 version compatibility |
| 10 | **预算、并发、队列、背压与停止** | turns/calls/time/token/cost/depth budgets、capacity、queues、rate limits、fairness、admission control、load shedding、deadline/cancel | openai-sdk-orchestration、openai-responses-multi-agent、openai-codex-subagents、openai-codex-sandbox-security、openai-latency、openai-cost、claude-sdk-agent-loop、anthropic-research-system | API 没有固定 depth limit 不代表生产无限递归；必须有应用级总量与停止策略 |
| 11 | **可靠性：Timeout、Retry、Idempotency、Recovery 与 Compensation** | transient/permanent/ambiguous failure、backoff+jitter、Retry-After、operation ID、dedup/effect journal、circuit breaker、partial failure、replay、saga/compensation、irreversible boundary | openai-model-retries、openai-webhooks、openai-background、openai-running-agents、claude-sdk-checkpointing、anthropic-managed-agents、github-aws-return-path-issue、aws-idempotent-apis、aws-backoff-jitter、azure-retry-storm、azure-compensating-transactions、azure-cosmos-distributed-lock | 新 request ID 不是 idempotency；不承诺 exactly-once；不可逆动作进入 compensation/manual reconciliation |
| 12 | **安全、Authority Boundary、Sandbox、Approval 与 HITL** | least privilege、authn/authz、sandbox vs permission、prompt injection、confused deputy、credentials outside context、egress、tenant isolation、approval fatigue | openai-guardrails-approvals、openai-sdk-hitl、openai-safety、openai-mcp-connectors、claude-sdk-permissions、claude-secure-deployment | 授权必须在 tool/effect boundary 重查；side effect 前审批；PASS、approval、sign-off 分开 |
| 13 | **Tracing、Observability、Failure Domains、Economics 与 Privacy** | spans/traces、metrics/logs/audit、correlation、SLO、p50/p95/p99、critical path、cost per successful task、redaction/retention/access/sampling | openai-observability、openai-tracing、openai-latency、openai-cost、google-sre-error-budget、claude-sdk-observability、anthropic-research-system、otel-overview、otel-baggage-security | trace 不等于 eval 或业务审计；OpenTelemetry Baggage 不放 secrets 或未最小化的个人数据，也不作为可信授权输入；fan-in 使用 span links；记录业务 outcome |
| 14 | **Agent Evals、回归与版本隔离** | task/trial/grader/trajectory/outcome/harness/suite、repeated trials、end-state + selected process constraints、deterministic/model/human graders、calibration、capability vs regression、leakage | openai-agent-evals、anthropic-agent-evals、openai-agents-python-v022、openai-swarm-lifecycle、anthropic-agent-sdk-v02143、langgraph-v1211、microsoft-agent-framework、autogen-maintenance | 优先 deterministic grader；LLM grader 需与人类样本测量一致性和误差；clean isolated trials |
| 15 | **生产架构、渐进发布与 Capstone** | version matrix、shadow/canary/progressive rollout、SLO/error budget、kill switch、fail-open/closed、runbook、rollback/compensation、incident owner | openai-background、openai-webhooks、openai-running-agents、anthropic-managed-agents、microsoft-agent-framework、google-adk-v271 | stable path 不依赖 Beta；升级即行为变更；capstone 必须注入失败并演示恢复与人工对账 |

## 关键工程原则

### 1. 多 Agent 是任务结构的函数，不是质量等级

OpenAI 当前 Responses 文档明确说明，多 Agent 最适合独立、有界的工作流；增加 subagents 可能增加 token，并不适合固定顺序、共享可变状态或被单一慢外部操作支配的任务。Anthropic 同样建议从最简单的可行方案开始。课程必须要求学生先运行单 Agent 或 code-directed baseline，再比较 quality、latency、cost、calls、retries 和 failure surface。这里的 code-directed 只说明转移与门禁由代码预定义；流程若包含 LLM 节点，其输出仍具随机性，不能被称为逐次确定。

### 2. 并行要按“读写集合”而不是按角色名决定

只读研究、不同假设调查、独立测试和多角度审阅适合并行。多个 Agent 同时写相同文件、数据库行、发布状态或外部对象时，应使用隔离 worktree、明确所有权、权威存储的原子 CAS/OCC、带 fencing token 的租约或单写者、冲突检测和单一 merge owner；否则默认串行。在不存在额外资源约束的加权依赖 DAG 中，critical path 给出依赖约束下最早完工的下界；有限 worker、队列和共享资源会形成资源约束调度问题，实际 makespan 还受尾部 worker、barrier、争用和重试影响。

### 3. Handoff 是控制权语义，不只是消息传递

Agents-as-tools 中 manager 保留最终回答所有权；handoff 中 specialist 接管当前分支。传递多少 history、谁拥有下一轮、guardrails 在哪条路径生效、失败后回谁处理，都必须写入契约。一个自然语言“请继续”不能代替 machine-readable caller/recipient/task identity。

### 4. MCP 提供能力接入，不提供团队任务调度

MCP 规范定义 Host、Client、Server、resources、prompts、tools、消息模式、authorization 和扩展。由此可以合理推断：MCP 可成为 Agent 的 capability layer，但没有定义 manager 怎样分解任务、worker 怎样排队、什么时候汇合或谁拥有最终答案。课程应把 MCP 放在工具/协议层，而不是编排图的控制器位置。

### 5. 状态要有唯一 owner 和一致性策略

“所有 Agent 共享 memory”不是可执行设计。每份状态必须说明 canonical owner、read/write 权限、版本、并发控制、merge policy、freshness、retention 和 failure behavior。模型 context 只是当前选择的视图，不是业务事实数据库。

### 6. Retry 不能越过不确定 side effect

失败至少分为：请求尚未发送、服务明确拒绝、暂时失败、响应丢失但服务可能已提交、部分 stream、tool 已执行但回传失败、重复 webhook、checkpoint 恢复失败和不可逆 effect。只有被具体 contract 证明为 retry-safe 的操作才能自动重试。对于 mutation，应使用同一 logical operation key、dedup store/effect journal，并提供状态查询；“换一个 request ID 再试”不能防止重复写入。

### 7. Replay 是受控实验，不是时间机器

重放要区分：

- 只重放模型可见 history；
- 重放 orchestration decisions；
- 重放工具 observation；
- 重新调用真实外部工具。

只有固定输入、模型/提示/工具/SDK/schema 版本、环境状态和随机性，并屏蔽或模拟 side effect，才能接近可重复实验。真实支付、发送、删除和第三方读取通常不能安全原样 replay。

### 8. Verifier 的独立性需要设计

同一模型、相同 context、同一证据源的多个投票者可能相关地犯错。独立 verifier 至少需要不同任务指令、受控 context、可访问原始证据、拒绝/失败权、明确 rubric 和不依赖生成者自述的检查。能用 unit test、schema validator、calculator、state inspection 或 rule check 时，优先 deterministic verifier。

### 9. 安全边界必须覆盖模型之外

Prompt injection 可来自网页、文件、RAG、repository、tool output、MCP server 或其他不可信输入。防线应重叠：最小工具集、read-only 默认、filesystem 和 network containment、tenant isolation、credentials 在模型和 sandbox 之外、短期 scoped credentials、egress allowlist、action-time authorization、side-effect 前 approval、审计和异常停止。Guardrail 是一层概率或规则检查，不能代替 OS sandbox 和业务授权。

### 10. 质量需要多层证据

```text
单次运行：trace + artifact inspection
开发回归：isolated tasks + graders + repeated trials
上线实验：shadow / canary + control comparison
生产运营：SLO + errors + business outcomes + user feedback
高风险结论：independent verification + human sign-off
```

## 必须修正的时效与表述

### OpenAI Responses Multi-agent 与 Codex 不可混写

截至 2026-08-23：

- Responses Hosted Multi-agent 是 GPT-5.6 模型的 Beta 功能，item schema 可能变化；
- `max_concurrent_subagents` 计算整棵树中同时活跃的所有后代，排除 `/root`，默认 3；
- 当前 API 没有固定 tree depth 或 total-created-subagents limit，但课程仍必须设置应用级上限；
- 该 Beta 中 root/subagents 使用请求配置的同一模型与工具；这不能推广到 Codex custom agents 或其他框架；
- `/responses/compact`、`reasoning.summary` 和 `max_tool_calls` 在该 Beta 下有当前限制；自动 compaction 独立作用于每个 agent context；
- Codex 的 `agents.max_concurrent_threads_per_session` 则限制同时打开的 spawned-agent threads，排除 primary，计数对象不同。

因此 `/root` 是具体 API 的 agent path，不是 OS root、MCP Host、通用主线程名或权限等级；“5 个槽位”必须先说明来自哪个 runtime/configuration。

### Claude Academy Advanced MCP 只能作 legacy 对照

当前 MCP normative revision 是 `2026-07-28`。该版本移除 protocol-level sessions 和 `initialize`/`notifications/initialized`，要求每个请求携带版本/能力 metadata，增加 `server/discover`，用 Multi Round-Trip Requests（MRTR）取代原先 server-initiated roots/sampling/elicitation 请求，并将 Roots、Sampling、Logging 和 HTTP+SSE 列为 deprecated、建议新实现不要采用。

Claude Academy 的 “Model Context Protocol: Advanced Topics” 页面仍列出 required initialization handshake、SSE session/dual connection、sampling、roots 和 logging。因此它不能作为当前 MCP 实现规范；只可标为“旧版 MCP 心智模型/历史对照”，课程的规范依据必须是带版本的 MCP schema、specification、changelog 和 SDK migration guide。

### Framework 生命周期必须进入课程

OpenAI Swarm 官方仓库现已说明 Swarm 是 experimental/educational，并由生产定位的 Agents SDK 取代。这类变化说明：课程的核心应是 framework-neutral contracts 和 failure semantics；代码示例必须 pin version/tag/commit，并保存迁移和 deprecation 信息。`main` 分支文档不应被描述为已锁定 release 的保证。

### 2026-08-23 正确性复核与 v1.1.1 修正

本轮逐项复核课程正文、来源边界、双语一致性和交互文案后，确认并修正以下问题：

- **ACI 归因与翻译：** Anthropic 官方使用 Agent-Computer Interface（ACI），不是 Action Capability Interface。课程现在统一译为“智能体—计算机接口”；主体、对象、审批、幂等、效果核对、隔离与数据外流等扩展字段被明确标为课程原创登记册，而不再把 ACI 术语本身误称为课程自创。
- **事件交付：** OpenAI Webhook 文档只说明非成功响应会在最多 72 小时内重试，并提示罕见重复事件；有限重试不保证最终一定送达。因此课程删除“实践中 at-least-once”的供应商级承诺，同时保留去重与业务幂等要求。
- **异步响应保留：** Background mode 的存储与保留受项目设置及 `store` 选项约束，部分响应约 10 分钟后删除；课程不再笼统称其“durably manages”一个 response。
- **权限优先级：** Claude Agent SDK 当前顺序被改正为 hooks → deny rules → ask rules → permission mode → allow rules → canUseTool，并补充自动批准可能绕过 canUseTool、全调用检查应放在 PreToolUse 的边界。`allowed_tools` 是匹配工具的预批准配置，并不隐藏所有未列工具；固定工具面还需适当组合 `dontAsk`、deny/工具移除规则、hooks 与 sandbox。
- **并行与调度：** critical path 现在限定为无额外资源约束时累计预计时长最大的依赖路径，并作为资源受限 makespan 的下界；有限容量与队列需要另算资源约束调度。普通分支汇合改称经验证的 k-of-n 阈值，以免与具有 membership/intersection 语义的分布式共识 quorum 混淆；原子版本/CAS 或带 fencing token 的租约用于拒绝陈旧写入，尽力而为的进程锁不再被写成正确性保证。
- **工作流术语：** “确定性工作流”改称 code-directed workflow，明确只有控制转移与门禁可由代码确定；任何 LLM 节点和依赖它的结果仍具随机性，必须跨多次试验评估。
- **可靠性与状态：** 幂等去重记录现在明确绑定认证调用者、操作类型、operation_id 与请求指纹，并覆盖最大重试、对账和迟到投递窗口；复用 ID 但指纹不同视为冲突。状态教学统一为七对象模型，SDK 来源在界面中单独标为“官方 SDK 文档”。
- **评估与发布：** `pass@k` 只回答 k 次中是否至少一次成功，不能替代单次成功率或要求每次成功时的 `pass^k`；中英文发布阶梯统一为离线回放 → sandbox/synthetic → 无业务写入 shadow → recommendation-only → 审批式有界 canary → limited autonomy，流量与权限分别放宽。
- **证据边界：** trace 只重建已记录、已埋点的路径，受传播、采样、导出与保留缺口限制；shadow 禁止生产业务写入仍可能产生读取、外部调用、隐私、遥测、限流、队列与成本影响；重复评估只支持声明任务分布和不确定性范围内的结论，不证明未测试场景的普遍正确性；SLO/error budget 只在承载服务流量的阶段按声明窗口评估，不是单次运行的通过位。
- **来源层级：** MCP TypeScript migration guide 已从 normative-standard 改为 sdk-or-framework；Anthropic Engineering 文章、Claude Academy 官方学习材料与 OpenAI 概念指南归入 engineering-guidance，不再冒充产品/API 契约。OpenTelemetry 的带版本 span/link 规范与滚动 Baggage 安全指南也拆成两个记录；Oracle critical-path 与 etcd quorum 只在各自明确边界内支撑调度和共识术语。

这些修正不改变 15 模块架构、学习时长或核心教学结论；它们收紧了术语、产品保证和证据可证明范围。相应断言已进入离线发布门禁。

## 互动实验与 Capstone

### 八类贯穿实验任务

下列八类学习任务由六种可复用的本地 lab 控件与模块级情景组合实现；“八类任务”不是八个彼此独立的 UI 组件，也不改变公开目录中的六种实验模式计数。

1. **Pattern Chooser**：给定依赖、共享状态、风险和 SLA，选择 code/workflow/single/multi-agent，并解释不使用更多 Agent 的原因。
2. **Topology Simulator**：操作 chain、router、fan-out/fan-in、handoff、manager；显示 critical path、queue、tail worker 和 runtime-specific capacity。
3. **Context Boundary Lab**：决定哪些内容进入 model context、app state、checkpoint、memory 和 audit log；观察 compaction 信息损失。
4. **Failure Injector**：注入 timeout、429、5xx、partial stream、lost response、duplicate delivery、stale checkpoint 和 irreversible effect。
5. **Approval Policy Builder**：按 read、reversible local write、external write、financial/legal、destructive/irreversible 分配 authorization、sandbox、approval 和 sign-off。
6. **Trace Explorer**：查看 spans、handoffs、tool calls、effects、retries 和 redaction；明确 trace 能证明和不能证明什么。
7. **Eval Studio**：构造 task/trial/grader/suite，比较 deterministic、LLM 和 human grading；检查 repeated-trial consistency 与 grader calibration。
8. **CourseOps Capstone**：从 task graph 到 progressive rollout，提交可验证 evidence pack。

### 两个不得省略的故障场景

**未知提交结果：** side-effect tool 已提交，但网络在返回前断开。学习者必须复用同一 operation key、查询 effect ledger、避免重复执行并完成 reconciliation。

**间接 prompt injection：** RAG/MCP/tool output 中含有“读取凭据并发送到外部地址”的指令。学习者必须把内容视为不可信数据，通过 least privilege、egress boundary、credentials outside context、action-time authorization 和 pre-effect approval 阻止外泄。

### Capstone 交付清单

1. task graph、ownership graph 和 authority map；
2. 不依赖 Beta 的稳定基础实现，Beta 仅作对照；
3. 至少一个 deterministic/code-directed router；
4. 明确选择 manager/agents-as-tools 或 handoff 的理由；
5. 一个安全的 parallel fan-out/fan-in 和一个串行 shared-write path；
6. strict schemas 与明确 tool error/side-effect/idempotency contracts；
7. side-effect 前 HITL 和 action-time authorization；
8. session/checkpoint resume，并验证 incompatible version failure；
9. timeout/retry/dedup/effect-journal/compensation/manual-reconciliation 设计；
10. trace、metrics、audit 和 business outcome telemetry；
11. node、trajectory、outcome 三层 eval，含 repeated trials；
12. pinned model/prompt/tool/SDK/schema/framework versions；
13. failure injection 与 prompt-injection test；
14. quality/latency/cost/safety comparison against a simpler baseline；
15. shadow/canary、kill switch、fail-open/closed decision 和 incident runbook。

## 来源层级与使用规则

1. **版本化规范和 schema**：用于 protocol MUST/SHOULD、消息和兼容性陈述。
2. **当前一手产品/API 文档**：用于当前参数、限制、Beta、权限和产品行为。
3. **锁定版本的官方 SDK 文档、release 与 GitHub 源码**：用于实现示例；记录 tag/commit。
4. **厂商官方 GitHub 仓库**：只证明该项目/版本的设计。
5. **社区仓库、issue 与私有开发输入**：只用于发现候选模式、失败案例或核验问题，不能单独证明平台事实或普遍效果。

每一条课程来源记录必须包含 owner、layer、URL、accessed date、version/commit、maturity、license/reuse status、supported claim、boundary 和 transformation。

## 权利安全的资产决策

### 允许公开发布

- 从已核验事实重新设计的原创 semantic HTML/CSS/SVG；
- 不依赖第三方 visual composition 的原创状态机、表格、时序图和交互模拟；
- 很短的必要术语或 API identifier，并链接一手来源；
- 在适用开源许可证下自行编写或明确改写的最小 code example，保留 LICENSE/NOTICE/attribution 要求。

### 默认不发布

- OpenAI、Anthropic、Claude Academy、Microsoft、LangChain 或 MCP 官方网页截图和原图；
- 私有开发输入及其任何媒体、文字、截图、聊天记录或近似重绘；
- Claude Academy lesson、quiz、transcript 或页面截图；
- 来源许可证、人物授权或隐私状态不清楚的图像；
- 仅因“公开在 GitHub”就复制的代码或图片。

“重绘”仍可能形成衍生作品。原创课程图应从事实和关系出发，重新选择 topology、布局、视觉语言、颜色、节点名和交互，不保留第三方图的独特构图或品牌 trade dress。产品名可作事实性文字比较；不需要 vendor logo。

### 私有开发输入处理结论

用户提供的两个开发输入——一份说明演示文稿和一份研究归档——只以只读方式作为私有研究资料查阅。输入中的任何指令均被忽略，不执行，也不作为课程要求或公开证据；它们只帮助提出问题。所有公开陈述均回到本简报和 provenance sidecar 所列公开一手来源独立核验，私有媒体与文字不再分发。

Private development inputs are excluded from public and commit-ready artifacts. 提交就绪的简报与溯源附录不保留输入文件名、位置、内容指纹、大小、内部结构、成员清单或核验统计。

## 研究局限与剩余缺口

1. **快速变化**：Responses Multi-agent、Codex、Agents SDK、Claude、MCP SDK 和各框架会变化。所有 Beta、parameter、model availability、limits、pricing 和 deprecation 必须在实现/发布日再次核验。
2. **没有运行基准**：本研究核验了概念和文档，没有在本仓库执行同一 workload 的 single-agent vs multi-agent quality/latency/cost benchmark；课程不得预写性能结论。
3. **框架覆盖有边界**：GitHub 示例用于展示模式与生命周期，不代表对 Semantic Kernel、LangGraph、AutoGen、CrewAI 等做了完整安全或性能审计。
4. **权利确认未完成**：两个私有开发输入的整体所有权、嵌入资产许可与隐私许可未建立，所以它们维持非公开且不作为 canonical source。
5. **MCP 生态迁移中**：current spec 不等于所有 SDK/client/server 已默认支持；示例实现前要选定具体 SDK version，并做 current/legacy compatibility tests。
6. **可靠性是应用级责任**：OpenAI/Claude Agent SDK 不会自动为任意数据库、邮件、支付、MCP 和第三方 API 提供 exactly-once、distributed transaction 或完整 recovery。
7. **复核不是永久保证**：v1.1.1 的课程正文、来源边界、交互与双语文案已于 2026-08-23 完成本轮独立研究、验证和概念验收，且没有未解决的 P0/P1 发现；这仍不能替代任何后续产品、协议、来源或课程内容变更所需的重新 review 与发布门禁。

## 研究完成标准

本研究阶段在以下条件下可移交课程作者：

- 15 模块均有一手来源、边界和可测试学习成果；
- MCP 2026-07-28 与 Claude Academy legacy material 已明确分离；
- OpenAI Responses Beta、Codex 和 Agents SDK 语义不再混写；
- reliability、state、security、observability、eval 和 lifecycle 缺口进入课程门禁；
- 两个私有开发输入只用于提出问题，且识别性元数据与内容不进入公开或提交就绪产物；
- 公开资产策略为原创图优先、无第三方媒体搬运；
- provenance sidecar 可从 claim 追到 URL、owner、layer、version、maturity、license、boundary 和 transformation。
