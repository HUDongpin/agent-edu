# Provenance — Andrew Ng AI 课程全量盘点与 aicourse 缺口分析

**Andrew Ng / DeepLearning.AI 资料复核日：2026-08-24**  
**aicourse 冻结输入快照日：2026-08-24**  
**时区：Asia/Taipei**  
**对应主报告：** [andrew-ng-ai-courses-vs-aicourse-2026-08-23.md](./andrew-ng-ai-courses-vs-aicourse-2026-08-23.md)  
**对应数据表：** [andrew-ng-ai-course-inventory-2026-08-23.csv](./andrew-ng-ai-course-inventory-2026-08-23.csv)

本文件记录主报告和 CSV 的来源链、字段支持范围、归一化规则、GitHub 官方性判断、排除理由、访问状态、工作树快照和不确定性。它不是课程内容镜像，也不包含 DeepLearning.AI 的 notebook、quiz、答案、视频、transcript、截图或专有 prompt。

## 1. 审计身份与工作树快照

| 字段 | 值 |
|---|---|
| 审计日期 | 2026-08-24（文件名保留原任务约定的 `2026-08-23`） |
| 定稿课程输入快照 | `2026-08-24 12:34:38 +0800` |
| 定稿 Git 状态记录时间 | `2026-08-24 12:34:38 +0800` |
| Git HEAD | `0f4246ab19a0b4f987f45a50ec6a3b2e7eac14bd` |
| 工作树 | dirty；冻结时 `156` 个 status entries；不把未提交状态视为 release 证据 |
| 定稿相关输入 | `967` 个文件，`67,000,383` bytes |
| 定稿相关输入指纹 | `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d` |
| 定稿 `git status --porcelain=v1` 哈希 | `a9b559e36bdf406be6e25905f2c13d66cea21b1e94d0496fca54cf465df29799` |
| 临时隔离副本 | `/tmp/aicourse-gap-final.mNc6Ah/workspace`；仅作本轮验收载体，未把 67 MB 输入字节另行打包为第四份交付物 |
| 指纹覆盖范围 | 根级 `AGENTS.md`、`README.md`、`package*.json`、`tsconfig.json`、`next.config.ts`、`vercel.json`、`i18n-exceptions.json`；`lib`、`app`、`components`、`messages`、`scripts`、`tests`、`public`、`legacy/course-python`；`examples/{codex-course-demo,cursor-course-demo,mcp-courseops}`；`course_review_2026-08-23/{original,analysis/corpus}`；`outputs` 中除本报告、CSV 与本 provenance 外的 release-support artifacts。排除 `node_modules`、`.next`、`out`、`tmp`、reports/test-results |
| 主报告 SHA-256 | `06242e3dad3892df7fefd23f442beed8f2f85f0a2bc136690d7f1b132e4460e3` |
| CSV SHA-256 | `60aefb0d17ac91564180b4dc4db88898a4e6afa42ea23cdf918899fa2237b86a` |

审计期间工作树持续变化，因此本报告没有沿用 2026-08-23 的旧盘点。定稿将上述范围复制到临时验收副本；源目录复制前、复制后、副本及 checker 运行后的聚合 SHA-256 四次均为 `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d`。聚合算法是：按相对路径字节序排序每个纳入文件，为每个文件计算 SHA-256，再对逐行的 `<file-sha256><two spaces><relative-path>` 清单计算 SHA-256；目标三份报告被排除，以避免自引用。用于运行 checker 的 `node_modules` symlink 在指纹完成后才加入副本，不属于课程输入。全部专用 checker、TypeScript 与根 build 终验只在这个副本运行；后续 live worktree 漂移不回写为报告事实。输出目录以外的改动均视为用户或其他工作流所有，本轮没有修改。

这是一个 **hash-bound、临时隔离的审计快照**，不是可分发的源码重建包：聚合哈希可以在原文件或保留副本仍存在时检测任何字节差异，但哈希本身不能在 `/tmp` 被清理后还原 dirty worktree 的 67 MB 内容。下表把 manifest、Git 状态和 checker logs 的文件名、字节数与 SHA-256 固化在长期交付物中；若需要永久逐字节重放，应在冻结 commit/保留副本上重跑，或另行授权保存完整 archive。本轮按原交付合同只生成三份报告文件，没有额外复制整个仓库。

| 临时审计工件 | bytes | SHA-256 |
|---|---:|---|
| `input-files.txt` | 41,234 | `3ab6761a73bb09ec68a5003dd89389c03bb08ae3c29638b8612b8a1a1157c01a` |
| `pre.manifest` | 105,056 | `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d` |
| `post.manifest` | 105,056 | `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d` |
| `snapshot.manifest` | 105,056 | `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d` |
| `after-checkers.manifest` | 105,056 | `f33e747d22e4f4036793515d6c506fcd8dda8f20acfe0bf1acbd509c2cb10a9d` |
| `git-status.txt` | 4,209 | `a9b559e36bdf406be6e25905f2c13d66cea21b1e94d0496fca54cf465df29799` |
| `agent_orchestration.log` | 1,413 | `e12e041bba35515e0e552dd950035b8e9a486ceec75fae69e226fd9a5f8645be` |
| `ai_tutor.log` | 394 | `8086670557ddacb5a46c3ee0a89bc7d1ad1301ca842c44f8f04fcda87bdff707` |
| `build_release.log` | 1,297 | `bbf94a108e5129fff5fee40285299a679981ffbeaeff2d4406d1c8caa045fa6c` |
| `claude.log` | 960 | `4f92c446f13852e168db7baed3ae082d08783ead650088992856c2f9c26fbab0` |
| `claude_income.log` | 423 | `983eeaa8e2619e874895b0e9f28eda13ed66e2e4826c8eb516e7285f54cb8911` |
| `codex.log` | 1,429 | `07803517db3a5444be6beb3bdf385c9e3e6cd212daec0d0a9a02922bf2af7c48` |
| `cursor.log` | 1,270 | `62be3f5afdc818a9b7c5f216f6d561aafbc4b7ee3b62289fc97727bd4872c5d6` |
| `github.log` | 289 | `c49020a29a8d4dc52d13b68a05b59b90fcaa67ad983686997814a46e28744826` |
| `grok.log` | 165 | `8b2a1d8d2d608bdfde5ab8d074e249fd1df84ba39565f9ee5d24ecc85d8aa82c` |
| `mcp.log` | 2,166 | `bf1dd056f3bbcfff19e436f1bc0b27f99c7c297fc5e3b71fb88038b2e680c794` |
| `money_codex.log` | 373 | `8c8d83fe5901dc7468e62af814f990a08f7215efc4f423c758dd216a29f6ec80` |
| `product_management.log` | 381 | `84a5d2dba09f6cc8bda41acb26ced58697f0fccc15ef8a95e4964c8362354a5c` |
| `prompts.log` | 109 | `62ced0ed37531dcee6f8a62e0bcecb6c0824499d5af3b05012a2c56fe135029a` |
| `rag.log` | 640 | `56e60b8a6378cef3ace2a2cae7b926e3149c58ce3e567f0a7370dd256e1b0e80` |
| `software.log` | 119 | `15e82427d0eb0bcf2c718634ff371ed1871a21f7d5dc422e384a3dba4b2d620d` |
| `tsc.log` | 182 | `5a597e3efedb84899df402e17733f34182ce5140e4df49612896159623f77346` |

## 2. 统计口径与归一化规则

### 2.1 核心纳入合同

1. 以 [DeepLearning.AI 课程目录](https://www.deeplearning.ai/courses)和[官方 sitemap](https://www.deeplearning.ai/sitemap.xml)为当前产品全集入口。Chromium 于 2026-08-24 12:00:56 +0800 取得 HTTP 200 的 sitemap 原文：480,166 bytes、3,340 个 `<loc>`、SHA-256 `fa2b23373c9be6a641d86c3c4afc098f60aded9fc1711cfe4ba295380d3ed1f1`。
2. 从该原文抽出 117 个 `/courses/` 与 10 个 `/specializations/` canonical 页面，共 127 页；127/127 均完成解析。按严格讲师规则筛得的 14 个完整 canonical URL 按字节序排序、以 LF 连接且末尾无换行后的 SHA-256 为 `7a49459c7469ea09047f45e75a8f2150dfcedae415e467da403a2be566cba9d5`；14 页均 HTTP 200 且 self-canonical。该值不是纯 slug 清单哈希。
3. 只有页面正式 `Instructor(s)` 或明确的 program creator/instructor 字段列出 Andrew Ng 的项目，才能进入 `current_product`。
4. Andrew 作为推荐者、采访对象、guest expert、欢迎视频嘉宾或 collection 策展人，不满足纳入条件。
5. 旧 `/short-courses/`、`/alpha/`、语言版本、学习平台镜像、追踪参数 URL 与 canonical 页面归一为同一产品。
6. 两个专项产品保留产品包装层，同时将其 3 + 5 个子课程展开到 `current_child_course`；子课只计一次。
7. 当前产品数和课程单元数分别报告：`14 products` 与 `20 unique course units`。

本交付物记录 sitemap 原文哈希、解析数量、纳入清单哈希与 14 个纳入页的逐项证据，并在文末附上其余 113 页的 hero `Instructor(s)` 字段排除账本。因此 `127 = 14 纳入 + 113 排除` 可逐项复核；14 项 URL 清单哈希与 113 项排除 TSV 哈希仍是两个不同工件，不能混称。

### 2.2 可核对公式

```text
14 current products = 7 Course + 5 Short Course + 2 Specialization/Professional Certificate
20 unique units      = 12 standalone course products + 3 MLS children + 5 DLS children
22 current CSV rows  = 14 product rows + 8 child rows
28 total CSV rows    = 22 current rows + 5 legacy rows + 1 grey-area row
```

### 2.3 CSV 枚举

- `scope_group`: `current_product`, `current_child_course`, `legacy`, `grey_area`
- `product_type`: `course`, `short_course`, `professional_certificate_specialization`, `child_course`, `legacy_course`, `legacy_specialization`, `stanford_course`, `external_guest_course`
- `repo_class` 研究枚举：`official_companion`, `official_companion_component`, `official_historical_companion`, `official_adjacent_tool`, `community_notes`, `community_labs`, `community_solutions`, `no_verified_public_repo`, `unavailable_or_private`。CSV 的课程行只使用其中实际适用的前述子集；代表性社区噪声只列在 provenance，不扩成“所有社区仓库”清单。

`no_verified_public_repo` 表示在本轮的官方组织、中央索引、课程页和官方社区核验范围内没有找到满足证据门槛的公开 repo。它不表示“已证明世界上绝对不存在”。`unavailable_or_private` 用于曾有 first-party 线索、但快照时无法公开访问的地址。

## 3. DeepLearning.AI 当前 14 个产品的逐项来源

所有下列 canonical 页面在 2026-08-24 重新检查时返回 HTTP 200、自指 canonical，并仍出现在官方 sitemap。支持字段包括页面可见标题、课程类型/页面模板、正式讲师、level、duration、skills/outline、prerequisites/audience 与访问状态。`duration_snapshot` 是页面快照值，可能变化。

| canonical slug | 官方 URL | 支持的主要字段 | instructor 证据与归一化说明 | 不确定性 |
|---|---|---|---|---|
| `agentic-ai` | [Agentic AI](https://www.deeplearning.ai/courses/agentic-ai) | title, type, instructor, level, 9h55m, audience, outline | 结构化讲师为 Andrew Ng；canonical 自洽 | 课程内容与 GitHub component 的完整 parity 未声明 |
| `ai-for-everyone` | [AI for Everyone](https://www.deeplearning.ai/courses/ai-for-everyone) | title, type, instructor, level, 6h54m, audience, outline | 结构化讲师为 Andrew Ng | 时长/平台访问形式可能变化 |
| `ai-prompting-for-everyone` | [AI Prompting for Everyone](https://www.deeplearning.ai/courses/ai-prompting-for-everyone) | title, type, instructor, level, 7h4m, audience, outline | 结构化讲师为 Andrew Ng | 页面是新版本课程；不将其他 prompt 短课合并进去 |
| `ai-python-for-beginners` | [AI Python for Beginners](https://www.deeplearning.ai/courses/ai-python-for-beginners) | title, type, instructor, level, 11h30m, audience, outline | 结构化讲师为 Andrew Ng | 旧 `aisetup` helper 的当前状态不代表课程状态 |
| `build-with-andrew` | [Build with Andrew](https://www.deeplearning.ai/courses/build-with-andrew) | title, type, instructor, level, 1h, audience, outline | 结构化讲师为 Andrew Ng | GitHub repo 当前可核验的是 first-party course-specific README 与 7 张图片；README 所述 6 个 HTML 和 PDF 当前缺失，详见 5.2；不等于视频或完整课程 |
| `generative-ai-for-everyone` | [Generative AI for Everyone](https://www.deeplearning.ai/courses/generative-ai-for-everyone) | title, type, instructor, level, 5h1m, audience, outline | 结构化讲师为 Andrew Ng；live H1 末尾的不可见 U+3164 已在 CSV 标题中剔除 | 只做展示文本规范化；价格、证书和注册方式未做永久性陈述 |
| `machine-learning-in-production` | [Machine Learning in Production](https://www.deeplearning.ai/courses/machine-learning-in-production) | title, type, instructor, level, 10h59m, prerequisites, outline | 当前 standalone canonical；讲师 Andrew Ng | 旧 MLEP repo 与现单课逐项 parity 未核验 |
| `chatgpt-building-system` | [Building Systems with the ChatGPT API](https://www.deeplearning.ai/courses/chatgpt-building-system) | title, short-course type, instructors, 1h55m, audience, outline | 共同讲师 Isa Fulford、Andrew Ng；旧 short-course 路径归一到当前 canonical | 未发现满足门槛的 current public companion |
| `chatgpt-prompt-eng` | [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/courses/chatgpt-prompt-eng) | title, short-course type, instructors, 1h40m, audience, outline | 共同讲师 Isa Fulford、Andrew Ng；语言/字幕镜像不另计 | 大量 community notebook/solution 不是官方来源 |
| `google-cloud-vertex-ai` | [Understanding and Applying Text Embeddings](https://www.deeplearning.ai/courses/google-cloud-vertex-ai) | current title, instructors, level, 1h44m, audience, outline | 共同讲师 Nikita Namjoshi、Andrew Ng；保留 canonical slug，即使 slug 与现标题不同 | slug 是历史命名，不能据 slug 重造另一门课 |
| `jupyter-ai-coding-in-notebooks` | [Jupyter AI: AI Coding in Notebooks](https://www.deeplearning.ai/courses/jupyter-ai-coding-in-notebooks) | title, instructors, level, 1h14m, audience, outline | 共同讲师 Andrew Ng、Brian Granger | companion repo 未发现明确开放许可证 |
| `langchain` | [LangChain for LLM Application Development](https://www.deeplearning.ai/courses/langchain) | title, instructors, level, 1h48m, audience, outline | 共同讲师 Harrison Chase、Andrew Ng；旧 short-course path 归一 | 不把 LangChain Chat with Your Data 等相邻课并入本课程 |
| `deep-learning` | [Deep Learning Specialization](https://www.deeplearning.ai/specializations/deep-learning) | title, program type, instructor/creators, intermediate, 127h29m, prerequisites, five-course outline | Andrew Ng 为 program instructor；与 Kian Katanforoosh、Younes Bensouda Mourri 创建 | 父项目是容器；五门 child 只各计一次 |
| `machine-learning` | [Machine Learning Specialization](https://www.deeplearning.ai/specializations/machine-learning) | title, program type, instructor/creators, beginner, 94h58m, prerequisites, three-course outline | Andrew Ng 为 program instructor；与 Eddy Shyu、Aarti Bagul、Geoff Ladwig 创建 | live 页面值 94h58m 优先于搜索缓存旧值 94h47m |

## 4. 专项课程 8 个子单元的逐项来源

下列 Coursera canonical 页面在 2026-08-24 均可访问。CSV 中 `duration_snapshot` 保存各子课页当日显示的周数/估计小时；这些是学习平台估计值，不能与父项目的 94h58m/127h29m 再相加。标题、单元身份、讲师、等级与 skills 由子课页和父项目 outline 互证。MLS 三门在 CSV 明列 Andrew Ng 与 Aarti Bagul、Geoff Ladwig、Eddy Shyu；DLS 五门明列 Andrew Ng 与 Kian Katanforoosh、Younes Bensouda Mourri，避免把 Andrew 误写成唯一讲师。

| 父项目 | 子课程 canonical URL | 支持字段 | 去重说明 |
|---|---|---|---|
| MLS | [Supervised Machine Learning: Regression and Classification](https://www.coursera.org/learn/machine-learning) | title, Andrew instructor, regression/classification/gradient/regularization | slug 与原 2012 总课名称相似，但当前是新版 MLS 第一单元 |
| MLS | [Advanced Learning Algorithms](https://www.coursera.org/learn/advanced-learning-algorithms) | title, Andrew instructor, neural nets/trees/bias-variance | 只在 MLS 下计一次 |
| MLS | [Unsupervised Learning, Recommenders, Reinforcement Learning](https://www.coursera.org/learn/unsupervised-learning-recommenders-reinforcement-learning) | title, Andrew instructor, clustering/anomaly/recommenders/PCA/RL | 只在 MLS 下计一次 |
| DLS | [Neural Networks and Deep Learning](https://www.coursera.org/learn/neural-networks-deep-learning) | title, Andrew/course team, NN/backprop | 只在 DLS 下计一次 |
| DLS | [Improving Deep Neural Networks: Hyperparameter Tuning, Regularization and Optimization](https://www.coursera.org/learn/deep-neural-network) | title, Andrew/course team, regularization/optimization/TensorFlow | 只在 DLS 下计一次 |
| DLS | [Structuring Machine Learning Projects](https://www.coursera.org/learn/machine-learning-projects) | title, Andrew/course team, error analysis/transfer/multi-task | 可单独修读也不重复计数 |
| DLS | [Convolutional Neural Networks](https://www.coursera.org/learn/convolutional-neural-networks) | title, Andrew/course team, CNN/detection/segmentation | 只在 DLS 下计一次 |
| DLS | [Sequence Models](https://www.coursera.org/learn/nlp-sequence-models) | title, Andrew/course team, RNN/LSTM/attention/Transformers/speech | 只在 DLS 下计一次 |

## 5. GitHub provenance 与许可证检查

### 5.1 中央 first-party 索引

- 组织：[https-deeplearning-ai](https://github.com/https-deeplearning-ai)
- companion hub：[https-deeplearning-ai/deeplearning-ai](https://github.com/https-deeplearning-ai/deeplearning-ai)
- 2026-08-24 12:18 +0800 通过 GitHub API 枚举当前中央 companion 组织 `https-deeplearning-ai` 的 34 个公开 repo；下列 repo name 按 UTF-8 字节序排序、每行 LF 且保留末尾 LF 的清单 SHA-256 为 `1f6518678e0b8fff7e1c60497ebb1c10ff564256e871acbfd6266f70e051bf4d`。本轮逐项复查这 34 个 repo 的名称/README 线索，并对候选映射再做课程页、中央 hub 或社区互证。GitHub 另有与中央组织存在 fork/README 引用关系或具历史官方线索的 `deeplearningai-eng`、旧 `deeplearning-ai` 等 owner，也有 README 指向但当前不可公开访问、无法区分私有/删除/改名的地址；它们未新增当前 14 项的可核验 companion，但说明 34 只代表当前中央 companion 组织，不是所有可能 first-party owner、公开/私有或历史仓库的全集。
- 支持结论：中央 README 自称 “open-source companion repositories” 索引，同时明确其课程列表非穷举，视频和结构化教学仍在 DeepLearning.AI。当前表内只有 8 个 artifact entries，Andrew 核心产品中只有 Jupyter AI 在表中直接配对。FAQ 说 code 可作 educational use，并要求使用者查看每个 repo 自己的 `LICENSE`；因此集合级表述不足以确认一般修改/再发布范围，也不能推导 14 门课一课一 repo，具体 repo/资产的明确许可证优先。
- 官方性规则：先以组织归属或中央 hub 独立确认 owner 的 first-party 身份；再至少需要一项 course-specific provenance，例如中央索引配对、repo README 的明确课程声明、课程页链接或 staff-authored 课程说明。只有 first-party owner + course-specific README 时，证据弱于中央索引/课程页双向配对，必须披露；学习者论坛记录只作辅助线索。

```text
FRED-dashboard
GANs-Public
agentic-ai-public
aws-mwaa-local-runner
data-analyzer-agent
data-centric-comp
dcai-workshop
deeplearning-ai
email-classifier-ralph-test
fast-prototyping-of-genai-apps-with-streamlit
html-example
https-deeplearning-ai.github.io
lc-build-with-andrew-platform
machine-learning-engineering-for-production-public
movie-recommender-ralph-test-1
pydantic-student1-project
ragchatbot-codebase
sandbox-builder-demo
sc-agent-governance
sc-agent-skills-files
sc-ai-coding-workflows-files
sc-claude-code-files
sc-gc-c4-gemini-public
sc-gemini-cli-files
sc-jupyterAI-notebooks
sc-landingai
sc-spec-driven-development-files
simple-comparer
spec-build-lab
starting-ragchatbot-codebase
tensorflow-1-public
tensorflow-2-public
tensorflow-3-public
test-learner-pydantic-c1
```

### 5.2 当前可核验映射

| 课程 | Repo / 状态 | first-party 关系依据 | `repo_class` | 许可证核验 | 边界与不确定性 |
|---|---|---|---|---|---|
| Jupyter AI | [sc-jupyterAI-notebooks](https://github.com/https-deeplearning-ai/sc-jupyterAI-notebooks), public/200 | 中央索引把课程 URL 与 repo 配对；README 明确称 course notebooks | `official_companion` | 根 `LICENSE`, `LICENSE.md`, `LICENSE.txt`, `LICENCE`, `COPYING` 均未找到；中央 hub 只给集合级 educational-use 说明 | 可按 README 下载/访问作教育与个人非商业学习；未核验到一般修改或再发布授权 |
| Build with Andrew | [lc-build-with-andrew-platform](https://github.com/https-deeplearning-ai/lc-build-with-andrew-platform), public/200 | first-party owner；course-specific README 明确标题、About This Course 并描述示例 | `official_companion` | 未发现标准根许可证；中央 hub 的集合级表述和 README 的 educational-purpose 表述都不足以确认一般修改/再发布范围 | 未找到中央索引、课程页或 staff-authored 帖子的直接 pairing；当前 `main` recursive tree 只有 README 与 `img/` 下 7 张图片，README 所列 6 个 HTML 均不在 tree，所链 `Build__with_Andrew_V_11-20__1_.pdf` 返回 404。因此可确认配套身份，但不能称示例当前可下载或材料完整 |
| Agentic AI | [agentic-ai-public](https://github.com/https-deeplearning-ai/agentic-ai-public), public/200 | first-party owner；repo description 与 reflective research agent 内容对应；课程分类论坛中一名[学习者转述 lab 页面](https://community.deeplearning.ai/t/unable-to-find-open-in-jupyter-notebook-option-within-the-course-agentic-ai-module1/881895/3)称代码位于该 repo | `official_companion_component`；mapping confidence: medium | 未发现标准根许可证 | 论坛不是 staff-authored 声明；README 未出现当前 canonical 课程名，中央索引未直接配对；不能称完整课程 repo |
| Machine Learning in Production | [machine-learning-engineering-for-production-public](https://github.com/https-deeplearning-ai/machine-learning-engineering-for-production-public), public/200 | first-party README 明确为旧 MLEP 四课 public resources；[论坛记录](https://community.deeplearning.ai/t/mlops-c1w1-notebook-is-not-visible/111043)只显示学习者曾使用该 repo 运行历史 lab | `official_historical_companion` | repo 根目录为 [Apache License 2.0](https://github.com/https-deeplearning-ai/machine-learning-engineering-for-production-public/blob/main/LICENSE)；具体文件若有独立声明或第三方 NOTICE，以更具体条款为准 | 对旧 MLEP 的历史映射强；许可不外延到课程视频、页面或平台 lab；与当前 standalone 页面逐项 parity 未核验 |
| AI Python historical helper | `https://github.com/https-deeplearning-ai/aisetup`, unavailable/404 | URL 在快照日独立返回 404；[社区论坛用户 TMosh 的回复](https://community.deeplearning.ai/t/pypis-links-to-the-aisetup-homepage-and-github-repository-same-url-both-give-a-404-error/841225)只作辅助线索，不冒充 staff 声明 | 历史线索；若单独分类为 `unavailable_or_private` | 未核验 | 404 无法区分删除、改名、转私有或其他不可见状态；当前 AI Python 产品在 CSV 为 `no_verified_public_repo`，此 helper 不进入 current mapping |

其余 10 个当前产品在上述中央 companion 组织 34-repo 列表、中央 index、课程页和官方社区中都没有找到满足证据门槛的 current public companion，CSV 因而标为 `no_verified_public_repo`。这是明确范围内的反证检查，不是对其他 first-party owner、GitHub 全网、历史删除状态或私有仓库的不存在证明。组织中新出现的 `sc-ai-coding-workflows-files` README 对应 “AI Coding Workflows: From Cloud to Local”，但该课程正式讲师是 Paul Everitt，不是 Andrew Ng，故它也是对“组织 repo = Andrew 课程”的反例，不进入核心映射。

### 5.3 代表性非官方仓库与排除原因

| Repo | 排除分类 | 排除原因 |
|---|---|---|
| [amanchadha/coursera-deep-learning-specialization](https://github.com/amanchadha/coursera-deep-learning-specialization) | `community_solutions` | 个人 owner；README 自述含个人作业与课程来源内容，不是 first-party companion |
| [azminewasi/Machine-Learning-AndrewNg-DeepLearning.AI](https://github.com/azminewasi/Machine-Learning-AndrewNg-DeepLearning.AI) | `community_labs` | 个人证书和学习材料；课程名与 Andrew 姓名不能建立官方 provenance |
| [GitHubDaily/ChatGPT-Prompt-Engineering-for-Developers-in-Chinese](https://github.com/GitHubDaily/ChatGPT-Prompt-Engineering-for-Developers-in-Chinese) | `community_notes` | README 明示“非官方”；不能当成 DeepLearning.AI 授权中文版或官方 repo |

官方知识产权与学术诚信边界来源：

- [DeepLearning.AI Community Guidelines](https://community.deeplearning.ai/guidelines)：不得公开作业、quiz、exam solutions；应提交自己的工作；他人数字内容和课程资料受版权/许可约束。
- [关于公开上传 assignment 的官方社区答复](https://community.deeplearning.ai/t/regarding-uploading-course-assignments-on-github/402395)：公开上传作业违反政策，个人备份应放 private repo。
- [课程材料的负责任分享说明](https://community.deeplearning.ai/t/respecting-intellectual-property-how-to-share-deeplearning-ai-course-materials-responsibly/681787)：不能直接传播 quizzes、lectures、labs 等；课程启发的原创项目应标明学习来源。
- [DLS solution repo / honor code 讨论](https://community.deeplearning.ai/t/assert-consequence-of-breaking-honor-code-none/53573)：记录官方对公开课程代码和 quiz 仓库的处理立场。

许可证解释边界：Community Guidelines 对依 Creative Commons 许可用于教育的 lecture slides 留有例外，但指南本身没有为每项资产标出精确 CC 版本；使用者仍须回到目标文件核对具体许可、署名、修改与再发布条件。[DeepLearning.AI Terms of Use](https://www.deeplearning.ai/terms-of-use)是默认平台使用边界；若目标 repo/资产另有明确许可证，应按该许可证、第三方 NOTICE 与适用平台条款综合判断。本报告不从中央 hub 的集合级 “open-source” / “educational use” 措辞推定一般性的复制、修改、公开再发布或商业使用范围；公开可见、课程配套关系、个人教育访问和再发布权是四个不同问题。

[DeepLearning.AI Help Center](https://info.deeplearning.ai/knowledge-base/can-i-access-short-course-code-and-resources-outside-of-the-platform)的原文称 DeepLearning.AI 不公开分享其 Short Course GitHub repositories，同时说明学习者可从 workspace 下载 notebooks；该页面未定义这里的 “repositories” 是否特指完整课程 backend，也可能滞后于 2026 年中央组织已有公开 companion artifacts 的现状。**本报告据两类事实作出的推断**是：公开 notebook/component 可以存在，但不能据此推导完整平台 lab、backend、视频或全部教学资产均已开放。因此始终使用 `companion` / `component`，不把公开工件称为完整课程镜像。

## 6. 历史与灰区来源

| 项目 | 官方/第一方 URL | 支持的字段 | 关系与排除理由 |
|---|---|---|---|
| 2012 original Machine Learning MOOC | [DeepLearning.AI successor announcement](https://www.deeplearning.ai/blog/andrew-ng-machine-learning-specialization) | Andrew instructor, original course identity, current MLS successor relationship | 当前 MLS 是 updated/expanded successor；原课只入 `legacy`，不双计 |
| Machine Learning Engineering for Production (MLOps) Specialization | [DeepLearning.AI launch announcement](https://www.deeplearning.ai/the-batch/introducing-the-machine-learning-engineering-for-production-mlops-specialization) | program identity, instructors, four-course historical scope | 旧专项；当前只保留 standalone Machine Learning in Production canonical；不混入 14 项 |
| Stanford CS229 | [Stanford Engineering Everywhere](https://see.stanford.edu/Course/CS229) | course title, archived Stanford offering, Andrew instructor | Stanford 历史学术课程，不是当前 DLAI 产品 |
| Stanford CS221 Autumn 2009 | [Andrew Ng Stanford course list](https://ai.stanford.edu/~ang/courses.html) | Andrew 的第一方 course list 与 offering | 历史 Stanford 课程，不是当前 DLAI 产品 |
| Stanford CS230 | [Stanford official course page](https://web.stanford.edu/class/cs230/) | title, Andrew/Kian instructor relation, DL scope | 与 DLS 内容相关但不是额外 DLAI 当前产品 |
| Generative AI for University Leaders | [Coursera canonical page](https://www.coursera.org/learn/gen-ai-for-university-leaders)、[Coursera launch announcement](https://blog.coursera.org/coursera-launches-free-vanderbilt-course-generative-ai-for-university-leaders/) | course identity, Vanderbilt provider, UI display, Jules White lead, Andrew guest-expert role | DLAI 当前目录无此产品；官方发布把 Andrew 定位为 guest expert；只列 `grey_area` |

## 7. aicourse 本地来源登记

### 7.1 公共目录与线上访问

| 来源 | 支持的结论 |
|---|---|
| [`lib/courses.ts`](../lib/courses.ts) | `TOP_LEVEL_COURSES` 共 15 项：Agentic Engineering + 14 个本地课程 route，全部标为 `available`；另有 AI Research 与 Responsible AI 两个标题占位，以及 Tool Design、Cost Engineering、Human in the Loop 三个模块级占位 |
| [生产课程目录](https://aicourse.top/en/courses/) | 快照时 HTTP 200；页面列 6 个 module cards：Handbook、Lab、Build 可用，Tool Design、Cost Engineering、Human in the Loop coming soon |
| [生产 Handbook](https://aicourse.top/en/handbook/) | 快照时 HTTP 200 |
| [生产 Lab](https://aicourse.top/en/lab/) | 快照时 HTTP 200 |
| `https://aicourse.top/en/{codex,cursor,claude,grok,github,prompts,software-engineering,rag,mcp,make-money-with-codex,claude-income,ai-tutor,product-management,agent-orchestration}/` | 2026-08-24 快照时 14 条均 HTTP 404；因此本地 route、catalog `available` 或 `publishedOn` 不构成线上发布证据 |

成熟度采用四态：生产 URL 可进入实质学习路径才是“已在网站上线”；有连续正文、assessment 与 capstone 的本地 route 或 DOCX 是“有完整课程包草案”；跨课有实质片段但缺连贯主线为“部分覆盖”；route、正文和 S00–S10 均无系统 sequence 才是“真正缺失”。完整草案可以同时不是 release-ready，也不是学习成效证据。

### 7.2 课程 manifest、正文、assessment 与 route

| 本地课程 | 主要本地来源 | 支持字段 | 成熟度证据 |
|---|---|---|---|
| Agentic Engineering | [`lib/courses.ts`](../lib/courses.ts)、[`app/[locale]/handbook`](../app/[locale]/handbook)、[`app/[locale]/lab`](../app/[locale]/lab) | 3 modules、45+40+150=235 分钟、route、external Build link | 生产 Handbook/Lab 200；公共目录存在 |
| Codex | [`lib/codex/manifest.ts`](../lib/codex/manifest.ts)、[`app/[locale]/codex`](../app/[locale]/codex)、[`scripts/check-codex-course.mjs`](../scripts/check-codex-course.mjs) | 12 lessons、660 分钟、8 localization reviews、route、quiz/capstone/checker | release checker FAIL；18 张指定真实 UI capture 尚未补；生产 404 |
| Cursor | [`lib/cursor/manifest.ts`](../lib/cursor/manifest.ts)、[`app/[locale]/cursor`](../app/[locale]/cursor)、[`scripts/check-cursor-course.mjs`](../scripts/check-cursor-course.mjs) | 14 lessons、800 分钟、28-question bank、route、source/quiz/capstone contracts、14 figures | locale/结构/assessment/route 通过；release 因 14 张一方图片缺证据化发布权、`publicationStatus`/日期未发布而失败；生产 404 |
| Claude | [`lib/claude/manifest.ts`](../lib/claude/manifest.ts)、[`app/[locale]/claude`](../app/[locale]/claude)、[`scripts/check-claude-course.mjs`](../scripts/check-claude-course.mjs) | 15 lessons、870 分钟、route、source/quiz/capstone contracts、15 figures、9/9 locales | release FAIL：12 张 Academy-hosted figures 缺发布许可，`fig-01` source-to-local authenticity provenance 未解决；3 张 repo figures 有许可记录但保留 UI/trademark caveat；生产 404 |
| GitHub | [`lib/github/manifest.ts`](../lib/github/manifest.ts)、[`app/[locale]/github`](../app/[locale]/github)、[`scripts/check-github-course.mjs`](../scripts/check-github-course.mjs) | 12 lessons、660 分钟、9 locales、44 sources、21 authentic figures、24-question bank | release checker PASS；生产 404，故为可路由完整草案 |
| Grok | [`lib/grok/course.manifest.json`](../lib/grok/course.manifest.json)、[`app/[locale]/grok`](../app/[locale]/grok)、[`scripts/check-grok-course.mjs`](../scripts/check-grok-course.mjs) | 14 lessons、695 分钟、36 evidence records、10 authentic figures、assessment/capstone、9/9 locale bundles | release checker PASS；旧 zh-Hant/copy 阻断已修复；生产 404 |
| Prompts | [`lib/prompts/manifest.ts`](../lib/prompts/manifest.ts)、[`app/[locale]/prompts`](../app/[locale]/prompts)、[`scripts/check-prompts-course.mjs`](../scripts/check-prompts-course.mjs) | 9 lessons、380 分钟（含 final quiz）、18 sources、9 figures、assessment/capstone | `--release` checker PASS；生产 404，故为可路由完整草案 |
| Software Engineering | [`lib/software-engineering`](../lib/software-engineering)、[`app/[locale]/software-engineering`](../app/[locale]/software-engineering)、[`scripts/check-software-engineering-course.mjs`](../scripts/check-software-engineering-course.mjs) | 5 units、18 lessons、908 分钟、25-question bank、15-question final（pass 12）、8 capstone artifacts、9 authentic figures | local release checker PASS；route/catalog available；生产 404，故是强可路由在建而非线上已发布 |
| RAG | [`lib/rag/manifest.ts`](../lib/rag/manifest.ts)、[`app/[locale]/rag`](../app/[locale]/rag)、[`scripts/check-rag-course.mjs`](../scripts/check-rag-course.mjs) | 12 lessons、780 分钟、34 concepts、40 sources、12 figures / 5 authentic UI、12 questions（pass 9）、9 content locales、production capstone | 冻结副本 release checker PASS，0 errors / 0 warnings；生产 404 |
| MCP | [`lib/mcp/course.ts`](../lib/mcp/course.ts)、[`app/[locale]/mcp`](../app/[locale]/mcp)、[`scripts/check-mcp-course.mjs`](../scripts/check-mcp-course.mjs) | 5 units、18 lessons、1075 分钟、48 concepts、71 sources、12 high-risk claims、8 figures、18-question assessment、builder/auditor capstone | release FAIL：19 errors；12 accessed dates、6/8 licensed direct UI、7-test fixture、figure manifest/rights/upstream records 阻断；生产 404 |
| Make Money with Codex | [`lib/make-money-with-codex`](../lib/make-money-with-codex)、[`app/[locale]/make-money-with-codex`](../app/[locale]/make-money-with-codex)、[`scripts/check-make-money-with-codex-course.mjs`](../scripts/check-make-money-with-codex-course.mjs) | 12 lessons、630 分钟、12 questions（pass 10）、35 sources、9 figures、13-part evidence-pack capstone | release checker PASS；4 张真实 UI/transcript 与 5 张合成 output/handoff figures 的权利/来源工件通过本地合同；生产 404 |
| Claude Income | [`lib/claude-income`](../lib/claude-income)、[`app/[locale]/claude-income`](../app/[locale]/claude-income)、[`scripts/check-claude-income-course.mjs`](../scripts/check-claude-income-course.mjs) | 4 units、12 lessons、895 分钟、7 real UI figures、29 sources、24-question bank、16-question final（pass 13 且 critical items 全过）、seven-day demand-test capstone | release checker PASS，0 errors / 0 warnings；旧 release-audit 缺口已修复；生产 404 |
| AI Tutor | [`lib/ai-tutor/manifest.ts`](../lib/ai-tutor/manifest.ts)、[`app/[locale]/ai-tutor`](../app/[locale]/ai-tutor)、[`scripts/check-ai-tutor-course.mjs`](../scripts/check-ai-tutor-course.mjs) | 4 phases、8 modules、450 分钟、11 sources、10 milestones、8-artifact capstone、8-question final（pass 6 且 critical oversight 必须正确） | release checker PASS；是完整学习设计课程草案，不能据此宣称真实学习成效；生产 404 |
| Product Management | [`lib/product-management/manifest.ts`](../lib/product-management/manifest.ts)、[`app/[locale]/product-management`](../app/[locale]/product-management)、[`scripts/check-product-management-course.mjs`](../scripts/check-product-management-course.mjs) | 4 phases、14 modules、910 分钟、102 evidence records、14 domains、16 milestones、14-artifact capstone | release checker PASS；已实质覆盖 portfolio、build/buy、adoption、governance、experimentation、drift/rollback，不再视为未来新课；生产 404 |
| Agent Orchestration | [`lib/agent-orchestration/manifest.ts`](../lib/agent-orchestration/manifest.ts)、[`app/[locale]/agent-orchestration`](../app/[locale]/agent-orchestration)、[`scripts/check-agent-orchestration-course.mjs`](../scripts/check-agent-orchestration-course.mjs) | 4 phases、15 modules、1060 分钟、67 sources、17 milestones、production capstone、15 个 module-specific labs | release、i18n/fallback、progress 与 labs checker 全部 PASS；lab 累计 684 个穷举/对抗 case；生产 404 |

根 [`package.json`](../package.json) 的 `build` / `build:release` 已调用多数专用 gate 并已纳入 RAG，但冻结快照仍漏掉 Prompts、Software Engineering 与 MCP 三个 checker。实际根命令还先被 Handbook i18n 的 ko/ar 各 28 个缺键阻断，未运行到后续课程门或 Next build；应 additive 补门并修前置错误，不能用逐门结果替代统一发布合同。

### 7.3 S00–S10 V3.0 课程包草案来源

原始 DOCX 是课程包内容的权威载体；`analysis/corpus/*.md` 是从 DOCX 机械抽取的可检索语料，用于定位证据而不是替代原件。主代理用 Pandoc 抽取正文，并直接检查 DOCX ZIP/OOXML 中的段落和模块编号；总览明确说明每册均把学习结果绑定到可评审证据、企业交付物、独立 Verifier 和双项目迁移。各册 front matter 声明数之和为 `6+9+12+9+6+9+8+18+15+10+10=112`，但 S06 首页及模块地图称 8 且漏列 M06-02，正文实际含 M06-01 至 M06-09；机械按编号标题计，全套为 113。该源内矛盾被保留为数据质量问题。本轮没有发现这些 DOCX 册对应的站点 catalog、route、manifest 或生产 URL，因此成熟度统一为 **有完整课程包草案（DOCX，未接站）**，不是标题占位。

DOCX 内容指纹（SHA-256）用于确认本报告具体审计的版本：

| 文件 | SHA-256 |
|---|---|
| S00–S10 总览 | `6995120d5d9c3614d3d1b90a3e96f9da30aeb1dde3d54a8f2a11bd5f6f75ed1a` |
| S00 | `c12f0f0e862de2da4a7d498579e6a5cf78e8af7d2b354bfeafc6afbb614463ba` |
| S01 | `c27aa7cd3a0d0a76934fb807131c3a066d7057af3bec6a4c6bc0500672a6de57` |
| S02 | `a4b6ded34fca10fb7c939a056502bcbdfc4e0cbd963994b316de8723ba74470f` |
| S03 | `e7c210013039fb878ab32685bab05e5e6d07ed254ae7e08df8b80a1bc76b2407` |
| S04 | `ec98cbed8c974b5a5d36f76eae98ad5adc5b045d63ea70f04c592ec9ae2ba56e` |
| S05 | `9e8473612a303415c6af03cd82f28c4f71628dd8eab3ec58c17af9caf41c3ef4` |
| S06 | `a4e187e78035027ff622742f2ed82a42a4d7d8113520b67486162345933631c4` |
| S07 | `5875c6a08744cc1bf90ddd900adc76009cb6a5efafb9782bd10fd67c4edcf618` |
| S08 | `2a46a3560abc3bf936110508245e0422d2d7228b775d01cd014499183e4220cd` |
| S09 | `08ced96e20beaf55d7ca91b199eeae4c75c6f726e1f5f146eacf658f40e235b6` |
| S10 | `92ad84c8af7c396e10393f82b877ac4e9a527e3c8a78e1887b6b36c3474a13ea` |
| 上述 12 行 `<sha><two spaces><workspace-relative-path>` 按路径排序且 manifest 保留末尾 LF | `41a702cf300b021f347477f0002b6733d5b6e8e61e479d67e1d76965034b60fb` |

| 册/模块数 | 原始来源与抽取定位 | 支持的能力结论 | 去重/不确定性 |
|---|---|---|---|
| 总览 | [原始总览 DOCX](<../course_review_2026-08-23/original/S00-S10_V2.1-V2.2与V3.0_差异侧重点优劣与能力结论.docx>)、[抽取语料](<../course_review_2026-08-23/analysis/corpus/S00-S10_V2.1-V2.2与V3.0_差异侧重点优劣与能力结论.md>) | 11 册体系、证据类型、企业交付物、双项目、能力边界 | 不能从“完成文档”推定真实组织经验、教学成效或线上可用性 |
| S00 / 6 | [原始 DOCX](<../course_review_2026-08-23/original/S00_项目安全协作与课程施工操作系统_V3.0_吴恩达学习法与企业能力修订版.docx>) | mission、任务契约、权限、ADR、证据链、Verifier、handoff、Secure SDLC | 作为跨课施工/安全底座，只计一次 |
| S01 / 9 | [原始 DOCX](<../course_review_2026-08-23/original/S01_代码运行模型与可测试 Python_V3.0_吴恩达学习法与企业能力修订版.docx>) | 可测试 Python、纯函数、类型、单元/边界测试、错误样本、性能基线 | 不支持 Jupyter、Pandas、统计/可视化已覆盖的结论 |
| S02 / 12 | [原始 DOCX](<../course_review_2026-08-23/original/S02_对象协作、故障诊断与可维护设计_V3.0_吴恩达学习法与企业能力修订版.docx>) | 领域责任、ports/adapters、错误模型、test doubles、logging、安全重构 | 与产品软件工程内容去重 |
| S03 / 9 | [原始 DOCX](<../course_review_2026-08-23/original/S03_Web、数据、异步与全栈服务边界_V3.0_吴恩达学习法与企业能力修订版.docx>) | API、关系数据、事务/幂等、RBAC、后台任务、前端、队列/事件 | 数据服务不等于统计/ML data foundations |
| S04 / 6 | [原始 DOCX](<../course_review_2026-08-23/original/S04_LLM 应用、评估、可观测与安全_V3.0_吴恩达学习法与企业能力修订版.docx>)、[抽取语料](<../course_review_2026-08-23/analysis/corpus/S04_LLM 应用、评估、可观测与安全_V3.0_吴恩达学习法与企业能力修订版.md>) | versioned eval set、规则/模型/人工盲评、回归门、online signals、red team、cost/latency | 支持 LLM/application eval 在建覆盖，不支持 predictive ML evaluation 完整覆盖 |
| S05 / 9 | [原始 DOCX](<../course_review_2026-08-23/original/S05_RAG、工具与确定性工作流_V3.0_吴恩达学习法与企业能力修订版.docx>)、[抽取语料](<../course_review_2026-08-23/analysis/corpus/S05_RAG、工具与确定性工作流_V3.0_吴恩达学习法与企业能力修订版.md>) | corpus/index、chunking、hybrid retrieval、reranking、`Recall@K`、`nDCG`、context/generation 分层诊断、grounding、权限/补偿/恢复 | 支持 RAG 课程包主干存在；未验证网站接入、代码实际执行和线上成效 |
| S06 / 首页 8、正文 9 | [原始 DOCX](<../course_review_2026-08-23/original/S06_Agent Engineering 与素材自动化_V3.0_吴恩达学习法与企业能力修订版.docx>)、[抽取语料](<../course_review_2026-08-23/analysis/corpus/S06_Agent Engineering 与素材自动化_V3.0_吴恩达学习法与企业能力修订版.md>) | workflow/agent 判定、context/state/memory、有界循环、独立验证、人工升级、多模态素材流水线 | 模块地图漏列 M06-02；与 Agentic/产品 agent 课程去重；计数须在源文修复后再冻结 |
| S07 / 18 | [原始 DOCX](<../course_review_2026-08-23/original/S07_内容驱动增长平台与生产工程_V3.0_吴恩达学习法与企业能力修订版.docx>)、[抽取语料](<../course_review_2026-08-23/analysis/corpus/S07_内容驱动增长平台与生产工程_V3.0_吴恩达学习法与企业能力修订版.md>) | product discovery、PRD、contracts、lineage、metrics/experiments、release、observability、incident、rollback、privacy、cost、PRR | 通用生产/产品工程存在；不支持 ML registry、serving、drift 等完整 MLOps 已覆盖 |
| S08 / 15 | [原始 DOCX](<../course_review_2026-08-23/original/S08_多智能体工程编排与高级规模化_V3.0_吴恩达学习法与企业能力修订版.docx>) | task graph、parallel/join、ownership、handoff、独立验证、预算、恢复、渐进发布 | 与 Agentic/Codex 等去重；不把角色数当能力数 |
| S09 / 10 | [原始 DOCX](<../course_review_2026-08-23/original/S09_Prompt Engineering（提示词工程）_V3.0_吴恩达学习法与企业能力衔接版.docx>) | prompt、信息路径、任务模式、安全边界、evaluation、versioning | 与 How to Write Prompts 高度重叠；作为合并素材，不另算新主干 |
| S10 / 10 | [原始 DOCX](<../course_review_2026-08-23/original/S10_Git与GitHub_从本地版本到企业安全协作_V3.0_吴恩达学习法与企业能力衔接版.docx>) | small diff、CI、review、protected branch、secret/supply chain、多 agent 隔离 | 与 How to Use GitHub 高度重叠；作为补强素材 |

来源与发布反证分两层。第一层，直接读取 12 个 DOCX 的 `word/_rels/document.xml.rels`，按 `TargetMode="External"` 且 relationship type 为 hyperlink 统计，得到 **87 个 external hyperlink relationships、21 个唯一 URL**：总览与 S00–S08 各 7 个，S09 为 8 个，S10 为 9 个。各册正文确有通用/“权威继续学习资料”，S09/S10 另列 prompt、Git 与 GitHub 的一手资料；因此不能把抽取语料未显示 relationship target 误判为“没有外部 bibliography”。第二层，这些来源跨册高度重复，未形成逐 claim mapping、统一 accessed/frozen date、archive/hash、per-source license 或逐资产 rights ledger；抽取语料里直接出现的 `sandbox.invalid`、`github.com/USERNAME/...` 仍只是教学 fixture，不能证明练习环境可运行。由此可以确认课程结构、练习/验收设计和 reading lists 已实质存在，但不能确认每项外部主张已 source-audited、命令/代码可运行、第三方资产可再发布或课程已产生学习成效。每册接站前须把 reading list 升级为来源合同，并补 claim boundary、精确许可证、可执行 fixture、环境锁定和独立 release checker。

21 个唯一 hyperlink targets（仅用于复核本地 DOCX 来源边界，不表示本报告替这些课程资产授予许可）如下：

```text
https://home-wordpress.deeplearning.ai/wp-content/uploads/2022/03/andrew-ng-machine-learning-yearning.pdf
https://info.deeplearning.ai/how-to-build-a-career-in-ai-book
https://landing.ai/wp-content/uploads/2018/12/AI-Transformation-Playbook-v8.pdf
https://www.deeplearning.ai/courses/machine-learning-in-production
https://www.deeplearning.ai/short-courses/automated-testing-llmops
https://www.deeplearning.ai/courses/safe-and-reliable-ai-via-guardrails
https://www.deeplearning.ai/courses/design-develop-and-deploy-multi-agent-systems-with-crewai
https://www.deeplearning.ai/courses/ai-python-for-beginners
https://help.openai.com/en/articles/10032626-how-do-i-prompt-chatgpt-effectively
https://help.openai.com/en/articles/6654000-playground-and-prompt-engineering
https://genai.owasp.org/llmrisk/llm01-prompt-injection/
https://www.deeplearning.ai/courses/ai-prompting-for-everyone
https://www.deeplearning.ai/courses/chatgpt-prompt-eng
https://community.deeplearning.ai/t/ap4e-lecture-notes/891828
https://git-scm.com/docs
https://docs.github.com/en/get-started/using-git/about-git
https://docs.github.com/en/get-started/git-basics/about-remote-repositories
https://docs.github.com/en/get-started/using-git/getting-changes-from-a-remote-repository
https://docs.github.com/en/pull-requests/get-started/about-pull-requests
https://git-scm.com/book/en/v2
https://docs.github.com/en/get-started/using-github/hello-world
```

快照日对这 21 个 relationship targets 另做 GET + redirect-follow：19 个最终返回 HTTP 200；两个 OpenAI Help Center URL 对本轮未认证客户端返回 HTTP 403；旧 `/short-courses/automated-testing-llmops` 经 308 转到当前 `/courses/` 页面；`AI-Transformation-Playbook-v8.pdf` 最终落到 LandingAI 根页，不能据最终 200 推定原 PDF 内容仍在原位。这些结果进一步说明“DOCX 含 hyperlink”只证明写入过继续学习线索，不等于目标内容已冻结、逐项核验或获得再发布权。

### 7.4 标题/模块占位来源

- `AI for Evidence-Grounded Research` 与 `Responsible AI and Evaluation`：只在 [`CATALOG_COURSES`](../lib/courses.ts)中有 title/blurb/level，`href: "#"`、`minutes: null`、`status: "soon"`，没有可核验的 lessons、assessment 或 capstone，按标题占位。
- 旧 `AI for Teaching and Learning` 占位不再计作当前缺口证据；AI Tutor 已有 8 模块、实质正文、assessment、capstone 与 route，成熟度另列为可路由完整草案。
- `Tool Design`, `Cost Engineering`, `Human in the Loop`：只在 [`UPCOMING_MODULES`](../lib/courses.ts)中有名称、估算分钟与 `href: "#"`，按模块级占位。
- `legacy/course-python/`：Agentic Build 的历史 Python 实现，可作为工程资产复用，但不是 Python/Jupyter/Data Foundations 课程，不计成新课程。

## 8. 定稿时本地 checker 证据

以下命令为只读验证；非零退出码被保留为成熟度证据，没有在本轮修复网站代码。

| 命令 | 结果摘要 | 解释边界 |
|---|---|---|
| `node scripts/check-prompts-course.mjs --release` | **exit 0 / PASS**；9 lessons、18 sources、9 available figures、2 verified raster pairs | 证明本地 release contract 通过；不证明生产已部署 |
| `node scripts/check-codex-course.mjs --release --json` | **exit 1 / FAIL**；12 lessons、8 localization reviews；18 errors、0 warnings | 18 张指定真实 Codex UI capture 尚未补；课程结构完整，但 release acceptance 未通过 |
| `node --import tsx scripts/check-cursor-course.mjs --release` | **exit 1 / FAIL**；14 lessons、28-question bank、800m、source/assessment/capstone/namespace/routes 通过 | 14 张一方图片缺 evidence-bearing publication rights，且 publication status/date 未达到发布态；不是 locale 结构旧问题 |
| `node --import tsx scripts/check-claude-course.mjs --release --json` | **exit 1 / FAIL**；15 lessons、15 figures、9/9 locales；2 组错误 | 12 张 Academy-hosted figures 尚无 publication permission；`fig-01` source-to-local authenticity provenance 未解决；3 张 repo figures 的许可记录与 caveat 被保留 |
| `node scripts/check-github-course.mjs --release --json` | **exit 0 / PASS**；12 lessons、660m、9 locales、44 sources、21 authentic figures、24-question bank | 本地 release gate 通过；生产 URL 404 仍优先于本地状态 |
| `node scripts/check-grok-course.mjs --release` | **exit 0 / PASS**；4 units、14 lessons、695m、36 evidence records、10 authentic figures、9/9 locale bundles | 旧 zh-Hant 与 copy loader 问题已修复；生产仍 404 |
| `node scripts/check-rag-course.mjs --release --json` | **exit 0 / PASS**；12 lessons、780m、34 concepts、40 sources、12 figures / 5 authentic UI、12 questions / pass 9、9 content locales；0 errors / 0 warnings | 冻结副本内容与 release contract 通过；生产仍 404 |
| `node scripts/check-software-engineering-course.mjs --release --json` | **exit 0 / PASS**；5 units、18 lessons、25-question bank、9 authentic figures、8 capstone artifacts | 此结果替代审计中途的 media mismatch；本地通过仍不等于生产已部署 |
| `node --import tsx scripts/check-mcp-course.mjs --release --json` | **exit 1 / FAIL**；5 units、18 lessons、48 concepts、71 sources、12 claims、8 figures、18 assessment questions；19 errors / 0 warnings | 12 个 accessed dates 未冻结；6/8 licensed direct UI、7-test fixture、figure manifest、Gemini/Codex rights 与 immutable-upstream records 仍阻断；生产 404 |
| `node scripts/check-make-money-with-codex-course.mjs --release --json` | **exit 0 / PASS**；12 lessons、630m、12 questions、35 sources、9 figures | 本地权利/来源工件通过；不证明真实收入或生产部署 |
| `node --import tsx scripts/check-claude-income-course.mjs --release --json` | **exit 0 / PASS**；4 units、12 lessons、7 figures、29 sources、24-question bank；0 errors / 0 warnings | 旧 release-audit 缺口已修复；课程不承诺收入；生产仍 404 |
| `node --import tsx scripts/check-ai-tutor-course.mjs --release --json` | **exit 0 / PASS**；8 modules、450m、11 sources、10 milestones、8-question final、8-artifact capstone | 证明课程设计包合同通过，不证明真实学习成效；`--import tsx` 是直接执行 TypeScript manifest 所需 loader |
| `node --import tsx scripts/check-product-management-course.mjs --release --json` | **exit 0 / PASS**；14 modules、910m、102 evidence records、16 milestones、14-artifact capstone | 已是完整产品管理课程草案；不应继续列为未来新课；`--import tsx` 是直接执行 TypeScript manifest 所需 loader |
| Agent Orchestration 的 course、i18n、progress、labs 四组 checker | **全部 exit 0 / PASS**；15 modules、1060m、67 sources、17 milestones；15 个 lab 共 684 exhaustive/adversarial cases | 2 个审校长文 locale + 7 个显式英语 fallback；不等于九套完整翻译或生产上线 |
| `npx tsc --noEmit --incremental false --pretty false` | **exit 2 / FAIL**；1 error | `tests/claude-course.spec.ts:107` 比较互斥 literal types `first-party-tutorial` 与 `licensed-community`（TS2367）；类型门未通过 |
| `npm run build:release` | **exit 1 / FAIL**；最早阻断为 Handbook i18n | ko 与 ar 各缺 28 个 attribute keys；命令未运行到后续课程 gate 或 Next build，不能把此结果解释为其他门已通过或失败 |

## 9. 主要结论到证据的映射

| 主报告结论 | Andrew 侧证据 | aicourse 侧证据 | 推理类型 |
|---|---|---|---|
| 当前严格口径为 14 产品 / 20 单元 | sitemap + 14 current page instructor fields + 8 child course pages | 不适用 | 直接计数与去重 |
| GitHub 非一课一 repo | first-party central index、4 个 repo README、官方社区课程映射、per-repo LICENSE 检查 | 不适用 | 有限范围 provenance audit |
| aicourse 强在 prompting/agents/tools/verification | Andrew 的 Agentic/Prompt/Systems 课程作为对照 | Agentic public modules；Prompts、RAG、MCP、Software Engineering、Codex/Cursor/Claude/Grok；S00/S04/S06/S08/S09 | 课程主题编码，产品、route 与课程包工作流去重 |
| Python 工程在建，但数据先修不完整 | AI Python + Jupyter AI + MLS 的 Python/data 前置 | S01 9 模块可测试 Python、S03 数据服务；无 Jupyter/NumPy/Pandas/统计/可视化主干 | 成熟度分层后的比较判断 |
| 传统 ML 缺失 | MLS 三门子课涵盖监督、无监督、推荐、RL | route/manifests 与 S00–S10 均未发现相应系统 lesson sequence | 比较性缺口判断 |
| Deep Learning/Transformers 缺失 | DLS 五课涵盖 backprop、optimization、CNN、sequence、attention/Transformers | route/manifests 与 S00–S10 只有模型/API 使用，无训练主干 | 比较性缺口判断 |
| RAG/LLM application 已有完整主干、尚未生产发布 | Text Embeddings + LangChain + Systems 涵盖 embedding/search/chains/document QA | RAG 12 lessons/780m 在冻结副本专用 release gate 为 0 errors / 0 warnings；S04/S05 补 eval、hybrid retrieval、reranking、`Recall@K`/`nDCG`、grounding、observability；生产 URL 404 | 内容覆盖、local integration 与 production deployment 分离 |
| MLOps 只有通用 production/LLMOps，ML-specific lifecycle 仍缺 | Machine Learning in Production 涵盖 data/model pipeline、monitoring、drift、error analysis | Software Engineering + S07 的 CI/CD/release/observability/incident/rollback + RAG/S04/S05 LLMOps；缺 training-data/model registry/predictive serving/drift | 通用软件生产不等于完整 ML lifecycle |
| Responsible AI 是部分覆盖，不是零资产 | AI literacy/社会影响内容作为最低对照 | Product Management 有 group performance/transparency/appeal/governance，AI Tutor 有 fairness/teacher authority/recourse，Agent Orchestration 与 S00/S04/S05/S07/S08 有 permission/red team/verifier/human gate/stop rule；独立课仍只是占位 | 多资产组合后仍缺 fairness audit、explainability、impact/accountability/cards/contestability 的连贯主线 |
| Product/AI strategy 已有完整课程草案 | AI for Everyone、Generative AI for Everyone 的 strategy 内容 | Product Management 14 modules/910m 覆盖 portfolio、build/buy、experiments、governance、GTM/adoption、Product Ops；S07 与两门商业化课补 production/demand/pricing | 强覆盖但生产 404；应发布和去重，不应再列为未来新课 |
| AI Teaching 主干已有完整课程草案 | Andrew 当前清单只有相邻工具工作流，没有同类完整教学设计主干 | AI Tutor 8 modules/450m，含 diagnosis、scaffolding、assessment、learner modeling、impact experiment、fairness 与 teacher oversight | 旧标题占位已被实质课替代；设计包不等于学习成效 |
| 多智能体编排主干已有完整课程草案 | Agentic AI 作为对照 | Agent Orchestration 15 modules/1060m + S06/S08；release/i18n/progress/labs 全部 PASS，生产 404 | 强覆盖但未上线；应合并去重，不新建同名课 |
| Prompts 应先发布而非重做 | Andrew 两门 prompt 课程用于主题对照 | 本地 Prompts 9 lessons/380m、checker PASS、S09 高度重叠、生产 404 | 成熟度与重复建设判断 |

## 10. 不确定性、访问状态与禁止过度解读

1. **时长与类型会漂移。** CSV 的 1h、7h4m、94h58m、127h29m 等均为 2026-08-24 页面快照；搜索缓存旧值不覆盖 live canonical 页面。
2. **课程产品与单元不能混算。** 14 是包装层；20 是内容单元层；CSV 的 22 个当前行保留了两层审计记录。
3. **没有找到不等于确认不存在。** `no_verified_public_repo` 来自中央 companion 组织 `https-deeplearning-ai` 的 34 个 public repo、中央 hub、课程页与官方社区的有限检查；没有穷尽其他 first-party owner、全网、删除历史或私有状态。
4. **公开可见不等于一般开放许可。** 中央 hub 支持 educational access/use，但没有 per-repo/per-asset LICENSE 时不能据此确认一般修改或再发布范围；明确许可证例外按其具体条款处理。
5. **历史 repo 不等于当前 parity。** MLEP public repo 对旧四课专项的官方性已确认，但与当前 standalone Machine Learning in Production 的逐文件同步未确认。
6. **本地 route 不等于生产 route。** 本轮列出的 14 个 `/en/<course>/` 生产 404 优先于本地 `available`、`publishedOn` 或 route 文件。
7. **checker 通过不等于生产发布，结构完整也不等于 release acceptance。** Codex、Cursor、Claude 与 MCP 的 release checker 在冻结副本失败；各课程精确阻断以上表为准；专用 PASS 课程的生产 URL 仍为 404。根 release pipeline 还漏接 Prompts、Software Engineering 与 MCP 三个专用 gate，并先被 Handbook i18n 阻断。
8. **课程包正文不等于网站课程，但也不是占位。** S00–S10 有 11 册实质内容，front matter 声明 112 模块、按正文编号标题机械计为 113，也有通用/继续学习来源清单；但没有 catalog/route/manifest/生产 URL，reading lists 也未升级为逐 claim、冻结日期、archive/hash、license/rights ledger 与运行验收，故只能计作完整 DOCX 草案。
9. **能力判断不是学习成效证明。** 本轮没有可比较的 completion、assessment gain、retention 或 transfer 数据。
10. **灰区课程单列。** Generative AI for University Leaders 不进入 DLAI 当前严格讲师口径，不否认 Andrew 在其中有 guest-expert 内容贡献。
11. **排除账本只回答严格讲师口径。** 文末 113 行与前述 14 个纳入页合计 127 页；统一排除理由是快照日 hero `Instructor(s)` 字段未列 Andrew Ng。这不证明 Andrew 从未以其他角色参与，也不是课程质量判断。

定稿机械链接校验解析出 **166 个唯一、可点击的外部 HTTP(S) URL**，以 GET + redirect-follow 与有限重试检查后为 `166/166` HTTP 200；其中包含 127 个当前 DeepLearning.AI 课程/专项页面。历史 `aisetup` helper 是 code span 中的失效线索，不属于 166 个可点击链接，单独检查为预期 HTTP 404。另行检查的 14 个 aicourse 候选课程生产 URL 全部返回 HTTP 404。主报告有 `37` 个本地相对链接引用、`29` 个唯一目标；provenance 有 `68` 个引用、`65` 个唯一目标，均为 0 missing。provenance 计数包含 17 个以 CommonMark `<...>` 包裹、因文件名含空格而必须如此书写的 DOCX/corpus targets；本地链接验收同时解析普通 destination 与 angle-bracket destination。

## 11. 复现与验收清单

定稿验收结果：

- [x] CSV header 恰为 16 个固定字段；
- [x] CSV 有 28 个 data rows，其中 `current_product=14`, `current_child_course=8`, `legacy=5`, `grey_area=1`；
- [x] 当前 14 个产品中 `course=7`, `short_course=5`, `professional_certificate_specialization=2`；
- [x] 两个父项目分别有 3 和 5 个 child rows；
- [x] 14 个 current product 都有 official URL 与 Andrew instructor evidence；
- [x] 当前 14 个产品 URL 与 8 个 child URL 在快照日均可访问；
- [x] repo_class 只使用本文件列出的 enum；
- [x] 每个 GitHub 映射都有 owner、关联证据、license 状态、访问状态和检查日期；
- [x] 主报告区分 online published、local routable draft、package/draft 与 title placeholder；
- [x] 报告没有把 product tool workflows 机械重复计数；
- [x] 报告和建议未复制课程受保护资产；
- [x] S00–S10 的 front matter 112 / 正文机械标题 113 差异已显式披露；
- [x] RAG、Software Engineering、MCP、两门商业化课、AI Tutor、Product Management 与 Agent Orchestration 已纳入可路由完整草案盘点；
- [x] AI Teaching 与 Product Strategy 不再被误报为未来零资产新课；Responsible AI 被标为“已有实质片段但独立主线仍占位”；
- [x] 传统 ML 与 Deep Learning/Transformers 只在 route、正文与 S00–S10 均无系统 sequence 后才判为真正缺失；
- [x] S00–S10 的 12 个 DOCX 指纹、来源/许可/运行反证和模块去重关系已记录；
- [x] 定稿课程输入复制前、复制后与验收副本指纹完全一致；checker 结果均来自该副本。

验收于 2026-08-24 完成。非零 checker、TypeScript error 与根 build 前置阻断均被如实保留；任何局部 PASS 都没有被夸大为生产上线。这些交付状态不影响 Andrew Ng 14/20 清单、CSV 结构和“内容覆盖 vs 交付成熟度”缺口分析的可审计性。


## 12. 127 页严格讲师口径反证账本

本账本把 sitemap 中的 127 个当前课程/专项页面闭合为 **14 个纳入 + 113 个排除**。2026-08-24 复核时，127/127 页面返回 HTTP 200，127/127 均成功解析 hero `Instructor(s)` 字段；下表逐项列出 113 个排除页。生成此表的中间 TSV 含 header 共 114 行、12,726 bytes，SHA-256 为 `e674d97fa17ac55922623e0f435b0776a1c258e1b9c89b9e1f4c7b70d11a6f75`。该 TSV 可由下表确定性重建：UTF-8 无 BOM、TAB 分隔、LF 换行并保留终端 LF；header 恰为 `product_type<TAB>canonical_slug<TAB>hero_instructors<TAB>exclusion_reason`；data rows 按完整 UTF-8 TSV 行字节序排序；第四列统一为 `Andrew Ng not listed in hero Instructor(s) field`。统一排除理由只表示快照日正式讲师字段未列 Andrew Ng；它不排除 guest、推荐者、采访对象或历史参与，也不评价课程质量。

| 页面类型 | canonical slug / URL | hero Instructor(s) | 排除理由 |
|---|---|---|---|
| course | [a2a-the-agent2agent-protocol](https://www.deeplearning.ai/courses/a2a-the-agent2agent-protocol) | Holt Skinner, Ivan Nardini, Sandi Besen | hero Instructor(s) 未列 Andrew Ng |
| course | [advanced-retrieval-for-ai](https://www.deeplearning.ai/courses/advanced-retrieval-for-ai) | Anton Troynikov | hero Instructor(s) 未列 Andrew Ng |
| course | [agent-memory-building-memory-aware-agents](https://www.deeplearning.ai/courses/agent-memory-building-memory-aware-agents) | Richmond Alake, Nacho Martínez | hero Instructor(s) 未列 Andrew Ng |
| course | [agent-skills-with-anthropic](https://www.deeplearning.ai/courses/agent-skills-with-anthropic) | Elie Schoppik | hero Instructor(s) 未列 Andrew Ng |
| course | [agentic-knowledge-graph-construction](https://www.deeplearning.ai/courses/agentic-knowledge-graph-construction) | Andreas Kollegger | hero Instructor(s) 未列 Andrew Ng |
| course | [ai-agentic-design-patterns-with-autogen](https://www.deeplearning.ai/courses/ai-agentic-design-patterns-with-autogen) | Chi Wang, Qingyun Wu | hero Instructor(s) 未列 Andrew Ng |
| course | [ai-agents-for-image-and-video-generation](https://www.deeplearning.ai/courses/ai-agents-for-image-and-video-generation) | Katie Nguyen, Wafae Bakkali | hero Instructor(s) 未列 Andrew Ng |
| course | [ai-agents-in-langgraph](https://www.deeplearning.ai/courses/ai-agents-in-langgraph) | Harrison Chase, Rotem Weiss | hero Instructor(s) 未列 Andrew Ng |
| course | [ai-code-review](https://www.deeplearning.ai/courses/ai-code-review) | Nnenna Ndukwe | hero Instructor(s) 未列 Andrew Ng |
| course | [ai-coding-workflows-from-cloud-to-local](https://www.deeplearning.ai/courses/ai-coding-workflows-from-cloud-to-local) | Paul Everitt | hero Instructor(s) 未列 Andrew Ng |
| course | [attention-in-transformers-concepts-and-code-in-pytorch](https://www.deeplearning.ai/courses/attention-in-transformers-concepts-and-code-in-pytorch) | Josh Starmer | hero Instructor(s) 未列 Andrew Ng |
| course | [automated-testing-llmops](https://www.deeplearning.ai/courses/automated-testing-llmops) | Rob Zuber | hero Instructor(s) 未列 Andrew Ng |
| course | [build-ai-apps-with-mcp-server-working-with-box-files](https://www.deeplearning.ai/courses/build-ai-apps-with-mcp-server-working-with-box-files) | Ben Kus | hero Instructor(s) 未列 Andrew Ng |
| course | [build-and-train-an-llm-with-jax](https://www.deeplearning.ai/courses/build-and-train-an-llm-with-jax) | Chris Achard | hero Instructor(s) 未列 Andrew Ng |
| course | [build-apps-with-windsurfs-ai-coding-agents](https://www.deeplearning.ai/courses/build-apps-with-windsurfs-ai-coding-agents) | Anshul Ramachandran | hero Instructor(s) 未列 Andrew Ng |
| course | [build-interactive-agents-with-generative-ui](https://www.deeplearning.ai/courses/build-interactive-agents-with-generative-ui) | Atai Barkai | hero Instructor(s) 未列 Andrew Ng |
| course | [build-long-context-ai-apps-with-jamba](https://www.deeplearning.ai/courses/build-long-context-ai-apps-with-jamba) | Chen Wang, Chen Almagor | hero Instructor(s) 未列 Andrew Ng |
| course | [building-agentic-rag-with-llamaindex](https://www.deeplearning.ai/courses/building-agentic-rag-with-llamaindex) | Jerry Liu | hero Instructor(s) 未列 Andrew Ng |
| course | [building-ai-applications-with-haystack](https://www.deeplearning.ai/courses/building-ai-applications-with-haystack) | Tuana Çelik | hero Instructor(s) 未列 Andrew Ng |
| course | [building-ai-browser-agents](https://www.deeplearning.ai/courses/building-ai-browser-agents) | Div Garg, Naman Garg | hero Instructor(s) 未列 Andrew Ng |
| course | [building-ai-voice-agents-for-production](https://www.deeplearning.ai/courses/building-ai-voice-agents-for-production) | Russ d’Sa, Shayne Parmelee, Nedelina Teneva | hero Instructor(s) 未列 Andrew Ng |
| course | [building-an-ai-powered-game](https://www.deeplearning.ai/courses/building-an-ai-powered-game) | Niki Birkner, Nick Walton | hero Instructor(s) 未列 Andrew Ng |
| course | [building-and-evaluating-data-agents](https://www.deeplearning.ai/courses/building-and-evaluating-data-agents) | Anupam Datta, Josh Reini | hero Instructor(s) 未列 Andrew Ng |
| course | [building-applications-vector-databases](https://www.deeplearning.ai/courses/building-applications-vector-databases) | Tim Tully | hero Instructor(s) 未列 Andrew Ng |
| course | [building-code-agents-with-hugging-face-smolagents](https://www.deeplearning.ai/courses/building-code-agents-with-hugging-face-smolagents) | Thomas Wolf, Aymeric Roucher | hero Instructor(s) 未列 Andrew Ng |
| course | [building-coding-agents-with-tool-execution](https://www.deeplearning.ai/courses/building-coding-agents-with-tool-execution) | Tereza Tizkova, Francesco Zuppichini | hero Instructor(s) 未列 Andrew Ng |
| course | [building-evaluating-advanced-rag](https://www.deeplearning.ai/courses/building-evaluating-advanced-rag) | Jerry Liu, Anupam Datta | hero Instructor(s) 未列 Andrew Ng |
| course | [building-live-voice-agents-with-googles-adk](https://www.deeplearning.ai/courses/building-live-voice-agents-with-googles-adk) | Lavi Nigam, Sita Lakshmi Sangameswaran | hero Instructor(s) 未列 Andrew Ng |
| course | [building-multimodal-data-pipelines](https://www.deeplearning.ai/courses/building-multimodal-data-pipelines) | Gilberto Hernandez | hero Instructor(s) 未列 Andrew Ng |
| course | [building-multimodal-search-and-rag](https://www.deeplearning.ai/courses/building-multimodal-search-and-rag) | Sebastian Witalec | hero Instructor(s) 未列 Andrew Ng |
| course | [building-toward-computer-use-with-anthropic](https://www.deeplearning.ai/courses/building-toward-computer-use-with-anthropic) | Colt Steele | hero Instructor(s) 未列 Andrew Ng |
| course | [building-with-llama-4](https://www.deeplearning.ai/courses/building-with-llama-4) | Amit Sangani | hero Instructor(s) 未列 Andrew Ng |
| course | [building-your-own-database-agent](https://www.deeplearning.ai/courses/building-your-own-database-agent) | Adrian Gonzalez Sanchez | hero Instructor(s) 未列 Andrew Ng |
| course | [carbon-aware-computing-for-genai-developers](https://www.deeplearning.ai/courses/carbon-aware-computing-for-genai-developers) | Nikita Namjoshi | hero Instructor(s) 未列 Andrew Ng |
| course | [claude-code-a-highly-agentic-coding-assistant](https://www.deeplearning.ai/courses/claude-code-a-highly-agentic-coding-assistant) | Elie Schoppik | hero Instructor(s) 未列 Andrew Ng |
| course | [collaborative-writing-and-coding-with-openai-canvas](https://www.deeplearning.ai/courses/collaborative-writing-and-coding-with-openai-canvas) | Karina Nguyen | hero Instructor(s) 未列 Andrew Ng |
| course | [design-develop-and-deploy-multi-agent-systems-with-crewai](https://www.deeplearning.ai/courses/design-develop-and-deploy-multi-agent-systems-with-crewai) | João Moura | hero Instructor(s) 未列 Andrew Ng |
| course | [diffusion-models](https://www.deeplearning.ai/courses/diffusion-models) | Sharon Zhou | hero Instructor(s) 未列 Andrew Ng |
| course | [document-ai-from-ocr-to-agentic-doc-extraction](https://www.deeplearning.ai/courses/document-ai-from-ocr-to-agentic-doc-extraction) | David Park, Andrea Kropp | hero Instructor(s) 未列 Andrew Ng |
| course | [dspy-build-optimize-agentic-apps](https://www.deeplearning.ai/courses/dspy-build-optimize-agentic-apps) | Chen Qian | hero Instructor(s) 未列 Andrew Ng |
| course | [efficient-inference-with-sglang-text-and-image-generation](https://www.deeplearning.ai/courses/efficient-inference-with-sglang-text-and-image-generation) | Richard Chen | hero Instructor(s) 未列 Andrew Ng |
| course | [efficiently-serving-llms](https://www.deeplearning.ai/courses/efficiently-serving-llms) | Travis Addair | hero Instructor(s) 未列 Andrew Ng |
| course | [embedding-models-from-architecture-to-implementation](https://www.deeplearning.ai/courses/embedding-models-from-architecture-to-implementation) | Ofer Mendelevitch | hero Instructor(s) 未列 Andrew Ng |
| course | [evaluating-ai-agents](https://www.deeplearning.ai/courses/evaluating-ai-agents) | John Gilhuly, Aman Khan | hero Instructor(s) 未列 Andrew Ng |
| course | [evaluating-debugging-generative-ai](https://www.deeplearning.ai/courses/evaluating-debugging-generative-ai) | Carey Phelps | hero Instructor(s) 未列 Andrew Ng |
| course | [event-driven-agentic-document-workflows](https://www.deeplearning.ai/courses/event-driven-agentic-document-workflows) | Laurie Voss | hero Instructor(s) 未列 Andrew Ng |
| course | [fast-and-efficient-llm-inference-with-vllm](https://www.deeplearning.ai/courses/fast-and-efficient-llm-inference-with-vllm) | Cedric Clyburn | hero Instructor(s) 未列 Andrew Ng |
| course | [fast-llm-inference-with-cerebras](https://www.deeplearning.ai/courses/fast-llm-inference-with-cerebras) | Zhenwei Gao, Sebastian Duerr, Sarah Chieng | hero Instructor(s) 未列 Andrew Ng |
| course | [fast-prototyping-of-genai-apps-with-streamlit](https://www.deeplearning.ai/courses/fast-prototyping-of-genai-apps-with-streamlit) | Chanin Nantasenamat | hero Instructor(s) 未列 Andrew Ng |
| course | [fine-tuning-and-reinforcement-learning-for-llms-intro-to-post-training](https://www.deeplearning.ai/courses/fine-tuning-and-reinforcement-learning-for-llms-intro-to-post-training) | Sharon Zhou | hero Instructor(s) 未列 Andrew Ng |
| course | [finetuning-large-language-models](https://www.deeplearning.ai/courses/finetuning-large-language-models) | Sharon Zhou | hero Instructor(s) 未列 Andrew Ng |
| course | [function-calling-and-data-extraction-with-llms](https://www.deeplearning.ai/courses/function-calling-and-data-extraction-with-llms) | Jiantao Jiao, Venkat Srinivasan | hero Instructor(s) 未列 Andrew Ng |
| course | [functions-tools-agents-langchain](https://www.deeplearning.ai/courses/functions-tools-agents-langchain) | Harrison Chase | hero Instructor(s) 未列 Andrew Ng |
| course | [gemini-cli-code-and-create-with-an-open-source-agent](https://www.deeplearning.ai/courses/gemini-cli-code-and-create-with-an-open-source-agent) | Jack Wotherspoon | hero Instructor(s) 未列 Andrew Ng |
| course | [generative-ai-with-llms](https://www.deeplearning.ai/courses/generative-ai-with-llms) | Antje Barth, Chris Fregly, Shelbee Eigenbrode, Mike Chambers | hero Instructor(s) 未列 Andrew Ng |
| course | [getting-started-with-mistral](https://www.deeplearning.ai/courses/getting-started-with-mistral) | Sophia Yang | hero Instructor(s) 未列 Andrew Ng |
| course | [getting-structured-llm-output](https://www.deeplearning.ai/courses/getting-structured-llm-output) | Will Kurt, Cameron Pfiffer | hero Instructor(s) 未列 Andrew Ng |
| course | [governing-ai-agents](https://www.deeplearning.ai/courses/governing-ai-agents) | Amber Roberts | hero Instructor(s) 未列 Andrew Ng |
| course | [how-transformer-llms-work](https://www.deeplearning.ai/courses/how-transformer-llms-work) | Jay Alammar, Maarten Grootendorst | hero Instructor(s) 未列 Andrew Ng |
| course | [huggingface-gradio](https://www.deeplearning.ai/courses/huggingface-gradio) | Apolinário Passos | hero Instructor(s) 未列 Andrew Ng |
| course | [improving-accuracy-of-llm-applications](https://www.deeplearning.ai/courses/improving-accuracy-of-llm-applications) | Sharon Zhou, Amit Sangani | hero Instructor(s) 未列 Andrew Ng |
| course | [intro-to-federated-learning](https://www.deeplearning.ai/courses/intro-to-federated-learning) | Daniel J. Beutel, Nicholas Lane | hero Instructor(s) 未列 Andrew Ng |
| course | [intro-to-federated-learning-c2](https://www.deeplearning.ai/courses/intro-to-federated-learning-c2) | Daniel J. Beutel, Nicholas Lane | hero Instructor(s) 未列 Andrew Ng |
| course | [introducing-multimodal-llama-3-2](https://www.deeplearning.ai/courses/introducing-multimodal-llama-3-2) | Amit Sangani | hero Instructor(s) 未列 Andrew Ng |
| course | [introduction-to-on-device-ai](https://www.deeplearning.ai/courses/introduction-to-on-device-ai) | Krishna Sridhar | hero Instructor(s) 未列 Andrew Ng |
| course | [javascript-rag-web-apps-with-llamaindex](https://www.deeplearning.ai/courses/javascript-rag-web-apps-with-llamaindex) | Laurie Voss | hero Instructor(s) 未列 Andrew Ng |
| course | [knowledge-graphs-for-ai-agent-api-discovery](https://www.deeplearning.ai/courses/knowledge-graphs-for-ai-agent-api-discovery) | Pavithra G K, Lars Heling | hero Instructor(s) 未列 Andrew Ng |
| course | [knowledge-graphs-rag](https://www.deeplearning.ai/courses/knowledge-graphs-rag) | Andreas Kollegger | hero Instructor(s) 未列 Andrew Ng |
| course | [langchain-chat-with-your-data](https://www.deeplearning.ai/courses/langchain-chat-with-your-data) | Harrison Chase | hero Instructor(s) 未列 Andrew Ng |
| course | [large-language-models-semantic-search](https://www.deeplearning.ai/courses/large-language-models-semantic-search) | Jay Alammar, Luis Serrano | hero Instructor(s) 未列 Andrew Ng |
| course | [large-multimodal-model-prompting-with-gemini](https://www.deeplearning.ai/courses/large-multimodal-model-prompting-with-gemini) | Erwin Huizenga | hero Instructor(s) 未列 Andrew Ng |
| course | [llmops](https://www.deeplearning.ai/courses/llmops) | Erwin Huizenga | hero Instructor(s) 未列 Andrew Ng |
| course | [llms-as-operating-systems-agent-memory](https://www.deeplearning.ai/courses/llms-as-operating-systems-agent-memory) | Charles Packer, Sarah Wooders | hero Instructor(s) 未列 Andrew Ng |
| course | [long-term-agentic-memory-with-langgraph](https://www.deeplearning.ai/courses/long-term-agentic-memory-with-langgraph) | Harrison Chase | hero Instructor(s) 未列 Andrew Ng |
| course | [mcp-build-rich-context-ai-apps-with-anthropic](https://www.deeplearning.ai/courses/mcp-build-rich-context-ai-apps-with-anthropic) | Elie Schoppik | hero Instructor(s) 未列 Andrew Ng |
| course | [microsoft-semantic-kernel](https://www.deeplearning.ai/courses/microsoft-semantic-kernel) | John Maeda | hero Instructor(s) 未列 Andrew Ng |
| course | [multi-ai-agent-systems-with-crewai](https://www.deeplearning.ai/courses/multi-ai-agent-systems-with-crewai) | João Moura | hero Instructor(s) 未列 Andrew Ng |
| course | [multi-vector-image-retrieval](https://www.deeplearning.ai/courses/multi-vector-image-retrieval) | Kacper Łukawski | hero Instructor(s) 未列 Andrew Ng |
| course | [nvidia-nat-making-agents-reliable](https://www.deeplearning.ai/courses/nvidia-nat-making-agents-reliable) | Brian McBrayer | hero Instructor(s) 未列 Andrew Ng |
| course | [open-source-models-hugging-face](https://www.deeplearning.ai/courses/open-source-models-hugging-face) | Maria Khalusova, Marc Sun, Younes Belkada | hero Instructor(s) 未列 Andrew Ng |
| course | [orchestrating-workflows-for-genai-applications](https://www.deeplearning.ai/courses/orchestrating-workflows-for-genai-applications) | Kenten Danas, Tamara Fingerlin | hero Instructor(s) 未列 Andrew Ng |
| course | [pair-programming-llm](https://www.deeplearning.ai/courses/pair-programming-llm) | Laurence Moroney | hero Instructor(s) 未列 Andrew Ng |
| course | [post-training-of-llms](https://www.deeplearning.ai/courses/post-training-of-llms) | Banghua Zhu | hero Instructor(s) 未列 Andrew Ng |
| course | [practical-multi-ai-agents-and-advanced-use-cases-with-crewai](https://www.deeplearning.ai/courses/practical-multi-ai-agents-and-advanced-use-cases-with-crewai) | João Moura | hero Instructor(s) 未列 Andrew Ng |
| course | [preprocessing-unstructured-data-for-llm-applications](https://www.deeplearning.ai/courses/preprocessing-unstructured-data-for-llm-applications) | Matt Robinson | hero Instructor(s) 未列 Andrew Ng |
| course | [pretraining-llms](https://www.deeplearning.ai/courses/pretraining-llms) | Sung Kim, Lucy Park | hero Instructor(s) 未列 Andrew Ng |
| course | [prompt-compression-and-query-optimization](https://www.deeplearning.ai/courses/prompt-compression-and-query-optimization) | Richmond Alake | hero Instructor(s) 未列 Andrew Ng |
| course | [prompt-engineering-for-vision-models](https://www.deeplearning.ai/courses/prompt-engineering-for-vision-models) | Abby Morgan, Jacques Verré, Caleb Kaiser | hero Instructor(s) 未列 Andrew Ng |
| course | [prompt-engineering-with-llama-2](https://www.deeplearning.ai/courses/prompt-engineering-with-llama-2) | Amit Sangani | hero Instructor(s) 未列 Andrew Ng |
| course | [pydantic-for-llm-workflows](https://www.deeplearning.ai/courses/pydantic-for-llm-workflows) | Ryan Keenan | hero Instructor(s) 未列 Andrew Ng |
| course | [quantization-fundamentals](https://www.deeplearning.ai/courses/quantization-fundamentals) | Younes Belkada, Marc Sun | hero Instructor(s) 未列 Andrew Ng |
| course | [quantization-in-depth](https://www.deeplearning.ai/courses/quantization-in-depth) | Marc Sun, Younes Belkada | hero Instructor(s) 未列 Andrew Ng |
| course | [reasoning-with-o1](https://www.deeplearning.ai/courses/reasoning-with-o1) | Colin Jarvis | hero Instructor(s) 未列 Andrew Ng |
| course | [red-teaming-llm-applications](https://www.deeplearning.ai/courses/red-teaming-llm-applications) | Matteo Dora, Luca Martial | hero Instructor(s) 未列 Andrew Ng |
| course | [reinforcement-fine-tuning-llms-grpo](https://www.deeplearning.ai/courses/reinforcement-fine-tuning-llms-grpo) | Travis Addair, Arnav Garg | hero Instructor(s) 未列 Andrew Ng |
| course | [reinforcement-learning-from-human-feedback](https://www.deeplearning.ai/courses/reinforcement-learning-from-human-feedback) | Nikita Namjoshi | hero Instructor(s) 未列 Andrew Ng |
| course | [retrieval-augmented-generation](https://www.deeplearning.ai/courses/retrieval-augmented-generation) | Zain Hasan | hero Instructor(s) 未列 Andrew Ng |
| course | [retrieval-optimization-from-tokenization-to-vector-quantization](https://www.deeplearning.ai/courses/retrieval-optimization-from-tokenization-to-vector-quantization) | Kacper Łukawski | hero Instructor(s) 未列 Andrew Ng |
| course | [safe-and-reliable-ai-via-guardrails](https://www.deeplearning.ai/courses/safe-and-reliable-ai-via-guardrails) | Shreya Rajpal | hero Instructor(s) 未列 Andrew Ng |
| course | [semantic-caching-for-ai-agents](https://www.deeplearning.ai/courses/semantic-caching-for-ai-agents) | Tyler Hutcherson, Iliya Zhechev | hero Instructor(s) 未列 Andrew Ng |
| course | [spec-driven-development-with-coding-agents](https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents) | Paul Everitt | hero Instructor(s) 未列 Andrew Ng |
| course | [transformers-in-practice](https://www.deeplearning.ai/courses/transformers-in-practice) | Sharon Zhou | hero Instructor(s) 未列 Andrew Ng |
| course | [vector-databases-embeddings-applications](https://www.deeplearning.ai/courses/vector-databases-embeddings-applications) | Sebastian Witalec | hero Instructor(s) 未列 Andrew Ng |
| course | [vibe-coding-101-with-replit](https://www.deeplearning.ai/courses/vibe-coding-101-with-replit) | Michele Catasta, Matt Palmer | hero Instructor(s) 未列 Andrew Ng |
| course | [voice-for-ai-agents-and-applications](https://www.deeplearning.ai/courses/voice-for-ai-agents-and-applications) | Ashwyn Sharma | hero Instructor(s) 未列 Andrew Ng |
| specialization | [ai-for-good](https://www.deeplearning.ai/specializations/ai-for-good) | Robert Monarch | hero Instructor(s) 未列 Andrew Ng |
| specialization | [ai-for-medicine](https://www.deeplearning.ai/specializations/ai-for-medicine) | Pranav Rajpurkar | hero Instructor(s) 未列 Andrew Ng |
| specialization | [data-analytics](https://www.deeplearning.ai/specializations/data-analytics) | Sean Barnes | hero Instructor(s) 未列 Andrew Ng |
| specialization | [generative-ai-for-software-development](https://www.deeplearning.ai/specializations/generative-ai-for-software-development) | Laurence Moroney | hero Instructor(s) 未列 Andrew Ng |
| specialization | [mathematics-for-machine-learning-and-data-science](https://www.deeplearning.ai/specializations/mathematics-for-machine-learning-and-data-science) | Luis Serrano | hero Instructor(s) 未列 Andrew Ng |
| specialization | [natural-language-processing](https://www.deeplearning.ai/specializations/natural-language-processing) | Younes Bensouda Mourri, Łukasz Kaiser | hero Instructor(s) 未列 Andrew Ng |
| specialization | [pytorch-for-deep-learning-professional-certificate](https://www.deeplearning.ai/specializations/pytorch-for-deep-learning-professional-certificate) | Laurence Moroney | hero Instructor(s) 未列 Andrew Ng |
| specialization | [tensorflow-developer-professional-certificate](https://www.deeplearning.ai/specializations/tensorflow-developer-professional-certificate) | Laurence Moroney | hero Instructor(s) 未列 Andrew Ng |
