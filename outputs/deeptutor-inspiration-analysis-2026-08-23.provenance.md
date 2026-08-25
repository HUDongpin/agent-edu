# Provenance ledger: DeepTutor 对本项目的启发与落地路线图

审计日期：2026-08-23（Asia/Taipei）  
主报告：`outputs/deeptutor-inspiration-analysis-2026-08-23.md`  
最终格式：DOCX（由同一内容源生成）

## 1. 证据快照

- DeepTutor 仓库：HKUDS/DeepTutor
- 固定提交：`8515dfdbe64574681c747fdda7a470044adc628f`
- 标签：`v1.5.16`
- 发布/提交日期：2026-08-22
- 论文：arXiv `2604.26962v3`，2026-07-09 修订
- 本项目：`/Users/peter/Desktop/Agentic Engineering` 当前工作树，2026-08-23

DeepTutor 事实以固定提交永久链接为准。本项目事实来自本地工作树；本轮没有验收 `aicourse.top` 生产制品，所以不把本地 `available`、路由或 manifest 推断为已上线。

## 2. 研究分工与挑战流程

研究采用三个彼此独立的证据支线：

1. **DeepTutor 研究支线**：只使用官方 GitHub、官方项目页与作者提交的 arXiv v3；逐项区分论文、README 产品叙述和当前代码。
2. **DeepTutor 核验支线**：独立复核版本、许可证、RAG provider/索引生命周期、Memory lineage、Question validator、TutorBench 数字与限制。
3. **本项目审计支线**：只读检查 README、课程 catalog/manifest、静态导出、模型调用、本地进度、RAG 课程、发布检查器和在建课程；显式区分本地候选、工作树草稿与线上未知。

主报告随后进行了交叉挑战：

- 检查 `+10.76%` 的分母，确认论文表 2 的 Δ% 相对 Naive Tutor 3.53，而不是相对 Self-Refine 3.57。
- 检查人类偏好研究，确认 45 个 session、10 名学生标注者、每个 session 两名被分配标注者；相关在 10 个 metric-level win-rate pair 上计算，不是所有样本级相关。
- 检查论文 Trace Forest 与当前文件式 L1/L2/L3 Memory，确认不能视为同一实现。
- 检查 L3 lineage，确认当前 L3 只引用 surface/L2 文件级来源，README 的 exact raw-event 说法强于代码契约。
- 检查 QuestionPipeline，确认当前可验证的是结构/schema issue collection 与 repair；没有把论文的独立事实/教学 validator 误报为当前主 pipeline 已实现。
- 检查 RAG，确认论文 graph+dense 双索引不等于当前每个 KB 同时运行图＋稠密检索；当前产品按 KB 绑定一个 provider，默认 LlamaIndex 为 BM25＋vector RRF。

## 3. DeepTutor 主来源

| ID | 来源 | 用途 | 证据边界 |
|---|---|---|---|
| D1 | [固定提交 README](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/README.md) | 产品表面、知识库、Book、Learning Space、Memory、部署与多用户 | 功能叙述不能替代源码或学习成效证据 |
| D2 | [v1.5.16 release](https://github.com/HKUDS/DeepTutor/releases/tag/v1.5.16) | 当前版本、发布日期与变化 | 高频发布说明接口可能漂移 |
| D3 | [AGENTS.md](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/AGENTS.md) | 统一 agent runtime、Tools/Capabilities、关键文件 | 架构说明需与当前代码互证 |
| D4 | [RAG factory](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/rag/factory.py) | provider contract、每 KB 单引擎、可选引擎 | 不证明多引擎对同一任务更优 |
| D5 | [LlamaIndex retriever](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/rag/pipelines/llamaindex/retrievers.py) | BM25＋vector 与 RRF | 实现存在不等于本项目数据上最佳 |
| D6 | [LlamaIndex pipeline](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/rag/pipelines/llamaindex/pipeline.py) | embedding signature/version、needs_reindex、source fields | 未运行本项目数据上的性能基准 |
| D7 | [trace.py](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/memory/trace.py)、[document.py](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/memory/document.py) 与 [L3 prompt](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/memory/consolidator/prompts/en/update_l3.yaml) | 当前文件式 L1/L2/L3、L2 稳定条目与删除、L3 文件级引用边界 | 不等同于论文 Trace Forest；L3 不是 entry-level lineage |
| D8 | [QuestionPipeline](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/agents/question/pipeline.py) | Explore/Plan/Quiz、结构校验与 repair | 不支持“当前产品已实现论文独立教学 validator” |
| D9 | [Book models](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/book/models.py) 与 [RAG helpers](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/book/blocks/_rag_helpers.py) | proposal、spine、typed blocks、可空 anchors、可选 RAG 与失败降级 | 结构存在不证明自动内容可直接发布 |
| D10 | [Sandbox spec](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/services/sandbox/spec.py) | SYSTEM/APPLICATION/OFF 隔离级别 | 仍需独立威胁模型和部署验证 |
| D11 | [Apache-2.0 License](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/LICENSE) | 代码主体许可 | 不覆盖第三方依赖、模型服务、用户内容或品牌资产 |
| D12 | [Learning models](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/models.py)、[storage](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/storage.py)、[scheduler](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/scheduler.py) 与 [mastery](https://github.com/HKUDS/DeepTutor/blob/8515dfdbe64574681c747fdda7a470044adc628f/deeptutor/learning/mastery.py) | 阶段、尝试、待答题、持久化、复习调度与启发式掌握度 | 不是经本项目数据校准的 BKT/IRT/KT |

## 4. 论文主来源与数字解释

- [arXiv 摘要页](https://arxiv.org/abs/2604.26962)：论文版本、作者自报类型与 CC BY 4.0。
- [arXiv HTML v3](https://arxiv.org/html/2604.26962v3)：方法、TutorBench、结果、消融、人类对齐和限制。
- [arXiv PDF](https://arxiv.org/pdf/2604.26962)：逐页视觉复核与表格数值。

接受的数字解释：

- 30 个 KB × 每 KB 3 个 learner levels = 90 profiles；每 profile 3 个接受任务 = 270 tasks。
- 10 个 1–5 分指标；DeepTutor OQ 3.91，Naive Tutor 3.53，作者报告相对 `+10.76%`。
- Self-Refine OQ 3.57；它是表 2 中 OQ 最高的非 DeepTutor baseline，但不是 `+10.76%` 的分母。
- 人类对齐：45 sessions、10 名学生标注者、每个 session 两人盲评；Pearson `r=.82`、Spearman `ρ=.83` 在 10 个 metric-level DeepTutor win-rate pairs 上计算。
- Solver-only 提升关闭了 personalization/SKG/DPM；不支持个性化学习成效。

拒绝的扩大解释：

- 不把 rubric/LLM-judge 偏好写成考试成绩、知识增益、长期保持或迁移。
- 不把 Book/Partners 功能存在写成已经改善 retention、engagement 或真实学习结果。
- 不把作者报告写成独立复现；当前固定提交中也未确认 TutorBench 完整数据、harness、transcripts 和 judge records 已公开。

## 5. 本项目主来源

| ID | 本地文件 | 支持结论 |
|---|---|---|
| L1 | `README.md` | 项目定位、静态架构、课程边界、BYOK Lab、线上/本地分列要求 |
| L2 | `next.config.ts` | static export、无常驻应用后端 |
| L3 | `lib/progress.ts` | localStorage-only 进度 |
| L4 | `lib/deepseek.ts`、`components/lab/Lab.tsx` | 当前唯一浏览器模型通道与固定实验任务 |
| L5 | `lib/rag/manifest.ts`、`lib/rag/types.ts`、`lib/rag/sources.ts` | 4 单元、12 课、34 concept IDs、40 source records、证据/许可/locator 契约 |
| L6 | `components/rag/RetrievalLab.tsx`、`messages/rag/en.json` | 确定性检索模拟；没有实时 embedding/vector DB/network call |
| L7 | `lib/courses.ts` | 当前本地候选课程状态与 upcoming 项目 |
| L8 | `course_review_2026-08-23/staging/AI应用工程课程_V3.1_非软件背景友好版/manifest.json` | S00–S10 工作树草稿包；不等于站点上线 |
| L9 | `messages/cursor/en.json` | 在建 Cursor 第 13 课的逐级提示、单轮单行动、迁移、隐私与停止权；仅为课程内容种子 |
| L10 | `lib/claude/manifest.ts`、`lib/grok/course.manifest.json`、`app/[locale]/grok/page.tsx`、`lib/courses.ts` | Claude 通用课为 rights-gated；Grok 有 manifest 与路由，但未列入 `TOP_LEVEL_COURSES` |

## 6. 仍未确认的事项

1. 本轮未验收生产站点与 CDN 构建，因此不报告线上课程数量。
2. 未运行需要付费模型/embedding provider 的 DeepTutor 实例，也未复跑 TutorBench。
3. 未确认论文 Trace Forest/TraceToolkit/三个 memory agents 与 v1.5.16 当前文件式 Memory 的完整对应关系。
4. 未确认论文的独立 question validator 是否存在于未公开实验代码、其他分支或独立仓库。
5. 未确认 DeepTutor 的 Book/Partners 在真实学生中的纵向学习效果。
6. 路线图周期和建议阈值需要团队资源、数据治理与试点基线后重新估算。

## 7. 来源质量检查

- DeepTutor GitHub 证据全部使用 commit-pinned permalink。
- 研究支线自动校验了 79 个 GitHub 文件/行号链接：文件存在且行号未越界；使用的 arXiv section anchors 均在 v3 HTML 中存在。
- 主报告中的关键论文数字再以本地 v3 PDF 文本和页面渲染复核。
- 报告未使用第三方博客、新闻、聚合器或用户评论支持 DeepTutor 的技术与效果结论。

## 8. 最终 DOCX 验收

- 最终文件：`outputs/DeepTutor对本项目的启发与落地路线图_2026-08-23.docx`
- SHA-256：`dda4e4c0b4e97bac7707d8c42e9784b2de278f89f9636aad5af9a10f26fc8c62`
- 内容复核：独立审阅结论为 READY；关键 DeepTutor 与本项目证据锚点、MVP/P1 题目生成边界均已复核。
- 结构复核：ZIP/OOXML 可读；24 个来源书签完整；68 个内部链接无悬空；26 个外部超链接关系完整；无修订、批注或可见原始 URL。
- 可访问性：高/中/低问题均为 0；1 幅架构图含中文替代文本；5 张表均标记表头并使用固定精确宽度。
- 渲染复核：Letter 纸、1 英寸页边距、20 页；全部 20 页逐页检查，无空白页、截断或表格越界；PDF 嵌入 CJK 字体且文本可提取。
