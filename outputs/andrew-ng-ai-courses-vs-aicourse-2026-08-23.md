# Andrew Ng AI 课程全量盘点与 aicourse 课程缺口分析

**Andrew Ng / DeepLearning.AI 资料复核日：2026-08-24（Asia/Taipei）**  
**aicourse 冻结工作树快照：2026-08-24（精确时间与 SHA-256 见 provenance）**  
**研究范围：DeepLearning.AI 当前课程目录、官方 sitemap、可核验 first-party GitHub 配套，以及 aicourse 当前生产站与本地工作树**  
**审计仓库 HEAD：`0f4246ab19a0b4f987f45a50ec6a3b2e7eac14bd`**

> 文件名保留原任务约定的 `2026-08-23` 标识，但正文已在 2026-08-24 重新抓取 Andrew 侧来源并冻结 aicourse 当前输入。报告只做研究、比较与课程路线规划，不修改或发布网站代码。课程时长、类型、访问状态和目录状态都是快照值，不应理解为永久属性。逐行机器可读清单见 [CSV inventory](./andrew-ng-ai-course-inventory-2026-08-23.csv)，来源、排除项和不确定性见 [provenance sidecar](./andrew-ng-ai-courses-vs-aicourse-2026-08-23.provenance.md)。

## 一、结论先行

截至 2026-08-24，对 [DeepLearning.AI 当前课程目录](https://www.deeplearning.ai/courses)及[官方 sitemap](https://www.deeplearning.ai/sitemap.xml)中的 127 个 canonical `/courses/` 与 `/specializations/` 页面重新逐页核验后，正式讲师字段中包含 Andrew Ng 的项目仍恰好有 **14 个 canonical 课程产品**：

- **7 门 Course**；
- **5 门 Short Course**；
- **2 个 Professional Certificate / Specialization**。

统计口径可以交叉核对：

```text
顶层产品：7 + 5 + 2 = 14
课程单元：12 门独立课程 + 3 门 MLS 子课程 + 5 门 DLS 子课程 = 20
CSV 当前项目行：14 个顶层产品 + 8 个专项子课程 = 22 行
```

这里的 **14** 是官网产品数，**20** 是展开两个专项课程后的不重复学习单元数；不能再把 14 与 8 相加称为 22 门当前课程，因为两个专项产品本身是课程容器。

GitHub 结论也很明确：本轮对当前 first-party 组织、中央索引、课程页和官方社区的有限审计，只核验到四组不同强度的 first-party 关联，不能支持“14 个产品逐一对应 14 个公开官方仓库”的说法。经 [DeepLearning.AI first-party companion hub](https://github.com/https-deeplearning-ai/deeplearning-ai)、仓库 README、课程页和官方社区交叉核验，可确认：

- 2 个当前 `official_companion`：Jupyter AI 有中央索引直接配对，证据最强；Build with Andrew 由 first-party owner 与 course-specific README 支持，证据较弱但边界已披露；
- 1 个 `official_companion_component`：Agentic AI 的 Research Agent 组件，不能称为完整课程镜像；
- 1 个 `official_historical_companion`：旧 MLEP 专项课程仓库，不能声称与当前 Machine Learning in Production 单课逐课一致；
- 其余 10 个当前产品为 `no_verified_public_repo`，意思是“在本轮核验范围内未发现”，不是断言“绝对没有或从未有过”。

对 aicourse 而言，当前优势已不只集中在产品工具课。冻结快照的公共目录合同有 **15 个顶层课程**：Agentic Engineering 的 Handbook/Lab 已在线；其余 14 个都有本地 route，其中本轮新纳入实质盘点的 **AI Tutor（8 模块 / 450 分钟）**、**Product Management（14 模块 / 910 分钟）**和 **Agent Orchestration（15 模块 / 1,060 分钟）**均有实质正文、来源登记、测评、capstone 和通过的专用 release gate，但生产 URL 仍为 404，因此属于“完整、可路由的课程包草案”，不是“已上线”。另外还有尚未接入网站的 **S00–S10 V3.0**：11 册实质 DOCX 课程包，front matter 声明合计 112 个模块，正文机械计为 113；S06 首页称 8 模块但正文实际有 M06-01 至 M06-09。它们覆盖可测试 Python、LLM evaluation、RAG、生产工程与多智能体编排，绝不是标题占位；但还缺逐 claim 来源映射、冻结访问日期、逐来源/逐资产许可台账、可运行代码验收、站点 manifest/route 与生产部署，不能升级为 release-ready。

把线上、可路由草案、DOCX 课程包和跨课片段全部纳入并按可迁移能力去重后，真正的结构性空白与未完成主干是：

1. **传统 Machine Learning Foundations**；
2. **Deep Learning 与 Transformers 原理及训练**；
3. **predictive ML 专属的模型评价、data-centric AI 与 MLOps 生命周期**；
4. **独立、连贯的 Responsible AI 主课**：当前 fairness、治理、human oversight 与 appeal 已有实质片段，不再是零覆盖，但尚未形成一条完整学习路径；
5. **Jupyter、NumPy/Pandas、统计与可视化数据先修层**。

最紧迫的交付动作不是再开一门提示工程、AI 教学、产品管理或多智能体编排课，而是把已完整的本地课程通过全局 release pipeline、生产部署和 URL 验收。冻结副本中，How to Write Prompts、GitHub、Grok、Software Engineering、RAG、两门商业化课，以及 AI Tutor、Product Management、Agent Orchestration 的专用/复合 release gate 通过；Codex、Cursor、Claude 与 MCP 仍有明确阻断，仓库 TypeScript 还有 1 条 Claude test 类型错误，根 `build:release` 又先被 Handbook 的 ko/ar 各 28 个缺键阻断。因此任何课程都不能由“本地 PASS”直接升级为上线。第一门真正需要新建的技术主干仍应是 **Machine Learning Foundations**；同时把 S01 扩展为 AI Python/Jupyter & Data 桥接层，再建设 Deep Learning/Transformers。Responsible AI 应复用 AI Tutor、Product Management、Agent Orchestration、S00/S04/S05/S07/S08、Software Engineering 和 MCP 的已有公平、安全、治理与人工门材料，补齐连贯主线后作为横向必修 rubric。

## 二、范围与方法

### 2.1 严格纳入标准

主清单只收录当前 DeepLearning.AI canonical 课程页中，正式 `Instructor` / `Instructors` 或明确课程创建者字段列出 Andrew Ng 的项目。Andrew 仅作为推荐者、采访对象、欢迎视频嘉宾、guest expert 或合集策展人的页面不进入主统计。

研究流程是：从 [sitemap](https://www.deeplearning.ai/sitemap.xml)抽取 117 个 `/courses/` 页面和 10 个 `/specializations/` 页面，共 127 页；逐页检查结构化讲师、标题、类型、等级、时长、受众、先修要求和课程大纲；再按 canonical slug 合并旧路径、短课旧路径、alpha 页面、语言版本与平台镜像。14 个纳入页在快照日均返回 HTTP 200。

### 2.2 不把“出现 Andrew Ng 姓名”当作授课证据

以下情况均不足以纳入核心统计：

- Andrew Ng 在页面中推荐课程；
- Andrew 参加一段访谈、欢迎视频或 guest lecture；
- 课程属于 Andrew 策展的 collection；
- Coursera 搜索 UI 把 Andrew 列在人物信息中，但课程提供方、正式发布说明和讲师角色不一致；
- GitHub 仓库标题、topic、README 或文件名含 Andrew Ng，但 owner 与课程关联无法由 first-party 来源互证。

### 2.3 当前产品、课程单元与历史课程分层

当前主统计保留两个层次：14 个 canonical 产品用于产品目录判断，20 个唯一课程单元用于知识覆盖判断。原始 2012 Coursera Machine Learning、旧 Machine Learning Engineering for Production 专项课程和 Stanford 经典课程只进入历史附录，不与当前 14 项合并。

## 三、Andrew Ng 当前 14 个 canonical 产品

下表中的课程名称、讲师、等级和时长都来自相应官方课程页；受众是对官方 prerequisites 与 “Who should join” 的压缩表达。更完整的字段在 CSV 中。

| # | 产品与官方页面 | 类型 | 正式讲师角色 | 等级 / 时长快照 | 核心能力与受众 | GitHub 结论 |
|---:|---|---|---|---|---|---|
| 1 | [Agentic AI](https://www.deeplearning.ai/courses/agentic-ai) | Course | Andrew Ng | Intermediate / 9h55m | planning、reflection、tools、multi-agent、agent evaluation；面向有 Python、LLM 与 API 基础的 builder | `official_companion_component` |
| 2 | [AI for Everyone](https://www.deeplearning.ai/courses/ai-for-everyone) | Course | Andrew Ng | Beginner / 6h54m | AI/ML literacy、项目流程、组织战略与社会影响；无需技术背景 | `no_verified_public_repo` |
| 3 | [AI Prompting for Everyone](https://www.deeplearning.ai/courses/ai-prompting-for-everyone) | Course | Andrew Ng | Beginner / 7h4m | 现代 prompting、来源核验、deep research、写作、多媒体和 no-code app | `no_verified_public_repo` |
| 4 | [AI Python for Beginners](https://www.deeplearning.ai/courses/ai-python-for-beginners) | Course | Andrew Ng | Beginner / 11h30m | Python、debug、文件、数据分析、可视化、packages、API 与自动化；面向零编程基础者 | `no_verified_public_repo`；旧 helper URL 返回 404 |
| 5 | [Build with Andrew](https://www.deeplearning.ai/courses/build-with-andrew) | Course | Andrew Ng | Beginner / 1h | 用自然语言迭代、调试并分享网页应用；面向非程序员 | `official_companion` |
| 6 | [Generative AI for Everyone](https://www.deeplearning.ai/courses/generative-ai-for-everyone) | Course | Andrew Ng | Beginner / 5h1m | GenAI 能力/限制、prompting、生产力、商业战略与社会影响 | `no_verified_public_repo` |
| 7 | [Machine Learning in Production](https://www.deeplearning.ai/courses/machine-learning-in-production) | Course | Andrew Ng | Intermediate / 10h59m | scoping、data/model pipeline、baseline、drift、error analysis、monitoring | `official_historical_companion` |
| 8 | [Building Systems with the ChatGPT API](https://www.deeplearning.ai/courses/chatgpt-building-system) | Short Course | Isa Fulford、Andrew Ng | Beginner / 1h55m | chains、classification、moderation、task decomposition、output checking、evaluation | `no_verified_public_repo` |
| 9 | [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/courses/chatgpt-prompt-eng) | Short Course | Isa Fulford、Andrew Ng | Beginner / 1h40m | prompt 原则、迭代、summarize/infer/transform/expand 与 chatbot | `no_verified_public_repo` |
| 10 | [Understanding and Applying Text Embeddings](https://www.deeplearning.ai/courses/google-cloud-vertex-ai) | Short Course | Nikita Namjoshi、Andrew Ng | Beginner / 1h44m | embedding、similarity、classification、clustering、outlier、ScaNN、semantic search | `no_verified_public_repo` |
| 11 | [Jupyter AI: AI Coding in Notebooks](https://www.deeplearning.ai/courses/jupyter-ai-coding-in-notebooks) | Short Course | Andrew Ng、Brian Granger | Beginner / 1h14m | notebook 内代码生成、重构、解释、调试及研究/数据工作流 | `official_companion` |
| 12 | [LangChain for LLM Application Development](https://www.deeplearning.ai/courses/langchain) | Short Course | Harrison Chase、Andrew Ng | Beginner / 1h48m | models、prompts、parsers、memory、chains、document QA、agents | `no_verified_public_repo` |
| 13 | [Deep Learning Specialization](https://www.deeplearning.ai/specializations/deep-learning) | Professional Certificate / Specialization | Andrew Ng；与 Kian Katanforoosh、Younes Bensouda Mourri 创建 | Intermediate / 127h29m | NN、optimization、ML strategy、CNN、RNN、attention、Transformers；需 Python 和基本线代 | `no_verified_public_repo` |
| 14 | [Machine Learning Specialization](https://www.deeplearning.ai/specializations/machine-learning) | Professional Certificate / Specialization | Andrew Ng；与 Eddy Shyu、Aarti Bagul、Geoff Ladwig 创建 | Beginner / 94h58m | regression、classification、trees、clustering、anomaly、recommenders、PCA、RL | `no_verified_public_repo` |

页面文本规范化说明：`Generative AI for Everyone` 的 live H1 在快照日末尾带一个不可见的 Unicode U+3164 字符；CSV 与报告在保留 canonical URL 的同时移除了该展示噪声。这个处理只规范标题，不合并或新增课程。

### 3.1 两个专项课程展开为 8 个子课程

| 父项目 | 子课程 | 时长快照 | 主要主题 | 计数规则 |
|---|---|---|---|---|
| Machine Learning Specialization | [Supervised Machine Learning: Regression and Classification](https://www.coursera.org/learn/machine-learning) | 3 weeks × 10h/week | NumPy、scikit-learn、线性/逻辑回归、梯度下降、正则化 | 只计 1 个课程单元 |
| Machine Learning Specialization | [Advanced Learning Algorithms](https://www.coursera.org/learn/advanced-learning-algorithms) | 3 weeks × 10h/week | TensorFlow NN、多分类、bias/variance、trees、ensembles | 只计 1 个课程单元 |
| Machine Learning Specialization | [Unsupervised Learning, Recommenders, Reinforcement Learning](https://www.coursera.org/learn/unsupervised-learning-recommenders-reinforcement-learning) | 3 weeks × 10h/week | clustering、anomaly、collaborative filtering、PCA、deep Q-learning | 只计 1 个课程单元 |
| Deep Learning Specialization | [Neural Networks and Deep Learning](https://www.coursera.org/learn/neural-networks-deep-learning) | 3 weeks × 10h/week | vectorization、浅/深网络、forward/backprop | 只计 1 个课程单元 |
| Deep Learning Specialization | [Improving Deep Neural Networks: Hyperparameter Tuning, Regularization and Optimization](https://www.coursera.org/learn/deep-neural-network) | 2 weeks × 10h/week | initialization、regularization、BatchNorm、gradient check、Adam、TensorFlow | 只计 1 个课程单元 |
| Deep Learning Specialization | [Structuring Machine Learning Projects](https://www.coursera.org/learn/machine-learning-projects) | 7h | bias/variance、error analysis、数据分布不匹配、transfer/multi-task learning | 只计 1 个课程单元 |
| Deep Learning Specialization | [Convolutional Neural Networks](https://www.coursera.org/learn/convolutional-neural-networks) | 4 weeks × 10h/week | CNN、ResNet、detection、segmentation、face recognition、style transfer | 只计 1 个课程单元 |
| Deep Learning Specialization | [Sequence Models](https://www.coursera.org/learn/nlp-sequence-models) | 4 weeks × 10h/week | RNN、GRU、LSTM、word embeddings、attention、Transformers、speech/NLP | 只计 1 个课程单元 |

因此，知识覆盖比较使用 `12 个 standalone + 8 个 child = 20 个课程单元`。两个父项目只作为目录产品保留，不再当作额外内容单元。

## 四、GitHub 映射：能确认什么，不能确认什么

### 4.1 官方性的证据门槛

本报告没有根据 owner 名称、头像、stars、forks、GitHub topic 或仓库标题判断官方性。当前 first-party artifact hub 是 [https-deeplearning-ai 组织](https://github.com/https-deeplearning-ai)，中央索引是 [https-deeplearning-ai/deeplearning-ai](https://github.com/https-deeplearning-ai/deeplearning-ai)。中央索引明确是 companion artifacts 的非穷举目录，视频与结构化教学仍在 DeepLearning.AI；它不能证明每门课都应有公开 repo。

判定分两步：先用组织归属或中央 hub 独立确认 owner 的 first-party 身份；再至少需要一项 course-specific provenance，例如中央索引的课程—仓库配对、仓库 README 的明确课程声明、课程页链接或 staff-authored 课程说明。只有 “first-party owner + course-specific README” 时可以确认 first-party 课程 repo，但证据强度低于中央索引或课程页的双向配对；学习者论坛记录只作辅助线索，不能冒充官方 staff 声明。

| 当前课程 | 仓库 | 分类 | 关联证据 | 许可与使用边界 |
|---|---|---|---|---|
| Jupyter AI | [sc-jupyterAI-notebooks](https://github.com/https-deeplearning-ai/sc-jupyterAI-notebooks) | `official_companion` | 中央索引将课程 URL 与 repo 直接配对；README 明确称其包含该课程 notebooks | 可按 README 下载/访问作教育与个人非商业学习；未核验到一般修改或再发布授权 |
| Build with Andrew | [lc-build-with-andrew-platform](https://github.com/https-deeplearning-ai/lc-build-with-andrew-platform) | `official_companion` | first-party owner；course-specific README 明确课程名称并描述示例，故可确认配套关系；未找到中央索引、课程页或 staff-authored 帖子的直接 pairing，因此证据弱于 Jupyter AI | 当前 `main` tree 只有 README 与 7 张图片；README 所列 6 个 HTML 不在 tree，所链 PDF 返回 404。未核验到根目录开放许可证；不能称示例可下载或材料完整 |
| Agentic AI | [agentic-ai-public](https://github.com/https-deeplearning-ai/agentic-ai-public) | `official_companion_component`（medium confidence） | first-party owner 与 repo description 指向 Research Agent service；课程分类论坛中一名[学习者转述 lab 页面](https://community.deeplearning.ai/t/unable-to-find-open-in-jupyter-notebook-option-within-the-course-agentic-ai-module1/881895/3)称代码位于该 repo，仅作辅助佐证 | README 未写当前 canonical 课名，中央索引未直接配对；只能称组件/示例服务，未核验到开放许可证 |
| Machine Learning in Production | [machine-learning-engineering-for-production-public](https://github.com/https-deeplearning-ai/machine-learning-engineering-for-production-public) | `official_historical_companion` | first-party README 明确该 repo 保存旧四课 MLEP public resources；[论坛记录](https://community.deeplearning.ai/t/mlops-c1w1-notebook-is-not-visible/111043)只说明学习者曾用它运行历史 lab | repo 根目录提供 [Apache-2.0](https://github.com/https-deeplearning-ai/machine-learning-engineering-for-production-public/blob/main/LICENSE)；具体文件若有单独声明或第三方 NOTICE，以更具体条款为准，且许可不外延到视频、课程页面或平台 lab；现版单课 parity 未核验 |

对其余 10 个当前产品，统一使用 `no_verified_public_repo`。这意味着我们检查了当前中央 companion 组织 `https-deeplearning-ai` 的 34 个公开仓库、中央索引、课程页与官方社区后没有找到满足证据门槛的公开 repo；它没有穷尽其他 first-party owner、私有/删除历史或 GitHub 全网，也与“确认没有公开仓库”和“仓库当前不可访问”是三个不同陈述。

AI Python 说明了“未找到”与“旧线索失效”的差别：旧 helper 地址 `https://github.com/https-deeplearning-ai/aisetup` 在快照日返回 404；[社区论坛一名用户的辅助回复](https://community.deeplearning.ai/t/pypis-links-to-the-aisetup-homepage-and-github-repository-same-url-both-give-a-404-error/841225)也提到地址失效，但不作为 staff 声明。404 无法区分删除、改名、转私有或其他不可见状态，而且该 helper 不等于当前完整课程 companion。因此当前产品在 CSV 中仍为 `no_verified_public_repo`，旧地址只保留在 provenance。

### 4.2 社区仓库不是官方课程，也不自动拥有再发布权

GitHub 搜索会返回大量个人笔记、作业、字幕与答案仓库。例如 [个人 DLS 作业仓库](https://github.com/amanchadha/coursera-deep-learning-specialization)、[个人 MLS 学习材料仓库](https://github.com/azminewasi/Machine-Learning-AndrewNg-DeepLearning.AI)和[标明“非官方”的中文字幕/notebook 仓库](https://github.com/GitHubDaily/ChatGPT-Prompt-Engineering-for-Developers-in-Chinese)。这些只能作为搜索噪声和版权风险的代表例子，不能进入官方课程映射。

[DeepLearning.AI Community Guidelines](https://community.deeplearning.ai/guidelines)禁止公开发布 homework、quiz、exam solutions；官方社区也说明[公开上传 assignment 违反政策](https://community.deeplearning.ai/t/regarding-uploading-course-assignments-on-github/402395)，并给出[课程材料的知识产权分享边界](https://community.deeplearning.ai/t/respecting-intellectual-property-how-to-share-deeplearning-ai-course-materials-responsibly/681787)。指南对依据 Creative Commons 许可用于教育的 lecture slides 留有例外，但页面没有替每一项资产标出准确的 CC 版本；因此具体复用仍须回到目标文件核对许可证、署名与修改条件。aicourse 默认只链接官方课程或按明确、逐资产许可证使用代码/材料，并独立编写总结、案例、练习与 capstone；README/Terms 明确允许的下载与个人非商业学习可按其边界进行，但不得把无明确再发布授权的 notebook、quiz、答案、视频、transcript、截图或专有 prompt 复制进 aicourse、公开再发布或改编。中央 hub 的 “open-source / educational use” 总体表述不足以确认一般修改或再发布范围，具体 repo/资产的明确许可证优先。

## 五、历史课程与灰区项目

下列项目用于补足 Andrew Ng 的经典课程脉络，但不进入当前 14 产品 / 20 单元统计。

| 项目 | 第一方证据 | 处理方式 |
|---|---|---|
| 原始 2012 Coursera Machine Learning MOOC | DeepLearning.AI 的[新版 MLS 发布说明](https://www.deeplearning.ai/blog/andrew-ng-machine-learning-specialization)把现三课专项描述为原课的 updated and expanded successor | 只作历史背景，不与现 MLS 双计 |
| Machine Learning Engineering for Production (MLOps) Specialization | DeepLearning.AI 的[原始发布说明](https://www.deeplearning.ai/the-batch/introducing-the-machine-learning-engineering-for-production-mlops-specialization)及 first-party public repo | 历史四课专项；不与当前 standalone Machine Learning in Production 合并 |
| Stanford CS229: Machine Learning | [Stanford Engineering Everywhere 归档](https://see.stanford.edu/Course/CS229) | 经典 Stanford offering，不属于当前 DLAI 目录 |
| Stanford CS221: AI, Autumn 2009 | Andrew Ng 的[Stanford 第一方课程列表](https://ai.stanford.edu/~ang/courses.html) | 历史课程背景，不属于当前 DLAI 目录 |
| Stanford CS230: Deep Learning | [Stanford 官方课程页](https://web.stanford.edu/class/cs230/) | 与 DLS 有内容关联，但不是额外 DLAI 当前产品 |
| Generative AI for University Leaders | [Coursera 课程页](https://www.coursera.org/learn/gen-ai-for-university-leaders)的 UI 包含 Andrew；[Coursera 官方发布说明](https://blog.coursera.org/coursera-launches-free-vanderbilt-course-generative-ai-for-university-leaders/)确认提供方为 Vanderbilt、主讲为 Jules White，Andrew 作为 guest expert 出现；且不在 DLAI 当前目录 | 灰区附录；不计入主清单 |

## 六、aicourse 当前工作树与线上成熟度

### 6.1 快照边界

仓库 HEAD 仍为 `0f4246ab19a0b4f987f45a50ec6a3b2e7eac14bd`，工作树非干净且有其他任务并行写入。定稿没有读取一个任意时刻的 live 目录后直接下结论，而是把相关输入、release 支持工件和 S00–S10 原件复制到隔离副本；复制前、复制后、副本本身及运行 checker 后重新计算的聚合 SHA-256 均为 `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d`，冻结时间为 **2026-08-24 12:34:38 +0800**。随后只在该副本扫描 [公共目录入口](../lib/courses.ts)、manifest/TypeScript package、英文正文、来源合同、route、测验、capstone、checker、release-support artifacts，以及 [S00–S10 V3.0 总览](<../course_review_2026-08-23/original/S00-S10_V2.1-V2.2与V3.0_差异侧重点优劣与能力结论.docx>)与 11 册原始 DOCX。完整路径范围、命令、dirty 状态和 checker 输出摘要见 provenance。

线上检查与本地检查严格分开：2026-08-24 生产站 [课程目录](https://aicourse.top/en/courses/)、[Handbook](https://aicourse.top/en/handbook/)和 [Lab](https://aicourse.top/en/lab/)返回 200；Codex、Cursor、Claude、Grok、GitHub、Prompts、Software Engineering、RAG、MCP、Make Money with Codex、Claude Income、AI Tutor、Product Management 和 Agent Orchestration 的 14 条 `/en/<course>/` 均返回 404。由此，route 文件、manifest 的 `publishedOn`、本地 catalog 的 `available` 或独立 checker PASS 都不能当作线上部署证据。

### 6.2 四态成熟度合同

本报告按两个轴判断：内容是否形成可学习主干，以及学习者能否在生产站访问。最终对用户要求的四种状态作如下操作化：

| 状态 | 证据门槛 | 当前归类 |
|---|---|---|
| **已在网站上线** | 生产 URL 可访问，且能进入实质学习路径 | Agentic Engineering 的 Handbook/Lab；外部 Build 仓库只作为其代码模块 |
| **有完整课程包草案** | 有连续正文、练习/交付物、assessment 与 capstone；可再细分为“本地可路由”和“DOCX 原稿” | 本地可路由的 14 门课程；以及未接站的 S00–S10 11 册。checker PASS 只说明本地合同，不改变本状态 |
| **部分覆盖** | 多门课或课程包中有实质片段，但尚未形成该能力的独立、连贯主干 | Python/Data、predictive MLOps、Responsible AI、AI Research、multimodal modeling |
| **真正缺失** | 扫描 route、manifest、英文正文及 S00–S10 后，仍未发现系统 lesson sequence | 传统 Machine Learning Foundations；Deep Learning/Transformers 原理与训练 |

“完整课程包草案”不是“内容完美”或“release-ready”的同义词：Codex、Cursor、Claude 与 MCP 的 release gate 仍失败，TypeScript 和根 release build 也有独立阻断；S00–S10 虽有完整教学结构和通用/继续学习来源清单，却没有逐 claim source contract、冻结访问日期、逐来源/逐资产 rights ledger 和可运行 release audit。

### 6.3 去重后的可路由课程盘点

| 课程/模块 | 本地实质内容 | 成熟度判断 | 本轮验证结果 |
|---|---|---|---|
| [Agentic Engineering](../lib/courses.ts) | Handbook + Lab + Build，共 235 分钟；LLM API、prompt/context、agent loop、tools、harness、evaluation、reviewer | **线上已发布** | Handbook/Lab 在线可访问；Build 链接公开 GitHub |
| [How to Use Codex](../lib/codex/manifest.ts) | 12 lessons / 660 分钟；task contract、环境/权限、plan/steer、debug/test、review、agents/skills、CLI/IDE/cloud、capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker FAIL：8/8 locale review 数量满足，但 18 张指定真实 UI capture 尚未补；结构完整不等于 release acceptance |
| [How to Use Cursor](../lib/cursor/manifest.ts) | 14 lessons / 800 分钟；编辑/agent、planning、test/review、rules/skills/MCP、cloud、多类工作室、capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | locale/结构、28-question bank、来源、14 figures、capstone 与 route 均通过；release 仍因 14 张一方图片缺证据化发布权判定，以及 `publicationStatus`/日期未发布而失败 |
| [How to Use Claude](../lib/claude/manifest.ts) | 15 lessons / 870 分钟；files、projects、artifacts、research、tools/connectors、Cowork、软件/研究/办公/教学、portfolio capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker FAIL：12 张 Academy-hosted figures 尚无发布许可，且 `fig-01` 的 source-to-local authenticity provenance 未解决；另 3 张 repo figures 有许可记录但保留 UI/trademark caveat |
| [How to Use GitHub](../lib/github/manifest.ts) | 12 lessons / 660 分钟；repo、branch、PR/review、issues、projects、automation、研究复现、写作/教学 capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS：12 lessons、9 locales、44 sources、21 authentic figures、24-question bank；本地通过仍不等于生产已部署 |
| [How to Use Grok](../lib/grok/course.manifest.json) | 14 lessons / 695 分钟；隐私、search/verify、files/data、软件/研究/办公/教学、image/video、automation、capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS：4 units、14 lessons、36 evidence records、10 authentic figures、9/9 locale bundles |
| [How to Write Prompts](../lib/prompts/manifest.ts) | 9 lessons / 380 分钟（含 final quiz）；specification、few-shot、structured contracts、evaluation flywheel、chain、grounding/safety、原创 evidence-packet capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS：9 lessons、18 sources、9 figures、2 组 verified raster pairs |
| [Software Engineering with Agentic AI](../lib/software-engineering/manifest.ts) | 5 units / 18 lessons / 908 分钟；requirements、architecture、context、construction、testing、review、CI/CD、observability、security、governance、agent eval、capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS：25-question bank、15-question final（12 题通过）、9 authentic figures、8 件 capstone evidence artifacts；本地合同通过但生产路由仍未上线 |
| [RAG](../lib/rag/manifest.ts) | 12 lessons / 780 分钟；34 concepts、40 sources、12 figures（其中 5 张 authentic UI）、12 questions；ingestion、retrieval、reranking、evaluation、security、refresh 与 production capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | 冻结副本 release checker PASS：9 个 content locales、0 errors / 0 warnings；本地通过仍不等于生产部署 |
| [Model Context Protocol](../lib/mcp/course.ts) | 5 units / 18 lessons / 1075 分钟；48 concepts、71 sources、12 high-risk claim mappings、8 figures、18-question assessment；protocol、tools/resources/prompts、transport、auth、安全、跨 host、operations、capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker FAIL：19 errors；12 个 source accessed date 未冻结，另有 6/8 licensed direct UI、7-test fixture、figure manifest/rights/upstream record 阻断 |
| [How to Make Money with Codex](../lib/make-money-with-codex/index.ts) | 12 lessons / 630 分钟；paid problem、pilot、pricing、delivery、productization、responsible recurring value；12 questions、35 sources、9 figures | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS；4 张真实 Codex UI/transcript 与 5 张合成 downstream output/handoff figures 的权利/来源工件已通过本地合同 |
| [How to Make Money with Claude](../lib/claude-income/index.ts) | 4 units / 12 lessons / 895 分钟；demand、offer、delivery spec、Projects、research、files、Skills/connectors、Artifacts、software、retainers、capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS：7 real UI figures、29 sources、24-question bank、0 errors / 0 warnings |
| [AI Tutor](../lib/ai-tutor/manifest.ts) | 4 phases / 8 modules / 450 分钟；learning objectives、diagnosis、scaffolding、formative assessment、item validation、learner modeling、impact experiment、teacher oversight；8-artifact capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS：11 sources、10 progress milestones、8-question final（至少 6/8 且 critical oversight 题必须正确）；不能把设计包称为学习成效证据 |
| [Product Management](../lib/product-management/manifest.ts) | 4 phases / 14 modules / 910 分钟；strategy、discovery、portfolio、metrics、experiments、PRD、AI architecture/eval、governance、GTM、operations；14-artifact capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | release checker PASS：102 evidence records、14 concept domains、16 milestones、14 题 final（80%）；已实质覆盖原报告拟新增的 AI Strategy/Product 主干 |
| [Agent Orchestration](../lib/agent-orchestration/manifest.ts) | 4 phases / 15 modules / 1060 分钟；task graph、routing、parallel/join、ownership、handoff、workers/verifier、ACI/MCP、state/memory、budgets、recovery、security、observability、eval、production capstone | **有完整课程包草案（可路由）**；catalog `available`，线上 404 | 主 release gate、i18n/fallback、progress 和 15 个 module-specific labs 的 684 个穷举/对抗 case 全部 PASS；2 个审校长文 locale + 7 个显式英语 fallback |
| [AI for Evidence-Grounded Research](../lib/courses.ts) | 只有标题、blurb、level，无 lessons/时长/测验 | **标题占位** | 不计作完整覆盖 |
| [Responsible AI and Evaluation](../lib/courses.ts) | 只有标题、blurb、level，无 lessons/时长/测验 | **标题占位** | 不计作完整覆盖 |
| [Tool Design / Cost Engineering / Human in the Loop](../lib/courses.ts) | 只有模块名称和 60/30/35 分钟估计，`href: "#"` | **模块级占位** | 无正文、测验、capstone 与验收合同 |

### 6.4 尚未接入网站的 S00–S10 V3.0 完整课程包草案

本地 [课程体系总览](<../course_review_2026-08-23/original/S00-S10_V2.1-V2.2与V3.0_差异侧重点优劣与能力结论.docx>)显示，这不是 11 个标题卡片，而是一套 **11 册完整课程包草案**：front matter 的逐册声明相加为 112 个模块，逐模块正文包含练习、错误分析、证据要求、企业交付物、独立 Verifier，以及贯穿项目或毕业验收。不过 S06 首页/模块地图声明 8 个并漏列 M06-02，正文却实际包含 M06-01 至 M06-09；因此机械标题总数为 113。本报告保留“声明 112 / 机械 113”的差异，不把任一数字当成完成度或学习成效证明。它们当前只有 DOCX 与抽取语料，没有站点 catalog、route、manifest 和生产部署，所以不能称为 11 门已发布网站课程。

| 课程包册 | 模块数 | 已有实质覆盖 | 与现有网站课去重及剩余动作 |
|---|---:|---|---|
| [S00 项目安全协作与课程施工操作系统](<../course_review_2026-08-23/original/S00_项目安全协作与课程施工操作系统_V3.0_吴恩达学习法与企业能力修订版.docx>) | 6 | mission、任务契约、权限、ADR、证据链、Verifier、handoff、Secure SDLC | 是跨课施工/安全底座；应抽成共同验收合同，不单独重复计为 AI 学科 |
| [S01 代码运行模型与可测试 Python](<../course_review_2026-08-23/original/S01_代码运行模型与可测试 Python_V3.0_吴恩达学习法与企业能力修订版.docx>) | 9 | Python 执行模型、纯函数、类型、单元/边界测试、错误样本与性能基线 | 可作为 Python 桥接课主体；仍需补 Jupyter、NumPy/Pandas、统计与可视化 |
| [S02 对象协作、故障诊断与可维护设计](<../course_review_2026-08-23/original/S02_对象协作、故障诊断与可维护设计_V3.0_吴恩达学习法与企业能力修订版.docx>) | 12 | 领域责任、端口/适配器、错误模型、test doubles、logging、安全重构 | 与产品软件工程内容有重叠；适合沉淀为共享工程先修 |
| [S03 Web、数据、异步与全栈服务边界](<../course_review_2026-08-23/original/S03_Web、数据、异步与全栈服务边界_V3.0_吴恩达学习法与企业能力修订版.docx>) | 9 | API、关系数据、事务/幂等、RBAC、后台任务、TypeScript/React、队列/事件 | 可支撑 LLM 应用部署；不是统计/机器学习数据基础 |
| [S04 LLM 应用、评估、可观测与安全](<../course_review_2026-08-23/original/S04_LLM 应用、评估、可观测与安全_V3.0_吴恩达学习法与企业能力修订版.docx>) | 6 | versioned eval set、规则/模型/人工盲评、回归门、online signals、red team、cost/latency | 与 S05 应整合为 LLM Application Engineering；需要网站 manifest、来源合同与可运行发布验收 |
| [S05 RAG、工具与确定性工作流](<../course_review_2026-08-23/original/S05_RAG、工具与确定性工作流_V3.0_吴恩达学习法与企业能力修订版.docx>) | 9 | corpus/index、chunking、hybrid retrieval、reranking、`Recall@K`、`nDCG`、context、generation、grounding、权限/补偿/恢复 | 与已可路由 RAG 做逐模块 diff，只合并非重复指标、恢复与 human-gate 内容 |
| [S06 Agent Engineering 与素材自动化](<../course_review_2026-08-23/original/S06_Agent Engineering 与素材自动化_V3.0_吴恩达学习法与企业能力修订版.docx>) | 首页声明 8；正文 9 | workflow/agent 选择、有界循环、独立验证、人工升级、context/memory、多模态素材流水线 | 模块地图漏列 M06-02，定稿前应修源文；与线上 Agentic 及产品 agent 课重叠，只计新增能力 |
| [S07 内容驱动增长平台与生产工程](<../course_review_2026-08-23/original/S07_内容驱动增长平台与生产工程_V3.0_吴恩达学习法与企业能力修订版.docx>) | 18 | product discovery、PRD、contracts、lineage、metrics/experiments、release、observability、incident、rollback、privacy、cost、PRR | 已覆盖通用产品/生产工程；MLOps 仍须增加训练数据、experiment registry、model serving/drift 等 ML-specific lifecycle |
| [S08 多智能体工程编排与高级规模化](<../course_review_2026-08-23/original/S08_多智能体工程编排与高级规模化_V3.0_吴恩达学习法与企业能力修订版.docx>) | 15 | task graph、parallel/join、ownership、machine handoff、独立验证、全局预算、恢复、渐进发布 | 与 Agentic/Codex 等内容重叠；作为高级编排与规模化扩展，不重复计为新基础学科 |
| [S09 Prompt Engineering](<../course_review_2026-08-23/original/S09_Prompt Engineering（提示词工程）_V3.0_吴恩达学习法与企业能力衔接版.docx>) | 10 | prompt、信息路径、任务模式、安全边界、评估与版本化 | 与可路由 How to Write Prompts 高度重叠；应合并最佳内容而非发布两门同质课 |
| [S10 Git 与 GitHub](<../course_review_2026-08-23/original/S10_Git与GitHub_从本地版本到企业安全协作_V3.0_吴恩达学习法与企业能力衔接版.docx>) | 10 | small diff、CI、独立评审、保护分支、secret/supply chain、多 agent 隔离协作 | 与可路由 How to Use GitHub 高度重叠；应作为补强源而非重复产品 |
| **合计** | **front matter 112；机械标题 113** | **11 册均有实质教学与验收结构** | **先修 S06 计数矛盾；成熟度仍是一个课程体系包的草案层，不是 11 门线上课程** |

必须同时保留发布边界：直接扫描 12 个 DOCX 的 OOXML hyperlink relationships，共发现 **87 个 external hyperlink relationships / 21 个唯一 URL**；总览与 S00–S08 各有 7 个高度重复的通用/“权威继续学习资料”，S09 有 8 个，S10 有 9 个。先前只在抽取语料的 URL 字面量中看到 `sandbox.invalid` 与 `github.com/USERNAME/...`，是因为该抽取没有保留 relationship target，不能据此反推“没有外部来源”。但这些 reading lists 仍不是逐 claim 映射：没有统一 accessed/frozen date、archive/hash、claim-source contract 或逐来源/逐资产 rights ledger，fixture 也不是可运行环境。因此“完整课程包草案”只确认课程结构、练习和验收设计，不确认每项外部主张已 source-audited、代码/命令可运行、资产可再发布或真实学习成效。每册接站前须把通用来源清单升级为可审计来源合同，并补 claim boundary、rights record、可执行 fixture、环境锁定与独立 release checker。

Codex、Cursor、Claude、Grok 是不同产品课，但大量复用 task contract、context、planning、verification、privacy、research、writing、teaching 与 automation workflow；两门“Make Money”课共享 demand validation、offer、pricing、delivery、proof 与 responsible operations；Product Management 又与两门商业化课及 S07 重叠；AI Tutor 吸收了旧 AI Teaching 占位所指向的学习设计主干；Agent Orchestration 与 MCP、S06/S08 及产品 agent 课高度重叠；Software Engineering 与 S00–S03/S07/S10 重叠；S09/S10 与 Prompts/GitHub 重叠。能力比较对这些可迁移能力只计一次，不能把产品名、route 数、DOCX 册数或来源数当成不同 AI 学科。

冻结副本的 `npx tsc --noEmit --incremental false --pretty false` 以 exit 2 失败：`tests/claude-course.spec.ts` 有 1 条互斥 literal type 比较错误。根 `build` / `build:release` 已调用 RAG，但仍没有调用 Prompts、Software Engineering 与 MCP 的独立 release checker；实际 `npm run build:release` 又在最前段 Handbook i18n 因 ko/ar 各缺 28 个属性键而 exit 1，尚未运行到后续课程门或 Next build。因此“逐门 checker 结果”不等于“统一发布总门完整”或“生产部署成功”。

## 七、能力矩阵

内容覆盖与交付成熟度是两个轴：`强覆盖`表示已有系统学习主干，`部分覆盖`表示有实质资产但仍缺关键环节，`真正缺失`表示 route、正文与 S00–S10 都没有系统 sequence；交付成熟度另用“已上线 / 可路由完整草案 / DOCX 完整草案 / 标题占位 / 无资产”。因此一项能力可以同时是“强覆盖”与“尚未上线”。

| 能力簇 | Andrew Ng 当前课程证据 | aicourse 当前证据 | 内容覆盖 | 交付成熟度与精确缺口 |
|---|---|---|---|---|
| AI literacy、社会影响、组织战略 | [AI for Everyone](https://www.deeplearning.ai/courses/ai-for-everyone)、[Generative AI for Everyone](https://www.deeplearning.ai/courses/generative-ai-for-everyone) | 线上 Agentic Handbook；Product Management、AI Tutor 与商业化课含能力边界、风险、组织角色、采用与停止判断 | **部分覆盖** | 线上 + 可路由草案；仍缺一条面向非技术学习者的独立通识、组织能力建设与 change-management 主干 |
| AI Product Strategy / Product Management | 同上；两门课含机会判断、组织采用与商业战略 | Product Management 14 modules / 910 分钟，覆盖 portfolio、model/provider 与 build-buy、discovery、metrics、PRD、AI eval、governance、GTM/adoption、Product Ops；另有 S07 和两门商业化课 | **强覆盖** | **可路由完整草案**；不再列为待新建课程。剩余动作是去重、发布、验证 capstone，并只补更宽的组织转型/行业组合治理 |
| Python、数据处理、统计、可视化 | [AI Python for Beginners](https://www.deeplearning.ai/courses/ai-python-for-beginners)、[MLS](https://www.deeplearning.ai/specializations/machine-learning)、[Jupyter AI](https://www.deeplearning.ai/courses/jupyter-ai-coding-in-notebooks) | S01 的 9 模块可测试 Python；S03 有 API/数据库/数据服务；产品课有 files/data workflow | **部分覆盖** | **DOCX 完整草案 + 跨课片段**；Python engineering 已有，Jupyter、NumPy/Pandas、数据清洗、统计、可视化与可复现实验尚未形成连贯课程 |
| 监督/无监督学习、推荐、RL | [Machine Learning Specialization](https://www.deeplearning.ai/specializations/machine-learning)三门子课 | 未发现回归、分类、trees、clustering、anomaly、recommenders、RL 的系统课程 | **真正缺失** | **无资产**；最大传统 AI/ML 主干空白 |
| 神经网络、优化、CNN、序列、attention/Transformers | [Deep Learning Specialization](https://www.deeplearning.ai/specializations/deep-learning)五门子课 | 调用 Claude、DeepSeek、Codex 或 Grok API；无 backprop、训练与架构课程 | **真正缺失** | **无资产**；产品使用不等于 Deep Learning |
| prompting、context、structured output、prompt evaluation | [Prompt Engineering](https://www.deeplearning.ai/courses/chatgpt-prompt-eng)、[AI Prompting](https://www.deeplearning.ai/courses/ai-prompting-for-everyone)、[Building Systems](https://www.deeplearning.ai/courses/chatgpt-building-system) | 线上 Lab/Agentic；可路由 Prompts；S09 课程包；Codex/Cursor/Claude/Grok | **强覆盖** | **已上线片段 + 可路由完整草案 + DOCX 完整草案**；内容已重复，优先合并与发布，不从零再造 |
| LLM systems、chaining、embeddings、semantic search、RAG、reranking、grounding | [Building Systems](https://www.deeplearning.ai/courses/chatgpt-building-system)、[Text Embeddings](https://www.deeplearning.ai/courses/google-cloud-vertex-ai)、[LangChain](https://www.deeplearning.ai/courses/langchain) | RAG 12 lessons / 780 分钟；S04/S05 补 hybrid retrieval、reranking、`Recall@K`/`nDCG`、grounding、evaluation 与 observability | **强覆盖** | **可路由完整草案 + DOCX 完整草案**；RAG 专用 gate 在冻结副本通过，剩余是总门/生产部署与 S04/S05 差异合并，不是新课缺口 |
| agents、tools、planning、reflection、multi-agent、orchestration | [Agentic AI](https://www.deeplearning.ai/courses/agentic-ai) | 线上 Agentic；Agent Orchestration 15 modules / 1060 分钟；MCP 18 lessons；S06/S08；产品 agent 课 | **强覆盖** | **已上线 + 两门可路由完整草案 + DOCX 完整草案**；主动作是部署、去重和维护，不再补建编排主干 |
| LLM/application eval、predictive-ML eval、error analysis、实验设计 | Agentic AI、Building Systems、MLS/DLS 与 [Machine Learning in Production](https://www.deeplearning.ai/courses/machine-learning-in-production) | RAG、Product Management、Agent Orchestration、AI Tutor 与 S04/S05/S07 有 eval set、检索/答案指标、盲评、回归、产品/学习实验 | **LLM/application eval 强；predictive-ML eval 部分** | **可路由 + DOCX 完整草案**；predictive benchmark、calibration、统计误差分析须在 ML 主干补齐 |
| data-centric AI、deployment、monitoring、drift、observability、rollback、MLOps | [Machine Learning in Production](https://www.deeplearning.ai/courses/machine-learning-in-production) | Software Engineering、Product Management 与 S07 覆盖 CI/CD、lineage、GenAI drift、release、observability、incident、rollback、PRR；RAG/S04/S05 有 LLMOps | **部分覆盖** | **可路由 + DOCX 完整草案**；仍缺训练数据版本、experiment/model registry、predictive serving、完整 data/concept drift 与 predictive continuous evaluation |
| safety、privacy、fairness、explainability、governance、accountability、human oversight | AI for Everyone、Generative AI for Everyone、Agentic AI 的社会/风险/评估内容 | Product Management 含 group performance、transparency、appeal、drift/rollback；AI Tutor 含 fairness、teacher authority、learner recourse；Agent Orchestration、Software Engineering、MCP 与 S00/S04/S05/S07/S08 含权限、red team、Verifier、升级/停止 | **部分覆盖，不是缺失** | **多门可路由完整草案 + DOCX 完整草案；Responsible AI 独立课仍为标题占位**。需整合 fairness audit、explainability、impact assessment、accountability、cards 与 contestability 主线 |
| multimodal、vision、speech/audio、image/video | DLS 的 CNN/Sequence Models；AI Prompting 的多媒体应用 | Grok Imagine、Claude files/artifacts；S06 有多模态素材流水线 | **部分覆盖** | **可路由产品 workflow + DOCX 完整草案**；不等于 vision/speech/multimodal modeling、multimodal embeddings/RAG 与技术评价 |
| AI Tutor / learning design | Jupyter AI、AI Prompting 只提供工具工作流 | AI Tutor 从 objectives、diagnosis、scaffolding、formative assessment、item validation、learner modeling 到 impact experiment 与 teacher oversight | **强覆盖** | **可路由完整草案**；旧 AI Teaching 标题占位已被实质课程取代，剩余是部署与更广泛教师/学校组织层内容 |
| Evidence-grounded research、office、知识生产 | Jupyter AI、AI Prompting、Build with Andrew 提供部分工作流 | RAG、Claude/Claude Income、Cursor、Grok、GitHub 有 research/writing/office 与 evidence workflow；AI Research 仍为标题占位 | **部分覆盖** | **跨课实质内容 + 标题占位**；需整理 provider-neutral research 方法、原创 capstone 与独立线上路径 |

### 7.1 必须保留的判断边界

1. Agentic Engineering 的 “AI foundations” 是 LLM/agent mental model，不是传统 Machine Learning Foundations。
2. 调用 Claude、DeepSeek、Codex 或 Grok 不等于学习 Deep Learning，更不等于训练模型。
3. 产品课中的 context engineering、长上下文、文件上传、网页搜索与 citation workflow 本身不等于完整 RAG；S05 之所以计作 RAG 在建覆盖，是因为它另有 corpus、retrieval、ranking、context 与 generation 的分层实作和指标。
4. prompt evaluation、代码测试和 diff review 不等于 predictive-ML model evaluation 或 calibration；Product Management、AI Tutor 与 S07 的实验设计很实质，但也不能替代 ML benchmark、统计误差分析和校准主干。
5. coding-agent cloud、worktree、GitHub Actions 与 automation 不等于 MLOps；Product Management 与 S07 已补 GenAI drift/rollback 和通用 production engineering，仍未补齐 predictive ML lifecycle。
6. prompt injection、least privilege、privacy、red team 与权限控制不等于完整 Responsible AI。Product Management 与 AI Tutor 已有 fairness、appeal、teacher authority、governance 等实质内容，因此该能力是“部分覆盖”而非“缺失”；但独立连贯主课仍未形成。
7. 一节 image/video 生成不等于 multimodal AI 技术课。
8. 产品课程数量不等于能力广度；共享工作流必须去重。
9. `publishedOn`、本地 `available`、route 文件或九个 locale URL 都不自动证明已生产发布或已有九种完整翻译。
10. 完整 DOCX 课程包不自动证明外部来源已审计、许可证已清理、示例可运行、课程已部署或学习成效已验证。

## 八、最大知识缺口与建议建设顺序

### 8.1 五维评分

评分采用固定公式：

```text
总分 = (覆盖缺口×30% + 品牌契合×25% + 后续先修×20%
      + 复用/可行性×15% + 低维护负担×10%) × 20
```

各维度 1–5 分；最后一项分数越高，表示长期维护负担越低。分数衡量“课程建设投资价值”，不等同于学习依赖顺序或部署紧迫性，也不表示每一项都应从零新建。为降低虚假精确感，采用以下可观察锚点；2 与 4 是相邻锚点之间的中间状态。

| 维度 | 1 分锚点 | 3 分锚点 | 5 分锚点 |
|---|---|---|---|
| 覆盖缺口 | 已有完整本地主干，只余部署/维护 | 有实质模块但缺连贯主线或关键环节 | route、正文与 S00–S10 均无系统 sequence |
| 品牌契合 | 通用工具导览，较少证据/验证特色 | 有实作与边界，但教育研究或可审计性有限 | 直接强化实作、验证、来源透明、教育/研究导向 |
| 后续先修 | 终端专门课，很少支撑其他课程 | 支撑 1–2 条后续路径 | 是 3 条以上技术/领域路径的共同先修 |
| 复用/可行性 | 几乎从零创建 | 有分散片段或相邻工程资产 | 已有完整 route/课程包与可复用 assessment/capstone |
| 低维护负担 | 高供应商/UI/算力/法规漂移 | 中等版本维护 | 稳定、provider-neutral，可锁定小型环境与数据 |

**A. 真正新建课程的优先级**

| 排名 | 候选课程 | 缺口 30% | 品牌 25% | 先修 20% | 复用 15% | 低维护 10% | 总分 |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | Machine Learning Foundations | 5 | 5 | 5 | 2 | 5 | **91** |
| 2 | Deep Learning and Transformers | 5 | 4 | 4 | 2 | 3 | **78** |
| 3 | Multimodal & Domain AI | 4 | 4 | 3 | 4 | 2 | **72** |

**B. 已有资产的整合、补课与发布优先级**

| 排名 | 候选课程/动作 | 缺口 30% | 品牌 25% | 先修 20% | 复用 15% | 低维护 10% | 总分 |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | AI Python/Jupyter & Data Foundations：扩展 S01/S03 | 4 | 4 | 5 | 4 | 4 | **84** |
| 2 | Production AI / MLOps：扩展 S07 的 ML-specific lifecycle | 4 | 5 | 4 | 4 | 2 | **81** |
| 3 | Responsible AI and Human Oversight：整合 PM/AI Tutor/跨册材料并补主线 | 2 | 5 | 4 | 5 | 3 | **74** |
| 4 | Evidence-Grounded Research：整理跨课 evidence workflow | 3 | 5 | 3 | 3 | 4 | **72** |
| 5 | RAG / LLM Application Engineering：部署现有 route 并合并 S04/S05 | 1 | 5 | 4 | 5 | 3 | **68** |

评分原始证据是：ML 与 DL 在所有 route、manifest 和 S00–S10 中仍没有系统主干，故缺口为 5；S01 已有可测试 Python、S03 有数据服务，因此 Python/Data 不按零资产评分；RAG 已有 12-lesson route，S04/S05 又提供可合并材料，故知识缺口为 1、复用为 5；Software Engineering、Product Management 与 S07 已有部署、观测、GenAI drift、事故与回滚，但 predictive ML 的训练数据、registry、serving 与完整 drift lifecycle 仍缺；Research 在多门产品课、RAG 与 GitHub 中有丰富但分散的 evidence workflow，独立方法课仍只是标题占位，因此复用/可行性按 3 而不是 5。Responsible AI 的缺口给 2 而非一般“部分覆盖”的 3，是因为多个完整可路由课程已分别把 fairness、appeal、teacher authority、governance 和 assessment/capstone 做成实质结构，缺的是跨模块课程化整合与 explainability/impact/accountability/cards/contestability 主线；这使其介于完整主干和一般分散片段之间。DL、MLOps 和 Multimodal 的算力、依赖及平台变化使低维护分较低。

Product Management、AI Tutor 与 Agent Orchestration 不进入“待建设课程”榜：它们已经是完整可路由草案，当前任务是 release integration、浏览器/生产验收与部署。若为历史比较机械给 Product Strategy 保留旧维度并把缺口从 2 降到 1，总分会从 67 降为 61；但这不代表低优先，恰恰表示不应再投入一门重复新课。

### 8.2 “最大缺口”不等于“第一门立即开发的课”

从知识地图看，**Machine Learning Foundations** 是最大空白，**Deep Learning and Transformers** 是第二个纯知识主干空白。LLM Application Engineering 则不是第一门 greenfield 新课：RAG route 与 S04/S05 都已存在，正确动作是部署现有 route 并增量合并。

建议把动作分成三条时间线：

1. **立即收口与部署**：冻结副本中 Prompts、GitHub、Grok、Software Engineering、RAG、两门商业化课、AI Tutor、Product Management 和 Agent Orchestration 专用/复合 gate 通过；Codex、Cursor、Claude、MCP 未通过。先修 1 条 Claude test TypeScript error、Handbook ko/ar 缺键和 MCP 19 errors，再在冻结 commit 重跑根总门。根 `build` / `build:release` 还须 additive 地纳入 Prompts、Software Engineering 与 MCP 的 gate；RAG 已进入根总门。
2. **立即整合已有课程包**：S04/S05 只把非重复的评价、hybrid retrieval、reranking、恢复和 human-gate 内容并入现有 RAG；S06/S08 只补 Agent Orchestration；S07 的 product 内容并入 Product Management、ML-specific 部分留给 MLOps；S09/S10 分别补 Prompts/GitHub；S00 抽成共享安全验收合同；S01/S03 组成 Python/Jupyter/Data 桥接层。每次合并前都先做模块级 diff，避免把 11 册重新包装成 11 门重复网站课。
3. **新建长期技术主干**：以 Machine Learning Foundations 为第一门真正新增主课，再建设 Deep Learning and Transformers；随后在 S07 的通用生产工程上增加训练数据、registry、serving 与 predictive drift，形成完整 Production AI/MLOps。

Responsible AI and Human Oversight 不应排在技术主干最后，而应从 Python/ML 阶段开始，成为 LLM Application、MLOps、Multimodal 和领域课共用的 rubric。Product Management、AI Tutor 与 Agent Orchestration 已是完整课程包草案，路线图只安排发布和残余扩展，不再把它们列作未来新课；Multimodal & Domain AI 后置。

## 九、课程路线图与原创设计

### 9.1 先完成，不重复造课

#### A. How to Write Prompts — **现在发布**

- **对象**：希望把自然语言需求写成可测试工作合同的初学者、研究者、教师和知识工作者。
- **已有资产**：9 lessons / 380 分钟（含 final quiz），source contract、figures、checkpoint、final assessment、原创 prompt evidence packet capstone；本轮本地 checker 已通过。
- **还需动作**：生产路由与部署验收；明确英文课程与 locale fallback；上线后跑链接、structured data、progress 和移动端检查。
- **与 Andrew 的差异**：不复制 Andrew/Isa 的 notebook 或 prompt；以 specification、evidence、test cases、failure log 和可审计交付包为核心。
- **结论**：**现在做，且是“完成发布”而非“重新立项”。**

#### B. Codex / Cursor / Claude / GitHub / Grok — **先清发布门，再扩产品数**

- **对象**：软件工程师、研究者、教师和知识工作者。
- **共用能力**：task contract、context、planning、verification、privacy、research、writing、teaching、automation。
- **当前证据**：GitHub 与 Grok 的 release checker 已通过；Codex release 因 18 张真实 UI capture 未补而失败；Cursor 的结构、locale、assessment 与 route 通过，但 14 张一方图片缺证据化发布权及发布状态；Claude 有 12 张 Academy-hosted 图片缺许可且 `fig-01` authenticity provenance 未解决。五条生产 URL 均为 404。
- **当前风险**：产品变化快、截图/许可维护、locale fallback、catalog 与生产路由状态不一致。
- **结论**：**现在收口，但去重共享模块；不建议再开第七门同型产品课。**

#### C. RAG / LLM Application Engineering — **部署现有 route，并合并 S04 + S05**

- **目标受众**：完成 How to Write Prompts 或 Agentic Engineering、具备基础 Python/TypeScript 的开发者与研究工程师。
- **先修**：prompt contract、JSON/structured output、API 调用、基础测试。
- **已有资产**：当前可路由 RAG 已有 12 lessons / 780 分钟、34 concepts、40 sources、5 authentic UI figures、12 questions 与 production capstone；知识、资产、9 个 content locale 与 assessment 合同在冻结副本的 release checker 全部通过。[S04](<../course_review_2026-08-23/original/S04_LLM 应用、评估、可观测与安全_V3.0_吴恩达学习法与企业能力修订版.docx>)补 versioned eval、盲评、回归、online signals、red team 与 cost/latency；[S05](<../course_review_2026-08-23/original/S05_RAG、工具与确定性工作流_V3.0_吴恩达学习法与企业能力修订版.docx>)补 hybrid retrieval、reranking、分层指标、权限、补偿与恢复。
- **还需动作**：把已通过的 RAG gate 保留在根总门，修复全局 Handbook/TypeScript 阻断后再部署；随后对 S04/S05 做逐模块差异表，只合并缺失主题；验证 `Recall@K`、`nDCG`、citation/groundedness、成本/延迟和 failure recovery 的真实执行结果，并避免把 12-lesson route 与 15 个 DOCX 模块重复发布。
- **原创 capstone**：构建“可争议、可追溯的研究证据助手”，交付 source manifest、retrieval index、question set、citation precision/recall 检查、answer groundedness、failure ledger、成本/延迟 dashboard 和 rollback runbook。
- **衔接**：Prompts 提供规格；Agentic/S06/S08 提供 tools 与 orchestration；S04/S05 提供 retrieval、evaluation 与 application production layer。
- **与 Andrew 课程的差异**：不复刻 LangChain 或 Text Embeddings notebook；采用 provider-neutral interfaces、原始数据、可替换 retriever/reranker、明确 provenance 和可重复评价。
- **维护风险**：中等；框架 API 变化快，课程应以概念接口和小型 reference implementation 为主。
- **结论**：**现在发布并增量合并，不是第一门新增课。**

#### D. Software Engineering、MCP 与两门商业化课 — **三门通过；MCP 修 release debt**

- **目标受众**：Software Engineering/MCP 面向开发者和技术团队；Codex/Claude 商业化课面向能独立审查交付质量的 freelancer、consultant、operator 与 founder。
- **先修**：产品工具基本操作、Git/测试与权限意识；商业化课还要求领域判断与客户交付能力。
- **已有核心**：Software Engineering 的 18 lessons 覆盖软件生命周期与 agent evaluation；MCP 的 18 lessons / 48 concepts / 71 sources 覆盖协议、capabilities、auth、安全和跨 host；两门商业化课各 12 lessons，覆盖 demand、offer、pricing、pilot、delivery、proof 与 stop/no-go decision。Software Engineering 与两门商业化课的专用 gate 通过；MCP 因 12 个 accessed date、figure rights/manifest/upstream records 和 7-test fixture 等共 19 errors 失败，但内容仍是完整草案。
- **原创 capstone**：三类课程已分别设计 safe-change dossier、MCP evidence pack 与可证伪商业化试验；应保留不同成果，不把它们拼成一个巨型 capstone。
- **衔接与去重**：S00–S03/S07/S10 提供共享工程底座；Codex/Claude 只保留产品差异实验，商业判断抽成 provider-neutral core；MCP 作为 tools/protocol 深化，不重复 Agentic 入门。
- **与 Andrew 课程的差异**：强调可审计软件交付、协议级信任边界、真实成本与“不做/停止”证据，而非复制 Build with Andrew 或 Agentic AI 的课堂资产。
- **维护风险**：高；产品 UI、MCP 规范、平台政策、source URLs 与图片许可都持续变化。
- **结论**：**现在把 Software Engineering 与 MCP 的专用 gate additive 地接入根 release pipeline；先修 MCP 19 errors，再与两门商业化课按最终 checker 状态做浏览器、生产 URL 与部署验收。不要把专用 PASS 写成已上线。**

#### E. AI Tutor、Product Management、Agent Orchestration — **发布现有完整草案，不另开同名新课**

- **目标受众**：AI Tutor 面向教师、教学设计者和教育 AI builder；Product Management 面向 PM、组织负责人和 founder；Agent Orchestration 面向已有 LLM/tool 基础的工程师。
- **已有核心**：三门分别有 8 / 14 / 15 个模块、450 / 910 / 1,060 分钟、来源登记、assessment、capstone 与通过的专用 release gate；Agent Orchestration 还通过 i18n/fallback、progress 及 684 个 lab case。
- **原创 capstone**：AI Tutor 的 8-artifact tutoring system dossier；Product Management 的 14-artifact product operating pack；Agent Orchestration 的可观测、可恢复 production orchestration pack。三者应保留独立成果合同。
- **衔接与去重**：AI Tutor 已替代旧 AI Teaching 标题占位的教学设计主干；Product Management 已覆盖原拟新增 AI Strategy/Product 主干；Agent Orchestration 吸收 S06/S08 的编排主题。只合并遗漏，不重复计算。
- **与 Andrew 课程的差异**：三门分别把学习成效与教师权责、证据化产品决策、可恢复多智能体生产合同做成可验收交付，而不是复制 DLAI 的讲义或 lab。
- **维护风险**：中等至高；教育政策、供应商接口、平台能力与评价基准都需版本化。
- **结论**：**现在进入总门、浏览器与生产部署；以后只补学校/组织层、行业 portfolio 或高级编排的残余内容。**

### 9.2 真正新建或实质补课

#### 1. Machine Learning Foundations — **第一门真正新增主课**

- **目标受众**：会基本编程但没有系统 ML 训练经验的软件工程师、研究生、教师与数据工作者。
- **先修**：Python、NumPy/Pandas、函数、基础代数与概率；缺先修者走桥接单元。
- **核心模块**：train/validation/test；linear/logistic regression；loss 与 gradient；regularization；trees/ensembles；clustering；anomaly detection；recommenders；feature/data leakage；bias/variance；class imbalance；metrics、calibration 与 error analysis；可复现实验。
- **原创 capstone**：使用公开教育数据构建“学生支持风险模型”，要求 model card、data split contract、baseline、subgroup error audit、calibration、ablation、failure analysis 与不部署条件；不得把预测变成自动处分。
- **衔接**：为 DL、MLOps、Responsible AI、教育研究评估提供共同先修。
- **与 Andrew 课程的差异**：不复制 MLS labs；突出 scikit-learn pipeline、数据泄漏、可复现性、教育场景的公平与人类审查。
- **维护风险**：低至中；核心概念稳定，数据与库版本可锁定。
- **结论**：**最大知识缺口；在 S01 Python 桥接可用后立即立项。**

#### 2. Deep Learning and Transformers — **ML Foundations 后做**

- **目标受众**：完成 ML Foundations、熟悉 Python/NumPy 与基本线代的学习者。
- **先修**：监督学习、梯度、矩阵运算、bias/variance、模型评价。
- **核心模块**：computational graph、backprop；initialization/normalization/regularization；SGD/Adam；CNN 与 transfer learning；RNN/LSTM；attention；Transformer encoder/decoder；tokenization；pretraining 与 fine-tuning 概念；参数高效适配；evaluation 与 robustness。
- **原创 capstone**：在小型开放数据集上训练、比较并记录一个文本或视觉模型；提交 training card、energy/cost log、error slices、ablation、reproducible seed/environment 与模型限制。
- **衔接**：把“使用模型”升级为“理解与训练模型”，为 multimodal、LLM customization 和 MLOps 提供先修。
- **与 Andrew 课程的差异**：采用原创代码与数据，强调现代 Transformer、可复现训练、资源预算和模型责任，而非重做 DLS 作业。
- **维护风险**：高；框架、硬件与模型生态变化快，需要固定轻量基线和定期复验。
- **结论**：**以后做，但应在 ML 之后列入主干。**

#### 3. Production AI / MLOps — **扩展 S07，而非从零开工**

- **目标受众**：完成 ML Foundations 或 LLM Application Engineering 的工程师与技术负责人。
- **先修**：模型评估、Git/CI、容器/API、基础云部署；不同轨道分别支持 predictive ML 与 LLM application。
- **核心模块**：data/training pipeline；dataset/model versioning；experiment tracking；registry；serving；batch/online inference；shadow/canary；monitoring；data/concept drift；continuous evaluation；incident response；rollback；cost/performance；governance evidence。
- **原创 capstone**：部署一个公开数据模型和一个 RAG service，制造数据漂移/检索退化事件，要求 alert、runbook、root-cause analysis、rollback 与 postmortem。
- **衔接**：复用 [S07](<../course_review_2026-08-23/original/S07_内容驱动增长平台与生产工程_V3.0_吴恩达学习法与企业能力修订版.docx>)已有的 contracts、lineage、release、observability、incident、rollback、cost 与 PRR，也复用 GitHub/Codex 的软件交付能力；新增 ML-specific artifacts 与 online metrics。
- **与 Andrew 课程的差异**：不复制旧 MLEP notebooks；把 predictive ML 与 LLMOps 放入同一可观测、可回滚、证据化生产合同。
- **维护风险**：高；云服务和框架变化快，应采用本地容器 + provider-neutral adapter。
- **结论**：**S07 的通用生产工程现在可整理复用；完整 MLOps 等 ML 主干形成后补齐，不能用 cloud/automation 或 S07 单独冒充。**

#### 4. Responsible AI and Human Oversight — **现在整合底稿并横向嵌入**

- **目标受众**：所有 AI builder、教育/研究从业者、产品与组织负责人。
- **先修**：可在 AI literacy 后入门；技术审计单元需 ML evaluation 基础。
- **核心模块**：risk taxonomy；privacy/data minimization；fairness 与 subgroup audit；explainability；model/data/system cards；impact assessment；accountability/RACI；human-in/on-the-loop；escalation 与 appeal；安全测试；法规映射方法；incident disclosure。
- **原创 capstone**：为教育、招聘或研究辅助系统完成 impact assessment、stakeholder map、failure scenarios、fairness/privacy test、human override、申诉通道、red-team evidence 与 go/no-go memo。
- **衔接**：复用产品课及 S00/S04/S05/S07/S08 的 privacy、permission、red team、prompt injection、独立 verifier、人工批准、升级与停止材料；成为 ML、LLM App、MLOps、Multimodal 的共用验收 rubric。
- **与 Andrew 课程的差异**：从一般社会影响扩展到可执行治理证据、升级机制、contestability 与 human factors。
- **维护风险**：中等偏高；法规会变化，核心课应讲风险治理方法，地区法规放入版本化附录。
- **结论**：**现在把跨册实质材料整合成底稿，并补齐 fairness、explainability、governance、accountability 与 appeal；站点占位不能算完成。**

### 9.3 桥接与后续差异化扩展

#### AI Python/Jupyter & Data Foundations — **现在做为桥接课或 ML 的 Unit 0**

- **目标受众**：零至初级编程者、研究生、教师、知识工作者，以及准备进入 ML Foundations 的学习者。
- **先修**：无；有文件系统与基本命令行经验更佳。
- **核心模块**：S01 的执行模型/函数/状态/测试；Jupyter；NumPy/Pandas；tidy/clean data；描述统计与抽样直觉；可视化；文件/API；environment、seed 与 reproducible notebook。
- **原创 capstone**：制作一份教育数据审计 notebook，交付 data dictionary、清洗日志、缺失值决策、统计假设、可视化、provenance、可重复环境和边界说明。
- **衔接**：复用 S01 的 9 模块可测试 Python 与 S03 的数据/API 基础；成为 ML Foundations 的 Unit 0，并为 RAG 数据摄取与研究课提供先修。
- **与 Andrew 课程的差异**：不复制 AI Python labs；把可测试程序、统计推理、数据 provenance 与研究可复现性放在同一桥接课，而不是只学“用 Python 调 LLM”。
- **维护风险**：低至中；固定 Python/Pandas 版本和小型开放数据即可控制。
- **结论**：**现在做；资源有限时先作为 ML 的必修 Unit 0，以后再拆成独立零基础课。**

#### Multimodal & Domain AI — **后置**

- **目标受众**：完成 Python/ML 或 LLM Application Engineering、希望处理图像、音频、视频与混合文档的 builder 和领域研究者。
- **先修**：Python/Data；技术轨需 ML/DL，应用轨至少需 embeddings、RAG 与 evaluation。
- **核心模块**：vision 与 speech/audio 基础；video understanding；multimodal embeddings；OCR/layout；multimodal RAG；modality-specific evaluation；accessibility；copyright/licensing；provenance 与 human review。
- **原创 capstone**：使用授权的教育或研究数据构建一个多模态证据系统，报告各 modality error slices、retrieval/answer 指标、accessibility、版权清单、成本与人工复核。
- **衔接**：Grok Imagine、Claude artifacts、RAG image lesson 和 S06 素材流水线可作产品工作流案例；DL 课程提供建模先修。
- **与 Andrew 课程的差异**：不重做 DLS CNN 作业或多媒体 prompting 示例；以授权数据、multimodal retrieval、证据回指和真实错误分析为中心。
- **维护风险**：高；模型、媒体 API、版权政策和算力成本变化快。
- **结论**：**以后做；在 ML/DL 与 RAG 主干稳定前不建议独立立项。**

#### AI for Evidence-Grounded Research — **以后做成独立方法课**

- **目标受众**：研究生、教师、研究助理、policy analyst 与 systematic reviewer。
- **先修**：AI literacy、基本检索与引用；技术 studio 建议先修 RAG。
- **核心模块**：问题分解、检索策略、证据层级、screening、claim-source ledger、引用核验、PDF/表格边界、RAG locator、数据/代码可复现、uncertainty、human review。
- **原创 capstone**：完成一个可审计 mini review，提交 protocol、search log、inclusion ledger、claim-evidence matrix、复现包、引用审计、排除项与失败日志。
- **衔接**：复用 RAG、Claude research、Grok verify、GitHub reproducibility 与现有来源合同；替代目前只有标题的站点占位。
- **与 Andrew 课程的差异**：Andrew 的 Jupyter/Prompting 提供工具工作流，本课聚焦研究方法、证据边界、可复现与学术责任。
- **维护风险**：中等；数据库界面与模型变化快，但 protocol 与证据合同稳定。
- **结论**：**以后做，属于品牌差异化重点；不建议只把产品 research 功能重新包装成课程。**

#### AI for Knowledge Work — **以后整合为 provider-neutral 项目课**

- **目标受众**：行政、运营、分析、写作、咨询与非技术知识工作者。
- **先修**：How to Write Prompts 或等价 task-contract 基础。
- **核心模块**：document、spreadsheet、presentation、research、versioning、review/approval、automation boundaries、privacy、source trace、handoff 与 maintenance。
- **原创 capstone**：交付一套可编辑文档/表格/演示组合，附来源、公式、假设、版本、审批、QA、权限和回滚记录。
- **衔接**：抽取 Claude/Codex/Grok 的 office/research/writing 共通能力；复用 Prompts、GitHub versioning 与 Responsible AI，不重复产品 UI 导览。
- **与 Andrew 课程的差异**：Andrew 的 AI Prompting 展示广泛用途，本课要求 provider-neutral、可编辑、可审批、可维护的真实工作交付包。
- **维护风险**：中等；应把产品 UI 放可替换 lab，将文档质量与审计合同留在稳定核心。
- **结论**：**以后做；先去重现有产品课，避免把同一 office workflow 按品牌重复发布。**

## 十、最终建议

### 现在做

1. 在冻结 commit 上把 Prompts、Software Engineering 与 MCP 的专用 gate additive 地接入根 release pipeline；RAG 已在总门内。修复 MCP 19 errors、Claude test TypeScript error、Handbook ko/ar 缺键，并保留 Codex、Cursor、Claude 的图片/发布权阻断。
2. 对冻结副本专用/复合 gate 已通过的 How to Write Prompts、GitHub、Grok、Software Engineering、RAG、两门商业化课、AI Tutor、Product Management 和 Agent Orchestration 做浏览器、生产 URL 与部署验收；只有生产可访问后才改称“已上线”。
3. 按模块 diff 合并 S00–S10：S04/S05 → RAG，S06/S08 → Agent Orchestration，S07 → Product Management/MLOps，S09/S10 → Prompts/GitHub；先把已有通用来源清单升级为逐 claim、带访问日期和权利边界的来源合同，再补可运行 fixture 与 release audit。
4. 用 S01 + S03 形成 AI Python/Jupyter & Data 桥接层，同时把 Machine Learning Foundations 作为第一门真正新增主课立项。
5. 把 Product Management、AI Tutor、Agent Orchestration 与 S00/S04/S05/S07/S08 的 fairness、安全、治理、appeal 和 human-gate 证据升级为 Responsible AI 横向 rubric，并补齐独立主线。

### 以后做

1. Deep Learning and Transformers；
2. 在 S07 上补齐 ML-specific lifecycle，形成完整 Production AI / MLOps；
3. Multimodal & Domain AI；
4. 独立的 AI for Evidence-Grounded Research 与 provider-neutral 知识生产项目课；
5. Product Management 与 AI Tutor 只做组织转型、学校治理和实证研究扩展，不重复建设基础主干。

### 不建议做

1. 不再从零复制 Andrew/Isa 的基础提示工程课程；
2. 不把 Codex、Cursor、Claude、Grok 的相同 workflow 各算成一种新能力；
3. 不把普通 context/search 产品课重命名为 RAG；S05 必须以实际检索、排序、分层指标和 grounding 验收后才能发布为 RAG 主干；
4. 不把 CI/cloud automation 或通用 S07 production engineering 重命名为完整 MLOps；
5. 不复制或再托管 DeepLearning.AI 的 notebook、quiz、作业答案、视频、transcript、截图或无明确许可的课程资产；
6. 不用 GitHub 标题、star 数或 logo 推断官方性。

## 十一、局限与复核提示

- DeepLearning.AI 的目录、课程类型、时长、证书与访问方式可能继续变化；本报告确认的是 2026-08-24 重新抓取快照，文件名的 `2026-08-23` 只保留原任务约定。
- `no_verified_public_repo` 来自对当前中央 companion 组织 `https-deeplearning-ai` 的 34 个公开仓库、中央 hub、课程页与官方社区的有限复核；它没有穷尽其他 first-party owner、私有/删除历史或 GitHub 全网，也没有建立所有社区搜索结果清单。
- sitemap 的 127 个 canonical 页面已全量解析；provenance 同时记录原始 sitemap 哈希、14 项纳入清单哈希和 113 项逐页排除账本。该账本只证明快照日 hero `Instructor(s)` 字段未列 Andrew Ng，不应用来推断课程质量或历史参与关系。
- aicourse 工作树在审计期间持续变化；本报告的本地事实严格对应 **2026-08-24 12:34:38 +0800** 的隔离输入快照 `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d`，而不是交付瞬间继续变化的 live worktree。该 hash-bound `/tmp` 副本用于本轮一致性验收，没有作为 67 MB 可分发源码 archive 持久化；哈希可识别差异但不能独自还原 dirty bytes。后续发布决策仍应在一个冻结 commit 或保留副本上重跑所有 checker、TypeScript、build、route、浏览器与生产 URL 审计。
- 本报告比较的是知识与能力覆盖，不比较课程销量、完成率、教学成效或学习者满意度，因为本轮没有取得可核验、可比的结果数据。
- 所有课程建议均为原创教学设计方向；只复用公开知识主题，不复用受版权或平台条款约束的课程表达与资产。
