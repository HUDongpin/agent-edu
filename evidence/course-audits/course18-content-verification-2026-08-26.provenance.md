# 第 18 门课纠错溯源台账

> 核验快照：2026-08-26（Asia/Taipei）
> 作用：记录本轮纠错所依赖的一手锚点、数字核对、限定语和实现回归；详细的 16 来源全量台账见 `course18-agentic-teaching-research.provenance.md`。
> 原则：固定提交支持代码能力，论文支持其研究设计内的结果，官方治理材料支持规范边界，X 原帖只支持发布时间与发布者主张。

## 1. 核验方法

### GitHub

- 先确认组织、canonical 仓库和项目 README，再把课程的具体能力主张绑定到固定 commit 下的文件。
- 同时检查许可与内容/数据权利；“公开仓库”不自动等于“全部内容开源”，开源也不自动等于安全、有效或学校合规。
- `pushed_at` 只记为 UTC 活动快照，不称为稳定 release、教学验证或安全审计。

### X

- 对课程使用的 3 条原帖，核对 status ID、作者、正文与日期，并由官方 X/Twitter oEmbed 回读。
- 如果另有当前产品文档，则把它列为 corroborating URL；X 不承担当前 API、价格、效果或安全主张。
- 目标帖正文由 oEmbed 回读；live X 页面中的 `SelfThread` 元数据另行记录。S12/S13 登记同作者相邻帖，S14 只把目标称为编号两部分公告中的 `(1/2)`，不把该编号误写成整个 live self-thread 只有两帖。课程主张只依赖目标帖实际文字。

### 论文与治理材料

- 读取标题、版本/出版状态、样本、随机化单位、处理条件、结果变量和外推限制。
- 数字使用论文报告口径；计划课时、记录使用时长、主观体验、即时测验和无 AI 迁移结果分别记录。
- UNESCO / UNICEF 只支持其实际写出的原则，不把课程设计清单伪装成逐字政策要求。

## 2. 纠错主张台账

| 编号 | 纠正后的主张 | 一手锚点 | 不允许的外推 |
|---|---|---|---|
| V01 | Agents SDK 的 HITL、tracing、guardrails 与 testing 是可用的框架原语 | [固定 README](https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/README.md)、[HITL](https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/docs/human_in_the_loop.md)、[tracing](https://github.com/openai/openai-agents-python/blob/5f9f4f09c3fe840b5a4c09bdbbf6f0b1239bf0ec/docs/tracing.md) | 不能据此声称输出正确、追踪无敏感数据或课堂有效 |
| V02 | MCP host/client/server、tools/resources/prompts 和安全责任按 2026-07-28 规范讲授 | [固定架构页](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/57ac4a2ec742e0cb7622d899b0f5d3bcf769fd69/docs/specification/2026-07-28/architecture/index.mdx)、[SECURITY](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/57ac4a2ec742e0cb7622d899b0f5d3bcf769fd69/SECURITY.md) | MCP 不自动提供最小权限、同意、沙箱、正确性或教学法 |
| V03 | Anthropic computer-use demo 的 canonical 仓库为 `anthropics/claude-quickstarts` | [固定 computer-use-demo](https://github.com/anthropics/claude-quickstarts/tree/3313e9716fb5b977248bcd06cb0cc86a8c547b9b/computer-use-demo) | demo 不是生产 LMS/SIS 架构或安全认证 |
| V04 | Browser Use 具备页面工具与浏览器会话代码路径 | [固定工具服务](https://github.com/browser-use/browser-use/blob/9a2db2d2db42c6f68a871f011b3b25fdcaa71847/browser_use/tools/service.py)、[固定会话实现](https://github.com/browser-use/browser-use/blob/9a2db2d2db42c6f68a871f011b3b25fdcaa71847/browser_use/browser/session.py) | 不保证网页条款兼容、不会误提交或适合真实学生账号 |
| V05 | ADK workflow triage 展示协调者、顺序计划与并行专业 worker；评测需看结构化 trace/工具与答案 | [固定样例](https://github.com/google/adk-python/blob/ef2d68080a05f2fc3e00634c4f6c4d3d43c2a7f1/contributing/samples/patterns/workflow_triage/README.md)、[官方评测指南](https://adk.dev/evaluate/) | 多智能体/并行不自动优于简单工作流 |
| V06 | Oak Open Curriculum 项目为 Public Beta，并有分层的代码、内容与数据权利 | [固定 README](https://github.com/oaknational/oak-open-curriculum-ecosystem/blob/1173c1adf252eab2dbe7d95f2494139f51504243/README.md) | 不称为邀请制 Alpha，也不把所有课程内容视为单一软件许可 |
| V07 | Tutor CoPilot 的主要课堂数字使用 tutor 随机分配下的 ITT 口径 | [工作论文 PDF](https://scale.stanford.edu/sites/default/files/ai24_1054_v2.pdf)、[固定代码仓库](https://github.com/rosewang2008/tutor-copilot/tree/25c6eab7e416614f2033358bceddd30a4d5ca616) | 不解释为学生随机分配、全自动 tutor 或所有学习者的长期提升 |
| V08 | OpenMAIC 技术能力由固定仓库和论文承担 | [固定 README](https://github.com/THU-MAIC/OpenMAIC/blob/4a9f906a1378a51b84e020828cf8af25bb5d8a2d/README.md)、[论文 DOI](https://doi.org/10.1007/s11390-025-6000-0) | X 发布帖不证明学习成效、普适性或安全性 |
| V09 | 高中数学研究覆盖约 50 个班、以班级为随机化单位并按班聚类标准误；无护栏 GPT 练习提高但无 AI 考试下降，有护栏 tutor **largely mitigated** 负面影响且没有显示正向考试增益 | [PNAS 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC12232635/)、[固定分析仓库](https://github.com/obastani/GenAICanHarmLearning/tree/2f63dae1a01d51453826fe07ef5cf6678e339588)、[仅更正作者单位的正式勘误](https://pmc.ncbi.nlm.nih.gov/articles/PMC12403119/) | 不把班级层随机误写成学生个体随机；不使用 “eliminated/消除”，不把护栏当作普遍效果保证；勘误不涉及方法或结果 |
| V10 | 哈佛 AI tutor 研究区分 60 分钟课堂安排与 AI 条件约 49 分钟中位记录时长 | [Scientific Reports 全文](https://www.nature.com/articles/s41598-025-97652-6)、[固定数据仓库](https://github.com/HarvardAItutor/Study-Data-v4/tree/c5bf864c5369fbedd61c248743a89da95dcaa114) | 不从两节课外推到所有大学课程、长期保持或工作量节省 |
| V11 | 高校反馈研究为 arXiv v1 预印本，报告反馈提供率而非学习增益或自动评分效果 | [arXiv 2606.03095](https://arxiv.org/abs/2606.03095)、[固定复现仓库](https://github.com/humans-and-machines/ai-feedback-provision/tree/e4613f58a71777e29f8c2a4310db90d108f24557) | 不称同行评审完成，不宣传自动评分 |
| V12 | Codex subagents 目标帖属于官方账号的 live self-thread，但课程只用目标帖的发布事件，现行行为由当前官方文档佐证 | [X 原帖](https://x.com/OpenAIDevs/status/2033636701848174967)、[X oEmbed](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FOpenAIDevs%2Fstatus%2F2033636701848174967&omit_script=true)、[同作者续帖](https://x.com/OpenAIDevs/status/2033636713877430747)、[当前文档](https://developers.openai.com/codex/subagents) | 不把社交帖或线程邻帖当成永久 API 契约 |
| V13 | Study Mode 目标帖属于官方账号的 live self-thread，只支持其自身发布背景 | [X 原帖](https://x.com/OpenAI/status/1950240351547248941)、[X oEmbed](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2FOpenAI%2Fstatus%2F1950240351547248941&omit_script=true)、[同作者前帖一](https://x.com/OpenAI/status/1950240348695072934)、[同作者前帖二](https://x.com/OpenAI/status/1950240350129574358)、[官方介绍](https://openai.com/index/chatgpt-study-mode/) | 不据此证明学习增益或所有学生适用，不把相邻帖内容归给目标帖 |
| V14 | OpenMAIC 目标帖是编号两部分公告的开篇 `(1/2)`；live same-author self-thread 另有后续帖 | [X 原帖](https://x.com/yujifan_0326/status/2033174084331475423)、[X oEmbed](https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2Fyujifan_0326%2Fstatus%2F2033174084331475423&omit_script=true)、[编号 `(2/2)`](https://x.com/yujifan_0326/status/2033174088672510069)、[后续帖一](https://x.com/yujifan_0326/status/2033189543579648306)、[后续帖二](https://x.com/yujifan_0326/status/2033196896555319416) | 课程只用目标帖实际发布主张；技术与许可仍以固定仓库和论文为准 |
| V15 | 年龄适切、人本、隐私与教师监督来自 UNESCO 指南 | [UNESCO 官方页](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=387) | 指南不是全球统一法定年龄，也不替代本地法律意见 |
| V16 | UNICEF v3 提出儿童中心的 AI 要求；2026 材料讨论 friend/therapist/trusted confidant 与排他、依赖、情感优先风险 | [v3 落地页](https://www.unicef.org/innocenti/reports/policy-guidance-ai-children)、[v3 PDF](https://www.unicef.org/innocenti/media/11991/file/UNICEF-Innocenti-Guidance-on-AI-and-Children-3-2025.pdf)、[检查表](https://www.unicef.org/innocenti/media/11996/file/UNICEF-Innocenti-Guidance-on-AI-and-Children-3-Checklist-2025.pdf)、[2026 政策简报页](https://www.unicef.org/documents/when-ai-becomes-friend-child-rights-risks)、[业务建议 PDF](https://www.unicef.org/media/181136/file/UNICEF-When-AI-becomes-friend-Business-recommendations-2026.pdf) | 不添加 “secret keeper” 等未核实称谓，也不把课程风险清单称为 UNICEF 逐项原文 |

## 3. 数字核对表

| 来源 | 样本/设计 | 经核实的结果 | 课程限定语 |
|---|---|---|---|
| Tutor CoPilot | 现场实施覆盖 700 多名 tutor、1,000 多名学生；主要估计使用 783 名 tutor，随机化在 tutor 层 | exit-ticket 正确率 62% → 66%，提高 4 个百分点；低评级 tutor 子组 56% → 65%，提高 9 个百分点 | ITT、即时结果；不等于所有学生长期学习提高 |
| PNAS 高中数学 | 4 次 90 分钟课节；约 50 个九至十一年级班、接近 1,000 名土耳其高中生；班级通过兼顾可观测特征与排课约束的整数规划分入无 GPT、GPT Base 与 GPT Tutor；班级是随机化单位，标准误按班聚类 | 练习表现约 +48% / +127%；无护栏条件无 AI 考试约 -17%；有护栏条件 largely mitigated，但无正向考试增益 | 不误写成学生个体随机；分开写练习表现与独立考试；作者单位勘误不改变任何方法或结果 |
| Scientific Reports AI tutor | 233 人注册、194 人符合分析条件；两节课、交叉设计、同伴组随机化 | AI 条件记录使用时长中位数约 49 分钟；课堂安排为 60 分钟；参与度与动机更高是体验结果 | 不把 60 分钟写成实际 AI 使用时长，不外推长期保持 |
| 高校反馈预印本 | 11 名 TA、88 名学生；反馈提供/长度主结果为 2,828 条观察 | AI 辅助使反馈提供率提高 10.81 个百分点；把无反馈编码为 0 后长度增加 39.79 字符 | 时间仅 N=664、学生评分仅 N=468；无显著组间差异只作描述性解读，不支持因果、自动评分或学习增益 |

## 4. 双语与进度证据

课程 validator 现在强制检查：

- 英文/简体中文终测分别匹配同一 canonical scoring contract；运行期每个选项为 `{id, label}`，合约绑定题目 ID/顺序、稳定语义选项 ID、正确语义答案、关键题、来源映射、题数和阈值，并分别绑定两种语言已审校标签的 exact fingerprint，不能只靠位置或两种语言彼此一致；
- 每个 locale-specific checkpoint 同样绑定四个语义选项 ID、正确语义答案和已审校标签指纹；UI 与回执只按 ID 计分；
- 每个产出物回执绑定显式 rubric schema、最少字数、必填标签与界面可见的全部 `evidenceRequirements`；
- 每种语言的结课产出物恰好覆盖每个模块一次；
- 四个阶段恰好覆盖全部 10 个模块且不重复；
- X 来源必须有原帖、oEmbed 回读和有效的佐证 URL（如适用）；
- 进度 schema 必须是 v2，旧布尔值不能计入完成。

进度契约的确定性测试覆盖：错误 semantic checkpoint ID 返回 `null`；checkpoint 标签换位、ID 换位与旧标签 blueprint 回执均被拒绝；英中终测同时交换标签或同时交换 ID 仍被 canonical validator 拒绝；标签指纹、选项 ID/顺序、正确答案、题序、关键题、来源或阈值任一漂移都会改变 quiz blueprint；短文本/缺标签无法铸造 module；只改变一条 `evidenceRequirements` 即改变 rubric fingerprint 并使旧 module/Capstone 失效；精确 `10/12` 回执、关键题失败、版本/分数/题目数畸形数据、旧键拒绝、证据修订导致 100% → **83%** → 92% → 100%、旧 attestation fingerprint 拒绝、跨语言仅浏览不变而实际保存失效、并发修订 ID 唯一、缺少终测或任一模块时结课 fail closed，以及旧文本草稿可恢复但不计完成。

静态候选另写入 schema 3 Course 18 export manifest：它绑定课程版本、`course18-browser-v4`、明确列举的源输入 SHA-256 `cd3b340ee5f08c02e1b78061a28d804369be9693cebd24405e373bae33063e56`、99 个课程 HTML SHA-256 `d64fcc306d161330c43fc18e3ac8f2c856f810b6153ff698d9d3be9e5ef7380f`，以及整个 `out/`（排除 manifest 自身与 `.DS_Store`）12,148 个文件的规范排序 inventory、数量和全树 SHA-256 `cbcec007e6a351fdf70e7142846cd265d52f3b9af0303988bb076962ec81646c`。共享纯函数负测证明：HTML 不变而任意 JS/CSS 字节变化、缺失文件或新增文件都会 fail closed。静态检查与默认 Playwright server 都会复算；发布脚本顺序强制为 validator → build → manifest → static hash check → browser tests，默认不复用端口上已有服务。

## 5. 可达性与命令行限制

- 固定 GitHub 页面、研究落地页、X 原帖和 oEmbed 在本次扫描中可达。
- OpenAI Study Mode 与部分 UNICEF PDF 对 `curl` 返回 403；这是站点的自动化访问控制，已通过官方落地页/浏览器内容核验，不能把 403 误报为内容不存在。
- Codex subagents 文档入口出现 308 重定向；课程使用官方最终文档入口，不把重定向视为失败。
- X 页面匿名呈现可能不稳定，因此课程始终保留 oEmbed 回读或 GitHub/官方文档佐证。

## 6. 残余不确定性

1. 所有滚动项目状态、文档路径和 X 可见性都可能漂移；固定提交只保证本次引用的代码/文字锚点。
2. S07 工作论文与 S11 预印本的出版状态可能变化；发布时应复查是否有新版本、撤稿、勘误或同行评审版本。
3. 研究结论高度依赖样本、任务、教师实施与结果变量；没有证据支持把任何一个结果推广为“智能体普遍有效”。
4. UNESCO / UNICEF 不能替代法域与机构审查；尤其是未成年人、残障/特殊教育、健康危机、高影响评估、数据出境和申诉程序。
5. 本地结构验证、Playwright 和静态构建不等于生产部署验证；当前没有对 `aicourse.top` 做上线后网络、缓存、分析或真实用户数据测试。
