import type { AgentOrchestrationCourseCopy } from "../types";

/**
 * Course 15 的简体中文长篇主文案。
 *
 * 文案不是英文版的逐句翻译，而是面向工程团队重新组织的中文课程：
 * 每个模块都把来源明确支持的事实、课程的工程综合，以及必须复核的
 * 版本敏感事实分开。外部来源只作链接与转述，不复制原图、课程页面或
 * 私有开发资料中的第三方截图。
 */
export const AGENT_ORCHESTRATION_ZH_HANS_COPY = {
  meta: {
    title: "智能体编排：从任务图到生产控制面",
    shortTitle: "智能体编排",
    kicker: "课程 15 · Agent Orchestration",
    summary:
      "一门以控制权、状态、证据与恢复为主线的完整工程课程：从判断何时不该使用智能体开始，逐步掌握链式流程、路由、并行、经理—专家、交接、动态工作者、工具与 MCP、上下文与记忆、预算与停止、可靠性、安全、可观测性、评估和生产发布。",
    audience:
      "需要设计、实现、评审或运营智能体系统的软件工程师、架构师、产品技术负责人、AI 应用开发者与研究人员。",
    prerequisite:
      "建议具备 API、异步任务、JSON Schema 与基本分布式系统知识；不要求预先使用某一智能体框架。请带着一个真实工作流贯穿全部练习。",
    level: "中级到高级",
    duration: "17 小时 40 分钟",
    startCta: "建立第一份编排契约",
    resumeCta: "继续完善编排系统",
    translationNote:
      "本课程提供原生编写的简体中文内容；产品名、API 名、协议字段和业内通用模式保留英文，避免错误翻译。",
    evidenceNote:
      "课程以 OpenAI、Anthropic 与 Claude Academy 官方资料为主，并用官方 GitHub 仓库补足实现证据。来源支持、工程综合与版本观察会分别标注；私有开发资料不进入学习者可见的证据登记册，也不重新发布其中的媒体或文字。",
  },
  ui: {
    reviewCourse: "复习课程",
    course: "课程 15",
    module: "模块",
    modules: "个模块",
    minute: "分钟",
    minutes: "分钟",
    phase: "阶段",
    source: "来源",
    sources: "来源",
    evidence: "证据",
    topology: "拓扑",
    trigger: "触发条件",
    completion: "完成判据",
    controlOwner: "控制所有者",
    stateOwner: "状态所有者",
    contextBoundary: "上下文边界",
    toolAuthority: "工具权限",
    delegationPayload: "委派载荷",
    concurrencyPolicy: "并发策略",
    failurePolicy: "失败策略",
    escalation: "升级路径",
    sourceGrounded: "来源支持",
    engineeringSynthesis: "工程综合",
    versionWatch: "版本观察",
    artifact: "交付物",
    contract: "12 项编排契约",
    contractTitle: "让控制、状态、权限与恢复边界都可检查",
    practice: "工程练习",
    reviewGate: "评审门",
    checkpoint: "知识检查",
    lab: "交互实验",
    concepts: "核心概念",
    patterns: "模式",
    continue: "继续",
    previous: "上一模块",
    next: "下一模块",
    complete: "已完成",
    completed: "已完成",
    progress: "课程进度",
    reset: "重置本地进度",
    save: "保存到本机",
    download: "下载 Markdown",
    finalAssessment: "结课测验",
    capstone: "综合项目",
    conceptMap: "编排概念地图",
    rightsBoundary: "来源与权利边界",
    tableOfContents: "课程地图",
    objective: "学习目标",
    takeaway: "本模块结论",
    pass: "通过",
    retry: "重新作答",
    explore: "查看课程系统",
    duration: "学习时长",
    level: "难度",
    language: "内容语言",
    researchGrounded: "研究证据驱动",
    orchestrationControl: "编排控制台",
    ready: "就绪",
    studyLoad: "学习负荷",
    phases: "阶段",
    labModes: "实验模式",
    scopeContract: "课程范围契约",
    scopeTitle: "覆盖生产级实践，并让每一道边界都清晰可见",
    distinctions: "关键区分",
    boundaryTitle: "避免类别错误的六组关键区分",
    boundarySummary: "这些概念在演示中看似相近，但进入生产后会改变所有权、持久化、权限或证据责任。",
    runtimeSemantics: "运行时特定语义",
    runtimeTitle: "不要把六种不同层次统称为“多智能体”",
    runtimeSummary: "协议、提供商 API、SDK、应用编排、部署运行时和模型属于不同的事实层次。",
    patternAtlasTitle: "依据控制需求选择九种模式",
    patternAtlasSummary: "模式不是成熟度等级；最佳拓扑是能够满足已评估需求的最小自治结构。",
    control: "控制方式",
    useWhen: "适用条件",
    stopWhen: "停止信号",
    curriculum: "课程结构",
    curriculumTitle: "由十五个模块构成的生产控制系统",
    curriculumSummary: "每个模块都以执行契约、可编辑交付物、确定性交互实验和一个可考核边界收束。",
    outcomes: "可观察学习成果",
    outcomesTitle: "完成课程后，你能够有证据地为哪些决定辩护",
    accountableReview: "责任评审",
    accountableReviewTitle: "发布评审组必须回答的问题",
    integrityTitle: "证据均可追溯，产品事实注明时点，视觉资产均为原创。",
    integrityEvidenceModes: "每个教学章节都标注证据模式，并链接到相应支持记录。",
    integrityBoundaries: "每条来源都说明其能够支持的主张及其无法证明的边界。",
    integrityUploads: "私有开发资料不进入公开证据登记册，也不会在本站重新发布。",
    noticeCta: "阅读来源与资产说明",
    sourceRegister: "证据登记册",
    sourceRegisterCount: "条去重后的链接记录",
    sourceRegisterNote: "每条记录只支持范围明确的主张；它的证据边界本身就是课程内容，而非脚注。",
    courseMap: "课程地图",
    whatChanges: "完成本模块后发生的变化",
    conceptsInModule: "本模块核心概念",
    onThisPage: "执行笔记",
    evidenceLinks: "证据链接",
    workSequence: "工作步骤",
    moduleTakeaway: "本模块结论",
    return: "返回",
    sourceSupports: "支持的主张",
    sourceBoundary: "证据边界",
    supportingClaimEvidence: "补充主张证据",
    versionAnchor: "版本锚点",
    accessed: "访问日期",
    revision: "版本 / 提交",
    license: "许可",
    allCourseModules: "全部课程模块",
    moduleNavigation: "模块导航",
    savedLocally: "已保存在此浏览器",
    memoryOnly: "隐私浏览：进度仅在本标签页保留",
    resetComplete: "课程 15 进度已在此浏览器重置",
    resetMemory: "课程 15 进度已在当前标签页重置",
    checkingStorage: "正在检查保存能力…",
    confirmReset: "确认重置",
    artifactWorkbench: "交付物工作台",
    artifactEditRequired: "请保留起始模板的标题以及字段/表格/代码骨架，并作出与编排有关的多样化实质编辑：跨多个章节填写至少三行结构化内容，至少改变 32 个字母或数字字符，并增加多个不同的控制/证据概念。重复字符、随机词表、单段尾部粘贴、空白与标点不计。浏览器门槛只验证最低证据，质量仍须人工评审。",
    artifactEvidenceSaved: "证据收据已保存。",
    draftAutoSaved: "工作草稿已自动保存；尚不计入完成证据。",
    draftRecovered: "已恢复工作草稿；请通过证据门并显式保存。",
    saved: "已保存",
    saveDraft: "保存草稿",
    draft: "草稿",
    checkAnswer: "检查答案",
    correct: "回答正确",
    tryAgain: "请重新判断这条边界",
    saveLab: "保存实验状态",
    inProgress: "进行中",
    markIncomplete: "标记为未完成",
    markComplete: "标记模块完成",
    assessment: "结课测验",
    assessmentThreshold: "通过线",
    bestScore: "最佳成绩",
    submitAssessment: "提交并评分",
    passed: "已通过",
    notYet: "尚未通过",
    assessmentPass: "你已通过架构评审门。",
    assessmentRetry: "复习各项边界解释后，再开始一次完整作答。",
    releaseContract: "发布契约",
    auditableArtifacts: "15 项可审计交付物",
    capstoneOpen: "每项交付物都有证据之前，综合项目不能标记完成。",
    savedArtifactRequired: "保存经过实质编辑的产物",
    savedLabRequired: "保存本模块实验状态",
    correctCheckpointRequired: "正确回答检查点",
    completionNeeds: "完成前还需：",
    passPreserved: "本次未达线；历史通过状态已保留",
    bestPreserved: "最佳分数与课程通过状态都不会因较低的后续尝试而下降。",
    evidenceReference: "证据 / 引用",
    evidencePlaceholder: "输入文件、URL、trace ID 或评审记录",
    evidenceGuidance: "每项必须使用不同的 HTTPS URL、带扩展名的文件路径、结构化 trace／ticket／review ID，或包含标识符的实质评审记录。浏览器只排除明显占位符，无法证明外部对象真实存在；最终仍须人工核验。",
  },
  principles: [
    "先证明编排确有必要：确定性代码、单次模型调用或单智能体能够可靠完成时，不为“多智能体”而多智能体。",
    "控制权必须可定位：每一时刻都能回答谁能决定下一步、谁拥有最终回答、谁能批准副作用。",
    "状态与上下文分离：模型看到的材料不是业务真相，Session 也不是长期记忆，更不是事务日志。",
    "副作用先于重试设计：为身份、幂等、效果账本、补偿和人工对账建立契约，再谈自动恢复。",
    "用证据扩大自治：权限批准、执行成功、质量通过和人类签核是不同门槛；观测数据与评估结果决定是否放宽边界。",
  ],
  outcomes: [
    "根据任务不确定性、可验证性、依赖和风险，选择代码工作流、单智能体或多智能体拓扑。",
    "把需求表达为带节点契约、状态所有者、完成判据和失败边的任务图。",
    "实现链式处理、结构化路由、模型路由、并行扇出—汇合及确定性聚合。",
    "区分经理调用专家、控制权交接、动态工作者与分层团队，并明确最终答案所有权。",
    "设计可校验的委派包、返回信封、证据清单、未决问题和独立验证协议。",
    "划分工具接口、智能体—计算机接口（ACI）与 MCP 能力交换，同时落实授权、隔离和数据边界。",
    "区分上下文、对话、Session、运行状态、检查点、压缩与长期记忆，并制定恢复策略。",
    "建立时间、令牌、成本、并发、深度与停止预算，实施背压、取消和降级。",
    "用幂等键、效果账本、重试分类、补偿动作与人工对账处理不确定结果。",
    "把追踪、监控、审计与评估连接到分阶段发布、回归门和版本治理。",
  ],
  distinctions: [
    ["工作流（workflow）", "预先定义控制路径，代码决定主要顺序、分支与停止条件。"],
    ["智能体（agent）", "模型在受约束循环中根据观察选择下一步；自治范围来自契约，而非名称。"],
    ["权限批准", "只说明某次行动被允许，不等于输出正确、质量通过或人类承担最终责任。"],
    ["上下文 / 状态 / 记忆", "上下文供模型当下推理；状态记录流程事实；记忆是经过写入、检索、更新与治理的持久知识。"],
    ["追踪 / 评估", "追踪只能重建已记录、已埋点的执行路径，并受上下文传播、采样、导出与保留缺口限制；评估依据任务、轨迹或结果标准判断表现是否可接受。"],
    ["MCP / 编排器", "MCP 交换工具、资源与提示等能力；编排器负责分解、调度、控制、恢复和验收。"],
  ],
  phases: {
    frame: {
      title: "框定系统",
      summary: "先决定是否需要智能体，再把任务、控制流和并行边界写成可审查的图。",
      verb: "画清边界",
    },
    compose: {
      title: "组合角色与能力",
      summary: "组合经理、专家、工作者、验证者、工具与协议，并固定控制权和通信契约。",
      verb: "组合拓扑",
    },
    control: {
      title: "控制运行",
      summary: "管理上下文、状态、预算、恢复、授权和人工介入，让失败可控且可追溯。",
      verb: "约束执行",
    },
    operate: {
      title: "运营与演进",
      summary: "通过遥测、经济性、评估与版本治理，把原型逐步变成可运营系统。",
      verb: "用证据放量",
    },
  },
  conceptDomains: {
    "boundaries-autonomy": {
      title: "边界与自治",
      summary: "判断何时使用代码主导的流程、单智能体或多智能体，并为自治设定可撤销边界。",
      concepts: ["workflow vs agent", "自治梯度", "可逆性", "人在回路"],
    },
    "task-graphs-contracts": {
      title: "任务图与契约",
      summary: "用节点、边、状态、完成判据和失败路径表达系统，而非只写角色提示词。",
      concepts: ["DAG / 状态图", "前置条件", "后置条件", "失败边", "效果账本"],
    },
    "deterministic-workflows": {
      title: "代码主导的工作流",
      summary: "由代码预定义转移与门禁；若流程包含模型节点，其输出仍具随机性，必须用多次试验评估。",
      concepts: ["prompt chain", "router", "结构化输出", "断路器"],
    },
    "parallelism-aggregation": {
      title: "并行与聚合",
      summary: "只并发执行真正独立的工作，并以确定性 join 契约收敛分歧与缺失。",
      concepts: ["fan-out / fan-in", "并发平面", "背压", "经验证的 k-of-n 汇合", "稳定归并"],
    },
    "roles-control-ownership": {
      title: "角色、控制权与所有权",
      summary: "定义谁规划、谁执行、谁验证、谁拥有最终答案及谁能批准副作用。",
      concepts: ["manager", "specialist", "control owner", "final-answer owner"],
    },
    "delegation-communication": {
      title: "委派与通信",
      summary: "用结构化任务包和返回信封跨上下文传递目标、证据、限制与未决问题。",
      concepts: ["agents-as-tools", "handoff", "return envelope", "caller identity"],
    },
    "dynamic-orchestration": {
      title: "动态编排",
      summary: "在未知子任务下由编排者按观察生成工作，并用独立验证约束漂移。",
      concepts: ["orchestrator-workers", "evaluator-optimizer", "层级团队", "动态分解"],
    },
    "tools-protocols": {
      title: "工具、ACI 与协议",
      summary: "把模型意图转换为受类型、权限、隔离与协议约束的外部能力调用。",
      concepts: ["function tool", "hosted tool", "智能体—计算机接口（ACI）", "MCP", "capability boundary"],
    },
    "context-state-memory": {
      title: "上下文、状态与记忆",
      summary: "分别设计模型可见材料、业务真相、运行恢复数据和持久知识。",
      concepts: ["context window", "session", "run state", "checkpoint", "compaction", "memory"],
    },
    "scheduling-budgets": {
      title: "调度与预算",
      summary: "约束深度、宽度、轮次、时间、令牌、成本和队列，并在超限前停止。",
      concepts: ["concurrency", "deadline", "token budget", "backpressure", "stopping rule"],
    },
    "reliability-durability": {
      title: "可靠性与持久化",
      summary: "把超时、重试、重复交付、崩溃和不确定副作用纳入恢复协议。",
      concepts: ["idempotency", "effect ledger", "retry class", "compensation", "manual reconciliation"],
    },
    "security-governance": {
      title: "安全与治理",
      summary: "以最小权限、隔离、审批、审计和事件响应约束可行动智能体。",
      concepts: ["least privilege", "prompt injection", "sandbox", "approval", "kill switch"],
    },
    "observability-economics": {
      title: "可观测性与经济性",
      summary: "同时测量轨迹、服务健康、业务结果、隐私暴露、延迟和总成本。",
      concepts: ["trace", "metrics", "monitoring", "audit", "cost per success"],
    },
    "evaluation-evolution": {
      title: "评估与演进",
      summary: "以多次试验、校准评分器和版本锁控制模型、提示、工具与框架变化。",
      concepts: ["task eval", "trajectory eval", "outcome eval", "regression", "version matrix"],
    },
    "production-operations": {
      title: "生产运营",
      summary: "通过分阶段流量、SLO、事故演练、回滚与证据门逐步扩大自治。",
      concepts: ["shadow", "canary", "SLO", "incident", "rollback", "release gate"],
    },
  },
  patterns: {
    "single-agent-loop": {
      title: "单智能体循环",
      control: "同一智能体在轮次、工具与预算边界内观察—决定—行动，应用保留终止权。",
      bestWhen: "领域相对统一、上下文可控、工具不多，且一个控制者足以完成任务。",
      failureSignal: "上下文持续膨胀、角色指令冲突、工具权限过宽或无法解释为何继续循环。",
    },
    "prompt-chain": {
      title: "链式流程",
      control: "代码按固定顺序把一个步骤的结构化结果交给下一步骤，并在节点间校验。",
      bestWhen: "任务能稳定分段，顺序明确，且每个中间产物都可验证。",
      failureSignal: "上游错误被无条件放大，或需要动态返工却没有循环与停止契约。",
    },
    router: {
      title: "路由",
      control: "分类器或规则选择专家、模型、工具或下一子图；默认分支与拒绝分支必须显式。",
      bestWhen: "输入可分为差异明显的类别，且不同类别需要不同提示、工具或风险策略。",
      failureSignal: "边界样本大量误路由、类别漂移，或路由置信度不触发降级。",
    },
    "parallel-fanout": {
      title: "并行扇出—汇合",
      control: "调度器发出独立分支并实施上限、超时和取消，聚合器按固定规则合并。",
      bestWhen: "子任务依赖少、结果可独立验证，且墙钟时间或视角多样性具有价值。",
      failureSignal: "共享写入冲突、总成本失控、尾延迟变差，或聚合只凭“多数说了算”。",
    },
    "manager-tools": {
      title: "经理调用专家",
      control: "经理始终拥有对话和最终答案；专家像工具一样返回范围受限的结果。",
      bestWhen: "需要统一语气、全局政策或跨专家综合，且不希望用户控制权漂移。",
      failureSignal: "经理成为信息瓶颈、压缩丢失证据，或专家实际产生副作用却被当作纯查询。",
    },
    handoff: {
      title: "控制权交接",
      control: "当前智能体把任务与必要上下文交给另一智能体，后者接管后续轮次与响应责任。",
      bestWhen: "专业流程具有持续对话、独立政策或长期所有权，接管比返回一次结果更自然。",
      failureSignal: "交接后无人知道谁负责最终答案、上下文重复/缺失，或权限随交接意外扩大。",
    },
    "orchestrator-workers": {
      title: "编排者—工作者",
      control: "编排者根据任务动态生成子任务、选择工作者并收集产物；验证与预算约束其探索。",
      bestWhen: "子任务数量或形态无法预先枚举，例如开放式研究、迁移或多文件工程。",
      failureSignal: "重复分解、失去依赖关系、工作者互相覆盖，或“有很多活动”却无可验收产物。",
    },
    "evaluator-optimizer": {
      title: "评估者—优化者",
      control: "生成者产出候选，评估者依据预先声明的量规反馈；循环受轮次和改进阈值限制。",
      bestWhen: "质量标准可以表达，反馈能指导修订，且多轮改进的价值超过额外成本。",
      failureSignal: "评估者与生成者共享同一盲点、只优化代理指标，或永不满足停止条件。",
    },
    "group-or-hierarchical": {
      title: "群组或层级拓扑",
      control: "角色按共享议程、主持规则或父子层级协作；通信边与写入权限必须明确。",
      bestWhen: "任务需要多种专业视角，且组织结构、讨论协议或分层汇总确实带来可测收益。",
      failureSignal: "全互联聊天造成令牌爆炸、责任稀释、循环争论，或把“群体”误当作质量保证。",
    },
  },
  modules: {
    "workflow-agent-boundary": {
      kicker: "01 · 先证明自治值得",
      title: "何时不用智能体：工作流、单智能体与多智能体边界",
      summary:
        "把“能不能用智能体”改写为工程问题：任务中的不确定性在哪里，控制路径能否预先编码，失败是否可检测、可逆，以及新增自治是否带来可测收益。",
      objective:
        "为一个真实任务完成自治梯度判断，选择最小充分拓扑，并声明升级到多智能体所需的证据。",
      artifact: "自治边界说明书与拓扑选择记录",
      concepts: [
        "workflow vs agent",
        "单智能体循环",
        "多智能体必要性",
        "最小充分自治",
        "可验证性与可逆性",
      ],
      sections: [
        {
          heading: "从最简单、可验证的控制结构开始",
          paragraphs: [
            "OpenAI 与 Anthropic 都把预定义工作流和自主智能体区分开：工作流由代码规定主要控制路径，智能体则在循环内依据观察选择下一步。此处“代码主导”只表示控制转移与门禁由应用预先定义，不代表其中的模型节点或最终输出逐次相同；凡依赖模型的结果仍具随机性，必须在代表性任务上进行多次试验。链式、路由和并行并不天然需要多个智能体；很多任务用一次模型调用、普通代码或一个带工具的智能体更可靠。",
            "判断重点不是角色数量，而是任务的不确定性、步骤能否预先枚举、结果能否验收、失败是否可恢复，以及自治是否降低了总复杂度。多一个智能体就多一个提示边界、上下文副本、权限面、成本源与故障返回路径。",
          ],
          bullets: [
            "路径稳定且规则清楚：优先普通代码或代码主导的工作流。",
            "路径需语义判断但领域统一：优先单智能体循环。",
            "只有在上下文隔离、并行收益或专业控制确有证据时，才升级为多智能体。",
          ],
          sourceIds: [
            "openai-building-agents",
            "openai-practical-guide",
            "anthropic-effective-agents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "用四个门而不是“智能感”批准自治",
          paragraphs: [
            "本课程把自治升级设计成四道门：能力门回答模型能否完成；权限门回答它是否被允许行动；质量门回答结果是否达到可复现阈值；责任门回答是否仍需人类签核。四道门不能互相代替。一次权限批准不证明结果正确，质量 PASS 也不代表业务负责人已经接受风险。",
            "课程原创分析把 Session、root/lead Agent、Host、沙箱和并发槽位分层说明；这些名称在不同运行时含义不同。这只是一套分析框架，不能把任何具体数字、层级或产品行为泛化为标准。",
          ],
          bullets: [
            "记录当前方案为何不需要更多自治。",
            "为每次升级写出预期收益、额外风险、观测指标和撤回条件。",
            "把权限、质量与人类责任分别留证。",
          ],
          sourceIds: ["openai-practical-guide"],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "产品名和默认值会变，边界判据不随宣传词变化",
          paragraphs: [
            "“Agent”“workflow”“multi-agent”等标签会随 SDK 和产品页面变化，同一名称也可能对应不同控制模型。部署前应重新核对当前模型、工具、状态接口、默认轮次与安全限制；不要从一页概念指南推导某个运行时的具体保证。",
            "稳定的评审问题是：谁拥有控制权与状态？哪一步能产生副作用？什么算完成？失败后从哪里恢复？这些问题比框架是否把组件命名为 Agent 更耐久。",
          ],
          sourceIds: ["openai-building-agents"],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "默认采用代码主导的工作流或单智能体循环；仅在证据门通过后增加角色。",
        trigger: "收到范围明确、身份已验证且包含期望产物的任务请求。",
        completion: "产物通过声明的验收规则，并记录所用证据、未决问题与停止原因。",
        controlOwner: "应用控制器；模型只能在授予的自治窗口内选择下一步。",
        stateOwner: "应用数据库中的任务记录，而不是聊天历史。",
        contextBoundary: "只向模型提供完成当前步骤必需且已授权的材料。",
        toolAuthority: "默认只读；任何外部写入都需要独立权限规则与可审计确认。",
        delegationPayload: "本模块默认不委派；若升级，必须传目标、范围、输入、输出模式和返回地址。",
        concurrencyPolicy: "初始并发为 1；测得独立性和收益后再开放。",
        failurePolicy: "失败即停止并保留输入、轨迹摘要和部分产物，不自动扩大自治重试。",
        evidence: "拓扑选择记录、验收结果、成本/延迟基线和风险登记。",
        escalation: "无法验证、可能造成不可逆影响或需要新增权限时交给人类负责人。",
      },
      practice: {
        title: "绘制自治梯度卡",
        brief:
          "选择一个你原本打算做成多智能体的任务，用证据决定它应停在普通代码、工作流、单智能体还是多智能体。",
        steps: [
          "把输入、期望输出、可接受错误和不可逆影响写成一句任务定义。",
          "标记可用代码预先决定的步骤，以及确需语义判断的步骤。",
          "分别画出最简单方案和多智能体方案，计算新增控制边、状态副本与权限面。",
          "写出升级指标、回退条件，以及权限门、质量门、责任门的负责人。",
        ],
        artifact: "一页自治边界说明书、两张候选拓扑图和一条选择决议。",
        reviewGate:
          "评审者能指出为什么当前拓扑是最小充分方案，也能说出何种证据会触发升级或降级。",
        template:
          "# 自治边界说明书\n\n## 任务与不可逆影响\n- 输入：\n- 产物：\n- 不可接受结果：\n\n## 自治梯度\n| 方案 | 需要模型判断 | 新增控制边 | 权限面 | 验收方法 |\n|---|---|---:|---|---|\n| 普通代码/工作流 |  |  |  |  |\n| 单智能体 |  |  |  |  |\n| 多智能体 |  |  |  |  |\n\n## 决议\n- 选择：\n- 升级证据：\n- 回退条件：\n- 权限/质量/责任负责人：\n\n## 观测窗口\n- 成功率/延迟/单位成功成本基线：\n- 何时复核：\n- 决议版本与批准者：",
      },
      checkpoint: {
        question: "什么情况最能证明应从单智能体升级为多智能体？",
        options: [
          "团队希望产品演示看起来更先进。",
          "可以创建更多角色名称。",
          "经评估证实上下文隔离或独立并行显著提高任务成功率，并且新增控制与恢复成本可接受。",
          "单次调用偶尔回答得慢。",
        ],
        correctIndex: 2,
        explanation:
          "多智能体是增加控制面和故障面的架构选择，必须由可测收益与可治理风险共同证明。",
      },
      lab: {
        title: "模式选择器：最小充分拓扑",
        instruction:
        "调整语义不确定性、有序依赖与共享写入，比较确定性代码、单个有界智能体和有界扇出的最小充分拓扑。",
        evidencePrompt:
        "说明哪个活动控制项改变了拓扑决策、哪项基线测量会挑战它，以及本模拟尚未覆盖的现实约束。",
      },
      takeaway:
        "成熟的编排从拒绝不必要的自治开始：最少的控制边通常意味着更高的可解释性和更低的恢复成本。",
    },
    "task-graphs-contracts": {
      kicker: "02 · 把提示词变成系统图",
      title: "任务图、执行契约与状态边界",
      summary:
        "角色描述只能表达意图；可运行的编排还需要节点前置条件、输入输出模式、控制边、状态所有者、完成判据、失败边和副作用边界。",
      objective:
        "把一个自然语言需求转换为可执行、可恢复、可验证的任务图，并为关键节点写出 12 项契约。",
      artifact: "版本化任务图与节点契约集",
      concepts: [
        "DAG 与状态图",
        "控制边 / 数据边",
        "前置与后置条件",
        "完成语义",
        "失败边与补偿边",
        "状态所有权",
      ],
      sections: [
        {
          heading: "先画依赖，再选择智能体",
          paragraphs: [
            "官方编排资料展示了顺序、并行、路由、循环、交接和群组等构造；图运行时也把检查点、人工评审与时间回溯作为显式能力。共同的工程含义是：先表达任务依赖和控制结构，再决定哪个节点由代码、模型、工具或人完成。",
            "一条边至少要说明传什么、何时可走、由谁确认。控制边决定下一个可运行节点，数据边传递类型化产物，授权边允许副作用，恢复边说明失败或中断后去哪里。把它们混成一句“完成后通知经理”会使运行时只能猜。",
          ],
          bullets: [
            "DAG 适合无回路依赖；需要返工、等待或人工中断时使用显式状态图。",
            "节点输出要能被下游机器校验，而非只写“高质量总结”。",
            "完成必须区分 succeeded、failed、cancelled、interrupted 与 outcome_unknown。",
          ],
          sourceIds: [
            "openai-sdk-orchestration",
            "anthropic-effective-agents",
            "microsoft-agent-framework",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "12 项契约让图可以被质询",
          paragraphs: [
            "课程把每个关键节点固定为十二项：拓扑、触发、完成、控制所有者、状态所有者、上下文边界、工具权限、委派载荷、并发政策、失败政策、证据与升级。它不是某个 SDK 的 API，而是一张跨框架评审表。",
            "特别要把“谁运行”与“谁拥有任务状态”分开。Host 是执行环境，Session/Thread 是记录或上下文容器，root/lead Agent 是任务树中的协调角色；这些对象可能同机，也可能分离。并发槽位描述运行时容量，不等于 Host 数量，也不天然等于允许的团队规模。",
          ],
          sourceIds: ["openai-sdk-orchestration"],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "框架支持一种图，不等于它保证你的语义",
          paragraphs: [
            "图 API、检查点、群组聊天和 time-travel 等接口随框架版本变化；同一仓库还可能包含不同语言或组件的独立发布线。依赖锁必须精确到所用组件，并用最小运行例验证中断、恢复和返回类型。",
            "无论框架是否提供 durable execution，业务完成语义、外部副作用和人工责任仍由应用定义。框架能恢复节点，不会自动知道一封邮件是否已送达或一次付款是否需要人工对账。",
          ],
          sourceIds: ["microsoft-agent-framework"],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "显式状态图；无回路子图可实现为 DAG，返工和中断使用命名状态。",
        trigger: "任务记录满足前置条件、输入模式校验通过且版本已锁定。",
        completion: "到达命名终态并通过产物模式、业务后置条件和效果核对。",
        controlOwner: "图调度器拥有节点推进权；节点不得自行跳过未满足的依赖。",
        stateOwner: "应用任务存储保存规范状态，节点只提交带版本的状态变更。",
        contextBoundary: "每个节点只读取声明的数据边和授权检索结果。",
        toolAuthority: "工具权限附着于节点和任务身份，而非泛化给整个团队。",
        delegationPayload: "task_id、caller_id、目标、输入引用、输出模式、截止时间、回传地址。",
        concurrencyPolicy: "只对没有写冲突且依赖已满足的节点并行；共享写入串行化。",
        failurePolicy: "失败写入命名状态和错误分类，沿显式失败边重试、补偿或升级。",
        evidence: "节点事件、输入输出哈希、验收结果、效果账本引用和版本信息。",
        escalation: "图无合法出边、完成语义不明确或效果状态未知时进入人工对账队列。",
      },
      practice: {
        title: "把需求改写为可恢复任务图",
        brief:
          "选择一个至少包含判断、并行读取和一次外部写入的流程，建立控制边与数据边分离的图。",
        steps: [
          "列出终态以及每个终态可被观测验证的条件。",
          "画出节点、控制边、数据边、授权边、失败边和人工中断点。",
          "为外部写入节点填写完整 12 项契约与 outcome_unknown 路径。",
          "用一次成功、一次上游失败和一次写入超时对图做桌面演练。",
        ],
        artifact: "任务图、节点清单、状态枚举和三条演练记录。",
        reviewGate:
          "另一位工程师无需阅读提示词，也能从图判断何时执行、何时停止、谁拥有状态及如何处理未知结果。",
        template:
          "# 任务图契约\n\n## 终态\n- succeeded：\n- failed：\n- cancelled：\n- interrupted：\n- outcome_unknown：\n\n## 节点表\n| 节点 | 前置 | 输入模式 | 输出模式 | 控制者 | 状态写入 | 副作用 | 失败边 |\n|---|---|---|---|---|---|---|---|\n|  |  |  |  |  |  |  |  |\n\n## 关键节点 12 项契约\n- 拓扑/触发/完成：\n- 控制/状态所有者：\n- 上下文/权限：\n- 委派/并发：\n- 失败/证据/升级：\n\n## 演练记录\n1. 成功：\n2. 上游失败：\n3. 结果未知：",
      },
      checkpoint: {
        question: "一个外部写入节点超时后，哪种图设计最可靠？",
        options: [
          "立即把节点标为 failed 并无限重试。",
          "把聊天摘要当作最终状态。",
          "进入 outcome_unknown，先通过效果账本或外部查询核对，再决定确认、补偿或人工对账。",
          "让下游节点猜测写入是否成功。",
        ],
        correctIndex: 2,
        explanation:
          "超时只说明没有及时得到响应，不能证明副作用未发生；必须显式表示不确定结果。",
      },
      lab: {
        title: "图契约检查器",
        instruction:
        "切换迟到工作者、无效返回目标与部分汇合；三项不变量全部修复后，终态才能成为权威记录。",
        evidencePrompt:
          "提交修复前后图的差异，并说明至少一个框架不会替你定义的业务完成语义。",
      },
      takeaway:
        "可靠编排的基本单位不是 Agent，而是一个拥有明确控制、状态、完成和恢复语义的节点契约。",
    },
    "chaining-routing": {
      kicker: "03 · 让代码拥有稳定路径",
      title: "链式处理与双层路由：规则负责边界，模型负责语义",
      summary:
        "用顺序节点把复杂任务拆成可验收产物，用代码路由处理确定性政策，用模型路由处理开放语义，并为拒绝、低置信和模式错误保留显式分支。",
      objective:
        "实现一个带中间门、结构化输出、确定性政策路由和语义分类路由的可回归工作流。",
      artifact: "路由矩阵、结构化模式与链式执行说明",
      concepts: [
        "prompt chaining",
        "code-directed routing",
        "LLM-directed routing",
        "Structured Outputs",
        "refusal / incomplete",
        "fallback",
      ],
      sections: [
        {
          heading: "链条把质量门放在步骤之间",
          paragraphs: [
            "链式模式适合任务能稳定分段且中间结果可验证的场景。每个节点只承担一种变换，输出通过类型和语义门后才进入下游；不合格时应修复、降级或停止，而不是把模糊文本继续传递。",
            "路由有两层：合规、租户、地区、金额、工具权限等硬边界应由代码决定；意图、主题或专家选择等开放分类可由模型输出严格模式，再由应用校验并执行。OpenAI 的结构化输出能够约束受支持的 JSON 形状，但不证明分类真实、行动获授权或内容安全。",
          ],
          bullets: [
            "先用代码排除不允许的路径，再让模型在允许集合中判断。",
            "为 other、low_confidence、refusal 与 incomplete 设置可观察分支。",
            "路由结果只是建议；应用才是执行控制者。",
          ],
          sourceIds: [
            "anthropic-effective-agents",
            "openai-sdk-orchestration",
            "openai-structured-outputs",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "用路由矩阵而不是“聪明提示词”管理边界",
          paragraphs: [
            "路由矩阵应列出类别定义、正反例、允许目的地、所需权限、低置信处理和观测指标。语义路由后再通过代码核对目的地是否属于租户、地区和角色的允许集合，从而把模型判断与政策执行分开。",
            "链式工作流还应保留每个中间产物的版本、验证结果和来源引用。这样回归失败时可以定位是分类、变换、模式还是下游规则发生变化，而不必只检查最终回答。",
          ],
          sourceIds: ["openai-sdk-orchestration", "claude-academy-api"],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "模式兼容与课程内容都需要版本复核",
          paragraphs: [
            "严格模式支持的 JSON Schema 子集、拒绝/不完整状态以及 SDK 的路由示例会变化。上线前应针对锁定模型和 SDK 运行模式兼容测试，不能只因为开发期解析成功就假定未来兼容。",
            "Claude Academy 提供官方学习路径，但页面、测验和示例属于随产品更新的课程内容。本课程只转述概念并链接来源；实现时以当前 API 文档和本地验证为准。",
          ],
          sourceIds: ["openai-structured-outputs", "claude-academy-api"],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "代码控制的链式工作流，内含一次受限语义路由。",
        trigger: "任务输入通过调用者身份、硬政策、租户范围和基础数据模式的共同校验。",
        completion: "所有必需节点通过中间门，最终产物与路由审计记录同时写入。",
        controlOwner: "应用路由器；模型只返回候选类别和可选置信证据。",
        stateOwner: "应用保存当前节点、模式版本、路由决定和中间产物引用。",
        contextBoundary: "每一节点接收最小前序产物，不自动携带完整聊天。",
        toolAuthority: "目的地工具集合由代码按身份和类别求交集。",
        delegationPayload: "类别、规范化输入、模式版本、允许目的地、截止时间和返回格式。",
        concurrencyPolicy: "主链顺序执行；只有无依赖的辅助验证可限额并行。",
        failurePolicy: "模式错误、拒绝、低置信和 unknown 分别进入修复、人工或安全默认分支。",
        evidence: "原始输入哈希、路由类别、规则版本、中间门结果与最终验收。",
        escalation: "政策冲突、类别无匹配或连续两次修复失败时交由人工分类。",
      },
      practice: {
        title: "设计双层路由器",
        brief:
          "为客服、代码审查或研究请求建立一个先执行硬政策、再执行语义分类的路由流程。",
        steps: [
          "列出必须由代码判定的租户、地区、权限与高风险规则。",
          "定义互斥语义类别、other 类别以及四个边界反例。",
          "为模型路由结果写严格模式，并定义 refusal、incomplete 与低置信处理。",
          "建立至少十二条回归样例，测量误路由、拒绝、延迟和单位成功成本。",
        ],
        artifact: "路由矩阵、JSON 模式、状态机与回归样例集。",
        reviewGate:
          "安全评审者能证明模型无法选择政策不允许的目的地，测试者能重现每个降级分支。",
        template:
          "# 双层路由契约\n\n## 代码政策层\n| 条件 | 允许集合 | 拒绝/升级 |\n|---|---|---|\n|  |  |  |\n\n## 语义路由层\n| 类别 | 定义 | 正例 | 反例 | 目的地 | 低置信处理 |\n|---|---|---|---|---|---|\n|  |  |  |  |  |  |\n\n## 输出模式\n- schema_version：\n- category：\n- evidence：\n- confidence_band：\n\n## 回归与安全默认\n- refusal：\n- incomplete：\n- unknown：\n- 连续修复上限：",
      },
      checkpoint: {
        question: "关于 Structured Outputs，哪项说法正确？",
        options: [
          "只要 JSON 符合模式，分类就一定真实且行动已获授权。",
          "模式约束可支持输出形状，但真值、授权、安全及 refusal/incomplete 仍需应用处理。",
          "结构化输出可以替代所有代码政策。",
          "模式错误时应默认选择权限最大的目的地。",
        ],
        correctIndex: 1,
        explanation:
          "结构正确只解决接口形状；语义正确性与行动权限属于不同控制层。",
      },
      lab: {
        title: "模式选择器：链式还是路由",
        instruction:
        "让已知、模糊与拒绝输入分别经过封闭结构化路由、显式 unknown 路径和高风险人工复核门。",
        evidencePrompt:
          "记录一个必须由代码路由的条件和一个适合模型路由的条件，并给出各自失败默认值。",
      },
      takeaway:
        "稳健路由不是把控制权交给分类模型，而是让模型处理语义、让代码执行边界，并让每个不确定状态有去处。",
    },
    "parallel-fanout-fanin": {
      kicker: "04 · 并行不是一种东西",
      title: "并行扇出—汇合：四个并发平面与确定性聚合",
      summary:
        "区分单轮多工具调用、SDK 工具处理器并发、应用层多智能体运行与托管多智能体；只在独立性成立时扇出，并用可复现的 join 契约处理缺失、分歧和取消。",
      objective:
        "为一个可并行任务证明依赖独立性，设置并发预算、背压与取消策略，并实现稳定聚合和部分结果政策。",
      artifact: "并发平面图、扇出清单与聚合契约",
      concepts: [
        "fan-out / fan-in",
        "并发平面",
        "provider parallel tool calls",
        "application-level parallel runs",
        "关键路径（critical path）",
        "背压与尾延迟",
        "确定性 join",
      ],
      sections: [
        {
          heading: "先确认独立性，再换取墙钟时间",
          paragraphs: [
            "Anthropic 的并行模式与 OpenAI 的应用层编排示例都把独立子任务作为并发前提。适合并行的工作不依赖彼此的未提交结果，不争用同一写入资源，并能被单独取消或重试。并行可能降低墙钟时间，也可能增加总令牌、协调开销和尾延迟。",
            "OpenAI function calling 允许模型在一轮中提出多个工具调用；这只是提供者侧的调用表达。SDK 在本地并发执行工具处理器、应用同时运行多个完整 Agent，以及 Responses 托管 root/subagent，是不同控制平面，拥有不同的状态、失败、配额与取消语义。",
          ],
          bullets: [
            "单轮多个 tool calls ≠ 多个完整智能体。",
            "本地异步执行 ≠ 托管多智能体任务树。",
            "并发上限必须绑定具体运行时、账户、版本与任务树语义。",
          ],
          sourceIds: [
            "anthropic-effective-agents",
            "openai-sdk-orchestration",
            "openai-function-calling",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "聚合器是正确性边界，不是最后写一段总结",
          paragraphs: [
            "工程上应先定义 join：等待全部、达到经逐项校验的 k-of-n 结果阈值、选择首个有效结果，还是在截止时间返回带缺失标记的部分结果。k-of-n 是应用完成规则，不是分布式共识 quorum，也不是用多数票证明真值。聚合顺序要稳定，冲突解决规则要可测试；证据、置信边界和失败分支不能在摘要中消失。",
            "对写任务采用隔离工作区、单写者或提交队列。在带预计时长且没有额外资源约束的依赖 DAG 中，关键路径（critical path）是累计权重最大的依赖路径，决定依赖约束下的最早完工时间。存在有限 worker、队列或共享资源时，必须另算资源约束调度与 makespan：依赖关键路径只是下界，资源争用、重试和尾延迟会移动实测瓶颈；节点最多的链从来不等于关键路径。只有在协调开销不会吞掉收益时，才并行合格工作。工作者可以并行提出补丁，但共享状态的合并和外部副作用应串行验收。",
          ],
          sourceIds: [
            "openai-sdk-orchestration",
            "openai-agents-python-patterns",
            "oracle-critical-path",
            "etcd-quorum-glossary",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "托管多智能体是版本敏感的前沿案例",
          paragraphs: [
            "截至 2026-08-23，Responses Multi-agent 是仅适用于全部 GPT-5.6 模型的 Beta，通过 `multi_agent.enabled` 和 `responses_multi_agent=v1` 启用。`multi_agent.max_concurrent_subagents` 统计整棵树中同时活跃的子智能体 turn，包含子、孙及更深后代，但排除 `/root`；官方默认值与推荐值均为 `3`。该字段没有 API 固定上界，单次运行也没有固定树深或累计创建子智能体总数限制，但这绝不等于可以取消应用的宽度、深度、成本与停止预算。",
            "同一份 Responses 文档明确：启用 Multi-agent 时不支持 `/responses/compact`、`reasoning.summary` 和 `max_tool_calls`；服务端自动压缩会隐式开启，并分别作用于 root 与各子智能体。Codex 是另一运行时：`agents.max_concurrent_threads_per_session` 限制同时打开的 spawned-agent threads，排除 primary；未设置时由 Codex 选择默认值，官方页面没有承诺具体数字，旧别名为 `agents.max_threads`。Codex 文档也没有声明 Responses 的“无固定深度/累计总数限制”，不可迁移该结论。",
            "Codex 子智能体继承当前沙箱、权限模式和实时覆盖设置，也可把个别自定义 Agent 收紧为 read-only。沙箱决定普通执行边界内命令在技术上能触及什么；审批策略决定何时必须暂停，其中可能包括获批后在普通边界之外运行或使用网络的升级动作。因此审批是决策门而非隔离，两者也都不是并发计数器。容量表必须记录字段、计数对象、root/primary 排除项、默认值来源、队列与继承语义。",
          ],
          sourceIds: [
            "openai-responses-multi-agent",
            "openai-codex-subagents",
            "openai-codex-sandbox-security",
            "openai-agents-python-patterns",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "有限宽度 fan-out，由单一聚合器执行确定性 fan-in。",
        trigger: "依赖分析证明子任务无未满足数据依赖且无未协调写冲突。",
        completion: "达到 join 条件，所有分支都有 succeeded、failed、cancelled 或 missing 状态。",
        controlOwner: "应用调度器拥有派发、背压、截止和取消权。",
        stateOwner: "父任务保存分支清单、状态和聚合版本；分支不能覆盖父状态。",
        contextBoundary: "每个分支只获得其输入切片与共同验收标准。",
        toolAuthority: "按分支最小化；共享写工具只能经提交队列调用。",
        delegationPayload: "branch_id、输入分片、禁止范围、输出模式、截止时间与父任务返回地址。",
        concurrencyPolicy: "并发上限按已验证运行时配置，队列实施背压；禁止未界定的递归扇出。",
        failurePolicy: "分支超时按 join 政策取消、降级或标缺失，不因一个失败无限扩大扇出。",
        evidence: "派发/开始/结束时间、运行时与配置、分支产物哈希、取消原因和聚合决定。",
        escalation: "冲突无法按预设规则解决、关键分支缺失或成本即将越界时中止并请求人类裁决。",
      },
      practice: {
        title: "设计一个有界扇出—汇合",
        brief:
          "将一个多来源研究或多文件检查任务拆成独立分支，并证明并行比顺序更值得。",
        steps: [
          "绘制数据依赖与写入资源矩阵，删除不真正独立的候选分支。",
          "选择具体并发平面，并记录运行时、版本、上限定义和队列策略。",
          "定义 join 条件、稳定排序、冲突规则、部分结果和取消传播。",
          "用一条慢分支、一条失败分支和两条冲突结果进行故障注入。",
        ],
        artifact: "依赖矩阵、并发平面图、join 契约和故障注入记录。",
        reviewGate:
          "评审者能区分四类并发，证明共享写入不会竞态，并重现缺失分支下的聚合结果。",
        template:
          "# 并行编排契约\n\n## 并发平面\n- 运行时/版本：\n- 平面：单轮工具调用 / SDK 本地 / 应用多运行 / 托管任务树\n- 上限的精确定义：\n\n## 分支与依赖\n| branch_id | 输入 | 依赖 | 写资源 | 截止 | 输出模式 |\n|---|---|---|---|---|---|\n|  |  |  |  |  |  |\n\n## Join\n- 条件：all / validated-k-of-n / first-valid / deadline-partial\n- k / n 与逐结果校验器：\n- 稳定排序：\n- 冲突解决：\n- 缺失标记：\n- 取消传播：\n\n## 故障注入结果\n- 慢分支：\n- 失败分支：\n- 冲突结果：",
      },
      checkpoint: {
        question: "模型在一个响应中返回三个 function calls，能直接推导出什么？",
        options: [
          "三个完整智能体正在并行运行。",
          "模型提出了多个工具调用；是否以及如何并发执行、共享状态和处理失败仍由具体 SDK/应用决定。",
          "外部副作用必定 exactly-once。",
          "无需设置并发预算。",
        ],
        correctIndex: 1,
        explanation:
          "提出多个调用只描述一种协议层表达，不能推导完整智能体运行或应用调度语义。",
      },
      lab: {
        title: "图契约：并行与 Join",
        instruction:
        "在 all、validated-k-of-n、first-valid 与 best-effort 汇合下切换慢分支、无效返回与重复交付。",
        evidencePrompt:
          "给出一个并行更快但整体更差的配置，并说明你会收紧哪一项预算或依赖。",
      },
      takeaway:
        "并行的价值来自可证明的独立性；正确性来自显式聚合、背压和取消，而不是来自更多同时活动的角色。",
    },
    "manager-roles-ownership": {
      kicker: "05 · 一个答案只能有一个所有者",
      title: "经理、角色契约与最终答案所有权",
      summary:
        "让经理保留用户关系和最终答案，把专家变成受限能力；为规划者、执行者、验证者和批准者分开权限与成功标准，避免“人人参与、无人负责”。",
      objective:
        "设计一套经理—专家拓扑，明确控制权、状态所有权、最终答案所有权以及独立质量验证。",
      artifact: "角色卡、控制权表与最终答案责任链",
      concepts: [
        "manager pattern",
        "agents-as-tools",
        "final-answer owner",
        "role contract",
        "separation of duties",
        "independent verifier",
      ],
      sections: [
        {
          heading: "经理保留控制，专家返回有界产物",
          paragraphs: [
            "OpenAI 的 manager/agents-as-tools 模式让一个中央智能体拥有对话和最终回答，专家以工具形式完成特定任务。它适合需要统一政策、语气、全局上下文和跨领域综合的场景。Anthropic 的研究系统则展示 lead researcher 动态委派并汇总并行子任务的实践。",
            "角色应按责任而非人格设计：规划者决定分解，执行者产生产物，验证者依据量规检查，批准者对高影响行动作人类决定。一个角色可承担多个低风险职责，但高风险写入不应由同一角色提出、批准并宣称成功。",
          ],
          sourceIds: [
            "openai-agents-orchestration",
            "openai-practical-guide",
            "anthropic-research-system",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "控制权、运行环境和容量不能混为一谈",
          paragraphs: [
            "课程用四张表避免概念滑移：任务树说明谁委派谁，执行拓扑说明在哪个 Host/沙箱运行，容量表说明当前可并发多少工作，责任表说明谁对答案和副作用负责。root/lead 是协调角色，不是操作系统 root；Host 是执行环境，不是团队成员数。",
            "经理必须公布最终答案的证据构成：哪些专家产物被采用、哪些被拒绝、如何处理冲突、哪些未知仍保留。专家返回“完成”不是验收，经理的流畅总结也不能替代独立检查。",
          ],
          sourceIds: ["openai-practical-guide"],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "同名角色在不同运行时可能拥有不同控制模型",
          paragraphs: [
            "Agents-as-tools、lead researcher、root agent 和 supervisor 等名称没有跨框架统一语义。部署前应验证专家是否能继续多轮、是否继承历史、是否能生成后代、结果如何回传，以及调用完成后谁拥有下一轮。",
            "Anthropic 报告的多智能体研究质量与令牌倍数来自其内部系统，能说明经济性值得测量，不能当作所有任务的性能常数，更不能据此省略本地基线、重复试验与失败分析。",
          ],
          sourceIds: ["openai-agents-orchestration", "anthropic-research-system"],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "中央经理调用多个受限专家；独立验证者不向产出专家汇报质量结论。",
        trigger: "经理确认任务需要跨专业综合，并能定义专家的有界交付物。",
        completion: "经理交付最终答案，同时附专家证据、冲突决议、验证结果和未决项。",
        controlOwner: "经理拥有对话和下一步；人类批准者拥有高影响副作用决策。",
        stateOwner: "应用任务记录；经理提交协调状态，专家只能写自己的产物空间。",
        contextBoundary: "经理持有全局最小摘要，专家只见目标、必要输入和验收标准。",
        toolAuthority: "各专家按职责和任务对象实施最小授权；独立验证者默认只有证据读取权限。",
        delegationPayload: "角色、问题、范围、禁止项、输入引用、输出模式、证据要求和截止时间。",
        concurrencyPolicy: "独立专家可限额并发；共享文件或同一外部对象由单写者合并。",
        failurePolicy: "专家失败不会被经理改写为成功；可替换、降级或在最终答案中显式保留缺口。",
        evidence: "委派记录、专家返回、采用/拒绝理由、验证报告和最终答案版本。",
        escalation: "专家冲突触及政策、安全或不可逆决策时，由命名人类负责人裁决。",
      },
      practice: {
        title: "建立角色—控制权矩阵",
        brief:
          "为一个跨研究、实现和审查的任务设计经理、专家、验证者与批准者的责任链。",
        steps: [
          "列出每个角色唯一负责的决定和不得执行的行动。",
          "分别绘制任务树、Host/沙箱拓扑、容量限制和最终责任链。",
          "定义专家返回信封以及经理处理冲突、缺失和拒绝的规则。",
          "用“专家都说完成但验证失败”场景演练经理的最终响应。",
        ],
        artifact: "角色卡、四层拓扑图、控制权矩阵与冲突演练记录。",
        reviewGate:
          "任何时间点都能唯一定位控制者、状态所有者、最终答案所有者和副作用批准者。",
        template:
          "# 角色与所有权\n\n## 角色卡\n| 角色 | 唯一责任 | 禁止行动 | 输入 | 产物 | 成功判据 |\n|---|---|---|---|---|---|\n| 经理 |  |  |  |  |  |\n| 专家 |  |  |  |  |  |\n| 验证者 |  |  |  |  |  |\n| 批准者 |  |  |  |  |  |\n\n## 四张图\n- 任务树：\n- Host/沙箱：\n- 容量：\n- 责任链：\n\n## 冲突规则\n- 证据冲突：\n- 专家缺失：\n- 验证失败：\n\n## 最终答案责任\n- 最终答案所有者：\n- 采用/拒绝专家意见的记录位置：\n- 必须升级给人类的分歧：",
      },
      checkpoint: {
        question: "在经理调用专家模式中，谁通常拥有最终用户回答？",
        options: [
          "最后一个完成的专家。",
          "中央经理；专家返回有界产物供其综合。",
          "运行专家的 Host。",
          "并发槽位最多的进程。",
        ],
        correctIndex: 1,
        explanation:
          "经理是运行时控制与最终综合所有者；Host 和容量不是责任主体，适用的发布、组织与法律责任仍由命名的人类和机构承担。",
      },
      lab: {
        title: "交接契约：谁拥有答案",
        instruction:
        "显式指定最终答案、持久状态与外部行动授权所有者；任一所有者缺失时保持阻止。",
        evidencePrompt:
          "提交一个不应交接的场景和一个必须交接的场景，分别解释最终答案所有权。",
      },
      takeaway:
        "角色越多，责任越要收敛：经理拓扑的价值不在于“有人指挥”，而在于控制权和最终答案始终可定位。",
    },
    "delegation-handoffs": {
      kicker: "06 · 委派不等于移交",
      title: "Agents-as-tools 与 Handoff：控制权、连续性和返回路径",
      summary:
        "区分专家返回一次结果与专家接管后续轮次；用结构化委派包、last-agent 连续性、返回信封和调用者身份防止上下文丢失与责任漂移。",
      objective:
        "为同一业务场景分别设计经理调用和控制权交接，选择其一并通过中断、拒绝与回传测试。",
      artifact: "委派/交接协议、控制权时间线与返回信封",
      concepts: [
        "agents-as-tools",
        "handoff",
        "last agent",
        "continuity",
        "return envelope",
        "caller / destination identity",
      ],
      sections: [
        {
          heading: "先问“下一轮由谁负责”",
          paragraphs: [
            "OpenAI 明确区分两种编排：agents-as-tools 中经理调用专家并保留控制；handoff 中专家成为后续运行的控制者。运行结果还可能包含 last-agent、历史和中断状态，应用若希望下一轮延续同一专业角色，就必须保存并恢复这些所有权信息。",
            "Claude Academy 与 Agent SDK 的 subagent 模式强调独立上下文、受限工具和结构化返回；它更接近有界委派，不应仅凭“subagent”名称推断永久交接。跨框架比较应观察实际控制模型，而不是映射名词。",
          ],
          sourceIds: [
            "openai-agents-orchestration",
            "openai-results-state",
            "claude-academy-subagents",
            "claude-sdk-subagents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "委派包和返回信封共同封闭通信回路",
          paragraphs: [
            "委派包至少包含 task_id、caller_id、目标、非目标、输入引用、权限边界、输出模式、证据要求、截止时间和 return_to。返回信封包含状态、产物引用、证据、已执行副作用、未决问题、阻塞原因和下一步建议。自然语言中的“交回主 Agent”不能作为唯一返回地址。",
            "控制权时间线要分别记录对话所有者、任务状态所有者和工具权限。Session 是记录/上下文容器，root/lead 是任务协调角色，Host 是运行环境；它们不能代替 caller_id 或 return_to。",
          ],
          sourceIds: ["claude-academy-subagents"],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "连续性行为必须针对 SDK 版本做集成测试",
          paragraphs: [
            "不同 SDK 对交接后的历史、最后智能体、子智能体可见性、工具继承与恢复状态处理不同。即使同一 SDK，序列化结果和中断接口也会演进。升级前应回放多轮交接、人工中断和恢复，不要只测试首轮回答。",
            "子智能体的摘要是有损信道；框架能成功返回字符串，不代表证据、未知和副作用记录完整。生产协议应以类型化字段和持久产物为准，并通过交接后的多轮回放确认所有权没有悄然改变。",
          ],
          sourceIds: [
            "openai-results-state",
            "claude-sdk-subagents",
            "openai-agents-orchestration",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "默认经理调用专家；只有需要持续专业对话和独立政策时使用 handoff。",
        trigger: "路由决定包含目标角色、理由、身份与允许的控制转移。",
        completion: "委派以返回信封结束；交接以命名终态、再交接或人工接管结束。",
        controlOwner: "每次转移写入 control_owner；不能由最后发言者隐式推断。",
        stateOwner: "应用保存 task_id、conversation/run 引用、last-agent 和转移事件。",
        contextBoundary: "按角色过滤历史；敏感字段不因交接自动继承。",
        toolAuthority: "接收者权限重新求值，不继承调用者的全部能力。",
        delegationPayload: "task_id、caller_id、return_to、目标/非目标、输入引用、模式、预算、权限和证据要求。",
        concurrencyPolicy: "同一对话控制权任一时刻唯一；并行委派使用独立 branch_id。",
        failurePolicy: "无法接受、阻塞或中断均返回结构化状态，调用者不得把无返回当成完成。",
        evidence: "控制权时间线、委派包、返回信封、状态序列化版本和恢复测试。",
        escalation: "出现循环交接、无 return_to、权限扩大或最终答案所有者不明时停止并交人工。",
      },
      practice: {
        title: "写一份可恢复的交接协议",
        brief:
          "选择一个客服升级、研究专家或代码修复场景，比较有界委派与真正交接。",
        steps: [
          "分别画出 agents-as-tools 与 handoff 的控制权时间线。",
          "填写委派包和返回信封，加入 caller_id、return_to、未决问题与副作用字段。",
          "设计下一轮连续性测试：last-agent 丢失、恢复后角色错误和权限重新求值。",
          "注入拒绝、超时和循环交接，验证停止与人工接管。",
        ],
        artifact: "两条控制权时间线、选型决议、JSON 协议与故障测试记录。",
        reviewGate:
          "从任一事件都能推导当前控制者和返回目的地；恢复后不会悄悄回到错误角色或扩大权限。",
        template:
          "# 委派与交接协议\n\n## 选型\n- agents-as-tools / handoff：\n- 为什么：\n\n## 委派包\n- task_id / branch_id：\n- caller_id / return_to：\n- 目标 / 非目标：\n- 输入引用 / 输出模式：\n- 权限 / 预算 / 截止：\n- 证据要求：\n\n## 返回信封\n- status：\n- artifacts / evidence：\n- effects：\n- unknowns / blockers：\n- recommended_next：\n\n## 连续性\n- control_owner：\n- last-agent：\n- 恢复测试：",
      },
      checkpoint: {
        question: "哪项最准确地区分 agents-as-tools 与 handoff？",
        options: [
          "前者一定并行，后者一定顺序。",
          "前者由经理保留控制并综合专家结果；后者把后续控制交给接收者。",
          "前者不使用模型，后者只使用模型。",
          "两者完全相同，只是不同厂商命名。",
        ],
        correctIndex: 1,
        explanation:
          "关键不是执行顺序，而是调用结束后谁拥有对话与下一步控制。",
      },
      lab: {
        title: "交接契约：返回路径故障",
        instruction:
        "选择是否转移控制权，并要求返回信封与显式证据／副作用字段；缺少契约时，经理调用和真正交接都不得完成。",
        evidencePrompt:
          "选择一个故障，写出最小协议字段修复，并说明为什么纯自然语言不能保证返回路径。",
      },
      takeaway:
        "委派传递任务，handoff 转移控制；两者都必须把身份、连续性、证据和返回路径从隐喻变成数据。",
    },
    "orchestrator-workers-verification": {
      kicker: "07 · 动态分解必须配独立验收",
      title: "编排者—工作者、评估者—优化者与独立验证",
      summary:
        "让编排者在未知子任务下动态规划，让工作者隔离上下文并交付持久产物，让独立验证者依据外部判据决定接受、返工或停止。",
      objective:
        "为开放式任务建立动态分解、工作领取、证据回传、独立验证与有限返工协议。",
      artifact: "动态工作包、验证量规与返工状态机",
      concepts: [
        "orchestrator-workers",
        "dynamic decomposition",
        "evaluator-optimizer",
        "independent verifier",
        "durable artifacts",
        "bounded refinement",
      ],
      sections: [
        {
          heading: "动态分解适用于无法预先枚举的子任务",
          paragraphs: [
            "Anthropic 把 orchestrator-workers 用于子任务数量和形态由输入决定的场景，并在多智能体研究系统中由 lead researcher 动态委派并行研究。OpenAI 的代码编排资料则说明编排可以由模型决定，也可以由代码决定；固定边界适合代码，开放规划可以交给模型。",
            "Evaluator-optimizer 是另一条控制回路：生成者产出，评估者按明确标准反馈，生成者修订。它只有在评价标准可表达、反馈能改善结果、循环有预算时才成立。验证者不应仅复述生成者的自我评价。",
          ],
          sourceIds: [
            "anthropic-effective-agents",
            "anthropic-research-system",
            "openai-sdk-orchestration",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "工作者交付产物，验证者审查主张",
          paragraphs: [
            "课程把开放任务拆成三层：编排者维护任务图和预算；工作者在隔离上下文中产生带来源的持久产物；验证者从原始需求和验收量规出发检查覆盖、证据、冲突与未决项。若验证者只读工作者的总结，它会继承同样的遗漏。",
            "固定版本的 OpenAI pattern examples 与 Claude Cookbooks 提供最小模式骨架；长时运行 harness 资料强调进度文件、可验证增量和跨上下文恢复。综合这些资料，生产返工应指向具体失败条目，而不是让整个团队“再试一次”。",
          ],
          bullets: [
            "每个工作包只有一个可验收主产物。",
            "验证者默认只读，不拥有产出工具和上线权限。",
            "返工消息携带 failed_criteria、证据定位和剩余轮次。",
          ],
          sourceIds: [
            "openai-agents-python-patterns",
            "claude-cookbooks-patterns",
            "anthropic-harness-long-running",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "示例仓库是版本化骨架，不是持久运行时",
          paragraphs: [
            "Cookbooks 和 pattern examples 演示控制流，但不自动提供耐久状态、沙箱、权限、幂等或事故恢复。使用时必须固定 release/commit，补齐应用层契约，并针对自己的模型、工具和负载执行测试。",
            "开放式研究系统报告的质量与令牌数据来自特定内部任务。它能提醒我们把成本和协调失败纳入评估，不能证明层级越深或工作者越多越好；每个新增工作者仍须通过本任务的边际质量与成本证据。",
          ],
          sourceIds: [
            "openai-agents-python-patterns",
            "claude-cookbooks-patterns",
            "anthropic-research-system",
            "anthropic-harness-long-running",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "单编排者动态生成有限工作包，工作者产出，独立验证者按量规验收。",
        trigger: "任务开放但存在可表达的最终产物、证据要求和停止预算。",
        completion: "必需工作包均有终态，验证门通过或形成明确的未决/拒绝报告。",
        controlOwner: "编排者拥有任务图；验证者只拥有接受/返工建议，人类拥有高风险最终批准。",
        stateOwner: "应用工作队列与产物库，所有任务变更使用稳定 task_id。",
        contextBoundary: "工作者只读自己的工作包；验证者额外读取原始需求和抽样原始证据。",
        toolAuthority: "工作者按专业最小授权；验证者默认只读；编排者不能绕过权限层。",
        delegationPayload: "work_id、父任务、目标、非目标、依赖、产物路径、证据标准、预算和返回信封。",
        concurrencyPolicy: "只并行独立工作包，限制宽度与递归深度；共享写入通过单一集成者。",
        failurePolicy: "按 failed_criteria 定点返工，限制次数；无改进或预算耗尽则停止并保留缺口。",
        evidence: "任务图版本、工作包、产物哈希、验证条目、返工差异和停止原因。",
        escalation: "需求不可验收、工作包循环生成、验证者与产出者结论无法调和时交人类裁决。",
      },
      practice: {
        title: "建立工作者—验证者协议",
        brief:
          "为开放式研究、代码迁移或多文件审计设计动态工作队列和独立验证回路。",
        steps: [
          "写出最终产物、覆盖清单、证据质量和不可接受遗漏。",
          "定义编排者生成工作包的模式、去重键、依赖字段和最大深度。",
          "为验证者建立逐条量规、原始证据抽查比例和返工信封。",
          "注入重复工作包、无证据结论和两轮无改进，验证去重与停止。",
        ],
        artifact: "工作包模式、验证量规、状态机和故障演练记录。",
        reviewGate:
          "验证结论能定位到原需求、原始证据和具体失败标准；返工不会无界循环或覆盖已通过产物。",
        template:
          "# 动态编排与验证\n\n## 最终验收\n- 必需覆盖：\n- 证据质量：\n- 不可接受遗漏：\n\n## 工作包\n- work_id / parent_id：\n- 目标 / 非目标：\n- 依赖 / 去重键：\n- 产物路径 / 输出模式：\n- 预算 / 截止：\n\n## 验证量规\n| criterion_id | 判据 | 原始证据 | 通过阈值 |\n|---|---|---|---|\n|  |  |  |  |\n\n## 返工与停止\n- failed_criteria：\n- 最大返工：\n- 无改进判据：\n- 人工升级：\n- 停止后的部分产物与未决项：",
      },
      checkpoint: {
        question: "怎样让验证者更可能发现工作者的系统性遗漏？",
        options: [
          "只把工作者的自我总结交给验证者。",
          "让同一角色同时产出、批准和发布。",
          "让验证者读取原始需求、外部量规和抽样原始证据，并限制其写入权限。",
          "取消所有停止预算。",
        ],
        correctIndex: 2,
        explanation:
          "独立输入和独立标准能降低共同盲点；职责分离也避免验证变成自我认证。",
      },
      lab: {
        title: "图契约：动态工作与验证",
        instruction:
          "为未知规模任务设置工作包生成、去重、依赖、验证和返工规则，观察循环与重复工作的风险。",
        evidencePrompt:
          "提交一条能阻止无界返工的停止规则，以及验证者必须从总结之外读取的一项证据。",
      },
      takeaway:
        "动态编排不是让模型无限派活，而是把未知工作装进有限任务包，再用独立证据门收敛。",
    },
    "tools-aci-mcp": {
      kicker: "08 · 能调用不等于能行动",
      title: "工具、智能体—计算机接口（ACI）与 MCP 2026-07-28",
      summary:
        "把工具当作模型—计算机契约，沿用 Anthropic 的 ACI 概念并把课程原创的行动边界登记册与之区分，把 MCP 当作能力交换协议；同时正面处理 2026-07-28 规范与旧 Academy/SDK 示例的断代。",
      objective:
        "为一组本地、托管与 MCP 工具建立类型、权限、隔离、效果和版本契约，并完成旧 MCP 示例迁移审查。",
      artifact: "工具/ACI/MCP 能力登记册与协议迁移说明",
      concepts: [
        "function / hosted / local tool",
        "tool schema",
        "ACI",
        "MCP tools/resources/prompts",
        "approval boundary",
        "protocol migration",
      ],
      sections: [
        {
          heading: "工具接口把模型意图翻译成可审查调用",
          paragraphs: [
            "OpenAI Agents SDK 区分托管、本地函数、MCP、agent-as-tool 等工具表面；function calling 使用调用身份、参数模式和工具结果闭合模型—工具循环。Anthropic 建议工具使用清晰命名空间、严格模式、可行动错误和紧凑结果。好的描述提高可用性，却不会自动提供授权、沙箱或事务语义。",
            "远程 MCP 连接会把数据发送给第三方服务，并面临提示注入、工具描述污染和过度授权。allowed tools 与审批能缩小范围，但外部服务器的保留、身份、可用性与安全仍需单独审查。",
          ],
          bullets: [
            "参数类型说明语法；授权层决定主体能否调用。",
            "执行环境负责隔离；工具描述不能替代 OS/网络边界。",
            "工具结果需标出证据、截断、错误类别与副作用状态。",
          ],
          sourceIds: [
            "openai-tools",
            "openai-function-calling",
            "openai-mcp-connectors",
            "anthropic-writing-tools",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "ACI 是智能体—计算机接口；课程原创的是扩展行动边界登记册",
          paragraphs: [
            "Anthropic 使用“智能体—计算机接口（Agent-Computer Interface, ACI）”指智能体与工具或计算环境之间的接口，并以 HCI 类比强调工具文档和测试。本课程在沿用该术语时，把它工程化为一份扩展行动边界登记册：在 schema 之外记录主体、对象、读写类别、前置审批、幂等语义、效果核对、隔离、数据外流和人工升级。登记册是课程原创综合；ACI 术语本身不是，且它既不是 OpenAI API 对象，也不是对 MCP 的重命名。",
            "截至 2026-08-23，MCP 的 Current revision 是 `2026-07-28`。其核心为无状态、自包含请求：每个请求在 `_meta` 中携带 `io.modelcontextprotocol/protocolVersion` 与 `io.modelcontextprotocol/clientCapabilities`；客户端 SHOULD 携带 `clientInfo`，结果 SHOULD 携带 `serverInfo`。MCP 负责交换能力，不负责分解任务、运行 Agent loop、提供长期记忆、沙箱、审批或评估系统；这些仍属于编排和应用控制面。",
          ],
          sourceIds: [
            "mcp-spec-2026",
            "mcp-versioning-2026",
            "openai-mcp-connectors",
            "anthropic-writing-tools",
            "anthropic-effective-agents",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "旧 Academy 内容只作迁移反例，当前规范才是实现契约",
          paragraphs: [
            "2026-07-28 changelog 删除协议级 session 与 `Mcp-Session-Id`、`initialize` / `notifications/initialized` 握手、`ping`、`logging/setLevel`、`notifications/roots/list_changed`、Streamable HTTP GET、`resources/subscribe` / `resources/unsubscribe`，以及基于 `Last-Event-ID` 和 SSE event ID 的断流续传/重投。它引入每请求版本与能力元数据、跨调用显式 server-minted handles、服务端必须实现但客户端可选择是否预调用的 `server/discover`、`subscriptions/listen`、以 `InputRequiredResult` 加携带 `inputResponses` 重试实现的 MRTR，以及必填的 `resultType: complete | input_required`。",
            "同一修订将 Roots、Sampling、Logging、HTTP+SSE、Sampling 的 `includeContext` 值 `thisServer` / `allServers`，以及 OAuth Dynamic Client Registration 标为 Deprecated，而不是已经 Removed。兼容规则也必须写全：Current 可继续接收向后兼容更新；双方可同时支持多个 revision；`UnsupportedProtocolVersionError` 返回支持版本；`2025-11-25` 及更早握手协议走专门兼容路径；旧服务若缺少 `resultType`，客户端按 `complete` 处理；新响应流断开后要用新 request ID 重发，但这只是传输恢复，不是业务幂等。",
            "Claude Academy《MCP Advanced Topics》中的初始化、session/SSE、Roots、Sampling 与 Logging 只作为旧模型迁移对照。部署必须固定真实客户端和服务端版本，运行协商、降级与互操作测试；协议连接成功仍不授予业务权限，也不证明服务器输出安全。",
          ],
          bullets: [
            "规范版本、SDK 包版本和示例发布日期分别记录。",
            "任何出现旧 handshake/session 假设的练习先进入迁移清单。",
            "互操作以本地最小测试为证，不以课程截图或 README 印象为证。",
          ],
          sourceIds: [
            "mcp-python-sdk-v2",
            "claude-academy-mcp-legacy",
            "mcp-changelog-2026",
            "mcp-versioning-2026",
            "mcp-ts-migration-2026",
            "mcp-spec-2026",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "应用智能体通过受控工具注册表调用本地/托管/MCP 能力，授权代理位于执行前。",
        trigger: "主体身份、任务目的、参数模式与能力版本均通过校验。",
        completion: "工具结果包含状态、证据/效果引用、截断标志和可验证后置条件。",
        controlOwner: "应用策略引擎决定是否执行；模型只能提出调用。",
        stateOwner: "应用保存调用身份、审批、参数哈希、效果状态和协议版本。",
        contextBoundary: "仅发送工具完成任务所需字段；远程 MCP 数据外流显式记录。",
        toolAuthority: "按主体×任务×工具×对象求交集；写入和高风险调用需要审批或禁用。",
        delegationPayload: "tool_call_id、主体、目的、参数、schema/version、审批引用和幂等键。",
        concurrencyPolicy: "独立读取，以及由权威存储依据已证明的可交换或合并契约原子应用的写入，可限额并发；其他共享状态写入必须使用权威 CAS/OCC、带 fencing 的租约/单写者或串行化。稳定幂等键另行负责同一逻辑操作的重试去重，不能替代并发控制。",
        failurePolicy: "区分校验、授权、传输、执行与结果未知；协议错误不由模型自由改写参数重试。",
        evidence: "工具登记册、版本锁、审批事件、调用/结果哈希、效果核对和互操作测试。",
        escalation: "未知服务器、工具列表漂移、需新增数据范围或副作用结果不明时停止并人工审查。",
      },
      practice: {
        title: "创建 ACI 登记册并迁移一个旧 MCP 示例",
        brief:
          "选择三个能力：本地只读、外部写入和远程 MCP；为它们补齐控制契约，并审查一段旧 Session/handshake 示例。",
        steps: [
          "为每个工具写输入/输出模式、主体、对象、读写类别、隔离和数据外流。",
          "增加审批、幂等、效果核对、错误分类和人工升级字段。",
          "对照 MCP 2026-07-28 规范和迁移指南，标出旧 Academy 示例中过时假设。",
          "固定 Python 或 TypeScript SDK 版本，设计最小客户端—服务器互操作与拒绝测试。",
        ],
        artifact: "ACI 能力登记册、MCP 迁移差异表和互操作测试计划。",
        reviewGate:
          "安全评审者能证明模型不能凭工具描述扩大权限；实现者能说明旧示例为何不再是规范依据。",
        template:
          "# 工具 / ACI / MCP 登记册\n\n| capability_id | 类型 | 主体 | 对象 | 读/写 | schema/version | 审批 | 幂等/效果核对 | 隔离/外流 |\n|---|---|---|---|---|---|---|---|---|\n|  | local/hosted/MCP |  |  |  |  |  |  |  |\n\n## MCP 版本边界\n- 规范：2026-07-28\n- SDK/包版本：\n- 旧示例假设：\n- 迁移变化：\n- 互操作测试：\n\n## 错误与升级\n- validation：\n- authorization：\n- transport：\n- execution：\n- outcome_unknown：",
      },
      checkpoint: {
        question: "关于 MCP 2026-07-28，哪项表述最准确？",
        options: [
          "MCP 本身提供任务分解、长期记忆、沙箱和评估。",
          "旧 Claude Academy MCP Advanced 课程是当前规范的最高依据。",
          "MCP 标准化能力交换；当前实现应以 2026-07-28 规范及匹配 SDK 为准，旧课程只作迁移对照。",
          "工具 schema 已经等同于用户授权。",
        ],
        correctIndex: 2,
        explanation:
          "协议能力与编排控制是不同层；旧 Academy 内容明确不能覆盖当前版本化规范。",
      },
      lab: {
        title: "交接契约：工具与协议边界",
        instruction:
        "验证工具 schema、副作用声明、执行时授权、MCP／应用边界，以及不可信连接结果的隔离。",
        evidencePrompt:
          "选择一项被拒绝的调用，分别说明 schema、授权、隔离与协议版本中是哪一层造成拒绝。",
      },
      takeaway:
        "工具构成 ACI 的主要行动表面，课程行动边界登记册治理权限与副作用，MCP 让系统交换能力；三者任何一个都不能单独构成可靠编排。",
    },
    "context-state-memory": {
      kicker: "09 · 别把聊天历史当数据库",
      title: "上下文、对话、Session、运行状态、检查点与记忆",
      summary:
        "把 context、应用/运行状态、对话/Session、事件日志/历史、checkpoint/RunState、memory 与 compaction 七类对象分开，避免重复上下文、过期事实与不可审计恢复。",
      objective:
        "为一个长时运行任务绘制七对象信息架构，定义每类对象的写入者、读取者、保留期、敏感性和恢复语义，并跨对象治理审计证据。",
      artifact: "上下文—状态—记忆分层图与恢复表",
      concepts: [
        "application context",
        "model context",
        "conversation / session",
        "run state",
        "checkpoint",
        "compaction",
        "long-term memory",
      ],
      sections: [
        {
          heading: "同一个“上下文”至少包含两类对象",
          paragraphs: [
            "OpenAI 区分应用本地 run context 与模型可见 conversational context；运行连续性还可以由应用历史、Session、conversation ID 或 previous response 等方式提供。混用多种续接方式可能重复材料。运行结果还可能是中断而非完成，因此返回对象不能自动视为业务成功。",
            "Anthropic 把上下文视为稀缺注意力预算，建议及时检索、压缩和子智能体隔离。Managed Agents 的架构进一步区分耐久事件日志 Session、模型循环 Harness 与执行 Sandbox。这里的 Session 是运行时记录结构，不等于长期记忆或业务数据库。",
          ],
          sourceIds: [
            "openai-context-management",
            "openai-running-agents",
            "openai-results-state",
            "anthropic-context-engineering",
            "anthropic-managed-agents",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "七类状态对象各自回答不同问题",
          paragraphs: [
            "课程采用七对象模型：context 是本次推理实际可见的选择性视图；应用/运行状态保存机器可读流程事实；对话/Session 提供连续性容器；事件日志/历史记录时序事件；checkpoint/RunState 保存与版本兼容的恢复点；memory 是可在未来检索的受治理持久信息；compaction 是为上下文窗口和成本优化的压缩或延续表示。",
            "业务真相必须存放在应用控制的结构化状态中。模型摘要可以作为定位器，不能覆盖订单状态、审批结论或效果账本。写入长期记忆前要区分事实、用户偏好、暂时推断和任务产物，并设置来源、有效期与撤销。",
          ],
          sourceIds: [
            "openai-context-management",
            "openai-results-state",
            "anthropic-context-engineering",
            "anthropic-managed-agents",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "压缩与续接接口会变，语义边界必须自有",
          paragraphs: [
            "OpenAI 的 server-side/standalone compaction 和多种 continuation 策略属于当前产品接口；它们的能力、存储与兼容条件可能变化。压缩内容并非面向人类的审计记录，也不能替代显式任务状态和原始证据。",
            "升级 SDK 或迁移续接方式时，应回放长对话、交接、中断、压缩和恢复；检查是否重复上下文、丢失 last-agent、泄漏跨租户材料或把 interrupted 错判为 completed。",
            "状态写入正确性仍是应用边界。Microsoft Cosmos DB 示例仅有界展示原子获取、ETag 乐观并发、TTL 恢复和单调 fencing token 下游拒绝陈旧写入；只有实际权威存储与每个关键下游写入都执行相应原子条件和陈旧写入拒绝时，才能采用同类保证。",
          ],
          sourceIds: [
            "openai-compaction",
            "openai-running-agents",
            "openai-results-state",
            "azure-cosmos-distributed-lock",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "应用状态机驱动智能体；Session/Conversation 只提供受控连续性。",
        trigger: "新运行或恢复请求携带任务身份、状态版本、规范连续性来源，以及有意组合多层状态时的协调规则。",
        completion: "业务终态写入结构化状态，模型上下文与任务产物按保留策略归档。",
        controlOwner: "应用状态机决定推进与恢复；模型不能把摘要写成业务终态。",
        stateOwner: "应用数据库；Session、checkpoint 和 compaction 仅为关联层。",
        contextBoundary: "按节点检索最小证据，隔离租户/分支，敏感字段默认不进入模型。",
        toolAuthority: "从任务身份和当前状态重新计算，不从历史消息继承。",
        delegationPayload: "状态快照引用、必要上下文、证据定位、记忆读取范围和返回模式。",
        concurrencyPolicy: "同一状态实体由权威存储执行原子版本/CAS 条件更新，或使用带 fencing token 的单写者/租约协议拒绝陈旧写入；仅靠尽力而为的进程锁不够。并行分支只写自己的命名空间。",
        failurePolicy: "恢复前验证状态版本和效果账本；上下文缺失时停止而非编造连续性。",
        evidence: "状态变更日志、上下文来源、压缩事件、检查点版本、记忆读写和删除记录。",
        escalation: "状态与 Session 冲突、跨租户风险、恢复点不确定或记忆来源缺失时交人工。",
      },
      practice: {
        title: "绘制七对象信息生命周期",
        brief:
          "为一个跨多轮、多天且包含人工审批的任务，划分 context、应用/运行状态、对话/Session、事件日志/历史、checkpoint/RunState、memory 与 compaction。",
        steps: [
          "列出每条信息的规范来源、读取者、写入者、敏感级别与保留期。",
          "为每段对话指定一个规范连续性来源；若有意组合应用历史与服务端状态，写明协调与去重规则，并测试不会重复注入。",
          "定义 interrupted、resumed、completed 与 stale_state 的恢复条件。",
          "模拟压缩后恢复和交接后恢复，核对 last-agent、权限和业务状态。",
        ],
        artifact: "七对象图、数据生命周期表、审计关联与两次恢复演练记录。",
        reviewGate:
          "评审者能指出业务真相的唯一位置，且删除聊天、压缩上下文或重启 Host 不会改变已提交事实。",
        template:
          "# 七对象信息与恢复\n\n| 信息 | 对象 | 规范来源 | 读/写者 | 敏感性 | 保留/删除 |\n|---|---|---|---|---|---|\n|  | context / application-run state / conversation-session / event log-history / checkpoint-RunState / memory / compaction |  |  |  |  |\n\n## 续接策略\n- 规范连续性来源：history / session / conversation / previous response\n- 有意组合的对象：\n- 协调与去重规则：\n- 防重复注入测试：\n\n## 状态与恢复\n- interrupted：\n- resumed：\n- completed：\n- stale_state：\n- 权限重新计算：\n\n## 长期记忆\n- 可写入类型：\n- 来源/有效期：\n- 用户查看与删除：",
      },
      checkpoint: {
        question: "哪项最适合作为订单编排的业务真相？",
        options: [
          "模型对聊天的压缩摘要。",
          "最后一个智能体说“已经完成”。",
          "应用控制的结构化订单状态，并关联效果账本和版本。",
          "当前上下文窗口中的所有消息。",
        ],
        correctIndex: 2,
        explanation:
          "业务状态需要耐久、可并发控制和可审计；上下文与摘要是推理材料，不是规范记录。",
      },
      lab: {
        title: "上下文恢复：七对象错配",
        instruction:
        "分别丢失模型上下文、对话续接、应用 Session 或 Run State，再检验检查点、事件日志与审计链接能否重建状态。",
        evidencePrompt:
          "指出一个看似恢复成功但业务状态仍不可靠的配置，并给出核对步骤。",
      },
      takeaway:
        "上下文帮助模型推理，状态帮助系统正确运行，记忆帮助未来复用；把三者混在一起，恢复就会变成猜测。",
    },
    "budgets-concurrency-stopping": {
      kicker: "10 · 没有预算的自治不是计划",
      title: "预算、并发、背压与停止规则",
      summary:
        "同时限制轮次、深度、宽度、时间、令牌、成本和外部调用；将运行时容量与团队政策分开，并让取消、降级和停止成为显式终态。",
      objective:
        "为一个层级智能体任务建立多维预算、运行时特定并发定义、队列背压和可测试停止状态机。",
      artifact: "预算信封、容量定义与停止状态机",
      concepts: [
        "turn/depth/width budget",
        "token/cost/deadline budget",
        "runtime-specific concurrency",
        "关键路径（critical path）",
        "backpressure",
        "cancellation",
        "stopping rule",
      ],
      sections: [
        {
          heading: "预算必须沿任务树分配，而不是在结束后统计",
          paragraphs: [
            "OpenAI 的代码编排建议只并行真正独立的运行，延迟与成本指南强调减少不必要请求和令牌；Claude Agent SDK 的循环暴露轮次、预算、压缩与恢复控制。Anthropic 的研究系统也提醒多智能体可能消耗显著更多令牌，因此成本必须作为架构变量而非账单尾注。",
            "父任务派发时要把剩余时间、令牌、成本、并发和深度份额分给子任务。子任务不能把自己的局部上限当作整棵树的额外配额；完成或取消后应归还可回收的容量。",
          ],
          sourceIds: [
            "openai-sdk-orchestration",
            "openai-latency",
            "openai-cost",
            "claude-sdk-agent-loop",
            "anthropic-research-system",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "容量、控制和团队政策是三张不同的表",
          paragraphs: [
            "运行时并发回答此刻能同时执行多少工作；控制模型回答谁能创建、暂停和取消谁；团队政策回答本任务允许使用多少角色与深度。某个运行时支持后代继续生成后代，不代表项目政策应该允许它。",
            "背压应在派发前生效：队列有界、优先级明确、截止过期即取消，并持续估算当前资源约束下的 makespan 与瓶颈。容量收缩时优先保护该调度中对完工关键的工作，先削减可选分支；不要把依赖 critical path 下界误当成有限容量调度答案。停止规则同时观察任务完成、预算耗尽、无改进、重复状态、风险升级和人类中断；不能只依赖模型说“我完成了”。",
          ],
          sourceIds: [
            "openai-sdk-orchestration",
            "claude-sdk-agent-loop",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "并发数字必须附运行时、版本与计数口径",
          paragraphs: [
            "截至 2026-08-23，Responses Multi-agent 是适用于全部 GPT-5.6 模型的 Beta。`multi_agent.max_concurrent_subagents` 按整棵树统计活跃后代 turn，排除 `/root`；默认值与推荐值为 `3`，字段无固定 API 上界，树深和累计创建子智能体总数也无固定限制。当前限制还包括不支持 `/responses/compact`、`reasoning.summary`、`max_tool_calls`，并为 root 与各子智能体分别隐式自动压缩。",
            "Codex 的 `agents.max_concurrent_threads_per_session` 则统计同时打开的 spawned-agent threads，排除 primary。未设置时由 Codex 选择默认值，但官方页面没有给出固定数字；`agents.max_threads` 是旧别名。Codex 文档没有声明 Responses 的无固定深度/累计总数规则。Codex 子智能体继承当前沙箱、权限模式与实时覆盖配置，而自定义 Agent 可被进一步收紧，因此容量与权限必须分表。",
            "每次发布都记录 runtime、访问日期、字段、计数对象、root/primary 排除项、默认值证据、排队语义、继承规则和观察上限，并重测容量下降、取消传播、超时与成本。无固定协议限制时，应用层宽度、深度、成本、截止和停止预算反而更重要。",
          ],
          sourceIds: [
            "openai-responses-multi-agent",
            "openai-codex-subagents",
            "openai-codex-sandbox-security",
            "openai-latency",
            "openai-cost",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "有界层级调度器，所有子任务从父预算信封领取份额。",
        trigger: "预算估算、优先级、截止时间和并发计数口径已登记。",
        completion: "达到成功终态、受控部分完成、取消、预算耗尽或人工停止之一。",
        controlOwner: "应用调度器实施配额和取消；模型不得自行提高预算。",
        stateOwner: "预算服务保存预留、消耗、归还与超限事件。",
        contextBoundary: "超出上下文预算时检索、压缩或分段，不自动生成更多 Agent。",
        toolAuthority: "高成本或高风险工具有独立调用配额与断路器。",
        delegationPayload: "子任务目标、预算份额、截止、最大深度、优先级与停止原因模式。",
        concurrencyPolicy: "上限绑定运行时/版本/计数口径；有界队列、背压、取消传播。",
        failurePolicy: "预算耗尽不归类为模型失败；返回部分产物、缺失项和继续所需资源。",
        evidence: "预算预留/消耗、队列等待、活跃计数、取消时间和单位成功成本。",
        escalation: "需突破预算、停止条件冲突或取消无法传播时由运营负责人决定。",
      },
      practice: {
        title: "制定多维预算信封",
        brief:
          "为一个可递归分解的研究或工程任务，定义整棵任务树和每个子任务的资源边界。",
        steps: [
          "设定总截止、令牌、成本、外部调用、宽度、深度和轮次预算。",
          "写清所用运行时、版本、并发数字的计数口径及 root 是否计入。",
          "设计预算分配/归还、队列背压、优先级和取消传播。",
          "注入队列饱和、子任务递归和无改进循环，验证停止终态。",
        ],
        artifact: "预算表、容量定义、停止状态机和三项压力测试。",
        reviewGate:
          "运营者能在运行前预测最坏资源暴露，并在任一时刻解释为什么继续、降级或停止。",
        template:
          "# 预算与停止契约\n\n## 运行时容量\n- runtime/version：\n- 数字：\n- 计数口径：整树 / 每父节点 / 进程 / 工具处理器\n- root 是否计入：\n- 排队是否计入：\n\n## 总预算\n| 时间 | 令牌 | 成本 | 外部调用 | 宽度 | 深度 | 轮次 |\n|---|---|---|---|---|---|---|\n|  |  |  |  |  |  |  |\n\n## 背压与停止\n- 队列上限/优先级：\n- 取消传播：\n- 成功/部分完成：\n- 预算耗尽：\n- 无改进/重复：\n- 人工停止：",
      },
      checkpoint: {
        question: "文档写“最大并发 3”时，下一步最重要的是什么？",
        options: [
          "立即把所有框架都设为 3。",
          "核对运行时、版本、计数对象、是否包含 root、是否按整树统计及排队语义。",
          "把 Host 数量也固定为 3。",
          "取消任务级预算。",
        ],
        correctIndex: 1,
        explanation:
          "并发数字脱离控制平面和计数口径没有可移植含义。",
      },
      lab: {
        title: "上下文恢复：预算与停止",
        instruction:
        "在正常、降容与慢尾状态下，组合准入上限、有界队列、队列已满、预算向量、期限／取消和停止规则。",
        evidencePrompt:
          "保存一个会发生递归爆炸的配置及修复配置，并说明停止规则如何保护部分产物。",
      },
      takeaway:
        "自治只有在资源暴露可预估、容量含义可解释、停止能够被外部强制时才是工程系统。",
    },
    "reliability-recovery": {
      kicker: "11 · 超时不等于失败，重试不等于恢复",
      title: "可靠性：歧义结果、幂等、效果账本、补偿与人工对账",
      summary:
        "面对响应丢失、重复事件、崩溃、部分失败（partial failure）和部分副作用，先表示 outcome_unknown，再通过调用者幂等键与效果账本核对；仅对安全类别有限重试，并为不可逆流程设计补偿和人工对账。",
      objective:
        "为一个包含外部写入的长时流程建立失败分类、幂等契约、退避抖动、效果账本、补偿和人工恢复运行手册。",
      artifact: "可靠性状态机、效果账本与恢复运行手册",
      concepts: [
        "ambiguous outcome",
        "caller-supplied idempotency key",
        "effect ledger",
        "retry/backoff/jitter",
        "Retry-After",
        "circuit breaker（断路器）",
        "partial failure（部分失败）",
        "fail-open / fail-closed",
        "checkpoint",
        "compensation",
        "manual reconciliation",
      ],
      sections: [
        {
          heading: "把传输失败与业务结果分开",
          paragraphs: [
            "模型调用的超时和重试策略是可选且版本敏感的；流式或带状态工作并不总能安全回放。Webhook 可能重复投递，应用应验证签名、快速确认并用稳定事件标识去重；有限重试也不保证最终一定送达。Background mode 让一个长响应异步运行，但不是完整工作流引擎。",
            "AWS 的幂等 API 指南强调调用者提供稳定操作标识与语义等价：请求可能已经提交效果但响应丢失，这时结果是 ambiguous/outcome_unknown，不是可直接重放的 failed。去重记录应绑定“已认证调用者或租户 + 操作类型 + operation_id”和规范请求指纹；同一 ID 携带不同指纹必须作为冲突拒绝。记录保留期至少覆盖最大重试、对账和已声明的迟到投递窗口；超过该窗口后若已不能证明身份，应 fail closed 或先查询/核对，不能把记录过期当作迟到请求必然是新操作的证据。服务端给出 `Retry-After` 时应遵守；重试采用有限指数退避加随机 jitter；依赖持续失败时打开 circuit breaker（断路器），避免多层重试放大故障。这些时序控制都不能把非幂等写入变安全。",
          ],
          sourceIds: [
            "openai-model-retries",
            "openai-webhooks",
            "openai-background",
            "aws-idempotent-apis",
            "aws-backoff-jitter",
            "azure-retry-storm",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "效果账本是恢复的事实底座",
          paragraphs: [
            "课程要求每个外部副作用在执行前写入 operation_id、主体、目标、意图、参数哈希和幂等键；执行后更新 confirmed、rejected、not_started 或 outcome_unknown，并保存外部回执。恢复器先查账本和外部系统，再决定确认、有限重试、补偿或人工对账。",
            "部分失败（partial failure）必须是显式状态：某些分支或效果可能已提交，而同级分支超时、校验失败或仍未知。事故前就要为每个依赖规定 fail-closed 或 fail-open。授权不明、写入结果未知、必需证据缺失或受监管审计写入失败时 fail-closed；只有明确可选且不影响安全的 enrichment/telemetry 路径才可 fail-open，并把结果标成 degraded，而非伪装完整。",
            "Azure 的补偿事务模式适用于最终一致的多步骤流程：补偿不是数据库原子回滚，顺序可能与原操作不同，补偿本身也必须幂等且可能失败。不可逆效果（已发送消息、被阅读通知、外部市场交易等）无法恢复到精确旧状态，必须保留人工修复路径。公开 GitHub 返回路径故障案例进一步说明 caller identity、task_id 和 return destination 必须结构化。",
          ],
          bullets: [
            "重试类别：safe_read、idempotent_write、unsafe_write、outcome_unknown。",
            "补偿结果也进入效果账本，不能以“已尝试回滚”标记成功。",
            "人工对账必须能领取、核对、裁决并留下责任人。",
          ],
          sourceIds: [
            "azure-compensating-transactions",
            "github-aws-return-path-issue",
            "aws-idempotent-apis",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "Session 与文件检查点只覆盖其声明的恢复面",
          paragraphs: [
            "OpenAI 的运行续接、Claude SDK 文件 checkpoint 和 Anthropic Managed Agents 的事件日志/Harness/Sandbox 架构提供不同恢复能力。文件 checkpoint 只覆盖受支持编辑工具，不会回滚所有 shell、子智能体或外部 API 副作用；一个耐久 Session 也不会自动生成业务补偿。Microsoft Cosmos DB 锁示例只为原子获取、ETag 续租、TTL 恢复和 fencing token 拒绝陈旧写入提供有界参考；其他存储不会自动继承这些保证。",
            "升级 SDK 前应进行 crash-after-send、response-lost、duplicate-webhook、checkpoint-gap 与 compensation-failed 演练。若某个接口的重试默认值变化，也不能越过应用自己的 replay-safety 分类。",
          ],
          sourceIds: [
            "openai-running-agents",
            "claude-sdk-checkpointing",
            "anthropic-managed-agents",
            "openai-model-retries",
            "azure-cosmos-distributed-lock",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "耐久状态机围绕每个效果节点写入效果账本，恢复器与人工对账队列分离。",
        trigger: "operation_id、认证去重范围、规范请求指纹和保留窗口已持久化，且前置状态与权限仍有效。",
        completion: "业务终态与所有必需效果均 confirmed，或明确进入 compensated/manual_reconciliation。",
        controlOwner: "应用恢复协调器；模型只能建议，不得自行重放未知副作用。",
        stateOwner: "应用工作流状态库保存规范流程状态，追加式效果账本独立保存外部副作用事实。",
        contextBoundary: "恢复基于结构化状态与外部回执，模型摘要只作线索。",
        toolAuthority: "重试或补偿前重新授权；补偿工具与正向工具分别最小授权。",
        delegationPayload: "operation_id、幂等键、预期效果、当前状态、外部引用、重试类别和 return_to。",
        concurrencyPolicy: "同一 operation_id 单写；重试有限退避加 jitter；租约交接携带单调递增的 fencing/version token，下游拒绝失效持有者的旧 token 写入。",
        failurePolicy: "outcome_unknown 先核对；安全重试有限次数；补偿失败进入人工对账而非伪装回滚成功。",
        evidence: "请求/响应哈希、账本状态、外部回执、重试时间、补偿结果和人工裁决。",
        escalation: "不可逆效果、账本与外部系统冲突、补偿失败或身份/返回路径不明时人工处理。",
      },
      practice: {
        title: "设计“发送已发生但响应丢失”的恢复",
        brief:
          "选择邮件发送、工单创建、支付预授权或文件发布流程，处理效果已提交但客户端超时。",
        steps: [
          "定义调用者生成的 operation_id/幂等键、认证去重范围、请求指纹冲突规则、保留窗口及服务端语义等价规则。",
          "设计效果账本状态、外部回执与 outcome_unknown 核对查询。",
          "按 safe_read、idempotent_write、unsafe_write 分类重试，并设置有限退避和 jitter。",
          "为部分成功写补偿顺序、补偿失败和人工对账领取/裁决流程。",
        ],
        artifact: "效果账本模式、恢复状态机、补偿表和故障演练记录。",
        reviewGate:
          "评审者能证明超时不会导致盲目重复副作用，且每个不确定结果最终可确认、补偿或人工裁决。",
        template:
          "# 效果与恢复契约\n\n## 操作身份\n- operation_id：\n- caller_id / tenant_id / return_to：\n- idempotency_key：\n- dedupe_scope：认证调用者或租户 + 操作类型 + operation_id\n- canonical_request_fingerprint：\n- fingerprint_mismatch：conflict / 不执行\n- retention：>= 最大重试 + 对账 + 迟到投递窗口\n- 过期后：fail closed 或查询/核对\n- semantic_equivalence：\n\n## 效果账本\n| effect | intent_hash | state | external_receipt | checked_at |\n|---|---|---|---|---|\n|  |  | pending/confirmed/rejected/outcome_unknown/compensated |  |  |\n\n## 重试\n- class：safe_read / idempotent_write / unsafe_write\n- max_attempts / deadline：\n- backoff + jitter：\n\n## 补偿与人工对账\n| 正向效果 | 补偿 | 是否可精确恢复 | 补偿失败 | 人工负责人 |\n|---|---|---|---|---|\n|  |  |  |  |  |",
      },
      checkpoint: {
        question: "外部写入请求超时后，最安全的第一步是什么？",
        options: [
          "立即用新请求 ID 重复执行。",
          "把操作标为 outcome_unknown，使用原幂等键查询效果账本/外部系统，再决定下一步。",
          "让模型猜测成功概率。",
          "删除失败日志以便重新开始。",
        ],
        correctIndex: 1,
        explanation:
          "超时无法区分未执行与已执行但响应丢失；核对必须先于重放。",
      },
      lab: {
        title: "上下文恢复：效果状态机",
        instruction:
        "注入发送前失败、提交结果不明与重复交付；不确定工作只有在复用同一业务操作键并检查效果账本后才可继续。",
        evidencePrompt:
          "提交一次你拒绝自动重试的案例，并给出效果账本中足以解歧义的字段。",
      },
      takeaway:
        "可靠恢复的核心不是“多重试几次”，而是承认结果可能未知，并用稳定身份、效果事实和人工兜底把未知收敛。",
    },
    "security-authority-human-control": {
      kicker: "12 · 能力、权限、隔离、质量与责任分层",
      title: "安全、授权、Guardrails 与 Human-in-the-loop",
      summary:
        "用最小权限、沙箱、网络/文件边界、工具审批、输入输出护栏、人工中断和审计共同约束智能体；明确审批只允许行动，不证明行动正确。",
      objective:
        "为一个可产生外部影响的智能体建立威胁模型、权限矩阵、审批状态机、隔离边界和事故响应。",
      artifact: "权限—隔离—审批控制图与威胁/事故手册",
      concepts: [
        "least privilege",
        "permission vs sandbox",
        "guardrail coverage",
        "prompt injection",
        "confused deputy（混淆代理人）",
        "tool approval",
        "human interruption",
        "audit trail",
      ],
      sections: [
        {
          heading: "Guardrail、审批和沙箱解决不同问题",
          paragraphs: [
            "OpenAI 将输入、输出和工具 guardrails 以及 blocking/parallel checks 分开，并提供执行前审批与可序列化中断恢复。审批允许或拒绝某项工具行动；输出护栏发生在行动后时，无法撤销已经发生的外部副作用。",
            "Claude Agent SDK 当前按 hooks、deny rules、ask rules、permission mode、allow rules、canUseTool 的顺序评估工具权限；较早获批的调用可能不会到达 canUseTool，因此必须覆盖每次调用的检查应放在 PreToolUse。`allowed_tools` / `allowedTools` 只会自动批准匹配工具，并不会隐藏或拒绝所有未列工具；固定的无头工具面需要按风险组合显式 allowed tools 与 `dontAsk`、deny/工具移除规则、hooks 和 sandbox。该权限流程与 child agent 继承属于策略层，不是操作系统隔离。安全部署还需要文件系统、网络、凭证代理、最小权限和审计。MCP 连接尤其要考虑第三方服务器、提示注入和数据共享。",
          ],
          bullets: [
            "权限决定能否请求行动；沙箱限制行动能影响什么。",
            "护栏检查内容或调用；业务授权仍需验证主体与对象。",
            "高影响副作用必须在执行前完成人工或政策审批。",
          ],
          sourceIds: [
            "openai-guardrails-approvals",
            "openai-sdk-hitl",
            "openai-mcp-connectors",
            "claude-sdk-permissions",
            "claude-secure-deployment",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "建立五层授权链和三道独立签字",
          paragraphs: [
            "课程将授权分为身份、任务目的、能力、对象/数据范围和具体效果五层。工具存在于注册表不代表当前用户可调用；父 Agent 获准调用也不代表所有后代继承。confused deputy（混淆代理人）风险是低权限请求者诱导高权限智能体借自己的凭证代为行动；防线是在工具执行时重新绑定已认证主体、任务目的、对象与具体效果，而不是信任上游自然语言。每次 handoff 或恢复都重新计算权限。",
            "权限批准、质量证据和人类最终签核必须分开记录。人类签核只记录指定治理角色的发布决定与残余风险接受；签字事件本身不会创造、转移或穷尽组织或法律责任。这是课程治理边界，不是厂商规则；法律责任取决于司法管辖、事实和组织分工，需要合格专业审查。课程原创控制图保留 approval、PASS 与人类确认的语义区分，但任何具体界面、角色名和数值都不作为产品规范。",
          ],
          sourceIds: [
            "openai-sdk-hitl",
            "claude-sdk-permissions",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "默认权限与护栏覆盖面必须随版本复核",
          paragraphs: [
            "不同 SDK 对子 Agent 权限继承、bypass 模式、工具审批传播、输入/输出 guardrail 作用范围和中断序列化有不同语义。升级时需要攻击回放和授权差异测试，不可从一个框架推断另一个。",
            "通用安全指南是起点，不是对特定系统的认证。上线前仍需以实际工具、数据、租户、网络和业务影响建立威胁模型，并验证 kill switch、凭证撤销和事故通知。",
          ],
          sourceIds: [
            "openai-safety",
            "openai-guardrails-approvals",
            "claude-sdk-permissions",
            "claude-secure-deployment",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "策略执行点位于每次工具/交接前，沙箱与凭证代理包围执行层，人类处理中断。",
        trigger: "身份、目的、能力、对象范围和效果风险均有可验证输入。",
        completion: "行动结果、质量证据与必要人类签核分别完成并写入审计记录。",
        controlOwner: "应用策略引擎；高风险效果由命名人类批准者控制。",
        stateOwner: "授权服务保存政策版本、决定、理由、中断状态和审批主体。",
        contextBoundary: "不把凭证放入模型；跨租户、远程 MCP 和敏感数据分别隔离。",
        toolAuthority: "主体×任务×工具×对象×效果的最小权限，默认拒绝。",
        delegationPayload: "身份声明、任务目的、允许/禁止能力、数据范围、风险等级和审批引用。",
        concurrencyPolicy: "多个审批独立排队；同一高风险对象的写入串行并防止竞态批准。",
        failurePolicy: "授权不确定即拒绝；审批超时不默许；guardrail 失败进入安全终态。",
        evidence: "政策版本、授权决定、审批者、隔离配置、工具轨迹、质量报告和人类签核。",
        escalation: "提示注入疑似成功、权限漂移、沙箱突破、敏感泄漏或 kill switch 失效时启动事故响应。",
      },
      practice: {
        title: "为外部消息智能体建立五层控制",
        brief:
          "设计一个能读取客户记录并拟稿、但只有在条件满足后才能发送外部消息的系统。",
        steps: [
          "建立身份、目的、能力、对象范围与具体效果的权限矩阵。",
          "区分输入/工具/输出 guardrail、运行沙箱、网络边界和凭证代理。",
          "设计审批中断、拒绝、修改、过期和恢复，并重算交接后的权限。",
          "演练提示注入、越权对象、重复批准与输出护栏晚于副作用。",
        ],
        artifact: "威胁模型、权限矩阵、审批状态机和事故演练记录。",
        reviewGate:
          "安全评审者能证明未经批准无法产生外部承诺，且批准事件不会被误当作质量或责任签核。",
        template:
          "# 授权与人工控制\n\n## 五层权限\n| 主体 | 任务目的 | 能力 | 对象/数据范围 | 具体效果 | 决定 |\n|---|---|---|---|---|---|\n|  |  |  |  |  | allow/ask/deny |\n\n## 控制层\n- input guardrail：\n- tool guardrail/approval：\n- output guardrail：\n- sandbox/network：\n- credential proxy：\n\n## 三项独立记录\n- 权限批准：\n- 质量证据：\n- 人类最终签核：\n\n## 事故\n- kill switch：\n- 凭证撤销：\n- 通知/取证：",
      },
      checkpoint: {
        question: "人工批准一次工具调用能够证明什么？",
        options: [
          "工具结果一定正确。",
          "整个任务质量已经通过。",
          "在当时上下文和政策下，该批准者允许这次行动；正确性与最终责任仍需另行验证。",
          "所有子智能体永久获得相同权限。",
        ],
        correctIndex: 2,
        explanation:
          "批准是授权事件，不是质量结论、责任转移或永久权限授予。",
      },
      lab: {
        title: "治理轨迹：批准前还是批准后",
        instruction:
        "注入带恶意指令的连接结果，分别检验白名单、默认拒绝出口与执行时审批这三道副作用前门禁。",
        evidencePrompt:
          "选择一个必须前置的控制和一个可后置检测的控制，分别说明其威胁与证据。",
      },
      takeaway:
        "可信自治不是一个“允许”按钮，而是身份、最小权限、隔离、前置审批、质量证据和人类责任的连续链条。",
    },
    "tracing-observability-economics": {
      kicker: "13 · 看见执行不等于判断质量",
      title: "追踪、监控、审计、经济性与隐私",
      summary:
        "用 trace 重建已记录且已埋点的运行路径，用 monitoring 判断服务是否健康，用 audit 追责高影响行动，用 eval 衡量任务表现；再把成功、延迟、令牌、成本与隐私风险连接起来。",
      objective:
        "设计一套跨模型、工具、交接、护栏和业务结果的遥测方案，明确追踪、监控、审计与评估的不同消费者和保留政策。",
      artifact: "四层遥测地图、SLO 与单位成功经济模型",
      concepts: [
        "trace/span",
        "metrics/logs/events",
        "monitoring/SLO",
        "audit trail",
        "eval linkage",
        "cost per successful outcome",
        "p99 尾延迟",
        "SLO 与错误预算（error budget）",
        "telemetry privacy",
      ],
      sections: [
        {
          heading: "Trace 回答“发生了什么”",
          paragraphs: [
            "OpenAI 的可观测性与 tracing 能记录工作流、模型、工具、交接、护栏及自定义 span，并提供敏感数据捕获控制。Claude Agent SDK 通过 OpenTelemetry 暴露 traces、metrics、events、令牌、成本、延迟、工具与失败信号。",
            "这些信号让工程师重建已记录、已埋点的执行路径，但结果受上下文传播、采样、导出与保留缺口限制，trace 本身也不是质量裁决。每个 span 最多只有一个 parent；fan-in 时应使用 span links 加 task_id/operation_id 关联所有贡献分支，不能虚构多父树或只保留一个发起分支。一个完整无报错的轨迹可能回答错误；一个最终正确的答案也可能走了越权、昂贵或不可重放的路径。遥测内容还可能含提示、参数、结果和个人数据，因此采集本身必须受最小化、脱敏、访问和保留控制。",
          ],
          sourceIds: [
            "openai-observability",
            "openai-tracing",
            "claude-sdk-observability",
            "otel-overview",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "四类证据服务四种问题",
          paragraphs: [
            "课程采用四分法：追踪（trace）关联并重建已记录的单次执行路径，但不能凭未完整观测的 span 证明完整因果；监控（monitoring）聚合服务健康、错误、队列与 SLO；审计（audit）保存谁在何时基于哪条政策批准和产生了什么效果；评估（eval）用任务、轨迹与结果标准判断表现。它们共享 correlation_id，但不能互相替代。",
            "经济性以成功结果为分母，而不是只看单次调用价格。应同时测量成功率、p50、p95 与 p99 尾延迟、总令牌、模型/工具费用、人工复核分钟、重试浪费和失败恢复成本。先定义面向用户的 SLI/SLO，再把错误预算（error budget）定义为测量窗口内允许的不可靠度；预算政策预先指定 burn 或耗尽时的负责人和动作，例如减慢发布、暂停非关键变更或优先可靠性工作。错误预算不是隐藏部分失败的许可，示例阈值也不是通用默认值。并行或更多工作者可能降低墙钟时间，却增加总成本与尾延迟。",
          ],
          sourceIds: [
            "openai-latency",
            "openai-cost",
            "anthropic-research-system",
            "google-sre-error-budget",
            "openai-observability",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "遥测字段、默认采集和价格都会变化",
          paragraphs: [
            "SDK 的 span 类型、OpenTelemetry 属性、Beta 能力、敏感数据默认值和零数据保留限制会随版本变化。OpenTelemetry 明确警告：敏感 Baggage 可能通过 HTTP headers 到达非预期资源，且没有内建完整性检查；因此不得放入 secrets 或未最小化的个人数据，也不得把 Baggage 当作可信授权输入。升级前需运行字段契约测试，并确认观测后端不会因高基数 task_id 或完整提示而造成成本与隐私事故。",
            "模型和工具价格、缓存、计费口径与延迟特征也会变化。成本仪表盘必须记录模型/SDK/提示/工具版本和访问日期；历史单价不能用于宣称当前经济性。",
          ],
          sourceIds: [
            "openai-tracing",
            "claude-sdk-observability",
            "openai-latency",
            "openai-cost",
            "otel-baggage-security",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "所有节点发出统一关联事件，分别流向追踪、监控、审计和评估数据产品。",
        trigger: "任务创建时生成 trace_id/task_id，并加载当前遥测与隐私政策版本。",
        completion: "终态、业务结果、效果状态、成本和必要审计事件均可关联。",
        controlOwner: "应用遥测层控制采样与脱敏；安全/合规拥有审计保留政策。",
        stateOwner: "不同存储分别保存 trace、服务指标、评估结果，以及在声明保留期内追加式或防篡改的审计记录。",
        contextBoundary: "默认不记录完整敏感提示、工具参数和结果；使用字段级白名单与哈希。",
        toolAuthority: "遥测处理器只写观测后端，不能反向取得业务工具权限。",
        delegationPayload: "trace_id、task_id、operation_id、parent_span、fan-in span links、role、model/tool/version 与数据分类标签。",
        concurrencyPolicy: "分支保留各自的单父 span 谱系；fan-in 用 links 关联全部贡献分支。遥测异步有界缓冲，丢弃策略不得影响审计必需事件。",
        failurePolicy: "追踪后端失败不阻塞低风险主流程，但审计写入失败会阻止受管制副作用。",
        evidence: "字段字典、采样/脱敏配置、SLO、审计覆盖、成本归因和数据保留测试。",
        escalation: "敏感数据泄漏、审计缺口、SLO 持续违反或单位成功成本越界时触发运营处置。",
      },
      practice: {
        title: "建立四层遥测与成本归因",
        brief:
          "为一个包含路由、工具、交接和人工批准的流程，设计同一 correlation_id 下的四类证据。",
        steps: [
          "分别列出 trace、monitoring、audit 和 eval 的问题、字段、消费者与保留期。",
          "定义跨父子任务、工具调用、效果账本和最终业务结果的关联键。",
          "建立成功率、p95 延迟、队列、错误、单位成功成本和人工分钟指标。",
          "对提示、参数、结果、身份与外部数据执行最小化/脱敏威胁审查。",
        ],
        artifact: "遥测地图、字段字典、SLO/成本公式和隐私审查表。",
        reviewGate:
          "运营者能从告警定位轨迹，审计者能追溯授权效果，评估者能连接结果，同时不会默认暴露完整敏感内容。",
        template:
          "# 遥测与经济性\n\n| 层 | 回答的问题 | 必需字段 | 消费者 | 保留/访问 |\n|---|---|---|---|---|\n| Trace | 一次执行发生什么 |  |  |  |\n| Monitoring | 服务是否健康 |  |  |  |\n| Audit | 谁批准并产生什么效果 |  |  |  |\n| Eval | 表现是否可接受 |  |  |  |\n\n## 关联与 SLO\n- trace/task/operation_id：\n- success：\n- p95 latency：\n- error/queue：\n\n## 经济性\n- 单位成功成本 =（模型 + 工具 + 重试 + 人工 + 恢复）/ 成功结果数\n- 预算阈值：\n\n## 隐私\n- 禁止字段：\n- 脱敏/采样：",
      },
      checkpoint: {
        question: "一条完整 trace 能证明什么？",
        options: [
          "任务结果一定正确。",
          "它提供一次执行路径的证据；质量仍需评估，授权责任需审计，服务健康需聚合监控。",
          "系统已满足所有隐私要求。",
          "成本已经最优。",
        ],
        correctIndex: 1,
        explanation:
          "追踪、评估、审计和监控解决不同问题，完整性不能跨层外推。",
      },
      lab: {
        title: "治理轨迹：四类证据",
        instruction:
        "把执行路径、服务健康、问责或结果质量问题匹配到 trace、monitor、audit 或 evaluation，再落实遥测脱敏与结果—成本关联。",
        evidencePrompt:
          "提交一个同时进入两类数据产品的事件，解释两份记录为何用途和保留策略不同。",
      },
      takeaway:
        "世界级可观测性不是收集更多日志，而是让每类证据回答自己的问题，并把成功、风险和成本关联到同一任务。",
    },
    "evaluation-regression-evolution": {
      kicker: "14 · 用回归证据管理变化",
      title: "任务、轨迹与结果评估：回归、版本矩阵与框架演进",
      summary:
        "建立任务级、节点级、轨迹级和结果级评估，多次运行概率性任务，校准评分器，并用锁定版本矩阵防止模型、提示、工具和框架升级悄悄改变控制语义。",
      objective:
        "构建一个包含黄金样例、故障样例、多次 trial、轨迹约束、业务结果和版本升级门的评估套件。",
      artifact: "多层评估套件、评分器校准表与版本治理矩阵",
      concepts: [
        "task/trial/grader",
        "node/trajectory/outcome eval",
        "repeated trials",
        "grader calibration",
        "regression gate",
        "dependency lock",
        "framework lifecycle",
      ],
      sections: [
        {
          heading: "评估问“是否可接受”，不只问“是否运行”",
          paragraphs: [
            "OpenAI 的 agent evals 支持数据集、trace grading、工具和 handoff 评估及重复运行；Anthropic 把 task、trial、grader、trajectory、outcome、harness 与 suite 分开，并强调重复试验和评分器校准。概率性系统不能用一次漂亮演示作为质量证据。",
            "评估至少分四层：节点输出是否满足局部契约；路由、工具与交接轨迹是否遵守政策；最终任务是否完成；真实业务结果和伤害是否可接受。探索型任务可用 `pass@k` 回答 k 次中是否至少一次成功；每次都需要可靠的工作流应报告单次成功率，并在要求 k 次全部成功时使用 `pass^k` 衡量一致性。不能把多次尝试后的“至少一次成功”包装成单次运行可靠性。trace 是评估输入，不是 eval verdict；生产 monitoring、A/B 测试、用户反馈与事故分析仍不可省略。",
          ],
          sourceIds: ["openai-agent-evals", "anthropic-agent-evals"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "版本矩阵把变更转化为可审查实验",
          paragraphs: [
            "每次候选发布固定模型、系统提示、工具 schema、检索数据、SDK、协议和编排图版本。对成功、错误、拒绝、超时、交接、权限、效果恢复和成本运行多次 trial，报告分布和置信边界，而非只报平均分。",
            "OpenAI Agents Python v0.22.0、Claude Agent SDK Python v0.2.143、LangGraph core 1.2.11 与 Microsoft Agent Framework Python 1.15.0 提供可复现锚点，但它们的状态、checkpoint、handoff 与 telemetry 语义不同。框架对照用于验证架构选择，不应把一个框架的 API 名直接当成通用概念。",
          ],
          sourceIds: [
            "openai-agents-python-v022",
            "anthropic-agent-sdk-v02143",
            "langgraph-v1211",
            "microsoft-agent-framework",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "主分支、发布标签与项目生命周期都可能漂移",
          paragraphs: [
            "OpenAI 官方 Swarm README 将 Swarm 标为 experimental/educational，明确说明它已被 production-ready Agents SDK 取代，并建议生产用例迁移到 Agents SDK。这是一条生命周期变化，不是“迁移必然安全”的承诺：先保存基线，把 Swarm 的 Agent、handoff 与状态语义逐项映射到目标 SDK，再用契约、轨迹、恢复、安全和最终结果回归决定切换。",
            "OpenAI Agents Python v0.22.0 是 release tag 锚点，不代表滚动 main 与其完全一致；Claude SDK 的 MIT 源码许可也不授权托管模型服务。AutoGen 的维护通知显示 Microsoft 将新项目引导至 Agent Framework；这些生命周期证据有助于新项目选型，但不意味着所有既有系统都应立即重写。升级、维持或迁移应依据安全、支持、回归和总迁移成本。",
          ],
          sourceIds: [
            "openai-agents-python-v022",
            "openai-swarm-lifecycle",
            "anthropic-agent-sdk-v02143",
            "microsoft-agent-framework",
            "autogen-maintenance",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "离线评估 harness 回放版本化任务，独立评分器评节点、轨迹、结果和业务边界。",
        trigger: "模型、提示、工具、图、数据、SDK 或协议任何一项变化。",
        completion: "规定 trial 数完成，质量/安全/延迟/成本门通过，差异获得责任人签字。",
        controlOwner: "发布治理者拥有通过/阻止权；实现团队不能自行豁免关键回归。",
        stateOwner: "版本化评估注册表保存数据、配置、轨迹引用、评分和裁决。",
        contextBoundary: "评估数据去标识、权限受控，并隔离于训练/调参泄漏。",
        toolAuthority: "离线评估默认使用模拟/沙箱工具；真实副作用采用专用测试租户。",
        delegationPayload: "suite/version、case_id、trial_seed、允许工具、评分量规和结果模式。",
        concurrencyPolicy: "trial 可并行但限额；共享服务容量和随机性记录，避免污染比较。",
        failurePolicy: "评分器失败与被测系统失败分开；争议样例进入人工校准而非删除。",
        evidence: "版本锁、数据集哈希、trial 分布、评分器一致性、差异报告和发布决定。",
        escalation: "安全退化、评分器不一致、未知版本漂移或迁移影响无法估计时阻止发布。",
      },
      practice: {
        title: "建立一次可重复的升级门",
        brief:
          "选择模型或 SDK 升级，设计能发现控制流、工具、交接与恢复退化的多层评估。",
        steps: [
          "建立正常、边界、攻击、超时、重复副作用和人工中断样例。",
          "为节点、轨迹、最终结果和业务影响分别设置量规与硬门。",
          "规定每个样例的 trial 数、随机控制、评分器校准与人工争议处理。",
          "锁定基线/候选版本，比较成功、风险、p95 延迟和单位成功成本。",
        ],
        artifact: "评估数据卡、版本矩阵、回归报告与发布决议。",
        reviewGate:
          "另一团队可用同一锁文件和数据集重跑主要结论，且发布决定能解释质量与成本权衡。",
        template:
          "# 编排回归门\n\n## 版本矩阵\n| 项目 | 基线 | 候选 | 锁定证据 |\n|---|---|---|---|\n| 模型 |  |  |  |\n| 提示/图 |  |  |  |\n| 工具/MCP |  |  |  |\n| SDK/框架 |  |  |  |\n\n## 评估层\n| 层 | 量规 | 硬门 | trial 数 | 评分者 |\n|---|---|---|---:|---|\n| 节点 |  |  |  |  |\n| 轨迹 |  |  |  |  |\n| 结果 |  |  |  |  |\n| 业务/安全 |  |  |  |  |\n\n## 差异与决议\n- 质量：\n- 安全：\n- p95：\n- 单位成功成本：\n- ship/hold/rollback：",
      },
      checkpoint: {
        question: "为什么智能体评估通常需要多次 trial？",
        options: [
          "因为一次 trace 无法保存。",
          "因为概率性行为会产生分布；多次试验才能估计稳定性、尾部失败和版本差异。",
          "为了让评分器看到更多隐私数据。",
          "因为版本锁不重要。",
        ],
        correctIndex: 1,
        explanation:
          "单次运行可能偶然成功或失败，无法代表系统表现分布。",
      },
      lab: {
        title: "治理轨迹：回归门",
        instruction:
        "用隔离重复试验、适用处的确定性代码检查、必要时重复且经人类校准的模型评分、合格人工复核、版本锁和声明的回归阈值建立候选门禁，再切换实际回归。",
        evidencePrompt:
          "提交一个“最终答案正确但轨迹不应通过”的样例，以及阻止发布的具体规则。",
      },
      takeaway:
        "版本升级不是依赖维护杂务，而是一场受控实验：可重复证据只能支持系统在声明的任务分布、样本、版本与不确定性范围内持续满足标准，不能证明未测试场景中的普遍正确性。",
    },
    "production-orchestration-capstone": {
      kicker: "15 · 从影子运行到可撤销自治",
      title: "生产编排：耐久运行、渐进发布与综合项目",
      summary:
        "把任务图、控制权、工具、状态、预算、效果账本、安全、遥测与评估装配成生产控制面；通过离线、影子、建议、审批、金丝雀和有限自治逐级放量。",
      objective:
        "完成一套可部署、可观测、可恢复、可回滚的编排设计，并用事故演练和发布证据证明当前自治级别。",
      artifact: "生产编排决策档案与 15 项综合项目包",
      concepts: [
        "durable orchestration",
        "background response vs workflow engine",
        "event delivery",
        "progressive autonomy",
        "SLO / incident / rollback",
        "release evidence gate",
      ],
      sections: [
        {
          heading: "长响应、事件交付和耐久工作流是不同层",
          paragraphs: [
            "OpenAI Background mode 管理一个长模型响应的异步执行、轮询、取消与流恢复；Webhook 提供可能重复投递、且有限重试不保证最终送达的事件通知；running agents 提供多种连续性方式。它们可以成为生产构件，但合起来仍不自动形成业务事务、跨步骤效果账本或补偿系统。",
            "Anthropic Managed Agents 以耐久事件日志 Session、模型循环 Harness 和 Sandbox 分离说明长时运行架构。Microsoft Agent Framework 的固定 README 与 Python 1.15.0 release evidence 为其中明确列出的图、checkpoint、handoff、并行和人工评审模式提供版本化参考；Google ADK 的广义工作流、协作与会话状态能力则来自当前滚动官方文档，v2.7.1 只是独立的软件包版本锚点，其 release 页面只支持所列两项修复。生产设计应选择满足契约的构件，而不是让框架名称或版本标签定义业务语义。",
          ],
          sourceIds: [
            "openai-background",
            "openai-webhooks",
            "openai-running-agents",
            "anthropic-managed-agents",
            "microsoft-agent-framework",
            "google-adk-v271",
          ],
          evidenceMode: "source-grounded",
        },
        {
          heading: "自治按证据逐级开放",
          paragraphs: [
            "课程采用统一六级发布阶梯：先用固定输入与版本、并记录或模拟外部依赖的离线评估/受控回放；再做 sandbox 或 synthetic integration；随后以禁止生产业务写入的 shadow 观察真实分布，但仍须预算并审计读取、外部调用、隐私、遥测、限流、队列与成本影响；recommendation-only 只给建议、由人执行；approval-gated bounded canary 仅覆盖有限租户/能力并逐动作审批；最后才在明确 SLO、预算、kill switch 与人工值守下启用 limited autonomy。流量扩大与权限扩大是两项独立变更。",
            "每一级都有进入证据、阶段特定的评估/护栏/运营门、退出阈值、回滚动作和责任人；只有承载服务流量的阶段才在声明测量窗口内使用 SLI、SLO 与 error budget。综合项目使用课程原创语义图区分 Session、root、Host、权限与质量，不把任何具体运行时容量泛化为通用规则。",
          ],
          bullets: [
            "发布单位是任务×工具×数据范围×风险等级，不是“整个 Agent”。",
            "扩大流量与扩大权限是两项独立变更。",
            "任何阶段都必须能进入安全停止、只读或人工接管。",
          ],
          sourceIds: [
            "anthropic-managed-agents",
            "openai-running-agents",
          ],
          evidenceMode: "engineering-synthesis",
        },
        {
          heading: "生产矩阵必须锁版本并定期再认证",
          paragraphs: [
            "Background/Webhook 的存储、重试和限制，Managed Agents 的产品条件，以及 Agent Framework/ADK 的接口都会变化。发布清单要锁定 API/SDK/模型/协议/框架版本，记录复核日期，并对关键行为做合成探针。",
            "再认证不是只跑 happy path：必须包含重复事件、崩溃恢复、结果未知、权限撤销、模型拒绝、队列饱和、遥测故障、补偿失败和人工接管。任何文档更新都不能替代本地控制面测试。",
          ],
          sourceIds: [
            "openai-background",
            "openai-webhooks",
            "anthropic-managed-agents",
            "microsoft-agent-framework",
            "google-adk-v271",
          ],
          evidenceMode: "version-watch",
        },
      ],
      contract: {
        topology: "耐久应用控制面调度模型、工具、人类和事件；执行平面按租户与风险隔离。",
        trigger: "发布级别、任务身份、版本锁、预算、权限与观察窗口均已批准。",
        completion: "单次运行写入 confirmed、denied、cancelled、expired、partial、compensated、manual_reconciliation 或 escalated 等业务终态；发布阶段另在声明的测量窗口内评估 SLO 与回归门。",
        controlOwner: "应用编排器负责运行；发布负责人决定自治等级；事故指挥拥有 kill switch。",
        stateOwner: "应用耐久状态、事件日志、效果账本和版本化产物库。",
        contextBoundary: "每个租户/任务/角色最小上下文，敏感数据与凭证留在受控边界。",
        toolAuthority: "随发布级别逐项开放，写入默认审批，撤销可即时生效。",
        delegationPayload: "任务/父子身份、版本、目标、数据范围、预算、权限、产物模式、回传和恢复引用。",
        concurrencyPolicy: "分租户/工具限额、有界队列、背压、截止与取消；容量口径记录运行时版本。",
        failurePolicy: "安全停止优先；未知效果核对，安全重试有限，必要时补偿和人工对账。",
        evidence: "发布档案、版本锁、评估分布、审批、trace/monitor/audit、效果账本和演练结果。",
        escalation: "SLO/安全门越界、权限或状态漂移、补偿失败、kill switch/审计不可用时立即降级。",
      },
      practice: {
        title: "完成生产就绪评审",
        brief:
          "把前十四个模块的产物装配为一个有限场景的生产编排提案，并接受跨职能红队评审。",
        steps: [
          "选择单一任务、明确用户/租户、工具、数据和不可逆影响的发布边界。",
          "连接任务图、12 项契约、权限、状态、预算、效果账本、遥测和评估版本。",
          "定义离线到有限自治的每级进入证据、流量/权限、退出阈值与回滚。",
          "演练重复事件、结果未知、权限撤销、队列饱和、补偿失败与人工接管。",
        ],
        artifact: "15 项决策档案、发布阶梯、值守手册和演练证据。",
        reviewGate:
          "工程、安全、运营和业务负责人都能追溯控制权与效果，并能在不依赖模型配合的情况下停止、降级、恢复和对账。",
        template:
          "# 生产编排发布档案\n\n## 发布边界\n- 任务/用户/租户：\n- 数据/工具/副作用：\n- 不可接受结果：\n\n## 版本与控制面\n- 模型/提示/图：\n- SDK/框架/MCP：\n- 状态/预算/并发：\n- 权限/审批/隔离：\n- 效果账本/恢复：\n- trace/monitor/audit/eval：\n\n## 发布阶梯\n| 阶段 | 流量 | 权限 | 进入证据 | 阶段门；流量阶段的 SLI/SLO 窗口 | 回滚 | 负责人 |\n|---|---:|---|---|---|---|---|\n| 离线评估/回放 | 0 | 模拟 |  |  |  |  |\n| Sandbox/synthetic integration | 合成/隔离 | 无生产业务写入 |  |  |  |  |\n| Shadow | 代表性读取 | 无生产业务写入 |  |  |  |  |\n| Recommendation-only | 代表性 | 人工执行 |  |  |  |  |\n| Approval-gated bounded canary | 有限 | 逐动作审批 |  |  |  |  |\n| Limited autonomy | 有界 | 有界 |  |  |  |  |\n\n## 事故演练\n- 结果未知：\n- 权限撤销：\n- 队列饱和：\n- 补偿失败：\n- 人工接管：",
      },
      checkpoint: {
        question: "关于 OpenAI Background mode，哪项说法正确？",
        options: [
          "它自动成为跨服务的完整事务工作流引擎。",
          "它在文档所述存储与保留约束内管理一个异步长响应；多步骤业务状态、效果账本与补偿仍需应用负责。",
          "它保证 webhook 只投递一次。",
          "它消除了版本和存储约束。",
        ],
        correctIndex: 1,
        explanation:
          "长响应的异步执行只是生产构件之一，不能替代业务编排控制面。",
      },
      lab: {
        title: "生产就绪：证据门与发布阶梯",
        instruction:
        "只有同时具备影子对照、有界金丝雀与已演练终止开关，试点才能进入下一生产发布阶段。",
        evidencePrompt:
          "提交最终自治等级与一项尚未获准的能力，引用阻止它开放的具体证据缺口。",
      },
      takeaway:
        "生产编排的终点不是“所有 Agent 都在运行”，而是每项自治都由版本化证据支持，并能被独立停止、恢复和问责。",
    },
  },
  finalAssessment: {
    title: "智能体编排工程测验",
    summary:
      "15 道场景题检验你能否定位控制权、识别并发平面、区分状态与上下文、处理不确定副作用，并用追踪、审计与评估证据作出发布判断。达到 80% 方可通过。",
    passPercent: 80,
  },
  capstone: {
    title: "综合项目：可审计、可恢复的有限自治系统",
    summary:
      "为一个真实但边界有限的业务任务提交生产编排决策档案。目标不是堆叠最多 Agent，而是证明为什么当前拓扑最小充分，以及系统如何在错误、越权、崩溃和版本变化时安全收敛。",
    scenario:
      "你的系统需要读取多个来源、并行形成候选结论、调用一个外部写入工具，并在高风险效果前请求人类批准。评审小组由工程、产品、安全、运营和领域负责人组成；他们将注入响应丢失、重复事件、错误交接、队列饱和、权限撤销与评分器分歧。",
    artifacts: [
      "01 · 自治边界说明书与最小充分拓扑决议",
      "02 · 任务图、终态、失败边与 12 项节点契约",
      "03 · 双层路由矩阵、结构化模式与安全默认分支",
      "04 · 并发平面、依赖矩阵、背压与确定性 join 契约",
      "05 · 角色卡、控制权矩阵与最终答案责任链",
      "06 · 委派包、handoff 时间线、last-agent 与返回信封",
      "07 · 动态工作包、独立验证量规与有限返工状态机",
      "08 · 工具/ACI/MCP 能力登记册和 2026-07-28 迁移说明",
      "09 · 上下文、Session、运行状态、检查点、压缩与记忆分层图",
      "10 · 时间/令牌/成本/宽度/深度预算、容量口径与停止规则",
      "11 · 调用者幂等键、效果账本、重试分类、补偿与人工对账手册",
      "12 · 五层权限、沙箱/网络边界、审批状态机与事故响应",
      "13 · Trace/Monitoring/Audit/Eval 四层遥测与单位成功经济模型",
      "14 · 多次 trial 评估套件、评分器校准与版本回归矩阵",
      "15 · 离线—影子—建议—审批—金丝雀—有限自治发布档案",
    ],
    completionStatement:
      "我能从任一任务和效果追溯控制者、状态、权限、证据与版本；在模型不配合的情况下，系统仍能停止、恢复、补偿、人工对账或回滚。",
    reviewQuestions: [
      "为什么这个任务不能用更简单的代码工作流或单智能体可靠完成？",
      "任一时刻谁拥有控制权、业务状态、最终答案和副作用批准权？",
      "你的并发数字属于哪个运行时与计数口径，聚合如何处理缺失和冲突？",
      "超时后如何区分未执行与已执行但响应丢失？哪个字段支持幂等与效果核对？",
      "权限批准、质量通过和人类最终签核分别由什么证据证明？",
      "Trace、Monitoring、Audit 和 Eval 各回答什么问题，敏感遥测如何治理？",
      "哪一个事故会立即触发降级或 kill switch，谁有权执行？",
      "模型、SDK、MCP 或框架升级时，哪些回归门阻止语义漂移进入生产？",
    ],
  },
} as const satisfies AgentOrchestrationCourseCopy;
