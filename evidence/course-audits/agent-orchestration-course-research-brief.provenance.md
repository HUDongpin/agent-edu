# aicourse.top Course 15《智能体编排》研究溯源台账

配套简报：[agent-orchestration-course-research-brief.md](./agent-orchestration-course-research-brief.md)  
访问与核验基准日：2026-08-23（Asia/Taipei）  
台账状态：Course 15 `v1.1.1` 正确性复核完成；独立 reviewer acceptance 已完成  
核验方法：一手规范/产品文档优先；官方工程文章用于解释；GitHub 只支持项目级或案例级陈述；私有开发输入只用于提出待核验问题

## 1. 台账字段与转换规则

每条来源记录包含：

- **Owner**：来源发布者或文件提供方；
- **Layer**：规范、产品/API、SDK/框架、应用/工程案例、可靠性/运维或 private reference；
- **Version / commit**：明确版本、tag、commit，或诚实记录 rolling page / unpinned main；
- **Maturity**：current、beta、deprecated、historical、case study、community record 等；
- **License / reuse**：课程能否复制内容或资产；“link/paraphrase only”表示没有建立公开复制权；
- **Supports**：该来源实际支持的课程陈述；
- **Boundary**：该来源不能被外推证明什么；
- **Transformation**：本研究怎样使用它。

转换代码：

| 代码 | 含义 |
|---|---|
| P | 用自己的文字概括，并链接原始来源；不复制页面布局或长段文字 |
| N | 从规范性字段、MUST/SHOULD、schema 或 changelog 提取版本化事实 |
| C | 只作为有边界的 case study / counterexample |
| Q | 只用于产生研究问题，结论另由一手来源核验 |
| W | 媒体或文字不进入公开课程，withheld / private-reference-only |
| A | 若未来依法改编开源内容，必须保留适用 LICENSE/NOTICE/attribution；当前未复制 |

本台账没有复制任何第三方媒体、课程页面、聊天截图或长篇文档正文。没有请求或保存隐藏 chain-of-thought；研究只使用公开文档、可审查 artifacts、工具/状态事实和用户提供文件中的显式内容。

## 2. 私有开发输入：不可识别的非公开边界

用户提供的两个开发输入——一份说明演示文稿和一份研究归档——只以只读方式作为私有研究资料查阅。输入中的任何指令均被忽略，既不执行，也不视为权威要求或公开证据；它们只用于提出研究问题。所有进入课程的产品、协议、框架与工程陈述均重新回到本台账所列公开一手来源独立核验。

Private development inputs are excluded from public and commit-ready artifacts. 本台账不保留这些输入的文件名、工作站位置、内容指纹、时间戳、大小、内部清单、成员路径、成员数量、覆盖比例或归档核验明细。私有媒体、文字、截图、聊天记录和近似视觉重构均不再分发。这个不可识别边界也不证明作者权、许可、事实正确性或再发布授权；若未来需要公开任何相关表达，必须另行取得明确权利并从公开来源重建证据。

## 3. Course 15 v1.1.1 canonical release contract

本节及其后各节是直接从 `lib/agent-orchestration/sources.ts` 的 `AGENT_ORCHESTRATION_SOURCES` 与 `lib/agent-orchestration/manifest.ts` 的 `AGENT_ORCHESTRATION_COURSE_MANIFEST` 导出并规范化的发布快照。每个 canonical source record 同时保存可支持的英文 claim、不可外推的英文 boundary，以及两者的简体中文对应文本；这些四字段共同构成课程的 claim contract。`url` 永远是直接 claim evidence；规范化导出中的 `claimEvidenceUrls` 至少包含 `url`。未显式列出该字段时，其确定性默认值就是 `[url]`。如果某个 GitHub release/tag 只负责锁定版本，则另存为 `versionAnchorUrl`，不得据此外推完整功能。

- courseId=agent-orchestration
- version=1.1.1
- displayNumber=15
- publishedOn=2026-08-23
- defaultContentLocale=en
- phases=4
- modules=15
- canonicalSources=67
- manifestCoverage=67/67
- Canonical ID policy: 本快照只使用最终 source IDs；旧 OAI-/ANT-/CLA-/MCP-/REL-/OBS-/OPS-/GIT-/RIGHTS- 编号不再作为发布键。

## 4. Exact transformation profiles

`transformation=Tn` 是 transformation 字符串的无损短码。T1–T4 与 T6 逐字对应 `sources.ts` 的五种公开来源输出；T5 只记录私有开发输入的处理原则，不对应任何公开 canonical source record。逐条公开 ledger 只引用 T1–T4 或 T6。

| Code | Exact exported transformation |
|---|---|
| T1 | The supported claim was paraphrased within its stated boundary and linked to the source; no source layout, long-form prose, code, or media was copied. |
| T2 | Version-bounded normative facts were extracted and paraphrased with a direct link; no specification prose, schema, code, or media was copied. |
| T3 | Only a release-, commit-, or lifecycle-bounded claim was paraphrased; no repository code, prose, screenshot, or diagram was copied. |
| T4 | The record is used only as a bounded failure case; no issue prose or media was copied and no present-tense defect is inferred. |
| T5 | Private material supplied research questions only; public claims were reverified against primary sources and no uploaded media or prose was copied. |
| T6 | The release tag was retained only as a version anchor while behavior claims were paraphrased from separately linked current official documentation; no repository code, prose, screenshot, or diagram was copied. |

### 4.1 Version anchors versus claim evidence

下表是 release/tag 高风险记录的来源比较矩阵。`versionAnchorUrl` 只回答“哪个版本/commit”；`claimEvidenceUrls` 才回答“哪些一手页面支持 Supports 文本”。同一 release notes 只有在其正文确实列出相应行为时，才会同时出现在 claim evidence 集合中。

| canonical source ID | Primary claim evidence | Additional claim evidence | Version anchor | Audit decision |
|---|---|---|---|---|
| openai-agents-python-v022 | https://github.com/openai/openai-agents-python/blob/v0.22.0/README.md | https://github.com/openai/openai-agents-python/releases/tag/v0.22.0 | https://github.com/openai/openai-agents-python/releases/tag/v0.22.0 | Release notes explicitly list the bounded replay/state/guardrail/generated-graph changes; no whole-SDK inference |
| mcp-python-sdk-v2 | https://github.com/modelcontextprotocol/python-sdk/blob/6f69a3758ebf2ee55ce050f58b470ce11af71133/README.md | https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.0.0 | https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.0.0 | Release notes explicitly identify 2026-07-28 support and legacy-version serving; removed unsupported “minimum exercises” claim |
| anthropic-agent-sdk-v02143 | https://github.com/anthropics/claude-agent-sdk-python/blob/22795fe604a0682fc6c57d8ba998ebb50621446d/README.md | — | https://github.com/anthropics/claude-agent-sdk-python/releases/tag/v0.2.143 | Claim narrowed to behavior visible in the pinned README; checkpoint/telemetry claims remain with separate official docs |
| microsoft-agent-framework | https://github.com/microsoft/agent-framework/blob/7a2b8038cc7809714308152782e58d4943720f61/README.md | https://github.com/microsoft/agent-framework/releases/tag/python-1.15.0 | https://github.com/microsoft/agent-framework/releases/tag/python-1.15.0 | Pinned README supports workflow pattern breadth; release notes separately support the named A2A-input and MCP filtering/shadowing changes |
| langgraph-v1211 | https://github.com/langchain-ai/langgraph/blob/644815f9e5bc52ad8f7a5227a456227e9c3e639b/README.md | — | https://github.com/langchain-ai/langgraph/releases/tag/1.2.11 | Claim narrowed to stateful runtime, durable execution, HITL and memory stated by the pinned README |
| google-adk-v271 | https://github.com/google/adk-docs/blob/main/docs/workflows/index.md | https://github.com/google/adk-docs/blob/main/docs/workflows/collaboration.md; https://github.com/google/adk-docs/blob/main/docs/sessions/state.md | https://github.com/google/adk-python/releases/tag/v2.7.1 | v2.7.1 tag proves version only; rolling official docs support the broader workflow claim and force current-documentation stability |
| mcp-ts-migration-2026 | https://github.com/modelcontextprotocol/typescript-sdk/blob/3e90449fd52997da43b79a536d2c19c446603cc7/docs/migration/support-2026-07-28.md | — | https://github.com/modelcontextprotocol/typescript-sdk/commit/3e90449fd52997da43b79a536d2c19c446603cc7 | Immutable SDK documentation commit supports the migration claim; the protocol date alone is not treated as a document revision |

## 5. Canonical module snapshot

### 5.1 Phases

| phaseOrder | phaseId | moduleOrders/slugs |
|---:|---|---|
| 1 | frame | 1:workflow-agent-boundary, 2:task-graphs-contracts, 3:chaining-routing, 4:parallel-fanout-fanin |
| 2 | compose | 5:manager-roles-ownership, 6:delegation-handoffs, 7:orchestrator-workers-verification, 8:tools-aci-mcp |
| 3 | control | 9:context-state-memory, 10:budgets-concurrency-stopping, 11:reliability-recovery, 12:security-authority-human-control |
| 4 | operate | 13:tracing-observability-economics, 14:evaluation-regression-evolution, 15:production-orchestration-capstone |

### 5.2 Modules and exact source assignments

| order | slug | phaseId | minutes | labId | sourceIds in manifest order |
|---:|---|---|---:|---|---|
| 1 | workflow-agent-boundary | frame | 55 | pattern-selector | openai-building-agents, openai-practical-guide, anthropic-effective-agents |
| 2 | task-graphs-contracts | frame | 65 | graph-contract | openai-sdk-orchestration, anthropic-effective-agents, microsoft-agent-framework |
| 3 | chaining-routing | frame | 60 | pattern-selector | anthropic-effective-agents, openai-sdk-orchestration, openai-structured-outputs, claude-academy-api |
| 4 | parallel-fanout-fanin | frame | 70 | graph-contract | anthropic-effective-agents, openai-sdk-orchestration, openai-function-calling, openai-responses-multi-agent, openai-codex-subagents, openai-codex-sandbox-security, openai-agents-python-patterns, oracle-critical-path, etcd-quorum-glossary |
| 5 | manager-roles-ownership | compose | 65 | handoff-contract | openai-agents-orchestration, openai-practical-guide, anthropic-research-system |
| 6 | delegation-handoffs | compose | 70 | handoff-contract | openai-agents-orchestration, openai-results-state, claude-academy-subagents, claude-sdk-subagents |
| 7 | orchestrator-workers-verification | compose | 75 | graph-contract | anthropic-effective-agents, anthropic-research-system, openai-sdk-orchestration, openai-agents-python-patterns, claude-cookbooks-patterns, anthropic-harness-long-running |
| 8 | tools-aci-mcp | compose | 70 | handoff-contract | openai-tools, openai-function-calling, openai-mcp-connectors, anthropic-writing-tools, anthropic-effective-agents, mcp-spec-2026, mcp-changelog-2026, mcp-versioning-2026, mcp-python-sdk-v2, claude-academy-mcp-legacy, mcp-ts-migration-2026 |
| 9 | context-state-memory | control | 75 | context-recovery | openai-context-management, openai-running-agents, openai-results-state, openai-compaction, anthropic-context-engineering, anthropic-managed-agents, azure-cosmos-distributed-lock |
| 10 | budgets-concurrency-stopping | control | 65 | context-recovery | openai-sdk-orchestration, openai-responses-multi-agent, openai-codex-subagents, openai-codex-sandbox-security, openai-latency, openai-cost, claude-sdk-agent-loop, anthropic-research-system |
| 11 | reliability-recovery | control | 80 | context-recovery | openai-model-retries, openai-webhooks, openai-background, openai-running-agents, claude-sdk-checkpointing, anthropic-managed-agents, github-aws-return-path-issue, aws-idempotent-apis, aws-backoff-jitter, azure-retry-storm, azure-compensating-transactions, azure-cosmos-distributed-lock |
| 12 | security-authority-human-control | control | 80 | governance-trace | openai-guardrails-approvals, openai-sdk-hitl, openai-safety, openai-mcp-connectors, claude-sdk-permissions, claude-secure-deployment |
| 13 | tracing-observability-economics | operate | 65 | governance-trace | openai-observability, openai-tracing, openai-latency, openai-cost, google-sre-error-budget, claude-sdk-observability, anthropic-research-system, otel-overview, otel-baggage-security |
| 14 | evaluation-regression-evolution | operate | 75 | governance-trace | openai-agent-evals, anthropic-agent-evals, openai-agents-python-v022, openai-swarm-lifecycle, anthropic-agent-sdk-v02143, langgraph-v1211, microsoft-agent-framework, autogen-maintenance |
| 15 | production-orchestration-capstone | operate | 90 | production-readiness | openai-background, openai-webhooks, openai-running-agents, anthropic-managed-agents, microsoft-agent-framework, google-adk-v271 |

## 6. Canonical source and claim ledger — 67 records

下列 title、publisher、URL、metadata、英文 Supports/Boundary 与简体中文字段均来自最终导出。`modules=` 使用稳定的 `order:slug` 格式并按 manifest order 排列。

### 6.1 `openai-building-agents`

- id=openai-building-agents; modules=1:workflow-agent-boundary; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Building agents
- publisher=OpenAI
- url=https://developers.openai.com/tracks/building-agents
- kind=openai-official
- accessedOn=2026-08-23

Supports: The current OpenAI distinction between ordinary model use, agent loops, orchestration, tools, state, guardrails, and evaluation.

Boundary: The page is a current product track without a public revision date; API names and recommended models must be rechecked before deployment.

supportsZhHans: 当前 OpenAI 对常规模型调用、智能体循环、编排、工具、状态、护栏与评估的区分。

boundaryZhHans: 该页面是未提供公开修订日期的当前产品学习路径；部署前必须重新核对 API 名称与推荐模型。

### 6.2 `openai-practical-guide`

- id=openai-practical-guide; modules=1:workflow-agent-boundary, 5:manager-roles-ownership; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=A practical guide to building agents
- publisher=OpenAI
- url=https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- kind=openai-official
- accessedOn=2026-08-23

Supports: The single-agent loop, manager pattern, decentralized handoff pattern, and layered guardrail design.

Boundary: This is a conceptual business guide, not a wire protocol, runtime trace, or guarantee that every OpenAI product uses one topology.

supportsZhHans: 单智能体循环、管理者模式、去中心化移交模式与分层护栏设计。

boundaryZhHans: 这是概念性的业务指南，不是线协议或运行时追踪，也不保证每种 OpenAI 产品都采用同一种拓扑。

### 6.3 `openai-sdk-orchestration`

- id=openai-sdk-orchestration; modules=2:task-graphs-contracts, 3:chaining-routing, 4:parallel-fanout-fanin, 7:orchestrator-workers-verification, 10:budgets-concurrency-stopping; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Agent orchestration
- publisher=OpenAI Agents SDK
- url=https://openai.github.io/openai-agents-python/multi_agent/
- kind=openai-official
- accessedOn=2026-08-23

Supports: LLM-directed and code-directed orchestration, structured routing, sequential chains, evaluator loops, and application-level parallel runs.

Boundary: The SDK is one implementation surface; examples and main-branch documentation may move ahead of a released package.

supportsZhHans: 由 LLM 驱动和代码驱动的编排、结构化路由、顺序链、评估器循环，以及应用层并行运行。

boundaryZhHans: 该 SDK 只是一个实现界面；示例和 main 分支文档可能领先于已发布的软件包。

### 6.4 `openai-agents-orchestration`

- id=openai-agents-orchestration; modules=5:manager-roles-ownership, 6:delegation-handoffs; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Orchestration and handoffs
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/agents/orchestration
- kind=openai-official
- accessedOn=2026-08-23

Supports: The ownership difference between manager-style agents-as-tools and handoffs where a specialist takes control.

Boundary: The examples describe current OpenAI SDK semantics, not a universal definition implemented identically by every framework.

supportsZhHans: 管理者式 agents-as-tools 与移交后由专家接管之间的所有权差异。

boundaryZhHans: 这些示例描述的是当前 OpenAI SDK 语义，不是所有框架都会以相同方式实现的通用定义。

### 6.5 `openai-structured-outputs`

- id=openai-structured-outputs; modules=3:chaining-routing; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Structured model outputs
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/structured-outputs
- kind=openai-official
- accessedOn=2026-08-23

Supports: Strict response contracts, the difference between structured response formats and function calling, and refusal or incomplete states.

Boundary: Schema conformance establishes shape, not truth, authorization, calibration, or safety of the proposed action.

supportsZhHans: 严格响应契约、结构化响应格式与函数调用的区别，以及拒绝或未完成状态。

boundaryZhHans: 符合 schema 只能证明结构正确，不能证明内容真实、操作已获授权、判断经过校准，或拟议操作安全。

### 6.6 `openai-function-calling`

- id=openai-function-calling; modules=4:parallel-fanout-fanin, 8:tools-aci-mcp; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Function calling
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/function-calling
- kind=openai-official
- accessedOn=2026-08-23

Supports: The model-tool-result loop, strict function schemas, call identity, and provider-side parallel tool calls.

Boundary: Producing several tool calls in one model turn is not the same control plane as running several complete agents concurrently.

supportsZhHans: 模型—工具—结果循环、严格函数 schema、调用标识，以及提供方侧的并行工具调用。

boundaryZhHans: 模型在一次 turn 中生成多个工具调用，并不等同于用一个控制平面并发运行多个完整智能体。

### 6.7 `openai-responses-multi-agent`

- id=openai-responses-multi-agent; modules=4:parallel-fanout-fanin, 10:budgets-concurrency-stopping; layer=product-documentation; stability=beta; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Multi-agent
- publisher=OpenAI Responses API
- url=https://developers.openai.com/api/docs/guides/responses-multi-agent
- kind=openai-official
- accessedOn=2026-08-23

Supports: Hosted root and subagent execution, nested task paths, HTTP and WebSocket coordination, concurrency controls, and current limitations.

Boundary: This capability is Beta, model-limited, token-intensive, and schema-sensitive; it is a frontier case rather than the course's stable foundation.

supportsZhHans: 托管式 root Agent 与 subagent 执行、嵌套任务路径、HTTP 与 WebSocket 协调、并发控制及当前限制。

boundaryZhHans: Responses Multi-agent 仍处于 Beta，受模型限制、消耗较多 token 且对 schema 敏感；它是前沿案例，而不是本课程的稳定基础。

### 6.8 `openai-codex-subagents`

- id=openai-codex-subagents; modules=4:parallel-fanout-fanin, 10:budgets-concurrency-stopping; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Subagents
- publisher=OpenAI Codex
- url=https://learn.chatgpt.com/docs/agent-configuration/subagents
- kind=openai-official
- accessedOn=2026-08-23

Supports: Current Codex subagent availability, spawned-thread controls, context return, shared-write guidance, sandbox inheritance, and the agents.max_concurrent_threads_per_session field.

Boundary: This is a Codex client/runtime surface, not Responses Multi-agent; the page does not promise a numeric default for an unset thread cap or a no-fixed-depth rule.

supportsZhHans: 当前 Codex subagent 的可用性、派生任务线程控制、上下文回传、共享写入指引、sandbox 继承，以及 agents.max_concurrent_threads_per_session 字段。

boundaryZhHans: 这是 Codex 客户端与运行时界面，不是 Responses Multi-agent；该页面没有承诺未设置线程上限时的数值默认值，也没有承诺不存在固定深度限制。

### 6.9 `openai-codex-sandbox-security`

- id=openai-codex-sandbox-security; modules=4:parallel-fanout-fanin, 10:budgets-concurrency-stopping; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Agent approvals & security
- publisher=OpenAI Codex
- url=https://learn.chatgpt.com/docs/agent-approvals-security
- kind=openai-official
- accessedOn=2026-08-23

Supports: The distinction between OS-enforced sandbox boundaries, approval policy, network controls, protected paths, and runtime-specific defaults in Codex.

Boundary: Approval is a decision gate, not containment: depending on runtime and configuration, an approved action may execute outside the ordinary sandbox or with network access. Approval does not prove correctness or make the widened blast radius safe. Command-network policy still does not govern every web, app, MCP, browser, or hosted connection surface.

supportsZhHans: Codex 中由操作系统强制执行的 sandbox 边界、审批策略、网络控制、受保护路径与运行时特定默认值之间的区别。

boundaryZhHans: 审批是决策门而非隔离边界：依据运行时与配置，获批动作可能在普通 sandbox 之外执行或获得网络访问。审批不能证明正确性，也不能让扩大的影响面自动安全；命令网络策略仍不管辖所有 Web、app、MCP、browser 或托管连接界面。

### 6.10 `openai-agents-python-patterns`

- id=openai-agents-python-patterns; modules=4:parallel-fanout-fanin, 7:orchestrator-workers-verification; layer=repository-evidence; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T3
- title=Agent patterns examples
- publisher=OpenAI
- url=https://github.com/openai/openai-agents-python/tree/v0.22.0/examples/agent_patterns
- kind=official-github
- accessedOn=2026-08-23; revision=v0.22.0
- license=MIT

Supports: Runnable official examples for deterministic flows, routing, agents-as-tools, judge loops, parallelization, guardrails, and human review.

Boundary: Examples demonstrate SDK patterns, not production guarantees; integrations, error handling, and model availability still require local verification.

supportsZhHans: 可运行的官方示例，覆盖代码主导流程、路由、agents-as-tools、judge 循环、并行化、护栏和人工审查。

boundaryZhHans: 这些示例演示的是 SDK 模式，而非生产保证；集成、错误处理与模型可用性仍需在本地验证。

### 6.11 `openai-results-state`

- id=openai-results-state; modules=6:delegation-handoffs, 9:context-state-memory; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Results and state
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/agents/results
- kind=openai-official
- accessedOn=2026-08-23

Supports: Final output, history, last-agent ownership, interruptions, and resumable run state.

Boundary: A run result can represent an interruption rather than completion; applications must not treat every returned object as a successful answer.

supportsZhHans: 最终输出、历史记录、last-agent 所有权、中断，以及可恢复的 run state。

boundaryZhHans: run result 可能表示中断而非完成；应用不得把每一个返回对象都视为成功答案。

### 6.12 `openai-tools`

- id=openai-tools; modules=8:tools-aci-mcp; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Tools
- publisher=OpenAI Agents SDK
- url=https://openai.github.io/openai-agents-python/tools/
- kind=openai-official
- accessedOn=2026-08-23

Supports: Hosted, local, function, MCP, agent-as-tool, tool-search, and programmatic-tool execution surfaces.

Boundary: Some tools are experimental or model-specific; an available tool is not automatically authorized for every agent or user.

supportsZhHans: 托管、本地、function、MCP、agent-as-tool、tool-search 与 programmatic-tool 执行界面。

boundaryZhHans: 部分工具仍属实验性或仅适用于特定模型；工具可用并不意味着每个智能体或用户都已获权使用。

### 6.13 `openai-mcp-connectors`

- id=openai-mcp-connectors; modules=8:tools-aci-mcp, 12:security-authority-human-control; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=MCP and connectors
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/tools-connectors-mcp
- kind=openai-official
- accessedOn=2026-08-23

Supports: Remote MCP connection, approvals, allowed-tool boundaries, and the prompt-injection and data-sharing threat model.

Boundary: Third-party MCP servers are external systems whose behavior, retention, and security OpenAI does not verify for the application.

supportsZhHans: 远程 MCP 连接、审批、允许工具边界，以及提示注入与数据共享威胁模型。

boundaryZhHans: 第三方 MCP server 是外部系统；OpenAI 不会替应用验证其行为、数据保留方式或安全性。

### 6.14 `openai-context-management`

- id=openai-context-management; modules=9:context-state-memory; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Context management
- publisher=OpenAI Agents SDK
- url=https://openai.github.io/openai-agents-python/context/
- kind=openai-official
- accessedOn=2026-08-23

Supports: The distinction between application-local run context and model-visible conversational context.

Boundary: Objects placed in application context are not automatically model memory, and secrets can still leak if a tool or prompt serializes them.

supportsZhHans: 应用本地 run context 与模型可见 conversational context 之间的区别。

boundaryZhHans: 放入应用 context 的对象不会自动成为模型记忆；如果工具或 prompt 将秘密序列化，秘密仍可能泄露。

### 6.15 `openai-running-agents`

- id=openai-running-agents; modules=9:context-state-memory, 11:reliability-recovery, 15:production-orchestration-capstone; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Running agents
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/agents/running-agents
- kind=openai-official
- accessedOn=2026-08-23

Supports: Agent-loop execution and the application-history, session, conversation ID, and previous-response continuation strategies.

Boundary: Mixing several continuation strategies can duplicate context; durable business execution still requires an application-owned state model.

supportsZhHans: 智能体循环执行，以及通过应用历史、session、conversation ID 与 previous response 进行续接的策略。

boundaryZhHans: 混用多种续接策略可能重复上下文；持久化业务执行仍需要由应用拥有的状态模型。

### 6.16 `openai-compaction`

- id=openai-compaction; modules=9:context-state-memory; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Compaction
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/compaction
- kind=openai-official
- accessedOn=2026-08-23

Supports: Server-side and standalone compaction for balancing long-context quality, latency, and cost.

Boundary: Compacted state is not a human-readable audit record and must not replace explicit task state, evidence, or durable artifacts.

supportsZhHans: 服务器端与独立 compaction，用于平衡长上下文质量、延迟与成本。

boundaryZhHans: 压缩后的状态不是人类可读的审计记录，不能替代显式任务状态、证据或持久化产物。

### 6.17 `openai-model-retries`

- id=openai-model-retries; modules=11:reliability-recovery; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Models: timeouts and retries
- publisher=OpenAI Agents SDK
- url=https://openai.github.io/openai-agents-js/guides/models/
- kind=openai-official
- accessedOn=2026-08-23

Supports: Opt-in model retry policies, per-attempt timeouts, backoff, abort behavior, and replay-safety limits.

Boundary: The API is SDK-version sensitive; retries cannot make external side effects exactly-once and unsafe streamed or stateful work should fail closed.

supportsZhHans: 可选启用的模型重试策略、每次尝试的 timeout、backoff、abort 行为与 replay-safety 限制。

boundaryZhHans: 该 API 对 SDK 版本敏感；重试不能让外部副作用获得 exactly-once 语义，对不安全的流式或有状态工作应采用失败关闭。

### 6.18 `openai-webhooks`

- id=openai-webhooks; modules=11:reliability-recovery, 15:production-orchestration-capstone; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Webhooks
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/webhooks
- kind=openai-official
- accessedOn=2026-08-23

Supports: Signature verification, fast acknowledgement, possible duplicate delivery, retry timing, and webhook-id deduplication.

Boundary: Webhook consumers must tolerate repeated delivery, but finite retries do not guarantee eventual delivery; receiving a repeated event does not authorize repeating a business side effect.

supportsZhHans: 签名验证、快速确认、可能的重复投递、重试时序，以及基于 webhook ID 的去重。

boundaryZhHans: Webhook 消费者必须容忍重复投递，但有限重试并不保证最终一定送达；收到重复事件也不授权应用重复执行业务副作用。

### 6.19 `openai-background`

- id=openai-background; modules=11:reliability-recovery, 15:production-orchestration-capstone; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Background mode
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/background
- kind=openai-official
- accessedOn=2026-08-23

Supports: Asynchronous long model responses, polling, cancellation, stream resumption, and current storage constraints.

Boundary: Background mode manages one asynchronous response within its documented polling, storage, and retention constraints; it is not a complete multi-step workflow engine, transaction log, or compensation system.

supportsZhHans: 异步长时模型响应、轮询、取消、流式续传，以及当前存储约束。

boundaryZhHans: Background mode 只在文档所述轮询、存储与保留约束内管理单个异步 response；它不是完整的多步骤工作流引擎、事务日志或补偿系统。

### 6.20 `openai-guardrails-approvals`

- id=openai-guardrails-approvals; modules=12:security-authority-human-control; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Guardrails and human review
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- kind=openai-official
- accessedOn=2026-08-23

Supports: Input, output, and tool guardrails; blocking versus parallel checks; and approval at an execution boundary.

Boundary: Guardrail coverage is scoped and does not automatically propagate across every handoff, hosted tool, or side effect.

supportsZhHans: 输入、输出与工具护栏；阻塞式与并行检查；以及在执行边界进行审批。

boundaryZhHans: 护栏的覆盖范围有限，不会自动传播到每一次移交、托管工具调用或副作用。

### 6.21 `openai-sdk-hitl`

- id=openai-sdk-hitl; modules=12:security-authority-human-control; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Human-in-the-loop
- publisher=OpenAI Agents SDK
- url=https://openai.github.io/openai-agents-python/human_in_the_loop/
- kind=openai-official
- accessedOn=2026-08-23

Supports: Interruptions, approve or reject decisions, serialized run state, and resumption of the same run.

Boundary: Approval permits an action; it does not prove the action is correct, and serialized state can contain sensitive application context.

supportsZhHans: 中断、批准或拒绝决策、序列化 run state，以及同一 run 的恢复。

boundaryZhHans: 批准只代表允许执行某项操作，不能证明操作正确；序列化状态也可能包含敏感的应用 context。

### 6.22 `openai-safety`

- id=openai-safety; modules=12:security-authority-human-control; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Safety best practices
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/safety-best-practices
- kind=openai-official
- accessedOn=2026-08-23

Supports: Moderation, red teaming, human oversight, input and output constraints, user communication, and safety identifiers.

Boundary: General safety guidance must be extended with a system-specific threat model, authorization checks, isolation, incident response, and domain review.

supportsZhHans: 内容审核、红队测试、人类监督、输入与输出约束、用户沟通，以及安全标识符。

boundaryZhHans: 通用安全指引必须结合具体系统的威胁模型、授权检查、隔离、事件响应和领域审查进行扩展。

### 6.23 `openai-observability`

- id=openai-observability; modules=13:tracing-observability-economics; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Integrations and observability
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/agents/integrations-observability
- kind=openai-official
- accessedOn=2026-08-23

Supports: Workflow, model, tool, handoff, guardrail, and custom tracing spans across agent runs.

Boundary: A trace is evidence about execution, not an evaluation verdict; production observability also needs outcomes, errors, privacy controls, and service metrics.

supportsZhHans: 跨智能体 run 的工作流、模型、工具、移交、护栏与自定义 tracing span。

boundaryZhHans: trace 是执行证据，不是评估结论；生产可观测性还需要结果、错误、隐私控制与服务指标。

### 6.24 `openai-tracing`

- id=openai-tracing; modules=13:tracing-observability-economics; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Tracing
- publisher=OpenAI Agents SDK
- url=https://openai.github.io/openai-agents-python/tracing/
- kind=openai-official
- accessedOn=2026-08-23

Supports: Tracing configuration, sensitive-data capture controls, custom processors, and zero-data-retention limitations.

Boundary: Trace payloads can themselves expose prompts, arguments, and results; collection requires minimization, redaction, retention, and access policy.

supportsZhHans: Tracing 配置、敏感数据采集控制、自定义 processor，以及 Zero Data Retention 的限制。

boundaryZhHans: Trace payload 本身可能暴露 prompt、参数与结果；采集时需要最小化、脱敏、保留期限与访问策略。

### 6.25 `openai-latency`

- id=openai-latency; modules=10:budgets-concurrency-stopping, 13:tracing-observability-economics; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Latency optimization
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/latency-optimization
- kind=openai-official
- accessedOn=2026-08-23

Supports: Reducing tokens and requests, parallelizing independent work, and avoiding unnecessary model calls.

Boundary: Parallelism reduces wall-clock time only for suitable independent work and can increase total tokens, complexity, and tail latency.

supportsZhHans: 减少 token 与请求、并行处理相互独立的工作，以及避免不必要的模型调用。

boundaryZhHans: 并行化只会缩短适合独立执行任务的墙钟时间，同时可能增加总 token、复杂度与尾延迟。

### 6.26 `openai-cost`

- id=openai-cost; modules=10:budgets-concurrency-stopping, 13:tracing-observability-economics; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Cost optimization
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/cost-optimization
- kind=openai-official
- accessedOn=2026-08-23

Supports: Reducing requests and tokens and selecting the smallest model that meets an evaluated quality threshold.

Boundary: Cost optimization cannot be separated from task-success, safety, and latency measurement; a cheaper failed run is not an improvement.

supportsZhHans: 减少请求与 token，并选择能够达到经评估质量阈值的最小模型。

boundaryZhHans: 成本优化不能脱离任务成功率、安全性与延迟测量；更便宜但失败的 run 并不是改进。

### 6.27 `openai-agent-evals`

- id=openai-agent-evals; modules=14:evaluation-regression-evolution; layer=product-documentation; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Evaluate agent workflows
- publisher=OpenAI
- url=https://developers.openai.com/api/docs/guides/agent-evals
- kind=openai-official
- accessedOn=2026-08-23

Supports: Trace grading, tool and handoff evaluation, datasets, repeatable eval runs, and workflow-level regression testing.

Boundary: An evaluator is another measurement instrument; graders need calibration, multiple trials, and end-state checks rather than blind trust.

supportsZhHans: Trace grading、工具与移交评估、数据集、可重复的 eval run，以及工作流级回归测试。

boundaryZhHans: 评估器本身也是一种测量工具；grader 需要校准、多次试验与最终状态检查，不能被盲目信任。

### 6.28 `openai-agents-python-v022`

- id=openai-agents-python-v022; modules=14:evaluation-regression-evolution; layer=repository-evidence; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T3
- title=OpenAI Agents Python v0.22.0
- publisher=OpenAI
- url=https://github.com/openai/openai-agents-python/blob/v0.22.0/README.md
- versionAnchorUrl=https://github.com/openai/openai-agents-python/releases/tag/v0.22.0
- claimEvidenceUrls=https://github.com/openai/openai-agents-python/blob/v0.22.0/README.md | https://github.com/openai/openai-agents-python/releases/tag/v0.22.0
- kind=official-github
- accessedOn=2026-08-23; revision=v0.22.0
- license=MIT

Supports: The pinned README identifies the official Python Agents SDK surface, while the v0.22.0 release notes directly substantiate replay-state redaction, isolated RunState checkpoint usage, output-guardrail hardening, and handoff expansion in generated graphs.

Boundary: The release notes support only their listed v0.22.0 changes, not every SDK behavior; the rolling main branch can be ahead of the tag and projects must test their exact dependency lock.

supportsZhHans: 固定版本 README 标识官方 Python Agents SDK 界面；v0.22.0 release notes 则直接支持 replay state 脱敏、RunState checkpoint 用量隔离、输出 guardrail 加固，以及生成图中的 handoff 扩展。

boundaryZhHans: Release notes 只支持其中明确列出的 v0.22.0 变更，并不证明 SDK 的全部行为；滚动 main 可能领先于 tag，项目仍须测试实际 dependency lock。

### 6.29 `openai-swarm-lifecycle`

- id=openai-swarm-lifecycle; modules=14:evaluation-regression-evolution; layer=repository-evidence; stability=historical; reuseStatus=license-noted-no-copy; transformation=T3
- title=Swarm (experimental, educational)
- publisher=OpenAI
- url=https://github.com/openai/swarm/blob/main/README.md
- kind=official-github
- accessedOn=2026-08-23
- license=MIT

Supports: OpenAI's official lifecycle notice that experimental Swarm has been replaced by the production-ready Agents SDK and that production users should migrate to the Agents SDK.

Boundary: The rolling README is lifecycle evidence, not a pinned implementation contract; it does not require an immediate rewrite without application-specific migration and regression tests.

supportsZhHans: OpenAI 的官方生命周期说明：实验性 Swarm 已由面向生产的 Agents SDK 取代，生产用户应迁移到 Agents SDK。

boundaryZhHans: 滚动更新的 README 只能作为生命周期证据，不是版本锁定的实现契约；在完成应用特定的迁移与回归测试前，它也不要求立即重写现有系统。

### 6.30 `anthropic-effective-agents`

- id=anthropic-effective-agents; modules=1:workflow-agent-boundary, 2:task-graphs-contracts, 3:chaining-routing, 4:parallel-fanout-fanin, 7:orchestrator-workers-verification, 8:tools-aci-mcp; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Building effective agents
- publisher=Anthropic
- url=https://www.anthropic.com/engineering/building-effective-agents
- kind=anthropic-official
- accessedOn=2026-08-23; publishedOn=2024-12-19

Supports: Workflow versus agent boundaries, augmented LLMs, chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, autonomous loops, and Anthropic's agent-computer interface (ACI) term with its HCI-style tool-documentation and testing guidance.

Boundary: These are stable architecture patterns, not current tooling guidance, a specification of Claude Code internals, or proof that more autonomy is better; Anthropic explicitly notes that much of the tooling landscape described has changed since December 2024.

supportsZhHans: 工作流与智能体边界、增强型 LLM、链式处理、路由、并行化、orchestrator-workers、evaluator-optimizer、自主循环，以及 Anthropic 对智能体—计算机接口（ACI）的命名和类 HCI 的工具文档与测试建议。

boundaryZhHans: 这些是稳定的架构模式，不是当前工具选型指南或 Claude Code 内部实现规范，也不能证明自主性更高一定更好；Anthropic 已明确注明，文中许多工具生态信息自 2024 年 12 月后已有变化。

### 6.31 `claude-academy-api`

- id=claude-academy-api; modules=3:chaining-routing; layer=engineering-guidance; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Building with the Claude API
- publisher=Claude Academy
- url=https://academy.claude.com/courses/building-with-the-claude-api
- kind=claude-academy
- accessedOn=2026-08-23

Supports: Anthropic's official learning sequence for APIs, tool use, evaluation, RAG, MCP, agents, chaining, routing, and parallelization.

Boundary: Academy text, quizzes, screenshots, and video remain Anthropic content; this course links and paraphrases rather than redistributing them.

supportsZhHans: Anthropic 关于 API、工具使用、评估、RAG、MCP、智能体、链式处理、路由与并行化的官方学习序列。

boundaryZhHans: Academy 的文字、测验、截图与视频仍是 Anthropic 内容；本课程只提供链接与释义，不重新分发这些材料。

### 6.32 `anthropic-research-system`

- id=anthropic-research-system; modules=5:manager-roles-ownership, 7:orchestrator-workers-verification, 10:budgets-concurrency-stopping, 13:tracing-observability-economics; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=How we built our multi-agent research system
- publisher=Anthropic
- url=https://www.anthropic.com/engineering/multi-agent-research-system
- kind=anthropic-official
- accessedOn=2026-08-23; publishedOn=2025-06-13

Supports: Lead-researcher and parallel-subagent architecture, context isolation, dynamic decomposition, citation work, coordination failures, and token economics.

Boundary: Reported quality and token multipliers are internal research-system results, not universal performance constants for other models or tasks.

supportsZhHans: lead researcher 与并行 subagent 架构、上下文隔离、动态任务分解、引用工作、协调失败与 token 经济性。

boundaryZhHans: 文中质量与 token 倍数来自 Anthropic 内部研究系统，不是适用于其他模型或任务的通用性能常数。

### 6.33 `claude-academy-subagents`

- id=claude-academy-subagents; modules=6:delegation-handoffs; layer=engineering-guidance; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Introduction to subagents
- publisher=Claude Academy
- url=https://academy.claude.com/courses/introduction-to-subagents
- kind=claude-academy
- accessedOn=2026-08-23

Supports: Separate subagent context, scoped instructions and tools, structured return formats, obstacle reporting, and selection boundaries.

Boundary: A subagent summary is a lossy communication channel; evidence and unresolved uncertainty need explicit fields or durable artifacts.

supportsZhHans: 独立的 subagent context、限定范围的指令与工具、结构化返回格式、障碍报告与选择边界。

boundaryZhHans: Subagent 摘要是一条有损通信通道；证据与尚未解决的不确定性需要显式字段或持久化产物。

### 6.34 `claude-sdk-subagents`

- id=claude-sdk-subagents; modules=6:delegation-handoffs; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Subagents
- publisher=Claude Agent SDK
- url=https://code.claude.com/docs/en/agent-sdk/subagents
- kind=anthropic-official
- accessedOn=2026-08-23

Supports: Current Claude Agent SDK subagent isolation, specialized prompts, restricted tools, parallel work, and parent-result return behavior.

Boundary: The semantics belong to the Claude Agent SDK and can change with the runtime; they are not a cross-framework protocol.

supportsZhHans: 当前 Claude Agent SDK 的 subagent 隔离、专用 prompt、受限工具、并行工作，以及向 parent 返回结果的行为。

boundaryZhHans: 这些语义属于 Claude Agent SDK，并可能随运行时变化；它们不是跨框架协议。

### 6.35 `anthropic-writing-tools`

- id=anthropic-writing-tools; modules=8:tools-aci-mcp; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Writing effective tools for agents — with agents
- publisher=Anthropic
- url=https://www.anthropic.com/engineering/writing-tools-for-agents
- kind=anthropic-official
- accessedOn=2026-08-23; publishedOn=2025-09-11

Supports: Tool interfaces as agent-computer contracts, clear namespaces and schemas, actionable errors, compact results, and eval-driven refinement.

Boundary: A well-described tool improves model use but does not supply authorization, isolation, transactionality, or a trustworthy external system.

supportsZhHans: 将工具界面视为智能体—计算机契约、清晰的 namespace 与 schema、可操作的错误信息、紧凑结果，以及由 eval 驱动的改进。

boundaryZhHans: 描述良好的工具有助于模型正确使用，但不能提供授权、隔离、事务性，也不能保证外部系统可信。

### 6.36 `mcp-spec-2026`

- id=mcp-spec-2026; modules=8:tools-aci-mcp; layer=normative-standard; stability=version-pinned; reuseStatus=link-and-paraphrase-only; transformation=T2
- title=Model Context Protocol specification 2026-07-28
- publisher=Model Context Protocol
- url=https://modelcontextprotocol.io/specification/2026-07-28
- kind=open-standard
- accessedOn=2026-08-23; publishedOn=2026-07-28; revision=2026-07-28

Supports: The current stateless core, self-contained requests, per-request capabilities, tools, resources, prompts, elicitation, and extension model.

Boundary: MCP standardizes capability exchange; it does not provide task decomposition, an agent loop, memory, approvals, sandboxing, or an eval harness by itself.

supportsZhHans: 当前无状态核心、自包含请求、每请求能力声明、tools、resources、prompts、elicitation 与 extension 模型。

boundaryZhHans: MCP 标准化的是能力交换；它本身不提供任务分解、智能体循环、记忆、审批、sandbox 或 eval harness。

### 6.37 `mcp-changelog-2026`

- id=mcp-changelog-2026; modules=8:tools-aci-mcp; layer=normative-standard; stability=version-pinned; reuseStatus=link-and-paraphrase-only; transformation=T2
- title=MCP 2026-07-28 key changes
- publisher=Model Context Protocol
- url=https://modelcontextprotocol.io/specification/2026-07-28/changelog
- kind=open-standard
- accessedOn=2026-08-23; publishedOn=2026-07-28; revision=2026-07-28 changes since 2025-11-25

Supports: The exact 2026-07-28 removed, introduced, deprecated, and compatibility-relevant protocol changes, including stateless requests, server/discover, MRTR, resultType, subscriptions/listen, and legacy-feature deprecations.

Boundary: The changelog describes a protocol revision, not the default behavior of every installed SDK, client, server, Academy lesson, or hosted integration.

supportsZhHans: 准确列出 2026-07-28 版本删除、新增、弃用及影响兼容性的协议变更，包括无状态请求、server/discover、MRTR、resultType、subscriptions/listen 与旧特性弃用。

boundaryZhHans: 该 changelog 描述的是一次协议修订，不代表每个已安装 SDK、client、server、Academy 课程或托管集成的默认行为。

### 6.38 `mcp-versioning-2026`

- id=mcp-versioning-2026; modules=8:tools-aci-mcp; layer=normative-standard; stability=version-pinned; reuseStatus=link-and-paraphrase-only; transformation=T2
- title=MCP versioning
- publisher=Model Context Protocol
- url=https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning
- kind=open-standard
- accessedOn=2026-08-23; publishedOn=2026-07-28; revision=2026-07-28

Supports: Date-formatted protocol versions, Draft/Current/Final states, feature deprecation, per-request negotiation, UnsupportedProtocolVersionError, server/discover, and simultaneous legacy-version support.

Boundary: A Current revision may still receive backward-compatible changes, and compatibility requires the actual client and server to support a mutually acceptable revision.

supportsZhHans: 日期格式的协议版本、Draft／Current／Final 状态、特性弃用、每请求协商、UnsupportedProtocolVersionError、server/discover，以及同时支持旧版本的机制。

boundaryZhHans: Current 修订仍可能加入向后兼容的变更；兼容性的前提是实际 client 与 server 支持一个双方都可接受的修订版本。

### 6.39 `mcp-python-sdk-v2`

- id=mcp-python-sdk-v2; modules=8:tools-aci-mcp; layer=repository-evidence; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T3
- title=MCP Python SDK v2.0.0
- publisher=Model Context Protocol
- url=https://github.com/modelcontextprotocol/python-sdk/blob/6f69a3758ebf2ee55ce050f58b470ce11af71133/README.md
- versionAnchorUrl=https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.0.0
- claimEvidenceUrls=https://github.com/modelcontextprotocol/python-sdk/blob/6f69a3758ebf2ee55ce050f58b470ce11af71133/README.md | https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.0.0
- kind=official-github
- accessedOn=2026-08-23; publishedOn=2026-07-28; revision=6f69a3758ebf2ee55ce050f58b470ce11af71133
- license=MIT

Supports: The pinned SDK source and v2.0.0 release notes establish a stable Python implementation for MCP 2026-07-28, automatic version negotiation, and simultaneous serving of earlier protocol revisions.

Boundary: Earlier Academy lessons and v1 examples may use handshake, session, and transport details that no longer describe the current core specification.

supportsZhHans: 固定的 SDK 源码与 v2.0.0 release notes 共同证明：这是 MCP 2026-07-28 的稳定 Python 实现，支持自动版本协商，并可同时服务较早的协议修订。

boundaryZhHans: 较早的 Academy 课程与 v1 示例可能采用 handshake、session 与 transport 细节，这些已不能描述当前核心规范。

### 6.40 `claude-academy-mcp-legacy`

- id=claude-academy-mcp-legacy; modules=8:tools-aci-mcp; layer=engineering-guidance; stability=historical; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Model Context Protocol: Advanced Topics
- publisher=Claude Academy
- url=https://academy.claude.com/courses/model-context-protocol-advanced-topics
- kind=claude-academy
- accessedOn=2026-08-23

Supports: A dated learning reference for pre-2026-07-28 MCP concepts including initialization, roots, sampling, logging callbacks, and SSE session management.

Boundary: This Academy material is not normative for MCP 2026-07-28; the course uses it only to teach temporal drift and migration, never as the current implementation contract.

supportsZhHans: 关于 2026-07-28 之前 MCP 概念的历史学习资料，包括初始化、roots、sampling、logging callback 与 SSE session 管理。

boundaryZhHans: 该 Academy 材料不是 MCP 2026-07-28 的规范性依据；本课程只用它讲解时间漂移与迁移，绝不将其作为当前实现契约。

### 6.41 `mcp-ts-migration-2026`

- id=mcp-ts-migration-2026; modules=8:tools-aci-mcp; layer=sdk-or-framework; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T1
- title=MCP TypeScript SDK migration: supporting 2026-07-28
- publisher=Model Context Protocol
- url=https://github.com/modelcontextprotocol/typescript-sdk/blob/3e90449fd52997da43b79a536d2c19c446603cc7/docs/migration/support-2026-07-28.md
- versionAnchorUrl=https://github.com/modelcontextprotocol/typescript-sdk/commit/3e90449fd52997da43b79a536d2c19c446603cc7
- claimEvidenceUrls=https://github.com/modelcontextprotocol/typescript-sdk/blob/3e90449fd52997da43b79a536d2c19c446603cc7/docs/migration/support-2026-07-28.md
- kind=official-sdk-docs
- accessedOn=2026-08-23; publishedOn=2026-08-17; revision=3e90449fd52997da43b79a536d2c19c446603cc7
- license=MIT

Supports: The concrete SDK migration boundary between older handshake and session-oriented examples and the self-contained 2026-07-28 protocol model.

Boundary: A migration guide describes one official SDK path; deployed clients and servers must still negotiate and test the versions they actually implement.

supportsZhHans: 明确说明旧式 handshake 和面向 session 的示例，与 2026-07-28 自包含协议模型之间的具体 SDK 迁移边界。

boundaryZhHans: 迁移指南只描述一个官方 SDK 的路径；已部署 client 与 server 仍须协商并测试各自实际实现的版本。

### 6.42 `anthropic-context-engineering`

- id=anthropic-context-engineering; modules=9:context-state-memory; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Effective context engineering for AI agents
- publisher=Anthropic
- url=https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- kind=anthropic-official
- accessedOn=2026-08-23; publishedOn=2025-09-29

Supports: Context as a scarce attention budget, just-in-time retrieval, compaction, memory, and subagent context isolation.

Boundary: Context engineering selects model-visible evidence; it does not replace structured state, durable storage, provenance, or access control.

supportsZhHans: 将 context 视为稀缺的注意力预算、即时检索、compaction、memory 与 subagent context 隔离。

boundaryZhHans: Context engineering 选择的是模型可见证据，不能替代结构化状态、持久化存储、来源记录或访问控制。

### 6.43 `anthropic-managed-agents`

- id=anthropic-managed-agents; modules=9:context-state-memory, 11:reliability-recovery, 15:production-orchestration-capstone; layer=engineering-guidance; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Scaling Managed Agents: Decoupling the brain from the hands
- publisher=Anthropic
- url=https://www.anthropic.com/engineering/managed-agents
- kind=anthropic-official
- accessedOn=2026-08-23; publishedOn=2026-04-08

Supports: A durable event-log session, model-loop harness, sandbox separation, crash recovery, and external credential boundary.

Boundary: Managed Agents is a vendor runtime and current product conditions may be Beta or policy-sensitive; the architecture is not a universal storage prescription.

supportsZhHans: 持久化 event-log session、模型循环 harness、sandbox 分离、崩溃恢复与外部凭据边界。

boundaryZhHans: Managed Agents 是厂商运行时，当前产品条件可能仍属 Beta 或受策略影响；该架构不是通用存储方案。

### 6.44 `claude-sdk-agent-loop`

- id=claude-sdk-agent-loop; modules=10:budgets-concurrency-stopping; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=How the agent loop works
- publisher=Claude Agent SDK
- url=https://code.claude.com/docs/en/agent-sdk/agent-loop
- kind=anthropic-official
- accessedOn=2026-08-23

Supports: Tool-loop execution, maximum turns and budgets, compaction, resume and fork, and ordering read-only versus state-changing tools.

Boundary: Runtime defaults and limits are version-specific; a local tool loop still needs application-level cost, time, and side-effect controls.

supportsZhHans: 工具循环执行、最大 turn 数与预算、compaction、resume 与 fork，以及只读工具和状态变更工具的调用顺序。

boundaryZhHans: 运行时默认值与限制取决于版本；本地工具循环仍需要应用层的成本、时间与副作用控制。

### 6.45 `claude-sdk-checkpointing`

- id=claude-sdk-checkpointing; modules=11:reliability-recovery; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=File checkpointing
- publisher=Claude Agent SDK
- url=https://code.claude.com/docs/en/agent-sdk/file-checkpointing
- kind=anthropic-official
- accessedOn=2026-08-23

Supports: File-change checkpoints and the documented recovery boundary for selected editing tools.

Boundary: The checkpoint does not cover every shell or subagent side effect and therefore is not a complete transaction or rollback mechanism.

supportsZhHans: 文件变更 checkpoint，以及文档为部分编辑工具规定的恢复边界。

boundaryZhHans: Checkpoint 不覆盖所有 shell 或 subagent 副作用，因此不是完整的事务或 rollback 机制。

### 6.46 `claude-sdk-permissions`

- id=claude-sdk-permissions; modules=12:security-authority-human-control; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Configure permissions
- publisher=Claude Agent SDK
- url=https://code.claude.com/docs/en/agent-sdk/permissions
- kind=anthropic-official
- accessedOn=2026-08-23

Supports: The current six-stage tool-permission order—hooks, deny rules, ask rules, permission mode, allow rules, then canUseTool—plus child-agent inheritance and least-privilege design.

Boundary: Auto-approved calls may not reach canUseTool; use PreToolUse when a check must run on every call. allowed_tools pre-approves matches but does not constrain all unlisted tools; a fixed surface requires an appropriate dontAsk/deny/tool-removal configuration plus hooks and sandboxing. Permission policy is not operating-system isolation, and bypass modes require a separately controlled environment.

supportsZhHans: 当前六阶段工具权限顺序：hooks、deny rules、ask rules、permission mode、allow rules，最后是 canUseTool；以及 child agent 继承和最小权限设计。

boundaryZhHans: 自动批准的调用可能不会到达 canUseTool；若检查必须覆盖每次调用，应使用 PreToolUse。allowed_tools 只会预先批准匹配项，并不限制所有未列工具；固定工具面需要适当组合 dontAsk、deny/工具移除配置、hooks 与 sandbox。权限策略不是操作系统隔离，bypass mode 需要另行受控的执行环境。

### 6.47 `claude-secure-deployment`

- id=claude-secure-deployment; modules=12:security-authority-human-control; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Securely deploying AI agents
- publisher=Claude Agent SDK
- url=https://code.claude.com/docs/en/agent-sdk/secure-deployment
- kind=anthropic-official
- accessedOn=2026-08-23

Supports: Prompt-injection and model-error threat models, least privilege, sandboxing, network and filesystem controls, credential proxies, and audit trails.

Boundary: This is defense-in-depth guidance, not certification that any default SDK configuration is safe for a particular threat model.

supportsZhHans: 提示注入与模型错误威胁模型、最小权限、sandbox、网络与文件系统控制、凭据代理，以及审计轨迹。

boundaryZhHans: 这是纵深防御指引，不是对任何默认 SDK 配置在特定威胁模型下安全性的认证。

### 6.48 `claude-sdk-observability`

- id=claude-sdk-observability; modules=13:tracing-observability-economics; layer=sdk-or-framework; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Observability with OpenTelemetry
- publisher=Claude Agent SDK
- url=https://code.claude.com/docs/en/agent-sdk/observability
- kind=anthropic-official
- accessedOn=2026-08-23

Supports: OpenTelemetry traces, metrics, events, token and cost signals, latency, tool calls, and failures.

Boundary: Some tracing capabilities are Beta, and telemetry content needs its own redaction, access, and retention policy.

supportsZhHans: OpenTelemetry trace、metric、event、token 与成本信号、延迟、工具调用及失败。

boundaryZhHans: 部分 tracing 能力仍处于 Beta；telemetry 内容需要自己的脱敏、访问与保留策略。

### 6.49 `anthropic-agent-evals`

- id=anthropic-agent-evals; modules=14:evaluation-regression-evolution; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Demystifying evals for AI agents
- publisher=Anthropic
- url=https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- kind=anthropic-official
- accessedOn=2026-08-23; publishedOn=2026-01-09

Supports: Task, trial, grader, trajectory, outcome, harness, suite, repeated trials, calibrated graders, and eval-driven development.

Boundary: Offline evals complement rather than replace production monitoring, A/B tests, user feedback, incident analysis, and human review.

supportsZhHans: Task、trial、grader、trajectory、outcome、harness、suite、重复试验、校准后的 grader，以及 eval 驱动的开发。

boundaryZhHans: 离线 eval 是对生产监控、A/B test、用户反馈、事件分析与人工审查的补充，而不是替代。

### 6.50 `anthropic-harness-long-running`

- id=anthropic-harness-long-running; modules=7:orchestrator-workers-verification; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Effective harnesses for long-running agents
- publisher=Anthropic
- url=https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- kind=anthropic-official
- accessedOn=2026-08-23; publishedOn=2025-11-26

Supports: Incremental long-running work, structured progress artifacts, verification state, and reliable recovery across context windows.

Boundary: The article describes an engineering approach, not a guarantee that a harness can eliminate model drift or incomplete work.

supportsZhHans: 渐进式长时工作、结构化进度产物、验证状态，以及跨 context window 的可靠恢复。

boundaryZhHans: 该文章描述的是一种工程方法，不能保证 harness 能消除模型漂移或未完成工作。

### 6.51 `claude-cookbooks-patterns`

- id=claude-cookbooks-patterns; modules=7:orchestrator-workers-verification; layer=repository-evidence; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T3
- title=Claude Cookbooks: agent patterns
- publisher=Anthropic
- url=https://github.com/anthropics/claude-cookbooks/tree/e22e683065954c07fae8bc4bc5fccf34d6595297/patterns/agents
- kind=official-github
- accessedOn=2026-08-23; publishedOn=2026-06-09; revision=e22e683065954c07fae8bc4bc5fccf34d6595297
- license=MIT

Supports: Pinned minimal implementations of chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, and asynchronous multi-agent orchestration.

Boundary: Cookbooks are teaching examples rather than a production runtime and do not supply durable state, sandboxing, permissions, or recovery by themselves.

supportsZhHans: 版本锁定的最小实现，涵盖链式处理、路由、并行化、orchestrator-workers、evaluator-optimizer 与异步多智能体编排。

boundaryZhHans: Cookbook 是教学示例而非生产运行时，本身不提供持久化状态、sandbox、权限或恢复机制。

### 6.52 `anthropic-agent-sdk-v02143`

- id=anthropic-agent-sdk-v02143; modules=14:evaluation-regression-evolution; layer=repository-evidence; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T3
- title=Claude Agent SDK Python v0.2.143
- publisher=Anthropic
- url=https://github.com/anthropics/claude-agent-sdk-python/blob/22795fe604a0682fc6c57d8ba998ebb50621446d/README.md
- versionAnchorUrl=https://github.com/anthropics/claude-agent-sdk-python/releases/tag/v0.2.143
- claimEvidenceUrls=https://github.com/anthropics/claude-agent-sdk-python/blob/22795fe604a0682fc6c57d8ba998ebb50621446d/README.md
- kind=official-github
- accessedOn=2026-08-23; publishedOn=2026-08-20; revision=22795fe604a0682fc6c57d8ba998ebb50621446d
- license=MIT source; Anthropic services remain subject to separate terms

Supports: The pinned README provides reproducible evidence for the Python query loop, matching-tool pre-approval configuration, hooks, in-process MCP tools, and the documented presence of programmatic subagents and session forking in this source revision.

Boundary: The release tag establishes package version only; checkpoint and telemetry semantics require their separate current documentation, and an MIT SDK license does not license the hosted model service or override Anthropic terms.

supportsZhHans: 固定版本 README 为 Python query loop、匹配工具预批准配置、hook、进程内 MCP 工具，以及该源码修订中记录的 programmatic subagent 与 session forking 提供可复现证据。

boundaryZhHans: Release tag 只证明软件包版本；checkpoint 与 telemetry 语义须查各自的当前文档，MIT SDK 许可证也不许可托管模型服务或取代 Anthropic 条款。

### 6.53 `microsoft-agent-framework`

- id=microsoft-agent-framework; modules=2:task-graphs-contracts, 14:evaluation-regression-evolution, 15:production-orchestration-capstone; layer=repository-evidence; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T3
- title=Microsoft Agent Framework Python 1.15.0
- publisher=Microsoft
- url=https://github.com/microsoft/agent-framework/blob/7a2b8038cc7809714308152782e58d4943720f61/README.md
- versionAnchorUrl=https://github.com/microsoft/agent-framework/releases/tag/python-1.15.0
- claimEvidenceUrls=https://github.com/microsoft/agent-framework/blob/7a2b8038cc7809714308152782e58d4943720f61/README.md | https://github.com/microsoft/agent-framework/releases/tag/python-1.15.0
- kind=official-github
- accessedOn=2026-08-23; publishedOn=2026-08-21; revision=7a2b8038cc7809714308152782e58d4943720f61
- license=MIT

Supports: The pinned README directly documents graph-oriented sequential, concurrent, handoff, group, checkpoint, time-travel, human-review, and telemetry patterns; the Python 1.15.0 notes separately substantiate A2A input handling plus MCP argument-filtering and name-shadowing changes in that release stream.

Boundary: The repository contains multiple language and component release streams; one component tag must not be presented as the version of the whole framework.

supportsZhHans: 固定版本 README 直接记录面向图的顺序、并发、handoff、群组、checkpoint、time travel、人工审查与 telemetry 模式；Python 1.15.0 notes 另行支持该发布流中的 A2A 输入处理、MCP 参数过滤与名称遮蔽变更。

boundaryZhHans: 该仓库包含多种语言与组件的独立发布流；不能把某个组件 tag 表述为整个框架的版本。

### 6.54 `github-aws-return-path-issue`

- id=github-aws-return-path-issue; modules=11:reliability-recovery; layer=bounded-case-study; stability=historical; reuseStatus=link-and-paraphrase-only; transformation=T4
- title=CLI Agent Orchestrator issue 284: return-path failure
- publisher=AWS Labs community repository
- url=https://github.com/awslabs/cli-agent-orchestrator/issues/284
- kind=community-github-case
- accessedOn=2026-08-23

Supports: A concrete public failure case showing why caller identity, task IDs, and return destinations should be structured rather than inferred from prose.

Boundary: An issue report is a bounded historical case and does not prove the same defect remains in the current project or generalizes to every orchestrator.

supportsZhHans: 一个具体的公开失败案例，说明 caller identity、task ID 与 return destination 应采用结构化字段，而不能从自然语言中推断。

boundaryZhHans: 该 issue 是范围有限的历史案例，不能证明当前项目仍有同一缺陷，也不能推广到所有编排器。

### 6.55 `aws-idempotent-apis`

- id=aws-idempotent-apis; modules=11:reliability-recovery; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Making retries safe with idempotent APIs
- publisher=AWS Builders' Library
- url=https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
- kind=engineering-official
- accessedOn=2026-08-23

Supports: Stable caller-supplied operation identifiers, semantic equivalence, deduplication, and the ambiguous outcome where an effect commits but its response is lost.

Boundary: Idempotency is a service and application contract, not an emergent property of an agent or a generic request ID.

supportsZhHans: 由调用方提供的稳定 operation ID、语义等价性、去重，以及副作用已提交但响应丢失这一结果不明确的情形。

boundaryZhHans: 幂等性是服务与应用之间的契约，不是智能体自然获得的属性，也不等同于一个通用 request ID。

### 6.56 `aws-backoff-jitter`

- id=aws-backoff-jitter; modules=11:reliability-recovery; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Exponential backoff and jitter
- publisher=AWS Architecture Blog
- url=https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- kind=engineering-official
- accessedOn=2026-08-23

Supports: Finite exponential backoff with randomized jitter to reduce synchronized retry contention.

Boundary: Backoff changes timing only; it does not make an unsafe mutation replayable or replace a retry budget and failure classification.

supportsZhHans: 带随机 jitter 的有限指数 backoff，用于降低同步重试造成的资源争用。

boundaryZhHans: Backoff 只改变重试时序；它不能让不安全的写操作变得可重放，也不能替代重试预算与故障分类。

### 6.57 `azure-retry-storm`

- id=azure-retry-storm; modules=11:reliability-recovery; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Retry Storm antipattern
- publisher=Microsoft Azure Architecture Center
- url=https://learn.microsoft.com/en-us/azure/architecture/antipatterns/retry-storm/
- kind=engineering-official
- accessedOn=2026-08-23

Supports: Honoring Retry-After, avoiding layered retry storms, using finite backoff, and opening a circuit breaker when a dependency continues to fail.

Boundary: Retry-After and circuit-breaker behavior remain dependency and application contracts; they do not make non-idempotent effects safe to replay.

supportsZhHans: 遵守 Retry-After、避免多层 retry storm、采用有限 backoff，并在依赖持续失败时打开 circuit breaker。

boundaryZhHans: Retry-After 与 circuit breaker 行为仍是依赖服务和应用的契约；它们不能让非幂等副作用变得可安全重放。

### 6.58 `azure-compensating-transactions`

- id=azure-compensating-transactions; modules=11:reliability-recovery; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Compensating Transaction pattern
- publisher=Microsoft Azure Architecture Center
- url=https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction
- kind=engineering-official
- accessedOn=2026-08-23

Supports: Compensation for eventually consistent multi-step workflows, including idempotent compensators and operations that cannot restore the exact prior state.

Boundary: Compensation is not atomic rollback; it can fail and irreversible effects require a manual reconciliation path.

supportsZhHans: 对最终一致的多步骤工作流进行补偿，包括幂等 compensator，以及无法精确恢复先前状态的操作。

boundaryZhHans: 补偿不是原子 rollback；补偿本身也可能失败，不可逆副作用需要人工 reconciliation 路径。

### 6.59 `azure-cosmos-distributed-lock`

- id=azure-cosmos-distributed-lock; modules=9:context-state-memory, 11:reliability-recovery; layer=engineering-guidance; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Azure Cosmos DB design pattern: Global Distributed Lock
- publisher=Microsoft Learn
- url=https://learn.microsoft.com/en-us/samples/azure-samples/cosmos-db-design-patterns/distributed-lock/
- kind=engineering-official
- accessedOn=2026-08-23; publishedOn=2026-07-06

Supports: A bounded implementation example combining atomic lock acquisition, ETag optimistic concurrency, TTL recovery, monotonically increasing fencing tokens, and downstream rejection of stale writers.

Boundary: This is an Azure Cosmos DB sample, not a universal lock service or proof for another datastore; correctness depends on the deployed store's atomicity and consistency plus downstream enforcement and failure testing.

supportsZhHans: 一个有界实现示例，组合原子锁获取、ETag 乐观并发控制、TTL 恢复、单调递增 fencing token，以及下游拒绝陈旧写入者。

boundaryZhHans: 这是 Azure Cosmos DB 示例，不是通用锁服务，也不能证明其他数据存储具有同样保证；正确性取决于已部署存储的原子性与一致性、下游强制检查及故障测试。

### 6.60 `google-sre-error-budget`

- id=google-sre-error-budget; modules=13:tracing-observability-economics; layer=engineering-guidance; stability=stable-concept; reuseStatus=license-noted-no-copy; transformation=T1
- title=Example Error Budget Policy
- publisher=Google SRE Workbook
- url=https://sre.google/workbook/error-budget-policy/
- kind=engineering-official
- accessedOn=2026-08-23; publishedOn=2018-02-19
- license=CC BY-NC-ND 4.0; linked and paraphrased only

Supports: Error budget as the permitted unreliability implied by an SLO and as an explicit control for reliability work and release decisions.

Boundary: The example policy and its thresholds are not universal; each service must define user-centered SLIs, an SLO window, ownership, and decision rules.

supportsZhHans: 将 error budget 定义为 SLO 所隐含的可容许不可靠程度，并将其作为可靠性工作与发布决策的显式控制。

boundaryZhHans: 示例策略及其阈值并不通用；每项服务都必须定义面向用户的 SLI、SLO 时间窗口、责任归属与决策规则。

### 6.61 `otel-overview`

- id=otel-overview; modules=13:tracing-observability-economics; layer=normative-standard; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T2
- title=OpenTelemetry specification overview
- publisher=OpenTelemetry
- url=https://opentelemetry.io/docs/specs/otel/overview/
- kind=open-standard
- accessedOn=2026-08-23; revision=Specification 1.60.0

Supports: A span's single parent identifier, zero or more causal links, and the recommendation to use links rather than a parent for scatter/gather aggregation initiated by several spans.

Boundary: The specification defines telemetry semantics, not proof that every branch was instrumented, sampled, exported, retained, or correctly associated by a particular backend.

supportsZhHans: Span 的单一 parent identifier、零个或多个因果 links，以及 scatter/gather 由多个 span 发起时使用 links 而非 parent 的建议。

boundaryZhHans: 该规范定义遥测语义，不能证明所有分支都已正确埋点、采样、导出、保留，或被特定后端正确关联。

### 6.62 `otel-baggage-security`

- id=otel-baggage-security; modules=13:tracing-observability-economics; layer=engineering-guidance; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=Baggage
- publisher=OpenTelemetry
- url=https://opentelemetry.io/docs/concepts/signals/baggage/
- kind=engineering-official
- accessedOn=2026-08-23

Supports: Official guidance that sensitive Baggage can propagate in HTTP headers to unintended resources, including third-party APIs, and that Baggage has no built-in integrity checks.

Boundary: This is current explanatory guidance rather than the versioned normative specification. Do not put secrets or unminimized personal data in Baggage, and never treat Baggage as trusted authorization input.

supportsZhHans: 官方指南说明：敏感 Baggage 可能通过 HTTP headers 传播到非预期资源（包括第三方 API），且 Baggage 没有内建完整性检查。

boundaryZhHans: 这是当前解释性指南，而非带版本的规范性标准。Baggage 中不得放入 secrets 或未最小化的个人数据，也绝不能把 Baggage 当作可信授权输入。

### 6.63 `oracle-critical-path`

- id=oracle-critical-path; modules=4:parallel-fanout-fanin; layer=engineering-guidance; stability=stable-concept; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=About Critical Path Activities
- publisher=Oracle Primavera P6
- url=https://docs.oracle.com/cd/F74773_01/p6help/en/6623.htm
- kind=engineering-official
- accessedOn=2026-08-23

Supports: Longest path as the sequence of driving activities that determines a project end date, together with the warning that constraints or resource leveling can break that relationship-driven longest path.

Boundary: This is official Primavera scheduling documentation, not a proof that one vendor algorithm solves arbitrary resource-constrained agent scheduling; the course's weighted-DAG and makespan formulation remains a bounded engineering synthesis.

supportsZhHans: 将最长路径定义为决定项目结束日期的一系列驱动活动，并明确指出约束或资源平衡可能打破这种由依赖关系驱动的最长路径。

boundaryZhHans: 这是 Oracle Primavera 的官方调度文档，不能证明某一厂商算法可以解决任意资源受限的智能体调度；课程中的加权 DAG 与 makespan 表述仍是有边界的工程综合。

### 6.64 `etcd-quorum-glossary`

- id=etcd-quorum-glossary; modules=4:parallel-fanout-fanin; layer=engineering-guidance; stability=current-documentation; reuseStatus=link-and-paraphrase-only; transformation=T1
- title=etcd glossary: Quorum
- publisher=etcd
- url=https://etcd.io/docs/v3.7/learning/glossary/
- kind=engineering-official
- accessedOn=2026-08-23

Supports: The etcd v3.7 definition of quorum as the active-member count required for consensus to modify cluster state, with a member majority required to reach quorum.

Boundary: This is an etcd/Raft product definition, not a universal synonym for any k-of-n application join, a majority vote on answer truth, or a complete treatment of consensus membership and quorum-intersection proofs.

supportsZhHans: etcd v3.7 将 quorum 定义为修改集群状态并达成共识所需的活跃成员数量，并要求成员多数才能达到 quorum。

boundaryZhHans: 这是 etcd/Raft 产品定义，不是任意 k-of-n 应用汇合规则、答案真值多数票的通用同义词，也不是对共识成员关系与 quorum 交集证明的完整论述。

### 6.65 `langgraph-v1211`

- id=langgraph-v1211; modules=14:evaluation-regression-evolution; layer=repository-evidence; stability=version-pinned; reuseStatus=license-noted-no-copy; transformation=T3
- title=LangGraph Python core 1.2.11
- publisher=LangChain
- url=https://github.com/langchain-ai/langgraph/blob/644815f9e5bc52ad8f7a5227a456227e9c3e639b/README.md
- versionAnchorUrl=https://github.com/langchain-ai/langgraph/releases/tag/1.2.11
- claimEvidenceUrls=https://github.com/langchain-ai/langgraph/blob/644815f9e5bc52ad8f7a5227a456227e9c3e639b/README.md
- kind=official-github
- accessedOn=2026-08-23; publishedOn=2026-08-11; revision=644815f9e5bc52ad8f7a5227a456227e9c3e639b
- license=MIT

Supports: The pinned README directly describes LangGraph as a stateful orchestration runtime and documents durable execution, human-in-the-loop control, and short- and long-term memory as its open-source runtime capabilities.

Boundary: The 1.2.11 release page is only the version anchor; the open-source runtime and commercial LangSmith services are separate, and core, checkpoint, and SDK release streams must not be conflated.

supportsZhHans: 固定版本 README 直接把 LangGraph 描述为有状态编排运行时，并记录持久化执行、human-in-the-loop 控制，以及短期与长期 memory 等开源能力。

boundaryZhHans: 1.2.11 release 页面只作为版本锚点；开源运行时与商业 LangSmith 服务相互独立，core、checkpoint 与 SDK 发布流不得混为一谈。

### 6.66 `google-adk-v271`

- id=google-adk-v271; modules=15:production-orchestration-capstone; layer=repository-evidence; stability=current-documentation; reuseStatus=license-noted-no-copy; transformation=T6
- title=Google ADK v2.7.1 anchor and workflow documentation
- publisher=Google
- url=https://github.com/google/adk-docs/blob/main/docs/workflows/index.md
- versionAnchorUrl=https://github.com/google/adk-python/releases/tag/v2.7.1
- claimEvidenceUrls=https://github.com/google/adk-docs/blob/main/docs/workflows/index.md | https://github.com/google/adk-docs/blob/main/docs/workflows/collaboration.md | https://github.com/google/adk-docs/blob/main/docs/sessions/state.md
- kind=official-github
- accessedOn=2026-08-23; revision=d71f1bf1d77fd1e2fdc8b9a82d48645d64c5afc3
- license=Apache-2.0

Supports: Current official ADK documentation supports graph, dynamic, collaborative, and template workflows; branching, sequential, loop, and parallel execution; collaboration control transfer; and session state. A separate release anchor identifies Python v2.7.1 and its commit.

Boundary: The v2.7.1 release page establishes version and two listed fixes, not this broader feature set; the claim-evidence pages are rolling documentation, and 2.x behavior must be rechecked and tested against the deployed package.

supportsZhHans: 当前官方 ADK 文档支持 graph、dynamic、collaborative 与 template workflow，分支、顺序、循环与并行执行，协作控制权转移及 session state；另有独立 release 锚点标识 Python v2.7.1 及其 commit。

boundaryZhHans: v2.7.1 release 页面只证明版本及其中列出的两项修复，不证明上述完整特性；claim evidence 是滚动文档，部署前必须针对实际软件包重新核对并测试 2.x 行为。

### 6.67 `autogen-maintenance`

- id=autogen-maintenance; modules=14:evaluation-regression-evolution; layer=repository-evidence; stability=historical; reuseStatus=license-noted-no-copy; transformation=T3
- title=AutoGen maintenance notice
- publisher=Microsoft
- url=https://github.com/microsoft/autogen/blob/027ecf0a379bcc1d09956d46d12d44a3ad9cee14/README.md
- kind=official-github
- accessedOn=2026-08-23; publishedOn=2026-04-06; revision=027ecf0a379bcc1d09956d46d12d44a3ad9cee14
- license=MIT code; documentation has separate terms including CC BY 4.0 content

Supports: Lifecycle evidence that AutoGen is in maintenance mode and that Microsoft points new projects toward Microsoft Agent Framework.

Boundary: AutoGen remains useful historical prior art; maintenance status is not evidence that every existing AutoGen deployment should be rewritten immediately.

supportsZhHans: 生命周期证据表明 AutoGen 已进入维护模式，且 Microsoft 建议新项目采用 Microsoft Agent Framework。

boundaryZhHans: AutoGen 仍是有价值的历史先例；维护状态不能证明每个现有 AutoGen 部署都应立即重写。

## 7. Manifest utilization and closure audit

Result: **67/67 canonical source records are referenced by at least one manifest module**. Unique manifest source IDs=67; unknown IDs=0; unused canonical IDs=0.

| order | slug | sourceCount |
|---:|---|---:|
| 1 | workflow-agent-boundary | 3 |
| 2 | task-graphs-contracts | 3 |
| 3 | chaining-routing | 4 |
| 4 | parallel-fanout-fanin | 9 |
| 5 | manager-roles-ownership | 3 |
| 6 | delegation-handoffs | 4 |
| 7 | orchestrator-workers-verification | 6 |
| 8 | tools-aci-mcp | 11 |
| 9 | context-state-memory | 7 |
| 10 | budgets-concurrency-stopping | 8 |
| 11 | reliability-recovery | 12 |
| 12 | security-authority-human-control | 6 |
| 13 | tracing-observability-economics | 9 |
| 14 | evaluation-regression-evolution | 8 |
| 15 | production-orchestration-capstone | 6 |

Layer distribution:

- layer=bounded-case-study; count=1
- layer=engineering-guidance; count=20
- layer=normative-standard; count=4
- layer=product-documentation; count=19
- layer=repository-evidence; count=10
- layer=sdk-or-framework; count=13

Stability distribution:

- stability=beta; count=1
- stability=current-documentation; count=38
- stability=historical; count=4
- stability=stable-concept; count=13
- stability=version-pinned; count=11

## 8. Freshness, versioning and re-verification summary

- Responses Multi-agent 的 Beta 状态、适用模型、schema、并发语义与限制属于高漂移产品事实；每次 API、模型或 SDK 升级及每次公开发布前都必须重新核验。
- Codex subagent 设置、线程上限字段、sandbox 继承与审批/网络行为属于运行时特定事实；Codex release 或配置 schema 变化即触发复核。
- MCP 当前规范锚定 `2026-07-28`。出现新的 Current revision、SDK major release 或兼容目标变化时，必须重新检查 specification、changelog、versioning 与 migration records；Claude Academy legacy 资料不能自动升级为规范依据。
- `stability=version-pinned` 的 GitHub 记录只支持所列 tag/commit/revision；release/tag URL 只证明版本，除非 release notes 正文明确列出相关行为且该 URL 同时进入 `claimEvidenceUrls`。滚动 README 或 main 分支的生命周期陈述必须在发布时重查，不能代替项目 dependency lock。
- `google-adk-v271` 明确采用混合边界：v2.7.1 release 是独立 `versionAnchorUrl`，广义 workflow claim 来自滚动官方文档，因此该记录归入 `current-documentation`，而不是把 release tag 冒充完整 feature evidence。
- Anthropic 的 `Building effective agents` 仅支持 2024 年文章中的稳定架构模式；其页面已明确警告工具生态自 2024 年 12 月后发生变化，当前 SDK/Managed Agents 行为必须查相应现行来源。
- `stability=current-documentation` 页面没有统一公开修订时间；`accessedOn=2026-08-23` 是本快照的观测边界，不是未来有效性保证。
- 课程没有加入计划、价格、配额或商业可用性建议；若未来加入，必须另做只依赖官方来源的新审计。
- 私有开发输入若发生变化，应在仓库外重新执行只读的隐私、完整性与权利审查；任何公开课程变更仍须回到公开一手来源重新核验，并继续排除输入的识别性元数据与内容。

## 9. Known evidence gaps

1. 尚无同任务基准同时测量 Course 15 labs 的单智能体与多智能体质量、p50/p95/p99 延迟、token、成本和失败率。
2. 来源台账包含可复现的 SDK/framework release 或 commit 锚点，但课程尚未选定唯一生产运行时或生成 deployment dependency lock；来源 revision 不能冒充部署锁。
3. 两个私有开发输入的完整权属链、隐私许可与再发布许可尚未建立，因此它们继续保持非公开且不作为 canonical source。
4. 私有输入只能提出研究问题，不能证明任何产品行为、协议要求、普遍效果或生产适用性。
5. Course 15 的 LLM grader 尚无经实测的人类校准集、agreement 指标或错误阈值。
6. 面向真实 CourseOps capstone 部署的 privacy impact assessment、retention schedule、tenant model、secret-flow diagram 与 threat model 尚未获批。
7. 尚无兼容性测试证明未来选定的精确 MCP client/server SDK 组合完整实现 MCP 2026-07-28。
8. 浏览器级视觉、交互与辅助功能验收不属于本 provenance 快照所能证明的事实，必须由独立 UI/runtime 验证记录承担。

## 10. Asset-rights and reuse summary

- **ALLOW — Course-original expression only:** Course 15 原创 semantic HTML、CSS、文本与图形可发布；仍需保存创作者、版本、claim mapping 与必要的可访问性测试记录。
- **LINK/PARAPHRASE ONLY:** OpenAI、Anthropic、Claude Academy、工程文章与没有明确复制许可的产品文档只允许链接和有边界释义；不复制页面布局、长篇文字、截图、视频或官方图。
- **LICENSE NOTED, NO COPY IN THIS SNAPSHOT:** 带 license 的 repository/standard records 只记录许可证和版本边界；本课程未据此复制代码、schema、README prose、diagram 或 screenshot。未来改编必须定位到精确文件/commit，并履行适用 LICENSE/NOTICE/attribution。
- **PRIVATE REFERENCE ONLY:** 两个私有开发输入及其任何媒体、文字或近似重绘均不得作为公开下载或课程资产；只读查阅不等于作者权、事实正确或再发布许可。
- “重新绘制”若与原作品的表达、布局或视觉构图实质近似，仍可能构成衍生使用；Logo、商标与人物/账户隐私必须独立审查。

## 11. Asset decision register

| Candidate | Decision | Release boundary |
|---|---|---|
| Course 15 original semantic HTML/CSS/text/diagrams | **ALLOW** | 仅限课程原创表达；保存版本和 claim mapping，并完成可访问性检查 |
| OpenAI official screenshots/diagrams | **WITHHOLD** | 只链接原始页面；若需要图解，创建构图与表达均独立的新图 |
| Anthropic/Claude Academy lessons, quiz, video, screenshots or diagrams | **WITHHOLD** | 只链接与释义；MCP Advanced 还必须标注相对 2026-07-28 的 legacy 边界 |
| GitHub repository code, prose or diagrams | **WITHHOLD BY DEFAULT** | 未来必要改编须固定精确 release/commit/file 并履行 LICENSE/NOTICE；本快照未复制 |
| MCP specification/schema/docs expression | **WITHHOLD BY DEFAULT** | 当前仅抽取有版本边界的事实并释义；任何未来复制须做 file-level license audit |
| Community screenshots and redraws | **WITHHOLD** | 作者、隐私、条款、商标与再发布权未建立 |
| Private development inputs as downloadable resources | **WITHHOLD** | 完成明确授权与逐对象权利清单前保持非公开 |

## 12. Release re-verification triggers

| Surface | Canonical records | Trigger |
|---|---|---|
| Responses Multi-agent | openai-responses-multi-agent | 模型/API/schema/Beta 状态或限制变化；公开发布前 |
| Codex subagents and security | openai-codex-subagents, openai-codex-sandbox-security | Codex release、配置字段、sandbox 或 network policy 变化 |
| MCP current/legacy boundary | mcp-spec-2026, mcp-changelog-2026, mcp-versioning-2026, mcp-python-sdk-v2, claude-academy-mcp-legacy, mcp-ts-migration-2026 | 新 Current revision、SDK major release 或 Academy 更新 |
| SDK/framework examples | all stability=version-pinned repository records | dependency lock、release 或 migration target 变化 |
| Private development inputs | Non-public privacy record only; never a canonical public source | 任何重新提交、授权状态或公开范围变化 |

## 13. Snapshot integrity statement

- Canonical source records were read from the final `AGENT_ORCHESTRATION_SOURCES` export, including derived `claimEvidenceUrls`, `layer`, `reuseStatus`, `transformation`, `supportsZhHans` and `boundaryZhHans` fields plus optional `versionAnchorUrl`.
- Module usage was read from `AGENT_ORCHESTRATION_COURSE_MANIFEST.modules`; each usage token records exact manifest `order:slug`.
- Export audit result: source IDs=67 unique; manifest source IDs=67 unique; missing=0; unknown=0; coverage=67/67.
- Section 2 records only the non-identifying privacy boundary. Private development inputs are excluded from public and commit-ready artifacts; their identifying metadata and internal structure are not part of this canonical source ledger.

## 14. Correctness re-audit for Course 15 v1.1.1

The 2026-08-23 re-audit compared high-risk course claims with current primary documentation and then reconciled English copy, Simplified Chinese copy, source boundaries, the research brief, and learner-facing interaction labels. Confirmed corrections were:

- Anthropic's term is agent-computer interface (ACI); only the course's expanded action-boundary register is course-original.
- OpenAI webhook consumers must tolerate duplicates, but a finite retry window does not guarantee eventual delivery.
- OpenAI Background mode is constrained by documented polling, storage, `store`, project, and retention behavior; it is not generically durable workflow state.
- Claude Agent SDK tool permissions currently evaluate hooks, deny, ask, permission mode, allow, then canUseTool; earlier approvals can prevent the callback from running.
- Critical path, validated k-of-n joins, trace coverage, controlled replay, shadow side effects, and repeated-evaluation conclusions now state their resource, observability, dependency, and inference boundaries explicitly.

The re-audit preserved the 15-module architecture and 1,060-minute workload while expanding the public source ledger to 67 records with primary support for fencing-token, critical-path/resource-leveling, consensus-quorum, OpenTelemetry fan-in, and Baggage-security semantics. It also preserved the MCP 2026-07-28 current/legacy separation and private-input exclusion policy. The release checker now fails on the former ACI mistranslation and on drift in the corrected webhook, Background mode, permission-order, sandbox/approval, trace, shadow, critical-path, idempotency, and evaluation boundaries.

## 15. Provenance acceptance checklist

- [x] Course snapshot identifies canonical id, version, date, phases and all 15 module orders/slugs.
- [x] All 67 public source IDs appear exactly once in the canonical source ledger; private development inputs are excluded.
- [x] Every source records exact primary claim-evidence URL, publisher, title, module usage, layer, stability and reuseStatus; the seven audited version/claim records additionally expose `versionAnchorUrl` and complete `claimEvidenceUrls`.
- [x] Optional revision, publishedOn and license fields are retained wherever present in the final export.
- [x] Every public source references one exact T1–T4 or T6 transformation profile; T5 documents the non-public input policy only.
- [x] Every source reproduces Supports, Boundary, supportsZhHans and boundaryZhHans from the final export.
- [x] Manifest closure is explicit: 67/67 public sources are used by at least one module; no unknown or private source IDs exist.
- [x] OpenAI Responses, Codex, Agents SDK, Anthropic/Claude, MCP, engineering guidance and GitHub cases remain product/version bounded.
- [x] Freshness, known gaps and asset-rights boundaries are retained.
- [x] Section 2 retains only the privacy-sanitized, non-identifying boundary for private development inputs.
- [x] Final reviewer acceptance completed on 2026-08-23 by independent Codex reviewers with no unresolved P0/P1 findings.
