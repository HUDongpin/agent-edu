# aicourse.top Course 16–21 课程建设研究简报

文档状态：课程建设的一手来源基线，不是发布声明，也不是法律、医学或统计咨询  
研究与核验日期：2026-08-26（Asia/Taipei）  
适用课程：Course 16《Responsible AI》、17《AI Research》、18《AI Python & Data》、19《Machine Learning》、20《Deep Learning》、21《Production AI》  
内容语言合同：英文与简体中文正文已编写，发布前必须完成精确内容哈希绑定的人工审校；其余 7 个 locale 明示回退英文，不得伪装成已本地化  
配套溯源：[course-16-21-research-brief.provenance.md](./course-16-21-research-brief.provenance.md)

## 1. 可发布研究结论

六门课的模块合同可以按当前 manifest 建设，但不能把“有一个 source ID”当作证据完成。可发布内容必须同时满足：

1. 每个事实性主张都能回到官方文档、开放标准或原始研究；RAG、搜索摘要、教材、课程讲义和聚合站只可帮助定位，不能代替原文核验。
2. 易变页面显示产品/标准版本、发布日期或“rolling documentation”、访问日期与复核触发条件；法规另显示地区、适用对象、生效状态和核验日期。
3. 教学正文把稳定概念与实现示例分层。框架 API、软件默认值、法定期限和监管实施时间线不得写成跨版本永真规则。
4. 外部图、表、课程结构和案例不复制。课程使用原创合成数据、原创 semantic HTML/CSS/SVG 图、原创练习和原创评价量规；第三方材料默认只链接和改写。
5. 一次指标、一次测试、一次 artifact badge、一次 trace 或一份 model card 都不自动证明公平、正确、可复现、安全或可上线。

本简报覆盖 66 个模块和 97 个 canonical evidence records。这里的“97”是可审计来源记录数，不是 97 项相互独立的实验，也不表示所有地区、算法或工具均已穷尽。

## 2. 统一证据、版本与复用规则

| 标签 | 课程中的含义 | 发布要求 |
|---|---|---|
| `stable-concept` | 版本变化通常不改变的定义、数学关系或方法边界 | 引用原始研究/标准；仍写清适用前提 |
| `version-pinned` | 软件、API、规范或政策的具体版本事实 | 页面显示版本/日期；升级时重新验证 |
| `rolling-docs` | 无固定修订号的当前官方页面 | 显示 accessed 2026-08-26；每次发布重查 |
| `jurisdiction-bound` | 仅在指定地区、主体、场景和日期成立 | 附地区、法源层级、生效状态、核验日与再核验触发器 |
| `case-bounded` | 原始研究中的数据集、任务和结果 | 不写成跨人群、跨任务或跨部署的普遍效果 |
| `link-paraphrase` | 权利状态不足以支持复制 | 只链接、短引并原创改写；不复制图表、版式或长段文字 |
| `open-with-conditions` | 有明确开放许可或公共领域边界 | 保存许可、署名、版本及第三方材料例外 |

复用底线：

- NIST/美国联邦政府出版物可在其美国政府作品边界内重用，但仍须署明来源，并排除文件中另有权利标记的第三方材料。
- ISO 全文、摘要、样例、表格与条款不进入课程；只把官方 reference number、标题、edition/date 和链接作为书目元数据。官方页面当前还明确限制材料用于 AI；购买或免费阅读不等于获得改编权。
- 论文默认“引用与改写”，除非逐项确认 CC BY/CC0 等许可。开放访问不等于开放改编。
- 软件仓库的代码许可证不自动覆盖官网文字、商标、截图和第三方示例；课程代码与图示重新原创。
- Google SRE 在线图书标示 CC BY-NC-ND 4.0；只链接与概括，不改编其图表或页面。
- 法规原文只作必要的短引和准确释义；课程必须提示“非法律意见”，并链接当前官方文本。

## 3. 当前 manifest source IDs 的处置

处置码：**A**＝可直接采用，但仍需保存元数据；**B**＝可采用，必须钉版本/写边界；**R**＝当前锚点不满足课程证据合同，需替换或重定义。

### Course 16 — Responsible AI

| 处置 | 当前 source IDs | 研究决定 |
|---|---|---|
| A | `nist-ai-rmf`, `oecd-ai-principles`, `oecd-privacy`, `nist-privacy-framework`, `gender-shades`, `uncertainty-calibration`, `model-cards`, `datasheets`, `unesco-ai-ethics`, `nist-genai-profile` | 分别绑定 RA01、RA03、RA05–RA07、RA10–RA13、RA15；论文结果保留任务边界，NIST/OECD/UNESCO 保留自愿性或法源层级 |
| B | `algorithmic-impact-assessment`, `fairlearn-user-guide`, `eu-hleg-human-agency` | Canada AIA 只适用于其联邦行政决策合同；Fairlearn 是 rolling docs 且公平是社会技术问题；EU HLEG 2019 是历史性非约束指南，不能代替现行 EU AI Act |
| R | `system-cards`, `ai-incident-database` | `system-cards` 改为 RA03+RA12+RA13 支持的课程原创 system assurance card；`ai-incident-database` 不以聚合库作核心证据，改为 RA03、RA02 和 PA17 的官方风险/事件响应资料 |

### Course 17 — AI Research

| 处置 | 当前 source IDs | 研究决定 |
|---|---|---|
| A | `osf-preregistration`, `prisma-2020`, `prisma-search`, `cochrane-search`, `cochrane-selection`, `cochrane-bias`, `cochrane-data-collection`, `crossref-rest`, `niso-jats`, `asa-pvalues`, `tidy-data`, `entreq`, `coreq`, `acm-artifact-review`, `icmje-ai` | 绑定 RE01–RE04、RE08–RE09、RE11–RE16 与 PY06；报告指南不等于研究质量，metadata 验证不等于内容真实性 |
| B | `grade-handbook`, `tabula` | 旧 GRADE Handbook（2013）正被 2024 起的新 GRADE Book 分章替换，须指向当前章节；Tabula 只作工具练习，PDF 结构与抽取误差由 RE06–RE07 约束 |
| R | — | 模块 6 需新增 RE10（RAG 原始论文）并把 RAG 明确限定为 locator；模块 8 建议加 RE14（SRQR），避免把 COREQ 外推到所有定性设计 |

### Course 18 — AI Python & Data

| 处置 | 当前 source IDs | 研究决定 |
|---|---|---|
| A | `python-venv`, `python-tutorial`, `python-errors`, `typing-spec`, `numpy-quickstart`, `pandas-user-guide`, `tidy-data`, `pandas-missing`, `nist-stat-handbook`, `matplotlib-guide`, `python-csv`, `pandas-merge` | 绑定 PY01–PY02、PY04–PY09、PY11；软件页钉当前主版本，统计概念与 API 行为分开 |
| B | `jupyter-reproducibility`, `pytest-docs`, `frictionless-data`, `scipy-stats`, `requests-docs` | Jupyter/pytest/Frictionless/SciPy/Requests 都是 rolling project docs；教学环境锁定版本，HTTP/JSON 语义另由 PY10 的开放标准约束 |
| R | `data-visualization-society`, `ed-fixture-datasheet` | 社群页面不作“诚实图表”规范，改用 PY09+RE11 并原创反例；`ed-fixture-datasheet` 保留为原创教学 artifact，不作为外部证据，证据改为 PY12+RA13 |

### Course 19 — Machine Learning

| 处置 | 当前 source IDs | 研究决定 |
|---|---|---|
| A | `sklearn-common-pitfalls`, `sklearn-linear-models`, `sklearn-logistic`, `sklearn-preprocessing`, `sklearn-regularization`, `sklearn-ensemble`, `sklearn-model-evaluation`, `precision-recall`, `sklearn-calibration`, `calibration-paper`, `sklearn-clustering`, `sklearn-outlier`, `ncf-paper`, `model-cards` | 绑定 ML01–ML10、RA11–RA12；scikit-learn 页面钉 1.9.x，论文结论不写成普遍优越性 |
| B | `ml-test-score` | 可作为 Google 原始工程研究，但量规是 production-readiness 启发式且论文受版权保护；只引用/概括，不复制表格 |
| R | `islr`, `stanford-cs229`, `recommender-handbook` | 教材与课程讲义不作核心证据；分别改为 ML02+ML04、ML03、ML10 的官方文档和原始研究 |

### Course 20 — Deep Learning

| 处置 | 当前 source IDs | 研究决定 |
|---|---|---|
| A | `backprop-paper`, `batchnorm-paper`, `dropout-paper`, `cnn-paper`, `lstm-paper`, `attention-paper`, `transformer-paper`, `sentencepiece-paper`, `bert-paper`, `lora-paper`, `model-cards`, `robustness-paper` | 绑定 DL02、DL04、DL06、DL08–DL13 与 RA12；原始论文只支持其定义、实验和条件，不保证新任务结果 |
| B | `pytorch-tensors`, `pytorch-autograd`, `pytorch-optim`, `pytorch-training`, `ml-test-score`, `pytorch-cnn-tutorial`, `pytorch-transfer`, `pytorch-sequence`, `pytorch-transformer`, `huggingface-peft`, `pytorch-reproducibility` | 官方 rolling docs 需钉 PyTorch/PEFT 版本；教程实现不等于算法规范，硬件/确定性边界必须显示 |
| R | `transfer-survey` | 综述不是本课程的一手核心证据；改用 DL07 的官方 PyTorch 教程，加清楚的数据域/任务域与冻结/微调比较 |

### Course 21 — Production AI

| 处置 | 当前 source IDs | 研究决定 |
|---|---|---|
| A | `google-sre-slo`, `ml-test-score`, `tfx-pipelines`, `mlmd-docs`, `acm-artifact-review`, `model-cards`, `slsa-spec`, `google-sre-canary`, `openfeature-spec`, `opentelemetry-spec`, `google-sre-monitoring`, `google-sre-incident`, `nist-ai-rmf` | 绑定 PA01–PA03、PA10、PA13–PA16、ML11、RE15、RA01/RA12；保持“官方实践/开放规范/研究”各自层级 |
| B | `dvc-docs`, `mlflow-tracking`, `mlflow-registry`, `kserve-docs`, `tensorflow-serving`, `owasp-secrets` | 都是具体实现或 rolling docs；课程概念由 PA03–PA14 支持，实验环境另锁版本，不能宣称跨平台语义一致 |
| R | `drift-paper`, `nannyml-docs` | `drift-paper` 必须明确重定义为 PA15 的 TFDV 原始研究；NannyML 是供应商文档，不作核心事实来源。漂移信号不等于质量下降，须配带标签的持续评测 |

## 4. Course 16 — Responsible AI（10 modules）

课程总边界：教授可审计的风险判断、文件与治理动作；不把伦理原则当法律，不把合规清单当安全证明，也不训练学员在缺少当地律师/隐私负责人/领域专家时作最终法定判断。

| # / module | 可稳定讲授的主张 | 必须写出的边界 | 一手锚点 | 原创 fixture / 图示建议 |
|---:|---|---|---|---|
| 1 `purpose-risk-classification` | 风险分类从预期用途、受影响者、决策权、严重度、概率和可逆性开始；风险是情境属性，不是模型名称属性 | NIST AI RMF 是自愿框架；“高风险”法律分类必须回到具体法域，不得由课程自创标签替代 | RA01, RA06, RA16–RA17 | 同一模型在“练习反馈/招生筛选/纪律处分”三个用途的风险卡；原创二维可逆性×影响图 |
| 2 `stakeholders-impact-assessment` | 影响评估要覆盖直接使用者、被决策者、非使用者、运营者、救济负责人和受外溢影响群体，并保存假设/证据/责任人 | Canada AIA 只约束其联邦行政决策范围；一张 stakeholder map 不能证明已充分参与 | RA01, RA08, RA14 | 合成学校案例的 power–impact–voice ledger；缺席利益相关者故障注入 |
| 3 `data-rights-privacy-minimisation` | 建立数据目的、字段、来源、合法/治理依据、保留、共享、删除与访问权台账；只收集实现明确目的所必需的数据 | 最小化不是简单“字段越少越好”；具体合法基础、儿童数据和跨境规则因法域而异 | RA05, RA07, RA18, RA23–RA25 | 30 字段教育数据表，学员逐字段给 keep/drop/aggregate 与理由；原创生命周期图 |
| 4 `fairness-subgroup-audit` | 报告总体和预先定义子群的基数、错误率/选择率、置信区间与缺失性；阈值与指标选择要回到伤害模型 | 单一 parity 指标不能证明公平；小样本差异不宜作确定结论；Gender Shades 结果仅限其任务/数据 | RA04, RA09, RA10 | 完全合成的四子群混淆矩阵，展示相同总体分数掩盖差异；禁止复制论文图 |
| 5 `explainability-uncertainty-limitations` | 区分机制解释、局部/全局近似、置信/校准、不确定性、已知限制与未知条件；表达“何时不应依赖” | 概率输出不自动校准；解释不等于因果、正确、公平或可申诉；温度缩放结果不能外推所有模型 | RA01, RA11, RA14 | 原创 reliability diagram 与“解释主张—验证方法—失效条件”卡 |
| 6 `model-data-system-cards` | 模型卡记录用途、性能、限制；datasheet 记录数据动机、组成、收集、处理与维护；系统级文件要交叉链接模型、数据、人和操作控制 | “system card”没有一个跨机构统一标准；有卡片不等于内容真实或控制有效 | RA03, RA12, RA13 | 课程原创 assurance-card schema；让学员查找模型卡与数据表之间的矛盾 |
| 7 `human-authority-oversight-boundaries` | 人类监督必须定义谁能看见什么、何时介入、能否暂停/覆盖/回滚、需要何种能力、如何记录；保留真正决定权 | “human in the loop”若只有形式点击并不能降低风险；2019 EU HLEG 指南非现行法律替代品 | RA01–RA02, RA14, RA16–RA17 | override 状态机：observe→challenge→pause→decide→record；模拟自动化偏误与权限不足 |
| 8 `escalation-appeal-contestability` | 救济需要通知、可理解理由、证据访问、申诉渠道、独立复核、时限、结果与改正记录 | 不同法域的申诉权和法定期限不同；可解释输出不能代替程序性正义或法定救济 | RA02, RA08, RA15–RA18, RA21–RA23 | 合成拒绝决定的双轨流程：运营升级与个人申诉；测量“能否真正改变结果” |
| 9 `red-teaming-incidents-disclosure` | 红队测试从威胁/伤害假设出发，保存输入、环境、结果、严重度和修复；事件响应覆盖检测、遏制、恢复、沟通、复盘 | 红队发现数量不是安全分数；公开事件聚合库不是完整母体；披露义务因行业/法域而异 | RA02–RA03, PA16–PA17 | 原创 tabletop：提示注入、隐私泄漏、偏差升级与服务降级；事件时间线与证据包 |
| 10 `governance-dossier-capstone` | go/no-go 决策包应交付用途、风险、影响、数据、测试、卡片、监督、救济、事件、负责人、残余风险和复核日期 | ISO 认证/文件齐全不证明具体系统安全或合法；课程不得授予“合规”结论 | RA01–RA03, RA06；RA26–RA27 只显示标准书目元数据 | 原创证据图：每项上线主张必须指向测试、责任人与有效期；含 no-go 路径 |

### Course 16 法规附录：地区、版本与核验边界

附录必须以“非穷尽、非法律意见、上线前由当地专业人员复核”为页首提示。任何日期都不得只写在正文；需结构化保存 `jurisdiction`, `instrument`, `official_url`, `instrument_type`, `scope`, `version_or_date`, `effective_state`, `verified_on`, `recheck_trigger`。

| 地区/法源 | 当前可讲的范围（核验于 2026-08-26） | 不能外推 | 再核验触发器 |
|---|---|---|---|
| 欧盟：Regulation (EU) 2024/1689 + Commission implementation pages | AI Act 2024-08-01 生效；官方 Commission 页面反映 2026 AI Omnibus 后分阶段适用时间线；GDPR 仍单独约束个人数据和自动化决定 | 风险类别、义务、例外和日期不能由摘要替代法条；Commission overview 自称非约束，不能替代 OJ/合并文本 | 每次课程发布；Commission timeline 或 OJ consolidated text 改动；法院/主管机关新解释 |
| 欧洲委员会：CETS No. 225 | 2024-09-05 开放签署的 AI、人权、民主与法治框架公约 | 签署、批准、对某国生效是不同状态；不得称“欧洲所有国家已适用” | Treaty Office 状态、批准/加入、保留或领土声明变化 |
| 美国联邦：NIST AI RMF / FTC enforcement hub | NIST RMF 是自愿风险框架；执法需回到具体机关权限和既有法律 | 不得暗示存在一部覆盖所有 AI 的联邦通用法，也不得把 NIST 当强制合规 | 联邦法/规则/法院变化；NIST AI RMF 2.0 正式发布 |
| 纽约市：Local Law 144 / DCWP rules | 对特定 automated employment decision tools 的年度 bias audit、公开摘要与通知要求；DCWP 2023-07-05 开始执法 | 只覆盖法定定义和纽约市范围；审计不自动证明无歧视或其他法律合规 | DCWP rule/FAQ、法院判例或地方修法 |
| 科罗拉多州：2026 ADMT/Chatbot legislation | Colorado AG 当前页说明 SB26-189 重构旧 SB24-205 框架，ADMT Act 与 Chatbot Safety Act 计划 2027-01-01 生效；2026-08-11 提案规则尚非最终 | 不得沿用旧 SB24-205 摘要；提案规则不能写成现行最终义务 | 最终规则、实施指引、诉讼或生效日期变化；至少 2027-01-01 前复核 |
| 加拿大联邦：Directive on Automated Decision-Making + AIA | 只覆盖加拿大联邦机构的指定行政决定；AIA 是 Directive 下的强制风险评估工具，页面 2025-06-24 修订 | 不适用于所有加拿大私营/省级场景；研究/测试等排除和过渡条件需看 Directive | Directive/AIA 题库、适用范围或强制要求更新 |
| 中国大陆：生成式 AI 服务管理暂行办法 | CAC 等部门 2023-07-10 公布，2023-08-15 施行；核心范围是向中国境内公众提供生成式 AI 服务 | 不等于所有内部模型、科研活动或其他算法规则；数据/网安/个人信息义务需另查适用法律 | CAC/国务院新规、备案/标识规则、司法或执法解释 |
| 英国：ICO AI and data-protection guidance + DUAA 2025 | ICO 明示 AI 指引正因 Data (Use and Access) Act 2025 审查；ICO 页面说明相关数据保护条款截至 2026-06-19 已全面生效 | 指引不是 statutory code，也只覆盖数据保护；不得把审查中内容写成稳定最终解释 | ICO 完成更新、二级法规/法院解释或 DUAA 实施资料变化 |
| 新加坡：PDPC Model AI Governance Framework, 2nd ed. | 2020-01-21 第二版，自愿治理框架，可用于角色、决策和运营控制教学 | 不是普遍强制法，也不能代替 PDPA/部门规则 | PDPC 新版框架、AI Verify/行业规则或 PDPA 指引更新 |
| 香港：PCPD Model Personal Data Protection Framework for AI | 2024-06 指引，帮助机构在 PDPO 个人资料保护边界内治理 AI | 是隐私监管指引，不是完整 AI 安全法；不覆盖所有非个人资料伤害 | PCPD 指引、PDPO 修法或执法决定变化 |

法规附录发布门：每一地区行若 `verified_on` 超过 90 天，或官方页面显示草案/审查中/未来生效，课程 UI 必须显示“需复核”，不能静默沿用。

## 5. Course 17 — AI Research（10 modules）

课程总边界：教授可复核的研究过程，而不是“一键生成论文”。搜索覆盖、筛选决定、抽取误差、分析选择、AI 使用和不确定性都必须留痕；课程不允许把 RAG 输出、Crossref metadata、PDF 文本抽取或报告清单当作原文结论。

| # / module | 可稳定讲授的主张 | 必须写出的边界 | 一手锚点 | 原创 fixture / 图示建议 |
|---:|---|---|---|---|
| 1 `question-protocol-preregistration` | 在看结果前写研究问题、范围、检索/筛选/抽取/分析方案、偏离处理和停止条件；OSF registration 可形成带时间戳的只读记录 | preregistration 不会自动改善设计，也不禁止有理由的探索；偏离应披露而非掩盖 | RE01–RE02 | 同一问题的 protocol v1、timestamped registration 与 deviation log；原创“计划/探索”双轨图 |
| 2 `transparent-search-search-log` | 保存数据库/平台、完整查询、字段、日期、限制、结果数、去重规则和导出指纹；PRISMA-S 支持可复核报告 | “检索全面”依赖主题、数据库、语言和灰色文献；搜索引擎排序/索引会变，不能保证永久复现同一结果 | RE03–RE04 | 合成三数据库导出与去重 ledger；查询变化用 diff 显示，不复制其他课程搜索模板 |
| 3 `screening-inclusion-exclusion` | 先定义资格标准；标题摘要与全文阶段分开；保存 reviewer、决定、理由、冲突解决和流程计数 | PRISMA flow diagram 是报告工具，不证明筛选无误；AI 分类器只能辅助，边界样本仍需人工复核 | RE02, RE04 | 20 条合成 citation cards，含灰区与冲突；原创 flow counts 自动平衡检查 |
| 4 `evidence-hierarchy-claim-source-ledger` | 证据权重取决于问题、设计、偏倚、间接性、不精确与一致性；每个可发布 claim 指向原文位置、设计、支持强度和反证 | 不存在适用于所有问题的单一“证据金字塔”；旧 GRADE handbook 正分章迁移，GRADE 主要面向健康证据与建议 | RE04–RE05, RE17 | claim–source ledger：同一主张挂支持、反对、间接、未报告四种关系；原创网络图 |
| 5 `pdf-table-extraction-boundaries` | PDF 是呈现/结构容器；文本、表格、脚注、扫描/OCR 和 reading order 可能被错误抽取；每个关键值回到页码/表格单元核对 | 工具成功导出不等于语义正确；Tabula/GROBID 的表现取决于布局、语言和任务；PDF 2.0 规范不保证具体文件合规 | RE04, RE06–RE07 | 原创双栏 PDF、跨页表和合并单元格 fixture，提供 gold extraction 与错误分类 |
| 6 `citation-verification-rag-locator` | DOI/metadata API 用于标识和定位；JATS 可表达文章结构；RAG 可召回候选片段，但最终 claim 需核对原文、版本、页/段和上下文 | Crossref metadata 不验证事实真伪或全文权利；JATS 缺字段不等于原文没有；RAG citation 可能错配、截断或遗漏 | RE08–RE10 | 给出 8 个相似题名/版本，要求核 DOI、作者、年份、页码和原句；RAG 只输出 locator envelope |
| 7 `quantitative-analysis-boundaries` | 预先定义 estimand、单位、样本、缺失、模型、假设、效应量、区间与敏感性；p 值不衡量效应大小或单独决定重要性 | tidy 结构不等于统计有效；bootstrap/检验依赖抽样与交换性等假设；显著不等于实际或因果重要 | RE11, PY06, PY08 | 合成数据展示相同 p 值、不同效应/样本；原创 assumption–diagnostic–action 表 |
| 8 `qualitative-synthesis-boundaries` | 明确认识论/方法、材料范围、编码单位、研究者角色、主题生成、负例、差异与可转移性；定性综合不只是摘要拼接 | COREQ 只面向访谈/焦点小组报告；ENTREQ 面向定性证据综合；SRQR 是报告建议，三者都不证明分析可信 | RE12–RE14 | 12 段原创访谈文本；双人编码、反例 memo、审计轨迹与“未达饱和”说明 |
| 9 `reproducibility-uncertainty-ai-disclosure` | 保存环境、代码、数据/访问边界、seed、参数、日志、失败、产物指纹和 AI 工具用途；区分 artifact available、functional、reusable 与 reproduced | badge 是特定审查结论，不证明全局正确；不可公开的数据要给受控访问/合成替代，不得虚构可复现性；AI 不能列为作者 | RE15–RE17, PY02–PY04 | 原创 reproduction package，故意注入缺依赖与隐藏 prompt；学员生成 machine-readable disclosure |
| 10 `auditable-mini-review-capstone` | 从 protocol 到 search、screening、extraction、claim ledger、synthesis、uncertainty、AI disclosure 和变更日志形成闭环 | 小型教学综述不得包装成穷尽性系统综述；证据缺口必须保留，不用生成式文本填补 | RE01–RE04, RE08, RE15–RE17 | 10–15 篇开放原始资料的 bounded mini-review；每句结论能反向追到 source locator |

### Course 17 发布门

- 每条纳入/排除决定有 reviewer、时间与理由；随机抽样复核和冲突率可计算。
- 每个数值、引文和结论保存 `source_id + version + locator + extraction_method + verifier + verified_on`。
- 抽取系统的 gold fixture 测试与真实语料抽查分开；只通过 fixture 不宣称真实语料全正确。
- AI disclosure 说明用途、模型/工具、人工核验、无法公开的输入和已知失败，不披露隐藏 chain-of-thought。

## 6. Course 18 — AI Python & Data（10 modules）

课程总边界：以可复现、可审计的数据工作为主线，不把 Python 语法熟练等同于统计能力，也不使用真实学生个人资料作公开练习。默认 fixture 完全合成，数据文件建议以 CC0-1.0 发布，生成器代码沿项目代码许可，另附 datasheet、schema、seed、generator version 与 checksum。

| # / module | 可稳定讲授的主张 | 必须写出的边界 | 一手锚点 | 原创 fixture / 图示建议 |
|---:|---|---|---|---|
| 1 `environment-notebooks-seeds-reproducibility` | 记录 Python/包/OS/硬件版本、锁文件与执行顺序；`venv` 应可重建而非搬运；显式 seed 有助于重复特定伪随机流 | 同一 seed 不保证跨库/版本/硬件逐位相同；notebook 有隐藏状态与乱序执行风险；伪随机数不用于密码学 | PY01–PY05 | 环境 receipt + `run-all` 前后输出 diff；同 seed 跨版本边界卡 |
| 2 `execution-values-functions-state` | 名称绑定、可变对象、作用域、参数/返回值与显式 state 能解释大多数 notebook 行为；小型纯函数便于测试 | Python 教程示例不是形式语言规范；可执行成功不等于逻辑正确或无副作用 | PY01 | 乱序单元造成陈旧变量的 notebook；重构为显式输入/输出的函数 DAG |
| 3 `tests-errors-types-debugging` | 测试应覆盖预期、边界和失败；保留异常类型/上下文；类型提示帮助工具检查但运行时通常不强制 | 100% coverage 不证明正确；捕获所有异常会掩盖错误；type-check pass 不证明数据满足业务约束 | PY01, PY04 | 有意含 NaN、空表、错误 schema 和除零的函数；生成 failing-test ledger |
| 4 `numpy-arrays-vectorisation` | ndarray 有 shape、dtype、axis、broadcasting 和 view/copy 语义；向量化常减少 Python 层循环并暴露维度契约 | 向量化不保证更快/更省内存；广播可能产生静默语义错误；浮点运算不是实数精确运算 | PY05 | shape puzzle 与广播错误热图；对 loop/vectorized 版本测正确性和资源而非只测速度 |
| 5 `pandas-tidy-tabular-data` | tidy data 让变量、观测、值与表结构清晰；索引、dtype、键和 cardinality 应显式记录 | tidy 是有用组织原则，不是适合所有数据模型；pandas 默认行为随主版本变化 | PY06 | 宽/长教育成绩合成表；每次 reshape 保存键唯一性与行数守恒 |
| 6 `cleaning-missingness-validation-provenance` | 区分缺失、无效、未适用和被抑制；每个清理动作记录输入、规则、影响行数、输出和验证 | `dropna`/均值填补不是中性默认；schema-valid 不证明值真实；缺失机制不能只靠数据自动判定 | PY07, RA13 | 同一空值编码为 `""`, `NA`, `-99`, suppressed 的 fixture；可逆 cleaning ledger |
| 7 `descriptive-statistics-sampling-uncertainty` | 区分总体/样本、中心/离散、标准误/分布、描述/推断；区间与 bootstrap 都依赖抽样设计和假设 | 非概率样本不能仅靠大 n 修复代表性；bootstrap 不适合所有依赖/小样本结构；描述相关不等于因果 | PY08, RE11 | 分层抽样与便利样本并排；用原创点图展示相同均值不同分布 |
| 8 `visualisation-honest-charts` | 图必须标单位、分母、时间、缺失、尺度、基线与不确定性；图形编码要与问题匹配，并提供可访问文字摘要 | 截断轴不总是错误，但必须显著说明；漂亮图不证明数据质量；颜色不能作为唯一信息通道 | PY09, RE11 | 同一合成数据的误导/修正版小倍图；检查对比度、色盲、键盘和 alt text |
| 9 `files-apis-joins-reproducible-pipelines` | 明示字符编码、delimiter、schema、HTTP 状态/重试/分页、主外键、join cardinality、输入 checksum 与输出版本 | CSV 无内建类型；API JSON shape 可能变；pandas 会让 null keys 彼此匹配而 SQL 通常不同；成功请求不等于完整数据 | PY10–PY11 | 固定 CSV+JSON API cassette，含分页、重复键、null key 与 schema drift；pipeline receipt |
| 10 `education-data-audit-capstone` | 审计数据字典、来源、许可/权利、个人资料、代表性、缺失、键、清理、统计、图表、限制与复现包 | CEDS 是互操作参照，不是本地政策或数据质量认证；合成 fixture 不能代表真实学生分布或隐私风险全貌 | PY12, RA13, RA18 | 完全合成的 school/course/student pseudonymous 数据包；必须通过 schema、join、missingness、rights 与 leakage 审计 |

### 固定教育数据 fixture 的权利与技术合同

```text
data_license: CC0-1.0 (only if generated wholly by this project)
generator_code_license: repository code license
contains_real_people: false
contains_real_institutions: false
contains_personal_data: false
seed / generator_version / schema_version / checksums
intended_uses / prohibited_interpretations
known_artificialities / subgroup-construction rationale
```

若任何字段改编自真实公开微数据，必须改写为该数据集的真实许可、署名和用途限制，不能继续标 CC0。真实机构名称即使公开也不应进入默认 fixture；合成数据必须显著标记，不允许被当作真实教育统计发布。

## 7. Course 19 — Machine Learning（12 modules）

课程总边界：模型选择以任务、数据生成过程、决策代价和可验证 baseline 为起点。教学结果不得把训练分数、随机 split、单一 leaderboard、feature importance 或聚类标签写成因果、稳定人群类型或部署许可。

| # / module | 可稳定讲授的主张 | 必须写出的边界 | 一手锚点 | 原创 fixture / 图示建议 |
|---:|---|---|---|---|
| 1 `framing-baselines-splits` | 先定义预测时点、单位、标签、可用特征、决策和成本；建立 naïve baseline；按时间、群组或实体依赖设计 train/validation/test | 随机 split 不适合所有时间/学生/学校结构；test set 反复使用会成为训练信号；好预测不等于好决策 | ML01, ML11 | 合成学生事件流，随机 split 看似优秀但 time split 失败；split contract 记录 leakage routes |
| 2 `linear-regression-loss-residuals` | 线性回归连接设计矩阵、系数、预测、损失与残差；残差图可发现某些形式的模型失配 | 系数不是自动因果效应；同一预测关系在分布变化后可能失效；同方差/独立等假设需具体检查 | ML02 | 原创非线性+异方差数据，展示相似 R²、不同残差；单位变化压力测试 |
| 3 `logistic-regression-classification` | logistic model 输出条件概率模型并可作为强 baseline；分类决定另需阈值和代价 | 类别概率未必校准；odds coefficient 不等于概率差；分类准确率不能替代实际决策效用 | ML02, ML06–ML07 | 同一 scores 上三种阈值政策；概率、odds、label 三层分开图 |
| 4 `optimisation-scaling-features` | 数值尺度、condition、特征变换与优化器影响收敛；所有数据依赖变换只在 training fold 拟合 | scaling 不是所有模型都需要；收敛警告不能仅靠增加迭代掩盖；高维特征工程增加 leakage 面 | ML03, DL03 | 单位相同信息不同尺度的等高线/优化轨迹；故意在 split 前 fit scaler 的失败测试 |
| 5 `regularisation-bias-variance` | 正则化约束复杂度；超参数在验证流程内选择；学习曲线帮助区分数据/容量/优化问题 | L1 非稳定的“真特征选择器”；bias–variance 是分析视角，不是单一数字；交叉验证不消除数据偏差 | ML01, ML04 | 高相关特征下 LASSO 选择不稳定；多 seed coefficient path 与学习曲线 |
| 6 `trees-ensembles` | 树通过递归分割形成非线性规则；bagging/forest 聚合多棵树可改善方差与鲁棒性条件 | feature importance 可偏置且不是因果；ensemble 不保证胜过简单 baseline；外推到训练范围外通常弱 | ML05 | 合成阈值交互数据；permutation 与 impurity importance 冲突的原创图 |
| 7 `imbalanced-data-metrics` | 在不平衡任务报告 confusion matrix、precision、recall、specificity、PR/ROC、base rate 与不确定性；指标选择随错误成本 | “class imbalance”本身不规定重采样；PR 优势取决于任务；单一 F1 不能表达所有利益相关者成本 | ML06 | 1%、10%、50% prevalence 保持 score 分布的 metric shift；政策成本表 |
| 8 `calibration-thresholds-error-analysis` | 区分 ranking、probability calibration 和 decision threshold；用独立数据校准/选阈值；按错误类型和子群检查 | temperature scaling 等方法的实验结果是 case-bounded；同分布校准不保证分布外校准；阈值不是伦理结论 | ML07, RA11 | 原创 reliability diagram、cost curve 与 20 个错误卡；禁止只报 ECE 一个数 |
| 9 `clustering` | 聚类是给定表示、距离、算法和参数下的结构发现；用稳定性、内部指标和领域解释共同审查 | cluster ID 没有自然语义/顺序；聚类不能自动发现真实人格或能力类型；DBSCAN 对尺度/密度敏感 | ML08 | 两月形、不同密度与缩放后的合成点；同数据多算法/参数对照 |
| 10 `anomaly-detection` | 明确 outlier detection 与 novelty detection；阈值、污染率、特征表示和人工复核共同决定告警 | 异常不是欺诈、伤害或错误的证明；无标签指标不能证明业务效果；新群体可能被系统性误报 | ML09 | 合成传感/学习事件，包含合法新模式；alert queue 记录 false alarm 与 reviewer override |
| 11 `recommender-systems` | 建立 popularity 与 matrix-factorization baseline；用时间 split、ranking 指标、coverage、novelty 和用户/项目冷启动评测 | 离线提升不等于在线福祉；NCF 论文不证明对所有数据优于 MF；反馈循环、曝光偏差和伤害需另测 | ML10 | 完全合成的 learner–resource implicit matrix；冷启动、popular-only 与 exposure log |
| 12 `leakage-reproducibility-model-card-capstone` | 以 pipeline 防止预处理泄漏，锁定数据/代码/环境/seed，报告切分、baseline、子群、校准、限制与 no-deploy 条件 | model card 是文件而非认证；复现实验不证明部署安全；教育支持模型不能自动作高影响惩罚决定 | ML01, ML11, RA12 | 原创 student-support model card，要求发现 target leakage 后转为 no-go 并留下修复计划 |

## 8. Course 20 — Deep Learning（12 modules）

课程总边界：先证明 tensor、gradient、training loop 和 baseline 正确，再扩展网络规模。教程不把昂贵训练、预训练权重或 benchmark 结果包装成普遍能力；所有实验说明硬件、软件、seed、确定性限制、数据权利与计算成本。

| # / module | 可稳定讲授的主张 | 必须写出的边界 | 一手锚点 | 原创 fixture / 图示建议 |
|---:|---|---|---|---|
| 1 `tensors-computational-graphs` | tensor 的 shape/dtype/device/stride 与算子构成计算；autograd 记录需要梯度的运算关系 | tensor 不是普通数学数组的完全等价物；in-place、detach、device 和 broadcasting 可改变梯度/语义 | DL01 | 手工 shape ledger 与原创小计算图；每条边显示 shape/dtype/device |
| 2 `backpropagation-autodiff` | 反向模式自动微分应用链式法则计算 vector–Jacobian products；finite differences 可作小规模 gradient check | autodiff 计算给定程序的导数，不证明目标函数正确；非光滑点、数值误差和随机层会影响检查 | DL01–DL02 | 3 参数网络手算+autograd+finite-difference 三方核对；有意插入 `detach` |
| 3 `optimisation-initialisation-normalisation-regularisation` | 学习率、初始化、优化器、normalisation 与 regularisation 共同影响训练动态；Adam、BatchNorm、Dropout 是具体方法 | 论文结果依数据/架构；BatchNorm 的 train/eval 行为不同；Dropout/weight decay 不是通用最优组合 | DL03–DL04 | 小型 MLP 的 controlled ablation；相同计算预算、多 seed 稳定性图 |
| 4 `training-loops-debugging` | 明确 train/eval mode、zero grad、forward、loss、backward、step、validation、checkpoint 和日志；从单 batch overfit 起调试 | loss 下降不证明泛化或数据正确；`detect_anomaly` 有性能成本；可复现性受平台和非确定算子限制 | DL05, ML11 | 逐步故障注入：忘记 zero grad/eval mode/label shift；训练 receipt 与恢复测试 |
| 5 `cnns-visual-representations` | convolution 的局部连接、共享权重和层级表示适合网格数据；残差连接可帮助深网络训练 | 图像 benchmark 不代表真实教育视觉任务；saliency 不自动解释因果；更深不保证更好 | DL06 | 合成几何形状数据，比较 linear/CNN/ResNet-like baseline；原创 receptive-field 图 |
| 6 `transfer-learning` | 比较固定特征提取与全/部分微调；记录源数据、目标任务、冻结层、学习率和数据规模 | 迁移可能负迁移；预训练数据权利/偏差不可由性能替代；官方教程是实现例，不是通用收益保证 | DL07 | 同一小数据任务的 scratch/frozen/fine-tuned 三路；记录成本与 worst-group 结果 |
| 7 `sequence-models-rnns-lstms` | RNN 递归处理序列状态；LSTM 以门控与 cell state 缓解部分长期依赖训练问题 | 缓解不等于消除梯度问题；padding/masking/长度分布与 teacher forcing 会改变结果 | DL08 | 合成括号/事件序列，长度外推测试；展开时间图和 mask 单元测试 |
| 8 `attention` | attention 通过 query/key/value 兼容性加权聚合表示，可让解码器选择相关上下文 | attention weight 不自动等于人类解释或因果归因；计算/内存成本随实现和序列长度变化 | DL09 | 4-token 手算 attention；交换无关 token 检验权重与输出稳定性 |
| 9 `transformer-encoder-decoder` | Transformer 以 self-attention、feed-forward、residual、normalisation 与位置表示构造 encoder/decoder；mask 控制信息可见性 | 原论文架构不是所有现代模型；attention complexity 与 KV cache 等属于具体实现；错误 mask 会泄漏未来信息 | DL10 | 原创 encoder/causal mask 网格；同 batch 做 future-token leakage test |
| 10 `tokenisation-pretraining` | tokenizer 定义文本到 token IDs 的可逆/近似处理边界；预训练目标和语料决定可学习信号；SentencePiece 与 BERT 是具体方法 | token 数不是词数；不同语言/脚本成本不同；预训练性能不证明事实性、安全或合法数据来源 | DL11 | 英文/简中/数字/emoji/罕见字符 tokenisation audit；不复制模型词表或私有语料 |
| 11 `fine-tuning-parameter-efficient-adaptation` | 全量微调与 PEFT 在可训练参数、显存、checkpoint 和合并方式上不同；LoRA 以低秩更新为具体方法 | 参数更少不保证更优、更安全或更便宜的全生命周期；PEFT API 是 rolling docs；基础模型许可仍适用 | DL12 | 小型线性层 LoRA 形状/参数计算；full/LoRA/frozen 的质量–成本–风险表 |
| 12 `robustness-evaluation-training-card-capstone` | 在干净、扰动、子群、分布外和多 seed 条件评测；训练卡记录数据、架构、资源、失败、限制、权利和停止条件 | ImageNet-C 是特定 corruption benchmark；鲁棒分数不证明安全；training card 不替代独立验证和上线批准 | DL13, RA12, DL05 | 原创合成 corruption suite（blur/noise/occlusion/shift）与 training card；至少一个 no-train/no-deploy 判定 |

## 9. Course 21 — Production AI（12 modules）

课程总边界：把“模型可运行”与“服务可负责地运营”分开。生产系统需同时管理数据/传统 ML 与生成式/检索链路；任何平台文档只是实现示例，不能隐含 exactly-once、无漂移、无停机、无成本上限或自动合规。

| # / module | 可稳定讲授的主张 | 必须写出的边界 | 一手锚点 | 原创 fixture / 图示建议 |
|---:|---|---|---|---|
| 1 `production-contract-slis-slos` | 从用户结果定义 SLI，再设 SLO、测量窗口、错误预算、owner 和降级动作；模型质量、延迟、可用性、成本和安全信号分开 | SLI/SLO 不是 SLA；100% 目标通常不可操作；Google SRE 是官方工程实践而非法律/行业唯一标准 | PA01, ML11 | 双系统 SLO sheet：classifier + RAG；同一请求链显示每个分母与 owner |
| 2 `data-training-pipelines` | pipeline 是有输入/输出/依赖/缓存/验证/版本的组件图；每个 artifact 可定位到生成 execution | DAG 成功不证明数据/模型正确；重跑若依赖易变外部状态可能不可复现；TFX 是一种实现 | PA02–PA03, ML11 | 原创 train/eval/bless DAG，注入 stale cache 与 schema break；每节点产出 receipt |
| 3 `dataset-feature-lineage-versioning` | 版本化原始/处理数据、features、schema、代码、参数和上下游 lineage；记录 artifact–execution–context 关系 | Git/DVC/MLMD/OpenLineage 任一工具都不能单独捕获所有外部状态；版本号不证明权利或质量 | PA03–PA04 | 双向 lineage 图：从生产预测回溯训练数据，也从被删除数据找下游影响 |
| 4 `experiment-tracking-reproducibility` | 每次 run 保存 code/data/environment/config/seed/metrics/artifacts/parent run；重复与失败 run 也保留 | tracking server 有记录不等于可复现；metric 名同名不保证定义相同；artifact availability 不等于 functional | PA05, RE15, RE17 | 原创 experiment record JSON；隐藏一个未锁依赖，让学员复现并写 failure report |
| 5 `model-registry-approval-cards` | registry 记录 immutable model/version、stage/alias、evidence、审批人、限制、回滚目标；card 解释用途与评测 | registry “Production” 标签不是治理批准；审批与技术 PASS、人类签收必须分开；MLflow 是具体实现 | PA06, RA12 | 四门 gate：tests→risk review→owner approval→deployment; 强制记录拒绝理由 |
| 6 `batch-online-serving` | batch 与 online 在延迟、新鲜度、吞吐、故障、回填和一致性上有不同合同；服务接口版本化并验证 schema | KServe/TF Serving API 不定义所有平台；online 新鲜不等于更准；batch 重跑可重复副作用 | PA07–PA08 | 同一模型的 batch manifest 与 online request contract；幂等 operation ID/duplicate tests |
| 7 `packaging-security-secrets` | 固定镜像/依赖/构建 provenance、最小权限、secret manager、轮换、扫描和部署身份；SLSA/SSDF 提供供应链框架 | 容器不等于 sandbox；secret 不进入 image/log/model context；SLSA level/attestation 不证明应用无漏洞 | PA09–PA12 | 原创 OCI manifest/attestation 小样；故意把假 secret 写入 log 并要求门禁拦截 |
| 8 `shadow-canary-feature-flags` | shadow 不影响用户决定；canary 向小比例真实流量发布并比较预设指标；feature flag decouple release/activation，保留 kill switch | shadow 仍可能处理敏感数据/产生负载；canary 小样本会漏稀有伤害；flag 不是授权系统 | PA13 | 原创 rollout 状态机：dark→shadow→1%→10%→hold/rollback；flag context 禁止放 secrets |
| 9 `monitoring-performance-cost` | traces、metrics、logs 和 audit records 分工；监测请求结果、延迟/错误、资源、token/成本、队列、缓存和用户信号 | trace 不是 eval；异常指标不应自动等同用户伤害；OpenTelemetry 各 signal/component 稳定度不同 | PA14 | 双系统 trace waterfall + SLI dashboard；成本按 successful task 而非只按 request |
| 10 `data-concept-drift-continuous-evaluation` | 区分 schema/data/skew/drift 与带标签的 performance degradation；保存 reference/current window、检测方法、阈值和行动 | drift detector 不能无标签证明 task quality 下降；概念漂移常无法直接观察；供应商告警不是真值 | PA15 | 原创三场景：covariate shift 无性能降、label shift、真实性能降；行动规则各不同 |
| 11 `incident-response-rollback-postmortem` | 定义严重度、指挥、沟通、证据、遏制、回滚/降级、恢复验证和无责复盘；未知提交结果需人工对账 | rollback 可能不撤销已发决定/泄漏/消息；恢复服务不等于修复伤害；NIST IR 是框架而非特定行业法定义务 | PA16–PA17, RA02–RA03 | tabletop：错误模型 alias + RAG 索引污染；演示 rollback 后仍需通知和重处理 |
| 12 `dual-system-production-capstone` | 一个传统预测服务与一个 RAG/生成式服务共享身份、数据、observability、approval 和 incident control，但各有独立质量评测 | 不用一个平均指标合并两系统；RAG 引文存在不代表答案正确；capstone 本地 PASS 不等于生产已部署 | PA01–PA17, RA01–RA03 | 原创 dual-system architecture，执行 shadow→canary→rollback；交付 SLO、lineage、cards、traces、eval、runbook、go/no-go |

## 10. 英文—简中术语与回退边界

| English canonical term | 简体中文建议 | 避免的误译/误导 |
|---|---|---|
| accountability | 问责与责任可追溯 | 不只译“负责”，需能定位责任主体与行动 |
| contestability | 可质疑与可申诉性 | 不等同一般“解释性” |
| human authority | 人类决定权/授权边界 | 不用模糊的“人在环中”掩盖无实际覆盖权 |
| data minimisation | 数据最小化 | 不简化为机械删字段；需相对明确目的判断 |
| calibration | 概率校准 | 不译为一般“调参” |
| evidence certainty | 证据确定性/对证据的确信度 | 不与统计置信区间混同 |
| leakage | 数据泄漏（建模语境） | 与隐私数据泄露 `data breach` 分开 |
| drift | 分布漂移/概念漂移 | 不把任一差异都译成“模型退化” |
| artifact | 研究/运行产物 | 不一律译成“文件”，可能含环境、数据、模型、日志 |
| provenance / lineage | 来源与生成记录 / 上下游血缘 | 两者相关但不完全同义 |
| rollback | 回滚 | 必须说明不能自动撤销已发生外部后果 |

英文是没有完整正文 locale 的唯一回退内容。UI 应明确显示英文正文，并保持 `lang="en"` 与 `dir="ltr"`；不能把机器翻译伪装成完整本地化。法规名称保留官方英文/本地文名，简中只提供非权威释义。

## 11. 课程建设与发布验收

每门课至少通过以下门禁：

1. **Module contract**：manifest 的每个 module 都有 outcome、artifact、stable claim、boundary 与至少一个可访问的一手锚点。
2. **Source contract**：每个 current sourceId 均解析到 provenance 记录；无法确认的 ID fail closed，不以搜索摘要补齐。
3. **Fixture contract**：fixture 完全原创或有逐项权利记录；合成数据有显著标记、datasheet、schema、seed、version、checksum 和 gold assertions。
4. **Assessment contract**：题目测概念边界和实际审计动作；不能靠背诵某软件按钮、法条编号或论文单次结果过关。
5. **Reproducibility contract**：代码、环境、随机性、预期结果、失败模式和资源上限均可检查；不同硬件/版本差异诚实记录。
6. **Safety/governance contract**：高影响情境包含 no-deploy、人工决定权、升级、申诉、回滚与事件路径；completion 不自动解锁现实部署权限。
7. **Rights contract**：不复制竞争课程结构、文案、截图、视频、图表或练习；外部 source 只在许可允许的范围内转换。
8. **Localisation contract**：en 与 zh-Hans 必须由具名人员逐模块审校，并将决定绑定到精确正文哈希；其余 locale 回退英文且有可见提示。当前候选正文尚无人工签署，因此不能宣称 release-ready。

## 12. 已知覆盖缺口与 fail-closed 决定

- **法规非穷尽。** 没有覆盖所有美国州、拉美、非洲、中东、澳洲、印度、日本、韩国或行业专门法。任何新增部署地区都要另做法域核验。
- **EU 时间线易变。** 当前依据 2026-08 的 Commission 页面和 OJ 法源；AI Omnibus 后续实施材料、协调标准和主管机关实践仍会变化。
- **GRADE 迁移中。** 2013 handbook 部分章节已由 2024 起的新 Book 取代；课程逐章链接新 Book，旧页只作历史/尚未迁移内容的受限入口。
- **软件 rolling docs。** Fairlearn、Jupyter、pytest、SciPy、pandas、scikit-learn、PyTorch、PEFT、TFX、MLflow、KServe、OpenFeature 与 OpenTelemetry 需在发布环境锁定精确版本；本简报不声称未来 API 兼容。
- **硬件复现未实测。** 本研究确认了官方确定性边界，但没有在多 GPU/OS 上运行课程实验；实现验收需补 CPU/GPU matrix 或明确只支持的环境。
- **真实教育数据外部有效性未建立。** 默认完全合成 fixture 可验证工程合同，不能支持真实人群性能、公平或政策结论。
- **无独立法律审查。** 法规附录是官方来源索引与课程边界，不是律师意见；对外发布前应由对应法域专业人员复核。
- **无第三方媒体清权。** 本计划刻意不依赖外部图表/截图；若以后引入，必须另建逐资产 rights ledger，否则继续使用原创图。

以上缺口不阻止建设教学骨架，但阻止把课程标成“跨法域合规”“已在真实教育场景验证”或“所有环境可复现”。
