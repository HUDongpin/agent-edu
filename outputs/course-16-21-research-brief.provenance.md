# Course 16–21 研究溯源、版本与权利台账

配套简报：[course-16-21-research-brief.md](./course-16-21-research-brief.md)  
核验基准日：2026-08-26（Asia/Taipei）  
研究角色：researcher（本台账）、self-verifier（URL/版本/范围交叉检查）；未取得独立法律审查  
范围：官方文档、开放标准、原始研究；未使用竞争课程内容作为证据或结构模板

## 1. 方法与 fail-closed 规则

研究流程遵循：课程模块合同 → 原始主张拆分 → 官方/标准/原始研究搜索 → 直接页面核验 → 版本/发布日期核验 → reuse 与边界记录 → manifest ID resolution → 覆盖与缺口审计。

纳入：

- 政府/监管机构法源、官方实施页和官方框架；
- 标准制定组织发布的开放标准页或标准元数据；
- 软件项目的官方 versioned/current docs；
- 方法或算法的原始论文/会议记录；
- 发布者自己的工程研究，且只支持明确的 case-bounded 主张。

排除为核心证据：搜索摘要、百科、新闻转述、供应商营销、聚合数据库、竞争课程、一般教材/课程讲义、没有可定位原文的二手“最佳实践”。排除不表示其一定错误，只表示不满足本次证据合同。

台账默认 `accessed=2026-08-26`。若某行写 `rolling`，表示没有稳定公开修订号；课程发布时必须重新访问。`link/paraphrase` 表示只链接、短引与原创改写，不复制图表、页面、长段文字或代码。

## 2. 当前 manifest sourceId resolution ledger

本节逐项解析当前六个 manifest 中的 source IDs。`A` 可直接采用；`B` 需钉版本/范围；`R` 必须替换或重定义。直接 URL 是 claim evidence，不以搜索结果页代替。

### 2.1 Course 16 `responsible-ai`

| sourceId | 处置 → canonical | 官方/原始 URL；版本/发布日期 | Reuse | Supports | Boundary / rename decision |
|---|---|---|---|---|---|
| `nist-ai-rmf` | A → RA01 | [NIST AI 100-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)；1.0，2023-01-26 | 美国政府作品边界；署明来源，第三方材料例外 | Govern/Map/Measure/Manage 与情境化风险管理 | 自愿框架；NIST 已启动修订，不能称现行法律或永不变化 |
| `oecd-ai-principles` | A → RA06 | [OECD 2024 update](https://oecd.ai/en/wonk/evolving-with-innovation-the-2024-oecd-ai-principles-update)；2019 principles，2024-05 更新 | OECD 条款；link/paraphrase | trustworthy AI、human rights、transparency、robustness、accountability 原则 | 政策原则不等于某法域强制法或技术验收测试 |
| `algorithmic-impact-assessment` | B → RA08 | [Canada AIA](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/algorithmic-impact-assessment.html) + [Directive](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32592)；Directive modified 2025-06-24 | Open Government Licence–Canada 范围；保留 attribution | 65 risk + 41 mitigation questions，Directive 下的结构化 impact level | 仅加拿大联邦指定行政决策；不得泛化私营、省级或全球范围 |
| `oecd-privacy` | A → RA07 | [OECD Privacy Guidelines legal instrument](https://legalinstruments.oecd.org/public/doc/114/body-text.en.html)；1980，2013 修订 | OECD 条款；link/paraphrase | collection limitation、data quality、purpose、use/security/accountability 原则 | 非直接适用的全球隐私法；须配具体法域 |
| `nist-privacy-framework` | A → RA05 | [NIST Privacy Framework](https://www.nist.gov/privacy-framework/privacy-framework)；final 1.0，2020-01 | 美国政府作品边界；link/attribution | privacy-risk identification 与治理函数 | 1.1 在核验日仍是 Initial Public Draft；不得称 final 1.1 |
| `fairlearn-user-guide` | B → RA09 | [Fairlearn User Guide](https://fairlearn.org/main/user_guide/index.html)；rolling，页面为开发文档 | project MIT；网站/第三方资产不自动复用 | 公平评估/缓解 API 与 sociotechnical framing | metrics 不能穷尽正义、正当程序或 harm；发布实验须钉 released version |
| `gender-shades` | A → RA10 | [Buolamwini & Gebru, PMLR 81](https://proceedings.mlr.press/v81/buolamwini18a/)；2018 | 论文 link/paraphrase；不复制图表/面孔 | 特定商业性别分类系统在交叉群组上的性能差异案例 | 任务、标签和人群 case-bounded；不能当今天所有视觉模型的普遍误差率 |
| `uncertainty-calibration` | A → RA11 | [Guo et al., PMLR 70](https://proceedings.mlr.press/v70/guo17a.html)；2017 | link/paraphrase | 深度网络概率校准与 temperature scaling 实验 | 数据集/架构 case-bounded；calibration 不等于准确、公平或安全 |
| `model-cards` | A → RA12 | [Model Cards](https://research.google/pubs/model-cards-for-model-reporting/)；FAT* 2019，DOI 10.1145/3287560.3287596 | 论文 copyright；link/paraphrase | intended use、performance、subgroups、limitations 的模型报告框架 | card 的存在/完整不证明主张真实或模型适宜部署 |
| `datasheets` | A → RA13 | [Datasheets for Datasets](https://www.microsoft.com/en-us/research/publication/datasheets-for-datasets/)；CACM 2021，DOI 10.1145/3458723 | 论文 copyright；link/paraphrase | dataset motivation/composition/collection/preprocessing/distribution/maintenance | datasheet 不建立数据合法权利，也不自动发现遗漏或偏差 |
| `system-cards` | R → RA03+RA12+RA13 | [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)；2024-07-26 | NIST government-work boundary | 系统风险、评估与记录可支撑课程原创 assurance card | **重命名为课程自有 `system-assurance-card`**；没有一个跨行业、跨厂商的统一 system-card 标准 |
| `eu-hleg-human-agency` | B → RA14/RA16 | [EU HLEG Ethics Guidelines](https://digital-strategy.ec.europa.eu/en/library/ethics-guidelines-trustworthy-ai)；2019 | EU reuse 条款；link/paraphrase | human agency/oversight 的历史性指导 | 非约束、历史性指南；不能替代 Regulation (EU) 2024/1689 或当前实施页 |
| `unesco-ai-ethics` | A → RA15 | [UNESCO Recommendation](https://www.unesco.org/en/legal-affairs/recommendation-ethics-artificial-intelligence)；adopted 2021-11-23 | UNESCO reuse terms；link/paraphrase | human rights、oversight、redress、governance 的标准制定文书 | Recommendation 不是各成员国自动直接适用的法律 |
| `nist-genai-profile` | A → RA03 | [NIST AI 600-1 PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)；2024-07-26 | NIST government-work boundary | GenAI risk actions、adversarial testing、incident signals | 以 AI RMF 1.0 为基础的 companion resource，不是认证清单或法规 |
| `ai-incident-database` | R → RA03+PA17 | [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) + [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)；2024/2025 | NIST government-work boundary | incident preparedness、signals、response lifecycle | **删除聚合数据库作为核心证据**；事件库样本不完整且不支持发生率推断 |

### 2.2 Course 17 `ai-research`

| sourceId | 处置 → canonical | 官方/原始 URL；版本/发布日期 | Reuse | Supports | Boundary / rename decision |
|---|---|---|---|---|---|
| `osf-preregistration` | A → RE01 | [OSF Registrations](https://help.osf.io/article/330-welcome-to-registrations)；rolling | 页面权利未逐项建立；link/paraphrase；用户内容权利另计 | timestamped read-only registration 与 embargo/withdrawal concepts | prereg 不证明设计质量；偏离可合理但必须披露 |
| `prisma-2020` | A → RE02 | [PRISMA 2020 BMJ](https://www.bmj.com/content/372/bmj.n71.long) + [official statement](https://www.prisma-statement.org/prisma-2020-statement)；2021-03-29 | BMJ article CC BY 4.0；署名 | systematic-review reporting checklist/flow | reporting guideline，不是 conduct handbook 或 quality score |
| `prisma-search` | A → RE03 | [PRISMA-S official](https://www.prisma-statement.org/prisma-search) + [original paper](https://doi.org/10.1186/s13643-020-01542-z)；2021-01-26 | article open/CC BY；署名 | 16-item literature-search reporting extension | 报告透明不保证检索全面或数据库稳定 |
| `cochrane-search` | A → RE04 | [Cochrane Handbook ch. 4](https://training.cochrane.org/handbook/current/chapter-04)；Handbook v6.5, 2024 | Cochrane copyright；link/paraphrase | searching and selecting studies | 主要面向 intervention reviews；不能机械外推所有研究设计 |
| `cochrane-selection` | A → RE04 | [Cochrane Handbook ch. 4](https://training.cochrane.org/handbook/current/chapter-04)；v6.5, 2024 | link/paraphrase | eligibility、selection、records management | flow counts 不证明判断一致或资格标准恰当 |
| `grade-handbook` | B → RE05 | [GRADE handbook](https://gdt.gradepro.org/app/handbook/handbook.html) + [new GRADE Book](https://book.gradepro.org/)；old handbook updated 2013，Book since 2024 | reproduction/translation requires editor permission；link/paraphrase | certainty domains and evidence-to-decision concepts | **旧 handbook 正被替换**；主要是健康证据，不能作通用证据等级表 |
| `cochrane-bias` | A → RE04 | [Cochrane Handbook ch. 8](https://training.cochrane.org/handbook/current/chapter-08)；v6.5, 2024 | link/paraphrase | risk-of-bias domains and judgments | 工具取决于设计；评分不能被 AI 自动化成客观真值 |
| `cochrane-data-collection` | A → RE04 | [Cochrane Handbook ch. 5](https://training.cochrane.org/handbook/current/chapter-05)；v6.5, 2024 | link/paraphrase | data collection forms、duplicate checking、data management | 医学 review guidance 不是 PDF parser 准确率证明 |
| `tabula` | B → RE06+RE07 | [Tabula GitHub](https://github.com/tabulapdf/tabula) + [PDF 2.0](https://pdfa.org/resource/iso-32000-2/)；Tabula rolling，PDF ISO 32000-2:2020 + errata through 2026-06 | Tabula MIT code；PDF spec copyrighted；原创新 fixture | 表抽取工具案例与 PDF structure boundary | 工具输出需回页核验；不把项目维护状态或任何 PDF 表都可抽取作保证 |
| `crossref-rest` | A → RE08 | [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)；rolling | metadata field rights vary；事实/引用与 abstracts/full text 分开 | DOI metadata lookup and reconciliation | metadata 不验证论文结论、作者身份声明、全文权利或版本适用性 |
| `niso-jats` | A → RE09 | [ANSI/NISO Z39.96-2024 JATS v1.4](https://www.niso.org/publications/z3996-2024-jats)；2024-10 | NISO standard terms；link/paraphrase | journal-article XML interchange structure | JATS 标记缺失不证明原文缺失；结构解析不证明事实正确 |
| `asa-pvalues` | A → RE11 | [ASA p-value statement PDF](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf)；2016 | ASA copyright；link/paraphrase | p-value interpretation boundaries | statement 不是针对任何单一分析的 approval，也不取代 effect/interval/design |
| `tidy-data` | A → PY06 | [Wickham, Tidy Data](https://doi.org/10.18637/jss.v059.i10)；JSS 59(10), 2014 | open article；link/paraphrase pending asset-specific licence | variables/observations/values tabular organisation | data shape 不证明 statistical validity, provenance, or causal identification |
| `entreq` | A → RE12 | [ENTREQ original](https://doi.org/10.1186/1471-2288-12-181)；2012-11-27 | open access/CC BY publication；署名 | qualitative evidence-synthesis reporting, 21 items | reporting aid；不适用于每种 primary qualitative study，也不证明 synthesis trustworthy |
| `coreq` | A → RE13 | [COREQ original](https://pubmed.ncbi.nlm.nih.gov/17872937/)；2007，DOI 10.1093/intqhc/mzm042 | copyright；link/paraphrase | 32-item reporting checklist for interviews/focus groups | **只限 interviews/focus groups**；不可外推 ethnography/document analysis/all qualitative work |
| `acm-artifact-review` | A → RE15 | [ACM Artifact Review and Badging](https://www.acm.org/publications/policies/artifact-review-and-badging-current)；current policy | ACM copyright/trademarks；link/paraphrase；不复制 badge | distinctions among available/evaluated/reusable/reproduced artifacts | badge 是特定审查结论，不证明研究结论普遍正确 |
| `icmje-ai` | A → RE16 | [ICMJE AI use by authors](https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html) + [Jan 2026 annotated recommendations](https://www.icmje.org/news-and-editorials/icmje-recommendations_annotated_jan26.pdf) | ICMJE terms；link/paraphrase | AI disclosure/accountability; AI not author | 医学期刊建议；目标期刊/学科政策仍需另查，不等于全球出版法 |

新增而当前 manifest 未列：RE10 [RAG original](https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html)（NeurIPS 2020，link/paraphrase）只支持 retrieval-augmented generation 的原始方法；课程必须把它限制为 locator。RE14 [SRQR](https://pubmed.ncbi.nlm.nih.gov/24979285/)（2014，DOI 10.1097/ACM.0000000000000388）补足非 COREQ 设计的报告边界。RE17 [FAIR Principles](https://doi.org/10.1038/sdata.2016.18)（2016-03-15，CC BY 4.0）支持可发现、可访问、可互操作、可复用的高层原则，但 FAIR 不自动等于 open、ethical 或 reproducible。

### 2.3 Course 18 `ai-python-data`

| sourceId | 处置 → canonical | 官方/原始 URL；版本/发布日期 | Reuse | Supports | Boundary / rename decision |
|---|---|---|---|---|---|
| `python-venv` | A → PY02 | [Python venv](https://docs.python.org/3/library/venv.html)；Python 3.14.7 docs updated 2026-08-25 | PSF License v2；examples 0BSD | isolated, disposable, recreatable environments | venv generally non-portable；不是 dependency lock 或容器 |
| `jupyter-reproducibility` | B → PY03 | [Jupyter docs](https://docs.jupyter.org/en/latest/) + [Rule et al. 2019](https://doi.org/10.1371/journal.pcbi.1007007) | Jupyter project licence；PLOS article CC BY | execution-order/hidden-state/reproducibility practices | notebook 本身不保证可重现；环境/数据/随机性仍需固定 |
| `python-tutorial` | A → PY01 | [Python tutorial](https://docs.python.org/3/tutorial/)；3.14.7, 2026-08-25 docs | PSF-2.0 / examples 0BSD | values, control, functions, data structures | tutorial 不是完整 language reference 或 correctness proof |
| `python-errors` | A → PY01 | [Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html)；3.14.7 | PSF-2.0 / examples 0BSD | exceptions, handling, raising, cleanup | catching exceptions does not make state correct; avoid blanket suppression |
| `pytest-docs` | B → PY04 | [pytest stable docs](https://docs.pytest.org/en/stable/)；rolling stable | pytest MIT; docs/project assets per repository | test discovery, assertions, fixtures | coverage/pass 不证明 requirement correctness；pin test runner version |
| `typing-spec` | A → PY04 | [Python Typing Specification](https://typing.python.org/en/latest/spec/)；rolling specification | Python ecosystem terms；link/paraphrase | static typing contracts and checker behavior | type hints usually not runtime enforcement; checker differences/versioning matter |
| `numpy-quickstart` | A → PY05 | [NumPy quickstart](https://numpy.org/doc/stable/user/quickstart.html) + [random](https://numpy.org/doc/stable/reference/random/)；stable 2.5 docs | BSD-3-Clause project | ndarray shape/dtype/axis/broadcasting/default_rng | vectorisation not always faster; seed not cryptographic or cross-version bitwise guarantee |
| `pandas-user-guide` | A → PY06 | [pandas user guide](https://pandas.pydata.org/docs/user_guide/index.html)；stable 3.0.5 | BSD-3-Clause project | Series/DataFrame/index/dtype/reshape operations | implementation defaults are versioned; pandas not a data-quality guarantee |
| `tidy-data` | A → PY06 | [Tidy Data](https://doi.org/10.18637/jss.v059.i10)；2014 | open article；link/paraphrase | variable-observation-value organisation | useful principle, not mandatory universal schema |
| `pandas-missing` | A → PY07 | [pandas missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)；3.0.5 | BSD-3 project | NA sentinels and missing-data operations | operations do not identify missingness mechanism or justify imputation/drop |
| `frictionless-data` | B → PY07 | [Frictionless Data specs](https://specs.frictionlessdata.io/)；rolling specs | per-spec/repository licence; pin exact release before reuse | tabular data package/schema validation | schema-valid does not mean true, complete, lawful or statistically representative |
| `nist-stat-handbook` | A → PY08 | [NIST/SEMATECH e-Handbook](https://www.itl.nist.gov/div898/handbook/)；stable legacy reference | US-government-work boundary; third-party exceptions | descriptive/inferential statistical fundamentals and diagnostics | old stable reference, not current software API; assumptions remain design-dependent |
| `scipy-stats` | B → PY08 | [SciPy bootstrap](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html)；current 1.18 docs | BSD-3-Clause project | bootstrap confidence-interval API and methods | valid use depends on resampling unit/dependence/sample size; pin version |
| `matplotlib-guide` | A → PY09 | [Matplotlib quick start](https://matplotlib.org/stable/users/explain/quick_start.html)；rolling stable | Matplotlib PSF-compatible licence; original course figures | plotting primitives, axes, labels, scales | API capability does not establish honest design or accessibility |
| `data-visualization-society` | R → PY09+RE11 | [Matplotlib guide](https://matplotlib.org/stable/users/explain/quick_start.html) + [ASA statement](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf) | original course diagrams; link/paraphrase | truthful encoding, scale and uncertainty taught from first-party/statistical anchors | **移除社群页面作为规范性证据**；不表示该组织内容错误 |
| `python-csv` | A → PY10 | [Python csv](https://docs.python.org/3/library/csv.html) + [W3C CSVW Recommendation](https://www.w3.org/TR/2015/REC-tabular-data-model-20151217/)；Python 3.14.7 / 2015-12-17 | PSF/0BSD examples; W3C document terms | CSV parsing plus metadata-model boundary | CSV has no inherent types/encoding/schema guarantee |
| `requests-docs` | B → PY10 | [Requests docs](https://requests.readthedocs.io/en/latest/) + [HTTP Semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) | Requests Apache-2.0 project; IETF Trust terms | client usage plus normative HTTP semantics | API-specific pagination/auth/rate limits remain service contract; pin Requests version |
| `pandas-merge` | A → PY11 | [pandas.merge](https://pandas.pydata.org/docs/reference/api/pandas.merge.html)；3.0.5 | BSD-3 project | join types, indicator and cardinality validation | null keys match each other unlike usual SQL; `validate` does not prove business-key correctness |
| `ed-fixture-datasheet` | R → PY12+RA13 | [CEDS v13 downloads](https://ceds.ed.gov/cedsdownloads.aspx) + [Datasheets](https://www.microsoft.com/en-us/research/publication/datasheets-for-datasets/) | CEDS government-work boundary; paper link/paraphrase; new fixture CC0 only if wholly original | education schema reference + documentation prompts | **不是外部 sourceId**；重命名 `course-original-education-fixture`，显著标 synthetic/no real people |

### 2.4 Course 19 `machine-learning`

| sourceId | 处置 → canonical | 官方/原始 URL；版本/发布日期 | Reuse | Supports | Boundary / rename decision |
|---|---|---|---|---|---|
| `sklearn-common-pitfalls` | A → ML01 | [scikit-learn common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)；stable 1.9.0, 2026-06 | BSD-3-Clause project; original examples | inconsistent preprocessing、data leakage、randomness controls | examples do not cover every temporal/group leakage path; pin 1.9.x |
| `ml-test-score` | B → ML11 | [The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)；IEEE Big Data 2017 | IEEE copyright；link/paraphrase，不复制 rubric table | production-readiness and technical-debt testing dimensions | engineering rubric/case, not certification or proof of safe deployment |
| `sklearn-linear-models` | A → ML02 | [scikit-learn linear models](https://scikit-learn.org/stable/modules/linear_model.html)；1.9.0 | BSD-3 project | OLS、loss、regularised linear estimators | fitted coefficient is not automatically causal; software semantics versioned |
| `islr` | R → ML02+ML04 | [scikit-learn linear models](https://scikit-learn.org/stable/modules/linear_model.html) + [LASSO original](https://doi.org/10.1111/j.2517-6161.1996.tb02080.x) | docs BSD; paper link/paraphrase | regression/classification implementation plus original regularisation method | **移除教材作核心证据**；教材可作可选阅读，但不支撑 release claim |
| `sklearn-logistic` | A → ML02 | [Logistic regression section](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)；1.9.0 | BSD-3 project | logistic loss, penalties and implementation | probability may be miscalibrated; odds coefficients need careful interpretation |
| `sklearn-preprocessing` | A → ML03 | [Preprocessing data](https://scikit-learn.org/stable/modules/preprocessing.html)；1.9.0 | BSD-3 project | scaling, encoding, transformations | transforms must be fitted inside training folds; not all models need same scaling |
| `stanford-cs229` | R → ML03 | [scikit-learn preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html) + [PyTorch optim](https://docs.pytorch.org/docs/stable/optim.html) | official project docs; original course explanation | feature scaling and optimizer implementation boundary | **移除其他课程讲义作核心证据**；不复制其推导、图示或教学顺序 |
| `sklearn-regularization` | A → ML02+ML04 | [Lasso section](https://scikit-learn.org/stable/modules/linear_model.html#lasso) + [Tibshirani 1996](https://doi.org/10.1111/j.2517-6161.1996.tb02080.x) | BSD docs; paper copyright/link | L1 shrinkage and sparse solutions | L1 does not guarantee stable or true variable selection, especially correlated predictors |
| `sklearn-ensemble` | A → ML05 | [Ensemble methods](https://scikit-learn.org/stable/modules/ensemble.html)；1.9.0 | BSD-3 project | bagging, forests, boosting implementations | no universal superiority; feature importances are not causal explanations |
| `sklearn-model-evaluation` | A → ML06 | [Model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html)；1.9.0 | BSD-3 project | metric definitions and scorer behavior | metric choice needs prevalence, costs and decision context; defaults are not policy |
| `precision-recall` | A → ML06 | [Saito & Rehmsmeier](https://doi.org/10.1371/journal.pone.0118432)；PLOS ONE 2015 | CC BY; attribute; original diagrams preferred | PR plots can be more informative than ROC in studied imbalanced settings | does not make PR the only correct metric or determine threshold/cost policy |
| `sklearn-calibration` | A → ML07 | [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html) + [threshold tuning](https://scikit-learn.org/stable/modules/classification_threshold.html)；1.9.0 | BSD-3 project | reliability diagrams, calibration methods, post-hoc thresholding | calibration and threshold selection require held-out/nested data; not fairness or utility proof |
| `calibration-paper` | A → RA11 | [Guo et al. 2017](https://proceedings.mlr.press/v70/guo17a.html) | link/paraphrase | empirical miscalibration and temperature scaling | case-bounded to studied architectures/datasets; no distribution-shift guarantee |
| `sklearn-clustering` | A → ML08 | [Clustering](https://scikit-learn.org/stable/modules/clustering.html)；1.9.0 | BSD-3 project | algorithms, parameter and metric behaviors | cluster IDs have no intrinsic semantic truth; representation/scale dominate conclusions |
| `sklearn-outlier` | A → ML09 | [Outlier and novelty detection](https://sklearn.org/stable/modules/outlier_detection.html)；1.9.0 | BSD-3 project | distinction among outlier/novelty estimators and score/decision APIs | anomaly score is not fraud/harm/error proof; unsupervised evaluation is limited |
| `recommender-handbook` | R → ML10 | [Matrix Factorization Techniques](https://doi.org/10.1109/MC.2009.263) | IEEE copyright；link/paraphrase | matrix-factorisation baseline and implicit feedback framing | **移除 handbook 二手来源**；不复制教材图/例；offline ranking not user welfare |
| `ncf-paper` | A → ML10 | [Neural Collaborative Filtering](https://arxiv.org/abs/1708.05031)；2017 | arXiv author manuscript；link/paraphrase | NCF architecture and reported experiments | compare popularity/MF baselines; paper does not prove universal NCF superiority |
| `model-cards` | A → RA12 | [Model Cards](https://research.google/pubs/model-cards-for-model-reporting/)；2019 | link/paraphrase | structured model reporting | documentation is not certification, legal approval or continuous monitoring |

新增原始锚点：ML04 [LASSO](https://doi.org/10.1111/j.2517-6161.1996.tb02080.x)（1996）、ML05 [Random Forests](https://doi.org/10.1023/A:1010933404324)（2001）、ML08 [DBSCAN](https://aaai.org/papers/kdd96-037-a-density-based-algorithm-for-discovering-clusters-in-large-spatial-databases-with-noise/)（KDD 1996）、ML09 [Isolation Forest](https://doi.org/10.1109/ICDM.2008.17)（ICDM 2008）、ML11 [Hidden Technical Debt](https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html)（NeurIPS 2015）。这些论文均只作原始方法/工程研究，默认 link/paraphrase，不外推为所有数据的性能保证。

### 2.5 Course 20 `deep-learning`

| sourceId | 处置 → canonical | 官方/原始 URL；版本/发布日期 | Reuse | Supports | Boundary / rename decision |
|---|---|---|---|---|---|
| `pytorch-tensors` | B → DL01 | [PyTorch Tensors tutorial](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html)；current 2.13 tutorial | tutorial code BSD; docs/site assets per PyTorch terms | shape, dtype, device and tensor operations | rolling docs; behavior and accelerator support versioned |
| `pytorch-autograd` | B → DL01 | [Autograd docs](https://docs.pytorch.org/docs/stable/autograd) + [mechanics](https://docs.pytorch.org/docs/stable/notes/autograd.html)；2.12/2.13, updated 2026-04-03 / 2026-05-07 | BSD project; original figures | automatic differentiation, graph and debugging behavior | forward-mode beta and implementation details versioned; derivative does not validate objective |
| `backprop-paper` | A → DL02 | [Rumelhart, Hinton & Williams](https://doi.org/10.1038/323533a0)；Nature 1986 | publisher copyright；link/paraphrase | classic back-propagation learning result | historical paper; not the sole origin of chain rule/autodiff and not a modern API spec |
| `pytorch-optim` | B → DL03 | [torch.optim](https://docs.pytorch.org/docs/stable/optim.html)；2.13 rolling docs | BSD project | optimiser classes and parameter-update APIs | implementation defaults are versioned; convergence/quality not guaranteed |
| `batchnorm-paper` | A → DL04 | [Batch Normalization](https://proceedings.mlr.press/v37/ioffe15.html)；ICML 2015 | link/paraphrase | batch-normalisation method and reported experiments | train/eval/statistics behavior matters; original explanation/results not universal |
| `dropout-paper` | A → DL04 | [Dropout](https://www.jmlr.org/papers/v15/srivastava14a.html)；JMLR 2014 | JMLR open article；link/paraphrase | dropout method and empirical regularisation results | not universally beneficial; interaction with architecture/norm/data is empirical |
| `pytorch-training` | B → DL05 | [Training a classifier](https://docs.pytorch.org/tutorials/beginner/introyt/trainingyt.html)；2.13 tutorial | tutorial code BSD | explicit train/eval loop steps | tutorial happy path is not production loop or reproducibility proof |
| `ml-test-score` | B → ML11 | [ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)；2017 | IEEE copyright；link/paraphrase | tests for data/model/pipeline/monitoring readiness | not DL algorithm evidence or deployment certification |
| `cnn-paper` | A → DL06 | [LeCun et al., gradient-based learning](https://doi.org/10.1109/5.726791)；Proceedings IEEE 1998 | IEEE copyright；link/paraphrase | classic convolutional architecture/learning case | historical task/data; cannot support current benchmark or fairness claims |
| `pytorch-cnn-tutorial` | B → DL06 | [CIFAR-10 classifier tutorial](https://docs.pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html)；2.13 tutorial | code BSD; dataset licence separate | implementation of a small CNN training loop | tutorial/dataset results case-bounded; dataset rights and downloads separate |
| `pytorch-transfer` | B → DL07 | [Transfer learning tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)；2.13 | tutorial code BSD | fixed-feature vs fine-tuning patterns | one vision example; no universal transfer benefit or data-rights conclusion |
| `transfer-survey` | R → DL07 | [PyTorch transfer tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html) | original comparison fixture | implementation pattern and explicit experiment contract | **移除综述作核心一手来源**；不得复制其他课程/综述 taxonomy 或图 |
| `lstm-paper` | A → DL08 | [Hochreiter & Schmidhuber](https://doi.org/10.1162/neco.1997.9.8.1735)；Neural Computation 1997 | publisher copyright；link/paraphrase | original LSTM architecture and long-dependency motivation | LSTM mitigates but does not eliminate sequence/gradient limitations |
| `pytorch-sequence` | B → DL08 | [Sequence Models and LSTM](https://docs.pytorch.org/tutorials/beginner/nlp/sequence_models_tutorial.html)；rolling tutorial | code BSD | tensor shapes and LSTM sequence implementation | small NLP tutorial, not current language-model architecture guarantee |
| `attention-paper` | A → DL09 | [Bahdanau, Cho & Bengio](https://arxiv.org/abs/1409.0473)；2014/ICLR 2015 | author manuscript；link/paraphrase | additive attention for neural machine translation | attention weights are not automatically causal explanations |
| `transformer-paper` | A → DL10 | [Attention Is All You Need](https://papers.neurips.cc/paper/7181-attention-is-all-you-need)；NeurIPS 2017 | proceedings copyright；link/paraphrase | encoder–decoder Transformer architecture | modern variants differ; reported translation results not current universal benchmark |
| `pytorch-transformer` | B → DL10 | [PyTorch transformer tutorial](https://docs.pytorch.org/tutorials/beginner/transformer_tutorial.html)；rolling/deprecation status must be checked | code BSD | implementation/masking example | tutorial may be deprecated or version-specific; do not make it architecture standard |
| `sentencepiece-paper` | A → DL11 | [SentencePiece](https://aclanthology.org/D18-2012/)；EMNLP 2018 | ACL paper copyright; implementation separately Apache-2.0 | language-independent subword tokenization method | paper text licence differs from code; tokenisation parity across languages not guaranteed |
| `bert-paper` | A → DL11 | [BERT](https://aclanthology.org/N19-1423/)；NAACL 2019 | ACL Anthology paper terms；link/paraphrase | masked-language-model pretraining and fine-tuning architecture | BERT results/data do not generalise to all models or establish source-data rights |
| `lora-paper` | A → DL12 | [LoRA](https://openreview.net/forum?id=nZeVKeeFYf9)；ICLR 2022 | author/openreview terms；link/paraphrase | low-rank adaptation method and reported efficiency | fewer trainable parameters does not guarantee lower total cost, safety or quality |
| `huggingface-peft` | B → DL12 | [Hugging Face PEFT docs](https://huggingface.co/docs/peft/index)；rolling | PEFT code Apache-2.0; model licences separate | current PEFT implementation concepts | pin library/model/adapter format; project license does not override base-model/data rights |
| `model-cards` | A → RA12 | [Model Cards](https://research.google/pubs/model-cards-for-model-reporting/)；2019 | link/paraphrase | training/evaluation documentation basis | card does not establish robustness or deployability |
| `robustness-paper` | A → DL13 | [ImageNet-C / Benchmarking Neural Network Robustness](https://arxiv.org/abs/1903.12261)；2019 | author manuscript；link/paraphrase | common-corruption robustness benchmark | benchmark is image/task/corruption-specific; not safety or OOD completeness proof |
| `pytorch-reproducibility` | B → DL05 | [PyTorch Reproducibility notes](https://docs.pytorch.org/docs/stable/notes/randomness.html)；rolling 2.13 docs | BSD project | seeds, deterministic algorithms and platform caveats | complete reproducibility across releases/platforms is not guaranteed; may reduce performance |

新增原始锚点：DL03 [Adam](https://arxiv.org/abs/1412.6980)（2014/ICLR 2015）、DL06 [ResNet](https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html)（CVPR 2016）。两者只用于解释方法与 case-bounded experiments，课程图与代码原创。

### 2.6 Course 21 `production-ai`

| sourceId | 处置 → canonical | 官方/原始 URL；版本/发布日期 | Reuse | Supports | Boundary / rename decision |
|---|---|---|---|---|---|
| `google-sre-slo` | A → PA01 | [Google SRE SLO chapter](https://sre.google/sre-book/service-level-objectives/) | CC BY-NC-ND 4.0；只链接/概括，不改编图文 | SLI/SLO/SLA distinctions and user-centred targets | Google practice, not universal standard/law; no 100% target guarantee |
| `ml-test-score` | B → ML11 | [ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)；2017 | IEEE copyright；link/paraphrase | data/model/pipeline/monitoring test categories | research rubric, not certification or complete operations framework |
| `tfx-pipelines` | B → PA02 | [Understanding TFX Pipelines](https://www.tensorflow.org/tfx/guide/understanding_tfx_pipelines)；page updated 2023-05-09 | TensorFlow docs CC BY 4.0; code Apache-2.0 | components, artifacts and DAG pipeline example | TFX implementation, not universal pipeline ontology; pin runtime version |
| `mlmd-docs` | B → PA03 | [ML Metadata](https://www.tensorflow.org/tfx/guide/mlmd)；rolling | docs CC BY 4.0; code Apache-2.0 | artifacts, executions, events, contexts and lineage | recorded lineage limited to instrumented events; not rights/quality proof |
| `dvc-docs` | B → PA04 | [DVC documentation](https://dvc.org/doc)；rolling | project Apache-2.0; website/assets per terms | one implementation for data/pipeline versioning | implementation/provider positioning changes; concepts should anchor in MLMD/OpenLineage |
| `mlflow-tracking` | B → PA05 | [MLflow Tracking](https://mlflow.org/docs/latest/ml/tracking/)；current docs, self-host page shows 3.7.0 | Apache-2.0 project | runs, parameters, metrics and artifacts | server record does not guarantee environment/data availability or reproducibility |
| `acm-artifact-review` | A → RE15 | [ACM Artifact Review](https://www.acm.org/publications/policies/artifact-review-and-badging-current) | ACM copyright/trademarks; link/paraphrase | artifact evidence distinctions | badges/policy are publication constructs, not model-registry stage semantics |
| `mlflow-registry` | B → PA06 | [MLflow Model Registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow)；current/3.7-era docs | Apache-2.0 project | model versions, aliases/tags and lifecycle workflow | registry labels are not governance approval; pin exact API/version |
| `model-cards` | A → RA12 | [Model Cards](https://research.google/pubs/model-cards-for-model-reporting/)；2019 | link/paraphrase | model-purpose/performance/limitations documentation | not approval, monitoring or incident response |
| `kserve-docs` | B → PA07 | [KServe docs](https://kserve.github.io/website/) + [v0.18.0 release](https://github.com/kserve/kserve/releases/tag/v0.18.0)；2026-04-29 | Apache-2.0 project | Kubernetes model serving implementation, current V1beta1 surface | one platform; do not present archived/older V1 examples as preferred current API |
| `tensorflow-serving` | B → PA08 | [TensorFlow Serving configuration](https://www.tensorflow.org/tfx/serving/serving_config)；rolling | docs CC BY 4.0; code Apache-2.0 | model serving/version policy implementation | TensorFlow-specific; online consistency, rollback and availability still application concerns |
| `slsa-spec` | A → PA10 | [SLSA v1.2](https://slsa.dev/spec/v1.2/)；approved/released 2025-11-24 | Community Specification 1.0; legacy Apache-2.0 materials | build provenance and supply-chain levels/requirements | attestation/level does not prove application free of vulnerability or malicious behavior |
| `owasp-secrets` | B → PA12 | [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)；rolling | OWASP page/project terms; link/paraphrase until NOTICE captured | secret lifecycle, storage, rotation and access guidance | guidance, not platform implementation or compliance certification; pin page/repo version |
| `google-sre-canary` | A → PA13 | [Canarying Releases](https://sre.google/workbook/canarying-releases/) | CC BY-NC-ND 4.0; link/paraphrase only | canary comparison and progressive release concepts | case/practice, not statistical guarantee; canary can miss rare harms |
| `openfeature-spec` | B → PA13 | [OpenFeature flag evaluation](https://openfeature.dev/specification/sections/flag-evaluation/)；rolling specification | project Apache-2.0; pin spec version | provider-neutral flag-evaluation concepts | flag context is not authorization; providers may differ; do not place secrets in context |
| `opentelemetry-spec` | B → PA14 | [OpenTelemetry specification](https://opentelemetry.io/docs/specs/otel/)；spec 1.60.0 at access | Apache-2.0 project | traces, metrics, logs, context and semantic conventions | signals/components have separate stability; telemetry is not eval or trusted authorization input |
| `google-sre-monitoring` | A → PA14 | [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) | CC BY-NC-ND 4.0; link/paraphrase only | user-relevant monitoring signals and alerting principles | Google practice; anomaly alone should not page or prove user harm |
| `drift-paper` | R → PA15 | [TensorFlow Data Validation](https://research.google/pubs/tensorflow-data-validation-data-analysis-and-validation-in-continuous-ml-pipelines/)；SIGMOD 2020 | publisher copyright；link/paraphrase | schema/data anomalies, skew/drift in continuous ML pipelines | **ID 含义过泛，重命名 `tfdv-continuous-validation-paper`**；drift 不自动等于 task-quality degradation |
| `nannyml-docs` | R → PA15 | [TFDV original research](https://research.google/pubs/tensorflow-data-validation-data-analysis-and-validation-in-continuous-ml-pipelines/) | link/paraphrase | first-party/original evidence for continuous data validation | **供应商 docs 不作核心来源**；可作为非权威 tool demo 但不进入 claim contract |
| `google-sre-incident` | A → PA16 | [Google SRE incident response](https://sre.google/workbook/incident-response/) + [postmortem culture](https://sre.google/sre-book/postmortem-culture/) | CC BY-NC-ND 4.0; link/paraphrase only | roles, coordination, recovery, learning/postmortems | organization practice; cannot define statutory reporting or reverse irreversible harm |
| `nist-ai-rmf` | A → RA01+PA17 | [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10) + [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) | government-work boundary | operational risk management plus incident-response lifecycle | AI RMF voluntary; SP 800-61r3 cyber-risk guidance, not every sector's legal incident rule |

新增生产锚点：PA04 [OpenLineage schemas](https://openlineage.io/docs/spec/schemas/)（rolling；页面/发布版本必须分别钉定，Apache-2.0 project）、PA09 [OCI Image Specification](https://specs.opencontainers.org/image-spec/manifest/)（spec 1.1 family；spec OWFa/repository Apache-2.0 边界）、PA11 [NIST SSDF v1.1](https://csrc.nist.gov/pubs/sp/800/218/final)（2022-02 final；2026 的 v1.2 仍是 initial draft，不能写 final）、PA17 [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)（2025-04 final，Rev.2 withdrawn）。

## 3. Canonical evidence index — 97 records

记录计数规则：一个 record 是课程中的一个审计单元；当“原始方法论文 + 当前官方实现文档”必须配对才能支持模块时，两条 URL 可归入同一 record。97 不是 URL 数，也不是独立研究数量。所有记录 `accessed=2026-08-26`。

### 3.1 Responsible AI / regulation — RA01–RA27（27）

| ID | Direct evidence | Version / status | Reuse | Supports / boundary |
|---|---|---|---|---|
| RA01 | [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10) | NIST AI 100-1, 2023-01-26; revision underway | government-work boundary | Govern/Map/Measure/Manage; voluntary, not law/certification |
| RA02 | [NIST AI RMF Playbook](https://www.nist.gov/itl/ai-risk-management-framework/nist-ai-rmf-playbook) + [Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | rolling, page updated 2026-06-10; based on 1.0 | government-work boundary | suggested actions, monitoring/appeal/incident/change; optional, not checklist |
| RA03 | [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | 2024-07-26 | government-work boundary | GenAI profile/red teaming/incident signals; companion to AI RMF 1.0 |
| RA04 | [NIST SP 1270](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.1270.pdf) | NIST SP 1270, 2022 | government-work boundary | bias identification/management; not a parity threshold or fairness certificate |
| RA05 | [NIST Privacy Framework](https://www.nist.gov/privacy-framework/privacy-framework) | final 1.0, 2020-01; 1.1 initial draft | government-work boundary | privacy-risk functions; do not label draft 1.1 final |
| RA06 | [OECD AI Principles 2024 update](https://oecd.ai/en/wonk/evolving-with-innovation-the-2024-oecd-ai-principles-update) | updated 2024-05 | OECD terms; link/paraphrase | policy principles; not directly applicable law |
| RA07 | [OECD Privacy Guidelines](https://legalinstruments.oecd.org/public/doc/114/body-text.en.html) | 1980, revised 2013 | OECD terms; link/paraphrase | privacy principles; pair with local law |
| RA08 | [Canada AIA](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/algorithmic-impact-assessment.html) + [Directive](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32592) | Directive modified 2025-06-24 | Open Government Licence–Canada | federal administrative-decision scope only |
| RA09 | [Fairlearn user guide](https://fairlearn.org/main/user_guide/index.html) | rolling/dev docs | project MIT; pin release | metrics/mitigations; fairness remains sociotechnical |
| RA10 | [Gender Shades](https://proceedings.mlr.press/v81/buolamwini18a/) | PMLR 81, 2018 | link/paraphrase | intersectional audit case; no universal current error rates |
| RA11 | [Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html) | PMLR 70, 2017 | link/paraphrase | calibration methods/results; case-bounded |
| RA12 | [Model Cards](https://research.google/pubs/model-cards-for-model-reporting/) | FAT* 2019 | link/paraphrase | reporting framework; card not certification |
| RA13 | [Datasheets for Datasets](https://www.microsoft.com/en-us/research/publication/datasheets-for-datasets/) | CACM 2021 | link/paraphrase | dataset documentation prompts; not rights/quality proof |
| RA14 | [Guidelines for Human–AI Interaction](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/) | CHI 2019 | link/paraphrase | interaction/oversight guidance; case-derived, not law |
| RA15 | [UNESCO Recommendation on AI Ethics](https://www.unesco.org/en/legal-affairs/recommendation-ethics-artificial-intelligence) | adopted 2021-11-23 | UNESCO terms; link/paraphrase | global soft-law recommendation; national implementation varies |
| RA16 | [Regulation (EU) 2024/1689 OJ](https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=en) | OJ 2024-07-12; subsequent amendments/implementation must be checked | EU reuse terms; necessary short quotation only | official legal text; scope/exceptions require article-level reading |
| RA17 | [EU AI regulatory framework](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) + [enforcement](https://digital-strategy.ec.europa.eu/en/policies/enforcement-ai-act) | pages updated 2026-08-03 / 2026-08-24 | EU terms; link/paraphrase | current implementation timeline; overview is nonbinding and not OJ replacement |
| RA18 | [GDPR Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | adopted 2016; applicable 2018 | EU reuse terms; necessary short quotation | minimisation/automated-decision legal anchor; interpretations remain contextual |
| RA19 | [Council of Europe CETS 225](https://www.coe.int/en-GB/web/conventions/full-list2?module=treaty-detail&treatynum=225) | opened signature 2024-09-05 | Council terms; link/paraphrase | treaty text/status; signature/ratification/entry into force differ by state |
| RA20 | [PRC CAC Interim Measures](https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm) | promulgated 2023-07-10; effective 2023-08-15 | official text; short quotation/link | public GenAI services in PRC scope; not every internal/research use |
| RA21 | [NYC DCWP AEDT](https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page) + [law record](https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=B051915D-A9AC-451E-81F8-6596032FA3F9&ID=4344524) | enforcement began 2023-07-05 | official text; link/short quotation | defined NYC employment tools only; audit not no-discrimination proof |
| RA22 | [Colorado AG AI rulemaking](https://coag.gov/ai/) | accessed current; SB26-189 framework, effective 2027-01-01; 2026-08-11 proposed rules not final | official text; link/short quotation | future/proposed status must remain visible; old SB24-205 summary obsolete |
| RA23 | [ICO AI guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/about-this-guidance/) + [DUAA status](https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/) | AI guidance under review; DUAA data-protection provisions in force 2026-06-19 | OGL/ICO terms as marked; link/paraphrase | data-protection scope, not complete AI law/statutory code |
| RA24 | [Singapore PDPC Model AI Governance Framework](https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework) | 2nd ed., 2020-01-21 | official terms; link/paraphrase | voluntary governance guidance, not mandatory universal law |
| RA25 | [Hong Kong PCPD AI](https://www.pcpd.org.hk/english/artificial_intelligence/index.html) | framework 2024-06 | official terms; link/paraphrase | PDPO/privacy governance scope; not complete AI-safety law |
| RA26 | [ISO/IEC 42001:2023 metadata](https://www.iso.org/standard/42001) | Edition 1, 2023-12 | **ISO copyright: metadata/link only; no standard text/figures/AI reuse** | identifies AIMS standard only; not substantive course evidence or certification claim |
| RA27 | [ISO/IEC 23894:2023 metadata](https://www.iso.org/standard/77304.html) | Edition 1, 2023-02 | **ISO copyright: metadata/link only; no standard text/figures/AI reuse** | identifies AI risk-management guidance only; no clause/table reproduction |

### 3.2 AI Research — RE01–RE17（17）

| ID | Direct evidence | Version / status | Reuse | Supports / boundary |
|---|---|---|---|---|
| RE01 | [OSF Registrations](https://help.osf.io/article/330-welcome-to-registrations) | rolling | page link/paraphrase; user content separate | timestamped registration; not design-quality proof |
| RE02 | [PRISMA 2020](https://www.bmj.com/content/372/bmj.n71.long) | 2021-03-29 | CC BY 4.0 | reporting guideline; not conduct/quality appraisal |
| RE03 | [PRISMA-S](https://doi.org/10.1186/s13643-020-01542-z) | 2021-01-26 | open/CC BY | search reporting; not completeness guarantee |
| RE04 | [Cochrane Handbook](https://training.cochrane.org/handbook/current) | v6.5, 2024 | copyright; link/paraphrase | search/screen/extract/RoB guidance; health-review context |
| RE05 | [GRADE handbook](https://gdt.gradepro.org/app/handbook/handbook.html) + [Book](https://book.gradepro.org/) | old 2013; replacement since 2024 | permission required to reproduce/translate; link only | certainty framework; health scope and transition visible |
| RE06 | [PDF 2.0](https://pdfa.org/resource/iso-32000-2/) | ISO 32000-2:2020; errata collection 2026-06 | copyrighted standard; link/paraphrase metadata | PDF structure; no extraction-accuracy promise |
| RE07 | [GROBID](https://github.com/grobidOrg/grobid) + [evaluation](https://grobid.readthedocs.io/en/latest/End-to-end-evaluation/) | rolling | Apache-2.0 code; docs terms | extraction evaluation; task/layout/domain-dependent errors |
| RE08 | [Crossref REST](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | rolling | field-level rights vary | identifier/metadata locator; not truth/full-text rights |
| RE09 | [JATS v1.4](https://www.niso.org/publications/z3996-2024-jats) | ANSI/NISO Z39.96-2024, 2024-10 | NISO terms; link/paraphrase | article XML interchange; markup not factual verification |
| RE10 | [RAG original](https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html) | NeurIPS 2020 | link/paraphrase | original retrieval-augmented method; course use locator-only |
| RE11 | [ASA p-value statement](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf) | 2016 | ASA copyright; link/paraphrase | p-value limits; not full analysis approval |
| RE12 | [ENTREQ](https://doi.org/10.1186/1471-2288-12-181) | 2012-11-27 | open/CC BY | qualitative-synthesis reporting; not all qualitative designs |
| RE13 | [COREQ](https://pubmed.ncbi.nlm.nih.gov/17872937/) | 2007 | link/paraphrase | interview/focus-group reporting only |
| RE14 | [SRQR](https://pubmed.ncbi.nlm.nih.gov/24979285/) | 2014 | link/paraphrase | broad qualitative reporting; not validity guarantee |
| RE15 | [ACM Artifact policy](https://www.acm.org/publications/policies/artifact-review-and-badging-current) | current | link/paraphrase; badges/trademarks not copied | badge distinctions; not correctness certification |
| RE16 | [ICMJE AI use](https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html) | current + Jan 2026 annotation | link/paraphrase | disclosure/accountability; field/journal-specific policies still apply |
| RE17 | [FAIR Principles](https://doi.org/10.1038/sdata.2016.18) | 2016-03-15 | CC BY 4.0 | FAIR goals; FAIR not automatically open/ethical/reproducible |

### 3.3 AI Python & Data — PY01–PY12（12）

| ID | Direct evidence | Version / status | Reuse | Supports / boundary |
|---|---|---|---|---|
| PY01 | [Python docs](https://docs.python.org/3/) + [tutorial](https://docs.python.org/3/tutorial/) | 3.14.7, updated 2026-08-25 | PSF-2.0; examples 0BSD | language/library behavior; execution not correctness |
| PY02 | [venv](https://docs.python.org/3/library/venv.html) | 3.14.7 | PSF/0BSD examples | recreatable isolation; non-portable/non-lockfile |
| PY03 | [Jupyter docs](https://docs.jupyter.org/en/latest/) + [Ten Simple Rules](https://doi.org/10.1371/journal.pcbi.1007007) | rolling + 2019 | project licence + CC BY | hidden state/repro practices; no deterministic guarantee |
| PY04 | [pytest](https://docs.pytest.org/en/stable/) + [typing spec](https://typing.python.org/en/latest/spec/) | rolling | MIT/PSF ecosystem terms | testing/types; pass not business correctness |
| PY05 | [NumPy quickstart](https://numpy.org/doc/stable/user/quickstart.html) + [random](https://numpy.org/doc/stable/reference/random/) | stable 2.5 | BSD-3-Clause | arrays/vectorisation/RNG; seed/hardware/version caveats |
| PY06 | [pandas](https://pandas.pydata.org/docs/user_guide/index.html) + [Tidy Data](https://doi.org/10.18637/jss.v059.i10) | 3.0.5 + 2014 | BSD docs; article link/paraphrase | tabular/tidy operations; not universal schema/validity |
| PY07 | [pandas missing](https://pandas.pydata.org/docs/user_guide/missing_data.html) + [Frictionless specs](https://specs.frictionlessdata.io/) | 3.0.5 + rolling | BSD/per-spec | missing/schema validation; not truth or justified imputation |
| PY08 | [NIST e-Handbook](https://www.itl.nist.gov/div898/handbook/) + [SciPy bootstrap](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html) | stable legacy + 1.18 current docs | government-work/BSD | statistics/resampling; assumptions/design still required |
| PY09 | [Matplotlib quick start](https://matplotlib.org/stable/users/explain/quick_start.html) | rolling stable | project licence; original charts | plot API; not honesty/accessibility proof |
| PY10 | [CSVW](https://www.w3.org/TR/2015/REC-tabular-data-model-20151217/) + [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) + [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) | 2015/2017/2022 | W3C/IETF terms | file/API standards; no data completeness/truth guarantee |
| PY11 | [pandas.merge](https://pandas.pydata.org/docs/reference/api/pandas.merge.html) | 3.0.5 | BSD-3-Clause | join semantics/validate; null-key and business-key caveats |
| PY12 | [CEDS v13](https://ceds.ed.gov/cedsdownloads.aspx) + [data model](https://ceds.ed.gov/dataModel.aspx) | current v13 | government-work boundary | education interoperability reference; not local policy/quality certification |

### 3.4 Machine Learning — ML01–ML11（11）

| ID | Direct evidence | Version / status | Reuse | Supports / boundary |
|---|---|---|---|---|
| ML01 | [scikit-learn](https://scikit-learn.org/stable/) + [pitfalls](https://scikit-learn.org/stable/common_pitfalls.html) + [CV](https://scikit-learn.org/stable/modules/cross_validation.html) | 1.9.0, 2026-06 | BSD-3-Clause | splits/pipelines/leakage; dependence-aware design still required |
| ML02 | [Linear models](https://scikit-learn.org/stable/modules/linear_model.html) | 1.9.0 | BSD-3-Clause | OLS/logistic/penalised implementations; no automatic causality/calibration |
| ML03 | [Preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html) | 1.9.0 | BSD-3-Clause | scale/encode/transform; fit in training fold |
| ML04 | [LASSO](https://doi.org/10.1111/j.2517-6161.1996.tb02080.x) | 1996 | publisher copyright; link/paraphrase | L1 shrinkage/selection; no stability/truth guarantee |
| ML05 | [Ensembles](https://scikit-learn.org/stable/modules/ensemble.html) + [Random Forests](https://doi.org/10.1023/A:1010933404324) | 1.9.0 + 2001 | BSD docs; paper link | bagging/forest; no universal superiority/causality |
| ML06 | [Evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html) + [PR paper](https://doi.org/10.1371/journal.pone.0118432) | 1.9.0 + 2015 | BSD + CC BY | metrics under imbalance; context/cost/base rate required |
| ML07 | [Calibration](https://scikit-learn.org/stable/modules/calibration.html) + [threshold](https://scikit-learn.org/stable/modules/classification_threshold.html) + [Guo 2017](https://proceedings.mlr.press/v70/guo17a.html) | 1.9.0 + 2017 | BSD; paper link | calibration/decision separation; held-out and shift caveats |
| ML08 | [Clustering](https://scikit-learn.org/stable/modules/clustering.html) + [DBSCAN](https://aaai.org/papers/kdd96-037-a-density-based-algorithm-for-discovering-clusters-in-large-spatial-databases-with-noise/) | 1.9.0 + 1996 | BSD; paper link | algorithmic grouping; clusters not true human types |
| ML09 | [Outlier detection](https://sklearn.org/stable/modules/outlier_detection.html) + [Isolation Forest](https://doi.org/10.1109/ICDM.2008.17) | 1.9.0 + 2008 | BSD; IEEE link | anomaly/novelty methods; anomaly not harm/fraud proof |
| ML10 | [Matrix Factorization](https://doi.org/10.1109/MC.2009.263) + [NCF](https://arxiv.org/abs/1708.05031) | 2009 + 2017 | link/paraphrase | recommender baselines/method; offline ranking not welfare/universal superiority |
| ML11 | [ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) + [Hidden Technical Debt](https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) | 2017 + 2015 | copyright; link/paraphrase | production-readiness/debt concepts; not certification |

### 3.5 Deep Learning — DL01–DL13（13）

| ID | Direct evidence | Version / status | Reuse | Supports / boundary |
|---|---|---|---|---|
| DL01 | [PyTorch tensors](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html) + [autograd](https://docs.pytorch.org/docs/stable/autograd) | current 2.13 family | BSD project/tutorial code | tensor/graph/autodiff; rolling implementation behavior |
| DL02 | [Backpropagation paper](https://doi.org/10.1038/323533a0) | Nature 1986 | copyright; link/paraphrase | classic learning result; historical, not API/sole-origin claim |
| DL03 | [torch.optim](https://docs.pytorch.org/docs/stable/optim.html) + [Adam](https://arxiv.org/abs/1412.6980) | 2.13 + 2014/2015 | BSD docs; paper link | optimizer implementation/method; no convergence guarantee |
| DL04 | [BatchNorm](https://proceedings.mlr.press/v37/ioffe15.html) + [Dropout](https://www.jmlr.org/papers/v15/srivastava14a.html) | 2015 + 2014 | link/paraphrase | specific normalisation/regularisation methods; case-bounded |
| DL05 | [training tutorial](https://docs.pytorch.org/tutorials/beginner/introyt/trainingyt.html) + [randomness notes](https://docs.pytorch.org/docs/stable/notes/randomness.html) | current 2.13 family | BSD | loop/debug/reproducibility; cross-release/platform not guaranteed |
| DL06 | [LeCun CNN](https://doi.org/10.1109/5.726791) + [ResNet](https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html) | 1998 + 2016 | link/paraphrase | CNN/residual architectures; historical/task-bounded |
| DL07 | [PyTorch transfer tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html) | current 2.13 | BSD tutorial code | freeze/fine-tune pattern; one vision case, no universal positive transfer |
| DL08 | [LSTM](https://doi.org/10.1162/neco.1997.9.8.1735) + [PyTorch sequence tutorial](https://docs.pytorch.org/tutorials/beginner/nlp/sequence_models_tutorial.html) | 1997 + rolling | paper link; code BSD | sequence/gating implementation; not all long dependencies solved |
| DL09 | [Bahdanau attention](https://arxiv.org/abs/1409.0473) | 2014/ICLR 2015 | link/paraphrase | additive attention; attention weights not causal explanations |
| DL10 | [Transformer](https://papers.neurips.cc/paper/7181-attention-is-all-you-need) + [PyTorch tutorial](https://docs.pytorch.org/tutorials/beginner/transformer_tutorial.html) | 2017 + rolling | paper link; code BSD | encoder/decoder/masks; tutorial lifecycle/current variants differ |
| DL11 | [SentencePiece](https://aclanthology.org/D18-2012/) + [BERT](https://aclanthology.org/N19-1423/) | 2018 + 2019 | paper terms/link | tokenisation/pretraining methods; language/data-rights/quality not guaranteed |
| DL12 | [LoRA](https://openreview.net/forum?id=nZeVKeeFYf9) + [PEFT docs](https://huggingface.co/docs/peft/index) | ICLR 2022 + rolling | paper link; PEFT Apache-2.0 code | parameter-efficient adaptation; base model licence/cost/safety remain |
| DL13 | [ImageNet-C robustness](https://arxiv.org/abs/1903.12261) | 2019 | link/paraphrase | corruption benchmark; not complete OOD/safety proof |

### 3.6 Production AI — PA01–PA17（17）

| ID | Direct evidence | Version / status | Reuse | Supports / boundary |
|---|---|---|---|---|
| PA01 | [Google SRE SLOs](https://sre.google/sre-book/service-level-objectives/) | rolling book page | CC BY-NC-ND 4.0; link/paraphrase only | SLI/SLO practice; not SLA/law/universal standard |
| PA02 | [TFX pipelines](https://www.tensorflow.org/tfx/guide/understanding_tfx_pipelines) | page updated 2023-05-09 | docs CC BY 4.0; code Apache-2.0 | DAG components/artifacts; TFX-specific implementation |
| PA03 | [MLMD](https://www.tensorflow.org/tfx/guide/mlmd) | rolling | docs CC BY 4.0; code Apache-2.0 | artifact/execution/event/context lineage; only instrumented state |
| PA04 | [OpenLineage schemas](https://openlineage.io/docs/spec/schemas/) | rolling; site/spec/release may differ | Apache-2.0 project; pin release | lineage event schema; no completeness/rights proof |
| PA05 | [MLflow Tracking](https://mlflow.org/docs/latest/ml/tracking/) | current 3.7-era docs | Apache-2.0 | run metadata/artifacts; tracking not reproducibility guarantee |
| PA06 | [MLflow Registry](https://mlflow.org/docs/latest/ml/model-registry/workflow) | current 3.7-era docs | Apache-2.0 | versions/aliases/workflow; stage not governance approval |
| PA07 | [KServe](https://kserve.github.io/website/) + [v0.18.0](https://github.com/kserve/kserve/releases/tag/v0.18.0) | 0.18.0, 2026-04-29 | Apache-2.0 | Kubernetes serving; platform/API-version bounded |
| PA08 | [TensorFlow Serving config](https://www.tensorflow.org/tfx/serving/serving_config) | rolling | docs CC BY 4.0; code Apache-2.0 | serving/version policy implementation; TF-specific |
| PA09 | [OCI Image Specification](https://specs.opencontainers.org/image-spec/manifest/) | 1.1 family; pin exact release | spec patent terms/OWFa; repo Apache-2.0 | image manifest/interchange; container not sandbox/security proof |
| PA10 | [SLSA v1.2](https://slsa.dev/spec/v1.2/) | released 2025-11-24 | Community Specification 1.0; legacy Apache materials | supply-chain provenance requirements; not vulnerability-free guarantee |
| PA11 | [NIST SSDF v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | final 2022-02; v1.2 initial draft in 2026 | government-work boundary | secure-development practices; draft not final/certification |
| PA12 | [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) | rolling | page/project terms; link/paraphrase | secret lifecycle guidance; implementation/compliance not guaranteed |
| PA13 | [Google canarying](https://sre.google/workbook/canarying-releases/) + [OpenFeature evaluation](https://openfeature.dev/specification/sections/flag-evaluation/) | rolling | SRE CC BY-NC-ND; OpenFeature Apache-2.0 | rollout/flags; canary may miss rare harm, flag not auth |
| PA14 | [OpenTelemetry](https://opentelemetry.io/docs/specs/otel/) + [SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) | OTel 1.60.0 at access + rolling book | Apache-2.0 + CC BY-NC-ND link-only | telemetry/monitoring; signals have separate stability, trace not eval |
| PA15 | [TensorFlow Data Validation](https://research.google/pubs/tensorflow-data-validation-data-analysis-and-validation-in-continuous-ml-pipelines/) | SIGMOD 2020 | copyright; link/paraphrase | anomaly/skew/drift validation; drift not task-quality proof |
| PA16 | [Incident response](https://sre.google/workbook/incident-response/) + [postmortem culture](https://sre.google/sre-book/postmortem-culture/) | rolling | CC BY-NC-ND; link/paraphrase only | coordination/recovery/learning; not statutory notification/undo |
| PA17 | [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) | final 2025-04; Rev.2 withdrawn | government-work boundary | cyber incident response in CSF 2.0 context; sector law still separate |

Index arithmetic: RA 27 + RE 17 + PY 12 + ML 11 + DL 13 + PA 17 = **97 canonical evidence records**.

## 4. Source transformations and rights decisions

| Code | Applied transformation |
|---|---|
| P | Supported claim paraphrased inside the stated boundary and linked directly; no long quotation, layout, media or code copied. |
| V | Versioned normative fact recorded with edition/date/accessed date; implementation must pin the compatible release. |
| C | Original research used only for its stated task, dataset, method or case; no universal superiority inference. |
| O | Open/public-domain material may be adapted only with its exact attribution/licence and third-party exclusions. |
| W | Evidence withheld from public course transformation because rights or source quality is insufficient; replacement is recorded. |
| F | Course-created fixture/diagram: wholly original, synthetic, no real people/institutions, with project-owned rights and explicit licence. |

Special decisions:

- ISO RA26/RA27 are **bibliographic metadata pointers only**. The official pages state ISO copyright restrictions, including restrictions on AI use. No clause, abstract, table, sample, figure or paid text is copied into the course or used to generate a derivative teaching asset.
- Google SRE PA01/PA13/PA14/PA16 are CC BY-NC-ND 4.0; no diagram/table/prose adaptation. Course diagrams begin from stable concepts and are independently designed.
- Academic figures, benchmark screenshots, faces, model outputs and datasets are not imported by default even when the paper is openly readable. A future asset requires a separate row with creator, exact licence, source version, transformation and attribution.
- The wholly synthetic education fixture may be released CC0-1.0 only if no values, schema copyrightable expression, names or records were copied from an external dataset. CEDS concepts may inform interoperability but do not turn copied content into project-owned CC0.

## 5. Replaced, renamed or non-provable current IDs

| Current ID | Required action | Reason |
|---|---|---|
| `system-cards` | Rename to `system-assurance-card` and mark `course-original`; evidence RA03/RA12/RA13 | No universal cross-provider system-card standard established |
| `ai-incident-database` | Remove as core evidence; use RA03/RA02/PA17 | Aggregated incidents cannot establish prevalence/completeness and falls outside first-party contract |
| `data-visualization-society` | Replace with PY09 + RE11 + original accessibility fixture | Community source is not an official/open-standard/original-research anchor |
| `ed-fixture-datasheet` | Rename `course-original-education-fixture`; evidence PY12/RA13 | Internal artifact was incorrectly shaped like an external source |
| `islr` | Replace with ML02/ML04 | Textbook is secondary evidence |
| `stanford-cs229` | Replace with ML03/DL03 | Another course's notes are secondary and must not shape/copy this course |
| `recommender-handbook` | Replace with ML10 | Handbook is secondary; primary MF/NCF sources available |
| `transfer-survey` | Replace with DL07 + controlled original experiment | Survey is secondary and not needed for the bounded module claim |
| `drift-paper` | Rename `tfdv-continuous-validation-paper` and bind PA15 | Current name is unverifiably ambiguous; exact original paper needed |
| `nannyml-docs` | Remove as core evidence; optional tool demo only | Vendor docs are not needed where original TFDV evidence exists |
| `grade-handbook` | Keep ID only if URL resolves to current GRADE Book chapter; store old handbook as `grade-handbook-legacy` | 2013 handbook is being progressively replaced |
| `eu-hleg-human-agency` | Rename or label `eu-hleg-ethics-guidelines-2019-historical` | Nonbinding historical guidance must not appear current-law equivalent |
| `tabula` | Keep only as `tool-example`; add RE06/RE07 | Tool output cannot support extraction-accuracy claim alone |
| `requests-docs` | Keep implementation ID; add PY10 standards | Project docs cannot define HTTP/JSON normatively |
| `dvc-docs` | Keep implementation ID with pinned release; concepts anchored to PA03/PA04 | Rolling product/project positioning and APIs may change |
| `pytorch-transformer` | Fail closed if current tutorial is deprecated/unavailable; use DL10 paper and maintained PyTorch API docs | Tutorial lifecycle is unstable |

No current sourceId remains “unresolved but accepted.” Ambiguous IDs are renamed/replaced above; dynamic IDs remain accepted only with a publish-time pin.

## 6. Verification checklist, counts and remaining gaps

- [x] 66/66 locked modules mapped to stable claims, explicit boundaries and original artifact ideas.
- [x] 132/132 manifest sourceId assignment occurrences audited; these collapse to 114 course-specific resolution rows and 106 globally distinct current IDs, all present in §2.
- [x] 97/97 canonical evidence records indexed with direct URL, status/version, reuse and boundary.
- [x] Course 16 regulatory appendix has official URLs, jurisdiction/scope, version/state, verified date and recheck trigger.
- [x] Every prohibited secondary/vendor/aggregator anchor has a recorded replacement.
- [x] No competitor course content, screenshot, diagram, wording, sequence or exercise was copied.
- [ ] Independent lawyer review is not performed; legal rows remain an official-source index, not legal advice.
- [ ] Dynamic project docs need implementation-level version locks after the final dependency lockfile exists.
- [ ] Multi-OS/GPU reproducibility testing and actual fixture generation are implementation tasks, not completed by this research brief.
- [ ] Asset-by-asset rights audit is unnecessary for the proposed original-only visual plan; it becomes mandatory if external media is later introduced.

Publish-time refresh priorities: EU/Colorado/UK regulation status; NIST AI RMF revision; GRADE Book migration; Fairlearn/scikit-learn/PyTorch/PEFT; MLflow/KServe/OpenFeature/OpenTelemetry; ISO records only if the course continues to show their identifiers.
