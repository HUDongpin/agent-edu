import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { AiResearchSourceId } from "./sources";

export const AI_RESEARCH_CAPSTONE_VERSION = "2026.08.26-capstone-v1";

export const AI_RESEARCH_CAPSTONE_ARTIFACTS = [
  { id: "protocol", sourceIds: ["osf-preregistration", "prisma-2020"], copy: { en: { title: "Protocol and deviation log", description: "Question, unit, scope, eligibility, search, screening, extraction, appraisal, synthesis, analysis, stopping rules, version history, and prospective deviation fields." }, zhHans: { title: "协议与偏离日志", description: "问题、单位、范围、资格、检索、筛选、抽取、评估、综合、分析、停止规则、版本历史与前瞻偏离字段。" } } },
  { id: "search-log", sourceIds: ["prisma-search", "cochrane-search"], copy: { en: { title: "Search strategy and receipts", description: "Concept blocks, translated database syntax, platform and database, fields, limits, run time, result count, export format, file hash, update search, and logged AI-suggested terms." }, zhHans: { title: "检索策略与收据", description: "概念块、数据库语法转换、平台和数据库、字段、限制、运行时间、结果数、导出格式、文件哈希、更新检索与有日志的 AI 候选词。" } } },
  { id: "inclusion-exclusion-ledger", sourceIds: ["prisma-2020", "cochrane-selection"], copy: { en: { title: "Inclusion and exclusion ledger", description: "Stable record IDs, source lineage, duplicate clusters, independent decisions, protocol-aligned reasons, conflicts, adjudication, full-text status, and reconciled flow counts." }, zhHans: { title: "纳入与排除台账", description: "稳定记录 ID、来源 lineage、重复簇、独立决定、符合协议的理由、冲突、裁决、全文状态与核对后的流程数量。" } } },
  { id: "claim-evidence-matrix", sourceIds: ["grade-book-current", "cochrane-bias"], copy: { en: { title: "Claim–evidence matrix", description: "Atomic claim IDs, source and locator, design, result, risk of bias, directness, uncertainty, reporting gaps, counterevidence, allowed wording, and reviewer status." }, zhHans: { title: "主张—证据矩阵", description: "原子主张 ID、来源与定位、设计、结果、偏倚风险、直接性、不确定性、报告缺口、反证、允许措辞与评审状态。" } } },
  { id: "extraction-sheet", sourceIds: ["cochrane-data-collection", "pdf-2-spec", "grobid-evaluation"], copy: { en: { title: "Extraction sheet and verification log", description: "Schema, verbatim and normalised values, page/table/row/column/footnote locators, units, missing codes, derived calculations, code, verifier, disagreement, and extraction-error status." }, zhHans: { title: "抽取表与核验日志", description: "schema、原文与规范化值、页/表/行/列/脚注定位、单位、缺失编码、派生计算、代码、核验人、分歧与抽取错误状态。" } } },
  { id: "analysis-reproduction-package", sourceIds: ["asa-pvalues", "tidy-data", "entreq", "coreq", "srqr", "acm-artifact-review", "fair-principles"], copy: { en: { title: "Analysis and reproduction package", description: "Estimands or analytic objects, assumptions, scripts, environment, data or lawful-access instructions, outputs, diagnostics, sensitivity analyses, qualitative audit trail, README, checksums, and clean-run result." }, zhHans: { title: "分析与复现包", description: "estimand 或分析对象、假设、脚本、环境、数据或合法访问说明、输出、诊断、敏感性分析、定性审计轨迹、README、校验和与洁净运行结果。" } } },
  { id: "citation-audit", sourceIds: ["crossref-rest", "niso-jats", "rag-original"], copy: { en: { title: "Citation and primary-source audit", description: "Bibliographic identity, persistent identifier, exact claim, primary locator, quotation check, supported wording, boundary, access status, version conflict, and RAG-locator rejection log." }, zhHans: { title: "引文与一手来源审计", description: "书目身份、持久标识、准确主张、一手定位、引文核对、支持措辞、边界、访问状态、版本冲突与被拒 RAG 定位日志。" } } },
  { id: "ai-disclosure-failure-log", sourceIds: ["icmje-ai", "acm-artifact-review", "fair-principles"], copy: { en: { title: "AI disclosure, uncertainty, and failure log", description: "Tool and version where known, date, task, input boundary, output use, human verification, rejected outputs, confidentiality boundary, unresolved access, extraction and reproduction failures, and non-claims." }, zhHans: { title: "AI 披露、不确定性与失败日志", description: "已知工具与版本、日期、任务、输入边界、输出用途、人工核验、被拒输出、保密边界、未解决访问/抽取/复现失败与非声明。" } } },
] as const satisfies CourseKitNonEmpty<CourseKitCapstoneArtifactAuthoringSeed<string, AiResearchSourceId>>;

export type AiResearchCapstoneArtifactId = (typeof AI_RESEARCH_CAPSTONE_ARTIFACTS)[number]["id"];

export const AI_RESEARCH_CAPSTONE = {
  schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  version: AI_RESEARCH_CAPSTONE_VERSION,
  artifacts: AI_RESEARCH_CAPSTONE_ARTIFACTS.map((artifact) => ({ id: artifact.id, sourceIds: artifact.sourceIds, required: true as const })) as unknown as CourseKitCapstone<AiResearchCapstoneArtifactId, AiResearchSourceId>["artifacts"],
  evidenceContract: {
    schemaId: "aicourse.ai-research.capstone.v1",
    schemaPath: "/courses/ai-research/lab/capstone.schema.json",
    validatorId: "aicourse.ai-research.validator.v1",
    validatorPath: "/courses/ai-research/lab/validate.py",
    validatorCommand: "python public/courses/ai-research/lab/validate.py --package <artifact-package.json>",
  },
} satisfies CourseKitCapstone<AiResearchCapstoneArtifactId, AiResearchSourceId>;
