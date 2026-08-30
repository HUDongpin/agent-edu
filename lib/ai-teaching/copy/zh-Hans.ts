import { AGENTIC_TEACHING_ARTIFACT_RUBRICS } from "../contracts";
import { bindAgenticTeachingCourseOptions } from "./bind-options";

/**
 * 模块练习与 Capstone 共用同一组确定性完整度量规。
 *
 * 字符数与标签检查只能回答“证据字段是否齐全”，不能替代教师、
 * 课程负责人、隐私负责人或研究伦理人员的专业判断。
 */
const MODULE_RUBRICS = AGENTIC_TEACHING_ARTIFACT_RUBRICS["zh-Hans"];

/**
 * 课程 18 的简体中文主文案。
 *
 * GitHub 只用于说明“可检查、可实现的能力”；X 只保留为带日期的
 * 生态信号；学习结果与治理边界必须回到实证研究或官方指南。
 */
export const AGENTIC_TEACHING_ZH_HANS_COPY = bindAgenticTeachingCourseOptions({
  meta: {
    title: "智能体赋能 K‑12 和大学教学",
    kicker: "课程 18 · 先证明学习，再增加自主",
    summary:
      "把智能体工程转译为可问责的教学系统：从教育任务边界与学习契约出发，构建教师副驾驶、提示阶梯导师、多智能体审查、只读知识工具与分阶段试点；以教师审批、儿童权利、无 AI 迁移和可审计证据作为发布条件。",
    audience:
      "面向 K-12 教师与课程主任、大学教师与助教、教学设计者、学校技术与数据负责人、教育产品经理、工程师及研究者。",
    prerequisite:
      "建议理解 prompt、API、JSON 与基本数据隐私概念，并带来一个真实但去标识化的教学单元或支持流程。无需预先掌握某个智能体框架。",
    level: "入门到高级",
    duration: "10 个模块 · 12 小时",
    evidenceNote:
      "证据分层呈现：GitHub 固定提交证明可检查的工程能力；X 原帖只记录带日期的发布信号；学习成效由具边界的研究承担；隐私、年龄适切与问责由官方治理指南约束。开源、热度、一次成功运行或产品公告都不等于教学有效。",
    fallbackNotice:
      "本课程的长篇内容已由编辑以简体中文重写。其他尚未审校的语言版本会回退到英文，并在页面上明确标示。",
    credentialBoundary:
      "本课程的进度、测验与结课清单仅供浏览器内自我追踪，不构成教师资格、学分、专业认证、法律意见、隐私合规批准或真实课堂部署许可。真实试点仍须由所在机构的教学、隐私、法务、采购与伦理责任人审查。",
  },
  ui: {
    catalog: "课程目录",
    course: "课程 18",
    module: "模块",
    modules: "个模块",
    minutes: "分钟",
    phase: "阶段",
    audience: "适用对象",
    prerequisite: "建议先修",
    duration: "学习时长",
    start: "从边界开始",
    resume: "继续课程",
    courseMap: "课程地图",
    tracks: "面向不同教学场景的指南",
    outcomes: "学习成果",
    principles: "不可妥协原则",
    objective: "本模块目标",
    artifact: "本模块产出",
    evidence: "证据模式",
    source: "来源",
    sources: "来源",
    supports: "该来源支持",
    boundary: "该来源不支持",
    accessed: "访问日期",
    practice: "实作练习",
    steps: "操作步骤",
    reviewGate: "人工评审门",
    notebook: "本地证据笔记",
    notebookHelp:
      "按模板写入可审查证据。内容只保存在本浏览器；字符数和标签检查仅表示字段齐全，不评价教学质量。不要输入真实学生个人资料。",
    checkpoint: "知识检查",
    checkAnswer: "检查答案",
    correct: "正确。",
    incorrect: "尚未通过，请依据证据边界再判断。",
    completeModule: "记录模块完成",
    moduleCompleted: "本模块已记录完成",
    checkpointFirst: "请先答对知识检查。",
    artifactFirst: "请先完成符合本地量规的证据笔记。",
    artifactReady: "证据字段已齐全，仍须人工审阅内容质量。",
    artifactNeedsEvidence: "证据字段尚不完整：请补足字数、标签和依据。",
    artifactLocaleNotice: "这份草稿按另一已审校语言模板记录；在你明确用当前语言保存修改前，原完成记录仍有效：",
    artifactRubric: "完整度量规",
    progress: "课程进度",
    saveArtifact: "保存产出物",
    savedLocally: "已保存到本浏览器",
    storageUnavailable: "浏览器存储不可用；本次会话仍可学习，但进度不会持久保留。",
    finalAssessment: "最终测验",
    submitAssessment: "提交最终测验",
    assessmentPassed: "已通过：请继续完成结课证据包。",
    assessmentNotPassed: "尚未通过：须答对至少 10 题，并答对全部关键边界题。",
    answerEveryQuestion: "请先回答全部 12 题。",
    capstone: "结课试点",
    capstoneArtifacts: "结课证据包",
    attestation: "责任声明",
    completeCapstone: "记录结课完成",
    capstoneCompleted: "结课已记录完成",
    capstoneEvidenceReady: "全部证据项已齐全，可交由具名责任人作发布或不发布审查。",
    capstoneEvidenceMissing: "证据包尚不完整；请先完成所有模块对应产出。",
    capstonePrerequisites: "请先通过终测，并记录当前十个模块全部完成，再记录 Capstone。",
    selfTrackingOnly: "仅供自我追踪，不是证书或部署批准。",
    previous: "上一模块",
    next: "下一模块",
    backToCourse: "返回课程总览",
    fallbackLabel: "英文内容回退",
    sourceRegister: "公开证据登记册",
    fieldSignal: "带日期的 X 生态信号",
  },
  phases: {
    frame: {
      title: "界定 · 教学问题先于智能体",
      summary: "先确定学习结果、人类责任、数据与自主度；如果一次对话或固定流程已经足够，就不增加智能体。",
    },
    design: {
      title: "设计 · 让能力服务于教师工作流",
      summary: "从教师副驾驶与单智能体基线开始，再谨慎加入提示阶梯、多角色审查与只读知识工具。",
    },
    govern: {
      title: "治理 · 把权利、诚信与申诉写进系统",
      summary: "对未成年人、个人数据、学术判断与高风险决定设置明确禁区、成人升级和可行的退出路径。",
    },
    prove: {
      title: "证明 · 从轨迹走向独立学习证据",
      summary: "分开验证工程运行、来源忠实、学习迁移、安全公平和教师负担，再以可撤销的小步试点作决定。",
    },
  },
  tracks: [
    {
      id: "k12",
      title: "K-12：教师在场、儿童权利优先",
      summary:
        "从教师使用的低权限副驾驶起步；学生面向流程必须适龄、明确说明 AI 身份、最小化数据，并把危机与权益决定交给合格成年人。",
      focus: [
        "提示而非代答，并要求学习者先尝试",
        "无 AI 新题与延迟保持",
        "儿童权利、照护者沟通与机构数据审查",
        "教师可接管、可停止、可删除",
      ],
      startingModule: "agentic-teaching-boundaries",
    },
    {
      id: "higher-ed",
      title: "大学：学术判断与透明使用优先",
      summary:
        "围绕课程大纲、阅读证据、研讨、实验排错与形成性反馈设计工作流；教师或 TA 先作学术判断，AI 只生成可编辑的中间产物。",
      focus: [
        "引用核验、课程政策与 AI 使用披露",
        "人先评分或判断，AI 后起草反馈",
        "申诉、可访问性与非 AI 路径",
        "迁移、长期保持与教师真实工作量",
      ],
      startingModule: "agentic-teaching-boundaries",
    },
  ],
  principles: [
    "教师和机构对教学目的、最终发布与高风险决定承担责任；“人类在环”必须落实到具名责任人、审批点和接管动作。",
    "GitHub 证明可检查的实现能力，不证明学习、安全或合规；X 只证明某账号在某日发布了某项主张。",
    "学生在 AI 帮助下做得更快、更完整，不等于离开 AI 后已经学会；每个核心流程都要有无 AI 迁移证据。",
    "未成年人数据默认最小化、去标识化、限期保留；危机、健康、纪律、安置和其他权益决定不得自主化。",
    "先建立单智能体或非智能体基线；只有在预注册指标上证明必要时，才增加多智能体与更高自主度。",
    "能力不等于权限；浏览器、MCP 与外部写工具必须采用最小范围、预览、逐次审批、执行后核验与可撤销记录。",
  ],
  outcomes: [
    "区分聊天机器人、copilot、工作流与自主智能体，并判断什么时候不该使用 agent。",
    "写出包含学习结果、来源、权限、数据、审批、停止和评测的一页教育智能体契约。",
    "构建教师签发的备课、辅导或反馈副驾驶，不把最终教学与学术判断交给模型。",
    "以单智能体基线审查多智能体角色、接口、冲突、成本与故障率。",
    "设计只读 MCP/课程资源连接，并准确说明协议不负责教学法、授权审计或自动安全。",
    "为 K-12 流程完成儿童权利、隐私、AI 身份、成人升级和事故响应审查。",
    "把 trace、输出质量、无 AI 迁移、安全公平与教师工作量拆成独立评测层。",
    "交付一套可撤销、可申诉、有停止开关的试点证据包，并作出有依据的发布或不发布决定。",
  ],
  modules: {
    "agentic-teaching-boundaries": {
      kicker: "模块 01 · Frame",
      title: "先画边界：教育智能体不等于自动教师",
      summary:
        "从教学任务、学习结果与人类责任出发，区分可实现能力、产品信号和学习证据；为一个真实场景选择最低必要自主度。",
      objective:
        "判断一个教学问题是否真的需要智能体，并写出教师审批、停止条件与无 AI 验收。",
      artifact: "一页“用或不用智能体”边界卡",
      audienceScenarios: {
        k12: "把教师选定的练习常规改造成低权限、由教师监督的辅导循环。",
        "higher-ed": "在不代作学术判断的前提下，分流并整理办公时间问题。",
      },
      humanApprovalPoints: ["教育者批准教学目的", "教育者设定停止条件"],
      noGoActions: ["用自主智能体替代教师", "发布未经人工审查的高影响输出"],
      sections: [
        {
          heading: "能力事实：循环、工具与人工审批可以实现",
          paragraphs: [
            "OpenAI Agents SDK 的固定仓库展示了 agent、tool、handoff、guardrail、人工审批、追踪与测试等工程原语。它们说明系统可以在目标、动作与观察之间循环，也可以在关键工具调用前暂停。",
            "教学设计不能从“框架支持”直接跳到“应该自动化”。先写不用 agent 的基线：一次检索、模板或固定工作流若已足够，就没有理由扩大自主度与故障面。",
          ],
          bullets: [
            "L0 建议：只给候选与理由，不操作外部系统。",
            "L1 草拟：生成可编辑中间产物，由教师签发。",
            "L2 经审批执行：责任人核对具体动作后逐次批准。",
            "L3 有界自动执行：仅限沙箱内低风险后台任务，不用于学生权益决定。",
          ],
          sourceIds: ["S01"],
          evidenceMode: "instructional-synthesis",
        },
        {
          heading: "学习边界：辅助表现不是独立学习",
          paragraphs: [
            "一项特定高中数学研究发现，无教学护栏的 GPT 能改善有 AI 时的练习表现，但移除 AI 后的考试表现反而低于对照；教师设计的 tutor 大幅缓解了该负效应，却没有显示正向考试效果。这个结果不能跨学科、地区或模型外推。",
            "因此，教育智能体的验收问题不是“回答是否流畅”，而是“学习者离开 AI 后能否在新任务、延迟测验或不同情境中独立表现”。",
          ],
          sourceIds: ["S09"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "日期信号：产品开始强调引导式学习",
          paragraphs: [
            "OpenAI 在 2025-07-29 的 X 发布帖中把 Study Mode 描述为迈向引导式学习的第一步，并提及教育者参与。它能证明该账号在该日如何定位产品，不能证明当前功能、学习效果、普遍适用或安全。",
            "读 X 帖时保留账号、日期、原帖与配套证据；任何效果句都必须另回到研究，任何当前功能句都必须在发布日重查产品文档。",
          ],
          sourceIds: ["S13"],
          evidenceMode: "field-signal",
        },
      ],
      practice: {
        title: "做出最低自主度决定",
        brief:
          "选一个备课、辅导、反馈或办公时间场景，先写非智能体基线，再说明 agent 只有在哪个可测缺口上值得采用。不要输入真实学生资料。",
        steps: [
          "写清学习者最终要独立完成什么，而不是系统要生成什么。",
          "比较模板、搜索、固定工作流与 agent 四种方案的必要性。",
          "指定最低自主度、人类责任人、停止条件与不得自动化的动作。",
          "设计一项移除 AI 后的新任务作为学习验收。",
        ],
        artifact: "智能体边界卡",
        reviewGate:
          "教师或课程负责人必须能指认：为什么需要 agent、谁可停止、哪些决定永不委派，以及什么独立证据才算学会。",
        starter: `任务边界：
人类责任人：
允许自主度：
停止条件：
无 AI 迁移证据：`,
        rubric: MODULE_RUBRICS["agentic-teaching-boundaries"],
      },
      checkpoint: {
        question: "哪一项最能证明一个教育智能体实现了学习目标？",
        options: [
          "仓库有很多 stars",
          "学习者在有 AI 时快速完成原题",
          "学习者在无 AI 的新情境中独立展示目标能力",
          "官方账号在 X 宣布了学习功能",
        ],
        correctIndex: 2,
        explanation:
          "工程热度、产品发布和辅助完成都不是独立学习证据；需要在移除 AI 后用新任务、延迟测验或迁移表现验证。",
      },
      takeaway: "先证明一个教学问题值得使用 agent，再讨论如何让 agent 做更多。",
    },
    "learning-design-task-contracts": {
      kicker: "模块 02 · Frame",
      title: "把教学意图写成可审计任务契约",
      summary:
        "用一页契约固定学习结果、年龄与情境、批准来源、工具权限、数据路径、审批、升级和评测，避免模型悄悄扩大任务。",
      objective:
        "把模糊的“帮助学生”改写为教师可签署、工程师可实现、审查者可拒绝的教学契约。",
      artifact: "教育智能体契约 v1",
      audienceScenarios: {
        k12: "围绕教师确定的课时目标，编写年龄适切的任务契约。",
        "higher-ed": "为课程助理编写遵守教学大纲与考核政策的任务契约。",
      },
      humanApprovalPoints: ["教育者签署任务契约", "数据责任人批准输入范围"],
      noGoActions: ["在权限未定义时运行", "悄然改变课程或评估政策"],
      sections: [
        {
          heading: "从目标到停止：契约是控制面",
          paragraphs: [
            "agent 框架可以提供 guardrail、人工批准与轨迹，但谁有权调用什么工具、何时停止以及谁承担后果，仍由应用与机构定义。契约把这些隐性选择变成发布前可检查的字段。",
            "学习结果应写成学习者离开 AI 后的可观察表现；系统产出只是一种手段。每个外部写动作、个性化反馈和高风险判断都要有明确责任人。",
          ],
          bullets: [
            "任务：教、练、评、管，还是只检索与格式化？",
            "权限：只读、草拟、发送、发布、修改或删除？",
            "停止：来源冲突、低置信、越权、危机或连续误解时怎么办？",
          ],
          sourceIds: ["S01"],
          evidenceMode: "instructional-synthesis",
        },
        {
          heading: "人的主体性与儿童权利不是附录",
          paragraphs: [
            "UNESCO 的教育治理指南强调人的主体性、隐私、年龄适切、监督与教学验证；UNICEF 的儿童 AI 指南进一步强调安全、公平、透明、问责、权利与持续监督。",
            "这些全球指南不是当地法律或产品合规证书。真实部署前仍需依据地区、年龄、数据类型、学校政策与供应商条款，由机构隐私、法务及教学责任人审查。",
          ],
          sourceIds: ["S15", "S16"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "把合同条款连到可证伪指标",
          paragraphs: [
            "课程建议把每项承诺连接到可观察证据：来源权威对应引用可打开率，教师审批对应采纳、编辑与拒绝记录，最小权限对应越权测试，学习结果对应无 AI 新题。",
            "一次顺利演示只能说明某条路径曾运行。契约必须同时定义失败样本、接管动作、日志最小化、删除期限和重新评审日期。",
          ],
          sourceIds: ["S01", "S15", "S16"],
          evidenceMode: "instructional-synthesis",
        },
      ],
      practice: {
        title: "签署一页教育智能体契约",
        brief:
          "把模块 1 的边界卡展开为可执行契约。对 K-12 写明年龄、成人监督和儿童数据；对高校写明课程政策、学术判断与申诉。",
        steps: [
          "把学习结果改写为无 AI 条件下的可观察行为。",
          "列出批准来源及其版本、地区、许可与新鲜度。",
          "逐项标明输入数据、工具读写权限和保留期限。",
          "指定审批人、升级路径、禁止动作和成功/停止指标。",
        ],
        artifact: "教育智能体任务契约",
        reviewGate:
          "教师、数据责任人与工程负责人共同确认：契约没有未定义权限，且任何真实学生输入前已完成机构审查。",
        starter: `学习结果：
批准来源：
数据与权限：
审批与升级：
禁止动作：
停止条件：
成功指标：`,
        rubric: MODULE_RUBRICS["learning-design-task-contracts"],
      },
      checkpoint: {
        question: "下列哪项最适合作为教育智能体契约中的“学习结果”？",
        options: [
          "系统生成 20 道题",
          "学生在无 AI 的新材料上解释并应用目标概念",
          "模型平均响应时间少于两秒",
          "教师觉得界面很现代",
        ],
        correctIndex: 1,
        explanation:
          "系统产出和运行指标可以记录，但学习结果必须描述学习者能够独立展示的知识、技能或判断。",
      },
      takeaway: "契约不是 prompt 装饰，而是教学目的、权限与问责的共同控制面。",
    },
    "teacher-copilot-workflows": {
      kicker: "模块 03 · Design",
      title: "教师副驾驶：从批准资源到教师签发",
      summary:
        "设计一条只读检索、证据回链、可访问性检查与教师签发的备课流程；AI 产出始终是可编辑中间稿。",
      objective:
        "把结构化课程资源转化为一份可追溯课包，同时保留教师对课程适切、事实与发布的最终控制。",
      artifact: "教师签发的 45 分钟课包规格",
      audienceScenarios: {
        k12: "从已批准的课程资源草拟一份 45 分钟课包，交由教师审改。",
        "higher-ed": "准备带证据链接和可访问性检查的研讨方案，交由任课教师批准。",
      },
      humanApprovalPoints: ["教师核验课程与本地标准的适配", "教师审改并签发教学材料"],
      noGoActions: ["编造标准或课程对齐关系", "自动向学生发布材料"],
      sections: [
        {
          heading: "结构化课程资源能提供什么",
          paragraphs: [
            "Oak Open Curriculum Ecosystem 的固定仓库展示了课程 API、搜索、图谱与 MCP 界面，可向获批工具提供课时、先备知识和常见误概念等结构化信息。",
            "该项目在固定提交时为无需邀请或 allowlist 的 public beta，主要对齐英格兰课程；代码、课程数据、证据内容与品牌也属于不同权利层。检索到内容并不自动保证本地标准对齐、适龄、准确、许可合规或教学有效。",
          ],
          sourceIds: ["S06"],
          evidenceMode: "version-watch",
        },
        {
          heading: "副驾驶的关键结构是可编辑与可拒绝",
          paragraphs: [
            "Tutor CoPilot 的特定 K-12 数学现场研究把 AI 建议交给人类导师选择、编辑、重生成或放弃，并报告了该情境中的有界增益。课程复刻的是人类控制结构，而不是把效果数字搬到其他年级或学科。",
            "备课副驾驶也应面向教师：系统检索、草拟和标注不确定性，教师核对课程目标、年级、误概念、可访问性和事实后才签发。",
          ],
          sourceIds: ["S07"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "从只读材料到课堂发布要跨过一道门",
          paragraphs: [
            "课程建议把流程拆成“批准来源检索 → 证据回链 → 课包草拟 → 事实与可访问性检查 → 教师删改署名 → 发布”。任何自动推送到 LMS、发送给学生或宣称标准对齐的动作都在教师签发前阻断。",
            "UNESCO 强调人类监督与教学验证；因此教师签发应记录修改理由与未解决项，而不是只勾选一个笼统的 human-in-the-loop 复选框。",
          ],
          sourceIds: ["S06", "S15"],
          evidenceMode: "instructional-synthesis",
        },
      ],
      practice: {
        title: "设计可签发的备课副驾驶",
        brief:
          "用公开或机构已批准且去标识化的材料，为 K-12 课时或大学研讨设计一份课包规格；不要让系统直接发布。",
        steps: [
          "锁定教学目标、学习者背景和只读来源范围。",
          "要求每个核心事实、标准或阅读主张回链到具体来源。",
          "加入适龄、可访问性、许可与本地课程对齐检查。",
          "写出教师删改、署名、签发和拒绝发布的明确动作。",
        ],
        artifact: "教师副驾驶课包与签发记录",
        reviewGate:
          "教师逐条核验目标、事实、年级适切、来源权利和可访问性；未签发材料不得进入课堂或 LMS。",
        starter: `教学目标：
只读来源：
学习者活动：
副驾驶产出：
可访问性检查：
教师签发点：
发布禁区：`,
        rubric: MODULE_RUBRICS["teacher-copilot-workflows"],
      },
      checkpoint: {
        question: "结构化课程检索返回了“标准对齐”材料后，下一步最合理的做法是？",
        options: [
          "自动发布到 LMS",
          "因为来自开源仓库而直接采用",
          "由教师核验本地标准、适龄性、事实、许可与可访问性后签发",
          "让另一个模型投票决定",
        ],
        correctIndex: 2,
        explanation:
          "结构化检索提高可追溯性，但不自动保证本地课程对齐、适龄、正确、许可合规或教学有效。",
      },
      takeaway: "副驾驶的价值不是替教师发布，而是让教师更容易看见证据、修改并负责。",
    },
    "tutoring-feedback-agents": {
      kicker: "模块 04 · Design",
      title: "辅导与反馈：先判断、再提示、后迁移",
      summary:
        "把学习者先尝试、三层提示、教师或 TA 先作判断、AI 后起草和无 AI 新任务组织成可控状态机。",
      objective:
        "设计一个帮助学习者思考而不代做、帮助教师表达而不替代学术判断的辅导或反馈流程。",
      artifact: "提示阶梯或人先判断的反馈协议",
      audienceScenarios: {
        k12: "学习者先尝试题目，再提供诊断与三个层级的渐进提示。",
        "higher-ed": "TA 完成学术判断后，才由 AI 草拟可编辑的反馈。",
      },
      humanApprovalPoints: ["教育者核验诊断与提示策略", "教育者审核并签发反馈"],
      noGoActions: ["在学习者尝试前直接给答案", "由智能体自主给出最终成绩"],
      sections: [
        {
          heading: "提示护栏的目的不是让对话更长",
          paragraphs: [
            "高中数学研究提醒我们：无护栏的通用帮助可能让学生在使用时表现更好，却削弱移除 AI 后的表现。教学流程应先要求学生解释已知和首次尝试，再逐层给方向、子步骤与相似例，最后让学生重做并解释。",
            "无 AI 新题是流程的一部分，不是课后可选附件。连续对话中的正确率、满意度或完成速度都不能替代迁移证据。",
          ],
          sourceIds: ["S09"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "人类先判断，AI 只起草中间产物",
          paragraphs: [
            "Tutor CoPilot 展示了导师选择、编辑或放弃建议的结构；一项小型大学预印本实验则在 TA 完成评分后才显示可编辑 AI 反馈草稿，并报告反馈提供率提高。",
            "两项证据都不支持自主最终评分。教师或 TA 应先依据 rubric 作学术判断，AI 再把该判断转化为具体、可操作的草稿；发布前仍由人核对原作业证据、语气、可访问性与政策。",
          ],
          sourceIds: ["S07", "S11"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "跨 K-12 与大学，效果都必须有边界",
          paragraphs: [
            "一项哈佛本科物理课的定制 tutor 研究报告了特定两次课中的短期学习增益，但不能扩写为 AI 普遍优于教师或课堂。K-12 与高教证据都依赖具体课程、系统、学习者与测量。",
            "儿童流程还需明确 AI 身份、避免拟人化依赖，并把反复卡住、危机、健康和不适龄内容转交成年人。高教流程则要保留课程政策、披露、申诉和非 AI 支持路径。",
          ],
          sourceIds: ["S10", "S16"],
          evidenceMode: "instructional-synthesis",
        },
      ],
      practice: {
        title: "写出一条不会代做的支持协议",
        brief:
          "二选一：设计 K-12 提示阶梯导师，或设计大学“教师/TA 先判断、AI 后起草”反馈流。所有案例均使用合成或去标识化材料。",
        steps: [
          "规定学习者或教师必须先产生什么可观察判断。",
          "写出三个信息量递增、每层都等待新尝试的提示。",
          "列出不得生成的完整答案、最终成绩、纪律或危机判断。",
          "设计一项移除 AI 后的新任务及教师审批记录。",
        ],
        artifact: "辅导或反馈状态机",
        reviewGate:
          "教师确认系统不先给答案、不作最终学术判断，并能把危机、越权和反复误解升级给具名成年人。",
        starter: `先行判断：
提示阶梯：
教师审批：
禁止输出：
无 AI 迁移任务：`,
        rubric: MODULE_RUBRICS["tutoring-feedback-agents"],
      },
      checkpoint: {
        question: "哪条流程最符合本模块证据边界？",
        options: [
          "AI 先给最终分数，再请 TA 修改",
          "学生一提问就给完整答案，以提高完成率",
          "教师或学习者先判断，AI 提供可编辑支持，最后用无 AI 新任务检验",
          "只要学生满意就视为学会",
        ],
        correctIndex: 2,
        explanation:
          "人先判断、AI 后支持和无 AI 迁移共同保护学术责任并区分辅助完成与独立学习。",
      },
      takeaway: "好的辅导智能体不是更快给答案，而是让思考、教师判断与独立迁移都可见。",
    },
    "multi-agent-inquiry": {
      kicker: "模块 05 · Design",
      title: "多智能体审查：先证明必要，再增加角色",
      summary:
        "以单智能体基线对比并行的来源、教学法、可访问性与安全审查；明确接口、保留冲突，并测量成本与故障。",
      objective:
        "为可分解的教学任务设计多角色实验，并用预注册指标决定保留还是回退。",
      artifact: "单/多智能体 A/B 审查协议",
      audienceScenarios: {
        k12: "比较单智能体与专业角色对一份教师主导探究包的审查结果。",
        "higher-ed": "依据明确的汇合契约，并行完成来源、方法与可访问性审查。",
      },
      humanApprovalPoints: ["教育者批准各角色的权限与边界", "教育者裁决智能体之间的冲突"],
      noGoActions: ["把智能体多数意见当作事实", "没有单智能体基线就增加复杂度"],
      sections: [
        {
          heading: "仓库展示模式，不展示教学必然增益",
          paragraphs: [
            "Google ADK 的固定示例展示协调器、顺序与并行 worker、共享状态、澄清、追踪和评测；OpenMAIC 展示 AI 教师/同伴角色、课件、测验、模拟与项目场景。",
            "这些是可检查的架构能力。它们不证明更多角色让学习更好，也不保证生成内容、评分或角色协商正确。复杂度会增加 token、延迟、汇总偏差与故障面。",
          ],
          sourceIds: ["S05", "S08"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "可分、可验、可合并，才值得并行",
          paragraphs: [
            "课程建议先让一个 agent 完成同一份教学材料审查，记录质量、教师修改量、成本、延迟与失败率。多角色版本只有在子任务输入输出清楚、可独立验收，并能在汇总时保留分歧时才有意义。",
            "不要用 agent 多数票替代事实或教师判断。来源专家、教学法或方法专家、可访问性专家和安全专家意见冲突时，汇总器应展示冲突、证据与未决项，由具名教师解决。",
          ],
          sourceIds: ["S05", "S08"],
          evidenceMode: "instructional-synthesis",
        },
        {
          heading: "X 只告诉我们生态在何时宣称什么",
          paragraphs: [
            "OpenAI Developers 在 2026-03-16 的 X 帖宣布 Codex subagents，并描述保持主上下文整洁、并行处理任务不同部分及运行中干预单个智能体；OpenMAIC 作者在 2026-03-15 发布项目及架构主张。",
            "这两条带日期信号可帮助课程解释产品与项目语境，但不能证明多智能体使教学更快、更准、更安全或更有效。OpenMAIC 的技术与许可主张须回到固定仓库，Codex subagents 的技术主张须回到当前一方文档；学习结果须另做直接实验。",
          ],
          sourceIds: ["S12", "S14"],
          evidenceMode: "field-signal",
        },
      ],
      practice: {
        title: "预注册一场单/多智能体比较",
        brief:
          "对同一份去标识化教案或阅读包，比较单 agent 与四类专家并行审查；在运行前写下保留多智能体的最低增益。",
        steps: [
          "建立单智能体基线及人工黄金审查样本。",
          "为每个角色定义最小上下文、输出 schema 与验收标准。",
          "规定汇总器必须保留来源冲突和专家异议。",
          "比较事实错误、风险遗漏、修改量、成本、延迟和失败率并作回退决定。",
        ],
        artifact: "多智能体必要性实验卡",
        reviewGate:
          "教师与技术负责人共同确认：任务确实可分，冲突不会被多数票掩盖，且未达预注册增益时会回退。",
        starter: `单智能体基线：
角色与接口：
冲突保留：
比较指标：
回退条件：`,
        rubric: MODULE_RUBRICS["multi-agent-inquiry"],
      },
      checkpoint: {
        question: "何时最适合引入多智能体？",
        options: [
          "只要能创建更多角色",
          "任务可分、接口清楚、子结果可独立验证，且相对基线有预注册增益",
          "希望投票产生真相时",
          "一个短且线性的低风险任务",
        ],
        correctIndex: 1,
        explanation:
          "多智能体增加协调与失败成本；只有可分解、可验证且相对简单基线有足够增益时才值得保留。",
      },
      takeaway: "多智能体是要被证明的复杂度，不是课程先进程度的装饰。",
    },
    "knowledge-tools-mcp": {
      kicker: "模块 06 · Design",
      title: "知识工具与 MCP：连接能力，不外包治理",
      summary:
        "理解 host-client-server 与 resources、tools、prompts 的边界；从无学生个人数据的只读课程连接开始。",
      objective:
        "写出一个最小权限的课程资源连接契约，并区分协议能力、教学脚本、授权与审计。",
      artifact: "只读 MCP 课程资源契约",
      audienceScenarios: {
        k12: "只暴露一小组已批准、只读且保留出处的课程资源。",
        "higher-ed": "连接带版本的课程资源索引，而不暴露整个网盘或 LMS。",
      },
      humanApprovalPoints: ["资源所有者批准可访问范围", "操作责任人逐项批准每个写工具"],
      noGoActions: ["接入或公开未经审查的服务器", "授予整个网盘或 LMS 的宽泛访问权限"],
      sections: [
        {
          heading: "MCP 的事实边界",
          paragraphs: [
            "MCP 规范定义 host-client-server 架构、resources、tools、prompts 与能力协商。host 负责用户同意、授权、安全策略、复杂编排以及跨 client 的上下文聚合。",
            "因此 MCP 是连接协议，不是教学法、完整编排器、安全审计或自动最小权限系统。每个 server 都应被视为独立信任边界，本地 STDIO server 也不是天然沙箱。",
          ],
          sourceIds: ["S02"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "课程连接先小、先读、先有出处",
          paragraphs: [
            "Oak 的开放课程项目展示课程 API、搜索、图谱和 MCP 表面如何暴露课时、先备知识与误概念。首个学校实验应只连接批准的、无学生个人资料的小型资源集合。",
            "来源卡至少记录版本、地区、许可、更新时间与适用年级。grounding 可减少无来源生成，却不能自动保证准确、适龄、本地对齐、许可合规或教学有效。",
          ],
          sourceIds: ["S06"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "协议与资源都会漂移",
          paragraphs: [
            "本课程采用固定 MCP 规范与仓库提交，同时记录 Oak 项目的 public-beta 状态。发布前必须复查协议版本、传输与授权要求、仓库 revision、资源许可和产品可用性。",
            "所有写工具应与只读检索分离：另建身份、另设权限、逐次展示参数并等待人类批准。能力协商成功只说明接口可用，不说明动作已获机构授权。",
          ],
          sourceIds: ["S02", "S06"],
          evidenceMode: "version-watch",
        },
      ],
      practice: {
        title: "设计第一个只读课程连接",
        brief:
          "用公开、合成或机构已批准资料，定义一个仅检索课程目标、先备知识与误概念的 MCP 连接；不接 LMS、网盘或学生记录。",
        steps: [
          "列出 server 暴露的最小 resources 与只读 tools。",
          "写明 host 的同意、授权、上下文隔离和日志责任。",
          "固定协议与资源版本，并列出每项许可和适用边界。",
          "为来源冲突、缺失、越权请求和任何写动作设置拒绝或升级。",
        ],
        artifact: "课程资源 MCP 信任边界图",
        reviewGate:
          "数据责任人与教师确认首版不含个人资料、不含写工具，且每个返回主张都保留来源和版本。",
        starter: `资源范围：
Host 责任：
工具权限：
版本记录：
拒绝与升级：`,
        rubric: MODULE_RUBRICS["knowledge-tools-mcp"],
      },
      checkpoint: {
        question: "以下哪项不是 MCP 自动提供的保证？",
        options: [
          "host-client-server 通信边界",
          "resources、tools 与 prompts 的能力协商",
          "教学有效、最小权限与机构合规",
          "客户端与服务器之间的协议结构",
        ],
        correctIndex: 2,
        explanation:
          "MCP 连接能力，但教学法、授权、最小权限、审计和合规必须由 host、应用与机构另行设计和验证。",
      },
      takeaway: "MCP 让知识和工具可连接；谁能看、能做、为何做以及是否有效，仍是人的责任。",
    },
    "k12-safeguards": {
      kicker: "模块 07 · Govern",
      title: "K-12 护栏：儿童权利、隐私与成人升级",
      summary:
        "在任何学习者面向试点前，完成儿童权利影响评估、字段级数据图、AI 身份说明、供应商审查和事故响应。",
      objective:
        "识别未成年人流程中不能自主化的数据与决定，并为危机、越权和伤害建立具名成人升级路径。",
      artifact: "儿童权利影响评估与数据流图",
      audienceScenarios: {
        k12: "在任何学习者面向试点前，完成儿童权利与数据流审查。",
        "higher-ed": "对未成年人、双录取学生和敏感支持情境采用同等护栏。",
      },
      humanApprovalPoints: ["机构批准字段级数据路径", "具名成年人处理危机与其他升级"],
      noGoActions: [
        "在个人账号中处理可识别学生数据",
        "用拟人化与持续记忆培养陪伴依赖",
        "让智能体自动作危机或心理健康响应",
      ],
      sections: [
        {
          heading: "儿童中心治理必须贯穿全生命周期",
          paragraphs: [
            "UNESCO 与 UNICEF 把隐私、年龄适切、人的主体性、安全、公平、透明、问责、包容与持续评估放在核心位置。儿童应以适龄语言知道自己正与 AI 交互。",
            "不得把系统描述为朋友、治疗师或可信赖的知心人，也不得暗示排他性、依赖或情感优先地位。危机、健康、疑似伤害、高风险评估、安置、学校申请和救济等事项要进入已有的成人支持与救济流程。",
          ],
          sourceIds: ["S15", "S16"],
          evidenceMode: "instructional-synthesis",
        },
        {
          heading: "浏览器能力会把数据风险变成真实动作",
          paragraphs: [
            "Anthropic computer-use demo 与 Browser Use 仓库展示了打开页面、读取状态、点击、输入、上传和截图等能力，也提示隔离、最小权限、域白名单、确认、提示注入、cookie 与误提交风险。",
            "K-12 试点默认禁止使用个人账号、真实学生凭据以及上传可识别 IEP、健康、辅导或行为记录。读取与写入必须分轨；发送、发布、提交、删除和改权限应阻断。",
          ],
          sourceIds: ["S03", "S04"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "提示护栏与数据护栏要一起验收",
          paragraphs: [
            "学习护栏要求系统先诊断、等待学生尝试、逐层提示并安排无 AI 新题；权利护栏要求最小化数据、设置删除期、说明 AI 身份并允许教师接管。缺少任一侧都不能进入学生试点。",
            "全球指南与单项研究不能替代当地法律审查。机构需结合所在地、年龄、数据类型、用途和供应商合同决定同意、保留、访问与删除要求。",
          ],
          sourceIds: ["S09", "S15", "S16"],
          evidenceMode: "instructional-synthesis",
        },
      ],
      practice: {
        title: "完成学习者面向流程的儿童权利审查",
        brief:
          "对一个合成 K-12 辅导场景逐字段画出数据流，并把自动提交、危机判断、纪律建议和拟人化依赖列为测试用例。",
        steps: [
          "列出采集、推断、发送、存储、访问和删除的每个字段。",
          "为年龄、语言、障碍与监督需求设计适龄说明和替代路径。",
          "把 AI 身份、非拟人化、危机转交与照护者/学校流程写入交互。",
          "列出供应商条款、当地法律与机构政策中尚待责任人核验的项目。",
        ],
        artifact: "儿童权利影响评估包",
        reviewGate:
          "学校教学、隐私与儿童保护责任人共同签署；未通过数据路径和成人升级演练前，不得让真实未成年人使用。",
        starter: `儿童权利：
数据流与保留：
AI 身份说明：
成人升级路径：
事件响应：
退出/停止决定：
禁止自动决定：`,
        rubric: MODULE_RUBRICS["k12-safeguards"],
      },
      checkpoint: {
        question: "K-12 学习者面向试点的默认数据与动作策略应是？",
        options: [
          "收集完整对话与姓名以便未来训练",
          "用个人账号登录 LMS，失败后再补权限",
          "最小化并去标识数据，限制保留，禁用高风险写动作，并设置成人升级",
          "只要家长同意就可以自动作纪律判断",
        ],
        correctIndex: 2,
        explanation:
          "未成年人流程需要数据最小化、限期保留、明确 AI 身份、最小权限和成人责任；同意也不自动授权高风险决定。",
      },
      takeaway: "儿童安全不是一句“有护栏”，而是一张能被审计、停止、申诉和删除的数据与责任链。",
    },
    "higher-ed-integrity": {
      kicker: "模块 08 · Govern",
      title: "大学诚信：AI 支持不能越过学术判断",
      summary:
        "把课程政策、引用核验、教师/TA 先判断、AI 后起草、透明披露、申诉与非 AI 路径写入教学工作流。",
      objective:
        "设计一个尊重课程政策和学术责任的反馈、研讨、阅读或实验支持流程。",
      artifact: "大学 AI 使用与反馈完整性协议",
      audienceScenarios: {
        k12: "把作者身份与 AI 使用披露规则转化为年龄适切的课堂常规。",
        "higher-ed": "让智能体工作流遵守教学大纲、申诉、可访问性与研究伦理要求。",
      },
      humanApprovalPoints: ["教师作出最终学术判断", "学习者可以申诉或选择非 AI 路径"],
      noGoActions: [
        "由智能体自动认定学术不端",
        "隐瞒 AI 对作品或反馈的贡献",
        "发布未经专业审查的研究建议",
      ],
      sections: [
        {
          heading: "反馈草稿必须位于人类判断之后",
          paragraphs: [
            "一项小型大学预印本实验在 TA 完成评分后才呈现可编辑 AI 反馈草稿，并报告反馈提供率提高 10.8 个百分点。它不证明学习增益、自动评分效度、总时间节省或普遍效果。",
            "可迁移的设计原则是顺序：教师或 TA 先依据 rubric 对学生工作作学术判断，AI 再帮助表达具体反馈；人可以使用、编辑或拒绝，并对最终发布负责。",
          ],
          sourceIds: ["S11"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "单门课程的短期增益不是替代课堂的证据",
          paragraphs: [
            "一项哈佛本科物理课程的定制 AI tutor 交叉实验报告了特定两次课中的短期学习增益。研究对象、课程、内容和系统高度具体。",
            "课程不能把论文标题扩写成“AI 普遍优于教师”。实施前仍要测量延迟保持、跨任务迁移、不同学习者群体、教师工作量与课程真实约束。",
          ],
          sourceIds: ["S10"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "透明、申诉与可行退出共同保护诚信",
          paragraphs: [
            "课程政策应明确允许与禁止的 AI 用途、披露与署名、资料许可、研究伦理、可访问性、人工复核和学术不端流程。模型不得自动作最终成绩或不端裁决。",
            "UNESCO 与 UNICEF 的治理原则提示我们保留人的主体性、公平、透明与救济；对未成年或双录取学生，应同时采用更严格的儿童权利与数据路径审查。",
          ],
          sourceIds: ["S15", "S16"],
          evidenceMode: "instructional-synthesis",
        },
      ],
      practice: {
        title: "编写人先判断的大学反馈协议",
        brief:
          "选择形成性反馈、阅读包、实验排错或办公时间分流之一，写明课程政策、AI 角色、人工学术判断、披露和申诉。",
        steps: [
          "引用课程大纲中允许与禁止的 AI 使用规则。",
          "固定教师/TA 在 AI 介入前完成的判断及证据。",
          "定义 AI 可起草的中间产物、可编辑性和发布签名。",
          "提供披露、人工复核、申诉、可访问性与非 AI 完成路径。",
        ],
        artifact: "高校教学完整性与反馈协议",
        reviewGate:
          "课程负责人确认最终评分与不端裁决仍由人作出，学生能理解 AI 角色并获得人工复核、申诉和可行退出。",
        starter: `课程政策：
人类学术判断：
AI 可编辑草稿：
披露与署名：
申诉与退出：`,
        rubric: MODULE_RUBRICS["higher-ed-integrity"],
      },
      checkpoint: {
        question: "哪种反馈流程最符合现有有界证据？",
        options: [
          "AI 自动评分并直接发布",
          "TA 先完成学术判断，AI 再起草可编辑反馈，TA 审核签发",
          "让学生满意度替代学习评测",
          "由多个模型投票裁定学术不端",
        ],
        correctIndex: 1,
        explanation:
          "现有研究支持的是人先判断、AI 后起草的可编辑中间产物，不支持自主最终评分或学术不端裁决。",
      },
      takeaway: "大学教学中的 AI 可以扩大反馈能力，但不能接管学术判断、署名责任与学生救济。",
    },
    "evals-learning-evidence": {
      kicker: "模块 09 · Prove",
      title: "Evals：轨迹可见不等于学习成立",
      summary:
        "把工程、来源、教学、学习、人类工作、安全权利与公平运营拆成七层评测，并把无 AI 迁移设为核心结果。",
      objective:
        "建立覆盖正常与失败情境的评测集，分别验证系统运行、学习结果与风险边界。",
      artifact: "分层 eval set 与人工抽检表",
      audienceScenarios: {
        k12: "测量适龄的无 AI 迁移任务、安全失败与教师接管。",
        "higher-ed": "在同一评测集中分开衡量轨迹质量、输出质量、学习迁移与运营成本。",
      },
      humanApprovalPoints: ["教育者审定学习量规", "评审组读取并讨论失败样本"],
      noGoActions: ["把完整 trace 等同于评测通过", "把 AI 辅助完成等同于独立学习"],
      sections: [
        {
          heading: "Trace 回答发生了什么，eval 回答是否足够好",
          paragraphs: [
            "OpenAI Agents SDK 与 Google ADK 展示了追踪、测试和评测等工程能力。轨迹可以记录模型生成、工具调用、handoff、guardrail、错误与延迟，但一次看似顺利的轨迹不是质量结论。",
            "教育 trace 可能含敏感输入输出，应在写入前去标识化、关闭不必要捕获、限制访问并设置删除期。真实模型、网络、浏览器与 MCP 仍需集成和端到端测试。",
          ],
          sourceIds: ["S01", "S05"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "学习证据必须跨出当前对话",
          paragraphs: [
            "高中数学研究显示辅助练习与移除 AI 后的考试可以朝相反方向变化；哈佛物理研究则展示了一个高度定制、短期、有边界的正向结果。二者共同说明不能用单一平均完成率概括学习。",
            "评测应包含无 AI 新题、延迟保持、解释质量与跨情境迁移，并记录模型、prompt、课程、教师、学习者与测量条件，以免无边界外推。",
          ],
          sourceIds: ["S09", "S10"],
          evidenceMode: "source-grounded",
        },
        {
          heading: "同时测教师工作与谁受益、谁受损",
          paragraphs: [
            "Tutor CoPilot 与大学反馈实验都把 AI 放在可编辑建议的位置，也报告了与特定人类工作相关的结果。评测不能只看产出数量，还应看采纳、编辑、拒绝、接管、实际耗时和教师判断质量。",
            "按年级、语言、障碍、基础水平等相关群体切片安全、学习与可访问性结果；审阅失败样本，不让平均分掩盖危机漏转、PII 泄漏或越权等安全关键失败。",
          ],
          sourceIds: ["S07", "S11"],
          evidenceMode: "instructional-synthesis",
        },
      ],
      practice: {
        title: "建立七层评测与迁移门",
        brief:
          "为前一模块的流程设计至少包含正常、来源冲突、直接答案诱导、个人数据、危机和可访问性情境的评测蓝图。",
        steps: [
          "分别列出工程、来源、教学、学习、人类工作、安全权利与公平运营指标。",
          "为每个案例写预期动作、禁止动作、可接受输出、必引来源和人工评分说明。",
          "加入无 AI 新题与延迟测，并预注册通过门槛和关键失败。",
          "规定重复运行、群体切片、人工抽检、敏感 trace 处理和失败复盘。",
        ],
        artifact: "教育智能体评测集规格",
        reviewGate:
          "教学与风险评审者共同读取失败样本；任何隐私泄漏、越权、高风险自动决定或危机漏转均不得由平均分抵消。",
        starter: `工程评测：
学习评测：
安全与公平：
人工抽检：
无 AI 迁移：
发布门槛：`,
        rubric: MODULE_RUBRICS["evals-learning-evidence"],
      },
      checkpoint: {
        question: "下列哪项能把 observability 与学习评测正确区分？",
        options: [
          "有完整 trace 就证明学生学会了",
          "trace 说明流程发生了什么；无 AI 新任务等结果说明是否达到学习目标",
          "只要工具调用成功就无需人工抽检",
          "平均分高可抵消一次学生 PII 泄漏",
        ],
        correctIndex: 1,
        explanation:
          "轨迹服务于诊断与审计，学习结果须由独立任务等结果证据承担；安全关键失败应 fail closed。",
      },
      takeaway: "可观察性让失败可见；只有有边界的结果评测才能说明学习、安全与公平是否达标。",
    },
    "pilot-capstone": {
      kicker: "模块 10 · Prove",
      title: "试点：用证据决定发布，也允许不发布",
      summary:
        "把前九个模块合并成教师、学习者与治理三条通道，从 shadow 到 teacher-only 再到小范围学习者试点逐级放行。",
      objective:
        "交付一套可撤销、可申诉、可停止、能验证无 AI 迁移的试点证据包，并由具名责任人作决定。",
      artifact: "K-12/大学双路径、教师/学习者/治理三通道试点与发布证据包",
      audienceScenarios: {
        k12: "只有儿童权利与数据门通过后，才从 shadow 模式推进到教师监督的小范围试点。",
        "higher-ed": "运行可撤销的课程试点，并提供退出、申诉、审计与无 AI 对照任务。",
      },
      humanApprovalPoints: ["具名责任人作出发布或不发布决定", "具名责任人拥有停止和回滚试点的权限"],
      noGoActions: [
        "不经分阶段验证就全校铺开",
        "没有退出标准就发布",
        "把 Capstone 完成当作专业认证或部署批准",
      ],
      sections: [
        {
          heading: "能力扩大必须跟随治理门，而不是演示热度",
          paragraphs: [
            "浏览器与计算机使用仓库展示真实点击、输入、上传和截图能力，也暴露提示注入、凭据与误提交风险；UNESCO 与 UNICEF 要求人类监督、隐私、年龄适切、权利与持续评估。",
            "课程建议按 shadow、teacher-only、小范围学习者、班级四级推进。每一级都要有具名 owner、进入条件、退出标准、kill switch、事件响应、申诉与删除演练。",
          ],
          sourceIds: ["S03", "S04", "S15", "S16"],
          evidenceMode: "instructional-synthesis",
        },
        {
          heading: "证据包同时约束架构、来源与人类工作",
          paragraphs: [
            "试点至少包含固定版本的 agent 能力、只读 MCP 课程连接、教师可编辑副驾驶和单智能体基线；若加入多智能体，必须提供相对基线的 A/B 证据并保留角色冲突。",
            "课程资源、代码、论文与品牌许可分层记录；所有外部写动作关闭或强制逐次审批。trace 不含直接标识符，敏感捕获显式关闭并有保留期限。",
          ],
          sourceIds: ["S01", "S02", "S05", "S06", "S07", "S08"],
          evidenceMode: "instructional-synthesis",
        },
        {
          heading: "发布结论必须保留研究边界",
          paragraphs: [
            "不同 K-12 与大学研究给出的结果依赖具体平台、学科、教师、课程和测量；有的显示无护栏帮助损害独立表现，有的显示定制系统或人类可编辑建议在特定场景中有益。",
            "试点不能借用他处效果数字作为本地结论。具名责任人要根据本地无 AI 迁移、安全、公平、教师工作量与事件数据作“发布、限条件发布或不发布”决定，并记录下一次模型、规范与政策复核日期。",
          ],
          sourceIds: ["S09", "S10", "S11"],
          evidenceMode: "instructional-synthesis",
        },
      ],
      practice: {
        title: "主持一次发布/不发布审查",
        brief:
          "用合成或去标识化案例组装前九个产出，选择 K-12 或大学路径，写明从 shadow 到小范围试点的每一道门。",
        steps: [
          "合并任务契约、数据权限、工作流、来源版本、评测和人工责任。",
          "为每个阶段定义进入、退出、回滚、kill switch 与事件演练。",
          "逐项检查无 AI 迁移、隐私、安全、公平、可访问性与教师负担。",
          "由具名责任人记录发布、限条件发布或不发布及其证据和复核日期。",
        ],
        artifact: "教育智能体试点发布决定",
        reviewGate:
          "未成年人或真实课程试点只有在机构教学、隐私、法务/伦理与技术责任人完成适用审查后才能进行；课程清单本身不是批准。",
        starter: `试点阶段：
具名责任人：
审批点：
发布门槛：
停止开关：
事件与申诉：
发布决定：`,
        rubric: MODULE_RUBRICS["pilot-capstone"],
      },
      checkpoint: {
        question: "什么情况下可以把 shadow 试点扩大到学习者小范围使用？",
        options: [
          "演示运行一次没有报错",
          "仓库更新频繁且 X 讨论热烈",
          "预注册的学习、安全、数据与人工责任门均通过，且具名责任人能停止和回滚",
          "平均质量分较高，即使出现一次危机漏转",
        ],
        correctIndex: 2,
        explanation:
          "扩大发布需要本地证据、机构审批、停止与回滚能力；安全关键失败不能被平均分或生态热度抵消。",
      },
      takeaway: "世界级试点的标志不是一定发布，而是能依据证据负责地说“现在不发布”。",
    },
  },
  quiz: {
    title: "最终边界测验",
    intro:
      "12 道题检查你能否区分能力、信号、效果与治理，并在 K-12 和大学场景中保留教师决策、学生权利与独立学习证据。",
    passNote: "通过条件：12 题答对至少 10 题，并且所有标记为关键边界的题目必须答对。",
    questions: [
      {
        id: "q01-capability-boundary",
        prompt: "GitHub 仓库最适合支持哪类课程主张？",
        options: [
          "某项 agent、tool、handoff 或审批能力可检查、可实现",
          "该系统已在所有学校提高学习成绩",
          "该产品符合所有地区儿童隐私法律",
          "多智能体一定比单智能体更好",
        ],
        correctIndex: 0,
        explanation: "固定 GitHub 可证明实现能力与版本状态，不能独自证明教学效果、安全或合规。",
        sourceIds: ["S01", "S05"],
        critical: true,
      },
      {
        id: "q02-x-signal",
        prompt: "官方或作者 X 原帖在本课程中的正确用途是什么？",
        options: [
          "证明学习增益",
          "记录某账号在某日发布的产品或项目主张",
          "替代固定仓库的许可审查",
          "证明当前功能永不变化",
        ],
        correctIndex: 1,
        explanation: "X 是带日期的生态信号，不能承担效果、可靠性、许可或当前状态证明。",
        sourceIds: ["S12", "S13", "S14"],
        critical: true,
      },
      {
        id: "q03-independent-learning",
        prompt: "为什么有 AI 时的完成率不能单独证明学习？",
        options: [
          "因为完成率永远不能测量",
          "因为学生可能借助 AI 完成，却不能在移除 AI 后迁移",
          "因为 AI 一定损害学习",
          "因为只有满意度才重要",
        ],
        correctIndex: 1,
        explanation: "辅助任务表现与独立学习是不同结果；应加入无 AI 新题、延迟测或跨情境迁移。",
        sourceIds: ["S09", "S10"],
        critical: true,
      },
      {
        id: "q04-mcp-boundary",
        prompt: "MCP 连接成功后，仍必须由 host、应用和机构另行完成什么？",
        options: [
          "resources 与 tools 的命名",
          "教学脚本、授权、最小权限、安全审计与机构审查",
          "客户端与服务器的协议通信",
          "能力协商消息",
        ],
        correctIndex: 1,
        explanation: "MCP 是连接协议，不是教学法、完整编排器或自动安全与合规系统。",
        sourceIds: ["S02", "S06"],
        critical: true,
      },
      {
        id: "q05-child-data",
        prompt: "未成年人学习者面向流程遇到危机或健康语义时，系统应怎么做？",
        options: [
          "自动诊断并联系家长",
          "把自己定位成可信赖的知心人并继续维持关系",
          "停止相关自动流程并转交学校既有的合格成人支持路径",
          "继续对话直到模型确信风险消失",
        ],
        correctIndex: 2,
        explanation: "危机与健康判断不得自主化；系统应明确 AI 身份、停止并升级给合格成年人。",
        sourceIds: ["S15", "S16"],
        critical: true,
      },
      {
        id: "q06-human-judgement",
        prompt: "哪项最符合大学反馈实验可支持的工作流？",
        options: [
          "AI 先定分，TA 只润色",
          "TA 先作学术判断，AI 后起草可编辑反馈，TA 最终签发",
          "AI 自动裁定学术不端",
          "反馈更长就证明学生学得更多",
        ],
        correctIndex: 1,
        explanation: "该有界证据支持人先判断、AI 后起草，不支持自动评分效度或学习增益。",
        sourceIds: ["S11"],
        critical: true,
      },
      {
        id: "q07-multi-agent",
        prompt: "保留多智能体方案的最佳依据是什么？",
        options: [
          "角色数量更多",
          "在预注册质量、风险、成本与延迟指标上优于单智能体基线",
          "作者在 X 宣布发布",
          "多个 agent 投票一致",
        ],
        correctIndex: 1,
        explanation: "架构可实现不等于教学增益；多智能体必须相对简单基线证明必要。",
        sourceIds: ["S05", "S08", "S12", "S14"],
      },
      {
        id: "q08-trace-privacy",
        prompt: "教育 trace 的默认治理策略应是什么？",
        options: [
          "捕获所有原始对话并永久保存",
          "去标识化、关闭不必要敏感捕获、限制访问并设置删除期",
          "只要用于调试就不受数据政策约束",
          "把 trace 当作学习效果证明",
        ],
        correctIndex: 1,
        explanation: "追踪可能含敏感输入输出；可观察性不是默认隐私安全，也不是学习评测。",
        sourceIds: ["S01"],
        critical: true,
      },
      {
        id: "q09-browser-action",
        prompt: "浏览器 agent 要执行提交、发送或上传前，最基本的控制是什么？",
        options: [
          "使用教师个人 profile 以减少登录",
          "展示目标与完整参数，等待责任人逐次批准，执行后再核验状态",
          "因为页面可见所以默认获授权",
          "由 agent 自己判断后果是否严重",
        ],
        correctIndex: 1,
        explanation: "能力不等于权限；有副作用动作需要最小权限、预览、人工确认、执行后核验与可撤销记录。",
        sourceIds: ["S03", "S04"],
        critical: true,
      },
      {
        id: "q10-tutor-copilot",
        prompt: "如何正确使用 Tutor CoPilot 研究？",
        options: [
          "复制其人类可选择、编辑或拒绝建议的控制结构，并保留特定情境边界",
          "据此宣称 AI 可替代所有数学教师",
          "把论文数字外推到所有学科与国家",
          "跳过本地无 AI 迁移评测",
        ],
        correctIndex: 0,
        explanation: "研究提供特定平台与人群中的有界结果；可迁移的是可编辑中间产物的人类控制结构。",
        sourceIds: ["S07"],
      },
      {
        id: "q11-higher-ed-rct",
        prompt: "哈佛物理课程研究不能支持哪项结论？",
        options: [
          "特定定制 tutor 在两次课的研究中取得较高短期学习增益",
          "结果受课程、学生、系统和测量条件限制",
          "AI 普遍优于所有教师和课堂",
          "真实部署还需测量迁移、公平与教师工作量",
        ],
        correctIndex: 2,
        explanation: "单门课程、两次课、一个定制系统的结果不能外推为普遍替代课堂结论。",
        sourceIds: ["S10"],
      },
      {
        id: "q12-release-gate",
        prompt: "以下哪项必须阻止试点扩大？",
        options: [
          "教师要求修改措辞",
          "成本高于初始估计",
          "出现 PII 泄漏、越权动作、危机漏转或无法停止，尚未修复并复验",
          "单智能体比多智能体更简单",
        ],
        correctIndex: 2,
        explanation: "安全关键失败应 fail closed；平均质量分、演示成功或生态热度都不能抵消。",
        sourceIds: ["S01", "S03", "S04", "S09", "S15", "S16"],
        critical: true,
      },
    ],
  },
  capstone: {
    title: "K-12/大学双路径、教师/学习者/治理三通道试点证据包",
    intro:
      "为一个真实但去标识化的单元设计教师通道、学习者通道和治理通道。系统先在 shadow 与 teacher-only 模式运行；只有本地学习、安全、数据与责任门都通过，才考虑小范围学习者试点。",
    requiresFinalAssessment: true,
    requiresCompletedModules: true,
    instructions: [
      "选择 K-12 或大学路径，并使用合成、公开或机构明确批准且去标识化的材料。",
      "依次完成下列十项产出；每项沿用对应模块的字符、标签与证据量规。",
      "通过 12 题终测，并重新确认十个模块的当前证据记录仍然有效。",
      "所有外部写动作关闭或逐次人工审批；不得输入真实学生 PII、凭据、健康、辅导或特殊教育记录。",
      "加入至少一项无 AI 新任务、一次安全关键失败演练和一次 kill-switch/删除演练。",
      "由具名教学与治理责任人记录发布、限条件发布或不发布决定；本课程完成状态不构成机构批准。",
    ],
    artifacts: [
      {
        id: "capstone-boundary-card",
        title: "01 · 智能体边界卡",
        description: "证明任务确实需要 agent，固定最低自主度、教师责任、停止条件与无 AI 迁移证据。",
        sourceIds: ["S01", "S09", "S13"],
        moduleSlug: "agentic-teaching-boundaries",
        rubric: MODULE_RUBRICS["agentic-teaching-boundaries"],
      },
      {
        id: "capstone-task-contract",
        title: "02 · 教育智能体契约",
        description: "锁定学习结果、批准来源、数据权限、审批升级与成功/停止指标。",
        sourceIds: ["S01", "S15", "S16"],
        moduleSlug: "learning-design-task-contracts",
        rubric: MODULE_RUBRICS["learning-design-task-contracts"],
      },
      {
        id: "capstone-teacher-copilot",
        title: "03 · 教师副驾驶与签发记录",
        description: "展示只读来源、证据回链、可编辑课包和教师发布门。",
        sourceIds: ["S06", "S07", "S15"],
        moduleSlug: "teacher-copilot-workflows",
        rubric: MODULE_RUBRICS["teacher-copilot-workflows"],
      },
      {
        id: "capstone-learning-loop",
        title: "04 · 提示/反馈学习循环",
        description: "记录先行判断、提示阶梯、禁止输出、教师审批与无 AI 新任务。",
        sourceIds: ["S07", "S09", "S10", "S11", "S16"],
        moduleSlug: "tutoring-feedback-agents",
        rubric: MODULE_RUBRICS["tutoring-feedback-agents"],
      },
      {
        id: "capstone-agent-baseline",
        title: "05 · 单/多智能体比较",
        description: "以质量、风险、成本、延迟与故障率决定是否保留多角色复杂度。",
        sourceIds: ["S05", "S08", "S12", "S14"],
        moduleSlug: "multi-agent-inquiry",
        rubric: MODULE_RUBRICS["multi-agent-inquiry"],
      },
      {
        id: "capstone-resource-boundary",
        title: "06 · MCP 资源与权限图",
        description: "固定只读资源范围、host 责任、版本、拒绝路径和写工具禁区。",
        sourceIds: ["S02", "S06"],
        moduleSlug: "knowledge-tools-mcp",
        rubric: MODULE_RUBRICS["knowledge-tools-mcp"],
      },
      {
        id: "capstone-child-rights",
        title: "07 · 儿童权利与数据影响评估",
        description: "K-12 必做；大学路径也须覆盖未成年人、双录取学生与敏感支持情境。",
        sourceIds: ["S03", "S04", "S09", "S15", "S16"],
        moduleSlug: "k12-safeguards",
        rubric: MODULE_RUBRICS["k12-safeguards"],
      },
      {
        id: "capstone-integrity-protocol",
        title: "08 · 学术完整性与申诉协议",
        description: "证明人类先作学术判断，AI 草稿可编辑、可披露，学习者可人工复核与退出。",
        sourceIds: ["S10", "S11", "S15", "S16"],
        moduleSlug: "higher-ed-integrity",
        rubric: MODULE_RUBRICS["higher-ed-integrity"],
      },
      {
        id: "capstone-eval-set",
        title: "09 · 分层评测与无 AI 迁移",
        description: "分开工程、学习、安全公平与教师工作指标，并保留失败样本与人工抽检。",
        sourceIds: ["S01", "S05", "S07", "S09", "S10", "S11"],
        moduleSlug: "evals-learning-evidence",
        rubric: MODULE_RUBRICS["evals-learning-evidence"],
      },
      {
        id: "capstone-release-decision",
        title: "10 · 分阶段试点与发布决定",
        description: "定义进入、退出、kill switch、事件申诉与具名责任人的发布或不发布结论。",
        sourceIds: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S15", "S16"],
        moduleSlug: "pilot-capstone",
        rubric: MODULE_RUBRICS["pilot-capstone"],
      },
    ],
    attestation:
      "我确认本证据包只使用合成、公开或机构明确批准且去标识化的材料；我没有把 GitHub、X、一次运行或课程完成状态表述为学习效果或部署许可；最终教学、高风险与发布决定由具名人类责任人作出，并保留无 AI 迁移、申诉、停止与删除路径。",
  },
} as const, "zh-Hans");

/** Naming parity with the reviewed English bundle and the loader contract. */
export const AGENTIC_TEACHING_COPY_ZH_HANS =
  AGENTIC_TEACHING_ZH_HANS_COPY;
