import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { AiPythonDataSourceId } from "./sources";

export const AI_PYTHON_DATA_CAPSTONE_VERSION = "2026.08.26-capstone-v1";

export const AI_PYTHON_DATA_CAPSTONE_ARTIFACTS = [
  {
    id: "environment-receipt",
    sourceIds: ["python-venv", "jupyter-docs", "notebook-reproducibility"],
    copy: {
      en: { title: "Environment receipt", description: "Python and package versions, reconstruction command, random-state policy, fixture checksum, clean-run command, platform notes, and the exact/tolerance reproducibility claim." },
      zhHans: { title: "环境收据", description: "Python 与包版本、重建命令、随机状态政策、fixture 校验和、全新运行命令、平台说明，以及精确或容差可复现声明。" },
    },
  },
  {
    id: "executable-notebook",
    sourceIds: ["jupyter-docs", "notebook-reproducibility", "pytest-docs"],
    copy: {
      en: { title: "Executable analysis notebook", description: "An ordered notebook that runs from a fresh kernel without manual intervention, reads only declared inputs, writes only versioned outputs, and surfaces failed checks." },
      zhHans: { title: "可执行分析 notebook", description: "从全新内核无需人工干预即可顺序运行、只读取已声明输入、只写入版本化输出并显式显示失败检查的 notebook。" },
    },
  },
  {
    id: "data-dictionary",
    sourceIds: ["tidy-data-paper", "pandas-tabular", "ceds-v13"],
    copy: {
      en: { title: "Data dictionary and grain contract", description: "One row's meaning, candidate and final keys, field definitions, types, units, categories, allowed missingness, synthetic-data boundary, and mappings that are explicitly not claimed." },
      zhHans: { title: "数据字典与粒度合同", description: "一行的含义、候选与最终键、字段定义、类型、单位、类别、允许缺失、合成数据边界，以及明确不作声明的映射。" },
    },
  },
  {
    id: "cleaning-ledger",
    sourceIds: ["pandas-missing", "frictionless-specs"],
    copy: {
      en: { title: "Cleaning and provenance ledger", description: "Raw profile, immutable input receipt, missingness classifications, deterministic rules, row-level changes, reasons, rule versions, unresolved defects, and transformed-output checksum." },
      zhHans: { title: "清洗与来源台账", description: "原始概况、不可变输入收据、缺失分类、确定性规则、行级修改、理由、规则版本、未解决缺陷与转换输出校验和。" },
    },
  },
  {
    id: "validation-report",
    sourceIds: ["pytest-docs", "typing-spec", "pandas-merge"],
    copy: {
      en: { title: "Validation and test report", description: "Schema, key, range, category, join-cardinality, row-reconciliation, numerical-tolerance, normal-path, and expected-failure checks with commands and results." },
      zhHans: { title: "验证与测试报告", description: "模式、键、范围、类别、连接基数、行数核对、数值容差、正常路径与预期失败检查及其命令和结果。" },
    },
  },
  {
    id: "statistical-note",
    sourceIds: ["nist-statistics", "scipy-bootstrap", "numpy-arrays-random"],
    copy: {
      en: { title: "Statistical note", description: "Observed sample and target definitions, denominators, missingness, distribution-aware summaries, bootstrap design, reproducible interval, assumptions, limitations, and prohibited population claims." },
      zhHans: { title: "统计说明", description: "观测样本与目标定义、分母、缺失、适合分布的汇总、bootstrap 设计、可复现区间、假设、限制与禁止的总体声明。" },
    },
  },
  {
    id: "visual-report",
    sourceIds: ["matplotlib-quickstart", "nist-statistics"],
    copy: {
      en: { title: "Accessible visual report", description: "An original chart with reconstructable values, labels, units, denominator, counts, uncertainty or variability note, missingness, color-independent cues, alt text, and a diagnosed misleading alternative." },
      zhHans: { title: "无障碍可视报告", description: "包含可重建数值、标签、单位、分母、数量、不确定性或变异说明、缺失、不依赖颜色线索、替代文本，以及经诊断误导替代版的原创图表。" },
    },
  },
  {
    id: "provenance-manifest",
    sourceIds: ["frictionless-specs", "csvw-recommendation", "json-rfc8259", "ceds-v13"],
    copy: {
      en: { title: "Provenance manifest and bounded audit memo", description: "Versioned inventory of inputs, outputs, authorship, licences, checksums, transformations, evidence links, verified observations, assumptions, unresolved issues, non-claims, and reviewer attestation." },
      zhHans: { title: "来源清单与有边界审计备忘录", description: "输入、输出、作者、许可、校验和、转换、证据链接、已验证观察、假设、未解决问题、非声明与审查者签署的版本化清单。" },
    },
  },
] as const satisfies CourseKitNonEmpty<
  CourseKitCapstoneArtifactAuthoringSeed<string, AiPythonDataSourceId>
>;

export type AiPythonDataCapstoneArtifactId =
  (typeof AI_PYTHON_DATA_CAPSTONE_ARTIFACTS)[number]["id"];

export const AI_PYTHON_DATA_CAPSTONE = {
  schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  version: AI_PYTHON_DATA_CAPSTONE_VERSION,
  artifacts: AI_PYTHON_DATA_CAPSTONE_ARTIFACTS.map((artifact) => ({
    id: artifact.id,
    sourceIds: artifact.sourceIds,
    required: true as const,
  })) as unknown as CourseKitCapstone<
    AiPythonDataCapstoneArtifactId,
    AiPythonDataSourceId
  >["artifacts"],
  evidenceContract: {
    schemaId: "aicourse.ai-python-data.capstone.v1",
    schemaPath: "/courses/ai-python-data/lab/capstone.schema.json",
    validatorId: "aicourse.ai-python-data.validator.v1",
    validatorPath: "/courses/ai-python-data/lab/validate.py",
    validatorCommand: "python public/courses/ai-python-data/lab/validate.py --package <artifact-package.json>",
  },
} satisfies CourseKitCapstone<AiPythonDataCapstoneArtifactId, AiPythonDataSourceId>;
