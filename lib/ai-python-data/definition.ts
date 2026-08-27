import { buildCourseKitDefinition } from "../course-kit/authoring";
import {
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
  RESPONSIBLE_AI_RUBRIC_VERSION,
} from "../course-kit/responsible-ai-rubric";
import {
  AI_PYTHON_DATA_CAPSTONE_ARTIFACTS,
  AI_PYTHON_DATA_CAPSTONE_VERSION,
  type AiPythonDataCapstoneArtifactId,
} from "./capstone";
import {
  AI_PYTHON_DATA_MODULES,
  type AiPythonDataModuleSlug,
  type AiPythonDataPhaseId,
} from "./modules";
import {
  AI_PYTHON_DATA_QUESTION_BANK,
  AI_PYTHON_DATA_QUIZ_VERSION,
  type AiPythonDataQuestionId,
} from "./quiz";
import {
  AI_PYTHON_DATA_SOURCE_SEEDS,
  type AiPythonDataSourceId,
} from "./sources";

export const AI_PYTHON_DATA_COURSE = buildCourseKitDefinition<
  "ai-python-data",
  AiPythonDataModuleSlug,
  AiPythonDataPhaseId,
  AiPythonDataSourceId,
  AiPythonDataQuestionId,
  AiPythonDataCapstoneArtifactId
>({
  manifest: {
    id: "ai-python-data",
    version: "2026.08.26-v1",
    displayNumber: 18,
    publishedOn: "2026-08-26",
    milestoneCount: 12,
    phases: [
      {
        id: "reproducible-foundations",
        copy: {
          en: { title: "Reproducible foundations", summary: "Control execution, state, interfaces, failures, environments, and evidence before manipulating data." },
          zhHans: { title: "可复现基础", summary: "在操作数据前，先控制执行、状态、接口、失败、环境与证据。" },
        },
      },
      {
        id: "tabular-engineering",
        copy: {
          en: { title: "Tabular engineering", summary: "Move from arrays to tidy tables, explicit data contracts, deterministic cleaning, and preserved provenance." },
          zhHans: { title: "表格数据工程", summary: "从数组进阶到整洁表、显式数据合同、确定性清洗与保留来源。" },
        },
      },
      {
        id: "analysis-and-pipelines",
        copy: {
          en: { title: "Analysis and pipelines", summary: "Make statistics, charts, formats, APIs, joins, and output packages reconstructable and bounded." },
          zhHans: { title: "分析与管线", summary: "使统计、图表、格式、API、连接与输出包可重建且有明确边界。" },
        },
      },
      {
        id: "capstone-audit",
        copy: {
          en: { title: "Capstone audit", summary: "Integrate the workflow into an eight-artifact education-data audit that refuses unsupported real-world claims." },
          zhHans: { title: "毕业审计", summary: "把完整流程整合为八产物教育数据审计，并拒绝不受支持的现实声明。" },
        },
      },
    ],
  },
  sources: AI_PYTHON_DATA_SOURCE_SEEDS,
  modules: AI_PYTHON_DATA_MODULES,
  courseCopy: {
    en: {
      meta: {
        title: "AI Python, Jupyter and Data Foundations",
        kicker: "Course 18 · Evidence-first Python and data practice",
        summary: "Learn Python, NumPy, pandas, testing, statistics, visualization, files, APIs, and joins by building a reproducible audit trail around a fixed fictional education dataset.",
        audience: "Learners who want a rigorous bridge from basic programming to auditable data work for AI and research.",
        prerequisite: "No previous Python course is required. Comfort using files and a terminal is helpful; every dataset in the course is synthetic.",
        level: "Foundational to intermediate",
        duration: "600 minutes across 10 modules, a 12-question final draw, and an eight-artifact capstone",
        evidenceNote: "Software behavior is version-pinned where possible. Stable statistical concepts, current API behavior, and instructional synthesis are labeled separately; external sources are linked and paraphrased rather than copied.",
      },
      principles: [
        "Preserve raw inputs and record checksums before transforming data.",
        "Make state, randomness, units, row grain, missingness, and side effects explicit.",
        "Treat tests, schemas, statistics, and charts as bounded evidence rather than universal proof.",
        "Separate parsing, structural validity, semantic validity, provenance, and permission.",
        "Refuse population, causal, privacy, or deployment claims that the synthetic fixture cannot support.",
      ],
      outcomes: [
        "Rebuild and verify an isolated Python notebook environment.",
        "Write small functions with explicit interfaces and side-effect boundaries.",
        "Diagnose failures with types, tests, expected exceptions, and minimized reproducers.",
        "Use NumPy arrays with explicit shape, dtype, axis, masks, and tolerances.",
        "Construct a tidy pandas table with declared grain, keys, variables, and units.",
        "Clean missing and inconsistent data without erasing provenance or uncertainty.",
        "Report descriptive statistics and bootstrap uncertainty within sampling boundaries.",
        "Create accessible original charts with visible denominators and transformations.",
        "Validate formats, API/file receipts, keys, join cardinality, and versioned outputs.",
        "Deliver a clean-running eight-artifact education-data audit dossier.",
      ],
      quiz: {
        title: "AI Python & Data final assessment",
        intro: "A deterministic 12-question draw is selected from a 30-question bilingual bank. Score at least 10 and answer every selected critical question correctly.",
      },
      capstone: {
        title: "Synthetic education-data audit dossier",
        intro: "Audit the fixed, original fictional fixture. The goal is traceability and bounded reasoning—not a claim about any real learner, institution, or deployable decision system.",
        instructions: [
          "Verify the fixture and schema checksums against the versioned provenance record before analysis.",
          "Complete all eight artifacts with commands, inputs, outputs, checks, assumptions, unresolved issues, and non-claims visible.",
          "Run the notebook from a fresh environment without network access and reconcile its output checksums.",
          "Have a reviewer challenge one cleaning rule, one statistical assumption, one chart choice, and one unsupported real-world claim before attesting.",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
        attestation: "I verified a clean run against the fixed fictional fixture, traced each submitted claim to an artifact, listed unresolved issues, and did not represent this work as evidence about real people or as deployment authorization.",
      },
    },
    zhHans: {
      meta: {
        title: "AI Python、Jupyter 与数据基础",
        kicker: "课程 18 · 证据优先的 Python 与数据实践",
        summary: "围绕固定虚构教育数据集建立可复现审计轨迹，在实践中学习 Python、NumPy、pandas、测试、统计、可视化、文件、API 与连接。",
        audience: "希望从基础编程严谨过渡到可审查 AI 与研究数据工作的学习者。",
        prerequisite: "无需先修 Python 课程；熟悉文件与终端会有帮助。课程中的全部数据均为合成数据。",
        level: "基础至中级",
        duration: "10 个模块共 600 分钟，另含 12 题固定抽题终测与八产物毕业项目",
        evidenceNote: "软件行为尽可能钉住版本；稳定统计概念、当前 API 行为与教学综合分别标注；外部来源只链接和改写，不复制。",
      },
      principles: [
        "转换前保留原始输入并记录校验和。",
        "显式说明状态、随机性、单位、行粒度、缺失与副作用。",
        "把测试、模式、统计与图表视为有边界证据，而非普遍证明。",
        "分开解析、结构有效性、语义有效性、来源与许可。",
        "拒绝合成 fixture 无法支持的总体、因果、隐私或部署声明。",
      ],
      outcomes: [
        "重建并验证隔离的 Python notebook 环境。",
        "编写具有显式接口与副作用边界的小函数。",
        "用类型、测试、预期异常与最小复现器诊断失败。",
        "在显式形状、类型、轴、掩码与容差下使用 NumPy 数组。",
        "构建具有已声明粒度、键、变量与单位的整洁 pandas 表。",
        "清洗缺失与不一致数据，同时不抹去来源或不确定性。",
        "在抽样边界内报告描述统计与 bootstrap 不确定性。",
        "制作具有可见分母与转换的无障碍原创图表。",
        "验证格式、API/文件收据、键、连接基数与版本化输出。",
        "交付可全新运行的八产物教育数据审计档案。",
      ],
      quiz: {
        title: "AI Python 与数据终测",
        intro: "系统从 30 道双语题中确定性抽取 12 题。至少答对 10 题，并答对所有被抽中的关键题。",
      },
      capstone: {
        title: "合成教育数据审计档案",
        intro: "审计固定原创虚构 fixture。目标是可追溯性与有边界推理，而不是关于真实学习者、机构或可部署决策系统的声明。",
        instructions: [
          "分析前按版本化 provenance 记录验证 fixture 与 schema 校验和。",
          "完成全部八项产物，使命令、输入、输出、检查、假设、未解决问题与非声明可见。",
          "在无网络的全新环境中运行 notebook，并核对输出校验和。",
          "签署前请审查者挑战一项清洗规则、一项统计假设、一项图表选择与一项不受支持的现实声明。",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
        attestation: "我已针对固定虚构 fixture 验证全新运行，把每项提交声明追溯到产物，列出未解决问题，并且没有把本工作表述为关于真实人的证据或部署授权。",
      },
    },
  },
  quiz: {
    version: AI_PYTHON_DATA_QUIZ_VERSION,
    questions: AI_PYTHON_DATA_QUESTION_BANK,
  },
  capstone: {
    version: AI_PYTHON_DATA_CAPSTONE_VERSION,
    artifacts: AI_PYTHON_DATA_CAPSTONE_ARTIFACTS,
    responsibleAiGate: {
      version: RESPONSIBLE_AI_RUBRIC_VERSION,
      criteria: [
        { id: "purpose-risk-stop", questionIds: ["q-visualisation-honest-charts-boundary"], artifactIds: ["visual-report"] },
        { id: "data-rights-minimisation", questionIds: ["q-cleaning-missingness-validation-provenance-boundary"], artifactIds: ["data-dictionary", "provenance-manifest"] },
        { id: "subgroups-uncertainty", questionIds: ["q-visualisation-honest-charts-boundary"], artifactIds: ["statistical-note", "visual-report"] },
        { id: "human-authority-recourse", questionIds: ["q-tests-errors-types-debugging-core"], artifactIds: ["validation-report"] },
        { id: "challenge-incident-recovery", questionIds: ["q-files-apis-joins-reproducible-pipelines-core"], artifactIds: ["cleaning-ledger", "validation-report"] },
        { id: "evidence-decision-expiry", questionIds: ["q-environment-notebooks-seeds-reproducibility-boundary"], artifactIds: ["environment-receipt", "executable-notebook", "provenance-manifest"] },
      ],
    },
  },
});
