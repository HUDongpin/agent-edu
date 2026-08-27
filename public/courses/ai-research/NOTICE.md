# AI Research fictional mini-review corpus and lab

Notice version: `ai-research-notice.v2`  
Fixture version: `ai-research-mini-review-corpus.v1`  
Issued: 2026-08-26

`mini-review-corpus-synthetic-v1.json`, the three `primary/REC-*.pdf` files, and the lab's example/template records were written specifically for aicourse.top. Every study, author label, title, abstract, search receipt, database name, interface version, participant count, statistic, quotation, locator, correction, screening hint, citation case, page, table, and date is fictional. No research item was sampled, paraphrased, transformed, scraped, generated from, or otherwise derived from an actual publication, bibliographic database, benchmark, model output, or competing course. Local `REC-*` identifiers are not DOIs, registrations, repository handles, or journal records.

The original fictional fixture data, PDF content/layout, and JSON example/template data are dedicated to the public domain under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). The dedication does not change the licence of repository software, lab code, course prose, cited standards, official guidance, research articles, names of open formats, or linked websites.

The PDFs were generated locally by `scripts/generate-ai-research-primary-pdfs.py` in ReportLab invariant mode and contain embedded, unmodified subsets of Bitstream Vera. The font software is not CC0: it remains under the Bitstream Vera licence reproduced in `BITSTREAM-VERA-LICENSE.txt`. The PDFs contain no real person, participant, account, institution, publication, identifier, or research datum. Their checked hashes, page counts, generator hash, locator boundaries, and font licence are recorded in `lab-provenance.v1.json` and `lab/primary-object-manifest.json`.

The fixture and PDFs support protocol locking, reproducible search logging, deduplication, screening, claim-source ledgers, page/table extraction, correction tracking, citation verification, quantitative and qualitative boundary exercises, and AI-use disclosure. They are not a real evidence base and must never be cited, pooled, graded, or used to make a factual, causal, clinical, educational, legal, or policy claim. Screening hints are authored self-check aids, not independent-review decisions. RAG chunks and extracted JSON are locators only; final evidence must return to the locked PDF page, table, data object, or code receipt.

See `provenance.v1.json` and `lab-provenance.v1.json` for byte-level checksums, rights assertions, creation methods, and non-claims. `lab/validate.py` rejects missing or changed PDF bytes, page-count drift, incomplete capstone artifacts, unreviewed claims, and any attempt to use a RAG chunk as final evidence.

## 简体中文说明

`mini-review-corpus-synthetic-v1.json`、三份 `primary/REC-*.pdf` 以及实验包的示例/模板均为 aicourse.top 原创教学材料。文件中的研究、作者标签、标题、摘要、检索收据、数据库名称、接口版本、样本量、统计值、引语、定位信息、勘误、筛选提示、引文案例、页面、表格与日期均属虚构；没有任何研究条目取样、转述、转换、抓取或生成自真实出版物、文献数据库、基准、模型输出或竞争课程。`REC-*` 仅是本地编号，并非 DOI、注册号、仓储标识或期刊记录。

原创虚构 fixture 数据、PDF 内容与版式、JSON 示例和模板按 [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) 贡献至公有领域。该贡献不改变仓库软件、实验代码、课程正文、所引标准、官方指引、研究论文、开放格式名称或外部链接各自的许可。PDF 内嵌未修改的 Bitstream Vera 字体子集；字体软件不属于 CC0，继续遵循仓库内 `BITSTREAM-VERA-LICENSE.txt` 所载许可。

这套语料只用于协议锁定、可复现检索日志、去重、筛选、主张—来源台账、逐页/逐表抽取、勘误追踪、引文核验、定量与定性边界以及 AI 使用披露练习。RAG chunk 与预抽取 JSON 只能用作定位器，最终证据必须返回固定 PDF 页面、表格、数据或代码收据。它不是真实证据库，绝不可被引用、汇总、评级，或用于支持事实、因果、临床、教育、法律或政策主张；其中筛选提示是原创自检辅助，不是独立复核结论。
