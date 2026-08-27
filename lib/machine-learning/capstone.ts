import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { MachineLearningSourceId } from "./sources";

export const MACHINE_LEARNING_CAPSTONE_VERSION = "2026.08.26-capstone-v1";

export const MACHINE_LEARNING_CAPSTONE_ARTIFACTS = [
  {
    id: "problem-split-contract",
    sourceIds: ["sklearn-pitfalls-cv", "ml-test-score"],
    copy: {
      en: { title: "Problem and split contract", description: "Decision owner, prediction unit and time, target horizon, feature-availability ledger, group and temporal boundaries, partition hashes, baseline, metrics, capacity, human authority, and no-deployment scope." },
      zhHans: { title: "问题与切分合同", description: "决策负责人、预测单元与时点、目标范围、特征可用性台账、群组与时间边界、分区哈希、基线、指标、容量、人类权限与不可部署范围。" },
    },
  },
  {
    id: "baseline-experiment",
    sourceIds: ["sklearn-linear-models", "sklearn-metrics", "sklearn-pitfalls-cv"],
    copy: {
      en: { title: "Baseline experiment", description: "Prevalence or mean baseline, simple rule, linear or logistic baseline, identical partitions, explicit loss and metrics, residual or confusion diagnostics, and reasons a complex model must improve on them." },
      zhHans: { title: "基线实验", description: "流行率或均值基线、简单规则、线性或逻辑基线、相同分区、显式损失与指标、残差或混淆诊断，以及复杂模型必须改进它们的理由。" },
    },
  },
  {
    id: "reproducible-pipeline",
    sourceIds: ["sklearn-preprocessing", "sklearn-pitfalls-cv", "hidden-technical-debt"],
    copy: {
      en: { title: "Reproducible feature and model pipeline", description: "Clean offline run, environment and input checksums, training-only learned transformations, fixed random states, serialized configuration, tests, rerun command, outputs, and tolerance policy." },
      zhHans: { title: "可复现特征与模型管线", description: "全新离线运行、环境与输入校验和、仅训练数据的学习型转换、固定随机状态、序列化配置、测试、重跑命令、输出与容差政策。" },
    },
  },
  {
    id: "model-comparison",
    sourceIds: ["lasso-paper", "sklearn-ensembles", "random-forest-paper", "sklearn-pitfalls-cv"],
    copy: {
      en: { title: "Controlled model comparison", description: "Predeclared candidates and search budget, learning curves, repeated validation, regularization and ensemble comparisons, stability, complexity, latency, ablations, frozen selection rule, and one-shot holdout result." },
      zhHans: { title: "受控模型比较", description: "预声明候选与搜索预算、学习曲线、重复验证、正则化与集成比较、稳定性、复杂度、延迟、消融、冻结选择规则与一次性留出结果。" },
    },
  },
  {
    id: "metrics-calibration",
    sourceIds: ["sklearn-metrics", "precision-recall-paper", "sklearn-calibration-threshold", "calibration-paper"],
    copy: {
      en: { title: "Metrics, calibration, and threshold review", description: "Prevalence, raw counts, ROC and precision-recall evidence, probability metrics, reliability bins with uncertainty, validation-only threshold tuning, capacity and cost table, frozen threshold, and final result." },
      zhHans: { title: "指标、校准与阈值审查", description: "基率、原始数量、ROC 与精确率-召回率证据、概率指标、带不确定性的可靠性分箱、仅验证集阈值调参、容量成本表、冻结阈值与最终结果。" },
    },
  },
  {
    id: "subgroup-error-audit",
    sourceIds: ["sklearn-metrics", "model-cards-paper", "nist-ai-rmf"],
    copy: {
      en: { title: "Subgroup and error audit", description: "Predeclared fictional slices, sample counts, uncertainty, calibration and error rates, reproducibly sampled false positives and false negatives, blinded taxonomy, reviewer disagreements, unresolved cases, and prohibited fairness claims." },
      zhHans: { title: "子群与错误审计", description: "预声明虚构切片、样本数量、不确定性、校准与错误率、可复现抽样假阳性和假阴性、盲法分类、审查分歧、未解决案例与禁止的公平声明。" },
    },
  },
  {
    id: "model-card",
    sourceIds: ["model-cards-paper", "ml-test-score", "hidden-technical-debt"],
    copy: {
      en: { title: "Evidence-linked model card", description: "Intended and excluded uses, users, data and label boundaries, evaluation conditions, baselines, metrics, slices, limitations, dependencies, human oversight, expiry triggers, and a file-level evidence link for every material claim." },
      zhHans: { title: "证据链接模型卡", description: "预期与排除用途、用户、数据和标签边界、评价条件、基线、指标、切片、限制、依赖、人类监督、到期触发器，以及每项重大声明的文件级证据链接。" },
    },
  },
  {
    id: "no-deploy-review",
    sourceIds: ["nist-ai-rmf", "ml-test-score", "model-cards-paper", "sklearn-pitfalls-cv"],
    copy: {
      en: { title: "Independent no-deploy review", description: "Reviewer identity and independence, injected leakage or provenance challenge, gate outcomes, residual risks, missing legal and population evidence, required human authority and appeal, explicit prohibited uses, and signed no-deploy decision." },
      zhHans: { title: "独立不可部署审查", description: "审查者身份与独立性、注入的泄漏或来源挑战、门结果、残余风险、缺失的法律与总体证据、必需人类权限与申诉、明确禁止用途及签署不可部署决定。" },
    },
  },
] as const satisfies CourseKitNonEmpty<
  CourseKitCapstoneArtifactAuthoringSeed<string, MachineLearningSourceId>
>;

export type MachineLearningCapstoneArtifactId =
  (typeof MACHINE_LEARNING_CAPSTONE_ARTIFACTS)[number]["id"];

export const MACHINE_LEARNING_CAPSTONE = {
  schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  version: MACHINE_LEARNING_CAPSTONE_VERSION,
  artifacts: MACHINE_LEARNING_CAPSTONE_ARTIFACTS.map((artifact) => ({
    id: artifact.id,
    sourceIds: artifact.sourceIds,
    required: true as const,
  })) as unknown as CourseKitCapstone<
    MachineLearningCapstoneArtifactId,
    MachineLearningSourceId
  >["artifacts"],
  evidenceContract: {
    schemaId: "aicourse.machine-learning.capstone.v1",
    schemaPath: "/courses/machine-learning/lab/capstone.schema.json",
    validatorId: "aicourse.machine-learning.validator.v1",
    validatorPath: "/courses/machine-learning/lab/validate.py",
    validatorCommand: "python public/courses/machine-learning/lab/validate.py --package <artifact-package.json>",
  },
} satisfies CourseKitCapstone<
  MachineLearningCapstoneArtifactId,
  MachineLearningSourceId
>;
