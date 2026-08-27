# Course 17 offline mini-review lab

This lab is an executable, offline reference for the Course 17 capstone contract. It uses only original fictional records and three original fictional PDF primary objects. It does not query a bibliographic database, call an API, send research data to a service, or treat a RAG chunk as final evidence.

Run the clean reference pipeline from the repository root:

```bash
python3 public/courses/ai-research/lab/run_mini_review.py --output-dir /tmp/aicourse-ai-research-work
python3 public/courses/ai-research/lab/validate.py --package /tmp/aicourse-ai-research-work/mini-review.generated.json
```

The second command must emit `"ok": true` and validator ID `aicourse.ai-research.validator.v1`. The validator independently checks the fictional corpus, PDF generator, primary-object manifest, three PDF byte hashes and page counts, nine page-level evidence entries, all eight capstone artifacts, reconciled screening flow, three citation corrections, Responsible AI criteria, AI disclosure, and reviewer decision.

Use `mini-review-template.json` as a deliberately incomplete learner starting point. It is expected to fail until all required artifacts and evidence fields are completed. The deterministic runner creates a reference package for inspecting the schema and validator; submitting its reference text unchanged is not evidence of independent learner work.

The PDF pages, not extracted JSON or RAG chunks, are the primary objects for the nine locked page checks. `REC-011` remains a linked correction in the JSON fixture and must be considered alongside `REC-001` before final citation wording.

## Rights and safety boundary

All records, numbers, search receipts, citations, and PDF contents are fictional course-authored material released under CC0 as described in the parent `NOTICE.md`. The PDFs embed subsets of Bitstream Vera fonts; their required licence notice is stored at `public/courses/ai-research/BITSTREAM-VERA-LICENSE.txt`. No output may be cited as real research or used for a factual, causal, educational, legal, clinical, safety, fairness, or policy claim.

## 简体中文

本实验是 Course 17 capstone 合同的离线可执行参考。它只使用课程原创的虚构记录和三份原创虚构 PDF，不访问文献数据库或 API，不上传研究数据，也不允许把 RAG chunk 当作最终证据。

请在仓库根目录依次运行上面的两个命令。验证器会独立核对语料、PDF 生成器、三份 PDF 的字节哈希与页数、九条页级证据、八项 capstone 成果、筛选流、引文修正、Responsible AI 条件、AI 披露与复核决定。`mini-review-template.json` 是故意不完整的学习者起点；只有补齐全部证据合同后才应通过。
